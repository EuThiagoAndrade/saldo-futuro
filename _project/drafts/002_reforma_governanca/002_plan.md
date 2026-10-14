# Plano de Implementação — Reforma da governança

> **Ciclo:** `002`
> **Status:** `Em Execução`
> **Versão:** `v3`
> **Data de criação:** 2026-10-13
> **Última atualização:** 2026-10-13
> **Autor:** Thiago Andrade e Claude (Claude Code, Opus 5.5)
> **Tipo:** `chore`
> **Prioridade:** `P1`
> **Nível:** `completo` (proposta deste plano; ver "Níveis e triagem")
> **Revisão formal:** `Concluída`
> **Veredito da revisão:** `APTO COM RESSALVAS`
> **Aprovação humana pós-revisão:** `Aprovada em 2026-10-13`

> Origem: ideação `_project/ideations/002_reforma_governanca.md`, com as decisões 1 a 12 do responsável registradas em 2026-10-13. Este rascunho resolve as verificações técnicas pendentes da ideação (V1 a V3) e propõe as decisões D1 a D8 para as questões que a ideação deixou ao plano.
>
> Até o merge da PR A, este ciclo roda sob a governança atual; depois dele, sob a reformada (D4, ver "Transição do ciclo `002`"). Desde já ele usa nomes claros para os pontos de aprovação, sem códigos de letras, e traz a seção "Próximo passo" no formato proposto. Nada disso contraria as regras atuais.
>
> A `v2` responde aos achados R1-1 a R1-10 da rodada 1, feita pelo Codex, e propõe as decisões D9 a D11, que a revisão expôs. A resposta a cada achado está em "Revisão crítica", na subseção "Resposta do autor à rodada 1".
>
> A `v3` responde aos achados R2-1 a R2-5 da rodada 2, em "Resposta do autor à rodada 2". Ela não reabre nenhum achado da rodada 1.

---

## Objetivo

Reescrever a governança do `saldo-futuro` para equilibrar contexto para a LLM, documentação legível para o responsável e regras verificáveis:

- três níveis de rigor (trilha curta, ciclo leve, ciclo completo), escolhidos por triagem objetiva;
- cinco pontos de aprovação com nomes claros, e glossário para as siglas e numerações antigas;
- próximo passo predefinido: lista fechada de situações, cada uma com quem age, o que conferir e a frase exata;
- modo contínuo para trilha curta e ciclo leve, até a PR, com paradas obrigatórias e retomada por qualquer ferramenta;
- revisão formal por progresso, com teto de 5 rodadas e revisor que pode ser outra ferramenta;
- handoff reduzido (versão 2) e regras de reconciliação escritas uma vez;
- documentação viva: visão do produto e da arquitetura a partir do ciclo `001`, atualizada a cada encerramento;
- governança agnóstica: o repositório e o GitHub são a única memória;
- validador cobrindo as regras novas;
- mapa de ciclos renumerado (`003` regras financeiras, `004` telas, `005` migração).

> **Nota de escopo negativo:** este ciclo não altera código da aplicação, migrações, políticas RLS, configuração de produção, CI além do necessário ao validador, nem a semântica das barreiras G1 a G4. Artefatos históricos em `_project/executed/` e a ideação do ciclo `001` não são reescritos.

## Contexto e baseline

### Estado do repositório

Fatos verificados em `main` @ `9cf7fce`, em 2026-10-13:

- Ciclos `000` e `001` em `Concluído`. A ideação do `002` e a reserva em `_project/cycles.md` são alterações locais, não versionadas.
- Núcleo de governança:
  - `.agent/ai_behavior.md` (137 linhas);
  - `_project/README.md` (243 linhas);
  - 9 workflows, 5 templates e 3 skills;
  - validador `scripts/validate-governance.mjs` (449 linhas), com manifesto `scripts/governance-manifest.json` e 26 testes em `scripts/validate-governance.test.mjs`.
- O validador exige hoje, entre outros pontos:
  - os trechos `### Gates humanos` no template de plano e `handoff_schema_version: 1` em `ai_behavior.md`;
  - os 7 campos de handoff (`handoff_schema_version`, `identity_source`, `rejection_rule`, `logical_key`, `check_before_mutation`, `reconcile_existing` e `ambiguous_state`) em todo workflow mutante;
  - `Próximo ciclo` igual ao maior ciclo registrado mais um.

  Mudar templates ou workflows sem mudar o manifesto reprova o check `Governance`.
- Os fatos da ideação (siglas sem definição, 14 gates no ciclo `001`, 8 PRs no ciclo `001`, handoff copiado em 22 arquivos, ausência de documentação viva do produto, referências aos números antigos de ciclo) continuam válidos neste commit.

### Verificações técnicas da ideação

Pesquisa somente leitura feita em 2026-10-13 na documentação oficial de cada ferramenta.

| # | Verificação | Resultado | Efeito no plano |
| :-- | :-- | :-- | :-- |
| V1 | Instruções do Antigravity | Lê `AGENTS.md` ou `GEMINI.md` nativamente, do diretório editado até a raiz. Import próprio: `@[rótulo](caminho)` insere o conteúdo; `@arquivo` **não insere**. Mantém compatibilidade com `.agent/skills/` e com `<dir>/.agent/rules/*.md`. Os workflows dele deixam de funcionar em 2026-10-19 e migram para skills em `.agents/skills/<nome>/SKILL.md`. Não há confirmação oficial de que ele indexe `.agent/workflows/` | Nenhum adapter novo: o `AGENTS.md` já instrui por texto a leitura integral de `.agent/ai_behavior.md`. O `GEMINI.md` ganha a mesma instrução textual, porque o import `@./…` não seria expandido se o Antigravity lesse esse arquivo. Proibido criar `.agent/rules/` |
| V2 | Codex, Claude Code e Gemini CLI | Codex: lê `AGENTS.md`, sem sintaxe de import documentada, limite combinado padrão de 32 KiB. Claude Code: import `@caminho` relativo ao arquivo; com `CLAUDE.md` presente, **não** lê `AGENTS.md` por padrão. Gemini CLI: `GEMINI.md` com import `@./…`; `AGENTS.md` só por configuração | Adapters atuais continuam válidos. A ADR-001 recebe correção factual: hoje ela diz que o Claude Code "também pode ler" `AGENTS.md` |
| V3 | Colisão com o `.agent/` do repositório | As skills do Antigravity exigem `SKILL.md`; as nossas são `.agent/skills/<nome>/<nome>.md`, provavelmente ignoradas por ele (inferência não documentada) | Risco registrado. Manter os nomes atuais e não criar `.agent/rules/` nem `SKILL.md` |

Fontes: <https://antigravity.google/docs/rules>, <https://antigravity.google/docs/skills>, <https://antigravity.google/docs/migration/workflows-to-skills/>, <https://learn.chatgpt.com/docs/agent-configuration/agents-md>, <https://code.claude.com/docs/en/memory> e <https://geminicli.com/docs/cli/gemini-md/>, acessadas em 2026-10-13.

## Escopo

### Dentro do escopo

- `.agent/ai_behavior.md`, `_project/README.md`, workflows, templates, skills, adapters, template de PR, validador, manifesto e testes, conforme os itens A1 a A7.
- ADR-004 com a decisão da reforma e correção factual da ADR-001.
- KB-003 com a visão do produto e da arquitetura; `README.md` da raiz; renumeração das referências em documentos vivos (itens B1 a B3).

### Fora do escopo

- Tudo o que a nota de escopo negativo lista.
- Automação em que uma ferramenta invoque outra.
- Mudanças em `.github/workflows/` (o check `Governance` já executa o validador e os testes).
- Publicação da tela de consentimento do Google.

## Decisões e autoridades

### Decisões propostas ao responsável

Respostas às questões que a ideação deixou ao plano (D1 a D8) e às decisões que a rodada 1 da revisão expôs (D9 a D11). Cada uma traz a recomendação do agente.

> **Decisão do responsável (2026-10-13):** depois do veredito `APTO COM RESSALVAS` da rodada 3, o responsável aprovou o plano ("aprovo o plano do ciclo 002") e confirmou explicitamente as recomendações de D1 a D11, inclusive D4(b), e o tratamento das ressalvas R3-1 e R3-2. Nenhuma alternativa foi escolhida, então o desenho revisado não muda.

| # | Questão | Opções | Recomendação |
| :-- | :-- | :-- | :-- |
| D1 | Local da visão do produto e da arquitetura | (a) nova KB-003 em `_project/knowledge/`, com link de destaque no `README.md` da raiz; (b) documento próprio em `docs/`; (c) seção do `README.md` | (a): usa uma autoridade já existente ("conhecimento reutilizável e especificações de referência") e não cria outra |
| D2 | Local da lista de situações | (a) nova seção de `_project/README.md`, que já é o dono do ciclo de vida; (b) arquivo próprio | (a): uma autoridade por responsabilidade. O manifesto guarda uma cópia, e um teste confere que as duas estão sincronizadas |
| D3 | Ponto de autorização entre a ideação e o plano no ciclo completo | (a) manter ("autorizo o rascunho do plano"); (b) a ideação segue direto ao plano | (a): a ideação do ciclo completo termina com perguntas ao responsável, então a parada já é natural |
| D4 | A partir de quando as regras novas valem para o ciclo `002` | (a) o `002` termina sob as regras atuais; (b) valem a partir do merge da PR A, com a transição descrita em "Transição do ciclo `002`" | (b), alterada na `v2` (R1-1): depois do merge da PR A as regras atuais deixam de existir no repositório, então nenhum agente conseguiria seguir (a) |
| D5 | Referências aos números antigos de ciclo | (a) atualizar os documentos vivos (READMEs, ADRs, KBs, `DESIGN.md`) e registrar o mapeamento no glossário, sem tocar o histórico; (b) só registrar o mapeamento | (a): edição factual, sem mudar nenhuma decisão das ADRs |
| D6 | Regras e validador na mesma PR | (a) uma PR (issue A); (b) validador primeiro, aceitando os dois formatos | (a): o manifesto exige trechos que a reforma remove, então separá-los deixaria o CI vermelho ou criaria código de transição |
| D7 | Mudança nas regras de governança como critério de ciclo completo | (a) sim: mudar `.agent/`, `_project/README.md`, validador ou barreiras exige ciclo completo; (b) não, só G1, G2 e schema | (a): são as regras que protegem todo o resto; errar nelas tem efeito amplo |
| D8 | Dois workflows novos e somente leitura: `triar` (propõe o nível) e `retomar` ("continue o ciclo NNN") | (a) criar os dois; (b) embutir a triagem em `idear` e a retomada em cada workflow | (a): torna a entrada e a retomada determinísticas e iguais em qualquer ferramenta |
| D9 | Encerramento do ciclo leve (R1-2; afeta a decisão 6 da ideação) | (a) mantém a decisão 6: a última PR traz o encerramento em estado prospectivo, como já faz a PR de encerramento do ciclo completo (ver "Encerramento prospectivo"); (b) o leve também ganha uma PR de encerramento separada | (a): o squash grava a entrega e o encerramento no mesmo commit, então `main` nunca mostra o ciclo concluído sem o código. O padrão é o mesmo da task de encerramento do ciclo `001` |
| D10 | Precedência entre trilha curta e ciclo completo (R1-3) | (a) a trilha curta prevalece quando elegível, e o modo contínuo fica proibido sempre que G1 ou G2 se aplicarem, em qualquer nível; (b) o ciclo completo prevalece, e toda correção que toque G1 ou G2 vira ciclo completo | (a): preserva a trilha curta atual, que já prevê correção com casos de referência (G1) e migração aditiva com RLS (G2). O risco é tratado por proibir o modo contínuo, não por exigir um ciclo inteiro |
| D11 | Revisão formal na trilha curta (R1-4; esclarece a decisão 5 da ideação) | (a) a trilha curta ganha a "Revisão da correção", registrada na task antes da PR, com as mesmas regras de rodada; (b) a trilha curta segue sem revisão formal, como hoje e como no diagrama aprovado, e a redação da decisão 5 passa a "leve e completo" | (a): no modo contínuo, nenhum humano vê a correção antes do merge, e o responsável valorizou a revisão justamente por pegar o que o autor não viu |

### Desenho da governança reformada

Esta seção é a especificação que a issue A implementa. O texto final pode ser enxugado, mas não pode mudar o conteúdo sem nova rodada de revisão. Onde houver alternativa pendente (D9 a D11), o desenho segue a recomendação; outra escolha do responsável é incorporada antes da aprovação.

#### Níveis e triagem

A classificação segue esta ordem, e o primeiro resultado vale (D10):

1. Atende os quatro critérios de elegibilidade atuais de `_project/README.md`? → **trilha curta**.
2. Senão, toca cálculo financeiro (G1); RLS, autenticação ou autorização (G2); o significado do schema; ou as regras de governança (D7); ou há dúvida? → **ciclo completo**.
3. Senão → **ciclo leve**.

O modo contínuo é permitido na trilha curta e no ciclo leve, exceto quando G1 ou G2 se aplicarem (linha "Sim" na tabela de barreiras). No ciclo completo ele é sempre proibido.

| Exemplo fictício | Nível | Modo contínuo |
| :-- | :-- | :-- |
| Corrigir o arredondamento de uma fórmula já especificada na KB de regras financeiras | Trilha curta, com casos de referência (G1) | Proibido |
| Corrigir uma política RLS que deixou de filtrar por `user_id`, como especificado | Trilha curta, com migração nova aditiva e teste de isolamento (G2) | Proibido |
| Corrigir a cor de um botão que diverge do `DESIGN.md` | Trilha curta | Permitido |
| Nova tela de listagem que só lê tabelas já isoladas, sem regra de cálculo | Ciclo leve | Permitido |
| Nova regra de consolidação | Ciclo completo | Proibido |

Regras da triagem:

- O agente propõe o nível e o motivo pelo workflow `triar`, que é somente leitura, e o responsável confirma com uma frase da tabela "Entrada".
- O nível só sobe. Se um ciclo leve passar a tocar um critério do completo, ou se G1 ou G2 passarem a se aplicar com o modo contínuo ativo, a cadeia para (situação "Parado") e o trabalho é retriado.
- A trilha curta que deixar de ser elegível volta à triagem.

#### Entrada

A frase de confirmação define o nível, o alvo e o único workflow que a consome. Esse workflow registra a frase no cabeçalho do artefato que cria (`> **Autorização inicial:** "<frase>" em AAAA-MM-DD`). `NNN` é o próximo ciclo de `_project/cycles.md`, mostrado no bloco da triagem.

