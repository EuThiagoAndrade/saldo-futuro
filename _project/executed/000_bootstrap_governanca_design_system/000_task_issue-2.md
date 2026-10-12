# Task — Issue #2: Implementar bootstrap da governança

> **Ciclo:** `000`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `chore`
> **Issue:** `#2`
> **Plano:** `_project/executed/000_bootstrap_governanca_design_system/000_plan.md`
> **Branch:** `chore/issue-2`
> **PR:** [#4](https://github.com/EuThiagoAndrade/saldo-futuro/pull/4)
> **Integração:** `Integrada por squash em a01da6f (2026-10-12)`
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

- [x] Template de task criado no primeiro commit (S3): `a1af945`.
- [x] Item 1 — núcleo canônico e ciclo de vida; plano em `Em Execução` e rastreabilidade atualizada: `a2946fd`.
- [x] Item 2 — ADR-001 a ADR-003, KB-001 e templates de ADR e KB: `75d0bb4`.
- [x] Item 3 — adapters, nove workflows, templates de ideação e plano, três skills: `07bf89f`.
- [x] Item 4 — Issue Forms, template de PR no caminho padrão e `governance.yml`: `6c32555`.
- [x] Item 5 — manifesto, validador e 26 testes cobrindo os 19 cenários: `5336b20`.
- [x] Item 6 — README expandido; `.gitignore` do commit raiz já atende ao cenário 13: `0373bf9`.
- [x] Ajuste pedido pelo responsável na revisão da PR: React explícito na stack da ADR-002 e do README: `d34193c`.

## Evidências

| Gate | Resultado |
| :-- | :-- |
| Testes | `node --test scripts/validate-governance.test.mjs`: 26 testes, 26 aprovados, 0 falhas (Node.js 24.15.0, Windows) |
| Validação | `node scripts/validate-governance.mjs`: 0 erros, 1 aviso esperado (sem `package.json`), 4 itens manuais |
| `git diff --check` | Sem ocorrências em `main...chore/issue-2` |
| Passo G4 (demonstração) | Bloco `run` extraído do `governance.yml` e executado num repositório temporário: primeiro push ignorado (0); sem pasta de migrações (0); adição (0); edição `M` (1); renomeação `R100` (1); remoção `D` (1); `before` inalcançável após push forçado, falha fechada (128, ressalva S5); PR com adição (0); PR com edição (1) |
| Adapters | Sintaxe revalidada em 2026-10-12 na documentação do Claude Code (`@caminho` relativo ao arquivo; leitura de `AGENTS.md`) e do Gemini CLI (`@./caminho`) |
| Checks remotos | `Validate governance` aprovado na PR #4 (run 38303264357) |

## Decisões incidentais e desvios

- **Actions fixadas:** `actions/checkout` v6.1.0 e `actions/setup-node` v6.5.0, os SHAs já validados no api. Havia versões maiores (`checkout` v7.0.1 e `setup-node` v7.1.0), mas a última saiu em 2026-10-08, há só quatro dias. A atualização fica para uma manutenção futura.
- **Teste antes da regra:** as regras e os testes do validador foram escritos na mesma sessão, e não estritamente teste antes da regra. Cada regra tem teste negativo que prova a detecção da violação, e os cenários com risco de falso positivo (12, 14, 15, 17 e 18) têm também teste positivo.
- **Fixture gerada do manifesto:** a fixture válida dos testes é gerada a partir do próprio manifesto. Assim, um novo arquivo obrigatório não exige editar os testes (G6).
- **Workflows classificados no manifesto:** cada workflow é declarado como mutante (exige o handoff completo) ou somente leitura (exige a saída reduzida), o que cobre um critério de aceite do Item 3.
- **Plano 000 ganhou nova transição documentada:** "Corrigir após veredito" foi registrada no `_project/README.md`, porque o próprio ciclo `000` a exerceu.
- **Template de plano:** ganhou as seções "Gates humanos" e "Barreiras de domínio", para não repetir o bloqueador B3 da revisão do plano `000`.
- **Merge autorizado pelo gate:** `.agent/ai_behavior.md` registra que, concedido o gate de integração e com checks verdes, o agente integra sem nova confirmação, conforme a instrução do responsável de 2026-10-12.
- **ADR-002, alternativas:** os motivos de rejeição foram reconstruídos a partir das decisões registradas no plano, porque o diálogo de avaliação não está versionado. Isso está declarado na própria ADR e pede revisão manual na PR.
- **Para a auditoria de publicação:** o README e a KB-001 citam repositórios ainda privados, como o `Meus-Investimentos`. Os links não expõem dados, mas devem ser revistos no ciclo de auditoria anterior à abertura (ADR-003).
- **Finais de linha:** arquivos copiados do api tinham CRLF na cópia de trabalho. O `.gitattributes` normaliza para LF no índice, e o validador aceita os dois.

## Resultado

Itens 1 a 6 implementados e integrados. Gate M-A concedido pelo responsável em 2026-10-12; PR #4 integrada por squash em `a01da6f`; issue #2 fechada.

### Handoff de execução

- `handoff_schema_version`: `1`
- `handoff_id`: `saldo-futuro:000:implementar_issue:issue-2:a448ec4`
- `identity_source`: `repository + cycle + workflow + logical_target + source_revision` (alvo: issue #2, Itens 1 a 6; base `a448ec4`).
- `effect_class`: `local_mutation -> remote_mutation`
- `state_before`: plano `Aprovado` em `main` (`a448ec4`), issue #2 aberta, Gate C concedido em 2026-10-12.
- `state_after`: Itens 1 a 6 integrados em `main` (`a01da6f`), PR #4 integrada e issue #2 fechada (reconciliado no encerramento).
- `next_transition`: `PR -> checks -> Gate M-A`.
- `preconditions`: checks verdes do workflow `Governance` e aprovação humana do Gate M-A.
- `authority`: Thiago Andrade (Gate M-A); GitHub (checks).
- `evidence`: esta task, commits `a1af945` a `0373bf9`, checks da PR.
- `acceptance`: critérios de aceite dos Itens 1 a 6 atendidos, checks verdes, escopo restrito à issue A.
- `blockers`: nenhum.
- `result`: `executed`
- `next_workflow_recommended`: integração da PR após o Gate M-A; depois, a issue B (#3).
- `next_workflow_authorized`: nenhum além da publicação da PR; merge exige o Gate M-A.
- `actions_prohibited`: integrar sem o Gate M-A, iniciar a issue B antes da integração da PR A, ampliar escopo.
- `rejection_rule`: o receptor recusa handoff sem PR vinculada, sem checks ou com escopo além dos Itens 1 a 6.
- `logical_key`: `saldo-futuro:000:implementar_issue:issue-2`
- `check_before_mutation`: localizar branch e PR existentes para a issue #2 antes de publicar.
- `reconcile_existing`: atualizar a PR existente em vez de abrir outra.
- `ambiguous_state`: parar se houver mais de uma PR para a issue #2 ou se a base divergir de `a448ec4` sem reconciliação.
