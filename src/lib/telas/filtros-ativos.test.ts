import { describe, expect, it } from "vitest";
import { INDEXADORES_REMUNERACAO, prazoLegivel, resumoDosAtributos, VEICULOS_ACESSO } from "./detalhes-ativo";
import {
  algumFiltro,
  camposComFiltro,
  consultaDosFiltros,
  enderecoDaAba,
  filtrarAtivos,
  type FiltrosAtivos,
  lerFiltros,
  opcoesEmUso,
  type Parametros,
} from "./filtros-ativos";
import type { Ativo } from "./leituras";

// Filtros e resumo da página Ativos (ciclo 017, issue #174). Exemplos fictícios da P5 do plano:
// A (Fundo, CDI, 0 dias úteis), B (ETF, IPCA, 1 dia útil), C (Fundo e ETF, CDI, 3 dias corridos) e
// o trânsito, que não recebe atributos.

const ativo = (id: string, extras: Partial<Ativo> = {}): Ativo => ({
  id,
  nome: `Ativo ${id}`,
  tipo_ajuste: "rendimento",
  sistema: null,
  ativo: true,
  desativado_em: null,
  instituicao_id: null,
  taxonomia_id: null,
  classe_id: null,
  previdencia: null,
  liquidez_imediata: null,
  exposicao_cambial: null,
  isento_ir: null,
  veiculos_acesso: [],
  indexadores_remuneracao: [],
  regime_tributario: null,
  prazo_resgate_tipo: null,
  prazo_resgate_dias: null,
  prazo_resgate_unidade: null,
  cobertura_fgc: null,
  ...extras,
});
const prazo = (dias: number, unidade: "uteis" | "corridos") => ({ prazo_resgate_tipo: "prazo", prazo_resgate_dias: dias, prazo_resgate_unidade: unidade });

const A = ativo("A", { veiculos_acesso: ["fundo"], indexadores_remuneracao: ["cdi"], ...prazo(0, "uteis"), cobertura_fgc: "sim", liquidez_imediata: true, previdencia: true });
const B = ativo("B", { veiculos_acesso: ["etf"], indexadores_remuneracao: ["ipca"], ...prazo(1, "uteis"), regime_tributario: "renda_variavel", cobertura_fgc: "nao" });
const C = ativo("C", { veiculos_acesso: ["fundo", "etf"], indexadores_remuneracao: ["cdi"], ...prazo(3, "corridos"), cobertura_fgc: "nao_aplicavel", liquidez_imediata: false, previdencia: false });
const D = ativo("D", { prazo_resgate_tipo: "no_vencimento" });
const E = ativo("E");
const TRANSITO = ativo("T", { nome: "Em trânsito", tipo_ajuste: null, sistema: "transito" });
const TODOS = [A, B, C, D, E, TRANSITO];

const filtrar = (p: Parametros) => {
  const lido = lerFiltros(p);
  if ("erro" in lido) throw new Error(lido.erro);
  return filtrarAtivos(TODOS, lido.filtros).map((a) => a.id);
};
const erro = (p: Parametros) => {
  const lido = lerFiltros(p);
  return "erro" in lido ? lido.erro : null;
};

