# Plano de Implementação — Fundação da aplicação

> **Ciclo:** `001`
> **Status:** `Em Execução`
> **Versão:** `v2`
> **Data de criação:** 2026-10-12
> **Última atualização:** 2026-10-12
> **Autor:** Thiago Andrade e Claude
> **Tipo:** `feature`
> **Prioridade:** `P1`
> **Prioridade de Execução:** Gate R → Gate P → Gate X-A → issue A → Gate M-A → issue B → Gate M-B → issue C → Gate H-C → Gate M-C → Gate V-C (com Gates X-F e M-F para cada correção) → Gate M-R → Gate E
> **Revisão formal:** `Concluída`
> **Veredito da revisão:** `APTO COM RESSALVAS`
> **Aprovação humana pós-revisão:** `Aprovada em 2026-10-12`

> Origem: ideação `_project/ideations/001_fundacao_aplicacao.md`, com as decisões 1 a 8 do responsável registradas em 2026-10-12. Este rascunho resolve as verificações técnicas pendentes da ideação, registra as divergências encontradas e propõe três decisões novas (D1 a D3), respondidas pelo responsável em 2026-10-12 com a opção (a) em todas.
>
> A `v2` corrige os bloqueadores B1 a B4 e as ressalvas R1 a R10 da rodada 1 da revisão formal. A resolução de cada achado está em "Revisão crítica", na tabela "Resposta da v2".

---

## Objetivo

Entregar em `investimentos.euthiagoandrade.com.br` a base em produção sobre a qual os ciclos `002` a `004` constroem regras, telas e migração:

- login com Google restrito à lista de e-mails autorizados no banco, sem conta nem sessão para e-mail fora da lista (ADR-003);
- perfis `admin` e `user`, com o `admin` gerenciando a lista de acessos e sem bypass de RLS;
- isolamento entre usuários provado por teste de banco (barreira G2 deixa de ser só heurística);
- CI com lint, tipos, testes unitários, testes de banco e ponta a ponta, além dos gates de governança;
- tokens e fonte do `DESIGN.md` aplicados, PWA instalável, release-please publicando versão e notas;
- previews sem dados reais e projeto Supabase de produção protegido contra pausa por inatividade.

> **Nota de escopo negativo:** este ciclo não cria nenhuma tabela de carteira, cálculo financeiro, tela de produto, barra de navegação, biblioteca de gráficos nem acesso ao SQLite de origem. A única interface autenticada é uma página mínima "em construção".

## Contexto e baseline

### Estado do repositório

Fatos verificados em `main` @ `aa5fa81`, em 2026-10-12:

- Governança, validador, CI de governança (`.github/workflows/governance.yml`, com o passo G4) e design system do ciclo `000` integrados. Não há `package.json`, `supabase/`, código de aplicação nem projeto Vercel ou Supabase deste produto.
- `_project/cycles.md` (alteração local, não versionada) registrava o ciclo `001` em `Ideação` e o próximo ciclo `002`; com este plano, o ciclo passou a `Planejamento`. A ideação está em `_project/ideations/001_fundacao_aplicacao.md`, também não versionada, na branch local `chore/cycle-001-ideation`.
- O validador aceita `*.sql` só em `supabase/migrations/`, `supabase/tests/`, `supabase/seed.sql` e `tests/fixtures/`; exige RLS para toda tabela de `public` criada nas migrações (heurística G2) e o padrão de nome `AAAAMMDDHHMMSS_assunto.sql` (G4).
- `.gitignore` já exclui `.env*` (exceto `.env.example`), `node_modules/`, `.next/`, `.vercel/`, `next-env.d.ts`, `supabase/.temp/`, `supabase/.branches/` e diretórios de relatório de teste.
- `design-system/DESIGN.md`, seção 5, contém o bloco `@theme` canônico; `design-system/assets/fonts/` tem os `woff2` 400, 500 e 600 da IBM Plex Sans; `design-system/assets/logo-simbolo.svg` é a base dos ícones (seção 8).
- Ambiente local: Node.js 24.15.0, npm 11.14.1, Docker 29.8.2 e GitHub CLI 2.96.0. O Supabase CLI não está instalado globalmente; o plano o fixa como dependência de desenvolvimento.

### Referência da stack

`mae-no-controle` @ `2f4a304`, `package.json`: Next.js 16.3.8, React 19.3.0, `@supabase/ssr` 0.12.7, `@supabase/supabase-js` 2.117.2, Zod 4.6.5, Tailwind 4.3.3, TypeScript 6.0.3, ESLint 9.39.5, Vitest 5.0.3, Playwright 1.63.0 e `@axe-core/playwright` 4.13.0; usa `public/manifest.webmanifest`, ícones 180, 192 e 512 e `release-please.yml`. A referência orienta a linha, não as versões (KB-001).

### Verificações técnicas da ideação

Pesquisa feita em 2026-10-12, por consulta somente leitura ao registro npm, às releases no GitHub e à documentação oficial.

| # | Verificação | Resultado | Efeito no plano |
| :-- | :-- | :-- | :-- |
| V1 | Versões estáveis | Ver "Versões fixadas" abaixo | Duas divergências com "a versão mais recente": TypeScript e ESLint |
| V2 | Hook "before user created" no plano gratuito | Disponível nos planos Free e Pro, como função Postgres ou HTTP. Roda antes da inserção em `auth.users`, para qualquer provedor; o exemplo oficial bloqueia cadastro por OAuth mantendo o login de usuários existentes. Recusa com `{"error": {"http_code": 4xx, "message": …}}`. Configuração local em `[auth.hook.before_user_created]` do `supabase/config.toml` (`enabled` e `uri = "pg-functions://postgres/<schema>/<função>"`) | Decisão 1 confirmada; fallback por gatilho em `auth.users` não é necessário |
| V3 | Limite de projetos e organização do `mae-no-controle` | A página oficial de preços diz "Limit of 2 active projects" no plano gratuito. Fontes de terceiros acrescentam que o limite é por organização e que projeto pausado não conta, o que a página oficial não detalha. A organização do `mae-no-controle` só é verificável no painel do responsável | Decisão 2 mantida; a vaga livre é precondição do Gate H-C |
| V4 | Pausa por inatividade e cron da Vercel | A página oficial de preços diz que o projeto gratuito é pausado após "1 week of inactivity", sem detalhar o que conta como atividade. Vercel Hobby: até 100 crons por projeto, no mínimo diário, precisão de ±59 min; expressão mais frequente falha no deploy | Decisão 6 confirmada: um cron diário basta; a eficácia é acompanhada por pelo menos 8 dias (Item C4) |
| V5 | Instalabilidade de PWA sem modo offline | Chrome dispensa service worker com `fetch` para instalar pelo menu desde a versão 108 no celular e 112 no desktop. Manifesto exige `name` ou `short_name`, ícones 192 e 512, `start_url`, `display` e HTTPS. O aviso automático de instalação ainda pode depender de `fetch` handler | Decisão D2 |
| V6 | Mudança de grants do Supabase (achado não previsto) | Desde 2026-05-30, projetos novos não expõem tabelas de `public` à Data API sem `GRANT` explícito; em 2026-10-30 a regra passa a valer para projetos existentes. RLS continua obrigatória e independente | Toda migração que cria tabela declara `grant` e `revoke` explícitos, testados no pgTAP; o comportamento padrão do Supabase local não é presumido |
| V7 | Next.js 16 (achado não previsto) | `middleware.ts` foi renomeado para `proxy.ts`, com runtime Node.js por padrão; o exemplo oficial do Supabase usa `proxy.ts` com `updateSession` | O refresh de sessão usa `proxy.ts`; autorização também é checada no servidor, não só no proxy |

### Versões fixadas

Consultadas no registro npm em 2026-10-12. São fixadas sem `^` nem `~` em `package.json`, com `package-lock.json` versionado.

| Pacote | Versão | Observação |
| :-- | :-- | :-- |
| `next`, `eslint-config-next` | 16.4.0 | Publicada em 2026-10-06 |
| `react`, `react-dom`, `@types/react`, `@types/react-dom` | 19.3.0 | |
| `@supabase/ssr` | 0.12.7 | Peer `@supabase/supabase-js` `^2.114.0` |
| `@supabase/supabase-js` | 2.117.3 | Exige Node.js ≥ 22 |
| `supabase` (CLI, dependência de desenvolvimento) | 2.120.0 | Executado com `npx supabase`; release de 2026-10-06 |
| `tailwindcss`, `@tailwindcss/postcss` | 4.3.3 | |
| `zod` | 4.6.7 | |
| `vitest` | 5.0.4 | Node.js 22.12 ou 24 |
| `@playwright/test` | 1.64.0 | |
| `@axe-core/playwright` | 4.13.0 | |
| `typescript` | **6.0.3** | A 7.0.2 é a mais recente, mas o `typescript-eslint` 8.71.2, usado pelo `eslint-config-next`, aceita só TypeScript `<6.1.0` |
| `eslint` | **9.39.5** | A 10.12.0 é a mais recente, mas o `eslint-plugin-react` 7.37.5, usado pelo `eslint-config-next`, aceita só ESLint até `^9.7` |
| `@types/node` | 24.19.2 | Alinhado ao runtime Node.js 24 |
| `server-only` | 0.0.1 | |
| `googleapis/release-please-action` | v5.0.0 | Fixada por SHA no workflow |
| PostgreSQL local | 17 | Padrão do `config.toml` gerado pelo CLI 2.120.0 |

