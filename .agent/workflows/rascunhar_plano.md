---
description: "Transformar uma ideia em plano rastreável (documento único no ciclo leve), ainda sem revisão ou aprovação."
---

# Workflow: Rascunhar plano

## Entradas

- **Completo:** ideação registrada e "autorizo o rascunho do plano do ciclo NNN".
- **Leve:** a frase de entrada "confirmo o nível leve e autorizo o plano do ciclo NNN", com o sufixo de modo contínuo opcional.
- **Correção depois de um veredito:** "corrija o plano do ciclo NNN", ou o modo contínuo ativo.
- Autoridades `.agent/ai_behavior.md`, `_project/README.md` e `_project/cycles.md`.
- Template `.agent/templates/plano_implementacao.md`.

## Barreira

- Confirmar repositório, ciclo, alvo lógico e revisão de origem.
- Ler o template; ausente ou incompatível bloqueia a mutação.
- Não tratar o rascunho como revisão, aprovação ou autorização de implementação.
- Nunca escrever `Aprovado` neste workflow.

## Execução

1. Instanciar integralmente o template em `_project/drafts/NNN_assunto/NNN_plan.md`, com `Nível`, `Autorização inicial`, `Modo contínuo` e `handoff_schema_version: 2`.
   - **Leve:** preencher "Problema e contexto" no lugar da ideação e reservar o ciclo em `cycles.md` como `Planejamento`, gravando a frase de entrada.
   - **Completo:** reconciliar com a ideação e com `cycles.md`, sem criar um segundo plano.
2. Descrever objetivo, não-objetivos, entregáveis, sequência, pontos de aprovação (cobre e não cobre), riscos, evidências e a aplicação de G1 a G4.
3. **Correção:** responder a cada achado como corrigido ou contestado, incrementar a versão, preservar as rodadas e manter `Em Revisão`.
4. Gravar o bloco: "Aguardando revisão (rodada N)". No modo contínuo sem revisão externa, gravar "Pronto para continuar", e a revisão segue como etapa separada.

## Saída

### Origem no backlog

No leve, registrar a seleção da triagem em `## Origem no backlog`: IDs, síntese, recorte e commit da fila canônica; sinalizar se local/não publicado. No completo, herdar o snapshot da ideação sem reescrevê-lo pela versão atual do item. Sem origem, `Não se aplica`. A seleção mantém o item Disponível enquanto o destino estiver em preparação. IDs devem existir em main antes de integrar o destino. Depois da integração comprovada, retorno pela fila em `gerenciar_backlog`, sob autorização da seleção, com referência estável `ciclo NNN`, cobertura e Restante; publicar retorno continua separado.

### Efeito

- Mutação: `local_mutation` no plano e, no leve, em `cycles.md`.
- A recomendação de revisão não autoriza issue nem implementação.

## Situações de saída

- Aguardando revisão (rodada N)
- Pronto para continuar
- Parado

## Handoff

Contrato versão 2 de `.agent/ai_behavior.md`.

- `handoff_schema_version: 2`
- `logical_key`: `repository + cycle + rascunhar_plano + NNN_plan + versão do plano`
- `effect_class`: `local_mutation`
