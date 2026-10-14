# Ideação — 003: regras financeiras

> **Ciclo:** `003`
> **Estado:** `Ideação`
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 003" em 2026-10-13
> **Criado em:** 2026-10-13
> **Última atualização:** 2026-10-13
> **handoff_schema_version:** `2`

## Problema

O Saldo Futuro está em produção só com a fundação: login, perfis, RLS e uma tela "em construção" (KB-003). Ainda não existe nenhuma tabela de carteira nem regra de cálculo. Para chegar à paridade com o `Meus-Investimentos` (KB-001), o produto precisa:

- registrar fatos financeiros por ativo;
- fechar meses;
- consolidar o patrimônio;
- calcular a rentabilidade (Modified Dietz);
- comparar a carteira com benchmarks públicos.

São as regras mais sensíveis do projeto. Um erro de cálculo é o pior defeito possível (`.agent/ai_behavior.md`). As regras de origem, escritas em Python, não podem ser copiadas: precisam ser reescritas e validadas contra casos de referência (ADR-002, "Trade-offs"; barreira G1).

A leitura da origem mostrou que portar o comportamento literalmente traria defeitos e ambiguidades junto. Este ciclo precisa primeiro **especificar** as regras (KB de regras financeiras), com decisões do responsável onde a origem é ambígua ou incorreta, e depois implementá-las com testes de casos de referência.

## Contexto e evidências

### No Saldo Futuro (`main` @ `0b6765c`)

- O schema tem só `public.authorized_emails`, `public.profiles`, o tipo `public.app_role` e as funções de acesso e de keepalive (`supabase/migrations/`). Os testes pgTAP provam o isolamento (`supabase/tests/database/`).
- ADR-002, decisão 6:
  - quantias monetárias em **centavos inteiros**;
  - a precisão de índices, taxas e percentuais é definida neste ciclo, na KB de regras financeiras;
  - consequência declarada: "um único runtime (TypeScript) para interface, regras e testes".
- ADR-002, produto:
  - fuso horário `America/Cuiaba`;
  - sincronização com o SGS do Banco Central sob demanda.
- `_project/README.md`, G1: mudança em regra de cálculo exige casos de referência calculados independentemente e atualização da KB. A automação dos testes de casos de referência está prevista para este ciclo.
- `_project/README.md`, G2: toda tabela de `public` tem RLS e teste de isolamento. O administrador gerencia o catálogo global de benchmarks, mas não acessa carteiras alheias.
- `design-system/DESIGN.md`, seção 6.5:
  - dado ausente é `N/D`, nunca zero;
  - um total que dependa de um item `N/D` também é `N/D`, salvo regra explícita na KB de regras financeiras.
- A próxima KB é a `KB-004`.

### Na origem (`Meus-Investimentos` @ `1b13b033ce4335c09df80237c8c31b96b37e3797`, fixada na KB-001)

A leitura completa foi feita nesta ideação, sem gravar nada no repositório de origem. As referências de linha são desse commit, e as abreviações são estas:

- `ES` = `backend/app/services/event_sourcing_service.py`;
- `BS` = `backend/app/services/benchmark_service.py`;
- `CS` = `backend/app/services/consolidacao_service.py`;
- `CALC` = `backend/app/utils/calculadora.py`;
- `FR` = `backend/app/routers/fechamentos.py`.

**Modelo**

- Eventos imutáveis por ativo, com valor sempre ≥ 0 e sinal implícito no tipo (`models/event_sourcing.py:41-60`).
- Tipos: aporte, resgate, rendimento, correção de marcação, câmbio, transferência pendente (em trânsito, sem ativo), migração histórica e estorno (ES:19-28).
- Posições mensais por ativo e consolidado mensal, materializados no fechamento.
- Catálogo e séries de benchmark com valores `Numeric(15,6)`. Uma série mensal usa `dia=0` (`models/benchmark.py:26-41`).

**Tipos numéricos**

- Dinheiro em `Numeric(15,2)` e arredondado com `quantize` sem modo explícito, isto é, meio-para-par (ES:52-55).
- Percentual consolidado em `Numeric(5,2)`, que estoura com variação ≥ 1000%.
- Retornos, composição de benchmarks e respostas da API em `float` (CALC:59; BS:163-166, 408-416).

