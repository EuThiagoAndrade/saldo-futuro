import { expect, test } from "@playwright/test";

// Rotas que precisam responder sem sessão e sem redirecionamento para /entrar: o cron da Vercel
// e a instalação do PWA não têm cookie. Vale com e sem backend.
const get = (request: import("@playwright/test").APIRequestContext, path: string) =>
  request.get(path, { maxRedirects: 0 });

test("/api/keepalive sem segredo e sem sessão responde 401, não um redirecionamento", async ({ request }) => {
  const response = await get(request, "/api/keepalive");
  expect(response.status()).toBe(401);
  expect(response.headers()["location"]).toBeUndefined();
  expect(await response.json()).toEqual({ ok: false });
});

test("/api/keepalive recusa um segredo inventado", async ({ request }) => {
  const response = await request.get("/api/keepalive", {
    headers: { authorization: "Bearer segredo-inventado" },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(401);
});

test("o manifesto responde 200 sem redirecionamento e declara o essencial do PWA", async ({ request }) => {
  const response = await get(request, "/manifest.webmanifest");
  expect(response.status()).toBe(200);
  const manifest = await response.json();
  expect(manifest).toMatchObject({
    name: "Saldo Futuro",
    start_url: "/",
    display: "standalone",
    theme_color: "#0b2a55",
  });
  const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
  expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  expect(manifest.icons.some((icon: { purpose?: string }) => icon.purpose === "maskable")).toBe(true);
});

test("os ícones do manifesto e o ícone da Apple respondem 200 como imagem, sem redirecionamento", async ({
  request,
  page,
}) => {
  const manifest = await (await get(request, "/manifest.webmanifest")).json();
  for (const icon of manifest.icons as { src: string }[]) {
    const response = await get(request, icon.src);
    expect(response.status(), icon.src).toBe(200);
    expect(response.headers()["content-type"], icon.src).toContain("image/png");
  }

  // Ícones declarados no <head> pelo Next.js a partir de src/app (favicon SVG e ícone da Apple).
  await page.goto("/entrar");
  const hrefs = await page.locator('head link[rel~="icon"], head link[rel="apple-touch-icon"]').evaluateAll((links) =>
    links.map((link) => (link as HTMLLinkElement).getAttribute("href")),
  );
  expect(hrefs.length).toBeGreaterThanOrEqual(2);
  for (const href of hrefs) {
    const response = await get(request, href!);
    expect(response.status(), href!).toBe(200);
  }
});

// Com o Supabase local e um CRON_SECRET de teste no ambiente do servidor, o cron chega ao banco.
test("/api/keepalive com o segredo correto executa public.keepalive() no banco", async ({ request }) => {
  const secret = process.env.CRON_SECRET;
  test.skip(
    !(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && secret),
    "Roda só com o Supabase local e CRON_SECRET configurados.",
  );
  const response = await request.get("/api/keepalive", {
    headers: { authorization: `Bearer ${secret}` },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
});

// Mesma fonte do painel Application do Chrome: o protocolo de desenvolvimento do navegador.
test("o Chrome não aponta erro no manifesto", async ({ page }) => {
  await page.goto("/entrar");
  const cdp = await page.context().newCDPSession(page);
  const { url, errors, data } = await cdp.send("Page.getAppManifest");
  expect(url).toMatch(/\/manifest\.webmanifest$/);
  expect(errors).toEqual([]);
  expect(JSON.parse(data!).name).toBe("Saldo Futuro");
});
