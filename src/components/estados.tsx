// Estados vazio, carregando e erro (DESIGN.md 6.11). Nenhum deles mostra número provisório.

import type { ReactNode } from "react";
import { IconeAlerta } from "@/components/icones";

export function EstadoVazio({ titulo, children, acao }: { titulo: string; children: ReactNode; acao?: ReactNode }) {
  return (
    <section className="flex flex-col items-start gap-3 rounded-md border border-border bg-surface p-6">
      <h2 className="text-lg/7 font-semibold text-text">{titulo}</h2>
      <p className="max-w-prose text-base/6 text-text-secondary">{children}</p>
      {acao}
    </section>
  );
}

/** Esqueleto com a forma do conteúdo; a animação some com prefers-reduced-motion. */
export function Esqueleto({ linhas = 3 }: { linhas?: number }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <span className="sr-only">Carregando</span>
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} aria-hidden="true" className="h-16 animate-pulse rounded-md bg-surface-sunken" />
      ))}
    </div>
  );
}

export function EstadoErro({ children, acao }: { children: ReactNode; acao?: ReactNode }) {
  return (
    <section role="alert" className="flex flex-col items-start gap-3 rounded-md border border-border bg-surface p-6">
      <div className="flex items-center gap-2 text-loss">
        <IconeAlerta className="size-6 shrink-0" />
        <h2 className="text-lg/7 font-semibold text-text">Algo deu errado</h2>
      </div>
      <p className="max-w-prose text-base/6 text-text-secondary">{children}</p>
      {acao}
    </section>
  );
}

/** Destino que ainda não tem tela: explica em vez de levar a um erro. */
export function EmBreve({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <>
      <h1 className="mb-6 text-2xl/8 font-semibold text-text">{titulo}</h1>
      <EstadoVazio titulo="Em breve">{children}</EstadoVazio>
    </>
  );
}
