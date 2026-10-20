# Plano de Implementação — Legibilidade do patrimônio e dos cartões de resumo

> **Ciclo:** `008`
> **Status:** `Em Execução`
> **Versão:** `v3`
> **Data de criação:** 2026-10-20
> **Última atualização:** 2026-10-20
> **Tipo:** `fix`
> **Prioridade:** `P2`
> **Nível:** `leve`
> **Autorização inicial:** "confirmo o nível leve e autorizo o plano do ciclo 008 (BL-001 e BL-002)" em 2026-10-20
> **Modo contínuo:** `—`
> **Revisão formal:** `Concluída` (rodada 3 sobre a `v3`); rodada 2 sobre a `v2`, rodada 1 sobre a `v1`
> **Veredito da revisão:** `APTO COM RESSALVAS` (rodada 3, `v3`); `REQUER NOVA RODADA` nas rodadas 2 (`v2`) e 1 (`v1`)
> **Aprovação humana pós-revisão:** `Aprovada em 2026-10-20`
> **handoff_schema_version:** `2`

## Problema e contexto

O responsável confirmou o nível leve e a elaboração de um plano conjunto para BL-001 e BL-002. Na tela Início, rótulos monetários arredondados independentemente do passo do eixo podem identificar marcas diferentes com o mesmo texto ou sugerir um cruzamento de valor que não ocorreu. Na mesma tela, os quatro cartões de resumo passam a quatro colunas em 1024 px, justamente quando o menu lateral passa a consumir 240 px; quantias sem quebra podem ultrapassar o cartão.

O escopo combina duas correções de apresentação na mesma tela. Não modifica cálculo financeiro, schema, autenticação, RLS ou regras de governança. O nível leve confirmado é preservado; a execução será interrompida para nova triagem se exigir mudança nessas áreas. A trilha curta não será usada: a confirmação recebida define um ciclo leve conjunto e permite planejar a política de precisão visual ainda não detalhada nas referências.

Alternativas consideradas: limitar a correção a mais uma casa decimal fixa não resolve escalas arbitrariamente estreitas; adiar quatro colunas para `xl` mantém uma composição superior ao limite de três do DESIGN.md; adicionar biblioteca de gráficos contraria a solução existente da ADR-005. A direção proposta é coordenar a formatação com as marcas do eixo e manter uma grade conservadora de cartões com validação de conteúdo realista fictício.

## Objetivo

Tornar inequívoca a leitura da evolução patrimonial e manter títulos e valores integralmente legíveis nos cartões de resumo, em celular e desktop, preservando valores consolidados, preferência de ocultação, acessibilidade e renderização no servidor.

## Origem no backlog

Snapshot da fila canônica `chore/backlog`, no worktree externo registrado `C:/Programas/saldo-futuro-backlog`, com o mesmo Git comum do checkout principal. Fonte: `_project/backlog.md` no commit `7c78d1dff5cbd41358e64b45933c685c033020e1`, publicado e presente em `main` local e em `origin/main` conferida por `git ls-remote` em 2026-10-20.

| ID e título | Síntese e parcela selecionada | Restante no recorte |
| :-- | :-- | :-- |
| BL-001 — Precisão de escala e rótulos do eixo no gráfico de evolução patrimonial | Necessidade integral: coerência entre marcas, texto do eixo monetário e posição da curva de evolução patrimonial, com precisão compatível com o intervalo exibido | Nenhum previsto |
| BL-002 — Responsividade e contenção de valores monetários nos cartões de resumo | Necessidade integral: títulos e quantias contidos e legíveis nos cartões do Início, inclusive na transição para menu lateral | Nenhum previsto |

Destino em preparação: ciclo 008. Ambos os itens permanecem `Disponível`; a seleção não altera a fila. Somente depois da integração comprovada do destino em main será registrado o retorno por `ciclo 008`, com a cobertura efetiva e eventual Restante, pelo workflow `gerenciar_backlog`. A publicação desse retorno exige autorização separada.

## Contexto e baseline

- Revisão de origem: `7c78d1dff5cbd41358e64b45933c685c033020e1`; branch local `main` limpa antes deste rascunho. Nenhum plano 008 preexistente; próximo ciclo declarado: `008`.
- Consulta via `gh pr list --state open` e `gh issue list --state open`: nenhuma PR ou issue aberta no momento da preparação. Nenhum número de issue ou PR é antecipado neste documento.
- `src/components/graficos/escala.ts`: `marcas` usa passos de 1, 2 ou 5 vezes uma potência de dez; `faixaDe` admite domínio sem zero e lacunas; `escalar` posiciona os valores.
- `src/lib/apresentacao/valores.ts`: `textoEixoDinheiro` abrevia reais em mil/mi com no máximo uma casa decimal, sem receber o contexto das marcas.
- `src/components/graficos/graficos.tsx`: `GraficoLinha` e `EixoY` compartilham marcas para a geometria, mas o formatador recebe somente cada valor. SVG e tabela equivalente são renderizados no servidor.
- `src/app/(app)/benchmarks/comparacao/page.tsx`: também consome `GraficoLinha`, com `rotularY={indice}`; sua assinatura e apresentação de índices integram a regressão obrigatória.
- `src/app/(app)/page.tsx`: eixo patrimonial recebe reais apenas para desenho; tabela recebe os centavos consolidados. A grade superior usa `md:grid-cols-2 lg:grid-cols-4`; `Cartao` também é usado nos resultados do período.
- `src/components/valores.tsx`: `ConteudoDinheiro` mantém a quantia sem quebra. `DESIGN.md` §§3–4, 6.2 e 6.5 exige formato integral fora do eixo, tokens tipográficos, uma coluna no celular, até duas em `md`, até três em `lg` e nenhuma rolagem horizontal da página.

## Escopo

### Dentro do escopo

- Precisão dos rótulos do eixo monetário da evolução patrimonial determinada pelo conjunto de marcas/passo efetivamente desenhado.
- Mesma escala para grade e curva; distinção entre marcas monetárias, inclusive em faixas estreitas e nas transições mil/mi.
- Contenção dos títulos, quantias e percentuais dos cartões do Início com uma coluna abaixo de `md`, duas a partir de `md` e preenchimento lateral local de `space-1` no celular e `space-3` a partir de `md`, preservando preenchimento vertical e fonte; incluir barra de rolagem clássica na validação.
- Acomodação dos rótulos monetários na geometria/margem do eixo; regressão de todos os consumidores compartilhados, incluindo comparação de benchmarks.
- Testes com dados fictícios, verificação visual e documentação viva no encerramento.

### Fora do escopo

- BL-003 a BL-012; filtros de período, distribuição por ativo, botões, novas telas ou catálogo de benchmarks.
- Alterar quantias, consolidação, rentabilidade, precisão financeira, seleção de períodos ou origem dos dados; alterar a KB-004 como regra financeira.
- Forçar zero como base em todos os gráficos, redesenhar todos os gráficos ou adicionar interação, biblioteca ou JavaScript de gráficos no cliente.
- Alterar tokens ou contrato visual de `design-system/DESIGN.md`, navegação, autenticação, RLS, banco, migrações, produção ou deploy manual.
- Truncar ou abreviar quantias dos cartões, ocultar transbordamento como solução, ou substituir dados ausentes por zero.

## Decisões e autoridades

