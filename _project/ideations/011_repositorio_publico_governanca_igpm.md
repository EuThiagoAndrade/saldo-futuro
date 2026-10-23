# Ideação — 011: Repositório público na governança e benchmark IGP-M

> **Ciclo:** `011`
> **Estado:** `Ideação`
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 011" em 2026-10-22
> **Criado em:** 2026-10-22
> **Última atualização:** 2026-10-22
> **handoff_schema_version:** `2`

## Problema

Duas frentes foram reunidas neste ciclo por decisão do responsável:

- **Repositório público.** O repositório virou público em 2026-10-22, porque os GitHub Actions foram bloqueados pelo limite de minutos do plano gratuito em repositório privado. A documentação normativa continua dizendo que ele é privado até a estabilização. O ADR-003 exige um ciclo próprio de auditoria do histórico e autorização explícita antes da abertura; a abertura aconteceu por outro motivo, e a auditoria foi feita pelo agente, a pedido do responsável, sem registro de método, escopo ou evidência. Além disso, a pasta local `.claude/` (configuração da ferramenta, hoje não rastreada) deve ser ignorada pelo Git.
- **BL-007.** A aplicação só oferece o IPCA como referência de índice de preços. Falta o IGP-M para comparar o desempenho com ativos e contratos referenciados nele.

O nível é completo porque a primeira frente altera regras de governança (`.agent/ai_behavior.md` e ADR) e a segunda cria uma migração de banco. O modo contínuo é proibido.

## Origem no backlog

