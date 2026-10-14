import Link from "next/link";
import { botaoSecundario } from "@/components/botoes";

export const metadata = { title: "Página não encontrada — Saldo Futuro" };

export default function NaoEncontrada() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[1120px] flex-col justify-center gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl/8 font-semibold text-text">Página não encontrada</h1>
      <p className="max-w-prose text-base/6 text-text-secondary">O endereço não existe ou não está disponível para você.</p>
      <Link href="/" className={`${botaoSecundario} self-start`}>
        Voltar ao início
      </Link>
    </main>
  );
}
