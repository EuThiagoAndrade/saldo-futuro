// Detalhe de um grupo de classe no Início (ciclo 015, issue #154; DESIGN.md 6.13; KB-004, seção 15):
// filhos imediatos e resíduo de uma classe macro ou subclasse, em tabela no desktop e cartões no
// celular, cada um com as duas participações. Não há linha do próprio pai, total, rodapé nem resumo
// numérico: o título traz só o caminho e o mês. Server Component; o dinheiro já vem formatado (ou
// oculto) de quem chama.

import Link from "next/link";
import type { ReactNode } from "react";
import { textoParticipacao } from "../lib/apresentacao/valores";
import type { DetalheDeClasse } from "../lib/financeiro/niveis";

const SEPARADOR = " › ";
const RESIDUO = "Classificado somente neste nível";
const LINK = "inline-flex min-h-11 items-center font-medium text-primary hover:underline";

type Linha = DetalheDeClasse["linhas"][number];

export function DetalheDoRamo({
  id,
  mes,
  detalhe,
  dinheiro,
  href,
}: {
  id: string;
  /** Rótulo do mês M, como "março de 2026". */
  mes: string;
  detalhe: DetalheDeClasse;
  dinheiro: (centavos: bigint) => ReactNode;
  /** Endereço da visão por classe: sem argumento, a raiz; com o ID de um pai, o detalhe dele. */
  href: (classe?: string) => string;
}) {
  const caminho = detalhe.pai.caminho;
  const nomeDoCaminho = caminho.map((n) => n.nome).join(SEPARADOR);
  const { linhas, negativos } = detalhe;

  // Só macro e subclasse têm detalhe: um filho com dois níveis de caminho é uma subclasse.
  const hrefDoFilho = (l: Linha) => (l.grupo.tipo === "no" && l.caminho.length === 2 ? href(l.grupo.no!) : undefined);
  const nomeDaLinha = (l: Linha): ReactNode =>
    l.grupo.tipo === "residuo" ? (
      <>
        {RESIDUO}
        <span className="sr-only">: {l.caminho.map((n) => n.nome).join(SEPARADOR)}</span>
      </>
    ) : (
      l.caminho.at(-1)!.nome
    );
  const celulaDoNome = (l: Linha): ReactNode => {
    const destino = hrefDoFilho(l);
    return destino ? (
      <Link href={destino} className={LINK}>
        {nomeDaLinha(l)}
        <span className="sr-only"> (ver tipos)</span>
      </Link>
    ) : (
      nomeDaLinha(l)
    );
  };
  const chave = (l: Linha) => `${l.grupo.tipo}:${l.grupo.no}`;

  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="Caminho da classe" className="flex flex-wrap items-center gap-x-1 text-sm/5">
        <Link href={href()} className={LINK}>
          Classes macro
        </Link>
        {caminho.map((n, i) => (
          <span key={n.id} className="flex items-center gap-1">
            <span aria-hidden="true" className="text-text-secondary">
              ›
            </span>
            {i === caminho.length - 1 ? (
              <span aria-current="page" className="font-medium text-text">
                {n.nome}
              </span>
            ) : (
              <Link href={href(n.id)} className={LINK}>
                {n.nome}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <figure className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
        <figcaption className="flex flex-col gap-1">
          <span id={`${id}-titulo`} className="text-lg/7 font-semibold break-words text-text">
            {nomeDoCaminho} em {mes}
          </span>
          <span id={`${id}-descricao`} className="text-sm/5 text-text-secondary">
            Classificação atual dos ativos, com os saldos positivos do fim do último mês fechado. Saldos negativos ficam fora das participações, por ativo.
          </span>
        </figcaption>

        {linhas.length === 0 ? (
          <p className="text-base/6 text-text-secondary">Não há saldos positivos neste grupo em {mes}.</p>
        ) : (
          <>
            <p className="text-sm/5 text-text-secondary">
              “% na carteira” é a parte de cada grupo entre todos os grupos da carteira neste nível; “% na classe” é a parte entre os grupos listados aqui, dentro da classe aberta. As bases
              são diferentes e cada arredondamento é independente.
            </p>

            <div className="hidden md:block">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">Grupos de {nomeDoCaminho}</caption>
                <thead>
                  <tr className="border-b border-border text-text-secondary">
                    <th scope="col" className="p-2 font-medium">
                      Grupo
                    </th>
                    <th scope="col" className="p-2 text-right font-medium">
                      Saldo
                    </th>
                    <th scope="col" className="p-2 text-right font-medium">
                      % na carteira
                    </th>
                    <th scope="col" className="p-2 text-right font-medium">
                      % na classe
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l) => (
                    <tr key={chave(l)} className="border-b border-border last:border-0">
                      <th scope="row" className="p-2 font-normal break-words">
                        {celulaDoNome(l)}
                      </th>
                      <td className="p-2 text-right tabular-nums">{dinheiro(l.saldo)}</td>
                      <td className="p-2 text-right tabular-nums">{textoParticipacao(l.participacaoCarteira)}</td>
                      <td className="p-2 text-right tabular-nums">{textoParticipacao(l.participacaoPai)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul aria-label={`Grupos de ${nomeDoCaminho}`} className="flex flex-col gap-3 md:hidden">
              {linhas.map((l) => (
                <li key={chave(l)} className="flex flex-col gap-2 rounded-md border border-border p-3">
                  <span className="text-base/6 font-medium break-words text-text">{celulaDoNome(l)}</span>
                  <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-sm/5">
                    <dt className="text-text-secondary">Saldo</dt>
                    <dd className="text-right tabular-nums">{dinheiro(l.saldo)}</dd>
                    <dt className="text-text-secondary">% na carteira</dt>
                    <dd className="text-right tabular-nums">{textoParticipacao(l.participacaoCarteira)}</dd>
                    <dt className="text-text-secondary">% na classe</dt>
                    <dd className="text-right tabular-nums">{textoParticipacao(l.participacaoPai)}</dd>
                  </dl>
                </li>
              ))}
            </ul>
          </>
        )}

        {negativos.length ? (
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <p className="text-sm/5 font-medium text-text">Saldos negativos deste grupo, fora das participações</p>
            <ul className="flex flex-col gap-2">
              {negativos.map((n) => (
                <li key={n.id} className="flex items-start gap-3 text-sm/5">
                  <span className="min-w-0 flex-1 break-words text-text">
                    {n.nome} <span className="text-text-secondary">({n.caminho.map((c) => c.nome).join(SEPARADOR)})</span>
                  </span>
                  <span className="shrink-0 text-right text-text-secondary tabular-nums">{dinheiro(n.saldo)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </figure>
    </div>
  );
}
