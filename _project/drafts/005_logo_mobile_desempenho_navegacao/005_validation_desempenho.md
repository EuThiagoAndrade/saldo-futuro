# Diagnóstico de navegação — ciclo 005, unidade A (#52)

## Escopo e reprodução

Baseline local anterior a qualquer otimização de produto, conforme plano v1 e issue #52. O protocolo está em `tests/e2e/apoio/MEDICAO.md`; comando: `node tests/e2e/apoio/medir-navegacao.mjs`, com `PLAYWRIGHT_CHANNEL=chrome` neste ambiente. Nenhum código em `src/`, migração, autenticação, RLS ou configuração externa foi alterado.

As séries sanitizadas e os metadados estão registrados em `005_validation_series.md` (bloco Base64 de JSON gzip), com código Node para extração. A coleta completa validou a matriz e a limpeza; arquivos locais de desenvolvimento/pilotos não compõem a baseline.

## Ambiente e volumes

O build medido corresponde à revisão `a8c7c2e306a153fcd46c995a0340a43a6624bbf2`, ID `Kgxlnd9ZTuw4AEnhpud8z`, criada sobre a base aprovada `9914a907e91d9487c9ba9543bafff71a7dbf8e5e`. Os arquivos de produto e migrações não mudaram; o build inclui somente o apoio do ensaio desta issue. A coleta ocorreu em 15/10/2026, 21:51–23:17 no fuso America/Cuiaba (16/10, 01:51–03:17 UTC), em 18 blocos serializados. `005_validation_series.md` contém revisão, horários, build, fontes, volumes e versão efetiva do servidor por bloco.

Node v24.19.0; Next 16.4.0; React 19.3.0; Supabase CLI 2.120.0; Chromium 156.0.8078.4 (Playwright); Windows 10.0.26300 x64; Intel i5-11400 2,60 GHz (12 processadores lógicos), 15,87 GiB de RAM. `next build` + `next start` em 127.0.0.1:3105, Supabase/Docker local em 127.0.0.1:54321. Viewport 1280 × 900; concorrência 1. Nenhum outro ensaio/build foi executado durante a baseline. Os tempos incluem relógio do navegador, transporte local e overhead do apoio; não medem SQL puro.

| Tabela | Carteira vazia | 30 ativos/60 meses |
| :-- | --: | --: |
| ativos | 0 | 31 (30 comuns e 1 de sistema) |
| eventos | 0 | 1.800 |
| posicoes_mensais | 0 | 1.800 |
| consolidados_mensais | 0 | 60 |
| transferencias | 0 | 0 |
| benchmarks (global) | 3 | 3 |
| valores_benchmark (global) | 60 | 60 |
| coberturas_benchmark (global) | 1 | 1 |

Contagens exatas feitas com a sessão do cenário, fora do cronômetro. Fixtures inteiramente fictícias, criadas pelas RPCs do usuário; benchmark fictício mensal exclusivo, carregado pela RPC do admin, com preparo/limpeza exclusivos no banco local. Nenhum SGS real ou backend remoto.

## Condições e validade

Três rodadas de 20 amostras por direção prioritária, volume, condição e atraso: Início ↔ Lançamentos e Início ↔ Ativos; carteira vazia/cheia; primeira visita em contexto novo/revisita com cinco aquecimentos; 0/50/100 ms por chamada efetiva ao Supabase. Sem nova sessão de login dentro do cronômetro. Cache/prefetch normais dos Links existentes, com pedidos de prefetch explicitamente identificados nas séries; nenhuma alteração em prefetch, fallback ou consulta de produto.

