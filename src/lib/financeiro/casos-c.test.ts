import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { acumulado, anoAteMes, drawdownMaximo, type Retornos, serieBase100 } from "./acumulado";
import { indice, percentual } from "./apresentacao";
import { type Centavos } from "./centavos";
import { criarEstorno, criarTransferencia, type Evento } from "./eventos";
import { dietz, type MesDaCarteira, ND, patrimonio, variacaoDoPatrimonio } from "./rentabilidade";

// Casos de referência da entrega C (KB-004, CR-20 a CR-38), lidos do mesmo JSON da KB.

/* eslint-disable @typescript-eslint/no-explicit-any */
type Json = any;

const casos: Json[] = JSON.parse(
  readFileSync(join(process.cwd(), "tests/fixtures/financeiro/casos_referencia.json"), "utf8"),
).casos;
const casoPorId = new Map(casos.map((c) => [c.id, c]));

/** Centavos e contagens são exatos; razões e índices, com 1e-9 × max(1, |esperado|) (P3). */
function conferir(id: string, obtido: Record<string, unknown>) {
  for (const [chave, esperado] of Object.entries(casoPorId.get(id).esperado)) {
    const valor = obtido[chave];
    if (typeof valor === "bigint") {
      expect(valor, `${id}.${chave}`).toBe(BigInt(esperado as number));
    } else if (typeof esperado === "number" && typeof valor === "number") {
      expect(Math.abs(valor - esperado), `${id}.${chave}: ${valor}`).toBeLessThanOrEqual(1e-9 * Math.max(1, Math.abs(esperado)));
    } else {
      expect(valor, `${id}.${chave}`).toEqual(esperado);
    }
  }
}

function eventosDe(lista: Json[], anteriores: Evento[]): Evento[] {
  const eventos: Evento[] = [];
  for (const e of lista) {
    if (e.tipo === "transferencia") {
      eventos.push(...criarTransferencia(e.id, e.origem, e.destino, e.data, BigInt(e.valor)));
    } else if (e.tipo === "estorno") {
      const referencia = [...anteriores, ...eventos].find((x) => x.id === e.referencia);
      if (!referencia) throw new Error(`referência ausente: ${e.referencia}`);
      eventos.push(criarEstorno(e.id, referencia, e.data, [...anteriores, ...eventos]));
    } else {
      eventos.push({ id: e.id, ativo: "A", data: e.data, tipo: e.tipo, valor: BigInt(e.valor) as Centavos });
    }
  }
  return eventos;
}

function mesDe(entrada: Json): MesDaCarteira {
  const anteriores = eventosDe(entrada.eventos_anteriores ?? [], []);
  return {
    mes: entrada.mes,
    estado: entrada.estado,
    primeiroMes: entrada.primeiro_mes,
    vi: BigInt(entrada.vi),
    vf: BigInt(entrada.vf),
    eventos: eventosDe(entrada.eventos, anteriores),
    eventosAnteriores: anteriores,
  };
}

function avaliarMes(entrada: Json, sufixo = ""): Record<string, unknown> {
  const m = mesDe(entrada);
  const d = dietz(m);
  return {
    [`dias${sufixo}`]: d.dias,
    [`numerador${sufixo}`]: d.numerador,
    [`denominador${sufixo}`]: d.denominador,
    [`retorno${sufixo}`]: d.retorno,
    [`variacao${sufixo}`]: variacaoDoPatrimonio(m),
  };
}

function retornosDe(mapa: Record<string, number | string>): Retornos {
  return mapa as Retornos;
}

describe("casos de referência da entrega C: rentabilidade", () => {
  for (const id of ["CR-20", "CR-21", "CR-22", "CR-23", "CR-24", "CR-25", "CR-27", "CR-28", "CR-29", "CR-31"]) {
    it(`${id}: ${casoPorId.get(id).titulo}`, () => conferir(id, avaliarMes(casoPorId.get(id).entrada)));
  }

  for (const id of ["CR-26", "CR-30"]) {
    it(`${id}: ${casoPorId.get(id).titulo}`, () => {
      const obtido = Object.assign({}, ...casoPorId.get(id).entrada.meses.map((m: Json) => avaliarMes(m, `_${m.chave}`)));
      conferir(id, obtido);
    });
  }

  it("o retorno de N/D nunca é zero e o patrimônio soma o trânsito", () => {
    expect(dietz(mesDe(casoPorId.get("CR-29").entrada)).retorno).toBe(ND);
    expect(patrimonio([805000n, 200000n])).toBe(1005000n);
  });
});

describe("casos de referência da entrega C: acumulado, ano e drawdown", () => {
  for (const id of ["CR-32", "CR-33", "CR-34", "CR-35"]) {
    it(`${id}: ${casoPorId.get(id).titulo}`, () => {
      const { inicio, retornos, consultas } = casoPorId.get(id).entrada;
      const obtido = Object.fromEntries(
        consultas.map((c: Json) => [c.chave, acumulado(retornosDe(retornos), inicio, c.de, c.ate)]),
      );
      conferir(id, obtido);
    });
  }

  it("ano até a data é o acumulado desde janeiro", () => {
    const { inicio, retornos } = casoPorId.get("CR-32").entrada;
    expect(anoAteMes(retornos, inicio, "2026-03")).toBe(acumulado(retornos, inicio, "2026-01", "2026-03"));
  });

  it("CR-36: série base 100 e drawdown", () => {
    const { inicio, retornos, consultas } = casoPorId.get("CR-36").entrada;
    const { de, ate } = consultas[0];
    const serie = serieBase100(retornos, inicio, de, ate) as number[];
    conferir("CR-36", {
      base100_2026_01: serie[0],
      base100_2026_02: serie[1],
      base100_2026_03: serie[2],
      base100_2026_04: serie[3],
      acumulado: acumulado(retornos, inicio, de, ate),
      drawdown_maximo: drawdownMaximo(retornos, inicio, de, ate),
    });
  });

  it("CR-37: drawdown com o primeiro mês negativo e com N/D", () => {
    const [a, b] = casoPorId.get("CR-37").entrada.series;
    conferir("CR-37", {
      base100_a_2026_02: (serieBase100(a.retornos, a.inicio, a.de, a.ate) as number[])[1],
      drawdown_maximo_a: drawdownMaximo(a.retornos, a.inicio, a.de, a.ate),
      drawdown_maximo_b: drawdownMaximo(b.retornos, b.inicio, b.de, b.ate),
    });
  });

  it("série sempre crescente tem drawdown zero", () => {
    expect(drawdownMaximo({ "2026-01": 0.01, "2026-02": 0.02 }, "2025-12", "2026-01", "2026-02")).toBe(0);
  });
});

describe("caso de referência da entrega C: apresentação", () => {
  it("CR-38: arredondamento de apresentação (P4, K10)", () => {
    const { percentuais, indices } = casoPorId.get("CR-38").entrada;
    const obtido: Record<string, string> = {};
    for (const [k, v] of Object.entries(percentuais)) obtido[k] = percentual(v as number);
    for (const [k, v] of Object.entries(indices)) obtido[k] = indice(v as number);
    conferir("CR-38", obtido);
  });

  it("expande expoentes grandes e pequenos", () => {
    expect(indice(1e21)).toBe("1.000.000.000.000.000.000.000,00");
    expect(percentual(-1e-7)).toBe("0,00");
    expect(percentual(-0.005)).toBe("−0,50");
  });
});
