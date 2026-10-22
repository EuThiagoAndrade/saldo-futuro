import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { RecusaFinanceira } from "./centavos";
import { comporDistribuicao, type Distribuicao, type PosicaoDaDistribuicao, UNIDADES_TOTAIS } from "./distribuicao";

// Distribuição por ativo contra os casos de referência CR-53 a CR-61 (KB-004, seção 15; G1).
// Os esperados vêm do JSON, transcritos do plano do ciclo 010, nunca desta função.

interface PosicaoDoCaso extends PosicaoDaDistribuicao {
  alias: string;
}
interface Caso {
  id: string;
  entrega: string;
  entrada: Record<string, unknown>;
  esperado: Record<string, unknown>;
}

const casos = (JSON.parse(readFileSync(join(process.cwd(), "tests/fixtures/financeiro/casos_referencia.json"), "utf8")) as { casos: Caso[] }).casos;
const daEntrega = casos.filter((c) => c.entrega === "010");

/** Cenários de um caso: sem subcenário (prefixo "") ou s1, s2, s3. */
function cenarios(caso: Caso): { prefixo: string; posicoes: PosicaoDoCaso[] }[] {
  if ("posicoes" in caso.entrada) return [{ prefixo: "", posicoes: caso.entrada.posicoes as PosicaoDoCaso[] }];
  return Object.entries(caso.entrada).map(([nome, cenario]) => ({ prefixo: `${nome}_`, posicoes: (cenario as { posicoes: PosicaoDoCaso[] }).posicoes }));
}

/** O que a função devolve, nas chaves e no formato dos esperados (texto decimal e listas de aliases). */
function obtido(posicoes: PosicaoDoCaso[], d: Distribuicao): Record<string, unknown> {
  const alias = new Map(posicoes.map((p) => [p.id, p.alias]));
  const aliases = (xs: { id: string }[]) => xs.map((x) => alias.get(x.id));
  const r: Record<string, unknown> = {
    base_positiva_centavos: String(d.base),
    patrimonio_liquido_centavos: String(posicoes.reduce((soma, p) => soma + BigInt(p.saldo), 0n)),
    principais: aliases(d.principais),
    componentes_outros: aliases(d.outros?.componentes ?? []),
    sem_percentual: aliases(d.negativos),
    omitidos: aliases(d.omitidos),
  };
  for (const p of d.positivos) r[`participacao_${alias.get(p.id)}_centesimos_pp`] = String(p.participacao);
  if (d.outros) {
    r.outros_centavos = String(d.outros.saldo);
    r.participacao_outros_centesimos_pp = String(d.outros.participacao);
  }
  return r;
}

/** Variações da ordem de entrada: invertida e girada. */
const reordenacoes = <T,>(xs: T[]): T[][] => [xs, [...xs].reverse(), [...xs.slice(1), ...xs.slice(0, 1)]];

describe("casos de referência da distribuição (CR-53 a CR-61)", () => {
  it("o JSON traz os nove casos da entrega 010", () => {
    expect(daEntrega.map((c) => c.id)).toEqual(["CR-53", "CR-54", "CR-55", "CR-56", "CR-57", "CR-58", "CR-59", "CR-60", "CR-61"]);
  });

  for (const caso of daEntrega) {
    it(`${caso.id}: cada valor esperado confere, em qualquer ordem de entrada`, () => {
      const chaves = new Set(Object.keys(caso.esperado));
      for (const { prefixo, posicoes } of cenarios(caso)) {
        for (const ordem of reordenacoes(posicoes)) {
          const r = obtido(posicoes, comporDistribuicao(ordem));
          for (const [chave, esperado] of Object.entries(caso.esperado)) {
            if (!chave.startsWith(prefixo) || (prefixo === "" && /^s\d_/.test(chave))) continue;
            chaves.delete(chave);
            expect(r[chave.slice(prefixo.length)], `${caso.id} ${chave}`).toEqual(esperado);
          }
        }
      }
      // Toda chave esperada foi conferida por algum cenário.
      expect([...chaves], caso.id).toEqual([]);
    });
  }

  it("com positivos, as participações somam 10000 e cada uma difere menos de 0,01 p.p. da exata", () => {
    for (const caso of daEntrega) {
      for (const { posicoes } of cenarios(caso)) {
        const d = comporDistribuicao(posicoes);
        if (d.base === 0n) continue;
        expect(d.positivos.reduce((s, p) => s + p.participacao, 0), caso.id).toBe(Number(UNIDADES_TOTAIS));
        for (const p of d.positivos) {
          const erro = BigInt(p.participacao) * d.base - p.saldo * UNIDADES_TOTAIS;
          expect(erro < d.base && -erro < d.base, `${caso.id} ${p.nome}`).toBe(true);
        }
      }
    }
  });
});

