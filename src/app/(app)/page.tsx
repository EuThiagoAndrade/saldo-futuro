import Link from "next/link";
import { botaoPrincipal, botaoSecundario } from "@/components/botoes";
import { Campo, classeCampo } from "@/components/campos";
import { Dinheiro } from "@/components/dinheiro";
import { EstadoErro, EstadoVazio } from "@/components/estados";
import { GraficoBarras, GraficoLinha } from "@/components/graficos/graficos";
import { margemComum, rotulosDoEixoBarras, rotulosDoEixoLinha } from "@/components/graficos/margem";
import { DetalheDoRamo } from "@/components/detalhe-do-ramo";
import { GraficoRosca, GraficoRoscaPorClasse, GraficoRoscaPorInstituicao } from "@/components/graficos/rosca";
import { PreviewNotice } from "@/components/preview-notice";
import { NaoDisponivel, Percentual, ValorOculto, VariacaoPercentual } from "@/components/valores";
import { dataBr, mesBr } from "@/lib/apresentacao/datas";
import { mesCurto, textoDinheiro, textoEixoDinheiro, textoPercentual } from "@/lib/apresentacao/valores";
import { backend } from "@/lib/config";
import { indice } from "@/lib/financeiro/apresentacao";
import { type Alocacao, ClassificacaoIncoerente, comporAlocacao, type Grupo, grupoDoAtivo, MACROS } from "@/lib/financeiro/alocacao";
import { RecusaFinanceira } from "@/lib/financeiro/centavos";
import { comporDistribuicao } from "@/lib/financeiro/distribuicao";
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
import { alocacaoPorInstituicao, MACRO_DO_GRUPO, nomeDoGrupoInstitucional, ramoDeClasse } from "@/lib/telas/analises-inicio";
import { type InsumosDoInicio, lerInsumosDoInicio, lerInsumosDoInicioPorClasse, lerInsumosDoInicioPorInstituicao, nomeDoAtivo } from "@/lib/telas/leituras";
import type { NoTaxonomia } from "@/lib/telas/taxonomia";

export const metadata = { title: "Início — Saldo Futuro" };

const ROTULO_PERIODO: Record<TipoDePeriodo, string> = {
  mes: "Mês",
  ano: "Ano",
  "12_meses": "12 meses",
  desde_inicio: "Desde o início",
  intervalo: "Intervalo escolhido",
};

const rotuloPeriodo = (p: Periodo) => (p.de === p.ate ? mesBr(p.de) : `${mesBr(p.de)} a ${mesBr(p.ate)}`);
const maiuscula = (t: string) => `${t[0].toUpperCase()}${t.slice(1)}`;
const mesOuNulo = (t: string | undefined) => (t && /^\d{4}-(0[1-9]|1[0-2])$/.test(t) ? t : undefined);

type Busca = { periodo?: string; de?: string; ate?: string; distribuicao?: string; classe?: string };
// Visão da distribuição (ciclo 013, issue #139; instituição no ciclo 015, issue #154; ordem e padrão
// no ciclo 016, issue #163): por instituição, o padrão, por classe ou por ativo. `classe` é o pai
// aberto na visão por classe.
type Visao = "ativo" | "classe" | "instituicao";
const visaoDe = (busca: Busca): Visao => (busca.distribuicao === "ativo" || busca.distribuicao === "classe" ? busca.distribuicao : "instituicao");
type InsumosDaTela = InsumosDoInicio & { nos?: NoTaxonomia[]; instituicoes?: { id: string; nome: string }[] };

/** Endereço de uma visão da distribuição: preserva o período; o ramo só existe na visão por classe. */
function hrefDaDistribuicao(busca: Busca, visao: Visao, classe?: string): string {
  const params = new URLSearchParams();
  for (const chave of ["periodo", "de", "ate"] as const) {
    const valor = busca[chave];
    if (valor) params.set(chave, valor);
  }
  params.set("distribuicao", visao);
  if (visao === "classe" && classe) params.set("classe", classe);
  return `?${params.toString()}#distribuicao`;
}