O protocolo é executado em 18 blocos serializados de rodada/atraso/volume, com servidor novo por bloco no mesmo build. Fixtures têm contagens idênticas entre blocos; cada bloco limpa seus cenários, e login/preparo/primeira renderização do servidor ficam fora das transições. Essa forma foi adotada após uma tentativa monolítica perder o servidor com 576 amostras e registrar falha/limpeza; a causa da queda não foi confirmada. Essa tentativa e o ensaio interrompido para ajustar a validade da sessão ficam somente em `local/`, sem compor a baseline. Não houve exclusão seletiva de tempos lentos ou incorretos.

Relógio no evento real de clique; feedback exige conteúdo/carregamento de destino visível; pronto exige título e marcador específico após leitura, não apenas URL/menu. Mediana é a média dos dois centrais em n par; p95 é o posto `ceil(0,95 × n)`. Cada série de 20 preserva as amostras lentas; erro de resposta ou conteúdo interrompe a execução, em vez de ser descartado. As durações de resposta do servidor e de chamadas são independentes do relógio do navegador e correlacionadas por identificadores sintéticos. Chamadas significam transporte observado no preload, abaixo da deduplicação do Next.js, não número de expressões `await` executadas no código.

Nas primeiras visitas, o identificador da amostra inclui abertura da origem, prefetch e destino; totais de chamadas por amostra medem esse custo de sessão. Nas revisitas, origem e cinco aquecimentos ficam fora da amostra, e o retorno recebe outro identificador. Portanto, totais entre condições não têm a mesma fronteira; a série por pedido permite comparar somente o destino ou a navegação completa de forma explícita. A duração de servidor tabulada é de pedidos de destino sem prefetch; ausência de pedido deve ser relatada como tal, nunca como tempo SQL zero.

## Resultados

Matriz completa: **2.880 transições**, 144 grupos com n=60 (20 por rodada), sem falhas e sem descarte de tempos. Os 18 blocos terminaram e confirmaram limpeza; as contagens dos dois volumes foram iguais em todos eles. Foram registrados 102.624 eventos sanitizados de servidor/transporte, incluindo 35.100 chamadas Supabase observadas e correlacionadas por identificadores sintéticos. Respostas 206 correspondem a páginas do PostgREST; nenhuma resposta observada foi erro. Dados publicados não contêm querystring, cabeçalho, corpo, cookie, credencial ou identificador de usuário.

Feedback e conteúdo pronto tiveram a mesma duração nas 2.880 transições: nenhum estado de carregamento visível apareceu antes do marcador final. A tabela traz `pronto`, com mediana/p95 em milissegundos para 60 amostras por condição; `feedback` coincide com esses valores. p95 usa posto `ceil(0,95 × n)`.

| Volume | Atraso ms | Navegação | Primeira med/p95 ms | Revisita med/p95 ms |
| :-- | --: | :-- | --: | --: |
| vazia | 0 | / → /lancamentos | 94,6/111,5 | 80,8/97,4 |
| vazia | 0 | /lancamentos → / | 178,4/194,7 | 164,9/181,0 |
| vazia | 0 | / → /ativos | 79,5/96,0 | 79,5/81,3 |
| vazia | 0 | /ativos → / | 161,5/177,4 | 147,6/164,2 |
| cheia | 0 | / → /lancamentos | 106,5/113,9 | 98,1/114,8 |
| cheia | 0 | /lancamentos → / | 261,5/293,7 | 248,1/279,4 |
| cheia | 0 | / → /ativos | 95,1/105,3 | 81,3/99,2 |
| cheia | 0 | /ativos → / | 232,9/248,4 | 215,8/247,3 |
| vazia | 50 | / → /lancamentos | 285,6/309,2 | 280,5/297,6 |
| vazia | 50 | /lancamentos → / | 862,0/878,4 | 862,6/864,7 |
| vazia | 50 | / → /ativos | 283,3/296,7 | 280,5/295,9 |
| vazia | 50 | /ativos → / | 861,7/863,9 | 862,2/864,7 |
| cheia | 50 | / → /lancamentos | 363,1/377,6 | 363,8/379,9 |
| cheia | 50 | /lancamentos → / | 1.066,3/1.086,5 | 1.063,5/1.081,2 |
| cheia | 50 | / → /ativos | 296,0/311,4 | 282,3/298,0 |
| cheia | 50 | /ativos → / | 1.068,8/1.098,4 | 1.062,8/1.066,4 |
| vazia | 100 | / → /lancamentos | 429,1/446,0 | 430,6/446,9 |
| vazia | 100 | /lancamentos → / | 1.378,8/1.395,3 | 1.380,3/1.397,3 |
| vazia | 100 | / → /ativos | 429,5/446,2 | 430,4/431,9 |
| vazia | 100 | /ativos → / | 1.379,0/1.395,8 | 1.379,8/1.396,1 |
| cheia | 100 | / → /lancamentos | 564,6/595,1 | 563,7/581,3 |
| cheia | 100 | /lancamentos → / | 1.679,8/1.711,6 | 1.679,8/1.697,7 |
| cheia | 100 | / → /ativos | 434,4/448,6 | 431,2/447,7 |
| cheia | 100 | /ativos → / | 1.686,3/1.739,0 | 1.680,5/1.714,8 |

