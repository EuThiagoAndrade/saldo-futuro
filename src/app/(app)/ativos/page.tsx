import Link from "next/link";
import { FiltrosDosAtivos, ResumoAtivo } from "@/components/ativos-consulta";
import { botaoPrincipal, botaoTexto } from "@/components/botoes";
import { Confirmacao } from "@/components/confirmacao";
import { EstadoVazio } from "@/components/estados";
import { PreviewNotice } from "@/components/preview-notice";
import { dataBr } from "@/lib/apresentacao/datas";
import { backend } from "@/lib/config";
import { hojeEmCuiaba } from "@/lib/financeiro/datas";
import { exigirSessao } from "@/lib/sessao";
import { INDEXADORES_REMUNERACAO, VEICULOS_ACESSO } from "@/lib/telas/detalhes-ativo";
import { camposComFiltro, enderecoDaAba, filtrarAtivos, lerFiltros, opcoesEmUso, type Parametros } from "@/lib/telas/filtros-ativos";
import { type Ativo, lerAtivos, lerClassesLegadas, lerInstituicoes, lerTaxonomia } from "@/lib/telas/leituras";
import { classeDoAtivo } from "@/lib/telas/taxonomia";
import { desativarAtivo } from "./acoes";

export const metadata = { title: "Ativos — Saldo Futuro" };

// Lista de ativos (BL-006, ciclo 010): Novo ativo no topo, cadastro em /ativos/novo e abas
// "Em uso" e "Desativados" lidas no servidor pela URL (?aba=desativados). As abas são links de
// navegação com aria-current, não o padrão "tab" do ARIA; só a lista selecionada é renderizada
// (DESIGN.md 6.12). Classe e instituição aparecem nas duas abas, e Editar abre os campos
// descritivos (ciclo 012, issue #128; DESIGN.md 6.7). A classe é o nome do nó da taxonomia global
// (ciclo 013, issue #138), ou "Sem classe (antes: X)" para quem só tem o legado. Desde o ciclo 017
// (issue #174), cada ativo comum tem "Ver detalhes" com os atributos complementares, e "Filtrar",
// abaixo das abas, filtra pela URL as mesmas linhas lidas; as abas preservam os filtros, e os
// contadores continuam com o total de cada situação.

type Aba = "em-uso" | "desativados";

const ROTULO_AJUSTE = { rendimento: "Rendimento", marcacao: "Marcação a mercado" } as const;

function tipoDoAtivo(ativo: Ativo): string {
  return ativo.sistema === "transito" ? "Ativo de sistema" : ROTULO_AJUSTE[ativo.tipo_ajuste ?? "rendimento"];
}

function nome(ativo: Ativo): string {
  return ativo.sistema === "transito" ? "Em trânsito" : ativo.nome;
}

function desativadoEm(ativo: Ativo): string {
  return ativo.desativado_em ? dataBr(hojeEmCuiaba(new Date(ativo.desativado_em))) : "data desconhecida";
}

function Desativar({ ativo }: { ativo: Ativo }) {
  return (
    <Confirmacao
      gatilho="Desativar"
      titulo={`Desativar ${ativo.nome}`}
      consequencia="O ativo deixa de receber lançamentos e sai das pendências do fechamento. O histórico continua."
      rotuloAcao="Desativar ativo"
      acao={desativarAtivo}
    >
      <input type="hidden" name="ativo" value={ativo.id} />
    </Confirmacao>
  );
}

const TRANSITO = "Só recebe transferências";

/** Nome da classe e da instituição de cada ativo; ausente é null. */
interface Detalhes {
  classe: (ativo: Ativo) => string | null;
  instituicao: (ativo: Ativo) => string | null;
}

function Editar({ ativo }: { ativo: Ativo }) {
  return (
    <Link href={`/ativos/${ativo.id}/editar`} className={botaoTexto} aria-label={`Editar ${ativo.nome}`}>
      Editar
    </Link>
  );
}

/** Classe e instituição informadas, separadas por " · " (no celular, ausente é omitido). */
function informados(ativo: Ativo, d: Detalhes): string[] {
  return [d.classe(ativo), d.instituicao(ativo)].filter((v): v is string => v !== null);
}

