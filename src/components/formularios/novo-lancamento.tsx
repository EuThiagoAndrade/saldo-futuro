"use client";

import { useActionState, useState } from "react";
import { lancar } from "@/app/(app)/lancamentos/acoes";
import { botaoPrincipal } from "@/components/botoes";
import { CampoMonetario } from "@/components/campo-monetario";
import { Campo, classeCampo, Retorno } from "@/components/campos";
import { ESTADO_INICIAL } from "@/lib/telas/acao";
import { exigeDirecao, ROTULO_TIPO, TIPOS_DA_TELA, type TipoDaTela } from "@/lib/telas/carteira";

// Novo lançamento (P9): o valor é sempre digitado positivo; aporte entra, resgate sai, e
// rendimento, marcação e câmbio pedem "Ganho" ou "Perda". O servidor confere tudo de novo.
export function FormNovoLancamento({ ativos, hoje }: { ativos: { id: string; nome: string }[]; hoje: string }) {
  const [estado, executar, pendente] = useActionState(lancar, ESTADO_INICIAL);
  const [tipo, setTipo] = useState<TipoDaTela>("aporte");

  return (
    <form action={executar} className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
      <Campo id="lancamento-ativo" rotulo="Ativo">
        <select id="lancamento-ativo" name="ativo" required className={classeCampo} defaultValue="">
          <option value="" disabled>
            Escolha o ativo
          </option>
          {ativos.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </select>
      </Campo>
      <Campo id="lancamento-tipo" rotulo="Tipo">
        <select
          id="lancamento-tipo"
          name="tipo"
          required
          className={classeCampo}
          value={tipo}
          onChange={(evento) => setTipo(evento.currentTarget.value as TipoDaTela)}
        >
          {TIPOS_DA_TELA.map((t) => (
            <option key={t} value={t}>
              {ROTULO_TIPO[t]}
            </option>
          ))}
        </select>
      </Campo>
      {exigeDirecao(tipo) ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm/5 font-medium text-text">Direção</legend>
          <label className="flex min-h-11 items-center gap-3 text-base/6">
            <input type="radio" name="direcao" value="ganho" required className="size-5" />
            Ganho
          </label>
          <label className="flex min-h-11 items-center gap-3 text-base/6">
            <input type="radio" name="direcao" value="perda" className="size-5" />
            Perda
          </label>
        </fieldset>
      ) : null}
      <CampoMonetario nome="valor" rotulo="Valor" />
      <Campo id="lancamento-data" rotulo="Data">
        <input id="lancamento-data" name="data" type="date" required max={hoje} defaultValue={hoje} className={classeCampo} />
      </Campo>
      <Retorno erro={estado.erro} />
      <button type="submit" disabled={pendente} className={`${botaoPrincipal} sm:self-end`}>
        Registrar lançamento
      </button>
    </form>
  );
}