Aplicam-se `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, o template `.agent/templates/plano_implementacao.md`, ADR-004, ADR-005, KB-003 e `design-system/DESIGN.md`. A KB-004 é referência das regras existentes, preservadas. Sugestões do backlog são alternativas, não decisões aprovadas de implementação.

A formatação monetária do eixo será coordenada com as marcas efetivas, preservando o valor indicado por cada marca. Exemplo exclusivamente fictício de aceite: marcas de R$ 1.200.000 e R$ 1.220.000 podem ser rotuladas como `R$ 1,20 mi` e `R$ 1,22 mi`; um ponto de R$ 1.219.000 fica abaixo da segunda marca. A tabela mantém valores integrais em centavos. O domínio poderá continuar sem zero; não se modifica dado para ajustar a aparência.

A unidade monetária será única por eixo, escolhida pelo maior valor absoluto das marcas: `mi` a partir de um milhão, `mil` a partir de mil e reais abaixo disso. A precisão comum deve representar todas as marcas sem arredondamento enganoso, considerando também marcas de zero, negativas e transições; não basta torná-las diferentes. Por exemplo, um eixo que atravessa um milhão mantém `mi` em todas as marcas, inclusive `R$ 0,99998 mi` e `R$ 1,00002 mi`. A margem monetária deve acomodar os textos resultantes, inclusive o sinal, sem reduzir a fonte. Preferir parametrizar o espaço apenas no gráfico monetário; se a geometria compartilhada mudar, validar também barras e índices no Início e na comparação de benchmarks. Os rótulos de pior caso estão na estratégia de testes.

Para os cartões, manter a quantia em uma linha, incluindo o espaço não separável entre `R$` e o número; manter `value-lg` (24/32 px, peso 600) e o componente monetário global. A proposta local é `px-1 py-4 md:px-3` em `Cartao`, com uma coluna abaixo de `md` e duas a partir de `md`. São tokens existentes; o DESIGN.md não fixa preenchimento mínimo de cartões. Não se reduz o domínio monetário suportado nem se cria um teto de negócio.

Viabilidade geométrica medida nesta correção em reprodução estática, sem implementar a aplicação: com `md:px-3`, a maior quantia negativa fictícia mede 316,5625 px na IBM Plex Sans 600 de 24 px. Em janelas de 768 e 1024 px, os cartões têm 328 px úteis sem barra e 320,5 px com barra clássica de 15 px. Em largura útil de layout de 360 px, o cartão tem 318 px úteis. Essas medições não substituem a verificação na aplicação após implementação. Registrar sempre `window.innerWidth`, `document.documentElement.clientWidth` e sua diferença; pontos de quebra não devem ser inferidos apenas pela largura útil.

O suporte mínimo considerado é de 360 px CSS úteis para layout, medidos por `document.documentElement.clientWidth`, sem contar a barra vertical. Testar 360 px sem barra que ocupe largura e, com barra clássica de 15 px, janela de 375 px para obter os mesmos 360 px úteis. Janela de 360 px com barra clássica deixa 345 px úteis e está abaixo desse mínimo; essa condição fica explicitamente fora da garantia de contenção do extremo monetário nesta matriz. O teste de zoom será feito sobre uma área de conteúdo do navegador de 1280 px a 100%, passando a 200%, aproximadamente 640 px CSS antes do desconto de eventual barra, com ambas as larguras registradas. Não se exige 180 px CSS. Esta delimitação não altera limites financeiros nem o DESIGN.md.

Para a resolução do eixo, incluir em `escala.ts` uma proteção de apresentação contra marcas repetidas por `toPrecision(12)`. Para módulo máximo A > 0, a resolução decimal de referência é Q = 10^(floor(log10(A)) − 11). Se o passo proposto for inferior a Q ou as marcas arredondadas não forem estritamente crescentes, ampliar o passo na sequência existente 1/2/5 × 10ⁿ e recalcular o domínio até obter marcas finitas e distintas. Curva e grade usam esse domínio ampliado. Em torno de 9 × 10¹³ reais, Q é R$ 100: uma faixa estreita de R$ 20 deve ampliar a escala de apresentação em vez de produzir marcas iguais. Não se promete resolução de centavos no desenho nessa magnitude; a tabela permanece exata em centavos. Os testes extremos incluem faixas largas e estreitas, positivas e negativas, sem a expressão indefinida "quando representáveis".

Reservar no mínimo 160 unidades horizontais entre o início e o fim da área da curva no viewBox de 360 unidades. Mantida a margem direita atual de 56, a margem esquerda pode chegar a 144; conferir também o afastamento do texto em relação à grade. O rótulo extremo de referência `−R$ 90.071.992,5474 mi` mede cerca de 126 unidades na fonte atual do eixo (rodada 2), deixando espaço para esse mínimo. Medir todos os textos gerados; não reduzir a curva abaixo de 160 nem a fonte para acomodá-los. Se outro caso ultrapassar esse orçamento, registrar a evidência para decisão antes de alterar esse critério.

### Pontos de aprovação

| Ponto | Precondição | Cobre | Não cobre | Conferir |
| :-- | :-- | :-- | :-- | :-- |
| Autorizar plano — recebido | Confirmação humana do leve e de BL-001/BL-002 | Este rascunho e reserva do ciclo 008 | Revisão automática, aprovação, issues, implementação e publicação | Autorização inicial e origem no backlog |
| Aprovar plano — `aprovo o plano do ciclo 008` | Veredito apto e manifestação humana posterior | Aprovação do plano, criação das duas issues após apresentação e confirmação do payload, e encerramento após entregas integradas | Implementação e qualquer merge | Veredito, ressalvas e payload das issues |
| Autorizar implementação — `autorizo a implementação da issue #N` | Plano aprovado, issue real e escopo conferido | Branch, task, implementação, validações e PR daquela issue | Outra issue, produção ou merge | Issue e plano; G1–G4 |
| Aprovar merge — `aprovo o merge da PR #N` | PR publicada, diff revisável e checks verdes | Squash da PR específica | Outras PRs ou ações externas | Checks, diff, privacidade e, na última PR, encerramento prospectivo |

Revisão formal é etapa separada, acionada por `revise o plano do ciclo 008`; não constitui um sexto tipo de ponto de aprovação. Criar issues é uma operação coberta pela aprovação do plano, condicionada à apresentação e confirmação do payload conforme a barreira de `criar_issues`; não é tipo adicional de aprovação. Ações externas e verificação em produção não são necessárias neste escopo.

Não há modo contínuo autorizado. Cada saída respeita sua situação; este workflow termina em revisão pendente. Dúvida material de escopo, cálculo, privacidade, precondição não verificável ou necessidade de nova autoridade interrompe a execução em `Parado`.

## Barreiras de domínio

| Barreira | Aplica-se? | Como o ciclo a atende ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Apenas apresentação de dados existentes; nenhuma regra ou valor financeiro é alterado. Testes conferem que eixo e tabela preservam os dados de entrada; se exigir cálculo financeiro, retriar |
| G2 — isolamento por RLS | Não | Nenhuma mudança em sessão, autorização, consultas, políticas, funções de banco ou acesso a dados |
| G3 — privacidade de dados | Sim | Somente cenários sintéticos; nenhum acesso a `local/` financeiro, captura autenticada real ou dado pessoal em testes, evidências, issue, PR ou commit; respeitar ocultação já no servidor |
| G4 — migrações só acrescentam | Não | Nenhuma migração planejada; migrações existentes permanecem intactas |

## Estratégia de testes

Na redação: gates mínimos de governança (`node --test scripts/validate-governance.test.mjs`, `node scripts/validate-governance.mjs`, `git diff --check` e `git status --short`). Resultados reais da execução ficarão na task de cada issue; este plano não antecipa resultados de aplicação.

