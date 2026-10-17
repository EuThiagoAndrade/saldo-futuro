# Task — Issue #57: Leituras D13 deduplicadas pelo Next

> **Ciclo:** `—`
> **Trilha:** `curta`
> **Estado:** `Aguardando integração`
> **Tipo:** `fix`
> **Issue:** `#57`
> **Plano:** `—`
> **Branch:** `fix/issue-57`
> **PR:** [#58](https://github.com/EuThiagoAndrade/saldo-futuro/pull/58)
> **Integração:** `Pendente`
> **Autorização inicial:** "confirmo a trilha curta e autorizo abrir e corrigir a issue [FIX] Leituras D13 deduplicadas pelo Next" em 2026-10-17, confirmada como única escolha em resposta à pergunta de desambiguação
> **Modo contínuo:** `—`
> **Início:** 2026-10-17
> **Última atualização:** 2026-10-17
> **handoff_schema_version:** `2`

## Objetivo

Restaurar a garantia D13 do plano `004` nas leituras feitas dentro do servidor Next: a marca final e cada nova tentativa de `lerComposicao` devem ler o banco de novo, e não receber a resposta memorizada pelo Next para consultas GET/HEAD idênticas do mesmo pedido.

## Escopo autorizado

- `src/lib/leitura.ts`, `src/lib/telas/leituras.ts` e `src/lib/telas/leitura-benchmarks.ts`: cada fase da composição (marca antes, insumos, marca depois) passa um `AbortSignal` próprio às consultas, o mecanismo de exclusão documentado em `next/dist/server/lib/dedupe-fetch.js`.
- Testes de reprodução e regressão: Vitest com deduplicação equivalente à do Next e prova no `next start` local com fixtures fictícias (`tests/e2e/navegacao-desempenho.spec.ts` e o preload de medição já existente).
- Fora do escopo: cliente Supabase (`src/lib/supabase/server.ts`), autenticação, sessão, banco/migração, RPC, dependências, otimizações de desempenho da issue #54, prefetch/feedback e documentos do ciclo `005`.

## Elegibilidade da trilha curta

- Correção de comportamento já especificado: D13 do plano executado `_project/executed/004_telas_produto/004_plan.md` exige marcas antes e depois da composição inteira e repetição até três tentativas; no Next real a marca final não chega ao banco.
- Sem mudança de escopo: nenhuma capacidade, tela, rota, parâmetro ou integração; as telas exibem os mesmos dados e mensagens.
- Sem mudança de schema que altere semântica: nenhuma migração.
- Sem mudança de contrato visual: `design-system/DESIGN.md` intocado.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim | Restaura a coerência dos insumos combinados no Início, na Comparação e na prévia do fechamento. Nenhuma regra de cálculo muda; testes D13 existentes e novos precisam passar. |
| G2 — isolamento por RLS | Sim | Leituras autenticadas: mantém o mesmo cliente da sessão e a RLS; nenhuma consulta nova sem sessão, nenhum cache compartilhado. Regressões e2e de isolamento devem passar. |
| G3 — privacidade de dados | Sim | Somente fixtures fictícias e registros sanitizados em `local/` (ignorado); issue, task e PR sem dados do usuário. |
| G4 — migrações só acrescentam | Não | Nenhuma migração. |

## Execução

- [x] Confirmar a causa: deduplicação por pedido do Next 16.4.0, desligada só por `signal`, `keepalive` ou método não-GET; ausência de transportes da marca final no ensaio da issue #54.
- [x] Criar a issue #57 e a branch `fix/issue-57` em `origin/main` `355fbb340ef0dda26f7f5c90fa4ee66767085971`.
- [x] Escrever testes que reproduzem o defeito e falham antes da correção: `src/lib/leitura-next.test.ts` (cliente Supabase real com a regra de deduplicação do Next) e a prova no `next start`.
- [x] Corrigir com `AbortSignal` por fase em `lerComposicao`, repassado por `lerTabela`, contagens, `marcaCarteira`, `marcaBenchmark`, `lerAtivos`, `lerEventos` e pelos três leitores compostos.
- [x] Provar a correção no Vitest e no `next start`; regressões, lint, typecheck, build, e2e completa e D9.
- [x] Reavaliar a elegibilidade com o diff final: só módulos de leitura, testes e o apoio/documentação da medição; sem rota, schema, cliente Supabase, autenticação ou visual.
- [x] Revisão da correção (rodada 1): `APTO PARA APROVAÇÃO`.
- [x] Commit `717f30f` e PR #58 com `Closes #57`.
- [ ] Checks remotos e aprovação do merge.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Reprodução antes da correção (Vitest) | `npx vitest run src/lib/leitura-next.test.ts`: 3 falhas — Início com consolidado antigo e posição nova (`expected 1010000 to be 1020000`); fechamento com 1 transporte da marca de meses em vez de 4; Comparação com consolidado antigo e valores novos (`expected 1010000n to be 1020000n`). |
| Reprodução antes da correção (`next start`) | Registrada na task da issue #54: posição fictícia atualizada com Patrimônio antigo, sem erro; 13 transportes, nenhum da marca final. |
| Vitest depois da correção | `npx vitest run`: 19 arquivos, 204 testes passaram. |
| Prova D13 no `next start` depois da correção | Build de produção com backend local; 1 teste passou (9,8 s): posição fictícia R$ 7.060,00 e Patrimônio R$ 182.800,00, versão nova inteira, sem alerta. Registro sanitizado em `local/issue-57/`: 34 transportes Supabase no pedido, todos 2xx — sessão 1, perfil 1 e duas tentativas completas (marca antes, insumos e marca depois). |
| Custo em chamadas | Sem alteração concorrente, uma tentativa passa de 13 para 18 transportes no Início com carteira cheia (+5 da marca final: meses, última desativação e três contagens), derivado da composição e da prova acima, não medido em série. Comparação: +6 (inclui a cobertura). A nova baseline fica para a issue #54. |
| E2E completa | 1ª execução: 34 passaram, 7 pulados e 18 não executados, sem log completo preservado e sem falha visível no trecho final; descartada como inconclusiva. 2ª e 3ª execuções: 80 passaram e 7 pulados (opt-in de medição/preview), código de saída 0. Inclui `leitura.spec.ts` (D13), isolamento entre usuários, admin, sessão encerrada, ocultação e acessibilidade. |
| D9 | `MEDIR_DESEMPENHO=1`, `desempenho.spec.ts`: mediana 195 ms (191, 194, 195, 201, 202), limite 1.000 ms. |
| Typecheck e lint | `npm run typecheck` passou; `npm run lint` sem erros (3 avisos preexistentes em `local/validacao-ciclo-003/`, ignorado pelo Git). |
| Apoio de medição | `node --test tests/e2e/apoio/medicao-fetch.check.mjs tests/e2e/apoio/resumir-medicao.check.mjs`: 5/5. |
| Testes de governança | `node --test scripts/validate-governance.test.mjs`: 39/39, com `TEMP`/`TMP` em `local/issue-57/governance-temp/`. |
| Validador | `node scripts/validate-governance.mjs`: 0 erros, 0 avisos, 4 itens manuais. |
| `git diff --check` | Passou. |
| Checks remotos | Pendente. |

## Revisão da correção

### Rodada 1

- **Data:** 2026-10-17.
- **Autor:** ferramenta e modelo não informados no artefato recebido.
- **Revisor:** Codex (GPT-6).
- **Alvo conferido:** issue #57 aberta, branch local `fix/issue-57`, base `355fbb340ef0dda26f7f5c90fa4ee66767085971`, sem commit da correção e sem PR no GitHub. Revisão do working tree, incluindo `src/lib/leitura-next.test.ts`, ainda não rastreado. As alterações preexistentes do ciclo `005` não integram o parecer desta correção.
- **Identidade da versão revisada:** SHA-256 `739c72fae9ec75a7ea5d106ec29ede9fc3d05f58cc85934103510ffd55c0c43f`, calculado concatenando caminho, NUL, conteúdo e NUL, nesta ordem: `src/lib/leitura.ts`, `src/lib/telas/leituras.ts`, `src/lib/telas/leitura-benchmarks.ts`, `src/lib/telas/leitura-benchmarks.test.ts`, `src/lib/leitura-next.test.ts`, `tests/e2e/navegacao-desempenho.spec.ts`, `tests/e2e/apoio/medicao-fetch.mjs`, `tests/e2e/apoio/MEDICAO.md`.

**Achados:** nenhum bloqueador ou ressalva identificado nesta rodada; não há achados `R1-k` a responder.

**Itens atendidos:**

- O diff restaura D13 do plano executado `004`: todas as consultas de marca e de insumos dos três leitores compostos recebem o sinal, inclusive contagens HEAD, desativação, cobertura e cada página. Novas tentativas recebem novos sinais e releem o conjunto inteiro. O descarte integral, o limite de três tentativas e o erro recuperável foram preservados.
- O mecanismo foi conferido nas versões instaladas: `next/dist/server/lib/dedupe-fetch.js` retorna diretamente ao transporte quando recebe `options.signal`; `PostgrestTransformBuilder.abortSignal` atribui o sinal que `PostgrestBuilder` envia ao fetch. O uso de `maybeSingle` preserva esse sinal. A correção não depende de `cache: "no-store"`.
- O teste novo usa o cliente Supabase real sobre uma Data API fictícia com a regra de deduplicação relevante. O diff anterior, sem sinal, é compatível com as três falhas de reprodução registradas pelo autor. A prova no `next start` foi repetida pelo revisor e confirma o comportamento do Next real, além da simulação unitária.
- Elegibilidade mantida: restauração de comportamento especificado, sem capacidade, rota, integração, schema ou contrato visual novos. G1 conserva as regras financeiras e os casos de referência; G2 mantém o cliente da sessão e a RLS; G3 usa fixtures fictícias e instrumentação sanitizada; G4 permanece sem migração. Modo contínuo desativado, compatível com G1/G2.

**Validações executadas pelo revisor:**

| Validação | Resultado |
| :-- | :-- |
| `npm test` | 19 arquivos, 204 testes passaram. |
| `npm run typecheck` | Passou. |
| `npm run lint` | Sem erros; os mesmos 3 avisos preexistentes em `local/validacao-ciclo-003/`. |
| `npm run build` | Passou com backend local e Next 16.4.0. |
| Prova D13 no Next real | 1/1 passou (8,7 s; execução total 10,9 s), após novo build. Posição e patrimônio correspondem à versão nova inteira, sem alerta. `local/issue-57/review-transportes.ndjson`: 34 transportes no pedido, todos 200/206; consolidados 6, ativos 10, eventos 8, transferências 4, posições 4, sessão 1 e perfil 1. Evidência compatível com duas tentativas completas, incluindo marcas finais. |
| E2E selecionada, servidor de produção local | 12/12 passaram (16,3 s): os 9 de `leitura.spec.ts`, CR-44 da Comparação, isolamento entre usuários e navegação com sessão encerrada. |
| `npx supabase test db` | 6 arquivos, 239 asserções passaram, incluindo RLS e concorrência. |
| Apoio de medição | 5/5 passaram. |
| Testes de governança | 39/39 passaram, com `TEMP`/`TMP` em `local/issue-57/review-governance-temp/`. |
| Validador e `git diff --check` | 0 erros, 0 avisos e 4 itens manuais; diff sem erro de whitespace. |

**Limites da evidência:** a reprodução negativa é a registrada pelo autor, conferida contra o diff; o revisor não restaurou o código antigo no working tree. A suíte e2e completa e D9 não foram repetidos nesta rodada; seus resultados anteriores permanecem na seção Evidências. A prova de concorrência no Next real cobre o Início; Comparação e fechamento têm cobertura unitária e de integração complementar. Checks remotos continuam pendentes, pois ainda não existe PR. A autorização inicial é a registrada na task; a fala original não consta do contexto desta revisão.

**Veredito: `APTO PARA APROVAÇÃO`.** A correção está apta à preparação da PR pelo workflow `corrigir_trilha_curta`. Este parecer não aprova merge.

## Decisões incidentais e desvios

As alterações locais preexistentes da issue #54 (task #53/#54, plano e `cycles.md` do ciclo `005`, `.agent/lessons_learned.md`) permanecem no working tree, fora do staging desta correção. A prova D13 no `next start`, escrita durante a #54 em `tests/e2e/navegacao-desempenho.spec.ts` e `tests/e2e/apoio/medicao-fetch.mjs`, é reaproveitada como teste de reprodução desta correção; suas asserções passaram a exigir a versão nova inteira, a evidência local foi para `local/issue-57/` e `tests/e2e/apoio/MEDICAO.md` ganhou um parágrafo com o modo de executá-la.

O signal escolhido é o mecanismo de exclusão documentado no código do Next; `cache: "no-store"` não altera a deduplicação. As leituras fora de `lerComposicao` (inclusive `marcaBenchmark` no catálogo e na sincronização) continuam sem signal e, portanto, deduplicadas como antes. O teste de Vitest reproduz a regra do Next sobre uma Data API falsa, porque a deduplicação real depende do `React.cache` de um pedido do servidor; a prova no `next start` cobre o comportamento real.

Os interleavings adicionais citados na revisão da issue #54 (entre subconsultas da marca, cobertura de benchmark no Next real) não foram acrescentados como provas no `next start`: o defeito e a correção são os mesmos para qualquer fase, e os casos de Comparação e de três tentativas estão no Vitest e em `leitura.spec.ts`.

## Encerramento

Não se aplica.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — correção da issue #57
Quem: Responsável
Conferir: checks e diff da [PR #58](https://github.com/EuThiagoAndrade/saldo-futuro/pull/58)
Diga: "aprovo o merge da PR #58"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + fix + corrigir_trilha_curta + 57 + 355fbb340ef0dda26f7f5c90fa4ee66767085971`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: antes, correção revisada (rodada 1, `APTO PARA APROVAÇÃO`, hash `739c72fa…` conferido) no working tree, sem commit nem PR; depois, commit `717f30f` na branch remota `fix/issue-57` e PR #58 aberta contra `main` em `355fbb340ef0dda26f7f5c90fa4ee66767085971`, aguardando checks e aprovação do merge.
- `result`: `executed`
- `evidence`: https://github.com/EuThiagoAndrade/saldo-futuro/pull/58; https://github.com/EuThiagoAndrade/saldo-futuro/issues/57; evidências locais na seção Evidências e parecer na Revisão da correção.
- `blockers`: checks remotos pendentes; aprovação do merge.
