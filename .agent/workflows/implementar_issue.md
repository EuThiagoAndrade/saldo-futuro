---
description: "Implementar uma issue autorizada, validar, publicar a PR, integrar após a aprovação do merge e seguir para o próximo passo do plano."
---

# Workflow: Implementar issue

## Entradas

- Plano `Aprovado` ou `Em Execução` e issue aberta, identificada por número e URL.
- "autorizo a implementação da issue #N", ou modo contínuo `ativo` dentro do escopo.
- Base atualizada, branch compatível e task persistente.
- Autoridades `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md` e `.agent/lessons_learned.md`.
- Templates `.agent/templates/task.md` e `.github/pull_request_template.md`.
- Gate local `.agent/skills/governance-check/governance-check.md`.

## Barreira

- Não criar task, branch ou código antes de confirmar a issue, a autorização (ou o preflight do modo contínuo) e a base.
- Ler autoridades, templates e gate; item ausente ou incompatível bloqueia a operação.
- Não expandir o escopo além do plano e da issue.
- Merge só depois de "aprovo o merge da PR #N" e checks verdes; o modo contínuo nunca cobre merge.

## Execução

1. Confirmar issue, plano, autorização e base; ler `.agent/lessons_learned.md`.
2. Criar ou reconciliar a branch de `_project/README.md` (`feature/issue-N`, `fix/issue-N` ou `chore/issue-N`).
3. Instanciar ou reconciliar a task de `.agent/templates/task.md`, com barreiras G1 a G4 e `handoff_schema_version: 2`. Na primeira entrega, mudar o plano para `Em Execução` e o ciclo para `Em execução`.
4. Implementar somente os itens autorizados, com testes:
   - fixtures fictícias (G3);
   - casos de referência para regra de cálculo (G1);
   - RLS e teste de isolamento para tabela nova (G2);
   - migração existente nunca alterada (G4).
5. Executar as validações do plano e a inspeção de `governance-check`; registrar as evidências reais na task.
6. Fazer staging seletivo e commitar com `feat(issue-N):`, `fix(issue-N):` ou `chore(issue-N):`.
7. **Última issue do leve:** acrescentar a seção `## Encerramento` e o encerramento prospectivo de `_project/README.md`.
8. Preencher o template de PR, publicar a branch, abrir ou reconciliar a PR e gravar o bloco "Aguardando merge".
9. Concedida a aprovação do merge e conferidas as precondições, integrar por squash.
10. Seguir para o passo seguinte do plano:
    - próxima issue → "Aguardando autorização de implementação", ou "Pronto para continuar" no modo contínuo;
    - ação externa ou verificação em produção → a situação correspondente;
    - encerramento do completo → "Pronto para continuar";
    - leve encerrado → "Concluído".

    A reconciliação da task integrada fica no próximo workflow mutante.

## Saída

- Mutação: `local_mutation` e `remote_mutation` (branch, PR e merge aprovado).
- A PR é a unidade de entrega; o merge permanece sujeito à aprovação própria.

## Situações de saída

- Aguardando merge
- Aguardando autorização de implementação
- Aguardando ação externa
- Aguardando verificação em produção
- Pronto para continuar
- Concluído
- Parado

## Handoff

Contrato versão 2 de `.agent/ai_behavior.md`.

- `handoff_schema_version: 2`
- `logical_key`: `repository + cycle + implementar_issue + issue_number/planned_scope + revisão da base`
- `effect_class`: `remote_mutation`
