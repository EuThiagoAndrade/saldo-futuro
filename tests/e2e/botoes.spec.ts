import { expect, type Locator, type Page, test } from "@playwright/test";
import { prepararCenario } from "./apoio/cenarios";
import { clienteDoUsuario, configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// Cursor e estados de interação dos botões (#95, BL-004; DESIGN.md 6.9). Dados fictícios.
const MOVEL = { width: 360, height: 800 };
const DESKTOP = { width: 1280, height: 900 };
const ROTAS = ["/", "/lancamentos", "/lancamentos/novo", "/ativos", "/benchmarks", "/benchmarks/comparacao", "/transferencias", "/conta"];
// Páginas legais públicas (#104): hoje sem botões. A varredura cobre os que vierem a existir;
// links, foco e acessibilidade ficam em paginas-publicas.spec.ts.
const PUBLICAS = ["/privacidade", "/termos"];

type Rgb = [number, number, number];
interface Estilo { fundo: Rgb; texto: Rgb; fundoCru: string; translate: string; cursor: string }

const luminancia = ([r, g, b]: Rgb) => {
  const [R, G, B] = [r, g, b].map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};
const contraste = (a: Rgb, b: Rgb) => {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
};

/** Cor computada e composta sobre o branco (a superfície), no próprio navegador. */
function ler(alvo: Locator): Promise<Estilo> {
  return alvo.evaluate(async (el) => {
    // Com movimento reduzido, a regra global usa transition-duration de 0,01 ms: espera o quadro.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const cs = getComputedStyle(el);
    const contexto = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
    const rgb = (cor: string): [number, number, number] => {
      contexto.fillStyle = "#ffffff";
      contexto.fillRect(0, 0, 1, 1);
      contexto.fillStyle = cor;
      contexto.fillRect(0, 0, 1, 1);
      const d = contexto.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2]];
    };
    return { fundo: rgb(cs.backgroundColor), texto: rgb(cs.color), fundoCru: cs.backgroundColor, translate: cs.translate, cursor: cs.cursor };
  });
}

async function estados(page: Page, alvo: Locator) {
  await page.mouse.move(0, 0);
  const repouso = await ler(alvo);
  await alvo.hover();
  const hover = await ler(alvo);
  await page.mouse.down();
  const pressionado = await ler(alvo);
  // Soltar fora do botão não dispara o clique.
  await page.mouse.move(0, 0);
  await page.mouse.up();
  return { repouso, hover, pressionado };
}

const igual = (a: Rgb, b: Rgb) => a.every((v, i) => v === b[i]);

async function visiveis(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("button"))
      .filter((b) => b.getClientRects().length > 0 && getComputedStyle(b).visibility !== "hidden")
      .map((b) => ({ texto: (b.getAttribute("aria-label") ?? b.textContent ?? "").trim().slice(0, 40), desabilitado: b.disabled, cursor: getComputedStyle(b).cursor })),
  );
}

