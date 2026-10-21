import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { escolherAtivo } from "./apoio/combobox";
import { prepararCenario } from "./apoio/cenarios";
import { clienteDoUsuario, configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// Telas de ativos, lançamentos e transferências (issue #38). Cada cenário reproduz um caso de
// referência num usuário próprio (D9), pela tela; o resultado é conferido no banco com a sessão
// do próprio usuário. Valores e nomes fictícios.

/* eslint-disable @typescript-eslint/no-explicit-any */

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test.describe("carteira pela tela", () => {
  test.skip(!configurado, "Roda só com o Supabase local configurado.");

  let u: Record<string, UsuarioDeTeste>;
  test.beforeAll(async () => {
    u = await criarUsuarios("carteira", {
      cr01: "user",
      cr03: "user",
      cr04: "user",
      cr05: "user",
      isoa: "user",
      isob: "user",
      oculto: "user",
      a11y: "user",
    });
  });
  test.afterAll(async () => {
    await removerUsuarios(u);
  });

  async function criarAtivo(page: Page, nome: string, tipo = "Rendimento (renda fixa, poupança)") {
    await page.goto("/ativos");
    await page.getByLabel("Nome").fill(nome);
    await page.getByLabel(tipo).check();
    await page.getByRole("button", { name: "Cadastrar ativo" }).click();
    await expect(page.getByText(`Ativo "${nome}" cadastrado.`)).toBeVisible();
  }

  async function preencherLancamento(
    page: Page,
    l: { ativo: string; tipo: string; direcao?: "Ganho" | "Perda"; valor: string; data: string },
  ) {
    await page.goto("/lancamentos/novo");
    await escolherAtivo(page.getByLabel("Ativo"), l.ativo);
    await page.getByLabel("Tipo").selectOption({ label: l.tipo });
    if (l.direcao) await page.getByLabel(l.direcao).check();
    await page.getByLabel("Valor").fill(l.valor);
    await page.getByLabel("Data").fill(l.data);
    await page.getByRole("button", { name: "Registrar lançamento" }).click();
  }

  async function lancar(page: Page, l: Parameters<typeof preencherLancamento>[1]) {
    await preencherLancamento(page, l);
    await expect(page).toHaveURL(new RegExp(`/lancamentos\\?mes=${l.data.slice(0, 7)}$`));
  }

  async function transferir(page: Page, t: { origem: string; destino: string; valor: string; data: string }) {
    await page.goto("/transferencias");
    await escolherAtivo(page.getByLabel("Origem", { exact: true }), t.origem);
    await escolherAtivo(page.getByLabel("Destino", { exact: true }), t.destino);
    await page.getByLabel("Valor").fill(t.valor);
    await page.getByLabel("Data", { exact: true }).fill(t.data);
    await page.getByRole("button", { name: "Transferir" }).click();
  }

  async function eventos(cliente: SupabaseClient): Promise<any[]> {
    const { data, error } = await cliente.from("eventos").select("*").order("criado_em").order("id");
    expect(error).toBeNull();
    return data!;
  }

  async function saldosPorNome(cliente: SupabaseClient): Promise<Record<string, number>> {
    const { data: ativos } = await cliente.from("ativos").select("id, nome, sistema");
    const lista = await eventos(cliente);
    return Object.fromEntries(
      ativos!.map((a: any) => [
        a.sistema === "transito" ? "Em trânsito" : a.nome,
        lista.filter((e) => e.ativo_id === a.id).reduce((s, e) => s + e.valor, 0),
      ]),
    );
  }

  test("CR-01: cada tipo grava o sinal da KB-004, sem que o usuário digite sinal", async ({ page }) => {
    await entrar(page, u.cr01);
    await criarAtivo(page, "Ativo CR-01");
    const base = { ativo: "Ativo CR-01", data: "2026-03-02" };
    await lancar(page, { ...base, tipo: "Aporte", valor: "100,00" });
    await lancar(page, { ...base, tipo: "Resgate", valor: "100,00" });
    await lancar(page, { ...base, tipo: "Rendimento", direcao: "Perda", valor: "5,00" });
    await lancar(page, { ...base, tipo: "Rendimento", direcao: "Ganho", valor: "5,00" });
    await lancar(page, { ...base, tipo: "Marcação a mercado", direcao: "Perda", valor: "3,00" });
    await lancar(page, { ...base, tipo: "Câmbio", direcao: "Ganho", valor: "2,00" });

    const cliente = await clienteDoUsuario(u.cr01);
    expect((await eventos(cliente)).map((e) => [e.tipo, e.valor])).toEqual([
      ["aporte", 10000],
      ["resgate", -10000],
      ["rendimento", -500],
      ["rendimento", 500],
      ["marcacao", -300],
      ["cambio", 200],
    ]);

    // valor_zero, sinal digitado e o defeito O13 são recusados com mensagem, sem gravar nada.
    for (const [valor, mensagem] of [
      ["0,00", "O valor precisa ser maior que zero."],
      ["-10,00", "Digite o valor sem sinal. Para perdas, escolha Perda."],
      ["1234.56", "Use o formato 1.234,56, com vírgula e até duas casas decimais."],
    ]) {
      await preencherLancamento(page, { ...base, tipo: "Aporte", valor });
      await expect(page.getByRole("alert").filter({ hasText: mensagem })).toBeVisible();
    }
    expect(await eventos(cliente)).toHaveLength(6);
    await expect(page.getByLabel("Tipo").locator("option", { hasText: "Migração" })).toHaveCount(0);
  });

  test("CR-03: estorno total pelo detalhe; segundo estorno e estorno de estorno não são oferecidos", async ({ page }) => {
    await entrar(page, u.cr03);
    await criarAtivo(page, "Ativo CR-03");
    await lancar(page, { ativo: "Ativo CR-03", tipo: "Aporte", valor: "5.000,00", data: "2026-03-02" });
    await lancar(page, { ativo: "Ativo CR-03", tipo: "Aporte", valor: "1.000,00", data: "2026-03-10" });
    const cliente = await clienteDoUsuario(u.cr03);
    const e2 = (await eventos(cliente)).find((e) => e.valor === 100000);

    await page.goto(`/lancamentos/${e2.id}`);
    await page.getByRole("button", { name: "Estornar" }).click();
    const dialogo = page.getByRole("dialog", { name: "Estornar lançamento" });
    await expect(dialogo.getByRole("button", { name: "Cancelar" })).toBeFocused();
    await dialogo.getByLabel("Data do estorno").fill("2026-03-12");
    await dialogo.getByRole("button", { name: "Estornar lançamento" }).click();
    // O resultado é o próprio estado da página: o lançamento passa a constar como estornado.
    await expect(page.getByText("Estornado em 12/03/2026")).toBeVisible();

    const lista = await eventos(cliente);
    const e3 = lista.find((e) => e.estorno_de === e2.id);
    expect(e3).toMatchObject({ tipo: "estorno", valor: -100000, data: "2026-03-12" });
    expect(lista.reduce((s, e) => s + e.valor, 0)).toBe(500000); // saldo_calculado_A

    await expect(page.getByRole("button", { name: "Estornar" })).toHaveCount(0);
    await page.goto(`/lancamentos/${e3.id}`);
    await expect(page.getByRole("heading", { level: 1, name: "Estorno de aporte" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Estornar" })).toHaveCount(0);
  });

  test("CR-04: transferência pelo trânsito, com as recusas da tela", async ({ page }) => {
    await entrar(page, u.cr04);
    await criarAtivo(page, "Ativo A");
    await criarAtivo(page, "Ativo B");
    await lancar(page, { ativo: "Ativo A", tipo: "Aporte", valor: "10.000,00", data: "2026-03-20" });
    await transferir(page, { origem: "Ativo A", destino: "Em trânsito", valor: "2.000,00", data: "2026-04-10" });
    await expect(page.getByText("Transferência registrada.")).toBeVisible();
    await transferir(page, { origem: "Em trânsito", destino: "Ativo B", valor: "2.000,00", data: "2026-04-20" });
    await expect(page.getByText("Transferência registrada.")).toBeVisible();

    const cliente = await clienteDoUsuario(u.cr04);
    expect(await saldosPorNome(cliente)).toEqual({ "Ativo A": 800000, "Ativo B": 200000, "Em trânsito": 0 });
    const pernas = (await eventos(cliente)).filter((e) => e.tipo === "transferencia");
    for (const id of new Set(pernas.map((p) => p.transferencia_id))) {
      expect(pernas.filter((p) => p.transferencia_id === id).reduce((s, p) => s + p.valor, 0)).toBe(0);
    }

    await transferir(page, { origem: "Ativo A", destino: "Ativo A", valor: "1,00", data: "2026-04-21" });
    await expect(page.getByRole("alert").filter({ hasText: "Escolha ativos diferentes para a origem e o destino." })).toBeVisible();
    await transferir(page, { origem: "Ativo A", destino: "Ativo B", valor: "0,00", data: "2026-04-21" });
    await expect(page.getByRole("alert").filter({ hasText: "O valor precisa ser maior que zero." })).toBeVisible();
    expect((await eventos(cliente)).filter((e) => e.tipo === "transferencia")).toHaveLength(4);

    // A perna não é estornada sozinha: o detalhe leva às transferências.
    await page.goto(`/lancamentos/${pernas[0].id}`);
    await expect(page.getByRole("button", { name: "Estornar" })).toHaveCount(0);
    await expect(page.getByText("Transferências são corrigidas por inteiro")).toBeVisible();
  });

  test("CR-05: correção da transferência inteira; a segunda correção não é oferecida", async ({ page }) => {
    await entrar(page, u.cr05);
    await criarAtivo(page, "Ativo A");
    await lancar(page, { ativo: "Ativo A", tipo: "Aporte", valor: "10.000,00", data: "2026-03-20" });
    await transferir(page, { origem: "Ativo A", destino: "Em trânsito", valor: "100,00", data: "2026-04-05" });
    await expect(page.getByText("Transferência registrada.")).toBeVisible();

    await page.getByRole("button", { name: "Corrigir" }).click();
    const dialogo = page.getByRole("dialog", { name: "Corrigir transferência" });
    await dialogo.getByLabel("Data da correção").fill("2026-04-08");
    await dialogo.getByRole("button", { name: "Corrigir transferência" }).click();
    await expect(page.getByText("Corrigida em 08/04/2026").first()).toBeVisible();

    const cliente = await clienteDoUsuario(u.cr05);
    const estornos = (await eventos(cliente)).filter((e) => e.tipo === "estorno");
    expect(estornos.map((e) => e.valor).sort((a, b) => a - b)).toEqual([-10000, 10000]);
    expect(estornos.reduce((s, e) => s + e.valor, 0)).toBe(0);
    expect(await saldosPorNome(cliente)).toEqual({ "Ativo A": 1000000, "Em trânsito": 0 });

    await expect(page.getByRole("button", { name: "Corrigir" })).toHaveCount(0);
  });

  test("isolamento: o outro usuário não vê nem altera a carteira, nem por identificador", async ({ page }) => {
    const a = await clienteDoUsuario(u.isoa);
    const ativosA = await prepararCenario(a, [
      { criarAtivo: "x", nome: "Ativo de A", tipoAjuste: "rendimento" },
      { lancar: "x", data: "2026-03-02", tipo: "aporte", valor: 12345 },
    ]);
    const eventoA = (await eventos(a))[0];

    await entrar(page, u.isob);
    await page.goto("/ativos");
    await expect(page.getByText("Ativo de A")).toHaveCount(0);
    expect((await page.goto(`/lancamentos/${eventoA.id}`))?.status()).toBe(404);

    // Ações chamadas com identificadores de A: recusadas sem efeito.
    await criarAtivo(page, "Ativo de B");
    await page.locator('input[type="hidden"][name="ativo"]').evaluateAll((campos, id) => {
      for (const campo of campos) (campo as HTMLInputElement).value = id;
    }, ativosA.x);
    await page.getByRole("button", { name: "Desativar" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Desativar ativo" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Ativo não encontrado." })).toBeVisible();

    await lancar(page, { ativo: "Ativo de B", tipo: "Aporte", valor: "1,00", data: "2026-03-03" });
    const b = await clienteDoUsuario(u.isob);
    await page.goto(`/lancamentos/${(await eventos(b))[0].id}`);
    await page.locator('input[type="hidden"][name="evento"]').evaluate((campo, id) => {
      (campo as HTMLInputElement).value = id;
    }, eventoA.id);
    await page.getByRole("button", { name: "Estornar" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Estornar lançamento" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Lançamento não encontrado." })).toBeVisible();

    const { data: ativosDeA } = await a.from("ativos").select("nome, ativo").eq("id", ativosA.x);
    expect(ativosDeA).toEqual([{ nome: "Ativo de A", ativo: true }]);
    expect(await eventos(a)).toHaveLength(1);
  });

  test("com Ocultar valores ligado, nenhuma quantia aparece; o valor digitado continua visível (P20)", async ({ page, context, baseURL }) => {
    const cliente = await clienteDoUsuario(u.oculto);
    await prepararCenario(cliente, [
      { criarAtivo: "x", nome: "Ativo oculto X", tipoAjuste: "rendimento" },
      { criarAtivo: "y", nome: "Ativo oculto Y", tipoAjuste: "rendimento" },
      { lancar: "x", data: "2026-03-02", tipo: "aporte", valor: 123456 },
    ]);
    await context.addCookies([{ name: "sf_ocultar_valores", value: "1", url: baseURL! }]);
    await entrar(page, u.oculto);
    await transferir(page, { origem: "Ativo oculto X", destino: "Ativo oculto Y", valor: "234,56", data: "2026-03-03" });
    await expect(page.getByText("Transferência registrada.")).toBeVisible();

    const evento = (await eventos(cliente))[0];
    for (const rota of ["/lancamentos?mes=2026-03", `/lancamentos/${evento.id}`, "/transferencias"]) {
      await page.goto(rota);
      const html = await page.content();
      for (const quantia of ["1.234,56", "234,56"]) expect(html, `${rota}: ${quantia}`).not.toContain(quantia);
      // "R$" só pode aparecer como prefixo do campo de valor, nunca seguido de uma quantia.
      expect(html, rota).not.toMatch(/R\$(\s|&nbsp;| )*[−-]?\d/);
      await expect(page.getByText("Valor oculto").first()).toBeAttached();
    }

    await page.goto("/lancamentos/novo");
    await page.getByLabel("Valor").fill("1.234,56");
    await expect(page.getByLabel("Valor")).toHaveValue("1.234,56");

    await page.goto("/lancamentos?mes=2026-03");
    await page.getByRole("button", { name: "Ocultar valores" }).click();
    await expect(page.getByText("R$ 1.234,56").first()).toBeVisible();
  });

  for (const tamanho of [
    { width: 360, height: 800 },
    { width: 1280, height: 900 },
  ]) {
    test(`as telas da carteira não têm violações de acessibilidade em ${tamanho.width} px`, async ({ page }) => {
      await page.setViewportSize(tamanho);
      const cliente = await clienteDoUsuario(u.a11y);
      if ((await eventos(cliente)).length === 0) {
        const ids = await prepararCenario(cliente, [
          { criarAtivo: "x", nome: "Ativo acessível X", tipoAjuste: "rendimento" },
          { criarAtivo: "y", nome: "Ativo acessível Y", tipoAjuste: "marcacao" },
          { lancar: "x", data: "2026-04-02", tipo: "aporte", valor: 50000 },
        ]);
        expect((await cliente.rpc("transferir", { p_origem: ids.x, p_destino: ids.y, p_data: "2026-04-03", p_valor: 1000 })).error).toBeNull();
      }
      await entrar(page, u.a11y);
      const evento = (await eventos(cliente))[0];
      for (const rota of ["/ativos", "/lancamentos?mes=2026-04", "/lancamentos/novo", `/lancamentos/${evento.id}`, "/transferencias"]) {
        await page.goto(rota);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        const resultado = await new AxeBuilder({ page }).withTags(WCAG).analyze();
        expect(resultado.violations, rota).toEqual([]);
      }
      await page.goto("/transferencias");
      await page.getByRole("button", { name: "Corrigir" }).first().click();
      const resultado = await new AxeBuilder({ page }).withTags(WCAG).analyze();
      expect(resultado.violations, "diálogo").toEqual([]);
    });
  }
});
