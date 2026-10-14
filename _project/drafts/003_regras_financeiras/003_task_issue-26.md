# Task — Issue #26: KB-004, regras financeiras e casos de referência

> **Ciclo:** `003`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `chore`
> **Issue:** `#26`
> **Plano:** `_project/drafts/003_regras_financeiras/003_plan.md`
> **Branch:** `chore/issue-26`
> **PR:** [#30](https://github.com/EuThiagoAndrade/saldo-futuro/pull/30)
> **Integração:** `Integrada por squash em d8fcae4, em 2026-10-14`
> **Autorização inicial:** "autorizo a implementação da issue #26" em 2026-10-14
> **Modo contínuo:** `—`
> **Início:** 2026-10-14
> **Última atualização:** 2026-10-14
> **handoff_schema_version:** `2`

Instanciada a partir de `.agent/templates/task.md`. Ponto de aprovação "Autorizar implementação" da issue A concedido pelo responsável em 2026-10-14, com o plano `v3` aprovado e integrado (PR #25) e as issues #26 a #29 criadas. Primeira entrega do ciclo: o plano passa a `Em Execução` e o ciclo a `Em execução`.

## Objetivo

Entregar o item A do plano: a KB-004 com a especificação canônica das regras financeiras, as escolhas de cálculo K decididas pelo responsável, os casos de referência `CR-NN` em Markdown e em JSON, o teste de concordância entre os dois e o registro da conferência independente.

## Escopo autorizado

- `_project/knowledge/KB-004_regras_financeiras.md`.
- `tests/fixtures/financeiro/casos_referencia.json`.
- `src/lib/financeiro/casos-referencia.test.ts` (teste de concordância, D12).
- `_project/drafts/003_regras_financeiras/003_validation_casos_referencia.md`.
- `scripts/governance-manifest.json`: KB-004 em `requiredFiles`.
- Esta task; transição do plano e do ciclo, rastreabilidade e o registro das decisões K no plano.

Fora do escopo: migrações, funções do banco e módulos de regras (issues B a D), o parser de quantias (ciclo `004`) e qualquer mudança de governança ou do `DESIGN.md`.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim | KB-004 com todas as regras do item A; 47 casos `CR-01` a `CR-50` com passo a passo; escolhas K1 a K13 decididas pelo responsável; teste de concordância KB × JSON; recálculo cego por outro modelo e conferência do responsável em `003_validation_casos_referencia.md` |
| G2 — isolamento por RLS | Não | Nenhuma tabela, política ou função; a KB só especifica o isolamento que as issues B e D implementam |
| G3 — privacidade de dados | Sim | Casos e fixtures só com valores fictícios e índices públicos (códigos SGS 12 e 433); nenhum valor, teste ou fixture da origem; conferência manual do diff sem dado do usuário |
| G4 — migrações só acrescentam | Não | Nenhuma migração criada ou alterada |

## Execução

- [x] Leitura de `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, do plano, da ideação, da issue #26, de `.agent/lessons_learned.md`, dos templates de KB, task e PR e do manifesto.
- [x] Branch `chore/issue-26` criada a partir de `main` @ `3245a4d`.
- [x] K1 a K7 levadas ao responsável com alternativas e exemplos; K8 a K13 identificadas ao especificar e levadas da mesma forma. Todas decididas em 2026-10-14 (recomendação em todas), registradas na seção 13 da KB-004 e no plano.
- [x] KB-004 pelo template de KB: convenções, apresentação, faixa, eventos, estorno, transferência e trânsito, migração, datas e início, fechamento, consolidação, variação e Dietz, acumulado, ano, base 100 e drawdown, benchmarks, cobertura, comparação, taxa de acerto, benchmark de valor absoluto (não implementado), parser (não implementado), rastreabilidade da origem e destino de O1 a O13.
- [x] JSON com os 47 casos e o teste de concordância, com o caso negativo (valor divergente, chave ausente e caso ausente) e o de formato inválido.
- [x] Recálculo cego por outro modelo (Claude Sonnet, sem acesso ao repositório nem aos esperados), comparação e registro em `003_validation_casos_referencia.md`: duas divergências de entrada ou motivo resolvidas (CR-02 e CR-50), duas de notação (CR-16), nenhuma de cálculo.
- [x] Conferência numa planilha, registrada na seção 2 de `003_validation_casos_referencia.md`: executada pelo Codex desktop (GPT-6) por delegação expressa do responsável, 47 casos e 250 resultados, nenhuma divergência. O responsável aprovou o merge depois desse registro ("aprovo o merge da PR #30", 2026-10-14).
- [x] Plano em `Em Execução`, ciclo em `Em execução`, issues na rastreabilidade e KB-004 no manifesto.

### Cobertura mínima dos casos (plano, "Estratégia de testes")

| Item da lista mínima | Casos |
| :-- | :-- |
| Sinais por tipo | CR-01, CR-02 |
| Estorno | CR-03, CR-23, CR-24 |
| Transferência e trânsito | CR-04, CR-05, CR-17, CR-28 |
| Ajuste positivo e negativo | CR-12 |
| Fechamento recusado por pendência e por identidade | CR-13, CR-14 |
| Reabertura | CR-15, CR-16 |
| Dietz com o exemplo de P11 | CR-20 |
| Fevereiro de ano bissexto | CR-21 |
| Primeiro mês | CR-30 |
| Denominador ≤ 0 | CR-26 |
| K1 a K7 | CR-33 (K1), CR-24 (K2), CR-45 (K3), CR-40 a CR-42 e CR-48 (K4), CR-25 (K5), CR-05 (K6), CR-06 (K7) |
| K8 a K13 | CR-34 e CR-35 (K8), CR-46 (K9), CR-38 (K10), CR-50 (K11), CR-13 e CR-17 (K12), CR-06 e CR-18 (K13) |
| Acumulado, ano e variação | CR-32, CR-20, CR-31 |
| Mês migrado | CR-29, CR-35 |
| Composição diária e mês parcial | CR-40, CR-41, CR-42, CR-47 |
| Série mensal | CR-43 |
| Comparação em p.p. e em % | CR-44, CR-45 |
| Taxa de acerto e drawdown | CR-46, CR-36, CR-37 |
| Arredondamento de apresentação, inclusive 1,005 | CR-38 |
| Faixa do dinheiro (D11) | CR-07 a CR-11, CR-27 |

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | `npm test`: 5 arquivos, 26 testes passaram, inclusive os 4 de concordância; `npm run lint`, `npm run typecheck` e `npm run build` sem erro; `node --test scripts/validate-governance.test.mjs`: 39 passaram |
| Validador | Pendente |
| `git diff --check` | Passou |
| Recálculo independente | 250 valores; rodada 2 com 248 iguais e 2 diferenças só de notação; nenhuma divergência aberta |
| Conferência na planilha | 47 casos, 250 resultados, nenhuma divergência (execução delegada ao Codex, seção 2 do registro de validação) |
| Checks remotos | PR #30 no commit `3db6962`: Validate governance, os dois jobs de CI (inclusive `supabase test db`) e os dois da Vercel verdes; merge aprovado ("aprovo o merge da PR #30") e feito por squash |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

- **Escolhas K novas:** K8 a K13 surgiram ao especificar regras que o plano não detalhava (período antes do início da carteira, empate na taxa de acerto, negativos no arredondamento, parser, trânsito no fechamento e datas futuras). Seguiram o caminho previsto no plano: alternativas com exemplos e decisão do responsável antes de qualquer valor esperado.
- **Primeiro mês `N/D` com K7:** com o início no mês do evento mais antigo, o primeiro mês tem Vi = 0, e o Dietz seria calculável pela regra de K5. O critério de aceite do item C ("primeiro mês dá `N/D`") prevalece; a KB o registra como regra da seção 7.
- **Desativação de ativo:** o plano prevê "desativação lógica" sem precondição. A KB exige saldo calculado zero e nenhum evento posterior, para que nenhum patrimônio saia da carteira (P10, D3). Não é escolha de cálculo, mas está sinalizado na PR para revisão.
- **`Intl` do `DESIGN.md` 6.3:** o `DESIGN.md` indica `Intl.NumberFormat` para percentuais. No Node.js 24, ele coincide com a regra de P4 e K10 nos algarismos do CR-38, mas usa hífen e mantém o sinal em −0,00. A KB declara que a regra vale pelo resultado; o `DESIGN.md` não foi alterado.
- **Rastreabilidade da origem:** as referências de linha da KB vêm da leitura registrada na ideação; a origem não foi relida nesta entrega.

## Encerramento

Não se aplica.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando autorização de implementação — ciclo 003 (completo)
Quem: Responsável
Conferir: Issue #27 (schema da carteira, lançamentos e fechamento) e o item B do plano
Diga: "autorizo a implementação da issue #27"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 003 + implementar_issue + 26/A + 3245a4d`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: antes, plano `Aprovado` e ciclo `Planejamento` em `main` @ `3245a4d`, issues #26 a #29 abertas e nenhuma branch da issue #26; depois, PR #30 aprovada pelo responsável e integrada por squash em `d8fcae4`, com os checks verdes; issue #26 fechada. Reconciliada na PR da issue #27, cuja implementação foi autorizada em 2026-10-14, como prevê a regra 5 da retomada.
- `result`: `executed`
- `evidence`: tabela "Evidências" desta task.
- `blockers`: nenhum.
