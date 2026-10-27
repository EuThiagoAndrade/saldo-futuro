# Task — Issue #138: Usar taxonomia no cadastro e congelar classes legadas (BL-014 e parcela de BL-009)

> **Ciclo:** `013`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `feature`
> **Issue:** `#138`
> **Plano:** `_project/drafts/013_taxonomia_classes_alocacao/013_plan.md`
> **Branch:** `feature/issue-138`
> **PR:** [#142](https://github.com/EuThiagoAndrade/saldo-futuro/pull/142) (`Refs #138`, sem fechar a issue)
> **Integração:** PR #142 integrada por squash (`3dd60910ace387d03a2cff878f2ea0e9acd816a6`) em 2026-10-26, com deploy de produção às 22:21 UTC; ação externa E2 concluída em 2026-10-26; issue #138 aberta até o encerramento do ciclo
> **Autorização inicial:** "autorizo a implementação da issue #138" em 2026-10-26
> **Modo contínuo:** `—`
> **Início:** 2026-10-26
> **Última atualização:** 2026-10-26
> **handoff_schema_version:** `2`

## Objetivo

Entregar o item 2 do plano: o cadastro e a edição do ativo passam a escolher a classe na taxonomia global (seletor único, opcional, com o caminho completo e sem criação), a aba Classes sai de Cadastros e a migração da fase 2 fecha a janela de transição, retirando as funções antigas e deixando o legado só de leitura. Nenhuma distribuição por classe é feita aqui (unidade 3).

## Escopo autorizado

Item 2 do plano, conforme a issue #138: leitura, tipos, validação e ações do cadastro e da edição sobre as RPCs novas; seletor único "Classe" com busca no caminho completo sem acentos e sem criação; nome do nó nas listas e caminho no seletor e na edição, com "Sem classe (antes: X)" quando só há legado; retirada do CRUD e da aba Classes (Cadastros mantém Instituições, inclusive em `?aba=classes`); migração 2 e roteiro E2; DESIGN.md para o seletor e a lista; reconciliação da task #137 após o E1. Fora: distribuição macro (unidade 3), execução de E2 em produção e mudanças em instituição e nos quatro indicadores. A PR usa `Refs #138` e não fecha a issue, que fica aberta até E2 e o encerramento.

## Origem no backlog

Herdada do plano: BL-014 (integral) e BL-009 (parcela das visões por classe), `_project/backlog.md` no commit da fila `db80df2` (conteúdo igual ao de `main` em `757ceac`, publicado). Destino em preparação; nenhum item do backlog é alterado nesta entrega.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não se aplica; conferido | Nenhuma regra de cálculo muda: a classe só descreve o ativo e nada em `src/lib/financeiro/` a lê. A migração só retira funções: o retrato integral de 81 linhas fictícias (ativos, perfis, eventos, transferências, consolidados, posições, instituições, classes e catálogo) ficou idêntico antes e depois. `04_carteira`, `05_concorrencia` e `07_migracao_transito` passam inalterados. |
| G2 — isolamento por RLS | Sim | Nenhuma tabela nova. A retirada das funções reduz a superfície de escrita: `classes_ativo` fica sem nenhum privilégio de escrita para `anon`, `authenticated`, `service_role` e `public`, e nenhuma função em `public` ou `private` a escreve (asserções em `09_taxonomia_ativos`). As funções novas continuam sob a trava da carteira e a autenticação, com o isolamento provado em `08_metadados_ativos` e `09_taxonomia_ativos` (B e admin não leem nem alteram ativos, instituições, marca ou classe de A). `03_funcoes` com as listas fechadas atualizadas. |
| G3 — privacidade de dados | Sim | Fixtures e testes só com e-mails em `example.com` e nomes inventados. Fixtures SQL só em `tests/fixtures/taxonomia/`. As consultas do E2 devolvem só contagens agregadas. Nenhum dado real lido; `local/` não foi aberto. A dica "antes: X" é lida sob a RLS e só exibida ao dono. |
| G4 — migrações só acrescentam | Sim | Migração nova `20261026215542_taxonomia_ativos_fase2.sql`, gerada por `npx supabase migration new taxonomia_ativos_fase2`; as anteriores estão intactas (`git diff --name-status` só com `A` em `supabase/migrations/`). A migração só remove funções (sem `cascade`), nunca dados nem colunas. |

## Execução

- [x] Branch `feature/issue-138` a partir de `main` em `c7fc48f` (PR #140 integrada e E1 concluída).
- [x] Migração 2: `drop` das funções `criar_classe`, `renomear_classe`, `excluir_classe`, das assinaturas antigas de `cadastrar_ativo` e `editar_detalhes_ativo` e de `private.resolver_classe`, sem `cascade`. `criar_ativo` e as funções de instituição permanecem.
- [x] Banco: `03_funcoes`, `08_metadados_ativos` (instituições, funções novas e legado só de leitura) e `09_taxonomia_ativos` (retirada das funções, legado sem escrita) reescritos para o schema final.
- [x] `src/lib/telas/taxonomia.ts` (árvore validada, caminho completo, texto da classe nas listas) e testes; `leituras.ts` (`lerTaxonomia`, `lerClassesLegadas`, `taxonomia_id` em `Ativo`); `detalhes-ativo.ts` (campo `taxonomia`, sem nome novo de classe); ações de ativo nas RPCs novas; mensagem `taxonomia_inexistente`.
- [x] Telas: seletor único de classe, "Classe atual" na edição, listas das duas abas com o nome do nó ou "Sem classe (antes: X)"; Cadastros só com Instituições; `CATALOGOS`, ações e testes de catálogo sem classes.
- [x] e2e `ativos-detalhes.spec.ts` (caminho, busca pelo ancestral, sem criação, nó inexistente por formulário adulterado e por função, caminho longo no celular, edição e limpeza) e `cadastros.spec.ts` (só Instituições, `?aba=classes`).
- [x] DESIGN.md (6.7 emenda, 6.8 seletor de classe da taxonomia, 6.12 e a descrição de Cadastros).
- [x] KB-003 (estado final da taxonomia, funções, legado, interface, contagem de asserções e histórico); task #137 reconciliada (PR #140 integrada e E1 concluída).
- [x] Ensaios locais de upgrade da fase 2 e e2e no schema da fase 1 (ver "Ensaio de upgrade").
- [x] PR #142 aberta (`Refs #138`).
- [x] Checks remotos verdes e merge aprovado pelo responsável; PR #142 integrada em `3dd6091`.
- [x] Deploy novo confirmado (ambiente `Production` do commit `3dd6091`, 22:21 UTC) e ação externa E2 pelo responsável (ver "Ação externa").

## Ensaio de upgrade (somente local)

Ambiente: Supabase local descartável (contêiner `supabase_db_saldo-futuro`), CLI 2.120.0, sem conexão remota. A carga é `tests/fixtures/taxonomia/upgrade_013_fase1.sql`, sobre o schema da fase 1: dois usuários fictícios, classes do legado, ativos cadastrados e editados pelas funções antigas (sem nó), cadastrados pelas novas (nós de níveis 1, 2 e 3), um mapeado e depois editado pela tela antiga, um desativado, eventos e um mês fechado por usuário. Resultados reais (2026-10-26):

| # | Comando | Resultado |
| :-- | :-- | :-- |
| a | `npx supabase db reset --local --version 20261026204955 --no-seed` | Banco na migração da fase 1, com as funções antigas e novas |
| b | `docker exec -i supabase_db_saldo-futuro psql -U postgres -v ON_ERROR_STOP=1 < tests/fixtures/taxonomia/upgrade_013_fase1.sql` | Carga aplicada, sem erro |
| c | `psql … < app_nova_verificacao.sql` | **Aplicação nova com banco expandido:** "todas as conferências passaram" (só funções novas: cadastro e edição com nó, limpar, marca, legado intacto, nó inexistente recusado) |
| d | `psql -A -F' \| ' < e2_previa.sql` e `psql -At < retrato_integral.sql > retrato2_antes.txt` | `classes_legadas` 5, `ativos_com_legado` 4, `ativos_com_no` 6, `ativos_comuns` 11, `funcoes_antigas` 5; retrato de 81 linhas |
| e | `npx supabase migration list --local` e `npx supabase migration up --local` | Só `20261026215542` pendente; aplicada |
| f | `e2_posterior.sql`, mesmo retrato e `app_nova_verificacao.sql` de novo | Contagens iguais às prévias; `funcoes_antigas` 0, `funcoes_novas` 3, `auxiliar_antigo` 0, `escrita_no_legado` 0, `leitura_do_legado` 1; `diff` dos retratos vazio (81 linhas idênticas); **aplicação nova com o legado só de leitura:** "todas as conferências passaram" |
| g | `npx supabase db reset --local --version 20261026204955`; `npx playwright test tests/e2e/cadastros.spec.ts tests/e2e/ativos-detalhes.spec.ts` (build desta entrega, `CI=1`, Supabase local) | **App novo antes da migração 2:** 20 passaram (as funções antigas ainda existiam no banco, 2 de 2 conferidas) |
| h | `npx supabase db reset` completo; `npx supabase test db`; suíte e2e completa | Schema final (ver "Evidências") |

A migração versionada não foi editada nem movida. O e2e de "Sem classe (antes: X)" não roda no schema final, porque nenhuma função cria mais classes do usuário; esse texto é coberto pelos testes unitários de `taxonomia.ts` e pelo ensaio, que cria legado direto no banco.

## Roteiro E2 (ação humana externa, depois do merge desta PR e do deploy novo)

Responsável: o dono do projeto. O agente não recebe credenciais e não consulta a produção. Registrar **somente contagens**. **Não aplicar antes do deploy da aplicação nova**: a aplicação antiga chama as funções que a migração retira.

1. Confirmar o merge da PR da issue #138 e o **deploy de produção da `main` com esta entrega concluído** (o agente confere no GitHub o ambiente `Production`). Confirmar que existe versão anterior compatível para voltar (rollback da aplicação depois de E2 exige versão que use as funções novas) e que não há deploy antigo ativo. Executar `npx supabase migration list` e conferir que só `20261026215542_taxonomia_ativos_fase2` está pendente (KB-002, S12); se houver outra, parar antes do push.
2. **Antes do push**, executar no SQL Editor de produção `tests/fixtures/taxonomia/e2_previa.sql` e anotar as cinco contagens:

   ```sql
   select
     (select count(*) from public.classes_ativo) as classes_legadas,
     (select count(*) from public.ativos a where a.classe_id is not null) as ativos_com_legado,
     (select count(*) from public.ativos a where a.taxonomia_id is not null) as ativos_com_no,
     (select count(*) from public.ativos a where a.sistema is null) as ativos_comuns,
     (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname in ('criar_classe', 'renomear_classe', 'excluir_classe',
         'cadastrar_ativo', 'editar_detalhes_ativo')) as funcoes_antigas;
   ```

3. Executar `npx supabase db push` a partir da `main` e depois `npx supabase migration list` (local e remoto alinhados).
4. **Depois do push**, executar `tests/fixtures/taxonomia/e2_posterior.sql`:

   ```sql
   select
     (select count(*) from public.classes_ativo) as classes_legadas,
     (select count(*) from public.ativos a where a.classe_id is not null) as ativos_com_legado,
     (select count(*) from public.ativos a where a.taxonomia_id is not null) as ativos_com_no,
     (select count(*) from public.ativos a where a.sistema is null) as ativos_comuns,
     (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname in ('criar_classe', 'renomear_classe', 'excluir_classe',
         'cadastrar_ativo', 'editar_detalhes_ativo')) as funcoes_antigas,
     (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname in ('cadastrar_ativo_taxonomia', 'editar_detalhes_ativo_taxonomia',
         'ler_versao_classificacao')) as funcoes_novas,
     (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'private' and p.proname = 'resolver_classe') as auxiliar_antigo,
     (select count(*) from information_schema.role_table_grants g
       where g.table_schema = 'public' and g.table_name = 'classes_ativo'
         and g.grantee in ('anon', 'authenticated', 'service_role', 'public') and g.privilege_type <> 'SELECT') as escrita_no_legado,
     (select count(*) from information_schema.role_table_grants g
       where g.table_schema = 'public' and g.table_name = 'classes_ativo'
         and g.grantee in ('anon', 'authenticated', 'service_role', 'public') and g.privilege_type = 'SELECT') as leitura_do_legado;
   ```

   Esperado: as quatro primeiras contagens iguais às do passo 2; `funcoes_antigas` 0; `funcoes_novas` 3; `auxiliar_antigo` 0; `escrita_no_legado` 0; `leitura_do_legado` 1 (só `authenticated` lê). Divergência pede investigação; não corrigir à mão no banco.
5. Conferir que a aplicação nova continua operando com o banco novo: abrir `/ativos`, `/ativos/novo` e `/cadastros` e ver o seletor de classe com o caminho completo. **Não** cadastrar nem editar dado real só para teste; a escrita pelas funções novas está provada nos ensaios locais.
6. Declarar "concluí a ação externa da issue #138". O agente confere o que for acessível e registra a limitação das verificações feitas só pelo responsável. Sem E2, a unidade 3 (#139) não começa.

## Ação externa

- **Data:** E2 feita pelo responsável em 2026-10-26, depois do merge da PR #142 e do deploy de produção da `main` em `3dd6091`, que o agente conferiu no GitHub (ambiente `Production`, 2026-10-26T22:21:45Z). A conclusão foi declarada numa sessão anterior, sem as contagens no repositório; elas foram pedidas de novo e relatadas pelo responsável na sessão da issue #139, em 2026-10-26.
- **Contagem prévia (antes do push):** não registrada. Já não pode ser refeita, porque a migração foi aplicada.
- **Contagem posterior** (`tests/fixtures/taxonomia/e2_posterior.sql`, relatada pelo responsável):

  | `classes_legadas` | `ativos_com_legado` | `ativos_com_no` | `ativos_comuns` | `funcoes_antigas` | `funcoes_novas` | `auxiliar_antigo` | `escrita_no_legado` | `leitura_do_legado` |
  | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
  | 6 | 21 | 21 | 30 | 0 | 3 | 0 | 0 | 1 |

- **`migration list`:** local e remoto alinhados nas dez migrações, inclusive `20261026215542` (fase 2) e `20261027002132` (ampliação do ciclo `014`), conforme a saída colada pelo responsável.
- **Conferência pelo agente:** as cinco colunas de estrutura batem com o esperado do roteiro: as funções antigas e o auxiliar `resolver_classe` saíram, as três funções novas existem, o legado `classes_ativo` não tem nenhum privilégio de escrita para os papéis da Data API e só `authenticated` o lê. As quatro contagens de dados não têm a prévia para comparar; `ativos_comuns` (30) é igual ao total da E1. O agente não acessou o banco de produção.
- **Limite da evidência:** sem a prévia, não há comparação antes/depois das contagens de dados. A preservação dos dados pela migração 2, que só retira funções, é sustentada pela revisão do SQL e pelo retrato de 81 linhas idêntico no ensaio local.
- **Resultado:** precondição da issue #139 atendida (legado só de leitura e aplicação nova em produção).

## Evidências

| Validação | Resultado |
| :-- | :-- |
| `npx supabase db reset` e `npx supabase test db` | 9 arquivos, 493 asserções (36 + 20 + 15 + 112 + 13 + 45 + 22 + 67 + 163), `PASS` no schema final, com a migração da fase 2 aplicada |
| Ensaio local de upgrade da fase 2 | Passou (ver seção própria): aplicação nova antes e depois da migração 2, retrato de 81 linhas idêntico, contagens do E2 conferidas |
| `npm run lint` | Sem erros; 3 avisos preexistentes em arquivo ignorado de `local/`, iguais em `main` |
| `npm run typecheck` | Passou |
| `npm test` | 33 arquivos, 382 testes, todos passando (inclui `taxonomia.test.ts` e os testes de `detalhes-ativo` e `catalogos`) |
| `npm run build` | Passou |
| `npm run test:e2e` (build, `CI=1`, Supabase local com as variáveis exportadas) | 213 testes: 201 passaram e 12 ignorados (condicionais do ambiente), nenhuma falha. No schema da fase 1, `cadastros.spec.ts` e `ativos-detalhes.spec.ts`: 20 passaram |
| Validador | `node --test scripts/validate-governance.test.mjs` 48/48; `node scripts/validate-governance.mjs` sem erros |
| `git diff --check` | Sem erros |
| Checks remotos | Verdes na PR #142 antes do merge |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

- **Cadastros sem abas.** Com só um catálogo, a navegação por abas deixou de existir (uma aba única não alterna nada); a página mostra o título e a seção de Instituições, e qualquer `?aba=` abre essa seção. O DESIGN.md 6.12 foi ajustado.
- **Texto da classe nas listas.** "Sem classe (antes: X)" quando há legado; omitida no celular e "—" na tabela quando não há nem nó nem legado (como "não informado"). Um nó que não existe é erro de leitura (`ErroLeitura`), nunca "Sem classe". O texto está no DESIGN.md 6.7.
- **"Classe atual" na edição.** O campo de busca mostra o caminho do nó confirmado, mas um campo de texto não quebra linha; por isso a edição repete o caminho completo, com quebra, acima do campo (critério "caminhos longos quebram sem rolagem horizontal").
- **Testes do banco no schema final.** O `supabase test db` roda só sobre o schema final; a janela com as duas gerações de funções (fase 1) deixou de ser testável ali. Foi provada no ensaio da issue #137 e, agora, no da fase 2; o pgTAP prova a retirada (funções ausentes, nenhuma função escreve em `classes_ativo`, legado sem escrita) e as funções novas. O e2e da dica "antes: X" ficou só no nível unitário e no ensaio, porque no schema final nenhuma função cria classes do usuário.
- **Dois e2e adaptados na issue #137 foram refeitos.** `cadastros.spec.ts` e `ativos-detalhes.spec.ts` deixaram de criar classes do legado no preparo.
- **Reconciliação da task #137** feita nesta PR (task `Concluída`, seção "Ação externa" com as contagens relatadas), conforme o plano.

## Encerramento

Não se aplica.

## Próximo passo

Esta task está concluída (PR #142 integrada e E2 concluída). O artefato ativo do ciclo passou a ser a task da issue #139.

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 013 (completo)
Quem: Responsável
Conferir: checks e diff da PR https://github.com/EuThiagoAndrade/saldo-futuro/pull/147
Diga: "aprovo o merge da PR #147"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 013 + implementar_issue + 138 + c7fc48f4f4f547ce9e768d4468bef6b4689cfa2e`
- `effect_class`: `remote_mutation`
- `state_before`: plano `Em Execução`; PR #140 integrada em `c7fc48f` e E1 concluída em 2026-10-26; issue #138 aberta; autorização "autorizo a implementação da issue #138".
- `state_after`: PR #142 integrada em `3dd6091`, com deploy de produção, e ação externa E2 concluída pelo responsável em 2026-10-26, com a contagem posterior conferida; task `Concluída`, issue #138 aberta até o encerramento. Reconciliação feita na PR da issue #139.
- `result`: `executed`
- `evidence`: pgTAP 493 asserções; ensaios locais de upgrade (aplicação nova antes e depois, retrato idêntico); lint, tipos, 382 testes unitários, build e e2e (201 passaram, 12 ignorados).
- `blockers`: nenhum para esta task. A contagem prévia da E2 não foi registrada e não pode ser refeita (ver "Ação externa").
