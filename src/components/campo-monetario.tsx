"use client";

// Campo monetário (DESIGN.md 6.8; D12 do ciclo 004): rótulo visível, "R$" fora da área
// editável, teclado decimal e o parser da KB-004 para a mensagem imediata. O servidor lê o
// mesmo texto com o mesmo parser e é a autoridade. O que a pessoa digita fica visível mesmo com
// "Ocultar valores" ligado (P20).

import { useId, useState } from "react";
import { RecusaFinanceira } from "@/lib/financeiro/centavos";
import { lerQuantia } from "@/lib/financeiro/quantias";

export const MENSAGENS_QUANTIA: Record<string, string> = {
  formato: "Use o formato 1.234,56, com vírgula e até duas casas decimais.",
  faixa: "O valor está fora do limite aceito.",
};

/** Mensagem da recusa do parser, ou null quando o texto é uma quantia válida. */
export function erroDeQuantia(texto: string): string | null {
  try {
    lerQuantia(texto);
    return null;
  } catch (erro) {
    if (erro instanceof RecusaFinanceira) return MENSAGENS_QUANTIA[erro.motivo] ?? MENSAGENS_QUANTIA.formato;
    throw erro;
  }
}

export function CampoMonetario({
  nome,
  rotulo,
  erroServidor,
  obrigatorio = true,
}: {
  nome: string;
  rotulo: string;
  erroServidor?: string;
  obrigatorio?: boolean;
}) {
  const id = useId();
  const [erro, setErro] = useState<string | null>(null);
  const mensagem = erro ?? erroServidor ?? null;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm/5 font-medium text-text">
        {rotulo}
      </label>
      <div className="flex items-stretch">
        <span
          aria-hidden="true"
          className="flex items-center rounded-l-md border border-r-0 border-border-strong bg-surface-subtle px-3 text-base/6 text-text-secondary"
        >
          R$
        </span>
        <input
          id={id}
          name={nome}
          inputMode="decimal"
          autoComplete="off"
          required={obrigatorio}
          aria-invalid={mensagem ? true : undefined}
          aria-describedby={mensagem ? `${id}-erro` : undefined}
          onBlur={(evento) => setErro(evento.currentTarget.value.trim() ? erroDeQuantia(evento.currentTarget.value) : null)}
          className={`min-h-11 w-full rounded-r-md border bg-surface px-3 text-base/6 text-text ${mensagem ? "border-loss" : "border-border-strong"}`}
        />
      </div>
      {mensagem ? (
        <p id={`${id}-erro`} className="text-sm/5 text-loss">
          {mensagem}
        </p>
      ) : null}
    </div>
  );
}
