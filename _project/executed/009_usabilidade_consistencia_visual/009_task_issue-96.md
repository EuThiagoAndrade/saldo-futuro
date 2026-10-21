# Task — Issue #96: Mostrar os campos de intervalo só no período escolhido

> **Ciclo:** `009`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `fix`
> **Issue:** `#96`
> **Plano:** `_project/executed/009_usabilidade_consistencia_visual/009_plan.md`
> **Branch:** `fix/issue-96`
> **PR:** [#100](https://github.com/EuThiagoAndrade/saldo-futuro/pull/100)
> **Integração:** `Conferida no GitHub — PR #100 MERGED em 2026-10-20`
> **Autorização inicial:** "autorizo a implementação da issue #96" em 2026-10-20
> **Modo contínuo:** `—`
> **Início:** 2026-10-20
> **Última atualização:** 2026-10-20
> **handoff_schema_version:** `2`

## Objetivo

Exibir os campos "De" e "Até" dos filtros de período do Início e da comparação de benchmarks somente quando "Intervalo escolhido" está selecionado, sem mudar a interpretação dos períodos nem a validação do servidor.

## Escopo autorizado

Item 3 (BL-003) e a estratégia de testes da `v2` aprovada do ciclo 009; issue #96. Não inclui a issue #97.

## Origem no backlog

Snapshot herdado do plano: BL-003, necessidade integral (campos de intervalo visíveis somente quando "Intervalo escolhido" está selecionado, em todos os filtros de período com predefinições: Início e comparação de benchmarks). Fonte `_project/backlog.md` em `811ff840a51da200bdff8f0591e11d9d95fd103f`, já em main. Destino em preparação: ciclo 009; não altera a fila.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

Toda linha é obrigatória. "Não se aplica" exige justificativa. Com G1 ou G2 marcados com "Sim", o modo contínuo não pode estar `ativo`.

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Só apresentação do filtro; `limitesDoPeriodo`, os períodos e a rentabilidade não mudam, e o e2e de CR-51 continua cobrindo os limites dos cinco períodos |
| G2 — isolamento por RLS | Não | Sem alteração de sessão, consultas, políticas ou acesso a dados |
| G3 — privacidade de dados | Sim | Somente usuário e ativo fictícios no Supabase local (`periodo96.comum`, removido no fim); nenhum dado real, `local/` financeiro ou produção |
| G4 — migrações só acrescentam | Não | Nenhuma migração criada ou alterada |

## Execução

- [x] Autorização, issue #96 aberta, plano `v2` aprovado, #95 integrada e base `d57f8fe` (igual a `origin/main`) conferidos; sem branch ou PR anteriores da #96.
- [x] Reconciliação da task #95 e atualização de `cycles.md`; `.agent/lessons_learned.md` (alheia ao ciclo) fica fora do staging.
- [x] `globals.css`: regra `form:not(:has(option[value="intervalo"]:checked)) [data-campos-intervalo] { display: none }`, sem JavaScript no cliente; sem suporte a `:has()`, a regra é descartada e os campos ficam visíveis, como antes.
- [x] Início e comparação: os campos `de`/`ate` ficam num grupo `data-campos-intervalo` com `display: contents` (o layout não muda); rótulos "De" e "Até"; `novalidate` nos dois formulários; `max={M}`, valores iniciais, `limitesDoPeriodo` e mensagens de recusa preservados.
- [x] E2e `periodo-intervalo.spec.ts`, nas duas telas em 360 e 1280 px (20 testes): campos ocultos e fora da ordem de foco nos quatro tipos predefinidos; visíveis com intervalo ao carregar e ao trocar o seletor, sem recarregar a página e sem rolagem horizontal; mês posterior a M num campo oculto, troca para cada predefinição e envio efetivo; URL predefinida com mês futuro enviada; `?periodo=ano&de=2026-02&ate=2026-01` sem recusa e o mesmo endereço com `periodo=intervalo` recusado; intervalo posterior a M recusado pelo servidor.
- [x] Controle negativo: sem `novalidate` na comparação, dois dos testes falham (envio bloqueado pelo campo oculto), como a reprodução da revisão previa.
- [x] Suíte completa e governança.
- [x] Publicar a PR #100 e conferir o estado OPEN.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| `npm run lint` | 0 erros; três avisos preexistentes em script ignorado de validação local (`local/`) |
| `npm run typecheck` | Passou |
| `npm test` | 305/305 (25 arquivos); a mudança é só de marcação e CSS, sem teste unitário novo |
| Build | Passou, pelo `webServer` do Playwright |
| E2e específico | `periodo-intervalo.spec.ts` 20/20 |
| E2e completo | Backend local: 137 passaram e 8 pulados (preview sem backend e suítes opt-in); inclui CR-51 (limites dos cinco períodos), as telas de benchmarks e o axe das páginas autenticadas em 360 e 1280 px, sem regressões |
| Governança | `node --test scripts/validate-governance.test.mjs` 48/48; `node scripts/validate-governance.mjs` com 0 erros, 0 avisos e cinco itens manuais |
| `git diff --check` | Passou |
| Checks remotos | Todos verdes no head `9440444cf137bf31594aedc73db6e21451e1781c`: lint, tipos, testes, build e e2e de preview; Supabase local, testes de banco e e2e de autenticação; governança; Vercel |

## Revisão da correção

Não se aplica (trilha normal).

## Decisões incidentais e desvios

- O grupo usa `display: contents` para que o layout de cada formulário (flex no Início e na comparação) fique igual ao anterior; a regra de ocultação fica sem camada no `globals.css`, por isso vence a utilidade `contents`.
- Os rótulos passaram de "De (intervalo)" e "Até (intervalo)" para "De" e "Até", como o plano permite; nenhum teste anterior dependia do texto antigo.
- Com `novalidate`, o navegador deixa de barrar um intervalo posterior a M; a recusa passa a vir só do servidor, com as mensagens atuais (risco registrado no plano).
- Sem mudança de banco, autenticação, schema, cálculo ou dependências.

## Encerramento

Não se aplica: a #97 é a última issue do ciclo e leva o encerramento prospectivo.

## Reconciliação da integração

Em 2026-10-20, o responsável declarou "aprovo o merge da PR #100". O check de Supabase local estava pendente nesse momento; o agente esperou a conclusão e conferiu os cinco checks verdes no head `9440444cf137bf31594aedc73db6e21451e1781c` antes do squash, conferido no GitHub com o assunto `fix(issue-96): mostrar os campos de intervalo só no período escolhido (#100)`. A issue #96 foi fechada. Reconciliação feita na implementação autorizada da #97; não registra o SHA do próprio merge.

## Próximo passo

Ciclo 009 encerrado prospectivamente na última PR (issue #97): depois do merge dela, a situação do ciclo é Concluído.

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 009 (leve)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 009 + implementar_issue + 96/Item-3-BL-003 + d57f8fe`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: plano `v2` Em Execução, #94 e #95 integradas, #96 aberta, sem branch nem PR / branch `fix/issue-96` publicada com a PR #100 aberta
- `result`: `already_executed_and_reconciled`
- `evidence`: autorização desta task; validações da tabela de evidências; `git fetch` com `main` igual a `origin/main` em `d57f8fe`; consulta prévia sem PR da #96
- `blockers`: nenhum; o merge depende de checks verdes e de "aprovo o merge da PR #N"
