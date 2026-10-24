"use client";

// Seletor de ativo com busca (ciclo 009, BL-010): combobox com lista, no padrão da WAI-ARIA 1.2.
// O ID da opção confirmada vai num campo oculto com o `name` do formulário; a política de seleção
// está em `@/lib/telas/combobox` (DESIGN.md 6.8). A busca só funciona depois da hidratação.
// O mesmo componente serve aos seletores de instituição e classe (ciclo 012, issue #128): com
// `nomeNovo`, oferece "Cadastrar «texto»" e envia o nome novo nesse segundo campo oculto.

import { useEffect, useId, useReducer, useRef, useState, type KeyboardEvent } from "react";
import { classeCampo } from "@/components/campos";
import {
  abrir,
  confirmar,
  editar,
  escapar,
  estadoInicial,
  listaFiltrada,
  mensagemDeValidade,
  mover,
  nomeNovoEnviado,
  type Configuracao,
  type EstadoCombo,
  type Opcao,
  sair,
  valorEnviado,
} from "@/lib/telas/combobox";

type Acao =
  | { tipo: "editar"; texto: string }
  | { tipo: "abrir" }
  | { tipo: "confirmar"; opcao: Opcao }
  | { tipo: "sair" }
  | { tipo: "escapar" }
  | { tipo: "mover"; tecla: "ArrowDown" | "ArrowUp" | "Home" | "End" }
  | { tipo: "reiniciar" };

