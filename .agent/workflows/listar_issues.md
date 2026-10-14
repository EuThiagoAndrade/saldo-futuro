---
description: "Listar issues relevantes do GitHub em modo somente leitura, sem criar, editar ou fechar itens."
---

# Workflow: Listar issues

## Entradas

- Repositório remoto identificado.
- Filtros de ciclo, label, estado, issue ou chave lógica, quando fornecidos.
- Organização e estados locais definidos em `_project/README.md` e `_project/cycles.md`.

## Barreira

- Consultar apenas o estado remoto; não criar, editar, fechar, comentar ou rotular issues.
- Ausência ou conflito entre estado local e remoto deve ser relatado, não resolvido por inferência.
- Registrar paginação, filtros e momento da consulta.

## Execução

1. Ler `_project/README.md` e `_project/cycles.md` para interpretar relações e estados locais válidos.
2. Consultar as issues aplicando os filtros declarados.
3. Deduplicar por número e URL e preservar o estado retornado pelo GitHub.
4. Relacionar issues a ciclo, plano, task e PR apenas com evidência verificável.
5. Indicar lacunas sem inferir autorização ou conclusão e mostrar o bloco da situação corrente, sem gravá-lo.

## Saída estruturada reduzida

- `context`: repositório, filtros e escopo da consulta.
- `findings`: issues, estados, labels, links e relações verificáveis.
- `blockers`: acesso, paginação, inconsistências ou dados ausentes.
- `mutation`: `none`.

## Situações de saída

Repete a situação efetiva do ciclo consultado, sem alterá-la:

- Aguardando autorização de implementação
- Aguardando merge
- Pronto para continuar
- Parado
- Concluído

## Regras de handoff

- O resultado é somente leitura e não autoriza criação ou alteração de issue.
