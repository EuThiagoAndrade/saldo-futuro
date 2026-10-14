import Link from "next/link";
import { botaoPrincipal } from "@/components/botoes";
import { Campo, classeCampo } from "@/components/campos";
import { Confirmacao } from "@/components/confirmacao";
import { Dinheiro } from "@/components/dinheiro";
import { EstadoVazio } from "@/components/estados";
import { FormNovaTransferencia } from "@/components/formularios/nova-transferencia";
import { PreviewNotice } from "@/components/preview-notice";
import { dataBr } from "@/lib/apresentacao/datas";
import { backend } from "@/lib/config";
import { hojeEmCuiaba } from "@/lib/financeiro/datas";
import { exigirSessao } from "@/lib/sessao";
import { montarTransferencias, type Transferencia } from "@/lib/telas/carteira";
import { type Ativo, ativosTransferiveis, lerAtivos, lerCabecalhosDeTransferencia, lerEventos, nomeDoAtivo } from "@/lib/telas/leituras";
import { corrigirTransferencia } from "./acoes";

export const metadata = { title: "Transferências — Saldo Futuro" };

function Situacao({ t, hoje, layout }: { t: Transferencia; hoje: string; layout: "tabela" | "cartao" }) {
  if (t.correcao) return <span className="text-sm/5 text-text-secondary">Corrigida em {dataBr(t.correcao)}</span>;
  return (
    <Confirmacao
      gatilho="Corrigir"
      titulo="Corrigir transferência"
      consequencia="A correção estorna as duas pernas juntas, na data escolhida. A transferência original continua no histórico."
      rotuloAcao="Corrigir transferência"
      acao={corrigirTransferencia}
    >
      <input type="hidden" name="transferencia" value={t.id} />
      <Campo id={`correcao-${layout}-${t.id}`} rotulo="Data da correção">
        <input id={`correcao-${layout}-${t.id}`} name="data" type="date" required min={t.data} max={hoje} defaultValue={hoje} className={classeCampo} />
      </Campo>
    </Confirmacao>
  );
}

function Trajeto({ t, ativos }: { t: Transferencia; ativos: Ativo[] }) {
  return (
    <>
      {nomeDoAtivo(ativos, t.origem)} <span aria-hidden="true">→</span>
      <span className="sr-only">para</span> {nomeDoAtivo(ativos, t.destino)}
    </>
  );
}

export default async function TransferenciasPage() {
  if (!backend) return <PreviewNotice />;
  const { supabase } = await exigirSessao();
  const [ativos, eventos, cabecalhos] = await Promise.all([
    lerAtivos(supabase),
    lerEventos(supabase),
    lerCabecalhosDeTransferencia(supabase),
  ]);
  const transferencias = montarTransferencias(cabecalhos, eventos).sort((a, b) => b.data.localeCompare(a.data));
  const opcoes = ativosTransferiveis(ativos).map((a) => ({ id: a.id, nome: nomeDoAtivo(ativos, a.id) }));
  const hoje = hojeEmCuiaba();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl/8 font-semibold text-text">Transferências</h1>

      {opcoes.length < 2 ? (
        <EstadoVazio
          titulo="Cadastre seus ativos"
          acao={
            <Link href="/ativos" className={botaoPrincipal}>
              Ir para Ativos
            </Link>
          }
        >
          Uma transferência move dinheiro entre dois ativos da sua carteira, sem contar como aporte ou resgate.
        </EstadoVazio>
      ) : (
        <div className="max-w-xl">
          <FormNovaTransferencia ativos={opcoes} hoje={hoje} />
        </div>
      )}

      <section aria-labelledby="transferencias-registradas" className="flex flex-col gap-3">
        <h2 id="transferencias-registradas" className="text-lg/7 font-semibold text-text">
          Registradas
        </h2>
        {transferencias.length === 0 ? (
          <p className="text-base/6 text-text-secondary">Nenhuma transferência registrada.</p>
        ) : (
          <>
            <table className="hidden w-full border-collapse rounded-md bg-surface text-left md:table">
              <thead>
                <tr className="border-b border-border text-sm/5 text-text-secondary">
                  <th scope="col" className="p-3 font-medium">
                    Data
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    Origem e destino
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    Valor
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    Situação
                  </th>
                </tr>
              </thead>
              <tbody>
                {transferencias.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="p-3 text-base/6">{dataBr(t.data)}</td>
                    <td className="p-3 text-base/6">
                      <Trajeto t={t} ativos={ativos} />
                    </td>
                    <td className="p-3 text-right text-base/6">
                      <Dinheiro valor={t.valor} />
                    </td>
                    <td className="p-3">
                      <Situacao t={t} hoje={hoje} layout="tabela" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="flex flex-col gap-3 md:hidden">
              {transferencias.map((t) => (
                <li key={t.id} className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-base/6 font-semibold">
                      <Trajeto t={t} ativos={ativos} />
                    </span>
                    <Dinheiro valor={t.valor} />
                  </span>
                  <span className="text-sm/5 text-text-secondary">{dataBr(t.data)}</span>
                  <Situacao t={t} hoje={hoje} layout="cartao" />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
