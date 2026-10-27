# Plano de Implementação — Ampliação da árvore da taxonomia de classes de ativos

> **Ciclo:** `014`
> **Status:** `Em Execução`
> **Versão:** `v3`
> **Data de criação:** 2026-10-26
> **Última atualização:** 2026-10-26
> **Tipo:** `feature`
> **Prioridade:** `P2` (proposta de planejamento, sem compromisso de prazo)
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 014" em 2026-10-26
> **Autorização do rascunho:** "autorizo o rascunho do plano do ciclo 014" em 2026-10-26
> **Autorização da correção:** "corrija o plano do ciclo 014" em 2026-10-26 (rodadas 1 e 2)
> **Modo contínuo:** `—`
> **Revisão formal:** `Concluída`
> **Veredito da revisão:** `APTO PARA APROVAÇÃO`
> **Aprovação humana pós-revisão:** `Aprovada em 2026-10-26`
> **handoff_schema_version:** `2`

## Problema e contexto

Ideação: _project/ideations/014_ampliacao_arvore_taxonomia.md

## Objetivo

Ampliar a árvore global da taxonomia de classes de ativos com nós úteis para quem cadastra, por **uma migração aditiva**, sem alterar nenhum dos 39 nós atuais (N2). A cobertura é ampla em todas as classes macro, pela diretriz de 2026-10-26: N5 e o item 1 da N7 foram relaxados, e os itens 2 a 5 da N7 e a N8 continuam valendo. Cada nó novo classifica pela exposição econômica (D1) e tem nome genérico. Nenhum cálculo, política RLS, função ou tela muda.

## Origem no backlog

Não se aplica. Herdado da ideação: a demanda estende o ciclo `013` e não é seleção de ID. O BL-015 (atributos) continua separado e fora deste ciclo.

## Contexto e baseline

- Base: `main` e `origin/main` em `3dd60910ace387d03a2cff878f2ea0e9acd816a6`, observadas em 2026-10-26. A ideação 014 e a reserva em `_project/cycles.md` estão locais, sem commit, e foram preservadas.
- Ciclo `013` em execução: #137 e #138 integradas (PRs #140 e #142), E1 e E2 concluídas segundo a ideação; #139 (unidade 3, distribuição por classe macro) aberta e sem migração prevista. A PR de release #141 (`0.10.0`) está aberta. Os dois ciclos são independentes no banco; a unidade 3 só lê o nível 1 e sobe até dois pais, então funciona com a árvore maior sem mudar a regra.
- Catálogo atual: `supabase/migrations/20261026204955_taxonomia_ativos.sql` (39 nós: 6, 21 e 12). Restrições: nível 1 a 3 com pai do nível anterior (chave composta), nome de 1 a 100 caracteres, único entre irmãos sem caixa, acento e espaços nas pontas, ordem positiva e única entre irmãos, exclusão de nó com filho ou referenciado recusada, escrita só por migração. UUID fixo `a5000000-0000-4000-8000-000000NNMMKK`, derivado do código de ordem.
- Testes que afirmam a árvore: `supabase/tests/database/09_taxonomia_ativos.test.sql` (`plan(163)`), com "39 nós" em cinco asserções, "40" depois de uma inserção válida, "6, 21 e 12", a lista exata em ordem e a proibição de dígitos e de `taxa|indexador|cdi|ipca|selic|lci|lca` em qualquer nome. O e2e `tests/e2e/ativos-detalhes.spec.ts` espera exatamente quatro opções ao buscar "CREDITO bancario".
- Leitura e tela: `src/lib/leitura.ts` lê `taxonomia_ativos` paginada; `src/lib/telas/taxonomia.ts` monta caminhos e confere a coerência; o seletor (DESIGN.md 6.8, "Seletor de classe da taxonomia") tem busca pelo caminho, sem limite de opções.
- O arquivo trazido pelo responsável (`local/`, ignorado pelo Git) foi relido nesta sessão apenas como fonte de candidatos (N1). Nada dele é versionado ou transcrito; nenhum dado real foi lido, e produção não foi consultada.

## Escopo

### Dentro do escopo

- Uma migração nova com 94 nós (2 subclasses e 92 tipos), na árvore da seção "Árvore proposta".
- Adaptação dos testes de banco e do e2e que fixam a árvore, sem enfraquecer restrições, RLS ou grants.
- Ensaio local de atualização a partir da última migração do ciclo `013`.
- KB-003, novidades do produto e roteiro de ação externa (`db push`) com contagens do catálogo.
- Encerramento prospectivo.

### Fora do escopo

- Alterar, renomear, reordenar, excluir ou reposicionar qualquer um dos 39 nós (N2, decisão de ordem abaixo).
- Atributos do BL-015 (indexador, tributação, veículo, moeda, liquidez, FGC), quarto nível, marcador de nó descontinuado e alocação-alvo.
- Reclassificar ativos existentes; o vínculo continua escolha do usuário.
- Mudança de tela, de regra de cálculo, de RLS, de grants ou de funções. Se a implementação mostrar que o seletor precisa mudar, a situação passa a "Parado".
- Derivativos e margem; franquias, semoventes, usinas, consórcio, seguro resgatável e título de capitalização (N6).

## Decisões e autoridades

As decisões N1 a N8 da ideação são a autoridade de escopo, com as regras do ciclo `013` (D1, D1.1, D1.2, D6, P1, P3 e D21), que não são reabertas.

### Registro de decisões de 2026-10-26 (perguntas da ideação)

Recebidas nesta sessão, antes do rascunho. Não constituem aprovação do plano.

| Pergunta | Resposta do responsável | Efeito no plano |
| :-- | :-- | :-- |
| 3 — Fundos | "Por exposição (Recomendado)" | Sem nó "Fundos" (B1 descartada). Fundo e ETF seguem a família da exposição; onde a exposição é uma carteira diversificada, há um tipo "Carteiras de …". Multimercado ganha tipos sob Estratégias multiexposição |
| 5 — Tesouro | "Nomes oficiais (Recomendado)" | Tesouro Selic, Tesouro Prefixado, Tesouro IPCA+, Tesouro Renda+ e Tesouro Educa+. A proibição de indexador no nome ganha exceção restrita a esses nós (C1); o teste do ciclo `013` é adaptado com a exceção por UUID |
| 4 — Ordem | "Sim, depois (Recomendado)" | Nós novos entram depois dos existentes em cada pai; nenhuma linha atual muda, e o UUID continua derivado do código de ordem |
| 2 — Posições | Respondida na sessão | Calibrou a profundidade da v1 (N5). Desde a v2, com N5 relaxado, não limita mais a cobertura. Por G3, o plano não registra a resposta nem a associa a classes |
| Cobertura (depois do rascunho v1) | "como não existe possibilidade de criar nem que seja pelo usuário administrador, eu preciso cobrir a maior quantidade de galhos possíveis" | Diretriz nova, que tensiona N5 (profundidade proporcional) e o item 1 da régua N7 (só o que um investidor típico possui). A v1 não foi reescrita: a rodada 1 deve avaliar a cobertura à luz desta diretriz, e a correção amplia a árvore. Lembrete: um nó que faltar ainda pode entrar depois por migração nova, só não pela interface |
| Alcance da cobertura | "Confirmo: N7 itens 2 a 5 e N8 continuam valendo; só a profundidade proporcional (N5) e o item 1 da N7 ficam relaxados." | Ampliar bastante, em todas as classes macro, sem atributo como nó: indexador, tributação, veículo, moeda, ticker, nome de instituição ou número de lei (sem variações como CDB pré, pós ou IPCA+, que cruzam com o BL-015). Continua valendo que o nó difere dos irmãos em estrutura, risco ou liquidez, é reconhecível pelo nome e não depende de detalhe legal que muda. A exceção do Tesouro (pergunta 5) permanece |

### Propostas que dependem de confirmação na aprovação

