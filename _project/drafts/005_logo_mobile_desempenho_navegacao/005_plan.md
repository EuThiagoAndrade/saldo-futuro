# Plano de Implementação — Logo no cabeçalho mobile e desempenho de navegação

> **Ciclo:** `005`
> **Status:** `Em Execução`
> **Versão:** `v1`
> **Data de criação:** 2026-10-15
> **Última atualização:** 2026-10-16
> **Tipo:** `feature`
> **Prioridade:** `P2`
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 005" em 2026-10-15
> **Autorização do rascunho:** "autorizo o rascunho do plano do ciclo 005" em 2026-10-15
> **Modo contínuo:** `—`
> **Revisão formal:** `Concluída`
> **Veredito da revisão:** `APTO PARA APROVAÇÃO`
> **Aprovação humana pós-revisão:** `Aprovada em 2026-10-15`
> **handoff_schema_version:** `2`

## Problema e contexto

Ideação: `_project/ideations/005_logo_mobile_desempenho_navegacao.md`.

## Objetivo

Incluir a marca à esquerda no cabeçalho mobile e reduzir a espera nas transições entre telas com ganho reproduzível, preservando os resultados financeiros, a leitura completa e coerente, a sessão e o isolamento por usuário. Separar a rapidez do feedback visual da disponibilidade do conteúdo e do custo de servidor/consultas.

## Contexto e baseline

- Origem inspecionada: `EuThiagoAndrade/saldo-futuro`, `main`, commit `59f7498272b6d83ecdfa7db38eb37d6bf95ac436`. Já havia mudanças locais em `_project/cycles.md` e a ideação `005` ainda não versionada; ambas são entradas deste trabalho e devem ser preservadas.
- O ciclo `004` encaminhou logo mobile e desempenho como pendências. O responsável relatou em 2026-10-15 melhora expressiva após alterar a região da Vercel de `iad1` para `gru1`, mantendo Supabase em `sa-east-1`. É relato humano; os painéis, a região efetiva do deployment e o ganho quantitativo não foram verificados.
- `vercel.json` não declara região explícita. Este plano não altera configuração regional nem atribui ao código ganhos decorrentes dessa alteração.
- `src/app/(app)/layout.tsx` tem somente Ocultar valores no cabeçalho. O logo completo, já usado no menu lateral e login, está em `design-system/assets/logo-saldo-futuro.svg`, com proporção 4:1. A 32 px de altura ocupa 128 px antes da área de proteção.
- `src/lib/sessao.ts` usa `cache` do React dentro do pedido, valida o usuário com `getUser` e lê seu perfil. `src/proxy.ts` renova cookies com `getClaims`. Esta inspeção não demonstra que alguma dessas etapas possa ser removida.
- `marcaCarteira`, em `src/lib/leitura.ts`, lê meses, última desativação e três contagens em sequência. `src/lib/telas/leituras.ts` e `leitura-benchmarks.ts` também têm leituras sequenciais. São candidatos a medir, não gargalos comprovados.
- D13 do plano `004` exige marcas antes/depois da composição inteira, paginação completa com contagem exata e até três tentativas. Paralelismo não pode cruzar essas fronteiras.
- A navegação usa `Link`; não foram encontrados arquivos `loading.tsx` no código atual. Deve-se medir o comportamento existente de transição/prefetch antes de modificá-lo.
- `tests/e2e/desempenho.spec.ts` mede cinco respostas HTTP do Início local, após aquecimento, com 30 ativos e 60 meses fechados. A mediana histórica de 175 ms, registrada no ciclo `004`, não mede navegação por clique, primeira visita nem Vercel–Supabase e não é a baseline deste ciclo.
- A consulta de PRs abertas via `gh` nesta preparação falhou por conexão com `api.github.com`. Não se afirma o estado remoto atual. Isso não impede a redação local; conferir estado remoto é precondição da publicação e da criação das issues.

## Escopo

### Dentro do escopo

1. Logo completo existente no header abaixo de `lg`, à esquerda; Ocultar valores à direita, com seus estados atuais.
2. Protocolo e apoio de medição optativa com dados fictícios, servidor de produção local e relatório antes/depois.
3. Paralelizar somente consultas comprovadamente independentes nos módulos de leitura existentes, dentro de cada fase de D13, quando o diagnóstico demonstrar benefício.
4. Avaliar e, somente com benefício medido, incluir feedback de carregamento conforme o design system e ajustar prefetch dos links existentes. Sem novos destinos ou parâmetros públicos.
5. Regressões de leitura, concorrência, atualização após escrita, autenticação, isolamento, ocultação de valores, acessibilidade e layout.
6. Verificação delimitada em produção após autorização própria, release quando gerada pelo fluxo existente e encerramento documental.

### Fora do escopo

- Migração da origem, novas telas financeiras, fórmulas, critérios de período ou arredondamento.
- Mudanças em `src/lib/financeiro/`, semântica do schema, RLS, funções de banco, autenticação ou autorização; remoção de `getUser`, leitura de perfil ou renovação de cookies.
- RPC agregada, índices e qualquer migração nesta versão. A alternativa de agregação da ideação fica adiada; se necessária, exige revisão do plano e nova aprovação antes de implementar.
- Cache persistente, cache compartilhado de dados privados, troca das marcas de coerência por TTL ou redução da coleta para amostras/primeira página.
- Nova dependência, telemetria externa, serviço de observabilidade, service worker, modo offline ou redesenho da navegação.
- Mudança de região, plano de hospedagem, variáveis de ambiente ou infraestrutura; acesso autenticado à produção durante o diagnóstico local.
- Implementação, criação de issues, branch, commit, PR, publicação ou deploy no workflow deste rascunho.

## Decisões e autoridades