Regra de atualização durante o ciclo: um patch mais novo publicado antes da implementação pode substituir a versão da tabela, com registro na task; mudança de minor ou major exige decisão do responsável. Actions são fixadas por SHA, como no `governance.yml`.

## Escopo

### Dentro do escopo

- Scaffold Next.js (App Router, `src/`), TypeScript estrito, Tailwind 4 com o bloco `@theme` do `DESIGN.md` e a IBM Plex Sans servida a partir de `design-system/assets/fonts/`.
- Qualidade: ESLint, verificação de tipos, Vitest, Playwright com `@axe-core/playwright` e workflow de CI da aplicação.
- release-please com changelog e versionamento a partir dos commits.
- Supabase local (`supabase/config.toml`), migrações de acesso (lista de e-mails autorizados, perfis, funções de papel, hook "before user created" e gatilho de criação de perfil), seed fictício e testes pgTAP de isolamento.
- Autenticação com `@supabase/ssr`: login com Google, callback, refresh de sessão em `proxy.ts`, saída, área autenticada mínima e login por senha restrito ao ambiente local e ao CI.
- Previews sem backend, com aviso visível.
- Produção: rota de keepalive com cron diário da Vercel, manifesto PWA e ícones derivados do símbolo, e roteiro de configuração e operação de acessos (KB-002).
- Atualização dos consumidores de governança estritamente necessários: manifesto do validador; em `_project/README.md`, a tabela de enforcement de G2, os gates mínimos e a exceção da branch e do commit gerados pelo release-please.
- Transição deste plano para `Em Execução` e do ciclo para `Em execução` em `cycles.md`.

### Fora do escopo

- Tabelas de carteira (ativos, eventos, posições, consolidado, benchmarks e séries) e qualquer cálculo financeiro (ciclo `002`).
- Aplicação do fuso `America/Cuiaba` a regras de período (ciclo `002`).
- Telas de produto, barra inferior, menu lateral, tela de administração de acessos e biblioteca de gráficos (ciclo `003`).
- Migração de dados e acesso ao SQLite de origem (ciclo `004`).
- Tema escuro, modo offline e service worker (D2).
- Sincronização com o SGS.
- Segundo projeto Supabase para previews; migrações aplicadas por CI; integração GitHub do Supabase.
- Prettier, Storybook, monitoramento externo, analytics ou qualquer dependência fora da ADR-002 e desta tabela.
- Auditoria do histórico e abertura do repositório (ADR-003).
- Alterar os repositórios de referência.

## Decisões e autoridades

### Decisões herdadas da ideação

As decisões 1 a 8 da ideação continuam válidas; as verificações V2 a V5 não invalidaram nenhuma. Consequências técnicas registradas aqui, sem alterar as decisões:

- **Decisão 1 (bloqueio):** hook "before user created" como função Postgres, porque V2 o confirmou no plano gratuito. O gatilho em `auth.users` não substitui o hook: ele é a segunda barreira, caso o hook esteja desligado ou mal configurado (ver "Modelo de acesso").
- **Decisão 2 (previews):** as variáveis do Supabase existem só no ambiente Production da Vercel. Sem elas, a aplicação exibe "Preview sem backend" e não tenta autenticar.
- **Decisão 3 (migrações):** `npx supabase db push` executado pelo responsável, com `npx supabase migration list` como evidência. Nenhum segredo com escrita no banco fica no GitHub ou na Vercel.
- **Decisão 6 (keepalive):** cron diário da Vercel chama rota protegida por `CRON_SECRET`, que executa uma função SQL trivial. A chave usada é a publicável (antiga `anon`); a chave secreta do Supabase não é configurada na Vercel.
- **Decisão 8 (ponta a ponta):** o formulário de senha só é renderizado quando `NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN=true`, definido apenas no ambiente local e no CI. Em produção, o provedor de senha fica desabilitado no Supabase, o que mantém o bloqueio mesmo se a variável vazar.

### Decisões novas, respondidas pelo responsável

Respondidas em 2026-10-12, antes da abertura da revisão formal: o responsável escolheu a opção (a) em D1, D2 e D3, que era a recomendação do agente.

**D1 — Revogação de acesso.** O hook só roda na criação do usuário: remover um e-mail da lista não impede o login de uma conta já criada. A ADR-003 não trata a revogação.

| Opção | Efeito | Custo ou risco |
| :-- | :-- | :-- |
| **(a) Escolhida:** procedimento SQL do responsável, documentado na KB-002, que remove o e-mail da lista e exclui o usuário de `auth.users`; o perfil cai em cascata e as sessões deixam de renovar | Revogação completa e simples; testada no pgTAP (após a exclusão, o ex-usuário não lê nada) | Passo manual; o JWT já emitido vale até expirar (1 h, padrão do Supabase) |
| (b) Hook "custom access token" que recusa emissão e renovação de token para e-mail fora da lista | Revogação automática | A documentação não afirma explicitamente que o erro do hook bloqueia a emissão; mais uma função crítica a testar |
| (c) Nada neste ciclo | Mais simples | Contraria o espírito da ADR-003 |

**D2 — PWA sem service worker.** Exemplos: no Android com Chrome, o usuário instala pelo menu "Instalar app"; no iOS, por "Adicionar à Tela de Início". O aviso automático de instalação pode não aparecer.

| Opção | Efeito | Custo ou risco |
| :-- | :-- | :-- |
| **(a) Escolhida:** só manifesto e ícones, sem service worker | Coerente com "sem modo offline" (ADR-002) e com V5 | Sem aviso automático garantido |
| (b) Service worker mínimo com `fetch` de repasse | Aumenta a chance do aviso automático | Código que existe só para enganar a heurística, prática que o próprio Chrome desestimula; risco de cache indevido de página autenticada |

**D3 — Versão inicial.** O release-please passa a gerar versões a partir dos commits `feat` e `fix`.

| Opção | Efeito |
| :-- | :-- |
| **(a) Escolhida:** começar em `0.1.0`, com `bump-minor-pre-major`, e reservar `1.0.0` para a virada do ciclo `004` | A versão comunica que o produto ainda não substitui o Meus-Investimentos |
| (b) Começar em `1.0.0` | Igual ao `mae-no-controle`, mas sugere produto pronto |

### Regra de papel adotada na v2

Resposta ao bloqueador B3 da rodada 1, adotada pela recomendação da revisão e **confirmada pelo responsável em 2026-10-12**, antes da rodada 2.

- `public.authorized_emails` define quem pode criar conta e com que papel inicial. Depois do primeiro login, a autoridade do papel é `public.profiles.role`, e `private.is_admin()` lê só o perfil.
- A lista não aceita `update` pela Data API: o `admin` autoriza (insere) e retira (exclui) e-mails, mas não altera o papel de uma linha. Assim, nenhuma alteração na lista aparenta mudar o papel de uma conta existente.
- Mudar o papel de uma conta existente é um procedimento SQL do responsável, documentado na KB-002, que atualiza `profiles.role` e, por coerência, `authorized_emails.role`.
- Exemplo: se `usuario.a@example.com` entrou como `user`, torná-lo `admin` exige o procedimento da KB-002. Excluir a linha dele da lista impede um novo cadastro, mas a conta atual só deixa de existir pelo procedimento de revogação (D1).
- Alternativas descartadas: sincronizar o perfil por gatilho a cada alteração da lista (mais código crítico, e o `admin` passaria a promover contas existentes sem procedimento); manter `update` na lista sem efeito no perfil (ambíguo).

### Modelo de acesso

- `public.authorized_emails`: `email` (texto, único, normalizado em minúsculas e sem espaços por restrição `check`), `role` (papel inicial: `admin` ou `user`) e `created_at`. RLS: somente `admin` lê, insere e exclui; nenhuma política nem grant de `update`; `user` não tem acesso; `supabase_auth_admin` só lê, por política própria, para o hook.
- `public.profiles`: `user_id` (chave primária, referência a `auth.users` com `on delete cascade`), `email`, `role` (autoridade do papel) e `created_at`. RLS: cada usuário lê só o próprio perfil; ninguém altera pela Data API; o `admin` não lê perfis alheios.
- Schema `private`, fora dos schemas expostos pela Data API (`[api] schemas`), com:
  - `private.is_admin()`: `security definer`, `stable`, lê `public.profiles.role` pelo `auth.uid()`;
  - `private.before_user_created(event jsonb)`: sem `security definer` (orientação da documentação do Supabase), recusa com `403` o e-mail ausente da lista ou nulo, comparando em minúsculas;
  - `private.handle_new_user()`: gatilho `after insert` em `auth.users`, `security definer`, que cria o perfil com o papel inicial da lista, no padrão documentado pelo Supabase. Se o e-mail estiver ausente da lista ou for nulo, a função lança exceção com mensagem genérica, o que aborta a criação do usuário. É a segunda barreira, caso o hook esteja desligado ou mal configurado.
- Funções: toda função criada pelo ciclo, com ou sem `security definer`, tem `set search_path = ''` e nomes qualificados pelo schema (lint `0011_function_search_path_mutable` do Security Advisor). Todas recebem `revoke execute … from public`, porque o PostgreSQL concede `EXECUTE` a `PUBLIC` por padrão. Grants pontuais: `is_admin()` para `authenticated`; `before_user_created()` para `supabase_auth_admin`; `keepalive()` (Item C1) para `anon`; `handle_new_user()` sem grant, porque só o gatilho a chama.
- Schemas: `grant usage on schema private to authenticated, supabase_auth_admin` e `grant usage on schema public to supabase_auth_admin`.
- Tabelas (V6): `revoke all` de `anon` e `public`; `grant` a `authenticated` só dos comandos que alguma política permite (`authorized_emails`: `select`, `insert` e `delete`; `profiles`: `select`); `grant select` em `authorized_emails` a `supabase_auth_admin`; RLS ativa em toda tabela de `public`.
- O primeiro administrador de produção é inserido na lista pelo responsável, no editor SQL do Supabase, **antes do primeiro login dele**, pelo procedimento da KB-002. O e-mail não entra no repositório.

