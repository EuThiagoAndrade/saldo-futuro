import { ConteudoCatalogo } from "@/components/pagina-catalogo";
import { PreviewNotice } from "@/components/preview-notice";
import { backend } from "@/lib/config";
import { exigirSessao } from "@/lib/sessao";
import { CATALOGOS, linhasDoCatalogo } from "@/lib/telas/catalogos";
import { lerInstituicoes, lerVinculosDosAtivos } from "@/lib/telas/leituras";
import { criarInstituicao, excluirInstituicao, renomearInstituicao } from "./acoes";

export const metadata = { title: "Cadastros — Saldo Futuro" };

// Cadastros (ciclo 012, issue #127, BL-009; emenda E-1 do plano): as instituições do usuário, em
// "Mais" e no menu lateral. A aba Classes saiu no ciclo 013 (issue #138): a classe do ativo é um
// nó da taxonomia global, escolhido no próprio cadastro. Qualquer ?aba= (inclusive o antigo
// ?aba=classes) abre a mesma página de Instituições, sem erro.

const ACOES = { criar: criarInstituicao, renomear: renomearInstituicao, excluir: excluirInstituicao };

export default async function CadastrosPage() {
  if (!backend) return <PreviewNotice />;
  const { supabase } = await exigirSessao();
  const [instituicoes, vinculos] = await Promise.all([lerInstituicoes(supabase), lerVinculosDosAtivos(supabase)]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl/8 font-semibold text-text">Cadastros</h1>

      <section aria-label={CATALOGOS.instituicoes.titulo} className="flex flex-col gap-4">
        <ConteudoCatalogo tipo="instituicoes" linhas={linhasDoCatalogo("instituicoes", instituicoes, vinculos)} acoes={ACOES} />
      </section>
    </div>
  );
}
