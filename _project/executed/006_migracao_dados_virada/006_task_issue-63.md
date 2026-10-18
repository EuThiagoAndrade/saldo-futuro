# Task — Issue #63: Simular a migração da origem sem gravar

> **Ciclo:** `006`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `feature`
> **Issue:** `#63`
> **Plano:** `_project/executed/006_migracao_dados_virada/006_plan.md`
> **Branch:** `feature/issue-63`
> **PR:** [#66](https://github.com/EuThiagoAndrade/saldo-futuro/pull/66)
> **Integração:** `Integrada em 2026-10-18 por squash, commit `ce84e66466876c93dafd8fc852fbfd8f39ff2edf``
> **Autorização inicial:** "Autorizo a implementação da issue #63 (simulação da migração)" em 2026-10-17
> **Modo contínuo:** `—`
> **Início:** 2026-10-17
> **Última atualização:** 2026-10-18
> **handoff_schema_version:** `2`

## Objetivo

Entregar a simulação local e somente leitura da migração aprovada no ciclo 006. O relatório detalhado fica em `local/`; a saída compartilhável contém apenas contagens. A simulação não acessa nem grava no Supabase.

## Escopo autorizado

- Ler a origem SQLite em modo `readOnly`, aplicar M1 a M10 e recusar a simulação inteira nas condições previstas no plano.
- Reproduzir os meses em memória com `src/lib/financeiro` e gerar um plano de operações ordenado e determinístico, com hashes da origem, do plano e do usuário de destino.
- Adicionar o modo local `simular`, casos fictícios CR-M* à KB-004 e ao JSON de referência, e conferência independente dos valores esperados.
- Manter o SQLite e o relatório detalhado somente em `local/`; não ler o SQLite real nesta implementação.

## Elegibilidade da trilha curta

Não se aplica; esta é a issue A do ciclo completo 006.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim | M1 a M10 são regras aprovadas no plano. A simulação e os casos CR-M* precisam conferir saldos em centavos, patrimônio e rentabilidade conforme KB-004. |
| G2 — isolamento por RLS | Não | A issue A não conecta ao Supabase, não cria tabelas nem muda schema ou políticas. |
| G3 — privacidade de dados | Sim | Usar somente dados fictícios em testes; SQLite e relatório detalhado ficam em `local/`. Não abrir nem reproduzir dados reais. |
| G4 — migrações só acrescentam | Não | Nenhuma migração ou mudança de schema está no escopo da issue A. |

## Execução

- [x] Implementar leitor SQLite read-only, conversões, mapeamento M1–M10, validações de cobertura, replay e plano determinístico.
- [x] Adicionar modo `simular` sem conexão ao Supabase e relatório sanitizado.
- [x] Registrar casos de referência fictícios CR-M* na KB-004 e no JSON, com paridade e recálculo independente.
- [x] Cobrir cada condição da precedência de recusas e cenários positivos do plano com testes.
- [x] Executar os gates da issue e do plano; registrar resultados reais.
- [x] Revisar diff, staging e evidências G1–G4; abrir e anexar a PR #66.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Instalação | `npm ci` passou; usou rede elevada porque o sandbox retornou `ENOTFOUND` no registry. Nenhuma dependência ou lockfile mudou. |
| Testes | `npm test`: 237 passaram; foco de migração/paridade: 31 passaram. |
| Lint e tipos | ESLint sem erros; três avisos preexistentes em `local/validacao-ciclo-003/conferir.mjs`. `npm run typecheck` passou. |
| Build | `npm run build` falhou no Turbopack ao iniciar processo para `globals.css` (exit code 0); `npm run build -- --webpack` passou. |
| E2E | 13 passaram e 75 foram pulados sem backend Supabase. Executado em porta local alternativa por bloqueio de loopback do sandbox. |
| Validador | Harness de governança: 39/39; `node scripts/validate-governance.mjs`: 0 erros, 0 avisos, 4 verificações manuais. |
| `git diff --check` | Passou. |
| Checks remotos | Snapshot inicial no HEAD `4a8a8e7`: 2 aprovados, 3 pendentes. Após o push documental `d20eee0`, Governance está em andamento, CI e Vercel pendentes e Vercel Preview Comments aprovado; novo push exige reconferência no HEAD atualizado. |

## Revisão da correção

Não se aplica; issue normal do ciclo completo.

## Decisões incidentais e desvios

Nenhum registrado até o momento.

## Encerramento

Não se aplica; esta não é a última issue do ciclo.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 006 (completo)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 006 + implementar_issue + 63/A + base 9cfb2efdde5efa2ebf9dbd054abb21f4b77e1c9f`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: plano `Em Execução`, issue #63 `OPEN`, branch `feature/issue-63` em `4a8a8e7`, task bloqueada e sem PR / task `Aguardando integração`; PR #66 `OPEN`, base `main`, fora de draft; após o push documental `d20eee0`, Governance está em andamento, CI e Vercel pendentes e Vercel Preview Comments aprovado
- `result`: `executed`
- `evidence`: autenticação `gh` confirmada (`gh auth status` e `gh api user`); PR #66 criada via `gh`, vinculada à issue #63, base `main`, fora de draft; HEAD e checks registrados na tabela de evidências
- `blockers`: checks remotos do HEAD atualizado e aprovação específica "aprovo o merge da PR #66" após todos ficarem verdes