Se o painel do Supabase não permitir apontar o hook para o schema `private`, a função passa para `public`, com `execute` revogado de `anon`, `authenticated` e `public`, e o desvio é registrado na task C.

### Gates humanos

Cada gate exige manifestação explícita do responsável, posterior à sua precondição. Silêncio, aprovação de gate anterior ou recomendação de handoff não satisfazem o gate seguinte.

| Gate | Precondição | Autoriza | Não autoriza | Evidência |
| :-- | :-- | :-- | :-- | :-- |
| **R — revisão** | Este rascunho completo e autorização explícita para revisar | Executar `revisar_plano`, mudar o status para `Em Revisão` e registrar o parecer | Aprovar, versionar, publicar, criar issue ou implementar | Parecer na seção "Revisão crítica" |
| **P — aprovação do plano** | Veredito `APTO PARA APROVAÇÃO` ou `APTO COM RESSALVAS`; D1 a D3 respondidas; regra de papel adotada na `v2` confirmada; manifestação posterior ao veredito | Marcar `Aprovado`; criar `chore/cycle-001-plan` a partir de `main` com a ideação, este plano e `cycles.md`; abrir a PR documental e integrá-la com checks verdes; executar `criar_issues` para A, B e C após apresentar o payload | Branch de issue, implementação ou qualquer configuração externa | PR integrada e URLs das issues |
| **X-A — execução da issue A** | Gate P concluído e issues abertas | Implementar a issue A em `chore/issue-N`, com task, commits e PR A; instalar dependências pelo npm; na mesma PR, mudar este plano para `Em Execução` e o ciclo para `Em execução` em `cycles.md` (Item A0) | Merge; iniciar B | Task A com checks reais |
| **M-A — merge da PR A** | Checks `Governance` e `CI` verdes; diff revisado; opção "Allow GitHub Actions to create and approve pull requests" habilitada pelo responsável nas configurações do repositório | Merge da PR A por squash | Iniciar B sem nova autorização | Merge verificável no GitHub |
| **X-B — execução da issue B** | M-A concluído | Implementar a issue B em `feature/issue-N`, com task, commits e PR B; usar Docker local para o Supabase | Merge; tocar em qualquer projeto remoto | Task B com checks reais |
| **M-B — merge da PR B** | Checks verdes, incluindo `supabase test db` e ponta a ponta; revisão manual das políticas RLS e das funções registrada na PR | Merge da PR B por squash | `db push` em produção; iniciar C sem nova autorização | Merge verificável e revisão das políticas |
| **X-C — execução da issue C** | M-B concluído | Implementar a issue C em `feature/issue-N`, com task, commits, PR C e a KB-002 | Merge; executar qualquer configuração externa | Task C com checks reais |
| **H-C — configuração externa** | PR C aberta, com o roteiro da KB-002 apresentado | O responsável executa, nos painéis, as configurações de Google Cloud, Supabase, Vercel e Cloudflare, o primeiro `db push` e a inserção do primeiro administrador; o agente orienta e confere por leitura o que estiver acessível | O agente fazer login, aceitar termos, criar contas ou manipular credenciais | Checklist da KB-002 marcado na task, sem segredos nem e-mails |
| **M-C — merge da PR C** | H-C concluído e checks verdes | Merge da PR C, com deploy de produção pela Vercel | Release; encerramento | Merge e deploy verificáveis |
| **V-C — verificação em produção** | M-C; segundo `db push` (migração do keepalive) feito pelo responsável, com `migration list` | Registrar as evidências de produção listadas no Item C4 | Corrigir falha encontrada; encerramento | Evidências sem dados reais |
| **X-F — execução de uma correção** | Falha registrada no Gate V-C, elegível à trilha curta pelos critérios de `_project/README.md`, com o payload da issue apresentado | Abrir aquela issue `[FIX]` pelo `bug_report.yml`, com a opção "trilha curta"; implementar só aquela correção em `fix/issue-N`, com task em `_project/fixes/`, teste que reproduz a falha e PR | Merge; outra correção; correção não elegível, que para a cadeia e devolve o plano à revisão | Issue, task da trilha curta e checks reais |
| **M-F — merge de uma correção** | Checks verdes da PR de correção e diff revisado | Merge daquela PR por squash e nova verificação dos itens afetados do Item C4 | Merge de outra correção; release; encerramento | Merge verificável e item do C4 reverificado |
| **M-R — release** | V-C concluído, sem correção pendente; PR do release-please com checks executados por `workflow_dispatch` | Merge da PR de release, com tag e release no GitHub | Encerramento | Tag e release verificáveis |
| **E — encerramento** | M-R concluído | Criar `chore/cycle-001-closure`, task de closure, atualizar `README.md` e `cycles.md`, mover o ciclo para `executed/`, abrir e integrar a PR com checks verdes e reconciliar após o merge | Qualquer mudança fora do encerramento documental | Task de closure e `cycles.md` reconciliados |

Os Gates X-F e M-F se repetem para cada correção: autorizar uma correção não autoriza outra, e cada PR de correção tem seu próprio merge.

Toda cadeia autorizada para nas situações: check falho; conflito; arquivo inesperado no diff; segredo, e-mail real ou dado do usuário em qualquer artefato; teste de isolamento falho; verificação técnica que contradiga uma decisão; necessidade de ampliar escopo ou de nova dependência; divergência entre o configurado em produção e o roteiro da KB-002; falha em produção sem Gate X-F concedido.

## Barreiras de domínio

| Barreira | Aplica-se? | Como o ciclo a atende ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | O ciclo não cria regra de cálculo, quantia monetária nem tabela de carteira. Os testes de casos de referência começam no ciclo `002` |
| G2 — isolamento por RLS | Sim | Toda tabela de `public` com RLS e grants explícitos (V6); pgTAP com dois usuários fictícios e um `admin` provando leitura e escrita negadas entre usuários e ausência de bypass do `admin`; teste genérico que falha se alguma tabela de `public` estiver sem RLS; toda função com `search_path` fixo e `execute` revogado de `public`, verificados por consulta a `pg_proc`; gatilho de perfil como segunda barreira ao hook; revisão manual no Gate M-B. A heurística do validador continua ativa |
| G3 — privacidade de dados | Sim | `.env.example` só com nomes; segredos apenas nos painéis; seed e testes com e-mails fictícios em `example.com`; o e-mail do primeiro administrador só no banco de produção; previews sem backend; evidências de produção sem e-mail nem print com dado real |
| G4 — migrações só acrescentam | Sim | Primeiras migrações versionadas com o nome gerado por `supabase migration new`; o passo de CI existente passa a ter alvo real; correções só por nova migração. O `db push` não edita migração |

## Estratégia de testes

| Campo | Definição |
| :-- | :-- |
| **Classificação da mudança** | Scaffold de aplicação, autenticação, schema de acesso com RLS, CI, configuração de deploy e documentação de operação |
| **Riscos protegidos** | Cadastro de e-mail fora da lista, inclusive com o hook desligado; leitura ou escrita entre usuários; bypass do `admin`; escalada de papel pelo próprio usuário ou pela lista; função sem `search_path` fixo ou executável por papel indevido; tabela sem RLS ou exposta a `anon`; login por senha em produção; preview com backend; cron ou manifesto redirecionados para o login; segredo versionado; regressão visual dos tokens; violação de acessibilidade |
| **TDD** | Aplicável às migrações de acesso: os testes pgTAP de isolamento, do hook e do gatilho são escritos antes das políticas e funções e falham sem elas. Aplicável aos utilitários de servidor (validação de ambiente com Zod e decisão "com ou sem backend") |
| **Unitário (Vitest)** | Esquema de variáveis de ambiente; detecção de preview sem backend; verificação do `CRON_SECRET` na rota de keepalive |
| **Banco (pgTAP, `supabase test db`)** | RLS em todas as tabelas de `public`; `anon` sem privilégios; usuário A sem acesso ao perfil de B; `user` sem acesso à lista; `admin` lê, insere e exclui na lista, não altera linha e não lê perfil alheio; `user` sem alteração do próprio papel; hook recusa e-mail ausente da lista ou nulo e aceita e-mail listado, inclusive escrito com outra combinação de maiúsculas; gatilho cria o perfil com o papel inicial da lista e, numa inserção direta em `auth.users` que simula o hook desligado, lança exceção para e-mail ausente ou nulo; revogação de D1 deixa o ex-usuário sem linhas; toda função dos schemas `public` e `private` com `search_path` fixo, sem `execute` para `public` e com `execute` só para os papéis previstos |
| **Ponta a ponta (Playwright, Supabase local)** | Login por senha de usuário fictício autorizado, área autenticada com perfil e saída; cadastro por senha de e-mail fora da lista recusado, com a ausência do usuário conferida pelo cliente administrativo do `supabase-js` (Item B3); rota protegida redireciona sem sessão; a partir da issue C, `/api/keepalive`, o manifesto e os ícones respondem sem redirecionar para `/entrar`; página de entrada sem violações `axe` (WCAG 2.2 AA) |
| **Manual em produção (Gate V-C)** | Login com Google do responsável; recusa de conta Google não autorizada, se o responsável dispuser de uma; chamada do cron registrada nos logs da Vercel; instalação do PWA pelo menu no celular; Security Advisor do Supabase sem alertas de RLS, grants ou `search_path`; preview de PR com o aviso "sem backend"; acompanhamento do projeto Supabase ativo por pelo menos 8 dias após o deploy |
| **Checks bloqueantes** | `Governance` (existente) e `CI` (novo): `npm ci`, lint, tipos, Vitest, build, `supabase test db` e Playwright |
| **Revisão manual** | Políticas RLS, grants, funções (em especial as `security definer`), configuração do hook, conteúdo de `.env.example`, ausência de dados do usuário |
| **Tooling** | Node.js 24, npm com `package-lock.json`, Supabase CLI pelo `npx`, Docker do runner `ubuntu-latest` |

