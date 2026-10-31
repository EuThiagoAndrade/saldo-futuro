# Task — Issue #172: Persistir atributos complementares dos ativos com escrita isolada

> **Ciclo:** `017`
> **Trilha:** `normal`
> **Estado:** `Aguardando integração`
> **Tipo:** `feature`
> **Issue:** `#172`
> **Plano:** `_project/drafts/017_atributos_complementares_ativos/017_plan.md`
> **Branch:** `feature/issue-172`
> **PR:** https://github.com/EuThiagoAndrade/saldo-futuro/pull/175
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #172" em 2026-10-30
> **Modo contínuo:** `—`
> **Início:** 2026-10-30
> **Última atualização:** 2026-10-30
> **handoff_schema_version:** `2`

## Objetivo

Entregar a unidade Banco (Item 1) do plano aprovado v4: persistência dos cinco atributos complementares em `public.ativos` e escrita atômica e isolada por duas funções novas, compatíveis com a aplicação em produção.

## Escopo autorizado

P1 a P4 do plano: migração nova e aditiva com sete colunas e constraints completas (catálogos, forma canônica dos conjuntos, exclusividades, tupla do prazo e trânsito sem detalhes); `cadastrar_ativo_com_atributos` e `editar_ativo_com_atributos`, sem sobrecarga, com grants só para `authenticated`; funções anteriores intactas; pgTAP dedicado; fixtures e roteiro sanitizado de upgrade e da ação externa; KB-002 e KB-003. Fora: aplicação (UI, Server Actions, leitores), marca/gatilho de metadados, benchmarks e qualquer cálculo.

## Origem no backlog

Snapshot herdado do plano, sem nova seleção nem alteração do item:

- **BL-015 — Atributos complementares de classificação do ativo além da classe:** seleção integral (os cinco atributos e a relação com os quatro indicadores existentes), sem agrupamento com outros IDs.
- Referência: `_project/backlog.md` da fila canônica `chore/backlog`, commit `e3d32d981c6f311d0d9dba192af552f29368347b`, com conteúdo idêntico ao de `main` na leitura de origem. Destino ciclo `017` em preparação; o retorno à fila usa `ciclo 017` só depois da integração comprovada do destino, com publicação separada.

## Elegibilidade da trilha curta

Não se aplica — trilha normal, unidade Banco do ciclo completo.

## Barreiras de domínio

Toda linha é obrigatória. "Não se aplica" exige justificativa. Com G1 ou G2 marcados com "Sim", o modo contínuo não pode estar `ativo`.

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Só metadados descritivos; nenhuma regra de cálculo, conversão de prazo ou arredondamento no sistema. Preservação de eventos, posições, consolidados e indicadores provada no ensaio de upgrade com retrato integral |
| G2 — isolamento por RLS | Sim | Colunas herdam a RLS de `ativos`; escrita só pelas funções novas (security definer, trava da carteira primeiro, `auth.uid()`, sem parâmetro de dono). pgTAP: outro usuário e administrador não leem nem editam, tentativa cruzada não cria instituição, anon recusado, escrita direta recusada, auxiliares sem `EXECUTE` pela Data API, lista fechada de funções atualizada, cascata do usuário |
| G3 — privacidade de dados | Sim | Somente fixtures fictícias (`example.com`, nomes fictícios); nenhuma leitura de banco ou carteira de produção; consultas da ação externa só de estrutura e permissões |
| G4 — migrações só acrescentam | Sim | Uma migração nova, `20261031000721_atributos_complementares_ativos.sql`, gerada por `supabase migration new`; nenhuma migração versionada alterada |

## Execução

- [x] Issue #172 aberta, plano `Aprovado` (v4) e PR documental #171 integrada conferidos no GitHub; base `origin/main` `a28f22667d67ddaf80e35ab7af201ae1d4a84a53`; nenhuma PR aberta.
- [x] Branch criada preservando os registros locais da criação das issues; plano em `Em Execução` e ciclo em `Em execução`.
- [x] Migração escrita e aplicada ao Supabase local principal.
- [x] pgTAP dedicado (`12_atributos_ativos.test.sql`) e lista fechada de `03_funcoes.test.sql` atualizada.
- [x] Ensaio de upgrade em instância descartável, com retrato integral preservado e compatibilidade das funções anteriores.
- [x] KB-002 (roteiro AC1 a AC7) e KB-003 (seção "Atributos complementares dos ativos").
- [x] Gates locais e staging revisado.
- [x] PR #175 publicada com `Refs #172`; integração exige aprovação própria.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | Banco: `npx supabase test db` com 12 arquivos e 640 asserções, todas passando (o arquivo novo tem 104). Unitários: 476/476. Lint sem erros (3 avisos preexistentes em `local/`); typecheck passou. Build e e2e não rodados localmente: a entrega não altera a aplicação; ficam com o CI |
| Upgrade | Instância descartável `saldo-futuro-issue172-upgrade` (portas 553xx) com as migrações até `20261027220000`: `e1_pre.sql` → `f|f`; `upgrade_pre.sql` (usuário, instituição, classe, indicadores, aporte, fechamento e ativo desativado fictícios) → retrato guardado; migração nova aplicada; `upgrade_post.sql` → "retrato integral preservado e atributos vazios", função anterior preserva atributos gravados pela nova (`t`), APIs anterior e nova disponíveis (`t|t`); `e1_post.sql` → `t|t|t|t|f`. Reexecutar `upgrade_post.sql` depois das edições reprova com "retrato financeiro/descritivo divergente", o que prova que a comparação detecta diferença |
| Validador | 48/48 testes de governança; validador com 0 erros, 0 avisos e 5 itens manuais conferidos |
| `git diff --check` | Passou |
| Checks remotos | Em execução na PR #175 |

