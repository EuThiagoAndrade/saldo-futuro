import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Concordância entre a KB-004 e o JSON dos casos de referência (D12): cada
// valor esperado precisa aparecer, idêntico, nos dois arquivos.

const RAIZ = process.cwd();
const KB = join(RAIZ, "_project/knowledge/KB-004_regras_financeiras.md");
const JSON_CASOS = join(RAIZ, "tests/fixtures/financeiro/casos_referencia.json");

type Esperado = Record<string, string>;

interface Caso {
  id: string;
  entrega: string;
  esperado: Record<string, unknown>;
}

function textoDoValor(valor: unknown): string {
  return typeof valor === "string" ? valor : JSON.stringify(valor);
}

function esperadosDaKb(markdown: string): Map<string, Esperado> {
  const casos = new Map<string, Esperado>();
  const secoes = markdown.split(/^#### (?=CR-\d{2} )/m).slice(1);
  for (const secao of secoes) {
    const id = secao.slice(0, 5);
    if (casos.has(id)) throw new Error(`${id} repetido na KB`);
    const inicio = secao.indexOf("- **Esperado:**");
    if (inicio < 0) throw new Error(`${id} sem bloco Esperado na KB`);
    const esperado: Esperado = {};
    for (const linha of secao.slice(inicio).split("\n").slice(1)) {
      const item = /^ {2}- `([^`]+)`: `([^`]*)`$/.exec(linha);
      if (!item) {
        if (linha.trim() === "" || linha.startsWith("#")) break;
        throw new Error(`${id}: linha fora do formato no bloco Esperado: ${linha}`);
      }
      if (item[1] in esperado) throw new Error(`${id}: chave ${item[1]} repetida`);
      esperado[item[1]] = item[2];
    }
    casos.set(id, esperado);
  }
  return casos;
}

function esperadosDoJson(casos: Caso[]): Map<string, Esperado> {
  const mapa = new Map<string, Esperado>();
  for (const caso of casos) {
    if (mapa.has(caso.id)) throw new Error(`${caso.id} repetido no JSON`);
    mapa.set(
      caso.id,
      Object.fromEntries(Object.entries(caso.esperado).map(([chave, valor]) => [chave, textoDoValor(valor)])),
    );
  }
  return mapa;
}

function divergencias(kb: Map<string, Esperado>, json: Map<string, Esperado>): string[] {
  const erros: string[] = [];
  for (const id of new Set([...kb.keys(), ...json.keys()])) {
    const a = kb.get(id);
    const b = json.get(id);
    if (!a || !b) {
      erros.push(`${id} só existe ${a ? "na KB" : "no JSON"}`);
      continue;
    }
    for (const chave of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (a[chave] !== b[chave]) erros.push(`${id}.${chave}: KB ${a[chave]} ≠ JSON ${b[chave]}`);
    }
  }
  return erros;
}

const casos = (JSON.parse(readFileSync(JSON_CASOS, "utf8")) as { casos: Caso[] }).casos;
const kb = esperadosDaKb(readFileSync(KB, "utf8"));
const json = esperadosDoJson(casos);

describe("casos de referência da KB-004", () => {
  it("KB e JSON trazem os mesmos casos e os mesmos valores esperados", () => {
    expect(divergencias(kb, json)).toEqual([]);
    expect(kb.size).toBeGreaterThan(0);
  });

  it("todo caso tem entrega conhecida e ao menos um valor esperado", () => {
    for (const caso of casos) {
      expect(["B", "C", "D", "004"]).toContain(caso.entrega);
      expect(Object.keys(caso.esperado).length).toBeGreaterThan(0);
    }
  });

  it("detecta valor esperado divergente, chave ausente e caso ausente", () => {
    const alterado = new Map([...json].map(([id, esperado]) => [id, { ...esperado }]));
    alterado.get("CR-20")!.retorno = "0.009523809523809526";
    delete alterado.get("CR-12")!.vf;
    alterado.delete("CR-50");
    expect(divergencias(kb, alterado)).toEqual([
      "CR-12.vf: KB 1495000 ≠ JSON undefined",
      "CR-20.retorno: KB 0.009523809523809525 ≠ JSON 0.009523809523809526",
      "CR-50 só existe na KB",
    ]);
  });

  it("recusa bloco Esperado fora do formato", () => {
    const quebrado = "#### CR-99 — teste\n\n- **Esperado:**\n  - `a`: 1\n";
    expect(() => esperadosDaKb(quebrado)).toThrow(/fora do formato/);
  });
});