No atraso zero, uma carteira maior elevou a mediana da primeira navegação de /lancamentos para / de 178,4 para 261,5 ms e de /ativos para / de 161,5 para 232,9 ms; as duas rotas de saída do Início ficaram entre 15,6 e 16,0 ms mais lentas. Com 100 ms por chamada, as medianas de retorno ficaram entre 1.379 e 1.686 ms. Esse efeito é compatível com o maior trabalho de leitura da tela inicial, mas os 50/100 ms são atrasos simulados em cada chamada local, sem extrapolação para produção.

Duas transições de primeira visita no volume vazio/0 ms foram navegações completas de documento (`nativa=true`), em / ↔ /ativos. Permanecem nas séries e nas estatísticas, sem retry. As outras 2.878 foram transições no mesmo documento. O ensaio registra o comportamento, sem atribuir causa ou tratar os dois tempos como erros.

O percurso adicional sem escrita passou nos dois volumes: / → Lançamentos → Ativos → Benchmarks → /, Conta, Transferências, prévia de fechamento, filtros e retorno pelo histórico. É verificação de passagem, sem repetição para mediana/p95. A primeira renderização autenticada do servidor também foi registrada separadamente e inclui login; não entra na tabela.

## Caminho sequencial e candidatos para a unidade C

A inspeção de `src/lib/leitura.ts` mostra cinco componentes sequenciais em `marcaCarteira` (meses, última desativação e contagens de eventos/transferências/ativos). `lerInsumosDoInicio` lê ativos, eventos, consolidados e posições em sequência, dentro da composição antes → insumos → depois. Eventos e posições com 1.800 linhas exigem duas páginas cada. A página Lançamentos já usa `Promise.all` nos três insumos iniciais; Ativos lê somente a lista. Sessão continua usando `getUser` e perfil; nenhuma dessas proteções é candidata à remoção.

**Ressalva descoberta no diagnóstico:** a quantidade de transportes observada é menor que a quantidade de consultas lógicas das duas marcas. O Next instalado chama `createDedupeFetch(globalThis.fetch)` em `node_modules/next/dist/server/lib/patch-fetch.js`; `dedupe-fetch.js` memoriza GET/HEAD idênticos por pedido via `React.cache`. O cliente Supabase do produto não passa um signal próprio em `src/lib/supabase/server.ts`, e `PostgrestBuilder.ts` encaminha `signal: this.signal`. A ausência de transportes repetidos das marcas é compatível com essa deduplicação; não se deve apresentar um cache hit como nova leitura do banco nem presumir que os testes do helper isolado provem o comportamento de Server Components.

