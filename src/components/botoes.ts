// Classes das variantes de botão (DESIGN.md 6.9): altura mínima de 44 px, radius-md e rótulo label.
// Cursor, hover e pressão só valem para controle habilitado (not-disabled também cobre links com
// a aparência de botão); o deslocamento de 1 px respeita prefers-reduced-motion.

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm/5 font-medium not-disabled:cursor-pointer motion-safe:not-disabled:active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60";

export const botaoPrincipal = `${base} bg-primary text-on-primary not-disabled:hover:bg-primary-hover not-disabled:active:bg-primary-hover`;
export const botaoSecundario = `${base} border border-border-strong bg-surface text-primary not-disabled:hover:bg-surface-subtle not-disabled:active:bg-primary-subtle`;
export const botaoDestrutivo = `${base} bg-loss text-on-primary not-disabled:active:bg-loss/90`;
export const botaoTexto = `${base} text-primary not-disabled:hover:bg-surface-subtle not-disabled:active:bg-primary-subtle`;
