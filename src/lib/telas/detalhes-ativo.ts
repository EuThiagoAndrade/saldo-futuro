import { z } from "zod";

// Campos descritivos do ativo (ciclo 012, issue #128, BL-009): instituição, classe e quatro
// indicadores em três estados. Só descrevem o ativo; nenhum cálculo os lê. A classe é um nó da
// taxonomia global (ciclo 013, issue #138): só o ID de um nó escolhido na lista vale, sem criação
// e sem nome digitado. A leitura do formulário é pura: devolve os parâmetros descritivos de
// cadastrar_ativo_com_atributos e editar_ativo_com_atributos (ciclo 017), ou a recusa.

export const INDICADORES = [
  { campo: "previdencia", coluna: "previdencia", rotulo: "Previdência" },
  { campo: "liquidezImediata", coluna: "liquidez_imediata", rotulo: "Liquidez imediata (reserva)" },
  { campo: "exposicaoCambial", coluna: "exposicao_cambial", rotulo: "Exposição cambial" },
  { campo: "isentoIr", coluna: "isento_ir", rotulo: "Isento de IR" },
] as const;

export type ColunaIndicador = (typeof INDICADORES)[number]["coluna"];

/** Valores dos rádios: "sim", "nao" ou vazio (não informado). */
export const OPCOES_INDICADOR = [
  { valor: "sim", rotulo: "Sim" },
  { valor: "nao", rotulo: "Não" },
  { valor: "", rotulo: "Não informado" },
] as const;

// Atributos complementares (ciclo 017, issue #173, BL-015): anotações manuais, independentes da
// classe. Códigos e ordem iguais aos do banco (migração 20261031000721), que é a autoridade; os
// rótulos são os de D10. O sistema não calcula imposto, prazo nem garantia com eles.

export interface OpcaoAtributo<C extends string = string> {
  codigo: C;
  rotulo: string;
}

export const VEICULOS_ACESSO = [
  { codigo: "direto", rotulo: "Direto" },
  { codigo: "fundo", rotulo: "Fundo" },
  { codigo: "etf", rotulo: "ETF" },
  { codigo: "plano_contrato", rotulo: "Plano ou contrato" },
  { codigo: "certificado_representativo", rotulo: "BDR ou certificado de depósito" },
  { codigo: "outro", rotulo: "Outro" },
  { codigo: "nao_aplicavel", rotulo: "Não se aplica" },
] as const satisfies readonly OpcaoAtributo[];

export const INDEXADORES_REMUNERACAO = [
  { codigo: "cdi", rotulo: "CDI" },
  { codigo: "selic", rotulo: "Selic" },
  { codigo: "ipca", rotulo: "IPCA" },
  { codigo: "igpm", rotulo: "IGP-M" },
  { codigo: "tr", rotulo: "TR" },
  { codigo: "variacao_cambial", rotulo: "Variação cambial" },
  { codigo: "inpc", rotulo: "INPC" },
  { codigo: "sem_indexador", rotulo: "Prefixado (sem indexador)" },
  { codigo: "outro", rotulo: "Outro" },
  { codigo: "nao_aplicavel", rotulo: "Não se aplica" },
] as const satisfies readonly OpcaoAtributo[];

export const REGIMES_TRIBUTARIOS = [
  { codigo: "renda_fixa_por_prazo", rotulo: "Renda fixa — por prazo" },
  { codigo: "fundos_longo_prazo", rotulo: "Fundos — longo prazo" },
  { codigo: "fundos_curto_prazo", rotulo: "Fundos — curto prazo" },
  { codigo: "previdencia_progressivo", rotulo: "Previdência — progressivo" },
  { codigo: "previdencia_regressivo", rotulo: "Previdência — regressivo" },
  { codigo: "renda_variavel", rotulo: "Renda variável" },
  { codigo: "outro", rotulo: "Outro" },
  { codigo: "nao_aplicavel", rotulo: "Não se aplica" },
] as const satisfies readonly OpcaoAtributo[];

