# Task — Issue #190: Filtrar ativos por classe e por instituição (BL-020)

> **Ciclo:** `019` (trilha curta: `—`)
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `feature`
> **Issue:** `#190`
> **Plano:** `_project/executed/019_filtros_selecao_ativos/019_plan.md`
> **Branch:** `feature/issue-190`
> **PR:** https://github.com/EuThiagoAndrade/saldo-futuro/pull/193
> **Integração:** PR #193 integrada por squash (`8963b257aa5280451498f69484d7c2f8164dfc2b`) em 2026-11-05, com os cinco checks verdes no head `ea0b16a`; issue #190 fechada pelo merge (`Closes #190`); release `0.15.0` pela PR #194, ainda aberta
> **Autorização inicial:** "autorizo a implementação da issue #190" em 2026-11-05
> **Modo contínuo:** `—`
> **Início:** 2026-11-05
> **Última atualização:** 2026-11-05
> **handoff_schema_version:** `2`

## Objetivo

Entregar o Item 1 do plano aprovado (BL-020): o "Filtrar" de `/ativos` passa a escolher classe da taxonomia e instituição, num grupo "Classe e instituição" no topo do painel, com listas suspensas de múltipla escolha (D1 a D4).

## Escopo autorizado

`classe` e `instituicao` (repetíveis, por ID) na URL, na leitura, na aplicação, no contador, nas abas e no "Limpar filtros"; nó da taxonomia inclui os descendentes; "Sem classe" e "Sem instituição" exclusivos; opções só em uso (das duas abas) e as marcadas na URL; trânsito fora com qualquer filtro; painel sem JavaScript, acessível e sem rolagem horizontal em 360 px. Também nesta PR, por regra do ciclo leve: o plano, a linha do ciclo em `cycles.md` e a parte do DESIGN.md, da KB-003 e da nota de novidades (`0.15.0`, `publicadaEm: null`) que cabe a esta mudança. Fora: banco, schema, RLS, cálculo, formulários de lançamento e transferência (issue #191), retorno da edição e faixa do prazo (issue #192).

## Origem no backlog

Herdada do plano: BL-020 (integral), com o snapshot de `_project/backlog.md` no commit `d7533c6ae904b3e1379f90028c3e6a5c84c25b8e`, presente em `main` e `origin/main`. Destino em preparação; o item continua Disponível, e o retorno é registrado na fila só depois da integração comprovada do ciclo, por `ciclo 019`.

## Elegibilidade da trilha curta

Não se aplica — trilha normal, Item 1 do ciclo leve.

## Barreiras de domínio

Toda linha é obrigatória. "Não se aplica" exige justificativa. Com G1 ou G2 marcados com "Sim", o modo contínuo não pode estar `ativo`.

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não se aplica | Só filtragem de linhas já lidas por pertencimento a conjuntos de IDs; nenhuma regra de eventos, fechamento, consolidação, retorno ou benchmark |
| G2 — isolamento por RLS | Não se aplica | Sem tabela, política, função ou leitor novo; a página usa `lerTaxonomia`, `lerClassesLegadas` e `lerInstituicoes`, que já eram lidos nela com a sessão do usuário; IDs da URL são conferidos contra esses catálogos e nunca consultam o banco |
| G3 — privacidade de dados | Sim | Testes unitários e e2e só com nomes, instituições e IDs fictícios (usuário e dados criados e removidos pelo próprio teste); nada de `local/` lido; a URL guarda só IDs de catálogo |
| G4 — migrações só acrescentam | Não se aplica | Nenhuma migração nesta entrega |

## Execução

- [x] Issue #190 aberta; plano `Aprovado`; `main` = `origin/main` (`d7533c6`); sem PR aberta; lições lidas.
- [x] `Taxonomia.comDescendentes` (`taxonomia.ts`).
- [x] `classe` e `instituicao` em `PARAMETROS_FILTRO`, `FiltrosAtivos`, `lerFiltros` (com os catálogos), `filtrarAtivos` (com a taxonomia), `algumFiltro` e `camposComFiltro`; `opcoesDeClasse` e `opcoesDeInstituicao` (`filtros-ativos.ts`).
- [x] Grupo "Classe e instituição" no topo do painel, com `ListaSuspensaFiltro`; a página lê os catálogos antes de ler os filtros (`ativos-consulta.tsx`, `ativos/page.tsx`).
- [x] Testes unitários e e2e (`filtros-ativos.test.ts`, `taxonomia.test.ts`, `ativos-consulta.spec.ts`).
- [x] DESIGN.md 6.12, KB-003 e nota da `0.15.0` em `/novidades`; plano `Em Execução` e ciclo `Em execução`.
- [x] Gates locais completos e staging revisado.
- [x] PR #193 publicada com `Closes #190`; merge só depois de "aprovo o merge da PR #193" e checks verdes.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | Unitários 524/524 (inclui os novos de classe, instituição, opções em uso e `comDescendentes`); typecheck sem erros; lint com 0 erros e 3 avisos preexistentes em `local/` (ignorado pelo Git); build passou. E2e sobre o build de produção, Supabase local e Chrome da máquina: `ativos-consulta.spec.ts` 14/14 (9 novos, inclusive sem JavaScript, axe, 44 px e sem rolagem horizontal em 360 e 1280 px). Conjunto afetado (`ativos-consulta`, `ativos-detalhes`, `ativos`, `novidades`, `navegacao`, `seletor-ativo`, `carteira`): 79/79 com um worker. Com dois workers, duas execuções tiveram falhas em arquivos não alterados (`seletor-ativo.spec.ts` "buscar 'acao'", que confere o banco logo depois de um `toHaveURL(/\/lancamentos/)` que já casa com `/lancamentos/novo`, e `carteira.spec.ts` CR-04), que passaram isolados e com um worker; nenhum teste foi alterado para contornar. Banco: sem migração nova, `supabase test db` não aplicável. A CI roda a suíte completa |
| Validador | 48/48 testes de governança; `node scripts/validate-governance.mjs`: 0 erros, 0 avisos |
| `git diff --check` | Passou |
| Checks remotos | Verdes no head `ea0b16a` da PR #193 (lint, tipos, testes, build e e2e de preview; governança; Supabase local, banco e e2e de autenticação; Vercel) |

## Revisão da correção

Não se aplica — trilha normal.

## Decisões incidentais e desvios

- **Catálogos na leitura dos filtros:** `lerFiltros` passou a receber `{ taxonomia, instituicoes }` para conferir os IDs (ID desconhecido é erro, D3), e `filtrarAtivos` recebe a taxonomia para expandir os descendentes. A página lê os catálogos antes de ler os filtros; as leituras são as mesmas que já fazia, apenas em outra ordem.
- **Valores especiais:** `sem_classe` e `sem_instituicao` (e não `nao_informado`), para que cada campo recuse o valor de outro e as mensagens digam "Sem classe" e "Sem instituição" como no plano.
- **Opção de classe em uso:** um ancestral entra quando algum nó da sua subárvore está em uso (usa `comDescendentes`), sem expor o pai de cada nó; os nós só marcados na URL entram sem os ancestrais.
- **Defeito achado no teste local do responsável e corrigido nesta PR:** a dica "Marcar uma classe inclui as subclasses.", que ficava acima da lista Classe, deixava as listas Classe e Instituição em alturas diferentes. A frase passou para o parágrafo de abertura do painel, sem dica nos campos; o e2e agora confere que o resumo das duas listas começa na mesma altura, e o DESIGN.md 6.12 foi ajustado. Depois da correção: unitários 524/524, build ok, `ativos-consulta`, `ativos-detalhes` e `ativos` 41/41 com um worker.
- **E2e:** os testes novos ficaram no mesmo arquivo de `ativos-consulta.spec.ts`, com um segundo usuário fictício, para reaproveitar os auxiliares e manter intactos os totais do primeiro conjunto de dados. O teste sem JavaScript reaproveita a sessão (`storageState`) num contexto com JavaScript desligado, porque o login exige JavaScript.
- **Ambiente de teste:** o Chromium do Playwright não estava instalado; os e2e rodaram com `PLAYWRIGHT_CHANNEL=chrome` (Chrome da máquina), sobre o build de produção e o Supabase local, com as variáveis exportadas só no processo.

## Encerramento

Não se aplica — não é a última issue do ciclo (a #192 traz o encerramento prospectivo).

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 019 (leve)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 019 + implementar_issue + issue-190/BL-020 + d7533c6ae904b3e1379f90028c3e6a5c84c25b8e`
- `effect_class`: `remote_mutation`
- `state_before`: plano v1 `Aprovado`; ciclo 019 em `Planejamento`; issue #190 aberta; `main` = `origin/main` em `d7533c6`; plano e reserva do ciclo ainda sem commit; nenhuma PR aberta.
- `state_after`: branch `feature/issue-190` commitada (`359e0bf`) e publicada; PR #193 aberta com `Closes #190`; plano `Em Execução` e ciclo `Em execução`; gates locais concluídos; aguardando checks remotos e aprovação do merge.
- `result`: `executed`
- `evidence`: PR #193; unitários 524/524; tipos, lint e governança sem erros; e2e de `ativos-consulta.spec.ts` 14/14 e conjunto afetado 79/79 com um worker (tabela de evidências).
- `blockers`: checks remotos e "aprovo o merge da PR #193".
