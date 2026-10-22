// Rosca da distribuição por ativo (ADR-005, emenda do ciclo 010; DESIGN.md 2.3 e 6.13; KB-004,
// seção 15). SVG renderizado no servidor, sem JavaScript: fatias proporcionais aos saldos
// positivos, sem tamanho mínimo, e anel completo para um único positivo. A legenda, as listas e as
// tabelas usam as mesmas participações; o dinheiro já vem formatado (ou oculto) de quem chama.

import type { ReactNode } from "react";
import { textoParticipacao } from "../../lib/apresentacao/valores";
import type { Distribuicao, Parte } from "../../lib/financeiro/distribuicao";

const TAMANHO = 200;
const CENTRO = TAMANHO / 2;
const RAIO_EXTERNO = 96;
const RAIO_INTERNO = 60;

// Ordem das fatias principais (DESIGN.md 2.3); chart-5 é só de Outros.
const CORES = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-6)"];
const AMOSTRAS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-6"];
const COR_OUTROS = "var(--color-chart-5)";
const AMOSTRA_OUTROS = "bg-chart-5";

interface Fatia {
  chave: string;
  saldo: bigint;
  cor: string;
}

const numero = (n: number) => String(Math.round(n * 1000) / 1000);

/** Ponto na circunferência; a volta começa no topo e segue o sentido horário. */
function ponto(raio: number, volta: number): string {
  const angulo = volta * 2 * Math.PI;
  return `${numero(CENTRO + raio * Math.sin(angulo))} ${numero(CENTRO - raio * Math.cos(angulo))}`;
}

function setor(inicio: number, fim: number): string {
  const grande = fim - inicio > 0.5 ? 1 : 0;
  return [
    `M${ponto(RAIO_EXTERNO, inicio)}`,
    `A${RAIO_EXTERNO} ${RAIO_EXTERNO} 0 ${grande} 1 ${ponto(RAIO_EXTERNO, fim)}`,
    `L${ponto(RAIO_INTERNO, fim)}`,
    `A${RAIO_INTERNO} ${RAIO_INTERNO} 0 ${grande} 0 ${ponto(RAIO_INTERNO, inicio)}`,
    "Z",
  ].join("");
}

/** Fração de volta só para desenhar: a razão em bigint vira number na apresentação. */
const voltas = (saldo: bigint, base: bigint) => Number((saldo * 1_000_000_000n) / base) / 1e9;

function Desenho({ fatias, base, rotulo }: { fatias: Fatia[]; base: bigint; rotulo: string }) {
  let inicio = 0;
  return (
    <svg viewBox={`0 0 ${TAMANHO} ${TAMANHO}`} role="img" aria-labelledby={rotulo} className="mx-auto h-auto w-full max-w-56 shrink-0 md:mx-0 md:w-48">
      {fatias.length === 1 ? (
        <circle cx={CENTRO} cy={CENTRO} r={(RAIO_EXTERNO + RAIO_INTERNO) / 2} fill="none" stroke={fatias[0].cor} strokeWidth={RAIO_EXTERNO - RAIO_INTERNO} />
      ) : (
        fatias.map((fatia, i) => {
          const fim = i === fatias.length - 1 ? 1 : inicio + voltas(fatia.saldo, base);
          const caminho = setor(inicio, fim);
          inicio = fim;
          return <path key={fatia.chave} d={caminho} fill={fatia.cor} stroke="var(--color-surface)" strokeWidth={1.5} strokeLinejoin="round" />;
        })
      )}
    </svg>
  );
}

function ItemDaLegenda({ amostra, nome, participacao, valor }: { amostra?: string; nome: ReactNode; participacao: number; valor: ReactNode }) {
  return (
    <span className="flex min-w-0 flex-1 items-start gap-3">
      {amostra ? <span aria-hidden="true" className={`mt-1 size-3 shrink-0 rounded-sm ${amostra}`} /> : null}
      <span className="min-w-0 flex-1 break-words text-sm/5 text-text">{nome}</span>
      <span className="shrink-0 text-right text-sm/5 tabular-nums">
        <span className="block font-medium text-text">{textoParticipacao(participacao)}</span>
        <span className="block text-text-secondary">{valor}</span>
      </span>
    </span>
  );
}

