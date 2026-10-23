import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dataExtensaBr } from "./apresentacao/datas";
import { compararVersoes, HISTORICO, type Novidade, novidadesPublicadas, VERSAO_ATUAL } from "./novidades";

// Versão e histórico de novidades (#105, BL-011). Nenhum teste exige uma entrada por versão.

const historico: Novidade[] = [
  { versao: "0.7.0", publicadaEm: null, notas: ["Nota da 0.7.0."] },
  { versao: "0.10.0", publicadaEm: "2027-01-05", notas: ["Nota da 0.10.0."] },
  { versao: "0.8.1", publicadaEm: "2026-11-30", notas: ["Nota da 0.8.1."] },
];

describe("versão corrente", () => {
  it("vem do package.json", () => {
    expect(VERSAO_ATUAL).toBe(JSON.parse(readFileSync("package.json", "utf8")).version);
  });
});

describe("compararVersoes", () => {
  it("compara maior, menor e correção como números, não como texto", () => {
    expect(compararVersoes("0.10.0", "0.9.9")).toBeGreaterThan(0);
    expect(compararVersoes("0.7.0", "0.7.1")).toBeLessThan(0);
    expect(compararVersoes("1.0.0", "0.99.99")).toBeGreaterThan(0);
    expect(compararVersoes("0.7.0", "0.7.0")).toBe(0);
  });

  it("recusa texto que não é versão", () => {
    expect(() => compararVersoes("sete", "0.7.0")).toThrow(/versão inválida/);
  });
});

describe("novidadesPublicadas", () => {
  it("em 0.6.0, nenhuma entrada futura aparece", () => {
    expect(novidadesPublicadas("0.6.0", historico)).toEqual([]);
  });

  it("em 0.7.0, só a 0.7.0 aparece, mesmo sem data", () => {
    expect(novidadesPublicadas("0.7.0", historico).map((n) => n.versao)).toEqual(["0.7.0"]);
  });

  it("ordena da versão mais recente para a mais antiga, numericamente", () => {
    expect(novidadesPublicadas("0.10.0", historico).map((n) => n.versao)).toEqual(["0.10.0", "0.8.1", "0.7.0"]);
  });

  it("versão lançada sem entrada não causa erro nem inventa notas", () => {
    expect(novidadesPublicadas("0.9.0", historico).map((n) => n.versao)).toEqual(["0.8.1", "0.7.0"]);
    expect(novidadesPublicadas("0.7.0", [])).toEqual([]);
  });

  it("não reordena o histórico recebido", () => {
    const antes = historico.map((n) => n.versao);
    novidadesPublicadas("0.10.0", historico);
    expect(historico.map((n) => n.versao)).toEqual(antes);
  });
});

describe("histórico do produto", () => {
  it("começa em 0.7.0, com versões únicas e válidas, datas AAAA-MM-DD ou null e notas sem identificadores técnicos", () => {
    expect(HISTORICO.map((n) => n.versao)).toContain("0.7.0");
    for (const n of HISTORICO) {
      expect(compararVersoes(n.versao, "0.7.0")).toBeGreaterThanOrEqual(0);
      if (n.publicadaEm !== null) expect(n.publicadaEm).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(n.notas.length).toBeGreaterThan(0);
      for (const nota of n.notas) expect(nota).not.toMatch(/#\d+|\bBL-\d+|\b[0-9a-f]{7,40}\b|https?:/i);
    }
    expect(new Set(HISTORICO.map((n) => n.versao)).size).toBe(HISTORICO.length);
  });

  it("a nota da 0.8.0 (IGP-M) só aparece quando a 0.8.0 for a versão corrente ou anterior a ela", () => {
    expect(novidadesPublicadas("0.7.0", HISTORICO).map((n) => n.versao)).toEqual(["0.7.0"]);
    expect(novidadesPublicadas("0.8.0", HISTORICO).map((n) => n.versao)).toEqual(["0.8.0", "0.7.0"]);
  });
});

describe("dataExtensaBr", () => {
  it("escreve a data civil por extenso, sem depender do fuso", () => {
    expect(dataExtensaBr("2026-10-21")).toBe("21 de outubro de 2026");
    expect(dataExtensaBr("2027-01-05")).toBe("5 de janeiro de 2027");
  });
});
