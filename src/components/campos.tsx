// Campos de formulário (DESIGN.md 6.8): rótulo visível acima do campo, altura mínima de 44 px e
// seletor nativo para datas.

import type { ReactNode } from "react";

export const classeCampo = "min-h-11 w-full rounded-md border border-border-strong bg-surface px-3 text-base/6 text-text";

export function Campo({ id, rotulo, children }: { id: string; rotulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm/5 font-medium text-text">
        {rotulo}
      </label>
      {children}
    </div>
  );
}

/** Mensagem de sucesso ou de recusa devolvida pela ação. */
export function Retorno({ ok, erro }: { ok?: string; erro?: string }) {
  if (erro) {
    return (
      <p role="alert" className="text-sm/5 text-loss">
        {erro}
      </p>
    );
  }
  if (ok) {
    return (
      <p role="status" className="text-sm/5 text-text-secondary">
        {ok}
      </p>
    );
  }
  return null;
}
