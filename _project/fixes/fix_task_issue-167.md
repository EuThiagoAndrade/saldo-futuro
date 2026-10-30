# Task — Issue #167: Registrar a data de publicação da nota 0.12.0 em Novidades

> **Ciclo:** `—` (trilha curta: `—`)
> **Trilha:** `curta`
> **Estado:** `Aguardando integração`
> **Tipo:** `fix`
> **Issue:** `#167`
> **Plano:** `—`
> **Branch:** `fix/issue-167`
> **PR:** [#168](https://github.com/EuThiagoAndrade/saldo-futuro/pull/168)
> **Integração:** `Pendente`
> **Autorização inicial:** "confirmo a trilha curta e autorizo abrir e corrigir a issue [FIX]" em 2026-10-30, com o pedido explícito imediatamente anterior, no mesmo dia: "Vamos usar a trilha curta e modo contínuo. Apenas colocar a data em novidades." A frase recebida veio sem o título e sem o sufixo " em modo contínuo"; o responsável tinha acabado de pedir a trilha curta e o modo contínuo para a única proposta apresentada na triagem, e o modo foi registrado como `ativo` com base nesse pedido escrito.
> **Modo contínuo:** `ativo`
> **Início:** 2026-10-30
> **Última atualização:** 2026-10-30
> **handoff_schema_version:** `2`

## Objetivo

Registrar em `src/lib/novidades.ts` a data civil de publicação da release 0.12.0 (2026-10-30, America/Cuiaba), que ficou `null` por não ser conhecida quando a nota foi escrita no ciclo `016`.

## Escopo autorizado

Trocar `publicadaEm: null` por `"2026-10-30"` na entrada `0.12.0` e ajustar o teste da nota. Nada mais: sem mudança de texto das notas, de lógica de exibição, de cálculo, de schema ou de interface.

## Origem no backlog

Não se aplica.

## Elegibilidade da trilha curta

Critérios de `_project/README.md`, justificados com evidência do repositório:

- **Correção de comportamento já especificado:** o comentário de `src/lib/novidades.ts` (linhas 3-7), a KB-003 e o plano do ciclo `016` (seção "Novidades e release") determinam que a data civil é registrada depois da publicação comprovada. A release `v0.12.0` foi publicada em 2026-10-30T20:36:11Z (16:36 em Cuiabá). A correção restaura o resultado esperado, que é a nota publicada com sua data. O responsável escolheu esta trilha ao ser informado de que o primeiro critério admitia dúvida, por não se tratar de um defeito de código.
- **Sem mudança de escopo:** nenhuma capacidade, tela, rota, parâmetro ou integração.
- **Sem mudança de schema que altere semântica:** nenhuma migração.
- **Sem mudança de contrato visual:** a página já exibe a data quando ela existe; o `DESIGN.md` não muda.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Só uma data de publicação em texto; nenhum cálculo ou regra financeira |
| G2 — isolamento por RLS | Não | Sem tabela, política, função, autenticação ou leitor |
| G3 — privacidade de dados | Sim | A data é pública (release do GitHub); nenhum dado do usuário na issue, no teste ou na task |
| G4 — migrações só acrescentam | Não | Nenhuma migração criada, editada ou removida |

## Execução

- [x] Issue #167 aberta com o título e o conteúdo apresentados na triagem; base `main` igual a `origin/main` (`359b358`); branch `fix/issue-167` criada.
- [x] Teste que reproduz o defeito: `novidades.test.ts` passou a exigir `publicadaEm` igual a `"2026-10-30"` para a `0.12.0`; falhou antes da correção (recebeu `null`).
- [x] Correção: `publicadaEm: "2026-10-30"` em `src/lib/novidades.ts`.
- [x] Elegibilidade reavaliada com o diff final: continua atendida.
- [x] Gates locais e revisão da correção (abaixo).
- [ ] PR #168 publicada com `Closes #167`; checks remotos e aprovação do merge pendentes.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | Reprodução: o teste falhou antes da correção (`expected null to be '2026-10-30'`) e passou depois. Unitários: 476/476; lint sem erros (3 avisos preexistentes em `local/`); typecheck passou. O build e a suíte e2e completa rodam no CI |
| Validador | 0 erros, 0 avisos; governança: 48/48 |
| `git diff --check` | Passou |
| Checks remotos | Pendente — dependem da PR |

## Revisão da correção

### Rodada 1

- **Autor:** Claude Code (Claude Sonnet 5.5), na branch `fix/issue-167`.
- **Revisor:** Claude Code (Claude Sonnet 5.5), como etapa separada, coberta pelo modo contínuo (revisão não externa).
- **Base:** diff local da correção sobre `main` em `359b358`; issue #167 `OPEN`; sem PR.

#### Conferência

- O diff da aplicação é uma linha em `src/lib/novidades.ts` (`null` → `"2026-10-30"`) e o ajuste do teste da nota. O texto das notas, a ordem e a lógica de exibição não mudam.
- A data confere com a evidência: release `v0.12.0` em 2026-10-30T20:36:11Z, que em America/Cuiaba (UTC−4) é 2026-10-30, 16:36. O formato é AAAA-MM-DD, aceito pelo teste do histórico, que também exige versões únicas e notas sem identificadores técnicos.
- O teste novo falhou antes da correção e passou depois; os 476 testes unitários passaram. Os testes de visibilidade seguem com versões literais (`novidadesPublicadas("0.11.0", …)` e `("0.12.0", …)`), sem depender da versão do `package.json`.
- Nenhuma regra financeira, política, migração, schema ou interface foi alterada; issue, task e teste sem dados do usuário.

#### Achados

- **Bloqueadores:** nenhum.
- **Ressalvas:** nenhuma.

**Veredito: `APTO PARA APROVAÇÃO`.** A revisão não aprova merge.

## Decisões incidentais e desvios

- **Teste da nota.** O teste que eu tinha escrito no ciclo `016` afirmava `publicadaEm` nulo para a `0.12.0`; passou a afirmar a data, que é o comportamento agora esperado. Os trechos de visibilidade não mudaram.
- **Frase de autorização.** Veio sem título e sem o sufixo de modo contínuo; ver o cabeçalho. Se o responsável preferir o modo `—`, basta dizer; a cadeia pararia nos pontos comuns de aprovação.
- **Não alterado.** `README`, `DESIGN.md`, KB-003, backlog, `cycles.md` e a nota da `0.12.0` além da data.

## Encerramento

Não se aplica — trilha curta, sem ciclo.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — correção da issue #167
Quem: Responsável
Conferir: Checks e diff da PR #168 (https://github.com/EuThiagoAndrade/saldo-futuro/pull/168)
Diga: "aprovo o merge da PR #168"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + fix + corrigir_trilha_curta + 167 + 359b358b55da3ad4d64fd91d42904510c54d83ec`
- `effect_class`: `remote_mutation`
- `state_before`: release v0.12.0 publicada, nota `0.12.0` com `publicadaEm: null`; issue #167 criada; `main` em `359b358`.
- `state_after`: correção aplicada e validada localmente na branch `fix/issue-167`; revisão da rodada 1 `APTO PARA APROVAÇÃO`; PR #168 publicada, aguardando checks e aprovação do merge.
- `result`: `executed`
- `evidence`: issue #167; teste que falhou e passou; 476 testes unitários; lint, typecheck e validador sem erros; evidências acima.
- `blockers`: nenhum para publicar; o merge depende de checks verdes e "aprovo o merge da PR #168".
