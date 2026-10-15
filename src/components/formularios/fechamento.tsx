"use client";

// Fechamento em três etapas (KB-004, seção 5): 1) pendências, com o saldo real de cada ativo;
// 2) revisão dos ajustes e da identidade, calculados no servidor; 3) fechar, gravado só pela
// função do banco. O envio não limpa os saldos digitados, para a pessoa poder corrigir um valor
// depois da revisão. Quantias trazidas pela tela respeitam "Ocultar valores"; o que a pessoa
// digita continua visível (P20).

import { type FormEvent, startTransition, useActionState } from "react";
import { fecharMes, revisarFechamento } from "@/app/(app)/lancamentos/fechamento/acoes";
import { botaoPrincipal, botaoSecundario } from "@/components/botoes";
import { Retorno } from "@/components/campos";
import { ConteudoDinheiro, ConteudoVariacaoDinheiro } from "@/components/valores";
import { ESTADO_INICIAL } from "@/lib/telas/acao";
import type { EstadoRevisao } from "@/lib/telas/estado-fechamento";

export interface LinhaSerializada {
  ativo: string;
  nome: string;
  saldoInicial: string;
  movimento: string;
  saldoCalculado: string;
  exigeSaldoReal: boolean;
}

const ROTULO_AJUSTE = { rendimento: "rendimento", marcacao: "marcação a mercado" } as const;

const ROTULOS_CONSOLIDADO: [keyof NonNullable<EstadoRevisao["revisao"]>["consolidado"], string][] = [
  ["vi", "Patrimônio no início do mês"],
  ["aportes", "Aportes"],
  ["resgates", "Resgates"],
  ["rendimento", "Rendimento (com ajustes)"],
  ["marcacao", "Marcação a mercado (com ajustes)"],
  ["cambio", "Câmbio"],
  ["vf", "Patrimônio no fim do mês"],
];

export function FormFechamento({
  mes,
  rotuloMes,
  linhas,
  oculto,
}: {
  mes: string;
  rotuloMes: string;
  linhas: LinhaSerializada[];
  oculto: boolean;
}) {
  const [revisao, revisar, revisando] = useActionState(revisarFechamento, ESTADO_INICIAL as EstadoRevisao);
  const [fechamento, fechar, fechando] = useActionState(fecharMes, ESTADO_INICIAL);

  function enviar(evento: FormEvent<HTMLFormElement>, acao: (dados: FormData) => void) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    startTransition(() => acao(dados));
  }

  const dinheiro = (valor: string) => <ConteudoDinheiro valor={BigInt(valor)} oculto={oculto} />;

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={(e) => enviar(e, revisar)} className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
        <h2 className="text-lg/7 font-semibold text-text">1. Saldo real de cada ativo</h2>
        <p className="text-base/6 text-text-secondary">
          Informe o saldo de cada ativo no último dia do mês, como aparece na instituição, mesmo que seja igual ao calculado.
        </p>
        <input type="hidden" name="mes" value={mes} />
        <ul className="flex flex-col gap-4">
          {linhas.map((l) => (
            <li key={l.ativo} className="flex flex-col gap-2 border-b border-border pb-4 last:border-0 last:pb-0">
              <p className="text-base/6 font-semibold">{l.nome}</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm/5">
                <dt className="text-text-secondary">Saldo inicial</dt>
                <dd>{dinheiro(l.saldoInicial)}</dd>
                <dt className="text-text-secondary">Lançado no mês</dt>
                <dd>{dinheiro(l.movimento)}</dd>
                <dt className="text-text-secondary">Saldo calculado</dt>
                <dd>{dinheiro(l.saldoCalculado)}</dd>
              </dl>
              {l.exigeSaldoReal ? (
                <div className="flex flex-col gap-1">
                  <label htmlFor={`saldo-${l.ativo}`} className="text-sm/5 font-medium">
                    Saldo real de {l.nome}
                  </label>
                  <div className="flex items-stretch">
                    <span aria-hidden="true" className="flex items-center rounded-l-md border border-r-0 border-border-strong bg-surface-subtle px-3 text-base/6 text-text-secondary">
                      R$
                    </span>
                    <input
                      id={`saldo-${l.ativo}`}
                      name={`saldo:${l.ativo}`}
                      inputMode="decimal"
                      autoComplete="off"
                      className="min-h-11 w-full rounded-r-md border border-border-strong bg-surface px-3 text-base/6 text-text"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm/5 text-text-secondary">Entra pelo saldo calculado: o trânsito não tem saldo real.</p>
              )}
            </li>
          ))}
        </ul>
        <Retorno erro={revisao.erro} />
        <button type="submit" disabled={revisando} className={`${botaoSecundario} sm:self-end`}>
          Revisar fechamento
        </button>
      </form>

      {revisao.revisao ? (
        <section aria-labelledby="revisao-fechamento" className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
          <h2 id="revisao-fechamento" className="text-lg/7 font-semibold text-text">
            2. Revisão
          </h2>
          <ul className="flex flex-col gap-3">
            {revisao.revisao.posicoes.map((p) => (
              <li key={p.ativo} className="flex flex-col gap-1">
                <p className="text-base/6 font-semibold">{p.nome}</p>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm/5">
                  <dt className="text-text-secondary">Saldo calculado</dt>
                  <dd>{dinheiro(p.saldoCalculado)}</dd>
                  <dt className="text-text-secondary">Saldo real</dt>
                  <dd>{dinheiro(p.saldoFinal)}</dd>
                  <dt className="text-text-secondary">Ajuste{p.tipoAjuste ? ` (${ROTULO_AJUSTE[p.tipoAjuste]})` : ""}</dt>
                  <dd>
                    <ConteudoVariacaoDinheiro valor={BigInt(p.ajuste)} oculto={oculto} />
                  </dd>
                </dl>
              </li>
            ))}
          </ul>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-border pt-3 text-sm/5">
            {ROTULOS_CONSOLIDADO.map(([chave, rotulo]) => (
              <div key={chave} className="contents">
                <dt className="text-text-secondary">{rotulo}</dt>
                <dd>{dinheiro(revisao.revisao!.consolidado[chave])}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm/5 text-text-secondary">A identidade contábil confere: a variação do patrimônio é igual à soma dos lançamentos e ajustes.</p>

          <form onSubmit={(e) => enviar(e, fechar)} className="flex flex-col gap-3">
            <h2 className="text-lg/7 font-semibold text-text">3. Fechar</h2>
            <input type="hidden" name="mes" value={mes} />
            <input type="hidden" name="saldos" value={JSON.stringify(revisao.revisao.saldos)} />
            <Retorno erro={fechamento.erro} />
            <button type="submit" disabled={fechando} className={`${botaoPrincipal} sm:self-end`}>
              Fechar {rotuloMes}
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
