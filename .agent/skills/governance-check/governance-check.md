---
name: governance-check
description: "Audita estrutura, estado e rastreabilidade da governança usando as autoridades canônicas e o validador local."
---

# Governance Check

Pode ser usado diretamente para uma auditoria ou chamado por outro workflow. Em ambos os modos, recebe o root auditado e o escopo da revisão; não pressupõe permissão de escrita.

1. Leia `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md` e o plano ativo.
2. Execute `node --test scripts/validate-governance.test.mjs`.
3. Execute `node scripts/validate-governance.mjs` ou use `--root` para outro workspace explicitamente auditado.
4. Execute `git diff --check` e revise `git status --short`.
5. Compare task, issue, PR e checks com seus estados reais, inclusive a declaração das barreiras G1 a G4 na task.
6. Revise manualmente o que o validador não cobre: referências documentais em `_project/`, ausência de dados do usuário em textos e fixtures (G3) e semântica das barreiras.
7. Relate separadamente erros bloqueantes, avisos e julgamentos manuais; não altere arquivos durante a auditoria sem pedido explícito.

## Handoff estruturado

Retorne: root auditado, comandos executados, erros, avisos, itens manuais, estado do Git e conclusão `passou | falhou | bloqueado`.
