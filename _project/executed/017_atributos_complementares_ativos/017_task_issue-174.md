# Task — Issue #174: Consultar e filtrar atributos complementares na página Ativos

> **Ciclo:** `017`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `feature`
> **Issue:** `#174`
> **Plano:** `_project/executed/017_atributos_complementares_ativos/017_plan.md`
> **Branch:** `feature/issue-174`
> **PR:** https://github.com/EuThiagoAndrade/saldo-futuro/pull/178
> **Integração:** PR #178 integrada por squash pelo responsável (`8cba4ac2dadc825057af777456530a9cbc66da6c`) em 2026-10-30, com `Refs #174`; issue #174 aberta até a verificação em produção e o encerramento
> **Autorização inicial:** "autorizo a implementação da issue #174" em 2026-10-30
> **Autorização de verificação em produção:** "autorizo a verificação em produção do ciclo 017" em 2026-10-30
> **Modo contínuo:** `—`
> **Início:** 2026-10-30
> **Última atualização:** 2026-10-31
> **handoff_schema_version:** `2`

## Objetivo

Entregar a unidade Consulta (Item 3) do plano aprovado v4: "Ver detalhes" nas duas abas de `/ativos` e "Filtrar" pela URL, com P5, P6 e D8, além da documentação da entrega, do roteiro de verificação em produção e da nota de novidades.

## Escopo autorizado

Resumo recolhível por ativo comum nas duas abas, sem coluna nem campo novo na linha principal; painel "Filtrar" abaixo das abas, formulário GET, com OU/E, Exatamente e Até na mesma unidade, `nao_informado`, erros explícitos, abas que preservam filtros, contadores totais e "Limpar filtros" visível com o painel fechado; trânsito fora de qualquer filtro. DESIGN.md 6.7 e 6.12, KB-003, KB-002 (verificação em produção) e nota em `/novidades`. Fora: marca de metadados, nova leitura ou composição, faixas de prazo com dois limites, conversão entre unidades, preservar filtros depois de editar.

## Origem no backlog

Snapshot herdado do plano, sem nova seleção nem alteração do item: **BL-015**, seleção integral; `_project/backlog.md` da fila `chore/backlog`, commit `e3d32d981c6f311d0d9dba192af552f29368347b`. Destino ciclo `017` em preparação; retorno à fila só depois da integração comprovada do destino, com publicação separada.

## Elegibilidade da trilha curta

Não se aplica — trilha normal, unidade Consulta do ciclo completo.

## Barreiras de domínio

Toda linha é obrigatória. "Não se aplica" exige justificativa. Com G1 ou G2 marcados com "Sim", o modo contínuo não pode estar `ativo`.

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Só interseção de conjuntos e comparação de inteiros declarados na mesma unidade; nenhum cálculo monetário, fiscal, de data ou de conversão. Nenhum leitor financeiro muda; regressões financeiras da suíte unitária e do e2e passaram |
| G2 — isolamento por RLS | Sim | Sem tabela, política ou função nova; a página continua lendo pela sessão do usuário com `lerAtivos`, e filtros e resumo derivam dessas linhas. O e2e roda com usuário próprio; a suíte de banco segue passando |
| G3 — privacidade de dados | Sim | Somente nomes e valores fictícios nos testes e capturas locais; a URL guarda só códigos de filtro, sem nomes, valores ou instituições; o roteiro de produção pede relato só de passou ou falhou |
| G4 — migrações só acrescentam | Não se aplica | Nenhuma migração nesta entrega |

## Execução

