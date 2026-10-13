# Task — Issue #10: Keepalive, PWA e roteiro de produção

> **Ciclo:** `001`
> **Trilha:** `normal`
> **Estado:** `Em andamento`
> **Tipo:** `feature`
> **Issue:** `#10`
> **Plano:** `_project/drafts/001_fundacao_aplicacao/001_plan.md`
> **Branch:** `feature/issue-10`
> **PR:** —
> **Integração:** `Pendente`
> **Início:** 2026-10-12
> **Última atualização:** 2026-10-12
> **handoff_schema_version:** `1`
> **handoff_id:** `saldo-futuro:001:implementar_issue:issue-10:54f8db6`

Instanciada a partir de `.agent/templates/task.md`. A sequência operacional é `.agent/workflows/implementar_issue.md`.

## Objetivo

Entregar os itens C1 a C3 do plano `001` (keepalive, PWA e ícones, roteiro de produção e operação de acessos) e preparar o Gate H-C. O Item C4 (verificação em produção) é do Gate V-C e fica registrado na task de closure.

## Escopo autorizado

- Gate X-C concedido pelo responsável em 2026-10-12, para a issue #10 (`[FEATURE]`), sobre `main` @ `54f8db6`, com a issue B integrada (Gate M-B).
- Itens C1, C2 e C3 do plano. Também, com autorização do responsável na mensagem que concedeu o Gate X-C, a reconciliação da task da trilha curta da issue #14, já integrada, e da rastreabilidade do plano.
- Fora do escopo: qualquer configuração externa (Gate H-C é do responsável), `db push`, login, aceite de termos, criação de contas, manipulação de credenciais, service worker, modo offline, o merge da PR (Gate M-C) e a verificação em produção (Gate V-C).

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Não há regra de cálculo nem quantia monetária |
| G2 — isolamento por RLS | Sim | A migração nova cria só `public.keepalive()`, sem tabela. O pgTAP (68 testes) cobre `search_path` fixo, `EXECUTE` revogado de `public` e `authenticated` e concedido só a `anon`, `security invoker` e ausência de leitura de tabela; a regra geral de funções continua verificando todas as funções de `public` e `private`; demonstração de falha por mutação abaixo |
| G3 — privacidade de dados | Sim | A KB-002 só tem espaços reservados entre `<...>`, sem segredo, chave, e-mail real nem identificador de projeto (conferido por busca); `.env.example` só com nomes; o segredo de teste do cron no CI é descartável e mascarado; os ícones derivam do símbolo, sem dado do usuário |
| G4 — migrações só acrescentam | Sim | Uma migração nova (`20261013011331_keepalive.sql`), nome gerado por `supabase migration new`; nenhuma migração existente alterada |

## Execução

- [x] C1: teste pgTAP escrito antes (fase vermelha registrada), migração do `public.keepalive()`, `runKeepalive` com testes unitários antes da rota, `GET /api/keepalive`, `CRON_SECRET` no `.env.example` e no esquema de ambiente, `vercel.json` com cron diário.
- [x] C2: `src/app/manifest.ts`, ícones PNG 180, 192, 512 e 512 mascarável a partir do símbolo, ícone SVG, e testes ponta a ponta do manifesto e dos ícones sem sessão.
- [x] C3: `_project/knowledge/KB-002_operacao_producao_acessos.md` pelo template `kb.md`.
- [x] CI: `CRON_SECRET` descartável no job `database`, para o teste ponta a ponta do keepalive com o banco local.
- [x] Reconciliação da task da issue #14 e da rastreabilidade do plano.
- [x] Gates locais executados (ver Evidências).
- [ ] PR publicada e checks remotos.
- [ ] Gate H-C: o responsável executa o roteiro da KB-002; o agente confere por leitura o que estiver acessível. O checklist é marcado nesta task, sem segredos nem e-mails.
- [ ] Gate M-C: merge e deploy de produção.

## Evidências

