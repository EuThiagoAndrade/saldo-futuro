import Image from "next/image";
import logo from "../../design-system/assets/logo-saldo-futuro.svg";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[1120px] flex-col justify-center gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <Image src={logo} alt="Saldo Futuro" priority className="h-12 w-auto self-start" />
      <h1 className="text-2xl/8 font-semibold text-text">Gestão de investimentos pessoais</h1>
      <p className="max-w-prose text-base/6 text-text-secondary">
        O Saldo Futuro registra lançamentos por ativo, fecha o mês, consolida a carteira e compara o
        retorno com benchmarks. A aplicação está em construção.
      </p>
    </main>
  );
}
