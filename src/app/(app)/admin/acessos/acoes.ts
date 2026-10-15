"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirAdmin } from "@/lib/sessao";
import type { EstadoAcao } from "@/lib/telas/acao";

const emailNormalizado = z.string({ error: "Informe um e-mail válido." }).trim().toLowerCase().pipe(z.email({ error: "Informe um e-mail válido." }));
const autorizacao = z.object({
  email: emailNormalizado,
  papel: z.enum(["user", "admin"], { error: "Escolha um papel inicial válido." }),
});

export type EstadoAcesso = EstadoAcao & { campo?: "email" | "papel" };

export async function autorizarEmail(_estado: EstadoAcesso, dados: FormData): Promise<EstadoAcesso> {
  const { supabase } = await exigirAdmin();
  const entrada = autorizacao.safeParse({ email: dados.get("email"), papel: dados.get("papel") });
  if (!entrada.success) {
    const problema = entrada.error.issues[0];
    return { erro: problema.message, campo: problema.path[0] === "papel" ? "papel" : "email" };
  }

  const { error } = await supabase.from("authorized_emails").insert({ email: entrada.data.email, role: entrada.data.papel });
  if (error) {
    if (error.code === "23505") return { erro: "Este e-mail já está autorizado. O papel inicial foi mantido.", campo: "email" };
    return { erro: "Não foi possível autorizar o e-mail. Tente novamente." };
  }
  revalidatePath("/admin/acessos");
  return { ok: "E-mail autorizado." };
}

export async function removerEmail(_estado: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  const { supabase } = await exigirAdmin();
  const email = emailNormalizado.safeParse(dados.get("email"));
  if (!email.success) return { erro: "Informe um e-mail válido." };

  // Remove só a autorização de cadastro; profiles e auth.users permanecem intactos (KB-002 P4).
  const { data, error } = await supabase.from("authorized_emails").delete().eq("email", email.data).select("email");
  if (error) return { erro: "Não foi possível remover o e-mail da lista. Tente novamente." };
  if (!data?.length) return { erro: "Este e-mail já não está na lista. Atualize a página." };
  revalidatePath("/admin/acessos");
  return { ok: "E-mail removido da lista. Uma conta existente continua com acesso." };
}
