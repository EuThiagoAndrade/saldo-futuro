# Plano de Implementação — Regras financeiras

> **Ciclo:** `003`
> **Status:** `Aprovado`
> **Versão:** `v3`
> **Data de criação:** 2026-10-13
> **Última atualização:** 2026-10-14
> **Autor:** Thiago Andrade e Claude (Claude Code, Opus 5.5)
> **Tipo:** `feature`
> **Prioridade:** `P1`
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 003" em 2026-10-13
> **Autorização do rascunho:** "autorizo o rascunho do plano do ciclo 003" em 2026-10-13
> **Modo contínuo:** `—`
> **Revisão formal:** `Concluída`
> **Veredito da revisão:** `APTO PARA APROVAÇÃO`
> **Aprovação humana pós-revisão:** `Aprovada em 2026-10-14`
> **handoff_schema_version:** `2`

## Problema e contexto

Ideação: `_project/ideations/003_regras_financeiras.md`

> Este rascunho adota as recomendações da ideação para as perguntas P1 a P18, por decisão do responsável registrada em "Decisões do responsável". Ele também resolve as evidências que a ideação deixou pendentes (limites do SGS e quem calcula os casos de referência) e propõe as decisões D1 a D14, que a ideação deixou para o plano. As escolhas de cálculo que só aparecem ao detalhar as regras (K1 a K7, e outras que surgirem) não são decididas aqui: a KB-004 as leva ao responsável, com exemplos numéricos, antes do merge da PR A.
>
> A `v2` responde aos achados R1-1 a R1-9 da rodada 1, feita pelo Codex. Ela revisa D10 e D11, reescreve K4, acrescenta as propostas D13 e D14 e as escolhas K6 e K7, e detalha no item B o protocolo de escrita da carteira. A resposta a cada achado está em "Revisão crítica", na subseção "Resposta do autor à rodada 1".
>
> A `v3` responde aos achados R2-1 a R2-3 da rodada 2: separa armazenamento de acumulação no banco (D11), fecha os caminhos de escrita dos benchmarks e protege a cobertura (D8 e D10) e calcula o Dietz com numerador e denominador inteiros (item C). A resposta está em "Resposta do autor à rodada 2".

## Objetivo

Especificar, implementar e testar as regras financeiras do Saldo Futuro, sem nenhuma tela:

- **KB-004, regras financeiras:** especificação canônica de cada regra (definições, unidades, precisão, arredondamento, `N/D` e casos de borda) e casos de referência com dados fictícios, calculados passo a passo e conferidos de forma independente;
- **schema da carteira:** ativos, eventos imutáveis, meses, posições e consolidado mensais, em centavos inteiros, com RLS e testes de isolamento;
- **regras em funções puras de TypeScript**, testadas contra os casos de referência: lançamentos e estorno, fechamento em três etapas com identidade contábil, reabertura, consolidação, Modified Dietz mensal, acumulado, anual e variação do patrimônio;
- **benchmarks:** catálogo e séries globais, sincronização com o SGS, composição mensal, comparação com a carteira, taxa de acerto e drawdown;
- **defeitos O1 a O13 da origem** resolvidos por decisão explícita (ver "Destino dos defeitos da origem").

As regras ficam prontas para as telas do ciclo `004`.

> **Escopo negativo:** este ciclo não cria tela, rota de página nem componente de interface; não migra dados do `Meus-Investimentos`; não altera as regras de governança, as barreiras G1 a G4 nem as tabelas e funções de acesso do ciclo `001`.

## Contexto e baseline

### Estado do repositório

Fatos verificados em `main` @ `0b6765c`, em 2026-10-13:

- Ciclos `000`, `001` e `002` em `Concluído`. A ideação do `003` e sua reserva em `_project/cycles.md` são alterações locais, ainda não versionadas.
- Schema: `public.authorized_emails`, `public.profiles`, o tipo `public.app_role`, o schema `private` e as funções de acesso e de keepalive, em duas migrações (`supabase/migrations/20261013005133_acesso_autorizacao_perfis.sql` e `supabase/migrations/20261013011331_keepalive.sql`).
- Convenções do schema (KB-003): toda tabela de `public` com RLS; grants e revokes explícitos; toda função com `search_path` vazio e `execute` revogado de `public`; o `admin` sem bypass sobre dados de outros usuários.
- Testes de banco: três arquivos pgTAP em `supabase/tests/database/`, com 68 asserções e fixtures fictícias em `example.com`.
- Testes unitários: Vitest, só `src/**/*.test.ts` (`vitest.config.ts`), em ambiente `node`.
- Dependências fixadas em `package.json`. Nenhuma biblioteca decimal ou de datas.
- CI (`.github/workflows/ci.yml`): o job `app` roda lint, tipos, testes unitários, build e ponta a ponta sem backend; o job `database` sobe o Supabase local e roda `supabase test db` e a ponta a ponta de autenticação.
- A próxima KB é a `KB-004`; a próxima ADR, a `ADR-005`.

### Verificação do SGS (evidência pendente da ideação)

Feita em 2026-10-13 na documentação oficial do Banco Central e por chamadas somente leitura à API pública, sem dado do usuário.

| # | Verificação | Resultado | Efeito no plano |
| :-- | :-- | :-- | :-- |
| V1 | Endereço e parâmetros | `https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados?formato=json&dataInicial=dd/MM/aaaa&dataFinal=dd/MM/aaaa`; também `.../dados/ultimos/{N}`, com N ≤ 20 | O cliente usa sempre `dataInicial` e `dataFinal` |
| V2 | Janela por consulta | A documentação limita a diferença entre as datas a 10 anos. Numa série diária, a chamada sem datas retorna HTTP 406, e uma janela de 12 anos retorna o erro "O sistema aceita uma janela de consulta de, no máximo, 10 anos em séries de periodicidade diária" | O cliente fatia o período em janelas de no máximo 10 anos, sem sobreposição |
| V3 | Formato do retorno | Lista JSON de `{"data": "dd/mm/aaaa", "valor": "<decimal em texto>"}`. A série 12 trouxe 6 casas decimais (`"0.051660"`) em dias úteis; a série 433 trouxe 2 casas (`"0.33"`), datada no dia 1 de cada mês | Valores lidos como texto e gravados sem perda (D1); série mensal com data no dia 1 (D8) |
| V4 | Séries do catálogo inicial | Série 12: CDI, diária, % ao dia. Série 433: IPCA, mensal, % ao mês | Catálogo semeado com as duas (D9) |
| V5 | Filtros obrigatórios | A página da série 11 avisa que, desde 26/03/2025, o volume retornado é limitado e o uso de filtros é obrigatório | Coberto por V1 e V2 |

Fontes: <https://dadosabertos.bcb.gov.br/dataset/11-taxa-de-juros---selic/resource/b73edc07-bbac-430c-a2cb-b1639e605fa8> e chamadas a `api.bcb.gov.br` para as séries 12 e 433, em 2026-10-13. A disponibilidade do serviço não foi medida; os testes automatizados não dependem da rede (ver "Estratégia de testes").

### Quem calcula os casos de referência (evidência pendente da ideação)

Resolvido por P17: o autor da KB calcula cada caso passo a passo no próprio documento, o responsável confere numa planilha, e outra ferramenta ou modelo recalcula os casos sem ver os valores esperados (D12).

## Escopo

### Dentro do escopo

- KB-004, casos de referência e o registro da conferência independente (issue A).
- Migrações, políticas RLS, funções do banco e testes pgTAP da carteira e dos benchmarks (issues B e D).
- Módulos de regras em `src/lib/financeiro/` e o módulo de sincronização com o SGS, com testes Vitest (issues B, C e D).
- Aplicação das migrações em produção pelo responsável e verificação em produção somente leitura.
- Release `0.2.0` e encerramento, com a atualização da KB-003.

### Fora do escopo

- Telas de produto, painel, gráficos e a tela de administração de acessos (ciclo `004`).
- Rota HTTP ou botão de sincronização do SGS (ciclo `004`, junto com a tela de benchmarks; ver D10).
- Parser de quantias digitadas pelo usuário (O13): a KB especifica a regra, e a implementação vai com a tela de lançamentos (ciclo `004`).
- Migração de dados e o migrador (ciclo `005`), a tabela `investimentos_legacy` e o migrador histórico de CSV.
- Importação manual de séries por JSON ou CSV (P16).
- Tracking error, information ratio e beta (P16).
- Rentabilidade por ativo (D7).
- Benchmark de valor absoluto (nível de índice): a KB-004 especifica a regra, e a implementação fica para quando houver fonte para esse tipo de série (D14).
- Importação de dados reais em qualquer ambiente de teste ou preview.
- Qualquer mudança nas regras de governança.

## Decisões e autoridades

### Decisões do responsável

> **Decisão do responsável (2026-10-13):** ao autorizar o rascunho, perguntado sobre como tratar P1 a P18, o responsável escolheu "Adotar as recomendações". As recomendações da ideação passam a ser decisões, registradas abaixo. A aprovação do plano confirma este registro, mas não reabre as escolhas, salvo pedido do responsável.

| # | Decisão adotada | Efeito no plano |
| :-- | :-- | :-- |
| P1 | Um ciclo, quatro entregas (A a D) | Decomposição em quatro issues |
| P2 | Regras em funções puras de TypeScript; o fechamento é persistido por uma função do banco que confere as invariantes | D5 |
| P3 | (a) Razões em `float64`, com tolerância declarada nos testes; valores intermediários nunca arredondados | Tolerância de 10⁻⁹ (ver "Estratégia de testes"); nenhuma dependência nova |
| P4 | 2 casas na interface, meio-para-cima, para percentuais e índices | Função de apresentação na issue C |
| P5 | (a) O estorno é sempre total e vale exatamente o evento referenciado | Restrição no banco e na regra |
| P6 | (b) A transferência é movimento interno: nem resgate nem fluxo; o trânsito conta no patrimônio | D3 |
| P7 | (b) O fechamento exige o saldo real confirmado de cada ativo | Fechamento recusado com pendência |
| P8 | Primeiro fechamento define o início; meses estritamente sequenciais; só o último mês fechado reabre; mês reaberto sem consolidado (`N/D`) | D6 |
| P9 | (b) O tipo do ajuste vem de um atributo explícito do ativo | Coluna do ativo, sem dedução por texto |
| P10 | Todo fechamento confere a identidade contábil e é recusado se ela não fechar | Conferida em TypeScript e na função do banco |
| P11 | (a) Fluxo no fim do dia: peso `(D − d) / D` | Regra do Dietz |
| P12 | (b) O primeiro mês com retorno entra no acumulado; a mesma regra vale para o drawdown | Regras do acumulado e do drawdown |
| P13 | Rentabilidade do ano até a data, por encadeamento geométrico, com `N/D` propagado | Regra anual |
| P14 | Manter "variação do patrimônio" e "rentabilidade", com esses nomes | Duas funções distintas |
| P15 | (b) Mês sem decomposição de fluxos tem rentabilidade `N/D` | Regra para o tipo "migração histórica" |
| P16 | Mês parcial de benchmark (a) não é comparado; comparação em p.p. e em "% do benchmark", sobre os acumulados; métricas (b): só taxa de acerto e drawdown; SGS sim, importação manual não | Issue D; o catálogo inicial ficou sem recomendação e virou D9 |
| P17 | (a) e (c): o autor calcula na KB, o responsável confere numa planilha, outra ferramenta recalcula | D12 |
| P18 | A revisão deste plano, sobretudo da KB-004, deve ser feita por ferramenta diferente da autora | Recomendação registrada no "Próximo passo" |

### Decisões propostas ao responsável

Questões que a ideação deixou ao plano. Cada uma traz a recomendação do autor. A aprovação do plano precisa confirmar cada uma explicitamente, ou escolher outra opção. As de cálculo trazem exemplos numéricos fictícios.

> **Decisão do responsável (2026-10-14):** depois do veredito `APTO PARA APROVAÇÃO` da rodada 3, o responsável aprovou o plano ("aprovo o plano do ciclo 003") e, perguntado em seguida, confirmou explicitamente as recomendações de D1 a D14 ("Confirmo todas as recomendações"), inclusive a tolerância dos testes de razões, 10⁻⁹ × max(1, módulo do esperado), introduzida na `v3`. Nenhuma alternativa foi escolhida, então o desenho revisado não muda. As escolhas K1 a K7 continuam pendentes e são decididas na entrega A, antes do merge da PR A.

