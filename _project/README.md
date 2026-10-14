# Governança do projeto

Este diretório organiza decisões, conhecimento, ciclos e correções do `saldo-futuro`. Ele governa o processo do repositório; não define por si só a arquitetura funcional do produto. Comportamento, autorizações, handoff e privacidade pertencem a `.agent/ai_behavior.md`.

## Autoridades

- comportamento, autorização, handoff e privacidade: `.agent/ai_behavior.md`;
- ciclo de vida, níveis, situações, modo contínuo, convenções, trilha curta, barreiras de domínio e glossário: este documento;
- estado e próxima numeração: `_project/cycles.md`;
- escopo de implementação: plano aprovado ou, na trilha curta, a issue `[FIX]` elegível;
- unidade de entrega: issue;
- registro local de execução e do próximo passo: task persistente;
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
- Ideação (só no ciclo completo): `_project/ideations/NNN_assunto.md`.
- Ciclo ativo: `_project/drafts/NNN_assunto/NNN_plan.md`.
- Ciclo concluído: `_project/executed/NNN_assunto/`.
- Ciclo arquivado: `_project/archived/NNN_assunto/`.
- Task de issue: `NNN_task_issue-N.md`; múltiplas issues podem usar `NNN_task_issues-N-M.md`.
- Task de encerramento (ciclo completo): `NNN_task_closure.md`.
- Task da trilha curta: `_project/fixes/fix_task_issue-N.md`.
- Evidências auxiliares podem usar `NNN_research_*`, `NNN_validation_*` e `NNN_handoff*`.
- ADRs e KBs têm sequências independentes: `ADR-NNN_assunto.md` e `KB-NNN_assunto.md`; registre o ciclo de origem no próprio arquivo.
- `assunto` usa letras minúsculas sem acento, algarismos e `_`.

O próximo ciclo é o valor declarado em `cycles.md`; não o deduza apenas pela maior pasta existente.

## Níveis e triagem

Toda demanda começa pela triagem (`.agent/workflows/triar.md`, somente leitura). A classificação segue esta ordem, e o primeiro resultado vale:

1. Atende os quatro critérios de elegibilidade da trilha curta? → **trilha curta**.
2. Senão, toca cálculo financeiro (G1); RLS, autenticação ou autorização (G2); o significado do schema; ou as regras de governança (`.agent/`, este documento, validador ou barreiras); ou há dúvida? → **ciclo completo**.
3. Senão → **ciclo leve**.

O modo contínuo é permitido na trilha curta e no ciclo leve, exceto quando G1 ou G2 se aplicarem. No ciclo completo ele é sempre proibido.

| Exemplo fictício | Nível | Modo contínuo |
| :-- | :-- | :-- |
| Corrigir o arredondamento de uma fórmula já especificada na KB de regras financeiras | Trilha curta, com casos de referência (G1) | Proibido |
| Corrigir uma política RLS que deixou de filtrar por `user_id`, como especificado | Trilha curta, com migração nova aditiva e teste de isolamento (G2) | Proibido |
| Corrigir a cor de um botão que diverge do `DESIGN.md` | Trilha curta | Permitido |
| Nova tela de listagem que só lê tabelas já isoladas, sem regra de cálculo | Ciclo leve | Permitido |
| Nova regra de consolidação | Ciclo completo | Proibido |

Regras da triagem:

- O agente propõe o nível e o motivo; o responsável confirma com uma frase da seção "Entrada".
- O nível só sobe. Se um ciclo leve passar a tocar um critério do completo, ou se G1 ou G2 passarem a se aplicar com o modo contínuo ativo, a situação passa a "Parado" e o trabalho é retriado.
- A trilha curta que deixar de ser elegível volta à triagem.

## Entrada

A frase de confirmação define o nível, o alvo e o único workflow que a consome. Esse workflow registra a frase no cabeçalho do artefato que cria (`> **Autorização inicial:** "<frase>" em AAAA-MM-DD`). `NNN` é o próximo ciclo de `cycles.md`, mostrado no bloco da triagem.

