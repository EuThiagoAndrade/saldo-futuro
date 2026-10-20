# Plano de Implementação — Backlog de possibilidades e entrada nos ciclos

> **Ciclo:** `007`
> **Status:** `Concluído`
> **Versão:** `v3`
> **Data de criação:** 2026-10-19
> **Última atualização:** 2026-10-19
> **Tipo:** `chore`
> **Prioridade:** `P2` (proposta do autor)
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 007" em 2026-10-19
> **Autorização do rascunho:** "autorizo o rascunho do plano do ciclo 007" em 2026-10-19
> **Autorização da correção:** "corrija o plano do ciclo 007" em 2026-10-19
> **Autor da correção:** Codex (GPT-6; variante não identificada no contexto)
> **Modo contínuo:** `—`
> **Revisão formal:** `Concluída` (v3, rodada 3); rodada 2 sobre a `v2`, rodada 1 sobre a `v1`
> **Veredito da revisão:** `APTO COM RESSALVAS` (rodada 3, `v3`); `REQUER NOVA RODADA` nas rodadas 2 (`v2`) e 1 (`v1`)
> **Aprovação humana pós-revisão:** `Aprovada em 2026-10-19`
> **handoff_schema_version:** `2`

## Problema e contexto

Ideação: _project/ideations/007_backlog_possibilidades.md

## Objetivo

Instituir um backlog documental para preservar possibilidades por solicitação do responsável, com IDs estáveis e contexto suficiente para decisão futura, permitindo selecionar itens como insumo da triagem e dos ciclos existentes.

O acordo confirmado é: **"coloque no backlog" significa "quero guardar para decidir depois"**. Incluir não estabelece prioridade, compromisso de entrega, aprovação de solução ou autorização de implementação.

## Contexto e baseline

- Repositório `EuThiagoAndrade/saldo-futuro`, revisão de origem `1d2f36773b7d90a269be5f27dbbcc85e3ca10672`.
- Na entrada deste workflow, a branch era `chore/cycle-007-ideation`; existiam somente as alterações locais da etapa anterior: `_project/cycles.md` modificado e a ideação 007 ainda não versionada. Essas alterações foram preservadas na branch documental `chore/cycle-007-plan`.
- O registro local declarava ciclo 007 em `Ideação`, sem plano, issues ou encerramento, e próximo ciclo `008`. Não havia segundo plano nem branch local de planejamento 007.
- A estrutura de `_project/README.md` não inclui backlog. A regra vigente exige triagem para toda demanda, e o alvo de handoff só admite ciclos e correções. O novo artefato exige uma exceção explícita para manutenção documental, com alcance definido.
- Workflows, templates, manifesto e validador já distinguem autorização, estado e resultado. O validador confere blocos e fontes por manifesto; seus testes criam fixtures temporárias. Esses mecanismos serão estendidos, sem dependência nova.
- A KB-003 foi consultada para distinguir o processo do produto. Não há alteração funcional, visual, financeira, de banco ou infraestrutura neste escopo.
- Não foram consultados GitHub ou produção nesta etapa; números de issues, URLs de PRs e checks remotos permanecem desconhecidos. Os testes deste rascunho validam a documentação atual, não antecipam o funcionamento do backlog ainda inexistente.
- Correção autorizada em 2026-10-19 após a rodada 1: o plano estava em `Em Revisão`, com veredito `REQUER NOVA RODADA` sobre a v1. A v2 responde a R1-1 a R1-5, preserva integralmente o parecer e não emite novo veredito.
- Nova correção autorizada em 2026-10-19 após a rodada 2: v3 responde a R2-1 a R2-3, mantendo Em Revisão e o último veredito sobre a v2. Somente o plano é alterado; as configurações de ESLint/TypeScript foram inspecionadas, mas não serão alteradas por esta solução.

## Escopo

### Dentro do escopo

- Definir nas autoridades canônicas o papel do backlog, captura autorizada, manutenção, publicação e passagem pela triagem.
- Criar `_project/backlog.md`, inicialmente sem itens, e um template curto de item.
- Adotar IDs permanentes e estados próprios, distintos dos estados de ciclo, plano, task e issue.
- Criar um workflow textual único de manutenção e publicação do backlog, independente de ferramenta.
- Integrar seleção por IDs à triagem e vinculação aos artefatos consumidores do completo, leve e trilha curta.
- Estender o contrato de handoff apenas para operar o backlog e ajustar manifesto, validador e testes necessários.
- Harmonizar o texto de `_project/README.md` sobre a publicação documental do ciclo completo: aprovação do plano autoriza preparar/publicar a PR, e cada merge, inclusive o documental, exige aprovação própria.
- Documentar exemplos de uso e consolidar a decisão na documentação viva, preservando o histórico dos ciclos anteriores.

### Fora do escopo

- Tela, API, tabela ou integração de backlog no produto; mudanças em `src/`, `supabase/`, dependências ou design system.
- GitHub Projects, sincronização entre serviços, scheduler, pontuação de prioridade ou estimativa obrigatória.
- Criar itens reais a partir de exemplos, achados ou pendências históricas sem pedido específico do responsável.
- Alterar critérios dos três níveis, dispensar revisão de planos, autorizar entregas pela inclusão de itens ou relaxar aprovação de merge.
- Criar um sistema distribuído de alocação de IDs ou uma automação executora de workflows.
- Detecção automática de ciclos de combinação, reciprocidade semântica de vínculos, travessia de caminhos, migração de links entre diretórios e mudanças na KB-003; controles adicionais ficam para necessidade comprovada.
- Implementar qualquer proposta nesta autorização de rascunho; criar issue, commit, push, PR ou merge nesta etapa.

## Decisões e autoridades

### Situação das decisões

Somente o propósito do backlog e a seleção futura por IDs foram confirmados pelo responsável. As escolhas P1 a P6 abaixo são **propostas deste rascunho**, respondendo às seis perguntas da ideação. Não entram em vigor com a redação ou com a revisão. A aprovação humana posterior ao veredito apto deverá considerar expressamente esse contrato no plano; uma discordância será tratada por ajuste antes da implementação.

| Fonte | Responsabilidade neste ciclo |
| :-- | :-- |
| Instruções do responsável | Significado da inclusão e autorizações de cada etapa |
| `.agent/ai_behavior.md` | Limites da captura, publicação, handoff e exceção de manutenção documental |
| `_project/README.md` | Formato, identidade, estados, transições, operação e entrada nos níveis |
| `_project/backlog.md` (a criar) | Estado e conteúdo dos itens; não contém política concorrente |
| `_project/cycles.md` | Estado e numeração dos ciclos; não aloca IDs do backlog |
| ADR-001 e ADR-004 | Núcleo independente de ferramenta e proporcionalidade do processo |
| Workflows, templates e validador | Consumidores e verificações das regras aprovadas |
| Plano, task, issue e GitHub | Escopo de entrega, execução e estado externo, sem duplicação no backlog |

### P1 — Arquivo e identidade

- Adotar a alternativa A da ideação: um arquivo `_project/backlog.md`, com uma seção por item e instrução curta apontando para `_project/README.md`.
- IDs seguem `BL-001`, `BL-002` etc., com no mínimo três dígitos e crescimento além de 999 sem mudar os anteriores. O número é independente de ciclos e issues.
- Alocar o próximo inteiro após o maior ID presente, incluindo itens arquivados. O arquivo vazio começa em `BL-001`; não manter um segundo contador.
- Não renumerar, apagar ou reutilizar IDs. Arquivar preserva a seção e a referência; combinar itens preserva os IDs de origem e aponta para o item que concentra a necessidade.
- Toda alocação lê exclusivamente o arquivo da fila canônica local de P4, nunca a cópia da branch de issue/ciclo corrente. A fila reúne a base integrada e todas as capturas locais ainda não publicadas. Reler sob a trava local antes de escolher o próximo número e reconciliar pedido repetido.
- Antes de habilitar uma fila nova, conferir a base integrada e eventual branch/PR de publicação de backlog já existente no GitHub. Reutilizar o lote existente; não criar uma segunda fila. A fila local usa `chore/backlog`, e as branches remotas de lote seguem P4. Em outros clones ou máquinas, captura com ID definitivo depende de atualizar a fila canônica; não prometer alocação global offline. Colisão externa real ou origem não comprovável leva a parada, sem renumerar ID já comunicado.

### P2 — Conteúdo mínimo

Template proposto para cada item:

| Campo | Regra |
| :-- | :-- |
| ID e título | Cabeçalho estável com título curto |
| Criado em / Atualizado em | Datas civis `AAAA-MM-DD` |
| Estado | Um dos três estados de P3 |
| Problema e benefício esperado | Necessidade autossuficiente; uma descrição curta pode reunir ambos |
| Contexto | Sugestões, dúvidas e origem resumida; `—` quando não houver detalhe adicional |
| Encaminhamentos | `—` ou lista de destinos, data e parcela encaminhada |
| Restante | Necessidade ainda disponível; `—` se não houver encaminhamento parcial |
| Registro | Pedido humano e síntese de alterações de conteúdo/estado, com data; sem transcrição integral do chat |

Prioridade e estimativa não são obrigatórias e não têm escala automatizada neste ciclo. O responsável pode acrescentar uma observação de prioridade no contexto. Soluções sugeridas ficam identificadas como sugestões. Não exigir critério de aceite de implementação para capturar uma possibilidade.

### P3 — Estados e transições

| Estado | Significado | Entrada ou saída permitida |
| :-- | :-- | :-- |
| `Disponível` | Pode ser selecionado para decisão; pode conter parte ainda não encaminhada | Estado inicial; permanece assim em encaminhamento parcial, com `Restante` explícito |
| `Encaminhado` | Toda a necessidade registrada foi atribuída a um ou mais destinos concretos | Somente após existir o artefato de destino e ficar identificada a cobertura da necessidade |
| `Arquivado` | Retirado de consideração por decisão do responsável | Exige motivo; pode apontar para item equivalente ou combinação |

- A triagem somente lê e propõe encaminhamento; não muda o estado do item.
- Criar a ideação do completo, o plano do leve ou a task da curta registra ali os IDs e a parcela selecionada. O vínculo de retorno no backlog é uma atualização local da fila canônica, coberta pelo pedido explícito de seleção, realizada após verificar a integração do destino em `main`. Antes disso, o item permanece disponível e a resposta informa que o destino ainda está em preparação; não declarar encaminhamento integrado.
- No completo, o plano herda as referências da ideação e pode ser acrescentado ao mesmo encaminhamento; não é uma segunda entrega nem muda a cobertura por si só.
- `Encaminhado` não equivale a entregue. O backlog não replica status de issues, checks ou percentual de execução, e não recebe estado `Concluído` para seus itens.
- Um ciclo cancelado ou substituído não reabre o item automaticamente. A consulta aponta o fato verificável e o responsável decide reabrir, redirecionar ou arquivar; registrar essa decisão sem apagar o destino anterior.
- Reabrir um item `Arquivado` ou `Encaminhado` exige pedido explícito e identificação da necessidade que volta a ficar disponível. Corrigir texto não autoriza ampliar o escopo de um ciclo vinculado.

### P4 — Captura, manutenção e publicação

**Exceção proposta:** registrar, editar, arquivar, combinar ou reabrir possibilidades, sem mudar as regras do backlog, é manutenção documental por solicitação direta. Não exige novo ciclo, plano ou issue. Essa exceção deve ser escrita em `.agent/ai_behavior.md` e organizada em `_project/README.md`; não é invocável antes da integração deste ciclo.

- "Coloque no backlog" com conteúdo inequívoco autoriza a captura, a síntese necessária e um commit **somente local** em `chore/backlog`, sem segunda confirmação rotineira. Pedidos de alteração e arquivamento autorizam somente os IDs e o conteúdo indicados, com o respectivo commit local. Não autoriza push ou PR. Achados ou sugestões do agente não são capturados por iniciativa própria. Essa cobertura precisa ser explicitada nas autoridades e no workflow após a aprovação do plano; não autoriza commitar este plano agora.
- Se faltar a identificação do que deve ser guardado, perguntar antes da mutação. Se o pedido repetir uma captura existente, retornar o ID e reconciliar sem duplicar. Semelhança entre ideias diferentes não autoriza combinação automática.
- Antes de qualquer gravação, inclusive captura local, produzir uma síntese abstrata e conferir G3: não reproduzir valores, quantidades, ativos detidos, instituições, e-mails, prints ou outros dados privados da conversa. Se não for possível expressar a necessidade sem esses dados, pedir uma formulação abstrata antes de gravar. Essa conferência não exige confirmação adicional quando a síntese já é adequada.
- Criar `.agent/workflows/gerenciar_backlog.md`, com caminhos delimitados para captura/manutenção local, publicação e observação de merge. Consultas são somente leitura; não atualizam datas ou estados silenciosamente.

