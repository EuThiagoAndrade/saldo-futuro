import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { RecusaFinanceira } from "./centavos";
import { lerQuantia } from "./quantias";

// CR-50 (KB-004, seção 10), lido do mesmo JSON da KB.

/* eslint-disable @typescript-eslint/no-explicit-any */
const caso: any = JSON.parse(
  readFileSync(join(process.cwd(), "tests/fixtures/financeiro/casos_referencia.json"), "utf8"),
).casos.find((c: any) => c.id === "CR-50");

function resultado(texto: string): number | string {
  try {
    return Number(lerQuantia(texto));
  } catch (erro) {
    if (!(erro instanceof RecusaFinanceira)) throw erro;
    return erro.motivo === "faixa" ? "recusado_faixa" : "recusado";
  }
}

describe("CR-50 — parser de quantias", () => {
  for (const [chave, texto] of Object.entries<string>(caso.entrada.textos)) {
    it(`${chave}: ${JSON.stringify(texto)}`, () => {
      expect(resultado(texto)).toEqual(caso.esperado[chave]);
    });
  }

  it("recusa o defeito O13 da origem em vez de ler 123456", () => {
    expect(() => lerQuantia("1234.56")).toThrow(RecusaFinanceira);
  });

  it("devolve bigint exato no limite da faixa", () => {
    expect(lerQuantia("90.071.992.547.409,91")).toBe(9007199254740991n);
  });
});
