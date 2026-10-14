---
description: "Atualizar a documentação canônica e a documentação viva após uma transição autorizada, inclusive no encerramento, preservando histórico e rastreabilidade."
---

# Workflow: Atualizar documentação

## Entradas

- Transição autorizada e o artefato ativo com seu bloco "Próximo passo".
- Estado atual do ciclo, plano, issue, task, branch, PR e evidências.
- Arquivos canônicos indicados em `_project/README.md`.
- Skill `.agent/skills/doc-updater/doc-updater.md` e, quando houver decisão arquitetural duradoura, `.agent/templates/adr.md`.

## Barreira

- Confirmar que a transição ocorreu de fato antes de alterar o estado documental.
- Ler `doc-updater`; ausente ou incompatível bloqueia a atualização.
- Não registrar conclusão, aprovação ou integração com base em intenção futura. A exceção é o encerramento prospectivo de `_project/README.md`.

## Execução

1. Aplicar a sequência de `doc-updater` às autoridades indicadas em `_project/README.md`.
2. Reconciliar o estado observado com `_project/cycles.md`, plano, tasks e lições reutilizáveis.
3. **No encerramento:** consolidar na documentação viva (KBs, ADRs, `README.md`) o que o ciclo mudou no produto ou no processo, para que o histórico em `executed/` não seja leitura obrigatória. Aplicar o encerramento prospectivo.
4. Usar `.agent/templates/adr.md` somente para decisão arquitetural duradoura.
5. Não apagar histórico nem duplicar links, decisões ou registros.
6. Gravar o bloco no artefato ativo.

## Saída

- Mutação: `local_mutation` documental e, quando houver PR, `remote_mutation`.
- A atualização documental não autoriza a próxima mutação.

## Situações de saída

- Aguardando autorização de implementação
- Aguardando merge
- Pronto para continuar
- Concluído
- Parado

## Handoff

Contrato versão 2 de `.agent/ai_behavior.md`.

- `handoff_schema_version: 2`
- `logical_key`: `repository + cycle + atualizar_docs + document_set/transition + revisão de origem`
- `effect_class`: `local_mutation`
