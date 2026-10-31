import Link from "next/link";
import { botaoSecundario, botaoTexto } from "@/components/botoes";
import { classeCampo } from "@/components/campos";
import {
  AVISO_ATRIBUTOS,
  COBERTURAS_FGC,
  INDEXADORES_REMUNERACAO,
  INDICADORES,
  type OpcaoAtributo,
  REGIMES_TRIBUTARIOS,
  resumoDosAtributos,
  SITUACOES_PRAZO,
  UNIDADES_PRAZO,
  VEICULOS_ACESSO,
} from "@/lib/telas/detalhes-ativo";
import { COMPARACOES, enderecoDaAba, NAO_INFORMADO_FILTRO, type Parametros } from "@/lib/telas/filtros-ativos";
import type { Ativo } from "@/lib/telas/leituras";

// Consulta dos atributos complementares na página Ativos (ciclo 017, issue #174, P5 e P6): o resumo
// "Ver detalhes" de cada ativo e o painel "Filtrar", um formulário GET que não depende de
// JavaScript. Os dois usam as mesmas linhas já lidas pela página; nada aqui lê o banco.

/** Resumo recolhível dos atributos e indicadores de um ativo comum, abaixo das informações principais. */
export function ResumoAtivo({ ativo }: { ativo: Ativo }) {
  return (
    <details>
      <summary className="flex min-h-11 w-fit cursor-pointer items-center text-sm/5 font-medium text-primary hover:underline">
        Ver detalhes<span className="sr-only"> de {ativo.nome}</span>
      </summary>
      <div className="flex flex-col gap-2 pb-2">
        <p className="text-sm/5 text-text-secondary">{AVISO_ATRIBUTOS}</p>
        <dl className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-x-6">
          {resumoDosAtributos(ativo).map((item) => (
            <div key={item.rotulo} className="min-w-0">
              <dt className="text-xs/4 font-medium text-text-secondary">{item.rotulo}</dt>
              <dd className="text-sm/5 break-words text-text">{item.valor}</dd>
            </div>
          ))}
        </dl>
      </div>
    </details>
  );
}

const NAO_INFORMADO = { codigo: NAO_INFORMADO_FILTRO, rotulo: "Não informado" } as const;

const valores = (p: Parametros, nome: string) => {
  const v = p[nome];
  return v === undefined ? [] : Array.isArray(v) ? v : [v];
};

/** Valor inicial de um select: o da URL quando é uma opção dele; senão, Todos. */
const inicial = (p: Parametros, nome: string, opcoes: readonly OpcaoAtributo[]) => {
  const [v] = valores(p, nome);
  return v !== undefined && opcoes.some((o) => o.codigo === v) ? v : "";
};

function Selecao({ id, rotulo, nome, opcoes, p, vazio = "Todos" }: { id: string; rotulo: string; nome: string; opcoes: readonly OpcaoAtributo[]; p: Parametros; vazio?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-sm/5 font-medium text-text">
        {rotulo}
      </label>
      <select id={id} name={nome} defaultValue={inicial(p, nome, opcoes)} className={classeCampo}>
        <option value="">{vazio}</option>
        {opcoes.map((o) => (
          <option key={o.codigo} value={o.codigo}>
            {o.rotulo}
          </option>
        ))}
      </select>
    </div>
  );
}

