"use client";

import { ComboboxAtivo } from "@/components/combobox-ativo";
import { Campo } from "@/components/campos";
import type { Opcao } from "@/lib/telas/combobox";
import { type ColunaIndicador, INDICADORES, OPCOES_INDICADOR, valorDoIndicador } from "@/lib/telas/detalhes-ativo";

// Campos descritivos do ativo (ciclo 012, issue #128, BL-009), comuns ao cadastro e à edição:
// classe e instituição como campos principais, com busca e "Cadastrar «texto»" (DESIGN.md 6.8), e
// os quatro indicadores dentro de "Mais detalhes", fechado por padrão. Nada aqui entra em cálculo.
export function CamposDetalhes({
  prefixo,
  classes,
  instituicoes,
  inicial,
}: {
  /** Prefixo dos ids, para não repetir entre formulários. */
  prefixo: string;
  classes: readonly Opcao[];
  instituicoes: readonly Opcao[];
  inicial?: { classe: string | null; instituicao: string | null } & Record<ColunaIndicador, boolean | null>;
}) {
  const algumInformado = inicial ? INDICADORES.some((i) => inicial[i.coluna] !== null) : false;

  return (
    <>
      <Campo id={`${prefixo}-classe`} rotulo="Classe">
        <ComboboxAtivo
          id={`${prefixo}-classe`}
          nome="classe"
          nomeNovo="classeNova"
          opcoes={classes}
          valorInicial={inicial?.classe ?? undefined}
          placeholder="Opcional: busque ou cadastre"
          foraDaLista="Escolha uma classe da lista ou cadastre uma nova."
          semResultado="Nenhuma classe cadastrada. Digite um nome para cadastrar."
        />
      </Campo>
      <Campo id={`${prefixo}-instituicao`} rotulo="Instituição">
        <ComboboxAtivo
          id={`${prefixo}-instituicao`}
          nome="instituicao"
          nomeNovo="instituicaoNova"
          opcoes={instituicoes}
          valorInicial={inicial?.instituicao ?? undefined}
          placeholder="Opcional: busque ou cadastre"
          foraDaLista="Escolha uma instituição da lista ou cadastre uma nova."
          semResultado="Nenhuma instituição cadastrada. Digite um nome para cadastrar."
        />
      </Campo>
      <details open={algumInformado} className="rounded-md border border-border">
        <summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm/5 font-medium text-primary hover:bg-surface-subtle">
          Mais detalhes
        </summary>
        <div className="flex flex-col gap-4 border-t border-border p-4">
          <p className="text-sm/5 text-text-secondary">Anotação sua. O Saldo Futuro não calcula nada com estes campos.</p>
          {INDICADORES.map((indicador) => (
            <fieldset key={indicador.campo} className="flex flex-col gap-1">
              <legend className="mb-1 text-sm/5 font-medium text-text">{indicador.rotulo}</legend>
              <div className="flex flex-wrap gap-x-5">
                {OPCOES_INDICADOR.map((opcao) => (
                  <label key={opcao.valor} className="flex min-h-11 items-center gap-2 text-base/6">
                    <input
                      type="radio"
                      name={indicador.campo}
                      value={opcao.valor}
                      defaultChecked={valorDoIndicador(inicial?.[indicador.coluna] ?? null) === opcao.valor}
                      className="size-5"
                    />
                    {opcao.rotulo}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </details>
    </>
  );
}