Rascunho instanciado integralmente de `.agent/templates/plano_implementacao.md`, seguindo `.agent/workflows/rascunhar_plano.md`. Autoridades lidas no ponto de uso: `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, ideação `005`, ADR-001, ADR-002 e ADR-003, KB-003, convenções/apresentação do Início da KB-004, seção Vercel da KB-002 e `design-system/DESIGN.md`. D2, D8 e D13 do plano executado `004` limitam proteção, ocultação e coerência.

As propostas abaixo ficam sujeitas à revisão formal e aprovação humana posterior:

| Decisão | Proposta e limite |
| :-- | :-- |
| Composição da marca | Logo completo, sem criar asset, com altura mínima de 32 px, proporção preservada e proteção mínima de 1/4 da altura do símbolo. Visível abaixo de `lg`; desktop mantém a marca lateral. Se não couber em 360 px com os controles e proteção, registrar a prova e pedir decisão antes de substituir pelo símbolo |
| Interação da marca | Link para `/`, com nome acessível Saldo Futuro e alvo mínimo de 44 × 44 px; sem duplicar o nome no leitor de tela |
| Prioridade do diagnóstico | Medir Início, Ativos, Lançamentos e Benchmarks; verificar também fechamento, transferências e Conta. Sem resposta adicional sobre a rota mais lenta, começar por Início ↔ Lançamentos e Início ↔ Ativos |
| Otimização permitida | Primeiro avaliar consultas independentes em `marcaCarteira`; depois, se o relatório justificar, insumos independentes em `leituras.ts` e `leitura-benchmarks.ts`. Não sobrepor marca inicial, insumos e marca final; cada fase termina antes da seguinte |
| Carregamento | Avaliar fallback no grupo/rotas existentes com esqueletos sem números, indicação acessível e movimento reduzido. Medir inclusive o caso em que a espera ocorre antes da fronteira do fallback; a mera presença de `loading.tsx` não comprova feedback rápido |
| Prefetch | Registrar o comportamento observado no build atual. Ajustar apenas links existentes se houver ganho sem amplificar consultas ou servir conteúdo desatualizado após escrita, troca de conta ou logout |
| Metas | Aplicar o protocolo e os limites abaixo; são critérios propostos para aceitar mudanças, não resultados nem promessa de latência em produção |
| Região e banco | Usar a mudança regional como contexto relatado. Nenhuma configuração externa ou alteração de banco faz parte da solução autorizável nesta versão |

### Pontos de aprovação

| Ponto | Precondição | Cobre | Não cobre | Conferir |
| :-- | :-- | :-- | :-- | :-- |
| Autorizar rascunho — "autorizo o rascunho do plano do ciclo 005" | Ideação registrada; concedido em 2026-10-15 | Este plano local e reconciliação do ciclo como Planejamento | Revisão formal, aprovação, issues ou implementação | Ideação, template e autorização no cabeçalho |
| Aprovar plano — "aprovo o plano do ciclo 005" | Revisão formal com veredito apto posterior à última correção e manifestação humana posterior ao veredito | Escopo final; PR documental `chore/cycle-005-plan`, com ideação, plano e `cycles.md`; merge documental com checks verdes conforme fluxo completo; issues após apresentação dos payloads; preparação do encerramento | Implementação, merge de entrega/release/encerramento, ação externa ou verificação em produção | Veredito, ressalvas, limites técnicos, metas e decomposição |
| Autorizar implementação — "autorizo a implementação da issue #N" | Plano aprovado e integrado, issue real criada; dependência anterior integrada | Branch, task, código/testes e abertura da PR da unidade | Merge ou outra issue | Payload, escopo e diagnóstico quando exigido |
| Aprovar merge — "aprovo o merge da PR #N" | Diff revisado, checks críticos verdes no HEAD corrente, critérios atendidos | Squash daquela PR; uma aprovação própria por entrega, release e encerramento | Outra PR, ação externa ou verificação em produção | Diff, checks, barreiras e evidências; na otimização, comparação antes/depois e D13 |
| Ação humana externa — "concluí a ação externa da issue #N" | Somente se surgir ação externa necessária e previamente delimitada em revisão aprovada | A ação descrita na issue real, com conferência por leitura do acessível | Autorizar nova infraestrutura por inferência | Roteiro aprovado e evidência sanitizada; nenhuma ação externa está prevista na v1 |
| Verificar produção — "autorizo a verificação em produção do ciclo 005" | Entregas integradas, checks verdes e deployment correspondente conferido | Checklist delimitado abaixo, com registros sem dados reais | Escritas financeiras, acesso a carteiras alheias, alteração regional ou infraestrutura | Deployment, header, transições, estados, sessão e limites da evidência |

Toda cadeia para se faltar capacidade, evidência ou autorização, houver conflito de escopo/privacidade, necessidade de nova dependência, mudança de cálculo/acesso/schema ou ganho insuficiente para atender ao aceite. A situação passa a Parado, com pergunta concreta e alternativas. O modo contínuo não se aplica ao ciclo completo. A recomendação do próximo workflow não o aciona.

## Barreiras de domínio

| Barreira | Aplica-se? | Como o ciclo a atende ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim, como regressão dos insumos de cálculo; nenhuma regra muda | Preservar completude, ordem, marcas e fronteiras da composição; executar casos financeiros existentes e comparar resultados com os esperados já especificados na KB-004. Se uma otimização exigir nova interpretação financeira, parar; mudança de regra exige revisão de escopo, decisão humana, casos independentes e atualização da KB antes de implementação |
| G2 — isolamento por RLS | Sim, nas leituras autenticadas e transições | Manter o cliente da sessão, proteção em cada ponto de entrada, RLS e restrição admin. Provar isolamento com usuários fictícios A/B e admin; incluir troca de conta, logout e prefetch. Sem bypass, service role na aplicação ou cache privado compartilhado |
| G3 — privacidade de dados | Sim | Medir somente no Supabase local, com fixtures fictícias e usuários exclusivos. Evidências contêm rotas, durações, contagens e condições de execução; nunca payloads, cookies, tokens ou dados reais. Sanitizar artefatos antes de versionar/publicar |
| G4 — migrações só acrescentam | Não há migração prevista | Não alterar migrações existentes nem criar nova nesta versão. Se o diagnóstico exigir banco, parar e revisar o plano; eventual autorização futura deve prever migração aditiva e testes de banco |

## Estratégia de testes

### Protocolo de desempenho antes/depois

O item A entrega o protocolo executável e a baseline antes de qualquer otimização. O item C usa a mesma rotina na revisão anterior à mudança e na candidata, com mesmo ambiente e dados. Não comparar resultados de `next dev` com `next start`.

1. Registrar commits/builds, Node e navegador, sistema, hardware, Supabase local, quantidade real de linhas por tabela, viewport, comandos, configuração de prefetch/cache e concorrência. Servidor `next build` + `next start`; impedir reutilização acidental de servidor de outra revisão. Sem produção ou SGS real para gerar a carga.
2. Reutilizar o apoio fictício existente: carteira vazia e carteira com 30 ativos comuns e 60 meses fechados, geradas por RPCs como o usuário. Registrar também o ativo de sistema e totais efetivos; os eventos e posições precisam ultrapassar 1.000 linhas. Benchmarks fictícios e seus consumidores ficam em execução serial para não disputar o catálogo global.
3. Medir por clique real Início → Lançamentos → Ativos → Benchmarks → Início, nos dois sentidos dos pares prioritários. Fazer uma passagem adicional por Conta, Transferências e prévia do fechamento, sem confirmar escrita no ensaio de tempo. Incluir mudança de período/filtro existente e volta pelo histórico.
4. Separar: primeira visita em contexto novo sem destino visitado; revisita com prefetch/cache normais; primeira renderização após iniciar o servidor, relatada à parte. Não chamar toda primeira visita de cold start serverless. Para a primeira visita, autenticar o contexto sem visitar a rota alvo; não incluir tempo de login na transição.
5. Por par prioritário, volume e condição, coletar três rodadas de 20 amostras válidas. Fazer cinco aquecimentos para revisitas; primeiras visitas usam novo contexto por amostra. Executar baseline/candidata alternadamente para reduzir deriva; manter a carga do banco igual. Medidas adicionais nas demais rotas usam o mesmo protocolo quando candidatas a otimização.
6. Em cada amostra medir separadamente: clique → primeiro feedback visível de destino/carregamento; clique → conteúdo de destino pronto, com marcador determinístico após os dados; duração de resposta do servidor e duração/quantidade das chamadas Supabase por categoria. Mudança apenas de URL/estado ativo não conta como conteúdo pronto. Conteúdo já pronto pode ser o primeiro feedback; não exigir que um esqueleto pisque. Correlacionar por identificador sintético, sem registrar sessão ou payload. Duração da consulta inclui transporte; não chamá-la de tempo SQL puro.
7. Executar no ambiente local sem atraso artificial, e em ensaio controlado com acréscimo de 50 ms e 100 ms por chamada Supabase no apoio de testes. Aplicar a mesma condição nos dois lados; não atrasar assets nem incluir carga de fixture no cronômetro. A simulação explica sensibilidade a viagens de rede, não comprova a latência regional real. Instrumentação só optativa/local, sem mudar respostas ou persistir telemetria em produção.
8. Guardar séries brutas sanitizadas e resumo em `005_validation_desempenho.md` no diretório do ciclo, com mediana e p95 por rota/volume/condição, calculando p95 pelo posto `ceil(0,95 × n)`. Comparar rodadas e registrar dispersão, falhas e repetições. Uma resposta errada/erro não pode ser descartada como amostra lenta.

**Aceite proposto da otimização:** reduzir o tempo mediano até conteúdo pronto em pelo menos 20% e 50 ms, em pelo menos um par prioritário com a carteira de 30 ativos/60 meses no ensaio de 50 ms por chamada, nas três rodadas. Demonstrar a causa por redução do caminho sequencial ou de trabalho medido. Reportar também o resultado sem atraso artificial; não extrapolar para produção. Nos pares/condições medidos, o aumento de mediana ou p95 não pode ultrapassar `max(20 ms, 10% da baseline)`; uma regressão acima disso bloqueia o aceite e exige investigação. Paralelismo não pode aumentar o total de chamadas para a mesma composição/tentativa; prefetch não pode aumentar o total de chamadas por sessão de navegação ensaiada frente à baseline equivalente.

**Aceite proposto do feedback, se alterado:** em transições com conteúdo ainda indisponível após 200 ms no ensaio de 100 ms por chamada, mostrar feedback acessível até 200 ms no p95, sem números provisórios, respeitando movimento reduzido e sem violar o limite de regressão do conteúdo. Se a baseline já satisfizer o critério ou o candidato não ajudar, preservar o comportamento e justificar. Ganho de feedback isolado não substitui o ganho até conteúdo exigido para a otimização.

Esses limites são propostos para aprovação do plano. O limiar local de 1 s do teste D9 existente permanece como regressão adicional; não o remover ou relaxar para fazer a nova comparação passar. Se não houver ganho suficiente dentro do escopo, registrar o resultado e parar para decisão sobre manter somente o logo/diagnóstico ou revisar o plano. Não promover uma otimização sem benefício demonstrado. Tempos são ensaio optativo e controlado, sem tornar o CI compartilhado dependente de flutuação de milissegundos.

### Regressões e gates

- Layout em 360, 390, 768, 1024 e 1280 px: marca, proteção, proporção, ausência de overflow/sobreposição, Ocultar valores nos dois estados, link por teclado, foco visível e áreas de toque. Conferência visual e axe em mobile/desktop autenticados com dados fictícios; preview sem backend continua sem sessão fictícia.
- D13: todos os dados além de 1.000 linhas, ordenação total, erro de página/contagem, alterações entre páginas e entre marca/insumos, reabertura/refechamento, lançamento retroativo e troca de cobertura/valores de benchmark. Toda tentativa mantém antes → todos os insumos → depois; qualquer consulta falha impede sucesso parcial. Divergência repete a composição inteira, com erro recuperável após três tentativas.
- Se paralelizar componentes da própria marca, intercalar escritas também entre suas subconsultas e no seu início/fim. Não presumir que `Promise.all` forme snapshot transacional; demonstrar detecção e preservação das garantias de D13. Se a prova falhar, descartar esse candidato.
- Após criar/estornar lançamento, transferir/corrigir, fechar/reabrir e alterar benchmark fictício, voltar pela navegação e histórico e verificar dados atuais, rótulos de período, N/D e erro. Ocultar valores deve persistir e renderizar desde o servidor sem exibir quantias antes da hidratação, inclusive no fallback.
- Autenticação: usuário A não vê carteira B; admin não vê carteira alheia; usuário comum não abre admin por URL; sem sessão não há dados; logout/troca de conta e navegação/prefetch não reapresentam dados da sessão anterior. Manter casos pgTAP existentes e E2E pertinentes.
- Gates documentais em toda entrega: `node --test scripts/validate-governance.test.mjs`, `node scripts/validate-governance.mjs`, `git diff --check` e `git status --short`.
- Nas entregas da aplicação: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:e2e` sem backend; depois, ambiente local configurado, `npx supabase start`, `npx supabase test db` e `npm run test:e2e` com backend. Incluir o ensaio optativo D9 com `MEDIR_DESEMPENHO=1` e o novo protocolo onde pertinente. Ler `README.md` antes de configurar o ambiente, sem imprimir valores de variáveis.
- Antes de publicar, conferir staging seletivo, privacidade das evidências e diff. Checks remotos críticos verdes no HEAD da PR antes do merge. Resultados futuros serão registrados nas tasks; nenhum dos testes de aplicação acima foi executado para este rascunho.

