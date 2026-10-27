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
//
// Fresca: dentro de um pedido, o Next devolve a mesma resposta para GET/HEAD idênticos, salvo se o
// fetch recebe um signal (next/dist/server/lib/dedupe-fetch.js). Sem isso, a marca final e as novas
// tentativas repetiriam a resposta da primeira leitura. Cada fase recebe um signal próprio, que
// nunca é abortado: só faz a consulta ir ao banco.

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
  instituicoes: ["id"],
  classes_ativo: ["id"],
  taxonomia_ativos: ["id"],
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
/** Cliente que também chama funções de leitura, como a marca da classificação (ciclo 013). */
export type ClienteComRpc = Pick<SupabaseClient, "from" | "rpc">;

/** Lê uma tabela inteira, na ordem declarada em ORDENS, com filtro opcional. */
export function lerTabela<T>(
  cliente: Cliente,
  tabela: Tabela,
  { colunas = "*", filtrar, sinal, ...opcoes }: { colunas?: string; filtrar?: (consulta: Consulta) => Consulta; sinal?: AbortSignal } & OpcoesLeitura = {},
): Promise<T[]> {
  return lerTudo<T>((de, ate) => {
    let consulta: Consulta = cliente.from(tabela).select(colunas, { count: "exact" });
    if (filtrar) consulta = filtrar(consulta);
    for (const coluna of ORDENS[tabela]) consulta = consulta.order(coluna, { ascending: true });
    return fresca(consulta.range(de, ate), sinal);
  }, opcoes);
}

/** Com signal, a consulta escapa da deduplicação do Next e vai ao banco. */
function fresca(consulta: Consulta, sinal?: AbortSignal): Consulta {
  return sinal ? consulta.abortSignal(sinal) : consulta;
}

async function contar(cliente: Cliente, tabela: Tabela, sinal?: AbortSignal): Promise<number> {
  const { count, error } = await fresca(cliente.from(tabela).select("*", { count: "exact", head: true }), sinal);
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

/**
 * Marca de versão da carteira do usuário da sessão (a RLS restringe as linhas). Os componentes são
 * lidos juntos: cada um só muda num sentido, e toda leitura da marca antes termina antes dos insumos,
 * então uma escrita depois da leitura de um componente aparece nele na marca depois. Promise.all não é
 * um retrato único; a conferência antes = depois é que garante a versão (D13).
 */
export async function marcaCarteira(cliente: Cliente, sinal?: AbortSignal): Promise<MarcaCarteira> {
  const [meses, desativacao, eventos, transferencias, ativos] = await Promise.all([
    lerTabela<{ mes: string; fechado_em: string }>(cliente, "consolidados_mensais", { colunas: "mes, fechado_em", sinal }),
    fresca(
      cliente.from("ativos").select("desativado_em").not("desativado_em", "is", null).order("desativado_em", { ascending: false }).limit(1),
      sinal,
    ),
    contar(cliente, "eventos", sinal),
    contar(cliente, "transferencias", sinal),
    contar(cliente, "ativos", sinal),
  ]);
  if (desativacao.error) throw new ErroLeitura("pagina", desativacao.error.message);
  return {
    meses: meses.map((m) => [m.mes, m.fechado_em]),
    eventos,
    transferencias,
    ativos,
    ultimaDesativacao: desativacao.data?.[0]?.desativado_em ?? null,
  };
}

/**
 * Marca da classificação dos ativos (ciclo 013, R1-2): contador por carteira, que só cresce e é
 * incrementado na mesma transação de toda mudança de taxonomia_id, inclusive A → B → A. Vem como
 * texto decimal, comparado como texto, sem passar por number. O catálogo da taxonomia fica fora:
 * só muda por migração.
 */
export async function versaoClassificacao(cliente: ClienteComRpc, sinal?: AbortSignal): Promise<string> {
  const { data, error } = await fresca(cliente.rpc("ler_versao_classificacao"), sinal);
  if (error || typeof data !== "string" || !/^\d+$/.test(data)) throw new ErroLeitura("pagina", error?.message ?? "versão da classificação inválida");
  return data;
}

export interface MarcaBenchmark {
  inicio: string;
  fim: string;
  atualizado_em: string;
}

/** Cobertura de um benchmark: carregar_benchmark a altera na transação que substitui os valores. */
export async function marcaBenchmark(cliente: Cliente, benchmark: string, sinal?: AbortSignal): Promise<MarcaBenchmark | null> {
  const { data, error } = await fresca(
    cliente.from("coberturas_benchmark").select("inicio, fim, atualizado_em").eq("benchmark_id", benchmark),
    sinal,
  ).maybeSingle();
  if (error) throw new ErroLeitura("pagina", error.message);
  return data;
}

/**
 * Lê os insumos de uma composição entre duas leituras da marca. Devolve a marca conferida (por
 * exemplo, a cobertura usada no cálculo) e os insumos de uma única versão, ou ErroLeitura("mudou").
 * Cada fase recebe um signal novo, que as consultas devem usar para ler o banco de novo.
 */
export async function lerComposicao<M, T>(
  lerMarca: (sinal: AbortSignal) => Promise<M>,
  lerInsumos: (marca: M, sinal: AbortSignal) => Promise<T>,
  tentativas = TENTATIVAS,
): Promise<{ marca: M; insumos: T }> {
  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    const antes = await lerMarca(new AbortController().signal);
    let insumos: T;
    try {
      insumos = await lerInsumos(antes, new AbortController().signal);
    } catch (erro) {
      // A contagem que muda no meio de uma coleta também é "os dados mudaram": repete.
      if (erro instanceof ErroLeitura && erro.motivo === "contagem") continue;
      throw erro;
    }
    const depois = await lerMarca(new AbortController().signal);
    if (JSON.stringify(antes) === JSON.stringify(depois)) return { marca: antes, insumos };
  }
  throw new ErroLeitura("mudou", `${tentativas} tentativas`);
}