- [x] Issue #174 aberta; PR #177 integrada pelo responsável (dependência atendida); base `origin/main` `e58f02dde56229c84996d0803bdb5a32ef96b078`; registros da #173 reconciliados.
- [x] Filtros e resumo puros (`src/lib/telas/filtros-ativos.ts` e `resumoDosAtributos`), com testes dos exemplos da P5.
- [x] Página `/ativos` com "Ver detalhes" e "Filtrar" (`src/components/ativos-consulta.tsx`).
- [x] E2e novo e ajustes nos existentes; DESIGN.md 6.7 e 6.12, KB-003, KB-002 e nota da 0.13.0.
- [x] Gates locais completos e staging revisado.
- [x] PR #178 publicada com `Refs #174`; integração exige aprovação própria.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | Unitários 501/501 (13 novos de filtros e resumo, com os exemplos da P5, e a nota da 0.13.0); lint sem erros (3 avisos preexistentes em `local/`); typecheck e build passaram; banco 640/640 (sem migração nova); e2e sobre o build com o Supabase local e dois workers: 233 passed e 12 skipped (preview sem backend), saída 0. As três especificações de Ativos juntas: 32/32, com as sete novas de `ativos-consulta.spec.ts` (resumo nas duas abas, OU/E e URL, abas, contadores e Limpar, Exatamente e Até, Não informado e erros, acessibilidade e 44 px em 360 e 1280 px) |
| Validador | 48/48 testes de governança; validador sem erros depois do registro do número da PR |
| `git diff --check` | Passou |
| Checks remotos | Todos com sucesso na PR #178, conferidos por `gh pr checks 178` em 2026-10-30: governança; lint, tipos, testes, build e e2e de preview; Supabase local, testes de banco e e2e autenticado; Vercel |

## Revisão da correção

Não se aplica — trilha normal.

## Decisões incidentais e desvios

- O formulário de filtros é renderizado no servidor, sem estado no cliente: Comparação, Dias e Unidade ficam sempre visíveis no grupo do prazo, com a dica de que só valem com "Prazo em dias", para o envio funcionar sem JavaScript. Uma combinação incoerente mostra erro, sem ser corrigida em silêncio. Os checkboxes não desmarcam exclusivos no cliente; o servidor recusa.
- Parâmetros dos quatro indicadores usam o nome da coluna (`previdencia`, `liquidez_imediata`, `exposicao_cambial`, `isento_ir`); os links das abas levam só os parâmetros preenchidos, em ordem fixa.
- O nome do ativo na célula da tabela passou a ficar num parágrafo próprio, para o resumo caber na mesma célula; o e2e da #128 que comparava o texto inteiro da célula passou a exigir que ela comece pelo nome.
- As linhas da tabela e da lista passaram a alinhar pelo topo, para o resumo abrir para baixo sem deslocar as ações.
- A nota de novidades usa a versão 0.13.0, a proposta pela PR de release #176 aberta pelo release-please, com `publicadaEm: null` até a publicação; se a versão mudar, a nota acompanha.
- Capturas de tela com dados fictícios feitas por um teste temporário, apagado antes do commit, e guardadas só em `local/`.

## Encerramento

Não se aplica — ciclo completo; encerramento em PR própria, depois da verificação em produção.

## Registro da integração e das emendas

O responsável integrou a PR #178 em 2026-10-30, sem a frase de aprovação no chat; o agente não fez esse merge. Conferido no GitHub: squash `feat(issue-174): …` com `Refs #174`, sem palavra de fechamento; #174 e #172 abertas; a PR de release #176 não vincula issue para fechamento. Ao usar as telas, o responsável pediu mudanças que viraram as emendas E-1 e E-2 do plano (decisões D13 a D18): o que esta task entregou continua em `main` e é corrigido por novas issues, depois da revisão das emendas.

## Verificação em produção — 2026-10-30

O responsável autorizou a verificação com "autorizo a verificação em produção do ciclo 017" e, depois da apresentação do roteiro VA1 a VA8, respondeu "todos passaram". Resultado registrado por relato humano: VA1, VA2, VA3, VA4, VA5, VA6, VA7 e VA8 passaram. Nenhum dado de carteira foi solicitado ou reproduzido. O agente não executou o SQL nem os testes autenticados e não salvou alterações em ativos reais.

Conferências independentes do agente: PRs #175, #177 e #178 integradas; todos os checks da #178 verdes; em consulta HTTP sem sessão, `/entrar` respondeu 200 e `/ativos` e `/novidades` redirecionaram para `/entrar`. Esses resultados só comprovam disponibilidade da entrada e exigência de login, não os critérios autenticados VA1 a VA8.

A release 0.13.0 ainda não foi publicada: PR #176 aberta no head `9958a1fd5b85d5303052da68fc1749529e8e9ec9`. O relato de VA1 não é evidência de publicação dessa versão; conferir versão, nota e data depois da release. Diff da #176 conferido: somente manifesto de release, changelog e versões de `package.json`/`package-lock.json`, com as três entregas do ciclo e sem fechamento antecipado das issues #172 e #174. Execuções automáticas CI/Governance do head corrente liberadas; CI e Governance também disparados por `workflow_dispatch`, conforme `_project/README.md` (runs `41166126047` e `41166128107`). Em 2026-10-31 (America/Cuiaba), todos os checks da PR passaram; CI e Governance manuais também concluíram com sucesso no mesmo head. PR aberta com `mergeStateStatus: CLEAN`; falta aprovação específica do merge.

