// Apoio dos testes de integração da migração (issue #64). Origens SQLite fictícias, criadas a
// partir do DDL da origem num diretório temporário, e clientes com falhas injetadas na rede.
// Nenhum dado real: nomes, datas e valores são inventados.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { sha256 } from "../../../src/lib/migracao/quantias";
import { simularBanco } from "../../../src/lib/migracao/simular";
import type { PlanoMigracao, RelatorioSimulacao } from "../../../src/lib/migracao/tipos";
import { sqlLocal } from "./banco";
import { SENHA, type UsuarioDeTeste } from "./supabase";

const DDL = readFileSync(join(process.cwd(), "tests/fixtures/migracao/origem.sql"), "utf8");

export interface EntradaOrigem {
  ativos: Array<{ id: number; descricao: string; classificacao: string; ativo: boolean }>;
  eventos: Array<{
    id: number;
    ativo_id: number | null;
    data: string;
    tipo: string;
    valor: number;
    referencia?: number;
    origem?: "manual" | "calculado";
    observacao?: string;
  }>;
  posicoes: Array<{ ativo_id: number; ano: number; mes: number; saldo_inicio: number; saldo_fim: number }>;
  consolidados: Array<{ ano: number; mes: number; valor_total: number }>;
}

/** Grava a origem fictícia em arquivo e devolve o caminho. */
export function criarOrigem(pasta: string, nome: string, entrada: EntradaOrigem): string {
  const arquivo = join(pasta, `${nome}.sqlite`);
  const db = new DatabaseSync(arquivo);
  try {
    db.exec(DDL);
    const ativo = db.prepare("INSERT INTO ativos (id, descricao, classificacao, ativo) VALUES (?, ?, ?, ?)");
    for (const a of entrada.ativos) ativo.run(a.id, a.descricao, a.classificacao, Number(a.ativo));
    const evento = db.prepare(
      "INSERT INTO eventos (id, ativo_id, data_evento, ano, mes, tipo_evento, valor, evento_referencia_id, origem, observacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    for (const e of entrada.eventos) {
      const [ano, mes] = e.data.split("-").map(Number);
      evento.run(e.id, e.ativo_id, e.data, ano, mes, e.tipo, e.valor, e.referencia ?? null, e.origem ?? "manual", e.observacao ?? null);
    }
    const posicao = db.prepare("INSERT INTO posicoes_mensais (ativo_id, ano, mes, saldo_inicio, saldo_fim) VALUES (?, ?, ?, ?, ?)");
    for (const p of entrada.posicoes) posicao.run(p.ativo_id, p.ano, p.mes, p.saldo_inicio, p.saldo_fim);
    const consolidado = db.prepare("INSERT INTO consolidado_mensual (ano, mes, valor_total, status, fechado) VALUES (?, ?, ?, 'fechado', 1)");
    for (const c of entrada.consolidados) consolidado.run(c.ano, c.mes, c.valor_total);
  } finally {
    db.close();
  }
  return arquivo;
}

/** Simula a origem para o usuário de destino; o teste exige a simulação aceita. */
export function simularOrigem(arquivo: string, usuarioDestino: string): { plano: PlanoMigracao; relatorio: RelatorioSimulacao } {
  const db = new DatabaseSync(arquivo, { readOnly: true });
  try {
    const resultado = simularBanco(db, { usuarioDestino, sha256Origem: sha256(readFileSync(arquivo)) });
    if (!resultado.ok) throw new Error(`simulação recusada: ${resultado.recusas.map((r) => r.codigo).join(", ")}`);
    return { plano: resultado.plano, relatorio: resultado.relatorio };
  } finally {
    db.close();
  }
}

/**
 * Carteira fictícia completa, janeiro a abril de 2025, com as seis funções de escrita:
 * - Alfa (pós-fixado): aportes, ajustes calculados da origem e um aporte estornado em fevereiro;
 * - Beta (renda variável): em março, a origem começa o mês com saldo diferente do fim de
 *   fevereiro (M7, causa i) e recebe do trânsito; a transferência é preservada e a migração é
 *   720,00 − 505,00 − 200,00 = 15,00;
 * - Gama (pós-fixado): resgate total em fevereiro pareado com o trânsito (M6), saldo zero e
 *   desativado na origem (M9).
 * Patrimônio da origem: jan 1.715,00; fev 1.725,10 (200,00 em trânsito); mar 1.750,10; abr 1.805,10.
 */
