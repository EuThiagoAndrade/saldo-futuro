import { EmBreve } from "@/components/estados";
import { PreviewNotice } from "@/components/preview-notice";
import { backend } from "@/lib/config";
import { exigirSessao } from "@/lib/sessao";

export const metadata = { title: "Benchmarks — Saldo Futuro" };

// A tela chega com a issue E (#41).
export default async function BenchmarksPage() {
  if (!backend) return <PreviewNotice />;
  await exigirSessao();

  return <EmBreve titulo="Benchmarks">Os benchmarks e a comparação com a carteira vão aparecer aqui.</EmBreve>;
}
