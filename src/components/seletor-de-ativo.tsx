"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { botaoTexto } from "@/components/botoes";
import { CamposDoFiltro } from "@/components/campos-do-filtro";
import { ComboboxAtivo } from "@/components/combobox-ativo";
import { opcoesDoFiltro, opcoesDoSeletor, parametrosEfetivos, type AtivoDoSeletor, type ValoresDoFiltro } from "@/lib/telas/seletor-ativo";
import { montarTaxonomia, type NoTaxonomia } from "@/lib/telas/taxonomia";

// Seletor de ativo com filtros (ciclo 019, issue #191, BL-022; DESIGN.md 6.8 e 6.12): o combobox de ativo de
// Novo lançamento e Transferências, com o mesmo conjunto de filtros de /ativos num painel "Filtrar ativos"
// recolhido logo abaixo. Cada seletor tem o próprio painel e o próprio estado (origem e destino são
// independentes). O filtro só restringe a lista oferecida: a seleção já confirmada não muda, o formulário
// envia somente o ID do ativo confirmado e nenhum campo do filtro tem `name`. Limpar o formulário (o reset
// depois de uma transferência) também limpa os filtros.

export function SeletorDeAtivo({
  id,
  nome,
  ativos,
  nos,
  instituicoes,
  mensagemObrigatoria,
  placeholder,
  nivelDoTitulo,
}: {
  id: string;
  /** `name` do campo oculto com o ID do ativo confirmado. */
  nome: string;
  /** Ativos selecionáveis deste formulário, com nome exibido e segunda linha. */
  ativos: readonly AtivoDoSeletor[];
  /** Nós da taxonomia, dados simples que viram a árvore aqui. */
  nos: readonly NoTaxonomia[];
  instituicoes: readonly { id: string; nome: string }[];
  mensagemObrigatoria: string;
  placeholder: string;
  /** Nível dos títulos dos grupos do filtro, abaixo do título da seção que contém o seletor. */
  nivelDoTitulo: 2 | 3;
}) {
  const [valores, setValores] = useState<ValoresDoFiltro>({});
  // Troca a chave do painel para recriar os campos (e o que eles guardam) quando os filtros são limpos.
  const [versao, setVersao] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const resumo = useRef<HTMLElement>(null);

  const catalogos = useMemo(() => ({ taxonomia: montarTaxonomia([...nos]), instituicoes }), [nos, instituicoes]);
  const { opcoes, erro, campos } = useMemo(() => opcoesDoSeletor(ativos, valores, catalogos), [ativos, valores, catalogos]);
  // Opções das listas do filtro: só as usadas pelos ativos deste formulário (R1-1).
  const opcoesDoPainel = useMemo(() => opcoesDoFiltro(ativos, parametrosEfetivos(valores), catalogos), [ativos, valores, catalogos]);
  const comFiltro = campos > 0 || erro !== null;

  function limpar() {
    setValores({});
    setVersao((v) => v + 1);
  }

  // O reset do formulário (depois de uma transferência registrada) limpa também os filtros.
  useEffect(() => {
    const formulario = raiz.current?.closest("form");
    if (!formulario) return;
    // Depois do reset nativo, que restaura os valores dos campos.
    const aoReiniciar = () => setTimeout(limpar, 0);
    formulario.addEventListener("reset", aoReiniciar);
    return () => formulario.removeEventListener("reset", aoReiniciar);
  }, []);

  return (
    <div ref={raiz} data-seletor-ativo={id} className="flex flex-col gap-2">
      <ComboboxAtivo
        id={id}
        nome={nome}
        opcoes={opcoes}
        obrigatorio
        mensagemObrigatoria={mensagemObrigatoria}
        placeholder={placeholder}
        semResultado={erro ? `Não foi possível aplicar os filtros: ${erro}` : campos > 0 ? "Nenhum ativo encontrado com os filtros atuais." : "Nenhum ativo encontrado."}
      />
      <details className="rounded-md border border-border bg-surface">
        <summary
          ref={resumo}
          className="flex min-h-11 cursor-pointer items-center gap-2 px-3 text-sm/5 font-medium text-primary hover:bg-surface-subtle"
        >
          Filtrar ativos
          {campos > 0 ? (
            <>
              <span aria-hidden="true" className="rounded-full bg-primary-subtle px-2 py-0.5 text-xs/4 font-medium text-primary">
                {campos}
              </span>
              <span className="sr-only">({campos === 1 ? "1 campo com filtro" : `${campos} campos com filtro`})</span>
            </>
          ) : null}
        </summary>
        <div className="flex flex-col gap-4 border-t border-border p-3">
          <CamposDoFiltro
            key={versao}
            modo={{ tipo: "formulario", aoMudar: (campo, valor) => setValores((atual) => ({ ...atual, [campo]: valor })) }}
            opcoes={opcoesDoPainel}
            idBase={`${id}-filtro`}
            nivelDoTitulo={nivelDoTitulo}
          />
          {erro ? (
            <p role="status" className="text-sm/5 break-words text-loss">
              Não foi possível aplicar os filtros: {erro}
            </p>
          ) : null}
          {comFiltro ? (
            <button
              type="button"
              className={`${botaoTexto} self-start`}
              onClick={() => {
                limpar();
                resumo.current?.focus();
              }}
            >
              Limpar filtros
            </button>
          ) : null}
        </div>
      </details>
    </div>
  );
}