| Nível | Frase | Workflow consumidor | O que ele registra |
| :-- | :-- | :-- | :-- |
| Completo | "confirmo o nível completo e autorizo a ideação do ciclo NNN" | `idear` | Ideação com `Nível` e `Autorização inicial`; reserva `NNN` em `cycles.md` como `Ideação` |
| Leve | "confirmo o nível leve e autorizo o plano do ciclo NNN" | `rascunhar_plano` | Documento único com `Nível`, `Autorização inicial` e `Modo contínuo`; reserva `NNN` como `Planejamento` |
| Curta, com issue | "confirmo a trilha curta e autorizo a correção da issue #N" | `corrigir_trilha_curta` | Task com `Trilha: curta`, `Autorização inicial` e `Modo contínuo` |
| Curta, sem issue | "confirmo a trilha curta e autorizo abrir e corrigir a issue [FIX] <título>" | `corrigir_trilha_curta` | Cria a issue com exatamente esse título e o payload apresentado na triagem; registra `Issue: #N`; depois, como na linha anterior |

No leve e na curta, a frase pode terminar com " em modo contínuo" ou com " em modo contínuo com revisão externa".

Na curta sem issue, o alvo do bloco da triagem é o título proposto, nunca um número inventado: `correção "[FIX] <título>" (sem issue)`. Depois da criação, todo bloco usa `correção da issue #N`, com o número observado no GitHub.

## Fluxo por nível

- **Trilha curta:** entrada → issue `[FIX]` (criada, se ainda não existir) → branch → task → teste que reproduz o defeito → correção → revisão da correção → PR → aprovar merge.
- **Ciclo leve:**
  - documento único `NNN_plan.md`, com a seção "Problema e contexto" no lugar da ideação; o ciclo nasce em `Planejamento`;
  - revisão formal → aprovar plano → issues → autorizar implementação → PR → aprovar merge, repetindo por issue;
  - o plano vai na primeira PR do ciclo, sem PR documental própria;
  - a última PR atualiza a documentação viva e traz o encerramento prospectivo. A task da última issue ganha a seção `## Encerramento`.
- **Ciclo completo:**
  - entrada → ideação → autorizar rascunho do plano → plano → revisão formal → aprovar plano;
  - a aprovação do plano cobre a PR documental do plano, seu merge com checks verdes e a criação das issues depois da apresentação do payload;
  - por issue: autorizar implementação → PR → aprovar merge;
  - ação humana externa e verificação em produção, quando o plano as exigir;
  - release, se houver, e encerramento, cada um em sua PR, com aprovar merge. O encerramento é autorizado pela aprovação do plano, consolida a documentação viva e é prospectivo.

## Pontos de aprovação

Cinco tipos, os mesmos em todos os níveis. No plano, a tabela "Pontos de aprovação" registra, para cada ponto: precondição, o que cobre, o que não cobre e o que conferir. Cada merge tem aprovação própria.

| Tipo | Variações | Frase |
| :-- | :-- | :-- |
| Autorizar | correção, ideação, plano do leve, rascunho do plano, implementação | Frases da "Entrada", "autorizo o rascunho do plano do ciclo NNN" e "autorizo a implementação da issue #N" |
| Aprovar plano | — | "aprovo o plano do ciclo NNN" |
| Aprovar merge | uma por PR, inclusive release e encerramento | "aprovo o merge da PR #N" |
| Ação humana externa | — | "concluí a ação externa da issue #N" |
| Verificar produção | — | "autorizo a verificação em produção do ciclo NNN" |

## Situações e próximo passo

Lista fechada. Toda saída de workflow termina com o bloco abaixo, copiado desta tabela; só os campos entre `<>` são preenchidos.

```text
PRÓXIMO PASSO
Situação: <nome> — <alvo>
Quem: <coluna "Quem age", idêntica>
Conferir: <o que conferir, com links; "—" só onde a tabela traz "—">
Diga: <uma das frases da situação>
```

O alvo é `ciclo NNN (leve)`, `ciclo NNN (completo)` ou `correção da issue #N`. Na "Triagem proposta" da curta sem issue, é `correção "[FIX] <título>" (sem issue)`.

