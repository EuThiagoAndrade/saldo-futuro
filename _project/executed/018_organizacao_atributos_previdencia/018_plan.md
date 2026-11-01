# Plano de Implementação — Organização dos atributos e Previdência como veículo

> **Ciclo:** `018`
> **Status:** `Concluído`
> **Versão:** `v1`
> **Data de criação:** 2026-10-30
> **Última atualização:** 2026-10-31
> **Tipo:** `feature`
> **Prioridade:** `P2`
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 018" em 2026-10-30
> **Autorização do rascunho:** "autorizo o rascunho do plano do ciclo 018" em 2026-10-30
> **Modo contínuo:** `—`
> **Autorização de implementação da issue #182:** "Autorizo a #182" em 2026-10-31, em resposta à pergunta "Autoriza a implementação da issue #182?"; execução iniciada na branch `feature/issue-182`, task `018_task_issue-182.md`.
> **Autorização de implementação da issue #183:** "Autorizo a #183" em 2026-10-31, em resposta à pergunta "Autoriza a implementação da issue #183?", depois da ação externa da #182 relatada; execução iniciada na branch `feature/issue-183`, task `018_task_issue-183.md`.
> **Aprovação:** "aprovo o plano do ciclo 018" em 2026-10-31, depois do veredito APTO PARA APROVAÇÃO da Rodada 1; propostas P3 a P6 confirmadas com "Confirmo as quatro" no mesmo dia (ver "Registro de aprovação").
> **Revisão formal:** `Concluída`
> **Veredito da revisão:** `APTO PARA APROVAÇÃO`
> **Aprovação humana pós-revisão:** `Aprovada em 2026-10-31`
> **handoff_schema_version:** `2`

## Problema e contexto

Ideação: _project/ideations/018_organizacao_atributos_previdencia.md

## Objetivo

Reorganizar os atributos complementares dos ativos por assunto, no cadastro, na edição, no "Ver detalhes" e no "Filtrar", com listas suspensas de múltipla escolha para veículo e indexador e um filtro que, ao aplicar, fecha e mostra os resultados. Transformar a Previdência em opção do veículo, convertendo os dados gravados de todos os usuários sem perda (decisões D13 a D18 da ideação, achados R5-1 a R5-7 do ciclo `017`).

## Origem no backlog

Não se aplica. A origem é a decisão do responsável depois da Rodada 5 do ciclo `017`, herdada da ideação.

## Contexto e baseline

