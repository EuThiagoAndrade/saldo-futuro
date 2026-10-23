---
title: "Operação de produção e de acessos"
tags:
  - operação
  - produção
  - acesso
author: "Thiago Andrade e Claude"
module: "Operação"
last_updated: "2026-10-22"
origin_cycle: "001"
---

# KB-002: Operação de produção e de acessos

## Finalidade

Roteiro verificável para levar o Saldo Futuro a `investimentos.euthiagoandrade.com.br` e para operar a lista de acessos depois disso. É consultada no Gate H-C do ciclo `001` (configuração externa feita pelo responsável), na verificação em produção (Gate V-C) sempre que for preciso autorizar, promover ou revogar um acesso, no ciclo `006`, na migração dos dados e na virada e, no ciclo `010`, na publicação da tela de consentimento do Google (O1 a O6).

## Limite de autoridade

Conhecimento de referência: não autoriza mudança, não substitui o plano `001`, a ADR-002 nem a ADR-003. O agente **não** executa os passos deste roteiro: não faz login, não aceita termos, não cria contas e não manipula credenciais. Ele orienta e confere por leitura o que estiver acessível. Esta base não contém segredo, chave, e-mail real nem identificador de projeto; onde um valor aparece entre `<...>`, o responsável o preenche no momento, no próprio painel, e não o registra no repositório, em issues, em PRs nem em tasks.

Os rótulos dos painéis mudam com o tempo. Cada passo cita o nome da função ou da configuração; localize-a pelo nome.

## Conteúdo

### Visão geral e ordem

| Peça | Onde roda | Papel |
| :-- | :-- | :-- |
| Aplicação Next.js | Vercel, plano Hobby | Interface, login e rota `/api/keepalive` |
| Banco e Auth | Supabase, plano gratuito, projeto novo e exclusivo | Lista de e-mails autorizados, perfis, RLS e hook de cadastro |
| Login | Google OAuth, por meio do Supabase Auth | Único método em produção |
| DNS | Cloudflare | Registro `CNAME` do subdomínio |

Ordem das ações do Gate H-C, que respeita as dependências entre elas:

1. GitHub: conferir a permissão do Actions (passo G1).
2. Supabase: conferir a vaga e criar o projeto (S1 a S3).
3. Supabase CLI: vincular e fazer o `db push`, a partir da `main` atualizada (S4 e S5).
4. Supabase: inserir o primeiro administrador na lista, antes do primeiro login (S6).
5. Google Cloud: criar o cliente OAuth, que precisa da URL de retorno do projeto Supabase (GC1 a GC3).
6. Supabase: habilitar o Google, desabilitar a senha, configurar URLs e o hook (S7 a S10).
7. Vercel: importar o repositório e fazer o primeiro deploy sem variáveis, definir as variáveis só em Production, refazer o deploy e adicionar o domínio (V1 a V4).
8. Cloudflare: criar o `CNAME` (C1).
9. Verificar o Security Advisor (S11) e conferir o login (V5).

Concluída a configuração, o agente registra as evidências do Gate V-C. Cada migração nova que entrar na `main` depois disso vai para produção por um `db push` do responsável (S12).

### Armadilhas, em ordem de gravidade

1. **Cadastro desligado em geral.** Em Authentication, desabilite só o provedor de e-mail (senha). **Mantenha habilitada** a opção geral de cadastro de novos usuários (`Allow new users to sign up`). Desligá-la recusaria também o primeiro login com Google, porque ele cria o usuário. A restrição aos e-mails autorizados vem do hook e do gatilho, não dessa opção.
2. **Primeiro administrador depois do primeiro login.** O primeiro `admin` precisa estar na lista **antes** do primeiro login dele; do contrário o hook recusa o cadastro. Se o login for tentado antes, o hook recusa e nada é criado; insira o e-mail e tente de novo.
3. **Variáveis `NEXT_PUBLIC_*` são lidas no build.** Defina-as na Vercel antes do primeiro deploy de produção; se forem criadas ou alteradas depois, faça um novo deploy.
4. **`NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN` nunca vai para a Vercel.** O formulário de senha existe só no ambiente local e no CI. Em produção, o provedor de senha desabilitado no Supabase mantém o bloqueio mesmo se a variável vazar.
5. **A chave secreta do Supabase nunca vai para a Vercel nem para o GitHub.** A aplicação usa só a chave publicável.
6. **Cloudflare sem proxy.** O registro do subdomínio fica em "somente DNS" (nuvem cinza), para a Vercel emitir o certificado.
7. **Tela de consentimento do Google: Audience, Branding e a exceção de identidade básica.** No ciclo `001` (2026-10-13), o Google recusou publicar a tela externa porque o produto não tinha página inicial nem política de privacidade públicas, e a tela ficou com o público (Audience) em **Testando**. Daí veio a regra de cadastrar cada pessoa autorizada na lista (P2) também como usuário de teste (GC4), até 100. Essa regra foi premissa: nenhuma conta fora da lista de teste chegou a ser tentada. Três coisas são diferentes e não devem ser confundidas:
   - **Audience** (status de publicação): em Testando, o Google limita o acesso aos usuários de teste e faz as autorizações expirarem em 7 dias; em produção, qualquer conta Google pode autorizar o app, e a lista do app continua sendo a barreira (hook e gatilho).
   - **Exceção de identidade básica:** pela documentação do Google (consultada em 2026-10-21), um app que pede só nome, e-mail e perfil (`openid`, `userinfo.email`, `userinfo.profile`, ou Sign in with Google) não exige que a conta esteja na lista de teste e não tem a expiração de 7 dias. O código do app não pede escopos além desses (`signInWithOAuth` sem `scopes`), mas os escopos configurados e os efetivamente pedidos pelo Supabase em produção não foram conferidos; a exceção só vale se nada além do básico for pedido.
   - **Branding** (verificação da marca): nome e logo do app na tela de consentimento, com página inicial, política de privacidade e domínios autorizados verificados. É opcional para o objetivo do ciclo `010`, que é publicar a Audience.

   Desde o ciclo `010`, `/privacidade` e `/termos` são páginas públicas no domínio do app, linkadas em `/entrar` e em Conta. `/entrar` continua sendo a entrada do app, só com logo e login; a página inicial informada ao Google é `/termos`, que identifica o app, descreve a funcionalidade e leva à política (decisão do responsável de 2026-10-21). A publicação e a prova de que contas fora da lista de teste entram seguem o roteiro O1 a O6. O login é mantido pelo Supabase; com a Audience em Testando, confira no Gate V-C, depois de 8 dias ou mais, que o login continua funcionando.
