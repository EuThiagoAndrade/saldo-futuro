import type { DatabaseSync } from "node:sqlite";
import type { DadosOrigem, OrigemValorMonetario } from "./tipos";

type Linha = Record<string, unknown>;

const COLUNAS_OBRIGATORIAS: Record<string, string[]> = {
  ativos: ["id", "descricao", "classificacao", "ativo"],
  eventos: ["id", "ativo_id", "data_evento", "ano", "mes", "tipo_evento", "valor", "evento_referencia_id", "origem", "observacao"],
  posicoes_mensais: ["ativo_id", "ano", "mes", "saldo_inicio", "saldo_fim"],
  consolidado_mensal: ["ano", "mes", "valor_total", "status", "fechado"],
};

function citar(identificador: string): string {
  return `"${identificador.replaceAll('"', '""')}"`;
}

function linhas(db: DatabaseSync, sql: string): Linha[] {
  const statement = db.prepare(sql);
  statement.setReadBigInts(true);
  return statement.all() as unknown as Linha[];
}

function inteiro(valor: unknown, campo: string): number {
  const numero = typeof valor === "bigint" ? Number(valor) : valor;
  if (typeof numero !== "number" || !Number.isSafeInteger(numero)) {
    throw new Error(`${campo} precisa ser inteiro seguro`);
  }
  return numero;
}

function inteiroOpcional(valor: unknown, campo: string): number | null {
  return valor === null ? null : inteiro(valor, campo);
}

function texto(valor: unknown, campo: string): string {
  if (typeof valor !== "string") throw new Error(`${campo} precisa ser texto`);
  return valor;
}

function textoOpcional(valor: unknown, campo: string): string | null {
  return valor === null ? null : texto(valor, campo);
}

function booleano(valor: unknown, campo: string): boolean {
  if (valor === true || valor === 1 || valor === 1n) return true;
  if (valor === false || valor === 0 || valor === 0n) return false;
  throw new Error(`${campo} precisa ser booleano`);
}

function monetario(valor: unknown, campo: string): OrigemValorMonetario {
  if (
    typeof valor === "number" ||
    typeof valor === "bigint" ||
    typeof valor === "string" ||
    valor === null ||
    valor instanceof Uint8Array
  ) {
    return valor;
  }
  throw new Error(`${campo} tem tipo SQLite não suportado`);
}

function detectarIndicadoresDeUsuario(db: DatabaseSync, tabelas: Map<string, string>): number {
  let maximo = 0;
  const tabelasDeIdentidade = new Set(["user", "users", "usuario", "usuarios", "profile", "profiles", "perfil", "perfis", "account", "accounts", "conta", "contas"]);
  const colunasDeUsuario = new Set(["user_id", "usuario_id", "owner_user_id", "proprietario_user_id"]);

  for (const nomeReal of tabelas.values()) {
    const nome = nomeReal.toLowerCase();
    const qtd = db.prepare(`SELECT COUNT(*) AS quantidade FROM ${citar(nomeReal)}`).get() as { quantidade?: number | bigint };
    const total = inteiro(qtd.quantidade, `contagem de ${nomeReal}`);
    if (tabelasDeIdentidade.has(nome)) maximo = Math.max(maximo, total);

    const colunas = db.prepare(`PRAGMA table_info(${citar(nomeReal)})`).all() as Array<{ name?: string }>;
    for (const coluna of colunas) {
      const colunaReal = coluna.name;
      if (typeof colunaReal !== "string" || !colunasDeUsuario.has(colunaReal.toLowerCase())) continue;
      const distinct = db.prepare(
        `SELECT COUNT(DISTINCT ${citar(colunaReal)}) AS quantidade FROM ${citar(nomeReal)} WHERE ${citar(colunaReal)} IS NOT NULL`,
      ).get() as { quantidade?: number | bigint };
      maximo = Math.max(maximo, inteiro(distinct.quantidade, `indicador ${nomeReal}.${colunaReal}`));
    }
  }
  return maximo;
}

