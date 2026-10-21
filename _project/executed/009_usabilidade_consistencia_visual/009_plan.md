# Plano de Implementação — Usabilidade e consistência visual

> **Ciclo:** `009`
> **Status:** `Concluído`
> **Versão:** `v2`
> **Data de criação:** 2026-10-20
> **Última atualização:** 2026-10-20
> **Tipo:** `feature`
> **Prioridade:** `P2`
> **Nível:** `leve`
> **Autorização inicial:** "confirmo o nível leve e autorizo o plano do ciclo 009" em 2026-10-20
> **Modo contínuo:** `—`
> **Revisão formal:** `Concluída` (rodada 2 sobre a `v2`)
> **Veredito da revisão:** `APTO COM RESSALVAS` (rodada 2, `v2`); `REQUER NOVA RODADA` na rodada 1 (`v1`)
> **Aprovação humana pós-revisão:** `Aprovada em 2026-10-20`
> **handoff_schema_version:** `2`

## Problema e contexto

O responsável confirmou o nível leve para um ciclo conjunto com BL-003, BL-004, BL-010 e BL-013. A triagem foi feita em outra conversa, somente leitura, e apresentada pelo responsável nesta conversa em 2026-10-20. Ela propôs quatro issues distintas no mesmo plano. A frase de entrada chegou antes da triagem; sem a triagem, a primeira resposta parou em "Parado" por falta da demanda. Com a triagem apresentada, a frase passou a valer para esta demanda.

Os quatro itens tratam de usabilidade e consistência visual:

- **BL-003:** nos filtros de período do Início e da comparação de benchmarks, os campos "De (intervalo)" e "Até (intervalo)" ficam sempre visíveis. Isso sugere que eles personalizam os períodos predefinidos, o que não é verdade.
- **BL-004:** a classe base dos botões não declara `cursor-pointer`, e o Tailwind 4 mantém o cursor padrão em `button`. Já os links de ação mostram ponteiro. O botão secundário e o de texto não mudam no hover, e nenhuma variante mostra o estado pressionado.
- **BL-010:** os seletores de ativo usam `select` nativo, sem busca. O filtro de Lançamentos e a nova transferência listam os ativos na ordem de leitura do banco (`ORDENS.ativos = ["id"]`). Só o novo lançamento ordena por nome.
- **BL-013:** no Início, a evolução patrimonial usa `margemEsquerda={144}`, enquanto a rentabilidade mensal e a Base 100 usam a margem padrão de 70. A área da curva começa mais à direita que a dos gráficos vizinhos.

A triagem descartou a trilha curta porque BL-010 acrescenta uma capacidade (busca). Ela também descartou o ciclo completo: nenhum item muda cálculo financeiro, RLS, autenticação, significado do schema ou regras de governança. Se a execução passar a exigir mudança nessas áreas, o trabalho para em "Parado" para nova triagem.

Alternativas consideradas:

- **BL-003:** um componente cliente com estado, ou CSS condicional. O CSS com `:has()` funciona no servidor, sem JavaScript, e degrada para o comportamento atual (campos visíveis) em navegadores sem suporte. Um campo oculto por CSS continua sujeito à validação nativa (R1-1). Por isso, os dois formulários passam a `novalidate`, e a validação do intervalo fica só no servidor, que já a faz. Desabilitar os campos ocultos resolveria o mesmo problema, mas exigiria JavaScript. A submissão automática ao trocar o período foi considerada e não é proposta: exigiria JavaScript, muda o modo de interação dos dois formulários e não é necessária para o problema relatado.
- **BL-004:** criar tokens novos de hover para todas as variantes, ou reutilizar os tokens existentes. A proposta reutiliza os tokens existentes e registra no DESIGN.md as combinações novas com suas razões de contraste.
- **BL-010:** adicionar uma biblioteca de combobox, ou implementar um componente próprio no padrão combobox da WAI-ARIA. A proposta é um componente próprio, sem dependência nova, coerente com a ADR-005 e com a política de não ampliar dependências.
- **BL-013:** voltar o patrimônio à margem fixa de 70, o que cortaria os rótulos longos garantidos no ciclo 008; ou aplicar uma margem comum, calculada pelos rótulos efetivamente gerados, aos três gráficos de eixo do Início. A segunda opção é a proposta (ver "Decisões e autoridades").

## Objetivo

Tornar os filtros de período, os botões, os seletores de ativo e os gráficos do Início previsíveis e coerentes entre si, sem alterar valores, períodos calculados, dados ou acesso.

## Origem no backlog

Snapshot da fila canônica `chore/backlog`, no worktree externo registrado `C:/Programas/saldo-futuro-backlog`, com o mesmo Git comum do checkout principal. Fonte: `_project/backlog.md` no commit `811ff840a51da200bdff8f0591e11d9d95fd103f`, publicado. Esse commit é igual ao `main` local e ao `origin/main`, conferidos por `git fetch` em 2026-10-20.

| ID e título | Síntese e parcela selecionada | Restante no recorte |
| :-- | :-- | :-- |
| BL-003 — Exibição condicional dos campos de data nos filtros de período da aplicação | Necessidade integral: campos de intervalo visíveis somente quando "Intervalo escolhido" está selecionado, em todos os filtros de período com predefinições (Início e comparação de benchmarks) | Nenhum previsto |
| BL-004 — Uniformidade de cursor e feedback tátil de interação nos botões | Necessidade integral: cursor de ponteiro uniforme, hover nas variantes que não o têm e estado pressionado em todos os botões | Nenhum previsto, se a exceção do principal com mouse e movimento reduzido (Item 2) for aceita na aprovação; senão, essa exceção |
| BL-010 — Combobox pesquisável e ordenação alfabética uniforme para seleção de ativos | Necessidade integral: ordem alfabética uniforme e busca incremental, sem diferenciar maiúsculas nem acentos, nos seletores de ativo de Lançamentos, Novo lançamento e Nova transferência | Nenhum previsto |
| BL-013 — Alinhar a margem do gráfico de evolução patrimonial aos gráficos vizinhos | Necessidade integral: área de plotagem do patrimônio com o mesmo recuo à esquerda da rentabilidade mensal e da Base 100, preservando a leitura integral dos rótulos monetários | Nenhum previsto |

Destino em preparação: ciclo 009. Os quatro itens permanecem `Disponível`; a seleção não altera a fila. Somente depois da integração do destino em main, comprovada, o workflow `gerenciar_backlog` registrará o retorno por `ciclo 009`, com a cobertura efetiva e eventual Restante. A publicação desse retorno exige autorização separada.

## Contexto e baseline