describe("filtrarAtivos — exemplos da P5", () => {
  it("sem filtro, todos, inclusive o trânsito", () => {
    expect(filtrar({})).toEqual(["A", "B", "C", "D", "E", "T"]);
    // Valores vazios vindos do formulário são Todos.
    expect(filtrar({ regime: "", veiculo: [""], prazo_resgate_dias: "", prazo_resgate_comparacao: "" })).toEqual(["A", "B", "C", "D", "E", "T"]);
  });

  it("OU dentro do atributo e E entre atributos", () => {
    expect(filtrar({ veiculo: ["fundo", "etf"] })).toEqual(["A", "B", "C"]);
    expect(filtrar({ veiculo: ["fundo", "etf"], indexador: "cdi" })).toEqual(["A", "C"]);
  });

  it("Exatamente e Até comparam o número na mesma unidade, sem converter", () => {
    const uteis = { prazo_resgate_tipo: "prazo", prazo_resgate_dias: "1", prazo_resgate_unidade: "uteis" };
    expect(filtrar({ ...uteis, prazo_resgate_comparacao: "exato" })).toEqual(["B"]);
    expect(filtrar({ ...uteis, prazo_resgate_comparacao: "ate" })).toEqual(["A", "B"]);
    expect(filtrar({ prazo_resgate_tipo: "prazo", prazo_resgate_dias: "0", prazo_resgate_unidade: "uteis", prazo_resgate_comparacao: "exato" })).toEqual(["A"]);
    // C tem 3 dias corridos: não entra em comparação com dias úteis, e Até é inclusivo no limite.
    expect(filtrar({ prazo_resgate_tipo: "prazo", prazo_resgate_dias: "100", prazo_resgate_unidade: "uteis", prazo_resgate_comparacao: "ate" })).toEqual(["A", "B"]);
    expect(filtrar({ prazo_resgate_tipo: "prazo", prazo_resgate_dias: "3", prazo_resgate_unidade: "corridos", prazo_resgate_comparacao: "ate" })).toEqual(["C"]);
    expect(filtrar({ prazo_resgate_tipo: "prazo", prazo_resgate_dias: "2", prazo_resgate_unidade: "corridos", prazo_resgate_comparacao: "ate" })).toEqual([]);
  });

  it("situação sem número compara só a situação", () => {
    expect(filtrar({ prazo_resgate_tipo: "no_vencimento" })).toEqual(["D"]);
  });

  it("Não informado seleciona só o vazio ou o nulo, distinto de Não e de Não se aplica, e nunca o trânsito", () => {
    expect(filtrar({ regime: "nao_informado" })).toEqual(["A", "C", "D", "E"]);
    expect(filtrar({ fgc: "nao_informado" })).toEqual(["D", "E"]);
    expect(filtrar({ fgc: "nao" })).toEqual(["B"]);
    expect(filtrar({ fgc: "nao_aplicavel" })).toEqual(["C"]);
    expect(filtrar({ prazo_resgate_tipo: "nao_informado" })).toEqual(["E"]);
    expect(filtrar({ veiculo: "nao_informado" })).toEqual(["D", "E"]);
    expect(filtrar({ indexador: "nao_informado" })).toEqual(["D", "E"]);
  });

  it("indicadores em Sim, Não e Não informado", () => {
    expect(filtrar({ liquidez_imediata: "sim" })).toEqual(["A"]);
    expect(filtrar({ liquidez_imediata: "nao" })).toEqual(["C"]);
    expect(filtrar({ liquidez_imediata: "nao_informado" })).toEqual(["B", "D", "E"]);
  });

  it("o indicador Previdência deixou de ser filtro (ciclo 018, D18): o parâmetro antigo é ignorado", () => {
    expect(filtrar({ previdencia: "sim" })).toEqual(["A", "B", "C", "D", "E", "T"]);
    expect(erro({ previdencia: "true" })).toBeNull();
  });
});

describe("lerFiltros — recusas explícitas", () => {
  it("código desconhecido, escalar repetido e conjunto inválido", () => {
    expect(erro({ veiculo: "Fundo" })).toBe("Veículo de acesso tem uma opção desconhecida.");
    expect(erro({ regime: ["outro", "renda_variavel"] })).toBe("Regime tributário aparece mais de uma vez.");
    expect(erro({ regime: ["", "outro"] })).toBe("Regime tributário aparece mais de uma vez.");
    expect(erro({ fgc: "talvez" })).toBe("Cobertura do FGC tem uma opção desconhecida.");
    expect(erro({ isento_ir: "true" })).toBe("Isento de IR tem uma opção desconhecida.");
    expect(erro({ veiculo: ["nao_informado", "fundo"] })).toBe("Veículo de acesso: Não informado não combina com outras opções.");
    expect(erro({ indexador: ["nao_informado", "cdi"] })).toBe("Indexador da remuneração: Não informado não combina com outras opções.");
  });

  it("no filtro, Prefixado e Não se aplica combinam por OU com outras opções (ciclo 018, D16)", () => {
    expect(erro({ indexador: ["sem_indexador", "cdi"] })).toBeNull();
    expect(erro({ veiculo: ["nao_aplicavel", "fundo"] })).toBeNull();
    expect(filtrar({ indexador: ["sem_indexador", "ipca"] })).toEqual(["B"]);
  });

  it("tupla do prazo: Prazo em dias exige comparação, dias e unidade; as outras situações não os aceitam", () => {
    const completo = { prazo_resgate_tipo: "prazo", prazo_resgate_dias: "1", prazo_resgate_unidade: "uteis", prazo_resgate_comparacao: "exato" };
    expect(erro(completo)).toBeNull();
    expect(erro({ ...completo, prazo_resgate_comparacao: "" })).toBe("Com Prazo em dias, escolha a comparação, os dias e a unidade.");
    expect(erro({ ...completo, prazo_resgate_comparacao: "maior" })).toBe("A comparação do prazo tem uma opção desconhecida.");
    expect(erro({ ...completo, prazo_resgate_unidade: "" })).toBe("Com Prazo em dias, escolha a comparação, os dias e a unidade.");
    expect(erro({ ...completo, prazo_resgate_dias: "1,5" })).toBe("Informe os dias como número inteiro, de 0 a 2.147.483.647, sem vírgula.");
    expect(erro({ ...completo, prazo_resgate_dias: "2147483648" })).toBe("Informe os dias como número inteiro, de 0 a 2.147.483.647, sem vírgula.");
    const sobra = "Comparação, dias e unidade só valem com Prazo em dias.";
    expect(erro({ prazo_resgate_tipo: "nao_informado", prazo_resgate_comparacao: "ate" })).toBe(sobra);
    expect(erro({ prazo_resgate_tipo: "nao_informado", prazo_resgate_dias: "3" })).toBe(sobra);
    expect(erro({ prazo_resgate_tipo: "no_vencimento", prazo_resgate_unidade: "uteis" })).toBe(sobra);
    expect(erro({ prazo_resgate_dias: "3" })).toBe(sobra);
  });
});

