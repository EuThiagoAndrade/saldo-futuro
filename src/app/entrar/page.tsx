import Image from "next/image";
import logo from "../../../design-system/assets/logo-saldo-futuro.svg";
import { LoginPanel } from "@/components/login-panel";
import { PreviewNotice } from "@/components/preview-notice";
import { backend, passwordLogin } from "@/lib/config";

export const metadata = { title: "Entrar — Saldo Futuro" };

export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  if (!backend) return <PreviewNotice />;
  const { erro } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-12">
      <Image src={logo} alt="Saldo Futuro" priority className="h-12 w-auto self-start" />
      <h1 className="text-2xl/8 font-semibold text-text">Entrar</h1>
      <LoginPanel initialError={erro !== undefined} passwordLogin={passwordLogin} />
    </main>
  );
}
