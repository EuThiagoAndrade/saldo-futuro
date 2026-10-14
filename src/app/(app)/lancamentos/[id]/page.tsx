import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Campo, classeCampo } from "@/components/campos";
import { Confirmacao } from "@/components/confirmacao";
import { ValorLancamento } from "@/components/dinheiro";
import { PreviewNotice } from "@/components/preview-notice";
import { dataBr } from "@/lib/apresentacao/datas";
import { backend } from "@/lib/config";
import { hojeEmCuiaba, mesDe } from "@/lib/financeiro/datas";
import { exigirSessao } from "@/lib/sessao";
import { descreverEvento, podeEstornar } from "@/lib/telas/carteira";
import { lerAtivos, lerEventos, nomeDoAtivo } from "@/lib/telas/leituras";
import { estornar } from "../acoes";

export const metadata = { title: "Lançamento — Saldo Futuro" };

const link = "text-primary underline-offset-2 hover:underline";

export default async function LancamentoPage({ params }: { params: Promise<{ id: string }> }) {
  if (!backend) return <PreviewNotice />;
  const { supabase } = await exigirSessao();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  // A RLS devolve só os eventos do próprio usuário: o de outra pessoa não é encontrado.
  const [ativos, eventos] = await Promise.all([lerAtivos(supabase), lerEventos(supabase)]);
  const evento = eventos.find((e) => e.id === id);
  if (!evento) notFound();
  const porId = new Map(eventos.map((e) => [e.id, e]));
  const estorno = eventos.find((e) => e.estornoDe === evento.id);
  const original = evento.estornoDe ? porId.get(evento.estornoDe) : undefined;
  const hoje = hojeEmCuiaba();

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <Link href={`/lancamentos?mes=${mesDe(evento.data)}`} className={`${link} self-start text-sm/5`}>
        Voltar aos lançamentos
      </Link>
      <h1 className="text-2xl/8 font-semibold text-text">{descreverEvento(evento, porId)}</h1>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-md border border-border bg-surface p-4 text-base/6">
        <dt className="text-text-secondary">Ativo</dt>
        <dd>{nomeDoAtivo(ativos, evento.ativo)}</dd>
        <dt className="text-text-secondary">Data</dt>
        <dd>{dataBr(evento.data)}</dd>
        <dt className="text-text-secondary">Valor</dt>
        <dd>
          <ValorLancamento valor={evento.valor} />
        </dd>
      </dl>

      {estorno ? (
        <p className="text-base/6 text-text-secondary">
          Estornado em{" "}
          <Link href={`/lancamentos/${estorno.id}`} className={link}>
            {dataBr(estorno.data)}
          </Link>
          .
        </p>
      ) : null}
      {original ? (
        <p className="text-base/6 text-text-secondary">
          Estorna o{" "}
          <Link href={`/lancamentos/${original.id}`} className={link}>
            lançamento de {dataBr(original.data)}
          </Link>
          .
        </p>
      ) : null}
      {evento.transferencia ? (
        <p className="text-base/6 text-text-secondary">
          Transferências são corrigidas por inteiro, em{" "}
          <Link href="/transferencias" className={link}>
            Transferências
          </Link>
          .
        </p>
      ) : null}

      {podeEstornar(evento, eventos) ? (
        <Confirmacao
          gatilho="Estornar"
          titulo="Estornar lançamento"
          consequencia="O estorno lança o valor oposto na data escolhida. O lançamento original continua no histórico."
          rotuloAcao="Estornar lançamento"
          acao={estornar}
        >
          <input type="hidden" name="evento" value={evento.id} />
          <Campo id="estorno-data" rotulo="Data do estorno">
            <input
              id="estorno-data"
              name="data"
              type="date"
              required
              min={evento.data}
              max={hoje}
              defaultValue={hoje}
              className={classeCampo}
            />
          </Campo>
        </Confirmacao>
      ) : null}
    </div>
  );
}
