---
title: "Regras financeiras"
tags:
  - regras
  - finanças
  - referência
author: "Thiago Andrade e Claude"
module: "Regras financeiras"
last_updated: "2026-10-14"
origin_cycle: "003"
---

# KB-004: Regras financeiras

## Finalidade

Especificação canônica das regras de cálculo do Saldo Futuro: unidades, precisão, arredondamento, tratamento de `N/D` e casos de borda de eventos, fechamento, consolidação, rentabilidade e benchmarks. É a "KB de regras financeiras" citada pela barreira G1 (`_project/README.md`), pela ADR-002 (decisão 6) e pelo `design-system/DESIGN.md` (seção 6.5).

Quem a consulta:

- quem implementa ou revisa uma regra de cálculo, antes de escrever código;
- os testes automatizados, que leem os mesmos casos de referência em `tests/fixtures/financeiro/casos_referencia.json`;
- quem decide uma mudança de regra, que exige atualizar esta KB e os casos (G1).

## Limite de autoridade

Conhecimento de referência. Esta KB não autoriza mudança, não substitui o plano aprovado do ciclo `003` nem as ADRs. Em divergência com uma decisão registrada no plano (P1 a P18, D1 a D14) ou nas ADRs, vale a decisão, e esta KB deve ser corrigida. As escolhas K1 a K13 foram decididas pelo responsável e estão registradas aqui (seção 13).

Ela deliberadamente não decide:

- nomes de tabelas, colunas e funções do banco, fixados nas PRs das issues B a D dentro destas regras;
- a forma visual de valores, sinais e `N/D`, que pertence ao `design-system/DESIGN.md`;
- tracking error, information ratio e beta (adiados, P16), rentabilidade por ativo (D7) e importação manual de séries (P16).

## Conteúdo

### 1. Convenções

**Dinheiro.** Toda quantia é um número inteiro de centavos (ADR-002). No TypeScript, dentro das regras, centavos são `bigint` (tipo nominal `Centavos`); somas intermediárias são exatas, sem limite. No banco, a coluna gravada é `bigint`, mas toda acumulação é feita em `numeric`, também sem limite. A conversão entre `bigint` e `number` (JSON, Data API) só ocorre na fronteira e exige `Number.isSafeInteger` (D11). Dinheiro nunca passa por ponto flutuante.

**Datas.** Toda data de evento é uma data civil `AAAA-MM-DD`, sem hora nem fuso, interpretada em `America/Cuiaba` (ADR-002). Meses são `AAAA-MM`. O número de dias de um mês é calculado aritmeticamente (fevereiro tem 29 dias em ano divisível por 4, exceto os divisíveis por 100 que não o são por 400), sem `Date` local. "Hoje" é a data civil corrente em `America/Cuiaba`, obtida por `Intl`. O resultado de toda regra é o mesmo em qualquer fuso do processo.

**Índices e taxas.** Valores de séries de benchmark são gravados exatamente como publicados pela fonte, em `numeric` sem escala fixa (D1). Eles são lidos como texto e só convertidos para `float64` no cálculo.

**Razões.** Retornos, composições, variações e percentuais são frações em `float64` (0,01 = 1%), nunca gravadas (D2) e nunca arredondadas em valores intermediários (P3). Nos testes, uma razão confere quando o erro é de no máximo 10⁻⁹ × max(1, |esperado|): absoluto até 1, relativo acima.

**`N/D`.** Ausência de valor, nunca zero (`DESIGN.md`, 6.5). Toda regra que dependa de um valor `N/D` devolve `N/D`, salvo regra explícita nesta KB.

### 2. Apresentação e arredondamento (P4, K10)

- Percentuais, diferenças em pontos percentuais e índices são apresentados com exatamente 2 casas decimais.
- O modo é meio-para-cima, simétrico: o meio se afasta do zero (K10). Assim, 0,125 vira 0,13 e −0,125 vira −0,13.
- O arredondamento é decimal, feito sobre a representação decimal mais curta que reproduz o `float64` (a de `Number.prototype.toString`), expandida sem expoente. Um percentual é obtido dessa representação deslocando a vírgula duas casas, sem multiplicar por 100 em ponto flutuante. Assim, a fração 0,01005, cujo `float64` fica abaixo de 0,01005, é apresentada como 1,01%.
- O resultado usa o formato brasileiro: `.` como separador de milhar, `,` como separador decimal e o sinal de menos U+2212 nos negativos. Um resultado que arredonda para zero é `0,00`, sem sinal.
- O símbolo (`%`, `p.p.`), o sinal explícito de positivos e a cor são do `DESIGN.md`. O arredondamento só ocorre na apresentação; nenhum cálculo usa o valor arredondado.
- O `DESIGN.md` (6.3) indica `Intl.NumberFormat` para percentuais. Ele é um meio aceitável desde que produza os resultados do CR-38: no Node.js 24, conferido em 2026-10-14, o `Intl` coincide nos algarismos de todos os percentuais do caso, mas usa hífen nos negativos (que o `DESIGN.md` manda trocar pelo U+2212) e apresenta −0,00004 como `-0,00%`, com sinal no zero. A regra vale pelo resultado, não pelo mecanismo.

### 3. Faixa monetária e recusa (D11)

- Toda quantia gravada ou devolvida (valor de evento, saldo calculado, saldo real, ajuste, saldo inicial e final de posição, totais do consolidado) precisa estar em ±(2⁵³ − 1) centavos, isto é, entre −9.007.199.254.740.991 e 9.007.199.254.740.991.
- Somas intermediárias não têm limite: no TypeScript são `bigint`; no banco, `numeric`. Um subtotal acima de 64 bits que volta para dentro da faixa produz o resultado exato.
- Um valor gravado ou devolvido fora da faixa é recusado com o motivo `faixa`. A recusa vale para a prévia do fechamento e para o fechamento, é a mesma nas duas camadas e não grava nada.
- O lançamento confere só o próprio valor. Um saldo que sai da faixa é recusado na prévia e no fechamento do mês.

### 4. Ativos e eventos

#### 4.1 Ativos

- Cada ativo pertence a um usuário e tem um atributo explícito de tipo de ajuste: `rendimento` ou `marcacao` (P9).
- Cada usuário tem exatamente um ativo de sistema "Em trânsito", criado só pelas funções do banco (D3). Ele não tem tipo de ajuste.
- Um ativo é desativado logicamente; nunca é apagado. Ativo desativado não recebe lançamentos novos nem entra nas pendências do fechamento. A desativação só é aceita com saldo calculado atual zero (o saldo final do último mês fechado mais os eventos posteriores), para que nenhum patrimônio fique fora da carteira.

#### 4.2 Tipos de evento e sinais (D4)

Todo evento tem ativo, data civil, tipo e valor em centavos com sinal, diferente de zero. Eventos são imutáveis: a correção é feita por estorno (H4).

| Tipo | Sinal aceito | É fluxo externo no Dietz? | Componente do consolidado |
| :-- | :-- | :-- | :-- |
| `aporte` | positivo | Sim | aportes |
| `resgate` | negativo | Sim | resgates |
| `rendimento` | qualquer, ≠ 0 | Não | rendimento |
| `marcacao` (correção de marcação) | qualquer, ≠ 0 | Não | marcação |
| `cambio` | qualquer, ≠ 0 | Não | câmbio |
| `migracao` (migração histórica) | qualquer, ≠ 0 | Não; torna a rentabilidade do mês `N/D` (P15) | migração |
| `transferencia` (perna) | qualquer, ≠ 0 | Não | transferências (soma zero) |
| `estorno` | o oposto do evento referenciado | Igual ao referenciado | O do evento referenciado |

Valor zero e sinal contrário ao do tipo são recusados.

#### 4.3 Estorno (P5, K2)

- O estorno é sempre total: vale exatamente o oposto do evento referenciado. Ele não recebe valor; uma tentativa de informar outro valor é recusada.
- Cada evento tem no máximo um estorno. Estorno de estorno é recusado.
- O estorno tem data própria, igual ou posterior à do evento referenciado, e entra no mês dessa data, com o tipo do evento referenciado: o estorno de um aporte é um fluxo negativo no dia do estorno; o de um rendimento reduz o rendimento.
- O estorno de um evento de mês já fechado é aceito, datado num mês aberto, e o mês fechado continua intacto (K2).
- A perna de uma transferência não é estornada sozinha (K6).

#### 4.4 Transferência e trânsito (P6, D3, K6)

- Uma transferência move dinheiro entre dois ativos do mesmo usuário, sem sair da carteira: não é aporte, resgate nem fluxo.
- É criada numa só operação, com um valor positivo, um ativo de origem e um de destino diferentes, e gera exatamente duas pernas na mesma data: o oposto do valor na origem e o valor no destino. A soma das pernas é zero.
- O destino pode ser o ativo "Em trânsito", que guarda o dinheiro entre a saída de uma instituição e a chegada em outra. Depois, outra transferência leva o valor do trânsito ao destino final. Uma diferença na chegada (por exemplo, uma tarifa) é lançada como evento no ativo de destino (K12).
- A correção é sempre da transferência inteira (K6): uma operação estorna as duas pernas juntas, na mesma data (igual ou posterior à da transferência), mantendo a soma zero. Uma segunda correção da mesma transferência é recusada.
- O trânsito só recebe pernas de transferência: nenhum lançamento comum é feito nele (K12).
- O patrimônio é a soma dos saldos de todos os ativos, trânsito incluído (O10).

#### 4.5 Migração histórica (P15)

