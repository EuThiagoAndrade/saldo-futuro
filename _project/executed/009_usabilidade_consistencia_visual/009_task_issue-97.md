# Task — Issue #97: Seletor de ativo com busca e ordem alfabética

> **Ciclo:** `009`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `feature`
> **Issue:** `#97`
> **Plano:** `_project/executed/009_usabilidade_consistencia_visual/009_plan.md`
> **Branch:** `feature/issue-97`
> **PR:** [#NNN](https://github.com/EuThiagoAndrade/saldo-futuro/pull/NNN)
> **Integração:** `Pendente — encerramento prospectivo: efetiva após o merge desta PR`
> **Autorização inicial:** "autorizo a implementação da issue #97" em 2026-10-20
> **Modo contínuo:** `—`
> **Início:** 2026-10-20
> **Última atualização:** 2026-10-20
> **handoff_schema_version:** `2`

## Objetivo

Dar aos seletores de ativo de Lançamentos (filtro), Novo lançamento e Nova transferência ordem alfabética pelo nome exibido e busca incremental sem diferenciar maiúsculas nem acentos, com a política de seleção da `v2` aprovada, e encerrar o ciclo 009.

## Escopo autorizado

Item 4 (BL-010) e a estratégia de testes da `v2` aprovada do ciclo 009; issue #97; documentação viva e encerramento prospectivo do ciclo (última issue do leve). Não inclui outros seletores, `ORDENS`, consultas, banco ou dependências.

## Origem no backlog

Snapshot herdado do plano: BL-010, necessidade integral (ordem alfabética uniforme e busca incremental, sem diferenciar maiúsculas nem acentos, nos seletores de ativo de Lançamentos, Novo lançamento e Nova transferência). Fonte `_project/backlog.md` em `811ff840a51da200bdff8f0591e11d9d95fd103f`, já em main. Destino em preparação: ciclo 009; não altera a fila.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

Toda linha é obrigatória. "Não se aplica" exige justificativa. Com G1 ou G2 marcados com "Sim", o modo contínuo não pode estar `ativo`.

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Só apresentação e interação; nenhum cálculo, valor ou período muda |
| G2 — isolamento por RLS | Não | A ordenação ocorre em memória sobre dados já lidos com a sessão do usuário; o componente só emite IDs das opções recebidas e o servidor continua validando (`z.uuid` e funções do banco); nenhuma consulta, política ou acesso muda |
| G3 — privacidade de dados | Sim | Somente usuário e ativos fictícios no Supabase local (`seletor97.comum` com "Fundo Beta", "Ação Fictícia" e "Cofrinho", removido no fim); nenhum dado real, `local/` financeiro ou produção |
| G4 — migrações só acrescentam | Não | Nenhuma migração criada ou alterada |

## Execução

- [x] Autorização, issue #97 aberta, plano `v2` aprovado, #94 a #96 integradas e base `e5f1f1a` (igual a `origin/main`) conferidos; sem branch ou PR anteriores da #97.
- [x] Reconciliação da task #96; `.agent/lessons_learned.md` (alheia ao ciclo) fica fora do staging.
- [x] `src/lib/telas/combobox.ts`: normalização (`NFD`, sem diacríticos, `pt-BR`), ordenação por nome exibido, busca por trecho e a política de seleção como funções puras (confirmação só por clique, toque ou Enter; edição desfaz a seleção; Esc com a lista aberta e fechada; saída sem confirmar; "Todos os ativos" confirmável e texto vazio equivalente; valor inicial da URL; reinício).
- [x] `src/components/combobox-ativo.tsx`: combobox da WAI-ARIA 1.2, ID da opção confirmada num campo oculto com o `name` atual, `setCustomValidity` ("Escolha um ativo da lista." ou a mensagem obrigatória do servidor), mensagem em `loss` com `aria-invalid` e `aria-describedby`, opções de 44 px, escuta do evento `reset` do formulário. Sem dependência nova.
- [x] `opcoesDeAtivo` em `leituras.ts`; filtro de Lançamentos, Novo lançamento e Nova transferência (origem e destino) usam o componente; `ORDENS`, consultas e `name` dos campos intactos.
- [x] Testes: unitários da política (14 casos) e e2e `seletor-ativo.spec.ts` (9 testes); `carteira.spec.ts` ajustado para escolher o ativo pelo componente (helper `apoio/combobox.ts`).
- [x] DESIGN.md §6.8 com o contrato do componente e KB-003 com o resumo do ciclo; o item do ciclo `008` sobre a margem de 144 foi atualizado para a margem comum.
- [x] Suíte completa e governança.
- [x] Publicar a PR com o encerramento prospectivo.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| `npm run lint` | 0 erros; três avisos preexistentes em script ignorado de validação local (`local/`) |
| `npm run typecheck` | Passou |
| `npm test` | 319/319 (26 arquivos); inclui `combobox.test.ts` (14 casos) |
| Build | Passou, pelo `webServer` do Playwright |
| E2e específico | `seletor-ativo.spec.ts` 9/9 |
| E2e completo | Backend local: 145 passaram, 8 pulados (preview sem backend e suítes opt-in) e 1 falha de infraestrutura: o worker do teste "carteira com mais de 1.000 eventos" (`migracao.spec.ts`) encerrou com o código nativo 3221226505 do Windows, a mesma ressalva do ciclo 008; o teste isolado passou (1/1) |
| Governança | `node --test scripts/validate-governance.test.mjs` 48/48; `node scripts/validate-governance.mjs` com 0 erros, 0 avisos e cinco itens manuais |
| `git diff --check` | Passou |
| Checks remotos | Pendente |

O e2e cobre, no navegador real: ordem alfabética nos três seletores ("Todos os ativos" no topo do filtro; "Em trânsito" na ordem); busca `ACAO` encontrando "Ação Fictícia" e o lançamento gravado no ativo certo; duas transferências consecutivas, com o reset depois do sucesso, gravando origem e destino de cada uma; selecionar A, editar para B e enviar (bloqueado, valor oculto vazio, `aria-invalid`, mensagem "Escolha um ativo da lista."); apagar um campo obrigatório ("Escolha o ativo de origem."); Esc com a lista aberta e fechada; saída por Tab; teclado (setas, Home, End, Enter) e atributos do padrão combobox; filtro com ativo da URL, retorno a "Todos os ativos", ID desconhecido e envio; alvo de 44 px, foco visível e axe (WCAG 2.2 AA) em 360 e 1280 px, com a lista aberta, nas três telas; toque emulado no celular. Verificação manual com leitor de tela não foi feita nesta sessão; o axe automatizado passou.

## Revisão da correção

Não se aplica (trilha normal).

## Decisões incidentais e desvios

- O projeto não tem jsdom nem biblioteca de testes de componente, e o plano veda dependência nova. A política de seleção foi isolada em funções puras (`combobox.ts`), testadas por unidade; a ligação com o DOM (foco, reset, validade, teclado, toque) é provada pelo e2e. Isso substitui os "testes de componente" do plano sem nova dependência.
- O filtro de Lançamentos passa a depender de JavaScript para a busca (risco declarado no plano). Antes da hidratação o campo não envia valor.
- No e2e, `getByRole("option")` também casa as opções dos `select` nativos; os testes e o helper escolhem as opções dentro do `listbox`.
- Os testes de `carteira.spec.ts` que usavam `selectOption` nos seletores de ativo passaram a usar o helper `escolherAtivo`.
- Sem mudança de banco, autenticação, schema, cálculo ou dependências.

## Encerramento

Encerramento prospectivo autorizado pela aprovação da `v2` e preparado nesta última entrega:

- [x] PR #98, #99 e #100 integradas e as issues #94, #95 e #96 fechadas, cada uma com aprovação específica e checks verdes.
- [x] Item 4 implementado e critérios comprovados nas evidências acima; o e2e completo teve uma falha de infraestrutura do runner Windows, com o teste isolado aprovado.
- [x] DESIGN.md §6.8 e §6.9 e KB-003 consolidam o contrato do seletor, os estados dos botões, os campos de intervalo e a margem comum; nenhuma nova regra financeira ou ADR.
- [x] Plano Concluído, tasks Concluída, pasta em `executed/` e `cycles.md` Concluído como estado prospectivo após o merge desta PR.
- [x] Histórico de aprovação, revisão, origem e evidências preservado; nenhum SHA do próprio merge na task.
- [x] Publicar a PR #NNN com o encerramento prospectivo.
- [ ] Conferir checks remotos verdes e obter aprovação específica do merge.

Antes da integração, a situação efetiva é Aguardando merge. O retorno de BL-013, BL-004, BL-003 e BL-010 à fila só vale depois da integração comprovada do ciclo (cobertura integral prevista para os quatro, com a exceção R2-1 de BL-004 declarada); a publicação desse retorno continua separada e exige autorização própria. Nenhuma ação em produção ou release é parte desta entrega.

## Próximo passo

Encerramento prospectivo: antes do merge da [PR #NNN](https://github.com/EuThiagoAndrade/saldo-futuro/pull/NNN), a situação efetiva é Aguardando merge. Checks e diff devem estar conferidos antes da frase "aprovo o merge da PR #NNN".

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 009 (leve)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 009 + implementar_issue + 97/Item-4-BL-010 + e5f1f1a`
- `effect_class`: `remote_mutation`
- `state_before`: plano `v2` Em Execução, ciclo Em execução, #94 a #96 integradas, #97 aberta sem task nem branch, sem modo contínuo.
- `state_after`: encerramento prospectivo preparado: plano Concluído, tasks Concluída, pasta em `executed/`, `cycles.md` Concluído, DESIGN.md e KB-003 atualizados; antes da integração desta PR, situação efetiva Aguardando merge.
- `result`: `executed`
- `evidence`: autorização desta task; validações da tabela de evidências; `git fetch` com `main` igual a `origin/main` em `e5f1f1a`; consulta prévia sem PR da #97; task #96 reconciliada com a PR #100.
- `blockers`: nenhum no escopo; checks remotos verdes e aprovação específica do merge pendentes; retorno ao backlog e sua publicação dependem de autorização separada.
