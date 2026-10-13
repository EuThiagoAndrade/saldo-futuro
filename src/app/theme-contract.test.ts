import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");

// O segundo bloco `css` da seção 5 do DESIGN.md é o mapeamento canônico dos tokens.
function canonicalTheme(): string {
  const blocks = [...read("design-system/DESIGN.md").matchAll(/```css\n([\s\S]*?)\n```/g)];
  const block = blocks.find((match) => match[1].includes("@theme"));
  if (!block) throw new Error("Bloco @theme não encontrado no DESIGN.md.");
  return block[1];
}

describe("contrato de tokens", () => {
  const globals = read("src/app/globals.css");

  it("globals.css contém o bloco @theme do DESIGN.md, sem alteração", () => {
    expect(globals).toContain(canonicalTheme());
  });

  it("remove a paleta padrão do Tailwind", () => {
    expect(globals).toContain("--color-*: initial;");
  });

  it("não declara cor literal fora do bloco @theme", () => {
    const outside = globals.replace(canonicalTheme(), "");
    expect(outside).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
  });
});
