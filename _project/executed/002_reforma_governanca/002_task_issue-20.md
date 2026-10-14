# Task — Issue #20: Reforma da governança (regras, workflows, templates e validador)

> **Ciclo:** `002`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `chore`
> **Issue:** `#20`
> **Plano:** `_project/drafts/002_reforma_governanca/002_plan.md`
> **Branch:** `chore/issue-20`
> **PR:** [#22](https://github.com/EuThiagoAndrade/saldo-futuro/pull/22)
> **Integração:** `Integrada por squash em 70f592c, em 2026-10-13`
> **Autorização inicial:** "autorizo a implementação da issue #20" em 2026-10-13
> **Modo contínuo:** `—`
> **Início:** 2026-10-13
> **Última atualização:** 2026-10-13
> **handoff_schema_version:** `2`

Instanciada a partir do template `.agent/templates/task.md` vigente nesta branch, já na versão 2, como prevê "Transição do ciclo `002`" no plano. Ponto de aprovação "Autorizar implementação da issue A" concedido pelo responsável em 2026-10-13, depois da integração da PR do plano (#19) e da criação das issues #20 e #21.

## Objetivo

Implementar os itens A1 a A7 do plano aprovado: regras canônicas, workflows, templates, adapters, ADRs e validador da governança reformada, na mesma PR (D6).

## Escopo autorizado

- **A1** `.agent/ai_behavior.md`.
- **A2** `_project/README.md`.
- **A3** `.agent/workflows/`: 9 reescritos, mais `triar.md` e `retomar.md`.
- **A4** templates, skill `governance-check` e `.github/pull_request_template.md`.
- **A5** `GEMINI.md`, ADR-001 e nova ADR-004.
- **A6** `scripts/governance-manifest.json`, `scripts/validate-governance.mjs` e `scripts/validate-governance.test.mjs`.
- **A7** esta task, com a tabela de destino dos controles.
- Transição do plano e do ciclo para `Em execução` e rastreabilidade das issues.

Fora do escopo: código da aplicação, CI, documentação viva (issue #21) e artefatos históricos.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Nenhuma regra de cálculo; a barreira foi transcrita sem mudança semântica para `_project/README.md` (só a referência de ciclo `002` → `003`) |
| G2 — isolamento por RLS | Não | Nenhuma migração, política ou função; a verificação estática do validador (cenário 15) não foi alterada |
| G3 — privacidade de dados | Sim | Textos e exemplos só com nomes de tabela, papéis e dados fictícios; conferência manual do diff sem e-mail, valor, ativo ou instituição real |
| G4 — migrações só acrescentam | Não | Nenhuma migração; o passo de CI e o padrão de nome não foram alterados |

## Execução

- [x] A1 — `ai_behavior.md`: handoff versão 2 com regras universais, autorizações e pontos de aprovação, exceção delimitada do modo contínuo, princípios agnósticos e bloco "Próximo passo". 135 linhas (antes, 137).
- [x] A2 — `_project/README.md`: níveis e triagem, entrada, fluxo por nível, pontos de aprovação, situações e próximo passo (com a retomada), modo contínuo, revisão formal, encerramento prospectivo, transições do leve e do modo contínuo, glossário; referências de ciclo `002` → `003` nas barreiras.
- [x] A3 — workflows com handoff versão 2, `logical_key` e "Situações de saída"; `triar` e `retomar` somente leitura; `revisar_plano` sem promoção; promoção do leve contínuo em `criar_issues` (R2-5).
- [x] A4 — templates de ideação, plano e task na versão 2; `governance-check` conferindo bloco e modo contínuo; template de PR com "Nível", "Modo contínuo" e "Aprovar merge concedido".
- [x] A5 — `GEMINI.md` com instrução textual; ADR-001 com o Antigravity e a correção sobre o Claude Code; ADR-004 aceita.
- [x] A6 — validador com os cenários 20 a 30, a sincronização com `_project/README.md` e a lista de legados enumerada arquivo a arquivo (R3-1); 13 testes novos.
- [x] A7 — tabela de destino dos controles abaixo, com evidência.
- [x] Plano em `Em Execução`, ciclo em `Em execução` e issues #20 e #21 na rastreabilidade.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | `node --test scripts/validate-governance.test.mjs`: 39 passaram (26 anteriores, ajustados à fixture na versão 2, e 13 novos), 0 falharam |
| Validador | `node scripts/validate-governance.mjs`: 0 erros, 0 avisos, 4 itens manuais, com os ciclos `000` e `001` intactos |
| `git diff --check` | Passou |
| Checks remotos | PR #22 no commit `68eda85`: Validate governance, CI (os dois jobs) e Vercel verdes; em `main` @ `70f592c`: Governance, CI e Release Please verdes |
| Diretório `.agent/rules/` | Inexistente, como exige A5 |

## Destino dos controles

Toda linha da tabela do plano tem destino e evidência. Nenhum controle foi removido.

| Controle ou lição atual | Destino | Evidência |
| :-- | :-- | :-- |
| Matriz de autoridade e ordem de leitura | Mantidas, com linha de memória privada | `ai_behavior.md`, "Ordem de leitura" e "Matriz de autoridade" |
| Contrato de handoff (15 + 4 campos) | Fundido na versão 2 e no bloco | `ai_behavior.md`, "Contrato de handoff (versão 2)"; cenários 26 e 30 |
| "O handoff nunca aciona o workflow seguinte" | Alterado: exceção do modo contínuo | `ai_behavior.md`, regra "Sem encadeamento automático"; `_project/README.md`, "Modo contínuo" (preflight) |
| Saída reduzida dos somente leitura | Mantida, com bloco não gravado | `triar.md`, `retomar.md`, `health_check.md` e `listar_issues.md` |
| Inspeção não autoriza mutação; rascunho não autoriza implementação | Mantidos | `ai_behavior.md`, "Autorizações e pontos de aprovação" |
| Revisão formal obrigatória | Mantida no leve e no completo; revisão da correção na curta | `_project/README.md`, "Revisão formal"; `revisar_plano.md`; template de task, "Revisão da correção" |
| Aprovação humana posterior ao veredito | Alterado no modo contínuo | `ai_behavior.md`, "Exceção delimitada"; `criar_issues.md`, passo 1; cenários 23 e 29 |
| Implementação exige plano, issue e autorização | Mantido | `ai_behavior.md`; `implementar_issue.md`, "Barreira" |
| Integração exige checks verdes e aprovação por PR | Mantido, sem exceção | `ai_behavior.md`; `implementar_issue.md` e `corrigir_trilha_curta.md` |
| Encerramento após integração, sem issue recursiva | Mantido, prospectivo e atômico | `_project/README.md`, "Encerramento prospectivo"; regras 4 a 6 da retomada; cenário 28 |
| Parar quando faltar autorização | Mantido como "Parado" | `ai_behavior.md`, "Concessão não é verificação" |
| Conduta, simplicidade, mudanças cirúrgicas, incertezas, regra financeira | Mantidos | `ai_behavior.md`, "Conduta de execução" e subseções; regra financeira fora do modo contínuo |
| Segurança, mudanças externas e privacidade | Mantidos integralmente | `ai_behavior.md`, seções sem alteração de texto |
| Estados e transições do plano | Mantidos, com leve e modo contínuo | `_project/README.md`, "Estados válidos" e "Transições canônicas do plano" |
| Fluxo normal | Substituído | `_project/README.md`, "Fluxo por nível" |
| Trilha curta e critérios | Mantidos; precedência e modo contínuo sem G1/G2 | `_project/README.md`, "Níveis e triagem" e "Trilha curta"; cenários 17 e 27 |
| Barreiras G1 a G4 e enforcement | Mantidos sem mudança semântica | `_project/README.md`, "Barreiras de domínio"; cenários 14 a 16 inalterados |
| Relação plano, issue, task e PR; convenções; gates mínimos | Mantidos, com notas do leve | `_project/README.md`, seções correspondentes |
| "Cada merge tem gate próprio" | Mantido como "aprovar merge" | `_project/README.md`, "Pontos de aprovação"; template de plano |
| Tabela de gates | Renomeada para "Pontos de aprovação" | Template de plano, "Pontos de aprovação"; cenário 25 |
| Condições de parada por plano | Mantidas e somadas ao modo contínuo | Template de plano; `_project/README.md`, "Modo contínuo" |
| Lições 2026-08-12, 2026-10-12 (maiúsculas) e técnicas de 2026-10-13 | Mantidas | `.agent/lessons_learned.md`, sem alteração |
| Lição 2026-08-13 (rascunho ≠ revisão) | Mantida e reforçada | Cenário 23 |
| Lição 2026-08-17 (handoff estável) | Mantida | `logical_key` e regra "Reconciliação" em `ai_behavior.md` |
| Lição 2026-08-19 (reconciliação pós-merge) | Mantida | `_project/README.md`, "Encerramento prospectivo" |
| Lição 2026-10-12 (objetivo, não mecanismo) | Mantida | `.agent/lessons_learned.md`; `revisar_plano.md`, verificação de fatos |
| Lição 2026-10-13 (concessão ≠ verificação) | Mantida | `ai_behavior.md`, "Concessão não é verificação"; frase de ação externa com conferência; preflight |
| Lição 2026-10-13 (roteiros externos) | Mantida | `.agent/lessons_learned.md`; ponto "Ação humana externa" |
| Cenários 1 a 19 do validador | Mantidos; 4 e 19 com os trechos novos do manifesto | `scripts/validate-governance.test.mjs` |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

- **Regra 5 da retomada:** cobre a janela entre o merge de uma PR e a reconciliação da sua task, quando `main` ainda mostra "Aguardando merge". O algoritmo do plano tratava PR aberta e encerramento integrado, mas não essa janela. A regra deriva o passo seguinte do plano, sem nova autorização. Está dentro da intenção do plano ("depois de cada merge, quem o fez continua").
- **Título "Gates mínimos" mantido:** em `_project/README.md`, porque aí "gate" significa verificação obrigatória. O glossário registra os dois sentidos.
- **Arquivos obrigatórios no manifesto:** ADR-004, `triar.md` e `retomar.md` entraram na lista, para que sua ausência seja detectada.
- **Situações de saída dos somente leitura:** `health_check` e `listar_issues` listam as situações que podem repetir, sem gravá-las.
- **Correção durante os testes:** o padrão de código de gate foi gravado primeiro com `\b` simples no JSON, que vira o caractere de backspace. Corrigido para `\\b`, e o cenário 25 passou a reprovar o caso negativo.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 002 (completo)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 002 + implementar_issue + 20/A1-A7 + 227344b`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: antes, plano `Aprovado` e ciclo `Planejamento` em `main` @ `227344b`, issues #20 e #21 abertas; depois, branch `chore/issue-20` publicada com A1 a A7, plano `Em Execução` e ciclo `Em execução`, PR #22 aprovada pelo responsável ("aprovo o merge da PR #22") e integrada por squash em `70f592c`; issue #20 fechada. Reconciliada na PR da issue #21, como prevê a regra 5 da retomada.
- `result`: `executed`
- `evidence`: tabela "Evidências" e "Destino dos controles" desta task; checks da PR.
- `blockers`: nenhum.
