import Link from "next/link";
import { botaoPrincipal } from "@/components/botoes";
import { EmBreve } from "@/components/estados";
import { PreviewNotice } from "@/components/preview-notice";
import { mesBr } from "@/lib/apresentacao/datas";
import { backend } from "@/lib/config";
import { hojeEmCuiaba } from "@/lib/financeiro/datas";
import { exigirSessao } from "@/lib/sessao";
import { mesTerminadoAberto } from "@/lib/telas/fechamento";
import { lerMarcosDoFechamento } from "@/lib/telas/leituras";

export const metadata = { title: "Início — Saldo Futuro" };

// O resumo da carteira chega com a issue D (#40). O aviso de mês terminado ainda aberto é da
// issue C (#39).
export default async function InicioPage() {
  if (!backend) return <PreviewNotice />;
  const { supabase } = await exigirSessao();
  const { ultimo, maisAntigo } = await lerMarcosDoFechamento(supabase);
  const pendente = mesTerminadoAberto(ultimo, maisAntigo, hojeEmCuiaba());

  return (
    <div className="flex flex-col gap-6">
      {pendente ? (
        <section role="status" className="flex flex-col items-start gap-3 rounded-md border border-warning bg-warning-subtle p-4">
          <p className="text-base/6 text-text">{`${mesBr(pendente)[0].toUpperCase()}${mesBr(pendente).slice(1)}`} já terminou e ainda não foi fechado.</p>
          <Link href={`/lancamentos/fechamento/${pendente}`} className={botaoPrincipal}>
            Fechar {mesBr(pendente)}
          </Link>
        </section>
      ) : null}
      <div>
        <EmBreve titulo="Início">O resumo da carteira, com patrimônio, rentabilidade e gráficos, vai aparecer aqui.</EmBreve>
      </div>
    </div>
  );
}
