# Plano de Implementação — Análises por instituição e níveis de classe

> **Ciclo:** `015`
> **Status:** `Em Execução`
> **Versão:** `v2`
> **Data de criação:** 2026-10-27
> **Última atualização:** 2026-10-27
> **Tipo:** `feature`
> **Prioridade:** `P2`
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 015" em 2026-10-27
> **Autorização do rascunho:** "autorizo o rascunho do plano do ciclo 015" em 2026-10-27
> **Autorização da correção:** "corrija o plano do ciclo 015" em 2026-10-27
> **Modo contínuo:** `—`
> **Autorização de implementação da unidade A:** "autorizo a implementação da issue #151" em 2026-10-27; recebida; execução iniciada na branch `feature/issue-151`, task `015_task_issue-151.md`.
> **Autorização de implementação da unidade B:** "autorizo a implementação da issue #152" em 2026-10-27; recebida; entregue pela PR #156.
> **Autorização de implementação da unidade C:** "autorizo a implementação da issue #153" em 2026-10-27; recebida; entregue pela PR #158.
> **Autorização de implementação da unidade D:** "autorizo a implementação da issue #154" em 2026-10-27; recebida; execução iniciada na branch `feature/issue-154`, task `015_task_issue-154.md`.
> **Revisão formal:** `Concluída`
> **Veredito da revisão:** `APTO PARA APROVAÇÃO`
> **Aprovação humana pós-revisão:** `Aprovada em 2026-10-27`
> **handoff_schema_version:** `2`

## Problema e contexto

Ideação: _project/ideations/015_analises_instituicao_niveis_classe.md.

## Objetivo

Oferecer no Início a distribuição por instituição e o detalhamento progressivo das classes nos níveis 2 e 3, com bases e arredondamento explícitos, dados incompletos representados e leitura coerente. Permitir editar o nome de ativos comuns em uso ou desativados, mantendo identidade, vínculos e regras de escrita. Não alterar saldos, eventos, fechamento ou retornos.

## Origem no backlog

Snapshot herdado da ideação, sem nova seleção nem alteração do item:

- **BL-009 — Metadados descritivos e classificação de ativos com aproveitamento do histórico:** selecionadas as visões analíticas por instituição e por classe nos níveis 2 e 3, em conjunto para este ciclo. Os campos descritivos e a visão macro foram encaminhados nos ciclos 012 e 013. O responsável informou em 2026-10-27 que já preencheu os dados descritivos dos ativos históricos migrados; é relato humano, não verificação de dados. A carga manual não integra esta seleção.
- Snapshot: `_project/backlog.md` na fila canônica, commit `84f0a5ea107f33e0de5c506b3ea0825346f6e58e`, presente em `origin/main` conforme a ideação; destino ciclo 015 em preparação. O item continua disponível e não foi alterado pela seleção. O mesmo commit é o HEAD local inspecionado neste rascunho.
- A edição do nome é extensão pedida diretamente pelo responsável durante a ideação; não deriva de BL-015. O retorno à fila, somente depois da integração comprovada do destino, usa a referência estável `ciclo 015`; sua publicação exige autorização separada.

## Contexto e baseline

