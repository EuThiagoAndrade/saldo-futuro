// Patrimônio, variação do patrimônio e rentabilidade mensal da carteira (KB-004, seções 6 e 7;
// P11, P14, P15, K2, K5, D2, D7). Funções puras sobre o consolidado lido do banco; nada é gravado.

import { somar } from "./centavos";
import { diaDe, diasNoMes, type Mes, mesDe } from "./datas";
import { type Evento, tipoEfetivo } from "./eventos";

export const ND = "N/D";
export type Razao = number | typeof ND;

export interface MesDaCarteira {
  mes: Mes;
  /** Só um mês fechado tem consolidado; aberto inclui o reaberto. */
  estado: "fechado" | "aberto";
  /** O início da carteira não tem mês anterior. */
  primeiroMes: boolean;
  vi: bigint;
  vf: bigint;
  /** Eventos da carteira com data no mês. */
  eventos: readonly Evento[];
  /** Eventos de meses anteriores, para resolver estornos (K2). */
  eventosAnteriores?: readonly Evento[];
}

export interface Dietz {
  dias: number;
  numerador: bigint;
  denominador: bigint;
  retorno: Razao;
}

/** Patrimônio: soma dos saldos de todos os ativos, trânsito incluído (D3). */
export function patrimonio(saldos: Iterable<bigint>): bigint {
  return somar(saldos);
}

/** Variação do patrimônio (P14): (Vf − Vi) / Vi; N/D fora de mês fechado ou com Vi ≤ 0. */
export function variacaoDoPatrimonio(m: MesDaCarteira): Razao {
  if (m.estado !== "fechado" || m.vi <= 0n) return ND;
  return Number(m.vf - m.vi) / Number(m.vi);
}

/**
 * Modified Dietz na forma inteira (P11, R2-3): N = D·(Vf − Vi − ΣF) e M = D·Vi + Σ F·(D − d),
 * exatos em bigint, com uma única divisão. Fluxos: aportes, resgates e seus estornos, no dia da
 * própria data. N/D em mês não fechado, no início, com migração (P15) ou com M ≤ 0 (K5).
 */
export function dietz(m: MesDaCarteira): Dietz {
  const porId = new Map([...(m.eventosAnteriores ?? []), ...m.eventos].map((e) => [e.id, e]));
  const dias = diasNoMes(m.mes);
  const D = BigInt(dias);
  let somaFluxos = 0n;
  let fluxosPonderados = 0n;
  let temMigracao = false;
  for (const evento of m.eventos) {
    if (mesDe(evento.data) !== m.mes) throw new Error(`evento fora do mês: ${evento.id}`);
    const tipo = tipoEfetivo(evento, porId);
    if (tipo === "migracao") temMigracao = true;
    if (tipo !== "aporte" && tipo !== "resgate") continue;
    somaFluxos += evento.valor;
    fluxosPonderados += evento.valor * (D - BigInt(diaDe(evento.data)));
  }
  const numerador = D * (m.vf - m.vi - somaFluxos);
  const denominador = D * m.vi + fluxosPonderados;
  const indisponivel = m.estado !== "fechado" || m.primeiroMes || temMigracao || denominador <= 0n;
  return { dias, numerador, denominador, retorno: indisponivel ? ND : Number(numerador) / Number(denominador) };
}
