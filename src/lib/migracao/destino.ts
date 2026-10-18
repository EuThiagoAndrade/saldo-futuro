// Estado do destino e comparação por efeitos completos (plano do ciclo 006, "Mecanismo de
// execução"). Toda leitura usa o contrato de src/lib/leitura.ts: páginas de max_rows, contagem
// exata e a marca da carteira antes e depois. Aqui a mudança durante a leitura não é repetida:
// durante a carga só o migrador escreve, então qualquer mudança para a operação.
//
// A comparação traduz o destino e o prefixo do plano para a mesma forma abstrata, sem UUIDs:
// ativos pelo id do plano, eventos como multiconjunto de (ativo, data, tipo, valor, evento
// estornado), transferências como unidade (data, origem, destino, valor) e meses fechados com as
// posições. Eventos idênticos no mesmo dia são intercambiáveis, então o multiconjunto basta.

import { type Cliente, lerComposicao, lerTabela, marcaCarteira, type MarcaCarteira, type OpcoesLeitura } from "../leitura";
import type { LinhaEvento } from "../telas/carteira";
import type { OperacaoMigracao, PlanoMigracao } from "./tipos";

export const TRANSITO = "sistema:em-transito";

export interface LinhaAtivo {
  id: string;
  nome: string;
  tipo_ajuste: string | null;
  sistema: string | null;
  ativo: boolean;
}

export type LinhaEventoDestino = LinhaEvento;

export interface LinhaConsolidado {
  mes: string;
  vi: number;
  vf: number;
  aportes: number;
  resgates: number;
  rendimento: number;
  marcacao: number;
  cambio: number;
  migracao: number;
}

export interface LinhaPosicao {
  mes: string;
  ativo_id: string;
  saldo_inicial: number;
  saldo_final: number;
  ajuste: number;
}

export interface EstadoDestino {
  marca: MarcaCarteira;
  ativos: LinhaAtivo[];
  eventos: LinhaEventoDestino[];
  transferencias: { id: string; data: string }[];
  consolidados: LinhaConsolidado[];
  posicoes: LinhaPosicao[];
}

/** Lê a carteira inteira da sessão numa só versão, ou lança ErroLeitura (página, contagem ou mudança). */
export async function lerEstadoDestino(cliente: Cliente, opcoes: OpcoesLeitura = {}): Promise<EstadoDestino> {
  const { marca, insumos } = await lerComposicao(
    (sinal) => marcaCarteira(cliente, sinal),
    async (_marca, sinal) => ({
      ativos: await lerTabela<LinhaAtivo>(cliente, "ativos", { colunas: "id, nome, tipo_ajuste, sistema, ativo", sinal, ...opcoes }),
      eventos: await lerTabela<LinhaEventoDestino>(cliente, "eventos", {
        colunas: "id, ativo_id, data, tipo, valor, estorno_de, transferencia_id",
        sinal,
        ...opcoes,
      }),
      transferencias: await lerTabela<{ id: string; data: string }>(cliente, "transferencias", { colunas: "id, data", sinal, ...opcoes }),
      consolidados: await lerTabela<LinhaConsolidado>(cliente, "consolidados_mensais", {
        colunas: "mes, vi, vf, aportes, resgates, rendimento, marcacao, cambio, migracao",
        sinal,
        ...opcoes,
      }),
      posicoes: await lerTabela<LinhaPosicao>(cliente, "posicoes_mensais", {
        colunas: "mes, ativo_id, saldo_inicial, saldo_final, ajuste",
        sinal,
        ...opcoes,
      }),
    }),
    1,
  );
  return { marca, ...insumos };
}

/** Forma comparável de uma carteira: listas ordenadas, sem UUIDs. */
export interface EstadoAbstrato {
  /** O trânsito nasce com o primeiro ativo; antes dele, pode existir ou não. */
  transito: boolean | "indiferente";
  ativos: string[];
  eventos: string[];
  transferencias: string[];
  meses: string[];
  posicoes: string[];
}

function ordenar(lista: string[]): string[] {
  return lista.sort();
}

/** "2025-01" ou "2025-01-01" → "2025-01". */
export function mesCurto(mes: string): string {
  return mes.slice(0, 7);
}