export default async function InicioPage({ searchParams }: { searchParams: Promise<Busca> }) {
  if (!backend) return <PreviewNotice />;
  const { supabase } = await exigirSessao();
  const busca = await searchParams;
  const visao = visaoDe(busca);

  let insumos: InsumosDaTela;
  try {
    insumos =
      visao === "classe"
        ? await lerInsumosDoInicioPorClasse(supabase)
        : visao === "instituicao"
          ? await lerInsumosDoInicioPorInstituicao(supabase)
          : await lerInsumosDoInicio(supabase);
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
        <Resumo insumos={insumos} M={M} inicio={inicio} aportes={aportes} busca={busca} visao={visao} />
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
  visao,
}: {
  insumos: InsumosDaTela;
  M: string;
  inicio: string;
  aportes: bigint;
  busca: Busca;
  visao: Visao;
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
  // Distribuição de M (KB-004, seção 15): participação sobre os saldos positivos, pelo maior resto,
  // por ativo ou por classe macro. Só a visão escolhida é composta e renderizada.
  const posicoesDeM = insumos.posicoes.filter((p) => p.mes.slice(0, 7) === M);
  const distribuicao =
    visao === "ativo"
      ? comporDistribuicao(posicoesDeM.map((p) => ({ id: p.ativo_id, nome: nomeDoAtivo(insumos.ativos, p.ativo_id), saldo: p.saldo_final })))
      : null;
  const porClasse = visao === "classe" ? alocacaoDeM(insumos, posicoesDeM) : null;
  const porInstituicao = visao === "instituicao" ? alocacaoPorInstituicao({ ativos: insumos.ativos, instituicoes: insumos.instituicoes ?? [] }, posicoesDeM) : null;
  // Ramo aberto na visão por classe (ciclo 015): só um pai válido; o resto volta à raiz.
  const ramo = visao === "classe" && porClasse ? ramoDeClasse({ ativos: insumos.ativos, nos: insumos.nos ?? [] }, posicoesDeM, busca.classe) : null;
  const detalheAberto = ramo?.tipo === "detalhe" ? ramo.detalhe.pai.id : undefined;
  const dinheiro = (centavos: bigint | number) => (oculto ? <ValorOculto /> : textoDinheiro(BigInt(centavos)));
  const eixoDinheiro = (reais: number, marcas: number[]) => (oculto ? "••••" : textoEixoDinheiro(reais, marcas));

  // Margem esquerda comum aos três gráficos de eixo (BL-013): comporta o rótulo mais longo de todos.
  const valoresPatrimonio = mesesDoGrafico.map((m) => (vfPorMes.has(m) ? Number(vfPorMes.get(m)!) / 100 : null));
  const valoresRentabilidade = mesesDeRetorno.map((m) => {
    const r = retornos[m];
    return r === undefined || r === ND ? null : r;
  });
  const rotularRentabilidade = (v: number) => textoPercentual(v);
  const rotularBase100 = (v: number) => indice(v);
  const margemEsquerda = margemComum([
    rotulosDoEixoLinha([valoresPatrimonio], eixoDinheiro),
    rotulosDoEixoBarras(valoresRentabilidade, rotularRentabilidade),
    ...(resultado.base100 === ND ? [] : [rotulosDoEixoLinha([resultado.base100], rotularBase100)]),
  ]);

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
        <form method="get" noValidate className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4 md:flex-row md:items-end">
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
          <div data-campos-intervalo className="contents">
            <div className="md:w-44">
              <Campo id="periodo-de" rotulo="De">
                <input id="periodo-de" name="de" type="month" max={M} defaultValue={tipo === "intervalo" ? periodo.de : ""} className={classeCampo} />
              </Campo>
            </div>
            <div className="md:w-44">
              <Campo id="periodo-ate" rotulo="Até">
                <input id="periodo-ate" name="ate" type="month" max={M} defaultValue={tipo === "intervalo" ? periodo.ate : ""} className={classeCampo} />
              </Campo>
            </div>
          </div>
          {/* A visão da distribuição continua a mesma ao aplicar o período (R2-2). */}
          <input type="hidden" name="distribuicao" value={visao} />
          {detalheAberto ? <input type="hidden" name="classe" value={detalheAberto} /> : null}
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
              valores: valoresPatrimonio,
              cor: "var(--color-chart-1)",
            },
          ]}
          rotularY={eixoDinheiro}
          margemEsquerda={margemEsquerda}
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
          valores={valoresRentabilidade}
          rotularY={rotularRentabilidade}
          margemEsquerda={margemEsquerda}
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
            rotularY={rotularBase100}
            margemEsquerda={margemEsquerda}
            colunasTabela={["Mês", "Índice"]}
            linhasTabela={resultado.mesesBase100.map((m, i) => ({ rotulo: mesBr(m), valores: [indice((resultado.base100 as number[])[i])] }))}
          />
        )}
        <div id="distribuicao" className="flex flex-col gap-3">
          <AlternadorDaDistribuicao busca={busca} visao={visao} />
          {distribuicao ? (
            <GraficoRosca
              id="grafico-distribuicao"
              titulo={`Distribuição por ativo em ${mesBr(M)}`}
              descricao="Participação de cada ativo na soma dos saldos positivos no fim do último mês fechado; além dos cinco maiores, os demais somados em Outros. Saldos negativos ficam fora da rosca."
              distribuicao={distribuicao}
              dinheiro={dinheiro}
            />
          ) : porInstituicao ? (
            <GraficoRoscaPorInstituicao
              id="grafico-distribuicao-instituicao"
              titulo={`Distribuição por instituição em ${mesBr(M)}`}
              descricao="Participação de cada instituição na soma dos saldos positivos dos ativos no fim do último mês fechado, pela instituição atual de cada ativo; sem instituição e em trânsito aparecem à parte. Além das cinco maiores linhas, as demais somadas em Outros. Saldos negativos ficam fora da rosca, por ativo."
              alocacao={porInstituicao}
              nomeDoGrupo={nomeDoGrupoInstitucional}
              dinheiro={dinheiro}
            />
          ) : visao === "instituicao" ? (
            <EstadoErro>A distribuição por instituição não está disponível: a instituição de algum ativo não pôde ser lida. Tente novamente.</EstadoErro>
          ) : porClasse && ramo?.tipo === "detalhe" ? (
            <DetalheDoRamo
              id="detalhe-classe"
              mes={mesBr(M)}
              detalhe={ramo.detalhe}
              dinheiro={dinheiro}
              href={(classe) => hrefDaDistribuicao(busca, "classe", classe)}
            />
          ) : porClasse && ramo ? (
            <>
              {ramo.tipo === "invalido" ? (
                <p role="status" className="rounded-md border border-border bg-surface p-3 text-sm/5 text-text-secondary">
                  A classe pedida não existe ou não tem detalhamento. Mostrando as classes macro.
                </p>
              ) : null}
              <GraficoRoscaPorClasse
                id="grafico-distribuicao-classe"
                titulo={`Distribuição por classe em ${mesBr(M)}`}
                descricao="Participação de cada classe macro na soma dos saldos positivos dos ativos no fim do último mês fechado, pela classe atual de cada ativo. Saldos negativos ficam fora da rosca, por ativo."
                alocacao={porClasse.alocacao}
                nomeDoGrupo={porClasse.nomeDoGrupo}
                dinheiro={dinheiro}
                hrefDoDetalhe={(grupo) => (MACRO_DO_GRUPO[grupo] ? hrefDaDistribuicao(busca, "classe", MACRO_DO_GRUPO[grupo]) : undefined)}
              />
            </>
          ) : (
            <EstadoErro>A distribuição por classe não está disponível: a classe de algum ativo não pôde ser lida. Tente novamente.</EstadoErro>
          )}
        </div>
      </section>
    </>
  );
}

