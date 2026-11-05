import { describe, expect, it } from "vitest";
import { confirmar, editar, estadoInicial, listaFiltrada, valorEnviado } from "./combobox";
import type { Ativo } from "./leituras";
import { ativosDoSeletor, DETALHE_DO_TRANSITO, opcoesDoFiltro, opcoesDoSeletor, parametrosEfetivos, type AtivoDoSeletor } from "./seletor-ativo";
import { montarTaxonomia, type NoTaxonomia } from "./taxonomia";

// Seletor de ativo com filtros (ciclo 019, issue #191, BL-022). Nomes, instituições e classes fictícios: dois
// ativos homônimos em instituições diferentes, um sem instituição nem classe, um só com a classe legada, um
// desativado e o trânsito.

const NOS: NoTaxonomia[] = [
  { id: "r1", parent_id: null, nivel: 1, nome: "Classe Um", ordem: 1 },
  { id: "s1", parent_id: "r1", nivel: 2, nome: "Subclasse Ação", ordem: 1 },
  { id: "r2", parent_id: null, nivel: 1, nome: "Classe Dois", ordem: 2 },
  { id: "r3", parent_id: null, nivel: 1, nome: "Classe Três", ordem: 3 },
];
const TAXONOMIA = montarTaxonomia(NOS);
const INSTITUICOES = [
  { id: "i1", nome: "Banco Beta" },
  { id: "i2", nome: "Banco Alfa" },
  { id: "i3", nome: "Corretora Gama" },
];
const CATALOGOS = { taxonomia: TAXONOMIA, instituicoes: INSTITUICOES };
const NOME_DA_INSTITUICAO = new Map(INSTITUICOES.map((i) => [i.id, i.nome]));
const LEGADO = new Map([["legado", "Classe antiga"]]);

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

// Dois "Fundo Homônimo", em instituições distintas, em ordem de leitura fora da alfabética.
const LINHAS = [
  ativo("H2", { nome: "Fundo Homônimo", instituicao_id: "i2", taxonomia_id: "r2", veiculos_acesso: ["etf"] }),
  ativo("H1", { nome: "Fundo Homônimo", instituicao_id: "i1", taxonomia_id: "s1", veiculos_acesso: ["fundo"] }),
  ativo("S", { nome: "Ativo sem vínculo" }),
  ativo("L", { nome: "Ativo legado", classe_id: "legado" }),
  ativo("T", { nome: "Em trânsito", tipo_ajuste: null, sistema: "transito" }),
];
const ATIVOS: AtivoDoSeletor[] = ativosDoSeletor(LINHAS, TAXONOMIA, LEGADO, NOME_DA_INSTITUICAO);

const ids = (r: { opcoes: { id: string }[] }) => r.opcoes.map((o) => o.id);
const filtrar = (valores: Record<string, string | string[]>) => opcoesDoSeletor(ATIVOS, valores, CATALOGOS);

describe("ativosDoSeletor — segunda linha da opção (D7)", () => {
  it("nome, e 'Instituição · Classe' com o nome do nó; ausente vira Sem instituição ou Sem classe, e o legado mantém a dica", () => {
    const por = (id: string) => ATIVOS.find((a) => a.id === id)!;
    expect(por("H1").detalhe).toBe("Banco Beta · Subclasse Ação");
    expect(por("H2").detalhe).toBe("Banco Alfa · Classe Dois");
    expect(por("S").detalhe).toBe("Sem instituição · Sem classe");
    expect(por("L").detalhe).toBe("Sem instituição · Sem classe (antes: Classe antiga)");
  });

  it("o trânsito tem segunda linha própria, sem parecer cadastro incompleto (R1-1)", () => {
    expect(ATIVOS.find((a) => a.id === "T")!.detalhe).toBe(DETALHE_DO_TRANSITO);
    expect(DETALHE_DO_TRANSITO).toBe("Ativo de sistema");
  });

  it("ordem alfabética pelo nome exibido, e os homônimos mantêm a ordem recebida", () => {
    expect(ATIVOS.map((a) => a.nome)).toEqual(["Ativo legado", "Ativo sem vínculo", "Em trânsito", "Fundo Homônimo", "Fundo Homônimo"]);
    expect(ATIVOS.slice(3).map((a) => a.id)).toEqual(["H2", "H1"]);
  });
});

