"use client";

import { botaoPrincipal } from "@/components/botoes";
import { EstadoErro } from "@/components/estados";

// Estado de erro (DESIGN.md 6.11): mensagem simples e "Tentar novamente", sem detalhe técnico e
// sem o último valor conhecido. Inclui a falha ao ler a sessão ou o perfil (D2) e a leitura que
// não pôde ser completada ou conferida (D13).
export default function Erro({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EstadoErro
      acao={
        <button type="button" onClick={reset} className={botaoPrincipal}>
          Tentar novamente
        </button>
      }
    >
      Não foi possível carregar esta página. Os dados não foram alterados.
    </EstadoErro>
  );
}
