import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ClassificacaoIncoerente, comporAlocacao, type Grupo, grupoDoAtivo } from "./alocacao";
import { comporDistribuicao } from "./distribuicao";
import { comporInstituicoes, type GrupoInstitucional, InstituicaoIncoerente } from "./instituicao";
import { comporFronteiraDeClasses, detalharClasse, type GrupoDeClasse, type NoDaTaxonomia, type ProfundidadeDeClasse } from "./niveis";

// Análises por instituição e níveis de classe contra os casos CR-015-01 a CR-015-16 (KB-004, seção
// 15; G1; ciclo 015, issue #152). Os esperados vêm do JSON, calculados à parte do código de produção
// (frações exatas, a partir das regras do plano), nunca destas funções.

interface PosicaoDoCaso {
  alias: string;
  id: string;
  nome: string;
  saldo: number;
  sistema: string | null;
  instituicao_id?: string | null;
  no?: string | null;
}
interface NoDoCaso extends NoDaTaxonomia {
  alias: string;
}
interface Cenario {
  visao: "instituicao" | "classe" | "ativo";
  instituicoes?: { alias: string; id: string; nome: string }[];
  nos?: NoDoCaso[];
  posicoes: PosicaoDoCaso[];
  detalhes?: string[];
}
interface Caso {
  id: string;
  entrega: string;
  entrada: Record<string, unknown>;
  esperado: Record<string, unknown>;
}

const casos = (JSON.parse(readFileSync(join(process.cwd(), "tests/fixtures/financeiro/casos_referencia.json"), "utf8")) as { casos: Caso[] }).casos;
const daEntrega = casos.filter((c) => c.entrega === "015");

const ALIAS_MACRO: Record<Grupo, string> = { caixa: "CX", renda_fixa: "RF", renda_variavel: "RV", exterior: "EX", cripto: "CT", alternativos: "AL", transito: "T", sem_classe: "SC" };

function cenarios(caso: Caso): { prefixo: string; cenario: Cenario }[] {
  if ("visao" in caso.entrada) return [{ prefixo: "", cenario: caso.entrada as unknown as Cenario }];
  return Object.entries(caso.entrada).map(([nome, cenario]) => ({ prefixo: `${nome}_`, cenario: cenario as Cenario }));
}

const reordenacoes = <T,>(xs: T[]): T[][] => [xs, [...xs].reverse(), [...xs.slice(1), ...xs.slice(0, 1)]];

/** Outros nomes de ativo, na mesma ordem relativa: só as visões que não usam nome de ativo os aceitam. */
const comOutrosNomes = (c: Cenario): Cenario => ({ ...c, posicoes: c.posicoes.map((p, i) => ({ ...p, nome: `Outro nome ${i + 10}` })) });

function obtidoInstituicao(c: Cenario): Record<string, unknown> {
  const instituicoes = c.instituicoes!;
  const aliasDoAtivo = new Map(c.posicoes.map((p) => [p.id, p.alias]));
  const aliasDoGrupo = (g: GrupoInstitucional) => (g.tipo === "instituicao" ? instituicoes.find((i) => i.id === g.id)!.alias : g.tipo === "sem_instituicao" ? "SI" : "T");
  const a = comporInstituicoes(
    c.posicoes.map((p) => ({ id: p.id, nome: p.nome, saldo: p.saldo, sistema: p.sistema, instituicao_id: p.instituicao_id ?? null })),
    instituicoes.map(({ id, nome }) => ({ id, nome })),
  );
  const r: Record<string, unknown> = {
    base_positiva_centavos: String(a.base),
    linhas: a.linhas.map((l) => aliasDoGrupo(l.grupo)),
    sem_percentual: a.negativos.map((n) => aliasDoAtivo.get(n.id)),
    omitidos: a.omitidos.map((o) => aliasDoAtivo.get(o.id)),
  };
  for (const l of a.linhas) {
    r[`participacao_${aliasDoGrupo(l.grupo)}_centesimos_pp`] = String(l.participacao);
    r[`saldo_${aliasDoGrupo(l.grupo)}_centavos`] = String(l.saldo);
  }
  return r;
}

function obtidoAtivo(c: Cenario): Record<string, unknown> {
  const alias = new Map(c.posicoes.map((p) => [p.id, p.alias]));
  const d = comporDistribuicao(c.posicoes.map((p) => ({ id: p.id, nome: p.nome, saldo: p.saldo })));
  const r: Record<string, unknown> = { principais: d.principais.map((p) => alias.get(p.id)) };
  for (const p of d.positivos) r[`participacao_${alias.get(p.id)}_centesimos_pp`] = String(p.participacao);
  return r;
}

