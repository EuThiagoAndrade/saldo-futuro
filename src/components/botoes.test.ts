import { expect, it } from "vitest";
import { botaoDestrutivo, botaoPrincipal, botaoSecundario, botaoTexto } from "./botoes";

const variantes = { botaoPrincipal, botaoSecundario, botaoDestrutivo, botaoTexto };

it.each(Object.entries(variantes))("%s: ponteiro, pressão e desabilitado seguem o DESIGN.md 6.9", (_nome, classes) => {
  const lista = classes.split(" ");
  expect(lista).toContain("not-disabled:cursor-pointer");
  expect(lista).toContain("disabled:cursor-not-allowed");
  expect(lista).toContain("motion-safe:not-disabled:active:translate-y-px");
  // O deslocamento nunca vale sem a proteção de movimento reduzido, e hover/pressão não valem desabilitados.
  expect(lista.filter((c) => c.includes("translate") && !c.startsWith("motion-safe:"))).toEqual([]);
  expect(lista.filter((c) => /(^|:)(hover|active):/.test(c) && !c.includes("not-disabled:"))).toEqual([]);
});

it("cada variante tem a cor de pressão definida, sem tokens novos", () => {
  expect(botaoPrincipal).toContain("not-disabled:hover:bg-primary-hover");
  expect(botaoPrincipal).toContain("not-disabled:active:bg-primary-hover");
  for (const secundariaOuTexto of [botaoSecundario, botaoTexto]) {
    expect(secundariaOuTexto).toContain("not-disabled:hover:bg-surface-subtle");
    expect(secundariaOuTexto).toContain("not-disabled:active:bg-primary-subtle");
  }
  expect(botaoDestrutivo).toContain("not-disabled:active:bg-loss/90");
  expect(botaoDestrutivo).not.toContain("hover:bg-");
});
