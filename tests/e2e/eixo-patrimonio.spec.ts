import { expect, test } from "@playwright/test";
import { prepararCenario } from "./apoio/cenarios";
import { clienteDoUsuario, configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";
import { larguraEstimada } from "../../src/components/graficos/margem";
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
          return { caixas, margem: Number(linhas[0].getAttribute("x1")), curva: Number(linhas[0].getAttribute("x2")) - Number(linhas[0].getAttribute("x1")), fonte: getComputedStyle(svg).fontFamily, innerWidth, clientWidth: document.documentElement.clientWidth };
        });
        expect(medida.fonte).toContain("IBM Plex Sans");
        expect(medida.curva).toBeGreaterThanOrEqual(160);
        expect(new Set(medida.caixas.map((b) => b.texto)).size).toBe(medida.caixas.length);
        for (const b of medida.caixas) {
          expect(b.x, b.texto!).toBeGreaterThanOrEqual(0);
          expect(b.x + b.largura).toBeLessThan(medida.margem);
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

// Margem comum dos três gráficos de eixo do Início (#94, BL-013). Somente centavos fictícios.
const cenariosMargem = {
  comum: [120000000, 123000000, 126000000],
  extremo: [9007199254738991, 9007199254739991, 9007199254740991],
};

test.describe("margem comum dos gráficos do Início (#94)", () => {
  test.skip(!configurado, "Requer Supabase local com dados fictícios.");
  let usuarios: Record<string, UsuarioDeTeste>;
  test.beforeAll(async () => {
    usuarios = await criarUsuarios("margem94", Object.fromEntries(Object.keys(cenariosMargem).map((k) => [k, "user" as const])));
    for (const [nome, valores] of Object.entries(cenariosMargem)) {
      await prepararCenario(await clienteDoUsuario(usuarios[nome]), [
        { criarAtivo: "A", nome: "Ativo fictício", tipoAjuste: "rendimento" },
        { lancar: "A", data: "2025-12-01", tipo: "aporte", valor: valores[0] },
        { fechar: "2025-12", saldos: { A: valores[0] } },
        ...valores.slice(1).map((v, j) => ({ fechar: `2026-0${j + 1}`, saldos: { A: v } })),
      ]);
    }
  });
  test.afterAll(async () => { if (usuarios) await removerUsuarios(usuarios); });

  for (const [nome, valores] of Object.entries(cenariosMargem)) {
    test(`${nome}: os três gráficos começam a grade na mesma coordenada, sem corte nem sobreposição`, async ({ page }, info) => {
      await entrar(page, usuarios[nome]);
      await page.goto("/?periodo=desde_inicio");
      const ids = ["patrimonio", "rentabilidade", "base100"];
      const evidencias = [];
      for (const width of [360, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(() => document.fonts.ready);
        const graficos = [];
        for (const id of ids) {
          const svg = page.locator(`figure:has(#grafico-${id}-titulo) > svg`);
          await expect(svg, `gráfico ${id}`).toHaveCount(1);
          graficos.push({ id, ...(await svg.evaluate((el) => {
            const linhas = Array.from(el.querySelectorAll("line"));
            const caixas = Array.from(el.querySelectorAll("text[text-anchor=end]")).map((t) => { const b = (t as SVGGraphicsElement).getBBox(); return { texto: t.textContent!, x: b.x, y: b.y, largura: b.width, altura: b.height }; });
            return { margem: Number(linhas[0].getAttribute("x1")), fim: Number(linhas[0].getAttribute("x2")), caixas, fonte: getComputedStyle(el).fontFamily };
          })) });
        }
        const margem = graficos[0].margem;
        for (const g of graficos) {
          expect(g.fonte).toContain("IBM Plex Sans");
          expect(g.margem, `margem de ${g.id}`).toBe(margem);
          expect(g.fim - g.margem).toBeGreaterThanOrEqual(160);
          for (const b of g.caixas) {
            expect(b.x, `${g.id} ${b.texto}`).toBeGreaterThanOrEqual(0);
            expect(b.x + b.largura, `${g.id} ${b.texto}`).toBeLessThan(g.margem);
            expect(b.y).toBeGreaterThanOrEqual(0);
            expect(b.y + b.altura).toBeLessThanOrEqual(200);
            expect(larguraEstimada(b.texto), `estimativa de ${g.id} ${b.texto}`).toBeGreaterThanOrEqual(b.largura);
          }
          const ordenadas = g.caixas.toSorted((a, b) => a.y - b.y);
          for (let j = 1; j < ordenadas.length; j++) expect(ordenadas[j].y).toBeGreaterThanOrEqual(ordenadas[j - 1].y + ordenadas[j - 1].altura);
        }
        if (nome === "comum") expect(margem).toBe(70);
        else { expect(margem).toBeGreaterThan(70); expect(margem).toBeLessThanOrEqual(144); }
        evidencias.push({ cenario: nome, width, valores, margem, graficos: graficos.map((g) => ({ id: g.id, caixas: g.caixas })) });
      }
      await info.attach("medidas-margem-comum", { body: JSON.stringify(evidencias, null, 2), contentType: "application/json" });
    });
  }
});
