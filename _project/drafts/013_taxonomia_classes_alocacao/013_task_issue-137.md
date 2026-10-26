# Task — Issue #137: Implantar taxonomia global e transição dos vínculos de ativos (BL-014 e parcela de BL-009)

> **Ciclo:** `013`
> **Trilha:** `normal`
> **Estado:** `Aguardando integração`
> **Tipo:** `feature`
> **Issue:** `#137`
> **Plano:** `_project/drafts/013_taxonomia_classes_alocacao/013_plan.md`
> **Branch:** `feature/issue-137`
> **PR:** [#140](https://github.com/EuThiagoAndrade/saldo-futuro/pull/140) (`Refs #137`, sem fechar a issue)
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #137" em 2026-10-26
> **Modo contínuo:** `—`
> **Início:** 2026-10-26
> **Última atualização:** 2026-10-26
> **handoff_schema_version:** `2`

## Objetivo

Entregar a primeira fase do banco da taxonomia global de classes de ativos (item 1 do plano): catálogo com a árvore aprovada, vínculo opcional do ativo, equivalência mínima do legado, marca de coerência da classificação (R1-2) e funções compatíveis com a janela de transição (D19). Nenhuma tela usa a taxonomia nesta entrega.

## Escopo autorizado

Item 1 do plano, conforme a issue #137: migração 1 (catálogo, carga, `ativos.taxonomia_id`, backfill, `profiles.versao_classificacao`, gatilho e `ler_versao_classificacao`), RPCs novas sob trava da carteira e autenticação, RPCs antigas ajustadas à janela, remoção das sementes automáticas, ensaio local de upgrade (R1-6), testes de isolamento, consultas agregadas e roteiro E1 e documentação técnica do estado intermediário. Fora: telas, seletor, remoção do legado (unidade 2), distribuição macro (unidade 3) e a execução de E1 em produção. A PR usa `Refs #137` e não fecha a issue; ela fica aberta até E1 e o encerramento. Alterações de `src/` não fazem parte; os dois e2e que dependiam das classes iniciais foram adaptados (ver "Decisões incidentais e desvios").

## Origem no backlog

Herdada do plano: BL-014 (integral) e BL-009 (parcela das visões analíticas por classe de alocação), `_project/backlog.md` no commit da fila `db80df2` (conteúdo igual ao de `main` em `757ceac`, publicado). Destino em preparação; nenhum item do backlog é alterado nesta entrega, e o retorno só depois da integração comprovada do ciclo.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não se aplica; conferido | Nenhuma regra de cálculo, nenhum saldo e nenhum percentual muda; a regra de alocação macro (CR-C01 a CR-C12) é da unidade 3. O ensaio local de upgrade compara linha a linha eventos, transferências, consolidados, posições, instituições, classes, ativos (sem a coluna nova) e perfis (sem a marca): 82 linhas idênticas antes e depois. `04_carteira`, `05_concorrencia` e `07_migracao_transito` passam inalterados. |
| G2 — isolamento por RLS | Sim | `taxonomia_ativos` nova, com RLS, política só de `select` para `authenticated`, sem nenhum privilégio para `anon` e `service_role`, e sem escrita nem para o admin. Novas funções com `search_path` vazio, `execute` revogado de `public` e `anon`, trava da carteira primeiro nas duas que escrevem, `ler_versao_classificacao` `security invoker` sob a RLS de `profiles`, sem parâmetro de dono. Auxiliares e função do gatilho sem `execute` para a Data API. Provado em `09_taxonomia_ativos` (158 asserções, com anon, A, B, admin e C) e em `03_funcoes` (listas fechadas atualizadas, controle negativo preservado). |
| G3 — privacidade de dados | Sim | Carga e testes só com e-mails em `example.com` e nomes inventados; a árvore tem nomes genéricos, sem emissor, gestora, ticker, taxa ou indexador. Fixtures SQL só em `tests/fixtures/taxonomia/`. As consultas do E1 devolvem só contagens agregadas. Nenhum dado real lido; `local/` não foi aberto. |
| G4 — migrações só acrescentam | Sim | Migração nova `20261026204955_taxonomia_ativos.sql`, gerada por `npx supabase migration new taxonomia_ativos`; as anteriores estão intactas (`git diff --name-status` só com `A` em `supabase/migrations/`). A restrição `ativos_transito_sem_detalhes_check` e a função `editar_detalhes_ativo` são redefinidas pela migração nova, sem editar a do ciclo `012`. |

## Execução

- [x] Branch `feature/issue-137` a partir de `main` em `baa174d` (plano integrado pela PR #136); plano para `Em Execução` e ciclo para `Em execução`.
- [x] Migração: `private.normalizar_nome` (transliteração explícita, sem extensão), `public.taxonomia_ativos` (39 nós, UUIDs fixos, restrições, índices parciais para as raízes), `ativos.taxonomia_id` com a restrição do trânsito ampliada, `profiles.versao_classificacao`, gatilho `ativos_versao_classificacao`, `ler_versao_classificacao()`, `private.taxonomia_equivalente` e o preenchimento, `cadastrar_ativo_taxonomia` e `editar_detalhes_ativo_taxonomia`, `editar_detalhes_ativo` ajustada à janela, retirada do gatilho e dos auxiliares das classes iniciais.
- [x] `supabase/tests/database/09_taxonomia_ativos.test.sql` (158 asserções): estrutura e permissões, a árvore exata, restrições do catálogo, leitura e escrita pela Data API, vínculo do ativo, equivalência, preenchimento e marca, RPCs novas, janela de transição, isolamento de B e do admin, marca monotônica, transacional, sem reinício e com texto exato acima de 2⁵³, sem sementes e exclusão do usuário.
- [x] `03_funcoes.test.sql` e `08_metadados_ativos.test.sql` ajustados (listas fechadas; sem classes iniciais). `plan` de `03` e de `08` sem mudança.
- [x] e2e `cadastros.spec.ts` e `ativos-detalhes.spec.ts`: o preparo cria as classes do legado, que o gatilho já não cria.
- [x] Fixtures do ensaio e do E1 em `tests/fixtures/taxonomia/` e ensaio local de upgrade executado (ver "Ensaio de upgrade").
- [x] KB-003: seção do estado intermediário, contagem de asserções e linha do histórico.
- [x] PR #140 aberta (`Refs #137`).
- [ ] Checks remotos verdes e aprovação do merge.
- [ ] Ação externa E1 pelo responsável, depois do merge e do deploy compatível (ver "Roteiro E1").

## Ensaio de upgrade (R1-6, somente local)

Ambiente: Supabase local descartável (contêiner `supabase_db_saldo-futuro`), CLI 2.120.0, sem conexão remota. A carga é `tests/fixtures/taxonomia/upgrade_012.sql`: três usuários fictícios, cinco classes iniciais mais sete de variantes de caixa, acento e espaços, 20 ativos comuns (dois desativados), três trânsitos, 17 eventos, um mês fechado por usuário. Passos e resultados reais (2026-10-26):

| # | Comando | Resultado |
| :-- | :-- | :-- |
| a | `npx supabase db reset --local --version 20261024000829 --no-seed` | Banco na última migração do ciclo `012`, sem `taxonomia_id` |
| b | `docker exec -i supabase_db_saldo-futuro psql -U postgres -v ON_ERROR_STOP=1 < tests/fixtures/taxonomia/upgrade_012.sql` | Carga aplicada, sem erro |
| c | `psql -A -F' \| ' < tests/fixtures/taxonomia/e1_previa.sql` | `ativos_comuns` 20, `transito` 3, `ficarao_sem_no` 9 |
| d | `psql -At < tests/fixtures/taxonomia/retrato_financeiro.sql > retrato_antes.txt` | 82 linhas (17 classes, 3 consolidados, 17 eventos, 2 instituições, 17 posições, 3 perfis e 23 ativos) |
| e | `npx supabase migration list --local` e `npx supabase migration up --local` | Só `20261026204955` pendente; aplicada |
| f | `e1_posterior.sql`, mesmo retrato e `upgrade_013_verificacao.sql` | `ativos_comuns` 20, `sem_no` 9 (igual à previsão), `transito` 3 e `transito_sem_no` 3, `nos_do_catalogo` 39; `diff` dos retratos vazio (82 linhas idênticas); verificação: "todas as conferências passaram" (mapeamento por ativo, legado intacto em 16 ativos, marcas 10/1/0, perfil novo sem classes, cadastro antigo com nó nulo, edição antiga zera o nó e incrementa a marca, edição antiga de ativo mapeado, cadastro novo, CRUD antigo de classes) |

Ao terminar: `npx supabase db reset` completo e suíte normal (ver "Evidências"). A migração versionada não foi editada nem movida.

## Roteiro E1 (ação humana externa, depois do merge desta PR e do deploy compatível)

Responsável: o dono do projeto. O agente não recebe credenciais e não consulta a produção. Registrar **somente contagens**: nenhum nome, UUID, valor ou grupo por usuário. Operações concorrentes devem ficar suspensas durante a comparação.

1. Confirmar o merge da PR da issue #137, `main` atualizada, o alvo correto do Supabase e a lista exata de migrações pendentes com `npx supabase migration list` (KB-002, S12): só `20261026204955_taxonomia_ativos`. Se aparecer outra, parar antes do push.
2. **Antes do push**, executar no SQL Editor do projeto o conteúdo de `tests/fixtures/taxonomia/e1_previa.sql`, que não consulta a coluna ainda inexistente:

   ```sql
   select
     (select count(*) from public.ativos a where a.sistema is null) as ativos_comuns,
     (select count(*) from public.ativos a where a.sistema = 'transito') as transito,
     (select count(*)
      from public.ativos a
      left join public.classes_ativo c on c.user_id = a.user_id and c.id = a.classe_id
      where a.sistema is null
        and not coalesce(lower(translate(btrim(c.nome),
          'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç',
          'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc')) in (
          'caixa e disponibilidades', 'renda fixa', 'renda variavel', 'investimentos no exterior',
          'criptoativos e ativos digitais', 'cripto', 'alternativos, moedas, outros', 'outros'), false)
     ) as ficarao_sem_no;
   ```

   Registrar as três contagens: `ativos_comuns` (inclui desativados), `transito` e `ficarao_sem_no`.
3. Executar `npx supabase db push` a partir da `main` e depois `npx supabase migration list` (local e remoto alinhados). Não fornecer credenciais ao agente.
4. **Depois do push**, executar `tests/fixtures/taxonomia/e1_posterior.sql`:

   ```sql
   select
     (select count(*) from public.ativos a where a.sistema is null) as ativos_comuns,
     (select count(*) from public.ativos a where a.sistema is null and a.taxonomia_id is null) as sem_no,
     (select count(*) from public.ativos a where a.sistema = 'transito') as transito,
     (select count(*) from public.ativos a where a.sistema = 'transito' and a.taxonomia_id is null) as transito_sem_no,
     (select count(*) from public.taxonomia_ativos) as nos_do_catalogo;
   ```

   Esperado: `ativos_comuns` e `transito` iguais aos do passo 2; `sem_no` igual a `ficarao_sem_no`; `transito_sem_no` igual a `transito`; `nos_do_catalogo` = 39. Divergência pede investigação; **não repetir o backfill manualmente**.
5. **Limite da evidência (R1-7):** essas contagens não provam, sozinhas, que nenhum dado financeiro mudou em produção. A preservação financeira é sustentada pela revisão do SQL e pela comparação integral das 82 linhas fictícias do ensaio local; não registrar "ausência de diferença financeira em produção" sem uma verificação própria autorizada. Nenhum hash, retrato ou valor financeiro real é exportado.
6. Conferir que a aplicação já implantada continua operando (por exemplo, abrir `/ativos` e `/cadastros`); não cadastrar nem editar dado real só para teste. Declarar "concluí a ação externa da issue #137". O agente confere o que for acessível e registra a limitação das verificações feitas só pelo responsável. A unidade 2 só começa depois disso.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| `npx supabase db reset` e `npx supabase test db` | 9 arquivos, 500 asserções (342 anteriores + 158 novas), `PASS`. Antes do ajuste de `03_funcoes` e `08_metadados_ativos`, os dois reprovavam, como previsto |
| Ensaio local de upgrade | Passou (ver seção própria): previsão 9 = efetivo 9, 39 nós, trânsito sem nó, retrato de 82 linhas idêntico |
| `npm ci`, `npm run lint` | Sem erros; 3 avisos preexistentes em arquivo ignorado de `local/`, iguais em `main` |
| `npm run typecheck` | Passou |
| `npm test` | 32 arquivos, 371 testes, todos passando |
| `npm run build` | Passou |
| `npm run test:e2e` (build, `CI=1`, Supabase local) | 210 testes: 198 passaram, 12 ignorados (condicionais do ambiente) e nenhuma falha, com `cadastros.spec.ts` e `ativos-detalhes.spec.ts` adaptados. Duas execuções anteriores, sem as variáveis `NEXT_PUBLIC_SUPABASE_*` e `SUPABASE_SECRET_KEY` no ambiente do Playwright (só em `.env.local`), ignoraram 177 testes e reprovaram os 7 de "preview sem backend", por ambiente, não por regressão; a variante sem backend é coberta pelo job de CI |
| Validador | `node --test scripts/validate-governance.test.mjs` 48/48; `node scripts/validate-governance.mjs` sem erros |
| `git diff --check` | Sem erros |
| Checks remotos | Pendente |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

- **Coluna derivada `parent_nivel`.** O contrato lista `(id, parent_id, nivel, nome, ordem)`. Para impor "o pai tem o nível anterior" e impedir ciclo e mudança de pai ou de nível que invalide filhos de forma declarativa, sem gatilho, a tabela tem a coluna gerada `parent_nivel = nivel - 1` e a chave composta `(parent_id, parent_nivel)` para `(id, nivel)`. O catálogo continua com as cinco colunas especificadas, mais essa derivada; os consumidores leem por colunas explícitas.
- **Auxiliar `private.taxonomia_equivalente`.** O plano fala em comparar "o nome legado" ao dos seis nomes e aos dois aliases. A comparação ficou numa função privada, de nós fixos, usada pelo preenchimento e mantida para que o teste pgTAP prove o mapeamento. A mesma regra, escrita em linha, está na consulta prévia do E1, onde a função ainda não existe; o ensaio comprova que as duas coincidem (previsão = efetivo).
- **Gatilho com exceção sem perfil.** O gatilho da marca lança `recusado_perfil_inexistente` se não houver perfil do dono, em vez de deixar a mudança sem registro. Todo usuário tem perfil (criado junto, por gatilho de `auth.users`), então o caminho é só defensivo.
- **e2e adaptados, `src/` intacto.** Sem o gatilho das classes iniciais, `cadastros.spec.ts` e `ativos-detalhes.spec.ts` criam as classes do legado no preparo (`criar_classe`), e o teste de "outro usuário" passou a esperar a lista vazia. Nenhum código de `src/` muda.
- **Contagem da KB-003.** Atualizada de 342 para 500 asserções, com a linha da taxonomia.

## Encerramento

Não se aplica.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 013 (completo)
Quem: Responsável
Conferir: checks e diff da PR https://github.com/EuThiagoAndrade/saldo-futuro/pull/140
Diga: "aprovo o merge da PR #140"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 013 + implementar_issue + 137 + baa174d12938a8776a394af46b9841c2e74afc86`
- `effect_class`: `local_mutation`
- `state_before`: plano `Aprovado` e integrado pela PR #136; issue #137 aberta; `main` em `baa174d`; autorização "autorizo a implementação da issue #137".
- `state_after`: branch `feature/issue-137` com a migração 1, testes, fixtures, KB-003, task, plano `Em Execução` e ciclo `Em execução`; PR #140 publicada, aguardando checks e aprovação do merge.
- `result`: `executed`
- `evidence`: pgTAP 500 asserções; ensaio local de upgrade; lint, tipos, 371 testes unitários, build e e2e (198 passaram, 12 ignorados).
- `blockers`: checks remotos e aprovação específica do merge; E1 depende do merge e do deploy.
