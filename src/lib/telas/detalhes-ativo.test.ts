import { describe, expect, it } from "vitest";
import { lerDetalhes, valorDoIndicador } from "./detalhes-ativo";

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
