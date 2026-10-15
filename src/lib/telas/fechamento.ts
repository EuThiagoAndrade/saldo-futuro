// Composição da tela de fechamento (KB-004, seção 5; D4 do ciclo 004). Nenhuma conta nova: a
// prévia é a de src/lib/financeiro/fechamento.ts, e a situação do mês vem de conferirFechamento.
// Este módulo só monta a entrada a partir das linhas lidas e diz o que a tela mostra.

import { type Centavos, deNumero, RecusaFinanceira } from "../financeiro/centavos";
import { conferirFechamento, type DataCivil, type Mes, mesDe, mesSeguinte, ultimoDia } from "../financeiro/datas";
import { type Evento, saldoCalculado, type TipoAjuste } from "../financeiro/eventos";
import type { EntradaFechamento } from "../financeiro/fechamento";

export interface AtivoLido {
  id: string;
  nome: string;
  tipo_ajuste: TipoAjuste | null;
  sistema: "transito" | null;
  ativo: boolean;
}

export interface PosicaoLida {
  mes: string; // AAAA-MM-01
  ativo_id: string;
  saldo_inicial: number;
  saldo_final: number;
  ajuste: number;
  tipo_ajuste: TipoAjuste | null;
}

export const mesDaColuna = (data: string): Mes => data.slice(0, 7);

/** Último mês fechado, ou null sem nenhum fechamento. */
export function ultimoMesFechado(mesesFechados: readonly Mes[]): Mes | null {
  return mesesFechados.length ? [...mesesFechados].sort().at(-1)! : null;
}

/** Mês do evento mais antigo da carteira (K7), ou null sem eventos. */
export function mesMaisAntigo(eventos: readonly Evento[]): Mes | null {
  return eventos.length ? eventos.map((e) => mesDe(e.data)).sort()[0] : null;
}

/** O próximo mês a fechar: o seguinte ao último fechado, ou o início da carteira (K7). */
export function proximoMesAFechar(ultimo: Mes | null, maisAntigo: Mes | null): Mes | null {
  return ultimo ? mesSeguinte(ultimo) : maisAntigo;
}

/** O próximo mês a fechar já terminou (K13): o Início avisa. */
export function mesTerminadoAberto(ultimo: Mes | null, maisAntigo: Mes | null, hoje: DataCivil): Mes | null {
  const proximo = proximoMesAFechar(ultimo, maisAntigo);
  return proximo && ultimoDia(proximo) < hoje ? proximo : null;
}

export type Situacao =
  | { tipo: "fechado"; podeReabrir: boolean }
  | { tipo: "pode_fechar" }
  | { tipo: "recusado"; motivo: string };

/** Situação de um mês na tela: fechado, aberto e fechável, ou aberto com o motivo da recusa. */
export function situacaoDoMes(mes: Mes, hoje: DataCivil, mesesFechados: readonly Mes[], maisAntigo: Mes | null): Situacao {
  const ultimo = ultimoMesFechado(mesesFechados);
  if (mesesFechados.includes(mes)) return { tipo: "fechado", podeReabrir: mes === ultimo };
  try {
    conferirFechamento(mes, hoje, ultimo, maisAntigo);
    return { tipo: "pode_fechar" };
  } catch (erro) {
    if (erro instanceof RecusaFinanceira) return { tipo: "recusado", motivo: erro.motivo };
    throw erro;
  }
}

/** Saldo final de cada ativo no mês fechado anterior: o saldo inicial do mês (KB-004, seção 5). */
export function saldosIniciais(mes: Mes, posicoes: readonly PosicaoLida[]): Record<string, bigint> {
  const anterior = posicoes.filter((p) => mesSeguinte(mesDaColuna(p.mes)) === mes);
  return Object.fromEntries(anterior.map((p) => [p.ativo_id, deNumero(p.saldo_final)]));
}

export function entradaDoFechamento(
  mes: Mes,
  ativos: readonly AtivoLido[],
  posicoes: readonly PosicaoLida[],
  eventos: readonly Evento[],
  saldosReais: Readonly<Record<string, bigint>>,
): EntradaFechamento {
  return {
    mes,
    ativos: ativos.map((a) => ({
      id: a.id,
      tipoAjuste: a.tipo_ajuste ?? undefined,
      sistema: a.sistema ?? undefined,
      ativo: a.ativo,
    })),
    saldosIniciais: saldosIniciais(mes, posicoes),
    eventos,
    saldosReais,
  };
}

export interface LinhaDoFechamento {
  ativo: string;
  saldoInicial: Centavos;
  movimento: bigint;
  saldoCalculado: bigint;
  /** Pede saldo real: ativo em uso que não é o trânsito (P7, K12). */
  exigeSaldoReal: boolean;
}

/**
 * Ativos que entram na apuração do mês, com o mesmo critério de previaFechamento: histórico no
 * mês (posição anterior ou evento no mês). O trânsito entra pelo saldo calculado.
 */
export function linhasDoFechamento(entrada: EntradaFechamento): LinhaDoFechamento[] {
  const doMes = entrada.eventos.filter((e) => mesDe(e.data) === entrada.mes);
  const linhas: LinhaDoFechamento[] = [];
  for (const ativo of entrada.ativos) {
    const temPosicaoAnterior = ativo.id in entrada.saldosIniciais;
    const eventosDoAtivo = doMes.filter((e) => e.ativo === ativo.id);
    const inicial = entrada.saldosIniciais[ativo.id] ?? 0n;
    const exigeSaldoReal = !ativo.sistema && ativo.ativo !== false;
    if (!(temPosicaoAnterior || eventosDoAtivo.length > 0)) continue;
    if (!(exigeSaldoReal || inicial !== 0n || eventosDoAtivo.length > 0)) continue;
    const calculado = saldoCalculado(inicial, eventosDoAtivo);
    linhas.push({
      ativo: ativo.id,
      saldoInicial: inicial as Centavos,
      movimento: calculado - inicial,
      saldoCalculado: calculado,
      exigeSaldoReal,
    });
  }
  return linhas;
}
