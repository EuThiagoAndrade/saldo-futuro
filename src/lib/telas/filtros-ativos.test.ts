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
  opcoesDeClasse,
  opcoesDeInstituicao,
  opcoesEmUso,
  type Parametros,
} from "./filtros-ativos";
import type { Ativo } from "./leituras";
import { montarTaxonomia, type NoTaxonomia } from "./taxonomia";

// Filtros e resumo da página Ativos (ciclo 017, issue #174). Exemplos fictícios da P5 do plano:
// A (Fundo, CDI, 0 dias úteis), B (ETF, IPCA, 1 dia útil), C (Fundo e ETF, CDI, 3 dias corridos) e
// o trânsito, que não recebe atributos. Classe e instituição (ciclo 019, issue #190, D2 e D3): árvore e
// instituições fictícias, com um ativo em cada ramo, um só com a classe legada e um sem nada.

const NOS: NoTaxonomia[] = [
  { id: "r1", parent_id: null, nivel: 1, nome: "Classe Um", ordem: 1 },
  { id: "s1", parent_id: "r1", nivel: 2, nome: "Subclasse Ação", ordem: 1 },
  { id: "s2", parent_id: "r1", nivel: 2, nome: "Subclasse Dois", ordem: 2 },
  { id: "t2", parent_id: "s2", nivel: 3, nome: "Tipo Alfa", ordem: 1 },
  { id: "r2", parent_id: null, nivel: 1, nome: "Classe Dois", ordem: 2 },
  { id: "r3", parent_id: null, nivel: 1, nome: "Classe Três", ordem: 3 },
  { id: "s3", parent_id: "r3", nivel: 2, nome: "Subclasse Seis", ordem: 1 },
];
const TAXONOMIA = montarTaxonomia(NOS);
const INSTITUICOES = [
  { id: "i1", nome: "Banco Beta" },
  { id: "i2", nome: "banco Alfa" },
  { id: "i3", nome: "Corretora Gama" },
];
const CATALOGOS = { taxonomia: TAXONOMIA, instituicoes: INSTITUICOES };

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

const A = ativo("A", { taxonomia_id: "t2", instituicao_id: "i1", veiculos_acesso: ["fundo"], indexadores_remuneracao: ["cdi"], ...prazo(0, "uteis"), cobertura_fgc: "sim", liquidez_imediata: true, previdencia: true });
const B = ativo("B", { taxonomia_id: "s1", instituicao_id: "i2", veiculos_acesso: ["etf"], indexadores_remuneracao: ["ipca"], ...prazo(1, "uteis"), regime_tributario: "renda_variavel", cobertura_fgc: "nao" });
const C = ativo("C", { taxonomia_id: "r2", instituicao_id: "i1", veiculos_acesso: ["fundo", "etf"], indexadores_remuneracao: ["cdi"], ...prazo(3, "corridos"), cobertura_fgc: "nao_aplicavel", liquidez_imediata: false, previdencia: false });
const D = ativo("D", { prazo_resgate_tipo: "no_vencimento", classe_id: "legado" });
const E = ativo("E");
const TRANSITO = ativo("T", { nome: "Em trânsito", tipo_ajuste: null, sistema: "transito" });
const TODOS = [A, B, C, D, E, TRANSITO];