export function carteiraCompleta(): EntradaOrigem {
  return {
    ativos: [
      { id: 1, descricao: "Fundo Fictício Alfa", classificacao: "Pós-fixado", ativo: true },
      { id: 2, descricao: "Ação Fictícia Beta", classificacao: "Renda variável", ativo: true },
      { id: 3, descricao: "CDB Fictício Gama", classificacao: "Pós-fixado", ativo: false },
    ],
    eventos: [
      { id: 1, ativo_id: 1, data: "2025-01-05", tipo: "APORTE", valor: 1000 },
      { id: 2, ativo_id: 2, data: "2025-01-10", tipo: "APORTE", valor: 500 },
      { id: 3, ativo_id: 3, data: "2025-01-12", tipo: "APORTE", valor: 200 },
      { id: 4, ativo_id: 1, data: "2025-01-31", tipo: "RENDIMENTO", valor: 10, origem: "calculado" },
      { id: 5, ativo_id: 2, data: "2025-01-31", tipo: "CORRECAO_MARCACAO", valor: 5, origem: "calculado" },
      { id: 6, ativo_id: 1, data: "2025-02-03", tipo: "APORTE", valor: 100 },
      { id: 7, ativo_id: 1, data: "2025-02-04", tipo: "ESTORNO", valor: 100, referencia: 6 },
      { id: 8, ativo_id: 3, data: "2025-02-05", tipo: "RESGATE", valor: 200 },
      { id: 9, ativo_id: null, data: "2025-02-06", tipo: "TRANSFERENCIA_PENDENTE", valor: 200 },
      { id: 10, ativo_id: 1, data: "2025-02-28", tipo: "RENDIMENTO", valor: 10.1, origem: "calculado" },
      { id: 11, ativo_id: null, data: "2025-03-10", tipo: "TRANSFERENCIA_PENDENTE", valor: 200, observacao: "direcao=negativo" },
      { id: 12, ativo_id: 2, data: "2025-03-12", tipo: "APORTE", valor: 200 },
      { id: 13, ativo_id: 1, data: "2025-03-31", tipo: "RENDIMENTO", valor: 10, origem: "calculado" },
      { id: 14, ativo_id: 1, data: "2025-04-02", tipo: "APORTE", valor: 50 },
      { id: 15, ativo_id: 1, data: "2025-04-30", tipo: "RENDIMENTO", valor: 5, origem: "calculado" },
    ],
    posicoes: [
      { ativo_id: 1, ano: 2025, mes: 1, saldo_inicio: 0, saldo_fim: 1010 },
      { ativo_id: 2, ano: 2025, mes: 1, saldo_inicio: 0, saldo_fim: 505 },
      { ativo_id: 3, ano: 2025, mes: 1, saldo_inicio: 0, saldo_fim: 200 },
      { ativo_id: 1, ano: 2025, mes: 2, saldo_inicio: 1010, saldo_fim: 1020.1 },
      { ativo_id: 2, ano: 2025, mes: 2, saldo_inicio: 505, saldo_fim: 505 },
      { ativo_id: 3, ano: 2025, mes: 2, saldo_inicio: 200, saldo_fim: 0 },
      { ativo_id: 1, ano: 2025, mes: 3, saldo_inicio: 1020.1, saldo_fim: 1030.1 },
      { ativo_id: 2, ano: 2025, mes: 3, saldo_inicio: 500, saldo_fim: 720 },
      { ativo_id: 3, ano: 2025, mes: 3, saldo_inicio: 0, saldo_fim: 0 },
      { ativo_id: 1, ano: 2025, mes: 4, saldo_inicio: 1030.1, saldo_fim: 1085.1 },
      { ativo_id: 2, ano: 2025, mes: 4, saldo_inicio: 720, saldo_fim: 720 },
      { ativo_id: 3, ano: 2025, mes: 4, saldo_inicio: 0, saldo_fim: 0 },
    ],
    consolidados: [
      { ano: 2025, mes: 1, valor_total: 1715 },
      { ano: 2025, mes: 2, valor_total: 1725.1 },
      { ano: 2025, mes: 3, valor_total: 1750.1 },
      { ano: 2025, mes: 4, valor_total: 1805.1 },
    ],
  };
}

