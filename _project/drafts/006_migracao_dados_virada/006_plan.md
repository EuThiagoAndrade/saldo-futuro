# Plano de Implementação — Migração única dos dados e virada

> **Ciclo:** `006`
> **Status:** `Em Execução`
> **Versão:** `v3`
> **Data de criação:** 2026-10-17
> **Última atualização:** 2026-10-18
> **Tipo:** `feature`
> **Prioridade:** `P1`
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 006" em 2026-10-17
> **Autorização do rascunho:** "autorizo o rascunho do plano do ciclo 006" em 2026-10-17
> **Modo contínuo:** `—`
> **Revisão formal:** `Concluída`
> **Veredito da revisão:** `APTO PARA APROVAÇÃO`
> **Aprovação humana pós-revisão:** `Aprovada em 2026-10-17`
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
  - o trânsito é um evento `TRANSFERENCIA_PENDENTE` **sem ativo e sem contraperna**; seu saldo acumulado entra no `valor_total` do consolidado e não gera posição;
  - dinheiro em `NUMERIC(15,2)`, que no SQLite é armazenado como REAL;
  - `posicoes_mensais` (saldo de início e fim por ativo e mês) e `consolidado_mensal` (com `status` e `fechado` redundantes);
  - meses que a própria origem importou de CSV têm eventos `MIGRACAO_HISTORICA` e totais nulos.
- **Baseline ausente.** O SQLite real não está em `local/`. Volume, intervalo de meses e qualidade dos dados são desconhecidos; a primeira saída da issue A são as contagens agregadas, sem valores.
- Tooling: Node.js 24.15 com `node:sqlite` nativo (`DatabaseSync`) e `@supabase/supabase-js` já como dependência. Nenhuma dependência nova é necessária.

## Escopo

### Dentro do escopo

- Leitura local, somente leitura, do SQLite da origem em `local/`.
- Mapeamento da origem para o modelo do destino (regras M1 a M10 abaixo), com casos de referência fictícios na KB-004.
- Simulação completa que não grava nada: replay em memória com a mesma aritmética de `src/lib/financeiro`, relatório detalhado só em `local/` e resumo de contagens.
- Gravação em produção pela sessão autenticada do responsável, pelas funções existentes, idempotente e retomável, com recusa se o destino não estiver vazio.
- Conferência pós-gravação, que relê o destino e compara com a origem mês a mês.
- Roteiro da virada (congelamento da origem, simulação, gravação, conferência e caminho de volta) e registro da data de virada.

### Fora do escopo

- Tabela `investimentos_legacy` e o migrador histórico de CSV da origem (ADR-002).
- Sincronização contínua ou bidirecional.
- Rota ou tela de importação na aplicação.
- Migração do catálogo e das séries de benchmark da origem (M8).
- Atributos descritivos do ativo da origem sem coluna no destino (classificação, instituição, liquidez etc.).
- Mais de uma conta (decisão do responsável).
- Desligar a infraestrutura da origem.
- Mudança de schema: não há migração prevista (G4).

## Decisões e autoridades

### Decisões do responsável (2026-10-17, depois de "autorizo o rascunho do plano do ciclo 006")

As perguntas da ideação foram apresentadas com alternativas e exemplos fictícios, e o responsável escolheu as recomendações:

| Pergunta da ideação | Decisão |
| :-- | :-- |
| 1 e 2 — destino e contas | Só a conta do responsável. A carteira de destino em produção está vazia, e o migrador confere isso e recusa gravar se não estiver |
| 3 — histórico (G1) | **D, híbrido:** replay dos eventos onde o ativo e o mês reconciliam; `migracao` só no ativo e mês que não reconcilia |
| 6 — mês aberto | Virada logo depois de um fechamento: só meses fechados na origem migram |
| 9 — divergência | Aceitar `migracao` depois de uma simulação sem gravação, cujo detalhe fica em `local/` para conferência do responsável |

### Regras de mapeamento propostas (G1, decididas na aprovação do plano)

