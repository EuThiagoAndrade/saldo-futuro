# Governança do projeto

Este diretório organiza decisões, conhecimento, ciclos e correções do `saldo-futuro`. Ele governa o processo do repositório; não define por si só a arquitetura funcional do produto. Comportamento, autorizações e privacidade pertencem a `.agent/ai_behavior.md`.

## Autoridades

- comportamento, autorização e privacidade: `.agent/ai_behavior.md`;
- ciclo de vida, estados, convenções, trilha curta e barreiras de domínio: este documento;
- estado e próxima numeração: `_project/cycles.md`;
- escopo de implementação: plano aprovado ou, na trilha curta, a issue `[FIX]` elegível;
- unidade de entrega: issue;
- registro local de execução: task persistente;
- estado global de colaboração: GitHub;
- decisões e conhecimento duradouros: `decisions/` e `knowledge/`;
- contrato visual: `design-system/DESIGN.md`.

## Estrutura

```text
_project/
├── README.md
├── cycles.md
├── ideations/
├── drafts/
├── executed/
├── archived/
├── fixes/
├── decisions/
└── knowledge/
```

Diretórios vazios não são artefatos e não precisam ser versionados. `archived/` só precisa existir no primeiro cancelamento ou substituição que possua plano, e `fixes/` só na primeira correção pela trilha curta.

## Numeração e nomes

- Ciclos usam três dígitos: `000`, `001`, `002`.
- Ideação: `_project/ideations/NNN_assunto.md`.
- Ciclo ativo: `_project/drafts/NNN_assunto/NNN_plan.md`.
- Ciclo concluído: `_project/executed/NNN_assunto/`.
- Ciclo arquivado: `_project/archived/NNN_assunto/`.
- Task de issue: `NNN_task_issue-N.md`; múltiplas issues podem usar `NNN_task_issues-N-M.md`.
- Task de encerramento: `NNN_task_closure.md`.
- Task da trilha curta: `_project/fixes/fix_task_issue-N.md`.
- Evidências auxiliares podem usar `NNN_research_*`, `NNN_validation_*` e `NNN_handoff*`.
- ADRs e KBs têm sequências independentes: `ADR-NNN_assunto.md` e `KB-NNN_assunto.md`; registre o ciclo de origem no próprio arquivo.
- `assunto` usa letras minúsculas sem acento, algarismos e `_`.

O próximo ciclo é o valor declarado em `cycles.md`; não o deduza apenas pela maior pasta existente.

## Estados válidos

### Ciclo

| Estado | Local esperado | Significado |
| :-- | :-- | :-- |
| `Ideação` | `ideations/` | Problema em exploração, sem escopo executável |
| `Planejamento` | `drafts/` | Plano em redação ou revisão |
| `Em execução` | `drafts/` | Plano aprovado sendo entregue |
| `Concluído` | `executed/` | Entrega integrada e encerramento documentado |
| `Cancelado` | sem plano ou `archived/` | Trabalho interrompido deliberadamente |
| `Substituído` | `archived/` | Plano sucedido por outro ciclo ou abordagem |

### Plano

| Estado | Local esperado | Significado |
| :-- | :-- | :-- |
| `Rascunho` | `drafts/` | Primeira passagem ainda não submetida à revisão crítica formal |
| `Em Revisão` | `drafts/` | Revisão formal em andamento ou concluída, aguardando correções ou decisão humana pós-veredito |
| `Aprovado` | `drafts/` | Revisão formal concluída, veredito apto e aprovação humana posterior registrados |
| `Em Execução` | `drafts/` | Pelo menos uma entrega autorizada foi iniciada com issue válida |
| `Concluído` | `executed/` | Todas as entregas foram integradas e o encerramento documental foi concluído |
| `Cancelado` ou `Substituído` | `archived/` | Plano interrompido ou sucedido |

### Task

| Estado | Significado |
| :-- | :-- |
| `Em andamento` | Implementação ou preparação em curso |
| `Aguardando integração` | PR publicada, aguardando checks ou gate de integração |
| `Concluída` | PR integrada e evidências reconciliadas |
| `Bloqueada` | Parada por gate, conflito ou decisão pendente |

### Transições canônicas do plano

| Evento | Precondição | Resultado | Próximo gate |
| :-- | :-- | :-- | :-- |
| Salvar primeiro plano | Ideação existente e autorização de salvamento | `Rascunho` | Handoff para `revisar_plano` |
| Iniciar revisão | Plano em `Rascunho` | `Em Revisão` | Relatório e veredito formal |
| Corrigir após veredito | Veredito `REQUER NOVA RODADA` e autorização para corrigir | Permanece `Em Revisão`, com nova versão | Nova rodada de `revisar_plano` |
| Concluir revisão apta | Auditoria concluída e bloqueios resolvidos | Permanece `Em Revisão` | Aprovação humana pós-revisão |
| Aprovar plano | Veredito `APTO PARA APROVAÇÃO` ou `APTO COM RESSALVAS` e manifestação humana posterior | `Aprovado` | Publicação documental e criação de issues conforme o plano |
| Iniciar primeira entrega | Plano `Aprovado`, issue válida e autorização explícita | `Em Execução` | Entrega e checks |
| Encerrar ciclo | Entregas integradas e closure validada | `Concluído` | Movimentação para `executed/` |

