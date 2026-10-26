"use client";

import { useActionState } from "react";
import { editarAtivo } from "@/app/(app)/ativos/acoes";
import { botaoPrincipal } from "@/components/botoes";
import { Retorno } from "@/components/campos";
import { CamposDetalhes } from "@/components/formularios/detalhes-ativo";
import { ESTADO_INICIAL } from "@/lib/telas/acao";
import type { Opcao } from "@/lib/telas/combobox";
import type { Ativo } from "@/lib/telas/leituras";

// Formulário de /ativos/[id]/editar (ciclo 012, issue #128): só os campos descritivos. Nome e tipo
// de ajuste aparecem para leitura e não mudam. A recusa aparece aqui; o sucesso volta à aba de
// onde o ativo veio.
export function FormEditarAtivo({
  ativo,
  rotuloAjuste,
  classes,
  classeAtual,
  instituicoes,
}: {
  ativo: Ativo;
  rotuloAjuste: string;
  classes: readonly Opcao[];
  /** Caminho completo do nó atual, ou "Sem classe" com a dica do legado. */
  classeAtual: string;
  instituicoes: readonly Opcao[];
}) {
  const [estado, executar, pendente] = useActionState(editarAtivo, ESTADO_INICIAL);

  return (
    <form action={executar} className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
      <input type="hidden" name="ativo" value={ativo.id} />
      <input type="hidden" name="aba" value={ativo.ativo ? "" : "desativados"} />
      <dl className="flex flex-col gap-3">
        <div>
          <dt className="text-sm/5 font-medium text-text-secondary">Nome</dt>
          <dd className="text-base/6 break-words text-text">{ativo.nome}</dd>
        </div>
        <div>
          <dt className="text-sm/5 font-medium text-text-secondary">Tipo de ajuste no fechamento</dt>
          <dd className="text-base/6 text-text">{rotuloAjuste}</dd>
        </div>
        <div>
          <dt className="text-sm/5 font-medium text-text-secondary">Classe atual</dt>
          <dd className="text-base/6 break-words text-text">{classeAtual}</dd>
        </div>
      </dl>
      <CamposDetalhes
        prefixo="editar"
        classes={classes}
        instituicoes={instituicoes}
        inicial={{
          classe: ativo.taxonomia_id,
          instituicao: ativo.instituicao_id,
          previdencia: ativo.previdencia,
          liquidez_imediata: ativo.liquidez_imediata,
          exposicao_cambial: ativo.exposicao_cambial,
          isento_ir: ativo.isento_ir,
        }}
      />
      <Retorno {...estado} />
      <button type="submit" disabled={pendente} className={`${botaoPrincipal} sm:self-end`}>
        Salvar alterações
      </button>
    </form>
  );
}
