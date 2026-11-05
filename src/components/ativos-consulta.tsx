import Link from "next/link";
import { botaoSecundario, botaoTexto } from "@/components/botoes";
import { CamposDoFiltro } from "@/components/campos-do-filtro";
import { resumoDosAtributos } from "@/lib/telas/detalhes-ativo";
import { consultaDosFiltros, enderecoDaAba, type Parametros } from "@/lib/telas/filtros-ativos";
import type { Ativo } from "@/lib/telas/leituras";
import type { OpcoesDoFiltro } from "@/lib/telas/seletor-ativo";

// Consulta dos atributos complementares na página Ativos (ciclo 017, issue #174, P5 e P6): o resumo
// "Ver detalhes" de cada ativo e o painel "Filtrar", um formulário GET que não depende de
// JavaScript. Os dois usam as mesmas linhas já lidas pela página; nada aqui lê o banco. Os campos do
// painel são os de `CamposDoFiltro`, compartilhados com os seletores de ativo (ciclo 019, issue #191).

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

/**
 * Painel "Filtrar", abaixo das abas (ciclo 017, issue #174; reorganizado no ciclo 018, issue #183):
 * cinco grupos com título, o primeiro com classe e instituição (ciclo 019, issue #190); classe,
 * instituição, veículo e indexador em listas suspensas só com as opções em uso. Fica
 * fechado depois de aplicar e só abre sozinho com erro, para a página mostrar a lista (o envio vai à
 * âncora dela). O resumo mostra quantos campos têm filtro, e "Limpar filtros" fica ao lado, visível
 * com o painel fechado. Comparação, dias e unidade só aparecem com "Prazo em dias", por CSS.
 *
 * "Limpar filtros", voltar e avançar trocam a página sem recarregá-la: o painel é recriado sempre que
 * os filtros da URL mudam, para nunca mostrar escolhas que não estão valendo.
 */
export function FiltrosDosAtivos({
  aba,
  parametros,
  campos,
  erro,
  opcoes,
}: {
  aba: "em-uso" | "desativados";
  parametros: Parametros;
  /** Campos com filtro aplicado (o contador). */
  campos: number;
  erro: string | null;
  opcoes: OpcoesDoFiltro;
}) {
  const p = parametros;
  return (
    <div key={consultaDosFiltros(p).toString()} className="flex items-start gap-2">
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
            Opções marcadas no mesmo campo valem com “ou”; campos diferentes, com “e”. Marcar uma classe inclui as subclasses. Com qualquer filtro, o ativo Em trânsito fica de fora.
          </p>
          <CamposDoFiltro modo={{ tipo: "url", parametros: p }} opcoes={opcoes} />
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
