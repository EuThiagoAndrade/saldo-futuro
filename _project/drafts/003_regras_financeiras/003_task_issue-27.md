# Task — Issue #27: schema da carteira, lançamentos e fechamento mensal

> **Ciclo:** `003`
> **Trilha:** `normal`
> **Estado:** `Aguardando integração`
> **Tipo:** `feature`
> **Issue:** `#27`
> **Plano:** `_project/drafts/003_regras_financeiras/003_plan.md`
> **Branch:** `feature/issue-27`
> **PR:** [#31](https://github.com/EuThiagoAndrade/saldo-futuro/pull/31)
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #27" em 2026-10-14
> **Modo contínuo:** `—`
> **Início:** 2026-10-14
> **Última atualização:** 2026-10-14
> **handoff_schema_version:** `2`

Instanciada a partir de `.agent/templates/task.md`. Ponto de aprovação "Autorizar implementação" da issue B concedido pelo responsável em 2026-10-14, depois da integração da issue A (PR #30, `d8fcae4`), como exige a sequência A → B → C → D.

## Objetivo

Entregar o item B do plano: o schema da carteira com RLS e escrita só por funções `security definer` sob a trava por usuário (D13), as regras de lançamento, estorno, transferência, fechamento e reabertura no banco, os módulos TypeScript correspondentes e os testes dos casos de referência CR-01 a CR-18 nas duas camadas.

## Escopo autorizado

- Migração nova `supabase/migrations/20261014185205_carteira.sql`, gerada por `supabase migration new`.
- Testes de banco: `04_carteira.test.sql`, `05_concorrencia.test.sql` e a adaptação cirúrgica de `03_funcoes.test.sql` (R1-6).
- Módulos `src/lib/financeiro/centavos.ts`, `datas.ts`, `eventos.ts` e `fechamento.ts`, com `casos-b.test.ts`.
- KB-004: regras operacionais explicitadas na implementação (ver "Decisões incidentais").
- Esta task, a reconciliação da task da issue #26 e a rastreabilidade do plano.

Fora do escopo: consolidação e rentabilidade (issue #28), benchmarks (issue #29), telas, rotas e migração de dados.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim | CR-01 a CR-18 passando em TypeScript (`casos-b.test.ts`, lendo o JSON) e no banco (`04_carteira.test.sql`, com os mesmos valores); centavos em `bigint` no TypeScript e acumulação em `numeric` no banco, com a mesma faixa e as mesmas recusas (D11); identidade contábil conferida pela função e por restrição da tabela; KB-004 atualizada |
| G2 — isolamento por RLS | Sim | Cinco tabelas novas com RLS, só `select` nas próprias linhas; nenhuma escrita direta, nem do admin; chaves estrangeiras compostas com `user_id`; tentativas de B sobre a carteira de A recusadas; admin sem leitura de carteira alheia; lista explícita de funções executáveis por `authenticated` em `03_funcoes.test.sql` |
| G3 — privacidade de dados | Sim | Testes só com e-mails em `example.com`, nomes de ativo fictícios e os valores dos casos; nenhum dado do usuário |
| G4 — migrações só acrescentam | Sim | Uma migração nova; as duas existentes intactas |

## Execução

- [x] Viabilidade do `dblink` no Supabase local conferida no início: a extensão existe; a conexão precisa de senha e do endereço do próprio servidor (`inet_server_addr()`), porque o `pg_hba` dá `trust` só ao loopback e o dblink exige credencial de quem não é superusuário. Funciona dentro de `supabase test db`.
- [x] Migração: tipos `tipo_ajuste` e `tipo_evento`; tabelas `ativos`, `transferencias`, `eventos`, `consolidados_mensais` e `posicoes_mensais`; faixa ±(2⁵³ − 1) em toda coluna monetária; identidade como restrição do consolidado; trânsito único por índice parcial; cascatas só a partir de `auth.users` (revogação).
- [x] Funções `security definer` com `search_path` vazio, `auth.uid()` e a trava `pg_advisory_xact_lock` por usuário como primeiro passo: `criar_ativo`, `desativar_ativo`, `lancar_evento`, `estornar_evento`, `transferir`, `corrigir_transferencia`, `fechar_mes` e `reabrir_mes`. Auxiliares em `private`, sem execução pela Data API.
- [x] `03_funcoes.test.sql`: a asserção que só aceitava `is_admin` passou a listar as assinaturas autorizadas; uma função fora da lista é detectada; as funções da carteira são `security definer` e os auxiliares não são executáveis.
- [x] `04_carteira.test.sql` (112 asserções): privilégios, escrita direta recusada, imutabilidade, isolamento entre A, B, o admin e o anônimo, CR-01, CR-03 a CR-06, CR-12, CR-13, CR-15 a CR-18 e CR-07 a CR-11.
- [x] `05_concorrencia.test.sql` (13 asserções): lançamento contra fechamento (recusa por `lock_timeout` e inclusão com `dblink_send_query`), criação de ativo contra fechamento, fechamento contra fechamento e fechamento contra reabertura, sem mês fechado divergente dos eventos. Fixtures confirmadas e removidas pela própria sessão; o teste passa em execuções seguidas.
- [x] Módulos TypeScript e `casos-b.test.ts` (22 testes): CR-01 a CR-18 a partir do JSON, fronteira e faixa dos centavos, datas e independência do fuso (`UTC`, `Pacific/Kiritimati` e `America/Cuiaba`).
- [x] Conferido que um valor esperado alterado no JSON reprova os testes TypeScript.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| `npx supabase test db` | 5 arquivos, 196 asserções, todas passaram (68 anteriores, 3 novas em `03_funcoes`, 112 em `04_carteira` e 13 em `05_concorrencia`) |
| Testes | `npm test`: 6 arquivos, 48 testes passaram; `npm run lint` sem erro (os 3 avisos vêm de `local/`, ignorado pelo Git); `npm run typecheck` e `npm run build` sem erro; `node --test scripts/validate-governance.test.mjs`: 39 passaram. A ponta a ponta com backend fica para o CI |
| Validador | Pendente |
| `git diff --check` | Passou |
| Checks remotos | Pendente |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

- **Mês aberto sem linha:** em vez de uma tabela de meses com estado, um mês fechado é uma linha de `consolidados_mensais`; o mês aberto não tem linha. Reabrir apaga o consolidado e, em cascata, as posições (D6). O plano deixou os nomes para a PR.
- **Escopo da pendência:** só exige saldo real o ativo com histórico no mês (posição no mês anterior ou evento no mês). Sem isso, um ativo criado hoje exigiria saldo para meses antigos em que não existia. O resultado do cálculo não muda (um ativo sem histórico teria saldo e ajuste zero). Registrado na KB-004, seção 5.
- **Datas mínimas:** estorno e correção de transferência não podem ter data anterior à do evento original. O trânsito não recebe lançamento comum (coerente com K12). Registrado na KB-004, seções 4.3 e 4.4.
- **Desativação:** exige saldo calculado atual zero (último saldo final mais eventos posteriores); a KB-004, seção 4.1, foi ajustada a essa forma.
- **Cascatas:** as chaves de `eventos` e `posicoes_mensais` para `ativos` e entre eventos são `on delete cascade`, porque a revogação de um usuário (ADR-003, `delete from auth.users`) falharia sem isso. Nenhuma função exclui linhas, exceto a reabertura.
- **Motivos de recusa:** o banco devolve a mensagem `recusado_<motivo>`; os motivos que a KB não nomeia (sinal, tipo, data, ativo inválido) aparecem como `recusado` nos casos.
- **Senha no teste de concorrência:** a conexão do `dblink` usa o usuário e a senha padrão do Supabase local (`postgres`), que não são segredo e só existem no ambiente local e no CI.

## Encerramento

Não se aplica.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 003 (completo)
Quem: Responsável
Conferir: [PR #31](https://github.com/EuThiagoAndrade/saldo-futuro/pull/31): checks (inclusive supabase test db), diff, migração da carteira, funções security definer e casos CR-01 a CR-18
Diga: "aprovo o merge da PR #31"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 003 + implementar_issue + 27/B + d8fcae4`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: antes, `main` @ `d8fcae4`, com a issue A integrada, plano `Em Execução` e issue #27 aberta; depois, branch `feature/issue-27` publicada com o item B e PR #31 aberta, aguardando checks e a aprovação do merge.
- `result`: `executed`
- `evidence`: tabela "Evidências" desta task.
- `blockers`: "aprovo o merge da PR #31", com os checks verdes.
