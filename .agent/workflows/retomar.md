---
description: "Responder a \"continue o ciclo NNN\" ou \"continue a correção da issue #N\": observar o estado real, apresentar a situação efetiva e despachar somente o que já estiver autorizado."
---

# Workflow: Retomar

## Entradas

- Pedido "continue o ciclo NNN" ou "continue a correção da issue #N".
- `_project/README.md` (seções "Situações e próximo passo" e "Modo contínuo") e `_project/cycles.md`.
- Estado das PRs e dos checks no GitHub.

## Barreira

- A observação é somente leitura. Este workflow não grava o bloco nem altera artefatos.
- Sem acesso ao GitHub, a situação efetiva é "Parado". Não presumir o estado das PRs.
- O despacho só ocorre com a situação efetiva "Pronto para continuar" e a autorização registrada no artefato.

## Execução

1. Ler `.agent/ai_behavior.md`, `_project/README.md` e `_project/cycles.md`.
2. Identificar o estado do ciclo ou da correção e consultar no GitHub as PRs abertas ou recém-fechadas, pelas convenções de branch.
3. Ler o artefato ativo: na branch da PR aberta, se houver; senão, em `main` ou na branch local correspondente.
4. Determinar a situação efetiva pelas regras 1 a 6 da retomada em `_project/README.md`, na ordem.
5. Se a vez for do responsável, mostrar o bloco e parar.
6. Se a situação efetiva for "Pronto para continuar", executar o preflight do modo contínuo, quando for o caso, e despachar o workflow mutante indicado no artefato, que produz seu próprio handoff. Em qualquer outro caso, mostrar o bloco e parar.

## Saída estruturada reduzida

- `context`: ciclo ou correção, revisão, PRs consultadas.
- `findings`: situação gravada, situação efetiva e a regra que a determinou.
- `blockers`: acesso ausente, conflito ou divergência entre artefato e GitHub.
- `mutation`: `none` (o despacho, se houver, é do workflow despachado).

## Situações de saída

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

- A observação não autoriza mutação. O receptor de um despacho confere a autorização registrada antes de agir.