const filtrar = (p: Parametros) => {
  const lido = lerFiltros(p, CATALOGOS);
  if ("erro" in lido) throw new Error(lido.erro);
  return filtrarAtivos(TODOS, lido.filtros, TAXONOMIA).map((a) => a.id);
};
const erro = (p: Parametros) => {
  const lido = lerFiltros(p, CATALOGOS);
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

describe("classe e instituição (ciclo 019, issue #190)", () => {
  it("marcar um nó inclui o próprio nó e os descendentes, e vários nós combinam por OU", () => {
    expect(filtrar({ classe: "r1" })).toEqual(["A", "B"]);
    expect(filtrar({ classe: "s2" })).toEqual(["A"]);
    expect(filtrar({ classe: "t2" })).toEqual(["A"]);
    expect(filtrar({ classe: "s1" })).toEqual(["B"]);
    expect(filtrar({ classe: ["r2", "s1"] })).toEqual(["B", "C"]);
    // Pai e filho marcados juntos não duplicam nem perdem ninguém.
    expect(filtrar({ classe: ["r1", "t2"] })).toEqual(["A", "B"]);
    // Um nó sem nenhum ativo não traz resultado, mas é válido.
    expect(filtrar({ classe: "r3" })).toEqual([]);
  });

  it("duas instituições combinam por OU", () => {
    expect(filtrar({ instituicao: "i1" })).toEqual(["A", "C"]);
    expect(filtrar({ instituicao: ["i2", "i1"] })).toEqual(["A", "B", "C"]);
    expect(filtrar({ instituicao: "i3" })).toEqual([]);
  });

  it("Sem classe seleciona só quem não tem nó, inclusive quem só tem a classe legada, e Sem instituição só quem não tem instituição", () => {
    expect(filtrar({ classe: "sem_classe" })).toEqual(["D", "E"]);
    expect(filtrar({ instituicao: "sem_instituicao" })).toEqual(["D", "E"]);
  });

  it("classe e instituição combinam por E entre si e com os demais filtros", () => {
    expect(filtrar({ classe: "r1", instituicao: "i1" })).toEqual(["A"]);
    expect(filtrar({ classe: ["r1", "r2"], instituicao: "i1" })).toEqual(["A", "C"]);
    expect(filtrar({ classe: ["r1", "r2"], veiculo: "fundo" })).toEqual(["A", "C"]);
    expect(filtrar({ classe: ["r1", "r2"], veiculo: "fundo", fgc: "nao_aplicavel" })).toEqual(["C"]);
    expect(filtrar({ classe: "sem_classe", instituicao: "i1" })).toEqual([]);
  });

  it("com qualquer filtro novo, o trânsito fica de fora; sem filtro, continua na lista", () => {
    expect(filtrar({ classe: "sem_classe" })).not.toContain("T");
    expect(filtrar({ instituicao: "sem_instituicao" })).not.toContain("T");
    expect(filtrar({ classe: "", instituicao: [""] })).toContain("T");
  });

  it("valores vazios da URL são Todos e o parâmetro repetido igual vale uma vez", () => {
    expect(filtrar({ classe: [""], instituicao: "" })).toEqual(["A", "B", "C", "D", "E", "T"]);
    expect(filtrar({ classe: ["r2", "r2"] })).toEqual(["C"]);
  });

  it("ID desconhecido e combinação inválida são erro, nunca Todos em silêncio", () => {
    expect(erro({ classe: "inexistente" })).toBe("Classe tem uma opção desconhecida.");
    expect(erro({ classe: ["r1", "inexistente"] })).toBe("Classe tem uma opção desconhecida.");
    expect(erro({ instituicao: "inexistente" })).toBe("Instituição tem uma opção desconhecida.");
    // O valor de "Não informado" de outros campos não vale aqui.
    expect(erro({ classe: "nao_informado" })).toBe("Classe tem uma opção desconhecida.");
    expect(erro({ instituicao: "nao_informado" })).toBe("Instituição tem uma opção desconhecida.");
    expect(erro({ classe: ["sem_classe", "r1"] })).toBe("Classe: Sem classe não combina com outras opções.");
    expect(erro({ instituicao: ["i1", "sem_instituicao"] })).toBe("Instituição: Sem instituição não combina com outras opções.");
    expect(erro({ classe: ["sem_classe", "sem_classe"] })).toBeNull();
  });

  it("o contador conta classe e instituição uma vez cada, mesmo com várias opções", () => {
    const f = (p: Parametros) => (lerFiltros(p, CATALOGOS) as { filtros: FiltrosAtivos }).filtros;
    expect(algumFiltro(f({ classe: "r1" }))).toBe(true);
    expect(algumFiltro(f({ instituicao: "sem_instituicao" }))).toBe(true);
    expect(camposComFiltro(f({ classe: ["r1", "r2"], instituicao: ["i1", "i2"] }))).toBe(2);
    expect(camposComFiltro(f({ classe: "sem_classe", veiculo: "fundo" }))).toBe(2);
  });

  it("os links das abas e o Limpar tratam os campos novos como os demais, antes dos outros, na ordem fixa", () => {
    const p = { aba: "desativados", fgc: "nao", instituicao: ["i1", "i2"], classe: "r1", veiculo: "fundo" };
    expect(consultaDosFiltros(p).toString()).toBe("classe=r1&instituicao=i1&instituicao=i2&veiculo=fundo&fgc=nao");
    expect(enderecoDaAba("em-uso", p)).toBe("/ativos?classe=r1&instituicao=i1&instituicao=i2&veiculo=fundo&fgc=nao");
    expect(enderecoDaAba("desativados", p)).toBe("/ativos?aba=desativados&classe=r1&instituicao=i1&instituicao=i2&veiculo=fundo&fgc=nao");
    expect(enderecoDaAba("em-uso", {})).toBe("/ativos");
  });

  it("opções de classe: nós em uso, ancestrais e marcados, em ordem hierárquica, com o caminho completo e Sem classe no fim", () => {
    const opcoes = (usados: (string | null)[], marcados: string[] = []) => opcoesDeClasse(TAXONOMIA, usados, marcados).map((o) => [o.codigo, o.rotulo]);
    // Só t2 em uso: ele e os ancestrais, e nada de s1, r2 e do ramo r3.
    expect(opcoes(["t2", null])).toEqual([
      ["r1", "Classe Um"],
      ["s2", "Classe Um › Subclasse Dois"],
      ["t2", "Classe Um › Subclasse Dois › Tipo Alfa"],
      ["sem_classe", "Sem classe"],
    ]);
    // Um nó marcado na URL entra mesmo sem uso, na posição hierárquica; ancestrais só pelo uso.
    expect(opcoes(["r2"], ["s3"]).map(([c]) => c)).toEqual(["r2", "s3", "sem_classe"]);
    expect(opcoes([]).map(([c]) => c)).toEqual(["sem_classe"]);
  });

  it("opções de instituição: usadas e marcadas, em ordem alfabética sem distinguir caixa, com Sem instituição no fim", () => {
    const opcoes = (usadas: (string | null)[], marcadas: string[] = []) => opcoesDeInstituicao(INSTITUICOES, usadas, marcadas).map((o) => [o.codigo, o.rotulo]);
    expect(opcoes(["i1", "i2", null, "i1"])).toEqual([
      ["i2", "banco Alfa"],
      ["i1", "Banco Beta"],
      ["sem_instituicao", "Sem instituição"],
    ]);
    expect(opcoes(["i1"], ["i3"]).map(([c]) => c)).toEqual(["i1", "i3", "sem_instituicao"]);
    expect(opcoes([]).map(([c]) => c)).toEqual(["sem_instituicao"]);
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
    const lido = lerFiltros({ veiculo: ["etf", "fundo"], prazo_resgate_tipo: "prazo", prazo_resgate_dias: "1", prazo_resgate_unidade: "uteis", prazo_resgate_comparacao: "ate", isento_ir: "nao_informado" }, CATALOGOS);
    expect("filtros" in lido).toBe(true);
    const f = (lido as { filtros: FiltrosAtivos }).filtros;
    expect(algumFiltro(f)).toBe(true);
    // Dois veículos, o prazo com seus três campos e um indicador: três campos com filtro.
    expect(camposComFiltro(f)).toBe(3);
    const vazio = (lerFiltros({}, CATALOGOS) as { filtros: FiltrosAtivos }).filtros;
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
