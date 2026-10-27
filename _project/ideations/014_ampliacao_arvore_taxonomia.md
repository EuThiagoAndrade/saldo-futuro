# Ideação — 014: Ampliação da árvore da taxonomia de classes de ativos

> **Ciclo:** `014`
> **Estado:** `Ideação`
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 014" em 2026-10-26
> **Criado em:** 2026-10-26
> **Última atualização:** 2026-10-26
> **handoff_schema_version:** `2`

## Problema

Com o ciclo `013`, a classe do ativo passou a ser um nó de uma árvore global de até três níveis, com 39 nós. O responsável percebeu, ao enquadrar os próprios investimentos, que a árvore é rasa demais para vários casos: muitos ativos reais ficariam parados no nível 2, sem um tipo que os descreva. O exemplo trazido foi o Tesouro: dentro de "Renda fixa › Dívida soberana" não há Tesouro Selic, Prefixado, IPCA+ e afins. O mesmo vale para fundos, FIIs, ativos no exterior, cripto e ativos reais.

O pedido é **ampliar a árvore com nós úteis**, mantendo a forma atual e o princípio central do ciclo `013` (o nó classifica pela exposição econômica; veículo, indexador, tributação e emissor são atributos). Não é encher por encher: cada nó novo precisa ter uma finalidade clara para quem cadastra.

O nível é completo por dúvida de triagem, confirmado pelo responsável em 2026-10-26: as identidades dos nós são permanentes (os vínculos dos ativos apontam para elas), a curadoria passou pela revisão formal do ciclo `013` e a migração vai para produção por ação do responsável. G1 e G2 não se aplicam: nenhum cálculo muda e o catálogo continua só de leitura, sob a mesma RLS. O modo contínuo é proibido.

## Origem no backlog

Não se aplica. A demanda estende o ciclo `013` e não é seleção de ID do backlog. O BL-015 (indexador, tributação, veículo, liquidez e cobertura do FGC como atributos) continua separado e fora deste ciclo.

## Contexto e evidências

### Fatos observados

A inspeção foi feita em 2026-10-26 em `EuThiagoAndrade/saldo-futuro`, com `main` em `3dd60910ace387d03a2cff878f2ea0e9acd816a6`. Nenhum dado real foi lido; as carteiras e as classes de produção não foram consultadas.

- **Árvore atual.** A migração `supabase/migrations/20261026204955_taxonomia_ativos.sql` carregou 39 nós: 6 classes macro, 21 subclasses e 12 tipos. Ela está em produção desde a ação externa E1 do ciclo `013`, e as funções antigas de classe saíram na fase 2 (E2 concluída em 2026-10-26, com as contagens conferidas).
- **Restrições do catálogo.** `public.taxonomia_ativos(id, parent_id, nivel, nome, ordem)`, mais a coluna derivada `parent_nivel`, tem:
  - nível entre 1 e 3, e pai sempre do nível anterior (chave composta), o que impede ciclo;
  - nome único entre irmãos, ignorando caixa, acento e espaços nas pontas, e ordem única e positiva entre irmãos, inclusive nas raízes;
  - exclusão recusada para nó com filhos ou referenciado por ativo;
  - escrita só por migração (nem o admin escreve pela Data API).
- **Identidades.** Os UUIDs são fixos e seguem `a5000000-0000-4000-8000-000000NNMMKK`, em que NN, MM e KK são o código de nível 1, 2 e 3, com dois dígitos cada. O esquema comporta até 99 filhos por pai.
- **Vínculo.** O ativo pode apontar para um nó de qualquer nível (P1 do ciclo `013`), inclusive um pai que tem filhos. Nulo é "Sem classe". Um nó de nível 3 não pode ter filhos.
- **Tela.** O seletor de classe do cadastro e da edição lista os nós em ordem hierárquica, com o caminho completo, e a busca por trecho, sem acento nem caixa, vale para o caminho inteiro. As listas de Ativos mostram só o nome do nó.
- **Testes que afirmam a árvore.** `supabase/tests/database/09_taxonomia_ativos.test.sql` prova "39 nós", "6, 21 e 12" e a lista exata da árvore, em ordem de apresentação. Qualquer acréscimo exige adaptar essas asserções.
- **Distribuição por classe (unidade 3 do ciclo `013`, ainda não implementada).** Usa só o nível 1 e sobe, no máximo, dois pais a partir do nó do ativo. Nós novos sob as seis classes macro funcionam sem mudar a regra.
- **Arquivo trazido pelo responsável.** Em `local/taxonomia_completa_de_classes_de_ativos_financeiros.md`, ignorado pelo Git, o arquivo foi lido nesta sessão. Ele não traz dado de usuário; os exemplos de instituições nele são nomes públicos de mercado, e nada dele é versionado.