| # | Questão | Opções | Recomendação |
| :-- | :-- | :-- | :-- |
| D1 | Precisão de armazenamento de índices e taxas (delegada pela ADR-002) | (a) `numeric` sem escala fixa, gravando o valor exatamente como publicado; (b) `numeric(15,6)`, como na origem. Exemplo: um valor publicado como `0.00012345` fica `0.00012345` em (a) e `0.000123` em (b) | (a): não perde nada do que a fonte publica, e a conversão para `float64` só ocorre no cálculo (P3) |
| D2 | Persistência de percentuais | (a) nenhum percentual ou retorno é gravado: tudo é calculado na leitura, a partir de centavos e séries; (b) gravar o retorno mensal no consolidado, como a origem | (a): elimina o estouro de `Numeric(5,2)` e os valores velhos depois de uma reabertura (O6) |
| D3 | Modelo do trânsito (P6) | (a) cada usuário tem um ativo de sistema "Em trânsito"; uma transferência é um par de eventos ligados (saída do ativo de origem, entrada no destino ou no trânsito), de soma zero na carteira; (b) trânsito como saldo avulso, sem ativo | (a): o patrimônio é sempre a soma dos saldos dos ativos, o que resolve O10, e as transferências se anulam na identidade da carteira |
| D4 | Representação do sinal (H5) | (a) valor em centavos com sinal, diferente de zero, com restrição por tipo (aporte > 0, resgate < 0; rendimento, marcação e câmbio com qualquer sinal); (b) valor sempre positivo e um campo de direção | (a): as somas de saldo e da identidade ficam diretas, e o banco impede o sinal errado por tipo |
| D5 | Divisão do fechamento entre TypeScript e banco (P2) | (a) TypeScript calcula a prévia (pendências e ajustes); a função do banco recebe os saldos reais, recalcula as somas inteiras, grava ajustes, posições e consolidado numa transação e recusa se a identidade ou a sequência falharem; (b) o banco grava o que o TypeScript calculou e só confere | (a): o banco não confia no cliente. A soma de inteiros é a mesma nas duas camadas, e os mesmos casos de referência testam ambas |
| D6 | Ajuste e reabertura (P8, O6) | (a) o ajuste é registrado na posição mensal, com o tipo de P9; reabrir remove posições, ajustes e consolidado do mês, voltando exatamente ao estado anterior ao fechamento; (b) o ajuste é um evento imutável, e reabrir gera estornos dos ajustes | (a): o ajuste é derivado do saldo real informado, não um fato lançado pelo usuário; a reabertura fica simples e sem eventos de compensação. Os eventos lançados continuam imutáveis (H4) |
| D7 | Nível da rentabilidade | (a) só a carteira consolidada, como a ideação documenta na origem (BS:294-345); (b) também por ativo | (a): o pedido de rentabilidade por ativo, se houver, vira outro ciclo |
| D8 | Séries de benchmark (O9) | Cada benchmark tem uma única periodicidade (diária ou mensal); valores únicos por benchmark e data; série mensal datada no dia 1; uma nova sincronização substitui os valores da janela carregada (revisão da fonte); código SGS e periodicidade são imutáveis depois de criados, e uma série diferente é outro benchmark (`v3`, R2-2) | Adotar: elimina a mistura de linhas diárias e mensais e impede reaproveitar a cobertura de outra série |
| D9 | Catálogo inicial | (a) semear CDI (SGS 12, diária) e IPCA (SGS 433, mensal) por migração; (b) catálogo vazio, cadastrado pelo administrador no ciclo `004` | (a): as duas séries foram conferidas (V4) e são públicas |
| D10 | Forma da sincronização com o SGS neste ciclo (revisada na `v2`, R1-4) | (a) módulo de servidor, com o cliente do Supabase e o `fetch` injetados, executado com a sessão do administrador. Ele busca todas as janelas, valida todas as respostas e só então grava tudo numa única chamada a uma função do banco. A unidade atômica é uma sincronização de um benchmark para o período pedido: valores e cobertura (K4) gravados juntos, ou nada. Na `v3` (R2-2), essa função é `security definer`, exige `private.is_admin()`, toma uma trava por benchmark, substitui todos os valores da janela carregada pelos devolvidos pela fonte e é o único caminho de escrita: nem o admin tem `insert`, `update` ou `delete` nas tabelas de valores e de cobertura pela Data API, então nenhum valor muda sem que a cobertura seja recalculada junto. Sem rota HTTP nem tela; (b) também uma rota `POST` restrita ao admin; (c) gravar janela a janela, aceitando progresso parcial | (a): cada requisição ao PostgREST é uma transação própria, então só uma chamada única garante o "tudo ou nada". A rota e o botão chegam com a tela do ciclo `004` |
| D11 | Aritmética do dinheiro em TypeScript (revisada na `v2`, R1-3) | (a) dentro das regras, centavos são `bigint` nativo do JavaScript (tipo nominal `Centavos`), exatos em qualquer soma intermediária. No banco, a coluna gravada é `bigint`, mas toda acumulação é feita em `numeric`, sem o limite de 64 bits (`sum(bigint)` já devolve `numeric`; variáveis e expressões das funções são `numeric`), e a conversão para `bigint` só ocorre ao gravar, depois de conferir a faixa (`v3`, R2-1); na fronteira com o banco e o JSON, a conversão de e para `number` exige `Number.isSafeInteger`; toda coluna monetária gravada tem restrição de faixa ±(2⁵³ − 1) no banco. A única recusa possível é um valor gravado ou devolvido fora da faixa, e ela é igual nas duas camadas; (b) `number` com soma verificada a cada passo, que pode recusar em TypeScript uma ordem de soma que o banco aceita; (c) a guarda só nas entradas e saídas da `v1`, que perde centavos em intermediários | (a): aritmética exata nas duas camadas, sem biblioteca nova. P3 continua valendo só para razões, que convertem `bigint` em `number` na hora da divisão |
| D12 | Formato e conferência dos casos de referência (P17) | Valores de máquina em `tests/fixtures/financeiro/casos_referencia.json`; passo a passo e valor esperado de cada caso na KB-004, pelo mesmo identificador `CR-NN`; um teste confere que KB e JSON trazem o mesmo valor esperado; o recálculo por outra ferramenta, sem ver os esperados, e a conferência do responsável ficam em `003_validation_casos_referencia.md` | Adotar: o JSON alimenta os testes, a KB explica, e a divergência entre os dois reprova |
| D13 | Protocolo de escrita da carteira (nova na `v2`, R1-1 e R1-2) | (a) o usuário só tem `select` nas tabelas da carteira; toda escrita (criar e desativar ativo, lançar, estornar, transferir, fechar, reabrir) passa por funções `security definer` que, antes de ler qualquer estado, tomam a mesma trava transacional por usuário (`pg_advisory_xact_lock` sobre o `user_id`). Como essas funções são voláteis, cada comando depois da trava enxerga o que as transações anteriores já gravaram; (b) `insert` direto pela Data API, com gatilhos que tomam a mesma trava | (a): um único caminho de escrita, em que todos os participantes observam a trava. Em (b), qualquer tabela ou gatilho esquecido fura o protocolo |
| D14 | Benchmark de valor absoluto (R1-9) | (a) adiar: a KB-004 especifica a regra (retorno pela razão entre níveis; de 100 para 102, o retorno é 2%, não 102%) e a marca como não implementada; nenhuma série do catálogo inicial é de nível, e a importação manual ficou fora (P16); (b) implementar já, com o metadado de unidade no catálogo e um caso fictício | (a): sem fonte para esse tipo de série neste ciclo, o código ficaria sem uso. Incluí-lo seria ampliar o escopo decidido |

### Escolhas de cálculo que a KB-004 leva ao responsável

Pontos conhecidos que nem a ideação nem P1 a P18 decidem. A KB-004 apresenta cada um com alternativas e exemplos, e a PR A só vai a merge depois de o responsável decidir todos (ver "Pontos de aprovação"). Os exemplos e recomendações abaixo são só o ponto de partida.

| # | Questão | Exemplo fictício | Recomendação inicial |
| :-- | :-- | :-- | :-- |
| K1 | Acumulado e ano com um mês `N/D` no período (inclusive meses migrados, P15) | Retornos: jan 1,00%, fev `N/D`, mar 2,00%, abr −0,50%. (a) acumulado `N/D`; (b) acumulado só depois do último `N/D`: (1,02 × 0,995) − 1 = **1,49%**; (c) pulando o mês: (1,01 × 1,02 × 0,995) − 1 = **2,50%** | (a), pela seção 6.5 do `DESIGN.md`; as telas do ciclo `004` podem oferecer períodos que comecem depois do `N/D` |
| K2 | Estorno de um evento de mês já fechado | Aporte de R$ 1.000,00 em 20/jan (mês fechado), estornado em 05/fev. Fevereiro com 28 dias, Vi = R$ 11.000,00 e Vf = R$ 10.050,00. (a) o estorno é fluxo de −R$ 1.000,00 no dia 5: R = (10.050 − 11.000 + 1.000) / (11.000 − 1.000 × 23/28) = 50 / 10.178,57 = **0,4912%**; (b) recusar, e corrigir só reabrindo janeiro (que precisa ser o último mês fechado) | (a): (b) tornaria impossível corrigir meses antigos |
| K3 | "% do benchmark" com acumulado do benchmark ≤ 0 | Carteira 1,20% e IPCA acumulado −0,32%: a razão daria **−375%**. (a) `N/D`; (b) exibir a razão | (a) |
| K4 | Quando um mês de série diária está completo (P16; reescrita na `v2`, R1-5) | Cada benchmark guarda a cobertura contínua da carga: do `dataInicial` pedido na primeira sincronização até a data do último valor recebido; uma sincronização que deixaria um buraco na cobertura é recusada (D10). CDI fictício de 0,04% ao dia, janeiro com 21 dias úteis: completo, **0,8434%**; carga iniciada em 15/jan, com 10 dias de janeiro, **0,4007%**; sem o último dia, ainda não publicado, **0,8030%**. (a) completo quando a cobertura começa no dia 1 do mês ou antes **e** inclui um valor com data posterior ao último dia do mês; dia sem valor dentro da cobertura é dia sem taxa da fonte; (b) como (a), mais um calendário de dias úteis para detectar lacunas da fonte, que é uma fonte de dados nova; (c) como na `v1`: basta um valor publicado no mês seguinte, o que trataria a carga iniciada em 15/jan como janeiro completo | (a): a carga parcial e o último dia ainda não publicado ficam parciais e não são comparados. Limite declarado: sem calendário, uma lacuna da própria fonte dentro da cobertura não é detectável |
| K5 | Mês com Vi = 0 e aporte (carteira zerada e retomada) | Vi = R$ 0,00, aporte de R$ 1.000,00 no dia 10 de um mês de 30 dias, Vf = R$ 1.010,00. (a) Dietz normal: 10 / (1.000 × 20/30) = **1,50%**; (b) `N/D` | (a), como a origem: só o denominador ≤ 0 dá `N/D` |
| K6 | Correção de uma transferência (R1-2) | Saída fictícia de 10.000 centavos do ativo X e entrada de 10.000 centavos no trânsito, na mesma data. (a) a transferência só é corrigida como um todo: uma função estorna as duas pernas juntas, na mesma data, e a soma continua zero; (b) cada perna pode ser estornada sozinha: estornar só a saída deixaria um efeito líquido de **+10.000 centavos** na carteira, que não é fluxo nem rendimento e quebra a identidade de P10 | (a) |
| K7 | Início da carteira e lançamentos anteriores ao primeiro fechamento (R1-7) | Aporte fictício de 10.000 centavos datado de fevereiro, e o primeiro fechamento pedido para março. (a) o primeiro fechamento só é aceito no mês do evento mais antigo: o usuário começa por fevereiro; (b) os eventos anteriores ao mês do primeiro fechamento formam o saldo inicial de março (**R$ 100,00**), e março tem rentabilidade `N/D` por ser o primeiro mês (P8). Nas duas opções, depois do primeiro fechamento, todo lançamento com data anterior ao primeiro mês aberto é recusado, e reabrir o primeiro mês volta ao estado sem mês fechado | (a): todo evento pertence a um mês fechado, e nada fica escondido num saldo inicial |

Se a especificação revelar outra escolha de cálculo, ela recebe o próximo número `K`, segue o mesmo caminho e é registrada na KB-004. O agente nunca escolhe sozinho entre interpretações de cálculo (`.agent/ai_behavior.md`).

### Destino dos defeitos da origem

