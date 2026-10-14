import Link from "next/link";
import { botaoPrincipal } from "@/components/botoes";
import { EstadoVazio } from "@/components/estados";
import { FormNovoLancamento } from "@/components/formularios/novo-lancamento";
import { PreviewNotice } from "@/components/preview-notice";
import { backend } from "@/lib/config";
import { hojeEmCuiaba } from "@/lib/financeiro/datas";
import { exigirSessao } from "@/lib/sessao";
import { ativosLancaveis, lerAtivos } from "@/lib/telas/leituras";

export const metadata = { title: "Novo lançamento — Saldo Futuro" };

export default async function NovoLancamentoPage() {
  if (!backend) return <PreviewNotice />;
  const { supabase } = await exigirSessao();
  const ativos = ativosLancaveis(await lerAtivos(supabase)).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <h1 className="text-2xl/8 font-semibold text-text">Novo lançamento</h1>
      {ativos.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum ativo em uso"
          acao={
            <Link href="/ativos" className={botaoPrincipal}>
              Cadastrar ativo
            </Link>
          }
        >
          Para registrar um lançamento, cadastre antes o ativo que vai recebê-lo.
        </EstadoVazio>
      ) : (
        <FormNovoLancamento ativos={ativos.map((a) => ({ id: a.id, nome: a.nome }))} hoje={hojeEmCuiaba()} />
      )}
    </div>
  );
}
