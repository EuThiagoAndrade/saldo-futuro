// Escalas dos gráficos em SVG próprio (ADR-005). Funções puras: só posicionam pontos e marcas
// de eixo; nenhum número exibido sai daqui sem passar pela apresentação da KB-004.

export interface Faixa {
  min: number;
  max: number;
}

/** Marcas "redondas" do eixo (1, 2 ou 5 × 10ⁿ) que cobrem [min, max], sempre incluindo o zero se ele estiver na faixa. */
export function marcas(faixa: Faixa, quantidade = 4): number[] {
  let { min, max } = faixa;
  if (min === max) {
    const folga = Math.abs(min) * 0.1 || 1;
    min -= folga;
    max += folga;
  }
  const amplitude = Math.max(Math.abs(min), Math.abs(max));
  const resolucao = amplitude > 0 ? 10 ** (Math.floor(Math.log10(amplitude)) - 11) : 0;
  let bruto = Math.max((max - min) / quantidade, resolucao);
  for (;;) {
    const potencia = 10 ** Math.floor(Math.log10(bruto));
    const passo = [1, 2, 5, 10].map((m) => m * potencia).find((p) => p >= bruto) ?? 10 * potencia;
    const inicio = Math.floor(min / passo);
    const fim = Math.ceil(max / passo);
    // Índices inteiros evitam acumular erro somando o passo repetidamente.
    const lista = Array.from({ length: fim - inicio + 1 }, (_, i) => Number(((inicio + i) * passo).toPrecision(12)));
    if (lista.length >= 2 && lista.every((v, i) => Number.isFinite(v) && (i === 0 || v > lista[i - 1]))
      && lista[0] <= min && lista.at(-1)! >= max) return lista;
    // Recalcula o domínio caso o arredondamento ainda colapse ou não cubra a faixa.
    bruto = passo * 2;
  }
}

/** Converte um valor do domínio [d0, d1] para a coordenada [r0, r1]. */
export function escalar(valor: number, d0: number, d1: number, r0: number, r1: number): number {
  return d1 === d0 ? (r0 + r1) / 2 : r0 + ((valor - d0) / (d1 - d0)) * (r1 - r0);
}

/** Faixa dos valores presentes (ignora lacunas). */
export function faixaDe(valores: readonly (number | null)[], incluirZero = false): Faixa {
  const presentes = valores.filter((v): v is number => v !== null);
  if (incluirZero) presentes.push(0);
  if (presentes.length === 0) return { min: 0, max: 1 };
  return { min: Math.min(...presentes), max: Math.max(...presentes) };
}
