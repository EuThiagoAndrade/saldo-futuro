import { botaoSecundario } from "@/components/botoes";
import { LinksLegais } from "@/components/links-legais";
import { PreviewNotice } from "@/components/preview-notice";
import { backend } from "@/lib/config";
import { exigirSessao } from "@/lib/sessao";

export const metadata = { title: "Conta — Saldo Futuro" };

const ROTULO_PAPEL = { admin: "Administrador", user: "Usuário" } as const;

export default async function ContaPage() {
  if (!backend) return <PreviewNotice />;
  const sessao = await exigirSessao();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl/8 font-semibold text-text">Conta</h1>
      <dl className="grid max-w-prose grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-md border border-border bg-surface p-4 text-base/6">
        <dt className="text-text-secondary">E-mail</dt>
        <dd className="break-all text-text">{sessao.email}</dd>
        <dt className="text-text-secondary">Perfil</dt>
        <dd className="text-text">{ROTULO_PAPEL[sessao.papel]}</dd>
      </dl>
      <LinksLegais />
      <form action="/sair" method="post">
        <button type="submit" className={botaoSecundario}>
          Sair
        </button>
      </form>
    </div>
  );
}
