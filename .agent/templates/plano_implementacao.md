# Plano de Implementação — assunto

> **Ciclo:** `NNN`
> **Status:** `Rascunho`
> **Versão:** `v1`
> **Data de criação:** AAAA-MM-DD
> **Última atualização:** AAAA-MM-DD
> **Tipo:** `feature | fix | chore`
> **Prioridade:** `P0 | P1 | P2 | P3`
> **Nível:** `leve | completo`
> **Autorização inicial:** "<frase de entrada>" em AAAA-MM-DD
> **Modo contínuo:** `— | ativo | suspenso`
> **Revisão formal:** `Pendente | Em andamento | Concluída`
> **Veredito da revisão:** `Pendente | APTO PARA APROVAÇÃO | APTO COM RESSALVAS | REQUER NOVA RODADA`
> **Aprovação humana pós-revisão:** `Pendente | Aprovada em AAAA-MM-DD | Coberta pelo modo contínuo (autorização inicial de AAAA-MM-DD)`
> **handoff_schema_version:** `2`

## Problema e contexto

No ciclo leve, esta seção substitui a ideação: problema, evidências, decisões do responsável e alternativas. No completo, escreva apenas `Ideação: _project/ideations/NNN_assunto.md`.

## Objetivo

## Origem no backlog

Opcional para artefatos novos: `Não se aplica` sem origem. No completo, herdar o snapshot da ideação; no leve, registrar IDs, síntese/parcela e `_project/backlog.md` no commit da fila, sinalizando local/não publicado. Destino em preparação não altera item. IDs devem estar em main antes de integrar destino; retorno somente após integração comprovada, por `ciclo NNN`. Não atualizar o snapshot quando o item mudar.

## Contexto e baseline

## Escopo

### Dentro do escopo

### Fora do escopo

## Decisões e autoridades

### Pontos de aprovação

| Ponto | Precondição | Cobre | Não cobre | Conferir |
| :-- | :-- | :-- | :-- | :-- |

Cada merge tem aprovação própria. Use os tipos e as frases de `_project/README.md`, sem códigos. Declare as condições em que toda cadeia autorizada para.

## Barreiras de domínio

| Barreira | Aplica-se? | Como o ciclo a atende ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | | |
| G2 — isolamento por RLS | | |
| G3 — privacidade de dados | | |
| G4 — migrações só acrescentam | | |

## Estratégia de testes

## Itens de implementação

### Item 1 — título

**Contexto:**

**Ação técnica:**

**Critérios de aceite:**

- [ ] Critério verificável.

## Arquivos afetados

## Decomposição em issues e PRs

## Dependências e blockers

## Riscos, suposições e rollback

## Sequência recomendada

## Referências

## Rastreabilidade

| Campo | Valor |
| :-- | :-- |
| Issue(s) | — |
| PR(s) | — |
| Branch(es) | — |
| Destino após conclusão | `_project/executed/NNN_assunto/NNN_plan.md` |

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando revisão (rodada 1) — ciclo NNN (<nível>)
Quem: O responsável leva a vez a um revisor, que pode ser outra ferramenta
Conferir: —
Diga: "revise o plano do ciclo NNN"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `repository + NNN + <workflow> + NNN_plan + versão`
- `effect_class`: `local_mutation`
- `state_before` / `state_after`:
- `result`: `executed | already_executed_and_reconciled | ambiguous_human_intervention_required | not_executed`
- `evidence`:
- `blockers`:

## Revisão crítica

Uma subseção `### Rodada N` por rodada, com `Autor:`, `Revisor:` (ferramenta e modelo), achados `RN-k` (bloqueador ou ressalva), itens atendidos e veredito. O autor responde a cada achado numa subseção própria. Teto de 5 rodadas.

## Pós-mortem

- **Data de conclusão:** —
- **Desvios:** —
- **Lições comprovadas:** —
