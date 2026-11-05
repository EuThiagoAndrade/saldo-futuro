"use client";

import type { ReactNode } from "react";
import { classeCampo } from "@/components/campos";
import { ListaSuspensaFiltro } from "@/components/lista-suspensa";
import {
  COBERTURAS_FGC,
  type ColunaIndicador,
  INDICADORES_VISIVEIS,
  type OpcaoAtributo,
  REGIMES_TRIBUTARIOS,
  SITUACOES_PRAZO,
  UNIDADES_PRAZO,
} from "@/lib/telas/detalhes-ativo";
import { COMPARACOES, OPCAO_NAO_INFORMADO, type Parametros } from "@/lib/telas/filtros-ativos";
import type { OpcoesDoFiltro } from "@/lib/telas/seletor-ativo";

// Campos do "Filtrar" de ativos, compartilhados entre /ativos e os seletores de Novo lançamento e Transferências
// (ciclo 019, issue #191, BL-022; DESIGN.md 6.8 e 6.12). Dois modos, com as mesmas regras:
// - `url`: dentro do formulário GET de /ativos. Os campos têm `name`, partem do que veio na URL e são enviados
//   sem JavaScript; as opções vêm do servidor.
// - `formulario`: dentro de outro formulário (lançamento ou transferência). Os campos NÃO têm `name`, então nada
//   do filtro chega à ação do servidor; cada mudança é avisada a quem usa, que restringe a lista de ativos. Enter
//   no campo de dias não envia o formulário que o contém.

export type ModoDoFiltro =
  | { tipo: "url"; parametros: Parametros }
  | { tipo: "formulario"; aoMudar: (nome: string, valor: string | string[]) => void };

const valores = (p: Parametros, nome: string) => {
  const v = p[nome];
  return v === undefined ? [] : Array.isArray(v) ? v : [v];
};

/** Valor inicial de um select: o da URL quando é uma opção dele; senão, Todos. */
const inicial = (p: Parametros, nome: string, opcoes: readonly OpcaoAtributo[]) => {
  const [v] = valores(p, nome);
  return v !== undefined && opcoes.some((o) => o.codigo === v) ? v : "";
};