**Fechamento em três etapas** (ES:244-378; FR:75-159)

1. **Pendências:** `saldo_calculado = saldo_inicio + Σ eventos assinados do mês`.
2. **Ajuste:** um evento calculado completa a diferença até o saldo real informado. O tipo do ajuste é escolhido por texto da classificação do ativo: "cripto" ou "vari" dá correção de marcação; os demais casos, rendimento (ES:237-241).
3. **Fechar:** materializa posições e consolidado. `valor_total = Σ saldo_fim + saldo em trânsito acumulado`.

Reabrir só é recusado se houver mês posterior fechado.

**Rentabilidade (Modified Dietz)** (CALC:36-59; BS:294-345)

- Fórmula: `R = (Vf − Vi − ΣF) / (Vi + Σ F·(D−d)/D)`, com o fluxo tratado como ocorrido no fim do dia `d`.
- Fluxos: aportes, resgates e seus estornos.
- `None` no mês aberto, no primeiro mês, sem mês anterior ou com denominador ≤ 0.
- Acumulado por encadeamento geométrico, com base 100 e truncado na primeira lacuna (BS:387-419).

**Benchmarks** (BS:143-239; CALC:62-122)

- Série diária composta em mensal por `∏(1 + v/100) − 1`.
- Benchmark de valor absoluto usa a razão entre meses.
- Comparação em diferença de pontos percentuais.
- Métricas: tracking error, information ratio, beta, taxa de acerto e drawdown máximo.
- Sincronização com o SGS sob demanda, com upsert, sem apagar.

**Não existe na origem:** rentabilidade anual calculada, "% do CDI" e catálogo semeado. Os códigos SGS só aparecem nos testes: 12, diário, e 433, mensal.

### Defeitos e ambiguidades da origem

Estes pontos não podem ser portados literalmente:

| # | Fato | Evidência |
| :-- | :-- | :-- |
| O1 | O sinal de rendimento, marcação, câmbio e migração depende de a palavra "negativo" aparecer no texto livre da `observacao`. A listagem procura outro marcador (`direcao=negativo`) e mostra eventos migrados com o sinal trocado | ES:62-87, 114; migração MIG:276, 337 |
| O2 | O estorno usa valores diferentes no saldo e na rentabilidade: o saldo usa o valor do evento referenciado, a rentabilidade usa o valor do próprio estorno. O estorno parcial fica ambíguo | ES:80-84; BS:327-334 |
| O3 | A transferência em trânsito entra no patrimônio, mas não é fluxo no Dietz. Um resgate seguido de transferência pendente gera retorno espúrio (ver P6) | ES:341, 402-412; BS:316-334 |
| O4 | O acumulado exclui o retorno do primeiro mês válido, e o exemplo da documentação da API o inclui | BS:387-419; `tests/test_benchmarks.py:500-506`; `docs/api/API.md:196-205` |
| O5 | O fechamento não verifica se as pendências foram resolvidas. A exigência de mês anterior fechado só vale se já houver algum mês fechado, enquanto a documentação a declara sempre | FR:75-103; `docs/api/API.md:106` |
| O6 | Reabrir não invalida nada: o consolidado e as posições do mês continuam com os valores antigos | FR:136-159 |
| O7 | O tipo do ajuste é deduzido por texto da classificação do ativo | ES:237-241 |
| O8 | Medidas de dispersão misturadas: tracking error com desvio populacional não anualizado, information ratio com desvio amostral ×√12. O drawdown inclui o primeiro mês, e o acumulado não | CALC:32-33, 90-106; BS:465-471 |
| O9 | Um mês corrente parcial de benchmark diário é composto como se fosse o mês inteiro. Linhas diárias sobrescrevem a mensal sem aviso | BS:143-174 |
| O10 | O patrimônio do painel não inclui o trânsito e diverge do consolidado | CS:50-58 vs ES:341 |
| O11 | Nada confere a identidade `Vf − Vi = aportes − resgates + rendimento (+ trânsito)` | ES:295-378 |
| O12 | Meses migrados só têm eventos de migração histórica: a conciliação passa e o Dietz trata a variação inteira, aportes incluídos, como rendimento | MIG:398-400 |
| O13 | O parser monetário remove todo ".", e `"1234.56"` vira 123456 | `utils/normalizacao.py:56-57` |