- Revisão de origem: `811ff840a51da200bdff8f0591e11d9d95fd103f`, em `main`. A única alteração local preexistente é `.agent/lessons_learned.md`, alheia a este ciclo e preservada. Não havia plano 009; o próximo ciclo declarado era `009`.
- `gh issue list --state open`: nenhuma issue aberta. `gh pr list --state open`: só a [PR #91](https://github.com/EuThiagoAndrade/saldo-futuro/pull/91), de release do release-please, fora deste escopo. Este documento não antecipa números de issue ou PR.
- **Filtros de período.** O Início (`src/app/(app)/page.tsx`) e a comparação (`src/app/(app)/benchmarks/comparacao/page.tsx`) são formulários GET renderizados no servidor, com `select name="periodo"` e dois `input type="month"` (`de` e `ate`). `limitesDoPeriodo` (`src/lib/telas/inicio.ts`) só usa `de`/`ate` no tipo `intervalo` e só nele recusa. Com tipo predefinido, `de`/`ate` presentes, inválidos ou invertidos são ignorados, sem recusa. Os formulários diferem só no valor inicial dos campos: o Início os deixa vazios quando o tipo não é `intervalo`; a comparação repete os valores da URL. Os e2e `tests/e2e/inicio.spec.ts` (CR-51 e casos de intervalo) e `tests/e2e/benchmarks.spec.ts` cobrem os períodos.
- **Botões.** `src/components/botoes.ts` define a base sem `cursor-pointer`; somente o principal tem `hover:bg-primary-hover`; nenhuma variante tem estado `active`. Há 34 usos das variantes secundária e de texto. `src/components/login-panel.tsx` tem bases próprias, equivalentes à principal e à secundária. Três botões usam classes próprias, fora das variantes: "Ocultar valores" (`src/app/(app)/layout.tsx`, com `hover:bg-surface`), "Mais" e "Fechar" (`src/components/navegacao.tsx`). O `summary` "Ver os números" dos gráficos já tem `cursor-pointer` e não é botão. DESIGN.md §6.9 define fundo e texto por variante, sem hover para secundário, texto e destrutivo e sem estado pressionado. O token `primary-hover` já está descrito como "hover e pressionada".
- **Seletores de ativo.** `src/app/(app)/lancamentos/page.tsx` (filtro GET, servidor, com "Todos os ativos"), `src/components/formularios/novo-lancamento.tsx` e `src/components/formularios/nova-transferencia.tsx` (origem e destino; componentes cliente com `useActionState`). `FormNovaTransferencia` chama `formulario.current?.reset()` depois de um envio bem-sucedido. As ações validam o ID no servidor (`z.uuid` em `src/app/(app)/lancamentos/acoes.ts` e `src/app/(app)/transferencias/acoes.ts`) antes de chamar as funções do banco. `src/app/(app)/lancamentos/novo/page.tsx` já ordena com `localeCompare(..., "pt-BR")`. Na transferência e no filtro, o nome exibido vem de `nomeDoAtivo`, que mostra "Em trânsito" para o ativo de sistema. `ORDENS.ativos` em `src/lib/leitura.ts` serve à leitura paginada e consistente, que não é ordem de apresentação.
- **Gráficos do Início.** `src/components/graficos/graficos.tsx` define o viewBox de 360 × 200, `MARGEM = { topo: 12, direita: 56, base: 26, esquerda: 70 }`, `GraficoLinha` com `margemEsquerda` opcional e `GraficoBarras` sem esse parâmetro. O ciclo 008 fixou 144 para o patrimônio, a fim de caber o rótulo extremo (cerca de 126 unidades), com um mínimo de 160 unidades de curva. Os testes `src/components/graficos/graficos.test.tsx` e `tests/e2e/eixo-patrimonio.spec.ts` verificam essa margem. A grade dos gráficos é `lg:grid-cols-2`: patrimônio e rentabilidade lado a lado, Base 100 abaixo. Distribuição por ativo é um gráfico de barras horizontais sem eixo Y, fora do alinhamento.
- DESIGN.md §6.8 não descreve campo com busca. §7 exige WCAG 2.2 AA, alvo de 44 × 44 px, foco visível, ordem de foco igual à visual e respeito a `prefers-reduced-motion`.

## Escopo

### Dentro do escopo

- BL-013: margem esquerda comum aos três gráficos com eixo Y do Início, calculada pelos rótulos gerados, com a legibilidade do ciclo 008 preservada.
- BL-004: cursor de ponteiro em todos os `button` habilitados da aplicação, hover nas variantes secundária e de texto e estado pressionado em todas as variantes. Inclui as bases de `login-panel.tsx` e os três botões com classes próprias (layout e navegação). Registro no DESIGN.md §6.9 e das razões novas no §2.2.
- BL-003: campos de intervalo visíveis só com "Intervalo escolhido", no Início e na comparação, com os dois formulários em `novalidate`; interpretação atual dos períodos e validação no servidor preservadas.
- BL-010: ordem alfabética uniforme pelo nome exibido e componente `ComboboxAtivo` com busca incremental nos três seletores de ativo, com política explícita de confirmação, edição, validação e reset; contrato do componente no DESIGN.md §6.8.
- Testes com dados fictícios, verificação visual e documentação viva no encerramento.

### Fora do escopo

- BL-005 a BL-009, BL-011 e BL-012; demais seletores (benchmark, período, tipo de lançamento e acessos do administrador).
- Alterar `limitesDoPeriodo`, períodos, quantias, consolidação, rentabilidade ou KB-004; submissão automática ao trocar o período.
- Alterar `ORDENS`, consultas, schema, RLS, autenticação, migrações, produção ou deploy manual.
- Dependência nova, biblioteca de gráficos ou de componentes; JavaScript no cliente para gráficos ou filtros de período.
- Novos tokens de cor; redesenho de botões, gráficos ou formulários além do necessário.
- Truncar ou abreviar rótulos monetários além do que o ciclo 008 definiu; reduzir a fonte do eixo.

## Decisões e autoridades

Aplicam-se `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, o template `.agent/templates/plano_implementacao.md`, ADR-004, ADR-005, KB-003 e `design-system/DESIGN.md`. A KB-004 é referência das regras de período, preservadas. As sugestões do backlog são alternativas, não decisões aprovadas.

**BL-013 — margem comum.** O Início calcula uma única margem esquerda para patrimônio, rentabilidade mensal e Base 100: o maior valor entre 70 (a margem padrão atual) e a largura estimada do rótulo mais longo de cada eixo mais o afastamento de 6 unidades. A estimativa é conservadora: largura por caractere da IBM Plex Sans a 11 unidades, com algarismos tabulares, e uma tabela pequena para sinais e letras. Ela roda no servidor, sem medir o DOM. `GraficoBarras` passa a aceitar `margemEsquerda`, como `GraficoLinha`. Com valores comuns (por exemplo, `R$ 1,22 mi`, cerca de 62 unidades), a margem fica em 70 e os três gráficos se alinham sem perda. Com rótulos longos, os três recuam juntos, até o limite do ciclo 008: 144 de margem e pelo menos 160 unidades de curva. A comparação de benchmarks fica fora do alinhamento e mantém a margem padrão. Exemplo fictício de aceite: a faixa de R$ 1.200.000 a R$ 1.260.000 resulta em margem 70 nos três gráficos; a faixa extrema do ciclo 008 resulta em margem comum de até 144, sem corte.

**BL-004 — estados dos botões.** Sem tokens novos:

| Variante | Hover | Pressionado |
| :-- | :-- | :-- |
| Principal | `primary-hover` (atual) | fundo `primary-hover` e deslocamento de 1 px |
| Secundário | fundo `surface-subtle` | fundo `primary-subtle` e deslocamento de 1 px |
| Texto | fundo `surface-subtle` | fundo `primary-subtle` e deslocamento de 1 px |
| Destrutivo | sem mudança de cor | fundo `loss` a 90% de opacidade sobre a superfície e deslocamento de 1 px |

O deslocamento usa `motion-safe:` e respeita `prefers-reduced-motion`. A base recebe `cursor-pointer`; desabilitado mantém `cursor-not-allowed` e não reage a hover nem a pressão.

O sinal de pressão sem movimento é a cor de fundo, que difere do repouso em todas as variantes. No toque, que não tem hover, o sinal sempre aparece. Há uma única coincidência declarada: no principal, com mouse e movimento reduzido, o pressionado tem a mesma cor do hover. O DESIGN.md já define `primary-hover` como cor de "hover e pressionada", e criar outro token está fora do escopo. Os critérios do Item 2 registram essa exceção, sem prometer distinção entre hover e pressão nesse caso.

Os três botões com classes próprias recebem `cursor-pointer` e estado pressionado com fundo `primary-subtle` (e deslocamento `motion-safe:`), preservando sua composição atual. "Ocultar valores" mantém o hover `surface`; "Mais" e "Fechar" ganham hover `surface-subtle`, como o botão de texto.

Razões calculadas nesta preparação: `primary`/`surface-subtle` 13,14 e `primary`/`primary-subtle` 12,08 já estão registradas. Entram no §2.2 as novas: `border-strong`/`surface-subtle` 3,27; `border-strong`/`primary-subtle` 3,01; `text-secondary`/`primary-subtle` 6,69 (item "Mais" fora da rota ativa); e `on-primary` sobre `loss` a 90% composto em `surface`, cerca de 5,24. A razão de 3,01 está no limite do mínimo de 3:1. `surface-sunken` foi descartado como fundo pressionado do secundário porque `border-strong` sobre ele dá 2,99. A razão do destrutivo deve ser recalculada com a cor computada no navegador, porque o Tailwind compõe a opacidade por `color-mix`. Se ficar abaixo de 4,5, o pressionado do destrutivo volta a ser só o deslocamento, e a exceção é registrada antes do merge.

**BL-003 — exibição condicional.** Os campos `de`/`ate` ficam num grupo exibido por CSS só quando a opção `intervalo` do `select` do mesmo formulário está marcada (`:has()`), tanto no carregamento quanto na troca. Os rótulos podem passar de "De (intervalo)" a "De" e "Até", porque só aparecem no intervalo; os testes devem acompanhar a troca. A interpretação dos períodos e os valores iniciais dos campos não mudam. Os campos ocultos continuam sendo enviados, e o servidor já os ignora fora do intervalo.

Os dois formulários recebem `novalidate` (R1-1). Sem isso, um mês posterior a M digitado no intervalo deixa o campo inválido por `max={M}`, e esse campo, mesmo oculto, impede o envio de um período predefinido. Na comparação, isso ocorre também ao carregar uma URL predefinida com `ate` posterior a M. Reprodução em Chromium (Playwright do projeto, página estática em memória, M fictício `2026-03`, `ate=2026-04`, troca de intervalo para ano):

- sem `novalidate`: `display: none`, `rangeOverflow: true` e o formulário não envia;
- com `novalidate`: o formulário envia.

O `max` continua nos campos como limite do seletor nativo. A validação passa a ser somente a do servidor, que já recusa intervalos invertidos, incompletos ou posteriores a M, com as mensagens atuais. Os formulários de período não têm outro campo com restrição nativa (nenhum `required`), então `novalidate` não desliga outra validação. Exemplo fictício: `?periodo=ano&de=2026-02&ate=2026-01` mostra o ano de M, sem recusa e sem campos visíveis. O mesmo endereço com `periodo=intervalo` continua recusado. Sem suporte a `:has()`, os campos aparecem como hoje.

**BL-010 — combobox.** Componente cliente próprio `ComboboxAtivo` (`src/components/combobox-ativo.tsx`), no padrão combobox da WAI-ARIA 1.2 com lista (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant` e `role="listbox"`/`option`). Ele envia o `id` do ativo por um `input type="hidden"` com o `name` atual, o que mantém os contratos dos formulários e das server actions.

