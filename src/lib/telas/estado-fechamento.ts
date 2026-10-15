// Estado da revisão do fechamento devolvido pela Server Action (D3). Quantias em texto de
// centavos inteiros, para atravessar a fronteira entre servidor e cliente sem ponto flutuante.

import type { EstadoAcao } from "./acao";

export interface PosicaoRevisada {
  ativo: string;
  nome: string;
  saldoCalculado: string;
  saldoFinal: string;
  ajuste: string;
  tipoAjuste: "rendimento" | "marcacao" | null;
}

export interface Revisao {
  /** Saldos reais confirmados, por id do ativo, em centavos. */
  saldos: Record<string, string>;
  posicoes: PosicaoRevisada[];
  consolidado: Record<"vi" | "vf" | "aportes" | "resgates" | "rendimento" | "marcacao" | "cambio" | "migracao", string>;
}

export interface EstadoRevisao extends EstadoAcao {
  revisao?: Revisao;
}
