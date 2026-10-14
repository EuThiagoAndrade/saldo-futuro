import { EmBreve } from "@/components/estados";
import { PreviewNotice } from "@/components/preview-notice";
import { backend } from "@/lib/config";
import { exigirSessao } from "@/lib/sessao";

export const metadata = { title: "Ativos — Saldo Futuro" };

// A tela chega com a issue B (#38).
export default async function AtivosPage() {
  if (!backend) return <PreviewNotice />;
  await exigirSessao();

  return <EmBreve titulo="Ativos">Os ativos da carteira vão aparecer aqui.</EmBreve>;
}
