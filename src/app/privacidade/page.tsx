import type { Metadata } from "next";
import { linkTexto } from "@/components/links-legais";
import { lista, PaginaLegal, Secao } from "@/components/pagina-legal";

// Política de privacidade (BL-012, ciclo 010). Página estática e pública; os fatos descritos
// vêm do código (login, lista de acesso, carteira, cookies e serviços) e da KB-002. O contato é
// o autorizado pelo responsável para publicação (decisão Q8 do plano 010).

export const metadata: Metadata = {
  title: "Política de privacidade — Saldo Futuro",
  description: "Quais dados o Saldo Futuro trata, para quê, com quem e como pedir acesso, correção ou exclusão.",
};

export default function PrivacidadePage() {
  return (
    <PaginaLegal
      titulo="Política de privacidade"
      atualizacao={{ iso: "2026-10-21", texto: "21 de outubro de 2026" }}
      documento="/privacidade"
    >
      <p>
        O Saldo Futuro é um sistema web de gestão de investimentos pessoais, de acesso restrito a pessoas
        autorizadas. Esta política explica quais dados ele trata, para quê, com quais serviços e como falar com
        o responsável.
      </p>

      <Secao titulo="Responsável">
        <p>O Saldo Futuro é mantido por Thiago Andrade, responsável pelo tratamento dos dados descritos aqui.</p>
        <p className="flex flex-wrap items-center gap-x-2">
          Contato:
          <a href="mailto:contato@euthiagoandrade.com.br" className={`inline-flex min-h-11 items-center ${linkTexto}`}>
            contato@euthiagoandrade.com.br
          </a>
        </p>
      </Secao>

      <Secao titulo="Dados tratados">
        <ul className={lista}>
          <li>
            <strong className="font-semibold">Identificação pela conta Google.</strong> O login com Google pede
            somente a identificação básica: e-mail, nome, foto de perfil e o identificador da conta. O aplicativo
            não pede acesso a contatos, arquivos, e-mails ou outros dados da sua conta Google.
          </li>
          <li>
            <strong className="font-semibold">Lista de acesso e perfil.</strong> Os e-mails autorizados e o papel
            de cada um (administrador ou usuário), cadastrados pelo administrador. O seu perfil guarda o e-mail e
            esse papel.
          </li>
          <li>
            <strong className="font-semibold">Carteira que você registra.</strong> Nomes dos ativos, lançamentos
            (data, tipo e valor), transferências entre ativos, fechamentos mensais e os saldos calculados a partir
            deles. O aplicativo não se conecta a bancos nem a corretoras: tudo o que aparece foi registrado por
            você.
          </li>
          <li>
            <strong className="font-semibold">Cookies.</strong> Cookies de sessão do login, necessários para
            manter você conectado, e um cookie com a preferência &ldquo;Ocultar valores&rdquo;. O aplicativo não
            usa cookies de publicidade nem de análise de navegação.
          </li>
          <li>
            <strong className="font-semibold">Registros técnicos.</strong> Os serviços de hospedagem, de banco de
            dados e de autenticação podem registrar dados técnicos dos acessos, como endereço IP e horário, para
            operar e proteger o serviço.
          </li>
        </ul>
      </Secao>

      <Secao titulo="Para que os dados são usados">
        <ul className={lista}>
          <li>Identificar você e conferir se o seu e-mail está autorizado.</li>
          <li>
            Guardar e mostrar a sua carteira: saldos, patrimônio, rentabilidade e comparação com índices como CDI
            e IPCA.
          </li>
          <li>Manter a sua sessão e lembrar a preferência de ocultar valores.</li>
        </ul>
        <p>O Saldo Futuro não exibe publicidade e não usa os seus dados para recomendar investimentos.</p>
      </Secao>

      <Secao titulo="Quem tem acesso">
        <p>
          Pelo aplicativo, só você vê a sua carteira. O banco de dados aplica regras de isolamento por usuário que
          impedem uma conta de ler ou alterar os dados de outra. O administrador gerencia a lista de acesso, mas o
          aplicativo não lhe dá acesso às carteiras de outras pessoas.
        </p>
        <p>
          Quem administra a infraestrutura tem acesso técnico ao banco de dados, usado para operar e manter o
          serviço.
        </p>
      </Secao>

      <Secao titulo="Serviços usados">
        <ul className={lista}>
          <li>
            <strong className="font-semibold">Supabase:</strong> banco de dados e autenticação.
          </li>
          <li>
            <strong className="font-semibold">Vercel:</strong> hospedagem do aplicativo.
          </li>
          <li>
            <strong className="font-semibold">Google:</strong> login com a conta Google.
          </li>
        </ul>
        <p>
          Esses serviços tratam os dados necessários para operar o aplicativo, conforme as próprias políticas. O
          aplicativo também consulta, no Banco Central do Brasil, as séries públicas dos índices de referência;
          essas consultas não enviam dados seus.
        </p>
      </Secao>

      <Secao titulo="Segurança">
        <ul className={lista}>
          <li>A conexão com o aplicativo é criptografada (HTTPS).</li>
          <li>Só entra quem está na lista de acesso; um e-mail fora dela não cria conta.</li>
          <li>O botão &ldquo;Ocultar valores&rdquo; esconde as quantias na tela.</li>
        </ul>
        <p>Essas medidas reduzem riscos, mas nenhum sistema elimina todos eles.</p>
      </Secao>

      <Secao titulo="Guarda, acesso e exclusão">
        <p>
          Os dados ficam guardados enquanto a sua conta existir; o aplicativo não os apaga automaticamente. Você
          pode pedir pelo contato acima o acesso, a correção ou a exclusão dos seus dados. Excluir a conta remove
          também a carteira registrada nela.
        </p>
      </Secao>

      <Secao titulo="Alterações">
        <p>
          A data no início desta página indica a última atualização. Os termos de uso estão no link ao fim da
          página.
        </p>
      </Secao>
    </PaginaLegal>
  );
}
