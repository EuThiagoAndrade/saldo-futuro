// Dinheiro em centavos inteiros (KB-004, seções 1 e 3; D11). Dentro das regras, centavos são
// bigint, exatos em qualquer soma intermediária. A faixa ±(2^53 − 1) só é exigida no que é
// gravado ou devolvido, e a conversão de e para number só ocorre na fronteira.

declare const marca: unique symbol;
export type Centavos = bigint & { readonly [marca]: "Centavos" };

export const LIMITE_CENTAVOS = 9007199254740991n;

/** Recusa de uma regra financeira; `message` é o motivo como o banco o devolve. */
export class RecusaFinanceira extends Error {
  constructor(
    readonly motivo: string,
    readonly detalhe?: unknown,
  ) {
    super(`recusado_${motivo}`);
    this.name = "RecusaFinanceira";
  }
}

export function naFaixa(valor: bigint): boolean {
  return valor >= -LIMITE_CENTAVOS && valor <= LIMITE_CENTAVOS;
}

/** Valor que vai ser gravado ou devolvido: recusa fora da faixa. */
export function exigirFaixa(valor: bigint): Centavos {
  if (!naFaixa(valor)) throw new RecusaFinanceira("faixa");
  return valor as Centavos;
}

/** Fronteira de entrada (JSON, Data API): só inteiros seguros. */
export function deNumero(valor: number): Centavos {
  if (!Number.isSafeInteger(valor)) throw new RecusaFinanceira("faixa");
  return BigInt(valor) as Centavos;
}

/** Fronteira de saída: exige a faixa antes de converter. */
export function paraNumero(valor: bigint): number {
  return Number(exigirFaixa(valor));
}

export function somar(valores: Iterable<bigint>): bigint {
  let total = 0n;
  for (const valor of valores) total += valor;
  return total;
}
