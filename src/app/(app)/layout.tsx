import Image from "next/image";
import Link from "next/link";
import logo from "../../../design-system/assets/logo-saldo-futuro.svg";
import { IconeOlho, IconeOlhoFechado } from "@/components/icones";
import { Navegacao } from "@/components/navegacao";
import { backend } from "@/lib/config";
import { valoresOcultos } from "@/lib/ocultar";
import { exigirSessao } from "@/lib/sessao";
import { alternarOcultarValores } from "./acoes";

// Área autenticada (D1). O layout desenha a navegação; cada página confere a própria sessão
// (D2), porque layout e página são renderizados em paralelo e o layout não é refeito a cada
// navegação. Sem backend (previews), cada página mostra o aviso de preview.
export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!backend) return children;
  const sessao = await exigirSessao();
  const oculto = await valoresOcultos();

  return (
    <div className="min-h-screen lg:pl-60">
      <div className="mx-auto max-w-[1120px] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pb-12">
        <header className="flex items-center justify-between gap-2 py-3 lg:justify-end">
          <Link
            href="/"
            aria-label="Saldo Futuro"
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md px-2 hover:bg-surface lg:hidden"
          >
            <Image src={logo} alt="" className="h-8 w-auto" />
          </Link>
          <form action={alternarOcultarValores}>
            <button
              type="submit"
              aria-pressed={oculto}
              className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm/5 font-medium text-primary hover:bg-surface"
            >
              {oculto ? <IconeOlhoFechado className="size-5" /> : <IconeOlho className="size-5" />}
              Ocultar valores
            </button>
          </form>
        </header>
        <main>{children}</main>
      </div>
      <Navegacao admin={sessao.papel === "admin"} />
    </div>
  );
}
