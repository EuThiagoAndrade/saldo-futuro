# Task — Issue #88: Precisão do eixo patrimonial

> **Ciclo:** `008`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `fix`
> **Issue:** `#88`
> **Plano:** `_project/executed/008_legibilidade_patrimonio_resumo/008_plan.md`
> **Branch:** `fix/issue-88`
> **PR:** [#90](https://github.com/EuThiagoAndrade/saldo-futuro/pull/90)
> **Integração:** `Conferida no GitHub — PR #90 MERGED em 2026-10-20`
> **Autorização inicial:** "autorizo a implementação da issue #88" em 2026-10-20
> **Modo contínuo:** `—`
> **Início:** 2026-10-20
> **Última atualização:** 2026-10-20
> **handoff_schema_version:** `2`

## Objetivo

Tornar o eixo monetário coerente com as marcas e preservar dados, ocultação e gráficos compartilhados.

## Escopo autorizado

Item 1 e estratégia de testes da v3 aprovada; issue #88. Não inclui cartões (#89).

## Origem no backlog

Snapshot herdado do plano: BL-001, precisão de escala e rótulos do eixo, necessidade integral; BL-002 permanece na issue #89. Fonte `_project/backlog.md` em `7c78d1dff5cbd41358e64b45933c685c033020e1`, já em main. Destino em preparação: ciclo 008; não altera a fila.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

Toda linha é obrigatória. "Não se aplica" exige justificativa. Com G1 ou G2 marcados com "Sim", o modo contínuo não pode estar `ativo`.

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Só apresentação; sem alteração de cálculo ou centavos |
| G2 — isolamento por RLS | Não | Sem alteração de acesso, banco ou consultas |
| G3 — privacidade de dados | Sim | Somente cenários fictícios locais |
| G4 — migrações só acrescentam | Não | Nenhuma migração alterada |

## Execução

- [x] Base `7c78d1dff5cbd41358e64b45933c685c033020e1` igual a origin/main após fetch; issue aberta e plano aprovado conferidos; sem PR/branch anterior da #88.
- [x] Preservar cycles e plano locais preexistentes; primeira PR inclui esses artefatos, conforme plano.
- [x] Marcas com resolução Q, domínio cobrindo os pontos e verificação de finitude/ordenação; índices inteiros evitam acumular erro.
- [x] Unidade única e precisão decimal comum às marcas efetivas, incluindo transições e sinais.
- [x] Margem monetária de 144, área de grade/curva de 160 no viewBox de 360; índices e barras mantêm margem 70. Meses limitados pelo espaço disponível.
- [x] Casos unitários de valor/coordenada, tabela exata, lacuna, ponto único, ocultação, índices, barras e traços.
- [x] E2e da aplicação autenticada com 22 cenários fictícios positivos/negativos em 360 e 1280; fonte real carregada; medição de todas as caixas de texto monetário e ausência de sobreposição vertical.
- [x] Concluir suíte completa e governança.
- [x] Publicar PR #90 e conferir estado OPEN.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| `npm ci` | Passou; lockfile preservado. Auditoria informou cinco vulnerabilidades altas preexistentes; dependências fora do escopo |
| `npm run lint` | 0 erros; três avisos preexistentes em script ignorado de validação local |
| `npm run typecheck` | Passou |
| `npm test` | 293/293; 27 casos nos módulos de gráficos |
| Build | Passou pelo webServer do Playwright, com e sem backend local |
| E2e específico | 1/1, 22 cenários × 2 larguras; passou |
| E2e completo | Backend local: 104 passaram e 8 pulados (preview sem backend e suítes opt-in). Sem backend: 13 passaram e 99 pulados por configuração. Regressão de comparação com linha contínua/tracejada e índice 100,00 passou |
| Governança | Testes 48/48; validador com 0 erros, 0 avisos e cinco itens manuais conferidos no escopo |
| `git diff --check` | Passou |
| Checks remotos | Todos verdes na revisão integrada; resultado verificável na [PR #90](https://github.com/EuThiagoAndrade/saldo-futuro/pull/90/checks) |

O teste `tests/e2e/eixo-patrimonio.spec.ts` confere numericamente as caixas com `getBBox`, exige x ≥ 0 e extremo direito < 144, ausência de sobreposição vertical e área de 160. Conferência de um ponto fictício abaixo de R$ 1,22 mi: ordenada maior que a linha da marca, como esperado em SVG. Tabela compara os textos originais em centavos, inclusive no extremo seguro. O cenário oculto exige ausência de quantias em todo HTML.

Capturas sintéticas ignoradas em `local/issue-88/eixo-{0,17}-{360,1280}.png`; captura extrema negativa de 360 inspecionada. Nenhum dado real ou produção acessados. As capturas também mostram o transbordamento dos cartões previsto na #89, preservado nesta entrega.

## Revisão da correção

Não se aplica (trilha normal).

## Reconciliação da integração

Em 2026-10-20, o responsável declarou "aprovo o merge da PR #90". Checks de aplicação, Supabase, governança e Vercel verdes no head `02ec1b83d7eff6c2b3fe755cc9811306cf24fda1`; merge por squash conferido no GitHub, issue #88 fechada. Reconciliação nesta implementação autorizada da #89; não registra SHA do próprio merge.

## Decisões incidentais e desvios

- Margem fixa somente no patrimônio usa o orçamento máximo aprovado; não há medição de texto no cliente nem dependência nova. A tipografia existente permanece.
- Ajuste de densidade de meses necessário para a margem maior: no máximo cinco e distância mínima de 48 unidades entre os índices escolhidos. Teste com doze meses verifica as extremidades e o espaçamento.
- Primeiro e2e detectou que a caixa da fonte ultrapassa em cerca de 0,68 unidade a âncora em 138; a asserção passou a conferir a borda da grade em 144, mantendo o afastamento real positivo. Não houve redução de fonte ou ampliação do orçamento.
- Sem banco/auth/schema/cálculo alterados; Supabase local utilizado somente para validar apresentação com fixtures fictícias.

## Encerramento

Não se aplica: primeira entrega; #89 requer integração desta PR e autorização própria.

## Próximo passo

Encerramento prospectivo: antes do merge da última PR, a situação efetiva é Aguardando merge.

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 008 (leve)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 008 + implementar_issue + 88/Item-1-BL-001 + 7c78d1dff5cbd41358e64b45933c685c033020e1`
- `effect_class`: `remote_mutation`
- `state_before`: plano v3 Aprovado; ciclo Planejamento; issues #88/#89 abertas; sem branch/task da implementação; autorização explícita da #88 recebida em 2026-10-20.
- `state_after`: PR #90 integrada com checks verdes e aprovação específica; #88 fechada, task Concluída; plano/ciclo em encerramento prospectivo na última PR da #89.
- `result`: `already_executed_and_reconciled`
- `evidence`: autorização inicial desta task; validações acima; commit de implementação `5e89898`; gh pr view 90 confirma OPEN e head fix/issue-88; https://github.com/EuThiagoAndrade/saldo-futuro/pull/90; consulta prévia sem PR preexistente da #88.
- `blockers`: nenhum para a #88; próxima entrega autorizada na task #89.