- **X1 — Imóveis físicos (pergunta 1 da ideação).** Imóvel físico no Brasil em Alternativos › Imóveis físicos; fundos imobiliários listados continuam em Renda variável › Imóveis de renda. A exposição é a mesma (imóvel), mas estrutura e liquidez diferem (N7, item 2). Imóvel físico no exterior fica em Investimentos no exterior › Imóveis no exterior (P3).
- **X2 — Poupança como tipo.** O ciclo `013` enquadrou a poupança em Renda fixa › Crédito bancário "sem novo tipo". O tipo Poupança refina esse enquadramento sem mudá-lo (continua sob Crédito bancário). Passa nos cinco itens da régua N7. Se não for confirmado, o nó sai e a poupança continua na subclasse.
- **X3 — Ouro tokenizado.** Pela N3, fica em Alternativos › Ouro; o plano o põe no tipo Ouro financeiro, com contratos, ETFs e fundos de ouro.
- **X4 — Ativos reais tokenizados (v2).** O plano aplica a D1: um token que representa um recebível, um título ou um imóvel segue a exposição do que representa (por exemplo, Renda fixa › Crédito estruturado), e não ganha nó em Criptoativos. A alternativa é Criptoativos › Outros ativos digitais para todo token, privilegiando o meio digital. Nenhuma das duas exige nó novo; a escolha muda só as orientações.

### Registro de aprovação

Em 2026-10-26, depois do veredito `APTO PARA APROVAÇÃO` da rodada 3, o responsável declarou "aprovo o plano do ciclo 014". Aprovada a v3. Na mesma manifestação, pela pergunta que o plano exige, confirmou expressamente as quatro propostas, sem alternativa: "X1 — Imóveis físicos", "X2 — Poupança", "X3 — Ouro tokenizado" e "X4 — Tokenizados". A árvore de 133 nós e as orientações de enquadramento ficam como revisadas. A aprovação cobre a PR documental (ideação, plano e `cycles.md`), a criação da issue depois da integração documental e da confirmação do payload, e o encerramento futuro. Não autoriza implementação, merge nem ação externa.

### Árvore proposta

A ordem da tabela define `ordem` e o código, e o código define o UUID (`a5000000-0000-4000-8000-000000NNMMKK`). As linhas em **negrito** são novas; as demais existem e não mudam. Nós existentes sem filhos novos aparecem só quando ajudam a ler a ordem. Total: **133 nós** (6 classes macro, 23 subclasses e 104 tipos), contra 39 hoje. O número resulta da curadoria nó a nó, na ordem N4, pelos critérios vigentes (N7 itens 2 a 5 e N8); não é meta. Os tipos sem candidato que passe nesses critérios estão justificados na própria tabela.

**Renda fixa (12 nós novos)**

| Código | Caminho | Finalidade e fronteira |
| :-- | :-- | :-- |
| 2.1 | Renda fixa › Dívida soberana | — |
| **2.1.1** | **… › Tesouro Selic** | Pós-fixado de baixa volatilidade; o produto é definido pelo indexador (C1, pergunta 5) |
| **2.1.2** | **… › Tesouro Prefixado** | Risco de taxa nominal, marcação a mercado |
| **2.1.3** | **… › Tesouro IPCA+** | Proteção à inflação, prazo longo, marcação a mercado |
| **2.1.4** | **… › Tesouro Renda+** | Estrutura de renda mensal programada |
| **2.1.5** | **… › Tesouro Educa+** | Estrutura de pagamentos programados para educação |
| **2.1.6** | **… › Carteiras de títulos públicos** | Fundos e ETFs com títulos públicos federais de mais de um produto |
| 2.2 | Renda fixa › Crédito bancário (CDB, RDB, Letras bancárias) | Letras bancárias continua nó único (N2): letras de crédito, de câmbio e financeiras ficam nele |
| **2.2.4** | **… › Poupança** | X2: regra de remuneração e liquidez próprias |
| **2.2.5** | **… › Operações compromissadas** | Estrutura com recompra e lastro em outro título |
| **2.2.6** | **… › Certificados de operações estruturadas** | Nota bancária com retorno atrelado a outro ativo; risco do emissor bancário |
| 2.3 | Renda fixa › Crédito corporativo (Debêntures, Notas comerciais) | — |
| **2.3.3** | **… › Carteiras de crédito privado** | Fundos e ETFs de debêntures e outros títulos de empresas: risco diversificado |
| **2.3.4** | **… › Cédulas de crédito bancário** | Crédito a um tomador formalizado por cédula, em geral sem mercado secundário |
| **2.3.5** | **… › Empréstimos coletivos a empresas** | Empréstimo por plataforma regulada a empresas, pulverizado e ilíquido |
| 2.4 | Renda fixa › Crédito estruturado (Recebíveis imobiliários, Recebíveis do agronegócio, Outros recebíveis) | Sem nós novos: os três tipos já cobrem a exposição; Outros recebíveis é o residual (duplicatas, consignado e afins). Separar por cota sênior ou subordinada seria estrutura do veículo, não da exposição |

Candidatos recusados em Renda fixa: tipos por indexador ou isenção (N8), títulos estaduais e municipais (sem oferta ao investidor pessoa física), Tesouro IGP-M+ (fora de oferta; o pai cobre), depósito com garantia especial (difere só pela cobertura, atributo).

**Renda variável (18 nós novos)**

| Código | Caminho | Finalidade e fronteira |
| :-- | :-- | :-- |
| 3.1 | Renda variável › Participações em empresas (Ações ordinárias, Ações preferenciais) | — |
| **3.1.3** | **… › Units** | Certificado com cesta de ações da mesma empresa |
| **3.1.4** | **… › Direitos e recibos de subscrição** | Direito temporário, com prazo e risco próprios |
| **3.1.5** | **… › Carteiras amplas de ações** | Fundos e ETFs de índice amplo ou de gestão sem foco específico |
| **3.1.6** | **… › Carteiras de empresas menores** | Risco e liquidez maiores que os das amplas |
| **3.1.7** | **… › Carteiras de dividendos** | Estratégia de renda |
| **3.1.8** | **… › Carteiras setoriais e temáticas** | Concentração em um setor ou tema |
| 3.2 | Renda variável › Imóveis de renda | — |
| **3.2.1** | **… › Galpões logísticos e industriais** | Segmento com contratos longos e risco de vacância próprio |
| **3.2.2** | **… › Escritórios** | Risco de vacância e de ciclo econômico |
| **3.2.3** | **… › Shoppings** | Renda ligada ao consumo |
| **3.2.4** | **… › Varejo e renda urbana** | Lojas de rua, supermercados, agências e afins |
| **3.2.5** | **… › Residenciais para renda** | Locação residencial |
| **3.2.6** | **… › Hotéis** | Renda variável com a ocupação |
| **3.2.7** | **… › Saúde e educação** | Hospitais, laboratórios e escolas |
| **3.2.8** | **… › Imóveis rurais** | Fundos listados de terras e armazéns arrendados |
| **3.2.9** | **… › Carteiras imobiliárias diversificadas** | Fundos de vários segmentos e fundos de fundos imobiliários |
| 3.3 | Renda variável › Desenvolvimento imobiliário | — |
| **3.3.1** | **… › Incorporação residencial** | Risco de obra e de vendas residenciais |
| **3.3.2** | **… › Incorporação comercial** | Risco de obra e de locação ou venda comercial |
| **3.3.3** | **… › Loteamentos** | Risco de aprovação e de vendas de lotes |

Candidatos recusados em Renda variável: porte por capitalização como tipo de ação (atributo de estratégia, coberto pelas carteiras), aluguel de ações (a exposição é a própria ação), derivativos e termo (fora do escopo), ETF internacional e BDR (Exterior, N3).

**Alternativos, moedas, outros (33 nós novos)**

