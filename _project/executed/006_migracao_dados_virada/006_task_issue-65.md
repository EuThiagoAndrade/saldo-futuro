# Task — Issue #65: Roteiro da virada

> **Ciclo:** `006`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `chore`
> **Issue:** `#65`
> **Plano:** `_project/executed/006_migracao_dados_virada/006_plan.md`
> **Branch:** `chore/issue-65`
> **PR:** [#69](https://github.com/EuThiagoAndrade/saldo-futuro/pull/69)
> **Integração:** `Integrada` (PR #69, 2026-10-18; issue #65 fechada pelo merge)
> **Autorização inicial:** "autorizo a implementação da issue #65" em 2026-10-18
> **Modo contínuo:** `—`
> **Início:** 2026-10-18
> **Última atualização:** 2026-10-18
> **handoff_schema_version:** `2`

## Objetivo

Entregar o roteiro da ação externa da migração e da virada, na KB-002, coerente com o migrador das issues #63 e #64. A PR entrega só o roteiro; a execução é do responsável, depois do merge.

## Escopo autorizado

- Seção "Migração e virada" na KB-002 (M0 a M8): pré-requisitos e regime de gravador único; congelamento da origem logo depois de um fechamento e cópia do SQLite para `local/`; `simular` e conferência do relatório local; sessão do responsável; `gravar`, com o tratamento de cada saída, inclusive operação desconhecida; `conferir`; o que informar ao agente; caminho de volta; data de virada.
- Fora: KB-003 e KB-004 (encerramento), código do migrador, execução contra produção.

## Elegibilidade da trilha curta

Não se aplica; esta é a issue C do ciclo completo 006.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Nenhuma regra ou cálculo muda; o roteiro só manda executar `simular`, `gravar` e `conferir`, que exigem diferença zero. |
| G2 — isolamento por RLS | Não | Nenhuma tabela, política ou função muda. O roteiro usa a sessão do responsável e a chave publicável, e proíbe a chave secreta. |
| G3 — privacidade de dados | Sim | O roteiro mantém SQLite, relatório, plano, diário, trava e sessão em `local/`, manda informar ao agente só as linhas de contagem e proíbe valores, nomes e prints. Nenhum dado real no texto; valores do responsável aparecem como `<...>`. |
| G4 — migrações só acrescentam | Não | Nenhuma migração. |

## Execução

- [x] Seção "Migração e virada" (M0 a M8) na KB-002, com histórico e `last_updated`.
- [x] Conferir cada saída do roteiro contra `src/lib/migracao/gravar.ts`, `scripts/migracao-cli.mjs` e `scripts/migracao-gravacao.mjs`.
- [x] Trecho de leitura do cookie testado contra um cookie fragmentado simulado no formato de `@supabase/ssr` (`base64-` e partes `.0`, `.1`).
- [x] Reconciliar a task da issue #64 (integrada) e `cycles.md`.
- [x] Gates documentais e PR #69.
- [x] **Execução da ação externa:** concluída pelo responsável em 2026-10-18, depois das issues D e E e do `db push` da issue D (relato abaixo).

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Validador | `node scripts/validate-governance.mjs`: 0 erros, 0 avisos, 4 verificações manuais. |
| `git diff --check` | Passou. |
| Checks remotos | PR #69 integrada por squash em 2026-10-18 (GitHub). |
| Ação externa — simulação real (2026-10-18) | Depois da correção da issue #70 (PR #71): recusa `M6_TRANSITO_SEM_PAR_UNICO`, quantidade 2. Destino conferido vazio. `gravar` não executado. Só códigos e contagens registrados. |

## Revisão da correção

Não se aplica; issue normal do ciclo completo.

## Decisões incidentais e desvios

1. **Sessão pelo cookie do navegador.** O login de produção é só Google, então a sessão vem do cookie da aplicação, lido por um trecho no console que copia só os dois tokens. Não verificado em produção; o roteiro manda parar se falhar. O formato foi conferido no código de `@supabase/ssr`.
2. **Renovação não persistida.** O migrador renova o token durante o processo, mas não regrava o arquivo de sessão. O roteiro trata isso (entrar de novo e copiar a sessão) em vez de mudar o código, fora do escopo desta issue.
3. **Sair encerra a sessão em todos os lugares** (`signOut` global em `src/app/sair/route.ts`); o roteiro manda fechar a aba sem sair.

## Encerramento

Não se aplica; o encerramento do ciclo vai em PR própria, depois da verificação em produção.

## Relato da ação externa (só contagens)

Executada pelo responsável, na própria máquina, seguindo M0 a M8 da KB-002. O agente rodou só `simular`, com autorização, e consultas somente leitura na cópia do SQLite que devolveram só contagens. Nenhum valor, nome de ativo, mês real, UUID ou sessão foi registrado.

| Etapa | Resultado |
| :-- | :-- |
| Congelamento e cópia | Origem congelada depois do fechamento do último mês; cópia do SQLite em `local/`, sem arquivo `-wal` |
| `simular`, 1ª | Recusa `M6_TRANSITO_SEM_PAR_UNICO`, quantidade 2 → `v4` do plano e issue D |
| `simular`, 2ª | Recusa `M10_COBERTURA_OU_CONSISTENCIA`, quantidade 12 (posições ausentes depois de saldo zero, sem evento) → `v5` e issue E |
| `simular`, 3ª | Aceita: 30 ativos, 491 eventos de origem, 20 meses migrados, 14 meses com migração (`N/D`), 2 eventos de trânsito como migração no trânsito, 132 posições implícitas zero, 9 ativos desativados, 0 em M7, 98 meses antigos só com consolidado não migrados |
| Relatório local (M2) | Conferido pelo responsável: patrimônio do destino igual ao da origem nos 20 meses, nenhum ativo em M7, meses `N/D` iguais aos meses com migração |
| `db push` da issue D | Concluído pelo responsável |
| `gravar`, 1ª | Parou em `estado_divergente` (`ativos: 4`) com 54 de 463 operações: comparação de nomes com NBSP → correção #78 (PR #79) |
| `gravar`, 2ª | O processo do Node caiu no Windows sem saída, com 125 de 463 confirmadas, nenhuma pendente; a trava ficou e foi removida depois de confirmar que não havia processo do migrador |
| `gravar`, 3ª | `executed` / `concluida`: 463 de 463 confirmadas, 338 enviadas nesta execução, nenhuma duplicada |
| `conferir` | `ok: true`, 20 meses, `diferencas: {}` |
| Sessão | Arquivo da sessão apagado depois da conferência |
| Virada | 2026-10-18 |
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
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 006 + atualizar_docs + encerramento + 1a1e870c6700690144ec9a432ad8140669d572aa`
- `effect_class`: `local_mutation`
- `state_before` / `state_after`: task `Bloqueada`, ação externa parada na simulação / task `Concluída`, ação externa concluída com conferência sem diferença
- `result`: `executed`
- `evidence`: linhas de saída de `simular`, `gravar` e `conferir` relatadas pelo responsável, só com estado, motivo e contagens
- `blockers`: nenhum