/** Alocação de M por classe macro; null se a classe de algum ativo não puder ser lida (indisponível). */
function alocacaoDeM(insumos: InsumosDaTela, posicoesDeM: InsumosDoInicio["posicoes"]): { alocacao: Alocacao; nomeDoGrupo: (g: Grupo) => string } | null {
  const nos = new Map((insumos.nos ?? []).map((n) => [n.id, n]));
  const ativos = new Map(insumos.ativos.map((a) => [a.id, a]));
  try {
    const alocacao = comporAlocacao(
      posicoesDeM.map((p) => {
        const ativo = ativos.get(p.ativo_id);
        if (!ativo) throw new ClassificacaoIncoerente(`ativo ${p.ativo_id} ausente`);
        return { id: p.ativo_id, nome: ativo.nome, saldo: p.saldo_final, grupo: grupoDoAtivo(ativo, nos) };
      }),
    );
    const nomes = new Map(Object.entries(MACROS).map(([id, grupo]) => [grupo, nos.get(id)?.nome]));
    const nomeDoGrupo = (g: Grupo) => (g === "transito" ? "Em trânsito" : g === "sem_classe" ? "Sem classe" : (nomes.get(g) ?? g));
    return { alocacao, nomeDoGrupo };
  } catch (erro) {
    if (erro instanceof ClassificacaoIncoerente) return null;
    throw erro;
  }
}

/**
 * Alternador da distribuição (DESIGN.md 6.12, variante sem contador): links que preservam o período
 * escolhido, com aria-current na visão atual. Ausente ou inválido abre Por instituição.
 */
function AlternadorDaDistribuicao({ busca, visao }: { busca: Busca; visao: Visao }) {
  const visoes = [
    ["instituicao", "Por instituição"],
    ["classe", "Por classe"],
    ["ativo", "Por ativo"],
  ] as const;
  return (
    <nav aria-label="Distribuição do patrimônio" className="flex border-b border-border">
      {visoes.map(([destino, rotulo]) => (
        <Link
          key={destino}
          href={hrefDaDistribuicao(busca, destino)}
          aria-current={visao === destino ? "page" : undefined}
          className={`-mb-px flex min-h-11 items-center border-b-2 px-4 text-sm/5 font-medium hover:bg-surface ${
            visao === destino ? "border-primary text-primary" : "border-transparent text-text-secondary"
          }`}
        >
          {rotulo}
        </Link>
      ))}
    </nav>
  );
}
