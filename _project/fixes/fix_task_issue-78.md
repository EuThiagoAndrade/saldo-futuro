# Task — Issue #78: Comparação de nomes na gravação da migração diverge do btrim do banco

> **Ciclo:** `—`
> **Trilha:** `curta`
> **Estado:** `Concluída`
> **Tipo:** `fix`
> **Issue:** `#78`
> **Plano:** `—`
> **Branch:** `fix/issue-78`
> **PR:** [#79](https://github.com/EuThiagoAndrade/saldo-futuro/pull/79)
> **Integração:** `Integrada` (PR #79, squash em 2026-10-18; issue #78 fechada pelo merge)
> **Autorização inicial:** "confirmo a trilha curta e autorizo abrir e corrigir a issue [FIX] Comparação de nomes na gravação da migração diverge do btrim do banco" em 2026-10-18
> **Modo contínuo:** `—`
> **Início:** 2026-10-18
> **Última atualização:** 2026-10-18
> **handoff_schema_version:** `2`

## Objetivo

Fazer a comparação da gravação e a conferência da migração tratarem o nome do ativo como `criar_ativo` o grava (`btrim` do PostgreSQL, que remove só o espaço comum das pontas), para que um nome da origem com NBSP nas pontas não acuse `estado_divergente` falso e a carga real possa ser retomada.

## Escopo autorizado

- Uma função única de normalização do nome, com a semântica do `btrim`, usada em `estadoEsperado` (`destino.ts`) e no mapa por nome de `conferir` (`gravar.ts`).
- Teste de unidade que reproduz o defeito e teste de integração `gravar` + `conferir` com NBSP no nome.
- Fora: mudar o plano de operações (e seu hash), a simulação, o banco, o SQLite real ou a carga em produção; a retomada da carga é ação externa do responsável depois do merge.

## Elegibilidade da trilha curta

- Correção de comportamento já especificado: o plano aprovado do ciclo 006 compara o destino com o plano por efeitos completos (ativos por nome, tipo de ajuste e estado) e manda o nome ser a descrição da origem; o efeito real de `criar_ativo` é o `btrim` do banco (`supabase/migrations/20261014185205_carteira.sql`).
- Sem mudança de escopo: nenhuma capacidade, tela, rota, parâmetro ou integração nova.
- Sem mudança de schema que altere semântica: nenhuma migração, tabela ou coluna muda.
- Sem mudança de contrato visual: `DESIGN.md` não é tocado.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Nenhuma fórmula, saldo, componente ou regra de mapeamento muda; só a normalização do nome usada na comparação de estado. |
| G2 — isolamento por RLS | Não | Nenhuma tabela, função, política ou permissão muda; `supabase test db` continua verde. |
| G3 — privacidade de dados | Sim | Issue, task e testes só com nomes fictícios; o diagnóstico na origem foi uma consulta somente leitura autorizada que devolveu só contagens (30 descrições, 2 com NBSP nas pontas). |
| G4 — migrações só acrescentam | Não | Nenhuma migração. |

## Execução

- [x] Triagem curta autorizada; issue #78 criada e conferida (título idêntico).
- [x] Branch `fix/issue-78` a partir de `main` limpa em `cad9f2f7a0478738c514f55dee062c5813fb7e18`.
- [x] Teste que reproduz: falhou antes da correção (`{ ativos: 2 }` para um ativo com NBSP) e passou depois.
- [x] Correção: `nomeComoNoBanco` em `destino.ts`, usada em `estadoEsperado` e em `conferir`.
- [x] Teste de integração com NBSP nos nomes: gravar e conferir sem diferença.
- [x] Reavaliar elegibilidade e barreiras pelo diff final.
- [x] Revisão da correção: rodada 1, `APTO PARA APROVAÇÃO`, sem achados; arquivos conferidos pelo SHA-256 da revisão antes do commit.
- [x] PR #79 com `Closes #78`.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Teste de reprodução | Antes: `{ ativos: 2 }`; depois: `{}`. |
| `npm test` (Vitest) | 21 arquivos, 266 testes verdes. |
| `npx supabase test db` | 7 arquivos, 261 asserções verdes. |
| `npm run lint` / `npm run typecheck` | Sem erros; 3 avisos preexistentes num arquivo de `local/`, fora do Git. |
| Integração da migração (`tests/e2e/migracao.spec.ts`) | Duas execuções inteiras com 23 de 23 verdes, inclusive o teste novo com NBSP. Antes delas, duas execuções foram interrompidas pela queda intermitente do processo do Node no Windows (0xC0000409), em testes sem relação com a mudança, sem falha de asserção |
| `npm run test:e2e` completo | 102 verdes e 9 ignorados (sem as variáveis opcionais), sem falha nem queda de processo. |
| Validador | `node --test scripts/validate-governance.test.mjs` 39/39; `node scripts/validate-governance.mjs` 0 erros, 0 avisos, 4 itens manuais |
| `git diff --check` | Limpo |
| Checks remotos | Os cinco checks verdes no HEAD aprovado da PR #79 antes do merge. |
| Retomada da carga real | Depois do merge, a retomada do `gravar` pelo responsável concluiu 463 de 463 operações e a conferência saiu sem diferença (relato na task da issue #65). |

## Revisão da correção

### Rodada 1

- **Autor:** ferramenta e modelo não informados no artefato recebido.
- **Revisor:** Codex (GPT-6).
- **Data e autorização:** 2026-10-18; solicitação humana "revise a correção da issue #78".
- **Alvo conferido:** issue #78 `OPEN`, branch local `fix/issue-78`, base `cad9f2f7a0478738c514f55dee062c5813fb7e18`; correção no working tree, sem PR no GitHub.
- **Identidade da versão revisada:** SHA-256 `b466a5fc8f6b47a552e272b453c99983f60e31a6a2cab851d360d565c498157d`, calculado concatenando caminho, NUL, conteúdo e NUL, nesta ordem: `src/lib/migracao/destino.ts`, `src/lib/migracao/gravar.ts`, `src/lib/migracao/gravar.test.ts`, `tests/e2e/migracao.spec.ts`.

#### Achados

Nenhum bloqueador ou ressalva identificado; não há achados `R1-k` a responder.

#### Itens atendidos

- `nomeComoNoBanco` remove somente U+0020 nas pontas, conforme `btrim(p_nome)` de `criar_ativo` na migração `20261014185205_carteira.sql`. A função é compartilhada por `estadoEsperado` e pelo mapa de nomes de `conferir`; o nome efetivamente lido do destino continua sendo comparado integralmente.
- A normalização ocorre só na comparação. Payloads, versão e hash do plano, simulação, diário, envio de RPCs e regras financeiras não mudam. O código anterior e o corrigido foram executados sobre o mesmo plano fictício para conferir essa compatibilidade.
- O teste unitário reproduz o falso positivo com NBSP; o teste de integração verifica gravação, conferência e nomes efetivamente persistidos pelo banco. A retomada de um prefixo confirmado também foi comprovada pelo revisor, sem alteração do código de implementação ou dos testes.
- Os quatro critérios da trilha curta permanecem atendidos: restauração da comparação por efeitos completos prevista no plano 006, sem capacidade, rota, parâmetro, integração, semântica de schema ou contrato visual novos. G1/G2/G4 não se aplicam ao diff; G3 usa somente dados fictícios. Nenhum dado real, credencial de produção ou arquivo de `local/` foi lido nesta revisão.
- A recusa conservadora de descrições formadas só por espaços em branco em `simular.ts` é preexistente e já está relatada na task; não impede a correção delimitada pela issue #78.

#### Validações executadas pelo revisor

| Validação | Resultado |
| :-- | :-- |
| Reprodução unitária antes/depois | Código de `destino.ts` da base carregado em memória, sem restaurar arquivos: `{ ativos: 2 }` antes, `{}` depois, com os mesmos dados fictícios. |
| `npm test -- src/lib/migracao/gravar.test.ts` | 13/13 testes passaram. |
| Equivalência com PostgreSQL local | 1.462 combinações de U+0020, NBSP, tabulação, CR/LF, U+2028, U+2029, BOM e texto comparadas com o `btrim` real; nenhuma divergência. |
| E2E selecionada no Supabase local | 9/9 passaram: NBSP, respostas perdidas após commit das sete operações e reexecução concluída. O comando Playwright também executou o build antes dos testes. |
| Retomada com NBSP e prefixo confirmado | Código de `gravar.ts` e `destino.ts` da base carregado em memória: parou em `estado_divergente`, com `{ ativos: 4 }`, após 6 de 17 operações fictícias. O código corrigido retomou com o mesmo plano/hash e diário, enviou apenas as 11 restantes e confirmou 17/17; prefixo do diário preservado e nenhuma intenção duplicada. `conferir`: 4 meses, diferenças vazias. Nova reexecução: `already_executed_and_reconciled`, zero envios. Fixtures e usuário fictício removidos ao final. |
| Governança | `node --test scripts/validate-governance.test.mjs`: 39/39; `node scripts/validate-governance.mjs`: 0 erros, 0 avisos e 4 itens manuais. |
| `git diff --check` | Limpo. |

**Limites da evidência:** a carga real não foi acessada nem retomada; os resultados acima são de dados fictícios no Supabase local. A suíte completa, lint, typecheck e os testes de banco não foram repetidos pelo revisor; permanecem como evidências do autor na seção anterior. A autorização inicial da correção foi conferida como registro da task, pois sua fala original não consta do contexto desta revisão. Checks remotos continuam pendentes, pois ainda não existe PR.

**Veredito: `APTO PARA APROVAÇÃO`.** Correção apta à preparação da PR pelo workflow `corrigir_trilha_curta`. Este parecer não aprova merge nem autoriza a retomada da carga real pelo agente.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + fix + revisar_plano + issue-78/rodada-1 + b466a5fc8f6b47a552e272b453c99983f60e31a6a2cab851d360d565c498157d`
- `effect_class`: `local_mutation`
- `state_before`: issue #78 `OPEN`; correção local pronta; task `Em andamento`; aguardando revisão da rodada 1; sem PR.
- `state_after`: rodada 1 registrada com veredito `APTO PARA APROVAÇÃO`; task permanece `Em andamento`; próximo passo `Pronto para continuar`; sem PR.
- `result`: `executed`
- `evidence`: solicitação humana desta revisão; identidade dos quatro arquivos revisados; reprodução negativa/positiva, 13 testes unitários, 9 E2E, comparação com PostgreSQL em 1.462 casos e retomada fictícia com plano/hash e diário preservados; governança e diff limpos.
- `blockers`: nenhum achado de revisão; abertura da PR pelo workflow `corrigir_trilha_curta` depende do pedido de continuação; integração exige checks verdes e aprovação própria de merge. A retomada real permanece ação externa do responsável após o merge.

## Decisões incidentais e desvios

1. **Fora do escopo, relatado:** `simular.ts` ainda recusa como "ativo inválido" uma descrição formada só por espaços em branco pelo `trim()` do JavaScript, mais estrito que a restrição do banco (`char_length(btrim(nome))`). É uma recusa conservadora, que não afeta a carga atual; não foi alterada.

## Encerramento

Não se aplica — correção pela trilha curta.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Concluído — correção da issue #78
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + fix + corrigir_trilha_curta + 78 + base cad9f2f7a0478738c514f55dee062c5813fb7e18`
- `effect_class`: `remote_mutation`
- `state_before`: correção local revisada (rodada 1, `APTO PARA APROVAÇÃO`); sem PR
- `state_after`: branch `fix/issue-78` publicada; PR #79 aberta contra `main` com `Closes #78`; task `Aguardando integração`
- `result`: `executed`
- `evidence`: "continue a correção da issue #78" em 2026-10-18; SHA-256 dos quatro arquivos igual ao da revisão (`b466a5fc…`); validador e `git diff --check` limpos
- `blockers`: checks remotos e "aprovo o merge da PR #79"; depois, a retomada do `gravar` pelo responsável
