import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Sem as variáveis do Supabase (previews da Vercel), as páginas mostram o aviso e não usam o backend.
const hasBackend = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

test.describe("preview sem backend", () => {
  test.skip(hasBackend, "Roda só quando o Supabase não está configurado.");

  for (const route of ["/", "/entrar", "/admin/acessos"]) {
    test(`${route} mostra o aviso e não faz requisição a outra origem`, async ({ page, baseURL }) => {
      const foreign: string[] = [];
      page.on("request", (request) => {
        if (new URL(request.url()).origin !== new URL(baseURL!).origin) foreign.push(request.url());
      });
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(`${route === "/" ? "/$" : route}$`));
      await expect(page.getByRole("heading", { level: 1, name: "Preview sem backend" })).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
      expect(foreign).toEqual([]);
    });
  }

  // Links da política e dos termos em /entrar (#104) continuam no preview, sem login.
  test("/entrar mantém os links legais, sem habilitar o login", async ({ page }) => {
    await page.goto("/entrar");
    const documentos = page.getByRole("navigation", { name: "Documentos" });
    await expect(documentos.getByRole("link", { name: "Política de privacidade" })).toBeVisible();
    await expect(documentos.getByRole("link", { name: "Termos de uso" })).toBeVisible();
    await expect(page.getByRole("button")).toHaveCount(0);
    await expect(page.getByLabel("E-mail")).toHaveCount(0);
  });

  for (const route of ["/", "/entrar"]) {
    test(`o aviso em ${route} não tem violações de acessibilidade (WCAG 2.2 AA)`, async ({ page }) => {
      await page.goto(route);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
