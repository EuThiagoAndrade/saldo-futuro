// Composição das telas de ativos, lançamentos e transferências (D3 e D4 do ciclo 004). Funções
// puras: nenhuma conta nova, só a tradução entre o que a pessoa escolhe na tela e as regras da
// KB-004 (seção 4), e entre as recusas do banco e mensagens em português.

import { type Centavos, deNumero, RecusaFinanceira } from "../financeiro/centavos";
import type { DataCivil } from "../financeiro/datas";
import { conferirLancamento, type Evento, type TipoEvento } from "../financeiro/eventos";

/** Tipos lançáveis pela tela. Migração histórica só entra pelo migrador (ciclo 005). */
export const TIPOS_DA_TELA = ["aporte", "resgate", "rendimento", "marcacao", "cambio"] as const;
export type TipoDaTela = (typeof TIPOS_DA_TELA)[number];
export type Direcao = "ganho" | "perda";

export const ROTULO_TIPO: Record<TipoEvento, string> = {
  aporte: "Aporte",
  resgate: "Resgate",
  rendimento: "Rendimento",
  marcacao: "Marcação a mercado",
  cambio: "Câmbio",
  migracao: "Migração histórica",
  transferencia: "Transferência",
  estorno: "Estorno",
};

/** Rendimento, marcação e câmbio aceitam os dois sinais: a direção é escolhida na tela (P9). */
export function exigeDirecao(tipo: TipoDaTela): boolean {
  return tipo === "rendimento" || tipo === "marcacao" || tipo === "cambio";
}

/**
 * Valor com o sinal da KB-004 (seção 4.2) a partir do valor digitado sempre positivo (P9):
 * aporte positivo, resgate negativo, e os demais pela direção "Ganho" ou "Perda".
 */
export function valorComSinal(tipo: TipoDaTela, direcao: Direcao | undefined, digitado: bigint): Centavos {
  if (digitado <= 0n) throw new RecusaFinanceira("valor");
  let valor = digitado;
  if (tipo === "resgate") valor = -digitado;
  else if (exigeDirecao(tipo)) {
    if (!direcao) throw new RecusaFinanceira("direcao");
    if (direcao === "perda") valor = -digitado;
  }
  return conferirLancamento(tipo, valor);
}

/** Linha de public.eventos como a Data API a devolve. */
export interface LinhaEvento {
  id: string;
  ativo_id: string;
  data: DataCivil;
  tipo: TipoEvento;
  valor: number;
  estorno_de: string | null;
  transferencia_id: string | null;
}

export function deLinhaEvento(linha: LinhaEvento): Evento {
  return {
    id: linha.id,
    ativo: linha.ativo_id,
    data: linha.data,
    tipo: linha.tipo,
    valor: deNumero(linha.valor),
    estornoDe: linha.estorno_de ?? undefined,
    transferencia: linha.transferencia_id ?? undefined,
  };
}

/** Rótulo do evento na lista e no detalhe. */
export function descreverEvento(evento: Evento, porId: ReadonlyMap<string, Evento>): string {
  if (evento.tipo === "transferencia") return evento.valor < 0n ? "Transferência (saída)" : "Transferência (entrada)";
  if (evento.tipo === "estorno") {
    if (evento.transferencia) return "Correção de transferência";
    const referencia = evento.estornoDe ? porId.get(evento.estornoDe) : undefined;
    return referencia ? `Estorno de ${ROTULO_TIPO[referencia.tipo].toLowerCase()}` : "Estorno";
  }
  return ROTULO_TIPO[evento.tipo];
}

/** Um evento pode ser estornado pela tela: lançamento comum, ainda não estornado (KB-004, 4.3). */
export function podeEstornar(evento: Evento, eventos: readonly Evento[]): boolean {
  if (evento.tipo === "estorno" || evento.tipo === "transferencia") return false;
  return !eventos.some((e) => e.estornoDe === evento.id);
}

export interface Transferencia {
  id: string;
  data: DataCivil;
  origem: string;
  destino: string;
  valor: Centavos;
  /** Data da correção (K6), se houver. */
  correcao: DataCivil | null;
}

/** As duas pernas de cada transferência viram uma linha: origem, destino e valor positivo. */
export function montarTransferencias(cabecalhos: { id: string; data: DataCivil }[], eventos: readonly Evento[]): Transferencia[] {
  return cabecalhos.map((t) => {
    const pernas = eventos.filter((e) => e.transferencia === t.id && e.tipo === "transferencia");
    const saida = pernas.find((e) => e.valor < 0n);
    const entrada = pernas.find((e) => e.valor > 0n);
    if (!saida || !entrada) throw new Error(`transferência sem as duas pernas: ${t.id}`);
    const correcao = eventos.find((e) => e.transferencia === t.id && e.tipo === "estorno");
    return { id: t.id, data: t.data, origem: saida.ativo, destino: entrada.ativo, valor: entrada.valor, correcao: correcao?.data ?? null };
  });
}

