import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { textoDinheiro } from "../apresentacao/valores";
import { type Alocacao, ClassificacaoIncoerente, comporAlocacao, GRUPOS, type Grupo, grupoDoAtivo, type NoDaArvore } from "./alocacao";
import { RecusaFinanceira } from "./centavos";
import { UNIDADES_TOTAIS } from "./distribuicao";

// Alocação por classe macro contra os casos de referência CR-C01 a CR-C12 (KB-004, seção 15; G1;
// ciclo 013, issue #139). Os esperados vêm do JSON, transcritos do plano do ciclo 013, nunca desta
// função.

interface PosicaoDoCaso {
  alias: string;
  id: string;
  nome: string;
  saldo: number;
  sistema: string | null;
  no: string | null;
}
interface Caso {
  id: string;
  entrega: string;
  entrada: Record<string, unknown>;
  esperado: Record<string, unknown>;
}

const casos = (JSON.parse(readFileSync(join(process.cwd(), "tests/fixtures/financeiro/casos_referencia.json"), "utf8")) as { casos: Caso[] }).casos;
const daEntrega = casos.filter((c) => c.entrega === "013");

const no = (codigo: string) => `a5000000-0000-4000-8000-000000${codigo}`;
// Os nós usados pelos casos, com os mesmos pais e níveis do catálogo (migração do ciclo 013).
const ARVORE: NoDaArvore[] = [
  ...["010000", "020000", "030000", "040000", "050000", "060000"].map((c) => ({ id: no(c), parent_id: null, nivel: 1 })),
  { id: no("010100"), parent_id: no("010000"), nivel: 2 },
  { id: no("020200"), parent_id: no("020000"), nivel: 2 },
  { id: no("020201"), parent_id: no("020200"), nivel: 3 },
  { id: no("030100"), parent_id: no("030000"), nivel: 2 },
  { id: no("030101"), parent_id: no("030100"), nivel: 3 },
  { id: no("040300"), parent_id: no("040000"), nivel: 2 },
  { id: no("050200"), parent_id: no("050000"), nivel: 2 },
  { id: no("050202"), parent_id: no("050200"), nivel: 3 },
  { id: no("060100"), parent_id: no("060000"), nivel: 2 },
];
const NOS = new Map(ARVORE.map((n) => [n.id, n]));
const ALIAS: Record<Grupo, string> = {
  caixa: "CX",
  renda_fixa: "RF",
  renda_variavel: "RV",
  exterior: "EX",
  cripto: "CT",
  alternativos: "AL",
  transito: "T",
  sem_classe: "SC",
};

function cenarios(caso: Caso): { prefixo: string; posicoes: PosicaoDoCaso[] }[] {
  if ("posicoes" in caso.entrada) return [{ prefixo: "", posicoes: caso.entrada.posicoes as PosicaoDoCaso[] }];
  return Object.entries(caso.entrada).map(([nome, cenario]) => ({ prefixo: `${nome}_`, posicoes: (cenario as { posicoes: PosicaoDoCaso[] }).posicoes }));
}

const alocar = (posicoes: PosicaoDoCaso[]) =>
  comporAlocacao(posicoes.map((p) => ({ id: p.id, nome: p.nome, saldo: p.saldo, grupo: grupoDoAtivo({ sistema: p.sistema, taxonomia_id: p.no }, NOS) })));

/** O que a função devolve, nas chaves e no formato dos esperados. */
function obtido(posicoes: PosicaoDoCaso[], a: Alocacao): Record<string, unknown> {
  const alias = new Map(posicoes.map((p) => [p.id, p.alias]));
  const r: Record<string, unknown> = {
    base_positiva_centavos: String(a.base),
    patrimonio_liquido_centavos: String(posicoes.reduce((soma, p) => soma + BigInt(p.saldo), 0n)),
    linhas: a.linhas.map((l) => ALIAS[l.grupo]),
    sem_percentual: a.negativos.map((n) => alias.get(n.id)),
    omitidos: a.omitidos.map((o) => alias.get(o.id)),
  };
  for (const l of a.linhas) {
    r[`participacao_${ALIAS[l.grupo]}_centesimos_pp`] = String(l.participacao);
    r[`saldo_${ALIAS[l.grupo]}_centavos`] = String(l.saldo);
  }
  return r;
}

const reordenacoes = <T,>(xs: T[]): T[][] => [xs, [...xs].reverse(), [...xs.slice(1), ...xs.slice(0, 1)]];

