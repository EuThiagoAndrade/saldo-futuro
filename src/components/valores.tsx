// Componentes de valor (D5 do ciclo 004; DESIGN.md 6.2 a 6.5). O texto vem de
// src/lib/apresentacao/valores.ts. Quantias em dinheiro passam por src/components/dinheiro.tsx,
// que lê a preferência "Ocultar valores" no servidor (D8) e usa os conteúdos daqui.
// Imports relativos: este arquivo também é renderizado nos testes do Vitest.

import { ND, type Razao } from "../lib/financeiro/rentabilidade";
import {
  type Direcao,
  direcaoDinheiro,
  direcaoPercentual,
  textoDinheiro,
  textoDinheiroComSinal,
  textoPercentual,
  textoPercentualComSinal,
  textoPontosPercentuais,
} from "../lib/apresentacao/valores";
import { IconeSetaBaixo, IconeSetaCima, IconeTraco } from "./icones";

/** Ausência de valor: nunca zero (6.5). */
export function NaoDisponivel() {
  return (
    <span className="text-neutral" title="Não disponível">
      <span aria-hidden="true">N/D</span>
      <span className="sr-only">Não disponível</span>
    </span>
  );
}

/** Quantia oculta: nem o texto visível nem o nome acessível revelam o valor. */
export function ValorOculto() {
  return (
    <span title="Valor oculto">
      <span aria-hidden="true">••••</span>
      <span className="sr-only">Valor oculto</span>
    </span>
  );
}

/** Centavos inteiros (number seguro ou bigint), ou N/D. */
export type Quantia = bigint | number | typeof ND;

function centavos(valor: bigint | number): bigint {
  if (typeof valor === "number" && !Number.isSafeInteger(valor)) throw new Error(`centavos inválidos: ${valor}`);
  return BigInt(valor);
}

/** Saldo, patrimônio ou valor de lançamento (6.2). A cor de ganho e perda não é do saldo. */
export function ConteudoDinheiro({ valor, oculto }: { valor: Quantia; oculto: boolean }) {
  if (valor === ND) return <NaoDisponivel />;
  if (oculto) return <ValorOculto />;
  return <span className="whitespace-nowrap">{textoDinheiro(centavos(valor))}</span>;
}

/** Percentual simples, sem sinal explícito (6.3). */
export function Percentual({ valor }: { valor: Razao }) {
  if (valor === ND) return <NaoDisponivel />;
  return <span className="whitespace-nowrap">{textoPercentual(valor)}</span>;
}

/** Diferença em pontos percentuais, com sinal explícito. */
export function PontosPercentuais({ valor }: { valor: Razao }) {
  if (valor === ND) return <NaoDisponivel />;
  return <span className="whitespace-nowrap">{textoPontosPercentuais(valor)}</span>;
}

const CORES: Record<Direcao, string> = { alta: "text-gain", baixa: "text-loss", zero: "text-neutral" };
const ICONES = { alta: IconeSetaCima, baixa: IconeSetaBaixo, zero: IconeTraco } as const;

function ComDirecao({ direcao, texto }: { direcao: Direcao; texto: string }) {
  const Icone = ICONES[direcao];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap ${CORES[direcao]}`}>
      <Icone className="size-4 shrink-0" />
      {texto}
    </span>
  );
}

/** Variação percentual: sinal, ícone e cor juntos; a cor sozinha nunca carrega o significado (6.4). */
export function VariacaoPercentual({ valor }: { valor: Razao }) {
  if (valor === ND) return <NaoDisponivel />;
  return <ComDirecao direcao={direcaoPercentual(valor)} texto={textoPercentualComSinal(valor)} />;
}

/** Variação em dinheiro; oculta, não mostra nem a direção. */
export function ConteudoVariacaoDinheiro({ valor, oculto }: { valor: Quantia; oculto: boolean }) {
  if (valor === ND) return <NaoDisponivel />;
  if (oculto) return <ValorOculto />;
  const c = centavos(valor);
  return <ComDirecao direcao={direcaoDinheiro(c)} texto={textoDinheiroComSinal(c)} />;
}
