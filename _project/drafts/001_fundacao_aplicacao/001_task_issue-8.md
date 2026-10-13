# Task — Issue #8: Scaffold, qualidade, CI e release-please da aplicação

> **Ciclo:** `001`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `chore`
> **Issue:** `#8`
> **Plano:** `_project/drafts/001_fundacao_aplicacao/001_plan.md`
> **Branch:** `chore/issue-8`
> **PR:** [#11](https://github.com/EuThiagoAndrade/saldo-futuro/pull/11)
> **Integração:** `Integrada por squash em 52583ce (2026-10-12)`
> **Início:** 2026-10-12
> **Última atualização:** 2026-10-12
> **handoff_schema_version:** `1`
> **handoff_id:** `saldo-futuro:001:implementar_issue:issue-8:9bb4f8a`

Instanciada a partir de `.agent/templates/task.md`. A sequência operacional é `.agent/workflows/implementar_issue.md`.

## Objetivo

Entregar a base da aplicação (Itens A0 a A3 do plano `001`): transição do plano e do ciclo para execução, scaffold Next.js com os tokens e a fonte do `DESIGN.md`, qualidade e CI, e release-please.

## Escopo autorizado

- Gate X-A concedido pelo responsável em 2026-10-12, para a issue #8 (`[CHORE]`), sobre `main` @ `9bb4f8a`.
- Itens A0, A1, A2 e A3 do plano, com as ressalvas S1 a S4 da revisão (S1 e S3 não se aplicam à issue A).
- Fora do escopo: Supabase, autenticação, schema e rotas (issue #9); keepalive, PWA e KB-002 (issue #10); merge da PR (Gate M-A, autorização própria).

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Não há regra de cálculo nem quantia monetária; a página inicial é provisória e sem valores |
| G2 — isolamento por RLS | Não | Não há tabela nem migração nesta issue; a heurística do validador continua ativa |
| G3 — privacidade de dados | Sim | `.env.example` só com nomes; nenhum dado do usuário em código, testes ou textos; o tooling de governança só muda no manifesto |
| G4 — migrações só acrescentam | Não | Não há migração nesta issue |

## Execução

- [x] A0: plano em `Em Execução`, rastreabilidade com as issues #8, #9 e #10 e a branch `chore/issue-8`; `cycles.md` com o ciclo `001` em `Em execução` e as três issues.
- [x] A1: `package.json` com versões exatas, `tsconfig.json` estrito, Next.js, Tailwind 4, `globals.css` com o bloco `@theme` do `DESIGN.md`, fonte local por `@font-face`, página inicial provisória e seção "Desenvolvimento local" no README.
- [x] A2: ESLint, `typecheck`, Vitest (esquema de ambiente e contrato de tokens), Playwright com axe, `.env.example`, `ci.yml`, manifesto do validador e gates mínimos em `_project/README.md`.
- [x] A3: `release-please-config.json`, `.release-please-manifest.json` em `0.0.0`, `release-please.yml` e a exceção documentada em `_project/README.md`.
- [x] Gates locais executados (ver Evidências).
- [x] PR #11 publicada; checks remotos verdes e tempo do workflow `CI` registrados.
- [x] Após o merge gerou-se `Release Please` sem erro e sem PR de release (commit `chore`). Os nomes reais da branch e do commit de release seguem pendentes de conferência na primeira PR de release, que aparece após o primeiro `feat` (Gate M-R).

## Evidências

| Gate | Resultado |
| :-- | :-- |
| `npm ci` (de `node_modules` removido), `npm run lint`, `npm run typecheck`, `npm run build` | Passaram; sequência completa com os testes em 1 min 7 s na máquina local |
| `npm test` | 2 arquivos e 7 testes passaram (esquema de ambiente; contrato de tokens) |
| `npm run test:e2e` | 2 testes passaram no Chrome instalado (`PLAYWRIGHT_CHANNEL=chrome`): página inicial e `axe` com as tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` e `wcag22aa`, sem violações. O Chromium pinado do Playwright 1.64.0 (v1248) não estava instalado e não foi baixado; ele roda no CI |
| Demonstração: `axe` falha | Trocando `text-text-secondary` por `text-border` na página, o teste falhou com `color-contrast` (1,3:1 contra o mínimo de 4,5:1); alteração revertida |
| Demonstração: contrato de tokens falha | Trocando `--color-primary: #0b2a55` por `#0b2a56` em `globals.css`, 2 testes falharam (bloco idêntico ao `DESIGN.md` e cor fora do `@theme`); alteração revertida |
| Bloco `@theme` idêntico ao `DESIGN.md` | `src/app/theme-contract.test.ts` compara o bloco `css` com `@theme` da seção 5 com `globals.css`; `--color-*: initial` verificado |
| Navegador (build de produção em `127.0.0.1`) | `font-family` computada do `body`: `"IBM Plex Sans", ui-sans-serif, …`; os 3 pesos (400, 500, 600) da família `IBM Plex Sans` com status `loaded`, de `/_next/static/media/`; 0 requisições a outra origem; `font-variant-numeric: lining-nums tabular-nums` |
| Algarismos de largura igual | A 40 px, nos pesos 400, 500 e 600: `1111`, `8888` e `0000` = 96 px cada (600 unidades por algarismo) e U+2212 = 24 px; o hífen mede cerca de 16 px |
| Versões | Nenhuma versão com `^` ou `~` em `package.json`; `package-lock.json` versionado; as versões são as da tabela do plano |
| Validador | `node --test scripts/validate-governance.test.mjs`: 26 de 26 passaram; `node scripts/validate-governance.mjs`: 0 erro, 0 aviso; remover `package.json`, `ci.yml` ou `.env.example` produz erro de arquivo obrigatório ausente |
| `git diff --check` | Ver a seção "Resultado" após o staging |
| Checks remotos (PR #11) | `CI` passou em 1 min 14 s e `Governance` em 13 s. Em `main`, após o merge: `CI` 1 min 15 s, `Governance` e `Release Please` com sucesso; este não abriu PR de release |
| Gate M-A | Concedido pelo responsável em 2026-10-12. A opção "Allow GitHub Actions to create and approve pull requests" continuava desabilitada na API no momento do merge e deve ser habilitada antes do primeiro `feat` |

## Decisões incidentais e desvios

- Opção "Allow GitHub Actions to create and approve pull requests": em 2026-10-12, `gh api repos/.../actions/permissions/workflow` retorna `can_approve_pull_request_reviews: false`. A habilitação é precondição do Gate M-A, ação do responsável.
- **Fonte por `@font-face`.** O `next/font/local` com `declarations` de `font-family` gerou a família `IBM Plex Sans`, mas o `className` aplicado ao `body` usava o nome gerado (`plexSans`), de modo que a `font-family` computada não resolvia para a Plex. O mecanismo é livre no plano (Item A1); foi adotado `@font-face` em `globals.css` com `url()` para `design-system/assets/fonts/`, sem cópia dos arquivos e sem CDN.
- **`typecheck` gera os tipos antes.** Sem `next-env.d.ts` (ignorado pelo Git), o `tsc` não resolve a importação do SVG da marca; o script é `next typegen && tsc --noEmit`.
- **`PLAYWRIGHT_CHANNEL`.** O Chromium do Playwright 1.64.0 não estava instalado; para não baixá-lo, o `playwright.config.ts` aceita `PLAYWRIGHT_CHANNEL=chrome` para usar o Chrome instalado. Sem a variável, usa o Chromium do Playwright, como o CI.
- **Manifesto e teste do validador (decisão do responsável, 2026-10-12).** Tornar `package.json` obrigatório quebrou a asserção do aviso "Nenhum package.json" no teste da CLI, porque a fixture passou a ter o arquivo. O critério A2 diz que só o manifesto muda no tooling; o responsável autorizou remover só essa asserção de `scripts/validate-governance.test.mjs`. O tooling mudou, portanto, em dois arquivos: o manifesto e essa linha do teste. O aviso no validador ficou sem efeito prático e não foi removido.
- **release-please sem componente no nome.** Com `include-component-in-tag` padrão, o release-please usaria o nome do pacote na branch, no commit e na tag; foi definido `"include-component-in-tag": false` para obter `release-please--branches--main` e `chore(main): release x.y.z`, como o plano espera. A conferência real ocorre após o merge.
- **`npm audit`.** 5 vulnerabilidades altas, todas na cadeia de desenvolvimento `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces` (negação de serviço por padrões aninhados em `braces`). Não entram no build de produção. A correção oferecida (`--force`) instalaria `eslint-config-next@14`, mudança de major fora das versões fixadas pelo plano; não foi aplicada. Fica para decisão do responsável.
- **Escopo do README.** Além da seção "Desenvolvimento local", foram ajustadas as frases que ficariam falsas com o scaffold ("ainda não existe código", estado do ciclo `001` e "ciclos `001` a `004` sem plano").
- O trecho "Bloqueador atual" de "Dependências e blockers" do plano continua citando o Gate X-A; o Item A0 só autoriza a mudança de status e de rastreabilidade, e o texto não foi alterado.

## Resultado

### Handoff de execução

- `handoff_schema_version`: `1`
- `handoff_id`: `saldo-futuro:001:implementar_issue:issue-8:9bb4f8a`
- `identity_source`: `repository + cycle + workflow + logical_target + source_revision`; timestamp e UUID não definem a identidade.
- `effect_class`: `local_mutation -> remote_mutation`
- `state_before` / `state_after`: antes, `main` @ `9bb4f8a` limpa, issue #8 aberta e sem branch nem PR; depois, PR #11 integrada em `52583ce`, com a issue #8 fechada.
- `next_transition`: PR A -> checks -> Gate M-A.
- `preconditions`: Gate X-A concedido; issues #8, #9 e #10 abertas.
- `authority`: o responsável (Thiago Andrade).
- `evidence`: PR #11, commit `4ac3199` (squash `52583ce`), checks `CI`, `Governance` e `Release Please`, e a seção "Evidências".
- `acceptance`: critérios de aceite A0 a A3 da issue #8 atendidos, escopo preservado, gates registrados e PR rastreável.
- `blockers`: nenhum para a issue #8; a permissão do Actions é ação pendente do responsável.
- `result`: `executed`
- `next_workflow_recommended` / `next_workflow_authorized`: `implementar_issue` para a issue #9 / autorizado pelo Gate X-B em 2026-10-12, registrado na task da issue #9.
- `actions_prohibited`: reabrir o escopo da issue #8, ampliar escopo, configurar serviço externo.
- `rejection_rule`: o receptor recusa handoff ausente, incompatível, contraditório ou sem evidência material.
- `logical_key`: `saldo-futuro + 001 + implementar_issue + issue-8(A0-A3) + 9bb4f8a`.
- `check_before_mutation`: nenhuma task, branch ou PR existia para a chave lógica antes desta criação.
- `reconcile_existing`: atualizar esta task, a branch `chore/issue-8` e a PR sem duplicar.
- `ambiguous_state`: parar se houver mais de uma branch ou PR para a issue #8, ou divergência entre issue, task e plano.