/** Lê somente as quatro tabelas do modelo fixado na KB-001, sem executar SQL de escrita. */
export function lerOrigem(db: DatabaseSync): DadosOrigem {
  const tabelasCatalogo = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all() as Array<{ name?: string }>;
  const tabelas = new Map<string, string>();
  for (const linha of tabelasCatalogo) {
    if (typeof linha.name === "string") tabelas.set(linha.name.toLowerCase(), linha.name);
  }

  for (const [nome, obrigatorias] of Object.entries(COLUNAS_OBRIGATORIAS)) {
    const nomeReal = tabelas.get(nome);
    if (!nomeReal) throw new Error(`tabela obrigatória ausente: ${nome}`);
    const colunas = db.prepare(`PRAGMA table_info(${citar(nomeReal)})`).all() as Array<{ name?: string }>;
    const disponiveis = new Set(colunas.map((coluna) => coluna.name?.toLowerCase()).filter((item): item is string => Boolean(item)));
    const ausentes = obrigatorias.filter((coluna) => !disponiveis.has(coluna));
    if (ausentes.length > 0) throw new Error(`colunas ausentes em ${nome}: ${ausentes.join(",")}`);
  }

  const ativos = linhas(db, `SELECT id, descricao, classificacao, ativo FROM ${citar(tabelas.get("ativos")!)}`).map((linha) => ({
    id: inteiro(linha.id, "ativos.id"),
    descricao: texto(linha.descricao, "ativos.descricao"),
    classificacao: textoOpcional(linha.classificacao, "ativos.classificacao"),
    ativo: booleano(linha.ativo, "ativos.ativo"),
  }));

  const eventos = linhas(
    db,
    `SELECT id, ativo_id, data_evento, ano, mes, tipo_evento, valor, evento_referencia_id, origem, observacao FROM ${citar(tabelas.get("eventos")!)}`,
  ).map((linha) => ({
    id: inteiro(linha.id, "eventos.id"),
    ativoId: inteiroOpcional(linha.ativo_id, "eventos.ativo_id"),
    data: texto(linha.data_evento, "eventos.data_evento"),
    ano: inteiro(linha.ano, "eventos.ano"),
    mes: inteiro(linha.mes, "eventos.mes"),
    tipo: texto(linha.tipo_evento, "eventos.tipo_evento"),
    valor: monetario(linha.valor, "eventos.valor"),
    referenciaId: inteiroOpcional(linha.evento_referencia_id, "eventos.evento_referencia_id"),
    origem: texto(linha.origem, "eventos.origem"),
    observacao: textoOpcional(linha.observacao, "eventos.observacao"),
  }));

  const posicoes = linhas(
    db,
    `SELECT ativo_id, ano, mes, saldo_inicio, saldo_fim FROM ${citar(tabelas.get("posicoes_mensais")!)}`,
  ).map((linha) => ({
    ativoId: inteiro(linha.ativo_id, "posicoes_mensais.ativo_id"),
    ano: inteiro(linha.ano, "posicoes_mensais.ano"),
    mes: inteiro(linha.mes, "posicoes_mensais.mes"),
    saldoInicio: monetario(linha.saldo_inicio, "posicoes_mensais.saldo_inicio"),
    saldoFim: monetario(linha.saldo_fim, "posicoes_mensais.saldo_fim"),
  }));

  const consolidados = linhas(
    db,
    `SELECT ano, mes, valor_total, status, fechado FROM ${citar(tabelas.get("consolidado_mensal")!)}`,
  ).map((linha) => ({
    ano: inteiro(linha.ano, "consolidado_mensal.ano"),
    mes: inteiro(linha.mes, "consolidado_mensal.mes"),
    valorTotal: monetario(linha.valor_total, "consolidado_mensal.valor_total"),
    status: texto(linha.status, "consolidado_mensal.status"),
    fechado: booleano(linha.fechado, "consolidado_mensal.fechado"),
  }));

  return { ativos, eventos, posicoes, consolidados, indicadoresUsuario: detectarIndicadoresDeUsuario(db, tabelas) };
}
