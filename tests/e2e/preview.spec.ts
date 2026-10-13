import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Sem as variáveis do Supabase (previews da Vercel), as páginas mostram o aviso e não usam o backend.
const hasBackend = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

test.describe("preview sem backend", () => {
  test.skip(hasBackend, "Roda só quando o Supabase não está configurado.");

  for (const route of ["/", "/entrar"]) {
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

  test("o aviso não tem violações de acessibilidade (WCAG 2.2 AA)", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
