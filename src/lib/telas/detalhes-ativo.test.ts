import { describe, expect, it } from "vitest";
import { lerDetalhes, valorDoIndicador } from "./detalhes-ativo";

// Campos descritivos do ativo (ciclo 012, issue #128). Nomes fictícios.

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
        p_classe: null,
        p_classe_nova: null,
        p_previdencia: null,
        p_liquidez_imediata: null,
        p_exposicao_cambial: null,
        p_isento_ir: null,
      },
    });
  });

  it("lê referências, nomes novos sem espaços nas pontas e os três estados dos indicadores", () => {
    const lido = lerDetalhes(
      formulario({ instituicao: ID, classeNova: "  Classe Fictícia ", previdencia: "sim", liquidezImediata: "nao", exposicaoCambial: "", isentoIr: "sim" }),
    );
    expect(lido).toEqual({
      parametros: {
        p_instituicao: ID,
        p_instituicao_nova: null,
        p_classe: null,
        p_classe_nova: "Classe Fictícia",
        p_previdencia: true,
        p_liquidez_imediata: false,
        p_exposicao_cambial: null,
        p_isento_ir: true,
      },
    });
  });

  it("recusa referência que não é ID, nome novo longo e valor de indicador desconhecido", () => {
    expect(lerDetalhes(formulario({ instituicao: "x" }))).toEqual({ erro: "Escolha uma instituição da lista ou cadastre uma nova." });
    expect(lerDetalhes(formulario({ classe: "x" }))).toEqual({ erro: "Escolha uma classe da lista ou cadastre uma nova." });
    expect(lerDetalhes(formulario({ instituicaoNova: "x".repeat(101) }))).toEqual({ erro: "Use até 100 caracteres no nome da instituição." });
    expect(lerDetalhes(formulario({ isentoIr: "talvez" }))).toEqual({ erro: "Escolha Sim, Não ou Não informado." });
  });
});

describe("valorDoIndicador", () => {
  it("nunca trata não informado como não", () => {
    expect(valorDoIndicador(true)).toBe("sim");
    expect(valorDoIndicador(false)).toBe("nao");
    expect(valorDoIndicador(null)).toBe("");
  });
});