Antes de C, provar D13 também no servidor Next real, intercalando escrita entre marca inicial, páginas/insumos e marca final, inclusive entre subconsultas da marca. Se a marca final reutilizar a resposta inicial e a prova falhar, parar antes da otimização e pedir revisão do escopo: mexer no cliente/cache fora dos módulos autorizados não está implicitamente autorizado pela #52. Este relatório identifica a limitação sem alterar produto, garantia financeira ou autenticação.

A série confirma o aumento de trabalho por volume: no destino `/` a 50 ms, foram observadas 11 chamadas Supabase por pedido com carteira vazia e 13 com carteira cheia; em `/lancamentos`, 5 e 6; em `/ativos`, 3 em ambos. Uma amostra cheia/100 ms mostra sessão e perfil em sequência no destino Lançamentos, três insumos iniciados juntos e a segunda página de eventos depois. Isso torna a composição da tela inicial e a paginação candidatas mensuráveis para C; os tempos e contagens permanecem observações do transporte local e passam pela ressalva de deduplicação acima.

Os candidatos permitidos continuam limitados ao plano: paralelismo dos componentes independentes da marca e, se sustentado pelas séries, insumos independentes do Início/fechamento/comparação, sem sobrepor as três fases. Para uma rota adicional ser candidata, executar nela as mesmas repetições antes/depois. Feedback de carregamento/prefetch só pode entrar após demonstrar ganho e os limites de não regressão da v1, sem números provisórios nem amplificação de consultas por sessão. Nenhuma otimização foi implementada nesta unidade.

## Provas exigidas antes da otimização

- D13 no helper e no Next real: mais de 1.000 linhas, ordenação total, erro de página/contagem, alterações entre páginas/fases e entre subconsultas da marca, três tentativas inteiras e erro recuperável. Reabertura/refechamento e cobertura/valores de benchmark precisam ser detectados.
- Resultados financeiros iguais aos casos especificados; nenhum sucesso parcial. Comparação antes/depois alternada em builds das duas revisões, com carga idêntica, três rodadas, metas de ganho de 20% e 50 ms no ensaio de 50 ms e limites de regressão da v1.
- Atualização por navegação/histórico após cada escrita existente, sessão/logout/troca de conta, usuário A/B/admin, RLS, ocultação desde SSR, acessibilidade e layout. Não remover `getUser`, perfil, renovação de cookies ou páginas de dados.
- Se houver fallback/prefetch, medir também a espera anterior à sua fronteira, prazo de feedback de 200 ms, movimento reduzido, ausência de números provisórios e custo por sessão.

## Limites e distinção de evidências

O relato humano de melhora após mudança de região da Vercel é contexto do plano; não foi medido nem verificado aqui. Esta baseline é local; 50/100 ms são simulações controladas por chamada. Não estimam rede regional real, Vercel–Supabase, cold start serverless ou ganho em produção. Não existe candidata nesta unidade e não há resultado antes/depois de otimização. O teste histórico D9 é HTTP local e continua separado da navegação por clique.

As rotas Benchmarks, Conta, Transferências e prévia de fechamento recebem percurso/verificação adicional; não se afirma mediana/p95 de três rodadas dessas rotas. A primeira renderização do servidor após iniciar é registrada separadamente, sem chamá-la de cold start de produção. O total que inclui login é rotulado e não compõe as amostras de transição.

## Unidade C (#54): nova baseline, candidata e comparação

### Por que a baseline foi refeita

A prova D13 no Next real exigida acima falhou: a deduplicação por pedido do Next devolvia a resposta da marca inicial para a marca final e para as novas tentativas. A correção foi feita pela trilha curta na issue #57 (PR #58, `5d04b7453e7d01f3d1b15a28e9746c47ca7ea4c3`): cada fase da composição passa um `AbortSignal` próprio às consultas. A marca final passou a ir ao banco, o que muda o custo medido nesta unidade; por isso a baseline da C é `5d04b74`, e não a da A.

### Execuções