function obtidoClasse(c: Cenario): Record<string, unknown> {
  const nos = new Map(c.nos!.map((n) => [n.id, n]));
  const aliasDoNo = new Map(c.nos!.map((n) => [n.id, n.alias]));
  const aliasDoAtivo = new Map(c.posicoes.map((p) => [p.id, p.alias]));
  const aliasDoGrupo = (g: GrupoDeClasse) => (g.tipo === "transito" ? "T" : g.tipo === "sem_classe" ? "SC" : g.tipo === "residuo" ? `res_${aliasDoNo.get(g.no!)}` : aliasDoNo.get(g.no!));
  const posicoes = c.posicoes.map((p) => ({ id: p.id, nome: p.nome, saldo: p.saldo, sistema: p.sistema, taxonomia_id: p.no ?? null }));

  const raiz = comporAlocacao(posicoes.map((p) => ({ id: p.id, nome: p.nome, saldo: p.saldo, grupo: grupoDoAtivo(p, nos) })));
  const r: Record<string, unknown> = {
    raiz_linhas: raiz.linhas.map((l) => ALIAS_MACRO[l.grupo]),
    raiz_sem_percentual: raiz.negativos.map((n) => aliasDoAtivo.get(n.id)),
    raiz_omitidos: raiz.omitidos.map((o) => aliasDoAtivo.get(o.id)),
  };
  for (const l of raiz.linhas) r[`raiz_${ALIAS_MACRO[l.grupo]}_centesimos_pp`] = String(l.participacao);

  for (const alias of c.detalhes ?? []) {
    const pai = c.nos!.find((n) => n.alias === alias)!;
    const d = detalharClasse(posicoes, nos, pai.id)!;
    const k = `detalhe_${alias}_`;
    r[`${k}base_centavos`] = String(d.base);
    r[`${k}linhas`] = d.linhas.map((l) => aliasDoGrupo(l.grupo));
    r[`${k}sem_percentual`] = d.negativos.map((n) => aliasDoAtivo.get(n.id));
    r[`${k}caminhos`] = d.linhas.map((l) => l.caminho.map((n) => n.nome).join(" › "));
    for (const l of d.linhas) {
      const a = aliasDoGrupo(l.grupo);
      r[`${k}carteira_${a}_centesimos_pp`] = String(l.participacaoCarteira);
      r[`${k}pai_${a}_centesimos_pp`] = String(l.participacaoPai);
      r[`${k}saldo_${a}_centavos`] = String(l.saldo);
    }
  }
  return r;
}

function obtido(c: Cenario): Record<string, unknown> {
  try {
    const r = c.visao === "instituicao" ? obtidoInstituicao(c) : c.visao === "classe" ? obtidoClasse(c) : obtidoAtivo(c);
    return { ...r, resultado: "aceita" };
  } catch (erro) {
    if (erro instanceof ClassificacaoIncoerente || erro instanceof InstituicaoIncoerente) return { resultado: "recusada" };
    throw erro;
  }
}