function Selecao({
  id,
  rotulo,
  nome,
  opcoes,
  modo,
  vazio = "Todos",
}: {
  id: string;
  rotulo: string;
  nome: string;
  opcoes: readonly OpcaoAtributo[];
  modo: ModoDoFiltro;
  vazio?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-sm/5 font-medium text-text">
        {rotulo}
      </label>
      <select
        id={id}
        name={modo.tipo === "url" ? nome : undefined}
        defaultValue={modo.tipo === "url" ? inicial(modo.parametros, nome, opcoes) : ""}
        onChange={modo.tipo === "formulario" ? (evento) => modo.aoMudar(nome, evento.currentTarget.value) : undefined}
        className={classeCampo}
      >
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
function GrupoFiltro({ titulo, nivel, children }: { titulo: string; nivel: 2 | 3; children: ReactNode }) {
  const Titulo = nivel === 2 ? "h2" : "h3";
  return (
    <section aria-label={titulo} className="grid gap-4 border-t border-border pt-4 first-of-type:border-t-0 first-of-type:pt-0 sm:grid-cols-2">
      <Titulo className="text-base/6 font-semibold text-text sm:col-span-2">{titulo}</Titulo>
      {children}
    </section>
  );
}

const SIM_NAO = [{ codigo: "sim", rotulo: "Sim" }, { codigo: "nao", rotulo: "Não" }, OPCAO_NAO_INFORMADO] as const;

/**
 * Os cinco grupos do filtro. `nivelDoTitulo` é o nível dos títulos dos grupos (2 em /ativos e em Novo lançamento,
 * 3 dentro da seção "Nova transferência"). `idBase` separa os ids quando há mais de um conjunto na página. No modo
 * `formulario`, só "Classe e instituição" fica à vista; os outros quatro grupos ficam recolhidos em "Mais filtros".
 */
export function CamposDoFiltro({
  modo,
  opcoes,
  idBase = "filtro",
  nivelDoTitulo = 2,
}: {
  modo: ModoDoFiltro;
  opcoes: OpcoesDoFiltro;
  idBase?: string;
  nivelDoTitulo?: 2 | 3;
}) {
  const p: Parametros = modo.tipo === "url" ? modo.parametros : {};
  const nome = (n: string) => (modo.tipo === "url" ? n : undefined);
  const lista = (id: string, legenda: string, n: string, opcoesDaLista: readonly OpcaoAtributo[], vazio: string) => (
    <ListaSuspensaFiltro
      id={`${idBase}-${id}`}
      legenda={legenda}
      nome={nome(n)}
      opcoes={opcoesDaLista}
      iniciais={valores(p, n)}
      aoMudar={modo.tipo === "formulario" ? (marcados) => modo.aoMudar(n, [...marcados]) : undefined}
      vazio={vazio}
    />
  );
  const indicador = (coluna: ColunaIndicador) => {
    const definicao = INDICADORES_VISIVEIS.find((i) => i.coluna === coluna)!;
    return <Selecao id={`${idBase}-${coluna}`} rotulo={definicao.rotulo} nome={coluna} opcoes={SIM_NAO} modo={modo} />;
  };

  const demais = (
    <>
      <GrupoFiltro titulo="Produto" nivel={nivelDoTitulo}>
        {lista("veiculo", "Veículo de acesso", "veiculo", opcoes.veiculo, "Todos")}
        {lista("indexador", "Indexador da remuneração", "indexador", opcoes.indexador, "Todos")}
      </GrupoFiltro>
      <GrupoFiltro titulo="Tributação" nivel={nivelDoTitulo}>
        <Selecao id={`${idBase}-regime`} rotulo="Regime tributário" nome="regime" opcoes={[...REGIMES_TRIBUTARIOS, OPCAO_NAO_INFORMADO]} modo={modo} />
        {indicador("isento_ir")}
      </GrupoFiltro>
      <GrupoFiltro titulo="Resgate" nivel={nivelDoTitulo}>
        <fieldset className="group/prazo grid min-w-0 gap-4 sm:col-span-2 sm:grid-cols-2">
          <legend className="sr-only">Prazo para resgate ou venda</legend>
          <Selecao id={`${idBase}-prazo`} rotulo="Prazo para resgate ou venda" nome="prazo_resgate_tipo" opcoes={[...SITUACOES_PRAZO, OPCAO_NAO_INFORMADO]} modo={modo} />
          {indicador("liquidez_imediata")}
          {/* Sem JavaScript: aparecem só com "Prazo em dias" escolhido; sem suporte a :has(), ficam sempre à vista. */}
          <div className="hidden gap-4 sm:col-span-2 sm:grid-cols-3 group-has-[option[value=prazo]:checked]/prazo:grid supports-[not_selector(:has(*))]:grid">
            <Selecao id={`${idBase}-prazo-comparacao`} rotulo="Comparação" nome="prazo_resgate_comparacao" opcoes={COMPARACOES} modo={modo} vazio="Escolha" />
            <div className="flex min-w-0 flex-col gap-1">
              <label htmlFor={`${idBase}-prazo-dias`} className="text-sm/5 font-medium text-text">
                Dias
              </label>
              <input
                id={`${idBase}-prazo-dias`}
                name={nome("prazo_resgate_dias")}
                inputMode="numeric"
                autoComplete="off"
                defaultValue={valores(p, "prazo_resgate_dias")[0] ?? ""}
                onChange={modo.tipo === "formulario" ? (evento) => modo.aoMudar("prazo_resgate_dias", evento.currentTarget.value) : undefined}
                // Dentro de outro formulário, Enter não pode enviá-lo.
                onKeyDown={modo.tipo === "formulario" ? (evento) => evento.key === "Enter" && evento.preventDefault() : undefined}
                className={classeCampo}
              />
            </div>
            <Selecao id={`${idBase}-prazo-unidade`} rotulo="Unidade" nome="prazo_resgate_unidade" opcoes={UNIDADES_PRAZO} modo={modo} vazio="Escolha" />
            <p className="text-sm/5 text-text-secondary sm:col-span-3">O número é comparado na unidade escolhida, sem converter dias úteis e corridos.</p>
          </div>
        </fieldset>
      </GrupoFiltro>
      <GrupoFiltro titulo="Proteção e exposição" nivel={nivelDoTitulo}>
        <Selecao id={`${idBase}-fgc`} rotulo="Cobertura do FGC" nome="fgc" opcoes={[...COBERTURAS_FGC, OPCAO_NAO_INFORMADO]} modo={modo} />
        {indicador("exposicao_cambial")}
      </GrupoFiltro>
    </>
  );

  return (
    <>
      <GrupoFiltro titulo="Classe e instituição" nivel={nivelDoTitulo}>
        {lista("classe", "Classe", "classe", opcoes.classe, "Todas")}
        {lista("instituicao", "Instituição", "instituicao", opcoes.instituicao, "Todas")}
      </GrupoFiltro>
      {modo.tipo === "url" ? (
        demais
      ) : (
        <details className="rounded-md border border-border">
          <summary className="flex min-h-11 cursor-pointer items-center px-3 text-sm/5 font-medium text-primary hover:bg-surface-subtle">Mais filtros</summary>
          <div className="flex flex-col gap-4 border-t border-border p-3">{demais}</div>
        </details>
      )}
    </>
  );
}