| Situação | Quem age | Conferir | Frases |
| :-- | :-- | :-- | :-- |
| Triagem proposta | Responsável | Nível proposto e motivo | Uma frase da seção "Entrada", do nível proposto |
| Ideação registrada | Responsável | Perguntas e decisões da ideação | "autorizo o rascunho do plano do ciclo NNN" |
| Aguardando revisão (rodada N) | O responsável leva a vez a um revisor, que pode ser outra ferramenta | — | "revise o plano do ciclo NNN"; "revise a correção da issue #N" |
| Aguardando correções (rodada N) | O responsável leva a vez ao autor | Achados da rodada | "corrija o plano do ciclo NNN"; "ajuste a correção da issue #N" |
| Aguardando aprovação do plano | Responsável | Veredito e ressalvas na seção de revisão | "aprovo o plano do ciclo NNN" |
| Aguardando autorização de implementação | Responsável | Issue e escopo | "autorizo a implementação da issue #N" |
| Aguardando merge | Responsável | Checks e diff da PR | "aprovo o merge da PR #N" |
| Aguardando ação externa | Responsável | Roteiro indicado no plano | "concluí a ação externa da issue #N" |
| Aguardando verificação em produção | Responsável | Itens de verificação do plano | "autorizo a verificação em produção do ciclo NNN" |
| Pronto para continuar | Qualquer ferramenta, a pedido do responsável | — | "continue o ciclo NNN"; "continue a correção da issue #N" |
| Parado | Responsável | A pergunta registrada | sua resposta à pergunta registrada |
| Concluído | — | — | — |

No bloco, a linha `Diga:` traz a frase entre aspas. As exceções são "Parado" (`Diga: sua resposta à pergunta registrada`) e "Concluído" (`Diga: —`). Para voltar ao modo contínuo depois de uma parada, a resposta inclui "retome o modo contínuo do ciclo NNN" ou "retome o modo contínuo da correção da issue #N".

**Regras:**

- **"continue o ciclo NNN" é sempre aceito.** O agente executa `.agent/workflows/retomar.md`. Se a vez for do responsável, ele só reapresenta o bloco.
- **"concluí a ação externa"** não dispensa a conferência por leitura do que for acessível ao agente.
- **Persistência:** só workflows mutantes gravam o bloco, na seção `## Próximo passo` do artefato ativo. Os somente leitura (`triar`, `retomar`, `health_check` e `listar_issues`) só o mostram. A confirmação da triagem é gravada pelo workflow consumidor da "Entrada".
- **Artefato ativo:**
  - a ideação, no estado `Ideação`;
  - o plano, em `Planejamento` ou antes da primeira task;
  - a task da issue em curso, em `Em execução`;
  - a task da trilha curta.
- **"Pronto para continuar"** só é gravada quando a autorização do próximo passo mutante já está registrada no artefato: pelo modo contínuo ativo ou por uma aprovação anterior que cubra esse passo.

**Retomada (`retomar`):** a observação é somente leitura. Ela lê `cycles.md`, consulta no GitHub as PRs abertas ou recém-fechadas do ciclo e lê o artefato ativo (na branch da PR aberta, se houver; senão, em `main` ou na branch local). A situação efetiva é dada pela primeira regra que se aplicar:

1. a situação gravada é "Parado" → "Parado", preservando a pergunta, sem despacho;
2. PR fechada sem merge → "Parado", com a pergunta "reabrir ou abandonar?";
3. PR aberta com checks falhos ou alterações pedidas na revisão → "Pronto para continuar", se a autorização vigente cobrir a correção (modo contínuo `ativo`, dentro do limite de tentativas); senão, "Parado";
4. PR aberta em que só falta a integração → "Aguardando merge". Só aqui o texto prospectivo de um encerramento é desconsiderado;
5. PR integrada com a situação gravada "Aguardando merge" → o passo seguinte do plano: a próxima issue ("Aguardando autorização de implementação", ou "Pronto para continuar" com modo contínuo ativo) ou o encerramento ("Pronto para continuar", já coberto pela aprovação do plano). A reconciliação da task fica para o próximo workflow mutante;
6. nos demais casos → a situação gravada. Num ciclo em `executed/`, o merge é conferido no GitHub antes de apresentar "Concluído".

