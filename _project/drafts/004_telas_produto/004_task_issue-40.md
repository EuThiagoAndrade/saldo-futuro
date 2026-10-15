# Task — Issue #40: Início com rentabilidade, períodos e gráficos

> **Ciclo:** `004`
> **Trilha:** `normal`
> **Estado:** `Aguardando integração`
> **Tipo:** `feature`
> **Issue:** `#40`
> **Plano:** `_project/drafts/004_telas_produto/004_plan.md`
> **Branch:** `feature/issue-40`
> **PR:** [#47](https://github.com/EuThiagoAndrade/saldo-futuro/pull/47)
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #40" em 2026-10-14
> **Modo contínuo:** `—`
> **Início:** 2026-10-14
> **Última atualização:** 2026-10-14
> **handoff_schema_version:** `2`

Instanciada a partir de `.agent/templates/task.md`. Ponto de aprovação "Autorizar implementação" da issue D concedido pelo responsável em 2026-10-14, depois da integração da issue C (PR #46, `7420ae5`).

## Objetivo

Entregar o item D do plano: o Início com o patrimônio do último mês fechado, os aportes líquidos do mês aberto, a variação, a rentabilidade por período, a base 100, o drawdown, a distribuição por ativo e os gráficos em SVG próprio (ADR-005). As decisões P17 a P19 entram na KB-004 (seção 15) com os casos CR-51 e CR-52, recalculados de forma independente e conferidos pelo responsável antes do merge.

## Escopo autorizado

- KB-004: seção 15 e casos CR-51 e CR-52, no texto e no JSON; registro `004_validation_casos_inicio.md`.
- Composição pura em `src/lib/telas/inicio.ts`, com testes contra CR-17, CR-20, CR-24, CR-32 a CR-37, CR-51 e CR-52.
- Componentes de gráfico em SVG (`src/components/graficos/`).
- Página `/` com períodos, sugestão de K1, gráficos e a leitura coerente de D13.
- Testes ponta a ponta dos cenários de leitura e do volume, e a medição de desempenho de D9.
- Esta task e a rastreabilidade do plano.

Fora do escopo: comparação com benchmarks (issue #41); migração, função de banco ou dependência nova.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim | P17 a P19 na KB-004 (seção 15) com CR-51 e CR-52, calculados à mão e recalculados por outro modelo sem ver os esperados (17 de 17 iguais; `004_validation_casos_inicio.md`); conferência do responsável pendente antes do merge. Composição pura testada contra CR-17, CR-20, CR-24, CR-32 a CR-37, CR-51 e CR-52; os cenários reproduzem os casos pelas funções do banco e a tela mostra os esperados; insumos lidos como composição coerente (D13), com o cenário "volume" (1.200 eventos no mês aberto); `N/D` é lacuna nos gráficos, nunca zero; nenhuma conta nova além de P17 a P19 |
| G2 — isolamento por RLS | Sim | Sem tabela, política ou função nova; leitura só com a sessão do usuário (a RLS restringe às próprias linhas); sessão conferida na página; cenários com usuários exclusivos |
| G3 — privacidade de dados | Sim | Testes e capturas só com dados fictícios; com "Ocultar valores", nenhuma quantia nos cartões, nos eixos e nas tabelas dos gráficos; percentuais continuam visíveis (D8) |
| G4 — migrações só acrescentam | Não | Nenhuma migração criada ou alterada |

## Execução

- [x] Task da issue #39 reconciliada (`Concluída`, integrada em `7420ae5`).
- [x] KB-004: seção 15 (mês de referência, períodos, sugestão de K1, patrimônio e aportes líquidos) e casos CR-51 e CR-52, no texto e no JSON; concordância KB × JSON passando; o JSON só ganhou linhas.
- [x] Recálculo cego por outro modelo (Claude Sonnet, sem acesso ao repositório): 17 de 17 valores iguais, registrado em `004_validation_casos_inicio.md`.
- [x] `src/lib/telas/inicio.ts`: M, início, limites dos períodos, sugestão de K1, aportes líquidos, retornos dos meses fechados pelo Dietz, resultado do período (acumulado, drawdown, base 100) e variação de M. `inicio.test.ts` (13 testes).
- [x] `lerInsumosDoInicio`: ativos, eventos, consolidados e posições como composição coerente (D13).
- [x] Gráficos SVG (`src/components/graficos/`): linha com lacunas e rótulo direto, barras de ganho e perda e barras horizontais da distribuição, cada um com título, descrição e tabela "Ver os números"; rótulos de eixo em dinheiro abreviado (6.2) e ocultos com "Ocultar valores".
- [x] Página `/`: aviso de mês terminado; sem fechamento, estado vazio e aportes líquidos desde o início; com M, patrimônio com a data, aportes líquidos, rentabilidade e variação de M, seletor dos cinco períodos (intervalo até M, recusa do que passa de M), rentabilidade e drawdown do período, sugestão rotulada de K1 e os quatro gráficos.
- [x] `tests/e2e/inicio.spec.ts` (10 testes): CR-17, CR-20, CR-24, CR-32, CR-33 com CR-35, CR-36 com CR-37, CR-51, CR-52, volume, ocultação e axe em 360 px e 1280 px.
- [x] `tests/e2e/desempenho.spec.ts` (D9, opcional com `MEDIR_DESEMPENHO=1`): 30 ativos e 60 meses fechados; mediana de 175 ms no servidor local (167 a 187 ms), abaixo do limite de 1 s.
- [x] Conferência visual em 360 px e 1280 px com dados fictícios; capturas fora do repositório.
- [ ] Conferência do responsável dos valores do CR-51 e do CR-52, antes do merge.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes unitários | `npm test`: 16 arquivos, 191 testes passaram (com a concordância KB × JSON) |
| Ponta a ponta com o Supabase local | `npx playwright test`: 63 passaram, 5 pulados (preview e a medição opcional); depois do ajuste visual dos gráficos, `inicio` e `navegacao` de novo: 22 passaram |
| Ponta a ponta sem backend | 12 passaram, 56 pulados |
| Desempenho (D9) | Mediana de 175 ms, abaixo de 1 s |
| Recálculo independente | 17 de 17 iguais |
| Tipos e lint | `npm run typecheck` sem erro; `npm run lint` sem erro (3 avisos só em `local/`) |
| Build | `npm run build` com e sem backend |
| Testes da governança | `node --test scripts/validate-governance.test.mjs`: 39 passaram |
| Validador | 0 erros, 0 avisos |
| `git diff --check` | Passou |
| Checks remotos | Pendente |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

- **Cenários por retornos:** os casos definidos por retornos mensais (CR-32 a CR-37, CR-51) são montados por fechamentos com Vi redondo e sem fluxos, de modo que Vf = Vi × (1 + r) é exato em centavos; o passo recusa o cenário se não for. O mês `N/D` é um mês com migração histórica (P15), que também leva o patrimônio a um valor redondo para os retornos seguintes continuarem exatos.
- **Distribuição sem percentual:** a distribuição por ativo mostra o saldo de cada ativo em M e barras proporcionais; nenhum percentual de participação é apresentado, porque a KB-004 não especifica essa conta.
- **Período padrão:** o Início abre no período "Ano" (P7 lista os cinco períodos sem fixar o padrão).
- **Medição de desempenho opcional:** a medição de D9 roda com `MEDIR_DESEMPENHO=1`, para uma medida de tempo não tornar o CI instável; o resultado está nas evidências.
- **Escala dos gráficos:** a primeira conferência visual mostrou o texto dos eixos ilegível no celular; a largura lógica do SVG foi reduzida (360 unidades) e a margem esquerda aumentada para os rótulos em reais.

## Encerramento

Não se aplica.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 004 (completo)
Quem: Responsável
Conferir: [PR #47](https://github.com/EuThiagoAndrade/saldo-futuro/pull/47): checks, diff e a conferência dos valores do CR-51 e do CR-52 (`004_validation_casos_inicio.md`), que precede o merge
Diga: "aprovo o merge da PR #47"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 004 + implementar_issue + 40 + 7420ae5`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: antes, issue #40 aberta, sem branch nem task; depois, branch `feature/issue-40` publicada, PR #47 aberta e esta task `Aguardando integração`.
- `result`: `executed`
- `evidence`: autorização de 2026-10-14; base `main` @ `7420ae5`; a tabela "Evidências" acima e `004_validation_casos_inicio.md`.
- `blockers`: conferência do responsável dos valores do CR-51 e do CR-52, checks remotos e aprovação do merge.
