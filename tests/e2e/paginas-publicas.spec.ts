import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

// Páginas públicas de privacidade e termos e a apresentação de /entrar (#104, BL-012). Rodam com
// e sem backend, sempre sem sessão. O contato publicado não é repetido aqui: os testes conferem
// a forma do link, não o endereço.

const hasBackend = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const LARGURAS = [
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 1280, height: 900 },
];

const PAGINAS = [
  { rota: "/privacidade", titulo: "Política de privacidade", outra: { rota: "/termos", nome: "Termos de uso" } },
  { rota: "/termos", titulo: "Termos de uso", outra: { rota: "/privacidade", nome: "Política de privacidade" } },
];

/** Pedidos feitos pelo navegador a outra origem (dados, fontes ou scripts externos). */
function pedidosExternos(page: Page, baseURL: string) {
  const externos: string[] = [];
  page.on("request", (pedido) => {
    if (new URL(pedido.url()).origin !== new URL(baseURL).origin) externos.push(pedido.url());
  });
  return externos;
}

for (const { rota, titulo, outra } of PAGINAS) {
  test.describe(rota, () => {
    test("responde 200 sem sessão e sem redirecionar", async ({ request }) => {
      const resposta = await request.get(rota, { maxRedirects: 0 });
      expect(resposta.status()).toBe(200);
      expect(resposta.headers()["location"]).toBeUndefined();
    });

    test("é completa: título, data, contato e link para a outra página, sem pedido externo", async ({ page, baseURL }) => {
      const externos = pedidosExternos(page, baseURL!);
      await page.goto(rota);
      await expect(page).toHaveTitle(`${titulo} — Saldo Futuro`);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /\S/);
      await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
      await expect(page.getByRole("heading", { level: 1, name: titulo })).toBeVisible();
      expect(await page.getByRole("heading", { level: 2 }).count()).toBeGreaterThanOrEqual(4);
      await expect(page.locator("time")).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}$/);

      const contato = page.locator('main a[href^="mailto:"]').first();
      await expect(contato).toBeVisible();
      const href = await contato.getAttribute("href");
      expect(await contato.innerText()).toBe(href!.slice("mailto:".length));

      const texto = await page.locator("main").innerText();
      // Marcadores de rascunho em maiúsculas ("todos" é palavra do texto), lorem ipsum e campos a preencher.
      expect(texto).not.toMatch(/\b(?:TODO|TBD|XXX)\b|lorem|ipsum|<[^>]*>|\{|\}|\[[^\]]*\]/);

      const documentos = page.getByRole("navigation", { name: "Documentos" });
      await expect(documentos.getByRole("link", { name: titulo })).toHaveAttribute("aria-current", "page");
      await documentos.getByRole("link", { name: outra.nome }).click();
      await expect(page).toHaveURL(new RegExp(`${outra.rota}$`));
      await expect(page.getByRole("heading", { level: 1, name: outra.nome })).toBeVisible();
      expect(externos).toEqual([]);
    });

    test("o teclado chega ao link da outra página, com foco visível", async ({ page }) => {
      await page.goto(rota);
      const alvo = page.getByRole("navigation", { name: "Documentos" }).getByRole("link", { name: outra.nome });
      for (let i = 0; i < 20 && !(await alvo.evaluate((el) => el === document.activeElement)); i++) {
        await page.keyboard.press("Tab");
      }
      await expect(alvo).toBeFocused();
      expect(await alvo.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("solid");
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`${outra.rota}$`));
    });

    for (const tamanho of LARGURAS) {
      test(`sem violações de acessibilidade nem rolagem horizontal em ${tamanho.width} px`, async ({ page }) => {
        await page.setViewportSize(tamanho);
        await page.goto(rota);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        const resultado = await new AxeBuilder({ page }).withTags(WCAG).analyze();
        expect(resultado.violations).toEqual([]);
        const largura = await page.evaluate(() => ({
          cliente: document.documentElement.clientWidth,
          rolagem: document.documentElement.scrollWidth,
        }));
        expect(largura.rolagem).toBeLessThanOrEqual(largura.cliente);
        // DESIGN.md 7: alvo de toque de 44 px em todo link, inclusive o contato e o logo.
        for (const link of await page.locator("main a").all()) {
          const caixa = (await link.boundingBox())!;
          expect(caixa.height, await link.innerText()).toBeGreaterThanOrEqual(44);
          expect(caixa.width, await link.innerText()).toBeGreaterThanOrEqual(44);
        }
      });
    }
  });
}

test.describe("/entrar", () => {
  test("descreve o produto e a restrição de acesso e leva à política e aos termos", async ({ page }) => {
    await page.goto("/entrar");
    await expect(page.getByText(/sistema web de gestão de investimentos pessoais/)).toBeVisible();
    await expect(page.getByText(/só entram pessoas com e-mail autorizado/)).toBeVisible();
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /investimentos pessoais/);

    if (hasBackend) {
      await expect(page.getByRole("heading", { level: 1, name: "Entrar" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Entrar com Google" })).toBeVisible();
    } else {
      await expect(page.getByRole("heading", { level: 1, name: "Preview sem backend" })).toBeVisible();
      await expect(page.getByRole("button")).toHaveCount(0);
    }

    const documentos = page.getByRole("navigation", { name: "Documentos" });
    await expect(documentos.getByRole("link", { name: "Termos de uso" })).toHaveAttribute("href", "/termos");
    await documentos.getByRole("link", { name: "Política de privacidade" }).click();
    await expect(page).toHaveURL(/\/privacidade$/);
  });

  for (const tamanho of [LARGURAS[0], LARGURAS[2]]) {
    test(`sem violações de acessibilidade nem rolagem horizontal em ${tamanho.width} px`, async ({ page }) => {
      await page.setViewportSize(tamanho);
      await page.goto("/entrar");
      await expect(page.getByRole("navigation", { name: "Documentos" })).toBeVisible();
      const resultado = await new AxeBuilder({ page }).withTags(WCAG).analyze();
      expect(resultado.violations).toEqual([]);
      for (const link of await page.getByRole("navigation", { name: "Documentos" }).getByRole("link").all()) {
        expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
      const largura = await page.evaluate(() => ({
        cliente: document.documentElement.clientWidth,
        rolagem: document.documentElement.scrollWidth,
      }));
      expect(largura.rolagem).toBeLessThanOrEqual(largura.cliente);
    });
  }
});
