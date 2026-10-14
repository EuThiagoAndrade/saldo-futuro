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
- Ler `governance-check`; ausente ou incompatível, registrar bloqueio em vez de improvisar outro gate.
- Distinguir erro, aviso esperado, ferramenta ausente e estado não verificável.

## Execução

1. Aplicar a inspeção somente leitura de `.agent/skills/governance-check/governance-check.md`.
2. Verificar arquivos canônicos, estrutura de ciclos, planos, tasks, workflows e blocos "Próximo passo".
3. Executar `node --test scripts/validate-governance.test.mjs` quando disponível.
4. Executar `node scripts/validate-governance.mjs` e `git diff --check`.
5. Classificar achados por severidade e mostrar o bloco da situação corrente do ciclo ativo, sem gravá-lo.

## Saída estruturada reduzida

- `context`: repositório, revisão, ciclo e comandos executados.
- `findings`: erros, avisos, testes e invariantes observados.
- `blockers`: o que impede um diagnóstico completo ou uma transição.
- `mutation`: `none`.

## Situações de saída

Repete a situação efetiva do ciclo ativo, sem alterá-la:

- Triagem proposta
- Ideação registrada
- Aguardando revisão (rodada N)
- Aguardando correções (rodada N)
- Aguardando aprovação do plano
- Aguardando autorização de implementação
- Aguardando merge
- Aguardando ação externa
- Aguardando verificação em produção
- Pronto para continuar
- Parado
- Concluído

## Regras de handoff

- O resultado é somente leitura e não autoriza workflow mutante.