Eventos do tipo `migracao` representam variações de meses importados da origem cuja decomposição em aportes, resgates e rendimento é desconhecida (ciclo `005`). Qualquer evento de migração num mês torna a rentabilidade desse mês `N/D`. A variação do patrimônio continua calculável.

#### 4.6 Datas aceitas e início da carteira (P8, K7, K13)

- Nenhum lançamento tem data posterior a hoje (K13).
- Antes do primeiro fechamento, qualquer data até hoje é aceita.
- O primeiro fechamento só é aceito no mês do evento mais antigo da carteira (K7); sem nenhum evento, não há o que fechar e o fechamento é recusado. Esse mês é o **início da carteira**, e seu saldo inicial é zero.
- Depois do primeiro fechamento, todo lançamento (inclusive estorno e transferência) precisa ter data no primeiro mês aberto ou depois.
- Reabrir o primeiro mês volta ao estado sem mês fechado.

### 5. Fechamento mensal (P7 a P10, D5, D6, K12, K13)

O fechamento de um mês tem três etapas.

1. **Pendências (P7, K12).** Cada ativo ativo que não seja o trânsito e que tenha histórico no mês (posição no mês fechado anterior ou evento no mês) precisa de um saldo real informado para o fim do mês, mesmo que igual ao calculado. Faltando algum, o fechamento é recusado com a lista de pendentes. O trânsito nunca é pendência, e um saldo real informado para ativo sem histórico no mês, para o trânsito ou para ativo de outro usuário é recusado. Um ativo sem histórico até o mês não tem saldo e fica fora da apuração.
2. **Ajuste (P9, D6, K12).** Para cada ativo:
   - saldo calculado = saldo inicial + soma dos eventos do ativo com data no mês (estornos incluídos);
   - ajuste = saldo real − saldo calculado, com o tipo do atributo do ativo (`rendimento` ou `marcacao`);
   - no trânsito, o saldo final é o calculado e o ajuste é zero.

   O ajuste não é evento: fica registrado na posição mensal e não é fluxo.
3. **Fechar.** Grava de uma vez, por ativo, a posição (saldo inicial, saldo final, ajuste e seu tipo) e o consolidado do mês (seção 6), e marca o mês como fechado.

O saldo inicial de um ativo é o saldo final do mesmo ativo no mês fechado anterior, ou zero no início da carteira e para ativo criado depois.

**Identidade contábil (P10).** Todo fechamento confere, em centavos exatos:

`Vf − Vi = aportes + resgates + rendimento + marcação + câmbio + migração`

em que cada componente soma os eventos do mês daquele tipo (estornos pelo tipo referenciado), rendimento e marcação incluem os ajustes do seu tipo, e resgates é negativo. As transferências somam zero e não aparecem. Se a identidade não fechar, o fechamento é recusado com o motivo `identidade`.

**Sequência (P8).** Depois do início, só o mês imediatamente seguinte ao último fechado pode ser fechado; outro mês é recusado com o motivo `sequencia`.

**Mês terminado (K13).** Um mês só fecha depois do seu último dia: em 31/10, outubro ainda não fecha; em 01/11, fecha.

**Reabertura (P8, D6).** Só o último mês fechado pode ser reaberto; outro mês é recusado com o motivo `reabertura`. Reabrir remove as posições, os ajustes e o consolidado do mês e o devolve ao estado aberto, exatamente como antes do fechamento. Os eventos lançados não mudam. Um mês reaberto não tem rentabilidade (`N/D`) até ser fechado de novo.

**Divisão entre as camadas (D5).** O TypeScript calcula a prévia (pendências e ajustes). A função do banco recebe os saldos reais, recalcula as somas inteiras, confere pendências, sequência, mês terminado, faixa e identidade, e grava posições e consolidado numa transação, recusando sem gravação parcial. As duas camadas usam a mesma aritmética exata e os mesmos casos de referência.

### 6. Consolidação e patrimônio

- **Vi** do mês é a soma dos saldos iniciais das posições; **Vf**, a soma dos saldos finais. Os dois incluem o trânsito (D3, O10).
- O consolidado grava, em centavos, Vi, Vf e os componentes da identidade. Nenhum percentual ou retorno é gravado (D2): tudo é calculado na leitura.
- Por construção, o Vi de um mês é o Vf do mês fechado anterior.

### 7. Variação do patrimônio e rentabilidade (P11, P14, P15, K5)

**Variação do patrimônio (P14).** (Vf − Vi) / Vi. É `N/D` se o mês não estiver fechado ou se Vi ≤ 0. Inclui aportes e resgates: não mede desempenho.

**Rentabilidade (Modified Dietz, P11).** Só da carteira consolidada (D7). Para um mês de D dias, com fluxos externos F, cada um no dia d do mês, tratado como ocorrido no fim do dia:

`R = (Vf − Vi − ΣF) / (Vi + Σ F·(D − d)/D)`

calculada na forma inteira equivalente, sem pesos fracionários:

- numerador N = D·(Vf − Vi − ΣF);
- denominador M = D·Vi + Σ F·(D − d);
- N e M são inteiros exatos (`bigint`), e R = N / M é a única divisão, em `float64`.

Fluxos externos: aportes, resgates e os estornos deles, cada um no dia da própria data. Transferências, rendimento, marcação, câmbio, ajustes e migração não são fluxos.

A rentabilidade é `N/D` quando:

- o mês não está fechado (aberto ou reaberto);
- o mês é o início da carteira, que não tem mês anterior;
- o mês tem evento de migração histórica (P15);
- M ≤ 0.

Vi = 0 com M > 0 não é `N/D`: a fórmula vale normalmente (K5).

### 8. Acumulado, ano, base 100 e drawdown (P12, P13, K1, K8)

**Período efetivo (K8).** Um período de meses [a, b] começa, efetivamente, em a' = o maior entre a e o mês seguinte ao início da carteira. O início e os meses anteriores a ele não são lacuna. Se a' > b, o período não tem nenhum mês com retorno, e todo resultado é `N/D`.

