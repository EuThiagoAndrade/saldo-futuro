// Benchmarks e comparação com a carteira (KB-004, seção 9; P16, D8, K3, K4, K9, K1).

import { RecusaFinanceira } from "./centavos";
import { type DataCivil, type Mes, mesDe, mesSeguinte, ultimoDia } from "./datas";
import { ND, type Razao } from "./rentabilidade";

export interface ValorSerie {
  data: DataCivil;
  /** Percentual do período, em texto, como publicado (D1). */
  valor: string;
}

export interface Cobertura {
  inicio: DataCivil;
  fim: DataCivil;
}

/** Retorno mensal de benchmark: fração, N/D ou "parcial" (K4); os dois últimos nunca viram zero. */
export type RetornoBenchmark = Razao | "parcial";

export interface MesDiario {
  diasComValor: number;
  completo: boolean;
  /** N/D quando o mês é parcial. */
  retorno: Razao;
}

function fator(valor: string): number {
  return 1 + Number(valor) / 100;
}

/**
 * Série diária (K4): Π(1 + vᵢ/100) − 1 sobre os valores do mês, só se o mês estiver completo —
 * cobertura desde o dia 1 ou antes e com valor posterior ao último dia do mês. Senão, o mês é
 * parcial: não comparável (N/D).
 */
export function retornoMensalDiario(valores: readonly ValorSerie[], cobertura: Cobertura | null, mes: Mes): MesDiario {
  const doMes = valores.filter((v) => mesDe(v.data) === mes);
  const completo = cobertura !== null && cobertura.inicio <= `${mes}-01` && cobertura.fim > ultimoDia(mes);
  const retorno = completo ? doMes.reduce((f, v) => f * fator(v.valor), 1) - 1 : ND;
  return { diasComValor: doMes.length, completo, retorno };
}

/** Série mensal (D8): v/100 do valor datado no dia 1; sem valor, N/D. */
export function retornoMensalMensal(valores: readonly ValorSerie[], mes: Mes): Razao {
  const valor = valores.find((v) => v.data === `${mes}-01`);
  return valor ? Number(valor.valor) / 100 : ND;
}

/** Retornos de cada mês de [de, ate]; null se algum for N/D, parcial ou ausente (K1). */
function retornosDoPeriodo(retornos: Readonly<Record<Mes, RetornoBenchmark>>, de: Mes, ate: Mes): number[] | null {
  if (de > ate) return null;
  const lista: number[] = [];
  for (let mes = de; mes <= ate; mes = mesSeguinte(mes)) {
    const r = retornos[mes];
    if (typeof r !== "number") return null;
    lista.push(r);
  }
  return lista;
}

/** Acumulado do benchmark: Π(1 + Rₘ) − 1; mês N/D ou parcial dá N/D. */
export function acumuladoBenchmark(retornos: Readonly<Record<Mes, RetornoBenchmark>>, de: Mes, ate: Mes): Razao {
  const lista = retornosDoPeriodo(retornos, de, ate);
  return lista ? lista.reduce((f, r) => f * (1 + r), 1) - 1 : ND;
}

export interface Comparacao {
  carteira: Razao;
  benchmark: Razao;
  /** Rc − Rb sobre os acumulados (apresentada em p.p.). */
  diferenca: Razao;
  /** Rc / Rb sobre os acumulados; N/D se Rb ≤ 0 (K3). */
  percentual: Razao;
  acertos: number | typeof ND;
  meses: number | typeof ND;
  /** Meses com carteira estritamente maior que o benchmark (K9). */
  taxaDeAcerto: Razao;
}

/**
 * Comparação no período efetivo da carteira [de, ate] (P16): um mês N/D na carteira, ou N/D ou
 * parcial no benchmark, torna as três medidas N/D (K1).
 */
export function comparar(
  carteira: Readonly<Record<Mes, Razao>>,
  benchmark: Readonly<Record<Mes, RetornoBenchmark>>,
  de: Mes,
  ate: Mes,
): Comparacao {
  const c = retornosDoPeriodo(carteira, de, ate);
  const b = retornosDoPeriodo(benchmark, de, ate);
  if (!c || !b) {
    return { carteira: ND, benchmark: ND, diferenca: ND, percentual: ND, acertos: ND, meses: ND, taxaDeAcerto: ND };
  }
  const rc = c.reduce((f, r) => f * (1 + r), 1) - 1;
  const rb = b.reduce((f, r) => f * (1 + r), 1) - 1;
  const acertos = c.filter((r, i) => r > b[i]).length;
  return {
    carteira: rc,
    benchmark: rb,
    diferenca: rc - rb,
    percentual: rb > 0 ? rc / rb : ND,
    acertos,
    meses: c.length,
    taxaDeAcerto: acertos / c.length,
  };
}

/**
 * Cobertura depois de uma carga de [dataInicial, dataFinal] (K4, D10), como a função do banco:
 * recusa buraco e carga sem valores; o fim passa a ser o último valor gravado.
 */
export function coberturaAposCarga(
  atual: Cobertura | null,
  dataInicial: DataCivil,
  dataFinal: DataCivil,
  ultimoValor: DataCivil | null,
): Cobertura {
  if (atual && (dataInicial > diaSeguinte(atual.fim) || dataFinal < diaAnterior(atual.inicio))) {
    throw new RecusaFinanceira("buraco");
  }
  if (ultimoValor === null) throw new RecusaFinanceira("sem_valores");
  if (!atual) return { inicio: dataInicial, fim: ultimoValor };
  return {
    inicio: dataInicial < atual.inicio ? dataInicial : atual.inicio,
    fim: dataFinal >= atual.fim ? ultimoValor : atual.fim,
  };
}

function deslocarDia(data: DataCivil, dias: number): DataCivil {
  const [a, m, d] = data.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

export function diaSeguinte(data: DataCivil): DataCivil {
  return deslocarDia(data, 1);
}

export function diaAnterior(data: DataCivil): DataCivil {
  return deslocarDia(data, -1);
}