| # | Defeito | Destino |
| :-- | :-- | :-- |
| O1 | Sinal dependente de texto livre | Corrigido: sinal no valor, com restrição por tipo (D4) |
| O2 | Estorno com valores diferentes no saldo e na rentabilidade | Corrigido: estorno total, igual ao referenciado (P5) |
| O3 | Trânsito no patrimônio sem ser fluxo | Corrigido: transferência interna, de soma zero (P6, D3) |
| O4 | Acumulado sem o primeiro mês | Corrigido: o primeiro mês entra (P12) |
| O5 | Fechamento sem conferir pendências; sequência inconsistente | Corrigido: pendência recusa o fechamento (P7) e meses sequenciais (P8) |
| O6 | Reabertura sem invalidar nada | Corrigido: reabrir remove posições, ajustes e consolidado (D6); retornos não são gravados (D2) |
| O7 | Tipo do ajuste deduzido por texto | Corrigido: atributo explícito do ativo (P9) |
| O8 | Medidas de dispersão misturadas | Descartado neste ciclo: tracking error, information ratio e beta adiados (P16); o drawdown inclui o primeiro mês, como o acumulado (P12) |
| O9 | Mês parcial composto como inteiro; linhas diárias sobrescrevendo a mensal | Corrigido: mês parcial não comparado (P16, K4); uma periodicidade por série (D8) |
| O10 | Patrimônio do painel sem o trânsito | Corrigido: o trânsito é um ativo da carteira (D3) |
| O11 | Identidade contábil não conferida | Corrigido: conferida em todo fechamento (P10, D5) |
| O12 | Meses migrados tratados como rendimento | Corrigido: rentabilidade `N/D` (P15); o tratamento no acumulado é K1 |
| O13 | Parser monetário remove todo "." | Especificado na KB-004; implementado com a tela de lançamentos (ciclo `004`) |

### Pontos de aprovação

| Ponto | Precondição | Cobre | Não cobre | Conferir |
| :-- | :-- | :-- | :-- | :-- |
| Autorizar rascunho do plano | Ideação registrada | Este rascunho, a reserva em `cycles.md` como `Planejamento` e o registro das decisões P1 a P18 | Revisão, aprovação, issues, implementação | Concedido em 2026-10-13 |
| Aprovar plano ("aprovo o plano do ciclo 003") | Veredito `APTO PARA APROVAÇÃO` ou `APTO COM RESSALVAS` posterior à última correção, de preferência de outra ferramenta (P18) | Decisões D1 a D14 confirmadas ou escolhidas; PR documental `chore/cycle-003-plan` com a ideação, o plano e `cycles.md`; seu merge com checks verdes; criação das issues A a D depois de apresentar o payload; o encerramento do ciclo | Implementação; as escolhas K; merges das PRs de issue, de release e de encerramento; ação externa; verificação em produção | Veredito, ressalvas, D1 a D14 |
| Autorizar implementação ("autorizo a implementação da issue #N"), uma por issue | Plano `Aprovado` e integrado; issue anterior integrada (sequência A → B → C → D) | Branch, task, código, testes e abertura da PR daquela issue | Merge; outra issue | Issue e escopo |
| Aprovar merge da PR A | Checks verdes; K1 a K7 e qualquer outra escolha `K` decididas pelo responsável e registradas na KB-004; recálculo independente e conferência do responsável registrados em `003_validation_casos_referencia.md`, sem divergência aberta | Merge por squash | Implementação das regras | KB-004, casos, registro de validação, diff |
| Aprovar merge das PRs B, C e D | Checks verdes, inclusive `supabase test db`; casos de referência da entrega passando | Merge por squash | Aplicação das migrações em produção | Checks, diff e barreiras na PR |
| Ação humana externa ("concluí a ação externa da issue #N", na issue D) | PR D integrada | O responsável aplica em produção as migrações do ciclo, pelo procedimento da KB-002 (`supabase db push`) | Qualquer outra mudança no painel do Supabase ou na Vercel | Lista de migrações a aplicar, que a task da issue D apresenta |
| Verificar produção ("autorizo a verificação em produção do ciclo 003") | Ação externa concluída | Consultas somente leitura listadas em "Verificação em produção" | Qualquer escrita em produção, inclusive sincronizar o SGS | Itens de verificação |
| Aprovar merge da PR de release | Verificação em produção concluída; PR aberta pelo release-please | Release `0.2.0` | — | Versão e notas |
| Aprovar merge da PR de encerramento | Release integrada | Encerramento prospectivo (`chore/cycle-003-closure`) | — | Diff documental |

Toda cadeia autorizada para (situação "Parado", com a pergunta registrada) quando:

- surgir uma escolha de cálculo não decidida, ou uma divergência entre a KB-004, o JSON e o recálculo independente;
- um caso de referência falhar e a causa não for um erro de digitação comprovado;
- a implementação exigir dependência nova, tabela não prevista ou mudança das decisões acima;
- um teste de isolamento falhar, ou uma função `security definer` não puder ser provada restrita ao usuário autenticado;
- algum dado que possa ser do usuário for necessário para testar;
- uma precondição não puder ser verificada pelo agente.

## Barreiras de domínio

| Barreira | Aplica-se? | Como o ciclo a atende ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim | KB-004 com casos de referência fictícios calculados à mão, conferidos pelo responsável e recalculados por outra ferramenta (D12); testes automatizados de todas as regras contra os casos; centavos exatos nas duas camadas (`bigint` no TypeScript, acumulação em `numeric` no banco), com a mesma faixa e a mesma recusa (D11); Dietz com numerador e denominador inteiros e uma única divisão; identidade contábil em todo fechamento (P10); transferências de soma zero garantidas no banco (D13, K6) |
| G2 — isolamento por RLS | Sim | Toda tabela nova com RLS, grants explícitos e teste pgTAP com dois usuários e o admin; usuário só com `select` na carteira, e toda escrita por funções `security definer` com `search_path` vazio, filtro por `auth.uid()`, chaves estrangeiras que exigem o mesmo usuário em toda referência e teste de tentativa sobre dados alheios (D13); lista explícita de funções executáveis por `authenticated` no teste de funções; benchmarks lidos por qualquer autenticado e gravados só pela função de carga, que exige o admin, sem dado do usuário |
| G3 — privacidade de dados | Sim | Casos, fixtures e testes só com dados fictícios e índices públicos; nenhum valor, teste ou fixture copiado da origem (ideação, "Privacidade da origem"); a verificação em produção só confere estrutura e o catálogo global, nunca linhas de carteira |
| G4 — migrações só acrescentam | Sim | Migrações novas, geradas por `supabase migration new`; nenhuma migração existente é editada |

## Estratégia de testes

- **Casos de referência (G1):** os testes Vitest de cada regra leem `tests/fixtures/financeiro/casos_referencia.json`. Centavos são comparados por igualdade exata. Razões (retornos, composições, percentuais) são comparadas com erro de no máximo 10⁻⁹ × max(1, |esperado|) sobre a fração: absoluto até 1, relativo acima (P3; na `v3`, R2-3, para retornos muito grandes como o do caso do denominador com cancelamento). Um teste confere que cada caso do JSON aparece na KB-004 com o mesmo valor esperado.
- **Cobertura mínima dos casos:** pelo menos um caso por regra e por caso de borda da KB-004, incluindo sinais por tipo, estorno, transferência e trânsito, ajuste positivo e negativo, fechamento recusado por pendência e por identidade, reabertura, Dietz com o exemplo de P11, fevereiro de ano bissexto, primeiro mês, denominador ≤ 0, K1 a K7, acumulado, ano, variação, mês migrado, composição diária, mês parcial, série mensal, comparação em p.p. e em %, taxa de acerto, drawdown e arredondamento de apresentação (inclusive valores que o `float64` não representa exatamente, como 1,005).
- **Datas civis:** as regras recebem e devolvem datas como texto `AAAA-MM-DD` e calculam dias do mês aritmeticamente, sem `Date` local. O "hoje" usa `America/Cuiaba` por `Intl`. Um teste executa as regras de data com `TZ=UTC` e com um fuso distante (por exemplo, `Pacific/Kiritimati`) e exige o mesmo resultado.
- **Faixa do dinheiro (D11):** casos perto de ±(2⁵³ − 1), soma com cancelamento (o exemplo da rodada 1, `(9.007.199.254.740.991 + 2) − 2`, precisa dar o valor exato), diferença entre saldos de sinais opostos e consolidação. Caso de cancelamento com subtotal acima de 64 bits (1.025 lançamentos de 9.007.199.254.740.991 centavos e 1.025 opostos, subtotal de 9.232.379.236.109.515.775 e resultado zero), inclusive na apuração do ajuste, com o mesmo resultado exato nas duas camadas; e caso cujo resultado final excede a faixa, com a mesma recusa e sem gravação parcial. TypeScript e banco produzem o mesmo valor ou a mesma recusa, e o banco recusa gravar um valor que o TypeScript não consiga ler.
- **Banco (pgTAP):** para cada tabela nova, isolamento entre dois usuários fictícios e o admin (leitura, inserção, alteração, exclusão); escrita só pelas funções (D13); imutabilidade dos eventos; transferência (perna isolada, soma diferente de zero, referência a ativo ou evento de outro usuário, duplicação do trânsito, correção por K6), sempre preservando o estado anterior na falha; início da carteira (K7); função de fechamento (sequência, pendência, identidade, ajustes, reabertura só do último mês, tentativa sobre outro usuário); os casos de referência de fechamento executados também na função do banco; benchmarks (leitura por autenticado; `insert`, `update` e `delete` diretos recusados para o admin e para o usuário pela Data API; função de carga recusada para quem não é admin; código e periodicidade imutáveis; catálogo semeado; gravação atômica da sincronização e cobertura certificada depois de uma carga integral bem-sucedida).
- **Concorrência (R1-1):** testes com duas sessões, dentro de `supabase test db`, usando a extensão `dblink` com duas conexões que gravam e depois removem as próprias fixtures fictícias. Sem esperas por tempo: uma sessão segura a trava sem confirmar, e a outra usa `lock_timeout` curto ou `dblink_send_query`. Cenários: lançamento contra fechamento, criação de ativo contra fechamento, fechamento contra fechamento e fechamento contra reabertura. O resultado aceito é incluir a operação concorrente na apuração ou recusá-la, nunca um mês fechado que diverge dos eventos nem gravação parcial. A viabilidade do `dblink` no Supabase local e no CI é conferida no início da issue B; se ele não servir, a situação passa a "Parado", sem trocar de mecanismo por conta própria.
- **SGS:** testes com `fetch` falso: fatiamento em janelas de no máximo 10 anos, formato das datas, leitura dos valores como texto, resposta de erro e HTTP 406. Falha numa janela posterior, payload inválido e falha na gravação deixam catálogo, valores e cobertura no estado anterior; repetir uma sincronização bem-sucedida não muda nada. Cobertura (K4): carga começando no meio do mês, mês anterior ausente apesar de haver mês seguinte, carga interrompida e sincronização que deixaria buraco (recusada). Nenhum período sabidamente incompleto vira retorno comparável nem zero. Nenhum teste chama a rede.
- **Gates mínimos:** os de `_project/README.md` para entregas que tocam a aplicação e o banco. Nenhum teste ponta a ponta novo, porque não há tela; os existentes continuam verdes.

## Itens de implementação

### Item A — KB-004 e casos de referência

**Contexto:** H1 e P17. A especificação vem antes do código, e os testes leem os mesmos casos.

**Ação técnica:**

- Criar `_project/knowledge/KB-004_regras_financeiras.md` pelo template `.agent/templates/kb.md`, com:
  - unidades e representação: centavos inteiros, datas civis em `America/Cuiaba`, índices como publicados (D1), razões em `float64` (P3), apresentação com 2 casas meio-para-cima (P4);
  - faixa monetária aceita e política de recusa (D11);
  - tipos de evento e seus sinais (D4), estorno (P5, K2), transferência, sua correção e o trânsito (P6, D3, K6), migração histórica (P15);
  - início da carteira e datas aceitas para lançamento (P8, K7);
  - fechamento em três etapas, pendência (P7), ajuste e seu tipo (P9, D6), identidade contábil (P10), sequência e reabertura (P8);
  - consolidação e patrimônio (D3), variação do patrimônio e rentabilidade (P14), Modified Dietz (P11, K5), acumulado (P12, K1), ano (P13), drawdown;
  - benchmarks: periodicidade (D8), cobertura da carga e completude do mês (K4), composição mensal, comparação em p.p. e em % (K3), taxa de acerto;
  - regra do benchmark de valor absoluto, marcada como não implementada (D14);
  - regra do parser de quantias (O13), sem implementação;
  - para cada regra, a evidência da origem e se ela é mantida, corrigida ou descartada, e por quê;
  - a seção de casos `CR-NN`, com entradas, passo a passo e valor esperado.
- Criar `tests/fixtures/financeiro/casos_referencia.json` com os mesmos casos e o teste de concordância entre KB e JSON (D12).
- Levar K1 a K7, e qualquer novo `K`, ao responsável, com as alternativas e os exemplos, e registrar cada decisão na KB-004 com a data.
- Registrar em `_project/drafts/003_regras_financeiras/003_validation_casos_referencia.md` o recálculo por outra ferramenta ou modelo, feito sem ver os valores esperados, e a conferência do responsável na planilha. Cada divergência é resolvida e registrada antes do merge.

**Critérios de aceite:**