test.describe("botões (#95)", () => {
  test.skip(!configurado, "Requer Supabase local com dados fictícios.");
  let u: Record<string, UsuarioDeTeste>;
  test.beforeAll(async () => {
    u = await criarUsuarios("botoes95", { comum: "user" });
    await prepararCenario(await clienteDoUsuario(u.comum), [
      { criarAtivo: "A", nome: "Ativo fictício", tipoAjuste: "rendimento" },
      { lancar: "A", data: "2025-12-01", tipo: "aporte", valor: 100000 },
    ]);
  });
  test.afterAll(async () => { if (u) await removerUsuarios(u); });

  test("todo botão visível mostra ponteiro quando habilitado e not-allowed quando desabilitado", async ({ page }) => {
    let total = 0;
    const conferir = async (onde: string) => {
      for (const b of await visiveis(page)) {
        total++;
        expect(b.cursor, `${onde}: ${b.texto}`).toBe(b.desabilitado ? "not-allowed" : "pointer");
      }
    };
    for (const tamanho of [MOVEL, DESKTOP]) {
      await page.setViewportSize(tamanho);
      await page.goto("/entrar");
      expect((await visiveis(page)).length, "botões do login").toBeGreaterThan(1);
      await conferir(`/entrar ${tamanho.width}`);
      for (const rota of PUBLICAS) {
        await page.goto(rota);
        await conferir(`${rota} ${tamanho.width}`);
      }
    }
    await entrar(page, u.comum);
    for (const tamanho of [MOVEL, DESKTOP]) {
      await page.setViewportSize(tamanho);
      for (const rota of ROTAS) {
        await page.goto(rota);
        await conferir(`${rota} ${tamanho.width}`);
      }
      await page.goto("/ativos");
      await page.getByRole("button", { name: "Desativar", exact: true }).click();
      await conferir(`diálogo de confirmação ${tamanho.width}`);
    }
    await page.setViewportSize(MOVEL);
    await page.goto("/");
    await page.getByRole("navigation", { name: "Principal" }).getByRole("button", { name: "Mais" }).click();
    await conferir("folha Mais 360");
    expect(total).toBeGreaterThan(20);
  });

  type Caso = { nome: string; viewport: typeof MOVEL; abrir: (p: Page) => Promise<Locator>; hover: Rgb | "repouso"; pressionado: Rgb | "hover" };
  const casos: Caso[] = [
    { nome: "principal", viewport: DESKTOP, abrir: async (p) => { await p.goto("/lancamentos/novo"); return p.getByRole("button", { name: "Registrar lançamento" }); }, hover: [22, 60, 115], pressionado: "hover" },
    { nome: "secundário", viewport: DESKTOP, abrir: async (p) => { await p.goto("/ativos"); return p.getByRole("button", { name: "Desativar", exact: true }); }, hover: [244, 246, 249], pressionado: [231, 237, 246] },
    { nome: "destrutivo", viewport: DESKTOP, abrir: async (p) => { await p.goto("/ativos"); await p.getByRole("button", { name: "Desativar", exact: true }).click(); return p.getByRole("button", { name: "Desativar ativo" }); }, hover: "repouso", pressionado: [175, 78, 73] },
    { nome: "Ocultar valores", viewport: DESKTOP, abrir: async (p) => { await p.goto("/"); return p.getByRole("button", { name: "Ocultar valores" }); }, hover: [255, 255, 255], pressionado: [231, 237, 246] },
    { nome: "Mais", viewport: MOVEL, abrir: async (p) => { await p.goto("/"); return p.getByRole("navigation", { name: "Principal" }).getByRole("button", { name: "Mais" }); }, hover: [244, 246, 249], pressionado: [231, 237, 246] },
    { nome: "Fechar", viewport: MOVEL, abrir: async (p) => { await p.goto("/"); await p.getByRole("navigation", { name: "Principal" }).getByRole("button", { name: "Mais" }).click(); return p.getByRole("dialog", { name: "Mais" }).getByRole("button", { name: "Fechar" }); }, hover: [244, 246, 249], pressionado: [231, 237, 246] },
  ];

  for (const caso of casos) {
    test(`${caso.nome}: hover e pressão, com e sem movimento reduzido`, async ({ page }, info) => {
      await entrar(page, u.comum);
      await page.setViewportSize(caso.viewport);
      const medidas: Record<string, unknown> = {};
      for (const movimento of ["no-preference", "reduce"] as const) {
        await page.emulateMedia({ reducedMotion: movimento });
        const alvo = await caso.abrir(page);
        await expect(alvo).toBeVisible();
        const e = await estados(page, alvo);
        expect(e.hover.cursor).toBe("pointer");
        expect(e.hover.fundo, "fundo em hover").toEqual(caso.hover === "repouso" ? e.repouso.fundo : caso.hover);
        if (caso.nome === "destrutivo") {
          // Tailwind compõe a opacidade por color-mix: confere a cor computada, não a estimada.
          const esperado = caso.pressionado as Rgb;
          expect(e.pressionado.fundoCru).not.toBe(e.repouso.fundoCru);
          expect(e.pressionado.fundo.every((v, i) => Math.abs(v - esperado[i]) <= 3), `fundo pressionado ${e.pressionado.fundo}`).toBe(true);
        } else {
          expect(e.pressionado.fundo, "fundo pressionado").toEqual(caso.pressionado === "hover" ? e.hover.fundo : caso.pressionado);
        }
        expect(igual(e.pressionado.fundo, e.repouso.fundo) && e.pressionado.fundoCru === e.repouso.fundoCru, "pressionado difere do repouso").toBe(false);
        for (const estado of [e.repouso, e.hover, e.pressionado]) expect(contraste(estado.texto, estado.fundo)).toBeGreaterThanOrEqual(4.5);
        expect(e.pressionado.translate).toBe(movimento === "reduce" ? "none" : "0px 1px");
        expect(e.repouso.translate).toBe("none");
        medidas[movimento] = { repouso: e.repouso.fundo, hover: e.hover.fundo, pressionado: e.pressionado.fundo, fundoCruPressionado: e.pressionado.fundoCru, contrastePressionado: contraste(e.pressionado.texto, e.pressionado.fundo).toFixed(2) };
      }
      await info.attach(`medidas-${caso.nome}`, { body: JSON.stringify(medidas, null, 2), contentType: "application/json" });
    });
  }

  test("botão desabilitado mantém not-allowed e não reage a hover nem a pressão", async ({ page }) => {
    await entrar(page, u.comum);
    await page.setViewportSize(DESKTOP);
    await page.goto("/lancamentos/novo");
    const alvo = page.getByRole("button", { name: "Registrar lançamento" });
    await alvo.evaluate((el) => { (el as HTMLButtonElement).disabled = true; });
    await page.mouse.move(0, 0);
    const repouso = await ler(alvo);
    await alvo.hover({ force: true });
    await page.mouse.down();
    const pressionado = await ler(alvo);
    await page.mouse.move(0, 0);
    await page.mouse.up();
    expect(pressionado.cursor).toBe("not-allowed");
    expect(pressionado.fundoCru).toBe(repouso.fundoCru);
    expect(pressionado.translate).toBe("none");
  });
});
