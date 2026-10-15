import Link from "next/link";
import { botaoPrincipal, botaoSecundario } from "@/components/botoes";
import { EstadoErro } from "@/components/estados";
import { NaoDisponivel } from "@/components/valores";
import { dataBr } from "@/lib/apresentacao/datas";
import { lerCatalogo } from "@/lib/telas/leitura-benchmarks";
import { PreviewNotice } from "@/components/preview-notice";
import { backend } from "@/lib/config";
import { exigirSessao } from "@/lib/sessao";

export const metadata = { title: "Benchmarks — Saldo Futuro" };

export default async function BenchmarksPage() {
  if (!backend) return <PreviewNotice />;
  const { supabase, papel } = await exigirSessao();
  let catalogo;
  try { catalogo = await lerCatalogo(supabase); } catch {
    return <EstadoErro acao={<Link href="/benchmarks" className={botaoSecundario}>Tentar novamente</Link>}>Não foi possível ler os benchmarks.</EstadoErro>;
  }
  return <div className="flex flex-col gap-6">
    <h1 className="text-2xl/8 font-semibold text-text">Benchmarks</h1>
    <p className="text-base/6 text-text-secondary">Índices públicos para comparar com a rentabilidade da sua carteira.</p>
    <div className="grid gap-4 md:grid-cols-2">
      {catalogo.map((b) => <section key={b.id} className="flex flex-col items-start gap-3 rounded-md border border-border bg-surface p-4">
        <h2 className="text-lg/7 font-semibold">{b.nome}</h2>
        <p className="text-sm/5 text-text-secondary">SGS {b.codigo_sgs} · Série {b.periodicidade === "diaria" ? "diária (% ao dia)" : "mensal (% ao mês)"}</p>
        {b.cobertura ? <p>Disponível de {dataBr(b.cobertura.inicio)} até {dataBr(b.cobertura.fim)}</p> : <p>Disponível até: <NaoDisponivel /> — ainda sem sincronização.</p>}
        <Link href={`/benchmarks/comparacao?benchmark=${b.id}`} className={botaoPrincipal}>Comparar com {b.nome}</Link>
      </section>)}
    </div>
    {papel === "admin" ? <Link href="/admin/benchmarks" className={`${botaoSecundario} self-start`}>Sincronizar benchmarks</Link> : null}
  </div>;
}
