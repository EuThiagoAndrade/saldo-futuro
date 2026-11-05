import Link from "next/link";
import { botaoPrincipal } from "@/components/botoes";
import { EstadoVazio } from "@/components/estados";
import { FormNovoLancamento } from "@/components/formularios/novo-lancamento";
import { PreviewNotice } from "@/components/preview-notice";
import { backend } from "@/lib/config";
import { hojeEmCuiaba } from "@/lib/financeiro/datas";
import { exigirSessao } from "@/lib/sessao";
import { ativosLancaveis, lerAtivos, lerClassesLegadas, lerInstituicoes, lerNosDaTaxonomia } from "@/lib/telas/leituras";
import { ativosDoSeletor } from "@/lib/telas/seletor-ativo";
import { montarTaxonomia } from "@/lib/telas/taxonomia";

export const metadata = { title: "Novo lançamento — Saldo Futuro" };

export default async function NovoLancamentoPage() {
  if (!backend) return <PreviewNotice />;
  const { supabase } = await exigirSessao();
  // Classe e instituição de cada opção e os filtros do seletor usam os mesmos leitores de /ativos (ciclo 019, issue #191).
  const [lidos, nos, legado, instituicoes] = await Promise.all([
    lerAtivos(supabase),
    lerNosDaTaxonomia(supabase),
    lerClassesLegadas(supabase),
    lerInstituicoes(supabase),
  ]);
  const ativos = ativosDoSeletor(
    ativosLancaveis(lidos),
    montarTaxonomia(nos),
    new Map(legado.map((c) => [c.id, c.nome])),
    new Map(instituicoes.map((i) => [i.id, i.nome])),
  );

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
        <FormNovoLancamento ativos={ativos} nos={nos} instituicoes={instituicoes} hoje={hojeEmCuiaba()} />
      )}
    </div>
  );
}
