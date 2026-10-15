import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, type Request, test } from "@playwright/test";
import {
  clienteAdministrativo, clienteDoUsuario, configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste,
} from "./apoio/supabase";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const CONVITE = "acessos.convite@example.com";
const NEGADO = "acessos.negado@example.com";

test.describe("administração de acessos", () => {
  test.skip(!configurado, "Roda só com o Supabase local configurado.");
  let u: Record<string, UsuarioDeTeste>;

  test.beforeAll(async () => {
    u = await criarUsuarios("acessos", { admin: "admin", comum: "user", existente: "user" });
    expect((await clienteAdministrativo().from("authorized_emails").delete().in("email", [CONVITE, NEGADO])).error).toBeNull();
  });
  test.afterAll(async () => {
    expect((await clienteAdministrativo().from("authorized_emails").delete().in("email", [CONVITE, NEGADO])).error).toBeNull();
    await removerUsuarios(u);
  });

  async function abrir(page: Page) {
    await entrar(page, u.admin);
    await page.goto("/admin");
    await page.getByRole("link", { name: "Administrar acessos" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Acessos" })).toBeVisible();
  }

  async function registro(email: string) {
    const { data, error } = await clienteAdministrativo().from("authorized_emails").select("email, role").eq("email", email);
    expect(error).toBeNull();
    return data;
  }

  function item(page: Page, email: string) {
    return page.getByRole("row").filter({ has: page.getByRole("cell", { name: email, exact: true }) });
  }

  test("autoriza normalizado, preserva papel em duplicidade e remove só após confirmar", async ({ page }) => {
    await abrir(page);
    await expect(page.getByText(/adicione também a pessoa como usuário de teste no Google/)).toBeVisible();
    await expect(page.getByText(/Remover um e-mail da lista não revoga uma conta existente/)).toBeVisible();
    await expect(page.getByLabel("Papel inicial", { exact: true })).toHaveValue("user");
    await page.getByLabel("E-mail", { exact: true }).fill("  ACESSOS.CONVITE@EXAMPLE.COM  ");
    await page.getByLabel("Papel inicial", { exact: true }).selectOption("admin");
    await page.getByRole("button", { name: "Autorizar e-mail", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "E-mail autorizado." })).toBeVisible();
    expect(await registro(CONVITE)).toEqual([{ email: CONVITE, role: "admin" }]);
    await expect(item(page, CONVITE)).toContainText("Administrador");

    await page.getByLabel("E-mail", { exact: true }).fill(CONVITE);
    await page.getByLabel("Papel inicial", { exact: true }).selectOption("user");
    await page.getByRole("button", { name: "Autorizar e-mail", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Este e-mail já está autorizado." })).toHaveText("Este e-mail já está autorizado. O papel inicial foi mantido.");
    expect(await registro(CONVITE)).toEqual([{ email: CONVITE, role: "admin" }]);

    await item(page, CONVITE).getByRole("button", { name: "Remover da lista" }).click();
    const dialogo = page.getByRole("dialog", { name: `Remover ${CONVITE} da lista`, exact: true });
    await expect(dialogo.getByRole("button", { name: "Cancelar" })).toBeFocused();
    await expect(dialogo).toContainText("não revoga uma conta existente");
    await page.keyboard.press("Escape");
    await expect(dialogo).toBeHidden();
    expect(await registro(CONVITE)).toHaveLength(1);
    await item(page, CONVITE).getByRole("button", { name: "Remover da lista" }).click();
    await dialogo.getByRole("button", { name: "Cancelar" }).click();
    expect(await registro(CONVITE)).toHaveLength(1);
    await item(page, CONVITE).getByRole("button", { name: "Remover da lista" }).click();
    await dialogo.getByRole("button", { name: "Remover e-mail" }).click();
    await expect(item(page, CONVITE)).toHaveCount(0);
    expect(await registro(CONVITE)).toEqual([]);
  });

  test("remover da lista mantém a conta, o perfil e o login existentes", async ({ page }) => {
    await abrir(page);
    await item(page, u.existente.email).getByRole("button", { name: "Remover da lista" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Remover e-mail" }).click();
    await expect(item(page, u.existente.email)).toHaveCount(0);
    expect(await registro(u.existente.email)).toEqual([]);
    // Reautorizar com outro papel inicial também não altera o perfil que já existe (KB-002 P3).
    await page.getByLabel("E-mail", { exact: true }).fill(u.existente.email);
    await page.getByLabel("Papel inicial", { exact: true }).selectOption("admin");
    await page.getByRole("button", { name: "Autorizar e-mail", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "E-mail autorizado." })).toBeVisible();
    expect(await registro(u.existente.email)).toEqual([{ email: u.existente.email, role: "admin" }]);
    // Novo login por senha no backend local: a remoção não apagou nem revogou a conta.
    const cliente = await clienteDoUsuario(u.existente);
    const { data, error } = await cliente.from("profiles").select("email, role").single();
    expect(error).toBeNull();
    expect(data).toEqual({ email: u.existente.email, role: "user" });
  });

  test("servidor valida e-mail e papel mesmo com validação do navegador desativada", async ({ page }) => {
    await abrir(page);
    await page.getByLabel("E-mail", { exact: true }).evaluate((campo) => { (campo as HTMLInputElement).form!.noValidate = true; });
    await page.getByLabel("E-mail", { exact: true }).fill("email invalido@example.com");
    await page.getByRole("button", { name: "Autorizar e-mail", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Informe um e-mail válido." })).toBeVisible();
    await expect(page.getByLabel("E-mail", { exact: true })).toHaveAttribute("aria-invalid", "true");
    await page.getByLabel("E-mail", { exact: true }).evaluate((campo) => { campo.removeAttribute("name"); });
    const semEmail = page.waitForResponse((resposta) => resposta.request().method() === "POST");
    await page.getByRole("button", { name: "Autorizar e-mail", exact: true }).click();
    await semEmail;
    await expect(page.getByRole("alert").filter({ hasText: "Informe um e-mail válido." })).toBeVisible();
    await page.getByLabel("E-mail", { exact: true }).evaluate((campo) => { campo.setAttribute("name", "email"); });
    await page.getByLabel("E-mail", { exact: true }).fill(NEGADO);
    await page.getByLabel("Papel inicial", { exact: true }).evaluate((campo) => {
      const select = campo as HTMLSelectElement;
      select.add(new Option("Inválido", "superadmin"));
      select.value = "superadmin";
    });
    await page.getByRole("button", { name: "Autorizar e-mail", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Escolha um papel inicial válido." })).toBeVisible();
    await expect(page.getByLabel("Papel inicial", { exact: true })).toHaveAttribute("aria-invalid", "true");
    expect(await registro(NEGADO)).toEqual([]);
  });

  test("sem sessão redireciona; usuário comum recebe 404 e não chama ações admin", async ({ page, context, browser }) => {
    await page.goto("/admin/acessos");
    await expect(page).toHaveURL(/\/entrar$/);
    await abrir(page);

    // Captura os POSTs reais, sem executá-los, para chamar os mesmos pontos de entrada com
    // outra sessão. O teste não depende de identificadores internos gerados pelo Next.
    let capturar: (pedido: Request) => void = () => {};
    await page.route("**/admin/acessos", async (route) => {
      if (route.request().method() === "POST") { capturar(route.request()); await route.abort(); }
      else await route.continue();
    });
    const insercao = new Promise<Request>((resolve) => { capturar = resolve; });
    await page.getByLabel("E-mail", { exact: true }).fill(NEGADO);
    await page.getByRole("button", { name: "Autorizar e-mail", exact: true }).click();
    const pedidoInsercao = await insercao;
    await page.reload();
    const exclusao = new Promise<Request>((resolve) => { capturar = resolve; });
    await item(page, u.comum.email).getByRole("button", { name: "Remover da lista" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Remover e-mail" }).click();
    const pedidoExclusao = await exclusao;

    const comum = await browser.newContext();
    try {
      const tela = await comum.newPage();
      await entrar(tela, u.comum);
      expect((await tela.goto("/admin/acessos"))?.status()).toBe(404);
      await expect(tela.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
      for (const pedido of [pedidoInsercao, pedidoExclusao]) {
        const originais = await pedido.allHeaders();
        const headers = { "next-action": originais["next-action"], "content-type": originais["content-type"], origin: new URL(pedido.url()).origin };
        const resposta = await comum.request.post(pedido.url(), { headers, data: pedido.postDataBuffer()! });
        expect(resposta.status()).toBe(404);
        await context.clearCookies();
        const semSessao = await context.request.post(pedido.url(), { headers, data: pedido.postDataBuffer()!, maxRedirects: 0 });
        expect(semSessao.headers()["x-action-redirect"] ?? semSessao.headers()["location"]).toContain("/entrar");
      }
      expect(await registro(NEGADO)).toEqual([]);
      expect(await registro(u.comum.email)).toEqual([{ email: u.comum.email, role: "user" }]);
    } finally { await comum.close(); }
  });

  for (const width of [360, 1280]) {
    test(`lista e confirmação acessíveis sem rolagem horizontal em ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await abrir(page);
      const lista = width < 768 ? page.getByRole("listitem").filter({ hasText: u.comum.email }) : item(page, u.comum.email);
      await expect(lista).toContainText("Usuário");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
      await page.screenshot({ path: `local/issue-42/acessos-${width}.png`, fullPage: true });
      await lista.getByRole("button", { name: "Remover da lista" }).click();
      await expect(page.getByRole("dialog").getByRole("button", { name: "Cancelar" })).toBeFocused();
      expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
      await page.screenshot({ path: `local/issue-42/confirmacao-${width}.png` });
      await page.keyboard.press("Escape");
      expect(await registro(u.comum.email)).toHaveLength(1);
    });
  }
});
