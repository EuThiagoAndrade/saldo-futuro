# Task — Issue #127: Cadastrar instituições e classes de ativos (BL-009)

> **Ciclo:** `012`
> **Trilha:** `normal`
> **Estado:** `Aguardando integração`
> **Tipo:** `feature`
> **Issue:** `#127`
> **Plano:** `_project/drafts/012_metadados_classificacao_ativos/012_plan.md`
> **Branch:** `feature/issue-127`
> **PR:** [#131](https://github.com/EuThiagoAndrade/saldo-futuro/pull/131) (`Closes #127`)
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #127" em 2026-10-23
> **Modo contínuo:** `—`
> **Início:** 2026-10-23
> **Última atualização:** 2026-10-23
> **handoff_schema_version:** `2`

## Objetivo

Dar ao usuário as telas para incluir, rever, renomear e excluir as próprias instituições e classes de ativo, conforme o item 2 do plano.

## Escopo autorizado

Item 2 do plano, com a emenda E-1 de 2026-10-23: rota `/cadastros` com as abas "Instituições" e "Classes", destino "Cadastros" em Mais e no menu lateral, leituras, ações com `zod`, mensagens das recusas novas, DESIGN.md 6.1 e 6.12, KB-003 (navegação), unitários e e2e. Fora: campos no cadastro, edição e lista do ativo (issue #128), outras mudanças de navegação e qualquer cálculo com os campos.

## Origem no backlog

Herdada do plano: BL-009, parcela parcial (campos descritivos), `_project/backlog.md` no commit da fila `5298473` (publicado em `main`). Destino em preparação; nenhum item do backlog é alterado nesta entrega.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não se aplica | Nenhuma regra de cálculo muda; nenhum arquivo de `src/lib/financeiro/` é alterado e nenhum cálculo lê instituições ou classes. Testes e casos de referência existentes passam inalterados. |
| G2 — isolamento por RLS | Sim, pelo uso das funções | As telas só leem com a sessão do usuário (RLS) e só escrevem pelas funções `criar_/renomear_/excluir_instituicao` e `criar_/renomear_/excluir_classe`, cujo isolamento foi provado na issue #126. O e2e confere que outro usuário não vê as entradas do primeiro. Nenhuma tabela, política ou função nova. |
| G3 — privacidade de dados | Sim | Testes só com e-mails em `example.com` e nomes inventados ("Banco Exemplo", "Corretora Fictícia"). Nenhum dado real; `local/` não foi aberto. |
| G4 — migrações só acrescentam | Não se aplica | Nenhuma migração nesta entrega. |

## Execução

- [x] Branch `feature/issue-127` a partir de `main` em `6abbb01`, com o registro local da ação externa da #126.
- [x] `src/lib/telas/catalogos.ts`: textos das duas telas, ordem alfabética pt-BR e contagem de uso pelos ativos (em uso ou desativados).
- [x] `src/lib/leitura.ts` e `src/lib/telas/leituras.ts`: ordem total de `instituicoes` e `classes_ativo` e leituras das entradas e dos vínculos dos ativos.
- [x] `src/lib/telas/acoes-catalogo.ts` e as ações de cada rota: incluir, renomear e excluir só pelas funções do banco, com `zod` e sessão conferida primeiro; mensagens novas em `mensagemDeRecusa`.
- [x] `src/components/pagina-catalogo.tsx` e `src/components/formularios/catalogo.tsx`: inclusão no topo, lista densa, renomear em linha e exclusão pela confirmação de ação destrutiva; com vínculo, Excluir desabilitado com a explicação ao lado.
- [x] ~~Links "Instituições" e "Classes" no topo de `/ativos`.~~ Substituído pela emenda E-1 (ver "Decisões incidentais e desvios").
- [x] Emenda E-1: `/cadastros` com abas por URL (`src/app/(app)/cadastros/`), destino "Cadastros" em Mais e no menu lateral com ícone próprio, links retirados de `/ativos` (igual a `main`), DESIGN.md 6.1 e 6.12, KB-003 e e2e `cadastros.spec.ts` e `navegacao.spec.ts`.
- [x] Unitários (`catalogos.test.ts`) e e2e (`cadastros.spec.ts`, antes `ativos-catalogos.spec.ts`).

## Evidências

| Validação | Resultado |
| :-- | :-- |
| `npm run lint` | Sem erros; 3 avisos preexistentes em arquivo ignorado de `local/`, iguais em `main` |
| `npm run typecheck` | Passou |
| `npm test` | 31 arquivos, 362 testes, todos passando (4 novos em `catalogos.test.ts`) |
| `npm run build` | Passou (build do Playwright, com o Supabase local) |
| `npx supabase test db` | 8 arquivos, 342 asserções, `PASS` (sem mudança de banco) |
| `npm run test:e2e` (com Supabase local) | Depois da emenda E-1, sobre o build de produção: 188 passaram, 12 ignorados (condicionais do ambiente) e 1 instável — o mesmo "as páginas da entrega não têm violações de acessibilidade em 360 px" da #126, que excedeu 30 s e passou na repetição. Uma tentativa contra o servidor de desenvolvimento falhou no login de todos os testes (o servidor de desenvolvimento não hidrata a página acessada por `127.0.0.1`, que o Playwright usa) e foi descartada por ser do ambiente |
| Conferência visual | Prévia local com usuário fictício: primeira versão (Instituições e Classes em Ativos) e, depois da emenda E-1, `/cadastros` com as duas abas a 375 px e a folha "Mais" com Cadastros depois de Transferências |
| Teste do responsável | Em 2026-10-23, o responsável testou localmente por `http://localhost:3000/` e relatou: "Fiz os teste localmente por http://localhost:3000/ e passou." |
| Validador | `node --test scripts/validate-governance.test.mjs` 48/48; `node scripts/validate-governance.mjs` sem erros |
| `git diff --check` | Sem erros |
| Checks remotos | Pendente |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

- **Emenda E-1 (2026-10-23).** Depois de testar localmente a primeira versão desta PR, o responsável apontou que Instituições e Classes dentro de Ativos confundem o usuário no celular, porque as instituições não são ativos. A mudança foi registrada como emenda do plano ("Faça uma emenda registrada no plano (recomendo).") e aplicada nesta mesma PR, antes do merge: destino "Cadastros" em Mais, logo depois de Transferências, e no menu lateral, com as abas "Instituições" (padrão) e "Classes" (`?aba=classes`). Nome e posição seguem a proposta apresentada, sem objeção do responsável. Banco, regras e isolamento não mudam.
- **Cache do servidor de desenvolvimento.** Depois de trocar a chave `rota` por `aba` em `catalogos.ts`, o servidor de desenvolvimento em execução continuou servindo a versão antiga do módulo (link de aba sem destino); reiniciá-lo resolveu. Não afeta build nem produção.

- **Renomear em linha.** O plano deixava "formulário em linha ou diálogo, conforme DESIGN.md", e o DESIGN.md não tem padrão para edição de um nome. A entrega usa só elementos existentes (campo de 6.8, botões de 6.9): "Renomear" abre o campo com o nome atual e o foco nele; "Salvar nome" envia; "Cancelar" ou Esc fecham sem enviar e devolvem o foco ao botão. Proposta: registrar esse uso no DESIGN.md na issue #128, que já emenda 6.7 e 6.8.
- **Uso conta ativos desativados.** O banco recusa excluir uma entrada usada por qualquer ativo, inclusive desativado; a tela conta do mesmo jeito ("Usada em N ativos") e explica a recusa antes do clique.
- **Ações compartilhadas.** As duas rotas têm `acoes.ts` próprios, como o plano propõe, mas delegam a `acoes-catalogo.ts`, que concentra validação, chamada da função e revalidação.

## Encerramento

Não se aplica.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 012 (completo)
Quem: Responsável
Conferir: Checks e diff da PR #131 (https://github.com/EuThiagoAndrade/saldo-futuro/pull/131)
Diga: "aprovo o merge da PR #131"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 012 + implementar_issue + 127 + 6abbb01980b7453af1179ea07d7769cc896021d8`
- `effect_class`: `remote_mutation`
- `state_before`: issue #127 aberta; ação externa da #126 concluída; sem branch nem task.
- `state_after`: branch `feature/issue-127` publicada e PR #131 aberta com `Closes #127`; task `Aguardando integração`.
- `result`: `executed`
- `evidence`: "Evidências" acima; diff da PR #131.
- `blockers`: merge pendente de checks verdes e de "aprovo o merge da PR #131".