| Código | Caminho | Finalidade e fronteira |
| :-- | :-- | :-- |
| 6.1 | Alternativos, moedas, outros › Ouro | — |
| **6.1.1** | **… › Ouro físico** | Custódia física, liquidez menor |
| **6.1.2** | **… › Ouro financeiro** | Contratos, ETFs, fundos e ouro tokenizado (X3) |
| 6.2 | Alternativos, moedas, outros › Outras commodities | — |
| **6.2.1** | **… › Prata e outros metais preciosos** | Metais de reserva de valor, exceto ouro |
| **6.2.2** | **… › Metais industriais** | Ligados ao ciclo industrial |
| **6.2.3** | **… › Energia** | Petróleo, gás e combustíveis |
| **6.2.4** | **… › Agrícolas** | Grãos, carnes e afins |
| **6.2.5** | **… › Créditos de carbono** | Créditos ambientais negociáveis |
| **6.2.6** | **… › Carteiras de commodities** | Fundos e ETFs com cesta de commodities |
| 6.3 | Alternativos, moedas, outros › Exposição a moedas | Sem nós novos: dividir por moeda criaria atributo como nó (N8); um tipo único seria filho redundante |
| 6.4 | Alternativos, moedas, outros › Estratégias multiexposição | — |
| **6.4.1** | **… › Macro** | Posições direcionais em juros, moedas e bolsas |
| **6.4.2** | **… › Long and short** | Posições compradas e vendidas em ações |
| **6.4.3** | **… › Long biased** | Predominância comprada em ações, com proteção |
| **6.4.4** | **… › Quantitativas** | Modelos sistemáticos como o próprio produto |
| **6.4.5** | **… › Juros e moedas** | Sem risco de ações |
| **6.4.6** | **… › Arbitragem** | Ganho de distorções de preço, risco baixo |
| **6.4.7** | **… › Capital protegido** | Estratégia que protege o principal no prazo |
| **6.4.8** | **… › Multiestratégia** | Várias estratégias e fundos de fundos |
| **6.4.9** | **… › Alocação balanceada** | Mistura estável de renda fixa e ações, comum em previdência (o indicador de previdência continua no ativo, N8) |
| 6.5 | Alternativos, moedas, outros › Outros alternativos | — |
| **6.5.1** | **… › Precatórios e créditos judiciais** | Risco de prazo e de pagamento judicial (N6) |
| **6.5.2** | **… › Empréstimos a receber** | Crédito particular, por contrato próprio, sem plataforma nem mercado (N6) |
| **6.5.3** | **… › Bens colecionáveis** | Arte, relógios, vinhos e afins, num nó único (N6) |
| **6.5.4** | **… › Situações especiais** | Créditos de empresas em recuperação ou massa falida |
| **6.6** | **Alternativos, moedas, outros › Imóveis físicos** | X1: imóvel próprio no Brasil, ilíquido |
| **6.6.1** | **… › Residenciais** | Casa ou apartamento |
| **6.6.2** | **… › Comerciais** | Salas, lojas e galpões |
| **6.6.3** | **… › Terrenos** | Sem renda, risco de valorização |
| **6.6.4** | **… › Rurais** | Terra, fazenda e floresta plantada |
| **6.6.5** | **… › Imóveis na planta** | Direito de aquisição, com risco de obra |
| **6.6.6** | **… › Multipropriedade** | Fração de imóvel com uso compartilhado |
| **6.7** | **Alternativos, moedas, outros › Participações em empresas fechadas** | Sem mercado, horizonte longo (N6) |
| **6.7.1** | **… › Startups** | Investimento-anjo e equity crowdfunding |
| **6.7.2** | **… › Private equity** | Participação, direta ou por fundo, em empresas maduras de terceiros |
| **6.7.3** | **… › Projetos de infraestrutura** | Participação em projetos de energia, transporte e afins |
| **6.7.4** | **… › Empresas próprias e familiares** | Participação do próprio investidor ou da família, com controle ou influência |

Candidatos recusados em Alternativos: franquias, semoventes, usinas, consórcio, seguro resgatável e título de capitalização (N6, mantida), derivativos de câmbio e juros (fora do escopo), tipos por moeda (N8).

**Investimentos no exterior (17 nós novos)**

| Código | Caminho | Finalidade e fronteira |
| :-- | :-- | :-- |
| 4.1 | Investimentos no exterior › Dívida soberana no exterior | — |
| **4.1.1** | **… › Títulos de curto prazo** | Títulos soberanos de até um ano e fundos que só os carregam; risco baixo |
| **4.1.2** | **… › Títulos de médio e longo prazo** | Risco de taxa relevante |
| **4.1.3** | **… › Carteiras de títulos soberanos** | Fundos e ETFs com prazos variados |
| 4.2 | Investimentos no exterior › Crédito privado no exterior | — |
| **4.2.1** | **… › Grau de investimento** | Risco de crédito baixo |
| **4.2.2** | **… › Alto rendimento** | Risco de crédito alto |
| **4.2.3** | **… › Recebíveis imobiliários** | Crédito lastreado em imóveis, inclusive fundos listados que financiam imóveis (D1, como no Brasil) |
| **4.2.4** | **… › Títulos híbridos e ações preferenciais** | Dívida subordinada e ações preferenciais de dividendo fixo |
| 4.3 | Investimentos no exterior › Participações em empresas no exterior | — |
| **4.3.1** | **… › Ações individuais** | Ação de uma empresa, direta, ADR ou BDR de ação (N3) |
| **4.3.2** | **… › Carteiras de ações dos Estados Unidos** | Só empresas americanas |
| **4.3.3** | **… › Carteiras de ações globais** | Todos os mercados, inclusive os Estados Unidos |
| **4.3.4** | **… › Carteiras de ações de outros países desenvolvidos** | Desenvolvidos, sem os Estados Unidos |
| **4.3.5** | **… › Carteiras de ações de mercados emergentes** | Risco país e cambial maiores |
| **4.3.6** | **… › Carteiras de empresas menores** | Risco e liquidez maiores |
| **4.3.7** | **… › Carteiras de dividendos** | Estratégia de renda |
| **4.3.8** | **… › Carteiras setoriais e temáticas** | Concentração em um setor ou tema |
| 4.4 | Investimentos no exterior › Imóveis no exterior | — |
| **4.4.1** | **… › Imóveis de renda** | Fundos listados no exterior que possuem imóveis |
| **4.4.2** | **… › Imóveis físicos** | Imóvel próprio no exterior, ilíquido (X1, P3) |

Candidatos recusados no Exterior: tipos por moeda ou domicílio do veículo (N8, P3), carteiras alavancadas e inversas e opções e futuros (derivativos, fora do escopo), títulos protegidos da inflação (indexador, N8).

**Caixa e disponibilidades (nenhum nó novo)**

Os candidatos (conta corrente, conta de pagamento, conta conjunta, saldo em corretora, saldo em moeda estrangeira, cartão pré-pago) só diferem por instituição, cobertura do FGC ou moeda, atributos pela N8. Saldo em liquidação de compra ou venda é o papel do ativo de sistema "Em trânsito". Qualquer nível é selecionável (P1), então Saldos em conta e Dinheiro em espécie bastam.

**Criptoativos e ativos digitais (14 nós novos)**

| Código | Caminho | Finalidade e fronteira |
| :-- | :-- | :-- |
| 5.1 | Criptoativos e ativos digitais › Criptoativos sem lastro | — |
| **5.1.1** | **… › Bitcoin** | Maior ativo, reserva de valor |
| **5.1.2** | **… › Ethereum** | Rede de contratos com perfil próprio |
| **5.1.3** | **… › Outras redes de contratos inteligentes** | Redes de base alternativas |
| **5.1.4** | **… › Redes de segunda camada** | Redes construídas sobre outra |
| **5.1.5** | **… › Criptomoedas de pagamento** | Foco em transferência de valor |
| **5.1.6** | **… › Criptomoedas de privacidade** | Risco regulatório próprio |
| **5.1.7** | **… › Tokens de finanças descentralizadas** | Risco de protocolo |
| **5.1.8** | **… › Tokens de infraestrutura** | Oráculos, armazenamento, computação e pontes |
| **5.1.9** | **… › Tokens de jogos e metaverso** | Dependência de um ecossistema de jogo |
| **5.1.10** | **… › Tokens de torcedores** | Ligados a clubes e equipes |
| **5.1.11** | **… › Memecoins** | Risco especulativo extremo |
| **5.1.12** | **… › Carteiras de criptoativos** | ETFs e fundos com cesta |
| 5.2 | Criptoativos e ativos digitais › Stablecoins (Com reservas, Algorítmicas) | — |
| **5.2.3** | **… › Sintéticas** | Paridade mantida por posições compensadas, com risco de mercado e de contraparte |
| 5.3 | Criptoativos e ativos digitais › Outros ativos digitais | — |
| **5.3.1** | **… › Tokens não fungíveis (NFT)** | Ilíquidos e únicos |

