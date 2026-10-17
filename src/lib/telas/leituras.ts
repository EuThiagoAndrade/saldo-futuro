import "server-only";
import type { Evento, TipoAjuste } from "../financeiro/eventos";
import { type Cliente, ErroLeitura, lerComposicao, lerTabela, marcaCarteira } from "../leitura";
import { deLinhaEvento, type LinhaEvento } from "./carteira";
import { mesDaColuna, type PosicaoLida } from "./fechamento";

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

export function lerAtivos(cliente: Cliente, sinal?: AbortSignal): Promise<Ativo[]> {
  return lerTabela<Ativo>(cliente, "ativos", { colunas: "id, nome, tipo_ajuste, sistema, ativo, desativado_em", sinal });
}

export async function lerEventos(cliente: Cliente, sinal?: AbortSignal): Promise<Evento[]> {
  const linhas = await lerTabela<LinhaEvento>(cliente, "eventos", {
    colunas: "id, ativo_id, data, tipo, valor, estorno_de, transferencia_id",
    sinal,
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

export interface InsumosDoFechamento {
  ativos: Ativo[];
  eventos: Evento[];
  posicoes: PosicaoLida[];
  mesesFechados: string[];
}

/**
 * Insumos da prévia do fechamento, lidos como uma composição coerente (D13): ativos, eventos,
 * posições e meses fechados da mesma versão da carteira, ou ErroLeitura.
 */
export async function lerInsumosDoFechamento(cliente: Cliente): Promise<InsumosDoFechamento> {
  const { insumos } = await lerComposicao(
    (sinal) => marcaCarteira(cliente, sinal),
    async (_marca, sinal) => {
      const consolidados = await lerTabela<{ mes: string }>(cliente, "consolidados_mensais", { colunas: "mes", sinal });
      return {
        ativos: await lerAtivos(cliente, sinal),
        eventos: await lerEventos(cliente, sinal),
        posicoes: await lerTabela<PosicaoLida>(cliente, "posicoes_mensais", {
          colunas: "mes, ativo_id, saldo_inicial, saldo_final, ajuste, tipo_ajuste",
          sinal,
        }),
        mesesFechados: consolidados.map((c) => mesDaColuna(c.mes)),
      };
    },
  );
  return insumos;
}

export interface ConsolidadoLido {
  vi: number;
  vf: number;
  aportes: number;
  resgates: number;
  rendimento: number;
  marcacao: number;
  cambio: number;
  migracao: number;
}

export async function lerConsolidado(cliente: Cliente, mes: string): Promise<ConsolidadoLido | null> {
  const linhas = await lerTabela<ConsolidadoLido>(cliente, "consolidados_mensais", {
    colunas: "vi, vf, aportes, resgates, rendimento, marcacao, cambio, migracao",
    filtrar: (consulta) => consulta.eq("mes", `${mes}-01`),
  });
  return linhas[0] ?? null;
}

/** Último mês fechado e mês do evento mais antigo, para o aviso do Início. */
export async function lerMarcosDoFechamento(cliente: Cliente): Promise<{ ultimo: string | null; maisAntigo: string | null }> {
  const consolidados = await lerTabela<{ mes: string }>(cliente, "consolidados_mensais", { colunas: "mes" });
  const { data, error } = await cliente.from("eventos").select("data").order("data", { ascending: true }).limit(1);
  if (error) throw new ErroLeitura("pagina", error.message);
  return {
    ultimo: consolidados.length ? mesDaColuna(consolidados.at(-1)!.mes) : null,
    maisAntigo: data?.[0] ? mesDaColuna(data[0].data) : null,
  };
}

export interface InsumosDoInicio {
  ativos: Ativo[];
  eventos: Evento[];
  consolidados: { mes: string; vi: number; vf: number }[];
  posicoes: PosicaoLida[];
}

/** Insumos do Início, lidos como uma composição coerente (D13). */
export async function lerInsumosDoInicio(cliente: Cliente): Promise<InsumosDoInicio> {
  const { insumos } = await lerComposicao(
    (sinal) => marcaCarteira(cliente, sinal),
    async (_marca, sinal) => ({
      ativos: await lerAtivos(cliente, sinal),
      eventos: await lerEventos(cliente, sinal),
      consolidados: (await lerTabela<{ mes: string; vi: number; vf: number }>(cliente, "consolidados_mensais", { colunas: "mes, vi, vf", sinal })).map(
        (c) => ({ ...c, mes: mesDaColuna(c.mes) }),
      ),
      posicoes: await lerTabela<PosicaoLida>(cliente, "posicoes_mensais", {
        colunas: "mes, ativo_id, saldo_inicial, saldo_final, ajuste, tipo_ajuste",
        sinal,
      }),
    }),
  );
  return insumos;
}