**`N/D` no período (K1).** Se algum mês de [a', b] tiver rentabilidade `N/D`, por qualquer motivo, o acumulado, o ano, a série base 100 e o drawdown do período são `N/D`. Um período que comece depois do mês `N/D` é calculável.

**Acumulado (P12).** Π(1 + Rₘ) − 1 sobre os meses de [a', b], por encadeamento geométrico. O primeiro mês com retorno entra (O4). "Desde o início" é o período que começa no início da carteira.

**Ano até a data (P13).** O acumulado de [janeiro do ano, mês consultado].

**Série base 100.** I₀ = 100 no começo de a'; Iₖ = Iₖ₋₁ · (1 + Rₖ) a cada mês.

**Drawdown máximo.** O menor valor de Iₖ / max(100, I₁, …, Iₖ) − 1 no período, com o pico inicial 100 incluído (o primeiro mês entra, P12). É zero ou negativo.

### 9. Benchmarks (P16, D1, D8, D10, K3, K4, K9)

#### 9.1 Catálogo e séries (D8, D9)

- Catálogo global, lido por qualquer usuário autenticado e gravado só pela função de carga, que exige o administrador (D10). Não contém dado do usuário.
- Cada benchmark tem código SGS e uma única periodicidade, `diaria` ou `mensal`, imutáveis depois de criados; uma série diferente é outro benchmark (D8).
- Valores únicos por benchmark e data. A série mensal é datada no dia 1 do mês.
- Catálogo inicial: CDI (SGS 12, diária, % ao dia) e IPCA (SGS 433, mensal, % ao mês) (D9).
- O valor `v` de uma série de taxa é um percentual do período: o fator do período é 1 + v/100.

#### 9.2 Sincronização e cobertura (D10, K4)

- A sincronização busca no SGS o período pedido em janelas consecutivas, sem sobreposição, de no máximo 10 anos cada, com `dataInicial` e `dataFinal` em `dd/MM/aaaa`. Lê os valores como texto, valida todas as respostas e só então grava tudo numa única chamada à função de carga: valores e cobertura juntos, ou nada.
- Cada benchmark guarda a **cobertura**: o intervalo contínuo de datas que a fonte já entregou.
- Primeira carga de [di, df]: a cobertura passa a ser [di, data do último valor devolvido].
- Carga seguinte de [di, df] sobre a cobertura [ci, cf]:
  - é recusada com o motivo `buraco` se di > cf + 1 dia ou df < ci − 1 dia, porque a cobertura deixaria de ser contínua;
  - é recusada com o motivo `sem_valores` se a fonte não devolver nenhum valor, e nada é gravado;
  - senão, todos os valores gravados com data em [di, df] são substituídos pelos devolvidos (revisão da fonte), e a cobertura passa a ser [min(ci, di), data do último valor gravado depois da substituição].
- Repetir uma carga bem-sucedida não muda nada.

#### 9.3 Retorno mensal do benchmark (P16, K4)

- **Série diária.** O retorno do mês é Π(1 + vᵢ/100) − 1 sobre os valores com data no mês. Ele só existe se o mês estiver **completo** (K4): a cobertura começa no dia 1 do mês ou antes **e** a data do último valor da cobertura é posterior ao último dia do mês. Um dia sem valor dentro da cobertura é um dia sem taxa da fonte. Mês incompleto é **parcial**: não tem retorno comparável (`N/D`) e nunca vira zero. Limite declarado: sem calendário de dias úteis, uma lacuna da própria fonte dentro da cobertura não é detectável.
- **Série mensal.** O retorno do mês é v/100 se houver valor datado no dia 1 do mês; senão, `N/D`.
- **Acumulado do benchmark.** Π(1 + Rₘ) − 1 sobre os meses do período; um mês `N/D` ou parcial torna o acumulado `N/D` (K1).

#### 9.4 Comparação com a carteira (P16, K3, K9)

A comparação usa o período efetivo da carteira [a', b] (seção 8) para os dois lados.

- **Diferença em pontos percentuais:** Rc − Rb, sobre os acumulados do período (apresentada em p.p.: a fração 0,001 é 0,10 p.p.).
- **% do benchmark:** Rc / Rb, sobre os acumulados. É `N/D` se Rb ≤ 0 (K3).
- **Taxa de acerto:** número de meses em que o retorno da carteira é estritamente maior que o do benchmark, dividido pelo número de meses do período. Empate não é acerto (K9).
- Se algum mês do período for `N/D` na carteira, `N/D` ou parcial no benchmark, as três medidas são `N/D` (K1). Período sem mês também dá `N/D`.

#### 9.5 Benchmark de valor absoluto (D14) — especificado, não implementado

Uma série de nível (um índice como 100, 102, …) não é taxa. O retorno do mês m é Nₘ / Nₘ₋₁ − 1, com N o nível do mês: de 100 para 102, o retorno é 2%, não 102%. Sem o nível do mês anterior, o retorno é `N/D`. Nenhuma série do catálogo inicial é de nível e a importação manual ficou fora (P16), então esta regra não tem implementação neste ciclo.

### 10. Parser de quantias (O13, K11) — especificado, implementado no ciclo `004`

Converte o texto digitado pelo usuário em centavos, no formato brasileiro estrito (K11):

- espaços nas pontas são ignorados; um sinal de menos opcional (`-` ou U+2212) pode abrir o texto;
- a parte inteira tem só algarismos, ou grupos separados por `.`: o primeiro com 1 a 3 algarismos e os demais com exatamente 3;
- a parte decimal, opcional, vem depois de uma única `,`, com 1 ou 2 algarismos;
- qualquer outra forma é recusada: `.` fora de grupos de milhar, mais de 2 casas decimais, mais de uma vírgula, texto vazio ou outros caracteres. Nunca se arredonda em silêncio;
- o resultado precisa estar na faixa da seção 3.

### 11. Rastreabilidade da origem

Origem: `Meus-Investimentos` @ `1b13b033ce4335c09df80237c8c31b96b37e3797` (KB-001). As referências de linha vêm da leitura registrada na ideação do ciclo `003` (`_project/ideations/003_regras_financeiras.md`, "Na origem"), com as abreviações `ES` (`backend/app/services/event_sourcing_service.py`), `BS` (`backend/app/services/benchmark_service.py`), `CS` (`backend/app/services/consolidacao_service.py`), `CALC` (`backend/app/utils/calculadora.py`), `FR` (`backend/app/routers/fechamentos.py`) e `MIG` (o migrador histórico). Nenhum valor, teste ou fixture da origem foi copiado (G3).

| Regra (seção) | Evidência na origem | Destino | Por quê |
| :-- | :-- | :-- | :-- |
| Dinheiro em centavos (1, 3) | `Numeric(15,2)` com `quantize` meio-para-par (ES:52-55) | Corrigida | Centavos inteiros e exatos nas duas camadas (ADR-002, D11) |
| Precisão de índices (1) | `Numeric(15,6)` (`models/benchmark.py:26-41`) | Corrigida | Gravados como publicados, sem perda (D1) |
| Razões em `float64` (1) | Retornos e composições em `float` (CALC:59; BS:163-166, 408-416) | Mantida | Sem arredondar intermediários e com tolerância declarada (P3) |
| Percentual gravado (6) | `Numeric(5,2)`, que estoura com variação ≥ 1000% | Descartada | Nenhum percentual é gravado (D2) |
| Arredondamento de apresentação (2) | Meio-para-par implícito (ES:52-55) | Corrigida | 2 casas, meio-para-cima simétrico (P4, K10) |
| Tipos e sinais (4.2) | Sinal por texto livre da observação (ES:62-87, 114; MIG:276, 337) — O1 | Corrigida | Sinal no valor, com restrição por tipo (D4) |
| Estorno (4.3) | Valores diferentes no saldo e na rentabilidade (ES:80-84; BS:327-334) — O2 | Corrigida | Estorno total, igual ao referenciado (P5) |
| Transferência e trânsito (4.4) | Trânsito sem ativo, no patrimônio e fora do Dietz (ES:341, 402-412; BS:316-334) — O3 | Corrigida | Movimento interno de soma zero, trânsito como ativo (P6, D3, K6) |
| Migração histórica (4.5) | Meses migrados tratados como rendimento (MIG:398-400) — O12 | Corrigida | Rentabilidade `N/D` (P15); acumulado por K1 |
| Início e datas (4.6) | Sequência só exigida depois de algum mês fechado (FR:75-103) — O5 | Corrigida | Início no evento mais antigo e meses sequenciais (P8, K7); sem datas futuras (K13) |
| Pendências (5) | Fecha com o saldo calculado, sem conferir (FR:75-103) — O5 | Corrigida | Saldo real obrigatório (P7); trânsito sem saldo real (K12) |
| Ajuste (5) | Evento de ajuste com tipo deduzido por texto (ES:237-241) — O7 | Corrigida | Ajuste na posição, tipo por atributo do ativo (P9, D6) |
| Identidade contábil (5) | Não conferida (ES:295-378) — O11 | Corrigida | Conferida em todo fechamento (P10) |
| Reabertura (5) | Só recusada com mês posterior fechado, sem invalidar nada (FR:136-159) — O6 | Corrigida | Só o último mês, removendo posições, ajustes e consolidado (P8, D6) |
| Consolidação (6) | `valor_total` com trânsito (ES:341) e painel sem trânsito (CS:50-58) — O10 | Corrigida | Patrimônio sempre com o trânsito (D3) |
| Variação do patrimônio (7) | "Variação %" exibida pela origem | Mantida | Com nome inequívoco, ao lado da rentabilidade (P14) |
| Modified Dietz (7) | `R = (Vf − Vi − ΣF) / (Vi + Σ F·(D−d)/D)`, fluxo no fim do dia, `None` no aberto, primeiro mês e denominador ≤ 0 (CALC:36-59; BS:294-345) | Mantida | Mesma fórmula, na forma inteira com uma divisão (P11); Vi = 0 calculável (K5) |
| Acumulado e base 100 (8) | Encadeamento com base 100, sem o primeiro mês, truncado na lacuna (BS:387-419) — O4 | Corrigida | Primeiro mês com retorno entra (P12); `N/D` no período dá `N/D` (K1); início não é lacuna (K8) |
| Ano até a data (8) | Não existe | Nova | P13 |
| Drawdown (8) | Inclui o primeiro mês (BS:465-471) — O8 | Mantida | Mesma regra do acumulado (P12) |
| Dispersão (fora) | Tracking error populacional e information ratio amostral ×√12 (CALC:32-33, 90-106) — O8 | Descartada | Adiados (P16) |
| Série diária e mês parcial (9.3) | Mês corrente parcial composto como inteiro; linhas diárias sobrescrevendo a mensal (BS:143-174) — O9 | Corrigida | Uma periodicidade por série (D8) e mês parcial não comparado (K4) |
| Composição diária (9.3) | `∏(1 + v/100) − 1` (BS:143-239; CALC:62-122) | Mantida | Com completude da cobertura (K4) |
| Sincronização (9.2) | Upsert sob demanda, sem apagar | Corrigida | Carga atômica com cobertura, substituição da janela e janelas de 10 anos (D10, V2) |
| Comparação em p.p. (9.4) | Diferença em pontos percentuais | Mantida | Sobre os acumulados (P16) |
| % do benchmark (9.4) | Não existe | Nova | P16, com `N/D` quando o benchmark acumulado é ≤ 0 (K3) |
| Taxa de acerto (9.4) | Existe na origem (CALC:62-122) | Mantida | Empate não é acerto (K9) |
| Benchmark de valor absoluto (9.5) | Razão entre meses (BS:143-239) | Mantida, não implementada | D14 |
| Catálogo semeado (9.1) | Não existe; códigos 12 e 433 só nos testes | Nova | D9 |
| Parser de quantias (10) | Remove todo "." (`utils/normalizacao.py:56-57`) — O13 | Corrigida | Formato brasileiro estrito (K11) |

### 12. Destino dos defeitos O1 a O13

O1, O2, O3, O4, O5, O6, O7, O9, O10, O11, O12 e O13 foram corrigidos pelas regras indicadas na seção 11. O8 foi descartado neste ciclo (tracking error, information ratio e beta adiados); o drawdown mantém o primeiro mês, como o acumulado.

### 13. Escolhas de cálculo decididas pelo responsável

Levadas ao responsável em 2026-10-14, com as alternativas e os exemplos fictícios abaixo, na implementação da issue #26. K1 a K7 vêm do plano; K8 a K13 surgiram ao especificar as regras. Em todas, o responsável escolheu a recomendação.

| # | Questão | Alternativas e exemplo | Decisão (2026-10-14) |
| :-- | :-- | :-- | :-- |
| K1 | Acumulado e ano com um mês `N/D` no período | Retornos jan 1,00%, fev `N/D`, mar 2,00%, abr −0,50%. (a) `N/D`; (b) só depois do último `N/D`: 1,49%; (c) pulando o mês: 2,50% | (a) `N/D`, pela seção 6.5 do `DESIGN.md` |
| K2 | Estorno de evento de mês fechado | Aporte de R$ 1.000,00 em 20/jan (fechado), estornado em 05/fev; fev com 28 dias, Vi = R$ 11.000,00, Vf = R$ 10.050,00. (a) fluxo de −R$ 1.000,00 no dia 5: 0,4912%; (b) recusar e corrigir reabrindo janeiro | (a) fluxo no mês do estorno |
| K3 | "% do benchmark" com benchmark acumulado ≤ 0 | Carteira 1,20%, IPCA −0,32%: a razão daria −375%. (a) `N/D`; (b) exibir a razão | (a) `N/D`; a diferença em p.p. continua (+1,52 p.p.) |
| K4 | Completude do mês de série diária | CDI 0,04% ao dia, jan com 21 dias úteis: completo 0,8434%; carga iniciada no meio do mês, com 10 dias, 0,4007%; sem o último dia, 0,8030%. (a) cobertura começando no dia 1 ou antes e valor posterior ao fim do mês; (b) (a) mais calendário de dias úteis; (c) só um valor no mês seguinte | (a), com o limite declarado na seção 9.3 |
| K5 | Mês com Vi = 0 e aporte | Vi = 0, aporte de R$ 1.000,00 no dia 10 de mês de 30 dias, Vf = R$ 1.010,00. (a) Dietz normal: 1,50%; (b) `N/D` | (a) Dietz normal; só M ≤ 0 dá `N/D` |
| K6 | Correção de transferência | Saída de 10.000 centavos de X e entrada no trânsito. (a) só a transferência inteira; (b) cada perna sozinha, deixando +10.000 centavos sem explicação | (a) só como um todo |
| K7 | Início da carteira | Aporte de fevereiro e primeiro fechamento pedido para março. (a) o primeiro fechamento só no mês do evento mais antigo; (b) eventos anteriores viram saldo inicial (R$ 100,00) | (a) começar pelo evento mais antigo |
| K8 | Período que começa antes do primeiro mês com retorno | Início em fev (`N/D`), mar 1,00%, abr 2,00%. (a) o período começa no mês seguinte ao início: ano até abril 3,02%; (b) `N/D`. Esclarecimento: com início em jan, fev migrado (`N/D`) e mar 1,00%, (a) dá ano até março `N/D` (só o início deixa de ser lacuna) e a alternativa de pular qualquer `N/D` inicial daria 1,00% | (a) desde o mês seguinte ao início; um `N/D` posterior segue K1 |
| K9 | Empate na taxa de acerto | Carteira 0,90%, 0,70%, 0,80% contra benchmark 0,80% nos três meses. (a) só estritamente maior: 33,33%; (b) maior ou igual: 66,67% | (a) estritamente maior |
| K10 | Meio-para-cima em negativos | −0,125% com 2 casas. (a) −0,13%, afastando do zero; (b) −0,12%, em direção a +∞ | (a) simétrico |
| K11 | Parser de quantias | "1234.56", "1.234" e "12,345". (a) pt-BR estrito: recusado, 123.400 centavos e recusado; (b) heurístico: 123.456, 123.400 e 1.234.500 centavos | (a) pt-BR estrito |
| K12 | Trânsito no fechamento | (a) sem saldo real nem ajuste; diferenças lançadas no destino; (b) saldo real e ajuste como os demais | (a) sem saldo real nem ajuste |
| K13 | Datas futuras | Hoje 14/out: aporte de 20/out e fechamento de outubro. (a) recusar lançamento futuro e fechar só mês terminado; (b) permitir; (c) só recusar o fechamento | (a) recusar |

### 14. Casos de referência

Os casos usam só dados fictícios. Cada caso tem o mesmo identificador `CR-NN` e os mesmos valores esperados em `tests/fixtures/financeiro/casos_referencia.json`, que também traz as entradas completas. Um teste confere que cada valor esperado do JSON aparece aqui, idêntico, e vice-versa (D12). Convenções:

- quantias em centavos inteiros; razões como frações (0.01 = 1%), escritas com a representação decimal mais curta do `float64`;
- os valores esperados ficam na lista **Esperado**, um por linha, no formato `` `chave`: `valor` ``, e são sempre o último bloco do caso;
- `recusado_<motivo>` indica recusa sem gravação; `aceito`, uma operação aceita;
- a coluna "Entrega" indica a issue cujos testes executam o caso (B, C, D ou o ciclo `004`).

A conferência independente está em `_project/drafts/003_regras_financeiras/003_validation_casos_referencia.md`.

#### Eventos e saldos

#### CR-01 — Sinais por tipo de evento

- **Entrega:** B. **Regras:** 4.2 (D4).
- **Entrada:** tentativas de lançamento de um evento por tipo e valor: aporte +10.000 e −10.000; resgate −10.000 e +10.000; rendimento −500 e +500; marcação −300; câmbio +200; migração −100; rendimento 0.
- **Passo a passo:** aporte só positivo; resgate só negativo; rendimento, marcação, câmbio e migração com qualquer sinal; zero nunca.
- **Esperado:**
  - `aporte_positivo`: `aceito`
  - `aporte_negativo`: `recusado`
  - `resgate_negativo`: `aceito`
  - `resgate_positivo`: `recusado`
  - `rendimento_negativo`: `aceito`
  - `rendimento_positivo`: `aceito`
  - `marcacao_negativa`: `aceito`
  - `cambio_positivo`: `aceito`
  - `migracao_negativa`: `aceito`
  - `valor_zero`: `recusado`

#### CR-02 — Saldo calculado com todos os tipos

- **Entrega:** B. **Regras:** 4.2, 5.
- **Entrada:** março de 2026; ativo A com saldo inicial 0; aporte 1.000.000 (02/03), rendimento 12.345 (10/03), marcação −2.345 (15/03), câmbio 500 (20/03), resgate −200.000 (25/03); saldo real 810.500.
- **Passo a passo:** 0 + 1.000.000 + 12.345 − 2.345 + 500 − 200.000 = 810.500. O saldo real é igual ao calculado, então o ajuste é zero. Componentes por tipo, com o sinal do evento.
- **Esperado:**
  - `saldo_calculado_A`: `810500`
  - `aportes`: `1000000`
  - `resgates`: `-200000`
  - `rendimento`: `12345`
  - `marcacao`: `-2345`
  - `cambio`: `500`
  - `migracao`: `0`

#### CR-03 — Estorno total e suas recusas

- **Entrega:** B. **Regras:** 4.3 (P5).
- **Entrada:** março de 2026; A com saldo inicial 0; e1 aporte 500.000 (02/03); e2 aporte 100.000 (10/03); e3 estorno de e2 (12/03). Tentativas em 13/03: estorno de e2 informando −40.000; segundo estorno de e2; estorno de e3.
- **Passo a passo:** e3 vale −100.000, o oposto de e2. Saldo: 500.000 + 100.000 − 100.000 = 500.000. O estorno de um aporte entra no componente de aportes: 500.000 + 100.000 − 100.000 = 500.000. Estorno com valor informado, segundo estorno e estorno de estorno são recusados.
- **Esperado:**
  - `valor_e3`: `-100000`
  - `saldo_calculado_A`: `500000`
  - `aportes`: `500000`
  - `estorno_parcial`: `recusado`
  - `segundo_estorno`: `recusado`
  - `estorno_de_estorno`: `recusado`

#### CR-04 — Transferência pelo trânsito

- **Entrega:** B. **Regras:** 4.4 (P6, D3).
- **Entrada:** abril de 2026; A com 1.000.000, B com 0 e o trânsito T com 0. t1: A → T, 200.000, em 10/04. t2: T → B, 200.000, em 20/04. Tentativas: estornar só a perna de origem de t1; transferência de valor 0; transferência de A para A.
- **Passo a passo:** pernas de t1: A −200.000 e T +200.000 (soma 0). Pernas de t2: T −200.000 e B +200.000 (soma 0). Saldos: A 800.000, T 0, B 200.000; patrimônio 1.000.000, igual ao inicial. As três tentativas são recusadas.
- **Esperado:**
  - `saldo_calculado_A`: `800000`
  - `saldo_calculado_T`: `0`
  - `saldo_calculado_B`: `200000`
  - `patrimonio_calculado`: `1000000`
  - `soma_pernas_t1`: `0`
  - `soma_pernas_t2`: `0`
  - `estorno_perna_isolada`: `recusado`
  - `transferencia_valor_zero`: `recusado`
  - `transferencia_mesmo_ativo`: `recusado`

#### CR-05 — Correção de transferência como um todo (K6)

- **Entrega:** B. **Regras:** 4.4 (K6).
- **Entrada:** abril de 2026; A com 1.000.000, T com 0. t1: A → T, 10.000, em 05/04. c1: correção de t1 em 08/04. Tentativa: segunda correção de t1 em 09/04.
- **Passo a passo:** c1 estorna as duas pernas: A recebe +10.000 e T, −10.000 (soma 0). Saldos: A 1.000.000 − 10.000 + 10.000 = 1.000.000; T 10.000 − 10.000 = 0. A segunda correção é recusada.
- **Esperado:**
  - `estorno_perna_origem`: `10000`
  - `estorno_perna_destino`: `-10000`
  - `saldo_calculado_A`: `1000000`
  - `saldo_calculado_T`: `0`
  - `soma_pernas_c1`: `0`
  - `segunda_correcao`: `recusado`

#### CR-06 — Datas de lançamento e início da carteira (K7, K13)

- **Entrega:** B. **Regras:** 4.6, 5 (P8, K7, K13).
- **Entrada:** hoje 14/10/2026; um ativo A; passos em ordem:
  - s01: fechar janeiro de 2026 com a carteira sem eventos;
  - s02: aporte de 10.000 em 10/02;
  - s03: fechar março, com saldo real de A 10.000;
  - s04: fechar fevereiro, com saldo real de A 10.000;
  - s05: aporte em 15/01; s06: aporte em 20/02; s07: aporte em 05/03;
  - s08: aporte em 15/10; s09: aporte em 14/10;
  - s10: reabrir fevereiro;
  - s11: aporte de 5.000 em 15/01;
  - s12: fechar fevereiro, com saldo real 15.000;
  - s13: fechar janeiro, com saldo real 5.000.
- **Passo a passo:** s01 não tem evento para definir o início. s03 não é o mês do evento mais antigo (fevereiro); s04 é. Depois disso, o primeiro mês aberto é março: s05 e s06 caem antes dele. s08 é futuro; s09 é hoje. Reabrir o primeiro mês (s10) volta ao estado sem mês fechado, então s11 é aceito. O evento mais antigo agora é de janeiro: s12 é recusado, e s13, com saldo calculado 5.000, é aceito.
- **Esperado:**
  - `s01`: `recusado`
  - `s02`: `aceito`
  - `s03`: `recusado`
  - `s04`: `aceito`
  - `s05`: `recusado`
  - `s06`: `recusado`
  - `s07`: `aceito`
  - `s08`: `recusado`
  - `s09`: `aceito`
  - `s10`: `aceito`
  - `s11`: `aceito`
  - `s12`: `recusado`
  - `s13`: `aceito`

#### Faixa monetária

#### CR-07 — Soma exata acima de 2⁵³ em intermediário

- **Entrega:** B. **Regras:** 3 (D11).
- **Entrada:** março de 2026; A com saldo inicial 0; aporte 9.007.199.254.740.991 (02/03); rendimento +2 (03/03); rendimento −2 (04/03).
- **Passo a passo:** o subtotal 9.007.199.254.740.993 não é representável em `float64` (viraria 9.007.199.254.740.992), mas é exato em `bigint` e `numeric`. Depois de −2, o saldo volta a 9.007.199.254.740.991, dentro da faixa.
- **Esperado:**
  - `saldo_calculado_A`: `9007199254740991`

#### CR-08 — Cancelamento com subtotal acima de 64 bits

- **Entrega:** B. **Regras:** 3, 5 (D11).
- **Entrada:** março de 2026; A (ajuste `rendimento`) com saldo inicial 0; 1.025 rendimentos de +9.007.199.254.740.991 em 02/03 e 1.025 de −9.007.199.254.740.991 em 03/03; saldo real 100.
- **Passo a passo:** somando os positivos primeiro, o subtotal chega a 1.025 × 9.007.199.254.740.991 = 9.232.379.236.109.515.775, acima de 2⁶³ − 1 = 9.223.372.036.854.775.807. Os negativos o levam a 0. Ajuste = 100 − 0 = 100, do tipo rendimento. Componente rendimento = 0 + 100 = 100. Vi = 0, Vf = 100; identidade: 100 = 100.
- **Esperado:**
  - `saldo_calculado_A`: `0`
  - `ajuste_A`: `100`
  - `saldo_final_A`: `100`
  - `rendimento`: `100`
  - `vi`: `0`
  - `vf`: `100`

#### CR-09 — Saldo calculado fora da faixa

- **Entrega:** B. **Regras:** 3.
- **Entrada:** março de 2026; A com saldo inicial 9.007.199.254.740.991; aporte 1 (02/03); saldo real 9.007.199.254.740.991.
- **Passo a passo:** saldo calculado 9.007.199.254.740.992, fora da faixa. A prévia o devolveria e o fechamento dependeria dele: os dois recusam, sem gravar.
- **Esperado:**
  - `previa`: `recusado_faixa`
  - `fechamento`: `recusado_faixa`

#### CR-10 — Ajuste entre saldos de sinais opostos fora da faixa

- **Entrega:** B. **Regras:** 3.
- **Entrada:** março de 2026; A com saldo inicial 0; resgate −9.007.199.254.740.991 (02/03); saldo real +9.007.199.254.740.991.
- **Passo a passo:** saldo calculado −9.007.199.254.740.991 (dentro da faixa). Ajuste = 9.007.199.254.740.991 − (−9.007.199.254.740.991) = 18.014.398.509.481.982, fora da faixa: recusa.
- **Esperado:**
  - `saldo_calculado_A`: `-9007199254740991`
  - `previa`: `recusado_faixa`
  - `fechamento`: `recusado_faixa`

#### CR-11 — Consolidado fora da faixa

- **Entrega:** B. **Regras:** 3, 6.
- **Entrada:** março de 2026; A e B com saldo inicial 0; um aporte de 9.007.199.254.740.991 em cada (02/03); saldos reais iguais aos calculados.
- **Passo a passo:** cada saldo está no limite, mas Vf = 2 × 9.007.199.254.740.991 = 18.014.398.509.481.982 e o componente de aportes também excedem a faixa: recusa.
- **Esperado:**
  - `saldo_calculado_A`: `9007199254740991`
  - `saldo_calculado_B`: `9007199254740991`
  - `previa`: `recusado_faixa`
  - `fechamento`: `recusado_faixa`

#### Fechamento

#### CR-12 — Fechamento com ajuste positivo e negativo

- **Entrega:** B. **Regras:** 5, 6 (P7, P9, P10, D6).
- **Entrada:** março de 2026; A (ajuste `rendimento`) com saldo inicial 1.000.000 e B (ajuste `marcacao`) com 500.000; aporte de 10.000 em A (10/03); saldos reais A 1.015.000 e B 480.000.
- **Passo a passo:**
  - A: calculado 1.000.000 + 10.000 = 1.010.000; ajuste 1.015.000 − 1.010.000 = +5.000, rendimento.
  - B: calculado 500.000; ajuste 480.000 − 500.000 = −20.000, marcação.
  - Vi = 1.000.000 + 500.000 = 1.500.000; Vf = 1.015.000 + 480.000 = 1.495.000.
  - Identidade: Vf − Vi = −5.000; aportes 10.000 + rendimento 5.000 + marcação −20.000 = −5.000. Fecha.
- **Esperado:**
  - `saldo_calculado_A`: `1010000`
  - `saldo_calculado_B`: `500000`
  - `ajuste_A`: `5000`
  - `tipo_ajuste_A`: `rendimento`
  - `ajuste_B`: `-20000`
  - `tipo_ajuste_B`: `marcacao`
  - `vi`: `1500000`
  - `vf`: `1495000`
  - `aportes`: `10000`
  - `resgates`: `0`
  - `rendimento`: `5000`
  - `marcacao`: `-20000`
  - `cambio`: `0`
  - `migracao`: `0`
  - `identidade`: `ok`

#### CR-13 — Fechamento recusado por pendência

- **Entrega:** B. **Regras:** 5 (P7, K12).
- **Entrada:** março de 2026; A com 100.000, B com 50.000 e o trânsito T com 0; nenhum evento; só o saldo real de A informado.
- **Passo a passo:** B não tem saldo real; T nunca é pendência. Recusa com a lista de pendentes.
- **Esperado:**
  - `fechamento`: `recusado_pendencia`
  - `pendentes`: `["B"]`

#### CR-14 — Conferência da identidade contábil

- **Entrega:** B. **Regras:** 5 (P10).
- **Entrada:** Vi = 1.000.000 e Vf = 1.110.000 nas duas conferências; aportes 100.000; rendimento 10.000 na conferência a e 9.999 na b; demais componentes 0.
- **Passo a passo:** Vf − Vi = 110.000. Em a, 100.000 + 10.000 = 110.000: fecha. Em b, 100.000 + 9.999 = 109.999 ≠ 110.000: recusa.
- **Esperado:**
  - `identidade_a`: `ok`
  - `identidade_b`: `recusado_identidade`

#### CR-15 — Sequência de fechamento e reabertura só do último mês

- **Entrega:** B. **Regras:** 5 (P8).
- **Entrada:** hoje 14/10/2026; janeiro e fevereiro de 2026 fechados; os saldos reais de todos os ativos são informados quando um fechamento os exige. Passos: s1 fechar abril; s2 reabrir janeiro; s3 fechar março; s4 reabrir fevereiro; s5 reabrir março.
- **Passo a passo:** o próximo mês a fechar é março, então s1 é recusado. Fevereiro é o último fechado, então s2 é recusado. Depois de s3, o último fechado é março: s4 é recusado e s5 é aceito.
- **Esperado:**
  - `s1`: `recusado_sequencia`
  - `s2`: `recusado_reabertura`
  - `s3`: `aceito`
  - `s4`: `recusado_reabertura`
  - `s5`: `aceito`

#### CR-16 — Reabertura volta ao estado anterior ao fechamento

- **Entrega:** B. **Regras:** 5 (P8, D6).
- **Entrada:** o estado final do CR-12, com março fechado e sem mês posterior fechado. Passos: reabrir março; fechar março de novo com os mesmos saldos reais.
- **Passo a passo:** a reabertura remove as duas posições, os ajustes e o consolidado; os saldos calculados voltam a 1.010.000 e 500.000, e a rentabilidade de março é `N/D` (mês aberto). O novo fechamento repete o CR-12.
- **Esperado:**
  - `estado_apos_reabrir`: `aberto`
  - `posicoes_apos_reabrir`: `0`
  - `consolidado_apos_reabrir`: `inexistente`
  - `saldo_calculado_A_apos_reabrir`: `1010000`
  - `saldo_calculado_B_apos_reabrir`: `500000`
  - `retorno_apos_reabrir`: `N/D`
  - `vf_apos_fechar_de_novo`: `1495000`

#### CR-17 — Trânsito no fechamento e no patrimônio (K12)

- **Entrega:** B. **Regras:** 4.4, 5, 6 (D3, K12, P7).
- **Entrada:** abril de 2026; A (ajuste `rendimento`) com 1.000.000 e o trânsito T com 0; t1: A → T, 200.000, em 10/04; saldo real de A 805.000; nenhum saldo real para T.
- **Passo a passo:** sem pendências (T não é pendência). A: calculado 800.000, ajuste +5.000. T: saldo final 200.000, ajuste 0. Vi = 1.000.000; Vf = 805.000 + 200.000 = 1.005.000, com o trânsito. Identidade: 5.000 = rendimento 5.000; as pernas somam zero.
- **Esperado:**
  - `pendentes`: `[]`
  - `ajuste_A`: `5000`
  - `saldo_final_T`: `200000`
  - `ajuste_T`: `0`
  - `vi`: `1000000`
  - `vf`: `1005000`
  - `rendimento`: `5000`
  - `aportes`: `0`
  - `resgates`: `0`
  - `identidade`: `ok`

#### CR-18 — Mês só fecha depois de terminar (K13)

- **Entrega:** B. **Regras:** 5 (K13).
- **Entrada:** setembro de 2026 é o último mês fechado; fechar outubro com hoje em 14/10 (s1), 31/10 (s2) e 01/11 (s3).
- **Passo a passo:** outubro termina depois de 31/10. Em 14/10 e em 31/10 ainda não terminou; em 01/11, sim.
- **Esperado:**
  - `s1`: `recusado_mes_nao_terminado`
  - `s2`: `recusado_mes_nao_terminado`
  - `s3`: `aceito`

#### Rentabilidade

Nos casos de rentabilidade, Vi e Vf vêm do consolidado do mês fechado, e os eventos são os da carteira no mês.

#### CR-20 — Modified Dietz com aporte no meio do mês (P11, P14)

- **Entrega:** C. **Regras:** 7.
- **Entrada:** abril de 2026, fechado; Vi = 1.000.000; aporte 100.000 em 15/04; Vf = 1.110.000.
- **Passo a passo:** D = 30. N = 30 × (1.110.000 − 1.000.000 − 100.000) = 30 × 10.000 = 300.000. M = 30 × 1.000.000 + 100.000 × (30 − 15) = 30.000.000 + 1.500.000 = 31.500.000. R = 300.000 / 31.500.000 = 1/105 ≈ 0,9524%. Variação = 110.000 / 1.000.000 = 11,00%.
- **Esperado:**
  - `dias`: `30`
  - `numerador`: `300000`
  - `denominador`: `31500000`
  - `retorno`: `0.009523809523809525`
  - `variacao`: `0.11`

#### CR-21 — Fevereiro de ano bissexto

- **Entrega:** C. **Regras:** 1, 7.
- **Entrada:** fevereiro de 2028, fechado; Vi = 1.000.000; aporte 100.000 em 10/02; Vf = 1.120.000.
- **Passo a passo:** 2028 é bissexto: D = 29. N = 29 × (1.120.000 − 1.000.000 − 100.000) = 29 × 20.000 = 580.000. M = 29 × 1.000.000 + 100.000 × (29 − 10) = 29.000.000 + 1.900.000 = 30.900.000. R = 580.000 / 30.900.000 = 29/1.545 ≈ 1,8770%.
- **Esperado:**
  - `dias`: `29`
  - `numerador`: `580000`
  - `denominador`: `30900000`
  - `retorno`: `0.018770226537216828`

#### CR-22 — Aporte no primeiro dia e resgate no último

- **Entrega:** C. **Regras:** 7.
- **Entrada:** junho de 2026, fechado; Vi = 1.000.000; aporte 50.000 em 01/06; resgate −200.000 em 30/06; Vf = 860.000.
- **Passo a passo:** D = 30; ΣF = 50.000 − 200.000 = −150.000. N = 30 × (860.000 − 1.000.000 + 150.000) = 30 × 10.000 = 300.000. M = 30.000.000 + 50.000 × 29 + (−200.000) × 0 = 31.450.000; o fluxo do último dia tem peso zero. R = 300.000 / 31.450.000 = 6/629 ≈ 0,9539%.
- **Esperado:**
  - `dias`: `30`
  - `numerador`: `300000`
  - `denominador`: `31450000`
  - `retorno`: `0.009538950715421303`

#### CR-23 — Estorno de aporte no mesmo mês

- **Entrega:** C. **Regras:** 4.3, 7 (P5).
- **Entrada:** junho de 2026, fechado; Vi = 1.000.000; e1 aporte 100.000 em 05/06; e2 estorno de e1 em 25/06; Vf = 1.010.000.
- **Passo a passo:** fluxos +100.000 no dia 5 e −100.000 no dia 25; ΣF = 0. N = 30 × (1.010.000 − 1.000.000 − 0) = 300.000. M = 30.000.000 + 100.000 × 25 − 100.000 × 5 = 32.000.000. R = 300.000 / 32.000.000 = 0,9375%.
- **Esperado:**
  - `numerador`: `300000`
  - `denominador`: `32000000`
  - `retorno`: `0.009375`

#### CR-24 — Estorno de aporte de mês já fechado (K2)

- **Entrega:** C. **Regras:** 4.3, 7 (K2).
- **Entrada:** fevereiro de 2026, fechado; Vi = 1.100.000; estorno, em 05/02, do aporte de 100.000 de 20/01 (janeiro fechado); Vf = 1.005.000.
- **Passo a passo:** D = 28; o estorno é fluxo de −100.000 no dia 5. N = 28 × (1.005.000 − 1.100.000 + 100.000) = 28 × 5.000 = 140.000. M = 28 × 1.100.000 + (−100.000) × 23 = 30.800.000 − 2.300.000 = 28.500.000. R = 140.000 / 28.500.000 = 14/1.425 ≈ 0,4912%.
- **Esperado:**
  - `dias`: `28`
  - `numerador`: `140000`
  - `denominador`: `28500000`
  - `retorno`: `0.004912280701754386`

#### CR-25 — Mês com Vi = 0 e aporte (K5)

- **Entrega:** C. **Regras:** 7 (K5).
- **Entrada:** junho de 2026, fechado, que não é o início; Vi = 0; aporte 100.000 em 10/06; Vf = 101.000.
- **Passo a passo:** N = 30 × (101.000 − 0 − 100.000) = 30.000. M = 0 + 100.000 × 20 = 2.000.000 > 0. R = 30.000 / 2.000.000 = 1,50%. A variação é `N/D` porque Vi = 0.
- **Esperado:**
  - `numerador`: `30000`
  - `denominador`: `2000000`
  - `retorno`: `0.015`
  - `variacao`: `N/D`

#### CR-26 — Denominador menor ou igual a zero

- **Entrega:** C. **Regras:** 7.
- **Entrada:** dois meses de junho de 2026, fechados. (a) Vi = 100.000; rendimento 20.000 e resgate −120.000, ambos em 01/06; Vf = 0. (b) Vi = 0, sem eventos, Vf = 0.
- **Passo a passo:** (a) M = 30 × 100.000 + (−120.000) × 29 = 3.000.000 − 3.480.000 = −480.000 ≤ 0: `N/D`. Variação = (0 − 100.000) / 100.000 = −100%. (b) M = 0: `N/D`; Vi = 0 torna a variação `N/D`.
- **Esperado:**
  - `denominador_a`: `-480000`
  - `retorno_a`: `N/D`
  - `variacao_a`: `-1`
  - `denominador_b`: `0`
  - `retorno_b`: `N/D`
  - `variacao_b`: `N/D`

#### CR-27 — Denominador pequeno com cancelamento

- **Entrega:** C. **Regras:** 7 (D11; caso da rodada 2 da revisão do plano).
- **Entrada:** junho de 2026, fechado; Vi = 999.979; resgate −1.034.461 em 01/06; aporte 34.482 e rendimento 1 em 30/06; Vf = 1.
- **Passo a passo:** ΣF = −1.034.461 + 34.482 = −999.979. N = 30 × (1 − 999.979 + 999.979) = 30. M = 30 × 999.979 + (−1.034.461) × 29 + 34.482 × 0 = 29.999.370 − 29.999.369 = 1. R = 30 / 1 = 30, isto é, 3.000%. Com pesos fracionários em `float64`, o denominador perderia a exatidão; na forma inteira, é exato.
- **Esperado:**
  - `numerador`: `30`
  - `denominador`: `1`
  - `retorno`: `30`

#### CR-28 — Transferência não altera a rentabilidade (P6)

- **Entrega:** C. **Regras:** 4.4, 7 (P6, D3).
- **Entrada:** abril de 2026, fechado (o mês do CR-17); Vi = 1.000.000; transferência de 200.000 de A para o trânsito em 10/04; Vf = 1.005.000.
- **Passo a passo:** a transferência não é fluxo: ΣF = 0. N = 30 × 5.000 = 150.000; M = 30 × 1.000.000 = 30.000.000. R = 0,50%. Variação = 5.000 / 1.000.000 = 0,50%.
- **Esperado:**
  - `numerador`: `150000`
  - `denominador`: `30000000`
  - `retorno`: `0.005`
  - `variacao`: `0.005`

#### CR-29 — Mês com migração histórica (P15)

- **Entrega:** C. **Regras:** 4.5, 7 (P15).
- **Entrada:** junho de 2026, fechado; Vi = 1.000.000; migração histórica de +110.000 em 01/06; Vf = 1.110.000.
- **Passo a passo:** há evento de migração no mês: rentabilidade `N/D`. A variação continua calculável: 110.000 / 1.000.000 = 11,00%.
- **Esperado:**
  - `retorno`: `N/D`
  - `variacao`: `0.11`

#### CR-30 — Primeiro mês e mês aberto

- **Entrega:** C. **Regras:** 7 (P8).
- **Entrada:** janeiro de 2026, fechado e início da carteira, com Vi = 0, aporte de 100.000 em 02/01 e Vf = 100.000; fevereiro de 2026, aberto.
- **Passo a passo:** o início não tem mês anterior: rentabilidade `N/D`; Vi = 0 torna a variação `N/D`. O mês aberto não tem consolidado: os dois são `N/D`.
- **Esperado:**
  - `retorno_primeiro`: `N/D`
  - `variacao_primeiro`: `N/D`
  - `retorno_aberto`: `N/D`
  - `variacao_aberto`: `N/D`

#### CR-31 — Rentabilidade negativa com ajustes (mês do CR-12)

- **Entrega:** C. **Regras:** 7.
- **Entrada:** março de 2026, fechado; Vi = 1.500.000; aporte de 10.000 em 10/03; Vf = 1.495.000.
- **Passo a passo:** D = 31. N = 31 × (1.495.000 − 1.500.000 − 10.000) = 31 × (−15.000) = −465.000. M = 31 × 1.500.000 + 10.000 × 21 = 46.500.000 + 210.000 = 46.710.000. R = −465.000 / 46.710.000 ≈ −0,9955%. Variação = −5.000 / 1.500.000 = −1/300 ≈ −0,33%.
- **Esperado:**
  - `dias`: `31`
  - `numerador`: `-465000`
  - `denominador`: `46710000`
  - `retorno`: `-0.00995504174694926`
  - `variacao`: `-0.0033333333333333335`

#### Acumulado, ano e drawdown

#### CR-32 — Acumulado e ano até a data (P12, P13)

- **Entrega:** C. **Regras:** 8.
- **Entrada:** início da carteira em dezembro de 2025; retornos jan/2026 1,00%, fev 2,00%, mar −0,50%.
- **Passo a passo:** desde o início até março: a' = janeiro; 1,01 × 1,02 × 0,995 − 1 = 1,025049 − 1 = 2,5049%. O ano até março é o mesmo período. O ano até janeiro é 1,00%.
- **Esperado:**
  - `acumulado_desde_inicio_ate_2026_03`: `0.025049`
  - `ano_ate_2026_03`: `0.025049`
  - `ano_ate_2026_01`: `0.01`

#### CR-33 — Mês N/D no período (K1)

- **Entrega:** C. **Regras:** 8 (K1).
- **Entrada:** início em dezembro de 2025; retornos jan/2026 1,00%, fev `N/D`, mar 2,00%, abr −0,50%. Consultas: desde o início até abril; ano até abril; ano até janeiro; março a abril.
- **Passo a passo:** o acumulado até abril e o ano até abril incluem fevereiro: `N/D`. O ano até janeiro não o inclui: 1,00%. Março a abril começa depois do `N/D`: 1,02 × 0,995 − 1 = 1,49%.
- **Esperado:**
  - `acumulado_ate_2026_04`: `N/D`
  - `ano_ate_2026_04`: `N/D`
  - `ano_ate_2026_01`: `0.01`
  - `periodo_2026_03_a_2026_04`: `0.0149`

#### CR-34 — Período que começa antes do início da carteira (K8)

- **Entrega:** C. **Regras:** 8 (K8).
- **Entrada:** início em fevereiro de 2026 (`N/D`); retornos mar 1,00% e abr 2,00%. Consultas: ano até abril; desde o início até abril; ano até fevereiro.
- **Passo a passo:** o período efetivo começa em março, o mês seguinte ao início. Ano até abril e desde o início: 1,01 × 1,02 − 1 = 3,02%. Ano até fevereiro: a' = março > fevereiro, sem mês com retorno: `N/D`.
- **Esperado:**
  - `ano_ate_2026_04`: `0.0302`
  - `desde_inicio_ate_2026_04`: `0.0302`
  - `ano_ate_2026_02`: `N/D`

#### CR-35 — Mês N/D logo depois do início (K8 e K1)

- **Entrega:** C. **Regras:** 8 (K8, K1).
- **Entrada:** início em janeiro de 2026 (`N/D`); fevereiro `N/D` (mês migrado); março 1,00%. Consultas: ano até março; só março.
- **Passo a passo:** o período efetivo do ano começa em fevereiro, que é `N/D`: K1 torna o ano `N/D`. O período só de março vale 1,00%.
- **Esperado:**
  - `ano_ate_2026_03`: `N/D`
  - `periodo_2026_03`: `0.01`

#### CR-36 — Série base 100 e drawdown

- **Entrega:** C. **Regras:** 8.
- **Entrada:** início em dezembro de 2025; retornos jan/2026 +10%, fev −20%, mar +5%, abr −10%; período janeiro a abril.
- **Passo a passo:** base 100: 100 × 1,10 = 110; 110 × 0,80 = 88; 88 × 1,05 = 92,4; 92,4 × 0,90 = 83,16. Pico 110. Quedas: 88/110 − 1 = −20%; 92,4/110 − 1 = −16%; 83,16/110 − 1 = −24,4%. Drawdown máximo −24,4%. Acumulado 83,16/100 − 1 = −16,84%.
- **Esperado:**
  - `base100_2026_01`: `110`
  - `base100_2026_02`: `88`
  - `base100_2026_03`: `92.4`
  - `base100_2026_04`: `83.16`
  - `acumulado`: `-0.1684`
  - `drawdown_maximo`: `-0.244`

#### CR-37 — Drawdown com o primeiro mês negativo e com N/D

- **Entrega:** C. **Regras:** 8 (P12, K1).
- **Entrada:** início em dezembro de 2025. (a) jan/2026 −5%, fev +2%. (b) jan −5%, fev `N/D`. Período janeiro a fevereiro.
- **Passo a passo:** (a) base 100: 95; 95 × 1,02 = 96,9. O pico inicial 100 conta: drawdown máximo 95/100 − 1 = −5%. (b) fevereiro `N/D`: drawdown `N/D`.
- **Esperado:**
  - `base100_a_2026_02`: `96.9`
  - `drawdown_maximo_a`: `-0.05`
  - `drawdown_maximo_b`: `N/D`

#### Apresentação

#### CR-38 — Arredondamento de apresentação (P4, K10)

- **Entrega:** C. **Regras:** 2 (P4, K10).
- **Entrada:** percentuais, dados como frações: p01 0.00125; p02 0.01005; p03 −0.00125; p04 0.009523809523809525; p05 0.025049; p06 −0.00004; p07 0.00005; p08 1e-7; p09 30; p10 1.125; p11 0.0009999999999999992. Índices (sem deslocamento): i01 92.4; i02 100.005; i03 83.16.
- **Passo a passo:** representação decimal mais curta, vírgula deslocada duas casas nos percentuais, 2 casas meio-para-cima simétrico:
  - p01 0,125 → 0,13; p02 1,005 → 1,01 (o `float64` de 0,01005 fica abaixo dele, mas a representação mais curta é 0.01005); p03 −0,125 → −0,13 (K10);
  - p04 0,9523… → 0,95; p05 2,5049 → 2,50; p06 −0,004 → zero, sem sinal; p07 0,005 → 0,01; p08 0,00001 → 0,00 (a representação `1e-7` é expandida); p09 3000 → 3.000,00; p10 112,5 → 112,50;
  - p11 0,09999999999999992 → 0,10 (a diferença 0,009 − 0,008 em `float64`, apresentada em p.p.);
  - i01 92,4 → 92,40; i02 100,005 → 100,01; i03 83,16 → 83,16.
- **Esperado:**
  - `p01`: `0,13`
  - `p02`: `1,01`
  - `p03`: `−0,13`
  - `p04`: `0,95`
  - `p05`: `2,50`
  - `p06`: `0,00`
  - `p07`: `0,01`
  - `p08`: `0,00`
  - `p09`: `3.000,00`
  - `p10`: `112,50`
  - `p11`: `0,10`
  - `i01`: `92,40`
  - `i02`: `100,01`
  - `i03`: `83,16`

#### Benchmarks

Nos casos de série diária, os valores são fictícios, de 0,04% ao dia, em dias de semana de 2026, sem o feriado de 01/01; as datas completas estão no JSON.

#### CR-40 — Composição de série diária em mês completo (P16, K4)

- **Entrega:** D. **Regras:** 9.3 (K4).
- **Entrada:** série diária; cobertura de 01/12/2025 a 02/02/2026; 21 valores de 0,04 em janeiro de 2026 e um em 02/02.
- **Passo a passo:** a cobertura começa antes de 01/01 e tem valor posterior a 31/01: completo. Retorno = 1,0004²¹ − 1 ≈ 0,8434%.
- **Esperado:**
  - `dias_com_valor`: `21`
  - `completo`: `true`
  - `retorno`: `0.008433685273424597`

#### CR-41 — Carga iniciada no meio do mês (K4)

- **Entrega:** D. **Regras:** 9.3 (K4).
- **Entrada:** série diária; cobertura de 19/01/2026 a 02/03/2026; 10 valores em janeiro (a partir de 19/01), 20 em fevereiro e um em 02/03. Meses consultados: dezembro de 2025, janeiro e fevereiro de 2026.
- **Passo a passo:** dezembro está fora da cobertura e janeiro começa antes dela: os dois são parciais, `N/D`, mesmo havendo mês seguinte completo. Fevereiro: cobertura desde antes de 01/02 e valor em 02/03, completo; 1,0004²⁰ − 1 ≈ 0,8030%.
- **Esperado:**
  - `completo_2025_12`: `false`
  - `retorno_2025_12`: `N/D`
  - `completo_2026_01`: `false`
  - `retorno_2026_01`: `N/D`
  - `completo_2026_02`: `true`
  - `retorno_2026_02`: `0.00803047308419092`

#### CR-42 — Último dia do mês ainda não publicado (K4)

- **Entrega:** D. **Regras:** 9.3 (K4).
- **Entrada:** série diária; cobertura de 01/12/2025 a 29/01/2026; 20 valores em janeiro, sem o de 30/01.
- **Passo a passo:** não há valor posterior a 31/01: janeiro é parcial, `N/D`, e não vira zero nem o retorno de 20 dias.
- **Esperado:**
  - `dias_com_valor`: `20`
  - `completo`: `false`
  - `retorno`: `N/D`

#### CR-43 — Série mensal e acumulado do benchmark

- **Entrega:** D. **Regras:** 9.1, 9.3 (D8).
- **Entrada:** série mensal; valores "0.33" em 01/01/2026 e "-0.10" em 01/02/2026; nenhum em março.
- **Passo a passo:** janeiro 0,33/100 = 0,33%; fevereiro −0,10%; março sem valor, `N/D`. Acumulado de janeiro a fevereiro: 1,0033 × 0,999 − 1 = 1,0022967 − 1 = 0,22967%. Janeiro a março inclui `N/D`.
- **Esperado:**
  - `retorno_2026_01`: `0.0033`
  - `retorno_2026_02`: `-0.001`
  - `retorno_2026_03`: `N/D`
  - `acumulado_2026_01_a_2026_02`: `0.0022967`
  - `acumulado_2026_01_a_2026_03`: `N/D`

#### CR-44 — Comparação em p.p. e em % do benchmark (P16)

- **Entrega:** D. **Regras:** 9.4.
- **Entrada:** (a) janeiro: carteira 0,90%, benchmark 0,80%. (b) janeiro e fevereiro: carteira 1,00% e 2,00%, benchmark 0,80% nos dois.
- **Passo a passo:** (a) diferença 0,009 − 0,008 = 0,001 (+0,10 p.p.); percentual 0,009 / 0,008 = 112,5%. (b) acumulados: carteira 1,01 × 1,02 − 1 = 3,02%; benchmark 1,008² − 1 = 1,6064%; diferença 0,014136 (+1,41 p.p.); percentual 0,0302 / 0,016064 ≈ 187,998%, sobre os acumulados e não sobre a média dos meses.
- **Esperado:**
  - `diferenca_a`: `0.001`
  - `percentual_a`: `1.125`
  - `carteira_acumulada_b`: `0.0302`
  - `benchmark_acumulado_b`: `0.016064`
  - `diferenca_b`: `0.014136`
  - `percentual_b`: `1.879980079681275`

#### CR-45 — Benchmark acumulado menor ou igual a zero (K3)

- **Entrega:** D. **Regras:** 9.4 (K3).
- **Entrada:** janeiro, carteira 1,20%; benchmark (a) −0,32% e (b) 0%.
- **Passo a passo:** (a) diferença 0,012 − (−0,0032) = 0,0152 (+1,52 p.p.); percentual `N/D`, porque o benchmark é ≤ 0. (b) diferença 0,012; percentual `N/D`.
- **Esperado:**
  - `diferenca_a`: `0.0152`
  - `percentual_a`: `N/D`
  - `diferenca_b`: `0.012`
  - `percentual_b`: `N/D`

#### CR-46 — Taxa de acerto (K9)

- **Entrega:** D. **Regras:** 9.4 (K9, K1).
- **Entrada:** (a) carteira 0,90%, 0,70% e 0,80% em jan, fev e mar; benchmark 0,80% nos três. (b) carteira 0,90% e `N/D`; benchmark 0,80% nos dois.
- **Passo a passo:** (a) janeiro é acerto; fevereiro não; março é empate e não conta: 1 de 3. (b) há mês `N/D`: taxa `N/D`.
- **Esperado:**
  - `acertos_a`: `1`
  - `meses_a`: `3`
  - `taxa_a`: `0.3333333333333333`
  - `taxa_b`: `N/D`

#### CR-47 — Comparação com mês parcial do benchmark

- **Entrega:** D. **Regras:** 9.3, 9.4 (P16, K4, K1).
- **Entrada:** janeiro e fevereiro; carteira 1,00% e 2,00%; benchmark 0,80% em janeiro e parcial em fevereiro.
- **Passo a passo:** o mês parcial não é comparado; como está no período, as três medidas são `N/D`.
- **Esperado:**
  - `diferenca_a`: `N/D`
  - `percentual_a`: `N/D`
  - `taxa_a`: `N/D`

#### CR-48 — Cobertura da carga (K4, D10)

- **Entrega:** D. **Regras:** 9.2 (K4, D10).
- **Entrada:** cobertura de 01/12/2025 a 30/01/2026. Cargas em ordem: s1 de 01/03 a 31/03/2026, último valor 31/03; s2 de 31/01 a 28/02/2026, último valor 27/02; s3 de 01/11 a 30/11/2025, último valor 28/11; s4 de 28/02 a 31/03/2026, sem nenhum valor devolvido.
- **Passo a passo:**
  - s1: 01/03 > 30/01 + 1 dia: deixaria fevereiro sem cobertura, recusada.
  - s2: 31/01 ≤ 31/01: contínua; a cobertura vai até o último valor gravado, 27/02.
  - s3: 30/11/2025 ≥ 01/12/2025 − 1 dia: contínua; o início passa a 01/11/2025. Os dias 29 e 30/11 estão dentro da janela pedida e não têm valor: são dias sem taxa da fonte. O fim continua 27/02/2026.
  - s4: contínua (28/02 ≤ 27/02 + 1 dia), mas sem valores: recusada, nada gravado.
- **Esperado:**
  - `s1`: `recusado_buraco`
  - `s2`: `aceito`
  - `cobertura_apos_s2`: `2025-12-01/2026-02-27`
  - `s3`: `aceito`
  - `cobertura_apos_s3`: `2025-11-01/2026-02-27`
  - `s4`: `recusado_sem_valores`

#### Parser de quantias

#### CR-50 — Parser de quantias (O13, K11)

- **Entrega:** ciclo `004`. **Regras:** 10 (K11, D11).
- **Entrada:** q01 "1.234,56"; q02 "1234,56"; q03 "1.234"; q04 "0,5"; q05 "-10,00"; q06 "−10,00" (U+2212); q07 "1.234.567,89"; q08 "1234.56"; q09 "12,345"; q10 "1.23,45"; q11 "12.34"; q12 "" (vazio); q13 "1,2,3"; q14 "90.071.992.547.409,91"; q15 "90.071.992.547.409,92"; q16 " 7,1 " (com espaços nas pontas).
- **Passo a passo:** q01, q02 e q07 são formas válidas; q03 é 1.234 reais; q04, 50 centavos; q05 e q06, −10 reais com os dois sinais aceitos; q16, sem os espaços, 7,10 reais. q08 e q11 usam "." fora de grupo de milhar; q09 tem 3 casas; q10 tem grupo de 2; q12 está vazio; q13 tem duas vírgulas. q14 é o limite da faixa; q15 passa dele e é recusado pela faixa (seção 3).
- **Esperado:**
  - `q01`: `123456`
  - `q02`: `123456`
  - `q03`: `123400`
  - `q04`: `50`
  - `q05`: `-1000`
  - `q06`: `-1000`
  - `q07`: `123456789`
  - `q08`: `recusado`
  - `q09`: `recusado`
  - `q10`: `recusado`
  - `q11`: `recusado`
  - `q12`: `recusado`
  - `q13`: `recusado`
  - `q14`: `9007199254740991`
  - `q15`: `recusado_faixa`
  - `q16`: `710`

## Fontes

| Fonte | Função | Versão fixada | Limite de autoridade |
| :-- | :-- | :-- | :-- |
| `Meus-Investimentos` | Regras de origem, lidas na ideação do ciclo `003` | Commit `1b13b033ce4335c09df80237c8c31b96b37e3797`, fixado na KB-001 | Evidência histórica; nenhum valor, teste ou fixture copiado |
| SGS do Banco Central, <https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados> | Formato, janelas e séries 12 e 433 | Verificação de 2026-10-13, registrada no plano do ciclo `003` (V1 a V5) | Serviço externo; a disponibilidade não foi medida |
| Plano do ciclo `003` | Decisões P1 a P18 e D1 a D14 | `_project/drafts/003_regras_financeiras/003_plan.md`, `v3` aprovada em 2026-10-14 | Autoridade das decisões; esta KB as especifica |
| `design-system/DESIGN.md`, seções 6.3 a 6.5 | Formato brasileiro, sinal e `N/D` | Versão vigente em `main` | Contrato visual |

## Histórico

| Data | Ciclo | Alteração |
| :-- | :-- | :-- |
| 2026-10-14 | `003` | Criação (issue #26), com as decisões K1 a K13 e os casos CR-01 a CR-50 |
| 2026-10-14 | `003` | Issue #27: datas mínimas do estorno e da correção, trânsito sem lançamento comum e escopo da pendência (ativo com histórico no mês) e saldo atual na desativação, explicitados na implementação do banco |
