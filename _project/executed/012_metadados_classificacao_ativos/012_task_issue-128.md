# Task — Issue #128: Registrar instituição, classe e detalhes no ativo (BL-009)

> **Ciclo:** `012`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `feature`
> **Issue:** `#128`
> **Plano:** `_project/executed/012_metadados_classificacao_ativos/012_plan.md`
> **Branch:** `feature/issue-128`
> **PR:** [#132](https://github.com/EuThiagoAndrade/saldo-futuro/pull/132) (`Closes #128`)
> **Integração:** PR #132 integrada por squash (`99b792b33a2ad5c7c47f3605ed26f544dcdd1e7f`) em 2026-10-24; issue #128 fechada como concluída; verificação em produção e release `0.9.0` concluídas
> **Autorização inicial:** "autorizo a implementação da issue #128" em 2026-10-23
> **Modo contínuo:** `—`
> **Início:** 2026-10-23
> **Última atualização:** 2026-10-24
> **handoff_schema_version:** `2`

## Objetivo

Permitir registrar e editar classe, instituição e os quatro indicadores de cada ativo, com seletores que cadastram ali mesmo, e mostrar classe e instituição nas duas abas de Ativos, conforme o item 3 do plano.

## Escopo autorizado

Item 3 do plano: seletor com criação, campos no cadastro, `/ativos/[id]/editar` (também para desativados), exibição nas duas abas, `lerAtivos` com as colunas novas, DESIGN.md 6.7 e 6.8 (inclusive o renomear em linha da #127), KB-003, KB-004 (4.1) e a nota da `0.9.0`. Fora: editar nome ou tipo de ajuste, filtros ou agrupamentos por classe ou instituição, cálculo com os campos, carga retroativa e mudança no seletor de ativo.

## Origem no backlog

Herdada do plano: BL-009, parcela parcial (campos descritivos), `_project/backlog.md` no commit da fila `5298473` (publicado em `main`). Destino em preparação; nenhum item do backlog é alterado nesta entrega.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não se aplica; conferido | Nenhum arquivo de `src/lib/financeiro/` muda; busca por `instituicao`, `classe`, `previdencia`, `liquidez`, `exposicao` e `isento` em `src/lib/financeiro/` não encontra referência; os casos de referência e os testes financeiros existentes passam inalterados. A KB-004 (4.1) registra que nenhuma regra lê os campos. |
| G2 — isolamento por RLS | Sim, pelo uso das funções | O cadastro chama `cadastrar_ativo` e a edição `editar_detalhes_ativo`, cujo isolamento (ativo-alvo, entradas e referências de outro usuário) está provado na #126. A leitura é só com a sessão do usuário. O e2e confere que outro usuário recebe "Ativo não encontrado" na edição do ativo do primeiro. Nenhuma tabela, política ou função nova. |
| G3 — privacidade de dados | Sim | Testes só com e-mails em `example.com` e nomes inventados ("Banco Exemplo", "Corretora Fictícia", "CDB fictício"). Nenhum dado real; `local/` não foi aberto. |
| G4 — migrações só acrescentam | Não se aplica | Nenhuma migração nesta entrega. |

## Execução

- [x] Branch `feature/issue-128` a partir de `main` em `f365ff4`.
- [x] Política do seletor (`src/lib/telas/combobox.ts`): `identidade` (a mesma regra do banco), opção "Cadastrar «texto»" quando nenhuma opção tem a mesma identidade e `nomeNovoEnviado`; mensagem do texto fora da lista parametrizável.
- [x] Componente do seletor (`combobox-ativo.tsx`): `nomeNovo` (segundo campo oculto), textos de recusa e de lista vazia; o seletor de ativo segue igual.
- [x] `src/lib/telas/detalhes-ativo.ts`: leitura pura dos campos descritivos do formulário, com recusas em português.
- [x] `/ativos/novo`: Classe, Instituição e "Mais detalhes" com os quatro indicadores; a ação passa a chamar `cadastrar_ativo`.
- [x] `/ativos/[id]/editar` e `editarAtivo`: só os campos descritivos; volta à aba de origem; trânsito e ativo inexistente sem formulário.
- [x] `/ativos`: colunas Classe e Instituição no desktop, segunda linha no celular e "Editar" nas duas abas.
- [x] DESIGN.md 6.7 e 6.8 (seletor com criação, "Mais detalhes", rádio de três estados, renomear em linha), KB-003, KB-004 (4.1) e nota da `0.9.0`.
- [x] Unitários (`combobox.test.ts`, `detalhes-ativo.test.ts`, `novidades.test.ts`) e e2e (`ativos-detalhes.spec.ts`).

## Evidências

| Validação | Resultado |
| :-- | :-- |
| `npm run lint` | Sem erros; 3 avisos preexistentes em arquivo ignorado de `local/`, iguais em `main` |
| `npm run typecheck` | Passou |
| `npm test` | 32 arquivos, 371 testes, todos passando |
| `npm run build` | Passou, com o Supabase local |
| `npx supabase test db` | 8 arquivos, 342 asserções, `PASS` (sem mudança de banco) |
| `npm run test:e2e` (com Supabase local) | Suíte completa sobre o build: 189 passaram, 12 ignorados, 1 instável e 2 falhas. (1) `ativos-detalhes`, "texto fora da lista...": apagar o texto do seletor reabre a lista inteira, que cobria o botão de envio no teste; corrigido no teste com Esc antes do envio (o comportamento do seletor é o mesmo do seletor de ativo, DESIGN.md 6.8). (2) `migracao.spec`, "carteira com mais de 1.000 eventos": o processo do Playwright terminou com o código do Windows 0xC0000409, sem falha de asserção, e o teste seguinte da mesma suíte foi instável pelo mesmo motivo. Repetidos `ativos-detalhes` e `migracao.spec` juntos: 32 de 32 |
| Conferência visual | Prévia local com usuário fictício: cadastro a 375 px com "Cadastrar «Corretora Nova»", "Mais detalhes" aberto, lista com classe e instituição no celular e no desktop e a edição com o seletor preenchido e "Mais detalhes" aberto por haver indicador informado |
| Validador | `node --test scripts/validate-governance.test.mjs` 48/48; `node scripts/validate-governance.mjs` sem erros |
| `git diff --check` | Sem erros |
| Checks remotos | Pendente |

## Verificação em produção

- **Autorização:** "autorizo a verificação em produção do ciclo 012" em 2026-10-24, depois do merge da PR #132 (squash `99b792b33a2ad5c7c47f3605ed26f544dcdd1e7f`, todos os checks verdes).
- **Deploy:** o deploy de produção mais recente no GitHub é o do `99b792b`, com estado `success`.
- **Leitura pública pelo agente, sem sessão, no domínio de produção:** `/cadastros`, `/cadastros?aba=classes`, `/ativos/novo` e `/ativos/<id>/editar` respondem 307 para `/entrar`; `/entrar` responde 200; uma rota inexistente responde 404, o que mostra que as rotas novas existem no build publicado. Passou.
- **Conferência autenticada do responsável, em resposta às perguntas expressas (2026-10-24):** classes iniciais em Cadastros — sim; ativo com classe, instituição cadastrada ali mesmo e indicador — sim; edição de ativo desativado — sim; lista no celular com os campos — sim. Sem limitações relatadas. Verificação em produção concluída.

## Release 0.9.0

- **Preparação:** "Pode preparar a PR #130: retire o closes da #126 da descrição, dispare os checks por workflow_dispatch na branch da release e aprove as execuções pendentes." em 2026-10-24. O trecho "closes #126" saiu da descrição (a #126 fecha pela PR de encerramento); CI e Governance rodaram por `workflow_dispatch` na branch da release; as duas execuções automáticas da PR, em "aprovação necessária" por ser PR do bot do GitHub Actions, foram aprovadas. Todos verdes no HEAD `7aa7b90`.
- **Merge:** "aprovo o merge da PR #130" em 2026-10-24. Squash `f5b2be822445834149f6326f8157dcada2137fed`; a issue #126 continua aberta.
- **Tag e release:** `v0.9.0` aponta para `f5b2be8`; release publicada, sem rascunho, em 2026-10-25T02:58:29Z, que é 2026-10-24 às 22:58 em America/Cuiaba. Esta é a data civil a gravar em `src/lib/novidades.ts` no encerramento.

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

- **Segunda linha no celular omite o não informado.** O plano diz que valor ausente aparece como "—"; isso vale para as colunas da tabela. Na segunda linha da lista densa, um "—" por campo encompridaria a linha sem informação; ela traz só o que foi informado (por exemplo, "Rendimento · Fundos"). Registrado no DESIGN.md 6.7.
- **Componente do seletor.** Em vez de um componente novo, `ComboboxAtivo` ganhou `nomeNovo` e textos parametrizáveis, com os padrões do seletor de ativo; os usos existentes não mudam.
- **Renomear em linha no DESIGN.md.** A proposta registrada na task da #127 foi aplicada aqui, no 6.8.

## Encerramento

Não se aplica. O encerramento do ciclo completo vai em PR própria, depois da verificação em produção e da release `0.9.0`.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 012 (completo)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 012 + atualizar_docs + 128/encerramento + f5b2be822445834149f6326f8157dcada2137fed`
- `effect_class`: `local_mutation`
- `state_before`: PR #132 aberta, "Aguardando merge".
- `state_after`: PR #132 integrada (`99b792b`), issue #128 fechada; verificação em produção e release `0.9.0` registradas; task `Concluída`.
- `result`: `executed`
- `evidence`: PR #132 e PR #130 `MERGED`; tag `v0.9.0` em `f5b2be8`; seções "Verificação em produção" e "Release 0.9.0".
- `blockers`: nenhum.
