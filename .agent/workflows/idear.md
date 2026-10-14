---
description: "Explorar a ideia de um ciclo completo sem convertê-la automaticamente em plano, issue ou implementação."
---

# Workflow: Idear

## Entradas

- Frase de entrada do ciclo completo: "confirmo o nível completo e autorizo a ideação do ciclo NNN".
- Objetivo, problema ou hipótese trazida pelo responsável; evidências disponíveis (ausência de evidência deve ser declarada).
- Autoridades `.agent/ai_behavior.md`, `_project/README.md` e `_project/cycles.md`.
- Template `.agent/templates/ideacao.md`.

## Barreira

- Usar somente no ciclo completo. O ciclo leve não tem ideação separada.
- Confirmar repositório, ciclo e alvo lógico antes de registrar qualquer saída.
- Ler as autoridades e o template; arquivo ausente ou incompatível bloqueia a mutação.
- Não inferir aprovação, autorização de implementação ou de mutação remota.

## Execução

1. Ler `.agent/templates/ideacao.md` e instanciar suas seções, com `Nível: completo`, a `Autorização inicial` e `handoff_schema_version: 2`.
2. Separar fatos, hipóteses, perguntas em aberto e alternativas.
3. Identificar impacto, dependências, riscos e critérios de descarte.
4. Criar ou reconciliar `_project/ideations/NNN_assunto.md` e reservar o ciclo em `_project/cycles.md` como `Ideação`.
5. Registrar a exploração sem promovê-la a plano e gravar o bloco "Próximo passo".

## Saída

- Mutação: `local_mutation` somente nos artefatos de ideação.
- A saída não autoriza o rascunho do plano; ele exige "autorizo o rascunho do plano do ciclo NNN".

## Situações de saída

- Ideação registrada
- Parado

## Handoff

Contrato versão 2 de `.agent/ai_behavior.md`.

- `handoff_schema_version: 2`
- `logical_key`: `repository + cycle + idear + logical_target + source_revision`
- `effect_class`: `local_mutation`
