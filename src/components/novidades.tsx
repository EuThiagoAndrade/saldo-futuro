import { dataExtensaBr } from "../lib/apresentacao/datas";
import { type Novidade, novidadesPublicadas } from "../lib/novidades";

// Histórico de novidades (BL-011, ciclo 010): só as versões já lançadas, da mais recente para a
// mais antiga. Sem data comprovada, a entrada mostra "Data de publicação em confirmação".

export function HistoricoNovidades({ versaoAtual, historico }: { versaoAtual: string; historico?: readonly Novidade[] }) {
  const entradas = novidadesPublicadas(versaoAtual, historico);
  if (entradas.length === 0) {
    return <p className="max-w-prose text-base/6 text-text-secondary">O histórico de novidades ainda não está disponível.</p>;
  }

  return (
    <ol className="flex max-w-prose flex-col gap-4">
      {entradas.map((novidade) => (
        <li key={novidade.versao}>
          <article className="flex flex-col gap-2 rounded-md border border-border bg-surface p-4">
            <h2 className="text-lg/6 font-semibold text-text">Versão {novidade.versao}</h2>
            <p className="text-sm/5 text-text-secondary">
              {novidade.publicadaEm ? (
                <>
                  Publicada em <time dateTime={novidade.publicadaEm}>{dataExtensaBr(novidade.publicadaEm)}</time>
                </>
              ) : (
                "Data de publicação em confirmação"
              )}
            </p>
            <ul className="flex list-disc flex-col gap-1 pl-6 text-base/6 text-text">
              {novidade.notas.map((nota) => (
                <li key={nota}>{nota}</li>
              ))}
            </ul>
          </article>
        </li>
      ))}
    </ol>
  );
}
