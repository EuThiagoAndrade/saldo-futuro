# Task — Issue #107: Mostrar distribuição patrimonial em rosca acessível

> **Ciclo:** `010`
> **Trilha:** `normal`
> **Estado:** `Em andamento`
> **Tipo:** `feature`
> **Issue:** `#107`
> **Plano:** `_project/drafts/010_novidades_privacidade_ativos_distribuicao/010_plan.md`
> **Branch:** `feature/issue-107`
> **PR:** —
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #107" em 2026-10-21
> **Modo contínuo:** `—`
> **Início:** 2026-10-21
> **Última atualização:** 2026-10-21
> **handoff_schema_version:** `2`

## Objetivo

Substituir as barras da distribuição do Início por uma rosca SVG no servidor que represente 100,00% dos saldos positivos do último mês fechado, com legenda completa, Outros retrátil, negativos explícitos fora das fatias e a mesma informação na tabela, respeitando "Ocultar valores".

## Escopo autorizado

Item 4 (BL-005) do plano `v2` aprovado do ciclo 010 e issue #107, com as escolhas do Registro de aprovação: alternativa A (maior resto uma única vez entre todos os positivos, antes de agrupar) e desempate completo por maior saldo, nome pt-BR e UUID canônico minúsculo crescente em comparação textual sem locale. Não inclui mudar saldos, eventos, fechamento, patrimônio líquido, retornos, benchmarks, schema, RLS ou regras de trânsito, a PR do release-please (#109), a ação externa da #104 nem a verificação em produção.

## Origem no backlog

Snapshot herdado do plano: BL-005, parcela integral (visualização de alocação por ativo em rosca SVG no servidor, com legenda estruturada — cor, nome completo, percentual e valor — e detalhamento retrátil dos ativos menores). Fonte `_project/backlog.md` no commit `49a1332c8bc869d3b8dd148baf387de869288307`, já em main. Destino em preparação: ciclo 010; não altera a fila.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

Toda linha é obrigatória. "Não se aplica" exige justificativa. Com G1 ou G2 marcados com "Sim", o modo contínuo não pode estar `ativo`.

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim | Regra nova de participação (seção 15 da KB-004) e casos CR-53 a CR-61 registrados na KB e em `tests/fixtures/financeiro/casos_referencia.json` antes do cálculo, com esperados do plano; centavos em `bigint`, maior resto em 10.000 centésimos de p.p. |
| G2 — isolamento por RLS | Não | Sem tabela, política ou função nova; o Início continua lendo as posições do último mês fechado pela sessão do usuário. Regressões de banco executadas |
| G3 — privacidade de dados | Sim | Fixtures e testes só com nomes e valores fictícios; sem leitura de `local/` ou produção |
| G4 — migrações só acrescentam | Não | Nenhuma migração criada ou alterada |

## Execução

- [x] Autorização, issue #107 aberta, plano `v2` Em Execução com as escolhas A e UUID no Registro de aprovação, PR #111 da #106 integrada e base `d02c1ea` igual a `origin/main` conferidas; sem branch ou PR anteriores da #107. PR #109 do release-please continua fora do escopo.
- [x] Reconciliação da task #106 e do índice de ciclos.
- [x] **G1, antes do cálculo:** KB-004 com a regra da distribuição na seção 15, as exceções nas seções 1 e 2, as convenções na seção 14 e os casos CR-53 a CR-61; `tests/fixtures/financeiro/casos_referencia.json` com os mesmos casos, entradas completas e UUIDs fictícios, inseridos sem reformatar os casos anteriores; entrega `010` aceita em `casos-referencia.test.ts`. Esperados transcritos do plano e conferidos por aritmética `bigint` avulsa de quocientes e restos, sem a função a testar; concordância KB ↔ JSON 4/4. Registro em commit próprio, anterior ao código.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | Pendente |
| Validador | Pendente |
| `git diff --check` | Pendente |
| Checks remotos | Pendente |

## Revisão da correção

Não se aplica (trilha normal).

## Decisões incidentais e desvios

## Encerramento

Não se aplica: o ciclo é completo e o encerramento tem PR própria.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Pronto para continuar — ciclo 010 (completo)
Quem: Qualquer ferramenta, a pedido do responsável
Conferir: —
Diga: "continue o ciclo 010"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 010 + implementar_issue + 107/Item-4-BL-005 + d02c1ea18d68743b5a572393fa688eeca6d611ec`
- `effect_class`: `local_mutation`
- `state_before` / `state_after`: plano Em Execução, #104 a #106 integradas, #107 aberta sem branch nem PR / implementação em andamento na branch `feature/issue-107`
- `result`: `not_executed`
- `evidence`: autorização "autorizo a implementação da issue #107" em 2026-10-21; `git fetch` com `main` igual a `origin/main` em `d02c1ea`; consulta sem PR ou branch da #107
- `blockers`: implementação em curso, coberta pela autorização registrada no cabeçalho; este bloco é substituído ao publicar a PR
