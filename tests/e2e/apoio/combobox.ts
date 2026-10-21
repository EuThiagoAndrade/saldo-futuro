import type { Locator } from "@playwright/test";

/** Escolhe um ativo no seletor com busca: digita o nome e confirma a opção pelo clique. */
export async function escolherAtivo(campo: Locator, nome: string) {
  await campo.fill(nome);
  await campo.page().getByRole("listbox").getByRole("option", { name: nome, exact: true }).click();
}
