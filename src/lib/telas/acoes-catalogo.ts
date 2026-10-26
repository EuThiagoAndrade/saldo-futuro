import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirSessao } from "../sessao";
import type { EstadoAcao } from "./acao";
import { mensagemDeRecusa } from "./carteira";
import { CATALOGOS, type TipoCatalogo } from "./catalogos";

// Escrita do catálogo de instituições (ciclo 012, issue #127): só pelas funções do banco, com a sessão do
// usuário (D3). A sessão é conferida antes de qualquer leitura da entrada (D2). As ações de
// app/(app)/cadastros só escolhem o catálogo.

const FUNCOES = {
  instituicoes: { criar: "criar_instituicao", renomear: "renomear_instituicao", excluir: "excluir_instituicao", parametro: "p_instituicao" },
} as const satisfies Record<TipoCatalogo, Record<string, string>>;

const nome = z.string().trim().min(1, "Informe o nome.").max(100, "Use até 100 caracteres.");

function inexistente(): string {
  return mensagemDeRecusa("recusado_instituicao_inexistente");
}

export async function criarEntrada(tipo: TipoCatalogo, dados: FormData): Promise<EstadoAcao> {
  const { supabase } = await exigirSessao();
  const entrada = nome.safeParse(dados.get("nome"));
  if (!entrada.success) return { erro: entrada.error.issues[0].message };
  const { error } = await supabase.rpc(FUNCOES[tipo].criar, { p_nome: entrada.data });
  if (error) return { erro: mensagemDeRecusa(error) };
  revalidatePath("/", "layout");
  return { ok: CATALOGOS[tipo].incluida };
}

export async function renomearEntrada(tipo: TipoCatalogo, dados: FormData): Promise<EstadoAcao> {
  const { supabase } = await exigirSessao();
  const id = z.uuid().safeParse(dados.get("id"));
  if (!id.success) return { erro: inexistente() };
  const entrada = nome.safeParse(dados.get("nome"));
  if (!entrada.success) return { erro: entrada.error.issues[0].message };
  const { error } = await supabase.rpc(FUNCOES[tipo].renomear, { [FUNCOES[tipo].parametro]: id.data, p_nome: entrada.data });
  if (error) return { erro: mensagemDeRecusa(error) };
  revalidatePath("/", "layout");
  return { ok: "Nome alterado." };
}

export async function excluirEntrada(tipo: TipoCatalogo, dados: FormData): Promise<EstadoAcao> {
  const { supabase } = await exigirSessao();
  const id = z.uuid().safeParse(dados.get("id"));
  if (!id.success) return { erro: inexistente() };
  const { error } = await supabase.rpc(FUNCOES[tipo].excluir, { [FUNCOES[tipo].parametro]: id.data });
  if (error) return { erro: mensagemDeRecusa(error) };
  revalidatePath("/", "layout");
  return { ok: "Excluída." };
}