Estas regras detalham a alternativa D. Os exemplos são fictícios, em centavos quando não indicado. "Aprovo o plano do ciclo 006" aprova estas regras como estão; uma regra contestada volta como achado de revisão. A issue A as transcreve para a KB-004 com casos de referência.

| # | Questão | Proposta | Exemplo fictício |
| :-- | :-- | :-- | :-- |
| M1 | Tipo de ajuste do ativo no destino | Derivado como na origem: classificação contendo "cripto" ou "vari" → `marcacao`; senão → `rendimento` | Classificação "Renda variável" → `marcacao`; "Pós-fixado" → `rendimento` |
| M2 | Sinal e conversão das quantias | **Sinal:** reproduzir a leitura da origem: `RESGATE` é negativo; nos tipos com direção, `observacao` contendo "negativo" torna o valor negativo. **Conversão, sem arredondamento:** valor `INTEGER` vira centavos multiplicando por 100; valor `REAL` vira a representação decimal mais curta que reproduz o mesmo `float64` (`String(n)` do JavaScript); valor `TEXT` precisa casar com `^\d+(\.\d{1,2})?$`. A representação só é aceita se não tiver expoente e tiver no máximo duas casas decimais; os centavos vêm dos dígitos, sem multiplicar o ponto flutuante. Qualquer outra forma (três ou mais casas, expoente, valor negativo apesar do `CHECK`, mais de 15 algarismos significativos) **recusa a simulação inteira**. Não há desempate, porque nada é arredondado. Com até 13 algarismos inteiros e 2 decimais (`NUMERIC(15,2)`), o `float64` reproduz o decimal gravado | `RENDIMENTO` 12,34 com "direcao=negativo" → −1.234. `REAL` gravado como 19,99 (`float64` 19,989999999999998…) → "19.99" → 1.999. `REAL` 1.234,5 → "1234.5" → 123.450. `REAL` 1,005 → "1.005" → recusa. `REAL` 1,234 → recusa |
| M3 | Ajustes calculados da origem (`origem='calculado'`) | Não viram eventos. O destino recalcula o ajuste no fechamento a partir do saldo real (o `saldo_fim` da origem). A simulação confere que o ajuste do destino é igual à soma dos ajustes calculados da origem no ativo e mês; se não for, o ativo e mês caem em M7 | Saldo inicial 100.000, aporte 50.000, ajuste calculado da origem 1.000, `saldo_fim` 151.000 → destino: aporte 50.000 e ajuste `rendimento` 1.000 |
| M4 | Tipos manuais | `APORTE` → `aporte`; `RESGATE` → `resgate`; `RENDIMENTO` → `rendimento`; `CORRECAO_MARCACAO` → `marcacao`; `CAMBIO` → `cambio`; `MIGRACAO_HISTORICA` → `migracao`. O câmbio passa a componente próprio (a origem o somava ao rendimento); a soma dos componentes não muda. Evento de valor zero (o `CHECK` da origem o admite) não tem efeito no saldo, é descartado e entra na contagem | Rendimento 800 e câmbio 200: origem mostra rendimento 1.000; destino mostra rendimento 800 e câmbio 200 |
| M5 | `ESTORNO` | `estornar_evento` sobre o evento mapeado, na data do estorno da origem. Se o evento referenciado foi substituído por M7, o ativo e mês do estorno também caem em M7. **Recusa a simulação inteira** o `ESTORNO` cujo evento referenciado seja `TRANSFERENCIA_PENDENTE` ou tenha sido consumido por M6. Motivo: na origem, o saldo do trânsito soma só eventos de tipo literal `TRANSFERENCIA_PENDENTE` (`_saldo_transferencia_pendente`), e o `ESTORNO` exige `ativo_id`. Esse estorno altera um ativo e não o trânsito, efeito que nenhuma operação do destino reproduz: `corrigir_transferencia` reduziria também o trânsito. Por isso a migração não gera `corrigir_transferencia`; o caso vai a "Parado" com a contagem, para decisão do responsável com exemplos | Aporte 10.000 em 05/03 e estorno em 20/03 → aporte e estorno no destino, saldo líquido zero. Trânsito +30.000 e um `ESTORNO` que o referencia, lançado no ativo X → na origem o trânsito continua com 30.000 e X perde 30.000 → recusa |
| M6 | Trânsito (`TRANSFERENCIA_PENDENTE` sem ativo) | Parear cada evento de trânsito positivo com um `RESGATE`, e cada negativo com um `APORTE`, do mesmo valor absoluto e do mesmo mês. O par precisa ser único nos dois sentidos: o evento de trânsito tem exatamente um candidato, e esse candidato só serve a ele. Cada evento é consumido uma única vez. O par vira uma `transferir` de ou para o ativo "Em trânsito", **na data mais tardia das duas**, porque `transferir` grava as duas pernas na mesma data. Transferência não é fluxo (P6), então a data dentro do mês não altera o fechamento nem o Dietz. Evento de trânsito sem par único, ou com par em outro mês, **recusa a simulação inteira**. O trânsito não tem fallback, porque não aceita `migracao` (K12) | Resgate de 30.000 de X em 05/03 e trânsito +30.000 em 06/03 → transferência X → trânsito de 30.000 em 06/03. Abril: trânsito −30.000 e aporte 30.000 no Y em 12/04 → transferência trânsito → Y em 12/04. Março e abril deixam de ter esse resgate e esse aporte como fluxo externo. Dois resgates de 30.000 no mesmo mês para um trânsito de 30.000 → recusa |
| M7 | Ativo e mês não reconciliável (alternativa D) | **Precedência:** as transferências de M6 são sempre preservadas, inteiras. Os demais eventos do ativo naquele mês (inclusive estornos) são substituídos por um único `migracao`, datado no último dia do mês, de valor `saldo_fim` da origem − saldo final do ativo no destino no mês anterior − soma das pernas de transferência do ativo no mês. Essa soma conta os eventos de tipo `transferencia`, que são as únicas pernas existentes, porque M5 nunca gera correção de transferência (estornos ligados a uma transferência). O ajuste do ativo fica zero. **Causas, e só estas:** (i) `saldo_inicio(m)` diferente de `saldo_fim(m−1)` na origem; (ii) ajuste divergente (M3); (iii) evento referenciado por estorno substituído (M5, em cascata); (iv) ativo com `saldo_fim` diferente de zero e sem histórico no destino no mês (só ajuste na origem); (v) replay cujo saldo calculado diverge por outro motivo. Se o valor calculado da `migracao` for zero, **recusa a simulação inteira**: um mês sem evento de migração teria rentabilidade calculada, e não `N/D` (P15), e nenhum evento de compensação é fabricado | Destino fechou fevereiro com 101.000 em X; a origem traz março com `saldo_inicio` 100.000, aporte 50.000 e `saldo_fim` 151.000 → `migracao` de 50.000 em 31/03 e rentabilidade de março `N/D`. Com transferência: X começa março com 100.000 no destino, transfere 30.000 ao trânsito e tem `saldo_fim` de 80.000 na origem → transferência preservada e `migracao` = 80.000 − 100.000 − (−30.000) = +10.000. Identidade: Vf − Vi = +10.000 = migração; as pernas somam zero e o trânsito fica com 30.000 |
| M8 | Benchmarks e séries | Não migram. As séries públicas vêm da sincronização com o SGS já existente no destino | — |
| M9 | Ativos desativados na origem | Migram como ativos comuns e são desativados no destino depois do último mês migrado, se o saldo for zero. Com saldo diferente de zero, ficam ativos e entram na contagem | Ativo com saldo final zero em junho e desativado na origem → desativado no destino ao fim da migração |
| M10 | Cobertura e referências do histórico | **Mês fechado** na origem é o que tem `consolidado_mensal` com `status='fechado'` **e** `fechado=1`; só um dos dois recusa a simulação. **Intervalo migrado:** do primeiro mês com `posicoes_mensais` até o último mês fechado. Todo mês do intervalo precisa estar fechado (lacuna recusa), e o primeiro precisa ter `saldo_inicio` zero em todas as posições e ao menos um evento não calculado (K7). **Ativos esperados por mês:** todo ativo com posição no mês anterior ou evento no mês precisa de posição no mês; ausente, recusa (não é M7, porque M7 precisa desse `saldo_fim`). **Consistência:** `valor_total(m)` = soma dos `saldo_fim` + saldo acumulado do trânsito até `m`; divergente, recusa. **Antes do intervalo:** meses que só têm consolidado, sem posição (importação de CSV da própria origem), não migram: o destino não tem como distribuí-los por ativo sem inventar. A simulação informa quantos são. **Depois do intervalo:** qualquer evento em mês aberto recusa, porque viola o congelamento | Origem com consolidados de jan/2020 a dez/2022 sem posição e posições de jan/2023 em diante → o destino começa em jan/2023; a simulação relata "36 meses só com consolidado, não migrados". Fevereiro de 2024 sem consolidado entre janeiro e março fechados → recusa |

