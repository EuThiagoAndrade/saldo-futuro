import Image from "next/image";
import logo from "../../../design-system/assets/logo-saldo-futuro.svg";
import { LinksLegais } from "@/components/links-legais";
import { LoginPanel } from "@/components/login-panel";
import { PreviewNotice } from "@/components/preview-notice";
import { backend, passwordLogin } from "@/lib/config";

export const metadata = {
  title: "Entrar — Saldo Futuro",
  description: "Saldo Futuro: gestão e acompanhamento de investimentos pessoais, com acesso restrito a e-mails autorizados.",
};

// Página inicial pública (BL-012, ciclo 010): descreve o produto e leva à política e aos termos,
// com e sem backend. Sem backend (previews), o login continua indisponível.
function Apresentacao() {
  return (
    <div className="flex max-w-prose flex-col gap-3 text-base/6 text-text-secondary">
      <p>
        O Saldo Futuro é um sistema web de gestão de investimentos pessoais. Nele você registra ativos,
        lançamentos e transferências, fecha cada mês e acompanha o patrimônio, a rentabilidade e a comparação com
        índices como CDI e IPCA.
      </p>
      <p>O acesso é restrito: só entram pessoas com e-mail autorizado pelo administrador.</p>
    </div>
  );
}

export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  if (!backend) {
    return (
      <PreviewNotice>
        <Apresentacao />
        <LinksLegais />
      </PreviewNotice>
    );
  }
  const { erro } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-12">
      <Image src={logo} alt="Saldo Futuro" priority className="h-12 w-auto self-start" />
      <h1 className="text-2xl/8 font-semibold text-text">Entrar</h1>
      <Apresentacao />
      <LoginPanel initialError={erro !== undefined} passwordLogin={passwordLogin} />
      <LinksLegais />
    </main>
  );
}
