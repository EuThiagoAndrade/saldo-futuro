import Link from "next/link";
import { ConteudoCatalogo } from "@/components/pagina-catalogo";
import { PreviewNotice } from "@/components/preview-notice";
import { backend } from "@/lib/config";
import { exigirSessao } from "@/lib/sessao";
import { CATALOGOS, linhasDoCatalogo, type TipoCatalogo } from "@/lib/telas/catalogos";
import { lerClasses, lerInstituicoes, lerVinculosDosAtivos } from "@/lib/telas/leituras";
import {
  criarClasse,
  criarInstituicao,
  excluirClasse,
  excluirInstituicao,
  renomearClasse,
  renomearInstituicao,
} from "./acoes";

export const metadata = { title: "Cadastros — Saldo Futuro" };

// Cadastros (ciclo 012, issue #127, BL-009; emenda E-1 do plano): instituições e classes do
// usuário, em "Mais" e no menu lateral. As abas são links lidos no servidor pela URL
// (?aba=classes), com aria-current, não o padrão "tab" do ARIA; só a lista selecionada é
// renderizada (DESIGN.md 6.12). Valor ausente ou desconhecido abre Instituições.

const ACOES = {
  instituicoes: { criar: criarInstituicao, renomear: renomearInstituicao, excluir: excluirInstituicao },
  classes: { criar: criarClasse, renomear: renomearClasse, excluir: excluirClasse },
};

function LinkDaAba({ tipo, atual, contagem }: { tipo: TipoCatalogo; atual: TipoCatalogo; contagem: number }) {
  const selecionada = tipo === atual;
  return (
    <Link
      href={CATALOGOS[tipo].aba}
      aria-current={selecionada ? "page" : undefined}
      className={`-mb-px flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm/5 font-medium hover:bg-surface ${
        selecionada ? "border-primary text-primary" : "border-transparent text-text-secondary"
      }`}
    >
      {CATALOGOS[tipo].titulo}
      <span className="rounded-full bg-neutral-subtle px-2 py-0.5 text-xs/4 font-medium text-neutral">{contagem}</span>
    </Link>
  );
}

export default async function CadastrosPage({ searchParams }: { searchParams: Promise<{ aba?: string | string[] }> }) {
  if (!backend) return <PreviewNotice />;
  const { supabase } = await exigirSessao();
  const { aba: parametro } = await searchParams;
  const aba: TipoCatalogo = parametro === "classes" ? "classes" : "instituicoes";
  const [instituicoes, classes, vinculos] = await Promise.all([
    lerInstituicoes(supabase),
    lerClasses(supabase),
    lerVinculosDosAtivos(supabase),
  ]);
  const entradas = aba === "classes" ? classes : instituicoes;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl/8 font-semibold text-text">Cadastros</h1>

      <nav aria-label="Tipo de cadastro">
        <ul className="flex border-b border-border">
          <li>
            <LinkDaAba tipo="instituicoes" atual={aba} contagem={instituicoes.length} />
          </li>
          <li>
            <LinkDaAba tipo="classes" atual={aba} contagem={classes.length} />
          </li>
        </ul>
      </nav>

      <section id="cadastros-da-aba" aria-label={CATALOGOS[aba].titulo} className="flex flex-col gap-4">
        <ConteudoCatalogo tipo={aba} linhas={linhasDoCatalogo(aba, entradas, vinculos)} acoes={ACOES[aba]} />
      </section>
    </div>
  );
}
