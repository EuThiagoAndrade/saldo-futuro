import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { sqlLocal } from "./apoio/banco";
import { configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// Área autenticada da issue A (#37): proteção por ponto de entrada (D2), navegação (DESIGN.md
// 6.1), "Ocultar valores" (D8) e acessibilidade, com usuários exclusivos deste arquivo (D9).

const ROTAS = ["/", "/lancamentos", "/ativos", "/benchmarks", "/transferencias", "/conta", "/admin"];
const MOVEL = { width: 360, height: 800 };
const DESKTOP = { width: 1280, height: 900 };
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test.describe("área autenticada", () => {
  test.skip(!configurado, "Roda só com o Supabase local configurado.");
  test.describe.configure({ mode: "serial" });

  let u: Record<string, UsuarioDeTeste>;
  test.beforeAll(async () => {
    u = await criarUsuarios("navegacao", { comum: "user", admin: "admin", semperfil: "user" });
  });
  test.afterAll(async () => {
    await removerUsuarios(u);
  });

  async function semViolacoes(page: Page) {
    const resultado = await new AxeBuilder({ page }).withTags(WCAG).analyze();
    expect(resultado.violations).toEqual([]);
  }

  test("sem sessão, toda rota do grupo redireciona para /entrar", async ({ page }) => {
    for (const rota of ROTAS) {
      await page.goto(rota);
      await expect(page, rota).toHaveURL(/\/entrar$/);
    }
  });

  test("com a sessão encerrada, a próxima navegação volta para /entrar", async ({ page, context }) => {
    await entrar(page, u.comum);
    await context.clearCookies();
    await page.goto("/conta");
    await expect(page).toHaveURL(/\/entrar$/);
  });

  test("no celular, a barra tem os cinco itens e Mais não mostra Administração ao usuário comum", async ({ page }) => {
    await page.setViewportSize(MOVEL);
    await entrar(page, u.comum);
    const barra = page.getByRole("navigation", { name: "Principal" });
    for (const item of ["Início", "Lançamentos", "Ativos", "Benchmarks"]) {
      await expect(barra.getByRole("link", { name: item })).toBeVisible();
    }
    await expect(barra.getByRole("link", { name: "Início" })).toHaveAttribute("aria-current", "page");
    await barra.getByRole("button", { name: "Mais" }).click();
    const folha = page.getByRole("dialog", { name: "Mais" });
    await expect(folha.getByRole("link", { name: "Transferências" })).toBeVisible();
    await expect(folha.getByRole("link", { name: "Conta" })).toBeVisible();
    await expect(folha.getByRole("link", { name: "Administração" })).toHaveCount(0);
    await semViolacoes(page);
    await page.keyboard.press("Escape");
    await expect(folha).toBeHidden();
  });

  test("no desktop, o menu lateral lista os destinos de Mais abaixo do divisor", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.comum);
    const menu = page.getByRole("navigation", { name: "Menu lateral" });
    for (const item of ["Início", "Lançamentos", "Ativos", "Benchmarks", "Transferências", "Conta"]) {
      await expect(menu.getByRole("link", { name: item })).toBeVisible();
    }
    await expect(menu.getByRole("link", { name: "Administração" })).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Principal" })).toBeHidden();
  });

  test("o usuário comum recebe 404 na administração", async ({ page }) => {
    await entrar(page, u.comum);
    const resposta = await page.goto("/admin");
    expect(resposta?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: "Página não encontrada" })).toBeVisible();
  });

  test("o admin vê e abre Administração", async ({ page }) => {
    await page.setViewportSize(MOVEL);
    await entrar(page, u.admin);
    await page.getByRole("navigation", { name: "Principal" }).getByRole("button", { name: "Mais" }).click();
    await page.getByRole("dialog", { name: "Mais" }).getByRole("link", { name: "Administração" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { level: 1, name: "Administração" })).toBeVisible();
    await semViolacoes(page);
  });

  test("Conta mostra o e-mail e o perfil e permite sair", async ({ page }) => {
    await entrar(page, u.comum);
    await page.goto("/conta");
    await expect(page.getByText(u.comum.email)).toBeVisible();
    await expect(page.getByText("Usuário", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/entrar$/);
  });

  test("Ocultar valores ligado antes da carga vale depois de recarregar e navegar", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "sf_ocultar_valores", value: "1", url: baseURL! }]);
    await entrar(page, u.comum);
    const botao = page.getByRole("button", { name: "Ocultar valores" });
    await expect(botao).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(botao).toHaveAttribute("aria-pressed", "true");
    await page.goto("/conta");
    await expect(botao).toHaveAttribute("aria-pressed", "true");

    await botao.click();
    await expect(botao).toHaveAttribute("aria-pressed", "false");
    const cookie = (await context.cookies()).find((c) => c.name === "sf_ocultar_valores");
    expect(cookie?.value).toBe("0");
    expect(cookie?.httpOnly).toBe(true);
  });

  test("a ação chamada sem sessão é recusada sem efeito", async ({ page, context }) => {
    await entrar(page, u.comum);
    await context.clearCookies();
    await page.getByRole("button", { name: "Ocultar valores" }).click();
    await expect(page).toHaveURL(/\/entrar$/);
    const cookie = (await context.cookies()).find((c) => c.name === "sf_ocultar_valores");
    expect(cookie).toBeUndefined();
  });

  test("falha ao ler o perfil mostra o estado de erro, sem dados parciais", async ({ page }) => {
    sqlLocal(`delete from public.profiles where user_id = '${u.semperfil.id}';`);
    await entrar(page, u.semperfil);
    await expect(page.getByRole("heading", { name: "Algo deu errado" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Principal" })).toHaveCount(0);
  });

  for (const tamanho of [MOVEL, DESKTOP]) {
    test(`as páginas da entrega não têm violações de acessibilidade em ${tamanho.width} px`, async ({ page }) => {
      await page.setViewportSize(tamanho);
      await entrar(page, u.admin);
      for (const rota of ROTAS) {
        await page.goto(rota);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await semViolacoes(page);
      }
    });
  }
});
