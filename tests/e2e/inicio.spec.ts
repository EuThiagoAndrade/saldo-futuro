import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mesSeguinte } from "../../src/lib/financeiro/datas";
import { type Passo, prepararCenario } from "./apoio/cenarios";
import { clienteDoUsuario, configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// Início (issue #40). Cada cenário reproduz um caso de referência num usuário próprio (D9). Os
// casos de rentabilidade são montados por fechamentos: com Vi de R$ 10.000,00 e sem fluxos, o
// retorno r de um mês dá Vf = Vi × (1 + r), exato em centavos; o mês N/D é um mês com migração
// histórica (P15). Os números conferidos são os esperados dos casos, como a tela os apresenta.

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const ND = "N/D";

/** Passos que reproduzem os retornos mensais de um caso a partir do início da carteira. */
function porRetornos(inicio: string, retornos: Record<string, number | typeof ND>): Passo[] {
  const passos: Passo[] = [
    { criarAtivo: "A", nome: "Ativo A", tipoAjuste: "rendimento" },
    { lancar: "A", data: `${inicio}-01`, tipo: "aporte", valor: 1000000 },
    { fechar: inicio, saldos: { A: 1000000 } },
  ];
  let vi = 1000000n;
  for (let mes = mesSeguinte(inicio); mes in retornos; mes = mesSeguinte(mes)) {
    const r = retornos[mes];
    if (r === ND) {
      // Migração histórica: o mês fica N/D (P15). Ela leva o patrimônio a um valor redondo, para
      // os retornos seguintes continuarem exatos em centavos.
      const alvo = vi === 1000000n ? 2000000n : 1000000n;
      passos.push({ lancar: "A", data: `${mes}-01`, tipo: "migracao", valor: Number(alvo - vi) });
      vi = alvo;
    } else {
      const [inteiro, fracao = ""] = String(Math.abs(r)).split(".");
      const escala = 10n ** BigInt(fracao.length);
      const numerador = BigInt(inteiro + fracao) * (r < 0 ? -1n : 1n);
      const produto = vi * (escala + numerador);
      expect(produto % escala, `retorno ${r} inexato sobre ${vi}`).toBe(0n);
      vi = produto / escala;
    }
    passos.push({ fechar: mes, saldos: { A: Number(vi) } });
  }
  return passos;
}

test.describe("Início", () => {
  test.skip(!configurado, "Roda só com o Supabase local configurado.");
  test.setTimeout(180_000);

  let u: Record<string, UsuarioDeTeste>;
  test.beforeAll(async () => {
    u = await criarUsuarios("inicio", {
      cr17: "user",
      cr20: "user",
      cr24: "user",
      cr32: "user",
      cr33: "user",
      cr35: "user",
      cr36: "user",
      cr37a: "user",
      cr37b: "user",
      cr51: "user",
      cr52a: "user",
      cr52b: "user",
      volume: "user",
      tela: "user",
    });
  });
  test.afterAll(async () => {
    await removerUsuarios(u);
  });

  async function preparar(usuario: UsuarioDeTeste, passos: Passo[]): Promise<SupabaseClient> {
    const cliente = await clienteDoUsuario(usuario);
    await prepararCenario(cliente, passos);
    return cliente;
  }

  const cartao = (page: Page, titulo: string) => page.locator("div.rounded-md", { has: page.getByText(titulo, { exact: true }) });

  async function verPeriodo(page: Page, periodo: string, de = "", ate = "") {
    const busca = new URLSearchParams({ periodo, de, ate });
    await page.goto(`/?${busca}`);
  }

  test("CR-17: patrimônio de M com o trânsito e distribuição por ativo", async ({ page }) => {
    const cliente = await preparar(u.cr17, [
      { criarAtivo: "A", nome: "Ativo A", tipoAjuste: "rendimento" },
      { lancar: "A", data: "2026-03-02", tipo: "aporte", valor: 1000000 },
      { fechar: "2026-03", saldos: { A: 1000000 } },
    ]);
    const { data: ativos } = await cliente.from("ativos").select("id, sistema");
    const a = ativos!.find((x) => !x.sistema)!.id;
    const t = ativos!.find((x) => x.sistema)!.id;
    expect((await cliente.rpc("transferir", { p_origem: a, p_destino: t, p_data: "2026-04-10", p_valor: 200000 })).error).toBeNull();
    expect((await cliente.rpc("fechar_mes", { p_mes: "2026-04-01", p_saldos: { [a]: 805000 } })).error).toBeNull();

    await entrar(page, u.cr17);
    await expect(cartao(page, "Patrimônio")).toContainText("R$ 10.050,00");
    await expect(cartao(page, "Patrimônio")).toContainText("em 30/04/2026");
    const distribuicao = page.getByRole("figure").filter({ hasText: "Distribuição por ativo em abril de 2026" });
    await distribuicao.getByText("Ver os números").click();
    await expect(distribuicao.getByRole("row", { name: /Ativo A/ })).toContainText("R$ 8.050,00");
    await expect(distribuicao.getByRole("row", { name: /Em trânsito/ })).toContainText("R$ 2.000,00");
  });

  test("CR-20: rentabilidade do mês (Modified Dietz) e variação do patrimônio", async ({ page }) => {
    await preparar(u.cr20, [
      { criarAtivo: "A", nome: "Ativo A", tipoAjuste: "rendimento" },
      { lancar: "A", data: "2026-03-01", tipo: "aporte", valor: 1000000 },
      { fechar: "2026-03", saldos: { A: 1000000 } },
      { lancar: "A", data: "2026-04-15", tipo: "aporte", valor: 100000 },
      { fechar: "2026-04", saldos: { A: 1110000 } },
    ]);
    await entrar(page, u.cr20);
    await expect(cartao(page, "Rentabilidade em abril de 2026")).toContainText("+0,95%");
    await expect(cartao(page, "Variação do patrimônio em abril de 2026")).toContainText("+11,00%");
    await expect(cartao(page, "Patrimônio")).toContainText("R$ 11.100,00");
  });

  test("CR-24: estorno de aporte de mês já fechado", async ({ page }) => {
    const cliente = await preparar(u.cr24, [
      { criarAtivo: "A", nome: "Ativo A", tipoAjuste: "rendimento" },
      { lancar: "A", data: "2025-12-01", tipo: "aporte", valor: 1000000 },
      { fechar: "2025-12", saldos: { A: 1000000 } },
      { lancar: "A", data: "2026-01-20", tipo: "aporte", valor: 100000 },
      { fechar: "2026-01", saldos: { A: 1100000 } },
    ]);
    const { data: e0 } = await cliente.from("eventos").select("id").eq("data", "2026-01-20").single();
    expect((await cliente.rpc("estornar_evento", { p_evento: e0!.id, p_data: "2026-02-05" })).error).toBeNull();
    const { data: ativo } = await cliente.from("ativos").select("id").is("sistema", null).single();
    expect((await cliente.rpc("fechar_mes", { p_mes: "2026-02-01", p_saldos: { [ativo!.id]: 1005000 } })).error).toBeNull();

    await entrar(page, u.cr24);
    await expect(cartao(page, "Rentabilidade em fevereiro de 2026")).toContainText("+0,49%");
  });

  test("CR-32: acumulado desde o início e ano até a data", async ({ page }) => {
    await preparar(u.cr32, porRetornos("2025-12", { "2026-01": 0.01, "2026-02": 0.02, "2026-03": -0.005 }));
    await entrar(page, u.cr32);
    await expect(cartao(page, "Rentabilidade de janeiro de 2026 a março de 2026")).toContainText("+2,50%");
    await verPeriodo(page, "desde_inicio");
    await expect(cartao(page, "Rentabilidade de dezembro de 2025 a março de 2026")).toContainText("+2,50%");
    await verPeriodo(page, "intervalo", "2026-01", "2026-01");
    await expect(cartao(page, "Rentabilidade de janeiro de 2026")).toContainText("+1,00%");
  });

  test("CR-33 e CR-35: mês N/D no período mostra N/D e a sugestão rotulada", async ({ page }) => {
    await preparar(u.cr33, porRetornos("2025-12", { "2026-01": 0.01, "2026-02": ND, "2026-03": 0.02, "2026-04": -0.005 }));
    await entrar(page, u.cr33);
    await expect(cartao(page, "Rentabilidade de janeiro de 2026 a abril de 2026")).toContainText("N/D");
    await expect(page.getByText("De março de 2026 a abril de 2026:")).toContainText("+1,49%");
    await expect(page.getByText("A série base 100 de janeiro de 2026 a abril de 2026 não está disponível")).toBeVisible();
    await verPeriodo(page, "intervalo", "2026-03", "2026-04");
    await expect(cartao(page, "Rentabilidade de março de 2026 a abril de 2026")).toContainText("+1,49%");

    await preparar(u.cr35, porRetornos("2026-01", { "2026-02": ND, "2026-03": 0.01 }));
    await entrar(page, u.cr35);
    await expect(cartao(page, "Rentabilidade de janeiro de 2026 a março de 2026")).toContainText("N/D");
    await expect(page.getByText("De março de 2026:")).toContainText("+1,00%");
  });

  test("CR-36 e CR-37: base 100 e drawdown", async ({ page }) => {
    await preparar(u.cr36, porRetornos("2025-12", { "2026-01": 0.1, "2026-02": -0.2, "2026-03": 0.05, "2026-04": -0.1 }));
    await entrar(page, u.cr36);
    await expect(cartao(page, "Rentabilidade de janeiro de 2026 a abril de 2026")).toContainText("−16,84%");
    await expect(cartao(page, "Maior queda (drawdown) de janeiro de 2026 a abril de 2026")).toContainText("−24,40%");
    const base = page.getByRole("figure").filter({ hasText: "Base 100" });
    await base.getByText("Ver os números").click();
    for (const [mes, valor] of [
      ["janeiro de 2026", "110,00"],
      ["fevereiro de 2026", "88,00"],
      ["março de 2026", "92,40"],
      ["abril de 2026", "83,16"],
    ]) {
      await expect(base.getByRole("row", { name: new RegExp(mes) })).toContainText(valor);
    }

    await preparar(u.cr37a, porRetornos("2025-12", { "2026-01": -0.05, "2026-02": 0.02 }));
    await entrar(page, u.cr37a);
    await expect(cartao(page, "Maior queda (drawdown) de janeiro de 2026 a fevereiro de 2026")).toContainText("−5,00%");

    await preparar(u.cr37b, porRetornos("2025-12", { "2026-01": -0.05, "2026-02": ND }));
    await entrar(page, u.cr37b);
    await expect(cartao(page, "Maior queda (drawdown) de janeiro de 2026 a fevereiro de 2026")).toContainText("N/D");
  });

  test("CR-51: limites dos cinco períodos, sugestão e intervalo depois de M", async ({ page }) => {
    await preparar(u.cr51, porRetornos("2025-11", { "2025-12": 0.01, "2026-01": 0.02, "2026-02": ND, "2026-03": 0.01, "2026-04": -0.005 }));
    await entrar(page, u.cr51);
    await verPeriodo(page, "mes");
    await expect(cartao(page, "Rentabilidade de abril de 2026")).toContainText("−0,50%");
    await verPeriodo(page, "ano");
    await expect(cartao(page, "Rentabilidade de janeiro de 2026 a abril de 2026")).toContainText("N/D");
    await expect(page.getByText("De março de 2026 a abril de 2026:")).toContainText("+0,50%");
    await verPeriodo(page, "12_meses");
    await expect(cartao(page, "Rentabilidade de maio de 2025 a abril de 2026")).toContainText("N/D");
    await verPeriodo(page, "desde_inicio");
    await expect(cartao(page, "Rentabilidade de novembro de 2025 a abril de 2026")).toContainText("N/D");
    await verPeriodo(page, "intervalo", "2025-12", "2026-01");
    await expect(cartao(page, "Rentabilidade de dezembro de 2025 a janeiro de 2026")).toContainText("+3,02%");
    await verPeriodo(page, "intervalo", "2026-03", "2026-05");
    await expect(page.getByRole("alert").filter({ hasText: "Escolha um intervalo que termine até abril de 2026" })).toBeVisible();
  });

  test("CR-52: aportes líquidos do mês aberto e sem fechamento", async ({ page }) => {
    const a = await preparar(u.cr52a, [
      { criarAtivo: "A", nome: "Ativo A", tipoAjuste: "rendimento" },
      { criarAtivo: "B", nome: "Ativo B", tipoAjuste: "marcacao" },
      { lancar: "A", data: "2026-04-20", tipo: "aporte", valor: 30000 },
      { lancar: "A", data: "2026-04-25", tipo: "aporte", valor: 8000 },
      { fechar: "2026-04", saldos: { A: 38000 } },
      { lancar: "A", data: "2026-05-03", tipo: "aporte", valor: 50000 },
      { lancar: "A", data: "2026-05-04", tipo: "rendimento", valor: 2000 },
      { lancar: "A", data: "2026-05-08", tipo: "resgate", valor: -15000 },
    ]);
    const { data: ativos } = await a.from("ativos").select("id, nome");
    const id = (nome: string) => ativos!.find((x) => x.nome === nome)!.id;
    expect((await a.rpc("transferir", { p_origem: id("Ativo A"), p_destino: id("Ativo B"), p_data: "2026-05-06", p_valor: 10000 })).error).toBeNull();
    const { data: e0 } = await a.from("eventos").select("id").eq("data", "2026-04-20").single();
    expect((await a.rpc("estornar_evento", { p_evento: e0!.id, p_data: "2026-05-10" })).error).toBeNull();
    expect((await a.rpc("lancar_evento", { p_ativo: id("Ativo B"), p_data: "2026-05-12", p_tipo: "marcacao", p_valor: -700 })).error).toBeNull();

    await entrar(page, u.cr52a);
    await expect(cartao(page, "Aportes líquidos desde 30/04/2026")).toContainText("R$ 50,00");

    await preparar(u.cr52b, [
      { criarAtivo: "A", nome: "Ativo A", tipoAjuste: "rendimento" },
      { lancar: "A", data: "2026-01-05", tipo: "aporte", valor: 100000 },
      { lancar: "A", data: "2026-01-10", tipo: "resgate", valor: -20000 },
      { lancar: "A", data: "2026-01-31", tipo: "rendimento", valor: 500 },
    ]);
    await entrar(page, u.cr52b);
    await expect(page.getByText("Patrimônio e rentabilidade aparecem depois do primeiro fechamento")).toBeVisible();
    await expect(cartao(page, "Aportes líquidos desde o início")).toContainText("R$ 800,00");
  });

  test("volume: mais de 1.000 eventos no mês aberto entram todos nos aportes líquidos (D13)", async ({ page }) => {
    const cliente = await preparar(u.volume, [
      { criarAtivo: "A", nome: "Ativo A", tipoAjuste: "rendimento" },
      { lancar: "A", data: "2025-12-01", tipo: "aporte", valor: 100000 },
      { fechar: "2025-12", saldos: { A: 100000 } },
    ]);
    const { data: ativo } = await cliente.from("ativos").select("id").is("sistema", null).single();
    for (let lote = 0; lote < 12; lote++) {
      await Promise.all(
        Array.from({ length: 100 }, () =>
          cliente.rpc("lancar_evento", { p_ativo: ativo!.id, p_data: "2026-01-15", p_tipo: "aporte", p_valor: 100 }).then((r) => {
            if (r.error) throw new Error(r.error.message);
          }),
        ),
      );
    }
    await entrar(page, u.volume);
    await expect(cartao(page, "Aportes líquidos desde 31/12/2025")).toContainText("R$ 1.200,00");
  });

  test("ocultação e acessibilidade do Início", async ({ page, context, baseURL }) => {
    await preparar(u.tela, porRetornos("2025-12", { "2026-01": 0.1, "2026-02": -0.2, "2026-03": 0.05, "2026-04": -0.1 }));
    await entrar(page, u.tela);
    for (const tamanho of [
      { width: 360, height: 800 },
      { width: 1280, height: 900 },
    ]) {
      await page.setViewportSize(tamanho);
      await page.goto("/");
      for (const numeros of await page.getByText("Ver os números").all()) await numeros.click();
      expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations, `${tamanho.width}`).toEqual([]);
    }

    await context.addCookies([{ name: "sf_ocultar_valores", value: "1", url: baseURL! }]);
    await page.goto("/");
    const html = await page.content();
    expect(html).not.toMatch(/R\$(\s|&nbsp;| )*[−-]?\d/);
    expect(html).not.toContain("8.316,00");
    await expect(page.getByText("−16,84%").first()).toBeVisible(); // percentuais continuam (D8)
  });
});