| Nível | Frase | Workflow consumidor | O que ele registra |
| :-- | :-- | :-- | :-- |
| Completo | "confirmo o nível completo e autorizo a ideação do ciclo NNN" | `idear` | Ideação com `Nível` e `Autorização inicial`; reserva `NNN` em `cycles.md` como `Ideação` |
| Leve | "confirmo o nível leve e autorizo o plano do ciclo NNN", com " em modo contínuo" opcional | `rascunhar_plano` | Documento único com `Nível`, `Autorização inicial` e `Modo contínuo`; reserva `NNN` como `Planejamento` |
| Curta, com issue | "confirmo a trilha curta e autorizo a correção da issue #N", com " em modo contínuo" opcional | `corrigir_trilha_curta` | Task com `Trilha: curta`, `Autorização inicial` e `Modo contínuo` |
| Curta, sem issue | "confirmo a trilha curta e autorizo abrir e corrigir a issue [FIX] <título>", com " em modo contínuo" opcional | `corrigir_trilha_curta` | Cria a issue com exatamente esse título e o payload apresentado na triagem; registra `Issue: #N` na task; depois, como na linha anterior |

Na curta sem issue, o alvo do bloco da triagem é o título proposto, nunca um número inventado (R2-4). Exemplo fictício:

```text
PRÓXIMO PASSO
Situação: Triagem proposta — correção "[FIX] Botão de salvar sem a cor do DESIGN.md" (sem issue)
Quem: Responsável
Conferir: Nível proposto e motivo
Diga: "confirmo a trilha curta e autorizo abrir e corrigir a issue [FIX] Botão de salvar sem a cor do DESIGN.md"
```

Depois da criação, todo bloco passa a usar `correção da issue #N`, com o número observado no GitHub. A ligação entre título e número fica verificável pela `Autorização inicial` da task, que contém o título, e pelo título da issue no GitHub.

#### Fluxo por nível

- **Trilha curta:** entrada → issue `[FIX]` (criada, se ainda não existir) → branch → task → teste que reproduz o defeito → correção → revisão da correção (D11) → PR → aprovar merge.
- **Ciclo leve:**
  - um documento único (`NNN_plan.md`, com a seção "Problema e contexto" no lugar da ideação), sem arquivo em `ideations/`; o ciclo nasce em `Planejamento`;
  - revisão formal → aprovar plano → issues → autorizar implementação → PR → aprovar merge, repetindo por issue;
  - o plano vai na primeira PR do ciclo, sem PR documental própria;
  - a última PR atualiza a documentação viva e traz o encerramento prospectivo (D9). A task da última issue ganha a seção `## Encerramento`; não há task de encerramento separada.
- **Ciclo completo:**
  - entrada → ideação → autorizar rascunho do plano (D3) → plano → revisão formal → aprovar plano;
  - a aprovação do plano inclui a PR documental do plano, seu merge com checks verdes e a criação das issues depois de apresentar o payload;
  - por issue: autorizar implementação → PR → aprovar merge;
  - ação humana externa e verificação em produção, quando o plano as exigir;
  - release, se houver, e encerramento, cada um em sua PR, com aprovar merge. O encerramento fica autorizado pela aprovação do plano, consolida a documentação viva e é prospectivo.

#### Encerramento prospectivo

Vale para a PR de encerramento do ciclo completo e para a última PR do ciclo leve (D9).

- Os arquivos da PR descrevem o estado depois do merge: plano `Concluído`, tasks `Concluída`, ciclo em `executed/`, `cycles.md` atualizado e bloco "Concluído". O squash grava esse estado no mesmo commit da entrega, então `main` só passa a mostrá-lo quando o merge ocorre.
- Antes do merge, quando só falta a integração, a situação efetiva é "Aguardando merge". Ela é determinada pelo workflow `retomar` a partir do GitHub e da precedência de bloqueios, e não pelo texto prospectivo. O bloco que o agente mostra ao abrir a PR é o de "Aguardando merge".
- **Casos:**
  - PR aberta em que só falta a integração → "Aguardando merge"; com bloqueio registrado, prevalece a regra de precedência de `retomar`;
  - alterações pedidas na revisão → o agente atualiza a branch e a PR continua aberta;
  - PR fechada sem merge → "Parado", com a pergunta "reabrir ou abandonar?" (`main` intacto);
  - merge integrado → reconciliação pós-merge somente leitura: confere o merge e os checks em `main`. Qualquer divergência vira "Parado" e é corrigida por trilha curta ou por PR documental;
  - retomada por outra ferramenta → `retomar` aplica as mesmas regras.
- O validador continua exigindo plano `Concluído` e tasks `Concluída` em `executed/`. Nos artefatos sujeitos à versão 2 (ver "Handoff versão 2"), passa a exigir também o bloco "Concluído" (cenário 28). Os históricos legados não são tocados. A task não registra o SHA do próprio merge (lição de 2026-08-19).

#### Pontos de aprovação

Cinco tipos, os mesmos em todos os níveis. No plano, a tabela "Pontos de aprovação" substitui "Gates humanos", com as colunas: ponto, precondição, o que cobre, o que não cobre e o que conferir. Cada merge continua com aprovação própria.

| Tipo | Variações | Substitui (ciclo `001`) |
| :-- | :-- | :-- |
| Autorizar | correção, ideação, plano do leve, rascunho do plano, implementação | R, X-A, X-B, X-C, X-F |
| Aprovar plano | — | P |
| Aprovar merge | uma por PR, inclusive release e encerramento | M-A, M-B, M-C, M-F, M-R, E |
| Ação humana externa | — | H-C |
| Verificar produção | — | V-C |

#### Situações e próximo passo

Lista fechada. Toda saída de workflow termina com o bloco abaixo, copiado da tabela. Só os campos entre `<>` são preenchidos.

```text
PRÓXIMO PASSO
Situação: <nome> — <ciclo NNN (leve|completo) | correção da issue #N | correção "[FIX] <título>" (sem issue), só em "Triagem proposta">
Quem: <coluna "Quem age", idêntica>
Conferir: <coluna "Conferir", com links; "—" só onde a tabela traz "—">
Diga: "<uma das frases da situação>"
```

| Situação | Quem age | Conferir | Frases |
| :-- | :-- | :-- | :-- |
| Triagem proposta | Responsável | Nível proposto e motivo | Uma frase da tabela "Entrada", do nível proposto |
| Ideação registrada | Responsável | Perguntas e decisões da ideação | "autorizo o rascunho do plano do ciclo NNN" |
| Aguardando revisão (rodada N) | O responsável leva a vez a um revisor, que pode ser outra ferramenta | — | "revise o plano do ciclo NNN"; "revise a correção da issue #N" |
| Aguardando correções (rodada N) | O responsável leva a vez ao autor | Achados da rodada | "corrija o plano do ciclo NNN"; "ajuste a correção da issue #N" |
| Aguardando aprovação do plano | Responsável | Veredito e ressalvas na seção de revisão | "aprovo o plano do ciclo NNN" |
| Aguardando autorização de implementação | Responsável | Issue e escopo | "autorizo a implementação da issue #N" |
| Aguardando merge | Responsável | Checks e diff da PR | "aprovo o merge da PR #N" |
| Aguardando ação externa | Responsável | Roteiro indicado no plano | "concluí a ação externa da issue #N" |
| Aguardando verificação em produção | Responsável | Itens de verificação do plano | "autorizo a verificação em produção do ciclo NNN" |
| Pronto para continuar | Qualquer ferramenta, a pedido do responsável | — | "continue o ciclo NNN"; "continue a correção da issue #N" |
| Parado | Responsável | A pergunta registrada | Resposta à pergunta; para voltar ao modo contínuo suspenso, incluir "retome o modo contínuo do ciclo NNN" ou "retome o modo contínuo da correção da issue #N" |
| Concluído | — | — | — |

**Regras:**

- **"continue o ciclo NNN" é sempre aceito.** O agente executa `retomar`. Se a vez for do responsável, ele só reapresenta o bloco.
- **"concluí a ação externa"** não dispensa a conferência por leitura do que for acessível ao agente (lição de 2026-10-13).
- **Persistência (R1-8):**
  - só workflows mutantes gravam o bloco, na seção `## Próximo passo` do artefato ativo;
  - workflows somente leitura (`triar`, `retomar`, `health_check` e `listar_issues`) só mostram o bloco na resposta e não escrevem nada;
  - a confirmação da triagem é gravada pelo workflow consumidor da tabela "Entrada".
- **Artefato ativo:**
  - a ideação, no estado `Ideação`;
  - o plano, em `Planejamento` ou antes da primeira task;
  - a task da issue em curso, em `Em execução`;
  - a task da trilha curta.
- **Algoritmo de `retomar` (R2-3).** Duas fases separadas.
  - **Observação**, somente leitura:
    1. lê o estado do ciclo em `cycles.md`;
    2. consulta no GitHub as PRs abertas ou recém-fechadas do ciclo, pelas convenções de branch;
    3. lê o artefato ativo: na branch da PR aberta, se houver; senão, em `main` ou na branch local correspondente.
  - **Situação efetiva**, pela primeira regra que se aplicar:
    1. a situação gravada é "Parado" → "Parado", preservando a pergunta registrada, sem despacho;
    2. PR fechada sem merge → "Parado", com a pergunta "reabrir ou abandonar?";
    3. PR aberta com checks falhos, ou com alterações pedidas na revisão da PR → "Pronto para continuar", se a autorização vigente cobrir a correção (modo contínuo `ativo`, dentro do limite de tentativas); senão, "Parado";
    4. PR aberta em que só falta a integração (checks verdes ou em andamento, sem bloqueio registrado) → "Aguardando merge". Só neste caso o texto prospectivo de um encerramento é desconsiderado;
    5. sem PR aberta → a situação gravada no artefato. Num ciclo em `executed/`, o merge é conferido no GitHub antes de apresentar "Concluído".
  - **Despacho**, mutante: só ocorre quando a situação efetiva é "Pronto para continuar" e a autorização está registrada no artefato. É a execução do workflow mutante indicado, com handoff próprio. Em qualquer outro caso, `retomar` só mostra o bloco.
- **"Pronto para continuar"** só é gravada quando a autorização do próximo passo mutante já está registrada no artefato: pelo modo contínuo ativo ou por uma aprovação anterior que cubra esse passo. Sem esse registro, o despacho não acontece e a situação vira "Parado".
- **Falta de capacidade:** se a ferramenta não tiver acesso ao GitHub, `retomar` não consegue confirmar o estado das PRs e devolve "Parado".

#### Modo contínuo

- **Registro:**
  - `> **Autorização inicial:** "<frase>" em AAAA-MM-DD`, gravado pelo workflow consumidor;
  - `> **Modo contínuo:**` com um de três valores (R2-2):
    - `—`: nunca autorizado;
    - `ativo`: a cadeia pode avançar sozinha;
    - `suspenso`: a autorização inicial fica como histórico e nada avança sem o responsável.
  - `ativo` é proibido quando o nível é completo ou quando G1 ou G2 estão marcados com "Sim". `suspenso` é aceito nesses casos: é o registro correto de uma parada por subida de nível ou por G1/G2.
- **Escopo:**
  - o ciclo ou a correção nomeados na frase;
  - no leve, as issues do plano revisado;
  - uma issue nova ou uma mudança de escopo depois da promoção do plano vira "Parado".
- **O que cobre:**
  - criação de issue e de branch, task e documento do ciclo leve;
  - rodadas de revisão e correções;
  - abertura das PRs;
  - promoção do plano a `Aprovado` e o ponto "autorizar implementação", somente com veredito `APTO PARA APROVAÇÃO`.
- **Promoção sem aprovação inventada (R1-7):** na promoção, o campo `Aprovação humana pós-revisão` recebe `Coberta pelo modo contínuo (autorização inicial de AAAA-MM-DD)`, nunca `Aprovada em`. O responsável vê o plano e o código juntos ao decidir o merge da primeira PR. Isso altera, por exceção delimitada, a regra de aprovação posterior ao veredito (ver "Destino dos controles").
- **O que nunca cobre:**
  - merges;
  - ação humana externa;
  - verificação em produção;
  - decisões sobre regra financeira;
  - trabalho em que G1 ou G2 se apliquem (D10).
- **Paradas obrigatórias.** Todas levam a situação para "Parado" e o modo contínuo para `suspenso`:
  - mudança de nível, ou G1 ou G2 passando a se aplicar;
  - revisão sem progresso;
  - veredito `APTO COM RESSALVAS`;
  - dúvida de escopo, interpretação ou privacidade;
  - nova dependência;
  - checks falhando depois de duas tentativas de correção;
  - precondição que o agente não consegue verificar;
  - falta de capacidade da ferramenta (sem shell, `gh` ou rede).
- **Depois de uma parada:** a resposta do responsável decide o caminho.
  - Com a frase comum da situação seguinte (por exemplo, "aprovo o plano do ciclo NNN" após ressalvas), a cadeia segue com aprovações comuns e o modo continua `suspenso`.
  - Com "retome o modo contínuo …", o modo volta a `ativo`, com a data gravada no artefato, **somente** se nenhum critério de proibição persistir (nível completo, G1 ou G2 com "Sim"). Se persistir, o agente não reativa e a situação continua "Parado", com a explicação.
- **Subida de nível:** um leve que passa a completo segue do ponto em que está, com `Nível: completo` e o modo contínuo `suspenso`. Nenhum ponto de aprovação já superado é refeito, salvo se o responsável pedir na resposta ao "Parado".
- **Preflight** (R2-2): antes de usar a pré-autorização, o workflow confere no artefato:
  - `Autorização inicial` presente;
  - `Modo contínuo` igual a `ativo`;
  - nível diferente de completo;
  - G1 e G2 sem "Sim";
  - a condição de veredito.

  Se qualquer item falhar, a situação vira "Parado" e nada é despachado.
- **Quem promove o plano** (R2-5): o revisor só emite o veredito. No leve em modo contínuo, a promoção a `Aprovado` com `Coberta pelo modo contínuo` é o primeiro passo de `criar_issues`, depois do preflight. É o consumo da pré-autorização, não um ato do revisor.
- **Revisão no modo contínuo:** por padrão, a mesma ferramenta faz a revisão como etapa separada. Com " em modo contínuo com revisão externa" na frase de entrada, a cadeia para em "Aguardando revisão".
- **Retomada:** depois de cada merge, quem fez o merge continua, se puder; caso contrário, grava "Pronto para continuar". A retomada vale só dentro do escopo acima.

#### Revisão formal

- **Onde fica:**
  - no leve e no completo, cada rodada é uma subseção `### Rodada N` em "Revisão crítica" do plano;
  - na trilha curta (D11), a seção `## Revisão da correção` da task, que revisa diff, teste de reprodução, elegibilidade e barreiras antes da abertura da PR.
