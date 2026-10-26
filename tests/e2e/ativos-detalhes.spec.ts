import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { clienteDoUsuario, configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// Classe, instituição e indicadores do ativo (ciclo 012, issue #128, BL-009): cadastro com seletor
// de instituição que cadastra ali mesmo, "Mais detalhes", edição (inclusive de desativado) e
// exibição nas duas abas. Desde o ciclo 013 (issue #138) a classe é um nó da taxonomia global,
// escolhido num seletor com busca pelo caminho completo e sem criação. Usuários e nomes fictícios
// exclusivos deste arquivo (D9 do ciclo 004).

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
  });
  test.afterAll(async () => {
    if (u) await removerUsuarios(u);
  });

  const lerAtivo = async (nome: string) =>
    (await cliente.from("ativos").select("id, taxonomia_id, classe_id, instituicao_id, previdencia, liquidez_imediata, exposicao_cambial, isento_ir").eq("nome", nome).single()).data!;
  // Nós fixos da árvore aprovada (identidades estáveis): Renda fixa › Crédito bancário › CDB, e Ouro.
  const CDB = "a5000000-0000-4000-8000-000000020201";
  const CAMINHO_CDB = "Renda fixa › Crédito bancário › CDB";
  const OURO = "a5000000-0000-4000-8000-000000060100";
  const CAMINHO_OURO = "Alternativos, moedas, outros › Ouro";
  const opcao = (page: Page, nome: string) => page.getByRole("listbox").getByRole("option", { name: nome, exact: true });
  const radio = (page: Page, indicador: string, valor: "Sim" | "Não" | "Não informado") =>
    page.getByRole("group", { name: indicador }).getByRole("radio", { name: valor, exact: true });

  async function preencherBase(page: Page, nome: string) {
    await page.goto("/ativos/novo");
    await page.getByLabel("Nome", { exact: true }).fill(nome);
    await page.getByLabel("Rendimento (renda fixa, poupança)").check();
  }

  test("cadastro com classe da taxonomia e instituição existente, sem abrir Mais detalhes nem ganhar campos", async ({ page }) => {
    await entrar(page, u.dono);
    await preencherBase(page, "CDB fictício");
    await expect(radio(page, "Previdência", "Não informado")).toBeHidden();
    const classe = page.getByRole("combobox", { name: "Classe" });
    // A busca ignora acento e caixa e acha pelo ancestral: o caminho inteiro é o texto pesquisado.
    await classe.fill("CREDITO bancario");
    await expect(page.getByRole("listbox").getByRole("option")).toHaveText([
      "Renda fixa › Crédito bancário",
      "Renda fixa › Crédito bancário › CDB",
      "Renda fixa › Crédito bancário › RDB",
      "Renda fixa › Crédito bancário › Letras bancárias",
    ]);
    await classe.fill("cdb");
    await opcao(page, CAMINHO_CDB).click();
    await expect(classe).toHaveValue(CAMINHO_CDB);
    // Escolher o tipo não acrescenta campo nem etapa: continuam só a classe e a instituição.
    await expect(page.getByRole("combobox")).toHaveCount(2);
    await expect(page.getByRole("button", { name: "Cadastrar ativo" })).toBeVisible();
    // Teclado: digitar filtra, Enter confirma a opção destacada.
    const instituicao = page.getByRole("combobox", { name: "Instituição" });
    await instituicao.fill("banco");
    await instituicao.press("Enter");
    await expect(instituicao).toHaveValue("Banco Exemplo");
    await page.getByRole("button", { name: "Cadastrar ativo" }).click();
    await expect(page).toHaveURL(/\/ativos$/);
    const ativo = await lerAtivo("CDB fictício");
    expect(ativo.taxonomia_id).toBe(CDB);
    expect(ativo.classe_id).toBeNull();
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
    expect(ativo.taxonomia_id).toBeNull();
    expect([ativo.previdencia, ativo.liquidez_imediata, ativo.exposicao_cambial, ativo.isento_ir]).toEqual([true, null, null, false]);
  });

  test("texto sem seleção não vira classe, não há criação, e o cadastro sem classe continua possível", async ({ page }) => {
    await entrar(page, u.dono);
    await preencherBase(page, "Poupança fictícia");
    const classe = page.getByRole("combobox", { name: "Classe" });
    // Sem criação: um texto que não é de nenhum nó não oferece "Cadastrar", só avisa que nada foi encontrado.
    await classe.fill("Classe sem confirmar");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(page.getByRole("status").filter({ hasText: "Nenhuma classe encontrada." })).toBeVisible();
    await classe.press("Escape");
    await page.getByRole("button", { name: "Cadastrar ativo" }).click();
    await expect(page.getByText("Escolha uma classe da lista.")).toBeVisible();
    await expect(page).toHaveURL(/\/ativos\/novo$/);
    // Apagar o texto abre a lista inteira; Esc a fecha antes do envio.
    await classe.fill("");
    await classe.press("Escape");
    await page.getByRole("button", { name: "Cadastrar ativo" }).click();
    await expect(page).toHaveURL(/\/ativos$/);
    const ativo = await lerAtivo("Poupança fictícia");
    expect([ativo.taxonomia_id, ativo.classe_id, ativo.instituicao_id]).toEqual([null, null, null]);
  });

  test("o servidor recusa um nó inexistente, mesmo com o formulário adulterado", async ({ page }) => {
    await entrar(page, u.dono);
    await preencherBase(page, "Adulterado fictício");
    await page
      .locator('input[name="taxonomia"]')
      .evaluate((el, valor) => ((el as HTMLInputElement).value = valor), "00000000-0000-4000-8000-0000000000ff");
    await page.getByRole("button", { name: "Cadastrar ativo" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("Classe não encontrada. Escolha uma da lista.");
    await expect(page).toHaveURL(/\/ativos\/novo$/);
    expect((await cliente.from("ativos").select("id").eq("nome", "Adulterado fictício")).data).toEqual([]);
    // Pela função, o mesmo motivo.
    const direto = await cliente.rpc("cadastrar_ativo_taxonomia", {
      p_nome: "Direto fictício",
      p_tipo_ajuste: "rendimento",
      p_instituicao: null,
      p_instituicao_nova: null,
      p_taxonomia: "00000000-0000-4000-8000-0000000000ff",
      p_previdencia: null,
      p_liquidez_imediata: null,
      p_exposicao_cambial: null,
      p_isento_ir: null,
    });
    expect(direto.error?.message).toBe("recusado_taxonomia_inexistente");
  });

  test("no celular, o caminho longo quebra a linha na lista, sem rolagem horizontal, e as opções têm 44 px", async ({ page }) => {
    await page.setViewportSize(MOVEL);
    await entrar(page, u.dono);
    await preencherBase(page, "Longo fictício");
    const classe = page.getByRole("combobox", { name: "Classe" });
    await classe.fill("preferenciais");
    const longo = page.getByRole("listbox").getByRole("option", { name: "Renda variável › Participações em empresas › Ações preferenciais", exact: true });
    await expect(longo).toBeVisible();
    const caixa = (await longo.boundingBox())!;
    expect(caixa.height).toBeGreaterThanOrEqual(44);
    const medida = await longo.evaluate((el) => ({ cabe: el.scrollWidth <= el.clientWidth, linha: parseFloat(getComputedStyle(el).lineHeight) }));
    expect(medida.cabe).toBe(true);
    // 360 px úteis: o caminho de 63 caracteres ocupa mais de uma linha.
    expect(caixa.height).toBeGreaterThan(medida.linha + 8);
    const largura = await page.evaluate(() => ({ cliente: document.documentElement.clientWidth, rolagem: document.documentElement.scrollWidth }));
    expect(largura.rolagem).toBeLessThanOrEqual(largura.cliente);
  });

  test("editar um ativo em uso: Mais detalhes abre com o que foi informado, e a classe nova entra pelo caminho", async ({ page }) => {
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
    await expect(page.getByText("Classe atual")).toBeVisible();
    await expect(page.getByText("Sem classe", { exact: true })).toBeVisible();

    await page.getByRole("combobox", { name: "Classe" }).fill("ouro");
    await opcao(page, CAMINHO_OURO).click();
    await page.getByRole("combobox", { name: "Instituição" }).fill("");
    await page.getByRole("combobox", { name: "Instituição" }).press("Escape");
    await radio(page, "Previdência", "Não informado").check();
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page).toHaveURL(/\/ativos$/);
    const ativo = await lerAtivo("Previdência fictícia");
    expect(ativo.taxonomia_id).toBe(OURO);
    expect([ativo.instituicao_id, ativo.previdencia, ativo.isento_ir]).toEqual([null, null, false]);
  });

  test("editar mostra o caminho atual, e limpar a classe grava Sem classe", async ({ page }) => {
    const { id } = await lerAtivo("CDB fictício");
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.dono);
    await page.goto(`/ativos/${id}/editar`);
    await expect(page.getByRole("combobox", { name: "Classe" })).toHaveValue(CAMINHO_CDB);
    await expect(page.getByText(CAMINHO_CDB, { exact: true })).toBeVisible();
    await page.getByRole("combobox", { name: "Classe" }).fill("");
    await page.getByRole("combobox", { name: "Classe" }).press("Escape");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page).toHaveURL(/\/ativos$/);
    expect((await lerAtivo("CDB fictício")).taxonomia_id).toBeNull();
    // Volta ao nó de antes, para as listas abaixo.
    const volta = await cliente.rpc("editar_detalhes_ativo_taxonomia", {
      p_ativo: id,
      p_instituicao: banco,
      p_instituicao_nova: null,
      p_taxonomia: CDB,
      p_previdencia: null,
      p_liquidez_imediata: null,
      p_exposicao_cambial: null,
      p_isento_ir: null,
    });
    expect(volta.error).toBeNull();
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
    // Na lista, só o nome do nó (D8); o caminho completo fica no seletor e na edição.
    await expect(lista.getByText("Rendimento · CDB · Banco Exemplo", { exact: true })).toBeVisible();
    await expect(lista.getByText("Rendimento · Ouro", { exact: true })).toBeVisible();
    for (const link of await page.getByRole("main").getByRole("link", { name: /^Editar / }).all()) {
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    // Classe e instituição não são quantias: "Ocultar valores" (D8) não as esconde.
    await context.addCookies([{ name: "sf_ocultar_valores", value: "1", url: baseURL! }]);
    await page.reload();
    await expect(lista.getByText("Rendimento · CDB · Banco Exemplo", { exact: true })).toBeVisible();
    await context.clearCookies({ name: "sf_ocultar_valores" });

    await page.setViewportSize(DESKTOP);
    await page.goto("/ativos");
    const linha = (nome: string): Locator => page.getByRole("row").filter({ hasText: nome });
    await expect(linha("CDB fictício").getByRole("cell")).toHaveText(["CDB fictício", "Rendimento", "CDB", "Banco Exemplo", /Editar/]);
    await expect(linha("Previdência fictícia").getByRole("cell").nth(2)).toHaveText("Ouro");
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
