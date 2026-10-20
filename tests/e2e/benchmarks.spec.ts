import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createServer } from "node:http";
import { prepararCenario } from "./apoio/cenarios";
import type { SupabaseClient } from "@supabase/supabase-js";
import { lerComposicao, lerTabela, marcaBenchmark } from "../../src/lib/leitura";
import { sqlLocal } from "./apoio/banco";
import { clienteDoUsuario, configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// As séries de benchmark são globais. Todo teste que as usa fica neste arquivo serial (D9), que
// limpa as séries no início e no fim. Valores fictícios, gravados pela função de carga, como admin.

test.describe("séries de benchmark", () => {
  test.skip(!configurado, "Roda só com o Supabase local configurado.");
  test.describe.configure({ mode: "serial" });

  let u: Record<string, UsuarioDeTeste>;
  let admin: SupabaseClient;
  let cdi: string;
  let ipca: string;
  let modo = "sucesso";
  let chamadas = 0;
  const fonte = createServer((request, response) => {
    chamadas++;
    const url = new URL(request.url!, "http://127.0.0.1");
    if (modo === "lenta") return; // O prazo real de 45 s da rota aborta a conexão.
    if (modo === "falha_segunda" && chamadas === 2) { response.writeHead(503); response.end("indisponível"); return; }
    response.setHeader("Content-Type", "application/json");
    if (modo === "sem_valores") { response.end("[]"); return; }
    if (modo === "invalida") { response.end("<html>"); return; }
    response.end(JSON.stringify([{ data: url.searchParams.get("dataInicial"), valor: "0.8" }, ...(url.searchParams.get("dataFinal") === url.searchParams.get("dataInicial") ? [] : [{ data: url.searchParams.get("dataFinal"), valor: "0.8" }])]));
  });

  const limparSeries = () => sqlLocal("delete from public.valores_benchmark; delete from public.coberturas_benchmark;");

  test.beforeAll(async () => {
    limparSeries();
    await new Promise<void>((resolve, reject) => { fonte.once("error", reject); fonte.listen(43141, "127.0.0.1", resolve); });
    u = await criarUsuarios("benchmarks", { admin: "admin", cr44a: "user", cr44b: "user", cr45a: "user", cr45b: "user", cr47: "user", vazio: "user" });
    admin = await clienteDoUsuario(u.admin);
    const { data, error } = await admin.from("benchmarks").select("id").eq("nome", "CDI").single();
    expect(error).toBeNull();
    cdi = data!.id;
    ipca = (await admin.from("benchmarks").select("id").eq("nome", "IPCA").single()).data!.id;
  });
  test.afterAll(async () => {
    limparSeries();
    await removerUsuarios(u);
    fonte.closeAllConnections();
    await new Promise<void>((resolve) => fonte.close(() => resolve()));
  });

  /** n dias seguidos a partir de 2000-01-01, todos com o mesmo valor fictício. */
  function dias(n: number, valor: string) {
    return Array.from({ length: n }, (_, i) => ({
      data: new Date(Date.UTC(2000, 0, 1 + i)).toISOString().slice(0, 10),
      valor,
    }));
  }

  async function carregar(valores: { data: string; valor: string }[]) {
    const { error } = await admin.rpc("carregar_benchmark", {
      p_benchmark: cdi,
      p_data_inicial: valores[0].data,
      p_data_final: valores.at(-1)!.data,
      p_valores: valores,
    });
    expect(error).toBeNull();
  }

  const lerValores = (opcoes: Parameters<typeof lerTabela>[2] = {}) =>
    lerTabela<{ data: string; valor: number }>(admin, "valores_benchmark", {
      colunas: "data, valor",
      filtrar: (consulta) => consulta.eq("benchmark_id", cdi),
      ...opcoes,
    });

  test("uma série com mais de 1.000 valores é lida inteira, em ordem de data", async () => {
    const serie = dias(1200, "0.04");
    await carregar(serie);
    const lidos = await lerValores();
    expect(lidos).toHaveLength(1200);
    expect(lidos.map((v) => v.data)).toEqual(serie.map((v) => v.data));
  });

  test("substituição da série entre páginas, com contagem e datas iguais: uma versão inteira", async () => {
    let substituiu = false;
    const { insumos } = await lerComposicao(
      () => marcaBenchmark(admin, cdi),
      () =>
        lerValores({
          tamanho: 500,
          aposPagina: async (indice) => {
            if (indice === 0 && !substituiu) {
              substituiu = true;
              await carregar(dias(1200, "0.05"));
            }
          },
        }),
    );
    expect(insumos).toHaveLength(1200);
    expect(new Set(insumos.map((v) => Number(v.valor)))).toEqual(new Set([0.05]));
  });

  test("substituição entre a cobertura e os valores: cobertura e valores da mesma versão", async () => {
    let substituiu = false;
    const { marca, insumos } = await lerComposicao(
      () => marcaBenchmark(admin, cdi),
      async () => {
        if (!substituiu) {
          substituiu = true;
          await carregar(dias(1200, "0.06"));
        }
        return lerValores();
      },
    );
    expect(new Set(insumos.map((v) => Number(v.valor)))).toEqual(new Set([0.06]));
    expect(marca).toEqual(await marcaBenchmark(admin, cdi));
  });

  const cartao = (page: Page, titulo: string) => page.locator("dl > div", { has: page.getByText(titulo, { exact: true }) });
  async function carteira(nome: string, saldos: number[]) {
    const cliente = await clienteDoUsuario(u[nome]);
    await prepararCenario(cliente, [
      { criarAtivo: "A", nome: "Ativo A", tipoAjuste: "rendimento" },
      { lancar: "A", data: "2025-12-01", tipo: "aporte", valor: 1000000 },
      { fechar: "2025-12", saldos: { A: 1000000 } },
      ...saldos.map((saldo, i) => ({ fechar: `2026-0${i + 1}`, saldos: { A: saldo } })),
    ]);
  }
  async function serie(id: string, valores: { data: string; valor: string }[], inicio = valores[0].data) {
    expect((await admin.rpc("carregar_benchmark", { p_benchmark: id, p_data_inicial: inicio, p_data_final: valores.at(-1)!.data, p_valores: valores })).error).toBeNull();
  }
  const comparar = (page: Page, id: string) => page.goto(`/benchmarks/comparacao?benchmark=${id}`);

  test("CR-44: comparação pelos acumulados e base 100 dos dois lados", async ({ page }) => {
    limparSeries();
    await carteira("cr44a", [1009000]);
    await carteira("cr44b", [1010000, 1030200]);
    await serie(ipca, [{ data: "2026-01-01", valor: "0.8" }, { data: "2026-02-01", valor: "0.8" }]);
    await entrar(page, u.cr44a);
    await comparar(page, ipca);
    await expect(cartao(page, "Diferença")).toContainText("+0,10 p.p.");
    await expect(cartao(page, "% do IPCA")).toContainText("112,50%");
    await entrar(page, u.cr44b);
    await comparar(page, ipca);
    await expect(cartao(page, "Rentabilidade da carteira")).toContainText("+3,02%");
    await expect(cartao(page, "Rentabilidade do IPCA")).toContainText("+1,61%");
    await expect(cartao(page, "Diferença")).toContainText("+1,41 p.p.");
    await expect(cartao(page, "% do IPCA")).toContainText("188,00%");
    await expect(cartao(page, "Taxa de acerto")).toContainText("100,00%");
    await page.getByText("Ver os números").click();
    await expect(page.getByRole("figure").getByRole("row", { name: /fevereiro de 2026/ })).toContainText("103,02");
    await expect(page.getByRole("figure").getByRole("row", { name: /fevereiro de 2026/ })).toContainText("101,61");
    const grafico = page.locator('svg[aria-labelledby="comparacao-base100-titulo comparacao-base100-descricao"]');
    await expect(grafico.locator('polyline[stroke-dasharray="6 4"]')).toHaveCount(1);
    await expect(grafico.locator('polyline:not([stroke-dasharray])')).toHaveCount(1);
    await expect(grafico).toContainText("IPCA");
    await expect(grafico).toContainText("Carteira");
    await expect(grafico).toContainText("100,00");
    // Mesmo benchmark público, carteira restrita ao dono: outro usuário não herda os retornos.
    await entrar(page, u.vazio);
    await comparar(page, ipca);
    await expect(page.getByRole("heading", { name: "A comparação aparece depois do primeiro fechamento" })).toBeVisible();
  });

  test("CR-45: benchmark negativo ou zero mostra N/D em % do benchmark", async ({ page }) => {
    for (const [nome, valor, diferenca] of [["cr45a", "-0.32", "+1,52 p.p."], ["cr45b", "0", "+1,20 p.p."]]) {
      limparSeries();
      await carteira(nome, [1012000]);
      await serie(ipca, [{ data: "2026-01-01", valor }]);
      await entrar(page, u[nome]); await comparar(page, ipca);
      await expect(cartao(page, "% do IPCA")).toContainText("N/D");
      await expect(cartao(page, "Diferença")).toContainText(diferenca);
    }
  });

  test("CR-47: mês parcial rotulado, três medidas N/D e nenhuma série parcial desenhada; axe", async ({ page }) => {
    limparSeries();
    await carteira("cr47", [1010000, 1030200]);
    await serie(cdi, [{ data: "2026-01-02", valor: "0.8" }, { data: "2026-02-02", valor: "0.5" }], "2026-01-01");
    await entrar(page, u.cr47);
    for (const width of [360, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await comparar(page, cdi);
      for (const titulo of ["Diferença", "% do CDI", "Taxa de acerto"]) await expect(cartao(page, titulo)).toContainText("N/D");
      await expect(page.getByText("Parcial —", { exact: false }).filter({ visible: true })).toBeVisible();
      expect(await page.locator("svg polyline[stroke-dasharray]").count()).toBe(0);
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `local/issue-41/comparacao-${width}.png`, fullPage: true });
    }
    await page.goto(`/benchmarks/comparacao?benchmark=${cdi}&periodo=intervalo&de=2026-02&ate=2026-01`);
    await expect(page.getByRole("alert").filter({ hasText: "Escolha um intervalo" })).toContainText("intervalo válido");
  });

  test("sem sessão e usuário comum recusados na rota; página admin é 404; confirmação e origem obrigatórias", async ({ page, request }) => {
    const payload = { benchmark: cdi, inicio: "2026-01-01", fim: "2026-01-02", confirmado: true };
    expect((await request.post("/api/benchmarks/sincronizar", { data: payload })).status()).toBe(401);
    await entrar(page, u.vazio);
    expect((await page.goto("/admin/benchmarks"))?.status()).toBe(404);
    expect((await page.request.post("/api/benchmarks/sincronizar", { data: payload })).status()).toBe(403);
    await entrar(page, u.admin);
    expect((await page.request.post("/api/benchmarks/sincronizar", { data: payload, headers: { origin: "https://outro.example.com" } })).status()).toBe(403);
    expect((await page.request.post("/api/benchmarks/sincronizar", { data: { ...payload, confirmado: false }, headers: { origin: "http://127.0.0.1:3000" } })).status()).toBe(400);
  });

  async function abrir(page: Page, inicio: string, fim: string) {
    await page.goto("/admin/benchmarks");
    await page.getByLabel("Data inicial (CDI)").fill(inicio);
    await page.getByLabel("Data final (CDI)").fill(fim);
    await page.getByRole("button", { name: "Sincronizar CDI", exact: true }).click();
    return page.getByRole("dialog", { name: "Sincronizar CDI?" });
  }
  async function estadoSerie() {
    return { valores: await lerValores(), cobertura: await marcaBenchmark(admin, cdi) };
  }

  test("sincronização confirma antes de buscar, grava tudo, relê cobertura e repetir preserva valores/cobertura", async ({ page }) => {
    limparSeries(); modo = "sucesso"; chamadas = 0;
    await entrar(page, u.admin);
    let d = await abrir(page, "2006-01-01", "2016-01-31");
    expect(chamadas).toBe(0);
    await expect(d.getByRole("button", { name: "Cancelar" })).toBeFocused();
    await d.getByRole("button", { name: "Cancelar" }).click(); expect(chamadas).toBe(0);
    d = await abrir(page, "2006-01-01", "2016-01-31");
    await page.keyboard.press("Escape"); await expect(d).toBeHidden(); expect(chamadas).toBe(0);
    d = await abrir(page, "2006-01-01", "2016-01-31");
    await d.getByRole("button", { name: "Confirmar sincronização de CDI" }).click();
    await expect(d).toBeHidden();
    expect(chamadas).toBe(2);
    await expect(page.getByTestId("cobertura-CDI")).toContainText("até 31/01/2016");
    const antes = await estadoSerie();
    d = await abrir(page, "2006-01-01", "2016-01-31");
    await d.getByRole("button", { name: "Confirmar sincronização de CDI" }).click(); await expect(d).toBeHidden();
    const depois = await estadoSerie();
    expect(depois.valores).toEqual(antes.valores);
    expect(depois.cobertura?.inicio).toBe(antes.cobertura?.inicio);
    expect(depois.cobertura?.fim).toBe(antes.cobertura?.fim);
    for (const width of [360, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
      await page.screenshot({ path: `local/issue-41/admin-${width}.png`, fullPage: true });
      await page.goto("/benchmarks");
      await expect(page.getByText(/Disponível de 01\/01\/2006 até 31\/01\/2016/)).toBeVisible();
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
      await page.screenshot({ path: `local/issue-41/catalogo-${width}.png`, fullPage: true });
      await page.goto("/admin/benchmarks");
    }
  });

  test("falha na segunda janela, JSON inválido e sem valores preservam todo o banco e permitem tentar novamente", async ({ page }) => {
    await entrar(page, u.admin);
    for (const falha of ["falha_segunda", "invalida", "sem_valores"]) {
      modo = falha; chamadas = 0; const antes = await estadoSerie();
      const d = await abrir(page, "2006-01-01", "2016-01-31");
      await d.getByRole("button", { name: "Confirmar sincronização de CDI" }).click();
      await expect(d.getByRole("alert")).toContainText("Nenhum valor foi gravado");
      await expect(d.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
      expect(await estadoSerie()).toEqual(antes);
      await d.getByRole("button", { name: "Cancelar" }).click();
    }
    modo = "sucesso";
    const antes = await estadoSerie();
    const d = await abrir(page, "2026-01-01", "2026-01-02");
    await d.getByRole("button", { name: "Confirmar sincronização de CDI" }).click();
    await expect(d.getByRole("alert")).toContainText("buraco");
    expect(await estadoSerie()).toEqual(antes);
  });

  test("fonte lenta: prazo real de 45 segundos aborta e não grava nada", async ({ page }) => {
    test.setTimeout(75_000);
    modo = "lenta"; chamadas = 0; const antes = await estadoSerie();
    await entrar(page, u.admin);
    const d = await abrir(page, "2006-01-01", "2016-01-31");
    const comeco = Date.now();
    await d.getByRole("button", { name: "Confirmar sincronização de CDI" }).click();
    await expect(d.getByRole("alert")).toContainText("tempo de busca esgotou", { timeout: 55_000 });
    expect(Date.now() - comeco).toBeGreaterThanOrEqual(44_000);
    expect(chamadas).toBe(1); expect(await estadoSerie()).toEqual(antes);
    await expect(d.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
    fonte.closeAllConnections(); modo = "sucesso";
  });

  test("resposta perdida depois da gravação: a tela relê a cobertura real", async ({ page }) => {
    modo = "sucesso"; limparSeries(); await entrar(page, u.admin);
    await page.route("**/api/benchmarks/sincronizar", async (route) => {
      expect((await route.fetch()).status()).toBe(200);
      await route.abort("failed");
    });
    const d = await abrir(page, "2026-01-01", "2026-01-02");
    await d.getByRole("button", { name: "Confirmar sincronização de CDI" }).click();
    await expect(d.getByRole("alert")).toContainText("resposta da sincronização não chegou");
    await expect(page.getByTestId("cobertura-CDI")).toContainText("até 02/01/2026");
    expect((await estadoSerie()).valores).toHaveLength(2);
  });
});