- **Busca:** por substring, sem diferenciar maiúsculas nem acentos (`normalize("NFD")`, remoção de diacríticos e `toLocaleLowerCase("pt-BR")`).
- **Teclado:** setas, Enter, Esc, Home e End.
- **Toque:** opções com pelo menos 44 px de altura e foco visível.
- **Filtro:** o filtro de Lançamentos mantém a opção "Todos os ativos" no topo.

Política de seleção (R1-2). O estado do componente tem três partes: o texto visível, o valor (ID enviado) e se a seleção está confirmada.

- **Confirmação:** só há seleção confirmada quando a pessoa escolhe uma opção da lista por clique ou toque, ou por Enter sobre a opção ativa. Digitar o nome completo não seleciona sozinho. A opção ativa é a destacada pelas setas ou, ao digitar, a primeira correspondência. Enter com a lista fechada envia o formulário, como hoje.
- **Edição posterior:** qualquer edição do texto depois de uma confirmação desfaz a seleção na hora. O valor enviado fica vazio até nova confirmação, e o texto nunca indica um ativo diferente do valor.
- **Esc:** com a lista aberta, Esc a fecha sem mudar nada. Com a lista fechada, Esc volta o texto e o valor à última seleção confirmada (ou ao vazio, se não houver).
- **Saída sem confirmar:** sair do campo (Tab, clique fora) sem confirmar fecha a lista e mantém o texto, sem valor.
- **Validade:** o campo de texto usa a validação nativa. Com texto preenchido e sem seleção confirmada, `setCustomValidity("Escolha um ativo da lista.")` impede o envio. Nos seletores obrigatórios, campo vazio dá `valueMissing`, com a mesma mensagem do servidor ("Escolha um ativo.", "Escolha o ativo de origem." ou "Escolha o ativo de destino."). A apresentação segue o §6.8: mensagem em `loss` abaixo do campo, contorno `loss`, `aria-invalid` e `aria-describedby`. Reprodução em Chromium (página estática): texto preenchido com ID oculto vazio dá `checkValidity(): true` sem a regra customizada e `false` com ela.
- **Filtro de Lançamentos:** "Todos os ativos" é uma opção confirmável, com valor vazio. Texto vazio também equivale a "Todos os ativos". O valor inicial vem da URL: um ID que está na lista começa confirmado com o nome do ativo; vazio ou desconhecido começa em "Todos os ativos", como o `select` nativo exibe hoje.
- **IDs permitidos:** o componente só emite IDs das opções recebidas. O servidor continua validando (`z.uuid` e funções do banco); nada muda nessa validação.
- **Reset:** o componente escuta o evento `reset` do formulário. Ele cobre o `reset()` explícito de `FormNovaTransferencia` e o reset automático do React após a ação. O estado volta ao inicial (texto, valor, confirmação, lista fechada, opção ativa e mensagem de erro limpas).
- **Nomes iguais:** dois ativos com o mesmo nome exibido aparecem como opções distintas; a seleção é pelo ID, nunca pelo texto.
- **Ordem:** uma função de apresentação única ordena pelo nome exibido (`nomeDoAtivo`), com `localeCompare` em `pt-BR`. "Em trânsito" entra na ordem alfabética como os demais.
- **Leitura:** a ordem da leitura (`ORDENS`) não muda.
- **Sem JavaScript:** a página renderiza no servidor, mas a busca só funciona após a hidratação. Nos componentes que já são cliente isso não muda nada. No filtro GET de Lançamentos, é uma dependência nova de JavaScript para o controle, declarada aqui.

### Pontos de aprovação

| Ponto | Precondição | Cobre | Não cobre | Conferir |
| :-- | :-- | :-- | :-- | :-- |
| Autorizar plano — recebido | Triagem do leve com BL-003, BL-004, BL-010 e BL-013 e frase de entrada | Este rascunho e a reserva do ciclo 009 | Revisão, aprovação, issues, implementação e publicação | Autorização inicial e origem no backlog |
| Aprovar plano — `aprovo o plano do ciclo 009` | Veredito apto e manifestação humana posterior | Aprovação do plano, criação das quatro issues após apresentação e confirmação do payload, e encerramento após as entregas integradas | Implementação e qualquer merge | Veredito, ressalvas, decisões de BL-013 e BL-004 e payloads |
| Autorizar implementação — `autorizo a implementação da issue #N` | Plano aprovado, issue real e escopo conferido | Branch, task, implementação, validações e PR daquela issue | Outra issue, produção ou merge | Issue e plano; G1–G4 |
| Aprovar merge — `aprovo o merge da PR #N` | PR publicada, diff revisável e checks verdes | Squash da PR específica | Outras PRs ou ações externas | Checks, diff, privacidade e, na última PR, encerramento prospectivo |

A revisão formal é etapa separada, acionada por `revise o plano do ciclo 009`. Ela não é mais um tipo de ponto de aprovação. A criação das issues é coberta pela aprovação do plano, depois da apresentação e confirmação do payload. Este escopo não exige ação externa nem verificação em produção.

Não há modo contínuo autorizado. Este workflow termina com a revisão pendente. Toda cadeia autorizada para em `Parado` diante de dúvida material de escopo, cálculo ou privacidade, de precondição não verificável, de dependência nova ou de necessidade de nova autoridade.

## Barreiras de domínio

| Barreira | Aplica-se? | Como o ciclo a atende ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Só apresentação e interação. `limitesDoPeriodo`, rentabilidade e consolidação não mudam; testes conferem que cada período predefinido e o intervalo produzem os mesmos limites de antes. Se for preciso mudar cálculo, retriar |
| G2 — isolamento por RLS | Não | Nenhuma mudança em sessão, autorização, consultas, políticas, funções de banco ou acesso a dados; a ordenação ocorre em memória sobre dados já lidos |
| G3 — privacidade de dados | Sim | Somente cenários fictícios; nenhum acesso a `local/` financeiro, nenhuma captura autenticada real e nenhum nome real de ativo em testes, evidências, issue, PR ou commit; ocultação de valores preservada |
| G4 — migrações só acrescentam | Não | Nenhuma migração planejada |

## Estratégia de testes

Na redação: gates mínimos de governança (`node --test scripts/validate-governance.test.mjs`, `node scripts/validate-governance.mjs`, `git diff --check` e `git status --short`).

