import Link from "next/link";
import { botaoPrincipal, botaoSecundario } from "@/components/botoes";
import { Campo, classeCampo } from "@/components/campos";
import { Dinheiro } from "@/components/dinheiro";
import { EstadoErro, EstadoVazio } from "@/components/estados";
import { GraficoBarras, GraficoDistribuicao, GraficoLinha } from "@/components/graficos/graficos";
import { PreviewNotice } from "@/components/preview-notice";
import { NaoDisponivel, Percentual, ValorOculto, VariacaoPercentual } from "@/components/valores";
import { dataBr, mesBr } from "@/lib/apresentacao/datas";
import { mesCurto, textoDinheiro, textoEixoDinheiro, textoPercentual } from "@/lib/apresentacao/valores";
import { backend } from "@/lib/config";
import { indice } from "@/lib/financeiro/apresentacao";
import { RecusaFinanceira } from "@/lib/financeiro/centavos";
import { hojeEmCuiaba, ultimoDia } from "@/lib/financeiro/datas";
import { ND } from "@/lib/financeiro/rentabilidade";
import { ErroLeitura, MENSAGEM_DADOS_MUDARAM } from "@/lib/leitura";
import { valoresOcultos } from "@/lib/ocultar";
import { exigirSessao } from "@/lib/sessao";
import { mesTerminadoAberto } from "@/lib/telas/fechamento";
import {
  aportesLiquidos,
  inicioDaCarteira,
  limitesDoPeriodo,
  mesDeReferencia,
  mesesDoPeriodo,
  type Periodo,
  resultadoDoPeriodo,
  retornosDaCarteira,
  TIPOS_DE_PERIODO,
  type TipoDePeriodo,
  variacaoDeM,
} from "@/lib/telas/inicio";
import { type InsumosDoInicio, lerInsumosDoInicio, nomeDoAtivo } from "@/lib/telas/leituras";

export const metadata = { title: "Início — Saldo Futuro" };

const ROTULO_PERIODO: Record<TipoDePeriodo, string> = {
  mes: "Mês",
  ano: "Ano",
  "12_meses": "12 meses",
  desde_inicio: "Desde o início",
  intervalo: "Intervalo escolhido",
};

const CORES = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-6)"];
const COR_OUTROS = "var(--color-chart-5)";

const rotuloPeriodo = (p: Periodo) => (p.de === p.ate ? mesBr(p.de) : `${mesBr(p.de)} a ${mesBr(p.ate)}`);
const maiuscula = (t: string) => `${t[0].toUpperCase()}${t.slice(1)}`;
const mesOuNulo = (t: string | undefined) => (t && /^\d{4}-(0[1-9]|1[0-2])$/.test(t) ? t : undefined);

type Busca = { periodo?: string; de?: string; ate?: string };

export default async function InicioPage({ searchParams }: { searchParams: Promise<Busca> }) {
  if (!backend) return <PreviewNotice />;
  const { supabase } = await exigirSessao();

  let insumos: InsumosDoInicio;
  try {
    insumos = await lerInsumosDoInicio(supabase);
  } catch (erro) {
    if (!(erro instanceof ErroLeitura)) throw erro;
    return <EstadoErro>{erro.motivo === "mudou" ? MENSAGEM_DADOS_MUDARAM : "Não foi possível ler a carteira. Tente novamente."}</EstadoErro>;
  }

  const hoje = hojeEmCuiaba();
  const mesesFechados = insumos.consolidados.map((c) => c.mes);
  const M = mesDeReferencia(mesesFechados);
  const inicio = inicioDaCarteira(mesesFechados);
  const maisAntigo = insumos.eventos.length ? insumos.eventos.map((e) => e.data).sort()[0].slice(0, 7) : null;
  const pendente = mesTerminadoAberto(M, maisAntigo, hoje);
  const aportes = aportesLiquidos(insumos.eventos, M);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl/8 font-semibold text-text">Início</h1>
      {pendente ? (
        <section role="status" className="flex flex-col items-start gap-3 rounded-md border border-warning bg-warning-subtle p-4">
          <p className="text-base/6 text-text">{maiuscula(mesBr(pendente))} já terminou e ainda não foi fechado.</p>
          <Link href={`/lancamentos/fechamento/${pendente}`} className={botaoPrincipal}>
            Fechar {mesBr(pendente)}
          </Link>
        </section>
      ) : null}

      {!M || !inicio ? (
        <>
          <EstadoVazio
            titulo="Patrimônio e rentabilidade aparecem depois do primeiro fechamento"
            acao={
              <Link href="/lancamentos" className={botaoSecundario}>
                Ir para Lançamentos
              </Link>
            }
          >
            O Início mostra o patrimônio e a rentabilidade dos meses fechados. Registre os lançamentos e feche o primeiro mês.
          </EstadoVazio>
          <Cartao titulo="Aportes líquidos desde o início">
            <Dinheiro valor={aportes} />
          </Cartao>
        </>
      ) : (
        <Resumo insumos={insumos} M={M} inicio={inicio} aportes={aportes} busca={await searchParams} />
      )}
    </div>
  );
}

