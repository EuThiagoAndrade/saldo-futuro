"use client";

// Navegação (DESIGN.md 6.1 e 4.3; D1 do ciclo 004). Abaixo de lg, barra inferior fixa com
// Início, Lançamentos, Ativos, Benchmarks e Mais; "Mais" abre uma folha com os demais destinos.
// A partir de lg, menu lateral de 240 px com os mesmos itens e os destinos de "Mais" abaixo de
// um divisor. Administração só aparece para o admin. Este componente vem depois do conteúdo no
// DOM, para a ordem de foco seguir a ordem visual.

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ComponentType, type SVGProps, useEffect, useRef } from "react";
import logo from "../../design-system/assets/logo-saldo-futuro.svg";
import {
  IconeAdministracao,
  IconeAtivos,
  IconeBenchmarks,
  IconeConta,
  IconeInicio,
  IconeLancamentos,
  IconeMais,
  IconeTransferencias,
} from "@/components/icones";

interface Destino {
  href: string;
  rotulo: string;
  Icone: ComponentType<SVGProps<SVGSVGElement>>;
}

const PRINCIPAIS: Destino[] = [
  { href: "/", rotulo: "Início", Icone: IconeInicio },
  { href: "/lancamentos", rotulo: "Lançamentos", Icone: IconeLancamentos },
  { href: "/ativos", rotulo: "Ativos", Icone: IconeAtivos },
  { href: "/benchmarks", rotulo: "Benchmarks", Icone: IconeBenchmarks },
];

function destinosDeMais(admin: boolean): Destino[] {
  const destinos: Destino[] = [
    { href: "/transferencias", rotulo: "Transferências", Icone: IconeTransferencias },
    { href: "/conta", rotulo: "Conta", Icone: IconeConta },
  ];
  if (admin) destinos.push({ href: "/admin", rotulo: "Administração", Icone: IconeAdministracao });
  return destinos;
}

function ativo(caminho: string, href: string): boolean {
  return href === "/" ? caminho === "/" : caminho === href || caminho.startsWith(`${href}/`);
}

const itemBarra = "flex min-h-11 flex-col items-center justify-center gap-1 text-xs/4 font-medium";

function ItemBarra({ destino, atual }: { destino: Destino; atual: boolean }) {
  const { Icone } = destino;
  return (
    <Link href={destino.href} aria-current={atual ? "page" : undefined} className={`${itemBarra} ${atual ? "text-primary" : "text-text-secondary"}`}>
      <span className={`rounded-full px-4 py-0.5 ${atual ? "bg-primary-subtle" : ""}`}>
        <Icone className="size-6" />
      </span>
      {destino.rotulo}
    </Link>
  );
}

function ItemLateral({ destino, atual }: { destino: Destino; atual: boolean }) {
  const { Icone } = destino;
  return (
    <Link
      href={destino.href}
      aria-current={atual ? "page" : undefined}
      className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm/5 font-medium ${atual ? "bg-primary-subtle text-primary" : "text-text-secondary hover:bg-surface-subtle"}`}
    >
      <Icone className="size-6 shrink-0" />
      {destino.rotulo}
    </Link>
  );
}

export function Navegacao({ admin }: { admin: boolean }) {
  const caminho = usePathname();
  const folha = useRef<HTMLDialogElement>(null);
  const mais = destinosDeMais(admin);
  const maisAtivo = mais.some((d) => ativo(caminho, d.href));

  // Navegar fecha a folha "Mais".
  useEffect(() => folha.current?.close(), [caminho]);

  return (
    <>
      <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul className="grid h-16 grid-cols-5">
          {PRINCIPAIS.map((destino) => (
            <li key={destino.href} className="flex">
              <span className="flex flex-1 justify-center">
                <ItemBarra destino={destino} atual={ativo(caminho, destino.href)} />
              </span>
            </li>
          ))}
          <li className="flex">
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => folha.current?.showModal()}
              className={`${itemBarra} flex-1 ${maisAtivo ? "text-primary" : "text-text-secondary"}`}
            >
              <span className={`rounded-full px-4 py-0.5 ${maisAtivo ? "bg-primary-subtle" : ""}`}>
                <IconeMais className="size-6" />
              </span>
              Mais
            </button>
          </li>
        </ul>
      </nav>

      <dialog
        ref={folha}
        aria-label="Mais"
        onClick={(evento) => {
          if (evento.target === folha.current) folha.current.close();
        }}
        className="m-0 mt-auto w-full max-w-none rounded-t-lg bg-surface p-0 text-text shadow-overlay backdrop:bg-text/40 lg:hidden"
      >
        <nav aria-label="Mais destinos" className="flex flex-col gap-1 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {mais.map((destino) => (
            <ItemLateral key={destino.href} destino={destino} atual={ativo(caminho, destino.href)} />
          ))}
          <button type="button" onClick={() => folha.current?.close()} className="mt-2 min-h-11 rounded-md border border-border-strong text-sm/5 font-medium text-primary">
            Fechar
          </button>
        </nav>
      </dialog>

      <nav aria-label="Menu lateral" className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col gap-1 border-r border-border bg-surface p-4 lg:flex">
        <Link href="/" className="mb-6 flex min-h-11 items-center px-3">
          <Image src={logo} alt="Saldo Futuro" className="h-8 w-auto" />
        </Link>
        {PRINCIPAIS.map((destino) => (
          <ItemLateral key={destino.href} destino={destino} atual={ativo(caminho, destino.href)} />
        ))}
        <hr className="my-3 border-border" />
        {mais.map((destino) => (
          <ItemLateral key={destino.href} destino={destino} atual={ativo(caminho, destino.href)} />
        ))}
      </nav>
    </>
  );
}