function descritor(ativo: string, data: string, tipo: string, valor: bigint | string): string {
  return `${ativo}|${data}|${tipo}|${valor}`;
}

/** Estado esperado depois das k primeiras operações do plano. */
export function estadoEsperado(plano: PlanoMigracao, k: number): EstadoAbstrato {
  const ativos = new Map<string, { nome: string; tipo: string; ativo: boolean }>();
  const eventos: string[] = [];
  const transferencias: string[] = [];
  const meses: string[] = [];
  const posicoes: string[] = [];
  const porChave = new Map(plano.operacoes.map((operacao) => [operacao.chave, operacao]));

  for (const operacao of plano.operacoes.slice(0, k)) {
    const p = operacao.payload as Record<string, unknown>;
    switch (operacao.tipo) {
      case "criar_ativo":
        ativos.set(operacao.chave, { nome: String(p.nome).trim(), tipo: String(p.tipoAjuste), ativo: true });
        break;
      case "lancar_evento":
      case "lancar_migracao_transito":
        eventos.push(`${descritor(String(p.ativo), String(p.data), String(p.tipo), String(p.valorCentavos))}|`);
        break;
      case "estornar_evento": {
        const referencia = referenciaDoEstorno(operacao, porChave);
        const r = referencia.payload as Record<string, unknown>;
        const valor = -BigInt(String(r.valorCentavos));
        const original = descritor(String(r.ativo), String(r.data), String(r.tipo), String(r.valorCentavos));
        eventos.push(`${descritor(String(r.ativo), String(operacao.data), "estorno", valor)}|${original}`);
        break;
      }
      case "transferir":
        transferencias.push(`${p.data}|${p.origem}|${p.destino}|${p.valorCentavos}`);
        break;
      case "fechar_mes": {
        const mes = mesCurto(String(p.mes));
        meses.push(mes);
        for (const [ativo, saldo] of Object.entries(p.saldosReais as Record<string, string>)) posicoes.push(`${mes}|${ativo}|${saldo}`);
        break;
      }
      case "desativar_ativo": {
        const ativo = ativos.get(String(p.ativo));
        if (!ativo) throw new Error(`plano inválido: desativação de ativo não criado (${operacao.sequencia})`);
        ativo.ativo = false;
        break;
      }
    }
  }

  return {
    transito: ativos.size > 0 ? true : "indiferente",
    ativos: ordenar([...ativos].map(([id, a]) => `${id}|${a.nome}|${a.tipo}|${a.ativo ? 1 : 0}`)),
    eventos: ordenar(eventos),
    transferencias: ordenar(transferencias),
    meses: ordenar(meses),
    posicoes: ordenar(posicoes),
  };
}

/** A operação lancar_evento que o estorno referencia ("origem:<id>" → chave "evento:<id>"). */
export function referenciaDoEstorno(operacao: OperacaoMigracao, porChave: Map<string, OperacaoMigracao>): OperacaoMigracao {
  const referencia = String((operacao.payload as Record<string, unknown>).eventoReferenciado ?? "");
  const alvo = porChave.get(`evento:${referencia.replace(/^origem:/, "")}`);
  if (!alvo || alvo.tipo !== "lancar_evento" || alvo.sequencia >= operacao.sequencia) {
    throw new Error(`plano inválido: estorno sem evento anterior (${operacao.sequencia})`);
  }
  return alvo;
}

/**
 * Estado do destino na forma abstrata, traduzindo cada UUID de ativo pelo mapa (UUID → id do
 * plano). Ativo fora do mapa vira "?<uuid>", que nunca coincide com o esperado.
 */