/** Situações do prazo; só "prazo" leva dias e unidade. */
export const SITUACOES_PRAZO = [
  { codigo: "prazo", rotulo: "Prazo em dias" },
  { codigo: "no_vencimento", rotulo: "No vencimento" },
  { codigo: "sem_prazo_estimavel", rotulo: "Sem prazo estimável" },
  { codigo: "nao_aplicavel", rotulo: "Não se aplica" },
] as const satisfies readonly OpcaoAtributo[];

export const UNIDADES_PRAZO = [
  { codigo: "uteis", rotulo: "Dias úteis" },
  { codigo: "corridos", rotulo: "Dias corridos" },
] as const satisfies readonly OpcaoAtributo[];

export const COBERTURAS_FGC = [
  { codigo: "sim", rotulo: "Sim" },
  { codigo: "nao", rotulo: "Não" },
  { codigo: "nao_aplicavel", rotulo: "Não se aplica" },
] as const satisfies readonly OpcaoAtributo[];

/** Opções que não convivem com nenhuma outra no mesmo conjunto. */
export const EXCLUSIVOS_VEICULO: readonly string[] = ["nao_aplicavel"];
export const EXCLUSIVOS_INDEXADOR: readonly string[] = ["sem_indexador", "nao_aplicavel"];

/** Maior número de dias que o banco guarda (o limite de `integer` do PostgreSQL). */
export const MAXIMO_DIAS_PRAZO = 2147483647;

/** Texto confirmado em D9, no topo de "Mais detalhes". */
export const AVISO_ATRIBUTOS =
  "Informações preenchidas por você. O Saldo Futuro não calcula imposto, prazo de resgate ou valor garantido com estes campos.";

/** Ajuda do prazo (P2, ajustada em D11): orientação de preenchimento manual, sem conversão pelo sistema. */
export const AJUDA_PRAZO =
  "Informe o prazo total até o dinheiro estar disponível após solicitar o resgate ou a venda, depois de cumpridas eventuais carências. Se cotização e liquidação estiverem em unidades diferentes, registre o total em dias corridos, arredondando para cima. O Saldo Futuro não converte nem soma essas etapas. Se não souber o total, deixe Não informado.";

export interface AtributosAtivo {
  veiculos_acesso: string[];
  indexadores_remuneracao: string[];
  regime_tributario: string | null;
  prazo_resgate_tipo: string | null;
  prazo_resgate_dias: number | null;
  prazo_resgate_unidade: string | null;
  cobertura_fgc: string | null;
}

export interface ParametrosDetalhes {
  p_instituicao: string | null;
  p_instituicao_nova: string | null;
  p_taxonomia: string | null;
  p_previdencia: boolean | null;
  p_liquidez_imediata: boolean | null;
  p_exposicao_cambial: boolean | null;
  p_isento_ir: boolean | null;
  p_veiculos_acesso: string[];
  p_indexadores_remuneracao: string[];
  p_regime_tributario: string | null;
  p_prazo_resgate_tipo: string | null;
  p_prazo_resgate_dias: number | null;
  p_prazo_resgate_unidade: string | null;
  p_cobertura_fgc: string | null;
}

const referencia = (mensagem: string) =>
  z.union([z.literal(""), z.uuid({ error: mensagem })]).transform((v) => (v === "" ? null : v));
const nomeNovo = (mensagem: string) =>
  z.string().trim().max(100, mensagem).transform((v) => (v === "" ? null : v));
const indicador = z.enum(["sim", "nao", ""], { error: "Escolha Sim, Não ou Não informado." }).transform((v) =>
  v === "sim" ? true : v === "nao" ? false : null,
);

const detalhes = z.object({
  instituicao: referencia("Escolha uma instituição da lista ou cadastre uma nova."),
  instituicaoNova: nomeNovo("Use até 100 caracteres no nome da instituição."),
  taxonomia: referencia("Escolha uma classe da lista."),
  previdencia: indicador,
  liquidezImediata: indicador,
  exposicaoCambial: indicador,
  isentoIr: indicador,
});

const texto = (dados: FormData, nome: string) => {
  const valor = dados.get(nome);
  return typeof valor === "string" ? valor : "";
};

