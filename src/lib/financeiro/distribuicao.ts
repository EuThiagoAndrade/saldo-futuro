import { deNumero } from "./centavos";

// Distribuição por ativo do último mês fechado (KB-004, seção 15; ciclo 010, BL-005). Só os
// saldos positivos formam a base; a participação é um inteiro de centésimos de ponto percentual
// (10000 = 100,00%), repartido em bigint pelo maior resto uma única vez entre todos os positivos,
// antes de agrupar os menores em Outros (alternativa A). Desempate: maior saldo, nome em pt-BR e
// UUID canônico em ordem de texto, sem locale. Nada passa por ponto flutuante.

export const UNIDADES_TOTAIS = 10000n;
export const PRINCIPAIS = 5;

export interface PosicaoDaDistribuicao {
  id: string;
  nome: string;
  /** Saldo final em centavos, como vem da leitura (number seguro). */
  saldo: number;
}

export interface Parte {
  id: string;
  nome: string;
  saldo: bigint;
  /** Centésimos de ponto percentual sobre a base positiva, de 0 a 10000. */
  participacao: number;
}

export interface Distribuicao {
  /** Soma exata dos saldos positivos; pode passar da faixa de uma posição (CR-59). */
  base: bigint;
  /** Todos os positivos, na ordem de apresentação. */
  positivos: Parte[];
  principais: Parte[];
  outros: { saldo: bigint; participacao: number; componentes: Parte[] } | null;
  /** Saldos negativos: listados, sem participação e fora da base. */
  negativos: { id: string; nome: string; saldo: bigint }[];
  /** Saldo zero: não aparecem. */
  omitidos: { id: string; nome: string }[];
}

const colacao = new Intl.Collator("pt-BR");

function porNomeEId(a: { nome: string; id: string }, b: { nome: string; id: string }): number {
  const nome = colacao.compare(a.nome, b.nome);
  if (nome !== 0) return nome;
  const [x, y] = [a.id.toLowerCase(), b.id.toLowerCase()];
  return x < y ? -1 : x > y ? 1 : 0;
}

export function comporDistribuicao(posicoes: readonly PosicaoDaDistribuicao[]): Distribuicao {
  const entradas = posicoes.map((p) => ({ id: p.id, nome: p.nome, saldo: deNumero(p.saldo) as bigint }));

  const positivas = entradas.filter((p) => p.saldo > 0n).sort((a, b) => (a.saldo === b.saldo ? porNomeEId(a, b) : a.saldo > b.saldo ? -1 : 1));
  const negativos = entradas.filter((p) => p.saldo < 0n).sort((a, b) => (a.saldo === b.saldo ? porNomeEId(a, b) : a.saldo < b.saldo ? -1 : 1));
  const omitidos = entradas.filter((p) => p.saldo === 0n).sort(porNomeEId).map(({ id, nome }) => ({ id, nome }));

  const base = positivas.reduce((soma, p) => soma + p.saldo, 0n);
  if (base === 0n) return { base, positivos: [], principais: [], outros: null, negativos, omitidos };

  const pisos = positivas.map((p) => (p.saldo * UNIDADES_TOTAIS) / base);
  const restos = positivas.map((p) => (p.saldo * UNIDADES_TOTAIS) % base);
  const sobra = Number(UNIDADES_TOTAIS - pisos.reduce((soma, q) => soma + q, 0n));
  // Maiores restos primeiro; empate de resto pela ordem de apresentação (saldo, nome e UUID).
  const porResto = positivas.map((_, i) => i).sort((i, j) => (restos[i] === restos[j] ? i - j : restos[i] > restos[j] ? -1 : 1));
  for (const i of porResto.slice(0, sobra)) pisos[i] += 1n;

  const partes: Parte[] = positivas.map((p, i) => ({ ...p, participacao: Number(pisos[i]) }));
  const principais = partes.slice(0, PRINCIPAIS);
  const componentes = partes.slice(PRINCIPAIS);
  const outros = componentes.length
    ? {
        saldo: componentes.reduce((soma, p) => soma + p.saldo, 0n),
        participacao: componentes.reduce((soma, p) => soma + p.participacao, 0),
        componentes,
      }
    : null;
  return { base, positivos: partes, principais, outros, negativos, omitidos };
}
