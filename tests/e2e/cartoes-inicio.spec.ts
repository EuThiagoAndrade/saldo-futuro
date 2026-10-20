import { expect, test, chromium, type Page, type TestInfo } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { prepararCenario } from "./apoio/cenarios";
import { clienteDoUsuario, configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";
import { textoDinheiro } from "../../src/lib/apresentacao/valores";

const quantias = [0, 123456789, -123456789, 99999999999, -99999999999, Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER];
const larguras = [360, 390, 768, 776, 1023, 1024, 1032, 1040, 1100, 1200, 1280, 1440];
const transicoes = [...Array.from({ length: 9 }, (_, i) => 768 + i), ...Array.from({ length: 9 }, (_, i) => 1024 + i)];

async function carregarFontes(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.load('600 24px "IBM Plex Sans"');
    await document.fonts.ready;
  });
}

async function medir(page: Page, classica: boolean) {
  const medida = await page.evaluate(() => {
    const cartoes = Array.from(document.querySelectorAll("main div.rounded-md"))
      .filter((c) => Array.from(c.children).some((p) => p.classList.contains("text-2xl/8")))
      .map((c) => {
        const borda = c.getBoundingClientRect();
        const estilo = getComputedStyle(c);
        const esquerda = borda.left + parseFloat(estilo.borderLeftWidth) + parseFloat(estilo.paddingLeft);
        const direita = borda.right - parseFloat(estilo.borderRightWidth) - parseFloat(estilo.paddingRight);
        const valor = Array.from(c.children).find((p) => p.classList.contains("text-2xl/8"))!;
        const fonte = getComputedStyle(valor);
        const textos: { texto: string; esquerda: number; direita: number }[] = [];
        const nos = document.createTreeWalker(c, NodeFilter.SHOW_TEXT);
        for (let no = nos.nextNode(); no; no = nos.nextNode()) {
          if (!no.textContent?.trim() || no.parentElement?.closest(".sr-only")) continue;
          const range = document.createRange(); range.selectNodeContents(no);
          for (const r of Array.from(range.getClientRects())) textos.push({ texto: no.textContent, esquerda: r.left, direita: r.right });
        }
        const dinheiro = valor.querySelector("span.whitespace-nowrap");
        const linhas = dinheiro ? (() => { const r = document.createRange(); r.selectNodeContents(dinheiro); return r.getClientRects().length; })() : null;
        const grade = getComputedStyle(c.parentElement!);
        return { esquerda, direita, larguraUtil: direita - esquerda, textos, valor: valor.textContent, linhas,
          fonte: fonte.fontFamily, tamanho: fonte.fontSize, alturaLinha: fonte.lineHeight, peso: fonte.fontWeight,
          emGrade: grade.display === "grid", colunas: grade.display === "grid" ? grade.gridTemplateColumns.split(" ").length : 1 };
      });
    return { innerWidth, clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth,
      altura: innerHeight, scrollHeight: document.documentElement.scrollHeight, dpr: devicePixelRatio, cartoes };
  });
  expect(medida.cartoes.length).toBeGreaterThan(0);
  expect(medida.clientWidth).toBeGreaterThanOrEqual(360);
  expect(medida.scrollWidth).toBeLessThanOrEqual(medida.clientWidth);
  if (classica) {
    expect(medida.innerWidth - medida.clientWidth).toBeGreaterThan(0);
    expect(medida.scrollHeight).toBeGreaterThan(medida.altura);
  } else expect(medida.innerWidth - medida.clientWidth).toBe(0);
  for (const c of medida.cartoes) {
    expect(c.tamanho).toBe("24px"); expect(c.alturaLinha).toBe("32px"); expect(c.peso).toBe("600");
    expect(c.fonte).toContain("IBM Plex Sans");
    expect(c.colunas).toBe(c.emGrade && medida.innerWidth >= 768 ? 2 : 1);
    if (c.valor?.includes("R$")) { expect(c.valor).toMatch(/^−?R\$ [\d.]+,\d{2}$/); expect(c.linhas).toBe(1); }
    for (const t of c.textos) {
      expect(t.esquerda, t.texto).toBeGreaterThanOrEqual(c.esquerda - 0.1);
      expect(t.direita, t.texto).toBeLessThanOrEqual(c.direita + 0.1);
    }
  }
  return medida;
}