### Verificação delimitada em produção

Após autorização própria, conferir revisão do deployment e header em 360 px; link da marca, Ocultar valores, navegação entre as rotas prioritárias, primeira visita/revisita, feedback, erro recuperável quando observável e sessão/logout. Não criar usuários de teste ou registros financeiros em produção. A parte autenticada depende da sessão e dos meios autorizados do responsável; registrar somente passou/falhou/não exercitado e percepção de espera, sem carteiras, quantias ou capturas reais. Sem conta fictícia isolada autorizada em produção, a comparação quantitativa fica restrita ao local, e a conferência autenticada é relato humano sanitizado. Item não exercitado permanece pendente, com decisão explícita do responsável antes de encerrar; não inferir aprovação integral de relato parcial.

## Itens de implementação

### Item 1 — A: Diagnóstico e baseline reproduzível

**Contexto:** o relato de melhora regional e o teste HTTP histórico não identificam o custo restante de cada transição.

**Ação técnica:** estender o apoio de medição existente com ensaios de navegação, condições controladas e categorias de consulta; documentar baseline, hipóteses confirmadas/refutadas e candidatos dentro dos limites desta v1. Sem otimizar código de produto nesta unidade. Scripts/artefatos auxiliares devem seguir a nomenclatura local e não adicionar dependência.

**Critérios de aceite:**

