---
title: "Operação de produção e de acessos"
tags:
  - operação
  - produção
  - acesso
author: "Thiago Andrade e Claude"
module: "Operação"
last_updated: "2026-10-12"
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
3. Supabase CLI: vincular e fazer o primeiro `db push`, a partir da `main` (S4 e S5).
4. Supabase: inserir o primeiro administrador na lista, antes do primeiro login (S6).
5. Google Cloud: criar o cliente OAuth, que precisa da URL de retorno do projeto Supabase (GC1 a GC3).
6. Supabase: habilitar o Google, desabilitar a senha, configurar URLs e o hook (S7 a S10).
7. Vercel: importar o repositório, definir as variáveis em Production e o domínio (V1 a V4).
8. Cloudflare: criar o `CNAME` (C1).
9. Verificar o Security Advisor (S11) e conferir o login (V5).

Depois do merge da PR C (Gate M-C), o responsável faz o segundo `db push` (S12) e o agente registra as evidências do Gate V-C.

### Armadilhas, em ordem de gravidade

1. **Cadastro desligado em geral.** Em Authentication, desabilite só o provedor de e-mail (senha). **Mantenha habilitada** a opção geral de cadastro de novos usuários (`Allow new users to sign up`). Desligá-la recusaria também o primeiro login com Google, porque ele cria o usuário. A restrição aos e-mails autorizados vem do hook e do gatilho, não dessa opção.
2. **Primeiro administrador depois do primeiro login.** O primeiro `admin` precisa estar na lista **antes** do primeiro login dele; do contrário o hook recusa o cadastro. Se o login for tentado antes, o hook recusa e nada é criado; insira o e-mail e tente de novo.
3. **Variáveis `NEXT_PUBLIC_*` são lidas no build.** Defina-as na Vercel antes do primeiro deploy de produção; se forem criadas ou alteradas depois, faça um novo deploy.
4. **`NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN` nunca vai para a Vercel.** O formulário de senha existe só no ambiente local e no CI. Em produção, o provedor de senha desabilitado no Supabase mantém o bloqueio mesmo se a variável vazar.
5. **A chave secreta do Supabase nunca vai para a Vercel nem para o GitHub.** A aplicação usa só a chave publicável.
6. **Cloudflare sem proxy.** O registro do subdomínio fica em "somente DNS" (nuvem cinza), para a Vercel emitir o certificado.
7. **Tela de consentimento do Google em teste.** Uma tela externa em modo de teste só aceita usuários de teste listados e expira credenciais; publique-a (passo GC2).
8. **Primeiro `db push` fora da `main`.** O primeiro `db push` sai de uma cópia atualizada da `main`, antes do merge da PR C. Assim ele aplica só a migração de acesso, e a do keepalive vai no segundo `db push`, depois do deploy.

### GitHub

| Passo | Quem | Onde | Evidência |
| :-- | :-- | :-- | :-- |
| G1. Conferir que `Allow GitHub Actions to create and approve pull requests` está habilitada | Responsável | Settings, Actions, General, Workflow permissions | Marcar o item no checklist da task; o agente confere por leitura (`gh api repos/<dono>/<repositório>/actions/permissions/workflow`, campo `can_approve_pull_request_reviews`) |

### Supabase