- Repositório conferido pelo remoto `origin`: `EuThiagoAndrade/saldo-futuro`; HEAD `84f0a5ea107f33e0de5c506b3ea0825346f6e58e`, branch local `main`, versão `0.10.0`. Já existiam alterações locais em `_project/cycles.md` e a ideação 015 sem commit; preservadas. Não havia plano 015 nem diretório `drafts/`.
- A implementação atual da KB-004, seção 15, usa M, o último mês fechado, e só positivos na base. `distribuicao.ts` rateia por ativo, com desempate por saldo, nome e UUID; `alocacao.ts` agrega por macro antes de ratear e desempata pela ordem fixa das oito linhas. CR-53 a CR-61 e CR-C01 a CR-C12 são regressões obrigatórias.
- A taxonomia tem até três níveis; `ativos.taxonomia_id` aceita qualquer nó ou nulo. Instituição é opcional e tem FK composta por usuário. Ativos desativados com posição em M continuam participando. Trânsito não recebe classe nem instituição.
- `profiles.versao_classificacao` cresce por mudança de `taxonomia_id`; não detecta nome nem instituição. `marcaCarteira` usa contagens, meses/fechamentos e última desativação, sem nome. `lerComposicao` já descarta e repete até três vezes, com consultas frescas por `AbortSignal` em cada fase. Não basta reler nomes nem comparar estado final: A → B → A pode escapar.
- O Início alterna por URL `?distribuicao=ativo|classe`. Início e fechamento já usam `lerComposicao` para insumos financeiros. Ativos, Cadastros e páginas/formulários de lançamentos e transferências usam leituras paginadas simples, algumas em `Promise.all`, sem marca de composição; isso não prova necessidade de estender D13 a elas. A avaliação por consumidor abaixo limita a nova marca às três análises do Início, onde metadados determinam agrupamentos, ordem e percentuais. O fechamento conserva sua proteção financeira atual, sem RPC adicional por nome.
- `editar_detalhes_ativo_taxonomia` substitui os detalhes numa transação, sob `private.travar_carteira()`, mas não recebe nome. Nome admite 1 a 100 caracteres após `btrim`, nomes repetidos e referências por UUID. A validação atual do formulário usa `trim()` de JavaScript; isso difere de `btrim` nas bordas e precisa de casos explícitos na nova edição.
- Autoridades lidas no ponto de uso: `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, workflow `rascunhar_plano`, template `.agent/templates/plano_implementacao.md`, ideação 015, KB-003, regras pertinentes da KB-004, ADR-002, ADR-003, ADR-005, `design-system/DESIGN.md` e lições pertinentes. As estruturas propostas abaixo ainda não existem. Nenhum dado real foi lido.

## Escopo

### Dentro do escopo

- Distribuição por instituição atual dos saldos de M, com Sem instituição e Em trânsito, positivos agrupados, negativos por ativo e zeros omitidos.
- Exploração de macro → subclasse → tipo; vínculo direto no pai permanece numa linha própria, sem inferir descendentes. Duas colunas de participação, na carteira e no pai, nos detalhes.
- Nome editável no formulário existente, junto dos detalhes numa única transação, inclusive de ativo desativado; tipo de ajuste e trânsito continuam protegidos.
- Marca monotônica de metadados por usuário, RPC de leitura, nova RPC de edição com nome, migração aditiva compatível, proteção das composições das três visões do Início e testes de isolamento/concorrência. Avaliação das demais leituras afetadas, com decisões técnicas registradas por consumidor.
- KB-004 e fixtures com regras e casos independentes, contrato visual das novas interações no DESIGN.md, novidades e documentação viva, ação externa de banco, verificação em produção, release e encerramento.

### Fora do escopo

- Ler, preencher, migrar ou corrigir dados reais; histórico de nomes, instituições ou classificação; mudar o mês analisado por causa do filtro de rentabilidade.
- BL-015, novos atributos, alocação-alvo, nova árvore, classificação automática, cruzamento classe × instituição, filtros por instituição em outras telas ou edição do tipo de ajuste.
- Alterar algoritmos de retorno, eventos, fechamento ou o desempate existente por ativo/macro; remover RPCs antigas, tabelas legadas ou a marca de classificação neste ciclo.
- Pacotes novos, gráficos no cliente, modo contínuo, implementação ou publicação como efeito deste rascunho.
- Estender D13 às telas descritivas ou acrescentar a nova marca ao fechamento; suas leituras e validações atuais permanecem, conforme a avaliação por consumidor. A edição do nome não inclui bloqueio otimista ou atualização ao vivo de formulários abertos.

## Decisões e autoridades

### Registro das decisões do responsável

As decisões 1 a 8 da ideação, de 2026-10-27, são herdadas: M; atributos atuais; duas bases; resíduos explícitos; negativos antes de agrupar; navegação progressiva; maior resto; coerência incluindo A → B → A; edição do nome e efeito possível no centésimo do desempate por ativo.

Em resposta às duas perguntas durante este rascunho, em 2026-10-27, o responsável disse **"Concordo com a proposta"** em ambas:

- **D1 — Desempate novo:** classes pela ordem dos irmãos na árvore; "Classificado somente neste nível" depois dos filhos. Instituições por nome em pt-BR e UUID, depois Sem instituição e Trânsito. Em três grupos iguais de R$ 100, o primeiro nessa ordem recebe 33,34% e os demais 33,33%.
- **D2 — Participação na carteira nos detalhes:** ratear 100% entre todos os grupos da carteira na mesma profundidade e só depois selecionar o ramo exibido, mantendo linhas para classificações incompletas. Três grupos de R$ 100 num pai e um grupo externo de R$ 100 têm 25,00% da carteira cada; os três internos têm 33,34%, 33,33% e 33,33% do pai.

Essas concordâncias resolvem as escolhas financeiras do rascunho. Não são veredito formal, aprovação do plano nem autorização de implementação. A prioridade P2 é proposta de organização do plano, sem alterar prioridade do backlog.

### Registro da aprovação pós-revisão

- **Responsável:** "aprovo o plano do ciclo 015", em 2026-10-27, depois do veredito `APTO PARA APROVAÇÃO` da Rodada 2, sobre a v2, sem novos achados ou ressalvas.
- **Resultado:** v2 promovida de `Em Revisão` para `Aprovado`, preservando escopo, decisões e as duas rodadas. O ciclo continua em `Planejamento` até o início autorizado da execução.
- **Alcance:** publicação da PR documental com ideação, plano e registro do ciclo; criação das issues A–D somente depois da integração documental e da apresentação/confirmação dos payloads. O encerramento posterior segue coberto pela aprovação, com suas precondições.
- **Limites:** merge documental exige sua aprovação própria e checks verdes. Implementação exige issue e autorização específica; E1 e V continuam humanos e separados. Modo contínuo permanece `—`.

### Contrato financeiro

1. **Entradas e bases:** todas as posições de M, inclusive de ativos hoje desativados. Validar cada quantia como inteiro seguro e converter a `bigint` antes de somar. Separar negativos por ativo e omitir zeros antes de agrupar. S é a soma de todos os positivos, incluindo ausências e trânsito; um agrupamento e S podem superar a faixa de uma posição. Não limitar nem usar ponto flutuante para ratear.
2. **Instituição:** cada positivo vai para a instituição atual por ID, Sem instituição se o vínculo for nulo, ou Em trânsito com precedência para o ativo de sistema. ID não nulo sem entrada legível é erro da visão, nunca Sem instituição. Nomes não são identidade. A ordem de desempate é nome por `Intl.Collator("pt-BR")`, UUID canônico minúsculo em ordem textual; entradas especiais ficam depois das instituições, Sem instituição antes de Em trânsito. Empate de resto usa essa ordem diretamente, mesmo com saldos diferentes. Apresentar por saldo decrescente, empatando pela mesma ordem. Na raiz, o pai é a carteira: há só uma coluna "% da carteira", evitando duplicar percentuais idênticos.
3. **Classe e fronteiras globais:** manter a raiz macro e seu rateio atuais. Para a profundidade 2, todos os positivos classificados em nível 2 ou 3 sobem ao ancestral de nível 2; vínculos diretos em cada macro ficam no resíduo dessa macro. Para a profundidade 3, os vínculos em tipos vão ao tipo; os diretos em subclasses ficam no resíduo dessa subclasse, e os diretos em macros permanecem no resíduo da macro. Trânsito e Sem classe continuam como grupos próprios em ambas as fronteiras. Cada posição positiva entra exatamente uma vez em cada fronteira; a soma dos grupos de cada profundidade é S. Nó/caminho inválido é erro, não ausência de classificação.
4. **Desempate de classes:** percorrer as raízes na ordem já vigente e, dentro de cada ramo, irmãos por `ordem`, com resíduo do pai depois de seus filhos. Essa travessia define a ordem dos grupos em cada fronteira; Em trânsito e Sem classe vêm por último, nessa ordem, como na raiz atual. UUID textual é salvaguarda final, sem substituir a validação de unicidade de ordem da árvore. Renomear um nó não muda esse desempate. Apresentar filhos por saldo decrescente, com essa ordem no empate; o caminho completo distingue nomes iguais em ramos diferentes.
5. **Maior resto:** para uma partição positiva de base B, calcular piso `V * 10000 / B` e resto `V * 10000 % B`, em `bigint`. Repartir as unidades faltantes pelos maiores restos, empatando por D1. Somar primeiro os saldos do grupo, sem somar percentuais arredondados dos ativos. Participações são inteiros de centésimos de ponto percentual, apresentados com duas casas, sem arredondamento adicional.
6. **Duas bases independentes:** "% da carteira" na raiz usa o rateio macro existente; no detalhe usa o rateio global da respectiva fronteira de D2. "% do pai" usa outro rateio, entre os filhos imediatos positivos do pai e seu resíduo positivo, com base no total positivo desse pai. Cada conjunto local completo soma 10000. Não multiplicar percentuais arredondados nem recalcular a coluna da carteira só entre os filhos do ramo visitado. O total de valores dos filhos mais resíduo reconcilia exatamente com o pai; seus percentuais da carteira podem diferir do percentual arredondado do pai. **O detalhe não exibe linha do próprio pai nem linha de total, em tabela, cartão, título ou resumo numérico.** O título identifica só caminho e M; cada linha numérica corresponde a filho imediato ou resíduo. A participação do pai continua visível ao voltar à visão anterior, calculada naquela fronteira, nunca pela soma dos percentuais arredondados dos filhos.
7. **Limites de detalhamento:** só macro e subclasse têm aprofundamento; tipo é terminal. O resíduo "Classificado somente neste nível" representa vínculo direto ao pai e é terminal, com caminho no rótulo acessível. Sem classe e trânsito também são terminais. Mesmo num pai sem filhos de catálogo, seus vínculos diretos continuam no resíduo quando esse pai for detalhado. Nenhuma regra reparte resíduo entre filhos. Uma linha positiva com participação arredondada zero continua visível.
8. **Negativos e ausência de base:** negativos são listados por ativo, sem percentual, na ordem existente (saldo crescente, nome pt-BR, UUID), identificando instituição ou caminho da classe atual. No detalhe, listar os negativos pertencentes ao ramo; os demais continuam acessíveis ao voltar à raiz. Não compensar positivo com negativo do mesmo grupo. Sem positivos, não dividir nem mostrar total de 100%; negativos continuam. Sem M, vale o estado vazio atual. Pai sem positivo mostra estado vazio de positivos, sem percentuais, mantendo seus negativos.
9. **Nome:** editar nome muda o nome exibido também em registros antigos e pode mudar ordem/centésimo da distribuição por ativo, conforme decisão 8 da ideação; não grava nome histórico nem altera posição. As análises por classe/instituição agregam antes de ratear e não usam nome de ativo no desempate dos grupos. Renomear instituição pode mudar seu desempate em D1; é consequência da regra escolhida por nome. A validação do nome da nova edição usa a semântica do banco: `btrim` de espaço comum e 1 a 100 caracteres Unicode; não impor unicidade nem limpar acentos ou espaços internos. Não ampliar esta mudança à criação sem necessidade demonstrada.

### Casos de referência a incorporar na KB-004 e nas fixtures

Todos os nomes, valores e instituições abaixo são fictícios. As expectativas são especificação deste plano, não resultados de testes executados. Os identificadores CR-015-* são propostos para os novos casos; preservar os casos anteriores. Calcular os esperados por contas independentes do módulo de produção e registrar entradas, ordem e resultados completos na unidade B.

| Caso | Entradas e regra exercitada | Resultado esperado |
| :-- | :-- | :-- |
| CR-015-01 | Instituição A: +R$ 200 e −R$ 50 em ativos diferentes; B: +R$ 100; outro ativo zero | S = R$ 300; A = R$ 200 e 66,67%; B = R$ 100 e 33,33%; negativo de R$ 50 separado, zero omitido |
| CR-015-02 | Instituição A, Sem instituição e Trânsito: +R$ 100 cada | S = R$ 300; 33,34%, 33,33%, 33,33%, nessa ordem de desempate |
| CR-015-03 | Irmãos C1, C2, C3 com R$ 100 cada; outro grupo externo de R$ 100 | Filhos: 25,00% da carteira cada; do pai: 33,34%, 33,33%, 33,33%; pai: 75,00% da carteira |
| CR-015-04 | Macro de R$ 400: R$ 300 em subclasse e R$ 100 direto na macro; R$ 600 fora dela | Macro 40,00%; subclasse 30,00% da carteira/75,00% do pai; resíduo 10,00%/25,00% |
| CR-015-05 | Dentro da subclasse de R$ 300 do caso 04, R$ 180 direto e R$ 120 num tipo | Detalhe: resíduo 18,00% da carteira/60,00% do pai; tipo 12,00%/40,00%; os R$ 100 diretos na macro não entram nesse pai |
| CR-015-06 | Duas macros com três subclasses de R$ 1 cada, na ordem global C1 a C6 | Raiz: 50,00% por macro. Fronteira: C1 a C4 = 16,67%, C5/C6 = 16,66%; primeiro ramo soma matematicamente 50,01%, segundo 49,99%. Localmente cada pai soma 100,00% (33,34/33,33/33,33). No detalhe aparecem só três linhas de filhos de R$ 1, com as duas participações; não há linha do pai/total nem resumo numérico dessa soma. Ao voltar à raiz, o pai continua com R$ 3 e 50,00% |
| CR-015-07 | Ordem de desempate C1, C2, C3; valores R$ 1, R$ 7, R$ 4 | Base R$ 12; restos iguais; C1 recebe a unidade: 8,34%, 58,33%, 33,33%, apesar de não ser o maior saldo |
| CR-015-08 | Filho e resíduo do pai: R$ 100 cada; outro irmão R$ 100, com empate completo | Irmãos vêm antes do resíduo na ordem da árvore; o primeiro filho recebe 33,34% do pai; demais 33,33% |
| CR-015-09 | Sem positivos; negativos e zeros com e sem classificação/instituição | S = 0; sem divisão, rosca ou participações; negativos preservados e zeros omitidos |
| CR-015-10 | Uma única linha positiva; ou 1 centavo diante de 1.000.000 de centavos | No primeiro cenário, 100,00%; no segundo, a linha de 1 centavo continua com 0,00%, maior com 100,00% |
| CR-015-11 | Dois positivos de 9.007.199.254.740.991 centavos no mesmo grupo | Soma exata 18.014.398.509.481.982 centavos, 100,00%; sem perda de precisão nem recusa da soma intermediária |
| CR-015-12 | Posição histórica de ativo hoje desativado; mudar instituição/classe atual | Continua participando com o mesmo saldo; muda somente agrupamento atual, sem alterar M ou retorno |
| CR-015-13 | Nós de mesmo nome sob pais diferentes; instituição com ID ausente; nó inválido | Nós não se misturam; referências inválidas recusam a visão, sem converter para linha de ausência |
| CR-015-14 | Por ativo, três nomes fictícios A/B/C com R$ 100 cada; renomear A para Z | Antes A = 33,34%; depois B = 33,34%; cada saldo e a soma permanecem; classe/instituição mantêm seus percentuais se os vínculos não mudarem |
| CR-015-15 | Três instituições A/B/C com R$ 100 cada; renomear A para Z | Antes A = 33,34%; depois B = 33,34%; demais 33,33%. A unidade de 0,01 p.p. segue a nova ordem por nome; UUID preserva identidade. Testar também empate de colação com UUID como último desempate |
| CR-015-16 | Instituição A com R$ 1, Instituição B com R$ 7 e Sem instituição com R$ 4 | S = R$ 12; pisos 833/5833/3333 e restos iguais; A recebe a unidade pela ordem de desempate: 8,34%, 58,33%, 33,33%. Apresentação por saldo: B, Sem instituição, A; não usar o maior saldo para desempatar restos |

### Coerência e contrato do banco propostos

- Criar por migração nova `profiles.versao_metadados` (`bigint` não negativo, inicial zero) e `ler_versao_metadados()` retornando **texto decimal**, sob RLS do próprio perfil, sem parâmetro de dono nem bypass de admin. Preservar `versao_classificacao` e sua RPC para os consumidores antigos.
- Triggers incrementam a nova versão na mesma transação de inserção/remoção de ativo comum e de mudança efetiva em `nome`, `instituicao_id` ou `taxonomia_id`, e de inserção/remoção/renomeação de instituição. Triggers cobrem RPCs novas e existentes; não depender só do frontend. Usar `IS DISTINCT FROM` para nulos e evitar incremento em escrita idêntica. A → B → A em transações confirmadas produz incremento mesmo com estado final igual; rollback não persiste incremento; overflow aborta a escrita. Na cascata de exclusão do usuário, não impedir a remoção por ausência de perfil: provar em teste dedicado.
- Manter trava por usuário como primeiro passo das RPCs mutantes; não criar segunda ordem de locks. Revisar triggers quanto a cascatas e escrita por migração. O contador pode aumentar mais de uma vez na mesma transação sem problema; não prometer incremento unitário quando há instituição nova e atualização de ativo.
- Nova RPC com nome distinto, proposta `editar_ativo_com_nome`, recebe ativo, nome e todos os detalhes atuais, usa a trava, `auth.uid()` e filtros de dono. Resolve instituição e valida taxonomia antes de atualizar nome e detalhes juntos; qualquer recusa reverte tudo, inclusive instituição recém-criada e contador. Não recebe `user_id`, `tipo_ajuste`, `sistema` ou `ativo` como campos editáveis. Aceita desativados, recusa trânsito, desconhecido, outro usuário e admin tentando atingir outro dono. Nomes repetidos continuam válidos.
- Fixar `search_path`, revogar `execute` de `public`/`anon`, conceder explicitamente só o necessário a `authenticated`; helpers privados não são executáveis pela Data API. Nenhum grant de escrita direta em tabelas. Reutilizar a resolução segura da instituição, sem aceitar FK de outro dono. Não editar migrações anteriores nem trocar a assinatura da RPC antiga.
- Nas três visões do Início, marca de composição = marca atual da carteira + nova versão de metadados. A aplicação nova **não chama `ler_versao_classificacao()` nessas composições**, pois o novo contador já cobre toda mudança de `taxonomia_id`. Preservar a coluna, o trigger e a RPC antigos no banco para compatibilidade com a aplicação anterior, sem ler as duas versões na aplicação nova. Ler marca financeira e versão de metadados em paralelo **dentro** de cada fase, ambas antes dos insumos e novamente depois; usar `AbortSignal` fresco em cada fase/consulta. Paginar todos os ativos, instituições, nós e posições necessários à visão, conferindo contagens e ordem total. Falha de RPC, marca inválida ou versão indisponível é erro, sem fallback para contador zero. Integrar o novo contador somente nos leitores do Início; não inseri-lo em `marcaCarteira`, preservando os demais consumidores dessa função.
- Uma mudança descarta a composição inteira e repete até três vezes; esgotamento mostra a mensagem recuperável atual. Conferir referências de instituição/árvore do conjunto aceito; nunca renderizar categorias fictícias para uma falha de leitura. Mudança do catálogo global por migração segue fora do contador por carteira; manutenção concorrente da árvore não faz parte deste ciclo e exige sua própria janela.
- **Limite da unidade C:** proteger as leituras das duas visões atuais do Início e preparar/testar o leitor por instituição para conexão na unidade D. Na unidade D, instituição e os níveis 2/3 usam o mesmo contrato, sem envelopes aninhados independentes. A avaliação abaixo documenta por que os outros consumidores não recebem uma nova composição. Manter sessão por chamada e validação dos IDs no servidor em todos os fluxos.
- Preservar `lerInsumosDoFechamento`, suas marcas financeiras e os leitores descritivos. O migrador histórico não ganha funcionalidade nem execução. Tipos/mocks só mudam se indispensáveis aos leitores do Início; não ampliar contratos de leitura compartilhados sem necessidade. A prova nova de coerência cobre as análises do Início, sem prometer atualização ao vivo ou um snapshot global das demais telas.

### Avaliação por consumidor — resposta a R1-1

Esta tabela é a investigação técnica das decisões 7 e 8 da ideação, não autorização de funcionalidades novas. "Sem marca nova" preserva a semântica atual: dados são lidos na requisição e a escrita é revalidada por UUID pelo banco. Uma renomeação não muda dono, UUID, estado ativo ou tipo de ajuste. Quando há formulário aberto, nome antigo continua sendo rótulo do mesmo ID; recarregar lê o atual. Não prometer nomes históricos nem impedir alterações concorrentes do formulário.

| Consumidor e fonte | Metadados lidos e resultado dependente | Efeito observável de estado misto | Decisão e justificativa |
| :-- | :-- | :-- | :-- |
| Início — Por ativo (`src/app/(app)/page.tsx`, `lerInsumosDoInicio`) | Nome e UUID de cada ativo com posição; ordenação, desempate do maior resto, cinco principais e Outros | Renomear entre páginas pode combinar nomes que nunca coexistiram e atribuir o centésimo/ordem com esse conjunto | **Proteger** com carteira + metadados; resultado numérico e agrupamento dependem do nome. |
| Início — Por classe, raiz e níveis 2/3 (`lerInsumosDoInicioPorClasse` e novo detalhe) | Vínculo atual, árvore, nomes de ativos nos negativos; grupos, resíduos e duas bases | Reclassificação entre leituras pode colocar posições em ramo inadequado ou misturar composição e negativos; A → B → A escapa da comparação do vínculo final | **Proteger** com carteira + metadados, que já cobre taxonomia; dispensar a RPC antiga de classificação na aplicação nova. |
| Início — Por instituição (leitor novo) | `instituicao_id`, catálogo de instituições e nomes; grupos, ordem de empate e percentuais | Vínculos e catálogo de instantes diferentes podem associar rótulo incorreto, perder referência ou mudar o centésimo sobre nomes mistos | **Proteger** com carteira + metadados na mesma composição que ativos e posições, inclusive A → B → A. |
| Fechamento — prévia e ação (`src/lib/telas/leituras.ts`, `src/lib/telas/fechamento.ts`, `lancamentos/fechamento/acoes.ts`) | Nome como rótulo/mensagem; cálculo recebe UUID, tipo, estado ativo, eventos e saldos, não nome/instituição/classe | Nome pode ser o anterior ou o novo, sem mudar campo de saldo real, ativo calculado ou resultado. Reclassificar/trocar instituição não entra no cálculo | **Sem marca nova**; manter `lerInsumosDoFechamento` e a marca financeira atual. Nome não decide valor nem elegibilidade; mais retries por nome não acrescentam correção financeira. |
| Ativos — ambas as abas (`src/app/(app)/ativos/page.tsx`) | Nome, classe/legado, instituição; ordenação e descrições da lista, links e desativação por UUID | Rótulos podem refletir instantes diferentes; ordenação é feita com os nomes efetivamente lidos. Desvincular e excluir instituição entre consultas pode deixar descrição ausente, corrida preexistente à nova edição | **Sem marca nova**; não há rateio/valor derivado. Nome não muda o alvo de Editar/Desativar, e a RPC revalida dono/saldo. Não expandir para snapshot descritivo da lista. |
| Editar ativo (`src/app/(app)/ativos/[id]/editar/page.tsx`) | Nome e detalhes atuais para preencher campos; catálogos para opções, ID do alvo e aba de retorno | Formulário pode abrir com nome anterior ou opção renomeada; instituição removida após leitura é recusada se enviada. Nome e detalhes em uma linha do ativo são lidos juntos, sem reconstrução por nome | **Sem marca nova na leitura**; alteração solicitada fica no campo/ação/RPC atômica. Toda escrita revalida dono, trânsito e FKs. Não introduzir controle de edição otimista. |
| Novo ativo (`src/app/(app)/ativos/novo/page.tsx`) | Taxonomia global e nomes/IDs de instituições; opções e sua ordem | Nome de opção pode ficar anterior; ID continua o mesmo; remoção concorrente pode tornar a opção inválida no envio | **Sem marca nova**; cadastro resolve e valida instituição/nó no banco. Leitura marcada não protegeria o intervalo entre abrir e enviar. |
| Cadastros (`src/app/(app)/cadastros/page.tsx`, `src/lib/telas/catalogos.ts`) | Nomes de instituições e contagem de vínculos; texto de uso e oferta de Excluir | Renomear só muda rótulo/ordem; vínculo concorrente pode desatualizar contagem e botão, corrida já existente | **Sem marca nova**; `excluir_instituicao` sob trava recusa entrada em uso. Nome não controla a contagem nem o ID da ação; não ampliar a entrega para sincronização desse estado descritivo. |
| Novo lançamento (`src/app/(app)/lancamentos/novo/page.tsx`) | Nome, UUID, estado ativo e sistema para opções; busca/ordem por nome | Rótulo antigo ainda envia o UUID escolhido; não transfere a seleção a outro ativo com nome igual | **Sem marca nova**; manter seleção confirmada por UUID e validação da RPC. Renomear não altera a elegibilidade nem o montante. |
| Lançamentos — lista, filtro e ajustes (`src/app/(app)/lancamentos/page.tsx`) | Nomes dos ativos como rótulos de eventos/ajustes e opções do filtro | Nome anterior ou novo aparece para o mesmo `ativo_id`; montantes e filtro não são calculados por nome | **Sem marca nova**; manter leitores e filtros por UUID, sem alteração de cálculo, agrupamento financeiro ou integridade das referências. |
| Lançamento — detalhe (`src/app/(app)/lancamentos/[id]/page.tsx`) | Nome do ativo na descrição; evento e ação de estorno por ID | Rótulo pode ser anterior; valor, estornabilidade e alvo continuam definidos pelo evento, não pelo nome | **Sem marca nova**; manter validações e leitura atuais, com regressão do nome atual após nova requisição. |
| Transferências — lista e formulário na mesma página (`src/app/(app)/transferencias/page.tsx`) | Nomes de origem/destino e opções por UUID; pernas, montante e correção por IDs | Rótulos podem ficar anteriores, sem trocar pernas ou seleção; o mesmo array de ativos fornece opções e trajetos | **Sem marca nova**; envio/correção revalidam IDs no banco. Não criar composição para a tela nem supor uma rota separada de Nova transferência. |

Não foi identificado outro cálculo ou decisão de escrita que passe a depender do nome com esta mudança. As corridas descritivas preexistentes acima não são declaradas resolvidas; se a implementação demonstrar efeito novo em cálculo, isolamento ou integridade, parar e apresentar a evidência antes de ampliar o escopo. Essa conclusão limita o mecanismo técnico, preservando as capacidades solicitadas na ideação.

### Interface e acessibilidade propostas

- Manter Por ativo e Por classe e acrescentar Por instituição (`?distribuicao=instituicao`) no mesmo `nav`, sem contadores. Links preservam período; o formulário de período preserva visão e ramo. Parâmetro ausente/desconhecido abre Por ativo. Ler apenas os catálogos necessários à visão; a marca comum de nomes continua em todas.
- Por classe na raiz mantém a rosca macro existente. Links explícitos na legenda/tabela abrem macro e subclasse, com parâmetro proposto `classe=<UUID-do-pai>` e caminho navegável de volta. Tipo, ausência e trânsito não têm link de aprofundamento. Ramo não é mantido ao trocar para outra visão. UUID/parâmetro inválido ou nó terminal solicitado como pai volta à raiz com mensagem simples; referência inválida nos dados é erro, conforme contrato financeiro.
- No detalhe de classe, apresentar título com caminho, mês M e aviso de que a classificação é atual, sem quantia ou participação do próprio pai. Tabela no desktop e cartões no celular com Nome, Valor, "% da carteira" e "% do pai", somente para filhos imediatos e resíduo; sem linha de pai/total, rodapé totalizador ou resumo numérico no título. Nomes completos com quebra, sem rolagem horizontal. Esse detalhe usa números e links, sem introduzir nova paleta/rosca com dezenas de categorias. Resíduo sempre identificado como "Classificado somente neste nível" e sem aprofundamento. Explicar perto das colunas que as bases são diferentes e os arredondamentos são independentes; ao voltar, o pai mantém seu rateio da visão anterior.
- Por instituição reutiliza o padrão da rosca por ativo: até cinco maiores linhas positivas e Outros (seis fatias), calculando participações antes do agrupamento; Outros soma saldos e percentuais dos seus componentes, sem novo rateio. Instituições especiais participam da mesma ordenação por saldo e podem estar em Outros, mas sempre têm componentes identificados. Legenda com detalhes, tabela completa por instituição e negativos por ativo; nunca somar Outros com seus componentes na mesma tabela. Não acrescentar navegação por instituição nem desdobramento de ativos positivos.
- A nova edição substitui somente a leitura do Nome por campo rotulado e preenchido, com validação e erro acessíveis. Tipo de ajuste permanece para leitura. Explicar que o nome atual aparece também nos registros antigos. Salvar usa uma chamada transacional; sucesso volta à aba de origem; recusa mantém formulário/valores e informa motivo. Trânsito continua sem formulário.
- Ocultar valores atua no servidor em quantias, totais, legendas, cartões, tabelas, títulos e atributos acessíveis; nomes e participações continuam visíveis conforme contrato atual. Não introduzir payload de cliente ou dados serializados com quantias escondidas. Estados vazio, erro e recuperação seguem DESIGN.md 6.11; indisponível não vira zero.
- Alvos de 44 px, links por Tab/Enter com `aria-current`, foco visível, navegação voltar/avançar, nomes longos e mesma informação em celular/desktop. Conferir largura útil mínima de 360 px, com atenção a cartão de meia coluna no desktop e movimento reduzido. Emendar DESIGN.md 6.8, 6.12 e 6.13 nas respectivas entregas; sem token novo.

### Pontos de aprovação

| Ponto | Precondição | Cobre | Não cobre | Conferir |
| :-- | :-- | :-- | :-- | :-- |
| Autorizar rascunho: "autorizo o rascunho do plano do ciclo 015" | Ideação registrada; recebido em 2026-10-27 | Este plano local, decisões e reconciliação do registro | Revisão formal, publicação, issues ou código | Ideação 015, D1/D2 e diff documental |
| Aprovar plano: "aprovo o plano do ciclo 015" | Revisão formal apta; manifestação humana posterior; bloqueadores resolvidos | Promoção, publicação da PR documental, issues depois da integração e apresentação/confirmação de payloads; encerramento posterior | Merge documental, implementação, produção | Revisão, contratos financeiros, critérios, decomposição e limites |
| Aprovar merge: "aprovo o merge da PR #N" | PR concreta, checks verdes e precondições da entrega comprovadas | Somente merge daquela PR por squash | Próxima issue, db push ou verificação de produção | Diff, checks, escopo e assunto Conventional Commits; vale para documental, A–D, release e encerramento |
| Autorizar implementação: "autorizo a implementação da issue #N" | Plano aprovado/integrado; issue existente; dependências satisfeitas | Uma unidade A, B, C ou D, seus testes e PR | Outras unidades, merge ou ações em produção | Payload correspondente, critérios e task |
| Ação humana externa: "concluí a ação externa da issue #N" | Unidade A integrada; roteiro E1 preparado | Registro da ação feita pelo responsável e conferência acessível | Execução pelo agente, leitura de carteira real ou dispensa de verificação | E1, migrações e compatibilidade; só resultados sanitizados |
| Verificar produção: "autorizo a verificação em produção do ciclo 015" | E1 concluída; A–D integradas; deploy compatível confirmado | Roteiro V com responsável na parte autenticada | Alterar dados reais para teste, configurar ou migrar | Comportamento e privacidade; sem prints/valores reais |

Cada merge tem aprovação própria. Parar diante de escolha financeira nova, escopo ampliado, ambiguidade de estado, isolamento/privacidade não comprovados, falha de precondição ou ferramenta indisponível. Modo contínuo proibido. Não encadear a revisão ao salvar este rascunho.

## Barreiras de domínio

| Barreira | Aplica-se? | Como o ciclo a atende ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim | D1/D2 e ideação como decisões humanas; contrato e casos CR-015-* independentes na KB-004/fixtures; regressões por ativo e macro; `bigint`, duas bases e negativos antes de agrupar |
| G2 — isolamento por RLS | Sim | Nova RPC de escrita/leitura, triggers por dono, grants mínimos e RLS preservada; testar dois usuários, admin sem bypass e anon; referências compostas e exclusão do usuário |
| G3 — privacidade de dados | Sim | Só fixtures fictícias, sem carteira real; revisão manual de textos/diff e HTML de ocultação; validador antes de commit/publicação; dados reais nunca em evidência |
| G4 — migrações só acrescentam | Sim | Migração nova `AAAAMMDDHHMMSS_assunto.sql` criada na implementação, sem alterar/renomear/remover migração versionada; ensaio de upgrade e CI |

## Estratégia de testes

**Neste rascunho documental:** testes do validador de governança, execução do validador, `git diff --check` e inspeção de status/diff. Não executar testes da aplicação para atribuir evidência a código ainda inexistente.

**Em cada entrega:** gates mínimos de governança; para aplicação, `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:e2e`. Entregas de banco/autenticação executam também `npx supabase start` e `npx supabase test db`; C e D usam o Supabase local para seus cenários autenticados. E2E sobre build de produção, com `CI=1` e sem reaproveitar servidor de desenvolvimento. Registrar resultados reais nas tasks, não neste rascunho como executados.

- **A — Banco:** pgTAP com dois usuários e admin/anon; leitura da própria versão textual, inclusive acima de 2⁵³; escrita direta e acesso a helpers recusados; renomeação ativa/desativada, duplicados, vazio, 100/101 caracteres e bordas Unicode; dono inexistente/errado, trânsito, FK cruzada, tipo de ajuste preservado; atualização conjunta com instituição nova; falha de qualquer validação desfaz todas as escritas. Versão para nome, vínculo, classificação, instituição criada/renomeada/excluída; A → B → A, escrita idêntica, rollback, overflow e cascata de revogação de usuário. Duas sessões provam serialização da RPC e das RPCs existentes sob a mesma trava.
- **Upgrade A:** em instância local descartável confirmada, reset até a migração atual `20261027002132`, sem seed; carregar fixtures próprias em `tests/fixtures/` e retrato integral das linhas financeiras fictícias. Aplicar a migração nova localmente e comparar o retrato, UUIDs, nomes, indicadores e referências, permitindo só a nova coluna/objetos previstos. Conferir RPCs antigas e nova lado a lado e rollback de transação recusada; voltar ao schema local completo e suíte normal. Não editar migração antiga nem usar conexão remota. O roteiro exato e as consultas E1 serão entregues na task A antes do merge; pgTAP sobre schema final não substitui esse ensaio.
- **B — Financeiro:** CR-015-01 a CR-015-16 na KB/fixtures, com paridade entre especificação e funções puras; denominadores, resíduos, caminhos, precisão, empates de resto com saldos diferentes em classes **e instituições** e positivos que arredondam a zero. CR-015-16 deve reprovar um desempate institucional incorreto pelo maior saldo: A, não B, recebe a unidade, embora B seja a primeira linha apresentada. Propriedades: cada positivo entra uma vez em cada fronteira; saldos reconciliam; fronteira global e rateio de cada pai positivo somam 10000; seleção de ramo não recalcula percentuais globais. Regressão integral dos casos existentes, inclusive centésimo que muda após renomear por ativo.
- **C — Leituras e nome:** nas composições do Início, simular mudança entre páginas/consultas e nos dois sentidos, nome, instituição e taxonomia inclusive A → B → A; descartar tentativa inteira, reler consultas frescas, sucesso após estabilizar e erro após três tentativas. Cobrir RPC ausente/marca inválida, mais de 1000 entradas, contagem divergente e FK ilegível nos leitores relevantes. Provar que a visão por classe usa carteira + metadados e não chama a RPC antiga; A cobre o incremento do novo contador por toda mudança de taxonomia e a disponibilidade da RPC antiga para o app anterior. Fora do Início, aproveitar os cenários de edição/histórico/seletores para regressão: nome atual em nova requisição, mesmo UUID, validação e escrita atômica; não exigir novos testes de composição onde ela foi descartada na tabela. Manter a suíte financeira do fechamento existente, sem nova marca de metadados. Nenhum teste ou snapshot com dados reais.
- **D — Análises:** fixtures com instituição ausente, trânsito, positivos/negativos no mesmo grupo, dois níveis de resíduos, nomes repetidos em ramos diferentes, ativo desativado, sem M e sem positivos. E2E para ida/volta/reload/período/ramo inválido, colunas nas duas bases, tabela/legenda equivalentes, Outros sem dupla contagem e regressão Por ativo/raiz macro. Para CR-015-06, conferir só as três linhas de filhos em cada detalhe, sem pai/total nem resumo numérico, os percentuais globais distintos e os locais somando 100,00%; ao voltar, R$ 3 e 50,00% por macro. Axe, teclado, foco, 360 px úteis e desktop; ocultação sem quantia em HTML/atributos e erros recuperáveis, com backend local fictício.

## Itens de implementação

### Item 1 — Unidade A: migração compatível, versão e edição transacional

**Contexto:** as novas leituras e a nova edição exigem uma garantia que o banco atual não oferece.

**Ação técnica:** migração aditiva com versão de metadados, triggers, RPC textual e RPC de edição completa com nome, preservando funções existentes; testes de banco/concorrência/upgrade e roteiro E1. Essa PR não altera chamadas da aplicação para objetos ainda ausentes em produção.

**Critérios de aceite:**

- [ ] Escrita conjunta preserva UUID, referências, tipo de ajuste e saldos; só dono edita ativo comum, também desativado; nomes repetidos válidos.
- [ ] Versão cobre nome, instituição/vínculos e classe, inclusive A → B → A, sem perder precisão, permitir escrita externa ou romper cascata.
- [ ] Recusas revertem todas as mudanças; testes de isolamento, grants, concorrência e upgrade passam, com retrato fictício integral preservado.
- [ ] App/RPCs antigos funcionam com schema novo; E1 verificável e sem dados reais está pronto; C/D aguardam E1 concluída.

### Item 2 — Unidade B: regras e composição das análises

**Contexto:** novos agrupamentos e duas bases precisam de especificação e casos independentes antes das telas.

**Ação técnica:** atualizar KB-004 e fixtures com os casos e regras aprovados; funções puras para instituição e fronteiras dos níveis 2/3, resíduos e dois rateios; agrupamento visual de Outros depois do rateio institucional. Reutilizar primitivas de precisão sem refatorar os algoritmos existentes sem necessidade.

**Critérios de aceite:**

- [ ] Todos os casos CR-015-* possuem entradas e esperados independentes e passam; casos anteriores permanecem válidos.
- [ ] Cada fronteira reconcilia com S e cada pai com filhos/resíduo em valor; percentuais respeitam as duas bases e D1/D2.
- [ ] Negativos não compensam grupos; zero é omitido; positivos com 0,00% permanecem; dados inválidos recusam a visão.
- [ ] Por ativo e macro mantêm suas regras atuais; renomeação não é tratada como percentual invariável por ativo.

### Item 3 — Unidade C: coerência do Início e nome na edição

**Contexto:** no Início, renomeação afeta desempates e a marca atual não a detecta; nas demais telas, nomes são rótulos de UUIDs, conforme avaliação por consumidor. A edição precisa de uma escrita atômica, não de composição nova em toda tela descritiva.

**Ação técnica:** integrar carteira + versão de metadados nos leitores atuais do Início e preparar/testar o leitor institucional que D conectará; retirar da composição nova de classe a chamada da RPC antiga de classificação. Manter `marcaCarteira` e os consumidores fora do Início com seus contratos atuais. Campo Nome e validação de bordas com a semântica do banco; Server Action chama a nova RPC atomicamente. Atualizar contrato do formulário no DESIGN.md e os testes de leitura/e2e diretamente afetados.

**Critérios de aceite:**

- [ ] Leitores do Início usam marca financeira + metadados, com marca fresca nos retries e falha sem fallback; a leitura por classe não chama a RPC antiga redundante. A RPC antiga e seu trigger permanecem no banco para compatibilidade.
- [ ] Avaliação por consumidor respeitada: nenhuma composição/marca nova no fechamento ou nas telas descritivas; regressões de cálculo, rótulos atuais após nova leitura e identidade por UUID preservadas.
- [ ] Salvar nome + detalhes faz uma chamada; recusa não grava parte; sucesso preserva UUID e volta à aba correta.
- [ ] Ativo comum ativo/desativado aceita nome válido/repetido; trânsito e tipo de ajuste seguem sem edição; nomes longos e Unicode obedecem ao banco.
- [ ] Registros antigos mostram o nome atual após nova requisição; opções mantêm identidade. Testes de leitura do Início demonstram A → B → A para nome, instituição e taxonomia, e o efeito permitido da renomeação no rateio existente.

### Item 4 — Unidade D: análises no Início e documentação das interações

**Contexto:** com banco, regras e leituras disponíveis, apresentar instituição e detalhes de classe sem inventar precisão.

**Ação técnica:** alternador com instituição, leitura específica de catálogos, rosca institucional e tabela, navegação por pai na classe, cartões/tabelas dos detalhes e negativos por ramo; ocultação no servidor. Atualizar DESIGN.md, KB-003 e nota de novidades em versão futura ainda não lançada, seguindo o padrão vigente.

**Critérios de aceite:**

- [ ] Por instituição mostra todos os grupos na tabela/legenda, Outros corretamente derivado e negativos separados; a rosca tem até seis fatias.
- [ ] Macro → subclasse → tipo tem ida/volta por URL, período preservado, resíduos terminais e duas participações rotuladas; detalhe sem linha do pai/total ou resumo numérico; raiz macro não muda e CR-015-06 passa no e2e.
- [ ] M e uso de atributos atuais ficam claros; estados vazio/erro/ramo inválido não apresentam zero fictício.
- [ ] E2E autenticado, acessibilidade, ocultação e layout passam; V fica preparado na task de encerramento, sem alegação de verificação já feita.

## Arquivos afetados

Mapa prospectivo, não lista de mudanças já executadas:

- A: nova migração em `supabase/migrations/`; testes em `supabase/tests/database/`; fixtures de upgrade em `tests/fixtures/`; task A com E1 e evidências.
- B: `_project/knowledge/KB-004_regras_financeiras.md`, `tests/fixtures/financeiro/casos_referencia.json`, novos módulos/testes em `src/lib/financeiro/`; `distribuicao.ts` e `alocacao.ts` só se indispensável para integração, preservando os contratos anteriores.
- C: `src/lib/leitura.ts` (leitor da nova versão, sem alterar `marcaCarteira`), leitores do Início em `src/lib/telas/leituras.ts` e testes; `src/app/(app)/ativos/acoes.ts`, `src/components/formularios/editar-ativo.tsx`, validação em `src/lib/telas/` e e2e diretamente afetados de leitura/edição/histórico/seletores. Sem reescrever páginas de Ativos, Cadastros, Lançamentos ou Transferências para criar composições; sem mudar o leitor/ação de fechamento. Tipos/mocks somente se necessários a esses contratos delimitados.
- D: `src/app/(app)/page.tsx`, `src/components/graficos/rosca.tsx` ou componente irmão, módulos em `src/lib/telas/`, testes unitários/e2e de distribuição; DESIGN.md, KB-003 e `src/lib/novidades.ts`.
- Documentação do ciclo: este plano, `_project/cycles.md`, futuras tasks de issues e `_project/drafts/015_analises_instituicao_niveis_classe/015_task_closure.md`; KB-002 apenas para operação realmente alterada; versão/changelog/manifesto pelo release-please, sem edição especulativa neste rascunho.

## Decomposição em issues e PRs

As issues A–D foram criadas após a integração da [PR #150](https://github.com/EuThiagoAndrade/saldo-futuro/pull/150) e a confirmação dos payloads em 2026-10-27. Os corpos efetivos foram publicados conforme o formulário `.github/ISSUE_TEMPLATE/feature_request.yml` e estão registrados em “Registro de criação das issues”. A unidade A (#151) foi autorizada, iniciada e integrada pela PR #155; a unidade B (#152) foi autorizada, iniciada e integrada pela PR #156; a unidade C (#153) foi autorizada, iniciada e integrada pela PR #158; a unidade D (#154) foi autorizada e iniciada.

| Unidade | Issue e título | Dependência | Entrega e fechamento |
| :-- | :-- | :-- | :-- |
| Documental | Plano do ciclo 015 | Veredito apto e aprovação posterior | Branch `chore/cycle-015-plan`; PR de ideação/plano/registro, sem issue própria; merge com autorização específica |
| A — [#151](https://github.com/EuThiagoAndrade/saldo-futuro/issues/151) | [FEATURE] Garantir coerência de metadados e edição transacional do nome do ativo | Documental integrada; autorização de implementação | Uma PR de banco; `Refs #151`, issue aberta até E1 e encerramento |
| B — [#152](https://github.com/EuThiagoAndrade/saldo-futuro/issues/152) | [FEATURE] Calcular alocação por instituição e níveis de classe | Documental integrada; autorização de implementação; A antes na sequência recomendada | Uma PR de regras, KB e testes; pode fechar no merge |
| C — [#153](https://github.com/EuThiagoAndrade/saldo-futuro/issues/153) | [FEATURE] Editar nome do ativo e proteger análises do Início | A integrada, E1 concluída; autorização de implementação | Uma PR de aplicação/leituras; pode fechar no merge |
| D — [#154](https://github.com/EuThiagoAndrade/saldo-futuro/issues/154) | [FEATURE] Exibir análises por instituição e detalhamento de classes | B e C integradas; E1 concluída; autorização de implementação | Uma PR de análises/documentação; pode fechar no merge; V rastreado no encerramento |
| Release | Release proposta pelo release-please | Entregas integradas e verificadas; versão concreta conferida | PR do bot, checks próprios e merge próprio; conferir fechamento indevido da issue A |
| Encerramento | Encerrar ciclo 015 | A–D, E1, V e release comprovados | Branch `chore/cycle-015-closure`, sem issue recursiva; fechamento de A se ainda aberta, documentação viva e movimento prospectivo para `executed/` |

Issues usam branch `feature/issue-N` e commit `feat(issue-N):`; documentação usa `docs(cycle-015):` ou `chore(cycle-015):`. Tasks `015_task_issue-N.md`, instanciadas do template no início da implementação. Não usar prefixo de ferramenta nem registrar SHA do próprio merge. Na aprovação do plano, a publicação documental é coberta; não publicar agora.

## Registro de criação das issues

- **Data e autorização:** 2026-10-27, “Pode criar as issues.”, após a apresentação e confirmação dos quatro payloads.
- **Precondições conferidas:** plano v2 `Aprovado`; PR #150 integrada em `main` pelo commit `200be5df7d84521d9bcd911d4f0e0500e4dddfe8`; checks verdes no head `2d5ab192e93d79e43a896d2fee7765a87ab72ec2`; busca `gh issue list` pelos quatro títulos sem duplicatas.
- **Template aplicado:** `.github/ISSUE_TEMPLATE/feature_request.yml` — Contexto, Escopo, Critérios de aceite, Ciclo e plano relacionados, Dependências, riscos e autorizações, nessa ordem; sem labels ou responsáveis.
- **Resultado:** quatro issues criadas sequencialmente por `gh issue create --body-file`, relidas com `gh issue view` e conferidas como `OPEN`.

| Unidade | Issue criada | Payload efetivo |
| :-- | :-- | :-- |
| A | [#151 — Garantir coerência de metadados e edição transacional do nome do ativo](https://github.com/EuThiagoAndrade/saldo-futuro/issues/151) | Corpo confirmado publicado sem alteração |
| B | [#152 — Calcular alocação por instituição e níveis de classe](https://github.com/EuThiagoAndrade/saldo-futuro/issues/152) | Corpo confirmado publicado sem alteração |
| C | [#153 — Editar nome do ativo e proteger análises do Início](https://github.com/EuThiagoAndrade/saldo-futuro/issues/153) | Corpo confirmado publicado sem alteração |
| D | [#154 — Exibir análises por instituição e detalhamento de classes](https://github.com/EuThiagoAndrade/saldo-futuro/issues/154) | Corpo confirmado publicado sem alteração |

- **Estado ao criar as issues (histórico):** ciclo permanecia em `Planejamento`; issues A–D abertas; nenhuma implementação, branch de issue, task ou ação externa iniciada. Este registro local acompanha a próxima entrega autorizada; sem commit direto em `main`.

## Dependências e blockers

Rodada 1 emitiu `REQUER NOVA RODADA`, com um bloqueador e três ressalvas; a correção v2 respondeu R1-1 a R1-4 e a Rodada 2 confirmou todos resolvidos, com `APTO PARA APROVAÇÃO` e nenhum achado novo. A aprovação humana posterior foi recebida em 2026-10-27 e registrada acima. D1/D2 permanecem. A PR documental #150 foi integrada; os payloads foram confirmados e as issues #151–#154 estão abertas. A autorização da #151 foi recebida e sua execução está registrada em `015_task_issue-151.md`; a PR #155 foi integrada. A autorização da #152 foi recebida e a PR #156 foi integrada. O responsável informou em 2026-10-27 que a E1 já estava concluída (relato humano, sem data nem resultados sanitizados; registrado na task da #151), e a #153 foi autorizada e integrada pela PR #158. O resultado sanitizado da E1 foi trazido pelo responsável (quatro indicadores verdadeiro/falso esperados, registrados na task da #151), e a autorização da #154 foi recebida e sua execução está registrada em `015_task_issue-154.md`. Docker e Supabase local foram conferidos; V, release e encerramento continuam pendentes. Nenhum pacote ou checkout externo novo é previsto.

### E1 — Ação externa depois da unidade A

1. Responsável confere a main integrada, checks verdes e task A; a aplicação dessa PR ainda usa as RPCs anteriores. Conferir `migration list`, a lista exata de migrações pendentes e que só a migração autorizada deste ciclo será aplicada. Qualquer pendência adicional para a ação.
2. As consultas prévia/posterior serão materializadas na unidade A e testadas no ensaio local sobre os dois schemas; conferir apenas estrutura, disponibilidade das funções/grants e resultados de validação. Não imprimir nomes, saldos, IDs de ativos nem carteiras. Não fazer renomeação real como teste.
3. Responsável executa `npx supabase db push` e confere `npx supabase migration list` no projeto correto, pela operação já definida na KB-002, sem fornecer credenciais ao agente. Migração transacional, objetos novos e APIs antigas preservadas.
4. Registrar somente conclusão e resultados sanitizados de disponibilidade/compatibilidade, sem alegar igualdade financeira verificada em produção. A prova de ausência de alteração financeira está no retrato integral **fictício** do upgrade local.
5. Receber "concluí a ação externa da issue #N" da unidade A, conferir o que for acessível e reconciliar a task. C/D só podem iniciar após E1 comprovada. Não é necessária segunda migração de retirada neste ciclo.

### V — Verificação em produção

Após autorização específica e deploy compatível confirmado, o responsável confere a parte autenticada, sem screenshots, nomes ou valores reais nas evidências:

1. Início alterna as três visões, preserva período e apresenta M/atributos atuais; Por ativo e a raiz Por classe continuam disponíveis.
2. Por instituição tem ausências/trânsito quando existentes, tabela equivalente e negativos separados; não preencher dados para criar cenário.
3. Detalhamento de classe vai e volta, mantém ramo em reload/período e mostra as duas bases e resíduos quando existentes. Cenário ausente em produção é registrado como não observado, com cobertura pelos testes fictícios, sem inventar verificação.
4. Ocultar valores remove quantias nas novas visões, inclusive nos detalhes acessíveis; teclado, celular e desktop permitem leitura sem rolagem horizontal.
5. Edição mostra Nome editável, tipo para leitura e o aviso sobre registros antigos; trânsito não oferece edição. O envio/renomeação e concorrência são provados localmente, sem alterar carteira real para testar produção.
6. Agente confere por leitura o estado de deploy/CI acessível, sem consultar carteira. Registrar o resultado do responsável e limites na task de encerramento; falha pede correção autorizada, não encerramento fictício.

## Riscos, suposições e rollback

- **Duas bases confundidas:** colunas e denominadores explícitos; o caso 06 demonstra que reconciliar saldos não obriga igualdade dos percentuais arredondados. Não corrigir o centésimo trocando a regra escolhida.
- **Coerência das análises:** gatilhos e testes de paginação/A → B → A protegem as três visões do Início; usar apenas carteira + metadados na aplicação nova. Falha fechada de marca pode indisponibilizar essas leituras; repetir no limite atual e informar erro recuperável. Não ampliar esse custo ao fechamento ou às telas descritivas.
- **Limite descritivo:** outras telas podem apresentar rótulos/opções/contagens de instantes diferentes, como já ocorre hoje. A avaliação por consumidor mantém IDs e validação transacional como garantia de escrita; não declara resolvidas corridas preexistentes de descrição/contagem nem protege o tempo entre abrir e enviar formulário. Qualquer dano novo demonstrado exige reavaliação antes de ampliar implementação.
- **RPC de edição parcial:** um único commit transacional para nome/detalhes; rollback de recusa inclui instituição criada. Não chamar duas RPCs sequenciais a partir do formulário.
- **Compatibilidade de deploy:** banco primeiro, depois E1, depois consumidores; antigo continua funcional com schema ampliado. Manter novas colunas/RPCs mesmo se o app voltar à versão anterior. Uma renomeação já confirmada não é desfeita por rollback de código.
- **Retirada de migração é proibida:** falha na aplicação transacional aborta; erro após aplicação exige migração corretiva nova, revisão e autorização. Não restaurar saldos/eventos nem resetar produção como rollback.
- **Nome e bordas Unicode:** banco é autoridade; novos casos evitam a diferença `trim`/`btrim` já conhecida. Nenhuma normalização extra ou unicidade nova.
- **Cascata e contador:** não bloquear revogação de usuário, nem introduzir deadlock por ordem nova de locks. Testar grant, cascata, concorrência e overflow antes da publicação.
- **Catálogo e leitura:** a taxonomia global não muda neste ciclo; alteração concorrente dela exigiria novo escopo de coerência. Instituição ilegível/nó inexistente torna a respectiva visão indisponível.
- **Privacidade:** evidência operacional só sanitizada; os ensaios completos usam fixtures fictícias. Não capturar nem acessar carteira real para comprovar este plano.

## Sequência recomendada

1. Rascunho v1 registrado e revisado na Rodada 1; correção v2 autorizada em 2026-10-27 e revisada na Rodada 2, com todos os achados resolvidos.
2. Veredito `APTO PARA APROVAÇÃO` confirmado e aprovação humana posterior recebida em 2026-10-27; v2 aprovada, sem alterar as entregas.
3. Publicar PR documental de ideação/plano/registro sob aprovação do plano; checks verdes e aprovação própria de merge; depois apresentar/confirmar payloads e criar issues A–D.
4. Autorizar A; implementar, testar banco/upgrade, publicar PR, aprovar merge e concluir E1 com responsável.
5. Autorizar B; implementar regras/KB/fixtures, testar, publicar e aprovar seu merge.
6. Autorizar C; proteger as leituras do Início conforme avaliação por consumidor e habilitar edição, validar e integrar mediante aprovação própria.
7. Autorizar D; apresentar análises, atualizar contratos/documentação, validar e integrar mediante aprovação própria.
8. Autorizar V, registrar conferência/limites, integrar release concreta com checks e aprovação próprios e registrar data de novidades somente com publicação comprovada.
9. Encerramento já coberto pela aprovação do plano: consolidar KB-003, KB-004, DESIGN.md e demais docs realmente afetadas; reconciliar tasks/E1/V, fechar A quando elegível e preparar PR prospectiva movendo para `executed/`, com plano e ciclo concluídos. Checks e aprovação própria de merge. Retorno do BL-009 somente depois da integração comprovada do destino, em operação separada da fila.

## Referências

- `.agent/ai_behavior.md`; `_project/README.md`; `_project/cycles.md`.
- `.agent/workflows/rascunhar_plano.md`; `.agent/templates/plano_implementacao.md`; `.agent/lessons_learned.md`.
- `_project/ideations/015_analises_instituicao_niveis_classe.md`; `_project/backlog.md` no snapshot herdado.
- `_project/knowledge/KB-003_visao_produto_arquitetura.md`; `_project/knowledge/KB-004_regras_financeiras.md`, seções 1, 2, 4 e 15 e casos de distribuição.
- `_project/decisions/ADR-002_stack_infraestrutura.md`; `_project/decisions/ADR-003_acesso_privacidade_publicacao.md`; `_project/decisions/ADR-005_graficos_svg_proprio.md`; `design-system/DESIGN.md`, 2.3, 6.7, 6.8, 6.11–6.13 e 7.
- `src/lib/leitura.ts`; `src/lib/telas/leituras.ts`; `src/lib/financeiro/distribuicao.ts`; `src/lib/financeiro/alocacao.ts`; `src/app/(app)/ativos/acoes.ts`; `src/components/formularios/editar-ativo.tsx`.
- `supabase/migrations/20261014185205_carteira.sql`; `supabase/migrations/20261024000829_metadados_ativos.sql`; `supabase/migrations/20261026204955_taxonomia_ativos.sql`; `supabase/migrations/20261026215542_taxonomia_ativos_fase2.sql`; `supabase/migrations/20261027002132_taxonomia_ativos_ampliacao.sql`.
- `_project/executed/013_taxonomia_classes_alocacao/013_plan.md`, para precedentes de implantação compatível, marca e ensaio local, sem herdar autorizações.

## Rastreabilidade

| Campo | Valor |
| :-- | :-- |
| Issue(s) | [#151 (A)](https://github.com/EuThiagoAndrade/saldo-futuro/issues/151), [#152 (B)](https://github.com/EuThiagoAndrade/saldo-futuro/issues/152), [#153 (C)](https://github.com/EuThiagoAndrade/saldo-futuro/issues/153), [#154 (D)](https://github.com/EuThiagoAndrade/saldo-futuro/issues/154) — abertas |
| PR(s) | [#150 — publicação documental](https://github.com/EuThiagoAndrade/saldo-futuro/pull/150), integrada pelo commit `200be5df7d84521d9bcd911d4f0e0500e4dddfe8`; unidade A na [PR #155](https://github.com/EuThiagoAndrade/saldo-futuro/pull/155), conforme task #151 |
| Branch(es) | `chore/cycle-015-plan`, publicação documental integrada a `main` |
| Revisão de origem | `84f0a5ea107f33e0de5c506b3ea0825346f6e58e`, com ideação e reserva locais preexistentes |
| Destino após conclusão | `_project/executed/015_analises_instituicao_niveis_classe/015_plan.md` |

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 015 (completo)
Quem: Responsável
Conferir: checks e diff da PR #155 — https://github.com/EuThiagoAndrade/saldo-futuro/pull/155; task 015_task_issue-151.md
Diga: "aprovo o merge da PR #155"
```

## Handoff de saída

### Handoff da publicação documental — aprovar_plano

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 015 + aprovar_plano + 015_plan + v2`
- `effect_class`: `remote_mutation`
- `state_before`: v2 Em Revisão; Rodada 2 APTO PARA APROVAÇÃO, sem novos achados; Aguardando aprovação do plano; main/local e origin/main em `84f0a5ea107f33e0de5c506b3ea0825346f6e58e`; ideação, plano e reserva locais sem commit; nenhuma PR documental existente para a branch, conforme consulta ao GitHub.
- `state_after`: v2 Aprovado por manifestação humana posterior de 2026-10-27; ciclo 015 permanece em Planejamento, próximo ciclo 016; branch documental publicada e PR #150 aberta contra main; nenhuma issue criada nem implementação iniciada. Merge documental aguarda checks verdes no head corrente e autorização própria.
- `result`: `executed`
- `evidence`: frase de aprovação e veredito da Rodada 2 registrados; `git fetch origin` e consulta de PRs por branch confirmaram base e ausência de duplicidade; escopo, decisões e rodadas preservados. Push e criação confirmados em https://github.com/EuThiagoAndrade/saldo-futuro/pull/150; `gh pr view 150` conferiu branch/base, estado aberto e exatamente ideação, plano e registro. Gates documentais da aprovação: 48/48 testes de governança com TEMP/TMP locais ao processo em `local/tmp-governance-015`; validador com 0 erros e 0 avisos; `git diff --cached --check` e `git diff --check` passaram; staging limitado aos três documentos. Estado dos checks do head corrente é conferido no GitHub antes do merge. Nenhum dado real incluído.
- `blockers`: nenhum impedimento local conhecido; checks verdes e aprovação específica do merge documental são precondições pendentes de integração; confirmação de payloads e autorizações de implementação continuam separadas.

### Handoff da criação das issues — criar_issues

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 015 + criar_issues + A-D + revisão de origem 2d5ab192e93d79e43a896d2fee7765a87ab72ec2`
- `effect_class: remote_mutation`
- `state_before`: plano v2 Aprovado e PR #150 integrada; payloads A–D apresentados e confirmação recebida em 2026-10-27; nenhuma issue correspondente encontrada.
- `state_after`: issues #151–#154 abertas e verificadas; corpos iguais aos payloads confirmados; registro local atualizado em `015_plan.md` e `cycles.md`, sem commit ou push; ciclo em Planejamento; nenhuma implementação iniciada; próximo passo aguarda autorização específica para #151.
- `result: executed`
- `evidence`: autorização recebida em 2026-10-27 após a apresentação dos payloads; busca por cada título via `gh issue list` sem duplicatas; formulário Feature conferido; issues criadas via `gh issue create --body-file` e números, títulos, estados e corpos conferidos via `gh issue view`: [#151](https://github.com/EuThiagoAndrade/saldo-futuro/issues/151), [#152](https://github.com/EuThiagoAndrade/saldo-futuro/issues/152), [#153](https://github.com/EuThiagoAndrade/saldo-futuro/issues/153), [#154](https://github.com/EuThiagoAndrade/saldo-futuro/issues/154).
- `blockers`: nenhum para a criação; a implementação aguarda autorização da issue #151; E1 e as dependências de C/D permanecem pendentes.

### Histórico — handoff da correção v2

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 015 + rascunhar_plano + 015_plan + v2`
- `effect_class`: `local_mutation`
- `state_before`: plano v1 Em Revisão, Rodada 1 com REQUER NOVA RODADA, Aguardando correções (rodada 1); ciclo 015 em Planejamento; main em `84f0a5ea107f33e0de5c506b3ea0825346f6e58e`; ideação, registro e plano locais sem commit; autorização de correção recebida em 2026-10-27.
- `state_after`: plano v2 permanece Em Revisão, com a Rodada 1 preservada e respostas a R1-1 a R1-4; Aguardando revisão (rodada 2); último veredito REQUER NOVA RODADA preservado, sem aprovação; ciclo/numeração e demais arquivos preservados; sem stage, commit ou publicação.
- `result`: `executed`
- `evidence`: inspeção dos consumidores e da garantia de escrita por UUID; tabela de avaliação, escopo/testes/arquivos de C delimitados, detalhe sem pai/total, CR-015-16 e eliminação da leitura redundante registrados; autorização desta correção no cabeçalho. Resultados reais da validação v2 registrados abaixo; nenhum dado real lido.
- `blockers`: nenhuma decisão humana adicional necessária para a correção; achados respondidos pelo autor, ainda sujeitos à Rodada 2. Implementação/publicação seguem sem autorização neste workflow.

### Histórico — handoff do rascunho v1

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 015 + rascunhar_plano + 015_plan + v1`
- `effect_class`: `local_mutation`
- `state_before`: ciclo 015 em Ideação; próximo ciclo 016; ideação e reserva locais sem commit; nenhum plano 015 existente; autorização do rascunho recebida em 2026-10-27; origem `84f0a5ea107f33e0de5c506b3ea0825346f6e58e`.
- `state_after`: plano v1 em Rascunho, revisão/veredito/aprovação pendentes; ciclo 015 em Planejamento com caminho do plano; próximo ciclo 016 preservado; D1/D2 registradas; alterações locais sem commit.
- `result`: `executed`
- `evidence`: template integral instanciado, autoridades e código/schema locais inspecionados; duas concordâncias expressas do responsável registradas em 2026-10-27; casos fictícios, quatro unidades, E1/V e critérios definidos; nenhum dado real lido. Validações documentais e conferência aritmética executadas conforme registro abaixo.
- `blockers`: nenhum para revisão; implementação/publicação dependem das etapas posteriores, sem autorização neste workflow.

### Validação documental do rascunho v1

- `node --test scripts/validate-governance.test.mjs`: 48/48 passaram, usando `TEMP` e `TMP` apontados para `local/tmp-governance-015` apenas no processo de teste. A primeira tentativa no temporário padrão teve 44/48, com quatro erros `EPERM` em operações `rename` das fixtures; a repetição na área autorizada resolveu todos, sem alteração dos testes.
- `node scripts/validate-governance.mjs`: 0 erros, 0 avisos, 5 itens de conferência manual. O resultado não substitui revisão semântica nem aprovação humana.
- `git diff --check`: passou. Inspeção do status: somente o registro de ciclos, a ideação preexistente e o novo plano como alterações versionáveis; sem stage, commit, branch nova ou publicação.
- Seis conjuntos de contas de maior resto conferidos por cálculo isolado em `bigint`, sem importar módulos de produção: duas instituições 200/100, três iguais, quatro iguais, seis iguais, restos empatados com saldos 1/7/4 e positivo que arredonda a zero. Isso confere as contas do rascunho; ainda não são testes da implementação futura.
- G3 manual: conteúdo com exemplos fictícios e referências técnicas, sem consulta de dados reais; arquivos de aplicação, migrações, backlog e ideação preservados.

### Validação documental da correção v2

- `node --test scripts/validate-governance.test.mjs`: 48/48 passaram, com `TEMP`/`TMP` apontados para `local/tmp-governance-015` somente no processo de teste; nenhum teste alterado.
- `node scripts/validate-governance.mjs`: 0 erros, 0 avisos, 5 itens de conferência manual. `git diff --check` passou; status permaneceu com as alterações locais já observadas de registro, ideação e plano, sem stage/commit/publicação. Nesta correção, somente o plano foi editado.
- Comparação textual do trecho original da Rodada 1: preservado integralmente, até o handoff da revisão; acrescentada apenas a resposta do autor depois dele. Snapshot de origem no backlog e registro das decisões D1/D2 também preservados integralmente.
- CR-015-16 recalculado em `bigint` por script isolado, sem módulos de produção: base 1200 centavos; pisos 833/5833/3333; restos 400/400/400; participações 834/5833/3333 centésimos de ponto percentual; apresentação B, Sem instituição, A. Resultado confere com a especificação.
- G3 manual: somente conteúdo técnico e exemplos fictícios; nenhum dado real consultado. Sem execução de testes da aplicação/banco ou implementação; próxima revisão formal permanece pendente.

## Revisão crítica

Concluída. Rodadas 1 e 2 e resposta do autor preservadas abaixo: a v2 recebeu `APTO PARA APROVAÇÃO` na Rodada 2, sem novos achados, seguida da aprovação humana registrada acima. Autor: Codex (GPT-6). Os gates documentais não substituem o veredito e a manifestação humana.

### Rodada 1

- **Data:** 2026-10-27.
- **Versão revisada:** v1; base local `84f0a5ea107f33e0de5c506b3ea0825346f6e58e`, com `_project/cycles.md`, ideação e plano ainda sem commit.
- **Autor:** Codex (GPT-6), conforme o próprio plano.
- **Revisor:** Claude Code (Claude Opus 5.5).
- **Veredito:** `REQUER NOVA RODADA`.

#### Achados

- **R1-1 — Bloqueador: o inventário da unidade C estende a leitura coerente a telas que não a usam hoje, sem demonstrar o dano.** O baseline diz que Ativos, Cadastros e formulários/páginas de lançamentos e transferências combinam tabelas "sem essa proteção para metadados". Na verdade, essas telas não usam `lerComposicao` para nada: leem em `Promise.all`, sem marca (`src/app/(app)/ativos/page.tsx:198`, `ativos/[id]/editar/page.tsx:25`, `ativos/novo/page.tsx:16`, `cadastros/page.tsx:21`, `lancamentos/page.tsx:33`, `lancamentos/[id]/page.tsx:27`, `lancamentos/novo/page.tsx:16`, `transferencias/page.tsx:50`). Só o Início e o fechamento leem por composição. O inventário obrigatório, com o critério "Todos os consumidores do inventário têm leitura coerente", leva o padrão D13, criado para leitura de cálculo, a cerca de nove consumidores. O plano não diz, para nenhum deles, que resultado errado uma renomeação ou troca de vínculo produziria. Nessas telas o nome lido é o antigo ou o novo, ambos estados válidos, e nenhum valor derivado depende dele. No fechamento, o nome não entra no cálculo, e a marca nova só acrescentaria repetições. As decisões 7 e 8 pedem investigar a garantia e avaliar as leituras afetadas, não proteger toda leitura que exibe um nome. Aprovar o critério como está ampliaria a unidade C contra "Simplicidade primeiro" e "Mudanças cirúrgicas". Na v2, montar uma tabela por consumidor com os metadados lidos, o resultado que depende deles (agrupamento, ordem/desempate, percentual, decisão oferecida ou integridade referencial na mesma tela), o efeito observável de um estado misto e a decisão de proteger ou não, com justificativa. Manter obrigatória a proteção das três visões do Início, onde nome, instituição e nó determinam grupos e desempates. Se outra tela precisar da marca, demonstrar o dano. Se a escolha for de escopo e não técnica, levá-la ao responsável. Ajustar de forma coerente o baseline, a seção de coerência, os critérios e testes de C, os riscos e os arquivos afetados.
- **R1-2 — Ressalva: falta definir se o detalhe mostra a linha do próprio pai e com quais percentuais.** O contrato 6 admite que filhos e resíduo somem 50,01% da carteira enquanto o pai mostra 50,00% (CR-015-06), e a interface manda explicar a diferença. Mas o plano não diz se o título ou a tabela do detalhe apresentam o pai ou uma linha de total, nem de onde vem o percentual exibido. Especificar: havendo linha do pai ou total, o valor é o total positivo do pai, o "% da carteira" é o do rateio da fronteira em que o pai foi apresentado (raiz macro ou profundidade 2), o "% do pai" é 100,00%, e nenhum percentual dos filhos é somado. Incluir a expectativa em CR-015-06 e no e2e de D. Se não houver linha de total, dizer isso.
- **R1-3 — Ressalva: falta caso de referência do empate de resto entre instituições com saldos diferentes.** D1 e o contrato 2 fixam, para instituições, o empate de resto pela ordem de desempate "mesmo com saldos diferentes", diferente da distribuição por ativo. CR-015-07 só exercita classes, e CR-015-02 tem saldos iguais. Acrescentar um caso fictício, por exemplo: Instituição A com R$ 1, Instituição B com R$ 7 e Sem instituição com R$ 4. Base de R$ 12, restos iguais, e A recebe a unidade: 8,34%, 58,33% e 33,33%, apresentados na ordem B, Sem instituição, A. Conferido no recálculo desta rodada.
- **R1-4 — Ressalva: a versão de classificação fica redundante nas composições novas.** A nova `versao_metadados` incrementa em toda mudança de `taxonomia_id`. Somá-la a `versao_classificacao` na marca da visão por classe só acrescenta uma RPC por fase, sem nova garantia, e C só entra depois de E1, quando as duas já existem. Preservar a função antiga para a aplicação anterior é correto. Na aplicação nova, usar só a versão de metadados ou justificar o ganho da dupla leitura.

#### Itens atendidos e evidências

- Template integral, com as seções obrigatórias. Objetivo, escopo e não-escopo coerentes com a ideação e com as decisões 1 a 8. D1 e D2 registradas como concordância expressa do responsável, com exemplos numéricos, sem regra financeira inferida.
- Contas de CR-015-01 a 08, 10, 11, 14 e 15 conferidas por recálculo independente de maior resto em `bigint`, fora dos módulos de produção; os casos 09, 12 e 13 são qualitativos. Todos os esperados conferem.
- Fatos do baseline conferidos por leitura: `distribuicao.ts` (rateio por ativo, desempate por saldo, nome e UUID, Outros depois do rateio); `alocacao.ts` (soma por macro antes do rateio, empate de resto pela ordem fixa das oito linhas); `leitura.ts` (`marcaCarteira` sem nome; `lerComposicao` com três tentativas e signal novo por fase); `versao_classificacao` só por `taxonomia_id`, com gatilho que recusa perfil inexistente; `editar_detalhes_ativo_taxonomia` sob `travar_carteira()` e sem nome; `ativos_nome_check` com `btrim` e 1 a 100; `trim()` do zod em `detalhes-ativo.ts` e `acoes-catalogo.ts`; última migração `20261027002132`; `?distribuicao=ativo|classe` em `page.tsx:57`; CR-53 a CR-61 e CR-C01 a CR-C12 na KB-004; DESIGN.md 6.12 e 6.13.
- G2: a RPC nova tem a trava primeiro, `auth.uid()`, grants mínimos e nenhum `user_id` editável. O teste dedicado da cascata é necessário: o gatilho atual recusa perfil inexistente, e os novos passarão a disparar também em exclusões (lição de 2026-10-23). `excluir_instituicao` já recusa instituição em uso, então a exclusão não altera vínculos de ativos.
- G3: só exemplos fictícios. Nenhum arquivo de `local/` nem carteira de produção foi lido nesta revisão.
- G4: migração nova e aditiva, ensaio de upgrade local com retrato fictício integral, RPCs antigas preservadas e ordem banco → E1 → consumidores.
- Pontos de aprovação com precondição, cobre, não cobre e conferir; modo contínuo proibido; decomposição A–D com dependências coerentes; release com conferência do "closes" indevido da issue A.
- Nenhum teste de aplicação ou de banco foi executado: o código ainda não existe.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 015 + revisar_plano + 015_plan/rodada-1 + v1`
- `effect_class`: `local_mutation`
- `state_before`: v1 em Rascunho, revisão e veredito pendentes; Aguardando revisão (rodada 1); plano local sem commit.
- `state_after`: v1 Em Revisão, rodada 1 concluída com REQUER NOVA RODADA; Aguardando correções (rodada 1); aprovação humana pendente.
- `result`: `executed`
- `evidence`: achados e conferências desta rodada; cabeçalho e Próximo passo atualizados; handoff anterior preservado como histórico do rascunho. Gates documentais executados depois da gravação: validador de governança e `git diff --check`.
- `blockers`: R1-1. R1-2 a R1-4 são ressalvas. Primeira rodada, sem histórico de oscilação ou falta de progresso.

#### Resposta do autor à rodada 1 — v2

- **Data:** 2026-10-27.
- **Autor:** Codex (GPT-6).
- **Autorização:** "corrija o plano do ciclo 015", recebida nesta data.
- **Versão produzida:** v2, permanecendo `Em Revisão`; sem nova regra financeira ou alteração de D1/D2.

| Achado | Resposta do autor | Alteração verificável |
| :-- | :-- | :-- |
| R1-1 — bloqueador | Corrigido | Tabela "Avaliação por consumidor" identifica metadados, dependência, efeito de mistura e decisão para cada consumidor. Só as três visões do Início recebem a marca nova; fechamento conserva a financeira atual. Baseline, escopo, contrato, testes/critérios/arquivos de C, sequência e riscos foram alinhados. As demais telas mantêm rótulos por UUID e validação no envio, com limites/corridas preexistentes explicitados. Não há nova composição descritiva como requisito da unidade C. |
| R1-2 — ressalva | Corrigido | Escolhida a alternativa sem linha do pai/total ou resumo numérico no detalhe: título só com caminho e M; linhas de filhos/resíduo com suas duas bases. Contrato 6, interface, CR-015-06 e teste/critério e2e de D explicitam a ausência de total e o percentual de 50,00% na raiz ao voltar. Nenhum percentual dos filhos forma uma linha de total. |
| R1-3 — ressalva | Corrigido | Acrescentado CR-015-16: A = R$ 1, B = R$ 7, Sem instituição = R$ 4; 8,34%, 58,33%, 33,33%, apresentados B/Sem instituição/A. Estratégia B exige esse caso institucional com saldos diferentes e a rejeição do desempate pelo maior saldo. |
| R1-4 — ressalva | Corrigido | Composições novas do Início usam só carteira + metadados; não chamam a RPC antiga de classificação. Coluna/trigger/RPC antigos ficam no banco para o app anterior. Contrato, avaliação por consumidor, ação/critérios e testes de C explicitam essa separação e a cobertura de `taxonomia_id` pelo contador novo. |

Os quatro achados foram respondidos, sem contestação. Isso é a resposta do autor, não a confirmação de resolução pelo revisor. Próximo passo: revisão formal da v2, Rodada 2.

### Rodada 2

- **Data:** 2026-10-27.
- **Versão revisada:** v2; base local `84f0a5ea107f33e0de5c506b3ea0825346f6e58e`, com `_project/cycles.md`, ideação e plano ainda sem commit.
- **Autor:** Codex (GPT-6).
- **Revisor:** Claude Code (Claude Opus 5.5).
- **Veredito:** `APTO PARA APROVAÇÃO`.

#### Conferência dos achados da rodada 1

| Achado | Situação | Evidência conferida |
| :-- | :-- | :-- |
| R1-1 — bloqueador | Resolvido | A tabela "Avaliação por consumidor" cobre as três visões do Início, o fechamento e as oito telas descritivas, com metadados, dependência, efeito de mistura e decisão. Os fatos citados conferem: o fechamento usa o nome só em mensagens e rótulos (`lancamentos/fechamento/acoes.ts:48-76`), e o cálculo recebe IDs; o filtro de Lançamentos compara `ativo_id` (`lancamentos/page.tsx:39,50`); não há rota separada de Nova transferência; `excluir_instituicao` recusa instituição em uso sob a trava. Baseline, escopo, não-escopo, contrato de coerência, ação, critérios, testes e arquivos de C, título da issue C, riscos e sequência estão coerentes entre si. A cláusula de parada diante de um dano novo demonstrado preserva a decisão do responsável sobre escopo. |
| R1-2 — ressalva | Resolvido | Contrato 6, interface, CR-015-06, testes e critério de D fixam o detalhe sem linha do pai, sem total e sem resumo numérico. O percentual do pai só aparece na visão anterior, calculado na fronteira dela. |
| R1-3 — ressalva | Resolvido | CR-015-16 acrescentado; recalculado nesta rodada em `bigint`: 834/5833/3333 centésimos, apresentação B, Sem instituição, A. A estratégia de B exige reprovar o desempate pelo maior saldo. |
| R1-4 — ressalva | Resolvido | As composições novas usam carteira + metadados, sem `ler_versao_classificacao()`; coluna, gatilho e RPC antigos ficam para a aplicação anterior; o teste de C prova a ausência da chamada, e A prova a cobertura de `taxonomia_id` pelo contador novo. |

#### Achados

Nenhum achado novo, bloqueador ou ressalva. A Rodada 1 foi preservada sem alteração, e nenhum achado corrigido reapareceu.

#### Itens atendidos e evidências

- Regra de progresso: um bloqueador na rodada 1, zero na rodada 2, sem oscilação.
- Decisões financeiras: só D1, D2 e as decisões 1 a 8 da ideação. A v2 não introduz regra nova; os casos CR-015-01 a 16 permanecem conferidos.
- G1 a G4 mantidos como na rodada 1; o escopo de C ficou menor, sem reduzir as provas de isolamento, concorrência, upgrade e coerência das análises.
- G3: só exemplos fictícios; nenhum arquivo de `local/` nem carteira de produção foi lido.
- `APTO PARA APROVAÇÃO` não é aprovação. O plano só passa a `Aprovado` com a manifestação posterior do responsável.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 015 + revisar_plano + 015_plan/rodada-2 + v2`
- `effect_class`: `local_mutation`
- `state_before`: v2 Em Revisão, resposta do autor à rodada 1 registrada; Aguardando revisão (rodada 2); último veredito REQUER NOVA RODADA; plano local sem commit.
- `state_after`: v2 Em Revisão, revisão formal concluída com APTO PARA APROVAÇÃO; Aguardando aprovação do plano; aprovação humana pendente.
- `result`: `executed`
- `evidence`: conferência dos achados e dos fatos novos desta rodada; cabeçalho e Próximo passo atualizados. Gates documentais executados depois da gravação: validador de governança e `git diff --check`.
- `blockers`: nenhum para a decisão do responsável. Publicação, issues e implementação continuam dependendo da aprovação do plano e das autorizações seguintes.

## Pós-mortem

- **Data de conclusão:** —
- **Desvios:** —
- **Lições comprovadas:** —
