import type { Opcao } from "./combobox";
import { ordenarPorNome } from "./combobox";
import { INDEXADORES_REMUNERACAO, type OpcaoAtributo, VEICULOS_ACESSO } from "./detalhes-ativo";
import {
  camposComFiltro,
  type CatalogosDoFiltro,
  filtrarAtivos,
  lerFiltros,
  opcoesDeClasse,
  opcoesDeInstituicao,
  opcoesEmUso,
  type Parametros,
} from "./filtros-ativos";
import type { Ativo } from "./leituras";
import { classeDoAtivo, type Taxonomia } from "./taxonomia";

// Seletor de ativo com filtros (ciclo 019, issue #191, BL-022; DESIGN.md 6.8 e 6.12). Funções puras:
// o componente só liga o estado do navegador a elas. As opções são as mesmas linhas de `lerAtivos`, filtradas
// pelas mesmas regras de /ativos (`lerFiltros` e `filtrarAtivos`); o filtro só restringe a lista oferecida e
// nunca muda a seleção já confirmada. Nada aqui lê o banco nem calcula valores.

/** Segunda linha de "Em trânsito", como em /ativos: o ativo de sistema não tem instituição nem classe (D7). */
export const DETALHE_DO_TRANSITO = "Ativo de sistema";

/** Ativo como o seletor o recebe: a linha lida, com o nome exibido em `nome`, e a segunda linha da opção (D7). */
export type AtivoDoSeletor = Ativo & { detalhe: string };

/**
 * Prepara os ativos selecionáveis de um formulário, em ordem alfabética pelo nome exibido. A segunda linha
 * é "Instituição · Classe", com o nome do nó da classe (como a lista de /ativos), "Sem instituição" e
 * "Sem classe" quando ausentes; o trânsito tem a própria (R1-1).
 */
export function ativosDoSeletor(
  ativos: readonly Ativo[],
  taxonomia: Taxonomia,
  classesLegadas: ReadonlyMap<string, string>,
  nomeDaInstituicao: ReadonlyMap<string, string>,
): AtivoDoSeletor[] {
  return ordenarPorNome(
    ativos.map((a) => {
      const transito = a.sistema === "transito";
      const instituicao = a.instituicao_id ? (nomeDaInstituicao.get(a.instituicao_id) ?? null) : null;
      return {
        ...a,
        nome: transito ? "Em trânsito" : a.nome,
        detalhe: transito ? DETALHE_DO_TRANSITO : `${instituicao ?? "Sem instituição"} · ${classeDoAtivo(a, taxonomia, classesLegadas) ?? "Sem classe"}`,
      };
    }),
  );
}

/** Valores dos campos do filtro no formulário, pelos mesmos nomes de parâmetro da URL de /ativos. */
export type ValoresDoFiltro = Record<string, string | string[]>;

const CONDICIONAIS_DO_PRAZO = ["prazo_resgate_dias", "prazo_resgate_unidade", "prazo_resgate_comparacao"];

/**
 * Parâmetros que valem: Comparação, Dias e Unidade só valem com "Prazo em dias" (ciclo 019, R1-2). Os campos
 * ficam ocultos por CSS quando a situação muda e guardam o valor antigo; aqui são ignorados, em vez de causar
 * um erro de filtro por um campo que a pessoa não está vendo. Na URL de /ativos, o mesmo parâmetro avulso continua recusado.
 */
export function parametrosEfetivos(valores: ValoresDoFiltro): Parametros {
  if (valores.prazo_resgate_tipo === "prazo") return valores;
  return Object.fromEntries(Object.entries(valores).filter(([nome]) => !CONDICIONAIS_DO_PRAZO.includes(nome)));
}

export interface ResultadoDoSeletor {
  /** Opções oferecidas: as que passam pelos filtros, ou nenhuma com filtro inválido. */
  opcoes: Opcao[];
  /** Mensagem do filtro inválido (a mesma de /ativos); a lista fica vazia. */
  erro: string | null;
  /** Campos com filtro, para o contador. */
  campos: number;
}

/** Aplica os filtros aos ativos do seletor; com algum filtro o trânsito sai da lista (D6, como D8 de /ativos). */
export function opcoesDoSeletor(ativos: readonly AtivoDoSeletor[], valores: ValoresDoFiltro, catalogos: CatalogosDoFiltro): ResultadoDoSeletor {
  const lido = lerFiltros(parametrosEfetivos(valores), catalogos);
  if ("erro" in lido) return { opcoes: [], erro: lido.erro, campos: 0 };
  const visiveis = filtrarAtivos(ativos, lido.filtros, catalogos.taxonomia);
  return {
    opcoes: visiveis.map((a) => ({ id: a.id, nome: a.nome, detalhe: a.detalhe })),
    erro: null,
    campos: camposComFiltro(lido.filtros),
  };
}

export interface OpcoesDoFiltro {
  classe: OpcaoAtributo[];
  instituicao: OpcaoAtributo[];
  veiculo: OpcaoAtributo[];
  indexador: OpcaoAtributo[];
}

/**
 * Opções das quatro listas suspensas do filtro (ciclo 018, D14, e ciclo 019, D3): só as usadas por algum
 * ativo comum entre os `ativos` recebidos, mais as marcadas. Em /ativos, os ativos são os das duas abas; nos
 * formulários, só os selecionáveis do próprio formulário, para não oferecer opção presente apenas em ativo
 * desativado (R1-1).
 */
export function opcoesDoFiltro(ativos: readonly Ativo[], marcados: Parametros, catalogos: CatalogosDoFiltro): OpcoesDoFiltro {
  const comuns = ativos.filter((a) => a.sistema === null);
  const marcadosDe = (nome: string) => [marcados[nome] ?? []].flat();
  return {
    classe: opcoesDeClasse(catalogos.taxonomia, comuns.map((a) => a.taxonomia_id), marcadosDe("classe")),
    instituicao: opcoesDeInstituicao(catalogos.instituicoes, comuns.map((a) => a.instituicao_id), marcadosDe("instituicao")),
    veiculo: opcoesEmUso(VEICULOS_ACESSO, comuns.map((a) => a.veiculos_acesso), marcadosDe("veiculo")),
    indexador: opcoesEmUso(INDEXADORES_REMUNERACAO, comuns.map((a) => a.indexadores_remuneracao), marcadosDe("indexador")),
  };
}
