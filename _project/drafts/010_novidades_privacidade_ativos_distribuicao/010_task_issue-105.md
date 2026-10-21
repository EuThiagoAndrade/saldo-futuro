# Task — Issue #105: Exibir versão e novidades do produto

> **Ciclo:** `010`
> **Trilha:** `normal`
> **Estado:** `Aguardando integração`
> **Tipo:** `feature`
> **Issue:** `#105`
> **Plano:** `_project/drafts/010_novidades_privacidade_ativos_distribuicao/010_plan.md`
> **Branch:** `feature/issue-105`
> **PR:** [#110](https://github.com/EuThiagoAndrade/saldo-futuro/pull/110)
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #105" em 2026-10-21
> **Modo contínuo:** `—`
> **Início:** 2026-10-21
> **Última atualização:** 2026-10-21
> **handoff_schema_version:** `2`

## Objetivo

Mostrar a versão corrente do produto e as novidades de cada versão em linguagem simples, numa página `/novidades` autenticada, acessível a `admin` e `user` por Mais e pelo menu lateral, com histórico manual a partir de `0.7.0`.

## Escopo autorizado

Item 2 (BL-011) do plano `v2` aprovado do ciclo 010 e issue #105. Não inclui as issues #106 e #107, a PR do release-please (#109), a data real da release (encerramento), a ação externa da #104 nem acesso autenticado à produção.

## Origem no backlog

Snapshot herdado do plano: BL-011, parcela integral (tela `/novidades`, acessível a todos os perfis, com a versão corrente e notas de lançamento em linguagem não técnica). Fonte `_project/backlog.md` no commit `49a1332c8bc869d3b8dd148baf387de869288307`, já em main. Destino em preparação: ciclo 010; não altera a fila.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

Toda linha é obrigatória. "Não se aplica" exige justificativa. Com G1 ou G2 marcados com "Sim", o modo contínuo não pode estar `ativo`.

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Página de versão e notas; nenhum cálculo, leitura financeira ou regra da KB-004 alterada |
| G2 — isolamento por RLS | Não | Sem tabela, política ou autorização nova; `/novidades` usa `exigirSessao` como as demais páginas do grupo e não lê dados do banco. Regressões de banco e autenticação executadas |
| G3 — privacidade de dados | Sim | Notas descrevem funcionalidades, sem dados de usuário; testes com usuários fictícios; sem leitura de `local/` ou produção |
| G4 — migrações só acrescentam | Não | Nenhuma migração criada ou alterada |

## Execução

- [x] Autorização, issue #105 aberta, plano `v2` Em Execução, PR #108 da #104 integrada e base `30e05c5` igual a `origin/main` conferidas; sem branch ou PR anteriores da #105. PR #109 do release-please (`0.7.0`) aberta e fora do escopo: não integrar antes das quatro entregas.
- [x] Reconciliação da task #104 (código integrado, etapa externa pendente) e do índice de ciclos.
- [x] `src/lib/novidades.ts`: `VERSAO_ATUAL` lida do `package.json` no servidor; `HISTORICO` manual com a entrada `0.7.0` (data `null`) e as notas de BL-012 e BL-011; `compararVersoes` numérica (maior.menor.correção) e `novidadesPublicadas`, que mostra só versões já lançadas, da mais recente para a mais antiga, sem reordenar o histórico.
- [x] `/novidades` em `(app)`, com `exigirSessao`, título, versão atual e `HistoricoNovidades` (`src/components/novidades.tsx`): sem entradas lançadas, "O histórico de novidades ainda não está disponível."; com data `null`, "Data de publicação em confirmação"; com data, "Publicada em" e a data civil por extenso (`dataExtensaBr`, sem depender do fuso). Sem backend, `PreviewNotice`.
- [x] Novidades em Mais e no menu lateral, para os dois perfis, entre Transferências e Conta, com ícone próprio no padrão de `icones.tsx`; DESIGN.md 6.1 atualizado com a ordem dos destinos e a posição dos documentos legais.
- [x] Testes: `src/lib/novidades.test.ts` e `src/components/novidades.test.tsx` (versão do `package.json`, comparação numérica, transição 0.6.0 → 0.7.0 sem data → data comprovada, versão sem entrada sem erro, notas sem identificadores técnicos); `tests/e2e/novidades.spec.ts` (sem sessão, Mais no celular para o usuário comum, menu lateral para o admin, destino ativo, versão, histórico conforme a versão, nenhum link ao changelog, axe e rolagem em 360 e 1280 px); `/novidades` nas listas de `navegacao.spec.ts`, `botoes.spec.ts` e `preview.spec.ts`; menu lateral do usuário comum com 8 links.
- [x] KB-003 com a capacidade da entrega.
- [x] PR #110 publicada via `gh`, base `main`, com `Closes #105`; commit da entrega `e740541`.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| `npm run lint` | 0 erros; três avisos preexistentes em script ignorado de validação local (`local/`) |
| `npm run typecheck` | Passou |
| `npm test` | 332/332 (28 arquivos), com os 13 testes novos de `novidades.test.ts` e `novidades.test.tsx` |
| Build | Passou, sem backend e com backend, pelo `webServer` do Playwright |
| E2e sem backend | 32 passaram e 148 pulados (suítes que exigem Supabase), inclusive `/novidades` com o aviso de preview |
| `npx supabase test db` | 261/261 (7 arquivos) |
| E2e com backend | 169 passaram e 11 pulados, sem falhas; inclui `novidades.spec.ts` (5 testes) e as listas ampliadas de navegação e botões |
| Auditoria visual (DESIGN.md) | `/novidades` em 360 px (com a folha Mais) e 1280 px, com conta fictícia temporária criada e removida por script: título 24/32, destino ativo em `primary-subtle`, ícone de 24 px no traço do conjunto, alvo de 44 px e sem rolagem horizontal; axe WCAG 2.2 AA sem violações no e2e. O estado com a entrada `0.7.0` foi conferido pela marcação no teste unitário, porque o `package.json` ainda está em `0.6.0` |
| Governança | `node scripts/validate-governance.mjs` com 0 erros, 0 avisos e cinco itens manuais |
| G3 | Notas sem dado de usuário; contas de teste fictícias (`novidades105.*`, `visual105.comum`, todas `@example.com`) removidas no fim |
| `git diff --check` | Passou |
| Checks remotos | Pendente |

## Revisão da correção

Não se aplica (trilha normal).

## Decisões incidentais e desvios

- **Notas da `0.7.0` para revisão do responsável:** "Política de privacidade e termos de uso publicados, com links na tela de entrada e em Conta." (BL-012) e "Nova página Novidades, no menu, com a versão do aplicativo e o que mudou em cada versão." (BL-011). As notas de BL-006 e BL-005 entram nas PRs delas.
- **Estado atual em produção:** com `package.json` em `0.6.0`, a página mostra a versão `0.6.0` e o histórico indisponível; a entrada `0.7.0` só aparece depois da release. A PR #109 do release-please, já aberta com `0.7.0`, não deve ser integrada antes das quatro entregas (plano, "Decomposição").
- **Versão com sufixo:** a comparação lê só `maior.menor.correção` do início do texto; um sufixo de pré-lançamento não quebra a página. Texto sem versão lança erro, e o teste unitário garante que o `package.json` tem versão válida.
- **Ordem em Mais:** Transferências, Novidades, Conta e Administração; o plano não fixava a posição. Conta continua perto do fim, junto de Administração.
- **Leitura do `package.json`:** importado pelo módulo do servidor (`resolveJsonModule` já ativo); nenhum dado novo vai ao navegador além da versão exibida.
- Sem mudança de banco, autenticação, schema, cálculo ou dependências.

## Encerramento

Não se aplica: o ciclo é completo e o encerramento tem PR própria.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 010 (completo)
Quem: Responsável
Conferir: Checks e diff da PR #110 (https://github.com/EuThiagoAndrade/saldo-futuro/pull/110); notas da 0.7.0 em src/lib/novidades.ts, transcritas em "Decisões incidentais"
Diga: "aprovo o merge da PR #110"
```

Depois do merge, a próxima situação é "Aguardando autorização de implementação" da issue #106. A PR #109 do release-please continua sem integrar até as quatro entregas.

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 010 + implementar_issue + 105/Item-2-BL-011 + 30e05c55e5756dfa017a6f98d1ce96aec9555e3a`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: plano Em Execução, #104 integrada, #105 aberta sem branch nem PR / branch `feature/issue-105` publicada, PR #110 aberta e task Aguardando integração
- `result`: `executed`
- `evidence`: autorização "autorizo a implementação da issue #105" em 2026-10-21; `git fetch` com `main` igual a `origin/main` em `30e05c5`; consulta sem PR ou branch da #105; PR https://github.com/EuThiagoAndrade/saldo-futuro/pull/110 criada via `gh`; validações da tabela de evidências
- `blockers`: checks remotos verdes no HEAD final e "aprovo o merge da PR #110"