const codigos = (catalogo: readonly OpcaoAtributo[]) => catalogo.map((o) => o.codigo);

/**
 * Conjunto marcado em checkboxes de mesmo `name`: só códigos do catálogo, repetições descartadas e
 * ordem do catálogo; um código exclusivo junto com outro é recusado, nunca descartado em silêncio.
 */
function lerConjunto(
  dados: FormData,
  nome: string,
  catalogo: readonly OpcaoAtributo[],
  exclusivos: readonly string[],
  mensagens: { invalido: string; exclusivo: string },
): { erro: string } | { valor: string[] } {
  const marcados = dados.getAll(nome);
  if (marcados.some((v) => typeof v !== "string" || !codigos(catalogo).includes(v))) return { erro: mensagens.invalido };
  const valor = codigos(catalogo).filter((c) => marcados.includes(c));
  if (valor.length > 1 && valor.some((c) => exclusivos.includes(c))) return { erro: mensagens.exclusivo };
  return { valor };
}

/** Escolha única de um `select`: vazio é não informado; outro texto fora do catálogo é recusado. */
function lerEscolha(dados: FormData, nome: string, catalogo: readonly OpcaoAtributo[], mensagem: string): { erro: string } | { valor: string | null } {
  const valor = texto(dados, nome);
  if (valor === "") return { valor: null };
  return codigos(catalogo).includes(valor) ? { valor } : { erro: mensagem };
}

/**
 * Prazo informado para resgate ou venda (P2): "Prazo em dias" exige dias inteiros de 0 ao limite do
 * banco e a unidade; as demais situações e o não informado não levam dias nem unidade. Nada é
 * convertido, somado ou arredondado: "2,2" é recusado, não vira 2 nem 3.
 */
function lerPrazo(dados: FormData): { erro: string } | { valor: Pick<AtributosAtivo, "prazo_resgate_tipo" | "prazo_resgate_dias" | "prazo_resgate_unidade"> } {
  const tipo = lerEscolha(dados, "prazoTipo", SITUACOES_PRAZO, "Escolha uma situação do prazo da lista.");
  if ("erro" in tipo) return tipo;
  const dias = texto(dados, "prazoDias").trim();
  const unidade = texto(dados, "prazoUnidade");
  if (tipo.valor !== "prazo") {
    if (dias !== "" || unidade !== "") return { erro: "Dias e unidade só valem com Prazo em dias." };
    return { valor: { prazo_resgate_tipo: tipo.valor, prazo_resgate_dias: null, prazo_resgate_unidade: null } };
  }
  if (!/^\d+$/.test(dias) || Number(dias) > MAXIMO_DIAS_PRAZO) {
    return { erro: "Informe os dias como número inteiro, de 0 a 2.147.483.647, sem vírgula." };
  }
  if (!codigos(UNIDADES_PRAZO).includes(unidade)) return { erro: "Escolha Dias úteis ou Dias corridos." };
  return { valor: { prazo_resgate_tipo: "prazo", prazo_resgate_dias: Number(dias), prazo_resgate_unidade: unidade } };
}

/** Lê os atributos complementares do formulário; ausente vale como não informado. */
export function lerAtributos(dados: FormData): { erro: string } | { atributos: AtributosAtivo } {
  const veiculos = lerConjunto(dados, "veiculo", VEICULOS_ACESSO, EXCLUSIVOS_VEICULO, {
    invalido: "Escolha os veículos de acesso da lista.",
    exclusivo: "Não se aplica não pode ser marcado junto com outro veículo.",
  });
  if ("erro" in veiculos) return veiculos;
  const indexadores = lerConjunto(dados, "indexador", INDEXADORES_REMUNERACAO, EXCLUSIVOS_INDEXADOR, {
    invalido: "Escolha os indexadores da lista.",
    exclusivo: "Prefixado (sem indexador) e Não se aplica não podem ser marcados junto com outro indexador.",
  });
  if ("erro" in indexadores) return indexadores;
  const regime = lerEscolha(dados, "regime", REGIMES_TRIBUTARIOS, "Escolha um regime tributário da lista.");
  if ("erro" in regime) return regime;
  const prazo = lerPrazo(dados);
  if ("erro" in prazo) return prazo;
  const fgc = lerEscolha(dados, "fgc", COBERTURAS_FGC, "Escolha Sim, Não, Não se aplica ou Não informado na cobertura do FGC.");
  if ("erro" in fgc) return fgc;
  return {
    atributos: {
      veiculos_acesso: veiculos.valor,
      indexadores_remuneracao: indexadores.valor,
      regime_tributario: regime.valor,
      ...prazo.valor,
      cobertura_fgc: fgc.valor,
    },
  };
}

