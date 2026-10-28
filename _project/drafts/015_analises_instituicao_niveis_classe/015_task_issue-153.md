# Task — Issue #153: Editar nome do ativo e proteger análises do Início

> **Ciclo:** `015`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `feature`
> **Issue:** `#153`
> **Plano:** `_project/drafts/015_analises_instituicao_niveis_classe/015_plan.md`
> **Branch:** `feature/issue-153`
> **PR:** https://github.com/EuThiagoAndrade/saldo-futuro/pull/158
> **Integração:** PR #158 integrada por squash (`e0e21dffc722aee575f1ed1ad0c7cd70896f5cb5`) em 2026-10-27, com todos os checks verdes; issue #153 fechada pelo `Closes #153`
> **Autorização inicial:** "autorizo a implementação da issue #153" em 2026-10-27
> **Modo contínuo:** `—`
> **Início:** 2026-10-27
> **Última atualização:** 2026-10-27
> **handoff_schema_version:** `2`

## Objetivo

Entregar a unidade C do plano aprovado, issue #153: os leitores do Início passam a usar a marca financeira mais a versão dos metadados, e o formulário de edição do ativo passa a salvar nome e detalhes numa única chamada transacional.

## Escopo autorizado

`src/lib/leitura.ts` (leitor da nova versão, sem alterar `marcaCarteira`), leitores do Início em `src/lib/telas/leituras.ts` e o leitor institucional que a unidade D conectará; campo Nome, validação com a semântica do banco e Server Action sobre `editar_ativo_com_nome`; contrato do formulário no DESIGN.md; testes de leitura e e2e diretamente afetados. Sem composição nova no fechamento nem nas telas descritivas, sem migração e sem alterar o Início visível.

## Origem no backlog

Snapshot herdado da ideação, sem nova seleção nem alteração do item:

- **BL-009 — Metadados descritivos e classificação de ativos com aproveitamento do histórico:** selecionadas as visões analíticas por instituição e por classe nos níveis 2 e 3, em conjunto para este ciclo. Os campos descritivos e a visão macro foram encaminhados nos ciclos 012 e 013. O responsável informou em 2026-10-27 que já preencheu os dados descritivos dos ativos históricos migrados; é relato humano, não verificação de dados. A carga manual não integra esta seleção.
- Snapshot: `_project/backlog.md` na fila canônica, commit `84f0a5ea107f33e0de5c506b3ea0825346f6e58e`, presente em `origin/main` conforme a ideação; destino ciclo 015 em preparação. O item continua disponível e não foi alterado pela seleção.
- A edição do nome é extensão pedida diretamente pelo responsável durante a ideação; não deriva de BL-015. O retorno à fila, somente depois da integração comprovada do destino, usa a referência estável `ciclo 015`; sua publicação exige autorização separada.

## Elegibilidade da trilha curta

Não se aplica — trilha normal, unidade C do ciclo completo.

## Barreiras de domínio

Toda linha é obrigatória. "Não se aplica" exige justificativa. Com G1 ou G2 marcados com "Sim", o modo contínuo não pode estar `ativo`.

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Nenhum cálculo muda: os algoritmos e a KB-004 ficam como estão (unidade B). A renomeação alterar o centésimo do desempate por ativo é o efeito já decidido (decisão 8 da ideação; CR-015-14) e é demonstrada em teste de leitura |
| G2 — isolamento por RLS | Não | Sem tabela, política, função ou migração: a aplicação só chama as duas RPCs da unidade A, sob a sessão do usuário, e a Server Action não recebe `user_id`, tipo de ajuste, sistema nem estado. O isolamento da RPC está provado na unidade A (535 asserções de banco) |
| G3 — privacidade de dados | Sim | Somente nomes e valores fictícios nos testes; nenhum dado real lido ou escrito |
| G4 — migrações só acrescentam | Não | Nenhuma migração criada, editada ou removida |

## Execução

