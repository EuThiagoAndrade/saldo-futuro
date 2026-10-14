import "server-only";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Proteção por ponto de entrada (D2 do ciclo 004). Cada leitura protegida, Server Action e rota
// chama exigirSessao() ou exigirAdmin(); o layout só desenha a navegação. A RLS e as funções do
// banco continuam sendo a barreira final.

export type Papel = "admin" | "user";

export interface Sessao {
  userId: string;
  email: string;
  papel: Papel;
  supabase: Awaited<ReturnType<typeof createClient>>;
}

/** Falha ao ler a sessão ou o perfil: vira o estado de erro, nunca sucesso nem dados parciais. */
export class ErroSessao extends Error {
  constructor(motivo: string) {
    super(`sessao: ${motivo}`);
    this.name = "ErroSessao";
  }
}

/** A sessão do pedido corrente, lida uma vez por pedido; null sem usuário autenticado. */
export const obterSessao = cache(async (): Promise<Sessao | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  // A RLS devolve só o perfil do próprio usuário.
  const { data: perfil, error: erroPerfil } = await supabase.from("profiles").select("email, role").maybeSingle();
  if (erroPerfil || !perfil) throw new ErroSessao("perfil");
  if (perfil.role !== "admin" && perfil.role !== "user") throw new ErroSessao("papel");
  return { userId: data.user.id, email: perfil.email, papel: perfil.role, supabase };
});

/** Sem sessão, redireciona para /entrar (páginas) ou interrompe a ação sem executar nada. */
export async function exigirSessao(): Promise<Sessao> {
  const sessao = await obterSessao();
  if (!sessao) redirect("/entrar");
  return sessao;
}

/** Sem papel admin, responde 404: a área de administração não se revela a quem não a usa. */
export async function exigirAdmin(): Promise<Sessao> {
  const sessao = await exigirSessao();
  if (sessao.papel !== "admin") notFound();
  return sessao;
}