#### Fila canônica local e captura durante outro trabalho

1. Identificar o checkout principal e os worktrees pelo Git (`git worktree list --porcelain`). Localizar o único worktree da branch `chore/backlog`. Se não existir, criá-lo **fora da árvore de qualquer checkout**, em um diretório irmão do principal cujo nome seja `<nome-do-checkout-principal>-backlog`, a partir da base integrada conferida mais o lote remoto pendente, se houver. Resolver o caminho absoluto e conferir que não fica dentro de um checkout ou de seus diretórios por junction/symlink. A inicialização está coberta pelo pedido de captura local; não faz push ou PR.
2. Se já houver worktree dessa branch em outro caminho externo seguro, usá-lo; não criar uma segunda cópia. Conferir que `git rev-parse --git-common-dir`, resolvido em ambos os checkouts, aponta para o **mesmo diretório Git**, e que `git worktree list` registra a ligação. Diretório ocupado por conteúdo não reconhecido, worktree interno, outro repositório, branch incompatível ou lote remoto divergente impedem a mutação. Nunca sobrescrever, resetar ou apagar conteúdo para preparar a fila.
3. Serializar as operações sobre a fila com uma trava local exclusiva em `local/backlog.lock/` do checkout principal, criada atomicamente antes da leitura/alocação e liberada ao final. Trava de outra sessão exige aguardar sua liberação; trava abandonada ou titularidade incerta exige reconciliação, sem remoção automática. A trava é operacional, não é identidade ou fonte normativa.
4. Ler e escrever somente `_project/backlog.md` nesse worktree. Sob a trava, conferir G3 e o diff e fazer commit local `docs(backlog): <operação e IDs>` com staging seletivo apenas desse arquivo, antes de devolver o ID e liberar a trava. Todas as sessões alocam a partir desse arquivo com os commits ainda não publicados e o lote já publicado mas não integrado. Captura nova não troca a branch corrente, não altera seu índice e não entra na PR de uma issue ou ciclo em andamento. Reexecução sem mudança não cria commit vazio. Worktree com mudanças desconhecidas ou falha no commit exige reconciliação; não commitar ou descartar conteúdo alheio.
5. Conservar as capturas como commits locais sem push; uma PR aberta continua apontando somente para o último lote publicado. Na publicação, conferir a base remota e o intervalo de commits apresentado. Avançar por fast-forward quando possível, sem perder commits locais. Mudança concorrente no remoto ou histórico não comprovável exige parada antes de reescrever qualquer referência.
6. Após o squash merge, obter do GitHub o último commit publicado `P` da PR e sua integração `M`, e conferir que o conteúdo de backlog em `P` foi integrado em `M`. Com árvore/índice limpos e `P` ancestral do tip local de `chore/backlog`, executar a reconciliação local equivalente a `git rebase --onto <main-conferida> <P> chore/backlog`: somente os commits **posteriores a P**, ainda não publicados, são reaplicados. Conferir que seus IDs e conteúdo foram preservados. Se não houver commits posteriores, a fila fica na base conferida. Em conflito, abortar o rebase e parar, preservando os commits originais e os IDs. Não usar cópia manual de diff, branch auxiliar de lote integrado, reset ou limpeza de capturas. Identidade e autorização continuam nos registros dos itens; a reescrita local de SHA não cria novas capturas.

O caminho é determinado pelo Git e pelo checkout principal, não por memória de uma ferramenta. O worktree é do **mesmo repositório**: a regra de `.agent/ai_behavior.md` sobre dependências operacionais de checkout irmão trata de dependências **entre repositórios**, que continuam proibidas. Explicitar essa distinção nas autoridades, sem permitir acesso a repositório alheio. A fila externa compartilha o Git, não dados locais privados ou `node_modules` do checkout principal; criar o worktree não copia arquivos ignorados de `local/`.

Essa localização mantém a segunda cópia de `src/`, `tests/` e `scripts/` fora das raízes de `eslint .`, dos globs relativos do `tsconfig.json` e do build do checkout principal. Não é necessário alterar `eslint.config.mjs`, `tsconfig.json`, scripts ou CI. O ensaio deve verificar caminho externo, ausência de link/junction interno e Git comum, além de preservar branch/índice/diff do trabalho corrente.

#### Publicação

- O pedido de captura autoriza o commit local de P4, mas não publicação. "Publique as alterações do backlog" autoriza push dos commits locais apresentados e PR documental contendo somente `_project/backlog.md`, depois de apresentar o intervalo e o diff e conferir G3. O pedido cobre esse lote, não capturas posteriores ou alterações de outras conversas não apresentadas. Não criar conteúdo adicional durante a publicação por inferência.
- A fila local continua em `chore/backlog`; cada lote remoto usa `chore/backlog-lote-<SHA completo da base integrada>`, com uma PR aberta por vez. Publicar o tip autorizado para essa branch sem force-push. Novos commits só avançam a mesma PR por pedido explícito de publicação do novo lote. Depois de integrado e reconciliado, a próxima base gera outra branch de lote; não é necessário sobrescrever o histórico remoto da PR já integrada. Detectar nome remoto ocupado por lote incompatível antes do push.
- Essa PR de manutenção não exige issue artificial nem ciclo novo. Usar o template de PR com `Issue: não se aplica — manutenção do backlog`, barreiras justificadas, checks verdes e pedido próprio de aprovação de merge. Atualizar o template para explicitar essa exceção ao `Closes #`, mantendo o comportamento das entregas de issues.
- Cada merge continua exigindo "aprovo o merge da PR #N". PR fechada sem merge ou estado remoto ambíguo exige reconciliação, sem declarar integração.
- Artefatos do ciclo entram em suas PRs próprias. Após sua integração comprovada, a atualização de retorno é gravada somente na fila de backlog, sem transportar os demais itens para a branch do ciclo. A publicação desse retorno segue o lote autorizado de backlog; seleção não autoriza publicação automática.
- Não publicar um vínculo para destino ausente em `main`. Antes de qualquer commit que inclua backlog, inclusive uma atualização futura de retorno, repetir G3 e conferir que o diff contém somente o lote autorizado.

#### Handoff das operações de backlog

Estender a tabela canônica com o alvo literal `backlog` e uma única situação nova:

| Situação proposta | Quem age | Conferir | Frase |
| :-- | :-- | :-- | :-- |
| `Backlog atualizado` | Responsável | IDs, síntese e alterações locais do backlog | "publique as alterações do backlog" |

- `Backlog atualizado — backlog` significa registro local concluído, publicação opcional e sem autorização de próximo passo. A frase indica uma opção disponível, sem obrigação de publicar ou iniciar um ciclo.
- Para o alvo `backlog`, permitir somente `Backlog atualizado`, `Aguardando merge`, `Parado` e `Concluído`. As três últimas reutilizam quem age, conferência e frase da tabela existente. `Concluído — backlog` significa integração verificada da operação documental, sem atribuir conclusão aos itens.
- A situação `Backlog atualizado` é exclusiva do alvo `backlog`; não deve ser aceita para ciclos ou correções. O validador deve conferir essas combinações, sem aceitar indiscriminadamente o novo alvo em todas as situações.
- **Contrato escolhido para R1-2: sem bloco persistido no backlog.** `_project/backlog.md` contém somente itens e referência à política; não contém `## Próximo passo`, `## Handoff de saída` nem cabeçalho de versão de handoff. `.agent/ai_behavior.md` terá exceção explícita e restrita: operações de conteúdo do backlog mostram o handoff e o próximo passo na saída, sem gravá-los nesse arquivo. A lista de `Artefato ativo` em `_project/README.md` explicita que o backlog é um registro de possibilidades e não substitui ideação, plano ou task do ciclo.
- A PR avulsa publica somente o conteúdo autorizado dos itens; **nenhuma situação de espera ou conclusão é commitada em `main`**. Assim, merge não deixa um bloco obsoleto e não exige commit recursivo. Autorização e síntese das mudanças locais permanecem no `Registro` dos itens; a evidência de publicação e integração permanece no GitHub e é conferida por leitura.
- `.agent/workflows/retomar.md` aceitará "continue o backlog" para observação somente leitura, usando a mesma rotina documental de observação de `gerenciar_backlog`. Não despacha publicação nem merge por inferência. `health_check.md` e `governance-check` consultarão separadamente a fila, quando presente, sem substituir o bloco do ciclo ativo por uma situação de backlog.
- A situação efetiva é observada nesta ordem: conflito, PR fechada sem merge, checks falhos/pendentes, alterações pedidas na revisão ou acesso remoto necessário indisponível → `Parado`, indicando a precondição; PR aberta em que só falta integrar → `Aguardando merge`, informando checks e qualquer captura local posterior; sem PR aberta e com diferenças locais ou commits de lote não integrados → `Backlog atualizado`; sem lote pendente e com integração/base conferida → `Concluído`, relativo somente à operação documental. Backlog vazio sem operação pendente é apresentado como base sincronizada, sem inventar captura ou merge.
- O observador confere o worktree canônico, seu diff/índice, a branch e a PR correspondente via `gh`, e compara a base integrada. Não confia na última mensagem de chat como estado. Checks falhos são explicitados e não permitem merge; corrigi-los exige autorização compatível. Capturas locais posteriores à PR permanecem locais, identificadas na saída; a aprovação de merge da PR não as inclui.
- A `logical_key` usa `repository + backlog + gerenciar_backlog + operação/alvo + revisão_base`. O alvo inclui IDs e conteúdo solicitado normalizado, ou a necessidade normalizada antes da primeira alocação; a revisão é o commit de base observado na fila. Não exigir hash adicional do arquivo. Reexecução compara também os itens e seu `Registro`, sob a trava, para devolver o mesmo resultado sem duplicar captura, registro ou commit local.
- Mostrar autorização, `state_before`, `state_after`, `result`, evidências e blockers reais no handoff de cada mutação. `effect_class` é `local_mutation` na captura e `remote_mutation` na publicação/merge autorizado. Consultas e observação pós-merge usam saída reduzida somente leitura, sem alterar o backlog.

### P5 — Seleção e contexto de origem

- Um pedido como "quero idear BL-001 e BL-004" recupera os itens e passa pela triagem existente. Não substitui as frases de entrada, não força nível completo nem junta automaticamente assuntos independentes.
- A saída da triagem identifica IDs, títulos e parcela considerada; propõe agrupamento com justificativa. ID ausente, arquivado, integralmente encaminhado ou dependência que altere escopo exige esclarecimento antes de nova mutação.
- A triagem lê os itens na fila canônica, inclusive os locais ainda não publicados, e informa essa condição. A cópia do backlog na branch corrente não é fonte para alocação nem para seleção se existir lote mais recente na fila. Informar também destinos em preparação conhecidos no trabalho corrente; não garantir exclusividade de exploração entre clones independentes.
- O artefato consumidor guarda seção opcional `## Origem no backlog`, com IDs, síntese da necessidade e parcela selecionada, referência ao backlog e commit de base consultado. Se a seleção usou conteúdo ainda local, declarar esse fato e copiar a síntese suficiente no destino, sem exigir hash adicional ou link de chat. A síntese é a evidência material do recorte, preservada apesar de futuras edições no backlog.
- A PR do destino declara os IDs usados. Se eles ainda não existirem em `main`, a publicação do lote que os contém e seu merge aprovado são dependência explícita antes do merge do destino. Não misturar o lote do backlog à branch do ciclo.
- Depois da integração do destino, `gerenciar_backlog` registra o retorno na fila por ID estável de ciclo (`ciclo NNN`) ou correção (`issue #N`, com task existente), data e parcela. Para ciclos, a localização atual é resolvida por `_project/cycles.md`; para a curta, pela task da issue. Não manter no backlog um caminho que precisa ser migrado entre drafts/, executed/ e archived/.
- A resposta do workflow de destino informa separadamente: artefato criado/integrado e retorno no backlog pendente/registrado/publicado. Se a integração ocorrer fora desta sessão, "continue o backlog" aponta o retorno ausente por leitura; gravá-lo requer pedido de seleção/atualização verificável, nunca uma autorização presumida da memória do chat.
- Templates usam `Não se aplica` quando não há origem no backlog. Artefatos históricos sem essa seção continuam válidos; não reescrever ciclos anteriores. Cancelamento não reabre o item automaticamente. A observação resolve os identificadores estáveis, sem automação de migração de links.

