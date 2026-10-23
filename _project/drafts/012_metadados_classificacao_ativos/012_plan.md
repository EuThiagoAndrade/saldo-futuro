# Plano de Implementação — Metadados descritivos e classificação de ativos

> **Ciclo:** `012`
> **Status:** `Aprovado`
> **Versão:** `v2`
> **Data de criação:** 2026-10-23
> **Última atualização:** 2026-10-23
> **Tipo:** `feature`
> **Prioridade:** `P2`
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 012" em 2026-10-23
> **Autorização do rascunho:** "autorizo o rascunho do plano do ciclo 012" em 2026-10-23
> **Autorização da correção:** "corrija o plano do ciclo 012" em 2026-10-23 (achados R1-1 a R1-4)
> **Modo contínuo:** `—`
> **Revisão formal:** `Concluída` (rodada 2, sobre a `v2`)
> **Veredito da revisão:** `APTO PARA APROVAÇÃO` (rodada 2, sobre a `v2`)
> **Aprovação humana pós-revisão:** `Aprovada em 2026-10-23`
> **handoff_schema_version:** `2`

## Problema e contexto

Ideação: `_project/ideations/012_metadados_classificacao_ativos.md`.

## Objetivo

Permitir que cada usuário descreva seus ativos com instituição, classe de alocação e quatro indicadores fixos (previdência, liquidez imediata, exposição cambial e isenção de IR), mantendo cadastros próprios de instituições e de classes, sem que nenhum desses atributos entre em cálculo. O cadastro do ativo no celular continua curto: classe e instituição como campos principais, com criação ali mesmo, e os indicadores numa seção retrátil.

## Origem no backlog