**Precedência das recusas.** Recusam a simulação inteira, sem gravar nada, e levam a "Parado" com as contagens: conversão inválida (M2); estorno ligado ao trânsito ou a evento consumido por M6 (M5); trânsito sem par único (M6); `migracao` de valor zero (M7); qualquer falha de cobertura ou consistência (M10); nome com mais de 100 caracteres; indício de mais de um usuário. Só as causas (i) a (v) de M7 admitem o fallback por `migracao`. Nenhuma condição aparece nas duas listas.

Regras que valem para todas: o `nome` do ativo é a `descricao` da origem; as datas são as da origem, salvo a transferência (M6) e a `migracao` (M7); meses migram em ordem, com os eventos do mês antes do fechamento (K7, P8 e K13 continuam valendo); a reconciliação final compara, por mês, o saldo final de cada ativo e o patrimônio (`vf` do destino com `valor_total` da origem, trânsito incluído) e a lista de meses marcados como `N/D` por migração.

### Mecanismo de execução

- Código puro (leitura, mapeamento, simulação e conferência) em `src/lib/migracao/`, testado com Vitest e com um SQLite fictício criado em memória a partir do DDL da origem. Nenhum `.sqlite` é versionado.
- Um ponto de entrada local, executado só pelo responsável, com três modos: `simular` (não grava), `gravar` e `conferir` (só lê). A forma de executá-lo sem dependência nova é escolhida na issue A; se não houver, a situação passa a "Parado".
- A gravação usa a sessão do responsável (acesso e renovação) fornecida por um arquivo em `local/` ou por variáveis de ambiente fora do Git. O agente não lê, não copia nem registra esse material. Não há chave `service_role` em código, CI ou `local/`.
- **Plano de operações imutável.** A simulação gera uma lista ordenada de operações e grava em `local/` o plano junto com o hash SHA-256 do SQLite, o hash do próprio plano e o `user_id` de destino. `gravar` só executa um plano cujo hash confere com o SQLite e com o usuário da sessão.
- **Único gravador.** O regime é um processo, numa máquina, com a aplicação sem uso durante a carga. O roteiro (issue C) exige isso, e o migrador o impõe localmente com um arquivo de trava criado de forma exclusiva (`wx`) em `local/`. Se a trava existir, o migrador não grava. Um gravador fora desse regime (outra máquina, a aplicação em uso) não é impedido pelo banco: as funções criam UUIDs novos e não recebem chave idempotente. Por isso a conferência abaixo roda antes de toda escrita e de todo fechamento, e qualquer diferença leva a "Parado". O caminho de volta é o do rollback.
- **Diário por operação.** O diário em `local/` registra, para cada operação, o índice no plano, a intenção (antes da chamada) e o resultado com o UUID devolvido (depois).
- **Resposta perdida: nunca repetir automaticamente.** Um erro de rede ou um tempo esgotado depois de enviar a chamada torna o resultado desconhecido. A chamada original pode ainda estar em execução: a ausência do efeito numa ou em várias releituras não prova que ela terminou sem efeito, e nenhuma espera arbitrária prova isso. As funções existentes não dão essa evidência, porque não têm chave idempotente nem consulta de término. Por isso o migrador grava a operação no diário como `desconhecida` e para ("Parado", `ambiguous_human_intervention_required`), sem nova escrita. Vale para `criar_ativo`, `lancar_evento`, `estornar_evento`, `transferir`, `fechar_mes` e `desativar_ativo`.
- **Retomada de operação desconhecida.** Ao rodar `gravar` de novo, o migrador relê o destino:
  - se o efeito completo da operação aparece exatamente uma vez, a operação foi aplicada; o diário a registra e a carga segue;
  - se não aparece, ou aparece de forma parcial ou duplicada, o migrador continua parado e não reenvia nada.

  A saída desse impasse é decisão humana registrada, apresentada pelo roteiro: esperar e reconferir, ou desfazer a carga pelo rollback (exclusão do usuário de destino). O plano não oferece reenvio automático nem recomenda reenvio manual como seguro. Se o responsável quiser uma garantia de idempotência real, isso exige mudar o banco: a situação passa a "Parado" por mudança de escopo, e essa mudança não entra neste ciclo.
- **Comparação com o plano: efeitos completos.** O prefixo é comparado pelos efeitos de cada operação, não só pela presença de linhas:
  - ativos: nome, tipo de ajuste e estado ativo ou desativado, o que distingue o antes e o depois de `desativar_ativo`;
  - eventos do mês aberto: multiconjunto de (ativo, data, tipo, valor, evento estornado), contra as primeiras `k` operações do mês. Eventos idênticos no mesmo dia são intercambiáveis, então o multiconjunto define o prefixo sem ambiguidade;
  - transferências: cabeçalho com data e as duas pernas (origem, destino e valores opostos), comparadas como uma unidade;
  - meses fechados: consolidado e posições.
- **Destino vazio e retomada.** A primeira execução exige destino vazio: só o ativo de trânsito, nenhum outro ativo, nenhum evento e nenhum mês fechado. A única exceção é a retomada comprovada: diário e plano com os mesmos hashes, mesmo usuário e destino igual a um prefixo exato do plano. Reexecutar depois de concluído reconhece o plano inteiro aplicado, registra `already_executed_and_reconciled` e não grava.
- **Leitura completa (conferência e retomada).** Toda leitura do destino usa o contrato de `src/lib/leitura.ts` (`lerTudo`/`lerTabela`): páginas de 1.000 linhas (`max_rows`), contagem exata e recusa se a contagem mudar entre páginas. Falha de página ou mudança durante a leitura para a conferência. Igualdade de saldos num subconjunto nunca conta como reconciliação.
- Se as funções existentes não sustentarem essas garantias nos testes da issue B, a situação passa a "Parado" por mudança de escopo, em vez de prometer idempotência que não existe.

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

Toda cadeia para em "Parado", com pergunta e alternativas, se:

- faltar capacidade, evidência ou autorização;
- a simulação recusar por qualquer condição da precedência acima, ou revelar um caso não coberto por M1 a M10;
- o destino não estiver vazio fora de uma retomada comprovada;
- a trava de gravador único existir, ou a comparação com o plano divergir;
- surgir necessidade de dependência nova ou de mudança de schema;
- a conferência mostrar qualquer diferença.

O modo contínuo não se aplica ao ciclo completo.

**Divergência de autoridade registrada (R1-7).** O fluxo completo de `_project/README.md` diz que a aprovação do plano cobre o merge documental e a criação das issues depois da apresentação do payload. Já `.agent/ai_behavior.md` exige "aprovo o merge da PR #N" para cada merge, sem exceção, e `criar_issues` exige a confirmação do payload. Este plano segue a regra mais restritiva das duas autoridades. Harmonizar o texto é trabalho de governança, fora deste ciclo, e fica relatado aqui.

## Barreiras de domínio

| Barreira | Aplica-se? | Como o ciclo a atende ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim | Regras M1 a M10 decididas na aprovação e transcritas na KB-004 com casos de referência fictícios (`CR-M01` em diante) no JSON de casos e conferência independente. A simulação reutiliza `src/lib/financeiro` (centavos inteiros, mesma aritmética do fechamento) e o destino reconfere a identidade em cada `fechar_mes`. Aceite: diferença zero por ativo e mês e no patrimônio. Nenhuma interpretação nova é escolhida pelo agente |
| G2 — isolamento por RLS | Sim | Só as funções autenticadas existentes, sem `service_role`. Testes no Supabase local com usuários fictícios A e B: a gravação de A não toca B; a recusa com destino não vazio; a trava de gravador único; a retomada. `supabase test db` continua verde |
| G3 — privacidade de dados | Sim, crítica | SQLite, sessão, diário e relatório detalhado só em `local/`. Fixtures fictícias geradas em memória. Evidências em task, PR e issue: só contagens (ativos, eventos por tipo, meses, ativos e meses em M7, desativados) e diferenças. O agente não abre o SQLite real nem a saída detalhada, salvo autorização explícita, e mesmo então não reproduz valores. Nenhum ambiente local de teste recebe dados reais: a simulação é em memória |
| G4 — migrações só acrescentam | Não há migração prevista | As funções existentes bastam (`lancar_evento` já aceita `migracao`). Se faltar algo, parar e revisar o plano |

## Estratégia de testes

- **Unidade (Vitest):**
  - leitura do DDL da origem;
  - conversão M2: `INTEGER`, `REAL` com artefato binário (19,99), `TEXT`, três casas (1,005 e 1,234), expoente, negativo e mais de 15 algarismos;
  - sinal por direção (M2) e mapeamento de tipos, inclusive valor zero (M4);
  - estorno simples, estorno em cascata para M7, e recusa de estorno ligado ao trânsito ou a evento consumido por M6 (M5);
  - pareamento M6: par único, datas diferentes no mesmo mês, par ambíguo, par em outro mês e prova de consumo único;
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
  - isolamento A/B.
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

## Arquivos afetados

- `src/lib/migracao/` (novo) e seus testes.
- Ponto de entrada local (caminho decidido na issue A, sem dependência nova).
- `tests/fixtures/financeiro/casos_referencia.json` e testes de paridade.
- Testes de integração com Supabase local (local escolhido na issue B, seguindo os existentes).
- KB-004 (issue A); KB-002 (issue C); KB-003 e o ajuste de texto da KB-004 (encerramento).
- `_project/cycles.md`, ideação, plano e tasks do ciclo.

## Decomposição em issues e PRs

| Issue | Título proposto | Barreiras | Depende de |
| :-- | :-- | :-- | :-- |
| A | `[FEATURE] Simular a migração da origem sem gravar` | G1, G3 | Plano integrado |
| B | `[FEATURE] Gravar a migração pela sessão do responsável, com retomada` | G1, G2, G3 | A |
| C | `[CHORE] Roteiro da virada` | G3 | B. A ação externa e a verificação acontecem depois do merge |

Uma PR por issue, cada uma com aprovação própria do merge. O encerramento vai numa PR própria (`chore/cycle-006-closure`), sem issue, autorizado pela aprovação do plano, com merge aprovado à parte. Ela só é aberta depois da verificação em produção e leva o relato da execução, a data de virada e a atualização da KB-003.

## Dependências e blockers

- O responsável coloca a cópia do SQLite em `local/` antes da primeira `simular` real, já na execução pós-merge da issue C. As issues A e B usam só dados fictícios.
- A primeira simulação real pode recusar por uma condição da precedência ou revelar casos fora de M1 a M10. Nesse caso, "Parado" e decisão com exemplos antes de gravar.
- Sessão do responsável válida durante `gravar`: o migrador usa a renovação de sessão; se ela expirar, a retomada cobre.

## Riscos, suposições e rollback

