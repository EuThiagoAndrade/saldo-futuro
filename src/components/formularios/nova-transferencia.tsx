"use client";

import { useActionState, useEffect, useRef } from "react";
import { transferir } from "@/app/(app)/transferencias/acoes";
import { botaoPrincipal } from "@/components/botoes";
import { CampoMonetario } from "@/components/campo-monetario";
import { Campo, classeCampo, Retorno } from "@/components/campos";
import { SeletorDeAtivo } from "@/components/seletor-de-ativo";
import { ESTADO_INICIAL } from "@/lib/telas/acao";
import type { AtivoDoSeletor } from "@/lib/telas/seletor-ativo";
import type { NoTaxonomia } from "@/lib/telas/taxonomia";

// Transferência entre ativos da própria carteira (KB-004, 4.4): não é aporte nem resgate. O
// ativo "Em trânsito" guarda o dinheiro entre a saída de uma instituição e a chegada em outra. Origem e
// destino usam o seletor com "Filtrar ativos" (ciclo 019, issue #191), cada um com filtros independentes.
export function FormNovaTransferencia({
  ativos,
  nos,
  instituicoes,
  hoje,
}: {
  ativos: AtivoDoSeletor[];
  nos: NoTaxonomia[];
  instituicoes: { id: string; nome: string }[];
  hoje: string;
}) {
  const [estado, executar, pendente] = useActionState(transferir, ESTADO_INICIAL);
  const formulario = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.ok) formulario.current?.reset();
  }, [estado]);

  return (
    <form ref={formulario} action={executar} className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
      <h2 className="text-lg/7 font-semibold text-text">Nova transferência</h2>
      <Campo id="transferencia-origem" rotulo="Origem">
        <SeletorDeAtivo
          id="transferencia-origem"
          nome="origem"
          ativos={ativos}
          nos={nos}
          instituicoes={instituicoes}
          mensagemObrigatoria="Escolha o ativo de origem."
          placeholder="Escolha a origem"
          nivelDoTitulo={3}
        />
      </Campo>
      <Campo id="transferencia-destino" rotulo="Destino">
        <SeletorDeAtivo
          id="transferencia-destino"
          nome="destino"
          ativos={ativos}
          nos={nos}
          instituicoes={instituicoes}
          mensagemObrigatoria="Escolha o ativo de destino."
          placeholder="Escolha o destino"
          nivelDoTitulo={3}
        />
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
