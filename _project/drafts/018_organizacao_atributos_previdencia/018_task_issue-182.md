# Task — Issue #182: Tratar Previdência como veículo e organizar os detalhes do ativo em grupos

> **Ciclo:** `018`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `feature`
> **Issue:** `#182`
> **Plano:** `_project/drafts/018_organizacao_atributos_previdencia/018_plan.md`
> **Branch:** `feature/issue-182`
> **PR:** https://github.com/EuThiagoAndrade/saldo-futuro/pull/184
> **Integração:** PR #184 integrada por squash (`c31081d56d7ce0d0ff2f51de3db655f90db6b36b`) em 2026-10-31, com todos os checks verdes e o teste local do responsável; deploy de produção concluído; ação externa concluída, conforme o relato do responsável em 2026-10-31; issue #182 aberta até o encerramento do ciclo
> **Autorização inicial:** "Autorizo a #182" em 2026-10-31, em resposta à pergunta "Autoriza a implementação da issue #182?"
> **Modo contínuo:** `—`
> **Início:** 2026-10-31
> **Última atualização:** 2026-10-31
> **handoff_schema_version:** `2`

## Objetivo

Entregar o Item 1 do plano aprovado: Previdência como opção do veículo de acesso, com a conversão dos dados de todos os usuários sem perda (P1), a lista suspensa de múltipla escolha (P2) e "Mais detalhes" e "Ver detalhes" nos quatro grupos (P3, D13, D16, D17 e D18).

## Escopo autorizado

