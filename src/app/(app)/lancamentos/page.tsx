import { EmBreve } from "@/components/estados";
import { PreviewNotice } from "@/components/preview-notice";
import { backend } from "@/lib/config";
import { exigirSessao } from "@/lib/sessao";

export const metadata = { title: "Lançamentos — Saldo Futuro" };

// A tela chega com a issue B (#38).
export default async function LancamentosPage() {
  if (!backend) return <PreviewNotice />;
  await exigirSessao();

  return <EmBreve titulo="Lançamentos">Os lançamentos da carteira e o fechamento mensal vão aparecer aqui.</EmBreve>;
}
