import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { sqlLocal } from "./apoio/banco";
import { configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// Área autenticada da issue A (#37): proteção por ponto de entrada (D2), navegação (DESIGN.md
// 6.1), "Ocultar valores" (D8) e acessibilidade, com usuários exclusivos deste arquivo (D9).

const ROTAS = ["/", "/lancamentos", "/ativos", "/benchmarks", "/transferencias", "/conta", "/admin"];
// Páginas legais públicas (#104): fora do grupo autenticado, visitadas com e sem sessão.
const PUBLICAS = ["/privacidade", "/termos"];
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

  test("sem sessão, as páginas legais abrem sem redirecionar para /entrar", async ({ page }) => {
    for (const rota of PUBLICAS) {
      await page.goto(rota);
      await expect(page, rota).toHaveURL(new RegExp(`${rota}$`));
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });

  test("com a sessão encerrada, a próxima navegação volta para /entrar", async ({ page, context }) => {
    await entrar(page, u.comum);
    await context.clearCookies();
    await page.goto("/conta");
    await expect(page).toHaveURL(/\/entrar$/);
  });

  test("no celular, a marca e a barra têm nomes e destinos corretos e Mais não mostra Administração", async ({ page }) => {
    await page.setViewportSize(MOVEL);
    await entrar(page, u.comum);
    const cabecalho = page.getByRole("banner");
    await expect(cabecalho.getByRole("link", { name: "Saldo Futuro" })).toBeVisible();
    await expect(cabecalho.getByRole("link", { name: "Saldo Futuro" })).toHaveAttribute("href", "/");
    await expect(page.getByRole("link", { name: "Saldo Futuro" })).toHaveCount(1);
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
    // Os documentos legais ficam em Conta e no login, não na navegação (#104).
    await expect(menu.getByRole("link")).toHaveCount(7);
    await expect(menu.getByRole("link", { name: "Saldo Futuro" })).toBeVisible();
    await expect(page.getByRole("banner").getByRole("link", { name: "Saldo Futuro" })).toBeHidden();
    await expect(page.getByRole("link", { name: "Saldo Futuro" })).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: "Principal" })).toBeHidden();
  });

  test("a marca mantém dimensões, proteção e controles em todas as larguras do plano", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "sf_ocultar_valores", value: "1", url: baseURL! }]);
    await entrar(page, u.comum);

    const larguras = [360, 390, 768, 1024, 1280];
    let larguraBotao: number | undefined;

    async function conferirLargura(largura: number, oculto: boolean) {
      await page.setViewportSize({ width: largura, height: 800 });
      const cabecalho = page.getByRole("banner");
      const botao = cabecalho.getByRole("button", { name: "Ocultar valores" });
      await expect(botao).toHaveAttribute("aria-pressed", String(oculto));

      const caixaCabecalho = await cabecalho.boundingBox();
      const caixaBotao = await botao.boundingBox();
      expect(caixaCabecalho).not.toBeNull();
      expect(caixaBotao).not.toBeNull();
      expect(caixaBotao!.height).toBeGreaterThanOrEqual(44);
      larguraBotao ??= caixaBotao!.width;
      expect(caixaBotao!.width).toBeCloseTo(larguraBotao, 1);

      const dimensoes = await cabecalho.evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));
      expect(dimensoes.scrollWidth).toBeLessThanOrEqual(dimensoes.clientWidth);

      const marcaCabecalho = cabecalho.getByRole("link", { name: "Saldo Futuro" });
      if (largura < 1024) {
        await expect(marcaCabecalho).toBeVisible();
        await expect(page.getByRole("navigation", { name: "Menu lateral" })).toBeHidden();

        const caixaMarca = await marcaCabecalho.boundingBox();
        const caixaImagem = await marcaCabecalho.locator("img").boundingBox();
        expect(caixaMarca).not.toBeNull();
        expect(caixaImagem).not.toBeNull();
        expect(caixaMarca!.width).toBeGreaterThanOrEqual(44);
        expect(caixaMarca!.height).toBeGreaterThanOrEqual(44);
        expect(caixaImagem!.height).toBeGreaterThanOrEqual(32);
        expect(caixaImagem!.width / caixaImagem!.height).toBeCloseTo(4, 1);
        expect(caixaImagem!.x - caixaMarca!.x).toBeGreaterThanOrEqual(8);
        expect(caixaMarca!.x + caixaMarca!.width - caixaImagem!.x - caixaImagem!.width).toBeGreaterThanOrEqual(8);
        expect(caixaImagem!.y - caixaCabecalho!.y).toBeGreaterThanOrEqual(8);
        expect(caixaCabecalho!.y + caixaCabecalho!.height - caixaImagem!.y - caixaImagem!.height).toBeGreaterThanOrEqual(8);
        expect(caixaMarca!.x + caixaMarca!.width).toBeLessThanOrEqual(caixaBotao!.x);
      } else {
        await expect(marcaCabecalho).toBeHidden();
        await expect(page.getByRole("navigation", { name: "Menu lateral" }).getByRole("link", { name: "Saldo Futuro" })).toBeVisible();
      }

      await expect(page.getByRole("link", { name: "Saldo Futuro" })).toHaveCount(1);
    }

    for (const largura of larguras) await conferirLargura(largura, true);

    await page.setViewportSize(MOVEL);
    const marca = page.getByRole("banner").getByRole("link", { name: "Saldo Futuro" });
    await page.keyboard.press("Tab");
    await expect(marca).toBeFocused();
    expect(await marca.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe("solid");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/$/);

    await page.setViewportSize(MOVEL);
    const botao = page.getByRole("banner").getByRole("button", { name: "Ocultar valores" });
    const caixaAntes = await botao.boundingBox();
    await botao.click();
    await expect(botao).toHaveAttribute("aria-pressed", "false");
    expect(await botao.boundingBox()).toMatchObject({ width: caixaAntes!.width, height: caixaAntes!.height });

    larguraBotao = undefined;
    for (const largura of larguras) await conferirLargura(largura, false);
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

  test("Conta oferece a política de privacidade e os termos de uso", async ({ page }) => {
    await entrar(page, u.comum);
    await page.goto("/conta");
    const documentos = page.getByRole("main").getByRole("navigation", { name: "Documentos" });
    await expect(documentos.getByRole("link", { name: "Política de privacidade" })).toHaveAttribute("href", "/privacidade");
    await documentos.getByRole("link", { name: "Termos de uso" }).click();
    await expect(page).toHaveURL(/\/termos$/);
    await expect(page.getByRole("heading", { level: 1, name: "Termos de uso" })).toBeVisible();
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

  test("Ocultar valores continua funcional sem JavaScript", async ({ page, context, browser, baseURL }) => {
    await entrar(page, u.comum);
    const cookiesSessao = await context.cookies();
    const contextoSemJs = await browser.newContext({ baseURL: baseURL!, javaScriptEnabled: false });
    try {
      await contextoSemJs.addCookies(cookiesSessao);
      await contextoSemJs.addCookies([{ name: "sf_ocultar_valores", value: "1", url: baseURL! }]);
      const pageSemJs = await contextoSemJs.newPage();
      await pageSemJs.setViewportSize(MOVEL);
      await pageSemJs.goto("/conta");
      const botao = pageSemJs.getByRole("banner").getByRole("button", { name: "Ocultar valores" });
      await expect(botao).toHaveAttribute("aria-pressed", "true");
      await expect(pageSemJs.getByRole("banner").getByRole("link", { name: "Saldo Futuro" })).toBeVisible();

      await botao.click();
      await expect(botao).toHaveAttribute("aria-pressed", "false");
      const cookie = (await contextoSemJs.cookies()).find((item) => item.name === "sf_ocultar_valores");
      expect(cookie?.value).toBe("0");
      expect(cookie?.httpOnly).toBe(true);
    } finally {
      await contextoSemJs.close();
    }
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
      for (const rota of [...ROTAS, ...PUBLICAS]) {
        await page.goto(rota);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await semViolacoes(page);
      }
    });
  }
});