Catálogo do veículo com `previdencia`; componente de lista suspensa; "Mais detalhes" em grupos, com as dicas; indicador Previdência fora das telas e do filtro, com o campo oculto na edição; "Ver detalhes" em grupos, sem a frase de aviso; migração única de conversão e congelamento; pgTAP novo e ajustes nos testes afetados; ensaio de upgrade; roteiros de teste local e da ação externa; DESIGN.md 6.7 e 6.8, KB-002, KB-003 e KB-004 4.1. Fora: o filtro em grupos e com listas suspensas (issue #183), a remoção física da coluna e do parâmetro, qualquer cálculo.

## Origem no backlog

Não se aplica (herdado do plano).

## Elegibilidade da trilha curta

Não se aplica — trilha normal, Item 1 do ciclo completo.

## Barreiras de domínio

Toda linha é obrigatória. "Não se aplica" exige justificativa. Com G1 ou G2 marcados com "Sim", o modo contínuo não pode estar `ativo`.

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Nenhuma regra de cálculo lê o veículo nem o indicador; a conversão só move uma anotação. O retrato do ensaio de upgrade prova eventos, posições, consolidados, instituições e perfis idênticos, e as marcas do Início não mudam (pgTAP 13) |
| G2 — isolamento por RLS | Sim | Conversão só por migração; `private.converter_previdencia_em_veiculo()` sem `EXECUTE` pela Data API. pgTAP 13: cada caso, outro usuário convertido só no próprio ativo, trânsito intocado, recusa do indicador não nulo pelas funções antigas e novas; os testes 08, 09 e 12 ajustados sem perder asserções de isolamento; suíte inteira verde |
| G3 — privacidade de dados | Sim | Somente dados fictícios em testes, fixtures e capturas (estas só em `local/`); as consultas da ação externa são de estrutura, com uma contagem agregada que não identifica ativo nem usuário |
| G4 — migrações só acrescentam | Sim | Migração nova `20261031213611_previdencia_veiculo_acesso.sql`, gerada por `supabase migration new`; nenhuma migração existente alterada |

## Execução

- [x] Issue #182 aberta, plano aprovado e integrado (PR #180), base `origin/main` `2385623`; trabalho na pasta separada `C:\Programas\saldo-futuro-018` (`git worktree`), sem tocar na pasta principal.
- [x] Catálogo, indicadores visíveis, dicas e resumo em grupos (`src/lib/telas/detalhes-ativo.ts`); filtro sem o indicador (`filtros-ativos.ts`).
- [x] Lista suspensa (`src/components/lista-suspensa.tsx`) e "Mais detalhes" em grupos com o campo oculto.
- [x] Migração, pgTAP 13 e ajustes nos testes 08, 09 e 12.
- [x] E2e ajustados e novos; ensaio de upgrade; documentação.
- [x] Gates locais completos e staging revisado.
- [x] PR #184 publicada com `Refs #182`; merge só depois do teste local do responsável.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | Unitários 509/509 (inclui o teste de componente do campo oculto); lint sem erros; typecheck e build passaram; banco 671/671 em 13 arquivos (31 asserções novas no `13_previdencia_veiculo`); e2e sobre o build com o Supabase local e dois workers: 233 passed, 12 skipped (preview sem backend) e 1 flaky que passou na repetição (`botoes.spec.ts`, hover e pressão do botão "Mais", sem relação com esta entrega), saída 0. As três especificações de Ativos juntas: 33/33 |
| Ensaio de upgrade | Instância descartável `saldo-futuro-issue182-upgrade` (portas 553xx) com as migrações até `20261031000721`: `e1_pre.sql` → `f|f|f`; `upgrade_pre.sql` com os 8 casos de D18, aporte e fechamento; a "tela nova" editou um ativo com "Sim" antes da migração e o valor ficou preservado; o banco recusou `previdencia` no veículo antes da migração, sem gravar; migração aplicada; `upgrade_post.sql` → "retrato integral preservado e casos de D18 convertidos", os 8 casos conferidos um a um, código novo aceito e indicador não nulo recusado; `e1_post.sql` → `t|t|t|t`. Reexecutar `upgrade_post.sql` reprova com "caso de conversão divergente da tabela de D18", provando que a conferência detecta diferença |
| Validador | 48/48 testes de governança; validador sem erros depois do registro do número da PR |
| `git diff --check` | Passou |
| Checks remotos | Verdes na PR #184 no commit `9785cd0` antes do merge: governança; lint, tipos, testes, build e e2e de preview; Supabase local, testes de banco e e2e autenticado; Vercel. Deploy de produção de `c31081d`: "Deployment has completed" |

## Revisão da correção

Não se aplica — trilha normal.

## Decisões incidentais e desvios

- **Transação explícita na migração.** A CLI do Supabase executa os comandos de uma migração sem transação própria, e o `lock table` foi recusado na primeira aplicação local, sem nada gravado. A migração passou a declarar `begin;` e `commit;`, para trava, catálogo, conversão, conferências e restrição entrarem juntas ou não entrarem. É a primeira migração do projeto com transação explícita.
- **Fechar a lista no clique, não no `pointerdown`.** O primeiro e2e mostrou que, com a lista do veículo aberta, um clique no resumo do indexador fechava a primeira lista no início do clique, a página encolhia e o clique terminava fora do alvo. A lista agora fecha no evento `click`.
- **Atalho `@/` no Vitest.** O teste do componente (`detalhes-ativo.test.tsx`), que prova o campo oculto, precisou do mesmo atalho do `tsconfig.json`; foi a única mudança em `vitest.config.ts`.
- **Um ativo só com o indicador antigo não abre "Mais detalhes"**, porque o indicador não aparece mais.
- **Testes de banco ajustados (R5-2):** as chamadas que gravavam `true` ou `false` no indicador passaram a gravar nulo, e as leituras dele passaram a usar `coalesce`; onde o teste usava o indicador para provar outra coisa, passou a usar Liquidez imediata. Nenhuma asserção foi removida.
- **E2e:** o auxiliar das caixas abre a lista antes de marcar; os testes que usavam o indicador Previdência passaram a usar Exposição cambial ou Liquidez imediata, mantendo o que provam.
- **Banco local de desenvolvimento:** a migração foi aplicada nele (o mesmo usado pela pasta principal), como nas entregas anteriores; nenhuma migração em produção.

## Roteiro de teste local — antes de aprovar o merge

Na pasta `C:\Programas\saldo-futuro-018`, com o Supabase local rodando (o banco local já tem a migração) e as variáveis locais como na pasta principal (ver `README.md`):

1. `npm run dev` e entre com o seu usuário local de teste.
2. **Novo ativo → Mais detalhes:** confira os quatro títulos (Produto, Tributação, Resgate, Proteção e exposição) e que não existe mais o grupo de rádios "Previdência".
3. **Veículo de acesso:** clique no campo; a lista abre. Marque "Previdência (PGBL ou VGBL)"; o campo fechado passa a mostrar o nome. Aperte Esc (fecha) e depois clique fora com ela aberta (fecha). Marque "Não se aplica" e veja as outras desmarcarem.
4. **Indexador:** com a lista do veículo aberta, clique direto no campo do indexador; ele deve abrir de primeira. Leia a dica dos títulos híbridos.
5. **Salve,** abra a edição do mesmo ativo e confira o veículo; depois veja o "Ver detalhes" dele em `/ativos` (em grupos, sem a frase de aviso).
6. **Celular:** no navegador, simule 360 px de largura e repita os passos 3 e 5; nada pode cortar nem exigir rolagem para o lado.
7. **Filtrar:** não deve haver mais o seletor "Previdência"; a opção "Previdência (PGBL ou VGBL)" aparece no veículo.

Se tudo estiver certo, diga "aprovo o merge da PR #184". Logo depois do merge e do deploy vem a ação externa (KB-002, "Previdência como veículo", AP1 a AP7).

### Resultado do teste local — 2026-10-31

Feito pelo responsável no navegador do app, com o código da PR #184 rodando na pasta do 018 (porta 3018), contra o Supabase local já com a migração, e um usuário fictício só do banco local (`teste-local.responsavel@example.com`, senha de teste dos e2e). Seis blocos guiados: grupos no cadastro, lista suspensa do veículo (Esc, clique fora, exclusividade), indexador abrindo de primeira com a lista do veículo aberta, salvar e conferir no "Ver detalhes" e na edição, celular e filtro sem o indicador. Relato do responsável: "Tudo passou".

## Registro da ação externa

Merge aprovado com "Aprovo o merge", em resposta à pergunta sobre a PR #184, depois do teste local; checks verdes e head `9785cd0` conferidos antes do squash. O deploy de produção de `c31081d` foi conferido como concluído pelo status da Vercel no GitHub.

Em 2026-10-31, com a frase "concluí a ação externa da issue #182", o responsável relatou: AP2 com só `20261031213611_previdencia_veiculo_acesso.sql` pendente; AP3 (`e1_pre.sql`) `false`/`false`/`false`; AP4 aplicada e local/remoto alinhados; AP5 (`e1_post.sql`) `true`/`true`/`true`/`true` (restrição do legado, catálogo com Previdência, conversão fora da Data API e nenhum indicador restante); AP6 ok (Previdência no veículo e sem indicador separado, sem salvar). É relato humano: o agente não tem acesso ao banco de produção e não o conferiu. Nenhum dado de carteira foi relatado; a única contagem é agregada. Com isso, a issue #183 pode ser autorizada.

## Encerramento

Não se aplica — ciclo completo; encerramento em PR própria.

## Próximo passo

Esta task está concluída; a ação externa foi relatada e o ciclo segue para a issue #183.

```text
PRÓXIMO PASSO
Situação: Aguardando autorização de implementação — ciclo 018 (completo)
Quem: Responsável
Conferir: Issue [#183](https://github.com/EuThiagoAndrade/saldo-futuro/issues/183) e escopo do Item 2 do plano
Diga: "autorizo a implementação da issue #183"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 018 + implementar_issue + 182 + 2385623`
- `effect_class`: `remote_mutation`
- `state_before`: plano aprovado e integrado (PR #180); issues #182 e #183 abertas; "Autorizo a #182" recebida em 2026-10-31.
- `state_after`: Item 1 implementado e validado localmente; migração aplicada só ao banco local de desenvolvimento e ao ensaio descartável; PR #184 publicada na branch `feature/issue-182`, sem fechar a #182.
- `result`: `executed`
- `evidence`: tabela de evidências acima.
- `blockers`: teste local do responsável e aprovação do merge; depois, a ação externa logo após o deploy.