- **Conteúdo de cada rodada:**
  - `Autor:` e `Revisor:` (ferramenta e modelo);
  - achados numerados `RN-k`, classificados como bloqueador ou ressalva;
  - veredito.
- **Resposta do autor:** cada achado é marcado como corrigido, ou contestado com justificativa.
- **Continua** enquanto os bloqueadores diminuírem e nenhum achado corrigido reaparecer.
- **Para** quando:
  - não houver progresso;
  - houver oscilação;
  - a correção exigir decisão do responsável;
  - uma discordância persistir por uma rodada.
- **Rodadas:** 2 é a expectativa normal e 5 é o teto, conferido pelo validador (cenário 24).
- **Limites do revisor:** ele só escreve na seção de revisão e nos campos de status e veredito. Não aprova nem reescreve o plano ou a correção.

#### Handoff versão 2

O contrato passa a `handoff_schema_version: 2`.

- **Por artefato:**
  - `logical_key` (repositório, ciclo, workflow, alvo lógico e revisão de origem), que funde `handoff_id`, `identity_source` e `logical_key`;
  - `effect_class`;
  - `state_before` e `state_after`;
  - `result`;
  - `evidence`;
  - `blockers`;
  - o bloco "Próximo passo".
- **Regras escritas uma vez em `ai_behavior.md`:**
  - recusa;
  - conferência antes de mutar;
  - reconciliação;
  - estado ambíguo;
  - ações proibidas fora da situação;
  - preflight do modo contínuo.
- **Em cada workflow mutante:** a composição da `logical_key` e a lista de situações de saída.
- **Cabeçalho padronizado:** ideação, plano e task declaram `> **handoff_schema_version:** `2`` no cabeçalho.
- **Artefatos legados (R2-1):** o manifesto guarda uma lista fechada de artefatos aceitos na versão 1, sem bloco. Todo artefato fora dela está sujeito à versão 2: precisa declarar `2` e ter o bloco, e a ausência do campo ou do bloco é erro. A lista:
  - tudo em `_project/executed/000_*/` e `_project/executed/001_*/`;
  - `_project/ideations/001_fundacao_aplicacao.md` e `_project/ideations/002_reforma_governanca.md`;
  - o plano do `002`, em `drafts/` ou `executed/`;
  - `_project/fixes/fix_task_issue-14.md`.

  A lista só diminui; uma entrada nova exige nova revisão do plano que a propuser. O validador não exige campos de handoff dentro dos artefatos legados.
- **Bloco opcional nos legados:** num artefato legado que tenha a seção `## Próximo passo`, como o plano do `002`, o formato do bloco é conferido.

#### Princípios agnósticos (R1-9)

Entram em `ai_behavior.md`:

- O estado do projeto e as regras vivem no repositório e no GitHub. Memória privada de ferramenta não é fonte de regra nem de estado.
- A instrução humana atual continua no topo da matriz de autoridade. Se ela precisar valer além da sessão (autorização, restrição ou revogação), o agente a registra no artefato ativo antes de encerrar a saída.
- Nenhuma regra depende de recurso de uma ferramenta específica.
- Falta de capacidade de uma ferramenta vira a situação "Parado". O agente não improvisa.

#### Transição do ciclo `002` (D4)

- **Até o merge da PR A:** valem as regras atuais. A ideação e este plano seguem os templates atuais, com handoff versão 1, e entram na lista de legados. Este plano já traz o bloco e declara `Nível`, o que as regras atuais permitem.
- **Task A:** é criada já na versão 2, na própria branch da PR A. É a mesma mudança que introduz o template novo, então o template vigente naquela branch é o da versão 2. Assim, nenhum artefato novo do `002` precisa entrar na lista de legados.
- **Depois do merge da PR A:** as regras novas valem para o restante do `002`.
  - A task B e as seções de encerramento usam os templates novos e o handoff versão 2.
  - A retomada é feita por `retomar`.
  - Os pontos de aprovação deste ciclo já têm os nomes novos e não mudam.
  - O encerramento segue "Encerramento prospectivo".
- **Artefatos anteriores:** a ideação e o plano do `002` continuam válidos como legados. O formato do bloco do plano é conferido, porque ele o tem.
- **Percurso esperado:** PR A integrada → "autorizo a implementação da issue #N" (issue B) → task B na versão 2 → PR B → "aprovo o merge da PR #N" → PR de encerramento → "aprovo o merge da PR #N" → situação "Concluído".
- **Prova:** fixtures do validador (cenário de transição em A6):
  1. **histórico:** ciclos legados na versão 1, sem bloco, intactos → válidos;
  2. **ciclo em transição:** ideação e plano legados (plano com bloco e `Nível`), task `Concluída` e task ativa na versão 2 → válido;
  3. **ciclo novo:** inteiramente na versão 2 → válido;
  4. **encerramento novo em `executed/`:** bloco "Concluído" → válido; bloco com outra situação → erro; sem bloco → erro;
  5. **artefato fora da lista de legados** declarando versão 1 ou sem o campo → erro.

### Pontos de aprovação deste ciclo

Até o merge da PR A, sob as regras atuais; depois, sob as regras novas (D4). Os nomes são os mesmos nos dois regimes. Cada ponto exige manifestação explícita do responsável, posterior à sua precondição.

| Ponto | Precondição | Cobre | Não cobre | Conferir |
| :-- | :-- | :-- | :-- | :-- |
| **Autorizar revisão** | Rascunho completo | `revisar_plano`, mudança para `Em Revisão`, rodadas e correções até o veredito | Aprovar, versionar, publicar, criar issue | — |
| **Aprovar plano** | Veredito apto; D1 a D11 respondidas; manifestação posterior ao veredito | Marcar `Aprovado`; branch `chore/cycle-002-plan` com a ideação, este plano e `cycles.md`; PR documental e seu merge com checks verdes; `criar_issues` para A e B depois de apresentar o payload; abertura da PR de encerramento ao fim | Implementação | Veredito e ressalvas |
| **Autorizar implementação da issue A** | Plano integrado e issues abertas | Itens A1 a A7 em `chore/issue-N`, com task já na versão 2, commits e PR A; na mesma PR, plano e ciclo para `Em execução` | Merge; iniciar B | Issue A |
| **Aprovar merge da PR A** | Checks `Governance` e `CI` verdes; diff revisado | Merge por squash; a partir dele, regras novas | Iniciar B | Checks, diff e tabela de destino dos controles |
| **Autorizar implementação da issue B** | Merge da PR A | Itens B1 a B3 em `chore/issue-N`, com task na versão 2, commits e PR B | Merge | Issue B |
| **Aprovar merge da PR B** | Checks verdes; diff revisado | Merge por squash | — | Checks, diff e ausência de dados do usuário na KB-003 |
| **Aprovar merge da PR de encerramento** | Merge da PR B; PR `chore/cycle-002-closure` aberta, prospectiva, com checks verdes | Merge e reconciliação pós-merge somente leitura | Qualquer mudança fora do encerramento | Checks e diff |

A abertura da PR de encerramento fica autorizada pela aprovação do plano. Não se espera PR de release: commits `chore` e `docs` não geram versão no release-please.

Toda cadeia autorizada para nos casos a seguir:

- check falho ou conflito;
- arquivo inesperado no diff;
- segredo ou dado do usuário em qualquer artefato;
- controle ou lição atual sem destino na tabela de destino dos controles;
- necessidade de mudar a semântica de G1 a G4;
- necessidade de ampliar o escopo ou de nova dependência.

## Barreiras de domínio

| Barreira | Aplica-se? | Como o ciclo a atende ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Nenhuma regra de cálculo. A barreira é preservada sem mudança semântica, e a reforma a torna critério de ciclo completo |
| G2 — isolamento por RLS | Não | Nenhuma migração, política ou função. A KB-003 descreve o RLS existente sem alterá-lo. A verificação estática do validador é mantida |
| G3 — privacidade de dados | Sim | A KB-003 e os exemplos de situação usam só nomes de tabela, papéis e dados fictícios; nenhum e-mail real, valor ou print. Conferência manual na aprovação do merge da PR B |
| G4 — migrações só acrescentam | Não | Nenhuma migração. O passo de CI e o padrão de nome são mantidos |

## Estratégia de testes

- **Validador:** um teste positivo e um negativo para cada regra nova (cenários 20 a 30 e cenário de transição), além do ajuste dos cenários 4 e 19. A fixture válida continua gerada do manifesto real.
- **Repositório real:** `node --test scripts/validate-governance.test.mjs`, `node scripts/validate-governance.mjs`, `git diff --check` e `git status --short` em cada PR. Os artefatos ativos do `002` passam nas regras novas (D4).
- **Limite do validador:** ele confere formato e consistência entre campos (bloco, frases, `Nível`, modo contínuo × veredito × estado). Não comprova que o responsável disse a frase registrada; isso continua sendo conferência humana, feita no merge.
- **Leitura agnóstica (recomendada, não é ponto de aprovação, R1-10):** depois do merge da PR A, outra ferramenta aberta só no repositório (Codex, Gemini CLI ou Antigravity) responde a "continue o ciclo 002" com o bloco correto. O responsável fornece a ferramenta. O resultado vai para a task B, ou o registro "não executado: nenhuma outra ferramenta disponível". A rodada 1 desta revisão, feita pelo Codex desktop a partir só do repositório, já serve de evidência parcial: o workflow `revisar_plano` foi lido e executado por outra ferramenta.
- **Tabela de destino dos controles:** conferida item a item na revisão formal e na aprovação do merge da PR A.

## Itens de implementação

### Item A1 — `.agent/ai_behavior.md`

**Contexto:** a autoridade de comportamento.

**Ação técnica:**
- Reescrever "Contrato canônico de handoff" para a versão 2, com as regras universais.
- Reescrever "Autorizações e gates" com níveis, pontos de aprovação e o modo contínuo como exceção delimitada à regra "o handoff nunca aciona o workflow seguinte".
- Acrescentar os princípios agnósticos e a obrigação do bloco "Próximo passo".
- Manter integralmente "Privacidade de dados financeiros", "Segurança e mudanças externas", "Simplicidade primeiro", "Mudanças cirúrgicas" e "Gestão de incertezas".

**Critérios de aceite:**
- [ ] Todo controle da tabela de destino marcado como "mantido" continua presente.
- [ ] O modo contínuo nunca cobre merge, ação externa, verificação em produção ou regra financeira.
- [ ] O arquivo fica menor que o atual (137 linhas).

### Item A2 — `_project/README.md`

**Ação técnica:**
- Novas seções "Níveis e triagem", "Pontos de aprovação", "Situações e próximo passo", "Modo contínuo", "Revisão formal" e "Glossário".
- O glossário cobre os códigos do ciclo `001`, o mapa antigo → novo de ciclos e a versão 1 do handoff.
- "Fluxo normal" passa a "Fluxo por nível". Transições do plano para o ciclo leve e para o modo contínuo.
- As referências a "ciclo `002`" nas linhas 143 e 182 passam a `003`.
- "Handoffs e efeitos" vira um parágrafo que remete a `ai_behavior.md`.
- Barreiras G1 a G4 sem mudança semântica.

**Critérios de aceite:**
- [ ] Nenhum código de letras (como "M-A") fora do glossário.
- [ ] A tabela de situações é idêntica à do desenho deste plano.

### Item A3 — Workflows

**Ação técnica:**

- Novos `triar.md` e `retomar.md`, ambos somente leitura. `triar` propõe o nível e mostra a frase de entrada. `retomar` implementa o algoritmo de "Situações e próximo passo".
- Em todos os workflows mutantes: handoff versão 2, composição da `logical_key`, lista "Situações de saída" e preflight do modo contínuo.
- Mudanças por workflow:
  - **`idear`:** só ciclo completo; consome a frase de entrada e grava `Autorização inicial`.
  - **`rascunhar_plano`:** documento único no leve, consumindo a frase de entrada.
  - **`revisar_plano`:** rodadas por progresso, autor e revisor; só emite o veredito, nunca promove o plano.
  - **`criar_issues`:** no leve em modo contínuo, o primeiro passo, depois do preflight, é promover o plano a `Aprovado` com `Coberta pelo modo contínuo` (R2-5).
  - **`implementar_issue`:** modo contínuo, retomada pós-merge e encerramento prospectivo na última PR do leve.
  - **`corrigir_trilha_curta`:** criação da issue a partir da frase, revisão da correção (D11) e modo contínuo proibido com G1 ou G2.
  - **`atualizar_docs`:** consolidação da documentação viva no encerramento.
  - **`health_check` e `listar_issues`:** terminam com o bloco, sem gravar.

**Critérios de aceite:**

- [ ] Cada workflow lista só situações existentes na tabela.
- [ ] Nenhum workflow somente leitura escreve arquivo.
- [ ] `retomar` aplica a precedência de "Situações e próximo passo" e cobre: PR aberta e apta; PR aberta com "Parado" gravado; PR aberta com checks falhos; PR fechada sem merge; encerramento prospectivo aberto; encerramento integrado; ausência de acesso ao GitHub.

### Item A4 — Templates, skills e template de PR

**Ação técnica:**

- **Plano:**
  - cabeçalho com `Nível`, `Autorização inicial` e `Modo contínuo`;
  - "Pontos de aprovação" no lugar de "Gates humanos";
  - "Problema e contexto" para o leve;
  - `## Próximo passo`;
  - "Revisão crítica" no formato de rodadas;
  - `Aprovação humana pós-revisão` aceitando `Aprovada em` ou `Coberta pelo modo contínuo`;
  - handoff versão 2.
- **Todos (ideação, plano e task):** `> **handoff_schema_version:** `2`` no cabeçalho.
- **Ideação:** `Nível`, `Autorização inicial`, `## Próximo passo` e handoff versão 2.
- **Task:**
  - `Autorização inicial` e `Modo contínuo`;
  - `## Próximo passo`;
  - `## Revisão da correção` (trilha curta);
  - `## Encerramento`, opcional, para a última issue do leve;
  - handoff versão 2.
- **`governance-check`:** conferir situação, bloco e coerência do modo contínuo.
- **`.github/pull_request_template.md`:** linhas "Nível" e "Modo contínuo"; "Gate humano de integração concedido" passa a "Aprovar merge concedido".

**Critérios de aceite:**

- [ ] Templates sem campos de handoff da versão 1.
- [ ] O template de PR mantém o checklist G1 a G4.

### Item A5 — Adapters e ADRs

**Ação técnica:**

