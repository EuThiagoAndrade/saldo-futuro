import Image from "next/image";
import { redirect } from "next/navigation";
import logo from "../../design-system/assets/logo-saldo-futuro.svg";
import { PreviewNotice } from "@/components/preview-notice";
import { backend } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

const roleLabel: Record<string, string> = { admin: "Administrador", user: "Usuário" };

export default async function Home() {
  if (!backend) return <PreviewNotice />;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/entrar");

  // A RLS devolve só o perfil do próprio usuário.
  const { data: profile } = await supabase.from("profiles").select("email, role").maybeSingle();

  return (
    <main className="mx-auto flex min-h-screen max-w-[1120px] flex-col justify-center gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <Image src={logo} alt="Saldo Futuro" priority className="h-12 w-auto self-start" />
      <h1 className="text-2xl/8 font-semibold text-text">Em construção</h1>
      <p className="max-w-prose text-base/6 text-text-secondary">
        O Saldo Futuro ainda não tem telas de produto. Esta página confirma o seu acesso.
      </p>
      {profile ? (
        <dl className="grid max-w-prose grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-md border border-border bg-surface p-4 text-base/6">
          <dt className="text-text-secondary">E-mail</dt>
          <dd className="text-text">{profile.email}</dd>
          <dt className="text-text-secondary">Perfil</dt>
          <dd className="text-text">{roleLabel[profile.role] ?? profile.role}</dd>
        </dl>
      ) : (
        <p role="status" className="text-base/6 text-text-secondary">
          Não foi possível carregar o seu perfil.
        </p>
      )}
      <form action="/sair" method="post">
        <button
          type="submit"
          className="min-h-11 rounded-md border border-border-strong bg-surface px-4 text-sm/5 font-medium text-primary"
        >
          Sair
        </button>
      </form>
    </main>
  );
}
