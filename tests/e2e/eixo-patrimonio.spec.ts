import { expect, test } from "@playwright/test";
import { prepararCenario } from "./apoio/cenarios";
import { clienteDoUsuario, configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";
import { textoDinheiro } from "../../src/lib/apresentacao/valores";

// Somente centavos fictícios; exercita a página e a fonte reais, sem rota de teste.
const cenarios = [
  [120000000, 121900001, 126000000], [99998000, 100000000, 100002000],
  [99998, 100000, 100002], [1, 3, 5], [-3, 0, 3], [0, 0, 0],
  [123400, 123400, 123400], [0, 4500000000000000, 9007199254740991],
  [9007199254738991, 9007199254739991, 9007199254740991],
  [99998000, 100000000, 100050000], [123456],
].flatMap((valores) => [valores, valores.map((v) => -v)]);

test.describe("eixo patrimonial (#88)", () => {
  test.skip(!configurado, "Requer Supabase local com dados fictícios.");
  let usuarios: Record<string, UsuarioDeTeste>;
  test.beforeAll(async () => {
    usuarios = await criarUsuarios("eixo88", Object.fromEntries(cenarios.map((_, i) => [`c${i}`, "user" as const])));
    for (const [i, valores] of cenarios.entries()) {
      await prepararCenario(await clienteDoUsuario(usuarios[`c${i}`]), [
        { criarAtivo: "A", nome: "Ativo fictício", tipoAjuste: "marcacao" },
        { lancar: "A", data: "2026-01-01", tipo: "migracao", valor: valores[0] || 1 },
        ...valores.map((v, j) => ({ fechar: `2026-0${j + 1}`, saldos: { A: v } })),
      ]);
    }
  });
  test.afterAll(async () => { if (usuarios) await removerUsuarios(usuarios); });
  test("rótulos completos, coordenadas coerentes, tabela exata e ocultação", async ({ page, context, baseURL }, info) => {
    test.setTimeout(180000);
    const evidencias = [];
    for (const [i, valores] of cenarios.entries()) {
      await entrar(page, usuarios[`c${i}`]);
      await page.goto("/?periodo=desde_inicio");
      const figura = page.locator("figure", { has: page.locator("#grafico-patrimonio-titulo") });
      await figura.locator("summary").click();
      for (const v of valores) await expect(figura.locator("table")).toContainText(textoDinheiro(BigInt(v)));
      for (const width of [360, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(() => document.fonts.ready);
        const medida = await figura.locator("svg").evaluate((svg) => {
          const textos = Array.from(svg.querySelectorAll("text[text-anchor=end]"));
          const caixas = textos.map((t) => { const b = (t as SVGGraphicsElement).getBBox(); return { texto: t.textContent, x: b.x, y: b.y, largura: b.width, altura: b.height }; });
          const linhas = Array.from(svg.querySelectorAll("line"));
          return { caixas, curva: Number(linhas[0].getAttribute("x2")) - Number(linhas[0].getAttribute("x1")), fonte: getComputedStyle(svg).fontFamily, innerWidth, clientWidth: document.documentElement.clientWidth };
        });
        expect(medida.fonte).toContain("IBM Plex Sans");
        expect(medida.curva).toBeGreaterThanOrEqual(160);
        expect(new Set(medida.caixas.map((b) => b.texto)).size).toBe(medida.caixas.length);
        for (const b of medida.caixas) {
          expect(b.x, b.texto!).toBeGreaterThanOrEqual(0);
          expect(b.x + b.largura).toBeLessThan(144);
          expect(b.y).toBeGreaterThanOrEqual(0);
          expect(b.y + b.altura).toBeLessThanOrEqual(200);
        }
        const ordenadas = medida.caixas.toSorted((a, b) => a.y - b.y);
        for (let j = 1; j < ordenadas.length; j++) expect(ordenadas[j].y).toBeGreaterThanOrEqual(ordenadas[j - 1].y + ordenadas[j - 1].altura);
        evidencias.push({ cenario: i, width, ...medida });
        if ([0, 17].includes(i)) await page.screenshot({ path: `local/issue-88/eixo-${i}-${width}.png`, fullPage: true });
      }
      if (i === 0) {
        await expect(figura.locator("svg")).toContainText("R$ 1,22 mi");
        const coordenadas = await figura.locator("svg").evaluate((svg) => {
          const marca = Array.from(svg.querySelectorAll("text")).find((t) => t.textContent === "R$ 1,22 mi")!;
          const pontos = svg.querySelector("polyline")!.getAttribute("points")!.split(" ").map((p) => p.split(",").map(Number));
          return { pontoY: pontos[1][1], marcaY: Number(marca.getAttribute("y")) };
        });
        expect(coordenadas.pontoY).toBeGreaterThan(coordenadas.marcaY);
      }
    }
    await info.attach("medidas-eixos", { body: JSON.stringify(evidencias, null, 2), contentType: "application/json" });
    await context.addCookies([{ name: "sf_ocultar_valores", value: "1", url: baseURL! }]);
    await page.goto("/?periodo=desde_inicio");
    const html = await page.content();
    expect(html).not.toMatch(/R\$(\s|&nbsp;| )*[−-]?\d/);
    await expect(page.locator("figure", { has: page.locator("#grafico-patrimonio-titulo") }).locator("svg")).toContainText("••••");
  });
});
