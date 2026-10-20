# Task — Issue #89: Contenção dos cartões do Início

> **Ciclo:** `008`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `fix`
> **Issue:** `#89`
> **Plano:** `_project/executed/008_legibilidade_patrimonio_resumo/008_plan.md`
> **Branch:** `fix/issue-89`
> **PR:** —
> **Integração:** `Prospectiva — efetiva somente após o merge desta última PR`
> **Autorização inicial:** "autorizo a implementação da issue #89" em 2026-10-20
> **Modo contínuo:** `—`
> **Início:** 2026-10-20
> **Última atualização:** 2026-10-20
> **handoff_schema_version:** `2`

## Objetivo

Conter títulos, quantias e percentuais dos cartões do Início nas condições aprovadas, preservando texto integral, fonte, ocultação e regras financeiras.

## Escopo autorizado

Item 2 / BL-002 e estratégia de testes da v3 aprovada. Última entrega do ciclo leve: inclui regressões conjuntas, documentação viva e encerramento prospectivo, sem integrar antes da aprovação específica da PR.

## Origem no backlog

Snapshot herdado do plano: BL-002 integral, responsividade e contenção dos cartões; BL-001 entregue na #88. Fonte `_project/backlog.md` em `7c78d1dff5cbd41358e64b45933c685c033020e1`, já em main. Destino ciclo 008 em preparação; nenhum retorno à fila antes da integração do ciclo.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Somente layout; sem cálculo ou valores financeiros alterados |
| G2 — isolamento por RLS | Não | Nenhuma alteração de banco, autorização ou consultas |
| G3 — privacidade de dados | Sim | Somente dados fictícios no Supabase local e capturas sanitizadas |
| G4 — migrações só acrescentam | Não | Nenhuma migração alterada |

## Execução

- [x] Issue aberta, autorização e v3 aprovada conferidas; base igual a origin/main, sem PR anterior da #89.
- [x] PR #90 integrada com checks verdes e aprovação humana; reconciliação da task #88 nesta branch.
- [x] Corrigir grade e preenchimento local de Cartao.
- [x] Medir conteúdo nas matrizes com/sem barra clássica e zoom real de 200%.
- [x] Validar estados, regressões e preparar documentação de encerramento prospectivo.
- [ ] Publicar PR revisável.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| `npm ci` | Passou; cinco vulnerabilidades altas preexistentes informadas pela auditoria; dependências preservadas |
| Lint e tipos | Passaram; três avisos preexistentes em script local ignorado, sem erros |
| Unitários | 293/293 |
| Matrizes de cartões | Duas matrizes passaram; 598 medições por matriz, 26 larguras, alturas 420/900, 11 cenários e ocultação |
| Barra clássica | 15 px reais, innerWidth − clientWidth positivo em todas as medições; conteúdo alto garantido por espaçador só de teste |
| Zoom real | Passou: chrome.tabs.getZoom = 2, innerWidth/clientWidth de 1280/1280 para 640/640, devicePixelRatio de 1 para 2; sem emular deviceScaleFactor |
| E2e com backend | Duas execuções integrais (6 e 1 worker): 106 passaram, 8 pulados e um encerramento nativo do worker no caso de volume do migrador, código Windows 3221226505. O caso de volume passou isoladamente em 24,9 s; todos os 107 casos executáveis tiveram execução bem-sucedida, mas não houve saída zero em uma única execução integral local. Nenhum código de migração ou teste de volume foi alterado |
| E2e sem backend | 13 passaram, 102 pulados por configuração; build sem backend passou |
| Governança | Testes 48/48, validador com 0 erros/avisos e cinco itens manuais |
| `git diff --check` | Passou |
| Checks remotos | Pendente |

### Medidas de referência

| Condição | Janela (px) | Layout útil (px) | Conteúdo útil do cartão (px) |
| :-- | --: | --: | --: |
| Sem barra | 360 | 360 | 318 |
| Sem barra | 768 | 768 | 328 |
| Sem barra | 1024 | 1024 | 328 |
| Barra clássica | 375 | 360 | 318 |
| Barra clássica | 768 | 753 | 320.5 |
| Barra clássica | 776 | 761 | 324.5 |
| Barra clássica | 1024 | 1009 | 320.5 |
| Barra clássica | 1032 | 1017 | 324.5 |

