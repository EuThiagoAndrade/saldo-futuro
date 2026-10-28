import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { prepararCenario } from "./apoio/cenarios";
import { clienteDoUsuario, configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// Análises por instituição e detalhamento de classes no Início (ciclo 015, issue #154; DESIGN.md
// 6.8, 6.12 e 6.13; KB-004, seção 15). O cálculo é provado no Vitest contra CR-015-01 a CR-015-16;
// aqui, a tela: alternador, rosca e tabela por instituição, Outros, negativos, navegação macro →
// subclasse → tipo por URL, as duas participações, CR-015-06, estados, ocultação, acessibilidade e
// layout. Usuários, nomes e valores fictícios exclusivos deste arquivo.

const MOVEL = { width: 360, height: 800 };
const DESKTOP = { width: 1280, height: 900 };
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const no = (codigo: string) => `a5000000-0000-4000-8000-000000${codigo}`;
const RF = no("020000");
const CREDITO_BANCARIO = no("020200");
const CDB = no("020201");
const PRECOS = /\d{1,3},\d{2}%/g;

async function detalhar(cliente: SupabaseClient, ativo: string, taxonomia: string | null, instituicao: string | null) {
  const r = await cliente.rpc("editar_detalhes_ativo_taxonomia", {
    p_ativo: ativo,
    p_instituicao: instituicao,
    p_instituicao_nova: null,
    p_taxonomia: taxonomia,
    p_previdencia: null,
    p_liquidez_imediata: null,
    p_exposicao_cambial: null,
    p_isento_ir: null,
  });
  expect(r.error).toBeNull();
}

test.describe("análises por instituição e níveis de classe (#154)", () => {
  test.skip(!configurado, "Roda só com o Supabase local configurado.");
  test.describe.configure({ mode: "serial" });

  let u: Record<string, UsuarioDeTeste>;
  let cliente: SupabaseClient;
  test.beforeAll(async () => {
    u = await criarUsuarios("analises154", { comum: "user", seis: "user", vazio: "user" });
    cliente = await clienteDoUsuario(u.comum);
    // Cinco instituições com um ativo cada, um ativo sem instituição e o trânsito: sete grupos, e
    // Outros (Sem instituição e Em trânsito) derivado depois do rateio. S = 1.800.000.
    const instituicoes: Record<string, string> = {};
    for (const nome of ["Banco Um", "Banco Dois", "Banco Três", "Banco Quatro", "Banco Cinco"]) {
      const r = await cliente.rpc("criar_instituicao", { p_nome: nome });
      expect(r.error).toBeNull();
      instituicoes[nome] = r.data as string;
    }
    const ATIVOS = [
      ["A1", "Ativo Um", 500000, CDB, "Banco Um"],
      ["A2", "Ativo Dois", 400000, no("020100"), "Banco Dois"],
      ["A3", "Ativo Três", 300000, no("030101"), "Banco Três"],
      ["A4", "Ativo Quatro", 250000, RF, "Banco Quatro"],
      ["A5", "Ativo Cinco", 200000, no("020202"), "Banco Cinco"],
      ["A6", "Ativo Seis", 150000, CDB, null],
    ] as const;
    const ids = await prepararCenario(cliente, [
      ...ATIVOS.flatMap(([apelido, nome, valor]) => [
        { criarAtivo: apelido, nome, tipoAjuste: "rendimento" as const },
        { lancar: apelido, data: "2026-03-02", tipo: "aporte", valor },
      ]),
      { criarAtivo: "N", nome: "Ativo negativo", tipoAjuste: "marcacao" },
      { lancar: "N", data: "2026-03-02", tipo: "aporte", valor: 10000 },
      { lancar: "N", data: "2026-03-05", tipo: "marcacao", valor: -30000 },
    ]);
    for (const [apelido, , , taxonomia, instituicao] of ATIVOS) await detalhar(cliente, ids[apelido], taxonomia, instituicao ? instituicoes[instituicao] : null);
    await detalhar(cliente, ids.N, CDB, instituicoes["Banco Um"]);
    const transito = (await cliente.from("ativos").select("id").eq("sistema", "transito").single()).data!.id as string;
    expect((await cliente.rpc("transferir", { p_origem: ids.A6, p_destino: transito, p_data: "2026-03-10", p_valor: 30000 })).error).toBeNull();
    const saldos = { ...Object.fromEntries(ATIVOS.map(([a, , v]) => [ids[a], a === "A6" ? v - 30000 : v])), [ids.N]: -20000 };
    expect((await cliente.rpc("fechar_mes", { p_mes: "2026-03-01", p_saldos: saldos })).error).toBeNull();

    // CR-015-06: duas macros com três subclasses de R$ 1,00, na ordem da árvore.
    const seis = await clienteDoUsuario(u.seis);
    const subclasses = [no("020100"), no("020200"), no("020300"), no("030100"), no("030200"), no("030300")];
    const idsSeis = await prepararCenario(seis, [
      ...subclasses.flatMap((_, k) => [
        { criarAtivo: `C${k + 1}`, nome: `Ativo C${k + 1}`, tipoAjuste: "rendimento" as const },
        { lancar: `C${k + 1}`, data: "2026-03-02", tipo: "aporte", valor: 100 },
      ]),
      { fechar: "2026-03", saldos: Object.fromEntries(subclasses.map((_, k) => [`C${k + 1}`, 100])) },
    ]);
    for (const [k, taxonomia] of subclasses.entries()) await detalhar(seis, idsSeis[`C${k + 1}`], taxonomia, null);

    // Só um saldo negativo, na classe CDB e sem instituição: sem positivos em nenhuma visão.
    const vazio = await clienteDoUsuario(u.vazio);
    const idsVazio = await prepararCenario(vazio, [
      { criarAtivo: "N", nome: "Único ativo negativo", tipoAjuste: "marcacao" },
      { lancar: "N", data: "2026-03-02", tipo: "aporte", valor: 10000 },
      { lancar: "N", data: "2026-03-05", tipo: "marcacao", valor: -30000 },
      { fechar: "2026-03", saldos: { N: -20000 } },
    ]);
    await detalhar(vazio, idsVazio.N, CDB, null);
  });
  test.afterAll(async () => {
    if (u) await removerUsuarios(u);
  });

  const alternador = (page: Page) => page.getByRole("navigation", { name: "Distribuição do patrimônio" });
  const figuraInstituicao = (page: Page) => page.getByRole("figure").filter({ hasText: "Distribuição por instituição em março de 2026" });
  const figuraClasse = (page: Page) => page.getByRole("figure").filter({ hasText: "Distribuição por classe em março de 2026" });
  const detalheDe = (page: Page, caminho: string) => page.getByRole("figure").filter({ hasText: `${caminho} em março de 2026` });
  const participacoes = async (escopo: Locator) => (await escopo.innerText()).match(PRECOS) ?? [];
  const soma = (textos: string[]) => textos.reduce((s, t) => s + Number(t.replace(/[,%]/g, "")), 0);
  const linhas = async (tabela: Locator) => (await tabela.getByRole("row").allInnerTexts()).slice(1).map((t) => t.split("\t").map((c) => c.replace(/\s+/g, " ").replace(/ :/g, ":").trim()));

  test("o alternador tem três visões, preserva o período e só a visão escolhida é renderizada", async ({ page }) => {
    await entrar(page, u.comum);
    await page.goto("/?periodo=12_meses&distribuicao=instituicao");
    await expect(alternador(page).getByRole("link")).toHaveText(["Por ativo", "Por classe", "Por instituição"]);
    await expect(alternador(page).getByRole("link", { name: "Por instituição" })).toHaveAttribute("aria-current", "page");
    await expect(alternador(page).getByRole("link", { name: "Por ativo" })).toHaveAttribute("href", /periodo=12_meses.*distribuicao=ativo/);
    await expect(figuraInstituicao(page)).toBeVisible();
    await expect(figuraClasse(page)).toHaveCount(0);
    await expect(page.getByRole("figure").filter({ hasText: "Distribuição por ativo" })).toHaveCount(0);

    // O formulário de período preserva a visão.
    await page.getByLabel("Período", { exact: true }).selectOption("mes");
    await page.getByRole("button", { name: "Ver período" }).click();
    await expect(page).toHaveURL(/periodo=mes/);
    await expect(page).toHaveURL(/distribuicao=instituicao/);
    await expect(figuraInstituicao(page)).toBeVisible();

    // Parâmetro desconhecido abre Por ativo.
    await page.goto("/?distribuicao=qualquer");
    await expect(alternador(page).getByRole("link", { name: "Por ativo" })).toHaveAttribute("aria-current", "page");
  });

  test("por instituição: seis fatias, Outros derivado, componentes identificados, negativo à parte e tabela completa", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.comum);
    await page.goto("/?distribuicao=instituicao");
    const f = figuraInstituicao(page);
    await expect(f.getByRole("img")).toBeVisible();
    expect(await f.locator('svg path[fill^="var(--color-chart-"]').count()).toBe(6);

    const legenda = f.getByRole("list", { name: "Legenda da distribuição por instituição" });
    const nomes = await legenda.locator("> li").evaluateAll((lis) => lis.map((li) => li.querySelector(".break-words")?.textContent));
    expect(nomes).toEqual(["Banco Um", "Banco Dois", "Banco Três", "Banco Quatro", "Banco Cinco", "Outros (2 grupos)"]);
    const principais = await legenda.locator("> li").evaluateAll((lis) => lis.slice(0, 5).map((li) => li.textContent!.match(/\d{1,3},\d{2}%/)![0]));
    // Maior resto com empate pela ordem de desempate (CR-015-02/16): 27,78 / 22,22 / 16,67 / 13,89 / 11,11.
    expect(principais).toEqual(["27,78%", "22,22%", "16,67%", "13,89%", "11,11%"]);

    // Outros soma os componentes, identificados, sem novo rateio: 6,67% + 1,66% = 8,33%.
    await legenda.getByText("Outros", { exact: false }).click();
    const outros = legenda.locator("details");
    await expect(outros.locator("ul > li")).toHaveText([/Sem instituição.*6,67%/s, /Em trânsito.*1,66%/s]);
    expect(await participacoes(outros.locator("summary"))).toEqual(["8,33%"]);
    expect(soma(principais) + 833).toBe(10000);

    // Negativo por ativo, fora da rosca, com a instituição atual.
    await expect(f.getByText("Saldos negativos, fora da rosca")).toBeVisible();
    await expect(f.getByRole("listitem").filter({ hasText: "Ativo negativo" }).filter({ hasText: "(Banco Um)" })).toHaveCount(1);

    // Tabela: os sete grupos e o negativo, sem Outros; as participações são as da legenda.
    await f.getByText("Ver os números").click();
    const tabela = f.getByRole("table", { name: "Por instituição" });
    const l = await linhas(tabela);
    expect(l).toHaveLength(8);
    expect(l.map((r) => r[0])).toEqual(["Banco Um", "Banco Dois", "Banco Três", "Banco Quatro", "Banco Cinco", "Sem instituição", "Em trânsito", "Ativo negativo (Banco Um)"]);
    expect(l.slice(0, 7).map((r) => r[1])).toEqual(["27,78%", "22,22%", "16,67%", "13,89%", "11,11%", "6,67%", "1,66%"]);
    expect(l[7][1]).toBe("fora da rosca");
    await expect(tabela.getByText("Outros")).toHaveCount(0);
    expect(soma(l.slice(0, 7).map((r) => r[1]))).toBe(10000);
  });

  test("por classe: a raiz traz links só nas macros, e o detalhe vai e volta por URL", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.comum);
    await page.goto("/?distribuicao=classe");
    const f = figuraClasse(page);
    const legenda = f.getByRole("list", { name: "Legenda da distribuição por classe" });
    await expect(legenda.getByRole("link")).toHaveText(["Ver subclasses de Renda fixa", "Ver subclasses de Renda variável"]);
    await expect(legenda.getByText("Em trânsito").locator("..")).not.toContainText("Ver subclasses");

    await legenda.getByRole("link", { name: "Ver subclasses de Renda fixa" }).click();
    await expect(page).toHaveURL(new RegExp(`distribuicao=classe.*classe=${RF}`));
    const d = detalheDe(page, "Renda fixa");
    await expect(d).toBeVisible();
    await expect(figuraClasse(page)).toHaveCount(0);
    // O título traz só o caminho e o mês; nada de quantia ou participação do próprio pai.
    expect(await d.locator("figcaption").innerText()).not.toMatch(/\d{1,3},\d{2}%|R\$/);

    const tabela = d.getByRole("table");
    await expect(tabela.getByRole("columnheader")).toHaveText(["Grupo", "Saldo", "% da carteira", "% do pai"]);
    const l = await linhas(tabela);
    // Subclasse com os dois tipos, Dívida soberana e o resíduo de vínculo direto à macro.
    expect(l.map((r) => [r[0], r[2], r[3]])).toEqual([
      ["Crédito bancário (ver tipos)", "45,55%", "55,78%"],
      ["Dívida soberana (ver tipos)", "22,22%", "27,21%"],
      ["Classificado somente neste nível: Renda fixa", "13,89%", "17,01%"],
    ]);
    expect(soma(l.map((r) => r[3]))).toBe(10000);
    // Sem linha do pai, total, rodapé ou resumo numérico.
    await expect(tabela.locator("tfoot")).toHaveCount(0);
    await expect(d.getByText(/total/i)).toHaveCount(0);
    // Negativo do ramo, com o caminho completo.
    await expect(d.getByRole("listitem").filter({ hasText: "Ativo negativo" })).toContainText("(Renda fixa › Crédito bancário › CDB)");

    // Subclasse: dois tipos, sem resíduo, e nenhum link adiante (tipo é terminal).
    await tabela.getByRole("link", { name: /Crédito bancário/ }).click();
    await expect(page).toHaveURL(new RegExp(`classe=${CREDITO_BANCARIO}`));
    const sub = detalheDe(page, "Renda fixa › Crédito bancário");
    const ls = await linhas(sub.getByRole("table"));
    expect(ls.map((r) => [r[0], r[2], r[3]])).toEqual([
      ["CDB", "34,44%", "75,61%"],
      ["RDB", "11,11%", "24,39%"],
    ]);
    await expect(sub.getByRole("table").getByRole("link")).toHaveCount(0);
    await expect(sub.getByText("Ativo negativo")).toBeVisible();

    // Caminho navegável de volta, com o ramo na URL e o histórico do navegador.
    const caminho = page.getByRole("navigation", { name: "Caminho da classe" });
    await expect(caminho.getByRole("link")).toHaveText(["Classes macro", "Renda fixa"]);
    await expect(caminho.locator("[aria-current=page]")).toHaveText("Crédito bancário");
    await page.reload();
    await expect(sub).toBeVisible();
    await page.goBack();
    await expect(detalheDe(page, "Renda fixa")).toBeVisible();
    await caminho.getByRole("link", { name: "Classes macro" }).click();
    await expect(figuraClasse(page)).toBeVisible();
    await expect(page).not.toHaveURL(/classe=a5/);

    // Renda variável não herda o negativo de Renda fixa.
    await page.goto(`/?distribuicao=classe&classe=${no("030000")}`);
    await expect(detalheDe(page, "Renda variável").getByText("Saldos negativos deste grupo")).toHaveCount(0);
  });

  test("o período e a visão sobrevivem ao detalhe; trocar de visão abandona o ramo", async ({ page }) => {
    await entrar(page, u.comum);
    await page.goto(`/?periodo=12_meses&distribuicao=classe&classe=${RF}`);
    const d = detalheDe(page, "Renda fixa");
    await expect(d).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Caminho da classe" }).getByRole("link", { name: "Classes macro" })).toHaveAttribute("href", /periodo=12_meses.*distribuicao=classe/);
    await page.getByLabel("Período", { exact: true }).selectOption("mes");
    await page.getByRole("button", { name: "Ver período" }).click();
    await expect(page).toHaveURL(/periodo=mes/);
    await expect(page).toHaveURL(new RegExp(`classe=${RF}`));
    await expect(d).toBeVisible();
    await alternador(page).getByRole("link", { name: "Por instituição" }).click();
    await expect(page).toHaveURL(/distribuicao=instituicao/);
    await expect(page).not.toHaveURL(/classe=/);
    await alternador(page).getByRole("link", { name: "Por classe" }).click();
    await expect(figuraClasse(page)).toBeVisible();
  });

  test("ramo inválido, terminal ou de outro tipo volta à raiz com aviso, sem zero fictício", async ({ page }) => {
    await entrar(page, u.comum);
    for (const pedido of ["nao-e-um-uuid", "00000000-0000-4000-8000-0000000000ff", CDB]) {
      await page.goto(`/?distribuicao=classe&classe=${pedido}`);
      await expect(page.getByRole("status").filter({ hasText: "A classe pedida não existe ou não tem detalhamento." })).toBeVisible();
      await expect(figuraClasse(page)).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Caminho da classe" })).toHaveCount(0);
    }
    // O parâmetro de ramo é ignorado nas outras visões.
    await page.goto(`/?distribuicao=instituicao&classe=${RF}`);
    await expect(figuraInstituicao(page)).toBeVisible();
  });

  test("CR-015-06: os três filhos de cada macro, com as duas participações, sem linha do pai nem total", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.seis);
    await page.goto("/?distribuicao=classe");
    const legenda = figuraClasse(page).getByRole("list", { name: "Legenda da distribuição por classe" });
    await expect(legenda.getByRole("listitem").nth(0)).toContainText("50,00%");
    await expect(legenda.getByRole("listitem").nth(1)).toContainText("50,00%");

    for (const [macro, caminho, esperado] of [
      [RF, "Renda fixa", [["Dívida soberana", "16,67%", "33,34%"], ["Crédito bancário", "16,67%", "33,33%"], ["Crédito corporativo", "16,67%", "33,33%"]]],
      [no("030000"), "Renda variável", [["Participações em empresas", "16,67%", "33,34%"], ["Imóveis de renda", "16,66%", "33,33%"], ["Desenvolvimento imobiliário", "16,66%", "33,33%"]]],
    ] as const) {
      await page.goto(`/?distribuicao=classe&classe=${macro}`);
      const d = detalheDe(page, caminho);
      const tabela = d.getByRole("table");
      const l = await linhas(tabela);
      expect(l.map((r) => [r[0].replace(" (ver tipos)", ""), r[2], r[3]])).toEqual(esperado);
      expect(l).toHaveLength(3);
      expect(soma(l.map((r) => r[3]))).toBe(10000);
      // Sem pai nem total: nenhuma linha de 50,00% ou soma de percentuais da carteira, nem 100,00%.
      const textoDoDetalhe = await d.innerText();
      expect(textoDoDetalhe).not.toContain("50,00%");
      expect(textoDoDetalhe).not.toContain("100,00%");
      expect(textoDoDetalhe).not.toMatch(/50,0[1-9]%|49,9\d%/);
    }
    // Ao voltar à raiz, o pai continua com 50,00%.
    await page.goto("/?distribuicao=classe");
    await expect(legenda.getByRole("listitem").nth(0)).toContainText("50,00%");
  });

  test("Ocultar valores esconde toda quantia das novas visões, também em atributos; participações ficam", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "sf_ocultar_valores", value: "1", url: baseURL! }]);
    await entrar(page, u.comum);
    for (const rota of ["/?distribuicao=instituicao", `/?distribuicao=classe&classe=${RF}`, `/?distribuicao=classe&classe=${CREDITO_BANCARIO}`]) {
      await page.goto(rota);
      const f = page.locator("#distribuicao");
      const abrir = f.getByText("Ver os números");
      if (await abrir.count()) await abrir.click();
      const html = await f.evaluate((el) => el.outerHTML);
      expect(html, rota).not.toMatch(/R\$(\s|&nbsp;| )*[−-]?\d/);
      expect(html, rota).toContain("Valor oculto");
      expect((await participacoes(f)).length, rota).toBeGreaterThan(0);
      for (const valor of await f.locator("[aria-label], [title]").evaluateAll((els) => els.flatMap((e) => [e.getAttribute("aria-label") ?? "", e.getAttribute("title") ?? ""]))) {
        expect(valor, rota).not.toMatch(/R\$|\d+,\d{2}(?!%)/);
      }
    }
    await context.clearCookies({ name: "sf_ocultar_valores" });
  });

  test("sem saldo positivo, nada de rosca nem participação; o negativo continua listado nas três visões", async ({ page }) => {
    await entrar(page, u.vazio);
    await page.goto("/?distribuicao=instituicao");
    const f = figuraInstituicao(page);
    await expect(f.getByText("Não há saldos positivos para exibir.")).toBeVisible();
    await expect(f.getByRole("img")).toHaveCount(0);
    await expect(f.getByRole("listitem").filter({ hasText: "Único ativo negativo" })).toBeVisible();
    await page.goto("/?distribuicao=classe");
    await expect(figuraClasse(page).getByText("Não há saldos positivos para exibir.")).toBeVisible();
  });

  test("pai sem positivos mostra o estado vazio, sem percentuais, e mantém o negativo do ramo", async ({ page }) => {
    await entrar(page, u.vazio);
    await page.goto(`/?distribuicao=classe&classe=${RF}`);
    const d = detalheDe(page, "Renda fixa");
    await expect(d.getByText("Não há saldos positivos neste grupo em março de 2026.")).toBeVisible();
    await expect(d.getByRole("table")).toHaveCount(0);
    expect(await participacoes(d)).toEqual([]);
    await expect(d.getByRole("listitem").filter({ hasText: "Único ativo negativo" })).toContainText("(Renda fixa › Crédito bancário › CDB)");
    // Um pai sem nenhum ativo na carteira também fica vazio, nunca com zero fictício.
    await page.goto(`/?distribuicao=classe&classe=${no("050000")}`);
    const cripto = detalheDe(page, "Criptoativos e ativos digitais");
    await expect(cripto.getByText("Não há saldos positivos neste grupo em março de 2026.")).toBeVisible();
    expect(await participacoes(cripto)).toEqual([]);
  });

  for (const tamanho of [MOVEL, DESKTOP]) {
    test(`sem violações de acessibilidade nem rolagem horizontal em ${tamanho.width} px, com alvos de 44 px e teclado`, async ({ page }) => {
      await page.setViewportSize(tamanho);
      await entrar(page, u.comum);
      for (const rota of ["/?distribuicao=instituicao", "/?distribuicao=classe", `/?distribuicao=classe&classe=${RF}`, `/?distribuicao=classe&classe=${CREDITO_BANCARIO}`]) {
        await page.goto(rota);
        const abrir = page.locator("#distribuicao").getByText("Ver os números");
        if (await abrir.count()) await abrir.click();
        const resultado = await new AxeBuilder({ page }).include("#distribuicao").withTags(WCAG).analyze();
        expect(resultado.violations, rota).toEqual([]);
        const largura = await page.evaluate(() => ({ cliente: document.documentElement.clientWidth, rolagem: document.documentElement.scrollWidth }));
        expect(largura.rolagem, rota).toBeLessThanOrEqual(largura.cliente);
        for (const link of await page.locator("#distribuicao").getByRole("link").all()) {
          if (await link.isVisible()) expect((await link.boundingBox())!.height, `${rota} ${await link.innerText()}`).toBeGreaterThanOrEqual(44);
        }
      }
      // Teclado: o link da legenda é alcançável e Enter abre o detalhe.
      await page.goto("/?distribuicao=classe");
      await page.getByRole("link", { name: "Ver subclasses de Renda fixa" }).focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`classe=${RF}`));
      // Os nomes longos quebram a linha e o cartão do celular mostra as três informações de cada grupo.
      if (tamanho.width === MOVEL.width) {
        const cartoes = detalheDe(page, "Renda fixa").getByRole("list", { name: "Grupos de Renda fixa" });
        await expect(cartoes.getByRole("listitem")).toHaveCount(3);
        await expect(cartoes.getByRole("listitem").first()).toContainText(/Saldo[\s\S]*% da carteira[\s\S]*% do pai/);
        await expect(detalheDe(page, "Renda fixa").getByRole("table")).toBeHidden();
      }
    });
  }
});
