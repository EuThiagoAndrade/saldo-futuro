# Task — Issue #152: Alocação por instituição e níveis de classe

> **Ciclo:** `015`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `feature`
> **Issue:** `#152`
> **Plano:** `_project/executed/015_analises_instituicao_niveis_classe/015_plan.md`
> **Branch:** `feature/issue-152`
> **PR:** https://github.com/EuThiagoAndrade/saldo-futuro/pull/156
> **Integração:** PR #156 integrada por squash (`10bc3adea7498337d4f66bb0066ab1e31b7949a8`) em 2026-10-27, com todos os checks verdes; issue #152 fechada pelo `Closes #152`
> **Autorização inicial:** "autorizo a implementação da issue #152" em 2026-10-27
> **Modo contínuo:** `—`
> **Início:** 2026-10-27
> **Última atualização:** 2026-10-28
> **handoff_schema_version:** `2`

## Objetivo

Entregar a unidade B do plano aprovado, issue #152: regras financeiras e funções puras das análises por instituição e por classe nos níveis 2 e 3, com os casos de referência CR-015-01 a CR-015-16 na KB-004 e nas fixtures.

## Escopo autorizado

KB-004 (regras da seção 15, convenção, casos, fontes e histórico) e `tests/fixtures/financeiro/casos_referencia.json`; módulos puros em `src/lib/financeiro/` para instituição, fronteiras dos níveis 2 e 3, resíduos, os dois rateios e o agrupamento Outros depois do rateio institucional; testes. Sem telas, leituras, banco, migração ou alteração dos algoritmos por ativo e por classe macro.

## Origem no backlog

Snapshot herdado da ideação, sem nova seleção nem alteração do item:

- **BL-009 — Metadados descritivos e classificação de ativos com aproveitamento do histórico:** selecionadas as visões analíticas por instituição e por classe nos níveis 2 e 3, em conjunto para este ciclo. Os campos descritivos e a visão macro foram encaminhados nos ciclos 012 e 013. O responsável informou em 2026-10-27 que já preencheu os dados descritivos dos ativos históricos migrados; é relato humano, não verificação de dados. A carga manual não integra esta seleção.
- Snapshot: `_project/backlog.md` na fila canônica, commit `84f0a5ea107f33e0de5c506b3ea0825346f6e58e`, presente em `origin/main` conforme a ideação; destino ciclo 015 em preparação. O item continua disponível e não foi alterado pela seleção.
- A edição do nome é extensão pedida diretamente pelo responsável durante a ideação; não deriva de BL-015. O retorno à fila, somente depois da integração comprovada do destino, usa a referência estável `ciclo 015`; sua publicação exige autorização separada.

## Elegibilidade da trilha curta

Não se aplica — trilha normal, unidade B do ciclo completo.

## Barreiras de domínio

Toda linha é obrigatória. "Não se aplica" exige justificativa. Com G1 ou G2 marcados com "Sim", o modo contínuo não pode estar `ativo`.

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim | CR-015-01 a CR-015-16 na KB-004 e no JSON, com os mesmos esperados (teste de concordância); valores calculados à parte por script independente em frações exatas, a partir do texto das regras do plano, sem ler o código de produção, e conferidos contra os números do plano; D1 e D2 preservadas; `bigint`, duas bases, negativos antes de agrupar; regressões CR-53 a CR-61 e CR-C01 a CR-C12 passam sem alteração |
| G2 — isolamento por RLS | Não | Sem tabela, política, função ou migração: funções puras sobre dados que o chamador já leu sob RLS; as leituras são das unidades C e D |
| G3 — privacidade de dados | Sim | Somente nomes, valores e instituições fictícios na KB, no JSON e nos testes; nenhum dado real lido ou escrito |
| G4 — migrações só acrescentam | Não | Nenhuma migração criada, editada ou removida |

## Execução

