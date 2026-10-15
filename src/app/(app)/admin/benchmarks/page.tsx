import Link from "next/link";
import { botaoSecundario } from "@/components/botoes";
import { EstadoErro } from "@/components/estados";
import { SincronizarBenchmark } from "@/components/formularios/sincronizar-benchmark";
import { PreviewNotice } from "@/components/preview-notice";
import { backend } from "@/lib/config";
import { hojeEmCuiaba } from "@/lib/financeiro/datas";
import { exigirAdmin } from "@/lib/sessao";
import { lerCatalogo } from "@/lib/telas/leitura-benchmarks";

export const metadata = { title: "Sincronizar benchmarks — Saldo Futuro" };
export default async function AdminBenchmarksPage() {
  if (!backend) return <PreviewNotice />;
  const { supabase } = await exigirAdmin();
  let catalogo;
  try { catalogo = await lerCatalogo(supabase); } catch {
    return <EstadoErro acao={<Link href="/admin/benchmarks" className={botaoSecundario}>Tentar novamente</Link>}>Não foi possível ler a cobertura atual.</EstadoErro>;
  }
  return <div className="flex flex-col gap-6">
    <h1 className="text-2xl/8 font-semibold">Sincronizar benchmarks</h1>
    <p className="text-base/6 text-text-secondary">Busca sob demanda no SGS do Banco Central. A janela é substituída pelos valores da fonte; valores e cobertura são gravados juntos. A busca tem limite de 45 segundos.</p>
    {catalogo.map((b) => <SincronizarBenchmark key={b.id} benchmark={b} hoje={hojeEmCuiaba()} />)}
    <Link href="/benchmarks" className={`${botaoSecundario} self-start`}>Ver catálogo e cobertura</Link>
  </div>;
}