As duas matrizes incluem zero, valores positivos/negativos comuns e os extremos seguros fictícios, fonte carregada, títulos/detalhes, percentuais, N/D, estado vazio e ocultação. Todas as caixas visíveis são medidas contra a área interna, sem truncar o texto ou alterar dados.

## Revisão da correção

Não se aplica (trilha normal).

## Decisões incidentais e desvios

- Validação somente contra backend local com dados fictícios; sem produção. Menor área útil 318 px e menor folga à direita 1,4375 px nas duas matrizes; fonte 24/32 px, peso 600 preservados.
- Capturas comuns/extremas em `local/issue-89/valor{1,6}-{sem-barra,classica}-{360,375}.png`; medidas completas em `matriz-{sem-barra,classica}.json` e `zoom-real.json`, ignoradas pelo Git. Capturas com valor comum em 360 e extremo negativo em 375 com barra clássica inspecionadas. O zoom é comprovado pelas medidas e pelo fator retornado pela API do navegador.
- O teste de zoom cria extensão e perfil temporários exclusivos em test-results; usa chrome.tabs.setZoom no Chromium completo. Não adiciona dependência ou extensão ao produto, nem usa perfil do responsável. A largura da janela é ajustada para obter exatamente 1280 px CSS de conteúdo a 100%, antes do zoom.
- Ajustes no apoio dos testes durante preparação: nomes de usuários fictícios em minúsculas, como exige a constraint existente; remoção da emulação herdada de deviceScaleFactor no contexto de zoom; invocação explícita da expressão da API de abas. Nenhuma alteração de regra, fonte ou domínio para fazer passar as medições.

## Encerramento

Encerramento prospectivo autorizado pela aprovação da v3 e preparado nesta última entrega:

- [x] PR #90 integrada e #88 fechada, com aprovação específica e checks verdes.
- [x] Item 2 implementado e critérios de layout comprovados nas matrizes e zoom real; ressalva do runner Windows descrita nas evidências.
- [x] KB-003 consolida eixo e cartões; nenhuma nova regra financeira, ADR ou contrato visual.
- [x] Plano Concluído, tasks Concluída, pasta em executed e cycles Concluído como estado prospectivo após o merge desta PR.
- [x] Histórico de aprovação, revisão, origem e evidências preservado; nenhum SHA do próprio merge na task.
- [ ] Publicar PR, conferir checks remotos verdes e obter aprovação específica do merge.

Antes da integração, a situação efetiva é Aguardando merge. Retorno de BL-001/BL-002 à fila só após integração comprovada do ciclo; publicação desse retorno continua separada. Nenhuma ação em produção ou release é parte desta entrega.

## Próximo passo

Encerramento prospectivo: antes do merge da última PR, a situação efetiva é Aguardando merge.

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 008 (leve)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 008 + implementar_issue + 89/Item-2-BL-002 + ddc23b241ecccf7be2d42829ce512176f12bef8c`
- `effect_class`: `local_mutation`
- `state_before`: plano v3 Em Execução, ciclo Em execução, PR #90 integrada, #89 aberta sem task/branch e sem modo contínuo.
- `state_after`: implementação, matrizes e zoom real validados; encerramento prospectivo preparado com plano/tasks concluídos em executed e KB-003 atualizada; integração e conclusão efetivas dependem de checks remotos e merge aprovado da última PR.
- `result`: `executed`
- `evidence`: frase humana inicial desta task; base igual a origin/main; PR #90 MERGED e #88 CLOSED conferidas; medidas e testes acima; doc-updater e governance-check aplicados com templates de task, plano, KB e PR; pré-publicação da #89 sem PR anterior.
- `blockers`: ressalva local: encerramento nativo de worker no teste de volume quando executado junto à suíte; isolado passou. Checks remotos verdes e aprovação específica obrigatórios antes do merge.
