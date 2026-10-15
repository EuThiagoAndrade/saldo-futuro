# Task — Issue #39: tela de fechamento mensal

> **Ciclo:** `004`
> **Trilha:** `normal`
> **Estado:** `Aguardando integração`
> **Tipo:** `feature`
> **Issue:** `#39`
> **Plano:** `_project/drafts/004_telas_produto/004_plan.md`
> **Branch:** `feature/issue-39`
> **PR:** [#46](https://github.com/EuThiagoAndrade/saldo-futuro/pull/46)
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #39" em 2026-10-14
> **Modo contínuo:** `—`
> **Início:** 2026-10-14
> **Última atualização:** 2026-10-14
> **handoff_schema_version:** `2`

Instanciada a partir de `.agent/templates/task.md`. Ponto de aprovação "Autorizar implementação" da issue C concedido pelo responsável em 2026-10-14, depois da integração da issue B (PR #45, `401fa49`).

## Objetivo

Entregar o item C do plano: o fechamento mensal em três etapas da KB-004, seção 5, pela tela. A prévia (pendências e ajustes) é calculada no TypeScript, e a gravação é da função `fechar_mes`, que confere tudo de novo. Inclui a reabertura do último mês fechado e o aviso no Início quando houver mês terminado ainda aberto.

## Escopo autorizado

- Página `/lancamentos/fechamento/[mes]`, com pendências, saldo real por ativo, revisão dos ajustes e da identidade, e o botão de fechar; reabertura do último mês fechado com confirmação.
- Server Actions de revisão, fechamento e reabertura (D3), com a leitura coerente de D13 para a prévia.
- Composição pura em `src/lib/telas/fechamento.ts`, com testes contra CR-12, CR-13, CR-15 e CR-18.
- Atalho para o fechamento em `/lancamentos` e o aviso no Início.
- Testes ponta a ponta dos cenários CR-12, CR-13, CR-15 e CR-16 e do mês terminado com datas relativas.
- Esta task e a rastreabilidade do plano.

Fora do escopo: rentabilidade, períodos e gráficos do Início (issue #40); migração, função de banco ou dependência nova.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim | Prévia pela função de `src/lib/financeiro/fechamento.ts`, sem conta nova; insumos lidos como composição coerente (D13); `fecharMes` converte os saldos com `paraNumero` (faixa); CR-12 e CR-13 pela composição no Vitest e pela tela; consolidado do CR-12 conferido no banco (Vi 15.000,00, Vf 14.950,00, rendimento +50,00, marcação −200,00) e de novo depois da reabertura (CR-16); CR-15 e CR-18 na situação do mês (CR-18 literal no Vitest, com a data injetada) |
| G2 — isolamento por RLS | Sim | Sem tabela, política ou função nova; leitura e escrita com a sessão do usuário; sessão conferida em cada página e ação; `fechar_mes` e `reabrir_mes` continuam conferindo o usuário no banco; cenários com usuários exclusivos |
| G3 — privacidade de dados | Sim | Testes e capturas só com dados fictícios; com "Ocultar valores", nenhuma quantia nas três etapas, e o saldo digitado continua visível (P20) |
| G4 — migrações só acrescentam | Não | Nenhuma migração criada ou alterada |

## Execução

- [x] Task da issue #38 reconciliada (`Concluída`, integrada em `401fa49`).
- [x] `src/lib/telas/fechamento.ts`: último mês fechado, mês mais antigo, próximo mês a fechar, mês terminado aberto, situação do mês (pela `conferirFechamento`), saldos iniciais, entrada da prévia e linhas da tela com o mesmo critério de `previaFechamento`. `fechamento.test.ts` (8 testes) com CR-12, CR-13, CR-15 e CR-18.
- [x] Mensagens das recusas do fechamento (`pendencia`, `identidade`, `sequencia`, `inicio`, `mes_nao_terminado`, `reabertura`).
- [x] `lerInsumosDoFechamento`: ativos, eventos, posições e meses fechados como uma composição coerente (D13).
- [x] Ações `revisarFechamento` (prévia no servidor, pendência com os nomes dos ativos), `fecharMes` (só `fechar_mes`, saldos pela faixa) e `reabrirMes`.
- [x] `/lancamentos/fechamento/[mes]`: aberto e fechável (três etapas, sem limpar os saldos digitados), aberto e recusado (motivo e atalho para o próximo mês), fechado (posições, ajustes e patrimônio) com reabertura só do último mês, com confirmação.
- [x] Atalho "Fechamento de <mês>" em `/lancamentos` e aviso no Início quando o próximo mês a fechar já terminou.
- [x] `tests/e2e/fechamento.spec.ts` (5 testes): CR-12 com CR-16, CR-13, CR-15, mês terminado com datas relativas (aviso, mês anterior aceito, mês corrente recusado) e ocultação e axe nas três etapas, em 360 px e 1280 px.
- [x] Conferência visual em 360 px com dados fictícios; captura fora do repositório.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes unitários | `npm test`: 15 arquivos, 176 testes passaram |
| Ponta a ponta com o Supabase local | `npx playwright test`: 53 passaram, 4 pulados (preview), em duas execuções seguidas |
| Ponta a ponta sem backend | 12 passaram, 45 pulados |
| Tipos e lint | `npm run typecheck` sem erro; `npm run lint` sem erro (3 avisos só em `local/`) |
| Build | `npm run build` com e sem backend |
| Testes da governança | `node --test scripts/validate-governance.test.mjs`: 39 passaram |
| Validador | 0 erros, 0 avisos |
| `git diff --check` | Passou |
| Checks remotos | Pendente |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

- **Três etapas na mesma página:** a revisão é calculada no servidor e mostrada abaixo dos saldos, que não são limpos depois do envio (o formulário envia por transição, sem o reset automático do React). O botão de fechar envia os saldos revisados; a função do banco recalcula e confere tudo.
- **Campo de saldo real sem `required`:** o campo vazio é pendência (P7), e quem a recusa é a regra, com a lista dos ativos pendentes. Assim o CR-13 é provado pela recusa da prévia, não pelo navegador.
- **Patrimônio do mês fechado:** a tela de um mês fechado mostra o `vf` gravado no consolidado, sem recalcular.
- **Queda do servidor numa execução local:** uma execução da suíte começou logo depois de outra e reaproveitou, pelo `reuseExistingServer` do ambiente local, o servidor que ainda estava sendo encerrado; todos os testes que dependiam dele falharam com conexão recusada. As duas execuções seguintes passaram inteiras. O CI sempre sobe um servidor novo.

## Encerramento

Não se aplica.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 004 (completo)
Quem: Responsável
Conferir: [PR #46](https://github.com/EuThiagoAndrade/saldo-futuro/pull/46): checks, diff e as decisões incidentais desta task
Diga: "aprovo o merge da PR #46"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 004 + implementar_issue + 39 + 401fa49`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: antes, issue #39 aberta, sem branch nem task; depois, branch `feature/issue-39` publicada, PR #46 aberta e esta task `Aguardando integração`.
- `result`: `executed`
- `evidence`: autorização de 2026-10-14; base `main` @ `401fa49`; a tabela "Evidências" acima.
- `blockers`: aprovação do merge e checks remotos.
