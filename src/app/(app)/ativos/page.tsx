import { Confirmacao } from "@/components/confirmacao";
import { EstadoVazio } from "@/components/estados";
import { FormNovoAtivo } from "@/components/formularios/novo-ativo";
import { PreviewNotice } from "@/components/preview-notice";
import { dataBr } from "@/lib/apresentacao/datas";
import { backend } from "@/lib/config";
import { hojeEmCuiaba } from "@/lib/financeiro/datas";
import { exigirSessao } from "@/lib/sessao";
import { type Ativo, lerAtivos } from "@/lib/telas/leituras";
import { desativarAtivo } from "./acoes";

export const metadata = { title: "Ativos — Saldo Futuro" };

const ROTULO_AJUSTE = { rendimento: "Rendimento", marcacao: "Marcação a mercado" } as const;

function tipoDoAtivo(ativo: Ativo): string {
  return ativo.sistema === "transito" ? "Ativo de sistema" : ROTULO_AJUSTE[ativo.tipo_ajuste ?? "rendimento"];
}

function nome(ativo: Ativo): string {
  return ativo.sistema === "transito" ? "Em trânsito" : ativo.nome;
}

function AcaoDoAtivo({ ativo }: { ativo: Ativo }) {
  if (ativo.sistema === "transito") {
    return <span className="text-sm/5 text-text-secondary">Só recebe transferências</span>;
  }
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

export default async function AtivosPage() {
  if (!backend) return <PreviewNotice />;
  const { supabase } = await exigirSessao();
  const ativos = await lerAtivos(supabase);
  const emUso = ativos.filter((a) => a.ativo).sort((a, b) => Number(!!a.sistema) - Number(!!b.sistema) || nome(a).localeCompare(nome(b), "pt-BR"));
  const desativados = ativos.filter((a) => !a.ativo);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl/8 font-semibold text-text">Ativos</h1>

      {emUso.length === 0 ? (
        <EstadoVazio titulo="Nenhum ativo ainda">Cadastre o primeiro ativo para começar a registrar lançamentos.</EstadoVazio>
      ) : (
        <section aria-labelledby="ativos-em-uso" className="flex flex-col gap-3">
          <h2 id="ativos-em-uso" className="text-lg/7 font-semibold text-text">
            Em uso
          </h2>
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
              {emUso.map((ativo) => (
                <tr key={ativo.id} className="border-b border-border last:border-0">
                  <td className="p-3 text-base/6">{nome(ativo)}</td>
                  <td className="p-3 text-base/6 text-text-secondary">{tipoDoAtivo(ativo)}</td>
                  <td className="p-3 text-right">
                    <AcaoDoAtivo ativo={ativo} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="flex flex-col gap-3 md:hidden">
            {emUso.map((ativo) => (
              <li key={ativo.id} className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
                <div>
                  <p className="truncate text-base/6 font-semibold">{nome(ativo)}</p>
                  <p className="text-sm/5 text-text-secondary">{tipoDoAtivo(ativo)}</p>
                </div>
                <AcaoDoAtivo ativo={ativo} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <FormNovoAtivo />

      {desativados.length > 0 ? (
        <section aria-labelledby="ativos-desativados" className="flex flex-col gap-3">
          <h2 id="ativos-desativados" className="text-lg/7 font-semibold text-text">
            Desativados
          </h2>
          <ul className="flex flex-col gap-2">
            {desativados.map((ativo) => (
              <li key={ativo.id} className="rounded-md border border-border bg-surface p-4 text-base/6">
                {ativo.nome}
                <span className="block text-sm/5 text-text-secondary">
                  Desativado em {ativo.desativado_em ? dataBr(hojeEmCuiaba(new Date(ativo.desativado_em))) : "data desconhecida"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