### P6 — Revisão, combinação e descarte

- Revisão sob demanda e antes de selecionar itens. Nenhuma revisão periódica ou expiração automática.
- Cada mudança de conteúdo ou estado deixa uma linha curta no `Registro` do item com data, pedido humano e resultado. Reexecução sem mudança não acrescenta linha redundante nem altera data.
- Arquivamento exige motivo; combinação exige IDs explícitos, preserva os de origem como arquivados e aponta para o item que concentra a necessidade. O validador confere somente a existência dos IDs citados; equivalência, autorreferência e cadeia coerente de combinações são revisão manual, sem implementar um grafo neste ciclo.
- Consolidar o contrato nas autoridades existentes. Este plano não cria ADR-006 nem altera KB-003: a primeira é dispensável para este mecanismo pequeno e a segunda descreve produto/arquitetura. Registrar futuramente uma decisão adicional somente se houver necessidade duradoura ainda não atendida por essas autoridades.

### Divergência de autorização de merge — R1-1

A atribuição do merge documental à aprovação do plano está no item **Ciclo completo** da seção **Fluxo por nível** de `_project/README.md`. A seção Entrada não trata de merge, e Pontos de aprovação já exige aprovação própria. `.agent/ai_behavior.md` exige aprovação para **cada merge, sem exceção**. Prevalece essa autoridade de autorização: também a PR documental do ciclo 007 depende de "aprovo o merge da PR #N". A implementação harmonizará somente o trecho conflitante de Fluxo por nível para separar publicação da PR e aprovação de seu merge. Não há alteração de Entrada por esse motivo, nem mudança das demais aprovações. Nenhuma harmonização da política é feita durante a correção deste plano.

### Pontos de aprovação

| Ponto | Precondição | Cobre | Não cobre | Conferir |
| :-- | :-- | :-- | :-- | :-- |
| Autorizar ideação — frase inicial do ciclo 007, já recebida | Triagem proposta | Ideação e reserva do ciclo | Plano ou implementação | Autorização no cabeçalho da ideação |
| Autorizar rascunho — "autorizo o rascunho do plano do ciclo 007", já recebida | Ideação registrada | Este plano e reconciliação do ciclo para Planejamento | Revisão formal, aprovação, issue, commit ou publicação | Ideação e propostas P1 a P6 |
| Autorizar revisão — "revise o plano do ciclo 007" | Plano em Rascunho ou Em Revisão | Parecer formal e campos permitidos ao revisor | Reescrita, aprovação ou implementação | Escopo, contratos, riscos e testes |
| Aprovar plano — "aprovo o plano do ciclo 007" | Veredito apto e manifestação humana posterior; propostas P1 a P6 consideradas | Contrato proposto, preparação/publicação da PR documental, encerramento e criação da issue após integração documental e apresentação/confirmação do payload | Qualquer merge, implementação da issue ou publicação de itens futuros | Versão revisada, ressalvas, limites da manutenção avulsa e divergência R1-1 |
| Autorizar implementação — "autorizo a implementação da issue #N" | Plano aprovado e integrado; issue real conferida | Implementação, validações e PR da única unidade prevista | Merge dessa PR ou ampliação do escopo | Issue, plano, branch e barreiras |
| Aprovar merge — "aprovo o merge da PR #N" | PR real, diff delimitado e checks verdes | Merge por squash somente dessa PR, inclusive quando for a documental do plano | Outras PRs, deploy ou produção | Diff, revisão e checks atuais; aprovação humana específica da PR |
| Autorizar captura/manutenção futura — pedido explícito com alvo | Contrato deste ciclo integrado; conteúdo e IDs inequívocos | Alteração solicitada e commit local apenas do backlog no worktree exclusivo | Push, PR, merge, ciclo ou entrega | Síntese, identidade, privacidade e diff do commit |
| Autorizar publicação futura — "publique as alterações do backlog" | Lote de commits locais delimitado, contrato integrado e autorização registrada | Push e PR documental do lote apresentado | Merge, alteração de regras, commits não apresentados ou outro conteúdo | Intervalo, diff, referências e checks |

Não há ação humana externa nem verificação em produção previstas neste ciclo. Se aparecer necessidade de alterar produto, cálculo, acesso, infraestrutura ou o contrato proposto, parar e ajustar o plano com revisão e autorização adequadas. O modo contínuo permanece ausente. Conflito de identidade, escopo, privacidade, autorização, falta de template ou estado externo não verificável impedem a mutação dependente. Regras novas deste plano só valem após sua integração, sem uso antecipado da exceção para implementar o próprio ciclo.

## Barreiras de domínio

| Barreira | Aplica-se? | Como o ciclo a atende ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Somente governança; nenhum cálculo ou caso financeiro alterado. Itens futuros serão classificados quando selecionados |
| G2 — isolamento por RLS | Não | Não altera banco, autenticação ou autorização do produto; autorização de agentes pertence à governança |
| G3 — privacidade de dados | Sim | Síntese abstrata conferida antes da captura e de toda alteração; nova conferência em cada commit, publicação e merge; testes e exemplos fictícios |
| G4 — migrações só acrescentam | Não | Nenhuma migração criada, alterada ou removida |

## Estratégia de testes

Gates obrigatórios para esta entrega de governança, sem `npm install`:

```sh
node --test scripts/validate-governance.test.mjs
node scripts/validate-governance.mjs
git diff --check
git status --short
```

Na implementação, acrescentar cenários ao teste existente, usando fixtures temporárias fictícias e mantendo a prova de que o validador é somente leitura. A ausência de itens é válida. Alterar a fixture gerada por manifesto para que os novos arquivos obrigatórios não sejam simples placeholders inválidos.

| Cenário | Evidência esperada |
| :-- | :-- |
| Backlog vazio e item mínimo válido | Passam; arquivo obrigatório ausente ou campo obrigatório vazio falham |
| ID duplicado, inválido ou referência interna ausente | Falham com indicação do item; formato aceita ao menos três dígitos, sem suíte dedicada a limites hipotéticos |
| Pedido repetido | Ensaio do workflow reutiliza o ID sem alterar conteúdo, data ou registro; não alegar que o parser testa compreensão de linguagem |
| Estados e referências | Estado desconhecido, Encaminhado sem destino existente e Arquivado sem motivo falham; referência interna a ID inexistente falha |
| Destinos estáveis | Identificador de ciclo resolve pelo registro de ciclos e correção pela task existente; destino ausente falha. Não implementar parser de caminhos arbitrários ou migrador de links |
| Recorte e múltiplos itens | Ensaio documenta seleção, síntese no destino, restante e reciprocidade; agrupamento e suficiência semântica são conferência humana |
| Contexto preservado | Ensaio verifica que editar depois o item não muda a síntese salva no destino; não impor migração ou novo parser aos artefatos históricos |
| Concluído ou Cancelado no ciclo de destino | Não muda automaticamente estado do item; ensaio exige decisão de reabertura ou descarte |
| Captura durante outra issue/ciclo | Ensaio começa com alterações fictícias na branch de trabalho; captura e commit local ocorrem no worktree canônico externo, mantêm branch/índice/diff corrente intactos e alocam o próximo ID incluindo lote anterior pendente |
| Isolamento dos gates | Caminho real do worktree fica fora de todos os checkouts e sem junction/symlink interno; ambas as cópias apontam para o mesmo Git comum. Inspeção dos globs confirma que lint/typecheck/build do principal não incluem a cópia externa; não alterar configuração da aplicação |
| Merge de um lote com capturas posteriores | Ensaio com Git fictício integra por squash o tip publicado P e reaplica somente os commits posteriores com rebase --onto; mantém IDs, conteúdo e autoria local, sem push. Sem commits posteriores, fila passa à base conferida; conflito exige abortar, com commits preservados |
| Limite de publicação | Captura local posterior ao tip publicado não avança a branch remota nem a PR; novo lote após reconciliação usa outra branch de base e não exige force-push |
| Situação e retomada | Backlog não contém bloco persistido, antes ou depois da publicação; ensaio distingue lote local, PR aberta e integração pela observação de Git/GitHub. Tabela e manifesto mantêm o alvo de backlog e situação de saída sem ampliar as combinações dos alvos atuais |
| Autorizações e efeitos | Ensaio distingue captura local, publicação autorizada, merge aprovado e reexecução; sem simular aprovação humana como fato |
| Regressões | Todos os testes anteriores passam; artefatos históricos continuam aceitos sem nova seção |

O enforcement novo fica restrito a: arquivo presente; formato e unicidade de IDs; campos obrigatórios; estados da lista; Arquivado com motivo; Encaminhado com destino existente; referências internas a IDs existentes. Preservar a conferência já existente de sintaxe e sincronização entre situações de saída dos workflows e a tabela/manifesto. Não exigir bloco, versão de handoff ou hash no arquivo de backlog. Não implementar grafo de combinações, prova de reciprocidade, travessia de caminhos, parser de origem nos artefatos antigos ou migração automática de links.

Não adicionar código para executar workflows, interpretar linguagem ou acessar GitHub pelo validador. Cobertura, restante de seleção parcial, necessidade equivalente, coerência das combinações, síntese de origem, G3, autorização e estado remoto são verificações manuais. Ensaios de Git/worktree usam apenas repositórios e conteúdo fictícios temporários, sem modificar a árvore real; a ausência de executor de workflow impede apresentar esses ensaios como prova automática de interpretação de pedidos humanos.

Na task de implementação, registrar o ensaio com fixtures, resultados reais dos comandos, diff autorizado e links da PR/checks. Não precisa executar lint, build, Supabase ou E2E da aplicação para mudanças restritas a governança; checks exigidos no GitHub devem estar verdes antes do merge.

## Itens de implementação

### Item 1 — Instituir o contrato e o artefato de backlog

**Contexto:** a captura precisa ser simples e ter limites explícitos, sem criar uma segunda fonte de política.

**Ação técnica:** alterar `_project/README.md` e `.agent/ai_behavior.md` para P1 a P4 e P6, incluindo harmonização da aprovação própria para todo merge documental; criar backlog vazio sem bloco persistido, template de item e workflow `gerenciar_backlog.md`. Ajustar o template de PR para manutenção avulsa. Não criar ADR ou alteração na KB-003.

**Critérios de aceite:**

- [ ] O significado acordado da inclusão está explícito e não autoriza entrega.
- [ ] Uma captura inequívoca exige apenas o pedido original e devolve ID e síntese.
- [ ] Formato, campos, estados, identidade, duplicidade, colisão, combinação e descarte estão definidos nas autoridades corretas.
- [ ] Backlog nasce sem itens reais nem exemplos operacionais; template e workflow são consumidores do contrato.
- [ ] Captura local, publicação avulsa e merge têm autorizações e estados distintos; nenhuma PR fica dispensada de checks ou de aprovação de merge.
- [ ] Fila única em worktree externo e trava local definem onde gravar e commitar cada captura; o lote pendente entra na alocação sem alterar a branch corrente, seu índice ou os gates da aplicação.
- [ ] Pedido de captura cobre somente o commit local do item; push e PR dependem de autorização separada e não incluem commits posteriores ao lote apresentado.
- [ ] Captura e todo commit conferem G3; síntese que dependa de dado privado exige abstração antes de ser gravada.
- [ ] A exceção é restrita a conteúdo do backlog; mudanças das regras continuam exigindo triagem e ciclo completo.

### Item 2 — Integrar os IDs aos níveis existentes

**Contexto:** selecionar itens deve preservar o contexto e seguir o rito adequado à demanda.

**Ação técnica:** adaptar `triar`, `idear`, `rascunhar_plano` e `corrigir_trilha_curta`; acrescentar `Origem no backlog` aos templates de ideação, plano e task. Triagem lê a fila canônica e continua somente leitura; consumidores preservam parcela/síntese e informam a dependência de publicação dos IDs locais. O retorno só é gravado na fila após integração comprovada do destino, com referência estável. Adaptar `retomar` e `health_check` para observação sem bloco persistido e sem despacho mutante do backlog.

**Critérios de aceite:**

