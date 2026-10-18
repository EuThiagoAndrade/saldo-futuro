# Task — Issue #63: Simular a migração da origem sem gravar

> **Ciclo:** `006`
> **Trilha:** `normal`
> **Estado:** `Em andamento`
> **Tipo:** `feature`
> **Issue:** `#63`
> **Plano:** `_project/drafts/006_migracao_dados_virada/006_plan.md`
> **Branch:** `feature/issue-63`
> **PR:** —
> **Integração:** `Pendente`
> **Autorização inicial:** "Autorizo a implementação da issue #63 (simulação da migração)" em 2026-10-17
> **Modo contínuo:** `—`
> **Início:** 2026-10-17
> **Última atualização:** 2026-10-17
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
- [x] Revisar diff, staging e evidências G1–G4 antes de preparar a PR.

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
| Checks remotos | Pendente |

## Revisão da correção

Não se aplica; issue normal do ciclo completo.

## Decisões incidentais e desvios

Nenhum registrado até o momento.

## Encerramento

Não se aplica; esta não é a última issue do ciclo.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 006 (completo)
Quem: Responsável
Conferir: PR da issue #63 e checks remotos
Diga: "aprovo o merge da PR #N"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 006 + implementar_issue + 63/A + base 9cfb2efdde5efa2ebf9dbd054abb21f4b77e1c9f`
- `effect_class`: `local_mutation`
- `state_before` / `state_after`: plano `Aprovado`, issue #63 `OPEN`, base `main` em `9cfb2efdde5efa2ebf9dbd054abb21f4b77e1c9f`, sem branch ou task da issue / plano `Em Execução`, ciclo `Em execução`, issue #63 `OPEN`, branch `feature/issue-63`, task e implementação local concluídas; PR e checks remotos pendentes
- `result`: `executed`
- `evidence`: issue e corpo conferidos pelo conector GitHub; plano aprovado e PR #62 integrada; `HEAD` igual a `origin/main`; branch e task criadas após a autorização recebida em 2026-10-17; resultados reais na tabela de evidências
- `blockers`: publicar a PR, aguardar checks remotos e aprovação específica do merge
