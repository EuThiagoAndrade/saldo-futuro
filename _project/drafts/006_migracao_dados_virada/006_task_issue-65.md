# Task — Issue #65: Roteiro da virada

> **Ciclo:** `006`
> **Trilha:** `normal`
> **Estado:** `Bloqueada`
> **Tipo:** `chore`
> **Issue:** `#65`
> **Plano:** `_project/drafts/006_migracao_dados_virada/006_plan.md`
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
- [ ] **Execução da ação externa: bloqueada antes de `gravar`.** A simulação real recusou por M6 (ver "Evidências"). Retoma depois da `v4` do plano, da issue D e do `db push` dela. Nenhum resultado presumido.

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

## Bloqueio

A recusa de M6 é um caso não coberto pela `v3` (parada prevista no plano). O responsável decidiu, em 2026-10-18, a alternativa A (migração no trânsito) e as regras complementares 1 a 4, registradas na `v4` do plano, aprovada em 2026-10-18 depois do veredito `APTO COM RESSALVAS` da rodada 4. A ação externa desta issue continua depois da issue D.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 006 (completo)
Quem: Responsável
Conferir: [PR #77](https://github.com/EuThiagoAndrade/saldo-futuro/pull/77), checks remotos, diff e barreiras G1 a G4
Diga: "aprovo o merge da PR #77"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 006 + aprovar_plano + 006_plan + v4 (base b580334)`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: task `Aguardando integração`, PR #69 registrada como aberta / task `Bloqueada`, PR #69 integrada, ação externa parada na simulação por M6; `v4` do plano aprovada em 2026-10-18 e em publicação
- `result`: `executed`
- `evidence`: estado da PR #69 e da issue #65 lido no GitHub (`MERGED` e `CLOSED`); recusa da simulação relatada pelo responsável, só com código e contagem
- `blockers`: `db push` da issue D ([#73](https://github.com/EuThiagoAndrade/saldo-futuro/issues/73), integrada pela PR #74) e a `v5` do plano, com a issue E, por causa da recusa de M10 na simulação
