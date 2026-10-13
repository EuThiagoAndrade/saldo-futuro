# Task — Issue #9: Acesso restrito, schema com RLS e autenticação

> **Ciclo:** `001`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `feature`
> **Issue:** `#9`
> **Plano:** `_project/drafts/001_fundacao_aplicacao/001_plan.md`
> **Branch:** `feature/issue-9`
> **PR:** [#12](https://github.com/EuThiagoAndrade/saldo-futuro/pull/12)
> **Integração:** `Integrada por squash em 8d304b8 (2026-10-12)`
> **Início:** 2026-10-12
> **Última atualização:** 2026-10-12
> **handoff_schema_version:** `1`
> **handoff_id:** `saldo-futuro:001:implementar_issue:issue-9:52583ce`

Instanciada a partir de `.agent/templates/task.md`. A sequência operacional é `.agent/workflows/implementar_issue.md`.

## Objetivo

Entregar o acesso restrito do ciclo `001` (Itens B1 a B3 do plano): Supabase local, migração de acesso com RLS, testes de banco de isolamento, autenticação com `@supabase/ssr` e área autenticada mínima.

## Escopo autorizado

- Gate X-B concedido pelo responsável em 2026-10-12, para a issue #9 (`[FEATURE]`), sobre `main` @ `52583ce`, com a issue A integrada (Gate M-A).
- Itens B1, B2 e B3 do plano; uso do Docker local para o Supabase.
- Fora do escopo: qualquer projeto remoto do Supabase, `db push`, configuração de produção (Gate H-C), tabelas de carteira, telas de produto, administração de acessos na interface, keepalive, PWA e KB-002 (issue #10), e o merge da PR (Gate M-B, autorização própria).

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Não há regra de cálculo nem quantia monetária; as tabelas são de acesso, sem dado de carteira |
| G2 — isolamento por RLS | Sim | `authorized_emails` e `profiles` com RLS e grants explícitos; 62 testes pgTAP (isolamento entre usuários, ausência de bypass do admin, `anon` sem privilégio, escalada de papel, revogação D1, hook, gatilho e regras de função); teste genérico de RLS em toda tabela de `public`; demonstração de falha por mutação na seção Evidências; revisão manual registrada na PR |
| G3 — privacidade de dados | Sim | Seed, testes unitários, pgTAP e ponta a ponta usam só e-mails fictícios em `example.com`; `.env.example` só com nomes; a chave secreta do Supabase local só existe no ambiente de teste e no CI; nenhum e-mail real ou dado do usuário em artefato |
| G4 — migrações só acrescentam | Sim | Uma migração nova (`20261013005133_acesso_autorizacao_perfis.sql`), nome gerado por `supabase migration new`; nenhuma migração existente alterada |

## Execução

- [x] B1: `supabase init`, `config.toml` ajustado (hook `before_user_created` para `private`, Storage, Realtime, Studio, Edge Runtime e Analytics desabilitados, URL de redirecionamento do callback), migração de acesso e `seed.sql` fictício.
- [x] B2: testes pgTAP escritos antes da migração (fase vermelha registrada) e depois verdes; job `database` no `ci.yml`; `supabase test db` exigido no manifesto; G2 passa a "automatizado" em `_project/README.md`.
- [x] B3: clientes `@supabase/ssr`, `src/proxy.ts` sem redirecionamento, rotas `/entrar`, `/auth/callback`, `/sair` e `/`, login por senha só com `NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN=true`, aviso "Preview sem backend", testes ponta a ponta.
- [x] Reconciliação da task da issue #8 (integrada) e da rastreabilidade do plano.
- [x] Gates locais executados (ver Evidências).
- [x] PR #12 publicada; checks remotos verdes e tempos dos jobs registrados.
- [x] Gate M-B concedido pelo responsável em 2026-10-12; merge por squash após checks verdes e revisão manual das políticas e funções registrada na PR.

## Evidências

| Gate | Resultado |
| :-- | :-- |
| Fase vermelha (TDD) | Com o `config.toml` pronto e sem migração, `supabase test db` falhou: 01 e 02 não rodaram (tabelas e funções inexistentes) e 2 testes do 03 falharam |
| `npx supabase db reset` | Aplica a migração e o seed sem erro |
| `npx supabase test db` | 3 arquivos, 62 testes, `PASS` (01 isolamento: 36; 02 hook e gatilho: 20; 03 funções: 6) |
| Demonstração de falha por mutação | Cada alteração abaixo, aplicada ao banco local e revertida por `db reset`, derrubou os testes indicados: `profiles_select_own` com `using (true)` (testes 8, 16, 17, 27 e 35); `profiles_select_own` com bypass do admin (27); `authorized_emails_select_admin` com `using (true)` (9 e 36); `authorized_emails_insert_admin` com `with check (true)` (10, 19 e 20); `authorized_emails_delete_admin` e select liberados (9, 19 e 20); `grant update` em `profiles` a `authenticated` (5, 11 e 28); RLS desligada em `profiles` (1, 8, 16, 17, 27 e 35); `handle_new_user` sem exceção (13, 14 e 15) |
| Hook no GoTrue real | `POST /auth/v1/signup` com e-mail fora da lista: `403`, "Acesso não autorizado."; com e-mail da lista: usuário criado e perfil `user` gerado pelo gatilho; nenhum usuário criado para o e-mail recusado |
| `npm run lint`, `npm run typecheck` | Passaram |
| `npm test` | 2 arquivos e 13 testes passaram (esquema de ambiente, `backendConfig`, `passwordLoginEnabled` e contrato de tokens) |
| `npm run test:e2e` sem backend | 3 passaram e 6 foram ignorados (os de autenticação): `/` e `/entrar` mostram "Preview sem backend" sem requisição a outra origem; `axe` sem violações. O build rodou sem variáveis do Supabase |
| `npm run test:e2e` com backend | 6 passaram e 3 foram ignorados (os de preview): `/` sem sessão redireciona para `/entrar`; `axe` sem violações em `/entrar`; usuário entra, vê e-mail e perfil e sai; admin vê "Administrador"; senha errada mostra mensagem neutra; cadastro de e-mail fora da lista é recusado e não cria usuário, conferido com o cliente administrativo |
| Validador | `node --test scripts/validate-governance.test.mjs`: 26 de 26; `node scripts/validate-governance.mjs`: 0 erro e 0 aviso, com a migração e a RLS reconhecidas |
| `git diff --check` | Passou |
| Checks remotos (PR #12) | `app` 1 min 35 s, `database` 2 min 13 s e `Governance` 7 s, todos com sucesso. Em `main`, após o merge: `app` 1 min 22 s, `database` 2 min 33 s, `Governance` e `Release Please` com sucesso |
| Gate M-B | Concedido em 2026-10-12; merge `8d304b8` e issue #9 fechada |

## Decisões incidentais e desvios

- **Hook testado em duas camadas.** No `supabase test db` a conexão é do papel `postgres`, que não pode assumir `supabase_auth_admin` ("role memberships are reserved"). O pgTAP testa o comportamento da função e os privilégios que o `supabase_auth_admin` precisa (uso dos schemas, `EXECUTE` e a política de leitura da lista); a execução como esse papel é provada pelo teste ponta a ponta e pelo `signup` no GoTrue real.
- **Job `database` separado do `app`.** O build sem variáveis do Supabase (previews) e o build com backend precisam de ambientes distintos, porque `NEXT_PUBLIC_*` é substituída no build. O job `app` constrói sem variáveis e roda os testes de preview; o job `database` sobe o Supabase, roda `supabase test db`, exporta as variáveis a partir de `supabase status -o env` (com a chave secreta mascarada), constrói com backend e roda os testes de autenticação. Cada job instala o Chromium. Tempo medido na PR #12: `app` 1 min 35 s e `database` 2 min 13 s, cerca de 3 min 48 s de runner por execução, contra a cota de 2.000 minutos mensais.
- **`home.spec.ts` substituído.** A página `/` deixou de ser pública, então os testes da página inicial provisória foram trocados por `preview.spec.ts` (sem backend) e `auth.spec.ts` (com backend). O `axe` continua cobrindo a página de entrada e o aviso.
- **Proxy.** O `proxy.ts` só renova a sessão com `getClaims()`; a decisão de acesso de `/` usa `getUser()` no servidor.
- **Observação para ciclos futuros.** `profiles.email` é copiado na criação do usuário e não acompanha uma troca posterior de e-mail em `auth.users`. A autorização depende da lista só na criação (D1 trata a revogação). Não foi alterado por estar fora do escopo.
- **Senha de teste.** `auth.spec.ts` usa uma senha fictícia de teste para usuários criados e removidos no Supabase local; ela não é credencial real.
- **Efeito no release-please.** O `feat` desta PR fez o release-please abrir a PR de release #13 propondo `1.0.0`, e não `0.1.0`, com a branch `release-please--branches--main--components--saldo-futuro`. A correção segue pela trilha curta (issue #14) e a PR #13 não deve ser integrada antes dela (Gate M-R).
- **`npm audit`.** Mesmas 5 vulnerabilidades de desenvolvimento registradas na task da issue #8; as novas dependências não acrescentaram outras.

## Resultado

### Handoff de execução

- `handoff_schema_version`: `1`
- `handoff_id`: `saldo-futuro:001:implementar_issue:issue-9:52583ce`
- `identity_source`: `repository + cycle + workflow + logical_target + source_revision`; timestamp e UUID não definem a identidade.
- `effect_class`: `local_mutation -> remote_mutation`
- `state_before` / `state_after`: antes, `main` @ `52583ce` com a issue A integrada, issue #9 aberta e sem branch nem PR; depois, PR #12 integrada em `8d304b8`, com a issue #9 fechada.
- `next_transition`: PR B -> checks -> revisão manual das políticas -> Gate M-B.
- `preconditions`: Gate X-B concedido; issue #8 integrada.
- `authority`: o responsável (Thiago Andrade).
- `evidence`: PR #12, commit `4ac3199` da branch (squash `8d304b8`), checks `app`, `database`, `Governance` e `Release Please`, e a seção "Evidências".
- `acceptance`: critérios B1 a B3 da issue #9 atendidos, escopo preservado, gates registrados e PR rastreável.
- `blockers`: nenhum para a issue #9; a divergência do release-please é tratada pela issue #14.
- `result`: `executed`
- `next_workflow_recommended` / `next_workflow_authorized`: `implementar_issue` para a issue #10 após o Gate X-C / nenhuma ação autorizada além da correção da issue #14.
- `actions_prohibited`: iniciar a issue #10, `db push`, tocar em projeto remoto do Supabase, ampliar escopo.
- `rejection_rule`: o receptor recusa handoff ausente, incompatível, contraditório ou sem evidência material.
- `logical_key`: `saldo-futuro + 001 + implementar_issue + issue-9(B1-B3) + 52583ce`.
- `check_before_mutation`: nenhuma task, branch ou PR existia para a chave lógica antes desta criação.
- `reconcile_existing`: atualizar esta task, a branch `feature/issue-9` e a PR sem duplicar.
- `ambiguous_state`: parar se houver mais de uma branch ou PR para a issue #9, ou divergência entre issue, task e plano.
