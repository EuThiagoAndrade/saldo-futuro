# Task — Issue #126: Guardar instituições, classes e detalhes dos ativos no banco (BL-009)

> **Ciclo:** `012`
> **Trilha:** `normal`
> **Estado:** `Aguardando integração`
> **Tipo:** `feature`
> **Issue:** `#126`
> **Plano:** `_project/drafts/012_metadados_classificacao_ativos/012_plan.md`
> **Branch:** `feature/issue-126`
> **PR:** [#129](https://github.com/EuThiagoAndrade/saldo-futuro/pull/129) (`Refs #126`, sem fechar a issue)
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #126" em 2026-10-23
> **Modo contínuo:** `—`
> **Início:** 2026-10-23
> **Última atualização:** 2026-10-23
> **handoff_schema_version:** `2`

## Objetivo

Guardar no banco as instituições e as classes de ativo de cada usuário e os campos descritivos dos ativos (instituição, classe e quatro indicadores), com escrita só por funções isoladas por usuário, conforme o item 1 do plano. Nenhum cálculo lê esses campos.

## Escopo autorizado

Item 1 do plano: migração nova e aditiva, funções, gatilho e preenchimento das classes iniciais, teste novo `08_metadados_ativos`, listas fechadas de `03_funcoes` e KB-003. Fora: qualquer mudança em `src/`, telas (issues #127 e #128), cálculo com os campos e carga retroativa. A PR usa `Refs #126` e não fecha a issue; ela fecha pela PR de encerramento, depois da ação externa (`db push`).

## Origem no backlog

Herdada do plano: BL-009, parcela parcial (campos descritivos), `_project/backlog.md` no commit da fila `5298473` (publicado em `main`). Destino em preparação; nenhum item do backlog é alterado nesta entrega.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não se aplica; conferido | Nenhuma regra de cálculo muda. `grep` por `instituicao`, `classe`, `previdencia`, `liquidez`, `exposicao` e `isento` em `src/lib/financeiro/` e nas funções `fechar_mes`, `apurar_mes` e `saldo_atual` não encontra referência; esta entrega não altera `src/`. Testes e casos de referência existentes passam inalterados (`npm test`, `04_carteira`). |
| G2 — isolamento por RLS | Sim | Duas tabelas novas com RLS, política `select` só das próprias linhas, `authenticated` só com `SELECT` e `anon` sem privilégio. Oito funções `security definer`, `set search_path = ''`, `private.travar_carteira()` primeiro, filtro por `auth.uid()` e `execute` só para `authenticated`. Chaves compostas `(user_id, id)`. Auxiliares e função do gatilho sem `execute` para a Data API. Provado em `08_metadados_ativos` (79 asserções) e em `03_funcoes` (listas fechadas atualizadas, controle negativo preservado). |
| G3 — privacidade de dados | Sim | Testes só com e-mails em `example.com` e nomes inventados ("Banco Exemplo", "Corretora Fictícia", "Classe Ação"). As classes iniciais são nomes genéricos. Nenhum dado real lido ou registrado; `local/` não foi aberto. |
| G4 — migrações só acrescentam | Sim | Migração nova `20261024000829_metadados_ativos.sql`, gerada por `npx supabase migration new metadados_ativos`; as anteriores estão intactas (`git diff --name-status` só com `A` em `supabase/migrations/`). |

## Execução

- [x] Branch `feature/issue-126` a partir de `main` em `8aa86ca`.
- [x] Migração: `public.instituicoes` e `public.classes_ativo`, colunas descritivas em `public.ativos`, gatilho e preenchimento das classes iniciais, oito funções públicas e auxiliares em `private`.
- [x] `supabase/tests/database/08_metadados_ativos.test.sql` com estrutura, classes iniciais, cadastro, compatibilidade de `criar_ativo`, regras e identidade de nomes, edição (inclusive de desativado), exclusão, escrita direta, isolamento de B e do admin sobre entradas, ativo-alvo e referências, anônimo e exclusão do usuário.
- [x] `03_funcoes.test.sql`: oito assinaturas nas duas listas explícitas e na asserção de `security definer`; cinco auxiliares de `private` na asserção de não executáveis; controle negativo preservado; `plan(15)` sem mudança.
- [x] Bloco de preenchimento da migração exercitado à parte, em transação revertida, com um perfil fictício sem classes: o perfil recebeu as cinco.
- [x] KB-003: seção de metadados dos ativos, funções, contagem de asserções e linha do histórico.
- [ ] Ação externa (`db push`) pelo responsável, depois do merge.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| `npx supabase db reset` | Todas as migrações aplicadas, inclusive `20261024000829_metadados_ativos.sql` |
| `npx supabase test db` | 8 arquivos, 342 asserções, `PASS` (antes da atualização, `03_funcoes` reprovava na asserção 3, como previsto no achado R1-1) |
| `npm ci`, `npm run lint` | Sem erros; 3 avisos preexistentes em arquivo ignorado de `local/`, iguais em `main` |
| `npm run typecheck` | Passou |
| `npm test` | 30 arquivos, 358 testes, todos passando |
| `npm run build` | Passou |
| `npm run test:e2e` (com Supabase local) | 193 testes: 180 passaram, 12 ignorados (condicionais do ambiente) e 1 instável — "as páginas da entrega não têm violações de acessibilidade em 360 px" excedeu o tempo de 30 s na primeira tentativa e passou na repetição; o teste percorre várias páginas e não depende desta entrega, que não altera `src/`. A primeira execução, pelo `npm run test:e2e`, foi interrompida depois de 75 aprovações, sem falha; a suíte inteira foi repetida com `CI=1` (servidor do build já feito, uma repetição, como no CI) |
| Validador | `node --test scripts/validate-governance.test.mjs` 48/48; `node scripts/validate-governance.mjs` sem erros |
| `git diff --check` | Sem erros |
| Checks remotos | Pendente |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

- **`NO ACTION` em vez de `RESTRICT` (P-1).** O plano previa `on delete restrict` nas chaves dos ativos para instituições e classes. `RESTRICT` é conferido no momento de cada linha excluída e impediria a exclusão do usuário em cascata a partir de `auth.users` (lição de 2026-10-14 sobre cascata coerente), porque as instituições poderiam ser removidas antes dos ativos que as citam. `NO ACTION` é conferido no fim do comando: a exclusão do usuário funciona (asserção "o usuário com ativos ligados a instituições e classes pode ser excluído") e a exclusão de uma entrada em uso continua recusada, primeiro pela função (`recusado_em_uso`) e, como apoio, pela chave. O efeito pedido por P-1 não muda.
- **Auxiliares em `private`.** `conferir_nome`, `resolver_instituicao` e `resolver_classe` concentram a validação do nome e a resolução da referência (id ou nome novo), usadas por seis funções públicas.
- **Contagem da KB-003.** A lista de asserções da KB estava desatualizada desde os ciclos 006 e 011 (239); foi corrigida para o total atual (342), já que a linha mudava nesta entrega.
- **e2e sem backend.** Localmente, o `.env.local` aponta para o Supabase local, então o e2e foi rodado com backend; a variante sem backend é coberta pelo job de CI "Lint, types, tests, build and preview e2e". Esta entrega não altera `src/`.

## Encerramento

Não se aplica.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 012 (completo)
Quem: Responsável
Conferir: Checks e diff da PR #129 (https://github.com/EuThiagoAndrade/saldo-futuro/pull/129)
Diga: "aprovo o merge da PR #129"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 012 + implementar_issue + 126 + 8aa86ca264c2c8ef45de519b8c9de1eeb79099c3`
- `effect_class`: `remote_mutation`
- `state_before`: plano `v2` `Aprovado`, ciclo `Planejamento`, issue #126 aberta, sem branch nem task.
- `state_after`: plano `Em Execução`, ciclo `Em execução`; branch `feature/issue-126` publicada e PR #129 aberta com `Refs #126`; task `Aguardando integração`.
- `result`: `executed`
- `evidence`: "Evidências" acima; diff da PR #129.
- `blockers`: merge pendente de checks verdes e de "aprovo o merge da PR #129"; depois do merge, ação externa (`db push`) antes das issues #127 e #128.
