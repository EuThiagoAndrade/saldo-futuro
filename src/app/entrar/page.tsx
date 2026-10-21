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

// Entrada do app: logo e login centralizados, com os links da política e dos termos (BL-012,
// ciclo 010), também no preview sem backend, onde o login continua indisponível. A descrição do
// produto para o Google fica em /termos, a página inicial informada no console (KB-002, O3).
export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  if (!backend) {
    return (
      <PreviewNotice>
        <LinksLegais />
      </PreviewNotice>
    );
  }
  const { erro } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-12">
      <h1 className="sr-only">Entrar</h1>
      <Image src={logo} alt="Saldo Futuro" priority className="h-12 w-auto self-center" />
      <LoginPanel initialError={erro !== undefined} passwordLogin={passwordLogin} />
      <LinksLegais centralizado />
    </main>
  );
}
