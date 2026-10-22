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
- [x] ADR-005 emendada (rosca como quinto tipo, barras horizontais fora do código) e DESIGN.md com a ordem de cores da rosca (2.3) e o contrato 6.13.
- [x] `src/lib/financeiro/distribuicao.ts` (`comporDistribuicao`): fronteira por `deNumero`, base positiva e maior resto em `bigint`, ordem por saldo, nome pt-BR (`Intl.Collator`) e UUID em texto minúsculo sem locale, cinco principais e Outros pela soma dos componentes; negativos e omitidos separados. `src/lib/financeiro/distribuicao.test.ts`: os nove casos do JSON em três ordens de entrada, com todas as chaves esperadas conferidas; soma 10000 e erro de cada participação menor que 0,01 p.p.; fronteira de inteiros seguros; cinco e seis positivos; Outros como soma exata; nomes iguais com UUID; ordem dos negativos. Controle negativo: sem o desempate por UUID, o CR-61 e o teste de nomes iguais falham.
- [x] `textoParticipacao` em `src/lib/apresentacao/valores.ts` (só a vírgula sobre o inteiro, sem sinal), com testes.
- [x] `src/components/graficos/rosca.tsx` (`GraficoRosca`): setores com traço `surface`, anel completo para um positivo, legenda em lista ordenada com amostra de cor, nome inteiro, participação e valor, Outros em `<details>` com seta e os componentes, negativos listados fora da rosca, frase própria sem positivos e "Ver os números" com as tabelas Resumo e Detalhe por ativo. `rosca.test.tsx` (SSR): seis fatias com Outros, mesmas participações na legenda e nas tabelas sem Outros duplicado, negativos e zero, anel único, sem positivos, geometria de 75% e 25%, fatia de 0,00% e nome longo, valores ocultos em texto e atributos, sem JavaScript.
- [x] Início: `comporDistribuicao` sobre as posições de M e `GraficoRosca` sempre que há M; `GraficoDistribuicao` (barras) removido de `graficos.tsx`.
- [x] E2e: `tests/e2e/distribuicao.spec.ts` (novo); CR-17 de `inicio.spec.ts` e prova D13 de `navegacao-desempenho.spec.ts` limitados à tabela "Detalhe por ativo".
- [x] Nota da `0.7.0` em `src/lib/novidades.ts` e KB-003.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Concordância KB-004 ↔ JSON | 4/4, antes do código (commit `3e1cfc8`) |
| `npm test` | 357/357 (30 arquivos): `distribuicao.test.ts` 16 (nove casos em três ordens, propriedades e fronteiras), `rosca.test.tsx` 7, `valores.test.ts` com `textoParticipacao`; depois do ajuste de layout, `src/components/graficos` 41/41 |
| `npm run lint` | 0 erros com `--ignore-pattern ".claude/**"`; três avisos preexistentes em `local/` |
| `npm run typecheck` | Passou |
| Build | Passou, sem backend e com backend, pelo `webServer` do Playwright |
| E2e sem backend | 33 passaram e 159 pulados |
| `npx supabase test db` | 261/261 (7 arquivos) |
| E2e com backend | Rodada A, simultânea a uma rodada da sessão de investigação do CR-04 no mesmo Supabase: 165 passaram, 12 pulados e 9 falharam; 8 por contas de teste apagadas pela outra suíte (mesmos e-mails fixos, "Invalid login credentials") e 1 por seletor ambíguo no `distribuicao.spec.ts`, corrigido. Rodada B, limpa: 175 passaram, 12 pulados e 3 falharam: `cartoes-inicio.spec.ts` (1 px de rolagem horizontal em 1024 px com quantias no limite da faixa: defeito da rosca lado a lado na meia coluna, corrigido empilhando a partir de `lg`), CR-04 (a parada preexistente de 30 s em Transferências) e `migracao.spec.ts` (queda do processo de teste, 0xC0000409, em 0 ms). Depois da correção: `cartoes-inicio`, `distribuicao`, `inicio` e `carteira` passaram (CR-04 em 4,4 s); `migracao.spec.ts` derrubou o processo de novo e, repetido sozinho, passou 23/23 e caiu na vez seguinte: queda intermitente da máquina, também observada pela sessão de investigação no código sem esta entrega, em suíte que não importa nenhum arquivo alterado |
| `distribuicao.spec.ts` | 4/4 sozinho: legenda, Outros, negativos, tabelas com as mesmas participações e soma 10000, ocultação em texto e atributos, axe e sem rolagem em 360 e 1280 px |
| Prova D13 (`MEDIR_NAVEGACAO=1`, `MEDICAO_D13=1`, `medicao.config.ts`, porta 3105) | 2/2: alteração entre páginas de posições e entre componentes da marca devolvem só a versão nova, conferida na tabela "Detalhe por ativo"; evidência só em `local/` |
| Auditoria visual (DESIGN.md) | Conta fictícia temporária, criada e removida por script: rosca em 360 e 1280 px com Outros aberto, tabelas Resumo e Detalhe e valores ocultos em 360 px. Cores na ordem de 2.3, separação `surface`, nome longo com quebra, alvos de 44 px no resumo de Outros |
| Governança | `node scripts/validate-governance.mjs --root` sobre a exportação do HEAD: 0 erros, 0 avisos, cinco itens manuais; `node --test scripts/validate-governance.test.mjs` 48/48 |
| G3 | Fixtures, testes e capturas só com nomes e valores fictícios; contas `distribuicao107.*`, `visual107.comum` e `d13next.*`, todas `@example.com`, removidas no fim |
| `git diff --check` | Passou |
| Checks remotos | Pendente |

## Revisão da correção

Não se aplica (trilha normal).

## Decisões incidentais e desvios

- **Nota da `0.7.0` para revisão do responsável:** "No Início, a distribuição por ativo virou um gráfico de rosca com a participação de cada ativo; os menores ficam juntos em Outros, que abre a lista completa, e os saldos negativos aparecem à parte."
- **Ordem dos negativos e dos omitidos (apresentação, sem efeito em valor):** o plano fixou só a ordem dos positivos. Os negativos saem do mais negativo para o menos negativo, com os mesmos desempates por nome e UUID; os omitidos, por nome e UUID. Nenhuma participação, saldo ou soma depende dessa ordem; registrada na KB-004 (seção 15, item 3) para revisão.
- **Distribuição sem positivos:** a figura aparece sempre que há mês fechado, com "Não há saldos positivos para exibir." quando a base é zero, como o plano pede; antes, sem posição diferente de zero, o cartão não aparecia.
- **Geometria:** a fração de volta é calculada como `saldo × 10⁹ ÷ base` em `bigint` e só então convertida para `number`, sem passar o saldo por ponto flutuante; a última fatia fecha a volta exatamente.
- **Tabelas:** o Resumo lista as fatias, Outros e os negativos ("fora da rosca"); o Detalhe por ativo lista cada posição uma vez, sem a linha Outros. Por isso o CR-17 e a prova D13 passaram a consultar só o detalhe.
- **Validador com a cópia da outra sessão:** a sessão de investigação do CR-04 mantém uma cópia de trabalho em `.claude/worktrees/`, dentro desta pasta e fora do Git, que o validador e o ESLint varrem (20 erros G3 e milhares de avisos, nenhum de arquivo versionado). Os gates desta entrega usam o validador sobre uma exportação do HEAD (`git archive`) e o ESLint com `--ignore-pattern ".claude/**"`; no CI essa pasta não existe.
- Sem mudança de banco, autenticação, schema, saldos, patrimônio, retornos ou dependências.

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
