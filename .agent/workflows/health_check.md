---
description: "Executar o gate mínimo de saúde do repositório, inclusive antes de existir aplicação."
---

# Workflow: Health check

## Entradas

- Raiz do repositório e arquivos canônicos disponíveis.
- Comandos de validação e testes definidos no projeto.
- Gate local `.agent/skills/governance-check/governance-check.md`.

## Barreira

- Executar somente leituras e validações; não editar, criar, remover ou publicar artefatos.
- Ler `.agent/skills/governance-check/governance-check.md`; se estiver ausente ou incompatível, registrar bloqueio em vez de improvisar outro gate.
- Distinguir erro, aviso esperado, ferramenta ausente e estado não verificável.

## Execução

1. Aplicar a inspeção somente leitura definida em `.agent/skills/governance-check/governance-check.md`.
2. Verificar arquivos canônicos, estrutura de ciclos, planos, tasks e workflows.
3. Executar `node --test scripts/validate-governance.test.mjs` quando disponível.
4. Executar `node scripts/validate-governance.mjs` e `git diff --check`.
5. Classificar achados por severidade e indicar a próxima ação provável.

## Saída estruturada reduzida

- `Contexto`: repositório, revisão, ciclo e comandos executados.
- `context`: repositório, revisão, ciclo e comandos executados.
- `Achados`: erros, avisos, testes e invariantes observados.
- `findings`: erros, avisos, testes e invariantes observados.
- `Bloqueios`: o que impede um diagnóstico completo ou uma transição.
- `blockers`: o que impede um diagnóstico completo ou uma transição.
- `Próximo passo provável`: ação recomendada, sem autorização implícita.
- `next_step_likely`: ação recomendada, sem autorização implícita.
- `Mutação`: `nenhuma`.
- `mutation`: `none`.

## Regras de handoff

- O resultado é somente leitura e não autoriza workflow mutante.
- Se encaminhado, o receptor deve recusar saída sem contexto, evidência ou classificação de bloqueios.