8. **`db push` sempre a partir da `main` atualizada.** Rode `git checkout main` e `git pull` antes de `npx supabase db push`, para enviar exatamente as migrações já integradas. Desde o merge da PR C a `main` tem duas migrações (acesso e keepalive), e um único `db push` as aplica; sem a função `public.keepalive()` no banco, `/api/keepalive` responderia `500`.
9. **Não instale integrações do Supabase.** Em particular, a integração **Cron** (`pg_cron`) não é usada: o cron do projeto é o da Vercel.

### GitHub

| Passo | Quem | Onde | Evidência |
| :-- | :-- | :-- | :-- |
| G1. Conferir que `Allow GitHub Actions to create and approve pull requests` está habilitada | Responsável | Settings, Actions, General, Workflow permissions | Marcar o item no checklist da task; o agente confere por leitura (`gh api repos/<dono>/<repositório>/actions/permissions/workflow`, campo `can_approve_pull_request_reviews`) |

### Supabase

| Passo | Quem | Onde | Evidência |
| :-- | :-- | :-- | :-- |
| S1. Conferir a vaga no plano gratuito (limite de 2 projetos ativos) | Responsável | Painel da organização que vai hospedar o projeto | Item marcado; se não houver vaga, o responsável decide (pausar outro projeto ou usar outra organização) e a cadeia para |
| S2. Criar o projeto novo e exclusivo, região `sa-east-1` (América do Sul, São Paulo), PostgreSQL 17, igual ao local | Responsável | Painel, novo projeto | Item marcado. A senha do banco vai para o gerenciador de senhas, nunca para o repositório |
| S3. Anotar a URL do projeto (`https://<project-id>.supabase.co`, a partir do **Project ID**, campo "Reference used in APIs and URLs", em Project Settings, General) e a chave publicável (`sb_publishable_...`), para a Vercel; **não** copiar a chave secreta (`sb_secret_...`) nem as chaves legacy | Responsável | Project Settings, General e API Keys | Item marcado |
| S4. Entrar no CLI e vincular o projeto | Responsável | Terminal, na raiz do repositório: `npx supabase login` e `npx supabase link --project-ref <project-id>` | Item marcado. A credencial do CLI é pessoal e não é registrada |
| S5. `db push`, a partir da `main` atualizada | Responsável | `npx supabase db push` e `npx supabase migration list` | `migration list` com as duas migrações (acesso e keepalive) nas colunas local e remota, descrito em texto (sem identificadores) |
| S6. Inserir o primeiro administrador na lista | Responsável | Editor SQL do painel, depois do S5 e antes do primeiro login (procedimento P1) | Item marcado; o e-mail **não** é registrado |
| S7. Habilitar o provedor Google com o ID e o segredo do cliente criado no Google Cloud | Responsável | Authentication, Providers, Google | Item marcado |
| S8. Desabilitar o provedor de e-mail (senha) e manter o cadastro geral habilitado | Responsável | Authentication, Providers, Email; e a opção `Allow new users to sign up` | Item marcado; conferido de novo no Gate V-C |
| S9. Site URL `https://investimentos.euthiagoandrade.com.br` e Redirect URL `https://investimentos.euthiagoandrade.com.br/auth/callback`, **sem** `localhost` (o projeto é só de produção; o desenvolvimento usa o Supabase local) | Responsável | Authentication, URL Configuration | Item marcado |
| S10. Hook "Before User Created" apontando para a função `before_user_created` do schema `private` | Responsável | Authentication, Hooks; depende do S5, porque a função nasce na migração | Item marcado. Se o painel não permitir o schema `private`, o desvio (função em `public`, com `execute` revogado de `anon`, `authenticated` e `public`) é registrado na task C e vira uma migração nova |
| S11. Security Advisor sem alertas de RLS, de grants ou de `search_path`. O alerta "Leaked Password Protection Disabled" é esperado e aceito: o provedor de senha está desabilitado e não existe senha a proteger | Responsável | Database, Advisors | Item marcado; o resultado é descrito em texto |
| S12. Migrações posteriores: um `db push` depois de cada merge que traga migração nova, a partir da `main` | Responsável | `npx supabase db push` e `npx supabase migration list` | `migration list` com local e remoto alinhados |

### Google Cloud

