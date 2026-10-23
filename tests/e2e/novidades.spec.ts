import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { expect, type Page, test } from "@playwright/test";
import { configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// Versão e novidades (#105, BL-011): página autenticada para os dois perfis, destino em Mais e
// no menu lateral. Usuários fictícios exclusivos deste arquivo (D9 do ciclo 004).

const MOVEL = { width: 360, height: 800 };
const DESKTOP = { width: 1280, height: 900 };
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const VERSAO: string = JSON.parse(readFileSync("package.json", "utf8")).version;
// A entrada 0.7.0 só aparece depois de lançada; durante 0.6.0 o histórico fica indisponível.
const [MAIOR, MENOR] = VERSAO.split(".").map(Number);
const LANCOU_070 = MAIOR > 0 || MENOR >= 7;

test.describe("novidades (#105)", () => {
  test.skip(!configurado, "Roda só com o Supabase local configurado.");
  test.describe.configure({ mode: "serial" });

  let u: Record<string, UsuarioDeTeste>;
  test.beforeAll(async () => {
    u = await criarUsuarios("novidades105", { comum: "user", admin: "admin" });
  });
  test.afterAll(async () => {
    if (u) await removerUsuarios(u);
  });

  async function conferirConteudo(page: Page) {
    await expect(page.getByRole("heading", { level: 1, name: "Novidades" })).toBeVisible();
    await expect(page.getByText(`Versão atual: ${VERSAO}`)).toBeVisible();
    if (LANCOU_070) {
      await expect(page.getByRole("heading", { level: 2, name: "Versão 0.7.0" })).toBeVisible();
    } else {
      await expect(page.getByText("O histórico de novidades ainda não está disponível.")).toBeVisible();
      await expect(page.getByText("0.7.0")).toHaveCount(0);
    }
    // Nenhum link ao changelog técnico do repositório.
    await expect(page.locator('main a[href*="github.com"], main a[href*="CHANGELOG" i]')).toHaveCount(0);
  }

  test("sem sessão, redireciona para /entrar", async ({ page }) => {
    await page.goto("/novidades");
    await expect(page).toHaveURL(/\/entrar$/);
  });

  test("no celular, o usuário comum abre Novidades por Mais, com destino ativo", async ({ page }) => {
    await page.setViewportSize(MOVEL);
    await entrar(page, u.comum);
    const barra = page.getByRole("navigation", { name: "Principal" });
    await barra.getByRole("button", { name: "Mais" }).click();
    await page.getByRole("dialog", { name: "Mais" }).getByRole("link", { name: "Novidades" }).click();
    await expect(page).toHaveURL(/\/novidades$/);
    await conferirConteudo(page);
    await barra.getByRole("button", { name: "Mais" }).click();
    await expect(page.getByRole("dialog", { name: "Mais" }).getByRole("link", { name: "Novidades" })).toHaveAttribute("aria-current", "page");
  });

  test("no desktop, o admin abre Novidades pelo menu lateral, com destino ativo", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.admin);
    const menu = page.getByRole("navigation", { name: "Menu lateral" });
    await menu.getByRole("link", { name: "Novidades" }).click();
    await expect(page).toHaveURL(/\/novidades$/);
    await conferirConteudo(page);
    await expect(menu.getByRole("link", { name: "Novidades" })).toHaveAttribute("aria-current", "page");
  });

  for (const tamanho of [MOVEL, DESKTOP]) {
    test(`sem violações de acessibilidade nem rolagem horizontal em ${tamanho.width} px`, async ({ page }) => {
      await page.setViewportSize(tamanho);
      await entrar(page, u.comum);
      await page.goto("/novidades");
      await expect(page.getByRole("heading", { level: 1, name: "Novidades" })).toBeVisible();
      const resultado = await new AxeBuilder({ page }).withTags(WCAG).analyze();
      expect(resultado.violations).toEqual([]);
      const largura = await page.evaluate(() => ({
        cliente: document.documentElement.clientWidth,
        rolagem: document.documentElement.scrollWidth,
      }));
      expect(largura.rolagem).toBeLessThanOrEqual(largura.cliente);
    });
  }
});