- [ ] Seleção múltipla produz proposta de agrupamento e nível sem reservar ciclo ou confirmar em nome do responsável.
- [ ] Completo, leve e curta preservam IDs, síntese e revisão de origem nos artefatos novos, ou registram que não se aplica.
- [ ] Encaminhamento exige destino concreto; seleção parcial mantém restante; múltiplos destinos não significam múltiplas promessas de entrega.
- [ ] Ciclo cancelado não reabre automaticamente o item; mudanças futuras no backlog não reescrevem a síntese de origem.
- [ ] Ciclos históricos continuam válidos; identificadores de destino dispensam migração de links e tarefa recursiva.
- [ ] "Continue o backlog" observa a situação real sem publicar, gravar bloco ou substituir o próximo passo de um ciclo ativo; health check relata as duas condições separadamente.

### Item 3 — Aplicar verificações e provar o fluxo documental

**Contexto:** o contrato deve ser verificável por qualquer ferramenta com o runtime já adotado.

**Ação técnica:** estender manifesto, validador e testes somente para o enforcement essencial descrito na estratégia, mantendo a sincronização já existente da tabela de situações. Executar o ensaio manual de P1 a P6, incluindo worktree, lote pendente e retomada. Atualizar a skill de governança para conferir a fila, a privacidade na captura e os limites manuais, sem duplicar regras.

**Critérios de aceite:**

- [ ] Cenários determinísticos listados passam/falham como previsto; parser não confunde exemplo em bloco de código com item operacional.
- [ ] Todas as regressões passam, sem novas dependências, acesso de rede ou escrita pelo validador.
- [ ] O ensaio prova recuperação por ID, repetição de pedido, seleção múltipla/parcial, descarte e limites de autorização com conteúdo fictício.
- [ ] Task e PR apresentam evidências reais de G3 e dos gates, distinguindo revisão humana de verificações automatizadas.

Os três itens compõem uma única unidade de implementação e uma única issue: documentos normativos, arquivo obrigatório, consumidores e enforcement precisam entrar juntos para que o repositório não fique com um contrato parcialmente válido.

## Arquivos afetados

| Arquivo | Mudança prevista |
| :-- | :-- |
| `_project/README.md` | Organização, fila externa única, commits locais, lotes remotos e observação; backlog fora dos artefatos ativos; harmonização somente do item Ciclo completo em Fluxo por nível sobre merge documental |
| `.agent/ai_behavior.md` | Autorizações de commit local/publicação, G3 e exceção de handoff sem bloco gravado; distinguir worktree do mesmo Git de dependência operacional entre repositórios |
| `_project/backlog.md` | Novo artefato vazio; somente dados, sem bloco persistido de situação ou handoff |
| `.agent/templates/backlog_item.md` | Novo template curto de item |
| `.agent/workflows/gerenciar_backlog.md` | Novo workflow de manutenção/publicação/reconciliação |
| `.agent/workflows/triar.md` | Recuperação por IDs e proposta somente leitura |
| `.agent/workflows/idear.md` | Origem e encaminhamento no completo |
| `.agent/workflows/rascunhar_plano.md` | Origem no leve e herança do completo |
| `.agent/workflows/corrigir_trilha_curta.md` | Origem e vínculo à task da correção |
| `.agent/workflows/retomar.md` | "Continue o backlog" em modo somente leitura, com situação derivada da fila e GitHub |
| `.agent/workflows/health_check.md` | Observar backlog separadamente do artefato ativo do ciclo |
| `.agent/templates/ideacao.md` | Seção opcional de origem |
| `.agent/templates/plano_implementacao.md` | Seção opcional de origem |
| `.agent/templates/task.md` | Seção opcional de origem |
| `.github/pull_request_template.md` | Exceção explícita ao vínculo obrigatório com issue em PR avulsa do backlog |
| `scripts/governance-manifest.json` | Novos arquivos, workflow, campos/estados essenciais e situação/alvo de saída |
| `scripts/validate-governance.mjs` | Enforcement essencial de conteúdo, sem tratar backlog como plano/task com bloco persistido |
| `scripts/validate-governance.test.mjs` | Fixtures válidas, casos essenciais e regressões existentes |
| `.agent/skills/governance-check/governance-check.md` | Auditoria do backlog e limites manuais |
| `_project/cycles.md` e artefatos do ciclo 007 | Planejamento, task de implementação, evidências e encerramento |

Nenhum outro arquivo entra por conveniência. Adapters, CI, `eslint.config.mjs`, `tsconfig.json` e documentação funcional não precisam mudar: o worktree ficará fora das raízes do checkout, por decisão explícita de R2-1. A seção Entrada do README permanece intacta quanto à aprovação de merge; o trecho conflitante está em Fluxo por nível. Se uma dependência real exigir novo consumidor, delimitar e revisar o ajuste antes de incluí-lo.

## Decomposição em issues e PRs

| Unidade | Conteúdo | Entrada e saída |
| :-- | :-- | :-- |
| PR documental do plano | Ideação, plano revisado/aprovado e registro de ciclo; branch `chore/cycle-007-plan` | Publicar após aprovação pós-revisão; integrar somente com checks verdes e "aprovo o merge da PR #N" específico dessa PR |
| Uma issue `[CHORE] Instituir backlog de possibilidades na governança` | Itens 1 a 3, critérios de aceite e validações deste plano | Criar após integração documental e apresentação/confirmação do payload do Issue Form `chore.yml`; sem número antecipado |
| PR de implementação da issue | Contrato, artefato, consumidores e enforcement essencial em um diff coerente | Branch `chore/issue-N`, task `007_task_issue-N.md`, autorização de implementação e aprovação própria do merge |
| PR de encerramento | Consolidação viva, evidências, task de encerramento, plano concluído e movimentação para executed/ | Branch `chore/cycle-007-closure`; sem issue de encerramento; aprovação própria do merge |

Não está prevista release funcional nem deploy. Se o release-please abrir PR pelo processo normal, ela continua sujeita aos checks e à aprovação específica; não é integrada por inferência. Nenhuma dessas PRs ou issues é criada pelo workflow de rascunho.

## Dependências e blockers

- A v3 responde a R2-1 a R2-3 e preserva o atendimento aos achados da rodada 1. P1 a P6 continuam propostas; o autor não emite veredito sobre sua correção.
- Revisão formal e aprovação humana posterior são obrigatórias antes de transformar o contrato proposto em escopo aprovado; a autorização atual não cobre essas etapas.
- Para implementar: plano aprovado e integrado, payload confirmado, issue real e autorização de implementação.
- Para publicar: GitHub acessível via `gh`, estado de PR e checks conferidos, sem inventar identidades. A inspeção remota não foi necessária para este rascunho local.
- A operação futura depende de Git com worktrees e de acesso ao GitHub quando necessário para conferir lote remoto/integração. Nenhum worktree, trava ou lote real foi criado nesta correção documental.
- Não há dependência nova de software, serviço ou mudança no produto demonstrada como necessária.

## Riscos, suposições e rollback

| Risco ou suposição | Tratamento |
| :-- | :-- |
| Captura custar mais que a conversa | Campos curtos e pedido direto; ensaio avalia se o contrato cabe em uso normal |
| Publicação avulsa virar atalho para mudar governança | Exceção limitada ao único arquivo de conteúdo; qualquer regra ou arquivo adicional volta ao rito apropriado |
| Itens locais serem confundidos com estado compartilhado | Resposta informa local/PR/integrado; publicação e merge têm limites próprios |
| IDs colidirem entre sessões do mesmo clone | Fila canônica única e trava antes de ler/alocar, incluindo lote local não publicado; conferência remota ao preparar/publicar |
| Worktree entrar nos gates do principal | Caminho externo conferido e Git comum comprovado, sem junction/symlink que reinsira a cópia no checkout; não ampliar exclusões de lint/tipos |
| Worktree estar ocupado ou base mudar após squash | Capturas em commits locais e tip publicado conferido pela PR; rebase apenas dos commits posteriores, abortando em conflito; sem cópia manual de diff ou reset |
| Situação do backlog ficar obsoleta em main | Nenhum bloco persistido; retomar/health check observam fila e PR, sem substituir o artefato ativo do ciclo |
| Validação ser tomada por prova de cobertura ou aprovação | Parser só confere estrutura; semântica, privacidade e autorização autêntica ficam explicitamente manuais |
| Backlog crescer ou ficar obsoleto | Revisão sob demanda e arquivamento com identidade preservada; outra estrutura só diante de necessidade demonstrada |
| Plano ficar grande para o benefício | Uma unidade de implementação; aproveitar mecanismos existentes e não criar executor de workflow |

Antes de integrar, descartar ou corrigir somente o diff autorizado, preservando as alterações da ideação e registros humanos. Após integração, qualquer reversão usa PR autorizada e checks, sem apagar histórico. Se já houver itens ou destinos usando os IDs, preservar conteúdo e referências e suspender a operação problemática até a correção; não remover o arquivo como rollback cego. Não há rollback de banco ou produção neste ciclo.

## Sequência recomendada

1. Revisar formalmente a v3 na rodada 3; rodadas 1 e 2 e as respostas do autor ficam preservadas.
2. Obter veredito apto e aprovação humana posterior considerando P1 a P6.
3. Publicar a PR documental após a aprovação do plano; obter "aprovo o merge da PR #N" dessa PR e conferir checks antes de integrar.
4. Apresentar o payload e criar/reconciliar a única issue após confirmação; registrar número real.
5. Receber autorização de implementação; criar branch e task da issue. Implementar itens 1 a 3 como um conjunto coerente.
6. Executar gates e ensaio, registrar evidências, abrir PR e aguardar aprovação do merge.
7. Integrada a entrega, consolidar documentação viva e preparar o encerramento prospectivo em PR própria, sem issue recursiva.
8. Após aprovação e merge do encerramento, conferir integração e checks. Só então apresentar o ciclo como concluído. Uso real do backlog depende de pedidos próprios, sem população automática.

## Referências

- `.agent/ai_behavior.md`, `_project/README.md` e `_project/cycles.md`.
- `_project/ideations/007_backlog_possibilidades.md`: acordo humano, alternativas e perguntas 1 a 6.
- `.agent/workflows/rascunhar_plano.md` e `.agent/templates/plano_implementacao.md`: workflow e template lidos no ponto de criação.
- ADR-001, ADR-004 e KB-003, nas pastas `_project/decisions/` e `_project/knowledge/`.
- Workflows de triagem, ideação, criação de issues, correção da trilha curta e atualização documental; templates de ideação/task e Issue Form `chore.yml` inspecionados.
- `scripts/governance-manifest.json`, `scripts/validate-governance.mjs` e `scripts/validate-governance.test.mjs`: mecanismos existentes, sem alteração neste rascunho.

## Rastreabilidade

