// Textos dos valores exibidos (DESIGN.md 6.2 a 6.5; KB-004, seção 2; D5 do ciclo 004).
// Dinheiro é formatado a partir de centavos inteiros, sem ponto flutuante; percentuais usam o
// arredondamento de apresentação da KB-004. Os componentes de src/components/valores.tsx só
// envolvem estes textos com ícone, cor e rótulo acessível.

import { percentual } from "../financeiro/apresentacao";

export const MENOS = "−"; // U+2212
const ESPACO_FIXO = " "; // espaço não separável depois de "R$"

export type Direcao = "alta" | "baixa" | "zero";

function milhares(inteiro: bigint): string {
  return inteiro.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Centavos → "R$ 1.234,56"; negativo "−R$ 1.234,56" (6.2). */
export function textoDinheiro(centavos: bigint): string {
  const negativo = centavos < 0n;
  const absoluto = negativo ? -centavos : centavos;
  const texto = `R$${ESPACO_FIXO}${milhares(absoluto / 100n)},${(absoluto % 100n).toString().padStart(2, "0")}`;
  return negativo ? `${MENOS}${texto}` : texto;
}

/** Variação em dinheiro, com sinal explícito: "+R$ 120,00", "−R$ 80,00", "R$ 0,00" (6.4). */
export function textoDinheiroComSinal(centavos: bigint): string {
  return centavos > 0n ? `+${textoDinheiro(centavos)}` : textoDinheiro(centavos);
}

export function direcaoDinheiro(centavos: bigint): Direcao {
  return centavos > 0n ? "alta" : centavos < 0n ? "baixa" : "zero";
}

/** Fração → "12,34%" (6.3). O zero arredondado não tem sinal (KB-004, seção 2). */
export function textoPercentual(fracao: number): string {
  return `${percentual(fracao)}%`;
}

/** Direção do valor como ele é exibido: um percentual que arredonda para zero é zero. */
export function direcaoPercentual(fracao: number): Direcao {
  const texto = percentual(fracao);
  return texto === "0,00" ? "zero" : texto.startsWith(MENOS) ? "baixa" : "alta";
}

/** Variação percentual com sinal explícito: "+1,23%", "−0,45%", "0,00%" (6.3). */
export function textoPercentualComSinal(fracao: number): string {
  const texto = textoPercentual(fracao);
  return direcaoPercentual(fracao) === "alta" ? `+${texto}` : texto;
}

/** Diferença em pontos percentuais com sinal explícito: a fração 0,001 é "+0,10 p.p." (KB-004, 9.4). */
export function textoPontosPercentuais(fracao: number): string {
  const texto = `${percentual(fracao)} p.p.`;
  return direcaoPercentual(fracao) === "alta" ? `+${texto}` : texto;
}
