# Task — Issue #29: benchmarks, sincronização com o SGS e comparação

> **Ciclo:** `003`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `feature`
> **Issue:** `#29`
> **Plano:** `_project/executed/003_regras_financeiras/003_plan.md`
> **Branch:** `feature/issue-29`
> **PR:** [#34](https://github.com/EuThiagoAndrade/saldo-futuro/pull/34)
> **Integração:** `Integrada por squash em 72fe937, em 2026-10-14`
> **Autorização inicial:** "autorizo a implementação da issue #29" em 2026-10-14
> **Modo contínuo:** `—`
> **Início:** 2026-10-14
> **Última atualização:** 2026-10-14
> **handoff_schema_version:** `2`

Instanciada a partir de `.agent/templates/task.md`. Ponto de aprovação "Autorizar implementação" da issue D concedido pelo responsável em 2026-10-14, depois da integração da issue C (PR #33, `e4102a8`). Última issue do ciclo; depois do merge vêm a ação externa e a verificação em produção.

## Objetivo

Entregar o item D do plano:

- catálogo, valores e cobertura de benchmark, com a semente de CDI e IPCA;
- a função de carga, único caminho de escrita;
- o módulo de sincronização com o SGS;
- as regras de composição, completude, acumulado, comparação e taxa de acerto, testadas contra os casos CR-40 a CR-48.

## Escopo autorizado

- Migração nova `supabase/migrations/20261014193630_benchmarks.sql`, gerada por `supabase migration new`.
- `supabase/tests/database/06_benchmarks.test.sql` e a inclusão da função de carga em `03_funcoes.test.sql`.
- `src/lib/financeiro/benchmarks.ts` com `casos-d.test.ts`; `src/lib/benchmarks/sgs.ts` com `sgs.test.ts`.
- Esta task (com a lista de migrações e o roteiro da ação externa), a reconciliação da task da issue #28 e a rastreabilidade do plano.

Fora do escopo: rota HTTP e tela de sincronização (ciclo `004`), importação manual, tracking error, information ratio, beta e benchmark de valor absoluto (D14).

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim | CR-40 a CR-48 passando a partir do JSON da KB-004; valores gravados exatamente como publicados (D1, teste de `0.00012345`); mês parcial `N/D`, nunca zero; cobertura igual no TypeScript e no banco (CR-48 nas duas camadas) |
| G2 — isolamento por RLS | Sim | Três tabelas novas com RLS e só `select` para `authenticated`; nenhuma escrita direta, nem do admin; carga recusada para quem não é admin; teste com usuário, admin e anônimo; função de carga na lista de `03_funcoes.test.sql` |
| G3 — privacidade de dados | Sim | Séries globais sem dado do usuário; valores fictícios de 0,04% ao dia e códigos SGS públicos (12 e 433) ou fictícios (999001) |
| G4 — migrações só acrescentam | Sim | Uma migração nova; as três existentes intactas |

## Execução

- [x] Migração:
  - `benchmarks` (código SGS único, periodicidade `diaria` ou `mensal`), `valores_benchmark` (`numeric` sem escala) e `coberturas_benchmark`;
  - RLS e só `select` para `authenticated`;
  - gatilho que torna código e periodicidade imutáveis;
  - semente de CDI (12, diária) e IPCA (433, mensal).
- [x] `public.carregar_benchmark` (`security definer`):
  - exige `private.is_admin()` e trava o benchmark;
  - valida todos os itens antes de gravar: data na janela, única e no dia 1 na série mensal; valor numérico em texto;
  - recusa buraco e carga sem valores;
  - substitui os valores da janela e recalcula a cobertura numa só transação.
- [x] `06_benchmarks.test.sql` (43 asserções): privilégios, semente, escrita direta recusada para usuário e admin, carga recusada para não admin, validações sem gravação parcial, CR-48, idempotência, revisão da fonte, precisão (D1) e imutabilidade (D8).
- [x] `03_funcoes.test.sql`: `carregar_benchmark` na lista explícita e na verificação de `security definer`; `benchmark_imutavel` entre os auxiliares sem execução.
- [x] `src/lib/financeiro/benchmarks.ts`: composição diária com completude (K4), retorno mensal, acumulado, comparação em p.p. e em % (K3), taxa de acerto (K9) e cobertura depois da carga.
- [x] `src/lib/benchmarks/sgs.ts`: janelas de até 10 anos sem sobreposição, datas `dd/MM/aaaa`, valores lidos como texto, validação de todas as respostas e uma única chamada à função de carga, com `fetch` e cliente injetados.
- [x] `casos-d.test.ts` (11 testes) e `sgs.test.ts` (18 testes), sem rede; esperados alterados (CR-40, CR-41, CR-46 e CR-48) reprovam o teste.

## Migrações do ciclo `003` a aplicar em produção

| Migração | Issue | Conteúdo |
| :-- | :-- | :-- |
| `20261014185205_carteira.sql` | #27 | Carteira: ativos, eventos, transferências, consolidado e posições, com as funções de escrita |
| `20261014193630_benchmarks.sql` | #29 | Benchmarks: catálogo semeado, valores, cobertura e a função de carga |

## Roteiro da ação externa (KB-002, S12)

Depois do merge desta PR, pelo responsável, com o acesso de produção da KB-002:

1. `git checkout main` e `git pull`, para enviar exatamente as migrações integradas (KB-002, armadilha 8).
2. `npx supabase db push`: aplica as duas migrações acima, nesta ordem.
3. `npx supabase migration list`: as quatro migrações (acesso, keepalive, carteira e benchmarks) aparecem nas colunas local e remota.
4. Informar no chat: "concluí a ação externa da issue #29", com o resultado do passo 3 descrito em texto, sem identificadores.

Nada mais muda no painel do Supabase ou na Vercel. Nenhuma sincronização do SGS é feita em produção neste ciclo.

## Verificação em produção

Somente leitura, sem tocar linhas de carteira, pelos itens do plano. Resultados informados pelo responsável (editor SQL do Supabase, navegador e PowerShell) e conferidos pelo agente onde ele tinha acesso.

| Item | Resultado |
| :-- | :-- |
| Migrações do ciclo aplicadas | Quatro migrações em `supabase_migrations.schema_migrations` (acesso, keepalive, carteira e benchmarks); o agente conferiu por `npx supabase migration list`, local e remoto alinhados |
| RLS nas tabelas de `public` | Dez tabelas, todas com RLS ativo |
| Catálogo | CDI (12, diária) e IPCA (433, mensal) |
| `/entrar` | Abriu normalmente; o agente obteve HTTP 200 |
| Keepalive | Com o segredo, `ok : True` (teste direto da KB-002); sem o segredo, o agente obteve HTTP 401 |

**Limitação:** os logs da Vercel no plano gratuito só cobrem a última hora, então a chamada diária do cron não pôde ser vista nos logs. A prova direta é o teste do keepalive com o segredo.

A release `v0.2.0` foi publicada pelo merge da PR #32, depois desta verificação, com os checks disparados por `workflow_dispatch` verdes no commit `2c51993`.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| `npx supabase test db` | 6 arquivos, 239 asserções, todas passaram (43 novas em `06_benchmarks`) |
| Testes | `npm test`: 9 arquivos, 100 testes passaram (29 novos); `npm run lint` sem erro (os 3 avisos vêm de `local/`, ignorado pelo Git); `npm run typecheck` e `npm run build` sem erro |
| Validador | `node scripts/validate-governance.mjs`: 0 erros, 0 avisos |
| `git diff --check` | Passou |
| Checks remotos | PR #34 no commit `7affbed`: Validate governance, os dois jobs de CI (inclusive `supabase test db`) e os dois da Vercel verdes; merge aprovado ("aprovo o merge da PR #34") e feito por squash |
| Ação externa | "concluí a ação externa da issue #29" (2026-10-14): `db push` das duas migrações; o responsável viu as quatro migrações nas colunas local e remota do `migration list`, e o agente conferiu o mesmo resultado por leitura |
| Verificação em produção | "autorizo a verificação em produção do ciclo 003" (2026-10-14); resultados na seção "Verificação em produção" |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

- **Módulo do SGS sem `server-only`:** como o `keepalive`, o módulo recebe o `fetch` e o cliente por injeção e não importa nada de servidor, para ser testável no Vitest; a rota que o usará, no ciclo `004`, é que roda no servidor.
- **Resposta não OK do SGS:** qualquer status diferente de 2xx encerra a sincronização sem gravar (inclusive o 406 de V2). O comportamento do SGS para uma janela sem nenhuma publicação não foi verificado; se ele responder com erro, a carga é recusada, e não esvaziada.
- **Janelas também para a série mensal:** o limite de 10 anos da documentação vale para séries diárias; o módulo aplica as mesmas janelas a todas, o que é inofensivo.
- **Nenhuma mudança na KB-004:** as regras implementadas são as das seções 9.1 a 9.4.

## Encerramento

Não se aplica.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 003 (completo)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 003 + implementar_issue + 29/D + e4102a8`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: antes, `main` @ `e4102a8`, com as issues A a C integradas e a issue #29 aberta; depois, PR #34 integrada por squash em `72fe937`, com os checks verdes; issue #29 fechada; migrações aplicadas em produção pela ação externa e verificação em produção concluída; release `v0.2.0` publicada. Reconciliada na PR de encerramento do ciclo.
- `result`: `executed`
- `evidence`: tabela "Evidências" desta task.
- `blockers`: nenhum.
