# Task — Issue #76: Posição implícita zero na cobertura da migração

> **Ciclo:** `006`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `feature`
> **Issue:** `#76`
> **Plano:** `_project/executed/006_migracao_dados_virada/006_plan.md` (`v5`, item 5 — E)
> **Branch:** `feature/issue-76`
> **PR:** [#77](https://github.com/EuThiagoAndrade/saldo-futuro/pull/77)
> **Integração:** `Integrada` (PR #77, squash em 2026-10-18; issue #76 fechada pelo merge)
> **Autorização inicial:** "autorizo a implementação da issue #76" em 2026-10-18
> **Modo contínuo:** `—`
> **Início:** 2026-10-18
> **Última atualização:** 2026-10-18
> **handoff_schema_version:** `2`

## Objetivo

Aceitar, na simulação da migração, a posição ausente depois de um mês com saldo zero e sem nenhum evento do ativo no mês, como posição implícita zero (M10 revisado na `v5`), mantendo a recusa para qualquer outra ausência.

## Escopo autorizado

O payload da issue #76 (Unidade E de `006_handoff_issues.md`), com a nota da rodada 5: a ausência de evento considera todos os registros da origem, inclusive calculados e de valor zero; a contagem `posicoesImplicitasZero` conta posições acrescentadas.

Fora: banco, `gravar`, `conferir`, outras regras; simulação real, `db push` e `gravar`.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim | M10 revisado em `simular.ts` (`preencherPosicoesImplicitas`, antes de M10); `CR-M08` na KB-004 e no JSON, com paridade verde; testes de meses consecutivos, ativo desativado (M9) e ativo que fica ativo, saldo real `"0"` no fechamento, identidade e patrimônio; recusa mantida com evento manual, calculado ou de valor zero no mês e depois de saldo diferente de zero. Conferência independente às cegas (outro modelo, só regras e entradas): 14 de 14 valores iguais; a observação de contagem por mês, não por ativo, coincide com a nota da rodada 5. |
| G2 — isolamento por RLS | Não | Nenhuma tabela, função, política ou permissão muda; o fechamento usa as funções autenticadas existentes. `supabase test db` continua sendo executado. |
| G3 — privacidade de dados | Sim | Só fixtures fictícias; nenhum dado real lido ou versionado nesta implementação. |
| G4 — migrações só acrescentam | Não | Nenhuma migração. |

## Execução

- [x] Posição implícita zero em `simular.ts` e contagem no resumo.
- [x] Testes de unidade e `CR-M08`.
- [x] Integração `gravar` + `conferir`.
- [x] KB-004 e KB-002.
- [x] Gates locais, PR.
- [x] Depois do merge: simulação local só com códigos e contagens (coberta pela aprovação da `v5`): aceita, com 132 posições implícitas zero.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| `npm test` (Vitest) | 21 arquivos, 265 testes verdes, inclusive a paridade KB-004/JSON. |
| `npx supabase test db` | 7 arquivos, 261 asserções verdes (sem mudança de banco). |
| `npm run lint` / `npm run typecheck` | Sem erros; 3 avisos preexistentes num arquivo de `local/`, fora do Git. |
| Integração da migração (`tests/e2e/migracao.spec.ts`) | 22 testes verdes, inclusive o novo: carteira com duas posições implícitas gravada e conferida sem diferença, com saldo real `"0"` no fechamento e os mesmos meses do relatório da carteira com as posições gravadas. |
| `npm run test:e2e` completo | 101 verdes e 9 ignorados (sem as variáveis opcionais), sem falha nem queda de processo. |
| Validador | `node --test scripts/validate-governance.test.mjs` 39/39; `node scripts/validate-governance.mjs` 0 erros, 0 avisos, 4 itens manuais |
| `git diff --check` | Limpo |
| Checks remotos | Os cinco checks verdes no HEAD aprovado da PR #77 antes do merge. |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

1. **Onde as posições implícitas nascem.** Antes de M10, sobre os dados normalizados, para que M10, o replay, M9, o plano e o relatório as vejam igualmente; a sequência começa no mês seguinte à primeira posição e vai até o último mês fechado da origem.

## Encerramento

Não se aplica.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 006 (completo)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 006 + implementar_issue + 76/E + base 3afd8907ca296a58b2d77a82dd841551f23c1646`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: issue #76 `OPEN`, sem branch nem task / branch `feature/issue-76`, task `Aguardando integração`, PR #77 aberta contra `main`; plano `Em Execução`
- `result`: `executed`
- `evidence`: autorização do responsável em 2026-10-18; gates locais e conferência independente em "Evidências" e G1
- `blockers`: checks remotos e "aprovo o merge da PR #77"; depois do merge, a simulação local (coberta pela aprovação da `v5`)