/** Lê os campos descritivos do formulário; ausente vale como vazio (não informado). */
export function lerDetalhes(dados: FormData): { erro: string } | { parametros: ParametrosDetalhes } {
  const entrada = detalhes.safeParse(
    Object.fromEntries(
      ["instituicao", "instituicaoNova", "taxonomia", ...INDICADORES.map((i) => i.campo)].map((nome) => [nome, texto(dados, nome)]),
    ),
  );
  if (!entrada.success) return { erro: entrada.error.issues[0].message };
  const atributos = lerAtributos(dados);
  if ("erro" in atributos) return atributos;
  const d = entrada.data;
  const a = atributos.atributos;
  return {
    parametros: {
      p_instituicao: d.instituicao,
      p_instituicao_nova: d.instituicaoNova,
      p_taxonomia: d.taxonomia,
      p_previdencia: d.previdencia,
      p_liquidez_imediata: d.liquidezImediata,
      p_exposicao_cambial: d.exposicaoCambial,
      p_isento_ir: d.isentoIr,
      p_veiculos_acesso: a.veiculos_acesso,
      p_indexadores_remuneracao: a.indexadores_remuneracao,
      p_regime_tributario: a.regime_tributario,
      p_prazo_resgate_tipo: a.prazo_resgate_tipo,
      p_prazo_resgate_dias: a.prazo_resgate_dias,
      p_prazo_resgate_unidade: a.prazo_resgate_unidade,
      p_cobertura_fgc: a.cobertura_fgc,
    },
  };
}

/** Algum atributo complementar informado (abre "Mais detalhes" na edição). */
export function algumAtributoInformado(a: AtributosAtivo): boolean {
  return (
    a.veiculos_acesso.length > 0 ||
    a.indexadores_remuneracao.length > 0 ||
    a.regime_tributario !== null ||
    a.prazo_resgate_tipo !== null ||
    a.cobertura_fgc !== null
  );
}

/**
 * Marcar um código num conjunto, como a pessoa espera dos checkboxes: um exclusivo desmarca os
 * demais, e um comum desmarca os exclusivos. O servidor e o banco continuam recusando o conjunto
 * inválido; isto só orienta. Devolve na ordem do catálogo.
 */
export function alternarNoConjunto(
  atual: readonly string[],
  codigo: string,
  marcado: boolean,
  catalogo: readonly OpcaoAtributo[],
  exclusivos: readonly string[],
): string[] {
  let proximo: string[];
  if (!marcado) proximo = atual.filter((c) => c !== codigo);
  else if (exclusivos.includes(codigo)) proximo = [codigo];
  else proximo = [...atual.filter((c) => !exclusivos.includes(c)), codigo];
  return codigos(catalogo).filter((c) => proximo.includes(c));
}

/** O nome como o banco o guarda: `btrim` tira só o espaço comum (U+0020), nunca NBSP, tabulação nem quebra de linha. */
export function aparar(valor: string): string {
  return valor.replace(/^ +| +$/g, "");
}

/**
 * Nome na edição do ativo (ciclo 015, issue #153), com a semântica do banco: de 1 a 100 caracteres
 * Unicode (pontos de código, não unidades UTF-16) depois do `btrim`. Não impõe unicidade nem altera
 * acentos ou espaços internos.
 */