- [ ] Toda regra listada na ação técnica está especificada, com unidade, precisão, tratamento de `N/D` e casos de borda.
- [ ] Toda regra cita a evidência da origem e o destino (mantida, corrigida ou descartada).
- [ ] K1 a K7, e qualquer novo `K`, estão decididos pelo responsável e registrados com data.
- [ ] Os casos cobrem a lista mínima de "Estratégia de testes".
- [ ] O teste de concordância passa, e falha quando um valor esperado diverge entre KB e JSON.
- [ ] O registro de validação mostra o recálculo independente e a conferência do responsável, sem divergência aberta.
- [ ] Nenhum dado do usuário nem valor da origem.

### Item B — Schema da carteira, lançamentos e fechamento

**Contexto:** P2, P5 a P10, D3 a D6, D11, D13, K2, K6, K7, H4 e H5.

**Ação técnica:**

- Migração nova com:
  - ativos por usuário, com o atributo do tipo de ajuste (P9) e desativação lógica; o ativo de sistema "Em trânsito" é único por usuário (índice único parcial) e só as funções o criam (D3);
  - eventos com valor em centavos com sinal (`bigint`), data civil, tipo, referência de estorno e ligação de transferência, com as restrições de D4 e P5 (um estorno por evento, sem estorno de estorno);
  - chaves estrangeiras compostas com `user_id` em toda referência (evento → ativo, estorno → evento, perna → transferência), para que nenhuma linha aponte para dado de outro usuário;
  - meses por usuário, com estado aberto ou fechado;
  - posições mensais (saldo inicial, saldo final, ajuste e seu tipo) e consolidado mensal, só em centavos (D2);
  - restrição de faixa ±(2⁵³ − 1) em toda coluna monetária (D11);
  - RLS, grants e revokes explícitos: o usuário só tem `select` nas próprias linhas; nenhuma escrita direta pela Data API (D13), o que também garante a imutabilidade dos eventos (H4).
- Funções `security definer` em `public`, com `search_path` vazio e filtro por `auth.uid()`, todas tomando primeiro a trava por usuário de D13: criar e desativar ativo, lançar evento, estornar evento, registrar e corrigir transferência, `fechar_mes` e `reabrir_mes`. Regras que elas aplicam:
  - lançamento só com data igual ou posterior ao primeiro mês aberto, depois do primeiro fechamento, e o início da carteira como decidido em K7;
  - transferência criada numa só chamada, com as duas pernas do mesmo usuário, na mesma data, de valores opostos e exatamente duas por transferência; estorno direto de uma perna recusado, e a correção como decidido em K6;
  - fechamento e reabertura conforme D5 e D6, com erro explícito e sem gravação parcial quando duas chamadas disputam o mesmo mês.
- Atualização cirúrgica de `supabase/tests/database/03_funcoes.test.sql` (R1-6): a asserção que hoje só aceita `is_admin` passa a listar as assinaturas autorizadas a `authenticated`; `PUBLIC` e `anon` continuam sem execução, os auxiliares internos ficam em `private` sem acesso, e uma função não listada continua reprovando.
- Módulos em `src/lib/financeiro/`: tipo `Centavos` sobre `bigint` e conversões de fronteira (D11); saldo por ativo e por mês; validação de estorno e transferência; prévia do fechamento (pendências e ajustes) e identidade contábil.
- Testes Vitest contra os casos de referência e testes pgTAP do isolamento, da imutabilidade, das transferências, do fechamento e da concorrência.

**Critérios de aceite:**

- [ ] Toda tabela nova tem RLS e teste de isolamento com dois usuários e o admin; o admin não lê carteira alheia.
- [ ] Nenhuma escrita direta pela Data API em tabela da carteira; nenhuma referência aceita para ativo ou evento de outro usuário.
- [ ] Transferência com perna isolada, soma diferente de zero ou trânsito duplicado é recusada, e a falha preserva o estado anterior.
- [ ] `fechar_mes` recusa: pendência, mês fora de sequência, identidade que não fecha e mês de outro usuário; grava ajustes, posições e consolidado de uma vez.
- [ ] `reabrir_mes` só reabre o último mês fechado e volta ao estado anterior ao fechamento.
- [ ] Os testes de concorrência mostram a operação concorrente incluída ou recusada, sem mês fechado divergente.
- [ ] Os casos perto da faixa monetária dão o mesmo valor ou a mesma recusa em TypeScript e no banco.
- [ ] O teste de funções adaptado e os novos passam juntos, e uma função não autorizada ainda é detectada.
- [ ] Os casos de referência de lançamento e fechamento passam em TypeScript e na função do banco.
- [ ] Nenhuma dependência de pacote nova.

### Item C — Consolidação e rentabilidade

**Contexto:** P11 a P15, D2, D7 e K1, K2 e K5.

**Ação técnica:**

- Módulos em `src/lib/financeiro/`: patrimônio consolidado (com o trânsito); variação do patrimônio; Modified Dietz mensal da carteira, com fluxos de aporte, resgate e seus estornos, e `N/D` nos casos da KB-004; acumulado e ano por encadeamento geométrico; série base 100 e drawdown; arredondamento de apresentação (P4).
- Funções puras sobre dados lidos do banco; nada é gravado (D2). Somas em `Centavos` (`bigint`); a conversão para `number` só ocorre na divisão das razões (D11).
- Modified Dietz na forma inteira equivalente (`v3`, R2-3): R = D·(Vf − Vi − ΣF) / (D·Vi + Σ F·(D − d)), com numerador e denominador calculados em `bigint` e uma única divisão no fim. É a mesma fórmula de P11, sem pesos fracionários antes da divisão.
- Testes Vitest contra os casos de referência.

**Critérios de aceite:**

- [ ] O exemplo de P11 dá 0,9524%; o de P12, 2,50%; o de P14, variação de 11,00% e rentabilidade de 0,95%.
- [ ] O caso fictício da rodada 2 (mês de 30 dias; Vi = 999.979 centavos; fluxo de −1.034.461 no dia 1 e de +34.482 no dia 30; Vf = 1 centavo) dá exatamente R = 30, isto é, 3.000%, dentro da tolerância.
- [ ] Mês aberto, reaberto, primeiro mês, denominador ≤ 0 e mês migrado dão `N/D`, e o `N/D` se propaga como a KB-004 decidir (K1).
- [ ] Transferências não alteram a rentabilidade (exemplo de P6: 0,50%).
- [ ] O arredondamento de apresentação passa os casos de meio-para-cima, inclusive 0,125 → 0,13 e 1,005 → 1,01.
- [ ] Todos os casos de referência da entrega passam.

### Item D — Benchmarks, SGS e comparação

**Contexto:** P16, D1, D8 a D10, D14, K3 e K4.

**Ação técnica:**

- Migração nova com catálogo, valores e cobertura de benchmark (D1, D8, K4), legíveis por qualquer usuário autenticado e graváveis só pelo admin, e a semente de CDI (SGS 12) e IPCA (SGS 433) (D9).
- Tabelas de benchmark só com `select` para `authenticated`; nenhuma escrita direta, nem do admin (D10).
- Função do banco, `security definer`, com `search_path` vazio, que exige `private.is_admin()`, toma uma trava por benchmark e grava numa só transação os valores da janela (substituindo os anteriores dessa janela) e a cobertura nova, recusando a carga que deixaria buraco na cobertura (D10, K4). Ela entra na lista do teste de funções (R1-6).
- Gatilho que recusa a alteração do código SGS e da periodicidade de um benchmark existente (D8).
- Módulo de servidor de sincronização com o SGS (D10): janelas de no máximo 10 anos, datas `dd/MM/aaaa`, valores lidos como texto, validação de todas as respostas antes de gravar e uma única chamada de gravação.
- Módulos de regras: composição mensal de série diária, completude do mês (K4), retorno de série mensal, acumulado do benchmark, comparação em p.p. e em "% do benchmark" sobre os acumulados (K3) e taxa de acerto.
- Testes Vitest com `fetch` falso e contra os casos de referência; testes pgTAP de acesso aos benchmarks e da semente.
- A task da issue D lista as migrações do ciclo e o roteiro da ação externa, pela KB-002.

**Critérios de aceite:**

- [ ] O exemplo de P16 dá 0,8434% no mês completo, e o mês parcial não é comparado.
- [ ] O exemplo de comparação de P16 dá +0,10 p.p. e 112,5% (sobre acumulados).
- [ ] Usuário comum lê e não grava benchmarks; o admin só grava pela função de carga; `insert`, `update` e `delete` diretos são recusados para todos; o catálogo semeado tem as duas séries.
- [ ] Código SGS e periodicidade não mudam depois de criados.
- [ ] A sincronização não chama a rede nos testes e nunca pede uma janela diária maior que 10 anos.
- [ ] Qualquer falha de busca, validação ou gravação deixa catálogo, valores e cobertura como estavam; repetir uma sincronização bem-sucedida é idempotente.
- [ ] Carga parcial do mês, mês anterior ausente e carga interrompida não produzem retorno comparável nem zero.
- [ ] Todos os casos de referência da entrega passam.

### Verificação em produção

Depois da ação externa e com a autorização do responsável. Somente leitura, sem tocar linhas de carteira:

- as migrações do ciclo aparecem como aplicadas;
- toda tabela nova de `public` tem RLS ativo;
- o catálogo tem CDI (12) e IPCA (433);
- a aplicação em produção continua respondendo em `/entrar` e o keepalive segue sem erro.

O agente executa as consultas se tiver acesso de leitura que o responsável autorize; senão, o responsável as executa pelo editor SQL do Supabase e informa os resultados, e o agente os confere.

## Arquivos afetados

| Entrega | Arquivos |
| :-- | :-- |
| PR documental do plano | `_project/ideations/003_regras_financeiras.md`, `_project/drafts/003_regras_financeiras/003_plan.md`, `_project/cycles.md` |
| A | `_project/knowledge/KB-004_regras_financeiras.md`, `tests/fixtures/financeiro/casos_referencia.json`, teste de concordância em `src/lib/financeiro/`, `_project/drafts/003_regras_financeiras/003_validation_casos_referencia.md`, task da issue A, `scripts/governance-manifest.json` (inclusão da KB-004 em `requiredFiles`) |
| B | Migração nova em `supabase/migrations/`, testes novos em `supabase/tests/database/` e a adaptação de `03_funcoes.test.sql`, módulos e testes em `src/lib/financeiro/`, task da issue B |
| C | Módulos e testes em `src/lib/financeiro/`, task da issue C |
| D | Migração nova, testes pgTAP (inclusive a nova função em `03_funcoes.test.sql`), módulos e testes em `src/lib/financeiro/` e `src/lib/benchmarks/`, task da issue D |
| Encerramento | `_project/knowledge/KB-003_visao_produto_arquitetura.md`, `README.md` se necessário, `_project/cycles.md`, mudança para `_project/executed/003_regras_financeiras/` |

Os nomes exatos de tabelas, funções e arquivos são fixados na KB-004 e nas PRs, dentro destas decisões.

## Decomposição em issues e PRs

| Issue | Prefixo e título | Branch | Depende de |
| :-- | :-- | :-- | :-- |
| A | `[CHORE] KB-004: regras financeiras e casos de referência` | `chore/issue-N` | Plano integrado |
| B | `[FEATURE] Schema da carteira, lançamentos e fechamento mensal` | `feature/issue-N` | A |
| C | `[FEATURE] Consolidação e rentabilidade (Modified Dietz)` | `feature/issue-N` | B |
| D | `[FEATURE] Benchmarks, sincronização com o SGS e comparação` | `feature/issue-N` | C |

Uma PR por issue. A PR documental do plano, a PR de release e a PR de encerramento não têm issue.

## Dependências e blockers

- Aprovação do plano, com D1 a D14 confirmadas.
- Decisões K antes do merge da PR A.
- Disponibilidade de outra ferramenta ou modelo para o recálculo independente (P17) e para a revisão do plano (P18). Se não houver, a situação passa a "Parado" com a pergunta ao responsável.
- Acesso do responsável ao Supabase de produção para a ação externa.
- Nenhuma dependência de pacote nova prevista. Os testes de concorrência usam a extensão `dblink` do PostgreSQL só dentro dos testes de banco; sua viabilidade no Supabase local e no CI é conferida no início da issue B.

## Riscos, suposições e rollback

