"use client";

import { type RefObject, useEffect, useReducer } from "react";

/**
 * Depois de cada ação, o React reinicia o formulário (`form.reset()`), e o reset nativo devolve
 * rádios, caixas e selects ao HTML inicial, mesmo quando controlados. Um novo render, logo depois do
 * reset, devolve aos campos os valores do estado: a recusa mantém o que foi escolhido (ciclo 017,
 * issue #173). Mesma técnica do seletor com busca, que trata o próprio reset.
 */
export function useManterAposReset(elemento: RefObject<Element | null>) {
  const [, renovar] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    const formulario = elemento.current?.closest("form");
    if (!formulario) return;
    const aoReiniciar = () => setTimeout(renovar, 0);
    formulario.addEventListener("reset", aoReiniciar);
    return () => formulario.removeEventListener("reset", aoReiniciar);
  }, [elemento]);
}