| Gate | Resultado |
| :-- | :-- |
| Fase vermelha (TDD) | Com o teste do keepalive em `03_funcoes.test.sql` e sem a migração: 2 falhas (7 e 8) e erro por função inexistente nos demais |
| `npx supabase db reset` | Aplica as duas migrações e o seed sem erro |
| `npx supabase test db` | 3 arquivos, 68 testes, `PASS` (03 funções passou de 6 para 12) |
| Demonstração de falha por mutação | `grant execute` a `authenticated`: falham os testes 3 e 8; `security definer`: falha o 9; corpo lendo `public.profiles`: falha o 10; `reset search_path`: falha o 1. Cada alteração foi revertida por `db reset` |
| `npm test` | 4 arquivos e 22 testes passaram. `src/lib/keepalive.test.ts` (7) cobre: sem cabeçalho, segredo errado, sucesso com o segredo, `CRON_SECRET` ausente (inclusive `Bearer undefined`), `CRON_SECRET` vazio, falha da consulta (500) e sem backend (503) |
| `npm run lint`, `npm run typecheck` | Passaram |
| `npm run test:e2e` sem backend | 8 passaram e 7 foram ignorados |
| `npm run test:e2e` com backend e `CRON_SECRET` | 12 passaram e 3 foram ignorados. `GET /api/keepalive` sem segredo e sem sessão: `401` e sem cabeçalho `location` (não redireciona para `/entrar`); com segredo inventado: `401`; com o segredo de teste: `200` e `{ok:true}`, executando `public.keepalive()` no banco local; manifesto: `200`; ícones do manifesto, favicon e ícone da Apple: `200`, sem redirecionamento |
| Manifesto no Chrome | O protocolo de desenvolvimento do Chrome (`Page.getAppManifest`, a mesma fonte do painel Application) devolve a URL do manifesto e a lista de erros vazia; a instalabilidade só aponta `in-incognito`, por causa do contexto do teste. Coberto por teste ponta a ponta |
| Ícones | Gerados a partir de `design-system/assets/logo-simbolo.svg` com o Chrome instalado (Chromium 154) dirigido pelo Playwright do projeto (`screenshot` com fundo transparente); nenhuma dependência nova. `icon.svg` é cópia byte a byte do símbolo (SHA-256 `7da254e54c33997ac48805a7a7a1c0de144c48cec3a919204d050459e42da5fd`). Os PNGs `any` têm o símbolo sem alteração; o mascarável e o da Apple têm sangria total em `primary` e a linha e o marco a 80%, centralizados na área segura |
| SHA-256 dos PNGs | `icon-192.png` `369108742d7ecac5ee29676ac5d005053bcc579ebf7da0306d4e685a7b7ab2fb`; `icon-512.png` `38b28fb2278f1f0cd5f6b9852077923eae6d62da507fe9ff745dfe5178cbdd45`; `icon-maskable-512.png` `59d30e34e33392a422b1b2b022e2ad65ca2f4b63d629b774fcdc7e38ea7116d4`; `apple-icon.png` `52f0a6177c85190ae674128db3abc285bc7c9cf9571f1eb8dcf805b7938725a3` |
| Legibilidade do símbolo | Prévia a 16, 32 e 64 px: a 16 px a silhueta (quadrado azul, linha ascendente e marco) é reconhecível e a 32 px a linha e o marco são legíveis. A verificação é visual; não há medição automática |
| Validador | `node --test scripts/validate-governance.test.mjs`: 26 de 26; `node scripts/validate-governance.mjs`: 0 erro e 0 aviso |
| Procedimentos P1 a P4 da KB-002 | Executados no Supabase local, em transação com rollback: resultados na seção "Decisões incidentais e desvios" |
| `git diff --check` | Passou |
| Checks remotos | Pendente |

## Decisões incidentais e desvios