## Revisão da correção

Não se aplica — trilha normal.

## Decisões incidentais e desvios

- Catálogos definidos uma única vez no banco, em auxiliares imutáveis de `private` usados pelas constraints e pela escrita (P4 permitia "um auxiliar privado imutável"; foram usados cinco pequenos, mais o canonizador genérico e o gravador, todos sem `EXECUTE` pela Data API). As constraints dependem deles; só o dono das tabelas escreve em `ativos` (nenhum papel da API tem privilégio de escrita, nem `service_role`).
- Conjunto nulo nas funções novas é recusado (`recusado_veiculos_acesso`/`recusado_indexadores_remuneracao`): limpar é enviar `{}`, conforme "todos os campos são explícitos" da P4.
- `nao_informado` não é código persistido; enviá-lo como situação do prazo é recusado. Ele só existirá nos filtros da issue #174.
- As funções novas reutilizam `cadastrar_ativo_taxonomia` e `editar_ativo_com_nome`, o que preserva suas validações e códigos de recusa (inclusive `recusado_tipo_ajuste`, `recusado_nome` e a recusa do trânsito antes de resolver a instituição).
- O registro local da criação das issues no plano citava o merge da PR #171 com um SHA completo inexistente no repositório (`a28f22682df6…`); corrigido para o commit real `a28f22667d67ddaf80e35ab7af201ae1d4a84a53`, conferido por `gh pr view 171`.
- A primeira carga do ensaio falhou por erro da própria fixture (um ativo sem eventos não pode receber saldo no fechamento); a fixture foi corrigida e só o banco descartável foi recriado (`db reset --no-seed --workdir local/issue172-upgrade`, caminho e `project_id` conferidos antes). Nenhum reset no projeto local principal; nenhuma migração em produção.

## Roteiro da ação externa — somente depois do merge desta entrega

Está em KB-002, "Atributos complementares dos ativos (ciclo 017)", passos AC1 a AC7: conferir `main`; `migration list` e `db push --dry-run` com só esta migração pendente; `e1_pre.sql` (falsos); `db push`; `e1_post.sql` (quatro verdadeiros e `anon_funcoes_novas` falso); abrir `/ativos` e a edição sem salvar; relatar só os resultados estruturais com "concluí a ação externa da issue #172". Não executar `upgrade_pre.sql`/`upgrade_post.sql` em produção. A issue #173 só pode publicar código que leia as colunas ou chame as funções novas depois dessa ação.

## Ensaio local de upgrade — reprodução

1. Criar `local/issue172-upgrade/supabase` só com `config.toml` (`project_id = "saldo-futuro-issue172-upgrade"`, portas 553xx) e as migrações anteriores a esta; sem seed, ambiente ou dados.
2. `npx supabase start --workdir local/issue172-upgrade -x realtime,storage-api,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor`.
3. Executar `e1_pre.sql` e `upgrade_pre.sql` com `docker exec -i supabase_db_saldo-futuro-issue172-upgrade psql -U postgres -d postgres -v ON_ERROR_STOP=1 < arquivo` (bytes UTF-8 pelo Git Bash).
4. Copiar a migração nova para a instância e `npx supabase migration up --local --workdir local/issue172-upgrade`.
5. Executar `upgrade_post.sql` e `e1_post.sql` da mesma forma e conferir os resultados da tabela de evidências.
6. `npx supabase stop --workdir local/issue172-upgrade`.

## Encerramento

Não se aplica — ciclo completo; encerramento em PR própria depois da ação externa e das demais entregas.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 017 (completo)
Quem: Responsável
Conferir: Checks e diff da [PR #175](https://github.com/EuThiagoAndrade/saldo-futuro/pull/175); esta task
Diga: "aprovo o merge da PR #175"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 017 + implementar_issue + 172 + a28f22667d67ddaf80e35ab7af201ae1d4a84a53`
- `effect_class`: `remote_mutation`
- `state_before`: plano v4 `Aprovado`, PR #171 integrada, issues #172 a #174 abertas; registros locais da criação das issues não commitados; "autorizo a implementação da issue #172" recebida em 2026-10-30.
- `state_after`: unidade Banco implementada e validada localmente; migração aplicada só ao Supabase local; plano `Em Execução` e ciclo `Em execução`; roteiro da ação externa pronto; PR #175 publicada na branch `feature/issue-172`, sem fechar a #172.
- `result`: `executed`
- `evidence`: tabela de evidências acima.
- `blockers`: nenhum para publicar; o merge depende de checks verdes e de "aprovo o merge da PR #175". A ação externa é posterior ao merge.
