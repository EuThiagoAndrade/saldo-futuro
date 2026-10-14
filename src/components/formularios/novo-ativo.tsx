"use client";

import { useActionState, useEffect, useRef } from "react";
import { criarAtivo } from "@/app/(app)/ativos/acoes";
import { botaoPrincipal } from "@/components/botoes";
import { Campo, classeCampo, Retorno } from "@/components/campos";
import { ESTADO_INICIAL } from "@/lib/telas/acao";

export function FormNovoAtivo() {
  const [estado, executar, pendente] = useActionState(criarAtivo, ESTADO_INICIAL);
  const formulario = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.ok) formulario.current?.reset();
  }, [estado]);

  return (
    <form ref={formulario} action={executar} className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
      <h2 className="text-lg/7 font-semibold text-text">Novo ativo</h2>
      <Campo id="ativo-nome" rotulo="Nome">
        <input id="ativo-nome" name="nome" required maxLength={100} autoComplete="off" className={classeCampo} />
      </Campo>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm/5 font-medium text-text">Tipo de ajuste no fechamento</legend>
        <label className="flex min-h-11 items-center gap-3 text-base/6">
          <input type="radio" name="tipoAjuste" value="rendimento" required className="size-5" />
          Rendimento (renda fixa, poupança)
        </label>
        <label className="flex min-h-11 items-center gap-3 text-base/6">
          <input type="radio" name="tipoAjuste" value="marcacao" className="size-5" />
          Marcação a mercado (renda variável, cripto)
        </label>
      </fieldset>
      <Retorno {...estado} />
      <button type="submit" disabled={pendente} className={`${botaoPrincipal} sm:self-end`}>
        Cadastrar ativo
      </button>
    </form>
  );
}
