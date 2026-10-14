# Task — Issue #21: Documentação viva (visão do produto, README e renumeração de ciclos)

> **Ciclo:** `002`
> **Trilha:** `normal`
> **Estado:** `Aguardando integração`
> **Tipo:** `chore`
> **Issue:** `#21`
> **Plano:** `_project/drafts/002_reforma_governanca/002_plan.md`
> **Branch:** `chore/issue-21`
> **PR:** —
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #21" em 2026-10-13
> **Modo contínuo:** `—`
> **Início:** 2026-10-13
> **Última atualização:** 2026-10-13
> **handoff_schema_version:** `2`

Primeira task criada sob a governança reformada, depois do merge da PR #22 (D4). Ponto de aprovação "Autorizar implementação da issue B" concedido pelo responsável em 2026-10-13.

## Objetivo

Entregar a documentação viva do ciclo `002` (itens B1 a B3 do plano; decisões D1 e D5):

- a visão do produto e da arquitetura;
- o ponto de entrada do `README.md`;
- a renumeração dos ciclos futuros nos documentos vivos.

## Escopo autorizado

- **B1:** nova `_project/knowledge/KB-003_visao_produto_arquitetura.md`.
- **B2:** `README.md` da raiz: "Comece por aqui", mapa de ciclos `000` a `005` e governança por níveis.
- **B3:** referências a ciclos futuros em ADR-002 (linhas 39, 58, 60 e 73), ADR-003 (linha 72), KB-001 (linhas 17, 71 e 114) e `design-system/DESIGN.md` (linhas 8, 96 e 266), com a data de atualização.
- **Reconciliação:** task da issue #20 depois do merge da PR #22, rastreabilidade do plano e do ciclo.

Fora do escopo: código da aplicação, decisões das ADRs, contrato visual, artefatos em `_project/executed/` e a ideação do ciclo `001`.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Nenhuma regra de cálculo; só a referência de ciclo da KB de regras financeiras (`002` → `003`) |
| G2 — isolamento por RLS | Não | A KB-003 descreve o RLS existente, sem alterar migração, política ou função |
| G3 — privacidade de dados | Sim | A KB-003 cita só nomes de tabelas, funções, papéis, arquivos e o domínio público do produto. Nenhum e-mail real, valor, ativo, instituição ou print; o primeiro administrador é citado só como "inserido no banco de produção" |
| G4 — migrações só acrescentam | Não | Nenhuma migração |

## Execução

- [x] **B1:** KB-003 escrita a partir do código e dos documentos em `main` @ `70f592c`. Cada seção cita a fonte (arquivo, ADR ou KB). Os fatos foram conferidos nos arquivos: migrações, `src/proxy.ts`, rotas, `vercel.json`, `package.json`, `supabase/config.toml` e a contagem de asserções pgTAP (36 + 20 + 12).
- [x] **B2:** `README.md` com "Comece por aqui" (KB-003, processo e "continue o ciclo NNN"), mapa `000` a `005` com o `002` em execução e o resumo dos níveis (ADR-004).
- [x] **B3:** 12 referências renumeradas (`002` → `003`, `003` → `004`, `004` → `005`). Nenhuma decisão mudou; o `DESIGN.md` continua `v1`, só com a data atualizada. A KB-001 ganhou uma linha no histórico.
- [x] **Reconciliação:** task da issue #20 marcada `Concluída`, com a integração `70f592c` e os checks reais.
- [x] **Ajuste do item A1:** KB-003 incluída na ordem de leitura de `.agent/ai_behavior.md` (ver "Decisões incidentais").

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | `node --test scripts/validate-governance.test.mjs`: 39 passaram, 0 falharam |
| Validador | `node scripts/validate-governance.mjs`: 0 erros e 0 avisos, depois do número da PR no bloco |
| `git diff --check` | Passou |
| Checks remotos | Pendente |
| Artefatos históricos | `git diff` sem nenhum arquivo em `_project/executed/` nem `_project/ideations/001_*` |
| Leitura agnóstica (recomendada) | Pendente: o responsável pode abrir outra ferramenta no repositório e pedir "continue o ciclo 002" antes de aprovar o merge. O resultado esperado é o bloco "Aguardando merge" desta PR. Se não for feito, o encerramento registra "não executado" |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

- **KB-003 na ordem de leitura:** a tabela de destino do plano previa que o glossário e a KB-003 entrassem na matriz de autoridade. A PR #22 cobriu o glossário (linha do `_project/README.md`), mas não a KB-003. A KB-003 entrou no item 4 da ordem de leitura, que é onde ela orienta o agente; a linha "KB local" da matriz já a abrange.
- **Manifesto:** a KB-003 passou a ser arquivo obrigatório, como a KB-001.
- **Data do `DESIGN.md`:** a "Última atualização" passou para 2026-10-13 sem mudar a versão `v1`, porque só as referências de ciclo mudaram.

## Encerramento

Não se aplica: o ciclo `002` é completo e tem PR de encerramento própria.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 002 (completo)
Quem: Responsável
Conferir: checks e diff da PR desta issue, a KB-003 e a ausência de dados do usuário
Diga: "aprovo o merge da PR #N"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 002 + implementar_issue + 21/B1-B3 + 70f592c`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`:
  - antes: `main` @ `70f592c` com a governança reformada, a task da issue #20 ainda em `Aguardando integração` e a issue #21 aberta;
  - depois: branch `chore/issue-21` com B1 a B3 e a task #20 reconciliada, PR aberta aguardando a aprovação do merge.
- `result`: `executed`
- `evidence`: "Execução" e "Evidências" desta task; checks da PR.
- `blockers`: aprovação do merge.
