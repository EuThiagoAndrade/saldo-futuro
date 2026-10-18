// Modos gravar e conferir do ponto de entrada da migração (issue #64). Carregado só por esses
// modos, para que simular nunca importe o cliente do Supabase.

import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createClient } from "@supabase/supabase-js";
import { conferir, gravarNoDiretorio } from "../src/lib/migracao/gravar.ts";
import { simularBanco } from "../src/lib/migracao/simular.ts";

/** Arquivo comum dentro de local/, sem seguir para fora por link. */
async function arquivoLocal({ obterLocal, foraDoDiretorio, raiz }, valor, descricao) {
  const local = await obterLocal();
  const resolvido = await realpath(path.resolve(raiz, valor));
  if (foraDoDiretorio(local, resolvido) || !(await stat(resolvido)).isFile()) {
    throw new Error(`${descricao} precisa ser um arquivo dentro de local/.`);
  }
  return resolvido;
}

/** A chave publicável do projeto, nunca uma chave secreta ou um JWT de outro papel. */
function chavePublicavel(chave) {
  if (!chave || chave.startsWith("sb_secret_")) throw new Error("Use a chave publicável do projeto.");
  const partes = chave.split(".");
  if (partes.length === 3) {
    const papel = JSON.parse(Buffer.from(partes[1], "base64url").toString("utf8")).role;
    if (papel !== "anon") throw new Error("Use a chave publicável do projeto.");
  }
  return chave;
}

/**
 * Cliente com a sessão do responsável. O material da sessão vem de local/ ou do ambiente, nunca
 * do Git, e não é impresso nem copiado.
 */
async function clienteDaSessao(apoio) {
  const { argumento } = apoio;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL.");
  const chave = chavePublicavel(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  let sessao;
  const arquivo = argumento("--sessao", "");
  if (arquivo) {
    sessao = JSON.parse(await readFile(await arquivoLocal(apoio, arquivo, "A sessão"), "utf8"));
  } else {
    sessao = { access_token: process.env.SALDO_FUTURO_ACCESS_TOKEN, refresh_token: process.env.SALDO_FUTURO_REFRESH_TOKEN };
  }
  if (!sessao?.access_token || !sessao?.refresh_token) throw new Error("Sessão do responsável ausente.");
  const cliente = createClient(url, chave, { auth: { autoRefreshToken: true, persistSession: false } });
  const { error } = await cliente.auth.setSession({ access_token: sessao.access_token, refresh_token: sessao.refresh_token });
  if (error) throw new Error("Sessão do responsável recusada.");
  const { data, error: erroUsuario } = await cliente.auth.getUser();
  if (erroUsuario || !data.user) throw new Error("Sessão do responsável recusada.");
  return { cliente, usuario: data.user.id };
}

export async function executarGravacao(apoio) {
  const { argumento, caminhoLocal, diretorioLocal, calcularHashOrigem } = apoio;
  const caminhoBanco = await caminhoLocal(argumento("--db", "local/meus-investimentos.sqlite"));
  const plano = JSON.parse(await readFile(await arquivoLocal(apoio, argumento("--plano", ""), "O plano"), "utf8"));
  if (plano.sha256Origem !== (await calcularHashOrigem(caminhoBanco))) throw new Error("O plano não corresponde à origem.");
  const diretorio = await diretorioLocal(argumento("--out-dir", "local/migracao-issue-64"));
  const tempoLimiteMs = Number(argumento("--tempo-limite-ms", "60000"));
  const { cliente, usuario } = await clienteDaSessao(apoio);
  try {
    const resultado = await gravarNoDiretorio(diretorio, cliente, plano, usuario, { tempoLimiteMs });
    process.stdout.write(`${JSON.stringify(resultado)}\n`);
    if (resultado.result !== "executed" && resultado.result !== "already_executed_and_reconciled") process.exitCode = 2;
  } finally {
    cliente.auth.stopAutoRefresh();
  }
}

/** Simula de novo, só lendo o SQLite, e compara o destino com o relatório e o plano. */
export async function executarConferencia(apoio) {
  const { argumento, caminhoLocal, calcularHashOrigem } = apoio;
  const caminhoBanco = await caminhoLocal(argumento("--db", "local/meus-investimentos.sqlite"));
  const { cliente, usuario } = await clienteDaSessao(apoio);
  try {
    const hashAntes = await calcularHashOrigem(caminhoBanco);
    const banco = new DatabaseSync(caminhoBanco, { readOnly: true });
    let resultado;
    try {
      resultado = simularBanco(banco, { usuarioDestino: usuario, sha256Origem: hashAntes });
    } finally {
      banco.close();
    }
    if ((await calcularHashOrigem(caminhoBanco)) !== hashAntes) throw new Error("A origem mudou durante a leitura.");
    if (!resultado.ok) throw new Error("A simulação da origem foi recusada; nada a conferir.");
    const conferencia = await conferir(cliente, resultado.plano, resultado.relatorio);
    process.stdout.write(`${JSON.stringify({ ...conferencia, sha256Plano: resultado.plano.sha256Plano })}\n`);
    if (!conferencia.ok) process.exitCode = 2;
  } finally {
    cliente.auth.stopAutoRefresh();
  }
}

