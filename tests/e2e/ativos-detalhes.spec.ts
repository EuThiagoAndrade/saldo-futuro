import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { clienteDoUsuario, configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// Classe, instituição e indicadores do ativo (ciclo 012, issue #128, BL-009): cadastro com seletor
// de instituição que cadastra ali mesmo, "Mais detalhes", edição (inclusive de desativado) e
// exibição nas duas abas. Desde o ciclo 013 (issue #138) a classe é um nó da taxonomia global,
// escolhido num seletor com busca pelo caminho completo e sem criação. Desde o ciclo 017 (issue #173),
// os atributos complementares em "Mais detalhes". Usuários e nomes fictícios
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
      "Renda fixa › Crédito bancário › Poupança",
      "Renda fixa › Crédito bancário › Operações compromissadas",
      "Renda fixa › Crédito bancário › Certificados de operações estruturadas",
      // O caminho inteiro é pesquisado: o nome do tipo também casa, mesmo sob outro pai.
      "Renda fixa › Crédito corporativo › Cédulas de crédito bancário",
    ]);
    // Os produtos do Tesouro, acrescentados no ciclo 014 (issue #144), saem pelo nome.
    await classe.fill("tesouro");
    await expect(page.getByRole("listbox").getByRole("option")).toHaveText([
      "Renda fixa › Dívida soberana › Tesouro Selic",
      "Renda fixa › Dívida soberana › Tesouro Prefixado",
      "Renda fixa › Dívida soberana › Tesouro IPCA+",
      "Renda fixa › Dívida soberana › Tesouro Renda+",
      "Renda fixa › Dívida soberana › Tesouro Educa+",
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
    await expect(
      page.getByText("Informações preenchidas por você. O Saldo Futuro não calcula imposto, prazo de resgate ou valor garantido com estes campos."),
    ).toBeVisible();
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
    // A célula Nome também guarda o resumo "Ver detalhes" (ciclo 017, issue #174), sem coluna nova.
    await expect(linha("CDB fictício").getByRole("cell")).toHaveText([/^CDB fictícioVer detalhes/, "Rendimento", "CDB", "Banco Exemplo", /Editar/]);
    await expect(linha("Previdência fictícia").getByRole("cell").nth(2)).toHaveText("Ouro");
    await expect(linha("Previdência fictícia").getByRole("cell").nth(3)).toHaveText("—");
    const largura = await page.evaluate(() => ({ cliente: document.documentElement.clientWidth, rolagem: document.documentElement.scrollWidth }));
    expect(largura.rolagem).toBeLessThanOrEqual(largura.cliente);
  });

  // Nome na edição (ciclo 015, issue #153): nome e detalhes numa chamada só, mesmo UUID, nome repetido
  // válido, recusa sem gravar nada, ativo desativado e tipo de ajuste intocado.
  test("editar o nome: salva com os detalhes, mantém o UUID e o tipo de ajuste, aceita nome repetido e volta à aba", async ({ page }) => {
    const criar = async (nome: string, tipo: "rendimento" | "marcacao") => {
      const r = await cliente.rpc("cadastrar_ativo_taxonomia", {
        p_nome: nome,
        p_tipo_ajuste: tipo,
        p_instituicao: null,
        p_instituicao_nova: null,
        p_taxonomia: null,
        p_previdencia: null,
        p_liquidez_imediata: null,
        p_exposicao_cambial: null,
        p_isento_ir: null,
      });
      expect(r.error).toBeNull();
    };
    const ler = async (nome: string) => (await cliente.from("ativos").select("id, nome, tipo_ajuste, ativo, taxonomia_id, instituicao_id")).data!.filter((a) => a.nome === nome);
    await criar("Renomear um fictício", "rendimento");
    await criar("Renomear dois fictício", "marcacao");
    const [um] = await ler("Renomear um fictício");
    const [dois] = await ler("Renomear dois fictício");
    const campoNome = page.getByLabel("Nome", { exact: true });
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.dono);

    // O campo abre com o nome atual e a dica; o tipo de ajuste fica só para leitura.
    await page.goto(`/ativos/${um.id}/editar`);
    await expect(campoNome).toHaveValue("Renomear um fictício");
    await expect(page.getByText("O nome atual também aparece nos registros antigos deste ativo.")).toBeVisible();
    await expect(page.getByText("Rendimento", { exact: true })).toBeVisible();

    // Recusas: nada é gravado, a mensagem aparece e o campo mantém o que foi digitado.
    await campoNome.fill("   ");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("Informe o nome do ativo.");
    await expect(page).toHaveURL(new RegExp(`/ativos/${um.id}/editar$`));
    await campoNome.fill("b".repeat(101));
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("Use até 100 caracteres.");
    await expect(campoNome).toHaveValue("b".repeat(101));
    expect(await ler("Renomear um fictício")).toHaveLength(1);

    // Nome e classe juntos; o nome termina com espaços, que o banco tira.
    await campoNome.fill("  Nome novo fictício  ");
    await page.getByRole("combobox", { name: "Classe" }).fill("ouro");
    await opcao(page, CAMINHO_OURO).click();
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page).toHaveURL(/\/ativos$/);
    const [depois] = await ler("Nome novo fictício");
    expect(depois).toMatchObject({ id: um.id, tipo_ajuste: "rendimento", ativo: true, taxonomia_id: OURO });
    expect(await ler("Renomear um fictício")).toEqual([]);
    await expect(page.getByRole("row").filter({ hasText: "Nome novo fictício" })).toBeVisible();

    // Nome repetido é válido: o segundo ativo recebe o mesmo nome, sem tocar no primeiro.
    await page.goto(`/ativos/${dois.id}/editar`);
    await campoNome.fill("Nome novo fictício");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page).toHaveURL(/\/ativos$/);
    const repetidos = await ler("Nome novo fictício");
    expect(repetidos.map((a) => a.id).sort()).toEqual([um.id, dois.id].sort());
    expect(repetidos.find((a) => a.id === dois.id)?.tipo_ajuste).toBe("marcacao");

    // Desativado também edita o nome e volta à aba Desativados; o UUID não muda.
    expect((await cliente.rpc("desativar_ativo", { p_ativo: dois.id })).error).toBeNull();
    await page.goto(`/ativos/${dois.id}/editar`);
    await campoNome.fill("Desativado renomeado fictício");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page).toHaveURL(/\/ativos\?aba=desativados$/);
    expect(await ler("Desativado renomeado fictício")).toMatchObject([{ id: dois.id, ativo: false }]);
  });

  test("o trânsito não tem campo de nome na edição, e a função recusa o nome do trânsito", async ({ page }) => {
    const transito = (await cliente.from("ativos").select("id").eq("sistema", "transito").single()).data!.id;
    await entrar(page, u.dono);
    await page.goto(`/ativos/${transito}/editar`);
    await expect(page.getByLabel("Nome", { exact: true })).toHaveCount(0);
    const r = await cliente.rpc("editar_ativo_com_nome", {
      p_ativo: transito,
      p_nome: "Outro nome",
      p_instituicao: null,
      p_instituicao_nova: null,
      p_taxonomia: null,
      p_previdencia: null,
      p_liquidez_imediata: null,
      p_exposicao_cambial: null,
      p_isento_ir: null,
    });
    expect(r.error?.message).toBe("recusado_ativo_invalido");
    expect((await cliente.from("ativos").select("nome").eq("id", transito).single()).data!.nome).not.toBe("Outro nome");
  });

  // Atributos complementares (ciclo 017, issue #173): seleção múltipla com exclusividade, selects,
  // prazo exato com unidade, reabertura na edição, recusa que preserva o preenchimento e servidor
  // que recusa o formulário adulterado. Nomes e valores fictícios.
  const caixa = (page: Page, grupo: string, opcao: string) =>
    page.getByRole("group", { name: grupo }).getByRole("checkbox", { name: opcao, exact: true });
  const lerAtributos = async (nome: string) =>
    (
      await cliente
        .from("ativos")
        .select("id, veiculos_acesso, indexadores_remuneracao, regime_tributario, prazo_resgate_tipo, prazo_resgate_dias, prazo_resgate_unidade, cobertura_fgc, exposicao_cambial, liquidez_imediata")
        .eq("nome", nome)
        .single()
    ).data!;

  test("cadastro com atributos: múltipla escolha, exclusividade, prazo zero, e a edição reabre e limpa", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.dono);
    await preencherBase(page, "Fundo com atributos fictício");
    await page.getByText("Mais detalhes", { exact: true }).click();
    await expect(
      page.getByText("Informações preenchidas por você. O Saldo Futuro não calcula imposto, prazo de resgate ou valor garantido com estes campos."),
    ).toBeVisible();
    await caixa(page, "Veículo de acesso", "Fundo").check();
    await caixa(page, "Veículo de acesso", "ETF").check();
    // Não se aplica é exclusivo: marcá-lo desmarca os outros, e marcar outro o desmarca.
    await caixa(page, "Veículo de acesso", "Não se aplica").check();
    await expect(caixa(page, "Veículo de acesso", "Fundo")).not.toBeChecked();
    await expect(caixa(page, "Veículo de acesso", "ETF")).not.toBeChecked();
    await caixa(page, "Veículo de acesso", "ETF").check();
    await caixa(page, "Veículo de acesso", "Fundo").check();
    await expect(caixa(page, "Veículo de acesso", "Não se aplica")).not.toBeChecked();
    await caixa(page, "Indexador da remuneração", "Prefixado (sem indexador)").check();
    await caixa(page, "Indexador da remuneração", "INPC").check();
    await expect(caixa(page, "Indexador da remuneração", "Prefixado (sem indexador)")).not.toBeChecked();
    await caixa(page, "Indexador da remuneração", "CDI").check();
    await caixa(page, "Indexador da remuneração", "Variação cambial").check();
    await page.getByLabel("Regime tributário").selectOption({ label: "Fundos — longo prazo" });
    // Dias e unidade só aparecem com Prazo em dias; a unidade não vem escolhida.
    await expect(page.getByLabel("Dias", { exact: true })).toHaveCount(0);
    await page.getByLabel("Prazo para resgate ou venda").selectOption({ label: "Prazo em dias" });
    await expect(page.getByText(/registre o total em dias corridos, arredondando para cima/)).toBeVisible();
    await expect(page.getByLabel("Unidade", { exact: true })).toHaveValue("");
    await page.getByLabel("Dias", { exact: true }).fill("0");
    await page.getByLabel("Unidade", { exact: true }).selectOption({ label: "Dias úteis" });
    await page.getByLabel("Cobertura do FGC").selectOption({ label: "Sim" });
    await page.getByRole("button", { name: "Cadastrar ativo" }).click();
    await expect(page).toHaveURL(/\/ativos$/);
    const salvo = await lerAtributos("Fundo com atributos fictício");
    expect(salvo).toMatchObject({
      veiculos_acesso: ["fundo", "etf"],
      indexadores_remuneracao: ["cdi", "variacao_cambial", "inpc"],
      regime_tributario: "fundos_longo_prazo",
      prazo_resgate_tipo: "prazo",
      prazo_resgate_dias: 0,
      prazo_resgate_unidade: "uteis",
      cobertura_fgc: "sim",
      // Variação cambial é anotação: não preenche Exposição cambial.
      exposicao_cambial: null,
    });

    // A edição abre Mais detalhes com tudo marcado, e zero aparece como zero.
    await page.goto(`/ativos/${salvo.id}/editar`);
    await expect(caixa(page, "Veículo de acesso", "Fundo")).toBeChecked();
    await expect(caixa(page, "Veículo de acesso", "ETF")).toBeChecked();
    await expect(caixa(page, "Indexador da remuneração", "INPC")).toBeChecked();
    await expect(page.getByLabel("Regime tributário")).toHaveValue("fundos_longo_prazo");
    await expect(page.getByLabel("Prazo para resgate ou venda")).toHaveValue("prazo");
    await expect(page.getByLabel("Dias", { exact: true })).toHaveValue("0");
    await expect(page.getByLabel("Unidade", { exact: true })).toHaveValue("uteis");
    await expect(page.getByLabel("Cobertura do FGC")).toHaveValue("sim");

    // Limpar é explícito: desmarcar, voltar a Não informado, e uma situação sem número.
    await caixa(page, "Veículo de acesso", "Fundo").uncheck();
    await caixa(page, "Veículo de acesso", "ETF").uncheck();
    await page.getByLabel("Prazo para resgate ou venda").selectOption({ label: "No vencimento" });
    await expect(page.getByLabel("Dias", { exact: true })).toHaveCount(0);
    await page.getByLabel("Cobertura do FGC").selectOption({ label: "Não informado" });
    await radio(page, "Liquidez imediata (reserva)", "Não").check();
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page).toHaveURL(/\/ativos$/);
    expect(await lerAtributos("Fundo com atributos fictício")).toMatchObject({
      veiculos_acesso: [],
      indexadores_remuneracao: ["cdi", "variacao_cambial", "inpc"],
      prazo_resgate_tipo: "no_vencimento",
      prazo_resgate_dias: null,
      prazo_resgate_unidade: null,
      cobertura_fgc: null,
      liquidez_imediata: false,
    });
  });

  test("uma recusa mantém o que foi preenchido, e dias fracionários não são arredondados", async ({ page }) => {
    await page.setViewportSize(MOVEL);
    await entrar(page, u.dono);
    await preencherBase(page, "Recusa com atributos fictício");
    await page.getByText("Mais detalhes", { exact: true }).click();
    await caixa(page, "Indexador da remuneração", "Prefixado (sem indexador)").check();
    await page.getByLabel("Regime tributário").selectOption({ label: "Renda fixa — por prazo" });
    await radio(page, "Isento de IR", "Não").check();
    await page.getByLabel("Prazo para resgate ou venda").selectOption({ label: "Prazo em dias" });
    await page.getByLabel("Dias", { exact: true }).fill("2,2");
    await page.getByLabel("Unidade", { exact: true }).selectOption({ label: "Dias corridos" });
    await page.getByRole("button", { name: "Cadastrar ativo" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("Informe os dias como número inteiro, de 0 a 2.147.483.647, sem vírgula.");
    await expect(page).toHaveURL(/\/ativos\/novo$/);
    expect((await cliente.from("ativos").select("id").eq("nome", "Recusa com atributos fictício")).data).toEqual([]);
    // Nada se perde: nome, tipo, Mais detalhes aberto e cada escolha.
    await expect(page.getByLabel("Nome", { exact: true })).toHaveValue("Recusa com atributos fictício");
    await expect(page.getByLabel("Rendimento (renda fixa, poupança)")).toBeChecked();
    await expect(caixa(page, "Indexador da remuneração", "Prefixado (sem indexador)")).toBeChecked();
    await expect(page.getByLabel("Regime tributário")).toHaveValue("renda_fixa_por_prazo");
    await expect(radio(page, "Isento de IR", "Não")).toBeChecked();
    await expect(page.getByLabel("Dias", { exact: true })).toHaveValue("2,2");
    await expect(page.getByLabel("Unidade", { exact: true })).toHaveValue("corridos");
    // O total já conhecido de 2,2 dias corridos é registrado pela pessoa como 3.
    await page.getByLabel("Dias", { exact: true }).fill("3");
    await page.getByRole("button", { name: "Cadastrar ativo" }).click();
    await expect(page).toHaveURL(/\/ativos$/);
    expect(await lerAtributos("Recusa com atributos fictício")).toMatchObject({
      indexadores_remuneracao: ["sem_indexador"],
      regime_tributario: "renda_fixa_por_prazo",
      prazo_resgate_tipo: "prazo",
      prazo_resgate_dias: 3,
      prazo_resgate_unidade: "corridos",
    });
  });

  test("o servidor recusa exclusividade e código fora do catálogo, mesmo com o formulário adulterado", async ({ page }) => {
    await entrar(page, u.dono);
    await preencherBase(page, "Adulterado com atributos fictício");
    await page.getByText("Mais detalhes", { exact: true }).click();
    await caixa(page, "Indexador da remuneração", "Prefixado (sem indexador)").check();
    const acrescentar = (nome: string, valor: string) =>
      page.getByRole("main").locator("form").evaluate(
        (form, [n, v]) => {
          const campo = document.createElement("input");
          campo.type = "hidden";
          campo.name = n;
          campo.value = v;
          form.appendChild(campo);
        },
        [nome, valor],
      );
    await acrescentar("indexador", "cdi");
    await page.getByRole("button", { name: "Cadastrar ativo" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      "Prefixado (sem indexador) e Não se aplica não podem ser marcados junto com outro indexador.",
    );
    expect((await cliente.from("ativos").select("id").eq("nome", "Adulterado com atributos fictício")).data).toEqual([]);
    // Pela função, o banco recusa o mesmo conjunto e um código desconhecido.
    const direto = await cliente.rpc("cadastrar_ativo_com_atributos", {
      p_nome: "Direto com atributos fictício",
      p_tipo_ajuste: "rendimento",
      p_instituicao: null,
      p_instituicao_nova: null,
      p_taxonomia: null,
      p_previdencia: null,
      p_liquidez_imediata: null,
      p_exposicao_cambial: null,
      p_isento_ir: null,
      p_veiculos_acesso: [],
      p_indexadores_remuneracao: ["sem_indexador", "cdi"],
      p_regime_tributario: null,
      p_prazo_resgate_tipo: null,
      p_prazo_resgate_dias: null,
      p_prazo_resgate_unidade: null,
      p_cobertura_fgc: null,
    });
    expect(direto.error?.message).toBe("recusado_indexadores_remuneracao");
  });

  for (const tamanho of [MOVEL, DESKTOP]) {
    test(`Mais detalhes aberto, com todos os campos, sem violações nem rolagem horizontal em ${tamanho.width} px`, async ({ page }) => {
      await page.setViewportSize(tamanho);
      await entrar(page, u.dono);
      await page.goto("/ativos/novo");
      await page.getByText("Mais detalhes", { exact: true }).click();
      await page.getByLabel("Prazo para resgate ou venda").selectOption({ label: "Prazo em dias" });
      const resultado = await new AxeBuilder({ page }).withTags(WCAG).analyze();
      expect(resultado.violations).toEqual([]);
      const largura = await page.evaluate(() => ({ cliente: document.documentElement.clientWidth, rolagem: document.documentElement.scrollWidth }));
      expect(largura.rolagem).toBeLessThanOrEqual(largura.cliente);
      for (const alvo of await page.getByRole("checkbox").all()) {
        expect((await alvo.locator("xpath=..").boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
      for (const campo of ["Regime tributário", "Prazo para resgate ou venda", "Dias", "Unidade", "Cobertura do FGC"]) {
        expect((await page.getByLabel(campo, { exact: true }).boundingBox())!.height, campo).toBeGreaterThanOrEqual(44);
      }
      // Teclado: Espaço marca a caixa focada.
      await caixa(page, "Veículo de acesso", "Direto").focus();
      await page.keyboard.press("Space");
      await expect(caixa(page, "Veículo de acesso", "Direto")).toBeChecked();
    });
  }

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
