import Link from "next/link";
import { botaoTexto } from "@/components/botoes";
import { EstadoVazio } from "@/components/estados";
import { FormEditarAtivo } from "@/components/formularios/editar-ativo";
import { PreviewNotice } from "@/components/preview-notice";
import { backend } from "@/lib/config";
import { exigirSessao } from "@/lib/sessao";
import { ordenarPorNome } from "@/lib/telas/combobox";
import { lerAtivos, lerClasses, lerInstituicoes } from "@/lib/telas/leituras";

export const metadata = { title: "Editar ativo — Saldo Futuro" };

const ROTULO_AJUSTE = { rendimento: "Rendimento", marcacao: "Marcação a mercado" } as const;

// Edição dos campos descritivos de um ativo (ciclo 012, issue #128, BL-009), aberta pelo link
// Editar das duas abas de /ativos. Ativo inexistente, de outro usuário (a RLS não o devolve) ou
// o trânsito mostram a recusa, sem formulário.
export default async function EditarAtivoPage({ params }: { params: Promise<{ id: string }> }) {
  if (!backend) return <PreviewNotice />;
  const { supabase } = await exigirSessao();
  const { id } = await params;
  const [ativos, classes, instituicoes] = await Promise.all([lerAtivos(supabase), lerClasses(supabase), lerInstituicoes(supabase)]);
  const ativo = ativos.find((a) => a.id === id);
  const voltar = ativo && !ativo.ativo ? "/ativos?aba=desativados" : "/ativos";

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div className="flex flex-col items-start gap-2">
        <Link href={voltar} className={`${botaoTexto} -ml-4`}>
          Voltar para Ativos
        </Link>
        <h1 className="text-2xl/8 font-semibold text-text">Editar ativo</h1>
      </div>
      {!ativo ? (
        <EstadoVazio titulo="Ativo não encontrado">Volte para Ativos e escolha um ativo da lista.</EstadoVazio>
      ) : ativo.sistema ? (
        <EstadoVazio titulo="Este ativo não tem detalhes">O ativo de sistema Em trânsito só recebe transferências e não tem classe, instituição nem indicadores.</EstadoVazio>
      ) : (
        <FormEditarAtivo
          ativo={ativo}
          rotuloAjuste={ROTULO_AJUSTE[ativo.tipo_ajuste ?? "rendimento"]}
          classes={ordenarPorNome(classes)}
          instituicoes={ordenarPorNome(instituicoes)}
        />
      )}
    </div>
  );
}