- `GEMINI.md` ganha a instrução textual de leitura integral de `.agent/ai_behavior.md`, mantendo o import (V1).
- ADR-001:
  - linha do Antigravity (lê `AGENTS.md`);
  - correção sobre a leitura de `AGENTS.md` pelo Claude Code (V2);
  - data de revalidação.
- Nova ADR-004 "Governança proporcional por níveis", com decisão, alternativas (fases, nível único) e consequências, incluindo a exceção delimitada do modo contínuo.

**Critérios de aceite:**

- [ ] Nenhum adapter define política.
- [ ] Não existe `.agent/rules/`.

### Item A6 — Validador, manifesto e testes

**Ação técnica.** Cenários novos, cada um com caso positivo e negativo:

- **20 — Bloco do artefato ativo:**
  - artefatos verificados: ideação de ciclo em `Ideação`, plano em `drafts/`, task não concluída e task da trilha curta não concluída, quando sujeitos à versão 2; nos legados, só se tiverem a seção;
  - o alvo aceita `correção "[FIX] <título>" (sem issue)` somente na situação "Triagem proposta";
  - rejeita: seção `## Próximo passo` ausente, número de linhas diferente de 5, situação fora da lista, alvo fora do padrão, `Quem` diferente da tabela, `Conferir` vazio (ou `—` onde a tabela não traz `—`), `Diga` fora dos modelos da situação;
  - aceita: bloco válido de cada situação.
- **21 — Sincronização:** situações, `Quem` e modelos de frase do manifesto diferentes da tabela de `_project/README.md`.
- **22 — `Nível`:** plano em `drafts/` sem `Nível` igual a `leve` ou `completo`.
- **23 — Promoção do plano:**
  - plano `Aprovado` ou `Em Execução` exige `Aprovação humana pós-revisão` igual a `Aprovada em …`, com veredito `APTO PARA APROVAÇÃO` ou `APTO COM RESSALVAS`, ou igual a `Coberta pelo modo contínuo …`;
  - esta segunda forma só é aceita com `Modo contínuo` declarado e veredito `APTO PARA APROVAÇÃO`;
  - rejeita: leve contínuo promovido com ressalvas; `Coberta pelo modo contínuo` sem modo contínuo;
  - aceita: plano não contínuo com ressalvas e `Aprovada em`.
- **24 — Teto de rodadas:** mais de 5 rodadas em "Revisão crítica" ou em "Revisão da correção".
- **25 — Siglas antigas:** código de gate com letras em plano ativo, detectado pelo padrão `Gates? [A-Z](-[A-Z])?` (como no ciclo `001`). Referências às siglas antigas sem a palavra "Gate", como a tabela de mapeamento deste plano, passam.
- **26 — Workflows:** workflow mutante sem `logical_key` ou sem "Situações de saída", ou com situação de saída fora da lista.
- **27 — Modo contínuo proibido** (R2-2):
  - rejeita: `Modo contínuo: ativo` em plano de ciclo completo ou em plano ou task com G1 ou G2 marcados com "Sim";
  - aceita: completo, ou G2 com "Sim", com autorização antiga e modo `suspenso`; completo com `—`; leve com veredito apto e modo `ativo`.
- **28 — Artefato executado** (R2-1): artefato sujeito à versão 2 em `executed/` sem bloco, ou com bloco diferente de "Concluído". Os legados ficam fora.
- **29 — Autorização:** `Modo contínuo` igual a `ativo` ou `suspenso` sem `Autorização inicial`.
- **30 — Versão do contrato** (R2-1): artefato fora da lista de legados do manifesto sem `handoff_schema_version` `2` no cabeçalho.
- **Transição** (R1-1, R2-1): as cinco fixtures de "Transição do ciclo `002`" dão o resultado esperado. O próprio repositório, com os ciclos `000` e `001` intactos, passa.

Ajustes no manifesto:

- novos workflows na lista de somente leitura;
- situações, `Quem` e modelos de frase, incluindo o alvo da curta sem issue;
- lista fechada de artefatos legados na versão 1;
- `requiredText` atualizado;
- `handoff_schema_version: 2`.

**Critérios de aceite:**

- [ ] Todos os testes antigos e novos passam.
- [ ] Os artefatos executados (versão 1) continuam válidos.
- [ ] O validador continua somente leitura e sem dependências.

### Item A7 — Tabela de destino dos controles

**Ação técnica:** publicar na task A a tabela da seção "Destino dos controles" deste plano, com a evidência (arquivo e trecho) de cada destino depois da implementação.

**Critérios de aceite:**
- [ ] Toda linha tem destino e evidência.
- [ ] Nenhum controle removido sem justificativa.

### Item B1 — KB-003: visão do produto e da arquitetura

**Ação técnica:** escrever a KB-003 a partir do plano executado do `001`, da KB-002, das ADRs 002 e 003 e do código em `main`. Conteúdo:

- o que o produto é e o que já existe;
- stack (remetendo à ADR-002);
- schema e papéis (`admin`, `user`);
- autenticação e lista de acesso;
- isolamento por RLS;
- operação (remetendo à KB-002);
- CI e release;
- mapa "onde está cada coisa".

A KB-003 é a primeira leitura recomendada para entender o produto, e o encerramento de cada ciclo a atualiza.

**Critérios de aceite:**
- [ ] Nenhum dado do usuário (G3).
- [ ] Cada afirmação remete à fonte (arquivo, ADR ou KB).
- [ ] Linguagem para um humano que não leu os planos.

### Item B2 — `README.md` da raiz

**Ação técnica:**
- Mapa de ciclos com `002` governança, `003` regras financeiras, `004` telas e `005` migração.
- Bloco "Comece por aqui" com KB-003 (produto), `_project/README.md` (processo) e glossário.
- Seção "Governança" resumida aos níveis.

**Critérios de aceite:**
- [ ] O mapa é coerente com `_project/cycles.md`.

### Item B3 — Renumeração em documentos vivos

**Ação técnica:** atualizar as referências a ciclos futuros em ADR-002 (linhas 39, 58, 60 e 73), ADR-003 (linha 72), KB-001 (linhas 17, 71 e 114) e `design-system/DESIGN.md` (linhas 8, 96 e 266), com `last_updated` atualizado onde houver.

**Critérios de aceite:**
- [ ] Nenhuma decisão das ADRs muda.
- [ ] Artefatos em `_project/executed/` e `_project/ideations/001_*` intactos.

## Destino dos controles

Proposta de destino de cada controle e lição atual. A issue A preenche a evidência. "Alterado" indica uma exceção delimitada, e não preservação integral.

| Controle ou lição atual | Destino |
| :-- | :-- |
| Matriz de autoridade e ordem de leitura | Mantidas; o glossário e a KB-003 entram na matriz; a instrução humana atual continua no topo (R1-9) |
| Contrato de handoff (15 + 4 campos) | Fundido na versão 2 e no bloco "Próximo passo"; regras universais escritas uma vez |
| "O handoff nunca aciona o workflow seguinte" | **Alterado**: exceção delimitada do modo contínuo, com `Autorização inicial` registrada, preflight e paradas obrigatórias; fora dele, mantido |
| Saída reduzida dos workflows somente leitura | Mantida, com o bloco na resposta e sem gravação |
| Inspeção não autoriza mutação; rascunho não autoriza implementação | Mantidos |
| Rascunho passa obrigatoriamente pela revisão formal | Mantido no leve e no completo; na trilha curta, que não tem plano, vira a "Revisão da correção" na task (D11) |
| Aprovação humana posterior ao veredito | **Alterado** no modo contínuo: a promoção é feita pela autorização inicial, só com veredito `APTO PARA APROVAÇÃO`, e registrada como `Coberta pelo modo contínuo`, nunca como `Aprovada em`; o responsável decide sobre plano e código juntos no merge da primeira PR. Fora do modo contínuo, mantido. Cenários 23 e 29 |
| Implementação exige plano aprovado, issue e autorização | Mantido; a autorização pode ser a do modo contínuo, dentro do escopo registrado |
| Integração exige checks verdes e aprovação por PR | Mantido, sem exceção |
| Encerramento após integração, sem issue recursiva | Mantido: encerramento prospectivo e atômico (D9); antes do merge, a situação efetiva é "Aguardando merge" quando só falta a integração, e um bloqueio registrado prevalece; cenário 28 |
| Parar quando faltar autorização | Mantido como situação "Parado" |
| Conduta de execução, simplicidade, mudanças cirúrgicas, incertezas, regra financeira nunca escolhida sozinho | Mantidos; regra financeira é parada obrigatória do modo contínuo |
| Segurança, mudanças externas e privacidade | Mantidos integralmente |
| Estados de ciclo, plano e task; transições do plano | Mantidos; acrescidas transições do leve e do modo contínuo |
| Fluxo normal | Substituído por "Fluxo por nível" |
| Trilha curta e seus critérios | Mantidos; precedência na triagem (D10); modo contínuo permitido, exceto com G1 ou G2 |
| Barreiras G1 a G4 e enforcement por momento | Mantidos sem mudança semântica |
| Relação plano, issue, task e PR; branches, commits, migrações; gates mínimos | Mantidos; no leve não há `chore/cycle-NNN-plan` nem `-closure` |
| "Cada merge tem gate próprio" | Mantido como "aprovar merge" por PR |
| Tabela de gates (autoriza, não autoriza, evidência) | Renomeada para "Pontos de aprovação", com cobre e não cobre |
| Condições de parada da cadeia por plano | Mantidas e somadas às paradas do modo contínuo |
| Lição 2026-08-12 (inputs de actions) | Mantida (técnica) |
| Lição 2026-08-13 (rascunho ≠ revisão) | Mantida e reforçada pelo cenário 23 |
| Lição 2026-08-17 (handoff estável) | Mantida: `logical_key` e reconciliação na versão 2 |
| Lição 2026-08-19 (reconciliação pós-merge do encerramento) | Mantida; vale também para a última PR do leve |
| Lição 2026-10-12 (objetivo, não mecanismo) | Mantida (conduta de revisão) |
| Lição 2026-10-12 (maiúsculas no sistema de arquivos) | Mantida (técnica) |
| Lição 2026-10-13 (concessão ≠ verificação de precondição) | Mantida: coluna "Conferir", conferência na frase de ação externa, preflight e parada obrigatória |
| Lição 2026-10-13 (roteiros de serviço externo) | Mantida (ação humana externa) |
| Lições 2026-10-13 técnicas (release-please, `$$`, cron) | Mantidas |
| Cenários 1 a 19 do validador | Mantidos; 4 e 19 ajustados aos trechos novos |

## Arquivos afetados

- **Issue A:**
  - `.agent/ai_behavior.md`, `_project/README.md`;
  - `.agent/workflows/` (9 alterados, 2 novos);
  - `.agent/templates/ideacao.md`, `plano_implementacao.md`, `task.md`;
  - `.agent/skills/governance-check/governance-check.md`;
  - `GEMINI.md`, `.github/pull_request_template.md`;
  - `_project/decisions/ADR-001_…`, nova `ADR-004_governanca_proporcional_niveis.md`;
  - `scripts/governance-manifest.json`, `scripts/validate-governance.mjs`, `scripts/validate-governance.test.mjs`;
  - task da issue A e este plano.
- **Issue B:**
  - nova `_project/knowledge/KB-003_visao_produto_arquitetura.md`;
  - `README.md`;
  - ADR-002, ADR-003, KB-001 e `design-system/DESIGN.md` (só referências);
  - task da issue B.
- **Encerramento:** task de encerramento, `_project/cycles.md`, `README.md` e movimentação para `_project/executed/002_reforma_governanca/`.

## Decomposição em issues e PRs

| Unidade | Tipo | Branch | Conteúdo | Pontos de aprovação |
| :-- | :-- | :-- | :-- | :-- |
| PR do plano | documental | `chore/cycle-002-plan` | Ideação, este plano e `cycles.md` | Aprovar plano |
| Issue A / PR A | `[CHORE]` | `chore/issue-N` | Itens A1 a A7 | Autorizar implementação; aprovar merge |
| Issue B / PR B | `[CHORE]` | `chore/issue-N` | Itens B1 a B3 | Autorizar implementação; aprovar merge |
| PR de encerramento | documental | `chore/cycle-002-closure` | Encerramento | Aprovar merge |

B depende de A: o glossário e a estrutura do `README.md` da raiz remetem às seções novas. Pelas regras novas, este ciclo seria de nível completo (D7) e manteria as mesmas quatro PRs.

## Dependências e blockers

- **Bloqueador atual:** nenhum para a publicação documental do plano. A implementação da issue A depende da autorização própria ("autorizo a implementação da issue #N").
- A ideação e `cycles.md` ainda não estão versionados; entram na PR do plano.
- Nenhuma ação externa nem dependência nova. Nenhuma dependência de checkout irmão.

## Riscos, suposições e rollback

| Risco | Mitigação |
| :-- | :-- |
| Perder um controle sem perceber | Tabela de destino conferida na revisão e na aprovação do merge da PR A |
| CI vermelho por regras e validador fora de sincronia | Regras e validador na mesma PR (D6); validador rodado localmente antes do push |
| Modo contínuo usado de forma ampla demais | Escopo e data registrados; paradas obrigatórias; cenários 23 e 27 do validador |
| Lista de situações crescer até virar burocracia | Lista fechada de 12 situações; uma situação nova exige mudança no README e no manifesto, com teste de sincronização |
| Ferramentas diferentes se comportarem de modo diferente | Bloco copiado da tabela; validador; teste manual de leitura agnóstica |
| Antigravity tratar `.agent/` como diretório próprio (V1, V3) | Não criar `.agent/rules/` nem `SKILL.md`; `AGENTS.md` com instrução textual; revalidar na adoção efetiva |
| Confusão de numeração no histórico | Glossário com o mapa antigo → novo; histórico intacto |
| Dado do usuário na KB-003 | Conferência G3 na aprovação do merge da PR B |
| PR A grande demais para revisar | Commits separados por item (A1 a A7); a tabela de destino serve de roteiro da revisão |
| Texto prospectivo do encerramento ser lido como estado real | `retomar` define a situação efetiva pelo GitHub e pela precedência de bloqueios: uma PR aberta só fica em "Aguardando merge" quando nenhum bloqueio prioritário se aplica (D9) |
| Ferramenta sem acesso ao GitHub tentar retomar | `retomar` devolve "Parado" em vez de presumir o estado das PRs |

**Suposições:**
- A documentação oficial consultada em 2026-10-13 descreve o comportamento atual das ferramentas.
- Commits `chore` e `docs` não abrem PR de release.

**Rollback:** cada PR é revertível por squash revert. Um revert da PR A restaura a governança atual inteira, porque regras e validador andam juntos.

## Sequência recomendada

