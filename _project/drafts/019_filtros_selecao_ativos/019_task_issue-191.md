# Task — Issue #191: Seletor compartilhado de ativos em lançamentos e transferências (BL-022)

> **Ciclo:** `019` (trilha curta: `—`)
> **Trilha:** `normal`
> **Estado:** `Aguardando integração`
> **Tipo:** `feature`
> **Issue:** `#191`
> **Plano:** `_project/drafts/019_filtros_selecao_ativos/019_plan.md`
> **Branch:** `feature/issue-191`
> **PR:** https://github.com/EuThiagoAndrade/saldo-futuro/pull/195
> **Integração:** `Pendente` (PR #195 aberta; checks remotos e aprovação do merge)
> **Autorização inicial:** "Autorizar #191" em 2026-11-05, em resposta à pergunta "Autoriza a implementação da issue #191?"
> **Modo contínuo:** `—`
> **Início:** 2026-11-05
> **Última atualização:** 2026-11-05
> **handoff_schema_version:** `2`

## Objetivo

Entregar o Item 2 do plano aprovado (BL-022): extrair os campos do "Filtrar" de `/ativos` para um componente em dois modos e criar o seletor de ativo com filtros, com opções que mostram nome, instituição e classe, usado em Novo lançamento e, de forma independente, para origem e destino em Transferências (D5 a D7, R1-1 e R1-2).

## Escopo autorizado

`CamposDoFiltro` em modo `url` (formulário GET de `/ativos`, sem mudar o comportamento) e `formulario` (sem `name`, dentro de outro formulário); `SeletorDeAtivo` sobre `ComboboxAtivo` e `combobox.ts`, com segunda linha por opção e painel "Filtrar ativos" recolhido; páginas de Novo lançamento e Transferências lendo taxonomia, classes legadas e instituições com os leitores existentes; opções do filtro só sobre os ativos selecionáveis do formulário; "Em trânsito" com segunda linha própria; campos condicionais inativos do prazo ignorados nos formulários; ajustes dos auxiliares e specs e2e afetados; DESIGN.md 6.8 e 6.12, KB-003 e a nota da `0.15.0`. Fora: filtro "Ativo" de Lançamentos, seletores do formulário do ativo, busca por instituição ou classe, banco e cálculo; retorno da edição e faixa do prazo (issue #192).

## Origem no backlog

Herdada do plano: BL-022 (integral), com o snapshot de `_project/backlog.md` no commit `d7533c6ae904b3e1379f90028c3e6a5c84c25b8e`, presente em `main`. Destino em preparação; o item continua Disponível, e o retorno é registrado na fila só depois da integração comprovada do ciclo, por `ciclo 019`.

## Elegibilidade da trilha curta

Não se aplica — trilha normal, Item 2 do ciclo leve.

## Barreiras de domínio

Toda linha é obrigatória. "Não se aplica" exige justificativa. Com G1 ou G2 marcados com "Sim", o modo contínuo não pode estar `ativo`.

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não se aplica | Só filtragem e apresentação de ativos já lidos; nenhuma regra de eventos, fechamento, consolidação, retorno ou benchmark. O lançamento e a transferência continuam validados pelo servidor e pelo banco, e só o ID do ativo confirmado é enviado |
| G2 — isolamento por RLS | Não se aplica | Sem tabela, política, função ou leitor novo: as duas páginas passam a usar `lerNosDaTaxonomia` (mesma consulta de `lerTaxonomia`), `lerClassesLegadas` e `lerInstituicoes`, com a sessão do usuário. O seletor só emite IDs das opções recebidas, e o servidor continua validando o ativo |
| G3 — privacidade de dados | Sim | Testes unitários e e2e só com nomes, instituições e IDs fictícios (usuário e dados criados e removidos pelo próprio teste); nada de `local/` lido; os filtros ficam em estado do navegador, não na URL nem em armazenamento |
| G4 — migrações só acrescentam | Não se aplica | Nenhuma migração nesta entrega |

## Execução

- [x] Issue #191 aberta; #190 integrada (PR #193, `8963b25`); `main` = `origin/main`; sem outra PR de código aberta (a PR de release #194 contém a #190); plano `Em Execução`; lições lidas.
- [x] Task da #190 reconciliada (`Concluída`).
- [x] `lerNosDaTaxonomia` (`leituras.ts`); `ListaSuspensa` com `nome` opcional e `aoMudar` no filtro.
- [x] `src/lib/telas/seletor-ativo.ts`: `ativosDoSeletor` (segunda linha), `opcoesDoSeletor`, `opcoesDoFiltro`, `parametrosEfetivos` (R1-2); `Opcao.detalhe` em `combobox.ts`.
- [x] `CamposDoFiltro` (`campos-do-filtro.tsx`), usado por `/ativos` (modo `url`) e pelo seletor (modo `formulario`); `ativos-consulta.tsx` e a página de Ativos passam a usá-lo.
- [x] `SeletorDeAtivo` (`seletor-de-ativo.tsx`) e segunda linha em `ComboboxAtivo`; Novo lançamento e Transferências (origem e destino).
- [x] Testes unitários e e2e (`seletor-ativo.test.ts`, `seletor-filtros.spec.ts`, ajustes em `seletor-ativo.spec.ts`); DESIGN.md 6.8 e 6.12, KB-003 e nota da `0.15.0`.
- [x] Gates locais completos e staging revisado.
- [x] PR #195 publicada com `Closes #191`; merge só depois de "aprovo o merge da PR #195" e checks verdes.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | Unitários 537/537 (13 novos: segunda linha, filtros, opções em uso sobre os selecionáveis, prazo inativo, política de seleção); typecheck sem erros; lint com 0 erros e 3 avisos preexistentes em `local/` (ignorado pelo Git); build passou. E2e sobre o build de produção, Supabase local e Chrome da máquina, com um worker: `seletor-filtros.spec.ts` 9/9 (novo; homônimos, filtros, ID enviado, nada do filtro no envio, origem e destino independentes, reset, prazo, Enter, axe, 44 px e sem rolagem horizontal em 360 e 1280 px); conjunto afetado (`seletor-filtros`, `seletor-ativo`, `carteira`, `botoes`, `navegacao`, `navegacao-desempenho`, `ativos-consulta`, `ativos-detalhes`, `ativos`, `novidades`): 96 passed, 3 skipped. Banco: sem migração nova, `supabase test db` não aplicável. A CI roda a suíte completa |
| Validador | 48/48 testes de governança; `node scripts/validate-governance.mjs`: 0 erros, 0 avisos |
| `git diff --check` | Passou |
| Checks remotos | Em execução na PR #195 |

## Revisão da correção

Não se aplica — trilha normal.

## Decisões incidentais e desvios

- **Nome acessível e descrição da opção (R1-1):** a segunda linha é a descrição (`aria-describedby`) e o nome acessível da opção continua sendo só o nome (`aria-labelledby`). Assim `getByRole("option", { name, exact })`, usado por `escolherAtivo` (inclusive em `carteira.spec.ts`), continua valendo sem mudança. Foram ajustados só os trechos de `seletor-ativo.spec.ts` que liam o texto inteiro das opções (`allTextContents` e `toHaveText`).
- **Classe na segunda linha (R1-1):** o nome do nó (`classeDoAtivo`, como a lista de `/ativos`), não o caminho completo; o caminho continua nas opções do filtro. Declarado no DESIGN.md 6.8.
- **Árvore da taxonomia no navegador:** `Taxonomia` tem funções e não serializa. As páginas passam os nós (`lerNosDaTaxonomia`, que valida a árvore com `montarTaxonomia`) e o seletor os remonta. A consulta é a mesma de `lerTaxonomia`.
- **Estado do filtro:** os campos do filtro são não controlados e sem `name`; o seletor guarda só os valores para calcular a lista. "Limpar filtros" e o reset do formulário trocam a chave do painel para recriar os campos e levam o foco ao resumo.
- **R1-2 (prazo):** nos formulários, Comparação, Dias e Unidade são ignorados quando a situação não é "Prazo em dias" (`parametrosEfetivos`), então o valor residual dos campos ocultos não gera erro. Na URL de `/ativos`, o parâmetro avulso continua recusado; o tratamento do painel GET fica para a issue #192, conforme o plano. Enter no campo de dias não envia o formulário que contém o seletor.
- **Ordem dos homônimos:** nomes iguais mantêm a ordem recebida (política de 6.8, mantida); no e2e, cada um é identificado pela segunda linha, sem depender da ordem.
- **Release 0.15.0 aberta (PR #194):** já traz a #190. A nota desta PR foi acrescentada à entrada `0.15.0` (`publicadaEm: null`); a release `0.15.0` só deve ser integrada depois das PRs desta issue e da #192, como em ciclos anteriores. Se for integrada antes, a nota precisa passar para a `0.16.0` (parada para conciliar, conforme o plano).
- **Frase de abertura removida dos painéis (pedido do responsável no teste local):** a frase sobre "ou", "e", subclasses e o trânsito (e, nos seletores, sobre a seleção continuar escolhida) foi retirada de todos os filtros, em `/ativos` e nos seletores, por ocupar muito espaço no celular. A divisória horizontal que a seguia também saiu: os grupos usam `first-of-type` (e não `first-child`) para não ter divisória acima do primeiro grupo, mesmo com o campo oculto da aba antes dele. Isso substitui o aviso do trânsito que o plano previa nos painéis (riscos, "Trânsito sob filtro"); a regra continua valendo e está no DESIGN.md. Os e2e conferem a ausência da frase e `border-top` de 0 no primeiro grupo (59 passed nos cinco arquivos afetados, um worker).
- **Nome do painel na transferência (pedido do responsável no teste local):** os dois painéis eram "Filtrar ativos", indistinguíveis na tela e para leitor de tela. `SeletorDeAtivo` ganhou `rotuloDoFiltro` (padrão "Filtrar ativos"); Transferências usa "Filtrar origem" e "Filtrar destino", e Novo lançamento continua com "Filtrar ativos". O e2e confere os dois nomes e que "Filtrar ativos" não aparece na transferência (50 passed em `seletor-filtros`, `seletor-ativo`, `carteira`, `botoes` e `navegacao`, um worker).
- **Ambiente de teste:** Chrome da máquina (`PLAYWRIGHT_CHANNEL=chrome`), sobre o build e o Supabase local, com variáveis exportadas só no processo. Uma execução teve `ERR_CONNECTION_REFUSED` do servidor de teste (comportamento já registrado em ciclos anteriores no Windows) e passou ao repetir; nenhum teste foi alterado para contornar.

## Encerramento

Não se aplica — não é a última issue do ciclo (a #192 traz o encerramento prospectivo).

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 019 (leve)
Quem: Responsável
Conferir: Checks e diff da PR ([PR #195](https://github.com/EuThiagoAndrade/saldo-futuro/pull/195))
Diga: "aprovo o merge da PR #195"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 019 + implementar_issue + issue-191/BL-022 + 8963b257aa5280451498f69484d7c2f8164dfc2b`
- `effect_class`: `remote_mutation`
- `state_before`: plano v1 `Em Execução`; issue #191 aberta; #190 integrada em `main` (`8963b25`); task da #190 ainda `Aguardando integração`; PR de release #194 aberta.
- `state_after`: branch `feature/issue-191` commitada (`d8027dc`) e publicada; PR #195 aberta com `Closes #191`; task da #190 reconciliada; gates locais concluídos; aguardando checks remotos e aprovação do merge.
- `result`: `executed`
- `evidence`: PR #195; unitários 537/537; tipos, lint e governança sem erros; e2e dos arquivos afetados 96 passed e 3 skipped, `seletor-filtros.spec.ts` 9/9.
- `blockers`: checks remotos e "aprovo o merge da PR #195".