export function lerNome(dados: FormData): { erro: string } | { nome: string } {
  const nome = aparar(texto(dados, "nome"));
  if (nome === "") return { erro: "Informe o nome do ativo." };
  if ([...nome].length > 100) return { erro: "Use até 100 caracteres." };
  return { nome };
}

/** Valor do rádio para um indicador gravado. */
export function valorDoIndicador(valor: boolean | null): "sim" | "nao" | "" {
  return valor === true ? "sim" : valor === false ? "nao" : "";
}

// Resumo "Ver detalhes" da página Ativos (ciclo 017, issue #174, P6): os cinco atributos e os quatro
// indicadores, na ordem dos grupos do formulário, com "Não informado" explícito. Conjuntos na ordem
// do catálogo. Um código fora do catálogo é erro de leitura, nunca vira ausência.

export interface ItemResumo {
  rotulo: string;
  valor: string;
}

const NAO_INFORMADO = "Não informado";

function rotuloDe(catalogo: readonly OpcaoAtributo[], codigo: string): string {
  const opcao = catalogo.find((o) => o.codigo === codigo);
  if (!opcao) throw new Error(`código de atributo desconhecido: ${codigo}`);
  return opcao.rotulo;
}

const conjuntoLegivel = (catalogo: readonly OpcaoAtributo[], valores: readonly string[]) =>
  valores.length === 0 ? NAO_INFORMADO : codigos(catalogo).filter((c) => valores.includes(c)).map((c) => rotuloDe(catalogo, c)).join(", ");

const escolhaLegivel = (catalogo: readonly OpcaoAtributo[], valor: string | null) => (valor === null ? NAO_INFORMADO : rotuloDe(catalogo, valor));

const indicadorLegivel = (valor: boolean | null) => (valor === true ? "Sim" : valor === false ? "Não" : NAO_INFORMADO);

/** Prazo como foi informado: número e unidade ("0 dias úteis", "1 dia corrido") ou a situação; nada é convertido. */
export function prazoLegivel(a: Pick<AtributosAtivo, "prazo_resgate_tipo" | "prazo_resgate_dias" | "prazo_resgate_unidade">): string {
  if (a.prazo_resgate_tipo === null) return NAO_INFORMADO;
  if (a.prazo_resgate_tipo !== "prazo") return rotuloDe(SITUACOES_PRAZO, a.prazo_resgate_tipo);
  const dias = a.prazo_resgate_dias;
  const unidade = a.prazo_resgate_unidade;
  if (dias === null || unidade === null) throw new Error("prazo sem dias ou unidade");
  const uteis = unidade === "uteis";
  if (!uteis && unidade !== "corridos") throw new Error(`unidade desconhecida: ${unidade}`);
  const palavra = dias === 1 ? (uteis ? "dia útil" : "dia corrido") : uteis ? "dias úteis" : "dias corridos";
  return `${dias.toLocaleString("pt-BR")} ${palavra}`;
}

export function resumoDosAtributos(a: AtributosAtivo & Record<ColunaIndicador, boolean | null>): ItemResumo[] {
  return [
    { rotulo: "Veículo de acesso", valor: conjuntoLegivel(VEICULOS_ACESSO, a.veiculos_acesso) },
    { rotulo: "Previdência", valor: indicadorLegivel(a.previdencia) },
    { rotulo: "Indexador da remuneração", valor: conjuntoLegivel(INDEXADORES_REMUNERACAO, a.indexadores_remuneracao) },
    { rotulo: "Exposição cambial", valor: indicadorLegivel(a.exposicao_cambial) },
    { rotulo: "Regime tributário", valor: escolhaLegivel(REGIMES_TRIBUTARIOS, a.regime_tributario) },
    { rotulo: "Isento de IR", valor: indicadorLegivel(a.isento_ir) },
    { rotulo: "Prazo para resgate ou venda", valor: prazoLegivel(a) },
    { rotulo: "Liquidez imediata (reserva)", valor: indicadorLegivel(a.liquidez_imediata) },
    { rotulo: "Cobertura do FGC", valor: escolhaLegivel(COBERTURAS_FGC, a.cobertura_fgc) },
  ];
}
