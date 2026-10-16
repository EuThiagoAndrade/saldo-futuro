# Payloads efetivos — Issues do ciclo 005

> **Ciclo:** `005`
> **Plano:** `005_plan.md`, v1 aprovada em 2026-10-15, integrada pela PR #51
> **Revisão de origem:** `9914a907e91d9487c9ba9543bafff71a7dbf8e5e`
> **Preparado em:** 2026-10-15
> **Situação:** issues A–C criadas e conferidas; aguardando autorização da implementação de A
> **Confirmação humana:** "pode criar as issues." em 2026-10-15

Payloads derivados dos itens A–C do plano integrado. Os corpos abaixo seguem a ordem de campos de `.github/ISSUE_TEMPLATE/chore.yml` (A) e `.github/ISSUE_TEMPLATE/feature_request.yml` (B/C), lidos no ponto de uso. A confirmação autorizou a criação dessas três issues, sem implementação. Os números foram observados no GitHub e as dependências vinculadas conforme autorizado, sem mudança de escopo.

## Unidade A

**Título:** `[CHORE] Medir navegação e estabelecer baseline com dados fictícios`

### Contexto

Após o encerramento do ciclo 004, foi relatada melhora de navegação com a mudança regional da Vercel. Não há baseline quantitativa pós-mudança. O teste HTTP local histórico não mede transições por clique nem latência de produção. Esta unidade entrega o diagnóstico necessário à otimização do ciclo 005.

### Mudanças previstas

Estender o apoio de medição optativa existente, sem otimizar código de produto, para medir navegação por clique com dados fictícios no Supabase local e build de produção. Cobrir carteira vazia e 30 ativos/60 meses fechados, com volumes efetivos acima de 1.000 eventos/posições; registrar rotas, ambiente, revisões, primeira visita/revisita, condições de prefetch/cache e custo por categoria de consulta. Separar clique → feedback, clique → conteúdo pronto e duração de servidor/chamadas Supabase.

Aplicar integralmente o protocolo da seção Estratégia de testes do plano: três rodadas de 20 amostras por par prioritário/volume/condição, cinco aquecimentos nas revisitas, primeiro acesso em contexto novo, ensaios sem atraso e com 50/100 ms adicionais por chamada Supabase. Registrar séries sanitizadas, mediana/p95 e hipóteses em `005_validation_desempenho.md`; identificar candidatos restritos à unidade C. Nenhuma dependência, banco, autenticação ou configuração externa nova.

### Critérios de aceite

- [ ] Protocolo executável por comando documentado, optativo e reproduzível, com cenários/usuários fictícios exclusivos e limpeza inclusive após falha.
- [ ] Baseline identifica revisão/build, ambiente, volumes efetivos, métricas distintas, condições de cache/prefetch e séries/mediana/p95; separa medição local, simulação e relato humano.
- [ ] Cobertura de rotas, condições e repetições conforme o plano; nenhuma resposta errada ou erro é descartado como simples amostra lenta.
- [ ] Relatório identifica caminho sequencial, custo de consultas/sessão, candidatos permitidos e provas de regressão necessárias antes de C, sem remover proteções.
- [ ] Nenhum segredo, cookie, token ou payload financeiro real nos artefatos; nenhuma instrumentação ativa por padrão em produção.
- [ ] Gates documentais e de aplicação pertinentes ao apoio de testes executados conforme o plano, com resultados reais na futura task.

### Dependências e autorizações

Plano aprovado e integrado pela PR #51. A criação desta issue não inicia sua execução: exige autorização individual com o número real da issue. A implementação cria task persistente e usa `chore/issue-N`; uma issue/PR, merge próprio. Sem modo contínuo. G1/G2 preservadas na preparação de cenários e provas; G3 obrigatória; sem migração (G4). Backend estritamente local, sem dados reais ou acesso autenticado de produção.

### Ciclo e plano relacionados

Ciclo 005 — `_project/drafts/005_logo_mobile_desempenho_navegacao/005_plan.md`, v1, item 1 (A), protocolo de desempenho e gates; PR #51 integrada.

<!-- logical_key: EuThiagoAndrade/saldo-futuro + 005 + criar_issues + chore/A_baseline_navegacao + v1@9914a907e91d9487c9ba9543bafff71a7dbf8e5e -->

## Unidade B

**Título:** `[FEATURE] Exibir logo no cabeçalho mobile`

### Contexto

