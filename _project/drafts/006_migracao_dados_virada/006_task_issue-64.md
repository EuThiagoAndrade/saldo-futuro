# Task — Issue #64: Gravar a migração pela sessão do responsável, com retomada

> **Ciclo:** `006`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `feature`
> **Issue:** `#64`
> **Plano:** `_project/drafts/006_migracao_dados_virada/006_plan.md`
> **Branch:** `feature/issue-64`
> **PR:** [#68](https://github.com/EuThiagoAndrade/saldo-futuro/pull/68)
> **Integração:** `Integrada em 2026-10-18 por squash, commit `114da00e250ae73ef79ad8a9f46e4e73b4c8af99``
> **Autorização inicial:** "A próxima etapa é a issue #64. implemente a issue #64" em 2026-10-18
> **Modo contínuo:** `—`
> **Início:** 2026-10-18
> **Última atualização:** 2026-10-18
> **handoff_schema_version:** `2`

## Objetivo

Entregar os modos `gravar` e `conferir` sobre o plano de operações da issue A (#63), conforme o "Mecanismo de execução" do plano: escrita só pelas funções autenticadas existentes, com a sessão do responsável, segura contra gravação parcial ou duplicada, e conferência somente leitura do destino contra a origem, mês a mês. Nada é executado contra produção nesta issue.

## Escopo autorizado

- `gravar`: destino vazio na primeira execução, salvo retomada comprovada; trava de gravador único (`wx`) em `local/`; diário por operação (intenção antes, resultado com UUID depois); resposta perdida vira operação `desconhecida` e a carga para, sem reenvio; retomada que reconhece o efeito completo exatamente uma vez.
- Só `criar_ativo`, `lancar_evento`, `estornar_evento`, `transferir`, `fechar_mes` e `desativar_ativo`, pela chave publicável e a sessão do responsável (arquivo em `local/` ou variáveis de ambiente fora do Git).
- Comparação por efeitos completos (ativos com estado, multiconjunto de eventos com o evento estornado, transferências como unidade, meses fechados com posições) e leitura completa pelo contrato de `src/lib/leitura.ts`.
- `conferir`: relê o destino inteiro e compara com o plano e com o relatório da simulação (consolidado, posições, patrimônio com o trânsito, rentabilidade e acumulado pela aplicação, meses N/D).
- Fora: chave secreta, `corrigir_transferencia`, reenvio automático, mudança de schema, execução contra produção.

## Elegibilidade da trilha curta

Não se aplica; esta é a issue B do ciclo completo 006.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim | Nenhuma regra nova: a gravação aplica o plano da simulação (M1 a M10) e o destino reconfere a identidade em cada `fechar_mes`. A conferência exige diferença zero por mês em consolidado, posições, patrimônio, rentabilidade e acumulado; a propriedade "simular = gravar + conferir" é provada na carteira fictícia. |
| G2 — isolamento por RLS | Sim | Só funções `security definer` que filtram por `auth.uid()`, com a chave publicável; o CLI recusa chave secreta ou JWT de outro papel. Teste A/B no Supabase local: a gravação de A não altera B, a leitura de A não vê B e o plano de B não grava com a sessão de A. |
| G3 — privacidade de dados | Sim | Origens SQLite fictícias em diretório temporário; diário, trava e sessão só em `local/`. O diário guarda só sequência, chave do plano e UUID; a saída do CLI mostra só contagens e motivos. Nenhum SQLite real foi aberto. |
| G4 — migrações só acrescentam | Não | Nenhuma migração ou mudança de schema: as funções existentes bastaram. |

## Execução

- [x] Estado do destino e comparação por efeitos completos (`src/lib/migracao/destino.ts`).
- [x] Diário JSONL com sincronização por linha e trava exclusiva (`src/lib/migracao/diario.ts`).
- [x] `gravar`, `gravarNoDiretorio` e `conferir` (`src/lib/migracao/gravar.ts`).
- [x] Modos `gravar` e `conferir` no ponto de entrada, num módulo carregado só por eles (`scripts/migracao-gravacao.mjs`); `simular` continua sem importar o cliente do Supabase.
- [x] Testes unitários (Vitest) e de integração no Supabase local (`tests/e2e/migracao.spec.ts`).
- [x] Gates locais e evidências.
- [x] Revisar diff, staging e evidências G1–G4; abrir a PR #68.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes unitários | `npm test`: 247 passaram (21 arquivos), inclusive 10 novos em `src/lib/migracao/gravar.test.ts`. |
| Integração (Supabase local) | `tests/e2e/migracao.spec.ts`: 18 passaram em 46 s — carteira completa com `conferir` sem diferença e consolidados iguais aos da simulação; reexecução sem escrita; leitura pela aplicação com N/D; resposta perdida depois do commit das seis funções; chamada ainda em execução durante a releitura (trava `pg_advisory_xact_lock` segurada); desconhecida sem efeito; estado divergente; escrita de fora detectada; destino não vazio; trava presente; isolamento A/B; CLI ponta a ponta; mais de 1.000 eventos com falha de página e mudança entre leituras. |
| E2E completo | `npm run build` passou; `npx playwright test` com o Supabase local: 98 passaram, 8 pulados (preexistentes). |
| Banco | `npx supabase test db`: 6 arquivos, 239 testes, PASS. |
| Lint e tipos | ESLint sem erros (três avisos preexistentes em `local/validacao-ciclo-003/conferir.mjs`); `npm run typecheck` passou. |
| `service_role` | Nenhuma ocorrência no código, testes e CLI da migração. |
| Validador | Harness: 39/39. `node scripts/validate-governance.mjs` conferido depois do bloco "Aguardando merge". |
| `git diff --check` | Passou. |
| Checks remotos | HEAD `35dcf23`: CI (app e Supabase local, 98 e2e com backend), Governance, Vercel e Vercel Preview Comments aprovados. |

## Revisão da correção

Não se aplica; issue normal do ciclo completo.

## Decisões incidentais e desvios

Para conferência do responsável na revisão da PR:

1. **Conferência antes das escritas.** A comparação por efeitos completos (leitura inteira do destino) roda no início, antes de cada `fechar_mes` e no fim. Antes das demais escritas, a marca da carteira (`marcaCarteira`: contagens de ativos, eventos e transferências, meses fechados e última desativação) precisa ser exatamente a esperada pelo prefixo. Como eventos e transferências só recebem inserções, qualquer escrita de fora muda a marca e para a carga (teste "escrita de fora"). Reler a carteira inteira antes de cada evento tornaria a carga quadrática em leituras. Se o responsável preferir a leitura completa antes de toda escrita, é uma troca local em `gravar`.
2. **Recusa certa do banco.** Erro com SQLSTATE das classes `P0`, `22`, `23` ou `42` prova que a transação foi desfeita: a operação fica `recusada` e a carga para. Numa nova execução, depois da comparação com o prefixo, ela pode ser enviada de novo, porque não houve efeito. Aborto por tempo, falha de rede, resposta de gateway e qualquer outro erro ficam `desconhecida`, sem reenvio.
3. **Última operação reconhecida na retomada** encerra com `already_executed_and_reconciled`, porque nada mais é gravado.
4. **Ponto de entrada.** `gravar` e `conferir` ficam em `scripts/migracao-gravacao.mjs`, importado só por esses modos, para que `simular` continue sem carregar o cliente do Supabase (critério da issue A). O CLI recusa chave secreta e JWT que não seja `anon`.
5. **Conferência independente do diário.** `conferir` associa os ativos pelo nome, que vem da descrição única da origem, e recalcula rentabilidade e acumulado com `retornosDaCarteira` e `acumulado`, as mesmas funções das telas.
6. **Diário.** Só sequência, chave do plano e UUID; nenhuma quantia ou nome. Uma última linha incompleta recusa a leitura do diário.

## Encerramento

Não se aplica; esta não é a última issue do ciclo.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando autorização de implementação — ciclo 006 (completo)
Quem: Responsável
Conferir: [issue #65](https://github.com/EuThiagoAndrade/saldo-futuro/issues/65) e seu escopo
Diga: "autorizo a implementação da issue #65"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 006 + implementar_issue + 64/B + base ce84e66466876c93dafd8fc852fbfd8f39ff2edf`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: issue #64 `OPEN`, sem branch nem task; task da #63 `Aguardando integração` / branch `feature/issue-64`, task `Aguardando integração`, PR #68 `OPEN` contra `main`; task da #63 reconciliada como `Concluída`
- `result`: `executed`
- `evidence`: autorização do responsável em 2026-10-18; gates locais na tabela de evidências; PR #68 aberta via `gh`, com `Closes #64`
- `blockers`: checks remotos do HEAD atualizado e "aprovo o merge da PR #68" depois de todos verdes