- [ ] Protocolo acima executável por comando documentado, optativo, com dados fictícios e limpeza dos usuários/cenários locais, inclusive após falha.
- [ ] Baseline identifica revisão, ambiente, volumes efetivos, três métricas distintas, condições de cache e séries/mediana/p95; distingue dados medidos de simulação e relato humano.
- [ ] Relatório identifica caminho sequencial e custo de consultas/sessão sem remover proteções; seleciona candidatos permitidos e testes correspondentes antes da unidade C.
- [ ] Nenhum segredo/payload financeiro real nos artefatos; nenhuma instrumentação ativa por padrão em produção.

### Item 2 — B: Marca no cabeçalho mobile

**Contexto:** a marca existente aparece no menu lateral desktop, mas falta no cabeçalho mobile.

**Ação técnica:** reutilizar o SVG completo no layout, como link para Início à esquerda, conservando o formulário de Ocultar valores à direita. Reservar dimensões e proteção, sem mudar assets ou contrato visual. Ajustar somente o cabeçalho e os testes necessários.

**Critérios de aceite:**

- [ ] Logo abaixo de `lg`, altura mínima 32 px, proporção e proteção normativas, link nomeado e alvo de toque mínimo de 44 × 44 px.
- [ ] Em 360 px e demais larguras do protocolo não há overflow, sobreposição, distorção ou compressão dos controles; estados visível/oculto aprovados visualmente.
- [ ] Desktop, navegação Mais, foco/teclado e comportamento com/sem JavaScript da ocultação continuam funcionais; axe sem violações pertinentes.
- [ ] Nenhuma marca nova nem mudança em tokens/contrato; limitações observadas registradas antes de propor alternativa ao logo completo.

### Item 3 — C: Otimizar leituras e resposta de navegação

**Contexto:** depende da baseline integrada da unidade A. Só candidatos com evidência de custo entram no código.

**Ação técnica:** aplicar o menor paralelismo seguro entre consultas independentes dos módulos delimitados; avaliar feedback de carregamento e prefetch nos links existentes segundo o relatório. Preservar as fases de coerência, contagens, paginação, erros e proteção. Comparar candidata e baseline usando o mesmo apoio de A.

**Critérios de aceite:**

- [ ] Cada alteração rastreia hipótese/medida de A e satisfaz metas de ganho e não regressão; alternativas sem benefício são descartadas com evidência.
- [ ] Todos os resultados financeiros e estados conferem com a baseline e os casos especificados; D13 continua válida inclusive em interleavings da marca e sob escrita concorrente.
- [ ] Atualização após escrita, histórico/prefetch, ocultação, isolamento A/B/admin e logout/troca de conta comprovados; sem dados privados em cache compartilhado.
- [ ] Se houver novo feedback, critérios de 200 ms, acessibilidade, movimento reduzido e ausência de números provisórios atendidos; se não houver benefício, justificativa e comportamento preservado.
- [ ] Relatório final traz séries antes/depois, causas, limites da simulação e impacto em chamadas; regressão não resolvida ou ganho insuficiente leva a Parado antes da publicação da otimização.

## Arquivos afetados

Lista prevista, a confirmar por evidência na implementação; não é autorização para alterar todos os arquivos citados:

- Plano, ideação e `_project/cycles.md`; futuras tasks `005_task_issue-N.md`, `005_validation_desempenho.md` e `005_task_closure.md` no diretório do ciclo.
- A: `tests/e2e/desempenho.spec.ts`, apoio em `tests/e2e/apoio/` e, somente se necessário ao ensaio, `playwright.config.ts`; eventuais auxiliares de medição limitados a testes. Sem alterar o fluxo normal do CI por razões de timing.
- B: `src/app/(app)/layout.tsx`, `tests/e2e/navegacao.spec.ts` e testes de layout/ocultação pertinentes; leitura do SVG existente, sem edição do asset.
- C: `src/lib/leitura.ts`, `src/lib/telas/leituras.ts`, `src/lib/telas/leitura-benchmarks.ts` e seus testes; `tests/e2e/leitura.spec.ts`, `benchmarks.spec.ts`, `auth.spec.ts`, `inicio.spec.ts` e `navegacao.spec.ts` conforme a regressão. `src/components/navegacao.tsx` e novos `loading.tsx` nas rotas existentes somente se justificados pelas medidas.
- Encerramento: `README.md`, KB-003 e, se houver conhecimento operacional comprovado a consolidar, KB-002. Não atualizar KB-004 para inventar regra ou reescrever histórico; qualquer mudança financeira está fora da v1.

## Decomposição em issues e PRs

Números somente depois de observados no GitHub. Cada payload será apresentado ao responsável e instanciado do template aplicável no momento da criação, sem ampliar estes itens.

| Unidade | Título proposto | Entrega / PR | Dependência |
| :-- | :-- | :-- | :-- |
| Documental | Plano do ciclo 005 | Ideação, plano revisado/aprovado e registro do ciclo; `chore/cycle-005-plan` | Aprovação humana posterior ao veredito apto |
| A | `[CHORE] Medir navegação e estabelecer baseline com dados fictícios` | Apoio de ensaio e relatório de diagnóstico; uma issue/PR | Plano integrado; autorização da issue |
| B | `[FEATURE] Exibir logo no cabeçalho mobile` | Header e verificações visuais/acessíveis; uma issue/PR | A integrada; autorização da issue |
| C | `[FEATURE] Reduzir espera na navegação preservando leitura coerente` | Otimização delimitada, regressões e relatório comparativo; uma issue/PR | A e B integradas; candidatos sustentados pelo diagnóstico; autorização da issue |
| Release, se gerada | PR do release-please | Versão e changelog pelo fluxo existente | Entregas integradas e aprovação própria do merge |
| Encerramento | Encerramento do ciclo 005 | Documentação viva e movimentação prospectiva; `chore/cycle-005-closure`, sem issue recursiva | Entregas integradas, verificação tratada e release resolvida, se houver |

Branches de entrega: `chore/issue-N` para A e `feature/issue-N` para B/C, com números reais. Commits seguem `chore(issue-N):` ou `feat(issue-N):`; documentação usa `docs(cycle-005):`. Uma issue corresponde a uma PR. Nenhuma task de implementação é criada nesta redação.

## Dependências e blockers

- Nenhuma dependência de pacote nova, outro checkout ou mudança externa prevista.
- Infraestrutura de ensaio futura: Node 24, dependências fixadas, navegador e Docker/Supabase local funcionando. Não foram verificados integralmente no rascunho; falta de capacidade na execução exige Parado, sem substituir teste de banco por mock como prova de isolamento.
- Pendências não bloqueadoras da redação: quais rotas ainda incomodam após a alteração regional e preferência pessoal sobre o símbolo. Esta v1 propõe rotas principais e logo completo; aprovação posterior confirmará as propostas ou determinará correção.
- Estado operacional (2026-10-16): revisão formal concluída; plano aprovado e integrado pela PR #51; A (#52) integrada pela PR #55 em `7dbba4b` (a issue permanece aberta no GitHub); B (#53) implementada na PR #56, checks remotos aprovados e aguardando merge; C (#54) segue dependente de A e B.

