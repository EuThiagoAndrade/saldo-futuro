import Link from "next/link";
import { notFound } from "next/navigation";
import { botaoSecundario } from "@/components/botoes";
import { Confirmacao } from "@/components/confirmacao";
import { Dinheiro, VariacaoDinheiro } from "@/components/dinheiro";
import { EstadoErro, EstadoVazio } from "@/components/estados";
import { FormFechamento } from "@/components/formularios/fechamento";
import { PreviewNotice } from "@/components/preview-notice";
import { mesBr, mesValido } from "@/lib/apresentacao/datas";
import { backend } from "@/lib/config";
import { hojeEmCuiaba, mesSeguinte } from "@/lib/financeiro/datas";
import { ErroLeitura, MENSAGEM_DADOS_MUDARAM } from "@/lib/leitura";
import { valoresOcultos } from "@/lib/ocultar";
import { exigirSessao } from "@/lib/sessao";
import { mensagemDeRecusa } from "@/lib/telas/carteira";
import {
  entradaDoFechamento,
  linhasDoFechamento,
  mesDaColuna,
  mesMaisAntigo,
  proximoMesAFechar,
  situacaoDoMes,
  ultimoMesFechado,
} from "@/lib/telas/fechamento";
import { type InsumosDoFechamento, lerConsolidado, lerInsumosDoFechamento, nomeDoAtivo } from "@/lib/telas/leituras";
import { reabrirMes } from "../acoes";

export const metadata = { title: "Fechamento — Saldo Futuro" };

const link = "text-primary underline-offset-2 hover:underline";
const ROTULO_AJUSTE = { rendimento: "rendimento", marcacao: "marcação a mercado" } as const;

export default async function FechamentoPage({ params }: { params: Promise<{ mes: string }> }) {
  if (!backend) return <PreviewNotice />;
  const { supabase } = await exigirSessao();
  const mes = mesValido((await params).mes);
  if (!mes) notFound();

  let insumos: InsumosDoFechamento;
  try {
    insumos = await lerInsumosDoFechamento(supabase);
  } catch (erro) {
    if (!(erro instanceof ErroLeitura)) throw erro;
    return <EstadoErro>{erro.motivo === "mudou" ? MENSAGEM_DADOS_MUDARAM : "Não foi possível ler a carteira. Tente novamente."}</EstadoErro>;
  }

  const hoje = hojeEmCuiaba();
  const maisAntigo = mesMaisAntigo(insumos.eventos);
  const situacao = situacaoDoMes(mes, hoje, insumos.mesesFechados, maisAntigo);
  const proximo = proximoMesAFechar(ultimoMesFechado(insumos.mesesFechados), maisAntigo);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Link href={`/lancamentos?mes=${mes}`} className={`${link} self-start text-sm/5`}>
        Voltar aos lançamentos de {mesBr(mes)}
      </Link>
      <h1 className="text-2xl/8 font-semibold text-text">Fechamento de {mesBr(mes)}</h1>

      {situacao.tipo === "fechado" ? (
        <MesFechado mes={mes} insumos={insumos} podeReabrir={situacao.podeReabrir} />
      ) : situacao.tipo === "recusado" ? (
        <EstadoVazio
          titulo="Este mês ainda não pode ser fechado"
          acao={
            proximo && proximo !== mes ? (
              <Link href={`/lancamentos/fechamento/${proximo}`} className={botaoSecundario}>
                Ir para {mesBr(proximo)}
              </Link>
            ) : undefined
          }
        >
          {mensagemDeRecusa(`recusado_${situacao.motivo}`)}
          {situacao.motivo === "mes_nao_terminado" ? ` Ele pode ser fechado a partir de ${diaSeguinteBr(mes)}.` : null}
        </EstadoVazio>
      ) : (
        <FormularioAberto mes={mes} insumos={insumos} />
      )}
    </div>
  );
}

function diaSeguinteBr(mes: string): string {
  const [ano, m] = mesSeguinte(mes).split("-");
  return `01/${m}/${ano}`;
}

async function FormularioAberto({ mes, insumos }: { mes: string; insumos: InsumosDoFechamento }) {
  const entrada = entradaDoFechamento(mes, insumos.ativos, insumos.posicoes, insumos.eventos, {});
  const linhas = linhasDoFechamento(entrada).map((l) => ({
    ativo: l.ativo,
    nome: nomeDoAtivo(insumos.ativos, l.ativo),
    saldoInicial: l.saldoInicial.toString(),
    movimento: l.movimento.toString(),
    saldoCalculado: l.saldoCalculado.toString(),
    exigeSaldoReal: l.exigeSaldoReal,
  }));
  return <FormFechamento mes={mes} rotuloMes={mesBr(mes)} linhas={linhas} oculto={await valoresOcultos()} />;
}

async function MesFechado({ mes, insumos, podeReabrir }: { mes: string; insumos: InsumosDoFechamento; podeReabrir: boolean }) {
  const posicoes = insumos.posicoes.filter((p) => mesDaColuna(p.mes) === mes);
  const ultimo = ultimoMesFechado(insumos.mesesFechados);
  return (
    <>
      <section aria-labelledby="posicoes-do-mes" className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
        <h2 id="posicoes-do-mes" className="text-lg/7 font-semibold text-text">
          Mês fechado
        </h2>
        <ul className="flex flex-col gap-3">
          {posicoes.map((p) => (
            <li key={p.ativo_id} className="flex flex-col gap-1">
              <p className="text-base/6 font-semibold">{nomeDoAtivo(insumos.ativos, p.ativo_id)}</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm/5">
                <dt className="text-text-secondary">Saldo inicial</dt>
                <dd>
                  <Dinheiro valor={p.saldo_inicial} />
                </dd>
                <dt className="text-text-secondary">Saldo final</dt>
                <dd>
                  <Dinheiro valor={p.saldo_final} />
                </dd>
                <dt className="text-text-secondary">Ajuste{p.tipo_ajuste ? ` (${ROTULO_AJUSTE[p.tipo_ajuste]})` : ""}</dt>
                <dd>
                  <VariacaoDinheiro valor={p.ajuste} />
                </dd>
              </dl>
            </li>
          ))}
        </ul>
        <Patrimonio mes={mes} />
      </section>
      {podeReabrir ? (
        <Confirmacao
          gatilho="Reabrir mês"
          titulo={`Reabrir ${mesBr(mes)}`}
          consequencia="As posições, os ajustes e o consolidado do mês são removidos, e o mês volta a aceitar lançamentos. Os lançamentos não mudam."
          rotuloAcao="Reabrir mês"
          acao={reabrirMes}
        >
          <input type="hidden" name="mes" value={mes} />
        </Confirmacao>
      ) : (
        <p className="text-base/6 text-text-secondary">
          Só o último mês fechado pode ser reaberto
          {ultimo ? (
            <>
              {" "}
              (
              <Link href={`/lancamentos/fechamento/${ultimo}`} className={link}>
                {mesBr(ultimo)}
              </Link>
              )
            </>
          ) : null}
          .
        </p>
      )}
    </>
  );
}

async function Patrimonio({ mes }: { mes: string }) {
  const { supabase } = await exigirSessao();
  const consolidado = await lerConsolidado(supabase, mes);
  if (!consolidado) return null;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-border pt-3 text-sm/5">
      <dt className="text-text-secondary">Patrimônio no fim do mês</dt>
      <dd>
        <Dinheiro valor={consolidado.vf} />
      </dd>
    </dl>
  );
}