- **Casos não independentes (G1):** mitigado pelo recálculo sem ver os esperados e pela conferência do responsável (D12).
- **Divergência entre TypeScript e banco:** os mesmos casos de fechamento rodam nas duas camadas (D5).
- **Ponto flutuante:** dinheiro nunca é `float` (D11); razões com tolerância declarada (P3).
- **Fuso e calendário:** datas civis em texto e teste com fusos distintos.
- **`security definer` furando o isolamento (G2):** filtro por `auth.uid()` e testes de tentativa sobre dados alheios.
- **Schema difícil de corrigir (G4):** o schema segue a KB-004 já decidida; correção posterior só por migração nova.
- **SGS:** mudança de formato ou limite da API afeta só a sincronização; os testes usam respostas falsas no formato verificado (V3).
- **Tamanho do ciclo:** se a revisão não convergir, o fatiamento é revisto com o responsável.
- **Suposição:** o volume de séries cabe no plano gratuito do Supabase (CDI diário rende cerca de 250 linhas por ano).
- **Concorrência:** todo caminho de escrita passa pela mesma trava (D13) e é testado com duas sessões.
- **Rollback:** uma migração versionada nunca é removida nem editada, nem antes da ação externa (G4 e o passo de CI em `.github/workflows/governance.yml`), porque os testes locais e o CI já a aplicaram. O código é revertido por PR que preserva os arquivos SQL; o schema é corrigido por migração nova. Nenhum usuário usa as tabelas até o ciclo `004`, então a produção não é afetada por uma correção.

## Sequência recomendada

1. Revisão formal do plano, de preferência por outra ferramenta (P18), e correções.
2. Aprovação do plano, com D1 a D14.
3. PR documental `chore/cycle-003-plan` e merge com checks verdes.
4. Criação das issues A a D, depois de apresentar o payload.
5. Issue A: KB-004, decisões K, validação independente, PR e merge.
6. Issue B, issue C e issue D, cada uma com autorização, PR e merge.
7. Ação externa: migrações em produção.
8. Verificação em produção.
9. Release `0.2.0`.
10. Encerramento prospectivo, com a KB-003 atualizada.

## Referências

- Ideação: `_project/ideations/003_regras_financeiras.md`.
- `.agent/ai_behavior.md` e `_project/README.md` (G1 a G4, pontos de aprovação, encerramento prospectivo).
- ADR-002 (stack, centavos inteiros, fuso, SGS) e ADR-003 (acesso e privacidade).
- KB-001 (origem fixada em `Meus-Investimentos` @ `1b13b033ce4335c09df80237c8c31b96b37e3797`), KB-002 (aplicação de migrações em produção) e KB-003 (visão do produto).
- `design-system/DESIGN.md`, seção 6.5 (`N/D`).
- Documentação do SGS, conforme "Verificação do SGS".

## Rastreabilidade

| Campo | Valor |
| :-- | :-- |
| Issue(s) | — |
| PR(s) | Plano: `chore/cycle-003-plan`, verificável no GitHub |
| Branch(es) | Plano: `chore/cycle-003-plan` |
| Destino após conclusão | `_project/executed/003_regras_financeiras/003_plan.md` |

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Pronto para continuar — ciclo 003 (completo)
Quem: Qualquer ferramenta, a pedido do responsável
Conferir: —
Diga: "continue o ciclo 003"
```

A aprovação de 2026-10-14 cobre o próximo passo: a PR documental `chore/cycle-003-plan` (ideação, plano e `cycles.md`), seu merge com checks verdes e, depois dele, a criação das issues A a D, com o payload apresentado ao responsável antes da criação. Ela não cobre a implementação de nenhuma issue.

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 003 + atualizar_docs + 003_plan/aprovacao + v3`
- `effect_class`: `local_mutation` (a PR documental que se segue é `remote_mutation`, coberta pela aprovação)
- `state_before` / `state_after`:
  - antes: ciclo `003` em `Planejamento`; plano `v3` em `Em Revisão`, revisão `Concluída`, veredito `APTO PARA APROVAÇÃO` (rodada 3), aprovação `Pendente`, bloco "Aguardando aprovação do plano";
  - depois: plano `v3` `Aprovado` (`Aprovada em 2026-10-14`), D1 a D14 confirmadas, bloco "Pronto para continuar"; ciclo continua em `Planejamento` até a primeira entrega.
- `result`: `executed`
- `evidence`:
  - manifestação humana "aprovo o plano do ciclo 003", em 2026-10-14, posterior ao veredito da rodada 3;
  - confirmação explícita das recomendações de D1 a D14 e da tolerância, dada no chat em 2026-10-14 e registrada em "Decisões propostas ao responsável";
  - autoridades lidas: `.agent/workflows/atualizar_docs.md`, `.agent/skills/doc-updater/doc-updater.md`, `_project/README.md` ("Pontos de aprovação", "Fluxo por nível") e a PR documental do ciclo `002` como precedente;
  - histórico: `rascunhar_plano` produziu `v1`, `v2` e `v3`; `revisar_plano` registrou as rodadas 1 a 3, preservadas abaixo;
  - validador de governança executado depois da gravação.
- `blockers`: nenhum.

## Revisão crítica

### Rodada 1

- **Autor:** Thiago Andrade e Claude (Claude Code, Opus 5.5), conforme autoria do rascunho.
- **Revisor:** Codex desktop, GPT-6.
- **Data e autorização:** 2026-10-14; solicitação humana "revise o plano do ciclo 003". Autoriza este parecer formal e seu registro, sem correção do desenho ou implementação.
- **Base:** `main` @ `0b6765c05675badf949af5c999c603bf344eb7ab`; plano local `v1`; ciclo `003` em `Planejamento`; plano e ideação ainda não versionados. Consulta ao GitHub: nenhuma issue do ciclo e nenhuma PR aberta no repositório.
- **Identidade da origem:** SHA-256 do plano anterior à revisão, normalizado em UTF-8/LF: `9520209e29bc75817344bf85bd153dea6667d66fd021302c0d7aa1972cfc4428`. SHA-256 do trecho de `## Problema e contexto` até imediatamente antes de `## Próximo passo`: `fd0dadd677a6ef43d9727c5d492c273555ba6d6582b73ef0ceefc13066face50`. Esse trecho é preservado pelo revisor.
- **Template e autoridades lidos:** `.agent/templates/plano_implementacao.md`, `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, `.agent/workflows/revisar_plano.md`, ideação do `003`, ADR-001 a ADR-004, KB-001 a KB-003, `design-system/DESIGN.md` §6.5, lições aprendidas, manifesto, migrações, testes de banco, configuração do Vitest e CI.
- **Limite:** a KB-004 e os casos de referência ainda não existem. O recálculo dos exemplos deste plano não substitui a validação independente sem acesso aos esperados exigida na entrega A. P1 a P18 são tratados como decisões humanas registradas no artefato; D1 a D12 e K1 a K5 continuam propostas.

#### Achados bloqueadores

**R1-1 — A trava do fechamento não cobre os outros escritores da carteira.**

- **Local:** item B, especialmente o INSERT direto de eventos/ativos, a recusa de lançamentos em mês fechado e a trava por usuário em `fechar_mes`/`reabrir_mes`; estratégia de testes de banco.
- **Evidência e efeito:** o plano só exige a trava nas duas funções. Uma inserção concorrente pode conferir que o mês está aberto, enquanto o fechamento lê os eventos; o fechamento grava suas posições e a inserção termina depois, deixando um evento válido fora do consolidado fechado. Um ativo criado durante a conferência também pode escapar da lista de saldos confirmados. A restrição de data e a transação do fechamento, isoladamente, não eliminam essa corrida. A documentação do [PostgreSQL sobre locks](https://www.postgresql.org/docs/current/explicit-locking.html) esclarece que locks de linha protegem as linhas envolvidas e que advisory locks precisam ser observados pelos participantes.
- **Correção necessária:** declarar um protocolo comum no banco para todos os escritores que afetam o fechamento, inclusive INSERT direto, transferências e criação de ativos. A validação do estado deve usar a visão correta depois da sincronização. Definir também o resultado de duas chamadas simultâneas de fechamento/reabertura, sem deixar a garantia apenas no TypeScript.
- **Evidência para resolver:** testes com duas sessões, executados pelo gate de banco/CI, para lançamento versus fechamento, criação de ativo versus fechamento e fechamento/reabertura concorrentes. O resultado deve incluir o evento/ativo na apuração ou recusar a operação, sem snapshot fechado divergente nem gravação parcial.

**R1-2 — Transferências de soma zero não têm garantia transacional no banco.**

- **Local:** D3, P5/P6, item B e critérios de isolamento/lançamento.
- **Evidência e efeito:** D3 descreve um par ligado, mas B permite inserir eventos diretamente e só enumera restrições detalhadas para estorno. Não exige que o banco recuse uma perna órfã, valores diferentes ou referências a ativo/perna de outro usuário. Com eventos imutáveis, uma falha entre duas inserções deixa a carteira incompleta. Estornar apenas uma perna pode desfazer a soma zero. RLS por `user_id` na linha inserida precisa ser acompanhada de integridade das referências; a validação pura de TypeScript não protege a Data API.
- **Correção necessária:** explicitar a operação atômica e as invariantes de transferência no banco: participantes do mesmo usuário, valores opostos, cardinalidade e tratamento das datas para preservar a soma zero por período. Exigir que evento e ativo referenciado pertençam ao mesmo usuário em todos os tipos. Levar à KB/responsável a regra de correção de uma transferência, com exemplo de saída fictícia de 10.000 centavos e entrada de 10.000: permitir estorno de uma única perna deixaria um efeito líquido de 10.000 centavos. Definir também a proteção do ativo de sistema contra duplicação ou criação forjada pelo usuário.
- **Evidência para resolver:** testes de banco via papéis da API para perna isolada, segunda perna inválida, soma diferente de zero, referência cruzada entre usuários, duplicação do trânsito e correção da transferência. Toda falha deve preservar integralmente o estado anterior.

**R1-3 — Guardas apenas nas entradas e saídas não garantem somas monetárias exatas.**

- **Local:** D11, item B, G1 e risco de ponto flutuante.
- **Evidência e efeito:** a promessa de exatidão se apoia em `Number.isSafeInteger` nas entradas e saídas, sem cobrir intermediários ou impor um domínio compatível no `bigint` do banco. Reprodução em Node.js 24: `(9.007.199.254.740.991 + 2) - 2` resulta em `9.007.199.254.740.990`, embora todas as entradas e a saída sejam inteiros seguros; o resultado exato seria `9.007.199.254.740.991`. A magnitude intermediária ultrapassa o limite e perde um centavo. A [especificação ECMAScript](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-number.issafeinteger) define a guarda sobre o valor observado, sem certificar a aritmética que o produziu.
- **Correção necessária:** definir a faixa monetária aceita no banco, RPCs e TypeScript, a conversão na fronteira e a política de overflow para valores, somas, diferenças e consolidados. Exigir aritmética exata ou recusa antes de qualquer perda intermediária, mantendo P3 restrito às razões. Não é necessário introduzir biblioteca decimal para satisfazer esse requisito.
- **Evidência para resolver:** casos perto dos limites, soma com cancelamento, diferença entre saldos de sinais opostos, consolidação e valor inserido pela Data API fora da faixa aceita. As camadas devem produzir o mesmo valor exato ou a mesma recusa, sem armazenar um fechamento ilegível pelo TypeScript.

**R1-4 — A promessa de sincronização sem gravação parcial não tem fronteira de transação definida.**

- **Local:** D10, item D e testes do SGS.
- **Evidência e efeito:** o período é fatiado em janelas e o módulo recebe o cliente do Supabase, mas o plano não diz como todos os upserts participam de uma única transação. Se a primeira gravação terminar e uma seguinte falhar, a série fica parcialmente atualizada, mesmo que todos os fetches tenham sido concluídos antes. Pela [documentação do PostgREST](https://docs.postgrest.org/en/stable/references/transactions.html), cada requisição tem sua própria transação; várias chamadas do cliente não formam uma transação comum.
- **Correção necessária:** definir a unidade atômica prometida e o caminho de persistência que a garante, com validação das respostas antes da publicação. Se for necessária uma função de banco, incluí-la na entrega D, nos arquivos afetados e nos testes de privilégios. Manter a escrita sob a identidade autorizada do administrador. Se a intenção for admitir progresso parcial, isso precisa ser proposto explicitamente, pois altera o critério atual.
- **Evidência para resolver:** testes de falha em janela posterior de fetch, payload inválido e falha em gravação posterior. Catálogo e valores devem permanecer no estado anterior à unidade prometida; uma repetição bem-sucedida deve ser idempotente.

**R1-5 — K4 confunde publicação de um mês posterior com cobertura integral do mês comparado.**

- **Local:** K4, D8, composição mensal e critérios da entrega D.
- **Evidência e efeito:** ter uma observação no mês seguinte não prova que o banco contém o começo e o interior do mês anterior. Uma sincronização pedida a partir de meados de janeiro, com algum valor de fevereiro, satisfaria a recomendação K4(a) e compararia janeiro incompleto. Com a taxa fictícia de 0,04% do plano, 10 observações dão 0,4007%, enquanto 21 dão 0,8434%. A mesma inferência falha se a carga local estiver incompleta. K4 ainda é proposta; a lacuna deve ser apresentada antes de o responsável escolher.
- **Correção necessária:** separar encerramento/publicação da fonte de cobertura da importação. Especificar como consultas limitadas e meses de borda são tratados, como se comprova a carga do período integral e qual é a decisão sobre lacunas e dados indisponíveis. Incorporar as alternativas e exemplos à decisão K4 na entrega A, sem o implementador escolher uma regra financeira.
- **Evidência para resolver:** casos de carga começando no meio do mês, mês anterior ausente apesar de existir mês seguinte, carga interrompida e lacuna conhecida. Nenhum período sabidamente incompleto deve produzir retorno comparável ou ser convertido em zero.

**R1-6 — As novas RPCs contradizem a lista de funções permitidas do teste atual.**

- **Local:** item B, arquivos afetados e gate `supabase test db`; `supabase/tests/database/03_funcoes.test.sql`, terceira asserção.
- **Evidência e efeito:** o teste existente reprova qualquer função de `public`/`private` executável por `authenticated` cujo nome não seja `is_admin`. `fechar_mes` e `reabrir_mes` precisam ser executáveis pelo usuário para cumprir o plano, portanto o gate reprovará mesmo que a RLS esteja correta. B só prevê testes novos, e não a adaptação desse contrato existente.
- **Correção necessária:** incluir a atualização cirúrgica de `03_funcoes.test.sql` na entrega B e, se necessário por R1-4, na D. Declarar as assinaturas/papéis autorizados, mantendo `PUBLIC` e `anon` sem execução nas funções de carteira e restringindo helpers internos. Não remover nem generalizar a asserção a ponto de permitir funções imprevistas.
- **Evidência para resolver:** o teste existente adaptado e os novos testes passam juntos; cada RPC tem as concessões esperadas, helpers não ficam acessíveis e uma função não autorizada continua sendo detectada.

**R1-7 — A data de início da carteira deixa lançamentos anteriores sem destino definido.**

- **Local:** P8, D5, item B (recusa somente em mês fechado) e regra de saldo inicial.
- **Evidência e efeito:** o primeiro fechamento define o início, e os seguintes são estritamente sequenciais. Após o primeiro fechamento de março, fevereiro não é um mês fechado e a recusa descrita para INSERT não o alcança. Um aporte fictício de 10.000 centavos datado de fevereiro poderia ser aceito, mas fevereiro não poderia ser fechado pela sequência definida. Se o saldo de março o incorporar, altera-se uma base já materializada; se não o incorporar, o lançamento fica sem efeito na posição. O plano não define esse tratamento nem o que fazer com eventos anteriores já presentes no primeiro fechamento.
- **Correção necessária:** especificar na entrega A as regras de início e de lançamentos anteriores, apresentando ao responsável as alternativas que mudarem saldo inicial ou rentabilidade. A entrega B deve aplicar a regra no banco e na prévia. Definir o destino de eventos anteriores ao mês escolhido para o primeiro fechamento e dos inseridos depois dele.
- **Evidência para resolver:** casos de evento anterior ao primeiro mês fechado, tanto existente antes do fechamento quanto enviado depois, e de reabertura do primeiro mês. Nenhum evento aceito pode mudar silenciosamente uma base fechada ou ficar sem tratamento contábil definido.

#### Ressalvas

**R1-8 — O rollback antes da ação externa precisa preservar migrações versionadas.**

- **Local:** riscos, suposições e rollback.
- **Evidência e tratamento:** "por PR de reversão" pode significar reverter integralmente a PR B/D e remover suas migrações, o que G4 e `.github/workflows/governance.yml` proíbem mesmo antes do `db push`. Esclarecer que a reversão preserva o histórico SQL e usa migração nova para correção do schema. Os testes locais/CI já podem ter aplicado as migrações. Não é preciso mudar G4.

**R1-9 — O destino dos benchmarks de valor absoluto está implícito.**

- **Local:** ideação, evidências de benchmarks; escopo e entrega D.
- **Evidência e tratamento:** a ideação registra o benchmark de valor absoluto, com retorno pela razão entre meses. D8 distingue periodicidade, mas a entrega D só explicita composição diária e retorno de série mensal, sem distinguir taxa percentual de nível de índice. CDI/IPCA iniciais não exercitam o segundo caso. Explicitar na KB-004 e no escopo se essa paridade será implementada ou adiada; se incluída, prever metadado da unidade e um caso fictício de níveis 100 → 102, cujo retorno é 2%, não 102%. Uma ampliação além das decisões registradas continua dependendo do responsável.

#### Itens atendidos e verificações

- O nível completo, a ausência de modo contínuo e as barreiras G1/G2 são compatíveis com o trabalho; os pontos de aprovação distinguem revisão, aprovação humana, implementação, merges, ação externa e produção.
- A sequência A → B → C → D põe especificação e casos antes do schema e das regras. D1 a D12 e escolhas K são apresentadas como propostas, sem aprovação fictícia; a revisão ocorre por ferramenta diferente da autora, atendendo P18.
- A representação em centavos, o tratamento explícito de `N/D`, a reabertura com invalidação e a separação entre retorno e variação do patrimônio têm destino documentado. Os exemplos P11/P12/P16 e K2/K4/K5 são aritmeticamente compatíveis com as fórmulas apresentadas; isso não aprova suas alternativas.
- Baseline conferido: duas migrações; três arquivos pgTAP com 36 + 20 + 12 = 68 asserções; Vitest restrito a `src/**/*.test.ts`; sem biblioteca decimal/de datas; CI de aplicação e de banco; `package.json` em `0.1.0`; próximas KB/ADR como declaradas. A ausência de tabelas de carteira é compatível com a KB-003.
- Em 2026-10-14, chamadas públicas somente leitura ao SGS confirmaram HTTP 200/formato textual para CDI 12 e IPCA 433, data no primeiro dia para a série mensal e HTTP 406 para uma janela diária de 12 anos. A página de documentação do BCB citada no plano devolveu "Requisição Inválida!" ao navegador de pesquisa; a evidência desta rodada é a resposta da API, sem inferir disponibilidade contínua. Nenhum teste automatizado passa a depender da rede.
- Não foram encontrados dados do usuário nos artefatos locais revisados. As decisões e os casos da origem não foram copiados para fixtures. Não houve leitura de carteira de produção.
- Validações desta revisão: `node --test scripts/validate-governance.test.mjs` passou com 39 testes; `node scripts/validate-governance.mjs` sem erros/avisos e `git diff --check` limpo antes e depois do registro. A conferência por SHA-256 confirmou o trecho de escopo intacto e a reconstrução integral da origem ao desfazer somente os campos de status/veredito, o bloco de próximo passo e esta seção de revisão. O estado preexistente de `cycles.md` e da ideação foi preservado. Nenhuma validação desta revisão executou a aplicação ou alterou o banco.

**Veredito: `REQUER NOVA RODADA`.** Sete bloqueadores (R1-1 a R1-7) e duas ressalvas (R1-8 e R1-9). O plano `v1` permanece `Em Revisão`, ciclo `Planejamento`, com aprovação humana pós-revisão `Pendente`. O autor deve responder a cada achado como corrigido ou contestado, preservar esta rodada e incrementar a versão ao corrigir. Nenhuma decisão D/K foi tomada pelo revisor e nenhum item de implementação foi iniciado.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 003 + revisar_plano + 003_plan/rodada-1 + v1`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `Planejamento`; plano local `v1` em `Rascunho`; revisão/veredito/aprovação pendentes; próximo passo `Aguardando revisão (rodada 1)`.
- `state_after`: ciclo `Planejamento`; plano `v1` em `Em Revisão`; rodada 1 registrada; revisão `Em andamento`; veredito `REQUER NOVA RODADA`; aprovação `Pendente`; próximo passo `Aguardando correções (rodada 1)`.
- `result`: `executed`
- `evidence`: solicitação humana de 2026-10-14; esta rodada e os campos de status/veredito; hashes da origem e do trecho preservado; arquivos/testes/fontes citados nos achados; consultas somente leitura ao GitHub e SGS; gates documentais descritos acima. O handoff de `rascunhar_plano` é preservado como registro da criação, e o estado corrente desta revisão é o declarado aqui.
- `blockers`: R1-1 a R1-7. Nenhum bloqueio de capacidade para concluir e registrar o parecer.