### Cobertura de testes da origem

- **Com teste:**
  - Dietz unitário;
  - composição diária;
  - estornos de aporte e de resgate na rentabilidade;
  - base 100 com lacuna;
  - materialização do fechamento com aporte e rendimento;
  - ajuste positivo e negativo;
  - bloqueio de mês fechado.
- **Sem teste:**
  - trânsito;
  - estorno no saldo;
  - marcação e câmbio;
  - sequência de fechamento e reabertura;
  - benchmark absoluto;
  - tracking error;
  - composições e evolução anual;
  - modo de arredondamento.

### Privacidade da origem (G3)

Alguns testes da origem têm totais fixos derivados de dados reais e nome de instituição real (`tests/test_event_sourcing_migration.py`, `tests/test_event_sourcing_backend.py`, `utils/normalizacao.py`). Nenhum teste, fixture ou valor da origem pode ser copiado: os casos de referência deste ciclo são escritos do zero, com dados fictícios.

### Evidências ausentes

Ficam para confirmar no rascunho do plano:

- limites atuais da API do SGS (janela máxima por consulta, formato, disponibilidade), na documentação oficial do Banco Central;
- quem calcula os casos de referência de forma independente (ver P17).

## Resultado desejado

Ao fim do ciclo:

- **KB-004, regras financeiras:**
  - especificação canônica de cada regra, com definições, unidades, precisão, arredondamento, tratamento de `N/D` e casos de borda;
  - casos de referência com entradas fictícias e valores esperados calculados passo a passo.
- **Schema da carteira:**
  - ativos, eventos imutáveis, posições e consolidado mensais, em centavos inteiros;
  - catálogo e séries globais de benchmarks;
  - RLS em todas as tabelas e testes de isolamento (G2), com migrações só aditivas (G4).
- **Regras implementadas e testadas automaticamente contra os casos de referência:**
  - lançamentos e estorno;
  - fechamento em três etapas, reabertura e validação;
  - consolidação;
  - Modified Dietz mensal e acumulado;
  - benchmarks e comparação.
- **Identidade contábil verificada** em todo fechamento.
- **Defeitos O1 a O13** resolvidos por decisão explícita, sem herança silenciosa.
- **Nenhuma tela de produto.** As regras ficam prontas para o ciclo `004`.

## Hipóteses

- **H1 — Especificar antes de implementar.** Uma entrega só de documentação (KB-004 e casos de referência), revisada e aprovada antes do código, reduz o retrabalho. Os testes leem os mesmos casos da KB.
- **H2 — Dinheiro inteiro, razões em ponto flutuante.** Quantias em centavos inteiros (`bigint` no banco, `number` inteiro no TypeScript, seguro até 2⁵³ centavos) tornam somas e saldos exatos. Retornos e composições em `float64`, arredondados só na apresentação, ficam abaixo de 10⁻¹² de erro relativo em horizontes de décadas. Assim, nenhuma biblioteca decimal seria necessária. A ser confirmado com casos de referência e tolerância declarada (P3).
- **H3 — Regras em funções puras de TypeScript, persistência transacional no banco.** As regras são funções puras testadas com Vitest. O fechamento é gravado de uma vez por uma função do banco que confere a identidade contábil e o encadeamento de meses. Ver "Alternativas".
- **H4 — Eventos imutáveis por privilégio.** As tabelas de eventos não têm política de `update` nem de `delete` para o usuário, e a correção é feita por estorno. A imutabilidade fica garantida pelo banco, não só pela interface.
- **H5 — Sinal explícito.** O sinal do evento fica num campo próprio (direção ou valor com sinal), nunca em texto livre. Isso resolve O1 e O13 sem decisão de cálculo.
- **H6 — Benchmarks globais.** Catálogo e séries ficam em tabelas lidas por qualquer usuário autenticado e escritas só pelo administrador. As séries não contêm dado do usuário.
- **H7 — O ciclo cabe em quatro entregas revisáveis:**
  - (A) KB-004 e casos de referência;
  - (B) schema da carteira, lançamentos e fechamento;
  - (C) consolidação, Dietz e acumulado;
  - (D) benchmarks, SGS, comparação e métricas.

