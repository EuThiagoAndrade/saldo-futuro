# Task — Issue #117: Alinhar a governança ao repositório público

> **Ciclo:** `011`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `chore`
> **Issue:** `#117`
> **Plano:** `_project/executed/011_repositorio_publico_governanca_igpm/011_plan.md`
> **Branch:** `chore/issue-117`
> **PR:** [#120](https://github.com/EuThiagoAndrade/saldo-futuro/pull/120)
> **Integração:** PR #120 integrada por squash em 2026-10-22 (horário de Cuiabá); issue #117 fechada como concluída
> **Autorização inicial:** "autorizo a implementação da issue #117" em 2026-10-22
> **Modo contínuo:** `—`
> **Início:** 2026-10-22
> **Última atualização:** 2026-10-22
> **handoff_schema_version:** `2`

## Objetivo

Tornar as autoridades e os documentos vivos coerentes com o repositório público desde 2026-10-22 e ignorar `.claude/`, conforme o item 2 do plano e as decisões A1 e B1.

## Escopo autorizado

Item 2 do plano: emenda datada no ADR-003; primeira frase de "Privacidade de dados financeiros" em `.agent/ai_behavior.md`; passo V1 da KB-002; frase sobre proteção de branch em `_project/README.md` ("Gates mínimos"); comentário em `tests/e2e/novidades.spec.ts`; `.claude/` no `.gitignore`. Fora: artefatos executados (A1), configurações externas, regras de privacidade.

## Origem no backlog

Não se aplica — a issue #117 não tem origem no backlog.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não se aplica | Nenhuma regra ou cálculo muda; só documentação de governança e um comentário de teste. |
| G2 — isolamento por RLS | Não se aplica | Nenhuma tabela, política ou autenticação muda. |
| G3 — privacidade de dados | Sim | As regras de privacidade ficam intactas; só a frase sobre a visibilidade muda. Diff revisto sem dado do usuário. `.claude/` passa a ser ignorado. |
| G4 — migrações só acrescentam | Não se aplica | Nenhuma migração. |

## Execução

- [x] Branch `chore/issue-117` sobre `main` `4b7fa70ffed2af6b387d8f71e502d19365b53149`.
- [x] ADR-003: emenda datada do ciclo `011` na seção "Publicação do repositório", com data, motivo, situação da auditoria anterior e link ao registro; os dois marcadores substituídos ficam riscados e remetem à emenda; `Status`, contexto, `last_updated` e referências atualizados; "Alternativas consideradas" intacta.
- [x] `.agent/ai_behavior.md`: a primeira frase de "Privacidade de dados financeiros" declara o repositório público desde 2026-10-22; demais regras inalteradas.
- [x] KB-002, V1: sem "O repositório é privado"; orientação de permissões do app do GitHub mantida como condição geral.
- [x] `_project/README.md` ("Gates mínimos"): a frase passa a descrever o ruleset `proteger-main` observado na auditoria (PR e três checks exigidos, sem force push nem exclusão, sem aprovação de revisão exigida); a regra de checks verdes e da frase de aprovação do merge continua.
- [x] `tests/e2e/novidades.spec.ts`: comentário sem "privado"; asserção inalterada.
- [x] `.gitignore`: `.claude/`; `git check-ignore -v .claude/launch.json` aponta a nova linha e `git ls-files .claude` é vazio.
- [x] Busca nos documentos vivos (fora de `executed/`, das ideações, do ciclo `011` e de `local/`) por menções à visibilidade privada e à falta de proteção de branch: nenhuma restante.
- [x] Nenhum artefato executado alterado.
- [x] Reconciliação da task da issue #116 (integrada pela PR #119).

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | `node --test scripts/validate-governance.test.mjs`: 48/48. `npm run typecheck`: sem erros. `npm run lint`: 0 erros e 3 avisos, todos de um script local antigo em `local/` (ignorado pelo Git), idênticos no `main` sem estas mudanças |
| Validador | `node scripts/validate-governance.mjs`: 0 erros, 0 avisos, 5 itens manuais conferidos |
| `git diff --check` | Limpo, também no staging |
| Checks remotos | PR #120: governança, CI de app, banco e e2e autenticado e Vercel verdes no HEAD integrado |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

- **Correção no registro da auditoria (issue #116):** a lista de recomendações sugeria avaliar desativar a permissão de o `GITHUB_TOKEN` aprovar PRs, o que contraria a KB-002 (passo G1), que a exige para o release-please. A sugestão foi retirada com nota datada no próprio registro, sem mudar conclusões, contagens nem o SHA-256 do inventário.
- **Caminho do registro na emenda:** o ADR-003 cita o registro em `drafts/`, onde ele está hoje; o encerramento atualiza a referência para `executed/`.

## Encerramento

Não se aplica.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 011 (completo)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 011 + implementar_issue + 117 + 4b7fa70ffed2af6b387d8f71e502d19365b53149`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: issue #117 aberta, auditoria integrada sem achado / emendas e `.gitignore` na branch `chore/issue-117`, PR #120 aberta com `Closes #117`.
- `result`: `executed`
- `evidence`: diff da PR #120; gates locais acima.
- `blockers`: checks verdes e "aprovo o merge da PR #120". A issue #118 depende desta integração.
- **Reconciliação pós-merge (registrada na entrega da #118):** "aprovo o merge da PR #120" em 2026-10-22; o merge esperou o check de banco terminar e foi feito com os cinco checks verdes no HEAD `5fce0b2`; squash integrado em `main`; issue #117 `CLOSED` como concluída. Situação seguinte: autorização da issue #118, já concedida.
