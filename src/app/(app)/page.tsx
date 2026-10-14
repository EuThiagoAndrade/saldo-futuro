import { EmBreve } from "@/components/estados";
import { PreviewNotice } from "@/components/preview-notice";
import { backend } from "@/lib/config";
import { exigirSessao } from "@/lib/sessao";

export const metadata = { title: "Início — Saldo Futuro" };

// O resumo da carteira chega com a issue D (#40).
export default async function InicioPage() {
  if (!backend) return <PreviewNotice />;
  await exigirSessao();

  return (
    <EmBreve titulo="Início">
      O resumo da carteira, com patrimônio, rentabilidade e gráficos, vai aparecer aqui.
    </EmBreve>
  );
}