Na implementação de cada entrega: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:e2e`, além dos gates mínimos. A execução dos cenários autenticados de apresentação usa Supabase local com dados fictícios e as variáveis descritas no README; não usa produção. Não há alteração de banco/autenticação que exija novos testes de isolamento ou `supabase test db` por escopo.

Para BL-001, adicionar casos unitários de marcas/formatador e renderização que comprovem correspondência entre texto e coordenadas: faixa fictícia estreita em milhões, milhares e suas transições, centavos, zero, negativos, série constante, ponto único e lacunas. Rótulos de marcas distintas devem ser distintos quando visíveis; o caso oculto deve mascarar todas as quantias. Preservar tabela exata, `N/D` como lacuna, base 100 e barras percentuais no Início e base 100 na comparação de benchmarks (`src/app/(app)/benchmarks/comparacao/page.tsx`, `rotularY={indice}`). Conferir assinatura do formatador, margens, rótulos de índice, linhas contínuas/tracejadas e tabela nas duas páginas. Não limitar o teste a comparar snapshots do código novo.

Conjunto mínimo fictício de estresse do eixo: `R$ 999,98 mil`, `−R$ 999,98 mil`, `R$ 1,0005 mi`, `R$ 0,99998 mi` e suas versões negativas, além de marcas de centavos próximas de zero. Incluir faixas largas próximas aos extremos de ±90.071.992.547.409,91 reais e a faixa estreita positiva de 90.071.992.547.389,91 a 90.071.992.547.409,91 reais, com sua versão negativa: o passo deve respeitar Q e as marcas devem ser finitas e estritamente crescentes após arredondamento. Verificar cobertura do domínio, ordenação dos pontos e tabela exata; não comparar centavos da tabela a um desenho que já recebe reais em ponto flutuante. Medir todos os rótulos gerados contra o viewBox e a curva em 360 px úteis e no desktop: nenhum corte ou sobreposição, e área horizontal da curva de pelo menos 160 unidades. Registrar a margem resultante e regressões dos eixos não monetários.

Para BL-002, executar duas matrizes a 100%: sem barra que ocupe largura, janelas de 360, 390, 768, 776, 1023, 1024, 1032, 1040, 1100, 1200, 1280 e 1440 px; com barra clássica, as mesmas larguras a partir de 390 e mais 375 px (360 úteis com barra de 15 px). Usar conteúdo mais alto que a janela, alturas de retrato/paisagem e Chromium iniciado com `ignoreDefaultArgs: ["--hide-scrollbars"]` na matriz clássica. Verificar que a barra efetivamente ocupa largura: registrar e exigir diferença positiva entre `innerWidth` e `clientWidth`; se a configuração não produzir barra clássica, o teste dessa condição não passou e precisa de execução em ambiente que a produza. Medir toda a faixa de 768–776 e 1024–1032 px, em passos de 1 px, na reprodução estática ou no teste da aplicação. Separadamente, verificar zoom real de 200% sobre 1280 px a 100%, registrando as duas larguras; emulação pode complementar, mas não substituir o zoom. Não multiplicar toda a matriz por zoom de 200%.

Em cada largura, usar zero, quantias positivas e negativas, `R$ 1.234.567,89`, `R$ 999.999.999,99` e o limite fictício de ±9.007.199.254.740.991 centavos (`±R$ 90.071.992.547.409,91`), sem teto adicional. Preservar quantia inteira em uma linha, com espaço não separável, duas casas e fonte `value-lg`; títulos e detalhes podem quebrar normalmente. Conferir também percentuais, `N/D`, estado vazio e valores ocultos. Medir conteúdo e valores contra as bordas internas dos cartões e verificar ausência de rolagem horizontal da página; carregar as fontes reais antes das medições. Registrar capturas sanitizadas e medidas na task; não considerar apenas mudança de classe CSS como prova.

## Itens de implementação

### Item 1 — BL-001: eixo monetário coerente na evolução patrimonial

**Contexto:** marcas geometricamente corretas podem ter rótulos insuficientemente precisos pela abreviação fixa de uma casa decimal.

**Ação técnica:** levar o contexto das marcas efetivas ao formatador monetário, selecionando unidade única por eixo e precisão comum que represente as marcas. Proteger a geração de marcas em `escala.ts` contra colapso na resolução decimal conforme a regra Q; ampliar apenas o domínio de apresentação quando necessário. Acomodar rótulos com margem monetária apropriada e curva com largura mínima de 160 unidades. Preservar demais formatadores e validar consumidores do Início e da comparação de benchmarks. Nenhuma alteração em dados financeiros.

**Critérios de aceite:**

- [x] Marcas monetárias distintas têm textos distintos e numericamente coerentes com a posição desenhada, inclusive no exemplo fictício de 1,20/1,22 mi e nos limites mil/mi.
- [x] Faixas extremas largas e estreitas geram marcas finitas, estritamente crescentes e domínio que cobre os pontos, sem duplicação por `toPrecision(12)`; curva com largura horizontal mínima de 160 unidades em viewBox de 360.
- [x] O ponto fictício abaixo de uma marca permanece abaixo da linha correspondente; curva e grade usam o mesmo domínio.
- [x] Rótulos completos, incluindo o conjunto de estresse e as transições com unidade única, cabem sem corte ou sobreposição na largura de 360 px e no cartão desktop com menu lateral; margem aferida com a fonte carregada.
- [x] Tabela equivalente mantém centavos originais; ocultação e lacunas continuam corretas.
- [x] Testes de regressão cobrem base 100 e rentabilidade no Início e base 100 da carteira contra benchmark na comparação, preservando formato de índices, assinatura de `rotularY`, margens funcionais e distinção das séries.

### Item 2 — BL-002: cartões de resumo sem transbordamento

**Contexto:** quatro colunas simultâneas à entrada do menu lateral comprimem cartões com texto monetário sem quebra.

**Ação técnica:** usar uma coluna abaixo de `md` e duas a partir de `md`, removendo quatro colunas em `lg`. Ajustar localmente `Cartao` para `px-1 py-4 md:px-3`, preservando fonte, quantia sem quebra e componente monetário global. Validar com e sem barra clássica também os cartões do período e o estado vazio que reutilizam `Cartao`; restringir qualquer ajuste compartilhado ao necessário para a correção.

**Critérios de aceite:**

- [ ] Títulos, quantias até ambos os extremos de centavos seguros e percentuais ficam integralmente legíveis e contidos nas duas matrizes definidas, incluindo mínimo de 360 px úteis e as faixas 768–776 e 1024–1032 px com barra clássica, e no teste separado de zoom de 200% sobre 1280 px.
- [ ] Quantias mantêm formato pt-BR, duas casas, sinal correto, espaço não separável e conteúdo integral em uma linha; não há quebra, reticências, abreviação, corte ou teto monetário novo.
- [ ] Nenhuma rolagem horizontal da página; a grade respeita as colunas máximas e os tokens do DESIGN.md.
- [ ] Não há redução arbitrária de fonte, mudança de contrato visual, dependência ou JavaScript de medição no cliente.
- [ ] Estados vazio, `N/D`, valores ocultos e os cartões de resultado do período não regridem.

## Arquivos afetados

Previsão, a confirmar pelo menor diff em cada issue:

- `src/lib/apresentacao/valores.ts`, `src/components/graficos/graficos.tsx` e `src/components/graficos/escala.ts`: eixo monetário, proteção da resolução das marcas e integração.
- `src/app/(app)/page.tsx`: formatador da evolução patrimonial e composição local dos cartões.
- Testes próximos aos módulos existentes de apresentação/gráficos e `tests/e2e/inicio.spec.ts`: casos sintéticos e medidas de layout.
- Testes da comparação de benchmarks: regressão do consumidor de `GraficoLinha` em `src/app/(app)/benchmarks/comparacao/page.tsx`; a página é alvo de verificação, sem alteração funcional planejada.
- `_project/cycles.md`, este plano e tasks das issues em `_project/drafts/008_legibilidade_patrimonio_resumo/`.
- No encerramento, `_project/knowledge/KB-003_visao_produto_arquitetura.md` e movimentação do ciclo para `executed/` pelo workflow `atualizar_docs`.

O componente monetário global e o design system são referências preservadas; não estão previstos como arquivos de implementação. A fila do backlog tem atualização posterior e separada.

## Decomposição em issues e PRs

| Ordem | Issue proposta (a criar após aprovação e conferência do payload) | Escopo | PR |
| :-- | :-- | :-- | :-- |
| 1 | `[FIX] Alinhar precisão dos rótulos à escala da evolução patrimonial` | Item 1 / BL-001 e seus testes | Primeira PR inclui plano, reserva em cycles e task da issue |
| 2 | `[FIX] Conter valores nos cartões de resumo em larguras intermediárias` | Item 2 / BL-002 e seus testes | Última PR inclui documentação viva e encerramento prospectivo |

Cada issue herda contexto, ação e critérios do item correspondente, sem ampliar o recorte. Uma branch `fix/issue-N`, uma task `008_task_issue-N.md` e uma PR por issue; commits `fix(issue-N): ...`. Os números serão os observados no GitHub. Não haverá PR documental própria do plano no ciclo leve. A task da última issue terá `## Encerramento`.

## Dependências e blockers

Nenhuma dependência externa nova. IDs de origem já existem em main. Implementar a segunda entrega após integrar a primeira evita conflito na página compartilhada e mantém o encerramento na última PR. Após a parada da rodada 2 por ausência de redução de bloqueadores, o responsável respondeu com "corrija o plano do ciclo 008", autorizando a terceira correção proposta na pergunta registrada. Esta v3 responde a R2-1 e R2-2 e aguarda revisão 3, sem modo contínuo. Aprovação de plano, criação das issues e autorizações de implementação continuam pendentes.

## Riscos, suposições e rollback

- Mais precisão pode aumentar rótulos além da margem SVG; validar o espaço no celular e ajustar apenas o eixo necessário.
- Mudanças em componentes compartilhados podem atingir base 100, barras ou outros cartões; cobrir consumidores existentes e limitar o diff.
- A folga teórica para a maior quantia negativa em 360 px é de apenas 1,4 px com preenchimento lateral de 4 px. Confirmar no navegador com fonte carregada, sem arredondar medições para esconder transbordamento. Se a contenção não se confirmar, registrar a evidência antes de qualquer alteração de contrato ou domínio; não reduzir o limite monetário silenciosamente.
- A nova composição pode aumentar a altura do resumo; aceita-se rolagem vertical natural em favor da leitura integral.
- Hipótese: mudança estritamente de apresentação, sem nova regra financeira. Alteração dessa hipótese exige nova triagem.
- Rollback: reverter a PR correspondente por nova PR com checks e aprovação de merge; nenhuma alteração de dados requer reversão.

## Sequência recomendada

1. Revisar formalmente este rascunho, registrar rodada/veredito e tratar achados pelo fluxo autorizado.
2. Obter aprovação humana posterior ao veredito apto; apresentar/conferir payload e criar as duas issues conforme `criar_issues`.
3. Após autorização da primeira issue, criar branch/task, implementar BL-001, executar gates e publicar primeira PR com o plano.
4. Obter aprovação específica do merge com checks verdes e integrar a primeira PR.
5. Após autorização da segunda issue, implementar BL-002, validar regressões conjuntas e consolidar documentação viva.
6. Preparar na última PR o encerramento prospectivo: plano `Concluído`, tasks `Concluída`, pasta em `executed/`, cycles atualizado e bloco prospectivo `Concluído`. Até o merge, mostrar situação efetiva `Aguardando merge`.
7. Após aprovação específica e merge da última PR, conferir integração e checks. Somente após integração comprovada do destino, registrar retorno na fila canônica para BL-001/BL-002 conforme cobertura real; publicar esse retorno separadamente quando autorizado.

## Referências

- `.agent/ai_behavior.md`; `_project/README.md`; `_project/cycles.md`.
- `.agent/workflows/rascunhar_plano.md`; `.agent/templates/plano_implementacao.md`.
- `.agent/workflows/revisar_plano.md`, `criar_issues.md`, `implementar_issue.md`, `atualizar_docs.md` e `gerenciar_backlog.md` (a ler no ponto de uso).
- `_project/backlog.md` em `7c78d1dff5cbd41358e64b45933c685c033020e1`, BL-001 e BL-002.
- `_project/decisions/ADR-004_governanca_proporcional_niveis.md`; `_project/decisions/ADR-005_graficos_svg_proprio.md`.
- `_project/knowledge/KB-003_visao_produto_arquitetura.md`; `design-system/DESIGN.md`.
- Código e testes citados no baseline e na estratégia de testes.

## Rastreabilidade

