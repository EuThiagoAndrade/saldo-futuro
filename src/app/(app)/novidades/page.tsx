import { HistoricoNovidades } from "@/components/novidades";
import { PreviewNotice } from "@/components/preview-notice";
import { backend } from "@/lib/config";
import { VERSAO_ATUAL } from "@/lib/novidades";
import { exigirSessao } from "@/lib/sessao";

export const metadata = { title: "Novidades — Saldo Futuro" };

export default async function NovidadesPage() {
  if (!backend) return <PreviewNotice />;
  await exigirSessao();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl/8 font-semibold text-text">Novidades</h1>
        <p className="text-base/6 text-text-secondary">
          Versão atual: <span className="font-medium text-text">{VERSAO_ATUAL}</span>
        </p>
      </div>
      <HistoricoNovidades versaoAtual={VERSAO_ATUAL} />
    </div>
  );
}
