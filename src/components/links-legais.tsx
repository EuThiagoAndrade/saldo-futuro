import Link from "next/link";

// Links das páginas públicas de privacidade e termos (BL-012, ciclo 010). Aparecem em /entrar,
// em Conta e no rodapé das próprias páginas, sem novo destino na navegação principal.

const DOCUMENTOS = [
  { href: "/privacidade", rotulo: "Política de privacidade" },
  { href: "/termos", rotulo: "Termos de uso" },
] as const;

export type DocumentoLegal = (typeof DOCUMENTOS)[number]["href"];

export const linkTexto = "text-primary underline underline-offset-2 hover:text-primary-hover";

export function LinksLegais({ atual, centralizado = false }: { atual?: DocumentoLegal; centralizado?: boolean }) {
  return (
    <nav aria-label="Documentos">
      <ul className={`flex flex-wrap gap-x-6 ${centralizado ? "justify-center" : ""}`}>
        {DOCUMENTOS.map(({ href, rotulo }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={href === atual ? "page" : undefined}
              className={`inline-flex min-h-11 items-center text-sm/5 font-medium ${linkTexto}`}
            >
              {rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
