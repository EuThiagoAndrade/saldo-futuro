import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { prepararCenario } from "./apoio/cenarios";
import { clienteDoUsuario, configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// Cadastro em /ativos/novo e abas por URL (#106, BL-006). Usuários e nomes fictícios exclusivos
// deste arquivo (D9 do ciclo 004).

const MOVEL = { width: 360, height: 800 };
const DESKTOP = { width: 1280, height: 900 };
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
// 96 caracteres; com o sufixo " 2", 98, dentro do limite de 100 do banco.
const LONGO = "Fundo fictício de renda fixa com um nome bem comprido para conferir a quebra de linha no celular";

test.describe("ativos (#106)", () => {
  test.skip(!configurado, "Roda só com o Supabase local configurado.");
  test.describe.configure({ mode: "serial" });

  let u: Record<string, UsuarioDeTeste>;
  let cliente: SupabaseClient;
  let ids: Record<string, string>;
  test.beforeAll(async () => {
    u = await criarUsuarios("ativos106", { vazio: "user", lista: "user" });
    cliente = await clienteDoUsuario(u.lista);
    ids = await prepararCenario(cliente, [
      { criarAtivo: "longo", nome: LONGO, tipoAjuste: "rendimento" },
      { criarAtivo: "acao", nome: "Ação fictícia", tipoAjuste: "marcacao" },
      { criarAtivo: "antigo", nome: "Ativo antigo fictício", tipoAjuste: "rendimento" },
      { lancar: "acao", data: "2026-03-02", tipo: "aporte", valor: 10000 },
    ]);
    expect((await cliente.rpc("desativar_ativo", { p_ativo: ids.antigo })).error).toBeNull();
  });
  test.afterAll(async () => {
    if (u) await removerUsuarios(u);
  });

  const visivel = (page: Page, texto: string) => page.getByRole("main").getByText(texto, { exact: true }).filter({ visible: true });
  const aba = (page: Page, nome: "Em uso" | "Desativados") =>
    page.getByRole("navigation", { name: "Situação dos ativos" }).getByRole("link", { name: new RegExp(`^${nome}`) });

  test("sem ativos, as duas abas mostram o estado vazio e Novo ativo fica no topo", async ({ page }) => {
    await entrar(page, u.vazio);
    await page.goto("/ativos");
    const novo = page.getByRole("main").getByRole("link", { name: "Novo ativo" });
    await expect(novo).toHaveAttribute("href", "/ativos/novo");
    expect((await novo.boundingBox())!.y).toBeLessThan((await aba(page, "Em uso").boundingBox())!.y);
    await expect(aba(page, "Em uso")).toHaveAttribute("aria-current", "page");
    await expect(aba(page, "Em uso")).toHaveText(/Em uso\s*0/);
    await expect(page.getByRole("heading", { name: "Nenhum ativo em uso" })).toBeVisible();
    await aba(page, "Desativados").click();
    await expect(page).toHaveURL(/\/ativos\?aba=desativados$/);
    await expect(page.getByRole("heading", { name: "Nenhum ativo desativado" })).toBeVisible();
  });

  test("o cadastro fica só em /ativos/novo: a recusa mantém a página e o sucesso volta à lista sem mensagem", async ({ page }) => {
    await entrar(page, u.vazio);
    await page.goto("/ativos");
    await expect(page.locator("#ativo-nome")).toHaveCount(0);
    await page.getByRole("main").getByRole("link", { name: "Novo ativo" }).click();
    await expect(page).toHaveURL(/\/ativos\/novo$/);
    await expect(page.getByRole("heading", { level: 1, name: "Novo ativo" })).toBeVisible();

    // Só espaços passam pelo navegador e são recusados pelo servidor, sem gravar nada.
    await page.getByLabel("Nome").fill("   ");
    await page.getByLabel("Rendimento (renda fixa, poupança)").check();
    await page.getByRole("button", { name: "Cadastrar ativo" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("Informe o nome do ativo.");
    await expect(page).toHaveURL(/\/ativos\/novo$/);
    const vazio = await clienteDoUsuario(u.vazio);
    expect((await vazio.from("ativos").select("id")).data).toEqual([]);

    await page.getByLabel("Nome").fill("Poupança fictícia");
    await page.getByLabel("Rendimento (renda fixa, poupança)").check();
    await page.getByRole("button", { name: "Cadastrar ativo" }).click();
    await expect(page).toHaveURL(/\/ativos$/);
    await expect(visivel(page, "Poupança fictícia")).toBeVisible();
    await expect(page.getByText(/cadastrado/)).toHaveCount(0);

    await page.goto("/ativos/novo");
    await page.getByRole("link", { name: "Voltar para Ativos" }).click();
    await expect(page).toHaveURL(/\/ativos$/);
  });

  test("abas pela URL: contadores, só a lista selecionada, parâmetro inválido, recarga e histórico", async ({ page }) => {
    await entrar(page, u.lista);
    await page.goto("/ativos?aba=qualquer");
    await expect(aba(page, "Em uso")).toHaveAttribute("aria-current", "page");
    // Em uso conta também o ativo de sistema Em trânsito, como a lista mostra.
    await expect(aba(page, "Em uso")).toHaveText(/Em uso\s*3/);
    await expect(aba(page, "Desativados")).toHaveText(/Desativados\s*1/);
    await expect(visivel(page, "Ação fictícia")).toBeVisible();
    await expect(page.getByText("Ativo antigo fictício")).toHaveCount(0);

    await aba(page, "Desativados").click();
    await expect(page).toHaveURL(/\/ativos\?aba=desativados$/);
    await expect(aba(page, "Desativados")).toHaveAttribute("aria-current", "page");
    await expect(visivel(page, "Ativo antigo fictício")).toBeVisible();
    await expect(page.getByText(/Desativado em \d{2}\/\d{2}\/\d{4}/)).toBeVisible();
    await expect(page.getByText("Ação fictícia", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("main").getByRole("button", { name: "Desativar" })).toHaveCount(0);

    await page.reload();
    await expect(aba(page, "Desativados")).toHaveAttribute("aria-current", "page");
    await page.goBack();
    await expect(page).toHaveURL(/\/ativos\?aba=qualquer$/);
    await expect(aba(page, "Em uso")).toHaveAttribute("aria-current", "page");
    await page.goForward();
    await expect(aba(page, "Desativados")).toHaveAttribute("aria-current", "page");
  });

  test("desativação preservada: trânsito sem ação, saldo não zero recusado e saldo zero desativado", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.lista);
    await page.goto("/ativos");
    const linha = (nome: string) => page.getByRole("row").filter({ hasText: nome });
    await expect(linha("Em trânsito").getByRole("button")).toHaveCount(0);
    await expect(linha("Em trânsito")).toContainText("Só recebe transferências");

    await linha("Ação fictícia").getByRole("button", { name: "Desativar" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Desativar ativo" }).click();
    await expect(page.getByRole("dialog").getByRole("alert")).toHaveText("Só é possível desativar um ativo com saldo zero.");
    await page.getByRole("dialog").getByRole("button", { name: "Cancelar" }).click();

    await linha(LONGO).getByRole("button", { name: "Desativar" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Desativar ativo" }).click();
    await expect(linha(LONGO)).toHaveCount(0);
    await expect(aba(page, "Desativados")).toHaveText(/Desativados\s*2/);
    await aba(page, "Desativados").click();
    await expect(visivel(page, LONGO)).toBeVisible();
    expect((await cliente.from("ativos").select("ativo").eq("id", ids.acao)).data).toEqual([{ ativo: true }]);
  });

  test("no celular, a lista densa mostra o nome inteiro, sem rolagem horizontal e com ação de 44 px", async ({ page }) => {
    expect((await cliente.rpc("criar_ativo", { p_nome: `${LONGO} 2`, p_tipo_ajuste: "rendimento" })).error).toBeNull();
    await page.setViewportSize(MOVEL);
    await entrar(page, u.lista);
    await page.goto("/ativos");
    await expect(page.getByRole("table")).toBeHidden();
    const nome = visivel(page, `${LONGO} 2`);
    await expect(nome).toBeVisible();
    const medida = await nome.evaluate((el) => ({
      overflow: getComputedStyle(el).textOverflow,
      cabe: el.scrollWidth <= el.clientWidth,
      altura: el.getBoundingClientRect().height,
      linha: parseFloat(getComputedStyle(el).lineHeight),
    }));
    expect(medida.overflow).not.toBe("ellipsis");
    expect(medida.cabe).toBe(true);
    expect(medida.altura).toBeGreaterThan(medida.linha);
    for (const botao of await page.getByRole("main").getByRole("button", { name: "Desativar" }).all()) {
      expect((await botao.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    for (const link of [aba(page, "Em uso"), aba(page, "Desativados"), page.getByRole("main").getByRole("link", { name: "Novo ativo" })]) {
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    const largura = await page.evaluate(() => ({ cliente: document.documentElement.clientWidth, rolagem: document.documentElement.scrollWidth }));
    expect(largura.rolagem).toBeLessThanOrEqual(largura.cliente);
  });

  for (const tamanho of [MOVEL, DESKTOP]) {
    test(`sem violações de acessibilidade nas duas abas e no cadastro em ${tamanho.width} px`, async ({ page }) => {
      await page.setViewportSize(tamanho);
      await entrar(page, u.lista);
      for (const rota of ["/ativos", "/ativos?aba=desativados", "/ativos/novo"]) {
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