Comandos locais por entrega, além dos gates mínimos de `_project/README.md`:

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npx supabase start
npx supabase test db
npm run test:e2e
```

Os comandos de Supabase e ponta a ponta valem a partir da issue B.

## Itens de implementação

### Item A0 — Transição para execução (issue A)

**Contexto:** o `_project/README.md` exige que o plano passe a `Em Execução` quando a primeira entrega começa, e o `implementar_issue` não faz essa transição.

**Ação técnica:**

- Na PR A, mudar o `Status` deste plano para `Em Execução` e preencher, em "Rastreabilidade", as issues A, B e C e a branch da issue A.
- Na mesma PR, atualizar `_project/cycles.md`: ciclo `001` em `Em execução` e as issues A, B e C, com links, na coluna "Issues".
- As PRs B e C acrescentam suas branches em "Rastreabilidade"; o encerramento consolida PRs, merges e o estado final.

**Critérios de aceite:**

- [ ] O diff da PR A contém as duas transições, coerentes entre si.
- [ ] O validador passa com o plano `Em Execução` em `_project/drafts/` e o ciclo `Em execução`.

### Item A1 — Scaffold, tokens e fonte (issue A)

**Contexto:** não há aplicação. O `DESIGN.md` define o contrato visual e a origem local da fonte.

**Ação técnica:**

- Criar `package.json` (`private`, `type: module`, `engines.node` `>=24`), `package-lock.json`, `tsconfig.json` estrito, `next.config.ts`, `postcss.config.mjs` e `eslint.config.mjs`, com as versões da tabela.
- Criar `src/app/layout.tsx` (`lang="pt-BR"`) e `src/app/globals.css` com o bloco `@theme` da seção 5 do `DESIGN.md`, idêntico ao contrato.
- Servir a IBM Plex Sans a partir de `design-system/assets/fonts/`, sem copiar os arquivos nem usar CDN. O mecanismo é livre, desde que atenda aos critérios: por exemplo, `@font-face` no CSS ou `next/font/local` com `declarations` de `font-family`.
- Criar uma página inicial pública provisória com o logo e um texto de apresentação, usando só tokens do contrato.
- Scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`.
- Expandir o `README.md` com uma seção "Desenvolvimento local" (pré-requisitos e comandos), sem prometer funcionalidade inexistente.

**Critérios de aceite:**

- [ ] `npm ci`, `npm run lint`, `npm run typecheck` e `npm run build` passam.
- [ ] O bloco `@theme` de `globals.css` é idêntico ao da seção 5 do `DESIGN.md`, conferido por comparação textual, e não existe cor fora dele (`--color-*: initial` presente).
- [ ] A `font-family` computada do `body` resolve para "IBM Plex Sans", e os arquivos de fonte vêm do próprio site, sem requisição a terceiros, conferido no navegador.
- [ ] Os valores numéricos renderizados usam algarismos de largura igual (`DESIGN.md`, seção 3.2), conferidos no navegador.
- [ ] Nenhuma versão com `^` ou `~` em `package.json`.

### Item A2 — Qualidade e CI da aplicação (issue A)

**Contexto:** os ciclos seguintes dependem de testes confiáveis antes da primeira regra financeira.

**Ação técnica:**

