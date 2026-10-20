import { describe, expect, it } from "vitest";
import { marcas } from "./escala";
import { textoEixoDinheiro } from "../../lib/apresentacao/valores";

const faixas = [
  [1_200_000, 1_260_000], [999_980, 1_000_020], [999.98, 1000.02],
  [0.01, 0.05], [-0.03, 0.03], [0, 0], [1234, 1234],
  [0, 90_071_992_547_409.91], [90_071_992_547_389.91, 90_071_992_547_409.91],
  [999_980, 1_000_500],
].flatMap(([min, max]) => [{ min, max }, { min: -max, max: -min }]);

describe("escala e rótulos monetários (#88)", () => {
  for (const faixa of faixas) it(JSON.stringify(faixa), () => {
    const eixo = marcas(faixa);
    expect(eixo[0]).toBeLessThanOrEqual(faixa.min);
    expect(eixo.at(-1)).toBeGreaterThanOrEqual(faixa.max);
    expect(eixo.length).toBeGreaterThanOrEqual(2);
    const textos = eixo.map((v) => textoEixoDinheiro(v, eixo));
    expect(new Set(textos).size).toBe(eixo.length);
    const sufixos = textos.map((t) => t.endsWith(" mi") ? 1e6 : t.endsWith(" mil") ? 1e3 : 1);
    expect(new Set(sufixos).size).toBe(1);
    eixo.forEach((v, i) => {
      expect(Number.isFinite(v)).toBe(true);
      if (i) expect(v).toBeGreaterThan(eixo[i - 1]);
      const numero = textos[i].replace("−", "-").replace(/R\$|[  ]|mil|mi/g, "").replaceAll(".", "").replace(",", ".");
      expect(Number(numero) * sufixos[i]).toBeCloseTo(v, Math.max(0, 10 - Math.floor(Math.log10(Math.abs(v) || 1))));
    });
  });
  it("amplia a faixa extrema para a resolução de cem reais", () => {
    expect(marcas({ min: 90071992547389.91, max: 90071992547409.91 })).toEqual([90071992547300, 90071992547400, 90071992547500]);
    expect(marcas({ min: -90071992547409.91, max: -90071992547389.91 })).toEqual([-90071992547500, -90071992547400, -90071992547300]);
  });
  it("representa as marcas pelo valor, sem só distingui-las", () => {
    const eixo = [1_200_000, 1_220_000, 1_240_000, 1_260_000];
    expect(eixo.map((v) => textoEixoDinheiro(v, eixo))).toEqual(["R$ 1,20 mi", "R$ 1,22 mi", "R$ 1,24 mi", "R$ 1,26 mi"]);
    expect(textoEixoDinheiro(999980, [999980, 1000020])).toBe("R$ 0,99998 mi");
  });
});
