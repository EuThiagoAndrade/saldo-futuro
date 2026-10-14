// Acumulado, ano até a data, série base 100 e drawdown (KB-004, seção 8; P12, P13, K1, K8).

import { type Mes, mesSeguinte } from "./datas";
import { ND, type Razao } from "./rentabilidade";

/** Retornos mensais por mês; mês ausente é N/D. */
export type Retornos = Readonly<Record<Mes, Razao>>;

/**
 * Meses com retorno de [de, ate] (K8): começa no maior entre `de` e o mês seguinte ao início
 * da carteira. Devolve null quando um mês é N/D (K1) ou o período não tem mês com retorno.
 */
function retornosDoPeriodo(retornos: Retornos, inicio: Mes, de: Mes, ate: Mes): number[] | null {
  const seguinte = mesSeguinte(inicio);
  let mes = de > seguinte ? de : seguinte;
  if (mes > ate) return null;
  const lista: number[] = [];
  for (; mes <= ate; mes = mesSeguinte(mes)) {
    const r = retornos[mes];
    if (r === undefined || r === ND) return null;
    lista.push(r);
  }
  return lista;
}

/** Acumulado por encadeamento geométrico (P12): Π(1 + Rₘ) − 1. */
export function acumulado(retornos: Retornos, inicio: Mes, de: Mes, ate: Mes): Razao {
  const lista = retornosDoPeriodo(retornos, inicio, de, ate);
  return lista ? lista.reduce((f, r) => f * (1 + r), 1) - 1 : ND;
}

/** Rentabilidade do ano até o mês (P13): acumulado de janeiro ao mês. */
export function anoAteMes(retornos: Retornos, inicio: Mes, mes: Mes): Razao {
  return acumulado(retornos, inicio, `${mes.slice(0, 4)}-01`, mes);
}

/** Série base 100: I₀ = 100 no começo do período efetivo e Iₖ = Iₖ₋₁·(1 + Rₖ). */
export function serieBase100(retornos: Retornos, inicio: Mes, de: Mes, ate: Mes): number[] | typeof ND {
  const lista = retornosDoPeriodo(retornos, inicio, de, ate);
  if (!lista) return ND;
  const serie: number[] = [];
  let indice = 100;
  for (const r of lista) serie.push((indice *= 1 + r));
  return serie;
}

/** Drawdown máximo: menor Iₖ / max(100, I₁…Iₖ) − 1, com o pico inicial 100. Zero ou negativo. */
export function drawdownMaximo(retornos: Retornos, inicio: Mes, de: Mes, ate: Mes): Razao {
  const serie = serieBase100(retornos, inicio, de, ate);
  if (serie === ND) return ND;
  let pico = 100;
  let pior = 0;
  for (const indice of serie) {
    pico = Math.max(pico, indice);
    pior = Math.min(pior, indice / pico - 1);
  }
  return pior;
}