describe("fronteiras e agrupamento", () => {
  const posicao = (n: number, saldo: number, nome = `Ativo ${String(n).padStart(2, "0")}`): PosicaoDaDistribuicao => ({
    id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    nome,
    saldo,
  });

  it("centavos fora dos inteiros seguros são recusados na fronteira", () => {
    expect(() => comporDistribuicao([posicao(1, 9007199254740992)])).toThrow(RecusaFinanceira);
    expect(() => comporDistribuicao([posicao(1, 1.5)])).toThrow(/recusado_faixa/);
  });

  it("cinco positivos não formam Outros; o sexto forma Outros com um componente", () => {
    const cinco = comporDistribuicao([1, 2, 3, 4, 5].map((n) => posicao(n, n * 100)));
    expect(cinco.principais).toHaveLength(5);
    expect(cinco.outros).toBeNull();
    const seis = comporDistribuicao([1, 2, 3, 4, 5, 6].map((n) => posicao(n, n * 100)));
    expect(seis.principais.map((p) => p.saldo)).toEqual([600n, 500n, 400n, 300n, 200n]);
    expect(seis.outros!.componentes.map((p) => p.saldo)).toEqual([100n]);
    expect(seis.outros!.saldo).toBe(100n);
    expect(seis.outros!.participacao).toBe(seis.outros!.componentes[0].participacao);
  });

  it("Outros é a soma exata dos componentes, em dinheiro e em participação", () => {
    const d = comporDistribuicao(Array.from({ length: 12 }, (_, i) => posicao(i + 1, 1000 + i * 37)));
    expect(d.outros!.saldo).toBe(d.outros!.componentes.reduce((s, p) => s + p.saldo, 0n));
    expect(d.outros!.participacao).toBe(d.outros!.componentes.reduce((s, p) => s + p.participacao, 0));
    expect(d.principais.reduce((s, p) => s + p.participacao, 0) + d.outros!.participacao).toBe(10000);
  });

  it("nomes iguais continuam linhas distintas e o desempate usa o UUID em minúsculas", () => {
    const d = comporDistribuicao([
      { id: "00000000-0000-4000-8000-00000000000B", nome: "Mesmo", saldo: 1 },
      { id: "00000000-0000-4000-8000-00000000000a", nome: "Mesmo", saldo: 1 },
    ]);
    expect(d.positivos.map((p) => p.id.slice(-1))).toEqual(["a", "B"]);
    expect(d.positivos.map((p) => p.participacao)).toEqual([5000, 5000]);
  });

  it("negativos saem do mais negativo para o menos negativo; zeros ficam só em omitidos", () => {
    const d = comporDistribuicao([posicao(1, -5), posicao(2, -50), posicao(3, 0), posicao(4, 10)]);
    expect(d.negativos.map((n) => n.saldo)).toEqual([-50n, -5n]);
    expect(d.omitidos.map((o) => o.nome)).toEqual(["Ativo 03"]);
    expect(d.positivos.map((p) => p.participacao)).toEqual([10000]);
  });
});
