# Backlog de possibilidades

"Coloque no backlog" significa "quero guardar para decidir depois".

Contrato, campos, estados e operação: [governança](README.md#backlog-de-possibilidades). Captura e publicação: [gerenciar backlog](../.agent/workflows/gerenciar_backlog.md).

## BL-001 — Precisão de escala e rótulos do eixo no gráfico de evolução patrimonial

> **Criado em:** `2026-10-20`
> **Atualizado em:** `2026-10-20`
> **Estado:** `Disponível`

### Problema e benefício esperado

No gráfico de evolução patrimonial da tela inicial, abreviações com poucas casas decimais nos rótulos do eixo vertical combinadas com o traçado exato da curva podem dar a impressão de que a linha ultrapassou marcas de referência que ainda não foram atingidas, ou gerar linhas de grade distintas com o mesmo texto arredondado. O benefício esperado é garantir consistência visual e numérica imediata entre a posição gráfica da curva, as linhas de grade de referência e os valores consolidados exibidos na interface, com precisão de escala compatível com o intervalo apresentado.

### Contexto

Originado de inconsistência visual observada na tela inicial (`src/app/(app)/page.tsx`), onde o zoom vertical sem zero na base amplifica distâncias e o arredondamento em `textoEixoDinheiro` (`src/lib/apresentacao/valores.ts`) e o gerador de marcas (`src/components/graficos/escala.ts`) rotulam linhas com precisão insuficiente para a escala do período. Sugestões levantadas incluem adequar casas decimais conforme o passo do eixo, alinhar o passo das marcas à formatação e avaliar folgas verticais no domínio Y.

### Encaminhamentos

—

### Restante

—

### Registro

- 2026-10-20 — Pedido explícito de guardar a necessidade levantada no registro temporário de melhorias; captura local.

## BL-002 — Responsividade e contenção de valores monetários nos cartões de resumo

> **Criado em:** `2026-10-20`
> **Atualizado em:** `2026-10-20`
> **Estado:** `Disponível`

### Problema e benefício esperado

Em larguras de tela intermediárias (especialmente entre 1024 px e 1200 px, como em monitores verticais ou janelas lado a lado), os valores monetários nos cartões de resumo da tela inicial extrapolam a borda lateral do cartão. O benefício esperado é que os títulos e quantias caibam integralmente dentro de seus respectivos cartões em qualquer faixa de resolução e orientação, eliminando transbordamentos visuais e preservando a integridade da leitura dos valores.

### Contexto

Identificado na tela inicial (`src/app/(app)/page.tsx`), onde a ativação simultânea do menu lateral fixo (240 px) e a transição abrupta para 4 colunas no breakpoint `lg` (1024 px) reduzem o espaço horizontal útil por cartão para uma largura inferior à exigida por quantias formatadas em fonte destacada e sem quebra de linha (`ConteudoDinheiro` em `src/components/valores.tsx`). Sugestões técnicas levantadas incluem adiar as 4 colunas para o breakpoint `xl` (1280 px), adotar grade fluida com largura mínima (`auto-fit`) e calibrar o tamanho da tipografia em larguras intermediárias.

### Encaminhamentos

—

### Restante

—

### Registro

- 2026-10-20 — Pedido explícito de guardar a necessidade levantada no registro temporário de melhorias; captura local.

## BL-003 — Exibição condicional dos campos de data no filtro de período da tela inicial

> **Criado em:** `2026-10-20`
> **Atualizado em:** `2026-10-20`
> **Estado:** `Disponível`

### Problema e benefício esperado

No formulário de filtro de período da tela inicial, os campos de data de início e fim de intervalo permanecem sempre visíveis, mesmo quando opções predefinidas (como mês, ano ou acumulado) estão selecionadas. Isso induz à interpretação equivocada de que os campos personalizam as opções predefinidas e polui a interface. O benefício esperado é apresentar uma interface limpa onde os seletores de data apareçam exclusivamente quando o usuário escolher consultar um intervalo personalizado, simplificando a interação nos períodos predefinidos.

### Contexto

Observado em `src/app/(app)/page.tsx` e `src/lib/telas/inicio.ts`. Possibilidades levantadas incluem controlar a visibilidade dos campos com componente cliente ou CSS condicional, além de avaliar eventual submissão direta ao alternar períodos predefinidos.

### Encaminhamentos

—

### Restante

—

### Registro

- 2026-10-20 — Pedido explícito de guardar a necessidade levantada no registro temporário de melhorias; captura local.

## BL-004 — Uniformidade de cursor e feedback tátil de interação nos botões

> **Criado em:** `2026-10-20`
> **Atualizado em:** `2026-10-20`
> **Estado:** `Disponível`

### Problema e benefício esperado

Na aplicação há inconsistência de cursor de ponteiro entre botões nativos e links de ação, bem como ausência de retorno visual ao passar o mouse em botões secundários e falta de retorno de clique/toque (estado `:active`) nos botões em geral. O benefício esperado é proporcionar uma experiência de interação consistente, clara e responsiva em todos os controles acionáveis, confirmando visualmente a interatividade e o disparo de ações.

### Contexto

Observado em telas como Lançamentos (`src/app/(app)/lancamentos/page.tsx`) e nas definições de estilo em `src/components/botoes.ts`. Sugestões levantadas incluem incluir `cursor-pointer` na classe base de botões, estilizar o estado `hover` em botões secundários e introduzir feedback visual imediato para `:active` nas variantes de botão.

### Encaminhamentos

—

### Restante

—

### Registro

- 2026-10-20 — Pedido explícito de guardar a necessidade levantada no registro temporário de melhorias; captura local.

## BL-005 — Visualização intuitiva de alocação patrimonial por ativo com detalhamento legível

> **Criado em:** `2026-10-20`
> **Atualizado em:** `2026-10-20`
> **Estado:** `Disponível`

### Problema e benefício esperado

O gráfico atual de distribuição por ativo em barras horizontais é pouco intuitivo quanto à proporção real da carteira (a maior posição preenche 100% da largura útil mesmo sendo uma fração modesta), não exibe valores nem percentuais nas barras, trunca nomes longos de ativos de forma agressiva e agrupa todas as posições restantes em um bloco opaco de "Outros". O benefício esperado é disponibilizar uma visualização que represente a totalidade da carteira (100%) de forma intuitiva, exibindo percentuais, saldos e nomes completos de ativos sem truncamento antecipado no celular, mantendo alta performance de renderização no servidor.

### Contexto

Observado em `GraficoDistribuicao` (`src/components/graficos/graficos.tsx`). A proposta levantada sugere um gráfico de rosca/donut geométrico em SVG renderizado no servidor (aderente à ADR-005), desacoplando a geometria das informações textuais e acompanhado por uma legenda estruturada em HTML responsivo que apresente cor, nome completo do ativo, percentual e valor monetário, permitindo detalhamento retrátil para ativos de menor porte.

### Encaminhamentos

—

### Restante

—

### Registro

- 2026-10-20 — Pedido explícito de guardar a necessidade levantada no registro temporário de melhorias; captura local.
