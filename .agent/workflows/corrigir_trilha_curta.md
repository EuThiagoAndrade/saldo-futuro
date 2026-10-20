---
description: "Corrigir um defeito elegível pela trilha curta, com issue, task, revisão da correção e PR, sem ideação nem plano e sem dispensar as barreiras de domínio."
---

# Workflow: Corrigir pela trilha curta

## Entradas

- Frase de entrada da curta, com ou sem issue, e o sufixo de modo contínuo opcional.
- Issue `[FIX]` existente, ou o título e o payload apresentados na triagem.
- Critérios de elegibilidade e barreiras G1 a G4 em `_project/README.md`.
- Autoridades `.agent/ai_behavior.md`, `_project/README.md` e `.agent/lessons_learned.md`.
- Templates `.agent/templates/task.md`, `.github/ISSUE_TEMPLATE/bug_report.yml` e `.github/pull_request_template.md`.
- Gate local `.agent/skills/governance-check/governance-check.md`.

## Barreira

- Avaliar os quatro critérios de elegibilidade com evidência. Se algum falhar, a situação é "Parado" e a demanda volta à triagem.
- O modo contínuo é proibido quando G1 ou G2 se aplicam. Nesse caso, registrar `suspenso` e seguir só com aprovações comuns.
- Não ampliar o escopo: a correção restaura o comportamento especificado e nada mais.
- Nenhuma barreira é dispensada; "não se aplica" exige justificativa.

## Execução

1. **Sem issue:** criar a issue com exatamente o título da frase e o payload da triagem, pelo `bug_report.yml` com a opção "trilha curta"; conferir o número no GitHub.
2. Criar ou reconciliar a branch `fix/issue-N` e a task `_project/fixes/fix_task_issue-N.md`, com:
   - `Trilha: curta`, `Autorização inicial`, `Modo contínuo` e `handoff_schema_version: 2`;
   - a justificativa de cada critério de elegibilidade;
   - a tabela de barreiras.
3. Escrever um teste que reproduza o defeito e falhe antes da correção. Em regra de cálculo, usar casos de referência calculados independentemente (G1).
4. Corrigir:
   - uma migração, se necessária, é nova e aditiva (G4) e mantém RLS (G2);
   - fixtures são fictícias (G3).
5. Reavaliar a elegibilidade com o diff final.
6. Executar os testes, a inspeção de `governance-check` e `git diff --check`; registrar evidências reais.
7. Gravar "Aguardando revisão (rodada N)", ou "Pronto para continuar" no modo contínuo, para a revisão da correção (`revisar_plano`). Depois de "ajuste a correção da issue #N", corrigir e repetir.
8. Com a correção apta, fazer staging seletivo, commitar com `fix(issue-N):`, preencher o template de PR, abrir a PR com `Closes #N` e gravar "Aguardando merge".
9. Concedida a aprovação do merge e conferidas as precondições, integrar por squash e gravar "Concluído".

## Saída

### Origem no backlog

Quando houver seleção na triagem, preencher na task nova `## Origem no backlog` com IDs, síntese, parcela e commit da fila canônica, sinalizando conteúdo local/não publicado. Senão, `Não se aplica`. A seleção não torna a demanda elegível nem amplia a correção. Preservar snapshot e deixar destino em preparação sem alterar item. Os IDs precisam existir em main antes do merge da correção. Após integração comprovada, `gerenciar_backlog` registra retorno com `issue #N` (task existente em `_project/fixes/fix_task_issue-N.md`), cobertura/Restante e autorização da seleção. Publicação do retorno é separada; cancelamento não reabre item automaticamente.

### Efeito

- Mutação: `local_mutation` e `remote_mutation` (issue, branch, PR e merge aprovado).
- A trilha curta não altera `_project/cycles.md` nem cria plano.

## Situações de saída

- Aguardando revisão (rodada N)
- Aguardando correções (rodada N)
- Aguardando merge
- Pronto para continuar
- Concluído
- Parado

## Handoff

Contrato versão 2 de `.agent/ai_behavior.md`.

- `handoff_schema_version: 2`
- `logical_key`: `repository + fix + corrigir_trilha_curta + issue_number + revisão da base`
- `effect_class`: `remote_mutation`
