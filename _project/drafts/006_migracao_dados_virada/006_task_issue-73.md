# Task — Issue #73: Migrar o trânsito sem contrapartida como migração no trânsito

> **Ciclo:** `006`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `feature`
> **Issue:** `#73`
> **Plano:** `_project/drafts/006_migracao_dados_virada/006_plan.md` (`v4`, item 4 — D)
> **Branch:** `feature/issue-73`
> **PR:** [#74](https://github.com/EuThiagoAndrade/saldo-futuro/pull/74)
> **Integração:** `Integrada` (PR #74, squash em 2026-10-18; issue #73 fechada pelo merge)
> **Autorização inicial:** "autorizo a implementação da issue #73" em 2026-10-18
> **Modo contínuo:** `—`
> **Início:** 2026-10-18
> **Última atualização:** 2026-10-18
> **handoff_schema_version:** `2`

## Objetivo

Permitir que a migração represente a variação do trânsito sem contrapartida como `migracao` no próprio ativo "Em trânsito", conforme M6 revisado e a exceção à K12 da `v4`, sem inventar aporte, resgate, ativo ou contrapartida.

## Escopo autorizado

O payload da issue #73 (Unidade D de `006_handoff_issues.md`), com as ressalvas R4-1 e R4-2 da rodada 4:

- migração aditiva com `public.lancar_migracao_transito` e testes de banco, inclusive o ajuste de `03_funcoes.test.sql`;
- M6 revisado em `simular.ts`, com `M6_TRANSITO_PAR_AMBIGUO` e `M6_TRANSITO_SALDO_NEGATIVO`;
- operação nova, sonda antes da primeira escrita e versão nova do plano de operações em `gravar`/`conferir`;
- KB-004 (M6, 4.4, K12, `CR-M04` a `CR-M07`), JSON de casos e KB-002 (roteiro).

Fora: `lancar_evento`, `transferir`, `fechar_mes` e políticas; interface; simulação real, `db push` e `gravar`.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim | M6 revisado em `simular.ts`; `CR-M04` a `CR-M07` (exemplos A a D) na KB-004 e no JSON, com paridade verde; testes de unidade de saldo do trânsito por mês, componentes, identidade (Vf − Vi = componentes, Vf = patrimônio da origem), retorno, acumulado, par em outro mês, par ambíguo (contagens 1 e 2), saldo negativo e direção por `observacao`. Conferência independente às cegas (outro modelo, só regras e entradas): 59 de 59 valores iguais, sem divergência. |
| G2 — isolamento por RLS | Sim | `07_migracao_transito.test.sql` (22 asserções): sonda com valor zero, recusas de sinal, faixa, mês fechado, data futura e trânsito inexistente; B só altera o próprio trânsito; `anon` não executa; `lancar_evento` continua recusando o trânsito; fechamento com a migração no componente `migracao`. `03_funcoes.test.sql` com a assinatura nova nas listas fechadas e na conferência de `security definer` (R4-1). Nenhuma política nem tabela nova. |
| G3 — privacidade de dados | Sim | Só fixtures fictícias (nomes "Fictício", e-mails em example.com); nenhum dado real lido ou versionado nesta implementação. |
| G4 — migrações só acrescentam | Sim | Uma migração nova, `20261018210000_migracao_transito.sql`; nenhuma existente editada. |

## Execução

- [x] Migração SQL e testes de banco.
- [x] M6 revisado e testes de unidade (A a D, recusas novas).
- [x] `gravar`/`conferir`: operação nova, sonda, versão do plano (2) e testes.
- [x] KB-004, JSON de casos e KB-002.
- [x] Gates locais, PR.
- [x] Depois do merge: simulação local só com códigos e contagens (ver "Evidências").
- [ ] Ação externa (`db push` da migração da issue D): pendente, pelo responsável.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| `npx supabase test db` | 7 arquivos, 261 asserções, todas verdes (com a migração nova aplicada por `db reset` local). |
| `npm test` (Vitest) | 21 arquivos, 258 testes verdes, inclusive a paridade KB-004/JSON. |
| `npm run lint` / `npm run typecheck` | Sem erros; 3 avisos preexistentes num arquivo de `local/`, fora do Git. |
| Integração da migração (`tests/e2e/migracao.spec.ts`) | 21 testes verdes, inclusive os 3 novos: trânsito sem par e pares reais gravados e conferidos sem diferença; sonda com a função ausente, sem escrita nem diário; resposta perdida depois de `lancar_migracao_transito`, reconhecida uma vez. |
| `npm run test:e2e` completo | 98 verdes e 9 ignorados (sem `CRON_SECRET` e afins); 2 testes interrompidos por queda do processo do Node no Windows (código 0xC0000409), sem falha de asserção, num de cenários e no de 1.000 eventos. Uma reexecução teve a mesma queda num processo do CLI; duas reexecuções seguintes de `migracao.spec.ts` e `cenarios.spec.ts` passaram inteiras (26 de 26 cada). Tratado como instabilidade do ambiente local; o CI em Linux confere |
| Validador | `node --test scripts/validate-governance.test.mjs` 39/39; `node scripts/validate-governance.mjs` 0 erros, 0 avisos, 4 itens manuais |
| `git diff --check` | Limpo |
| Checks remotos | Os cinco checks verdes no HEAD aprovado da PR #74 antes do merge. |
| Simulação local pós-merge (2026-10-18, pelo agente, com autorização) | M6 não recusa mais. Recusa `M10_COBERTURA_OU_CONSISTENCIA`, quantidade 12, todas "posição ausente para ativo com histórico" (11 ativos, 6 meses). Consulta somente leitura autorizada, só contagens: nas 12, posição anterior com saldo zero e nenhum evento no mês; 9 ativos desativados e 3 ativos na origem. Leva à `v5` do plano. |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

1. **Ordem das recusas de M6.** Par ambíguo é conferido antes do saldo negativo, como na precedência da `v4`. A cobertura de M10 passou a ser calculada antes, só para saber o último mês fechado; suas recusas continuam reportadas depois de M7, como antes.
2. **Contagens no resumo.** `transitoComoTransferencia` e `transitoComoMigracao` entraram no resumo da simulação, que mostra só contagens, para o responsável conferir M6 sem abrir o relatório.
3. **Teste da resposta perdida.** O apoio de integração ganhou `pular`, para a falha injetada atingir a chamada real e não a sonda; sem isso, a sonda corretamente parava a carga com `funcao_ausente`.

## Encerramento

Não se aplica.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 006 (completo)
Quem: Responsável
Conferir: [PR #77](https://github.com/EuThiagoAndrade/saldo-futuro/pull/77), checks remotos, diff e barreiras G1 a G4
Diga: "aprovo o merge da PR #77"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 006 + implementar_issue + 73/D + base 114da383c101211136a77b04b14b0823dc9e8adf`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: issue #73 `OPEN`, sem branch nem task / branch `feature/issue-73`, task `Aguardando integração`, PR #74 aberta contra `main`; plano `Em Execução`
- `result`: `executed`
- `evidence`: autorização do responsável em 2026-10-18; gates locais e conferência independente registrados em "Evidências" e G1
- `blockers`: PR #74 integrada; restam o `db push` (ação externa desta issue) e a `v5` do plano, por causa da recusa de M10 na simulação