- `.env.example` com os nomes `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, sem valores, e o esquema de ambiente com Zod que os declara opcionais: sem eles, a aplicação roda sem backend. As issues B e C acrescentam suas variáveis.
- `vitest.config.ts` e um primeiro teste unitário (esquema de ambiente com Zod).
- `playwright.config.ts` com servidor de build de produção, só o navegador Chromium, e um teste da página inicial com `@axe-core/playwright`.
- `.github/workflows/ci.yml`: `pull_request` e `push` para `main`, mais `workflow_dispatch`; `permissions: contents: read`; `concurrency` com `cancel-in-progress`; `timeout-minutes` em cada job; actions fixadas por SHA; `actions/setup-node` com Node 24 e `package-manager-cache: false` (lição de 2026-08-12); passos de `npm ci`, lint, tipos, Vitest, build e Playwright.
- `scripts/governance-manifest.json`: tornar obrigatórios `package.json`, `.github/workflows/ci.yml` e `.env.example`, com texto exigido em `ci.yml` (`contents: read`, `package-manager-cache: false`). A issue B acrescenta `supabase test db`.
- `_project/README.md`, seção "Gates mínimos": acrescentar os comandos da aplicação.

**Critérios de aceite:**

- [ ] O workflow `CI` passa na PR A, e o tempo de execução fica registrado na task para acompanhar a cota de minutos.
- [ ] `.env.example` existe só com nomes, e o validador o exige.
- [ ] O validador passa com o manifesto atualizado, e só o manifesto mudou no tooling de governança.
- [ ] O teste `axe` falha diante de uma violação introduzida de propósito, com demonstração registrada na task.

### Item A3 — release-please (issue A)

**Contexto:** a ADR-002 e o `_project/README.md` preveem versão e notas a partir dos commits desde o ciclo `001`.

**Ação técnica:**

- `release-please-config.json` (`release-type: node` e `bump-minor-pre-major`, conforme D3) e `.release-please-manifest.json` com `{".": "0.0.0"}`, com a mesma versão em `package.json`, para que o primeiro `feat` gere `0.1.0`.
- `.github/workflows/release-please.yml` em `push` para `main`, com `permissions` mínimas (`contents: write` e `pull-requests: write`) e a action fixada por SHA.
- `_project/README.md`, seção "Branches, commits e migrações": registrar a exceção da branch e do commit gerados pelo release-please (esperados `release-please--branches--main` e `chore(main): release x.y.z`), com os nomes conferidos na primeira execução.
- Registrar na task que PRs abertas com o `GITHUB_TOKEN` não disparam outros workflows: os checks da PR de release são executados por `workflow_dispatch` (Gate M-R).
- A opção "Allow GitHub Actions to create and approve pull requests" é precondição do Gate M-A.

**Critérios de aceite:**

- [ ] Após o merge da PR A, o workflow roda sem erro. Um commit `chore` não abre release; a primeira PR de release aparece após um `feat` e propõe `0.1.0`.
- [ ] A exceção do release-please está registrada em `_project/README.md`, com os nomes reais.
- [ ] `CHANGELOG.md` não é criado manualmente.

### Item B1 — Supabase local e migrações de acesso (issue B)

**Contexto:** a ADR-003 exige lista de acessos no banco, perfis e RLS por usuário.

**Ação técnica:**

- `npx supabase init`, com `supabase/config.toml` ajustado:
  - `[auth] site_url = "http://127.0.0.1:3000"`;
  - `[auth.email] enable_signup = true` e `enable_confirmations = false`, somente local;
  - `[auth.hook.before_user_created] enabled = true` e `uri = "pg-functions://postgres/private/before_user_created"`;
  - serviços não usados (Storage, Realtime, Edge Runtime, Analytics) desabilitados para acelerar o CI, se o CLI permitir sem afetar Auth.
- Migrações criadas com `npx supabase migration new`, conforme o "Modelo de acesso" e a "Regra de papel adotada na v2": tipos e tabelas com RLS e grants; schema `private` e funções, todas com `set search_path = ''` e `revoke execute … from public`; gatilho de perfil com recusa de e-mail fora da lista; `grant usage` de schemas e grants do hook para `supabase_auth_admin`.
- `supabase/seed.sql` só com e-mails fictícios em `example.com`: um `admin` e dois `user` autorizados.

**Critérios de aceite:**

- [ ] `npx supabase db reset` aplica migrações e seed sem erro.
- [ ] O validador reconhece RLS em todas as tabelas de `public` e aceita os nomes das migrações.
- [ ] Nenhuma migração depende de privilégio padrão do Supabase para funcionar (V6).

### Item B2 — Testes de banco de isolamento (issue B)

**Contexto:** a barreira G2 prevê o teste de banco a partir deste ciclo.

**Ação técnica:**

- `supabase/tests/database/*.test.sql` com pgTAP, cobrindo os cenários de banco da "Estratégia de testes", com um auxiliar local que simula usuários por `set local role` e `request.jwt.claims`, sem extensões de terceiros.
- No `ci.yml`, job com Supabase local: `npx supabase start`, `npx supabase test db`, e as variáveis da aplicação lidas de `npx supabase status -o env`. O job herda `concurrency` e tem `timeout-minutes` próprio; seu tempo de execução é registrado na task.
- Manifesto: texto exigido `supabase test db` em `ci.yml`.
- `_project/README.md`: mover "Teste de banco de isolamento" de "Automatização prevista" para "Automatizado" na tabela de enforcement de G2.

**Critérios de aceite:**

- [ ] Cada teste de isolamento falha com a política correspondente removida, com demonstração registrada na task.
- [ ] O job do Supabase passa no CI.
- [ ] A revisão manual das políticas e funções `security definer` está registrada na PR B.

### Item B3 — Autenticação e área autenticada (issue B)

**Contexto:** decisões 1, 2, 5 e 8 da ideação.

**Ação técnica:**

- Clientes `@supabase/ssr` de navegador e servidor, e `src/proxy.ts` com o refresh de sessão. O `proxy.ts` não redireciona: seu matcher exclui arquivos estáticos, ícones, o manifesto e `/api/keepalive`, e a proteção de `/` é feita no servidor.
- Rotas: `/entrar` (botão "Entrar com Google" e, quando `NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN=true`, formulário de senha), `/auth/callback` (troca do código pela sessão), `/sair` (`POST`) e `/` protegida.
- A página `/` verifica a sessão no servidor e mostra logo, aviso "em construção", e-mail e papel do próprio usuário e a ação de sair, com os tokens do `DESIGN.md`.
- Mensagem neutra quando o hook recusa o cadastro, sem revelar quais e-mails estão autorizados.
- Sem as variáveis do Supabase, todas as rotas exibem "Preview sem backend" e não chamam o Supabase.
- Acrescentar `NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN` ao `.env.example` e ao esquema de ambiente.
- Testes ponta a ponta da "Estratégia de testes" no job do Supabase. Para conferir que o cadastro recusado não cria usuário, o teste usa o cliente administrativo do `supabase-js` com a chave secreta do Supabase local, lida de `npx supabase status -o env` e usada só no ambiente local e no CI. Essa chave não entra em `.env.example` nem na Vercel, e nenhuma dependência nova é adicionada.

**Critérios de aceite:**

- [ ] Usuário fictício autorizado entra, vê o próprio perfil e sai.
- [ ] Cadastro por senha de e-mail fora da lista é recusado e não cria linha em `auth.users`, conferido no teste.
- [ ] Sem sessão, `/` redireciona para `/entrar`.
- [ ] Sem variáveis do Supabase, o build passa e as páginas mostram o aviso de preview.

### Item C1 — Keepalive (issue C)

**Contexto:** decisão 6 e V4.

**Ação técnica:**

- Migração com `public.keepalive()`, função `security invoker` com `set search_path = ''` que só executa `select 1`, sem acesso a tabela, com `execute` revogado de `public` e concedido a `anon`.
- Rota `GET /api/keepalive` que exige `Authorization: Bearer <CRON_SECRET>` e chama a função; responde `401` sem o segredo.
- Acrescentar `CRON_SECRET` ao `.env.example` e ao esquema de ambiente.
- `vercel.json` com um cron diário.

**Critérios de aceite:**

- [ ] Teste unitário cobre a recusa sem segredo e o sucesso com segredo.
- [ ] Sem segredo e sem sessão, `GET /api/keepalive` responde `401`, e não um redirecionamento para `/entrar`, conferido em teste ponta a ponta.
- [ ] A função não lê nenhuma tabela e atende às regras de função do "Modelo de acesso", conferido no pgTAP.

### Item C2 — PWA e ícones (issue C)

**Contexto:** decisão 5 da ADR-002, `DESIGN.md` seção 8 e D2.

**Ação técnica:**

- `src/app/manifest.ts` com `name` "Saldo Futuro", `short_name`, `start_url` `/`, `display: standalone`, `theme_color` `#0b2a55` (`primary`), `background_color` `#ffffff` e ícones 192 e 512, incluindo uma versão `maskable` com área de segurança.
- Ícones PNG 180 (Apple), 192 e 512 e favicon, derivados de `design-system/assets/logo-simbolo.svg` sem alterar o desenho. A ferramenta de conversão usada e os hashes dos arquivos são registrados na task; não se adiciona dependência para isso.
- Versão em branco do símbolo para fundo `primary` (`DESIGN.md`, 8.3), se algum ícone a exigir.

**Critérios de aceite:**

- [ ] O painel Application do Chrome não aponta erro de manifesto.
- [ ] Sem sessão, o manifesto e os ícones respondem `200`, sem redirecionamento, conferido em teste ponta a ponta.
- [ ] O símbolo continua reconhecível a 16 px e legível a 32 px.

### Item C3 — Roteiro de produção e operação de acessos (issue C)

**Contexto:** as configurações externas são ações do responsável e precisam de roteiro verificável e sem segredos.

**Ação técnica:** criar `_project/knowledge/KB-002_operacao_producao_acessos.md` pelo template `kb.md`, com:

- Supabase: verificação da vaga no plano gratuito (V3), criação do projeto (região recomendada `sa-east-1`), versão do PostgreSQL compatível com a local, provedor Google habilitado, URL do site e de redirecionamento, hook "before user created" apontado para a função, `supabase link`, `db push` e `migration list`, Security Advisor;
- Supabase, armadilha a evitar: desabilitar só o provedor de e-mail (senha), mantendo habilitada a opção geral de cadastro de novos usuários. Desligar essa opção geral recusaria também o primeiro login com Google;
- Google Cloud: cliente OAuth web, tela de consentimento externa publicada com escopos básicos, URI de redirecionamento do Supabase;
- Vercel: importação do repositório, variáveis apenas em Production, `CRON_SECRET`, domínio;
- Cloudflare: registro `CNAME` de `investimentos` para o destino indicado pela Vercel, sem proxy;
- GitHub: permissão do Actions para abrir PRs (Item A3);
- Procedimentos SQL do responsável: inserir o primeiro `admin` na lista antes do primeiro login dele; autorizar um e-mail; mudar o papel de uma conta existente, atualizando `profiles.role` e `authorized_emails.role` (regra de papel da `v2`); revogar acesso (D1);
- Acompanhamento do keepalive: conferir no painel que o projeto continua ativo pelo menos 8 dias após o deploy.

**Critérios de aceite:**

- [ ] A KB não contém segredo, chave, e-mail real nem identificador de projeto.
- [ ] Cada passo indica quem executa e qual evidência gera.

### Item C4 — Verificação em produção (issue C, Gate V-C)

**Ação técnica:** após o merge da PR C e o segundo `db push`, registrar:

- login com Google do responsável e área autenticada com papel `admin`, descritos em texto, sem e-mail;
- recusa de conta Google não autorizada, se disponível; caso contrário, a prova é o teste de CI do mesmo hook, registrado como limitação;
- execução do cron nos logs da Vercel e resposta `401` sem segredo;
- instalação do PWA pelo menu em um celular;
- Security Advisor do Supabase sem alertas de RLS, grants ou `search_path`;
- `migration list` com local e remoto alinhados;
- preview de uma PR exibindo "Preview sem backend";
- acompanhamento: projeto Supabase ativo pelo menos 8 dias após o deploy de produção. Se o encerramento ocorrer antes desse prazo, a task de closure registra a data prevista da conferência como acompanhamento aberto, e uma pausa constatada depois é tratada pela trilha curta.

**Critérios de aceite:**

- [ ] Todas as evidências acima registradas na task de closure, ou a limitação justificada.
- [ ] Falha em qualquer item bloqueia o encerramento. Cada correção segue a trilha curta, com issue `[FIX]` própria e os Gates X-F e M-F; correção não elegível para a cadeia e devolve o plano à revisão.

## Arquivos afetados

| Ação | Arquivo |
| :-- | :-- |
| Criar (A) | `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.ts`, `playwright.config.ts` |
| Criar (A) | `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`, testes iniciais em `src/**/*.test.ts` e `tests/e2e/` |
| Criar (A) | `.github/workflows/ci.yml`, `.github/workflows/release-please.yml`, `release-please-config.json`, `.release-please-manifest.json`, `.env.example` |
| Atualizar (A) | `README.md`, `scripts/governance-manifest.json`, `_project/README.md` (gates mínimos e exceção do release-please), este plano (`Em Execução` e rastreabilidade) e `_project/cycles.md` (`Em execução` e issues) |
| Criar (B) | `supabase/config.toml`, `supabase/migrations/*.sql`, `supabase/seed.sql`, `supabase/tests/database/*.test.sql` |
| Criar (B) | `src/proxy.ts`, `src/lib/supabase/*`, `src/app/entrar/`, `src/app/auth/callback/`, `src/app/sair/`, testes ponta a ponta |
| Atualizar (B) | `src/app/page.tsx`, `.env.example`, `.github/workflows/ci.yml`, `scripts/governance-manifest.json`, `_project/README.md` (enforcement de G2), este plano (rastreabilidade) |
| Criar (C) | Migração do keepalive, `src/app/api/keepalive/route.ts`, `vercel.json`, `src/app/manifest.ts`, ícones em `public/` ou `src/app/`, `_project/knowledge/KB-002_operacao_producao_acessos.md` |
| Atualizar (C) | `.env.example`, este plano (rastreabilidade) |
| Criar (correção, se houver) | `_project/fixes/fix_task_issue-N.md` e os arquivos da correção, pela trilha curta |
| Gerado (release-please) | `CHANGELOG.md`, versão em `package.json` e `.release-please-manifest.json` |
| Atualizar/mover (E) | Este plano, tasks, `README.md` e `_project/cycles.md`; diretório para `_project/executed/001_fundacao_aplicacao/` |

`.gitignore` não deve precisar de mudança; se precisar, a mudança é registrada na task e conferida pelo validador.

## Decomposição em issues e PRs

| Unidade | Tipo | Branch | Conteúdo | Gates |
| :-- | :-- | :-- | :-- | :-- |
| PR do plano | documental | `chore/cycle-001-plan` | Ideação, este plano e `cycles.md` | P |
| Issue A / PR A | `[CHORE]` | `chore/issue-N` | Itens A0 a A3 | X-A, M-A |
| Issue B / PR B | `[FEATURE]` | `feature/issue-N` | Itens B1 a B3 | X-B, M-B |
| Issue C / PR C | `[FEATURE]` | `feature/issue-N` | Itens C1 a C4 | X-C, H-C, M-C, V-C |
| Issue de correção / PR de correção (se houver) | `[FIX]`, trilha curta | `fix/issue-N` | Uma falha encontrada no Gate V-C | X-F, M-F |
| PR de release | gerada | `release-please--branches--main` | Versão e changelog | M-R |
| PR de encerramento | documental | `chore/cycle-001-closure` | Closure, `README.md`, `cycles.md` e movimentação | E |

As issues são sequenciais: B usa o CI e o scaffold de A; C usa o schema e a autenticação de B. Os títulos das PRs seguem Conventional Commits, porque o squash usa o título como mensagem e o release-please o lê. Se a issue C ficar grande, ela pode ser dividida em C (código) e D (KB-002 e verificação) sem mudar o ciclo, com registro nesta seção antes do Gate P.

## Dependências e blockers

- **Bloqueador atual:** Gate X-A (autorização explícita para implementar a issue A), após a PR do plano integrada e as issues criadas. O Gate P foi concedido em 2026-10-12.
- A ideação e a alteração de `cycles.md` ainda não estão versionadas; entram na PR do plano (Gate P).
- Ações do responsável, sem as quais a cadeia para: permissão do Actions para abrir PRs (precondição do Gate M-A); contas e aceite de termos em Google Cloud, Supabase e Vercel; vaga de projeto no Supabase; acesso ao DNS no Cloudflare (Gate H-C).
- Docker disponível localmente e no runner para o Supabase local.
- Nenhuma dependência de checkout irmão; o `mae-no-controle` é referência documental por commit.

## Riscos, suposições e rollback

| Risco | Mitigação |
| :-- | :-- |
| Política RLS permissiva ou `admin` com bypass expõe dados | pgTAP com dois usuários e um `admin`, teste genérico de RLS, revisão manual no Gate M-B |
| Função sequestrada por `search_path` ou executável por papel indevido | `set search_path = ''` em toda função, nomes qualificados, `revoke execute … from public` e verificação em `pg_proc` no pgTAP |
| Tabela exposta pela mudança de grants (V6) ou inacessível em produção por falta de grant | Grants explícitos em toda migração e testados; Security Advisor no Gate V-C |
| Hook mal configurado em produção libera cadastro | Gatilho de perfil recusa e-mail fora da lista (segunda barreira, testada); verificação manual de recusa no Gate V-C, quando possível; provedor de senha desabilitado; D1 permite revogar |
| Conta já criada continua entrando após sair da lista | D1 |
| Papel divergente entre a lista e o perfil | Regra de papel da `v2`: lista sem `update`, perfil como autoridade e procedimento único na KB-002 |
| Primeiro login com Google recusado por cadastro desligado em geral | Armadilha descrita na KB-002 (Item C3) |
| Cron ou manifesto redirecionados para o login | Matcher do `proxy.ts` sem redirecionamento e testes ponta a ponta (Itens B3, C1 e C2) |
| Login por senha ativo em produção | Variável só local e no CI, e provedor desabilitado no Supabase (dupla barreira), conferido no Gate V-C |
| Segredo versionado ou exposto em log | `.env.example` sem valores, validador G3, revisão do diff; chave secreta do Supabase não usada pela aplicação |
| Projeto Supabase pausa | Cron diário (V4) com margem sobre a semana de inatividade; falha do cron visível nos logs da Vercel; acompanhamento de pelo menos 8 dias (Item C4), porque o critério de atividade não é documentado |
| Incompatibilidade entre versões recentes | Versões verificadas e fixadas; TypeScript e ESLint mantidos na linha aceita pelo `eslint-config-next` |
| CI lento ou instável com Supabase local | Serviços não usados desabilitados; `timeout-minutes` explícito; job separado dos checks rápidos |
| Cota de 2.000 minutos mensais do GitHub Actions (repositório privado no GitHub Free) esgotada pelo job com Supabase local | `concurrency` com cancelamento, `timeout-minutes`, só Chromium e serviços do Supabase não usados desabilitados; tempo de execução registrado nas tasks; se a cota apertar, a cadeia para e o responsável decide |
| PR de release sem checks automáticos | `workflow_dispatch` no `ci.yml` e no `governance.yml`, exigido no Gate M-R |
| Painel do Supabase não aponta o hook para `private` | Fallback descrito no "Modelo de acesso" |
| Escopo cresce para telas ou carteira | Escopo negativo explícito; qualquer ampliação para a cadeia |

**Suposições:** o plano Hobby da Vercel atende uso pessoal; o runner `ubuntu-latest` tem Docker; as versões da tabela continuam disponíveis no registro npm; a documentação oficial consultada em 2026-10-12 descreve o comportamento atual do Supabase e da Vercel, exceto o critério de inatividade do Supabase, que ela não detalha.

**Rollback:** cada PR é revertível por squash revert. Migrações não são revertidas por edição (G4): uma correção de schema é nova migração. Em produção, o responsável pode remover o domínio ou pausar o projeto Vercel; o projeto Supabase não guarda dado de carteira neste ciclo.

## Sequência recomendada

1. Gate R: rodada 1 de `revisar_plano` sobre a `v1` → `REQUER NOVA RODADA` → correção para a `v2`.
2. Rodada 2 de `revisar_plano` sobre a `v2` → veredito.
3. Gate P: aprovação pós-revisão e confirmação da regra de papel → PR do plano integrada → issues A, B e C.
4. Gate X-A → PR A, com a transição para execução → Gate M-A.
5. Gate X-B → PR B → Gate M-B.
6. Gate X-C → PR C → Gate H-C (configuração externa e primeiro `db push`) → Gate M-C → segundo `db push` → Gate V-C, com Gates X-F e M-F para cada correção necessária.
7. Gate M-R: merge da primeira PR de release.
8. Gate E: encerramento documental e reconciliação pós-merge.

## Referências

- Ideação `_project/ideations/001_fundacao_aplicacao.md` (2026-10-12).
- ADR-002, ADR-003 e KB-001 em `main` @ `aa5fa81`; `design-system/DESIGN.md`, seções 3, 5 e 8; `_project/README.md`, barreiras G1 a G4.
- `mae-no-controle` @ `2f4a304f7ad62b1166e47ded26582d176f6311f3`: `package.json` e estrutura de arquivos.
- Registro npm, consultado em 2026-10-12, para as versões e dependências *peer* da tabela.
- Supabase CLI @ `415735eb1973e90f9fc0b34e01f7799bba38a879` (`develop`), `apps/cli-go/pkg/config/templates/config.toml`: chaves `[auth.hook.before_user_created]`, `major_version = 17` e `jwt_expiry = 3600`.
- Supabase, Security Advisor (lint `0011_function_search_path_mutable`): <https://supabase.com/docs/guides/database/database-advisors>.
- Next.js 16.4, `next/font` (`src` relativo e `declarations`): <https://nextjs.org/docs/app/api-reference/components/font>.
- Vercel, versões de Node.js: <https://vercel.com/docs/functions/runtimes/node-js/node-js-versions>.
- GitHub, cota do Actions: <https://docs.github.com/en/billing/concepts/product-billing/github-actions>.
- Supabase, documentação: <https://supabase.com/docs/guides/auth/auth-hooks>, <https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook> e <https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook>.
- Supabase, mudança de grants: <https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically>.
- Supabase, preços e pausa por inatividade: <https://supabase.com/pricing>.
- Vercel, limites de cron: <https://vercel.com/docs/cron-jobs/usage-and-pricing>.
- Chrome, critérios de instalação: <https://developer.chrome.com/blog/update-install-criteria> e <https://web.dev/articles/install-criteria>.

## Rastreabilidade

| Campo | Valor |
| :-- | :-- |
| Issue(s) | A: [#8](https://github.com/EuThiagoAndrade/saldo-futuro/issues/8); B: [#9](https://github.com/EuThiagoAndrade/saldo-futuro/issues/9); C: [#10](https://github.com/EuThiagoAndrade/saldo-futuro/issues/10) |
| PR(s) | A: [#11](https://github.com/EuThiagoAndrade/saldo-futuro/pull/11), integrada por squash em `52583ce` |
| Branch(es) | A: `chore/issue-8`; B: `feature/issue-9` |
| `handoff_schema_version` | `1` |
| `handoff_id` | `saldo-futuro + 001 + revisar_plano + 001_plan + v2` (anteriores: `saldo-futuro + 001 + rascunhar_plano + 001_plan + aa5fa81`, `saldo-futuro + 001 + revisar_plano + 001_plan + v1` e `saldo-futuro + 001 + rascunhar_plano + 001_plan + v2`, aceitos) |
| Destino após conclusão | `_project/executed/001_fundacao_aplicacao/001_plan.md` |

## Handoff de saída

- `handoff_schema_version`: `1`
- `handoff_id`: `saldo-futuro + 001 + revisar_plano + 001_plan + v2`
- `identity_source`: `repository + cycle + workflow + logical_target + source_revision`; revisão de origem: plano `v2` sobre `main` @ `aa5fa81`, com ideação, `cycles.md` e plano locais, não versionados. Timestamp e UUID não definem a identidade.
- `effect_class`: `local_mutation`
- `state_before` / `state_after`: antes, plano `v2` em `Em Revisão`, com handoff `saldo-futuro + 001 + rascunhar_plano + 001_plan + v2` aceito e regra de papel confirmada; depois, parecer da rodada 2 registrado (`APTO COM RESSALVAS`, sem bloqueios) e plano `v2` `Aprovado` em 2026-10-12 (Gate P), com o ajuste editorial de S4 aplicado.
- `next_transition`: publicação documental do plano e criação das issues A, B e C (Gate P); depois, Gate X-A.
- `preconditions`: Gate P concedido em 2026-10-12, posterior a este parecer, com a regra de papel confirmada e o disparo dos checks da PR de release autorizado (S2).
- `authority`: o responsável (Thiago Andrade).
- `evidence`: seção "Revisão crítica", rodadas 1 e 2; consultas somente leitura listadas nos itens atendidos de cada rodada; validador de governança.
- `acceptance`: veredito apto sem bloqueios, ressalvas S1 a S4 classificadas e decisão humana não inferida.
- `blockers`: nenhum.
- `result`: `executed`
- `next_workflow_recommended` / `next_workflow_authorized`: `criar_issues` para A, B e C e, após o Gate X-A, `implementar_issue` para a issue A / publicação documental do plano e `criar_issues`, conforme o Gate P.
- `actions_prohibited`: marcar `Aprovado`, versionar ou publicar o plano, criar issue, implementar, configurar serviço externo, abrir ou integrar PR fora da PR do plano antes do Gate X-A.
- `rejection_rule`: o receptor recusa handoff ausente, incompatível, sem parecer formal ou que trate aptidão como aprovação.
- `logical_key`: `saldo-futuro + 001 + revisar_plano + 001_plan + v2`.
- `check_before_mutation`: verificar se já existe parecer para a `v2` e se o plano aprovado é o mesmo revisado.
- `reconcile_existing`: em nova rodada, preservar os pareceres anteriores e registrar o novo abaixo deles.
- `ambiguous_state`: parar se houver mais de um plano `001`, se o plano mudar após este parecer sem nova rodada ou se houver decisões conflitantes.

## Revisão crítica

### Rodada 1

- **Data:** 2026-10-12
- **Versão revisada:** `v1`, incluindo o registro das respostas a D1, D2 e D3, feito antes da abertura da rodada, sem outra mudança.
- **Procedimento:** `.agent/workflows/revisar_plano.md` e `.agent/templates/plano_implementacao.md`.
- **Veredito:** `REQUER NOVA RODADA`
- **Bloqueios remanescentes:** B1, B2, B3 e B4.
- **Aprovação humana pós-revisão:** `Pendente`

#### Itens atendidos

- Existe um único plano `001`, em `_project/drafts/001_fundacao_aplicacao/`, e `cycles.md` aponta para ele com o ciclo em `Planejamento`. O validador passa sem erros.
- Todas as seções e campos de estado do template estão presentes. A tabela de gates tem precondição, autorização, vedação e evidência, e as condições de parada estão declaradas.
- As barreiras G1 a G4 estão declaradas, com justificativa para G1. O texto não contém dados do usuário: os e-mails são fictícios em `example.com`, e só aparecem o nome público do autor e o domínio público.
- O escopo negativo é coerente com a ideação e com o mapa de ciclos. As decisões 1 a 8 da ideação estão preservadas, e D1 a D3 foram respondidas.
- Fatos conferidos por inspeção somente leitura nesta rodada:
  - as versões da tabela no registro npm e as dependências *peer* que justificam TypeScript 6.0.3 (`typescript-eslint` 8.71.2 aceita `<6.1.0`) e ESLint 9.39.5 (`eslint-plugin-react` 7.37.5 aceita até `^9.7`);
  - o `package.json` do `mae-no-controle` @ `2f4a304`;
  - o `config.toml` do Supabase CLI: `[auth.hook.before_user_created]`, `major_version = 17` e `jwt_expiry = 3600`, que confirma a hora de validade citada em D1;
  - Vercel: cron do Hobby no mínimo diário, com precisão de ±59 min; Node.js 24.x é o padrão, e `engines` `>=24` resolve para 24.x;
  - Supabase: hook "before user created" nos planos Free e Pro; página oficial de preços com "Limit of 2 active projects" e pausa após "1 week of inactivity"; changelog de grants com as datas 2026-05-30 e 2026-10-30;
  - `governance.yml` já aceita `workflow_dispatch`, premissa do Gate M-R;
  - o nome `KB-002_operacao_producao_acessos.md` atende ao padrão do manifesto, e o template `kb.md` existe.
- A sequência respeita as autoridades: a PR do plano só é aberta após a aprovação; B começa depois de M-A e C depois de M-B; o `db push` é sempre do responsável; o encerramento não tem issue própria.

#### Bloqueadores

- **B1 — Merge sem gate próprio.** O Item C4 prevê "nova PR vinculada à issue C" para corrigir uma falha da verificação em produção, mas nenhum gate autoriza implementar essa correção nem integrá-la. O Gate V-C veda só a "correção sem issue". O template e o passo 3 do `revisar_plano` exigem gate próprio para cada merge. A `v2` precisa de gates para a execução e o merge de PRs de correção (por exemplo, X-C′ e M-C′), ou declarar que cada uma exige autorização explícita de execução e de merge, com evidência.
- **B2 — Transições de estado sem dono.** As transições do plano (`Aprovado → Em Execução`) e do ciclo (`Planejamento → Em execução`, com a coluna "Issues" de `cycles.md`) não estão atribuídas a nenhuma entrega. O `_project/README.md` exige `Em Execução` ao iniciar a primeira entrega, e o `implementar_issue` não faz essa transição. Sem isso, plano e `cycles.md` divergem do estado real durante todo o ciclo, e o encerramento parte de um estado incorreto. O plano `000` resolveu isso no Item 1. A `v2` deve atribuir a transição à PR A, com critério de aceite.
- **B3 — Modelo de acesso incompleto num ponto de segurança (G2 e ADR-003).**
  - O comportamento de `private.handle_new_user()` para e-mail fora da lista não está definido. Se o hook estiver desligado ou mal configurado em produção, o resultado depende de um detalhe não especificado: perfil sem papel, papel padrão ou falha. A `v2` deve defini-lo e testá-lo no pgTAP. Recomendação: o gatilho lança exceção, o que aborta a criação do usuário e funciona como segunda barreira.
  - A fonte do papel é ambígua. `authorized_emails.role` e `profiles.role` coexistem; o `admin` pode alterar o papel na lista pela RLS, mas isso não muda as contas existentes, e `is_admin()` lê `profiles`. A `v2` deve definir qual campo é a autoridade depois do primeiro login e o que acontece ao alterar a lista (sem efeito, sincronização ou proibição), e refletir isso nas políticas, nos testes e no procedimento "mudar papel" da KB-002.
- **B4 — Contradição sobre `.env.example`.** O Item A2 torna o arquivo obrigatório no manifesto já na PR A, mas o Item B3 e "Arquivos afetados" só o criam na issue B. Como está escrito, o validador reprovaria a PR A, o mesmo padrão do B1 da rodada 1 do ciclo `000`. A `v2` deve criar `.env.example` na issue A, com as variáveis usadas pelo esquema de ambiente, e completá-lo nas issues B e C, ou mover a exigência do manifesto para a issue B.

#### Ressalvas

- **R1 — A fonte é critério de mecanismo.** O Item A1 prescreve `next/font/local` e, ao mesmo tempo, o bloco `@theme` "copiado sem alteração". O `next/font/local` gera um nome de família próprio, salvo com `declarations` de `font-family`. Pela lição de 2026-10-12, o critério deve expressar o objetivo verificável: `@theme` idêntico ao `DESIGN.md`; `font-family` computada resolvendo para "IBM Plex Sans"; arquivos servidos pelo próprio site a partir de `design-system/assets/fonts/`, sem cópia. O mecanismo fica livre: `@font-face` no CSS ou `next/font/local` com `declarations`.
- **R2 — Funções e grants.** O plano exige `search_path` fixo só nas funções `security definer`, mas o lint `0011_function_search_path_mutable` do Security Advisor alerta qualquer função sem `search_path` fixo, e a recomendação oficial é `set search_path = ''`. Exigir isso em toda função criada. Declarar e testar também `revoke execute … from public`, porque o PostgreSQL concede `EXECUTE` a `PUBLIC` por padrão, e os `grant usage` de schema necessários: `private` para `authenticated`; `public` e `private` para `supabase_auth_admin`.
- **R3 — O release-please fica fora da convenção.** A branch `release-please--branches--main` e o commit `chore(main): release x.y.z` não seguem o `_project/README.md`. A exceção deve ser registrada na autoridade pela issue A, na seção "Branches, commits e migrações". Declarar também o manifesto inicial `0.0.0`, para que a primeira versão saia `0.1.0` (D3), e conferir o nome real da branch na execução.
- **R4 — Permissão do Actions.** A configuração "Allow GitHub Actions to create and approve pull requests" está só em "Dependências e blockers". Ela deve ser precondição explícita do Gate M-A, porque o critério do Item A3 depende dela.
- **R5 — Armadilhas da KB-002.** Distinguir desabilitar o provedor de e-mail de desabilitar cadastros em geral: a segunda opção bloquearia também o primeiro login com Google. Fixar a ordem: o primeiro `admin` entra na lista antes do primeiro login.
- **R6 — Eficácia do keepalive.** A documentação oficial não detalha o que conta como atividade; diz só "1 week of inactivity". A eficácia só se prova após mais de 7 dias. Registrar como verificação de acompanhamento: o projeto continua ativo pelo menos 8 dias após o deploy, conferido no encerramento se o prazo couber ou registrado como acompanhamento na closure.
- **R7 — Cota de minutos do GitHub Actions.** Repositório privado no GitHub Free tem 2.000 minutos mensais de runners hospedados. O job com Supabase local e Playwright em cada PR e cada push consome essa cota. Acrescentar o risco e a mitigação: concorrência com cancelamento, `timeout-minutes` e job pesado restrito a `pull_request` e `push` para `main`.
- **R8 — Precisão textual.** V3 e V4 dizem "por organização" e "inatividade de banco", termos que vêm só de fontes de terceiros; a página oficial diz "Limit of 2 active projects" e "1 week of inactivity". Na justificativa de G1, a frase "A única formatação numérica é a versão do app" não corresponde a nenhum item e deve sair.
- **R9 — Meio da verificação ponta a ponta.** O Item B3 exige conferir que o cadastro recusado "não cria linha em `auth.users`", sem dizer como. Definir o meio sem nova dependência (`pg` não está na tabela): cliente administrativo do `supabase-js` com a chave secreta do Supabase local, lida de `supabase status` e usada só no ambiente local e no CI, ou conferência equivalente no pgTAP.
- **R10 — Escopo do `proxy.ts`.** Declarar que o matcher não redireciona `/api/keepalive`, o manifesto, os ícones e os arquivos estáticos para `/entrar`, porque o cron e a instalação do PWA dependem desses caminhos sem sessão. Cobrir com teste.

#### Correções materiais

Nenhuma aplicada nesta rodada. O workflow emite parecer e não corrige o plano. A correção exige autorização do responsável, incrementa a versão para `v2`, mantém o plano `Em Revisão` e preserva este parecer.

#### Resposta da v2

Correção autorizada pelo responsável em 2026-10-12, "com as recomendações" do parecer.

| Achado | Resolução na `v2` |
| :-- | :-- |
| B1 | Novos Gates X-F (execução de uma correção) e M-F (merge de uma correção), repetidos para cada uma. As correções seguem a trilha curta com issue `[FIX]` própria e branch `fix/issue-N`, o que evita uma segunda PR para a issue C. Correção não elegível para a cadeia e devolve o plano à revisão. Itens C4, gates, decomposição, arquivos afetados e sequência atualizados |
| B2 | Novo Item A0: a PR A muda o plano para `Em Execução`, preenche "Rastreabilidade" e passa `cycles.md` para `Em execução`, com as issues. O Gate X-A autoriza essa mudança |
| B3 | O gatilho `handle_new_user()` lança exceção para e-mail ausente da lista ou nulo, como segunda barreira, com teste pgTAP por inserção direta em `auth.users`. Nova subseção "Regra de papel adotada na v2": `profiles.role` é a autoridade depois do primeiro login; a lista não aceita `update`; a mudança de papel é procedimento da KB-002. A regra depende de confirmação no Gate P |
| B4 | `.env.example` nasce na PR A, com as variáveis do Supabase declaradas opcionais no esquema de ambiente; B acrescenta `NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN` e C acrescenta `CRON_SECRET`. "Arquivos afetados" corrigido |
| R1 | O Item A1 passa a expressar o objetivo: `@theme` idêntico ao `DESIGN.md`, `font-family` computada resolvendo para "IBM Plex Sans" e fonte servida a partir de `design-system/assets/fonts/`, com o mecanismo livre |
| R2 | "Modelo de acesso": `set search_path = ''` e `revoke execute … from public` em toda função, grants pontuais e `grant usage` de schemas, refletidos em G2, na estratégia de testes, no Item B1, no Item C1 e nos riscos |
| R3 | O Item A3 registra a exceção do release-please em `_project/README.md`, fixa o manifesto inicial em `0.0.0` para a primeira versão sair `0.1.0` e confere os nomes reais |
| R4 | A permissão do Actions virou precondição do Gate M-A |
| R5 | O Item C3 inclui a armadilha do cadastro desligado em geral e a ordem "primeiro `admin` na lista antes do primeiro login" |
| R6 | Acompanhamento de pelo menos 8 dias no Item C4, na KB-002 e nos riscos, com registro como acompanhamento aberto se o encerramento vier antes |
| R7 | Risco da cota de minutos com mitigação (`concurrency`, `timeout-minutes`, só Chromium e tempo registrado nas tasks) nos Itens A2 e B2 |
| R8 | V3 e V4 citam o texto oficial e separam o que vem de terceiros; a frase sobre a versão do app saiu de G1 |
| R9 | O Item B3 define o meio: cliente administrativo do `supabase-js` com a chave secreta do Supabase local, só no ambiente local e no CI, sem nova dependência |
| R10 | O Item B3 define o matcher do `proxy.ts` sem redirecionamento; os Itens C1 e C2 têm testes ponta a ponta para `/api/keepalive`, o manifesto e os ícones sem sessão |

### Rodada 2

- **Data:** 2026-10-12
- **Versão revisada:** `v2`, incluindo o registro da confirmação da regra de papel, feito antes da abertura da rodada, sem outra mudança.
- **Procedimento:** o mesmo da rodada 1.
- **Veredito:** `APTO COM RESSALVAS`
- **Bloqueios remanescentes:** nenhum.
- **Aprovação humana pós-revisão:** `Aprovada em 2026-10-12` (Gate P: plano `v2`, regra de papel confirmada e disparo dos checks da PR de release autorizado, conforme S2)

#### Itens atendidos

- O status é `Em Revisão`, a versão é `v2`, existe um único plano `001` e `cycles.md` continua apontando para ele. O validador passa sem erros, e o parecer da rodada 1 está preservado.
- Todas as seções do template continuam presentes.
- Os quatro bloqueadores da rodada 1 estão resolvidos no corpo do plano:
  - **B1:** Gates X-F e M-F, repetidos por correção, com o merge de cada PR de correção sob gate próprio. A trilha curta como caminho é compatível com `corrigir_trilha_curta.md`: issue `[FIX]` pelo `bug_report.yml`, autorização explícita, branch `fix/issue-N`, task em `_project/fixes/` e teste que reproduz a falha. Assim, a regra de uma PR por issue continua sem exceção;
  - **B2:** Item A0 atribui à PR A a transição do plano e do ciclo, com o Gate X-A autorizando-a e critério verificável;
  - **B3:** o gatilho recusa e-mail fora da lista, com teste que simula o hook desligado. A regra de papel está definida, confirmada pelo responsável e refletida em políticas, grants, testes e KB-002;
  - **B4:** `.env.example` nasce na PR A e é completado por B e C, de forma coerente com o manifesto e com "Arquivos afetados".
- As ressalvas R1 a R10 têm resolução rastreável na tabela "Resposta da v2", conferida no corpo do plano.
- Fatos novos da `v2`, conferidos por inspeção somente leitura nesta sessão:
  - lint `0011_function_search_path_mutable`: vale para qualquer função sem `search_path` fixo, não só `security definer`, e recomenda `set search_path = ''`;
  - `next/font/local` aceita `src` relativo fora de `app/`, e `declarations` com `font-family` substitui o nome gerado, o que torna viável o objetivo do Item A1;
  - Vercel: Node.js 24.x é o padrão, e `engines` `>=24` resolve para 24.x;
  - GitHub Free: 2.000 minutos mensais de runners hospedados para repositórios privados;
  - `jwt_expiry = 3600` no `config.toml` do CLI.
- A sequência continua compatível com as autoridades: cada merge tem gate próprio (plano em P, A, B, C, correções, release e encerramento); a PR do plano só é aberta após a aprovação; `db push` e configurações externas são sempre do responsável.

#### Ressalvas

Nenhuma exige nova rodada. São orientações vinculantes para a execução e devem constar das tasks correspondentes.

- **S1 — Falha de configuração e rastreabilidade das correções.** Os Gates X-F e M-F cobrem falhas de código. Uma falha de configuração nos painéis não gera PR: o responsável corrige refazendo o passo correspondente da KB-002, no escopo do Gate H-C, e o item do Item C4 é verificado de novo. Como a task da trilha curta registra ciclo e plano `—` e não altera `cycles.md`, a task de closure deve listar as issues e PRs de correção do Gate V-C em "Rastreabilidade" e no pós-mortem.
- **S2 — Disparo dos checks da PR de release.** O Gate M-R exige checks executados por `workflow_dispatch`, mas nenhum gate autoriza o disparo. Ele é um efeito remoto, ainda que só execute CI. A manifestação do Gate P pode autorizar expressamente o agente a disparar `CI` e `Governance` na branch da PR de release; caso contrário, o agente pede autorização própria antes do disparo.
- **S3 — Keepalive com falha fechada.** O teste unitário do Item C1 deve cobrir também `CRON_SECRET` ausente do ambiente: a rota recusa, nunca responde sucesso, e não aceita o cabeçalho `Bearer undefined`.
- **S4 — Editorial.** A precondição do Gate M-B fala em "funções `security definer`", enquanto G2 e o "Modelo de acesso" passaram a cobrir todas as funções. Ao marcar `Aprovado`, alinhar o texto para "políticas RLS e funções", sem efeito material.

#### Correções materiais

Nenhuma correção material. Na atualização para `Aprovado` foi aplicado o ajuste textual de S4 (precondição do Gate M-B), sem alterar escopo, gates ou critérios. S1 e S3 seguem como orientações para a execução; S2 foi autorizada pelo responsável no Gate P, em 2026-10-12.

## Pós-mortem

- **Data de conclusão:** —
- **Desvios:** —
- **Lições comprovadas:** —