O despacho só ocorre quando a situação efetiva é "Pronto para continuar" e a autorização está registrada. Ele executa o workflow mutante indicado, com handoff próprio. Sem acesso ao GitHub, a situação é "Parado".

## Modo contínuo

- **Registro:** a `Autorização inicial` e o campo `> **Modo contínuo:**`, com um de três valores:
  - `—`: nunca autorizado;
  - `ativo`: a cadeia pode avançar sozinha;
  - `suspenso`: a autorização inicial fica como histórico e nada avança sem o responsável.

  `ativo` é proibido com nível completo ou com G1 ou G2 marcados com "Sim". `suspenso` é aceito nesses casos.
- **Escopo:** o ciclo ou a correção nomeados na frase; no leve, as issues do plano revisado. Uma issue nova ou uma mudança de escopo depois da promoção do plano leva a "Parado".
- **O que cobre:**
  - criação de issue e de branch, task e documento do ciclo leve;
  - rodadas de revisão e correções;
  - abertura das PRs;
  - promoção do plano e o ponto "autorizar implementação", somente com veredito `APTO PARA APROVAÇÃO`.
- **Promoção:** o revisor só emite o veredito. No leve, a promoção é o primeiro passo de `criar_issues`, depois do preflight. O campo `Aprovação humana pós-revisão` recebe `Coberta pelo modo contínuo (autorização inicial de AAAA-MM-DD)`, nunca `Aprovada em`.
- **O que nunca cobre:** merges, ação humana externa, verificação em produção, decisões sobre regra financeira, nível completo e trabalho em que G1 ou G2 se apliquem.
- **Paradas obrigatórias.** Levam a situação a "Parado" e o modo a `suspenso`:
  - mudança de nível, ou G1 ou G2 passando a se aplicar;
  - revisão sem progresso;
  - veredito `APTO COM RESSALVAS`;
  - dúvida de escopo, interpretação ou privacidade;
  - nova dependência;
  - checks falhando depois de duas tentativas de correção;
  - precondição que o agente não consegue verificar;
  - falta de capacidade da ferramenta.
- **Depois de uma parada:**
  - com a frase comum da situação seguinte, a cadeia segue com aprovações comuns e o modo continua `suspenso`;
  - com "retome o modo contínuo …", o modo volta a `ativo`, com a data gravada, somente se nenhum critério de proibição persistir. Se persistir, o agente não reativa e explica.
- **Subida de nível:** o trabalho segue do ponto em que está, com o nível novo e o modo `suspenso`. Nenhum ponto de aprovação superado é refeito, salvo se o responsável pedir.
- **Preflight.** Antes de usar a pré-autorização, o workflow confere:
  - `Autorização inicial` presente;
  - modo `ativo`;
  - nível diferente de completo;
  - G1 e G2 sem "Sim";
  - a condição de veredito.

  Se algo falhar, a situação passa a "Parado".
- **Revisão externa:** por padrão, a mesma ferramenta faz a revisão como etapa separada. Com " em modo contínuo com revisão externa", a cadeia para em "Aguardando revisão".
- **Retomada:** depois de cada merge, quem o fez continua, se puder; senão, vale a regra 5 da retomada.

## Revisão formal

- **Onde fica:**
  - no leve e no completo, cada rodada é uma subseção `### Rodada N` em "Revisão crítica" do plano;
  - na trilha curta, a seção `## Revisão da correção` da task, antes da PR, revisando diff, teste de reprodução, elegibilidade e barreiras.