test.describe("contenção dos cartões do Início (#89)", () => {
  test.skip(!configurado, "Requer Supabase local com dados fictícios.");
  test.describe.configure({ mode: "serial" });
  let usuarios: Record<string, UsuarioDeTeste>;
  test.beforeAll(async () => {
    test.setTimeout(120000);
    usuarios = await criarUsuarios("cartoes89", Object.fromEntries([
      ...quantias.map((_, i) => [`valor${i}`, "user"]), ["vaziopositivo", "user"], ["vazionegativo", "user"], ["percentuais", "user"], ["vazio", "user"],
    ] as [string, "user"][]));
    for (const [i, valor] of quantias.entries()) await prepararCenario(await clienteDoUsuario(usuarios[`valor${i}`]), [
      { criarAtivo: "A", nome: "Ativo fictício", tipoAjuste: "marcacao" },
      { lancar: "A", data: "2026-01-01", tipo: "migracao", valor: valor || 1 },
      { fechar: "2026-01", saldos: { A: valor } },
    ]);
    for (const [nome, valor] of [["vaziopositivo", Number.MAX_SAFE_INTEGER], ["vazionegativo", -Number.MAX_SAFE_INTEGER]] as const) {
      await prepararCenario(await clienteDoUsuario(usuarios[nome]), [
        { criarAtivo: "A", nome: "Ativo fictício", tipoAjuste: "rendimento" },
        { lancar: "A", data: "2026-01-01", tipo: valor > 0 ? "aporte" : "resgate", valor },
      ]);
    }
    await prepararCenario(await clienteDoUsuario(usuarios.percentuais), [
      { criarAtivo: "A", nome: "Ativo fictício", tipoAjuste: "marcacao" },
      { lancar: "A", data: "2025-12-01", tipo: "aporte", valor: 1000000 },
      { fechar: "2025-12", saldos: { A: 1000000 } },
      { fechar: "2026-01", saldos: { A: 1010000 } },
    ]);
  });
  test.afterAll(async () => { if (usuarios) await removerUsuarios(usuarios); });

  for (const classica of [false, true]) test(`matriz ${classica ? "com barra clássica" : "sem barra que ocupe largura"}`, async ({ baseURL }, info) => {
    test.setTimeout(300000);
    const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined, ignoreDefaultArgs: classica ? ["--hide-scrollbars"] : [] });
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    const evidencias = [];
    try {
      const widths = [...new Set([...larguras.map((w) => classica && w === 360 ? 375 : w), ...transicoes])].sort((a, b) => a - b);
      for (const [nome, usuario] of Object.entries(usuarios)) {
        await entrar(page, usuario);
        await carregarFontes(page);
        // Espaçador apenas de teste garante conteúdo alto até no estado vazio.
        await page.addStyleTag({ content: "body::after { content: ''; display: block; height: 100vh; }" });
        const esperado = nome.startsWith("valor") ? quantias[Number(nome.slice(5))] : nome === "vaziopositivo" ? Number.MAX_SAFE_INTEGER : nome === "vazionegativo" ? -Number.MAX_SAFE_INTEGER : null;
        if (esperado !== null) await expect(page.locator("main")).toContainText(textoDinheiro(BigInt(esperado)));
        if (nome === "percentuais") await expect(page.locator("main")).toContainText("+1,00%");
        if (nome === "valor0") await expect(page.locator("main")).toContainText("N/D");
        for (const width of widths) for (const height of [900, 420]) {
          await page.setViewportSize({ width, height });
          const medida = await medir(page, classica);
          evidencias.push({ cenario: nome, barra: classica, ...medida });
          if (["valor1", "valor6"].includes(nome) && width === (classica ? 375 : 360) && height === 900)
            await page.screenshot({ path: `local/issue-89/${nome}-${classica ? "classica" : "sem-barra"}-${width}.png`, fullPage: false });
        }
      }
      await context.addCookies([{ name: "sf_ocultar_valores", value: "1", url: baseURL! }]);
      await entrar(page, usuarios.valor6); await carregarFontes(page);
      await page.addStyleTag({ content: "body::after { content: ''; display: block; height: 100vh; }" });
      expect(await page.content()).not.toMatch(/R\$(\s|&nbsp;| )*[−-]?\d/);
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 });
        evidencias.push({ cenario: "oculto", barra: classica, ...await medir(page, classica) });
      }
      await guardarMedidas(info, `matriz-${classica ? "classica" : "sem-barra"}`, evidencias);
    } finally { await browser.close(); }
  });

  test("zoom real do navegador de 100% para 200% sobre conteúdo de 1280 px", async ({ baseURL }, info) => {
    test.setTimeout(120000);
    const extensao = info.outputPath("extensao-zoom"); mkdirSync(extensao, { recursive: true });
    writeFileSync(join(extensao, "manifest.json"), JSON.stringify({ manifest_version: 3, name: "Zoom local de teste", version: "1.0", permissions: ["tabs"], background: { service_worker: "background.js" } }));
    writeFileSync(join(extensao, "background.js"), "chrome.runtime.onInstalled.addListener(() => {});");
    // Usa o Chromium completo, que suporta extensão em headless; não emula viewport/deviceScaleFactor.
    const context = await chromium.launchPersistentContext(info.outputPath("perfil-zoom"), { channel: "chromium", headless: true, viewport: null, deviceScaleFactor: undefined, baseURL,
      args: [`--disable-extensions-except=${extensao}`, `--load-extension=${extensao}`, "--window-size=1280,900"] });
    try {
      const page = context.pages()[0]; await page.goto(baseURL!);
      const cdp = await context.newCDPSession(page);
      const janela = await cdp.send("Browser.getWindowForTarget");
      const largura = await page.evaluate(() => innerWidth);
      if (largura !== 1280) await cdp.send("Browser.setWindowBounds", { windowId: janela.windowId, bounds: { width: janela.bounds.width! + 1280 - largura } });
      await expect.poll(() => page.evaluate(() => innerWidth)).toBe(1280);
      await entrar(page, usuarios.valor6); await carregarFontes(page);
      const antes = await medir(page, false);
      const worker = context.serviceWorkers()[0] ?? await context.waitForEvent("serviceworker");
      const zoom = await worker.evaluate(`(async () => {
        const abas = await chrome.tabs.query({}); const aba = abas.find(a => a.url.startsWith(${JSON.stringify(baseURL)}));
        await chrome.tabs.setZoom(aba.id, 2); return chrome.tabs.getZoom(aba.id);
      })()`);
      expect(zoom).toBe(2);
      await expect.poll(() => page.evaluate(() => innerWidth)).toBe(640);
      await carregarFontes(page);
      const depois = await medir(page, false);
      expect(depois.dpr / antes.dpr).toBe(2);
      await guardarMedidas(info, "zoom-real", { zoom, antes, depois });
    } finally { await context.close(); }
  });
});

async function guardarMedidas(info: TestInfo, nome: string, medidas: unknown) {
  mkdirSync("local/issue-89", { recursive: true });
  const texto = JSON.stringify(medidas, null, 2);
  writeFileSync(`local/issue-89/${nome}.json`, texto);
  await info.attach(nome, { body: texto, contentType: "application/json" });
}
