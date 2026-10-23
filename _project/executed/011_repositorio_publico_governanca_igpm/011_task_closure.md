# Task — Encerramento do ciclo 011

> **Ciclo:** `011`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `chore`
> **Issue:** — (encerramento documental sem issue recursiva; fecha a #118 por `Closes #118`)
> **Plano:** `_project/executed/011_repositorio_publico_governanca_igpm/011_plan.md`
> **Branch:** `chore/cycle-011-closure`
> **PR:** https://github.com/EuThiagoAndrade/saldo-futuro/pull/123
> **Integração:** prospectiva; válida somente depois do merge desta PR, conferido no GitHub
> **Autorização inicial:** "aprovo o plano do ciclo 011" em 2026-10-22 (o encerramento é autorizado pela aprovação do plano); "Passou: /novidades em produção mostra a versão 0.8.0 com a nota do IGP-M. Pode seguir para o encerramento do ciclo 011." em 2026-10-23
> **Modo contínuo:** `—`
> **Início:** 2026-10-23
> **Última atualização:** 2026-10-23
> **handoff_schema_version:** `2`

Instanciada de `.agent/templates/task.md`, pelo workflow `.agent/workflows/atualizar_docs.md` e skill `.agent/skills/doc-updater/doc-updater.md`. Autoridades: `.agent/ai_behavior.md`, `_project/README.md` (seção "Encerramento prospectivo") e o plano `v2` aprovado.

## Objetivo

Reconciliar as três entregas do ciclo 011, a ação externa e a verificação em produção da issue #118 e a release `0.8.0`, registrar a data real da release em `/novidades`, consolidar a documentação viva e preparar o encerramento prospectivo em PR própria, fechando a #118.

## Escopo autorizado

`src/lib/novidades.ts` (data da `0.8.0`); KB-002 e KB-003 (histórico e estado final); ADR-003 (caminho do registro da auditoria em `executed/`); `_project/README.md` (fato observado sobre a PR de release no repositório público); `.agent/lessons_learned.md`; `cycles.md`, plano, tasks e movimentação para `executed/`. Nenhuma funcionalidade nova, regra financeira, migração, edição da PR do release-please, mudança de configuração externa nem publicação do lote do backlog.

## Origem no backlog

Não se aplica: a origem (BL-007) está no plano. O retorno do BL-007 na fila e a publicação do lote do backlog são separados e ficam fora desta PR, depois da integração comprovada (decisão Q6).

## Elegibilidade da trilha curta

Não se aplica: encerramento de ciclo completo.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Só registros de governança e a data de uma entrada de novidades; nenhum cálculo alterado. |
| G2 — isolamento por RLS | Não | Nenhuma tabela, política, sessão ou acesso alterado. |
| G3 — privacidade de dados | Sim | Somente referências, contagens e resultados sanitizados; sem e-mail, identificador, print ou dado real. |
| G4 — migrações só acrescentam | Não | Nenhuma migração criada ou alterada. |

## Execução

- [x] Conferir no GitHub as PRs do ciclo `MERGED`: #115 (`07adff7`), #119 (`4b7fa70`), #120 (`130325e`), #121 (`c4105a2`) e #122 (`8578a52`); issues #116 e #117 fechadas como concluídas; #118 aberta; release `v0.8.0` publicada em 2026-10-23T18:52:43Z, 14:52 em America/Cuiaba.
- [x] Registrar `publicadaEm: "2026-10-23"` para a `0.8.0` em `src/lib/novidades.ts`, sem editar a PR do release-please.
- [x] Consolidar na KB-002 o `db push` da migração do IGP-M e a primeira sincronização, e na KB-003 o IGP-M no catálogo e a release `0.8.0`.
- [x] Atualizar no ADR-003 o caminho do registro da auditoria para `executed/`.
- [x] Atualizar em `_project/README.md` o fato sobre as PRs de release no repositório público (execuções de `pull_request` aguardando aprovação e o "closes" escrito pelo release-please) e registrar a lição.
- [x] Reconciliar tasks `Concluída`, plano `Concluído`, `cycles.md` e mover o ciclo para `executed/`.
- [x] Executar os gates documentais e de aplicação do plano.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Entregas | [PR #119](https://github.com/EuThiagoAndrade/saldo-futuro/pull/119), [#120](https://github.com/EuThiagoAndrade/saldo-futuro/pull/120) e [#121](https://github.com/EuThiagoAndrade/saldo-futuro/pull/121) integradas por squash; #116 e #117 fechadas pelas próprias PRs; #121 só referencia a #118. |
| Release | [PR #122](https://github.com/EuThiagoAndrade/saldo-futuro/pull/122) integrada por squash (`8578a52`); tag `v0.8.0` em `8578a52`; release publicada sem rascunho. |
| Ação externa da #118 | Declarada pelo responsável em 2026-10-23: migrações alinhadas, cobertura do IGP-M com o mesmo início da do IPCA e último mês setembro de 2026 (task `011_task_issue-118.md`). |
| Produção | Parte pública conferida pelo agente por leitura; conferência autenticada do responsável nos três itens do IGP-M e em `/novidades` com a `0.8.0`, sem limitações (task `011_task_issue-118.md`). |
| Gates documentais | Ver "Gates" abaixo. |
| Gates de aplicação | Ver "Gates" abaixo. |
| Checks da PR de encerramento | A conferir no tip final. |

### Gates

- **Documentais:** `node --test scripts/validate-governance.test.mjs` 48/48; `node scripts/validate-governance.mjs` com 0 erros e 0 avisos (5 itens manuais conferidos, G3 sem dado real), depois de ajustar para `Concluído` o bloco das tasks #116 e #117, que o validador exige em artefatos executados; `git diff --cached --check` limpo.
- **Aplicação:** `npm run lint` com 0 erros (3 avisos preexistentes de um script em `local/`); `npm run typecheck` sem erros; `npm test` 30 arquivos e 358 testes; `npm run build` com sucesso na repetição, depois do aviso `SecurityFatalError` do `next` 16.4.0, que não vem desta mudança; e2e de `novidades.spec.ts` e `benchmarks.spec.ts` com o Supabase local: 17 passaram. A suíte e2e completa e o e2e sem backend ficam com o CI.

## Revisão da correção

Não se aplica: sem correção pela trilha curta.

## Decisões incidentais e desvios

- A data `2026-10-23` é a civil da publicação em America/Cuiaba, como o plano define; a release saiu às 18:52 UTC (14:52 local).
- `_project/README.md` passa a descrever o comportamento observado das PRs de release no repositório público. É fato de processo consolidado no encerramento, sem regra nova.
- O retorno do BL-007 no backlog e a publicação do lote (`46b46bb` e o retorno) ficam para depois da integração, por pedido próprio (Q6).

## Encerramento

Esta task descreve a preparação do encerramento do ciclo completo. Estado `Concluída`, plano `Concluído` e `cycles.md` `Concluído` são prospectivos até o merge desta PR. Antes disso, a situação efetiva é Aguardando merge quando só faltar integração; checks e a frase "aprovo o merge da PR #N" continuam obrigatórios. A PR fecha a issue #118 por `Closes #118`.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 011 (completo)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 011 + atualizar_docs + encerramento + 8578a52ba960d7464dc72bc02dd5786f4ef0a084`
- `effect_class`: `remote_mutation`
- `state_before`: três entregas e release `0.8.0` integradas, ação externa e verificação em produção concluídas, ciclo `Em execução` em `drafts/`.
- `state_after`: registros reconciliados e ciclo em `executed/` com plano, tasks e `cycles.md` concluídos prospectivamente; antes do merge, a situação efetiva depende da PR e dos checks.
- `result`: `executed`
- `evidence`: PRs, release e issues conferidas no GitHub; ação externa e conferências autenticadas declaradas pelo responsável; workflow, template e skill lidos no ponto de uso; gates acima.
- `blockers`: checks verdes no tip final e "aprovo o merge da PR #123"; aprovação ainda não recebida. Situação efetiva Aguardando merge, sem concluir o ciclo em `main` antecipadamente.
