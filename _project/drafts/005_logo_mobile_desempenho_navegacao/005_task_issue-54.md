# Task — Issue #54: Reduzir espera na navegação preservando leitura coerente

> **Ciclo:** `005`
> **Trilha:** `normal`
> **Estado:** `Aguardando integração`
> **Tipo:** `feature`
> **Issue:** `#54`
> **Plano:** `_project/drafts/005_logo_mobile_desempenho_navegacao/005_plan.md`
> **Branch:** `feature/issue-54`
> **PR:** —
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #54" em 2026-10-17
> **Modo contínuo:** `—`
> **Início:** 2026-10-17
> **Última atualização:** 2026-10-17
> **handoff_schema_version:** `2`

## Objetivo

Reduzir a espera da navegação somente com otimizações sustentadas pela baseline da unidade A, preservando a sequência, completude, ordenação, validação e proteção das leituras financeiras.

## Escopo autorizado

Issue https://github.com/EuThiagoAndrade/saldo-futuro/issues/54, item C do plano v1. A (#52) está tecnicamente integrada pela PR #55 em `7dbba4b5678ab4820ee3fed22c8575b64908df10`, embora a issue permaneça aberta no GitHub; B (#53) está fechada após a integração da PR #56 em `355fbb340ef0dda26f7f5c90fa4ee66767085971`. Implementar somente candidatos medidos em `src/lib/leitura.ts`, `src/lib/telas/leituras.ts` e `src/lib/telas/leitura-benchmarks.ts`, e feedback/prefetch em rotas existentes apenas se o protocolo demonstrar benefício. Não ampliar para autenticação/autorização, cache privado compartilhado, banco/schema/migração, RPC, dependência, infraestrutura/região, nova rota ou regra financeira. A ressalva de deduplicação do Next descrita em `005_validation_desempenho.md` exige prova D13 no servidor real antes de otimizar; falha que dependa de alterar cliente/cache fora do escopo implica parar e pedir decisão.

Como pedido explícito anterior do responsável, a lição comprovada de 2026-10-17 sobre declarar sempre o próximo passo está registrada em `.agent/lessons_learned.md` e preservada como alteração local não commitada. Sua publicação fica para uma entrega autorizada; ela não amplia o escopo da issue #54 nem autoriza outras alterações de governança.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim | Paraleliza leituras que compõem estado financeiro; igualdade de resultados, fases D13 completas e casos existentes são obrigatórios. Nenhuma regra nova. |
| G2 — isolamento por RLS | Sim | Leituras autenticadas e navegação; manter cliente de sessão, proteções e RLS; provar A/B/admin, logout e troca de conta com fixtures fictícias. |
| G3 — privacidade de dados | Sim | Baseline, fixtures, instrumentação e evidências devem conter somente dados fictícios; nenhuma resposta, credencial, cookie ou dado real. |
| G4 — migrações só acrescentam | Não | Nenhuma mudança de banco/schema/migração autorizada; se necessária, parar e pedir revisão do plano. |

## Execução

