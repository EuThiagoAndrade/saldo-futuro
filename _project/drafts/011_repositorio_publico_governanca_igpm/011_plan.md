# Plano de Implementação — Repositório público na governança e benchmark IGP-M

> **Ciclo:** `011`
> **Status:** `Aprovado`
> **Versão:** `v2`
> **Data de criação:** 2026-10-22
> **Última atualização:** 2026-10-22
> **Tipo:** `chore`
> **Prioridade:** `P1`
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 011" em 2026-10-22
> **Autorização do rascunho:** "autorizo o rascunho do plano do ciclo 011" em 2026-10-22
> **Autorização da correção:** "corrija o plano do ciclo 011" em 2026-10-22 (achados R1-1 a R1-5)
> **Modo contínuo:** `—`
> **Revisão formal:** `Concluída` (rodada 2 sobre a `v2`)
> **Veredito da revisão:** `APTO PARA APROVAÇÃO`
> **Aprovação humana pós-revisão:** `Aprovada em 2026-10-22`
> **handoff_schema_version:** `2`

## Problema e contexto

Ideação: `_project/ideations/011_repositorio_publico_governanca_igpm.md`.

## Objetivo

Tornar a governança coerente com o fato consumado de o repositório ser público desde 2026-10-22: refazer com registro verificável a auditoria do histórico, observar por leitura as configurações de segurança, emendar o ADR-003 e corrigir os documentos vivos, e ignorar `.claude/`. Na mesma sequência de entregas, incluir o IGP-M (SGS 189, mensal) no catálogo de benchmarks por migração aditiva, sem mudar regra de cálculo.

## Origem no backlog