## Alternativas

### Onde ficam as regras

| Alternativa | Vantagem | Custo ou risco |
| :-- | :-- | :-- |
| Funções puras em TypeScript, com o fechamento persistido por uma função do banco que confere invariantes | Um runtime para regras e testes (ADR-002); testes rápidos em Vitest; o banco garante atomicidade e identidade | Duas camadas para manter coerentes; a função do banco precisa de teste pgTAP |
| Tudo em PL/pgSQL | Atomicidade e consistência no próprio banco; uma fonte de verdade | Contraria a consequência da ADR-002; testes de cálculo mais lentos e verbosos em pgTAP; aritmética `numeric` diferente da do cliente |
| Tudo em TypeScript, com gravação linha a linha | Simples | Fechamento parcial possível em falha de rede; nenhuma invariante garantida pelo banco |

### Fatiamento

| Alternativa | Vantagem | Custo ou risco |
| :-- | :-- | :-- |
| Um ciclo com as quatro entregas de H7 | Cumpre o mapa de ciclos (`README.md`, `003` com benchmarks); uma cerimônia | Ciclo grande; o plano precisa de muitas decisões |
| Separar benchmarks num ciclo próprio | Ciclos menores | Renumera `004` e `005` de novo; a comparação fica sem base até lá |

### Quando a KB fica pronta

| Alternativa | Vantagem | Custo ou risco |
| :-- | :-- | :-- |
| KB-004 completa na primeira entrega (H1) | Especificação revisada antes do código; casos usados por todas as entregas | Atrasa o primeiro código |
| KB-004 crescendo a cada entrega | Código mais cedo | Regras decididas no meio da implementação, o que é mais propenso a herdar a origem |

## Riscos e restrições

- **Herança silenciosa de defeitos.** Portar a origem literalmente reproduziria O1 a O13. Mitigação: cada regra da KB cita a evidência da origem e diz se mantém, corrige ou descarta, e por quê.
- **Casos de referência não independentes.** Se os valores esperados forem gerados pelo próprio código, o teste não prova nada. Mitigação: valores calculados à mão na KB, conferidos pelo responsável (P17).
- **Ponto flutuante.** Somar dinheiro em `float` produz centavos errados. Mitigação: dinheiro sempre inteiro; o validador ou o lint podem barrar `parseFloat` em módulos de dinheiro, a decidir no plano.
- **Fuso e calendário.** A data do evento é uma data civil em `America/Cuiaba`. O peso do Dietz depende do dia e do número de dias do mês, inclusive fevereiro em ano bissexto. Uma conversão indevida para UTC desloca eventos de dia ou de mês.
- **Isolamento (G2).** Cada tabela nova de carteira precisa de RLS por `user_id` e de teste. As funções `security definer` do fechamento podem furar o isolamento se não filtrarem pelo usuário autenticado.
- **Migrações (G4).** O schema nasce aqui, e uma correção posterior só por migração nova. Decisões de schema mal feitas ficam caras.
- **Privacidade (G3).** Nenhum valor, nome de ativo ou de instituição real entra em KB, fixture ou teste. Exemplos só com dados fictícios e índices públicos.
- **Integração externa (SGS).** Disponibilidade, limites e formato da API do Banco Central precisam ser validados contra a documentação oficial antes do plano (lição de 2026-10-13 sobre roteiros de serviço externo). Previews não têm backend.
- **Escopo.** Há a tentação de entregar telas (ciclo `004`) ou o migrador de dados (ciclo `005`) junto. Este ciclo só define como os meses migrados serão tratados (P15), sem migrar nada.
- **Tamanho.** São muitas decisões numa entrega. Se a revisão do plano não convergir, o fatiamento pode precisar ser revisto.
- **Barreiras de domínio previstas:**
  - G1: aplica-se;
  - G2: aplica-se (tabelas novas);
  - G3: aplica-se (KB e fixtures);
  - G4: aplica-se (primeiras migrações da carteira).

