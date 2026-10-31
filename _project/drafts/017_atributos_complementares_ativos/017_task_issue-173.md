# Task — Issue #173: Preencher atributos complementares no cadastro e na edição

> **Ciclo:** `017`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `feature`
> **Issue:** `#173`
> **Plano:** `_project/drafts/017_atributos_complementares_ativos/017_plan.md`
> **Branch:** `feature/issue-173`
> **PR:** https://github.com/EuThiagoAndrade/saldo-futuro/pull/177
> **Integração:** PR #177 integrada por squash pelo responsável (`e58f02dde56229c84996d0803bdb5a32ef96b078`) em 2026-10-30, com todos os checks verdes; issue #173 fechada pela PR (`Closes #173`)
> **Autorização inicial:** "Autorizo a implementação da issue #173" em 2026-10-30
> **Modo contínuo:** `—`
> **Início:** 2026-10-30
> **Última atualização:** 2026-10-30
> **handoff_schema_version:** `2`

## Objetivo

Entregar a unidade Formulários (Item 2) do plano aprovado v4: preencher os cinco atributos complementares no cadastro e na edição do ativo, pelas funções da issue #172, com P2, P3 e P6.

## Escopo autorizado

Catálogos e parser dos atributos (`src/lib/telas/detalhes-ativo.ts`); tipo e colunas de leitura do ativo; Server Actions de cadastro e edição nas funções novas; "Mais detalhes" com checkboxes, selects, prazo com unidade explícita e ajuda da P2, agrupado com os quatro indicadores; preservação do preenchimento após recusa; mensagens de recusa; fixtures tipadas e testes; DESIGN.md 6.8, KB-003 e KB-004 4.1. Fora: listagens, resumo e filtros de `/ativos` (issue #174), cálculo, conversão ou calendário, formulário para o trânsito.

## Origem no backlog

Snapshot herdado do plano, sem nova seleção nem alteração do item: **BL-015**, seleção integral; `_project/backlog.md` da fila `chore/backlog`, commit `e3d32d981c6f311d0d9dba192af552f29368347b`. Destino ciclo `017` em preparação; retorno à fila só depois da integração comprovada do destino, com publicação separada.

## Elegibilidade da trilha curta

Não se aplica — trilha normal, unidade Formulários do ciclo completo.

## Barreiras de domínio

Toda linha é obrigatória. "Não se aplica" exige justificativa. Com G1 ou G2 marcados com "Sim", o modo contínuo não pode estar `ativo`.

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Só metadados descritivos; nenhum cálculo, conversão de unidades, soma de etapas ou arredondamento pelo app (fracionário é recusado). Nenhum leitor financeiro muda; regressões financeiras da suíte unitária e do e2e passaram. KB-004 4.1 registra o limite descritivo |
| G2 — isolamento por RLS | Sim | Sem tabela, política ou função nova: a escrita usa as funções da #172 com a sessão do usuário, e a leitura, a RLS existente. E2e: outro usuário não abre a edição; pgTAP da #172 segue passando |
| G3 — privacidade de dados | Sim | Somente nomes e valores fictícios nos testes; mensagens de recusa sem dados; nenhum dado real lido |
| G4 — migrações só acrescentam | Não se aplica | Nenhuma migração nesta entrega |

## Execução

- [x] Issue #173 aberta, ação externa da #172 relatada (registro em `017_task_issue-172.md`) e base `origin/main` `030a0251b876f56a54a018225644bd51acaca878` conferidas; nenhuma PR de entrega aberta (só a de release #176).
- [x] Branch criada preservando os registros locais da reconciliação da #172.
- [x] Catálogos, parser, leitura, Server Actions e formulários.
- [x] Testes unitários e e2e; DESIGN.md 6.8, KB-003 e KB-004.
- [x] Gates locais completos e staging revisado.
- [x] PR #177 publicada com `Closes #173`; integração exige aprovação própria.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | Unitários 487/487; lint sem erros (3 avisos preexistentes em `local/`); typecheck e build passaram; banco 640/640 (sem migração nova); e2e sobre o build com o Supabase local e dois workers: 227 passed e 12 skipped (preview sem backend), saída 0. O arquivo `ativos-detalhes.spec.ts` sozinho: 19/19, com os cinco testes novos (cadastro e reabertura com atributos, recusa que preserva o preenchimento, servidor que recusa o formulário adulterado e acessibilidade com "Mais detalhes" aberto em 360 e 1280 px) |
| Validador | 48/48 testes de governança; validador sem erros depois do registro do número da PR |
| `git diff --check` | Passou |
| Checks remotos | Verdes na PR #177 antes do merge: governança; lint, tipos, testes, build e e2e de preview; Supabase local, testes de banco e e2e autenticado; Vercel |

## Revisão da correção

Não se aplica — trilha normal.

## Decisões incidentais e desvios

- O React reinicia o formulário depois de cada ação (`form.reset()`), e o reset nativo devolvia rádios, caixas e selects ao HTML inicial mesmo controlados; o primeiro e2e de recusa reprovou no tipo de ajuste. `useManterAposReset` (`src/components/formularios/manter-apos-reset.ts`) força um novo render logo depois do reset, como o seletor com busca já fazia com o próprio estado. Nome e tipo de ajuste do cadastro também passaram a controlados. Classe e instituição continuam com a regra existente do seletor (voltam ao valor inicial depois de uma recusa); não foi alterada.
- A exclusividade no cliente desmarca as outras opções ao marcar uma exclusiva (orientação); o servidor recusa o conjunto combinado em vez de descartar opções, e o banco também.
- Dias e Unidade só existem no DOM com "Prazo em dias"; o servidor recusa dias ou unidade enviados com outra situação.
- A frase de "Mais detalhes" passou a ser a de D9; a antiga ("Anotação sua…") saiu, e o e2e foi atualizado.
- O texto do trânsito na edição passou a citar "outros detalhes".
- A KB-003 tinha uma linha antiga dizendo que a edição usava `editar_detalhes_ativo` e mostrava o nome só para leitura; foi atualizada junto com a RPC nova.

## Encerramento

Não se aplica — ciclo completo; encerramento em PR própria.

## Registro da integração

O responsável integrou a PR #177 em 2026-10-30, depois dos checks verdes, sem a frase de aprovação registrada no chat; o agente não fez esse merge. Conferido no GitHub: assunto do squash `feat(issue-173): …`, corpo com `Closes #173` e sem referência à #172, que continua aberta; a PR de release #176 não vincula nenhuma issue para fechamento. Com isso, a dependência da #174 (formulários integrados) ficou atendida.

## Próximo passo

Esta task está concluída; a autorização da #174 foi recebida e a execução segue em `017_task_issue-174.md`.

```text
PRÓXIMO PASSO
Situação: Aguardando autorização de implementação — ciclo 017 (completo)
Quem: Responsável
Conferir: Issue [#174](https://github.com/EuThiagoAndrade/saldo-futuro/issues/174) e escopo do Item 3 do plano
Diga: "autorizo a implementação da issue #174"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 017 + implementar_issue + 173 + 030a0251b876f56a54a018225644bd51acaca878`
- `effect_class`: `remote_mutation`
- `state_before`: PR #175 integrada; ação externa da #172 relatada pelo responsável; #173 aberta; "Autorizo a implementação da issue #173" recebida em 2026-10-30.
- `state_after`: unidade Formulários implementada e validada localmente; PR #177 publicada na branch `feature/issue-173`, aguardando checks e aprovação do merge.
- `result`: `executed`
- `evidence`: tabela de evidências acima.
- `blockers`: nenhum para publicar; o merge depende de checks verdes e de aprovação própria.
- Reconciliação (2026-10-30): PR #177 integrada (`e58f02dde56229c84996d0803bdb5a32ef96b078`) e #173 fechada; registro local, publicado com a branch da issue #174.