## Riscos, suposições e rollback

| Risco/suposição | Tratamento e retorno |
| :-- | :-- |
| Ganho regional já resolveu a maior parte da espera | Medir antes de alterar; se não houver ganho aceito dentro da v1, parar para decidir reduzir/revisar escopo, sem otimização cosmética apresentada como ganho de conteúdo |
| Paralelismo mistura estados ou aumenta pressão no banco | Testes determinísticos entre subconsultas/fases e chamadas contadas; manter paralelismo limitado às leituras independentes já existentes. Reverter o candidato se não demonstrar segurança/ganho |
| Prefetch troca espera por chamadas extras ou dados antigos | Medir por sessão completa de navegação e testar escrita/histórico/logout; manter comportamento atual se não passar no aceite |
| Fallback não cobre a fase lenta ou mostra número antigo | Medir do clique ao primeiro feedback com atraso controlado; usar esqueletos sem valores e erro recuperável, nunca ocultar uma falha |
| Logo não cabe com a proteção e o botão em 360 px | Verificar dimensões reais e ambos os estados; não diminuir abaixo do mínimo ou trocar asset sem decisão |
| Variância local gera falso ganho | Mesma carga, builds equivalentes, alternância e três rodadas; divulgar séries e limites, sem afirmar ganho de produção a partir da simulação |
| Dados reais em captura/trace/log | Somente fixtures locais; revisão manual de evidências, sem registrar corpos de respostas ou credenciais |

Rollback de código por PR própria, revertendo apenas a mudança problemática e mantendo proteção, dados e histórico de evidências. Como não há migração/configuração externa, não há reversão de banco planejada. Antes do merge, descartar candidato insuficiente na própria branch; depois do merge, seguir triagem/autorização aplicável e aprovação própria da PR de reversão. Este plano não pré-autoriza merges ou deploy manual de rollback.

## Sequência recomendada

1. Revisar formalmente este rascunho; corrigir com autorização, preservando rodadas; obter aprovação humana posterior ao veredito apto.
2. Conferir estado real local/remoto, publicar e integrar a PR documental conforme o fluxo completo; apresentar payloads e criar issues A–C dentro do plano aprovado.
3. Autorizar A, criar sua task no início, medir baseline, publicar a PR; conferir checks e obter aprovação de merge específica.
4. Autorizar B e entregar logo com provas visuais/acessíveis; obter aprovação própria do merge.
5. Autorizar C após A/B integradas; implementar somente candidatos permitidos e medidos, comparar com a baseline e executar regressões. Se não atender às metas, parar para decisão, sem ampliar escopo. Com aceite, publicar e obter aprovação própria do merge.
6. Conferir deployment e solicitar a autorização de verificação em produção; registrar checklist sanitizado e pendências reais. A integração GitHub–Vercel pode disparar deploy automático após os merges, a conferir no momento; nenhuma ação de infraestrutura é concedida por esta etapa.
7. Tratar a release pelo fluxo existente, se gerada, com checks e aprovação de merge próprios.
8. Preparar o encerramento já coberto pela aprovação do plano: consolidar documentação viva, pós-mortem, tasks e evidências; mover prospectivamente para `executed/`, atualizar `cycles.md` sem consumir outra numeração e publicar a PR sem issue própria. Conferir checks, obter aprovação de merge e reconciliar conclusão somente após a integração.

## Referências

- `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`.
- `.agent/workflows/rascunhar_plano.md` e `.agent/templates/plano_implementacao.md`.
- `_project/ideations/005_logo_mobile_desempenho_navegacao.md`.
- `_project/executed/004_telas_produto/004_plan.md` (D2, D8, D9 e D13) e `004_task_closure.md` no mesmo diretório.
- `_project/decisions/ADR-001_governanca_agnostica_adapters.md`, `ADR-002_stack_infraestrutura.md` e `ADR-003_acesso_privacidade_publicacao.md` no mesmo diretório.
- `_project/knowledge/KB-003_visao_produto_arquitetura.md`, `KB-004_regras_financeiras.md` e `KB-002_operacao_producao_acessos.md` no mesmo diretório.
- `design-system/DESIGN.md`, seções 4, 6.1, 6.11, 7 e 8; SVG completo existente.
- Código e testes citados nas seções Contexto e baseline e Arquivos afetados; `package.json`, `playwright.config.ts` e `vercel.json`.

## Rastreabilidade