| Campo | Valor |
| :-- | :-- |
| Issue(s) | — (uma unidade proposta; nenhuma criada) |
| PR(s) | — |
| Branch(es) | `chore/cycle-007-plan`, criada localmente a partir de `chore/cycle-007-ideation` |
| Revisão de origem | `1d2f36773b7d90a269be5f27dbbcc85e3ca10672`, com ideação e registro locais preservados |
| Template | `.agent/templates/plano_implementacao.md` |
| Destino após conclusão | `_project/executed/007_backlog_possibilidades/007_plan.md` |

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 007 (completo)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 007 + atualizar_docs + encerramento + f62a9dc7e971aed7a9e359a5cf22348809f98820`
- `effect_class`: `remote_mutation`
- `state_before`: plano v3 Em Execução; issue 82 integrada pela PR #83 com merge aprovado e checks verdes; ciclo 007 Em execução em drafts/.
- `state_after`: entrega integrada pela PR #83 e task da issue Concluída; plano/ciclo Concluído em executed/ de forma prospectiva até o merge do encerramento, acompanhado pela task 007_task_closure.md.
- `result`: `executed`
- `evidence`: aprovação da v3 cobre encerramento; "aprovo o merge da PR #83" recebido e integração conferida no GitHub; issue #82 CLOSED; documentação viva integrada; task de encerramento registra validações e situação da PR própria.
- `blockers`: entrega integrada sem pendências; PR de encerramento exige checks verdes e aprovação própria, conforme task de encerramento.

## Revisão crítica

### Rodada 1

- **Autor:** não identificado no rascunho `v1` (o handoff de `rascunhar_plano` não registra ferramenta nem modelo).
- **Revisor:** Claude Code, Claude Opus 5.5 (`claude-opus-5-5`).
- **Data e autorização:** 2026-10-19; solicitação humana "revise o plano do ciclo 007". Autoriza esta revisão formal e seu registro, sem aprovar, promover ou reescrever o plano e sem iniciar implementação.
- **Base:** branch local `chore/cycle-007-plan` @ `1d2f36773b7d90a269be5f27dbbcc85e3ca10672` (igual ao HEAD de `main` local); plano `v1` em `Rascunho` (movido para `Em Revisão` no início desta revisão); ciclo `007` em `Planejamento` em `_project/cycles.md` (`Próximo ciclo: 008`); ideação e plano ainda não versionados. O estado remoto do GitHub não foi consultado.
- **Identidade da origem (UTF-8/LF):** SHA-256 do plano `v1` antes desta revisão: `501b87a5cefa9a704d5ee6659c642b0d80baca44bc50bdfb6f37fb5895d3125c`. SHA-256 do trecho de `## Problema e contexto` até imediatamente antes de `## Próximo passo`: `64629e30ad2c33cf20b23951cd91330aa93066c44ce8e12bdc80321cc1b6e23c`. Esse trecho e o handoff original de `rascunhar_plano` foram preservados.
- **Template e autoridades lidos:** `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, `.agent/workflows/revisar_plano.md`, `.agent/templates/plano_implementacao.md`, ideação `007`, `.github/pull_request_template.md`, `.agent/workflows/retomar.md` e `health_check.md` (consumidores de situação), `scripts/governance-manifest.json` e `scripts/validate-governance.mjs` (tratamento de blocos, alvos e artefatos) e, como precedente, as revisões e a tabela de pontos de aprovação dos planos `005` e `006` em `executed/`.

#### Achados

- **R1-1 — bloqueador: a aprovação do plano não pode cobrir o merge da PR documental.** O ponto "Aprovar plano" (tabela de pontos de aprovação) diz que cobre a "PR documental do plano e seu merge com checks verdes"; o ponto "Aprovar merge" remete a PR documental à "cobertura específica da aprovação do plano"; a decomposição diz "merge coberto por essa aprovação"; e o passo 3 da sequência integra a PR "conforme a cobertura da aprovação". Isso reproduz o fluxo completo de `_project/README.md`, mas contraria `.agent/ai_behavior.md`, que é a autoridade de autorizações: "Cada merge exige checks verdes e 'aprovo o merge da PR #N', sem exceção". A divergência já foi registrada nos ciclos `005` (seção "Aprovação e publicação documental") e `006` (R1-7), e ambos seguiram a regra mais restritiva. **Correção esperada:** retirar o merge da cobertura da aprovação do plano, exigir "aprovo o merge da PR #N" também para a PR documental e registrar a divergência. Como este ciclo altera a governança, o autor pode propor a harmonização do texto do README, mas só com escopo e arquivos explícitos.
- **R1-2 — bloqueador: o bloco persistido em `_project/backlog.md` fica indefinido ou falso em `main`.** P4 determina que o backlog guarde `## Próximo passo` e `## Handoff de saída`, e que `Backlog atualizado` signifique "registro local concluído, publicação opcional". O plano não define qual bloco vai no commit da PR de publicação:
  - se for `Backlog atualizado — backlog`, `main` passa a declarar permanentemente uma alteração local pendente que não existe mais;
  - se for `Aguardando merge — backlog`, o arquivo fica obsoleto depois do merge, e nenhum workflow observa essa situação: `retomar` só aceita "continue o ciclo NNN" ou "continue a correção da issue #N", e `health_check` só mostra o ciclo ativo. Nenhum dos dois está em "Arquivos afetados".

  O próprio P4 admite o problema quando diz que o handoff local "não pode ser apresentado como situação efetiva se a integração estiver comprovada", e o cenário de teste "Blocos de handoff" não diz qual bloco é válido em `main`. **Correção esperada:** escolher e justificar um contrato. Por exemplo: (a) bloco prospectivo `Concluído — backlog` na PR de publicação, por analogia ao encerramento prospectivo, com reconciliação somente leitura; ou (b) nenhum bloco persistido no backlog, com uma exceção explícita em `ai_behavior.md` à regra "só workflows mutantes gravam o bloco". Em qualquer caso, definir quem observa a situação efetiva do alvo `backlog` e atualizar a lista de "Artefato ativo" e os consumidores afetados.
- **R1-3 — bloqueador: falta definir a captura feita durante outro trabalho, o que afeta a alocação de IDs.** O caso de uso principal da ideação é guardar uma possibilidade no meio de uma conversa, muitas vezes com uma branch de issue ou de ciclo aberta. P4 diz que a captura "pode usar a branch de trabalho já adequada se não misturar alterações alheias", sem definir "adequada", e exige que a PR avulsa saia de `chore/backlog` contendo somente `_project/backlog.md`. Não há caminho definido para levar uma captura feita na branch de trabalho até `chore/backlog`. A alternativa implícita, deixá-la entrar na PR da issue, contraria "Mudanças cirúrgicas". Como P1 aloca "o próximo inteiro após o maior ID presente" no arquivo da branch corrente, capturas em branches diferentes, ou com um lote de `chore/backlog` ainda não integrado, produzem o mesmo `BL-NNN`. A regra de colisão leva então a "Parado" num cenário comum, não excepcional. **Correção esperada:** um único procedimento determinístico para onde a captura é gravada quando a árvore corrente está em outra branch ou com alterações (por exemplo, sempre em `chore/backlog`, num worktree próprio criado a partir da base integrada mais o lote pendente). Também é preciso definir de qual arquivo o próximo ID é lido. O procedimento não pode descartar alterações nem misturar escopo.
- **R1-4 — ressalva: o enforcement e o contrato estão desproporcionais ao objetivo.** A ideação aponta como primeiro risco a "burocracia de captura", e `ai_behavior.md` veda funcionalidade especulativa. Mesmo assim, para um arquivo que nasce vazio, o plano prevê no validador detecção de ciclo entre combinações, travessia de caminho, reciprocidade de vínculos, movimentação de destinos entre `executed/` e `archived/` e prova de `BL-1000`. Prevê ainda uma situação e um alvo novos na matriz de handoff, `logical_key` com hash do conteúdo do backlog, alteração do template de PR, ADR-006 e alteração na KB-003: cerca de 21 arquivos numa única PR. **Sugestão:** limitar o validador ao determinístico essencial (arquivo presente, formato e unicidade do ID, campos obrigatórios, estados da lista fechada, `Arquivado` com motivo, `Encaminhado` com destino existente e referência interna a ID existente) e adiar o restante até haver uso real. Também vale reavaliar se a alteração na KB-003 e o hash de conteúdo na `logical_key` são necessários. O autor pode contestar com justificativa.
- **R1-5 — ressalva: a privacidade (G3) é conferida tarde demais.** A captura dispensa uma segunda confirmação e grava uma síntese escrita a partir da conversa. A conferência de dados privados só aparece na publicação. Neste produto, uma possibilidade costuma nascer de um caso real da carteira do responsável (ativo detido, instituição, valor), e o repositório será público (ADR-003). Pelo R1-3, a captura pode ainda ser commitada numa branch de trabalho antes da publicação avulsa. **Sugestão:** exigir no workflow, já no momento da captura, que a síntese seja abstrata (sem nomes de ativos detidos, instituições, valores, quantidades ou prints) e que o agente pergunte antes de gravar quando a necessidade não puder ser expressa sem esses dados; e repetir a conferência em qualquer commit que inclua o backlog, não só na PR avulsa.

#### Itens atendidos e verificações por inspeção somente leitura

- **Objetivo, escopo e não-escopo:** coerentes com a ideação e com o acordo humano ("coloque no backlog" significa guardar para decidir depois). P1 a P6 respondem às seis perguntas da ideação e estão identificadas como propostas, sem aceite antecipado. Ficam fora do escopo, corretamente, produto, banco, GitHub Projects, automação e população do backlog com exemplos.
- **Autoridades e precedência:** P1 a P6 são consolidados em `_project/README.md` e `.agent/ai_behavior.md`, e workflows, templates e validador ficam como consumidores. A exceção à triagem para manutenção de conteúdo fica restrita ao backlog e só vale depois da integração, sem uso antecipado neste ciclo.
- **Barreiras:** G1, G2 e G4 não se aplicam, com justificativa adequada; G3 se aplica (ver R1-5). Os artefatos revisados não contêm dados do usuário.
- **Fatos conferidos:**
  - a revisão de origem `1d2f367` é o HEAD atual;
  - `ADR-006` está livre (existem ADR-001 a ADR-005);
  - existem `.github/ISSUE_TEMPLATE/chore.yml` e `.agent/skills/governance-check/governance-check.md`;
  - os cinco workflows citados existem;
  - o manifesto aceita hoje apenas os alvos `ciclo NNN (leve)`, `ciclo NNN (completo)` e `correção da issue #N`;
  - o validador só procura blocos em ideações, planos e tasks, então o novo arquivo exige manifesto e validador, como o plano prevê;
  - o template de PR exige `Closes #N` ou a exceção de encerramento, então o ajuste para a PR avulsa é necessário.
- **Decomposição:** uma única issue para contrato, consumidores e enforcement é justificada pela coerência do repositório. A PR de encerramento sem issue e a ausência de release funcional estão corretas.
- **Gates executados nesta revisão (2026-10-19), sobre a `v1`:** `node --test scripts/validate-governance.test.mjs`, com 39/39 testes passando; `node scripts/validate-governance.mjs`, com 0 erros, 0 avisos e 4 itens manuais; `git diff --check` limpo.

**Veredito: `REQUER NOVA RODADA`.** Três bloqueadores (R1-1 a R1-3) e duas ressalvas (R1-4 e R1-5). O plano `v1` passa a `Status: Em Revisão`, com `Veredito da revisão: REQUER NOVA RODADA` e `Aprovação humana pós-revisão: Pendente`. Este parecer não aprova o plano nem autoriza correções, publicação, issues ou implementação. A correção depende de "corrija o plano do ciclo 007", com resposta a cada achado e incremento de versão.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 007 + revisar_plano + 007_plan/rodada-1 + v1`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `007` em `Planejamento`; plano `v1` em `Rascunho`; `Revisão formal: Pendente`; `Veredito da revisão: Pendente`; `Aprovação humana pós-revisão: Pendente`; próximo passo `Aguardando revisão (rodada 1) — ciclo 007 (completo)`.
- `state_after`: ciclo `007` em `Planejamento`; plano `v1` em `Em Revisão`; `Revisão formal: Em andamento`; `Veredito da revisão: REQUER NOVA RODADA`; `Aprovação humana pós-revisão: Pendente`; `### Rodada 1` registrada; próximo passo `Aguardando correções (rodada 1) — ciclo 007 (completo)`.
- `result`: `executed`
- `evidence`: solicitação humana "revise o plano do ciclo 007" em 2026-10-19; campos de status e veredito atualizados no cabeçalho; bloco `## Próximo passo` atualizado; rodada registrada acima; inspeção somente leitura de autoridades, workflows, manifesto, validador e planos `005` e `006`; gates de governança como descritos; corpo do plano preservado, com o hash de origem registrado.
- `blockers`: R1-1, R1-2 e R1-3 em aberto; a correção exige autorização do responsável.

### Resposta do autor à rodada 1 — v2

- **Autor:** Codex (GPT-6; variante não identificada no contexto). Esta identificação se refere à correção; o parecer histórico mantém sua identificação da autoria da v1.
- **Data e autorização:** 2026-10-19; "corrija o plano do ciclo 007". Autorização limitada à correção local do plano e resposta aos achados.
- **Base:** plano v1 em Em Revisão, com os três bloqueadores e as duas ressalvas da rodada 1. Versão incrementada para v2; a rodada 1 e seu handoff não foram reescritos. O hash de preservação abrange de `## Revisão crítica` até imediatamente antes de `## Pós-mortem` na versão recebida, com quebras LF.