### Resposta do autor à rodada 1

- **Autor:** Claude (Claude Code, Opus 5.5), em 2026-10-14, a pedido do responsável ("corrija o plano do ciclo 003").
- **Versão produzida:** `v2`. Nenhum achado foi contestado. Nenhuma decisão P foi alterada, e as escolhas de cálculo novas ou reescritas (K4, K6 e K7) continuam propostas, para o responsável decidir na entrega A.

| Achado | Resposta | Onde |
| :-- | :-- | :-- |
| R1-1 | **Corrigido.** Nova proposta D13: o usuário só tem `select` na carteira, e toda escrita (ativos, lançamentos, estornos, transferências, fechamento e reabertura) passa por funções que tomam a mesma trava transacional por usuário antes de ler o estado; depois da trava, cada comando enxerga o que já foi gravado. Duas chamadas disputando o mesmo mês terminam com uma recusa explícita, sem gravação parcial. Testes de concorrência com duas sessões (`dblink`), sem esperas por tempo, para lançamento, criação de ativo, fechamento e reabertura | D13; item B; "Estratégia de testes" (Concorrência); "Dependências e blockers" |
| R1-2 | **Corrigido.** A transferência é criada numa só chamada, com as duas pernas do mesmo usuário, na mesma data, de valores opostos e exatamente duas por transferência; o estorno direto de uma perna é recusado. Chaves estrangeiras compostas com `user_id` impedem referências a ativo ou evento de outro usuário, em todos os tipos. O trânsito é único por usuário e só as funções o criam. A regra de correção virou a escolha K6, com o exemplo de 10.000 centavos | D13; K6; item B; testes de banco |
| R1-3 | **Corrigido.** D11 revisada: dentro das regras, centavos são `bigint` nativo, exato em qualquer intermediário, como no banco; a conversão de e para `number` só ocorre na fronteira, com `Number.isSafeInteger`; toda coluna monetária tem a faixa ±(2⁵³ − 1). A única recusa possível é um valor gravado ou devolvido fora da faixa, igual nas duas camadas. Sem biblioteca nova. O exemplo da rodada entrou como caso de teste | D11; item B; "Estratégia de testes" (Faixa do dinheiro) |
| R1-4 | **Corrigido.** D10 revisada: o módulo busca e valida todas as janelas e grava valores e cobertura numa única chamada a uma função `security invoker`, sujeita à RLS de admin, o que dá uma transação só. A unidade atômica é uma sincronização de um benchmark para o período pedido. Progresso parcial ficou como opção (c), não recomendada | D10; item D; testes do SGS |
| R1-5 | **Corrigido.** K4 reescrita: cada benchmark guarda a cobertura contínua da carga, e uma sincronização que deixaria buraco é recusada. A recomendação passa a exigir que a cobertura comece no dia 1 do mês ou antes e inclua um valor posterior ao mês. A regra da `v1` ficou como opção (c), com o contraexemplo da carga iniciada em 15/jan (0,4007% contra 0,8434%). O limite (lacuna da própria fonte não detectável sem calendário) está declarado. A escolha continua com o responsável | K4; item D; testes do SGS |
| R1-6 | **Corrigido.** O item B inclui a atualização cirúrgica de `03_funcoes.test.sql`: a asserção passa a listar as assinaturas autorizadas a `authenticated`, sem generalizar; uma função não listada continua reprovando. A função de gravação do SGS (R1-4) entra na mesma lista na issue D | Item B; item D; "Arquivos afetados" |
| R1-7 | **Corrigido.** Nova escolha K7 (início da carteira e eventos anteriores ao primeiro fechamento), com duas opções e o exemplo de 10.000 centavos em fevereiro. Nas duas, depois do primeiro fechamento, todo lançamento com data anterior ao primeiro mês aberto é recusado pela função de lançamento, e reabrir o primeiro mês volta ao estado sem mês fechado | K7; item A; item B |
| R1-8 | **Corrigido.** O rollback deixa claro que nenhuma migração versionada é removida ou editada, nem antes da ação externa; o código é revertido preservando o SQL, e o schema é corrigido por migração nova | "Riscos, suposições e rollback" |
| R1-9 | **Corrigido.** Nova proposta D14: o benchmark de valor absoluto fica especificado na KB-004 (de 100 para 102, retorno de 2%) e marcado como não implementado, porque não há fonte para esse tipo de série neste ciclo. Incluí-lo continua sendo decisão do responsável, como opção (b) | D14; "Fora do escopo"; item A |

Interações conferidas entre as correções: D13 também resolve a imutabilidade dos eventos (H4) sem política de `update` ou `delete`; a função de gravação do SGS (R1-4) é `security invoker` e fica fora da trava da carteira, porque não toca dado do usuário; K6 e K7 dependem de D13 para serem aplicadas no banco.

### Rodada 2

