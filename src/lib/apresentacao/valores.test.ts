import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  direcaoDinheiro,
  direcaoPercentual,
  textoDinheiro,
  textoDinheiroComSinal,
  textoParticipacao,
  textoPercentual,
  textoPercentualComSinal,
  textoPontosPercentuais,
  textoEixoDinheiro,
  mesCurto,
} from "./valores";

/* eslint-disable @typescript-eslint/no-explicit-any */
const cr38: any = JSON.parse(
  readFileSync(join(process.cwd(), "tests/fixtures/financeiro/casos_referencia.json"), "utf8"),
).casos.find((c: any) => c.id === "CR-38");

const NBSP = " ";

describe("dinheiro a partir de centavos (DESIGN.md 6.2)", () => {
  it("formata com milhar, vírgula e espaço não separável", () => {
    expect(textoDinheiro(123456n)).toBe(`R$${NBSP}1.234,56`);
    expect(textoDinheiro(5n)).toBe(`R$${NBSP}0,05`);
    expect(textoDinheiro(0n)).toBe(`R$${NBSP}0,00`);
    expect(textoDinheiro(100000000n)).toBe(`R$${NBSP}1.000.000,00`);
  });

  it("negativo usa U+2212 antes de R$", () => {
    expect(textoDinheiro(-123456n)).toBe(`−R$${NBSP}1.234,56`);
  });

  it("é exato no limite da faixa, sem ponto flutuante", () => {
    expect(textoDinheiro(9007199254740991n)).toBe(`R$${NBSP}90.071.992.547.409,91`);
    expect(textoDinheiro(-9007199254740991n)).toBe(`−R$${NBSP}90.071.992.547.409,91`);
  });

  it("variação tem sinal explícito e direção (6.4)", () => {
    expect(textoDinheiroComSinal(12000n)).toBe(`+R$${NBSP}120,00`);
    expect(textoDinheiroComSinal(-8000n)).toBe(`−R$${NBSP}80,00`);
    expect(textoDinheiroComSinal(0n)).toBe(`R$${NBSP}0,00`);
    expect([direcaoDinheiro(1n), direcaoDinheiro(-1n), direcaoDinheiro(0n)]).toEqual(["alta", "baixa", "zero"]);
  });
});

describe("CR-38 — percentuais exibidos (DESIGN.md 6.3)", () => {
  const fracoes: Record<string, number> = cr38.entrada.percentuais ?? cr38.entrada;

  for (const chave of ["p01", "p02", "p03", "p04", "p05", "p06", "p07", "p08", "p09", "p10", "p11"]) {
    it(`${chave}`, () => {
      const fracao = Number(fracoes[chave]);
      expect(textoPercentual(fracao)).toBe(`${cr38.esperado[chave]}%`);
    });
  }

  it("variação percentual com sinal explícito e zero sem sinal", () => {
    expect(textoPercentualComSinal(0.0123)).toBe("+1,23%");
    expect(textoPercentualComSinal(-0.0045)).toBe("−0,45%");
    expect(textoPercentualComSinal(-0.00004)).toBe("0,00%");
    expect(direcaoPercentual(-0.00004)).toBe("zero");
  });

  it("pontos percentuais: a fração 0,001 é +0,10 p.p.", () => {
    expect(textoPontosPercentuais(0.001)).toBe("+0,10 p.p.");
    expect(textoPontosPercentuais(-0.001)).toBe("−0,10 p.p.");
    expect(textoPontosPercentuais(0)).toBe("0,00 p.p.");
  });
});

describe("rótulos de eixo", () => {
  it("dinheiro abreviado só para eixos (6.2)", () => {
    expect(textoEixoDinheiro(500)).toBe(`R$${NBSP}500`);
    expect(textoEixoDinheiro(12000)).toBe(`R$${NBSP}12 mil`);
    expect(textoEixoDinheiro(1500000)).toBe(`R$${NBSP}1,5 mi`);
    expect(textoEixoDinheiro(-2500)).toBe(`−R$${NBSP}2,5 mil`);
  });

  it("mês curto", () => {
    expect(mesCurto("2026-04")).toBe("abr/26");
  });
});

describe("participação da distribuição (KB-004, seções 2 e 15)", () => {
  it("só posiciona a vírgula sobre o inteiro de centésimos, sem sinal", () => {
    expect(textoParticipacao(3334)).toBe("33,34%");
    expect(textoParticipacao(10000)).toBe("100,00%");
    expect(textoParticipacao(833)).toBe("8,33%");
    expect(textoParticipacao(0)).toBe("0,00%");
    expect(textoParticipacao(5)).toBe("0,05%");
  });

  it("recusa valor fora de 0 a 10000 ou não inteiro", () => {
    for (const v of [-1, 10001, 1.5]) expect(() => textoParticipacao(v)).toThrow(RangeError);
  });
});
