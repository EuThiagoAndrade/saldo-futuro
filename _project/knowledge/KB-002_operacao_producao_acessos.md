---
title: "Operação de produção e de acessos"
tags:
  - operação
  - produção
  - acesso
author: "Thiago Andrade e Claude"
module: "Operação"
last_updated: "2026-10-13"
origin_cycle: "001"
---

# KB-002: Operação de produção e de acessos

## Finalidade

Roteiro verificável para levar o Saldo Futuro a `investimentos.euthiagoandrade.com.br` e para operar a lista de acessos depois disso. É consultada no Gate H-C do ciclo `001` (configuração externa feita pelo responsável), na verificação em produção (Gate V-C) e sempre que for preciso autorizar, promover ou revogar um acesso.

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
7. **Tela de consentimento do Google em modo Testando.** O Google só publica uma tela externa se houver página inicial e política de privacidade públicas, que o produto ainda não tem. Enquanto ela estiver em **Testando**, só entram as contas cadastradas como usuários de teste (até 100): cada pessoa autorizada na lista (procedimento P2) também precisa ser adicionada como usuário de teste (passo GC4). Publicar a tela fica para um ciclo futuro, com uma página de privacidade aprovada. O app só pede identidade básica (`openid`, e-mail e perfil) e o login é mantido pelo Supabase; confirme no Gate V-C, depois de 8 dias ou mais, que o login continua funcionando.
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
| GC2. Configurar a tela de consentimento como **externa**, com nome do app, e-mail de suporte, contato do desenvolvedor e os escopos básicos (`openid`, e-mail e perfil). **Não publicar:** o Google exige página inicial e política de privacidade para sair de **Testando**, e o app fica em modo de teste (armadilha 7) | Responsável | Google Auth Platform, Branding, Audience e Data Access | Item marcado; o status continua **Testando** |
| GC3. Criar o cliente OAuth do tipo **Aplicativo da Web**, com a origem JavaScript `https://investimentos.euthiagoandrade.com.br` e o URI de redirecionamento do Supabase, copiado da página do provedor Google no painel do Supabase (`https://<project-id>.supabase.co/auth/v1/callback`) | Responsável | Clients, Create client | Item marcado. O ID e o segredo do cliente vão só para o Supabase (S7); copie o segredo na hora, porque ele pode não ser mostrado de novo |
| GC4. Adicionar como **usuário de teste** a conta Google do administrador e, depois, a de cada pessoa autorizada na lista (P2) | Responsável | Google Auth Platform, Audience, Test users | Item marcado; o e-mail **não** é registrado. Sem isso o Google bloqueia o login dessa conta com `access_denied` antes de chegar ao app |

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

**P2. Autorizar um e-mail** (cadastro futuro; vale só para quem ainda não tem conta). Enquanto a tela do Google estiver em **Testando**, adicione também a conta como usuário de teste (GC4):

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
| Recusa | Login com uma segunda conta Google que esteja como usuário de teste no Google (GC4), mas **fora** da lista do app: quem a recusa é o hook. Uma conta que nem é usuário de teste é bloqueada pelo próprio Google, o que não prova o hook. Sem essa segunda conta, a prova é o teste de CI do mesmo hook, registrado como limitação | Texto: a conta foi recusada com a mensagem neutra |
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

## Histórico

| Data | Ciclo | Alteração |
| :-- | :-- | :-- |
| 2026-10-12 | `001` | Criação |
| 2026-10-13 | `001` | Correções depois da execução do Gate H-C: um único `db push`, tela do Google em modo Testando (GC2, GC4 e armadilha 7), rótulo "Project ID", Redirect URL sem `localhost`, alerta de senhas vazadas aceito, integração Cron não instalada, ordem das variáveis na Vercel, teste direto do keepalive e limitação dos logs |
