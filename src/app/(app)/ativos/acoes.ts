"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { EstadoAcao } from "@/lib/telas/acao";
import { mensagemDeRecusa } from "@/lib/telas/carteira";
import { lerDetalhes, lerNome } from "@/lib/telas/detalhes-ativo";
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
  // Campos descritivos (ciclo 012, issue #128): a instituição nova é criada na mesma transação do
  // ativo (P-4). A classe é um nó da taxonomia global, só por ID (ciclo 013, issue #138): a função
  // recusa um ID inexistente, e um texto sem seleção nem chega aqui. Os atributos complementares
  // (ciclo 017, issue #173) vão na mesma chamada, todos explícitos: vazio é não informado.
  const detalhes = lerDetalhes(dados);
  if ("erro" in detalhes) return { erro: detalhes.erro };
  const { error } = await supabase.rpc("cadastrar_ativo_com_atributos", {
    p_nome: entrada.data.nome,
    p_tipo_ajuste: entrada.data.tipoAjuste,
    ...detalhes.parametros,
  });
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

// Edição do nome e dos campos descritivos (ciclo 012, issue #128; nome desde o ciclo 015, issue
// #153; atributos complementares desde o ciclo 017, issue #173), também de ativo desativado, numa
// única chamada transacional: uma recusa não grava parte dos dados. O sucesso volta à aba de onde o
// ativo veio.
export async function editarAtivo(_estado: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  const { supabase } = await exigirSessao();
  const id = z.uuid().safeParse(dados.get("ativo"));
  if (!id.success) return { erro: mensagemDeRecusa("recusado_ativo_inexistente") };
  const nome = lerNome(dados);
  if ("erro" in nome) return { erro: nome.erro };
  const detalhes = lerDetalhes(dados);
  if ("erro" in detalhes) return { erro: detalhes.erro };
  const { error } = await supabase.rpc("editar_ativo_com_atributos", { p_ativo: id.data, p_nome: nome.nome, ...detalhes.parametros });
  if (error) return { erro: mensagemDeRecusa(error) };
  revalidatePath("/", "layout");
  redirect(dados.get("aba") === "desativados" ? "/ativos?aba=desativados" : "/ativos");
}
