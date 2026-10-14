// Parser de quantias digitadas (KB-004, seção 10; O13, K11): formato brasileiro estrito, sem
// arredondar nem adivinhar. Usado no cliente para a mensagem imediata e de novo no servidor,
// que é a autoridade (D12 do ciclo 004).

import { type Centavos, exigirFaixa, RecusaFinanceira } from "./centavos";

// Sinal opcional (hífen ou U+2212); parte inteira só com algarismos ou em grupos de milhar
// (1 a 3 algarismos e depois grupos de exatamente 3); vírgula e 1 ou 2 casas, opcionais.
const QUANTIA = /^([-−])?(\d+|\d{1,3}(?:\.\d{3})+)(?:,(\d{1,2}))?$/;

/** Texto → centavos. Recusa com o motivo `formato` ou `faixa` (seção 3). */
export function lerQuantia(texto: string): Centavos {
  const partes = QUANTIA.exec(texto.trim());
  if (!partes) throw new RecusaFinanceira("formato");
  const [, sinal, inteiro, fracao = ""] = partes;
  const centavos = BigInt(inteiro.replaceAll(".", "") + fracao.padEnd(2, "0"));
  return exigirFaixa(sinal ? -centavos : centavos);
}
