---
title: "Visão do produto e da arquitetura"
tags:
  - produto
  - arquitetura
  - referência
author: "Thiago Andrade e Claude"
module: "Produto"
last_updated: "2026-10-14"
origin_cycle: "002"
---

# KB-003: Visão do produto e da arquitetura

## Finalidade

Primeira leitura para entender o Saldo Futuro como ele está hoje, para humanos e para agentes. Resume o que existe, onde está e por quê, sem obrigar a leitura dos planos executados. É atualizada no encerramento de cada ciclo que mude o produto ou a arquitetura (`.agent/workflows/atualizar_docs.md`).

## Limite de autoridade

Conhecimento de referência. As decisões estão nas ADRs, o contrato visual no `design-system/DESIGN.md`, a operação de produção na KB-002 e o processo no `_project/README.md`. Em divergência entre esta KB e uma dessas fontes, vale a fonte, e esta KB deve ser corrigida. Ela não autoriza mudança.

## Conteúdo

### O produto hoje

O Saldo Futuro é um sistema web de gestão de investimentos pessoais, multiusuário e pensado primeiro para o celular (`README.md`). Na versão `0.2.0` (`package.json`), em produção em `investimentos.euthiagoandrade.com.br` (KB-002), ele tem:

- a fundação (ciclo `001`):
  - login com Google restrito a e-mails autorizados;
  - perfis `admin` e `user`;
  - isolamento por RLS provado por testes de banco;
  - PWA instalável;
  - uma única tela autenticada, "Em construção", que mostra o e-mail e o perfil do próprio usuário e permite sair (`src/app/page.tsx`);
- as regras financeiras, sem tela (ciclo `003`):
  - o schema da carteira, com escrita só por funções do banco;
  - lançamentos, estorno, transferência e fechamento mensal;
  - consolidação, Modified Dietz, acumulado e drawdown;
  - benchmarks (CDI e IPCA) com a sincronização com o SGS e a comparação com a carteira;
  - tudo especificado na KB-004 e testado contra os mesmos casos de referência.

Ainda não existe:

- nenhuma tela de produto, nem rota ou botão de sincronização do SGS (ciclo `004`);
- nenhum dado de carteira em produção: as tabelas existem vazias, e nenhum benchmark foi sincronizado;
- nenhum dado migrado do `Meus-Investimentos` (ciclo `005`).

### Onde está cada coisa

| Assunto | Local |
| :-- | :-- |
| Decisões duradouras (stack, acesso, governança) | `_project/decisions/` (ADR-001 a ADR-004) |
| Operação de produção e de acessos | `_project/knowledge/KB-002_operacao_producao_acessos.md` |
| Origem das regras e inventário funcional | `_project/knowledge/KB-001_proveniencia_ecossistema.md` |
| Regras financeiras e casos de referência | `_project/knowledge/KB-004_regras_financeiras.md` e `tests/fixtures/financeiro/casos_referencia.json` |
| Regras de cálculo em TypeScript | `src/lib/financeiro/` |
| Sincronização com o SGS | `src/lib/benchmarks/` |
| Processo (níveis, situações, barreiras, glossário) | `_project/README.md` e `.agent/ai_behavior.md` |
| Contrato visual | `design-system/DESIGN.md` |
| Páginas e rotas | `src/app/` |
| Componentes | `src/components/` |
| Configuração, ambiente e clientes do Supabase | `src/lib/` |
| Renovação de sessão | `src/proxy.ts` |
| Schema, políticas e funções | `supabase/migrations/` |
| Testes de banco (pgTAP) | `supabase/tests/database/` |
| Testes ponta a ponta (Playwright) | `tests/e2e/` |
| Validador da governança | `scripts/` |
| CI, governança e release | `.github/workflows/` |

### Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Supabase (PostgreSQL com RLS e Auth) via `@supabase/ssr`, Zod, Vitest e Playwright, hospedados na Vercel. As versões exatas estão fixadas em `package.json`; a decisão e as alternativas estão na ADR-002.

### Ambientes