| Passo | Quem | Onde | Evidência |
| :-- | :-- | :-- | :-- |
| S1. Conferir a vaga no plano gratuito (limite de 2 projetos ativos) | Responsável | Painel da organização que vai hospedar o projeto | Item marcado; se não houver vaga, o responsável decide (pausar outro projeto ou usar outra organização) e a cadeia para |
| S2. Criar o projeto novo e exclusivo, região `sa-east-1` (América do Sul, São Paulo), PostgreSQL 17, igual ao local | Responsável | Painel, novo projeto | Item marcado. A senha do banco vai para o gerenciador de senhas, nunca para o repositório |
| S3. Anotar a URL do projeto e a chave publicável, para a Vercel; **não** copiar a chave secreta | Responsável | Project Settings, API | Item marcado |
| S4. Entrar no CLI e vincular o projeto | Responsável | Terminal, na raiz do repositório: `npx supabase login` e `npx supabase link --project-ref <referência-do-projeto>` | Item marcado. A credencial do CLI é pessoal e não é registrada |
| S5. Primeiro `db push`, a partir da `main` atualizada | Responsável | `npx supabase db push` e `npx supabase migration list` | Saída de `migration list` com a migração de acesso presente nas colunas local e remota, descrita em texto (sem identificadores) |
| S6. Inserir o primeiro administrador na lista | Responsável | Editor SQL do painel, depois do S5 e antes do primeiro login (procedimento P1) | Item marcado; o e-mail **não** é registrado |
| S7. Habilitar o provedor Google com o ID e o segredo do cliente criado no Google Cloud | Responsável | Authentication, Providers, Google | Item marcado |
| S8. Desabilitar o provedor de e-mail (senha) e manter o cadastro geral habilitado | Responsável | Authentication, Providers, Email; e a opção `Allow new users to sign up` | Item marcado; conferido de novo no Gate V-C |
| S9. Site URL `https://investimentos.euthiagoandrade.com.br` e Redirect URL `https://investimentos.euthiagoandrade.com.br/auth/callback` | Responsável | Authentication, URL Configuration | Item marcado |
| S10. Hook "Before User Created" apontando para a função `before_user_created` do schema `private` | Responsável | Authentication, Hooks; depende do S5, porque a função nasce na migração | Item marcado. Se o painel não permitir o schema `private`, o desvio (função em `public`, com `execute` revogado de `anon`, `authenticated` e `public`) é registrado na task C e vira uma migração nova |
| S11. Security Advisor sem alertas de RLS, de grants ou de `search_path` | Responsável | Database, Advisors | Item marcado; o resultado é descrito em texto |
| S12. Segundo `db push`, depois do merge da PR C e do deploy, a partir da `main` | Responsável | `npx supabase db push` e `npx supabase migration list` | `migration list` com local e remoto alinhados (duas migrações) |

### Google Cloud

| Passo | Quem | Onde | Evidência |
| :-- | :-- | :-- | :-- |
| GC1. Criar ou escolher um projeto do Google Cloud para o login | Responsável | Console do Google Cloud | Item marcado |
| GC2. Configurar a tela de consentimento como **externa**, com os escopos básicos (`openid`, e-mail e perfil), e **publicá-la** | Responsável | Google Auth Platform, Audience e Data Access | Item marcado |
| GC3. Criar o cliente OAuth do tipo **Aplicativo da Web**, com a origem JavaScript `https://investimentos.euthiagoandrade.com.br` e o URI de redirecionamento do Supabase, copiado da página do provedor Google no painel do Supabase (`https://<referência-do-projeto>.supabase.co/auth/v1/callback`) | Responsável | Credenciais | Item marcado. O ID e o segredo do cliente vão só para o Supabase (S7) |

### Vercel

| Passo | Quem | Onde | Evidência |
| :-- | :-- | :-- | :-- |
| V1. Importar o repositório `saldo-futuro`, framework Next.js, sem alterar os comandos padrão | Responsável | Painel da Vercel, novo projeto; o repositório é privado, então a Vercel precisa de acesso a ele | Item marcado |
| V2. Definir as variáveis **somente em Production**, antes do primeiro deploy | Responsável | Settings, Environment Variables | Item marcado, conferido de novo no Gate V-C; veja a tabela abaixo |
| V3. Adicionar o domínio `investimentos.euthiagoandrade.com.br` ao projeto | Responsável | Settings, Domains; a Vercel mostra o destino do `CNAME` | Item marcado |
| V4. Conferir o cron | Responsável | Settings, Cron Jobs: deve listar `/api/keepalive`, diário, depois do deploy que contém o `vercel.json` | Item marcado |
| V5. Conferir o login com Google do responsável em `https://investimentos.euthiagoandrade.com.br` | Responsável | Navegador | Descrição em texto (por exemplo, "entrou e viu o perfil de administrador"), sem e-mail e sem captura de tela com dado real |

