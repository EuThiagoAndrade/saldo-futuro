"use client";

import { botaoPrincipal } from "@/components/botoes";
import { EstadoErro } from "@/components/estados";

// Erro fora das páginas da área autenticada, como a falha ao ler a sessão ou o perfil no layout
// (D2): o error.tsx do grupo (app) não captura o erro do próprio layout.
export default function ErroGeral({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-[1120px] flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <EstadoErro
        acao={
          <button type="button" onClick={reset} className={botaoPrincipal}>
            Tentar novamente
          </button>
        }
      >
        Não foi possível carregar esta página. Os dados não foram alterados.
      </EstadoErro>
    </main>
  );
}
