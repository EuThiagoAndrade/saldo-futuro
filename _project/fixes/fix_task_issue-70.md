# Task — Issue #70: Alinhar tabela consolidado_mensal na leitura da migração

> **Ciclo:** `006` (trilha curta: `—`)
> **Trilha:** `curta`
> **Estado:** `Aguardando integração`
> **Tipo:** `fix`
> **Issue:** `#70`
> **Plano:** `—`
> **Branch:** `fix/issue-70`
> **PR:** [#71](https://github.com/EuThiagoAndrade/saldo-futuro/pull/71)
> **Integração:** `Pendente`
> **Autorização inicial:** "confirmo a trilha curta e autorizo abrir e corrigir a issue [FIX] Alinhar tabela consolidado_mensal na leitura da migração" em 2026-10-18
> **Modo contínuo:** `—`
> **Início:** 2026-10-18
> **Última atualização:** 2026-10-18
> **handoff_schema_version:** `2`

## Objetivo

Fazer o leitor da simulação reconhecer a tabela de consolidação da origem com o nome `consolidado_mensal` especificado no plano aprovado do ciclo 006, para que M2 não recuse uma origem conforme o contrato por divergência de grafia.

## Escopo autorizado

- Alinhar a leitura da tabela de consolidação e seus campos de diagnóstico ao contrato `consolidado_mensal`.
- Corrigir fixtures fictícias e adicionar regressão que reproduza a recusa causada pela grafia divergente.
- Executar validações locais, revisar a correção e abrir PR para aprovação de merge.
- Fora: alterar o SQLite real, migrar dados, gravar ou conferir no Supabase, mudar regras financeiras, alterar schema do destino ou executar produção.

## Elegibilidade da trilha curta

- Correção de comportamento já especificado: o plano aprovado do ciclo 006 define `consolidado_mensal` em `_project/drafts/006_migracao_dados_virada/006_plan.md` (M10 também o usa como fonte de mês fechado).
- Sem mudança de escopo: apenas alinhar o nome usado pelo leitor ao contrato já aprovado.
- Sem mudança de schema que altere semântica: nenhuma tabela, coluna, dado ou semântica de origem ou destino será alterada.
- Sem mudança de contrato visual: a correção é interna à leitura do SQLite.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Nenhuma fórmula, regra de classificação, valor esperado ou cálculo muda; o leitor passa a consultar a tabela definida no plano. |
| G2 — isolamento por RLS | Não | Não altera escrita, autenticação, RLS ou schema do Supabase. |
| G3 — privacidade de dados | Sim | A issue e as fixtures usam somente nomes de schema e dados fictícios; o SQLite real e valores da carteira permanecem fora do repositório e da análise. |
| G4 — migrações só acrescentam | Não | Nenhuma migração de banco será criada ou alterada. |

## Execução

- [x] Triagem curta autorizada; issue #70 criada e conferida.
- [x] Branch `fix/issue-70` criada a partir de `main` limpa em `f5a438823a4ad9fd11c4e3f773a4d2306fc8455c`.
- [x] Task persistente criada.
- [x] Teste sintético reproduz a falha antes da correção.
- [x] Corrigir o leitor e fixtures.
- [x] Reavaliar elegibilidade e barreiras pelo diff final.
- [x] Executar teste unitário de simulação, typecheck, lint e `git diff --check`.
- [x] Executar governance-check.
- [x] Revisão formal da correção; veredito `APTO PARA APROVAÇÃO`, rodada 1.
- [x] Abrir PR #71 com `Closes #70` depois de veredito apto.
- [ ] Aprovação explícita de merge e integração.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | A regressão direcionada falhou antes da correção e passou depois; `simular.test.ts`: 28/28 passaram. |
| Typecheck | `npm run typecheck`: passou. |
| Lint | `npm run lint`: 0 erros; 3 avisos preexistentes em `local/validacao-ciclo-003/conferir.mjs`, fora do diff. |
| Validador | `node --test scripts/validate-governance.test.mjs`: 39/39 passaram; `node scripts/validate-governance.mjs`: 0 erros, 0 avisos e 4 itens manuais. |
| `git diff --check` | Passou. |
| Checks remotos do HEAD `c20d72d` | CI em andamento; Governance e Vercel passaram. |

## Revisão da correção

### Rodada 1

- **Autor:** Codex (GPT-6), na branch `fix/issue-70`.
- **Revisor:** Codex (GPT-6), por solicitação explícita do responsável nesta conversa.
- **Data e autorização:** 2026-10-18; frase "revise a correção da issue #70".
- **Base:** diff local da correção sobre `main` em `f5a438823a4ad9fd11c4e3f773a4d2306fc8455c`; issue #70 `OPEN`; sem PR.

#### Conferência

- O plano aprovado define `consolidado_mensal` em M1/M10; o leitor agora valida, consulta e nomeia erros usando esse mesmo identificador. As cinco colunas obrigatórias permanecem as mesmas.
- A regressão usa SQLite fictício. Ela falhou antes da correção (`resultado.ok` falso) e passou depois; o arquivo completo `simular.test.ts` passou **28/28**.
- O DDL e o helper E2E passaram a usar o nome do contrato. `rg` não encontrou a grafia divergente em `src/` ou `tests/`.
- O diff não altera fórmulas, regras financeiras, schema do destino, autenticação, RLS nem interface. Issue, task e fixtures não contêm dados reais; nenhum SQLite real foi aberto nesta revisão.
- Typecheck passou. Lint terminou com 0 erros e 3 avisos já existentes em `local/validacao-ciclo-003/conferir.mjs`, arquivo fora do diff. Testes de governança: 39/39; validador: 0 erros e 0 avisos; `git diff --check`: limpo.

#### Achados

- **Bloqueadores:** nenhum.
- **Ressalvas:** nenhuma.

**Veredito: `APTO PARA APROVAÇÃO`.** A revisão não aprova merge nem abre a PR.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + fix + revisar_plano + issue-70/rodada-1 + base f5a438823a4ad9fd11c4e3f773a4d2306fc8455c`
- `effect_class`: `local_mutation`
- `state_before`: issue #70 `OPEN`; correção pronta; task `Em andamento`; aguardando revisão da rodada 1.
- `state_after`: issue #70 `OPEN`; revisão da rodada 1 `Concluída`; veredito `APTO PARA APROVAÇÃO`; task segue `Em andamento`; PR não criada.
- `result`: `executed`
- `evidence`: frase do responsável; revisão do diff, teste de regressão, barreiras e critérios; 28/28 testes de simulação, typecheck, 39/39 testes de governança, validador sem erros/avisos e `git diff --check` limpo.
- `blockers`: nenhum achado de revisão; a continuação para abrir a PR requer o pedido "continue a correção da issue #70"; merge requer aprovação própria depois dos checks.

## Decisões incidentais e desvios

Nenhum.

## Encerramento

Não se aplica — correção pela trilha curta.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — correção da issue #70
Quem: Responsável
Conferir: [PR #71](https://github.com/EuThiagoAndrade/saldo-futuro/pull/71), checks remotos e diff
Diga: "aprovo o merge da PR #71"
```

## Continuação — publicação da PR

- Branch `fix/issue-70` publicada no remoto; commit de implementação `c20d72d5596a8bfbfbb4000c0cad4648db34bf0e`.
- PR #71 aberta contra `main`, vinculando `Closes #70`; revisão formal `APTO PARA APROVAÇÃO` registrada acima.
- Estado registrado no momento desta atualização: CI em andamento; Governance e Vercel passaram. Merge continua sem aprovação.
- Handoff: `handoff_schema_version: 2`; `effect_class: remote_mutation`; `state_before`: correção revisada na branch, PR ainda não publicada; `state_after`: PR #71 aberta e anexada a esta tarefa, CI pendente; `result: executed`; evidência: URL da PR e runs remotas; `blockers`: conclusão dos checks remotos e aprovação explícita "aprovo o merge da PR #71".

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + fix + corrigir_trilha_curta + 70 + base f5a438823a4ad9fd11c4e3f773a4d2306fc8455c`
- `effect_class`: `local_mutation`.
- `state_before`: branch `main` limpa em `f5a438823a4ad9fd11c4e3f773a4d2306fc8455c`; nenhuma issue equivalente encontrada na busca; sem branch/task da correção.
- `state_after`: issue #70 `OPEN`; branch `fix/issue-70`; task `Em andamento`; leitor e fixtures alinhados ao contrato aprovado; regressão e validações locais passaram; aguardando revisão formal.
- `result`: `executed`
- `evidence`: autorização exata recebida em 2026-10-18; issue #70 criada e relida; branch criada da base limpa; teste da regressão falhou antes e passou depois; 28/28 testes de simulação passaram; typecheck passou; lint sem erros e com 3 avisos preexistentes em `local/`; testes de governança 39/39; validador com 0 erros/avisos; `git diff --check` limpo.
- `blockers`: revisão formal, PR e aprovação de merge pendentes.
