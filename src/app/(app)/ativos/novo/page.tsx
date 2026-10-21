import Link from "next/link";
import { botaoTexto } from "@/components/botoes";
import { FormNovoAtivo } from "@/components/formularios/novo-ativo";
import { PreviewNotice } from "@/components/preview-notice";
import { backend } from "@/lib/config";
import { exigirSessao } from "@/lib/sessao";

export const metadata = { title: "Novo ativo — Saldo Futuro" };

// Cadastro de ativo em rota própria (BL-006, ciclo 010); a lista fica em /ativos.
export default async function NovoAtivoPage() {
  if (!backend) return <PreviewNotice />;
  await exigirSessao();

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div className="flex flex-col items-start gap-2">
        <Link href="/ativos" className={`${botaoTexto} -ml-4`}>
          Voltar para Ativos
        </Link>
        <h1 className="text-2xl/8 font-semibold text-text">Novo ativo</h1>
      </div>
      <FormNovoAtivo />
    </div>
  );
}
