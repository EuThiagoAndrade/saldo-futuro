# Task — Issue #192: retorno da edição e faixa de prazo

> **Ciclo:** `019`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `feature`
> **Issue:** `#192`
> **Plano:** `_project/executed/019_filtros_selecao_ativos/019_plan.md`
> **Branch:** `feature/issue-192`
> **PR:** —
> **Integração:** `Pendente` — conclusão prospectiva condicionada ao merge desta PR.
> **Autorização inicial:** "autorizo a implementação da issue #192" em 2026-11-07
> **Modo contínuo:** `—`
> **Início:** 2026-11-07
> **Última atualização:** 2026-11-07
> **handoff_schema_version:** `2`

## Objetivo

Preservar os filtros na edição e permitir faixa inclusiva de prazo.

## Escopo autorizado

Issue #192, decisões D8 e D9 e encerramento prospectivo do ciclo 019.

## Origem no backlog

BL-019, parcela integral, conforme snapshot do plano no commit `d7533c6ae904b3e1379f90028c3e6a5c84c25b8e`. Destino em preparação.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Comparação de inteiros informados, sem cálculo financeiro. |
| G2 — isolamento por RLS | Não | Nenhum leitor, tabela ou política nova. |
| G3 — privacidade de dados | Sim | Somente dados fictícios em testes e documentação. |
| G4 — migrações só acrescentam | Não | Nenhuma migração prevista. |

## Execução

- [x] Implementar retorno seguro da edição e faixa inclusiva nos filtros compartilhados.
- [x] Responsável escolheu "Sem JavaScript, limpar ao aplicar (mantém a interação atual)" em 2026-11-07; solução e teste de envio sem JavaScript preparados.
- [x] Consolidar documentação viva e preparar encerramento prospectivo; gates locais executados.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | Typecheck, build, lint (0 erros, 3 avisos preexistentes), 540 testes unitários e 48 testes de governança passaram. E2e com Supabase local, Chrome e um worker: 35/35 em consulta e seletores, mais 35/35 em ativos, detalhes e carteira; inclui sem JavaScript, acessibilidade, retorno e isolamento. Uma execução anterior sofreu encerramento do worker; a repetição completa passou sem falhas. |
| Validador | 0 erros, 0 avisos; revisão manual de privacidade, barreiras e rastreabilidade realizada. |
| `git diff --check` | Passou na revisão parcial, com avisos de final de linha. |
| Checks remotos | Pendente |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

Com JavaScript, a troca limpa os campos. Sem JavaScript, a normalização ocorre ao aplicar; se a pessoa alternar e voltar à escolha anterior antes de aplicar, o valor oculto ainda está no formulário. O responsável escolheu "Sem JavaScript, limpar ao aplicar (mantém a interação atual)" em 2026-11-07, esclarecendo o contrato para esse caso. A PR de release #194 para 0.15.0 permanece aberta e deve ser conferida na preparação da PR.

## Encerramento

Encerramento prospectivo autorizado pelo plano: DESIGN.md e KB-003 consolidados; plano e tasks concluídos, pasta em `executed/` e registro do ciclo atualizado como estado após o merge. Release e retorno ao backlog seguem em procedimentos próprios.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 019 (leve)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 019 + implementar_issue + 192/BL-019 + 33973c94c26633c75240f039ed091efdc20d260f`
- `effect_class`: `local_mutation`
- `state_before`: plano aprovado, #192 aberta, #191 integrada pela PR #195.
- `state_after`: implementação validada e encerramento prospectivo preparado; ainda sem commit ou PR.
- `result`: `executed`
- `evidence`: GitHub PR #195, base `33973c9`, código e resultados registrados em Evidências.
- `blockers`: publicação da PR e aprovação específica de seu merge pendentes.
