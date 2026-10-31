import "server-only";
import type { Evento, TipoAjuste } from "../financeiro/eventos";
import { type Cliente, type ClienteComRpc, ErroLeitura, lerComposicao, lerTabela, marcaCarteira, versaoMetadados } from "../leitura";
import { deLinhaEvento, type LinhaEvento } from "./carteira";
import type { EntradaCatalogo, VinculoDoAtivo } from "./catalogos";
import { ordenarPorNome } from "./combobox";
import type { AtributosAtivo } from "./detalhes-ativo";
import { mesDaColuna, type PosicaoLida } from "./fechamento";
import { montarTaxonomia, type NoTaxonomia, type Taxonomia } from "./taxonomia";

// Leituras completas das telas da carteira (D13): todas as linhas, na ordem declarada, com a
// sessão do usuário (a RLS restringe às próprias linhas).

// Atributos complementares (ciclo 017, issue #173): anotações manuais, lidas para o formulário de
// edição; nenhum cálculo os lê. Colunas obrigatórias: sem a migração, a leitura falha, sem trocar os
// atributos por ausência.
export interface Ativo extends AtributosAtivo {
  id: string;
  nome: string;
  tipo_ajuste: TipoAjuste | null;
  sistema: "transito" | null;
  ativo: boolean;
  desativado_em: string | null;
  // Campos descritivos (ciclo 012, issue #128): nenhum cálculo os lê.
  instituicao_id: string | null;
  // Classe: nó da taxonomia global (ciclo 013); classe_id é o legado do ciclo 012, só de leitura,
  // lido apenas para a dica "antes: X" de quem ficou sem nó.
  taxonomia_id: string | null;
  classe_id: string | null;
  previdencia: boolean | null;
  liquidez_imediata: boolean | null;
  exposicao_cambial: boolean | null;
  isento_ir: boolean | null;
}

const COLUNAS_ATIVO =
  "id, nome, tipo_ajuste, sistema, ativo, desativado_em, instituicao_id, taxonomia_id, classe_id, previdencia, liquidez_imediata, exposicao_cambial, isento_ir, " +
  "veiculos_acesso, indexadores_remuneracao, regime_tributario, prazo_resgate_tipo, prazo_resgate_dias, prazo_resgate_unidade, cobertura_fgc";

export function lerAtivos(cliente: Cliente, sinal?: AbortSignal): Promise<Ativo[]> {
  return lerTabela<Ativo>(cliente, "ativos", { colunas: COLUNAS_ATIVO, sinal });
}

// Catálogo de instituições do usuário (ciclo 012, issue #127) e uso pelos ativos.
export function lerInstituicoes(cliente: Cliente, sinal?: AbortSignal): Promise<EntradaCatalogo[]> {
  return lerTabela<EntradaCatalogo>(cliente, "instituicoes", { colunas: "id, nome", sinal });
}

/** Legado do ciclo 012, só de leitura: serve à dica "antes: X" dos ativos que ficaram sem classe. */
export function lerClassesLegadas(cliente: Cliente, sinal?: AbortSignal): Promise<EntradaCatalogo[]> {
  return lerTabela<EntradaCatalogo>(cliente, "classes_ativo", { colunas: "id, nome", sinal });
}

/** Taxonomia global de classes (ciclo 013): a árvore inteira, validada; árvore incoerente é erro de leitura. */
export async function lerTaxonomia(cliente: Cliente, sinal?: AbortSignal): Promise<Taxonomia> {
  return montarTaxonomia(await lerTabela<NoTaxonomia>(cliente, "taxonomia_ativos", { colunas: "id, parent_id, nivel, nome, ordem", sinal }));
}

