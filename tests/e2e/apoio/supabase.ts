// Apoio dos testes ponta a ponta (D9 do ciclo 004). Roda só contra o Supabase local: a chave
// secreta local vem de `npx supabase status -o env`, como em auth.spec.ts, e nunca vai para
// .env.example, .env.local ou a Vercel.
//
// Cada arquivo de teste cria usuários fictícios exclusivos (<arquivo>.<papel>@example.com),
// autorizados na lista, e os remove com a autorização no fim. Assim nenhum arquivo interfere
// em outro, nem nos usuários de auth.spec.ts.

import { expect, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

export const configurado = Boolean(url && publishableKey && secretKey);
export const SENHA = "senha-de-teste-e2e-1";

const semSessao = { auth: { autoRefreshToken: false, persistSession: false } };

/** Cliente com a chave secreta local: só para preparar e limpar. */
export function clienteAdministrativo(): SupabaseClient {
  return createClient(url!, secretKey!, semSessao);
}

export type Papel = "user" | "admin";

export interface UsuarioDeTeste {
  email: string;
  papel: Papel;
  id: string;
}

async function removerUsuario(email: string) {
  const admin = clienteAdministrativo();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  expect(error).toBeNull();
  const usuario = data.users.find((u) => u.email === email);
  if (usuario) expect((await admin.auth.admin.deleteUser(usuario.id)).error).toBeNull();
}

/** Cria os usuários do arquivo, já autorizados, depois de remover restos de execuções anteriores. */
export async function criarUsuarios(arquivo: string, papeis: Record<string, Papel>): Promise<Record<string, UsuarioDeTeste>> {
  const admin = clienteAdministrativo();
  const usuarios: Record<string, UsuarioDeTeste> = {};
  for (const [nome, papel] of Object.entries(papeis)) {
    const email = `${arquivo}.${nome}@example.com`;
    await removerUsuario(email);
    await admin.from("authorized_emails").delete().eq("email", email);
    expect((await admin.from("authorized_emails").insert({ email, role: papel })).error).toBeNull();
    const { data, error } = await admin.auth.admin.createUser({ email, password: SENHA, email_confirm: true });
    expect(error).toBeNull();
    usuarios[nome] = { email, papel, id: data.user!.id };
  }
  return usuarios;
}

/** Remove os usuários (a carteira cai em cascata) e as autorizações. */
export async function removerUsuarios(usuarios: Record<string, UsuarioDeTeste>) {
  const admin = clienteAdministrativo();
  for (const { email } of Object.values(usuarios)) {
    await removerUsuario(email);
    expect((await admin.from("authorized_emails").delete().eq("email", email)).error).toBeNull();
  }
}

/** Cliente com a sessão do próprio usuário: o mesmo caminho (RLS e funções) da aplicação. */
export async function clienteDoUsuario(usuario: UsuarioDeTeste): Promise<SupabaseClient> {
  const cliente = createClient(url!, publishableKey!, semSessao);
  const { error } = await cliente.auth.signInWithPassword({ email: usuario.email, password: SENHA });
  expect(error).toBeNull();
  return cliente;
}

/** Entra pela tela, com o login por senha do ambiente local. */
export async function entrar(page: Page, usuario: UsuarioDeTeste) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(usuario.email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar com senha" }).click();
  await expect(page).toHaveURL(/\/$/);
}