- [x] Issue, plano, autorização e base conferidos; `main` igual a `origin/main` (1e216d7); branch `feature/issue-152` criada.
- [x] Casos CR-015-01 a CR-015-16 calculados à parte e gravados no JSON; texto, regras e convenção na KB-004.
- [x] Módulos `rateio.ts`, `instituicao.ts` e `niveis.ts`; testes `casos-015.test.ts` e `analises.test.ts`; concordância KB × JSON estendida aos novos identificadores.
- [x] Mutação proposital do desempate (instituições e classes) reprovou CR-015-02, CR-015-08 e CR-015-16; restaurada.
- [x] Task da unidade A reconciliada com a integração da PR #155.
- [x] Gates locais concluídos e staging revisado.
- [x] PR #156 publicada (`Closes #152` no corpo); integração exige aprovação própria.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | Unitários: 447/447 (42 novos); financeiro: 156/156; governança: 48/48; lint sem erros (3 avisos preexistentes em `local/`), typecheck e build passaram; e2e autenticado sobre build com Supabase local: 208 passed, 12 skipped (preview sem backend), 1 flaky aprovado no retry (saída de worker no Windows, código 3221226505, o mesmo da unidade A); saída 0, dois workers. Banco: não executado, sem alteração de banco |
| Validador | 0 erros, 0 avisos; conferências manuais realizadas (G3: só nomes e valores fictícios nos textos, no JSON e nos testes) |
| `git diff --check` | Passou |
| Checks remotos | Verdes na PR #156 antes do merge: governança, lint/tipos/testes/build/e2e de preview, banco e e2e autenticado, Vercel |

## Revisão da correção

Não se aplica — trilha normal.

## Decisões incidentais e desvios

- **Chaves dos esperados.** O plano deixa o formato aberto; a convenção dos casos CR-015 (`raiz_*`, `detalhe_<pai>_*`, `resultado`) está na seção 14 da KB-004 e é lida pelo teste de concordância.
- **Recusa por dado inválido.** A visão é recusada por referência inválida (instituição fora do catálogo, nó inexistente, nível ou encadeamento errado) também em posição negativa ou zerada: o plano manda recusar a visão, e a posição zerada ou negativa ainda é exibida ou listada. Catálogo de instituições com ID repetido também é recusado.
- **Pai inválido.** `detalharClasse` devolve `null` para pai inexistente ou terminal (tipo); a mensagem e a volta à raiz são da unidade D. Dado incoerente continua sendo erro.
- **Algoritmos existentes.** `distribuicao.ts` e `alocacao.ts` não mudaram; os novos módulos só importam `PRINCIPAIS`, `UNIDADES_TOTAIS`, `ClassificacaoIncoerente`, `GRUPOS` e `MACROS` deles.
- **Sem conexão com a aplicação.** Nenhuma tela ou leitura usa os módulos novos; a conexão é da unidade D.
- **Reconciliação.** Conforme `_project/README.md` (a reconciliação da task integrada fica no próximo workflow mutante), a task da unidade A passou a `Concluída`, com a ação externa E1 ainda pendente.

## Encerramento

Não se aplica — ciclo completo; encerramento em PR própria.

## Próximo passo

Esta task está concluída; o ciclo foi encerrado na PR `chore/cycle-015-closure`.

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 015 (completo)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 015 + implementar_issue + 152 + 1e216d7a8497673dd9cfd209fa6767e0680fe395`
- `effect_class`: `remote_mutation`
- `state_before`: plano aprovado, #152 autorizada, unidade A integrada pela PR #155.
- `state_after`: unidade B implementada e validada localmente; PR #156 publicada na branch feature/issue-152; aguardando integração.
- `result`: `executed`
- `evidence`: 447 testes unitários, 48 de governança, lint, typecheck, build e e2e (208 passed, 12 skipped, 1 flaky no retry); 16 casos independentes; evidências acima.
- `blockers`: nenhum para publicar; merge depende de checks verdes e aprovação própria.
