# Ideação — 002: reforma da governança

> **Ciclo:** `002`
> **Estado:** `Ideação`
> **Criado em:** 2026-10-13
> **Última atualização:** 2026-10-13

## Problema

A governança implantada no ciclo `000` cumpriu sua finalidade nos ciclos `000` e `001`: nenhum dado do usuário vazou, o isolamento por RLS foi provado e nenhuma transição saltou a revisão. Mas ela ficou pesada e difícil de ler para o tamanho do projeto, e o responsável relatou não entender parte dela. O objetivo é equilibrar três necessidades:

- **contexto para a LLM:** qualquer agente, em qualquer ferramenta, sabe o que fazer a partir do repositório;
- **documentação saudável para o humano:** o responsável entende o produto e o processo sem decifrar códigos;
- **governança que sincronize os dois:** regras verificáveis, proporcionais ao risco e sem fatos duplicados.

Os sintomas observados:

- siglas de gate (X-A, M-A, H-C, V-C…) que não estão definidas em nenhum documento canônico;
- o mesmo rito completo para qualquer tamanho de entrega;
- conhecimento do produto preso em planos executados, sem documentação viva da arquitetura;
- próximo passo descrito de forma livre, interpretado de modo diferente por cada agente.

O ciclo `003` (regras financeiras, barreira G1) é o mais sensível do projeto e deve começar sob a governança já reformada.

## Contexto e evidências

Fatos verificados em `main` @ `9cf7fce`:

- **Siglas sem definição.** `.agent/ai_behavior.md` e `_project/README.md` não definem gates nomeados. O template `.agent/templates/plano_implementacao.md` exige uma tabela "Gates humanos" e "Cada merge tem gate próprio" (linha 31). O plano do ciclo `001` criou 14 gates com códigos próprios: R, P, X-A, M-A, X-B, M-B, X-C, H-C, M-C, V-C, X-F, M-F, M-R e E. Também há duas famílias com nomes parecidos: as barreiras G1–G4 e os gates de letras.
- **Volume de cerimônia.** O ciclo `001` integrou 8 PRs: 3 de código (#11, #12, #16), 3 só de documentação (#7, #17, #18), 1 de release (#13) e 1 de correção (#15). Os planos executados têm 710 (`000`) e 704 (`001`) linhas.
- **Handoff repetido.** O contrato de handoff de `.agent/ai_behavior.md` tem 15 campos, mais 4 para workflows mutantes. Ele aparece copiado, com cerca de 20 linhas, em 22 arquivos: todos os templates, workflows, planos, tasks e ideações.
- **Documentação viva do produto ausente.** O `README.md` da raiz cobre estado, mapa de ciclos, stack, ambiente local, governança e privacidade, mas não explica como o produto funciona (schema, autenticação, perfis, RLS). Esse conhecimento está no plano executado do `001`, na KB-002 (operação), na ADR-002 e na ADR-003.
- **Agnosticismo já decidido.** A ADR-001 define `.agent/` e `_project/` como núcleo independente de ferramenta, com adapters mínimos para Codex (`AGENTS.md`), Claude Code (`CLAUDE.md`) e Gemini CLI (`GEMINI.md`). O Antigravity não está na ADR-001.
- **O rigor tem origem em falhas reais** (`.agent/lessons_learned.md`):
  - 2026-08-13: aprovação do rascunho tratada como aprovação final;
  - 2026-08-17: handoff estável precisa sobreviver à reexecução;
  - 2026-08-19: encerramentos exigem reconciliação pós-merge;
  - 2026-10-13: merge do Gate M-C feito sem que a precondição (H-C) estivesse verificada.
- **Trilha curta como precedente.** `_project/README.md` já tem um fluxo reduzido para correções, com critérios objetivos de elegibilidade e a regra "se deixar de ser atendido, pare e siga o fluxo normal".
- **Renumeração afeta documentos vivos.** Com a governança no `002`, o mapa passa a ser `003` regras financeiras, `004` telas e `005` migração. Há referências aos números antigos em:
  - `README.md` (linhas 9 e 17–21);
  - `_project/README.md` (linhas 143 e 182);
  - ADR-002 (linhas 39, 58, 60 e 73);
  - ADR-003 (linha 72);
  - KB-001 (linhas 17, 71 e 114);
  - `design-system/DESIGN.md` (linhas 8, 96 e 266).

  Artefatos históricos, como `_project/ideations/001_fundacao_aplicacao.md` e os planos executados, também citam "ciclo `002`" com o sentido antigo.
- **Memória fora do repositório.** As memórias privadas de ferramenta conferidas nesta conversa não guardam regra ausente do repositório: a regra de merge está em `.agent/ai_behavior.md` e o modo de teste do Google está na KB-002.

Evidências ausentes, a confirmar no rascunho do plano:

- arquivo de instruções e sintaxe de import lidos pelo Antigravity, na documentação oficial;
- se os adapters existentes continuam válidos nas versões atuais de Codex, Claude Code e Gemini CLI (a ADR-001 exige revalidar ao alterar adapter).

## Resultado desejado

Ao fim do ciclo:

- **Três níveis por risco.** Trilha curta, ciclo leve e ciclo completo, escolhidos por uma triagem objetiva.
- **Cinco pontos de aprovação com nomes claros,** iguais em todos os níveis: autorizar (correção, ideação ou implementação), aprovar plano, aprovar merge, ação humana externa e verificar produção. Um glossário explica as siglas antigas para quem ler o histórico.
- **Próximo passo predefinido.** Toda saída de workflow termina com um bloco fixo, copiado de uma lista fechada de situações, que diz ao responsável a situação, quem age, o que conferir e a frase exata para pedir.
- **Modo contínuo** para trilha curta e ciclo leve: uma autorização cobre da ideação até a PR, com paradas obrigatórias, retomada depois de cada merge e estado gravado na task.
- **Revisão formal por progresso,** com revisor que pode ser outra ferramenta ou modelo.
- **Documentação viva:** visão do produto e da arquitetura escrita a partir do ciclo `001`, atualizada a cada encerramento, com o histórico em `executed/` consultado só sob demanda.
- **Handoff reduzido** ao bloco de próximo passo mais os campos mínimos de identidade e reconciliação, referenciado em vez de copiado.
- **Regras verificáveis no validador,** com a prosa explicando o porquê.
- **Nenhum controle atual perdido sem justificativa,** demonstrado por uma tabela de destino de cada controle e lição.
- **Mapa de ciclos renumerado** e governança utilizável por qualquer ferramenta agêntica, com adapter para cada ferramenta usada.

## Hipóteses

- **H1 — A triagem objetiva basta.** A pergunta "toca cálculo financeiro (G1), RLS ou autenticação (G2), ou o significado do schema?" separa ciclo completo de ciclo leve sem julgamento subjetivo, e o critério de elegibilidade da trilha curta continua como está.
- **H2 — Cinco pontos de aprovação cobrem os 14 gates do ciclo `001`:**
  - R e P → aprovar plano;
  - X-A, X-B e X-C → autorizar implementação;
  - M-A, M-B, M-C, M-F e M-R → aprovar merge;
  - H-C → ação humana externa;
  - V-C → verificar produção;
  - X-F → autorizar correção;
  - E → coberto pela aprovação do plano e pelo merge da PR de encerramento.

  A ser confirmado com a tabela de destino dos controles.
- **H3 — Uma lista de 12 a 15 situações cobre os três níveis.** Inclui a situação "Parado", com formato fixo e pergunta livre, para o imprevisto.
- **H4 — O bloco de próximo passo substitui a parte humana do handoff.** Os campos de identidade lógica, efeito, estado antes e depois, resultado e reconciliação continuam, preservando a lição de 2026-08-17.
- **H5 — O modo contínuo é seguro se terminar na PR.** O merge continua humano, e as paradas obrigatórias cobrem os casos de risco.
- **H6 — O estado da cadeia na task permite retomada agnóstica.** Qualquer agente lê a task, confere no GitHub e continua, sem depender da sessão.
- **H7 — O validador consegue verificar:**
  - situação da task pertencente à lista;
  - formato do bloco de próximo passo;
  - nível do ciclo declarado;
  - formato das rodadas de revisão.
- **H8 — O ciclo é divisível em três entregas revisáveis:**
  - (A) regras canônicas, templates, workflows, adapters, glossário e renumeração;
  - (B) validador e testes;
  - (C) visão do produto e da arquitetura.

  A e B podem precisar andar juntas para manter o CI verde.

## Alternativas

### Fatiamento da reforma

| Alternativa | Vantagem | Custo ou risco |
| :-- | :-- | :-- |
| Um ciclo com todas as frentes | Uma cerimônia; arquivos reescritos uma vez; o `003` começa com a governança nova | Mudança grande, exige tabela de destino dos controles |
| Ciclos por frente (nomes, níveis, docs vivos, handoff, validador) | Mudanças menores | Cinco cerimônias completas; os mesmos arquivos reescritos várias vezes; o `003` rodaria com governança pela metade |

### Local da visão do produto e da arquitetura

| Alternativa | Vantagem | Custo ou risco |
| :-- | :-- | :-- |
| Nova KB em `_project/knowledge/` | Segue a estrutura e a autoridade existentes | KB hoje é "conhecimento reutilizável", não visão geral |
| Documento próprio na raiz ou em `docs/` | Fácil de achar para humanos | Nova autoridade a declarar na matriz |
| Seção ampliada do `README.md` | Ponto de entrada único | `README.md` cresce e mistura apresentação com arquitetura |

### Local da lista de situações e do próximo passo

| Alternativa | Vantagem | Custo ou risco |
| :-- | :-- | :-- |
| `_project/README.md`, junto do ciclo de vida | Mesma autoridade dos estados e transições | Arquivo já longo |
| Arquivo dedicado referenciado pelo `README.md` | Fácil de consultar e validar | Mais um arquivo na ordem de leitura |

### Referências aos números antigos de ciclo

| Alternativa | Vantagem | Custo ou risco |
| :-- | :-- | :-- |
| Atualizar as referências em documentos vivos (README, ADRs, KBs, `DESIGN.md`) e preservar o histórico com nota no glossário | Documentos vivos corretos; histórico intacto | ADRs aceitas recebem edição factual |
| Manter tudo e só registrar o mapeamento | Nenhuma edição em ADR | Documentos vivos ficam com números errados |

## Riscos e restrições

- **Perda de controle sem perceber.** Várias regras nasceram de falhas concretas. Mitigação: tabela de destino (mantido, movido ao validador, fundido ou removido com justificativa) para cada controle e cada lição, conferida na revisão formal.
- **Transição de regime.** O ciclo `002` começa sob a governança atual. É preciso definir se as regras novas valem para o restante do próprio ciclo a partir do merge da primeira entrega, ou só depois do encerramento. A ambiguidade pode gerar handoffs incompatíveis no meio do ciclo.
- **CI vermelho no meio do caminho.** Mudar templates e workflows sem ajustar o validador e o manifesto pode reprovar os checks.
- **Modo contínuo com autorização vencida ou ampla demais.** Mitigação: escopo e data registrados na task, paradas obrigatórias e verificação de precondição pelo próprio agente (lição de 2026-10-13).
- **Lista de situações que cresce até virar burocracia.** Se passar muito de 15 situações, o desenho deve ser revisto.
- **Comportamento desigual entre ferramentas.** A ADR-001 já registra que descoberta equivalente não garante execução idêntica. O bloco fixo e o validador reduzem, mas não eliminam, a diferença.
- **Confusão de numeração no histórico.** Artefatos executados citam "ciclo `002`" com o sentido de regras financeiras.
- **Privacidade (G3).** A visão do produto e da arquitetura descreve schema, perfis e RLS, mas não pode conter dados do usuário, e-mails reais ou prints com dados.
- **Escopo.** Há a tentação de alterar a semântica das barreiras G1–G4, o código da aplicação ou o CI além do necessário ao validador.
- **Barreiras de domínio previstas:**
  - G1: não se aplica (sem regra de cálculo);
  - G2: não se aplica (sem migração nem política), embora a visão descreva o RLS existente;
  - G3: aplica-se aos documentos;
  - G4: não se aplica (sem migração).

## Perguntas em aberto

### Decisões do responsável

Registradas em 2026-10-13, na conversa que originou esta ideação. Elas orientam o rascunho do plano e não autorizam implementação.

1. **Reforma completa num único ciclo,** agora, antes das regras financeiras, com tabela de destino de cada controle e lição atual. Fases separadas ficam rejeitadas.
2. **Numeração:** governança no ciclo `002` e regras financeiras no `003`. Consequentemente, telas no `004` e migração no `005`.
3. **Três níveis por triagem objetiva:**
   - completo se tocar G1, G2 ou o significado do schema, ou em caso de dúvida;
   - o agente propõe o nível e o responsável confirma;
   - o nível só sobe, nunca desce.
4. **Cinco pontos de aprovação com nomes claros,** os mesmos em todos os níveis, mais um glossário das siglas antigas.
5. **Revisão formal obrigatória em todos os níveis, inclusive no leve,** porque a revisão encontra problemas que o autor não viu.
6. **Um merge aprovado por PR,** como hoje. No ciclo completo, "aprovar plano" inclui o merge da PR documental do plano, como o Gate P atual. No ciclo leve, o plano vai sempre na primeira PR do ciclo, sem PR documental própria, e a última PR atualiza a documentação viva e encerra o ciclo.
7. **Visão do produto e da arquitetura** escrita neste ciclo, a partir do ciclo `001`. A documentação viva é consolidada a cada encerramento e o histórico fica só para consulta.
8. **Modo contínuo para trilha curta e ciclo leve,** proibido no ciclo completo:
   - uma autorização cobre da ideação, ou da issue `[FIX]`, até a PR;
   - cada merge continua com o responsável, e a cadeia retoma depois de cada merge;
   - paradas obrigatórias: mudança de nível; revisão sem progresso; veredito com ressalvas; dúvida de escopo, interpretação ou privacidade; dependência nova; checks persistentemente falhos; precondição não verificável pelo agente.
9. **Rodadas de revisão por progresso:**
   - continua enquanto os bloqueios caírem e nenhum achado corrigido voltar;
   - discordância não resolvida entre autor e revisor para a cadeia;
   - 2 rodadas é a expectativa normal e 5 é o teto de segurança.
10. **Revisão por outra ferramenta ou modelo é permitida e recomendada, não obrigatória, em qualquer nível:**
    - o revisor só escreve na seção de revisão (achados, veredito, `Autor:` e `Revisor:`), não aprova nem reescreve o plano;
    - a vez de cada agente é indicada pela situação gravada na task, e o responsável leva a vez de uma ferramenta a outra.
11. **Governança agnóstica:**
    - o repositório e o GitHub são a única memória do projeto;
    - nenhuma regra depende de recurso de uma ferramenta específica;
    - falta de capacidade de uma ferramenta vira parada registrada;
    - adapter para cada ferramenta usada, incluindo o Antigravity após verificação na documentação oficial.
12. **Próximo passo predefinido e não interpretativo:**
    - toda saída de workflow termina com um bloco fixo (situação, quem age, o que conferir, frase exata), copiado de uma lista fechada de situações;
    - o mesmo bloco fica gravado na task;
    - o validador confere a situação e o formato;
    - as frases de aprovação são fixas, para que a aprovação seja inequívoca em qualquer ferramenta.

### Questões que o rascunho deve propor e levar ao responsável

- Local da visão do produto e da arquitetura e da lista de situações (ver "Alternativas").
- Se o ciclo completo mantém um ponto de autorização entre a ideação e o rascunho do plano, como hoje.
- Momento em que as regras novas passam a valer para o próprio ciclo `002`.
- Tratamento das referências a números antigos em ADRs aceitas.
- Se as entregas A e B (H8) formam uma única PR.
- Lista final de situações e frases fixas, e o formato reduzido do handoff.

### Verificações técnicas pendentes

- Arquivo de instruções e sintaxe de import do Antigravity.
- Revalidação dos adapters de Codex, Claude Code e Gemini CLI.

Se alguma verificação invalidar uma decisão, o rascunho registra a divergência e a leva de volta ao responsável.

## Fora do escopo

- Código da aplicação, migrações, políticas RLS e configuração de produção.
- Mudança na semântica das barreiras G1–G4. Elas podem ser renomeadas ou reorganizadas no texto, mas não afrouxadas.
- Regras financeiras e a KB de regras financeiras (ciclo `003`).
- Reescrita de artefatos históricos em `_project/executed/` e `_project/ideations/001_fundacao_aplicacao.md`, além de notas de mapeamento se o plano decidir por elas.
- Automação que faça uma ferramenta invocar outra (por exemplo, por linha de comando). Isso pode existir como detalhe de adapter, mas a governança não depende dela.
- Mudanças no release-please e no CI além do necessário para o validador.
- Publicação da tela de consentimento do Google.

## Critérios para iniciar o planejamento

- Decisões 1 a 12 registradas pelo responsável: atendido em 2026-10-13 (seção "Decisões do responsável").
- Autorização explícita para executar `rascunhar_plano` no ciclo `002`.
- Ideação mantida local até o plano, como no ciclo `001`, sem divergência com `_project/cycles.md`.

## Handoff de saída

- `handoff_schema_version`: `1`
- `handoff_id`: `saldo-futuro + 002 + idear + reforma_governanca + 9cf7fce`
- `identity_source`: `repository + cycle + workflow + logical_target + source_revision`; timestamp e UUID não definem a identidade.
- `effect_class`: `local_mutation`
- `state_before` / `state_after`: antes, `cycles.md` com próximo ciclo `002` sem reserva e sem ideação; depois, ciclo `002` em `Ideação` com este arquivo e próximo ciclo `003`.
- `next_transition`: `ideia -> rascunho de plano`, somente após decisão humana.
- `preconditions`: decisões 1 a 12 registradas (atendido); autorização para `rascunhar_plano`.
- `authority`: o responsável (Thiago Andrade).
- `evidence`: este arquivo, `_project/cycles.md`, `.agent/ai_behavior.md`, `_project/README.md`, `.agent/templates/plano_implementacao.md`, `.agent/lessons_learned.md`, ADR-001, plano executado do ciclo `001` e PRs #7 a #18 em `9cf7fce`; validador de governança verde.
- `acceptance`: fatos, hipóteses, alternativas, riscos e perguntas separados; nenhum plano, issue ou alteração de governança criados.
- `blockers`: autorização para `rascunhar_plano`. As verificações técnicas pendentes não bloqueiam o rascunho, mas podem reabrir a decisão 11.
- `result`: `executed`
- `next_workflow_recommended` / `next_workflow_authorized`: `rascunhar_plano` / nenhum.
- `actions_prohibited`: rascunhar ou aprovar plano, criar issue, alterar regras de governança, publicar PR ou integrar PR sem autorização própria.
- `rejection_rule`: o receptor recusa handoff ausente, incompatível, contraditório ou sem evidência material.
- `logical_key`: `saldo-futuro + 002 + idear + reforma_governanca + 9cf7fce`.
- `check_before_mutation`: verificar artefato e reserva de ciclo existentes antes de criar.
- `reconcile_existing`: atualizar a ideação compatível sem duplicar ciclo ou arquivo.
- `ambiguous_state`: parar quando identidade, ciclo ou revisão estiverem em conflito.
