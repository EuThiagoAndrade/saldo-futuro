import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { clienteDoUsuario, configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// Telas de Instituições e Classes (ciclo 012, issue #127, BL-009). Usuários e nomes fictícios
// exclusivos deste arquivo (D9 do ciclo 004).

const MOVEL = { width: 360, height: 800 };
const DESKTOP = { width: 1280, height: 900 };
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const CLASSES_INICIAIS = ["Cripto", "Fundos", "Outros", "Renda fixa", "Renda variável"];
// 97 caracteres, para conferir a quebra de linha no celular.
const LONGO = "Corretora fictícia com um nome muito comprido para conferir a quebra de linha na lista do celular";

test.describe("instituições e classes (#127)", () => {
  test.skip(!configurado, "Roda só com o Supabase local configurado.");
  test.describe.configure({ mode: "serial" });

  let u: Record<string, UsuarioDeTeste>;
  let cliente: SupabaseClient;
  test.beforeAll(async () => {
    u = await criarUsuarios("catalogos127", { dono: "user", outro: "user" });
    cliente = await clienteDoUsuario(u.dono);
  });
  test.afterAll(async () => {
    if (u) await removerUsuarios(u);
  });

  const lista = (page: Page, nome: string) => page.getByRole("region", { name: nome }).getByRole("listitem");
  const linha = (page: Page, catalogo: string, nome: string) =>
    lista(page, catalogo).filter({ has: page.getByText(nome, { exact: true }) });
  const nomes = async (page: Page, catalogo: string) =>
    (await lista(page, catalogo).locator("p.font-medium").allTextContents()).map((t) => t.trim());

  test("Ativos leva às duas telas, e cada uma volta para Ativos", async ({ page }) => {
    await entrar(page, u.dono);
    await page.goto("/ativos");
    await page.getByRole("main").getByRole("link", { name: "Instituições" }).click();
    await expect(page).toHaveURL(/\/ativos\/instituicoes$/);
    await expect(page.getByRole("heading", { level: 1, name: "Instituições" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nenhuma instituição cadastrada" })).toBeVisible();
    await page.getByRole("link", { name: "Voltar para Ativos" }).click();
    await expect(page).toHaveURL(/\/ativos$/);
    await page.getByRole("main").getByRole("link", { name: "Classes" }).click();
    await expect(page).toHaveURL(/\/ativos\/classes$/);
    await expect(page.getByRole("heading", { level: 1, name: "Classes" })).toBeVisible();
  });

  test("as classes iniciais aparecem em ordem alfabética, sem ativos", async ({ page }) => {
    await entrar(page, u.dono);
    await page.goto("/ativos/classes");
    expect(await nomes(page, "Classes")).toEqual(CLASSES_INICIAIS);
    for (const nome of CLASSES_INICIAIS) await expect(linha(page, "Classes", nome)).toContainText("Sem ativos");
  });

  test("incluir, recusar nome repetido e renomear uma instituição", async ({ page }) => {
    await entrar(page, u.dono);
    await page.goto("/ativos/instituicoes");
    const campo = page.getByLabel("Nova instituição");
    await campo.fill("Banco Exemplo");
    await page.getByRole("button", { name: "Incluir instituição" }).click();
    await expect(page.getByRole("main").getByRole("status")).toHaveText("Instituição incluída.");
    await expect(linha(page, "Instituições", "Banco Exemplo")).toContainText("Sem ativos");

    // Mesma identidade (caixa e espaços nas pontas): recusada pelo banco, sem gravar.
    await campo.fill("  banco exemplo ");
    await page.getByRole("button", { name: "Incluir instituição" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("Esse nome já está cadastrado.");
    expect((await cliente.from("instituicoes").select("nome")).data).toEqual([{ nome: "Banco Exemplo" }]);

    // Só espaços: recusado antes do banco.
    await campo.fill("   ");
    await page.getByRole("button", { name: "Incluir instituição" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("Informe o nome.");

    await campo.fill("Corretora Fictícia");
    await page.getByRole("button", { name: "Incluir instituição" }).click();
    await expect(linha(page, "Instituições", "Corretora Fictícia")).toBeVisible();

    // Renomear: Esc cancela sem enviar; nome de outra entrada é recusado; o novo nome volta à lista.
    await linha(page, "Instituições", "Corretora Fictícia").getByRole("button", { name: "Renomear Corretora Fictícia" }).click();
    const novo = page.getByLabel("Novo nome de Corretora Fictícia");
    await expect(novo).toBeFocused();
    await expect(novo).toHaveValue("Corretora Fictícia");
    await novo.press("Escape");
    await expect(novo).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Renomear Corretora Fictícia" })).toBeFocused();

    await page.getByRole("button", { name: "Renomear Corretora Fictícia" }).click();
    await novo.fill("BANCO EXEMPLO");
    await page.getByRole("button", { name: "Salvar nome" }).click();
    await expect(linha(page, "Instituições", "Corretora Fictícia").getByRole("alert")).toHaveText("Esse nome já está cadastrado.");
    await novo.fill("Corretora Exemplo");
    await page.getByRole("button", { name: "Salvar nome" }).click();
    await expect(linha(page, "Instituições", "Corretora Exemplo")).toBeVisible();
    await expect(page.getByText("Corretora Fictícia", { exact: true })).toHaveCount(0);
    expect(await nomes(page, "Instituições")).toEqual(["Banco Exemplo", "Corretora Exemplo"]);
  });

  test("excluir: bloqueado com explicação quando há ativo, mesmo desativado; permitido sem uso", async ({ page }) => {
    const { data: inst } = await cliente.from("instituicoes").select("id, nome");
    const banco = inst!.find((i) => i.nome === "Banco Exemplo")!.id;
    const { data: classes } = await cliente.from("classes_ativo").select("id, nome");
    const fundos = classes!.find((c) => c.nome === "Fundos")!.id;
    const { data: ativo, error } = await cliente.rpc("cadastrar_ativo", {
      p_nome: "Fundo fictício",
      p_tipo_ajuste: "rendimento",
      p_instituicao: banco,
      p_instituicao_nova: null,
      p_classe: fundos,
      p_classe_nova: null,
      p_previdencia: null,
      p_liquidez_imediata: null,
      p_exposicao_cambial: null,
      p_isento_ir: null,
    });
    expect(error).toBeNull();
    expect((await cliente.rpc("desativar_ativo", { p_ativo: ativo })).error).toBeNull();

    await entrar(page, u.dono);
    await page.goto("/ativos/instituicoes");
    const usada = linha(page, "Instituições", "Banco Exemplo");
    await expect(usada).toContainText("Usada em 1 ativo");
    await expect(usada.getByRole("button", { name: "Excluir" })).toBeDisabled();
    await expect(usada.getByRole("button", { name: "Excluir" })).toHaveAccessibleDescription("Tire dos ativos antes de excluir.");

    const livre = linha(page, "Instituições", "Corretora Exemplo");
    await livre.getByRole("button", { name: "Excluir" }).click();
    const dialogo = page.getByRole("dialog", { name: "Excluir Corretora Exemplo" });
    await expect(dialogo.getByRole("button", { name: "Cancelar" })).toBeFocused();
    await dialogo.getByRole("button", { name: "Excluir instituição" }).click();
    await expect(page.getByText("Corretora Exemplo", { exact: true })).toHaveCount(0);
    expect((await cliente.from("instituicoes").select("nome")).data).toEqual([{ nome: "Banco Exemplo" }]);

    await page.goto("/ativos/classes");
    await expect(linha(page, "Classes", "Fundos").getByRole("button", { name: "Excluir" })).toBeDisabled();
    await linha(page, "Classes", "Cripto").getByRole("button", { name: "Excluir" }).click();
    await page.getByRole("dialog", { name: "Excluir Cripto" }).getByRole("button", { name: "Excluir classe" }).click();
    await expect(page.getByText("Cripto", { exact: true })).toHaveCount(0);
  });

  test("outro usuário não vê as entradas do primeiro", async ({ page }) => {
    await entrar(page, u.outro);
    await page.goto("/ativos/instituicoes");
    await expect(page.getByRole("heading", { name: "Nenhuma instituição cadastrada" })).toBeVisible();
    await page.goto("/ativos/classes");
    expect(await nomes(page, "Classes")).toEqual(CLASSES_INICIAIS);
  });

  test("no celular, nome longo quebra a linha, ações têm 44 px e não há rolagem horizontal", async ({ page }) => {
    expect((await cliente.rpc("criar_instituicao", { p_nome: LONGO })).error).toBeNull();
    await page.setViewportSize(MOVEL);
    await entrar(page, u.dono);
    await page.goto("/ativos/instituicoes");
    const nome = page.getByText(LONGO, { exact: true });
    const medida = await nome.evaluate((el) => ({
      cabe: el.scrollWidth <= el.clientWidth,
      altura: el.getBoundingClientRect().height,
      linha: parseFloat(getComputedStyle(el).lineHeight),
    }));
    expect(medida.cabe).toBe(true);
    expect(medida.altura).toBeGreaterThan(medida.linha);
    for (const botao of await page.getByRole("main").getByRole("button").all()) {
      expect((await botao.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    await linha(page, "Instituições", LONGO).getByRole("button", { name: `Renomear ${LONGO}` }).click();
    await expect(page.getByLabel(`Novo nome de ${LONGO}`)).toBeVisible();
    const largura = await page.evaluate(() => ({ cliente: document.documentElement.clientWidth, rolagem: document.documentElement.scrollWidth }));
    expect(largura.rolagem).toBeLessThanOrEqual(largura.cliente);
  });

  for (const tamanho of [MOVEL, DESKTOP]) {
    test(`sem violações de acessibilidade nas duas telas em ${tamanho.width} px`, async ({ page }) => {
      await page.setViewportSize(tamanho);
      await entrar(page, u.dono);
      for (const rota of ["/ativos", "/ativos/instituicoes", "/ativos/classes"]) {
        await page.goto(rota);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        const resultado = await new AxeBuilder({ page }).withTags(WCAG).analyze();
        expect(resultado.violations, rota).toEqual([]);
        const largura = await page.evaluate(() => ({ cliente: document.documentElement.clientWidth, rolagem: document.documentElement.scrollWidth }));
        expect(largura.rolagem, rota).toBeLessThanOrEqual(largura.cliente);
      }
    });
  }
});
