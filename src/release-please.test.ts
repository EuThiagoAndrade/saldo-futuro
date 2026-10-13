import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"));

describe("configuração do release-please", () => {
  const config = readJson("release-please-config.json");

  // Sem release anterior, o release-please usa `initial-version` (padrão 1.0.0) e ignora o manifesto.
  it("a primeira versão é 0.1.0 (D3 do plano 001)", () => {
    expect(config["initial-version"]).toBe("0.1.0");
    expect(config["bump-minor-pre-major"]).toBe(true);
  });

  it("o manifesto e o package.json têm a mesma versão", () => {
    expect(readJson(".release-please-manifest.json")["."]).toBe(readJson("package.json").version);
  });
});