O layout autenticado mostra somente Ocultar valores no header mobile. A marca completa existente já é usada no login e no menu lateral desktop. A unidade B acrescenta a marca ao cabeçalho mobile, conforme o contrato visual atual.

### Escopo

Reutilizar `design-system/assets/logo-saldo-futuro.svg` abaixo de `lg`, à esquerda do header em `src/app/(app)/layout.tsx`, como link para `/`, preservando Ocultar valores à direita. Conservar proporção 4:1, altura mínima de 32 px, proteção de ao menos 1/4 da altura do símbolo e alvo de toque de 44 × 44 px. Reservar dimensões para evitar deslocamento do layout.

Fora: novo asset/marca, alteração dos tokens ou do contrato visual, novas telas, cálculo, sessão, banco e otimização de leitura. Se a marca não couber em 360 px com proteção/controles, registrar prova e parar antes de trocar para o símbolo ou reduzir abaixo do mínimo.

### Critérios de aceite

- [ ] Logo visível abaixo de `lg`, à esquerda, com dimensões/proporção/proteção normativas, link para Início e nome acessível único.
- [ ] Sem overflow, sobreposição, distorção ou compressão dos controles em 360, 390, 768, 1024 e 1280 px; estados visível/oculto conferidos visualmente.
- [ ] Alvo de toque mínimo, foco visível e navegação por teclado funcionais; axe sem violações pertinentes em mobile/desktop com dados fictícios.
- [ ] Desktop, folha Mais e formulário Ocultar valores com/sem JavaScript continuam funcionais; ocultação é aplicada desde o servidor, sem exposição transitória de quantias.
- [ ] Nenhuma edição do asset ou mudança do contrato; gates do plano e evidências reais na futura task.

### Ciclo e plano relacionados

Ciclo 005 — `_project/drafts/005_logo_mobile_desempenho_navegacao/005_plan.md`, v1, item 2 (B); PR #51 integrada; `design-system/DESIGN.md`, seções 4, 7 e 8.

### Dependências, riscos e autorizações

