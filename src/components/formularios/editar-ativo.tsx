"use client";

import { useActionState, useState } from "react";
import { editarAtivo } from "@/app/(app)/ativos/acoes";
import { botaoPrincipal } from "@/components/botoes";
import { Campo, classeCampo, Retorno } from "@/components/campos";
import { CamposDetalhes } from "@/components/formularios/detalhes-ativo";
import { ESTADO_INICIAL } from "@/lib/telas/acao";
import type { Opcao } from "@/lib/telas/combobox";
import type { Ativo } from "@/lib/telas/leituras";

// Formulário de /ativos/[id]/editar (ciclo 012, issue #128; nome desde o ciclo 015, issue #153):
// nome e campos descritivos, salvos numa única chamada. O tipo de ajuste aparece para leitura e não
// muda. O nome é um campo controlado: uma recusa mantém o que foi digitado. A recusa aparece aqui; o
// sucesso volta à aba de onde o ativo veio.
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
  const [nome, setNome] = useState(ativo.nome);

  return (
    <form action={executar} className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
      <input type="hidden" name="ativo" value={ativo.id} />
      <input type="hidden" name="aba" value={ativo.ativo ? "" : "desativados"} />
      <Campo id="editar-nome" rotulo="Nome">
        <input
          id="editar-nome"
          name="nome"
          required
          autoComplete="off"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          aria-describedby="editar-nome-dica"
          className={classeCampo}
        />
        <p id="editar-nome-dica" className="text-sm/5 text-text-secondary">
          O nome atual também aparece nos registros antigos deste ativo.
        </p>
      </Campo>
      <dl className="flex flex-col gap-3">
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