- **Autor:** Thiago Andrade e Claude (Claude Code, Opus 5.5), conforme autoria do plano e resposta à rodada 1.
- **Revisor:** Codex desktop, GPT-6.
- **Data e autorização:** 2026-10-14; solicitação humana "revise o plano do ciclo 003". Autoriza a revisão formal da `v2` e o registro deste parecer.
- **Base:** `main` @ `0b6765c05675badf949af5c999c603bf344eb7ab`; plano local `v2` em `Em Revisão`, ciclo `003` em `Planejamento`, aprovação `Pendente`, próximo passo `Aguardando revisão (rodada 2)`. Consulta somente leitura ao GitHub: nenhuma issue aberta e nenhuma PR aberta no repositório. Não há implementação do ciclo no checkout.
- **Identidade da origem (UTF-8/LF):** plano completo antes desta rodada, SHA-256 `52b26690523d9dd6bc184d09552972997ddec0009d4d3e1b5aaf64ac5bf37ccd`; trecho de `## Problema e contexto` até imediatamente antes de `## Próximo passo`, `069a979da16dabbe2aa51816fbc418555e4d97c2b20051533a1207e2b24867a4`; histórico de `### Rodada 1` até imediatamente antes do pós-mortem, incluindo a resposta do autor, `11f150e7f9bc635892e144479d243cb6811d9acc93e6290fe0db8f0c4c0e2b9a`.
- **Template e autoridades:** `.agent/templates/plano_implementacao.md`, `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, `.agent/workflows/revisar_plano.md`, KB-003, decisões ADR-002/ADR-003 e autoridades/referências já consumidas na rodada 1. Foram conferidos também `supabase/config.toml`, migrações, `03_funcoes.test.sql`, fixtures dos testes de isolamento, `package.json`, `tsconfig.json` e documentação oficial do PostgreSQL 17, versão definida no ambiente local.
- **Limite:** este parecer avalia o desenho e sua verificabilidade. Não certifica código ainda inexistente, não substitui o recálculo independente da entrega A e não decide D1 a D14 ou K1 a K7.

#### Conferência das respostas à rodada 1

| Achado | Resultado desta conferência |
| :-- | :-- |
| R1-1 | **Atendido no desenho.** D13 elimina escrita direta na carteira, exige a mesma trava transacional em todas as RPCs e leitura posterior à trava. A hipótese de snapshots novos em comandos de funções voláteis é compatível com PostgreSQL sob o isolamento padrão `READ COMMITTED` do PostgREST. A prova com duas sessões permanece critério da entrega B. |
| R1-2 | **Atendido no desenho.** B exige operação atômica, duas pernas opostas, mesma data/usuário, integridade referencial composta e unicidade do trânsito. K6 leva a regra de correção ao responsável, sem o autor decidir sozinho. |
| R1-3 | **Parcialmente atendido.** `bigint` no TypeScript resolve a perda de centavos por intermediários de `number`, e a faixa de persistência/fronteira foi definida. A equivalência alegada com os intermediários do banco ainda exige R2-1. |
| R1-4 | **Atendido no desenho.** D10 e D exigem busca/validação prévias e uma só RPC para gravar valores e cobertura, com falha integral. Uma única requisição PostgREST fornece a fronteira transacional que faltava. |
| R1-5 | **Atendido quanto à carga parcial identificada na rodada 1.** K4 agora exige cobertura desde o início do mês e observação posterior, recusa intervalos separados e declara a limitação quanto a lacunas da própria fonte. A preservação dessa cobertura por outros caminhos de escrita é a interação nova de R2-2. |
| R1-6 | **Atendido no desenho.** B/D incluem a atualização de `03_funcoes.test.sql`, com assinaturas explícitas e sem liberar auxiliares nem funções não previstas. |
| R1-7 | **Atendido no desenho.** K7 explicita as alternativas para eventos anteriores, e B exige a regra de data no banco. A escolha continua pendente para a entrega A. |
| R1-8 | **Atendido.** O rollback preserva SQL versionado e corrige o schema por migração nova. |
| R1-9 | **Atendido como proposta explícita.** D14 e o não-escopo declaram o adiamento, preservando a especificação da regra. Isso ainda depende da escolha do responsável ao aprovar o plano. |

Referências conferidas para as correções: [volatilidade e snapshots no PostgreSQL 17](https://www.postgresql.org/docs/17/xfunc-volatility.html) e [transações e isolamento do PostgREST](https://docs.postgrest.org/en/stable/references/transactions.html). Não houve contestação do autor nem oscilação de decisão.

#### Achados bloqueadores

**R2-1 — O `bigint` do banco não tem a mesma faixa intermediária do `bigint` do JavaScript.**

- **Local:** D11; G1; estratégia de testes "Faixa do dinheiro"; B, módulos e critérios de equivalência entre as camadas.
- **Evidência e efeito:** D11 descreve os intermediários como exatos em qualquer soma, "como o `bigint` do banco", e admite recusa apenas ao gravar/devolver um valor fora de ±(2⁵³ − 1). No PostgreSQL 17, `bigint` é um inteiro de 64 bits, limitado a 9.223.372.036.854.775.807 no lado positivo; no JavaScript, `bigint` não tem esse limite fixo. Com 1.025 parcelas de 9.007.199.254.740.991 centavos e depois as 1.025 parcelas opostas, cada entrada é válida e o resultado final é zero, mas o subtotal positivo é 9.232.379.236.109.515.775. Um acumulador ou cast intermediário SQL em `bigint` estoura onde o TypeScript calcula exatamente. É uma limitação ainda não resolvida de R1-3, não a repetição da antiga perda de precisão em `number`. A [documentação de tipos numéricos](https://www.postgresql.org/docs/17/datatype-numeric.html) confirma o limite; [`sum(bigint)` retorna `numeric`](https://www.postgresql.org/docs/17/functions-aggregate.html), permitindo resolver a diferença sem mudar as colunas monetárias.
- **Correção necessária:** distinguir armazenamento de acumulação no banco. Declarar a aritmética exata dos intermediários SQL, preservando resultados de agregados em tipo que não imponha o limite de 64 bits antes do cancelamento, e só converter após conferir a faixa do resultado gravado/devolvido. Alternativamente, propor um domínio operacional adicional que dê a mesma recusa nas duas camadas, mas não presumir esse limite enquanto D11 promete o domínio atual.
- **Evidência para resolver:** caso de referência com cancelamento cujo subtotal ultrapasse 64 bits, executado nas duas camadas, inclusive na apuração de rendimento/ajuste. Também um caso cujo resultado final exceda a faixa de persistência. O primeiro deve produzir o mesmo resultado exato; o segundo, a mesma recusa sem gravação parcial, conforme a decisão adotada.

**R2-2 — A cobertura do benchmark pode continuar certificada após uma alteração fora da sincronização.**

- **Local:** D10, K4, entrega D (catálogo, valores e cobertura graváveis pelo admin; RPC `security invoker`) e testes de completude.
- **Evidência e efeito:** a v2 liga a cobertura à transação de sincronização, mas mantém escrita administrativa nas tabelas e não define a invalidade da certificação depois de alteração direta. Uma função `security invoker` precisa dos privilégios de escrita do chamador; a [documentação do PostgreSQL](https://www.postgresql.org/docs/17/sql-createfunction.html) confirma esse comportamento. Nas tabelas expostas pela Data API, permitir o admin gravar também abre um caminho que pode alterar valores/cobertura sem passar pelas validações da RPC. Por exemplo: uma carga parcial inserida junto de cobertura do mês inteiro, ou, se DELETE for concedido, a exclusão de uma observação de um mês previamente completo mantendo os limites da cobertura. K4 interpretaria a ausência como dia sem taxa da fonte. Com a taxa fictícia de 0,04%, 20 observações dariam 0,8030%, enquanto as 21 certificadas originalmente dariam 0,8434%, e o período continuaria comparável. A autorização do admin para manter benchmarks não dispensa a coerência entre dados e certificação.
- **Correção necessária:** definir e proteger no banco o contrato de cobertura para todos os caminhos de escrita autorizados. Enumerar as permissões administrativas efetivas; restringir caminhos que contornem a certificação ou invalidar/recalcular a cobertura quando valores ou metadados relevantes forem alterados fora de uma carga integral validada. Considerar também mudanças do código SGS/periodicidade, para não reutilizar a cobertura de uma série diferente. Não basta depender de a interface futura sempre chamar a RPC.
- **Evidência para resolver:** testes com o papel administrativo da API para inserir/alterar valores e cobertura diretamente e para excluir observação, quando permitido. Após cada operação, a alteração deve ser recusada ou a comparação permanecer indisponível até nova certificação consistente. Testar também a sincronização normal, provando que a invalidação não deixa uma carga integral bem-sucedida sem cobertura.

#### Ressalva

**R2-3 — Incluir um caso de Dietz com cancelamento no denominador ponderado.**

- **Local:** P3/P11, D11, estratégia de testes e entrega C.
- **Evidência e tratamento:** a soma de centavos exata resolve o numerador, mas não testa a precisão de pesos fracionários antes da divisão final. Exemplo fictício de mês com 30 dias: Vi = 999.979 centavos; fluxo de −1.034.461 no dia 1; fluxo de +34.482 no dia 30; Vf = 1 centavo. O ganho é 1 centavo e o denominador exato é 1/30 de centavo, logo R = 30. Uma avaliação direta em `number` produz aproximadamente 30,00000000698492, com erro de 6,98 × 10⁻⁹, acima da tolerância de 10⁻⁹ do plano. Isso foi reproduzido em Node.js 24, não em código da aplicação. Acrescentar à entrega A/C um caso desse tipo e explicitar o domínio de fluxos/saldos aceitos. Se o domínio excluir o exemplo, a KB deve registrar a restrição; caso contrário, preservar o cancelamento exato até a divisão (por exemplo, pela forma equivalente `D·Vi + Σ F·(D−d)` em inteiros). P3 e a convenção de fim do dia de P11 podem ser mantidas. A ressalva não presume que o código ainda inexistente fará a avaliação ingênua.

#### Itens atendidos, limites e validações

- O desenho teve progresso material: transferências, datas anteriores, permissões de funções e rollback ganharam contratos verificáveis; o protocolo da carteira e a unidade atômica de sincronização ficaram explícitos. Permanecem dois bloqueadores, contra sete na rodada 1. Não há discordância persistente ou retorno à solução antiga que exija a situação `Parado` nesta rodada.
- O nível completo, G1 a G4, modo contínuo `—`, quatro entregas sequenciais e aprovação humana `Pendente` continuam coerentes. As propostas D13/D14 e K6/K7 estão rastreadas, sem falsa manifestação humana. As escolhas K seguem como condição do merge A.
- A viabilidade dos testes com `dblink` está explicitamente pendente para o início de B. A documentação oficial confirma a capacidade de conexão/query entre sessões; a instalação, as permissões, a visibilidade de fixtures confirmadas pelas conexões e sua limpeza em caso de erro ainda precisam ser demonstradas no Supabase local/CI, como precondição já prevista. Esta revisão não certifica essa execução.
- `tsconfig.json` usa alvo ES2022, compatível com `bigint` nativo. `supabase/config.toml` fixa PostgreSQL 17. A adaptação da lista de RPCs foi incluída nos arquivos afetados de B/D. A KB-004 e os casos continuam por criar na entrega A.
- Inspeção dos artefatos desta rodada sem dados do usuário; nenhum acesso à carteira de produção, nenhuma alteração em banco, pacote, migração, issue ou PR.
- Gates executados nesta rodada: `node --test scripts/validate-governance.test.mjs` passou com 39 testes; `node scripts/validate-governance.mjs` retornou zero erros e zero avisos antes e depois do registro; `git diff --check` passou. A conferência por SHA-256 confirmou escopo e histórico intactos e reconstruiu integralmente a origem ao desfazer apenas a nova rodada e o bloco de próximo passo. `cycles.md` e a ideação permaneceram com seu estado preexistente. Não foram executados os gates de aplicação/banco, pois não há implementação nesta revisão.

**Veredito: `REQUER NOVA RODADA`.** Dois bloqueadores (R2-1 e R2-2) e uma ressalva (R2-3). O plano `v2` permanece `Em Revisão`, revisão `Em andamento`, ciclo `Planejamento`, aprovação humana pós-revisão `Pendente`. O autor deve responder aos três achados, preservar o histórico e incrementar a versão ao corrigir. A correção do plano continua sendo uma etapa posterior a autorizar, sem encadeamento automático.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 003 + revisar_plano + 003_plan/rodada-2 + v2`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `Planejamento`; plano local `v2` em `Em Revisão`; resposta à rodada 1 presente; revisão `Em andamento`; veredito anterior `REQUER NOVA RODADA`; aprovação `Pendente`; próximo passo `Aguardando revisão (rodada 2)`.
- `state_after`: ciclo `Planejamento`; plano `v2` em `Em Revisão`; rodada 2 registrada com `REQUER NOVA RODADA`; revisão `Em andamento`; aprovação `Pendente`; próximo passo `Aguardando correções (rodada 2)`.
- `result`: `executed`
- `evidence`: solicitação humana de 2026-10-14; esta rodada; hashes da origem, do escopo e do histórico; autoridades, documentação oficial e arquivos citados; consultas somente leitura ao GitHub; reproduções aritméticas com dados fictícios em Node.js 24; gates documentais. O handoff de correção para `v2` e a rodada 1 permanecem como histórico.
- `blockers`: R2-1 e R2-2. Nenhum bloqueio de capacidade para registrar e entregar o parecer.