| Ambiente | Backend | Uso |
| :-- | :-- | :-- |
| Produção | Projeto Supabase exclusivo e Vercel (plano Hobby) | Login com Google; único ambiente com usuários reais (KB-002) |
| Preview de PR (Vercel) | Nenhum | Revisão visual e build; mostra o aviso "Preview sem backend" (`src/components/preview-notice.tsx`) |
| Local e CI | Supabase local (Docker), com dados fictícios de `supabase/seed.sql` | Desenvolvimento e testes; login por senha habilitado só aqui (`NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN`, `src/lib/env.ts`) |

Sem as variáveis do Supabase, a aplicação roda sem backend e não chama o Supabase (`src/lib/env.ts`, função `backendConfig`).

### Acesso, autenticação e perfis

A decisão está na ADR-003: só entra quem está numa lista de e-mails no banco, e um e-mail fora da lista não cria conta nem sessão.

1. **Entrar:** a página `/entrar` oferece "Entrar com Google" (OAuth pelo Supabase Auth) e, só no ambiente local, login por senha (`src/components/login-panel.tsx`).
2. **Primeira barreira:** o hook "before user created" (`private.before_user_created`, configurado em `supabase/config.toml` e no painel de produção) recusa a criação do usuário quando o e-mail não está em `public.authorized_emails`.
3. **Segunda barreira:** o gatilho `on_auth_user_created` (`private.handle_new_user`) cria o perfil com o papel inicial da lista. Para um e-mail fora dela, ele aborta a criação do usuário, caso o hook esteja desligado ou mal configurado.
4. **Retorno:** `/auth/callback` troca o código pela sessão. Na falha, redireciona com uma mensagem neutra, que não revela se o e-mail está na lista (`src/app/auth/callback/route.ts`).
5. **Sessão:** `src/proxy.ts` só renova os cookies de sessão. A proteção das páginas é feita no servidor; por exemplo, `src/app/page.tsx` redireciona para `/entrar` sem sessão.
6. **Sair:** `POST /sair` encerra a sessão (`src/app/sair/route.ts`).

**Papéis:** `admin` e `user` (`public.app_role`). Depois do primeiro login, `profiles.role` é a autoridade do papel. O primeiro administrador foi inserido só no banco de produção, nunca no repositório (ADR-003, KB-002). A gestão da lista de acessos é feita por SQL do responsável (procedimentos da KB-002); a tela de administração é do ciclo `004`.

### Modelo de dados e isolamento (G2)

Acesso e perfis em `supabase/migrations/20261013005133_acesso_autorizacao_perfis.sql`; carteira e benchmarks nas seções seguintes.

| Objeto | Função | Acesso |
| :-- | :-- | :-- |
| `public.authorized_emails` | E-mails autorizados e o papel inicial (e-mail sempre minúsculo e sem espaços) | `admin` lê, insere e exclui; ninguém altera; o Auth lê para o hook |
| `public.profiles` | Perfil de cada usuário (`user_id`, e-mail, papel) | Cada usuário lê só o próprio; ninguém altera pela API |
| `private.is_admin()` | Diz se o usuário corrente é `admin` | Usada nas políticas; `security definer` com `search_path` vazio |
| Schema `private` | Funções internas, fora da Data API | Sem acesso público |

Regras que valem para toda mudança futura (barreira G2, `_project/README.md`):

- toda tabela de `public` tem RLS;
- grants e revokes são explícitos;
- toda função tem `search_path` fixo e `execute` revogado de `public`;
- o `admin` gerencia acessos, mas não tem bypass sobre dados de outros usuários.

Os testes pgTAP em `supabase/tests/database/` provam isso com usuários fictícios e um administrador, em 239 asserções:

- isolamento do acesso (36), hook e gatilho (20) e funções (15, com a lista explícita do que `authenticated` executa);
- carteira (112), concorrência com duas sessões (13) e benchmarks (43).

### Carteira (ciclo `003`, G1 e G2)

Definida em `supabase/migrations/20261014185205_carteira.sql`; as regras estão na KB-004.

