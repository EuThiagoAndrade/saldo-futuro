import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { prepararCenario } from "./apoio/cenarios";
import { escolherAtivo } from "./apoio/combobox";
import { clienteDoUsuario, configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// Seletor de ativo com busca e ordem alfabética (#97, BL-010; DESIGN.md 6.8). Nomes fictícios,
// criados fora de ordem alfabética de propósito.
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const MOVEL = { width: 360, height: 800 };
const DESKTOP = { width: 1280, height: 900 };

test.describe("seletor de ativo (#97)", () => {
  test.skip(!configurado, "Requer Supabase local com dados fictícios.");
  let u: Record<string, UsuarioDeTeste>;
  let ids: Record<string, string>;
  test.beforeAll(async () => {
    u = await criarUsuarios("seletor97", { comum: "user" });
    ids = await prepararCenario(await clienteDoUsuario(u.comum), [
      { criarAtivo: "beta", nome: "Fundo Beta", tipoAjuste: "rendimento" },
      { criarAtivo: "acao", nome: "Ação Fictícia", tipoAjuste: "marcacao" },
      { criarAtivo: "cofre", nome: "Cofrinho", tipoAjuste: "rendimento" },
      { lancar: "beta", data: "2025-12-01", tipo: "aporte", valor: 1000000 },
      { lancar: "acao", data: "2025-12-01", tipo: "aporte", valor: 1000000 },
      { lancar: "cofre", data: "2025-12-01", tipo: "aporte", valor: 1000000 },
    ]);
  });
  test.afterAll(async () => { if (u) await removerUsuarios(u); });

  const valorOculto = (page: Page, nome: string) => page.locator(`input[type=hidden][name="${nome}"]`).inputValue();
  const naLista = (page: Page) => page.getByRole("listbox").getByRole("option");
  const opcoes = (page: Page) => naLista(page).allTextContents();
  const mesmaOrdem = (nomes: string[]) => [...nomes].sort((a, b) => a.localeCompare(b, "pt-BR"));

  test("ordem alfabética pelo nome exibido nos três seletores, com 'Todos os ativos' no topo do filtro", async ({ page }) => {
    await entrar(page, u.comum);
    await page.goto("/lancamentos");
    await page.getByLabel("Ativo").click();
    const filtro = await opcoes(page);
    expect(filtro[0]).toBe("Todos os ativos");
    expect(filtro.slice(1)).toEqual(mesmaOrdem(filtro.slice(1)));
    expect(filtro.slice(1)).toEqual(expect.arrayContaining(["Ação Fictícia", "Cofrinho", "Em trânsito", "Fundo Beta"]));

    await page.goto("/lancamentos/novo");
    await page.getByLabel("Ativo").click();
    const novo = await opcoes(page);
    expect(novo).toEqual(["Ação Fictícia", "Cofrinho", "Fundo Beta"]);

    await page.goto("/transferencias");
    for (const rotulo of ["Origem", "Destino"]) {
      await page.getByLabel(rotulo, { exact: true }).click();
      const lista = await opcoes(page);
      expect(lista).toEqual(mesmaOrdem(lista));
      expect(lista).toEqual(["Ação Fictícia", "Cofrinho", "Em trânsito", "Fundo Beta"]);
      await page.keyboard.press("Escape");
    }
  });

  test("buscar 'acao' encontra 'Ação Fictícia' e o novo lançamento grava o ativo certo", async ({ page }) => {
    await entrar(page, u.comum);
    await page.goto("/lancamentos/novo");
    const campo = page.getByLabel("Ativo");
    await campo.fill("ACAO");
    await expect(naLista(page)).toHaveText(["Ação Fictícia"]);
    await page.keyboard.press("Enter");
    expect(await valorOculto(page, "ativo")).toBe(ids.acao);
    await page.getByLabel("Valor").fill("12,34");
    await page.getByRole("button", { name: "Registrar lançamento" }).click();
    await expect(page).toHaveURL(/\/lancamentos/);
    const { data } = await (await clienteDoUsuario(u.comum)).from("eventos").select("ativo_id, valor").eq("valor", 1234);
    expect(data).toEqual([{ ativo_id: ids.acao, valor: 1234 }]);
  });

  test("duas transferências consecutivas, com o reset depois do sucesso, gravam origem e destino corretos", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.comum);
    await page.goto("/transferencias");
    const origem = page.getByLabel("Origem", { exact: true });
    const destino = page.getByLabel("Destino", { exact: true });
    const transferir = async (de: string, para: string, valor: string) => {
      await escolherAtivo(origem, de);
      await escolherAtivo(destino, para);
      await page.getByLabel("Valor").fill(valor);
      await page.getByRole("button", { name: "Transferir" }).click();
      await expect(page.getByText("Transferência registrada.")).toBeVisible();
      await expect(origem).toHaveValue("");
      await expect(destino).toHaveValue("");
      expect(await valorOculto(page, "origem")).toBe("");
      expect(await valorOculto(page, "destino")).toBe("");
    };
    await transferir("Fundo Beta", "Cofrinho", "10,00");
    await transferir("Cofrinho", "Ação Fictícia", "20,00");
    const cliente = await clienteDoUsuario(u.comum);
    const { data } = await cliente.from("eventos").select("ativo_id, tipo, valor, transferencia_id").not("transferencia_id", "is", null);
    const por = new Map<string, { ativo_id: string; tipo: string; valor: number }[]>();
    for (const e of data!) por.set(e.transferencia_id, [...(por.get(e.transferencia_id) ?? []), e]);
    const pernas = [...por.values()].map((l) => l.map((e) => `${e.valor}:${e.ativo_id}`).sort());
    expect(pernas).toContainEqual([`-1000:${ids.beta}`, `1000:${ids.cofre}`].sort());
    expect(pernas).toContainEqual([`-2000:${ids.cofre}`, `2000:${ids.acao}`].sort());
  });

  test("política de seleção no navegador: edição, apagar, Esc, saída por Tab e mensagens", async ({ page }) => {
    await entrar(page, u.comum);
    await page.goto("/transferencias");
    const origem = page.getByLabel("Origem", { exact: true });
    const destino = page.getByLabel("Destino", { exact: true });
    const botao = page.getByRole("button", { name: "Transferir" });
    await page.getByLabel("Valor").fill("1,00");
    await escolherAtivo(destino, "Cofrinho");

    // Selecionar A, editar para B sem selecionar e enviar: bloqueado, sem enviar o ativo anterior.
    await escolherAtivo(origem, "Fundo Beta");
    expect(await valorOculto(page, "origem")).toBe(ids.beta);
    await origem.fill("Ação Fictícia");
    expect(await valorOculto(page, "origem")).toBe("");
    await botao.click();
    await expect(page.getByText("Escolha um ativo da lista.")).toBeVisible();
    await expect(origem).toHaveAttribute("aria-invalid", "true");
    await expect(origem).toHaveAttribute("aria-describedby", /.+/);
    expect(await origem.evaluate((el: HTMLInputElement) => el.validationMessage)).toBe("Escolha um ativo da lista.");
    await expect(page.getByText("Transferência registrada.")).toHaveCount(0);

    // Apagar a seleção de um campo obrigatório: mensagem do servidor.
    await origem.fill("");
    await botao.click();
    await expect(page.getByText("Escolha o ativo de origem.")).toBeVisible();

    // Esc com a lista aberta só a fecha; com a lista fechada restaura a última confirmação.
    await escolherAtivo(origem, "Fundo Beta");
    await origem.fill("Fun");
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(origem).toHaveValue("Fun");
    await page.keyboard.press("Escape");
    await expect(origem).toHaveValue("Fundo Beta");
    expect(await valorOculto(page, "origem")).toBe(ids.beta);

    // Saída por Tab sem confirmar fecha a lista e mantém o texto, sem valor.
    await origem.fill("Cof");
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(origem).toHaveValue("Cof");
    expect(await valorOculto(page, "origem")).toBe("");
  });

  test("teclado: setas, Home, End e Enter; aria do padrão combobox", async ({ page }) => {
    await entrar(page, u.comum);
    await page.goto("/lancamentos/novo");
    const campo = page.getByLabel("Ativo");
    await expect(campo).toHaveAttribute("role", "combobox");
    await expect(campo).toHaveAttribute("aria-expanded", "false");
    await campo.focus();
    await page.keyboard.press("ArrowDown");
    await expect(campo).toHaveAttribute("aria-expanded", "true");
    await expect(campo).toHaveAttribute("aria-controls", /.+/);
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("End");
    await expect(campo).toHaveAttribute("aria-activedescendant", /.+/);
    await expect(naLista(page).filter({ hasText: "Fundo Beta" })).toHaveClass(/bg-primary-subtle/);
    await page.keyboard.press("Home");
    await expect(naLista(page).filter({ hasText: "Ação Fictícia" })).toHaveClass(/bg-primary-subtle/);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(campo).toHaveValue("Cofrinho");
    expect(await valorOculto(page, "ativo")).toBe(ids.cofre);
    await expect(page.getByRole("listbox")).toHaveCount(0);
  });

  test("filtro de Lançamentos: valor inicial da URL, 'Todos os ativos', ID desconhecido e envio", async ({ page }) => {
    await entrar(page, u.comum);
    await page.goto(`/lancamentos?ativo=${ids.beta}`);
    const campo = page.getByLabel("Ativo");
    await expect(campo).toHaveValue("Fundo Beta");
    expect(await valorOculto(page, "ativo")).toBe(ids.beta);
    await campo.fill("");
    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(page).toHaveURL(/ativo=(&|$)/);
    await expect(page.getByLabel("Ativo")).toHaveValue("Todos os ativos");

    await page.goto("/lancamentos?ativo=nao-existe");
    await expect(page.getByLabel("Ativo")).toHaveValue("Todos os ativos");
    await escolherAtivo(page.getByLabel("Ativo"), "Cofrinho");
    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(page).toHaveURL(new RegExp(`ativo=${ids.cofre}`));
    await expect(page.getByLabel("Ativo")).toHaveValue("Cofrinho");

    // Texto sem seleção bloqueia o envio do filtro.
    await page.getByLabel("Ativo").fill("xyz");
    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(page).toHaveURL(new RegExp(`ativo=${ids.cofre}`));
    await expect(page.getByText("Escolha um ativo da lista.")).toBeVisible();
  });

  for (const tamanho of [MOVEL, DESKTOP]) {
    test(`acessibilidade, foco visível e alvo de 44 px em ${tamanho.width} px`, async ({ page }) => {
      await page.setViewportSize(tamanho);
      await entrar(page, u.comum);
      for (const rota of ["/lancamentos", "/lancamentos/novo", "/transferencias"]) {
        await page.goto(rota);
        const campo: Locator = page.getByRole("combobox").first();
        await campo.focus();
        const contorno = await campo.evaluate((el) => getComputedStyle(el).outlineStyle);
        expect(contorno, `foco visível em ${rota}`).not.toBe("none");
        await page.keyboard.press("ArrowDown");
        await expect(page.getByRole("listbox")).toBeVisible();
        for (const opcao of await naLista(page).all()) {
          const caixa = (await opcao.boundingBox())!;
          expect(caixa.height, `${rota} opção`).toBeGreaterThanOrEqual(44);
        }
        const resultado = await new AxeBuilder({ page }).withTags(WCAG).analyze();
        expect(resultado.violations, `${rota} ${tamanho.width}`).toEqual([]);
      }
    });
  }

  test("toque no celular: abre, escolhe pela opção e envia o ativo certo", async ({ browser, baseURL }) => {
    const contexto = await browser.newContext({ viewport: MOVEL, hasTouch: true, isMobile: true, baseURL });
    const page = await contexto.newPage();
    await entrar(page, u.comum);
    await page.goto("/lancamentos/novo");
    await page.getByLabel("Ativo").tap();
    await expect(page.getByRole("listbox")).toBeVisible();
    await naLista(page).filter({ hasText: "Cofrinho" }).tap();
    await expect(page.getByLabel("Ativo")).toHaveValue("Cofrinho");
    expect(await valorOculto(page, "ativo")).toBe(ids.cofre);
    await contexto.close();
  });
});
