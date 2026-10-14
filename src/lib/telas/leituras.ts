import "server-only";
import type { Evento, TipoAjuste } from "../financeiro/eventos";
import { type Cliente, lerTabela } from "../leitura";
import { deLinhaEvento, type LinhaEvento } from "./carteira";

// Leituras completas das telas da carteira (D13): todas as linhas, na ordem declarada, com a
// sessão do usuário (a RLS restringe às próprias linhas).

export interface Ativo {
  id: string;
  nome: string;
  tipo_ajuste: TipoAjuste | null;
  sistema: "transito" | null;
  ativo: boolean;
  desativado_em: string | null;
}

export function lerAtivos(cliente: Cliente): Promise<Ativo[]> {
  return lerTabela<Ativo>(cliente, "ativos", { colunas: "id, nome, tipo_ajuste, sistema, ativo, desativado_em" });
}

export async function lerEventos(cliente: Cliente): Promise<Evento[]> {
  const linhas = await lerTabela<LinhaEvento>(cliente, "eventos", {
    colunas: "id, ativo_id, data, tipo, valor, estorno_de, transferencia_id",
  });
  return linhas.map(deLinhaEvento);
}

export function lerCabecalhosDeTransferencia(cliente: Cliente): Promise<{ id: string; data: string }[]> {
  return lerTabela(cliente, "transferencias", { colunas: "id, data" });
}

export interface Ajuste {
  ativo_id: string;
  ajuste: number;
  tipo_ajuste: TipoAjuste | null;
}

/** Ajustes do fechamento de um mês fechado (KB-004, seção 5); vazio se o mês não está fechado. */
export function lerAjustes(cliente: Cliente, mes: string): Promise<Ajuste[]> {
  return lerTabela<Ajuste>(cliente, "posicoes_mensais", {
    colunas: "ativo_id, ajuste, tipo_ajuste",
    filtrar: (consulta) => consulta.eq("mes", `${mes}-01`).neq("ajuste", 0),
  });
}

/** O mês está fechado: existe o consolidado. */
export async function mesFechado(cliente: Cliente, mes: string): Promise<boolean> {
  const linhas = await lerTabela(cliente, "consolidados_mensais", {
    colunas: "mes",
    filtrar: (consulta) => consulta.eq("mes", `${mes}-01`),
  });
  return linhas.length > 0;
}

/** Ativos que aceitam lançamento comum: em uso e não de sistema (KB-004, 4.1 e 4.4). */
export function ativosLancaveis(ativos: Ativo[]): Ativo[] {
  return ativos.filter((a) => a.ativo && !a.sistema);
}

/** Ativos que podem ser origem ou destino de transferência: em uso, trânsito incluído. */
export function ativosTransferiveis(ativos: Ativo[]): Ativo[] {
  return ativos.filter((a) => a.ativo);
}

export function nomeDoAtivo(ativos: Ativo[], id: string): string {
  const ativo = ativos.find((a) => a.id === id);
  if (!ativo) return "Ativo";
  return ativo.sistema === "transito" ? "Em trânsito" : ativo.nome;
}
