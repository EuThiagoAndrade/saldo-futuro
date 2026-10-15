import Link from "next/link";
import { botaoSecundario } from "@/components/botoes";
import { Campo, classeCampo } from "@/components/campos";
import { EstadoErro, EstadoVazio } from "@/components/estados";
import { GraficoLinha } from "@/components/graficos/graficos";
import { PreviewNotice } from "@/components/preview-notice";
import { NaoDisponivel, Percentual, PontosPercentuais, VariacaoPercentual } from "@/components/valores";
import { dataBr, mesBr, mesValido } from "@/lib/apresentacao/datas";
import { mesCurto } from "@/lib/apresentacao/valores";
import { backend } from "@/lib/config";
import { indice } from "@/lib/financeiro/apresentacao";
import { ND } from "@/lib/financeiro/rentabilidade";
import { exigirSessao } from "@/lib/sessao";
import { comporComparacao, retornosDoBenchmark } from "@/lib/telas/benchmarks";
import { inicioDaCarteira, limitesDoPeriodo, mesDeReferencia, mesesDoPeriodo, retornosDaCarteira, TIPOS_DE_PERIODO, type TipoDePeriodo } from "@/lib/telas/inicio";
import { lerCatalogo, lerComparacao } from "@/lib/telas/leitura-benchmarks";

export const metadata = { title: "Comparação — Saldo Futuro" };
type Busca = { benchmark?: string; periodo?: string; de?: string; ate?: string };
const PERIODOS: Record<TipoDePeriodo, string> = { mes: "Mês", ano: "Ano", "12_meses": "12 meses", desde_inicio: "Desde o início", intervalo: "Intervalo escolhido" };