Em cada entrega: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:e2e`, além dos gates mínimos. Os cenários autenticados usam Supabase local com dados fictícios, como descrito no README, nunca produção. Sem mudança de banco ou autenticação, `supabase test db` não é exigido pelo escopo. Os resultados reais ficam na task de cada issue.

- **BL-013:** testes unitários da estimativa de largura e da margem comum: faixa comum (margem 70), transições mil/mi, negativos, conjunto de estresse e extremos do ciclo 008 (margem até 144, curva de pelo menos 160). Teste de renderização de `GraficoBarras` com `margemEsquerda`. O e2e mede, com a fonte carregada, as caixas reais dos rótulos dos três gráficos: nenhum corte e nenhuma sobreposição. Ele também verifica a mesma coordenada inicial da grade nos três gráficos, em 360 px úteis e no desktop com o menu lateral. Atualizar as asserções fixas em 144 do ciclo 008 para a regra nova, sem enfraquecê-las. Conferir que a estimativa nunca fica abaixo da largura medida.
- **BL-004:** testes de classe das variantes (cursor, hover, active, disabled e `motion-safe`). Um e2e percorre as telas autenticadas e públicas, enumera todos os `button` visíveis e habilitados e exige `cursor: pointer` computado, inclusive nos três botões com classes próprias e no login. Hover e pressão simulados conferem a cor computada de cada variante e desses três botões; com `prefers-reduced-motion: reduce` emulado, conferem que o pressionado difere do repouso e não há deslocamento. Recalcular no navegador a razão do destrutivo pressionado. Axe sem violações novas. Verificação manual de teclado.
- **BL-003:** e2e nas duas telas:
  - campos ocultos e fora da ordem de foco nos quatro tipos predefinidos; visíveis com intervalo, inclusive ao carregar `?periodo=intervalo` e ao trocar o `select`;
  - com intervalo, preencher um mês posterior a M, trocar para cada predefinição e clicar em enviar: o período predefinido é exibido, sem recusa;
  - na comparação, carregar `?periodo=ano&ate=<mês posterior a M>` e clicar em enviar: o ano é exibido;
  - voltar ao intervalo com o mês posterior a M e enviar: a recusa atual do servidor aparece;
  - `?periodo=ano&de=2026-02&ate=2026-01` não é recusado em nenhuma tela; o mesmo endereço com `periodo=intervalo` continua recusado;
  - os limites dos cinco períodos (CR-51) seguem iguais; celular e desktop.
- **BL-010:** testes unitários da normalização e da ordenação (acentos, maiúsculas, "Em trânsito", nomes iguais exceto pelo acento e lista vazia). Testes de componente da política de seleção:
  - selecionar A, editar o texto para B sem selecionar e enviar: envio bloqueado com "Escolha um ativo da lista.";
  - apagar a seleção de um campo obrigatório e enviar: envio bloqueado com a mensagem do servidor;
  - Esc com lista aberta e com lista fechada; saída por Tab sem confirmar;
  - filtro iniciado com um ativo da URL, retorno a "Todos os ativos" e ID desconhecido na URL;
  - evento `reset` restaura o estado inicial.

  E2e:
  - nos três formulários, buscar `acao` encontra "Ação Fictícia" e o envio grava o ativo certo;
  - duas transferências consecutivas, com o reset após o sucesso, gravam origem e destino corretos;
  - foco visível, alvo de 44 px, celular com toque emulado e axe.

## Itens de implementação

### Item 1 — BL-013: margem comum dos gráficos do Início

**Contexto:** a margem fixa de 144 do patrimônio desalinha a curva em relação à rentabilidade mensal e à Base 100.

**Ação técnica:** criar em `src/components/graficos/` uma estimativa conservadora da largura dos rótulos do eixo Y e uma função de margem comum (mínimo 70, máximo que preserve 160 unidades de curva). `GraficoBarras` passa a aceitar `margemEsquerda`. No Início, gerar as marcas e os rótulos dos três eixos, calcular a margem comum e passá-la aos três gráficos. Remover o 144 fixo.

**Critérios de aceite:**

- [ ] Com valores comuns fictícios, os três gráficos do Início começam a grade na mesma coordenada, igual a 70.
- [ ] Com rótulos longos, inclusive os extremos do ciclo 008, os três gráficos recuam juntos, sem corte ou sobreposição de rótulos e com pelo menos 160 unidades de curva.
- [ ] A estimativa nunca é menor que a largura medida no navegador com a fonte carregada.
- [ ] Tabelas equivalentes, ocultação, lacunas `N/D` e a comparação de benchmarks não regridem.

### Item 2 — BL-004: cursor e estados de interação dos botões

**Contexto:** botões nativos mostram o cursor padrão; secundário e texto não têm hover; nenhuma variante mostra o estado pressionado.

**Ação técnica:** atualizar `src/components/botoes.ts`, as duas bases de `src/components/login-panel.tsx` e os três botões com classes próprias (`src/app/(app)/layout.tsx` e `src/components/navegacao.tsx`) conforme "Decisões e autoridades". Registrar no DESIGN.md §6.9 os estados de hover e de pressão e no §2.2 as razões novas.

**Critérios de aceite:**

- [ ] Todo `button` habilitado da aplicação, inclusive os que não usam as variantes, mostra cursor de ponteiro; botão desabilitado mostra `not-allowed` e não reage a hover nem a pressão.
- [ ] Secundário, texto, "Mais" e "Fechar" têm hover. As quatro variantes e os três botões com classes próprias têm estado pressionado com cor de fundo diferente do repouso, inclusive com `prefers-reduced-motion`. O deslocamento só ocorre sem essa preferência.
- [ ] Exceção declarada: no principal, com mouse e movimento reduzido, o pressionado tem a mesma cor do hover (`primary-hover`, já definido como "hover e pressionada").
- [ ] Nenhuma combinação de cor fica abaixo do mínimo da WCAG 2.2 AA; as razões novas estão no DESIGN.md.
- [ ] Altura de 44 px, foco visível e layout das telas não regridem.

### Item 3 — BL-003: campos de intervalo só no intervalo

**Contexto:** os campos de intervalo aparecem com períodos predefinidos e sugerem que os personalizam.

**Ação técnica:** agrupar os campos `de`/`ate` e exibi-los por CSS (`:has()`) só quando "Intervalo escolhido" estiver selecionado, no Início e na comparação, com o mesmo padrão e sem mudar o tratamento dos valores. Acrescentar `novalidate` aos dois formulários. Ajustar os rótulos se o grupo tornar "(intervalo)" redundante.

**Critérios de aceite:**

- [ ] Nos quatro tipos predefinidos, os campos não aparecem nem recebem foco; com intervalo, aparecem ao carregar e ao trocar o seletor, sem recarregar a página.
- [ ] Um mês posterior a M deixado num campo oculto, digitado ou vindo da URL, não impede o envio de um período predefinido.
- [ ] Os limites dos cinco períodos e as mensagens de recusa do intervalo não mudam; período predefinido continua sem recusa, mesmo com `de`/`ate` na URL; intervalo posterior a M continua recusado pelo servidor.
- [ ] Sem JavaScript no cliente para essa exibição; sem suporte a `:has()`, o comportamento atual é preservado.
- [ ] Layout em celular e desktop sem rolagem horizontal.

### Item 4 — BL-010: seletor de ativo com busca e ordem alfabética

**Contexto:** listas longas sem busca e em ordem de inserção dificultam encontrar um ativo, sobretudo no celular.

**Ação técnica:** criar `ComboboxAtivo`, com a política de seleção de "Decisões e autoridades", e uma função única de ordenação pelo nome exibido. Usá-los no filtro de Lançamentos, no Novo lançamento e na Nova transferência, mantendo os `name` e valores enviados. Registrar o contrato do componente, inclusive a política de seleção, no DESIGN.md §6.8.

**Critérios de aceite:**

- [ ] Os três seletores listam os ativos em ordem alfabética pelo nome exibido, com "Todos os ativos" no topo do filtro.
- [ ] Digitar parte do nome filtra a lista em tempo real, sem diferenciar maiúsculas nem acentos.
- [ ] Teclado (setas, Enter, Esc, Home e End), toque com alvo de 44 px, foco visível, leitores de tela pelo padrão combobox e axe sem violações novas.
- [ ] O valor enviado é sempre o ID da última opção confirmada, ou vazio. Texto editado, sem correspondência ou não confirmado impede o envio com "Escolha um ativo da lista.", e nunca envia o ativo anterior.
- [ ] Esc, saída sem confirmar, valor inicial da URL e reset do formulário seguem a política de seleção; duas transferências consecutivas gravam os ativos escolhidos em cada uma.
- [ ] Os formulários enviam os mesmos campos (`name`) de antes; obrigatoriedade e mensagens de erro seguem o §6.8 e coincidem com as do servidor.
- [ ] Nenhuma dependência nova; nenhuma mudança em `ORDENS`, consultas ou banco.

## Arquivos afetados

Previsão, a confirmar pelo menor diff em cada issue:

- Item 1: `src/components/graficos/graficos.tsx`, um módulo novo de largura e margem em `src/components/graficos/`, `src/app/(app)/page.tsx`, `src/components/graficos/graficos.test.tsx` e `tests/e2e/eixo-patrimonio.spec.ts`.
- Item 2: `src/components/botoes.ts`, `src/components/login-panel.tsx`, `src/app/(app)/layout.tsx`, `src/components/navegacao.tsx`, `design-system/DESIGN.md` e testes de componente e e2e.
- Item 3: `src/app/(app)/page.tsx`, `src/app/(app)/benchmarks/comparacao/page.tsx`, `tests/e2e/inicio.spec.ts` e `tests/e2e/benchmarks.spec.ts`.
- Item 4: `src/components/combobox-ativo.tsx` (novo), `src/lib/telas/leituras.ts` (ordenação de apresentação), `src/app/(app)/lancamentos/page.tsx`, `src/app/(app)/lancamentos/novo/page.tsx`, `src/app/(app)/transferencias/page.tsx`, `src/components/formularios/novo-lancamento.tsx`, `src/components/formularios/nova-transferencia.tsx`, `design-system/DESIGN.md` e testes.
- `_project/cycles.md`, este plano e as tasks das issues em `_project/drafts/009_usabilidade_consistencia_visual/`.
- No encerramento, `_project/knowledge/KB-003_visao_produto_arquitetura.md`, se o novo componente ou os estados mudarem a descrição do produto, e a movimentação do ciclo para `executed/` pelo workflow `atualizar_docs`.

A fila do backlog terá atualização posterior e separada.

## Decomposição em issues e PRs

| Ordem | Issue proposta (a criar após aprovação e conferência do payload) | Escopo | PR |
| :-- | :-- | :-- | :-- |
| 1 | `[FIX] Alinhar a margem do gráfico patrimonial aos gráficos vizinhos` | Item 1 / BL-013 e seus testes | A primeira PR inclui o plano, a reserva em cycles e a task da issue |
| 2 | `[FIX] Uniformizar cursor e estados de interação dos botões` | Item 2 / BL-004 e seus testes | Própria |
| 3 | `[FIX] Mostrar os campos de intervalo só no período escolhido` | Item 3 / BL-003 e seus testes | Própria |
| 4 | `[FEATURE] Seletor de ativo com busca e ordem alfabética` | Item 4 / BL-010 e seus testes | A última PR inclui a documentação viva e o encerramento prospectivo |

Cada issue herda contexto, ação e critérios do item correspondente, sem ampliar o recorte. Uma branch por issue (`fix/issue-N` ou `feature/issue-N`), uma task `009_task_issue-N.md` e uma PR por issue. Commits `fix(issue-N): ...` ou `feat(issue-N): ...`. Os números serão os observados no GitHub. Não haverá PR documental própria do plano. A task da última issue terá `## Encerramento`.

## Dependências e blockers

