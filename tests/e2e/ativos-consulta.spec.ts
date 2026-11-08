import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { clienteDoUsuario, configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// Consulta dos atributos complementares em /ativos (ciclo 017, issue #174, P5, P6 e D8): "Ver
// detalhes" nas duas abas e "Filtrar" pela URL. Exemplos fictícios da P5: A (Fundo, CDI, 0 dias
// úteis), B (ETF, IPCA, 1 dia útil), C (Fundo e ETF, CDI, 3 dias corridos), E sem atributos, D
// desativado e o trânsito. Usuários e nomes fictícios exclusivos deste arquivo.

const MOVEL = { width: 360, height: 800 };
const DESKTOP = { width: 1280, height: 900 };
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
// 96 caracteres, para a quebra de linha no resumo e na lista.
const LONGO = "Ativo fictício com um nome bem comprido para conferir a quebra de linha do resumo no celular!!";
// Nós da taxonomia global (migrações do ciclo 013), por ID.
const no = (codigo: string) => `a5000000-0000-4000-8000-000000${codigo}`;
const CAIXA = "010000";
const SALDOS = "010100";
const ESPECIE = "010200";
const RENDA_FIXA = "020000";
const CREDITO_BANCARIO = "020200";
const CDB = "020201";
const RENDA_VARIAVEL = "030000";

async function criarAtivo(cliente: SupabaseClient, nome: string, extras: Record<string, unknown> = {}) {
  const r = await cliente.rpc("cadastrar_ativo_com_atributos", {
    p_nome: nome,
    p_tipo_ajuste: "rendimento",
    p_instituicao: null,
    p_instituicao_nova: null,
    p_taxonomia: null,
    p_previdencia: null,
    p_liquidez_imediata: null,
    p_exposicao_cambial: null,
    p_isento_ir: null,
    p_veiculos_acesso: [],
    p_indexadores_remuneracao: [],
    p_regime_tributario: null,
    p_prazo_resgate_tipo: null,
    p_prazo_resgate_dias: null,
    p_prazo_resgate_unidade: null,
    p_cobertura_fgc: null,
    ...extras,
  });
  expect(r.error).toBeNull();
  return r.data as string;
}

test.describe("consulta dos atributos (#174)", () => {
  test.skip(!configurado, "Roda só com o Supabase local configurado.");
  test.describe.configure({ mode: "serial" });

  let u: Record<string, UsuarioDeTeste>;
  let cliente: SupabaseClient;
  // IDs das instituições do usuário "classe": Um, Dois, Três (só do desativado) e a sem uso.
  const ids = { um: "", dois: "", tres: "", semUso: "" };
  test.beforeAll(async () => {
    u = await criarUsuarios("consulta174", { dono: "user", classe: "user" });
    cliente = await clienteDoUsuario(u.dono);
    const criar = (nome: string, a: Record<string, unknown> = {}) => criarAtivo(cliente, nome, a);
    const prazo = (dias: number, unidade: string) => ({ p_prazo_resgate_tipo: "prazo", p_prazo_resgate_dias: dias, p_prazo_resgate_unidade: unidade });
    await criar("Ativo A fictício", { p_veiculos_acesso: ["fundo"], p_indexadores_remuneracao: ["cdi"], ...prazo(0, "uteis"), p_cobertura_fgc: "sim", p_liquidez_imediata: true });
    await criar("Ativo B fictício", { p_veiculos_acesso: ["etf"], p_indexadores_remuneracao: ["ipca"], ...prazo(1, "uteis"), p_regime_tributario: "renda_variavel", p_cobertura_fgc: "nao" });
    await criar("Ativo C fictício", { p_veiculos_acesso: ["fundo", "etf"], p_indexadores_remuneracao: ["cdi", "variacao_cambial"], ...prazo(3, "corridos"), p_cobertura_fgc: "nao_aplicavel" });
    await criar("Ativo E fictício");
    await criar(LONGO, { p_veiculos_acesso: ["certificado_representativo"], p_indexadores_remuneracao: ["sem_indexador"], p_regime_tributario: "previdencia_regressivo", ...prazo(2147483647, "corridos") });
    const d = await criar("Ativo D fictício", { p_veiculos_acesso: ["direto"], p_prazo_resgate_tipo: "no_vencimento" });
    expect((await cliente.rpc("desativar_ativo", { p_ativo: d })).error).toBeNull();

    const clienteClasse = await clienteDoUsuario(u.classe);
    const banco = async (nome: string) => {
      const r = await clienteClasse.rpc("criar_instituicao", { p_nome: nome });
      expect(r.error).toBeNull();
      return r.data as string;
    };
    ids.um = await banco("Banco Um fictício");
    ids.dois = await banco("Banco Dois fictício");
    ids.tres = await banco("Banco Três fictício");
    ids.semUso = await banco("Banco sem uso fictício");
    const classificado = (nome: string, codigo: string, instituicao: string) =>
      criarAtivo(clienteClasse, nome, { p_taxonomia: no(codigo), p_instituicao: instituicao });
    await classificado("Filtro CDB Um", CDB, ids.um);
    await classificado("Filtro Crédito Dois", CREDITO_BANCARIO, ids.dois);
    await classificado("Filtro Ações Um", RENDA_VARIAVEL, ids.um);
    await classificado("Filtro Saldo Dois", SALDOS, ids.dois);
    await criarAtivo(clienteClasse, "Filtro Solto");
    const antigo = await classificado("Filtro Antigo", ESPECIE, ids.tres);
    expect((await clienteClasse.rpc("desativar_ativo", { p_ativo: antigo })).error).toBeNull();
  });
  test.afterAll(async () => {
    if (u) await removerUsuarios(u);
  });

  const principal = (page: Page) => page.getByRole("main");
  const aba = (page: Page, nome: "Em uso" | "Desativados") =>
    page.getByRole("navigation", { name: "Situação dos ativos" }).getByRole("link", { name: new RegExp(`^${nome}`) });
  /** Nomes visíveis na aba, na ordem da lista (tabela no desktop, lista no celular). */
  const nomesVisiveis = async (page: Page) => {
    const tabela = page.locator("#ativos-da-aba table");
    const linhas: Locator = (await tabela.isVisible()) ? tabela.locator("tbody tr td:first-child") : page.locator("#ativos-da-aba li > div:first-child > p:first-child");
    return (await linhas.allInnerTexts()).map((t) => t.split("\n")[0].trim());
  };
  // A tabela (desktop) e a lista (celular) coexistem no DOM: só o resumo visível conta.
  const resumo = (page: Page, nome: string) => principal(page).locator("summary").filter({ hasText: `Ver detalhes de ${nome}` }).filter({ visible: true });
  // "Filtrar" (ciclo 018, issue #183): o resumo leva um contador; veículo e indexador são listas
  // suspensas, que o auxiliar abre antes de marcar.
  const filtrar = (page: Page) => principal(page).locator("details").filter({ has: page.locator("summary", { hasText: /^Filtrar/ }) });
  const resumoFiltrar = (page: Page) => filtrar(page).locator("summary").first();
  const abrirFiltrar = async (page: Page) => {
    if ((await filtrar(page).getAttribute("open")) === null) await resumoFiltrar(page).click();
  };
  const caixa = async (page: Page, grupo: string, opcao: string) => {
    await abrirFiltrar(page);
    const campo = filtrar(page).getByRole("group", { name: grupo });
    if ((await campo.locator("details").getAttribute("open")) === null) await campo.locator("summary").click();
    return campo.getByRole("checkbox", { name: opcao, exact: true });
  };
  const aplicar = (page: Page) => page.getByRole("button", { name: "Aplicar filtros" }).click();

  test("faixa inclusiva e limpeza de campos condicionais, com e sem JavaScript", async ({ page, browser }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.dono);
    for (const semJs of [false, true]) {
      const contexto = semJs ? await browser.newContext({ storageState: await page.context().storageState(), javaScriptEnabled: false, viewport: DESKTOP }) : null;
      const p = contexto ? await contexto.newPage() : page;
      await p.goto("/ativos");
      await abrirFiltrar(p);
      await p.locator("#filtro-prazo").selectOption("prazo");
      await p.getByLabel("Comparação", { exact: true }).selectOption("entre");
      await p.getByLabel("Dias", { exact: true }).fill("0");
      await p.getByLabel("Até (dias)").fill("1");
      await p.getByLabel("Unidade", { exact: true }).selectOption("uteis");
      await aplicar(p);
      expect(await nomesVisiveis(p)).toEqual(["Ativo A fictício", "Ativo B fictício"]);
      await abrirFiltrar(p);
      await p.getByLabel("Comparação", { exact: true }).selectOption("ate");
      await aplicar(p);
      expect(new URL(p.url()).searchParams.has("prazo_resgate_dias_ate")).toBe(false);
      expect(await nomesVisiveis(p)).toEqual(["Ativo A fictício"]);
      await abrirFiltrar(p);
      await p.locator("#filtro-prazo").selectOption("no_vencimento");
      await aplicar(p);
      const consulta = new URL(p.url()).searchParams;
      expect(consulta.has("prazo_resgate_comparacao")).toBe(false);
      expect(consulta.has("prazo_resgate_dias")).toBe(false);
      if (contexto) await contexto.close();
    }
  });

  test("editar preserva aba e filtros ao voltar e salvar, descartando destino externo", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.dono);
    for (const [consulta, nome] of [["veiculo=fundo", "Ativo A fictício"], ["aba=desativados&prazo_resgate_tipo=no_vencimento", "Ativo D fictício"]]) {
      await page.goto(`/ativos?${consulta}`);
      await page.getByRole("link", { name: `Editar ${nome}`, exact: true }).filter({ visible: true }).click();
      await page.getByRole("link", { name: "Voltar para Ativos" }).click();
      await expect(page).toHaveURL(new RegExp(consulta));
      await page.getByRole("link", { name: `Editar ${nome}`, exact: true }).filter({ visible: true }).click();
      await page.getByRole("button", { name: "Salvar alterações" }).click();
      await expect(page).toHaveURL(new RegExp(consulta));
    }
    await page.getByRole("link", { name: "Editar Ativo D fictício" }).click();
    await expect(page).toHaveURL(/\/editar\?/);
    await page.goto(`${page.url()}&retorno=https%3A%2F%2Fexample.com&desconhecido=sim`);
    const voltar = await page.getByRole("link", { name: "Voltar para Ativos" }).getAttribute("href");
    expect(voltar).toBe("/ativos?aba=desativados&prazo_resgate_tipo=no_vencimento");
  });

  test("Ver detalhes nas duas abas, no desktop e no celular, sem colunas nem campos novos na linha", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.dono);
    await page.goto("/ativos");
    await expect(principal(page).locator("thead th")).toHaveCount(5);
    const resumoA = resumo(page, "Ativo A fictício");
    const resumoB = resumo(page, "Ativo B fictício");
    await expect(principal(page).getByText("Prazo para resgate ou venda").first()).toBeHidden();
    await resumoA.click();
    await resumoB.click();
    // Mais de um aberto, sem mover o foco nem trocar de página.
    const linhaA = page.getByRole("row").filter({ hasText: "Ativo A fictício" });
    for (const [rotulo, valor] of [
      ["Veículo de acesso", "Fundo"],
      ["Liquidez imediata (reserva)", "Sim"],
      ["Indexador da remuneração", "CDI"],
      ["Regime tributário", "Não informado"],
      ["Prazo para resgate ou venda", "0 dias úteis"],
      ["Cobertura do FGC", "Sim"],
    ]) {
      await expect(linhaA.locator("dl > div").filter({ has: page.locator("dt", { hasText: rotulo }) }).locator("dd")).toHaveText(valor);
    }
    await expect(page.getByRole("row").filter({ hasText: "Ativo B fictício" }).getByText("1 dia útil", { exact: true })).toBeVisible();
    // Ciclo 018 (D13 e D17): quatro grupos com título, sem a frase de aviso e sem Previdência como item.
    await expect(linhaA.getByText("Produto", { exact: true })).toBeVisible();
    await expect(linhaA.getByText("Proteção e exposição", { exact: true })).toBeVisible();
    await expect(linhaA.getByText(/Informações preenchidas por você/)).toHaveCount(0);
    await expect(linhaA.locator("dt", { hasText: /^Previdência$/ })).toHaveCount(0);
    await expect(page.getByRole("row").filter({ hasText: "Ativo C fictício" }).locator("dd").first()).toBeHidden();
    await expect(page.getByRole("row").filter({ hasText: "Em trânsito" }).getByText(/Ver detalhes/)).toHaveCount(0);

    await page.setViewportSize(MOVEL);
    await page.goto("/ativos");
    const itemLongo = page.locator("#ativos-da-aba li").filter({ hasText: LONGO });
    await resumo(page, LONGO).click();
    await expect(itemLongo.getByText("BDR ou certificado de depósito", { exact: true })).toBeVisible();
    await expect(itemLongo.getByText("2.147.483.647 dias corridos", { exact: true })).toBeVisible();
    await expect(itemLongo.getByText("Prefixado (sem indexador)", { exact: true })).toBeVisible();
    const largura = await page.evaluate(() => ({ cliente: document.documentElement.clientWidth, rolagem: document.documentElement.scrollWidth }));
    expect(largura.rolagem).toBeLessThanOrEqual(largura.cliente);

    await aba(page, "Desativados").click();
    const itemD = page.locator("#ativos-da-aba li").filter({ hasText: "Ativo D fictício" });
    await resumo(page, "Ativo D fictício").click();
    await expect(itemD.getByText("No vencimento", { exact: true })).toBeVisible();
    await expect(itemD.getByText("Direto", { exact: true })).toBeVisible();
    await expect(itemD.getByRole("link", { name: "Editar Ativo D fictício" })).toBeVisible();
  });

  test("Filtrar: OU no mesmo campo, E entre campos, painel fechado ao aplicar, contador, abas e Limpar", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.dono);
    await page.goto("/ativos");
    await expect(filtrar(page)).not.toHaveAttribute("open");
    await expect(principal(page).getByRole("link", { name: "Limpar filtros" })).toHaveCount(0);
    await abrirFiltrar(page);
    await expect(filtrar(page).getByRole("heading", { level: 2 })).toHaveText(["Classe e instituição", "Produto", "Tributação", "Resgate", "Proteção e exposição"]);
    await expect(filtrar(page).getByRole("combobox", { name: "Previdência", exact: true })).toHaveCount(0);
    await (await caixa(page, "Veículo de acesso", "Fundo")).check();
    await (await caixa(page, "Veículo de acesso", "ETF")).check();
    await aplicar(page);
    // O envio vai à âncora da lista; os campos vazios do formulário também vão na URL e valem como Todos.
    await expect(page).toHaveURL(/veiculo=fundo&veiculo=etf&.*#ativos-da-aba$/);
    expect(await nomesVisiveis(page)).toEqual(["Ativo A fictício", "Ativo B fictício", "Ativo C fictício"]);
    // Depois de aplicar, o painel fica fechado; o contador conta o campo, e Limpar fica ao lado.
    await expect(filtrar(page)).not.toHaveAttribute("open");
    await expect(resumoFiltrar(page)).toContainText("1 campo com filtro");
    await expect(principal(page).getByRole("link", { name: "Limpar filtros" })).toBeVisible();
    await expect(principal(page).getByRole("status")).toHaveCount(0);
    // Contadores das abas continuam com o total de cada situação.
    await expect(aba(page, "Em uso")).toHaveText(/Em uso\s*6/);
    await expect(aba(page, "Desativados")).toHaveText(/Desativados\s*1/);
    await expect(await caixa(page, "Veículo de acesso", "ETF")).toBeChecked();

    await (await caixa(page, "Indexador da remuneração", "CDI")).check();
    await aplicar(page);
    expect(await nomesVisiveis(page)).toEqual(["Ativo A fictício", "Ativo C fictício"]);
    await expect(resumoFiltrar(page)).toContainText("2 campos com filtro");
    await page.reload();
    expect(await nomesVisiveis(page)).toEqual(["Ativo A fictício", "Ativo C fictício"]);

    // A aba Desativados recebe os mesmos filtros: D (Direto) não corresponde.
    await aba(page, "Desativados").click();
    await expect(page).toHaveURL(/aba=desativados&veiculo=fundo&veiculo=etf&indexador=cdi/);
    await expect(page.getByRole("heading", { name: "Nenhum ativo corresponde aos filtros" })).toBeVisible();
    await principal(page).getByRole("link", { name: "Limpar filtros" }).click();
    await expect(page).toHaveURL(/\/ativos\?aba=desativados$/);
    await expect(page.locator("#ativos-da-aba").getByText("Ativo D fictício", { exact: true })).toBeVisible();
    // Limpar troca a página sem recarregar: o painel volta a Todos, sem nenhuma escolha antiga marcada.
    await expect(resumoFiltrar(page)).not.toContainText("com filtro");
    await expect(await caixa(page, "Veículo de acesso", "Fundo")).not.toBeChecked();
    await expect(await caixa(page, "Veículo de acesso", "ETF")).not.toBeChecked();
    await expect(await caixa(page, "Indexador da remuneração", "CDI")).not.toBeChecked();
    await expect(filtrar(page).getByRole("group", { name: "Veículo de acesso" }).locator("summary")).toContainText("Todos");
    // Voltar restaura a lista filtrada e as escolhas no painel.
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Nenhum ativo corresponde aos filtros" })).toBeVisible();
    await expect(resumoFiltrar(page)).toContainText("2 campos com filtro");
    await expect(await caixa(page, "Veículo de acesso", "Fundo")).toBeChecked();
    await expect(await caixa(page, "Indexador da remuneração", "CDI")).toBeChecked();
  });

  test("opções em uso nas listas, e Prefixado combina por OU com outro indexador", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.dono);
    await page.goto("/ativos");
    await abrirFiltrar(page);
    const veiculo = filtrar(page).getByRole("group", { name: "Veículo de acesso" });
    await veiculo.locator("summary").click();
    // Das duas abas: D (desativado) usa Direto; ninguém usa Plano ou contrato nem Previdência.
    await expect(veiculo.getByRole("checkbox")).toHaveCount(5);
    for (const nome of ["Direto", "Fundo", "ETF", "BDR ou certificado de depósito", "Não informado"]) {
      await expect(veiculo.getByRole("checkbox", { name: nome, exact: true })).toHaveCount(1);
    }
    await expect(veiculo.getByRole("checkbox", { name: "Plano ou contrato", exact: true })).toHaveCount(0);
    await (await caixa(page, "Indexador da remuneração", "Prefixado (sem indexador)")).check();
    await (await caixa(page, "Indexador da remuneração", "IPCA")).check();
    await aplicar(page);
    expect(await nomesVisiveis(page)).toEqual(["Ativo B fictício", LONGO]);
  });

  test("prazo: campos só com Prazo em dias, Exatamente e Até na mesma unidade, e situação sem número", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.dono);
    await page.goto("/ativos");
    await abrirFiltrar(page);
    const comparacao = page.getByLabel("Comparação", { exact: true });
    await expect(comparacao).toBeHidden();
    await page.locator("#filtro-prazo").selectOption({ label: "No vencimento" });
    await expect(comparacao).toBeHidden();
    await page.locator("#filtro-prazo").selectOption({ label: "Prazo em dias" });
    await expect(comparacao).toBeVisible();
    await comparacao.selectOption({ label: "Exatamente" });
    await page.getByLabel("Dias", { exact: true }).fill("1");
    await page.getByLabel("Unidade", { exact: true }).selectOption({ label: "Dias úteis" });
    await aplicar(page);
    expect(await nomesVisiveis(page)).toEqual(["Ativo B fictício"]);
    await expect(resumoFiltrar(page)).toContainText("1 campo com filtro");
    await abrirFiltrar(page);
    await expect(comparacao).toBeVisible();
    await comparacao.selectOption({ label: "Até" });
    await aplicar(page);
    expect(await nomesVisiveis(page)).toEqual(["Ativo A fictício", "Ativo B fictício"]);
    // Até 100 dias úteis não inclui C, que tem 3 dias corridos.
    await page.goto("/ativos?prazo_resgate_tipo=prazo&prazo_resgate_comparacao=ate&prazo_resgate_dias=100&prazo_resgate_unidade=uteis");
    expect(await nomesVisiveis(page)).toEqual(["Ativo A fictício", "Ativo B fictício"]);
    await page.goto("/ativos?aba=desativados&prazo_resgate_tipo=no_vencimento");
    await expect(page.locator("#ativos-da-aba").getByText("Ativo D fictício", { exact: true })).toBeVisible();
  });

  test("Não informado seleciona só o nulo, sem o trânsito; combinações inválidas abrem o painel e mostram o erro no lugar da lista", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.dono);
    await page.goto("/ativos?regime=nao_informado");
    expect(await nomesVisiveis(page)).toEqual(["Ativo A fictício", "Ativo C fictício", "Ativo E fictício"]);
    await page.goto("/ativos?fgc=nao_informado");
    expect(await nomesVisiveis(page)).toEqual(["Ativo E fictício", LONGO]);
    await page.goto("/ativos?prazo_resgate_tipo=nao_informado");
    expect(await nomesVisiveis(page)).toEqual(["Ativo E fictício"]);
    await page.goto("/ativos?liquidez_imediata=sim");
    expect(await nomesVisiveis(page)).toEqual(["Ativo A fictício"]);
    // Um parâmetro antigo do indicador Previdência é ignorado (ciclo 018, D18).
    await page.goto("/ativos?previdencia=sim");
    expect(await nomesVisiveis(page)).toHaveLength(6);

    for (const [consulta, mensagem] of [
      ["prazo_resgate_tipo=nao_informado&prazo_resgate_dias=3", "Comparação, dias e unidade só valem com Prazo em dias."],
      ["prazo_resgate_tipo=prazo&prazo_resgate_dias=1&prazo_resgate_unidade=uteis", "Com Prazo em dias, escolha a comparação, os dias e a unidade."],
      ["fgc=talvez", "Cobertura do FGC tem uma opção desconhecida."],
      ["regime=outro&regime=renda_variavel", "Regime tributário aparece mais de uma vez."],
      ["veiculo=nao_informado&veiculo=fundo", "Veículo de acesso: Não informado não combina com outras opções."],
    ]) {
      await page.goto(`/ativos?${consulta}`);
      await expect(page.locator("#ativos-da-aba").getByRole("alert"), consulta).toHaveText(`Não foi possível aplicar os filtros: ${mensagem}`);
      await expect(page.locator("#ativos-da-aba").getByText("Ativo A fictício", { exact: true }), consulta).toHaveCount(0);
      await expect(filtrar(page), consulta).toHaveAttribute("open");
    }
    await principal(page).getByRole("link", { name: "Limpar filtros" }).click();
    await expect(page).toHaveURL(/\/ativos$/);
    expect(await nomesVisiveis(page)).toHaveLength(6);
  });

  // Classe e instituição (ciclo 019, issue #190, BL-020), com o segundo usuário: cinco ativos em uso, um
  // sem classe nem instituição, e um desativado cuja classe e instituição só ele usa. Nomes fictícios.
  const SEM_USO = "00000000-0000-4000-8000-000000000000";
  const ROTULOS_CLASSE = [
    "Caixa e disponibilidades",
    "Caixa e disponibilidades › Saldos em conta",
    "Caixa e disponibilidades › Dinheiro em espécie",
    "Renda fixa",
    "Renda fixa › Crédito bancário",
    "Renda fixa › Crédito bancário › CDB",
    "Renda variável",
    "Sem classe",
  ];
  const abrirLista = async (page: Page, grupo: string) => {
    await abrirFiltrar(page);
    const campo = filtrar(page).getByRole("group", { name: grupo, exact: true });
    if ((await campo.locator("details").getAttribute("open")) === null) await campo.locator("summary").click();
    return campo;
  };

  test("classe e instituição: grupo no topo, só as opções em uso e as marcadas, em ordem hierárquica e alfabética", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.classe);
    await page.goto("/ativos");
    await abrirFiltrar(page);
    await expect(filtrar(page).getByRole("heading", { level: 2 })).toHaveText(["Classe e instituição", "Produto", "Tributação", "Resgate", "Proteção e exposição"]);
    const classe = await abrirLista(page, "Classe");
    await expect(classe.locator("label")).toHaveText(ROTULOS_CLASSE);
    // Sem frase de abertura no painel, e sem divisória acima do primeiro grupo (nem com o campo oculto da aba).
    await expect(filtrar(page).getByText(/Opções marcadas no mesmo campo|Marcar uma classe inclui/)).toHaveCount(0);
    const divisoria = (p: Page) => filtrar(p).locator("section").first().evaluate((el) => getComputedStyle(el).borderTopWidth);
    expect(await divisoria(page)).toBe("0px");
    await page.goto("/ativos?aba=desativados");
    await abrirFiltrar(page);
    expect(await divisoria(page)).toBe("0px");
    await page.goto("/ativos");
    await abrirFiltrar(page);
    // As duas listas do grupo ficam alinhadas: o resumo de cada uma começa na mesma altura.
    const topo = async (campo: Locator) => Math.round((await campo.locator("summary").boundingBox())!.y);
    expect(await topo(classe)).toBe(await topo(filtrar(page).getByRole("group", { name: "Instituição", exact: true })));
    const instituicao = await abrirLista(page, "Instituição");
    // Uma lista suspensa aberta por vez; Banco Três só é usado pelo ativo desativado, e a instituição sem uso não aparece.
    await expect(instituicao.locator("label")).toHaveText(["Banco Dois fictício", "Banco Três fictício", "Banco Um fictício", "Sem instituição"]);
    await expect(instituicao.getByRole("checkbox", { name: "Banco sem uso fictício" })).toHaveCount(0);
    // Uma opção marcada na URL e sem ativo continua na lista, para poder ser desmarcada.
    await page.goto(`/ativos?classe=${no(RENDA_VARIAVEL)}&instituicao=${ids.semUso}`);
    await expect(page.locator("#ativos-da-aba").getByRole("alert")).toHaveCount(0);
    expect(await nomesVisiveis(page)).toEqual([]);
    await expect(await caixa(page, "Instituição", "Banco sem uso fictício")).toBeChecked();
  });

  test("classe e instituição: nó com descendentes, OU entre instituições, E entre campos, contador, abas e Limpar", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.classe);
    await page.goto("/ativos");
    expect(await nomesVisiveis(page)).toEqual(["Filtro Ações Um", "Filtro CDB Um", "Filtro Crédito Dois", "Filtro Saldo Dois", "Filtro Solto", "Em trânsito"]);
    // Um nó inclui os descendentes: Renda fixa traz o ativo de Crédito bancário e o de CDB.
    await (await caixa(page, "Classe", "Renda fixa")).check();
    await aplicar(page);
    await expect(page).toHaveURL(new RegExp(`classe=${no(RENDA_FIXA)}&.*#ativos-da-aba$`));
    expect(await nomesVisiveis(page)).toEqual(["Filtro CDB Um", "Filtro Crédito Dois"]);
    await expect(filtrar(page)).not.toHaveAttribute("open");
    await expect(resumoFiltrar(page)).toContainText("1 campo com filtro");
    await expect(principal(page).getByRole("link", { name: "Limpar filtros" })).toBeVisible();
    await expect(aba(page, "Em uso")).toHaveText(/Em uso\s*6/);
    await expect(aba(page, "Desativados")).toHaveText(/Desativados\s*1/);
    // Trocar o nó pelo mais profundo restringe a lista.
    await (await caixa(page, "Classe", "Renda fixa")).uncheck();
    await (await caixa(page, "Classe", "Renda fixa › Crédito bancário › CDB")).check();
    await aplicar(page);
    expect(await nomesVisiveis(page)).toEqual(["Filtro CDB Um"]);
    // Duas instituições combinam por OU; com a classe, por E.
    await page.goto("/ativos");
    await (await caixa(page, "Instituição", "Banco Um fictício")).check();
    await aplicar(page);
    expect(await nomesVisiveis(page)).toEqual(["Filtro Ações Um", "Filtro CDB Um"]);
    await (await caixa(page, "Instituição", "Banco Dois fictício")).check();
    await aplicar(page);
    expect(await nomesVisiveis(page)).toEqual(["Filtro Ações Um", "Filtro CDB Um", "Filtro Crédito Dois", "Filtro Saldo Dois"]);
    await (await caixa(page, "Classe", "Renda fixa")).check();
    await aplicar(page);
    expect(await nomesVisiveis(page)).toEqual(["Filtro CDB Um", "Filtro Crédito Dois"]);
    await (await caixa(page, "Instituição", "Banco Dois fictício")).uncheck();
    await aplicar(page);
    expect(await nomesVisiveis(page)).toEqual(["Filtro CDB Um"]);
    await expect(resumoFiltrar(page)).toContainText("2 campos com filtro");
    await page.reload();
    expect(await nomesVisiveis(page)).toEqual(["Filtro CDB Um"]);
    // E com os demais filtros: Fundo não é de ninguém aqui.
    await page.goto(`/ativos?classe=${no(RENDA_FIXA)}&veiculo=fundo`);
    await expect(page.getByRole("heading", { name: "Nenhum ativo corresponde aos filtros" })).toBeVisible();

    // A aba Desativados recebe os mesmos filtros, e a classe e a instituição só do desativado aparecem nas opções.
    await page.goto(`/ativos?classe=${no(CAIXA)}&instituicao=${ids.tres}`);
    // Nenhum ativo em uso tem essa classe e essa instituição; o desativado tem.
    await expect(page.getByRole("heading", { name: "Nenhum ativo corresponde aos filtros" })).toBeVisible();
    await aba(page, "Desativados").click();
    await expect(page).toHaveURL(new RegExp(`aba=desativados&classe=${no(CAIXA)}&instituicao=${ids.tres}`));
    expect(await nomesVisiveis(page)).toEqual(["Filtro Antigo"]);
    await expect(resumoFiltrar(page)).toContainText("2 campos com filtro");
    await principal(page).getByRole("link", { name: "Limpar filtros" }).click();
    await expect(page).toHaveURL(/\/ativos\?aba=desativados$/);
    await expect(resumoFiltrar(page)).not.toContainText("com filtro");
    await abrirFiltrar(page);
    await expect(filtrar(page).getByRole("group", { name: "Classe", exact: true }).locator("summary")).toContainText("Todas");
    await expect(filtrar(page).getByRole("group", { name: "Instituição", exact: true }).locator("summary")).toContainText("Todas");
  });

  test("Sem classe e Sem instituição selecionam só os sem vínculo, e o trânsito sai com qualquer filtro", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.classe);
    await page.goto("/ativos?classe=sem_classe");
    expect(await nomesVisiveis(page)).toEqual(["Filtro Solto"]);
    await page.goto("/ativos?instituicao=sem_instituicao");
    expect(await nomesVisiveis(page)).toEqual(["Filtro Solto"]);
    await page.goto("/ativos?classe=sem_classe&instituicao=sem_instituicao");
    expect(await nomesVisiveis(page)).toEqual(["Filtro Solto"]);
    await expect(await caixa(page, "Classe", "Sem classe")).toBeChecked();
    await page.goto(`/ativos?classe=sem_classe&instituicao=${ids.um}`);
    await expect(page.getByRole("heading", { name: "Nenhum ativo corresponde aos filtros" })).toBeVisible();
    // Pelo painel: marcar e aplicar.
    await page.goto("/ativos");
    await (await caixa(page, "Classe", "Sem classe")).check();
    await aplicar(page);
    await expect(page).toHaveURL(/classe=sem_classe&.*#ativos-da-aba$/);
    expect(await nomesVisiveis(page)).toEqual(["Filtro Solto"]);
  });

  test("classe e instituição: ID desconhecido e combinações inválidas abrem o painel e mostram o erro no lugar da lista", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.classe);
    for (const [consulta, mensagem] of [
      [`classe=${SEM_USO}`, "Classe tem uma opção desconhecida."],
      [`classe=${no(RENDA_FIXA)}&classe=${SEM_USO}`, "Classe tem uma opção desconhecida."],
      [`instituicao=${SEM_USO}`, "Instituição tem uma opção desconhecida."],
      ["instituicao=nao_informado", "Instituição tem uma opção desconhecida."],
      [`classe=sem_classe&classe=${no(RENDA_FIXA)}`, "Classe: Sem classe não combina com outras opções."],
      [`instituicao=${ids.um}&instituicao=sem_instituicao`, "Instituição: Sem instituição não combina com outras opções."],
    ]) {
      await page.goto(`/ativos?${consulta}`);
      await expect(page.locator("#ativos-da-aba").getByRole("alert"), consulta).toHaveText(`Não foi possível aplicar os filtros: ${mensagem}`);
      await expect(page.locator("#ativos-da-aba").getByText("Filtro Solto", { exact: true }), consulta).toHaveCount(0);
      await expect(filtrar(page), consulta).toHaveAttribute("open");
    }
    await principal(page).getByRole("link", { name: "Limpar filtros" }).click();
    await expect(page).toHaveURL(/\/ativos$/);
    expect(await nomesVisiveis(page)).toHaveLength(6);
  });

  test("o painel de classe e instituição funciona sem JavaScript", async ({ page, browser }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.classe);
    const contexto = await browser.newContext({ storageState: await page.context().storageState(), javaScriptEnabled: false, viewport: DESKTOP });
    const semJs = await contexto.newPage();
    await semJs.goto("/ativos");
    // Sem JavaScript os resumos abrem pelo <details> nativo, e as caixas são enviadas pelo formulário GET.
    await semJs.locator("summary", { hasText: /^Filtrar/ }).click();
    const classe = filtrar(semJs).getByRole("group", { name: "Classe", exact: true });
    await classe.locator("summary").click();
    await classe.getByRole("checkbox", { name: "Renda fixa", exact: true }).check();
    const instituicao = filtrar(semJs).getByRole("group", { name: "Instituição", exact: true });
    await instituicao.locator("summary").click();
    await instituicao.getByRole("checkbox", { name: "Banco Um fictício", exact: true }).check();
    await semJs.getByRole("button", { name: "Aplicar filtros" }).click();
    await expect(semJs).toHaveURL(new RegExp(`classe=${no(RENDA_FIXA)}&instituicao=${ids.um}&.*#ativos-da-aba$`));
    expect(await nomesVisiveis(semJs)).toEqual(["Filtro CDB Um"]);
    await contexto.close();
  });

  for (const tamanho of [MOVEL, DESKTOP]) {
    test(`classe e instituição: listas abertas, sem violações nem rolagem horizontal, com alvos de 44 px em ${tamanho.width} px`, async ({ page }) => {
      await page.setViewportSize(tamanho);
      await entrar(page, u.classe);
      for (const rota of [`/ativos?classe=${no(CDB)}`, "/ativos?aba=desativados", `/ativos?instituicao=${SEM_USO}`]) {
        await page.goto(rota);
        for (const lista of ["Classe", "Instituição"]) {
          const campo = await abrirLista(page, lista);
          const resultado = await new AxeBuilder({ page }).withTags(WCAG).analyze();
          expect(resultado.violations, `${rota} ${lista}`).toEqual([]);
          const largura = await page.evaluate(() => ({ cliente: document.documentElement.clientWidth, rolagem: document.documentElement.scrollWidth }));
          expect(largura.rolagem, `${rota} ${lista}`).toBeLessThanOrEqual(largura.cliente);
          for (const alvo of await campo.getByRole("checkbox").all()) {
            expect((await alvo.locator("xpath=..").boundingBox())!.height, `${rota} ${lista}`).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });
  }

  for (const tamanho of [MOVEL, DESKTOP]) {
    test(`Filtrar e Ver detalhes abertos, sem violações nem rolagem horizontal, com alvos de 44 px em ${tamanho.width} px`, async ({ page }) => {
      await page.setViewportSize(tamanho);
      await entrar(page, u.dono);
      for (const rota of ["/ativos?veiculo=certificado_representativo", "/ativos?aba=desativados", "/ativos?fgc=talvez"]) {
        await page.goto(rota);
        await abrirFiltrar(page);
        await page.locator("#filtro-prazo").selectOption({ label: "Prazo em dias" });
        for (const aberto of await principal(page).locator("summary").filter({ hasText: /^Ver detalhes/ }).filter({ visible: true }).all()) await aberto.click();
        // Uma lista suspensa aberta por vez: abrir uma fecha a outra.
        for (const lista of ["Classe", "Instituição", "Veículo de acesso", "Indexador da remuneração"]) {
          const campo = filtrar(page).getByRole("group", { name: lista });
          await campo.locator("summary").click();
          const resultado = await new AxeBuilder({ page }).withTags(WCAG).analyze();
          expect(resultado.violations, `${rota} ${lista}`).toEqual([]);
          const largura = await page.evaluate(() => ({ cliente: document.documentElement.clientWidth, rolagem: document.documentElement.scrollWidth }));
          expect(largura.rolagem, `${rota} ${lista}`).toBeLessThanOrEqual(largura.cliente);
          for (const alvo of await campo.getByRole("checkbox").all()) {
            expect((await alvo.locator("xpath=..").boundingBox())!.height, `${rota} ${lista}`).toBeGreaterThanOrEqual(44);
          }
        }
        for (const alvo of await principal(page).locator("summary").filter({ visible: true }).all()) {
          expect((await alvo.boundingBox())!.height, rota).toBeGreaterThanOrEqual(44);
        }
      }
      // Teclado: Enter no resumo o abre, e o foco continua nele.
      await page.goto("/ativos");
      const resumoE = resumo(page, "Ativo E fictício");
      await resumoE.focus();
      await page.keyboard.press("Enter");
      await expect(resumoE).toBeFocused();
      await expect(resumoE.locator("xpath=..")).toHaveAttribute("open");
    });
  }
});
