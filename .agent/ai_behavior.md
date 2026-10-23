# Comportamento canônico de agentes

## Finalidade

Este arquivo é a autoridade para comportamento, limites, autorizações, segurança e privacidade de agentes no `saldo-futuro`. Organização documental, ciclo de vida, níveis, situações e próximo passo, modo contínuo, trilha curta e barreiras de domínio pertencem a `_project/README.md`. Estado e numeração correntes pertencem a `_project/cycles.md`. O escopo executável pertence ao plano aprovado e à issue correspondente.

O Saldo Futuro é um sistema web de gestão de investimentos pessoais. Ele trata dados financeiros privados de vários usuários, e um erro de cálculo ou de isolamento é o pior defeito possível. Este contexto orienta toda decisão em caso de dúvida: na incerteza, prefira exatidão, isolamento e privacidade a conveniência.

## Ordem de leitura

1. Este arquivo por inteiro.
2. `_project/README.md` e `_project/cycles.md`.
3. O artefato ativo do trabalho (ideação, plano ou task), a issue relacionada e o bloco "Próximo passo" dele.
4. ADRs, KBs (a KB-003 é a primeira leitura sobre o produto), `design-system/DESIGN.md`, workflows, templates e skills relevantes.

Em conflito, preserve a instrução humana mais recente e explícita, não amplie o escopo e registre a divergência antes de prosseguir.

## Matriz de autoridade