export function ComboboxAtivo({
  id,
  nome,
  opcoes,
  valorInicial,
  opcaoVazia,
  obrigatorio = false,
  mensagemObrigatoria = "Escolha um ativo.",
  placeholder,
  nomeNovo,
  foraDaLista = "Escolha um ativo da lista.",
  semResultado = "Nenhum ativo encontrado.",
}: {
  id: string;
  /** `name` enviado pelo formulário, com o ID da opção confirmada. */
  nome: string;
  opcoes: readonly Opcao[];
  valorInicial?: string;
  /** Rótulo da opção sem valor no topo da lista (no filtro: "Todos os ativos"). */
  opcaoVazia?: string;
  obrigatorio?: boolean;
  /** Mensagem do campo obrigatório vazio; a mesma do servidor. */
  mensagemObrigatoria?: string;
  placeholder?: string;
  /** Com criação: `name` do campo oculto que leva o nome novo da opção "Cadastrar «texto»". */
  nomeNovo?: string;
  /** Mensagem do texto sem seleção confirmada. */
  foraDaLista?: string;
  /** Mensagem da lista vazia. */
  semResultado?: string;
}) {
  const configuracao: Configuracao = {
    opcoes,
    opcaoVazia: opcaoVazia === undefined ? undefined : { id: "", nome: opcaoVazia },
    criar: nomeNovo !== undefined,
  };
  const [estado, despachar] = useReducer(
    (e: EstadoCombo, a: Acao): EstadoCombo => {
      switch (a.tipo) {
        case "editar": return editar(configuracao, e, a.texto);
        case "abrir": return abrir(configuracao, e);
        case "confirmar": return confirmar(e, a.opcao);
        case "sair": return sair(e);
        case "escapar": return escapar(e);
        case "mover": return mover(configuracao, e, a.tecla);
        case "reiniciar": return estadoInicial(configuracao, valorInicial);
      }
    },
    null,
    () => estadoInicial(configuracao, valorInicial),
  );
  const [tentou, setTentou] = useState(false);
  const campo = useRef<HTMLInputElement>(null);
  const idLista = useId();
  const idErro = `${id}-erro`;

  const lista = listaFiltrada(configuracao, estado.filtro);
  const listaAberta = estado.aberta && lista.length > 0;
  const mensagem = mensagemDeValidade(estado, obrigatorio, mensagemObrigatoria, foraDaLista);

  useEffect(() => {
    campo.current?.setCustomValidity(mensagem);
  }, [mensagem]);

  // O reset do formulário (explícito ou o que o React faz depois de uma ação) volta ao estado inicial.
  useEffect(() => {
    const formulario = campo.current?.form;
    if (!formulario) return;
    const aoReiniciar = () => {
      setTentou(false);
      // Depois do reset nativo, que restaura os valores dos campos.
      setTimeout(() => despachar({ tipo: "reiniciar" }), 0);
    };
    formulario.addEventListener("reset", aoReiniciar);
    return () => formulario.removeEventListener("reset", aoReiniciar);
  }, []);

  function aoTeclar(evento: KeyboardEvent<HTMLInputElement>) {
    const { key } = evento;
    if (key === "ArrowDown" || key === "ArrowUp") {
      evento.preventDefault();
      despachar({ tipo: "mover", tecla: key });
    } else if ((key === "Home" || key === "End") && listaAberta) {
      evento.preventDefault();
      despachar({ tipo: "mover", tecla: key });
    } else if (key === "Enter" && listaAberta && estado.ativa >= 0) {
      // Só confirma a opção destacada; com a lista fechada, Enter envia o formulário.
      evento.preventDefault();
      setTentou(false);
      despachar({ tipo: "confirmar", opcao: lista[estado.ativa] });
    } else if (key === "Escape") {
      if (estado.aberta) evento.preventDefault();
      setTentou(false);
      despachar({ tipo: "escapar" });
    }
  }

  const invalido = tentou && mensagem !== "";

  return (
    <div className="relative">
      <input
        ref={campo}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={listaAberta}
        aria-controls={idLista}
        aria-autocomplete="list"
        aria-activedescendant={listaAberta && estado.ativa >= 0 ? `${idLista}-${estado.ativa}` : undefined}
        aria-invalid={invalido ? true : undefined}
        aria-describedby={invalido ? idErro : undefined}
        autoComplete="off"
        maxLength={nomeNovo === undefined ? undefined : 100}
        required={obrigatorio}
        placeholder={placeholder}
        value={estado.texto}
        className={`${classeCampo} ${invalido ? "border-loss" : ""}`}
        onChange={(evento) => {
          setTentou(false);
          despachar({ tipo: "editar", texto: evento.currentTarget.value });
        }}
        onClick={() => despachar({ tipo: "abrir" })}
        onKeyDown={aoTeclar}
        onBlur={() => despachar({ tipo: "sair" })}
        onInvalid={() => setTentou(true)}
      />
      <input type="hidden" name={nome} value={valorEnviado(estado)} />
      {nomeNovo === undefined ? null : <input type="hidden" name={nomeNovo} value={nomeNovoEnviado(estado)} />}
      {listaAberta ? (
        <ul
          id={idLista}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-surface shadow-overlay"
        >
          {lista.map((opcao, i) => (
            <li
              key={`${opcao.id}-${i}`}
              id={`${idLista}-${i}`}
              role="option"
              aria-selected={estado.confirmada !== null && estado.confirmada.id === opcao.id && !!estado.confirmada.nova === !!opcao.nova}
              // Mantém o foco no campo ao tocar na opção.
              onMouseDown={(evento) => evento.preventDefault()}
              onClick={() => {
                setTentou(false);
                despachar({ tipo: "confirmar", opcao });
              }}
              className={`flex min-h-11 cursor-pointer items-center px-3 text-base/6 text-text ${i === estado.ativa ? "bg-primary-subtle" : "hover:bg-surface-subtle"}`}
            >
              {opcao.nova ? `Cadastrar «${opcao.nome}»` : opcao.nome}
            </li>
          ))}
        </ul>
      ) : estado.aberta ? (
        <p role="status" className="absolute z-20 mt-1 w-full rounded-md border border-border bg-surface px-3 py-3 text-sm/5 text-text-secondary shadow-overlay">
          {semResultado}
        </p>
      ) : null}
      {invalido ? (
        <p id={idErro} className="mt-1 text-sm/5 text-loss">
          {mensagem}
        </p>
      ) : null}
    </div>
  );
}
