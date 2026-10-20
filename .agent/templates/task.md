# Task — Issue #N: título

> **Ciclo:** `NNN` (trilha curta: `—`)
> **Trilha:** `normal | curta`
> **Estado:** `Em andamento | Aguardando integração | Concluída | Bloqueada`
> **Tipo:** `feature | fix | chore`
> **Issue:** `#N`
> **Plano:** `_project/drafts/NNN_assunto/NNN_plan.md` (trilha curta: `—`)
> **Branch:** `tipo/issue-N`
> **PR:** —
> **Integração:** `Pendente`
> **Autorização inicial:** "<frase>" em AAAA-MM-DD
> **Modo contínuo:** `— | ativo | suspenso`
> **Início:** AAAA-MM-DD
> **Última atualização:** AAAA-MM-DD
> **handoff_schema_version:** `2`

## Objetivo

## Escopo autorizado

## Origem no backlog

Opcional para artefatos novos: `Não se aplica` sem origem; na trilha normal, herdar o snapshot do plano. Na curta, IDs selecionados, síntese, parcela e `_project/backlog.md` no commit da fila, sinalizando local/não publicado. Destino em preparação não altera item. IDs devem existir em main antes de integrar destino; retorno após integração comprovada usa `issue #N` na curta e `ciclo NNN` na normal. Não reescrever a síntese por edições futuras do backlog.

## Elegibilidade da trilha curta

Preencha somente na trilha curta; na trilha normal, escreva `Não se aplica`. Justifique cada critério de `_project/README.md`:

- Correção de comportamento já especificado:
- Sem mudança de escopo:
- Sem mudança de schema que altere semântica:
- Sem mudança de contrato visual:

## Barreiras de domínio

Toda linha é obrigatória. "Não se aplica" exige justificativa. Com G1 ou G2 marcados com "Sim", o modo contínuo não pode estar `ativo`.

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | | |
| G2 — isolamento por RLS | | |
| G3 — privacidade de dados | | |
| G4 — migrações só acrescentam | | |

## Execução

- [ ] Passo ou critério real.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | Pendente |
| Validador | Pendente |
| `git diff --check` | Pendente |
| Checks remotos | Pendente |

## Revisão da correção

Somente na trilha curta; na trilha normal, escreva `Não se aplica`. Uma subseção `### Rodada N` por rodada, no formato de "Revisão formal" de `_project/README.md`, antes da abertura da PR.

## Decisões incidentais e desvios

## Encerramento

Somente na última issue do ciclo leve; nos demais casos, escreva `Não se aplica`. Checklist do encerramento prospectivo: documentação viva atualizada, plano `Concluído`, tasks `Concluída`, `cycles.md` e movimentação para `executed/`.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: <situação> — <ciclo NNN (nível) | correção da issue #N>
Quem: <coluna "Quem age">
Conferir: <o que conferir>
Diga: "<frase>"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `repository + NNN + <workflow> + issue_number + revisão da base`
- `effect_class`: `local_mutation | remote_mutation`
- `state_before` / `state_after`:
- `result`: `executed | already_executed_and_reconciled | ambiguous_human_intervention_required | not_executed`
- `evidence`:
- `blockers`:
