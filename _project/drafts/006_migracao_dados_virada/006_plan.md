# Plano de Implementação — Migração única dos dados e virada

> **Ciclo:** `006`
> **Status:** `Aprovado`
> **Versão:** `v5`
> **Data de criação:** 2026-10-17
> **Última atualização:** 2026-10-18
> **Tipo:** `feature`
> **Prioridade:** `P1`
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 006" em 2026-10-17
> **Autorização do rascunho:** "autorizo o rascunho do plano do ciclo 006" em 2026-10-17
> **Autorização da revisão v4:** "Decido pela alternativa A (migracao no trânsito, com migração SQL aditiva e exceção à K12) e pelas regras complementares 1 a 4 como propostas. Prepare a revisão v4 do plano do ciclo 006 com a issue D." em 2026-10-18
> **Autorização da revisão v5:** "Decido pela alternativa A: posição implícita zero quando a posição anterior terminou em zero e não há evento no mês; qualquer outra ausência continua recusando. Prepare a revisão v5 do plano do ciclo 006." em 2026-10-18
> **Modo contínuo:** `—`
> **Revisão formal:** `Concluída` (v5, rodada 5); rodada 4 concluída sobre a `v4`, rodadas 1 a 3 sobre a `v3`
> **Veredito da revisão:** `APTO COM RESSALVAS` (v5, rodada 5); `APTO COM RESSALVAS` na rodada 4 (`v4`), `APTO PARA APROVAÇÃO` na rodada 3 (`v3`)
> **Aprovação humana pós-revisão:** `Aprovada em 2026-10-18` (v5); `v4` aprovada em 2026-10-18, `v3` em 2026-10-17
> **handoff_schema_version:** `2`

## Problema e contexto

Ideação: `_project/ideations/006_migracao_dados_virada.md`

## Objetivo

Reconstruir no Saldo Futuro de produção a carteira hoje mantida no `Meus-Investimentos`, por uma migração única e verificável, e registrar a virada: a data a partir da qual o Saldo Futuro é a fonte de verdade e a origem deixa de receber lançamentos.

O resultado é aceito quando, para todo mês migrado, o saldo final de cada ativo e o patrimônio do mês no destino são iguais aos da origem em centavos, e a reconciliação registra só contagens e diferenças zero.

## Contexto e baseline

- **Destino.** Schema em `supabase/migrations/20261014185205_carteira.sql`. A escrita só acontece por funções `security definer` que filtram por `auth.uid()`: `criar_ativo`, `lancar_evento` (aceita o tipo `migracao`), `estornar_evento`, `transferir`, `fechar_mes`, `reabrir_mes` e `desativar_ativo`. O fechamento calcula o ajuste de cada ativo como `saldo real − saldo calculado`, com o tipo de ajuste do ativo; o ajuste não é evento (KB-004, seção 5). Eventos são imutáveis e nenhuma função os apaga; só a exclusão do usuário remove a carteira, em cascata.
- **Origem.** Lido no commit fixado na KB-001 (`1b13b03`), só código e DDL, sem abrir banco:
  - modelos SQLAlchemy em `backend/app/models/`, sem Alembic; **sem coluna de usuário** (instância de um único usuário);
  - `eventos`: `ativo_id` anulável, `data_evento` diária, `valor` não negativo, com a direção (`negativo`) gravada como texto em `observacao`; `origem` em `manual`, `calculado` ou `migrado`;
  - tipos `APORTE`, `RESGATE`, `RENDIMENTO`, `CORRECAO_MARCACAO`, `CAMBIO`, `TRANSFERENCIA_PENDENTE`, `MIGRACAO_HISTORICA` e `ESTORNO` (por `evento_referencia_id`);
  - os ajustes de fechamento são eventos `origem='calculado'` no último dia do mês, com tipo derivado da classificação do ativo (contém "cripto" ou "vari" → correção de marcação; senão, rendimento);
  - o trânsito é um evento `TRANSFERENCIA_PENDENTE` **sem ativo e sem contraperna**; seu saldo acumulado entra no `valor_total` do consolidado e não gera posição. No fechamento da origem (`materializar_fechamento_event_sourcing`), a variação do trânsito não entra em `total_aportes`, `total_resgates` nem `total_rendimento`: a origem não registra de onde o dinheiro veio nem para onde foi. A importação da planilha (`_popular_eventos_transferencia`) gera o primeiro saldo diferente de zero como saldo inicial e, depois, só a variação entre meses, com o valor positivo e a direção em `observacao`;
  - dinheiro em `NUMERIC(15,2)`, que no SQLite é armazenado como REAL;
  - `posicoes_mensais` (saldo de início e fim por ativo e mês) e `consolidado_mensal` (com `status` e `fechado` redundantes);
  - meses que a própria origem importou de CSV têm eventos `MIGRACAO_HISTORICA` e totais nulos.
- **Baseline ausente.** O SQLite real não está em `local/`. Volume, intervalo de meses e qualidade dos dados são desconhecidos; a primeira saída da issue A são as contagens agregadas, sem valores.
- **Primeira simulação real (2026-10-18, execução pós-merge da issue C).** Depois da correção da issue #70 (PR #71), `simular` recusou com `M6_TRANSITO_SEM_PAR_UNICO`, quantidade 2: dois eventos de trânsito, um positivo e um negativo em meses consecutivos, sem ativo, sem referência e sem nenhum `RESGATE` ou `APORTE` nesses meses. O destino foi conferido vazio e `gravar` não foi executado. O responsável não sabe a origem nem o destino desse dinheiro. É o caso não coberto que motiva a `v4`.
- **Segunda simulação real (2026-10-18, depois da issue D, PR #74).** Executada pelo agente, com autorização, só com contagens. M6 não recusa mais; a simulação para em `M10_COBERTURA_OU_CONSISTENCIA`, quantidade 12. Todas as 12 são do tipo "posição ausente para ativo com histórico" (11 ativos e 6 meses distintos). Uma consulta somente leitura autorizada na cópia, só com contagens, mostrou que em todas as 12 a posição do mês anterior terminou com saldo zero e não há nenhum evento do ativo no mês, nem calculado; 9 ativos estão desativados na origem e 3 ativos. Nenhum `valor_total` divergiu. No código fixado da origem, a importação da planilha (`_popular_eventos_e_posicoes`) pula o mês com saldo atual e anterior zero, e o fechamento (`materializar_fechamento_event_sourcing`) pula o ativo desativado com saldo inicial zero e sem eventos: a origem não grava posição de saldo zero. É o caso não coberto que motiva a `v5`.
- Tooling: Node.js 24.15 com `node:sqlite` nativo (`DatabaseSync`) e `@supabase/supabase-js` já como dependência. Nenhuma dependência nova é necessária.

## Escopo

### Dentro do escopo

- Leitura local, somente leitura, do SQLite da origem em `local/`.
- Mapeamento da origem para o modelo do destino (regras M1 a M10 abaixo), com casos de referência fictícios na KB-004.
- Simulação completa que não grava nada: replay em memória com a mesma aritmética de `src/lib/financeiro`, relatório detalhado só em `local/` e resumo de contagens.
- Gravação em produção pela sessão autenticada do responsável, pelas funções existentes, idempotente e retomável, com recusa se o destino não estiver vazio.
- Conferência pós-gravação, que relê o destino e compara com a origem mês a mês.
- Roteiro da virada (congelamento da origem, simulação, gravação, conferência e caminho de volta) e registro da data de virada.
- **Desde a `v4`:** uma única migração SQL aditiva (issue D), que cria a função `lancar_migracao_transito`, o único meio de lançar um evento `migracao` no ativo "Em trânsito" (exceção à K12), e o uso dessa função pela simulação, pela gravação e pela conferência.

### Fora do escopo

- Tabela `investimentos_legacy` e o migrador histórico de CSV da origem (ADR-002).
- Sincronização contínua ou bidirecional.
- Rota ou tela de importação na aplicação.
- Migração do catálogo e das séries de benchmark da origem (M8).
- Atributos descritivos do ativo da origem sem coluna no destino (classificação, instituição, liquidez etc.).
- Mais de uma conta (decisão do responsável).
- Desligar a infraestrutura da origem.
- Outra mudança de schema além da migração da issue D (G4). `lancar_evento` não muda e continua recusando o trânsito.
- Expor o lançamento de `migracao` no trânsito na interface da aplicação.

## Decisões e autoridades

### Decisões do responsável (2026-10-17, depois de "autorizo o rascunho do plano do ciclo 006")

As perguntas da ideação foram apresentadas com alternativas e exemplos fictícios, e o responsável escolheu as recomendações:

| Pergunta da ideação | Decisão |
| :-- | :-- |
| 1 e 2 — destino e contas | Só a conta do responsável. A carteira de destino em produção está vazia, e o migrador confere isso e recusa gravar se não estiver |
| 3 — histórico (G1) | **D, híbrido:** replay dos eventos onde o ativo e o mês reconciliam; `migracao` só no ativo e mês que não reconcilia |
| 6 — mês aberto | Virada logo depois de um fechamento: só meses fechados na origem migram |
| 9 — divergência | Aceitar `migracao` depois de uma simulação sem gravação, cujo detalhe fica em `local/` para conferência do responsável |

### Decisões do responsável (2026-10-18, revisão v4 de M6)

A recusa da primeira simulação real (ver "Contexto e baseline") foi levada ao responsável com alternativas e exemplos fictícios. As funções atuais do destino só alteram o trânsito por `transferir` (`lancar_evento` recusa ativo de sistema, K12), e o fechamento só aceita uma variação do patrimônio explicada por componentes. Sem contrapartida, a única classificação que não é fluxo externo nem rendimento é `migracao`.

| Questão | Alternativas apresentadas | Decisão |
| :-- | :-- | :-- |
| Representação da variação de trânsito sem par | **A:** evento `migracao` no próprio trânsito, por uma função nova, aditiva, exceção à K12. **B:** ativo sintético de contrapartida com `migracao` e transferência para o trânsito (inventa um ativo). Aporte ou resgate externo no trânsito ficou descartado por K12 e por classificar como fluxo um dinheiro de origem desconhecida | **A** |
| 1 — Par real único no mesmo mês | Manter a transferência atual (sem fluxo externo e sem migração) | Manter |
| 2 — Par ambíguo | Recusar, com código e contagem próprios | Recusar (`M6_TRANSITO_PAR_AMBIGUO`) |
| 3 — Saldo acumulado do trânsito negativo no fim de um mês | Recusar com a contagem de meses, sem corrigir nem limitar | Recusar (`M6_TRANSITO_SALDO_NEGATIVO`) |
| 4 — Consistência de M10 | `valor_total` = soma dos saldos finais + saldo acumulado do trânsito, sem mudança | Manter |

Consequência aceita com a alternativa A: o mês com `migracao` no trânsito tem rentabilidade `N/D` (P15), e todo período que o inclua tem acumulado `N/D` (K1). A variação do patrimônio continua calculável.

**Autorização registrada na mesma instrução:** depois da implementação aprovada e integrada, o agente executa **somente** `simular` sobre a cópia em `local/migracao-006/`, sem `gravar` e sem acesso ao Supabase. Ao responsável e nos artefatos, informa só códigos e contagens. Se houver outra recusa, para em "Parado". Se a simulação for aceita, para antes de `gravar` e apresenta a execução seguinte passo a passo, um passo por vez.

### Decisões do responsável (2026-10-18, revisão v5 de M10)

A recusa da segunda simulação real foi levada ao responsável com alternativas e exemplo fictício: o ativo Z zera por resgate total em março e a origem não grava posição de Z em abril e maio, sem eventos de Z nesses meses.

| Alternativa | Efeito | Decisão |
| :-- | :-- | :-- |
| **A:** posição implícita zero só quando a posição anterior terminou em zero e não há evento do ativo no mês | Z ganha posições 0 → 0 em abril e maio; o fechamento recebe saldo real 0; patrimônio, componentes e retorno não mudam. Qualquer outra ausência continua recusando | **A** |
| **B:** manter a recusa | A migração fica impossível sem editar a origem | — |
| **C:** tratar pelo M7 | A `migracao` calculada seria zero, que o próprio M7 recusa | — |

Consequência aceita com a alternativa A: o destino terá posições zeradas mensais desses ativos até o fim do intervalo migrado; os desativados na origem seguem M9 (desativados depois do último mês migrado), e os ativos na origem continuam ativos, pedindo saldo real a cada fechamento até o responsável desativá-los na aplicação.

### Regras de mapeamento propostas (G1, decididas na aprovação do plano)

Estas regras detalham a alternativa D. Os exemplos são fictícios, em centavos quando não indicado. "Aprovo o plano do ciclo 006" aprova estas regras como estão; uma regra contestada volta como achado de revisão. A issue A as transcreve para a KB-004 com casos de referência.

| # | Questão | Proposta | Exemplo fictício |
| :-- | :-- | :-- | :-- |
| M1 | Tipo de ajuste do ativo no destino | Derivado como na origem: classificação contendo "cripto" ou "vari" → `marcacao`; senão → `rendimento` | Classificação "Renda variável" → `marcacao`; "Pós-fixado" → `rendimento` |
| M2 | Sinal e conversão das quantias | **Sinal:** reproduzir a leitura da origem: `RESGATE` é negativo; nos tipos com direção, `observacao` contendo "negativo" torna o valor negativo. **Conversão, sem arredondamento:** valor `INTEGER` vira centavos multiplicando por 100; valor `REAL` vira a representação decimal mais curta que reproduz o mesmo `float64` (`String(n)` do JavaScript); valor `TEXT` precisa casar com `^\d+(\.\d{1,2})?$`. A representação só é aceita se não tiver expoente e tiver no máximo duas casas decimais; os centavos vêm dos dígitos, sem multiplicar o ponto flutuante. Qualquer outra forma (três ou mais casas, expoente, valor negativo apesar do `CHECK`, mais de 15 algarismos significativos) **recusa a simulação inteira**. Não há desempate, porque nada é arredondado. Com até 13 algarismos inteiros e 2 decimais (`NUMERIC(15,2)`), o `float64` reproduz o decimal gravado | `RENDIMENTO` 12,34 com "direcao=negativo" → −1.234. `REAL` gravado como 19,99 (`float64` 19,989999999999998…) → "19.99" → 1.999. `REAL` 1.234,5 → "1234.5" → 123.450. `REAL` 1,005 → "1.005" → recusa. `REAL` 1,234 → recusa |
| M3 | Ajustes calculados da origem (`origem='calculado'`) | Não viram eventos. O destino recalcula o ajuste no fechamento a partir do saldo real (o `saldo_fim` da origem). A simulação confere que o ajuste do destino é igual à soma dos ajustes calculados da origem no ativo e mês; se não for, o ativo e mês caem em M7 | Saldo inicial 100.000, aporte 50.000, ajuste calculado da origem 1.000, `saldo_fim` 151.000 → destino: aporte 50.000 e ajuste `rendimento` 1.000 |
| M4 | Tipos manuais | `APORTE` → `aporte`; `RESGATE` → `resgate`; `RENDIMENTO` → `rendimento`; `CORRECAO_MARCACAO` → `marcacao`; `CAMBIO` → `cambio`; `MIGRACAO_HISTORICA` → `migracao`. O câmbio passa a componente próprio (a origem o somava ao rendimento); a soma dos componentes não muda. Evento de valor zero (o `CHECK` da origem o admite) não tem efeito no saldo, é descartado e entra na contagem | Rendimento 800 e câmbio 200: origem mostra rendimento 1.000; destino mostra rendimento 800 e câmbio 200 |
| M5 | `ESTORNO` | `estornar_evento` sobre o evento mapeado, na data do estorno da origem. Se o evento referenciado foi substituído por M7, o ativo e mês do estorno também caem em M7. **Recusa a simulação inteira** o `ESTORNO` cujo evento referenciado seja `TRANSFERENCIA_PENDENTE` ou tenha sido consumido por M6. Motivo: na origem, o saldo do trânsito soma só eventos de tipo literal `TRANSFERENCIA_PENDENTE` (`_saldo_transferencia_pendente`), e o `ESTORNO` exige `ativo_id`. Esse estorno altera um ativo e não o trânsito, efeito que nenhuma operação do destino reproduz: `corrigir_transferencia` reduziria também o trânsito. Por isso a migração não gera `corrigir_transferencia`; o caso vai a "Parado" com a contagem, para decisão do responsável com exemplos | Aporte 10.000 em 05/03 e estorno em 20/03 → aporte e estorno no destino, saldo líquido zero. Trânsito +30.000 e um `ESTORNO` que o referencia, lançado no ativo X → na origem o trânsito continua com 30.000 e X perde 30.000 → recusa |
| M6 | Trânsito (`TRANSFERENCIA_PENDENTE` sem ativo) — **revisada na `v4`** | Cada `TRANSFERENCIA_PENDENTE` é uma **variação do saldo acumulado** do ativo "Em trânsito": positiva aumenta, negativa reduz, com a direção lida por M2 (`observacao`), nunca pelo sinal da coluna `valor`. **Candidato a par** de um evento de trânsito positivo é um `RESGATE` não calculado, do mesmo valor absoluto e do mesmo mês; de um negativo, um `APORTE` nas mesmas condições. Cada evento de trânsito cai em exatamente um caso: **(a) par único** — exatamente um candidato, e esse candidato só serve a ele: o par vira uma `transferir` de ou para o trânsito **na data mais tardia das duas**, e os dois eventos são consumidos uma única vez. Transferência não é fluxo (P6), então a data dentro do mês não altera o fechamento nem o Dietz; **(b) sem candidato** — vira um evento `migracao` no trânsito, pela função `lancar_migracao_transito` (issue D), com o valor assinado da variação e a data do evento de origem. Nenhum aporte, resgate, ativo ou contrapartida é criado; o mês fica com rentabilidade `N/D` (P15) e os períodos que o incluem, `N/D` (K1); **(c) par ambíguo** — dois ou mais candidatos, ou um candidato que serve a mais de um evento de trânsito: **recusa a simulação inteira** (`M6_TRANSITO_PAR_AMBIGUO`, com a contagem de eventos de trânsito). **Saldo:** o saldo acumulado do trânsito no fim de cada mês do intervalo de M10 é a soma de todas as variações até o mês; se for negativo em algum mês, **recusa a simulação inteira** (`M6_TRANSITO_SALDO_NEGATIVO`, com a contagem de meses), sem corrigir nem limitar o saldo. Um saldo positivo no último mês fechado continua no trânsito como saldo de fechamento, sem destino inventado. Nos casos (a) e (b), o trânsito do destino termina cada mês com exatamente o saldo acumulado da origem, que é o termo do trânsito na consistência de M10. O trânsito não recebe M7 | Resgate de 30.000 de X em 05/03 e trânsito +30.000 em 06/03 → transferência X → trânsito de 30.000 em 06/03; março sem resgate externo e com retorno calculável. **Ex. A (sem par):** dez: trânsito +100.000, nenhum resgate → `migracao` +100.000 no trânsito; Vi 1.000.000 (X), Vf 1.100.000, migração +100.000, retorno de dez `N/D`; jan: trânsito −100.000, nenhum aporte → `migracao` −100.000; trânsito 0, Vf 1.000.000, retorno de jan `N/D`. **Ex. B:** jan com −40.000 → trânsito fecha jan com 60.000. **Ex. C:** sem saída até o último mês fechado → trânsito fecha com 100.000. **Ex. D:** dez: resgate de 100.000 de X e trânsito +100.000 → transferência; jan: trânsito −100.000 e aporte de 100.000 em Y → transferência; nenhum fluxo externo nem migração, retorno calculável. Dois resgates de 30.000 no mesmo mês para um trânsito de 30.000 → recusa (`M6_TRANSITO_PAR_AMBIGUO`). Trânsito −100.000 em dez sem saldo anterior → recusa (`M6_TRANSITO_SALDO_NEGATIVO`) |
| M7 | Ativo e mês não reconciliável (alternativa D) | **Precedência:** as transferências de M6 são sempre preservadas, inteiras. Os demais eventos do ativo naquele mês (inclusive estornos) são substituídos por um único `migracao`, datado no último dia do mês, de valor `saldo_fim` da origem − saldo final do ativo no destino no mês anterior − soma das pernas de transferência do ativo no mês. Essa soma conta os eventos de tipo `transferencia`, que são as únicas pernas existentes, porque M5 nunca gera correção de transferência (estornos ligados a uma transferência). O ajuste do ativo fica zero. **Causas, e só estas:** (i) `saldo_inicio(m)` diferente de `saldo_fim(m−1)` na origem; (ii) ajuste divergente (M3); (iii) evento referenciado por estorno substituído (M5, em cascata); (iv) ativo com `saldo_fim` diferente de zero e sem histórico no destino no mês (só ajuste na origem); (v) replay cujo saldo calculado diverge por outro motivo. Se o valor calculado da `migracao` for zero, **recusa a simulação inteira**: um mês sem evento de migração teria rentabilidade calculada, e não `N/D` (P15), e nenhum evento de compensação é fabricado | Destino fechou fevereiro com 101.000 em X; a origem traz março com `saldo_inicio` 100.000, aporte 50.000 e `saldo_fim` 151.000 → `migracao` de 50.000 em 31/03 e rentabilidade de março `N/D`. Com transferência: X começa março com 100.000 no destino, transfere 30.000 ao trânsito e tem `saldo_fim` de 80.000 na origem → transferência preservada e `migracao` = 80.000 − 100.000 − (−30.000) = +10.000. Identidade: Vf − Vi = +10.000 = migração; as pernas somam zero e o trânsito fica com 30.000 |
| M8 | Benchmarks e séries | Não migram. As séries públicas vêm da sincronização com o SGS já existente no destino | — |
| M9 | Ativos desativados na origem | Migram como ativos comuns e são desativados no destino depois do último mês migrado, se o saldo for zero. Com saldo diferente de zero, ficam ativos e entram na contagem | Ativo com saldo final zero em junho e desativado na origem → desativado no destino ao fim da migração |
| M10 | Cobertura e referências do histórico | **Mês fechado** na origem é o que tem `consolidado_mensal` com `status='fechado'` **e** `fechado=1`; só um dos dois recusa a simulação. **Intervalo migrado:** do primeiro mês com `posicoes_mensais` até o último mês fechado. Todo mês do intervalo precisa estar fechado (lacuna recusa), e o primeiro precisa ter `saldo_inicio` zero em todas as posições e ao menos um evento não calculado (K7). **Ativos esperados por mês:** todo ativo com posição no mês anterior ou evento no mês precisa de posição no mês; ausente, recusa (não é M7, porque M7 precisa desse `saldo_fim`). **Exceção revisada na `v5` — posição implícita zero:** se a posição do mês anterior (real ou implícita) terminou com saldo zero e o ativo não tem nenhum evento no mês, inclusive calculado, a ausência vira uma posição implícita com saldo inicial e final zero, aplicada mês a mês dentro do intervalo, em ordem. Qualquer outra ausência continua recusando. A simulação informa quantas posições implícitas criou. **Consistência:** `valor_total(m)` = soma dos `saldo_fim` + saldo acumulado do trânsito até `m`; divergente, recusa. **Antes do intervalo:** meses que só têm consolidado, sem posição (importação de CSV da própria origem), não migram: o destino não tem como distribuí-los por ativo sem inventar. A simulação informa quantos são. **Depois do intervalo:** qualquer evento em mês aberto recusa, porque viola o congelamento | Origem com consolidados de jan/2020 a dez/2022 sem posição e posições de jan/2023 em diante → o destino começa em jan/2023; a simulação relata "36 meses só com consolidado, não migrados". Fevereiro de 2024 sem consolidado entre janeiro e março fechados → recusa. **`v5`:** Z com `saldo_fim` 0 em março e sem posição nem evento em abril e maio → posições implícitas 0 → 0 em abril e maio, saldo real 0 no fechamento; patrimônio e retorno inalterados. Z sem posição em abril, mas com um aporte em abril → recusa. Z sem posição em abril depois de março com saldo 10.000 → recusa |

**Precedência das recusas.** Recusam a simulação inteira, sem gravar nada, e levam a "Parado" com as contagens: conversão inválida (M2); estorno ligado ao trânsito ou a evento consumido por M6 (M5); par de trânsito ambíguo e, depois, saldo acumulado do trânsito negativo (M6, desde a `v4`; substituem a recusa por "trânsito sem par único" da `v3`); `migracao` de valor zero (M7); qualquer falha de cobertura ou consistência (M10); nome com mais de 100 caracteres; indício de mais de um usuário. Só as causas (i) a (v) de M7 admitem o fallback por `migracao`. Nenhuma condição aparece nas duas listas.

**Exceção à K12 (issue D, decidida na `v4`).** Uma migração nova cria `public.lancar_migracao_transito(p_data date, p_valor bigint) returns uuid`, `security definer`, com `search_path` vazio e execução só para `authenticated`, como as demais funções da carteira. Ela:

- localiza o trânsito do próprio usuário (`auth.uid()` por `private.travar_carteira`) e não recebe id de ativo, então não alcança carteira alheia;
- grava só o tipo `migracao`; recusa, nesta ordem, como `lancar_evento`: valor nulo ou zero (`recusado_sinal`), fora da faixa (`recusado_faixa`) e trânsito inexistente (`recusado_ativo_invalido`, antes do primeiro `criar_ativo`). Por essa ordem, a chamada com valor zero é uma sonda sem efeito, que responde `recusado_sinal` mesmo com o destino vazio;
- aplica a mesma conferência de data de `lancar_evento` (`private.conferir_data_lancamento`): nada em mês fechado.

`lancar_evento`, `transferir`, `fechar_mes` e as políticas não mudam: no fechamento, o saldo do trânsito continua sendo o calculado (agora incluindo a migração), sem saldo real nem ajuste (K12), e a identidade passa a contar a migração do trânsito no componente `migracao`. `estornar_evento` já aceita estornar esse evento, como qualquer evento comum; a migração nunca o gera. A K12 passa a dizer: o trânsito só recebe pernas de transferência e, exclusivamente por essa função, eventos `migracao`. A interface não oferece esse lançamento.

Regras que valem para todas: o `nome` do ativo é a `descricao` da origem; as datas são as da origem, salvo a transferência (M6, caso a) e a `migracao` (M7); a `migracao` no trânsito (M6, caso b) usa a data da origem; meses migram em ordem, com os eventos do mês antes do fechamento (K7, P8 e K13 continuam valendo); a reconciliação final compara, por mês, o saldo final de cada ativo e o patrimônio (`vf` do destino com `valor_total` da origem, trânsito incluído) e a lista de meses marcados como `N/D` por migração.

### Mecanismo de execução

- Código puro (leitura, mapeamento, simulação e conferência) em `src/lib/migracao/`, testado com Vitest e com um SQLite fictício criado em memória a partir do DDL da origem. Nenhum `.sqlite` é versionado.
- Um ponto de entrada local, executado só pelo responsável, com três modos: `simular` (não grava), `gravar` e `conferir` (só lê). A forma de executá-lo sem dependência nova é escolhida na issue A; se não houver, a situação passa a "Parado".
- A gravação usa a sessão do responsável (acesso e renovação) fornecida por um arquivo em `local/` ou por variáveis de ambiente fora do Git. O agente não lê, não copia nem registra esse material. Não há chave `service_role` em código, CI ou `local/`.
- **Plano de operações imutável.** A simulação gera uma lista ordenada de operações e grava em `local/` o plano junto com o hash SHA-256 do SQLite, o hash do próprio plano e o `user_id` de destino. `gravar` só executa um plano cujo hash confere com o SQLite e com o usuário da sessão.
- **Único gravador.** O regime é um processo, numa máquina, com a aplicação sem uso durante a carga. O roteiro (issue C) exige isso, e o migrador o impõe localmente com um arquivo de trava criado de forma exclusiva (`wx`) em `local/`. Se a trava existir, o migrador não grava. Um gravador fora desse regime (outra máquina, a aplicação em uso) não é impedido pelo banco: as funções criam UUIDs novos e não recebem chave idempotente. Por isso a conferência abaixo roda antes de toda escrita e de todo fechamento, e qualquer diferença leva a "Parado". O caminho de volta é o do rollback.
- **Diário por operação.** O diário em `local/` registra, para cada operação, o índice no plano, a intenção (antes da chamada) e o resultado com o UUID devolvido (depois).
- **Resposta perdida: nunca repetir automaticamente.** Um erro de rede ou um tempo esgotado depois de enviar a chamada torna o resultado desconhecido. A chamada original pode ainda estar em execução: a ausência do efeito numa ou em várias releituras não prova que ela terminou sem efeito, e nenhuma espera arbitrária prova isso. As funções existentes não dão essa evidência, porque não têm chave idempotente nem consulta de término. Por isso o migrador grava a operação no diário como `desconhecida` e para ("Parado", `ambiguous_human_intervention_required`), sem nova escrita. Vale para `criar_ativo`, `lancar_evento`, `lancar_migracao_transito` (desde a `v4`), `estornar_evento`, `transferir`, `fechar_mes` e `desativar_ativo`.
- **Retomada de operação desconhecida.** Ao rodar `gravar` de novo, o migrador relê o destino:
  - se o efeito completo da operação aparece exatamente uma vez, a operação foi aplicada; o diário a registra e a carga segue;
  - se não aparece, ou aparece de forma parcial ou duplicada, o migrador continua parado e não reenvia nada.

  A saída desse impasse é decisão humana registrada, apresentada pelo roteiro: esperar e reconferir, ou desfazer a carga pelo rollback (exclusão do usuário de destino). O plano não oferece reenvio automático nem recomenda reenvio manual como seguro. Se o responsável quiser uma garantia de idempotência real, isso exige mudar o banco: a situação passa a "Parado" por mudança de escopo, e essa mudança não entra neste ciclo.
- **Comparação com o plano: efeitos completos.** O prefixo é comparado pelos efeitos de cada operação, não só pela presença de linhas:
  - ativos: nome, tipo de ajuste e estado ativo ou desativado, o que distingue o antes e o depois de `desativar_ativo`;
  - eventos do mês aberto: multiconjunto de (ativo, data, tipo, valor, evento estornado), contra as primeiras `k` operações do mês, inclusive a `migracao` no trânsito (M6, caso b). Eventos idênticos no mesmo dia são intercambiáveis, então o multiconjunto define o prefixo sem ambiguidade;
  - transferências: cabeçalho com data e as duas pernas (origem, destino e valores opostos), comparadas como uma unidade;
  - meses fechados: consolidado e posições.
- **Destino vazio e retomada.** A primeira execução exige destino vazio: só o ativo de trânsito, nenhum outro ativo, nenhum evento e nenhum mês fechado. A única exceção é a retomada comprovada: diário e plano com os mesmos hashes, mesmo usuário e destino igual a um prefixo exato do plano. Reexecutar depois de concluído reconhece o plano inteiro aplicado, registra `already_executed_and_reconciled` e não grava.
- **Leitura completa (conferência e retomada).** Toda leitura do destino usa o contrato de `src/lib/leitura.ts` (`lerTudo`/`lerTabela`): páginas de 1.000 linhas (`max_rows`), contagem exata e recusa se a contagem mudar entre páginas. Falha de página ou mudança durante a leitura para a conferência. Igualdade de saldos num subconjunto nunca conta como reconciliação.
- Se as funções existentes não sustentarem essas garantias nos testes da issue B, a situação passa a "Parado" por mudança de escopo, em vez de prometer idempotência que não existe.
- **Função nova presente antes da primeira escrita (`v4`).** Se o plano de operações tiver `lancar_migracao_transito`, `gravar` confere, antes de qualquer escrita, que a função existe no destino: chama-a com valor zero e só segue se a resposta for a recusa `recusado_sinal`, que não grava nada. Qualquer outra resposta (função ausente, sem permissão, erro de rede) para sem escrita, com a orientação de fazer o `db push` da issue D. Assim, a ausência da migração no banco não deixa uma carga parcial.

### Pontos de aprovação

| Ponto | Precondição | Cobre | Não cobre | Conferir |
| :-- | :-- | :-- | :-- | :-- |
| Autorizar rascunho — "autorizo o rascunho do plano do ciclo 006" | Ideação registrada; concedido em 2026-10-17 | Este plano local e o ciclo como `Planejamento` em `cycles.md` | Revisão, aprovação, issues ou implementação | Ideação, decisões registradas e template |
| Aprovar plano — "aprovo o plano do ciclo 006" | Veredito apto posterior à última correção; manifestação humana posterior ao veredito | Escopo; regras M1 a M10; preparar e publicar a PR documental `chore/cycle-006-plan` (ideação, plano e `cycles.md`); preparar e apresentar os payloads das issues; o encerramento | O merge da PR documental, que exige "aprovo o merge da PR #N"; a criação das issues, que exige a confirmação dos payloads apresentados; implementação, merges de entrega, ação externa, verificação em produção ou qualquer regra financeira nova | Veredito, ressalvas, M1 a M10, decomposição e roteiro |
| Confirmar payloads — confirmação explícita do responsável aos payloads apresentados (`criar_issues`) | Plano aprovado e PR documental integrada | Criar as issues A, B e C exatamente como apresentadas | Alterar escopo ou payload | Títulos, corpos e barreiras |
| Autorizar implementação — "autorizo a implementação da issue #N" | Plano integrado; issue criada; dependência anterior integrada | Branch, task, código, testes e abertura da PR da issue | Merge, outra issue ou execução contra produção | Payload e escopo |
| Aprovar merge — "aprovo o merge da PR #N" | Checks verdes no HEAD; critérios atendidos | Squash daquela PR | Outra PR, ação externa ou verificação | Diff, checks, barreiras e evidências |
| Ação humana externa — "concluí a ação externa da issue #N" | Issues A e B integradas; roteiro da issue C integrado | O responsável congela a origem, simula, confere o relatório local, grava e roda a conferência, seguindo o roteiro | Qualquer ação do agente contra produção ou sobre o SQLite real | Resumo de contagens e diferenças informado pelo responsável, sem valores |
| Verificar produção — "autorizo a verificação em produção do ciclo 006" | Ação externa concluída com conferência sem diferença | Conferir, sem registrar dados, que a aplicação abre com os meses fechados, sem erro, e registrar a data de virada | Leitura ou registro de valores, nomes de ativos ou prints com dados reais | Checklist da issue C |

**Pontos acrescentados pela `v4`.** A aprovação da `v3` continua valendo para as entregas A, B e C, já integradas, e não cobre a `v4`.

| Ponto | Precondição | Cobre | Não cobre | Conferir |
| :-- | :-- | :-- | :-- | :-- |
| Aprovar a `v4` — "aprovo o plano do ciclo 006" | Veredito apto na revisão da `v4`, posterior à última correção; manifestação humana posterior ao veredito | M6 revisado; a exceção à K12 e o contrato de `lancar_migracao_transito`; a migração SQL da issue D; preparar e publicar a PR documental da `v4` (plano, task da issue #65 e `cycles.md`); preparar e apresentar o payload da issue D | O merge da PR documental; a criação da issue D, que exige a confirmação do payload; implementação, merges, `db push`, `gravar` ou qualquer outra regra financeira | Veredito, M6, exceção à K12, item D e sequência |
| Confirmar o payload da issue D (`criar_issues`) | `v4` aprovada e PR documental integrada | Criar a issue D exatamente como apresentada | Alterar escopo ou payload | Título, corpo e barreiras |
| Autorizar implementação — "autorizo a implementação da issue #N" (D) | Issue D criada; `v4` integrada | Branch, task, migração SQL, código, testes, KB-004, KB-002 e abertura da PR | Merge, `db push` ou execução contra produção | Payload e escopo |
| Simulação local pelo agente (autorizada em 2026-10-18) | PR da issue D integrada | Executar só `simular` sobre a cópia em `local/migracao-006/` e relatar só códigos e contagens | `gravar`, `conferir`, Supabase, leitura ou reprodução de valores, nomes ou identificadores | Códigos e contagens do resumo |
| Ação humana externa da issue D — "concluí a ação externa da issue #N" (D) | PR da issue D integrada | O responsável faz o `db push` da migração da issue D a partir da `main` atualizada (KB-002, S12) e confere `migration list` | Qualquer escrita de dados da carteira | `migration list` com local e remoto alinhados, descrito em texto |

A ação externa da issue C (#65) continua com o roteiro da KB-002 e só prossegue para `gravar` depois da ação externa da issue D e de uma simulação aceita.

**Pontos acrescentados pela `v5`.** As aprovações da `v3` e da `v4` continuam valendo para as entregas A a D, já integradas, e não cobrem a `v5`.

| Ponto | Precondição | Cobre | Não cobre | Conferir |
| :-- | :-- | :-- | :-- | :-- |
| Aprovar a `v5` — "aprovo o plano do ciclo 006" | Veredito apto na revisão da `v5` (rodada 5, a última pelo teto), posterior à última correção; manifestação humana posterior ao veredito | M10 revisado (posição implícita zero); a issue E; preparar e publicar a PR documental da `v5` (plano, task da issue #73 e `cycles.md`); preparar e apresentar o payload da issue E; depois do merge da issue E, a simulação local pelo agente, só `simular`, relatando só códigos e contagens | O merge da PR documental; a criação da issue E, que exige a confirmação do payload; implementação, merges, `db push`, `gravar`, `conferir` ou qualquer outra regra financeira | Veredito, M10, item E e sequência |
| Confirmar o payload da issue E (`criar_issues`) | `v5` aprovada e PR documental integrada | Criar a issue E exatamente como apresentada | Alterar escopo ou payload | Título, corpo e barreiras |
| Autorizar implementação — "autorizo a implementação da issue #N" (E) | Issue E criada; `v5` integrada | Branch, task, código, testes, KB-004, KB-002 e abertura da PR | Merge ou execução contra produção | Payload e escopo |

A ação externa da issue D (`db push`) não depende da `v5` e pode ser feita antes ou depois da issue E; `gravar` só acontece com as duas.

Toda cadeia para em "Parado", com pergunta e alternativas, se:

- faltar capacidade, evidência ou autorização;
- a simulação recusar por qualquer condição da precedência acima, ou revelar um caso não coberto por M1 a M10;
- o destino não estiver vazio fora de uma retomada comprovada;
- a trava de gravador único existir, ou a comparação com o plano divergir;
- surgir necessidade de dependência nova ou de mudança de schema além da migração da issue D;
- a conferência mostrar qualquer diferença.

O modo contínuo não se aplica ao ciclo completo.

**Divergência de autoridade registrada (R1-7).** O fluxo completo de `_project/README.md` diz que a aprovação do plano cobre o merge documental e a criação das issues depois da apresentação do payload. Já `.agent/ai_behavior.md` exige "aprovo o merge da PR #N" para cada merge, sem exceção, e `criar_issues` exige a confirmação do payload. Este plano segue a regra mais restritiva das duas autoridades. Harmonizar o texto é trabalho de governança, fora deste ciclo, e fica relatado aqui.

## Barreiras de domínio

| Barreira | Aplica-se? | Como o ciclo a atende ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim | Regras M1 a M10 decididas na aprovação e transcritas na KB-004 com casos de referência fictícios (`CR-M01` em diante) no JSON de casos e conferência independente. A simulação reutiliza `src/lib/financeiro` (centavos inteiros, mesma aritmética do fechamento) e o destino reconfere a identidade em cada `fechar_mes`. Aceite: diferença zero por ativo e mês e no patrimônio. Nenhuma interpretação nova é escolhida pelo agente. **`v4`:** M6 revisado e a exceção à K12 decididos pelo responsável em 2026-10-18; a issue D transcreve ambos para a KB-004 com os casos `CR-M04` a `CR-M07` (exemplos A a D), conferidos de forma independente, com saldo do trânsito por mês, componente `migracao`, identidade, retorno `N/D` e acumulado. **`v5`:** M10 revisado decidido pelo responsável em 2026-10-18; a issue E o transcreve para a KB-004 com o caso `CR-M08`, conferido de forma independente, com saldos, patrimônio, componentes, retorno e a contagem de posições implícitas |
| G2 — isolamento por RLS | Sim | Só as funções autenticadas, sem `service_role`. Testes no Supabase local com usuários fictícios A e B: a gravação de A não toca B; a recusa com destino não vazio; a trava de gravador único; a retomada. `supabase test db` continua verde. **`v4`:** `lancar_migracao_transito` é `security definer`, filtra por `auth.uid()`, não recebe id de ativo e é executável só por `authenticated`; teste de banco prova que A só altera o próprio trânsito, que `anon` não executa a função e que `lancar_evento` continua recusando o trânsito. **`v5`:** a issue E não muda banco, função nem política; o fechamento do destino recebe saldo real 0 pelas funções existentes |
| G3 — privacidade de dados | Sim, crítica | SQLite, sessão, diário e relatório detalhado só em `local/`. Fixtures fictícias geradas em memória. Evidências em task, PR e issue: só contagens (ativos, eventos por tipo, meses, ativos e meses em M7, desativados) e diferenças. O agente não abre o SQLite real nem a saída detalhada, salvo autorização explícita, e mesmo então não reproduz valores. Nenhum ambiente local de teste recebe dados reais: a simulação é em memória. **`v4`:** a autorização de 2026-10-18 permite ao agente rodar só `simular` sobre a cópia em `local/`, relatando só códigos e contagens. **`v5`:** a leitura da lista de recusas do M10 e a consulta somente leitura na cópia foram autorizadas em 2026-10-18 e relataram só contagens; o UUID do destino fica em arquivo em `local/`, lido pelo comando sem ser exibido |
| G4 — migrações só acrescentam | Sim, desde a `v4` (issue D) | Uma migração nova, `supabase/migrations/AAAAMMDDHHMMSS_migracao_transito.sql`, só cria a função e suas permissões; nenhuma migração existente é editada. Até a `v3`, não havia migração prevista. Outra necessidade de schema leva a "Parado". **`v5`:** a issue E não tem migração |

## Estratégia de testes

- **Unidade (Vitest):**
  - leitura do DDL da origem;
  - conversão M2: `INTEGER`, `REAL` com artefato binário (19,99), `TEXT`, três casas (1,005 e 1,234), expoente, negativo e mais de 15 algarismos;
  - sinal por direção (M2) e mapeamento de tipos, inclusive valor zero (M4);
  - estorno simples, estorno em cascata para M7, e recusa de estorno ligado ao trânsito ou a evento consumido por M6 (M5);
  - pareamento M6: par único, datas diferentes no mesmo mês, par ambíguo, par em outro mês e prova de consumo único;
  - M6 revisado (`v4`), com saldo do trânsito por mês, componentes, identidade (Vf − Vi = componentes), retorno do mês e acumulado, e a consistência de M10 (`valor_total` = saldos finais + trânsito acumulado):
    - exemplo A: entrada e saída sem contrapartida em meses seguidos → aceito; trânsito 1.000 e depois 0; `migracao` +1.000 e −1.000 no trânsito; nenhum aporte, resgate ou ativo criado; retorno `N/D` nos dois meses; sem recusa de M6;
    - exemplo B: saída parcial → trânsito 600 depois do segundo mês;
    - exemplo C: trânsito aberto até o último mês fechado → saldo mantido no último fechamento, sem destino inventado;
    - exemplo D: resgate real com trânsito positivo e aporte real com trânsito negativo no mesmo mês → duas transferências, sem migração, sem fluxo externo e sem contagem dupla; retorno calculável;
    - par em outro mês → o trânsito vira `migracao` e o resgate continua fluxo externo do seu mês, sem dupla contagem no patrimônio;
    - par ambíguo nos dois sentidos → `M6_TRANSITO_PAR_AMBIGUO` com a contagem;
    - saldo negativo ao fim de um mês → `M6_TRANSITO_SALDO_NEGATIVO` com a contagem de meses;
    - a direção vem de `observacao`, com `valor` sempre positivo na origem;
    - ordem das operações do mês: `migracao` do trânsito antes do fechamento, com a data da origem;
  - M10 revisado (`v5`): posição implícita zero depois de saldo zero sem evento no mês, inclusive em meses seguidos e até o último mês fechado; fechamento com saldo real 0 para o ativo; patrimônio, componentes e retorno inalterados; contagem de posições implícitas no resumo; M9 desativando no fim o ativo desativado na origem; recusa mantida para ausência com evento no mês (inclusive calculado) e para ausência depois de saldo diferente de zero;
  - M7 com transferência preservada, M7 com valor zero (recusa) e M7 no primeiro mês;
  - M9;
  - M10: mês só com consolidado antes do intervalo, lacuna entre meses fechados, `status` e `fechado` contraditórios, posição ausente com histórico, `valor_total` inconsistente e evento em mês aberto;
  - plano de operações determinístico (mesmo SQLite, mesmo plano e mesmo hash).
- **Casos de referência:** `CR-M01` em diante na KB-004 e em `tests/fixtures/financeiro/casos_referencia.json`, com o teste de paridade existente (D12) e conferência independente registrada na task. Cada caso de M7 traz o saldo de cada ativo, o do trânsito, o patrimônio e a rentabilidade esperada (`N/D` no mês migrado e no acumulado que o inclui, K1).
- **Integração (Supabase local, usuários fictícios):**
  - carteira fictícia completa (trânsito, estorno, mês em M7 com transferência e ativo desativado) migrada por `gravar` e seguida de `conferir` sem diferença;
  - leitura pela aplicação (`src/lib/leitura.ts` e telas) mostrando `N/D` nos meses migrados;
  - recusa com destino não vazio;
  - segunda instância com a trava presente;
  - resposta perdida **com a chamada original ainda em execução durante a releitura**: uma sessão de teste segura a trava da carteira (`pg_advisory_xact_lock`) numa transação aberta, a chamada é enviada e o cliente a abandona. O migrador precisa parar sem reenviar; depois que a trava é liberada e a chamada original termina, a retomada encontra o efeito uma única vez e segue;
  - resposta perdida depois do commit de `criar_ativo`, `lancar_evento`, `estornar_evento`, `transferir`, `fechar_mes` e `desativar_ativo`, com a retomada reconhecendo o efeito sem duplicar;
  - operação desconhecida cujo efeito não aparece, que mantém o migrador parado sem escrita;
  - estado divergente (evento a mais no destino), que para sem escrita;
  - reexecução depois de concluído, sem gravar;
  - carteira fictícia com mais de 1.000 eventos, com conferência completa, falha de página e mudança entre leituras;
  - isolamento A/B;
  - **`v4` (issue D):** carteira fictícia com trânsito sem par (exemplos A e C) e com par real (exemplo D) migrada por `gravar` e seguida de `conferir` sem diferença; sonda de `lancar_migracao_transito` que para sem escrita quando a função falta; resposta perdida depois do commit de `lancar_migracao_transito`, reconhecida na retomada sem duplicar.
- **Banco (`supabase test db`, issue D):** `lancar_migracao_transito` grava `migracao` no trânsito do próprio usuário; recusa valor zero, fora da faixa, mês fechado e trânsito inexistente; `anon` não a executa; o usuário B não altera o trânsito de A; `lancar_evento` continua recusando o trânsito; `fechar_mes` fecha o mês com a migração no componente `migracao`, sem saldo real nem ajuste no trânsito.
- **Propriedade:** para a carteira fictícia, `simular` e `gravar` + `conferir` produzem os mesmos consolidados.
- Gates mínimos e da aplicação de `_project/README.md`, inclusive `npx supabase test db`.

## Itens de implementação

### Item 1 — A: Leitura, mapeamento e simulação

**Contexto:** a issue determina o histórico que o destino terá. Não grava em lugar nenhum.

**Ação técnica:** em `src/lib/migracao/`:

- leitor somente leitura do SQLite (`node:sqlite`, abertura `readOnly`);
- regras M1 a M10 e a precedência das recusas;
- replay em memória mês a mês com `src/lib/financeiro`;
- plano de operações determinístico e com hash;
- relatório: o detalhado vai para `local/`, e a saída mostra só o resumo de contagens.

O ponto de entrada local ganha o modo `simular`. A KB-004 ganha a seção de migração da origem e os casos `CR-M*`.

**Critérios de aceite:**

- [ ] Regras M1 a M10 na KB-004, com casos de referência fictícios e paridade com o JSON.
- [ ] `simular` sobre o SQLite fictício reproduz exatamente os saldos fictícios esperados e lista os ativos e meses em M7.
- [ ] O modo `simular` não abre conexão com o Supabase.
- [ ] Cada condição da precedência das recusas tem teste e não produz plano de operações.

### Item 2 — B: Gravação autenticada, idempotente e retomável

**Contexto:** a única escrita em produção do ciclo.

**Ação técnica:** modos `gravar` e `conferir` sobre o plano da issue A, conforme o "Mecanismo de execução". A gravação usa só `criar_ativo`, `lancar_evento`, `estornar_evento`, `transferir`, `fechar_mes` e `desativar_ativo`, com a sessão do responsável. Inclui também:

- trava de gravador único;
- diário por operação;
- tratamento de resposta perdida, que para sem repetir;
- retomada por prefixo exato;
- leitura completa pelo contrato de `src/lib/leitura.ts`.

**Critérios de aceite:**

- [ ] Todos os cenários de integração da estratégia de testes passam no Supabase local.
- [ ] Nenhuma escrita acontece quando o destino não está vazio, salvo retomada comprovada, nem com estado divergente ou trava presente.
- [ ] Isolamento A/B provado; nenhuma referência a `service_role`.

### Item 3 — C: Roteiro da virada

**Contexto:** a execução real é ação humana externa, guiada por roteiro. A PR desta issue entrega **só o roteiro**. A execução acontece depois do merge e fica pendente até lá.

**Ação técnica:** roteiro na KB-002, numa seção de migração e virada, com:

- pré-requisitos e o regime de gravador único (uma máquina, um processo, aplicação sem uso);
- congelamento da origem logo depois de fechar um mês nela, e cópia do SQLite para `local/`;
- `simular` e conferência do relatório local pelo responsável;
- `gravar` e `conferir`;
- o que informar ao agente: só contagens e diferenças;
- caminho de volta.

A KB-003 e a KB-004 **não** são alteradas nesta PR.

**Critérios de aceite (merge da PR):**

- [ ] Roteiro completo, revisado e coerente com o mecanismo da issue B.
- [ ] A task registra a execução como pendente, sem resultado presumido.

**Acompanhamento depois do merge, fora do aceite da PR:**

1. Ação externa ("concluí a ação externa da issue #N"): o responsável executa o roteiro, e o agente registra na task C só contagens e diferenças.
2. Verificação em produção ("autorizo a verificação em produção do ciclo 006").
3. Os fatos resultantes entram na PR de encerramento:
   - o relato sanitizado na task C;
   - a data de virada e a retirada da pendência de migração na KB-003;
   - a correção do texto da KB-004 que atribui a migração ao ciclo `005`.

### Item 4 — D: Trânsito sem contrapartida na migração (`v4`)

**Contexto:** a primeira simulação real recusou por M6 com eventos de trânsito sem `RESGATE` ou `APORTE` correspondente, e o responsável não sabe a origem nem o destino desse dinheiro. A `v4` decide representar a variação como `migracao` no trânsito, o que o banco atual não permite (K12).

**Ação técnica:**

- migração `supabase/migrations/AAAAMMDDHHMMSS_migracao_transito.sql`, com `public.lancar_migracao_transito` e suas permissões, conforme a exceção à K12 acima, e teste de banco;
- `src/lib/migracao/simular.ts`: M6 revisado, com os casos (a), (b) e (c), a recusa de saldo negativo e os códigos `M6_TRANSITO_PAR_AMBIGUO` e `M6_TRANSITO_SALDO_NEGATIVO`, que substituem `M6_TRANSITO_SEM_PAR_UNICO`;
- `src/lib/migracao/tipos.ts`, `gravar.ts` e a conferência: a operação `lancar_migracao_transito`, a sonda antes da primeira escrita, a resposta perdida e a comparação por efeitos;
- KB-004: M6 revisado, a exceção na seção 4.4 e na decisão K12, os casos `CR-M04` a `CR-M07` (exemplos A a D) e a paridade com `tests/fixtures/financeiro/casos_referencia.json`;
- KB-002: no roteiro da migração, o `db push` da issue D antes de `gravar`, e os novos códigos de recusa.

O formato do plano de operações muda. Nenhum plano real foi gravado, então nada precisa ser convertido; o hash do plano já impede usar um plano antigo.

**Critérios de aceite:**

- [ ] Exemplos A a D e as duas recusas novas com teste de unidade, conferindo saldo do trânsito por mês, componentes, identidade, retorno, acumulado e M10.
- [ ] `CR-M04` a `CR-M07` na KB-004 e no JSON, com conferência independente registrada na task.
- [ ] Teste de banco da função nova verde, com isolamento A/B; `lancar_evento` inalterado.
- [ ] Integração `gravar` + `conferir` sem diferença na carteira fictícia com trânsito sem par e com par real.
- [ ] Gates mínimos e da aplicação de `_project/README.md`, inclusive `npx supabase test db`.

**Depois do merge, fora do aceite da PR:** a simulação local pelo agente, só com códigos e contagens, e o `db push` do responsável (ação externa da issue D). `gravar` continua pertencendo à ação externa da issue C.

### Item 5 — E: Posição implícita zero na cobertura da migração (`v5`)

**Contexto:** a segunda simulação real recusou por M10 com 12 posições ausentes, todas depois de um mês com saldo zero e sem nenhum evento do ativo no mês, porque a origem não grava posição de saldo zero. A `v5` decide tratar só esse caso como posição implícita zero.

**Ação técnica:**

- `src/lib/migracao/simular.ts`: antes de M10, criar as posições implícitas zero (saldo inicial e final zero), mês a mês dentro do intervalo, para o ativo cuja posição anterior, real ou implícita, terminou em zero e que não tem nenhum evento no mês; as demais ausências continuam recusando por M10;
- resumo com a contagem `posicoesImplicitasZero`;
- KB-004: M10 revisado e o caso `CR-M08`, com paridade em `tests/fixtures/financeiro/casos_referencia.json`;
- KB-002: a contagem nova no que conferir em M2.

Sem mudança de banco, de `gravar` ou de `conferir`: o plano de operações já leva o saldo real 0 no fechamento, e a conferência compara as posições do relatório.

**Critérios de aceite:**

- [ ] Testes de unidade do M10 revisado: casos aceitos e recusas mantidas, com saldos, patrimônio, componentes, retorno, M9 e contagem.
- [ ] `CR-M08` na KB-004 e no JSON, com conferência independente registrada na task.
- [ ] Integração `gravar` + `conferir` sem diferença numa carteira fictícia com posição implícita zero.
- [ ] Gates mínimos e da aplicação de `_project/README.md`.

**Depois do merge, fora do aceite da PR:** a simulação local pelo agente, coberta pela aprovação da `v5`, só com códigos e contagens. Aceita, para antes de `gravar`; outra recusa leva a "Parado".

## Arquivos afetados

- `src/lib/migracao/` (novo) e seus testes.
- Ponto de entrada local (caminho decidido na issue A, sem dependência nova).
- `tests/fixtures/financeiro/casos_referencia.json` e testes de paridade.
- Testes de integração com Supabase local (local escolhido na issue B, seguindo os existentes).
- KB-004 (issue A); KB-002 (issue C); KB-003 e o ajuste de texto da KB-004 (encerramento).
- Desde a `v4` (issue D): `supabase/migrations/AAAAMMDDHHMMSS_migracao_transito.sql`, um teste novo em `supabase/tests/database/`, `src/lib/migracao/` (`simular.ts`, `tipos.ts`, `gravar.ts` e testes), KB-004 (M6, seção 4.4, K12 e `CR-M04` a `CR-M07`), o JSON de casos e KB-002 (roteiro).
- Desde a `v5` (issue E): `src/lib/migracao/simular.ts`, `tipos.ts` e testes, integração em `tests/e2e/`, KB-004 (M10 e `CR-M08`), o JSON de casos e KB-002.
- `_project/cycles.md`, ideação, plano e tasks do ciclo.

## Decomposição em issues e PRs

| Issue | Título proposto | Barreiras | Depende de |
| :-- | :-- | :-- | :-- |
| A | `[FEATURE] Simular a migração da origem sem gravar` | G1, G3 | Plano integrado |
| B | `[FEATURE] Gravar a migração pela sessão do responsável, com retomada` | G1, G2, G3 | A |
| C | `[CHORE] Roteiro da virada` | G3 | B. A ação externa e a verificação acontecem depois do merge |
| D (`v4`) | `[FEATURE] Migrar o trânsito sem contrapartida como migração no trânsito` | G1, G2, G3, G4 | `v4` aprovada e integrada; A, B e C integradas. O `db push` e a simulação acontecem depois do merge; `gravar` continua na ação externa de C |
| E (`v5`) | `[FEATURE] Posição implícita zero na cobertura da migração` | G1, G3 | `v5` aprovada e integrada; D integrada. A simulação acontece depois do merge; `gravar` continua na ação externa de C |

Uma PR por issue, cada uma com aprovação própria do merge. O encerramento vai numa PR própria (`chore/cycle-006-closure`), sem issue, autorizado pela aprovação do plano, com merge aprovado à parte. Ela só é aberta depois da verificação em produção e leva o relato da execução, a data de virada e a atualização da KB-003.

## Dependências e blockers

- O responsável coloca a cópia do SQLite em `local/` antes da primeira `simular` real, já na execução pós-merge da issue C. As issues A e B usam só dados fictícios.
- A primeira simulação real pode recusar por uma condição da precedência ou revelar casos fora de M1 a M10. Nesse caso, "Parado" e decisão com exemplos antes de gravar.
- Sessão do responsável válida durante `gravar`: o migrador usa a renovação de sessão; se ela expirar, a retomada cobre.
- **`v4`:** a ação externa da issue C fica suspensa antes de `gravar` até a issue D ser integrada, o `db push` da issue D ser feito e uma nova simulação ser aceita. Depois de M6, a simulação ainda pode recusar por M7 ou M10, que vêm depois na precedência; nesse caso, "Parado" com códigos e contagens.
- **`v5`:** a ação externa da issue C continua suspensa antes de `gravar` até a issue E ser integrada e uma nova simulação ser aceita, além do `db push` da issue D. A revisão da `v5` é a rodada 5, a última pelo teto de `_project/README.md`: um veredito não apto leva a "Parado".

## Riscos, suposições e rollback

- **Gravação parcial ou duplicada:** mitigada por destino vazio, trava de gravador único, diário por operação, parada sem reenvio quando a resposta se perde e retomada por prefixo exato. Um gravador fora do regime é detectado na comparação seguinte e leva a "Parado", sem nova escrita.
- **Rollback antes da confirmação da virada:** a origem continua intacta e congelada, então voltar a ela é só retomar o uso. Para limpar o destino, como nenhuma função apaga eventos, o caminho é excluir o usuário de destino no Supabase (a carteira sai em cascata pelas FKs `on delete cascade`) e entrar de novo. É ação humana externa e entra no roteiro.
- **Lançamentos na origem depois do congelamento:** o roteiro proíbe; a simulação recusa evento em mês aberto (M10), e a conferência compara com o SQLite copiado.
- **Direção em texto livre (M2):** frágil na origem, mas reproduzir a mesma leitura é o que gera os saldos de lá; a reconciliação acusa qualquer erro.
- **Histórico anterior às posições (M10):** meses só com consolidado não migram; a cópia do SQLite em `local/` os preserva.
- **Rentabilidade histórica diferente da origem:** esperada pelo Dietz (P11), pelo câmbio separado (M4), pelas transferências sem fluxo (M6) e pelos meses `N/D` (P15, O12). O aceite é sobre saldos e patrimônio, não sobre a rentabilidade da origem.
- **Suposição:** a origem é de um único usuário, o responsável. Se a simulação indicar outra coisa, "Parado".
- **Rentabilidade `N/D` pelo trânsito (`v4`):** cada mês com `migracao` no trânsito fica `N/D`, e os períodos que o incluem também (K1). É a consequência aceita de não saber se o dinheiro era novo ou veio de outro ativo; a variação do patrimônio continua calculável. Um par real único (caso a) evita esse efeito.
- **Par por coincidência (`v4`):** um `RESGATE` ou `APORTE` sem relação com o trânsito, mas com o mesmo valor e no mesmo mês, é pareado como transferência. Os saldos e o patrimônio não mudam; só a classificação do fluxo naquele mês. É o mesmo critério aprovado na `v3`.
- **Função nova ausente em produção (`v4`):** a sonda antes da primeira escrita impede a carga parcial; o roteiro manda fazer o `db push` antes de `gravar`.
- **Posições zeradas a mais no destino (`v5`):** os ativos zerados ganham uma posição 0 → 0 por mês até o fim do intervalo, que a origem não tinha. Patrimônio, componentes e retorno não mudam; a conferência compara essas posições com o relatório. Se um desses ativos voltasse a ter evento sem posição na origem, a ausência recusa, sem inferência.
- **Exceção à K12 alcançável pela API (`v4`):** qualquer usuário autenticado pode chamar a função sobre o próprio trânsito. O efeito fica restrito à própria carteira (G2), a interface não a oferece e o mês fica `N/D`, sem esconder a variação.

## Sequência recomendada

1. Revisão formal → "aprovo o plano do ciclo 006" → PR documental `chore/cycle-006-plan` → "aprovo o merge da PR #N" → apresentação dos payloads → confirmação → issues A, B e C.
2. Por issue, na ordem A → B → C: "autorizo a implementação da issue #N" → PR → "aprovo o merge da PR #N".
3. Ação externa (issue C): congelar, simular, conferir o relatório, gravar e conferir → "concluí a ação externa da issue #N".
4. "autorizo a verificação em produção do ciclo 006".
5. PR de encerramento, com relato, data de virada e KB-003 → "aprovo o merge da PR #N".

**Sequência da `v4`**, inserida entre os passos 2 e 3, porque a ação externa da issue C parou na simulação:

1. Revisão formal da `v4` (rodada 4) → "aprovo o plano do ciclo 006" → PR documental da `v4` → "aprovo o merge da PR #N" → payload da issue D → confirmação → issue D.
2. "autorizo a implementação da issue #N" (D) → PR → "aprovo o merge da PR #N".
3. Simulação local pelo agente, só com códigos e contagens. Outra recusa → "Parado". Aceita → para antes de `gravar`.
4. Ação externa da issue D: `db push` pelo responsável → "concluí a ação externa da issue #N" (D).
5. Retomada da ação externa da issue C a partir de `gravar`, um passo por vez, conforme o roteiro.

**Sequência da `v5`**, porque a simulação depois da issue D parou em M10:

1. Revisão formal da `v5` (rodada 5) → "aprovo o plano do ciclo 006" → PR documental da `v5` → "aprovo o merge da PR #N" → payload da issue E → confirmação → issue E.
2. "autorizo a implementação da issue #N" (E) → PR → "aprovo o merge da PR #N".
3. Simulação local pelo agente, só com códigos e contagens. Outra recusa → "Parado". Aceita → para antes de `gravar`.
4. Ação externa da issue D (`db push`), se ainda não feita.
5. Retomada da ação externa da issue C a partir de `gravar`, um passo por vez.

## Referências

- Ideação `_project/ideations/006_migracao_dados_virada.md`.
- ADR-002 (decisão 6), ADR-003 (privacidade e revogação).
- KB-001 (origem fixada em `1b13b03`), KB-002 (S12 e operação), KB-003, KB-004 (seções 4, 5, 7 e casos).
- `supabase/migrations/20261014185205_carteira.sql`.

## Rastreabilidade

| Campo | Valor |
| :-- | :-- |
| Issue(s) | A [#63](https://github.com/EuThiagoAndrade/saldo-futuro/issues/63), B [#64](https://github.com/EuThiagoAndrade/saldo-futuro/issues/64) e C [#65](https://github.com/EuThiagoAndrade/saldo-futuro/issues/65), fechadas pelos merges (a ação externa de C segue pendente); correção pela trilha curta [#70](https://github.com/EuThiagoAndrade/saldo-futuro/issues/70); D [#73](https://github.com/EuThiagoAndrade/saldo-futuro/issues/73), fechada pelo merge (ação externa de D pendente); E a criar depois da aprovação da `v5` |
| PR(s) | [#62](https://github.com/EuThiagoAndrade/saldo-futuro/pull/62) (plano, integrada); [#66](https://github.com/EuThiagoAndrade/saldo-futuro/pull/66) (issue A, integrada); [#68](https://github.com/EuThiagoAndrade/saldo-futuro/pull/68) (issue B, integrada); [#69](https://github.com/EuThiagoAndrade/saldo-futuro/pull/69) (issue C, integrada); [#71](https://github.com/EuThiagoAndrade/saldo-futuro/pull/71) (issue #70, integrada); [#72](https://github.com/EuThiagoAndrade/saldo-futuro/pull/72) (`v4`, integrada); [#74](https://github.com/EuThiagoAndrade/saldo-futuro/pull/74) (issue D, integrada) |
| Branch(es) | `chore/cycle-006-ideation` (rascunho local da `v1` a `v3`); `chore/cycle-006-plan` (PR #62); `chore/cycle-006-plan-v4` (PR #72); `feature/issue-73` (PR #74); `chore/cycle-006-plan-v5` (rascunho local da `v5`, sem commit) |
| Destino após conclusão | `_project/executed/006_migracao_dados_virada/006_plan.md` |

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 006 (completo)
Quem: Responsável
Conferir: [PR #75](https://github.com/EuThiagoAndrade/saldo-futuro/pull/75), checks remotos e o diff limitado ao plano, às tasks #65 e #73 e a `cycles.md`
Diga: "aprovo o merge da PR #75"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 006 + aprovar_plano + 006_plan + v5 (base 2470a26)`
- `effect_class`: `remote_mutation`
- `state_before`: plano `v5` `Em Revisão`, revisão `Concluída`, veredito `APTO COM RESSALVAS` (rodada 5), aprovação `Pendente (v5)`; rascunho local sem commit
- `state_after`: plano `v5` `Aprovado` (`Aprovada em 2026-10-18`); PR documental da `v5` aberta contra `main`; payload da issue E preparado, sem issue criada
- `result`: `executed`
- `evidence`: "aprovo o plano do ciclo 006" em 2026-10-18, posterior ao veredito da rodada 5; SHA-256 do corpo conferido (ver "Aprovação da `v5` e publicação documental"); validador e `git diff --check` verdes
- `blockers`: checks remotos e "aprovo o merge da PR #75"; depois, a confirmação do payload da issue E

## Revisão crítica

Uma subseção `### Rodada N` por rodada, com `Autor:`, `Revisor:` (ferramenta e modelo), achados `RN-k` (bloqueador ou ressalva), itens atendidos e veredito. O autor responde a cada achado numa subseção própria. Teto de 5 rodadas.

### Rodada 1

- **Autor:** não identificado no rascunho `v1`; ferramenta e modelo não informados no artefato.
- **Revisor:** Codex (GPT-6).
- **Data e autorização:** 2026-10-17; solicitação humana "revise o plano do ciclo 006". Autoriza a revisão formal e seu registro local.
- **Base:** branch `chore/cycle-006-ideation`, HEAD `49b930f`; plano local `v1`, ainda não versionado, recebido em `Rascunho`. O ciclo permanece em `Planejamento`, sem issues registradas e sem aprovação do plano. As alterações preexistentes em `cycles.md` e na ideação foram preservadas.
- **Autoridades e template:** `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, `.agent/workflows/revisar_plano.md`, `.agent/templates/plano_implementacao.md`, ADR-002, ADR-003 e KB-001 a KB-004. Conferidos também o workflow `criar_issues` e a skill `.agent/skills/governance-check/governance-check.md`.
- **Inspeção técnica:** migrações do destino, `src/lib/financeiro/`, `src/lib/leitura.ts`, `supabase/config.toml`, dependências e runtime local (`Node.js v24.15.0`). Código da origem consultado por `gh api` exclusivamente no commit `1b13b033ce4335c09df80237c8c31b96b37e3797`: modelos `event_sourcing.py` e `consolidado.py`, serviços `event_sourcing_service.py` e `event_sourcing_migration_service.py`. Nenhum SQLite real, sessão, relatório privado ou backend de produção foi acessado.

#### Achados bloqueadores

1. **R1-1 — Bloqueador: M7 não preserva a atomicidade das transferências de M6.** M7 substitui todos os eventos de um ativo e mês, mas uma transferência criada por `transferir` possui duas pernas inseparáveis, uma delas no trânsito, que não admite M7. Exemplo fictício em centavos: X começa com 100.000, há saída de 30.000 para o trânsito e o saldo final de referência de X é 80.000; uma divergência aciona M7, que propõe `migracao = -20.000`. Retirar apenas a perna de X deixa transferências somando +30.000 e o fechamento recusa por `identidade`; retirar a transferência inteira perde os 30.000 do trânsito; preservá-la junto com a migração proposta exige ajuste de +30.000 em X, contrariando o ajuste zero de M7. As três consequências foram reproduzidas com `previaFechamento`. **Correção necessária:** definir a precedência e o tratamento conjunto de M6/M7, inclusive referências de estorno a eventos convertidos, ou declarar parada antes de qualquer escrita nessas combinações. Acrescentar casos de referência e integração que conciliem X, trânsito e patrimônio juntos. A correção não pode escolher silenciosamente uma nova decomposição financeira.

2. **R1-2 — Bloqueador: M7 com diferença zero perde a informação de histórico desconhecido.** M7 manda não lançar evento quando `saldo_fim - saldo_anterior = 0`, embora classifique o mês como não reconciliável. P15 e `dietz` identificam migração pela existência de evento cujo tipo efetivo seja `migracao`; `lancar_evento` recusa valor zero. Em um mês posterior ao início, com Vi = Vf = 100.000 e os eventos substituídos por nenhum evento, a função existente devolveu retorno 0, e não `N/D`. Isso também afeta os acumulados que incluem o mês. No primeiro mês, se não sobrar evento algum, K7 impede iniciar o fechamento nesse mês. **Correção necessária:** explicitar a política para ambos os casos e sua viabilidade sem mudança de schema, ou parar antes de gravar; não fabricar eventos de compensação apenas para marcar o mês. Incluir os resultados esperados nos casos de referência e verificar a leitura pela aplicação, não apenas os saldos.

3. **R1-3 — Bloqueador: faltam referências para calcular o fallback e delimitar a cobertura.** M7 inclui "posição ausente com histórico" entre suas causas, mas sua fórmula exige justamente o `saldo_fim` da posição ausente. Há ainda uma representação comprovadamente possível na origem: `_popular_consolidado_saldo` cria meses fechados com patrimônio, enquanto `_popular_eventos_e_posicoes` popula posições/eventos só na faixa posterior de importação. Esses meses podem ter consolidado sem decomposição por ativo; isso é um fato do código, não uma constatação sobre o SQLite real. O destino exige que o primeiro fechamento coincida com o primeiro evento e depois não aceita lacunas. **Correção necessária:** definir como a simulação determina o intervalo, a lista completa de meses/ativos esperados, a consistência de `status`/`fechado` e a cobertura de posições; declarar parada para referência ausente ou contraditória até decisão do responsável. Caso se proponha outro tratamento ou recorte do histórico, apresentá-lo explicitamente para aprovação, sem assumir saldo zero, omitir mês ou inventar distribuição. Testar posição ausente, mês apenas com consolidado e lacuna entre meses fechados.

4. **R1-4 — Bloqueador: a regra de arredondamento e a precedência das recusas são ambíguas.** M2 não fixa o desempate ao arredondar o REAL e define recusa por resíduo acima de meio centavo. Se resíduo significa distância ao centavo mais próximo, essa distância já é, por construção, no máximo meio centavo: por exemplo, 1,234 vira 1,23 e passa pelo limiar. O critério não distingue artefato binário de entrada com casas adicionais; o empate de 1,005 também precisa de resultado definido. O código da origem usa `Decimal.quantize`, enquanto a KB-004 especifica outro contexto de arredondamento, de apresentação, que não deve ser aplicado por inferência à importação. Além disso, M2, item A e a lista de paradas recusam resíduo, mas M7 lista o mesmo caso como fallback. **Correção necessária:** propor conversão, tolerância e desempate precisos, com exemplos fictícios e resultados independentes, e separar inequivocamente as condições que recusam toda a simulação das que admitem M7. A decisão financeira fica para a aprovação do plano corrigido.

5. **R1-5 — Bloqueador: a retomada por prefixo não impede escrita duplicada concorrente.** O diário guarda apenas o último mês concluído e o plano não exige exclusividade do gravador. Duas instâncias podem ler o mesmo prefixo e ambas executar `criar_ativo` ou `lancar_evento`; essas RPCs criam UUIDs novos e não recebem chave idempotente. A trava de `private.travar_carteira` dura uma transação/RPC, então serializa as duas chamadas, mas não evita a segunda inserção. A divergência seria percebida depois de já gravada. **Correção necessária:** delimitar e impor o regime de único gravador, inclusive o uso da aplicação durante a carga, e vincular diário, destino e plano de operações imutável. Especificar a exceção à exigência de destino vazio para uma retomada comprovada. Exigir testes de segunda instância, resposta perdida depois do commit de criação/evento/transferência/fechamento e reexecução após conclusão; um prefixo ambíguo deve parar sem nova escrita. Se as funções atuais não sustentarem a garantia escolhida, aplicar a parada por mudança de escopo, em vez de prometer idempotência pelas travas existentes.

6. **R1-6 — Bloqueador: a issue C mistura entrega anterior à migração com evidência posterior a ela.** A ação externa só pode começar com o roteiro de C integrado. Contudo, C tem uma única PR, seus critérios exigem ação externa concluída e verificação em produção registrada, e sua ação técnica já remove a pendência de migração da KB-003. Exigir todos esses critérios no merge da PR cria uma dependência circular; marcar conclusão no merge do roteiro registraria um resultado ainda não ocorrido. **Correção necessária:** separar explicitamente o aceite da PR do roteiro do acompanhamento pós-merge e indicar em que artefato/PR serão integrados o relato sanitizado, a data da virada e a atualização factual da KB-003. Pode-se usar a PR de encerramento já prevista, se isso ficar definido. O merge do roteiro deve manter a execução real como pendente.

7. **R1-7 — Bloqueador: a tabela de aprovações amplia a autorização para efeitos remotos.** A linha "Aprovar plano" inclui o merge documental com checks verdes e a criação das issues após mera apresentação dos payloads. Existe divergência entre o fluxo completo de `_project/README.md` e `.agent/ai_behavior.md`: a autoridade canônica de autorização exige "Cada merge exige checks verdes e \"aprovo o merge da PR #N\", sem exceção". O workflow `criar_issues` também exige, sem modo contínuo, apresentar o payload **e obter a confirmação** antes de criar. Não há instrução humana atual dispensando esses pontos. **Correção necessária:** registrar a divergência e deixar explícitos, no plano e na sequência, a aprovação própria do merge documental e a confirmação dos payloads, preservando a aprovação do plano como autorização de preparar/publicar a PR. Isso não requer reformar a governança neste ciclo.

#### Ressalvas

8. **R1-8 — Ressalva: M6 não define a data quando o par tem dias diferentes.** O pareamento exige mesmo mês e valor, mas a regra geral preserva as datas da origem e `transferir` gera ambas as pernas na mesma data. Um resgate em 05/03 e trânsito em 06/03 satisfazem M6 sem permitir preservar as duas datas. Explicitar parada para esse caso ou propor a data escolhida para aprovação, com exemplo e teste. A simulação também deve provar que cada evento é consumido uma única vez no pareamento.

9. **R1-9 — Ressalva: explicitar a completude da leitura na conferência e na retomada.** A Data API está limitada a 1.000 linhas por resposta (`supabase/config.toml`); o repositório já possui paginação, contagem exata e conferência de coerência em `src/lib/leitura.ts`. A baseline real é desconhecida, mas os testes propostos não cobrem uma carteira maior que esse limite. Exigir leitura completa e coerente, reutilizando o contrato existente, e caso fictício com mais de 1.000 eventos, inclusive falha de página e alteração entre leituras. A igualdade dos saldos de um subconjunto não deve ser aceita como reconciliação completa.

#### Itens atendidos e validação

- Nível completo e modo contínuo `—` são coerentes com G1/G2. As responsabilidades humanas pela carga real e os pontos separados de implementação, ação externa e verificação estão identificados.
- Escopo exclui sincronização contínua, interface de importação, benchmarks da origem e dependência nova. O tipo `migracao`, as funções autenticadas e a exclusão em cascata citados existem no schema. O uso de sessão do responsável e a ausência de bypass por chave de serviço são compatíveis com G2.
- Os limites de G3 e a separação entre dados reais em `local/` e fixtures fictícias estão descritos. A ausência de baseline real foi declarada honestamente e não foi preenchida por suposição nesta revisão.
- Diagnóstico somente leitura, sem criar testes ou alterar código: funções TypeScript existentes carregadas por transpilações em memória; reproduzidos os três tratamentos de transferência do R1-1, retorno 0 no R1-2 e a recusa `estorno_invalido` ao tentar estornar uma perna convertida por M6. Todos os dados do diagnóstico foram fictícios.
- `node --test scripts/validate-governance.test.mjs`: primeira execução com 36/39 passando e três erros de `rename` por `EPERM` no temporário do sandbox. Reexecução com `TEMP`/`TMP` em `local/cycle-006-review-temp/`: **39/39 passaram**, sem alteração dos testes.
- `node scripts/validate-governance.mjs`: **0 erros e 0 avisos**. `git diff --check`: limpo. A validação estrutural não cobre os bloqueadores semânticos acima. As autorizações históricas foram conferidas como registros nos artefatos; suas mensagens originais não estão disponíveis nesta conversa para confirmação independente.
- Corpo de `## Problema e contexto` até antes de `## Próximo passo` preservado, SHA-256 `c433bee8673e10a9a1c3b589cd6089176261d9c4b5822e4062384c88d4f11364`. Somente status/revisão/veredito, bloco de próximo passo e esta seção de revisão foram alterados.

**Veredito: `REQUER NOVA RODADA`.** Sete bloqueadores (R1-1 a R1-7) e duas ressalvas (R1-8 e R1-9). Primeira rodada, sem histórico de oscilação ou falta de progresso. O autor deve responder a cada achado, corrigir ou contestar com justificativa, incrementar a versão e preservar esta rodada. O plano permanece sem aprovação; não houve criação de issue, implementação, PR, merge ou ação em produção.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 006 + revisar_plano + 006_plan/rodada-1 + v1`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `006` em `Planejamento`; plano local `v1` em `Rascunho`; revisão e veredito `Pendente`; aprovação humana `Pendente`; situação `Aguardando revisão (rodada 1)`.
- `state_after`: ciclo `006` em `Planejamento`; plano `v1` em `Em Revisão`; revisão `Concluída`; veredito `REQUER NOVA RODADA`; aprovação humana `Pendente`; situação `Aguardando correções (rodada 1)`.
- `result`: `executed`
- `evidence`: solicitação humana desta revisão; cabeçalho e próximo passo atualizados; achados R1-1 a R1-9 nesta rodada; inspeções locais e código remoto fixado descritos acima; diagnósticos fictícios; 39/39 testes de governança; validador sem erros/avisos; corpo do plano preservado pelo SHA-256 acima.
- `blockers`: R1-1 a R1-7 em aberto. Aguarda autorização ao autor para corrigir o plano; esta revisão não executa nem autoriza o workflow seguinte.

### Resposta do autor à rodada 1

- **Autor:** Claude Code (Claude Opus 5.5), também autor do `v1`.
- **Data e autorização:** 2026-10-17; solicitação humana "corrija o plano do ciclo 006".
- **Versão:** `v1` → `v2`. A rodada 1 acima foi preservada sem alteração.
- **Base conferida:** `.agent/ai_behavior.md` (linha do merge), `.agent/workflows/criar_issues.md` (confirmação do payload), `src/lib/leitura.ts` e `supabase/config.toml` (`max_rows = 1000`) e as funções de `20261014185205_carteira.sql`, inclusive `corrigir_transferencia`.

| Achado | Resposta | Onde |
| :-- | :-- | :-- |
| R1-1 | **Corrigido.** M7 passa a preservar inteiras as transferências de M6 e desconta suas pernas do valor da `migracao`; o exemplo do revisor fecha com `migracao` de +10.000, ajuste zero, trânsito com 30.000 e identidade conferida. Estorno de evento convertido por M6 só vira `corrigir_transferencia` quando o par inteiro é estornado na mesma data; senão, recusa total. A precedência é proposta para decisão na aprovação, com exemplo, e não escolhida em silêncio | M5, M6, M7; testes e casos `CR-M*` |
| R1-2 | **Corrigido.** `migracao` de valor zero agora recusa a simulação inteira ("Parado"), sem fabricar evento de compensação. No primeiro mês, a `migracao` diferente de zero é o evento que satisfaz K7, e M10 exige ao menos um evento não calculado. Os casos esperados incluem a rentabilidade `N/D` no mês e no acumulado, e a integração confere a leitura pela aplicação | M7, M10; estratégia de testes |
| R1-3 | **Corrigido.** A nova regra M10 define mês fechado (`status` e `fechado` concordantes), intervalo, ativos esperados por mês, consistência de `valor_total` e as recusas para posição ausente, lacuna e contradição. "Posição ausente" saiu das causas de M7. Os meses só com consolidado antes do intervalo **não migram**, recorte apresentado explicitamente para aprovação, com exemplo e contagem no relatório, sem saldo presumido nem distribuição inventada | M7, M10; riscos |
| R1-4 | **Corrigido.** M2 deixa de arredondar: aceita só representações com até duas casas (a decimal mais curta do `float64`, `INTEGER` ou `TEXT` estrito), converte pelos dígitos e recusa todo o resto, inclusive 1,005 e 1,234. Sem arredondamento não há desempate. O resíduo saiu das causas de M7, e a "precedência das recusas" separa as duas listas sem sobreposição | M2, M7, precedência das recusas |
| R1-5 | **Corrigido.** Entraram: plano imutável com hashes ligados ao SQLite e ao usuário; trava de gravador único em `local/`; diário por operação com intenção e resultado; releitura obrigatória depois de resposta perdida, sem repetir às cegas; comparação por multiconjunto; e a exceção ao destino vazio, restrita à retomada comprovada. Um gravador fora do regime não é impedido pelas funções existentes; o plano declara esse limite e para na comparação seguinte. Se os testes da issue B não sustentarem as garantias, a situação passa a "Parado" | Mecanismo de execução; item 2; testes |
| R1-6 | **Corrigido.** A issue C entrega só o roteiro, com a execução pendente no merge. A ação externa e a verificação ficam como acompanhamento pós-merge, e o relato sanitizado, a data de virada, a KB-003 e o ajuste de texto da KB-004 vão para a PR de encerramento | Item 3; decomposição; sequência |
| R1-7 | **Corrigido.** A aprovação do plano cobre preparar e publicar a PR documental e apresentar os payloads. O merge documental exige "aprovo o merge da PR #N", e a criação das issues exige a confirmação dos payloads, numa linha própria da tabela. A divergência entre `_project/README.md` e `.agent/ai_behavior.md` ficou registrada como relato, sem reforma de governança neste ciclo | Pontos de aprovação; sequência |
| R1-8 | **Corrigido.** A transferência usa a data mais tardia do par, com exemplo e a justificativa de que a transferência não é fluxo (P6). Par em outro mês ou ambíguo recusa, e o consumo único é exigido e testado | M6; testes |
| R1-9 | **Corrigido.** A conferência e a retomada leem pelo contrato de `src/lib/leitura.ts`, com paginação, contagem exata e recusa por mudança. Há caso fictício com mais de 1.000 eventos, falha de página e mudança entre leituras, e reconciliação parcial não é aceita | Mecanismo de execução; testes |

Nenhum achado foi contestado. Os pontos de regra financeira (M2, M5 a M7 e M10) seguem como propostas com exemplos, a decidir pelo responsável na aprovação do plano.

### Rodada 2

- **Autor:** Claude Code (Claude Opus 5.5), conforme a resposta do autor à rodada 1.
- **Revisor:** Codex (GPT-6).
- **Data e autorização:** 2026-10-17; solicitação humana "revise o plano do ciclo 006". Revisão formal da `v2`, sem aprovação ou implementação.
- **Base:** branch `chore/cycle-006-ideation`, HEAD `49b930f`; plano local `v2` em `Em Revisão`, revisão `Em andamento`, veredito anterior `REQUER NOVA RODADA`, aprovação humana `Pendente`, situação `Aguardando revisão (rodada 2)`. Ciclo `006` em `Planejamento`; issues e PRs não registradas no plano. Localizada a rodada 1 e a resposta do autor; não existia rodada 2 para reconciliar.
- **Autoridades e template:** `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, workflow `revisar_plano` e `.agent/templates/plano_implementacao.md` relidos. Conferidos as respostas R1-1 a R1-9, as regras M1 a M10, as funções financeiras e as funções de escrita do banco. A inspeção da origem reutiliza o conteúdo do commit imutável `1b13b033ce4335c09df80237c8c31b96b37e3797`, obtido por `gh api` na rodada 1; não pressupõe código corrente ou dados reais.

#### Conferência das respostas à rodada 1

| Achado anterior | Resultado da conferência da v2 |
| :-- | :-- |
| R1-1 | **Parcialmente atendido.** A fórmula passa a descontar a transferência preservada e resolve o exemplo original de X/trânsito. A nova composição com `corrigir_transferencia` ainda precisa de correção; ver R2-2 |
| R1-2 | **Atendido no plano.** M7 zero agora recusa toda a simulação, sem fabricar evento; os testes incluem início da carteira, mês e acumulado |
| R1-3 | **Atendido no plano.** M10 define cobertura, consistência e recusas; o recorte dos meses só com consolidado está explícito como proposta sujeita à aprovação |
| R1-4 | **Atendido no plano.** M2 propõe conversão estrita pelos dígitos, sem arredondamento, com recusas separadas de M7. A decisão continua sujeita à aprovação humana |
| R1-5 | **Parcialmente atendido.** Plano imutável, diário por operação, exclusividade local e limite de uso estão definidos. A recuperação após resposta desconhecida ainda pode duplicar escrita; ver R2-1 |
| R1-6 | **Atendido no plano.** A PR C entrega só o roteiro; execução e verificação ficam depois do merge, com evidências e atualização factual das KBs no encerramento |
| R1-7 | **Atendido no plano.** Merge documental e confirmação dos payloads têm autorizações próprias; a divergência das autoridades foi registrada |
| R1-8 | **Atendido no plano.** M6 propõe a data mais tardia dentro do mês e exige unicidade nos dois sentidos e consumo único, com casos de teste |
| R1-9 | **Atendido no plano.** Paginação, contagem e recusa por mudança constam do contrato de leitura; há cenário acima de 1.000 eventos e falha de página |

#### Achados bloqueadores

1. **R2-1 — Bloqueador: ausência numa releitura não autoriza repetir uma RPC com resultado desconhecido.** Na seção "Resposta perdida", a v2 manda repetir se o destino ainda corresponder ao prefixo anterior. Um timeout ou rompimento da conexão do cliente não demonstra que a transação original terminou: a leitura pode ocorrer antes do commit da primeira chamada. Exemplo de interleaving permitido pelas funções existentes: (1) `lancar_evento` é enviado; (2) o cliente perde a resposta enquanto a chamada ainda executa; (3) a releitura vê o prefixo anterior; (4) o migrador repete; (5) a primeira chamada e a repetição inserem eventos com UUIDs diferentes. A trava transacional serializa essas inserções, mas não elimina a segunda. Isso pode acontecer com um único processo, dentro do regime da v2, portanto a trava local não resolve. O teste proposto interrompe apenas **depois do commit** e não cobre esse intervalo. Há também uma lacuna na comparação: ativos só por nome e tipo de ajuste não distinguem o prefixo antes/depois de `desativar_ativo`; repetir uma desativação já aplicada recusa `ativo_invalido`. **Correção necessária:** depois de envio com resultado desconhecido, permitir repetição apenas com evidência de término sem efeito da chamada original, ou parar sem repetir automaticamente quando essa evidência não existir; observar ausência em uma ou várias leituras não basta, nem um tempo de espera arbitrário. A comparação dos prefixos precisa incluir os efeitos de cada operação, inclusive o estado ativo/desativado e as duas pernas/referências das transferências. Exigir teste com a primeira RPC ainda em andamento durante a releitura, além dos casos pós-commit, e cobrir resposta perdida de `estornar_evento`, `corrigir_transferencia` e `desativar_ativo`. Se a garantia depender de mudar o banco, aplicar a parada de escopo já prevista, sem criar essa mudança nesta revisão.

2. **R2-2 — Bloqueador: a nova regra de correção de transferência não está compatível com o trânsito da origem nem inteiramente preservada em M7.** M5 converte um par de estornos em `corrigir_transferencia`, que reduz também o trânsito no destino. Porém, no código fixado da origem, `_saldo_transferencia_pendente` seleciona apenas eventos cujo próprio `tipo_evento` é `TRANSFERENCIA_PENDENTE`; eventos `ESTORNO` ficam fora desse saldo, mesmo quando referenciam trânsito. A criação manual da origem também exige `ativo_id` para `ESTORNO`, ao contrário de `TRANSFERENCIA_PENDENTE`. Assim, não se pode presumir que "estornar a outra metade" da origem desfaça o saldo de trânsito como a função do destino faz. Num exemplo fictício com trânsito +30.000 e um `ESTORNO` referenciando-o, o filtro da origem continua apurando 30.000, enquanto a correção do destino o devolve a zero. Mesmo isolando essa incompatibilidade da origem, M7 preserva explicitamente as transferências de M6, mas substitui os demais eventos "inclusive estornos", sem preservar as duas pernas de correção geradas por M5 nem definir sua inclusão na soma usada na fórmula. Exemplo fictício independente, em centavos: X começa com 100.000; uma transferência de 30.000 para o trânsito é totalmente corrigida no mesmo mês; outro motivo exige M7, com saldo final de X de 110.000 e trânsito zero. Aplicar literalmente a remoção do estorno de X preservando o do trânsito provoca `recusado_identidade`. Preservar ambos os estornos, mas descontar só os eventos de tipo literal `transferencia`, produz `migracao` de 40.000 e ajuste de -30.000, contrariando o ajuste zero de M7. Os dois resultados foram reproduzidos com as funções existentes. **Correção necessária:** definir como esses estornos serão recusados ou mapeados respeitando os saldos efetivamente calculados pela origem, sem presumir uma redução de trânsito inexistente nela. Se o suporte a correções for mantido, explicitar a atomicidade da operação inteira também em M7 e a soma por tipo efetivo que sua fórmula usa. Incluir casos independentes para estorno referenciando trânsito na origem e para correção de transferência no mesmo mês de M7, conferindo ambos os ativos, trânsito, componentes, ajuste e patrimônio. As regras financeiras corrigidas continuam como propostas para aprovação posterior; esta revisão não escolhe uma interpretação para o responsável.

#### Evidências e validação

- As demais correções da v2 foram verificadas no texto, nos critérios e nos testes propostos; isso não equivale a executar a migração ainda inexistente. G1/G2 seguem aplicáveis, modo contínuo `—` e aprovação humana `Pendente`.
- Em `supabase/migrations/20261014185205_carteira.sql`, `private.travar_carteira` usa `pg_advisory_xact_lock`; `lancar_evento`/`transferir` criam novas linhas sem chave idempotente; `desativar_ativo` recusa ativo já desativado; `corrigir_transferencia` insere duas linhas `estorno` ligadas à transferência. São as precondições materiais da análise de R2-1/R2-2.
- Origem: `backend/app/services/event_sourcing_service.py`, funções `criar_evento_manual`, `_valor_assinado` e `_saldo_transferencia_pendente`, no commit completo citado acima. A evidência é código, não leitura do SQLite real.
- Diagnóstico fictício somente em memória, sem alterar código ou criar testes: `criarTransferencia`, `corrigirTransferencia` e `previaFechamento` existentes reproduziram a recusa por identidade e o ajuste -30.000 descritos em R2-2. Como controle matemático do segundo exemplo, conservar ambas as correções e considerar seu tipo efetivo produz `migracao` de 10.000, ajuste zero, X 110.000 e trânsito zero; isso demonstra a diferença entre as interpretações, sem decidir que o caso deve ser aceito pela regra da origem. Um SQLite fictício em memória confirmou que filtrar pelo tipo literal de trânsito exclui `ESTORNO`.
- `node --test scripts/validate-governance.test.mjs`, com `TEMP`/`TMP` em `local/cycle-006-review-temp/`: **39/39 passaram**. `node scripts/validate-governance.mjs`: **0 erros e 0 avisos**. `git diff --check`: limpo. A análise dos bloqueadores é semântica e não é coberta pelo validador documental.
- Corpo da v2 de `## Problema e contexto` até antes de `## Próximo passo` preservado: SHA-256 `7242a3ba4936a5714bedaaed75e4f5bc00bcaf6a9c051f28fef8c12cdb97156f`. A rodada 1 e a resposta do autor foram preservadas integralmente. Só revisão/status, próximo passo e esta nova rodada foram alterados. `cycles.md` e a ideação permaneceram intactos; nenhum dado real, sessão ou backend de produção foi acessado.

**Veredito: `REQUER NOVA RODADA`.** Dois bloqueadores, R2-1 e R2-2. Houve progresso material: cinco dos sete bloqueadores originais e ambas as ressalvas foram atendidos no plano; R1-1 e R1-5 tiveram correções parciais, agora delimitadas pelos dois achados. Não houve reversão de correção já validada como completa por um parecer anterior, contestação persistente ou oscilação; a situação é `Aguardando correções (rodada 2)`. O autor deve responder a R2-1/R2-2, incrementar a versão e preservar as duas rodadas. Este parecer não aprova o plano, não autoriza implementação e não executa a correção.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 006 + revisar_plano + 006_plan/rodada-2 + v2`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `006` em `Planejamento`; plano `v2` em `Em Revisão`; revisão `Em andamento`; veredito anterior `REQUER NOVA RODADA`; aprovação humana `Pendente`; situação `Aguardando revisão (rodada 2)`.
- `state_after`: ciclo `006` em `Planejamento`; plano `v2` em `Em Revisão`; revisão `Concluída`; veredito `REQUER NOVA RODADA`; aprovação humana `Pendente`; situação `Aguardando correções (rodada 2)`.
- `result`: `executed`
- `evidence`: solicitação humana da revisão; conferência das nove respostas; achados R2-1/R2-2 e diagnósticos fictícios acima; 39/39 testes de governança; validador sem erros/avisos; corpo da v2 e histórico de revisão preservados.
- `blockers`: R2-1 e R2-2 em aberto. Aguarda autorização ao autor para corrigir o plano; sem issue, PR, implementação, merge ou ação em produção nesta rodada.

### Resposta do autor à rodada 2

- **Autor:** Claude Code (Claude Opus 5.5).
- **Data e autorização:** 2026-10-17; solicitação humana "corrija o plano do ciclo 006".
- **Versão:** `v2` → `v3`. As rodadas 1 e 2 e a resposta à rodada 1 foram preservadas sem alteração.

| Achado | Resposta | Onde |
| :-- | :-- | :-- |
| R2-1 | **Corrigido.** Depois de uma resposta perdida, o migrador nunca reenvia: as funções existentes não oferecem evidência de término sem efeito, e uma releitura ou uma espera não bastam. A operação fica `desconhecida` e a carga para. Na retomada, só o efeito completo encontrado exatamente uma vez a dá por aplicada; ausência, efeito parcial ou duplicado mantêm a carga parada, e a saída é decisão humana (esperar e reconferir, ou rollback). A idempotência real exigiria mudar o banco e fica como parada por escopo, fora deste ciclo. A comparação passou a cobrir o estado ativo/desativado e as transferências como unidade (cabeçalho e duas pernas). Os testes ganharam a chamada ainda em execução durante a releitura (trava segurada por uma sessão de teste), os casos pós-commit de `estornar_evento` e `desativar_ativo` e a operação desconhecida sem efeito. `corrigir_transferencia` saiu da lista porque deixou de ser gerada (R2-2) | Mecanismo de execução; item 2; testes |
| R2-2 | **Corrigido, por recusa.** O suporte a correção de transferência foi retirado. Um `ESTORNO` que referencia `TRANSFERENCIA_PENDENTE` ou evento consumido por M6 recusa a simulação inteira, porque na origem ele altera o ativo do estorno e não o saldo do trânsito, efeito que o destino não reproduz. A recusa não presume nenhuma redução de trânsito. Sem correções, as únicas pernas são eventos de tipo `transferencia`, e a soma usada em M7 ficou explícita. Os casos independentes cobrem o estorno referenciando trânsito, que recusa; o exemplo de correção no mesmo mês de M7 deixa de existir, porque essa combinação recusa antes. Se a simulação real encontrar esses estornos, o caso volta ao responsável com exemplos | M5, M7, precedência das recusas; testes |

Nenhum achado foi contestado. As regras financeiras alteradas (M5 e M7) seguem como propostas, a decidir pelo responsável na aprovação do plano.

### Rodada 3

- **Autor:** Claude Code (Claude Opus 5.5), conforme a resposta do autor à rodada 2.
- **Revisor:** Codex (GPT-6).
- **Data e autorização:** 2026-10-17; solicitação humana "revise o plano do ciclo 006". Revisão formal da `v3` e registro local do parecer.
- **Base:** branch `chore/cycle-006-ideation`, HEAD `49b930f`; plano local `v3` em `Em Revisão`, revisão `Em andamento`, veredito anterior `REQUER NOVA RODADA`, aprovação humana `Pendente`, situação `Aguardando revisão (rodada 3)`. Ciclo `006` em `Planejamento`; nenhuma issue ou PR registrada no plano. Localizadas as duas rodadas anteriores e as respostas do autor; não existia rodada 3 para reconciliar.
- **Autoridades e template:** `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, workflow `revisar_plano`, `.agent/templates/plano_implementacao.md` e checklist `governance-check` conferidos. Revisados o corpo completo da v3, as diferenças para a v2, as respostas R2-1/R2-2 e a manutenção das correções anteriores. Conferidas as funções de escrita e a trava da carteira em `supabase/migrations/20261014185205_carteira.sql`, além do contrato de leitura em `src/lib/leitura.ts` e do limite de 1.000 linhas em `supabase/config.toml`. O código imutável da origem, no commit `1b13b033ce4335c09df80237c8c31b96b37e3797`, permanece a evidência histórica já consultada nas rodadas anteriores.

#### Conferência dos bloqueadores da rodada 2

| Achado | Resultado |
| :-- | :-- |
| R2-1 | **Atendido no plano.** A v3 elimina o reenvio automático após resultado desconhecido: registra `desconhecida`, para sem nova escrita e não trata ausência ou espera como prova de término. A retomada só reconhece a operação quando seu efeito completo aparece exatamente uma vez; ausência, efeito parcial ou duplicado mantêm a parada. A comparação inclui estado ativo/desativado, referências de estorno, cabeçalho e ambas as pernas de transferência, posições e consolidado. Os testes agora incluem a chamada ainda em andamento durante a releitura, usando a trava transacional existente, além dos efeitos pós-commit de todas as RPCs utilizadas. Não há dependência de uma garantia de idempotência que o banco atual não oferece |
| R2-2 | **Atendido no plano, por recusa explícita.** M5 recusa a simulação inteira para estorno que referencia trânsito ou evento consumido por M6; a regra, sua precedência e os casos de teste estão alinhados. `corrigir_transferencia` saiu das operações geradas e do item B. Sem correções de transferência no conjunto aceito, M7 preserva inteiras as transferências e define expressamente a soma das pernas pelo tipo `transferencia`. O caso que causava divergência do trânsito ou remoção de uma perna de correção não chega à gravação |

#### Achados e itens atendidos

- **Novos achados bloqueadores:** nenhum. **Novas ressalvas:** nenhuma.
- As correções verificadas anteriormente continuam presentes: conversão monetária sem arredondamento; recusas separadas do fallback; M7 zero recusado; cobertura e consistência definidas por M10; consumo único e data de M6; leitura completa; separação entre PR do roteiro e acompanhamento pós-merge; aprovação própria dos merges e confirmação dos payloads.
- Objetivo, não-escopo, sequência A → B → C, dependências, aceite e encerramento são compatíveis. As regras financeiras M1 a M10 continuam propostas para decisão humana na aprovação do plano, com casos fictícios e conferência independente exigidos em G1. O revisor não promoveu essas propostas a decisões aprovadas.
- G2 mantém escrita autenticada nas funções existentes e testes locais de isolamento. G3 mantém SQLite, sessão, diário e relatório detalhado em `local/`, com evidências sanitizadas. G4 continua sem migração de schema prevista; a necessidade de alterar o banco é condição explícita de parada e revisão de escopo.
- Os limites já descritos no plano continuam integrantes do escopo submetido à aprovação: meses só com consolidado anteriores ao intervalo de M10 não migram; alguns dados da origem podem causar recusa integral; uma operação desconhecida sem efeito comprovado pode exigir decisão humana ou rollback; gravador único e aplicação sem uso são precondições operacionais. A baseline real permanece desconhecida e será obtida pelo responsável na simulação real, sem presumir que os dados passarão por todas as regras.
- Esta aptidão é do plano. Testes de integração do migrador, conferência financeira da implementação e execução real permanecem entregas futuras, nos pontos de autorização já definidos.

#### Validação e preservação

- `node --test scripts/validate-governance.test.mjs`, com `TEMP`/`TMP` em `local/cycle-006-review-temp/`: **39/39 passaram**.
- `node scripts/validate-governance.mjs`: **0 erros e 0 avisos**. `git diff --check`: limpo. Referências, semântica das barreiras e coerência do próximo passo conferidas manualmente. As autorizações históricas permanecem registros dos artefatos; suas mensagens originais não foram novamente fornecidas nesta conversa.
- Corpo da v3, de `## Problema e contexto` até antes de `## Próximo passo`, preservado: SHA-256 `f9889689c8aa67476668933c9fc65a3c723ab6c7c6a540be908d8683d4b50a1f`. As rodadas 1 e 2 e ambas as respostas do autor foram preservadas. Somente os campos de revisão/veredito, o próximo passo e esta nova rodada foram alterados.
- As alterações preexistentes em `cycles.md` e na ideação foram preservadas. Código e migrações permaneceram inalterados. Nenhum dado real, sessão, relatório privado ou backend de produção foi acessado nesta revisão. Não houve criação de issue, implementação, PR ou merge.

**Veredito: `APTO PARA APROVAÇÃO`.** R2-1 e R2-2 atendidos, sem novos bloqueadores ou ressalvas. Os bloqueadores diminuíram de dois para zero, sem oscilação ou retorno de achado já resolvido. Plano `v3` permanece em `Em Revisão`, com revisão `Concluída` e aprovação humana `Pendente`; ciclo `006` permanece em `Planejamento`. A situação passa a `Aguardando aprovação do plano`. Este parecer não aprova o plano nem autoriza a implementação ou o workflow seguinte.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 006 + revisar_plano + 006_plan/rodada-3 + v3`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `006` em `Planejamento`; plano `v3` em `Em Revisão`; revisão `Em andamento`; veredito anterior `REQUER NOVA RODADA`; aprovação humana `Pendente`; situação `Aguardando revisão (rodada 3)`.
- `state_after`: ciclo `006` em `Planejamento`; plano `v3` em `Em Revisão`; revisão `Concluída`; veredito `APTO PARA APROVAÇÃO`; aprovação humana `Pendente`; situação `Aguardando aprovação do plano`.
- `result`: `executed`
- `evidence`: solicitação humana desta revisão; resposta do autor à rodada 2; conferência de R2-1/R2-2 e das regras, critérios, testes e funções referenciados acima; 39/39 testes de governança; validador sem erros/avisos; corpo da v3 e histórico de revisão preservados.
- `blockers`: nenhum achado de revisão em aberto. Aguarda manifestação humana posterior ao veredito, "aprovo o plano do ciclo 006", antes da promoção do plano e da preparação/publicação documental.

### Abertura da `v4` (autor)

- **Autor:** Claude Code (Claude Opus 5.5).
- **Data e autorização:** 2026-10-18. A instrução do responsável está no cabeçalho (`Autorização da revisão v4`). Ela decide a alternativa A e as regras 1 a 4 e pede esta revisão; não aprova a `v4`.
- **Motivo:** caso não coberto revelado pela primeira simulação real (ver "Contexto e baseline"), condição de parada prevista neste plano. A `v3` foi aprovada e entregue nas issues A, B e C; a `v4` não reabre essas entregas.
- **Base:** `main` em `b580334`, com o plano `v3` integrado. O diff da `v4` contra essa base é o objeto da rodada 4.
- **O que muda:** cabeçalho; contexto (semântica do trânsito na origem e resultado da simulação, só com contagem); escopo (uma migração aditiva); "Decisões do responsável (revisão v4 de M6)"; M6, precedência das recusas e a exceção à K12; mecanismo (operação nova, sonda antes da primeira escrita); pontos de aprovação da `v4`; G1 a G4; testes; item 4 (D); arquivos; decomposição; dependências; riscos; sequência; rastreabilidade; próximo passo e handoff.
- **O que não muda:** M1 a M5 e M7 a M10, o mecanismo de gravação aprovado e as entregas integradas.
- **Teto de rodadas:** a revisão da `v4` é a rodada 4; o teto de `_project/README.md` é 5. Se a rodada 4 não for apta e a 5 também não, o ciclo vai a "Parado".
- **Validação do rascunho:** `node --test scripts/validate-governance.test.mjs` (39/39, com `TEMP`/`TMP` em `local/`); `node scripts/validate-governance.mjs` (0 erros, 0 avisos, 4 verificações manuais); `git diff --check` limpo. Nenhum código, migração ou dado real foi alterado ou lido para esta versão.

### Rodada 4

- **Autor:** Claude Code (Claude Opus 5.5), conforme "Abertura da `v4` (autor)".
- **Revisor:** Codex (GPT-6).
- **Data e autorização:** 2026-10-18; solicitação humana "revise o plano do ciclo 006". Autoriza a revisão formal da `v4` e o registro local do parecer.
- **Base e reconciliação:** branch `chore/cycle-006-plan-v4`, HEAD `b5803344b6ff04b41ce1527794762d1f6e0b6bf8`, igual à `main` remota observada. Plano local `v4` em `Em Revisão`, revisão/veredito/aprovação pendentes para esta versão; situação `Aguardando revisão (rodada 4)`. Ciclo `006` em `Em execução`, próximo ciclo `007`, task #65 `Bloqueada`. Não havia rodada 4 nem resultado com esta chave lógica. O GitHub confirmou os merges das PRs #66, #68, #69 e #71 e a issue #65 fechada; não havia PR aberta da `v4` nem issue com o título proposto para D. A ausência de gravação real é relato registrado pelo autor, não uma nova conferência do destino nesta revisão.
- **Autoridades e template no ponto de uso:** `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, `.agent/workflows/revisar_plano.md`, `.agent/templates/plano_implementacao.md`, checklist `.agent/skills/governance-check/governance-check.md`, ADR-002, ADR-003 e KB-001 a KB-004. A autorização histórica e a decisão financeira de 2026-10-18 foram conferidas como registros do plano; as mensagens originais não foram novamente fornecidas nesta conversa.
- **Objeto:** o escopo acrescentado pela `v4`, sua compatibilidade com as entregas A/B/C integradas e a preservação das correções das rodadas anteriores. Esta rodada não reabre a aprovação da `v3` nem executa a simulação real pré-autorizada para depois do merge de D.

#### Ressalvas

1. **R4-1 — Ressalva: explicitar a atualização do teste de permissões existente na issue D.** `supabase/tests/database/03_funcoes.test.sql` contém listas fechadas de assinaturas executáveis por `authenticated`, além da conferência de `security definer`. A assinatura `lancar_migracao_transito(date,bigint)` ainda não está nelas; conceder a permissão prevista na `v4` fará a asserção de funções permitidas falhar, mesmo que o teste novo da issue D passe. O item D e os arquivos afetados destacam um teste novo, sem nomear essa adaptação. **Encaminhamento:** incluir no payload/execução de D a nova assinatura nas listas aplicáveis e na conferência de `security definer`, mantendo a detecção de função fora da lista e as recusas para `PUBLIC`/`anon`. É manutenção necessária do teste G2 dentro do escopo já autorizado à futura issue, sem ampliar permissões genéricas. Não bloqueia a aprovação do plano: o gate obrigatório `supabase test db` já impede integrar D sem resolver essa incompatibilidade.

2. **R4-2 — Ressalva: o hash do conteúdo não invalida por si só o formato anterior do plano de operações.** O item D afirma que "o hash do plano já impede usar um plano antigo". Em `src/lib/migracao/tipos.ts`, o formato atual é `versao: 1`; `hashDoPlano` em `gravar.ts` recalcula o hash dos campos do próprio artefato, e o preflight aceita a versão 1 com esse hash válido. Um plano antigo intacto continua passando nessa conferência; mudar a lista de operações gerada por uma simulação nova não altera o hash já salvo no antigo. **Encaminhamento:** explicitar na issue D a versão aceita do formato após a mudança e a recusa de versões anteriores antes de qualquer escrita, com teste; manter a regeneração pela nova simulação como caminho operacional, sem conversor. Isso concretiza a mudança de formato já prevista. A ressalva não bloqueia esta revisão porque, conforme o histórico registrado, a simulação real recusou e nenhum plano real válido foi produzido ou aplicado; não há compatibilidade de carga real a preservar. O hash continua sendo uma garantia de integridade, não evidência da versão das regras usadas para gerar o plano.

#### Itens atendidos e limites

- **Bloqueadores:** nenhum. As ressalvas acima tratam de compatibilidade dos testes e do formato de artefato; não exigem nova interpretação financeira nem alteram a alternativa A decidida pelo responsável.
- M6 distingue par único, ausência de candidato e ambiguidade nos dois sentidos, preserva consumo único e data do par e mantém o trânsito fora de M7. A recusa de saldo negativo tem contagem por mês e precedência própria. M5 continua recusando estorno ligado ao trânsito ou a evento consumido por M6; M7 preserva as transferências e sua fórmula anterior. Não reapareceu achado corrigido nas rodadas anteriores.
- No código da origem fixado em `1b13b033ce4335c09df80237c8c31b96b37e3797`, consultado por `gh api`, `materializar_fechamento_event_sourcing` acrescenta o trânsito ao patrimônio, sem acrescentá-lo aos totais de fluxo/rendimento; `_saldo_transferencia_pendente` soma o tipo literal e `_popular_eventos_transferencia` gera saldo inicial e variações. Isso sustenta o diagnóstico sem atribuir contrapartida desconhecida nem consultar dados reais.
- Na migração existente `20261014185205_carteira.sql`, `private.apurar_mes` já soma todos os eventos do trânsito, usa o saldo calculado como final e não produz ajuste; `fechar_mes` já agrega `migracao` por tipo efetivo, independentemente do ativo, e verifica a identidade. Portanto, a função dedicada proposta é compatível com preservar essas funções e `lancar_evento` inalterados. `estornar_evento` já permite estornar uma migração; o migrador continua sem gerar estorno de trânsito, conforme M5.
- G2 está delimitada por `auth.uid()`, trava por carteira, ausência de parâmetro de ativo, `search_path` vazio e execução apenas por `authenticated`, com testes A/B e `anon`. O alcance da função pela API do próprio usuário está explicitado nos riscos. G4 limita a entrega a uma migração nova e aditiva, sem editar as existentes.
- A sonda de valor zero precede a primeira escrita e deve observar exatamente `recusado_sinal`, inclusive sem trânsito criado. A ordem das recusas, a data, a faixa, a resposta perdida da nova operação, sua retomada e a comparação por efeitos estão especificadas. A implementação deve provar essas garantias; esta revisão não as dá por implementadas.
- A/B/C permanecem integradas. A sequência da `v4` exige aprovação posterior ao parecer, merge documental próprio, confirmação do payload e autorização da implementação de D. Depois de D integrada, a simulação local pré-autorizada continua sem Supabase; `db push` é do responsável, e `gravar` continua na ação externa de C. Outra recusa para a cadeia. A simulação real, a gravação e a verificação de produção não foram antecipadas.
- Os riscos aceitos estão visíveis: retorno `N/D` nos meses migrados e nos acumulados aplicáveis, pareamento por coincidência, ausência de bloqueio de gravador em outra máquina e parada em operação desconhecida sem efeito comprovado. As regras de período existentes (K1/K8) permanecem aplicáveis.

#### Evidências, validação e preservação

- Diagnóstico fictício, somente em memória, com as funções existentes `previaFechamento`, `dietz`, `acumulado` e `criarTransferencia`: **7 fechamentos conferidos**, cobrindo A (entrada/saída sem par), B (saída parcial), C (saldo mantido) e D (duas transferências), além de migrações opostas no mesmo mês com componente líquido zero e retorno ainda `N/D`. Saldos, componentes, ajuste zero no trânsito, patrimônio e acumulado coincidiram com os valores esperados calculados independentemente. Isso verifica a compatibilidade aritmética; não substitui os futuros testes do simulador revisado, da função SQL e da integração `gravar`/`conferir`.
- `node --test scripts/validate-governance.test.mjs`, com `TEMP`/`TMP` em `local/cycle-006-review-v4-temp/`: **39/39 passaram**. `node scripts/validate-governance.mjs`: **0 erros, 0 avisos e 4 itens manuais**. `git diff --check`: limpo. Não foram executados gates da aplicação/banco como se a issue D já existisse.
- Corpo da `v4`, de `## Problema e contexto` até antes de `## Próximo passo`, preservado: SHA-256 `cc508a74e4df16826eee1a2131713e358ad1e9729933138d714edd3b678792c8`. As rodadas 1 a 3, respostas do autor e abertura da `v4` foram preservadas. O handoff do rascunho permanece como registro da entrada; o handoff desta revisão está abaixo.
- Somente os campos de revisão/veredito, o próximo passo do plano e esta rodada foram alterados. As mudanças preexistentes em `cycles.md` e na task #65 foram preservadas. Nenhum código, migração, aprovação, issue, PR, commit ou merge foi produzido. Nenhum SQLite real, relatório privado, sessão ou backend de produção foi acessado.

**Veredito: `APTO COM RESSALVAS`.** Sem bloqueadores; R4-1 e R4-2 devem acompanhar a preparação e a execução da issue D. O plano `v4` permanece em `Em Revisão`, com revisão concluída e aprovação humana pendente; o ciclo permanece `Em execução`. Não há oscilação, contestação persistente nem retorno de achado corrigido: a rodada avalia a ampliação explícita da `v4`, sem ultrapassar o teto de cinco rodadas. A situação passa a `Aguardando aprovação do plano`. O parecer não aprova o plano nem autoriza implementação ou publicação.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 006 + revisar_plano + 006_plan/rodada-4 + v4 (base b580334)`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `006` `Em execução`; plano `v4` `Em Revisão`; revisão/veredito/aprovação `Pendente (v4)`; situação `Aguardando revisão (rodada 4)`; task #65 `Bloqueada`; D ainda sem issue.
- `state_after`: ciclo `006` `Em execução`; plano `v4` `Em Revisão`; revisão `Concluída`; veredito `APTO COM RESSALVAS`; aprovação da `v4` pendente; situação `Aguardando aprovação do plano`; task #65 e demais artefatos preservados.
- `result`: `executed`
- `evidence`: pedido humano desta revisão; rodada 4 e ressalvas R4-1/R4-2; fatos do código/DDL local e da origem fixada; estados de PRs e issue conferidos por `gh`; diagnóstico fictício de 7 fechamentos; 39/39 testes de governança; validador e diff sem erros.
- `blockers`: nenhum bloqueador de revisão; aguarda manifestação humana posterior ao parecer, "aprovo o plano do ciclo 006", considerando as ressalvas. Nada aciona o workflow seguinte automaticamente.

### Abertura da `v5` (autor)

- **Autor:** Claude Code (Claude Opus 5.5).
- **Data e autorização:** 2026-10-18. A instrução do responsável está no cabeçalho (`Autorização da revisão v5`). Ela decide a alternativa A para M10 e pede esta revisão; não aprova a `v5`.
- **Motivo:** caso não coberto revelado pela segunda simulação real (ver "Contexto e baseline"), condição de parada prevista neste plano. A `v4` foi aprovada e entregue na issue D; a `v5` não reabre essa entrega.
- **Base:** `main` em `2470a26`, com a `v4` e a issue D integradas. O diff da `v5` contra essa base é o objeto da rodada 5.
- **O que muda:** cabeçalho; contexto (segunda simulação, só com contagens); "Decisões do responsável (revisão v5 de M10)"; a exceção de posição implícita zero em M10 e o exemplo; pontos de aprovação da `v5`; G1 a G4; testes; item 5 (E); arquivos; decomposição; dependências; riscos; sequência; rastreabilidade; próximo passo e handoff.
- **O que não muda:** M1 a M9, o restante de M10, a precedência das recusas, o mecanismo de gravação e as entregas integradas.
- **Teto de rodadas:** a revisão da `v5` é a rodada 5, a última de `_project/README.md`. Um veredito não apto leva a "Parado", com decisão do responsável sobre como seguir.

### Rodada 5

- **Autor:** Claude Code (Claude Opus 5.5), conforme "Abertura da `v5` (autor)".
- **Revisor:** Codex (GPT-6).
- **Data e autorização:** 2026-10-18; solicitação humana "revise o plano do ciclo 006", com instrução explícita para comparar a `v5` local com `main` em `2470a26`, registrar esta última rodada e preservar o corpo do plano.
- **Base e reconciliação:** branch `chore/cycle-006-plan-v5`, HEAD, `main` e `origin/main` locais em `2470a26d393a71d374c5ae44153de15c301c3af4`. A `v5` existe apenas nas alterações locais, sem commit. Plano `Em Revisão`, revisão/veredito/aprovação `Pendente (v5)` e situação `Aguardando revisão (rodada 5)`; ciclo `Em execução`, próximo ciclo `007`. Não havia rodada 5 nem resultado com esta chave lógica. As alterações preexistentes em `cycles.md` e nas tasks #65 e #73 foram preservadas.
- **Estado externo conferido por `gh`:** a PR #74 está `MERGED`, com squash na base acima e cinco checks verdes; a issue #73 está `CLOSED`. A busca pelo título de E não encontrou issue correspondente e não há PR aberta da `v5`. A simulação real, a consulta privada, a ausência de gravação e a pendência do `db push` são registros do autor e das tasks; esta revisão não acessou dados reais nem produção para reconfirmá-los. As decisões históricas são conferidas como registros, sem presumir acesso às mensagens originais.
- **Autoridades e template no ponto de uso:** `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, `.agent/workflows/revisar_plano.md`, `.agent/templates/plano_implementacao.md`, skill `.agent/skills/governance-check/governance-check.md`, ADR-002, ADR-003 e KB-001 a KB-004.
- **Objeto:** diff local da `v5` contra `2470a26`, especialmente a exceção de M10, a entrega E, seus testes, dependências, riscos e autorizações. A revisão considera a compatibilidade com A a D e a preservação das correções anteriores; não reabre suas aprovações nem implementa E.

#### Ressalva

1. **R5-1 — Ressalva: reconciliar também a task #65 na publicação documental da `v5`.** O ponto "Aprovar a `v5`" enumera plano, task #73 e `cycles.md`, mas o diff local também altera `006_task_issue-65.md`, substituindo a espera pelo merge da PR #74 pelos bloqueios atuais de M10/E e do `db push`. Essa task acompanha a ação externa de C, ainda pendente. Uma publicação restrita à lista daquele ponto deixaria em `main` a task de C aguardando um merge já ocorrido, sem registrar o bloqueio novo. **Encaminhamento:** incluir essa reconciliação documental na preparação da PR da `v5`, dentro de "Arquivos afetados", que já prevê as tasks do ciclo; conferir os próximos passos de ambas as tasks no estágio pós-aprovação e manter a execução real pendente. Não exige mudar M10, ampliar a entrega E ou criar outra issue. Não bloqueia a aprovação, pois é conciliação de rastreabilidade na publicação já prevista, verificável no diff dessa PR; nenhuma correção foi feita pelo revisor fora dos seus limites.

#### Itens atendidos e compatibilidade técnica

- **Bloqueadores:** nenhum. M10 exige simultaneamente posição anterior existente, real ou implícita, com saldo final zero e ausência de qualquer evento do ativo no mês, inclusive calculado. A aplicação sequencial fica limitada ao intervalo original; não antecipa o primeiro mês, não preenche lacuna de fechamento e não dispensa a identidade com `valor_total`. Qualquer outra ausência continua recusando. A conferência dos eventos precisa considerar os registros da origem, inclusive os de valor zero descartados posteriormente por M4, como decorre de "nenhum evento"; isso não acrescenta outra interpretação financeira.
- **Origem verificada:** código consultado por `gh api` exclusivamente no commit `1b13b033ce4335c09df80237c8c31b96b37e3797`. Em `event_sourcing_migration_service.py`, `_popular_eventos_e_posicoes` delega a `_popular_eventos_ativo`, que pula saldo atual e anterior zero. Em `event_sourcing_service.py`, `materializar_fechamento_event_sourcing` pula saldo inicial zero, sem eventos, para ativo desativado. Isso sustenta a possibilidade da omissão; não confirma os dados privados desta carteira.
- **Destino compatível sem mudança de schema:** `private.apurar_mes` considera a existência da posição anterior mesmo quando seu saldo é zero. Como os ativos comuns migram ativos até M9, o fechamento exige e aceita saldo real zero, produzindo posição e ajuste zero. `previaFechamento` segue o mesmo contrato. A soma de uma posição 0 → 0 não altera Vi, Vf, componentes ou os fluxos do Dietz; meses com denominador zero continuam `N/D` por K5, e nenhuma migração é criada para marcar esses zeros.
- **Plano, gravação e conferência:** o replay e `montarOperacoes` obtêm as posições dos dados normalizados; portanto, as posições implícitas precisam estar disponíveis para a validação, o replay, M9 e a montagem do relatório, como prevê o preenchimento anterior a M10. `fechar_mes` já transporta saldos reais como strings, inclusive `"0"`; `gravar` repassa o zero ao banco. `conferir` compara posições do destino com as do relatório e com os efeitos do plano. O contrato existente comporta as posições adicionais sem mudar essas duas funções; o teste de integração de E continua obrigatório para demonstrar isso no banco.
- **G1 e aceite:** E exige M10 revisado na KB-004, `CR-M08` no JSON e paridade, conferência independente e testes de saldos, patrimônio, componentes, retorno, contagem, meses consecutivos e M9. Permanecem explícitas as recusas com evento, inclusive calculado, e com saldo anterior diferente de zero. A contagem `posicoesImplicitasZero` mede posições acrescentadas, não ativos distintos nem o número de recusas da versão anterior; a propagação pode alcançar meses que a validação antiga não enumerava.
- **G2 a G4:** E não muda banco, função, política ou permissão; usa o fechamento autenticado existente. Dados reais e artefatos privados permanecem em `local/`, e a saída nova é uma contagem. Não há migração SQL nem dependência nova em E. As ressalvas R4-1 e R4-2 foram incorporadas à entrega D: a assinatura aparece nas listas de permissões e `security definer`, o formato aceito é versão 2 e há teste de recusa da versão anterior antes de acessar o destino.
- **Sequência e autorização:** a `v5` exige aprovação humana posterior a este parecer, PR documental e aprovação do seu merge, confirmação do payload de E e autorização da implementação. A simulação local pelo agente só fica coberta pela aprovação futura e depois do merge de E; limita-se a códigos e contagens, sem Supabase. `db push` continua ação externa de D, e `gravar`/`conferir` continuam na ação externa de C, depois das precondições. Nada disso foi executado por esta revisão.
- **Progresso e teto:** a exceção de M10 foi explicitamente decidida pelo responsável e delimita um caso novo observado depois da entrega D. Não restaura o fallback de posição sem referência criticado em R1-3: só permite zero com evidência anterior e sem eventos. M1 a M9 e as demais recusas foram preservadas; não há oscilação ou retorno de bloqueador corrigido. Esta é a quinta e última rodada; uma futura alteração material que demande outra revisão exige decisão do responsável sobre o fluxo, sem inventar uma rodada 6.

#### Evidências, validação e preservação

- Diagnóstico fictício em memória com `simularMigracao` existente: a ausência de posição depois do saldo zero reproduziu a recusa de M10. Com posições zero fornecidas explicitamente, foram conferidos **4 cenários e 16 fechamentos**, cobrindo ativo que permanece ativo, ativo desativado por M9, dois meses consecutivos e carteira inteira zerada. Saldos, componentes, ajuste zero, retorno 0 ou `N/D` conforme K5, saldo real `"0"` no plano e hash determinístico coincidiram com os resultados independentes. A primeira asserção do diagnóstico foi corrigida de duas recusas esperadas para uma: M10 atual só consulta a posição anterior real e não propaga a ausência; a reexecução completa passou. Esse diagnóstico verifica a viabilidade dos efeitos; não implementa a geração automática, a contagem nova, `CR-M08` ou a integração de E.
- `node --test scripts/validate-governance.test.mjs`, com `TEMP`/`TMP` em `local/cycle-006-review-v5-temp/`: **39/39 passaram**. `node scripts/validate-governance.mjs`: **0 erros, 0 avisos e 4 itens manuais**. `git diff --check`: limpo. Os gates da futura implementação de E não foram tratados como executados.
- Corpo da `v5`, de `## Problema e contexto` até antes de `## Próximo passo`, preservado: SHA-256 `57e7cc4615f01ed839c0fac77a3a94a50074f255c3260b949a2cace41afdb99a`. As rodadas 1 a 4, respostas e aberturas do autor foram preservadas. O handoff do rascunho permanece como registro da entrada; o desta revisão está abaixo.
- Somente os campos de revisão/veredito, o bloco "Próximo passo" do plano e esta rodada foram alterados. Nenhum código, migração, aprovação, issue, PR, commit ou merge foi produzido. SQLite real, relatório privado, identificador do destino, sessão e backend de produção não foram acessados.

**Veredito: `APTO COM RESSALVAS`.** Sem bloqueadores; R5-1 acompanha a publicação documental. Plano `v5` permanece `Em Revisão`, revisão `Concluída` e aprovação humana `Pendente (v5)`; ciclo `006` permanece `Em execução`. Situação `Aguardando aprovação do plano`. O parecer não aprova a versão nem aciona o workflow seguinte.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 006 + revisar_plano + 006_plan/rodada-5 + v5 (base 2470a26)`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `006` `Em execução`; plano `v5` `Em Revisão`; revisão/veredito/aprovação `Pendente (v5)`; situação `Aguardando revisão (rodada 5)`; alterações locais do autor nas tasks #65/#73 e em `cycles.md`.
- `state_after`: ciclo `006` `Em execução`; plano `v5` `Em Revisão`; revisão `Concluída`, veredito `APTO COM RESSALVAS`, aprovação `Pendente (v5)`; situação `Aguardando aprovação do plano`; demais artefatos preservados.
- `result`: `executed`
- `evidence`: solicitação humana e base local conferidas; diff da `v5`; ressalva R5-1; código local e da origem fixada; PR #74/issue #73 conferidas por `gh`; diagnóstico fictício de 16 fechamentos; 39/39 testes de governança; validador e diff sem erros; hash do corpo preservado.
- `blockers`: nenhum bloqueador de revisão; aguarda "aprovo o plano do ciclo 006" posterior ao parecer, considerando R5-1. Implementação e ações externas permanecem nos respectivos pontos de autorização.

## Aprovação e publicação documental

- **Manifestação humana posterior ao parecer:** "aprovo o plano do ciclo 006", recebida em 2026-10-17, depois do veredito `APTO PARA APROVAÇÃO` da rodada 3 sobre a `v3`.
- **Integridade:** antes da promoção, o corpo de `## Problema e contexto` até antes de `## Próximo passo` conferiu com o SHA-256 `f9889689c8aa67476668933c9fc65a3c723ab6c7c6a540be908d8683d4b50a1f`, registrado pelo revisor. O plano aprovado é exatamente o revisado.
- **O que a aprovação decide:**
  - as regras financeiras M1 a M10 propostas no plano, com os exemplos fictícios, passam a ser decisões do responsável (G1);
  - o recorte de M10: os meses só com consolidado, anteriores às posições, não migram;
  - as recusas integrais de M2, M5, M6, M7 e M10;
  - os limites operacionais: gravador único, aplicação sem uso durante a carga e parada sem reenvio em resposta perdida.
- **O que a aprovação cobre:** preparar e publicar a PR documental `chore/cycle-006-plan`, com ideação, plano e `cycles.md`, e preparar e apresentar os payloads das issues A, B e C.
- **O que fica de fora:** o merge da PR documental, que exige "aprovo o merge da PR #N" com checks verdes (`.agent/ai_behavior.md`); a criação das issues, que exige a confirmação dos payloads (`criar_issues`); e implementação, ação externa e verificação em produção.
- **Autoridades e templates no ponto de uso:** `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, `.agent/templates/plano_implementacao.md`, `.github/pull_request_template.md` e `.agent/workflows/criar_issues.md`, este último para as precondições da etapa seguinte.
- **Reconciliação externa:** `origin/main` em `49b930fc5472264985ae16ac138be5c7dc410dff`; nenhuma branch nem PR anterior do ciclo 006.
- **Estado:** o ciclo segue em `Planejamento` até a primeira entrega, e o próximo ciclo segue `007`.

## Integração documental e preparação das issues

- **Autorização de merge:** "aprovo o merge da PR #62", recebida em 2026-10-17. Executado depois de "continue o ciclo 006", quando os checks terminaram.
- **Precondições reconferidas:**
  - PR aberta, fora de draft, base `main`, `MERGEABLE`/`CLEAN`;
  - HEAD `6a8a24b79ed6cd23e310be771d6d73f0460f7ed7`, o mesmo da aprovação, com o merge travado nesse HEAD (`--match-head-commit`);
  - diff limitado à ideação, ao plano e a `cycles.md`;
  - os cinco checks passaram: lint/tipos/testes/build/e2e de preview; Supabase local, banco e e2e autenticado; governança; Vercel; comentário de preview.
- **Resultado:** PR #62 integrada por squash em `9cfb2efdde5efa2ebf9dbd054abb21f4b77e1c9f` (GitHub: 2026-10-18T02:43:12Z). `main` local sincronizada por fast-forward.
- **Preparação seguinte:** payloads A a C em `006_handoff_issues.md`, derivados dos itens aprovados, na ordem dos campos de `feature_request.yml` (A e B) e `chore.yml` (C). A busca no GitHub não encontrou issue equivalente. Nenhuma issue foi criada.
- **Estado:** plano `Aprovado`, ciclo em `Planejamento`, próximo ciclo `007`. Estes registros pós-merge ficam locais até a próxima entrega documental autorizada, sem push direto em `main`.

## Criação das issues

- **Autorização humana:** "confirmo a criação das issues A, B e C com os payloads de 006_handoff_issues.md", em 2026-10-17. Ela resolve a parada anterior e cobre só a criação e a rastreabilidade, sem implementar.
- **Workflow e templates no ponto de uso:** `.agent/workflows/criar_issues.md`, `.github/ISSUE_TEMPLATE/feature_request.yml` (A e B) e `chore.yml` (C).
- **Antes de criar:** busca em todas as issues, por título e por chave lógica `006 + criar_issues`, sem correspondência.
- **Resultado remoto:** A como [#63](https://github.com/EuThiagoAndrade/saldo-futuro/issues/63), B como [#64](https://github.com/EuThiagoAndrade/saldo-futuro/issues/64) e C como [#65](https://github.com/EuThiagoAndrade/saldo-futuro/issues/65), criadas nessa ordem. As dependências foram preenchidas com os números observados: B depende de #63, e C depende de #64.
- **Conferência:** a releitura de cada issue no GitHub mostrou título e corpo idênticos ao payload e estado `OPEN`. Os hashes estão em `006_handoff_issues.md`.
- **Estado:** plano `Aprovado`, ciclo em `Planejamento` até a primeira entrega, próximo ciclo `007`. Nenhuma task, branch ou código de implementação foi criado. Estes registros ficam locais até a próxima entrega documental autorizada, sem push direto em `main`.

## Implementação da issue #63

- **Autorização humana:** "Autorizo a implementação da issue #63 (simulação da migração)", recebida em 2026-10-17.
- **Execução:** issue #63 aberta e conferida; plano aprovado e integrado pela PR #62; branch `feature/issue-63` criada a partir de `9cfb2efdde5efa2ebf9dbd054abb21f4b77e1c9f`; task persistente criada em `006_task_issue-63.md`.
- **Escopo:** simulação somente leitura do SQLite, regras M1 a M10, replay em memória, plano determinístico e relatório local. Nenhum SQLite real foi aberto; nenhum acesso ou gravação no Supabase foi incluído.
- **Validação:** testes Vitest (237), typecheck, lint, build webpack, E2E sem backend, validador e `git diff --check`; resultados e limites estão na task da issue #63.
- **Estado:** plano `Em Execução`, ciclo `Em execução`; PR #66 aberta em `main`, fora de draft. Após o push documental `d20eee0`, Governance está em andamento, CI e Vercel pendentes e Vercel Preview Comments aprovado; novo push requer reconferência dos checks. A integração exige checks verdes e "aprovo o merge da PR #66".

## Aprovação da `v4` e publicação documental

- **Manifestação humana posterior ao parecer:** "aprovo o plano do ciclo 006", recebida em 2026-10-18, depois do veredito `APTO COM RESSALVAS` da rodada 4 sobre a `v4`.
- **Integridade:** antes da promoção, o corpo de `## Problema e contexto` até antes de `## Próximo passo` conferiu com o SHA-256 `cc508a74e4df16826eee1a2131713e358ad1e9729933138d714edd3b678792c8`, registrado pelo revisor. A `v4` aprovada é exatamente a revisada; o corpo não foi alterado depois.
- **O que a aprovação decide:** M6 revisado (casos a, b e c, a recusa de saldo negativo e os códigos novos); a exceção à K12 e o contrato de `lancar_migracao_transito`; a migração SQL aditiva da issue D; o efeito `N/D` aceito nos meses com `migracao` no trânsito.
- **Ressalvas da rodada 4, levadas ao payload e à execução da issue D, sem alterar o corpo aprovado:**
  - R4-1: incluir `lancar_migracao_transito(date, bigint)` nas listas fechadas de funções executáveis por `authenticated` e na conferência de `security definer` de `supabase/tests/database/03_funcoes.test.sql`, mantendo a detecção de função fora da lista e as recusas para `PUBLIC` e `anon`;
  - R4-2: subir a versão do formato do plano de operações e fazer `gravar` recusar, antes de qualquer escrita e com teste, um plano de versão anterior. A regeneração por uma simulação nova é o caminho, sem conversor.
- **O que a aprovação cobre:** preparar e publicar a PR documental da `v4` (plano, task da issue #65 e `cycles.md`) e preparar e apresentar o payload da issue D.
- **O que fica de fora:** o merge da PR documental, que exige "aprovo o merge da PR #N" com checks verdes; a criação da issue D, que exige a confirmação do payload depois do merge; implementação, `db push`, simulação real e `gravar`.
- **Branch de publicação:** `chore/cycle-006-plan-v4`. O nome convencional `chore/cycle-006-plan` ainda existe no remoto, integrado pela PR #62; reaproveitá-lo exigiria apagar ou forçar essa branch. O sufixo é o único desvio da convenção e fica registrado aqui.
- **Estado:** plano `Aprovado`, ciclo `Em execução`, próximo ciclo `007`.

## Aprovação da `v5` e publicação documental

- **Manifestação humana posterior ao parecer:** "aprovo o plano do ciclo 006", recebida em 2026-10-18, depois do veredito `APTO COM RESSALVAS` da rodada 5 sobre a `v5`.
- **Integridade:** antes da promoção, o corpo de `## Problema e contexto` até antes de `## Próximo passo` conferiu com o SHA-256 `57e7cc4615f01ed839c0fac77a3a94a50074f255c3260b949a2cace41afdb99a`, registrado pelo revisor. A `v5` aprovada é exatamente a revisada.
- **O que a aprovação decide:** a exceção de posição implícita zero em M10, só com posição anterior (real ou implícita) de saldo zero e sem nenhum evento do ativo no mês, inclusive calculado ou de valor zero; as demais ausências continuam recusando; a issue E.
- **Ressalva R5-1, atendida na publicação:** a PR documental da `v5` leva também a reconciliação da task da issue #65 (bloqueios atuais: issue E e `db push` da issue D), além do plano, da task da issue #73 e de `cycles.md`. A execução real continua pendente.
- **Nota da rodada 5 levada ao payload da issue E:** a conferência de "nenhum evento no mês" considera todos os registros da origem, inclusive os de valor zero descartados depois por M4; a contagem `posicoesImplicitasZero` conta posições acrescentadas.
- **O que a aprovação cobre:** preparar e publicar a PR documental da `v5`; preparar e apresentar o payload da issue E; depois do merge da issue E, a simulação local pelo agente, só `simular`, relatando só códigos e contagens.
- **O que fica de fora:** o merge da PR documental; a criação da issue E, que exige a confirmação do payload; implementação, `db push`, `gravar` e `conferir`.
- **Branch de publicação:** `chore/cycle-006-plan-v5`, pelo mesmo motivo da `v4`.
- **Estado:** plano `Aprovado`, ciclo `Em execução`, próximo ciclo `007`.

## Pós-mortem

- **Data de conclusão:** —
- **Desvios:** —
- **Lições comprovadas:** —