const MENSAGENS: Record<string, string> = {
  ativo_inexistente: "Ativo não encontrado.",
  ativo_invalido: "Este ativo não aceita a operação: ele está desativado ou é o ativo de sistema Em trânsito.",
  data: "A data precisa ser igual ou posterior à do lançamento original.",
  data_futura: "A data não pode ser posterior a hoje.",
  mes_fechado: "Esse mês já está fechado. Use uma data a partir do primeiro mês aberto.",
  estorno_invalido: "Esse lançamento não pode ser estornado. Estornos não são estornados, e transferências são corrigidas por inteiro.",
  evento_inexistente: "Lançamento não encontrado.",
  faixa: "O valor está fora do limite aceito.",
  ja_corrigida: "Essa transferência já foi corrigida.",
  ja_estornado: "Esse lançamento já foi estornado.",
  mesmo_ativo: "Escolha ativos diferentes para a origem e o destino.",
  saldo_nao_zero: "Só é possível desativar um ativo com saldo zero.",
  sinal: "O valor precisa ser maior que zero.",
  valor: "O valor precisa ser maior que zero.",
  direcao: "Escolha Ganho ou Perda.",
  tipo: "Escolha um tipo de lançamento.",
  tipo_ajuste: "Escolha o tipo de ajuste do ativo.",
  transferencia_inexistente: "Transferência não encontrada.",
  nao_autenticado: "Sua sessão terminou. Entre de novo.",
  // Instituições (ciclo 012) e classe do ativo, que é um nó da taxonomia global (ciclo 013).
  nome: "Informe um nome de 1 a 100 caracteres.",
  nome_repetido: "Esse nome já está cadastrado.",
  em_uso: "Só é possível excluir sem nenhum ativo vinculado, em uso ou desativado.",
  instituicao_inexistente: "Instituição não encontrada.",
  taxonomia_inexistente: "Classe não encontrada. Escolha uma da lista.",
  referencia_dupla: "Escolha uma opção da lista ou cadastre uma nova, não as duas.",
  // Atributos complementares do ativo (ciclo 017): o banco confere catálogo, exclusividade e prazo.
  veiculos_acesso: "Confira os veículos de acesso: escolha da lista, e Não se aplica sozinho.",
  indexadores_remuneracao: "Confira os indexadores: escolha da lista, e Prefixado (sem indexador) ou Não se aplica sozinhos.",
  regime_tributario: "Escolha um regime tributário da lista.",
  prazo_resgate: "Confira o prazo: Prazo em dias pede dias inteiros e unidade; as outras situações não levam dias.",
  cobertura_fgc: "Escolha Sim, Não, Não se aplica ou Não informado na cobertura do FGC.",
  // Fechamento (KB-004, seção 5).
  pendencia: "Informe o saldo real de todos os ativos do mês, mesmo que igual ao calculado.",
  identidade: "Os saldos não fecham com os lançamentos do mês. Confira os valores e tente de novo.",
  sequencia: "Os meses são fechados em ordem: feche antes o mês seguinte ao último fechado.",
  inicio: "O primeiro fechamento é o do mês do lançamento mais antigo.",
  mes_nao_terminado: "O mês só pode ser fechado depois do seu último dia.",
  reabertura: "Só o último mês fechado pode ser reaberto.",
  mes_invalido: "Mês inválido.",
  saldos_invalidos: "Há saldo informado para um ativo que não entra neste fechamento.",
};

export const MENSAGEM_GENERICA = "Não foi possível concluir a operação. Tente novamente.";

/** Recusa do banco ("recusado_<motivo>") ou das regras locais → mensagem em português. */
export function mensagemDeRecusa(erro: unknown): string {
  // O erro da Data API é um objeto com `message`, não uma instância de Error.
  const texto =
    typeof erro === "string"
      ? erro
      : typeof erro === "object" && erro !== null && typeof (erro as { message?: unknown }).message === "string"
        ? (erro as { message: string }).message
        : "";
  const motivo = erro instanceof RecusaFinanceira ? erro.motivo : /recusado_([a-z_]+)/.exec(texto)?.[1];
  return (motivo && MENSAGENS[motivo]) || MENSAGEM_GENERICA;
}