Variáveis da Vercel:

| Variável | Production | Preview e Development | Valor |
| :-- | :-- | :-- | :-- |
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | Não definir | URL do projeto de produção (S3) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sim | Não definir | Chave publicável (S3) |
| `CRON_SECRET` | Sim | Não definir | Texto aleatório com pelo menos 32 caracteres, gerado pelo responsável, por exemplo no gerenciador de senhas. A Vercel o envia como `Authorization: Bearer <valor>` ao chamar o cron |
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

**P2. Autorizar um e-mail** (cadastro futuro; vale só para quem ainda não tem conta):

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

Depois do merge da PR C, do deploy e do segundo `db push` (S12), o agente registra na task, em texto e sem dados reais:

| Item | Como | Evidência |
| :-- | :-- | :-- |
| Login e papel | Login com Google do responsável | Texto: entrou e viu o papel de administrador |
| Recusa | Login com uma conta Google não autorizada, se o responsável tiver uma; do contrário, a prova é o teste de CI do mesmo hook, registrado como limitação | Texto: a conta foi recusada com a mensagem neutra |
| Cron | Logs da Vercel; chamada sem segredo | Cron registrado nos logs; `GET /api/keepalive` sem segredo responde `401` |
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
- Falha do cron aparece nos logs da Vercel (a rota responde `500` quando o banco não responde). A Vercel não repete uma chamada que falhou, e a entrega é "melhor esforço".
- Antes do segundo `db push` (S12), a rota responde `500`, porque a função `public.keepalive()` ainda não existe no banco de produção.

## Fontes

Consultadas em 2026-10-12. São documentação oficial, sem versão fixada; os valores que dependem do plano ou do painel devem ser reconferidos.

- Supabase, hook "before user created" (Auth Hooks): <https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook>. Função: confirma o hook nos planos Free e Pro e o formato da recusa. Limite: não define a política de acesso, que é da ADR-003.
- Supabase, login com Google: <https://supabase.com/docs/guides/auth/social-login/auth-google>. Função: tela de consentimento, tipo de cliente OAuth e URI de retorno. Limite: a interface do Google muda.
- Supabase CLI, desenvolvimento local e implantação: <https://supabase.com/docs/guides/cli/local-development>. Função: `login`, `link` e `db push`.
- Supabase, preços e pausa por inatividade: <https://supabase.com/pricing>. Função: limite de 2 projetos ativos e pausa após uma semana de inatividade. Limite: não detalha o que conta como atividade.
- Vercel, gestão de cron jobs: <https://vercel.com/docs/cron-jobs/manage-cron-jobs>. Função: `CRON_SECRET` enviado como `Authorization`, ausência de repetição e de redirecionamento.
- Vercel, cron jobs: <https://vercel.com/docs/cron-jobs>. Função: o cron chama o deployment de produção.
- Vercel, limites de cron: <https://vercel.com/docs/cron-jobs/usage-and-pricing>. Função: mínimo diário e precisão de ±59 min no Hobby.
- Chrome, critérios de instalação do PWA: <https://web.dev/articles/install-criteria>. Função: instalação pelo menu sem service worker.
- Plano `001`, `_project/drafts/001_fundacao_aplicacao/001_plan.md`, "Modelo de acesso", "Regra de papel adotada na v2" e decisões D1 a D3: origem dos procedimentos P1 a P4.

## Histórico

| Data | Ciclo | Alteração |
| :-- | :-- | :-- |
| 2026-10-12 | `001` | Criação |
