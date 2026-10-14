"use client";

// Confirmação de ação destrutiva (DESIGN.md 6.10): diálogo nativo, com o título que nomeia a
// ação, a consequência em uma frase, "Cancelar" com o foco inicial e o botão destrutivo com o
// verbo da ação. Esc e o toque fora do diálogo cancelam.

import { type ReactNode, useRef } from "react";
import { botaoDestrutivo, botaoSecundario } from "@/components/botoes";

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
  /** Verbo e objeto, como "Excluir lançamento"; nunca "OK" ou "Sim". */
  rotuloAcao: string;
  /** Server Action executada só depois da confirmação. */
  acao: (dados: FormData) => void | Promise<void>;
  /** Campos ocultos enviados com a ação. */
  children?: ReactNode;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const id = `confirmacao-${rotuloAcao.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <>
      <button type="button" className={botaoSecundario} onClick={() => dialogo.current?.showModal()}>
        {gatilho}
      </button>
      <dialog
        ref={dialogo}
        aria-labelledby={`${id}-titulo`}
        aria-describedby={`${id}-consequencia`}
        onClick={(evento) => {
          if (evento.target === dialogo.current) dialogo.current.close();
        }}
        className="m-0 mt-auto w-full max-w-none rounded-t-lg bg-surface p-0 text-text shadow-overlay backdrop:bg-text/40 sm:m-auto sm:max-w-md sm:rounded-lg"
      >
        <form action={acao} className="flex flex-col gap-4 p-6">
          <h2 id={`${id}-titulo`} className="text-lg/7 font-semibold">
            {titulo}
          </h2>
          <p id={`${id}-consequencia`} className="text-base/6 text-text-secondary">
            {consequencia}
          </p>
          {children}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" autoFocus className={botaoSecundario} onClick={() => dialogo.current?.close()}>
              Cancelar
            </button>
            <button type="submit" className={botaoDestrutivo}>
              {rotuloAcao}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
