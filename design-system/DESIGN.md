# Design System — Saldo Futuro

> **Status:** Canônico
> **Versão:** v1
> **Última atualização:** 2026-10-30
> **Ciclo de origem:** `000` (issue #3)
> **Escopo:** interface web do Saldo Futuro
> **Fonte normativa:** este documento é a autoridade do contrato visual e de interação. A partir do ciclo `001`, a aplicação implementa seus tokens em Tailwind CSS 4. A página `design-system/referencia.html` demonstra o contrato com dados fictícios e não define layout final de telas (ciclo `004`).

## 1. Princípios

O Saldo Futuro mostra dinheiro. A interface deve transmitir a sobriedade e a confiança de uma instituição financeira e deixar cada número inequívoco.

- **Sobriedade:** azul-marinho, neutros frios e espaço em branco. Sem gradientes, ilustrações decorativas ou animações que chamem atenção.
- **Clareza numérica:** valores são o conteúdo principal. Algarismos alinham em coluna, o formato é sempre o brasileiro, e um dado ausente aparece como `N/D`, nunca como zero.
- **Confiança:** ganho e perda nunca dependem só da cor. Ações destrutivas sempre pedem confirmação, e estados de carregamento ou erro nunca exibem números provisórios como se fossem reais.
- **Celular primeiro:** a composição nasce em 360 px de largura e cresce até o desktop. Toda ação é alcançável com o polegar.
- **Um token para cada decisão:** cores, tipografia, espaçamento e raios vêm dos tokens deste documento. Valores literais são proibidos quando houver token.

## 2. Cores normativas

Os tokens são semânticos: o nome descreve a função, não a cor. O tema escuro futuro redefine os valores dos mesmos nomes, sem renomeação. Somente o tema claro está definido e validado.

### 2.1 Tokens

| Token | Valor (claro) | Uso |
| :-- | :-- | :-- |
| `surface` | `#FFFFFF` | Cartões, folhas, campos e conteúdo principal |
| `surface-subtle` | `#F4F6F9` | Fundo da página e agrupamentos discretos |
| `surface-sunken` | `#E8ECF2` | Áreas rebaixadas, trilhos e esqueletos de carregamento |
| `text` | `#0F1B2D` | Texto principal e valores |
| `text-secondary` | `#45526A` | Rótulos, descrições e metadados |
| `text-muted` | `#5E6A7E` | Texto auxiliar de menor ênfase, nunca para valores |
| `border` | `#D3DAE4` | Divisores e contornos de cartões (decorativos) |
| `border-strong` | `#7D899B` | Contorno de campos e controles (informativo) |
| `primary` | `#0B2A55` | Azul-marinho da marca, ação principal, navegação ativa |
| `primary-hover` | `#163C73` | Ação principal em hover e pressionada |
| `primary-subtle` | `#E7EDF6` | Fundo de item de navegação ativo e de seleção |
| `on-primary` | `#FFFFFF` | Texto e ícones sobre `primary` |
| `gain` | `#1F6B47` | Variação positiva |
| `gain-subtle` | `#E6F2EB` | Fundo de destaque positivo |
| `loss` | `#A63A35` | Variação negativa, erro e ação destrutiva |
| `loss-subtle` | `#F8E9E7` | Fundo de destaque negativo e de erro |
| `neutral` | `#5E6A7E` | Variação zero e estado `N/D` |
| `neutral-subtle` | `#EEF1F5` | Fundo de etiqueta neutra |
| `warning` | `#8A5A00` | Pendência, como um período aberto ou um saldo a ajustar |
| `warning-subtle` | `#FBF1DC` | Fundo de aviso |
| `focus` | `#2E6BD9` | Anel de foco |
| `chart-1` a `chart-8` | ver 2.3 | Séries de gráficos |

`gain` e `loss` são verde e vermelho dessaturados, reservados a ganho e perda. Eles têm a mesma luminância (contraste de 1,01:1 entre si), portanto são indistinguíveis para quem não percebe a diferença entre verde e vermelho. Por isso o componente de variação exige sinal e ícone (seção 6.4).

### 2.2 Contraste calculado

Razões calculadas pela fórmula de luminância relativa da WCAG 2.2. Mínimos: 4,5:1 para texto e 3:1 para elementos gráficos e contornos informativos.

| Primeiro plano | Fundo | Razão | Mínimo |
| :-- | :-- | --: | --: |
| `text` | `surface` | 17,28 | 4,5 |
| `text` | `surface-subtle` | 15,96 | 4,5 |
| `text` | `surface-sunken` | 14,58 | 4,5 |
| `text-secondary` | `surface` | 7,87 | 4,5 |
| `text-secondary` | `surface-subtle` | 7,27 | 4,5 |
| `text-secondary` | `surface-sunken` | 6,64 | 4,5 |
| `text-muted` | `surface` | 5,47 | 4,5 |
| `text-muted` | `surface-subtle` | 5,05 | 4,5 |
| `on-primary` | `primary` | 14,22 | 4,5 |
| `on-primary` | `primary-hover` | 10,89 | 4,5 |
| `primary` | `surface` | 14,22 | 4,5 |
| `primary` | `surface-subtle` | 13,14 | 4,5 |
| `primary` | `primary-subtle` | 12,08 | 4,5 |
| `text-secondary` | `primary-subtle` | 6,69 | 4,5 |
| `on-primary` | `loss` a 90% sobre `surface` (`#AF4D49`, cor computada no navegador) | 5,28 | 4,5 |
| `gain` | `surface` | 6,46 | 4,5 |
| `gain` | `surface-subtle` | 5,96 | 4,5 |
| `gain` | `gain-subtle` | 5,62 | 4,5 |
| `loss` | `surface` | 6,41 | 4,5 |
| `loss` | `surface-subtle` | 5,92 | 4,5 |
| `loss` | `loss-subtle` | 5,43 | 4,5 |
| `neutral` | `surface` | 5,47 | 4,5 |
| `neutral` | `neutral-subtle` | 4,83 | 4,5 |
| `warning` | `surface` | 5,93 | 4,5 |
| `warning` | `warning-subtle` | 5,28 | 4,5 |
| `border-strong` | `surface` | 3,55 | 3 |
| `border-strong` | `surface-subtle` | 3,27 | 3 |
| `border-strong` | `primary-subtle` | 3,01 | 3 |
| `focus` | `surface` | 4,97 | 3 |
| `focus` | `surface-subtle` | 4,60 | 3 |
| `chart-1` | `surface` | 14,22 | 3 |
| `chart-2` | `surface` | 5,00 | 3 |
| `chart-3` | `surface` | 4,24 | 3 |
| `chart-4` | `surface` | 5,89 | 3 |
| `chart-5` | `surface` | 5,47 | 3 |
| `chart-6` | `surface` | 5,01 | 3 |
| `chart-7` | `surface` | 5,57 | 3 |
| `chart-8` | `surface` | 6,45 | 3 |

`border` (`#D3DAE4`) é decorativo: separa áreas que já se distinguem por espaço e conteúdo, por isso não precisa de 3:1. Contornos que identificam um controle usam `border-strong`. O anel de foco nunca é desenhado diretamente sobre `primary` (2,86:1); ele fica afastado 2 px do elemento, sobre a superfície (seção 7).

### 2.3 Paleta de gráficos

A paleta é independente de biblioteca; a biblioteca de gráficos é escolhida no ciclo `004`.

| Token | Valor | Uso preferencial |
| :-- | :-- | :-- |
| `chart-1` | `#0B2A55` | Carteira (série principal) |
| `chart-2` | `#2C7A80` | Primeiro benchmark ou primeira categoria |
| `chart-3` | `#A86F12` | Segunda categoria |
| `chart-4` | `#6B5A9C` | Terceira categoria |
| `chart-5` | `#5E6A7E` | Quarta categoria e "outros" |
| `chart-6` | `#B04F6F` | Quinta categoria |
| `chart-7` | `#1F6E9C` | Só na distribuição por classe: Alternativos, moedas, outros (ciclo `013`) |
| `chart-8` | `#80552D` | Só na distribuição por classe: Em trânsito (ciclo `013`) |

- As séries usam a ordem da tabela. No máximo seis séries; o excedente é agrupado em "outros" (`chart-5`).
- Na rosca da distribuição por ativo (ciclo `010`, 6.13), as cinco fatias principais usam, nesta ordem, `chart-1`, `chart-2`, `chart-3`, `chart-4` e `chart-6`; `chart-5` fica reservado a Outros.
- **Exceção restrita à distribuição por classe macro (ciclo `013`, 6.13):** até oito categorias, sem Outros residual, com cor fixa pela identidade da linha, independente de saldo, ordem ou linhas ausentes: Caixa e disponibilidades `chart-1`, Renda fixa `chart-2`, Renda variável `chart-3`, Investimentos no exterior `chart-4`, Criptoativos e ativos digitais `chart-6`, Alternativos, moedas, outros `chart-7`, Em trânsito `chart-8` e Sem classe `chart-5`. `chart-7` e `chart-8` não são cores de ganho ou perda: `chart-7`, um azul aço, fica fora das famílias verde e vermelha (ΔE76 de cerca de 20 para `chart-5`, 26 para `chart-2` e mais de 40 para `gain` e `loss`); `chart-8`, um marrom, fica a cerca de 31 de `loss` e 27 de `chart-3`. A regra das seis séries continua valendo para os demais gráficos e para a distribuição por ativo.
- Barras de variação usam `gain` e `loss`, e nunca uma cor de categoria.
- Séries de benchmark usam linha tracejada; a carteira usa linha contínua. Cor nunca é a única diferença entre séries: use rótulo direto no fim da linha ou legenda com o mesmo traço.
- Eixos e grades usam `border`; rótulos de eixo usam `text-secondary` com algarismos tabulares.

## 3. Tipografia

### 3.1 Família

**IBM Plex Sans** (SIL Open Font License 1.1), versão 1.1.0 da distribuição oficial da IBM, servida pelo próprio site a partir de `design-system/assets/fonts/`, sem CDN. Pesos disponíveis: 400 (Regular), 500 (Medium) e 600 (SemiBold), sem itálico.

```css
@font-face {
  font-family: "IBM Plex Sans";
  src: url("assets/fonts/IBMPlexSans-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
/* Idem para Medium (500) e SemiBold (600). */
```

Fallback: `ui-sans-serif, system-ui, "Segoe UI", Roboto, Arial, sans-serif`.

### 3.2 Algarismos

- Na IBM Plex Sans 1.1.0, os algarismos padrão já são **tabulares**: de 0 a 9, todos têm 600 unidades de avanço nos três pesos, assim como o sinal de menos (U+2212) e o espaço de algarismo (U+2007). A fonte não tem a feature OpenType `tnum` porque não precisa dela (medição registrada na task da issue #3).
- Todo valor numérico declara `font-variant-numeric: tabular-nums lining-nums`. Na Plex isso não muda nada, mas garante algarismos tabulares nas fontes de fallback.
- A feature `onum` (algarismos de estilo antigo) é proibida em valores.
- Valores negativos usam o sinal de menos U+2212 (`−`), que tem a mesma largura dos algarismos, e não o hífen (`-`, 399 unidades).

### 3.3 Escala

Base do celular. Os tamanhos não diminuem em telas maiores; apenas `display` cresce no desktop.

| Papel | Tamanho / altura de linha | Peso | Uso |
| :-- | :-- | :-- | :-- |
| `display` | 32 / 40 px (40 / 48 px a partir de `lg`) | 600 | Saldo total na tela Início |
| `title-lg` | 24 / 32 px | 600 | Título de página |
| `title-md` | 20 / 28 px | 600 | Título de seção |
| `title-sm` | 18 / 24 px | 600 | Título de cartão |
| `value-lg` | 24 / 32 px | 600 | Valor de destaque em cartão |
| `value` | 16 / 24 px | 500 | Valor em lista e tabela |
| `body` | 16 / 24 px | 400 | Texto corrido e campos |
| `body-sm` | 14 / 20 px | 400 | Descrições e metadados |
| `label` | 14 / 20 px | 500 | Rótulos de campo, botões e navegação |
| `caption` | 12 / 16 px | 500 | Legendas de gráfico e rótulos da barra inferior |

- Texto de campo de formulário tem no mínimo 16 px, para o navegador do celular não ampliar a página ao focar.
- `caption` é o menor tamanho permitido e nunca é usado para valores monetários.

## 4. Espaçamento, grade e pontos de quebra

### 4.1 Espaçamento

Escala com base de 4 px.

| Token | Valor | | Token | Valor |
| :-- | --: | :-- | :-- | --: |
| `space-1` | 4 px | | `space-6` | 24 px |
| `space-2` | 8 px | | `space-8` | 32 px |
| `space-3` | 12 px | | `space-10` | 40 px |
| `space-4` | 16 px | | `space-12` | 48 px |
| `space-5` | 20 px | | `space-16` | 64 px |

### 4.2 Forma e elevação

| Token | Valor | Uso |
| :-- | --: | :-- |
| `radius-sm` | 6 px | Etiquetas e campos pequenos |
| `radius-md` | 10 px | Campos, botões e cartões |
| `radius-lg` | 16 px | Folhas inferiores e diálogos |
| `radius-full` | 9999 px | Indicadores circulares |
| `shadow-overlay` | `0 8px 24px rgba(15, 27, 45, 0.16)` | Só para folhas, diálogos e menus sobrepostos |

Cartões não têm sombra: eles se separam do fundo `surface-subtle` pela cor `surface` e pelo contorno `border`.

### 4.3 Pontos de quebra e grade

| Ponto | Largura mínima | Margem lateral | Navegação |
| :-- | --: | --: | :-- |
| base | 360 px | 16 px | Barra inferior |
| `sm` | 640 px | 24 px | Barra inferior |
| `md` | 768 px | 24 px | Barra inferior |
| `lg` | 1024 px | 32 px | Menu lateral fixo (240 px) |
| `xl` | 1280 px | 32 px | Menu lateral fixo (240 px) |

- O conteúdo tem largura máxima de 1120 px, centralizado na área à direita do menu lateral.
- No celular, a composição é uma coluna. A partir de `md`, cartões de resumo podem ocupar duas colunas; a partir de `lg`, até três.
- A página nunca tem rolagem horizontal. Tabelas largas viram lista de cartões abaixo de `md` (seção 6.7).
- O conteúdo reserva espaço inferior igual à altura da barra de navegação mais `env(safe-area-inset-bottom)`.

## 5. Integração com Tailwind 4

A partir do ciclo `001`, a aplicação implementa os tokens em configuração CSS-first, com `@theme`. Este bloco é o mapeamento canônico:

```css
@import "tailwindcss";

@theme {
  --color-*: initial;
  --color-surface: #ffffff;
  --color-surface-subtle: #f4f6f9;
  --color-surface-sunken: #e8ecf2;
  --color-text: #0f1b2d;
  --color-text-secondary: #45526a;
  --color-text-muted: #5e6a7e;
  --color-border: #d3dae4;
  --color-border-strong: #7d899b;
  --color-primary: #0b2a55;
  --color-primary-hover: #163c73;
  --color-primary-subtle: #e7edf6;
  --color-on-primary: #ffffff;
  --color-gain: #1f6b47;
  --color-gain-subtle: #e6f2eb;
  --color-loss: #a63a35;
  --color-loss-subtle: #f8e9e7;
  --color-neutral: #5e6a7e;
  --color-neutral-subtle: #eef1f5;
  --color-warning: #8a5a00;
  --color-warning-subtle: #fbf1dc;
  --color-focus: #2e6bd9;
  --color-chart-1: #0b2a55;
  --color-chart-2: #2c7a80;
  --color-chart-3: #a86f12;
  --color-chart-4: #6b5a9c;
  --color-chart-5: #5e6a7e;
  --color-chart-6: #b04f6f;
  --color-chart-7: #1f6e9c;
  --color-chart-8: #80552d;

  --font-sans: "IBM Plex Sans", ui-sans-serif, system-ui, "Segoe UI", Roboto, Arial, sans-serif;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --shadow-overlay: 0 8px 24px rgb(15 27 45 / 0.16);

  --breakpoint-sm: 40rem;
  --breakpoint-md: 48rem;
  --breakpoint-lg: 64rem;
  --breakpoint-xl: 80rem;
}
```

- `--color-*: initial` remove a paleta padrão do Tailwind, para que só existam cores do contrato.
- O espaçamento usa a escala padrão do Tailwind (`--spacing: 0.25rem`), que coincide com a seção 4.1.
- O tema escuro futuro redefine as mesmas variáveis num seletor de tema, sem renomear tokens.
- Fontes, ícones e imagens são servidos pelo próprio site.

## 6. Contratos de componentes

### 6.1 Navegação

| Largura | Padrão | Itens |
| :-- | :-- | :-- |
| Abaixo de `lg` | Barra inferior fixa, 64 px de altura mais a área segura, cinco posições de largura igual | Início, Lançamentos, Ativos, Benchmarks e Mais |
| A partir de `lg` | Menu lateral fixo de 240 px, com o logo no topo | Os mesmos itens, com os destinos de "Mais" listados abaixo de um divisor |

- Cada item tem ícone de 24 px e rótulo `caption`; o rótulo nunca é omitido.
- O item ativo usa ícone e rótulo em `primary` e um indicador `primary-subtle` atrás do ícone, além de `aria-current="page"`.
- "Mais" abre uma folha inferior com os demais destinos, nesta ordem: Transferências, Cadastros (ciclo `012`), Novidades (ciclo `010`), Conta e Administração. Os mesmos destinos aparecem abaixo do divisor do menu lateral. Novidades e Cadastros valem para os dois perfis; o destino de administração só aparece para o perfil `admin`. Com um destino de "Mais" aberto, o próprio botão "Mais" fica em `primary`.
- Cadastros reúne as listas de apoio do usuário, hoje as instituições, fora de Ativos, porque não são ativos: os ativos estão nas instituições (ciclo `012`, emenda E-1). A aba Classes saiu no ciclo `013`: a classe do ativo é um nó da taxonomia global, escolhido no cadastro do ativo.
- Política de privacidade e termos de uso não são destinos da navegação: ficam como links de texto na tela de entrada e em Conta (ciclo `010`).
- A área de toque de cada item cobre toda a sua posição na barra (no mínimo 44 × 44 px).

### 6.2 Valor monetário

- Formato pt-BR com `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`: `R$ 1.234,56`, com espaço não separável após `R$`.
- Negativo: `−R$ 1.234,56`, com o sinal U+2212 antes de `R$`. Substitua o hífen produzido por `Intl` pelo U+2212.
- Sempre duas casas decimais. A forma abreviada (`R$ 1,2 mil`) só é permitida em rótulos de eixo de gráfico.
- Valor em `text`; a cor de ganho ou perda pertence ao componente de variação, não ao saldo.
- O valor é calculado a partir de centavos inteiros (ADR-002) e só é formatado na apresentação.

### 6.3 Percentual

- `Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 })`: `12,34%`.
- Em variações, o sinal é sempre explícito: `+1,23%`, `−0,45%`, `0,00%`.

### 6.4 Variação

A variação sempre combina **sinal**, **ícone** e **cor**; a cor sozinha nunca carrega o significado.

| Caso | Ícone | Texto | Cor |
| :-- | :-- | :-- | :-- |
| Positiva | Seta para cima | `+R$ 120,00` ou `+1,23%` | `gain` |
| Negativa | Seta para baixo | `−R$ 80,00` ou `−0,45%` | `loss` |
| Zero | Traço horizontal | `R$ 0,00` ou `0,00%` | `neutral` |
| Sem dado | Nenhum | `N/D` | `neutral` |

- O ícone é decorativo (`aria-hidden="true"`). O texto já contém o sinal, e o leitor de tela anuncia "mais" ou "menos".
- Em etiqueta, o fundo usa o token `-subtle` correspondente.

### 6.5 Estado `N/D`

- Quando um dado não existe (por exemplo, benchmark sem série no período, ou retorno de um mês sem posição inicial), exiba `N/D` em `neutral`, com `title` e rótulo acessível "Não disponível".
- Nunca exiba `0`, `R$ 0,00` ou `0,00%` para dado ausente. Zero é um valor; `N/D` é a ausência dele.
- Um total que dependa de um item `N/D` também é `N/D`, salvo regra explícita na KB de regras financeiras.

### 6.6 Cartão de lançamento

- Linha superior: nome do ativo (`title-sm`, truncado com reticências) e valor (`value`, alinhado à direita, com sinal).
- Linha inferior: tipo do lançamento e data (`body-sm`, `text-secondary`).
- Aportes aparecem como positivos e resgates como negativos, com ícone de entrada ou saída, sem cor de ganho ou perda: movimentação não é rendimento.
- O cartão inteiro é a área de toque para abrir o detalhe; ações destrutivas ficam no detalhe, nunca no cartão.

### 6.7 Tabela e lista de cartões

- A partir de `md`: tabela com cabeçalho fixo, números alinhados à direita e texto à esquerda.
- Abaixo de `md`: a mesma informação vira uma lista de cartões, um por linha da tabela, com o campo principal no topo e os demais como pares rótulo e valor.
- A ordenação e os filtros são os mesmos nas duas formas.
- **Exceção: lista densa de Ativos (ciclo `010`).** Abaixo de `md`, os ativos em uso formam uma lista contínua numa única superfície `surface` com contorno `border` e divisores `border` entre as linhas, em vez de um cartão por ativo. Cada linha traz o nome completo em `body` peso 500, com quebra de linha e nunca truncado, o tipo e os metadados em `body-sm` `text-secondary` na segunda linha e a ação à direita, com pelo menos 44 px de altura. O ativo de sistema não tem ação; a segunda linha diz que ele só recebe transferências. Desativados usam a mesma lista, com nome e data, sem ação. A partir de `md`, a tabela continua.
- **Emenda do ciclo `012` à lista de Ativos.** A segunda linha dos ativos em uso traz tipo, classe e instituição, separados por " · ", omitindo o que não foi informado; à direita, "Editar" (link com aparência de botão de texto) acima de "Desativar". Os desativados passam a mostrar na segunda linha a classe, a instituição e a data da desativação, com "Editar" à direita (44 px). O trânsito continua sem ação. Na tabela, Classe e Instituição são colunas próprias, com "—" quando não informadas, e a coluna de ações traz Editar e Desativar. A frase anterior sobre desativados "sem ação" fica substituída por esta.
- **Emenda do ciclo `013` à classe na lista de Ativos.** A classe é o **nome do nó** da taxonomia global escolhido (só o último elemento do caminho, como "CDB"), nunca o caminho completo, nas duas abas, na tabela e na lista do celular. Sem nó e com classe do legado, o texto é "Sem classe (antes: X)", com X o nome da classe antiga; sem nó e sem legado, a classe é omitida no celular e "—" na tabela, como "não informado". Um nó que não existe é erro de leitura da página, nunca "Sem classe".

### 6.8 Formulário

- Rótulo visível acima do campo (`label`); o placeholder nunca substitui o rótulo.
- Campos monetários usam `inputmode="decimal"`, aceitam vírgula como separador decimal e mostram `R$` como prefixo fora da área editável.
- Campos de data usam o seletor nativo.
- Erro de validação: mensagem em `loss` abaixo do campo, contorno `loss` e `aria-invalid="true"` com `aria-describedby` apontando para a mensagem.
- O botão principal fica ao alcance do polegar: no fim do formulário no celular e alinhado à direita no desktop.
- **Seção retrátil "Mais detalhes" (ciclo `012`).** Campos opcionais e pouco usados ficam num `<details>` com resumo "Mais detalhes" em `label` `primary`, altura mínima de 44 px, contorno `border` e conteúdo separado por uma linha `border`. Fecha por padrão e abre já aberto quando algum campo dentro dele estiver preenchido. Uma frase em `body-sm` `text-secondary` no topo explica a natureza dos campos.
- **Rádio de três estados (ciclo `012`).** Um indicador opcional usa um `fieldset` com `legend` e três rádios em linha, "Sim", "Não" e "Não informado", cada um com alvo de 44 px; "Não informado" é o padrão e nunca equivale a "Não".
- **Renomear em linha (ciclo `012`).** Numa lista de entradas com nome, "Renomear" (botão de texto) troca o nome pelo campo com o valor atual e o foco nele, com "Salvar nome" (secundário) e "Cancelar" (texto). Esc ou Cancelar fecham sem enviar e devolvem o foco ao botão; a recusa aparece abaixo do campo; o sucesso fecha o campo e a lista volta com o nome novo.

#### Seletor de ativo com busca (combobox)

O seletor de ativo é um campo de texto com lista, no padrão combobox da WAI-ARIA 1.2 (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`; a lista é `role="listbox"` e cada item, `role="option"`). O ID do ativo confirmado vai num campo oculto com o `name` do formulário.

- **Ordem e busca:** as opções vêm em ordem alfabética pelo nome exibido (pt-BR), "Em trânsito" incluído; nomes iguais continuam opções distintas. A busca é por trecho do nome, sem diferenciar maiúsculas nem acentos, e filtra a lista enquanto a pessoa digita. Sem correspondência, aparece "Nenhum ativo encontrado."
- **Teclado:** setas navegam (a seta com a lista fechada a abre); Home e End vão à primeira e à última opção com a lista aberta; Enter confirma a opção destacada (ao digitar, a primeira correspondência); com a lista fechada, Enter envia o formulário. Esc fecha a lista; com a lista fechada, devolve texto e valor à última seleção confirmada, ou ao vazio.
- **Toque e foco:** cada opção tem pelo menos 44 px de altura; o foco fica no campo e usa o anel de foco da seção 7.
- **Seleção confirmada:** só existe depois de um clique ou toque numa opção, ou de Enter sobre a opção destacada. Digitar o nome completo não seleciona sozinho. Qualquer edição do texto depois de uma confirmação desfaz a seleção na hora: o valor enviado fica vazio até nova confirmação, e o texto nunca indica um ativo diferente do valor. Sair do campo sem confirmar fecha a lista e mantém o texto, sem valor.
- **Validade:** texto preenchido sem seleção confirmada impede o envio com "Escolha um ativo da lista."; nos seletores obrigatórios, o campo vazio impede o envio com a mesma mensagem do servidor ("Escolha um ativo.", "Escolha o ativo de origem." ou "Escolha o ativo de destino."). A mensagem aparece abaixo do campo em `loss`, com contorno `loss`, `aria-invalid="true"` e `aria-describedby`, como no erro de validação acima. O componente só emite IDs das opções recebidas; o servidor continua validando.
- **Filtro:** no filtro de Lançamentos, "Todos os ativos" é a primeira opção, tem valor vazio e é confirmável; texto vazio equivale a ela. O valor inicial vem da URL: um ID da lista começa confirmado com o nome do ativo; vazio ou desconhecido começa em "Todos os ativos".
- **Reset:** o evento `reset` do formulário devolve o campo ao estado inicial (texto, valor, lista fechada e erro limpos).
- **Dependência de JavaScript:** a busca só funciona depois da hidratação. Antes dela, o campo não envia valor.

#### Seletor com criação (ciclo `012`)

Os seletores de classe e de instituição do ativo usam o mesmo componente e a mesma política, com estas diferenças:

- **Opcional:** campo vazio significa "não informado"; o texto sem seleção confirmada impede o envio com "Escolha uma classe da lista ou cadastre uma nova." (ou "uma instituição").
- **Criação:** quando nenhuma opção tem a mesma **identidade** do texto, a última opção é "Cadastrar «texto»". Confirmada como qualquer outra, ela envia o nome num segundo campo oculto, sem ID, e a entrada só é criada no envio do formulário.
- **Duas regras de nome:** a **busca** ignora acentos, caixa e espaços nas pontas e só filtra a lista; a **identidade** ignora caixa e espaços nas pontas, mas preserva acentos, e decide se o texto já é uma entrada (a mesma regra do banco, que é a autoridade). Com "Classe Ação" cadastrada, digitar "Classe Acao" lista "Classe Ação" e também oferece "Cadastrar «Classe Acao»"; digitar " classe ação " lista "Classe Ação" sem oferecer cadastro.
- **Lista vazia:** sem entradas e sem texto, aparece "Nenhuma classe cadastrada. Digite um nome para cadastrar." (ou "instituição").

#### Seletor de classe da taxonomia (ciclo `013`)

O campo "Classe" do ativo deixou de ser um seletor com criação e passou a escolher um nó da taxonomia global (até três níveis, mantida por migração). Usa o mesmo componente e a mesma política do seletor de ativo, com estas diferenças:

- **Um campo só, opcional:** escolher uma classe macro, uma subclasse ou um tipo não acrescenta campo nem etapa ao formulário. Qualquer nó de qualquer nível é uma escolha válida, inclusive um pai que tem filhos. Campo vazio significa "Sem classe"; limpar o texto e sair (Esc) apaga a escolha anterior.
- **Caminho completo:** cada opção mostra o caminho inteiro, com " › " entre os níveis ("Renda fixa › Crédito bancário › CDB"), em ordem hierárquica (cada pai antes dos filhos, irmãos na ordem da árvore), não alfabética. O campo mostra o caminho do nó confirmado. As opções quebram a linha, nunca truncam nem rolam na horizontal, e têm pelo menos 44 px de altura.
- **Busca pelo caminho:** a busca por trecho, sem acento nem caixa, vale para o caminho inteiro; digitar o nome de um ancestral lista o nó e todos os descendentes ("credito bancario" lista a subclasse e os seus tipos).
- **Sem criação:** não existe "Cadastrar «texto»". Texto sem seleção confirmada impede o envio com "Escolha uma classe da lista.", e um texto que não é de nenhum nó mostra "Nenhuma classe encontrada.". O servidor ainda recusa um ID de nó inexistente ("Classe não encontrada. Escolha uma da lista.").
- **Na edição:** acima dos campos, "Classe atual" mostra, com quebra de linha, o caminho completo do nó, ou "Sem classe" com "(antes: X)" quando o ativo só tem a classe do legado. O campo abre já com o nó confirmado.
- **Cadastros:** a aba Classes saiu; o endereço antigo `?aba=classes` abre Instituições.

#### Nome na edição do ativo (ciclo `015`)

Na edição, o Nome deixou de ser só leitura e passou a campo de texto, o primeiro do formulário:

- **Campo:** rótulo "Nome" visível acima, altura mínima de 44 px, preenchido com o nome atual, com a mesma classe dos demais campos de texto. Nome e detalhes são salvos juntos, num único envio de "Salvar alterações"; o tipo de ajuste continua só para leitura, e o ativo de sistema Em trânsito continua sem formulário.
- **Dica:** logo abaixo do campo, em texto secundário, "O nome atual também aparece nos registros antigos deste ativo.", ligada ao campo por `aria-describedby`. Não há nome histórico.
- **Validação:** a regra é a do banco. O servidor tira só o espaço comum das pontas (não NBSP, tabulação nem quebra de linha) e exige de 1 a 100 caracteres Unicode, contados como caracteres e não como unidades de texto do navegador, por isso o campo não usa `maxLength`. Vazio ou só espaços mostra "Informe o nome do ativo."; acima de 100, "Use até 100 caracteres.". Nomes repetidos são válidos; acentos e espaços internos não são alterados.
- **Recusa:** a mensagem aparece em `role="alert"` acima do botão, o campo mantém o que foi digitado e nada é gravado (nem a instituição nova). O sucesso volta à aba de origem.

#### Atributos complementares do ativo (ciclo `017`)

No cadastro e na edição, "Mais detalhes" reúne os quatro indicadores e os cinco atributos complementares, todos opcionais. O cadastro básico continua possível sem abrir a seção, que abre já aberta na edição quando algum indicador ou atributo estiver preenchido.

- **Aviso:** a frase do topo é "Informações preenchidas por você. O Saldo Futuro não calcula imposto, prazo de resgate ou valor garantido com estes campos." Nenhuma tabela de alíquotas, elegibilidade ou limite do FGC aparece.
- **Grupos:** cinco blocos em coluna, separados por uma linha `border`, cada atributo junto do indicador que lhe é próximo: Veículo de acesso com Previdência; Indexador da remuneração com Exposição cambial; Regime tributário com Isento de IR; Prazo para resgate ou venda com Liquidez imediata (reserva), cuja dica diz que a reserva é diferente do prazo; e Cobertura do FGC sozinha. Os indicadores mantêm o rádio de três estados.
- **Seleção múltipla:** Veículo de acesso e Indexador da remuneração usam checkboxes nativos num `fieldset` com `legend`, cada opção com alvo de 44 px e quebra de linha, e uma dica abaixo da legenda com a regra de exclusividade, ligada por `aria-describedby`. Marcar uma opção exclusiva (Não se aplica; no indexador, também Prefixado (sem indexador)) desmarca as demais, e marcar outra desmarca a exclusiva; o servidor e o banco recusam o conjunto inválido, sem descartar opções em silêncio. Nenhum componente de multisseleção próprio.
- **Escolha única:** Regime tributário, a situação do prazo e Cobertura do FGC usam `select` nativo com a mesma classe dos campos de texto; a primeira opção, de valor vazio, é "Não informado", que nunca equivale a "Não" nem a "Não se aplica".
- **Prazo:** o `select` "Prazo para resgate ou venda" tem a ajuda da P2 logo abaixo, ligada por `aria-describedby`. Só "Prazo em dias" mostra os campos Dias (texto com `inputmode="numeric"`) e Unidade (`select` que começa em "Escolha a unidade", sem unidade implícita), lado a lado a partir de `sm` e em coluna no celular; nas outras situações eles não existem nem são enviados. Zero aparece como 0. O app não soma, converte nem arredonda: "2,2" é recusado com "Informe os dias como número inteiro, de 0 a 2.147.483.647, sem vírgula.".
- **Recusa:** a mensagem aparece em `role="alert"` acima do botão; a seção continua aberta e todos os campos dela, além do nome e do tipo de ajuste no cadastro, mantêm o que foi escolhido. Classe e instituição seguem a regra de reset do seletor com busca.

### 6.9 Botões

| Variante | Fundo | Texto | Hover | Pressionado | Uso |
| :-- | :-- | :-- | :-- | :-- | :-- |
| Principal | `primary` | `on-primary` | fundo `primary-hover` | fundo `primary-hover` | Uma única ação principal por tela |
| Secundário | `surface` com contorno `border-strong` | `primary` | fundo `surface-subtle` | fundo `primary-subtle` | Ações alternativas |
| Destrutivo | `loss` | `on-primary` | sem mudança de cor | fundo `loss` a 90% de opacidade | Só dentro da confirmação de ação destrutiva |
| Texto | Transparente | `primary` | fundo `surface-subtle` | fundo `primary-subtle` | Ações de baixa ênfase |

Altura mínima de 44 px, raio `radius-md` e rótulo `label`. Um botão desabilitado mantém o contraste do texto e explica, por perto, por que está desabilitado.

Todo botão habilitado mostra o cursor de ponteiro; o desabilitado mostra `not-allowed` e não reage a hover nem a pressão. O estado pressionado, em todas as variantes, também desloca o botão 1 px para baixo, só quando o usuário não pediu movimento reduzido (`prefers-reduced-motion`). Com movimento reduzido, o sinal de pressão é a cor de fundo, que difere da de repouso em todas as variantes. Exceção declarada: no botão principal, com mouse e movimento reduzido, a cor pressionada é a mesma do hover (`primary-hover` é, por definição, "hover e pressionada"); no toque, que não tem hover, o sinal sempre aparece.

Os controles com classes próprias seguem a mesma regra: "Ocultar valores", "Mais" e "Fechar" mostram ponteiro e fundo `primary-subtle` ao serem pressionados; "Mais" e "Fechar" mostram `surface-subtle` em hover, e "Ocultar valores" mostra `surface`.

### 6.10 Confirmação de ação destrutiva

- Excluir, desativar, reabrir um período fechado ou qualquer ação irreversível abre um diálogo (folha inferior no celular) com:
  - título que nomeia a ação e o objeto;
  - consequência em uma frase;
  - botão "Cancelar" (secundário) e botão destrutivo com o verbo da ação, como "Excluir lançamento".
- O foco inicial fica em "Cancelar". Esc e toque fora do diálogo cancelam.
- Nunca use "OK" ou "Sim" como rótulo do botão destrutivo.

### 6.11 Estados vazio, carregando e erro

| Estado | Contrato |
| :-- | :-- |
| Vazio | Frase que explica o que aparecerá ali e uma ação principal para começar (por exemplo, "Registrar primeiro lançamento") |
| Carregando | Esqueletos em `surface-sunken` com a forma do conteúdo; nunca números provisórios. Animação de brilho desativada com `prefers-reduced-motion` |
| Erro | Ícone, mensagem em linguagem simples sobre o que falhou e ação "Tentar novamente". Detalhes técnicos não aparecem |

Um valor que não pôde ser carregado mostra o estado de erro, nunca o último valor conhecido sem aviso.

### 6.12 Abas por navegação

Usadas para alternar entre partes de uma mesma lista lidas pelo servidor, como "Em uso" e "Desativados" em Ativos (ciclo `010`). Em Cadastros, a aba "Classes" (`?aba=classes`, ciclo `012`) saiu no ciclo `013`, e a página mostra só as instituições, sem abas.

- São links com endereço próprio (por exemplo, `?aba=desativados`) dentro de um `nav` rotulado, não o padrão `tab` do ARIA: recarregar, voltar e avançar preservam a aba, e o teclado usa Tab e Enter como em qualquer link. Um valor ausente ou desconhecido abre a primeira aba.
- Cada aba tem pelo menos 44 px de altura, rótulo `label` e um contador em etiqueta neutra (`neutral` sobre `neutral-subtle`, `caption` peso 500).
- A aba selecionada tem `aria-current="page"`, texto `primary` e borda inferior de 2 px em `primary`; as demais usam `text-secondary` e borda transparente, com fundo `surface` em hover. O conjunto fica sobre uma linha `border`.
- Só o conteúdo da aba selecionada é renderizado; cada aba tem o próprio estado vazio.
- **Variante sem contador (ciclo `013`):** quando as abas alternam a representação dos mesmos dados, e não subconjuntos contáveis, não há etiqueta de contagem. É o caso do alternador "Por instituição" / "Por classe" / "Por ativo" da distribuição no Início (a terceira visão, no ciclo `015`; ordem e padrão atuais, no ciclo `016`): `nav` rotulado "Distribuição do patrimônio", links `?distribuicao=instituicao`, `?distribuicao=classe` e `?distribuicao=ativo`, nessa ordem, que preservam o período escolhido (e o formulário de período preserva a visão e, na visão por classe, o ramo aberto), `aria-current="page"`, sem `role="tab"`, altura mínima de 44 px e os mesmos estilos acima. Ausente ou inválido abre Por instituição; os três valores válidos mantêm suas visões. Só a visão escolhida é renderizada. Trocar de visão abandona o ramo da visão por classe.

### 6.13 Rosca de distribuição

Distribuição por ativo no Início (ciclo `010`, ADR-005). O cálculo da participação é o da KB-004, seção 15.

- **Base:** a rosca representa 100,00% da soma dos saldos positivos do último mês fechado. Saldos negativos ficam fora dela, numa lista própria abaixo da legenda, com nome e quantia, sem participação e sem cor de fatia; o texto do gráfico explica que a base são os saldos positivos.
- **Fatias:** até seis — os cinco maiores positivos e Outros, com as cores de 2.3. A geometria é proporcional aos saldos, sem tamanho mínimo; uma fatia muito pequena pode quase não aparecer e continua na legenda. Um único positivo é um anel completo. Fatias são separadas por um traço `surface`, para que duas cores vizinhas não dependam de contraste entre si.
- **Legenda:** HTML, em lista ordenada, na ordem das fatias. Cada item tem uma amostra da cor, o nome completo com quebra de linha (nunca truncado), a participação com duas casas e o valor em `value`, com algarismos tabulares. Outros é um `<details>`: o resumo traz o total do grupo, e a lista aberta traz cada componente com nome, participação sobre a mesma base e valor.
- **Sem positivos:** em vez da rosca, a frase "Não há saldos positivos para exibir"; negativos continuam listados.
- **Números:** "Ver os números" traz duas tabelas: Resumo (as fatias e Outros, mais os negativos) e Detalhe por ativo (cada posição uma vez). Outros nunca aparece somado a seus componentes na mesma tabela.
- **Ocultar valores:** toda quantia da legenda, das listas e das tabelas vira "Valor oculto" já no servidor; títulos, descrições e atributos acessíveis não carregam quantias. Participações e nomes continuam visíveis.
- **Layout:** rosca acima da legenda; lado a lado só enquanto o cartão ocupa a largura toda (de `md` até antes de `lg`). A partir de `lg`, na meia coluna do Início, volta a empilhar, para que nomes e quantias da legenda caibam mesmo no limite da faixa monetária. Nunca há rolagem horizontal.
- **Por classe (ciclo `013`):** a mesma rosca, com até oito linhas (as seis classes macro, Em trânsito e Sem classe), sem Outros, nas cores fixas de 2.3 e na ordem da KB-004, seção 15 (saldo decrescente; empate pela ordem fixa). A legenda traz cada linha com amostra, nome, participação e valor. Saldos negativos ficam fora, por ativo, com o nome da classe entre parênteses. "Ver os números" traz uma tabela, Por classe, com as linhas e os negativos. Ocultação, base positiva, sem positivos e layout como na distribuição por ativo. Uma classe que não pode ser lida torna a visão indisponível, nunca "Sem classe".
- **Por instituição (ciclo `015`):** a mesma rosca, sobre a instituição atual de cada ativo, com Sem instituição e Em trânsito como grupos próprios. Até seis fatias: as cinco maiores linhas (grupos especiais incluídos) nas cores de 2.3 e Outros em `chart-5`, derivado depois do rateio, com saldo e participação somados dos componentes. A legenda abre Outros num `<details>` que identifica cada componente, com o rótulo "(n grupos)". Saldos negativos ficam fora, por ativo, com a instituição atual entre parênteses. "Ver os números" traz uma tabela, Por instituição, com todos os grupos e os negativos, nunca Outros. Instituição que não pode ser lida torna a visão indisponível, nunca "Sem instituição".
- **Detalhe de classe (ciclo `015`):** na visão por classe, a legenda da raiz traz, só nas classes macro, o link "Ver subclasses" (com o nome da classe para leitores de tela, 44 px), que abre `?distribuicao=classe&classe=<UUID>`; trânsito e Sem classe não têm detalhe. O detalhe de uma macro lista subclasses e o resíduo da macro; o de uma subclasse, os tipos e o resíduo da subclasse; tipo é terminal, e o resíduo "Classificado somente neste nível" nunca tem link (seu caminho completo vai num texto só para leitores de tela). Acima, um `nav` "Caminho da classe" com "Classes macro" e os ancestrais como links e o nó atual com `aria-current="page"`. O título traz só o caminho e o mês; o detalhe não mostra linha do próprio pai, total, rodapé nem resumo numérico. Tabela no desktop (colunas Grupo, Saldo, % na carteira e % na classe) e cartões no celular com as mesmas informações, nomes completos com quebra e sem rolagem horizontal; um texto perto das colunas explica, com esses mesmos nomes, que as bases são diferentes (todos os grupos do nível, para "% na carteira"; os grupos listados na classe aberta, para "% na classe") e os arredondamentos independentes. Saldos negativos do ramo ficam numa lista própria, com o caminho completo. Pai sem positivos mostra "Não há saldos positivos neste grupo em <mês>.", sem percentuais, e mantém os negativos. Um `?classe=` inexistente, inválido ou terminal (tipo) volta à raiz com o aviso "A classe pedida não existe ou não tem detalhamento. Mostrando as classes macro.", em `role="status"`. Ocultar valores atua no servidor também aqui; nomes e participações continuam visíveis.

## 7. Acessibilidade

- Conformidade alvo: WCAG 2.2 nível AA.
- Contraste conforme a seção 2.2. Nova combinação de cores só entra no contrato com a razão calculada e registrada.
- Alvo de toque mínimo de 44 × 44 px, inclusive ícones isolados.
- Foco visível em todo elemento interativo: `outline: 2px solid var(--color-focus); outline-offset: 2px`. O afastamento garante que o anel fique sobre a superfície, e não sobre o próprio controle.
- Ordem de foco igual à ordem visual. A barra inferior vem depois do conteúdo no DOM.
- `prefers-reduced-motion: reduce` desativa transições não essenciais e animações de esqueleto.
- Significado nunca depende só da cor (seções 2.1, 2.3 e 6.4).
- Ícones decorativos têm `aria-hidden="true"`; ícones sem rótulo visível têm nome acessível.
- O idioma da página é `pt-BR`, e valores são lidos corretamente porque o sinal faz parte do texto.

## 8. Logo e marca

### 8.1 Arquivos

| Arquivo | Conteúdo | Uso |
| :-- | :-- | :-- |
| `design-system/assets/logo-saldo-futuro.svg` | Símbolo e logotipo | Cabeçalho do menu lateral, tela de login e documentos |
| `design-system/assets/logo-simbolo.svg` | Símbolo isolado | Base dos ícones do PWA e do favicon (ciclo `001`) e espaços reduzidos |

### 8.2 Construção

- **Símbolo:** quadrado de cantos arredondados em `primary`, com uma linha ascendente em branco que termina num marco circular. A linha representa a evolução do saldo; o marco, o ponto futuro a que ela leva.
- **Logotipo:** "Saldo" em IBM Plex Sans SemiBold e "Futuro" em Regular, ambos em `primary`. O texto está convertido em contornos: os SVGs não usam `<text>`, não dependem da fonte instalada e não carregam recursos externos.

### 8.3 Uso

- Área de proteção ao redor do logo: no mínimo 1/4 da altura do símbolo.
- Tamanho mínimo: símbolo com 24 px de altura; logo completo com 32 px de altura.
- O símbolo é legível a 32 px. A 16 px (favicon), só a silhueta precisa ser reconhecível.
- Não distorcer, girar, recolorir, aplicar sombra ou contorno, nem mudar a fonte do logotipo.
- Sobre fundo `primary`, use a versão em branco, derivada no ciclo `001` junto com os ícones.
- O nome do produto em texto corrido é "Saldo Futuro", com as duas iniciais maiúsculas.
