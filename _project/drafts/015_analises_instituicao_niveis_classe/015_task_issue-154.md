# Task — Issue #154: Análises por instituição e detalhamento de classes

> **Ciclo:** `015`
> **Trilha:** `normal`
> **Estado:** `Em andamento`
> **Tipo:** `feature`
> **Issue:** `#154`
> **Plano:** `_project/drafts/015_analises_instituicao_niveis_classe/015_plan.md`
> **Branch:** `feature/issue-154`
> **PR:** —
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #154" em 2026-10-27
> **Modo contínuo:** `—`
> **Início:** 2026-10-27
> **Última atualização:** 2026-10-27
> **handoff_schema_version:** `2`

## Objetivo

Entregar a unidade D do plano aprovado, issue #154: com banco, regras e leituras prontos (unidades A a C), o Início apresenta a distribuição por instituição e o detalhamento das classes nos níveis 2 e 3, sem inventar precisão.

## Escopo autorizado

Alternador com a visão por instituição; rosca e tabela por instituição com Outros derivado depois do rateio; navegação por URL macro → subclasse → tipo, com cartões e tabelas de detalhe, as duas participações e negativos por ramo; estados vazio, de erro e de ramo inválido; ocultação no servidor; DESIGN.md (6.12 e 6.13), KB-003 e nota de novidades em versão ainda não lançada; testes unitários e e2e. Sem alteração de banco, de regras financeiras (KB-004 e módulos da unidade B) nem das demais telas.

## Origem no backlog

Snapshot herdado da ideação, sem nova seleção nem alteração do item:

- **BL-009 — Metadados descritivos e classificação de ativos com aproveitamento do histórico:** selecionadas as visões analíticas por instituição e por classe nos níveis 2 e 3, em conjunto para este ciclo. Os campos descritivos e a visão macro foram encaminhados nos ciclos 012 e 013. O responsável informou em 2026-10-27 que já preencheu os dados descritivos dos ativos históricos migrados; é relato humano, não verificação de dados. A carga manual não integra esta seleção.
- Snapshot: `_project/backlog.md` na fila canônica, commit `84f0a5ea107f33e0de5c506b3ea0825346f6e58e`, presente em `origin/main` conforme a ideação; destino ciclo 015 em preparação. O item continua disponível e não foi alterado pela seleção.
- A edição do nome é extensão pedida diretamente pelo responsável durante a ideação; não deriva de BL-015. O retorno à fila, somente depois da integração comprovada do destino, usa a referência estável `ciclo 015`; sua publicação exige autorização separada.

## Elegibilidade da trilha curta

Não se aplica — trilha normal, unidade D do ciclo completo.

## Barreiras de domínio

Toda linha é obrigatória. "Não se aplica" exige justificativa. Com G1 ou G2 marcados com "Sim", o modo contínuo não pode estar `ativo`.

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim | A tela só apresenta o que as funções da unidade B calculam (CR-015-01 a CR-015-16); nenhum cálculo foi alterado ou duplicado. O e2e confere números independentes na tela: Outros e as participações da instituição (27,78 / 22,22 / 16,67 / 13,89 / 11,11 / 6,67 / 1,66), o detalhe de uma macro e de uma subclasse nas duas bases, e CR-015-06 (16,67 e 16,66 da carteira; 33,34 e 33,33 do pai; pai de volta a 50,00% na raiz). Os esperados foram calculados à mão e conferidos contra as regras da KB-004 |
| G2 — isolamento por RLS | Não | Sem tabela, política, função ou migração; a leitura usa o catálogo de instituições e a árvore já lidos sob a sessão do usuário (RLS), e as RPCs de marca já foram provadas na unidade A |
| G3 — privacidade de dados | Sim | Somente usuários, nomes, instituições e valores fictícios nos testes; ocultação conferida no HTML e nos atributos acessíveis das novas visões; nenhum dado real lido, impresso ou gravado |
| G4 — migrações só acrescentam | Não | Nenhuma migração criada, editada ou removida |

## Execução

