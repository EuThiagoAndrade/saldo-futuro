import {
  COBERTURAS_FGC,
  type ColunaIndicador,
  INDEXADORES_REMUNERACAO,
  INDICADORES_VISIVEIS,
  MAXIMO_DIAS_PRAZO,
  type OpcaoAtributo,
  REGIMES_TRIBUTARIOS,
  SITUACOES_PRAZO,
  UNIDADES_PRAZO,
  VEICULOS_ACESSO,
} from "./detalhes-ativo";
import type { Ativo } from "./leituras";
import type { Taxonomia } from "./taxonomia";

// Filtros da página Ativos (ciclo 017, issue #174, P5 e D8). A URL é a fonte do estado: um
// formulário GET em /ativos, sem JavaScript para enviar. Mesmo atributo combina por OU (interseção
// com o conjunto do ativo), atributos diferentes por E. O prazo compara só o inteiro informado, na
// mesma unidade: Exatamente é igualdade e Até é <=, sem converter dias úteis e corridos nem calcular
// datas. "nao_informado" existe só aqui e seleciona o vazio ou o nulo, nunca o trânsito, que fica
// fora de qualquer filtro de atributos. Código desconhecido, escalar repetido, conjunto inválido ou
// tupla parcial são erro: a lista não vira Todos em silêncio.
//
// Classe e instituição (ciclo 019, issue #190, BL-020): repetíveis, por ID. Marcar um nó da taxonomia
// inclui o próprio nó e todos os descendentes. "Sem classe" (sem nó, inclusive quem só tem a classe
// legada) e "Sem instituição" são exclusivos, como "Não informado". ID fora do catálogo é erro.

export const NAO_INFORMADO_FILTRO = "nao_informado";
export const SEM_CLASSE_FILTRO = "sem_classe";
export const SEM_INSTITUICAO_FILTRO = "sem_instituicao";

export type Comparacao = "exato" | "ate";

export const COMPARACOES = [
  { codigo: "exato", rotulo: "Exatamente" },
  { codigo: "ate", rotulo: "Até" },
] as const satisfies readonly OpcaoAtributo<Comparacao>[];

/** Situação do prazo filtrada: só "prazo" leva número, unidade e comparação. */
export type FiltroPrazo =
  | { tipo: string }
  | { tipo: "prazo"; dias: number; unidade: string; comparacao: Comparacao };

export interface FiltrosAtivos {
  /** IDs de nós da taxonomia, em ordem hierárquica, ou só `SEM_CLASSE_FILTRO`. */
  classe: string[];
  /** IDs de instituições, na ordem do catálogo, ou só `SEM_INSTITUICAO_FILTRO`. */
  instituicao: string[];
  veiculo: string[];
  indexador: string[];
  regime: string | null;
  prazo: FiltroPrazo | null;
  fgc: string | null;
  indicadores: Partial<Record<ColunaIndicador, "sim" | "nao" | typeof NAO_INFORMADO_FILTRO>>;
}

export type Parametros = Record<string, string | string[] | undefined>;

/** Nomes dos parâmetros dos filtros (`aba` fica de fora). */
export const PARAMETROS_FILTRO = [
  "classe",
  "instituicao",
  "veiculo",
  "indexador",
  "regime",
  "prazo_resgate_tipo",
  "prazo_resgate_dias",
  "prazo_resgate_unidade",
  "prazo_resgate_comparacao",
  "fgc",
  ...INDICADORES_VISIVEIS.map((i) => i.coluna),
] as const;

const lista = (valor: string | string[] | undefined) => (valor === undefined ? [] : Array.isArray(valor) ? valor : [valor]);

/** Valores não vazios de um parâmetro; vazio é Todos. */
const preenchidos = (p: Parametros, nome: string) => lista(p[nome]).filter((v) => v !== "");

class ErroFiltro extends Error {}

function escalar(p: Parametros, nome: string, validos: readonly string[], rotulo: string): string | null {
  if (lista(p[nome]).length > 1) throw new ErroFiltro(`${rotulo} aparece mais de uma vez.`);
  const [valor] = preenchidos(p, nome);
  if (valor === undefined) return null;
  if (!validos.includes(valor)) throw new ErroFiltro(`${rotulo} tem uma opção desconhecida.`);
  return valor;
}