describe("casos de referência da alocação por classe macro (CR-C01 a CR-C12)", () => {
  it("o JSON traz os doze casos da entrega 013", () => {
    expect(daEntrega.map((c) => c.id)).toEqual(Array.from({ length: 12 }, (_, i) => `CR-C${String(i + 1).padStart(2, "0")}`));
  });

  for (const caso of daEntrega) {
    it(`${caso.id}: cada valor esperado confere, em qualquer ordem de entrada e com outros nomes`, () => {
      const chaves = new Set(Object.keys(caso.esperado));
      for (const { prefixo, posicoes } of cenarios(caso)) {
        // Os nomes não decidem nada nesta visão: trocá-los não muda o resultado.
        for (const variante of [posicoes, posicoes.map((p, i) => ({ ...p, nome: `Outro nome ${posicoes.length - i}` }))]) {
          for (const ordem of reordenacoes(variante)) {
            const r = obtido(variante, alocar(ordem));
            for (const [chave, esperado] of Object.entries(caso.esperado)) {
              if (!chave.startsWith(prefixo) || (prefixo === "" && /^s\d_/.test(chave))) continue;
              chaves.delete(chave);
              expect(r[chave.slice(prefixo.length)], `${caso.id} ${chave}`).toEqual(esperado);
            }
          }
        }
      }
      expect([...chaves], caso.id).toEqual([]);
    });
  }

  it("com positivos, as linhas somam 10000 e cada uma difere menos de 0,01 p.p. da exata", () => {
    for (const caso of daEntrega) {
      for (const { posicoes } of cenarios(caso)) {
        const a = alocar(posicoes);
        if (a.base === 0n) continue;
        expect(a.linhas.reduce((s, l) => s + l.participacao, 0), caso.id).toBe(Number(UNIDADES_TOTAIS));
        for (const l of a.linhas) {
          const erro = BigInt(l.participacao) * a.base - l.saldo * UNIDADES_TOTAIS;
          expect(erro < a.base && -erro < a.base, `${caso.id} ${l.grupo}`).toBe(true);
        }
      }
    }
  });

  it("CR-C12: o valor da linha acima do inteiro seguro é formatado exatamente", () => {
    const caso = daEntrega.find((c) => c.id === "CR-C12")!;
    const rf = alocar(cenarios(caso)[0].posicoes).linhas.find((l) => l.grupo === "renda_fixa")!;
    expect(textoDinheiro(rf.saldo)).toBe("R$ 180.143.985.094.819,82");
  });
});

describe("linha de cada ativo", () => {
  it("o trânsito tem precedência, vínculo nulo é Sem classe e qualquer nível sobe até a classe macro", () => {
    expect(grupoDoAtivo({ sistema: "transito", taxonomia_id: null }, NOS)).toBe("transito");
    expect(grupoDoAtivo({ sistema: "transito", taxonomia_id: no("020000") }, NOS)).toBe("transito");
    expect(grupoDoAtivo({ sistema: null, taxonomia_id: null }, NOS)).toBe("sem_classe");
    expect(grupoDoAtivo({ sistema: null, taxonomia_id: no("020000") }, NOS)).toBe("renda_fixa");
    expect(grupoDoAtivo({ sistema: null, taxonomia_id: no("040300") }, NOS)).toBe("exterior");
    expect(grupoDoAtivo({ sistema: null, taxonomia_id: no("050202") }, NOS)).toBe("cripto");
  });

  it("nó inexistente ou caminho inválido é erro, nunca Sem classe", () => {
    const quebrada = new Map(NOS);
    quebrada.set(no("070100"), { id: no("070100"), parent_id: no("070000"), nivel: 2 });
    quebrada.set(no("070000"), { id: no("070000"), parent_id: null, nivel: 1 });
    quebrada.set(no("020299"), { id: no("020299"), parent_id: no("020000"), nivel: 3 });
    for (const taxonomia_id of [no("999999"), no("070100"), no("020299")]) {
      expect(() => grupoDoAtivo({ sistema: null, taxonomia_id }, quebrada)).toThrow(ClassificacaoIncoerente);
    }
  });
});

describe("fronteiras", () => {
  const p = (n: number, saldo: number, grupo: Grupo) => ({ id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`, nome: `Ativo ${n}`, saldo, grupo });

  it("centavos fora dos inteiros seguros, fracionários ou NaN são recusados", () => {
    for (const saldo of [9007199254740992, 1.5, Number.NaN]) expect(() => comporAlocacao([p(1, saldo, "renda_fixa")])).toThrow(RecusaFinanceira);
  });

  it("negativo num ativo sem classe fica à parte; zeros em todas as linhas não formam linha", () => {
    const a = comporAlocacao([p(1, -10, "sem_classe"), ...GRUPOS.map((g, i) => p(i + 2, 0, g))]);
    expect(a.base).toBe(0n);
    expect(a.linhas).toEqual([]);
    expect(a.negativos.map((n) => n.grupo)).toEqual(["sem_classe"]);
    expect(a.omitidos).toHaveLength(GRUPOS.length);
  });

  it("ativos desativados com posição em M contam como os demais", () => {
    // A função não distingue desativados: quem chama passa todas as posições de M.
    const a = comporAlocacao([p(1, 300, "renda_fixa"), p(2, 100, "renda_fixa")]);
    expect(a.linhas).toEqual([{ grupo: "renda_fixa", saldo: 400n, participacao: 10000 }]);
  });
});
