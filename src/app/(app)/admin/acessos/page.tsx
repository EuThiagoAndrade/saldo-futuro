import { Confirmacao } from "@/components/confirmacao";
import { EstadoVazio } from "@/components/estados";
import { PreviewNotice } from "@/components/preview-notice";
import { backend } from "@/lib/config";
import { lerTudo } from "@/lib/leitura";
import { exigirAdmin, type Papel } from "@/lib/sessao";
import { removerEmail } from "./acoes";
import { FormAutorizarEmail } from "./formulario";

export const metadata = { title: "Acessos — Saldo Futuro" };

interface Acesso { email: string; role: Papel }
const PAPEIS = { user: "Usuário", admin: "Administrador" };

function Remover({ email }: { email: string }) {
  return (
    <Confirmacao gatilho="Remover da lista" titulo={`Remover ${email} da lista`}
      consequencia="Remover só impede um novo cadastro; não revoga uma conta existente, que continua com acesso."
      rotuloAcao="Remover e-mail" acao={removerEmail}>
      <input type="hidden" name="email" value={email} />
    </Confirmacao>
  );
}

export default async function AcessosPage() {
  if (!backend) return <PreviewNotice />;
  const { supabase } = await exigirAdmin();
  const acessos = await lerTudo<Acesso>((de, ate) => supabase.from("authorized_emails")
    .select("email, role", { count: "exact" }).order("email").range(de, ate));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl/8 font-semibold">Acessos</h1>
      <FormAutorizarEmail />
      <section aria-labelledby="lista-acessos" className="flex flex-col gap-3">
        <h2 id="lista-acessos" className="text-lg/7 font-semibold">E-mails autorizados</h2>
        <p className="text-base/6 text-text-secondary">
          Remover um e-mail da lista não revoga uma conta existente. Para revogar o acesso ou alterar o papel de uma conta, siga o procedimento administrativo.
        </p>
        {acessos.length === 0 ? <EstadoVazio titulo="Nenhum e-mail autorizado">Use o formulário acima para autorizar um novo cadastro.</EstadoVazio> : (
          <>
            <table className="hidden w-full table-fixed border-collapse bg-surface text-left md:table">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-border text-sm/5 text-text-secondary">
                  <th scope="col" className="w-1/2 p-3 font-medium">E-mail</th>
                  <th scope="col" className="p-3 font-medium">Papel inicial</th>
                  <th scope="col" className="p-3 font-medium"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {acessos.map((acesso) => <tr key={acesso.email} className="border-b border-border last:border-0">
                  <td className="wrap-anywhere p-3 text-base/6">{acesso.email}</td>
                  <td className="p-3 text-base/6 text-text-secondary">{PAPEIS[acesso.role]}</td>
                  <td className="p-3"><Remover email={acesso.email} /></td>
                </tr>)}
              </tbody>
            </table>
            <ul className="flex flex-col gap-3 md:hidden">
              {acessos.map((acesso) => <li key={acesso.email} className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
                <p className="wrap-anywhere text-base/6 font-semibold">{acesso.email}</p>
                <p className="text-sm/5 text-text-secondary">Papel inicial: {PAPEIS[acesso.role]}</p>
                <Remover email={acesso.email} />
              </li>)}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