function Tabela({ legenda, linhas }: { legenda: string; linhas: { chave: string; nome: string; participacao: string; valor: ReactNode }[] }) {
  return (
    <table className="w-full border-collapse text-left">
      <caption className="p-2 text-left font-medium text-text">{legenda}</caption>
      <thead>
        <tr className="border-b border-border text-text-secondary">
          <th scope="col" className="p-2 font-medium">
            Ativo
          </th>
          <th scope="col" className="p-2 text-right font-medium">
            Participação
          </th>
          <th scope="col" className="p-2 text-right font-medium">
            Saldo
          </th>
        </tr>
      </thead>
      <tbody>
        {linhas.map((l) => (
          <tr key={l.chave} className="border-b border-border last:border-0">
            <th scope="row" className="p-2 font-normal break-words">
              {l.nome}
            </th>
            <td className="p-2 text-right tabular-nums">{l.participacao}</td>
            <td className="p-2 text-right tabular-nums">{l.valor}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const FORA = "fora da rosca";

export function GraficoRosca({
  id,
  titulo,
  descricao,
  distribuicao,
  dinheiro,
}: {
  id: string;
  titulo: string;
  descricao: string;
  distribuicao: Distribuicao;
  /** Quantia já formatada, ou "Valor oculto", decidida no servidor por quem chama. */
  dinheiro: (centavos: bigint) => ReactNode;
}) {
  const { base, positivos, principais, outros, negativos } = distribuicao;
  const fatias: Fatia[] = [
    ...principais.map((p, i) => ({ chave: p.id, saldo: p.saldo, cor: CORES[i] })),
    ...(outros ? [{ chave: "outros", saldo: outros.saldo, cor: COR_OUTROS }] : []),
  ];
  const linhaDe = (p: Parte) => ({ chave: p.id, nome: p.nome, participacao: textoParticipacao(p.participacao), valor: dinheiro(p.saldo) });
  const linhasNegativas = negativos.map((n) => ({ chave: n.id, nome: n.nome, participacao: FORA, valor: dinheiro(n.saldo) }));
  const resumo = [
    ...principais.map(linhaDe),
    ...(outros ? [{ chave: "outros", nome: "Outros", participacao: textoParticipacao(outros.participacao), valor: dinheiro(outros.saldo) }] : []),
    ...linhasNegativas,
  ];
  const detalhe = [...positivos.map(linhaDe), ...linhasNegativas];

  return (
    <figure className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
      <figcaption className="flex flex-col gap-1">
        <span id={`${id}-titulo`} className="text-lg/7 font-semibold text-text">
          {titulo}
        </span>
        <span id={`${id}-descricao`} className="text-sm/5 text-text-secondary">
          {descricao}
        </span>
      </figcaption>

      {base === 0n ? (
        <p className="text-base/6 text-text-secondary">Não há saldos positivos para exibir.</p>
      ) : (
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <Desenho fatias={fatias} base={base} rotulo={`${id}-titulo ${id}-descricao`} />
          <ol aria-label="Legenda da distribuição" className="flex min-w-0 flex-1 flex-col gap-3">
            {principais.map((p, i) => (
              <li key={p.id} className="flex">
                <ItemDaLegenda amostra={AMOSTRAS[i]} nome={p.nome} participacao={p.participacao} valor={dinheiro(p.saldo)} />
              </li>
            ))}
            {outros ? (
              <li>
                <details className="group">
                  <summary className="flex min-h-11 cursor-pointer items-start gap-1 py-1 [&::-webkit-details-marker]:hidden">
                    {/* Seta no lugar do marcador nativo, que o display flex esconde. */}
                    <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-0.5 size-4 shrink-0 text-text-secondary transition-transform group-open:rotate-90">
                      <path d="m6 4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <ItemDaLegenda
                      amostra={AMOSTRA_OUTROS}
                      nome={
                        <>
                          Outros <span className="text-text-secondary">({outros.componentes.length} ativos)</span>
                        </>
                      }
                      participacao={outros.participacao}
                      valor={dinheiro(outros.saldo)}
                    />
                  </summary>
                  <ul className="mt-2 flex flex-col gap-3 border-l border-border pl-6">
                    {outros.componentes.map((p) => (
                      <li key={p.id} className="flex">
                        <ItemDaLegenda nome={p.nome} participacao={p.participacao} valor={dinheiro(p.saldo)} />
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            ) : null}
          </ol>
        </div>
      )}

      {negativos.length ? (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <p className="text-sm/5 font-medium text-text">Saldos negativos, fora da rosca</p>
          <ul className="flex flex-col gap-2">
            {negativos.map((n) => (
              <li key={n.id} className="flex items-start gap-3 text-sm/5">
                <span className="min-w-0 flex-1 break-words text-text">{n.nome}</span>
                <span className="shrink-0 text-right text-text-secondary tabular-nums">{dinheiro(n.saldo)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {detalhe.length ? (
        <details className="text-sm/5">
          <summary className="min-h-11 cursor-pointer content-center font-medium text-primary">Ver os números</summary>
          <div className="flex flex-col gap-4 overflow-x-auto">
            <Tabela legenda="Resumo" linhas={resumo} />
            <Tabela legenda="Detalhe por ativo" linhas={detalhe} />
          </div>
        </details>
      ) : null}
    </figure>
  );
}