- **Rota testável.** A lógica do cron está em `src/lib/keepalive.ts` (`runKeepalive`), com a consulta injetada, para o teste unitário cobrir os casos sem rede nem Supabase. A rota apenas liga o `CRON_SECRET`, o cabeçalho e a consulta real. Códigos: `401` sem autorização, `503` autorizado mas sem backend, `500` quando a consulta falha, `200` em sucesso. O segredo é comparado por hash em tempo constante; sem `CRON_SECRET` nada é aceito.
- **Favicon em SVG.** O plano pede "favicon"; foi usado `src/app/icon.svg` (o símbolo, sem alteração), declarado pelo Next.js, em vez de um `favicon.ico`, para não gerar um formato extra. O ícone da Apple é PNG 180.
- **Ícone mascarável e da Apple.** Para a área segura e a máscara do iOS, esses dois ícones têm sangria total em `primary` e o desenho reduzido a 80%. Não há versão em branco separada do símbolo (`DESIGN.md`, 8.3), porque nenhum arquivo a exige: o ícone de sangria total já é o símbolo em branco sobre `primary`.
- **Primeiro `db push` fora do merge da PR C.** O roteiro (armadilha 8 da KB-002) manda o primeiro `db push` sair da `main` antes do merge desta PR, para aplicar só a migração de acesso; a migração do keepalive entra no segundo `db push`, como o plano prevê. Entre o deploy e o segundo `db push`, a rota responde `500`; a KB-002 registra isso.
- **Operação de acessos.** Os procedimentos P1 a P4 da KB-002 usam o editor SQL com o papel do administrador do projeto, que não passa por RLS. Eles não foram executados contra produção. Os quatro foram executados no banco local, em transação com rollback, com e-mails fictícios: P1 e P2 inserem na lista; o primeiro cadastro gera o perfil `user` pelo gatilho; P3 deixa `profiles.role` e `authorized_emails.role` em `admin`; P4 remove a lista, o usuário e o perfil (contagens zero). A revogação D1 também é coberta pelo pgTAP.
- **Informações a verificar pelo responsável.** Os rótulos dos painéis do Google, do Supabase, da Vercel e da Cloudflare não foram abertos pelo agente. A KB-002 cita os nomes das configurações e a documentação oficial consultada em 2026-10-12; qualquer divergência entre o painel e o roteiro para a cadeia (condição de parada do plano) e vira ajuste da KB.
- **Reconciliação autorizada.** A task `_project/fixes/fix_task_issue-14.md` passou a `Concluída` (PR #15, merge `54f8db6`, PR de release #13 passou a propor `0.1.0`); a rastreabilidade do plano ganhou a PR #12.
- **`npm audit`.** Sem mudança nas dependências; as vulnerabilidades de desenvolvimento seguem as registradas na task da issue #8.

## Resultado

### Handoff de execução

- `handoff_schema_version`: `1`
- `handoff_id`: `saldo-futuro:001:implementar_issue:issue-10:54f8db6`
- `identity_source`: `repository + cycle + workflow + logical_target + source_revision`; timestamp e UUID não definem a identidade.
- `effect_class`: `local_mutation -> remote_mutation`
- `state_before` / `state_after`: antes, `main` @ `54f8db6` com as issues A e B integradas, issue #10 aberta e sem branch nem PR; depois, a preencher.
- `next_transition`: PR C -> checks -> Gate H-C (configuração externa do responsável) -> Gate M-C.
- `preconditions`: Gate X-C concedido; issue #9 integrada.
- `authority`: o responsável (Thiago Andrade).
- `evidence`: a preencher.
- `acceptance`: critérios C1 a C3 da issue #10 atendidos, escopo preservado, gates registrados e PR rastreável.
- `blockers`: nenhum até aqui.
- `result`: `not_executed`
- `next_workflow_recommended` / `next_workflow_authorized`: revisão da PR C e execução do roteiro da KB-002 pelo responsável (Gate H-C) / nenhuma configuração externa nem merge autorizados ao agente.
- `actions_prohibited`: integrar a PR, executar configuração externa, `db push`, login, aceitar termos, criar contas, manipular credenciais, ampliar escopo.
- `rejection_rule`: o receptor recusa handoff ausente, incompatível, contraditório ou sem evidência material.
- `logical_key`: `saldo-futuro + 001 + implementar_issue + issue-10(C1-C3) + 54f8db6`.
- `check_before_mutation`: nenhuma task, branch ou PR existia para a chave lógica antes desta criação.
- `reconcile_existing`: atualizar esta task, a branch `feature/issue-10` e a PR sem duplicar.
- `ambiguous_state`: parar se houver mais de uma branch ou PR para a issue #10, ou divergência entre issue, task e plano.
