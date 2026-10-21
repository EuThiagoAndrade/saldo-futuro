import { expect, type Page, test } from "@playwright/test";
import { prepararCenario } from "./apoio/cenarios";
import { clienteDoUsuario, configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// Campos de intervalo só com "Intervalo escolhido" no Início e na comparação (#96, BL-003).
// Último mês fechado M = 2026-03, com dados fictícios; "2026-04" é um mês posterior a M.
const PREDEFINIDOS = ["mes", "ano", "12_meses", "desde_inicio"];
const TAMANHOS = [{ width: 360, height: 800 }, { width: 1280, height: 900 }];

const telas = [
  {
    nome: "Início",
    url: (q: string) => `/?${q}`,
    select: "#periodo-tipo", de: "#periodo-de", ate: "#periodo-ate", enviar: "Ver período",
    recusa: "Escolha um intervalo que termine até março de 2026",
    anoExibido: (page: Page) => expect(page.getByText("Rentabilidade de janeiro de 2026 a março de 2026", { exact: true })).toBeVisible(),
  },
  {
    nome: "Comparação",
    url: (q: string) => `/benchmarks/comparacao?${q}`,
    select: "#periodo", de: "#de", ate: "#ate", enviar: "Ver comparação",
    recusa: "Escolha um intervalo válido, em ordem e até o último mês fechado.",
    anoExibido: (page: Page) => expect(page.getByText("Período pedido: janeiro de 2026 a março de 2026.")).toBeVisible(),
  },
];

test.describe("campos de intervalo (#96)", () => {
  test.skip(!configurado, "Requer Supabase local com dados fictícios.");
  let u: Record<string, UsuarioDeTeste>;
  test.beforeAll(async () => {
    u = await criarUsuarios("periodo96", { comum: "user" });
    await prepararCenario(await clienteDoUsuario(u.comum), [
      { criarAtivo: "A", nome: "Ativo fictício", tipoAjuste: "rendimento" },
      { lancar: "A", data: "2025-12-01", tipo: "aporte", valor: 1000000 },
      { fechar: "2025-12", saldos: { A: 1000000 } },
      { fechar: "2026-01", saldos: { A: 1010000 } },
      { fechar: "2026-02", saldos: { A: 1020000 } },
      { fechar: "2026-03", saldos: { A: 1030000 } },
    ]);
  });
  test.afterAll(async () => { if (u) await removerUsuarios(u); });

  for (const tela of telas) {
    for (const tamanho of TAMANHOS) {
      test.describe(`${tela.nome} em ${tamanho.width} px`, () => {
        test.beforeEach(async ({ page }) => {
          await page.setViewportSize(tamanho);
          await entrar(page, u.comum);
        });

        const foco = (page: Page, seletor: string) => page.evaluate((s) => { const el = document.querySelector<HTMLElement>(s)!; el.focus(); return document.activeElement === el; }, seletor);

        test("ocultos e fora da ordem de foco nos quatro tipos predefinidos", async ({ page }) => {
          for (const tipo of PREDEFINIDOS) {
            await page.goto(tela.url(`periodo=${tipo}`));
            await expect(page.locator(tela.select)).toHaveValue(tipo);
            await expect(page.locator(tela.de), tipo).toBeHidden();
            await expect(page.locator(tela.ate), tipo).toBeHidden();
            expect(await foco(page, tela.de), `foco em de (${tipo})`).toBe(false);
            expect(await foco(page, tela.ate), `foco em até (${tipo})`).toBe(false);
          }
        });

        test("visíveis com intervalo, ao carregar e ao trocar o seletor, sem recarregar", async ({ page }) => {
          await page.goto(tela.url("periodo=intervalo&de=2026-01&ate=2026-02"));
          await expect(page.locator(tela.de)).toBeVisible();
          await expect(page.locator(tela.ate)).toBeVisible();
          await expect(page.locator(tela.de)).toHaveValue("2026-01");

          await page.goto(tela.url("periodo=ano"));
          await page.evaluate(() => { (window as unknown as { marca: number }).marca = 1; });
          await page.locator(tela.select).selectOption("intervalo");
          await expect(page.locator(tela.de)).toBeVisible();
          await expect(page.locator(tela.ate)).toBeVisible();
          expect(await foco(page, tela.de)).toBe(true);
          await page.locator(tela.select).selectOption("mes");
          await expect(page.locator(tela.de)).toBeHidden();
          expect(await page.evaluate(() => (window as unknown as { marca?: number }).marca)).toBe(1);
          const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(sobra).toBeLessThanOrEqual(0);
        });

        test("mês posterior a M em campo oculto não impede o envio de um período predefinido", async ({ page }) => {
          for (const tipo of PREDEFINIDOS) {
            await page.goto(tela.url("periodo=intervalo&de=2026-01&ate=2026-02"));
            await page.locator(tela.de).fill("2026-01");
            await page.locator(tela.ate).fill("2026-04");
            await page.locator(tela.select).selectOption(tipo);
            await expect(page.locator(tela.ate)).toBeHidden();
            await page.getByRole("button", { name: tela.enviar }).click();
            await expect(page, tipo).toHaveURL(new RegExp(`periodo=${tipo}`));
            await expect(page.getByRole("alert").filter({ hasText: /intervalo/i }), tipo).toHaveCount(0);
          }
          await page.goto(tela.url("periodo=intervalo&de=2026-01&ate=2026-02"));
          await page.locator(tela.ate).fill("2026-04");
          await page.locator(tela.select).selectOption("ano");
          await page.getByRole("button", { name: tela.enviar }).click();
          await tela.anoExibido(page);
        });

        test("URL predefinida com mês futuro é enviada e exibe o período", async ({ page }) => {
          await page.goto(tela.url("periodo=ano&de=2026-01&ate=2026-04"));
          await expect(page.locator(tela.ate)).toBeHidden();
          await page.getByRole("button", { name: tela.enviar }).click();
          await tela.anoExibido(page);
          await expect(page.getByRole("alert").filter({ hasText: /intervalo/i })).toHaveCount(0);
        });

        test("intervalo posterior a M ou invertido continua recusado pelo servidor; predefinido com datas na URL não", async ({ page }) => {
          await page.goto(tela.url("periodo=ano&de=2026-02&ate=2026-01"));
          await tela.anoExibido(page);
          await expect(page.getByRole("alert").filter({ hasText: /intervalo/i })).toHaveCount(0);

          await page.goto(tela.url("periodo=intervalo&de=2026-02&ate=2026-01"));
          await expect(page.getByRole("alert").filter({ hasText: tela.recusa })).toBeVisible();

          await page.goto(tela.url("periodo=intervalo&de=2026-01&ate=2026-02"));
          await page.locator(tela.ate).fill("2026-04");
          await page.getByRole("button", { name: tela.enviar }).click();
          await expect(page.getByRole("alert").filter({ hasText: tela.recusa })).toBeVisible();
        });
      });
    }
  }
});
