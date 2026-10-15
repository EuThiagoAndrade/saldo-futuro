# Task — Issue #38: telas de ativos, lançamentos e transferências

> **Ciclo:** `004`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `feature`
> **Issue:** `#38`
> **Plano:** `_project/executed/004_telas_produto/004_plan.md`
> **Branch:** `feature/issue-38`
> **PR:** [#45](https://github.com/EuThiagoAndrade/saldo-futuro/pull/45)
> **Integração:** `Integrada por squash em 401fa49, em 2026-10-14`
> **Autorização inicial:** "autorizo a implementação da issue #38" em 2026-10-14
> **Modo contínuo:** `—`
> **Início:** 2026-10-14
> **Última atualização:** 2026-10-15
> **handoff_schema_version:** `2`

Instanciada a partir de `.agent/templates/task.md`. Ponto de aprovação "Autorizar implementação" da issue B concedido pelo responsável em 2026-10-14, depois da integração da issue A (PR #43, `e23f31b`), como exige a sequência A → F.

## Objetivo

Entregar o item B do plano: a escrita da carteira pela interface, com as funções do banco do ciclo `003`. Telas de ativos, lançamentos (lista, novo e detalhe com estorno) e transferências (nova e correção), com Server Actions que validam a entrada com Zod e o parser de quantias e traduzem as recusas da KB-004.

## Escopo autorizado

- Páginas `/ativos`, `/lancamentos`, `/lancamentos/novo`, `/lancamentos/[id]` e `/transferencias`, substituindo os estados "em breve" da issue A.
- Server Actions para `criar_ativo`, `desativar_ativo`, `lancar_evento`, `estornar_evento`, `transferir` e `corrigir_transferencia` (D3).
- Funções puras de tela em `src/lib/telas/` (sinal do lançamento, descrição dos eventos, montagem das transferências e mensagens de recusa), com testes.
- Testes ponta a ponta dos cenários CR-01, CR-03, CR-04 e CR-05, do isolamento e da ocultação com quantias na tela (pendente da issue A).
- Esta task e a rastreabilidade do plano.

Fora do escopo: fechamento (issue #39), Início (issue #40), benchmarks (issue #41), acessos (issue #42); migração, função de banco ou dependência nova.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim | Sinal de cada tipo pela escolha de tipo e direção, nunca pelo texto (`valorComSinal`, conferido contra o CR-01 no Vitest e pela tela); valor lido pelo parser da KB-004 no servidor, em centavos inteiros; CR-03, CR-04 e CR-05 reproduzidos pela tela e conferidos no banco (estorno de −1.000,00, saldos 8.000,00, 0,00 e 2.000,00, pernas de soma zero, correção +100,00 e −100,00); nenhuma conta nova |
| G2 — isolamento por RLS | Sim | Sem tabela, política ou função nova; toda escrita pelas funções do banco com a sessão do usuário; sessão conferida em cada página e ação; teste de ponta a ponta: outro usuário não vê o ativo, recebe 404 no lançamento alheio e, com identificadores alheios injetados nas ações, recebe "não encontrado" sem nenhuma alteração |
| G3 — privacidade de dados | Sim | Testes e capturas só com usuários `example.com`, nomes de ativo fictícios e os valores dos casos; com "Ocultar valores", nenhuma quantia aparece no HTML de lançamentos, detalhe e transferências |
| G4 — migrações só acrescentam | Não | Nenhuma migração criada ou alterada |

## Execução

- [x] Task da issue #37 reconciliada (`Concluída`, integrada em `e23f31b`).
- [x] `src/lib/telas/carteira.ts`: tipos lançáveis pela tela (sem migração histórica), `valorComSinal` (P9), descrição dos eventos, `podeEstornar`, montagem das transferências e tradução das recusas do banco. `carteira.test.ts` (15 testes) com o CR-01, o CR-03 e as pernas do CR-04 e do CR-05.
- [x] `src/lib/telas/leituras.ts`: leituras completas (`lerTabela`) de ativos, eventos, transferências, ajustes e mês fechado.
- [x] Server Actions `criarAtivo`, `desativarAtivo`, `lancar`, `estornar`, `transferir` e `corrigirTransferencia`: sessão primeiro, Zod, parser no servidor e recusa em português.
- [x] `/ativos`: em uso (tabela a partir de `md`, cartões abaixo), trânsito como ativo de sistema, desativação com confirmação, desativados e o formulário de novo ativo.
- [x] `/lancamentos`: filtro por mês e ativo, eventos do mês e, no mês fechado, os ajustes do fechamento marcados; cada evento leva ao detalhe.
- [x] `/lancamentos/novo`: ativo, tipo, direção "Ganho / Perda" só quando o tipo exige, valor com o campo monetário e data.
- [x] `/lancamentos/[id]`: detalhe, vínculo entre estorno e original, estorno com confirmação e data; perna de transferência leva a Transferências.
- [x] `/transferencias`: nova transferência (trânsito incluído) e lista com correção da transferência inteira, com confirmação e data.
- [x] Diálogo de confirmação com `useActionState`: recusa dentro do diálogo; `ValorLancamento` com ícone de entrada ou saída, sem cor (6.6).
- [x] `tests/e2e/carteira.spec.ts` (8 testes): CR-01, CR-03, CR-04 e CR-05 pela tela; isolamento; ocultação com quantias; axe em todas as telas e no diálogo, em 360 px e 1280 px.
- [x] Conferência visual em 360 px e 1280 px com dados fictícios; capturas fora do repositório.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes unitários | `npm test`: 14 arquivos, 168 testes passaram |
| Ponta a ponta com o Supabase local | `npx playwright test`: 48 passaram, 4 pulados (os de preview sem backend) |
| Ponta a ponta sem backend | 12 passaram, 40 pulados (os que exigem o Supabase local) |
| Tipos e lint | `npm run typecheck` sem erro; `npm run lint` sem erro (3 avisos só em `local/`, ignorado pelo Git) |
| Build | `npm run build` com e sem backend |
| Testes da governança | `node --test scripts/validate-governance.test.mjs`: 39 passaram |
| Validador | 0 erros, 0 avisos |
| `git diff --check` | Passou |
| Checks remotos | PR #45: CI (aplicação e banco), governança e Vercel verdes |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

- **Resultado das ações destrutivas:** depois de estornar, corrigir ou desativar, a página é revalidada e o botão deixa de existir, levando junto a mensagem de sucesso. O resultado aparece no próprio estado da página ("Estornado em …", "Corrigida em …", ativo em "Desativados"), e é isso que os testes conferem. A recusa continua aparecendo dentro do diálogo.
- **Sem saldo na lista de ativos:** o saldo calculado atual (KB-004, 4.1) não é o saldo confirmado de um mês fechado, e o `DESIGN.md` proíbe número provisório apresentado como real. A lista mostra nome, tipo de ajuste e situação; o patrimônio vem com o Início (issue #40).
- **Formulário depois da recusa:** o React limpa os campos de um formulário com ação ao fim do envio. A mensagem de recusa permanece; os campos voltam vazios. Não muda nenhum número gravado.
- **Ocultação de ponta a ponta:** a conferência que ficou pendente da issue #37 foi feita aqui, nas primeiras telas com quantias. "R$" sozinho aparece como prefixo fixo do campo de valor, que não é quantia; o teste procura "R$" seguido de algarismos e os valores do cenário.

## Encerramento

Não se aplica.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 004 (completo)
Quem: —
Conferir: —
Diga: —
```

Integrada; o artefato ativo passa a ser a task da issue #39.

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 004 + implementar_issue + 38 + e23f31b`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: antes, PR #45 aberta com checks verdes; depois, PR #45 integrada por squash em `401fa49` e issue #38 fechada, depois de "aprovo o merge da PR #45" em 2026-10-14. Reconciliado no início da issue #39.
- `result`: `executed`
- `evidence`: autorização de 2026-10-14; base `main` @ `e23f31b`; a tabela "Evidências" acima.
- `blockers`: nenhum.