// No filtro, só "Não informado" é exclusivo (ciclo 018, D16): "Prefixado" e "Não se aplica" combinam
// por OU com as demais, como qualquer opção.
function conjunto(p: Parametros, nome: string, catalogo: readonly OpcaoAtributo[], rotulo: string): string[] {
  const valores = [...new Set(preenchidos(p, nome))];
  const validos = [...catalogo.map((o) => o.codigo), NAO_INFORMADO_FILTRO];
  if (valores.some((v) => !validos.includes(v))) throw new ErroFiltro(`${rotulo} tem uma opção desconhecida.`);
  if (valores.length > 1 && valores.includes(NAO_INFORMADO_FILTRO)) {
    throw new ErroFiltro(`${rotulo}: Não informado não combina com outras opções.`);
  }
  return validos.filter((v) => valores.includes(v));
}

/** Catálogos que dão sentido aos IDs de classe e de instituição da URL. */
export interface CatalogosDoFiltro {
  taxonomia: Taxonomia;
  instituicoes: readonly { id: string }[];
}

/** Conjunto de IDs de um catálogo: conferido contra ele, na ordem dele, com a opção exclusiva sozinha. */
function conjuntoDeIds(p: Parametros, nome: string, ordem: readonly string[], exclusiva: string, rotulo: string, rotuloExclusiva: string): string[] {
  const valores = [...new Set(preenchidos(p, nome))];
  if (valores.some((v) => v !== exclusiva && !ordem.includes(v))) throw new ErroFiltro(`${rotulo} tem uma opção desconhecida.`);
  if (valores.length > 1 && valores.includes(exclusiva)) throw new ErroFiltro(`${rotulo}: ${rotuloExclusiva} não combina com outras opções.`);
  return valores.includes(exclusiva) ? [exclusiva] : ordem.filter((id) => valores.includes(id));
}

function prazo(p: Parametros): FiltroPrazo | null {
  const codigos = (c: readonly OpcaoAtributo[]) => c.map((o) => o.codigo);
  const tipo = escalar(p, "prazo_resgate_tipo", [...codigos(SITUACOES_PRAZO), NAO_INFORMADO_FILTRO], "A situação do prazo");
  const dias = escalar(p, "prazo_resgate_dias", preenchidos(p, "prazo_resgate_dias"), "O número de dias");
  const unidade = escalar(p, "prazo_resgate_unidade", codigos(UNIDADES_PRAZO), "A unidade do prazo");
  const comparacao = escalar(p, "prazo_resgate_comparacao", codigos(COMPARACOES), "A comparação do prazo") as Comparacao | null;
  if (tipo !== "prazo") {
    if (dias !== null || unidade !== null || comparacao !== null) {
      throw new ErroFiltro("Comparação, dias e unidade só valem com Prazo em dias.");
    }
    return tipo === null ? null : { tipo };
  }
  if (comparacao === null || dias === null || unidade === null) {
    throw new ErroFiltro("Com Prazo em dias, escolha a comparação, os dias e a unidade.");
  }
  if (!/^\d+$/.test(dias) || Number(dias) > MAXIMO_DIAS_PRAZO) {
    throw new ErroFiltro("Informe os dias como número inteiro, de 0 a 2.147.483.647, sem vírgula.");
  }
  return { tipo, dias: Number(dias), unidade, comparacao };
}