Candidatos recusados em Cripto: nomes de redes e tokens além de Bitcoin e Ethereum (sem ticker, D6), posições de staking e de liquidez (a exposição é o ativo de base), ativos reais tokenizados e stablecoin lastreada em ouro (seguem a exposição: N3 e orientações abaixo), futuros e perpétuos (derivativos).

**Contagem por classe macro dos nós novos:** Renda fixa 12, Renda variável 18, Alternativos 33, Exterior 17, Caixa 0, Cripto 14. Total 94: subclasses 6.6 e 6.7 e 92 tipos.

Regras de nome conferidas: todos com até 100 caracteres, sem dígitos, sem ticker, instituição, gestora ou número de lei, únicos entre irmãos pela normalização do catálogo. Os únicos que casam com `taxa|indexador|cdi|ipca|selic|lci|lca` são Tesouro Selic (020101) e Tesouro IPCA+ (020103), pela pergunta 5. Nomes repetidos sob pais diferentes (Imóveis físicos, Imóveis de renda, Recebíveis imobiliários, Carteiras de empresas menores, Carteiras de dividendos, Carteiras setoriais e temáticas) são aceitos pelo catálogo, e o caminho completo os distingue no seletor.

### Orientações de enquadramento

Texto para a KB-003 e as novidades. Orientam o usuário, que escolhe; o sistema não classifica nada sozinho. A regra é a exposição econômica efetiva (D1), e a ordem de decisão é esta:

1. **Fronteiras fixas primeiro (N3, P3):** saldo parado em conta, em qualquer moeda, é Caixa › Saldos em conta; ouro, inclusive tokenizado ou em stablecoin lastreada em ouro, é Alternativos › Ouro; criptoativo é Criptoativos, mesmo por veículo no exterior. Moeda de cotação e domicílio do veículo, sozinhos, não decidem.
2. **Exposição a um único produto ou instrumento com tipo próprio:** esse tipo, seja direto, por fundo ou por ETF (D1.1).
3. **Vários instrumentos da mesma família:** o tipo "Carteiras de …" dessa família.
4. **Estratégia específica declarada** (empresas menores, dividendos, setorial) prevalece sobre a carteira ampla e sobre a região.
5. **Sem predominância identificável dentro de uma classe macro:** o pai comum dessa classe (P1, P3).
6. **Limite da orientação:** se a exposição se divide entre classes macro sem predominância, ou se faltar a informação que separa dois tipos, a orientação não força um destino. Use o nível mais baixo que a exposição sustenta; quando nem a classe macro se sustenta, o ativo pode ficar sem classe (P1), e aparece como "Sem classe" na distribuição do ciclo `013`. Este plano não cria precedência entre classes macro além das fronteiras de N3 e P3.

Casos fictícios que distinguem os destinos:

| Caso | Destino | Por quê |
| :-- | :-- | :-- |
| ETF que só carrega títulos do Tesouro brasileiro indexados à inflação | Renda fixa › Dívida soberana › Tesouro IPCA+ | Passo 2: um único produto soberano brasileiro |
| Fundo com títulos do Tesouro pós-fixados e prefixados | … › Dívida soberana › Carteiras de títulos públicos | Passo 3: vários produtos da mesma família |
| ETF de títulos indexados à inflação emitidos por empresas | Renda fixa › Crédito corporativo › Carteiras de crédito privado | A exposição é crédito de empresas, não soberana; o indexador não decide (N8) |
| Fundo com metade em títulos públicos e metade em debêntures | Renda fixa | Passo 5: sem predominância, o pai comum |
| Fundo de recebíveis majoritariamente imobiliários | Renda fixa › Crédito estruturado › Recebíveis imobiliários | Passo 2 |
| Fundo de duplicatas e crédito consignado | … › Crédito estruturado › Outros recebíveis | Outros recebíveis é o residual da família |
| Fundo de recebíveis de vários tipos, sem predominância | Renda fixa › Crédito estruturado | Passo 5 |
| Fundo em dólar que só carrega títulos do governo americano de até um ano | Investimentos no exterior › Dívida soberana no exterior › Títulos de curto prazo | Passo 2, pela exposição; não pela moeda |
| Fundo em dólar de papéis de curto prazo de bancos e empresas, todos com grau de investimento | … › Crédito privado no exterior › Grau de investimento | A exposição é crédito privado de baixo risco, embora seja de curto prazo e em dólar |
| O mesmo fundo, sem informação sobre a qualidade de crédito dos papéis | Investimentos no exterior › Crédito privado no exterior | Passo 6: falta o dado que separa Grau de investimento de Alto rendimento, então fica a subclasse (P1) |
| Saldo parado em conta em dólar | Caixa e disponibilidades › Saldos em conta | Passo 1 (N3) |
| ETF na bolsa brasileira que replica um índice de ações americanas | Investimentos no exterior › … › Carteiras de ações dos Estados Unidos | Passo 1 (N3) e passo 3 |
| ETF de dividendos de empresas menores | … › Participações em empresas › Carteiras de empresas menores, ou de dividendos, conforme o foco principal declarado; com dois focos sem principal, Participações em empresas | Passos 4 e 5 |
| ETF de tecnologia dos Estados Unidos | … › Participações em empresas no exterior › Carteiras setoriais e temáticas | Passo 4: a estratégia prevalece sobre a região |
| Fundo long and short operado por modelos | … › Estratégias multiexposição › Long and short | A estratégia define o tipo; Quantitativas é para o método como produto, sem estratégia dominante |
| Fundo imobiliário com 80% em imóveis de vários segmentos e 20% em recebíveis | Renda variável › Imóveis de renda › Carteiras imobiliárias diversificadas | Predominância em imóveis (passo 3) |
| Fundo imobiliário dividido igualmente entre imóveis e recebíveis | Sem classe | Passo 6: Imóveis de renda e Crédito estruturado estão em classes macro diferentes, sem pai comum selecionável |
| Fundo listado de terras arrendadas | Renda variável › Imóveis de renda › Imóveis rurais | Fundo listado; a fazenda própria é Alternativos › Imóveis físicos › Rurais (X1) |
| Empréstimo a empresa por plataforma regulada | Renda fixa › Crédito corporativo › Empréstimos coletivos a empresas | Plataforma e contrato padronizado; empréstimo a um conhecido, por contrato próprio, é Alternativos › Outros alternativos › Empréstimos a receber |
| Certificado bancário com capital protegido e retorno ligado a um índice | Renda fixa › Crédito bancário › Certificados de operações estruturadas | Risco do emissor bancário; o fundo com estratégia de capital protegido é Estratégias multiexposição › Capital protegido |
| Token de staking líquido de Ethereum | Criptoativos › Criptoativos sem lastro › Ethereum | A exposição é o ativo de base |
| Token que representa um recebível | Renda fixa › Crédito estruturado, no tipo do recebível | A exposição é o crédito, não o meio digital (proposta X4, a confirmar) |

### Contrato da migração

1. Nome gerado por `npx supabase migration new taxonomia_ativos_ampliacao`, posterior a `20261026215542`.
2. Somente `insert into public.taxonomia_ativos (id, parent_id, nivel, nome, ordem)`, com UUID e ordem explícitos, primeiro nível 2 e depois nível 3, como na migração do ciclo `013`. Sem `update`, `delete`, `alter`, `grant`, `revoke`, política ou função. Comentário de cabeçalho com ciclo, issue e decisões.
3. A migração é transacional: qualquer violação de restrição aborta tudo.
4. O catálogo fica fora da marca de coerência da carteira (`013`, R1-2). A inserção não toca `ativos` nem `profiles`, então nenhuma marca muda. Na aplicação em produção, uma leitura que comece antes e termine depois do `db push` pode ver o catálogo antigo, que continua válido, porque nenhum nó some ou muda.

### Pontos de aprovação

