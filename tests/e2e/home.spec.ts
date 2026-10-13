import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("página inicial pública abre com título e apresentação", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Saldo Futuro");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
});

test("página inicial não tem violações de acessibilidade (WCAG 2.2 AA)", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
