# Task — Encerramento do ciclo 017

> **Ciclo:** `017`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `chore`
> **Issue:** — (encerramento sem issue recursiva; fecha #172 e #174; #173 já fechada pela PR #177)
> **Plano:** `_project/executed/017_atributos_complementares_ativos/017_plan.md`
> **Branch:** `chore/cycle-017-closure`
> **PR:** Pendente de publicação
> **Integração:** prospectiva; conclusão válida somente depois do merge desta PR, conferido no GitHub
> **Autorização inicial:** "aprovo o plano do ciclo 017" em 2026-10-30 (cobre o encerramento); pedido "Podemos fechar o ciclo 17? Já que estamos começando a fazer o ciclo 18"; "autorizo a verificação em produção do ciclo 017" em 2026-10-30; "aprovo o merge da PR #176" em 2026-10-31 (somente a release)
> **Modo contínuo:** `—`
> **Início:** 2026-10-31
> **Última atualização:** 2026-10-31
> **handoff_schema_version:** `2`

Instanciada de `.agent/templates/task.md`, pelo workflow `.agent/workflows/atualizar_docs.md` e skill `.agent/skills/doc-updater/doc-updater.md`. Autoridades: `.agent/ai_behavior.md`, `_project/README.md` (encerramento prospectivo), `_project/cycles.md` e escopo aprovado da v4 do plano. A v5 preserva a proposta e o parecer das emendas posteriores, não adotadas no 017.

## Objetivo

Consolidar as entregas de persistência, formulários e consulta dos atributos complementares, a ação externa e a verificação em produção, reconciliar a release 0.13.0 e preparar o encerramento prospectivo.

## Escopo autorizado

Plano, tasks e movimentação para `executed/`; somente a linha do 017 e a data em `cycles.md`; KB-002 e KB-003 com o resultado e seus limites; data da nota em `src/lib/novidades.ts` e ajuste da expectativa existente em `novidades.test.ts`. O contrato visual e o limite descritivo da KB-004 já foram atualizados pelas entregas. Sem nova regra, migração, acesso a dados de produção ou mudança funcional.

## Origem no backlog

Snapshot herdado do plano, sem nova seleção: BL-015 integral, `_project/backlog.md` no commit `e3d32d981c6f311d0d9dba192af552f29368347b`, já publicado em main na origem. Nenhuma alteração na fila nesta PR; retorno ao backlog tratado separadamente conforme a política canônica.

## Elegibilidade da trilha curta

Não se aplica — encerramento de ciclo completo.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Somente documentação e data de publicação da nota, sem cálculo ou significado financeiro alterado |
| G2 — isolamento por RLS | Não | Nenhuma tabela, função, política, grant ou consulta autenticada alterada nesta PR |
| G3 — privacidade de dados | Sim | Evidências humanas só como passou/falhou e resultados estruturais; sem carteira, nomes, instituições, valores, e-mails, segredos ou prints reais |
| G4 — migrações só acrescentam | Não | Nenhuma migração criada, editada, removida ou renomeada |

## Execução

- [x] Conferir integração das PRs #171, #175, #177 e #178 e estado das issues #172 a #174.
- [x] Registrar a ação externa da #172 e o relato "todos passaram" para VA1 a VA8.
- [x] Conferir head/checks da #176 e executar o merge autorizado por squash, sem fechamento antecipado das issues.
- [x] Conferir release v0.13.0 e data civil 2026-10-31 em America/Cuiaba; preencher a data da nota e ajustar o teste existente.
- [x] Reconciliar plano e tasks, preservar pareceres e emendas históricas, consolidar KB-002/KB-003 e mover o ciclo para `executed/`.
- [x] Validar gates locais, revisão de G3 e staging limitado ao 017.
- [ ] Publicar PR de encerramento e conferir checks do head final.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Entregas | #171 (`a28f226`), #175 (`030a025`), #177 (`e58f02d`) e #178 (`8cba4ac`) integradas; #173 fechada; #172 e #174 fecham por `Closes` no encerramento |
| Banco/upgrade nas entregas | Task #172: 640 asserções de banco passaram; ensaio de upgrade com fixtures preservou o retrato integral e a compatibilidade das funções anteriores. Sem reexecução contra produção |
| Ação externa | Responsável relatou aplicação de `20261031000721_atributos_complementares_ativos.sql`, local/remoto alinhados e AC5 `true/true/true/true/false` em 2026-10-30. Evidência humana, sem acesso do agente ao banco real |
| Produção | Autorização explícita seguida da resposta "todos passaram" para VA1 a VA8, apresentados integralmente ao responsável. O agente não executou SQL nem os testes autenticados e não salvou ativos reais. Consulta HTTP sem sessão comprovou só entrada disponível e redirecionamento de `/ativos` e `/novidades` para login |
| Release | #176 aprovada com "aprovo o merge da PR #176"; head `9958a1fd5b85d5303052da68fc1749529e8e9ec9` com todos os checks verdes, inclusive runs manuais `41166126047` e `41166128107`; squash `9abf28384d95d914f8a26f7e71a470f359370a50`; v0.13.0 publicada em 2026-10-31 às 04:02:15 UTC, data civil 2026-10-31 em Cuiabá |
| Gates locais | Governança 48/48; validador com 0 erros e 0 avisos no worktree e no snapshot exato do staging; npm ci concluído; lint sem erros (3 avisos preexistentes em arquivo ignorado de local/); typecheck, unitários 501/501 e build passaram; e2e sem backend com dois workers: 33 passaram e 212 ignorados, saída 0. Nenhuma mudança de banco/autenticação; banco e e2e autenticado executados pelo CI |
| Checks do encerramento | Pendente de publicação |

## Revisão da correção

Não se aplica — sem correção pela trilha curta.

## Decisões incidentais e desvios

- **Escopo final:** encerra a v4 aprovada e entregue. As emendas E-1/E-2 da v5 e o parecer da Rodada 5 são históricos; o responsável determinou sua continuidade no ciclo 018, sem adoção no 017. Nenhuma conversão de Previdência foi executada.
- **Produção e release:** a verificação humana ocorreu antes da release. O relato de VA1 não comprova a página de novidades depois da publicação; release/data verificadas independentemente no GitHub e a nota validada por testes. Não se declara inspeção autenticada pós-release pelo agente.
- **Trabalho concorrente:** arquivos locais do 018 e sua reserva/estado no índice de ciclos são preservados no worktree e ficam fora do staging desta PR. O índice publicado só altera o 017 em relação à main.
- **Lições:** a revisão de uma ampliação de catálogo precisa cobrir exibição e reenvio dos códigos pela aplicação anterior, além de compatibilidade das assinaturas (achado R5-1). Não foi verificada nem relatada perda de dados real.

## Encerramento

Plano `Concluído`, tasks `Concluída`, movimentação para `executed/`, linha do ciclo `Concluído` e os blocos abaixo descrevem o estado após o merge desta PR. Antes dele, a situação efetiva é Aguardando merge quando só faltar integração. Cada merge exige seus próprios checks verdes e aprovação; a aprovação da #176 não aprova esta PR.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 017 (completo)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 017 + atualizar_docs + encerramento + 9abf28384d95d914f8a26f7e71a470f359370a50`
- `effect_class`: `remote_mutation`
- `state_before`: entregas integradas, ação externa e VA1 a VA8 relatados como concluídos, release 0.13.0 publicada; ciclo Em execução em drafts; #172 e #174 abertas.
- `state_after`: documentação consolidada e ciclo em executed com conclusão prospectiva; publicação/integração do encerramento verificáveis na PR desta branch.
- `result`: `executed`
- `evidence`: PRs, release, relatos humanos e gates desta task.
- `blockers`: checks verdes no head final da PR de encerramento e aprovação específica de seu merge.
