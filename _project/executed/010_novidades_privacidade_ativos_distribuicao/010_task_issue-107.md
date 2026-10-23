# Task — Issue #107: Mostrar distribuição patrimonial em rosca acessível

> **Ciclo:** `010`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `feature`
> **Issue:** `#107`
> **Plano:** `_project/executed/010_novidades_privacidade_ativos_distribuicao/010_plan.md`
> **Branch:** `feature/issue-107`
> **PR:** [#112](https://github.com/EuThiagoAndrade/saldo-futuro/pull/112)
> **Integração:** `Conferida no GitHub — PR #112 MERGED em 2026-10-22; verificação em produção e release 0.7.0 concluídas; encerramento do ciclo prospectivo até o merge da PR de encerramento`
> **Autorização inicial:** "autorizo a implementação da issue #107" em 2026-10-21
> **Modo contínuo:** `—`
> **Início:** 2026-10-21
> **Última atualização:** 2026-10-22
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
- [x] Layout: lado a lado só de `md` até antes de `lg`; empilhado na meia coluna do Início (correção da rolagem de 1 px em 1024 px).
- [x] PR #112 publicada via `gh`, base `main`, com `Closes #107`; commits `3e1cfc8` (G1), `cfe4ce8` (entrega) e `451d004` (layout).

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
| Checks remotos | Todos verdes no head `78dec2c3fe99fbb8913adbacd16642f070924000`: lint, tipos, testes, build e e2e de preview; Supabase local, testes de banco e e2e de autenticação; governança; Vercel |

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

## Reconciliação da integração

Em 2026-10-22, o responsável declarou "aprovo o merge da PR #112". A nota da `0.7.0` e a ordem dos negativos e omitidos estavam listadas para revisão na descrição da PR e nesta task, sem pedido de ajuste. O agente conferiu todos os checks verdes no head `78dec2c` e a PR `CLEAN`, fez o squash travado nesse HEAD, com o assunto `feat(issue-107): mostrar distribuição patrimonial em rosca acessível (#112)`, conferido em `main`, e a issue #107 fechou como concluída. O deploy de produção da `main` terminou com sucesso. Ao conferir o deploy, o agente fez um único GET anônimo de `/termos` no domínio de produção (resposta 200), antes da autorização de verificação em produção; foi informado ao responsável e não se repetiu. Não registra o SHA do próprio merge.

## Ação externa da issue #104

Esta task é o artefato ativo da etapa externa e da verificação em produção, como o plano define; o código das quatro entregas está integrado (PRs #108, #110, #111 e #112).

Em 2026-10-22, o responsável executou o roteiro O1 a O6 da KB-002 e declarou "concluí a ação externa da issue #104", com o resultado sanitizado:

| Passo | Resultado declarado |
| :-- | :-- |
| O1 — páginas no ar | ok |
| O2 — escopos | só identidade básica |
| O3 — domínio | verificado |
| O4 — Audience | em produção |
| O4 — Branding | não solicitado |
| O5 — login de conta autorizada no app, fora da lista de teste do Google | passou |
| O5 — recusa de conta fora da lista do app | passou |

**Resultado mínimo comprovado pelo responsável:** Audience publicada e login fora da lista de teste. Branding fica como não solicitado, sem impedir o resultado. A frase não substitui o que o agente pode conferir por leitura: o console e o login são evidência declarada, e a conferência pública das páginas pelo agente fica para a verificação em produção, que depende da autorização própria. Nenhum ID, e-mail ou print entrou neste registro. O fechamento da issue #104, a reconciliação da task #104 e os fatos da KB-002 entram na PR de encerramento.

## Verificação em produção

Autorização: "autorizo a verificação em produção do ciclo 010" em 2026-10-22. Deploy de produção da `main` em `baabb6a` concluído com sucesso. Leitura anônima pelo agente, sem login e sem dados:

| Item | Resultado |
| :-- | :-- |
| `/entrar`, `/privacidade` e `/termos` | 200, sem redirecionamento; títulos e descrições da metadata corretos |
| `/entrar` | Logo e "Entrar com Google" centralizados e links para `/privacidade` e `/termos`; sem campo de senha e sem aviso de preview, como em produção (conferência visual em 375 px) |
| `/privacidade` e `/termos` | Links cruzados; contato publicado idêntico ao do código revisado (comparação sem exibir o endereço) |
| `/termos` como página inicial no Google | Identifica o app, tem a seção "O que é o Saldo Futuro" com a funcionalidade e leva à política |
| Proteção sem sessão | `/`, `/novidades`, `/ativos`, `/ativos/novo`, `/conta` e `/admin` respondem 307 para `/entrar` |

**Limitações:** o agente não entra na aplicação em produção; login, lista de acesso, Novidades, Ativos e a rosca dependem da conferência autenticada do responsável, declarada abaixo quando ocorrer. Antes da autorização, um GET anônimo de `/termos` já tinha sido feito (ver "Reconciliação da integração").

**Conferência autenticada do responsável** (2026-10-22, evidência declarada, no celular, sem lançamento de teste e sem dados reais na resposta): "1 passou; 2 passou; 3 passou; 4 passou; 5 passou. Sem limitações."

| Item | Resultado declarado |
| :-- | :-- |
| 1 — login com a conta do responsável e Conta com os links legais | passou |
| 2 — Novidades em Mais com a versão `0.6.0` e o histórico indisponível | passou |
| 3 — Ativos com Novo ativo no topo e abas com contadores | passou |
| 4 — Início com a rosca, Outros e "Ver os números" | passou |
| 5 — Ocultar valores na rosca, com percentuais visíveis | passou |

**Verificação em produção concluída**, sem falha relevante.

## Preparação da release 0.7.0

- **PR real do release-please:** [#109](https://github.com/EuThiagoAndrade/saldo-futuro/pull/109), `chore(main): release 0.7.0`, head `0eb07ea` sobre `baabb6a` (a `main` com as quatro entregas). Altera só `package.json`, `package-lock.json`, `.release-please-manifest.json` (`0.6.0` → `0.7.0`) e `CHANGELOG.md`, com as quatro entregas (#108, #110, #111 e #112). Nenhuma edição manual na PR. As notas da `0.7.0` já estão em `src/lib/novidades.ts` desde as PRs dos itens.
- **Checks por `workflow_dispatch` em 2026-10-22:** governança verde; CI "Lint, types, tests, build and preview e2e" verde; CI "Supabase local, database tests and auth e2e" sem resultado. Na primeira tentativa o job bateu o limite de 20 minutos com o e2e quase no fim (148 de cerca de 175 testes passando, com preparação lenta do runner; nas PRs do ciclo o job levou de 10 a 13 minutos). Na repetição, o GitHub não iniciou o job: "The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings". As execuções `pull_request` da PR ficam em `action_required`, como em toda PR do bot. Vercel verde.
- **Sem checks verdes, o merge da release não pode ocorrer.** Resolver a cobrança ou o limite de gastos do GitHub Actions é configuração da conta do responsável; o agente não lê nem altera essa configuração.
- **Resolução (2026-10-22):** o responsável tornou o repositório público (o Actions passa a ser gratuito em repositório público) depois de uma auditoria somente leitura do histórico, das issues e das PRs, sem segredo nem dado real encontrado, e ajustou as proteções do GitHub. O CI e a governança da PR #109 foram disparados por `workflow_dispatch` no head `0eb07ea` e passaram, inclusive o job de banco (execuções 39869022365 e 39869026053). O ruleset recusava o merge por exigir checks com nomes de arquivo; o responsável corrigiu os três checks obrigatórios e as execuções `pull_request` que estavam em `action_required` rodaram e ficaram verdes, conforme o responsável informou. Com a PR `CLEAN` conferida pelo agente, o agente fez o squash após "aprovo o merge da PR #109" (commit `aa808ce`). O release-please publicou a release `v0.7.0` em 2026-10-22 às 23:41 UTC (19:41 em America/Cuiaba) e o CI da `main` ficou verde.

## Próximo passo

Entrega integrada e ciclo 010 encerrado; o encerramento está em `010_task_closure.md`.

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 010 (completo)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 010 + preparar_release + 0.7.0/PR-109 + 0eb07ea`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: PR #109 conferida e Parada por bloqueio de cobrança do GitHub Actions / PR #109 integrada por squash em `main` (`aa808ce`), release `v0.7.0` publicada e CI da `main` verde
- `result`: `executed`
- `evidence`: execuções 39869022365 (CI) e 39869026053 (governança) no head `0eb07ea`; aprovação "aprovo o merge da PR #109" em 2026-10-22; PR `MERGED` e release `v0.7.0` conferidas no GitHub
- `blockers`: nenhum. Encerramento do ciclo na PR própria (ver `010_task_closure.md`)