## Perguntas em aberto

Todas as decisões abaixo são do responsável. Os valores são fictícios. Onde aparece "Recomendação", ela é só a proposta do autor: nada foi decidido. As de cálculo seguem a regra de `.agent/ai_behavior.md`, com alternativas e exemplos numéricos.

### Escopo e arquitetura

**P1 — Fatiamento.** Um ciclo com as quatro entregas de H7, ou benchmarks num ciclo separado? Recomendação: um ciclo, quatro entregas.

**P2 — Onde ficam as regras.** Escolha uma das três alternativas da seção "Alternativas". Recomendação: funções puras em TypeScript com o fechamento persistido por uma função do banco que confere invariantes.

**P3 — Aritmética das razões.**

- (a) `float64` com tolerância declarada nos testes (por exemplo, |erro| < 10⁻⁹) e arredondamento só na apresentação;
- (b) biblioteca decimal, que é dependência nova.

Exemplo: um retorno mensal de 0,333333% por três meses.

- Composição com precisão total: (1,00333333)³ − 1 = **1,0033%**.
- Arredondando cada mês a 0,33% antes de compor: (1,0033)³ − 1 = **0,9933%**.

A diferença vem do momento do arredondamento, não do tipo numérico. Por isso a regra proposta é nunca arredondar valores intermediários. Recomendação: (a).

**P4 — Precisão e modo de arredondamento na apresentação.**

- Quantas casas para percentuais (2 ou 4) e para índices.
- Qual modo de arredondamento: meio-para-par, como a origem, ou meio-para-cima.

Exemplo: 0,125% com 2 casas fica **0,12%** no meio-para-par e **0,13%** no meio-para-cima. Recomendação: 2 casas na interface, meio-para-cima, por ser o arredondamento esperado por um usuário leigo. Valores intermediários nunca são arredondados (P3).

### Eventos e fechamento

**P5 — Estorno (O2).**

- (a) O estorno é sempre total e vale exatamente o evento referenciado.
- (b) O estorno pode ser parcial e usa o próprio valor no saldo e na rentabilidade.

Exemplo: aporte de R$ 1.000,00 estornado com R$ 400,00. Na origem, o saldo cai R$ 1.000,00 e a rentabilidade considera só R$ 400,00. Em (a), o estorno de R$ 400,00 é recusado: estorna-se R$ 1.000,00 e lança-se um aporte de R$ 600,00. Em (b), saldo e fluxo caem R$ 400,00. Recomendação: (a), mais simples de auditar.

**P6 — Transferência em trânsito (O3).** Cenário: patrimônio inicial R$ 10.000,00 num ativo, mês de 30 dias. No dia 10, R$ 2.000,00 saem do ativo e ficam em trânsito. No fim do mês, o ativo vale R$ 8.050,00, e o trânsito, R$ 2.000,00.

- (a) Como na origem: o resgate é fluxo e o trânsito conta no patrimônio. R = (10.050 − 10.000 + 2.000) / (10.000 − 2.000 × 20/30) = 2.050 / 8.666,67 = **23,65%** (espúrio).
- (b) A transferência é movimento interno da carteira: nem resgate nem fluxo, e o trânsito conta no patrimônio. R = 50 / 10.000 = **0,50%**.
- (c) O trânsito fica fora da carteira: o resgate é fluxo e o trânsito não conta no patrimônio. R = (8.050 − 10.000 + 2.000) / 8.666,67 = **0,58%**.

Recomendação: (b), com a transferência modelada como saída de um ativo e entrada no trânsito, e o trânsito como parte do patrimônio.

**P7 — Fechar com pendências (O5).** Cenário: um ativo tem saldo calculado de R$ 5.000,00, e o saldo real do mês não foi informado.

- (a) Como na origem: fecha com o saldo calculado. O rendimento desse ativo no mês fica 0, sem aviso.
- (b) O fechamento exige que cada ativo tenha o saldo real confirmado, mesmo quando igual ao calculado.

Recomendação: (b).

**P8 — Ordem dos meses e reabertura (O5, O6).**

