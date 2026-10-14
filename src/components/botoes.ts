// Classes das variantes de botão (DESIGN.md 6.9): altura mínima de 44 px, radius-md e rótulo label.

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm/5 font-medium disabled:cursor-not-allowed disabled:opacity-60";

export const botaoPrincipal = `${base} bg-primary text-on-primary hover:bg-primary-hover`;
export const botaoSecundario = `${base} border border-border-strong bg-surface text-primary`;
export const botaoDestrutivo = `${base} bg-loss text-on-primary`;
export const botaoTexto = `${base} text-primary`;
