// Componentes únicos de quantia em dinheiro (D5 e D8 do ciclo 004). Toda quantia da interface
// passa por aqui: a preferência "Ocultar valores" é lida no servidor, então a página já sai
// oculta, sem mostrar o valor antes da hidratação.

import { IconeSetaBaixo, IconeSetaCima } from "@/components/icones";
import { ConteudoDinheiro, ConteudoVariacaoDinheiro, type Quantia, ValorOculto } from "@/components/valores";
import { textoDinheiro } from "@/lib/apresentacao/valores";
import { valoresOcultos } from "@/lib/ocultar";

export async function Dinheiro({ valor }: { valor: Quantia }) {
  return <ConteudoDinheiro valor={valor} oculto={await valoresOcultos()} />;
}

export async function VariacaoDinheiro({ valor }: { valor: Quantia }) {
  return <ConteudoVariacaoDinheiro valor={valor} oculto={await valoresOcultos()} />;
}

/**
 * Valor de lançamento (DESIGN.md 6.6): entradas positivas e saídas negativas, com ícone de
 * entrada ou saída e sem cor de ganho ou perda, porque movimentação não é rendimento. Oculto,
 * não mostra nem a direção.
 */
export async function ValorLancamento({ valor }: { valor: bigint }) {
  if (await valoresOcultos()) return <ValorOculto />;
  const Icone = valor < 0n ? IconeSetaBaixo : IconeSetaCima;
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-text">
      <Icone className="size-4 shrink-0 text-text-secondary" />
      {textoDinheiro(valor)}
    </span>
  );
}