Mesmo protocolo e comando da A (`tests/e2e/apoio/medir-navegacao.mjs`), com Chromium fixado pelo Playwright, carga fictícia idêntica e Node v24.19.0, o mesmo da A.

- Baseline `5d04b74`: 2.880 amostras, 144 grupos, 18 limpezas, sem falha de amostra; série em `005_validation_series_c_baseline.md`. Uma chamada entre 118.835 registros (`consolidados_mensais`, `/`, 0 ms) teve o transporte rejeitado e foi repetida com sucesso pelo próprio postgrest-js após 1 s; a amostra (1.328 ms) foi mantida, e o resumidor passou a aceitar somente esse caso, sempre listado, por decisão do responsável.
- Candidata `16f05af`: 2.880 amostras, 144 grupos, 18 limpezas, sem falhas nem rejeições; série em `005_validation_series_c_candidata.md`.
- Tentativas que não compõem resultado, preservadas somente em `local/`: uma tentativa da baseline com Node v24.15.0, interrompida no bloco 6 por timeout de marcador com estado de erro sem resposta HTTP de erro (padrão das falhas preparatórias da A nesse Node), e duas preparações da verificação alternada que falharam no build, antes de medir.
- Desvio autorizado pelo responsável: uma execução completa de cada revisão, em sequência, em vez de execuções alternadas. A deriva entre execuções foi controlada depois por uma verificação curta e alternada do bloco carteira vazia/0 ms.

### Nova baseline em relação à A

Chamadas Supabase por pedido de destino `/`: 13 → 18 (+5, a marca final: meses, última desativação e três contagens); Lançamentos (5/6) e Ativos (3) inalterados. Medianas de conteúdo pronto, carteira cheia:

| Atraso ms | Navegação | A | Baseline C |
| --: | :-- | --: | --: |
| 0 | /lancamentos → / (primeira) | 261,5 | 316,0 |
| 50 | /lancamentos → / (primeira) | 1.066,3 | 1.424,7 |
| 100 | /lancamentos → / (primeira) | 1.679,8 | 2.279,1 |

O custo da correção D13 é compatível com cinco consultas sequenciais a mais. As demais rotas não pioraram.

### Candidata

`marcaCarteira` lê os cinco componentes da marca com `Promise.all`, e a Comparação lê as marcas da carteira e do benchmark juntas. As fases antes → insumos → depois continuam sem sobreposição, e o total de chamadas por tentativa não muda. Cada componente só muda num sentido e toda leitura da marca antes termina antes dos insumos; uma escrita posterior à leitura de um componente aparece nele na marca depois. `Promise.all` não é retrato único: a garantia continua sendo a conferência antes = depois.

Provas: Vitest com escrita depois de cada transporte da composição e requisições concorrentes atendidas em lote nas ordens de chegada e inversa (Início, fechamento e Comparação); as mutações de fases sobrepostas e de marca final sem signal foram detectadas. No `next start`, escritas entre páginas de posições e entre componentes da marca (contagem de transferências retida antes de sair) produziram a versão nova inteira, com 34 transportes por pedido, todos 2xx, igual à versão sequencial. Regressões e2e, D9 e gates na task da issue #54.

### Aceite de ganho

Mediana de conteúdo pronto, carteira cheia, 50 ms por chamada, por rodada (baseline → candidata):

| Navegação | Condição | Rodada 1 | Rodada 2 | Rodada 3 |
| :-- | :-- | --: | --: | --: |
| /lancamentos → / | primeira | 1.427,4 → 847,4 (−40,6%) | 1.422,5 → 853,1 (−40,0%) | 1.426,8 → 847,8 (−40,6%) |
| /lancamentos → / | revisita | 1.413,9 → 847,6 (−40,1%) | 1.412,5 → 846,3 (−40,1%) | 1.431,4 → 847,2 (−40,8%) |
| /ativos → / | primeira | 1.421,8 → 853,6 (−40,0%) | 1.419,3 → 851,5 (−40,0%) | 1.425,1 → 850,4 (−40,3%) |
| /ativos → / | revisita | 1.414,4 → 846,5 (−40,2%) | 1.414,2 → 846,9 (−40,1%) | 1.414,8 → 841,7 (−40,5%) |

