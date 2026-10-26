import { describe, expect, it } from "vitest";
import { mensagemDeRecusa } from "./carteira";
import { linhasDoCatalogo, textoDeUso } from "./catalogos";

// Catálogo de instituições (ciclo 012, issue #127; sem classes desde o ciclo 013, issue #138). Nomes fictícios.

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

  it("conta os ativos que usam cada instituição", () => {
    const vinculos = [{ instituicao_id: "b" }, { instituicao_id: "b" }, { instituicao_id: null }, { instituicao_id: "a" }];
    expect(Object.fromEntries(linhasDoCatalogo("instituicoes", entradas, vinculos).map((l) => [l.id, l.usos]))).toEqual({
      a: 1,
      b: 2,
      c: 0,
      d: 0,
    });
  });
});

describe("textoDeUso", () => {
  it("diz se a entrada tem ativos, com singular e plural", () => {
    expect(textoDeUso(0)).toBe("Sem ativos");
    expect(textoDeUso(1)).toBe("Usada em 1 ativo");
    expect(textoDeUso(12)).toBe("Usada em 12 ativos");
  });
});

describe("recusas do catálogo e da classe do ativo", () => {
  it("traduz os motivos novos do banco", () => {
    expect(mensagemDeRecusa({ message: "recusado_nome_repetido" })).toBe("Esse nome já está cadastrado.");
    expect(mensagemDeRecusa({ message: "recusado_nome" })).toBe("Informe um nome de 1 a 100 caracteres.");
    expect(mensagemDeRecusa({ message: "recusado_em_uso" })).toBe(
      "Só é possível excluir sem nenhum ativo vinculado, em uso ou desativado.",
    );
    expect(mensagemDeRecusa({ message: "recusado_instituicao_inexistente" })).toBe("Instituição não encontrada.");
    expect(mensagemDeRecusa({ message: "recusado_taxonomia_inexistente" })).toBe("Classe não encontrada. Escolha uma da lista.");
  });
});
