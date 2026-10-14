# Task — Issue #28: consolidação e rentabilidade (Modified Dietz)

> **Ciclo:** `003`
> **Trilha:** `normal`
> **Estado:** `Aguardando integração`
> **Tipo:** `feature`
> **Issue:** `#28`
> **Plano:** `_project/drafts/003_regras_financeiras/003_plan.md`
> **Branch:** `feature/issue-28`
> **PR:** [#33](https://github.com/EuThiagoAndrade/saldo-futuro/pull/33)
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #28" em 2026-10-14
> **Modo contínuo:** `—`
> **Início:** 2026-10-14
> **Última atualização:** 2026-10-14
> **handoff_schema_version:** `2`

Instanciada a partir de `.agent/templates/task.md`. Ponto de aprovação "Autorizar implementação" da issue C concedido pelo responsável em 2026-10-14, depois da integração da issue B (PR #31, `532a683`).

## Objetivo

Entregar o item C do plano: patrimônio, variação do patrimônio, Modified Dietz mensal na forma inteira, acumulado, ano até a data, série base 100, drawdown e arredondamento de apresentação, em funções puras, testadas contra os casos CR-20 a CR-38.

## Escopo autorizado

- `src/lib/financeiro/rentabilidade.ts`, `acumulado.ts` e `apresentacao.ts`, com `casos-c.test.ts`.
- Esta task, a reconciliação da task da issue #27 e a rastreabilidade do plano.

Fora do escopo: rentabilidade por ativo (D7), benchmarks (issue #29), telas e qualquer mudança no banco.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim | CR-20 a CR-38 passando a partir do JSON da KB-004, com centavos exatos e razões com tolerância de 10⁻⁹ × max(1, \|esperado\|); Dietz com numerador e denominador em `bigint` e uma única divisão; esperados alterados reprovam o teste |
| G2 — isolamento por RLS | Não | Nenhuma tabela, política ou função de banco; as regras são funções puras sobre dados já isolados pela issue #27 |
| G3 — privacidade de dados | Sim | Só os valores fictícios dos casos de referência |
| G4 — migrações só acrescentam | Não | Nenhuma migração criada ou alterada |

## Execução

- [x] `rentabilidade.ts`:
  - `patrimonio`, com o trânsito;
  - `variacaoDoPatrimonio`, `N/D` fora de mês fechado ou com Vi ≤ 0;
  - `dietz`: N = D·(Vf − Vi − ΣF) e M = D·Vi + Σ F·(D − d) em `bigint`, fluxos de aporte, resgate e seus estornos pelo tipo efetivo; `N/D` em mês aberto, no início, com migração ou M ≤ 0.
- [x] `acumulado.ts`:
  - período efetivo a partir do mês seguinte ao início (K8);
  - `N/D` se algum mês do período for `N/D` ou ausente (K1);
  - acumulado, ano até o mês, série base 100 e drawdown máximo com o pico inicial 100.
- [x] `apresentacao.ts`: representação mais curta expandida sem expoente, vírgula deslocada no texto, 2 casas meio-para-cima simétrico (K10), formato brasileiro com U+2212 e zero sem sinal.
- [x] `casos-c.test.ts` (23 testes): CR-20 a CR-38, mais o ano até a data, o drawdown de série crescente e expoentes.
- [x] Conferido que esperados alterados no JSON (CR-33 e CR-38) reprovam o teste. Uma alteração de 5 × 10⁻¹⁰ no retorno do CR-20 passa, como prevê a tolerância.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | `npm test`: 7 arquivos, 71 testes passaram (23 novos); `npm run lint` sem erro (os 3 avisos vêm de `local/`, ignorado pelo Git); `npm run typecheck` e `npm run build` sem erro; `node --test scripts/validate-governance.test.mjs`: 39 passaram. Sem mudança de banco, `supabase test db` fica para o CI |
| Validador | `node scripts/validate-governance.mjs`: 0 erros, 0 avisos |
| `git diff --check` | Passou |
| Checks remotos | Pendente |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

- **Mês ausente no período:** um mês sem retorno informado conta como `N/D` (K1), em vez de ser ignorado.
- **Conversão para `number`:** o Dietz converte numerador e denominador inteiros para `float64` só na divisão final (P3, D11); a variação divide a diferença exata em `bigint` por Vi.
- **Nenhuma mudança na KB-004:** as regras implementadas são as das seções 2, 6, 7 e 8.

## Encerramento

Não se aplica.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 003 (completo)
Quem: Responsável
Conferir: [PR #33](https://github.com/EuThiagoAndrade/saldo-futuro/pull/33): checks, diff e casos CR-20 a CR-38
Diga: "aprovo o merge da PR #33"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 003 + implementar_issue + 28/C + 532a683`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: antes, `main` @ `532a683`, com as issues A e B integradas e a issue #28 aberta; depois, branch `feature/issue-28` publicada com o item C e PR #33 aberta, aguardando checks e a aprovação do merge.
- `result`: `executed`
- `evidence`: tabela "Evidências" desta task.
- `blockers`: "aprovo o merge da PR #33", com os checks verdes.