function LinkDaAba({ aba, atual, contagem, href, children }: { aba: Aba; atual: Aba; contagem: number; href: string; children: string }) {
  const selecionada = aba === atual;
  return (
    <Link
      href={href}
      aria-current={selecionada ? "page" : undefined}
      className={`-mb-px flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm/5 font-medium hover:bg-surface ${
        selecionada ? "border-primary text-primary" : "border-transparent text-text-secondary"
      }`}
    >
      {children}
      <span className="rounded-full bg-neutral-subtle px-2 py-0.5 text-xs/4 font-medium text-neutral">{contagem}</span>
    </Link>
  );
}

function SemResultado() {
  return (
    <EstadoVazio titulo="Nenhum ativo corresponde aos filtros">
      Mude as opções em Filtrar ou use Limpar filtros. Os filtros continuam aplicados nas duas abas.
    </EstadoVazio>
  );
}

function EmUso({ ativos, detalhes, filtrado }: { ativos: Ativo[]; detalhes: Detalhes; filtrado: boolean }) {
  if (ativos.length === 0 && filtrado) return <SemResultado />;
  if (ativos.length === 0) {
    return (
      <EstadoVazio titulo="Nenhum ativo em uso">
        Use Novo ativo, no topo da página, para cadastrar o primeiro e começar a registrar lançamentos.
      </EstadoVazio>
    );
  }
  return (
    <>
      <table className="hidden w-full border-collapse rounded-md bg-surface text-left md:table">
        <thead>
          <tr className="border-b border-border text-sm/5 text-text-secondary">
            <th scope="col" className="p-3 font-medium">
              Nome
            </th>
            <th scope="col" className="p-3 font-medium">
              Tipo de ajuste
            </th>
            <th scope="col" className="p-3 font-medium">
              Classe
            </th>
            <th scope="col" className="p-3 font-medium">
              Instituição
            </th>
            <th scope="col" className="p-3 font-medium">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {ativos.map((ativo) => (
            <tr key={ativo.id} className="border-b border-border align-top last:border-0">
              <td className="p-3 text-base/6 break-words">
                <p>{nome(ativo)}</p>
                {ativo.sistema === "transito" ? null : <ResumoAtivo ativo={ativo} />}
              </td>
              <td className="p-3 text-base/6 text-text-secondary">{tipoDoAtivo(ativo)}</td>
              <td className="p-3 text-base/6 break-words text-text-secondary">{detalhes.classe(ativo) ?? "—"}</td>
              <td className="p-3 text-base/6 break-words text-text-secondary">{detalhes.instituicao(ativo) ?? "—"}</td>
              <td className="p-3 text-right">
                {ativo.sistema === "transito" ? (
                  <span className="text-sm/5 text-text-secondary">{TRANSITO}</span>
                ) : (
                  <div className="flex items-start justify-end gap-2">
                    <Editar ativo={ativo} />
                    <Desativar ativo={ativo} />
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Lista densa no celular (DESIGN.md 6.7): nome completo com quebra, tipo, classe e instituição na segunda linha e ações de 44 px. */}
      <ul className="divide-y divide-border rounded-md border border-border bg-surface md:hidden">
        {ativos.map((ativo) => (
          <li key={ativo.id} className="flex items-start gap-3 px-4 py-2">
            <div className="min-w-0 flex-1 py-1">
              <p className="text-base/6 font-medium break-words text-text">{nome(ativo)}</p>
              <p className="text-sm/5 break-words text-text-secondary">
                {[tipoDoAtivo(ativo), ...informados(ativo, detalhes)].join(" · ")}
                {ativo.sistema === "transito" ? ` · ${TRANSITO}` : null}
              </p>
              {ativo.sistema === "transito" ? null : <ResumoAtivo ativo={ativo} />}
            </div>
            {ativo.sistema === "transito" ? null : (
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Editar ativo={ativo} />
                <Desativar ativo={ativo} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

function Desativados({ ativos, detalhes, filtrado }: { ativos: Ativo[]; detalhes: Detalhes; filtrado: boolean }) {
  if (ativos.length === 0 && filtrado) return <SemResultado />;
  if (ativos.length === 0) {
    return (
      <EstadoVazio titulo="Nenhum ativo desativado">
        Quando um ativo for desativado, ele aparece aqui com a data da desativação. O histórico dele continua.
      </EstadoVazio>
    );
  }
  return (
    <ul className="divide-y divide-border rounded-md border border-border bg-surface">
      {ativos.map((ativo) => (
        <li key={ativo.id} className="flex items-start gap-3 px-4 py-2">
          <div className="min-w-0 flex-1 py-1">
            <p className="text-base/6 break-words text-text">{ativo.nome}</p>
            <p className="text-sm/5 break-words text-text-secondary">
              {[...informados(ativo, detalhes), `Desativado em ${desativadoEm(ativo)}`].join(" · ")}
            </p>
            <ResumoAtivo ativo={ativo} />
          </div>
          <div className="shrink-0">
            <Editar ativo={ativo} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function AtivosPage({ searchParams }: { searchParams: Promise<Parametros> }) {
  if (!backend) return <PreviewNotice />;
  const { supabase } = await exigirSessao();
  const parametros = await searchParams;
  const aba: Aba = parametros.aba === "desativados" ? "desativados" : "em-uso";
  const lido = lerFiltros(parametros);
  const [ativos, taxonomia, legado, instituicoes] = await Promise.all([
    lerAtivos(supabase),
    lerTaxonomia(supabase),
    lerClassesLegadas(supabase),
    lerInstituicoes(supabase),
  ]);
  const classesLegadas = new Map(legado.map((c) => [c.id, c.nome]));
  const nomeDaInstituicao = new Map(instituicoes.map((i) => [i.id, i.nome]));
  const detalhes: Detalhes = {
    classe: (a) => classeDoAtivo(a, taxonomia, classesLegadas),
    instituicao: (a) => (a.instituicao_id ? (nomeDaInstituicao.get(a.instituicao_id) ?? null) : null),
  };
  const emUso = ativos.filter((a) => a.ativo).sort((a, b) => Number(!!a.sistema) - Number(!!b.sistema) || nome(a).localeCompare(nome(b), "pt-BR"));
  const desativados = ativos.filter((a) => !a.ativo);
  // Filtro e resumo usam as mesmas linhas; com filtro inválido, nenhuma lista é mostrada.
  const filtros = "filtros" in lido ? lido.filtros : null;
  const campos = filtros ? camposComFiltro(filtros) : 0;
  const daAba = aba === "em-uso" ? emUso : desativados;
  const visiveis = filtros ? filtrarAtivos(daAba, filtros) : [];
  // Opções do filtro (ciclo 018, D14): só as usadas por algum ativo comum, das duas abas, e as marcadas na URL.
  const comuns = ativos.filter((a) => a.sistema === null);
  const marcados = (nome: string) => [parametros[nome] ?? []].flat();
  const opcoesVeiculo = opcoesEmUso(VEICULOS_ACESSO, comuns.map((a) => a.veiculos_acesso), marcados("veiculo"));
  const opcoesIndexador = opcoesEmUso(INDEXADORES_REMUNERACAO, comuns.map((a) => a.indexadores_remuneracao), marcados("indexador"));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl/8 font-semibold text-text">Ativos</h1>
        <Link href="/ativos/novo" className={botaoPrincipal}>
          Novo ativo
        </Link>
      </div>

      <nav aria-label="Situação dos ativos">
        <ul className="flex border-b border-border">
          <li>
            <LinkDaAba aba="em-uso" atual={aba} contagem={emUso.length} href={enderecoDaAba("em-uso", parametros)}>
              Em uso
            </LinkDaAba>
          </li>
          <li>
            <LinkDaAba aba="desativados" atual={aba} contagem={desativados.length} href={enderecoDaAba("desativados", parametros)}>
              Desativados
            </LinkDaAba>
          </li>
        </ul>
      </nav>

      <FiltrosDosAtivos
        aba={aba}
        parametros={parametros}
        campos={campos}
        erro={"erro" in lido ? lido.erro : null}
        opcoesVeiculo={opcoesVeiculo}
        opcoesIndexador={opcoesIndexador}
      />

      <section id="ativos-da-aba" aria-label={aba === "em-uso" ? "Ativos em uso" : "Ativos desativados"} className="flex scroll-mt-4 flex-col gap-3">
        {/* Com filtro inválido, a mensagem fica no topo da lista, onde a âncora do envio leva (ciclo 018, P4). */}
        {"erro" in lido ? (
          <p role="alert" className="text-sm/5 break-words text-loss">
            Não foi possível aplicar os filtros: {lido.erro}
          </p>
        ) : aba === "em-uso" ? (
          <EmUso ativos={visiveis} detalhes={detalhes} filtrado={campos > 0} />
        ) : (
          <Desativados ativos={visiveis} detalhes={detalhes} filtrado={campos > 0} />
        )}
      </section>
    </div>
  );
}