/** Lê os filtros da URL; erro quando a combinação não é interpretável. */
export function lerFiltros(p: Parametros, catalogos: CatalogosDoFiltro): { filtros: FiltrosAtivos } | { erro: string } {
  try {
    const indicadores: FiltrosAtivos["indicadores"] = {};
    for (const i of INDICADORES_VISIVEIS) {
      const valor = escalar(p, i.coluna, ["sim", "nao", NAO_INFORMADO_FILTRO], i.rotulo);
      if (valor !== null) indicadores[i.coluna] = valor as "sim" | "nao" | typeof NAO_INFORMADO_FILTRO;
    }
    const codigos = (c: readonly OpcaoAtributo[]) => [...c.map((o) => o.codigo), NAO_INFORMADO_FILTRO];
    return {
      filtros: {
        classe: conjuntoDeIds(p, "classe", catalogos.taxonomia.opcoes.map((o) => o.id), SEM_CLASSE_FILTRO, "Classe", "Sem classe"),
        instituicao: conjuntoDeIds(p, "instituicao", catalogos.instituicoes.map((i) => i.id), SEM_INSTITUICAO_FILTRO, "Instituição", "Sem instituição"),
        veiculo: conjunto(p, "veiculo", VEICULOS_ACESSO, "Veículo de acesso"),
        indexador: conjunto(p, "indexador", INDEXADORES_REMUNERACAO, "Indexador da remuneração"),
        regime: escalar(p, "regime", codigos(REGIMES_TRIBUTARIOS), "Regime tributário"),
        prazo: prazo(p),
        fgc: escalar(p, "fgc", codigos(COBERTURAS_FGC), "Cobertura do FGC"),
        indicadores,
      },
    };
  } catch (erro) {
    if (erro instanceof ErroFiltro) return { erro: erro.message };
    throw erro;
  }
}

export function algumFiltro(f: FiltrosAtivos): boolean {
  return f.classe.length > 0 || f.instituicao.length > 0 || f.veiculo.length > 0 || f.indexador.length > 0 || f.regime !== null || f.prazo !== null || f.fgc !== null || Object.keys(f.indicadores).length > 0;
}

const confere = (filtro: string | null, valor: string | null) =>
  filtro === null || (filtro === NAO_INFORMADO_FILTRO ? valor === null : valor === filtro);

const confereConjunto = (filtro: string[], valores: string[]) =>
  filtro.length === 0 || (filtro[0] === NAO_INFORMADO_FILTRO ? valores.length === 0 : filtro.some((v) => valores.includes(v)));

function conferePrazo(f: FiltroPrazo | null, a: Ativo): boolean {
  if (f === null) return true;
  if (f.tipo === NAO_INFORMADO_FILTRO) return a.prazo_resgate_tipo === null;
  if (!("comparacao" in f)) return a.prazo_resgate_tipo === f.tipo;
  if (a.prazo_resgate_tipo !== "prazo" || a.prazo_resgate_unidade !== f.unidade || a.prazo_resgate_dias === null) return false;
  return f.comparacao === "exato" ? a.prazo_resgate_dias === f.dias : a.prazo_resgate_dias <= f.dias;
}

const valorDoIndicador = (v: boolean | null) => (v === true ? "sim" : v === false ? "nao" : NAO_INFORMADO_FILTRO);

/** Aplica os filtros às linhas já lidas; com algum filtro, o trânsito fica de fora (D8). */
export function filtrarAtivos<A extends Ativo>(ativos: readonly A[], f: FiltrosAtivos, taxonomia: Taxonomia): A[] {
  if (!algumFiltro(f)) return [...ativos];
  const semClasse = f.classe[0] === SEM_CLASSE_FILTRO;
  const nos = new Set(semClasse ? [] : f.classe.flatMap((id) => taxonomia.comDescendentes(id)));
  return ativos.filter(
    (a) =>
      a.sistema === null &&
      (f.classe.length === 0 || (semClasse ? a.taxonomia_id === null : a.taxonomia_id !== null && nos.has(a.taxonomia_id))) &&
      (f.instituicao.length === 0 ||
        (f.instituicao[0] === SEM_INSTITUICAO_FILTRO ? a.instituicao_id === null : a.instituicao_id !== null && f.instituicao.includes(a.instituicao_id))) &&
      confereConjunto(f.veiculo, a.veiculos_acesso) &&
      confereConjunto(f.indexador, a.indexadores_remuneracao) &&
      confere(f.regime, a.regime_tributario) &&
      conferePrazo(f.prazo, a) &&
      confere(f.fgc, a.cobertura_fgc) &&
      INDICADORES_VISIVEIS.every((i) => {
        const filtro = f.indicadores[i.coluna];
        return filtro === undefined || filtro === valorDoIndicador(a[i.coluna]);
      }),
  );
}

