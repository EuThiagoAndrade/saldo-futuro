# Task — Issue #106: Separar cadastro e organizar ativos por abas

> **Ciclo:** `010`
> **Trilha:** `normal`
> **Estado:** `Em andamento`
> **Tipo:** `feature`
> **Issue:** `#106`
> **Plano:** `_project/drafts/010_novidades_privacidade_ativos_distribuicao/010_plan.md`
> **Branch:** `feature/issue-106`
> **PR:** —
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #106" em 2026-10-21
> **Modo contínuo:** `—`
> **Início:** 2026-10-21
> **Última atualização:** 2026-10-21
> **handoff_schema_version:** `2`

## Objetivo

Encurtar a tela de ativos: ação Novo ativo no topo, cadastro em `/ativos/novo` e listas em abas "Em uso" e "Desativados" lidas pela URL, com contadores e lista densa no celular.

## Escopo autorizado

Item 3 (BL-006) do plano `v2` aprovado do ciclo 010 e issue #106. Não inclui a issue #107, a PR do release-please (#109), reativação de ativos, busca ou paginação novas, estado cliente das abas nem mudança das regras de criação, desativação ou RLS.

## Origem no backlog

Snapshot herdado do plano: BL-006, parcela integral (tela de ativos com botão "Novo ativo" no topo, cadastro em rota dedicada `/ativos/novo` e abas "Em uso" e "Desativados" com contadores e lista densa no celular). Fonte `_project/backlog.md` no commit `49a1332c8bc869d3b8dd148baf387de869288307`, já em main. Destino em preparação: ciclo 010; não altera a fila.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

Toda linha é obrigatória. "Não se aplica" exige justificativa. Com G1 ou G2 marcados com "Sim", o modo contínuo não pode estar `ativo`.

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Organização da tela e rota de cadastro; nenhum cálculo, saldo ou regra da KB-004 alterada |
| G2 — isolamento por RLS | Não | Sem tabela, política ou função nova; `criar_ativo` e `desativar_ativo` continuam pelas RPCs com a sessão do usuário, e `/ativos/novo` usa `exigirSessao`. O teste de isolamento da carteira segue no e2e; regressões de banco executadas |
| G3 — privacidade de dados | Sim | Nomes de ativos e contas fictícios nos testes; sem leitura de `local/` ou produção |
| G4 — migrações só acrescentam | Não | Nenhuma migração criada ou alterada |

## Execução

- [x] Autorização, issue #106 aberta, plano `v2` Em Execução, PR #110 da #105 integrada e base `74d36d0` igual a `origin/main` conferidas; sem branch ou PR anteriores da #106. PR #109 do release-please continua fora do escopo.
- [x] Reconciliação da task #105 e do índice de ciclos.
- [x] `criarAtivo` revalida e redireciona para `/ativos` depois da RPC; validação e recusa da RPC voltam antes, sem captura do redirect. `FormNovoAtivo` perdeu o título próprio e o reset do cadastro embutido; a recusa continua em `Retorno`.
- [x] `/ativos/novo` em `(app)`, com `exigirSessao`, título, "Voltar para Ativos" e o formulário; destino Ativos ativo na navegação.
- [x] `/ativos`: Novo ativo (principal) no topo; abas "Em uso" e "Desativados" como links em `nav` rotulado, com `aria-current`, contadores em etiqueta neutra e só a lista selecionada em `#ativos-da-aba`; `?aba=desativados` seleciona Desativados e qualquer outro valor, Em uso. Trânsito continua sem ação e conta em Em uso. Estados vazios próprios de cada aba.
- [x] Lista densa no celular: superfície única com divisores, nome completo com quebra, tipo na segunda linha e Desativar de 44 px; desktop mantém a tabela. Desativados na mesma lista, com nome e data.
- [x] Testes: `tests/e2e/ativos.spec.ts` (estado vazio das duas abas, Novo ativo acima das abas, cadastro só em `/ativos/novo`, recusa do servidor sem gravar e sem sair da página, sucesso sem mensagem, voltar, abas por URL com parâmetro inválido, recarga e histórico, só a lista selecionada, trânsito sem ação, recusa por saldo não zero, desativação movendo o ativo de aba, nome de 98 caracteres sem truncar no celular, alvos de 44 px, sem rolagem horizontal e axe nas duas abas e no cadastro em 360 e 1280 px); `carteira.spec.ts` com o cadastro pela rota nova; `/ativos/novo` nas listas de navegação, botões e preview.
- [x] `navegacao-desempenho.spec.ts`: prontidão de `/ativos` passou do formulário embutido para `main #ativos-da-aba > *` (lista ou estado vazio da aba); `MEDICAO.md` atualizado.
- [x] DESIGN.md 6.7 (exceção da lista densa de Ativos) e 6.12 (abas por navegação); KB-003; nota da `0.7.0` em `src/lib/novidades.ts`.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| `npm run lint` | 0 erros; três avisos preexistentes em script ignorado de validação local (`local/`) |
| `npm run typecheck` | Passou |
| `npm test` | 332/332 (28 arquivos); a entrega não tem regra unitária nova |
| Build | Passou, sem backend e com backend, pelo `webServer` do Playwright, e no build próprio do piloto |
| E2e sem backend | 33 passaram e 155 pulados (suítes que exigem Supabase), inclusive `/ativos/novo` com o aviso de preview |
| `npx supabase test db` | 261/261 (7 arquivos) |
| E2e com backend | 175 passaram, 12 pulados e 1 falhou: `carteira.spec.ts` CR-04 parou por 30 s esperando o campo "Origem" de Transferências, tela que esta entrega não altera. A mesma parada ocorreu numa rodada da #104, antes desta mudança; nas demais rodadas o caso leva de 8 a 13 s. Reexecução isolada de `carteira.spec.ts` e `ativos.spec.ts`, duas vezes: 15/15 em cada, com CR-04 em cerca de 4 s. Instabilidade preexistente, sob a carga da suíte completa, registrada para investigação à parte |
| Piloto do ensaio (`MEDICAO_PILOTO=1 node tests/e2e/apoio/medir-navegacao.mjs`) | Passou nos volumes vazio e cheio, com 50 ms: as quatro direções prioritárias, inclusive Início → Ativos e Ativos → Início com o marcador `#ativos-da-aba`, em primeira visita e revisita, e o percurso adicional; prova D13 pulada, como previsto sem `MEDICAO_D13=1`. Arquivos só em `local/issue-52/`, ignorado |
| Auditoria visual (DESIGN.md) | Conta fictícia temporária, criada e removida por script: `/ativos` vazio, `/ativos/novo`, lista com nome de 96 caracteres quebrando no celular, abas com contadores e Desativados em 360 px, e tabela em 1280 px. Tokens e pares de contraste registrados, alvos de 44 px e sem rolagem horizontal; axe sem violações no e2e |
| Governança | `node scripts/validate-governance.mjs` com 0 erros, 0 avisos e cinco itens manuais |
| G3 | Contas e ativos de teste fictícios (`ativos106.*`, `visual106.comum`, todas `@example.com`), removidos no fim |
| `git diff --check` | Passou |
| Checks remotos | Pendente |

