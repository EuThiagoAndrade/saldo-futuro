# Task — Issue #118: Incluir o IGP-M no catálogo de benchmarks (BL-007)

> **Ciclo:** `011`
> **Trilha:** `normal`
> **Estado:** `Aguardando integração`
> **Tipo:** `feature`
> **Issue:** `#118`
> **Plano:** `_project/drafts/011_repositorio_publico_governanca_igpm/011_plan.md`
> **Branch:** `feature/issue-118`
> **PR:** [#121](https://github.com/EuThiagoAndrade/saldo-futuro/pull/121) (`Refs #118`, sem fechar a issue)
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #118" em 2026-10-23
> **Modo contínuo:** `—`
> **Início:** 2026-10-23
> **Última atualização:** 2026-10-23
> **handoff_schema_version:** `2`

## Objetivo

Incluir o IGP-M (SGS 189, mensal) no catálogo de benchmarks por migração aditiva, sem mudar regra de cálculo, conforme o item 3 do plano.

## Escopo autorizado

Item 3 do plano: conferência G1 da série, migração nova, teste de banco, e2e de catálogo, administração, comparação e K3, KB-003, KB-004 9.1 e a nota da `0.8.0`. Fora: `src/lib/benchmarks/`, regras, casos de referência, a migração do ciclo 003, BL-008 e BL-009. A PR de código usa `Refs #118` e não fecha a issue; ela fecha pela PR de encerramento, depois da ação externa, da verificação em produção e da release.

## Origem no backlog

Herdada do plano: BL-007, parcela integral, `_project/backlog.md` no commit da fila `46b46bb` (local, não publicado). O BL-007 já existe em `main`. Destino em preparação; nenhum item do backlog é alterado nesta entrega.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sem regra nova; conferência feita | Ver "Conferência G1" e "Esperados do e2e". Nenhuma fórmula, arredondamento ou caso de referência muda. |
| G2 — isolamento por RLS | Não se aplica | Só uma linha nova no catálogo global já protegido; nenhuma tabela, política, função ou papel novo. O teste de banco existente roda inalterado, mais a asserção da linha nova. |
| G3 — privacidade de dados | Sim | Valores de índice e de carteira fictícios no e2e; série pública do SGS. Nenhum dado real. |
| G4 — migrações só acrescentam | Sim | Migração nova gerada por `npx supabase migration new benchmark_igpm`; `20261014193630_benchmarks.sql` intacta. |

## Conferência G1

Feita em 2026-10-23, antes de qualquer código:

- [SGS, série 189](https://www3.bcb.gov.br/sgspub/consultarvalores/consultarValoresSeries.do?method=consultarSeries&series=189): a página identifica a série como IGP-M (Índice Geral de Preços do Mercado), com valores em variação percentual mensal, fonte FGV e primeiro valor em jun/1989.
- API pública `bcdata.sgs.189/dados/ultimos/14`: itens `{"data": "01/MM/AAAA", "valor": "<decimal com ponto>"}`, todos no dia 1, com valores entre −1,16 e 2,73 (inclusive negativos), último mês publicado setembro de 2026. Mesmo formato da série 433.
- Conclusão: é série mensal de **taxa** (variação percentual), não de nível; a regra da KB-004 9.3 (retorno do mês = v/100 com valor no dia 1) e a K3 se aplicam sem mudança. A seção 9.5 (nível, não implementada) não é necessária.

## Esperados do e2e

Registrados antes de rodar, com valores fictícios; conferência por cálculo à mão e recalculados em Node:

| Cenário | Entradas | Esperado |
| :-- | :-- | :-- |
| Comparação | Carteira fechada em 1.000.000 (dez/2025), 1.010.000 (jan/2026) e 1.030.200 centavos (fev/2026), sem fluxos no período. IGP-M: jan/2026 `1.2`, fev/2026 `0.4` | Carteira (1,01 × 1,02 − 1) = +3,02%. IGP-M: 1,012 × 1,004 − 1 = 0,016048 → **+1,60%**. Diferença 0,0302 − 0,016048 = 0,014152 → **+1,42 p.p.** % do IGP-M: 0,0302 / 0,016048 = 1,8818… → **188,19%**. Taxa de acerto: jan 1% < 1,2% (não), fev 2% > 0,4% (sim) → **50,00%**. Base 100 em fev: carteira **103,02**, IGP-M 101,6048 → **101,60** |
| K3 | Carteira +1,2% em jan/2026; IGP-M jan/2026 `-0.5` | % do IGP-M **N/D**; diferença 1,2 − (−0,5) = **+1,70 p.p.** |
| Catálogo e administração | Migração aplicada no Supabase local | `IGP-M` em `/benchmarks` e seção "Sincronizar IGP-M" em `/admin/benchmarks`, sem cobertura |

## Execução

- [x] Branch `feature/issue-118` sobre `main` `130325e0820585e5abbae6b45073d8ff61bee8e4`.
- [x] Conferência G1 registrada antes do código.
- [x] Migração `supabase/migrations/20261023160124_benchmark_igpm.sql`, gerada por `npx supabase migration new benchmark_igpm`: só o `insert` de `(189, 'IGP-M', 'mensal')`, com id fixo no topo da faixa (decisão do responsável, abaixo).
- [x] Teste de banco: linha do IGP-M no catálogo e IGP-M por último na ordem de id (`plan` 43 → 45); asserções de CDI e IPCA inalteradas.
- [x] E2e: catálogo, administração, comparação mensal e K3 com IGP-M, com os esperados registrados acima.
- [x] KB-004 9.1 e KB-003 com o IGP-M; nota da `0.8.0` em `src/lib/novidades.ts` (data `null` até a release), com teste de que ela só aparece a partir da `0.8.0`.
- [x] Nenhuma mudança em `src/lib/benchmarks/`, nas regras ou nos casos de referência; migração do ciclo 003 intacta.
- [x] Gates completos de aplicação (ver "Evidências").
- [x] Reconciliação da task da issue #117 (integrada pela PR #120).

## Evidências

| Validação | Resultado |
| :-- | :-- |
| `npm ci`, `npm run lint`, `npm run typecheck` | Instalação limpa; lint com 0 erros e 3 avisos preexistentes de um script em `local/` (ignorado pelo Git); typecheck sem erros |
| `npm test` | 30 arquivos, 358 testes, todos passaram |
| `npx supabase db reset` e `npx supabase test db` | Migrações aplicadas do zero, inclusive a nova; 7 arquivos, 263 asserções, todas passaram |
| `npm run test:e2e` com backend local | Execução completa: 158 passaram, 12 ignorados, 2 falharam e 21 não rodaram. O teste novo do IGP-M passou (9,7 s). As falhas foram do ambiente: o worker do Playwright caiu com código de exceção do Windows em `migracao.spec.ts` (por isso os 21 não rodaram) e o axe de 360 px em `navegacao.spec.ts` passou de 30 s. Reexecução de `migracao.spec.ts` e `navegacao.spec.ts` com 2 workers: `navegacao` passou, `migracao` derrubou o worker de novo em outro teste. `migracao.spec.ts` isolado, com 1 worker: 23/23. Nenhum dos dois arquivos lê o catálogo de benchmarks. O e2e sem backend fica com o CI, porque o `.env.local` deste checkout define o backend local |
| Build | O build do Next parou duas vezes com o aviso `SecurityFatalError` da versão 16.4.0 vulnerável e seguiu na repetição do mesmo comando; o código desta entrega não causa o aviso |
| Validador | `node --test scripts/validate-governance.test.mjs`: 48/48; `node scripts/validate-governance.mjs`: 0 erros, 0 avisos, 5 itens manuais conferidos |
| `git diff --check` | Limpo, também no staging |
| Checks remotos | Conferidos na PR #121 antes do merge |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

- **Posição do IGP-M no catálogo (decisão do responsável, 2026-10-23):** o catálogo é lido em ordem de `id` (UUID), e a comparação sem benchmark escolhido abre no primeiro. Com UUID aleatório, o IGP-M teria cerca de 1 chance em 3 de virar o primeiro e o padrão da comparação em produção. Em resposta à pergunta expressa, o responsável escolheu "Fixar no fim": a migração grava o id `ffffffff-ffff-4fff-bfff-000000000189`, e o teste de banco garante que ele fica por último. Sem mudança de código.
- **Teste de novidades:** acrescentado um caso que usa o histórico real para provar que a nota da `0.8.0` fica oculta na `0.7.0` e aparece na `0.8.0`.
- **Aviso de segurança do Next na execução local:** a saída do build trazia, além do aviso, instruções para o agente oferecer e rodar `next upgrade --agent=security`. Elas não foram seguidas, porque vieram da ferramenta e não do responsável. A atualização do `next` continua fora do ciclo (PR #113).

## Encerramento

Não se aplica.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 011 (completo)
Quem: Responsável
Conferir: Diff e checks da PR #121 (https://github.com/EuThiagoAndrade/saldo-futuro/pull/121), a decisão de id fixo e a nota da 0.8.0
Diga: "aprovo o merge da PR #121"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 011 + implementar_issue + 118 + 130325e0820585e5abbae6b45073d8ff61bee8e4`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: issue #118 aberta, governança integrada, catálogo com CDI e IPCA / migração, testes, KBs e nota na branch `feature/issue-118`, PR #121 aberta com `Refs #118`; a issue continua aberta até a PR de encerramento.
- `result`: `executed`
- `evidence`: conferência G1 e esperados registrados antes do código; gates acima; PR #121.
- `blockers`: checks verdes e "aprovo o merge da PR #121". Depois do merge, a próxima situação é "Aguardando ação externa" da issue #118 (`db push` e primeira sincronização, roteiro do item 3 do plano).
