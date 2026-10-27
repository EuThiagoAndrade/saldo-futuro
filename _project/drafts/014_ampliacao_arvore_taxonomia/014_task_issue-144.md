# Task — Issue #144: Ampliar a árvore da taxonomia de classes de ativos

> **Ciclo:** `014`
> **Trilha:** `normal`
> **Estado:** `Aguardando integração`
> **Tipo:** `feature`
> **Issue:** `#144`
> **Plano:** `_project/drafts/014_ampliacao_arvore_taxonomia/014_plan.md`
> **Branch:** `feature/issue-144`
> **PR:** [#145](https://github.com/EuThiagoAndrade/saldo-futuro/pull/145) (`Refs #144`, sem fechar a issue)
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #144" em 2026-10-26
> **Modo contínuo:** `—`
> **Início:** 2026-10-26
> **Última atualização:** 2026-10-26
> **handoff_schema_version:** `2`

## Objetivo

Entregar o item 1 do plano: ampliar a árvore global da taxonomia de 39 para 133 nós por uma migração só de inserção, sem alterar nenhum nó existente, com testes, ensaio local de atualização, documentação e o roteiro da ação externa E1.

## Escopo autorizado

Item 1 do plano v3 aprovado, conforme a issue #144: a migração com os 94 nós da tabela "Árvore proposta" (2 subclasses e 92 tipos); a adaptação do pgTAP 09, do unitário da taxonomia e do e2e de detalhes do ativo; o ensaio local; a KB-003 (contagens, orientações de enquadramento e histórico), as novidades e o roteiro E1. Fora: alterar os 39 nós, atributos do BL-015, telas, cálculo, RLS, grants, funções e a execução da E1 em produção. A PR usa `Refs #144` e não fecha a issue, que fica aberta até a E1 e o encerramento.

## Origem no backlog

Não se aplica (herdado do plano).

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não se aplica; conferido | Nenhuma regra de cálculo muda. A distribuição por classe macro do ciclo `013` usa só o nível 1, e todos os nós novos estão sob as seis classes macro. O ensaio local compara o retrato integral (ativos, perfis com a marca de classificação, eventos, transferências, consolidados, posições, instituições, legado e catálogo): nenhuma linha anterior mudou. |
| G2 — isolamento por RLS | Não se aplica; regressão provada | Sem tabela, política, grant ou função nova; a migração só tem `insert` no catálogo. As asserções existentes do pgTAP 09 continuam provando leitura só por `authenticated`, `anon` sem acesso e escrita negada a A, B e ao admin, agora com 133 entradas. |
| G3 — privacidade de dados | Sim | Nomes de nós genéricos, sem ticker, instituição, gestora ou número de lei. Fixtures só com e-mails em `example.com` e nomes inventados, em `tests/fixtures/taxonomia/`. A consulta da E1 lê só o catálogo global. O arquivo de referência em `local/` não foi versionado nem transcrito, e nenhum dado real foi lido. |
| G4 — migrações só acrescentam | Sim | Migração nova `20261027002132_taxonomia_ativos_ampliacao.sql`, gerada por `npx supabase migration new taxonomia_ativos_ampliacao`; nenhuma anterior foi editada. |

## Execução

- [x] Branch `feature/issue-144` a partir de `main` em `346a93a` (plano integrado pela PR #143); plano para `Em Execução` e ciclo para `Em execução`, com a issue registrada.
- [x] Migração com os 94 nós, gerada da tabela aprovada do plano por script e revisada: 2 subclasses (6.6 e 6.7) e 92 tipos, UUIDs pelo código, ordem depois dos irmãos existentes.
- [x] pgTAP 09: 133 nós; 6, 23 e 104 por nível; lista exata em ordem; os 39 originais intactos (UUID, pai, nível, nome e ordem); nenhum algarismo; padrão de indexador só nos UUIDs de Tesouro Selic e Tesouro IPCA+; filho sob tipo novo e exclusão de subclasse nova com filhos recusados; contagens de leitura e escrita atualizadas. `plan` de 163 para 168.
- [x] Unitário `src/lib/telas/taxonomia.test.ts`: ordem numérica acima de 9 e o mesmo nome sob pais diferentes.
- [x] e2e `tests/e2e/ativos-detalhes.spec.ts`: busca "CREDITO bancario" com oito opções e busca "tesouro" com os cinco produtos.
- [x] Fixtures `upgrade_013_fase2.sql` e `e1_014_contagens.sql` e ensaio local de atualização (ver seção própria).
- [x] KB-003 (contagens de asserções e de nós, ampliação, orientações de enquadramento, histórico) e nota nas novidades.
- [x] PR #145 aberta (`Refs #144`).
- [ ] Checks remotos verdes e aprovação do merge.
- [ ] Ação externa E1 pelo responsável, depois do merge.

## Ensaio de atualização (somente local)

Ambiente: Supabase local descartável (contêiner `supabase_db_saldo-futuro`), CLI 2.120.0, sem conexão remota. Passos e resultados reais (2026-10-26):

| # | Comando | Resultado |
| :-- | :-- | :-- |
| a | `npx supabase db reset --local --version 20261026215542 --no-seed` | Banco na fase 2 do ciclo `013` |
| b | `docker exec -i supabase_db_saldo-futuro psql -U postgres -v ON_ERROR_STOP=1 < tests/fixtures/taxonomia/upgrade_013_fase2.sql` | Carga aplicada, sem erro: dois usuários, 9 ativos comuns (ligados a nós de nível 1, 2 e 3, sem classe, com legado e um desativado) e 2 trânsitos |
| c | `psql -A < tests/fixtures/taxonomia/e1_014_contagens.sql` | `nos` 39; níveis 6, 21 e 12; `amostra_original` 3 |
| d | `psql -At < tests/fixtures/taxonomia/retrato_integral.sql > antes.txt` | 72 linhas (39 do catálogo e 33 de dados) |
| e | `npx supabase migration list --local` e `npx supabase migration up --local` | Só `20261027002132` pendente; aplicada |
| f | Mesmas contagens e retrato depois; `comm` dos retratos ordenados | `nos` 133; níveis 6, 23 e 104; `amostra_original` 3. Nenhuma linha anterior perdida ou alterada; 94 linhas novas, todas do catálogo |

Ao terminar: `npx supabase db reset` completo e suíte normal (ver "Evidências"). A migração versionada não foi editada.

## Roteiro E1 (ação humana externa, depois do merge desta PR)

Responsável: o dono do projeto. O agente não recebe credenciais e não consulta a produção. Registrar **somente as contagens** do catálogo.

1. Confirmar o merge, `main` atualizada e o alvo do Supabase (KB-002 S12). `npx supabase migration list`: só `20261027002132_taxonomia_ativos_ampliacao` pendente; outra pendente para antes do push.
2. **Antes do push**, executar no SQL Editor o conteúdo de `tests/fixtures/taxonomia/e1_014_contagens.sql`. Esperado: `nos` 39, níveis 6, 21 e 12, `amostra_original` 3.
3. `npx supabase db push` a partir da `main`; depois, `npx supabase migration list` alinhado.
4. **Depois do push**, a mesma consulta. Esperado: `nos` 133, níveis 6, 23 e 104, `amostra_original` 3.
5. Na aplicação, abrir o cadastro de ativo e buscar "tesouro" no campo Classe, sem gravar nada; os cinco produtos do Tesouro aparecem.
6. Declarar "concluí a ação externa da issue #144". O agente confere o que for acessível e registra o que só o responsável verificou.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| `npx supabase db reset` e `npx supabase test db` | 9 arquivos, 498 asserções (493 anteriores; o 09 passou de 163 para 168), `PASS` |
| Ensaio local de atualização | Passou (ver seção própria) |
| `npm run lint` | Sem erros; 3 avisos preexistentes em arquivo ignorado de `local/` |
| `npm run typecheck` | Passou |
| `npm test` | 33 arquivos, 383 testes, todos passando |
| `npm run build` | Passou |
| `npm run test:e2e` (`CI=1`, Supabase local, com as variáveis do Supabase local no ambiente) | 213 testes: 200 passaram, 13 ignorados (condicionais do ambiente), nenhuma falha. A primeira execução reprovou o caso de busca "CREDITO bancario" (ver "Decisões incidentais") e, depois de uma queda do servidor local no meio da execução (conexão recusada em `127.0.0.1:3000` e processo encerrado), 75 testes por ambiente; a segunda, com a expectativa corrigida, passou inteira |
| Validador | `node --test scripts/validate-governance.test.mjs` 48/48; `node scripts/validate-governance.mjs` com 0 erros e 0 avisos |
| `git diff --check` | Sem erros |
| Checks remotos | Pendente |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

- **Migração gerada da tabela do plano.** Para evitar transcrição manual de 94 linhas, a migração e a lista do pgTAP foram geradas por script a partir da tabela aprovada e da lista dos 39 do teste, e revisadas. O script não foi versionado.
- **Prova dos 39 originais.** Além da lista completa em ordem, uma asserção compara os 39 nós (UUID, pai, nível, nome e ordem) com uma lista literal, como pede o plano.
- **Consulta da E1 só no catálogo.** A ampliação não toca ativos nem perfis; por isso a E1 conta só o catálogo, com uma amostra de três nós originais. A prova integral de que nada mais muda é o ensaio local.
- **Busca "CREDITO bancario" com oito opções, não sete.** O plano previa sete (a subclasse, os três tipos antigos e os três novos de Crédito bancário). A primeira execução do e2e mostrou uma oitava, "Renda fixa › Crédito corporativo › Cédulas de crédito bancário": a busca vale para o caminho inteiro (DESIGN.md 6.8), e o nome do tipo contém "crédito bancário". É o comportamento especificado; a expectativa do teste foi corrigida, sem mudar código nem árvore.
- **Versão da nota em novidades.** A nota entrou em `0.10.0`, com data nula, porque a PR de release #141 (`0.10.0`) está aberta e o release-please acrescenta a ela os commits integrados antes do seu merge. Se a #141 for integrada antes desta PR, a nota passa para a versão seguinte antes do merge. A data é registrada no encerramento.

## Encerramento

Não se aplica.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 014 (completo)
Quem: Responsável
Conferir: checks e diff da PR https://github.com/EuThiagoAndrade/saldo-futuro/pull/145
Diga: "aprovo o merge da PR #145"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 014 + implementar_issue + 144 + 346a93aa686bcb6c3851b7edcdc18ceb0916aa46`
- `effect_class`: `remote_mutation`
- `state_before`: plano `Aprovado` e integrado pela PR #143; issue #144 aberta; `main` em `346a93a`; autorização "autorizo a implementação da issue #144".
- `state_after`: entrega commitada na branch `feature/issue-144` e publicada na PR #145 (`Refs #144`); gates locais verdes; aguardando checks remotos e aprovação específica do merge; E1 depois do merge.
- `result`: `executed`
- `evidence`: seção "Evidências", ensaio local e https://github.com/EuThiagoAndrade/saldo-futuro/pull/145.
- `blockers`: o merge depende de checks verdes e de "aprovo o merge da PR #145".
