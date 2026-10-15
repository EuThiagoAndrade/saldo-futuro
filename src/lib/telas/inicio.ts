// Composição do Início (KB-004, seções 7, 8 e 15; D4 do ciclo 004). Os cálculos são os de
// src/lib/financeiro; este módulo só escolhe os limites dos períodos (P17, P18), a sugestão de
// K1, os aportes líquidos (P19) e monta os insumos a partir das linhas lidas.

import { acumulado, drawdownMaximo, type Retornos, serieBase100 } from "../financeiro/acumulado";
import { RecusaFinanceira } from "../financeiro/centavos";
import { type Mes, mesDe, mesSeguinte, ultimoDia } from "../financeiro/datas";
import { type Evento, tipoEfetivo } from "../financeiro/eventos";
import { dietz, ND, type Razao, variacaoDoPatrimonio } from "../financeiro/rentabilidade";

export const TIPOS_DE_PERIODO = ["mes", "ano", "12_meses", "desde_inicio", "intervalo"] as const;
export type TipoDePeriodo = (typeof TIPOS_DE_PERIODO)[number];

export interface Periodo {
  de: Mes;
  ate: Mes;
}

/** M: o último mês fechado (P17), ou null sem nenhum fechamento. */
export function mesDeReferencia(mesesFechados: readonly Mes[]): Mes | null {
  return mesesFechados.length ? [...mesesFechados].sort().at(-1)! : null;
}

/** Início da carteira: o primeiro mês fechado (KB-004, 4.6; K7). */
export function inicioDaCarteira(mesesFechados: readonly Mes[]): Mes | null {
  return mesesFechados.length ? [...mesesFechados].sort()[0] : null;
}

function mesAnterior(mes: Mes): Mes {
  const [ano, m] = mes.split("-").map(Number);
  return m === 1 ? `${ano - 1}-12` : `${ano}-${String(m - 1).padStart(2, "0")}`;
}

/** Limites inclusivos de cada período, sempre terminando em M (P17, P18; KB-004, seção 15). */
export function limitesDoPeriodo(tipo: TipoDePeriodo, M: Mes, inicio: Mes, intervalo?: Periodo): Periodo {
  switch (tipo) {
    case "mes":
      return { de: M, ate: M };
    case "ano":
      return { de: `${M.slice(0, 4)}-01`, ate: M };
    case "12_meses": {
      let de = M;
      for (let i = 0; i < 11; i++) de = mesAnterior(de);
      return { de, ate: M };
    }
    case "desde_inicio":
      return { de: inicio, ate: M };
    case "intervalo":
      if (!intervalo || intervalo.de > intervalo.ate || intervalo.ate > M) throw new RecusaFinanceira("periodo");
      return intervalo;
  }
}

/**
 * Sugestão de K1: se o período tem um mês N/D no período efetivo, o resultado de
 * [mês seguinte ao último N/D, fim do período], quando esse trecho tem algum mês.
 */
export function sugestao(retornos: Retornos, inicio: Mes, periodo: Periodo): { periodo: Periodo; valor: Razao } | null {
  const seguinte = mesSeguinte(inicio);
  let mes = periodo.de > seguinte ? periodo.de : seguinte;
  let ultimoNd: Mes | null = null;
  for (; mes <= periodo.ate; mes = mesSeguinte(mes)) {
    const r = retornos[mes];
    if (r === undefined || r === ND) ultimoNd = mes;
  }
  if (!ultimoNd || ultimoNd >= periodo.ate) return null;
  const trecho = { de: mesSeguinte(ultimoNd), ate: periodo.ate };
  return { periodo: trecho, valor: acumulado(retornos, inicio, trecho.de, trecho.ate) };
}

/**
 * Aportes líquidos (P19): aportes, resgates e seus estornos (pelo tipo referenciado, K2) com
 * data depois do último dia de M; sem M, todos os eventos. Exato em centavos.
 */
export function aportesLiquidos(eventos: readonly Evento[], M: Mes | null): bigint {
  const porId = new Map(eventos.map((e) => [e.id, e]));
  const limite = M ? ultimoDia(M) : null;
  let total = 0n;
  for (const evento of eventos) {
    if (limite && evento.data <= limite) continue;
    const tipo = tipoEfetivo(evento, porId);
    if (tipo === "aporte" || tipo === "resgate") total += evento.valor;
  }
  return total;
}

export interface MesFechadoLido {
  mes: Mes;
  vi: bigint;
  vf: bigint;
}

/** Rentabilidade (Modified Dietz) de cada mês fechado; meses não fechados ficam de fora (N/D). */
export function retornosDaCarteira(meses: readonly MesFechadoLido[], eventos: readonly Evento[], inicio: Mes): Retornos {
  const retornos: Record<Mes, Razao> = {};
  for (const m of meses) {
    const primeiroDia = `${m.mes}-01`;
    retornos[m.mes] = dietz({
      mes: m.mes,
      estado: "fechado",
      primeiroMes: m.mes === inicio,
      vi: m.vi,
      vf: m.vf,
      eventos: eventos.filter((e) => mesDe(e.data) === m.mes),
      eventosAnteriores: eventos.filter((e) => e.data < primeiroDia),
    }).retorno;
  }
  return retornos;
}

/** Meses de [de, ate], inclusivos. */
export function mesesDoPeriodo(periodo: Periodo): Mes[] {
  const meses: Mes[] = [];
  for (let mes = periodo.de; mes <= periodo.ate; mes = mesSeguinte(mes)) meses.push(mes);
  return meses;
}

export interface ResultadoDoPeriodo {
  periodo: Periodo;
  acumulado: Razao;
  drawdown: Razao;
  base100: number[] | typeof ND;
  /** Meses da série base 100: os do período efetivo (K8). */
  mesesBase100: Mes[];
  sugestao: { periodo: Periodo; valor: Razao } | null;
}

export function resultadoDoPeriodo(retornos: Retornos, inicio: Mes, periodo: Periodo): ResultadoDoPeriodo {
  const valor = acumulado(retornos, inicio, periodo.de, periodo.ate);
  const seguinte = mesSeguinte(inicio);
  const efetivo = { de: periodo.de > seguinte ? periodo.de : seguinte, ate: periodo.ate };
  return {
    periodo,
    acumulado: valor,
    drawdown: drawdownMaximo(retornos, inicio, periodo.de, periodo.ate),
    base100: serieBase100(retornos, inicio, periodo.de, periodo.ate),
    mesesBase100: efetivo.de <= efetivo.ate ? mesesDoPeriodo(efetivo) : [],
    sugestao: valor === ND ? sugestao(retornos, inicio, periodo) : null,
  };
}

/** Variação do patrimônio de M (P14): só um mês fechado com Vi > 0. */
export function variacaoDeM(m: MesFechadoLido): Razao {
  return variacaoDoPatrimonio({ mes: m.mes, estado: "fechado", primeiroMes: false, vi: m.vi, vf: m.vf, eventos: [] });
}
