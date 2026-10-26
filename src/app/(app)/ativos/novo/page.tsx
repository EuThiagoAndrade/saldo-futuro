import Link from "next/link";
import { botaoTexto } from "@/components/botoes";
import { FormNovoAtivo } from "@/components/formularios/novo-ativo";
import { PreviewNotice } from "@/components/preview-notice";
import { backend } from "@/lib/config";
import { exigirSessao } from "@/lib/sessao";
import { ordenarPorNome } from "@/lib/telas/combobox";
import { lerInstituicoes, lerTaxonomia } from "@/lib/telas/leituras";

export const metadata = { title: "Novo ativo — Saldo Futuro" };

// Cadastro de ativo em rota própria (BL-006, ciclo 010); a lista fica em /ativos.
export default async function NovoAtivoPage() {
  if (!backend) return <PreviewNotice />;
  const { supabase } = await exigirSessao();
  const [taxonomia, instituicoes] = await Promise.all([lerTaxonomia(supabase), lerInstituicoes(supabase)]);

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div className="flex flex-col items-start gap-2">
        <Link href="/ativos" className={`${botaoTexto} -ml-4`}>
          Voltar para Ativos
        </Link>
        <h1 className="text-2xl/8 font-semibold text-text">Novo ativo</h1>
      </div>
      <FormNovoAtivo classes={taxonomia.opcoes} instituicoes={ordenarPorNome(instituicoes)} />
    </div>
  );
}