Snapshot da seleção de 2026-10-22. Fila lida no worktree `C:\Programas\saldo-futuro-backlog` (reanexado nesta data, estava `prunable`), branch `chore/backlog`. O commit `46b46bb` (retorno do ciclo 010 em BL-005, BL-006, BL-011 e BL-012) está **local, não publicado**, sobre `49a1332` (PR #102, publicado em `main`). O BL-007 já existe em `main`, no estado `Disponível`, sem alteração no commit local. Destino em preparação: nenhum item foi alterado por esta ideação.

| ID | Síntese da necessidade | Parcela selecionada |
| :-- | :-- | :-- |
| BL-007 | Incluir o IGP-M (série SGS 189, mensal) no catálogo de benchmarks para comparação da rentabilidade, sem mudar o modelo de cálculo | Integral |

Referência: `_project/backlog.md` no commit da fila `46b46bb`. O snapshot não é reescrito por edições futuras do backlog. O retorno em BL-007 só ocorre depois da integração comprovada do destino em `main`, por `ciclo 011`, e sua publicação continua separada. A publicação do commit `46b46bb` também depende de pedido próprio ("publique as alterações do backlog").

## Contexto e evidências

### Fatos observados

Inspeção local de 2026-10-22 em `EuThiagoAndrade/saldo-futuro`, `main` em `d480837`. Nenhum dado real foi lido; `local/` não foi aberto.

**Repositório público**
- `gh repo view` retorna `PUBLIC`. O motivo (limite de minutos do Actions) foi informado pelo responsável. O risco já estava previsto no plano do ciclo `001` (cota de 2.000 minutos mensais no GitHub Free para repositório privado).
- O ADR-003, seção "Publicação do repositório", diz que o repositório permanece privado até a estabilização, exige um ciclo próprio de auditoria do histórico e a autorização explícita do responsável. A seção "Alternativas consideradas" rejeita "repositório público desde o início".
- `.agent/ai_behavior.md:134` repete "privado até a estabilização e depois se torna público". `_project/knowledge/KB-002_operacao_producao_acessos.md:144` (passo V1) afirma "O repositório é privado" e orienta ajustar permissões do app do GitHub na Vercel.
- O plano `000` (linhas 69, 321 e 627) e o plano `001` (R7 e linhas 508, 622 e 675) descrevem o repositório como privado. São planos executados, isto é, registro histórico aprovado.
- Verificação limitada do histórico: `git log --all --diff-filter=A --name-only`, filtrado por extensões de dados e segredos (`.sqlite`, `.db`, `.csv`, `.xlsx`, `.env`, `.pem`, `.key`) e pelo prefixo `local/`, não encontrou nenhum caminho adicionado. É só uma checagem de **nomes** de arquivo; o conteúdo dos commits, mensagens, issues e PRs não foi varrido e isso **não substitui** a auditoria.
- `.gitignore` não tem `.claude/`. A pasta contém só `launch.json` (comando do servidor de desenvolvimento), sem segredos. O manifesto do validador (`gitignoreRequired`) lista apenas exclusões mínimas; acrescentar uma linha não conflita com ele.
- Não existem `SECURITY.md` nem `CONTRIBUTING.md`. A licença MIT está em `LICENSE`.

**BL-007 — IGP-M**
- O catálogo inicial (CDI, SGS 12, diária; IPCA, SGS 433, mensal) foi inserido na migração `20261014193630_benchmarks.sql:67-69`, já aplicada. A barreira G4 proíbe editá-la; o IGP-M exige migração nova e aditiva. Código SGS e periodicidade são imutáveis por benchmark (D8).
- O cliente SGS (`src/lib/benchmarks/sgs.ts`) é genérico por `codigo_sgs` e periodicidade e exige datas mensais no dia 1. Fora de testes, nenhum código de aplicação cita 433. As telas (`/benchmarks`, comparação e `/admin/benchmarks`) leem o catálogo do banco por `lerCatalogo`.
- Consulta à API pública do Banco Central em 2026-10-22: a série 189 devolve itens mensais no mesmo formato da 433 (`data` em `01/MM/AAAA`, `valor` decimal com ponto, inclusive negativos); o último mês publicado é setembro de 2026.
- O teste de banco `supabase/tests/database/06_benchmarks.test.sql:56` conta `codigo_sgs in (12, 433)`, então não quebra com uma terceira linha. Há casos de referência do IPCA em `tests/fixtures/financeiro/casos_referencia.json`.
- A sincronização é ação do administrador em `/admin/benchmarks`. Aplicar a migração em produção e sincronizar o IGP-M são ações externas do responsável.

### Hipóteses (a confirmar no plano)

- O IGP-M entra apenas por migração, sem mudança de código e sem tocar G1, porque o cálculo mensal já é genérico (`retornoMensalMensal`).
- Repositório público dispensa a cota de minutos do Actions para runners padrão; confirmar na documentação do GitHub antes de registrar no ADR.
- Textos de produto ou KBs que citem só o IPCA como índice de preços podem precisar de uma menção ao IGP-M.

## Resultado desejado

- `.claude/` ignorado pelo Git.
- ADR-003, `ai_behavior.md` e KB-002 (documentos vivos) coerentes com o repositório público, registrando a data, o motivo e a situação da auditoria.
- Auditoria do histórico com registro verificável, sem reproduzir dado do usuário, se o responsável optar por refazê-la.
- IGP-M disponível no catálogo, na comparação e na administração, com migração aditiva, testes de banco e e2e coerentes e roteiro da ação externa (migração e sincronização).

## Alternativas

**Planos executados com a menção "privado"**
- **A1 — Não reescrever** planos e tasks executados, por serem registro histórico, e corrigir só os documentos vivos. É a recomendação do agente.
- **A2 — Nota de contexto** curta no topo de cada plano afetado, sem alterar o texto original.
- **A3 — Reescrever** os trechos. Apaga o contexto da decisão original; não recomendado.

**Forma da atualização do ADR-003**
- **B1 — Emenda datada no próprio ADR-003**, como o ciclo 010 fez com o ADR-005. Recomendada.
- **B2 — Novo ADR** que substitua a parte de publicação. Mais pesado para um ajuste de fato consumado.

**Auditoria do histórico**
- **C1 — Registrar o que já foi feito**: o responsável confirma que a auditoria ocorreu, sem método nem evidência recuperáveis, e o ADR diz isso com franqueza. Rápido, mas fraco como garantia.
- **C2 — Refazer com registro**: varredura do histórico completo (commits, mensagens, issues e PRs) com ferramenta de detecção de segredos e verificação por tipos de arquivo; o resultado grava só contagens e conclusões. Recomendada, porque o histórico é permanente e já público.
- **C3 — C1 agora e C2 em ciclo próprio.** Aceitável se o responsável preferir reduzir o escopo.

## Riscos e restrições

- **Histórico público e permanente.** Se a auditoria achar dado do usuário ou segredo, a resposta (rotacionar credenciais, reescrever histórico, tornar o repositório privado de novo) é decisão do responsável e fica fora deste ciclo, que apenas registra e escala.
- **G3 nos próprios artefatos.** Ideação, plano, ADR e evidências não trazem dado do usuário, só índices públicos e contagens.
- **Regras de governança.** Mudar o `ai_behavior.md` e o ADR exige o ciclo completo, o validador verde e a revisão formal do plano.
- **Migração (G4).** Só aditiva, sem editar a migração do ciclo 003. Aplicar em produção e sincronizar o IGP-M são ações externas, nunca cobertas por modo contínuo.
- **Segurança do GitHub.** Configurações do repositório (proteção de branch, varredura de segredos, políticas de PR vindo de forks) são ações do responsável; o agente só poderia observá-las por leitura.
- **Fonte do índice.** O IGP-M é publicado pela FGV e redistribuído no SGS; um atraso ou revisão da série afeta a cobertura do benchmark, tratada pelo mecanismo existente de cobertura sem buracos.

## Perguntas em aberto

1. Planos executados com a menção "privado": A1, A2 ou A3?
2. ADR-003: emenda (B1) ou novo ADR (B2)?
3. Auditoria: C1, C2 ou C3? Se C2, qual ferramenta é aceitável (por exemplo, instalar uma ferramenta de varredura localmente é uma ação a autorizar)?
4. Observar por leitura as configurações do GitHub e da Vercel após a abertura (proteção de branch, varredura de segredos, permissões do Actions) entra no ciclo, ou fica só como lista de ações do responsável?
5. IGP-M: desde quando carregar o histórico na primeira sincronização (mesmo período do IPCA, ou o início do patrimônio) e qual nome exibir (`IGP-M`)?
6. Quando publicar o commit local da fila (`46b46bb`) em lote próprio do backlog, antes ou depois do ciclo?

## Fora do escopo

- Qualquer mudança de cálculo financeiro (G1) e o BL-008 (Dólar PTAX) e o BL-009.
- Alterar configurações do GitHub, da Vercel ou do Google, e tornar o repositório privado de novo.
- Reescrever o histórico do Git ou rotacionar credenciais (só se a auditoria exigir, por decisão própria).
- Criar `SECURITY.md` ou `CONTRIBUTING.md` (sugestão a registrar no plano, não a executar sem decisão).
- Retorno de BL-007 no backlog antes da integração do ciclo.

## Critérios para iniciar o planejamento

- Respostas às perguntas 1 a 3 e 5, ao menos.
- Decisão sobre incluir a auditoria registrada (C2) como issue do ciclo.
- Confirmação de que o BL-007 continua com a parcela integral.
- Issues previstas, a refinar no plano: (1) governança documental e `.gitignore`; (2) auditoria registrada, se escolhida; (3) BL-007.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Ideação registrada — ciclo 011 (completo)
Quem: Responsável
Conferir: perguntas 1 a 6 da seção "Perguntas em aberto" e as alternativas A, B e C
Diga: "autorizo o rascunho do plano do ciclo 011"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 011 + idear + repositorio_publico_governanca_igpm + d480837`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `011` livre em `cycles.md` (próximo ciclo `011`); `main` em `d480837`; fila do backlog ausente (`prunable`) em `49a1332`.
- `state_after`: ciclo `011` reservado como `Ideação`; ideação criada, não versionada; fila `chore/backlog` reanexada com o commit local `46b46bb`, sem publicação.
- `result`: `executed`
- `evidence`: este arquivo; `_project/cycles.md`; `git log` da fila (`46b46bb` sobre `49a1332`); `gh repo view` (`PUBLIC`); consulta à API do Banco Central (série 189); `git worktree list`.
- `blockers`: nenhum para a ideação; as perguntas em aberto bloqueiam o rascunho do plano.