- Base: `main` = `origin/main` = `8cba4ac2dadc825057af777456530a9cbc66da6c`, com as entregas do `017` (#175, #177 e #178) integradas e em produção; ação externa da migração `20261031000721` relatada. Release 0.13.0 (PR #176) aberta.
- Registros do `017` ainda sem commit na branch local `chore/cycle-017-closure` (plano v5 com as emendas não adotadas, Rodada 5 e decisão do responsável). O encerramento do `017` é independente deste plano e pode correr em paralelo; este plano não altera nenhum arquivo do `017`.
- Código: catálogos e leitura do formulário em `src/lib/telas/detalhes-ativo.ts`; "Mais detalhes" em `src/components/formularios/detalhes-ativo.tsx` (caixas abertas, blocos sem título, indicador Previdência em rádios); leitura em `src/lib/telas/leituras.ts`; filtros em `src/lib/telas/filtros-ativos.ts` e `src/components/ativos-consulta.tsx`; página em `src/app/(app)/ativos/page.tsx`. No banco, `private.canonizar_veiculos_acesso` e a restrição `ativos_veiculos_acesso_check` (migração `20261031000721`); `editar_ativo_com_nome` grava `previdencia = p_previdencia` sem condição (`20261027220000`), e as funções novas repassam o parâmetro.
- Testes que gravam ou filtram o indicador: pgTAP `08_metadados_ativos`, `09_taxonomia_ativos`, `11_concorrencia_nome` e `12_atributos_ativos`; e2e `ativos-detalhes.spec.ts` e `ativos-consulta.spec.ts`; unitários `detalhes-ativo.test.ts`, `filtros-ativos.test.ts` e a fixture tipada de `analises-inicio.test.ts`.
- Nenhum dado real foi lido.

## Escopo

### Dentro do escopo

- Quatro grupos com título (D13) no cadastro, na edição, no "Ver detalhes" e no "Filtrar".
- Componente de lista suspensa de múltipla escolha (D14) para veículo e indexador, no formulário e no filtro.
- "Filtrar" que fecha ao aplicar, contador, "Limpar filtros" ao lado, opções em uso, exclusividade só de "Não informado" e campos do prazo condicionais (D14 a D16).
- Dica para títulos híbridos no cadastro (D16) e a frase de D9 só no "Mais detalhes" (D17).
- Previdência como veículo (D18): código `previdencia` no catálogo, indicador fora das telas, migração única de conversão e congelamento, aplicada depois do deploy da tela (alternativa B da ideação, P1).
- Ajuste dos testes afetados, ensaio de upgrade, roteiro de teste local por PR, roteiro da ação externa e da verificação em produção, DESIGN.md, KB-002, KB-003, KB-004 4.1 e nota de `/novidades`.

### Fora do escopo

- Qualquer cálculo; mudanças em eventos, saldos, fechamento, marcas do Início e nos outros três indicadores.
- Remoção física da coluna `previdencia` e do parâmetro `p_previdencia` (P5, pergunta 3).
- Novos atributos, mudanças nos catálogos de indexador e de regime, preservar filtros depois de editar, faixa de prazo com dois limites.

## Decisões e autoridades

Autoridades: `.agent/ai_behavior.md`, `_project/README.md`, KB-002, KB-003, KB-004 e `design-system/DESIGN.md`. Template `.agent/templates/plano_implementacao.md`; workflow `.agent/workflows/rascunhar_plano.md`. Decisões de produto D13 a D18 herdadas da ideação, tomadas pelo responsável na conversa de 2026-10-30.

### Propostas para revisão

**P1 — Transição da Previdência (alternativa B da ideação; fecha R5-1).** A tela vai primeiro e a migração depois:

1. **Tela nova (Item 1), antes de qualquer conversão.** O catálogo do código passa a ter `previdencia` ("Previdência (PGBL ou VGBL)") entre `etf` e `plano_contrato`. O indicador Previdência sai das telas: o formulário de edição envia, num campo oculto `previdencia`, o valor gravado do ativo, sem alterá-lo, e o cadastro não o envia (nulo). Assim, nenhuma edição grava nulo por cima de um "Sim" ainda não convertido (caminho (b) de R5-1). Como a tela antiga deixa de existir antes da conversão, não há tela que grave um conjunto sem o código que ela não conhece (caminho (a)). Entre o deploy e o `db push`, escolher "Previdência" no veículo é recusado pelo banco, porque o catálogo ainda não tem o código: a recusa aparece no formulário, sem gravar nada. O roteiro da ação externa pede o `db push` logo depois de conferido o deploy.
2. **Migração única (Item 1), aplicada depois do deploy pela ação externa.** Na mesma transação: `lock table public.ativos in share row exclusive mode`; redefine `private.canonizar_veiculos_acesso` com `previdencia` entre `etf` e `plano_contrato` (a ordem relativa dos códigos existentes não muda); converte pela tabela de D18 todos os ativos comuns, ativos e desativados (`previdencia = true` → acrescenta `previdencia`, retira `plano_contrato` e `nao_aplicavel`, recanoniza; `previdencia = false` → nulo); confere, depois da conversão, que nenhum conjunto deixou de ser canônico e que não restou `previdencia` não nula, falhando a migração se algo estiver errado; e acrescenta `ativos_previdencia_legado_check check (previdencia is null)`. A conversão é idempotente: reexecutada, não acha mais nada a converter.
3. **Depois da migração,** o campo oculto envia o valor gravado, agora sempre nulo, e a restrição passa a valer. Chamadas diretas com `p_previdencia` não nulo, inclusive `false`, pelas funções antigas ou novas, são recusadas pelo banco (violação de restrição, mensagem genérica na aplicação). As funções e as assinaturas não mudam (P5).

A alternativa A (catálogo primeiro, tela com equivalência temporária, conversão depois) também fecha R5-1, mas exige duas ações externas e lógica temporária na tela. Fica registrada e não escolhida.

**P2 — Lista suspensa de múltipla escolha (D14; R5-5b).** Um único componente cliente em `src/components/`, usado no formulário e no filtro. Estrutura: `fieldset` com `legend` visível (o nome do campo, fora da lista); dentro, um `<details>` cujo `summary` mostra a seleção em ordem de catálogo ("Fundo, ETF"), "Não informado" no formulário vazio ou "Todos" no filtro vazio, com o nome do campo em texto só para leitores de tela ("Veículo de acesso: Fundo, ETF"); dentro do `<details>`, as caixas nativas com o `name` do campo, alvos de 44 px e quebra de linha. Funciona sem JavaScript (as caixas dentro de um `<details>` fechado continuam sendo enviadas; o texto do `summary` mostra o estado carregado). Com JavaScript, o texto acompanha as marcações, a lista fecha com clique fora e com Esc, e o foco volta ao `summary`. No formulário, marcar uma opção exclusiva desmarca as outras, como hoje; no filtro, não há desmarcação automática. Nenhuma biblioteca nova.

**P3 — Grupos (D13) e textos.** _(Dica do veículo confirmada em 2026-10-31.)_ Os quatro grupos aparecem como títulos (`h3` no "Mais detalhes" e no "Filtrar"; título de grupo no "Ver detalhes"), na ordem Produto, Tributação, Resgate, Proteção e exposição, com os campos de D13 nessa ordem. No "Mais detalhes": a frase de D9 no topo e, abaixo do indexador, a dica de D16 (literal). No "Ver detalhes": oito itens nos quatro grupos, sem a frase de D9 (D17) e sem item próprio de Previdência, que aparece no veículo. No veículo do formulário, uma dica curta: "Use Previdência para planos PGBL ou VGBL; Plano ou contrato, para outros contratos." (pergunta 4 da ideação, confirmada).

**P4 — "Filtrar" (D14 a D16; R5-5a, c, d).** _(Contador por campo confirmado em 2026-10-31.)_

- Grupos de D13; veículo e indexador pela lista suspensa de P2; os demais como hoje (selects com "Todos").
- **Opções em uso:** a união dos códigos de veículo (ou indexador) dos ativos comuns do usuário, das duas abas, mais "Não informado" e as opções marcadas na URL, em ordem de catálogo, com "Não informado" no fim. Calculadas das mesmas linhas lidas pela página.
- **Exclusividade (D16):** só "Não informado" é exclusivo; "Prefixado (sem indexador)" e "Não se aplica" combinam por OU com as demais. `lerFiltros` deixa de tratar os exclusivos do catálogo como exclusivos no filtro.
- **Ao aplicar (D15):** o formulário GET envia para `/ativos#ativos-da-aba`; o painel começa fechado sempre que não há erro; com erro, abre, e a mensagem `role="alert"` fica no topo da seção `#ativos-da-aba`, para a âncora levar até ela. A linha "filtros aplicados · N de M nesta aba" sai.
- **Contador (pergunta 2, confirmada):** o `summary` de "Filtrar" mostra o número de **campos** com filtro (dois veículos marcados contam 1); sem filtro, nada. "Limpar filtros" fica na mesma linha, à direita do "Filtrar", visível com o painel fechado, só quando há filtro ou erro.
- **Prazo:** Comparação, Dias e Unidade só aparecem com "Prazo em dias", por CSS (`:has()` sobre a opção marcada), sem depender de JavaScript; navegador sem suporte mostra os campos, e a combinação incoerente segue com erro.
- O parâmetro `previdencia` sai dos filtros; numa URL antiga, é ignorado, como qualquer nome desconhecido.

**P5 — Coluna legada (pergunta 3, confirmada em 2026-10-31).** `ativos.previdencia` fica nula e congelada, como `classe_id` desde o ciclo `013`; o parâmetro `p_previdencia` continua nas funções. A remoção física fica para um ciclo futuro.

**P6 — Release (pergunta 1, confirmada em 2026-10-31).** A 0.13.0 sai no encerramento do `017`, com a tela atual; este ciclo entra na versão seguinte, proposta pelo release-please, com nota própria em `/novidades` e data só depois da publicação.

### Pontos de aprovação

| Ponto | Precondição | Cobre | Não cobre | Conferir |
| :-- | :-- | :-- | :-- | :-- |
| Aprovar plano: "aprovo o plano do ciclo 018" | Veredito apto da revisão formal; perguntas 1 a 4 da ideação respondidas (P3, P4, P5, P6) | Esta versão e a publicação da PR documental (ideação, plano e registro em `cycles.md`); a criação das issues depois da integração documental e da confirmação dos payloads | Merges, implementação, ação externa e produção | Veredito, P1 a P6 e D13 a D18 |
| Aprovar merge documental: "aprovo o merge da PR #N" | Checks verdes | Só esse merge | Implementação | Ideação, plano e `cycles.md` |
| Autorizar implementação: "autorizo a implementação da issue #N" | Plano integrado e issue aberta; para a issue 2, a issue 1 integrada | Uma issue, branch e task | Outra issue, merge e ação externa | Escopo e critérios |
| Aprovar merge de entrega: "aprovo o merge da PR #N" | Checks verdes e **teste local feito pelo responsável** com o roteiro da PR | Só esse merge | Ação externa e produção | Task, roteiro local, barreiras e testes |
| Ação humana externa: "concluí a ação externa da issue #N" | Issue 1 integrada e deploy conferido | `db push` da migração única, logo depois do deploy, e consultas só de estrutura | Leitura de dados reais pelo agente | Roteiro da KB-002 |
| Verificar produção: "autorizo a verificação em produção do ciclo 018" | As duas issues integradas e a ação externa concluída | Roteiro VA do 018, com relato só de passou ou falhou | Mudanças de regra | Itens do roteiro |
| Aprovar merge de release e de encerramento: "aprovo o merge da PR #N" | Checks verdes; entregas e verificação reconciliadas | Um merge por frase | Outras PRs | Versão, nota e documentação prospectiva |

Toda cadeia para em perda de dados possível, falha de isolamento, migração não conferida, dúvida de escopo ou falta de capacidade. Não há modo contínuo.

## Barreiras de domínio

| Barreira | Aplica-se? | Como o ciclo a atende ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Nenhuma regra de cálculo lê os atributos ou o indicador (KB-004, 4.1); a conversão só move uma anotação descritiva. Regressões financeiras existentes continuam passando |
| G2 — isolamento por RLS | Sim | Conversão em massa por migração, sem função nova exposta; as funções continuam com sessão, trava e `auth.uid()`. pgTAP: catálogo, conversão de cada caso, restrição, recusa pelas funções antigas e novas, outro usuário e administrador sem acesso, cascata do usuário |
| G3 — privacidade de dados | Sim | Somente fixtures fictícias; consultas da ação externa só de estrutura; URL só com códigos; relato de produção só passou ou falhou |
| G4 — migrações só acrescentam | Sim | Uma migração nova gerada por `supabase migration new`; nenhuma existente editada |

## Estratégia de testes

| Área | Evidência mínima |
| :-- | :-- |
| Conversão (R5-3) | pgTAP com ativos em uso e desativados: `previdencia = true` com veículo vazio, `{fundo}`, `{plano_contrato}`, `{fundo, plano_contrato}`, `{nao_aplicavel}` e `{fundo, previdencia}` já convertido; `false` e nulo; trânsito intocado; reexecução idempotente; forma canônica conferida depois da conversão |
| Restrição (R5-2) | Funções antigas e novas recusam `p_previdencia` `true` e `false` depois da migração e aceitam nulo; testes `08`, `09`, `11` e `12` ajustados para gravar nulo ou para esperar a recusa; nenhuma asserção de isolamento perdida |
| Transição (R5-1) | Ensaio em instância descartável: base com a migração `20261031000721`, fixtures com todos os casos acima; a tela nova edita um ativo com `previdencia = true` antes da migração e o valor é preservado (campo oculto); depois, migração e conferência um a um contra a tabela de D18; retrato integral do resto (eventos, posições, consolidados, instituições, perfis e marcas) igual antes e depois |
| Formulário | Unitários do catálogo com `previdencia`, do campo oculto e da dica; e2e: grupos e títulos, lista suspensa (abrir, marcar, Esc, clique fora, foco), exclusivos no formulário, recusa antes da migração com mensagem, preservação depois da recusa, cadastro sem abrir "Mais detalhes" |
| Filtro | Unitários: opções em uso, exclusividade só de "Não informado", contador por campo, URL antiga com `previdencia`; e2e: fecha ao aplicar e cai na lista, erro no topo da seção, contador e "Limpar filtros" com o painel fechado, campos do prazo condicionais, OU com Prefixado |
| Acessibilidade | axe a 360 e 1280 px com listas abertas e fechadas, alvos de 44 px, sem rolagem horizontal, teclado |
| Teste local do responsável | Cada PR traz um roteiro curto (o que abrir, o que marcar, o que esperar) para o teste local antes da frase de merge |

Gates: os mínimos da governança e `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npx supabase start`, `npx supabase test db` e `npm run test:e2e` sobre o build.

## Itens de implementação

### Item 1 — Previdência como veículo e "Mais detalhes" e "Ver detalhes" em grupos

**Contexto:** P1, P2, P3 e P5; D13, D14 (formulário), D16 (formulário), D17 e D18.

**Ação técnica:** catálogo com `previdencia`; componente de lista suspensa; "Mais detalhes" em quatro grupos com títulos, a frase de D9, a dica de D16 e a dica do veículo; indicador Previdência fora do formulário (campo oculto com o valor gravado), do "Ver detalhes" e do filtro; "Ver detalhes" em grupos, sem a frase. Migração única de P1 (conversão, conferências e restrição), pgTAP novo e ajustado, ensaio de upgrade com fixtures em `tests/fixtures/previdencia018/`, roteiro da ação externa na KB-002, DESIGN.md 6.7 (resumo) e 6.8, KB-003 e KB-004 4.1.

**Critérios de aceite:**

- [ ] "Previdência (PGBL ou VGBL)" aparece no veículo, no formulário e no "Ver detalhes"; o indicador Previdência não aparece em nenhuma tela.
- [ ] Editar um ativo com o indicador em "Sim" antes da migração preserva o valor; depois da migração, o ativo tem Previdência no veículo, conforme a tabela de D18.
- [ ] A conversão cobre todos os casos da estratégia de testes, é idempotente e não toca o trânsito nem as marcas do Início.
- [ ] Depois da migração, nenhuma função grava `previdencia` não nula; os testes afetados foram ajustados sem perder asserções de isolamento.
- [ ] "Mais detalhes" e "Ver detalhes" seguem D13, D16 e D17; a lista suspensa passa em teclado, Esc, 44 px e axe.
- [ ] Roteiro de teste local e roteiro da ação externa prontos; o `db push` é feito logo depois do deploy.

### Item 2 — "Filtrar" em grupos, com listas suspensas e resultados à vista

**Contexto:** P2 e P4; D13 a D16 no filtro.

**Ação técnica:** grupos e listas suspensas no painel; opções em uso; exclusividade de D16 em `lerFiltros`; painel fechado ao aplicar, âncora, erro no topo da seção, contador por campo e "Limpar filtros" ao lado; campos do prazo por `:has()`; DESIGN.md 6.7 e 6.12, KB-003, roteiro VA da KB-002 atualizado e nota em `/novidades`.

**Critérios de aceite:**

- [ ] O painel está fechado depois de aplicar e a página mostra a lista; com erro, o painel abre e a mensagem fica no topo da lista.
- [ ] O contador conta os campos com filtro; "Limpar filtros" fica ao lado de "Filtrar", visível com o painel fechado.
- [ ] Veículo e indexador mostram só as opções em uso, mais "Não informado" e as marcadas, em ordem de catálogo; "Prefixado" combina por OU.
- [ ] Comparação, Dias e Unidade só aparecem com "Prazo em dias"; URL antiga com `previdencia` não quebra a página.
- [ ] Abas, contadores das abas, trânsito fora de filtro e "Não informado" continuam como no `017`.
- [ ] Mobile e desktop, teclado e axe passam, sem rolagem horizontal; roteiro de teste local pronto.

## Arquivos afetados

Existentes: `src/lib/telas/detalhes-ativo.ts`, `src/lib/telas/filtros-ativos.ts`, `src/components/formularios/detalhes-ativo.tsx`, `src/components/formularios/editar-ativo.tsx`, `src/components/ativos-consulta.tsx`, `src/app/(app)/ativos/page.tsx`, `src/lib/novidades.ts` e os testes listados no baseline; DESIGN.md, KB-002, KB-003, KB-004. Novos: uma migração em `supabase/migrations/`, um pgTAP em `supabase/tests/database/`, fixtures em `tests/fixtures/previdencia018/` e o componente de lista suspensa em `src/components/`.

## Decomposição em issues e PRs

| Unidade | Issue e título | Conteúdo | Dependência e fechamento |
| :-- | :-- | :-- | :-- |
| Documental | — | Ideação, plano e `cycles.md` | Branch `chore/cycle-018-plan`; merge com aprovação própria |
| Issue 1 | [#182](https://github.com/EuThiagoAndrade/saldo-futuro/issues/182) — [FEATURE] Tratar Previdência como veículo e organizar os detalhes do ativo em grupos | Item 1 | Depois da documental e do payload confirmado; ação externa logo depois do deploy; a issue fica aberta até a ação externa |
| Issue 2 | [#183](https://github.com/EuThiagoAndrade/saldo-futuro/issues/183) — [FEATURE] Reorganizar o filtro de Ativos em grupos com listas suspensas | Item 2 | Depois da issue 1 integrada; fica aberta até a verificação em produção e o encerramento |

Uma branch por issue (`feature/issue-N`), commit `feat(issue-N): ...`, task `018_task_issue-N.md`. Encerramento em `chore/cycle-018-closure`, sem issue própria.

## Dependências e blockers

- **Para revisar:** nenhum.
- **Para aprovar:** atendido em 2026-10-31 (veredito apto da Rodada 1, confirmação de P3 a P6 e frase de aprovação).
- **Para implementar:** plano integrado, issues criadas e autorização por issue.
- **Ordem:** a ação externa precisa vir logo depois do deploy da issue 1. Independe do encerramento do `017`. Se o `017` ainda não estiver encerrado quando a PR documental do 018 for integrada, quem integrar por último resolve o conflito de linhas vizinhas em `cycles.md`.

## Riscos, suposições e rollback

- **Perda de dados na transição:** coberta por P1 e pelos testes de transição. Suposição: a tela antiga deixa de existir no deploy da issue 1 (deploy contínuo da `main`); a migração só roda depois disso.
- **Restrição recusa gravações diretas:** só afeta chamadas pela API com o indicador não nulo; a aplicação nunca envia isso depois da migração.
- **Rollback:** reverter a tela da issue 1 depois da migração faria a tela antiga mostrar o indicador vazio e gravar nulo, o que é permitido pela restrição; os veículos convertidos continuam, e a tela antiga os esconderia (R5-1, caminho (a)). Por isso o rollback da tela depois da migração só deve ser feito com uma correção nova, nunca revertendo a migração. Correção de banco é migração nova.
- **Navegadores sem `:has()`:** mostram os campos do prazo, sem perda de função.

## Sequência recomendada

1. Revisão formal; respostas às perguntas 1 a 4; aprovação do plano.
2. PR documental; payloads e criação das issues.
3. Issue 1 → teste local → merge → ação externa.
4. Issue 2 → teste local → merge.
5. Verificação em produção, release e encerramento.

## Referências

- Ideação `_project/ideations/018_organizacao_atributos_previdencia.md`; plano do ciclo `017` (D9, P1 a P6, Rodada 5 e "Decisão do responsável após a Rodada 5"), em `_project/executed/017_atributos_complementares_ativos/017_plan.md` desde o encerramento (PR #179).
- Migrações `20261027220000_metadados_nome_ativo.sql` e `20261031000721_atributos_complementares_ativos.sql`; fases 1 e 2 da taxonomia do ciclo `013` (precedente de coluna legada congelada).

## Rastreabilidade

| Campo | Valor |
| :-- | :-- |
| Issue(s) | [#182](https://github.com/EuThiagoAndrade/saldo-futuro/issues/182) e [#183](https://github.com/EuThiagoAndrade/saldo-futuro/issues/183) |
| PR(s) | [#180 — publicação documental da ideação, do plano e do registro do ciclo](https://github.com/EuThiagoAndrade/saldo-futuro/pull/180), integrada em `main` (`e5fe034587f36bc3ae49ef6397a231da3c1bf641`); [#184 — Item 1, issue #182](https://github.com/EuThiagoAndrade/saldo-futuro/pull/184), integrada em `main` (`c31081d56d7ce0d0ff2f51de3db655f90db6b36b`); ação externa relatada pelo responsável em 2026-10-31; [#186 — Item 2, issue #183](https://github.com/EuThiagoAndrade/saldo-futuro/pull/186), integrada em `main` (`44920c7401e0faba7dc76114ac261b8554181405`); [#185 — release 0.14.0](https://github.com/EuThiagoAndrade/saldo-futuro/pull/185), integrada em `main` (`90078ca05bcc5ac43fc6adcf4bd8da8fd39d38ad`); verificação em produção VB1 a VB7 relatada como aprovada em 2026-10-31; [PR #187 — encerramento](https://github.com/EuThiagoAndrade/saldo-futuro/pull/187) |
| Branch(es) | `chore/cycle-018-plan` — publicação documental, numa pasta separada (`git worktree`) para não interferir no encerramento do 017 feito em paralelo; `feature/issue-182` — Item 1, task `018_task_issue-182.md`; `feature/issue-183` — Item 2, task `018_task_issue-183.md`; `chore/cycle-018-closure` — encerramento documental |
| Destino após conclusão | `_project/executed/018_organizacao_atributos_previdencia/018_plan.md` |

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 018 (completo)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 018 + atualizar_docs + 018_plan/encerramento + 90078ca05bcc5ac43fc6adcf4bd8da8fd39d38ad`
- `effect_class`: `remote_mutation`
- `state_before`: entregas #182 e #183 integradas; release 0.14.0 publicada; VB1 a VB7 aprovados; ciclo movido para `executed/`.
- `state_after`: plano concluído com encerramento prospectivo; PR de encerramento publicada fechando as issues #182 e #183.
- `result`: `executed`
- `evidence`: PRs #180, #184, #186, #185; release v0.14.0; relatos de ação externa e verificação em produção; gates locais aprovados.
- `blockers`: checks e aprovação do merge da PR de encerramento.

### Histórico — handoff da criação das issues

- **Data e autorização:** 2026-10-31, "pode criar as issues", depois da apresentação dos dois payloads.
- **Precondições conferidas:** plano `Aprovado` e integrado (PR #180, `e5fe034587f36bc3ae49ef6397a231da3c1bf641`); busca no GitHub sem issue equivalente e sem issue aberta.
- **Template aplicado:** `.github/ISSUE_TEMPLATE/feature_request.yml` — Contexto, Escopo, Critérios de aceite, Ciclo e plano relacionados, Dependências, riscos e autorizações; sem labels ou responsáveis.
- **Resultado:** criadas em sequência por `gh issue create --body-file` e conferidas com `gh issue view` como `OPEN`: [#182](https://github.com/EuThiagoAndrade/saldo-futuro/issues/182) e [#183](https://github.com/EuThiagoAndrade/saldo-futuro/issues/183). O corpo da #183 cita a #182 como pré-requisito, com o número real; fora isso, os textos são os apresentados.

### Histórico — handoff da aprovação

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 018 + aprovar_plano + 018_plan + v1`
- `effect_class`: `remote_mutation`
- `state_before`: plano v1 `Em Revisão`, Rodada 1 com APTO PARA APROVAÇÃO (Antigravity, Gemini 4 Argon), aprovação pendente das confirmações de P3 a P6.
- `state_after`: plano v1 `Aprovado` em 2026-10-31; P3 a P6 confirmadas; ideação, plano e reserva em `cycles.md` publicados na PR #180 (branch `chore/cycle-018-plan`, base `main` em `9abf283`, já com a release 0.13.0 integrada pela PR #176); encerramento do 017 em paralelo na PR #179; nenhuma issue criada.
- `result`: `executed`
- `evidence`: frases "aprovo o plano do ciclo 018" e "Confirmo as quatro", posteriores ao veredito; validador e `git diff --check` antes do commit; PR documental registrada em Rastreabilidade.
- `blockers`: merge documental com aprovação própria e checks verdes; depois, confirmação dos payloads das duas issues.

### Histórico — handoff do rascunho

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 018 + rascunhar_plano + 018_plan + v1`
- `effect_class`: `local_mutation`
- `state_before`: ideação do 018 registrada sem commit; ciclo `018` em `Ideação`; "autorizo o rascunho do plano do ciclo 018" recebida em 2026-10-30; perguntas 1 a 4 da ideação sem resposta.
- `state_after`: plano v1 `Rascunho`, com P1 a P6 para revisão e as perguntas 1 a 4 como propostas a confirmar; ciclo `018` em `Planejamento`; nada publicado.
- `result`: `executed`
- `evidence`: leitura do código e dos testes citados no baseline; validador e `git diff --check` depois da gravação.
- `blockers`: revisão formal (rodada 1) e as respostas às perguntas 1 a 4 antes da aprovação.

## Revisão crítica

### Rodada 1

- **Data:** 2026-10-30
- **Versão revisada:** `v1` (blob `74f2df69fdf7f737d4b60a9e4eaeb587ff643977`); base `main` = `origin/main` = `8cba4ac2dadc825057af777456530a9cbc66da6c`; ideação `_project/ideations/018_organizacao_atributos_previdencia.md` (blob `25e9d8c43660754ce50e6342995fc5a2e036346b`).
- **Autor:** Claude Code (Claude Opus 5.5)
- **Revisor:** Antigravity (Gemini 4 Argon)
- **Veredito:** `APTO PARA APROVAÇÃO`
- **Achados:** Nenhum.
- **Itens atendidos e evidências:**
  1. **Template, cabeçalhos e fronteira documental (R5-7):** todos os campos do cabeçalho e as 17 seções de `.agent/templates/plano_implementacao.md` estão presentes; vínculo `Ideação: _project/ideations/018_organizacao_atributos_previdencia.md` literal; decisões D13 a D18 rastreadas sem reabrir escolhas já tomadas pelo responsável; decomposição canônica do ciclo `018` (`chore/cycle-018-plan` → Issue 1 → Issue 2 → `chore/cycle-018-closure`), independente do encerramento do `017`.
  2. **Fechamento da janela de perda de dados na transição da Previdência (R5-1, P1):** a alternativa B elimina os dois caminhos de perda apontados na Rodada 5 do `017`: (a) o deploy da tela nova na Issue 1 ocorre antes do `db push`, extinguindo a tela antiga que descartaria `previdencia` de `veiculos_acesso` ao salvar; (b) até a execução do `db push`, `FormEditarAtivo` (`src/components/formularios/editar-ativo.tsx`) envia um campo oculto `previdencia` com o valor atual do ativo (`valorDoIndicador(ativo.previdencia)`), preservando `previdencia = true` em `editar_ativo_com_nome` (`20261027220000_metadados_nome_ativo.sql:79`), enquanto `FormNovoAtivo` não o envia (`null`). Se um usuário marcar `"Previdência (PGBL ou VGBL)"` antes do `db push`, `private.gravar_atributos_ativo` (`20261031000721_atributos_complementares_ativos.sql:148`) recusa com `recusado_veiculos_acesso` (`"Confira os veículos de acesso: escolha da lista, e Não se aplica sozinho."` em `src/lib/telas/carteira.ts:135`) sem escrita parcial e preservando o formulário no cliente. Na sequência imediata pós-deploy, a migração única aplica `lock table public.ativos in share row exclusive mode`, redefine `private.canonizar_veiculos_acesso` inserindo `previdencia` entre `etf` e `plano_contrato` (preservando a ordem relativa dos códigos existentes e a forma canônica dos arrays já gravados), converte todos os ativos comuns (ativos e desativados) conforme a tabela de D18, valida forma canônica e ausência de `previdencia` não nula pós-conversão e adiciona `ativos_previdencia_legado_check check (previdencia is null)`. Após a migração, `ativo.previdencia` passa a ser sempre `null` e o campo oculto envia vazio (`null`).
  3. **Impacto da restrição sobre RPCs e suíte de testes (R5-2, P1, P5):** conferido por inspeção e busca no repositório que a lista do baseline e da estratégia de testes (`08_metadados_ativos.test.sql`, `09_taxonomia_ativos.test.sql`, `11_concorrencia_nome.test.sql`, `12_atributos_ativos.test.sql`, `ativos-detalhes.spec.ts`, `ativos-consulta.spec.ts`, `detalhes-ativo.test.ts`, `filtros-ativos.test.ts` e `analises-inicio.test.ts`; `10_metadados_nome.test.sql` já passa apenas `null`) esgota todos os pontos que gravam ou filtram `previdencia` não nula. O critério de aceite exige o ajuste sem perda de asserções de isolamento.
  4. **Cobertura dos casos de conversão e ensaio de upgrade (R5-3, R5-6):** a estratégia de testes e o Item 1 cobrem ativos em uso e desativados, `previdencia = true` com `{}`, `{fundo}`, `{plano_contrato}`, `{fundo, plano_contrato}`, `{nao_aplicavel}` e `{fundo, previdencia}` (já convertido), `false`, `null`, `transito` intocado, idempotência e ensaio em instância descartável na Issue 1 (`tests/fixtures/previdencia018/`), além da ação externa imediata pós-deploy. As triggers `ativos_versao_metadados` (`20261027220000:24`) e `ativos_versao_classificacao` (`20261026204955:154`) não observam `veiculos_acesso` nem `previdencia`, mantendo intactas as versões em `profiles`.
  5. **Especificação de interface, acessibilidade e filtro (R5-5a..d, P2, P3, P4):** P2 define a anatomia acessível da lista suspensa (`fieldset` + `legend` visível fora de `<details>`, `summary` com seleção em ordem de catálogo, `"Não informado"` / `"Todos"` e prefixo `.sr-only` com o nome do campo, caixas nativas com alvos de 44 px, funcionamento sem JS e fechamento por `Escape`/clique fora com retorno de foco ao `summary` com JS). P4 especifica o cálculo das opções em uso (união dos códigos dos ativos comuns das duas abas + `"Não informado"` + marcados na URL, em ordem de catálogo com `"Não informado"` no fim), exclusividade restrita a `"Não informado"` em `lerFiltros` (`src/lib/telas/filtros-ativos.ts:83`), submissão GET para `/ativos#ativos-da-aba` com painel fechado ao aplicar e aberto apenas em erro com `role="alert"` no topo de `#ativos-da-aba`, campos de prazo condicionais por `:has()` e descarte silencioso de `previdencia` em URLs antigas.
  6. **Perguntas em aberto da ideação (1 a 4) e pontos de aprovação:** as propostas P3 (dica curta no veículo do formulário — pergunta 4), P4 (contador por campo com filtro — pergunta 2), P5 (manutenção da coluna `previdencia` congelada e do parâmetro `p_previdencia` — pergunta 3) e P6 (release 0.13.0 para o ciclo `017` e versão seguinte para o `018` — pergunta 1) estão explicitamente destacadas como precondições de confirmação humana no ponto `"aprovo o plano do ciclo 018"`.
  7. **Barreiras G1–G4:** G1 não aplicável (nenhum cálculo lê `previdencia` ou atributos complementares — `KB-004` seção 4.1); G2 atendida (conversão na migração sem expor função nova, mantendo `security definer`, `private.travar_carteira()` e `auth.uid()`, com cobertura pgTAP); G3 atendida (zero dados reais lidos ou expostos, roteiros restritos a consultas estruturais e relato binário); G4 atendida (migração única nova via `supabase migration new`, sem editar migrações existentes).

#### Registro de aprovação — 2026-10-31

O responsável disse "aprovo o plano do ciclo 018" depois do veredito acima. Como o ponto de aprovação exige as respostas às perguntas 1 a 4 da ideação, a aprovação só foi registrada depois de ele confirmar as propostas, com "Confirmo as quatro": P6 (a release 0.13.0 sai no encerramento do `017` e este ciclo vai na versão seguinte), P4 (o contador conta os campos com filtro), P5 (coluna `previdencia` nula e congelada, com remoção física em ciclo futuro) e P3 (dica "Use Previdência para planos PGBL ou VGBL; Plano ou contrato, para outros contratos."). Nada mudou na especificação revisada. A aprovação cobre a publicação documental e a criação das issues depois da integração documental e da confirmação dos payloads; não cobre merges, implementação, ação externa ou produção.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 018 + revisar_plano + 018_plan/rodada-1 + v1`
- `effect_class`: `local_mutation`
- `state_before`: `_project/drafts/018_organizacao_atributos_previdencia/018_plan.md` em `v1`, `Status: Rascunho`, `Revisão formal: Pendente`, `Veredito da revisão: Pendente`, sem rodadas em `## Revisão crítica`.
- `state_after`: `_project/drafts/018_organizacao_atributos_previdencia/018_plan.md` em `v1`, `Status: Em Revisão`, `Revisão formal: Concluída`, `Veredito da revisão: APTO PARA APROVAÇÃO`, `Aprovação humana pós-revisão: Pendente`, com a Rodada 1 registrada em `## Revisão crítica` e `## Próximo passo` atualizado para aprovação humana.
- `result`: `executed`
- `evidence`: inspeção integral de `_project/ideations/018_organizacao_atributos_previdencia.md`, `_project/drafts/018_organizacao_atributos_previdencia/018_plan.md`, `_project/drafts/017_atributos_complementares_ativos/017_plan.md` (Rodada 5), migrações `20261027220000` e `20261031000721`, `src/lib/telas/{detalhes-ativo,filtros-ativos,carteira}.ts`, `src/components/formularios/{detalhes-ativo,editar-ativo,novo-ativo}.tsx`, `src/components/ativos-consulta.tsx`, `src/app/(app)/ativos/{page,acoes}.ts*`, testes pgTAP `08` a `12`, e2e `ativos-detalhes.spec.ts` e `ativos-consulta.spec.ts`, `DESIGN.md`, `KB-002`, `KB-003`, `KB-004` e execução dos gates de governança.
- `blockers`: aguarda aprovação humana explícita do responsável (`"aprovo o plano do ciclo 018"`) e confirmação das respostas às perguntas 1 a 4 da ideação (propostas P3, P4, P5 e P6).

## Pós-mortem

- **Data de conclusão:** —
- **Desvios:** —
- **Lições comprovadas:** —
