import Link from "next/link";
import { botaoPrincipal, botaoTexto } from "@/components/botoes";
import { Confirmacao } from "@/components/confirmacao";
import { EstadoVazio } from "@/components/estados";
import { PreviewNotice } from "@/components/preview-notice";
import { dataBr } from "@/lib/apresentacao/datas";
import { backend } from "@/lib/config";
import { hojeEmCuiaba } from "@/lib/financeiro/datas";
import { exigirSessao } from "@/lib/sessao";
import { type Ativo, lerAtivos } from "@/lib/telas/leituras";
import { desativarAtivo } from "./acoes";

export const metadata = { title: "Ativos — Saldo Futuro" };

// Lista de ativos (BL-006, ciclo 010): Novo ativo no topo, cadastro em /ativos/novo e abas
// "Em uso" e "Desativados" lidas no servidor pela URL (?aba=desativados). As abas são links de
// navegação com aria-current, não o padrão "tab" do ARIA; só a lista selecionada é renderizada
// (DESIGN.md 6.12).

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

function LinkDaAba({ aba, atual, contagem, children }: { aba: Aba; atual: Aba; contagem: number; children: string }) {
  const selecionada = aba === atual;
  return (
    <Link
      href={aba === "em-uso" ? "/ativos" : "/ativos?aba=desativados"}
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

function EmUso({ ativos }: { ativos: Ativo[] }) {
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
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {ativos.map((ativo) => (
            <tr key={ativo.id} className="border-b border-border last:border-0">
              <td className="p-3 text-base/6 break-words">{nome(ativo)}</td>
              <td className="p-3 text-base/6 text-text-secondary">{tipoDoAtivo(ativo)}</td>
              <td className="p-3 text-right">
                {ativo.sistema === "transito" ? <span className="text-sm/5 text-text-secondary">{TRANSITO}</span> : <Desativar ativo={ativo} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Lista densa no celular (DESIGN.md 6.7): nome completo com quebra, tipo na segunda linha e ação de 44 px. */}
      <ul className="divide-y divide-border rounded-md border border-border bg-surface md:hidden">
        {ativos.map((ativo) => (
          <li key={ativo.id} className="flex items-center gap-3 px-4 py-2">
            <div className="min-w-0 flex-1 py-1">
              <p className="text-base/6 font-medium break-words text-text">{nome(ativo)}</p>
              <p className="text-sm/5 text-text-secondary">
                {tipoDoAtivo(ativo)}
                {ativo.sistema === "transito" ? ` · ${TRANSITO}` : null}
              </p>
            </div>
            {ativo.sistema === "transito" ? null : (
              <div className="shrink-0">
                <Desativar ativo={ativo} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

function Desativados({ ativos }: { ativos: Ativo[] }) {
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
        <li key={ativo.id} className="px-4 py-3">
          <p className="text-base/6 break-words text-text">{ativo.nome}</p>
          <p className="text-sm/5 text-text-secondary">Desativado em {desativadoEm(ativo)}</p>
        </li>
      ))}
    </ul>
  );
}

export default async function AtivosPage({ searchParams }: { searchParams: Promise<{ aba?: string | string[] }> }) {
  if (!backend) return <PreviewNotice />;
  const { supabase } = await exigirSessao();
  const { aba: parametro } = await searchParams;
  const aba: Aba = parametro === "desativados" ? "desativados" : "em-uso";
  const ativos = await lerAtivos(supabase);
  const emUso = ativos.filter((a) => a.ativo).sort((a, b) => Number(!!a.sistema) - Number(!!b.sistema) || nome(a).localeCompare(nome(b), "pt-BR"));
  const desativados = ativos.filter((a) => !a.ativo);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl/8 font-semibold text-text">Ativos</h1>
        {/* Instituições e Classes (ciclo 012, issue #127) ficam ao lado de Novo ativo, sem mudar a navegação principal. */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/ativos/instituicoes" className={botaoTexto}>
            Instituições
          </Link>
          <Link href="/ativos/classes" className={botaoTexto}>
            Classes
          </Link>
          <Link href="/ativos/novo" className={botaoPrincipal}>
            Novo ativo
          </Link>
        </div>
      </div>

      <nav aria-label="Situação dos ativos">
        <ul className="flex border-b border-border">
          <li>
            <LinkDaAba aba="em-uso" atual={aba} contagem={emUso.length}>
              Em uso
            </LinkDaAba>
          </li>
          <li>
            <LinkDaAba aba="desativados" atual={aba} contagem={desativados.length}>
              Desativados
            </LinkDaAba>
          </li>
        </ul>
      </nav>

      <section id="ativos-da-aba" aria-label={aba === "em-uso" ? "Ativos em uso" : "Ativos desativados"} className="flex flex-col gap-3">
        {aba === "em-uso" ? <EmUso ativos={emUso} /> : <Desativados ativos={desativados} />}
      </section>
    </div>
  );
}
