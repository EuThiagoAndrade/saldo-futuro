// Sincronização de um benchmark com o SGS do Banco Central (KB-004, 9.2; D10; plano, V1 a V3).
// Módulo de servidor com o fetch e o cliente do Supabase injetados: busca todas as janelas de no
// máximo 10 anos, valida todas as respostas e só então grava tudo numa única chamada à função
// public.carregar_benchmark, que exige o admin. Qualquer falha antes disso não grava nada.

import { type DataCivil, mesDe } from "../financeiro/datas";

export interface BenchmarkSgs {
  id: string;
  codigoSgs: number;
  periodicidade: "diaria" | "mensal";
}

export interface Janela {
  inicio: DataCivil;
  fim: DataCivil;
}

export interface ValorCarga {
  data: DataCivil;
  valor: string;
}

/** O subconjunto do fetch usado aqui. */
export type Buscar = (url: string) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

/** O subconjunto do cliente do Supabase usado aqui, com a sessão do admin. */
export interface ClienteCarga {
  rpc(
    funcao: "carregar_benchmark",
    argumentos: { p_benchmark: string; p_data_inicial: DataCivil; p_data_final: DataCivil; p_valores: ValorCarga[] },
  ): PromiseLike<{ error: { message: string } | null }>;
}

export class ErroSincronizacao extends Error {
  constructor(
    readonly motivo: "busca" | "resposta" | "sem_valores" | "gravacao" | "tempo",
    detalhe: string,
  ) {
    super(`${motivo}: ${detalhe}`);
    this.name = "ErroSincronizacao";
  }
}

const URL_SGS = "https://api.bcb.gov.br/dados/serie/bcdata.sgs";
const DATA_SGS = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const VALOR = /^-?\d+(\.\d+)?$/;

function utc(data: DataCivil): Date {
  const [a, m, d] = data.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}

function iso(data: Date): DataCivil {
  return data.toISOString().slice(0, 10);
}

/** AAAA-MM-DD → dd/MM/aaaa. */
export function paraDataSgs(data: DataCivil): string {
  mesDe(data);
  return `${data.slice(8, 10)}/${data.slice(5, 7)}/${data.slice(0, 4)}`;
}

/** dd/MM/aaaa → AAAA-MM-DD, recusando data inexistente. */
export function deDataSgs(texto: string): DataCivil {
  const m = DATA_SGS.exec(texto);
  if (!m) throw new ErroSincronizacao("resposta", `data fora do formato: ${texto}`);
  const data = `${m[3]}-${m[2]}-${m[1]}`;
  try {
    mesDe(data);
  } catch {
    throw new ErroSincronizacao("resposta", `data inexistente: ${texto}`);
  }
  return data;
}

/** Janelas consecutivas, sem sobreposição, de no máximo 10 anos cada (V2). */
export function janelas(inicio: DataCivil, fim: DataCivil): Janela[] {
  if (fim < inicio) throw new Error(`período invertido: ${inicio} a ${fim}`);
  const lista: Janela[] = [];
  let atual = inicio;
  while (atual <= fim) {
    const d = utc(atual);
    const limite = iso(new Date(Date.UTC(d.getUTCFullYear() + 10, d.getUTCMonth(), d.getUTCDate() - 1)));
    const fimJanela = limite < fim ? limite : fim;
    lista.push({ inicio: atual, fim: fimJanela });
    const proximo = utc(fimJanela);
    atual = iso(new Date(Date.UTC(proximo.getUTCFullYear(), proximo.getUTCMonth(), proximo.getUTCDate() + 1)));
  }
  return lista;
}

export function urlDaJanela(codigoSgs: number, janela: Janela): string {
  return `${URL_SGS}.${codigoSgs}/dados?formato=json&dataInicial=${paraDataSgs(janela.inicio)}&dataFinal=${paraDataSgs(janela.fim)}`;
}

/** Valida uma resposta inteira: lista de {data, valor em texto}, dentro da janela (V3). */
export function validarResposta(corpo: unknown, janela: Janela, periodicidade: BenchmarkSgs["periodicidade"]): ValorCarga[] {
  if (!Array.isArray(corpo)) throw new ErroSincronizacao("resposta", "o corpo não é uma lista");
  return corpo.map((item) => {
    if (typeof item !== "object" || item === null || typeof item.data !== "string" || typeof item.valor !== "string") {
      throw new ErroSincronizacao("resposta", `item fora do formato: ${JSON.stringify(item)}`);
    }
    if (!VALOR.test(item.valor)) throw new ErroSincronizacao("resposta", `valor fora do formato: ${item.valor}`);
    const data = deDataSgs(item.data);
    if (data < janela.inicio || data > janela.fim) throw new ErroSincronizacao("resposta", `data fora da janela: ${item.data}`);
    if (periodicidade === "mensal" && !data.endsWith("-01")) {
      throw new ErroSincronizacao("resposta", `série mensal fora do dia 1: ${item.data}`);
    }
    return { data, valor: item.valor };
  });
}

/**
 * Sincroniza [inicio, fim]: busca e valida todas as janelas e só então grava numa única chamada.
 * Devolve a quantidade de valores gravados.
 */
export async function sincronizarBenchmark(
  benchmark: BenchmarkSgs,
  inicio: DataCivil,
  fim: DataCivil,
  { buscar, cliente, signal }: { buscar: Buscar; cliente: ClienteCarga; signal?: AbortSignal },
): Promise<number> {
  const conferirPrazo = () => {
    if (signal?.aborted) throw new ErroSincronizacao("tempo", "tempo de busca esgotado");
  };
  const valores: ValorCarga[] = [];
  for (const janela of janelas(inicio, fim)) {
    conferirPrazo();
    const url = urlDaJanela(benchmark.codigoSgs, janela);
    let resposta: Awaited<ReturnType<Buscar>>;
    try {
      resposta = await buscar(url);
    } catch (erro) {
      conferirPrazo();
      throw new ErroSincronizacao("busca", `${url}: ${String(erro)}`);
    }
    if (!resposta.ok) throw new ErroSincronizacao("busca", `${url}: HTTP ${resposta.status}`);
    let corpo: unknown;
    try {
      corpo = JSON.parse(await resposta.text());
    } catch {
      conferirPrazo();
      throw new ErroSincronizacao("resposta", `${url}: JSON inválido`);
    }
    valores.push(...validarResposta(corpo, janela, benchmark.periodicidade));
  }
  conferirPrazo();
  if (new Set(valores.map((v) => v.data)).size !== valores.length) {
    throw new ErroSincronizacao("resposta", "data repetida entre as respostas");
  }
  if (valores.length === 0) throw new ErroSincronizacao("sem_valores", `nenhum valor de ${inicio} a ${fim}`);
  const { error } = await cliente.rpc("carregar_benchmark", {
    p_benchmark: benchmark.id,
    p_data_inicial: inicio,
    p_data_final: fim,
    p_valores: valores,
  });
  if (error) throw new ErroSincronizacao("gravacao", error.message);
  return valores.length;
}
