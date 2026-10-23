# Backlog de possibilidades

"Coloque no backlog" significa "quero guardar para decidir depois".

Contrato, campos, estados e operação: [governança](README.md#backlog-de-possibilidades). Captura e publicação: [gerenciar backlog](../.agent/workflows/gerenciar_backlog.md).

## BL-001 — Precisão de escala e rótulos do eixo no gráfico de evolução patrimonial

> **Criado em:** `2026-10-20`
> **Atualizado em:** `2026-10-20`
> **Estado:** `Encaminhado`

### Problema e benefício esperado

No gráfico de evolução patrimonial da tela inicial, abreviações com poucas casas decimais nos rótulos do eixo vertical combinadas com o traçado exato da curva podem dar a impressão de que a linha ultrapassou marcas de referência que ainda não foram atingidas, ou gerar linhas de grade distintas com o mesmo texto arredondado. O benefício esperado é garantir consistência visual e numérica imediata entre a posição gráfica da curva, as linhas de grade de referência e os valores consolidados exibidos na interface, com precisão de escala compatível com o intervalo apresentado.

### Contexto

Originado de inconsistência visual observada na tela inicial (`src/app/(app)/page.tsx`), onde o zoom vertical sem zero na base amplifica distâncias e o arredondamento em `textoEixoDinheiro` (`src/lib/apresentacao/valores.ts`) e o gerador de marcas (`src/components/graficos/escala.ts`) rotulam linhas com precisão insuficiente para a escala do período. Sugestões levantadas incluem adequar casas decimais conforme o passo do eixo, alinhar o passo das marcas à formatação e avaliar folgas verticais no domínio Y.

### Encaminhamentos

- ciclo 008 — 2026-10-20 — integral

### Restante

—

### Registro

- 2026-10-20 — Pedido explícito de guardar a necessidade levantada no registro temporário de melhorias; captura local.
- 2026-10-20 — Retorno pós-integração da seleção original do ciclo 008; necessidade integralmente encaminhada (issue #88, PR #90).

## BL-002 — Responsividade e contenção de valores monetários nos cartões de resumo

> **Criado em:** `2026-10-20`
> **Atualizado em:** `2026-10-20`
> **Estado:** `Encaminhado`

### Problema e benefício esperado

Em larguras de tela intermediárias (especialmente entre 1024 px e 1200 px, como em monitores verticais ou janelas lado a lado), os valores monetários nos cartões de resumo da tela inicial extrapolam a borda lateral do cartão. O benefício esperado é que os títulos e quantias caibam integralmente dentro de seus respectivos cartões em qualquer faixa de resolução e orientação, eliminando transbordamentos visuais e preservando a integridade da leitura dos valores.

### Contexto

Identificado na tela inicial (`src/app/(app)/page.tsx`), onde a ativação simultânea do menu lateral fixo (240 px) e a transição abrupta para 4 colunas no breakpoint `lg` (1024 px) reduzem o espaço horizontal útil por cartão para uma largura inferior à exigida por quantias formatadas em fonte destacada e sem quebra de linha (`ConteudoDinheiro` em `src/components/valores.tsx`). Sugestões técnicas levantadas incluem adiar as 4 colunas para o breakpoint `xl` (1280 px), adotar grade fluida com largura mínima (`auto-fit`) e calibrar o tamanho da tipografia em larguras intermediárias.

### Encaminhamentos

- ciclo 008 — 2026-10-20 — integral

### Restante

—

### Registro

- 2026-10-20 — Pedido explícito de guardar a necessidade levantada no registro temporário de melhorias; captura local.
- 2026-10-20 — Retorno pós-integração da seleção original do ciclo 008; necessidade integralmente encaminhada (issue #89, PR #92).

## BL-003 — Exibição condicional dos campos de data nos filtros de período da aplicação

> **Criado em:** `2026-10-20`
> **Atualizado em:** `2026-10-20`
> **Estado:** `Encaminhado`

### Problema e benefício esperado

Nos formulários com filtro de período da aplicação, os campos de data de início e fim de intervalo ("De" e "Até") permanecem sempre visíveis, mesmo quando opções predefinidas (como mês, ano, 12 meses ou acumulado/desde o início) estão selecionadas. Isso induz à interpretação equivocada de que esses campos se aplicam ou personalizam as opções predefinidas e polui a interface. O benefício esperado é apresentar uma interface limpa e consistente em todo o sistema, onde os seletores de data apareçam exclusivamente quando o usuário escolher consultar um intervalo personalizado, simplificando a interação nos períodos predefinidos.

### Contexto

Identificado inicialmente na tela inicial (`src/app/(app)/page.tsx`), com ocorrência idêntica na tela de comparação de benchmarks (`src/app/(app)/benchmarks/comparacao/page.tsx`), ambas consumindo `src/lib/telas/inicio.ts`. Possibilidades levantadas incluem unificar esse padrão em um componente cliente reutilizável (por exemplo, `FiltroPeriodo`) ou controle CSS condicional, além de avaliar eventual submissão direta ao alternar períodos predefinidos.

### Encaminhamentos

- ciclo 009 — 2026-10-20 — integral

### Restante

—

### Registro

- 2026-10-20 — Pedido explícito de guardar a necessidade levantada no registro temporário de melhorias; captura local.
- 2026-10-20 — Pedido explícito de expandir o escopo para todos os filtros de período da aplicação onde ocorre o padrão de predefinições e intervalo (incluindo tela inicial e comparação de benchmarks); edição local.
- 2026-10-20 — Retorno pós-integração da seleção original do ciclo 009; necessidade integralmente encaminhada (issue #96, PR #100).

## BL-004 — Uniformidade de cursor e feedback tátil de interação nos botões

> **Criado em:** `2026-10-20`
> **Atualizado em:** `2026-10-20`
> **Estado:** `Encaminhado`

### Problema e benefício esperado

Na aplicação há inconsistência de cursor de ponteiro entre botões nativos e links de ação, bem como ausência de retorno visual ao passar o mouse em botões secundários e falta de retorno de clique/toque (estado `:active`) nos botões em geral. O benefício esperado é proporcionar uma experiência de interação consistente, clara e responsiva em todos os controles acionáveis, confirmando visualmente a interatividade e o disparo de ações.

### Contexto

Observado em telas como Lançamentos (`src/app/(app)/lancamentos/page.tsx`) e nas definições de estilo em `src/components/botoes.ts`. Sugestões levantadas incluem incluir `cursor-pointer` na classe base de botões, estilizar o estado `hover` em botões secundários e introduzir feedback visual imediato para `:active` nas variantes de botão.

### Encaminhamentos

- ciclo 009 — 2026-10-20 — integral

### Restante

—

### Registro

- 2026-10-20 — Pedido explícito de guardar a necessidade levantada no registro temporário de melhorias; captura local.
- 2026-10-20 — Retorno pós-integração da seleção original do ciclo 009; necessidade integralmente encaminhada (issue #95, PR #99); a exceção declarada na aprovação do plano continua valendo: no botão principal, com mouse e movimento reduzido, o pressionado tem a mesma cor do hover.

## BL-005 — Visualização intuitiva de alocação patrimonial por ativo com detalhamento legível

> **Criado em:** `2026-10-20`
> **Atualizado em:** `2026-10-22`
> **Estado:** `Encaminhado`

### Problema e benefício esperado

O gráfico atual de distribuição por ativo em barras horizontais é pouco intuitivo quanto à proporção real da carteira (a maior posição preenche 100% da largura útil mesmo sendo uma fração modesta), não exibe valores nem percentuais nas barras, trunca nomes longos de ativos de forma agressiva e agrupa todas as posições restantes em um bloco opaco de "Outros". O benefício esperado é disponibilizar uma visualização que represente a totalidade da carteira (100%) de forma intuitiva, exibindo percentuais, saldos e nomes completos de ativos sem truncamento antecipado no celular, mantendo alta performance de renderização no servidor.

### Contexto

Observado em `GraficoDistribuicao` (`src/components/graficos/graficos.tsx`). A proposta levantada sugere um gráfico de rosca/donut geométrico em SVG renderizado no servidor (aderente à ADR-005), desacoplando a geometria das informações textuais e acompanhado por uma legenda estruturada em HTML responsivo que apresente cor, nome completo do ativo, percentual e valor monetário, permitindo detalhamento retrátil para ativos de menor porte.

### Encaminhamentos

- ciclo 010 — 2026-10-22 — integral

### Restante

—

### Registro

- 2026-10-20 — Pedido explícito de guardar a necessidade levantada no registro temporário de melhorias; captura local.
- 2026-10-22 — Retorno pós-integração da seleção original do ciclo 010; necessidade integralmente encaminhada (issue #107, PR #112).

## BL-006 — Reorganização da tela de ativos com fluxo de criação dedicado e gestão de listas

> **Criado em:** `2026-10-20`
> **Atualizado em:** `2026-10-22`
> **Estado:** `Encaminhado`

### Problema e benefício esperado

Na tela de ativos, o formulário de cadastro encontra-se posicionado entre a lista de ativos em uso e a lista de desativados, tornando o acesso à criação de novos ativos difícil conforme o número de posições cresce, além de gerar uma rolagem vertical excessiva no celular com o acúmulo contínuo de registros desativados. O benefício esperado é proporcionar uma experiência móvel fluida e focada, destacando a ação de novo ativo no topo, isolando o preenchimento do formulário em fluxo dedicado e segmentando a visualização entre posições ativas e histórico desativado.

### Contexto

Observado em `src/app/(app)/ativos/page.tsx` e `src/components/formularios/novo-ativo.tsx`. A proposta alinha a estrutura ao padrão já utilizado em lançamentos (`src/app/(app)/lancamentos/page.tsx`): botão primário no cabeçalho direcionando para rota de cadastro dedicada (`/ativos/novo`), controle segmentado por abas (`Em uso` e `Desativados`) com contadores e visualização em lista mais densa no celular, eliminando cartões com espaçamento excessivo.

### Encaminhamentos

- ciclo 010 — 2026-10-22 — integral

### Restante

—

### Registro

- 2026-10-20 — Pedido explícito de guardar a necessidade; captura local.
- 2026-10-22 — Retorno pós-integração da seleção original do ciclo 010; necessidade integralmente encaminhada (issue #106, PR #111).

## BL-007 — Expansão do catálogo de benchmarks com o índice de inflação IGP-M

> **Criado em:** `2026-10-20`
> **Atualizado em:** `2026-10-20`
> **Estado:** `Disponível`

### Problema e benefício esperado

Atualmente a aplicação oferece apenas o IPCA como referência de índice de preços para comparação da rentabilidade da carteira. Usuários com ativos imobiliários, títulos de crédito privado ou contratos referenciados em IGP-M carecem de um referencial direto dessa dinâmica inflacionária. O benefício esperado é permitir comparar o desempenho patrimonial com o IGP-M, ampliando as referências macroeconômicas disponíveis na aplicação.

### Contexto

Observado no catálogo de benchmarks em `supabase/migrations/20261014193630_benchmarks.sql` e na tela de comparação (`src/app/(app)/benchmarks/comparacao/page.tsx`). A série SGS 189 do Banco Central do Brasil fornece a taxa de variação percentual mensal do IGP-M, sendo 100% aderente ao modelo de cálculo existente para séries mensais (`periodicidade: "mensal"` e `retornoMensalMensal`), dispensando alterações na arquitetura contábil.

### Encaminhamentos

—

### Restante

—

### Registro

- 2026-10-20 — Pedido explícito de guardar a necessidade; captura local.

## BL-008 — Suporte a séries de benchmark de nível e cotação para o Dólar PTAX

> **Criado em:** `2026-10-20`
> **Atualizado em:** `2026-10-20`
> **Estado:** `Disponível`

### Problema e benefício esperado

A aplicação não permite avaliar a rentabilidade da carteira frente à desvalorização cambial (moeda estrangeira), pois o motor atual de cálculo de benchmarks suporta exclusivamente séries de taxa percentual, enquanto as séries cambiais são publicadas em valor absoluto de cotação. O benefício esperado é permitir que o investidor acompanhe o desempenho do seu patrimônio frente à cotação do dólar, identificando ganhos ou perdas reais em moeda forte.

### Contexto

Observado na seção 9.5 da KB-004 ("Benchmark de valor absoluto", decisão D14), que especifica a derivação do retorno mensal $R_m = N_m / N_{m-1} - 1$ a partir de séries de cotação/nível, mas não possuía implementação. O item envolve implementar esse cálculo no motor financeiro e disponibilizar a série do Dólar PTAX a partir do SGS do Banco Central.

### Encaminhamentos

—

### Restante

—

### Registro

- 2026-10-20 — Pedido explícito de guardar a necessidade; captura local.

## BL-009 — Metadados descritivos e classificação de ativos com aproveitamento do histórico

> **Criado em:** `2026-10-20`
> **Atualizado em:** `2026-10-20`
> **Estado:** `Disponível`

### Problema e benefício esperado

O cadastro de ativos restringe-se a nome e tipo de ajuste contábil, impossibilitando análises patrimoniais por classe de alocação (renda fixa, renda variável, cripto), concentração por instituição custodiante, identificação de reserva de emergência e segregação de patrimônio previdenciário. O benefício esperado é enriquecer o modelo de ativos com atributos descritivos essenciais sem onerar a simplicidade de cadastro no celular, viabilizando visões estratégicas de alocação macro e aproveitando os dados históricos legados.

### Contexto

Observado em `src/components/formularios/novo-ativo.tsx` e no schema da tabela `public.ativos`. Na migração (ciclo 006), os dados descritivos foram preservados no arquivo SQLite de origem (`local/migracao-006/meus-investimentos.sqlite`). A proposta sugere campos principais ágeis (classe e instituição), seção retrátil de detalhes opcionais (previdência, liquidez imediata/reserva, exposição cambial e isenção de IR) e carga retroativa automática para posições históricas migradas.

### Encaminhamentos

—

### Restante

—

### Registro

- 2026-10-20 — Pedido explícito de guardar a necessidade; captura local.

## BL-010 — Combobox pesquisável e ordenação alfabética uniforme para seleção de ativos

> **Criado em:** `2026-10-20`
> **Atualizado em:** `2026-10-20`
> **Estado:** `Encaminhado`

### Problema e benefício esperado

Os campos de seleção de ativos na aplicação utilizam listas suspensas nativas sem recurso de busca por digitação e sem ordenação alfabética padronizada (apresentando itens na ordem de inserção do banco de dados). Em dispositivos móveis e em carteiras com dezenas de posições, localizar um ativo exige rolagem manual extensa e cansativa. O benefício esperado é proporcionar uma experiência de seleção rápida e previsível em todas as telas, com ordenação alfabética estrita e filtro de texto em tempo real tolerante a maiúsculas e acentos.

### Contexto

Identificado em `src/app/(app)/lancamentos/page.tsx` (filtro de lançamentos), `src/components/formularios/novo-lancamento.tsx` (seleção de ativo) e `src/components/formularios/nova-transferencia.tsx` (origem e destino). A proposta envolve ordenar os ativos por ordem alfabética na camada de leitura/dados e introduzir um componente unificado no design system (`ComboboxAtivo`) com busca incremental case-insensitive e accent-insensitive otimizada para toque.

### Encaminhamentos

- ciclo 009 — 2026-10-20 — integral

### Restante

—

### Registro

- 2026-10-20 — Pedido explícito de guardar a necessidade; captura local.
- 2026-10-20 — Retorno pós-integração da seleção original do ciclo 009; necessidade integralmente encaminhada (issue #97, PR #101).

## BL-011 — Tela de novidades com histórico de versões e notas de lançamento acessíveis

> **Criado em:** `2026-10-20`
> **Atualizado em:** `2026-10-22`
> **Estado:** `Encaminhado`

### Problema e benefício esperado

O sistema não disponibiliza aos usuários uma forma direta de identificar a versão atual em produção nem o histórico de melhorias implementadas, gerando incerteza sobre funcionalidades recém-lançadas ou correções entregues. O benefício esperado é oferecer transparência sobre a evolução contínua da aplicação através de uma tela dedicada de novidades acessível a todos os usuários, apresentando o número da versão e notas de lançamento redigidas em linguagem clara e não técnica.

### Contexto

Observado na navegação (`src/components/navegacao.tsx`). A proposta prevê um item "Novidades" acessível a todos os perfis (no menu lateral desktop e na folha móvel "Mais"), direcionando para uma rota `/novidades` com destaque para a versão corrente (sincronizada com `package.json`), data de publicação e linha do tempo decrescente categorizada em seções simples de novidades, melhorias e correções.

### Encaminhamentos

- ciclo 010 — 2026-10-22 — integral

### Restante

—

### Registro

- 2026-10-20 — Pedido explícito de guardar a necessidade; captura local.
- 2026-10-22 — Retorno pós-integração da seleção original do ciclo 010; necessidade integralmente encaminhada (issue #105, PR #110).

## BL-012 — Páginas públicas de privacidade e termos para transição da tela de consentimento Google OAuth para produção

> **Criado em:** `2026-10-20`
> **Atualizado em:** `2026-10-22`
> **Estado:** `Encaminhado`

### Problema e benefício esperado

A tela de consentimento OAuth do Google Cloud opera em modo "Testando", exigindo que todo novo e-mail autorizado no sistema também seja cadastrado manualmente como usuário de teste no console do Google (limitado a 100 contas), sob pena de bloqueio com erro de acesso antes de atingir a aplicação. A mudança para o status "Em produção" no Google Cloud é bloqueada pela ausência de páginas públicas de Política de Privacidade e Termos de Serviço no domínio do aplicativo. O benefício esperado é eliminar a dependência de cadastro duplicado de usuários de teste no Google Cloud e centralizar a autorização de acessos exclusivamente no sistema, disponibilizando rotas públicas com os termos legais exigidos pelo provedor e compatíveis com a LGPD.

### Contexto

Registrado em `_project/knowledge/KB-002_operacao_producao_acessos.md` (passo GC2 e armadilha 7). A aplicação solicita somente escopos de identidade básicos (`openid`, `email`, `profile`), não exigindo processo de verificação restrita do Google. A necessidade compreende criar rotas estáticas públicas (`/privacidade` e `/termos`) com links acessíveis na tela de login (`/entrar`) e nos menus, viabilizando a publicação definitiva da tela de consentimento OAuth no console do Google Cloud.

### Encaminhamentos

- ciclo 010 — 2026-10-22 — integral

### Restante

—

### Registro

- 2026-10-20 — Pedido explícito de guardar a necessidade; captura local.
- 2026-10-22 — Retorno pós-integração da seleção original do ciclo 010; necessidade integralmente encaminhada (issue #104, PRs #108 e #114; ação externa no Google concluída em 2026-10-22).

## BL-013 — Alinhar a margem do gráfico de evolução patrimonial aos gráficos vizinhos

> **Criado em:** `2026-10-20`
> **Atualizado em:** `2026-10-20`
> **Estado:** `Encaminhado`

### Problema e benefício esperado

Na tela Início, a área de grade e curva do gráfico de evolução patrimonial começa mais à direita que a dos gráficos de rentabilidade mensal e Base 100, criando desalinhamento visual e reduzindo o espaço útil da série patrimonial. O benefício esperado é que a área de plotagem do patrimônio tenha o mesmo recuo à esquerda que esses gráficos vizinhos, preservando a leitura integral e legível dos rótulos monetários.

### Contexto

No ciclo 008, a margem maior foi adotada para acomodar rótulos monetários extensos no eixo patrimonial. A necessidade atual revisa essa composição visual. BL-001, sobre precisão de escala e rótulos do eixo, foi integralmente encaminhado no ciclo 008; este item registra separadamente o alinhamento da margem.

### Encaminhamentos

- ciclo 009 — 2026-10-20 — integral

### Restante

—

### Registro

- 2026-10-20 — Pedido explícito de corrigir o recuo do gráfico de evolução patrimonial e guardar a necessidade para seleção futura; captura local.
- 2026-10-20 — Retorno pós-integração da seleção original do ciclo 009; necessidade integralmente encaminhada (issue #94, PR #98).