## Revisão da correção

Não se aplica (trilha normal).

## Decisões incidentais e desvios

- **Nota da `0.7.0` para revisão do responsável:** "Na tela de Ativos, o cadastro abre numa página própria pelo botão Novo ativo, e a lista se divide nas abas Em uso e Desativados."
- **Estado vazio de Em uso sem segunda ação principal:** o DESIGN.md permite uma única ação principal por tela, e Novo ativo já está no topo; o texto do vazio aponta para ele em vez de repetir o botão.
- **Cores das abas e do contador:** só pares já registrados no DESIGN.md 2.2 (`primary` e `text-secondary` sobre `surface-subtle`, `text-secondary` sobre `surface` em hover e `neutral` sobre `neutral-subtle` no contador, 4,83:1). O par `text-secondary` sobre `neutral-subtle`, não registrado, foi evitado.
- **Comportamento preexistente mantido no desktop:** na tabela, o botão Desativar fica alinhado à esquerda da célula e, para o trânsito, "Só recebe transferências" quebra em duas linhas quando o nome ocupa a largura; não foi alterado por estar fora do escopo.
- **Links "Cadastrar ativo" de outras telas:** os estados vazios de Novo lançamento e Transferências continuam levando a `/ativos`, onde Novo ativo está no topo; apontá-los direto para `/ativos/novo` não é necessário aos critérios e ficaria fora da lista de arquivos do plano.
- **Recusa no formulário:** a mensagem do servidor aparece sem sair de `/ativos/novo`; não verifiquei se o navegador mantém o texto digitado depois da recusa, e o critério não exige isso.
- Sem mudança de banco, autenticação, schema, cálculo ou dependências.

## Encerramento

Não se aplica: o ciclo é completo e o encerramento tem PR própria.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Pronto para continuar — ciclo 010 (completo)
Quem: Qualquer ferramenta, a pedido do responsável
Conferir: —
Diga: "continue o ciclo 010"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 010 + implementar_issue + 106/Item-3-BL-006 + 74d36d0c3550bc381a4ae1e73ab3e8493a230ac5`
- `effect_class`: `local_mutation`
- `state_before` / `state_after`: plano Em Execução, #104 e #105 integradas, #106 aberta sem branch nem PR / implementação em andamento na branch `feature/issue-106`
- `result`: `not_executed`
- `evidence`: autorização "autorizo a implementação da issue #106" em 2026-10-21; `git fetch` com `main` igual a `origin/main` em `74d36d0`; consulta sem PR ou branch da #106
- `blockers`: implementação em curso, coberta pela autorização registrada no cabeçalho; este bloco é substituído ao publicar a PR