function Cartao({ titulo, children, detalhe }: { titulo: string; children: React.ReactNode; detalhe?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border bg-surface px-1 py-4 md:px-3">
      <p className="text-sm/5 text-text-secondary">{titulo}</p>
      <p className="text-2xl/8 font-semibold">{children}</p>
      {detalhe ? <p className="text-sm/5 text-text-secondary">{detalhe}</p> : null}
    </div>
  );
}

async function Resumo({
  insumos,
  M,
  inicio,
  aportes,
  busca,
}: {
  insumos: InsumosDoInicio;
  M: string;
  inicio: string;
  aportes: bigint;
  busca: Busca;
}) {
  const oculto = await valoresOcultos();
  const meses = insumos.consolidados.map((c) => ({ mes: c.mes, vi: BigInt(c.vi), vf: BigInt(c.vf) }));
  const deM = meses.find((m) => m.mes === M)!;
  const retornos = retornosDaCarteira(meses, insumos.eventos, inicio);

  // Período pedido (P17, P18); um intervalo depois de M é recusado (seção 15).
  const tipo: TipoDePeriodo = (TIPOS_DE_PERIODO as readonly string[]).includes(busca.periodo ?? "") ? (busca.periodo as TipoDePeriodo) : "ano";
  let periodo: Periodo;
  let recusa: string | null = null;
  try {
    const de = mesOuNulo(busca.de);
    const ate = mesOuNulo(busca.ate);
    periodo = limitesDoPeriodo(tipo, M, inicio, de && ate ? { de, ate } : undefined);
  } catch (erro) {
    if (!(erro instanceof RecusaFinanceira)) throw erro;
    recusa = `Escolha um intervalo que termine até ${mesBr(M)}, o último mês fechado.`;
    periodo = limitesDoPeriodo("ano", M, inicio);
  }
  const resultado = resultadoDoPeriodo(retornos, inicio, periodo);

  // Gráficos: meses do período com mês fechado (os anteriores ao início não existem).
  const mesesDoGrafico = mesesDoPeriodo(periodo).filter((m) => m >= inicio);
  const mesesDeRetorno = resultado.mesesBase100.length ? resultado.mesesBase100 : mesesDoGrafico;
  const vfPorMes = new Map(meses.map((m) => [m.mes, m.vf]));
  const posicoesDeM = insumos.posicoes
    .filter((p) => p.mes.slice(0, 7) === M && p.saldo_final !== 0)
    .sort((a, b) => b.saldo_final - a.saldo_final);
  const principais = posicoesDeM.slice(0, 5);
  const outros = posicoesDeM.slice(5);
  const distribuicao = [
    ...principais.map((p, i) => ({ nome: nomeDoAtivo(insumos.ativos, p.ativo_id), valor: p.saldo_final, cor: CORES[i] })),
    ...(outros.length ? [{ nome: "Outros", valor: outros.reduce((s, p) => s + p.saldo_final, 0), cor: COR_OUTROS }] : []),
  ];
  const dinheiro = (centavos: bigint | number) => (oculto ? <ValorOculto /> : textoDinheiro(BigInt(centavos)));
  const eixoDinheiro = (reais: number, marcas: number[]) => (oculto ? "••••" : textoEixoDinheiro(reais, marcas));

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        <Cartao titulo="Patrimônio" detalhe={`em ${dataBr(ultimoDia(M))}`}>
          <Dinheiro valor={deM.vf} />
        </Cartao>
        <Cartao titulo={`Aportes líquidos desde ${dataBr(ultimoDia(M))}`} detalhe="aportes menos resgates do mês aberto">
          <Dinheiro valor={aportes} />
        </Cartao>
        <Cartao titulo={`Rentabilidade em ${mesBr(M)}`}>
          <VariacaoPercentual valor={retornos[M] ?? ND} />
        </Cartao>
        <Cartao titulo={`Variação do patrimônio em ${mesBr(M)}`} detalhe="inclui aportes e resgates">
          <VariacaoPercentual valor={variacaoDeM(deM)} />
        </Cartao>
      </div>

      <section aria-labelledby="periodo" className="flex flex-col gap-4">
        <h2 id="periodo" className="text-lg/7 font-semibold text-text">
          Rentabilidade no período
        </h2>
        <form method="get" className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4 md:flex-row md:items-end">
          <div className="md:w-56">
            <Campo id="periodo-tipo" rotulo="Período">
              <select id="periodo-tipo" name="periodo" defaultValue={tipo} className={classeCampo}>
                {TIPOS_DE_PERIODO.map((t) => (
                  <option key={t} value={t}>
                    {ROTULO_PERIODO[t]}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
          <div className="md:w-44">
            <Campo id="periodo-de" rotulo="De (intervalo)">
              <input id="periodo-de" name="de" type="month" max={M} defaultValue={tipo === "intervalo" ? periodo.de : ""} className={classeCampo} />
            </Campo>
          </div>
          <div className="md:w-44">
            <Campo id="periodo-ate" rotulo="Até (intervalo)">
              <input id="periodo-ate" name="ate" type="month" max={M} defaultValue={tipo === "intervalo" ? periodo.ate : ""} className={classeCampo} />
            </Campo>
          </div>
          <button type="submit" className={botaoSecundario}>
            Ver período
          </button>
        </form>
        {recusa ? (
          <p role="alert" className="text-sm/5 text-loss">
            {recusa}
          </p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <Cartao titulo={`Rentabilidade de ${rotuloPeriodo(periodo)}`}>
            <VariacaoPercentual valor={resultado.acumulado} />
          </Cartao>
          <Cartao titulo={`Maior queda (drawdown) de ${rotuloPeriodo(periodo)}`}>
            <Percentual valor={resultado.drawdown} />
          </Cartao>
        </div>
        {resultado.sugestao ? (
          <p className="rounded-md border border-border bg-surface p-4 text-base/6 text-text-secondary">
            O período tem mês sem rentabilidade calculável, como um mês migrado. De {rotuloPeriodo(resultado.sugestao.periodo)}:{" "}
            <VariacaoPercentual valor={resultado.sugestao.valor} />
          </p>
        ) : null}
      </section>

      <section aria-label="Gráficos" className="grid gap-4 lg:grid-cols-2">
        <GraficoLinha
          id="grafico-patrimonio"
          titulo="Evolução do patrimônio"
          descricao={`Patrimônio no fim de cada mês fechado, de ${rotuloPeriodo(periodo)}.`}
          rotulosX={mesesDoGrafico.map(mesCurto)}
          series={[
            {
              nome: "Carteira",
              valores: mesesDoGrafico.map((m) => (vfPorMes.has(m) ? Number(vfPorMes.get(m)!) / 100 : null)),
              cor: "var(--color-chart-1)",
            },
          ]}
          rotularY={eixoDinheiro}
          margemEsquerda={144}
          colunasTabela={["Mês", "Patrimônio"]}
          linhasTabela={mesesDoGrafico.map((m) => ({
            rotulo: mesBr(m),
            valores: [vfPorMes.has(m) ? dinheiro(vfPorMes.get(m)!) : <NaoDisponivel key="nd" />],
          }))}
        />
        <GraficoBarras
          id="grafico-rentabilidade"
          titulo="Rentabilidade mensal"
          descricao={`Rentabilidade de cada mês de ${rotuloPeriodo(periodo)}; mês sem rentabilidade fica em branco.`}
          rotulosX={mesesDeRetorno.map(mesCurto)}
          valores={mesesDeRetorno.map((m) => {
            const r = retornos[m];
            return r === undefined || r === ND ? null : r;
          })}
          rotularY={(v) => textoPercentual(v)}
          colunasTabela={["Mês", "Rentabilidade"]}
          linhasTabela={mesesDeRetorno.map((m) => ({
            rotulo: mesBr(m),
            valores: [<VariacaoPercentual key="r" valor={retornos[m] ?? ND} />],
          }))}
        />
        {resultado.base100 === ND ? (
          <EstadoVazio titulo="Base 100">
            A série base 100 de {rotuloPeriodo(periodo)} não está disponível: o período tem mês sem rentabilidade calculável.
          </EstadoVazio>
        ) : (
          <GraficoLinha
            id="grafico-base100"
            titulo="Base 100"
            descricao={`Crescimento de 100 aplicados no começo de ${rotuloPeriodo(periodo)}, só pela rentabilidade.`}
            rotulosX={resultado.mesesBase100.map(mesCurto)}
            series={[{ nome: "Carteira", valores: resultado.base100, cor: "var(--color-chart-1)" }]}
            rotularY={(v) => indice(v)}
            colunasTabela={["Mês", "Índice"]}
            linhasTabela={resultado.mesesBase100.map((m, i) => ({ rotulo: mesBr(m), valores: [indice((resultado.base100 as number[])[i])] }))}
          />
        )}
        {distribuicao.length ? (
          <GraficoDistribuicao
            id="grafico-distribuicao"
            titulo={`Distribuição por ativo em ${mesBr(M)}`}
            descricao="Saldo de cada ativo no fim do último mês fechado; além dos cinco maiores, os demais somados em Outros."
            itens={distribuicao}
            colunasTabela={["Ativo", "Saldo"]}
            linhasTabela={distribuicao.map((d) => ({ rotulo: d.nome, valores: [dinheiro(d.valor)] }))}
          />
        ) : null}
      </section>
    </>
  );
}
