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

test.describe("consulta dos atributos (#174)", () => {
  test.skip(!configurado, "Roda só com o Supabase local configurado.");
  test.describe.configure({ mode: "serial" });

  let u: Record<string, UsuarioDeTeste>;
  let cliente: SupabaseClient;
  test.beforeAll(async () => {
    u = await criarUsuarios("consulta174", { dono: "user" });
    cliente = await clienteDoUsuario(u.dono);
    const criar = async (nome: string, a: Record<string, unknown> = {}) => {
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
        ...a,
      });
      expect(r.error).toBeNull();
      return r.data as string;
    };
    const prazo = (dias: number, unidade: string) => ({ p_prazo_resgate_tipo: "prazo", p_prazo_resgate_dias: dias, p_prazo_resgate_unidade: unidade });
    await criar("Ativo A fictício", { p_veiculos_acesso: ["fundo"], p_indexadores_remuneracao: ["cdi"], ...prazo(0, "uteis"), p_cobertura_fgc: "sim", p_liquidez_imediata: true });
    await criar("Ativo B fictício", { p_veiculos_acesso: ["etf"], p_indexadores_remuneracao: ["ipca"], ...prazo(1, "uteis"), p_regime_tributario: "renda_variavel", p_cobertura_fgc: "nao" });
    await criar("Ativo C fictício", { p_veiculos_acesso: ["fundo", "etf"], p_indexadores_remuneracao: ["cdi", "variacao_cambial"], ...prazo(3, "corridos"), p_cobertura_fgc: "nao_aplicavel" });
    await criar("Ativo E fictício");
    await criar(LONGO, { p_veiculos_acesso: ["certificado_representativo"], p_indexadores_remuneracao: ["sem_indexador"], p_regime_tributario: "previdencia_regressivo", ...prazo(2147483647, "corridos") });
    const d = await criar("Ativo D fictício", { p_veiculos_acesso: ["direto"], p_prazo_resgate_tipo: "no_vencimento" });
    expect((await cliente.rpc("desativar_ativo", { p_ativo: d })).error).toBeNull();
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
    await expect(filtrar(page).getByRole("heading", { level: 2 })).toHaveText(["Produto", "Tributação", "Resgate", "Proteção e exposição"]);
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
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Nenhum ativo corresponde aos filtros" })).toBeVisible();
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
        for (const lista of ["Veículo de acesso", "Indexador da remuneração"]) {
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