/** Um ativo fictício com aportes de 1,00 por dia útil fictício: mais de 1.000 eventos em 2024. */
export function carteiraGrande(eventosPorMes = 100, meses = 11): EntradaOrigem {
  const entrada: EntradaOrigem = {
    ativos: [{ id: 1, descricao: "Fundo Fictício Volume", classificacao: "Pós-fixado", ativo: true }],
    eventos: [],
    posicoes: [],
    consolidados: [],
  };
  let id = 1;
  let saldo = 0;
  for (let mes = 1; mes <= meses; mes++) {
    for (let i = 0; i < eventosPorMes; i++) {
      const dia = String((i % 28) + 1).padStart(2, "0");
      entrada.eventos.push({ id: id++, ativo_id: 1, data: `2024-${String(mes).padStart(2, "0")}-${dia}`, tipo: "APORTE", valor: 1 });
    }
    entrada.posicoes.push({ ativo_id: 1, ano: 2024, mes, saldo_inicio: saldo, saldo_fim: saldo + eventosPorMes });
    saldo += eventosPorMes;
    entrada.consolidados.push({ ano: 2024, mes, valor_total: saldo });
  }
  return entrada;
}

export type ModoFalha = "antes" | "depois";

/** Falha injetada na próxima chamada da função: "antes" não envia; "depois" perde a resposta. */
export interface Falhas {
  rpc?: string;
  modo?: ModoFalha;
  /** Executado antes de enviar a n-ésima chamada de função (contagem de todas as funções). */
  antesDaChamada?: { n: number; fn: () => Promise<void> };
  /** Falha a página de uma tabela que começa no deslocamento dado. */
  pagina?: { tabela: string; de: number };
}

/** Cliente com a sessão do usuário e um fetch que injeta as falhas pedidas. */
export async function clienteComFalhas(usuario: UsuarioDeTeste, falhas: Falhas): Promise<SupabaseClient> {
  let chamadas = 0;
  const fetchComFalhas: typeof fetch = async (entrada, init) => {
    const url = String(entrada instanceof Request ? entrada.url : entrada);
    const rpc = /\/rest\/v1\/rpc\/([a-z_]+)/.exec(url)?.[1];
    if (rpc) {
      chamadas++;
      if (falhas.antesDaChamada?.n === chamadas) await falhas.antesDaChamada.fn();
      if (falhas.rpc === rpc && falhas.modo) {
        const modo = falhas.modo;
        falhas.rpc = undefined;
        if (modo === "antes") throw new TypeError("fetch failed");
        await fetch(entrada, init);
        throw new TypeError("fetch failed");
      }
    }
    if (falhas.pagina && url.includes(`/rest/v1/${falhas.pagina.tabela}?`)) {
      if (new URL(url).searchParams.get("offset") === String(falhas.pagina.de)) throw new TypeError("fetch failed");
    }
    return fetch(entrada, init);
  };
  const cliente = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: fetchComFalhas },
  });
  const { error } = await cliente.auth.signInWithPassword({ email: usuario.email, password: SENHA });
  if (error) throw error;
  return cliente;
}

/**
 * Segura a trava da carteira do usuário (a mesma de private.travar_carteira) numa transação
 * aberta, como superusuário do banco local. Toda escrita do usuário espera até liberar().
 */
export async function segurarTravaDaCarteira(usuario: string): Promise<{ liberar: () => Promise<void> }> {
  if (!/^[0-9a-f-]{36}$/.test(usuario)) throw new Error("usuário inválido");
  sqlLocal("select 1;");
  const psql: ChildProcessWithoutNullStreams = spawn(
    "docker",
    ["exec", "-i", "supabase_db_saldo-futuro", "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-tAq"],
    { stdio: "pipe" },
  );
  const terminou = new Promise<void>((resolve) => psql.on("close", () => resolve()));
  const chave = `hashtextextended('saldo-futuro:carteira:${usuario}', 0)`;
  psql.stdin.write(`begin; select pg_advisory_xact_lock(${chave});\n`);
  const condicao = `select count(*) from pg_locks where locktype = 'advisory' and granted and objid = (${chave} & x'ffffffff'::bigint)::oid;`;
  for (let i = 0; i < 100 && sqlLocal(condicao) === "0"; i++) await new Promise((r) => setTimeout(r, 100));
  if (sqlLocal(condicao) === "0") throw new Error("trava da carteira não obtida");
  return {
    async liberar() {
      psql.stdin.end("commit;\n");
      await terminou;
    },
  };
}