- **Gravação parcial ou duplicada:** mitigada por destino vazio, trava de gravador único, diário por operação, parada sem reenvio quando a resposta se perde e retomada por prefixo exato. Um gravador fora do regime é detectado na comparação seguinte e leva a "Parado", sem nova escrita.
- **Rollback antes da confirmação da virada:** a origem continua intacta e congelada, então voltar a ela é só retomar o uso. Para limpar o destino, como nenhuma função apaga eventos, o caminho é excluir o usuário de destino no Supabase (a carteira sai em cascata pelas FKs `on delete cascade`) e entrar de novo. É ação humana externa e entra no roteiro.
- **Lançamentos na origem depois do congelamento:** o roteiro proíbe; a simulação recusa evento em mês aberto (M10), e a conferência compara com o SQLite copiado.
- **Direção em texto livre (M2):** frágil na origem, mas reproduzir a mesma leitura é o que gera os saldos de lá; a reconciliação acusa qualquer erro.
- **Histórico anterior às posições (M10):** meses só com consolidado não migram; a cópia do SQLite em `local/` os preserva.
- **Rentabilidade histórica diferente da origem:** esperada pelo Dietz (P11), pelo câmbio separado (M4), pelas transferências sem fluxo (M6) e pelos meses `N/D` (P15, O12). O aceite é sobre saldos e patrimônio, não sobre a rentabilidade da origem.
- **Suposição:** a origem é de um único usuário, o responsável. Se a simulação indicar outra coisa, "Parado".

## Sequência recomendada

1. Revisão formal → "aprovo o plano do ciclo 006" → PR documental `chore/cycle-006-plan` → "aprovo o merge da PR #N" → apresentação dos payloads → confirmação → issues A, B e C.
2. Por issue, na ordem A → B → C: "autorizo a implementação da issue #N" → PR → "aprovo o merge da PR #N".
3. Ação externa (issue C): congelar, simular, conferir o relatório, gravar e conferir → "concluí a ação externa da issue #N".
4. "autorizo a verificação em produção do ciclo 006".
5. PR de encerramento, com relato, data de virada e KB-003 → "aprovo o merge da PR #N".

## Referências

- Ideação `_project/ideations/006_migracao_dados_virada.md`.
- ADR-002 (decisão 6), ADR-003 (privacidade e revogação).
- KB-001 (origem fixada em `1b13b03`), KB-002 (S12 e operação), KB-003, KB-004 (seções 4, 5, 7 e casos).
- `supabase/migrations/20261014185205_carteira.sql`.

## Rastreabilidade

| Campo | Valor |
| :-- | :-- |
| Issue(s) | A [#63](https://github.com/EuThiagoAndrade/saldo-futuro/issues/63), B [#64](https://github.com/EuThiagoAndrade/saldo-futuro/issues/64) e C [#65](https://github.com/EuThiagoAndrade/saldo-futuro/issues/65) |
| PR(s) | [#62](https://github.com/EuThiagoAndrade/saldo-futuro/pull/62) (plano, integrada); [#66](https://github.com/EuThiagoAndrade/saldo-futuro/pull/66) (issue A, integrada); [#68](https://github.com/EuThiagoAndrade/saldo-futuro/pull/68) (issue B, integrada); [#69](https://github.com/EuThiagoAndrade/saldo-futuro/pull/69) (issue C, aberta) |
| Branch(es) | `chore/cycle-006-ideation` (rascunho local); `chore/cycle-006-plan` depois da aprovação |
| Destino após conclusão | `_project/executed/006_migracao_dados_virada/006_plan.md` |

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 006 (completo)
Quem: Responsável
Conferir: [PR #69](https://github.com/EuThiagoAndrade/saldo-futuro/pull/69), checks remotos e o roteiro da KB-002
Diga: "aprovo o merge da PR #69"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 006 + implementar_issue + 65/C + base 114da00e250ae73ef79ad8a9f46e4e73b4c8af99`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: plano `Em Execução`; issues #63 e #64 integradas (PRs #66 e #68); issue #65 `OPEN` sem branch / branch `chore/issue-65`, task `Aguardando integração`, PR #69 `OPEN` contra `main`
- `result`: `executed`
- `evidence`: autorização do responsável para a issue #65 em 2026-10-18; validador verde; PR #69 aberta via `gh` com `Closes #65`
- `blockers`: checks remotos do HEAD atualizado e "aprovo o merge da PR #69" depois de todos verdes; depois, a ação externa

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

## Pós-mortem

- **Data de conclusão:** —
- **Desvios:** —
- **Lições comprovadas:** —
