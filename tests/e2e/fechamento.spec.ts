import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hojeEmCuiaba, mesDe } from "../../src/lib/financeiro/datas";
import { prepararCenario } from "./apoio/cenarios";
import { clienteDoUsuario, configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// Fechamento mensal pela tela (issue #39). Cada cenário reproduz um caso num usuário próprio
// (D9); o resultado é conferido no banco com a sessão do usuário. Valores fictícios.

/* eslint-disable @typescript-eslint/no-explicit-any */

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

function mesAnterior(mes: string): string {
  const [ano, m] = mes.split("-").map(Number);
  return m === 1 ? `${ano - 1}-12` : `${ano}-${String(m - 1).padStart(2, "0")}`;
}

test.describe("fechamento pela tela", () => {
  test.skip(!configurado, "Roda só com o Supabase local configurado.");

  let u: Record<string, UsuarioDeTeste>;
  test.beforeAll(async () => {
    u = await criarUsuarios("fechamento", { cr12: "user", cr13: "user", cr15: "user", terminado: "user", tela: "user" });
  });
  test.afterAll(async () => {
    await removerUsuarios(u);
  });

  /** Saldos iniciais do caso: fevereiro fechado com A e B (KB-004, CR-12 e CR-13). */
  async function fevereiroFechado(cliente: SupabaseClient, a: number, b: number, tipoB: "rendimento" | "marcacao") {
    return prepararCenario(cliente, [
      { criarAtivo: "A", nome: "Ativo A", tipoAjuste: "rendimento" },
      { criarAtivo: "B", nome: "Ativo B", tipoAjuste: tipoB },
      { lancar: "A", data: "2026-02-02", tipo: "aporte", valor: a },
      { lancar: "B", data: "2026-02-02", tipo: "aporte", valor: b },
      { fechar: "2026-02", saldos: { A: a, B: b } },
    ]);
  }

  async function consolidado(cliente: SupabaseClient, mes: string): Promise<any> {
    const { data, error } = await cliente
      .from("consolidados_mensais")
      .select("vi, vf, aportes, resgates, rendimento, marcacao, cambio, migracao")
      .eq("mes", `${mes}-01`);
    expect(error).toBeNull();
    return data![0] ?? null;
  }

  async function fecharPelaTela(page: Page, mes: string, rotulo: string, saldos: Record<string, string>) {
    await page.goto(`/lancamentos/fechamento/${mes}`);
    for (const [nome, valor] of Object.entries(saldos)) await page.getByLabel(`Saldo real de ${nome}`).fill(valor);
    await page.getByRole("button", { name: "Revisar fechamento" }).click();
    await page.getByRole("button", { name: `Fechar ${rotulo}` }).click();
    await expect(page.getByRole("heading", { name: "Mês fechado" })).toBeVisible();
  }

  test("CR-12 e CR-16: fechamento com ajustes positivo e negativo, reabertura e novo fechamento", async ({ page }) => {
    const cliente = await clienteDoUsuario(u.cr12);
    const ids = await fevereiroFechado(cliente, 1000000, 500000, "marcacao");
    expect((await cliente.rpc("lancar_evento", { p_ativo: ids.A, p_data: "2026-03-10", p_tipo: "aporte", p_valor: 10000 })).error).toBeNull();

    await entrar(page, u.cr12);
    await page.goto("/lancamentos/fechamento/2026-03");
    await expect(page.getByText("R$ 10.100,00")).toBeVisible(); // saldo calculado de A
    await expect(page.getByText("R$ 5.000,00").first()).toBeVisible(); // saldo calculado de B
    await page.getByLabel("Saldo real de Ativo A").fill("10.150,00");
    await page.getByLabel("Saldo real de Ativo B").fill("4.800,00");
    await page.getByRole("button", { name: "Revisar fechamento" }).click();
    const revisao = page.getByRole("region", { name: "2. Revisão" });
    await expect(revisao.getByText("+R$ 50,00")).toBeVisible();
    await expect(revisao.getByText("−R$ 200,00")).toHaveCount(2); // ajuste de B e o total de marcação
    await expect(revisao.getByText("R$ 14.950,00")).toBeVisible();
    // Os saldos digitados continuam no formulário depois da revisão.
    await expect(page.getByLabel("Saldo real de Ativo A")).toHaveValue("10.150,00");
    await page.getByRole("button", { name: "Fechar março de 2026" }).click();
    await expect(page.getByRole("heading", { name: "Mês fechado" })).toBeVisible();

    const esperado = { vi: 1500000, vf: 1495000, aportes: 10000, resgates: 0, rendimento: 5000, marcacao: -20000, cambio: 0, migracao: 0 };
    expect(await consolidado(cliente, "2026-03")).toEqual(esperado);
    const { data: posicoes } = await cliente.from("posicoes_mensais").select("ativo_id, ajuste, tipo_ajuste").eq("mes", "2026-03-01");
    expect(new Map(posicoes!.map((p: any) => [p.ativo_id, [p.ajuste, p.tipo_ajuste]]))).toEqual(
      new Map([
        [ids.A, [5000, "rendimento"]],
        [ids.B, [-20000, "marcacao"]],
      ]),
    );

    // CR-16: reabrir volta ao estado anterior; fechar de novo dá o mesmo consolidado.
    await page.getByRole("button", { name: "Reabrir mês" }).click();
    await page.getByRole("dialog", { name: "Reabrir março de 2026" }).getByRole("button", { name: "Reabrir mês" }).click();
    await expect(page.getByRole("button", { name: "Revisar fechamento" })).toBeVisible();
    expect(await consolidado(cliente, "2026-03")).toBeNull();
    expect((await cliente.from("posicoes_mensais").select("ativo_id").eq("mes", "2026-03-01")).data).toEqual([]);
    await expect(page.getByText("R$ 10.100,00")).toBeVisible();

    await fecharPelaTela(page, "2026-03", "março de 2026", { "Ativo A": "10.150,00", "Ativo B": "4.800,00" });
    expect((await consolidado(cliente, "2026-03")).vf).toBe(1495000);
  });

  test("CR-13: fechamento recusado por pendência, sem gravar nada", async ({ page }) => {
    const cliente = await clienteDoUsuario(u.cr13);
    await fevereiroFechado(cliente, 100000, 50000, "rendimento");
    await entrar(page, u.cr13);
    await page.goto("/lancamentos/fechamento/2026-03");
    await page.getByLabel("Saldo real de Ativo A").fill("1.000,00");
    await page.getByRole("button", { name: "Revisar fechamento" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Informe o saldo real de: Ativo B." })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Fechar / })).toHaveCount(0);
    expect(await consolidado(cliente, "2026-03")).toBeNull();
  });

  test("CR-15: só o mês seguinte fecha e só o último fechado reabre", async ({ page }) => {
    const cliente = await clienteDoUsuario(u.cr15);
    await prepararCenario(cliente, [
      { criarAtivo: "A", nome: "Ativo A", tipoAjuste: "rendimento" },
      { lancar: "A", data: "2026-01-05", tipo: "aporte", valor: 100000 },
      { fechar: "2026-01", saldos: { A: 100000 } },
      { fechar: "2026-02", saldos: { A: 100000 } },
    ]);
    await entrar(page, u.cr15);

    await page.goto("/lancamentos/fechamento/2026-04"); // s1: sequência
    await expect(page.getByText("Os meses são fechados em ordem")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ir para março de 2026" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Revisar fechamento" })).toHaveCount(0);

    await page.goto("/lancamentos/fechamento/2026-01"); // s2: reabertura
    await expect(page.getByRole("heading", { name: "Mês fechado" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reabrir mês" })).toHaveCount(0);
    await expect(page.getByText("Só o último mês fechado pode ser reaberto")).toBeVisible();

    await fecharPelaTela(page, "2026-03", "março de 2026", { "Ativo A": "1.000,00" }); // s3: aceito

    await page.goto("/lancamentos/fechamento/2026-02"); // s4: reabertura
    await expect(page.getByRole("button", { name: "Reabrir mês" })).toHaveCount(0);

    await page.goto("/lancamentos/fechamento/2026-03"); // s5: aceito
    await page.getByRole("button", { name: "Reabrir mês" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Reabrir mês" }).click();
    await expect(page.getByRole("button", { name: "Revisar fechamento" })).toBeVisible();
    expect(await consolidado(cliente, "2026-03")).toBeNull();
  });

  test("mês terminado: o Início avisa, o anterior fecha e o corrente é recusado (datas relativas ao hoje em Cuiabá)", async ({ page }) => {
    const atual = mesDe(hojeEmCuiaba());
    const anterior = mesAnterior(atual);
    const cliente = await clienteDoUsuario(u.terminado);
    await prepararCenario(cliente, [
      { criarAtivo: "A", nome: "Ativo A", tipoAjuste: "rendimento" },
      { lancar: "A", data: `${anterior}-01`, tipo: "aporte", valor: 100000 },
    ]);
    await entrar(page, u.terminado);
    await expect(page.getByText("já terminou e ainda não foi fechado")).toBeVisible();
    await page.getByRole("link", { name: /^Fechar / }).click();
    await expect(page).toHaveURL(new RegExp(`/lancamentos/fechamento/${anterior}$`));
    await page.getByLabel("Saldo real de Ativo A").fill("1.000,00");
    await page.getByRole("button", { name: "Revisar fechamento" }).click();
    await page.getByRole("button", { name: /^Fechar / }).click();
    await expect(page.getByRole("heading", { name: "Mês fechado" })).toBeVisible();

    await page.goto(`/lancamentos/fechamento/${atual}`);
    await expect(page.getByText("O mês só pode ser fechado depois do seu último dia.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Revisar fechamento" })).toHaveCount(0);
    await page.goto("/");
    await expect(page.getByText("já terminou e ainda não foi fechado")).toHaveCount(0);
  });

  test("ocultação e acessibilidade nas três etapas, em 360 px e 1280 px", async ({ page, context, baseURL }) => {
    const cliente = await clienteDoUsuario(u.tela);
    await fevereiroFechado(cliente, 123456, 65432, "marcacao");
    await entrar(page, u.tela);

    for (const tamanho of [
      { width: 360, height: 800 },
      { width: 1280, height: 900 },
    ]) {
      await page.setViewportSize(tamanho);
      for (const mes of ["2026-02", "2026-03"]) {
        await page.goto(`/lancamentos/fechamento/${mes}`);
        expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations, `${mes} ${tamanho.width}`).toEqual([]);
      }
      await page.getByLabel("Saldo real de Ativo A").fill("1.234,56");
      await page.getByLabel("Saldo real de Ativo B").fill("654,32");
      await page.getByRole("button", { name: "Revisar fechamento" }).click();
      await expect(page.getByRole("region", { name: "2. Revisão" })).toBeVisible();
      expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations, `revisão ${tamanho.width}`).toEqual([]);
    }

    await context.addCookies([{ name: "sf_ocultar_valores", value: "1", url: baseURL! }]);
    for (const mes of ["2026-02", "2026-03"]) {
      await page.goto(`/lancamentos/fechamento/${mes}`);
      const html = await page.content();
      expect(html).not.toContain("1.234,56");
      expect(html).not.toMatch(/R\$(\s|&nbsp;| )*[−-]?\d/);
    }
    await page.getByLabel("Saldo real de Ativo A").fill("1.234,56");
    await page.getByLabel("Saldo real de Ativo B").fill("654,32");
    await page.getByRole("button", { name: "Revisar fechamento" }).click();
    await expect(page.getByRole("region", { name: "2. Revisão" })).toBeVisible();
    // Os títulos "2. Revisão" e "3. Fechar" têm algarismos; quantias, nenhuma.
    expect(await page.getByRole("region", { name: "2. Revisão" }).textContent()).not.toMatch(/R\$|\d,\d{2}/);
    await expect(page.getByLabel("Saldo real de Ativo A")).toHaveValue("1.234,56"); // P20
  });
});