| Campo | Valor |
| :-- | :-- |
| Issue(s) | A: [#52](https://github.com/EuThiagoAndrade/saldo-futuro/issues/52), integração pela PR #55 concluída (issue ainda aberta); B: [#53](https://github.com/EuThiagoAndrade/saldo-futuro/issues/53), implementação na PR #56 aguardando merge; C: [#54](https://github.com/EuThiagoAndrade/saldo-futuro/issues/54), aberta e dependente de A e B |
| PR(s) | [#51 — publicação documental](https://github.com/EuThiagoAndrade/saldo-futuro/pull/51); [#55 — unidade A](https://github.com/EuThiagoAndrade/saldo-futuro/pull/55), integrada; [#56 — unidade B](https://github.com/EuThiagoAndrade/saldo-futuro/pull/56), checks aprovados |
| Branch(es) | `chore/cycle-005-plan` (publicação documental); `chore/issue-52` (unidade A); `feature/issue-53` (unidade B, PR #56) |
| Origem | `59f7498272b6d83ecdfa7db38eb37d6bf95ac436`, ideação e autorização do rascunho em 2026-10-15 |
| Destino após conclusão | `_project/executed/005_logo_mobile_desempenho_navegacao/005_plan.md` |

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Pronto para continuar — ciclo 005 (completo)
Quem: Qualquer ferramenta, a pedido do responsável
Conferir: —
Diga: "continue o ciclo 005"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 005 + rascunhar_plano + 005_plan + v1`
- `effect_class`: `local_mutation`
- `state_before`: ciclo 005 em Ideação, ideação registrada, sem plano; próximo ciclo 006; autorização humana do rascunho recebida em 2026-10-15.
- `state_after`: ciclo 005 em Planejamento; plano v1 em Rascunho; revisão, veredito e aprovação pendentes; próximo ciclo permanece 006; aguardando revisão (rodada 1).
- `result`: `executed`
- `evidence`: este plano, autorização reproduzida no cabeçalho, ideação de origem e linha 005 reconciliada em `_project/cycles.md`. Em 2026-10-15, Node v24.15.0: 39/39 testes de governança passaram com `TEMP`/`TMP` em `local/cycle-005-governance-temp/`; validador com 0 erros e 0 avisos; `git diff --check` e conferência de whitespace do plano novo sem achados. A primeira execução dos testes no temporário padrão teve três falhas `EPERM` de renomeação; a repetição no diretório local resolveu a limitação sem alterar código/testes. Diff e status conferidos, preservando a ideação e reserva preexistentes; nenhum teste de aplicação, commit ou publicação realizado.
- `blockers`: nenhum para redigir; revisão formal/aprovação pendentes para avançar. Consulta remota falhou por conexão, a reconferir antes de publicação/issues. Baseline e gates de aplicação são entregas futuras, não resultados deste rascunho.

## Revisão crítica

### Rodada 1

- **Autor:** Codex (GPT-6), conforme registrado no rascunho `v1`.
- **Revisor:** Antigravity, Gemini 4 Argon (High).
- **Data e autorização:** 2026-10-15; solicitação humana "revise o plano do ciclo 005". Autoriza esta revisão formal e seu registro, sem aprovar, promover ou reescrever o plano e sem iniciar implementação.
- **Base:** `main` @ `59f7498272b6d83ecdfa7db38eb37d6bf95ac436`; plano local `v1` em `Rascunho` (movido para `Em Revisão` no início desta revisão); ciclo `005` em `Planejamento` em `_project/cycles.md` (`Próximo ciclo: 006`); ideação `_project/ideations/005_logo_mobile_desempenho_navegacao.md` e plano ainda não versionados.
- **Identidade da origem (UTF-8/LF):** SHA-256 do plano `v1` antes desta revisão: `b63f3f5de1667ac4d1df0dce630d4c595ae5f3ad02822d34026aa333481c0cb2`. SHA-256 do trecho de `## Problema e contexto` até imediatamente antes de `## Próximo passo`: `5da7c5fd402a0d4224cd45eea95367b8e8330acf53d26413ca155ee56618b879`. Esse trecho e o handoff original de `rascunhar_plano` são integralmente preservados.
- **Template e autoridades lidos:** `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, `.agent/workflows/revisar_plano.md`, `.agent/templates/plano_implementacao.md`, `.agent/skills/governance-check/governance-check.md`, `.agent/skills/design-system-check/design-system-check.md`, ideação `005`, `_project/executed/004_telas_produto/004_plan.md` (D2, D8, D9 e D13), `004_task_closure.md`, ADR-001 a ADR-003, KB-002 e KB-003, `design-system/DESIGN.md` (seções 4, 6.1, 6.11, 7 e 8) e `design-system/assets/logo-saldo-futuro.svg`.

#### Achados e ressalvas

- **Bloqueadores:** nenhum identificado (`RN-k`: nenhum).
- **Ressalvas:** nenhuma identificada.

#### Itens atendidos e verificações por inspeção somente leitura

- **Objetivo, escopo e não-escopo:** coerentes com a ideação `005` e com as pendências encaminhadas no encerramento do ciclo `004` (`004_task_closure.md`). A separação entre diagnóstico/baseline reproduzível (unidade A), inclusão da marca no cabeçalho mobile (unidade B) e otimização sustentada pelas medições (unidade C) respeita o princípio de simplicidade primeiro e mudanças cirúrgicas, mantendo fora do escopo migrações, alterações em `src/lib/financeiro/`, remoção de `getUser`/perfil/renovação de sessão, caches compartilhados de dados privados, novas dependências e mudanças de infraestrutura.
- **Marca no cabeçalho mobile e contrato visual (`DESIGN.md`):** a inspeção de `design-system/assets/logo-saldo-futuro.svg` confirma `viewBox="0 0 256 64"` (proporção 4:1, símbolo quadrado de 64 unidades de altura) e texto já convertido em contornos. A 32 px de altura mínima (`DESIGN.md` §8.3), o logo ocupa 128 px de largura e exige no mínimo 8 px (1/4 da altura do símbolo) de área de proteção. Em `src/app/(app)/layout.tsx`, o contêiner em 360 px tem 16 px de margem lateral de cada lado (`px-4`, 328 px úteis) e hoje renderiza apenas o formulário "Ocultar valores" em `<header className="flex justify-end py-3">`, enquanto `src/components/navegacao.tsx` já exibe o mesmo SVG a partir de `lg` (`hidden ... lg:flex`) como link para `/` com `alt="Saldo Futuro"` e `min-h-11` (44 px). A proposta de exibir o logo completo abaixo de `lg` à esquerda, preservando alvo mínimo de 44 × 44 px, nome acessível único por faixa de viewport e parada para decisão caso alguma largura real viole proteção ou cause overflow, atende integralmente às seções 4.3, 6.1, 7 e 8 do `DESIGN.md`.
- **Leituras, paralelismo candidato e coerência D13 (G1):** a inspeção de `src/lib/leitura.ts`, `src/lib/telas/leituras.ts` e `src/lib/telas/leitura-benchmarks.ts` confirma os fatos citados no plano:
  - `marcaCarteira` executa 5 consultas em série (`consolidados_mensais`, última desativação em `ativos` e 3 contagens `head: true` em `eventos`, `transferencias` e `ativos`) em cada ponta de `lerComposicao` (10 consultas sequenciais por composição apenas para a marca);
  - `lerInsumosDoInicio` e `lerInsumosDoFechamento` executam 4 leituras de tabelas em série no interior de `lerComposicao`; no cenário de 30 ativos e 60 meses fechados (`tests/e2e/desempenho.spec.ts`), `eventos` (1.800 linhas) e `posicoes_mensais` (1.800 linhas) usam 2 páginas de 1.000 linhas cada, totalizando 16 consultas sequenciais em `lerInsumosDoInicio` (além das 2 de `obterSessao`);
  - `lerComparacao` também encadeia em série `marcaCarteira` e `marcaBenchmark` na marca e `consolidados_mensais`, `eventos` e `valores_benchmark` nos insumos;
  - no schema (`supabase/migrations/20261014185205_carteira.sql`), todas as escritas da carteira tomam `private.travar_carteira()` e alteram monotonicamente ou por timestamp transacional (`fechado_em`, `desativado_em`, contagens de `eventos`, `transferencias` e `ativos`) os componentes da marca; desde que as três fases (`antes` → `insumos` → `depois`) não se sobreponham — regra expressamente fixada no plano — e que os testes determinísticos de intercalação (inclusive entre subconsultas da própria marca, se paralelizadas) passem, a garantia de coerência D13 é preservada sem aumentar o número total de consultas por tentativa.
- **Sessão, isolamento, ocultação e estados de carregamento/prefetch (G2, D2 e D8):** `src/lib/sessao.ts` usa `cache` do React por pedido, chama `supabase.auth.getUser()` e lê `profiles`; `src/proxy.ts` apenas renova cookies com `getClaims()`; não há arquivos `loading.tsx` em `src/`. O plano preserva a verificação por ponto de entrada (inclusive status 404 para usuário comum em `/admin`, estado de erro quando o perfil falha em `tests/e2e/navegacao.spec.ts` e redirecionamento sem sessão), veda cache compartilhado de dados privados, exige que qualquer fallback ou ajuste de prefetch respeite a ocultação SSR pelo cookie `sf_ocultar_valores` (`Esqueleto` em `src/components/estados.tsx` não exibe números provisórios e respeita `prefers-reduced-motion`) e condiciona qualquer alteração em `loading.tsx` ou prefetch à medição prévia e à não amplificação de consultas por sessão.
- **Protocolo de medição, barreiras G1–G4, pontos de aprovação e privacidade (G3):** o protocolo separa ambiente local sem atraso e com atraso controlado (50 ms e 100 ms por chamada Supabase), primeira visita e revisita, 3 rodadas de 20 amostras com mediana e p95 (`ceil(0,95 × n)`), metas quantitativas claras de ganho e de não regressão, e preservação do limiar de 1 s de `tests/e2e/desempenho.spec.ts` (`MEDIR_DESEMPENHO=1`). Os pontos de aprovação seguem a tabela canônica de `_project/README.md`, sem códigos legados de gate, mantendo modo contínuo `—` (proibido no nível completo) e parada obrigatória (`Parado`) se o ganho não atingir o aceite dentro do escopo da `v1`. Nenhum dado do usuário (G3) consta nos artefatos revisados.
- **Gates documentais executados nesta revisão:** em 2026-10-15, `node --test scripts/validate-governance.test.mjs` (39/39 testes passando com `TEMP`/`TMP` em `local/cycle-005-governance-temp/`), `node scripts/validate-governance.mjs` (0 erros, 0 avisos, 4 itens manuais conferidos), `git diff --check` limpo e verificação de integridade por SHA-256 confirmando que o trecho de `## Problema e contexto` até `## Próximo passo` manteve exatamente o hash `5da7c5fd402a0d4224cd45eea95367b8e8330acf53d26413ca155ee56618b879`.

**Veredito: `APTO PARA APROVAÇÃO`.** Não foram identificados bloqueadores nem ressalvas. O plano `v1` passa a `Status: Em Revisão`, com `Revisão formal: Concluída`, `Veredito da revisão: APTO PARA APROVAÇÃO` e `Aprovação humana pós-revisão: Pendente`. Este parecer não aprova nem promove o plano e não autoriza abertura da PR documental, criação de issues ou implementação, que dependem da manifestação humana posterior `"aprovo o plano do ciclo 005"`.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 005 + revisar_plano + 005_plan/rodada-1 + v1`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `005` em `Planejamento`; plano `v1` em `Rascunho`; `Revisão formal: Pendente`; `Veredito da revisão: Pendente`; `Aprovação humana pós-revisão: Pendente`; próximo passo `Aguardando revisão (rodada 1) — ciclo 005 (completo)`.
- `state_after`: ciclo `005` em `Planejamento`; plano `v1` em `Em Revisão`; `Revisão formal: Concluída`; `Veredito da revisão: APTO PARA APROVAÇÃO`; `Aprovação humana pós-revisão: Pendente`; `### Rodada 1` registrada; próximo passo `Aguardando aprovação do plano — ciclo 005 (completo)`.
- `result`: `executed`
- `evidence`: solicitação humana `"revise o plano do ciclo 005"` em 2026-10-15; campos de status/revisão/veredito atualizados no cabeçalho; bloco `## Próximo passo` atualizado; `### Rodada 1` registrada acima; inspeção somente leitura de código, testes, migrações, design system e autoridades; 39/39 testes de governança, validador com 0 erros e 0 avisos, `git diff --check` limpo e preservação do hash SHA-256 (`5da7c5fd402a0d4224cd45eea95367b8e8330acf53d26413ca155ee56618b879`) do corpo do plano.
- `blockers`: nenhum achado de revisão em aberto; aguarda aprovação humana posterior (`"aprovo o plano do ciclo 005"`) e reconferência do estado remoto via `gh` antes da publicação documental e criação das issues.

## Aprovação e publicação documental

- **Manifestação humana posterior ao parecer:** "aprovo o plano do ciclo 005", recebida em 2026-10-15. Revisão formal da rodada 1 concluída, com `APTO PARA APROVAÇÃO`, sem achados ou ressalvas. O corpo revisado conferiu com o SHA-256 `5da7c5fd402a0d4224cd45eea95367b8e8330acf53d26413ca155ee56618b879` antes desta promoção. A aprovação confirma as propostas da v1, sem iniciar implementação.
- **Autoridades e templates:** `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, `.agent/templates/plano_implementacao.md`, `.github/pull_request_template.md` e checklist `.agent/skills/governance-check/governance-check.md` lidos no ponto de uso. O workflow `.agent/workflows/criar_issues.md` foi lido para conferir as precondições da etapa posterior.
- **Reconciliação externa:** `gh` voltou a funcionar em 2026-10-15. `origin/main` confere com `59f7498272b6d83ecdfa7db38eb37d6bf95ac436`; PR #50 integrada. Não existe PR anterior da branch `chore/cycle-005-plan` nem issue identificada do ciclo 005 nas consultas realizadas. A indisponibilidade remota registrada no rascunho permanece como evidência histórica.
- **Divergência de autorização registrada antes da publicação:** `_project/README.md`, no fluxo completo, e a tabela deste plano incluem o merge documental na aprovação do plano. Porém, `.agent/ai_behavior.md`, autoridade de autorização, exige "Cada merge exige checks verdes e \"aprovo o merge da PR #N\", sem exceção". Nesta publicação prevalece essa exigência para a integração; a aprovação recebida promove o plano e autoriza preparar/publicar a PR documental. Nenhuma regra geral ou escopo de produto é alterado. O merge aguardará manifestação específica com o número observado da PR.
- **Etapa posterior:** as issues A–C dependem do plano integrado e da apresentação dos payloads/confirmação conforme `criar_issues`; implementação continua sujeita a autorização individual. O ciclo permanece em Planejamento e o próximo ciclo permanece 006.

### Handoff da aprovação e publicação

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 005 + aprovacao_publicacao_documental + 005_plan + v1/rodada-1`
- `effect_class`: `remote_mutation`
- `state_before`: plano v1 em Em Revisão, veredito APTO PARA APROVAÇÃO, aprovação pendente; ciclo em Planejamento; sem PR documental.
- `state_after`: plano v1 Aprovado, aprovação humana de 2026-10-15 registrada; PR documental #51 publicada na branch chore/cycle-005-plan, aguardando merge; ciclo em Planejamento, sem issues ou implementação.
- `result`: `executed`
- `evidence`: manifestação humana atual, cabeçalho, revisão preservada, integridade do corpo conferida antes da promoção e estado local/remoto observado acima; PR https://github.com/EuThiagoAndrade/saldo-futuro/pull/51 criada e anexada ao chat. Gates locais em 2026-10-15: 39/39 testes de governança com temporário local; validador com 0 erros e 0 avisos; `git diff --check` limpo. Conferência manual de referências, privacidade, barreiras e autorização, com staging restrito aos três documentos do ciclo. Checks remotos são conferidos no HEAD corrente da PR, sem antecipar seu resultado neste registro.
- `blockers`: integração documental exige checks verdes no HEAD corrente e aprovação específica de merge da PR #51; issues aguardam integração e apresentação/confirmação dos payloads.

## Integração documental e preparação das issues

- **Autorização de merge:** "aprovo o merge da PR #51", recebida nesta conversa em 2026-10-15, depois da publicação e dos checks da revisão `4ab9ccbf054d1cbbc502061e727eddd31a0fb4d1`.
- **Precondições reconferidas:** PR aberta, fora de draft, base `main`, estado `CLEAN`/`MERGEABLE`, sem mudança de revisão. Diff limitado à ideação, plano e `cycles.md`. Os cinco checks do HEAD aprovado passaram: lint/tipos/testes/build/E2E sem backend, banco/E2E autenticado, governança, Vercel e comentário de preview.
- **Resultado:** PR #51 integrada por squash em `9914a907e91d9487c9ba9543bafff71a7dbf8e5e`, às 20:28:26 de 2026-10-15 (`America/Cuiaba`; GitHub: 2026-10-16T00:28:26Z). Estado `MERGED` e commit conferidos via `gh`; `main` local sincronizada por fast-forward com `origin/main`, sem alteração de produto.
- **Preparação seguinte:** títulos/corpos A–C em `005_handoff_issues.md`, derivados dos itens aprovados e na ordem dos campos dos Issue Forms `chore.yml` e `feature_request.yml`, lidos no ponto de uso junto de `.agent/workflows/criar_issues.md` e `.agent/templates/plano_implementacao.md`. Consulta das últimas 100 issues (todos os estados) não encontrou correspondência por plano ou títulos; reconferir chave lógica antes de qualquer criação.
- **Pergunta registrada:** confirma a criação das três issues A–C com os payloads de `005_handoff_issues.md`? O workflow `criar_issues` exige "Sem modo contínuo, apresentar o payload e obter a confirmação do responsável antes de criar". Nenhuma issue ou task de implementação foi criada. Ciclo permanece em Planejamento, plano Aprovado e próximo ciclo 006. Estes registros pós-merge ficam locais para acompanhar o próximo trabalho documental autorizado; não houve push direto em `main`.

### Handoff da integração e preparação

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 005 + integrar_plano_preparar_issues + PR-51/A-C + 4ab9ccbf054d1cbbc502061e727eddd31a0fb4d1`
- `effect_class`: `remote_mutation`
- `state_before`: plano Aprovado; PR #51 aberta em 4ab9ccb com checks verdes; aguardando merge; aprovação específica recebida.
- `state_after`: PR #51 integrada em 9914a90, main local sincronizada; payloads A–C preparados e próximo passo local Parado, aguardando confirmação para criar issues; sem implementação.
- `result`: `executed`
- `evidence`: autorização humana acima, PR https://github.com/EuThiagoAndrade/saldo-futuro/pull/51 em MERGED, commit 9914a907e91d9487c9ba9543bafff71a7dbf8e5e; checks verdes da revisão 4ab9ccb; payloads locais e questão de confirmação. Registros pós-merge: 39/39 testes de governança passaram com temporário local, validador com 0 erros e 0 avisos, `git diff --check` limpo; referências, privacidade, barreiras e autorização conferidas manualmente. Históricos de redação/revisão/publicação preservados.
- `blockers`: nenhum para o merge, já executado; confirmação dos payloads necessária para criar issues. Validação documental dos registros locais realizada ao final desta preparação.

## Criação das issues

- **Autorização humana:** "pode criar as issues.", em 2026-10-15, respondendo à apresentação dos títulos/corpos A–C em `005_handoff_issues.md`. A confirmação resolve a parada anterior e cobre somente a criação e a rastreabilidade, sem implementar.
- **Workflow e templates no ponto de uso:** `.agent/workflows/criar_issues.md`, `.github/ISSUE_TEMPLATE/chore.yml` para A, `.github/ISSUE_TEMPLATE/feature_request.yml` para B/C e `.agent/templates/plano_implementacao.md` para o registro; autoridades `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, plano aprovado e payloads confirmados conferidos. PR #51 reconfirmada como MERGED em 9914a907e91d9487c9ba9543bafff71a7dbf8e5e.
- **Resultado remoto:** A criada como [#52](https://github.com/EuThiagoAndrade/saldo-futuro/issues/52), B como [#53](https://github.com/EuThiagoAndrade/saldo-futuro/issues/53) e C como [#54](https://github.com/EuThiagoAndrade/saldo-futuro/issues/54). Antes de cada criação, consulta de todos os estados, com retorno abaixo do limite de 1.000, sem título ou chave lógica correspondentes; após criar, releitura comprovou título, corpo e estado OPEN. Dependências de B/C vinculadas aos números observados, conforme previsto na confirmação dos payloads.
- **Payload efetivo:** títulos/corpos e hashes em `005_handoff_issues.md`; as três chaves lógicas publicadas seguem `EuThiagoAndrade/saldo-futuro + 005 + criar_issues + <tipo/unidade> + v1@9914a907e91d9487c9ba9543bafff71a7dbf8e5e`. Os critérios e limites aprovados foram preservados.
- **Estado local:** rastreabilidade do plano e de `cycles.md` atualizada; plano Aprovado, ciclo Planejamento e próxima numeração 006 preservados. Registros ficam locais para a próxima entrega autorizada, sem push direto em main e sem PR documental adicional. Nenhuma task, branch ou código de implementação criado.

### Handoff da criação das issues

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 005 + criar_issues + chore/A_baseline_navegacao,feature/B_logo_mobile,feature/C_otimizar_navegacao + v1@9914a907e91d9487c9ba9543bafff71a7dbf8e5e`; chaves individuais publicadas nos respectivos corpos e preservadas em `005_handoff_issues.md`.
- `effect_class`: `remote_mutation`
- `state_before`: plano Aprovado e integrado; payloads A–C apresentados; situação Parado por confirmação pendente, resolvida pela autorização humana atual; nenhuma issue correspondente existente nas consultas antes de criar.
- `state_after`: issues #52, #53 e #54 abertas e conferidas; plano e cycles.md com rastreabilidade; Aguardando autorização de implementação da issue #52; sem execução iniciada.
- `result`: `executed`
- `evidence`: autorização humana atual; URLs #52–#54 acima, releituras `gh issue view` com igualdade de título/corpo e estado OPEN; payloads efetivos e SHA-256 no handoff auxiliar; dependências #52 → #53 → #54; revisão e aprovação do plano preservadas. Gates deste registro em 2026-10-15: 39/39 testes de governança com temporário local, validador com 0 erros e 0 avisos, `git diff --check` limpo e hashes dos três corpos locais iguais aos remotos verificados. Referências, privacidade, barreiras e autorização conferidas manualmente.
- `blockers`: nenhum para a criação, concluída; implementação de #52 depende da autorização específica. G1/G2 da execução e G3/G4 do ciclo continuam conforme o plano.

## Pós-mortem

- **Data de conclusão:** —
- **Desvios:** —
- **Lições comprovadas:** —
