import { PRINCIPAIS, UNIDADES_TOTAIS } from "./distribuicao";

// Primitivas das análises por instituição e níveis de classe (KB-004, seção 15; ciclo 015, issue
// #152). Os algoritmos por ativo e por classe macro, que têm o seu próprio desempate, não mudam.

const colacao = new Intl.Collator("pt-BR");

/** UUID canônico em ordem de texto, sem locale. */
export function porId(a: string, b: string): number {
  const [x, y] = [a.toLowerCase(), b.toLowerCase()];
  return x < y ? -1 : x > y ? 1 : 0;
}

/** Nome em ordem crescente do português (pt-BR) e, no empate, o UUID. */
export function porNomeEId(a: { nome: string; id: string }, b: { nome: string; id: string }): number {
  const nome = colacao.compare(a.nome, b.nome);
  return nome !== 0 ? nome : porId(a.id, b.id);
}

/** Saldo crescente (o mais negativo primeiro), depois nome e UUID. */
export function porSaldoCrescente(a: { saldo: bigint; nome: string; id: string }, b: { saldo: bigint; nome: string; id: string }): number {
  return a.saldo === b.saldo ? porNomeEId(a, b) : a.saldo < b.saldo ? -1 : 1;
}

/**
 * Maior resto entre saldos **positivos**, já na ordem de desempate do resto: devolve, na mesma ordem,
 * a participação de cada um em centésimos de ponto percentual, somando 10000. O empate de resto
 * segue a ordem recebida, mesmo com saldos diferentes. Lista vazia não tem base e devolve vazia.
 */
export function ratear(valores: readonly bigint[]): number[] {
  if (valores.length === 0) return [];
  if (valores.some((v) => v <= 0n)) throw new RangeError("o rateio recebe só saldos positivos");
  const base = valores.reduce((soma, v) => soma + v, 0n);
  const pisos = valores.map((v) => (v * UNIDADES_TOTAIS) / base);
  const restos = valores.map((v) => (v * UNIDADES_TOTAIS) % base);
  const sobra = Number(UNIDADES_TOTAIS - pisos.reduce((soma, q) => soma + q, 0n));
  const porResto = valores.map((_, i) => i).sort((i, j) => (restos[i] === restos[j] ? i - j : restos[i] > restos[j] ? -1 : 1));
  for (const i of porResto.slice(0, sobra)) pisos[i] += 1n;
  return pisos.map(Number);
}

export interface Outros<T> {
  saldo: bigint;
  participacao: number;
  componentes: T[];
}

/**
 * Agrupamento visual depois do rateio: os `PRINCIPAIS` primeiros de `linhas` (já na ordem de
 * apresentação) ficam; os demais formam Outros, cujos saldo e participação são as somas exatas dos
 * componentes, sem novo rateio.
 */
export function agruparOutros<T extends { saldo: bigint; participacao: number }>(linhas: readonly T[]): { principais: T[]; outros: Outros<T> | null } {
  const componentes = linhas.slice(PRINCIPAIS);
  return {
    principais: linhas.slice(0, PRINCIPAIS),
    outros: componentes.length
      ? {
          saldo: componentes.reduce((soma, l) => soma + l.saldo, 0n),
          participacao: componentes.reduce((soma, l) => soma + l.participacao, 0),
          componentes,
        }
      : null,
  };
}