### O arquivo, comparado com a árvore atual

- Tem as **mesmas 6 classes macro**, com os mesmos nomes. Traz 41 subclasses e cerca de 290 tipos (Caixa 15, Renda fixa 68, Renda variável 54, Investimentos no exterior 52, Criptoativos 52, Alternativos 50), contra 21 subclasses e 12 tipos hoje.
- **Mistura "o que é o ativo" com atributos**, e ao fim ele mesmo lista os atributos como campos à parte (veículo de acesso, moeda, indexador, regime tributário, liquidez e cobertura do FGC), no mesmo desenho do BL-015:
  - indexador: CDB, LCI e LCA aparecem três vezes cada (pós, pré, IPCA+);
  - tributação e lei: "isenta de IR", Lei 12.431, Lei 14.801, Lei 13.043, Lei 14.754;
  - veículo: PGBL e VGBL, fundo e ETF, listado e offshore;
  - tickers e instituições nos nomes e nos exemplos;
  - derivativos e margem, que não combinam com um sistema de saldos em centavos.
- Entra em **conflito com quatro decisões já aprovadas**: conta que rende (o arquivo põe em Renda fixa), saldo parado em moeda estrangeira (em Alternativos), BDR e ETF internacional na B3 (em Renda variável) e ouro tokenizado (em Cripto).
- Traz **conteúdo aproveitável**: os produtos do Tesouro, a segmentação de FIIs, as camadas de cripto, REIT e bonds internacionais, e os ativos reais (imóveis, precatórios).

### Regras já em vigor que balizam este ciclo

Vêm do ciclo `013` e não são reabertas aqui: D1 (o nó classifica pela exposição econômica), D1.1 (stablecoin em Criptoativos, ouro em Alternativos, ETF e fundo da mesma estratégia no mesmo nó), D1.2 (saldo parado em conta é Caixa; título ou aplicação adquirida é Renda fixa), D6 (um tipo só entra quando difere em estrutura, risco ou liquidez, sem tickers, alíquotas nem nomes de gestoras ou instituições reais), P1 (qualquer nível é vínculo válido), P3 (precedência da árvore, com os dois enquadramentos de poupança e saldo em moeda estrangeira) e D21 (tabela com `parent_id`, `nivel`, `nome` e `ordem`).

### Decisões de 2026-10-26 (debate do ciclo 014)

Tomadas pelo responsável nesta sessão, antes da ideação. Cada uma teve alternativas e recomendação.

| ID | Ponto | Decisão |
| :-- | :-- | :-- |
| N1 | Papel do arquivo | Só inspiração e fonte de candidatos. A ideia central é a do ciclo `013` (D1 e D6). O objetivo é encher com finalidade positiva para o usuário, não encher por encher |
| N2 | Árvore existente | **Não se modifica.** Os 39 nós ficam como estão (nome, nível, UUID). Só entram nós novos. Consequência: "Letras bancárias" continua um nó único (um tipo de nível 3 não pode ter filhos), e não se separa LCI de LCA |
| N3 | Quatro fronteiras | Mantidas as decisões do ciclo `013`: conta que rende é Caixa (o que foi comprado como produto, como CDB de liquidez diária ou "caixinha" que é CDB/RDB, é Renda fixa › Crédito bancário); moeda estrangeira parada é Caixa › Saldos em conta; BDR e ETF internacional são Investimentos no exterior; ouro tokenizado é Alternativos › Ouro |
| N4 | Entrega e revisão | Uma única migração aditiva, com um `db push` do responsável. A revisão é uma classe macro por vez, na ordem Renda fixa (com fundos de renda fixa), Renda variável, Alternativos, Investimentos no exterior, Caixa e Criptoativos |
| N5 | Profundidade | Proporcional ao uso. Onde o responsável tem posição, detalhar; onde não tem, ficar enxuto. Criptoativos com cerca de 10 nós novos, e não os cerca de 50 do arquivo |
| N6 | Ativos reais | Incluir de forma enxuta: imóvel físico (residencial, comercial, terreno e rural), participação em empresa fechada (startups e private equity), precatórios e créditos judiciais, empréstimos a receber e bens colecionáveis, num nó único. Ficam de fora por ora: franquias, semoventes, usinas, consórcio, seguro resgatável e título de capitalização |
| N7 | Régua de utilidade | Um nó novo entra se: (1) um investidor pessoa física brasileiro típico o possui; (2) difere dos irmãos em estrutura, risco ou liquidez; (3) é reconhecível pelo nome, sem ticker; (4) não duplica um atributo; (5) não depende de detalhe legal que muda |
| N8 | Fora como nó | Indexador, tributação, veículo, moeda, cobertura do FGC, tickers, nomes de instituições e gestoras, números de lei e derivativos e margem. Previdência continua sendo um dos quatro indicadores do ativo, não nós |

