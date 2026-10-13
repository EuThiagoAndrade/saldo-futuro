import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Roda contra o Supabase local. A chave secreta local só existe neste ambiente de teste e no CI:
// ela vem de `npx supabase status -o env` e não entra em .env.example nem na Vercel.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const configured = Boolean(url && publishableKey && secretKey);

const PASSWORD = "senha-de-teste-e2e-1";
const USER_EMAIL = "usuario.a@example.com"; // autorizado no seed, papel user
const ADMIN_EMAIL = "admin@example.com"; // autorizado no seed, papel admin
const OUTSIDER_EMAIL = "fora.da.lista@example.com"; // ausente da lista

const noSession = { auth: { autoRefreshToken: false, persistSession: false } };

test.describe("autenticação com o Supabase local", () => {
  test.skip(!configured, "Roda só com o Supabase local configurado.");
  test.describe.configure({ mode: "serial" });

  const admin = () => createClient(url!, secretKey!, noSession);

  async function findUser(email: string) {
    const { data, error } = await admin().auth.admin.listUsers({ page: 1, perPage: 1000 });
    expect(error).toBeNull();
    return data.users.find((user) => user.email === email);
  }

  async function removeUser(email: string) {
    const user = await findUser(email);
    if (user) expect((await admin().auth.admin.deleteUser(user.id)).error).toBeNull();
  }

  async function createUser(email: string) {
    await removeUser(email);
    const { error } = await admin().auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
    expect(error).toBeNull();
  }

  test.beforeAll(async () => {
    for (const email of [USER_EMAIL, ADMIN_EMAIL, OUTSIDER_EMAIL]) await removeUser(email);
  });

  test.afterAll(async () => {
    for (const email of [USER_EMAIL, ADMIN_EMAIL, OUTSIDER_EMAIL]) await removeUser(email);
  });

  test("sem sessão, a rota protegida redireciona para /entrar", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/entrar$/);
    await expect(page.getByRole("heading", { level: 1, name: "Entrar" })).toBeVisible();
  });

  test("a página de entrada não tem violações de acessibilidade (WCAG 2.2 AA)", async ({ page }) => {
    await page.goto("/entrar");
    await expect(page.getByRole("button", { name: "Entrar com Google" })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  async function signInWithPassword(page: import("@playwright/test").Page, email: string, password = PASSWORD) {
    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar com senha" }).click();
  }

  test("usuário autorizado entra, vê o próprio perfil e sai", async ({ page }) => {
    await createUser(USER_EMAIL);
    await signInWithPassword(page, USER_EMAIL);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1, name: "Em construção" })).toBeVisible();
    await expect(page.getByText(USER_EMAIL)).toBeVisible();
    await expect(page.getByText("Usuário", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/entrar$/);
    await page.goto("/");
    await expect(page).toHaveURL(/\/entrar$/);
  });

  test("administrador autorizado vê o papel de administrador", async ({ page }) => {
    await createUser(ADMIN_EMAIL);
    await signInWithPassword(page, ADMIN_EMAIL);
    await expect(page.getByText("Administrador", { exact: true })).toBeVisible();
  });

  test("senha incorreta mostra mensagem neutra e não entra", async ({ page }) => {
    await signInWithPassword(page, USER_EMAIL, "senha-errada-1");
    await expect(page.getByText("Não foi possível entrar com esses dados.")).toBeVisible();
    await expect(page).toHaveURL(/\/entrar$/);
  });

  test("cadastro por senha de e-mail fora da lista é recusado e não cria usuário", async () => {
    const anonymous = createClient(url!, publishableKey!, noSession);
    const { data, error } = await anonymous.auth.signUp({ email: OUTSIDER_EMAIL, password: PASSWORD });
    expect(error).not.toBeNull();
    expect(data.user).toBeNull();
    expect(await findUser(OUTSIDER_EMAIL)).toBeUndefined();
  });
});