| Fonte | Responsabilidade canônica | Limite |
| :-- | :-- | :-- |
| Instrução explícita do responsável | Autorizar e limitar o trabalho corrente | Não pode ser ampliada por inferência |
| `.agent/ai_behavior.md` | Comportamento, precedência, autorizações, handoff, segurança e privacidade | Não substitui a organização de `_project/` |
| `_project/README.md` | Ciclo de vida, níveis, situações, modo contínuo, nomenclatura, trilha curta, barreiras e glossário | Não autoriza implementação por si só |
| `_project/cycles.md` | Numeração e estado corrente dos ciclos | Não redefine regras |
| ADR local aceito (`_project/decisions/`) | Decisão duradoura | Não substitui plano executável |
| KB local (`_project/knowledge/`) | Conhecimento reutilizável e especificações de referência | Não autoriza mudança |
| `design-system/DESIGN.md` | Contrato visual e de interação | Não define regra de negócio |
| Plano aprovado | Escopo, entregas, riscos, sequência, pontos de aprovação e validações | Não amplia a autorização humana |
| Issue | Unidade planejada de entrega | Não amplia o plano |
| Task persistente | Registro local de execução e do próximo passo de uma unidade | Não coordena branches concorrentes |
| Workflows, skills e templates | Sequência operacional, auditoria especializada e estrutura | Não criam política concorrente |
| Validador e CI | Enforcement determinístico e somente leitura | Não são fonte normativa |
| Adapters (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`) | Descoberta do núcleo canônico | Não replicam política |
| GitHub | Issues, PRs, checks e estado externo | Não substitui plano ou autorização |
| Memória privada de ferramenta | Nenhuma | Não é fonte de regra nem de estado |

## Princípios agnósticos

- O estado do projeto e as regras vivem no repositório e no GitHub. Nenhuma regra depende de recurso de uma ferramenta específica.
- A instrução humana atual continua no topo da matriz. Se ela precisar valer além da sessão (autorização, restrição ou revogação), registre-a no artefato ativo antes de encerrar a saída.
- Se a ferramenta não tiver a capacidade que um passo exige (shell, `gh`, rede), a situação passa a "Parado". Não improvise.

## Contrato de handoff (versão 2)

Toda saída de workflow termina com o bloco "Próximo passo", copiado da tabela de situações de `_project/README.md`. Só workflows mutantes gravam o bloco, na seção `## Próximo passo` do artefato ativo; os somente leitura apenas o mostram. Workflows mutantes declaram também:

1. `handoff_schema_version: 2`.
2. `logical_key`: repositório + ciclo + workflow + alvo lógico + revisão de origem. Timestamp e UUID são metadados, nunca identidade.
3. `effect_class`: `read_only`, `local_mutation` ou `remote_mutation`.
4. `state_before` e `state_after`: estados observados e produzidos, sem inferir transições ausentes.
5. `result`: `executed`, `already_executed_and_reconciled`, `ambiguous_human_intervention_required` ou `not_executed`.
6. `evidence`: evidência verificável do resultado.
7. `blockers`: bloqueios atuais, inclusive `nenhum` quando verificado.

Regras universais, que nenhum artefato precisa repetir:

- **Recusa:** o receptor recusa handoff ausente, incompatível, contraditório ou sem evidência material.
- **Conferência antes de mutar:** localize pela `logical_key` o resultado existente antes de criar ou publicar.
- **Reconciliação:** uma reexecução compatível reutiliza o que existe e registra `already_executed_and_reconciled`; nunca duplica.
- **Estado ambíguo:** conflito, concorrência ou execução parcial sem estado comprovável produzem `ambiguous_human_intervention_required` e a situação "Parado", sem mutação destrutiva.
- **Ação limitada à situação:** o receptor executa somente o que a situação corrente e a autorização registrada permitem.
- **Sem encadeamento automático:** o handoff nunca aciona o workflow seguinte. A única exceção é o modo contínuo, dentro do escopo registrado e após o preflight de `_project/README.md`.

Workflows somente leitura usam saída reduzida (`context`, `findings`, `blockers`, `mutation: none`) e terminam com o bloco. Artefatos anteriores à versão 2 permanecem na versão 1 e estão listados no manifesto do validador.

**Exceção restrita ao backlog:** manutenção de conteúdo por `gerenciar_backlog` mostra o handoff versão 2 e o bloco somente na saída. `_project/backlog.md` guarda dados e referência à política, sem `## Próximo passo`, `## Handoff de saída` ou cabeçalho de versão de handoff. O pedido autorizado fica sintetizado no Registro do item; publicação e integração são comprovadas no GitHub. O backlog não substitui o artefato ativo do ciclo. Consultas ao backlog continuam somente leitura.

## Autorizações e pontos de aprovação

- Inspeção, análise ou diagnóstico autorizam somente leitura e os registros pedidos explicitamente.
- Toda demanda de trabalho começa pela triagem (`.agent/workflows/triar.md`). O agente propõe o nível e o responsável o confirma com uma frase de entrada de `_project/README.md`. A exceção de manutenção de conteúdo do backlog está delimitada abaixo.
- Redigir ou revisar plano não autoriza implementação. Todo plano passa pela revisão formal, e a correção da trilha curta passa pela revisão da correção.
- A aprovação do plano é uma manifestação humana posterior a um veredito apto. Uma manifestação anterior ao veredito não vale como aprovação.
- **Exceção delimitada:** no ciclo leve em modo contínuo, a autorização inicial cobre a promoção do plano, somente com veredito `APTO PARA APROVAÇÃO`. A promoção é registrada como `Coberta pelo modo contínuo`, nunca como `Aprovada em`.
- Implementação exige plano aprovado (ou issue `[FIX]` elegível, na trilha curta), issue e autorização explícita, ou o modo contínuo ativo dentro do escopo registrado.
- Cada merge exige checks verdes e "aprovo o merge da PR #N", sem exceção, inclusive no modo contínuo. Concedida a aprovação, o agente pode fazer o merge sem nova confirmação, depois de verificar as precondições.
- Ação humana externa, verificação em produção e decisões de regra financeira nunca são cobertas pelo modo contínuo.
- O encerramento é autorizado pela aprovação do plano e ocorre depois da integração das entregas, sem issue recursiva.
- **Concessão não é verificação:** uma concessão não dispensa a conferência da precondição. Quando faltar autorização material ou a precondição não puder ser verificada, pare na situação "Parado" com uma pergunta. Silêncio não é aprovação.

### Manutenção de conteúdo do backlog

- "Coloque no backlog" significa "quero guardar para decidir depois". Um pedido explícito e inequívoco autoriza sintetizar somente a necessidade solicitada e fazer seu commit local na fila canônica, após G3; não requer reconfirmação rotineira. Sugestões do agente não autorizam captura. Não autoriza entrega, prioridade, push, PR ou merge.
- Pedidos explícitos de editar, arquivar, combinar ou reabrir IDs autorizam somente a operação de conteúdo e seu commit local. Não precisam de ciclo ou issue. Mudanças das regras, template ou workflow seguem triagem e ciclo completo.
- "Publique as alterações do backlog" autoriza push e PR somente do lote apresentado e delimitado por commits, sem incluir alterações de outras conversas ou capturas posteriores. Cada merge continua exigindo aprovação específica e checks verdes.
- Selecionar IDs para um destino autoriza registrar o retorno dessa seleção no backlog somente depois de comprovar a integração do destino em main; a publicação desse retorno continua separada. Seleção não dispensa triagem, nível, escopo e frases de entrada.
- Conferir identidade, equivalência e estado antes de mutar. Reexecução compatível reutiliza ID, sem novo Registro, data ou commit. Ambiguidade, colisão ou privacidade não resolvida leva a "Parado" antes de gravar.

## Conduta de execução

- Inspecione o estado real antes de alterar arquivos, preserve mudanças alheias e mantenha cada entrega dentro do plano aprovado.
- Todo workflow que crie ou atualize um artefato estruturado nomeia e lê, no ponto de uso, o template e as autoridades aplicáveis. Template ausente ou incompatível bloqueia a execução.
- A nomenclatura de branch, commit, task e migração vem de `_project/README.md` no momento da criação.
- Crie a task persistente no início da implementação e atualize as evidências reais, as barreiras de domínio e o bloco "Próximo passo" durante o trabalho.
- Use uma branch por issue, commits intencionais e PR revisável; use o GitHub CLI (`gh`) para issues, PRs e checks e o Git local para branch, diff, stage, commit e push.
- Execute os gates locais definidos no plano antes de publicar.
- Nunca falsifique ideação, resultados, checks, aprovação ou conclusão.
- Não mova um ciclo para `executed/` fora do encerramento prospectivo de `_project/README.md`.

### Simplicidade primeiro

- Implemente a menor solução que atenda integralmente ao escopo, aos critérios de aceite e aos pontos de aprovação.
- Não adicione funcionalidade, abstração, flexibilidade, dependência ou arquitetura especulativa.
- Simplicidade não autoriza reduzir evidência, rastreabilidade, validação, barreiras de domínio ou governança obrigatória.
- Preserve as convenções e a estrutura existentes quando não conflitarem com as autoridades locais ou com o resultado aprovado.

### Mudanças cirúrgicas

- Altere somente arquivos e comportamentos rastreáveis à tarefa autorizada.
- Não refatore, reformate ou corrija elementos adjacentes sem autorização; relate problemas fora do escopo em vez de corrigi-los silenciosamente.
- Preserve mudanças preexistentes, revise o diff e use staging seletivo.
- Ao alterar uma regra de governança, consolide-a na autoridade semanticamente adequada e atualize somente os consumidores e controles necessários.

### Gestão de incertezas

- Explicite premissas, conflitos, limitações e trade-offs que possam afetar a decisão ou o resultado.
- Quando uma dúvida puder ser resolvida por inspeção local ou validação somente leitura, investigue antes de interromper o solicitante.
- Se interpretações diferentes alterarem materialmente o resultado, ampliarem o escopo ou exigirem nova autoridade, pare antes da mutação e solicite decisão.
- Em regra financeira, nunca escolha sozinho entre interpretações de cálculo: registre as alternativas com exemplos numéricos e peça decisão.
- Não invente arquivos, estados, dados, endpoints, URLs, integrações ou capacidades inexistentes; declare o que não puder ser verificado.

## Segurança e mudanças externas

- Nunca versione segredos, credenciais, tokens, chaves privadas ou valores reais de ambiente.
- Ações destrutivas, publicação, merge, deploy, mudanças em banco de produção e comunicação externa devem estar claramente dentro da autorização recebida.
- Não transforme recomendações externas em decisões locais sem plano ou ADR aprovado.
- Dependências entre repositórios devem ser documentais e fixadas por URL e commit; nenhum fluxo operacional pode depender de checkout irmão.

O worktree externo e exclusivo do backlog é uma segunda árvore do mesmo repositório Git, não uma dependência entre repositórios. Exige mesmo `git-common-dir` resolvido e registro em `git worktree list`; a localização externa, a fila única e a trava seguem `_project/README.md`. Não copiar dados ignorados nem usar outro clone como fila.

## Privacidade de dados financeiros

O repositório é público desde 2026-10-22 (ADR-003, emenda do ciclo `011`). O histórico do Git é permanente: um dado que entra em qualquer commit deve ser tratado como publicado.

- **Dados do usuário** são: valores, saldos, quantidades, posições, nomes dos ativos que ele detém, instituições onde mantém contas, e-mails e prints de telas com dados reais.
- Dados do usuário nunca aparecem em issues, PRs, tasks, commits, comentários, logs, prints, fixtures, seeds ou mensagens a ferramentas externas.
- São permitidos: índices e benchmarks públicos (CDI, Selic, IPCA, Ibovespa), códigos de séries do SGS, classes genéricas de ativo e nomes fictícios em exemplos e fixtures.
- Dados reais de trabalho local ficam somente em `local/`, ignorado pelo Git. Ao ler esses dados para uma tarefa autorizada, não os reproduza em respostas, documentos ou evidências; relate apenas contagens, totais verificados quando pedidos e resultados de validação.
- Previews e ambientes de teste nunca usam dados reais.
- Na dúvida sobre se um valor é dado do usuário, trate-o como dado do usuário.

Na captura do backlog, G3 é conferida **antes de qualquer gravação** e novamente antes de cada commit e publicação. Abstrair a necessidade sem valores, posições, ativos detidos, instituições, e-mails ou prints reais. Se a abstração não puder ser feita com segurança, esclarecer antes de escrever; não guardar a conversa bruta como contexto.

As regras de enforcement desta política (barreira G3) estão em `_project/README.md`.

## Aprendizado

Registre em `.agent/lessons_learned.md` somente lições comprovadas, reutilizáveis e desvinculadas de estado transitório. Estado operacional pertence às tasks e ao GitHub.