- O primeiro fechamento define o início da carteira, e depois os meses são estritamente sequenciais? A origem faz assim, mas a documentação dela diz outra coisa.
- Só o último mês fechado pode ser reaberto, como na origem?
- Um mês reaberto tem seu consolidado tratado como inexistente (rentabilidade `N/D`) até ser fechado de novo?

Recomendação: sim às três.

**P9 — Tipo do ajuste (O7).** O ajuste do saldo real é:

- (a) sempre "rendimento";
- (b) "rendimento" ou "correção de marcação", definido por um atributo explícito do ativo (por exemplo, "renda variável");
- (c) escolhido pelo usuário a cada ajuste.

A escolha não muda o Dietz, porque nenhum dos dois é fluxo, mas muda os totais de rendimento exibidos. Recomendação: (b).

**P10 — Identidade contábil (O11).** Todo fechamento confere a identidade abaixo e recusa o fechamento se ela não fechar?

`Vf − Vi = aportes − resgates + rendimento + marcação + câmbio ± estornos`

Exemplo: Vi = R$ 10.000,00, aportes R$ 1.000,00, rendimento R$ 100,00 e Vf = R$ 11.100,00 fecham, com 11.100 − 10.000 = 1.000 + 100. Recomendação: sim. Em centavos inteiros, a igualdade é exata.

### Rentabilidade

**P11 — Peso do fluxo no Dietz.** Exemplo: Vi = R$ 10.000,00, aporte de R$ 1.000,00 no dia 15 de um mês de 30 dias, Vf = R$ 11.100,00, ganho de R$ 100,00.

- (a) Fluxo no fim do dia, como na origem: peso (30 − 15) / 30 = 0,5. R = 100 / 10.500 = **0,9524%**.
- (b) Fluxo no início do dia: peso (30 − 15 + 1) / 30 = 0,5333. R = 100 / 10.533,33 = **0,9494%**.

Recomendação: (a), por paridade com a origem e com os testes dela.

**P12 — Acumulado e primeiro mês (O4, O8).** Exemplo: retornos mensais de 1,00% (janeiro, primeiro mês válido), 2,00% e −0,50%.

- (a) Como na origem, o primeiro mês é a base: (1,02 × 0,995) − 1 = **1,49%**.
- (b) O primeiro mês entra: (1,01 × 1,02 × 0,995) − 1 = **2,50%**.

Recomendação: (b). Como o Dietz já exige o mês anterior fechado, o primeiro mês com retorno já tem base própria. A mesma regra vale para o drawdown.

**P13 — Rentabilidade anual**, que não existe na origem. Incluir neste ciclo a rentabilidade do ano até a data, por encadeamento geométrico dos meses? No exemplo de P12, o ano até março vale 2,50%. Um mês `N/D` torna o ano `N/D`, pela seção 6.5 do `DESIGN.md`, salvo regra explícita na KB. Recomendação: incluir, com o `N/D` propagado.

**P14 — Variação versus rentabilidade.** A origem exibe a "variação %" do patrimônio, que inclui aportes. No exemplo de P11, a variação é **11,00%** e a rentabilidade é **0,95%**. Manter as duas medidas, com nomes inequívocos na KB ("variação do patrimônio" e "rentabilidade")? Recomendação: sim.

**P15 — Meses sem decomposição de fluxos (O12).** Cenário: um mês só tem eventos de migração histórica, com Vi = R$ 10.000,00 e Vf = R$ 11.100,00. Não dá para saber se houve aporte.

- (a) Como na origem: a variação inteira conta como rendimento, ou seja, 11,00%.
- (b) A rentabilidade desse mês fica `N/D`.

A migração em si é do ciclo `005`, mas a regra precisa existir desde já. Recomendação: (b).

### Benchmarks

**P16 — Escopo e regras de benchmarks.**

- **Mês parcial (O9).** CDI diário fictício de 0,04% ao dia. Com 21 dias úteis, o mês fechado vale (1,0004)²¹ − 1 = **0,8434%**. Com só 10 dias publicados até hoje, vale **0,4007%**. A origem apresenta 0,4007% como retorno do mês. Opções:
  - (a) marcar o mês como parcial e não compará-lo com a carteira;
  - (b) exibir como "até dd/mm".

  Recomendação: (a) na comparação.
