// Leitura completa e coerente para cálculo (D13 do ciclo 004).
//
// Completa: a Data API corta cada consulta em max_rows (1.000, supabase/config.toml) sem erro.
// lerTudo pagina em ordem total pelas chaves reais de cada tabela até uma página incompleta e
// confere o total contra a contagem exata; falha de página ou contagem divergente é erro.
//
// Coerente: páginas e consultas sucessivas podem ver estados diferentes do banco. A unidade de
// coerência é a composição de uma tela: lerComposicao lê as marcas de versão antes da primeira
// leitura de insumos e de novo depois da última, e só aceita o conjunto se forem iguais. Marca
// diferente descarta todos os insumos e repete, até 3 tentativas; depois, erro recuperável.
// As marcas usam só colunas existentes, alteradas pelas mesmas transações que mudam os insumos.

import type { SupabaseClient } from "@supabase/supabase-js";

export const TAMANHO_PAGINA = 1000;
export const TENTATIVAS = 3;
export const MENSAGEM_DADOS_MUDARAM = "Os dados mudaram durante a leitura. Tente novamente.";

/** Ordem total de cada tabela pelas chaves reais do schema (a RLS ou o filtro restringe o resto). */
export const ORDENS = {
  eventos: ["data", "id"],
  ativos: ["id"],
  transferencias: ["id"],
  consolidados_mensais: ["mes"],
  posicoes_mensais: ["mes", "ativo_id"],
  valores_benchmark: ["benchmark_id", "data"],
  coberturas_benchmark: ["benchmark_id"],
  benchmarks: ["id"],
} as const satisfies Record<string, readonly string[]>;

export type Tabela = keyof typeof ORDENS;

export class ErroLeitura extends Error {
  constructor(
    readonly motivo: "pagina" | "contagem" | "mudou",
    detalhe = "",
  ) {
    super(`leitura: ${motivo}${detalhe ? ` (${detalhe})` : ""}`);
    this.name = "ErroLeitura";
  }
}

interface Resposta<T> {
  data: T[] | null;
  error: { message: string } | null;
  count: number | null;
}

/** Uma página [de, ate], inclusiva, com a contagem exata do conjunto. */
export type Pagina<T> = (de: number, ate: number) => PromiseLike<Resposta<T>>;

export interface OpcoesLeitura {
  tamanho?: number;
  /** Só para testes: executado depois de cada página lida. */
  aposPagina?: (indice: number) => Promise<void>;
}

/** Todas as linhas, ou ErroLeitura; nunca parte delas. */
export async function lerTudo<T>(pagina: Pagina<T>, opcoes: OpcoesLeitura = {}): Promise<T[]> {
  const tamanho = opcoes.tamanho ?? TAMANHO_PAGINA;
  const linhas: T[] = [];
  let total: number | null = null;
  for (let indice = 0; ; indice++) {
    const { data, error, count } = await pagina(indice * tamanho, (indice + 1) * tamanho - 1);
    if (error || !data) throw new ErroLeitura("pagina", error?.message);
    if (count === null) throw new ErroLeitura("contagem", "sem contagem exata");
    if (total === null) total = count;
    else if (count !== total) throw new ErroLeitura("contagem", `${total} → ${count}`);
    linhas.push(...data);
    await opcoes.aposPagina?.(indice);
    if (data.length < tamanho) break;
  }
  if (linhas.length !== total) throw new ErroLeitura("contagem", `${linhas.length} de ${total}`);
  return linhas;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- o cliente não tem tipos gerados do schema */
type Consulta = any;
export type Cliente = Pick<SupabaseClient, "from">;

/** Lê uma tabela inteira, na ordem declarada em ORDENS, com filtro opcional. */
export function lerTabela<T>(
  cliente: Cliente,
  tabela: Tabela,
  { colunas = "*", filtrar, ...opcoes }: { colunas?: string; filtrar?: (consulta: Consulta) => Consulta } & OpcoesLeitura = {},
): Promise<T[]> {
  return lerTudo<T>((de, ate) => {
    let consulta: Consulta = cliente.from(tabela).select(colunas, { count: "exact" });
    if (filtrar) consulta = filtrar(consulta);
    for (const coluna of ORDENS[tabela]) consulta = consulta.order(coluna, { ascending: true });
    return consulta.range(de, ate);
  }, opcoes);
}

async function contar(cliente: Cliente, tabela: Tabela): Promise<number> {
  const { count, error } = await cliente.from(tabela).select("*", { count: "exact", head: true });
  if (error || count === null) throw new ErroLeitura("pagina", error?.message ?? `sem contagem de ${tabela}`);
  return count;
}

export interface MarcaCarteira {
  /** (mês, fechado_em): muda a cada fechamento, reabertura ou novo fechamento, com as posições. */
  meses: [string, string][];
  /** Eventos e transferências só recebem inserções (H4). */
  eventos: number;
  transferencias: number;
  ativos: number;
  ultimaDesativacao: string | null;
}

/** Marca de versão da carteira do usuário da sessão (a RLS restringe as linhas). */
export async function marcaCarteira(cliente: Cliente): Promise<MarcaCarteira> {
  const meses = await lerTabela<{ mes: string; fechado_em: string }>(cliente, "consolidados_mensais", {
    colunas: "mes, fechado_em",
  });
  const desativacao = await cliente
    .from("ativos")
    .select("desativado_em")
    .not("desativado_em", "is", null)
    .order("desativado_em", { ascending: false })
    .limit(1);
  if (desativacao.error) throw new ErroLeitura("pagina", desativacao.error.message);
  return {
    meses: meses.map((m) => [m.mes, m.fechado_em]),
    eventos: await contar(cliente, "eventos"),
    transferencias: await contar(cliente, "transferencias"),
    ativos: await contar(cliente, "ativos"),
    ultimaDesativacao: desativacao.data?.[0]?.desativado_em ?? null,
  };
}

export interface MarcaBenchmark {
  inicio: string;
  fim: string;
  atualizado_em: string;
}

/** Cobertura de um benchmark: carregar_benchmark a altera na transação que substitui os valores. */
export async function marcaBenchmark(cliente: Cliente, benchmark: string): Promise<MarcaBenchmark | null> {
  const { data, error } = await cliente
    .from("coberturas_benchmark")
    .select("inicio, fim, atualizado_em")
    .eq("benchmark_id", benchmark)
    .maybeSingle();
  if (error) throw new ErroLeitura("pagina", error.message);
  return data;
}

/**
 * Lê os insumos de uma composição entre duas leituras da marca. Devolve a marca conferida (por
 * exemplo, a cobertura usada no cálculo) e os insumos de uma única versão, ou ErroLeitura("mudou").
 */
export async function lerComposicao<M, T>(
  lerMarca: () => Promise<M>,
  lerInsumos: (marca: M) => Promise<T>,
  tentativas = TENTATIVAS,
): Promise<{ marca: M; insumos: T }> {
  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    const antes = await lerMarca();
    let insumos: T;
    try {
      insumos = await lerInsumos(antes);
    } catch (erro) {
      // A contagem que muda no meio de uma coleta também é "os dados mudaram": repete.
      if (erro instanceof ErroLeitura && erro.motivo === "contagem") continue;
      throw erro;
    }
    const depois = await lerMarca();
    if (JSON.stringify(antes) === JSON.stringify(depois)) return { marca: antes, insumos };
  }
  throw new ErroLeitura("mudou", `${tentativas} tentativas`);
}