| Achado | Resposta do autor | Onde conferir na v2 |
| :-- | :-- | :-- |
| R1-1 — bloqueador | Corrigido pelo autor: aprovação do plano não cobre merge algum. PR documental também exige frase específica de aprovação; divergência registrada e harmonização do README delimitada no escopo | Divergência de autorização de merge; Pontos de aprovação; Item 1; Arquivos afetados; Decomposição; Sequência |
| R1-2 — bloqueador | Corrigido pelo autor pela alternativa sem bloco persistido: exceção explícita em ai_behavior, backlog fora dos artefatos ativos de ciclo, conteúdo publicado sem situação obsoleta. Retomar e health check passam a observar fila e GitHub, sem gravar ou despachar | P4, Handoff das operações; Item 2; Arquivos afetados; ensaio de situação/retomada |
| R1-3 — bloqueador | Corrigido pelo autor: um worktree canônico de chore/backlog e trava local recebem todas as capturas, inclusive durante outra issue/ciclo. O próximo ID vem desse arquivo com o lote pendente. Não há transferência de captura da branch corrente. O procedimento pós-squash preserva diff e referência antes de recriar a base | P1; P4, Fila canônica local; P5, retorno após integração; ensaios de captura e lote pós-merge |
| R1-4 — ressalva | Acolhida: enforcement limitado a presença, IDs, campos, estados, motivo, destino e referência existente. Removidos grafo, caminhos arbitrários, reciprocidade automática, migração de links e hash adicional da logical_key; sem ADR-006 nem mudança na KB-003. Alvo/situação de saída mantidos para handoff uniforme, sem metadados persistidos nos itens. Retomar/health check são consumidores necessários para R1-2 | Escopo; P4 a P6; Estratégia de testes; Itens 1 a 3; Arquivos afetados |
| R1-5 — ressalva | Acolhida: G3 é conferida antes de qualquer gravação; necessidade que dependa de dado privado exige abstração antes da captura. Repetir conferência em todo commit, publicação e merge que inclua backlog | P4; G3; critérios de aceite do Item 1 |

As marcações acima são respostas do autor e não um novo veredito. R1-1 a R1-5 precisam de conferência na rodada 2. P1 a P6 seguem como propostas para aprovação posterior a veredito apto. Nenhuma regra canônica, workflow, validador, backlog operacional, branch de backlog ou worktree foi implementado por esta correção.

**Validação da correção (2026-10-19):** 39/39 testes existentes de governança passaram; validador retornou 0 erros, 0 avisos e 4 itens manuais; `git diff --check` e a conferência de whitespace contra a cópia anterior passaram. Comparação do texto com quebras LF confirmou a preservação integral da rodada 1, com o hash registrado no handoff, e cinco respostas aos achados. Conferidas por inspeção as autorizações, ausência de dados privados e distinção entre propostas e regras em vigor. Esses resultados verificam a documentação atual; os ensaios futuros do backlog/worktree continuam previstos para a implementação.

### Rodada 2

- **Autor:** Codex (GPT-6; variante não identificada), conforme a resposta da `v2`.
- **Revisor:** Claude Code, Claude Opus 5.5 (`claude-opus-5-5`).
- **Data e autorização:** 2026-10-19; solicitação humana "revise o plano do ciclo 007". Autoriza esta revisão formal e seu registro, sem aprovar, promover ou reescrever o plano e sem iniciar implementação.
- **Base:** branch local `chore/cycle-007-plan` @ `1d2f36773b7d90a269be5f27dbbcc85e3ca10672`; plano `v2` em `Em Revisão`; ciclo `007` em `Planejamento` (`Próximo ciclo: 008`); ideação e plano ainda não versionados, e somente o plano alterado em relação ao fim da rodada 1. O estado remoto do GitHub não foi consultado.
- **Identidade da origem (UTF-8/LF):** SHA-256 do plano `v2` antes desta revisão: `83ffea490fd74ecb143539a06dda0becf98377f508cf7958806365a9806c20cf`. SHA-256 do trecho de `## Problema e contexto` até imediatamente antes de `## Próximo passo`: `fba21a02ae31bdf22fa8d20269b0f1cc5a275d46b9638f6a165d6274b8ffab47`. Conferido: o trecho de `## Revisão crítica` até antes de `### Resposta do autor` tem o SHA-256 `81f812c11651e3907d9a7ee4995449c041b1bd5f956b0bd0d9c5d001a4dabd59` declarado pelo autor, e o texto da rodada 1 é o registrado por este revisor.
- **Template e autoridades lidos:** os mesmos da rodada 1, mais `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, os scripts de `package.json` e o `.gitignore`, para avaliar o worktree proposto em `local/`.

#### Conferência dos achados da rodada 1

- **R1-1 — atendido.** A aprovação do plano deixa de cobrir qualquer merge. A PR documental exige "aprovo o merge da PR #N", nos pontos de aprovação, na decomposição e na sequência. A harmonização do README entra no escopo, com arquivo explícito (ver R2-3 sobre a seção citada).
- **R1-2 — atendido.** A alternativa (b) foi escolhida: o backlog fica sem bloco persistido, com exceção explícita em `ai_behavior.md`. A observação fica com `retomar` ("continue o backlog") e `health_check`, sem gravar nem despachar, e ambos foram incluídos em "Arquivos afetados". A ordem de determinação da situação efetiva está definida, e `main` não carrega estado obsoleto.
- **R1-3 — atendido no contrato, com defeito na localização (ver R2-1).** A captura passa a ter uma fila única, num worktree de `chore/backlog`, com trava local. O próximo ID é lido desse arquivo, incluindo o lote pendente. Não há transferência entre branches nem mistura com a PR da issue.
- **R1-4 — atendido.** O enforcement fica restrito ao essencial; grafo, travessia, reciprocidade, migração de links, hash adicional, ADR-006 e alteração na KB-003 saíram. Os destinos passam a ser identificadores estáveis (`ciclo NNN`, `issue #N`), sem caminhos para migrar.
- **R1-5 — atendido.** G3 é conferida antes de qualquer gravação, com pedido de formulação abstrata quando necessário, e repetida em todo commit que inclua o backlog.

#### Achados

- **R2-1 — bloqueador: o worktree em `local/worktrees/backlog/` entra nos gates de lint e typecheck do checkout principal.** O worktree é uma cópia completa do repositório (`src/`, `tests/`, `scripts/`) dentro da árvore do checkout principal. O `.gitignore` o esconde do Git, mas não das ferramentas:
  - `npm run lint` executa `eslint .`, e `eslint.config.mjs` ignora apenas `.next/`, `coverage/`, `playwright-report/`, `test-results/` e `next-env.d.ts`. Conferido por leitura com a API do ESLint: `isPathIgnored('local/worktrees/backlog/src/a.ts')` retorna `false`.
  - `npm run typecheck` (`tsc --noEmit`) e a checagem de tipos do `next build` usam `tsconfig.json` com `include: ["**/*.ts", "**/*.tsx", …]` e `exclude: ["node_modules"]`, então também compilariam a cópia. Como `@/*` aponta para `./src/*` do checkout principal, uma cópia baseada numa `main` mais antiga mistura tipos de versões diferentes.

  Como a fila é permanente, todo trabalho de aplicação neste checkout passaria a lintar e tipar uma segunda cópia do código, com risco de falhas espúrias nos gates obrigatórios. O plano fixa esse caminho e declara que nenhum outro arquivo entra ("Adapters, CI e documentação funcional não precisam mudar"), então a implementação não poderia corrigir isso sem alterar o plano. **Correção esperada:** escolher e justificar, com os arquivos explícitos, uma das saídas:
  - (a) manter o worktree em `local/` e incluir em "Arquivos afetados" a exclusão de `local/**` em `eslint.config.mjs` (`globalIgnores`) e em `tsconfig.json` (`exclude`), com a prova de que os gates ignoram a fila;
  - (b) colocar o worktree fora da árvore do checkout, conciliando isso com a regra de `ai_behavior.md` sobre checkout irmão, que trata de dependências entre repositórios.

  Vitest (`src/**`), Playwright (`tests/e2e`) e o validador de governança (que exclui `local/`) não são afetados.
- **R2-2 — ressalva: a reconciliação depois do squash é a parte mais frágil e poderia usar o próprio Git.** Ao proibir commits locais de captura, a v2 precisa de cópia do diff para `local/`, referência auxiliar `chore/backlog-integrada-pr-N`, recriação da branch e reaplicação conferida. Se o pedido de captura cobrisse um commit local em `chore/backlog`, sem push, a separação depois do squash viraria um `git rebase --onto <main conferida> <último commit publicado>` com conflito detectado pelo Git. O commit local não é publicação, e o push continuaria dependendo de "publique as alterações do backlog". Isso também reduz o risco de perda de capturas não commitadas no worktree. O autor pode manter a abordagem atual com justificativa.
- **R2-3 — ressalva: a referência à seção "Entrada" do README é imprecisa.** A divergência R1-1 diz que "o fluxo completo e a seção Entrada" atribuem o merge documental à aprovação do plano. No README atual, a atribuição aparece só em "Fluxo por nível" (linha do ciclo completo: "a aprovação do plano cobre a PR documental do plano, seu merge com checks verdes…"). "Entrada" não trata de merge, e "Pontos de aprovação" já diz "Cada merge tem aprovação própria". **Sugestão:** corrigir a referência para delimitar exatamente o trecho a harmonizar.

#### Itens atendidos e verificações por inspeção somente leitura

- **Progresso:** os bloqueadores caíram de 3 para 1; nenhum achado corrigido reapareceu, e R2-1 decorre da nova solução de R1-3, não de oscilação. A revisão pode continuar (2 de 5 rodadas).
- **Coerência do contrato:**
  - P3 e P5 condicionam o retorno no backlog à integração comprovada do destino, e o validador confere o destino na mesma árvore, o que mantém `main` consistente;
  - a dependência de publicação dos IDs locais antes do merge do destino está explícita;
  - os pontos de aprovação usam os cinco tipos do README e separam captura, publicação e merge.
- **Barreiras:** G1, G2 e G4 continuam fora com justificativa; o tratamento de G3 ficou adequado. Os artefatos revisados não contêm dados do usuário.
- **Gates executados nesta revisão (2026-10-19), sobre a `v2`:** `node --test scripts/validate-governance.test.mjs`, com 39/39 testes passando; `node scripts/validate-governance.mjs`, com 0 erros, 0 avisos e 4 itens manuais; `git diff --check` limpo.

**Veredito: `REQUER NOVA RODADA`.** Um bloqueador (R2-1) e duas ressalvas (R2-2 e R2-3). O plano `v2` permanece `Em Revisão`, com `Aprovação humana pós-revisão: Pendente`. Este parecer não aprova o plano nem autoriza correções, publicação, issues ou implementação.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 007 + revisar_plano + 007_plan/rodada-2 + v2`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `007` em `Planejamento`; plano `v2` em `Em Revisão`; `Veredito da revisão: REQUER NOVA RODADA` (rodada 1); `Aprovação humana pós-revisão: Pendente`; próximo passo `Aguardando revisão (rodada 2) — ciclo 007 (completo)`.
- `state_after`: ciclo `007` em `Planejamento`; plano `v2` em `Em Revisão`; `Veredito da revisão: REQUER NOVA RODADA` (rodada 2); `Aprovação humana pós-revisão: Pendente`; `### Rodada 2` registrada; próximo passo `Aguardando correções (rodada 2) — ciclo 007 (completo)`.
- `result`: `executed`
- `evidence`: solicitação humana "revise o plano do ciclo 007" em 2026-10-19; cabeçalho e bloco `## Próximo passo` atualizados; rodada registrada acima; preservação da rodada 1 conferida por hash; inspeção somente leitura das configurações de lint, tipos e testes, inclusive `ESLint.isPathIgnored`; gates de governança como descritos.
- `blockers`: R2-1 em aberto; a correção exige autorização do responsável.

### Resposta do autor à rodada 2 — v3

- **Autor:** Codex (GPT-6; variante não identificada no contexto).
- **Data e autorização:** 2026-10-19; nova solicitação "corrija o plano do ciclo 007", recebida após a rodada 2. Autoriza corrigir o plano localmente, não implementar o backlog ou criar commit/publicação do plano.
- **Base:** v2 em Em Revisão, com R2-1 bloqueador e R2-2/R2-3 ressalvas. A v3 mantém o último veredito histórico, sem antecipar o da próxima rodada. Rodadas 1 e 2 e resposta anterior preservadas conforme o hash do handoff.