function Caixas({ id, legenda, nome, opcoes, p }: { id: string; legenda: string; nome: string; opcoes: readonly OpcaoAtributo[]; p: Parametros }) {
  const marcados = valores(p, nome);
  return (
    <fieldset className="flex min-w-0 flex-col gap-1 sm:col-span-2">
      <legend className="mb-1 text-sm/5 font-medium text-text">{legenda}</legend>
      <div className="flex flex-wrap gap-x-5">
        {opcoes.map((o) => (
          <label key={o.codigo} className="flex min-h-11 items-center gap-2 text-base/6">
            <input type="checkbox" id={`${id}-${o.codigo}`} name={nome} value={o.codigo} defaultChecked={marcados.includes(o.codigo)} className="size-5" />
            {o.rotulo}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const SIM_NAO = [
  { codigo: "sim", rotulo: "Sim" },
  { codigo: "nao", rotulo: "Não" },
  NAO_INFORMADO,
] as const;

/**
 * Painel "Filtrar", abaixo das abas: fechado sem filtro e aberto com filtro aplicado ou erro. Os
 * filtros aplicados, o resultado e "Limpar filtros" ficam fora dele, visíveis com o painel fechado.
 */
export function FiltrosDosAtivos({
  aba,
  parametros,
  aplicados,
  erro,
  resultado,
}: {
  aba: "em-uso" | "desativados";
  parametros: Parametros;
  /** Filtros aplicados em texto; vazio sem filtro. */
  aplicados: string[];
  erro: string | null;
  /** Ativos que correspondem e total da aba, quando há filtro válido. */
  resultado: { correspondem: number; total: number } | null;
}) {
  const p = parametros;
  const ativos = aplicados.length > 0 || erro !== null;
  const limpar = enderecoDaAba(aba, {});
  return (
    <div className="flex flex-col gap-3">
      <details open={ativos} className="rounded-md border border-border bg-surface">
        <summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm/5 font-medium text-primary hover:bg-surface-subtle">
          Filtrar
        </summary>
        <form method="get" action="/ativos" className="grid gap-4 border-t border-border p-4 sm:grid-cols-2">
          {aba === "desativados" ? <input type="hidden" name="aba" value="desativados" /> : null}
          <p className="text-sm/5 text-text-secondary sm:col-span-2">
            Opções marcadas no mesmo campo valem com “ou”; campos diferentes, com “e”. Com qualquer filtro, o ativo Em trânsito fica de fora.
          </p>
          <Caixas id="filtro-veiculo" legenda="Veículo de acesso" nome="veiculo" opcoes={[...VEICULOS_ACESSO, NAO_INFORMADO]} p={p} />
          <Caixas id="filtro-indexador" legenda="Indexador da remuneração" nome="indexador" opcoes={[...INDEXADORES_REMUNERACAO, NAO_INFORMADO]} p={p} />
          <Selecao id="filtro-regime" rotulo="Regime tributário" nome="regime" opcoes={[...REGIMES_TRIBUTARIOS, NAO_INFORMADO]} p={p} />
          <Selecao id="filtro-fgc" rotulo="Cobertura do FGC" nome="fgc" opcoes={[...COBERTURAS_FGC, NAO_INFORMADO]} p={p} />
          <fieldset className="grid min-w-0 gap-4 sm:col-span-2 sm:grid-cols-2" aria-describedby="filtro-prazo-dica">
            <legend className="mb-1 text-sm/5 font-medium text-text">Prazo para resgate ou venda</legend>
            <p id="filtro-prazo-dica" className="text-sm/5 text-text-secondary sm:col-span-2">
              Comparação, dias e unidade só valem com Prazo em dias. O número é comparado na unidade escolhida, sem converter dias úteis e corridos.
            </p>
            <Selecao id="filtro-prazo" rotulo="Situação" nome="prazo_resgate_tipo" opcoes={[...SITUACOES_PRAZO, NAO_INFORMADO]} p={p} />
            <Selecao id="filtro-prazo-comparacao" rotulo="Comparação" nome="prazo_resgate_comparacao" opcoes={COMPARACOES} p={p} vazio="Escolha" />
            <div className="flex min-w-0 flex-col gap-1">
              <label htmlFor="filtro-prazo-dias" className="text-sm/5 font-medium text-text">
                Dias
              </label>
              <input
                id="filtro-prazo-dias"
                name="prazo_resgate_dias"
                inputMode="numeric"
                autoComplete="off"
                defaultValue={valores(p, "prazo_resgate_dias")[0] ?? ""}
                className={classeCampo}
              />
            </div>
            <Selecao id="filtro-prazo-unidade" rotulo="Unidade" nome="prazo_resgate_unidade" opcoes={UNIDADES_PRAZO} p={p} vazio="Escolha" />
          </fieldset>
          {INDICADORES.map((i) => (
            <Selecao key={i.coluna} id={`filtro-${i.coluna}`} rotulo={i.rotulo} nome={i.coluna} opcoes={SIM_NAO} p={p} />
          ))}
          <button type="submit" className={`${botaoSecundario} sm:col-span-2 sm:justify-self-end`}>
            Aplicar filtros
          </button>
        </form>
      </details>
      {ativos ? (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          {erro !== null ? (
            <p role="alert" className="min-w-0 text-sm/5 break-words text-loss">
              Não foi possível aplicar os filtros: {erro}
            </p>
          ) : (
            <p role="status" className="min-w-0 text-sm/5 break-words text-text-secondary">
              {aplicados.join(" · ")}. {resultado ? `${resultado.correspondem} de ${resultado.total} nesta aba.` : null}
            </p>
          )}
          <Link href={limpar} className={`${botaoTexto} -mr-4`}>
            Limpar filtros
          </Link>
        </div>
      ) : null}
    </div>
  );
}
