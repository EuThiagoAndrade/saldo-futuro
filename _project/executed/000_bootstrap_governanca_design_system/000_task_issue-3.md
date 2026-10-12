# Task — Issue #3: Criar design system e identidade visual

> **Ciclo:** `000`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `chore`
> **Issue:** `#3`
> **Plano:** `_project/executed/000_bootstrap_governanca_design_system/000_plan.md`
> **Branch:** `chore/issue-3`
> **PR:** [#5](https://github.com/EuThiagoAndrade/saldo-futuro/pull/5)
> **Integração:** `Integrada por squash em 6fe1ff1 (2026-10-12)`
> **Início:** 2026-10-12
> **Última atualização:** 2026-10-12
> **handoff_schema_version:** `1`
> **handoff_id:** `saldo-futuro:000:implementar_issue:issue-3:a01da6f`

Instanciada a partir de `.agent/templates/task.md`. O workflow local `.agent/workflows/implementar_issue.md`, integrado pela PR #4, é a sequência operacional.

## Objetivo

Criar o design system normativo e a identidade visual do Saldo Futuro (Item 7 do plano `000`).

## Escopo autorizado

- Gate C concedido em 2026-10-12, válido para a issue B depois do Gate M-A. O Gate M-A foi concedido e a PR #4 foi integrada em `a01da6f`.
- Item 7 do plano, com as ressalvas S1 e S2 da revisão.
- Fora do escopo: telas completas, tema escuro, ícones PWA, favicon e escolha da biblioteca de gráficos.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Não há regra de cálculo; os valores da página de referência são fictícios e só demonstram formatação |
| G2 — isolamento por RLS | Não | Não há tabela nem migração |
| G3 — privacidade de dados | Sim | A página de referência e o `DESIGN.md` usam somente nomes e valores fictícios ("CDB Exemplo Alfa", "Tesouro Fictício 2031"); índices públicos (CDI e IPCA) são permitidos |
| G4 — migrações só acrescentam | Não | Não há migração |

## Execução

- [x] Fonte: release oficial `@ibm/plex-sans@1.1.0` baixada (autorizada pelo Gate C) num diretório isolado; os `woff2` 400, 500 e 600 e a licença foram copiados sem modificação.
- [x] S1 verificada; o responsável decidiu seguir com a Plex 1.1.0 (ver Decisões).
- [x] `design-system/DESIGN.md` com as oito seções normativas.
- [x] Logo e símbolo em SVG, com o logotipo convertido em contornos.
- [x] `design-system/referencia.html` com tokens, tipografia, componentes, gráficos e a composição "Início".
- [x] O manifesto passou a exigir o `DESIGN.md`, a página de referência, os SVGs e a `OFL.txt`.
- [x] README com o link para o design system; KB-001 com a proveniência da fonte (S2).

## Evidências

| Gate | Resultado |
| :-- | :-- |
| S1 — features OpenType | Lista GSUB dos TTF Regular, Medium e SemiBold do mesmo pacote: `aalt ccmp dnom frac liga lnum locl numr onum ordn salt sinf ss01 ss02 ss03 ss04 ss05 ss06 subs sups zero`, sem `tnum` nem `pnum` |
| S1 — larguras | Tabelas `cmap` e `hmtx` dos três pesos: dígitos de 0 a 9 = 600 unidades; U+2212 (menos) = 600; U+2007 (espaço de algarismo) = 600; hífen = 399 a 402 |
| S1 — no navegador, com o `woff2` | `"1111"` e `"8888"` = 96 px cada, a 40 px; `"−"` e `"0"` = 24 px cada |
| Contraste | Todos os pares da seção 2.2 do `DESIGN.md` atingem o mínimo. `border-strong` foi escurecido de `#8A96A8` (3,00:1) para `#7D899B` (3,55:1). `focus` sobre `primary` (2,86:1) foi tratado com o anel afastado 2 px, sobre a superfície |
| Página de referência | Navegador interno, via servidor estático local: os três pesos com status `loaded`; nenhuma requisição externa (5 recursos, todos locais); sem rolagem horizontal a 832 px e a 375 px; tabela vira lista de cartões a 375 px; nenhum controle com altura abaixo de 44 px |
| Logo | Renderizado a 128, 64, 32 e 16 px; nenhum `<text>` nos SVGs; `viewBox` definido; sem recurso externo |
| Testes | `node --test scripts/validate-governance.test.mjs`: 26 testes, 26 aprovados |
| Validação | `node scripts/validate-governance.mjs`: 0 erros, 1 aviso esperado (sem `package.json`) |
| `git diff --check` | Sem ocorrências em `main...chore/issue-3`, depois de excluir a `OFL.txt` original da verificação de whitespace no `.gitattributes` |
| Checks remotos | `Validate governance` aprovado na PR #5 (run 38305918696) |

## Decisões incidentais e desvios

- **S1, decidida pelo responsável em 2026-10-12:** a Plex 1.1.0 não tem a feature `tnum`, mas seus algarismos padrão já são tabulares. O responsável escolheu seguir com essa versão. O critério do Item 7 ("`tnum` ativo nos valores") passa a ser cumprido como "algarismos com largura fixa", medido acima. O `DESIGN.md` mantém `font-variant-numeric: tabular-nums lining-nums` como garantia para as fontes de fallback, proíbe `onum` e exige o U+2212 em negativos.
- **Licença:** o `license.txt` do diretório `woff2` e o `LICENSE.txt` da raiz do pacote têm o mesmo texto da OFL 1.1. Diferem só em finais de linha (LF e CRLF), numa quebra de linha antes da URL da FAQ e na linha final. Usei a cópia que acompanha os `woff2`, como `OFL.txt`.
- **Logotipo:** os contornos foram gerados por um script local de leitura das tabelas `glyf` e `loca` dos TTF (fora do repositório), sem kerning, com "Saldo" em SemiBold e "Futuro" em Regular.
- **Gerador de fixtures dos testes:** ao tornar o `DESIGN.md` obrigatório, o gerador da fixture válida precisou também derivar do manifesto as seções do design system. O validador (`validate-governance.mjs`) não mudou: o critério "a PR B altera o manifesto e não a lógica do validador" é atendido, mas o gerador de testes era menos genérico do que o declarado na issue A. Os testes 2 e 18 foram reescritos para testar um novo arquivo hipotético e a regra condicional sem o `DESIGN.md` no manifesto.
- **Menu "Mais":** o `DESIGN.md` deixa o conteúdo exato para o ciclo `003`. A página de referência mostra "Comparação" e "Ajuda" só como ilustração.
- **Tema escuro:** só os nomes dos tokens estão preparados; nenhum valor escuro foi definido, conforme o escopo.
- **`.gitattributes`:** a `OFL.txt` da IBM tem espaço no fim de uma linha. Para versioná-la sem modificação (o SHA-256 da KB-001 continua válido), o arquivo foi marcado como `-whitespace`.

## Resultado

Item 7 implementado e integrado. Gates D (identidade visual) e M-B concedidos pelo responsável em 2026-10-12, na conversa de execução; PR #5 integrada por squash em `6fe1ff1`; issue #3 fechada.

### Handoff de execução

- `handoff_schema_version`: `1`
- `handoff_id`: `saldo-futuro:000:implementar_issue:issue-3:a01da6f`
- `identity_source`: `repository + cycle + workflow + logical_target + source_revision` (alvo: issue #3, Item 7; base `a01da6f`).
- `effect_class`: `local_mutation -> remote_mutation`
- `state_before`: PR #4 integrada em `a01da6f`, issue #3 aberta, Gate C válido.
- `state_after`: design system integrado em `main` (`6fe1ff1`), PR #5 integrada e issue #3 fechada (reconciliado no encerramento).
- `next_transition`: `PR -> Gate D -> checks -> Gate M-B`.
- `preconditions`: aprovação explícita da identidade visual na PR (Gate D), checks verdes e aprovação do Gate M-B.
- `authority`: Thiago Andrade (Gates D e M-B); GitHub (checks).
- `evidence`: esta task, a página de referência, os commits da branch e os checks da PR.
- `acceptance`: critérios do Item 7 atendidos, com a S1 decidida; identidade aprovada.
- `blockers`: nenhum.
- `result`: `executed`
- `next_workflow_recommended`: Gate D e, após o Gate M-B, o encerramento do ciclo (Gate E).
- `next_workflow_authorized`: nenhum além da publicação da PR.
- `actions_prohibited`: integrar sem os Gates D e M-B; iniciar o encerramento sem o Gate E.
- `rejection_rule`: o receptor recusa handoff sem PR vinculada, sem checks ou sem o Gate D registrado.
- `logical_key`: `saldo-futuro:000:implementar_issue:issue-3`
- `check_before_mutation`: localizar branch e PR existentes para a issue #3.
- `reconcile_existing`: atualizar a PR existente em vez de abrir outra.
- `ambiguous_state`: parar se houver mais de uma PR para a issue #3.