Nenhuma dependência externa nova. Os IDs de origem já existem em main. Os itens 1 e 3 alteram `src/app/(app)/page.tsx`. O item 4 se beneficia dos estados do item 2 e precisa vir por último, porque leva o encerramento. A ordem proposta é sequencial, uma PR integrada antes da próxima autorização. A PR #91 (release) é independente e não bloqueia este ciclo. A rodada 1 pediu nova rodada; esta `v2` responde a R1-1 a R1-4 e aguarda a rodada 2. Aprovação do plano, criação das issues e autorizações de implementação estão pendentes.

## Riscos, suposições e rollback

- A estimativa de largura da margem pode divergir da fonte real. Ela será conservadora e conferida no e2e com a fonte carregada. Se subestimar, o teste falha antes do merge.
- Mudar a margem padrão pela regra comum poderia afetar a comparação de benchmarks. A regra vale só no Início, e a comparação entra na regressão.
- A razão de 3,01 de `border-strong` sobre `primary-subtle` está no limite. Se a revisão preferir folga, a alternativa é o fundo pressionado `surface-subtle` com deslocamento, sem token novo; nesse caso, o pressionado do secundário sem movimento coincidiria com o hover e entraria na exceção declarada.
- A razão do destrutivo pressionado depende da cor computada pelo `color-mix`. Ela é medida na implementação, com a regra de recuo já definida em "Decisões e autoridades".
- O suporte a `:has()` é amplo nos navegadores atuais. Sem ele, os campos aparecem como hoje, sem perda funcional.
- Com `novalidate`, um intervalo posterior a M deixa de ser barrado pelo navegador e passa a ser recusado pelo servidor, com a mensagem atual. É uma mudança de onde a mensagem aparece, não da regra.
- O reset automático do React depois de uma ação pode mudar em versões futuras. O componente escuta o evento `reset`, que cobre o reset explícito e o automático, e o e2e de transferências consecutivas protege o comportamento.
- Um combobox próprio exige cuidado de acessibilidade. O padrão da WAI-ARIA, o axe e o teste manual de teclado e leitor de tela reduzem o risco. Se a acessibilidade não se confirmar, o trabalho para e registra a evidência, sem trocar por biblioteca sem decisão.
- O filtro GET de Lançamentos passa a depender de JavaScript para a busca. Esta é uma suposição aceita no plano e a confirmar na revisão.
- Hipótese: mudança estritamente de apresentação e interação, sem regra financeira. Alterar essa hipótese exige nova triagem.
- Rollback: reverter a PR correspondente por nova PR com checks e aprovação de merge. Nenhuma alteração de dados precisa ser revertida.

## Sequência recomendada

1. Revisar formalmente este rascunho, registrar a rodada e o veredito e tratar os achados pelo fluxo autorizado.
2. Obter a aprovação humana posterior ao veredito apto; apresentar e conferir os payloads e criar as quatro issues conforme `criar_issues`.
3. Para cada issue, na ordem da decomposição: autorização própria, branch, task, implementação, gates e PR; aprovação específica do merge com checks verdes.
4. Na última PR, preparar o encerramento prospectivo: plano `Concluído`, tasks `Concluída`, pasta em `executed/`, cycles atualizado e bloco prospectivo `Concluído`. Até o merge, a situação efetiva é `Aguardando merge`.
5. Depois do merge da última PR, conferir a integração e os checks. Só com a integração comprovada, registrar na fila canônica o retorno de BL-003, BL-004, BL-010 e BL-013 conforme a cobertura real; publicá-lo separadamente quando autorizado.

## Referências

- `.agent/ai_behavior.md`; `_project/README.md`; `_project/cycles.md`.
- `.agent/workflows/rascunhar_plano.md`; `.agent/templates/plano_implementacao.md`.
- `.agent/workflows/revisar_plano.md`, `criar_issues.md`, `implementar_issue.md`, `atualizar_docs.md` e `gerenciar_backlog.md` (a ler no ponto de uso).
- `_project/backlog.md` em `811ff840a51da200bdff8f0591e11d9d95fd103f`: BL-003, BL-004, BL-010 e BL-013.
- `_project/decisions/ADR-004_governanca_proporcional_niveis.md`; `_project/decisions/ADR-005_graficos_svg_proprio.md`.
- `_project/knowledge/KB-003_visao_produto_arquitetura.md`; `design-system/DESIGN.md`.
- `_project/executed/008_legibilidade_patrimonio_resumo/008_plan.md` (margem e legibilidade do eixo patrimonial).
- Código e testes citados no baseline e na estratégia de testes.

## Rastreabilidade