/**
 * Campos com filtro, para o contador do "Filtrar" (ciclo 018, D15 e P4): cada atributo conta uma vez,
 * mesmo com várias opções marcadas.
 */
export function camposComFiltro(f: FiltrosAtivos): number {
  return (
    Number(f.classe.length > 0) +
    Number(f.instituicao.length > 0) +
    Number(f.veiculo.length > 0) +
    Number(f.indexador.length > 0) +
    Number(f.regime !== null) +
    Number(f.prazo !== null) +
    Number(f.fgc !== null) +
    Object.keys(f.indicadores).length
  );
}

export const OPCAO_NAO_INFORMADO = { codigo: NAO_INFORMADO_FILTRO, rotulo: "Não informado" } as const;

/**
 * Opções de veículo ou indexador no filtro (ciclo 018, D14): só as presentes em algum ativo comum do
 * usuário, das duas abas, mais as marcadas na URL, em ordem de catálogo, e "Não informado" no fim.
 * Uma opção sem nenhum ativo nunca traria resultado.
 */
export function opcoesEmUso(catalogo: readonly OpcaoAtributo[], conjuntos: readonly (readonly string[])[], marcados: readonly string[]): OpcaoAtributo[] {
  const usados = new Set([...conjuntos.flat(), ...marcados]);
  return [...catalogo.filter((o) => usados.has(o.codigo)), OPCAO_NAO_INFORMADO];
}

export const OPCAO_SEM_CLASSE = { codigo: SEM_CLASSE_FILTRO, rotulo: "Sem classe" } as const;
export const OPCAO_SEM_INSTITUICAO = { codigo: SEM_INSTITUICAO_FILTRO, rotulo: "Sem instituição" } as const;

/**
 * Opções de classe no filtro (ciclo 019, D3): os nós usados por algum ativo comum, das duas abas, com
 * seus ancestrais, mais os marcados na URL, em ordem hierárquica, com o caminho completo como rótulo, e
 * "Sem classe" no fim. Um ancestral entra quando algum nó da sua subárvore está em uso.
 */
export function opcoesDeClasse(taxonomia: Taxonomia, usados: readonly (string | null)[], marcados: readonly string[]): OpcaoAtributo[] {
  const emUso = new Set(usados);
  const marcadas = new Set(marcados);
  const nos = taxonomia.opcoes.filter((o) => marcadas.has(o.id) || taxonomia.comDescendentes(o.id).some((id) => emUso.has(id)));
  return [...nos.map((o) => ({ codigo: o.id, rotulo: o.nome })), OPCAO_SEM_CLASSE];
}

/**
 * Opções de instituição no filtro (ciclo 019, D3): as usadas por algum ativo comum, das duas abas, mais
 * as marcadas na URL, em ordem alfabética, e "Sem instituição" no fim.
 */
export function opcoesDeInstituicao(
  instituicoes: readonly { id: string; nome: string }[],
  usadas: readonly (string | null)[],
  marcadas: readonly string[],
): OpcaoAtributo[] {
  const emUso = new Set([...usadas, ...marcadas]);
  const ordenadas = instituicoes.filter((i) => emUso.has(i.id)).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  return [...ordenadas.map((i) => ({ codigo: i.id, rotulo: i.nome })), OPCAO_SEM_INSTITUICAO];
}

/** Consulta só com os parâmetros de filtro preenchidos, na ordem fixa, para os links das abas. */
export function consultaDosFiltros(p: Parametros): URLSearchParams {
  const consulta = new URLSearchParams();
  for (const nome of PARAMETROS_FILTRO) for (const valor of preenchidos(p, nome)) consulta.append(nome, valor);
  return consulta;
}

/** Endereço de uma aba de /ativos, preservando os filtros. */
export function enderecoDaAba(aba: "em-uso" | "desativados", p: Parametros): string {
  const consulta = new URLSearchParams(aba === "desativados" ? { aba } : {});
  for (const [nome, valor] of consultaDosFiltros(p)) consulta.append(nome, valor);
  const texto = consulta.toString();
  return texto ? `/ativos?${texto}` : "/ativos";
}
