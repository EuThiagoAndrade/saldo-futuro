# Task — Issue #116: Auditar o histórico público e as configurações do repositório

> **Ciclo:** `011`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `chore`
> **Issue:** `#116`
> **Plano:** `_project/executed/011_repositorio_publico_governanca_igpm/011_plan.md`
> **Branch:** `chore/issue-116`
> **PR:** [#119](https://github.com/EuThiagoAndrade/saldo-futuro/pull/119)
> **Integração:** PR #119 integrada por squash em 2026-10-22 (horário de Cuiabá); issue #116 fechada como concluída
> **Autorização inicial:** "autorizo a implementação da issue #116" em 2026-10-22
> **Modo contínuo:** `—`
> **Início:** 2026-10-22
> **Última atualização:** 2026-10-22
> **handoff_schema_version:** `2`

## Objetivo

Refazer, com registro verificável, a auditoria do histórico e do conteúdo público do repositório em busca de segredos e dados do usuário, e observar por leitura as configurações de segurança, conforme o item 1 do plano e o método D-A1 aprovado.

## Escopo autorizado

Item 1 do plano, método D-A1: alcance contado, M1 (secret scanning do GitHub por API), M2 (script Node 24 sem dependências, fora do repositório), M3 (arquivos e imagens), triagem por inventário local ignorado e M4 (configurações por leitura). Entregável versionado: `_project/drafts/011_repositorio_publico_governanca_igpm/011_research_auditoria_historico.md`, esta task e os registros do plano e do índice herdados da criação das issues. Fora: instalar ou baixar ferramenta, baixar anexos sem autorização expressa, alterar configurações e remediar achados.

## Origem no backlog

Não se aplica — a issue #116 não tem origem no backlog; a origem do ciclo (BL-007) pertence à issue #118.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não se aplica | Nenhuma regra, cálculo ou código de aplicação muda; entrega documental. |
| G2 — isolamento por RLS | Não se aplica | Nenhuma tabela, política, função ou autenticação muda; as leituras de configuração não alteram nada. |
| G3 — privacidade de dados | Sim | Ver "Execução" e o registro: só contagens, categorias e conclusões no versionado; inventário com referências e sem valores em `local/`, ignorado. |
| G4 — migrações só acrescentam | Não se aplica | Nenhuma migração adicionada ou alterada. |

## Execução

- [x] Branch `chore/issue-116` sobre `main` `07adff78c33d8b5565e5ef77d425ced33a3f6d01`; plano `Em Execução` e ciclo `Em execução`; vínculos das issues (registrados na criação) incluídos nesta entrega.
- [x] Alcance contado: 130 refs remotos (75 cabeças de PR), 7 tags, 236 commits, 913 blobs, 43 issues, 75 PRs, 74 comentários, 7 releases.
- [x] M1 — secret scanning ativo com proteção de push; 0 alertas abertos e 0 resolvidos, lidos sem o campo `secret`.
- [x] M2 — script Node 24 sem dependências fora do repositório: 1.172 ocorrências de conteúdo em 111 grupos e 375 de metadados de commit.
- [x] M3 — 0 arquivos de dados ou segredo; 4 PNG revistas visualmente (ícones); 3 fontes; 2 SVG varridos como texto; 0 anexos, sem download.
- [x] Triagem — 1.547 ocorrências, 1.547 falsos positivos por critérios C1 a C8, 0 achados, 0 pendentes; SHA-256 do inventário `69da3a369ce572373d2f0523b9e70bc99e6c12898fab3453144a17111a8f37d6`.
- [x] M4 — configurações lidas sem alteração; itens da Vercel listados para o responsável.
- [x] Registro em `_project/drafts/011_repositorio_publico_governanca_igpm/011_research_auditoria_historico.md`.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | `node --test scripts/validate-governance.test.mjs`: 48/48 passaram |
| Validador | `node scripts/validate-governance.mjs`: 0 erros, 0 avisos, 5 itens manuais conferidos (sem dado do usuário no registro, frases de autorização reais, barreiras coerentes) |
| `git diff --check` | Limpo, também no staging |
| G3 do entregável | Registro, task e plano revistos: só totais, categorias e critérios; nenhum valor, e-mail ou local de ocorrência. Inventário em `local/`, confirmado por `git check-ignore` |
| Checks remotos | PR #119: governança, CI de app, banco e e2e autenticado e Vercel verdes no HEAD integrado |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

- **Padrões ampliados de forma conservadora:** códigos da B3, títulos do Tesouro, blocos gzip+Base64 do ciclo 005 e e-mails dos metadados de autoria entraram em M2, para reduzir as limitações declaradas no plano. Não ampliou o escopo da issue.
- **E-mail pessoal nos metadados de autoria (132 ocorrências, 77 commits):** a classificação foi levada ao responsável antes de concluir. Em 2026-10-22, em resposta à pergunta expressa, ele escolheu "Aceitar como autoria"; a ocorrência virou falso positivo pelo critério C8, e o registro recomenda o e-mail `noreply` nos próximos commits, ajuste do responsável fora do ciclo.
- **Fora do escopo, levado ao responsável:** os 3 alertas abertos do Dependabot são do `next` e são corrigidos pela 16.4.1 (PR #113). A proteção do `main` existe por ruleset ativo, e não por proteção clássica; isso alimenta o ajuste de `_project/README.md:469` na issue #117.

## Encerramento

Não se aplica.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 011 (completo)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 011 + implementar_issue + 116 + 07adff78c33d8b5565e5ef77d425ced33a3f6d01`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: issue #116 aberta, plano `Aprovado`, ciclo `Planejamento`, sem branch / auditoria concluída sem achado, registro e task na branch `chore/issue-116`, PR #119 aberta com `Closes #116`, plano `Em Execução` e ciclo `Em execução`.
- `result`: `executed`
- `evidence`: registro da auditoria; SHA-256 do inventário; decisão do responsável sobre C8; gates locais acima; PR #119.
- `blockers`: checks verdes e "aprovo o merge da PR #119". A issue #117 depende desta integração.
- **Reconciliação pós-merge (registrada na entrega da #117):** "aprovo o merge da PR #119" em 2026-10-22; checks verdes no HEAD `e545467`; squash integrado em `main`; issue #116 `CLOSED` como concluída. Situação seguinte: autorização da issue #117, já concedida.
