---
description: "Criar ou reconciliar as issues de um plano aprovado (e, no leve em modo contínuo, promover o plano), sem iniciar a implementação."
---

# Workflow: Criar issues

## Entradas

- **Completo:** plano `Aprovado` (com `Aprovada em`) e integrado pela PR documental.
- **Leve:** plano `Aprovado`, ou plano com `APTO PARA APROVAÇÃO` e modo contínuo `ativo`.
- Decomposição, escopo, critérios de aceite e dependências do plano.
- Autoridades `.agent/ai_behavior.md`, `_project/README.md` e `_project/cycles.md`.
- Issue Forms: `.github/ISSUE_TEMPLATE/feature_request.yml`, `bug_report.yml` e `chore.yml`.

## Barreira

- Verificar o veredito e a aprovação, ou o preflight do modo contínuo, antes de qualquer mutação remota.
- Ler o Issue Form de cada unidade (`feature`, `fix` ou `chore`); ausente ou incompatível bloqueia.
- Sem modo contínuo, apresentar o payload e obter a confirmação do responsável antes de criar.
- Não criar issue por inferência, duplicidade ou plano ainda não aprovado.

## Execução

1. **Leve em modo contínuo:** executar o preflight de `_project/README.md` e promover o plano a `Aprovado`, com `Aprovação humana pós-revisão: Coberta pelo modo contínuo (autorização inicial de AAAA-MM-DD)`. Se o preflight falhar, a situação é "Parado".
2. Derivar somente as issues previstas no plano e montar título e corpo na ordem dos campos do Issue Form.
3. Para cada unidade, consultar a issue existente pela chave lógica antes de criar; não duplicar.
4. Criar ou reconciliar, conferir no GitHub e registrar número, URL e payload efetivo.
5. Gravar o bloco: "Aguardando autorização de implementação", ou "Pronto para continuar" no modo contínuo ativo.

## Saída

- Mutação: `remote_mutation` no GitHub; no leve contínuo, também `local_mutation` no plano.
- A criação da issue não autoriza implementação fora do modo contínuo.

## Situações de saída

- Aguardando autorização de implementação
- Pronto para continuar
- Parado

## Handoff

Contrato versão 2 de `.agent/ai_behavior.md`.

- `handoff_schema_version: 2`
- `logical_key`: `repository + cycle + criar_issues + issue_kind/planned_scope + revisão do plano`
- `effect_class`: `remote_mutation`
