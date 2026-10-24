"use client";

import { useActionState } from "react";
import { criarAtivo } from "@/app/(app)/ativos/acoes";
import { botaoPrincipal } from "@/components/botoes";
import { Campo, classeCampo, Retorno } from "@/components/campos";
import { CamposDetalhes } from "@/components/formularios/detalhes-ativo";
import type { Opcao } from "@/lib/telas/combobox";
import { ESTADO_INICIAL } from "@/lib/telas/acao";

// Formulário de /ativos/novo (BL-006, ciclo 010). A recusa aparece aqui, sem sair da página; o
// sucesso redireciona para /ativos. Classe, instituição e indicadores vêm do ciclo 012 (#128).
export function FormNovoAtivo({ classes, instituicoes }: { classes: readonly Opcao[]; instituicoes: readonly Opcao[] }) {
  const [estado, executar, pendente] = useActionState(criarAtivo, ESTADO_INICIAL);

  return (
    <form action={executar} className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
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
      <CamposDetalhes prefixo="ativo" classes={classes} instituicoes={instituicoes} />
      <Retorno {...estado} />
      <button type="submit" disabled={pendente} className={`${botaoPrincipal} sm:self-end`}>
        Cadastrar ativo
      </button>
    </form>
  );
}
