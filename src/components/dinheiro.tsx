// Componentes únicos de quantia em dinheiro (D5 e D8 do ciclo 004). Toda quantia da interface
// passa por aqui: a preferência "Ocultar valores" é lida no servidor, então a página já sai
// oculta, sem mostrar o valor antes da hidratação.

import { ConteudoDinheiro, ConteudoVariacaoDinheiro, type Quantia } from "@/components/valores";
import { valoresOcultos } from "@/lib/ocultar";

export async function Dinheiro({ valor }: { valor: Quantia }) {
  return <ConteudoDinheiro valor={valor} oculto={await valoresOcultos()} />;
}

export async function VariacaoDinheiro({ valor }: { valor: Quantia }) {
  return <ConteudoVariacaoDinheiro valor={valor} oculto={await valoresOcultos()} />;
}