| Objeto | Função |
| :-- | :-- |
| `public.ativos` | Ativos do usuário, com o tipo de ajuste (`rendimento` ou `marcacao`) e o ativo de sistema "Em trânsito", único por usuário |
| `public.eventos` | Fatos imutáveis em centavos com sinal: aporte, resgate, rendimento, marcação, câmbio, migração, pernas de transferência e estornos |
| `public.transferencias` | Agrupa as duas pernas de cada transferência e de sua correção |
| `public.consolidados_mensais` | Uma linha por mês fechado: Vi, Vf e os componentes da identidade contábil |
| `public.posicoes_mensais` | Saldo inicial, saldo final e ajuste de cada ativo no mês fechado |

- O usuário só lê as próprias linhas. Toda escrita passa por funções `security definer` que tomam primeiro a mesma trava por usuário: `criar_ativo`, `desativar_ativo`, `lancar_evento`, `estornar_evento`, `transferir`, `corrigir_transferencia`, `fechar_mes` e `reabrir_mes`.
- Quantias são `bigint` com faixa ±(2⁵³ − 1); as somas no banco são feitas em `numeric`.
- Nenhum percentual é gravado: rentabilidade, acumulado e comparações são calculados na leitura, em `src/lib/financeiro/`.

### Benchmarks (ciclo `003`)

Definidos em `supabase/migrations/20261014193630_benchmarks.sql`.

- `public.benchmarks`: catálogo global, semeado com CDI (SGS 12, diária) e IPCA (SGS 433, mensal).
- `public.valores_benchmark`: valores como publicados.
- `public.coberturas_benchmark`: a cobertura de cada carga.
- Qualquer usuário autenticado lê. Só a função `carregar_benchmark`, executada pelo admin, grava.
- A sincronização (`src/lib/benchmarks/sgs.ts`) busca o SGS em janelas de até 10 anos e grava numa única chamada. Ela ainda não tem rota nem tela (ciclo `004`).

### Operação

- **Keepalive:** um cron diário da Vercel às 08:17 UTC (`vercel.json`) chama `/api/keepalive`, protegida pelo segredo `CRON_SECRET` (`src/lib/keepalive.ts`). A rota executa `public.keepalive()` (`supabase/migrations/20261013011331_keepalive.sql`), que não lê tabela alguma, para o projeto gratuito do Supabase não pausar.
- **Migrações:** chegam à produção por `supabase db push` feito pelo responsável depois do merge. Nenhum segredo de escrita no banco fica no GitHub. Os passos, as armadilhas e a verificação estão na KB-002.

### Interface e PWA

- A aplicação usa os tokens e a fonte IBM Plex Sans do `design-system/DESIGN.md` (`src/app/globals.css`).
- É instalável como PWA pelo menu do navegador, sem service worker e sem modo offline (`src/app/manifest.ts`; ADR-002).

### Qualidade, CI e release

- **CI** (`.github/workflows/ci.yml`), em dois jobs:
  - lint, tipos, testes unitários, build sem backend e ponta a ponta sem backend;
  - Supabase local, testes de banco e ponta a ponta de autenticação.
- **Governança** (`.github/workflows/governance.yml`): validador da governança, seus testes e a barreira G4.
- **Release:** o release-please gera versão e notas a partir de commits no padrão Conventional Commits (`release-please-config.json`; versão inicial `0.1.0`).
- **Integração:** PRs são integradas por squash, depois da aprovação do merge (`_project/README.md`).

## Fontes

Todas as fontes são internas e estão neste repositório, em `main`:

- ADR-002 e ADR-003;
- KB-002 e KB-004;
- `README.md` e `design-system/DESIGN.md`;
- os arquivos de código, configuração e teste citados em cada seção.

O plano executado do ciclo `001` (`_project/executed/001_fundacao_aplicacao/001_plan.md`) traz o histórico das decisões, mas não é leitura necessária para usar esta KB.

## Histórico

| Data | Ciclo | Alteração |
| :-- | :-- | :-- |
| 2026-10-13 | `002` | Criação, a partir do estado entregue no ciclo `001` |
| 2026-10-14 | `003` | Regras financeiras: carteira, benchmarks, KB-004, módulos em `src/lib/` e versão `0.2.0` |
