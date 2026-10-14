---
description: "Propor o nível de uma demanda (trilha curta, ciclo leve ou ciclo completo) e a frase de entrada, sem criar nenhum artefato."
---

# Workflow: Triar

## Entradas

- Demanda descrita pelo responsável.
- `_project/README.md` (seções "Níveis e triagem", "Entrada" e "Trilha curta") e `_project/cycles.md`.
- Barreiras G1 a G4 de `_project/README.md`.

## Barreira

- Somente leitura: não criar issue, branch, arquivo nem reserva de ciclo.
- Não confirmar o nível em nome do responsável.
- Na dúvida entre dois níveis, propor o mais alto.

## Execução

1. Ler `.agent/ai_behavior.md`, `_project/README.md` e `_project/cycles.md`.
2. Classificar a demanda pela ordem de "Níveis e triagem": trilha curta, depois ciclo completo, depois ciclo leve. Justificar cada critério com evidência do repositório.
3. Indicar se G1 ou G2 se aplicam e, portanto, se o modo contínuo é permitido.
4. Na trilha curta sem issue, propor o título `[FIX] <título>` e o payload pelo template `.github/ISSUE_TEMPLATE/bug_report.yml`.
5. Mostrar o bloco de "Triagem proposta", com a frase de entrada do nível proposto. No leve e no completo, o alvo é o próximo ciclo de `cycles.md`.

## Saída estruturada reduzida

- `context`: demanda, revisão do repositório e ciclo seguinte.
- `findings`: nível proposto, critérios avaliados, barreiras aplicáveis e modo contínuo permitido ou não.
- `blockers`: informação ausente para classificar.
- `mutation`: `none`.

## Situações de saída

- Triagem proposta
- Parado

## Regras de handoff

- O resultado não autoriza nada. A confirmação do responsável é consumida pelo workflow indicado na seção "Entrada" de `_project/README.md`.