- [x] Issue, plano, autorização e base conferidos; `main` igual a `origin/main` (10bc3ad); branch `feature/issue-153` criada. E1 da unidade A informada como concluída pelo responsável (ver a task da #151).
- [x] `versaoMetadados` substitui `versaoClassificacao` (não havia outro consumidor); `marcaCarteira` e `lerInsumosDoFechamento` intactos.
- [x] Leitores do Início por ativo, por classe e por instituição (novo, para a unidade D) com marca = carteira + metadados, lidas em paralelo em cada fase com signal fresco; a leitura por classe não chama mais a RPC antiga.
- [x] Campo Nome (controlado), validação `lerNome` com `btrim` do banco e pontos de código, e a ação `editarAtivo` chamando `editar_ativo_com_nome` uma única vez.
- [x] Contrato do formulário na seção 6.8 do DESIGN.md.
- [x] Testes de leitura (A → B → A, marca inválida, varredura de escrita depois de cada transporte, renomeação no rateio por ativo) e de nome; e2e da edição.
- [x] Gates locais concluídos e staging revisado.
- [x] PR #158 publicada (`Closes #153` no corpo); integração exige aprovação própria.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | Unitários: 468/468 (21 novos nas leituras do Início e na validação do nome); governança: 48/48; lint sem erros (3 avisos preexistentes em `local/`), typecheck e build passaram; e2e autenticado sobre build com Supabase local, suíte completa: 211 passed, 12 skipped (preview sem backend), nenhum flaky, saída 0, dois workers (inclui 2 testes novos da edição do nome). Banco: não executado, sem alteração de banco |
| Validador | 0 erros, 0 avisos; conferências manuais realizadas (G3: só nomes e valores fictícios) |
| `git diff --check` | Passou |
| Checks remotos | Verdes na PR #158 antes do merge: governança, lint/tipos/testes/build/e2e de preview, banco e e2e autenticado, Vercel |

## Revisão da correção

Não se aplica — trilha normal.

## Decisões incidentais e desvios

- **Sem campo `maxLength`.** O atributo conta unidades UTF-16 e recusaria no navegador um nome válido com caracteres fora do plano básico (100 caracteres Unicode); a regra fica no servidor, com a mensagem acessível em `role="alert"`.
- **Valores mantidos na recusa.** O Nome é um campo controlado e mantém o que foi digitado. Os demais campos descritivos continuam como eram (a redefinição de formulário do React 19 após a ação não foi alterada); não ampliei o escopo para eles.
- **`versaoClassificacao` removida.** Ficou sem consumidor ao trocar a marca da visão por classe; o banco mantém a coluna, o gatilho e a RPC antigos para a aplicação anterior.
- **Criação do ativo.** Não mudei a validação do nome no cadastro (`trim()` do JavaScript), conforme o plano: sem necessidade demonstrada nesta unidade.
- **Reconciliações.** Conforme `_project/README.md`, as tasks das unidades A e B foram reconciliadas (A com a E1 informada pelo responsável, sem data nem resultados; B com o merge da PR #156), e o plano registra a autorização desta unidade.

## Encerramento

Não se aplica — ciclo completo; encerramento em PR própria.

## Próximo passo

Esta task está concluída; o ciclo continua na task da issue #154.

```text
PRÓXIMO PASSO
Situação: Pronto para continuar — ciclo 015 (completo)
Quem: Qualquer ferramenta, a pedido do responsável
Conferir: —
Diga: "continue o ciclo 015"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 015 + implementar_issue + 153 + 10bc3adea7498337d4f66bb0066ab1e31b7949a8`
- `effect_class`: `remote_mutation`
- `state_before`: plano aprovado, #153 autorizada, unidades A e B integradas, E1 informada como concluída.
- `state_after`: unidade C implementada e validada localmente; PR #158 publicada na branch feature/issue-153; aguardando integração.
- `result`: `executed`
- `evidence`: 468 testes unitários, 48 de governança, lint, typecheck, build e e2e completo (211 passed, 12 skipped, nenhum flaky); evidências acima.
- `blockers`: nenhum para publicar; merge depende de checks verdes e aprovação própria. A E1 da unidade A é relato do responsável, não verificado pelo agente.