- **Forma da comparação.** Exemplo: carteira 0,90% e CDI 0,80% no mês. A diferença é **+0,10 p.p.**, e a carteira rendeu **112,5% do CDI**. A origem só tem a diferença em p.p. Incluir também "% do benchmark"? Recomendação: incluir, calculado sobre os acumulados.
- **Métricas de risco (O8).** Exemplo de diferenças mensais: 0,10, −0,10, 0,20 e 0,00 p.p. O tracking error com desvio populacional vale **0,112 p.p.**, e com desvio amostral, **0,129 p.p.** Anualizados (×√12), valem 0,387 e 0,447. Opções:
  - (a) portar todas as métricas com uma única convenção: amostral e anualizada;
  - (b) adiar tracking error, information ratio e beta, mantendo a taxa de acerto e o drawdown.

  Recomendação: (b), para reduzir o ciclo.
- **Catálogo inicial.** Semear o catálogo com séries públicas (por exemplo, CDI diário SGS 12 e IPCA mensal SGS 433) por migração? A ser conferido na documentação do BCB.
- **SGS e importação manual.** A sincronização sob demanda com o SGS (ADR-002) entra neste ciclo? E a importação manual de séries por JSON ou CSV? Recomendação: SGS sim, importação manual não.

### Processo

**P17 — Casos de referência independentes.** Quem calcula os valores esperados?

- (a) O autor da KB calcula passo a passo no próprio documento, e o responsável confere numa planilha.
- (b) O responsável fornece os casos.
- (c) Outra ferramenta ou modelo recalcula, como revisão independente.

Recomendação: (a) e (c) juntas.

**P18 — Revisão por outra ferramenta.** Pela lição de 2026-10-13, a revisão do plano deste ciclo deve ser feita por ferramenta diferente da autora? Recomendação: sim, sobretudo na KB-004.

## Fora do escopo

- Telas de produto, painel e gráficos (ciclo `004`). Este ciclo pode expor as regras por funções e consultas, sem interface.
- Migração dos dados do `Meus-Investimentos` e o migrador (ciclo `005`), além da tabela `investimentos_legacy` e do migrador histórico de CSV (ADR-002).
- Correção do repositório de origem ou de seu histórico.
- Tela de administração de acessos (ciclo `004`).
- Importação de dados reais em qualquer ambiente de teste ou preview.
- Qualquer alteração nas regras de governança ou nas barreiras G1 a G4.

## Critérios para iniciar o planejamento

- Decisões P1 a P18 respondidas pelo responsável, ou marcadas explicitamente para o rascunho do plano propor.
- Autorização explícita: "autorizo o rascunho do plano do ciclo 003".
- Ciclo `003` reservado em `_project/cycles.md` como `Ideação`, sem divergência com este arquivo.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Ideação registrada — ciclo 003 (completo)
Quem: Responsável
Conferir: Perguntas P1 a P18 (escopo, arquitetura, estorno, trânsito, fechamento, Dietz, acumulado, benchmarks e casos de referência) e defeitos O1 a O13 desta ideação
Diga: "autorizo o rascunho do plano do ciclo 003"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 003 + idear + regras_financeiras + 0b6765c`
- `effect_class`: `local_mutation`
- `state_before` / `state_after`:
  - antes: `cycles.md` com próximo ciclo `003`, sem reserva e sem ideação do `003`;
  - depois: ciclo `003` em `Ideação`, com este arquivo, e próximo ciclo `004`.
- `result`: `executed`
- `evidence`:
  - este arquivo e `_project/cycles.md`;
  - autoridades lidas: `.agent/ai_behavior.md`, `_project/README.md`, `.agent/templates/ideacao.md`, ADR-002, KB-001, KB-003 e `design-system/DESIGN.md` §6.5;
  - leitura somente leitura do `Meus-Investimentos` @ `1b13b033ce4335c09df80237c8c31b96b37e3797`;
  - validador de governança executado depois da gravação.
- `blockers`: as decisões P1 a P18 e a autorização do rascunho do plano. Nenhum bloqueio de execução.