export function lerVinculosDosAtivos(cliente: Cliente, sinal?: AbortSignal): Promise<VinculoDoAtivo[]> {
  return lerTabela<VinculoDoAtivo>(cliente, "ativos", { colunas: "instituicao_id", sinal });
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

/** Opções dos seletores de ativo: pelo nome exibido, em ordem alfabética (pt-BR), "Em trânsito" incluído. */
export function opcoesDeAtivo(ativos: Ativo[]): { id: string; nome: string }[] {
  return ordenarPorNome(ativos.map((a) => ({ id: a.id, nome: nomeDoAtivo(ativos, a.id) })));
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

async function lerCarteiraDoInicio(cliente: Cliente, sinal: AbortSignal): Promise<InsumosDoInicio> {
  return {
    ativos: await lerAtivos(cliente, sinal),
    eventos: await lerEventos(cliente, sinal),
    consolidados: (await lerTabela<{ mes: string; vi: number; vf: number }>(cliente, "consolidados_mensais", { colunas: "mes, vi, vf", sinal })).map(
      (c) => ({ ...c, mes: mesDaColuna(c.mes) }),
    ),
    posicoes: await lerTabela<PosicaoLida>(cliente, "posicoes_mensais", {
      colunas: "mes, ativo_id, saldo_inicial, saldo_final, ajuste, tipo_ajuste",
      sinal,
    }),
  };
}

/**
 * Marca das composições do Início (ciclo 015, issue #153): a marca da carteira mais a versão dos
 * metadados, lidas juntas antes e depois dos insumos. Nome, instituição e classe decidem agrupamentos,
 * ordem e percentuais; a versão dos metadados cobre todos, inclusive A → B → A, e dispensa a antiga
 * marca da classificação. Falha da RPC ou marca inválida é erro, nunca um contador zero.
 */
async function marcaDoInicio(cliente: ClienteComRpc, sinal: AbortSignal) {
  const [carteira, metadados] = await Promise.all([marcaCarteira(cliente, sinal), versaoMetadados(cliente, sinal)]);
  return { carteira, metadados };
}

/** Insumos do Início por ativo, lidos como uma composição coerente (D13). */
export async function lerInsumosDoInicio(cliente: ClienteComRpc): Promise<InsumosDoInicio> {
  const { insumos } = await lerComposicao(
    (sinal) => marcaDoInicio(cliente, sinal),
    (_marca, sinal) => lerCarteiraDoInicio(cliente, sinal),
  );
  return insumos;
}

/**
 * Insumos do Início com a visão por classe (ciclo 013, issue #139): os mesmos da carteira, mais a
 * árvore da taxonomia. Uma mudança de metadados durante a leitura descarta tudo e repete, até 3
 * tentativas, nunca misturando classe ou nome velhos com posições novas. O catálogo fica fora.
 */
export async function lerInsumosDoInicioPorClasse(cliente: ClienteComRpc): Promise<InsumosDoInicio & { nos: NoTaxonomia[] }> {
  const { insumos } = await lerComposicao(
    (sinal) => marcaDoInicio(cliente, sinal),
    async (_marca, sinal) => ({
      ...(await lerCarteiraDoInicio(cliente, sinal)),
      nos: await lerTabela<NoTaxonomia>(cliente, "taxonomia_ativos", { colunas: "id, parent_id, nivel, nome, ordem", sinal }),
    }),
  );
  return insumos;
}

/**
 * Insumos do Início com a visão por instituição, preparados para a unidade D: os mesmos da
 * carteira, mais o catálogo de instituições, lido na mesma composição que ativos e posições. Ativo
 * com vínculo e catálogo de instantes diferentes nunca é devolvido.
 */
export async function lerInsumosDoInicioPorInstituicao(cliente: ClienteComRpc): Promise<InsumosDoInicio & { instituicoes: EntradaCatalogo[] }> {
  const { insumos } = await lerComposicao(
    (sinal) => marcaDoInicio(cliente, sinal),
    async (_marca, sinal) => ({
      ...(await lerCarteiraDoInicio(cliente, sinal)),
      instituicoes: await lerInstituicoes(cliente, sinal),
    }),
  );
  return insumos;
}
