import { describe, expect, it, vi } from "vitest";
import { runKeepalive } from "./keepalive";

const SECRET = "segredo-ficticio-do-cron";

function deps(overrides: Partial<Parameters<typeof runKeepalive>[1]> = {}) {
  return { secret: SECRET, ping: vi.fn().mockResolvedValue(true), ...overrides };
}

describe("runKeepalive", () => {
  it("recusa sem o cabeçalho Authorization e não consulta o banco", async () => {
    const d = deps();
    expect((await runKeepalive(null, d)).status).toBe(401);
    expect(d.ping).not.toHaveBeenCalled();
  });

  it("recusa com segredo errado e não consulta o banco", async () => {
    const d = deps();
    expect((await runKeepalive("Bearer outro-segredo", d)).status).toBe(401);
    expect((await runKeepalive(SECRET, d)).status).toBe(401);
    expect(d.ping).not.toHaveBeenCalled();
  });

  it("aceita com o segredo correto e consulta o banco uma vez", async () => {
    const d = deps();
    const result = await runKeepalive(`Bearer ${SECRET}`, d);
    expect(result.status).toBe(200);
    expect(d.ping).toHaveBeenCalledTimes(1);
  });

  // Falha fechada: sem CRON_SECRET no ambiente, nada é aceito, nem "Bearer undefined".
  it("recusa quando CRON_SECRET está ausente do ambiente", async () => {
    for (const header of [null, "Bearer undefined", "Bearer ", "Bearer", "undefined"]) {
      const d = deps({ secret: undefined });
      expect((await runKeepalive(header, d)).status).toBe(401);
      expect(d.ping).not.toHaveBeenCalled();
    }
  });

  it("recusa quando CRON_SECRET está vazio", async () => {
    const d = deps({ secret: "" });
    expect((await runKeepalive("Bearer ", d)).status).toBe(401);
    expect(d.ping).not.toHaveBeenCalled();
  });

  it("responde 500 quando a consulta falha, para a falha aparecer nos logs do cron", async () => {
    expect((await runKeepalive(`Bearer ${SECRET}`, deps({ ping: vi.fn().mockResolvedValue(false) }))).status).toBe(500);
    expect(
      (await runKeepalive(`Bearer ${SECRET}`, deps({ ping: vi.fn().mockRejectedValue(new Error("falha")) }))).status,
    ).toBe(500);
  });

  it("responde 503 sem backend configurado, depois de autenticar o cron", async () => {
    expect((await runKeepalive(`Bearer ${SECRET}`, deps({ ping: null }))).status).toBe(503);
    expect((await runKeepalive("Bearer errado", deps({ ping: null }))).status).toBe(401);
  });
});
