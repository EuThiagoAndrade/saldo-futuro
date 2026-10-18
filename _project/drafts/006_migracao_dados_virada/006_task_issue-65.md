# Task — Issue #65: Roteiro da virada

> **Ciclo:** `006`
> **Trilha:** `normal`
> **Estado:** `Em andamento`
> **Tipo:** `chore`
> **Issue:** `#65`
> **Plano:** `_project/drafts/006_migracao_dados_virada/006_plan.md`
> **Branch:** `chore/issue-65`
> **PR:** —
> **Integração:** `Pendente`
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
- [ ] Gates documentais e PR.
- [ ] **Execução da ação externa: pendente**, depois do merge, pelo responsável. Nenhum resultado presumido.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Validador | Pendente |
| `git diff --check` | Pendente |
| Checks remotos | Pendente |
| Ação externa | Pendente (depois do merge) |

## Revisão da correção

Não se aplica; issue normal do ciclo completo.

## Decisões incidentais e desvios

1. **Sessão pelo cookie do navegador.** O login de produção é só Google, então a sessão vem do cookie da aplicação, lido por um trecho no console que copia só os dois tokens. Não verificado em produção; o roteiro manda parar se falhar. O formato foi conferido no código de `@supabase/ssr`.
2. **Renovação não persistida.** O migrador renova o token durante o processo, mas não regrava o arquivo de sessão. O roteiro trata isso (entrar de novo e copiar a sessão) em vez de mudar o código, fora do escopo desta issue.
3. **Sair encerra a sessão em todos os lugares** (`signOut` global em `src/app/sair/route.ts`); o roteiro manda fechar a aba sem sair.

## Encerramento

Não se aplica; o encerramento do ciclo vai em PR própria, depois da verificação em produção.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 006 (completo)
Quem: Responsável
Conferir: PR da issue #65, checks remotos e o roteiro M0 a M8 da KB-002
Diga: "aprovo o merge da PR #N"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 006 + implementar_issue + 65/C + base 114da00e250ae73ef79ad8a9f46e4e73b4c8af99`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: issue #65 `OPEN`, sem branch nem task; task da #64 `Aguardando integração` / branch `chore/issue-65`, task `Em andamento`; task da #64 `Concluída`
- `result`: `executed`
- `evidence`: pendente
- `blockers`: pendente