describe("estado na URL", () => {
  it("algumFiltro e o contador conta campos, não opções (ciclo 018, D15)", () => {
    const lido = lerFiltros({ veiculo: ["etf", "fundo"], prazo_resgate_tipo: "prazo", prazo_resgate_dias: "1", prazo_resgate_unidade: "uteis", prazo_resgate_comparacao: "ate", isento_ir: "nao_informado" });
    expect("filtros" in lido).toBe(true);
    const f = (lido as { filtros: FiltrosAtivos }).filtros;
    expect(algumFiltro(f)).toBe(true);
    // Dois veículos, o prazo com seus três campos e um indicador: três campos com filtro.
    expect(camposComFiltro(f)).toBe(3);
    const vazio = (lerFiltros({}) as { filtros: FiltrosAtivos }).filtros;
    expect(algumFiltro(vazio)).toBe(false);
    expect(camposComFiltro(vazio)).toBe(0);
  });

  it("opções em uso: as dos ativos e as marcadas, em ordem de catálogo, com Não informado no fim (ciclo 018, D14)", () => {
    const codigos = (o: { codigo: string }[]) => o.map((x) => x.codigo);
    expect(codigos(opcoesEmUso(VEICULOS_ACESSO, [["etf"], ["previdencia", "fundo"], []], []))).toEqual(["fundo", "etf", "previdencia", "nao_informado"]);
    expect(codigos(opcoesEmUso(VEICULOS_ACESSO, [["etf"]], ["direto"]))).toEqual(["direto", "etf", "nao_informado"]);
    expect(codigos(opcoesEmUso(INDEXADORES_REMUNERACAO, [], []))).toEqual(["nao_informado"]);
  });

  it("os links das abas preservam só os filtros preenchidos, e sem filtro mantêm os endereços de antes", () => {
    const p = { aba: "desativados", veiculo: ["fundo", "etf"], regime: "", fgc: "nao", outro: "x" };
    expect(consultaDosFiltros(p).toString()).toBe("veiculo=fundo&veiculo=etf&fgc=nao");
    expect(enderecoDaAba("em-uso", p)).toBe("/ativos?veiculo=fundo&veiculo=etf&fgc=nao");
    expect(enderecoDaAba("desativados", p)).toBe("/ativos?aba=desativados&veiculo=fundo&veiculo=etf&fgc=nao");
    expect(enderecoDaAba("em-uso", {})).toBe("/ativos");
    expect(enderecoDaAba("desativados", { aba: "desativados" })).toBe("/ativos?aba=desativados");
  });
});

describe("resumo do ativo", () => {
  it("oito itens nos quatro grupos, com Não informado explícito, conjuntos na ordem do catálogo e sem Previdência à parte", () => {
    expect(
      resumoDosAtributos(
        ativo("X", { veiculos_acesso: ["etf", "previdencia"], indexadores_remuneracao: ["variacao_cambial"], isento_ir: false, previdencia: true, ...prazo(0, "uteis") }),
      ),
    ).toEqual([
      {
        titulo: "Produto",
        itens: [
          { rotulo: "Veículo de acesso", valor: "ETF, Previdência (PGBL ou VGBL)" },
          { rotulo: "Indexador da remuneração", valor: "Variação cambial" },
        ],
      },
      {
        titulo: "Tributação",
        itens: [
          { rotulo: "Regime tributário", valor: "Não informado" },
          { rotulo: "Isento de IR", valor: "Não" },
        ],
      },
      {
        titulo: "Resgate",
        itens: [
          { rotulo: "Prazo para resgate ou venda", valor: "0 dias úteis" },
          { rotulo: "Liquidez imediata (reserva)", valor: "Não informado" },
        ],
      },
      {
        titulo: "Proteção e exposição",
        itens: [
          { rotulo: "Cobertura do FGC", valor: "Não informado" },
          { rotulo: "Exposição cambial", valor: "Não informado" },
        ],
      },
    ]);
  });

  it("prazo como informado, no singular e com milhar, ou a situação", () => {
    expect(prazoLegivel(prazo(1, "corridos"))).toBe("1 dia corrido");
    expect(prazoLegivel(prazo(2147483647, "corridos"))).toBe("2.147.483.647 dias corridos");
    expect(prazoLegivel({ prazo_resgate_tipo: "sem_prazo_estimavel", prazo_resgate_dias: null, prazo_resgate_unidade: null })).toBe("Sem prazo estimável");
    expect(prazoLegivel({ prazo_resgate_tipo: null, prazo_resgate_dias: null, prazo_resgate_unidade: null })).toBe("Não informado");
  });

  it("código fora do catálogo é erro de leitura, nunca ausência", () => {
    expect(() => resumoDosAtributos(ativo("X", { regime_tributario: "inventado" }))).toThrow("código de atributo desconhecido");
  });
});