| Achado | Resposta do autor | Onde conferir na v3 |
| :-- | :-- | :-- |
| R2-1 — bloqueador | Corrigido pelo autor pela alternativa b: worktree externo à árvore de qualquer checkout, sem ligação interna por junction/symlink, identificado por worktree list e pelo mesmo git-common-dir. É o mesmo repositório Git, portanto não cria dependência operacional entre repositórios. A solução dispensa alterar ESLint/TypeScript/CI | P4, Fila canônica local e justificativa de localização; Estratégia de testes; Item 1; Arquivos afetados; Riscos |
| R2-2 — ressalva | Acolhida: captura e manutenção fazem commit local somente de backlog, após G3 e staging seletivo. Publicação continua separada. Após squash, tip P publicado é conferido pela PR e só seus commits posteriores são reaplicados sobre a main conferida; conflito aborta sem perder capturas. Removida a cópia manual de diff e a referência auxiliar. Branch remota por base de lote evita force-push após a reconciliação | P4, autorização de captura, fila e publicação; Pontos de aprovação; ensaios de rebase e limite de publicação |
| R2-3 — ressalva | Acolhida: a divergência está somente em Fluxo por nível, item Ciclo completo. Entrada não trata de merge e não será alterada por esse motivo. Pontos de aprovação já contém a regra correta | Divergência R1-1; Arquivos afetados |

As respostas indicam o tratamento pelo autor e precisam de conferência na rodada 3; não são novo veredito ou aprovação. As novas permissões de commits locais são parte do contrato proposto para uso futuro, após integração, e não foram usadas para commitar o plano ou implantar a fila nesta sessão.

**Validação da correção (2026-10-19):** 39/39 testes existentes passaram; validador com 0 erros, 0 avisos e 4 itens manuais; whitespace limpo no diff e na comparação com a versão recebida. O histórico completo anterior foi comparado e preservado, com três respostas a R2-1/R2-2/R2-3. Inspeção de `eslint.config.mjs`, `tsconfig.json` e scripts de `package.json` sustenta a escolha de localização externa, sem afirmar execução dos gates da aplicação.

**Ensaio de Git isolado:** executado em diretórios temporários externos ao repositório, com conteúdo fictício e identidade Git local fictícia, sem rede ou push. Confirmou worktree externo com o mesmo Git comum, preservação de alterações não commitadas do checkout principal durante captura na fila, rebase após squash com somente um commit posterior pendente, alinhamento do caso sem commits posteriores e abort em conflito com corte ancestral conferido, preservando o tip e o conteúdo original. Isso prova os mecanismos locais de Git usados na proposta; não equivale a teste de PR/GitHub ou à implementação do workflow. Nenhum worktree operacional de backlog foi criado no projeto.

### Rodada 3

- **Autor:** Codex (GPT-6; variante não identificada), conforme a resposta da `v3`.
- **Revisor:** Claude Code, Claude Opus 5.5 (`claude-opus-5-5`).
- **Data e autorização:** 2026-10-19; solicitação humana "revise o plano do ciclo 007". Autoriza esta revisão formal e seu registro, sem aprovar, promover ou reescrever o plano e sem iniciar implementação.
- **Base:** branch local `chore/cycle-007-plan` @ `1d2f36773b7d90a269be5f27dbbcc85e3ca10672`; plano `v3` em `Em Revisão`; ciclo `007` em `Planejamento` (`Próximo ciclo: 008`); ideação e plano ainda não versionados, e somente o plano alterado. O estado remoto do GitHub não foi consultado.
- **Identidade da origem (UTF-8/LF):** SHA-256 do plano `v3` antes desta revisão: `1e3798169a2b77805440e3ee00e04a6c0b771619bedd6f341d3ab024a1bace3a`. SHA-256 do trecho de `## Problema e contexto` até imediatamente antes de `## Próximo passo`: `c5c5019ec2337847ce00c4f4e8ea06e7d27b949ba30e89eb45f22fa11927f70a`. A rodada 1 mantém o SHA-256 `81f812c11651e3907d9a7ee4995449c041b1bd5f956b0bd0d9c5d001a4dabd59`, e o texto da rodada 2 foi conferido por leitura e confere com o registrado por este revisor (ver R3-2 sobre o hash declarado na `v3`).
- **Template e autoridades lidos:** os mesmos das rodadas anteriores, mais a seção "Branches, commits e migrações" do README, os workflows de `.github/workflows/`, `release-please-config.json` e a ausência de hooks de commit (`core.hooksPath` vazio, sem hooks ativos em `.git/hooks`, sem husky ou lint-staged em `package.json`), para avaliar commits locais no worktree externo.

#### Conferência dos achados da rodada 2

- **R2-1 — atendido.** A alternativa (b) foi adotada: o worktree fica num diretório irmão `<checkout>-backlog`, com verificação de caminho real (sem junction ou symlink de volta para dentro do checkout), do mesmo `git-common-dir` e do registro em `git worktree list`. Assim a cópia fica fora de `eslint .` e dos globs relativos do `tsconfig.json`, sem alterar a configuração da aplicação. A regra de `ai_behavior.md` sobre checkout irmão será explicitada como relativa a dependências entre repositórios, o que é coerente com o texto atual e entra em "Arquivos afetados". O ensaio de isolamento dos gates foi acrescentado à estratégia de testes.
- **R2-2 — atendido.** O pedido de captura passa a cobrir um commit somente local de `_project/backlog.md`, com G3 e staging seletivo. Depois do squash, a reconciliação usa `git rebase --onto <main conferida> <P>` só para os commits posteriores ao tip publicado `P`, conferido pela PR, e aborta em conflito. A cópia manual de diff e a branch auxiliar saíram. Cada lote remoto usa uma branch própria por base, o que evita force-push. Não há hooks de commit que dependam de `node_modules` no worktree, e os workflows de CI não exigem vínculo com issue no corpo da PR.
- **R2-3 — atendido.** A divergência fica delimitada ao item "Ciclo completo" de "Fluxo por nível", e "Entrada" não é alterada.

#### Achados

- **R3-1 — ressalva: o diretório irmão pode exigir permissão a cada captura em ferramentas com sandbox.** Ferramentas de agente costumam limitar a escrita ao diretório de trabalho; é o caso do modo padrão de escrita do Codex e das permissões do Claude Code. Criar e editar `<checkout>-backlog` fica fora dessa área, e a captura pode passar a pedir aprovação de permissão ou parar por falta de capacidade, o que contraria o objetivo de captura "sem segunda confirmação rotineira". O plano já proíbe cair para uma localização interna, e `ai_behavior.md` já leva a "Parado" quando falta capacidade, então não há risco de violação. **Sugestão:** registrar no workflow `gerenciar_backlog` que a ausência de permissão de escrita no diretório irmão leva a "Parado" com orientação ao responsável (conceder a permissão ou ajustar a ferramenta), e avaliar esse atrito no ensaio, com o resultado na task.
- **R3-2 — ressalva: o hash da `v3` não prova o que declara.** O handoff e a resposta da `v3` dizem que o histórico recebido de "Revisão crítica" foi "preservado integralmente" com o SHA-256 `7dbf90f5…16cad`. Esse valor corresponde ao trecho de `## Revisão crítica` até `## Pós-mortem` já com a resposta nova do autor incluída; o trecho recebido, de `## Revisão crítica` até antes de `### Resposta do autor à rodada 2`, tem outro hash (`ef75d384…bf1c2ce`). A preservação real foi confirmada por esta revisão (hash da rodada 1 e leitura da rodada 2), então não há perda de histórico, só uma evidência descrita de forma imprecisa. **Sugestão:** em correções futuras, declarar o hash do trecho recebido, com os limites exatos.
- **R3-3 — ressalva: as novas convenções de nome precisam entrar na seção própria do README.** A `v3` cria a branch local `chore/backlog`, as branches remotas `chore/backlog-lote-<SHA>` e commits `docs(backlog): …`. A seção "Branches, commits e migrações" do README se declara "uma única convenção" e hoje não as prevê. A linha do README em "Arquivos afetados" cita "commits locais, lotes remotos", mas não essa seção. **Sugestão:** na implementação, acrescentar os nomes a essa seção, como exceção delimitada ao backlog, e registrar que esses commits não disparam release (o release-please usa a configuração padrão `node`, em que `docs` não altera versão).

#### Itens atendidos e verificações por inspeção somente leitura

- **Progresso:** os bloqueadores caíram de 3 para 1 e depois para 0, sem reaparecimento nem oscilação; foram 3 de 5 rodadas.
- **Contrato completo e coerente:**
  - a identidade e a alocação de IDs vêm de uma fila única, com trava, e o próximo ID inclui os commits ainda não publicados;
  - captura, publicação e merge têm autorizações distintas, e o merge sempre exige "aprovo o merge da PR #N", inclusive o da PR documental;
  - o backlog não guarda bloco de situação, e a observação fica com `retomar` e `health_check`, sem despacho;
  - os destinos usam identificadores estáveis, sem migração de links;
  - o enforcement automático fica restrito ao essencial, e o resto é declarado manual.
- **Pontos de aprovação:** usam os tipos e frases do README; "Aprovar plano" não cobre merge algum. Modo contínuo ausente, como exigido no nível completo.
- **Barreiras:** G1, G2 e G4 não se aplicam, com justificativa; G3 é conferida antes de cada gravação e em cada commit. Os artefatos revisados não contêm dados do usuário.
- **Gates executados nesta revisão (2026-10-19), sobre a `v3`:** `node --test scripts/validate-governance.test.mjs`, com 39/39 testes passando; `node scripts/validate-governance.mjs`, com 0 erros, 0 avisos e 4 itens manuais; `git diff --check` limpo.

**Veredito: `APTO COM RESSALVAS`.** Nenhum bloqueador; três ressalvas (R3-1 a R3-3), tratáveis na implementação sem mudar o contrato. O plano `v3` permanece `Em Revisão`, com `Revisão formal: Concluída` e `Aprovação humana pós-revisão: Pendente`. Este parecer não aprova nem promove o plano e não autoriza publicação, issues ou implementação; isso depende da manifestação humana posterior "aprovo o plano do ciclo 007", que deve considerar P1 a P6 e as ressalvas.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 007 + revisar_plano + 007_plan/rodada-3 + v3`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `007` em `Planejamento`; plano `v3` em `Em Revisão`; `Revisão formal: Em andamento`; `Veredito da revisão: REQUER NOVA RODADA` (rodada 2); `Aprovação humana pós-revisão: Pendente`; próximo passo `Aguardando revisão (rodada 3) — ciclo 007 (completo)`.
- `state_after`: ciclo `007` em `Planejamento`; plano `v3` em `Em Revisão`; `Revisão formal: Concluída`; `Veredito da revisão: APTO COM RESSALVAS` (rodada 3); `Aprovação humana pós-revisão: Pendente`; `### Rodada 3` registrada; próximo passo `Aguardando aprovação do plano — ciclo 007 (completo)`.
- `result`: `executed`
- `evidence`: solicitação humana "revise o plano do ciclo 007" em 2026-10-19; cabeçalho e bloco `## Próximo passo` atualizados; rodada registrada acima; preservação das rodadas 1 e 2 conferida por hash e leitura; inspeção somente leitura de README, CI, release-please e hooks de commit; gates de governança como descritos.
- `blockers`: nenhum achado bloqueador; aguarda aprovação humana posterior ("aprovo o plano do ciclo 007") e reconferência do estado remoto via `gh` antes da publicação documental.

## Registro de aprovação e publicação

### Aprovação humana da v3 — 2026-10-19

- **Manifestação recebida, literal:** "O plano está apto com ressalvas. Está aprovado o plano do cilo 007 v3".
- **Interpretação do alvo:** aprovação inequívoca da v3 do ciclo 007; o erro de digitação em "cilo" foi preservado no registro e não altera o alvo autorizado.
- **Precondição conferida:** rodada 3 concluída, com veredito `APTO COM RESSALVAS`, sem bloqueadores, antes desta manifestação. Status promovido a `Aprovado`, mantendo a versão v3 e o ciclo em `Planejamento`.
- **Integridade do conteúdo:** SHA-256 calculado sobre UTF-8 com quebras LF, desde a linha `## Problema e contexto` até imediatamente antes da linha `## Próximo passo`: `c5c5019ec2337847ce00c4f4e8ea06e7d27b949ba30e89eb45f22fa11927f70a`, igual à rodada 3. Esse trecho e o histórico recebido da revisão permanecem intactos. Esta aprovação altera metadados, handoff e este registro, sem reescrever o contrato revisado.
- **Cobertura:** P1 a P6 e ressalvas R3-1 a R3-3 consideradas na aprovação. Autoriza preparar/publicar a PR documental; não autoriza merge nem implementação. A divergência do README já registrada continua resolvida pela exigência de aprovação própria para cada PR.
- **R3-1 na implementação:** workflow deve parar e orientar o responsável se faltar permissão para o diretório externo; avaliar e registrar esse atrito na task, sem usar uma localização interna como fallback.
- **R3-2 como evidência:** preservar a ressalva histórica sobre o hash da v3; em registros futuros, declarar trecho, limites e normalização exatos. O hash desta aprovação verifica o corpo efetivamente revisado e não reutiliza o hash questionado do histórico.
- **R3-3 na implementação:** explicitar na seção `Branches, commits e migrações` do README as convenções `chore/backlog`, `chore/backlog-lote-<SHA>` e `docs(backlog):`; conferir/registrar que esses commits documentais não geram versão pelo release-please. Essas regras de uso futuro não são implementadas pela publicação do plano.
- **Pendências na aprovação:** PR documental e seus checks, aprovação específica de merge, integração, apresentação/confirmação do payload da issue e autorização de implementação. Nenhuma issue foi criada por esta aprovação.

