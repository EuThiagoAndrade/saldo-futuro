# Task — Issue #14: Primeira PR de release propõe 1.0.0 em vez de 0.1.0

> **Ciclo:** `—`
> **Trilha:** `curta`
> **Estado:** `Em andamento`
> **Tipo:** `fix`
> **Issue:** `#14`
> **Plano:** `—`
> **Branch:** `fix/issue-14`
> **PR:** —
> **Integração:** `Pendente`
> **Início:** 2026-10-12
> **Última atualização:** 2026-10-12
> **handoff_schema_version:** `1`
> **handoff_id:** `saldo-futuro:fix:corrigir_trilha_curta:issue-14:8d304b8`

Instanciada a partir de `.agent/templates/task.md`. A sequência operacional é `.agent/workflows/corrigir_trilha_curta.md`. Autorização explícita do responsável em 2026-10-12, junto com a reconciliação da task da issue #9.

## Objetivo

Fazer a primeira PR de release propor `0.1.0` (plano `001`, D3 e Item A3) e registrar em `_project/README.md` os nomes reais da branch e do commit de release.

## Escopo autorizado

- `release-please-config.json` com `"initial-version": "0.1.0"`; teste de configuração; nomes reais na exceção de `_project/README.md`.
- Reconciliação da task da issue #9 e da rastreabilidade do plano, autorizada na mesma mensagem.
- Fora do escopo: integrar a PR de release #13 (Gate M-R), alterar o plano, mudar o fluxo de versionamento, a issue #10.

## Elegibilidade da trilha curta

- Correção de comportamento já especificado: o plano `001` fixa a primeira versão em `0.1.0` (D3) e o critério A3 pede os nomes reais; a PR de release #13 propôs `1.0.0` e a documentação cita uma branch diferente da real.
- Sem mudança de escopo: nenhuma capacidade, tela, rota, parâmetro de produto ou integração; só a configuração do release-please já prevista pelo plano.
- Sem mudança de schema que altere semântica: não há migração.
- Sem mudança de contrato visual: o `DESIGN.md` não é tocado.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Não há regra de cálculo nem quantia monetária |
| G2 — isolamento por RLS | Não | Não há tabela nem migração |
| G3 — privacidade de dados | Sim | Só configuração e documentação; nenhum dado do usuário |
| G4 — migrações só acrescentam | Não | Não há migração |

## Execução

- [x] Causa confirmada nos fontes do release-please 17.6.0: sem release anterior, `initialReleaseVersion()` usa `initial-version` (padrão `1.0.0`); o log do workflow mostra `updating from 0.0.0 to 1.0.0`.
- [x] Teste que reproduz o defeito: `src/release-please.test.ts`.
- [x] Correção em `release-please-config.json` e nomes reais em `_project/README.md`.
- [x] Reconciliação da task da issue #9 e do plano.
- [ ] PR publicada e checks.
- [ ] Após o merge: conferir se a PR de release #13 passa a propor `0.1.0`. Se não passar, parar e pedir decisão.

## Evidências

| Gate | Resultado |
| :-- | :-- |
| Teste antes da correção | `npm test`: 1 falha (`expected undefined to be '0.1.0'`) em `a primeira versão é 0.1.0 (D3 do plano 001)`; 14 passaram |
| Teste depois da correção | `npm test`: 15 passaram |
| Defeito original | PR de release #13: título `chore(main): release 1.0.0`, branch `release-please--branches--main--components--saldo-futuro` |
| Validador | `node --test scripts/validate-governance.test.mjs`: 26 de 26; `node scripts/validate-governance.mjs`: 0 erro e 0 aviso; lint e typecheck passaram |
| `git diff --check` | Passou |
| Checks remotos | Pendente |

## Decisões incidentais e desvios

- O teste valida a configuração, não o comportamento do release-please, que só se observa no GitHub após o merge; por isso a conferência da PR #13 é item separado.
- A PR de release #13 não é tocada por esta correção; o release-please deve atualizá-la na próxima execução em `main`.

## Resultado

### Handoff de execução

- `handoff_schema_version`: `1`
- `handoff_id`: `saldo-futuro:fix:corrigir_trilha_curta:issue-14:8d304b8`
- `identity_source`: `repository + cycle + workflow + logical_target + source_revision`; timestamp e UUID não definem a identidade.
- `effect_class`: `local_mutation -> remote_mutation`
- `state_before` / `state_after`: antes, `main` @ `8d304b8` com a PR de release #13 propondo `1.0.0`; depois, a preencher.
- `next_transition`: PR -> checks -> gate de integração -> conferência da PR #13.
- `preconditions`: issue `[FIX]` elegível, autorização explícita e base atualizada.
- `authority`: o responsável (Thiago Andrade).
- `evidence`: teste vermelho e verde, issue #14, PR a abrir, checks.
- `acceptance`: defeito corrigido, elegibilidade justificada, barreiras declaradas e escopo preservado.
- `blockers`: nenhum até aqui.
- `result`: `not_executed`
- `next_workflow_recommended` / `next_workflow_authorized`: revisão da PR e integração após o gate / nenhum merge autorizado.
- `actions_prohibited`: integrar a PR, integrar a PR de release #13, ampliar escopo, alterar migração existente.
- `rejection_rule`: o receptor recusa handoff sem issue, sem elegibilidade justificada, sem barreiras declaradas ou sem teste de reprodução.
- `logical_key`: `saldo-futuro + fix + corrigir_trilha_curta + 14 + 8d304b8`.
- `check_before_mutation`: nenhuma task, branch ou PR existia para a issue #14.
- `reconcile_existing`: retomar a branch, task e PR canônicas sem duplicá-las.
- `ambiguous_state`: parar se houver mais de uma branch ou PR para a issue #14 ou se a elegibilidade ficar incerta.