Snapshot herdado da ideação, seleção de 2026-10-22, sem reescrita. Fila lida no worktree `C:\Programas\saldo-futuro-backlog`, branch `chore/backlog`; commit `46b46bb` **local, não publicado**, sobre `49a1332` (PR #102, publicado em `main`). O BL-007 já existe em `main`, no estado `Disponível`, sem alteração no commit local.

| ID | Síntese da necessidade | Parcela selecionada |
| :-- | :-- | :-- |
| BL-007 | Incluir o IGP-M (série SGS 189, mensal) no catálogo de benchmarks para comparação da rentabilidade, sem mudar o modelo de cálculo | Integral |

Referência: `_project/backlog.md` no commit da fila `46b46bb`. Destino em preparação; nenhum item é alterado neste rascunho. Como o BL-007 já está em `main`, a integração do destino não depende do lote local. O retorno em BL-007 só ocorre depois da integração comprovada, por `ciclo 011`; pela decisão Q6, o lote do backlog (o commit `46b46bb` e esse retorno) é publicado depois do ciclo, com pedido próprio.

## Contexto e baseline

- Inspeção de 2026-10-22 em `EuThiagoAndrade/saldo-futuro`, branch local `main` em `d48083755f6442e852b184d1aec03f0d66e1e650`, igual a `origin/main` por `git ls-remote`. `gh repo view` retorna `PUBLIC`. PR aberta: só a #113 (Dependabot, `next` 16.4.1), fora deste ciclo.
- Alterações locais preexistentes e preservadas: `_project/cycles.md` com a reserva de `011`, a ideação `011` não versionada e a pasta `.claude/` não rastreada. Nenhuma branch, commit, issue ou PR deste plano.
- `package.json` em `0.7.0`. Release-alvo do ciclo: `0.8.0`, pelo release-please (`bump-minor-pre-major`, um `feat` no ciclo). As entregas `chore` não geram versão.
- Documentos vivos com a premissa "privado": `.agent/ai_behavior.md:134`, ADR-003 (contexto, linha 21, e seção "Publicação do repositório", linhas 47 a 51) e KB-002 (passo V1, linha 144). `_project/README.md:469`, em "Gates mínimos", diz que os checks valem "mesmo sem proteção técnica de branch no plano gratuito do GitHub", premissa que depende do estado observado das proteções. O comentário em `tests/e2e/novidades.spec.ts:38` cita o "changelog técnico do repositório privado"; o teste em si (nenhum link ao changelog) é decisão do ciclo 010 e não muda.
- Planos, tasks e ideações executados que dizem "privado" são registro histórico e não serão reescritos (decisão Q1).
- `.gitignore` não tem `.claude/`; o manifesto do validador (`gitignoreRequired`) só exige um mínimo e não conflita com a linha nova. `scripts/governance-manifest.json` não fixa o texto "privado".
- Documentação do GitHub lida em 2026-10-22, somente leitura: [cobrança do Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions) diz que o uso é gratuito para repositórios públicos com runners padrão hospedados pelo GitHub, e que o GitHub Free inclui 2.000 minutos mensais para privados; [secret scanning](https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning) roda gratuitamente em repositórios públicos e varre todo o histórico Git de todas as branches, além de títulos, descrições e comentários de issues e PRs. A página não confirma a proteção de push; ela será observada na configuração real.
- IGP-M: catálogo inicial (CDI, SGS 12, diária; IPCA, SGS 433, mensal) inserido em `supabase/migrations/20261014193630_benchmarks.sql:67-69`, já aplicada e imutável (G4). Código SGS e periodicidade são imutáveis por benchmark (D8, gatilho `benchmarks_imutavel`). O cliente `src/lib/benchmarks/sgs.ts` é genérico; telas e administração leem o catálogo por `lerCatalogo`. A KB-004 (9.3) já define o retorno de série mensal de taxa (v/100 no dia 1) e a K3 (`N/D` com acumulado ≤ 0). A série 189 é variação percentual mensal (taxa), não série de nível (9.5), no mesmo formato da 433, inclusive com negativos (consulta da ideação).
- Menções ao catálogo a atualizar: KB-003 (linhas 38 e 183) e KB-004 (9.1). Os textos "como CDI e IPCA" em `/privacidade`, `/termos` e `README.md` são exemplos, não listas fechadas, e ficam como estão.
- A primeira carga de um benchmark sem cobertura começa na data inicial escolhida pelo administrador em `/admin/benchmarks`; a migração para produção é feita por `npx supabase db push` do responsável a partir da `main` atualizada (KB-002, S12).
- Não foram lidos `local/` com propósito de dados financeiros, dados reais, sessões de produção, nem o painel da Vercel.

## Escopo

### Dentro do escopo

- **Auditoria registrada (Q3, C2)** do histórico completo e do conteúdo público do GitHub, com registro de método, alcance, contagens e conclusões, sem reproduzir valores encontrados.
- **Observação somente leitura (Q4)** das configurações de segurança do GitHub acessíveis por `gh`, e lista do que só o responsável pode conferir (Vercel).
- **Governança (Q1 = A1, Q2 = B1):** emenda datada no ADR-003; `.agent/ai_behavior.md`, KB-002 e `_project/README.md` coerentes; comentário do e2e; `.claude/` no `.gitignore`.
- **IGP-M (Q5):** migração aditiva com `(189, 'IGP-M', 'mensal')`; testes de banco e e2e; KB-003/KB-004; nota de novidades da `0.8.0`; roteiro externo (`db push` e primeira sincronização com a mesma data inicial da cobertura do IPCA).
- Release `0.8.0` e encerramento prospectivo em PRs próprias.

### Fora do escopo

- Alterar configurações do GitHub, da Vercel ou do Google; tornar o repositório privado de novo.
- Reescrever histórico Git, rotacionar credenciais ou remover conteúdo de issues/PRs. Se a auditoria achar algo, o ciclo registra e para para decisão (ver item 1).
- Reescrever ou anotar planos, tasks e ideações executados (Q1 = A1).
- Qualquer mudança de regra financeira (G1), BL-008, BL-009 e outros itens do backlog.
- Criar `SECURITY.md`, `CONTRIBUTING.md` ou nova automação de varredura no CI. Ficam como sugestão, que o responsável pode mandar para o backlog.
- Publicar o lote do backlog durante o ciclo (Q6).

## Decisões e autoridades

Em 2026-10-22 o responsável respondeu às perguntas da ideação e autorizou este rascunho: "Pergunta 1: A1. Pergunta 2: B1. Pergunta 3: C2, refazer a auditoria com registro. Pergunta 4: só leitura das configurações. Pergunta 5: mesmo período do IPCA, nome IGP-M. Pergunta 6: publicar o lote do backlog depois." São decisões de planejamento; a aprovação do plano continua pendente da revisão formal.

| Pergunta | Decisão |
| :-- | :-- |
| Q1 | A1 — não reescrever planos e tasks executados; corrigir só os documentos vivos. |
| Q2 | B1 — emenda datada no próprio ADR-003. |
| Q3 | C2 — refazer a auditoria, com registro verificável. A ferramenta é proposta abaixo (D-A); **D-A1 escolhida na aprovação** (ver "Registro de aprovação"). |
| Q4 | O agente observa as configurações só por leitura, dentro do ciclo; nenhuma alteração. |
| Q5 | Primeira carga do IGP-M com a mesma data inicial da cobertura do IPCA em produção; nome exibido `IGP-M`. |
| Q6 | O lote local do backlog é publicado depois do ciclo, por pedido próprio. |

**Proposta pendente de decisão na aprovação do plano — D-A, ferramenta da auditoria:**

| Alternativa | O que usa | Efeito |
| :-- | :-- | :-- |
| D-A1 — sem instalação (recomendada) | Alertas do secret scanning do GitHub (leitura por API), um script Node 24 sem dependências, fora do repositório, com padrões de segredo e de dado do usuário, e revisão visual das imagens | Não instala nada nem baixa binário. O secret scanning cobre os padrões de parceiros e o script cobre dado do usuário, que nenhuma ferramenta de segredo detecta. |
| D-A2 — D-A1 mais gitleaks | Acrescenta o gitleaks, baixado da página de releases oficial do projeto | Mais regras de segredo. Exige autorização de download (arquivo, origem e tamanho apresentados antes) e não cobre dado do usuário. |

A aceitação de Q3 não decide a ferramenta; sem escolha expressa na aprovação, a issue de auditoria não começa.

Autoridades: `.agent/ai_behavior.md`, `_project/README.md`, ADR-002, ADR-003, KB-002, KB-003, KB-004 e `design-system/DESIGN.md` (sem mudança de contrato visual prevista). Este rascunho não emenda nenhuma autoridade; as emendas entram nas entregas.

### Pontos de aprovação

| Ponto | Precondição | Cobre | Não cobre | Conferir |
| :-- | :-- | :-- | :-- | :-- |
| Autorizar rascunho — recebida | Ideação registrada e Q1 a Q6 respondidas | Este plano e o índice coerente | Revisão, aprovação, branch, issue ou publicação | Ideação, tabela de decisões e cabeçalho |
| Aprovar plano — "aprovo o plano do ciclo 011" | Veredito apto e manifestação humana posterior, com escolha expressa de D-A | Publicar a PR documental; criar as três issues após sua integração e a apresentação/confirmação dos payloads; o encerramento ao final | Merges, implementação, download de ferramenta, ação externa, produção | Revisão crítica, D-A, roteiro externo do item 3 |
| Aprovar merge documental — "aprovo o merge da PR #N" | PR do plano com checks verdes | Integrar aquela PR | Issues e implementação | Diff (ideação, plano e índice), checks |
| Autorizar implementação — "autorizo a implementação da issue #N" | Plano aprovado e integrado; issue real; para a issue 2, auditoria integrada sem achado pendente | Branch, task, mudanças, testes e PR daquela issue; na auditoria, as leituras do método escolhido | Outra issue, merge, alteração de configuração externa, remediação de achado; download não autorizado | Payload, escopo, barreiras e pré-requisitos |
| Aprovar merge de cada entrega — "aprovo o merge da PR #N" | Gates concluídos e checks verdes | Só o merge nomeado | Próxima issue, `db push`, sincronização | Task, critérios, diff, evidências e G3 |
| Ação humana externa — "concluí a ação externa da issue #N" | PR do IGP-M integrada e deploy da `main` | Responsável faz `db push` e a primeira sincronização do IGP-M conforme o roteiro do item 3 | Agente operar banco de produção ou console | `migration list` alinhado e cobertura do IGP-M com o mesmo início da do IPCA, relatados sem identificadores |
| Verificar produção — "autorizo a verificação em produção do ciclo 011" | Ação externa relatada | Conferência pública somente leitura pelo agente (proteção das rotas e, depois da release, tag/release publicada) e roteiro autenticado do responsável, inclusive o relato de `/novidades` após o deploy da `0.8.0` | Transação financeira, cópia de dados reais, etapa autenticada depois do merge do encerramento | Itens da sequência, passos 6 e 7 |
| Aprovar merge da release — "aprovo o merge da PR #N" | PR real do release-please com `0.8.0`, checks verdes (por `workflow_dispatch`, se preciso) | A release nomeada | Mudança na automação | `package.json`, changelog e nota de novidades |
| Aprovar merge do encerramento — "aprovo o merge da PR #N" | Entregas, ação externa, produção, release e nota da `0.8.0` em `/novidades` comprovadas | Consolidação documental prospectiva | Publicação do lote do backlog | KBs, ADR, plano, tasks, `cycles.md`, checks |

Cada merge tem aprovação própria. A cadeia para ("Parado") por falta de autorização, achado da auditoria, privacidade incerta, necessidade de regra financeira, escopo ampliado, precondição não verificável, falta de capacidade (por exemplo, permissão insuficiente na API do GitHub) ou checks falhos. O ciclo completo não usa modo contínuo.

## Barreiras de domínio

| Barreira | Aplica-se? | Como o ciclo a atende ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não há mudança de regra; conferência obrigatória | O IGP-M usa a regra existente de série mensal de taxa (KB-004, 9.3) e a K3. A task confere, na documentação do SGS, que a 189 é variação % mensal e não série de nível (9.5); se fosse nível, parar, porque a 9.5 não está implementada. A KB-004 9.1 só ganha a linha do catálogo. O e2e do item 3 usa valores fictícios com esperados calculados à mão antes da execução. Nenhuma fórmula, arredondamento ou caso de referência muda. |
| G2 — isolamento por RLS | Não; sem tabela, política, função ou papel novos | A migração só insere uma linha no catálogo global, já protegido; a escrita continua exclusiva de `carregar_benchmark` com admin. O teste de banco existente (privilégios, usuário comum sem gravação) roda inalterado, mais a asserção da linha nova. |
| G3 — privacidade de dados | Sim, todo o ciclo | A auditoria é a própria aplicação de G3: lê o histórico para a tarefa autorizada e registra só contagens, categorias e conclusões, nunca o valor encontrado nem sua localização em documento versionado. O inventário de triagem, com referências e sem valores, fica em `local/`, ignorado (ver item 1). Configurações observadas são registradas por estado, sem tokens ou identificadores de conta. Fixtures fictícias; nenhum dado real em evidências. |
| G4 — migrações só acrescentam | Sim, item 3 | Migração nova gerada por `npx supabase migration new benchmark_igpm`, sem tocar `20261014193630_benchmarks.sql`. Passo de CI e padrão de nome do validador. |

## Estratégia de testes

**Rascunho e PRs documentais:** `node --test scripts/validate-governance.test.mjs`, `node scripts/validate-governance.mjs`, `git diff --check` e `git status --short`; G3 e links conferidos à mão.

**Issue 1 (auditoria):** sem código no repositório. Evidência: o registro da auditoria, com comandos reprodutíveis e contagens, mais os gates documentais.

**Issue 2 (governança):** gates documentais; `git check-ignore .claude/launch.json` confirma a exclusão; `git ls-files .claude` vazio. A mudança de comentário em `tests/e2e/novidades.spec.ts` não altera comportamento; mesmo assim rodar `npm run lint` e `npm run typecheck`.

**Issue 3 (IGP-M):** gates completos de aplicação de `_project/README.md`, "Gates mínimos" (`npm ci`, `lint`, `typecheck`, `test`, `build`, `npx supabase start`, `npx supabase test db`, `npm run test:e2e` com e sem backend). Focal:

- `supabase/tests/database/06_benchmarks.test.sql`: asserção de que o catálogo contém `(189, 'IGP-M', 'mensal')`, com o `plan(N)` ajustado; as asserções de CDI e IPCA ficam como estão.
- `tests/e2e/benchmarks.spec.ts`: o IGP-M aparece no catálogo e na administração; a comparação com uma série fictícia do IGP-M mostra os cartões com o nome `IGP-M`; um caso com acumulado do IGP-M ≤ 0 mostra `N/D` no "% do IGP-M" e mantém a diferença em p.p. (K3). Os esperados são calculados à mão, registrados na task antes de rodar e conferidos contra a regra 9.3/9.4.
- `src/lib/novidades.ts` e seu teste: a nota da `0.8.0` só aparece quando a versão for lançada (regra existente).
- Sem rota ou tela nova; auditoria visual não exigida além de conferir que o seletor e a administração acomodam três benchmarks a 360 px.

## Itens de implementação

### Item 1 — Auditoria registrada do histórico e leitura das configurações

**Contexto:** a abertura em 2026-10-22 foi precedida de uma auditoria somente leitura feita pelo agente a pedido do responsável (registrada no plano do ciclo 010, "Registro de execução"), sem método, alcance ou evidência recuperáveis. O histórico já é público e permanente.

**Ação técnica (método D-A1; D-A2 acrescenta o passo M2b):**

1. **Alcance.** Buscar todos os refs remotos, inclusive as cabeças de PR (`git fetch origin '+refs/pull/*/head:refs/remotes/origin/pr/*'`), e contar commits (`git rev-list --all --count`), blobs distintos, tags, releases, issues, PRs e comentários. As contagens definem o universo auditado.
2. **M1 — secret scanning do GitHub.** Ler os alertas por `gh api repos/EuThiagoAndrade/saldo-futuro/secret-scanning/alerts --paginate --jq '.[] | {number, state, secret_type}'`, **nunca** o campo `secret`. Também `--jq` para os locais, sem conteúdo. Se a API negar acesso ou o recurso estiver desativado, registrar o fato como limitação.
3. **M2 — script Node 24 sem dependências**, guardado fora do repositório (diretório temporário da sessão) e transcrito no registro para reprodução. Varre o conteúdo de todos os blobs alcançáveis por qualquer ref, as mensagens de commit e de tag, e o texto das issues, PRs, comentários, revisões e releases obtido por `gh api --paginate`. Padrões de segredo: blocos `PRIVATE KEY`, JWT (`eyJ…` em três partes), prefixo de chave secreta do Supabase, `service_role`, segredo de cliente Google, tokens do GitHub, chaves AWS, URLs `postgres://` com senha e atribuições genéricas de `secret|password|token|key` com valor longo. Padrões de dado do usuário: e-mails (exceto domínios reservados de teste, endereços `noreply` do GitHub e bots, e o contato de Q8, publicado com autorização no ciclo 010), CPF, valores monetários `R$` fora do código de formatação e das fixtures, e nomes de instituições financeiras. O script grava cada ocorrência no inventário local de triagem (passo 6) e imprime **só contagens por categoria e por tipo de local** (blob, mensagem, issue, PR); o valor e o trecho encontrados nunca são impressos nem gravados.
4. **M2b (só com D-A2):** gitleaks sobre `git log --all`, com relatório redigido (`--redact`) e somente contagens no registro.
5. **M3 — arquivos e imagens.** Listar todos os caminhos já adicionados em qualquer ref com extensões de dados, segredo ou imagem (`.sqlite`, `.db`, `.csv`, `.xlsx`, `.env`, `.pem`, `.key`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.pdf`). Imagens versionadas são revistas visualmente pelo agente, uma a uma, procurando prints com dado real. Anexos `user-attachments` referenciados em issues e PRs são contados; revê-los exige baixá-los, então o agente apresenta quantidade, origem e tamanho e pede autorização expressa, ou o responsável os revê e relata.
6. **Triagem por inventário local.** O inventário fica em `local/011_auditoria/inventario.jsonl`, ignorado pelo Git (G3), com uma linha por ocorrência de M1, M2, M2b e M3: identificador sequencial (`OC-0001`…), método, categoria do padrão, tipo de local, referência e posição (SHA do blob e caminho com linha; SHA do commit ou da tag; número da issue ou PR e identificador do comentário; número do alerta; caminho da imagem), classe e critério. **Nenhuma linha contém o valor nem o trecho encontrado.**
   - **Classes:** `pendente` (inicial), `falso_positivo` e `achado`. Toda ocorrência nasce `pendente`.
   - **Regras automáticas declaradas:** antes da conferência manual, o script pode classificar como `falso_positivo` só por regra escrita no registro e conferível pela referência, por exemplo e-mail em domínio reservado de teste (`example.com`, `.test`) ou UUID fictício `00000000-…` em `tests/fixtures/` ou `supabase/tests/`. A regra aplicada fica no campo critério.
   - **Conferência manual:** para cada `pendente`, o agente abre o local pela referência, com leitura restrita à linha ou ao comentário apontado, e grava classe e critério no inventário. Na conversa e no registro versionado só aparecem identificador, categoria e classe; o conteúdo lido não é transcrito. Achado de segredo ou dado do usuário segue a regra de "Achados" abaixo.
   - **Fechamento:** total de ocorrências = `falso_positivo` + `achado` + `pendente`, por método e por categoria; a auditoria só conclui com `pendente` = 0. Ocorrência sem classe e critério verificáveis impede concluir a auditoria e iniciar a issue 2.
   - **Integridade:** o registro versionado traz os totais, as regras automáticas, os critérios manuais e o SHA-256 do inventário final, que permite ao responsável conferir localmente que o arquivo não mudou depois do registro.
7. **M4 — configurações, somente leitura:** visibilidade e `security_and_analysis` (secret scanning, proteção de push, Dependabot) em `gh api repos/…`; proteção de `main` (`branches/main/protection` e `rulesets`); permissões do Actions (`actions/permissions`, `actions/permissions/workflow`, política de aprovação para PRs de forks quando a API a expuser); permissão de fork; e varredura local de `.github/workflows/` por `pull_request_target` e por uso de segredos em eventos de fork. Registrar estado, sem tokens ou identificadores de conta. Vercel: o agente não tem acesso; o registro lista para o responsável conferir e relatar a proteção de forks da integração Git e a ausência de variáveis em Preview (KB-002, V2). Recomendações de mudança vão para a lista do responsável, sem execução.
8. **Registro** em `_project/drafts/011_repositorio_publico_governanca_igpm/011_research_auditoria_historico.md`: data, base (SHA de `main` e contagem de refs), método, comandos, padrões, contagens e fechamento da triagem por classe, SHA-256 do inventário, configurações observadas, limitações e conclusão. O inventário em si não é versionado.

**Achados.** Se houver segredo ou dado do usuário, o documento versionado registra só a categoria e a quantidade, não o local, porque apontar o local num repositório público facilita a exploração. O local exato fica no inventário em `local/` e vai ao responsável na conversa pelo identificador e pela referência, sem transcrever o conteúdo. A situação passa a "Parado" e a resposta (rotação, reescrita, remoção de conteúdo, voltar a privado) é decisão do responsável, fora deste ciclo; a issue 2 não começa enquanto o achado estiver pendente.

**Limitações declaradas:** padrões heurísticos não reconhecem com segurança nomes de ativos detidos ou valores sem `R$`; clones e forks feitos desde a abertura não são alcançáveis; caches de terceiros também não.

**Critérios de aceite:**

- [ ] Registro com base, alcance contado, método reprodutível e conclusão, sem nenhum valor encontrado e sem local de achado.
- [ ] M1, M2 e M3 executados (e M2b, se D-A2), com contagens por categoria e por classe da triagem.
- [ ] Inventário local com todas as ocorrências classificadas, sem valor ou trecho; fechamento com `pendente` = 0 e SHA-256 do inventário no registro.
- [ ] Configurações do GitHub observadas por leitura e itens da Vercel listados para o responsável; nenhuma configuração alterada.
- [ ] Achado, se houver, levado ao responsável com a situação "Parado", sem remediação no ciclo.

### Item 2 — Governança coerente com o repositório público

**Contexto:** ADR-003, `ai_behavior.md` e KB-002 descrevem um repositório privado, e `_project/README.md` presume a falta de proteção técnica de branch do plano gratuito; `.claude/` não está ignorado.

**Ação técnica:**

- **ADR-003 (B1):** acrescentar ao fim da seção "Publicação do repositório" uma **Emenda do ciclo `011`**: o repositório é público desde 2026-10-22, aberto pelo responsável porque os GitHub Actions foram bloqueados pelo limite de minutos do plano gratuito para repositórios privados (documentação citada na baseline); a abertura antecedeu o ciclo de auditoria previsto; houve uma auditoria somente leitura sem registro e a auditoria registrada do ciclo 011 é a evidência (link ao registro e conclusão em uma frase). Marcar o segundo e o terceiro marcadores originais como substituídos pela emenda, sem apagá-los. Atualizar `Status` (emendado no ciclo 011), `last_updated` e as referências. "Alternativas consideradas" fica intacta, por ser histórica. O contexto ganha uma frase remetendo à emenda.
- **`.agent/ai_behavior.md`, "Privacidade de dados financeiros":** trocar a primeira frase por "O repositório é público desde 2026-10-22 (ADR-003, emenda do ciclo `011`)", mantendo a frase sobre histórico permanente e todas as regras.
- **KB-002, passo V1:** retirar "O repositório é privado" e manter a orientação de permissões do app do GitHub como condição geral, com a origem da revisão no ciclo 011.
- **`_project/README.md:469` ("Gates mínimos"):** ajustar a frase sobre proteção de branch ao estado observado no item 1 (com ou sem proteção técnica), sem relaxar a regra de checks verdes antes do merge.
- **`tests/e2e/novidades.spec.ts:38`:** comentário passa a "changelog técnico do repositório", sem mudar a asserção.
- **`.gitignore`:** acrescentar `.claude/` numa seção de ferramentas de agente.
- Conferir de novo, por busca, os documentos vivos (fora de `executed/`, das ideações e de `local/`) e corrigir só menções à visibilidade.

**Critérios de aceite:**

- [ ] Emenda datada no ADR-003, com motivo, situação da auditoria e link ao registro; texto original preservado e marcado.
- [ ] `ai_behavior.md`, KB-002 e `_project/README.md` coerentes com a visibilidade e com o estado observado das proteções; nenhuma regra de privacidade enfraquecida.
- [ ] `.claude/` ignorado e não rastreado; validador verde com o manifesto atual.
- [ ] Nenhum artefato executado alterado (A1).

### Item 3 — BL-007: IGP-M no catálogo de benchmarks

**Contexto:** só o IPCA representa índice de preços; o IGP-M permite comparar com ativos e contratos referenciados nele.

**Ação técnica:**

- `npx supabase migration new benchmark_igpm` e, no arquivo gerado, `insert into public.benchmarks (codigo_sgs, nome, periodicidade) values (189, 'IGP-M', 'mensal');`, com comentário de origem (ciclo 011, BL-007, D8/D9). Sem outra instrução.
- Antes do código, conferir na documentação do SGS que a 189 é IGP-M em variação % mensal, e registrar a fonte na task (G1).
- Testes descritos na estratégia.
- KB-004 9.1: linha "Acrescentado no ciclo `011`: IGP-M (SGS 189, mensal, % ao mês)". KB-003: catálogo com os três benchmarks. KB-002: o `db push` desta migração como exemplo de S12, se a tabela de verificações o pedir.
- `src/lib/novidades.ts`: entrada `0.8.0` com nota em linguagem simples ("Agora é possível comparar a carteira com o IGP-M"), data `null` até a release comprovada, revisada pelo responsável no diff.

**Roteiro da ação externa, depois do merge e do deploy:**

1. Responsável, na `main` atualizada: `npx supabase db push` e `npx supabase migration list`, relatando "local e remoto alinhados", sem identificadores (S12).
2. Em `/benchmarks`, ler a data de início da cobertura do IPCA.
3. Em `/admin/benchmarks`, na seção IGP-M, usar essa data como inicial e hoje como final, e confirmar. A busca tem limite de 45 s. Se exceder, dividir em blocos, preservando a data inicial escolhida na primeira carga:
   - depois de cada bloco, reler a cobertura do IGP-M na própria tela;
   - começar o bloco seguinte **na data do último valor coberto** (o fim da cobertura exibido, que a tela já sugere como data inicial), sobrepondo essa data, e nunca no dia seguinte ao fim pedido no bloco anterior. Numa série mensal, o fim da cobertura é o dia 1 do último mês devolvido: uma carga até 31/12/2025 deixa a cobertura em 01/12/2025, e começar o bloco seguinte em 01/01/2026 seria recusado como buraco (KB-004 9.2, `recusado_buraco`);
   - a sobreposição só substitui o valor daquela data pelo publicado, o que a regra 9.2 já prevê, sem mudança de código ou cálculo.
4. Conferir que a cobertura do IGP-M começa na mesma data da do IPCA e termina no último mês publicado; relatar só "mesmo início: sim/não" e o último mês, que é dado público.
5. Dizer "concluí a ação externa da issue #N". Divergência de início ou recusa da carga leva a "Parado".

**Critérios de aceite:**

- [ ] Migração nova e aditiva; catálogo com `(189, 'IGP-M', 'mensal')`; migração do ciclo 003 intacta.
- [ ] Teste de banco e e2e cobrindo catálogo, administração, comparação e K3 com IGP-M, com esperados registrados antes.
- [ ] Nenhuma mudança em `src/lib/benchmarks/`, nas regras ou nos casos de referência.
- [ ] KB-003, KB-004 e nota da `0.8.0` atualizadas.
- [ ] Ação externa relatada conforme o roteiro e verificação em produção concluída; só então a issue fecha, pela PR de encerramento (ver "Decomposição em issues e PRs").

## Arquivos afetados

Caminhos novos são propostas.

| Entrega | Existentes a alterar | Novos previstos |
| :-- | :-- | :-- |
| Plano | `_project/cycles.md` | Este plano; a ideação entra na PR documental |
| Item 1 | — | `_project/drafts/011_repositorio_publico_governanca_igpm/011_research_auditoria_historico.md`, task da issue; fora do Git, `local/011_auditoria/inventario.jsonl` |
| Item 2 | `_project/decisions/ADR-003_acesso_privacidade_publicacao.md`, `.agent/ai_behavior.md`, `_project/knowledge/KB-002_operacao_producao_acessos.md`, `_project/README.md`, `tests/e2e/novidades.spec.ts`, `.gitignore` | Task da issue |
| Item 3 | `supabase/tests/database/06_benchmarks.test.sql`, `tests/e2e/benchmarks.spec.ts`, `src/lib/novidades.ts`, KB-003, KB-004, KB-002 se aplicável | `supabase/migrations/<AAAAMMDDHHMMSS>_benchmark_igpm.sql`, task da issue |
| Encerramento | Este plano, `_project/cycles.md`, tasks (inclusive a reconciliação da task da issue 3), KB-002 (resultado da ação externa), `src/lib/novidades.ts` (data real da release) | `011_task_closure.md`; movimento para `executed/` |

Sem alteração em `.github/workflows/`, `src/lib/benchmarks/`, regras financeiras ou configurações externas. Necessidade fora desta lista é registrada e avaliada antes de mudar.

## Decomposição em issues e PRs

Após aprovação e integração da PR documental, apresentar os payloads (`.github/ISSUE_TEMPLATE/`, modelo de chore ou feature conforme o título) para confirmação e só então criar via `gh`. Nenhum número é reservado aqui.

| Ordem | Título proposto | Unidade e dependência |
| :-- | :-- | :-- |
| Documental | Plano do ciclo 011 | `chore/cycle-011-plan`, PR com ideação, plano e índice |
| 1 | `[CHORE] Auditar o histórico público e as configurações do repositório` | Item 1; `chore/issue-N`; PR só com o registro e a task |
| 2 | `[CHORE] Alinhar a governança ao repositório público` | Item 2; depois da integração do item 1 sem achado pendente |
| 3 | `[FEATURE] Incluir o IGP-M no catálogo de benchmarks (BL-007)` | Item 3; `feature/issue-N`; depois do item 2. A PR só referencia a issue (`Refs #N`), sem fechá-la; ação externa e verificação após o merge |
| Release | PR do release-please (`0.8.0`) | Sem issue; integrada depois da verificação em produção |
| Encerramento | Consolidar o ciclo 011 | `chore/cycle-011-closure`, sem issue nova; `Closes #N` da issue do IGP-M |

Commits `chore(issue-N):` ou `feat(issue-N):`; documentação `docs(cycle-011):`.

**Fechamento das issues.** As issues 1 e 2 fecham pelas próprias PRs (`Closes #N`). A issue 3 é exceção à relação normal de uma issue por PR (`_project/README.md`, "Relação entre plano, task, issue e PR"), porque seu aceite inclui a ação externa e a verificação em produção, que só podem ocorrer depois do merge do código. Regras:

- a PR de código da issue 3 usa `Refs #N`, sem palavra de fechamento;
- depois do merge, a task da issue 3 é o artefato ativo, com uma única situação por vez: "Aguardando ação externa" (roteiro do item 3) e, depois da frase canônica, "Aguardando verificação em produção". A branch integrada não é reaberta; o próximo workflow mutante registra os resultados sanitizados nessa task, que continua artefato ativo durante a release;
- a PR de encerramento leva a evidência sanitizada da ação externa e da verificação, reconcilia a task da issue 3 e a KB-002 e fecha a issue com `Closes #N` no merge autorizado. Isso não cria issue recursiva; a aprovação do plano cobre essa reconciliação.

## Dependências e blockers

- Revisão formal e escolha de D-A na aprovação.
- Permissão de leitura do `gh` na API de secret scanning e de configurações; sem ela, a limitação é registrada e, se impedir M1 ou M4, a situação passa a "Parado".
- Achado na auditoria bloqueia a issue 2 até decisão do responsável.
- Supabase local e Docker para os testes da issue 3.
- Release `0.8.0` depende de não haver outra release no meio; a PR #113 (Dependabot), se integrada antes, não gera versão por si (`chore(deps)`), mas deve ser conferida.

## Riscos, suposições e rollback

- **Achado grave no histórico público:** o ciclo não remedia; registra sem expor e escala. Mitigação de exposição no próprio registro: sem valor e sem local.
- **Falso negativo da auditoria:** heurística declarada como limitação; a revisão visual de imagens e a triagem manual reduzem o risco, sem eliminá-lo.
- **Leitura de configuração com dado sensível:** usar `--jq` restrito a campos de estado; nunca imprimir o campo `secret` nem tokens.
- **Série 189 mudar de natureza ou atrasar:** a conferência G1 antes do código e o mecanismo de cobertura sem buracos tratam o atraso; revisão da FGV substitui valores na janela sincronizada (9.2).
- **Rollback:** documentos por nova PR revisável. A migração não é revertida por edição (G4); se preciso, nova migração que remova a linha do catálogo e seus valores (`on delete cascade`), com decisão do responsável e `db push`.

## Sequência recomendada

1. Revisão formal; correções, se pedidas; aprovação com escolha de D-A.
2. PR documental do plano; merge aprovado; payloads confirmados e três issues criadas.
3. Issue 1: auditoria e registro; PR; merge. Achado → "Parado".
4. Issue 2: emendas e `.gitignore`; PR; merge.
5. Issue 3: conferência G1 da série, migração, testes, KBs e nota; PR; merge; deploy.
6. Ação externa do item 3, com a task da issue 3 como artefato ativo. Depois, verificação em produção: o agente confere publicamente que `/benchmarks` e `/admin/benchmarks` exigem sessão; o responsável confere o IGP-M no catálogo, a cobertura iniciando com a do IPCA e a comparação no celular, relatando só passou/falhou.
7. Release `0.8.0`: conferir a PR do release-please, checks (por `workflow_dispatch`, se preciso) e merge aprovado. Depois do merge, ainda sob a autorização de verificação em produção: o agente confere por leitura a tag `v0.8.0` e a release publicadas e converte o instante de publicação para a data civil em `America/Cuiaba`; com o deploy da `main` concluído, o responsável relata que `/novidades` mostra a versão `0.8.0` e a nota do IGP-M, com "Data de publicação em confirmação" (a data ainda é `null`). Sem esse relato, o encerramento não começa.
8. Encerramento prospectivo: data real da release em `src/lib/novidades.ts`, evidência sanitizada da ação externa, da verificação e da conferência pós-release, reconciliação da task da issue 3 e `Closes #N`, consolidação de KBs/ADR, tasks, `cycles.md` e movimento para `executed/`; gates de aplicação e documentais; merge aprovado.
9. Depois da integração comprovada, retorno do BL-007 na fila e, com pedido próprio, publicação do lote do backlog (Q6).

## Referências

- `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, `.agent/workflows/rascunhar_plano.md`, `.agent/templates/plano_implementacao.md`.
- `_project/ideations/011_repositorio_publico_governanca_igpm.md`; `_project/backlog.md` no commit da fila `46b46bb`.
- ADR-002, ADR-003; KB-002, KB-003, KB-004 (9.1 a 9.5).
- `supabase/migrations/20261014193630_benchmarks.sql`, `supabase/tests/database/06_benchmarks.test.sql`, `tests/e2e/benchmarks.spec.ts`, `src/lib/novidades.ts`.
- [GitHub: cobrança do Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions) e [sobre secret scanning](https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning), lidas em 2026-10-22.

## Rastreabilidade

| Campo | Valor |
| :-- | :-- |
| Issue(s) | — |
| PR(s) | — |
| Branch(es) | — |
| Destino após conclusão | `_project/executed/011_repositorio_publico_governanca_igpm/011_plan.md` |

## Registro de aprovação

- **Data:** 2026-10-22.
- **Manifestação humana posterior à revisão:** "aprovo o plano do ciclo 011", seguida, na mesma conversa e em resposta à pergunta expressa sobre a ferramenta da auditoria exigida pela tabela de pontos de aprovação, da escolha "D-A1".
- **Base aprovada:** plano `v2`, revisão formal rodada 2 com veredito `APTO PARA APROVAÇÃO`, sem bloqueadores nem ressalvas. Rodadas e resposta do autor preservadas.
- **Decisão D-A:** D-A1 — alertas do secret scanning do GitHub por API, script Node 24 sem dependências fora do repositório e revisão visual das imagens; nada é instalado ou baixado. O passo M2b não se aplica. A revisão de anexos `user-attachments` continua dependendo de autorização expressa de download, ou da revisão pelo responsável (item 1, M3).
- **Alcance:** aprovação do plano e publicação da PR documental (ideação, plano e índice); criação das três issues somente depois da integração documental e da apresentação/confirmação dos payloads; encerramento ao final. Não concede aprovação de merge, autorização de implementação, ação externa nem acesso a produção.
- **Estado reconciliado:** esta seção resolve a proposta D-A descrita em "Decisões e autoridades", que fica preservada como alternativa. O ciclo permanece `Planejamento` até a primeira implementação autorizada.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 011 (completo)
Quem: Responsável
Conferir: Diff e checks da PR documental #115 (https://github.com/EuThiagoAndrade/saldo-futuro/pull/115); confirmar checks verdes no HEAD atual antes de integrar
Diga: "aprovo o merge da PR #115"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 011 + atualizar_docs + 011_plan/aprovacao-publicacao + v2/d48083755f6442e852b184d1aec03f0d66e1e650`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: antes, ciclo `011` em `Planejamento` e plano `v2` em `Em Revisão`, rodada 2 `APTO PARA APROVAÇÃO`, "Aguardando aprovação do plano", sem branch ou PR do ciclo. Depois, plano `v2` `Aprovado` com manifestação humana posterior e D-A1 registrada; branch `chore/cycle-011-plan` publicada e PR #115 aberta, "Aguardando merge". Ciclo permanece `Planejamento` até a primeira implementação autorizada.
- `result`: `executed`
- `evidence`: manifestação humana de 2026-10-22 no "Registro de aprovação"; rodada 2 apta anterior à manifestação; branch `chore/cycle-011-plan` sobre `main` `d48083755f6442e852b184d1aec03f0d66e1e650`; commit inicial COMMIT1 publicado; PR https://github.com/EuThiagoAndrade/saldo-futuro/pull/115 criada via `gh` e conferida `OPEN`, base `main`, somente ideação, plano e índice. 48/48 testes locais e validador sem erros ou avisos. O estado dos checks é conferido no GitHub no HEAD atual antes de qualquer merge.
- `blockers`: merge pendente de checks verdes e de "aprovo o merge da PR #115". Criação das issues aguarda a integração documental e a confirmação dos payloads. Nenhuma implementação, issue, ação externa, verificação em produção ou merge executado.

## Revisão crítica

Uma subseção `### Rodada N` por rodada, com `Autor:`, `Revisor:` (ferramenta e modelo), achados `RN-k` (bloqueador ou ressalva), itens atendidos e veredito. O autor responde a cada achado numa subseção própria. Teto de 5 rodadas.

### Rodada 1

- **Autor:** ferramenta e modelo do autor não identificados no rascunho `v1`; autoria não verificada nesta rodada.
- **Revisor:** Codex (GPT-6).
- **Data e autorização:** 2026-10-22; solicitação humana "revise o plano do ciclo 011". Revisão formal e registro local, sem aprovação do plano ou autorização de implementação.
- **Base:** `main` em `d48083755f6442e852b184d1aec03f0d66e1e650`, igual ao SHA remoto de `refs/heads/main` por `git ls-remote`; `gh repo view` confirma `PUBLIC`; a única PR aberta é a #113, do Dependabot. Plano local `v1` recebido em `Rascunho`, revisão/veredito `Pendente`, aprovação humana `Pendente` e situação `Aguardando revisão (rodada 1)`. Não havia rodada 1 anterior a reconciliar. Alterações preexistentes em `cycles.md`, ideação e `.claude/` preservadas.
- **Autoridades e template:** `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, `.agent/workflows/revisar_plano.md`, `.agent/templates/plano_implementacao.md`, ideação `011`, ADR-002, ADR-003, KB-002, KB-003 e KB-004 (seção 9 e K3). Conferidos também `implementar_issue`, `atualizar_docs`, o template de task e as regras pertinentes do DESIGN.md.
- **Inspeção técnica:** migração original dos benchmarks, teste pgTAP, e2e de benchmarks, cliente SGS, novidades e seu teste, `.gitignore`, configuração e workflow do release-please. Backlog observado somente por leitura: BL-007 existe em `main` como `Disponível`, sem alteração no commit local `46b46bb`; worktree externo registrado. Nenhum dado financeiro real, conteúdo de `local/`, sessão ou backend de produção foi acessado. Esta rodada confere o método proposto; a auditoria do item 1 não foi executada.

#### Achados bloqueadores

1. **R1-1 — Bloqueador (G3): falta um meio de localizar as ocorrências para a triagem da auditoria.** No item 1, M2 limita a saída a contagens por categoria e tipo de local; o passo 6 exige classificar **cada ocorrência** manualmente. Contagens não identificam qual blob, mensagem ou comentário precisa de conferência, nem permitem demonstrar que todas as ocorrências receberam classificação. O inventário de caminhos de M3 também não estabelece essa correspondência para o conteúdo de M2. A proteção de não publicar valor ou localização está correta, mas falta separar o resultado agregado do instrumento privado de triagem. **Correção necessária:** definir um inventário local ignorado, com identificador da ocorrência, categoria e referência/posição, sem copiar o valor ou trecho encontrado; manter somente os totais e critérios no registro versionado. Definir como conferir cada ocorrência sem reproduzir conteúdo sensível em saídas e como fechar a contagem entre ocorrências, falsos positivos, achados e pendências. Ocorrência sem classificação verificável impede concluir a auditoria e avançar à issue 2. Não é necessário instalar outra ferramenta nem ampliar o escopo da auditoria.

2. **R1-2 — Bloqueador: a issue do IGP-M fecha antes de cumprir seu aceite e não tem destino explícito para a evidência posterior.** A decomposição afirma "Cada issue fecha pela própria PR", mas o item 3 inclui a ação externa no aceite e só permite `db push` e sincronização depois do merge/deploy dessa PR. Assim, a issue seria fechada enquanto ainda faltam a carga e sua conferência. A sequência cita tasks no encerramento, mas não fixa o artefato ativo e a PR que reconciliam esse resultado. **Correção necessária:** a PR do item 3 deve referenciar a issue sem fechá-la; após seu merge, a task dessa issue guarda uma única situação, `Aguardando ação externa`, seguida de `Aguardando verificação em produção`. Nomear a PR de encerramento como destino da evidência sanitizada, da reconciliação da task/KB-002 e do `Closes #N` após o aceite efetivo. Registrar a exceção à relação normal de uma issue por PR, conforme `_project/README.md`, "Relação entre plano, task, issue e PR". As issues 1 e 2 podem fechar pelas respectivas PRs.

#### Ressalvas

3. **R1-3 — Ressalva: o caminho da regra de proteção de branch está errado.** O trecho citado como `README.md:469` está em `_project/README.md:469`, em "Gates mínimos". O README da raiz não contém essa frase. O erro se repete na baseline, no item 2 e na tabela de arquivos afetados, podendo deixar a autoridade de governança sem a atualização prevista. **Correção necessária:** identificar `_project/README.md` nesses pontos e nos critérios correspondentes; o README da raiz só deve constar se houver outra mudança concretamente justificada.

4. **R1-4 — Ressalva: a alternativa de sincronização em períodos consecutivos pode ser recusada para série mensal.** KB-004 9.2 e `carregar_benchmark` guardam o fim da cobertura como a data do último valor, e recusam nova carga quando `data_inicial > cobertura.fim + 1 dia`. Exemplo fictício: uma carga até 31/12/2025 termina sua cobertura em 01/12/2025; começar o bloco seguinte em 01/01/2026 deixa um intervalo segundo essa verificação e retorna `recusado_buraco`. O cliente só junta automaticamente suas janelas internas porque grava uma única carga; dividir manualmente o roteiro em várias cargas é diferente. **Correção necessária:** no passo 3 do roteiro externo, orientar a releitura da cobertura após cada bloco e o início da próxima carga no último valor coberto, sobrepondo essa data, em vez de usar o dia seguinte ao fim solicitado. Preservar o início escolhido na primeira carga. Isso usa a regra existente, sem mudar código ou cálculo.

5. **R1-5 — Ressalva: falta conferir a nota do IGP-M depois da release.** A verificação em produção está no passo 6, antes de `0.8.0`; nesse momento, por regra, a nota futura está oculta. O passo 7 confere a PR e seu merge, e o passo 8 usa a data real, mas não exige comprovar a publicação da tag/release, o deploy e a exibição da nota em `/novidades`. A conferência pré-release não demonstra esse comportamento. **Correção necessária:** antes de preparar o encerramento, conferir release/tag e data civil em `America/Cuiaba`, e incluir na verificação autorizada o relato do responsável de que `/novidades` mostra `0.8.0` e a nota do IGP-M após o deploy. Até o encerramento a data pode continuar `null`, com o texto já previsto pelo produto. Registrar a evidência na PR de encerramento, sem criar uma etapa autenticada depois de seu merge.

#### Itens atendidos e validação

- Objetivo, escopo, exclusões e decisões Q1 a Q6 rastreáveis à ideação. Nível completo e modo contínuo `—` coerentes com a mudança de governança. Aprovação do plano separada do veredito, implementações com autorização própria e cada merge com aprovação específica.
- G1 sem mudança de cálculo: o [SGS do Banco Central, série 189](https://www3.bcb.gov.br/sgspub/consultarvalores/consultarValoresSeries.do?method=consultarSeries&series=189), consultado em 2026-10-22, identifica IGP-M e unidade de variação percentual mensal, compatível com KB-004 9.3. A task ainda deve registrar a conferência prevista antes do código. Os testes propostos cobrem catálogo, comparação e K3 com valores fictícios e esperados independentes.
- Migração proposta só acrescenta a linha do catálogo; o cliente SGS e o catálogo lido pelas telas permitem esse acréscimo. G2 mantém grants/políticas existentes e seus testes; G4 preserva a migração original. A nota da versão futura respeita o filtro existente por versão corrente. Release-alvo `0.8.0` compatível com a configuração `bump-minor-pre-major` e um commit `feat`.
- [Cobrança do GitHub Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions) e [secret scanning](https://docs.github.com/en/code-security/concepts/secret-security/secret-scanning) conferidos em 2026-10-22: sustentam a baseline sobre runners padrão em repositório público, cota de 2.000 minutos no GitHub Free para privados e varredura automática do histórico e conteúdo de issues/PRs. Isso não comprova que a auditoria local já ocorreu nem substitui a observação das configurações reais prevista no item 1.
- Método D-A permanece uma proposta para decisão expressa na aprovação; não houve escolha pelo revisor. M1/M4 inacessíveis continuam sujeitos à parada registrada em "Dependências e blockers". O limite de auditoria heurística e a ausência de autorização para remediar achados estão explícitos.
- Skill de validação aplicada: `.agent/skills/governance-check/governance-check.md`. `node --test scripts/validate-governance.test.mjs`: **48/48 passaram**. `node scripts/validate-governance.mjs`: **0 erros, 0 avisos e 5 itens manuais**. `git diff --check`: limpo. Comparação literal com a entrada, normalizando CRLF/LF: corpo entre "Problema e contexto" e "Próximo passo" e pós-mortem preservados; uma única rodada de revisão. `git status --short` mantém as alterações preexistentes e o plano local não versionado. A validação estrutural não cobre os achados semânticos acima.

**Veredito: `REQUER NOVA RODADA`.** Dois bloqueadores (R1-1 e R1-2) e três ressalvas (R1-3 a R1-5). Primeira rodada, sem histórico de oscilação. O autor deve responder a cada achado, corrigindo ou contestando com justificativa, incrementar a versão e preservar esta rodada. A revisão não aprova o plano nem executa o workflow seguinte.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 011 + revisar_plano + 011_plan/rodada-1 + v1`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `011` em `Planejamento`; plano local `v1` em `Rascunho`; revisão/veredito `Pendente`; aprovação humana `Pendente`; situação `Aguardando revisão (rodada 1)`.
- `state_after`: ciclo `011` em `Planejamento`; plano `v1` em `Em Revisão`; revisão `Concluída`; veredito `REQUER NOVA RODADA`; aprovação humana `Pendente`; situação `Aguardando correções (rodada 1)`.
- `result`: `executed`
- `evidence`: pedido humano desta revisão, cabeçalho e próximo passo atualizados, achados R1-1 a R1-5 nesta seção, inspeções e fontes acima, 48/48 testes de governança, validador sem erros ou avisos, diff limpo e corpo do plano preservado por comparação literal. O handoff de `rascunhar_plano` acima permanece como histórico de origem.
- `blockers`: R1-1 e R1-2 em aberto; escolha de D-A pendente para a aprovação futura. Correção pelo autor depende da frase do responsável indicada no próximo passo; não houve implementação, branch, commit, publicação ou mudança externa.

### Resposta do autor à rodada 1

- **Autor:** Claude Code (Claude Opus 5.5), autor também do rascunho `v1`.
- **Data e autorização:** 2026-10-22; "corrija o plano do ciclo 011". Autoriza só a correção do plano, sem aprovação, issue ou implementação.
- **Versão:** `v1` → `v2`. Rodada 1 preservada sem alteração; corpo alterado só nos pontos abaixo.

| Achado | Resposta | Onde |
| :-- | :-- | :-- |
| R1-1 | **Corrigido.** Inventário local ignorado (`local/011_auditoria/inventario.jsonl`, conferido por `git check-ignore`) com uma linha por ocorrência: identificador, método, categoria, local com referência e posição, classe e critério, sem valor nem trecho. Regras automáticas só por critério escrito e conferível; conferência manual pela referência, sem transcrever conteúdo; fechamento total = falso positivo + achado + pendente, com conclusão só com `pendente` = 0; SHA-256 do inventário no registro versionado. Ocorrência sem classificação verificável impede concluir e iniciar a issue 2. | Item 1, passos 3, 6 e 8, "Achados" e critérios; G3; arquivos afetados |
| R1-2 | **Corrigido.** A PR de código do IGP-M usa `Refs #N`; após o merge, a task da issue 3 é o artefato ativo, com "Aguardando ação externa" e depois "Aguardando verificação em produção", e continua ativa durante a release. A PR de encerramento leva a evidência sanitizada, reconcilia task e KB-002 e fecha a issue com `Closes #N`. Exceção à relação uma issue por PR registrada; issues 1 e 2 fecham pelas próprias PRs. | Item 3, critérios; "Decomposição em issues e PRs"; arquivos afetados; sequência, passos 6 e 8 |
| R1-3 | **Corrigido.** A frase sobre proteção de branch está em `_project/README.md:469` ("Gates mínimos"); corrigido na baseline, no escopo, no item 2 (contexto, ação e critério), na tabela de arquivos e na referência dos gates. O README da raiz continua citado só como exemplo "como CDI e IPCA", sem mudança. | Baseline; escopo; item 2; arquivos afetados; estratégia de testes |
| R1-4 | **Corrigido.** Conferido em `carregar_benchmark` (`p_data_inicial > v_cobertura.fim + 1` → `recusado_buraco`). O roteiro manda reler a cobertura depois de cada bloco e começar o seguinte na data do último valor coberto, sobrepondo-a, com o exemplo fictício do revisor; data inicial da primeira carga preservada; sem mudança de código ou cálculo. | Item 3, roteiro, passo 3 |
| R1-5 | **Corrigido.** Depois do merge da release, sob a autorização de verificação em produção: o agente confere tag e release e a data civil em `America/Cuiaba`; o responsável relata `/novidades` com `0.8.0`, nota do IGP-M e "Data de publicação em confirmação". O encerramento só começa com esse relato e o registra na PR de encerramento; nenhuma etapa autenticada depois do merge do encerramento. | Pontos de aprovação (verificação e encerramento); sequência, passos 7 e 8 |

### Rodada 2

- **Autor:** Claude Code (Claude Opus 5.5), conforme a resposta do autor à rodada 1.
- **Revisor:** Codex (GPT-6).
- **Data e autorização:** 2026-10-22; nova solicitação humana "revise o plano do ciclo 011". Revisão formal da `v2`, com registro local; não é aprovação do plano nem autorização de implementação.
- **Base e reconciliação:** `main` em `d48083755f6442e852b184d1aec03f0d66e1e650`, igual ao SHA remoto por `git ls-remote`; repositório `PUBLIC`; única PR aberta #113, do Dependabot. Recebido plano `v2` em `Em Revisão`, com autorização da correção, resposta aos cinco achados e situação `Aguardando revisão (rodada 2)`. Aprovação humana `Pendente`, modo contínuo `—` e ciclo `011` em `Planejamento`. Não existia rodada 2 anterior a reconciliar.
- **Autoridades e template:** `.agent/ai_behavior.md`, `_project/README.md` (revisão formal, situações, aprovação, relação entre issue/task/PR e encerramento), `_project/cycles.md`, `.agent/workflows/revisar_plano.md` e `.agent/templates/plano_implementacao.md`. Retomadas as fontes da rodada 1 e conferidos especificamente a migração dos benchmarks, KB-004 9.2, a página/administração de benchmarks, `SincronizarBenchmark`, `src/lib/novidades.ts`, `implementar_issue` e a skill `governance-check`.

#### Conferência das respostas à rodada 1

| Achado | Resultado da conferência da `v2` |
| :-- | :-- |
| R1-1 | **Atendido.** M2 passa a alimentar o inventário privado, e o passo 6 define identificador, método, categoria, referência/posição, classe e critério, sem valor ou trecho. Regras automáticas precisam de critério declarado; as demais ocorrências têm conferência manual restrita pela referência. O fechamento por método/categoria conserva a soma entre falsos positivos, achados e pendentes; `pendente = 0` é precondição de conclusão. O SHA-256 identifica o inventário final, sem publicá-lo. `git check-ignore local/011_auditoria/inventario.jsonl` confirmou a exclusão; o arquivo não foi criado nem lido nesta revisão. Achados continuam sujeitos à parada e à decisão do responsável. |
| R1-2 | **Atendido.** A PR de código do IGP-M usa `Refs #N`. A task da issue 3 permanece como artefato ativo, com uma situação por vez, primeiro ação externa e depois verificação em produção. A exceção de uma issue por PR está justificada; o encerramento recebe os resultados sanitizados, reconcilia task/KB-002 e fecha a issue com `Closes #N`. Isso atende ao aceite posterior ao merge e ao passo 10 de `implementar_issue`, sem reabrir a branch integrada. |
| R1-3 | **Atendido.** Baseline, escopo, item 2, critério, gates e tabela de arquivos passam a identificar `_project/README.md`. Conferido que a frase permanece na linha 469 dessa autoridade. O README da raiz aparece no corpo apenas como exemplo de texto do produto que não precisa de alteração. As citações antigas dentro da rodada 1 são histórico preservado. |
| R1-4 | **Atendido.** O roteiro manda reler a cobertura e sobrepor a data do último valor no início da próxima carga. Conferido na migração que a recusa usa `p_data_inicial > v_cobertura.fim + 1` e que a atualização mantém o menor início e o último valor gravado. A sobreposição prevista satisfaz essa condição e preserva o início da primeira carga, sem mudar regra ou código. |
| R1-5 | **Atendido.** A autorização de produção passa a cobrir expressamente a conferência após a release. O passo 7 exige tag/release publicadas, data civil em `America/Cuiaba`, deploy concluído e relato do responsável sobre versão/nota em `/novidades`; sem o relato, não começa o encerramento. O passo 8 e os arquivos afetados destinam a evidência e a data comprovada à PR de encerramento. O estado temporário de data `null` é compatível com o produto, e nenhuma etapa autenticada é exigida depois do merge do encerramento. |

#### Achados novos

Nenhum bloqueador e nenhuma ressalva nova. As correções mantêm o escopo da ideação, as decisões Q1 a Q6, as exclusões e as barreiras da rodada 1. Os dois bloqueadores anteriores foram eliminados, sem reaparecimento de achado corrigido, oscilação ou discordância pendente; a regra de progresso da revisão foi atendida.

#### Validação e limites

- `node --test scripts/validate-governance.test.mjs`: **48/48 passaram**.
- `node scripts/validate-governance.mjs`: **0 erros, 0 avisos e 5 itens manuais**. `git diff --check` e `git diff --no-index --check -- /dev/null _project/drafts/011_repositorio_publico_governanca_igpm/011_plan.md`: sem erros de whitespace, inclusive no plano não rastreado.
- Conferências manuais: respostas confrontadas com os trechos executáveis, sem alteração das regras financeiras, RLS ou migrações existentes; evidência pública limitada a categorias/contagens; autorizações e pontos de aprovação separados. Preservados o corpo da `v2`, a rodada 1, a resposta do autor, o handoff da correção e o pós-mortem. As mudanças desta rodada limitam-se aos campos de revisão/veredito, ao próximo passo e a esta subseção.
- A auditoria do histórico, a observação das configurações de segurança e os testes de banco/aplicação são entregas futuras do plano; não foram executados por esta revisão. Não houve acesso a dados financeiros reais, conteúdo de `local/`, sessão ou backend de produção, nem mudança no backlog, branch, commit ou publicação.

**Veredito: `APTO PARA APROVAÇÃO`.** Os cinco achados da rodada 1 estão atendidos. A aprovação humana continua `Pendente`: o responsável deve manifestá-la depois deste veredito e indicar expressamente **D-A1 ou D-A2**, como exige a tabela de pontos de aprovação. A preferência recomendada por D-A1 permanece proposta; esta revisão não escolhe a ferramenta nem promove o plano.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 011 + revisar_plano + 011_plan/rodada-2 + v2`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `011` em `Planejamento`; plano local `v2` em `Em Revisão`, revisão `Em andamento`, último veredito `REQUER NOVA RODADA` da `v1`, aprovação humana `Pendente`, situação `Aguardando revisão (rodada 2)`.
- `state_after`: ciclo `011` em `Planejamento`; plano `v2` em `Em Revisão`, revisão `Concluída`, veredito `APTO PARA APROVAÇÃO`, aprovação humana `Pendente`, situação `Aguardando aprovação do plano`.
- `result`: `executed`
- `evidence`: pedido humano desta rodada, conferências de R1-1 a R1-5 na tabela acima, cabeçalho e próximo passo atualizados, 48/48 testes, validador sem erros ou avisos, whitespace limpo, inspeções locais e leitura de metadados no GitHub. Comparação literal com a entrada confirma a preservação do corpo e dos registros anteriores.
- `blockers`: nenhum para a aprovação; escolha expressa de D-A continua como precondição da aprovação. Aguardando manifestação humana posterior ao veredito; nenhum workflow seguinte foi executado.

## Pós-mortem

- **Data de conclusão:** —
- **Desvios:** —
- **Lições comprovadas:** —