describe("casos de referência das análises por instituição e níveis de classe (CR-015-01 a CR-015-16)", () => {
  it("o JSON traz os dezesseis casos da entrega 015", () => {
    expect(daEntrega.map((c) => c.id)).toEqual(Array.from({ length: 16 }, (_, i) => `CR-015-${String(i + 1).padStart(2, "0")}`));
  });

  for (const caso of daEntrega) {
    it(`${caso.id}: cada valor esperado confere, em qualquer ordem de entrada`, () => {
      const chaves = new Set(Object.keys(caso.esperado));
      for (const { prefixo, cenario } of cenarios(caso)) {
        const variantes = cenario.visao === "ativo" ? [cenario] : [cenario, comOutrosNomes(cenario)];
        for (const variante of variantes) {
          for (const posicoes of reordenacoes(variante.posicoes)) {
            const entrada: Cenario = {
              ...variante,
              posicoes,
              instituicoes: variante.instituicoes && [...variante.instituicoes].reverse(),
              nos: variante.nos && [...variante.nos].reverse(),
            };
            const r = obtido(entrada);
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
});

describe("propriedades das fronteiras, dos detalhes e das instituições nos casos", () => {
  const validos = daEntrega.flatMap((caso) => cenarios(caso).map((c) => ({ caso, ...c }))).filter(({ caso, prefixo }) => caso.esperado[`${prefixo}resultado`] !== "recusada");
  const soPositivos = (c: Cenario) => c.posicoes.filter((p) => p.saldo > 0).reduce((s, p) => s + BigInt(p.saldo), 0n);
  const erroMenorQueBase = (participacao: number, saldo: bigint, base: bigint) => {
    const erro = BigInt(participacao) * base - saldo * 10000n;
    return erro < base && -erro < base;
  };

  it("cada positivo entra uma vez em cada fronteira: a base e a soma dos grupos são S, e as participações somam 10000", () => {
    for (const { caso, prefixo, cenario } of validos) {
      if (cenario.visao !== "classe") continue;
      const nos = new Map(cenario.nos!.map((n) => [n.id, n]));
      const posicoes = cenario.posicoes.map((p) => ({ id: p.id, nome: p.nome, saldo: p.saldo, sistema: p.sistema, taxonomia_id: p.no ?? null }));
      for (const profundidade of [2, 3] as ProfundidadeDeClasse[]) {
        const f = comporFronteiraDeClasses(posicoes, nos, profundidade);
        const rotulo = `${caso.id} ${prefixo}profundidade ${profundidade}`;
        expect(f.base, rotulo).toBe(soPositivos(cenario));
        expect(
          f.linhas.reduce((s, l) => s + l.saldo, 0n),
          rotulo,
        ).toBe(f.base);
        if (f.base > 0n) expect(f.linhas.reduce((s, l) => s + l.participacao, 0), rotulo).toBe(10000);
        for (const l of f.linhas) expect(erroMenorQueBase(l.participacao, l.saldo, f.base), `${rotulo} ${l.caminho.map((n) => n.nome).join("/")}`).toBe(true);
      }
    }
  });

  it("cada detalhe reconcilia em valor, soma 10000 localmente, usa a fronteira global e não traz o próprio pai", () => {
    for (const { caso, prefixo, cenario } of validos) {
      if (cenario.visao !== "classe") continue;
      const nos = new Map(cenario.nos!.map((n) => [n.id, n]));
      const posicoes = cenario.posicoes.map((p) => ({ id: p.id, nome: p.nome, saldo: p.saldo, sistema: p.sistema, taxonomia_id: p.no ?? null }));
      for (const alias of cenario.detalhes ?? []) {
        const pai = cenario.nos!.find((n) => n.alias === alias)!;
        const d = detalharClasse(posicoes, nos, pai.id)!;
        const fronteira = comporFronteiraDeClasses(posicoes, nos, (pai.nivel + 1) as ProfundidadeDeClasse);
        const rotulo = `${caso.id} ${prefixo}${alias}`;
        expect(
          d.linhas.reduce((s, l) => s + l.saldo, 0n),
          rotulo,
        ).toBe(d.base);
        if (d.linhas.length) expect(d.linhas.reduce((s, l) => s + l.participacaoPai, 0), rotulo).toBe(10000);
        for (const l of d.linhas) {
          const global = fronteira.linhas.find((x) => x.grupo.tipo === l.grupo.tipo && x.grupo.no === l.grupo.no)!;
          expect(l.participacaoCarteira, rotulo).toBe(global.participacao);
          expect(erroMenorQueBase(l.participacaoPai, l.saldo, d.base), rotulo).toBe(true);
          expect(l.grupo.tipo === "no" && l.grupo.no === pai.id, rotulo).toBe(false);
        }
      }
    }
  });

  it("CR-015-06: os percentuais da carteira de um ramo somam 50,01% e 49,99%, sem corrigir a raiz", () => {
    const caso = daEntrega.find((c) => c.id === "CR-015-06")!;
    const { cenario } = cenarios(caso)[0];
    const nos = new Map(cenario.nos!.map((n) => [n.id, n]));
    const posicoes = cenario.posicoes.map((p) => ({ id: p.id, nome: p.nome, saldo: p.saldo, sistema: p.sistema, taxonomia_id: p.no ?? null }));
    const soma = (alias: string) =>
      detalharClasse(posicoes, nos, cenario.nos!.find((n) => n.alias === alias)!.id)!.linhas.reduce((s, l) => s + l.participacaoCarteira, 0);
    expect([soma("RF"), soma("RV")]).toEqual([5001, 4999]);
  });

  it("as instituições somam 10000 e cada uma difere menos de 0,01 p.p. da exata", () => {
    for (const { caso, prefixo, cenario } of validos) {
      if (cenario.visao !== "instituicao") continue;
      const a = comporInstituicoes(
        cenario.posicoes.map((p) => ({ id: p.id, nome: p.nome, saldo: p.saldo, sistema: p.sistema, instituicao_id: p.instituicao_id ?? null })),
        cenario.instituicoes!.map(({ id, nome }) => ({ id, nome })),
      );
      const rotulo = `${caso.id} ${prefixo}`;
      expect(a.base, rotulo).toBe(soPositivos(cenario));
      expect(
        a.linhas.reduce((s, l) => s + l.saldo, 0n),
        rotulo,
      ).toBe(a.base);
      if (a.base > 0n) expect(a.linhas.reduce((s, l) => s + l.participacao, 0), rotulo).toBe(10000);
      for (const l of a.linhas) expect(erroMenorQueBase(l.participacao, l.saldo, a.base), rotulo).toBe(true);
    }
  });
});
