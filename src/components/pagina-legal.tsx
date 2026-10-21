import Image from "next/image";
import Link from "next/link";
import logo from "../../design-system/assets/logo-saldo-futuro.svg";
import { type DocumentoLegal, LinksLegais } from "@/components/links-legais";

// Moldura das páginas públicas de privacidade e termos (BL-012, ciclo 010): estáticas, fora da
// área autenticada e sem leitura de dados, com ou sem backend.

export function PaginaLegal({
  titulo,
  atualizacao,
  documento,
  children,
}: {
  titulo: string;
  atualizacao: { iso: string; texto: string };
  documento: DocumentoLegal;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex max-w-[1120px] flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/" aria-label="Saldo Futuro" className="flex min-h-11 items-center self-start">
        <Image src={logo} alt="" priority className="h-8 w-auto" />
      </Link>
      <article className="flex max-w-prose flex-col gap-8 text-base/6 text-text">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl/8 font-semibold">{titulo}</h1>
          <p className="text-sm/5 text-text-secondary">
            Última atualização: <time dateTime={atualizacao.iso}>{atualizacao.texto}</time>.
          </p>
        </header>
        {children}
      </article>
      <footer className="border-t border-border pt-4">
        <LinksLegais atual={documento} />
      </footer>
    </main>
  );
}

export function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl/7 font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}

export const lista = "flex list-disc flex-col gap-2 pl-6";
