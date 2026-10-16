# Diagnóstico de navegação — ciclo 005, unidade A (#52)

## Escopo e reprodução

Baseline local anterior a qualquer otimização de produto, conforme plano v1 e issue #52. O protocolo está em `tests/e2e/apoio/MEDICAO.md`; comando: `node tests/e2e/apoio/medir-navegacao.mjs`, com `PLAYWRIGHT_CHANNEL=chrome` neste ambiente. Nenhum código em `src/`, migração, autenticação, RLS ou configuração externa foi alterado.

As séries sanitizadas e os metadados são registrados em `005_validation_series.json`. A coleta completa está em andamento; os resultados abaixo só serão preenchidos após validar a matriz e a limpeza. Arquivos locais de desenvolvimento/pilotos não são a baseline.

## Ambiente e volumes

Revisão do ensaio: `7112308fe5dcc7235a1e102068946d9d969a33a1`, árvore limpa antes do build. A revisão de produto é a base aprovada `9914a907e91d9487c9ba9543bafff71a7dbf8e5e`; a diferença contém apenas apoio de testes e rastreabilidade. Build `u-p0VIKYnHlPCqhKMfjoQ`, iniciado em 2026-10-15 às 20:51:33 (America/Cuiaba). Hashes das fontes do ensaio ficam nos metadados, permitindo distinguir alteração de apoio de alteração de produto.

Node v24.15.0; Next 16.4.0; React 19.3.0; Supabase CLI 2.120.0; Chrome 155.0.8059.80; Windows 10.0.26300 x64; Intel i5-11400 2,60 GHz (12 processadores lógicos), 15,87 GiB de RAM. `next build` + `next start` em 127.0.0.1:3105, Supabase/Docker local em 127.0.0.1:54321. Viewport 1280 × 900; concorrência 1. Nenhum outro ensaio/build foi executado durante a baseline. Tempo local, transporte e overhead do apoio estão incluídos; não é medição de SQL puro.

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

Relógio no evento real de clique; feedback exige conteúdo/carregamento de destino visível; pronto exige título e marcador específico após leitura, não apenas URL/menu. Mediana é a média dos dois centrais em n par; p95 é o posto `ceil(0,95 × n)`. Cada série de 20 preserva as amostras lentas; erro de resposta ou conteúdo interrompe a execução, em vez de ser descartado. As durações de resposta do servidor e de chamadas são independentes do relógio do navegador e correlacionadas por identificadores sintéticos. Chamadas significam transporte observado no preload, abaixo da deduplicação do Next.js, não número de expressões `await` executadas no código.

Nas primeiras visitas, o identificador da amostra inclui abertura da origem, prefetch e destino; totais de chamadas por amostra medem esse custo de sessão. Nas revisitas, origem e cinco aquecimentos ficam fora da amostra, e o retorno recebe outro identificador. Portanto, totais entre condições não têm a mesma fronteira; a série por pedido permite comparar somente o destino ou a navegação completa de forma explícita. A duração de servidor tabulada é de pedidos de destino sem prefetch; ausência de pedido deve ser relatada como tal, nunca como tempo SQL zero.

## Resultados

Pendente da validação da coleta completa.

## Caminho sequencial e candidatos para a unidade C

A inspeção de `src/lib/leitura.ts` mostra cinco componentes sequenciais em `marcaCarteira` (meses, última desativação e contagens de eventos/transferências/ativos). `lerInsumosDoInicio` lê ativos, eventos, consolidados e posições em sequência, dentro da composição antes → insumos → depois. Eventos e posições com 1.800 linhas exigem duas páginas cada. A página Lançamentos já usa `Promise.all` nos três insumos iniciais; Ativos lê somente a lista. Sessão continua usando `getUser` e perfil; nenhuma dessas proteções é candidata à remoção.

**Ressalva descoberta no diagnóstico:** a quantidade de transportes observada é menor que a quantidade de consultas lógicas das duas marcas. O Next instalado chama `createDedupeFetch(globalThis.fetch)` em `node_modules/next/dist/server/lib/patch-fetch.js`; `dedupe-fetch.js` memoriza GET/HEAD idênticos por pedido via `React.cache`. O cliente Supabase do produto não passa um signal próprio em `src/lib/supabase/server.ts`, e `PostgrestBuilder.ts` encaminha `signal: this.signal`. A ausência de transportes repetidos das marcas é compatível com essa deduplicação; não se deve apresentar um cache hit como nova leitura do banco nem presumir que os testes do helper isolado provem o comportamento de Server Components.

Antes de C, provar D13 também no servidor Next real, intercalando escrita entre marca inicial, páginas/insumos e marca final, inclusive entre subconsultas da marca. Se a marca final reutilizar a resposta inicial e a prova falhar, parar antes da otimização e pedir revisão do escopo: mexer no cliente/cache fora dos módulos autorizados não está implicitamente autorizado pela #52. Este relatório identifica a limitação sem alterar produto, garantia financeira ou autenticação.

Os candidatos permitidos continuam limitados ao plano: paralelismo dos componentes independentes da marca e, se sustentado pelas séries, insumos independentes do Início/fechamento/comparação, sem sobrepor as três fases. Para uma rota adicional ser candidata, executar nela as mesmas repetições antes/depois. Feedback de carregamento/prefetch só pode entrar após demonstrar ganho e os limites de não regressão da v1, sem números provisórios nem amplificação de consultas por sessão. Nenhuma otimização foi implementada nesta unidade.

## Provas exigidas antes da otimização

- D13 no helper e no Next real: mais de 1.000 linhas, ordenação total, erro de página/contagem, alterações entre páginas/fases e entre subconsultas da marca, três tentativas inteiras e erro recuperável. Reabertura/refechamento e cobertura/valores de benchmark precisam ser detectados.
- Resultados financeiros iguais aos casos especificados; nenhum sucesso parcial. Comparação antes/depois alternada em builds das duas revisões, com carga idêntica, três rodadas, metas de ganho de 20% e 50 ms no ensaio de 50 ms e limites de regressão da v1.
- Atualização por navegação/histórico após cada escrita existente, sessão/logout/troca de conta, usuário A/B/admin, RLS, ocultação desde SSR, acessibilidade e layout. Não remover `getUser`, perfil, renovação de cookies ou páginas de dados.
- Se houver fallback/prefetch, medir também a espera anterior à sua fronteira, prazo de feedback de 200 ms, movimento reduzido, ausência de números provisórios e custo por sessão.

## Limites e distinção de evidências

O relato humano de melhora após mudança de região da Vercel é contexto do plano; não foi medido nem verificado aqui. Esta baseline é local; 50/100 ms são simulações controladas por chamada. Não estimam rede regional real, Vercel–Supabase, cold start serverless ou ganho em produção. Não existe candidata nesta unidade e não há resultado antes/depois de otimização. O teste histórico D9 é HTTP local e continua separado da navegação por clique.

As rotas Benchmarks, Conta, Transferências e prévia de fechamento recebem percurso/verificação adicional; não se afirma mediana/p95 de três rodadas dessas rotas. A primeira renderização do servidor após iniciar é registrada separadamente, sem chamá-la de cold start de produção. O total que inclui login é rotulado e não compõe as amostras de transição.
