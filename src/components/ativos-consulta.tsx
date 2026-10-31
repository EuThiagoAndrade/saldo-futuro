import Link from "next/link";
import type { ReactNode } from "react";
import { botaoSecundario, botaoTexto } from "@/components/botoes";
import { classeCampo } from "@/components/campos";
import { ListaSuspensaFiltro } from "@/components/lista-suspensa";
import {
  COBERTURAS_FGC,
  type ColunaIndicador,
  INDICADORES_VISIVEIS,
  type OpcaoAtributo,
  REGIMES_TRIBUTARIOS,
  resumoDosAtributos,
  SITUACOES_PRAZO,
  UNIDADES_PRAZO,
} from "@/lib/telas/detalhes-ativo";
import { COMPARACOES, enderecoDaAba, OPCAO_NAO_INFORMADO, type Parametros } from "@/lib/telas/filtros-ativos";
import type { Ativo } from "@/lib/telas/leituras";

// Consulta dos atributos complementares na página Ativos (ciclo 017, issue #174, P5 e P6): o resumo
// "Ver detalhes" de cada ativo e o painel "Filtrar", um formulário GET que não depende de
// JavaScript. Os dois usam as mesmas linhas já lidas pela página; nada aqui lê o banco.

/** Resumo recolhível dos atributos e indicadores de um ativo comum, nos quatro grupos (ciclo 018, D13), sem a frase de aviso (D17). */
export function ResumoAtivo({ ativo }: { ativo: Ativo }) {
  return (
    <details>
      <summary className="flex min-h-11 w-fit cursor-pointer items-center text-sm/5 font-medium text-primary hover:underline">
        Ver detalhes<span className="sr-only"> de {ativo.nome}</span>
      </summary>
      <div className="flex flex-col gap-3 pb-2 md:grid md:grid-cols-2 md:gap-x-6">
        {resumoDosAtributos(ativo).map((grupo) => (
          <div key={grupo.titulo} className="flex min-w-0 flex-col gap-1">
            <p className="text-sm/5 font-medium text-text">{grupo.titulo}</p>
            <dl className="flex flex-col gap-1">
              {grupo.itens.map((item) => (
                <div key={item.rotulo} className="min-w-0">
                  <dt className="text-xs/4 font-medium text-text-secondary">{item.rotulo}</dt>
                  <dd className="text-sm/5 break-words text-text">{item.valor}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </details>
  );
}

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

/** Grupo do painel com título (ciclo 018, D13), na mesma ordem do formulário do ativo. */
function GrupoFiltro({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section aria-label={titulo} className="grid gap-4 border-t border-border pt-4 first:border-t-0 first:pt-0 sm:grid-cols-2">
      <h2 className="text-base/6 font-semibold text-text sm:col-span-2">{titulo}</h2>
      {children}
    </section>
  );
}

const SIM_NAO = [{ codigo: "sim", rotulo: "Sim" }, { codigo: "nao", rotulo: "Não" }, OPCAO_NAO_INFORMADO] as const;

const indicador = (coluna: ColunaIndicador, p: Parametros) => {
  const definicao = INDICADORES_VISIVEIS.find((i) => i.coluna === coluna)!;
  return <Selecao id={`filtro-${coluna}`} rotulo={definicao.rotulo} nome={coluna} opcoes={SIM_NAO} p={p} />;
};

/**
 * Painel "Filtrar", abaixo das abas (ciclo 017, issue #174; reorganizado no ciclo 018, issue #183):
 * quatro grupos com título; veículo e indexador em listas suspensas só com as opções em uso. Fica
 * fechado depois de aplicar e só abre sozinho com erro, para a página mostrar a lista (o envio vai à
 * âncora dela). O resumo mostra quantos campos têm filtro, e "Limpar filtros" fica ao lado, visível
 * com o painel fechado. Comparação, dias e unidade só aparecem com "Prazo em dias", por CSS.
 */
export function FiltrosDosAtivos({
  aba,
  parametros,
  campos,
  erro,
  opcoesVeiculo,
  opcoesIndexador,
}: {
  aba: "em-uso" | "desativados";
  parametros: Parametros;
  /** Campos com filtro aplicado (o contador). */
  campos: number;
  erro: string | null;
  opcoesVeiculo: readonly OpcaoAtributo[];
  opcoesIndexador: readonly OpcaoAtributo[];
}) {
  const p = parametros;
  return (
    <div className="flex items-start gap-2">
      <details open={erro !== null} className="min-w-0 flex-1 rounded-md border border-border bg-surface">
        <summary className="flex min-h-11 cursor-pointer items-center gap-2 px-4 text-sm/5 font-medium text-primary hover:bg-surface-subtle">
          Filtrar
          {campos > 0 ? (
            <>
              <span aria-hidden="true" className="rounded-full bg-primary-subtle px-2 py-0.5 text-xs/4 font-medium text-primary">
                {campos}
              </span>
              <span className="sr-only">({campos === 1 ? "1 campo com filtro" : `${campos} campos com filtro`})</span>
            </>
          ) : null}
        </summary>
        <form method="get" action="/ativos#ativos-da-aba" className="flex flex-col gap-4 border-t border-border p-4">
          {aba === "desativados" ? <input type="hidden" name="aba" value="desativados" /> : null}
          <p className="text-sm/5 text-text-secondary">
            Opções marcadas no mesmo campo valem com “ou”; campos diferentes, com “e”. Com qualquer filtro, o ativo Em trânsito fica de fora.
          </p>
          <GrupoFiltro titulo="Produto">
            <ListaSuspensaFiltro id="filtro-veiculo" legenda="Veículo de acesso" nome="veiculo" opcoes={opcoesVeiculo} iniciais={valores(p, "veiculo")} vazio="Todos" />
            <ListaSuspensaFiltro
              id="filtro-indexador"
              legenda="Indexador da remuneração"
              nome="indexador"
              opcoes={opcoesIndexador}
              iniciais={valores(p, "indexador")}
              vazio="Todos"
            />
          </GrupoFiltro>
          <GrupoFiltro titulo="Tributação">
            <Selecao id="filtro-regime" rotulo="Regime tributário" nome="regime" opcoes={[...REGIMES_TRIBUTARIOS, OPCAO_NAO_INFORMADO]} p={p} />
            {indicador("isento_ir", p)}
          </GrupoFiltro>
          <GrupoFiltro titulo="Resgate">
            <fieldset className="group/prazo grid min-w-0 gap-4 sm:col-span-2 sm:grid-cols-2">
              <legend className="sr-only">Prazo para resgate ou venda</legend>
              <Selecao id="filtro-prazo" rotulo="Prazo para resgate ou venda" nome="prazo_resgate_tipo" opcoes={[...SITUACOES_PRAZO, OPCAO_NAO_INFORMADO]} p={p} />
              {indicador("liquidez_imediata", p)}
              {/* Sem JavaScript: aparecem só com "Prazo em dias" escolhido; sem suporte a :has(), ficam sempre à vista. */}
              <div className="hidden gap-4 sm:col-span-2 sm:grid-cols-3 group-has-[option[value=prazo]:checked]/prazo:grid supports-[not_selector(:has(*))]:grid">
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
                <p className="text-sm/5 text-text-secondary sm:col-span-3">
                  O número é comparado na unidade escolhida, sem converter dias úteis e corridos.
                </p>
              </div>
            </fieldset>
          </GrupoFiltro>
          <GrupoFiltro titulo="Proteção e exposição">
            <Selecao id="filtro-fgc" rotulo="Cobertura do FGC" nome="fgc" opcoes={[...COBERTURAS_FGC, OPCAO_NAO_INFORMADO]} p={p} />
            {indicador("exposicao_cambial", p)}
          </GrupoFiltro>
          <button type="submit" className={`${botaoSecundario} sm:self-end`}>
            Aplicar filtros
          </button>
        </form>
      </details>
      {campos > 0 || erro !== null ? (
        <Link href={enderecoDaAba(aba, {})} className={`${botaoTexto} shrink-0`}>
          Limpar filtros
        </Link>
      ) : null}
    </div>
  );
}