- [x] Issue, plano, autorização e base conferidos; `main` igual a `origin/main` (e0e21df); branch `feature/issue-154` criada; CI do `main` conferido antes de abrir a PR.
- [x] `src/lib/telas/analises-inicio.ts`: composição com os insumos, `null` para dado ilegível, ramo pedido (raiz, inválido ou detalhe) e identidade das macros.
- [x] `GraficoRoscaPorInstituicao` e links "Ver subclasses" nas macros da raiz (`rosca.tsx`); `DetalheDoRamo` (`src/components/detalhe-do-ramo.tsx`); página do Início com a terceira visão, o parâmetro `classe` e a mensagem de ramo inválido.
- [x] DESIGN.md (6.12 e 6.13), KB-003 e nota da versão `0.11.0` em `src/lib/novidades.ts`, sem data.
- [x] Testes unitários da composição e e2e `analises-inicio.spec.ts` (11 cenários); regressões das visões por ativo e por classe.
- [x] Task da unidade C reconciliada com o merge da PR #158; resultado sanitizado da E1 registrado na task da #151.
- [x] Gates locais concluídos e staging revisado.
- [ ] PR publicada.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | Unitários: 475/475 (7 novos da composição); governança: 48/48; lint sem erros (3 avisos preexistentes em `local/`), typecheck e build passaram; e2e autenticado sobre build com Supabase local, suíte completa: 222 passed, 12 skipped (preview sem backend), nenhum flaky, saída 0, dois workers (inclui os 11 cenários novos de `analises-inicio.spec.ts`, com axe, alvos de 44 px, ocultação e CR-015-06). Banco: não executado, sem alteração de banco |
| Validador | 0 erros, 0 avisos; conferências manuais realizadas (G3: só nomes e valores fictícios; ocultação conferida no HTML e nos atributos) |
| `git diff --check` | Passou |
| Checks remotos | Pendente |

## Revisão da correção

Não se aplica — trilha normal.

## Decisões incidentais e desvios

- **Aprofundamento por link na legenda.** O plano pede "links explícitos na legenda/tabela"; implementei "Ver subclasses" na legenda da raiz (só nas seis macros, com o nome para leitores de tela). Dentro do detalhe, o nome de uma subclasse é o link para os tipos. A tabela da raiz ("Ver os números") não ganhou coluna de links, para não duplicar os mesmos destinos.
- **Tabela e cartões no mesmo HTML.** O detalhe renderiza a tabela (a partir de `md`) e a lista de cartões (abaixo de `md`) ao mesmo tempo, alternadas por CSS; só uma fica visível, e os testes de acessibilidade e de largura passam nos dois tamanhos.
- **Sem número no texto de explicação.** A primeira versão citava "100,00%" na explicação das duas colunas; troquei por uma frase sem número, para o detalhe não trazer nenhum resumo numérico além das linhas (critério do plano e de CR-015-06).
- **Ramo inválido.** Inexistente, mal formado ou tipo (terminal) volta à raiz com aviso em `role="status"`; dado incoerente continua sendo erro (visão indisponível).
- **Novidades.** Entrada `0.11.0` com `publicadaEm: null`, só visível depois que a versão for lançada; a versão concreta será conferida na release.
- **Não alterado.** `distribuicao.ts`, `alocacao.ts` e os módulos da unidade B; as demais telas; a renomeação de ativo nas telas descritivas.
- **Reconciliações.** A task da unidade C passou a `Concluída` (PR #158) e a da #151 recebeu o resultado sanitizado da E1 trazido pelo responsável; o plano registra a autorização desta unidade.

## Preparação de V (verificação em produção, para o encerramento)

Roteiro do plano, ajustado ao que foi construído; só acontece depois de "autorizo a verificação em produção do ciclo 015", com release e deploy confirmados, sem prints, nomes nem valores reais nas evidências:

1. No Início, o alternador tem Por ativo, Por classe e Por instituição, preserva o período e mostra o mês M; Por ativo e a raiz Por classe continuam como antes.
2. Por instituição: grupos com Sem instituição e Em trânsito quando existirem, Outros com os componentes, tabela equivalente e negativos separados; não preencher dados para criar cenário.
3. Por classe: "Ver subclasses" abre a macro, o nome da subclasse abre os tipos, o caminho navegável volta, recarregar e o histórico preservam o ramo, e as duas colunas aparecem com os resíduos quando existirem; cenário ausente é registrado como não observado, com cobertura nos testes fictícios.
4. Ocultar valores remove as quantias das novas visões, inclusive nos detalhes; teclado, celular e desktop sem rolagem horizontal.
5. Edição de ativo: campo Nome editável, tipo de ajuste só leitura, dica sobre os registros antigos, trânsito sem edição; renomear e concorrência são provados localmente, sem alterar a carteira real.
6. O agente confere por leitura o estado de deploy e CI, sem consultar carteira.

## Encerramento

Não se aplica — ciclo completo; encerramento em PR própria.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Pronto para continuar — ciclo 015 (completo)
Quem: Qualquer ferramenta, a pedido do responsável
Conferir: —
Diga: "continue o ciclo 015"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 015 + implementar_issue + 154 + e0e21dffc722aee575f1ed1ad0c7cd70896f5cb5`
- `effect_class`: `remote_mutation`
- `state_before`: plano aprovado, #154 autorizada, unidades A a C integradas, E1 informada como concluída com resultado sanitizado.
- `state_after`: em preparação — a preencher ao publicar a PR.
- `result`: `not_executed`
- `evidence`: a preencher ao publicar a PR.
- `blockers`: nenhum até aqui.
