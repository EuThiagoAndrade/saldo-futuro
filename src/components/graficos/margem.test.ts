import { expect, it } from "vitest";
import { textoEixoDinheiro, MENOS } from "../../lib/apresentacao/valores";
import { indice } from "../../lib/financeiro/apresentacao";
import { textoPercentual } from "../../lib/apresentacao/valores";
import { MARGEM_ESQUERDA_MAXIMA, MARGEM_ESQUERDA_PADRAO } from "./graficos";
import { larguraEstimada, margemComum, rotulosDoEixoBarras, rotulosDoEixoLinha } from "./margem";

// Somente valores fictícios, em reais.
const patrimonio = (...valores: number[]) => rotulosDoEixoLinha([valores], textoEixoDinheiro);

it("faixa comum fica na margem padrão nos três eixos", () => {
  const margem = margemComum([
    patrimonio(1200000, 1219000.01, 1260000),
    rotulosDoEixoBarras([0.012, -0.004, 0.02], textoPercentual),
    rotulosDoEixoLinha([[100, 101.2, 103.4]], indice),
  ]);
  expect(margem).toBe(MARGEM_ESQUERDA_PADRAO);
  expect(MARGEM_ESQUERDA_PADRAO).toBe(70);
});

it("a estimativa nunca fica abaixo das larguras medidas na fonte carregada", () => {
  // Medidas de revisão (IBM Plex Sans Regular, 11 unidades): aproximadamente 54 e 126.
  expect(larguraEstimada("R$ 1,22 mi")).toBeGreaterThanOrEqual(54);
  expect(larguraEstimada(`${MENOS}R$ 90.071.992,5474 mi`)).toBeGreaterThanOrEqual(126);
});

it("transições mil/mi e negativos recuam só quando o rótulo exige", () => {
  expect(margemComum([patrimonio(500, 900)])).toBe(70);
  expect(margemComum([patrimonio(12000, 99000)])).toBe(70);
  expect(margemComum([patrimonio(-1500000, 1500000)])).toBe(70);
  const longo = margemComum([patrimonio(99998000, 100050000)]);
  expect(longo).toBeGreaterThan(70);
  expect(longo).toBeLessThanOrEqual(MARGEM_ESQUERDA_MAXIMA);
});

it("rótulo longo recua a margem de todos os eixos juntos", () => {
  const rotulos = [patrimonio(0, 45_000_000_000_000), ["0,00%", "1,00%"], ["100", "101"]];
  const margem = margemComum(rotulos);
  expect(margem).toBeGreaterThan(70);
  expect(margemComum([rotulos[1], rotulos[2]])).toBe(70);
});

it("extremos do ciclo 008 respeitam o limite e deixam 160 unidades de curva", () => {
  for (const sinal of [1, -1]) {
    const margem = margemComum([patrimonio(0, sinal * 90071992547409.91)]);
    expect(margem).toBeLessThanOrEqual(MARGEM_ESQUERDA_MAXIMA);
    expect(MARGEM_ESQUERDA_MAXIMA).toBe(144);
    expect(360 - 56 - margem).toBeGreaterThanOrEqual(160);
    const maior = Math.max(...patrimonio(0, sinal * 90071992547409.91).map(larguraEstimada));
    expect(margem).toBeGreaterThanOrEqual(Math.min(MARGEM_ESQUERDA_MAXIMA, maior + 6));
  }
});

it("rótulos ocultos não ampliam a margem e entrada vazia usa a padrão", () => {
  expect(margemComum([["••••", "••••"]])).toBe(70);
  expect(margemComum([])).toBe(70);
});
