// Margem esquerda comum dos gráficos de eixo do Início (ciclo 009, BL-013). A largura do rótulo é
// estimada no servidor, sem medir o DOM, e de forma conservadora: nunca abaixo da largura real da
// IBM Plex Sans a 11 unidades. O e2e compara a estimativa com a caixa medida na página.

import { faixaDe, marcas } from "./escala";
import { MARGEM_ESQUERDA_MAXIMA, MARGEM_ESQUERDA_PADRAO } from "./graficos";

const FONTE = 11;
const AFASTAMENTO = 6;

// Avanço por caractere, em em, com folga sobre o medido na IBM Plex Sans Regular: a largura renderizada
// varia um pouco com o viewport (algarismos tabulares: 0,601; "%": 0,928 isolado e até 1,0 em contexto; "R": 0,641; "m": 0,874).
const AVANCO: Record<string, number> = {
  "0": 0.62, "1": 0.62, "2": 0.62, "3": 0.62, "4": 0.62, "5": 0.62, "6": 0.62, "7": 0.62, "8": 0.62, "9": 0.62,
  ",": 0.3, ".": 0.3, " ": 0.3, "\u00a0": 0.3, "\u2212": 0.62, "-": 0.6, "+": 0.62,
  R: 0.65, $: 0.61, "%": 1.05, "•": 0.45, "/": 0.45,
  i: 0.3, l: 0.3, m: 0.92,
};
const AVANCO_DESCONHECIDO = 0.92;

/** Largura estimada, em unidades do viewBox, de um rótulo de eixo (por excesso). */
export function larguraEstimada(texto: string): number {
  let em = 0;
  for (const c of texto) em += AVANCO[c] ?? AVANCO_DESCONHECIDO;
  return em * FONTE;
}

/** Rótulos que o eixo Y de GraficoLinha gera para estas séries. */
export function rotulosDoEixoLinha(valores: readonly (number | null)[][], rotular: (v: number, marcas: number[]) => string): string[] {
  const eixo = marcas(faixaDe(valores.flat()));
  return eixo.map((v) => rotular(v, eixo));
}

/** Rótulos que o eixo Y de GraficoBarras gera para estes valores. */
export function rotulosDoEixoBarras(valores: readonly (number | null)[], rotular: (v: number) => string): string[] {
  return marcas(faixaDe(valores, true)).map((v) => rotular(v));
}

/**
 * Menor margem esquerda que comporta o rótulo mais longo de todos os eixos (com afastamento),
 * entre a padrão e a máxima que preserva 160 unidades de curva.
 */
export function margemComum(rotulos: readonly (readonly string[])[]): number {
  const maior = Math.max(0, ...rotulos.flat().map(larguraEstimada));
  return Math.min(MARGEM_ESQUERDA_MAXIMA, Math.max(MARGEM_ESQUERDA_PADRAO, Math.ceil(maior + AFASTAMENTO)));
}