export default async function ComparacaoPage({ searchParams }: { searchParams: Promise<Busca> }) {
  if (!backend) return <PreviewNotice />;
  const { supabase } = await exigirSessao();
  const busca = await searchParams;
  const conteudo = await (async () => {
    const catalogo = await lerCatalogo(supabase);
    const selecionado = busca.benchmark ? catalogo.find((b) => b.id === busca.benchmark) : catalogo[0];
    if (!selecionado) return <EstadoVazio titulo="Escolha um benchmark" acao={<Link href="/benchmarks" className={botaoSecundario}>Ver benchmarks</Link>}>O benchmark solicitado não existe no catálogo.</EstadoVazio>;
    const insumos = await lerComparacao(supabase, selecionado.id);
    const mesesFechados = insumos.consolidados.map((m) => m.mes);
    const M = mesDeReferencia(mesesFechados);
    const inicio = inicioDaCarteira(mesesFechados);
    if (!M || !inicio) return <EstadoVazio titulo="A comparação aparece depois do primeiro fechamento" acao={<Link href="/lancamentos" className={botaoSecundario}>Ir para Lançamentos</Link>}>Feche um mês para comparar sua carteira com os benchmarks.</EstadoVazio>;
    const tipo: TipoDePeriodo = TIPOS_DE_PERIODO.includes(busca.periodo as TipoDePeriodo) ? busca.periodo as TipoDePeriodo : "ano";
    let periodo;
    let recusa = "";
    try {
      const de = mesValido(busca.de), ate = mesValido(busca.ate);
      periodo = limitesDoPeriodo(tipo, M, inicio, de && ate ? { de, ate } : undefined);
    } catch {
      recusa = "Escolha um intervalo válido, em ordem e até o último mês fechado.";
      periodo = limitesDoPeriodo("ano", M, inicio);
    }
    const carteira = retornosDaCarteira(insumos.consolidados, insumos.eventos, inicio);
    const benchmark = retornosDoBenchmark(selecionado.periodicidade, insumos.valores, insumos.cobertura, periodo);
    const resultado = comporComparacao(carteira, benchmark, inicio, periodo);
    const medidas = resultado.medidas;
    const valorBase = (serie: number[] | typeof ND, i: number) => serie === ND ? <NaoDisponivel /> : indice(serie[i]);
    return <>
      <form className="flex flex-col items-start gap-4 md:flex-row md:flex-wrap md:items-end" action="/benchmarks/comparacao">
        <Campo id="benchmark" rotulo="Benchmark"><select id="benchmark" name="benchmark" defaultValue={selecionado.id} className={classeCampo}>{catalogo.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}</select></Campo>
        <Campo id="periodo" rotulo="Período"><select id="periodo" name="periodo" defaultValue={tipo} className={classeCampo}>{TIPOS_DE_PERIODO.map((p) => <option key={p} value={p}>{PERIODOS[p]}</option>)}</select></Campo>
        <Campo id="de" rotulo="De (intervalo)"><input id="de" name="de" type="month" max={M} defaultValue={busca.de} className={classeCampo} /></Campo>
        <Campo id="ate" rotulo="Até (intervalo)"><input id="ate" name="ate" type="month" max={M} defaultValue={busca.ate} className={classeCampo} /></Campo>
        <button className={botaoSecundario} type="submit">Ver comparação</button>
      </form>
      {recusa ? <p role="alert" className="text-loss">{recusa}</p> : null}
      <p className="text-base/6 text-text-secondary">Período pedido: {mesBr(periodo.de)} a {mesBr(periodo.ate)}. {resultado.meses.length ? `Comparação de ${mesBr(resultado.efetivo.de)} a ${mesBr(resultado.efetivo.ate)} (período efetivo da carteira).` : "Ainda sem mês com retorno comparável."}</p>
      <p className="text-sm/5 text-text-secondary">{selecionado.nome}: {insumos.cobertura ? `disponível até ${dataBr(insumos.cobertura.fim)}.` : "ainda sem cobertura."} Mês parcial não entra na comparação; qualquer mês indisponível torna as medidas do período N/D.</p>
      <dl className="grid gap-3 md:grid-cols-2">
        {[
          ["Rentabilidade da carteira", <VariacaoPercentual key="c" valor={medidas.carteira} />],
          [`Rentabilidade do ${selecionado.nome}`, <VariacaoPercentual key="b" valor={medidas.benchmark} />],
          ["Diferença", <PontosPercentuais key="d" valor={medidas.diferenca} />],
          [`% do ${selecionado.nome}`, <Percentual key="p" valor={medidas.percentual} />],
          ["Taxa de acerto", <Percentual key="a" valor={medidas.taxaDeAcerto} />],
        ].map(([titulo, valor], i) => <div key={i} className="rounded-md border border-border bg-surface p-4"><dt className="text-sm/5 text-text-secondary">{titulo}</dt><dd className="mt-2 text-2xl/8 font-semibold">{valor}</dd></div>)}
      </dl>
      <p className="text-sm/5 text-text-secondary">% do benchmark fica N/D quando seu retorno acumulado é zero ou negativo. Acerto conta só meses em que a carteira supera o benchmark; empate não conta.</p>
      <section className="rounded-md border border-border bg-surface p-4">
        <h2 className="mb-3 text-lg/7 font-semibold">Retornos mensais</h2>
        <div className="hidden md:block"><table className="w-full text-left"><thead><tr><th scope="col" className="p-2">Mês</th><th scope="col" className="p-2 text-right">Carteira</th><th scope="col" className="p-2 text-right">{selecionado.nome}</th></tr></thead>
          <tbody>{mesesDoPeriodo(periodo).map((mes) => <tr key={mes} className="border-t border-border"><th scope="row" className="p-2 font-normal">{mesBr(mes)}</th><td className="p-2 text-right"><VariacaoPercentual valor={carteira[mes] ?? ND} /></td><td className="p-2 text-right">{benchmark[mes] === "parcial" ? <span>Parcial — <NaoDisponivel /></span> : <VariacaoPercentual valor={benchmark[mes] ?? ND} />}</td></tr>)}</tbody>
        </table></div>
        <div className="flex flex-col gap-3 md:hidden">{mesesDoPeriodo(periodo).map((mes) => <section key={mes} className="rounded-md border border-border p-3">
          <h3 className="mb-2 font-semibold">{mesBr(mes)}</h3>
          <dl className="flex flex-col gap-2"><div className="flex justify-between gap-2"><dt>Carteira</dt><dd><VariacaoPercentual valor={carteira[mes] ?? ND} /></dd></div>
            <div className="flex justify-between gap-2"><dt>{selecionado.nome}</dt><dd>{benchmark[mes] === "parcial" ? <span>Parcial — <NaoDisponivel /></span> : <VariacaoPercentual valor={benchmark[mes] ?? ND} />}</dd></div>
          </dl>
        </section>)}</div>
      </section>
      {resultado.meses.length ? <GraficoLinha id="comparacao-base100" titulo="Base 100: carteira e benchmark" descricao="Cada série começa em 100 antes do período efetivo. Uma série com mês indisponível ou parcial não é desenhada."
        rotulosX={resultado.meses.map(mesCurto)}
        series={[
          { nome: "Carteira", valores: resultado.baseCarteira === ND ? resultado.meses.map(() => null) : resultado.baseCarteira, cor: "var(--color-chart-1)" },
          { nome: selecionado.nome, valores: resultado.baseBenchmark === ND ? resultado.meses.map(() => null) : resultado.baseBenchmark, cor: "var(--color-chart-2)", tracejada: true },
        ]} rotularY={indice} colunasTabela={["Mês", "Carteira", selecionado.nome]}
        linhasTabela={resultado.meses.map((mes, i) => ({ rotulo: mesBr(mes), valores: [valorBase(resultado.baseCarteira, i), valorBase(resultado.baseBenchmark, i)] }))} /> : null}
    </>;
  })().catch(() => <EstadoErro acao={<Link href="/benchmarks/comparacao" className={botaoSecundario}>Tentar novamente</Link>}>Não foi possível ler a carteira e o benchmark de forma coerente.</EstadoErro>);
  return <div className="flex flex-col gap-6"><h1 className="text-2xl/8 font-semibold">Comparação</h1>{conteudo}</div>;
}