| Campo | Valor |
| :-- | :-- |
| Issue(s) | [#88 — BL-001](https://github.com/EuThiagoAndrade/saldo-futuro/issues/88) e [#89 — BL-002](https://github.com/EuThiagoAndrade/saldo-futuro/issues/89), abertas e conferidas |
| PR(s) | [#90 — issue #88](https://github.com/EuThiagoAndrade/saldo-futuro/pull/90), aberta |
| Branch(es) | `fix/issue-88` |
| Destino após conclusão | `_project/executed/008_legibilidade_patrimonio_resumo/008_plan.md` |

## Aprovação e preparação das issues

Em 2026-10-20, após o veredito `APTO COM RESSALVAS` da rodada 3 e a apresentação da ressalva nesta conversa, o responsável declarou: "aprovo o plano do ciclo 008". Aprovação registrada para a v3, incluindo a escolha descrita em R3-1: domínio monetário integral com preenchimento lateral de 4 px no celular. A issue do Item 2 deverá registrar capturas com valores comuns em 360 px úteis, além dos cenários extremos. Corpo técnico aprovado e pareceres preservados; esta mudança registra estado e prepara publicação, sem nova versão técnica.

O ciclo permanece em Planejamento até iniciar a primeira entrega autorizada. A aprovação não autoriza implementação nem merge. Modo contínuo permanece `—`.

Payloads abaixo preparados na ordem do Issue Form `.github/ISSUE_TEMPLATE/bug_report.yml`, lido junto ao template do plano e ao workflow `.agent/workflows/criar_issues.md`. A barreira do workflow exige "Sem modo contínuo, apresentar o payload e obter a confirmação do responsável antes de criar". Após apresentação dos textos, o responsável respondeu "Aprovado!" em 2026-10-20, confirmando a criação das duas issues. Consultas por título em todos os estados, antes de cada criação, não encontraram correspondente. Publicadas via `gh issue create --body-file` e relidas com `gh issue view`: títulos e corpos conferem integralmente com os payloads abaixo, e ambas estão abertas.

| Unidade | Issue observada | Chave lógica |
| :-- | :-- | :-- |
| Item 1 / BL-001 | [#88](https://github.com/EuThiagoAndrade/saldo-futuro/issues/88) | `EuThiagoAndrade/saldo-futuro + 008 + criar_issues + fix/BL-001 + v3` |
| Item 2 / BL-002 | [#89](https://github.com/EuThiagoAndrade/saldo-futuro/issues/89) | `EuThiagoAndrade/saldo-futuro + 008 + criar_issues + fix/BL-002 + v3` |

Próxima unidade: #88. A #89 será implementada após a integração da #88 e autorização própria. Nenhuma branch de implementação ou task foi criada nesta etapa; os números em `fix/issue-N` e `008_task_issue-N.md` serão 88 e 89, respectivamente.

### Payload 1 — BL-001

**Título:** `[FIX] Alinhar precisão dos rótulos à escala da evolução patrimonial`

**Problema observado**

O eixo monetário da evolução patrimonial do Início abrevia marcas com uma casa decimal independentemente do passo, podendo identificar marcas distintas com o mesmo texto e sugerir cruzamentos inexistentes. Nos extremos, o arredondamento `toPrecision(12)` da escala também pode gerar marcas duplicadas.

**Como reproduzir**

1. Usar somente dados fictícios no ambiente local.
2. Exibir evolução com faixa de R$ 1.200.000 a R$ 1.260.000: as marcas de passo R$ 20.000 recebem rótulos repetidos com uma casa decimal.
3. Exercitar a escala com faixa fictícia de R$ 90.071.992.547.389,91 a R$ 90.071.992.547.409,91 e sua versão negativa; conferir colapso de marcas no arredondamento atual.

**Comportamento esperado**

Entregar integralmente o Item 1 e a estratégia de testes da v3 aprovada do ciclo 008, conforme ADR-005 e DESIGN.md. Usar unidade única por eixo e precisão comum coerente com as marcas; proteger a escala pela resolução Q e ampliar o domínio de apresentação quando necessário, sem alterar dados financeiros. Curva e grade devem compartilhar domínio; marcas finitas e estritamente crescentes. Acomodar todos os rótulos sem corte ou sobreposição, mantendo pelo menos 160 unidades horizontais de curva no viewBox de 360. Preservar tabela exata em centavos, ocultação no servidor e lacunas N/D. Validar base 100/rentabilidade do Início e base 100 na comparação de benchmarks, preservando `rotularY={indice}` e distinção das séries. Cobrir faixas estreitas, transições, negativos, centavos, extremos, série constante e ponto único conforme plano.

**Impacto e evidências**

BL-001 e rodadas 1–3 do plano documentam a incoerência e a viabilidade da correção; medições estáticas não equivalem a e2e da aplicação. G1/G2/G4 não se aplicam; G3 aplicável, com dados exclusivamente fictícios. Executar gates de governança, lint, tipos, testes, build e e2e definidos no plano; registrar evidências reais na task. Primeira PR inclui plano, cycles e task. Branch `fix/issue-N`, task `008_task_issue-N.md`, uma PR para esta issue. Implementação depende de autorização específica depois da criação.

**Trilha**

Normal (ciclo com plano).

**Elegibilidade da trilha curta**

Não se aplica.

**Ciclo e plano relacionados**

Ciclo 008 (leve), BL-001; `_project/drafts/008_legibilidade_patrimonio_resumo/008_plan.md`, v3 aprovada em 2026-10-20, Item 1 e estratégia de testes. No leve, o plano acompanha a primeira PR; seu caminho futuro é `_project/executed/008_legibilidade_patrimonio_resumo/008_plan.md` após encerramento integrado.

### Payload 2 — BL-002

**Título:** `[FIX] Conter valores nos cartões de resumo em larguras intermediárias`

**Problema observado**

No Início, quatro colunas entram em 1024 px simultaneamente ao menu lateral de 240 px, comprimindo os cartões e fazendo quantias sem quebra ultrapassarem as bordas. A barra clássica de rolagem também reduz o espaço disponível e precisa entrar na validação.

**Como reproduzir**

1. Usar somente dados fictícios no ambiente local e conteúdo mais alto que a janela.
2. Abrir o Início em 1024–1200 px com quantias como R$ 1.234.567,89; observar a grade atual de quatro colunas e o transbordamento.
3. Conferir também as transições de 768 e 1024 px com barra clássica e a quantia extrema negativa fictícia de −R$ 90.071.992.547.409,91.

**Comportamento esperado**

Entregar integralmente o Item 2 e a estratégia de testes da v3 aprovada. Uma coluna abaixo de md, duas a partir de md e ajuste local `px-1 py-4 md:px-3` em Cartao, preservando fonte value-lg, formato pt-BR, duas casas, sinal, espaço não separável e quantia integral em uma linha. Sem corte, abreviação, teto monetário novo, redução de fonte ou rolagem horizontal da página nas condições de aceite. Mínimo de 360 px CSS úteis de layout, medido por clientWidth; sem barra que ocupe largura, janela de 360; com barra de 15 px, janela de 375. Janela de 360 com barra clássica (345 úteis) fica fora da garantia do extremo, como aprovado no plano. Validar títulos, detalhes, percentuais, N/D, ocultação, cartões de período e estado vazio. A escolha visual R3-1 foi aceita na aprovação; registrar capturas em 360 px úteis com valores comuns.

**Impacto e evidências**

BL-002 e rodadas 1–3 documentam o problema e medições estáticas de viabilidade. Executar as duas matrizes do plano, com e sem barra que ocupe largura; na matriz clássica retirar `--hide-scrollbars` e provar diferença positiva entre innerWidth/clientWidth. Incluir varredura em passos de 1 px nas faixas 768–776 e 1024–1032, extremos positivos/negativos de centavos seguros, fontes carregadas e zoom real de 200% sobre 1280 px a 100%. G1/G2/G4 não se aplicam; G3 aplicável. Executar todos os gates do plano e registrar medidas/capturas sanitizadas na task. Implementar após integração da primeira issue, com autorização própria. Esta última PR inclui documentação viva e encerramento prospectivo; task com seção Encerramento, plano/tasks em estados finais, pasta em executed e cycles atualizado. Cada merge exige aprovação específica e checks verdes.

**Trilha**

Normal (ciclo com plano).

**Elegibilidade da trilha curta**

Não se aplica.

**Ciclo e plano relacionados**

Ciclo 008 (leve), BL-002; `_project/drafts/008_legibilidade_patrimonio_resumo/008_plan.md`, v3 aprovada em 2026-10-20, Item 2, estratégia de testes e ressalva R3-1 aceita. No encerramento integrado, o plano passa a `_project/executed/008_legibilidade_patrimonio_resumo/008_plan.md`.

## Próximo passo

Artefato ativo: `008_task_issue-88.md`. Implementação autorizada em 2026-10-20 com "autorizo a implementação da issue #88"; escopo Item 1 / BL-001. A #89 permanece dependente de integração e autorização própria. Handoff anterior de criação das issues preservado abaixo como histórico.

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 008 (leve)
Quem: Responsável
Conferir: Checks e diff da PR #90 (https://github.com/EuThiagoAndrade/saldo-futuro/pull/90)
Diga: "aprovo o merge da PR #90"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 008 + criar_issues + fix/BL-001-BL-002 + v3` (chaves individuais na tabela de publicação acima).
- `effect_class`: `remote_mutation` (criação das issues; rastreabilidade local atualizada no plano e em cycles).
- `state_before`: plano v3 Aprovado, revisão Concluída com APTO COM RESSALVAS e R3-1 aceita; ciclo 008 em Planejamento; situação Parado aguardando confirmação dos dois payloads; modo contínuo nunca autorizado.
- `state_after`: issues #88 e #89 abertas, com títulos e corpos aprovados conferidos no GitHub; plano segue Aprovado e ciclo em Planejamento; situação Aguardando autorização de implementação da #88; modo contínuo nunca autorizado.
- `result`: `executed`
- `evidence`: plano aprovado com a frase "aprovo o plano do ciclo 008" e confirmação posterior "Aprovado!" dos payloads em 2026-10-20; consultas de duplicidade por título antes de cada criação; gh issue create --body-file seguido de gh issue view com comparação integral do corpo, título e estado OPEN para #88 e #89, URLs registradas acima. Gates prévios: testes de governança 48/48, validador com 0 erros/avisos e cinco itens manuais, whitespace sem erros. Conferência G3: somente exemplos fictícios, sem dados privados; payloads e pareceres preservados.
- `blockers`: nenhum para criação/reconciliação das issues; início da implementação depende de autorização explícita da #88.

## Revisão crítica

### Rodada 1

- **Autor:** não identificado no rascunho `v1` (o handoff de `rascunhar_plano` não registra ferramenta nem modelo).
- **Revisor:** Claude Code (app desktop), Claude Opus 5.5 (`claude-opus-5-5`).
- **Data e autorização:** 2026-10-20; solicitação humana "revise o plano do ciclo 008". Autoriza esta revisão formal e seu registro, sem aprovar, promover ou reescrever o plano e sem criar issue ou iniciar implementação.
- **Base:** `main` local @ `7c78d1dff5cbd41358e64b45933c685c033020e1`, igual a `origin/main`; `_project/cycles.md` modificado (ciclo `008` em `Planejamento`, `Próximo ciclo: 009`) e plano `v1` não versionado, em `Rascunho` (movido para `Em Revisão` no início desta revisão). Worktree da fila `C:/Programas/saldo-futuro-backlog` em `chore/backlog` @ `7c78d1d`, sem commits locais posteriores. Não foram consultadas PRs ou issues no GitHub nesta revisão.
- **Identidade da origem (UTF-8/LF):** SHA-256 do plano `v1` antes desta revisão: `fbddadb0254e17f6f42b628d49906f4b36dc0e0e7959687c459f8212a547d576`. SHA-256 do trecho de `## Problema e contexto` até imediatamente antes de `## Próximo passo`: `20990aba6c452e82d07aab5899f9c5753b4deb62aff16663dc3099fee85b4379`. Esse trecho e o handoff original de `rascunhar_plano` foram preservados.
- **Template e autoridades lidos:** `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, `.agent/workflows/revisar_plano.md`, `.agent/templates/plano_implementacao.md`, `.agent/workflows/criar_issues.md`, `design-system/DESIGN.md` (§§2.3, 3.2–3.3, 4.3, 6.2–6.5 e 7), ADR-005, `_project/backlog.md` (BL-001 e BL-002) e, como precedente de formato, a revisão do plano `007`.
- **Medições:** larguras de texto medidas em Chromium (Playwright do projeto) com as fontes `design-system/assets/fonts/IBMPlexSans-*.woff2`, em página estática temporária fora do repositório; valores fictícios. Larguras úteis calculadas a partir de `src/app/(app)/layout.tsx` (`px-4`, `lg:pl-60`, `lg:px-8`), da grade `gap-3` e de `Cartao` (`border` + `p-4`).

#### Achados

- **R1-1 — bloqueador: a matriz de validação do Item 2 tem combinações inatingíveis sob as restrições do próprio plano.** A estratégia de testes combina 360 px, zoom de 200% e "magnitudes grandes até o limite suportado de centavos seguros", e o Item 2 exige conteúdo contido "nas larguras e condições da estratégia de testes", proibindo ao mesmo tempo redução de fonte, abreviação, corte, ocultação do transbordamento e alteração do componente monetário global (`ConteudoDinheiro`, `whitespace-nowrap`). Medido em `value-lg` (24 px, peso 600):
  - `R$ 90.071.992.547.409,91` (`Number.MAX_SAFE_INTEGER` em centavos) mede 302,2 px, e com `−` 316,6 px; a área útil do cartão em 360 px é 294 px (360 − 2 × 16 de margem − 2 × 1 de borda − 2 × 16 de preenchimento). O critério falha em 360 px antes de qualquer implementação.
  - "Zoom de 200%" não tem viewport de referência: em 360 px ele equivale a 180 px CSS, abaixo do menor ponto suportado do DESIGN.md (§4.3, 360 px), onde nenhuma quantia longa cabe em 24 px sem quebra.
  - Para referência das decisões: em 1024 px a área útil é 720 px; com quatro colunas cada cartão tem 137 px úteis (já transborda com `R$ 1.234.567,89`, 187,1 px), com três 198 px (cabe 187,1 px, não cabe `R$ 999.999.999,99`, 215,9 px) e com duas 320 px.

  O plano prevê "registrar a limitação e parar", mas um critério de aceite sabidamente insatisfazível levaria a execução a `Parado` por construção. **Correção esperada:** definir no plano (a) o teto fictício de magnitude que os cartões devem conter em cada largura, ou o comportamento esperado acima dele; (b) a combinação de viewport e zoom de 200% (por exemplo, zoom sobre 1280 px, equivalente a 640 px CSS); e (c) se a quebra de linha da quantia é admitida ou não, já que uma quebra entre `R$` e o número contraria o espaço não separável do §6.2. Se o teto ou o comportamento acima dele depender de preferência do responsável, registrar a pergunta em vez de escolher.
- **R1-2 — ressalva: a precisão nova não cabe na margem atual do eixo, que é compartilhada.** Em `graficos.tsx` o rótulo é ancorado em x = 64 de um `viewBox` de 360 unidades (`MARGEM.esquerda = 70`), com `fontSize` 11. Medidos em 11 unidades: `R$ 999,5 mil` 63,6 (cabe por pouco, caso atual), `R$ 999,98 mil` 70,2, `R$ 1,0005 mi` 67,2 e `−R$ 999,98 mil` 76,8 — os três últimos seriam cortados pelo `viewBox`. Portanto o ajuste de margem é provável, não eventual, e `MARGEM` vale para `GraficoLinha` e `GraficoBarras` em todas as telas. **Sugestão:** declarar no Item 1 o conjunto de rótulos de pior caso que deve caber, decidir se a unidade (`mil`/`mi`) é única por eixo ou por marca nas transições — a escolha muda o comprimento (`R$ 1,0005 mi` contra `R$ 1.000,5 mil`) — e tratar a mudança de margem como alteração compartilhada coberta pela regressão de R1-3.
- **R1-3 — ressalva: um consumidor compartilhado não está nomeado.** `GraficoLinha` também é usado em `src/app/(app)/benchmarks/comparacao/page.tsx` (base 100 da carteira contra benchmark, `rotularY={indice}`). O baseline, "Arquivos afetados" e o critério de regressão do Item 1 citam apenas os gráficos do Início ("base 100 e rentabilidade"). **Sugestão:** incluir a página de comparação na regressão (assinatura de `rotularY`, margem e rótulos de índice inalterados).
- **R1-4 — ressalva: a tabela de pontos de aprovação tem uma linha fora dos cinco tipos.** "Criar issues" não é tipo de ponto de aprovação (`_project/README.md`, "Pontos de aprovação"; o template pede os tipos e frases de lá). No leve sem modo contínuo, a criação é coberta pela aprovação do plano, condicionada à apresentação e confirmação do payload (`criar_issues`, Barreira), mas a linha "Aprovar plano" não diz que cobre a criação das issues. **Sugestão:** incluir em "Aprovar plano — Cobre" a criação das duas issues após a confirmação do payload, e transformar a linha "Criar issues" em nota ou removê-la.

#### Itens atendidos e verificações por inspeção somente leitura

- **Nível e entrada:** leve coerente com a triagem (apresentação sem cálculo, schema, RLS, autenticação ou governança). A autorização inicial contém a frase canônica do leve, com o parêntese apenas delimitando os IDs; sem modo contínuo (`—`), compatível com a parada na revisão.
- **Objetivo, escopo e não-escopo:** delimitados a BL-001 e BL-002; exclusões explícitas de regra financeira, KB-004, contrato visual, dependências e JavaScript de cliente. A origem no backlog confere com `_project/backlog.md` em `7c78d1d` (ambos `Disponível`, IDs presentes em `main` e em `origin/main`), e o retorno à fila está corretamente adiado para depois da integração.
- **Fatos do baseline conferidos:** `marcas` usa passos 1/2/5 × 10ⁿ e `faixaDe` ignora lacunas sem forçar zero (`escala.ts`); `textoEixoDinheiro` usa `maximumFractionDigits: 1` sem contexto das marcas (`valores.ts`, com testes em `valores.test.ts`); `EixoY` recebe só o valor de cada marca; o Início passa reais ao eixo e centavos à tabela; a grade é `md:grid-cols-2 lg:grid-cols-4` e `Cartao` é local de `page.tsx`, também usado nos resultados do período e no estado vazio; menu lateral `w-60` a partir de `lg`. O defeito do BL-001 se reproduz com o exemplo do plano: a faixa 1,20–1,26 mi gera passo de 20 mil, e com uma casa os rótulos viram `1,2 mi`, `1,2 mi`, `1,2 mi`, `1,3 mi`.
- **DESIGN.md:** a grade atual de quatro colunas diverge do §4.3 (até três a partir de `lg`), e o §6.2 só exemplifica a forma abreviada (`R$ 1,2 mil`), sem fixar casas no eixo; ajustar a precisão do eixo não altera o contrato visual.
- **Barreiras:** G1, G2 e G4 sem aplicação, com justificativa adequada; G3 aplicável e tratada. O plano não contém dados do usuário: os valores citados, inclusive nesta rodada, são fictícios.
- **Decomposição e sequência:** duas issues `[FIX]`, branches `fix/issue-N`, plano na primeira PR, encerramento prospectivo e documentação viva na última, cada merge com aprovação própria — conforme o fluxo do leve.
- **Gates executados nesta revisão (2026-10-20), sobre a `v1`:** `node --test scripts/validate-governance.test.mjs` 48/48; `node scripts/validate-governance.mjs` com 0 erros, 0 avisos e 5 itens manuais; `git diff --check` limpo.

**Observação fora do escopo (não é achado):** com `fontSize` 11 num `viewBox` de 360 unidades e o SVG com 294 px de largura em 360 px, os rótulos de eixo ficam com cerca de 9 px, abaixo do mínimo `caption` de 12 px do DESIGN.md §3.3; o comentário de `graficos.tsx` estima "cerca de 11 px". Relatado ao responsável, sem inclusão no escopo deste ciclo.

**Veredito: `REQUER NOVA RODADA`.** Um bloqueador (R1-1) e três ressalvas (R1-2 a R1-4). O plano `v1` passa a `Status: Em Revisão`, com `Veredito da revisão: REQUER NOVA RODADA` e `Aprovação humana pós-revisão: Pendente`. Este parecer não aprova o plano nem autoriza correções, issues ou implementação; a correção depende de "corrija o plano do ciclo 008", com resposta a cada achado e incremento de versão.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 008 + revisar_plano + 008_plan/rodada-1 + v1`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `008` em `Planejamento`; plano `v1` em `Rascunho`; `Revisão formal: Pendente`; `Veredito da revisão: Pendente`; `Aprovação humana pós-revisão: Pendente`; próximo passo `Aguardando revisão (rodada 1) — ciclo 008 (leve)`.
- `state_after`: ciclo `008` em `Planejamento`; plano `v1` em `Em Revisão`; `Revisão formal: Em andamento`; `Veredito da revisão: REQUER NOVA RODADA`; `Aprovação humana pós-revisão: Pendente`; `### Rodada 1` registrada; próximo passo `Aguardando correções (rodada 1) — ciclo 008 (leve)`.
- `result`: `executed`
- `evidence`: solicitação humana "revise o plano do ciclo 008" em 2026-10-20; campos de status e veredito do cabeçalho e bloco `## Próximo passo` atualizados; rodada registrada acima; inspeção somente leitura do código, do DESIGN.md, da ADR-005 e do backlog; medições tipográficas com a fonte do projeto; gates de governança como descritos; corpo do plano preservado, com os hashes de origem registrados.
- `blockers`: R1-1 em aberto; a correção exige autorização do responsável.

### Resposta do autor à rodada 1 — v2

- **Autor:** Codex, GPT-6 (variante exata não exposta nesta sessão).
- **Data e autorização:** 2026-10-20; pedido humano "corrija o plano do ciclo 008". Correção documental no workflow `rascunhar_plano`; nenhuma implementação, issue, publicação ou aprovação.
- **R1-1 — corrigido:** mantido o domínio integral de centavos seguros, sem escolher teto de magnitude menor. Definidos quantia sem quebra, fonte inalterada, grade de uma/duas colunas e preenchimento local `px-1 py-4 md:px-4`. Com as medidas já registradas pelo revisor, a área útil mínima planejada é 318 px em 360 px e 320 px nos inícios das duas colunas; a maior quantia negativa mede 316,6 px. É análise de viabilidade do plano, ainda sujeita a prova na implementação. Zoom de 200% agora tem referência explícita de 1280 px a 100% (640 px CSS a 200%), sem exigir 180 px CSS. Não houve escolha de preferência financeira nem redução de suporte.
- **R1-2 — corrigido:** definida unidade única por eixo pelo maior módulo das marcas e precisão comum que preserve seu significado. Ajuste de margem monetária tratado como parte prevista da entrega, com conjunto de estresse positivo/negativo e transições; medir todos os rótulos efetivos contra o viewBox e a curva. Preferir margem parametrizada monetária; qualquer alteração compartilhada exige regressão dos demais eixos.
- **R1-3 — corrigido:** comparação de benchmarks nomeada no baseline, testes, arquivos de verificação e aceite do Item 1, incluindo `rotularY={indice}`, margens e distinção das séries.
- **R1-4 — corrigido:** criação das duas issues incorporada à cobertura de Aprovar plano, condicionada a apresentação e confirmação do payload. Removidas da tabela as linhas operacionais Criar issues e Revisão formal; ambas estão explicadas em nota, sem criar tipos de aprovação.
- **Histórico e limites:** rodada 1 preservada integralmente. O veredito do cabeçalho continua referente à v1; a v2 aguarda rodada 2 e não recebe veredito do autor. A observação sobre tamanho efetivo da fonte do SVG continua fora do escopo, conforme o parecer, sem correção silenciosa.
- **Validação em 2026-10-20:** `node --test scripts/validate-governance.test.mjs` passou (48/48); `node scripts/validate-governance.mjs` passou (0 erros, 0 avisos, cinco itens manuais); `git diff --check` passou. `git status --short` continua mostrando somente `_project/cycles.md` preexistente e a pasta não versionada do plano. Nesta correção, somente este plano foi editado; não houve teste de aplicação ou nova medição tipográfica, pois não houve implementação. Conferência manual: exemplos fictícios, autorização recebida, snapshot da origem preservado e respostas limitadas aos achados.

### Rodada 2

- **Autor:** Codex, GPT-6 (correção `v2`, conforme a resposta à rodada 1).
- **Revisor:** Claude Code (app desktop), Claude Opus 5.5 (`claude-opus-5-5`).
- **Data e autorização:** 2026-10-20; solicitação humana "revise o plano do ciclo 008". Autoriza esta revisão formal e seu registro, sem aprovar, promover ou reescrever o plano e sem criar issue ou iniciar implementação.
- **Base:** `main` local @ `7c78d1dff5cbd41358e64b45933c685c033020e1`; `_project/cycles.md` modificado e plano não versionado, em `Em Revisão`, `v2`. Não foram consultadas PRs ou issues no GitHub nesta revisão.
- **Identidade da origem (UTF-8/LF):** SHA-256 do plano `v2` antes desta revisão: `a0847c7e4cb4bd53ca4b66bafb07ab45a5b7233ef619349f2e67fcfcb2c50119`. SHA-256 do trecho de `## Problema e contexto` até imediatamente antes de `## Próximo passo`: `5a5e8a49d66e8b8c6dd5fe5e8b747363d0f04e8c7bf38ee53339875e35ed82a8`. SHA-256 da `### Rodada 1` até imediatamente antes da resposta do autor: `9f332efac9dcfd4b21c06f7bae526072256413bd645474c6b0783dcb7bfa67c8`; a rodada 1 foi conferida por leitura integral e está preservada.
- **Template e autoridades lidos:** os da rodada 1, mais `src/components/dinheiro.tsx` e o código de inicialização do Chromium em `node_modules/playwright-core` (argumentos do modo headless).
- **Medições:** Chromium do Playwright do projeto, fontes `design-system/assets/fonts/IBMPlexSans-*.woff2`, página estática temporária fora do repositório que reproduz as larguras de `src/app/(app)/layout.tsx` e a grade proposta (`gap-3`; `grid-cols-2` como `minmax(0, 1fr)` a partir de `md`; `Cartao` com borda de 1 px e `px-1 py-4 md:px-4`); valores fictícios. Cada largura foi medida com o padrão headless do Playwright e, separadamente, sem o argumento `--hide-scrollbars`.

#### Conferência das respostas à rodada 1

- **R1-1 — atendido nos itens (b) e (c); item (a) substituído por R2-1.** O zoom de 200% tem referência explícita (1280 px a 100%, 640 px CSS) e a combinação com 180 px CSS foi excluída; a quantia fica em uma linha, com espaço não separável e `value-lg`. O autor manteve o domínio integral sem escolher teto, o que é correto por não ser decisão dele. A análise de viabilidade confere no ambiente sem barra de rolagem: 318 px úteis contra 316,6 px em 360 px, e 320 px em 768 e 1024 px. Ela não vale com barra de rolagem que ocupa largura (R2-1).
- **R1-2 — atendido.** Unidade única por eixo, precisão comum, conjunto de estresse com sinais e transições, medição de todos os rótulos gerados e regressão quando a geometria compartilhada mudar. O conjunto de estresse traz uma condição a delimitar (R2-2).
- **R1-3 — atendido.** A comparação de benchmarks aparece no baseline, no escopo, nos testes, nos arquivos de verificação e no aceite do Item 1.
- **R1-4 — atendido.** A tabela tem só os tipos do README. "Aprovar plano" cobre a criação das duas issues após a confirmação do payload, e a nota explica revisão formal e criação de issues sem criar tipo novo.

#### Achados

- **R2-1 — bloqueador: a grade proposta não contém a maior quantia negativa com barra de rolagem que ocupa largura, e o teste previsto não detecta o defeito.** O Início é mais alto que a janela; em navegadores de desktop com barra de rolagem clássica (no Windows, ela ocupa 15 px na medição), a largura útil de layout é a janela menos a barra, enquanto os pontos de quebra continuam medidos pela janela. Medido na reprodução da grade da `v2`:
  - 768 px: 313 px úteis por cartão, contra 316,6 px de `−R$ 90.071.992.547.409,91`; transborda.
  - 1024 px: 313 px úteis; transborda — é justamente a largura de entrada do menu lateral que motivou o BL-002.
  - 1040 px: 321 px úteis; cabe. Pela conta (duas colunas, `gap-3`, borda e `md:px-4`), a faixa afetada é de 768 a cerca de 776 px e de 1024 a cerca de 1032 px.
  - Sem barra, como no headless do Playwright, as mesmas larguras dão 320 px e o texto cabe. O Playwright inicia o Chromium headless com `--hide-scrollbars` (`playwright-core`, argumentos do modo headless), e `test:e2e` usa esse modo, de modo que o critério "contidos em todas as larguras CSS definidas, especialmente 360 e 1024–1200 px" seria aprovado no teste e descumprido para quem usa desktop com barra clássica.

  Parte do problema vem da rodada 1, cujas larguras úteis (294 e 320 px) também desconsideravam a barra; a `v2` as adotou como referência. **Correção esperada:** declarar no plano a condição de barra de rolagem que entra no aceite e como é testada (por exemplo, Chromium sem `--hide-scrollbars`, ou largura de layout medida por `document.documentElement.clientWidth`); e ajustar a geometria para caber nessa condição ou registrar a limitação como pergunta ao responsável. Como referência, com barra de 15 px um preenchimento lateral de até 12 px a partir de `md` (`md:px-3`) daria 320,5 px úteis em 768 e 1024 px; a escolha cabe ao autor, desde que medida.
- **R2-2 — ressalva: o extremo de ±R$ 90.071.992.547.409,91 no eixo precisa de limites explícitos.** Dois fatos, medidos com a fonte do projeto:
  - `marcas` arredonda cada marca com `toPrecision(12)` (`escala.ts`). Perto de 9 × 10¹³ reais, a resolução fica em R$ 100: `90.071.992.547.409,91` e `90.071.992.547.389,91` viram ambas `90071992547400`. Uma faixa estreita nessa magnitude gera marcas iguais, o que contraria o primeiro critério do Item 1. A expressão "quando representáveis" da estratégia de testes não diz onde fica esse limite.
  - Em 11 unidades, `−R$ 90.071.992,55 mi` mede 112,8 e `−R$ 90.071.992,5474 mi` mede 126,0, contra os 64 disponíveis hoje. A margem necessária ocuparia cerca de um terço do `viewBox` de 360 e reduziria a área da curva de 234 para cerca de 170 unidades, mantida a margem direita de 56.

  **Sugestão:** limitar o extremo do eixo a faixas largas, em que o passo supere a resolução de `toPrecision(12)`, ou declarar a mudança dessa resolução em `escala.ts` como parte da entrega; e fixar a área mínima aceitável da curva em 360 px, para que o ajuste de margem não seja decidido só pelo pior caso.

#### Itens atendidos e verificações por inspeção somente leitura

- Os itens atendidos da rodada 1 (nível, entrada, escopo, origem no backlog, baseline, DESIGN.md, barreiras e decomposição) continuam válidos na `v2`; as alterações se limitam às respostas aos achados.
- `Dinheiro` só repassa a `ConteudoDinheiro`, sem ícone ou elemento extra, de modo que a largura medida da quantia é a largura do cartão de Patrimônio e de Aportes líquidos.
- O DESIGN.md (§§4.1–4.2) não fixa preenchimento de cartão; `px-1` usa token existente. Fica registrado que o preenchimento de 4 px no celular é um custo visual assumido para conter o extremo, perceptível também nos títulos e nos cartões do período, que compartilham `Cartao`.
- Os valores citados nesta rodada são fictícios; o plano continua sem dados do usuário.
- **Gates executados nesta revisão (2026-10-20), sobre a `v2`:** `node --test scripts/validate-governance.test.mjs` 48/48; `node scripts/validate-governance.mjs` com 0 erros, 0 avisos e 5 itens manuais; `git diff --check` limpo.

**Regra de progresso (`_project/README.md`, "Revisão formal"):** os quatro achados da rodada 1 foram tratados e nenhum reapareceu como tal, mas o número de bloqueadores não diminuiu (um na rodada 1, um na rodada 2). Pela regra, a revisão só continua enquanto os bloqueadores diminuem; por isso a situação passa a `Parado`, e não a "Aguardando correções".

**Pergunta ao responsável:** a revisão continua com uma terceira correção do autor para R2-1 e R2-2 ("corrija o plano do ciclo 008"), ou você prefere decidir agora outro tratamento para a maior quantia negativa nos cartões entre 768–776 px e 1024–1032 px com barra de rolagem clássica — por exemplo, aceitar a limitação registrada ou fixar um teto fictício de magnitude para a contenção?

**Veredito: `REQUER NOVA RODADA`.** Um bloqueador (R2-1) e uma ressalva (R2-2). O plano `v2` segue em `Status: Em Revisão`, com `Aprovação humana pós-revisão: Pendente`. Este parecer não aprova o plano nem autoriza correções, issues ou implementação.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 008 + revisar_plano + 008_plan/rodada-2 + v2`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `008` em `Planejamento`; plano `v2` em `Em Revisão`; `Revisão formal: Em andamento`; `Veredito da revisão: REQUER NOVA RODADA` (rodada 1); `Aprovação humana pós-revisão: Pendente`; respostas do autor R1-1 a R1-4 registradas; próximo passo `Aguardando revisão (rodada 2) — ciclo 008 (leve)`.
- `state_after`: ciclo `008` em `Planejamento`; plano `v2` em `Em Revisão`; `Revisão formal: Em andamento` (rodada 2); `Veredito da revisão: REQUER NOVA RODADA` (rodada 2); `Aprovação humana pós-revisão: Pendente`; `### Rodada 2` registrada; próximo passo `Parado — ciclo 008 (leve)`, com a pergunta acima.
- `result`: `executed`
- `evidence`: solicitação humana "revise o plano do ciclo 008" em 2026-10-20; campos de revisão e veredito do cabeçalho e bloco `## Próximo passo` atualizados; rodada registrada acima; medições da grade com e sem barra de rolagem e dos rótulos extremos com a fonte do projeto; leitura dos argumentos headless do Playwright; gates de governança como descritos; corpo da `v2` e rodada 1 preservados, com os hashes registrados.
- `blockers`: R2-1 em aberto; regra de progresso sem redução de bloqueadores; a continuação depende da resposta do responsável.

### Resposta do autor à rodada 2 — v3

- **Autor:** Codex, GPT-6 (variante exata não exposta nesta sessão).
- **Autorização:** "corrija o plano do ciclo 008", em 2026-10-20, responde à alternativa de terceira correção apresentada na pergunta da rodada 2 e permite sair de Parado para esta correção documental. Não autoriza implementação, revisão automática, modo contínuo ou aprovação.
- **R2-1 — corrigido:** proposta passa a `md:px-3`, com duas matrizes explícitas e teste de barra clássica efetiva. Reprodução estática em Chromium, usando a fonte IBM Plex Sans 600 do projeto em 24 px: maior quantia negativa fictícia mede 316,5625 px; área útil de 328 px sem barra nas janelas de 768/1024; 320,5 px com barra de 15 px nessas janelas; 324,5 px em 776/1032 e 328,5 px em 1040 com barra. Mínimo útil de layout explicitado como 360 px: sem barra, janela de 360; com barra de 15 px, janela de 375. Ambos dão 318 px no cartão. Janela de 360 com barra clássica (345 úteis) está explicitamente fora da garantia do extremo, sem introduzir teto monetário. Testes da implementação devem registrar innerWidth/clientWidth e cobrir as faixas estreitas em passos de 1 px; headless com barra oculta não prova o cenário clássico.
- **R2-2 — corrigido:** a proteção contra marcas duplicadas em `escala.ts` passa a entrega prevista: resolução Q explícita e ampliação de passo/domínio de apresentação se houver colapso em `toPrecision(12)`, mantendo dados e tabela. Testes incluem extremos largos e estreitos; não dependem mais de "quando representáveis". Fixada largura mínima da curva de 160 unidades em viewBox de 360, orçamento esquerdo máximo de 144 com margem direita de 56 e conferência de todos os rótulos reais.
- **Evidência e limites:** medição estática em memória via Playwright com e sem `--hide-scrollbars`, conteúdo mais alto que a janela, fonte carregada e reprodução da grade proposta. Nenhum arquivo da aplicação foi alterado; medições da reprodução não são resultado de e2e da aplicação. As duas rodadas e a resposta anterior permanecem intactas; o veredito do cabeçalho é o histórico da v2, não um veredito do autor sobre a v3.
- **Validação documental em 2026-10-20:** `node --test scripts/validate-governance.test.mjs` passou (48/48); `node scripts/validate-governance.mjs` passou (0 erros, 0 avisos, cinco itens manuais); `git diff --check` e conferência de whitespace do plano não versionado via `git diff --no-index --check -- NUL <plano>` passaram. `git status --short` continua mostrando somente cycles preexistente e a pasta do plano; nesta correção só este plano foi editado. Conferência manual: exemplos fictícios, autorização de continuação registrada e histórico preservado. Testes da aplicação ficam para a implementação autorizada.

### Rodada 3

- **Autor:** Codex, GPT-6 (correção `v3`, conforme a resposta à rodada 2).
- **Revisor:** Claude Code (app desktop), Claude Opus 5.5 (`claude-opus-5-5`).
- **Data e autorização:** 2026-10-20; solicitação humana "revise o plano do ciclo 008". Autoriza esta revisão formal e seu registro, sem aprovar, promover ou reescrever o plano e sem criar issue ou iniciar implementação.
- **Precondição da rodada:** a rodada 2 terminou em `Parado` com pergunta ao responsável. A resposta registrada pelo autor ("corrija o plano do ciclo 008") escolhe a alternativa de terceira correção oferecida na pergunta; a `v3` e o bloco `Aguardando revisão (rodada 3)` são compatíveis com ela. A frase foi dita fora desta sessão; sua autenticidade é conferência manual do validador.
- **Base:** `main` local @ `7c78d1dff5cbd41358e64b45933c685c033020e1`; `_project/cycles.md` modificado e plano não versionado, em `Em Revisão`, `v3`. Não foram consultadas PRs ou issues no GitHub nesta revisão.
- **Identidade da origem (UTF-8/LF):** SHA-256 do plano `v3` antes desta revisão: `172a482fab921c90fa81ec5e7ebfa76394b275c75aca55edd70b8fe742a96f62`. SHA-256 do trecho de `## Problema e contexto` até imediatamente antes de `## Próximo passo`: `9ee7f1842488c8efd8c7533f3824574fdd0776e18f83171bec21c71220c05412`. SHA-256 de `## Revisão crítica` até imediatamente antes de `## Pós-mortem`, antes desta rodada: `664f1dc01d752d5dbe4c6bf64c2c0c34d30eb731dbdfc102e060bba363510f41`. A rodada 1 tem o mesmo hash registrado na rodada 2 (`9f332efa…`); a rodada 2 foi conferida por leitura e está preservada.
- **Medições:** mesma reprodução estática da rodada 2 (Chromium do Playwright, fontes do projeto, larguras de `src/app/(app)/layout.tsx`, conteúdo mais alto que a janela), agora com `Cartao` em `px-1 py-4 md:px-3`; barra clássica de 15 px obtida sem `--hide-scrollbars` e barra de 17 px simulada por `::-webkit-scrollbar`. A regra Q foi reproduzida sobre a `marcas` atual num script temporário; valores fictícios.

#### Conferência das respostas à rodada 2

- **R2-1 — atendido.** Larguras úteis medidas com `md:px-3` (borda incluída no cálculo, `clientWidth` arredondado pelo navegador):
  - sem barra: 318 px em 360; 328 px em 768 e 1024; 332 px em 776 e 1032;
  - barra de 15 px: 318 px em 375 (360 úteis); 321 px em 768 e 1024; 325 px em 776 e 1032;
  - barra de 17 px: 320 px em 768 e 1024.

  Todas ficam acima dos 316,6 px de `−R$ 90.071.992.547.409,91`. Dentro de cada ponto de quebra a largura útil só cresce com a janela, então as extremidades das faixas testadas na aplicação, mais a varredura de 1 px, bastam como evidência. A janela de 360 px com barra clássica, que transborda (a coluna única cresce até 317 px e gera rolagem horizontal), está fora da garantia de forma explícita, com o mínimo redefinido como 360 px úteis de layout; o DESIGN.md §4.3 não trata de barra de rolagem, então isso não altera o contrato. O teste exige `innerWidth − clientWidth > 0` na matriz clássica, o que fecha a lacuna do headless.
- **R2-2 — atendido.** A regra Q = 10^(⌊log10 A⌋ − 11) corresponde ao último dígito mantido por `toPrecision(12)`, e um passo da sequência 1/2/5 × 10ⁿ que não seja menor que Q é múltiplo de Q, de modo que marcas consecutivas não colapsam. Na reprodução:
  - a faixa estreita de 90.071.992.547.389,91 a 90.071.992.547.409,91 reais passa a passo 100, com marcas 90.071.992.547.300, …400 e …500, distintas e cobrindo os pontos (o mesmo para a versão negativa);
  - a faixa 1,20–1,26 mi segue com passo 20 mil (Q irrelevante), e a faixa de 0 ao extremo segue com passo 5 × 10¹³.

  O rótulo de pior caso desse eixo (`−R$ 90.071.992,5473 mi`, cerca de 126 unidades mais o afastamento de 6) cabe no orçamento esquerdo de 144 com a curva mínima de 160 unidades. A largura mínima da curva e a parada para decisão se outro caso ultrapassar o orçamento estão declaradas.

#### Achados

- **R3-1 — ressalva: o preenchimento lateral de 4 px no celular é uma escolha de aparência que serve só ao extremo teórico e merece decisão consciente na aprovação.** A `v3` leva `Cartao` a `px-1` abaixo de `md`, enquanto os demais blocos da interface (gráficos, formulário de período, avisos) usam `p-4`; o efeito vale para todos os cartões do Início, do período e do estado vazio, inclusive com valores comuns. A redução existe só para conter quantias próximas de 9 × 10¹³ reais. Para referência, com o `p-4` atual (294 px úteis em 360 px) cabem `−R$ 999.999.999.999,99` (280,6 px) e `R$ 9.999.999.999.999,99` (287,8 px), mas não `−R$ 9.999.999.999.999,99` (302,2 px). O autor acertou em não escolher um teto, porque é preferência do responsável e não do plano. **Sugestão:** ao aprovar, o responsável confirma a troca (domínio integral com `px-1`) ou pede que a correção adote outro limite de contenção com o preenchimento atual; em qualquer caso, a task da Issue 2 registra capturas do cartão em 360 px com valores comuns.

#### Itens atendidos e verificações por inspeção somente leitura

- Os itens atendidos das rodadas 1 e 2 continuam válidos na `v3`; as alterações do corpo se limitam às respostas a R2-1 e R2-2, com `escala.ts` passando de "somente se necessário" a arquivo previsto do Item 1, coerente com a regra Q.
- Os critérios de aceite do Item 1 e do Item 2 incorporam as matrizes, a regra Q e o orçamento de margem sem ampliar o escopo; nenhuma regra financeira, tabela em centavos ou contrato visual muda.
- Os valores citados nesta rodada são fictícios; o plano continua sem dados do usuário.
- **Gates executados nesta revisão (2026-10-20), sobre a `v3`:** `node --test scripts/validate-governance.test.mjs` 48/48; `node scripts/validate-governance.mjs` com 0 erros, 0 avisos e 5 itens manuais; `git diff --check` limpo.

**Regra de progresso:** os bloqueadores caíram de um (rodada 2) para zero, e nenhum achado corrigido reapareceu. Esta é a rodada 3 de no máximo 5.

**Veredito: `APTO COM RESSALVAS`.** Nenhum bloqueador e uma ressalva (R3-1). `Revisão formal: Concluída`; o plano `v3` segue em `Status: Em Revisão`, com `Aprovação humana pós-revisão: Pendente`. Este veredito não equivale a aprovação nem autoriza issues ou implementação; a aprovação exige a manifestação "aprovo o plano do ciclo 008", posterior a este veredito, e deve considerar a ressalva R3-1.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 008 + revisar_plano + 008_plan/rodada-3 + v3`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `008` em `Planejamento`; plano `v3` em `Em Revisão`; `Revisão formal: Em andamento`; `Veredito da revisão: REQUER NOVA RODADA` (rodada 2); `Aprovação humana pós-revisão: Pendente`; respostas do autor a R2-1 e R2-2 registradas; próximo passo `Aguardando revisão (rodada 3) — ciclo 008 (leve)`.
- `state_after`: ciclo `008` em `Planejamento`; plano `v3` em `Em Revisão`; `Revisão formal: Concluída`; `Veredito da revisão: APTO COM RESSALVAS` (rodada 3); `Aprovação humana pós-revisão: Pendente`; `### Rodada 3` registrada; próximo passo `Aguardando aprovação do plano — ciclo 008 (leve)`.
- `result`: `executed`
- `evidence`: solicitação humana "revise o plano do ciclo 008" em 2026-10-20; campos de revisão e veredito do cabeçalho e bloco `## Próximo passo` atualizados; rodada registrada acima; medições da grade `md:px-3` com barra de 0, 15 e 17 px e de quantias candidatas com a fonte do projeto; reprodução da regra Q; gates de governança como descritos; corpo da `v3` e rodadas anteriores preservados, com os hashes registrados.
- `blockers`: nenhum bloqueador de revisão; a aprovação humana está pendente e deve considerar R3-1.

## Pós-mortem

- **Data de conclusão:** —
- **Desvios:** —
- **Lições comprovadas:** —
