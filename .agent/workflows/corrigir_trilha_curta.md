---
description: "Corrigir um defeito elegível pela trilha curta, com issue, task e PR, sem ideação nem plano e sem dispensar as barreiras de domínio."
---

# Workflow: Corrigir pela trilha curta

## Entradas

- Issue `[FIX]` aberta, criada por `.github/ISSUE_TEMPLATE/bug_report.yml` com a opção "trilha curta".
- Autorização humana explícita para corrigir essa issue.
- Critérios de elegibilidade e barreiras G1 a G4 em `_project/README.md`.
- Autoridades `.agent/ai_behavior.md`, `_project/README.md` e `.agent/lessons_learned.md`.
- Templates locais `.agent/templates/task.md` e `.github/pull_request_template.md`.
- Gate local `.agent/skills/governance-check/governance-check.md`.

## Barreira

- Confirmar a issue, a autorização e a base antes de criar branch, task ou código.
- Avaliar os quatro critérios de elegibilidade com evidência. Se algum falhar, registrar o motivo na issue e parar: o defeito segue o fluxo normal de ciclo.
- Não ampliar escopo: a correção restaura o comportamento especificado e nada mais.
- Nenhuma barreira é dispensada; "não se aplica" exige justificativa.

## Execução

1. Ler `.agent/ai_behavior.md`, `_project/README.md` e `.agent/lessons_learned.md`.
2. Criar ou reconciliar a branch `fix/issue-N` e a task `_project/fixes/fix_task_issue-N.md` a partir de `.agent/templates/task.md`, com `Trilha: curta`, ciclo e plano `—`, a justificativa de cada critério de elegibilidade e a tabela de barreiras.
3. Escrever um teste que reproduza o defeito e falhe antes da correção. Em regra de cálculo, o teste usa casos de referência com valores esperados calculados independentemente (G1).
4. Corrigir. Uma migração, se necessária, é nova e aditiva (G4) e mantém RLS (G2). Fixtures são fictícias (G3).
5. Reavaliar a elegibilidade com o diff final; se ela deixou de valer, parar e pedir decisão.
6. Executar os testes, a inspeção de `.agent/skills/governance-check/governance-check.md` e `git diff --check`; registrar evidências reais na task.
7. Fazer staging seletivo e commitar com `fix(issue-N):`.
8. Ler `.github/pull_request_template.md`, preencher todas as seções, incluindo o checklist das barreiras, publicar a branch e abrir a PR com `Closes #N`.
9. Aguardar checks e o gate humano de integração; concedido o gate e com checks verdes, integrar por squash e reconciliar a task.

## Saída

- Mutação prevista: `local_mutation` e, após validação, `remote_mutation` para branch e PR.
- Resultado permitido: `executed`, `already_executed_and_reconciled`, `ambiguous_human_intervention_required` ou `not_executed`.
- A trilha curta não altera `_project/cycles.md` nem cria plano.

## Handoff

- `handoff_schema_version`: `1`
- `handoff_id`: `repository + cycle + workflow + logical_target + source_revision`, com ciclo `fix`.
- `identity_source`: repositório, ciclo (`fix`), workflow, alvo lógico (issue) e revisão de origem; identidade estável, sem timestamp/UUID.
- `effect_class`: `local_mutation -> remote_mutation`
- `state_before`: issue `[FIX]` aberta e autorizada, base observada.
- `state_after`: correção implementada com teste, task com elegibilidade e barreiras, PR vinculada, ou bloqueio explícito.
- `next_transition`: `PR -> checks -> gate de integração`.
- `preconditions`: issue elegível, autorização, base atualizada e task persistente.
- `authority`: autorização humana explícita para corrigir; o merge exige o gate de integração.
- `evidence`: issue e PR, teste que falhava antes, commits, validador e checks.
- `acceptance`: defeito corrigido, elegibilidade justificada, barreiras declaradas e escopo preservado.
- `blockers`: inelegibilidade, falha de teste, check pendente ou gate ausente.
- `result`: `executed` | `already_executed_and_reconciled` | `ambiguous_human_intervention_required` | `not_executed`.
- `next_workflow_recommended`: revisão da PR e integração após o gate.
- `next_workflow_authorized`: somente as ações explicitamente autorizadas.
- `actions_prohibited`: ampliar escopo, alterar migração existente, usar dado real, integrar sem gate.
- `rejection_rule`: o receptor recusa handoff sem issue, sem elegibilidade justificada, sem barreiras declaradas ou sem teste de reprodução.
- `logical_key`: `repository + fix + corrigir_trilha_curta + issue_number + source_revision`.
- `check_before_mutation`: localizar task, branch e PR existentes para a issue.
- `reconcile_existing`: retomar a branch, task e PR canônicas sem duplicá-las.
- `ambiguous_state`: parar quando houver mais de uma branch ou PR para a issue ou quando a elegibilidade for incerta.
