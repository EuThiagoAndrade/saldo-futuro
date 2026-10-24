"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { botaoPrincipal, botaoSecundario, botaoTexto } from "@/components/botoes";
import { Campo, classeCampo, Retorno } from "@/components/campos";
import { ESTADO_INICIAL, type EstadoAcao } from "@/lib/telas/acao";

type Acao = (estado: EstadoAcao, dados: FormData) => Promise<EstadoAcao>;

// Inclusão no topo das telas de Instituições e Classes (ciclo 012, issue #127). O nome repetido
// é recusado pelo banco e a recusa aparece aqui, sem sair da página.
export function FormIncluirEntrada({ acao, rotuloCampo, rotuloIncluir }: { acao: Acao; rotuloCampo: string; rotuloIncluir: string }) {
  const [estado, executar, pendente] = useActionState(acao, ESTADO_INICIAL);
  const id = useId();

  return (
    <form action={executar} className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Campo id={`${id}-nome`} rotulo={rotuloCampo}>
            <input id={`${id}-nome`} name="nome" required maxLength={100} autoComplete="off" className={classeCampo} />
          </Campo>
        </div>
        <button type="submit" disabled={pendente} className={botaoPrincipal}>
          {rotuloIncluir}
        </button>
      </div>
      <Retorno {...estado} />
    </form>
  );
}

// Renomear em linha: o botão abre o campo com o nome atual; Salvar envia, Cancelar ou Esc fecham
// sem enviar. O sucesso fecha o campo e a lista volta com o nome novo.
export function RenomearEntrada({ acao, id, nome }: { acao: Acao; id: string; nome: string }) {
  const [aberto, setAberto] = useState(false);
  const campo = useId();
  const gatilho = useRef<HTMLButtonElement>(null);
  const voltarFoco = useRef(false);
  const [estado, executar, pendente] = useActionState(async (anterior: EstadoAcao, dados: FormData) => {
    const resultado = await acao(anterior, dados);
    if (resultado.ok) {
      voltarFoco.current = true;
      setAberto(false);
    }
    return resultado;
  }, ESTADO_INICIAL);

  useEffect(() => {
    if (!aberto && voltarFoco.current) {
      voltarFoco.current = false;
      gatilho.current?.focus();
    }
  }, [aberto]);

  function fechar() {
    voltarFoco.current = true;
    setAberto(false);
  }

  if (!aberto) {
    return (
      <button ref={gatilho} type="button" className={botaoTexto} aria-label={`Renomear ${nome}`} onClick={() => setAberto(true)}>
        Renomear
      </button>
    );
  }

  return (
    <form
      action={executar}
      data-renomeando=""
      onKeyDown={(evento) => {
        if (evento.key === "Escape") fechar();
      }}
      className="flex w-full flex-col gap-3"
    >
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Campo id={campo} rotulo={`Novo nome de ${nome}`}>
            <input id={campo} name="nome" required maxLength={100} defaultValue={nome} autoFocus autoComplete="off" className={classeCampo} />
          </Campo>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={pendente} className={botaoSecundario}>
            Salvar nome
          </button>
          <button type="button" className={botaoTexto} onClick={fechar}>
            Cancelar
          </button>
        </div>
      </div>
      {estado.erro ? <Retorno erro={estado.erro} /> : null}
    </form>
  );
}