### Hipóteses (a confirmar no plano)

- **Ordem de grandeza.** Pela régua N7, a árvore iria de 39 para algo na casa de 120 a 160 nós. O número final só vem da revisão nó a nó.
- **Tesouro.** Cinco nós de nível 3 sob "Dívida soberana": Tesouro Selic, Prefixado, IPCA+, Renda+ e Educa+. "Com juros semestrais", a compra pela mesa e a legislação ficam como atributo ou fora.
- **Fundos por estratégia.** Os fundos e ETFs entrariam por estratégia, não por veículo (D1.1), possivelmente num nível 2 como "Fundos de renda fixa" (DI e simples, crédito privado, inflação, prefixado), com estrutura análoga em Renda variável e em Alternativos (multimercado).
- **Ordem de apresentação.** Como os nós existentes não mudam, os novos entram depois dos atuais dentro de cada pai. A ordem dentro de um pai pode ficar menos "natural".
- **Compatibilidade.** O acréscimo de nós não afeta vínculos nem a marca de coerência da classificação: o catálogo fica fora da marca, e nenhum nó existente muda.

## Resultado desejado

- A árvore global ampliada por **uma migração aditiva** (G4), com identidades fixas no mesmo padrão, sem alterar nenhum dos 39 nós atuais.
- Cada nó novo justificado pela régua N7, com nomes genéricos, sem ticker, instituição, gestora nem número de lei.
- Testes de banco que provem os 39 originais intactos (nome, nível, UUID, ordem), a árvore completa nova, as restrições e a leitura de qualquer usuário autenticado. As asserções de "39 nós" do ciclo `013` são adaptadas.
- KB-003 e o `DESIGN.md` (se o seletor passar a ter um padrão novo) atualizados; roteiro curto de ação externa para o `db push`, com contagens do catálogo antes e depois.

## Alternativas

**A — Como entregar** (escolhida: **A1**, N4)
- **A1 — Uma migração com todas as classes macro**, revisada uma classe por vez. Um só `db push` do responsável.
- **A2 — Uma migração por classe macro.** Cada revisão fecha antes da seguinte, ao custo de vários `db push`.
- **A3 — Dentro da unidade 3 do ciclo `013`.** Descartada: reabriria o plano aprovado e misturaria a regra G1 da distribuição com curadoria de catálogo.

**B — Onde ficam os fundos** (a decidir no plano)
- **B1 — Um nível 2 de fundos por classe macro, com a estratégia no nível 3.** É a hipótese de trabalho. Respeita a D1.1, porque o nó é a estratégia, e dá casa a "Fundos".
- **B2 — Sem nó novo: distribuir os fundos nas famílias existentes.** Evita crescer, mas muitos fundos não têm instrumento único e ficariam no nível 2, o problema de hoje.
- **B3 — Um nível 2 "Fundos" por veículo.** Descartada: contraria a D1.

**C — Indexador em renda fixa** (escolhida: **C1**, N8, com exceção natural no Tesouro)
- **C1 — Indexador como atributo (BL-015).** Prevalece, exceto onde o indexador define o produto, como Tesouro Selic, Prefixado e IPCA+.
- **C2 — Um nó por indexador em CDB, LCI, LCA e afins.** Descartada: multiplica nós e duplica o atributo.

## Riscos e restrições

