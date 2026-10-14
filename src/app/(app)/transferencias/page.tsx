import { EmBreve } from "@/components/estados";
import { PreviewNotice } from "@/components/preview-notice";
import { backend } from "@/lib/config";
import { exigirSessao } from "@/lib/sessao";

export const metadata = { title: "Transferências — Saldo Futuro" };

// A tela chega com a issue B (#38).
export default async function TransferenciasPage() {
  if (!backend) return <PreviewNotice />;
  await exigirSessao();

  return <EmBreve titulo="Transferências">As transferências entre ativos vão aparecer aqui.</EmBreve>;
}