| Passo | Quem | Onde | Evidência |
| :-- | :-- | :-- | :-- |
| GC1. Criar ou escolher um projeto do Google Cloud para o login | Responsável | Console do Google Cloud | Item marcado |
| GC2. Configurar a tela de consentimento como **externa**, com nome do app, e-mail de suporte, contato do desenvolvedor e só os escopos básicos (`openid`, e-mail e perfil). No ciclo `001` ela ficou em **Testando**, porque faltavam página inicial e política de privacidade; a publicação da Audience segue o roteiro O1 a O6 (armadilha 7) | Responsável | Google Auth Platform, Branding, Audience e Data Access | Item marcado; o status registrado é o real (**Testando** até O4) |
| GC3. Criar o cliente OAuth do tipo **Aplicativo da Web**, com a origem JavaScript `https://investimentos.euthiagoandrade.com.br` e o URI de redirecionamento do Supabase, copiado da página do provedor Google no painel do Supabase (`https://<project-id>.supabase.co/auth/v1/callback`) | Responsável | Clients, Create client | Item marcado. O ID e o segredo do cliente vão só para o Supabase (S7); copie o segredo na hora, porque ele pode não ser mostrado de novo |
| GC4. Enquanto a Audience estiver em **Testando**, adicionar como **usuário de teste** a conta Google do administrador e a de cada pessoa autorizada na lista (P2). Com a Audience publicada e o login fora da lista de teste comprovado (O5), o passo deixa de ser necessário | Responsável | Google Auth Platform, Audience, Test users | Item marcado; o e-mail **não** é registrado. O bloqueio por `access_denied` de uma conta fora da lista de teste foi premissa do ciclo `001`, não observação; com só identidade básica, a documentação do Google indica que a lista não é exigida (armadilha 7) |

### Publicação da tela de consentimento (ciclo 010)

Roteiro da ação externa da issue #104 (BL-012), executado pelo responsável **depois** de integrar e publicar as quatro entregas do ciclo `010`. Executado em 2026-10-22 (ver "Resultado da execução" abaixo). O agente não abre o console, não muda escopos, domínios ou listas e só confere por leitura páginas públicas, depois da autorização de verificação em produção. Nenhum ID de projeto ou de cliente, credencial, e-mail de conta ou print com dado real entra nas evidências: só categorias, estados e passou/falhou.

**Resultado mínimo:** Audience publicada **e** login de uma conta autorizada na lista do app, fora da lista de teste do Google, comprovado pelo responsável. Branding é opcional. Sem o resultado mínimo, a issue não é concluída: a situação passa a "Parado" para decisão.

Três domínios distintos aparecem no console; não os confunda:

| Papel | Endereço | Observação |
| :-- | :-- | :-- |
| Página inicial (para o Google), política e termos | `https://investimentos.euthiagoandrade.com.br/termos` como página inicial e `/privacidade` como política; `/termos` também como termos | Domínio próprio, verificável no Search Console. A entrada do app para as pessoas continua em `/entrar`; o campo do console não muda o roteamento |
| Retorno Google → Supabase (URI de redirecionamento do cliente OAuth) | `https://<project-id>.supabase.co/auth/v1/callback` (GC3) | Domínio do Supabase: o responsável não tem como provar a propriedade de `supabase.co` |
| Retorno Supabase → app | `https://investimentos.euthiagoandrade.com.br/auth/callback` (S9) | Configurado no Supabase, não no Google |

| Passo | Quem | Onde | Evidência |
| :-- | :-- | :-- | :-- |
| O1. Abrir em janela anônima `/entrar`, `/privacidade` e `/termos` no domínio de produção; conferir os links em `/entrar`, a descrição do produto em `/termos`, os textos e os links entre as páginas | Responsável | Navegador | Texto: as três páginas abriram sem login, com os links funcionando |
| O2. Conferir o projeto do Google Cloud, os escopos configurados em Data Access e os efetivamente pedidos no login (a tela de consentimento mostra o que o app pede). Se houver qualquer escopo além de identidade básica, **parar este roteiro** e decidir o escopo; não removê-lo nem ampliá-lo por inferência | Responsável | Google Auth Platform, Data Access; tela de consentimento | Texto: só identidade básica, ou a categoria do escopo extra encontrado |
| O3. Conferir a propriedade do domínio próprio no Search Console, com conta adequada ao projeto, e preencher em Branding a página inicial (`/termos`), a política (`/privacidade`) e os termos (`/termos`), todos no mesmo domínio. Não alterar o callback, não tentar provar a propriedade de `supabase.co` e não contratar domínio próprio de Auth. Se o Google exigir essa propriedade e a exigência **impedir** o resultado mínimo, parar para decisão; se afetar só o Branding opcional, registrar a limitação e seguir | Responsável | Search Console; Google Auth Platform, Branding | Texto: domínio verificado ou não; motivo sanitizado de qualquer exigência |
| O4. Publicar a Audience (Publish app), quando o console permitir, sem exigir a marca verificada. Registrar o Branding como não solicitado, pendente ou publicado, sem prometer aprovação. Se `/termos` for recusada como página inicial ou outra exigência impedir a publicação, parar para decisão antes de qualquer alternativa; `/entrar` não serve como alternativa sem mudança, porque é só login, o que o Google não aceita | Responsável | Google Auth Platform, Audience | Texto: status da Audience e estado do Branding |
| O5. Com a Audience publicada, entrar com uma conta **autorizada na lista do app e fora da lista de teste do Google**, e confirmar a recusa, com a mensagem neutra, de uma conta fora da lista do app (verificação "Recusa"). Não adicionar contas nem alterar listas para fazer a prova | Responsável | Navegador | Texto: passou ou falhou em cada prova, com limitações; sem e-mail. Sem conta ou meio de provar, o critério fica pendente para decisão, sem substituir pela CI |
| O6. Dizer "concluí a ação externa da issue #104" com o estado real da Audience e do Branding e os resultados sanitizados | Responsável | Conversa | A frase não transforma pendência em prova: sem O4 e O5, "Parado". Os fatos entram na task da última issue do ciclo e, no encerramento, nesta KB e na task da issue #104 |

