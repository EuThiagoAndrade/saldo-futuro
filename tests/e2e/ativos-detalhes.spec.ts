import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { clienteDoUsuario, configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// Classe, instituição e indicadores do ativo (ciclo 012, issue #128, BL-009): cadastro com seletor
// que cadastra ali mesmo, "Mais detalhes", edição (inclusive de desativado) e exibição nas duas
// abas. Usuários e nomes fictícios exclusivos deste arquivo (D9 do ciclo 004).

const MOVEL = { width: 360, height: 800 };
const DESKTOP = { width: 1280, height: 900 };
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test.describe("detalhes dos ativos (#128)", () => {
  test.skip(!configurado, "Roda só com o Supabase local configurado.");
  test.describe.configure({ mode: "serial" });

  let u: Record<string, UsuarioDeTeste>;
  let cliente: SupabaseClient;
  let banco: string;
  test.beforeAll(async () => {
    u = await criarUsuarios("detalhes128", { dono: "user", outro: "user" });
    cliente = await clienteDoUsuario(u.dono);
    const criada = await cliente.rpc("criar_instituicao", { p_nome: "Banco Exemplo" });
    expect(criada.error).toBeNull();
    banco = criada.data as string;
    // Desde a taxonomia global (ciclo 013) o perfil novo não recebe classes: o preparo cria as do legado.
    for (const nome of ["Renda fixa", "Fundos"]) expect((await cliente.rpc("criar_classe", { p_nome: nome })).error).toBeNull();
  });
  test.afterAll(async () => {
    if (u) await removerUsuarios(u);
  });

  const lerAtivo = async (nome: string) =>
    (await cliente.from("ativos").select("id, classe_id, instituicao_id, previdencia, liquidez_imediata, exposicao_cambial, isento_ir").eq("nome", nome).single()).data!;
  const idDaClasse = async (nome: string) => (await cliente.from("classes_ativo").select("id").eq("nome", nome).single()).data!.id as string;
  const opcao = (page: Page, nome: string) => page.getByRole("listbox").getByRole("option", { name: nome, exact: true });
  const radio = (page: Page, indicador: string, valor: "Sim" | "Não" | "Não informado") =>
    page.getByRole("group", { name: indicador }).getByRole("radio", { name: valor, exact: true });

  async function preencherBase(page: Page, nome: string) {
    await page.goto("/ativos/novo");
    await page.getByLabel("Nome", { exact: true }).fill(nome);
    await page.getByLabel("Rendimento (renda fixa, poupança)").check();
  }

  test("cadastro com classe e instituição existentes, sem abrir Mais detalhes", async ({ page }) => {
    await entrar(page, u.dono);
    await preencherBase(page, "CDB fictício");
    await expect(radio(page, "Previdência", "Não informado")).toBeHidden();
    const classe = page.getByRole("combobox", { name: "Classe" });
    await classe.fill("renda f");
    await opcao(page, "Renda fixa").click();
    // Teclado: digitar filtra, Enter confirma a opção destacada.
    const instituicao = page.getByRole("combobox", { name: "Instituição" });
    await instituicao.fill("banco");
    await instituicao.press("Enter");
    await expect(instituicao).toHaveValue("Banco Exemplo");
    await page.getByRole("button", { name: "Cadastrar ativo" }).click();
    await expect(page).toHaveURL(/\/ativos$/);
    const ativo = await lerAtivo("CDB fictício");
    expect(ativo.classe_id).toBe(await idDaClasse("Renda fixa"));
    expect(ativo.instituicao_id).toBe(banco);
    expect([ativo.previdencia, ativo.liquidez_imediata, ativo.exposicao_cambial, ativo.isento_ir]).toEqual([null, null, null, null]);
  });

  test("cadastro que cria a instituição ali mesmo e marca indicadores em três estados", async ({ page }) => {
    await entrar(page, u.dono);
    await preencherBase(page, "Previdência fictícia");
    const instituicao = page.getByRole("combobox", { name: "Instituição" });
    // " banco exemplo " tem a mesma identidade de "Banco Exemplo": não oferece cadastro.
    await instituicao.fill(" banco exemplo ");
    await expect(page.getByRole("listbox").getByRole("option", { name: /^Cadastrar/ })).toHaveCount(0);
    await instituicao.fill("Corretora Fictícia");
    await opcao(page, "Cadastrar «Corretora Fictícia»").click();
    await expect(instituicao).toHaveValue("Corretora Fictícia");
    // Desistir não cria nada: a entrada só nasce com o envio do ativo.
    expect((await cliente.from("instituicoes").select("nome").eq("nome", "Corretora Fictícia")).data).toEqual([]);

    await page.getByText("Mais detalhes", { exact: true }).click();
    await expect(page.getByText("Anotação sua. O Saldo Futuro não calcula nada com estes campos.")).toBeVisible();
    await expect(radio(page, "Previdência", "Não informado")).toBeChecked();
    await radio(page, "Previdência", "Sim").check();
    await radio(page, "Isento de IR", "Não").check();
    await page.getByRole("button", { name: "Cadastrar ativo" }).click();
    await expect(page).toHaveURL(/\/ativos$/);

    const ativo = await lerAtivo("Previdência fictícia");
    const criada = (await cliente.from("instituicoes").select("id").eq("nome", "Corretora Fictícia").single()).data!;
    expect(ativo.instituicao_id).toBe(criada.id);
    expect(ativo.classe_id).toBeNull();
    expect([ativo.previdencia, ativo.liquidez_imediata, ativo.exposicao_cambial, ativo.isento_ir]).toEqual([true, null, null, false]);
  });

  test("texto fora da lista sem confirmar impede o envio, e o cadastro sem detalhes continua possível", async ({ page }) => {
    await entrar(page, u.dono);
    await preencherBase(page, "Poupança fictícia");
    const classe = page.getByRole("combobox", { name: "Classe" });
    await classe.fill("Classe sem confirmar");
    await classe.press("Escape");
    await page.getByRole("button", { name: "Cadastrar ativo" }).click();
    await expect(page.getByText("Escolha uma classe da lista ou cadastre uma nova.")).toBeVisible();
    await expect(page).toHaveURL(/\/ativos\/novo$/);
    // Apagar o texto abre a lista inteira; Esc a fecha antes do envio.
    await classe.fill("");
    await classe.press("Escape");
    await page.getByRole("button", { name: "Cadastrar ativo" }).click();
    await expect(page).toHaveURL(/\/ativos$/);
    const ativo = await lerAtivo("Poupança fictícia");
    expect([ativo.classe_id, ativo.instituicao_id]).toEqual([null, null]);
  });

  test("editar um ativo em uso: Mais detalhes abre com o que foi informado, e limpar a classe grava não informado", async ({ page }) => {
    const { id } = await lerAtivo("Previdência fictícia");
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.dono);
    await page.goto("/ativos");
    await page.getByRole("row").filter({ hasText: "Previdência fictícia" }).getByRole("link", { name: "Editar Previdência fictícia" }).click();
    await expect(page).toHaveURL(new RegExp(`/ativos/${id}/editar$`));
    await expect(page.getByRole("heading", { level: 1, name: "Editar ativo" })).toBeVisible();
    await expect(page.getByText("Marcação a mercado")).toHaveCount(0);
    await expect(page.getByRole("combobox", { name: "Instituição" })).toHaveValue("Corretora Fictícia");
    await expect(radio(page, "Previdência", "Sim")).toBeChecked();
    await expect(radio(page, "Isento de IR", "Não")).toBeChecked();
    await expect(radio(page, "Exposição cambial", "Não informado")).toBeChecked();

    await page.getByRole("combobox", { name: "Classe" }).fill("Fundos");
    await opcao(page, "Fundos").click();
    await page.getByRole("combobox", { name: "Instituição" }).fill("");
    await page.getByRole("combobox", { name: "Instituição" }).press("Escape");
    await radio(page, "Previdência", "Não informado").check();
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page).toHaveURL(/\/ativos$/);
    const ativo = await lerAtivo("Previdência fictícia");
    expect(ativo.classe_id).toBe(await idDaClasse("Fundos"));
    expect([ativo.instituicao_id, ativo.previdencia, ativo.isento_ir]).toEqual([null, null, false]);
  });

  test("editar um ativo desativado volta à aba Desativados; o trânsito não tem edição", async ({ page }) => {
    const { id } = await lerAtivo("Poupança fictícia");
    expect((await cliente.rpc("desativar_ativo", { p_ativo: id })).error).toBeNull();
    await page.setViewportSize(MOVEL);
    await entrar(page, u.dono);
    await page.goto("/ativos?aba=desativados");
    await page.getByRole("link", { name: "Editar Poupança fictícia" }).click();
    const instituicao = page.getByRole("combobox", { name: "Instituição" });
    await instituicao.fill("Banco");
    await opcao(page, "Banco Exemplo").click();
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page).toHaveURL(/\/ativos\?aba=desativados$/);
    await expect(page.getByRole("main").getByText(/Banco Exemplo · Desativado em \d{2}\/\d{2}\/\d{4}/)).toBeVisible();

    await page.goto("/ativos");
    await expect(page.getByRole("link", { name: "Editar Em trânsito" })).toHaveCount(0);
    const transito = (await cliente.from("ativos").select("id").eq("sistema", "transito").single()).data!.id;
    await page.goto(`/ativos/${transito}/editar`);
    await expect(page.getByRole("heading", { name: "Este ativo não tem detalhes" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Salvar alterações" })).toHaveCount(0);
  });

  test("outro usuário não abre a edição do ativo do primeiro", async ({ page }) => {
    const { id } = await lerAtivo("CDB fictício");
    await entrar(page, u.outro);
    await page.goto(`/ativos/${id}/editar`);
    await expect(page.getByRole("heading", { name: "Ativo não encontrado" })).toBeVisible();
    await expect(page.getByRole("combobox")).toHaveCount(0);
  });

  test("classe e instituição aparecem nas duas abas, no celular e no desktop, e Ocultar valores não as esconde", async ({ page, context, baseURL }) => {
    await page.setViewportSize(MOVEL);
    await entrar(page, u.dono);
    await page.goto("/ativos");
    const lista = page.locator("#ativos-da-aba").getByRole("list");
    await expect(lista.getByText("Rendimento · Renda fixa · Banco Exemplo", { exact: true })).toBeVisible();
    await expect(lista.getByText("Rendimento · Fundos", { exact: true })).toBeVisible();
    for (const link of await page.getByRole("main").getByRole("link", { name: /^Editar / }).all()) {
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    // Classe e instituição não são quantias: "Ocultar valores" (D8) não as esconde.
    await context.addCookies([{ name: "sf_ocultar_valores", value: "1", url: baseURL! }]);
    await page.reload();
    await expect(lista.getByText("Rendimento · Renda fixa · Banco Exemplo", { exact: true })).toBeVisible();
    await context.clearCookies({ name: "sf_ocultar_valores" });

    await page.setViewportSize(DESKTOP);
    await page.goto("/ativos");
    const linha = (nome: string): Locator => page.getByRole("row").filter({ hasText: nome });
    await expect(linha("CDB fictício").getByRole("cell")).toHaveText(["CDB fictício", "Rendimento", "Renda fixa", "Banco Exemplo", /Editar/]);
    await expect(linha("Previdência fictícia").getByRole("cell").nth(3)).toHaveText("—");
    const largura = await page.evaluate(() => ({ cliente: document.documentElement.clientWidth, rolagem: document.documentElement.scrollWidth }));
    expect(largura.rolagem).toBeLessThanOrEqual(largura.cliente);
  });

  for (const tamanho of [MOVEL, DESKTOP]) {
    test(`sem violações de acessibilidade no cadastro, na edição e nas abas em ${tamanho.width} px`, async ({ page }) => {
      const { id } = await lerAtivo("CDB fictício");
      await page.setViewportSize(tamanho);
      await entrar(page, u.dono);
      for (const rota of ["/ativos", "/ativos?aba=desativados", "/ativos/novo", `/ativos/${id}/editar`]) {
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
