import type { Metadata } from "next";
import { linkTexto } from "@/components/links-legais";
import { lista, PaginaLegal, Secao } from "@/components/pagina-legal";

// Termos de uso (BL-012, ciclo 010). Página estática e pública; descreve o funcionamento atual
// do produto, sem aconselhamento financeiro. O contato é o autorizado pelo responsável para
// publicação (decisão Q8 do plano 010).

export const metadata: Metadata = {
  title: "Termos de uso — Saldo Futuro",
  description: "O que é o Saldo Futuro, quem pode usá-lo, as responsabilidades sobre os registros e as limitações do serviço.",
};

export default function TermosPage() {
  return (
    <PaginaLegal titulo="Termos de uso" atualizacao={{ iso: "2026-10-21", texto: "21 de outubro de 2026" }} documento="/termos">
      <p>
        Estes termos descrevem o que é o Saldo Futuro e as condições para usá-lo. Usar o aplicativo implica aceitar
        estes termos e a política de privacidade, cujo link está ao fim da página.
      </p>

      <Secao titulo="O que é o Saldo Futuro">
        <p>
          Um sistema web para registrar e acompanhar investimentos pessoais: ativos, lançamentos, transferências e
          fechamentos mensais, com patrimônio, rentabilidade e comparação com índices como CDI e IPCA.
        </p>
        <p>
          O Saldo Futuro não é uma instituição financeira. Ele não executa aplicações nem resgates, não se conecta a
          bancos ou corretoras e não faz recomendação de investimento. As informações exibidas não são
          aconselhamento financeiro.
        </p>
      </Secao>

      <Secao titulo="Acesso">
        <ul className={lista}>
          <li>O acesso é pessoal e restrito aos e-mails autorizados pelo administrador, com login pela conta Google.</li>
          <li>Não compartilhe a sua conta. O que for registrado nela fica associado a você.</li>
          <li>O administrador pode retirar autorizações e encerrar contas.</li>
        </ul>
      </Secao>

      <Secao titulo="Seus registros">
        <ul className={lista}>
          <li>
            Você é responsável pelos dados que registra. Saldos, patrimônio e rentabilidade são calculados a partir
            desses registros; confira-os com os extratos das instituições onde mantém seus investimentos.
          </li>
          <li>
            Os índices de referência vêm de séries públicas do Banco Central do Brasil e podem chegar com atraso ou
            ficar indisponíveis. Nesse caso, o aplicativo mostra &ldquo;N/D&rdquo; em vez de um valor estimado.
          </li>
          <li>O aplicativo não substitui os extratos e informes oficiais das instituições.</li>
        </ul>
      </Secao>

      <Secao titulo="Funcionamento e limitações">
        <p>
          O aplicativo é oferecido como está, sem garantia de disponibilidade contínua. Ele pode passar por
          manutenção, mudar de funcionalidades ou ficar fora do ar.
        </p>
      </Secao>

      <Secao titulo="Contato">
        <p>Dúvidas e pedidos sobre o Saldo Futuro vão para Thiago Andrade, responsável pelo aplicativo.</p>
        <p className="flex flex-wrap items-center gap-x-2">
          Contato:
          <a href="mailto:contato@euthiagoandrade.com.br" className={`inline-flex min-h-11 items-center ${linkTexto}`}>
            contato@euthiagoandrade.com.br
          </a>
        </p>
        <p>A data no início desta página indica a última atualização.</p>
      </Secao>
    </PaginaLegal>
  );
}
