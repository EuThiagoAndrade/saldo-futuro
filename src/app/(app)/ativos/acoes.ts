"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { EstadoAcao } from "@/lib/telas/acao";
import { mensagemDeRecusa } from "@/lib/telas/carteira";
import { exigirSessao } from "@/lib/sessao";

// Escrita só pelas funções do banco, com a sessão do usuário (D3). A sessão é conferida antes
// de qualquer leitura da entrada (D2).

const novoAtivo = z.object({
  nome: z.string().trim().min(1, "Informe o nome do ativo.").max(100, "Use até 100 caracteres."),
  tipoAjuste: z.enum(["rendimento", "marcacao"], { error: "Escolha o tipo de ajuste do ativo." }),
});

export async function criarAtivo(_estado: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  const { supabase } = await exigirSessao();
  const entrada = novoAtivo.safeParse({ nome: dados.get("nome"), tipoAjuste: dados.get("tipoAjuste") });
  if (!entrada.success) return { erro: entrada.error.issues[0].message };
  const { error } = await supabase.rpc("criar_ativo", { p_nome: entrada.data.nome, p_tipo_ajuste: entrada.data.tipoAjuste });
  if (error) return { erro: mensagemDeRecusa(error) };
  revalidatePath("/", "layout");
  // Cadastro em /ativos/novo (BL-006, ciclo 010): o sucesso volta à lista, sem mensagem extra.
  // A recusa já voltou acima; o redirect fica fora de qualquer captura de erro.
  redirect("/ativos");
}

export async function desativarAtivo(_estado: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  const { supabase } = await exigirSessao();
  const id = z.uuid().safeParse(dados.get("ativo"));
  if (!id.success) return { erro: mensagemDeRecusa("recusado_ativo_inexistente") };
  const { error } = await supabase.rpc("desativar_ativo", { p_ativo: id.data });
  if (error) return { erro: mensagemDeRecusa(error) };
  revalidatePath("/", "layout");
  return { ok: "Ativo desativado." };
}