- **Identidade permanente.** Um nó referenciado não pode ser excluído, e renomear ou reposicionar exige migração. Um nó mal curado custa caro; por isso a régua e a revisão nó a nó.
- **Crescimento sem fim.** Cada nó tem custo de manutenção. A régua N7 e a profundidade proporcional (N5) existem para conter isso.
- **Ordem de apresentação.** Só entram nós novos (N2), então a ordem dentro de um pai pode ficar menos lógica. Pergunta 4.
- **Testes.** As asserções "39 nós" e a lista exata da árvore passam a ser históricas; o plano precisa trocá-las por "os 39 originais intactos" mais a árvore nova, sem enfraquecer as restrições.
- **Paralelismo com o ciclo `013`.** A unidade 3 não cria migração, então os ciclos são independentes; se ela terminar depois, só precisa ler uma árvore maior, porque usa o nível 1. Qualquer fixture ou e2e que cite a contagem de nós deve ser conferido.
- **G1.** Não se aplica: nenhuma regra de cálculo muda e a distribuição usa só o nível 1.
- **G2.** Mesma RLS e mesmos grants, sem tabela nova e sem função nova; conferir que a migração não abre escrita. **G3.** Nomes genéricos; o arquivo em `local/` não é versionado nem transcrito. **G4.** Só migração nova; nenhuma anterior é editada.
- **Produção.** O `db push` é ação externa do responsável, com contagens agregadas do catálogo antes e depois, sem dados de usuário.
- **Seletor.** Com 120 a 160 opções, a lista inteira fica longa; o seletor já tem busca, rolagem na lista e alvos de 44 px. A revisão do `DESIGN.md` confirma se algo precisa mudar.

## Perguntas em aberto

1. **Imóveis físicos em Alternativos.** O agente propôs um nó "Imóveis físicos" em Alternativos, e manter "Imóveis de renda" (Renda variável) para os fundos imobiliários listados. A resposta do responsável (N6) não tratou desse ponto. Confirmar?
2. **Onde o responsável tem posição.** Em quais classes macro e famílias há posição hoje (só o tipo, sem valores nem instituições)? Isso calibra a profundidade de cada classe (N5) e mostra se algum caso real ainda ficaria no nível 2.
3. **Fundos (B).** Confirmar B1 (nível 2 de fundos por estratégia) ou escolher outra alternativa, e em quais classes macro.
4. **Ordem dentro de cada pai.** Aceitar que os nós novos entrem depois dos atuais, ou permitir reordenar só a coluna `ordem` dos existentes (ordem é só de apresentação; nome, nível e UUID não mudam)?
5. **Tesouro.** Os cinco nós (Selic, Prefixado, IPCA+, Renda+, Educa+), com "juros semestrais" fora como nó, atendem?

## Fora do escopo

- Alterar, renomear, excluir ou reposicionar qualquer um dos 39 nós atuais (N2).
- Atributos: indexador, tributação, veículo de acesso, liquidez estimada, cobertura do FGC (BL-015).
- Quarto nível, marcador de nó descontinuado e alocação-alvo.
- Reclassificar ativos existentes automaticamente; a escolha continua do responsável, pela edição do ativo.
- Mudança de tela além do que a ampliação exigir, de regra de cálculo, de RLS ou de funções.
- Derivativos e margem, e os ativos reais deixados de fora por N6.

## Critérios para iniciar o planejamento

- Perguntas 1 a 5 respondidas, ou aceitas as recomendações do plano.
- Lista dos tipos que o responsável tem hoje, para a conferência de cobertura (pergunta 2).
- Concordância com a régua N7 e com a profundidade por classe.
- Autorização "autorizo o rascunho do plano do ciclo 014".

## Descarte

A ideação é descartada se a revisão mostrar que a cobertura que falta se resolve melhor com atributos (BL-015) do que com nós, ou se o crescimento da árvore comprometer o seletor.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Ideação registrada — ciclo 014 (completo)
Quem: Responsável
Conferir: perguntas 1 a 5 e as decisões N1 a N8 em _project/ideations/014_ampliacao_arvore_taxonomia.md
Diga: "autorizo o rascunho do plano do ciclo 014"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 014 + idear + ampliacao_arvore_taxonomia + 3dd60910ace387d03a2cff878f2ea0e9acd816a6`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `014` não existia; `cycles.md` com próximo ciclo `014`; ciclo `013` em execução; `main` e `origin/main` em `3dd6091`; frase "confirmo o nível completo e autorizo a ideação do ciclo 014" recebida.
- `state_after`: ideação criada e ciclo `014` reservado como `Ideação` em `_project/cycles.md`, ambos locais e sem commit; próximo ciclo passa a `015`.
- `result`: `executed`
- `evidence`: leitura de `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, do template e da ideação `013`; da migração da taxonomia e do teste 09 em `main`; e do arquivo em `local/`. Nenhum dado real lido.
- `blockers`: nenhum para a ideação; o plano depende das respostas e da autorização do rascunho.
