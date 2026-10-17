# Lições aprendidas

Registro de aprendizados comprovados e reutilizáveis do repositório. Não use este arquivo como backlog, task corrente ou histórico de conversa.

As quatro primeiras lições foram herdadas do `euthiagoandrade-api` @ `9f79071bc619e826da4554f0f85e4ffe7f135f8b` (`.agent/lessons_learned.md`) e reescritas para este repositório no ciclo `000`. A data é a do registro original.

## Registros

### 2026-08-12 — Inputs de actions devem usar o nome documentado

Origem: ciclo `000` do api. O `actions/setup-node` interpretou `cache: false` como o nome literal de um gerenciador de pacotes e falhou antes dos testes. Para desabilitar a detecção automática de cache, o input correto é `package-manager-cache: false`. Quando uma divergência entre o gate local e o runner for confirmada, transforme-a em validação determinística e teste de regressão.

### 2026-08-13 — Aprovação do rascunho não substitui revisão formal

Origem: ciclo `001` do api. A aprovação humana do rascunho foi interpretada como autorização para marcar o plano `Aprovado` e publicar sua PR antes da revisão formal. Estados encadeados exigem evidência da transição anterior: o rascunho passa por `Em Revisão`, recebe veredito formal, e somente uma manifestação humana posterior pode aprová-lo. Quando uma falha procedural for comprovada, registre a regra na autoridade canônica e cubra a transição no validador, em vez de depender apenas da memória do agente.

### 2026-08-17 — Handoff estável precisa sobreviver à reexecução

Origem: ciclo `002` do api. Um handoff útil separa identidade lógica de tentativa operacional. Repositório, ciclo, workflow, alvo e revisão de origem identificam a operação; timestamp e UUID podem ser evidência, mas não criam uma nova operação. Workflows mutantes consultam o resultado existente, reconciliam a reexecução compatível e param com intervenção humana quando o estado é parcial, concorrente ou ambíguo.

### 2026-08-19 — Encerramentos exigem reconciliação pós-merge

Origem: api. Uma PR de encerramento tem duas fases: preparação pré-merge e reconciliação pós-merge. A regra autorreferencial impede registrar o próprio SHA dentro da PR, mas não elimina a atualização posterior da task, do handoff e dos registros canônicos. Após o merge, esses artefatos devem refletir o estado real; sempre que possível, o validador deve detectar inconsistências, como ciclo concluído com task ainda pendente.

### 2026-10-12 — Critérios devem expressar o objetivo verificável, não o mecanismo

Origem: ciclo `000`, ressalva S1. O critério "confirmar que a fonte expõe `tnum`" representava o objetivo "algarismos tabulares". A IBM Plex Sans 1.1.0 não tem `tnum` porque seus algarismos padrão já são tabulares, e o critério literal mandaria parar sem necessidade. Ao escrever critérios e ressalvas, declare o resultado mensurável (por exemplo, "todos os dígitos com a mesma largura de avanço") e, quando citar um mecanismo, deixe claro que ele é só um meio. Na divergência, meça o objetivo e leve a decisão ao responsável.

### 2026-10-12 — Testes não podem depender de maiúsculas e minúsculas no sistema de arquivos

Origem: ciclo `000`, PR #4. Um teste renomeava `pull_request_template.md` para `PULL_REQUEST_TEMPLATE.md` e esperava o arquivo ausente. No Windows, o sistema de arquivos ignora maiúsculas e o arquivo continuava encontrado, enquanto no runner Linux o teste teria outro resultado. Fixtures devem distinguir caminhos por nome ou diretório, nunca só pela caixa das letras, para que o gate local e o CI concordem.

### 2026-10-13 — A concessão de um gate não dispensa a verificação da sua precondição

Origem: ciclo `001`, PR #16. O responsável concedeu o Gate M-C, mas a precondição do plano (Gate H-C, a configuração externa de produção, concluído) não estava satisfeita e o agente não conseguia confirmá-la. O agente avisou da dúvida e fez o merge assim mesmo, tratando a concessão como confirmação. Não houve dano, mas o merge é irreversível e a ordem de execução mudou. Quando a precondição de um gate não puder ser verificada pelo agente, ele pergunta antes de agir e só prossegue com a confirmação explícita de que a precondição foi cumprida, e não apenas com a frase de concessão. Avisar da dúvida e agir em seguida não substitui perguntar.

