import { describe, expect, it } from "vitest";
import { aparar, lerDetalhes, lerNome, valorDoIndicador } from "./detalhes-ativo";

// Campos descritivos do ativo (ciclo 012, issue #128; classe como nó da taxonomia, ciclo 013, issue
// #138). Nomes fictícios.

const ID = "00000000-0000-4000-8000-000000000001";
const formulario = (campos: Record<string, string>) => {
  const dados = new FormData();
  for (const [nome, valor] of Object.entries(campos)) dados.set(nome, valor);
  return dados;
};

describe("lerDetalhes", () => {
  it("sem nenhum campo, tudo é não informado", () => {
    expect(lerDetalhes(new FormData())).toEqual({
      parametros: {
        p_instituicao: null,
        p_instituicao_nova: null,
        p_taxonomia: null,
        p_previdencia: null,
        p_liquidez_imediata: null,
        p_exposicao_cambial: null,
        p_isento_ir: null,
      },
    });
  });

  it("lê as referências, o nome novo da instituição sem espaços nas pontas e os três estados dos indicadores", () => {
    const lido = lerDetalhes(
      formulario({ instituicaoNova: "  Banco Fictício ", taxonomia: ID, previdencia: "sim", liquidezImediata: "nao", exposicaoCambial: "", isentoIr: "sim" }),
    );
    expect(lido).toEqual({
      parametros: {
        p_instituicao: null,
        p_instituicao_nova: "Banco Fictício",
        p_taxonomia: ID,
        p_previdencia: true,
        p_liquidez_imediata: false,
        p_exposicao_cambial: null,
        p_isento_ir: true,
      },
    });
  });

  it("recusa referência que não é ID, nome novo longo e valor de indicador desconhecido", () => {
    expect(lerDetalhes(formulario({ instituicao: "x" }))).toEqual({ erro: "Escolha uma instituição da lista ou cadastre uma nova." });
    expect(lerDetalhes(formulario({ taxonomia: "x" }))).toEqual({ erro: "Escolha uma classe da lista." });
    expect(lerDetalhes(formulario({ instituicaoNova: "x".repeat(101) }))).toEqual({ erro: "Use até 100 caracteres no nome da instituição." });
    expect(lerDetalhes(formulario({ isentoIr: "talvez" }))).toEqual({ erro: "Escolha Sim, Não ou Não informado." });
  });
});

describe("classe como texto, sem nó escolhido", () => {
  it("nunca vira classe: o nome digitado e os campos antigos de classe são ignorados", () => {
    const lido = lerDetalhes(formulario({ classe: ID, classeNova: "Classe Fictícia", taxonomiaTexto: "Renda fixa" }));
    expect(lido).toEqual({ parametros: expect.objectContaining({ p_taxonomia: null }) });
    expect(JSON.stringify(lido)).not.toContain("Classe Fictícia");
    expect(JSON.stringify(lido)).not.toContain(ID);
  });

  it("limpar a classe (vazio) é permitido", () => {
    expect(lerDetalhes(formulario({ taxonomia: "" }))).toEqual({ parametros: expect.objectContaining({ p_taxonomia: null }) });
  });
});

describe("valorDoIndicador", () => {
  it("nunca trata não informado como não", () => {
    expect(valorDoIndicador(true)).toBe("sim");
    expect(valorDoIndicador(false)).toBe("nao");
    expect(valorDoIndicador(null)).toBe("");
  });
});

// Nome na edição (ciclo 015, issue #153): a semântica do banco, `btrim` de espaço comum e de 1 a 100
// caracteres Unicode, numa função só (lição de 2026-10-18).
describe("lerNome", () => {
  const nome = (valor: string | null) => lerNome(valor === null ? new FormData() : formulario({ nome: valor }));

  it("tira só o espaço comum das pontas e guarda o resto como veio", () => {
    expect(nome("  CDB fictício  ")).toEqual({ nome: "CDB fictício" });
    expect(nome("Conta  com   espaços internos")).toEqual({ nome: "Conta  com   espaços internos" });
    expect(nome("Ação Fictícia")).toEqual({ nome: "Ação Fictícia" });
  });

  it("NBSP, tabulação, quebra de linha e BOM nas pontas ficam, como no btrim do banco", () => {
    for (const borda of [" ", "\t", "\n", "\r", "﻿"]) {
      expect(nome(`${borda}Ativo${borda}`), JSON.stringify(borda)).toEqual({ nome: `${borda}Ativo${borda}` });
    }
  });

  it("ausente, vazio ou só espaços comuns pedem o nome; só NBSP é um nome válido de um caractere", () => {
    for (const valor of [null, "", "   "]) expect(nome(valor)).toEqual({ erro: "Informe o nome do ativo." });
    expect(nome(" ")).toEqual({ nome: " " });
  });

  it("aceita 100 caracteres e recusa 101, contando caracteres Unicode e não unidades UTF-16", () => {
    expect(nome("a".repeat(100))).toEqual({ nome: "a".repeat(100) });
    expect(nome("a".repeat(101))).toEqual({ erro: "Use até 100 caracteres." });
    // 100 caracteres fora do plano básico ocupam 200 unidades UTF-16 e continuam válidos.
    expect(nome("😀".repeat(100))).toEqual({ nome: "😀".repeat(100) });
    expect(nome("😀".repeat(101))).toEqual({ erro: "Use até 100 caracteres." });
    // Os espaços das pontas não contam: 100 caracteres depois do btrim.
    expect(nome(` ${"a".repeat(100)} `)).toEqual({ nome: "a".repeat(100) });
  });

  it("aparar remove só U+0020", () => {
    expect(aparar("  a b  ")).toBe("a b");
    expect(aparar(" a ")).toBe(" a ");
  });
});