1. Autorizar revisão → rodadas de `revisar_plano` até o veredito.
2. Respostas a D1 a D11 e aprovar plano → PR do plano integrada → issues A e B.
3. Autorizar implementação da issue A → PR A → aprovar merge da PR A.
4. Autorizar implementação da issue B (já sob as regras novas) → PR B, com o teste recomendado de leitura agnóstica ou o registro de que não foi executado → aprovar merge da PR B.
5. PR de encerramento prospectiva → aprovar merge → reconciliação pós-merge somente leitura.

## Referências

- Ideação `_project/ideations/002_reforma_governanca.md` (2026-10-13).
- `.agent/ai_behavior.md`, `_project/README.md`, workflows, templates, skills, validador e manifesto em `main` @ `9cf7fce`.
- `.agent/lessons_learned.md`; ADR-001 a ADR-003; KB-001 e KB-002.
- Plano executado do ciclo `001`, seções "Gates humanos" e "Decomposição em issues e PRs".
- Documentação oficial das ferramentas, listada em "Verificações técnicas da ideação".

## Rastreabilidade

| Campo | Valor |
| :-- | :-- |
| Issue(s) | A: [#20](https://github.com/EuThiagoAndrade/saldo-futuro/issues/20); B: [#21](https://github.com/EuThiagoAndrade/saldo-futuro/issues/21) |
| PR(s) | Plano: [#19](https://github.com/EuThiagoAndrade/saldo-futuro/pull/19), integrada por squash em `227344b`; A: [#22](https://github.com/EuThiagoAndrade/saldo-futuro/pull/22) |
| Branch(es) | Plano: `chore/cycle-002-plan`; A: `chore/issue-20` |
| `handoff_schema_version` | `1` |
| `handoff_id` | `saldo-futuro + 002 + atualizar_docs + 002_plan + v3-aprovado` (anteriores, aceitos: `saldo-futuro + 002 + revisar_plano + 002_plan/rodada-3 + v3`, `saldo-futuro + 002 + rascunhar_plano + 002_plan + v3`, `saldo-futuro + 002 + revisar_plano + 002_plan/rodada-2 + v2`, `saldo-futuro + 002 + rascunhar_plano + 002_plan + v2`, `saldo-futuro + 002 + revisar_plano + 002_plan/rodada-1 + v1` e `saldo-futuro + 002 + rascunhar_plano + 002_plan + 9cf7fce`) |
| Destino após conclusão | `_project/executed/002_reforma_governanca/002_plan.md` |

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 002 (completo)
Quem: Responsável
Conferir: checks e diff da PR #22 e a tabela de destino dos controles na task da issue #20
Diga: "aprovo o merge da PR #22"
```

O artefato ativo é a task da issue #20; este bloco a acompanha. Depois do merge, a retomada indica a autorização de implementação da issue #21.

## Handoff de saída

- `handoff_schema_version`: `1`
- `handoff_id`: `saldo-futuro + 002 + atualizar_docs + 002_plan + v3-aprovado`
- `identity_source`: `repository + cycle + workflow + logical_target + source_revision`. Revisão de origem: plano `v3` revisado na rodada 3 (conteúdo `bc0c17fd…`), sobre `main` @ `9cf7fce`. Timestamp e UUID não definem a identidade.
- `effect_class`: `local_mutation`, seguida de `remote_mutation` (PR documental do plano)
- `state_before` / `state_after`:
  - antes: plano `v3` em `Em Revisão`, com veredito `APTO COM RESSALVAS` e aprovação `Pendente`;
  - depois: plano `v3` em `Aprovado` em 2026-10-13, com D1–D11 confirmadas, R3-2 aplicada e ciclo em `Planejamento`; a mudança para `Em execução` ocorre na PR A.
- `next_transition`: PR documental do plano integrada → `criar_issues` para A e B → autorização de implementação da issue A.
- `preconditions`: checks `Governance` e `CI` verdes na PR do plano; payload das issues apresentado ao responsável.
- `authority`: o responsável (Thiago Andrade): "aprovo o plano do ciclo 002" e confirmação explícita de D1–D11 e das ressalvas, em 2026-10-13, posteriores ao veredito da rodada 3.
- `evidence`: rodada 3 (`APTO COM RESSALVAS`, 0 bloqueadores); decisão registrada em "Decisões propostas ao responsável"; validador de governança.
- `acceptance`: status `Aprovado` com aprovação posterior ao veredito; nenhuma alteração no desenho revisado além de R3-2.
- `blockers`: nenhum para a publicação documental.
- `result`: `executed`
- `next_workflow_recommended` / `next_workflow_authorized`: `criar_issues` para A e B / `criar_issues` para A e B, coberto pela aprovação do plano depois da apresentação do payload.
- `actions_prohibited`: implementar, criar branch de issue ou abrir PR de implementação antes de "autorizo a implementação da issue #N".
- `rejection_rule`: o receptor recusa handoff ausente, incompatível, sem a rodada 3 ou com aprovação anterior ao veredito.
- `logical_key`: `saldo-futuro + 002 + atualizar_docs + 002_plan + v3-aprovado`.
- `check_before_mutation`: verificar se o plano aprovado é o mesmo revisado na rodada 3, salvo a reconciliação editorial de R3-2.
- `reconcile_existing`: preservar todas as rodadas e respostas; não duplicar o registro de aprovação.
- `ambiguous_state`: parar se o conteúdo executável mudar depois da rodada 3 ou houver mais de um plano `002`.

## Revisão crítica

- **Data:** 2026-10-13
- **Versão revisada:** `v3`
- **Veredito:** `APTO COM RESSALVAS`
- **Bloqueios remanescentes:** nenhum bloqueador técnico; D1–D11 e aprovação humana pós-revisão permanecem pendentes para a transição a `Aprovado`. Atualização: D1–D11 confirmadas e plano aprovado em 2026-10-13.
- **Aprovação humana pós-revisão:** `Aprovada em 2026-10-13`
- **Correções materiais:** a `v3` resolve R2-1–R2-5 no desenho e nos critérios de aceite; conciliação registrada na rodada 3. O revisor preservou o conteúdo executável.
- **Ressalvas:** `R3-1` e `R3-2`, sem exigir nova rodada por si mesmas; tratamento no manifesto da issue A e na reconciliação documental da aprovação. R3-2 aplicada na aprovação ("Dependências e blockers" e tabela de riscos); R3-1 é critério da issue A.

### Rodada 1

- **Autor:** Thiago Andrade e Claude (Claude Code, Opus 5.5), conforme autoria registrada no rascunho.
- **Revisor:** Codex desktop, GPT-6.
- **Autorização:** solicitação humana «revise o plano do ciclo 002», em 2026-10-13; autoriza esta revisão formal, sem aprovação do plano ou implementação.
- **Base:** `main` @ `9cf7fce1b038012e8f9e37d0976c4aab73be77bf`; plano `v1` local, ainda não versionado; ciclo em `Planejamento`; nenhuma issue ou task de implementação do `002` registrada.
- **Identidade do conteúdo revisado:** SHA-256 `2d15098e554decfe96b67326ddda3610484b4707a8eea4cf54c7c37b85f9c113`, calculado em UTF-8, com finais de linha LF, do trecho iniciado em `## Objetivo` até imediatamente antes de `## Rastreabilidade`. A revisão preserva esse trecho.
- **Template e autoridades consumidos:** `.agent/templates/plano_implementacao.md`, `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, `.agent/workflows/revisar_plano.md`, ideação do `002`, ADR-001, lições aprendidas, manifesto, validador e templates/workflows pertinentes às transições propostas.

#### Achados bloqueadores

**R1-1 — D4 não define como a governança antiga continua operante depois da PR A.**

- **Local:** D4; itens A1, A3, A4 e A6; estratégia de testes; tabela de destino dos controles.
- **Evidência e efeito:** D4 recomenda terminar o `002` sob as regras atuais, mas a PR A substitui as autoridades, os workflows e os templates pela versão 2 antes da issue B e do encerramento. A compatibilidade prometida em A6 cobre os artefatos executados em versão 1; não especifica o tratamento das tasks ainda a criar e dos handoffs ativos do próprio `002`. Declarar que os artefatos passam no validador novo não define qual contrato o próximo agente deve executar.
- **Correção necessária:** especificar nas autoridades reformadas e nos critérios de A6 o regime transitório do `002`, incluindo templates, handoffs, gates e retomada de B/closure; ou levar ao responsável a alternativa D4(b) e ajustar o plano após sua decisão. Não basta deixar uma ressalva no plano que contradiga a autoridade reescrita.
- **Evidência para resolver:** percurso documentado de A integrada → B → encerramento, com uma fixture do `002` ativo sob o regime escolhido e uma fixture de ciclo novo sob a versão 2, ambas válidas sem exceções implícitas.

**R1-2 — Encerramento na última PR do leve exige conclusão antecipada para passar no validador atual.**

- **Local:** fluxo do ciclo leve; itens A2, A3, A4 e A6; destino «Encerramento após integração».
- **Evidência e efeito:** o plano manda mover o ciclo para `executed/` na mesma PR que entrega a última issue, mas mantém os estados e os cenários antigos. `scripts/validate-governance.mjs:211` trata qualquer pasta em `executed/` como concluída; as linhas 227–242 exigem plano `Concluído` e todas as tasks `Concluída`. Antes do merge, a última entrega e sua integração ainda estão pendentes. A referência à reconciliação pós-merge não resolve esse conflito de preparação: ou o check falha, ou o agente declara conclusão sem integração comprovada.
- **Correção necessária:** definir a representação pré-merge e a reconciliação pós-merge do encerramento leve, com local, estados, evidência e responsável por cada fase. Explicitar os ajustes necessários no validador e como o estado reconciliado será persistido, sem depender de sessão privada nem exigir declaração falsa.
- **Evidência para resolver:** casos de última PR ainda aberta, merge recusado/falho, merge integrado e retomada por outra ferramenta, preservando o controle de que integração pendente não equivale a conclusão.

**R1-3 — A triagem permite classificar a mesma correção como curta ou completa.**

- **Local:** «Níveis e triagem» e workflow `triar` proposto.
- **Evidência e efeito:** uma correção de fórmula já especificada, sem capacidade nova, pode satisfazer os quatro critérios atuais da trilha curta e também tocar G1, critério de ciclo completo. O mesmo ocorre com correção de RLS/autorização já especificada. O workflow atual `corrigir_trilha_curta` prevê expressamente casos financeiros e migrações aditivas. A tabela proposta não declara a precedência entre os dois resultados, embora só permita modo contínuo no curto/leve.
- **Correção necessária:** definir a ordem da classificação e a consequência desses casos. Se o completo prevalecer, declarar a restrição adicional da trilha curta e corrigir a tabela que hoje diz «critérios mantidos». Se a curta prevalecer, explicitar a exceção aos critérios do completo e a decisão humana que a sustenta.
- **Evidência para resolver:** exemplos fictícios de correção de cálculo, correção de isolamento e correção visual, cada um com exatamente um nível e sua regra de modo contínuo.

**R1-4 — A revisão formal da trilha curta foi omitida.**

- **Local:** fluxo da trilha curta; «Revisão formal»; itens A3/A4; tabela de destino.
- **Evidência e efeito:** a decisão humana 5 da ideação exige revisão formal em todos os níveis. O fluxo curto proposto vai da autorização à correção/PR/merge sem uma etapa de revisão; a especificação das rodadas exige uma seção do plano, mas a curta não tem plano. A tabela de destino ainda afirma revisão mantida em todos os níveis. A revisão comum de diff antes do merge não tem os achados, veredito e critérios de progresso da revisão formal especificada.
- **Correção necessária:** definir artefato, momento, critérios, veredito e parada/retomada da revisão formal na curta, preservando sua ausência de plano; ou apresentar ao responsável uma exceção explícita à decisão 5. Não criar um plano incidental por interpretação do implementador.
- **Evidência para resolver:** fluxo curto completo com rodada registrada e exemplo de bloqueador/ressalva que interrompe o modo contínuo.

**R1-5 — As frases de entrada não autorizam o fluxo real do nível leve e da correção ainda sem issue.**

- **Local:** situação «Triagem proposta»; «Fluxo por nível»; itens A2/A3.
- **Evidência e efeito:** para o leve, a única frase de confirmação de nível autoriza «a ideação do ciclo NNN», embora esse nível não tenha ideação e `idear` seja restrito ao completo. Para a curta, a frase exige uma issue #N existente, enquanto o fluxo admite criar a issue depois da autorização. A lista não oferece a frase que autoriza precisamente o documento único do leve nem a correção identificada antes de haver número remoto.
- **Correção necessária:** especificar variantes fechadas por nível e por existência de issue, com alvo e efeito autorizado; definir quem registra confirmação/nível e reserva o ciclo antes da primeira task. Essas variantes devem alimentar o workflow correto sem criação de artefato proibido ou autorização inferida.
- **Evidência para resolver:** entradas de leve sem modo contínuo, leve contínuo, curta com issue e curta sem issue, todas conduzindo a um único próximo workflow autorizado.

**R1-6 — Os cenários do validador não cobrem paradas e formato que o plano promete verificar.**

- **Local:** estratégia de testes; cenários 20, 21, 23 e 27 de A6; risco do modo contínuo.
- **Evidência e efeito:** o cenário 20 verifica situação ausente/inválida, mas não exige os quatro campos do bloco nem a correspondência de «Quem», «Conferir» e «Diga» com a tabela. O cenário 21 compara só nomes de situações. O cenário 23 aceita os dois vereditos aptos sem distinguir modo contínuo; o 27 apenas proíbe contínuo no completo. Assim, a especificação dos testes não rejeita um leve contínuo promovido com `APTO COM RESSALVAS`, apesar de essa ser parada obrigatória, nem garante o bloco não interpretativo aprovado na ideação.
- **Correção necessária:** descrever validações e testes negativos para formato/campos e variantes autorizadas do bloco, além da combinação modo contínuo × veredito × estado. Distinguir presença/formato de evidência daquilo que continua exigindo conferência humana; não alegar que um regex comprova a autorização real.
- **Evidência para resolver:** rejeição de bloco incompleto, frase incompatível, leve contínuo aprovado com ressalvas e modo contínuo no completo; aceitação de variante válida e de plano não contínuo com ressalvas e aprovação humana aplicável.

**R1-7 — A tabela chama de mantido um controle que o modo contínuo altera.**

- **Local:** «Modo contínuo»; destino «Aprovação humana posterior ao veredito»; handoff versão 2.
- **Evidência e efeito:** uma autorização concedida na triagem antes de existir o plano é uma pré-autorização condicionada; não é uma manifestação humana posterior ao veredito. A ideação autorizou propor uma cadeia contínua até a PR, portanto a exceção pode ser desenhada, mas não pode ser apresentada como preservação integral da regra antiga. Ver o plano no merge da primeira PR ocorre depois da implementação que a regra antiga protegia.
- **Correção necessária:** declarar o controle como alterado por exceção delimitada, justificar o destino e definir o registro verificável da autorização inicial, seu alvo/escopo, as condições para promover o plano, os efeitos após uma parada e o limite da retomada pós-merge. Distinguir «aprovação humana pós-revisão» de «avanço coberto por modo contínuo» nos templates e nos estados; não inventar uma aprovação posterior. Vincular o preflight dos handoffs reduzidos a essa evidência local.
- **Evidência para resolver:** exemplo de ciclo leve contínuo com autorização inicial e promoção fiel ao que ocorreu; exemplo após parada obrigatória que aguarda uma decisão específica; revisão da linha correspondente na tabela de destino.

#### Ressalvas

**R1-8 — Leitura e persistência do próximo passo precisam ser separadas.** `triar`, `retomar`, `health_check` e `listar_issues` são somente leitura, mas toda saída deve ter bloco e o bloco deve ficar gravado no artefato ativo. Explicitar que observar/reapresentar não escreve; caso seja preciso atualizar o registro ou despachar um workflow mutante, nomear o efeito e sua autoridade. A confirmação da triagem também precisa de um consumidor mutante definido. Relaciona-se a R1-5.

**R1-9 — «Única memória» deve preservar a autoridade da instrução humana atual.** A vedação de estado/regra em memória privada é coerente com a ADR-001, mas «histórico de conversa não vale» não deve fazer um agente desconsiderar uma autorização, restrição ou revogação humana recebida agora. Distinguir evidência persistente necessária à retomada de uma instrução humana vigente, que continua no topo da matriz; registrar a instrução necessária antes do handoff.

**R1-10 — O teste manual agnóstico aparece opcional e obrigatório.** A estratégia o classifica como «recomendado», mas a sequência de B o inclui como parte da entrega. Definir se é gate ou recomendação, quem fornece a outra ferramenta e como registrar indisponibilidade. O plano pode manter a leitura textual de workflows/skills como mecanismo portável: não precisa depender da indexação nativa do Antigravity.

#### Itens atendidos e verificação das fontes

- Objetivo, limites, barreiras G1–G4, entregas A/B, dependência B → A, riscos e gates de merge estão explícitos. Regras e validador juntos na PR A evitam uma entrega intermediária incompatível. A renumeração cobre as referências vivas inspecionadas e preserva o histórico.
- O template de plano foi comparado integralmente. A tabela «Pontos de aprovação deste ciclo» contém os papéis semânticos da tabela atual «Gates humanos» (precondição, cobre, não cobre, conferir). O parecer não exige restaurar siglas ou o título antigo como correção meramente textual.
- A instrução desta conversa satisfaz a autorização de revisão. D1–D8 permanecem propostas para decisão antes da aprovação; não foram respondidas pelo revisor. A menção a autorização de revisão pendente no corpo é informação do rascunho, superada por este registro operacional.
- As afirmações sobre Codex foram confirmadas na [documentação oficial de AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md): descoberta hierárquica e limite combinado padrão de 32 KiB. A página não documenta uma sintaxe de import do adapter.
- As afirmações sobre import relativo e precedência entre `CLAUDE.md` e `AGENTS.md` foram confirmadas na [documentação oficial do Claude Code](https://code.claude.com/docs/en/memory). A correção factual proposta para a ADR-001 é pertinente quando `CLAUDE.md` já está presente.
- O import de `GEMINI.md` e a configuração de nomes alternativos foram confirmados na [documentação oficial do Gemini CLI](https://geminicli.com/docs/cli/gemini-md/).
- Descoberta de adapters e diferença entre inclusão e referência foram confirmadas nas [regras do Antigravity](https://antigravity.google/docs/rules). O formato de skill e a compatibilidade com o diretório legado constam na [documentação de skills](https://antigravity.google/docs/skills). A data de 2026-10-19 para descontinuação do mecanismo de workflows consta no [guia oficial de migração](https://antigravity.google/docs/migration/workflows-to-skills/). Isso não implica que workflows canônicos lidos como arquivos deixem de ser utilizáveis. A indexação nativa dos arquivos deste repositório não foi testada; a inferência de V3 continua identificada como inferência.
- Revisão manual G3: nenhum dado privado de carteira encontrado no plano; exemplos são estruturais. A revisão não lê `local/`, segredos ou dados financeiros reais.

#### Validações da rodada

| Validação | Resultado observado |
| :-- | :-- |
| `node --version` | `v24.15.0` |
| `node --test scripts/validate-governance.test.mjs` | 26 testes passaram; nenhum falhou |
| `node scripts/validate-governance.mjs` | 0 erros, 0 avisos, 3 itens manuais |
| `git diff --check` | Passou |
| Estado inicial do Git | `cycles.md` modificado; ideação do `002` e diretório do plano não versionados; alterações preexistentes preservadas |
| Escopo da revisão | Somente status/veredito e parecer/rastreabilidade no plano; sem branch, commit, issue, PR ou alteração de implementação |

Os checks atuais não implementam os cenários 20–27 propostos e não atestam os fluxos novos. O resultado técnico da auditoria do plano é bloqueado pelos sete achados acima, mesmo com os checks existentes verdes.

#### Veredito e encaminhamento

**Veredito: `REQUER NOVA RODADA`.** Sete bloqueadores e três ressalvas. O plano permanece `Em Revisão`, versão `v1`, com aprovação humana pós-revisão `Pendente`. O revisor registrou os problemas; nenhuma correção de desenho foi aplicada. O autor deve responder a cada achado como corrigido ou contestado, preservar esta rodada e incrementar a versão ao corrigir, antes de nova revisão.

O handoff e o próximo passo do rascunho, nas seções anteriores, são preservados como origem. O encaminhamento corrente é o desta rodada.

#### Handoff da revisão

1. `handoff_schema_version`: `1`.
2. `handoff_id`: `saldo-futuro + 002 + revisar_plano + 002_plan/rodada-1 + v1@9cf7fce1b038012e8f9e37d0976c4aab73be77bf/2d15098e554decfe96b67326ddda3610484b4707a8eea4cf54c7c37b85f9c113`.
3. `identity_source`: `repository + cycle + workflow + logical_target + source_revision`; revisão de origem: plano local `v1`, base e hash do conteúdo especificados acima; data é metadado.
4. `effect_class`: `local_mutation`.
5. `state_before`: ciclo `Planejamento`; plano `v1` em `Rascunho`, revisão e aprovação pendentes. `state_after`: ciclo `Planejamento`; plano `v1` em `Em Revisão`, rodada 1 concluída, veredito `REQUER NOVA RODADA`, aprovação humana `Pendente`.
6. `next_transition`: correção autorizada do plano → nova versão em `Em Revisão` → nova rodada formal.
7. `preconditions`: autorização humana para corrigir; respostas rastreáveis a R1-1–R1-7 e tratamento de R1-8–R1-10; revisão formal da versão corrigida antes de aprovação.
8. `authority`: responsável autoriza correções e decide alternativas que alterem decisões da ideação/D1–D8; autor corrige/responde; revisor emite novo parecer; responsável decide aprovação apenas após veredito apto.
9. `evidence`: pedido humano de revisão, autoridades/template lidos, arquivos/trechos citados, fontes oficiais e resultados de validação registrados nesta rodada; para a próxima rodada, nova versão e respostas por achado.
10. `acceptance`: receptor reconhece o veredito e os bloqueadores, preserva esta rodada e executa somente correções autorizadas; nenhuma aptidão ou aprovação é inferida dos checks verdes.
11. `blockers`: R1-1–R1-7; autorização para correções ainda não recebida nesta revisão; D1–D8 pendentes para aprovação.
12. `result`: `executed` — revisão registrada; reforma não executada.
13. `next_workflow_recommended`: `rascunhar_plano` para correção, depois `revisar_plano`. `next_workflow_authorized`: nenhum efeito subsequente; a autorização recebida cobre somente esta revisão.
14. `actions_prohibited`: marcar `Aprovado`, corrigir o desenho sem autorização, versionar/publicar o plano, criar issues, implementar, abrir ou integrar PR enquanto faltarem os respectivos gates.
15. `rejection_rule`: recusar encaminhamento sem esta rodada, com conteúdo revisado divergente ou que apresente `REQUER NOVA RODADA` como aptidão/aprovação.

- `logical_key`: igual ao `handoff_id` desta rodada.
- `check_before_mutation`: confirmar ciclo/plano únicos, estado, versão, conteúdo e inexistência de parecer equivalente antes de registrar.
- `reconcile_existing`: reutilizar esta rodada em reexecução compatível; nova evidência deve ser identificada; correção material exige nova versão e rodada, preservando o parecer anterior.
- `ambiguous_state`: mudança concorrente do conteúdo, duplicidade de planos/pareceres ou autorização conflitante exige parada sem sobrescrita.

#### Próximo passo da revisão

```text
PRÓXIMO PASSO
Situação: Aguardando correções (rodada 1) — ciclo 002 (completo)
Quem: o responsável leva a vez ao autor
Conferir: achados R1-1 a R1-10 desta seção de revisão crítica
Diga: "corrija o plano do ciclo 002"
```

### Resposta do autor à rodada 1 (v2)

- **Autor:** Claude (Claude Code, Opus 5.5), autorizado pelo responsável com "corrija o plano do ciclo 002", em 2026-10-13.
- **Procedimento:** `.agent/workflows/rascunhar_plano.md`, em modo de correção. A rodada 1 acima foi preservada sem alteração.

| Achado | Resposta | Onde na `v2` |
| :-- | :-- | :-- |
| R1-1 | **Corrigido.** A recomendação de D4 passou a (b). Com (a), as autoridades em que o `002` se apoiaria deixariam de existir depois da PR A. A transição está descrita com percurso e duas fixtures. | D4; "Transição do ciclo `002`"; "Pontos de aprovação deste ciclo"; A6 (cenário de transição) |
| R1-2 | **Corrigido, com uma contestação parcial levada a D9.** Correção: a representação pré-merge, os casos (PR aberta, alterações, fechada sem merge, integrada, retomada) e a fonte da situação efetiva (GitHub, via `retomar`) agora estão definidos. Contestação: o encerramento na mesma PR não declara conclusão sem integração em `main`, porque o squash grava a entrega e o encerramento no mesmo commit. É o mesmo padrão da PR de encerramento do ciclo completo, já aceito no ciclo `001` (`001_task_closure.md`, linha 19). A alternativa de PR separada fica como D9(b), para o responsável decidir, porque altera a decisão 6. | D9; "Encerramento prospectivo"; "Situações e próximo passo" (algoritmo de `retomar`); A6 (cenário 28) |
| R1-3 | **Corrigido.** A ordem da triagem foi definida: trilha curta, depois completo, depois leve. O modo contínuo passou a depender do risco (proibido com G1 ou G2 em qualquer nível), com exemplos fictícios. A precedência é proposta ao responsável como D10. | D10; "Níveis e triagem"; A6 (cenário 27) |
| R1-4 | **Corrigido, com decisão D11.** A trilha curta ganha a "Revisão da correção" na task, com artefato, momento, critérios, veredito e regras de parada iguais às da revisão do plano. Observação: o responsável disse literalmente "mantém revisão formal no leve"; a redação "em todos os níveis" da decisão 5 da ideação foi do agente. Por isso a alternativa sem revisão na curta é apresentada como D11(b), em vez de presumida. | D11; "Fluxo por nível"; "Revisão formal"; A3; A4; "Destino dos controles" |
| R1-5 | **Corrigido.** Nova tabela "Entrada", com frases fechadas por nível e pela existência da issue, workflow consumidor único, registro de `Autorização inicial` e reserva do ciclo. | "Entrada"; "Situações e próximo passo" (Triagem proposta); A3 |
| R1-6 | **Corrigido.** Os cenários 20 e 21 conferem os cinco campos e os modelos de frase; o 23 cruza modo contínuo, veredito e estado; os novos 27 a 29 cobrem as combinações proibidas. Cada um tem caso positivo e negativo. O limite fica declarado: o validador não comprova que a frase foi dita. | A6; "Estratégia de testes" |
| R1-7 | **Corrigido.** O controle passou a "Alterado" na tabela de destino. Novos: o campo `Coberta pelo modo contínuo`, distinto de `Aprovada em`; o estado `suspenso` depois de uma parada, com a frase "retome o modo contínuo"; o escopo da retomada; e o preflight ligado aos registros do artefato. | "Modo contínuo"; "Destino dos controles"; A4; A6 (cenários 23 e 29) |
| R1-8 | **Corrigido.** Só workflows mutantes gravam o bloco. `triar` e `retomar` não escrevem; a confirmação da triagem é gravada pelo consumidor de "Entrada"; o despacho de `retomar` exige autorização já registrada. | "Situações e próximo passo" (persistência e algoritmo) |
| R1-9 | **Corrigido.** O princípio foi reescrito: a instrução humana atual continua no topo da matriz e é registrada no artefato quando precisar valer além da sessão. Só a memória privada de ferramenta deixa de ser fonte. | "Princípios agnósticos" |
| R1-10 | **Corrigido.** O teste de leitura agnóstica é recomendado, não é ponto de aprovação. O responsável fornece a ferramenta, e a indisponibilidade é registrada. A rodada 1, feita pelo Codex, conta como evidência parcial. | "Estratégia de testes"; "Sequência recomendada" |

### Rodada 2

- **Data:** 2026-10-13.
- **Versão revisada:** `v2`.
- **Autor:** Thiago Andrade e Claude (Claude Code, Opus 5.5), conforme cabeçalho e resposta do autor.
- **Revisor:** Codex desktop, GPT-6.
- **Autorização:** novo pedido humano «revise o plano do ciclo 002»; cobre esta rodada, sem aprovação, correção do desenho ou implementação.
- **Base:** `main` @ `9cf7fce1b038012e8f9e37d0976c4aab73be77bf`; plano local em `Em Revisão`; ciclo `Planejamento`; nenhuma issue/task de implementação do `002` registrada.
- **Conteúdo revisado:** SHA-256 `e7f5a474598cb5b2ff6835b64e4e51fad2203a297daf1077be92ea5d5eaf7bf4`, calculado em UTF-8 com finais LF, de `## Objetivo` até imediatamente antes de `## Rastreabilidade`. Esse trecho permanece intacto.
- **Histórico preservado:** rodada 1 e resposta do autor à rodada 1 preservadas integralmente; SHA-256 do trecho de `### Rodada 1` até imediatamente antes desta nova rodada: `ca2ab036541ca797399bec543c6bb516cba7f9588cd92b4947bce28328c3622b` (UTF-8/LF).
- **Preflight aceito:** plano único, versão incrementada, status adequado, handoff da correção e respostas por achado presentes. O novo pedido satisfaz a autorização da rodada 2 antes pendente.
- **Autoridades/template consumidos:** `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, `.agent/workflows/revisar_plano.md` e `.agent/templates/plano_implementacao.md`; fontes e controles locais da rodada 1; inspeção adicional dos nove planos/tasks históricos em `executed/`, incluindo o precedente citado em `001_task_closure.md:19`.

#### Conciliação da rodada 1

| Achado | Resultado da revisão da `v2` |
| :-- | :-- |
| R1-1 | Resolvido no desenho recomendado D4(b): transição após a PR A, templates por fase e fixtures com handoffs 1/2 definidos. D4 continua pendente de decisão humana antes da aprovação. |
| R1-2 | Contestação parcialmente acolhida: o encerramento prospectivo e o squash atômico são compatíveis com o precedente inspecionado do ciclo `001`. Não se exige PR separada apenas porque a entrega e o encerramento estão juntos. A prioridade absoluta de PR aberta no algoritmo de `retomar` ainda precisa preservar bloqueios reais (R2-3). D9 continua pendente. |
| R1-3 | Resolvido no desenho recomendado D10(a): precedência da curta e proibição do contínuo com G1/G2, com exemplos. A suspensão deve poder ser representada sem reprovação contraditória (R2-2). |
| R1-4 | Resolvido no desenho recomendado D11(a): revisão da correção na task, antes da PR, com critérios e rodadas. O relato do autor sobre a frase humana original não é tratado pelo revisor como nova autorização; D11 explicita a decisão ainda necessária. |
| R1-5 | Parcialmente resolvido: frases de entrada e consumidores definidos. Falta um alvo válido no bloco para a curta sem issue (R2-4). |
| R1-6 | Parcialmente resolvido: casos positivos/negativos, campos/frases e promoção por veredito especificados. Os cenários 27/28 ainda conflitam com estados e compatibilidade prometidos (R2-1/R2-2). |
| R1-7 | Resolvido: exceção identificada como alteração do controle, autorização inicial, escopo, suspensão/retomada e registro `Coberta pelo modo contínuo` distintos de aprovação humana inventada. |
| R1-8 | Resolvido quanto à classe de efeito: somente os consumidores mutantes persistem o bloco. A ressalva não é repetida; R2-3 trata da seleção da situação efetiva. |
| R1-9 | Resolvido: instrução humana atual preservada como autoridade e registro persistente para retomada. |
| R1-10 | Resolvido: teste agnóstico é recomendação, com fornecedor e registro de indisponibilidade definidos. |

A redução dos problemas e as respostas rastreáveis demonstram progresso. Os ajustes abaixo são resíduos ou interações das correções; não representam oscilação de um achado previamente aceito como resolvido em nova versão.

#### Achados bloqueadores

**R2-1 — O cenário 28 exige um bloco ausente dos documentos históricos que devem permanecer intactos.**

- **Local:** «Encerramento prospectivo»; A6, cenário 28 e critério de compatibilidade; nota de escopo negativo.
- **Evidência:** os nove planos/tasks dos ciclos `000` e `001` em `_project/executed/` não possuem `## Próximo passo`. A6 determina «artefato em `executed/` com bloco diferente de “Concluído”», e o desenho diz que o validador passa a exigir esse bloco. Ao mesmo tempo, proíbe reescrever os históricos e exige que os executados em versão 1 continuem válidos.
- **Efeito:** a regra universal reprova o próprio repositório depois da PR A ou exige uma alteração histórica fora do escopo. As duas fixtures de transição ativa não cobrem esse caso.
- **Correção necessária:** delimitar a aplicação do cenário 28 aos artefatos sujeitos ao contrato novo, com critério de identificação verificável, sem exigir criação de bloco nos documentos antigos. Definir também a regra para artefato novo que deveria ter o bloco, mas o omite; ausência não pode dispensar a exigência por si só.
- **Evidência de resolução:** fixture com os ciclos históricos versão 1 intactos e válidos, mais casos de encerramento novo com bloco correto, incorreto e ausente. Reconciliar o texto do cenário 28 com o critério de compatibilidade.

**R2-2 — O cenário 27 pode rejeitar o estado suspenso exigido quando G1/G2 passam a se aplicar.**

- **Local:** «Modo contínuo», paradas/preflight; A6, cenários 27 e 29.
- **Evidência:** toda parada obrigatória leva `Modo contínuo` a `suspenso`, inclusive quando G1/G2 passam a se aplicar ou o nível sobe. O cenário 27 proíbe modo contínuo «declarado» em completo ou com G1/G2 `Sim`, sem distinguir `ativo` de `suspenso`; o 29 reconhece ambos como estados que preservam a autorização inicial.
- **Efeito:** um leve antes autorizado, que passa a tocar G2, deve subir para completo, registrar G2 `Sim` e suspender a cadeia. A leitura literal do cenário 27 reprova justamente esse registro correto de parada. Remover a autorização ou esconder a aplicabilidade não é uma solução aceitável.
- **Correção necessária:** distinguir execução ativa proibida de histórico de autorização suspenso. Explicitar o tratamento de `ativo`, `suspenso` e `—`, incluindo a impossibilidade de reativar enquanto persistir um critério de proibição. Alinhar o preflight a esses critérios, além da presença da autorização e do veredito.
- **Evidência de resolução:** aceita completo/G2 `Sim` com autorização antiga e contínuo `suspenso`, impedindo despacho; rejeita reativação/execução ativa nesse estado; aceita completo com `—` e leve apto com contínuo ativo.

**R2-3 — `retomar` troca um bloqueio registrado por “Aguardando merge” sempre que a PR está aberta.**

- **Local:** algoritmo de `retomar`, passo 3; «Encerramento prospectivo», casos; paradas do modo contínuo.
- **Evidência:** o algoritmo estabelece que, com PR aberta, a situação efetiva é sempre `Aguardando merge`. Uma task de PR aberta também pode estar em `Parado`, por exemplo com checks ainda falhos após duas correções, dúvida de privacidade, precondição não verificável ou revisão sem progresso. A `v2` exige registrar pergunta e suspensão nesses casos, mas a retomada sobrescreve sua apresentação sem examinar a causa.
- **Efeito:** «continue o ciclo» reapresenta uma solicitação de merge quando a decisão necessária é resolver um bloqueio; o próximo passo deixa de ser determinado pelo estado material e pela parada obrigatória. O override prospectivo é útil para desconsiderar um `Concluído` ainda não integrado, mas não pode eliminar todos os demais estados da task.
- **Correção necessária:** definir a precedência de bloqueios/precondições e da revisão sobre o mero fato de a PR estar aberta; limitar o override de conclusão prospectiva à situação em que só falta integração. Identificar separadamente a observação da situação e eventual despacho mutante já autorizado.
- **Evidência de resolução:** retomada de PR aberta e apta → `Aguardando merge`; PR aberta com pergunta/bloqueio e modo suspenso → `Parado`, preservando a pergunta e sem despacho; closure prospectiva aberta → aguarda merge; closure integrada → conclusão conferida.

**R2-4 — A triagem curta sem issue ainda não possui alvo válido no bloco obrigatório.**

- **Local:** «Entrada», linha curta sem issue; formato do bloco; situação `Triagem proposta`; A6, cenário 20.
- **Evidência:** a frase agora autoriza abrir uma issue identificada pelo título, mas `Situação` só admite `ciclo NNN (leve|completo)` ou `correção da issue #N`. Antes da autorização e da criação remota não existe #N; a curta também não reserva ciclo. `triar` é somente leitura e precisa mostrar o bloco antes de a frase ser concedida.
- **Efeito:** esse caminho obriga o agente a inventar um número, usar um ciclo inaplicável ou produzir um bloco fora do padrão. A nova frase resolveu o consumidor, mas não a representação do alvo na saída que solicita a autorização.
- **Correção necessária:** definir uma variante do alvo de triagem que identifique a correção sem número, vinculada ao título/payload apresentado, e sua reconciliação para #N após criação. Sincronizar formato, tabela/manifesto e testes; preservar a proibição de criar a issue no workflow somente leitura.
- **Evidência de resolução:** bloco concreto de `Triagem proposta` para curta sem issue, válido e sem número inventado; autorização consumida pelo workflow correto; bloco posterior com o número observado no GitHub.

#### Ressalva

**R2-5 — Nomear a etapa que promove o plano no modo contínuo.** A3 atribui a `revisar_plano` o campo da promoção, enquanto «Limites do revisor» determina que ele não aprova. O registro `Coberta pelo modo contínuo` resolveu a distinção de autoridade humana; falta indicar quem aplica a promoção depois do parecer apto, como etapa de consumo da pré-autorização, preservando os limites do revisor. Não exige outra ferramenta nem nova aprovação já coberta pela autorização inicial.

#### Validações e limites

| Conferência | Resultado observado |
| :-- | :-- |
| `node --test scripts/validate-governance.test.mjs` | 26 testes passaram, 0 falhas |
| `node scripts/validate-governance.mjs` | 0 erros, 0 avisos, 3 itens manuais |
| `git diff --check` | Passou |
| Compatibilidade histórica inspecionada | 9 planos/tasks históricos; os 9 sem `## Próximo passo` |
| Base e mudanças preexistentes | HEAD `9cf7fce`; `cycles.md` modificado, ideação e diretório do plano não versionados; preservados |
| Completude, gates e barreiras | Template conferido; escopo A/B, gates por PR e declaração G1–G4 presentes; nenhum dado privado de carteira encontrado no plano |
| Fatos externos de V1–V3 | Nenhuma mudança material em relação às fontes oficiais já verificadas e registradas na rodada 1, na mesma data; não se infere teste nativo de outra ferramenta |
| Efeito desta rodada | Apenas cabeçalho de revisão, resumo corrente e nova rodada no plano; conteúdo executável, rodada 1 e resposta do autor preservados |

Os checks executados validam a governança vigente. Os cenários 20–29 ainda são especificação, e seus resultados futuros não foram simulados como testes já implementados. Não houve alteração no validador, implementação, branch, commit, issue ou PR.

#### Veredito e encaminhamento

**Veredito: `REQUER NOVA RODADA`.** Quatro bloqueadores (`R2-1` a `R2-4`) e uma ressalva (`R2-5`). Plano `v2` permanece `Em Revisão`, com aprovação humana pós-revisão `Pendente`. A próxima correção deve responder aos novos achados, preservar as duas rodadas e incrementar a versão. D1–D11 continuam pendentes de decisão antes de aprovação; recomendações do autor/revisor não as satisfazem.

O próximo passo e o handoff de correção anteriores são preservados como origem. O encaminhamento corrente passa a ser o desta rodada. A contestação sobre a atomicidade do encerramento prospectivo foi acolhida; não se pede repetir a correção já aceita, apenas resolver as interações específicas acima.

#### Handoff da rodada 2

1. `handoff_schema_version`: `1`.
2. `handoff_id`: `saldo-futuro + 002 + revisar_plano + 002_plan/rodada-2 + v2@9cf7fce/e7f5a474598cb5b2ff6835b64e4e51fad2203a297daf1077be92ea5d5eaf7bf4`.
3. `identity_source`: `repository + cycle + workflow + logical_target + source_revision`; plano local `v2`, HEAD e hash definidos nesta rodada; data é metadado.
4. `effect_class`: `local_mutation`.
5. `state_before`: ciclo `Planejamento`, plano `v2` em `Em Revisão`, respostas à rodada 1 presentes e nova revisão pendente. `state_after`: ciclo `Planejamento`, plano `v2` em `Em Revisão`, rodada 2 concluída com `REQUER NOVA RODADA`, aprovação humana `Pendente`.
6. `next_transition`: correção autorizada → nova versão em `Em Revisão` → rodada 3.
7. `preconditions`: autorização para corrigir; respostas a R2-1–R2-4 e tratamento de R2-5; nova revisão formal antes da aprovação.
8. `authority`: responsável autoriza correção e decide D1–D11; autor responde/corrige; revisor confere a nova versão; responsável decide aprovação após parecer apto.
9. `evidence`: pedido humano desta revisão, handoff da `v2`, respostas à rodada 1, fontes/trechos e resultados registrados; na próxima rodada, nova versão e resposta por achado.
10. `acceptance`: receptor aceita a conciliação, preserva o histórico e resolve os quatro ajustes sem inferir autorização para implementação nem promover checks atuais a prova das regras futuras.
11. `blockers`: R2-1–R2-4; correção ainda não autorizada nesta rodada; D1–D11 pendentes para aprovação.
12. `result`: `executed` — revisão formal registrada.
13. `next_workflow_recommended`: `rascunhar_plano` para correção, seguido de `revisar_plano`. `next_workflow_authorized`: nenhum efeito subsequente.
14. `actions_prohibited`: corrigir o desenho sem autorização, marcar `Aprovado`, versionar/publicar, criar issue, implementar, abrir/integrar PR sem os respectivos gates.
15. `rejection_rule`: recusar encaminhamento sem rodada 2, com conteúdo divergente ou que trate o veredito como aptidão/aprovação.

- `logical_key`: igual ao `handoff_id` desta rodada.
- `check_before_mutation`: conferir versão, conteúdo, handoff de correção e inexistência de parecer equivalente antes de registrar.
- `reconcile_existing`: reexecução da mesma revisão reutiliza este parecer; nova versão/evidência é identificada, sem apagar rodadas anteriores.
- `ambiguous_state`: mudança concorrente, duplicidade de plano/parecer ou autorização conflitante exige parada sem sobrescrita.

#### Próximo passo da rodada 2

```text
PRÓXIMO PASSO
Situação: Aguardando correções (rodada 2) — ciclo 002 (completo)
Quem: O responsável leva a vez ao autor
Conferir: achados R2-1 a R2-5 desta rodada
Diga: "corrija o plano do ciclo 002"
```

### Resposta do autor à rodada 2 (v3)

- **Autor:** Claude (Claude Code, Opus 5.5), autorizado pelo responsável com "corrija o plano do ciclo 002", em 2026-10-13, depois da rodada 2.
- **Procedimento:** `.agent/workflows/rascunhar_plano.md`, em modo de correção. As rodadas 1 e 2 e a resposta à rodada 1 foram preservadas sem alteração.
- **Progresso:** 7 bloqueadores na rodada 1, 4 na rodada 2. Nenhum achado já aceito como resolvido foi reaberto.

| Achado | Resposta | Onde na `v3` |
| :-- | :-- | :-- |
| R2-1 | **Corrigido.** O manifesto passa a ter uma lista fechada de artefatos legados (ciclos `000` e `001`, ideações do `001` e do `002`, plano do `002` e a task da correção #14), aceitos na versão 1 sem bloco. Todo artefato fora dela precisa declarar a versão 2 no cabeçalho e ter o bloco; a ausência é erro (cenário 30). Os cenários 20 e 28 valem só para artefatos sujeitos à versão 2. Para que nenhum artefato novo do `002` precise ser legado, a task A já nasce na versão 2, na branch que introduz o template. | "Handoff versão 2" (artefatos legados); "Transição do ciclo `002`" (task A e cinco fixtures); "Encerramento prospectivo"; A4; A6 (cenários 20, 28 e 30) |
| R2-2 | **Corrigido.** `ativo`, `suspenso` e `—` têm significados distintos. `ativo` é proibido com nível completo ou G1/G2 "Sim"; `suspenso` é aceito nesses casos como registro da parada. A reativação é recusada enquanto um critério de proibição persistir. O preflight confere nível e G1/G2. A subida de nível tem regra própria. | "Modo contínuo" (registro, depois de uma parada, subida de nível, preflight); A6 (cenário 27, com os casos positivos e negativos pedidos) |
| R2-3 | **Corrigido.** `retomar` separa observação, situação efetiva e despacho. A situação efetiva segue uma ordem de precedência: "Parado" gravado; PR fechada sem merge; PR com checks falhos ou alterações pedidas; e só então "Aguardando merge", quando só falta a integração. O texto prospectivo de encerramento só é desconsiderado nesse último caso. | "Situações e próximo passo" (algoritmo); "Encerramento prospectivo"; "Destino dos controles"; A3 (critério com os sete casos) |
| R2-4 | **Corrigido.** Nova variante de alvo `correção "[FIX] <título>" (sem issue)`, aceita só em "Triagem proposta", com exemplo concreto. A frase de entrada perdeu as aspas internas. A reconciliação para `#N` usa o número observado no GitHub. `triar` continua sem criar a issue. | "Entrada" (exemplo e reconciliação); formato do bloco; A6 (cenário 20) |
| R2-5 | **Corrigido.** O revisor só emite o veredito. No leve em modo contínuo, a promoção do plano é o primeiro passo de `criar_issues`, depois do preflight, como consumo da pré-autorização. | "Modo contínuo" (quem promove o plano); A3 (`revisar_plano` e `criar_issues`) |

### Rodada 3

- **Data:** 2026-10-13.
- **Versão revisada:** `v3`.
- **Autor:** Thiago Andrade e Claude (Claude Code, Opus 5.5), conforme autoria e respostas registradas.
- **Revisor:** Codex desktop, GPT-6.
- **Autorização:** novo pedido humano «revise o plano do ciclo 002»; autoriza esta rodada formal, sem aprovação do plano ou implementação.
- **Base:** `main` @ `9cf7fce1b038012e8f9e37d0976c4aab73be77bf`; ciclo `Planejamento`; plano local em `Em Revisão`; sem issue/task de implementação do `002` registrada.
- **Conteúdo revisado:** SHA-256 `bc0c17fd45f146e3d0e181c4c3121d25fc5f18c4366879ef2d0e30ca6becb578`, em UTF-8 com finais LF, do trecho de `## Objetivo` até imediatamente antes de `## Rastreabilidade`; preservado nesta revisão.
- **Histórico preservado:** rodadas 1/2 e respostas do autor às duas rodadas mantidas integralmente; SHA-256 do trecho de `### Rodada 1` até imediatamente antes desta nova rodada: `db516ece9884f2ea045b43507923e1d46087685e4cbca4f5e1979c8009958940` (UTF-8/LF).
- **Preflight aceito:** plano único, versão incrementada, estado adequado, handoff da correção e resposta a cada achado da rodada 2 presentes. O pedido desta conversa satisfaz a autorização da rodada 3.
- **Autoridades e template consumidos:** `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, `.agent/workflows/revisar_plano.md` e `.agent/templates/plano_implementacao.md`; controles, fontes e evidências já registrados nas rodadas anteriores; inventário local dos artefatos históricos.

#### Conciliação da rodada 2

| Achado | Resultado da conferência da `v3` |
| :-- | :-- |
| R2-1 | Resolvido no desenho: distinção explícita entre legados e artefatos novos, campo de versão no cabeçalho, bloco obrigatório para os novos, cenário 30 e cinco fixtures de transição. Os históricos podem passar sem reescrita. A materialização da lista fechada no manifesto recebe a ressalva R3-1. |
| R2-2 | Resolvido: `ativo`, `suspenso` e `—` têm semânticas distintas; suspensão é válida no completo/G1/G2, execução ativa é proibida e a reativação é recusada enquanto a proibição persistir. O preflight e o cenário 27 foram alinhados. |
| R2-3 | Resolvido no algoritmo e no critério de A3: bloqueio registrado prevalece, PR fechada sem merge para, falhas/alterações só permitem correção autorizada dentro das tentativas e a integração é conferida antes de conclusão. A frase antiga na tabela de riscos é resíduo editorial (R3-2), não a regra de execução do algoritmo revisado. |
| R2-4 | Resolvido: alvo por título permitido somente na triagem sem issue, exemplo concreto, consumidor único e reconciliação pelo número observado no GitHub. Não há criação remota incidental por `triar`. |
| R2-5 | Resolvido: `revisar_plano` só emite parecer; `criar_issues` consome a pré-autorização e promove o leve após seu preflight. O revisor não aplica aprovação. |

Os achados já conciliados nas rodadas anteriores continuam resolvidos no desenho recomendado. Houve progresso de 7 → 4 → 0 bloqueadores técnicos, sem reabertura de controle anteriormente aceito. A compatibilidade e os novos cenários ainda deverão ser demonstrados na implementação: esta rodada revisa sua especificação, não declara que o tooling futuro já está implementado.

#### Ressalvas não bloqueadoras

**R3-1 — Materializar a lista de legados por identidades de arquivos existentes.**

- **Local:** «Handoff versão 2», lista de legados; item A6 e cenário 30.
- **Observação:** o desenho já determina lista fechada, sem admissão automática de artefatos novos. Os padrões `_project/executed/000_*/` e `001_*/` são uma descrição do inventário atual; se virarem exceções abertas por diretório, um arquivo futuro nesses locais também seria dispensado da versão 2 sem ter sido legado.
- **Tratamento na issue A:** enumerar no manifesto os arquivos existentes abrangidos pela decisão, incluindo os dois locais previstos para o plano do `002`, em vez de autorizar qualquer arquivo futuro pela pasta. Delimitar os cenários de artefatos à ideação/plano/task previstos no cabeçalho padronizado, sem exigir campos de processo nas ADRs/KBs que não os usam.
- **Evidência no gate da PR A:** históricos reais válidos; arquivo novo de plano/task não passa a legado por ser colocado em diretório histórico; novo artefato sujeito à versão 2 sem campo/bloco reprova. Trata-se de concretizar a lista fechada já especificada, sem ampliar escopo ou reescrever históricos.

**R3-2 — Reconciliar os resíduos editoriais com o parecer corrente.**

- **Local:** «Dependências e blockers» ainda cita autorização da rodada 2; a tabela de riscos ainda diz «PR aberta é sempre “Aguardando merge”», embora o algoritmo revisado e a tabela de destino reconheçam a precedência de bloqueios.
- **Tratamento:** na atualização documental autorizada da aprovação, reconciliar o estado da revisão, o próximo passo e essa descrição de risco com a regra de execução já revisada: uma PR aberta só aguarda merge quando nenhum bloqueio prioritário se aplica. O revisor não alterou essas seções para preservar seu limite de edição.
- **Limite:** o pedido atual já autoriza a rodada 3; a referência antiga não é uma autorização faltante. A descrição de risco não substitui o algoritmo nem concede merge. Esta ressalva não exige mudar o desenho ou repetir a auditoria.

#### Itens atendidos, evidências e limites

- O template foi conferido integralmente. Escopo, não-escopo, decomposição A/B, sequência, dependências, critérios de aceite, riscos, gates por PR e barreiras G1–G4 permanecem explícitos. Nenhum dado privado de carteira foi encontrado no plano.
- A PR A mantém regras, consumidores e validador juntos; a PR B mantém a documentação viva e a renumeração dentro do escopo. A proibição de mudar aplicação, migrações, RLS e semântica das barreiras foi preservada.
- A preparação da task A em versão 2 está explicitamente prevista na branch que introduz o template. Isso não antecipa autorização de implementação nem altera os gates humanos do ciclo completo; o executor deve ler o template efetivamente vigente na branch, como exige a autoridade atual.
- A compatibilidade histórica tem caminho de implementação e casos positivos/negativos definidos. A lista de legados é uma exceção limitada à transição, não dispensa de revisão ou aprovação.
- O modo contínuo continua excluindo merges, G1/G2, nível completo, ação externa e verificação em produção. A promoção por pré-autorização é identificada como exceção à regra antiga, com estado, escopo e evidência próprios.
- As fontes oficiais de V1–V3 permanecem as já verificadas na rodada 1, na mesma data, sem mudança material. Não se infere execução nativa nem teste de retomada da governança nova em outra ferramenta.

| Validação | Resultado observado |
| :-- | :-- |
| `node --test scripts/validate-governance.test.mjs` | 26 testes passaram, 0 falhas |
| `node scripts/validate-governance.mjs` | 0 erros, 0 avisos, 3 itens manuais |
| `git diff --check` | Passou |
| Estado inicial do Git | `cycles.md` modificado; ideação do `002` e diretório do plano não versionados; preservados |
| Efeito desta rodada | Cabeçalho de revisão, resumo corrente e nova rodada no plano; conteúdo executável e histórico preservados |

Os checks são da governança vigente; a aceitação futura dos cenários 20–30 deve ser registrada na task e nos checks da PR A. Não houve implementação, criação de issue/branch/commit/PR nem aprovação humana inferida.

#### Veredito e próxima decisão

**Veredito: `APTO COM RESSALVAS`.** Nenhum bloqueador técnico remanescente; duas ressalvas não bloqueadoras, com tratamento e evidência definidos. A revisão da `v3` está concluída, mas o plano permanece `Em Revisão`, com aprovação humana pós-revisão `Pendente`.

O parecer avalia o desenho recomendado: D4(b) e recomendações (a) para as demais decisões. O responsável ainda deve responder D1–D11 e conceder aprovação específica depois deste veredito, aceitando ou determinando o tratamento das ressalvas. Se escolher uma alternativa que altere materialmente o desenho revisado, essa alteração deve ser incorporada e novamente revisada antes da aprovação. O ciclo `002` é completo, e nenhuma exceção do modo contínuo aprova este plano.

Os handoffs e próximos passos anteriores são histórico. O encaminhamento corrente é aguardar a decisão humana pós-revisão; não se recomenda outra rodada apenas para repetir achados resolvidos.

#### Handoff da rodada 3

1. `handoff_schema_version`: `1`.
2. `handoff_id`: `saldo-futuro + 002 + revisar_plano + 002_plan/rodada-3 + v3@9cf7fce/bc0c17fd45f146e3d0e181c4c3121d25fc5f18c4366879ef2d0e30ca6becb578`.
3. `identity_source`: `repository + cycle + workflow + logical_target + source_revision`; plano local `v3`, HEAD e hash definidos nesta rodada; data é metadado.
4. `effect_class`: `local_mutation`.
5. `state_before`: ciclo `Planejamento`, plano `v3` em `Em Revisão`, respostas à rodada 2 presentes, rodada 3 pendente. `state_after`: ciclo `Planejamento`, plano `v3` em `Em Revisão`, revisão concluída, `APTO COM RESSALVAS`, aprovação humana `Pendente`.
6. `next_transition`: decisão sobre D1–D11 e ressalvas → aprovação humana específica pós-veredito → registro de `Aprovado` e publicação documental autorizada.
7. `preconditions`: decisões compatíveis com o desenho revisado; aprovação humana posterior a este parecer; tratamento/aceite das ressalvas; checks verdes antes da publicação/integração previstas no plano.
8. `authority`: responsável decide D1–D11, ressalvas e aprovação; executor reconcilia os documentos e verifica os checks. Parecer do revisor não satisfaz a aprovação.
9. `evidence`: pedido desta revisão, handoff da `v3`, respostas por achado, fontes/trechos e checks registrados; para avançar, manifestação humana posterior e rastreável, decisões escolhidas e diff documental validado.
10. `acceptance`: receptor reconhece 0 bloqueadores técnicos, 2 ressalvas e aprovação pendente; executa apenas a transição efetivamente autorizada, preservando o histórico e os gates de implementação por issue.
11. `blockers`: nenhum bloqueador técnico; decisão D1–D11 e aprovação humana pós-revisão são gates ainda pendentes.
12. `result`: `executed` — parecer formal registrado.
13. `next_workflow_recommended`: atualização/publicação documental do plano após aprovação; `criar_issues` somente após os gates e a apresentação do payload previstos no plano. `next_workflow_authorized`: nenhum efeito subsequente nesta revisão.
14. `actions_prohibited`: marcar `Aprovado`, corrigir o desenho, versionar/publicar, criar issues, implementar ou integrar PR sem as autorizações e precondições próprias.
15. `rejection_rule`: recusar handoff sem rodada 3/evidência, com conteúdo divergente ou que trate aptidão como aprovação humana.

- `logical_key`: igual ao `handoff_id` desta rodada.
- `check_before_mutation`: conferir versão, conteúdo, handoff da correção e inexistência de parecer equivalente antes do registro.
- `reconcile_existing`: reexecução da mesma revisão reutiliza este parecer; alteração material exige nova versão/parecer, preservando as rodadas anteriores.
- `ambiguous_state`: mudança concorrente, duplicidade ou autorização conflitante exige parada sem sobrescrita.

#### Próximo passo da rodada 3

```text
PRÓXIMO PASSO
Situação: Aguardando aprovação do plano — ciclo 002 (completo)
Quem: Responsável
Conferir: veredito da rodada 3, ressalvas R3-1/R3-2 e decisões D1–D11 do plano
Diga: "aprovo o plano do ciclo 002"
```

A frase de aprovação deve vir acompanhada das escolhas pendentes, ou confirmar explicitamente as recomendações do plano. Este bloco não registra que a aprovação já ocorreu.

## Pós-mortem

- **Data de conclusão:** —
- **Desvios:** —
- **Lições comprovadas:** —
