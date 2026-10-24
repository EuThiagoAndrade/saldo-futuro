import { describe, expect, it } from "vitest";
import { mensagemDeRecusa } from "./carteira";
import { linhasDoCatalogo, textoDeUso } from "./catalogos";

// Catálogos de instituições e classes (ciclo 012, issue #127). Nomes fictícios.

const entradas = [
  { id: "c", nome: "Renda variável" },
  { id: "a", nome: "Ações fictícias" },
  { id: "b", nome: "Banco Exemplo" },
  { id: "d", nome: "acao minúscula" },
];

describe("linhasDoCatalogo", () => {
  it("ordena pelo nome em pt-BR, sem diferenciar caixa nem acento na ordem", () => {
    expect(linhasDoCatalogo("instituicoes", entradas, []).map((l) => l.nome)).toEqual([
      "acao minúscula",
      "Ações fictícias",
      "Banco Exemplo",
      "Renda variável",
    ]);
  });

  it("conta os ativos que usam cada entrada pela coluna do catálogo", () => {
    const vinculos = [
      { instituicao_id: "b", classe_id: "c" },
      { instituicao_id: "b", classe_id: null },
      { instituicao_id: null, classe_id: "c" },
      { instituicao_id: "a", classe_id: "c" },
    ];
    const usos = (tipo: "instituicoes" | "classes") =>
      Object.fromEntries(linhasDoCatalogo(tipo, entradas, vinculos).map((l) => [l.id, l.usos]));
    expect(usos("instituicoes")).toEqual({ a: 1, b: 2, c: 0, d: 0 });
    expect(usos("classes")).toEqual({ a: 0, b: 0, c: 3, d: 0 });
  });
});

describe("textoDeUso", () => {
  it("diz se a entrada tem ativos, com singular e plural", () => {
    expect(textoDeUso(0)).toBe("Sem ativos");
    expect(textoDeUso(1)).toBe("Usada em 1 ativo");
    expect(textoDeUso(12)).toBe("Usada em 12 ativos");
  });
});

describe("recusas dos catálogos", () => {
  it("traduz os motivos novos do banco", () => {
    expect(mensagemDeRecusa({ message: "recusado_nome_repetido" })).toBe("Esse nome já está cadastrado.");
    expect(mensagemDeRecusa({ message: "recusado_nome" })).toBe("Informe um nome de 1 a 100 caracteres.");
    expect(mensagemDeRecusa({ message: "recusado_em_uso" })).toBe(
      "Só é possível excluir sem nenhum ativo vinculado, em uso ou desativado.",
    );
    expect(mensagemDeRecusa({ message: "recusado_instituicao_inexistente" })).toBe("Instituição não encontrada.");
    expect(mensagemDeRecusa({ message: "recusado_classe_inexistente" })).toBe("Classe não encontrada.");
  });
});
