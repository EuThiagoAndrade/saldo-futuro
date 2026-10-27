# Task — Issue #139: Exibir alocação por classe macro no Início (BL-014 e parcela de BL-009)

> **Ciclo:** `013`
> **Trilha:** `normal`
> **Estado:** `Aguardando integração`
> **Tipo:** `feature`
> **Issue:** `#139`
> **Plano:** `_project/drafts/013_taxonomia_classes_alocacao/013_plan.md`
> **Branch:** `feature/issue-139`
> **PR:** [#147](https://github.com/EuThiagoAndrade/saldo-futuro/pull/147) (`Refs #139`)
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #139" em 2026-10-26
> **Modo contínuo:** `—`
> **Início:** 2026-10-26
> **Última atualização:** 2026-10-26
> **handoff_schema_version:** `2`

## Objetivo

Entregar o item 3 do plano: a distribuição dos saldos positivos do último mês fechado por classe macro no Início, ao lado da distribuição por ativo, com a regra G1 decidida (P2 e P6), leitura coerente com a marca da classificação, alternador, rosca e tabela, e a documentação viva. Tratar as ressalvas R2-1 (cor de `chart-7`) e R2-2 (o formulário de período preserva a visão).

## Escopo autorizado

Item 3 do plano `v2` aprovado, conforme a issue #139: função pura irmã em `src/lib/financeiro/alocacao.ts`, sem alterar `comporDistribuicao`; casos CR-C01 a CR-C12 na KB-004 e no JSON de referência; leitura coerente com `ler_versao_classificacao`; alternador "Por ativo" / "Por classe", rosca e tabela; tokens `chart-7` e `chart-8`; DESIGN.md 2.3, 6.12 e 6.13; KB-003, KB-004 e novidades. Fora: migração, mudança de saldo, fechamento, retorno ou da distribuição por ativo, rota nova, dependência nova e a verificação em produção (ponto próprio do plano).

## Origem no backlog

Herdada do plano: BL-014 (integral) e BL-009 (parcela das visões analíticas por classe de alocação). Destino em preparação; o retorno na fila só depois da integração comprovada do ciclo.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim | Regra nova da alocação por classe macro na KB-004, seção 15, com P2 (classificação atual) e P6 (empate de resto pela ordem fixa) decididas pelo responsável em 2026-10-26. CR-C01 a CR-C12 transcritos do plano, com contas independentes, na KB-004 e em `tests/fixtures/financeiro/casos_referencia.json`; o teste de paridade confere KB e JSON, e `alocacao.test.ts` confere cada esperado em três ordens de entrada e com outros nomes, a soma 10000, o erro abaixo de 0,01 p.p. e a formatação exata do CR-C12. CR-53 a CR-61 continuam passando, com `distribuicao.ts` intacto. Tudo em `bigint`, sem ponto flutuante. |
| G2 — isolamento por RLS | Não se aplica; conferido | Nenhuma tabela, política, grant ou função nova. A leitura usa a sessão do usuário: `ler_versao_classificacao` é `security invoker` sob a RLS de `profiles`, e `taxonomia_ativos` é só leitura (provados no pgTAP 09 desde a issue #137). |
| G3 — privacidade de dados | Sim | Casos e e2e só com nomes e valores fictícios; quantias passam pela ocultação no servidor (e2e confere HTML e atributos sem valores); nenhum dado real lido. |
| G4 — migrações só acrescentam | Não se aplica | Nenhuma migração criada ou alterada. |

## Execução

- [x] Branch `feature/issue-139` a partir de `main` em `f4b0af6`.
- [x] `src/lib/financeiro/alocacao.ts`: `grupoDoAtivo` (trânsito com precedência, vínculo nulo é Sem classe, até dois pais, nó incoerente é erro) e `comporAlocacao` (negativos por ativo antes de agrupar, linhas positivas, maior resto com empate pela ordem fixa, apresentação por saldo e ordem fixa, sem Outros).
- [x] CR-C01 a CR-C12 no JSON (entrega `013`) e na KB-004 (seção 14, convenção, e regra na seção 15); teste de paridade aceita `CR-Cnn` e a entrega `013`.
- [x] `lerInsumosDoInicioPorClasse`: marca da carteira mais `ler_versao_classificacao` (texto), antes e depois, com sinais novos e 3 tentativas; árvore lida junto. Testes com a Data API falsa: reclassificação no meio repete e devolve só a classe nova; classificação que muda sempre vira indisponibilidade.
- [x] Início: alternador `?distribuicao=ativo|classe` com `aria-current` e período preservado; campo oculto no formulário de período (R2-2); só a visão escolhida é lida e renderizada; `GraficoRoscaPorClasse` com cores fixas; classe incoerente torna só esta visão indisponível.
- [x] `chart-7` `#1F6E9C` (azul aço; R2-1) e `chart-8` `#80552D` em `globals.css` e no DESIGN.md, com contraste e distâncias registrados; DESIGN.md 6.12 (variante sem contador) e 6.13 (por classe).
- [x] KB-003, KB-004 e nota na `0.10.0` de `/novidades`.
- [x] e2e `tests/e2e/distribuicao-classe.spec.ts`.
- [x] Gates completos e PR #147 aberta (`Refs #139`).
- [ ] Checks remotos verdes e aprovação do merge.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| `npm test` | 34 arquivos, 405 testes, todos passando |
| `npm run lint` | Sem erros; 3 avisos preexistentes em arquivo ignorado de `local/` |
| `npm run typecheck` | Passou |
| `npx supabase test db` | 9 arquivos, 498 asserções, `PASS` (sem mudança de banco) |
| `npm run build` | Passou |
| `npm run test:e2e` (`CI=1`, Supabase local) | 221 testes: 208 passaram, 13 ignorados (condicionais do ambiente), nenhuma falha; o novo `distribuicao-classe.spec.ts` tem 8. As três primeiras execuções do arquivo novo reprovaram por seletores ambíguos do próprio teste (rótulo "Período", nome repetido na tabela e o cartão Patrimônio), corrigidos sem mudar código |
| Validador | Pendente |
| `git diff --check` | Pendente |
| Checks remotos | Pendente |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

- **Cor de `chart-7` (R2-1).** O plano propunha `#376C3B`, quase o verde de `gain`. Foi usado `#1F6E9C`, azul aço: contraste 5,5722:1 contra `surface`, ΔE76 de 52,0 para `gain`, 77,8 para `loss`, 20,2 para `chart-5` e 25,9 para `chart-2`. `chart-8` ficou como no plano (6,4514:1).
- **Leitura só na visão por classe.** A marca da classificação e a árvore só são lidas quando a visão por classe é pedida; a visão por ativo continua com a composição de antes, sem custo novo.
- **Negativos com a classe entre parênteses.** Na lista de negativos e na tabela, o nome do ativo traz a classe, para que se saiba de qual linha ele saiu.
- **Classe incoerente.** Nó inexistente ou caminho inválido mostra um estado de erro só no lugar da rosca por classe, sem número; o resto do Início continua. A leitura que muda além das tentativas mostra o erro de dados que mudaram, como as outras composições.

## Encerramento

Não se aplica.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 013 (completo)
Quem: Responsável
Conferir: checks e diff da PR https://github.com/EuThiagoAndrade/saldo-futuro/pull/147
Diga: "aprovo o merge da PR #147"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 013 + implementar_issue + 139 + f4b0af60ede715da16a05cd8c5237585f6381d98`
- `effect_class`: `remote_mutation`
- `state_before`: plano `Em Execução`; #137 e #138 integradas; issue #139 aberta; `main` em `f4b0af6`; autorização "autorizo a implementação da issue #139".
- `state_after`: entrega commitada na branch `feature/issue-139` e publicada na PR #147 (`Refs #139`); gates locais verdes; aguardando checks remotos e aprovação específica do merge.
- `result`: `executed`
- `evidence`: seção "Evidências" e https://github.com/EuThiagoAndrade/saldo-futuro/pull/147.
- `blockers`: o merge depende de checks verdes e de "aprovo o merge da PR #147". A task da #138 ainda não registra a E2 (contagens a pedir ao responsável).
