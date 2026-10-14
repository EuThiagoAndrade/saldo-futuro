import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  acumuladoBenchmark,
  type Cobertura,
  coberturaAposCarga,
  comparar,
  retornoMensalDiario,
  retornoMensalMensal,
} from "./benchmarks";
import { RecusaFinanceira } from "./centavos";
import { ND } from "./rentabilidade";

// Casos de referência da entrega D (KB-004, CR-40 a CR-48), lidos do mesmo JSON da KB.

/* eslint-disable @typescript-eslint/no-explicit-any */
type Json = any;

const casos: Json[] = JSON.parse(
  readFileSync(join(process.cwd(), "tests/fixtures/financeiro/casos_referencia.json"), "utf8"),
).casos;
const casoPorId = new Map(casos.map((c) => [c.id, c]));

/** Contagens e textos exatos; razões com 1e-9 × max(1, |esperado|) (P3). */
function conferir(id: string, obtido: Record<string, unknown>) {
  for (const [chave, esperado] of Object.entries(casoPorId.get(id).esperado)) {
    const valor = obtido[chave];
    if (typeof esperado === "number" && typeof valor === "number") {
      expect(Math.abs(valor - esperado), `${id}.${chave}: ${valor}`).toBeLessThanOrEqual(1e-9 * Math.max(1, Math.abs(esperado)));
    } else {
      expect(valor, `${id}.${chave}`).toEqual(esperado);
    }
  }
}

const chaveDoMes = (mes: string) => mes.replace("-", "_");

describe("casos de referência da entrega D: séries", () => {
  for (const id of ["CR-40", "CR-42"]) {
    it(`${id}: ${casoPorId.get(id).titulo}`, () => {
      const { valores, cobertura, mes } = casoPorId.get(id).entrada;
      const r = retornoMensalDiario(valores, cobertura, mes);
      conferir(id, { dias_com_valor: r.diasComValor, completo: r.completo, retorno: r.retorno });
    });
  }

  it("CR-41: carga iniciada no meio do mês", () => {
    const { valores, cobertura, meses } = casoPorId.get("CR-41").entrada;
    const obtido: Record<string, unknown> = {};
    for (const mes of meses) {
      const r = retornoMensalDiario(valores, cobertura, mes);
      obtido[`completo_${chaveDoMes(mes)}`] = r.completo;
      obtido[`retorno_${chaveDoMes(mes)}`] = r.retorno;
    }
    conferir("CR-41", obtido);
  });

  it("CR-43: série mensal e acumulado do benchmark", () => {
    const { valores, consultas } = casoPorId.get("CR-43").entrada;
    const retornos = Object.fromEntries(
      ["2026-01", "2026-02", "2026-03"].map((mes) => [mes, retornoMensalMensal(valores, mes)]),
    );
    const obtido: Record<string, unknown> = Object.fromEntries(
      Object.entries(retornos).map(([mes, r]) => [`retorno_${chaveDoMes(mes)}`, r]),
    );
    for (const c of consultas) obtido[c.chave] = acumuladoBenchmark(retornos, c.de, c.ate);
    conferir("CR-43", obtido);
  });

  it("sem cobertura, nenhum mês diário é completo", () => {
    expect(retornoMensalDiario([], null, "2026-01")).toEqual({ diasComValor: 0, completo: false, retorno: ND });
  });
});

describe("casos de referência da entrega D: comparação", () => {
  for (const id of ["CR-44", "CR-45", "CR-46", "CR-47"]) {
    it(`${id}: ${casoPorId.get(id).titulo}`, () => {
      const obtido: Record<string, unknown> = {};
      for (const c of casoPorId.get(id).entrada.comparacoes) {
        const meses = Object.keys(c.carteira).sort();
        const r = comparar(c.carteira, c.benchmark, meses[0], meses.at(-1)!);
        Object.assign(obtido, {
          [`diferenca_${c.chave}`]: r.diferenca,
          [`percentual_${c.chave}`]: r.percentual,
          [`carteira_acumulada_${c.chave}`]: r.carteira,
          [`benchmark_acumulado_${c.chave}`]: r.benchmark,
          [`acertos_${c.chave}`]: r.acertos,
          [`meses_${c.chave}`]: r.meses,
          [`taxa_${c.chave}`]: r.taxaDeAcerto,
        });
      }
      conferir(id, obtido);
    });
  }
});

describe("caso de referência da entrega D: cobertura", () => {
  it("CR-48: cobertura da carga", () => {
    const { cobertura_inicial, passos } = casoPorId.get("CR-48").entrada;
    let cobertura: Cobertura = cobertura_inicial;
    const obtido: Record<string, unknown> = {};
    for (const p of passos) {
      try {
        cobertura = coberturaAposCarga(cobertura, p.data_inicial, p.data_final, p.ultimo_valor);
        obtido[p.chave] = "aceito";
        obtido[`cobertura_apos_${p.chave}`] = `${cobertura.inicio}/${cobertura.fim}`;
      } catch (erro) {
        if (!(erro instanceof RecusaFinanceira)) throw erro;
        obtido[p.chave] = erro.message;
      }
    }
    conferir("CR-48", obtido);
  });

  it("primeira carga vai do início pedido ao último valor", () => {
    expect(coberturaAposCarga(null, "2025-12-01", "2026-01-31", "2026-01-30")).toEqual({ inicio: "2025-12-01", fim: "2026-01-30" });
  });
});