### Resposta do autor à rodada 2

- **Autor:** Claude (Claude Code, Opus 5.5), em 2026-10-14, a pedido do responsável ("corrija o plano do ciclo 003").
- **Versão produzida:** `v3`. Nenhum achado foi contestado. Nenhuma decisão P foi alterada, nenhuma escolha K foi tomada, e nenhuma nova escolha de cálculo surgiu: as correções mudam como as regras são executadas, não o que elas calculam.

| Achado | Resposta | Onde |
| :-- | :-- | :-- |
| R2-1 | **Corrigido.** D11 separa armazenamento de acumulação: a coluna gravada continua `bigint` com a faixa ±(2⁵³ − 1), mas toda acumulação nas funções do banco é feita em `numeric`, sem o limite de 64 bits, e só o resultado gravado é convertido, depois de conferir a faixa. As duas camadas ficam com o mesmo domínio: intermediários sem limite e recusa só no resultado fora da faixa. O caso de 1.025 parcelas e 1.025 opostas e o caso de resultado acima da faixa entraram na estratégia de testes, inclusive na apuração do ajuste | D11; G1; "Estratégia de testes" (Faixa do dinheiro) |
| R2-2 | **Corrigido.** Seguindo o padrão de D13, nem o admin escreve diretamente nas tabelas de benchmark: o único caminho é a função de carga, agora `security definer`, que exige o admin, trava o benchmark, substitui os valores da janela carregada e grava a cobertura na mesma transação. Sem `delete` ou `update` direto, uma observação não some de um mês já certificado. Código SGS e periodicidade ficam imutáveis (gatilho), então uma cobertura nunca é reaproveitada por outra série. Testes com o papel de admin pela API provam a recusa das escritas diretas e que a carga integral bem-sucedida certifica a cobertura | D8; D10; G2; item D; testes de banco |
| R2-3 | **Corrigido.** O item C calcula o Dietz na forma inteira equivalente, D·(Vf − Vi − ΣF) / (D·Vi + Σ F·(D − d)), com numerador e denominador em `bigint` e uma divisão só; P3 e a convenção de fim do dia de P11 ficam como estão. Nenhuma restrição de domínio foi criada. O exemplo da rodada entrou como critério de aceite (R = 30). A tolerância passou a ser 10⁻⁹ × max(1, módulo do esperado), porque um erro absoluto fixo não serve para retornos muito grandes: a conversão final de `bigint` para `number` tem erro relativo da ordem de 10⁻¹⁶ | Item C; "Estratégia de testes" |

Interações conferidas: a função de carga passou de `security invoker` (`v2`) para `security definer`, então ela segue as regras de G2 para funções desse tipo (`search_path` vazio, verificação explícita do admin e presença na lista do teste de funções); a trava por benchmark é independente da trava por usuário da carteira (D13), porque nenhuma função toma as duas; a tolerância mista de R2-3 vale para todas as razões e não afrouxa nenhum caso com valor esperado até 1.

### Rodada 3

- **Autor:** Thiago Andrade e Claude (Claude Code, Opus 5.5), conforme autoria do plano e resposta à rodada 2.
- **Revisor:** Codex desktop, GPT-6.
- **Data e autorização:** 2026-10-14; solicitação humana "revise o plano do ciclo 003". Autoriza esta revisão formal da `v3` e o registro do parecer; não constitui aprovação humana do plano.
- **Base:** `main` @ `0b6765c05675badf949af5c999c603bf344eb7ab`; plano local `v3` em `Em Revisão`, ciclo `003` em `Planejamento`, aprovação `Pendente`; rodada 2 e resposta do autor presentes; próximo passo `Aguardando revisão (rodada 3)`. Consulta somente leitura ao GitHub: nenhuma issue aberta e nenhuma PR aberta no repositório. Não há implementação do ciclo no checkout.
- **Identidade da origem (UTF-8/LF):** plano completo antes da rodada, SHA-256 `37cce71b1c7c1fc7f259d0ff08cf153f1d74f7451c3d5225e31fdae18f03bb4e`; trecho de `## Problema e contexto` até imediatamente antes de `## Próximo passo`, `030b23c2227a4dea46ef2cc401603b4ae76ae56075e4d1a9d959b443a3ccce98`; histórico desde `### Rodada 1` até imediatamente antes do pós-mortem, incluindo as duas rodadas e as respostas do autor, `a6ae664e57c1da465b1db7a1b55d7b158c4f405f79cac04f544b9a72f4f818b3`.
- **Template e autoridades consumidos:** `.agent/templates/plano_implementacao.md`, `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, `.agent/workflows/revisar_plano.md`, KB-003 e as autoridades/referências das rodadas anteriores. Foram reconferidos a migração de acesso (`private.is_admin()` e privilégios), `03_funcoes.test.sql`, versão do PostgreSQL local e alvo TypeScript, além da documentação oficial indicada abaixo.

#### Conferência dos achados anteriores

| Achado | Resultado da rodada 3 |
| :-- | :-- |
| R2-1 | **Atendido no desenho.** D11 distingue coluna `bigint` de variáveis, expressões e agregações em `numeric`; o cast ocorre depois da conferência da faixa de persistência. A estratégia inclui o subtotal acima de 64 bits com cancelamento e a recusa do resultado final fora da faixa, com execução nas duas camadas. Isso fecha a limitação remanescente de R1-3 sem mudar a representação em centavos. |
| R2-2 | **Atendido no desenho.** D10 e D retiram DML direto das tabelas de benchmarks, inclusive do admin; a função de carga é `security definer`, verifica `private.is_admin()`, toma a trava do benchmark e substitui valores/recalcula cobertura numa única transação. D8 e o gatilho impedem trocar código SGS/periodicidade reaproveitando a cobertura. Há testes explícitos dos privilégios, da recusa para usuário comum e da certificação após carga integral. |
| R2-3 | **Atendido.** C usa a forma inteira equivalente do Dietz, preserva numerador e denominador em `bigint` até a divisão e inclui o caso de cancelamento. Reprodução em Node.js 24: numerador 30, denominador 1, retorno 30. A v3 apresenta expressamente a tolerância mista para razões; centavos continuam sendo comparados por igualdade exata. |

Os demais achados da rodada 1 continuam atendidos no desenho, conforme a conferência da rodada 2: protocolo comum de escrita da carteira, transferências atômicas e integridade das referências, datas anteriores ao início, atualização da lista de RPCs, rollback aditivo e destino explícito dos benchmarks de nível. Não houve contestação persistente, oscilação ou reaparecimento do defeito corrigido.

#### Interações e itens atendidos

- **Acumulação e persistência:** a solução é compatível com [os tipos numéricos do PostgreSQL 17](https://www.postgresql.org/docs/17/datatype-numeric.html) e com [`sum(bigint)` retornando `numeric`](https://www.postgresql.org/docs/17/functions-aggregate.html). Armazenamento e valores expostos mantêm a faixa declarada; o cálculo intermediário já não depende de um acumulador SQL de 64 bits. Os casos de referência e a prova de equivalência estão atribuídos a A/B.
- **Permissões e cobertura:** a mudança de `security invoker` para `security definer` é acompanhada de autorização administrativa explícita, `search_path` vazio, teste de funções e retirada da escrita direta. O uso de privilégios do dono é compatível com a [documentação de funções do PostgreSQL](https://www.postgresql.org/docs/17/sql-createfunction.html); neste desenho, a função atua somente no catálogo global, sem conceder acesso à carteira alheia. As travas de benchmark e de carteira permanecem separadas.
- **Dietz e precisão:** para D positivo, multiplicar numerador e denominador por D preserva a fórmula de P11 e o sinal do denominador usado para `N/D`. Além do caso de cancelamento (30/1), a reprodução do exemplo de P11 pela forma inteira deu 300.000 / 31.500.000 = 0,009523809523809525, isto é, aproximadamente 0,9524%. A tolerância `10⁻⁹ × max(1, |esperado|)` é uma alteração explícita da estratégia da v3 a conferir na aprovação; não é uma regra de arredondamento de dinheiro nem autoriza arredondar intermediários. A exigência de cálculo inteiro permanece, independentemente da tolerância final.
- **Escopo e sequência:** continuam quatro entregas A → B → C → D, sem telas ou migração de dados; a especificação e a validação independente precedem implementação de schema/regras. Pontos de aprovação, ação externa, verificação em produção, release e encerramento permanecem separados. D1 a D14 são propostas, e K1 a K7 continuam reservadas à decisão do responsável na entrega A.
- **Barreiras:** G1 possui referência e critérios por camada; G2 exige RLS, integridade de referências e testes dos caminhos privilegiados; G3 usa dados fictícios/índices públicos; G4 preserva migrações e rollback aditivo. Não foi encontrada divergência nova com as autoridades locais.

#### Achados novos e limites do parecer

**Nenhum novo achado bloqueador ou ressalva.** Os dois bloqueadores e a ressalva da rodada 2 foram tratados no plano. A trajetória foi de sete bloqueadores na rodada 1 para dois na rodada 2 e zero nesta rodada.

O veredito avalia o plano; a KB-004, as decisões K, os casos e sua conferência independente são entregáveis futuros. A viabilidade de `dblink` no Supabase local/CI continua como precondição explícita do início de B, com parada se não puder ser demonstrada. A limitação de K4 quanto a lacunas da própria fonte está exposta ao responsável entre as alternativas. Esses pontos já têm tratamento no plano e não são declarados executados por esta revisão.

#### Validações e preservação

- `node --test scripts/validate-governance.test.mjs`: 39 testes passaram.
- `node scripts/validate-governance.mjs`: zero erros e zero avisos antes e depois do registro.
- `git diff --check`: passou antes e depois do registro.
- Reproduções aritméticas somente leitura em Node.js 24, com entradas fictícias; nenhuma biblioteca, aplicação ou banco foi alterado. Não foram executados gates de aplicação/banco nem acesso à carteira de produção.
- A rodada 1 e a resposta correspondente mantêm o hash `11f150e7f9bc635892e144479d243cb6811d9acc93e6290fe0db8f0c4c0e2b9a`, já conferido na rodada 2. A conferência por SHA-256 após este registro confirmou escopo e histórico completo intactos e reconstruiu integralmente a origem ao desfazer somente os campos de revisão/veredito, a nova rodada e o bloco de próximo passo.
- `cycles.md` e a ideação mantêm as alterações locais preexistentes; nenhum dado do usuário foi encontrado nos artefatos revisados.

**Veredito: `APTO PARA APROVAÇÃO`.** Zero bloqueadores e zero ressalvas. Revisão formal da `v3` concluída; plano permanece `Em Revisão`, ciclo `Planejamento`, aprovação humana pós-revisão `Pendente`. Cabe ao responsável conferir o parecer e confirmar ou escolher D1 a D14, como exige a tabela de pontos de aprovação. K1 a K7 permanecem condição futura do merge A. Não houve aprovação, promoção, publicação ou implementação pelo revisor.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 003 + revisar_plano + 003_plan/rodada-3 + v3`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `Planejamento`; plano local `v3` em `Em Revisão`; resposta à rodada 2 presente; revisão `Em andamento`; veredito anterior `REQUER NOVA RODADA`; aprovação `Pendente`; próximo passo `Aguardando revisão (rodada 3)`.
- `state_after`: ciclo `Planejamento`; plano `v3` em `Em Revisão`; rodada 3 registrada com `APTO PARA APROVAÇÃO`; revisão `Concluída`; aprovação `Pendente`; próximo passo `Aguardando aprovação do plano`.
- `result`: `executed`
- `evidence`: solicitação humana de 2026-10-14; esta rodada e campos de revisão/veredito; hashes de origem, escopo e histórico; autoridades/arquivos/fontes citados; consulta somente leitura ao GitHub; reproduções em Node.js 24 e gates documentais. As duas rodadas anteriores, respostas e handoff da correção para `v3` são preservados como histórico.
- `blockers`: nenhum bloqueador de revisão. A aprovação humana e as decisões propostas continuam pendentes para a etapa seguinte; este handoff não a aciona.

## Pós-mortem

- **Data de conclusão:** —
- **Desvios:** —
- **Lições comprovadas:** —