Transições não listadas exigem decisão explícita e correção da governança. Aprovação do `Rascunho` significa autorização para submetê-lo à revisão; não permite a transição direta para `Aprovado`.

O estado do ciclo e o estado do plano são relacionados, mas não intercambiáveis. Uma aprovação de plano não representa integração, e uma PR aberta não representa conclusão.

## Fluxo normal

1. Registrar a ideação, salvo a exceção histórica de bootstrap do ciclo `000`.
2. Criar o ciclo e seu plano em `drafts/`.
3. Revisar e obter aprovação humana do plano.
4. Criar issues a partir do plano aprovado.
5. Para cada issue, abrir branch, criar task persistente, implementar, validar e abrir PR.
6. Integrar somente após os gates aplicáveis e atualizar a task com evidências reais.
7. Criar uma task de closure sem issue recursiva, consolidar rastreabilidade e mover o diretório para `executed/` em PR documental própria.
8. Marcar o plano e o ciclo como `Concluído` somente quando a integração do encerramento for verificável.

## Trilha curta

A trilha curta corrige rapidamente um defeito sem abrir ciclo, ideação ou plano. Ela não dispensa nenhuma barreira de domínio.

### Elegibilidade

Uma correção é elegível somente se atender a **todos** os critérios:

1. Corrige comportamento já especificado (plano aprovado, ADR, KB ou `DESIGN.md`), restaurando o resultado esperado.
2. Não muda escopo: não adiciona capacidade, tela, rota, parâmetro ou integração.
3. Não muda schema de forma que altere semântica. Uma migração aditiva que só corrija dado ou restrição já especificada é aceita.
4. Não muda o contrato visual do `DESIGN.md`.

Se qualquer critério falhar, ou deixar de ser atendido durante o trabalho, pare e siga o fluxo normal.

### Fluxo

1. Issue `[FIX]` criada pelo template `bug_report.yml`, com a opção "trilha curta" marcada.
2. Autorização humana explícita para corrigir.
3. Branch `fix/issue-N` e task `_project/fixes/fix_task_issue-N.md`, instanciada de `.agent/templates/task.md` com `Trilha: curta`, a justificativa de cada critério de elegibilidade e a tabela de barreiras preenchida.
4. Correção com teste que reproduz o defeito antes e passa depois.
5. PR com o checklist de barreiras, checks verdes e gate humano de integração.

A trilha curta não altera `cycles.md`. O workflow operacional é `.agent/workflows/corrigir_trilha_curta.md`.

## Barreiras de domínio

As barreiras valem em toda entrega, inclusive na trilha curta. Cada task declara, para cada barreira, se ela se aplica e com qual evidência; "não se aplica" exige justificativa. A PR repete a declaração no checklist do template.

### G1 — Exatidão financeira

Mudança em regra de cálculo (eventos, fechamento, consolidação, retorno Modified Dietz, benchmarks) exige casos de referência com entradas e valores esperados, calculados independentemente, e atualização da KB de regras financeiras.

Quantias monetárias são representadas em centavos inteiros. Valores de índices, taxas e percentuais têm a precisão definida pela KB de regras financeiras (ciclo `002`).

### G2 — Isolamento por RLS

Toda tabela do schema `public` tem RLS ativo e teste que prova que um usuário não lê nem altera dados de outro. O administrador gerencia acessos e o catálogo global de benchmarks, mas não acessa carteiras alheias.

Verificação estática do validador:

- lê todos os arquivos de `supabase/migrations/` em ordem de nome e avalia o conjunto, não cada arquivo isolado;
- toda tabela criada no schema `public` precisa de `alter table … enable row level security` correspondente, no mesmo arquivo ou em migração posterior; contam como `public` a tabela sem schema, `public.x` e `"public"."x"`;
- a comparação ignora maiúsculas e minúsculas, aceita `if not exists`, `if exists` e `only`, e normaliza identificadores entre aspas;
- tabelas de outros schemas ficam fora da regra.

A verificação é heurística e não substitui o teste de banco.

### G3 — Privacidade de dados

A política e o alcance de "dados do usuário" estão em `.agent/ai_behavior.md`. Enforcement:

- `*.sqlite`, `*.db`, `*.csv` e `*.xlsx` só são aceitos em `tests/fixtures/`;
- `*.sql` só é aceito em `supabase/migrations/`, `supabase/tests/`, `supabase/seed.sql` (dados fictícios) e `tests/fixtures/`;
- dados reais de trabalho local ficam em `local/`, ignorado pelo Git e excluído da varredura;
- o `.gitignore` mantém as exclusões mínimas listadas no manifesto do validador.

### G4 — Migrações só acrescentam

Uma migração versionada nunca é editada, renomeada ou removida; correções são novas migrações. Nome: `AAAAMMDDHHMMSS_assunto.sql`, o formato gerado por `supabase migration new`.

Passo de CI em `.github/workflows/governance.yml`:

- checkout com `fetch-depth: 0`;
- em `pull_request`, compara `origin/<base>...HEAD`; em `push` para `main`, compara `github.event.before..github.sha` e é ignorado quando `before` é o SHA nulo;
- usa `git diff --name-status --find-renames -- supabase/migrations/` e falha em qualquer status diferente de `A`;
- sem a pasta, passa. Se `before` não for alcançável após um push forçado, o diff falha e o passo reprova (falha fechada).

### Enforcement por momento

| Barreira | Automatizado desde o ciclo `000` | Automatização prevista | Sempre manual |
| :-- | :-- | :-- | :-- |
| G1 | Seção obrigatória na task e checklist da PR | Testes de casos de referência (ciclo `002`) | Conferência dos valores esperados e da KB |
| G2 | Verificação estática do validador | Teste de banco de isolamento (ciclo `001`) | Revisão de políticas RLS e funções `security definer` |
| G3 | Validador (arquivos de dados e `.gitignore`) | — | Revisão de textos, prints e fixtures |
| G4 | Passo de CI e padrão de nome no validador | — | — |

## Relação entre plano, task, issue e PR

- O plano define o escopo autorizado e a decomposição.
- A issue descreve uma unidade planejada de entrega sem ampliar o plano.
- A task registra branch, execução, barreiras, decisões incidentais, testes, PR, checks e integração daquela unidade.
- A PR apresenta a alteração revisável e os checks; o GitHub é a autoridade de seu estado.
- Uma issue corresponde normalmente a uma PR. Exceções devem ser justificadas no plano ou na task.
- A PR de encerramento não recebe issue própria e sua task não registra o SHA do próprio merge; esse fato permanece verificável no GitHub.

## Branches, commits e migrações

Uma única convenção, nomeada pelo tipo semântico e sem prefixo de ferramenta:

- implementação: `feature/issue-N`, `fix/issue-N` ou `chore/issue-N`;
- ciclo documental: `chore/cycle-NNN-ideation`, `chore/cycle-NNN-plan` ou `chore/cycle-NNN-closure`;
- commits de issue: `feat(issue-N):`, `fix(issue-N):` ou `chore(issue-N):`;
- documentação de ciclo: `docs(cycle-NNN):` ou `chore(cycle-NNN):`;
- prefixos de issue: `[FEATURE]`, `[FIX]` e `[CHORE]`;
- migrações: `supabase/migrations/AAAAMMDDHHMMSS_assunto.sql`.

Os commits seguem Conventional Commits, compatíveis com o release-please a partir do ciclo `001`. PRs são integradas por squash.

Exceção: o release-please cria por conta própria a branch `release-please--branches--main` e o commit de release `chore(main): release x.y.z`, que não seguem as convenções acima. As PRs abertas com o `GITHUB_TOKEN` não disparam outros workflows; os checks da PR de release são executados por `workflow_dispatch`. Os nomes reais são conferidos na primeira execução do workflow.

## Gates mínimos

O tooling de governança usa somente Node.js 24 e APIs nativas, sem `npm install`.

```sh
node --test scripts/validate-governance.test.mjs
node scripts/validate-governance.mjs
git diff --check
git status --short
```

Entregas que tocam a aplicação executam também, a partir do ciclo `001`:

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Antes de publicar uma entrega, execute também os gates adicionais definidos no plano e confirme que o staging contém somente o escopo autorizado. Registre resultados reais na task. Checks críticos devem passar antes do merge, mesmo sem proteção técnica de branch no plano gratuito do GitHub. Falhas semânticas que a automação não cobre exigem revisão manual.

## Handoffs e efeitos

Workflows com mutação usam o contrato canônico de handoff de `.agent/ai_behavior.md` e declaram classe de efeito, identidade estável, precondições, autoridade, evidência, aceite, regra de recusa e resultado de reconciliação. Workflows somente leitura usam saída reduzida e confirmam ausência de mutação.

Uma recomendação de próximo workflow não é autorização. O receptor recusa handoff ausente, incompatível, contraditório ou sem evidência material; execução parcial, conflito ou concorrência exigem intervenção humana antes de nova mutação.