### Publicação documental — 2026-10-19

- **PR:** [#81 — docs(cycle-007): registrar plano v3 aprovado do backlog](https://github.com/EuThiagoAndrade/saldo-futuro/pull/81), de `chore/cycle-007-plan` para `main`, criada sob a cobertura da aprovação do plano.
- **Escopo publicado:** somente `_project/cycles.md`, a ideação 007 e este plano; commit inicial de publicação `d546734`. Nenhuma regra canônica ou implementação do backlog foi alterada.
- **Validação local:** 39/39 testes de governança passaram; validador com 0 erros e 0 avisos; quatro itens manuais conferidos no escopo documental; diff e staging sem erro de whitespace e limitados aos três arquivos. Corpo revisado e histórico das rodadas comparados e preservados.
- **Estado:** PR aberta; checks e diff devem ser conferidos no GitHub. Não há aprovação de merge, integração, issue de entrega ou autorização de implementação registrada nesta publicação. A recomendação do bloco Próximo passo não concede essas autorizações.

### Integração documental — 2026-10-19

- **Autorização recebida:** "aprovo o merge da PR #81".
- **Precondições conferidas:** PR aberta e mergeable, base main, tip `41408e850932279c8c05e0b986dc33111ea2b681`, somente os três documentos previstos e todos os checks verdes (governança, CI de aplicação, CI de banco/autenticação e Vercel).
- **Resultado:** squash merge da [PR #81](https://github.com/EuThiagoAndrade/saldo-futuro/pull/81) no commit `687427e3fe21eddda0171e9e9c80a35a49a26303`, confirmado pelo GitHub e por fetch. Checkout local em main atualizado por fast-forward; comparação com a árvore do tip aprovado sem diferenças.
- **Limite:** o ciclo continua em Planejamento; nenhum backlog operacional, workflow, validador ou código foi implementado. Esta reconciliação e o payload ficam locais para a próxima entrega autorizada, sem push direto em main ou PR documental recursiva.

### Criação da issue de implementação — 2026-10-19

- **Confirmação recebida:** "Aprovado", em resposta à pergunta de criação do payload apresentado acima. Cobre somente a criação da issue, conforme explicitado na pergunta e em `.agent/workflows/criar_issues.md`.
- **Precondições conferidas:** plano v3 Aprovado, revisão APTO COM RESSALVAS e PR #81 integrada pelo commit `687427e3fe21eddda0171e9e9c80a35a49a26303`; consulta de duplicidade pelo título sem resultado antes da criação; Issue Form `.github/ISSUE_TEMPLATE/chore.yml` lido no ponto de uso.
- **Resultado:** [#82 — [CHORE] Instituir backlog de possibilidades na governança](https://github.com/EuThiagoAndrade/saldo-futuro/issues/82), criada via gh e conferida como OPEN. Nenhuma outra issue criada.
- **Payload efetivo:** mesmos cinco campos e conteúdo técnico do payload aprovado acima, na ordem do Issue Form. A única atualização de metadado substituiu "A criação aguarda confirmação deste payload" pela confirmação efetivamente recebida, sem alterar escopo ou critérios. O corpo remoto foi relido e comparado ao enviado, ambos normalizados para UTF-8/LF com whitespace externo removido, SHA-256 `a8ee03a9a20a9b5b383ee4b212f266d1f65e19620080da49a169ccdfd9a794e1`.
- **Rastreabilidade atual:** issue de entrega #82; PR documental #81 integrada; nenhuma PR, branch ou task de implementação. A tabela Rastreabilidade dentro do trecho revisado permanece como snapshot anterior à criação, preservando o hash do corpo aprovado; este registro e o GitHub contêm o estado efetivo.
- **Próximo ponto:** "autorizo a implementação da issue #82". Plano continua Aprovado e ciclo em Planejamento até o início autorizado da entrega; modo contínuo ausente. Registros desta criação ficam locais para integrar na próxima entrega autorizada, sem push direto em main.

### Início autorizado da implementação — 2026-10-19

- **Manifestação recebida:** "autorizo a implementação da issue #82".
- **Precondições:** main local e remota em `687427e3fe21eddda0171e9e9c80a35a49a26303`; issue #82 OPEN; plano v3 aprovado; nenhuma branch ou PR anterior da entrega.
- **Resultado:** branch `chore/issue-82` e task `007_task_issue-82.md` criadas; plano Em Execução e ciclo Em execução. Handoff corrente da execução na task; o handoff de criação de issue acima permanece histórico. Corpo aprovado preservado.
- **Limite:** autorização cobre implementação, validação e PR; merge e encerramento seguem os pontos próprios.

## Payload da issue de implementação

Preparado pelo Issue Form `.github/ISSUE_TEMPLATE/chore.yml`, com os campos na ordem desse template. Consulta no GitHub pelo título não encontrou issue existente antes desta preparação. A criação deve reconferir duplicidade e o estado integrado; não há número reservado ou inventado.

**Pergunta ao responsável:** confirma a criação da issue com o título e o corpo abaixo? A confirmação cobre somente a criação; a implementação terá autorização própria depois de existir o número real.

**Título:** `[CHORE] Instituir backlog de possibilidades na governança`

### Contexto

O ciclo 007 institui um registro de possibilidades para decisão futura. "Coloque no backlog" significa guardar para decidir depois, sem prioridade, promessa de entrega ou autorização de implementação. O plano v3 foi aprovado após veredito APTO COM RESSALVAS e integrado pela PR #81. Esta é a única unidade de implementação prevista, reunindo os itens 1 a 3 para manter contrato, consumidores e enforcement coerentes.

### Mudanças previstas

- Consolidar formato, IDs permanentes, estados Disponível/Encaminhado/Arquivado e limites de captura/publicação nas autoridades corretas; harmonizar o trecho de Fluxo por nível do README sobre aprovação própria de merge documental.
- Criar backlog vazio, template de item e workflow de gestão. Usar fila única em worktree externo do mesmo Git, trava local e commit local de captura após G3. Push/PR continuam dependendo da autorização do lote; cada merge exige aprovação própria.
- Publicar lotes em branches por SHA de base e reconciliar após squash por rebase apenas dos commits posteriores ao tip publicado, abortando em conflito e preservando IDs.
- Integrar seleção por IDs à triagem e aos artefatos dos três níveis, preservando síntese e recorte; registrar retorno na fila após integração comprovada do destino. Retomada e health check observam a situação sem bloco persistido no backlog.
- Estender manifesto, validador e testes somente ao enforcement essencial: arquivo, campos, IDs, estados, motivo de arquivamento, destino e referências existentes. Ajustar templates e auditoria necessários, sem interface, banco, automação recorrente, nova dependência ou população com exemplos.

### Critérios de aceite

- [ ] Pedidos inequívocos capturam somente a necessidade solicitada, com ID permanente, síntese abstrata e commit local; reexecução não duplica item, registro ou commit.
- [ ] Fila externa e Git comum conferidos; capturas durante outra issue/ciclo preservam branch, índice, diff e gates do trabalho principal. Lote pendente entra na alocação de IDs.
- [ ] Captura, push/PR e merge têm coberturas separadas. Commits posteriores ao lote publicado não entram na PR sem autorização de publicação.
- [ ] Estados, seleção múltipla/parcial, origem e destinos estáveis seguem P1 a P6; inclusão ou encaminhamento não equivale a entrega. Não há bloco de situação persistido no backlog.
- [ ] Enforcement essencial e regressões passam, sem reescrever artefatos históricos, adicionar dependências ou executar workflows pelo validador. Gates de governança e ensaios fictícios do plano têm evidências reais na task.
- [ ] R3-1: ausência de permissão ao worktree externo produz Parado com orientação; registrar o atrito no ensaio, sem fallback para diretório interno.
- [ ] R3-2: evidências de integridade declaram conteúdo, limites exatos e normalização do trecho verificado; não reutilizar o hash histórico questionado como prova de outro trecho.
- [ ] R3-3: registrar convenções de backlog em Branches, commits e migrações do README e conferir que docs(backlog) não gera versão pelo release-please.
- [ ] G3 é conferida antes de gravar e em cada commit/publicação; não entram dados privados ou exemplos reais. G1, G2 e G4 não se aplicam ao escopo documental proposto, com justificativa na task/PR.

### Dependências e autorizações

Plano v3 aprovado e integrado em main pelo commit `687427e3fe21eddda0171e9e9c80a35a49a26303` da PR #81. A criação aguarda confirmação deste payload. Após criar e conferir o número real, obter "autorizo a implementação da issue #N"; só então criar branch chore/issue-N e task 007_task_issue-N.md. Uma PR de implementação reúne os três itens e exige aprovação própria de merge. Encerramento em PR própria, sem issue recursiva, conforme o plano. Modo contínuo ausente.

### Ciclo e plano relacionados

Ciclo 007 — `_project/drafts/007_backlog_possibilidades/007_plan.md`, v3. Referência integrada: [plano no commit do merge](https://github.com/EuThiagoAndrade/saldo-futuro/blob/687427e3fe21eddda0171e9e9c80a35a49a26303/_project/drafts/007_backlog_possibilidades/007_plan.md). Escopo e critérios detalhados dos itens 1 a 3 permanecem nesse plano; esta issue não os amplia.

## Reconciliação e encerramento prospectivo — 2026-10-19

- Autorização recebida: "aprovo o merge da PR #83". Todos os checks verdes no tip 74acaaec6151b51c7217f29469a18762a309c443 e escopo conferido antes do squash. [PR #83](https://github.com/EuThiagoAndrade/saldo-futuro/pull/83) integrada em main no commit f62a9dc7e971aed7a9e359a5cf22348809f98820; [issue #82](https://github.com/EuThiagoAndrade/saldo-futuro/issues/82) fechada. Árvore integrada igual à aprovada.
- Itens 1 a 3 e P1 a P6 entregues na mesma PR; evidências dos critérios na task da issue. R3-1 a R3-3 tratadas ali. Corpo de Problema e contexto até antes de Próximo passo preservado em UTF-8/LF, SHA-256 reproduzível 969ac2941f09fb081d9ab0a985e49c999b94295ebf3b7d6847847835cccbbb11; divergência histórica documentada sem reescrever rodadas.
- A documentação viva já foi consolidada na PR #83: autoridades, workflow, templates, consumidores e auditoria. Não há alteração adicional de regras, ADR ou KB necessária. Backlog permanece vazio; não foi criada fila operacional ou item sem pedido.
- Task da entrega reconciliada; plano, tasks, cycles.md e movimentação para executed/ descrevem o estado prospectivo do encerramento. A situação efetiva antes desse merge é Aguardando merge, conforme PR e checks. Preparação coberta pela aprovação da v3; merge próprio ainda necessário. Rastreabilidade do corpo aprovado permanece snapshot histórico; números efetivos estão neste registro e no GitHub.

## Pós-mortem

- **Data de conclusão:** 2026-10-19, prospectiva até o merge da PR de encerramento.
- **Desvios:** nenhum de escopo; comparação de hashes históricos teve limites explicitados e evidência corrigida na task.
- **Lições comprovadas:** isolamento por worktree externo, lote por base e rebase somente dos posteriores foram demonstrados com Git fictício. A verificação estrutural não substitui equivalência, cobertura, privacidade e autorização manuais. Detalhes e limites dos ensaios permanecem na task, sem nova política paralela.
