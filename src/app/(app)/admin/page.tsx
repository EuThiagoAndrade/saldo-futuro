import Link from "next/link";
import { botaoSecundario } from "@/components/botoes";
import { PreviewNotice } from "@/components/preview-notice";
import { backend } from "@/lib/config";
import { exigirAdmin } from "@/lib/sessao";

export const metadata = { title: "Administração — Saldo Futuro" };

// Só o admin chega aqui; os demais recebem 404 (D2).
export default async function AdminPage() {
  if (!backend) return <PreviewNotice />;
  await exigirAdmin();

  return (
    <div className="flex flex-col items-start gap-6">
      <h1 className="text-2xl/8 font-semibold">Administração</h1>
      <Link href="/admin/benchmarks" className={botaoSecundario}>Sincronizar benchmarks</Link>
      <p className="text-text-secondary">A administração da lista de acessos chega na próxima entrega.</p>
    </div>
  );
}
