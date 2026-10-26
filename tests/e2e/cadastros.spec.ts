import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { clienteDoUsuario, configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// Cadastro de instituições (ciclo 012, issue #127, BL-009; emenda E-1 do plano): destino em Mais e
// no menu lateral. A aba Classes saiu no ciclo 013 (issue #138): a classe do ativo é um nó da
// taxonomia global, e o antigo ?aba=classes abre Instituições. Usuários e nomes fictícios
// exclusivos deste arquivo (D9 do ciclo 004).

const MOVEL = { width: 360, height: 800 };
const DESKTOP = { width: 1280, height: 900 };
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
// 97 caracteres, para conferir a quebra de linha no celular.
const LONGO = "Corretora fictícia com um nome muito comprido para conferir a quebra de linha na lista do celular";

test.describe("cadastros (#127)", () => {
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

  const lista = (page: Page, nome: string) => page.getByRole("list", { name: nome }).getByRole("listitem");
  const linha = (page: Page, catalogo: string, nome: string) =>
    lista(page, catalogo).filter({ has: page.getByText(nome, { exact: true }) });
  const nomes = async (page: Page, catalogo: string) =>
    (await lista(page, catalogo).locator("p.font-medium").allTextContents()).map((t) => t.trim());

  test("Cadastros fica em Mais no celular e no menu lateral do desktop, só com Instituições", async ({ page }) => {
    await page.setViewportSize(MOVEL);
    await entrar(page, u.dono);
    await page.goto("/ativos");
    await expect(page.getByRole("main").getByRole("link", { name: /Instituições|Classes|Cadastros/ })).toHaveCount(0);
    await page.getByRole("navigation", { name: "Principal" }).getByRole("button", { name: "Mais" }).click();
    const folha = page.getByRole("dialog", { name: "Mais" });
    await expect(folha.getByRole("link")).toHaveText(["Transferências", "Cadastros", "Novidades", "Conta"]);
    await folha.getByRole("link", { name: "Cadastros" }).click();
    await expect(page).toHaveURL(/\/cadastros$/);
    await expect(page.getByRole("heading", { level: 1, name: "Cadastros" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nenhuma instituição cadastrada" })).toBeVisible();
    await expect(page.getByLabel("Nova instituição")).toBeVisible();
    // Sem aba de classes: a classe do ativo é um nó da taxonomia global, escolhido no cadastro do ativo.
    await expect(page.getByRole("navigation", { name: "Tipo de cadastro" })).toHaveCount(0);
    await expect(page.getByLabel("Nova classe")).toHaveCount(0);

    await page.setViewportSize(DESKTOP);
    await page.goto("/");
    const menu = page.getByRole("navigation", { name: "Menu lateral" });
    await menu.getByRole("link", { name: "Cadastros" }).click();
    await expect(page).toHaveURL(/\/cadastros$/);
    await expect(menu.getByRole("link", { name: "Cadastros" })).toHaveAttribute("aria-current", "page");
  });

  test("o endereço antigo ?aba=classes e qualquer outro valor abrem Instituições, sem erro", async ({ page }) => {
    await entrar(page, u.dono);
    for (const rota of ["/cadastros?aba=classes", "/cadastros?aba=qualquer", "/cadastros?aba=classes&aba=instituicoes"]) {
      const resposta = await page.goto(rota);
      expect(resposta!.status(), rota).toBe(200);
      await expect(page.getByRole("heading", { level: 1, name: "Cadastros" })).toBeVisible();
      await expect(page.getByLabel("Nova instituição")).toBeVisible();
      await expect(page.getByLabel("Nova classe")).toHaveCount(0);
      await expect(page.getByRole("list", { name: "Classes" })).toHaveCount(0);
    }
  });

  test("incluir, recusar nome repetido e renomear uma instituição", async ({ page }) => {
    await entrar(page, u.dono);
    await page.goto("/cadastros");
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
    const { data: ativo, error } = await cliente.rpc("cadastrar_ativo_taxonomia", {
      p_nome: "Fundo fictício",
      p_tipo_ajuste: "rendimento",
      p_instituicao: banco,
      p_instituicao_nova: null,
      p_taxonomia: null,
      p_previdencia: null,
      p_liquidez_imediata: null,
      p_exposicao_cambial: null,
      p_isento_ir: null,
    });
    expect(error).toBeNull();
    expect((await cliente.rpc("desativar_ativo", { p_ativo: ativo })).error).toBeNull();

    await entrar(page, u.dono);
    await page.goto("/cadastros");
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
  });

  test("outro usuário não vê as entradas do primeiro", async ({ page }) => {
    await entrar(page, u.outro);
    await page.goto("/cadastros");
    await expect(page.getByRole("heading", { name: "Nenhuma instituição cadastrada" })).toBeVisible();
  });

  test("no celular, nome longo quebra a linha, ações têm 44 px e não há rolagem horizontal", async ({ page }) => {
    expect((await cliente.rpc("criar_instituicao", { p_nome: LONGO })).error).toBeNull();
    await page.setViewportSize(MOVEL);
    await entrar(page, u.dono);
    await page.goto("/cadastros");
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
    test(`sem violações de acessibilidade em Cadastros, inclusive no endereço antigo, em ${tamanho.width} px`, async ({ page }) => {
      await page.setViewportSize(tamanho);
      await entrar(page, u.dono);
      for (const rota of ["/cadastros", "/cadastros?aba=classes"]) {
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