| Ponto | Precondição | Cobre | Não cobre | Conferir |
| :-- | :-- | :-- | :-- | :-- |
| Autorizar rascunho (recebida em 2026-10-26) | Ideação registrada | Este plano local e a reconciliação de `cycles.md` | Revisão, publicação, implementação | Ideação N1–N8 e Registro de decisões |
| Aprovar plano: "aprovo o plano do ciclo 014" | Veredito apto posterior à revisão formal | PR documental (ideação, plano e `cycles.md`); issue depois da integração documental e da confirmação do payload; encerramento futuro | Merges, implementação, ação externa | Árvore nó a nó (uma classe macro por vez, N4), orientações de enquadramento, X1–X4 e testes. A manifestação deve dizer se confirma X1, X2, X3 e X4; sem isso, esclarecer antes de promover |
| Aprovar merge: "aprovo o merge da PR #N" | PR específica, diff e checks verdes | Somente aquele merge | Outra PR, ação externa | Documental, entrega, release e encerramento, separadamente |
| Autorizar implementação: "autorizo a implementação da issue #N" | Plano aprovado, documental integrada, issue válida | A unidade e suas validações locais | Merge e banco de produção | Payload, escopo e task |
| Ação humana externa: "concluí a ação externa da issue #N" | Merge da entrega na `main` | Registro do `db push` feito pelo responsável e conferência acessível | Execução pelo agente | Roteiro E1, apenas contagens |

Não há "Verificar produção" separado: a conferência da E1 (contagens e um nó novo visível no seletor, sem gravar dado) cobre a única mudança visível. Para a cadeia: ambiguidade de enquadramento ou de nome, necessidade de mudar nó existente, seletor ou regra, dado privado em evidência, migração fora do escopo pendente em produção ou falha de restrição. Ciclo completo não admite modo contínuo.

## Barreiras de domínio

| Barreira | Aplica-se? | Como o ciclo a atende ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Nenhuma regra de cálculo muda. A distribuição por classe macro (`013`, unidade 3) usa só o nível 1 e sobe no máximo dois pais; todos os nós novos estão sob as seis classes macro, a no máximo dois níveis delas |
| G2 — isolamento por RLS | Não, com teste de regressão | Sem tabela, política, grant ou função nova. Os testes existentes de leitura por `authenticated`, bloqueio de `anon` e escrita negada (inclusive ao admin) são mantidos, e as contagens passam a 133 |
| G3 — privacidade de dados | Sim | Nomes genéricos; o arquivo em `local/` não é versionado nem transcrito; a resposta sobre posições não é registrada; fixtures fictícias; evidências da E1 só com contagens do catálogo |
| G4 — migrações só acrescentam | Sim | Uma migração nova; nenhuma anterior é editada. Correção futura, se houver, por migração nova |

## Estratégia de testes

Gates documentais (Node 24): `node --test scripts/validate-governance.test.mjs`, `node scripts/validate-governance.mjs`, `git diff --check`, `git status --short`. Aplicação: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Banco: `npx supabase start`, `npx supabase test db`. Interface: `npm run test:e2e`, sem backend e com as variáveis do Supabase local (README).

**pgTAP (`09_taxonomia_ativos.test.sql`), adaptado sem enfraquecer:**

- Os 39 nós originais intactos: lista literal de (UUID, pai, nível, nome, ordem) igual à do ciclo `013`.
- A árvore completa: 133 nós; 6, 23 e 104 por nível; lista exata em ordem de apresentação; toda identidade derivada do código (asserção existente, agora sobre 133, inclusive os códigos com ordem de dois dígitos, como 5.1.10 → `050110`).
- Nomes: nenhum dígito; nenhum `taxa|indexador|cdi|ipca|selic|lci|lca`, exceto os UUIDs 020101 e 020103.
- Restrições, leitura e escrita: as asserções existentes continuam, com "39" trocado por "133" e "40" por "134". Acrescentar uma tentativa de filho sob um tipo novo de nível 3 (recusada) e de exclusão de uma subclasse nova com filhos (recusada). As fixtures negativas existentes continuam válidas com a árvore nova: as ordens que usam (9 sob Renda fixa, Crédito bancário e Crédito corporativo; 4 sob Renda variável; 1 nas raízes e sob Renda fixa) seguem livres ou repetidas exatamente onde o teste espera, porque Renda fixa e Renda variável não ganham subclasses e os pais citados ficam com no máximo seis filhos.
- Atualizar `plan(N)` e o total de asserções da suíte registrado na KB-003.

**Ensaio local de atualização (obrigatório, só local):** em instância descartável, `npx supabase db reset --local --version 20261026215542 --no-seed`; carregar fixture fictícia em `tests/fixtures/taxonomia/` com dois usuários e ativos ligados a nós de nível 1, 2 e 3 e a "Sem classe"; guardar o retrato de `ativos (id, taxonomia_id)` e `profiles.versao_classificacao`; conferir que só a migração nova está pendente; `npx supabase migration up --local`; comparar o retrato (idêntico) e as contagens do catálogo (39 → 133). Registrar comandos, versões e resultados na task. Ao fim, reset completo e suíte normal.

**Unitários e e2e:** `src/lib/telas/taxonomia.test.ts` ganha um caso com um pai que tem filhos novos depois dos antigos (ordem hierárquica preservada). Em `tests/e2e/ativos-detalhes.spec.ts`, a busca "CREDITO bancario" passa a esperar sete opções (a subclasse, os três tipos atuais e Poupança, Operações compromissadas e Certificados de operações estruturadas); acrescentar a busca "tesouro", que lista exatamente os cinco tipos do Tesouro, e confirmar que "ouro" ainda seleciona o nó Ouro pelo nome exato (a busca agora também lista Ouro físico, Ouro financeiro e os caminhos com "Tesouro"). Conferir o seletor a 360 px úteis, com teclado e toque, sem rolagem horizontal nos caminhos mais longos.

## Itens de implementação

### Item 1 — Ampliar a árvore da taxonomia

**Contexto:** a árvore do ciclo `013` deixa muitos ativos no nível 2.

**Ação técnica:** criar a migração do "Contrato da migração" com os 94 nós aprovados; adaptar o pgTAP 09, o unitário da taxonomia e o e2e; fazer o ensaio local; atualizar a KB-003 (contagens, orientações de enquadramento, histórico), as novidades (`src/lib/novidades.ts`) e preparar o roteiro E1 na task. O `DESIGN.md` não muda; se o seletor precisar de padrão novo, parar.

**Critérios de aceite:**

- [ ] A árvore no banco é exatamente a aprovada (133 nós, 6/23/104), com os 39 originais intactos e UUIDs derivados do código.
- [ ] Nenhum nome tem dígito, ticker, instituição, gestora ou número de lei; a exceção de indexador vale só para os dois nós do Tesouro.
- [ ] Restrições, leitura e escrita do catálogo continuam provadas; o ensaio local mostra vínculos e marcas idênticos antes e depois.
- [ ] Unitários, e2e e todos os gates passam; KB-003 e novidades atualizadas; roteiro E1 pronto.

## Arquivos afetados

| Área | Arquivos |
| :-- | :-- |
| Banco | Nova migração em `supabase/migrations/`; `supabase/tests/database/09_taxonomia_ativos.test.sql` |
| Testes | `src/lib/telas/taxonomia.test.ts`; `tests/e2e/ativos-detalhes.spec.ts`; fixture fictícia em `tests/fixtures/taxonomia/` |
| Documentação | `_project/knowledge/KB-003_visao_produto_arquitetura.md`; `src/lib/novidades.ts`; KB-002 só se o registro de S12 pedir |
| Governança | Plano, task da issue e `_project/cycles.md` |

## Decomposição em issues e PRs

