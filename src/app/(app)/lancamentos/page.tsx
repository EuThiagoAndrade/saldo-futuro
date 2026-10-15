import Link from "next/link";
import { botaoPrincipal, botaoSecundario } from "@/components/botoes";
import { Campo, classeCampo } from "@/components/campos";
import { ValorLancamento } from "@/components/dinheiro";
import { EstadoVazio } from "@/components/estados";
import { PreviewNotice } from "@/components/preview-notice";
import { dataBr, mesBr, mesValido } from "@/lib/apresentacao/datas";
import { backend } from "@/lib/config";
import { hojeEmCuiaba, mesDe } from "@/lib/financeiro/datas";
import { exigirSessao } from "@/lib/sessao";
import { descreverEvento } from "@/lib/telas/carteira";
import { lerAjustes, lerAtivos, lerEventos, mesFechado, nomeDoAtivo } from "@/lib/telas/leituras";

export const metadata = { title: "Lançamentos — Saldo Futuro" };

interface Linha {
  chave: string;
  data: string | null;
  ativo: string;
  descricao: string;
  valor: bigint;
  href: string | null;
}

export default async function LancamentosPage({ searchParams }: { searchParams: Promise<{ mes?: string; ativo?: string }> }) {
  if (!backend) return <PreviewNotice />;
  const { supabase } = await exigirSessao();
  const filtros = await searchParams;
  const mes = mesValido(filtros.mes) ?? mesDe(hojeEmCuiaba());
  const filtroAtivo = filtros.ativo || "";

  const [ativos, eventos, fechado] = await Promise.all([lerAtivos(supabase), lerEventos(supabase), mesFechado(supabase, mes)]);
  const ajustes = fechado ? await lerAjustes(supabase, mes) : [];
  const porId = new Map(eventos.map((e) => [e.id, e]));

  const linhas: Linha[] = [
    ...eventos
      .filter((e) => mesDe(e.data) === mes && (!filtroAtivo || e.ativo === filtroAtivo))
      .map((e) => ({
        chave: e.id,
        data: e.data,
        ativo: nomeDoAtivo(ativos, e.ativo),
        descricao: descreverEvento(e, porId),
        valor: e.valor,
        href: `/lancamentos/${e.id}`,
      })),
    // Os ajustes do fechamento não são eventos (KB-004, seção 5): aparecem marcados, no fim do mês.
    ...ajustes
      .filter((a) => !filtroAtivo || a.ativo_id === filtroAtivo)
      .map((a) => ({
        chave: `ajuste-${a.ativo_id}`,
        data: null,
        ativo: nomeDoAtivo(ativos, a.ativo_id),
        descricao: `Ajuste do fechamento (${a.tipo_ajuste === "marcacao" ? "marcação a mercado" : "rendimento"})`,
        valor: BigInt(a.ajuste),
        href: null,
      })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl/8 font-semibold text-text">Lançamentos</h1>
        <Link href="/lancamentos/novo" className={botaoPrincipal}>
          Novo lançamento
        </Link>
      </div>

      <form method="get" className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4 sm:flex-row sm:items-end">
        <div className="sm:w-48">
          <Campo id="filtro-mes" rotulo="Mês">
            <input id="filtro-mes" name="mes" type="month" defaultValue={mes} className={classeCampo} />
          </Campo>
        </div>
        <div className="sm:flex-1">
          <Campo id="filtro-ativo" rotulo="Ativo">
            <select id="filtro-ativo" name="ativo" defaultValue={filtroAtivo} className={classeCampo}>
              <option value="">Todos os ativos</option>
              {ativos.map((a) => (
                <option key={a.id} value={a.id}>
                  {nomeDoAtivo(ativos, a.id)}
                </option>
              ))}
            </select>
          </Campo>
        </div>
        <button type="submit" className={botaoSecundario}>
          Filtrar
        </button>
      </form>

      <section aria-labelledby="lancamentos-do-mes" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="lancamentos-do-mes" className="text-lg/7 font-semibold text-text">
            {mesBr(mes)} {fechado ? <span className="ml-2 rounded-sm bg-neutral-subtle px-2 py-0.5 text-sm/5 font-medium text-text-secondary">Mês fechado</span> : null}
          </h2>
          <Link href={`/lancamentos/fechamento/${mes}`} className={botaoSecundario}>
            Fechamento de {mesBr(mes)}
          </Link>
        </div>

        {linhas.length === 0 ? (
          <EstadoVazio
            titulo="Nenhum lançamento neste mês"
            acao={
              <Link href="/lancamentos/novo" className={botaoPrincipal}>
                Registrar lançamento
              </Link>
            }
          >
            Os aportes, resgates e rendimentos lançados neste mês vão aparecer aqui.
          </EstadoVazio>
        ) : (
          <>
            <table className="hidden w-full border-collapse rounded-md bg-surface text-left md:table">
              <thead>
                <tr className="border-b border-border text-sm/5 text-text-secondary">
                  <th scope="col" className="p-3 font-medium">
                    Data
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    Ativo
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    Tipo
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.chave} className="border-b border-border last:border-0">
                    <td className="p-3 text-base/6">{l.data ? dataBr(l.data) : "Fim do mês"}</td>
                    <td className="p-3 text-base/6">{l.ativo}</td>
                    <td className="p-3 text-base/6">
                      {l.href ? (
                        <Link href={l.href} className="text-primary underline-offset-2 hover:underline">
                          {l.descricao}
                        </Link>
                      ) : (
                        l.descricao
                      )}
                    </td>
                    <td className="p-3 text-right text-base/6">
                      <ValorLancamento valor={l.valor} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="flex flex-col gap-3 md:hidden">
              {linhas.map((l) => {
                const conteudo = (
                  <>
                    <span className="flex items-start justify-between gap-3">
                      <span className="truncate text-base/6 font-semibold">{l.ativo}</span>
                      <ValorLancamento valor={l.valor} />
                    </span>
                    <span className="text-sm/5 text-text-secondary">
                      {l.descricao} · {l.data ? dataBr(l.data) : "fim do mês"}
                    </span>
                  </>
                );
                return (
                  <li key={l.chave}>
                    {l.href ? (
                      <Link href={l.href} className="flex flex-col gap-1 rounded-md border border-border bg-surface p-4">
                        {conteudo}
                      </Link>
                    ) : (
                      <div className="flex flex-col gap-1 rounded-md border border-border bg-surface-subtle p-4">{conteudo}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
