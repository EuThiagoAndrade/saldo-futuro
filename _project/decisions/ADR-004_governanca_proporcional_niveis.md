---
title: "Governança proporcional por níveis"
tags:
  - governança
  - agentes
  - processo
author: "Thiago Andrade e Claude"
module: "Governança"
last_updated: "2026-10-13"
origin_cycle: "002"
---

# ADR-004: Governança proporcional por níveis

## Status

Aceito

## Contexto

A governança implantada no ciclo `000` funcionou nos ciclos `000` e `001`, mas aplicava o mesmo rito a qualquer entrega. O ciclo `001` teve 14 gates com códigos próprios (como "M-A" e "H-C") que não estavam definidos em nenhum documento canônico. Também integrou 8 PRs, das quais só 3 eram de código. O contrato de handoff, com 15 campos, aparecia copiado em 22 arquivos. O próximo passo era descrito livremente, e cada ferramenta o interpretava de um jeito.

O responsável quer equilibrar três necessidades: contexto suficiente para qualquer LLM, documentação que ele entenda sem decifrar códigos e regras verificáveis. Isso vale para qualquer ferramenta agêntica (ADR-001).

## Decisão

- **Três níveis de rigor:** trilha curta, ciclo leve e ciclo completo, escolhidos por triagem objetiva. O ciclo completo é obrigatório quando a entrega toca G1, G2, o significado do schema ou as próprias regras de governança, ou quando há dúvida.
- **Cinco pontos de aprovação com nomes claros e frases fixas:** autorizar, aprovar plano, aprovar merge (um por PR), ação humana externa e verificar produção.
- **Lista fechada de situações:** toda saída termina com um bloco "Próximo passo" copiado da tabela (situação, quem age, o que conferir e frase exata), gravado no artefato ativo.
- **Modo contínuo na trilha curta e no ciclo leve:** uma autorização inicial cobre o trabalho até a PR, nunca merges, ações externas, produção, regra financeira ou trabalho com G1/G2. Tem paradas obrigatórias e retomada por qualquer ferramenta a partir do repositório. É uma exceção delimitada à regra de aprovação humana posterior ao veredito, registrada como `Coberta pelo modo contínuo`.
- **Revisão formal em todos os níveis:** no plano, para o leve e o completo; na task, como revisão da correção, para a trilha curta. Segue enquanto houver progresso, com teto de 5 rodadas, e o revisor pode ser outra ferramenta.
- **Handoff versão 2:** campos mínimos e regras universais escritas uma vez. Os artefatos anteriores ficam na versão 1, em lista fechada do validador.
- **Encerramento prospectivo:** a PR de encerramento (e, no leve, a última PR) descreve o estado depois do próprio merge. A situação efetiva antes do merge vem do GitHub.
- **Documentação viva:** consolidada a cada encerramento.

O detalhamento normativo está em `_project/README.md` e `.agent/ai_behavior.md`. O plano e as três rodadas de revisão estão no ciclo `002`.

## Consequências

### Positivas

- Rigor proporcional ao risco: menos PRs de cerimônia nos níveis leve e curta, com o rito completo preservado onde há dinheiro, isolamento ou regra de processo.
- Próximo passo não interpretativo e igual em qualquer ferramenta, verificado pelo validador.
- Aprovações inequívocas por frases fixas.
- Menos texto repetido para a LLM ler.

### Trade-offs

- A lista de situações e as frases fixas precisam ser mantidas em sincronia entre `_project/README.md` e o manifesto (há teste para isso).
- No modo contínuo, o responsável vê o plano do leve só no merge da primeira PR; um plano ruim custa implementação descartada.
- O validador confere formato e coerência, não a autenticidade das frases registradas; essa conferência continua humana.

## Alternativas consideradas

- **Reforma em fases (uma frente por ciclo):** cinco ritos completos e os mesmos arquivos reescritos várias vezes; o ciclo `003` rodaria com governança pela metade.
- **Nível único mais leve para tudo:** reduziria o rigor justamente nas regras financeiras e de isolamento.
- **Ciclo completo também para correções de G1/G2:** rejeitado em favor da trilha curta sem modo contínuo, que já exige casos de referência e teste de isolamento.
- **PR de encerramento separada no leve:** rejeitada; o squash torna o encerramento na última PR atômico.

## Referências

- Plano `_project/executed/002_reforma_governanca/002_plan.md` (rodadas 1 a 3 da revisão) e ideação `_project/ideations/002_reforma_governanca.md`.
- ADR-001 (governança agnóstica) e `.agent/lessons_learned.md`.