Payload confirmado pelo responsável em 2026-10-26, depois da integração documental (PR #143); issue criada: [#144](https://github.com/EuThiagoAndrade/saldo-futuro/issues/144).

| Unidade | Título proposto | Dependência | PR e fechamento |
| :-- | :-- | :-- | :-- |
| 1 | [FEATURE] Ampliar a árvore da taxonomia de classes de ativos | Plano aprovado e documental integrada | Uma PR; a issue fica aberta até a E1 e fecha pela PR de encerramento |

Branches: `chore/cycle-014-plan` (documental), `feature/issue-N` (entrega), `chore/cycle-014-closure` (encerramento). Commits `docs(cycle-014):`, `feat(issue-N):` e `chore(cycle-014):`. Release pela PR do release-please, com aprovação própria; tirar da descrição dela qualquer vínculo que feche a issue antes do encerramento.

## Dependências e blockers

Não há bloqueio para revisar. A implementação depende da revisão, da aprovação do plano (com X1–X4), da integração documental e da autorização da issue. Docker e Supabase local na execução. Produção depende do responsável na E1. Nenhuma dependência nova de pacote.

Paralelismo com o ciclo `013`: a unidade 3 (#139) e este ciclo podem tocar a KB-003 e `src/lib/novidades.ts`. Quem integrar depois atualiza a branch e resolve o conflito de texto; nenhum dos dois toca a migração do outro.

### E1 — Ação externa depois da unidade 1

1. Confirmar o merge, `main` atualizada e o alvo do Supabase (KB-002 S12). `npx supabase migration list`: só a migração deste ciclo pendente; outra pendente para antes do push.
2. Antes do push, contar `taxonomia_ativos` no total e por nível (esperado 39; 6, 21 e 12).
3. `npx supabase db push`; depois, `npx supabase migration list` alinhado.
4. Contar de novo (esperado 133; 6, 23 e 104). Registrar só as contagens. Sem consulta a `ativos`, nomes de ativos ou usuários.
5. Na aplicação, abrir o cadastro de ativo e buscar "tesouro" no seletor, sem gravar nada; confirmar que os cinco tipos do Tesouro aparecem.
6. Declarar "concluí a ação externa da issue #N". O agente confere o que for acessível e registra o que só o responsável verificou.

## Riscos, suposições e rollback

- **Curadoria permanente.** Um nó referenciado não sai e renomear exige migração. Os critérios vigentes da N7 (itens 2 a 5), a N8, a revisão por classe macro (N4) e a confirmação de X1–X4 mitigam; ampliar não autoriza atributo como nó.
- **Sobreposição de enquadramento.** Com mais tipos, mais ativos cabem em dois (por exemplo, carteira de dividendos de empresas menores). As orientações de enquadramento dão a ordem de decisão e os casos fictícios; sem predominância, o pai da classe macro; sem sustentação nem para a classe macro, Sem classe. O sistema não decide.
- **Ordem menos natural.** "Outros alternativos" fica antes de Imóveis físicos e de Participações em empresas fechadas, por decisão (pergunta 4).
- **Testes históricos.** Trocar "39" por "133" sem provar os originais esconderia uma alteração; por isso a lista literal dos 39.
- **Seletor mais longo.** Com 133 opções, a lista sem filtro fica longa; a busca pelo caminho continua. Conferência a 360 px no e2e.
- **Rollback.** Antes do `db push`, basta não aplicar. Depois, nós sem vínculo podem sair por migração nova revisada; nó já referenciado não pode ser excluído, e a correção é por migração aditiva (renomear) com aprovação própria. Não editar a migração aplicada.

## Sequência recomendada

1. Revisão formal (rodada 1), uma classe macro por vez, na ordem de N4; correções se necessárias.
2. Aprovação do plano, com manifestação sobre X1, X2, X3 e X4.
3. PR documental com ideação, plano e `cycles.md`; checks e aprovação do merge.
4. Confirmar o payload e abrir a issue.
5. Autorizar a implementação, implementar e testar, publicar, aprovar o merge.
6. E1 pelo responsável.
7. Release pelo release-please, se houver, com aprovação própria.
8. Encerramento prospectivo em PR própria: documentação viva, issue fechada se a E1 estiver comprovada, pasta em `executed/`, plano e ciclo `Concluído`.

## Referências

- `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`.
- `.agent/workflows/rascunhar_plano.md` e `.agent/templates/plano_implementacao.md`, lidos no ponto de uso.
- Ideação `_project/ideations/014_ampliacao_arvore_taxonomia.md`.
- Plano `_project/drafts/013_taxonomia_classes_alocacao/013_plan.md` (D1, D1.1, D6, P1, P3, R1-2 e árvore D16).
- `supabase/migrations/20261026204955_taxonomia_ativos.sql`, `supabase/tests/database/09_taxonomia_ativos.test.sql`, `src/lib/telas/taxonomia.ts`, `tests/e2e/ativos-detalhes.spec.ts`.
- KB-002 S12, KB-003 e `design-system/DESIGN.md` 6.8.

## Rastreabilidade

| Campo | Valor |
| :-- | :-- |
| Issue(s) | [#144](https://github.com/EuThiagoAndrade/saldo-futuro/issues/144) (unidade 1) |
| PR(s) | [#143](https://github.com/EuThiagoAndrade/saldo-futuro/pull/143) — documental, integrada; unidade 1: [#145](https://github.com/EuThiagoAndrade/saldo-futuro/pull/145) |
| Branch(es) | `chore/cycle-014-plan` (integrada); `feature/issue-144` |
| Destino após conclusão | `_project/executed/014_ampliacao_arvore_taxonomia/014_plan.md` |

## Próximo passo

O artefato ativo do ciclo passou a ser a task `014_task_issue-144.md`; este bloco a acompanha.

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 014 (completo)
Quem: Responsável
Conferir: checks e diff da PR https://github.com/EuThiagoAndrade/saldo-futuro/pull/145
Diga: "aprovo o merge da PR #145"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 014 + criar_issues + feature/unidade-1 + 014_plan v3`
- `effect_class`: `remote_mutation`
- `state_before`: plano v3 Aprovado; PR documental #143 integrada por squash em `346a93aa686bcb6c3851b7edcdc18ceb0916aa46`, com checks verdes; nenhuma issue do ciclo (busca por título vazia); payload confirmado pelo responsável.
- `state_after`: issue #144 aberta com o payload confirmado, no formulário Feature; plano com a issue registrada localmente em `main`, sem commit (segue na branch da entrega, como no ciclo `013`); implementação não autorizada.
- `result`: `executed`
- `evidence`: https://github.com/EuThiagoAndrade/saldo-futuro/issues/144 conferida por `gh issue view` (aberta, título igual ao payload); PR https://github.com/EuThiagoAndrade/saldo-futuro/pull/143 integrada.
- `blockers`: a implementação depende de "autorizo a implementação da issue #144".

## Revisão crítica

### Rodada 1

- **Data:** 2026-10-26.
- **Versão revisada:** v1, incluindo as duas diretrizes posteriores de cobertura registradas no plano; base local `3dd60910ace387d03a2cff878f2ea0e9acd816a6`.
- **Autor:** não identificado por ferramenta/modelo no artefato recebido; autoria não inferida.
- **Revisor:** Codex, GPT-6.
- **Veredito:** `REQUER NOVA RODADA`.

#### Achados

- **R1-1 — Bloqueador: a árvore ainda aplica a restrição de profundidade relaxada pelo responsável.** O Registro de decisões manda ampliar bastante em todas as classes macro, mantendo N7 itens 2 a 5 e N8. Entretanto, a justificativa dos 87 nós ainda invoca N5; Imóveis de renda e Desenvolvimento imobiliário adiam segmentos por N5, e Outras commodities permanece sem tipos pela mesma razão. A v1 registra explicitamente que essa mudança ficou para a correção. Assim, aprová-la autorizaria uma entrega sabidamente anterior à diretriz vigente. Na v2, revisar a cobertura na ordem N4, justificar inclusões e exclusões pelos critérios ainda vigentes e atualizar conjuntamente árvore, contagens, aceite, testes, riscos e E1. Não substituir a curadoria por uma meta numérica de 120–160, nem preencher Caixa com atributos só para crescer. Preservar N2 e as exclusões expressas de N6/N8.
- **R1-2 — Bloqueador: orientações de enquadramento contradizem D1/P3 e a própria árvore.** A linha 2.4 diz simultaneamente que fundos de recebíveis seguem o recebível e que FIDC vai a Outros recebíveis, sem condicionar esse último destino à exposição. A orientação de fundo de liquidez em dólar o envia automaticamente a Dívida soberana no exterior, embora P3 determine que moeda e veículo isoladamente não definem classe. O exemplo de ETF de títulos indexados à inflação também o envia a Tesouro IPCA+ sem delimitar exposição soberana brasileira nem esclarecer a fronteira com Carteiras de títulos públicos. São instruções previstas para a KB-003 e para usuários, portanto podem induzir classificação incompatível com a regra aprovada mesmo sem alterar cálculo. Condicionar os exemplos à exposição efetiva e à precedência existente; reservar Outros recebíveis para a exposição residual correspondente; explicitar quando uma cesta fica em Carteiras de títulos públicos e quando acompanha um produto. Usar casos fictícios que distingam os destinos, sem criar regra automática ou reabrir D1/P3.
- **R1-3 — Ressalva: faltam critérios de desempate entre tipos sobrepostos.** O risco de sobreposição afirma que as orientações dão precedência, mas elas só resolvem estratégia específica versus ampla. Não resolvem, por exemplo, carteira simultaneamente de empresas menores e de dividendos, nem estratégia quantitativa de long and short. A proposta de carteiras globais também inclui outros países desenvolvidos sem que isso esteja claro no nome. Definir exemplos e um critério de escolha compreensível, ou indicar expressamente o pai como opção quando não houver predominância identificável (P1/P3). Essa orientação deve acompanhar os novos tipos da v2; não inventar classificação pelo sistema.

#### Conferência por classe macro (ordem N4)

1. **Renda fixa:** exceção nominal do Tesouro autorizada e limitada por UUID; Poupança depende de X2. Resolver R1-2 e reavaliar cobertura sem separar Letras bancárias nem criar tipos por indexador.
2. **Renda variável:** os quatro acréscimos preservam os dois tipos atuais; o adiamento dos segmentos imobiliários por N5 precisa ser revisto (R1-1), e carteiras específicas precisam de orientação (R1-3).
3. **Alternativos:** os 19 acréscimos respeitam os códigos existentes e as duas subclasses novas entram por último. X1/X3 continuam propostas; reavaliar as famílias deixadas rasas e esclarecer sobreposições (R1-1/R1-3).
4. **Investimentos no exterior:** os dez acréscimos mantêm os pais existentes. A classificação por exposição precisa prevalecer sobre moeda e veículo também nos exemplos (R1-2); esclarecer o alcance de carteiras globais (R1-3).
5. **Caixa:** ausência de nós novos não é, por si só, defeito: N8 permanece e qualquer nível é selecionável. Justificar a cobertura pelos critérios vigentes, sem duplicar moeda, instituição ou FGC.
6. **Criptoativos:** os sete acréscimos não mudam os tipos de stablecoin. Reavaliar a cobertura sem usar a antiga limitação de profundidade; manter ouro fora desta macro e os nomes sem ticker.

#### Itens atendidos e evidências

- Escopo técnico delimitado a uma migração de inserção, testes e documentação; nenhuma autorização de implementação, publicação ou merge inferida.
- A contagem da tabela fecha em 48 acréscimos (2 subclasses e 46 tipos), total 87, com 6/23/58. Códigos propostos não colidem com os 39 nós da migração `20261026204955_taxonomia_ativos.sql`.
- Preservação literal de UUID, pai, nível, nome e ordem dos originais; ensaio local de atualização verifica vínculos e marcas. G1/G2 sem mudança funcional, regressões de acesso previstas, G3 e G4 explícitas.
- Inspecionados pgTAP 09, e2e de detalhes, montagem da taxonomia e contrato do seletor em DESIGN.md 6.8. As contagens fixas e a busca por caminho justificam as adaptações propostas. A v2 deve reavaliar também ordens usadas pelas fixtures negativas se ampliar subclasses.
- Baseline local conferida; GitHub consultado por `gh`: #139 aberta, PR #142 integrada e PR #141 aberta. Isso verifica o planejamento concorrente, não produção. E1/E2 do ciclo 013 permanecem evidências documentais prévias.
- Nenhum arquivo de dados em `local/` nem carteira de produção foi lido nesta revisão. Nenhum teste de aplicação ou banco foi executado para validar uma migração que ainda não existe.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 014 + revisar_plano + 014_plan/rodada-1 + v1-diretrizes-cobertura-2026-10-26`
- `effect_class`: `local_mutation`
- `state_before`: v1 em Rascunho, revisão e veredito pendentes; Aguardando revisão (rodada 1); plano local não versionado.
- `state_after`: v1 em Em Revisão, rodada 1 concluída, REQUER NOVA RODADA; Aguardando correções (rodada 1); aprovação humana pendente.
- `result`: `executed`
- `evidence`: achados e conferências desta rodada; cabeçalho e Próximo passo atualizados. Handoff anterior preservado como histórico do rascunho.
- `blockers`: R1-1 e R1-2. R1-3 é ressalva. Primeira rodada, sem histórico de oscilação ou falta de progresso.

#### Resposta do autor à rodada 1 — v2

- **Data:** 2026-10-26.
- **Autor:** Claude Code (Claude Opus 5.5), o mesmo da v1.
- **Autorização:** "corrija o plano do ciclo 014".
- A rodada 1 acima foi preservada integralmente. Os estados abaixo são respostas do autor, não um novo veredito; a rodada 2 ainda não ocorreu.

| Achado | Resposta do autor | Evidência na v2 |
| :-- | :-- | :-- |
| R1-1 | Corrigido | Árvore refeita por classe macro na ordem N4, sem N5: 94 nós novos (Renda fixa 12, Renda variável 18, Alternativos 33, Exterior 17, Caixa 0, Cripto 14), total 133 (6/23/104). Segmentos de Imóveis de renda, tipos de Desenvolvimento imobiliário e de Outras commodities incluídos. Cada classe traz os candidatos recusados com o critério vigente (N7 itens 2 a 5, N8, N6, fora do escopo); Caixa continua sem nós, justificada pela N8 e pelo ativo de sistema Em trânsito. O número não é meta. Objetivo, escopo, contagens, testes (inclusive fixtures negativas), aceite, riscos e E1 atualizados. N2, N6 e N8 preservadas |
| R1-2 | Corrigido | Nova seção "Orientações de enquadramento": ordem de decisão em cinco passos pela exposição efetiva (fronteiras N3/P3 primeiro; moeda e veículo sozinhos não decidem) e 20 casos fictícios. Fundo de liquidez em dólar vai à dívida soberana ou ao crédito privado conforme a carteira; o ETF só chega a Tesouro IPCA+ com exposição exclusiva ao produto soberano brasileiro, e a fronteira com Carteiras de títulos públicos e com crédito privado está explícita; Outros recebíveis é o residual da família, e fundo sem predominância fica no pai. Nenhuma regra automática. O caso de token de recebível virou a proposta X4, para decisão do responsável |
| R1-3 | Corrigido | Desempates nos passos 4 e 5 e nos casos: foco principal declarado, e com dois focos o pai; estratégia prevalece sobre a região; Long and short prevalece sobre Quantitativas quando a estratégia é a long and short. Carteiras globais passaram a significar todos os mercados, inclusive os EUA, e o novo tipo Carteiras de ações de outros países desenvolvidos cobre os desenvolvidos sem os EUA, com o alcance no nome |

### Rodada 2

- **Data:** 2026-10-26.
- **Versão revisada:** v2; base local `3dd60910ace387d03a2cff878f2ea0e9acd816a6`.
- **Autor:** Claude Code (Claude Opus 5.5), conforme identificação na resposta à rodada 1.
- **Revisor:** Codex, GPT-6.
- **Veredito:** `REQUER NOVA RODADA`.

#### Achados

- **R2-1 — Bloqueador: dois casos ainda prescrevem um destino sem informação suficiente (remanescente de R1-2).** Nas Orientações de enquadramento, o fundo em dólar de papéis de curto prazo de bancos e empresas é enviado a Grau de investimento, mas o enunciado não informa a qualidade de crédito que distingue esse tipo de Alto rendimento. Explicitar essa condição no caso fictício; sem ela, usar a subclasse Crédito privado no exterior, permitida por P1. Além disso, o passo 5 e o caso do fundo imobiliário com imóveis e recebíveis mandam escolher a parte maior mesmo sob a premissa de ausência de predominância identificável. O caso exatamente dividido não tem parte maior, e classes macro diferentes não têm pai comum selecionável na árvore. Retirar essa prescrição sem fundamento e explicitar o limite da orientação: se não houver enquadramento sustentado pela exposição, não forçar uma macro; a classificação pode permanecer não informada (P1). Se o autor desejar estabelecer uma nova precedência entre macros, deverá submetê-la como decisão explícita, sem inferi-la de P3. Os dois textos vão para a KB-003 e orientam a classificação que alimenta a distribuição do ciclo 013, portanto precisam estar coerentes antes da aprovação.

#### Resolução dos achados anteriores e progresso

| Achado | Resultado da revisão | Evidência |
| :-- | :-- | :-- |
| R1-1 | Resolvido | Cobertura ampliada e revisada na ordem N4; segmentos imobiliários, commodities e cripto detalhados; Caixa permanece sem atributos como nós. Contagens, aceite, ensaio e E1 atualizados para 133 |
| R1-2 | Parcialmente resolvido; restante em R2-1 | FIDC segue o recebível; Tesouro e carteiras de títulos públicos ganharam fronteira explícita; moeda deixou de determinar soberano versus privado. Restam a inferência de grau de investimento e a escolha forçada entre macros sem predominância |
| R1-3 | Resolvido | Foco declarado e uso do pai resolvem carteiras sobrepostas na mesma família; Long and short versus Quantitativas tem exemplo; carteiras globais e desenvolvidos sem EUA estão distinguidas |

Bloqueadores diminuíram de dois para um. Há progresso material, sem contestação persistente nem reabertura de achado já aceito como corrigido; cabe correção e rodada 3, dentro do teto de cinco.

#### Itens atendidos e evidências

- Conferência da tabela por extração das linhas novas: 94 códigos distintos, sendo 2 subclasses e 92 tipos; por macro, Renda fixa 12, Renda variável 18, Alternativos 33, Exterior 17, Caixa 0 e Cripto 14. Somados aos 39 originais, resultam 133 nós (6/23/104). Revisão na ordem N4 concluída.
- Migração continua restrita a inserções, com preservação dos 39 originais e sem mudança de cálculo, RLS, grants, funções ou tela. Testes previstos cobrem árvore exata, originais, restrições, acessos, vínculos e marcas no ensaio de atualização; não foram executados testes de uma migração ainda inexistente.
- Fixtures do pgTAP 09 inspecionadas: ordem 9 sob os pais usados permanece disponível para os testes, e ordem 4 sob Renda variável permanece disponível para a inserção válida. A busca de Crédito bancário passa coerentemente a sete opções; busca exata de Ouro evita confusão com os novos descendentes e Tesouro.
- X1–X4 permanecem propostas para manifestação explícita na aprovação. A revisão não confirma essas escolhas, não promove o plano e não autoriza implementação.
- Base local conferida; consultas `gh` confirmaram #139 e PR #141 ainda abertas. A concorrência documental com o ciclo 013 permanece identificada. Produção e dados em `local/` não foram acessados.
- Autoridades aplicadas: `.agent/ai_behavior.md`, `_project/README.md` (Revisão formal e situações), `_project/cycles.md`, workflow `revisar_plano`, template `plano_implementacao`, N1–N8 da ideação e P1/P3 do ciclo 013, com a diretriz posterior de cobertura registrada no plano.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 014 + revisar_plano + 014_plan/rodada-2 + v2`
- `effect_class`: `local_mutation`
- `state_before`: v2 Em Revisão, Aguardando revisão (rodada 2), aprovação humana pendente; plano local sem commit.
- `state_after`: v2 Em Revisão, rodada 2 concluída com REQUER NOVA RODADA; Aguardando correções (rodada 2); aprovação humana permanece pendente.
- `result`: `executed`
- `evidence`: parecer e tabela de resolução desta rodada; cabeçalho e Próximo passo atualizados; rodada 1 e resposta do autor preservadas.
- `blockers`: R2-1, remanescente de R1-2; nenhum impedimento operacional para corrigir os exemplos dentro das regras existentes.

#### Resposta do autor à rodada 2 — v3

- **Data:** 2026-10-26.
- **Autor:** Claude Code (Claude Opus 5.5).
- **Autorização:** "corrija o plano do ciclo 014".
- A rodada 2 acima foi preservada integralmente. O estado abaixo é resposta do autor, não um novo veredito; a rodada 3 ainda não ocorreu.

| Achado | Resposta do autor | Evidência na v3 |
| :-- | :-- | :-- |
| R2-1 | Corrigido | O caso do fundo em dólar agora declara que todos os papéis têm grau de investimento, e um caso novo mostra o mesmo fundo sem essa informação na subclasse Crédito privado no exterior (P1). O passo 5 vale só dentro de uma classe macro; o passo 6, novo, diz que a orientação não força destino entre classes macro sem predominância nem sem o dado que separa tipos: vale o nível mais baixo sustentado e, se nem a classe macro se sustenta, Sem classe (P1), com o efeito na distribuição do ciclo `013` explícito. A "parte maior" saiu. O caso do fundo imobiliário virou dois: predominância em imóveis (Carteiras imobiliárias diversificadas) e divisão igual (Sem classe). Nenhuma precedência nova entre classes macro foi criada. O risco de sobreposição foi ajustado ao mesmo limite. Árvore, contagens e testes não mudaram |

### Rodada 3

- **Data:** 2026-10-26.
- **Versão revisada:** v3; base local `3dd60910ace387d03a2cff878f2ea0e9acd816a6`.
- **Autor:** Claude Code (Claude Opus 5.5), conforme identificação nas respostas do autor.
- **Revisor:** Codex, GPT-6.
- **Veredito:** `APTO PARA APROVAÇÃO`.

#### Achados e resolução

Nenhum novo bloqueador ou ressalva nesta rodada.

- **R2-1 resolvido:** o caso de Grau de investimento agora declara a qualidade de crédito dos papéis; o caso sem essa informação fica em Crédito privado no exterior. O passo 5 limita o pai comum à mesma classe macro, e o passo 6 permite ausência de classificação quando não há enquadramento sustentado. Os casos de imóveis com recebíveis distinguem predominância explícita de divisão igual. A prescrição de escolher a parte maior sem informação foi retirada, sem criar precedência nova entre macros.
- **R1-1, R1-2 e R1-3 encerrados:** a cobertura ampliada e os desempates aceitos na rodada 2 permanecem; R2-1 encerra a parte remanescente de R1-2. Bloqueadores passaram de dois para um e agora zero, sem oscilação.

#### Itens atendidos e limites da revisão

- A proposta permanece em 94 nós novos e 133 no total (6/23/104); a extração das linhas novas confirmou 94 entradas. Preservados o contrato de uma migração só de inserção, os 39 originais, os testes de regressão e o ensaio de atualização, sem ampliação técnica decorrente da correção.
- Objetivo, escopo, aceite, dependências, riscos, G1–G4, E1 e pontos de aprovação continuam compatíveis com a entrega documental e técnica proposta. A validação funcional de banco e aplicação será feita na implementação, conforme o plano; esta revisão não comprova uma migração ainda inexistente.
- Base local conferida; `gh` confirmou #139 e PR #141 abertas. Não houve consulta a produção nem leitura de dados em `local/`.
- Aplicados `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, `.agent/workflows/revisar_plano.md` e `.agent/templates/plano_implementacao.md`, com as autoridades de domínio e evidências registradas nas rodadas anteriores.
- **Aprovação ainda pendente:** este veredito não aprova nem promove o plano. A manifestação humana deve confirmar expressamente X1 (imóveis físicos), X2 (Poupança), X3 (ouro tokenizado em Ouro financeiro) e X4 (ativos reais tokenizados pela exposição), conforme a tabela de pontos de aprovação. Alternativa que altere a proposta deve ser reconciliada antes da promoção. Implementação, merges e ação externa mantêm suas autorizações próprias.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 014 + revisar_plano + 014_plan/rodada-3 + v3`
- `effect_class`: `local_mutation`
- `state_before`: v3 Em Revisão, Aguardando revisão (rodada 3), aprovação humana pendente; plano local sem commit.
- `state_after`: v3 Em Revisão, revisão concluída com APTO PARA APROVAÇÃO; Aguardando aprovação do plano; aprovação humana permanece pendente.
- `result`: `executed`
- `evidence`: parecer da rodada 3, resolução de R2-1, cabeçalho e Próximo passo atualizados; histórico das rodadas e respostas preservado.
- `blockers`: nenhum para aprovação da proposta revisada; manifestação humana sobre o plano e X1–X4 ainda necessária para promoção.

## Pós-mortem

- **Data de conclusão:** —
- **Desvios:** —
- **Lições comprovadas:** —