Snapshot herdado da ideação, seleção de 2026-10-23, sem reescrita. Fila lida no worktree `C:\Programas\saldo-futuro-backlog`, branch `chore/backlog`, commit `5298473`, **publicado** em `main` (PR #124), sem commits locais pendentes.

| ID | Síntese da necessidade | Parcela selecionada |
| :-- | :-- | :-- |
| BL-009 | Enriquecer o cadastro de ativos com atributos descritivos (classe de alocação, instituição e detalhes opcionais: previdência, liquidez imediata ou reserva, exposição cambial e isenção de IR), sem tornar o cadastro no celular mais pesado | Parcial: os campos descritivos, com cadastro, edição e exibição. **Fica no Restante:** a carga retroativa (passo local e manual do responsável, fora do ciclo) e as visões analíticas por classe ou instituição (dependem de cálculo, fora desta decisão) |

Referência: `_project/backlog.md` no commit da fila `5298473`. Destino em preparação; nenhum item é alterado neste rascunho. Como o BL-009 já está em `main`, a integração do destino não depende de lote do backlog. O retorno em BL-009 só ocorre depois da integração comprovada, por `ciclo 012`, com o item `Disponível` e o Restante acima; publicar o retorno exige pedido próprio.

## Contexto e baseline

- Inspeção de 2026-10-23 em `EuThiagoAndrade/saldo-futuro`, `main` local em `b35679f5aa113a631df88b3aadfad07f310c8de8`, igual a `origin/main`. Nenhuma PR aberta.
- Alterações locais preexistentes e preservadas: `_project/cycles.md` com a reserva de `012` e a ideação `012` não versionada. Nenhuma branch, commit, issue ou PR deste plano.
- `package.json` em `0.8.0`. Release-alvo do ciclo: `0.9.0`, pelo release-please (`feat` no ciclo).
- **Schema.** `public.ativos` (`supabase/migrations/20261014185205_carteira.sql:18-35`) tem `nome`, `tipo_ajuste`, `sistema`, `ativo`, `criado_em` e `desativado_em`, com `unique (user_id, id)`, que já permite chave estrangeira composta. O trânsito (`sistema = 'transito'`) não tem tipo de ajuste.
- **Isolamento.** `authenticated` só tem `select` em `ativos`, pela política `ativos_select_own`. Escrita só por funções `security definer` com `set search_path = ''` que chamam primeiro `private.travar_carteira()` (autenticação e trava por usuário). `criar_ativo(text, tipo_ajuste)` e `desativar_ativo(uuid)` têm `execute` revogado de `public`/`anon` e concedido a `authenticated` (linhas 600-609).
- **Perfis.** `private.handle_new_user()` cria a linha de `public.profiles` depois do insert em `auth.users` (migração `20261013005133`).
- **Testes de banco.** `01_isolamento` confere que toda tabela de `public` tem RLS ativa (consulta genérica, cobre tabelas novas) e os grants por tabela; `04_carteira` (`plan(112)`) prova que o usuário não grava em `ativos` direto e que B e o admin não leem ativos de A.
- **Aplicação.** `lerAtivos` (`src/lib/telas/leituras.ts:20`) seleciona colunas explícitas e é usada em 6 arquivos; ler uma coluna que ainda não existe em produção quebraria todas essas telas. `src/app/(app)/ativos/acoes.ts` valida com `zod` e chama a RPC; `mensagemDeRecusa` (`src/lib/telas/carteira.ts:107`) traduz `recusado_<motivo>`. `/ativos` (abas Em uso e Desativados, tabela no desktop, lista densa no celular) e `/ativos/novo` são do ciclo 010. Não há edição de ativo.
- **Seletor com busca.** `src/components/combobox-ativo.tsx` e a política pura `src/lib/telas/combobox.ts` implementam o contrato do DESIGN.md 6.8 (WAI-ARIA 1.2, seleção confirmada, busca sem acento).
- **Cálculo.** `src/lib/financeiro/distribuicao.ts`, o fechamento e a consolidação usam só id, nome, tipo de ajuste e saldos. A KB-004 (4.1) descreve o ativo pelo tipo de ajuste (P9) e o trânsito (D3).
- **Produção.** Uma migração nova vai para produção por `npx supabase db push` do responsável a partir da `main` atualizada (KB-002, S12). A Vercel publica a `main` logo depois do merge.
- `local/` não foi aberto; nenhum dado real foi lido.

## Escopo

### Dentro do escopo

- Tabelas `public.instituicoes` e `public.classes_ativo` por usuário, com RLS, leitura só das próprias linhas e escrita só por funções.
- Classes iniciais criadas para cada usuário (existentes e novos): Renda fixa, Renda variável, Fundos, Cripto e Outros.
- Colunas descritivas em `public.ativos`: instituição, classe e os quatro indicadores em três estados.
- Funções de criar, renomear e excluir instituições e classes; função nova de cadastro do ativo com os campos; função de edição só dos campos descritivos, aceita também para ativos desativados.
- Telas: Instituições e Classes; cadastro e edição do ativo com seletores que permitem cadastrar ali mesmo; classe e instituição nas duas abas de `/ativos`.
- Testes de banco, unitários e e2e; DESIGN.md, KB-003 e KB-004 (4.1); nota de novidades da `0.9.0`.
- Release `0.9.0` e encerramento prospectivo em PRs próprias.

### Fora do escopo

- Qualquer cálculo com os campos novos (G1): distribuição, rentabilidade ou consolidação por classe ou instituição; filtros e agrupamentos por eles.
- A carga retroativa dos ativos existentes e qualquer script versionado para ela.
- Editar nome ou tipo de ajuste de um ativo; remover a função `criar_ativo(text, tipo_ajuste)` atual.
- BL-008 (PTAX) e os demais itens do backlog; publicar o retorno do backlog durante o ciclo.
- Mudança na navegação principal (Instituições e Classes ficam dentro de Ativos).

## Decisões e autoridades

Em 2026-10-23, depois da discussão de prós e contras, o responsável disse: "Vou seguir as suas recomendações", com "Instituição: cadastro por usuário, com seletor no ativo e criação ali mesmo no formulário", "Indicadores: fixos" e, em resposta ao esclarecimento pedido, "Cadastro por usuário" para a classe e "Sim, editáveis" para os ativos desativados. Em seguida autorizou este rascunho. São decisões de planejamento; a aprovação do plano continua pendente da revisão formal.

| Pergunta da ideação | Decisão |
| :-- | :-- |
| Q1 — Instituição | Cadastro por usuário (A2), com seletor no ativo e criação ali mesmo no formulário. |
| Q2 — Classe | Cadastro por usuário, para alocação macro, iniciado com a lista sugerida (Renda fixa, Renda variável, Fundos, Cripto, Outros). |
| Q3 — Indicadores | Fixos, os quatro, em três estados: sim, não e não informado (C1). |
| Q4 — Edição | Página própria só com os campos descritivos (D1); ativos desativados também são editáveis. |
| Q5 — Exibição | Classe e instituição nas duas abas de `/ativos`, sem filtro. |
| Q6 — Restante | Visões analíticas por classe ou instituição ficam no Restante do BL-009. |

**Decisões de projeto do autor, sujeitas à revisão e à aprovação:**

| ID | Decisão proposta | Motivo | Alternativa descartada |
| :-- | :-- | :-- | :-- |
| P-1 | Entradas de instituição e classe são **excluídas** só quando nenhum ativo as usa (chave estrangeira `on delete restrict`); renomear é livre. Sem desativação. | Evita o par desativar/reativar e o conflito de nome com entradas desativadas; renomear corrige todos os ativos de uma vez | Desativação lógica, como nos ativos |
| P-2 | Nome único por usuário, sem diferenciar maiúsculas nem espaços nas pontas e preservando acentos (`unique (user_id, lower(btrim(nome)))`), 1 a 100 caracteres. É a regra de **identidade**; a busca do seletor usa outra regra (contrato de nomes, item 1). | Impede "Banco X" e "banco x" como entradas diferentes | Sem unicidade |
| P-3 | Classes iniciais por **gatilho** `after insert` em `public.profiles` (usuários novos) e por inserção na própria migração para os perfis existentes. `private.handle_new_user()` não muda. | A lista existe antes do primeiro cadastro, sem escrita em leitura de página | Botão "Criar classes sugeridas" na tela de Classes |
| P-4 | Criação ali mesmo é **atômica com o envio** do ativo: o seletor envia o id confirmado ou o nome digitado como novo, e a função do banco reaproveita a entrada de mesma identidade (`lower(btrim(nome))`, P-2) ou a cria, na mesma transação. | Não cria entrada órfã se a pessoa desistir do formulário | Criar a entrada no momento em que a opção é escolhida |
| P-5 | Cadastro do ativo com os campos por **função nova** `cadastrar_ativo`; `criar_ativo(text, tipo_ajuste)` fica como está. | O app em produção continua funcionando entre o `db push` e o deploy da issue 3; evita sobrecarga de mesmo nome na Data API | Sobrecarga de `criar_ativo` ou troca de assinatura |
| P-6 | A referência do ativo à instituição e à classe é chave estrangeira **composta** `(user_id, instituicao_id)` e `(user_id, classe_id)`. | O banco impede, por estrutura, apontar para entrada de outro usuário | Conferir só dentro da função |

Autoridades: `.agent/ai_behavior.md`, `_project/README.md`, ADR-002, ADR-003, KB-002, KB-003, KB-004 e `design-system/DESIGN.md`. O contrato visual muda no item 3 (seletor com criação e seção retrátil do formulário); a emenda entra nessa entrega.

### Pontos de aprovação

| Ponto | Precondição | Cobre | Não cobre | Conferir |
| :-- | :-- | :-- | :-- | :-- |
| Autorizar rascunho — recebida | Ideação registrada e Q1 a Q6 respondidas | Este plano e o índice coerente | Revisão, aprovação, branch, issue ou publicação | Ideação, tabela de decisões e cabeçalho |
| Aprovar plano — "aprovo o plano do ciclo 012" | Veredito apto e manifestação humana posterior | Publicar a PR documental; criar as três issues após sua integração e a apresentação/confirmação dos payloads; o encerramento ao final | Merges, implementação, ação externa, produção | Revisão crítica, P-1 a P-6, roteiro externo do item 1 |
| Aprovar merge documental — "aprovo o merge da PR #N" | PR do plano com checks verdes | Integrar aquela PR | Issues e implementação | Diff (ideação, plano e índice), checks |
| Autorizar implementação — "autorizo a implementação da issue #N" | Plano aprovado e integrado; issue real; para as issues 2 e 3, ação externa da issue 1 concluída | Branch, task, mudanças, testes e PR daquela issue | Outra issue, merge, `db push`, dados de produção | Payload, escopo, barreiras e pré-requisitos |
| Aprovar merge de cada entrega — "aprovo o merge da PR #N" | Gates concluídos e checks verdes | Só o merge nomeado | Próxima issue, `db push` | Task, critérios, diff, evidências e G3 |
| Ação humana externa — "concluí a ação externa da issue #N" | PR da issue 1 integrada | Responsável faz o `db push` e confere `migration list`, conforme o roteiro do item 1 | Agente operar banco de produção; carga retroativa | `migration list` alinhado, relatado sem identificadores |
| Verificar produção — "autorizo a verificação em produção do ciclo 012" | Issues 2 e 3 integradas e publicadas | Conferência pública somente leitura pelo agente (rotas novas exigem login) e roteiro autenticado do responsável (passos 6 e 7 da sequência) | Cópia de dados reais, alteração de dados pelo agente | Relato sim/não por passo, sem nomes de instituições |
| Aprovar merge da release — "aprovo o merge da PR #N" | PR real do release-please com `0.9.0` e checks verdes (por `workflow_dispatch`, se preciso) | A release nomeada | Mudança na automação | `package.json`, changelog e nota de novidades |
| Aprovar merge do encerramento — "aprovo o merge da PR #N" | Entregas, ação externa, produção e release comprovadas | Consolidação documental prospectiva | Publicação do retorno do backlog | KBs, plano, tasks, `cycles.md`, checks |

Cada merge tem aprovação própria. A cadeia para ("Parado") por falta de autorização, privacidade incerta, necessidade de regra financeira, escopo ampliado, precondição não verificável, falta de capacidade ou checks falhos. O ciclo completo não usa modo contínuo.

## Barreiras de domínio

| Barreira | Aplica-se? | Como o ciclo a atende ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não; conferência obrigatória | Nenhuma regra de cálculo muda e nenhum cálculo lê as colunas novas. A task do item 3 confere por busca que `src/lib/financeiro/` e as funções `fechar_mes`, `apurar_mes` e `saldo_atual` não citam instituição, classe nem indicadores, e os testes e casos de referência existentes rodam inalterados. Se alguma entrega precisar usar esses campos em cálculo, parar e retriar. |
| G2 — isolamento por RLS | Sim, itens 1 a 3 | Duas tabelas novas com RLS, política `select` só das próprias linhas, `select` como único grant a `authenticated` e nenhum a `anon`. Toda escrita por funções `security definer` com `set search_path = ''`, `private.travar_carteira()` no início, filtro por `auth.uid()` e `execute` só para `authenticated`. Chaves estrangeiras compostas (P-6). O gatilho de classes iniciais não tem `execute` para nenhum papel da Data API. Testes de banco listados na estratégia. |
| G3 — privacidade de dados | Sim | Nome de instituição é dado do usuário. Fixtures, e2e e textos usam só nomes fictícios ("Banco Exemplo", "Corretora Fictícia"). Os relatos de produção dizem sim/não, sem nomes. Nenhum artefato cita `local/`. A carga retroativa manual fica fora do ciclo e de qualquer evidência. |
| G4 — migrações só acrescentam | Sim, item 1 | Uma migração nova gerada por `npx supabase migration new metadados_ativos`; as anteriores ficam intactas. Passo de CI e padrão de nome do validador. |

## Estratégia de testes

**Rascunho e PR documental:** `node --test scripts/validate-governance.test.mjs`, `node scripts/validate-governance.mjs`, `git diff --check` e `git status --short`; G3 e links conferidos à mão.

**Todas as issues de código:** os gates completos de `_project/README.md` ("Gates mínimos"), inclusive `npx supabase start`, `npx supabase test db` e `npm run test:e2e` com e sem backend.

**Issue 1 — banco.** Arquivo novo `supabase/tests/database/08_metadados_ativos.test.sql`, com usuários fictícios em `example.com`:

- estrutura: as duas tabelas com RLS; grants (`authenticated` só `SELECT`, `anon` nenhum); `execute` das funções novas só para `authenticated`; gatilho sem `execute` para `anon`/`authenticated`;
- classes iniciais: um usuário novo recebe as cinco classes; a migração preenche os perfis que já existiam (simulado no teste pela inserção prévia do perfil e pela execução da função de preenchimento);
- isolamento de leitura: B não lê instituições nem classes de A; o admin também não; inserção, atualização ou exclusão direta numa tabela nova é recusada com `42501`;
- isolamento das funções sobre **entradas** de A, para B e para o admin, cada um com a própria sessão: `renomear_instituicao`, `excluir_instituicao`, `renomear_classe` e `excluir_classe` com o id da entrada de A são recusadas (`recusado_instituicao_inexistente` / `recusado_classe_inexistente`) e, relida a entrada como A, nome e existência continuam iguais;
- isolamento das funções sobre o **ativo-alvo** de A, para B e para o admin (R1-2): `editar_detalhes_ativo` com o id do ativo de A é recusada (`recusado_ativo_inexistente`) em três variações — referências nulas e indicadores nulos; referências a instituição e classe do próprio chamador; nome novo de instituição e de classe — e, relido o ativo como A, os oito campos descritivos continuam iguais, e nenhuma instituição ou classe nova foi criada para o chamador nem para A;
- isolamento das **referências**: B e o admin não referenciam a instituição ou a classe de A em `cadastrar_ativo` nem em `editar_detalhes_ativo` sobre o próprio ativo (`recusado_instituicao_inexistente` / `recusado_classe_inexistente`), e nada é gravado;
- regras: nome vazio ou com mais de 100 caracteres recusado; excluir entrada em uso recusado (`recusado_em_uso`) e sem uso aceito; id e nome novo juntos recusados (`recusado_referencia_dupla`); edição do trânsito recusada; edição de ativo desativado aceita; indicadores aceitam `null`, `true` e `false`;
- identidade do nome (R1-3, contrato no item 1): com nomes fictícios, "Classe Ação" e "Classe Acao" coexistem; "classe ação", "CLASSE AÇÃO" e " Classe Ação " (espaços nas pontas) são recusados em `criar_classe` e `renomear_*` (`recusado_nome_repetido`) e, como nome novo em `cadastrar_ativo` ou `editar_detalhes_ativo`, reaproveitam a entrada "Classe Ação" sem criar outra; renomear uma entrada para o próprio nome com outra caixa é aceito; o mesmo para instituições;
- compatibilidade: `criar_ativo(text, tipo_ajuste)` continua criando o ativo com os campos novos nulos.

**Lista fechada de funções (R1-1).** `supabase/tests/database/03_funcoes.test.sql` entra no escopo da issue 1. As oito assinaturas públicas novas, na forma de `regprocedure::text` observada no banco local, são acrescentadas à lista explícita da asserção "anon e authenticated só executam as funções previstas" e à lista do teste de controle negativo, que continua criando `public.funcao_nao_listada()` e provando que uma função fora da lista é detectada. As oito também entram na asserção de que as funções de escrita são `security definer` e não executáveis por `anon`, e as auxiliares novas de `private` (`criar_classes_iniciais` e a função do gatilho) entram na asserção de que auxiliares de `private` não são executáveis pela Data API. Nenhuma asserção é afrouxada (sem curinga, padrão de nome ou exclusão por esquema); o `plan(N)` é ajustado só se o número de asserções mudar.

O `04_carteira` só muda se alguma asserção existente depender da lista de colunas; a task registra o motivo.

**Issue 2 — telas de Instituições e Classes.** Unitários da validação e das mensagens de recusa; e2e em `tests/e2e/ativos-catalogos.spec.ts`: criar, renomear, recusa de nome repetido, exclusão bloqueada em uso (botão desabilitado com explicação) e permitida sem uso; classes iniciais presentes; acessibilidade (axe) a 360 px e no desktop; sem rolagem horizontal.

**Issue 3 — campos do ativo.** Unitários da política do seletor com criação (`src/lib/telas/combobox.ts` ou módulo novo): a opção "Cadastrar «texto»" aparece quando nenhuma entrada tem a mesma identidade do texto (caixa e espaços nas pontas ignorados, acentos preservados), mesmo que a busca sem acento mostre opções parecidas — com "Classe Ação" cadastrada, digitar "Classe Acao" lista "Classe Ação" e oferece "Cadastrar «Classe Acao»", e digitar " classe ação " lista "Classe Ação" sem oferecer cadastro; confirmá-la envia o nome como novo; editar o texto desfaz. E2e em `tests/e2e/ativos.spec.ts` e no novo arquivo: cadastro com classe e instituição existentes; com instituição criada ali mesmo; sem nenhum campo descritivo; indicadores em três estados dentro de "Mais detalhes"; edição de ativo em uso e desativado; trânsito sem "Editar"; classe e instituição nas duas abas, no celular e no desktop; "Ocultar valores" não afeta os campos; teclado do seletor; axe. Os testes de `seletor-ativo.spec.ts` rodam inalterados.

## Itens de implementação

### Item 1 — Banco: instituições, classes e campos descritivos

**Contexto:** o schema não tem onde guardar os atributos, e toda escrita passa por funções do banco.

**Ação técnica:** uma migração nova (`metadados_ativos`) com:

- `public.instituicoes` e `public.classes_ativo`: `id uuid` (padrão `gen_random_uuid()`), `user_id` (`references auth.users on delete cascade`), `nome text` com `check (char_length(btrim(nome)) between 1 and 100)`, `criado_em`, `unique (user_id, id)` e índice único `(user_id, lower(btrim(nome)))` (P-2); RLS ativa; política `select` com `user_id = (select auth.uid())`; `revoke all` e `grant select` a `authenticated`, como em `ativos`.
- `public.ativos`: colunas `instituicao_id uuid`, `classe_id uuid`, `previdencia boolean`, `liquidez_imediata boolean`, `exposicao_cambial boolean` e `isento_ir boolean`, todas nulas; chaves estrangeiras `(user_id, instituicao_id)` e `(user_id, classe_id)` com `on delete restrict` (P-1, P-6); `check` que mantém todas nulas no trânsito.
- Classes iniciais (P-3): função `private.criar_classes_iniciais(uuid)`, idempotente (`on conflict do nothing`); função de gatilho em `private`, `security definer` com `set search_path = ''`, e gatilho `after insert on public.profiles` que a chama; e, na própria migração, a chamada para cada perfil existente. Os nomes são genéricos, sem dado do usuário.
- **Contrato de nomes (R1-3).** Duas regras distintas, cada uma num lugar:
  - **identidade** (unicidade, recusa de repetido e reaproveitamento do nome novo): `lower(btrim(nome))` no banco, que ignora caixa e espaços nas pontas e **preserva acentos** e espaços internos. É a única regra que decide se dois nomes são a mesma entrada; o banco é a autoridade;
  - **busca** (filtrar a lista do seletor): `normalizar` de `src/lib/telas/combobox.ts`, que também ignora acentos. Serve só para encontrar opções, nunca para decidir identidade.
- Funções `security definer`, `set search_path = ''`, trava primeiro:
  - `criar_instituicao(p_nome text) returns uuid`, `renomear_instituicao(p_instituicao uuid, p_nome text)`, `excluir_instituicao(p_instituicao uuid)`;
  - `criar_classe(p_nome text) returns uuid`, `renomear_classe(p_classe uuid, p_nome text)`, `excluir_classe(p_classe uuid)`;
  - `cadastrar_ativo(p_nome text, p_tipo_ajuste tipo_ajuste, p_instituicao uuid, p_instituicao_nova text, p_classe uuid, p_classe_nova text, p_previdencia boolean, p_liquidez_imediata boolean, p_exposicao_cambial boolean, p_isento_ir boolean) returns uuid`: mesmas regras de `criar_ativo` (inclusive criar o trânsito se faltar); recusa id e nome novo ao mesmo tempo; o nome novo reaproveita ou cria a entrada (P-4);
  - `editar_detalhes_ativo(p_ativo uuid, ...)` com os mesmos oito parâmetros descritivos: substitui todos os campos descritivos; recusa o trânsito e ativo de outro usuário; aceita desativado.
- Motivos de recusa novos: `nome`, `nome_repetido`, `em_uso`, `instituicao_inexistente`, `classe_inexistente` e `referencia_dupla`.
- `revoke execute` de `public, anon, authenticated` e `grant execute` a `authenticated` para as funções públicas; `private.criar_classes_iniciais` sem `execute` para nenhum papel da Data API.
- KB-003: tabela do schema e lista de funções.

**Roteiro da ação externa, depois do merge:**

1. Responsável, na `main` atualizada: `npx supabase db push` e `npx supabase migration list`, relatando "local e remoto alinhados", sem identificadores (S12).
2. Em `/ativos`, conferir que a tela continua abrindo e que um cadastro pelo formulário atual funciona (a aplicação ainda usa `criar_ativo`). Relatar sim/não.
3. Dizer "concluí a ação externa da issue #N". Falha leva a "Parado".

**Critérios de aceite:**

- [ ] Migração nova e aditiva; migrações anteriores intactas.
- [ ] Testes de banco da estratégia passando, inclusive o isolamento do ativo-alvo e das entradas para B e para o admin; `01_isolamento` e `04_carteira` verdes.
- [ ] `03_funcoes` com as oito assinaturas nas listas explícitas, as auxiliares novas na asserção de `private` e o controle negativo preservado.
- [ ] Nenhuma mudança em `src/`; `criar_ativo` atual inalterada.
- [ ] Ação externa relatada conforme o roteiro.

### Item 2 — Telas de Instituições e Classes

**Contexto:** as entradas precisam de um lugar para serem revistas, renomeadas e excluídas.

**Ação técnica:**

- Rotas `/ativos/instituicoes` e `/ativos/classes`, com links "Instituições" e "Classes" (botão de texto) no topo de `/ativos`, ao lado de Novo ativo. "Voltar para Ativos" como em `/ativos/novo`.
- Cada tela: formulário curto de inclusão (nome), lista em ordem alfabética pt-BR com o número de ativos que usam cada entrada, "Renomear" (formulário em linha ou diálogo, conforme DESIGN.md) e "Excluir" pela confirmação de ação destrutiva (6.10). Com ativos vinculados, Excluir fica desabilitado com a explicação ao lado (6.9).
- Leituras novas em `src/lib/telas/leituras.ts` e ações em `src/app/(app)/ativos/instituicoes/acoes.ts` e `.../classes/acoes.ts`, com `zod` e as mensagens novas em `mensagemDeRecusa`.

**Critérios de aceite:**

- [ ] Criar, renomear e excluir funcionam com as recusas do banco em português.
- [ ] Exclusão bloqueada com explicação quando há ativo vinculado.
- [ ] Celular a 360 px sem rolagem horizontal, alvos de 44 px e axe sem violações.

### Item 3 — Campos no cadastro, edição e lista de ativos

**Contexto:** o cadastro e a lista precisam receber e mostrar os atributos, e os ativos existentes precisam de um caminho de edição.

**Ação técnica:**

- **Seletor com criação:** generalizar a política de `src/lib/telas/combobox.ts` e o componente para instituição e classe, mantendo o contrato do 6.8, e acrescentar a opção final "Cadastrar «texto»" quando nenhuma entrada tiver a mesma identidade do texto (contrato de nomes do item 1: caixa e espaços nas pontas ignorados, acentos preservados). A busca continua sem acento e só filtra; a decisão final de reaproveitar ou criar é do banco. Confirmá-la envia o nome como novo num campo oculto próprio. O campo não é obrigatório; vazio significa não informado. O seletor de ativo continua igual.
- **`/ativos/novo`:** nome e tipo de ajuste como hoje; depois Classe e Instituição; depois `<details>` "Mais detalhes" com os quatro indicadores, cada um num grupo de rádio em linha (Sim, Não, Não informado), padrão Não informado, e a nota "Anotação sua. O Saldo Futuro não calcula nada com estes campos." A ação passa a chamar `cadastrar_ativo`.
- **`/ativos/[id]/editar`:** nome e tipo de ajuste só para leitura; os mesmos campos descritivos, pré-preenchidos; "Mais detalhes" aberto quando algum indicador estiver informado. Ativo inexistente, de outro usuário ou trânsito mostra a recusa sem formulário. Link "Editar" nas linhas das duas abas, menos no trânsito.
- **`/ativos`:** desktop com colunas Classe e Instituição; celular com classe e instituição na segunda linha; Desativados com os dois e a data. Valor ausente aparece como "—".
- `lerAtivos` passa a ler as colunas novas (só depois da ação externa da issue 1).
- **DESIGN.md:** emenda do 6.8 para o seletor com criação, com as duas regras de nome (busca e identidade); registro do grupo de rádio em linha e do "Mais detalhes"; e emenda do 6.7 (R1-4): na lista densa, a segunda linha dos ativos em uso traz tipo, classe e instituição, e os desativados passam a mostrar nome, classe, instituição e data na segunda linha, com a ação "Editar" à direita (44 px); o trânsito continua sem ação.
- **KB-004 (4.1):** os atributos descritivos não entram em nenhum cálculo. **KB-003:** telas e rotas.
- `src/lib/novidades.ts`: entrada `0.9.0` ("Agora dá para registrar a instituição, a classe e outros detalhes de cada ativo"), data `null` até a release comprovada.

**Critérios de aceite:**

- [ ] Cadastro, edição (inclusive de desativado) e lista conforme a estratégia de testes.
- [ ] Criação ali mesmo cria a entrada só no envio do formulário.
- [ ] Nenhuma mudança em `src/lib/financeiro/` nem nos casos de referência (G1).
- [ ] DESIGN.md (6.7 e 6.8), KB-003, KB-004 e nota da `0.9.0` atualizadas.
- [ ] Conferência visual das duas abas no celular (360 px) e no desktop conforme o 6.7 emendado, inclusive os desativados com "Editar".

## Arquivos afetados

Caminhos novos são propostas.

| Entrega | Existentes a alterar | Novos previstos |
| :-- | :-- | :-- |
| Plano | `_project/cycles.md` | Este plano; a ideação entra na PR documental |
| Item 1 | KB-003, `supabase/tests/database/03_funcoes.test.sql` | `supabase/migrations/<AAAAMMDDHHMMSS>_metadados_ativos.sql`, `supabase/tests/database/08_metadados_ativos.test.sql`, task |
| Item 2 | `src/app/(app)/ativos/page.tsx`, `src/lib/telas/leituras.ts`, `src/lib/telas/carteira.ts` | `src/app/(app)/ativos/instituicoes/`, `src/app/(app)/ativos/classes/`, `tests/e2e/ativos-catalogos.spec.ts`, task |
| Item 3 | `src/app/(app)/ativos/acoes.ts`, `src/app/(app)/ativos/page.tsx`, `src/components/formularios/novo-ativo.tsx`, `src/components/combobox-ativo.tsx`, `src/lib/telas/combobox.ts`, `src/lib/telas/leituras.ts`, `src/lib/novidades.ts`, `tests/e2e/ativos.spec.ts`, `design-system/DESIGN.md`, KB-003, KB-004 | `src/app/(app)/ativos/[id]/editar/page.tsx`, formulário de edição, testes unitários, task |
| Encerramento | Este plano, `_project/cycles.md`, tasks, KB-002 se aplicável, `src/lib/novidades.ts` (data real) | `012_task_closure.md`; movimento para `executed/` |

Necessidade fora desta lista é registrada e avaliada antes de mudar.

## Decomposição em issues e PRs

Após aprovação e integração da PR documental, apresentar os payloads (`.github/ISSUE_TEMPLATE/`) para confirmação e só então criar via `gh`. Nenhum número é reservado aqui.

| Ordem | Título proposto | Unidade e dependência |
| :-- | :-- | :-- |
| Documental | Plano do ciclo 012 | `chore/cycle-012-plan`, PR com ideação, plano e índice |
| 1 | `[FEATURE] Guardar instituições, classes e detalhes dos ativos no banco (BL-009)` | Item 1; `feature/issue-N`; PR com `Refs #N`; ação externa (`db push`) depois do merge |
| 2 | `[FEATURE] Cadastrar instituições e classes de ativos (BL-009)` | Item 2; depois da ação externa da issue 1 |
| 3 | `[FEATURE] Registrar instituição, classe e detalhes no ativo (BL-009)` | Item 3; depois da integração da issue 2 |
| Release | PR do release-please (`0.9.0`) | Sem issue; depois da verificação em produção |
| Encerramento | Consolidar o ciclo 012 | `chore/cycle-012-closure`, sem issue nova; `Closes #N` da issue 1 |

Commits `feat(issue-N):`; documentação `docs(cycle-012):`.

**Fechamento das issues.** As issues 2 e 3 fecham pelas próprias PRs. A issue 1 é exceção à relação normal de uma issue por PR, porque seu aceite inclui o `db push`, que só ocorre depois do merge: a PR usa `Refs #N`; a task da issue 1 fica como artefato ativo em "Aguardando ação externa" e registra o resultado sanitizado; a PR de encerramento reconcilia essa task e fecha a issue com `Closes #N`.

## Dependências e blockers

- Revisão formal e aprovação do plano, inclusive de P-1 a P-6.
- Supabase local e Docker para os testes das três issues.
- A issue 2 só começa depois da ação externa da issue 1, porque o app passa a ler tabelas novas; ler antes do `db push` quebraria as telas em produção.
- Release `0.9.0` sem outra release no meio.

## Riscos, suposições e rollback

- **Ordem de deploy.** A Vercel publica a `main` logo após o merge, antes do `db push`. Mitigação: a issue 1 não muda `src/`, e as telas que leem as colunas novas só entram depois da ação externa; `criar_ativo` atual continua válida (P-5).
- **Superfície G2.** Oito funções novas e um gatilho. Mitigação: padrão idêntico ao das funções existentes, testes de isolamento por função e chaves compostas (P-6).
- **Classes iniciais em perfis existentes.** A migração escreve em produção para cada perfil; só nomes genéricos, de forma idempotente. Usuário que excluir uma classe inicial não a recebe de volta.
- **Termos tributários.** "Isento de IR" e "Exposição cambial" são anotações; a nota do formulário evita que pareçam conclusão do app.
- **Formulário mais longo no celular.** Os indicadores ficam fechados em "Mais detalhes"; classe e instituição não são obrigatórias.
- **Suposição:** a identidade preserva acentos ("Classe Acao" e "Classe Ação" são duas entradas, comportamento intencional). A busca sem acento mostra a entrada parecida antes da opção de cadastrar, o que reduz o risco de duplicar por engano; renomear ou excluir corrige uma duplicata.
- **Rollback:** a aplicação volta por nova PR revisável. A migração não é revertida por edição (G4); se preciso, nova migração que remova colunas, gatilho, funções e tabelas, com decisão do responsável, ciente de que apaga os campos descritivos já preenchidos, e `db push`.

## Sequência recomendada

1. Revisão formal e aprovação do plano.
2. PR documental (ideação, plano e índice) e merge aprovado.
3. Payloads e criação das três issues.
4. Issue 1 → merge → ação externa (`db push`).
5. Issue 2 → merge; issue 3 → merge.
6. Verificação em produção pelo agente, somente leitura: `/ativos/instituicoes`, `/ativos/classes` e `/ativos/<id>/editar` sem sessão redirecionam ao login.
7. Verificação autenticada pelo responsável: as cinco classes iniciais aparecem; um ativo recebe classe, instituição criada ali mesmo e um indicador; a edição de um ativo desativado salva; a lista mostra os campos no celular. Relato sim/não, sem nomes reais.
8. Release `0.9.0`, com merge aprovado.
9. Encerramento prospectivo, com merge aprovado; depois, a pedido, o retorno no BL-009.

## Referências

- Ideação: `_project/ideations/012_metadados_classificacao_ativos.md`.
- Backlog: `_project/backlog.md`, BL-009, commit da fila `5298473`.
- `supabase/migrations/20261014185205_carteira.sql` (ativos, políticas, funções e grants) e `20261013005133_acesso_autorizacao_perfis.sql` (perfis).
- KB-002 (S12), KB-003, KB-004 (4.1), DESIGN.md 6.7, 6.8, 6.9, 6.10 e 6.12.

## Rastreabilidade

| Campo | Valor |
| :-- | :-- |
| Issue(s) | — |
| PR(s) | — |
| Branch(es) | — |
| Destino após conclusão | `_project/executed/012_metadados_classificacao_ativos/012_plan.md` |

## Registro de aprovação

- **Data:** 2026-10-23.
- **Manifestação humana posterior à revisão:** "aprovo o plano do ciclo 012", dita depois do veredito da rodada 2.
- **Base aprovada:** plano `v2`, revisão formal rodada 2 (Codex, GPT-6) com veredito `APTO PARA APROVAÇÃO`, sem bloqueadores nem ressalvas. Rodadas e resposta do autor preservadas.
- **Decisões de projeto:** P-1 a P-6 aprovadas como estão em "Decisões e autoridades".
- **Alcance:** aprovação do plano e publicação da PR documental (ideação, plano e índice); criação das três issues somente depois da integração documental e da apresentação/confirmação dos payloads; encerramento ao final. Não concede aprovação de merge, autorização de implementação, ação externa nem acesso a produção.
- **Estado do ciclo:** permanece `Planejamento` até a primeira implementação autorizada.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 012 (completo)
Quem: Responsável
Conferir: Diff e checks da PR documental #125 (https://github.com/EuThiagoAndrade/saldo-futuro/pull/125); confirmar checks verdes no HEAD atual antes de integrar
Diga: "aprovo o merge da PR #125"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 012 + atualizar_docs + 012_plan/aprovacao-publicacao + v2/b35679f5aa113a631df88b3aadfad07f310c8de8`
- `effect_class`: `remote_mutation`
- `state_before`: ciclo `012` em `Planejamento`; plano `v2` em `Em Revisão`, rodada 2 `APTO PARA APROVAÇÃO`, "Aguardando aprovação do plano"; sem branch ou PR do ciclo.
- `state_after`: plano `v2` `Aprovado`, com manifestação humana posterior; branch `chore/cycle-012-plan` publicada e PR documental #125 aberta, "Aguardando merge". Ciclo permanece `Planejamento`.
- `result`: `executed`
- `evidence`: manifestação humana de 2026-10-23 no "Registro de aprovação"; rodada 2 apta anterior à manifestação; branch `chore/cycle-012-plan` sobre `main` `b35679f5aa113a631df88b3aadfad07f310c8de8`; PR criada via `gh`, base `main`, somente ideação, plano e índice; 48/48 testes locais e validador sem erros ou avisos. Os checks são conferidos no GitHub no HEAD atual antes de qualquer merge.
- `blockers`: merge pendente de checks verdes e de "aprovo o merge da PR #125". Criação das issues aguarda a integração documental e a confirmação dos payloads. Nenhuma implementação, issue, ação externa ou merge executado.

## Revisão crítica

### Rodada 1

- **Data:** 2026-10-23.
- **Autor:** ferramenta e modelo não identificados no rascunho `v1`; autoria não verificada nesta rodada.
- **Revisor:** Codex (GPT-6).
- **Versão revisada:** `v1`.
- **Veredito:** `REQUER NOVA RODADA`.

#### Achados

- **R1-1 — Bloqueador: incluir a atualização da lista fechada de RPCs no item 1.** `supabase/tests/database/03_funcoes.test.sql` rejeita qualquer função executável por `authenticated` fora da lista explícita de assinaturas e tem uma segunda lista no teste de controle negativo. As oito RPCs planejadas reprovarão essa verificação mesmo se estiverem corretas. O item 1 e a tabela de arquivos afetados preveem somente o teste novo, e a estratégia só discute eventual alteração de `04_carteira`. Incluir `03_funcoes` no escopo, atualizar as listas com as assinaturas definitivas e preservar a prova de rejeição de uma função não autorizada. Não enfraquecer a asserção para liberar as novas funções indiscriminadamente.
- **R1-2 — Bloqueador: provar isolamento do ativo-alvo na edição.** A estratégia prova que B não pode referenciar instituição/classe de A, mas não exige que B e o administrador tentem editar o próprio ativo de A. São verificações diferentes: uma implementação que valide os catálogos, mas atualize o ativo apenas por ID, pode passar nos casos descritos. A ideação exige expressamente que B e o admin não editem ativos alheios; a ADR-003 proíbe esse bypass. Acrescentar casos para `editar_detalhes_ativo` com o ID do ativo de A, usando referências nulas ou pertencentes ao chamador, para B e admin, verificando recusa e ausência de alteração. Cobrir também as mutações dos catálogos pelo admin contra entradas de A; o teste de leitura não comprova a segurança das funções `security definer`.
- **R1-3 — Ressalva: esclarecer duas normalizações diferentes.** P-2 usa `lower(btrim(nome))`, preservando acentos, enquanto `normalizar` em `src/lib/telas/combobox.ts` remove acentos. O item 3 suprime "Cadastrar" em correspondência exata normalizada e P-4 reaproveita entrada de mesmo nome normalizado, sem distinguir qual regra vale em cada ponto. Com nomes fictícios "Classe Ação" e "Classe Acao", o banco permite duas entradas, mas reutilizar a normalização da busca na igualdade impede criar a segunda pelo formulário do ativo. Separar explicitamente busca e identidade/reaproveitamento, documentar o comportamento intencional e adicionar casos de acentos, caixa e espaços nas pontas. Não é necessário mudar a decisão de unicidade; é necessário tornar o contrato inequívoco.
- **R1-4 — Ressalva: emendar também o contrato da lista de desativados.** DESIGN.md 6.7 determina que desativados aparecem com nome e data, sem ação. O item 3 adiciona classe, instituição e "Editar" nessa aba, mas delimita a emenda visual ao 6.8 e aos novos controles do formulário. Incluir a atualização de 6.7 na entrega e na conferência visual, alinhando a lista densa ao comportamento aprovado para desativados.

#### Itens atendidos e limites

- Escopo descritivo e exclusões de cálculo, carga retroativa e PTAX estão claros; G1 permanece sem mudança de regra financeira.
- A sequência banco → ação externa → telas preserva a aplicação antiga durante o deploy; a RPC antiga permanece disponível e as novas leituras só entram após o `db push`.
- Chaves compostas, RLS, grants explícitos, trava por usuário, indicadores nulos e criação atômica são decisões coerentes com as autoridades, sujeitas aos testes da implementação.
- Aprovação posterior ao veredito, autorização por issue, merge por PR, ação externa e encerramento estão separados. Nenhuma aprovação é concedida nesta revisão.
- Baseline local e merge da PR #124 conferidos; nenhuma issue do ciclo ou PR aberta. Os registros humanos anteriores foram lidos nos artefatos, sem alegar verificação independente da conversa original. Nenhum dado real foi aberto.
- Revisão documental e inspeção de código existente; testes de implementação futura não foram executados. O autor deve responder aos achados e incrementar a versão, preservando esta rodada.
- **Validação da revisão:** `node --test scripts/validate-governance.test.mjs`: 48/48 passaram; `node scripts/validate-governance.mjs`: zero erros e zero avisos; `git diff --check`: sem erros. Estado local preservado: índice de ciclos modificado, ideação e diretório do plano não versionados. Somente este plano foi alterado pela revisão, sem commit ou publicação. A validação estrutural passou; o parecer semântico requer correções pelos dois bloqueadores acima.

### Resposta do autor à rodada 1 — v2

- **Autor:** Claude Code (Claude Opus 5.5), autor também da `v1`.
- **Data:** 2026-10-23.

| Achado | Resposta | Onde |
| :-- | :-- | :-- |
| R1-1 | **Corrigido.** Conferido que `03_funcoes` tem duas listas explícitas de assinaturas e o controle negativo com `public.funcao_nao_listada()`. A issue 1 passa a incluir o arquivo: as oito assinaturas entram nas duas listas e na asserção de `security definer` sem `anon`; as auxiliares novas de `private` entram na asserção de não executáveis; nenhuma asserção é afrouxada. | Estratégia de testes ("Lista fechada de funções"), critérios do item 1 e "Arquivos afetados" |
| R1-2 | **Corrigido.** Acrescentados casos de `editar_detalhes_ativo` com o id do ativo de A, para B e para o admin, em três variações de referência, com recusa e releitura como A provando os oito campos inalterados e nenhuma entrada criada; e casos de renomear e excluir entradas de A pelo admin e por B, com releitura. | Estratégia de testes (isolamento de entradas, do ativo-alvo e das referências) e critérios do item 1 |
| R1-3 | **Corrigido**, sem mudar a unicidade. Separadas a regra de identidade (`lower(btrim(nome))`, acentos preservados, autoridade do banco) e a de busca (`normalizar`, sem acento, só filtra). A opção "Cadastrar «texto»" e o reaproveitamento usam a identidade. Casos com "Classe Ação", "Classe Acao", caixa e espaços nas pontas no banco e no seletor. | P-2, P-4, item 1 ("Contrato de nomes"), item 3, estratégia de testes e riscos |
| R1-4 | **Corrigido.** Conferido que o DESIGN.md 6.7 diz que desativados têm nome e data, sem ação. A issue 3 emenda o 6.7 (segunda linha com classe e instituição; desativados com "Editar"; trânsito sem ação) e ganha critério de conferência visual das duas abas. | Item 3 (DESIGN.md e critérios) |

Nenhum achado contestado. Nenhuma decisão do responsável mudou.

### Rodada 2

- **Data:** 2026-10-23.
- **Autor:** Claude Code (Claude Opus 5.5), conforme identificação na resposta à rodada 1.
- **Revisor:** Codex (GPT-6).
- **Versão revisada:** `v2`.
- **Veredito:** `APTO PARA APROVAÇÃO`.

#### Conferência dos achados anteriores

| Achado | Resultado da revisão |
| :-- | :-- |
| R1-1 | Resolvido. A estratégia, os critérios do item 1 e os arquivos afetados incluem `03_funcoes`; as duas listas de assinaturas e as verificações de privilégios serão atualizadas sem retirar o controle negativo. A inspeção do teste existente confirma a adequação dessa correção. |
| R1-2 | Resolvido. Os casos distinguem ativo-alvo de referências aos catálogos, com sessões de B e do administrador, recusa, releitura como A e ausência de efeitos parciais. Incluem também as mutações das entradas alheias e os grants de escrita direta. |
| R1-3 | Resolvido. P-2, P-4, o contrato de nomes e o seletor separam identidade com acentos preservados da busca sem acentos. Os exemplos e testes especificam criação, reaproveitamento, caixa e espaços nas pontas. |
| R1-4 | Resolvido. O item 3 inclui a emenda do DESIGN.md 6.7 e critérios de conferência visual das duas abas, inclusive a ação de edição nos desativados. |

#### Conclusão e limites

- Nenhum novo achado bloqueador ou ressalva. Os dois bloqueadores foram resolvidos e nenhuma correção reapareceu; a regra de progresso foi atendida.
- Escopo, decomposição, dependências de deploy, critérios de aceite e G1 a G4 permanecem coerentes. A nova função do gatilho tem `security definer` e `search_path` vazio explicitados; a aplicação só passa a ler as novas tabelas e colunas após a ação externa.
- Mantidos o caráter apenas descritivo, a compatibilidade da RPC antiga, a exclusão da carga retroativa e os pontos de autorização e aprovação independentes.
- Parecer sobre o plano, sem comprovar antecipadamente a implementação: testes de banco, aplicação, acessibilidade e produção continuam exigidos nas respectivas entregas. Nenhum dado real foi aberto.
- Aprovação humana permanece pendente. Somente os campos de revisão, o parecer e o handoff foram atualizados; sem implementação, commit, issue ou PR. A rodada 1 e a resposta do autor foram preservadas.
- **Validação documental:** 48/48 testes de `scripts/validate-governance.test.mjs` passaram; `node scripts/validate-governance.mjs` retornou zero erros e zero avisos; `git diff --check` sem erros. Estado preexistente preservado: `_project/cycles.md` modificado, plano e ideação não versionados. A conferência manual dos textos da revisão não encontrou dados do usuário; as autorizações anteriores são consideradas conforme os registros dos artefatos, sem alegar verificação independente da conversa de origem.

## Pós-mortem

- **Data de conclusão:** —
- **Desvios:** —
- **Lições comprovadas:** —
