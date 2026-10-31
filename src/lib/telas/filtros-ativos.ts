import {
  COBERTURAS_FGC,
  type ColunaIndicador,
  EXCLUSIVOS_INDEXADOR,
  EXCLUSIVOS_VEICULO,
  INDEXADORES_REMUNERACAO,
  INDICADORES,
  MAXIMO_DIAS_PRAZO,
  type OpcaoAtributo,
  prazoLegivel,
  REGIMES_TRIBUTARIOS,
  SITUACOES_PRAZO,
  UNIDADES_PRAZO,
  VEICULOS_ACESSO,
} from "./detalhes-ativo";
import type { Ativo } from "./leituras";

// Filtros da página Ativos (ciclo 017, issue #174, P5 e D8). A URL é a fonte do estado: um
// formulário GET em /ativos, sem JavaScript para enviar. Mesmo atributo combina por OU (interseção
// com o conjunto do ativo), atributos diferentes por E. O prazo compara só o inteiro informado, na
// mesma unidade: Exatamente é igualdade e Até é <=, sem converter dias úteis e corridos nem calcular
// datas. "nao_informado" existe só aqui e seleciona o vazio ou o nulo, nunca o trânsito, que fica
// fora de qualquer filtro de atributos. Código desconhecido, escalar repetido, conjunto inválido ou
// tupla parcial são erro: a lista não vira Todos em silêncio.

export const NAO_INFORMADO_FILTRO = "nao_informado";

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
  "veiculo",
  "indexador",
  "regime",
  "prazo_resgate_tipo",
  "prazo_resgate_dias",
  "prazo_resgate_unidade",
  "prazo_resgate_comparacao",
  "fgc",
  ...INDICADORES.map((i) => i.coluna),
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

function conjunto(p: Parametros, nome: string, catalogo: readonly OpcaoAtributo[], exclusivos: readonly string[], rotulo: string): string[] {
  const valores = [...new Set(preenchidos(p, nome))];
  const validos = [...catalogo.map((o) => o.codigo), NAO_INFORMADO_FILTRO];
  if (valores.some((v) => !validos.includes(v))) throw new ErroFiltro(`${rotulo} tem uma opção desconhecida.`);
  if (valores.length > 1 && valores.some((v) => v === NAO_INFORMADO_FILTRO || exclusivos.includes(v))) {
    throw new ErroFiltro(`${rotulo}: Não informado e as opções exclusivas não combinam com outras.`);
  }
  return validos.filter((v) => valores.includes(v));
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
export function lerFiltros(p: Parametros): { filtros: FiltrosAtivos } | { erro: string } {
  try {
    const indicadores: FiltrosAtivos["indicadores"] = {};
    for (const i of INDICADORES) {
      const valor = escalar(p, i.coluna, ["sim", "nao", NAO_INFORMADO_FILTRO], i.rotulo);
      if (valor !== null) indicadores[i.coluna] = valor as "sim" | "nao" | typeof NAO_INFORMADO_FILTRO;
    }
    const codigos = (c: readonly OpcaoAtributo[]) => [...c.map((o) => o.codigo), NAO_INFORMADO_FILTRO];
    return {
      filtros: {
        veiculo: conjunto(p, "veiculo", VEICULOS_ACESSO, EXCLUSIVOS_VEICULO, "Veículo de acesso"),
        indexador: conjunto(p, "indexador", INDEXADORES_REMUNERACAO, EXCLUSIVOS_INDEXADOR, "Indexador da remuneração"),
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
  return f.veiculo.length > 0 || f.indexador.length > 0 || f.regime !== null || f.prazo !== null || f.fgc !== null || Object.keys(f.indicadores).length > 0;
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
export function filtrarAtivos<A extends Ativo>(ativos: readonly A[], f: FiltrosAtivos): A[] {
  if (!algumFiltro(f)) return [...ativos];
  return ativos.filter(
    (a) =>
      a.sistema === null &&
      confereConjunto(f.veiculo, a.veiculos_acesso) &&
      confereConjunto(f.indexador, a.indexadores_remuneracao) &&
      confere(f.regime, a.regime_tributario) &&
      conferePrazo(f.prazo, a) &&
      confere(f.fgc, a.cobertura_fgc) &&
      INDICADORES.every((i) => {
        const filtro = f.indicadores[i.coluna];
        return filtro === undefined || filtro === valorDoIndicador(a[i.coluna]);
      }),
  );
}

const rotulo = (catalogo: readonly OpcaoAtributo[], codigo: string) =>
  codigo === NAO_INFORMADO_FILTRO ? "Não informado" : (catalogo.find((o) => o.codigo === codigo)?.rotulo ?? codigo);

/** Filtros aplicados em texto, para ficarem visíveis com o painel fechado. */
export function descreverFiltros(f: FiltrosAtivos): string[] {
  const itens: string[] = [];
  if (f.veiculo.length) itens.push(`Veículo: ${f.veiculo.map((c) => rotulo(VEICULOS_ACESSO, c)).join(" ou ")}`);
  if (f.indexador.length) itens.push(`Indexador: ${f.indexador.map((c) => rotulo(INDEXADORES_REMUNERACAO, c)).join(" ou ")}`);
  if (f.regime) itens.push(`Regime: ${rotulo(REGIMES_TRIBUTARIOS, f.regime)}`);
  if (f.prazo) {
    const p = f.prazo;
    itens.push(
      "comparacao" in p
        ? `Prazo: ${p.comparacao === "exato" ? "exatamente" : "até"} ${prazoLegivel({ prazo_resgate_tipo: "prazo", prazo_resgate_dias: p.dias, prazo_resgate_unidade: p.unidade })}`
        : `Prazo: ${rotulo(SITUACOES_PRAZO, p.tipo)}`,
    );
  }
  if (f.fgc) itens.push(`FGC: ${rotulo(COBERTURAS_FGC, f.fgc)}`);
  for (const i of INDICADORES) {
    const v = f.indicadores[i.coluna];
    if (v) itens.push(`${i.rotulo}: ${v === "sim" ? "Sim" : v === "nao" ? "Não" : "Não informado"}`);
  }
  return itens;
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