- **Conteúdo de cada rodada:** `Autor:` e `Revisor:` (ferramenta e modelo); achados `RN-k`, classificados como bloqueador ou ressalva; veredito `APTO PARA APROVAÇÃO`, `APTO COM RESSALVAS` ou `REQUER NOVA RODADA`.
- **Resposta do autor:** cada achado é marcado como corrigido, ou contestado com justificativa; a versão é incrementada e as rodadas anteriores são preservadas.
- **Continua** enquanto os bloqueadores diminuírem e nenhum achado corrigido reaparecer.
- **Para** ("Parado") sem progresso, com oscilação, quando a correção exigir decisão do responsável ou quando uma discordância persistir por uma rodada.
- **Rodadas:** 2 é a expectativa normal e 5 é o teto, conferido pelo validador.
- **Limites do revisor:** ele só escreve na seção de revisão e nos campos de status e veredito. Não aprova nem reescreve o plano ou a correção.

## Encerramento prospectivo

Vale para a PR de encerramento do ciclo completo e para a última PR do ciclo leve.

- Os arquivos da PR descrevem o estado depois do merge: plano `Concluído`, tasks `Concluída`, ciclo em `executed/`, `cycles.md` atualizado e bloco "Concluído". O squash grava esse estado no mesmo commit da entrega, então `main` só o mostra quando o merge ocorre.
- Antes do merge, a situação efetiva é determinada pela retomada: "Aguardando merge" quando só falta a integração; um bloqueio registrado prevalece. O bloco mostrado ao abrir a PR é o de "Aguardando merge".
- PR fechada sem merge leva a "Parado", com `main` intacto. Depois do merge, a reconciliação é somente leitura e confere o merge e os checks em `main`; uma divergência leva a "Parado" e é corrigida por trilha curta ou PR documental.
- A task não registra o SHA do próprio merge.

## Estados válidos

### Ciclo

| Estado | Local esperado | Significado |
| :-- | :-- | :-- |
| `Ideação` | `ideations/` | Problema em exploração, sem escopo executável (só no completo) |
| `Planejamento` | `drafts/` | Plano em redação ou revisão |
| `Em execução` | `drafts/` | Plano aprovado sendo entregue |
| `Concluído` | `executed/` | Entrega integrada e encerramento documentado |
| `Cancelado` | sem plano ou `archived/` | Trabalho interrompido deliberadamente |
| `Substituído` | `archived/` | Plano sucedido por outro ciclo ou abordagem |

### Plano

| Estado | Local esperado | Significado |
| :-- | :-- | :-- |
| `Rascunho` | `drafts/` | Primeira passagem ainda não submetida à revisão crítica formal |
| `Em Revisão` | `drafts/` | Revisão formal em andamento ou concluída, aguardando correções ou decisão |
| `Aprovado` | `drafts/` | Veredito apto e aprovação humana posterior, ou promoção coberta pelo modo contínuo |
| `Em Execução` | `drafts/` | Pelo menos uma entrega autorizada foi iniciada com issue válida |
| `Concluído` | `executed/` | Todas as entregas foram integradas e o encerramento documental foi concluído |
| `Cancelado` ou `Substituído` | `archived/` | Plano interrompido ou sucedido |

### Task

| Estado | Significado |
| :-- | :-- |
| `Em andamento` | Implementação ou preparação em curso |
| `Aguardando integração` | PR publicada, aguardando checks ou aprovação do merge |
| `Concluída` | PR integrada e evidências reconciliadas |
| `Bloqueada` | Parada por decisão, conflito ou precondição pendente |

### Transições canônicas do plano

| Evento | Precondição | Resultado | Próximo ponto |
| :-- | :-- | :-- | :-- |
| Salvar primeiro plano | Ideação (completo) ou frase de entrada do leve | `Rascunho` | Revisão formal |
| Iniciar revisão | Plano em `Rascunho` | `Em Revisão` | Rodada e veredito |
| Corrigir após veredito | `REQUER NOVA RODADA` e autorização para corrigir (ou modo contínuo ativo) | Permanece `Em Revisão`, com nova versão | Nova rodada |
| Aprovar plano | Veredito apto e manifestação humana posterior | `Aprovado` (`Aprovada em`) | Publicação documental (completo) ou criação das issues (leve) |
| Promover pelo modo contínuo | Leve, modo `ativo`, preflight e `APTO PARA APROVAÇÃO` | `Aprovado` (`Coberta pelo modo contínuo`) | Criação das issues |
| Iniciar primeira entrega | Plano `Aprovado`, issue válida e autorização (ou modo contínuo ativo) | `Em Execução` | Entrega e checks |
| Encerrar ciclo | Entregas integradas e encerramento prospectivo validado | `Concluído` | Movimentação para `executed/` |