O [guia de verificação do Google](https://support.google.com/cloud/answer/13464321?hl=en) pede página inicial no domínio verificado que identifique o app, descreva sua funcionalidade e leve à política de privacidade, e não aceita uma página que seja só de login. O [guia de público do app](https://support.google.com/cloud/answer/15549945?hl=en) define Testando, produção e a exceção de identidade básica. O [guia do Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google) trata o domínio próprio de Auth e o Branding como melhorias opcionais.

#### Resultado da execução (2026-10-22)

O responsável executou O1 a O6 depois das quatro entregas e declarou "concluí a ação externa da issue #104". Resultado sanitizado, sem ID, e-mail ou print:

| Passo | Resultado declarado |
| :-- | :-- |
| O1 — páginas no ar | ok |
| O2 — escopos | só identidade básica |
| O3 — domínio | verificado |
| O4 — Audience | em produção |
| O4 — Branding | não solicitado |
| O5 — login de conta autorizada no app, fora da lista de teste do Google | passou |
| O5 — recusa de conta fora da lista do app | passou |

Resultado mínimo atendido: Audience publicada e login fora da lista de teste. Com a Audience em produção, a lista do app basta para autorizar um e-mail (P2). O agente só conferiu por leitura as páginas públicas (`/entrar`, `/privacidade` e `/termos`); console e login são evidência declarada pelo responsável. Branding permanece opcional e não solicitado.

### Vercel

| Passo | Quem | Onde | Evidência |
| :-- | :-- | :-- | :-- |
| V1. Importar o repositório `saldo-futuro`, framework Next.js, sem alterar os comandos padrão, e fazer o primeiro deploy **sem variáveis**: ele sai como "Preview sem backend", o que é esperado. O repositório é privado: se ele não aparecer, ajuste as permissões do app do GitHub na Vercel (Adjust GitHub App Permissions) | Responsável | Painel da Vercel, Add New, Project | Item marcado |
| V2. Definir as três variáveis **somente em Production** (em Environments, desmarque Preview e Development) e, em seguida, **refazer o deploy sem usar o cache de build** | Responsável | Settings, Environment Variables; depois Deployments, Redeploy | Item marcado, conferido de novo no Gate V-C; veja a tabela abaixo. Depois do novo deploy, `/entrar` mostra o botão do Google, sem campo de senha e sem "Preview sem backend" |
| V3. Adicionar o domínio `investimentos.euthiagoandrade.com.br` ao projeto | Responsável | Settings, Domains; a Vercel mostra o destino do `CNAME` | Item marcado |
| V4. Conferir o cron | Responsável | Settings, Cron Jobs: deve listar `/api/keepalive`, diário (`17 8 * * *`, em UTC), depois do deploy que contém o `vercel.json` | Item marcado |
| V5. Conferir o login com Google do responsável em `https://investimentos.euthiagoandrade.com.br` | Responsável | Navegador | Descrição em texto (por exemplo, "entrou e viu o perfil de administrador"), sem e-mail e sem captura de tela com dado real |

Variáveis da Vercel:

| Variável | Production | Preview e Development | Valor |
| :-- | :-- | :-- | :-- |
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | Não definir | URL do projeto de produção (S3) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sim | Não definir | Chave publicável (S3) |
| `CRON_SECRET` | Sim | Não definir | Texto aleatório com pelo menos 32 caracteres, gerado pelo responsável, por exemplo no gerenciador de senhas ou com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Marque **Sensitive** e guarde uma cópia no gerenciador de senhas, porque a Vercel deixa de mostrá-lo. Ela o envia como `Authorization: Bearer <valor>` ao chamar o cron |
| `NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN` | **Não definir** | Não definir | — |
| Chave secreta do Supabase | **Nunca** | **Nunca** | — |

Sem as variáveis do Supabase, a aplicação mostra "Preview sem backend" e não chama o banco. Por isso os previews não recebem nenhuma delas, e nenhum preview usa dados reais.

### Cloudflare

| Passo | Quem | Onde | Evidência |
| :-- | :-- | :-- | :-- |
| C1. Criar o registro `CNAME` de `investimentos` para o destino indicado pela Vercel (V3), em **somente DNS** | Responsável | Painel DNS do domínio | Item marcado; o agente confere por leitura que o nome resolve (`nslookup investimentos.euthiagoandrade.com.br`) e que o certificado foi emitido |

### Procedimentos SQL do responsável

Executados no editor SQL do painel do Supabase, como administrador do projeto. Escreva o e-mail em minúsculas e sem espaços, que é o formato que a lista aceita. **Nenhum e-mail é gravado no repositório, em issues, em PRs nem em tasks.**

**P1. Primeiro administrador** (passo S6; antes do primeiro login dele):

```sql
insert into public.authorized_emails (email, role)
values ('<e-mail-do-administrador>', 'admin');
```

**P2. Autorizar um e-mail** (cadastro futuro; vale só para quem ainda não tem conta). Enquanto a Audience do Google estiver em **Testando**, adicione também a conta como usuário de teste (GC4); depois de O5 comprovado, a lista do app basta:

```sql
insert into public.authorized_emails (email, role)
values ('<e-mail>', 'user');
```

O papel da lista é o papel **inicial**. Quem já tem conta não muda de papel por esta linha.

**P3. Mudar o papel de uma conta existente.** A lista não aceita `update` pela API e a autoridade do papel, depois do primeiro login, é `profiles.role`. Atualize os dois, na mesma transação:

```sql
begin;
update public.profiles set role = 'admin' where email = '<e-mail>';
update public.authorized_emails set role = 'admin' where email = '<e-mail>';
commit;
```

Exemplo: se uma pessoa entrou como `user` e deve virar `admin`, o `update` na lista sozinho não muda nada para ela; o procedimento acima muda. Para voltar ao papel `user`, troque `'admin'` por `'user'`.

**P4. Revogar um acesso** (decisão D1 do plano). Remover o e-mail da lista só impede um **novo** cadastro; a conta existente continua entrando. Para revogar de verdade, exclua também o usuário; o perfil cai em cascata:

```sql
begin;
delete from public.authorized_emails where email = '<e-mail>';
delete from auth.users where email = '<e-mail>';
commit;
```

As sessões deixam de ser renovadas. O token de acesso já emitido vale até expirar (1 hora, valor padrão do Supabase). Se a pessoa tentar entrar de novo com o Google, o hook recusa.

### Verificação em produção (Gate V-C)

Depois do merge da PR C, do deploy e do `db push` (S5), o agente registra na task, em texto e sem dados reais:

| Item | Como | Evidência |
| :-- | :-- | :-- |
| Login e papel | Login com Google do responsável | Texto: entrou e viu o papel de administrador |
| Recusa | Login com uma segunda conta Google **fora** da lista do app que chegue ao Supabase: com a Audience em Testando, uma conta cadastrada como usuário de teste (GC4); com a Audience publicada, qualquer conta. Quem a recusa é o hook; um bloqueio do próprio Google (por exemplo, conta fora da lista de teste com escopo além do básico) não prova o hook. Sem essa segunda conta, a prova é o teste de CI do mesmo hook, registrado como limitação | Texto: a conta foi recusada com a mensagem neutra |
| Cron | Settings, Cron Jobs; chamada sem segredo; chamada com o segredo (veja "Keepalive"); logs da Vercel | Cron listado; `GET /api/keepalive` sem segredo responde `401`; com o segredo, `ok: True`; chamada automática diária nos logs, ou a limitação do painel registrada |
| PWA | Instalar pelo menu no celular ("Instalar app" no Android, "Adicionar à Tela de Início" no iOS); o aviso automático de instalação pode não aparecer, porque não há service worker | Texto: o app abriu em janela própria, com o ícone e o nome corretos |
| Security Advisor | Database, Advisors | Sem alertas de RLS, de grants nem de `search_path` |
| Migrações | `npx supabase migration list` | Local e remoto alinhados |
| Preview | Abrir o preview de uma PR | Exibe "Preview sem backend" |
| Provedor de senha | Authentication, Providers | Provedor de e-mail desabilitado e cadastro geral habilitado |
| Variáveis | Settings, Environment Variables | As quatro regras da tabela da Vercel conferem; a chave secreta do Supabase e a variável de login por senha não existem |
| Acompanhamento | Painel do Supabase | O projeto continua ativo por pelo menos 8 dias após o deploy de produção |

Uma falha de código segue a trilha curta, com issue `[FIX]` própria. Uma falha de configuração é corrigida pelo responsável, refazendo o passo correspondente deste roteiro, e o item é verificado de novo.

### Keepalive: o que ele faz e como acompanhar

- O `vercel.json` agenda uma chamada diária a `GET /api/keepalive`. Vercel Hobby aceita no mínimo um cron por dia e pode disparar a chamada em qualquer momento da hora marcada.
- A rota exige `Authorization: Bearer <CRON_SECRET>`; sem o segredo, responde `401`. Se `CRON_SECRET` não existir no ambiente, recusa tudo. Com o segredo certo, ela chama `public.keepalive()` pela chave publicável, e a função só devolve `1`, sem ler tabela alguma.
- A documentação do Supabase diz que o plano gratuito pausa projetos após uma semana de inatividade, mas não detalha o que conta como atividade. Por isso a eficácia só se prova com o tempo: confira no painel que o projeto continua ativo por pelo menos 8 dias após o deploy. Se o encerramento do ciclo vier antes, a task de closure registra a data prevista da conferência como acompanhamento aberto, e uma pausa constatada depois é tratada pela trilha curta.
- Falha do cron aparece nos logs da Vercel (a rota responde `500` quando o banco não responde). A Vercel não repete uma chamada que falhou, e a entrega é "melhor esforço". O painel de logs pode falhar ou atrasar; o botão **Run** de Cron Jobs nem sempre gera linha de log visível. Por isso, a prova direta é o teste abaixo.
- Sem o `db push` (S5), a rota responde `500`, porque a função `public.keepalive()` não existe no banco de produção.

**Teste direto do keepalive em produção**, no PowerShell do responsável. O segredo vem do gerenciador de senhas, é digitado no próprio terminal e não é registrado em lugar nenhum:

```powershell
$secret = Read-Host "Cole o CRON_SECRET e aperte Enter"
try { Invoke-RestMethod -Uri "https://investimentos.euthiagoandrade.com.br/api/keepalive" -Headers @{ Authorization = "Bearer $secret" } } catch { "status: " + [int]$_.Exception.Response.StatusCode }
```

| Resultado | Significa |
| :-- | :-- |
| `ok : True` | O segredo confere e a função respondeu no banco de produção |
| `status: 401` | O segredo digitado difere do `CRON_SECRET` da Vercel |
| `status: 500` | A função `public.keepalive()` não responde no banco (falta o `db push`) |
| `status: 503` | As variáveis do Supabase não entraram no build de produção |

### Migração e virada (ciclo 006)

Roteiro da ação externa da issue #65. Ele leva a carteira do `Meus-Investimentos` para a conta do responsável em produção, pelo migrador das issues #63 e #64 (`npm run migracao`), e registra a virada. Quem executa é o responsável, na própria máquina. O agente não abre o SQLite real, o relatório detalhado, o plano, o diário nem a sessão, e não executa nada contra produção: ele só lê as saídas de contagem que o responsável colar na conversa.

**O que nunca sai de `local/`:** a cópia do SQLite, o relatório detalhado, o plano de operações, o diário, a trava e a sessão. Nenhum desses arquivos vai para o repositório, para issues, PRs ou tasks, nem para mensagens a ferramentas externas.

#### M0. Pré-requisitos e regime de gravador único

| Item | Como conferir |
| :-- | :-- |
| `main` atualizada, com as issues #63 e #64 integradas | `git checkout main`, `git pull` e `npm ci` |
| Node.js 24 ou mais recente | `node --version` |
| Produção com todas as migrações | `npx supabase migration list`: local e remoto alinhados (S12). Inclui a migração da issue #73 (`lancar_migracao_transito`), cujo `db push` é a ação externa daquela issue. Sem ela, o M4 para antes de gravar com `funcao_ausente` |
| Conta de destino do responsável vazia | A conta já entrou na aplicação, mas não tem nenhum ativo, lançamento ou mês fechado. O migrador confere e recusa se não estiver vazia |
| UUID do usuário de destino | Painel do Supabase, Authentication, Users, coluna do identificador da conta do responsável. Ele é usado só no comando, não é registrado |
| Regime de gravador único | **Uma máquina e um processo.** Ninguém usa a aplicação durante a carga, nem o responsável em outra aba ou no celular. O migrador impede um segundo processo na mesma pasta com a trava, mas não impede escrita de outra máquina ou da aplicação; essa escrita é detectada na conferência seguinte e para a carga |

Todos os comandos abaixo são de PowerShell, na raiz do repositório. A pasta de trabalho é `local\migracao-006\`; ela é ignorada pelo Git.

#### M1. Congelamento da origem

1. Feche um mês no `Meus-Investimentos`, como de costume. A virada acontece logo depois desse fechamento: só migram meses fechados, e qualquer lançamento em mês aberto recusa a simulação.
2. A partir daqui, **não lance mais nada na origem**. Ela fica congelada e intacta; é o caminho de volta.
3. Pare o backend da origem, para o SQLite não estar em uso. Copie o arquivo do banco para `local\migracao-006\meus-investimentos.sqlite`. Se existir ao lado dele um arquivo com o mesmo nome terminado em `-wal`, copie-o também, como `localmigracao-006meus-investimentos.sqlite-wal`.

```powershell
New-Item -ItemType Directory -Force local\migracao-006 | Out-Null
Copy-Item "<caminho-do-banco-da-origem>" local\migracao-006\meus-investimentos.sqlite
```

#### M2. Simular e conferir o relatório

```powershell
npm run migracao -- simular --db local\migracao-006\meus-investimentos.sqlite --user-id <uuid-do-destino> --out-dir local\migracao-006
```

- `"estado":"simulada"`: o plano de operações foi gravado em `local\migracao-006\plano-<...>.json`; anote o caminho que a saída mostra em `"plano"`.
- `"estado":"recusada"`: nada foi gerado para gravar. A saída lista os códigos das recusas (por exemplo, `M6_TRANSITO_PAR_AMBIGUO`, `M6_TRANSITO_SALDO_NEGATIVO`, `M10_COBERTURA_OU_CONSISTENCIA`) com as quantidades. **Pare aqui** e informe ao agente só os códigos e as quantidades; a decisão sobre o caso volta ao plano, com exemplos fictícios.

Com a simulação aceita, abra o relatório detalhado (`relatorio-<...>.json`, na mesma pasta) e confira, sem copiá-lo para lugar nenhum:

- a lista de meses e, em cada mês, o patrimônio do destino (`vf`) contra o da origem (`patrimonioOrigem`);
- `ativosEmM7`: os ativos e meses cujo histórico vira um único evento de migração, com o motivo; esses meses ficam com rentabilidade `N/D`;
- no resumo, os meses só com consolidado que não migram e os ativos que serão desativados;
- no resumo, `transitoComoTransferencia` e `transitoComoMigracao`: quantos eventos de trânsito viraram transferência com um resgate ou aporte real e quantos viraram migração no próprio trânsito (M6, plano `v4`). Os meses com migração no trânsito ficam com rentabilidade `N/D`;
- no resumo, `posicoesImplicitasZero`: quantas posições de saldo zero a simulação acrescentou para ativos que zeraram num mês e não tiveram nenhum evento depois (M10, plano `v5`). Elas entram no fechamento com saldo real zero e não mudam patrimônio nem rentabilidade.

Se algo no relatório não corresponder ao que você conhece da carteira, pare e descreva ao agente só a natureza da dúvida (por exemplo, "um ativo em M7 que eu não esperava"), sem valores nem nomes.

#### M3. Sessão do responsável

O migrador grava com a **sua** sessão e a chave publicável, como a aplicação. Nunca use a chave secreta: o migrador a recusa.

1. Defina, só nesta janela do PowerShell, a URL e a chave publicável do projeto de produção (S3):

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL = "https://<project-id>.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "<chave-publicável>"
```

2. Entre na aplicação de produção com o Google, num navegador de computador. Abra as ferramentas do desenvolvedor (F12), aba Console, e execute o trecho abaixo. Ele lê o cookie da sessão desta aba e copia para a área de transferência só o token de acesso e o de renovação, sem mostrá-los:

```javascript
(() => {
  const cookies = Object.fromEntries(document.cookie.split("; ").map((c) => [c.slice(0, c.indexOf("=")), c.slice(c.indexOf("=") + 1)]));
  const base = Object.keys(cookies).map((n) => n.replace(/\.\d+$/, "")).find((n) => /^sb-[^-]+-auth-token$/.test(n));
  const partes = Object.keys(cookies).filter((n) => n === base || n.startsWith(`${base}.`)).sort((a, b) => Number(a.split(".").pop()) - Number(b.split(".").pop()));
  let valor = partes.map((n) => decodeURIComponent(cookies[n])).join("");
  if (valor.startsWith("base64-")) valor = atob(valor.slice(7).replace(/-/g, "+").replace(/_/g, "/"));
  const s = JSON.parse(valor);
  copy(JSON.stringify({ access_token: s.access_token, refresh_token: s.refresh_token }));
  return "sessão copiada";
})();
```

3. Grave a área de transferência no arquivo da sessão (sem BOM, que o migrador não aceitaria) e **feche a aba da aplicação sem clicar em Sair**. Sair encerra a sessão em todos os lugares, inclusive no migrador.

```powershell
[IO.File]::WriteAllText("$PWD\local\migracao-006\sessao.json", (Get-Clipboard))
```

Não verificado em produção: o formato do cookie foi conferido no código da biblioteca usada pela aplicação (`@supabase/ssr`), não no navegador de produção. Se o trecho falhar, pare e informe ao agente a mensagem de erro do console, sem colar o valor do cookie.

O token de acesso vale cerca de uma hora e o migrador o renova sozinho enquanto o processo roda, mas não grava a renovação de volta no arquivo. Se um comando posterior responder "Sessão do responsável recusada", entre de novo na aplicação e repita os passos 2 e 3.

#### M4. Gravar

```powershell
npm run migracao -- gravar --db local\migracao-006\meus-investimentos.sqlite --plano <caminho-do-plano> --sessao local\migracao-006\sessao.json --out-dir local\migracao-006
```

O migrador confere que o plano corresponde à cópia do SQLite e à conta da sessão, cria a trava `gravacao.trava`, registra cada operação no diário (`diario-<...>.jsonl`) e só termina com uma destas saídas. **Não apague o diário nem a trava**, salvo onde a tabela manda.

| `result` / `motivo` | Significa | O que fazer |
| :-- | :-- | :-- |
| `executed` / `concluida` | Todas as operações confirmadas e o destino igual ao plano | Siga para M5 |
| `already_executed_and_reconciled` / `ja_concluida` | O plano inteiro já estava aplicado; nada foi gravado | Siga para M5 |
| `not_executed` / `destino_nao_vazio` | A conta de destino tem dados e não há retomada comprovada | Pare; nada foi gravado. Decisão do responsável, com o agente, antes de qualquer limpeza |
| `not_executed` / `trava_presente` | Existe `gravacao.trava` na pasta | Confira no Gerenciador de Tarefas que nenhum outro `node` do migrador está rodando. Só então, se a trava sobrou de um processo interrompido, apague `local\migracao-006\gravacao.trava` e repita M4 |
| `not_executed` / `plano_invalido`, `usuario_divergente` ou `diario_divergente` | O plano foi alterado ou é de uma versão anterior do migrador, a sessão é de outra conta ou o diário é de outro plano ou outra conta | Pare e informe o motivo ao agente. Um plano gerado antes da issue #73 não é aceito: simule de novo (M2) |
| `not_executed` / `funcao_ausente` | O plano usa `lancar_migracao_transito` e a função não respondeu à sonda sem efeito (falta o `db push` da issue #73, ou a rede falhou) | Nada foi gravado. Confira `npx supabase migration list` (S12) e repita M4 |
| `ambiguous_human_intervention_required` / `desconhecida` | A resposta de uma chamada se perdeu (rede ou tempo esgotado). O efeito dela é desconhecido e **ela não é reenviada** | Espere alguns minutos e repita o mesmo comando M4. O migrador relê o destino: se o efeito aparece exatamente uma vez, ele o reconhece e continua |
| `ambiguous_human_intervention_required` / `desconhecida_sem_efeito` | Na retomada, o efeito da operação desconhecida ainda não aparece | A chamada original pode ainda estar em execução. Espere e repita M4 mais tarde. Se continuar assim, pare: a decisão é esperar mais ou desfazer a carga (M7). Nunca reenvie à mão |
| `ambiguous_human_intervention_required` / `estado_divergente` | O destino não é um prefixo exato do plano: houve escrita de fora ou um efeito parcial ou duplicado | Pare. Informe ao agente o motivo e as contagens de `diferencas`. O caminho provável é M7 |
| `ambiguous_human_intervention_required` / `recusada` | O banco recusou uma operação e desfez a transação dela | Pare e informe o motivo ao agente; a causa precisa ser entendida antes de repetir |
| `leitura_falhou` | Uma leitura do destino falhou ou mudou durante a leitura | Confira a conexão e repita M4; a retomada continua do ponto confirmado |

`confirmadas` e `total` mostram quantas operações do plano estão confirmadas; `enviadas`, quantas esta execução enviou.

#### M5. Conferir

```powershell
npm run migracao -- conferir --db local\migracao-006\meus-investimentos.sqlite --sessao local\migracao-006\sessao.json
```

O modo só lê. Ele simula de novo a partir da cópia do SQLite e compara o destino inteiro, mês a mês: consolidado, posições, patrimônio com o trânsito, rentabilidade, acumulado e meses `N/D`. O resultado aceito é `"ok":true` com `"diferencas":{}`. Qualquer diferença é "Parado": informe ao agente só as categorias e as contagens.

#### M6. O que informar ao agente

Cole na conversa **somente** as linhas de saída dos três comandos (`simular`, `gravar` e `conferir`). Elas contêm apenas estado, contagens, motivos e caminhos dentro de `local/`. Nunca cole o relatório, o plano, o diário, a sessão, valores, nomes de ativos, instituições ou prints com dados. Depois, diga "concluí a ação externa da issue #65". O agente registra na task só contagens e diferenças.

Depois da conferência sem diferença, apague o arquivo da sessão (`Remove-Item local\migracao-006\sessao.json`) e mantenha o restante da pasta até o encerramento do ciclo.

#### M7. Caminho de volta

Antes da confirmação da virada, a origem continua congelada e intacta: voltar a ela é só retomar o uso. Para limpar o destino, como nenhuma função apaga eventos, exclua o usuário de destino (a carteira sai em cascata) e **mantenha** o e-mail na lista de autorizados, para poder entrar de novo. No editor SQL do Supabase:

```sql
delete from auth.users where email = '<e-mail-do-responsável>';
```

Depois, entre de novo na aplicação com o Google: o hook recria a conta com o papel da lista. Se o papel esperado for `admin`, confira que a lista o registra (P3). A conta nova tem **outro UUID**, então uma nova carga recomeça em M2, com o UUID novo e outra pasta de trabalho (por exemplo, `local\migracao-006-b\`): o diário antigo pertence à conta excluída e o migrador o recusa.

#### M8. Data de virada

A data de virada é o dia em que a conferência M5 termina sem diferença. A partir dela, o Saldo Futuro é a fonte de verdade e a origem não recebe lançamentos. A data é registrada na verificação em produção do ciclo 006 ("autorizo a verificação em produção do ciclo 006") e entra na KB-003 pela PR de encerramento. **A virada ocorreu em 2026-10-18.**

## Fontes

Consultadas em 2026-10-12 e conferidas na execução de 2026-10-13. São documentação oficial, sem versão fixada; os valores que dependem do plano ou do painel devem ser reconferidos.

- Supabase, hook "before user created" (Auth Hooks): <https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook>. Função: confirma o hook nos planos Free e Pro e o formato da recusa. Limite: não define a política de acesso, que é da ADR-003.
- Supabase, login com Google: <https://supabase.com/docs/guides/auth/social-login/auth-google>. Função: tela de consentimento, tipo de cliente OAuth e URI de retorno. Limite: a interface do Google muda.
- Supabase CLI, desenvolvimento local e implantação: <https://supabase.com/docs/guides/cli/local-development>. Função: `login`, `link` e `db push`.
- Supabase, preços e pausa por inatividade: <https://supabase.com/pricing>. Função: limite de 2 projetos ativos e pausa após uma semana de inatividade. Limite: não detalha o que conta como atividade.
- Vercel, gestão de cron jobs: <https://vercel.com/docs/cron-jobs/manage-cron-jobs>. Função: `CRON_SECRET` enviado como `Authorization`, ausência de repetição e de redirecionamento.
- Vercel, cron jobs: <https://vercel.com/docs/cron-jobs>. Função: o cron chama o deployment de produção.
- Vercel, limites de cron: <https://vercel.com/docs/cron-jobs/usage-and-pricing>. Função: mínimo diário e precisão de ±59 min no Hobby.
- Chrome, critérios de instalação do PWA: <https://web.dev/articles/install-criteria>. Função: instalação pelo menu sem service worker.
- Plano `001`, `_project/executed/001_fundacao_aplicacao/001_plan.md`, "Modelo de acesso", "Regra de papel adotada na v2" e decisões D1 a D3: origem dos procedimentos P1 a P4.
- Google, verificação do app e página inicial: <https://support.google.com/cloud/answer/13464321?hl=en>. Consultado em 2026-10-21. Função: página inicial no domínio verificado, descrição da funcionalidade, link da política e recusa de página só de login. Limite: não diz quais exigências o console deste projeto vai mostrar.
- Google, público do app (Testando, produção e exceção de identidade básica): <https://support.google.com/cloud/answer/15549945?hl=en>. Consultado em 2026-10-21. Função: lista de teste, expiração de 7 dias e exceção para nome, e-mail e perfil. Limite: o comportamento efetivo é conferido em O5.
- Google, políticas OAuth: <https://developers.google.com/identity/protocols/oauth2/policies> e verificação de marca: <https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification>. Consultados no plano `010`, em 2026-10-21.
- Plano `010`, `_project/executed/010_novidades_privacidade_ativos_distribuicao/010_plan.md`, item 1 e roteiro da ação externa: origem de O1 a O6.

## Histórico

| Data | Ciclo | Alteração |
| :-- | :-- | :-- |
| 2026-10-12 | `001` | Criação |
| 2026-10-13 | `001` | Correções depois da execução do Gate H-C: um único `db push`, tela do Google em modo Testando (GC2, GC4 e armadilha 7), rótulo "Project ID", Redirect URL sem `localhost`, alerta de senhas vazadas aceito, integração Cron não instalada, ordem das variáveis na Vercel, teste direto do keepalive e limitação dos logs |
| 2026-10-18 | `006` | Seção "Migração e virada": roteiro da ação externa da issue #65 (M0 a M8) |
| 2026-10-18 | `006` | Issue #73: `db push` da função `lancar_migracao_transito` antes de gravar, códigos de recusa de M6 revisada, contagens de trânsito no resumo e o motivo `funcao_ausente` |
| 2026-10-18 | `006` | Issue #76: contagem `posicoesImplicitasZero` no resumo da simulação (M10 revisada) |
| 2026-10-18 | `006` | Encerramento: virada registrada em 2026-10-18 |
| 2026-10-21 | `010` | Issue #104: armadilha 7 separa Audience, Branding e a exceção de identidade básica; GC2, GC4, P2 e a verificação "Recusa" condicionados ao status da Audience; roteiro O1 a O6 da publicação, com resultado mínimo e parada por impedimento externo. Página inicial informada ao Google: `/termos`, por decisão do responsável; `/entrar` fica só com logo e login. O resultado real entra no encerramento do ciclo |
| 2026-10-22 | `010` | Encerramento: resultado da publicação da Audience (O1 a O6) registrado na subseção "Resultado da execução"; Branding não solicitado |