| Campo | Valor |
| :-- | :-- |
| Issue(s) | [#94](https://github.com/EuThiagoAndrade/saldo-futuro/issues/94), [#95](https://github.com/EuThiagoAndrade/saldo-futuro/issues/95), [#96](https://github.com/EuThiagoAndrade/saldo-futuro/issues/96) e [#97](https://github.com/EuThiagoAndrade/saldo-futuro/issues/97) |
| PR(s) | [#98](https://github.com/EuThiagoAndrade/saldo-futuro/pull/98) (issue #94, integrada); [#99](https://github.com/EuThiagoAndrade/saldo-futuro/pull/99) (issue #95, integrada); [#100](https://github.com/EuThiagoAndrade/saldo-futuro/pull/100) (issue #96, integrada); [#101](https://github.com/EuThiagoAndrade/saldo-futuro/pull/101) (issue #97 e encerramento prospectivo) |
| Branch(es) | `fix/issue-94`; `fix/issue-95`; `fix/issue-96`; `feature/issue-97` |
| Destino após conclusão | `_project/executed/009_usabilidade_consistencia_visual/009_plan.md` |

## Aprovação e preparação das issues

Em 2026-10-20, depois do veredito `APTO COM RESSALVAS` da rodada 2 sobre a `v2`, o responsável declarou: "aprovo o plano do ciclo 009". O bloco anterior apontava a ressalva R2-1 para conferência, e a resposta à rodada 1 explicava as consequências. A aprovação vale para a `v2` e aceita a exceção declarada em R2-1: no principal, com mouse e movimento reduzido, o pressionado coincide com o hover. Com isso, a cobertura prevista de BL-004 é integral. A exceção não pode ser ampliada na implementação. Se o recuo condicional do destrutivo for necessário, ele deve ser reconciliado com o aceite antes do merge. O corpo técnico e os pareceres ficam preservados; este registro marca o estado e prepara a criação das issues, sem nova versão técnica.

O ciclo permanece em `Planejamento` até a primeira entrega autorizada. A aprovação não autoriza implementação nem merge. Modo contínuo permanece `—`.

Os payloads abaixo seguem a ordem dos Issue Forms `.github/ISSUE_TEMPLATE/bug_report.yml` (itens 1 a 3) e `feature_request.yml` (item 4), lidos junto com `.agent/workflows/criar_issues.md`. Pela barreira do workflow, sem modo contínuo, o payload é apresentado e a criação aguarda a confirmação do responsável. Antes da preparação, consultas por título em todos os estados (`gh issue list --state all --search`) não encontraram issue correspondente. Nenhuma issue foi criada nesta etapa.

| Unidade | Issue observada | Chave lógica |
| :-- | :-- | :-- |
| Item 1 / BL-013 | [#94](https://github.com/EuThiagoAndrade/saldo-futuro/issues/94) | `EuThiagoAndrade/saldo-futuro + 009 + criar_issues + fix/BL-013 + v2` |
| Item 2 / BL-004 | [#95](https://github.com/EuThiagoAndrade/saldo-futuro/issues/95) | `EuThiagoAndrade/saldo-futuro + 009 + criar_issues + fix/BL-004 + v2` |
| Item 3 / BL-003 | [#96](https://github.com/EuThiagoAndrade/saldo-futuro/issues/96) | `EuThiagoAndrade/saldo-futuro + 009 + criar_issues + fix/BL-003 + v2` |
| Item 4 / BL-010 | [#97](https://github.com/EuThiagoAndrade/saldo-futuro/issues/97) | `EuThiagoAndrade/saldo-futuro + 009 + criar_issues + feature/BL-010 + v2` |

### Payload 1 — BL-013

**Título:** `[FIX] Alinhar a margem do gráfico patrimonial aos gráficos vizinhos`

**Problema observado**

No Início, a evolução patrimonial usa margem esquerda fixa de 144 unidades, enquanto a rentabilidade mensal e a Base 100 usam a margem padrão de 70. A área de grade e curva do patrimônio começa mais à direita que a dos gráficos vizinhos, com menos espaço útil para a série.

**Como reproduzir**

1. Usar somente dados fictícios no ambiente local.
2. Abrir o Início com evolução patrimonial de R$ 1.200.000 a R$ 1.260.000 e meses com rentabilidade.
3. Comparar a coordenada inicial da grade dos três gráficos: 144 no patrimônio e 70 na rentabilidade mensal e na Base 100.

**Comportamento esperado**

Entregar integralmente o Item 1 e a estratégia de testes da `v2` aprovada do ciclo 009, conforme ADR-005, DESIGN.md e os limites de legibilidade do ciclo 008. O Início calcula uma margem esquerda comum para patrimônio, rentabilidade mensal e Base 100: o maior valor entre 70 e a largura estimada do rótulo mais longo mais 6. A estimativa é conservadora e roda no servidor. A margem é limitada para manter pelo menos 160 unidades de curva no viewBox de 360. `GraficoBarras` passa a aceitar `margemEsquerda`. Com valores comuns, os três gráficos começam em 70; com rótulos longos, inclusive os extremos do ciclo 008, recuam juntos, sem corte nem sobreposição. A comparação de benchmarks mantém a margem padrão. Tabelas exatas, ocultação e lacunas N/D não regridem.

**Impacto e evidências**

BL-013 e as rodadas 1 e 2 do plano documentam o desalinhamento e o orçamento geométrico. As medições de texto da revisão não equivalem ao e2e da aplicação. G1, G2 e G4 não se aplicam; G3 se aplica, com dados exclusivamente fictícios. Executar os gates de governança, lint, tipos, testes, build e e2e do plano, inclusive a medição real dos rótulos dos três gráficos com a fonte carregada, e registrar as evidências reais na task. A primeira PR inclui o plano, cycles e a task. Branch `fix/issue-N`, task `009_task_issue-N.md` e uma PR para esta issue. A implementação depende de autorização específica depois da criação.

**Trilha**

Normal (ciclo com plano).

**Elegibilidade da trilha curta**

Não se aplica.

**Ciclo e plano relacionados**

Ciclo 009 (leve), BL-013 — `_project/drafts/009_usabilidade_consistencia_visual/009_plan.md`, `v2` aprovada em 2026-10-20, Item 1.

### Payload 2 — BL-004

**Título:** `[FIX] Uniformizar cursor e estados de interação dos botões`

**Problema observado**

Os botões nativos mostram o cursor padrão, enquanto os links de ação mostram ponteiro. Os botões secundário e de texto não reagem ao hover, e nenhum botão mostra o estado pressionado. Três botões com classes próprias ("Ocultar valores", "Mais" e "Fechar") e as bases do login têm o mesmo problema.

**Como reproduzir**

1. Usar somente dados fictícios no ambiente local.
2. Passar o mouse sobre os botões de Lançamentos, do cabeçalho e da navegação: o cursor permanece o padrão, e secundário e texto não mudam.
3. Pressionar qualquer botão, com e sem `prefers-reduced-motion`: não há sinal de pressão.

**Comportamento esperado**

Entregar integralmente o Item 2 e a estratégia de testes da `v2` aprovada, conforme DESIGN.md §§2.2, 6.9 e 7:

- cursor de ponteiro em todo `button` habilitado; desabilitado com `not-allowed`, sem reação;
- hover `surface-subtle` no secundário e no de texto;
- pressionado com fundo diferente do repouso: `primary-hover` no principal, `primary-subtle` no secundário, no de texto e nos três botões com classes próprias, e `loss` a 90% no destrutivo;
- deslocamento de 1 px só com `motion-safe:`;
- nenhum token novo; razões novas registradas no §2.2; contraste do destrutivo pressionado medido com a cor computada.

Exceção aceita na aprovação (R2-1): no principal, com mouse e movimento reduzido, o pressionado coincide com o hover. Se o destrutivo ficar abaixo de 4,5:1, o recuo previsto no plano deve ser reconciliado com o aceite antes do merge.

**Impacto e evidências**

BL-004 e as rodadas 1 e 2 documentam o inventário e as razões calculadas. G1, G2 e G4 não se aplicam; G3 se aplica. O e2e enumera todos os botões visíveis e habilitados das telas e exige `cursor: pointer` computado. Hover e pressão são simulados com e sem movimento reduzido, e o axe não pode ter violações novas. Executar todos os gates do plano e registrar as evidências reais na task. Branch `fix/issue-N`, task `009_task_issue-N.md` e uma PR. A implementação vem depois da integração da issue anterior, com autorização própria.

**Trilha**

Normal (ciclo com plano).

**Elegibilidade da trilha curta**

Não se aplica.

**Ciclo e plano relacionados**

Ciclo 009 (leve), BL-004 — `_project/drafts/009_usabilidade_consistencia_visual/009_plan.md`, `v2` aprovada em 2026-10-20, Item 2 e ressalva R2-1 aceita.

### Payload 3 — BL-003

**Título:** `[FIX] Mostrar os campos de intervalo só no período escolhido`

**Problema observado**

Nos filtros de período do Início e da comparação de benchmarks, os campos "De (intervalo)" e "Até (intervalo)" ficam visíveis com os períodos predefinidos. Isso sugere que eles personalizam mês, ano, 12 meses ou desde o início, o que não acontece.

**Como reproduzir**

1. Usar somente dados fictícios no ambiente local, com último mês fechado em março de 2026.
2. Abrir o Início ou a comparação com o período "Ano": os campos de intervalo continuam visíveis.
3. Escolher "Intervalo escolhido", digitar abril de 2026 em "Até", trocar para "Ano" e enviar.

**Comportamento esperado**

Entregar integralmente o Item 3 e a estratégia de testes da `v2` aprovada:

- os campos de intervalo só aparecem com "Intervalo escolhido", por CSS (`:has()`), ao carregar e ao trocar o seletor, sem JavaScript e com o mesmo padrão nas duas telas;
- os dois formulários recebem `novalidate`, para que um mês posterior a M num campo oculto não impeça o envio de um período predefinido;
- o `max` permanece como limite do seletor nativo, e a validação do intervalo fica no servidor, como hoje;
- `limitesDoPeriodo`, os valores iniciais dos campos e as mensagens de recusa não mudam;
- sem suporte a `:has()`, os campos aparecem como hoje.

**Impacto e evidências**

BL-003 e as rodadas 1 e 2 documentam o problema e a reprodução da validação de campo oculto (achado R1-1). G1, G2 e G4 não se aplicam; G3 se aplica. O e2e nas duas telas cobre:

- visibilidade e foco nos cinco tipos de período;
- mês posterior a M, troca para cada predefinição e clique em enviar;
- comparação carregada com mês futuro na URL;
- volta ao intervalo com a recusa do servidor;
- CR-51 inalterado, em celular e desktop.

Executar todos os gates e registrar as evidências reais na task. Branch `fix/issue-N`, task `009_task_issue-N.md` e uma PR. A implementação vem depois da integração da issue anterior, com autorização própria.

**Trilha**

Normal (ciclo com plano).

**Elegibilidade da trilha curta**

Não se aplica.

**Ciclo e plano relacionados**

Ciclo 009 (leve), BL-003 — `_project/drafts/009_usabilidade_consistencia_visual/009_plan.md`, `v2` aprovada em 2026-10-20, Item 3.

### Payload 4 — BL-010

**Título:** `[FEATURE] Seletor de ativo com busca e ordem alfabética`

**Contexto**

Os seletores de ativo usam `select` nativo, sem busca. O filtro de Lançamentos e a Nova transferência listam os ativos na ordem de leitura do banco, e só o Novo lançamento ordena por nome. Com carteiras de dezenas de ativos, localizar um ativo no celular exige rolagem longa. Origem: BL-010.

**Escopo**

Dentro:

- componente cliente próprio `ComboboxAtivo`, no padrão combobox da WAI-ARIA 1.2, com busca por substring que não diferencia maiúsculas nem acentos;
- função única de ordenação pelo nome exibido (`localeCompare` em `pt-BR`, com "Em trânsito" na ordem);
- uso no filtro de Lançamentos (com "Todos os ativos"), no Novo lançamento e na Nova transferência (origem e destino);
- política de seleção da `v2`: confirmação só por clique, toque ou Enter; edição que desfaz a seleção; Esc; saída sem confirmar; validade por `setCustomValidity`; valor inicial da URL; reset pelo evento `reset`; nomes iguais;
- contrato no DESIGN.md §6.8.

Fora: outros seletores, `ORDENS`, consultas, banco, dependências novas e submissão automática.

**Critérios de aceite**

- Ordem alfabética pelo nome exibido nos três seletores, com "Todos os ativos" no topo do filtro.
- Busca em tempo real sem diferenciar maiúsculas nem acentos.
- Teclado (setas, Enter, Esc, Home e End), toque com alvo de 44 px, foco visível, padrão combobox e axe sem violações novas.
- Valor enviado sempre igual ao ID da última opção confirmada, ou vazio. Texto não confirmado impede o envio com "Escolha um ativo da lista.", e nunca envia o ativo anterior.
- Esc, saída sem confirmar, valor inicial da URL e reset seguem a política. Duas transferências consecutivas gravam os ativos escolhidos.
- Mesmos `name` enviados; obrigatoriedade e mensagens do §6.8 iguais às do servidor.
- Nenhuma dependência nova; nenhuma mudança em `ORDENS`, consultas ou banco.

**Ciclo e plano relacionados**

Ciclo 009 (leve), BL-010 — `_project/drafts/009_usabilidade_consistencia_visual/009_plan.md`, `v2` aprovada em 2026-10-20, Item 4.

**Dependências, riscos e autorizações**

Depende da integração das três issues anteriores, especialmente dos estados de botão de BL-004. Riscos declarados no plano: acessibilidade do componente próprio, dependência de JavaScript para a busca no filtro GET de Lançamentos e reset automático do React. G1, G2 e G4 não se aplicam; G3 se aplica, com nomes de ativo fictícios (por exemplo, "Ação Fictícia"). Executar todos os gates do plano e registrar as evidências reais na task. Esta última PR inclui a documentação viva e o encerramento prospectivo: task com `## Encerramento`, plano e tasks em estados finais, pasta em `executed/` e cycles atualizado. Branch `feature/issue-N`, task `009_task_issue-N.md` e uma PR. A implementação exige autorização própria, e cada merge exige aprovação específica e checks verdes.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 009 (leve)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 009 + atualizar_docs + encerramento-prospectivo/issue-97 + e5f1f1a`
- `effect_class`: `remote_mutation`
- `state_before`: plano `v2` Em Execução, ciclo Em execução, PR #98, #99 e #100 integradas com aprovação e checks verdes; issue #97 autorizada e implementada em `feature/issue-97`.
- `state_after`: encerramento prospectivo preparado: plano Concluído, tasks Concluída, pasta em `executed/`, `cycles.md` Concluído, DESIGN.md e KB-003 atualizados; antes da integração da última PR, situação efetiva Aguardando merge.
- `result`: `executed`
- `evidence`: `v2` aprovada em 2026-10-20; autorização da #97; task #97 com unitários, e2e e axe; tasks #94 a #96 reconciliadas com as PRs integradas; governança sem erros ou avisos; histórico abaixo preservado.
- `blockers`: nenhum no escopo; checks remotos verdes e aprovação específica do merge pendentes; retorno de BL-013, BL-004, BL-003 e BL-010 à fila e sua publicação dependem de autorização separada.

### Handoff histórico de criação das issues

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 009 + criar_issues + BL-013/BL-004/BL-003/BL-010 + v2`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: plano `v2` `Aprovado`, nenhuma issue criada, payloads aguardando confirmação / quatro issues abertas (#94 a #97), ciclo 009 em `Planejamento`
- `result`: `executed`
- `evidence`: confirmação humana "Confirmo a criação das 04 issues com os payloads 1 a 4" em 2026-10-20; `gh issue list --state all --search` sem correspondentes antes da criação; issues #94, #95, #96 e #97 conferidas no GitHub com os títulos dos payloads
- `blockers`: nenhum; a implementação depende de autorização específica por issue


## Revisão crítica

### Rodada 1

- **Autor:** não identificado no rascunho `v1`; ferramenta e modelo não registrados no handoff de origem.
- **Revisor:** Codex, GPT-6 (variante exata não exposta nesta sessão).
- **Data e autorização:** 2026-10-20; pedido humano "revise o plano do ciclo 009". Revisão formal com registro local; sem aprovação do plano, correção do corpo, implementação ou publicação.
- **Base conferida:** `main` local, `origin/main` e `refs/heads/main` remoto em `811ff840a51da200bdff8f0591e11d9d95fd103f`; remoto conferido por `git ls-remote`. Plano `v1` inicialmente não versionado e em `Rascunho`; `_project/cycles.md` já modificado com ciclo 009 em `Planejamento`; `.agent/lessons_learned.md` com alteração alheia preservada. `gh issue list --state open`: nenhuma issue; `gh pr list --state open`: somente a PR #91 de release, independente do ciclo.
- **Identidade da origem (UTF-8/LF):** SHA-256 do plano antes da revisão: `c7cecf085e00abfce2604380d5fb7eef2fc74f6465a8f5c5e6f8936f072ed5c8`; do corpo entre `## Problema e contexto` e `## Próximo passo`: `257fb134e5b3eb7d488c2d51c0c37151b71dc2a553c0d431397b9f06ef138826`; do handoff original de `rascunhar_plano`: `d1320c799d4f720ae2d6566becb53f669abaa8a53f882aac0423e6f118ea08ae`. Corpo e handoff original preservados.
- **Template e autoridades:** `.agent/templates/plano_implementacao.md`, `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, workflows `triar`, `revisar_plano` e `criar_issues`, KB-003, ADR-004, ADR-005, DESIGN.md e critérios pertinentes do ciclo 008. Snapshot do backlog lido no commit declarado. Código, estilos e testes citados abaixo conferidos somente por leitura.

#### Achados

- **R1-1 — bloqueador: ocultar os meses por CSS mantém uma validação que pode impedir o envio do período predefinido.** "BL-003 — exibição condicional", Item 3 e sua estratégia de testes preservam os campos e seu tratamento, escondendo-os por `:has()`. Nas duas páginas os meses têm `max={M}`. Se a pessoa digitar um mês posterior a M no intervalo e depois escolher "Ano", o campo fica invisível, mas sua validade continua impedindo a submissão; na comparação também ocorre ao carregar uma URL predefinida com `ate` posterior a M, pois o valor da URL é preservado. A validação acontece antes de o servidor poder ignorar o campo. Reprodução mínima em Chrome headless, via Playwright do projeto, com M fictício `2026-03`, `ate=2026-04` e troca de intervalo para ano: `display: none`, `willValidate: true`, `rangeOverflow: true`, `form.checkValidity(): false`. O teste proposto com datas invertidas, mas individualmente dentro de `max`, não detecta esse caso. O [HTML Standard — validação de formulários](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constraint-validation) prevê inclusive o caso de controle inválido sem renderização.

  **Correção esperada:** definir como os campos inativos deixam de bloquear o envio, conciliando a solução com as restrições de ausência de JavaScript, envio dos campos e validação atual do intervalo. A solução deve manter a validação financeira no servidor. Acrescentar teste nas duas telas que preencha um mês além de M, troque para cada predefinição e clique efetivamente em enviar, além da comparação carregada com mês futuro na URL. Conferir também a volta ao intervalo e a recusa existente. Não basta navegar diretamente para uma URL válida ou verificar apenas a visibilidade.

- **R1-2 — bloqueador: o contrato do combobox não fecha a relação entre texto, seleção válida e reset do formulário.** "BL-010 — combobox" propõe um campo editável e um `input type="hidden"` com o ID, mas só remete ao DESIGN.md §6.8 para obrigatoriedade; esse parágrafo descreve a apresentação do erro e não define quando uma seleção existe. Falta decidir o que ocorre ao selecionar um ativo, editar/apagar seu texto e sair ou enviar sem confirmar outra opção. Sem essa regra, o texto pode indicar um ativo e o ID oculto continuar sendo de outro. O `hidden` não participa da validação nativa; mesmo `required` no campo de texto só exige texto, não um ID selecionado. Em reprodução mínima, texto preenchido e ID oculto vazio resultam em `form.checkValidity(): true`. Isso é uma lacuna do contrato planejado, não um defeito já observado num componente implementado. O [padrão combobox da W3C](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) admite diferentes políticas de confirmação; listar roles e teclas não escolhe uma delas.

  Há também um consumidor concreto de reset: `FormNovaTransferencia` chama `formulario.current?.reset()` quando `estado.ok`. A migração de selects nativos para estado React precisa manter texto, ID e opção ativa sincronizados nesse reset, e conservar os valores iniciais vindos da URL no filtro GET. **Correção esperada:** explicitar a política de confirmação e de edição posterior, a validação de ID permitido, o tratamento de texto sem correspondência e o comportamento no reset. Incluir testes de selecionar A → editar para B sem selecionar → enviar; apagar seleção obrigatória; Esc/saída sem confirmação; filtro com seleção inicial e retorno a "Todos os ativos"; e duas transferências consecutivas após o reset de sucesso. Texto e ID enviados devem permanecer coerentes, sem atribuir uma operação ao ativo anterior por engano.

- **R1-3 — ressalva: a cobertura técnica de BL-004 deixa de fora botões com classes próprias.** O escopo e o aceite exigem ponteiro em todo botão habilitado, mas a ação técnica do Item 2 nomeia somente `botoes.ts` e `login-panel.tsx`. `src/app/(app)/layout.tsx` contém "Ocultar valores" com classes próprias; `src/components/navegacao.tsx` contém "Mais" e "Fechar", também sem consumir essas bases. Alterar as duas bases previstas não lhes adiciona cursor ou pressão. **Ajuste recomendado:** incluir esses consumidores no inventário, nos arquivos previstos e na validação de BL-004, preservando sua composição visual. O teste de uma tela por variante não prova a cobertura dos controles que não usam as variantes.

- **R1-4 — ressalva: a exceção de movimento reduzido contradiz o aceite de pressão em todas as variantes.** A decisão de BL-004 declara explicitamente que o destrutivo não terá feedback com `prefers-reduced-motion`, pois seu único efeito é o deslocamento protegido por `motion-safe:`. O Item 2 exige estado pressionado nas quatro variantes e respeito a essa preferência, sem delimitar a exceção. A limitação está visível no texto, mas o aceite ainda promete mais que a decisão. **Ajuste recomendado:** prever um sinal de pressão sem movimento com tokens existentes ou tornar a exceção explícita nos critérios e na cobertura declarada do backlog. Não afirmar atendimento integral de um critério que a própria solução exclui.

#### Itens atendidos e limites da revisão

- Nível leve, autorização inicial e ausência de modo contínuo coerentes com o escopo; G1, G2 e G4 sem mudança prevista e G3 aplicável, com dados exclusivamente fictícios. Não houve acesso a dados financeiros em `local/` nem uso de produção.
- Origem de BL-003, BL-004, BL-010 e BL-013 confere com o snapshot declarado, com IDs presentes em main. A seleção mantém os itens disponíveis; o retorno ao backlog depois da integração e sua publicação separada estão corretamente delimitados.
- Objetivo, quatro entregas, não-escopo, sequência de uma PR integrada antes da seguinte, plano na primeira PR, encerramento prospectivo na última e aprovações próprias de merge seguem o ciclo leve. Nenhum número de issue foi antecipado.
- Baseline dos filtros, `ORDENS.ativos = ["id"]`, ordenação já existente no novo lançamento, nomes de apresentação, quatro variantes e geometria dos gráficos conferidos no código. A ADR-005 rege os gráficos; não é uma decisão sobre comboboxes, cuja justificativa deve continuar no contrato próprio proposto.
- BL-013 preserva a comparação de benchmarks e prevê regressão de ocultação, tabelas e lacunas. O orçamento geométrico é coerente para os exemplos monetários: 360 − 56 − 144 = 160 unidades; com IBM Plex Sans Regular carregada e tamanho 11, o exemplo fictício `R$ 1,22 mi` mede aproximadamente 54 unidades e o extremo `−R$ 90.071.992,5474 mi` aproximadamente 126, cabendo com afastamento 6 nas margens propostas. São medições de texto em página estática, sem implementação da margem comum nem prova de todos os eixos. A validação final dos rótulos efetivamente gerados permanece obrigatória.
- Testes de governança executados nesta revisão: `node --test scripts/validate-governance.test.mjs`, 48/48 aprovados. As reproduções de HTML e as medições usaram Chrome headless via Playwright, em memória, sem gravar artefatos ou alterar a aplicação. Não foram executados testes completos da aplicação, pois esta revisão altera somente o parecer e o estado documental.

**Veredito: `REQUER NOVA RODADA`.** Dois bloqueadores (R1-1 e R1-2) e duas ressalvas (R1-3 e R1-4). Plano `v1` em `Em Revisão`; revisão formal `Em andamento`; aprovação humana permanece `Pendente`. A resposta do autor deve tratar cada achado, incrementar a versão e preservar esta rodada. Não há oscilação ou ausência de progresso a avaliar na primeira rodada.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 009 + revisar_plano + 009_plan/rodada-1 + v1`
- `effect_class`: `local_mutation`
- `state_before`: ciclo 009 em `Planejamento`; plano `v1` em `Rascunho`; revisão e veredito pendentes; próximo passo `Aguardando revisão (rodada 1)`.
- `state_after`: ciclo 009 permanece em `Planejamento`; plano `v1` em `Em Revisão`; revisão formal `Em andamento`; veredito `REQUER NOVA RODADA`; aprovação humana `Pendente`; próximo passo `Aguardando correções (rodada 1) — ciclo 009 (leve)`.
- `result`: `executed`
- `evidence`: pedido humano desta revisão, hashes de origem, inspeções e reproduções registradas nesta rodada; testes de governança 48/48; corpo e handoff de redação preservados. Alterações limitadas à revisão, status, veredito e próximo passo exigido pelo workflow; nenhum commit, issue, PR ou publicação.
- `blockers`: R1-1 e R1-2 em aberto; correção do plano depende de "corrija o plano do ciclo 009", conforme o limite entre revisor e autor em `.agent/workflows/revisar_plano.md`.

### Resposta do autor à rodada 1 — v2

- **Autor:** Claude Code (app desktop), Claude Opus 5.5 (`claude-opus-5-5`), também autor da `v1`.
- **Data e autorização:** 2026-10-20; pedido humano "corrija o plano do ciclo 009". Correção documental no workflow `rascunhar_plano`; nenhuma implementação, issue, publicação ou aprovação.
- **R1-1 — corrigido.** Confirmado em Chromium, com o Playwright do projeto, numa página estática em memória:
  - sem `novalidate`, o campo oculto com `rangeOverflow` impede o envio;
  - com `novalidate`, o envio ocorre.

  O plano passa a usar `novalidate` nos dois formulários de período. Isso concilia as restrições da revisão: sem JavaScript, campos ainda enviados e validação do intervalo mantida no servidor, que já recusa intervalos posteriores a M, invertidos ou incompletos. O `max` permanece como limite do seletor nativo. Os testes de BL-003 agora cobrem: mês posterior a M digitado e troca para cada predefinição com clique em enviar; comparação carregada com mês futuro na URL e enviada; volta ao intervalo com a recusa do servidor. Os critérios e os riscos do Item 3 foram atualizados.
- **R1-2 — corrigido.** "Decisões e autoridades" define a política de seleção: confirmação só por clique, toque ou Enter sobre uma opção; edição posterior que desfaz a seleção na hora; Esc com lista aberta e fechada; saída sem confirmar; validade nativa por `setCustomValidity` para texto sem seleção; mensagens iguais às do servidor; "Todos os ativos" e valor inicial da URL no filtro; reset pelo evento `reset` do formulário; nomes iguais. Confirmado em Chromium que texto preenchido com ID oculto vazio passa em `checkValidity()` sem a regra e é barrado com ela. Os testes e critérios do Item 4 cobrem os casos pedidos: A editado para B, obrigatório apagado, Esc, saída, filtro com seleção inicial e retorno a "Todos os ativos", e duas transferências consecutivas após o reset.
- **R1-3 — corrigido.** Inventário de `button` com classes próprias incluído no baseline, no escopo, na ação técnica, nos arquivos e nos critérios do Item 2: "Ocultar valores" (`layout.tsx`), "Mais" e "Fechar" (`navegacao.tsx`), além das duas bases do login. O e2e passa a enumerar todos os botões visíveis e habilitados das telas e a exigir `cursor: pointer` computado. O `summary` dos gráficos já tem ponteiro e não é botão.
- **R1-4 — corrigido.** O pressionado passa a ter um sinal de cor em todas as variantes. No destrutivo, `loss` a 90% composto em `surface` dá cerca de 5,24 com `on-primary`, a recalcular com a cor computada. A regra de recuo é registrada caso a razão fique abaixo de 4,5. Resta uma exceção, agora explícita no critério do Item 2: no principal, com mouse e movimento reduzido, o pressionado coincide com o hover, como o DESIGN.md já define para `primary-hover`. A razão nova `text-secondary`/`primary-subtle` (6,69) foi acrescentada. A cobertura integral de BL-004 depende de essa exceção ser aceita na aprovação do plano. Se não for, ela entra como Restante no retorno ao backlog, como agora diz a tabela de origem.
- **Histórico e limites:** rodada 1 preservada integralmente. O veredito do cabeçalho continua sendo o da `v1`; a `v2` aguarda a rodada 2 e não recebe veredito do autor. As reproduções usaram página estática, sem alterar a aplicação, e não substituem os e2e da implementação.

### Rodada 2

- **Autor:** Claude Code (app desktop), Claude Opus 5.5 (`claude-opus-5-5`), conforme a resposta à rodada 1.
- **Revisor:** Codex, GPT-6 (variante exata não exposta nesta sessão).
- **Data e autorização:** 2026-10-20; novo pedido humano "revise o plano do ciclo 009", sobre a `v2`. Autoriza o parecer e seu registro local; não aprova o plano nem autoriza implementação ou publicação.
- **Base conferida:** `main` local e remoto em `811ff840a51da200bdff8f0591e11d9d95fd103f`, remoto conferido por `git ls-remote`. Ciclo 009 em `Planejamento`, plano `v2` em `Em Revisão`, próximo passo inicial `Aguardando revisão (rodada 2)`. Plano ainda não versionado; alterações preexistentes em `_project/cycles.md` e `.agent/lessons_learned.md` preservadas. Consultas `gh`: nenhuma issue aberta e somente a PR #91 de release aberta, independente deste ciclo.
- **Identidade da origem (UTF-8/LF):** SHA-256 da `v2` antes desta revisão: `e72e4b7661fcf88451e7042e9e54f30b2f7091d489488289179310b2603e22d2`; do corpo entre `## Problema e contexto` e `## Próximo passo`: `d01921a43363d00106f3f6820a589a01309fae54517893d7effb26272b57284d`; do histórico desde `### Rodada 1` até antes de `## Pós-mortem

- **Data de conclusão:** 2026-10-20 (prospectiva, efetiva após o merge da última PR)
- **Desvios:** sem desvio de escopo. Os "testes de componente" do plano viraram testes unitários da política de seleção (funções puras) mais e2e, porque o projeto não tem jsdom e o plano veda dependência nova. O e2e completo da última entrega teve uma falha de infraestrutura do runner Windows (worker encerrado, teste isolado aprovado), como no ciclo 008.
- **Lições comprovadas:** a regra global de movimento reduzido (`transition-duration` de 0,01 ms) faz a cor computada atrasar um quadro, então testes de estilo precisam esperar o quadro; `getByRole("option")` também casa as opções de `select` nativos, e testes de combobox devem escopar a lista; a largura medida de um rótulo SVG varia com o viewport, então a estimativa conservadora precisa de folga e do e2e que a compara com a caixa medida. Referências e evidências nas tasks.