### 2026-10-13 — Roteiros de serviço externo devem ser validados contra as exigências do próprio serviço

Origem: ciclo `001`, KB-002. O roteiro mandava publicar a tela de consentimento do Google, mas o Google só publica um app externo com página inicial e política de privacidade, que o produto não tinha; o responsável precisou decidir manter o modo de teste. Outras divergências surgiram na execução: o rótulo "Project ID" do Supabase, o endereço `localhost` herdado nas URLs e a ordem das variáveis na Vercel. Ao escrever um roteiro para um painel externo, liste as exigências e os limites do serviço (campos obrigatórios, planos, rótulos) a partir da documentação oficial, marque o que não foi verificado no painel e leve a divergência ao responsável antes da execução, não durante ela.

### 2026-10-13 — Conferir o comportamento da primeira execução de uma ferramenta de versionamento

Origem: ciclo `001`, issue #14. O release-please, sem nenhum release anterior, usa `initial-version` (padrão `1.0.0`) e ignora a versão `0.0.0` do manifesto; o plano esperava `0.1.0`. Isso só apareceu na primeira PR de release. Para ferramentas cujo comportamento inicial dependa de estado ainda inexistente, declare a opção explícita na configuração, cubra-a com um teste de configuração e confira o resultado real na primeira execução, em vez de presumir o padrão.

### 2026-10-13 — Em JavaScript, `String.replace` interpreta `$$` na substituição

Origem: ciclo `001`, PR #12 e PR #16. Scripts que editavam arquivos SQL com `replace(texto, "...$$...")` produziram `$` onde havia `$$`, quebrando as funções e os testes pgTAP, e o erro só apareceu ao rodar `supabase test db`. Em edições programáticas de texto com `$`, use uma função como substituição (`replace(texto, () => novo)`) ou separe e junte (`split(...).join(...)`), e rode o teste do arquivo editado logo em seguida.

### 2026-10-13 — Antes de concluir que uma rotina agendada falhou, compare a hora do primeiro deploy com a agenda

Origem: ciclo `001`, Gate V-C. Nenhuma chamada do cron diário aparecia nos logs da Vercel no dia do deploy. A consulta dos deploys de produção no GitHub mostrou que o primeiro deploy saiu depois do horário agendado (15h47 UTC contra 08h17 UTC), então a primeira chamada ainda nem era esperada. Ao verificar uma rotina periódica, confronte primeiro o horário do primeiro deploy com a agenda e a janela de tolerância do plano, em vez de tratar a ausência de registro como falha; e registre a data e a janela da primeira execução esperada.

### 2026-10-13 — Expressões regulares guardadas em JSON precisam de barra invertida dupla

Origem: ciclo `002`, PR #22. O padrão `\bGates? …\b` foi gravado no manifesto do validador com uma barra só. Em JSON, `\b` é o caractere de backspace, e não a fronteira de palavra, então a regra nunca casava e deixava passar o que devia reprovar. O teste negativo do cenário revelou o erro. Ao guardar uma expressão regular em JSON, escreva cada barra invertida em dobro (`\\b`, `\\d`), confira o valor lido com `JSON.parse`, e tenha sempre um caso que precisa reprovar.

### 2026-10-13 — Revisar um plano com outra ferramenta encontra o que o autor não vê

Origem: ciclo `002`, rodadas 1 a 3 do plano da reforma. O Codex, lendo só o repositório, encontrou 11 bloqueadores em duas rodadas num plano escrito pelo Claude. Entre eles: uma decisão que se apoiava em regras que a própria entrega apagaria, uma regra nova que reprovaria os históricos e uma retomada que esconderia bloqueios. Vários eram efeitos colaterais das correções da rodada anterior. Em mudança de regras ou de processo, prefira um revisor diferente do autor e trate cada rodada como capaz de criar problemas novos: o revisor confere as interações entre as correções, não só os achados antigos.

