"use client";

import { useActionState, useEffect, useRef } from "react";
import { transferir } from "@/app/(app)/transferencias/acoes";
import { botaoPrincipal } from "@/components/botoes";
import { CampoMonetario } from "@/components/campo-monetario";
import { ComboboxAtivo } from "@/components/combobox-ativo";
import { Campo, classeCampo, Retorno } from "@/components/campos";
import { ESTADO_INICIAL } from "@/lib/telas/acao";

// Transferência entre ativos da própria carteira (KB-004, 4.4): não é aporte nem resgate. O
// ativo "Em trânsito" guarda o dinheiro entre a saída de uma instituição e a chegada em outra.
export function FormNovaTransferencia({ ativos, hoje }: { ativos: { id: string; nome: string }[]; hoje: string }) {
  const [estado, executar, pendente] = useActionState(transferir, ESTADO_INICIAL);
  const formulario = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.ok) formulario.current?.reset();
  }, [estado]);

  return (
    <form ref={formulario} action={executar} className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
      <h2 className="text-lg/7 font-semibold text-text">Nova transferência</h2>
      <Campo id="transferencia-origem" rotulo="Origem">
        <ComboboxAtivo id="transferencia-origem" nome="origem" opcoes={ativos} obrigatorio mensagemObrigatoria="Escolha o ativo de origem." placeholder="Escolha a origem" />
      </Campo>
      <Campo id="transferencia-destino" rotulo="Destino">
        <ComboboxAtivo id="transferencia-destino" nome="destino" opcoes={ativos} obrigatorio mensagemObrigatoria="Escolha o ativo de destino." placeholder="Escolha o destino" />
      </Campo>
      <CampoMonetario nome="valor" rotulo="Valor" />
      <Campo id="transferencia-data" rotulo="Data">
        <input id="transferencia-data" name="data" type="date" required max={hoje} defaultValue={hoje} className={classeCampo} />
      </Campo>
      <Retorno {...estado} />
      <button type="submit" disabled={pendente} className={`${botaoPrincipal} sm:self-end`}>
        Transferir
      </button>
    </form>
  );
}
