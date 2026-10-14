// Prévia do fechamento e identidade contábil (KB-004, seção 5; P7, P9, P10, D5, D6, K12). A
// função do banco recalcula tudo e é quem grava; esta prévia aplica as mesmas regras e as
// mesmas recusas, para a interface mostrar pendências e ajustes antes de pedir o fechamento.

import { type Centavos, exigirFaixa, RecusaFinanceira } from "./centavos";
import { type Mes, mesDe } from "./datas";
import { type Componentes, componentes, type Evento, saldoCalculado, type TipoAjuste } from "./eventos";

export interface Ativo {
  id: string;
  tipoAjuste?: TipoAjuste;
  sistema?: "transito";
  ativo?: boolean;
}

export interface EntradaFechamento {
  mes: Mes;
  ativos: readonly Ativo[];
  /** Saldo final de cada ativo no mês fechado anterior; ausente = sem posição anterior. */
  saldosIniciais: Readonly<Record<string, bigint>>;
  /** Todos os eventos da carteira; os de outros meses servem para resolver estornos. */
  eventos: readonly Evento[];
  saldosReais: Readonly<Record<string, bigint>>;
}

export interface Posicao {
  ativo: string;
  saldoInicial: Centavos;
  saldoCalculado: Centavos;
  saldoFinal: Centavos;
  ajuste: Centavos;
  tipoAjuste: TipoAjuste | null;
}

export interface Consolidado extends Omit<Componentes, "transferencias"> {
  vi: Centavos;
  vf: Centavos;
}

export interface Previa {
  posicoes: Posicao[];
  consolidado: Consolidado;
}

/** Identidade contábil exata (P10): Vf − Vi = soma dos componentes; transferências somam zero. */
export function identidadeFecha(vi: bigint, vf: bigint, c: Omit<Componentes, "transferencias"> & { transferencias?: bigint }): boolean {
  return (
    (c.transferencias ?? 0n) === 0n &&
    vf - vi === c.aportes + c.resgates + c.rendimento + c.marcacao + c.cambio + c.migracao
  );
}

/**
 * Prévia do fechamento: pendências, ajustes, posições e consolidado. Recusa com `pendencia`
 * (detalhe: ids pendentes), `faixa` ou `identidade`, como `fechar_mes`.
 */
export function previaFechamento(entrada: EntradaFechamento): Previa {
  const porId = new Map(entrada.eventos.map((e) => [e.id, e]));
  const doMes = entrada.eventos.filter((e) => mesDe(e.data) === entrada.mes);
  const pendentes: string[] = [];
  const apuradas: { ativo: Ativo; inicial: bigint; calculado: bigint; real: bigint | undefined }[] = [];

  for (const ativo of entrada.ativos) {
    const temPosicaoAnterior = ativo.id in entrada.saldosIniciais;
    const eventosDoAtivo = doMes.filter((e) => e.ativo === ativo.id);
    const inicial = entrada.saldosIniciais[ativo.id] ?? 0n;
    const exigeSaldoReal = !ativo.sistema && ativo.ativo !== false;
    if (!(temPosicaoAnterior || eventosDoAtivo.length > 0)) continue;
    if (!(exigeSaldoReal || inicial !== 0n || eventosDoAtivo.length > 0)) continue;
    const calculado = saldoCalculado(inicial, eventosDoAtivo);
    const real = exigeSaldoReal ? entrada.saldosReais[ativo.id] : calculado;
    if (real === undefined) pendentes.push(ativo.id);
    apuradas.push({ ativo, inicial, calculado, real });
  }
  if (pendentes.length > 0) throw new RecusaFinanceira("pendencia", pendentes);

  const posicoes = apuradas.map(({ ativo, inicial, calculado, real }) => {
    const ajuste = (real as bigint) - calculado;
    return {
      ativo: ativo.id,
      saldoInicial: exigirFaixa(inicial),
      saldoCalculado: exigirFaixa(calculado),
      saldoFinal: exigirFaixa(real as bigint),
      ajuste: exigirFaixa(ajuste),
      tipoAjuste: ajuste !== 0n ? (ativo.tipoAjuste ?? null) : null,
    };
  });

  const c = componentes(doMes, porId);
  for (const p of posicoes) {
    if (p.tipoAjuste === "rendimento") c.rendimento += p.ajuste;
    if (p.tipoAjuste === "marcacao") c.marcacao += p.ajuste;
  }
  const vi = posicoes.reduce((s, p) => s + p.saldoInicial, 0n);
  const vf = posicoes.reduce((s, p) => s + p.saldoFinal, 0n);
  const consolidado: Consolidado = {
    vi: exigirFaixa(vi),
    vf: exigirFaixa(vf),
    aportes: exigirFaixa(c.aportes),
    resgates: exigirFaixa(c.resgates),
    rendimento: exigirFaixa(c.rendimento),
    marcacao: exigirFaixa(c.marcacao),
    cambio: exigirFaixa(c.cambio),
    migracao: exigirFaixa(c.migracao),
  };
  if (!identidadeFecha(vi, vf, c)) throw new RecusaFinanceira("identidade");
  return { posicoes, consolidado };
}