### 2026-10-14 — O dblink do Supabase local precisa de senha e do endereço do próprio servidor

Origem: ciclo `003`, issue #27. Os testes de concorrência abrem duas sessões pelo `dblink` dentro de `supabase test db`. A conexão para `127.0.0.1` falhou com "password or GSSAPI delegated credentials required": o `pg_hba` do contêiner dá `trust` ao loopback, e o `dblink` exige de quem não é superusuário uma credencial que seja de fato usada. Conectar ao endereço do próprio servidor (`host(inet_server_addr())`), que cai na regra `scram-sha-256`, com o usuário e a senha padrão do ambiente local, funcionou no local e no CI. Ao usar `dblink` em testes, derive o endereço da sessão corrente em vez de fixar nome de contêiner, e remova as fixtures que a outra sessão confirmou.

### 2026-10-14 — Em pgTAP, só as asserções podem imprimir "ok"

Origem: ciclo `003`, issue #27. Funções auxiliares que devolviam o texto `ok`, chamadas com `select` fora de uma asserção, imprimiram linhas que o `pg_prove` leu como resultados TAP: o teste acusou "Tests out of sequence" e um plano maior que o real. Passos de preparação devem devolver `void` e lançar erro na falha; textos de resultado só entram como argumento de `is()`, `throws_ok()` e afins.

### 2026-10-14 — Chaves estrangeiras de dados por usuário precisam de cascata coerente até `auth.users`

Origem: ciclo `003`, issue #27. A limpeza do teste de concorrência (`delete from auth.users`) falhou porque `posicoes_mensais` apontava para `ativos` sem cascata, enquanto as duas tabelas caíam em cascata a partir do usuário. O mesmo erro bloquearia a revogação de acesso da ADR-003 em produção. Ao criar tabelas de dados do usuário, confira que toda chave entre elas permite a exclusão do usuário, e teste essa exclusão com dados em todas as tabelas.

### 2026-10-14 — O recálculo cego de casos de referência encontra entradas ambíguas, não só contas erradas

Origem: ciclo `003`, issue #26. Outro modelo recebeu só as regras e as entradas dos casos, sem os valores esperados. Não achou nenhum erro de cálculo, mas expôs um caso sem saldo real informado, em que o componente de rendimento dependia de uma suposição, e um motivo de recusa diferente do que a KB nomeava. Ao validar casos de referência, entregue ao recalculador só as regras e as entradas, e trate cada divergência como possível lacuna da especificação antes de supor erro de quem recalculou.

### 2026-10-17 — Toda saída de workflow precisa declarar o próximo passo

Origem: ciclo `005`, merge da PR #56. A resposta confirmou a integração da issue #53, mas omitiu o bloco `PRÓXIMO PASSO`; o responsável precisou perguntar qual era a próxima ação. Ao encerrar uma solicitação regida por workflow, determine a situação efetiva pelo artefato, pelo plano e pelo estado atual do GitHub, especialmente depois de um merge, e apresente o bloco canônico completo: situação e alvo, quem age, o que conferir com link e a frase exata. Não repita a situação que acabou de ser superada nem deixe o próximo passo implícito. A frase do bloco indica o próximo ponto de aprovação e não autoriza por si só a mutação seguinte; após integrar a issue #53, por exemplo, o ciclo aguarda autorização própria para a #54.

### 2026-10-17 — O assunto do squash segue Conventional Commits, não o título da PR

Origem: ciclo `005`, PRs #55, #56, #58 e #59. Os merges por squash usaram o título da PR (`[CHORE]`, `[FEATURE]`, `[FIX]`), que é o prefixo das issues, como assunto do commit. O release-please não reconheceu nenhuma das entregas e não propôs a versão; a correção exigiu `BEGIN_COMMIT_OVERRIDE` nas PRs já integradas. Ao integrar, passe explicitamente o assunto convencional da entrega (`feat(issue-N): …`, `fix(issue-N): …` ou `chore(issue-N): …`, como em `_project/README.md`) e confira o assunto resultante em `main` antes de encerrar a entrega.
