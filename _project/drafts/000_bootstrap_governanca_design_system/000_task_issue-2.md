# Task — Issue #2: Implementar bootstrap da governança

> **Ciclo:** `000`
> **Trilha:** `normal`
> **Estado:** `Em andamento`
> **Tipo:** `chore`
> **Issue:** `#2`
> **Plano:** `_project/drafts/000_bootstrap_governanca_design_system/000_plan.md`
> **Branch:** `chore/issue-2`
> **PR:** —
> **Integração:** `Pendente`
> **Início:** 2026-10-12
> **Última atualização:** 2026-10-12
> **handoff_schema_version:** `1`
> **handoff_id:** `saldo-futuro:000:implementar_issue:issue-2:a448ec4`

Instanciada a partir de `.agent/templates/task.md`, criado no primeiro commit desta branch (`a1af945`), conforme a ressalva S3 da revisão do plano. O workflow `implementar_issue` do `euthiagoandrade-api` @ `9f79071` é aplicado como procedimento, pela exceção de bootstrap do plano.

## Objetivo

Implantar o núcleo de governança local do Saldo Futuro (Itens 1 a 6 do plano `000`).

## Escopo autorizado

- Gate C concedido pelo responsável em 2026-10-12.
- Itens 1 a 6 do plano aprovado no commit `a448ec4`.
- Fora do escopo: Item 7 (issue B, #3), código de aplicação e alterações nos repositórios de referência.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Não há regra de cálculo; a entrega só declara a barreira |
| G2 — isolamento por RLS | Não | Não há tabela nem migração; a verificação estática é implantada e coberta por fixtures |
| G3 — privacidade de dados | Sim | Documentos sem dados do usuário; `.gitignore` e validador implantam o enforcement |
| G4 — migrações só acrescentam | Não | Não há migração; o passo de CI é implantado e demonstrado |

## Execução

- [x] Template de task criado no primeiro commit (S3).
- [ ] Item 1 — núcleo canônico e ciclo de vida.
- [ ] Item 2 — ADRs e KB.
- [ ] Item 3 — adapters, workflows, templates e skills.
- [ ] Item 4 — integração GitHub.
- [ ] Item 5 — validador estrutural.
- [ ] Item 6 — README e `.gitignore`.
- [ ] Plano em `Em Execução` e rastreabilidade atualizada.

## Evidências

| Gate | Resultado |
| :-- | :-- |
| Testes | Pendente |
| Validação | Pendente |
| `git diff --check` | Pendente |
| Checks remotos | Pendente |

## Decisões incidentais e desvios

## Resultado

### Handoff de execução

Pendente até a publicação da PR.
