import { describe, expect, it } from "vitest";
import { comporComparacao, retornosDoBenchmark } from "./benchmarks";
import { ND } from "../financeiro/rentabilidade";

describe("composição da comparação: KB-004, CR-44 a CR-47", () => {
  it("CR-44: acumulados, diferença, percentual, acertos e base 100 no mesmo período efetivo", () => {
    const periodo = { de: "2025-01", ate: "2026-02" };
    const b = retornosDoBenchmark("mensal", [{ data: "2026-01-01", valor: "0.8" }, { data: "2026-02-01", valor: "0.8" }], null, periodo);
    const r = comporComparacao({ "2026-01": .01, "2026-02": .02 }, b, "2025-12", periodo);
    expect(r.meses).toEqual(["2026-01", "2026-02"]);
    expect(r.medidas.carteira).toBeCloseTo(.0302, 12);
    expect(r.medidas.benchmark).toBeCloseTo(.016064, 12);
    expect(r.medidas.diferenca).toBeCloseTo(.014136, 12);
    expect(r.medidas.percentual).toBeCloseTo(1.879980079681275, 12);
    expect(r.medidas.taxaDeAcerto).toBe(1);
    expect((r.baseCarteira as number[]).at(-1)).toBeCloseTo(103.02, 10);
    expect((r.baseBenchmark as number[]).at(-1)).toBeCloseTo(101.6064, 10);
    const a = comporComparacao({ "2026-01": .009 }, b, "2025-12", { de: "2026-01", ate: "2026-01" });
    expect(a.medidas.diferenca).toBeCloseTo(.001, 12);
    expect(a.medidas.percentual).toBeCloseTo(1.125, 12);
  });
  it.each([-.0032, 0])("CR-45: benchmark %s torna percentual N/D, preservando a diferença", (b) => {
    const r = comporComparacao({ "2026-01": .012 }, { "2026-01": b }, "2025-12", { de: "2026-01", ate: "2026-01" });
    expect(r.medidas.percentual).toBe(ND);
    expect(r.medidas.diferenca).toBeCloseTo(.012 - b, 12);
  });
  it("CR-46: empate não conta; N/D torna as medidas indisponíveis", () => {
    const r = comporComparacao({ "2026-01": .009, "2026-02": .007, "2026-03": .008 }, { "2026-01": .008, "2026-02": .008, "2026-03": .008 }, "2025-12", { de: "2026-01", ate: "2026-03" });
    expect(r.medidas.taxaDeAcerto).toBeCloseTo(1 / 3);
    expect(comporComparacao({ "2026-01": ND }, { "2026-01": .008 }, "2025-12", { de: "2026-01", ate: "2026-01" }).medidas.diferenca).toBe(ND);
  });
  it("CR-47: fevereiro parcial não é composto ou comparado; janeiro completo vale 0,80%", () => {
    const p = { de: "2026-01", ate: "2026-02" };
    const b = retornosDoBenchmark("diaria", [{ data: "2026-01-02", valor: "0.8" }, { data: "2026-02-02", valor: "0.5" }], { inicio: "2026-01-01", fim: "2026-02-02" }, p);
    expect(b["2026-01"]).toBeCloseTo(.008, 12);
    expect(b["2026-02"]).toBe("parcial");
    const r = comporComparacao({ "2026-01": .01, "2026-02": .02 }, b, "2025-12", p);
    expect(r.medidas).toMatchObject({ diferenca: ND, percentual: ND, taxaDeAcerto: ND });
    expect(r.baseBenchmark).toBe(ND);
    expect(r.baseCarteira).not.toBe(ND);
  });
  it("ausência da série e período sem retorno nunca viram zero", () => {
    expect(retornosDoBenchmark("mensal", [], null, { de: "2026-01", ate: "2026-01" })["2026-01"]).toBe(ND);
    const r = comporComparacao({}, {}, "2026-01", { de: "2026-01", ate: "2026-01" });
    expect(r.meses).toEqual([]);
    expect(r.medidas.taxaDeAcerto).toBe(ND);
  });
});