Autoridades e estrutura desta atualização: `.agent/ai_behavior.md`, `_project/README.md`, KB-002 (VA1 a VA8), `.agent/workflows/atualizar_docs.md`, `.agent/skills/doc-updater/doc-updater.md` e `.agent/templates/task.md`. A implementação permanece concluída; a issue #174 fica aberta até o encerramento.

Validação documental desta atualização: `node --test scripts/validate-governance.test.mjs` passou com 48/48 testes; `node scripts/validate-governance.mjs` passou com 0 erros, 0 avisos e 5 itens manuais; `git diff --check` passou. Textos novos revisados quanto a G3, autorização e escopo; alterações preexistentes do 017 e ideação/reserva do 018 preservadas, sem commit ou publicação documental nesta etapa.

## Release e encerramento — 2026-10-31

O responsável aprovou com "aprovo o merge da PR #176". Head `9958a1fd5b85d5303052da68fc1749529e8e9ec9`, checks verdes e ausência de fechamento de issues conferidos antes do squash. PR #176 integrada em `9abf28384d95d914f8a26f7e71a470f359370a50`; release `v0.13.0` publicada em 2026-10-31 às 04:02:15 UTC (2026-10-31 em America/Cuiaba). A data da nota foi reconciliada no encerramento. A #174 fecha por `Closes` na PR de encerramento; as emendas E-1/E-2 permanecem fora da entrega do 017.

## Próximo passo

Encerramento prospectivo: conclusão efetiva somente depois do merge da PR de encerramento.

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 017 (completo)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 017 + atualizar_docs + 017_task_issue-174/encerramento + 9abf28384d95d914f8a26f7e71a470f359370a50`
- `effect_class`: `remote_mutation`
- `state_before`: implementação integrada; task Concluída; ação externa e VA1 a VA8 relatados como concluídos; release 0.13.0 publicada; ciclo Em execução.
- `state_after`: task reconciliada em executed, com próximo passo Concluído prospectivo; integração do encerramento ainda pendente.
- `result`: `executed`
- `evidence`: esta task e `017_task_closure.md`; PR #176 integrada e release v0.13.0 publicada.
- `blockers`: checks e aprovação própria do merge da PR de encerramento.

### Histórico — handoff anterior ao encerramento

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 017 + atualizar_docs + issue-174/verificacao-producao + 8cba4ac2dadc825057af777456530a9cbc66da6c`
- `effect_class`: `remote_mutation`
- `state_before`: entregas integradas, task Concluída, ciclo Em execução em drafts; Aguardando verificação em produção; release #176 aberta.
- `state_after`: autorização e relato humano de sucesso em VA1 a VA8 registrados localmente; checks da release acionados; Aguardando merge da #176, condicionado a checks verdes e aprovação específica. Nenhum merge, publicação documental ou encerramento executado.
- `result`: `executed`
- `evidence`: seção de verificação em produção acima, resposta humana "todos passaram", PRs consultadas por gh e runs `41166126047` e `41166128107`.
- `blockers`: aprovação própria do merge da release #176; checks verdes no head conferido. Depois, comprovar publicação e preparar encerramento.

### Histórico — handoff da implementação

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 017 + implementar_issue + 174 + e58f02dde56229c84996d0803bdb5a32ef96b078`
- `effect_class`: `remote_mutation`
- `state_before`: PR #177 integrada pelo responsável e #173 fechada; #174 aberta; "autorizo a implementação da issue #174" recebida em 2026-10-30.
- `state_after`: unidade Consulta implementada e validada localmente; PR #178 publicada na branch `feature/issue-174`, sem fechar a #174, aguardando checks e aprovação do merge.
- `result`: `executed`
- `evidence`: tabela de evidências acima.
- `blockers`: nenhum para publicar; o merge depende de checks verdes e de aprovação própria. A #174 fica aberta até a verificação em produção e o encerramento.
- Reconciliação (2026-10-30): PR #178 integrada pelo responsável (`8cba4ac2dadc825057af777456530a9cbc66da6c`); emendas E-1 e E-2 registradas no plano; registro local, publicado na PR documental `chore/cycle-017-emendas`.
