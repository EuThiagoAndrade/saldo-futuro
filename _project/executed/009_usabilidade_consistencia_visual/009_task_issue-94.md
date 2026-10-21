# Task — Issue #94: Alinhar a margem do gráfico patrimonial aos gráficos vizinhos

> **Ciclo:** `009`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `fix`
> **Issue:** `#94`
> **Plano:** `_project/executed/009_usabilidade_consistencia_visual/009_plan.md`
> **Branch:** `fix/issue-94`
> **PR:** [#98](https://github.com/EuThiagoAndrade/saldo-futuro/pull/98)
> **Integração:** `Conferida no GitHub — PR #98 MERGED em 2026-10-20`
> **Autorização inicial:** "autorizo a implementação da issue #94" em 2026-10-20
> **Modo contínuo:** `—`
> **Início:** 2026-10-20
> **Última atualização:** 2026-10-20
> **handoff_schema_version:** `2`

## Objetivo

Dar ao patrimônio, à rentabilidade mensal e à Base 100 do Início a mesma margem esquerda, calculada pelos rótulos efetivamente gerados, sem perder a legibilidade garantida no ciclo 008.

## Escopo autorizado

Item 1 (BL-013) e a estratégia de testes da `v2` aprovada do ciclo 009; issue #94. Não inclui as issues #95 a #97. A primeira PR leva também o plano, a atualização de `cycles.md` e esta task.

## Origem no backlog

Snapshot herdado do plano: BL-013, necessidade integral (área de plotagem do patrimônio com o mesmo recuo à esquerda da rentabilidade mensal e da Base 100, preservando a leitura integral dos rótulos monetários). Fonte `_project/backlog.md` em `811ff840a51da200bdff8f0591e11d9d95fd103f`, já em main. Destino em preparação: ciclo 009; não altera a fila.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

Toda linha é obrigatória. "Não se aplica" exige justificativa. Com G1 ou G2 marcados com "Sim", o modo contínuo não pode estar `ativo`.

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Só apresentação: a margem depende do texto dos rótulos já formatados; valores, marcas, períodos e consolidação não mudam |
| G2 — isolamento por RLS | Não | Sem alteração de sessão, consultas, políticas ou acesso a dados |
| G3 — privacidade de dados | Sim | Somente cenários fictícios no Supabase local (usuários `margem94.*` e `eixo88.*`, removidos no fim); nenhum dado real, `local/` financeiro ou produção |
| G4 — migrações só acrescentam | Não | Nenhuma migração criada ou alterada |

## Execução

- [x] Autorização, issue #94 aberta, plano `v2` aprovado e base `811ff84` (igual a `origin/main`) conferidos; sem branch ou PR anteriores da #94.
- [x] Alterações preexistentes de `cycles.md` e do plano não versionado preservadas e incluídas na primeira PR; `.agent/lessons_learned.md` (alheia ao ciclo) fica fora do staging.
- [x] `GraficoBarras` aceita `margemEsquerda` (grade, rótulos, meses e largura das barras).
- [x] Módulo `src/components/graficos/margem.ts`: largura estimada por caractere (medida na IBM Plex Sans Regular, com folga), rótulos de eixo de linha e barras e `margemComum` (mínimo 70, máximo 144, que preserva 160 unidades de curva).
- [x] Início calcula a margem comum dos três eixos (Base 100 só quando existe) e a passa aos três gráficos; o 144 fixo foi removido. A comparação de benchmarks não mudou.
- [x] Testes unitários da estimativa e da margem comum (faixa comum, mil/mi, negativos, rótulo longo recuando os três juntos, extremos do ciclo 008, ocultação) e de renderização de `GraficoBarras`.
- [x] E2e com a fonte real carregada: asserção de 144 do ciclo 008 trocada pela margem real do gráfico; novo cenário `margem comum` (comum e extremo, 360 e 1280): mesma coordenada de grade nos três gráficos, 70 no comum, curva de pelo menos 160, nenhum corte, nenhuma sobreposição e estimativa nunca menor que a caixa medida.
- [x] Suíte completa e governança.
- [x] Publicar a PR #98 e conferir o estado OPEN.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| `npm run lint` | 0 erros; três avisos preexistentes em script ignorado de validação local (`local/`) |
| `npm run typecheck` | Passou |
| `npm test` | 300/300 (24 arquivos); inclui `margem.test.ts` (6 casos) e o teste de `GraficoBarras` com `margemEsquerda` |
| Build | Passou, pelo `webServer` do Playwright |
| E2e específico | `eixo-patrimonio.spec.ts` 3/3: cenário do ciclo 008 (22 cenários × 2 larguras, agora contra a margem real) e cenário novo `margem comum` (`comum` e `extremo`, 360 e 1280): grade na mesma coordenada nos três gráficos, 70 no comum, curva de pelo menos 160, sem corte nem sobreposição, estimativa maior ou igual à caixa medida com a fonte carregada |
| E2e completo | Backend local: 109 passaram e 8 pulados (preview sem backend e suítes opt-in) |
| Governança | `node --test scripts/validate-governance.test.mjs` 48/48; `node scripts/validate-governance.mjs` com 0 erros, 0 avisos e cinco itens manuais |
| `git diff --check` | Passou |
| Checks remotos | Todos verdes no head `4dfc20f788c76281050126fd40e21f70dbc66004`: lint, tipos, testes, build e e2e de preview; Supabase local, testes de banco e e2e de autenticação; governança; Vercel |

Medidas reais do e2e (largura da caixa em unidades do viewBox, medida / estimada): `R$ 1,2x mi` 53,94 / 57,31; `R$ 90.071.992,547x mi` 119,32 / 124,30; `0,00%` 33,80 / 34,98; `100,00` 36,73 / 36,85 (antes da folga na tabela; a estimativa final é maior). Capturas e dados reais não foram usados; cenários fictícios no Supabase local, sem produção.

## Revisão da correção

Não se aplica (trilha normal).

## Decisões incidentais e desvios

- A estimativa partiu das larguras medidas na fonte (algarismo 0,601 em; `%` 0,928 em; `R` 0,641 em; `m` 0,874 em). O primeiro e2e mostrou a caixa renderizada de `0,00%` (33,80) acima da estimada (33,04), e a de `100,00` a 360 px (36,73) quase igual à estimada; a tabela recebeu folga (algarismos 0,62 em; `%` 1,05 em). O e2e continua exigindo estimativa maior ou igual à caixa medida.
- Os `svg` das tabelas de variação ficam dentro de `figure`; o e2e seleciona o gráfico por `figure > svg`.
- Sem mudança de banco, autenticação, schema, cálculo ou dependências.

## Encerramento

Não se aplica: primeira entrega do ciclo; #95, #96 e #97 exigem autorização própria.

## Reconciliação da integração

Em 2026-10-20, o responsável declarou "aprovo o merge da PR #98". Os cinco checks estavam verdes no head `4dfc20f788c76281050126fd40e21f70dbc66004`; o merge por squash foi conferido no GitHub, com o assunto `fix(issue-94): alinhar a margem do gráfico patrimonial aos gráficos vizinhos (#98)`, e a issue #94 foi fechada. Reconciliação feita na implementação autorizada da #95; não registra o SHA do próprio merge.

## Próximo passo

Ciclo 009 encerrado prospectivamente na última PR (issue #97): depois do merge dela, a situação do ciclo é Concluído.

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 009 (leve)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 009 + implementar_issue + 94/Item-1-BL-013 + 811ff840a51da200bdff8f0591e11d9d95fd103f`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: plano `v2` Aprovado, ciclo Planejamento, #94 aberta, sem branch nem PR / branch `fix/issue-94` publicada com a PR #98 aberta, plano e ciclo em Em execução
- `result`: `already_executed_and_reconciled`
- `evidence`: autorização desta task; validações da tabela de evidências; `git fetch` com `main` igual a `origin/main` em `811ff84`; consulta prévia sem PR da #94
- `blockers`: nenhum; o merge depende de checks verdes e de "aprovo o merge da PR #N"
