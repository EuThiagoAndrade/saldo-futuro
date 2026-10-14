// Eventos, estorno e transferência (KB-004, seção 4; D4, P5, P6, D3, K6). As funções puras
// abaixo aplicam as mesmas recusas das funções do banco, que continuam sendo o único caminho
// de escrita (D13).

import { type Centavos, exigirFaixa, RecusaFinanceira, somar } from "./centavos";
import type { DataCivil } from "./datas";

export type TipoAjuste = "rendimento" | "marcacao";
export type TipoLancamento = "aporte" | "resgate" | "rendimento" | "marcacao" | "cambio" | "migracao";
export type TipoEvento = TipoLancamento | "transferencia" | "estorno";

export interface Evento {
  id: string;
  ativo: string;
  data: DataCivil;
  tipo: TipoEvento;
  valor: Centavos;
  estornoDe?: string;
  transferencia?: string;
}

export interface Componentes {
  aportes: bigint;
  resgates: bigint;
  rendimento: bigint;
  marcacao: bigint;
  cambio: bigint;
  migracao: bigint;
  transferencias: bigint;
}

const LANCAMENTOS: readonly string[] = ["aporte", "resgate", "rendimento", "marcacao", "cambio", "migracao"];

/** Tipo e sinal de um lançamento comum (D4). */
export function conferirLancamento(tipo: TipoEvento, valor: bigint): Centavos {
  if (!LANCAMENTOS.includes(tipo)) throw new RecusaFinanceira("tipo");
  if (valor === 0n || (tipo === "aporte" && valor < 0n) || (tipo === "resgate" && valor > 0n)) {
    throw new RecusaFinanceira("sinal");
  }
  return exigirFaixa(valor);
}

/**
 * Estorno total (P5): o oposto do referenciado, um por evento, nunca de estorno ou de perna.
 * Um valor informado diferente do oposto do referenciado (estorno parcial) é recusado.
 */
export function criarEstorno(
  id: string,
  referencia: Evento,
  data: DataCivil,
  eventos: readonly Evento[],
  valorInformado?: bigint,
): Evento {
  if (valorInformado !== undefined && valorInformado !== -referencia.valor) throw new RecusaFinanceira("estorno_parcial");
  if (referencia.tipo === "estorno" || referencia.tipo === "transferencia") {
    throw new RecusaFinanceira("estorno_invalido");
  }
  if (eventos.some((e) => e.estornoDe === referencia.id)) throw new RecusaFinanceira("ja_estornado");
  if (data < referencia.data) throw new RecusaFinanceira("data");
  return { id, ativo: referencia.ativo, data, tipo: "estorno", valor: -referencia.valor as Centavos, estornoDe: referencia.id };
}

/** Transferência (P6, D3): duas pernas de soma zero, na mesma data. */
export function criarTransferencia(
  id: string,
  origem: string,
  destino: string,
  data: DataCivil,
  valor: bigint,
): [Evento, Evento] {
  if (valor <= 0n) throw new RecusaFinanceira("valor");
  const positivo = exigirFaixa(valor);
  if (origem === destino) throw new RecusaFinanceira("mesmo_ativo");
  return [
    { id: `${id}:origem`, ativo: origem, data, tipo: "transferencia", valor: -positivo as Centavos, transferencia: id },
    { id: `${id}:destino`, ativo: destino, data, tipo: "transferencia", valor: positivo, transferencia: id },
  ];
}

/** Correção da transferência inteira (K6): estorna as duas pernas juntas. */
export function corrigirTransferencia(transferencia: string, data: DataCivil, eventos: readonly Evento[]): [Evento, Evento] {
  const pernas = eventos.filter((e) => e.transferencia === transferencia && e.tipo === "transferencia");
  if (pernas.length !== 2) throw new RecusaFinanceira("transferencia_inexistente");
  if (eventos.some((e) => e.transferencia === transferencia && e.tipo === "estorno")) {
    throw new RecusaFinanceira("ja_corrigida");
  }
  if (data < pernas[0].data) throw new RecusaFinanceira("data");
  const [a, b] = pernas.map((perna) => ({
    id: `${perna.id}:correcao`,
    ativo: perna.ativo,
    data,
    tipo: "estorno" as const,
    valor: -perna.valor as Centavos,
    estornoDe: perna.id,
    transferencia,
  }));
  return [a, b];
}

/** Tipo efetivo: o estorno conta pelo tipo do evento referenciado. */
export function tipoEfetivo(evento: Evento, porId: ReadonlyMap<string, Evento>): TipoEvento {
  if (evento.tipo !== "estorno") return evento.tipo;
  const referencia = evento.estornoDe ? porId.get(evento.estornoDe) : undefined;
  if (!referencia) throw new Error(`estorno sem evento referenciado: ${evento.id}`);
  return referencia.tipo;
}

/** Componentes da identidade contábil por tipo efetivo, sem os ajustes (P10). */
export function componentes(eventosDoMes: readonly Evento[], porId: ReadonlyMap<string, Evento>): Componentes {
  const total: Componentes = { aportes: 0n, resgates: 0n, rendimento: 0n, marcacao: 0n, cambio: 0n, migracao: 0n, transferencias: 0n };
  const chave: Record<TipoEvento, keyof Componentes | null> = {
    aporte: "aportes",
    resgate: "resgates",
    rendimento: "rendimento",
    marcacao: "marcacao",
    cambio: "cambio",
    migracao: "migracao",
    transferencia: "transferencias",
    estorno: null,
  };
  for (const evento of eventosDoMes) {
    const campo = chave[tipoEfetivo(evento, porId)];
    if (campo) total[campo] += evento.valor;
  }
  return total;
}

/** Saldo calculado: saldo inicial mais os eventos do ativo no mês, exato em bigint. */
export function saldoCalculado(saldoInicial: bigint, eventosDoAtivoNoMes: readonly Evento[]): bigint {
  return saldoInicial + somar(eventosDoAtivoNoMes.map((e) => e.valor));
}
