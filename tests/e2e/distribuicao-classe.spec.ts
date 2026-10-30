import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { prepararCenario } from "./apoio/cenarios";
import { clienteDoUsuario, configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// Distribuição por classe macro no Início (ciclo 013, issue #139; DESIGN.md 2.3, 6.12 e 6.13). O
// cálculo é provado no Vitest contra CR-C01 a CR-C12; aqui, a tela: alternador, oito linhas na
// ordem e nas cores fixas, negativos por ativo, tabela, preservação do período e da visão,
// ocultação, acessibilidade, layout e a classificação atual (P2). Usuários e valores fictícios
// exclusivos deste arquivo.

const MOVEL = { width: 360, height: 800 };
const DESKTOP = { width: 1280, height: 900 };
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const no = (codigo: string) => `a5000000-0000-4000-8000-000000${codigo}`;
const LONGO = "Título fictício de renda fixa com um nome bem comprido para conferir a quebra de linha";

// Apelido, nome, valor do aporte e nó (null = Sem classe). CX recebe 130000 e manda 30000 ao trânsito.
const ATIVOS = [
  ["CX", "Conta fictícia", 130000, no("010100")],
  ["RF", LONGO, 400000, no("020201")],
  ["RV", "Ações fictícias", 300000, no("030101")],
  ["EX", "Carteira fictícia no exterior", 200000, no("040300")],
  ["CT", "Cripto fictício", 50000, no("050202")],
  ["AL", "Ouro fictício", 150000, no("060100")],
  ["SC", "Ativo fictício sem classe", 120000, null],
] as const;
// Linhas esperadas, por saldo decrescente: RF 400000, RV 300000, EX 200000, AL 150000, SC 120000,
// CX 100000, CT 50000 e trânsito 30000; S = 1350000.
const ORDEM = [
  "Renda fixa",
  "Renda variável",
  "Investimentos no exterior",
  "Alternativos, moedas, outros",
  "Sem classe",
  "Caixa e disponibilidades",
  "Criptoativos e ativos digitais",
  "Em trânsito",
];

async function classificar(cliente: SupabaseClient, ativo: string, taxonomia: string | null) {
  const r = await cliente.rpc("editar_detalhes_ativo_taxonomia", {
    p_ativo: ativo,
    p_instituicao: null,
    p_instituicao_nova: null,
    p_taxonomia: taxonomia,
    p_previdencia: null,
    p_liquidez_imediata: null,
    p_exposicao_cambial: null,
    p_isento_ir: null,
  });
  expect(r.error).toBeNull();
}

test.describe("distribuição por classe (#139)", () => {
  test.skip(!configurado, "Roda só com o Supabase local configurado.");
  test.describe.configure({ mode: "serial" });

  let u: Record<string, UsuarioDeTeste>;
  let cliente: SupabaseClient;
  let ids: Record<string, string>;
  test.beforeAll(async () => {
    u = await criarUsuarios("distribuicao139", { comum: "user", vazio: "user" });
    cliente = await clienteDoUsuario(u.comum);
    ids = await prepararCenario(cliente, [
      ...ATIVOS.flatMap(([apelido, nome, valor]) => [
        { criarAtivo: apelido, nome, tipoAjuste: "rendimento" as const },
        { lancar: apelido, data: "2026-03-02", tipo: "aporte", valor },
      ]),
      { criarAtivo: "N", nome: "Ativo fictício negativo", tipoAjuste: "marcacao" },
      { lancar: "N", data: "2026-03-02", tipo: "aporte", valor: 10000 },
      { lancar: "N", data: "2026-03-05", tipo: "marcacao", valor: -30000 },
    ]);
    for (const [apelido, , , taxonomia] of ATIVOS) if (taxonomia) await classificar(cliente, ids[apelido], taxonomia);
    await classificar(cliente, ids.N, no("020000"));
    const transito = (await cliente.from("ativos").select("id").eq("sistema", "transito").single()).data!.id as string;
    expect((await cliente.rpc("transferir", { p_origem: ids.CX, p_destino: transito, p_data: "2026-03-10", p_valor: 30000 })).error).toBeNull();
    const saldos = { ...Object.fromEntries(ATIVOS.map(([a, , v]) => [ids[a], a === "CX" ? v - 30000 : v])), [ids.N]: -20000 };
    expect((await cliente.rpc("fechar_mes", { p_mes: "2026-03-01", p_saldos: saldos })).error).toBeNull();

    // Usuário só com um saldo negativo: sem positivos, sem rosca.
    const vazio = await clienteDoUsuario(u.vazio);
    await prepararCenario(vazio, [
      { criarAtivo: "N", nome: "Único ativo fictício negativo", tipoAjuste: "marcacao" },
      { lancar: "N", data: "2026-03-02", tipo: "aporte", valor: 10000 },
      { lancar: "N", data: "2026-03-05", tipo: "marcacao", valor: -30000 },
      { fechar: "2026-03", saldos: { N: -20000 } },
    ]);
  });
  test.afterAll(async () => {
    if (u) await removerUsuarios(u);
  });

  const alternador = (page: Page) => page.getByRole("navigation", { name: "Distribuição do patrimônio" });
  const figura = (page: Page) => page.getByRole("figure").filter({ hasText: "Distribuição por classe em março de 2026" });
  const legenda = (f: Locator) => f.getByRole("list", { name: "Legenda da distribuição por classe" });
  const participacoes = async (escopo: Locator) => (await escopo.innerText()).match(/\d{1,3},\d{2}%/g) ?? [];

  test("Por instituição é o padrão, também com parâmetro inválido; o alternador leva a Por classe", async ({ page }) => {
    await entrar(page, u.comum);
    await expect(alternador(page).getByRole("link", { name: "Por instituição" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("figure").filter({ hasText: "Distribuição por instituição em março de 2026" })).toBeVisible();
    await expect(figura(page)).toHaveCount(0);

    await page.goto("/?distribuicao=qualquer");
    await expect(alternador(page).getByRole("link", { name: "Por instituição" })).toHaveAttribute("aria-current", "page");

    await alternador(page).getByRole("link", { name: "Por classe" }).click();
    await expect(page).toHaveURL(/distribuicao=classe/);
    await expect(alternador(page).getByRole("link", { name: "Por classe" })).toHaveAttribute("aria-current", "page");
    // Só a visão escolhida é renderizada.
    await expect(page.getByRole("figure").filter({ hasText: "Distribuição por instituição" })).toHaveCount(0);
    await expect(page.getByRole("figure").filter({ hasText: "Distribuição por ativo" })).toHaveCount(0);
    await expect(figura(page)).toBeVisible();
    // Voltar preserva a escolha anterior.
    await page.goBack();
    await expect(alternador(page).getByRole("link", { name: "Por instituição" })).toHaveAttribute("aria-current", "page");

    // A escolha explícita de Por ativo continua valendo.
    await page.goto("/?distribuicao=ativo");
    await expect(alternador(page).getByRole("link", { name: "Por ativo" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("figure").filter({ hasText: "Distribuição por ativo em março de 2026" })).toBeVisible();
  });

  test("oito linhas na ordem e nas cores fixas, negativo por ativo fora da rosca e tabela com as mesmas participações", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.comum);
    await page.goto("/?distribuicao=classe");
    const f = figura(page);
    await expect(f.getByRole("img")).toBeVisible();
    expect(await f.locator('svg path[fill^="var(--color-chart-"]').count()).toBe(8);
    const cores = await f.locator("svg path").evaluateAll((ps) => ps.map((p) => p.getAttribute("fill")));
    expect(cores).toEqual(["2", "3", "4", "7", "5", "1", "6", "8"].map((n) => `var(--color-chart-${n})`));

    const l = legenda(f);
    await expect(l.getByRole("listitem")).toHaveCount(8);
    const nomes = await l.getByRole("listitem").evaluateAll((lis) => lis.map((li) => li.querySelector(".break-words")?.textContent));
    expect(nomes).toEqual(ORDEM);
    // Sem agrupamento residual.
    await expect(l.getByText("Outros", { exact: true })).toHaveCount(0);

    await expect(f.getByText("Saldos negativos, fora da rosca")).toBeVisible();
    await expect(f.getByText("Ativo fictício negativo").filter({ visible: true })).toHaveCount(1);
    await expect(f.getByText("(Renda fixa)").filter({ visible: true })).toHaveCount(1);

    await f.getByText("Ver os números").click();
    const tabela = f.getByRole("table", { name: "Por classe" });
    await expect(tabela.getByRole("row")).toHaveCount(1 + 8 + 1);
    await expect(tabela.getByRole("row", { name: /Ativo fictício negativo/ })).toContainText("fora da rosca");
    const daLegenda = await participacoes(l);
    expect(await participacoes(tabela)).toEqual(daLegenda);
    expect(daLegenda.reduce((s, t) => s + Number(t.replace(/[,%]/g, "")), 0)).toBe(10000);
    // RF = 400000 de 1350000: 29,63% (piso 2962, resto 13,5 mil; a conta exata está nos casos G1).
    await expect(l.getByRole("listitem").first()).toContainText(/29,6\d%/);
  });

  test("o período escolhido é preservado pelo alternador, e a visão pelo formulário de período (R2-2)", async ({ page }) => {
    await entrar(page, u.comum);
    await page.goto("/?periodo=12_meses&distribuicao=classe");
    await expect(alternador(page).getByRole("link", { name: "Por ativo" })).toHaveAttribute("href", /periodo=12_meses.*distribuicao=ativo/);
    await page.getByLabel("Período", { exact: true }).selectOption("mes");
    await page.getByRole("button", { name: "Ver período" }).click();
    await expect(page).toHaveURL(/periodo=mes/);
    await expect(page).toHaveURL(/distribuicao=classe/);
    await expect(figura(page)).toBeVisible();
    await expect(page.getByText("Rentabilidade de março de 2026")).toBeVisible();
  });

  test("Ocultar valores esconde toda quantia da visão por classe, também em atributos; percentuais ficam", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "sf_ocultar_valores", value: "1", url: baseURL! }]);
    await entrar(page, u.comum);
    await page.goto("/?distribuicao=classe");
    const f = figura(page);
    await f.getByText("Ver os números").click();
    const html = await f.evaluate((el) => el.outerHTML);
    expect(html).not.toMatch(/R\$(\s|&nbsp;| )*[−-]?\d/);
    expect(html).toContain("Valor oculto");
    expect(await participacoes(legenda(f))).toHaveLength(8);
    for (const valor of await f.locator("[aria-label], [title]").evaluateAll((els) => els.flatMap((e) => [e.getAttribute("aria-label") ?? "", e.getAttribute("title") ?? ""]))) {
      expect(valor).not.toMatch(/R\$|\d+,\d{2}(?!%)/);
    }
    await context.clearCookies({ name: "sf_ocultar_valores" });
  });

  for (const tamanho of [MOVEL, DESKTOP]) {
    test(`sem violações de acessibilidade nem rolagem horizontal em ${tamanho.width} px, com alvos de 44 px`, async ({ page }) => {
      await page.setViewportSize(tamanho);
      await entrar(page, u.comum);
      await page.goto("/?distribuicao=classe");
      const f = figura(page);
      await f.getByText("Ver os números").click();
      const resultado = await new AxeBuilder({ page }).include("#distribuicao").withTags(WCAG).analyze();
      expect(resultado.violations).toEqual([]);
      const largura = await page.evaluate(() => ({ cliente: document.documentElement.clientWidth, rolagem: document.documentElement.scrollWidth }));
      expect(largura.rolagem).toBeLessThanOrEqual(largura.cliente);
      for (const link of await alternador(page).getByRole("link").all()) expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      // O nome longo quebra a linha no celular, sem reticências.
      const nome = legenda(f).getByText("Renda fixa", { exact: true });
      await expect(nome).toBeVisible();
      // Teclado: o alternador é alcançável e Enter navega.
      await alternador(page).getByRole("link", { name: "Por ativo" }).focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/distribuicao=ativo/);
    });
  }

  test("sem saldo positivo, nada de rosca; o negativo continua listado", async ({ page }) => {
    await entrar(page, u.vazio);
    await page.goto("/?distribuicao=classe");
    const f = figura(page);
    await expect(f.getByText("Não há saldos positivos para exibir.")).toBeVisible();
    await expect(f.getByRole("img")).toHaveCount(0);
    await expect(f.getByRole("listitem").filter({ hasText: "Único ativo fictício negativo" })).toBeVisible();
  });

  test("reclassificar um ativo hoje redistribui a visão de M, sem mudar o patrimônio (P2)", async ({ page }) => {
    await entrar(page, u.comum);
    await page.goto("/?distribuicao=classe");
    const patrimonio = await page.locator("p", { hasText: /^Patrimônio$/ }).locator("..").innerText();
    await classificar(cliente, ids.SC, no("020000"));
    await page.reload();
    const l = legenda(figura(page));
    await expect(l.getByRole("listitem")).toHaveCount(7);
    await expect(l.getByText("Sem classe", { exact: true })).toHaveCount(0);
    // Renda fixa passa a 520000 de 1350000.
    await expect(l.getByRole("listitem").first()).toContainText("Renda fixa");
    await expect(l.getByRole("listitem").first()).toContainText(/38,5\d%/);
    expect(await page.locator("p", { hasText: /^Patrimônio$/ }).locator("..").innerText()).toBe(patrimonio);
  });
});