- [x] Confirmar issue aberta, autorização explícita, plano aprovado, PR #55 integrada, PR #56 integrada, base `origin/main` em `355fbb340ef0dda26f7f5c90fa4ee66767085971` e inexistência de branch/PR anterior da #54.
- [x] Criar `feature/issue-54`, reconciliar task #53 como integrada e atualizar o estado operacional do plano/ciclo.
- [x] Reproduzir no servidor Next real um interleaving entre páginas da leitura D13 de posições. A prova encontrou composição mista; demais interleavings ficaram pendentes após a parada obrigatória antes de otimizar.
- [x] Corrigir a falha D13 pela trilha curta (#57, PR #58 em `5d04b74`) e trazer a correção para a branch.
- [x] Medir a nova baseline `5d04b74` e a candidata `16f05af` com o protocolo da A, três rodadas, Node v24.19.0 e carga fictícia; uma execução completa de cada revisão, por decisão do responsável, mais verificação curta e alternada do bloco carteira vazia/0 ms.
- [x] Implementar o paralelismo dos componentes da marca (único candidato medido); feedback/prefetch mantidos, porque feedback e conteúdo pronto coincidiram em todas as transições e o ganho veio do servidor.
- [x] Comprovar D13: escrita depois de cada transporte com lotes concorrentes nas duas ordens, mutações detectadas, provas no `next start` entre páginas e entre componentes da marca; `leitura.spec.ts` (>1.000 linhas, ordenação, erros de página/contagem, reabertura/refechamento, retroativo, três tentativas e erro recuperável) e Comparação com benchmark passam.
- [x] Regressar cálculos, atualização após escrita, isolamento A/B/admin, sessão encerrada, ocultação, acessibilidade, chamadas por pedido e D9 ≤ 1 s (e2e completa e `desempenho.spec.ts`).
- [x] Registrar séries, medianas/p95, comparações, chamadas, verificação alternada e limites em `005_validation_desempenho.md` e nas séries `005_validation_series_c_baseline.md` e `005_validation_series_c_candidata.md`.
- [ ] Executar gates locais; revisar privacidade, diff e staging seletivo; criar commit/PR e reconciliar checks remotos.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Baseline A | Relatório integrado na PR #55; 2.880 transições, 144 grupos completos, sem falhas. Com volume cheio/50 ms, foram observadas 13 chamadas no destino `/`; é uma hipótese mensurável, não prova de custo SQL nem de gargalo de produção. |
| Build de produção local | `npm run build -- --webpack` passou com backend local fictício. |
| Prova D13 / deduplicação Next | Falhou no Next 16.4.0 real local após intercalar fechamento fictício entre páginas: a linha de `Ativo fictício 1` refletiu R$ 7.060,00, mas Patrimônio permaneceu R$ 181.800,00, em vez de R$ 182.800,00. O teste focado reproduziu essa divergência; nenhuma otimização foi iniciada. Evidência sanitizada em `local/issue-54/prova-d13.ndjson` (ignorada pelo Git). |
| Transportes no ensaio D13 | 13 chamadas Supabase observadas, 0 respostas não-2xx; foram observadas 3 `ativos`, 2 `consolidados_mensais`, 3 `eventos`, 2 `posicoes_mensais`, 1 `profiles`, 1 `sessao` e 1 `transferencias`. O registro local está em `local/issue-54/next-fetch.ndjson`, sem querystrings, cabeçalhos, corpos, cookies ou credenciais. |
| Nova baseline `5d04b74` | 2.880 amostras, 144 grupos, 18 limpezas, 0 falhas; 1 rejeição de transporte repetida com sucesso, listada. Destino `/`: 18 chamadas por pedido (A: 13). Retorno ao Início, cheia, 50 ms: 1.066,3 (A) → 1.424,7 ms. |
| Candidata `16f05af` | 2.880 amostras, 144 grupos, 18 limpezas, 0 falhas, 0 rejeições. Chamadas por pedido idênticas à baseline. |
| Desempenho antes/depois | Aceite de ganho nas três rodadas, nos quatro pares de retorno ao Início (cheia, 50 ms): −566 a −584 ms (−40,0% a −40,8%). Execuções completas: 1 de 48 grupos acima do limite (/ → /ativos, vazia, 0 ms, primeira, p95 +31,8 ms). Verificação alternada B → C → B → C do bloco vazia/0 ms: 0 grupos acima do limite; / → /ativos +15 a +17 ms de forma consistente, dentro do limite, causa não identificada. Relatório em `005_validation_desempenho.md`. |
| Provas D13 da candidata | Vitest 210/210, com escrita depois de cada transporte e lotes nas duas ordens; mutações de fases sobrepostas e marca final sem signal detectadas. `next start`: entre páginas de posições e entre componentes da marca, versão nova inteira, 34 transportes, todos 2xx. |
| Regressões | E2E completa: 80 passaram e 8 pulados (uma execução anterior teve falha de login de teste por hidratação em `benchmarks.spec.ts`, que passou 11/11 isolada e na suíte seguinte). D9: mediana 153 ms. Lint sem erros (3 avisos em `local/`), typecheck, apoio de medição 6/6. |
| Teste focado | 1 teste executado contra `next start`; a execução terminou com a asserção de coerência falhando como esperado pela prova, recebendo R$ 181.800,00 onde exigia R$ 182.800,00, após confirmar a posição atualizada. O build passou; os demais testes não foram executados porque a precondição D13 bloqueou a otimização. |
| Testes de governança | `node.exe --test scripts/validate-governance.test.mjs` — 39/39 passaram com `TEMP`/`TMP` em `local/issue-54/governance-temp/`; uma tentativa inicial no temp do sandbox falhou com `EPERM` e foi descartada. |
| Validador | `node.exe scripts/validate-governance.mjs` — 0 erros, 0 avisos, 4 itens manuais. |
| `git diff --check` | Passou. |
| Checks remotos | Pendente. |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

PR #56 foi conferida no GitHub como integrada por squash em `355fbb340ef0dda26f7f5c90fa4ee66767085971`; issue #53 está fechada. Issue #52 continua aberta apesar da integração técnica A pela PR #55; sua task local já registra essa divergência. O diff preexistente e solicitado pelo responsável em `.agent/lessons_learned.md` será preservado e incluído nesta entrega como mudança explicitamente autorizada, descrita separadamente na PR.

Nenhuma otimização, alteração de feedback ou prefetch foi feita ao criar esta task. Tempos simulados da baseline não serão apresentados como ganho em produção.

O seletor inicial da prova D13 não localizava a linha por escopo incorreto do locator; ele foi corrigido para partir do `rowheader` exato. Na repetição, a asserção da posição atualizada passou e a prova falhou somente no total consolidado, confirmando a composição mista. Os fixtures fictícios foram removidos pelo `finally` do teste. O relatório de baseline manda parar antes de C quando o Next reutiliza uma leitura e a garantia D13 falha. A correção exigiria rever como as leituras do cliente/cache são distinguidas e pode aumentar os transportes observados, em conflito com o custo/aceite atual; não há autorização para alterar esse escopo. Nenhum arquivo de produto foi alterado.

### Pergunta de escopo

Pergunta original: (1) revisar o plano e a issue #54 para permitir leituras frescas entre as fases D13 no Next, aceitando possível aumento das chamadas Supabase, ou (2) manter o escopo e encerrar a tentativa sem otimização.

Resposta do responsável em 2026-10-17: "Autorizo revisar o plano e a issue #54 para avaliar leituras frescas entre as fases D13 no Next, aceitando possível aumento das chamadas Supabase. Apresente a revisão antes de implementar." A autorização cobre somente a revisão e sua apresentação; não autoriza implementação, edição remota da issue nem mudança de produto.

Revisão apresentada em 2026-10-17 (somente leitura de código e dependências): a deduplicação `createDedupeFetch` do Next 16.4.0 memoriza GET/HEAD idênticos por pedido e só é desligada por `signal`, `keepalive` ou método não-GET; `cache: "no-store"` não entra na chave nem desliga a deduplicação. A marca final e as tentativas 2 e 3 de `lerComposicao` repetem URLs idênticos e recebem a resposta memorizada; os 13 transportes do ensaio correspondem à marca inicial mais os insumos, sem transporte da marca final. A gravação do fechamento é protegida porque `fechar_mes` recalcula e confere no banco; a exposição é de telas e prévia. O caminho recomendado é uma correção elegível à trilha curta, com `AbortSignal` por fase em `src/lib/leitura.ts` e nas leituras compostas, seguida de nova baseline antes de C. A decisão entre esse caminho e a revisão do plano `v2` com a correção dentro da #54 está pendente.

Decisão do responsável em 2026-10-17: trilha curta ("confirmo a trilha curta e autorizo abrir e corrigir a issue [FIX] Leituras D13 deduplicadas pelo Next", confirmada como única escolha após desambiguação). A correção segue na issue [#57](https://github.com/EuThiagoAndrade/saldo-futuro/issues/57), branch `fix/issue-57` e task `_project/fixes/fix_task_issue-57.md`. A #54 continua parada: depois da integração da #57, a unidade C precisa de nova baseline, porque a baseline da unidade A foi medida com a marca final deduplicada; a retomada exige decisão do responsável.

Decisão do responsável em 2026-10-17, após a integração da #57 pela PR #58 em `5d04b7453e7d01f3d1b15a28e9746c47ca7ea4c3`: "Retomar a #54 com nova baseline". A branch `feature/issue-54` avançou por fast-forward até esse commit. A nova baseline usa o protocolo da A sem alterações (`node tests/e2e/apoio/medir-navegacao.mjs`), no Node v24.15.0 disponível; a A foi medida no v24.19.0, que não está instalado. Por isso a comparação nova baseline × A é apenas indicativa do custo da correção, e a comparação baseline × candidata da C usa o mesmo runtime e é alternada. Os brutos da A foram preservados em `local/issue-52-baseline-a/` antes da execução, e `005_validation_series.md`, sobrescrito pelo resumidor, é restaurado para a versão integrada da A; a série nova fica em `local/issue-54/`.

Primeira tentativa da nova baseline (2026-10-17, `5d04b74`, Node v24.15.0): falhou no bloco 6 de 18 (rodada 1, 100 ms, carteira cheia), na primeira revisita de Início → Lançamentos; o marcador não apareceu em 20 s e a página exibia o estado de erro da área autenticada. Não houve resposta Supabase não-2xx, erro no stderr do servidor nem exceção do navegador, e nenhum pedido de `/lancamentos` foi registrado após a origem. O padrão coincide com as falhas preparatórias da A no mesmo Node (timeouts de marcador sem erro HTTP, `ERR_CONNECTION_RESET`, queda nativa `0xC0000409`), que só cessaram com o Node v24.19.0; causa não confirmada. Tentativa integral, com falha e limpeza registradas, preservada em `local/issue-54/ensaio-falha-node-24.15/`; nenhuma amostra dela compõe a baseline. O Node v24.19.0 usado pela A foi localizado no runtime local já existente do Codex (`.cache/codex-runtimes/codex-primary-runtime`), e a medição completa foi reiniciada com ele, como pede `tests/e2e/apoio/MEDICAO.md` para comparar com uma baseline. Com o mesmo runtime, a comparação com a A deixa de ter a ressalva de Node.

Segunda tentativa (2026-10-17, `5d04b74`, Node v24.19.0): os 18 blocos terminaram com 2.880 amostras, nenhuma falha de amostra e 18 limpezas, mas o resumidor recusou a publicação ("Resposta de servidor/Supabase com erro; investigar, sem descartar"). Uma única chamada entre 118.835 eventos registrados, `consolidados_mensais` nos insumos do Início (rodada 2, 0 ms, carteira cheia, /ativos → /, primeira visita, amostra 1), teve o `fetch` rejeitado em 1,6 ms (status 0, sem atraso artificial). O postgrest-js 2.117.3 repete GET rejeitados até três vezes com espera inicial de 1 s (`fetchWithRetry`); a repetição respondeu 200, o pedido terminou em 200 e o conteúdo foi conferido. A amostra levou 1.328 ms, contra 225–264 ms das outras 19 da série da rodada; é a maior das 60 do grupo e não altera mediana nem p95 (posto 57). Causa da rejeição de transporte não confirmada (o registro é sanitizado e não guarda a mensagem). Brutos preservados em `local/issue-54/baseline-node-24.19/`; `005_validation_series.md` não foi alterado.

Comparação local preliminar com a A (`local/issue-54/comparar-baselines.mjs`, mesmo Node): no destino `/`, 18 chamadas Supabase por pedido em todas as 360 amostras cheias/50 ms, contra 13 na A (+5 da marca final); Lançamentos (6) e Ativos (3) inalterados. Retorno ao Início: mediana de 1.066,3 → 1.424,7 ms (cheia, 50 ms, /lancamentos → /, primeira) e 1.679,8 → 2.279,1 ms com 100 ms; sem atraso, 261,5 → 316,0 ms. Demais destinos sem regressão. O custo é compatível com as cinco consultas sequenciais da marca final e torna o paralelismo dos componentes da marca o candidato principal da C.

### Pergunta sobre a ocorrência de transporte

A regra do resumidor interrompe a publicação diante de qualquer status fora de 2xx, inclusive uma rejeição de transporte repetida com sucesso pelo próprio cliente. Você prefere (1) aceitar esta execução como nova baseline, mantendo a amostra de 1.328 ms sem descarte e registrando a ocorrência, com o resumidor passando a aceitar somente rejeição de transporte seguida de repetição bem-sucedida da mesma categoria no mesmo pedido, sempre listada no relatório, ou (2) manter a regra atual e repetir a execução completa (cerca de 1h40), com o mesmo risco nas comparações baseline × candidata da C?

Decisão do responsável em 2026-10-17: "Opção 1: aceitar esta execução como nova baseline, mantendo a amostra sem descarte e registrando a ocorrência; o resumidor aceita só rejeição de transporte seguida de repetição bem-sucedida no mesmo pedido, sempre listada." Implementado em `tests/e2e/apoio/resumir-medicao.mjs` (`transportesRepetidos`): aceita status 0 somente com resposta 2xx posterior da mesma categoria no mesmo pedido, sem reutilizar a repetição, e com o pedido do servidor em 2xx; qualquer outro status fora de 2xx/3xx continua bloqueando. Cada ocorrência entra em `transportesRepetidos` na série e no cabeçalho do artefato. Teste em `resumir-medicao.check.mjs` (6/6 com o apoio). O resumo da execução com Node v24.19.0 passou: 2.880 amostras, 118.835 registros, 144 grupos completos, 1 ocorrência listada (amostra `m800185`, `/`, `consolidados_mensais`, rejeição em 158,9 ms, repetição 200 em 1.176,1 ms). Série e tabela da nova baseline em `local/issue-54/baseline-node-24.19/`; `005_validation_series.md` foi restaurado para a versão integrada da A.

Autorização do responsável em 2026-10-17: "Sim, implemente a candidata da C (marca em paralelo), faça as provas e as medições alternadas." Candidata no commit local `16f05af` (sem push): `marcaCarteira` lê meses, última desativação e as três contagens com `Promise.all`; a Comparação lê as marcas da carteira e do benchmark juntas; fases antes → insumos → depois sem sobreposição. Provas: Vitest com escrita depois de cada transporte da composição, com requisições concorrentes atendidas em lote nas ordens de chegada e inversa (Início, fechamento e Comparação; lote máximo ≥ 5), 210/210; mutações temporárias de fases sobrepostas e de marca depois sem signal foram detectadas e revertidas. Next real: as provas D13 entre páginas de posições e entre componentes da marca (requisição de transferências retida antes de sair) passaram, com 34 transportes cada (duas tentativas completas, todos 2xx), o mesmo total da versão sequencial. Regressões: e2e completa 80 passaram e 8 pulados; uma execução anterior teve uma falha de login de teste em `benchmarks.spec.ts` (formulário enviado antes da hidratação, URL permaneceu em `/entrar`), que passou 11/11 isolada e na suíte seguinte; D9 mediana 153 ms; lint sem erros, typecheck, validador 0/0, governança 39/39. Medição completa da candidata iniciada com Node v24.19.0; depois, nova execução da baseline `5d04b74` para alternar.

Decisão do responsável em 2026-10-17, com a candidata em 8 de 18 blocos: "Sim, dispense a nova execução da baseline; compare a candidata com a baseline já medida, registre o motivo e siga para a PR." Motivo apresentado: na rodada 1 já concluída, a mediana do retorno ao Início (carteira cheia, 50 ms) foi de 1.415 ms na baseline para 848 ms na candidata, cerca de 567 ms e 40%, mais de dez vezes o aceite de 20% e 50 ms; entre a A e a nova baseline, as rotas sem mudança de código variaram cerca de 15 ms. Desvio registrado do protocolo da issue (baseline e candidata alternadas): a comparação usa uma execução de cada revisão, em sequência, no mesmo Node v24.19.0, ambiente, carga e protocolo; não há segunda execução da baseline para estimar a deriva entre execuções.

Medição da candidata `16f05af` (Node v24.19.0): 18 blocos, 2.880 amostras, 144 grupos, 0 falhas, 0 rejeições de transporte; brutos, série e tabela em `local/issue-54/candidata-16f05af/`; `005_validation_series.md` restaurado para a A. Comparação (`local/issue-54/comparar-candidata.mjs`, saída em `local/issue-54/comparacao-candidata.md`):

- Ganho: nas três rodadas, os quatro pares de retorno ao Início (primeira visita e revisita), carteira cheia e 50 ms, reduziram a mediana em 566–584 ms (40,0–40,8%); por exemplo, /lancamentos → / primeira, rodada 1: 1.427,4 → 847,4 ms. Com 100 ms: cerca de −940 ms; sem atraso, cheia: 316,0 → 223,1 ms.
- Chamadas por pedido de destino idênticas (Início 16/18, Lançamentos 5/6, Ativos 3); pedidos de prefetch 17.996 → 17.858.
- Regressão acima de `max(20 ms, 10%)`: 1 de 48 grupos. Em / → /ativos, carteira vazia, 0 ms, primeira visita, p95 80,5 → 112,3 ms (+31,8; limite 20) e mediana 79,2 → 94,8 ms (+15,6; limite 20). Os grupos de /ativos subiram 2–17 ms na mediana.
- Investigação: a página Ativos não usa a marca nem a composição, e o código dela é o mesmo nas duas revisões. O servidor de /ativos com 50 ms ficou em 269,9 (A), 255,0 (baseline) e 269,1 ms (candidata); a chamada `ativos` sem atraso, idêntica nas revisões, teve mediana de 4,43, 4,01 e 5,83 ms. Entre a A e a baseline, com código igual nessas rotas, houve deslocamentos de um quadro (cerca de 16 ms), como / → /lancamentos, vazia, 0 ms: 94,5 → 78,9 ms. Os indícios são de deriva entre execuções, que a nova execução dispensada da baseline controlaria; causa não comprovada.

### Pergunta sobre a regressão em /ativos

O critério da issue bloqueia o aceite diante de uma regressão acima do limite. Você prefere (1) uma verificação curta e alternada só do bloco afetado (carteira vazia, 0 ms; cerca de 2 minutos por bloco), em builds da baseline e da candidata, alternando baseline → candidata → baseline → candidata, em uma cópia de trabalho de `5d04b74` dentro de `local/`, ao todo cerca de 20 minutos, aceitando o resultado como evidência do grupo, ou (2) aceitar a investigação acima e seguir para a PR, registrando a regressão de p95 em /ativos como deriva provável não comprovada?

Decisão do responsável em 2026-10-17, após pedir a recomendação do agente (verificação curta): "vamos de opção 1".

## Encerramento

Não se aplica.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Parado — ciclo 005 (completo)
Quem: Responsável
Conferir: [pergunta sobre a regressão em /ativos](#pergunta-sobre-a-regressão-em-ativos)
Diga: sua resposta à pergunta registrada
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 005 + implementar_issue + 54/C_navegacao + 355fbb340ef0dda26f7f5c90fa4ee66767085971`
- `effect_class`: `local_mutation`
- `state_before`: PR #56 integrada; issue #54 aberta e autorizada; branch/task #54 inexistentes; lição do responsável presente como modificação local não commitada.
- `state_after`: branch `feature/issue-54` na base `origin/main` `355fbb340ef0dda26f7f5c90fa4ee66767085971`; task #54 `Bloqueada` após prova D13 confirmar composição mista no Next real; task #53 reconciliada como `Concluída`; plano/ciclos atualizados; nenhuma otimização de produto iniciada.
- `result`: `executed`
- `evidence`: GitHub API: PR #56 `merged=true`, merge SHA `355fbb340ef0dda26f7f5c90fa4ee66767085971`; issue #53 `closed`; issue #54 `open`; Git fetch confirmou `origin/main` no SHA de merge; build local de produção passou; teste D13 no `next start` confirmou posição fictícia em R$ 7.060,00 e patrimônio antigo em R$ 181.800,00, contra total coerente esperado de R$ 182.800,00; 13 transportes Supabase, todos 2xx; evidência sanitizada sob `local/issue-54/`; nenhum arquivo de produto alterado.
- `blockers`: decisão do responsável sobre revisar o escopo da issue #54 para forçar leituras frescas no Next, mesmo com possível aumento de transportes, ou manter os critérios atuais e encerrar esta tentativa sem otimização.
