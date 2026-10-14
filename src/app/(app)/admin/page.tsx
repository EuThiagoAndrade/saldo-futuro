import { EmBreve } from "@/components/estados";
import { PreviewNotice } from "@/components/preview-notice";
import { backend } from "@/lib/config";
import { exigirAdmin } from "@/lib/sessao";

export const metadata = { title: "Administração — Saldo Futuro" };

// Só o admin chega aqui; os demais recebem 404 (D2). Sincronização e acessos chegam com as
// issues E (#41) e F (#42).
export default async function AdminPage() {
  if (!backend) return <PreviewNotice />;
  await exigirAdmin();

  return (
    <EmBreve titulo="Administração">
      A sincronização dos benchmarks com o Banco Central e a lista de acessos vão aparecer aqui.
    </EmBreve>
  );
}