A ([#52](https://github.com/EuThiagoAndrade/saldo-futuro/issues/52)) integrada antes de iniciar B, conforme a sequência aprovada. Implementação depende de autorização individual com o número observado; branch `feature/issue-N`, task persistente e merge próprio. Sem modo contínuo, nova dependência ou migração. G3 obrigatória, somente dados fictícios; proteção, cálculo e isolamento permanecem preservados. A principal restrição visual é a convivência de marca e controle em 360 px.

<!-- logical_key: EuThiagoAndrade/saldo-futuro + 005 + criar_issues + feature/B_logo_mobile + v1@9914a907e91d9487c9ba9543bafff71a7dbf8e5e -->

## Unidade C

**Título:** `[FEATURE] Reduzir espera na navegação preservando leitura coerente`

### Contexto

Esta unidade aplica somente otimizações sustentadas pela baseline de A. Consultas sequenciais existentes são candidatas a medir; a redação do plano não comprova que sejam o gargalo restante. Melhora de feedback visual e disponibilidade do conteúdo são resultados diferentes.

### Escopo

Implementar o menor paralelismo seguro entre consultas independentes em `marcaCarteira`, `src/lib/telas/leituras.ts` e `leitura-benchmarks.ts`, conforme o diagnóstico. Preservar a sequência de fases D13: marca inicial completa → todos os insumos → marca final completa, contagens exatas, paginação total/ordem, repetição integral até três tentativas e erro recuperável. Provar também interleavings entre subconsultas da própria marca; `Promise.all` não é snapshot transacional.

Avaliar feedback de carregamento e prefetch nos links/rotas existentes; alterar somente com benefício medido, sem números provisórios, respeitando acessibilidade, movimento reduzido, ocultação SSR e atualização após escrita. Comparar baseline/candidata alternadamente com o mesmo protocolo, ambiente e carga de A.

Fora: regra financeira, schema/RPC/índice/migração, mudanças em autenticação/autorização, remoção de validações, cache persistente/privado compartilhado, dependência nova, região/infraestrutura e nova rota/parâmetro público. Ganho insuficiente exige Parado e decisão humana, sem ampliar a solução.

### Critérios de aceite

- [ ] Cada alteração rastreia hipótese/custo medido em A; candidatos sem benefício são descartados com evidência.
- [ ] Nas três rodadas, reduzir a mediana clique → conteúdo em pelo menos 20% e 50 ms em ao menos um par prioritário com 30 ativos/60 meses e atraso controlado de 50 ms/chamada; reportar também ensaio sem atraso, sem alegar ganho de produção.
- [ ] Nos pares/condições medidos, nenhuma regressão de mediana/p95 superior a `max(20 ms, 10% da baseline)`; preservar o limiar D9 de 1 s. Paralelismo não aumenta chamadas por composição/tentativa; prefetch não aumenta chamadas por sessão equivalente.
- [ ] Se houver novo feedback, p95 até 200 ms no ensaio de 100 ms/chamada para transições cujo conteúdo leva mais de 200 ms, sem violar o aceite de conteúdo. Se não ajudar, preservar e justificar. Feedback isolado não substitui ganho de conteúdo.
- [ ] Resultados e estados conferem com baseline/casos existentes. Provar completude acima de 1.000 linhas, erros de página/contagem, alterações entre páginas/subconsultas/fases, reabertura/refechamento e cobertura/valores de benchmark; após três tentativas divergentes, erro recuperável.
- [ ] Atualização após criar/estornar, transferir/corrigir, fechar/reabrir e alterar benchmark fictício, inclusive histórico/prefetch; períodos, N/D, erros e ocultação preservados.
- [ ] Isolamento A/B/admin, restrição de admin, ausência de sessão, logout/troca de conta e prefetch provados sem reapresentar dados anteriores; sem cache privado compartilhado.
- [ ] Relatório antes/depois com séries, mediana/p95, causas, chamadas e limites; gates completos do plano e evidências reais na futura task.

### Ciclo e plano relacionados

Ciclo 005 — `_project/drafts/005_logo_mobile_desempenho_navegacao/005_plan.md`, v1, item 3 (C), protocolo de desempenho/barreiras/gates; PR #51 integrada; D2, D8 e D13 do plano executado 004.

### Dependências, riscos e autorizações

A ([#52](https://github.com/EuThiagoAndrade/saldo-futuro/issues/52)) e B ([#53](https://github.com/EuThiagoAndrade/saldo-futuro/issues/53)) integradas; candidatos sustentados pelo diagnóstico A antes de implementar. Exige autorização individual da issue real, branch `feature/issue-N`, task persistente e aprovação de merge própria. G1/G2 exigem provas de regressão de insumos e isolamento; G3 somente fixtures locais fictícias; G4 sem migrações. Sem modo contínuo. Caso a solução exija banco, cache persistente, nova dependência ou mudança financeira/de acesso, parar para revisão e aprovação do plano. Produção depende da autorização específica do ciclo e não integra o diagnóstico local desta issue.

<!-- logical_key: EuThiagoAndrade/saldo-futuro + 005 + criar_issues + feature/C_otimizar_navegacao + v1@9914a907e91d9487c9ba9543bafff71a7dbf8e5e -->

## Criação confirmada e resultado

Pergunta apresentada: confirma a criação das três issues A–C com os títulos e corpos acima? Resposta humana em 2026-10-15: "pode criar as issues." Autoriza somente a criação e os vínculos de rastreabilidade; implementação e merge continuam sujeitos aos pontos próprios.

Antes de cada criação, todas as issues retornadas pela consulta `gh issue list --state all --limit 1000` foram conferidas por título e `logical_key`; o retorno ficou abaixo do limite, sem correspondência existente. Cada issue foi relida por `gh issue view`, comprovando título, corpo efetivo e estado `OPEN`. Os hashes abaixo usam o corpo publicado em UTF-8/LF, com uma quebra de linha ao final.

| Unidade | Issue | Resultado | SHA-256 do corpo efetivo |
| :-- | :-- | :-- | :-- |
| A | [#52](https://github.com/EuThiagoAndrade/saldo-futuro/issues/52) | `executed` | `bcc0d747fb23752f7d20a5b422e9e374407c1df008fa681777ec143fdfddc20c` |
| B | [#53](https://github.com/EuThiagoAndrade/saldo-futuro/issues/53) | `executed` | `48d11f18d3eddeea8854630f8dba59f1025bec00e910eb0078bf7e06bb5f40dc` |
| C | [#54](https://github.com/EuThiagoAndrade/saldo-futuro/issues/54) | `executed` | `a7521fb93e2e345c006cef7a4c8d54f3c026205f374cd3dac49e83b22d76cfa0` |

Próximo ponto: autorizar individualmente a implementação da issue #52. Nenhuma branch ou task de implementação foi criada neste workflow. O handoff corrente está na seção Criação das issues de `005_plan.md`.
