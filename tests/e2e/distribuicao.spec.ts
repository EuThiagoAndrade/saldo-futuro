import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { prepararCenario } from "./apoio/cenarios";
import { clienteDoUsuario, configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// Distribuição por ativo em rosca no Início (#107, BL-005; DESIGN.md 6.13). O cálculo é provado
// no Vitest contra CR-53 a CR-61; aqui, a tela: legenda, Outros, negativos, tabelas, ocultação,
// acessibilidade e layout. Usuário e valores fictícios exclusivos deste arquivo.

const MOVEL = { width: 360, height: 800 };
const DESKTOP = { width: 1280, height: 900 };
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const LONGO = "Fundo fictício de renda fixa com um nome bem comprido para conferir a quebra de linha na legenda";
const POSITIVOS = [
  ["A", LONGO, 500000],
  ["B", "Ativo fictício B", 400000],
  ["C", "Ativo fictício C", 300000],
  ["D", "Ativo fictício D", 200000],
  ["E", "Ativo fictício E", 100000],
  ["F", "Ativo fictício F", 50000],
  ["G", "Ativo fictício G", 25000],
] as const;

test.describe("distribuição em rosca (#107)", () => {
  test.skip(!configurado, "Roda só com o Supabase local configurado.");
  test.describe.configure({ mode: "serial" });

  let u: Record<string, UsuarioDeTeste>;
  test.beforeAll(async () => {
    u = await criarUsuarios("distribuicao107", { comum: "user" });
    const cliente = await clienteDoUsuario(u.comum);
    await prepararCenario(cliente, [
      ...POSITIVOS.flatMap(([apelido, nome, valor]) => [
        { criarAtivo: apelido, nome, tipoAjuste: "rendimento" as const },
        { lancar: apelido, data: "2026-03-02", tipo: "aporte", valor },
      ]),
      { criarAtivo: "N", nome: "Ativo fictício negativo", tipoAjuste: "marcacao" },
      { lancar: "N", data: "2026-03-02", tipo: "aporte", valor: 10000 },
      { lancar: "N", data: "2026-03-05", tipo: "marcacao", valor: -30000 },
      { criarAtivo: "Z", nome: "Ativo fictício zerado", tipoAjuste: "rendimento" },
      { lancar: "Z", data: "2026-03-02", tipo: "aporte", valor: 10000 },
      { lancar: "Z", data: "2026-03-05", tipo: "resgate", valor: -10000 },
      { fechar: "2026-03", saldos: { ...Object.fromEntries(POSITIVOS.map(([a, , v]) => [a, v])), N: -20000, Z: 0 } },
    ]);
  });
  test.afterAll(async () => {
    if (u) await removerUsuarios(u);
  });

  const figura = (page: Page) => page.getByRole("figure").filter({ hasText: "Distribuição por ativo em março de 2026" });
  const legenda = (f: Locator) => f.getByRole("list", { name: "Legenda da distribuição" });
  const participacoes = async (escopo: Locator) => (await escopo.innerText()).match(/\d{1,3},\d{2}%/g) ?? [];

  test("cinco fatias e Outros, nomes inteiros, negativos fora da rosca e tabelas com as mesmas participações", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.comum);
    await page.goto("/?distribuicao=ativo");
    const f = figura(page);
    await expect(f.getByRole("img")).toBeVisible();
    expect(await f.locator('svg path[fill^="var(--color-chart-"]').count()).toBe(6);

    const l = legenda(f);
    await expect(l.getByText(LONGO, { exact: true })).toBeVisible();
    await expect(l.getByText("Ativo fictício F")).toBeHidden();
    await l.getByText("Outros").click();
    await expect(l.getByText("Ativo fictício F")).toBeVisible();
    await expect(l.getByText("Ativo fictício G")).toBeVisible();

    // O nome também está nas tabelas, ainda fechadas em "Ver os números": confere a lista visível.
    await expect(f.getByText("Saldos negativos, fora da rosca")).toBeVisible();
    await expect(f.getByText("Ativo fictício negativo").filter({ visible: true })).toHaveCount(1);
    await expect(f.getByText("Ativo fictício zerado")).toHaveCount(0);

    await f.getByText("Ver os números").click();
    const resumo = f.getByRole("table", { name: "Resumo" });
    const detalhe = f.getByRole("table", { name: "Detalhe por ativo" });
    await expect(resumo.getByRole("rowheader", { name: "Outros", exact: true })).toBeVisible();
    await expect(detalhe.getByRole("rowheader", { name: "Outros", exact: true })).toHaveCount(0);
    await expect(resumo.getByRole("rowheader", { name: "Ativo fictício F" })).toHaveCount(0);
    // Cada posição aparece uma vez no detalhe: sete positivos e o negativo.
    await expect(detalhe.getByRole("row")).toHaveCount(1 + POSITIVOS.length + 1);
    await expect(detalhe.getByRole("row", { name: /Ativo fictício negativo/ })).toContainText("fora da rosca");

    // A legenda (cinco principais, Outros e componentes) usa os mesmos percentuais das tabelas.
    const daLegenda = await participacoes(l);
    const doDetalhe = await participacoes(detalhe);
    const doResumo = await participacoes(resumo);
    expect([...daLegenda].sort()).toEqual([...doResumo, ...doDetalhe.slice(5)].sort());
    const centesimos = (t: string) => Number(t.replace(/[,%]/g, ""));
    expect(doDetalhe.reduce((s, t) => s + centesimos(t), 0)).toBe(10000);
  });

  test("Ocultar valores esconde toda quantia da distribuição, também em textos e atributos; percentuais ficam", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "sf_ocultar_valores", value: "1", url: baseURL! }]);
    await entrar(page, u.comum);
    await page.goto("/?distribuicao=ativo");
    const f = figura(page);
    await f.getByText("Ver os números").click();
    await legenda(f).getByText("Outros").click();
    const html = await f.evaluate((el) => el.outerHTML);
    expect(html).not.toMatch(/R\$(\s|&nbsp;| )*[−-]?\d/);
    expect(html).toContain("Valor oculto");
    expect(await participacoes(legenda(f))).not.toHaveLength(0);
    for (const valor of await f.locator("[aria-label], [title]").evaluateAll((els) => els.flatMap((e) => [e.getAttribute("aria-label") ?? "", e.getAttribute("title") ?? ""]))) {
      expect(valor).not.toMatch(/R\$|\d+,\d{2}(?!%)/);
    }
  });

  for (const tamanho of [MOVEL, DESKTOP]) {
    test(`sem violações de acessibilidade nem rolagem horizontal em ${tamanho.width} px`, async ({ page }) => {
      await page.setViewportSize(tamanho);
      await entrar(page, u.comum);
      await page.goto("/?distribuicao=ativo");
      const f = figura(page);
      await legenda(f).getByText("Outros").click();
      await f.getByText("Ver os números").click();
      const resultado = await new AxeBuilder({ page }).include("figure").withTags(WCAG).analyze();
      expect(resultado.violations).toEqual([]);
      const largura = await page.evaluate(() => ({ cliente: document.documentElement.clientWidth, rolagem: document.documentElement.scrollWidth }));
      expect(largura.rolagem).toBeLessThanOrEqual(largura.cliente);
      // O nome longo quebra a linha na legenda, sem reticências.
      const nome = legenda(f).getByText(LONGO, { exact: true });
      const medida = await nome.evaluate((el) => ({ altura: el.getBoundingClientRect().height, linha: parseFloat(getComputedStyle(el).lineHeight), corte: getComputedStyle(el).textOverflow }));
      expect(medida.corte).not.toBe("ellipsis");
      if (tamanho.width === MOVEL.width) expect(medida.altura).toBeGreaterThan(medida.linha);
      const resumo = legenda(f).locator("summary");
      expect((await resumo.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    });
  }
});
