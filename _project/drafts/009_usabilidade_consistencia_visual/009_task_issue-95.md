# Task — Issue #95: Uniformizar cursor e estados de interação dos botões

> **Ciclo:** `009`
> **Trilha:** `normal`
> **Estado:** `Aguardando integração`
> **Tipo:** `fix`
> **Issue:** `#95`
> **Plano:** `_project/drafts/009_usabilidade_consistencia_visual/009_plan.md`
> **Branch:** `fix/issue-95`
> **PR:** [#99](https://github.com/EuThiagoAndrade/saldo-futuro/pull/99)
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #95" em 2026-10-20
> **Modo contínuo:** `—`
> **Início:** 2026-10-20
> **Última atualização:** 2026-10-20
> **handoff_schema_version:** `2`

## Objetivo

Dar a todo botão cursor de ponteiro quando habilitado, hover nas variantes que não o tinham e estado pressionado em todas as variantes, sem tokens novos e respeitando `prefers-reduced-motion`.

## Escopo autorizado

Item 2 (BL-004) e a estratégia de testes da `v2` aprovada do ciclo 009, incluindo a exceção R2-1 aceita na aprovação do plano; issue #95. Não inclui as issues #96 e #97.

## Origem no backlog

Snapshot herdado do plano: BL-004, necessidade integral (cursor de ponteiro uniforme, hover nas variantes que não o têm e estado pressionado em todos os botões), com a exceção do principal com mouse e movimento reduzido já aceita. Fonte `_project/backlog.md` em `811ff840a51da200bdff8f0591e11d9d95fd103f`, já em main. Destino em preparação: ciclo 009; não altera a fila.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

Toda linha é obrigatória. "Não se aplica" exige justificativa. Com G1 ou G2 marcados com "Sim", o modo contínuo não pode estar `ativo`.

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Só apresentação e interação; nenhum cálculo, valor ou período muda |
| G2 — isolamento por RLS | Não | Sem alteração de sessão, consultas, políticas ou acesso a dados |
| G3 — privacidade de dados | Sim | Somente usuário e ativo fictícios no Supabase local (`botoes95.comum`, removido no fim); nenhum dado real, `local/` financeiro ou produção |
| G4 — migrações só acrescentam | Não | Nenhuma migração criada ou alterada |

## Execução

- [x] Autorização, issue #95 aberta, plano `v2` aprovado, #94 integrada e base `b303d26` (igual a `origin/main`) conferidos; sem branch ou PR anteriores da #95.
- [x] Reconciliação da task #94 e atualização de `cycles.md` e do plano (PR #98 integrada); `.agent/lessons_learned.md` (alheia ao ciclo) fica fora do staging.
- [x] `src/components/botoes.ts`: base com `not-disabled:cursor-pointer` e deslocamento `motion-safe:not-disabled:active:translate-y-px`; hover e pressão só em controle habilitado (`not-disabled:` também cobre links com a aparência de botão). Principal: `primary-hover` em hover e pressionado. Secundário e texto: hover `surface-subtle`, pressionado `primary-subtle`. Destrutivo: pressionado `loss` a 90%.
- [x] Bases do login (`login-panel.tsx`) e botões com classes próprias ("Ocultar valores" em `layout.tsx`; "Mais" e "Fechar" em `navegacao.tsx`) com ponteiro, hover e pressão `primary-subtle`, preservando a composição.
- [x] DESIGN.md §6.9 (hover, pressão, exceção R2-1, controles com classes próprias) e §2.2 (razões novas; destrutivo com a cor computada no navegador).
- [x] Testes unitários das classes das variantes (`botoes.test.ts`) e e2e `botoes.spec.ts`: cursor computado em todo `button` visível (login e telas autenticadas, 360 e 1280, diálogo de confirmação e folha Mais); hover e pressão de principal, secundário, destrutivo, "Ocultar valores", "Mais" e "Fechar", com e sem `prefers-reduced-motion`; desabilitado sem reação; contraste de texto em todos os estados.
- [x] Suíte completa e governança.
- [x] Publicar a PR #99 e conferir o estado OPEN.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| `npm run lint` | 0 erros; três avisos preexistentes em script ignorado de validação local (`local/`) |
| `npm run typecheck` | Passou |
| `npm test` | 305/305 (25 arquivos); inclui `botoes.test.ts` (5 casos) |
| Build | Passou, pelo `webServer` do Playwright |
| E2e específico | `botoes.spec.ts` 8/8 |
| E2e completo | Backend local: 117 passaram e 8 pulados (preview sem backend e suítes opt-in); inclui os testes de acessibilidade (axe, WCAG 2.2 AA) das páginas autenticadas em 360 e 1280 px, sem violações |
| Governança | `node --test scripts/validate-governance.test.mjs` 48/48; `node scripts/validate-governance.mjs` com 0 erros, 0 avisos e cinco itens manuais |
| `git diff --check` | Passou |
| Checks remotos | Pendente |

Cores medidas no navegador (rgb computado, sobre a superfície branca). Principal: repouso 11,42,85; hover e pressionado 22,60,115. Secundário: repouso 255,255,255; hover 244,246,249; pressionado 231,237,246. Destrutivo: repouso 166,58,53; hover igual; pressionado `oklab(0.501712 0.128701 0.0634938 / 0.9)`, composto 175,77,73, com contraste 5,28 sobre `on-primary` (acima de 4,5; o recuo previsto no plano não foi necessário). "Ocultar valores": hover 255,255,255; pressionado 231,237,246. "Mais" e "Fechar": hover 244,246,249; pressionado 231,237,246. Deslocamento `0px 1px` ao pressionar sem movimento reduzido e `none` com `prefers-reduced-motion: reduce`; em todos os casos o pressionado difere do repouso. Contraste de texto ≥ 4,5 em todos os estados medidos. Verificação manual de teclado e leitor de tela não foi feita nesta sessão; o foco visível não foi alterado e o axe automatizado passou.

## Revisão da correção

Não se aplica (trilha normal).

## Decisões incidentais e desvios

- A regra global de movimento reduzido (`transition-duration: 0,01ms`) faz a cor computada atrasar um quadro; o e2e espera dois quadros antes de ler o estilo. Não houve mudança na regra global.
- Os botões `botaoTexto` não têm uso na aplicação hoje; a variante é coberta pelo teste unitário de classes, e o e2e cobre as variantes em uso e os três botões com classes próprias.
- O pressionado do secundário e do texto usa `primary-subtle`, com `border-strong` a 3,01:1 (no limite do mínimo de 3:1, conforme o plano). Se a revisão preferir folga, a alternativa registrada é `surface-subtle`.
- Sem mudança de banco, autenticação, schema, cálculo ou dependências.

## Encerramento

Não se aplica: a #96 e a #97 exigem autorização própria; a última PR do ciclo leva o encerramento prospectivo.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 009 (leve)
Quem: Responsável
Conferir: checks e diff da [PR #99](https://github.com/EuThiagoAndrade/saldo-futuro/pull/99)
Diga: "aprovo o merge da PR #99"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 009 + implementar_issue + 95/Item-2-BL-004 + b303d26e8136c6b1b01b2c8a272f4e7f907308f3`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: plano `v2` Em Execução, #94 integrada, #95 aberta, sem branch nem PR / branch `fix/issue-95` publicada com a PR #99 aberta
- `result`: `executed`
- `evidence`: autorização desta task; validações da tabela de evidências; `git fetch` com `main` igual a `origin/main` em `b303d26`; consulta prévia sem PR da #95
- `blockers`: nenhum; o merge depende de checks verdes e de "aprovo o merge da PR #N"
