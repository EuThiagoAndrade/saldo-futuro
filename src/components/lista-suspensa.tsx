"use client";

import { type ComponentProps, type KeyboardEvent, useEffect, useRef, useState } from "react";
import type { OpcaoAtributo } from "@/lib/telas/detalhes-ativo";

// Lista suspensa de múltipla escolha (ciclo 018, issue #182, P2 e D14), para veículo e indexador no
// formulário do ativo e, depois, no filtro. O nome do campo fica no `legend`, sempre visível; o
// `<details>` nativo guarda as caixas, que são enviadas mesmo com a lista fechada, então funciona sem
// JavaScript. Fechada, mostra o que está marcado, em ordem de catálogo, ou o texto de vazio. Com
// JavaScript, fecha com clique fora e com Esc, devolvendo o foco ao resumo. Componente controlado:
// quem usa guarda os códigos marcados e decide a regra de exclusividade.
export function ListaSuspensa({
  id,
  legenda,
  nome,
  opcoes,
  marcados,
  aoAlternar,
  vazio,
  dica,
}: {
  id: string;
  legenda: string;
  /** `name` das caixas no formulário. */
  nome: string;
  opcoes: readonly OpcaoAtributo[];
  marcados: readonly string[];
  aoAlternar: (codigo: string, marcado: boolean) => void;
  /** Texto do resumo sem nada marcado ("Não informado" no formulário, "Todos" no filtro). */
  vazio: string;
  /** Texto de ajuda abaixo do nome do campo, ligado por `aria-describedby`. */
  dica?: string;
}) {
  const lista = useRef<HTMLDetailsElement>(null);
  const resumo = useRef<HTMLElement>(null);
  const selecao = opcoes.filter((o) => marcados.includes(o.codigo)).map((o) => o.rotulo);

  // Fecha no "click", e não no "pointerdown": fechar antes de o clique terminar encolhe a página e o
  // clique cai fora do alvo (por exemplo, no resumo de outra lista logo abaixo).
  useEffect(() => {
    const fechar = (evento: MouseEvent) => {
      const detalhes = lista.current;
      if (detalhes?.open && !detalhes.contains(evento.target as Node)) detalhes.open = false;
    };
    document.addEventListener("click", fechar);
    return () => document.removeEventListener("click", fechar);
  }, []);

  function aoTeclar(evento: KeyboardEvent<HTMLDetailsElement>) {
    if (evento.key !== "Escape" || !lista.current?.open) return;
    evento.preventDefault();
    lista.current.open = false;
    resumo.current?.focus();
  }

  return (
    <fieldset className="flex min-w-0 flex-col gap-1" aria-describedby={dica ? `${id}-dica` : undefined}>
      <legend className="mb-1 text-sm/5 font-medium text-text">{legenda}</legend>
      {dica ? (
        <p id={`${id}-dica`} className="text-sm/5 text-text-secondary">
          {dica}
        </p>
      ) : null}
      <details ref={lista} onKeyDown={aoTeclar} className="group">
        <summary
          ref={resumo}
          className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-md border border-border-strong bg-surface px-3 text-base/6 text-text [&::-webkit-details-marker]:hidden"
        >
          <span className="min-w-0 break-words">
            <span className="sr-only">{legenda}: </span>
            {selecao.length > 0 ? selecao.join(", ") : vazio}
          </span>
          <span aria-hidden="true" className="shrink-0 text-text-secondary transition-transform group-open:rotate-180">
            ▾
          </span>
        </summary>
        <div className="mt-1 flex flex-col rounded-md border border-border bg-surface px-3 py-1">
          {opcoes.map((o) => (
            <label key={o.codigo} className="flex min-h-11 items-center gap-2 text-base/6">
              <input
                type="checkbox"
                name={nome}
                value={o.codigo}
                checked={marcados.includes(o.codigo)}
                onChange={(e) => aoAlternar(o.codigo, e.target.checked)}
                className="size-5 shrink-0"
              />
              <span className="min-w-0 break-words">{o.rotulo}</span>
            </label>
          ))}
        </div>
      </details>
    </fieldset>
  );
}

/**
 * A mesma lista no filtro de Ativos (ciclo 018, issue #183, D14 e D16): guarda o próprio estado,
 * parte do que veio na URL e não desmarca nada sozinha, porque no filtro as opções combinam por OU.
 * "Não informado" exclusivo continua conferido pelo servidor.
 */
export function ListaSuspensaFiltro({
  iniciais,
  ...props
}: Omit<ComponentProps<typeof ListaSuspensa>, "marcados" | "aoAlternar"> & { iniciais: readonly string[] }) {
  const [marcados, setMarcados] = useState<readonly string[]>(iniciais);
  return (
    <ListaSuspensa
      {...props}
      marcados={marcados}
      aoAlternar={(codigo, marcado) =>
        setMarcados((atual) => props.opcoes.map((o) => o.codigo).filter((c) => (c === codigo ? marcado : atual.includes(c))))
      }
    />
  );
}
