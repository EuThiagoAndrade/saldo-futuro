# Task — Issue #174: Consultar e filtrar atributos complementares na página Ativos

> **Ciclo:** `017`
> **Trilha:** `normal`
> **Estado:** `Aguardando integração`
> **Tipo:** `feature`
> **Issue:** `#174`
> **Plano:** `_project/drafts/017_atributos_complementares_ativos/017_plan.md`
> **Branch:** `feature/issue-174`
> **PR:** https://github.com/EuThiagoAndrade/saldo-futuro/pull/178
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #174" em 2026-10-30
> **Modo contínuo:** `—`
> **Início:** 2026-10-30
> **Última atualização:** 2026-10-30
> **handoff_schema_version:** `2`

## Objetivo

Entregar a unidade Consulta (Item 3) do plano aprovado v4: "Ver detalhes" nas duas abas de `/ativos` e "Filtrar" pela URL, com P5, P6 e D8, além da documentação da entrega, do roteiro de verificação em produção e da nota de novidades.

## Escopo autorizado

Resumo recolhível por ativo comum nas duas abas, sem coluna nem campo novo na linha principal; painel "Filtrar" abaixo das abas, formulário GET, com OU/E, Exatamente e Até na mesma unidade, `nao_informado`, erros explícitos, abas que preservam filtros, contadores totais e "Limpar filtros" visível com o painel fechado; trânsito fora de qualquer filtro. DESIGN.md 6.7 e 6.12, KB-003, KB-002 (verificação em produção) e nota em `/novidades`. Fora: marca de metadados, nova leitura ou composição, faixas de prazo com dois limites, conversão entre unidades, preservar filtros depois de editar.

## Origem no backlog

Snapshot herdado do plano, sem nova seleção nem alteração do item: **BL-015**, seleção integral; `_project/backlog.md` da fila `chore/backlog`, commit `e3d32d981c6f311d0d9dba192af552f29368347b`. Destino ciclo `017` em preparação; retorno à fila só depois da integração comprovada do destino, com publicação separada.

## Elegibilidade da trilha curta

Não se aplica — trilha normal, unidade Consulta do ciclo completo.

## Barreiras de domínio

Toda linha é obrigatória. "Não se aplica" exige justificativa. Com G1 ou G2 marcados com "Sim", o modo contínuo não pode estar `ativo`.

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Só interseção de conjuntos e comparação de inteiros declarados na mesma unidade; nenhum cálculo monetário, fiscal, de data ou de conversão. Nenhum leitor financeiro muda; regressões financeiras da suíte unitária e do e2e passaram |
| G2 — isolamento por RLS | Sim | Sem tabela, política ou função nova; a página continua lendo pela sessão do usuário com `lerAtivos`, e filtros e resumo derivam dessas linhas. O e2e roda com usuário próprio; a suíte de banco segue passando |
| G3 — privacidade de dados | Sim | Somente nomes e valores fictícios nos testes e capturas locais; a URL guarda só códigos de filtro, sem nomes, valores ou instituições; o roteiro de produção pede relato só de passou ou falhou |
| G4 — migrações só acrescentam | Não se aplica | Nenhuma migração nesta entrega |

## Execução

- [x] Issue #174 aberta; PR #177 integrada pelo responsável (dependência atendida); base `origin/main` `e58f02dde56229c84996d0803bdb5a32ef96b078`; registros da #173 reconciliados.
- [x] Filtros e resumo puros (`src/lib/telas/filtros-ativos.ts` e `resumoDosAtributos`), com testes dos exemplos da P5.
- [x] Página `/ativos` com "Ver detalhes" e "Filtrar" (`src/components/ativos-consulta.tsx`).
- [x] E2e novo e ajustes nos existentes; DESIGN.md 6.7 e 6.12, KB-003, KB-002 e nota da 0.13.0.
- [x] Gates locais completos e staging revisado.
- [x] PR #178 publicada com `Refs #174`; integração exige aprovação própria.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | Unitários 501/501 (13 novos de filtros e resumo, com os exemplos da P5, e a nota da 0.13.0); lint sem erros (3 avisos preexistentes em `local/`); typecheck e build passaram; banco 640/640 (sem migração nova); e2e sobre o build com o Supabase local e dois workers: 233 passed e 12 skipped (preview sem backend), saída 0. As três especificações de Ativos juntas: 32/32, com as sete novas de `ativos-consulta.spec.ts` (resumo nas duas abas, OU/E e URL, abas, contadores e Limpar, Exatamente e Até, Não informado e erros, acessibilidade e 44 px em 360 e 1280 px) |
| Validador | 48/48 testes de governança; validador sem erros depois do registro do número da PR |
| `git diff --check` | Passou |
| Checks remotos | Em execução na PR #178 |

## Revisão da correção

Não se aplica — trilha normal.

## Decisões incidentais e desvios

- O formulário de filtros é renderizado no servidor, sem estado no cliente: Comparação, Dias e Unidade ficam sempre visíveis no grupo do prazo, com a dica de que só valem com "Prazo em dias", para o envio funcionar sem JavaScript. Uma combinação incoerente mostra erro, sem ser corrigida em silêncio. Os checkboxes não desmarcam exclusivos no cliente; o servidor recusa.
- Parâmetros dos quatro indicadores usam o nome da coluna (`previdencia`, `liquidez_imediata`, `exposicao_cambial`, `isento_ir`); os links das abas levam só os parâmetros preenchidos, em ordem fixa.
- O nome do ativo na célula da tabela passou a ficar num parágrafo próprio, para o resumo caber na mesma célula; o e2e da #128 que comparava o texto inteiro da célula passou a exigir que ela comece pelo nome.
- As linhas da tabela e da lista passaram a alinhar pelo topo, para o resumo abrir para baixo sem deslocar as ações.
- A nota de novidades usa a versão 0.13.0, a proposta pela PR de release #176 aberta pelo release-please, com `publicadaEm: null` até a publicação; se a versão mudar, a nota acompanha.
- Capturas de tela com dados fictícios feitas por um teste temporário, apagado antes do commit, e guardadas só em `local/`.

## Encerramento

Não se aplica — ciclo completo; encerramento em PR própria, depois da verificação em produção.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 017 (completo)
Quem: Responsável
Conferir: Checks e diff da [PR #178](https://github.com/EuThiagoAndrade/saldo-futuro/pull/178); esta task
Diga: "aprovo o merge da PR #178"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 017 + implementar_issue + 174 + e58f02dde56229c84996d0803bdb5a32ef96b078`
- `effect_class`: `remote_mutation`
- `state_before`: PR #177 integrada pelo responsável e #173 fechada; #174 aberta; "autorizo a implementação da issue #174" recebida em 2026-10-30.
- `state_after`: unidade Consulta implementada e validada localmente; PR #178 publicada na branch `feature/issue-174`, sem fechar a #174, aguardando checks e aprovação do merge.
- `result`: `executed`
- `evidence`: tabela de evidências acima.
- `blockers`: nenhum para publicar; o merge depende de checks verdes e de aprovação própria. A #174 fica aberta até a verificação em produção e o encerramento.
