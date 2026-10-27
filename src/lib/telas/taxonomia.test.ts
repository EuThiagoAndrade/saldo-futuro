import { describe, expect, it } from "vitest";
import { ErroLeitura } from "../leitura";
import { listaFiltrada } from "./combobox";
import { classeAtualDoAtivo, classeDoAtivo, montarTaxonomia, type NoTaxonomia } from "./taxonomia";

// Taxonomia global (ciclo 013, issue #138). Nós fictícios, fora da ordem de leitura de propósito.

const nos: NoTaxonomia[] = [
  { id: "t3", parent_id: "s2", nivel: 3, nome: "Tipo Beta", ordem: 2 },
  { id: "r2", parent_id: null, nivel: 1, nome: "Classe Dois", ordem: 2 },
  { id: "s1", parent_id: "r1", nivel: 2, nome: "Subclasse Ação", ordem: 1 },
  { id: "r1", parent_id: null, nivel: 1, nome: "Classe Um", ordem: 1 },
  { id: "s2", parent_id: "r1", nivel: 2, nome: "Subclasse Dois", ordem: 2 },
  { id: "t2", parent_id: "s2", nivel: 3, nome: "Tipo Alfa", ordem: 1 },
];

describe("montarTaxonomia", () => {
  it("ordena pela hierarquia e pela ordem dos irmãos, com o caminho completo como nome", () => {
    expect(montarTaxonomia(nos).opcoes).toEqual([
      { id: "r1", nome: "Classe Um" },
      { id: "s1", nome: "Classe Um › Subclasse Ação" },
      { id: "s2", nome: "Classe Um › Subclasse Dois" },
      { id: "t2", nome: "Classe Um › Subclasse Dois › Tipo Alfa" },
      { id: "t3", nome: "Classe Um › Subclasse Dois › Tipo Beta" },
      { id: "r2", nome: "Classe Dois" },
    ]);
  });

  it("devolve o caminho e o nome de cada nó, e nada para um nó inexistente", () => {
    const t = montarTaxonomia(nos);
    expect(t.caminho("t2")).toBe("Classe Um › Subclasse Dois › Tipo Alfa");
    expect(t.nome("t2")).toBe("Tipo Alfa");
    expect(t.nome("r2")).toBe("Classe Dois");
    expect(t.caminho("x")).toBeUndefined();
    expect(t.nome("x")).toBeUndefined();
  });

  it("aceita uma árvore vazia", () => {
    expect(montarTaxonomia([]).opcoes).toEqual([]);
  });

  it("recusa a árvore incoerente como erro de leitura, nunca como classe ausente", () => {
    const [primeiro, ...resto] = nos;
    for (const incoerente of [
      [...nos, nos[0]],
      [...resto, { ...primeiro, parent_id: "inexistente" }],
      [...resto, { ...primeiro, parent_id: "r1" }],
      [...resto, { ...primeiro, nivel: 4 }],
      [...resto, { ...primeiro, parent_id: null }],
      [{ id: "a", parent_id: "b", nivel: 2, nome: "A", ordem: 1 }, { id: "b", parent_id: "a", nivel: 2, nome: "B", ordem: 1 }],
    ]) {
      expect(() => montarTaxonomia(incoerente)).toThrow(ErroLeitura);
    }
  });

  it("a busca pelo ancestral, sem acento e sem caixa, lista todos os descendentes", () => {
    const { opcoes } = montarTaxonomia(nos);
    expect(listaFiltrada({ opcoes }, "CLASSE um").map((o) => o.id)).toEqual(["r1", "s1", "s2", "t2", "t3"]);
    expect(listaFiltrada({ opcoes }, "subclasse acao").map((o) => o.id)).toEqual(["s1"]);
    expect(listaFiltrada({ opcoes }, "tipo").map((o) => o.id)).toEqual(["t2", "t3"]);
    // Sem criação: texto sem correspondência não oferece nada.
    expect(listaFiltrada({ opcoes }, "inexistente")).toEqual([]);
  });

  it("ordena irmãos pela ordem numérica, inclusive acima de 9, e distingue o mesmo nome sob pais diferentes", () => {
    // Como na árvore ampliada no ciclo 014 (issue #144): filhos acrescentados depois dos antigos, com ordem de
    // dois dígitos, e nomes repetidos em pais distintos.
    const ampliada: NoTaxonomia[] = [
      ...nos,
      { id: "t10", parent_id: "s2", nivel: 3, nome: "Tipo Dez", ordem: 10 },
      { id: "t9", parent_id: "s2", nivel: 3, nome: "Tipo Nove", ordem: 9 },
      { id: "s3", parent_id: "r2", nivel: 2, nome: "Subclasse Dois", ordem: 1 },
    ];
    const t = montarTaxonomia(ampliada);
    expect(t.opcoes.map((o) => o.id)).toEqual(["r1", "s1", "s2", "t2", "t3", "t9", "t10", "r2", "s3"]);
    expect(t.caminho("s2")).toBe("Classe Um › Subclasse Dois");
    expect(t.caminho("s3")).toBe("Classe Dois › Subclasse Dois");
  });
});

describe("classeDoAtivo", () => {
  const t = montarTaxonomia(nos);
  const legado = new Map([["c1", "Fundos"]]);

  it("mostra só o nome do nó escolhido, de qualquer nível", () => {
    expect(classeDoAtivo({ taxonomia_id: "t2", classe_id: null }, t, legado)).toBe("Tipo Alfa");
    expect(classeDoAtivo({ taxonomia_id: "r2", classe_id: "c1" }, t, legado)).toBe("Classe Dois");
  });

  it("sem nó, mostra Sem classe com a dica do legado; sem legado, nada", () => {
    expect(classeDoAtivo({ taxonomia_id: null, classe_id: "c1" }, t, legado)).toBe("Sem classe (antes: Fundos)");
    expect(classeDoAtivo({ taxonomia_id: null, classe_id: null }, t, legado)).toBeNull();
    expect(classeDoAtivo({ taxonomia_id: null, classe_id: "c9" }, t, legado)).toBeNull();
  });

  it("nó inexistente é erro de leitura, não Sem classe", () => {
    expect(() => classeDoAtivo({ taxonomia_id: "x", classe_id: null }, t, legado)).toThrow(ErroLeitura);
  });
});

describe("classeAtualDoAtivo", () => {
  const t = montarTaxonomia(nos);
  const legado = new Map([["c1", "Fundos"]]);

  it("mostra o caminho completo, ou Sem classe com a dica do legado", () => {
    expect(classeAtualDoAtivo({ taxonomia_id: "t3", classe_id: null }, t, legado)).toBe("Classe Um › Subclasse Dois › Tipo Beta");
    expect(classeAtualDoAtivo({ taxonomia_id: null, classe_id: "c1" }, t, legado)).toBe("Sem classe (antes: Fundos)");
    expect(classeAtualDoAtivo({ taxonomia_id: null, classe_id: null }, t, legado)).toBe("Sem classe");
    expect(() => classeAtualDoAtivo({ taxonomia_id: "x", classe_id: null }, t, legado)).toThrow(ErroLeitura);
  });
});