Transições não listadas exigem decisão explícita e correção da governança. O estado do ciclo e o estado do plano são relacionados, mas não intercambiáveis: uma aprovação de plano não representa integração, e uma PR aberta não representa conclusão.

## Trilha curta

A trilha curta corrige rapidamente um defeito sem abrir ciclo, ideação ou plano. Ela não dispensa nenhuma barreira de domínio.

### Elegibilidade

Uma correção é elegível somente se atender a **todos** os critérios:

1. Corrige comportamento já especificado (plano aprovado, ADR, KB ou `DESIGN.md`), restaurando o resultado esperado.
2. Não muda escopo: não adiciona capacidade, tela, rota, parâmetro ou integração.
3. Não muda schema de forma que altere semântica. Uma migração aditiva que só corrija dado ou restrição já especificada é aceita.
4. Não muda o contrato visual do `DESIGN.md`.

Se qualquer critério falhar, ou deixar de ser atendido durante o trabalho, pare e volte à triagem.

### Fluxo

1. Entrada pela frase da curta (com ou sem issue). Sem issue, o workflow cria a issue `[FIX]` pelo template `bug_report.yml`, com a opção "trilha curta" marcada.
2. Branch `fix/issue-N` e task `_project/fixes/fix_task_issue-N.md`, instanciada de `.agent/templates/task.md` com `Trilha: curta`, a justificativa de cada critério de elegibilidade e a tabela de barreiras preenchida.
3. Teste que reproduz o defeito antes e passa depois, e correção.
4. Revisão da correção na task (ver "Revisão formal").
5. PR com o checklist de barreiras, checks verdes e aprovação do merge.

A trilha curta não altera `cycles.md`. O workflow operacional é `.agent/workflows/corrigir_trilha_curta.md`.

## Barreiras de domínio

As barreiras valem em toda entrega, inclusive na trilha curta. Cada task declara, para cada barreira, se ela se aplica e com qual evidência; "não se aplica" exige justificativa. A PR repete a declaração no checklist do template.

### G1 — Exatidão financeira

Mudança em regra de cálculo (eventos, fechamento, consolidação, retorno Modified Dietz, benchmarks) exige casos de referência com entradas e valores esperados, calculados independentemente, e atualização da KB de regras financeiras.

Quantias monetárias são representadas em centavos inteiros. Valores de índices, taxas e percentuais têm a precisão definida pela KB de regras financeiras (ciclo `003`).

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
| G1 | Seção obrigatória na task e checklist da PR | Testes de casos de referência (ciclo `003`) | Conferência dos valores esperados e da KB |
| G2 | Verificação estática do validador e teste de banco de isolamento (`supabase test db`, ciclo `001`) | — | Revisão de políticas RLS e funções `security definer` |
| G3 | Validador (arquivos de dados e `.gitignore`) | — | Revisão de textos, prints e fixtures |
| G4 | Passo de CI e padrão de nome no validador | — | — |

## Relação entre plano, task, issue e PR

- O plano define o escopo autorizado e a decomposição.
- A issue descreve uma unidade planejada de entrega sem ampliar o plano.
- A task registra branch, execução, barreiras, decisões incidentais, testes, PR, checks, integração e o próximo passo daquela unidade.
- A PR apresenta a alteração revisável e os checks; o GitHub é a autoridade de seu estado.
- Uma issue corresponde normalmente a uma PR. Exceções devem ser justificadas no plano ou na task.
- No leve, o plano vai na primeira PR e o encerramento na última. No completo, a PR de encerramento não recebe issue própria.
- Nenhuma task registra o SHA do próprio merge; esse fato permanece verificável no GitHub.