describe("opcoesDoSeletor", () => {
  it("sem filtro, todas as opções, trânsito incluído, com nome e segunda linha", () => {
    const r = filtrar({});
    expect(r.erro).toBeNull();
    expect(r.campos).toBe(0);
    expect(ids(r)).toEqual(["L", "S", "T", "H2", "H1"]);
    expect(r.opcoes.find((o) => o.id === "H1")).toEqual({ id: "H1", nome: "Fundo Homônimo", detalhe: "Banco Beta · Subclasse Ação" });
  });

  it("os homônimos se distinguem pela instituição e pela classe, com as mesmas regras de /ativos", () => {
    expect(ids(filtrar({ instituicao: "i1" }))).toEqual(["H1"]);
    expect(ids(filtrar({ instituicao: "i2" }))).toEqual(["H2"]);
    expect(ids(filtrar({ classe: "r1" }))).toEqual(["H1"]);
    expect(ids(filtrar({ classe: ["r1", "r2"], instituicao: "i2" }))).toEqual(["H2"]);
    expect(ids(filtrar({ classe: "sem_classe" }))).toEqual(["L", "S"]);
    expect(ids(filtrar({ veiculo: ["fundo"] }))).toEqual(["H1"]);
  });

  it("com qualquer filtro, o trânsito sai da lista (D6); sem filtro, continua", () => {
    expect(ids(filtrar({ instituicao: "sem_instituicao" }))).toEqual(["L", "S"]);
    expect(ids(filtrar({ classe: "" }))).toContain("T");
  });

  it("filtro inválido: nenhuma opção e a mensagem de /ativos, nunca Todos em silêncio", () => {
    const r = filtrar({ classe: "inexistente" });
    expect(r.opcoes).toEqual([]);
    expect(r.erro).toBe("Classe tem uma opção desconhecida.");
    expect(filtrar({ instituicao: ["i1", "sem_instituicao"] }).erro).toBe("Instituição: Sem instituição não combina com outras opções.");
    expect(filtrar({ prazo_resgate_tipo: "prazo" }).erro).toBe("Com Prazo em dias, escolha a comparação, os dias e a unidade.");
  });

  it("o contador conta campos, não opções", () => {
    expect(filtrar({ classe: ["r1", "r2"], instituicao: ["i1", "i2"], veiculo: "fundo" }).campos).toBe(3);
  });

  it("campos condicionais do prazo inativos são ignorados, não causam erro (R1-2)", () => {
    // O campo oculto guarda o valor de quando "Prazo em dias" estava escolhido.
    const antigos = { prazo_resgate_dias: "3", prazo_resgate_unidade: "uteis", prazo_resgate_comparacao: "ate" };
    expect(filtrar({ prazo_resgate_tipo: "", ...antigos }).erro).toBeNull();
    expect(filtrar({ prazo_resgate_tipo: "no_vencimento", ...antigos }).erro).toBeNull();
    expect(filtrar({ ...antigos }).erro).toBeNull();
    expect(filtrar({ prazo_resgate_tipo: "prazo", ...antigos }).erro).toBeNull();
    expect(parametrosEfetivos({ prazo_resgate_tipo: "no_vencimento", ...antigos, classe: "r1" })).toEqual({ prazo_resgate_tipo: "no_vencimento", classe: "r1" });
    expect(parametrosEfetivos({ prazo_resgate_tipo: "prazo", ...antigos })).toEqual({ prazo_resgate_tipo: "prazo", ...antigos });
  });
});

describe("opcoesDoFiltro — só sobre os ativos selecionáveis do formulário (R1-1)", () => {
  const codigos = (o: { codigo: string }[]) => o.map((x) => x.codigo);

  it("classes e instituições em uso, ancestrais incluídos, e Sem … no fim", () => {
    const o = opcoesDoFiltro(LINHAS, {}, CATALOGOS);
    expect(codigos(o.classe)).toEqual(["r1", "s1", "r2", "sem_classe"]);
    expect(codigos(o.instituicao)).toEqual(["i2", "i1", "sem_instituicao"]);
    expect(codigos(o.veiculo)).toEqual(["fundo", "etf", "nao_informado"]);
  });

  it("uma opção usada só por ativo fora da lista recebida não aparece, e a marcada continua", () => {
    const so = [ativo("A", { instituicao_id: "i1", taxonomia_id: "r1", veiculos_acesso: ["fundo"] })];
    // O desativado (fora do seletor) usava i3, r3 e ETF; o trânsito não conta.
    const o = opcoesDoFiltro([...so, ativo("T", { sistema: "transito", instituicao_id: "i3" })], {}, CATALOGOS);
    expect(codigos(o.instituicao)).toEqual(["i1", "sem_instituicao"]);
    expect(codigos(o.classe)).toEqual(["r1", "sem_classe"]);
    expect(codigos(o.veiculo)).toEqual(["fundo", "nao_informado"]);
    expect(codigos(opcoesDoFiltro(so, { instituicao: "i3", classe: ["r3"], veiculo: "etf" }, CATALOGOS).instituicao)).toEqual(["i1", "i3", "sem_instituicao"]);
  });
});

describe("a política de seleção do combobox não muda com a segunda linha (D5 e D7)", () => {
  const configuracao = { opcoes: filtrar({}).opcoes };

  it("a busca é pelo nome: o texto da instituição ou da classe não encontra a opção", () => {
    expect(listaFiltrada(configuracao, "homonimo").map((o) => o.id)).toEqual(["H2", "H1"]);
    expect(listaFiltrada(configuracao, "Banco Beta")).toEqual([]);
    expect(listaFiltrada(configuracao, "Subclasse")).toEqual([]);
  });

  it("o ID enviado é o da opção confirmada, e restringir a lista depois não desfaz a seleção", () => {
    const e0 = estadoInicial(configuracao);
    const h1 = configuracao.opcoes.find((o) => o.id === "H1")!;
    const confirmada = confirmar(editar(configuracao, e0, "homonimo"), h1);
    expect(valorEnviado(confirmada)).toBe("H1");
    expect(confirmada.confirmada?.detalhe).toBe("Banco Beta · Subclasse Ação");
    // Um filtro que exclui H1 muda só a lista oferecida; o estado confirmado é o mesmo.
    const restrita = { opcoes: filtrar({ instituicao: "i2" }).opcoes };
    expect(listaFiltrada(restrita, "").map((o) => o.id)).toEqual(["H2"]);
    expect(valorEnviado(confirmada)).toBe("H1");
  });
});