Os quatro pares de retorno ao Início atingem o aceite (pelo menos 20% e 50 ms) nas três rodadas. Grupos de 60 amostras, mesma condição: com 100 ms, cerca de −940 ms (cheia: 2.279,1 → 1.338,5 ms); sem atraso artificial, cheia: 316,0 → 223,1 ms e vazia: 232,3 → 144,7 ms (/lancamentos → /, primeira). Destinos Lançamentos e Ativos não usam a marca e ficam com o mesmo número de chamadas. Pedidos de prefetch: 17.996 na baseline e 17.858 na candidata.

### Regressão e verificação alternada

Na comparação das execuções completas, 1 de 48 grupos excedeu `max(20 ms, 10% da baseline)`: / → /ativos, carteira vazia, 0 ms, primeira visita, p95 80,5 → 112,3 ms (+31,8), mediana +15,6 ms. Os indícios eram de deriva entre execuções: a chamada `ativos`, idêntica nas duas revisões, teve mediana de 4,01 ms na baseline e 5,83 ms na candidata, e o servidor de /ativos com 50 ms foi de 269,9 (A), 255,0 (baseline) e 269,1 ms (candidata).

Verificação curta autorizada pelo responsável: bloco carteira vazia/0 ms executado quatro vezes na mesma pasta e com o mesmo harness, alternando os dois arquivos de produto que diferem entre as revisões, com build novo antes de cada execução (baseline → candidata → baseline → candidata; 160 amostras por execução, nenhuma resposta fora de 2xx/3xx). Medianas/p95 em ms, juntando as duas execuções de cada revisão (n = 40):

| Navegação | Condição | Baseline | Candidata | Δ mediana | Δ p95 |
| :-- | :-- | --: | --: | --: | --: |
| / → /lancamentos | primeira | 78,8/81,0 | 79,1/95,3 | +0,3 | +14,3 |
| / → /lancamentos | revisita | 73,2/81,7 | 65,0/81,4 | −8,2 | −0,3 |
| /lancamentos → / | primeira | 229,7/247,0 | 144,1/146,3 | −85,6 | −100,7 |
| /lancamentos → / | revisita | 231,3/263,4 | 131,0/147,3 | −100,3 | −116,1 |
| / → /ativos | primeira | 79,5/80,8 | 94,6/96,9 | +15,1 | +16,1 |
| / → /ativos | revisita | 64,8/80,7 | 80,9/97,8 | +16,1 | +17,1 |
| /ativos → / | primeira | 166,8/179,9 | 138,4/146,7 | −28,5 | −33,2 |
| /ativos → / | revisita | 164,2/180,9 | 130,8/148,1 | −33,4 | −32,8 |

Nenhum grupo excede o limite. O +31,8 ms de p95 não se repetiu. Em / → /ativos, porém, a candidata ficou cerca de 15–17 ms acima da baseline nas duas execuções alternadas, de forma consistente; o valor está dentro do limite e equivale a cerca de um quadro do cronômetro por `requestAnimationFrame`. A página Ativos não usa a marca, e a causa não foi identificada; o registro fica como observação, não como ganho nem como regressão comprovada.

### Limites

Simulação local com atraso artificial por chamada; não mede rede real, Vercel–Supabase, cold start ou ganho em produção. As execuções completas são uma por revisão, em sequência, por decisão do responsável; a verificação alternada cobre apenas o bloco carteira vazia/0 ms. Feedback de carregamento e prefetch não foram alterados: em todas as 2.880 transições de cada execução, feedback e conteúdo pronto coincidiram, e o ganho veio da redução do caminho sequencial no servidor.