export function estadoAbstrato(estado: EstadoDestino, mapaAtivos: ReadonlyMap<string, string>): EstadoAbstrato {
  const transito = estado.ativos.find((a) => a.sistema === "transito");
  const nomeAtivo = (uuid: string) => (transito && uuid === transito.id ? TRANSITO : (mapaAtivos.get(uuid) ?? `?${uuid}`));
  const ativos = estado.ativos
    .filter((a) => a.sistema === null)
    .map((a) => `${nomeAtivo(a.id)}|${a.nome}|${a.tipo_ajuste}|${a.ativo ? 1 : 0}`);
  if (estado.ativos.some((a) => a.sistema !== null && a.sistema !== "transito")) ativos.push("?sistema-desconhecido");

  const porId = new Map(estado.eventos.map((e) => [e.id, e]));
  const eventos: string[] = [];
  const pernas = new Map<string, LinhaEventoDestino[]>();
  for (const e of estado.eventos) {
    if (e.transferencia_id) {
      pernas.set(e.transferencia_id, [...(pernas.get(e.transferencia_id) ?? []), e]);
      continue;
    }
    const ref = e.estorno_de ? porId.get(e.estorno_de) : undefined;
    const original = e.estorno_de ? (ref ? descritor(nomeAtivo(ref.ativo_id), ref.data, ref.tipo, String(ref.valor)) : `?${e.estorno_de}`) : "";
    eventos.push(`${descritor(nomeAtivo(e.ativo_id), e.data, e.tipo, String(e.valor))}|${original}`);
  }

  const transferencias: string[] = [];
  const cabecalhos = new Set(estado.transferencias.map((t) => t.id));
  for (const t of estado.transferencias) {
    const lista = pernas.get(t.id) ?? [];
    const saida = lista.find((e) => e.valor < 0);
    const entrada = lista.find((e) => e.valor > 0);
    const valida =
      lista.length === 2 &&
      saida &&
      entrada &&
      lista.every((e) => e.tipo === "transferencia" && e.data === t.data) &&
      saida.valor === -entrada.valor;
    transferencias.push(valida ? `${t.data}|${nomeAtivo(saida.ativo_id)}|${nomeAtivo(entrada.ativo_id)}|${entrada.valor}` : `?transferencia-invalida|${t.id}`);
  }
  for (const id of pernas.keys()) if (!cabecalhos.has(id)) transferencias.push(`?perna-sem-cabecalho|${id}`);

  return {
    transito: Boolean(transito),
    ativos: ordenar(ativos),
    eventos: ordenar(eventos),
    transferencias: ordenar(transferencias),
    meses: ordenar(estado.consolidados.map((c) => mesCurto(c.mes))),
    posicoes: ordenar(estado.posicoes.map((p) => `${mesCurto(p.mes)}|${nomeAtivo(p.ativo_id)}|${p.saldo_final}`)),
  };
}

export type ParteDoEstado = "transito" | "ativos" | "eventos" | "transferencias" | "meses" | "posicoes";

/** Quantas entradas diferem em cada parte (diferença simétrica de multiconjuntos); vazio = igual. */
export function diferencas(destino: EstadoAbstrato, esperado: EstadoAbstrato): Partial<Record<ParteDoEstado, number>> {
  const resultado: Partial<Record<ParteDoEstado, number>> = {};
  if (esperado.transito !== "indiferente" && destino.transito !== esperado.transito) resultado.transito = 1;
  for (const parte of ["ativos", "eventos", "transferencias", "meses", "posicoes"] as const) {
    const n = diferencaSimetrica(destino[parte], esperado[parte]);
    if (n > 0) resultado[parte] = n;
  }
  return resultado;
}

function diferencaSimetrica(a: readonly string[], b: readonly string[]): number {
  const contagem = new Map<string, number>();
  for (const x of a) contagem.set(x, (contagem.get(x) ?? 0) + 1);
  for (const x of b) contagem.set(x, (contagem.get(x) ?? 0) - 1);
  let total = 0;
  for (const n of contagem.values()) total += Math.abs(n);
  return total;
}

export function iguais(destino: EstadoAbstrato, esperado: EstadoAbstrato): boolean {
  return Object.keys(diferencas(destino, esperado)).length === 0;
}

/** Contagens que a marca da carteira deve mostrar depois das k primeiras operações. */
export function contagensEsperadas(esperado: EstadoAbstrato): Pick<MarcaCarteira, "eventos" | "transferencias" | "ativos"> & { meses: string[] } {
  return {
    ativos: esperado.ativos.length + (esperado.transito === true ? 1 : 0),
    eventos: esperado.eventos.length + 2 * esperado.transferencias.length,
    transferencias: esperado.transferencias.length,
    meses: esperado.meses,
  };
}