## Branches, commits e migrações

Uma única convenção, nomeada pelo tipo semântico e sem prefixo de ferramenta:

- implementação: `feature/issue-N`, `fix/issue-N` ou `chore/issue-N`;
- ciclo documental (só no completo): `chore/cycle-NNN-ideation`, `chore/cycle-NNN-plan` ou `chore/cycle-NNN-closure`;
- commits de issue: `feat(issue-N):`, `fix(issue-N):` ou `chore(issue-N):`;
- documentação de ciclo: `docs(cycle-NNN):` ou `chore(cycle-NNN):`;
- prefixos de issue: `[FEATURE]`, `[FIX]` e `[CHORE]`;
- migrações: `supabase/migrations/AAAAMMDDHHMMSS_assunto.sql`.

Os commits seguem Conventional Commits, compatíveis com o release-please a partir do ciclo `001`. PRs são integradas por squash.

Exceção: o release-please cria por conta própria a branch `release-please--branches--main--components--saldo-futuro` e o commit de release `chore(main): release x.y.z`, que não seguem as convenções acima. As PRs abertas com o `GITHUB_TOKEN` não disparam outros workflows; os checks da PR de release são executados por `workflow_dispatch`. Os nomes foram conferidos na primeira PR de release (#13).

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
npx supabase start
npx supabase test db
npm run test:e2e
```

Os comandos de Supabase valem para entregas que tocam o banco ou a autenticação; o `test:e2e` com backend exige as variáveis do Supabase local (ver `README.md`).

Antes de publicar uma entrega, execute também as validações adicionais definidas no plano e confirme que o staging contém somente o escopo autorizado. Registre resultados reais na task. Checks críticos devem passar antes do merge, mesmo sem proteção técnica de branch no plano gratuito do GitHub. Falhas semânticas que a automação não cobre exigem revisão manual.

## Handoffs e efeitos

O contrato de handoff (versão 2) e suas regras universais estão em `.agent/ai_behavior.md`. Cada workflow mutante declara a composição da sua `logical_key` e a lista de situações de saída. Uma recomendação de próximo passo não é autorização, exceto pelo modo contínuo dentro do escopo registrado.

## Glossário

| Termo | Significado |
| :-- | :-- |
| Gate | Nome usado até o ciclo `002` para um ponto de aprovação humana; nos comandos de validação, "gate" segue significando verificação obrigatória |
| Ponto de aprovação | Momento em que o responsável autoriza ou aprova algo com uma frase fixa |
| Situação | Estado de espera nomeado na tabela de "Situações e próximo passo" |
| Artefato ativo | Ideação, plano ou task que guarda o bloco "Próximo passo" corrente |
| Modo contínuo | Pré-autorização da trilha curta ou do ciclo leve até a PR, sem cobrir merges |
| Encerramento prospectivo | PR cujos arquivos descrevem o estado depois do próprio merge |
| Artefato legado | Ideação, plano ou task anterior à versão 2 do handoff, listado no manifesto do validador |

Códigos de gate usados no ciclo `001` e seus equivalentes atuais:

| Código antigo | Equivalente |
| :-- | :-- |
| R | Autorizar revisão (hoje, parte do fluxo depois do rascunho) |
| P | Aprovar plano |
| X-A, X-B, X-C | Autorizar implementação da issue |
| M-A, M-B, M-C, M-F, M-R | Aprovar merge da PR (issue, correção ou release) |
| H-C | Ação humana externa |
| V-C | Verificar produção |
| X-F | Autorizar correção |
| E | Encerramento (autorizado pela aprovação do plano) e aprovar merge da PR de encerramento |

Numeração de ciclos: até o ciclo `001`, os documentos citavam `002` para as regras financeiras, `003` para as telas e `004` para a migração. Desde a reforma da governança (ciclo `002`), esses ciclos são `003`, `004` e `005`. Os artefatos históricos não foram reescritos.

O handoff versão 1 (15 campos, mais 4 nos workflows mutantes) foi substituído pela versão 2 no ciclo `002`; os artefatos legados o mantêm.
