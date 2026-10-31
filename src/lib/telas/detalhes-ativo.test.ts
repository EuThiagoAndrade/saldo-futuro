import { describe, expect, it } from "vitest";
import {
  algumAtributoInformado,
  alternarNoConjunto,
  aparar,
  EXCLUSIVOS_INDEXADOR,
  EXCLUSIVOS_VEICULO,
  INDEXADORES_REMUNERACAO,
  lerAtributos,
  lerDetalhes,
  lerNome,
  valorDoIndicador,
  VEICULOS_ACESSO,
} from "./detalhes-ativo";

// Campos descritivos do ativo (ciclo 012, issue #128; classe como nó da taxonomia, ciclo 013, issue
// #138). Nomes fictícios.

const ID = "00000000-0000-4000-8000-000000000001";
const formulario = (campos: Record<string, string | string[]>) => {
  const dados = new FormData();
  for (const [nome, valor] of Object.entries(campos)) for (const v of [valor].flat()) dados.append(nome, v);
  return dados;
};
const SEM_ATRIBUTOS = {
  p_veiculos_acesso: [],
  p_indexadores_remuneracao: [],
  p_regime_tributario: null,
  p_prazo_resgate_tipo: null,
  p_prazo_resgate_dias: null,
  p_prazo_resgate_unidade: null,
  p_cobertura_fgc: null,
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
        ...SEM_ATRIBUTOS,
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
        ...SEM_ATRIBUTOS,
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

// Atributos complementares (ciclo 017, issue #173): catálogos do banco, conjuntos sem repetição na
// ordem do catálogo, exclusivos recusados (nunca descartados) e prazo sem conversão.
describe("lerAtributos", () => {
  const atributos = (campos: Record<string, string | string[]>) => lerAtributos(formulario(campos));

  it("sem nenhum campo, tudo é não informado: conjuntos vazios e escalares nulos", () => {
    expect(atributos({})).toEqual({
      atributos: {
        veiculos_acesso: [],
        indexadores_remuneracao: [],
        regime_tributario: null,
        prazo_resgate_tipo: null,
        prazo_resgate_dias: null,
        prazo_resgate_unidade: null,
        cobertura_fgc: null,
      },
    });
  });

  it("lê seleções múltiplas na ordem do catálogo, sem repetição, e os escalares", () => {
    expect(
      atributos({
        veiculo: ["etf", "fundo", "etf"],
        indexador: ["inpc", "cdi", "variacao_cambial"],
        regime: "previdencia_regressivo",
        prazoTipo: "prazo",
        prazoDias: "30",
        prazoUnidade: "corridos",
        fgc: "nao_aplicavel",
      }),
    ).toEqual({
      atributos: {
        veiculos_acesso: ["fundo", "etf"],
        indexadores_remuneracao: ["cdi", "variacao_cambial", "inpc"],
        regime_tributario: "previdencia_regressivo",
        prazo_resgate_tipo: "prazo",
        prazo_resgate_dias: 30,
        prazo_resgate_unidade: "corridos",
        cobertura_fgc: "nao_aplicavel",
      },
    });
  });

  it("zero dias é valor, com unidade, e o limite do banco é aceito", () => {
    expect(atributos({ prazoTipo: "prazo", prazoDias: "0", prazoUnidade: "uteis" })).toEqual({
      atributos: expect.objectContaining({ prazo_resgate_tipo: "prazo", prazo_resgate_dias: 0, prazo_resgate_unidade: "uteis" }),
    });
    expect(atributos({ prazoTipo: "prazo", prazoDias: "2147483647", prazoUnidade: "corridos" })).toEqual({
      atributos: expect.objectContaining({ prazo_resgate_dias: 2147483647 }),
    });
  });

  it("situações sem número não levam dias nem unidade", () => {
    for (const tipo of ["no_vencimento", "sem_prazo_estimavel", "nao_aplicavel"]) {
      expect(atributos({ prazoTipo: tipo })).toEqual({
        atributos: expect.objectContaining({ prazo_resgate_tipo: tipo, prazo_resgate_dias: null, prazo_resgate_unidade: null }),
      });
    }
    expect(atributos({ prazoTipo: "no_vencimento", prazoDias: "3" })).toEqual({ erro: "Dias e unidade só valem com Prazo em dias." });
    expect(atributos({ prazoUnidade: "uteis" })).toEqual({ erro: "Dias e unidade só valem com Prazo em dias." });
  });

  it("recusa dias fracionários, negativos, vazios ou acima do limite, sem arredondar nem converter", () => {
    const erro = { erro: "Informe os dias como número inteiro, de 0 a 2.147.483.647, sem vírgula." };
    for (const dias of ["2,2", "2.2", "-1", "", "1e3", "2147483648", "3 dias"]) {
      expect(atributos({ prazoTipo: "prazo", prazoDias: dias, prazoUnidade: "corridos" }), dias).toEqual(erro);
    }
    expect(atributos({ prazoTipo: "prazo", prazoDias: "3" })).toEqual({ erro: "Escolha Dias úteis ou Dias corridos." });
    expect(atributos({ prazoTipo: "prazo", prazoDias: "3", prazoUnidade: "semanas" })).toEqual({ erro: "Escolha Dias úteis ou Dias corridos." });
  });

  it("exclusivos junto com outro código são recusados, não descartados", () => {
    expect(atributos({ veiculo: ["fundo", "nao_aplicavel"] })).toEqual({ erro: "Não se aplica não pode ser marcado junto com outro veículo." });
    const exclusivo = { erro: "Prefixado (sem indexador) e Não se aplica não podem ser marcados junto com outro indexador." };
    expect(atributos({ indexador: ["sem_indexador", "cdi"] })).toEqual(exclusivo);
    expect(atributos({ indexador: ["sem_indexador", "nao_aplicavel"] })).toEqual(exclusivo);
    expect(atributos({ indexador: ["nao_aplicavel", "nao_aplicavel"] })).toEqual({
      atributos: expect.objectContaining({ indexadores_remuneracao: ["nao_aplicavel"] }),
    });
  });

  it("recusa códigos fora dos catálogos, inclusive o Não informado dos filtros", () => {
    expect(atributos({ veiculo: "Fundo" })).toEqual({ erro: "Escolha os veículos de acesso da lista." });
    expect(atributos({ indexador: "cambio" })).toEqual({ erro: "Escolha os indexadores da lista." });
    expect(atributos({ regime: "regressivo" })).toEqual({ erro: "Escolha um regime tributário da lista." });
    expect(atributos({ prazoTipo: "nao_informado" })).toEqual({ erro: "Escolha uma situação do prazo da lista." });
    expect(atributos({ fgc: "talvez" })).toEqual({ erro: "Escolha Sim, Não, Não se aplica ou Não informado na cobertura do FGC." });
  });

  it("lerDetalhes junta os atributos aos parâmetros e devolve a recusa deles", () => {
    expect(lerDetalhes(formulario({ veiculo: "direto", fgc: "sim" }))).toEqual({
      parametros: expect.objectContaining({ p_veiculos_acesso: ["direto"], p_cobertura_fgc: "sim", p_previdencia: null }),
    });
    expect(lerDetalhes(formulario({ fgc: "talvez" }))).toEqual({ erro: "Escolha Sim, Não, Não se aplica ou Não informado na cobertura do FGC." });
  });
});

describe("alternarNoConjunto", () => {
  const veiculo = (atual: string[], codigo: string, marcado: boolean) =>
    alternarNoConjunto(atual, codigo, marcado, VEICULOS_ACESSO, EXCLUSIVOS_VEICULO);
  const indexador = (atual: string[], codigo: string, marcado: boolean) =>
    alternarNoConjunto(atual, codigo, marcado, INDEXADORES_REMUNERACAO, EXCLUSIVOS_INDEXADOR);

  it("marca em ordem de catálogo e desmarca", () => {
    expect(veiculo(["etf"], "fundo", true)).toEqual(["fundo", "etf"]);
    expect(veiculo(["fundo", "etf"], "fundo", false)).toEqual(["etf"]);
  });

  it("um exclusivo desmarca os demais, e um comum desmarca os exclusivos", () => {
    expect(veiculo(["fundo", "etf"], "nao_aplicavel", true)).toEqual(["nao_aplicavel"]);
    expect(veiculo(["nao_aplicavel"], "direto", true)).toEqual(["direto"]);
    expect(indexador(["cdi", "ipca"], "sem_indexador", true)).toEqual(["sem_indexador"]);
    expect(indexador(["sem_indexador"], "nao_aplicavel", true)).toEqual(["nao_aplicavel"]);
    expect(indexador(["nao_aplicavel"], "inpc", true)).toEqual(["inpc"]);
  });
});

describe("algumAtributoInformado", () => {
  const vazio = {
    veiculos_acesso: [],
    indexadores_remuneracao: [],
    regime_tributario: null,
    prazo_resgate_tipo: null,
    prazo_resgate_dias: null,
    prazo_resgate_unidade: null,
    cobertura_fgc: null,
  };

  it("só com algum atributo preenchido", () => {
    expect(algumAtributoInformado(vazio)).toBe(false);
    expect(algumAtributoInformado({ ...vazio, cobertura_fgc: "nao" })).toBe(true);
    expect(algumAtributoInformado({ ...vazio, prazo_resgate_tipo: "prazo", prazo_resgate_dias: 0, prazo_resgate_unidade: "uteis" })).toBe(true);
    expect(algumAtributoInformado({ ...vazio, indexadores_remuneracao: ["tr"] })).toBe(true);
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
