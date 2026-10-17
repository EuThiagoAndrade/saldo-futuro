# Task — Issue #53: Exibir logo no cabeçalho mobile

> **Ciclo:** `005`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `feature`
> **Issue:** `#53`
> **Plano:** `_project/executed/005_logo_mobile_desempenho_navegacao/005_plan.md`
> **Branch:** `feature/issue-53`
> **PR:** [#56](https://github.com/EuThiagoAndrade/saldo-futuro/pull/56)
> **Integração:** `Integrada em 2026-10-17 por squash, commit `355fbb340ef0dda26f7f5c90fa4ee66767085971``
> **Autorização inicial:** "autorizo a implementação da issue #53" em 2026-10-16
> **Modo contínuo:** `—`
> **Início:** 2026-10-16
> **Última atualização:** 2026-10-17
> **handoff_schema_version:** `2`

## Objetivo

Exibir o logo completo existente no cabeçalho mobile do app autenticado, como link para Início, preservando Ocultar valores e o contrato visual.

## Escopo autorizado

Issue https://github.com/EuThiagoAndrade/saldo-futuro/issues/53 e item 2 (B) do plano v1, publicado na PR #51. A dependência A (#52) foi integrada pela PR #55 em `7dbba4b5678ab4820ee3fed22c8575b64908df10`. Alterar somente o cabeçalho e as verificações necessárias; reutilizar `design-system/assets/logo-saldo-futuro.svg`. Sem novo asset, mudança de contrato visual/tokens, novas telas, cálculo, sessão, banco ou otimização de leitura.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Não altera regras, cálculos ou insumos financeiros; mantém o comportamento atual de Ocultar valores. |
| G2 — isolamento por RLS | Sim, preservação | A alteração fica no layout autenticado. Não muda autenticação, autorização, consultas, políticas ou dados; regressões usam somente contas/fixtures fictícias. |
| G3 — privacidade de dados | Sim | Não usar carteiras reais em testes, capturas ou evidências; conferir ocultação desde o servidor e ausência de exposição transitória. |
| G4 — migrações só acrescentam | Não | Nenhuma migração ou mudança de schema prevista. |

## Execução

- [x] Issue #53 aberta, autorização explícita, plano aprovado e dependência A integrada pela PR #55 conferidos.
- [x] Base `origin/main` atualizada no merge `7dbba4b`; branch `feature/issue-53` criada a partir dela.
- [x] Inspecionar o layout e os testes atuais; implementar o logo responsivo com dimensões reservadas e alvo/foco acessíveis.
- [x] Validar 360, 390, 768, 1024 e 1280 px, ambos os estados de ocultação, desktop, folha Mais, teclado, sem JavaScript e axe.
- [x] Executar gates locais aplicáveis do plano, revisar diff/privacidade e registrar resultados reais.
- [x] Staging seletivo revisado; commit `f73a0cde528227cbc50fd5146d8de0069e2625db` e PR #56 criados; checks remotos passaram nesse HEAD.
- [x] PR #56 integrada por squash em `355fbb340ef0dda26f7f5c90fa4ee66767085971`; issue #53 fechada no GitHub; task reconciliada no início da implementação da #54.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Lint, typecheck e unitários | `npm run lint` passou (3 avisos preexistentes em arquivo ignorado de validação); `npm run typecheck` passou; `npm test` — 201 passaram. |
| Build | `npm run build -- --webpack` passou, inclusive com backend local. `npm run build` pelo Turbopack falhou ao iniciar o processo filho para `globals.css` (panic/exit code 0) em duas tentativas. |
| Banco e E2E | `npx supabase test db` — 6 arquivos/239 testes pgTAP passaram. E2E autenticado serial — 80 passaram, 6 skips esperados; a tentativa paralela anterior perdeu o servidor local por carga. |
| Governança | `node --test scripts/validate-governance.test.mjs` — 39 passaram; `node scripts/validate-governance.mjs` — 0 erros, 0 avisos, 4 verificações manuais; `git diff --check` passou. |
| Checks remotos | No HEAD `f73a0cde`: CI principal, Supabase/banco/E2E autenticado, governança e Vercel passaram. |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

Workflow `.agent/workflows/implementar_issue.md`, template `.agent/templates/task.md`, template da PR e gate `.agent/skills/governance-check/governance-check.md` lidos no ponto de uso, junto das autoridades `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, `.agent/lessons_learned.md`, plano aprovado e `design-system/DESIGN.md`. Issue #53 foi conferida aberta antes da implementação; agora está fechada após a PR #56. PR #55 conferida integrada; nenhuma branch ou PR anterior de #53 encontrada. Não usar dados reais.

Implementação: o link da marca aparece só abaixo do breakpoint `lg`, usa o SVG institucional já existente e aponta para `/`; `next/image` reserva a altura de 32 px, enquanto o link mantém alvo mínimo 44×44 px e foco visível. Os testes cobrem as cinco larguras aprovadas, bordas/folgas/ausência de overflow, estado de ocultação antes e depois da ação, desktop, marca na folha Mais, navegação por teclado e funcionamento do formulário sem JavaScript. Não houve alteração em tokens, contrato visual, autenticação, lógica financeira, dependências ou schema; não foram usadas carteiras reais.

A primeira tentativa do validador de governança foi limitada por `EPERM` ao renomear fixtures no diretório temporário do sandbox; a execução repetida com acesso a esses diretórios passou integralmente (39/39). A tentativa E2E paralela derrubou o servidor local e foi descartada; a repetição serial passou (80 aprovados, 6 skips).

## Encerramento

Não se aplica.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 005 (completo)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 005 + implementar_issue + 53/B_logo_mobile + PR56@355fbb340ef0dda26f7f5c90fa4ee66767085971`
- `effect_class`: `local_mutation`
- `state_before`: task #53 `Em andamento`; PR #56 aguardando merge na última task registrada.
- `state_after`: task #53 `Concluída`; PR #56 `MERGED` por squash em `355fbb340ef0dda26f7f5c90fa4ee66767085971`; issue #53 `CLOSED`; próxima issue autorizada: #54.
- `result`: `already_executed_and_reconciled`
- `evidence`: PR #56 https://github.com/EuThiagoAndrade/saldo-futuro/pull/56 reporta `merged=true` e SHA do merge; issue #53 https://github.com/EuThiagoAndrade/saldo-futuro/issues/53 reporta `closed` em 2026-10-17; `origin/main` atualizado para o mesmo SHA.
- `blockers`: nenhum para a reconciliação; issue #52 continua `OPEN` no GitHub apesar da integração da entrega A via PR #55.
