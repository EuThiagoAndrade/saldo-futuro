"use client";

// Confirmação de ação destrutiva (DESIGN.md 6.10): diálogo nativo, com o título que nomeia a
// ação, a consequência em uma frase, "Cancelar" com o foco inicial e o botão destrutivo com o
// verbo da ação. Esc e o toque fora do diálogo cancelam. A recusa aparece dentro do diálogo; o
// sucesso fecha o diálogo e aparece junto do botão que o abriu.

import { type ReactNode, useActionState, useEffect, useId, useRef } from "react";
import { botaoDestrutivo, botaoSecundario } from "@/components/botoes";
import { ESTADO_INICIAL, type EstadoAcao } from "@/lib/telas/acao";

export function Confirmacao({
  gatilho,
  titulo,
  consequencia,
  rotuloAcao,
  acao,
  children,
}: {
  /** Rótulo do botão que abre o diálogo. */
  gatilho: string;
  titulo: string;
  consequencia: string;
  /** Verbo e objeto, como "Estornar lançamento"; nunca "OK" ou "Sim". */
  rotuloAcao: string;
  /** Server Action executada só depois da confirmação. */
  acao: (estado: EstadoAcao, dados: FormData) => Promise<EstadoAcao>;
  /** Campos enviados com a ação. */
  children?: ReactNode;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [estado, executar, pendente] = useActionState(acao, ESTADO_INICIAL);

  useEffect(() => {
    if (estado.ok) dialogo.current?.close();
  }, [estado]);

  return (
    <div className="flex flex-col items-start gap-2">
      <button type="button" className={botaoSecundario} onClick={() => dialogo.current?.showModal()}>
        {gatilho}
      </button>
      {estado.ok ? (
        <p role="status" className="text-sm/5 text-text-secondary">
          {estado.ok}
        </p>
      ) : null}
      <dialog
        ref={dialogo}
        aria-labelledby={`${id}-titulo`}
        aria-describedby={`${id}-consequencia`}
        onClick={(evento) => {
          if (evento.target === dialogo.current) dialogo.current.close();
        }}
        className="m-0 mt-auto w-full max-w-none rounded-t-lg bg-surface p-0 text-text shadow-overlay backdrop:bg-text/40 sm:m-auto sm:max-w-md sm:rounded-lg"
      >
        <form action={executar} className="flex flex-col gap-4 p-6">
          <h2 id={`${id}-titulo`} className="text-lg/7 font-semibold">
            {titulo}
          </h2>
          <p id={`${id}-consequencia`} className="text-base/6 text-text-secondary">
            {consequencia}
          </p>
          {children}
          {estado.erro ? (
            <p role="alert" className="text-sm/5 text-loss">
              {estado.erro}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" autoFocus className={botaoSecundario} onClick={() => dialogo.current?.close()}>
              Cancelar
            </button>
            <button type="submit" disabled={pendente} className={botaoDestrutivo}>
              {rotuloAcao}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
