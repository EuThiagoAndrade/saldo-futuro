# Plano de Implementação — Atributos complementares dos ativos

> **Ciclo:** `017`
> **Status:** `Concluído`
> **Versão:** `v5`
> **Data de criação:** 2026-10-30
> **Última atualização:** 2026-10-31
> **Tipo:** `feature`
> **Prioridade:** `P2`
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 017" em 2026-10-30
> **Autorização do rascunho:** "autorizo o rascunho do plano do ciclo 017" em 2026-10-30
> **Autorização da correção:** "corrija o plano do ciclo 017" em 2026-10-30
> **Autorização da correção v3:** "corrija o plano do ciclo 017" em 2026-10-30, após a Rodada 2
> **Autorização da atualização v4:** respostas explícitas do responsável em 2026-10-30 ajustando P1 e P2 e confirmando P3; decisões D10 a D12.
> **Modo contínuo:** `—`
> **Autorização de implementação da unidade Banco:** "autorizo a implementação da issue #172" em 2026-10-30; recebida; execução iniciada na branch `feature/issue-172`, task `017_task_issue-172.md`.
> **Autorização de implementação da unidade Formulários:** "Autorizo a implementação da issue #173" em 2026-10-30; recebida depois da ação externa da #172 relatada pelo responsável; execução iniciada na branch `feature/issue-173`, task `017_task_issue-173.md`.
> **Autorização de implementação da unidade Consulta:** "autorizo a implementação da issue #174" em 2026-10-30; recebida depois da integração da PR #177; execução iniciada na branch `feature/issue-174`, task `017_task_issue-174.md`.
> **Emendas:** E-1 (tela) e E-2 (Previdência como veículo) em 2026-10-30, depois das entregas #172 a #174, autorizadas por "Tá, então a partir de agora, pode concatenar todas as informações que nós discutimos agora, para fazer essa revisão geral do que aconteceu na tela." (ver "Emendas E-1 e E-2"); decisões D13 a D18. Não adotadas no 017: a Rodada 5 deu REQUER NOVA RODADA, e o responsável levou o trabalho ao ciclo 018 ("Sim, ciclo 018", ver "Decisão do responsável após a Rodada 5")
> **Revisão formal:** `Concluída` (Rodada 5, sobre as emendas da v5; teto de cinco rodadas atingido)
> **Veredito da revisão:** `APTO PARA APROVAÇÃO` (Rodada 4, v4: vale só para a execução aprovada da v4); Rodada 5, v5 (emendas E-1 e E-2): `REQUER NOVA RODADA`
> **Aprovação humana pós-revisão:** `Aprovada em 2026-10-30`
> **Aprovação da v4:** "aprovo o plano do ciclo 017" em 2026-10-30, recebida após o veredito APTO PARA APROVAÇÃO da Rodada 4; confirma a versão revisada, inclusive D10 a D12 e a inclusão de INPC.
> **Manifestação anterior de aprovação:** a frase dita após o parecer da v3 permanece somente como histórico; a aprovação vigente é a manifestação posterior ao parecer da v4 registrada acima.
> **handoff_schema_version:** `2`

## Problema e contexto

Ideação: _project/ideations/017_atributos_complementares_ativos.md.

## Objetivo

Registrar e consultar veículo de acesso, indexador da remuneração, regime tributário, prazo informado para resgate ou venda e cobertura do FGC como atributos manuais e descritivos dos ativos. Oferecer seleção múltipla de veículos e indexadores, prazo exato com unidade explícita e orientação de preenchimento manual quando as etapas tiverem unidades diferentes, Mais detalhes opcional, resumo expansível e filtros na página Ativos, com isolamento por usuário e cadastro básico compacto no celular.

## Origem no backlog

Snapshot herdado integralmente da ideação, sem nova seleção:

| ID | Síntese da necessidade | Parcela selecionada |
| :-- | :-- | :-- |
| BL-015 — Atributos complementares de classificação do ativo além da classe | Registrar e consultar veículo de acesso, indexador da remuneração, regime tributário, liquidez estimada e cobertura do FGC, separados da classe e sem tornar o cadastro no celular mais longo | Integral: os cinco atributos e a decisão sobre sua relação com os quatro indicadores existentes. Sem agrupamento com outros IDs; nenhuma parcela deixada para outro destino nesta seleção |

Referência de origem: `_project/backlog.md` da fila canônica `chore/backlog`, commit `e3d32d981c6f311d0d9dba192af552f29368347b`, no worktree externo registrado `C:/Programas/saldo-futuro-backlog`, com o mesmo Git comum do checkout principal. Na leitura de origem, fila limpa; conteúdo do backlog idêntico ao de `main` em `337d8b83c809e9070391d7767df6eb8ed8b81271`, conferida no GitHub. O item estava `Disponível`, sem encaminhamentos; seu conteúdo já publicado, sem parcela local pendente.

Destino em preparação: ciclo `017`. A seleção não altera o item. O retorno `ciclo 017` só é registrado na fila após comprovação da integração do destino em `main`, sob a autorização da seleção original; publicação do retorno exige autorização separada. Antes de integrar o destino, conferir a presença dos IDs de origem em main. O snapshot não deve ser reescrito por mudanças posteriores do backlog.

## Contexto e baseline

- Checkout principal: `main`, HEAD `337d8b83c809e9070391d7767df6eb8ed8b81271`, igual à main remota consultada por `gh`; nenhuma PR aberta no momento da consulta. Os únicos arquivos locais preexistentes eram a reserva em `_project/cycles.md` e a ideação não versionada do ciclo `017`; foram preservados.
- Revisão local da ideação de origem: blob Git `dd6e8650458f46cbd3a24633c98b6367453b351a`, calculado por `git hash-object`, antes deste plano. Autorização do rascunho e respostas posteriores são registradas neste documento; o snapshot histórico da ideação permanece intacto.
- `package.json`: aplicação `0.12.1`, Node.js >=24, Next.js, React, Supabase, Zod, Vitest e Playwright. Não se propõe dependência nova.
- `public.ativos` já tem instituição, nó da taxonomia e quatro indicadores opcionais: previdência, liquidez imediata, exposição cambial e isenção de IR. O trânsito não recebe detalhes; desativados aceitam edição descritiva.
- Cadastro chama `cadastrar_ativo_taxonomia`; edição chama `editar_ativo_com_nome`. As funções usam a trava por usuário e validam proprietário e referências. Instituição nova e ativo são gravados na mesma transação.
- `src/lib/telas/leituras.ts` centraliza a seleção de colunas e leitura completa. A página Ativos lê ativos e catálogos uma vez, em `Promise.all`, sem composição por marca. Resumo, filtro, aba e contadores serão derivados das mesmas linhas de ativos carregadas. Uma edição concorrente pode aparecer antes ou depois, sem exigir snapshot global para esta consulta descritiva. Não há cálculo ou regra entre ativos que justifique acrescentar marca nesta tela. A KB-003 mantém esse limite desde o ciclo `015`.
- `profiles.versao_metadados`, seu gatilho e os leitores do Início conservam o contrato atual de nome, instituição e classe. A correção da v2 retira sua ampliação e a composição nova propostas na v1 (R1-1); desativação e demais comportamentos existentes não passam a depender dessa marca.
- DESIGN.md 6.7 e 6.8 definem lista densa no celular, alvos de 44 px e Mais detalhes recolhível, aberto quando preenchido. A página Ativos contém as abas Em uso e Desativados e não tem os filtros ou o resumo propostos.
- Não foram lidos dados reais, nem banco ou telas de produção. A redação do plano não executa migração nem altera a aplicação.

## Escopo

### Dentro do escopo

- Cinco atributos independentes da taxonomia, preenchidos manualmente, inclusive em ativos desativados.
- Seleção múltipla em veículo e indexador, conforme resposta expressa do responsável durante o rascunho.
- Prazo exato informado para resgate ou venda e unidade de dias úteis ou corridos; orientação manual para total em dias corridos, arredondado para cima, quando cotização e liquidação estiverem em unidades diferentes. Estados explícitos para casos sem prazo numérico; nenhuma conversão ou cálculo de calendário pelo sistema.
- Regime tributário com detalhe suficiente para distinguir progressivo e regressivo, conforme resposta expressa, sem apuração fiscal.
- Filtros de prazo com Exatamente e Até, comparando o número informado na mesma unidade, sem transformar o prazo em data de disponibilidade.
- Preservação dos quatro indicadores existentes e de seus três estados, com agrupamento visual junto aos novos atributos, confirmada em D12.
- Formulários de cadastro e edição; resumo Ver detalhes nas duas abas; filtros recolhíveis na página Ativos, com URLs compartilháveis dentro da sessão autenticada.
- Migração nova, RPCs compatíveis com a aplicação anterior, leitura descritiva completa pelo fluxo existente, testes e ação humana externa de aplicação no banco de produção.
- Documentação viva, notas de novidades da versão que vier a conter a entrega, verificação em produção e encerramento prospectivo.

### Fora do escopo

- Cálculo ou enquadramento automático de imposto, elegibilidade ao FGC, valor garantido, rentabilidade, datas de resgate, vencimento ou carência.
- Preenchimento automático por nome, classe, instituição, fonte externa ou carteira real; cadastro de taxas e spreads; importação ou histórico temporal dos novos atributos.
- Alteração da árvore da taxonomia, descontinuação de nós, alocação-alvo ou novas análises patrimoniais pelos atributos.
- Remoção de tabelas legadas da taxonomia, RPCs antigas ou indicadores sem decisão específica; ampliação de permissões administrativas.
- Novas rotas de consulta, edição em lote e criação de opções personalizadas pelo usuário.
- Ampliar a marca/gatilho de metadados ou criar composição por versão para Ativos; modificar o contrato de leitura do Início.

## Decisões e autoridades

Autoridades: `.agent/ai_behavior.md`, `_project/README.md`, ADR-003, KB-003, KB-004 e DESIGN.md. O template usado é `.agent/templates/plano_implementacao.md`. A redação/correção seguiu `.agent/workflows/rascunhar_plano.md`; a aprovação e publicação documental seguem a transição canônica de `_project/README.md`, após veredito apto e manifestação humana posterior. As quatro rodadas permanecem preservadas em Revisão crítica. A aprovação vigente da v4 foi recebida após a Rodada 4, sem alteração da especificação revisada.

### Decisões humanas confirmadas

| ID | Decisão | Origem |
| :-- | :-- | :-- |
| D1 | Atributos opcionais, manuais e descritivos; sem cálculo automático de imposto, liquidez ou garantia | Q1 da ideação |
| D2 | Rever sobreposições e consolidar quando fizer sentido, preservando informação e comparando significados | Q2 da ideação; não autoriza uma conversão específica |
| D3 | Resumo expansível por ativo na página Ativos; Filtrar abaixo das abas e antes da lista; Mais detalhes no cadastro e edição | Q3 da ideação e esclarecimentos incorporados por pedido explícito |
| D4 | Registrar prazo exato informado para o resgate, em vez de faixas estimadas | Resposta durante a redação do rascunho, em 2026-10-30 |
| D5 | Distinguir também regimes como progressivo e regressivo | Resposta durante a redação do rascunho, em 2026-10-30 |
| D6 | Permitir selecionar várias opções de veículo e indexador por ativo | Resposta durante a redação do rascunho, em 2026-10-30 |
| D7 | Adotar o catálogo mais amplo de regime: Renda fixa — por prazo; Fundos — longo prazo; Fundos — curto prazo; Previdência — progressivo; Previdência — regressivo; Renda variável; Outro; Não se aplica; Não informado | Escolha explícita durante a correção v2, em 2026-10-30; somente rótulos manuais, sem alíquotas ou enquadramento automático |
| D8 | OU entre opções do mesmo atributo e E entre atributos; trânsito excluído de qualquer filtro de atributos, inclusive Não informado; oferecer Exatamente e Até para o prazo | Escolha explícita após exemplos fictícios e alternativas apresentados na correção v2, em 2026-10-30 |
| D9 | Adotar o texto literal: "Informações preenchidas por você. O Saldo Futuro não calcula imposto, prazo de resgate ou valor garantido com estes campos." | Escolha explícita durante a correção v2, em 2026-10-30 |
| D10 | Confirmar o restante dos catálogos da P1, renomear Sem indexador para Prefixado (sem indexador) e Certificado representativo para BDR ou certificado de depósito; incluir Variação cambial nos indexadores e permitir incluir INPC a critério do autor | Resposta explícita à confirmação de P1, em 2026-10-30. INPC foi incluído no catálogo manual dentro da opção delegada, sem criar benchmark ou sincronização |
| D11 | Aplicar a definição do prazo a resgate ou venda; quando cotização/liquidação tiverem unidades diferentes, orientar no texto de ajuda registrar o total em dias corridos, arredondando para cima; manter o restante da definição | Resposta explícita à confirmação de P2, em 2026-10-30. A orientação é para preenchimento manual; o sistema continua sem converter, somar ou calcular datas |
| D12 | Confirmar a preservação e o agrupamento visual dos quatro indicadores atuais, com Sim, Não e Não informado, sem conversão ou apagamento de dados | Resposta explícita à confirmação de P3, em 2026-10-30. Vale para o 017; a mudança de agrupamento (D13) e do indicador Previdência (D18) foi levada ao ciclo 018 |

### Proposta de especificação para revisão

P1 a P6 detalham a especificação aprovada, sob as decisões D1 a D12. As confirmações de produto estão registradas: P1 ajustada em D10, P2 em D11 e P3 confirmada em D12. INPC foi incluído na opção expressamente delegada ao autor e confirmado pela aprovação integral da v4. A Rodada 4 conferiu a versão modificada e emitiu APTO PARA APROVAÇÃO; a manifestação humana posterior aprovou esta versão. Nenhuma definição fica para escolha do implementador. Criação das issues depende da integração documental e da confirmação dos payloads; implementação exige autorização por unidade.

**P1 — Opções e estados.** Catálogos fixos mantidos no código e nas constraints de uma migração revisada; nenhuma tabela ou dependência nova só para enumerar opções. Códigos estáveis; rótulos em português; valores fora do catálogo são recusados no servidor e no banco.

| Atributo | Representação para revisão | Opções especificadas, com ajustes humanos D7 e D10 |
| :-- | :-- | :-- |
| Veículos de acesso | Conjunto `text[]`, vazio = Não informado | `direto` (Direto); `fundo` (Fundo); `etf` (ETF); `plano_contrato` (Plano ou contrato); `certificado_representativo` (BDR ou certificado de depósito); `outro` (Outro); `nao_aplicavel` (Não se aplica) |
| Indexadores | Conjunto `text[]`, vazio = Não informado | `cdi` (CDI); `selic` (Selic); `ipca` (IPCA); `igpm` (IGP-M); `tr` (TR); `variacao_cambial` (Variação cambial); `inpc` (INPC); `sem_indexador` (Prefixado (sem indexador)); `outro` (Outro); `nao_aplicavel` (Não se aplica) |
| Regime tributário informado | `text` opcional | Catálogo amplo escolhido em D7: `renda_fixa_por_prazo` (Renda fixa — por prazo); `fundos_longo_prazo` (Fundos — longo prazo); `fundos_curto_prazo` (Fundos — curto prazo); `previdencia_progressivo` (Previdência — progressivo); `previdencia_regressivo` (Previdência — regressivo); `renda_variavel` (Renda variável); `outro` (Outro); `nao_aplicavel` (Não se aplica); nulo = Não informado |
| Prazo informado para resgate ou venda | Situação + inteiro de dias + unidade | `prazo` (Prazo em dias) exige dias >=0 e `uteis` (Dias úteis) ou `corridos` (Dias corridos); sem número: `no_vencimento` (No vencimento); `sem_prazo_estimavel` (Sem prazo estimável); `nao_aplicavel` (Não se aplica); nulo = Não informado |
| Cobertura do FGC informada | `text` opcional | `sim` (Sim); `nao` (Não); `nao_aplicavel` (Não se aplica); nulo = Não informado |

Os conjuntos não são uma taxonomia jurídica: ETF é uma opção operacional de consulta e não implica que deixe de ser fundo. O sistema não verifica se a combinação informada descreve um produto real. Não incluir regras que preencham, bloqueiem ou alterem atributos pela classe. Não oferecer campo livre ao escolher Outro nesta entrega.

Conjuntos aceitam múltiplas opções sem duplicatas: normalizar a ordem e eliminar repetições válidas na RPC; recusar valores nulos internos, estruturas multidimensionais e códigos inválidos. `nao_aplicavel` é exclusivo; `sem_indexador`, exibido como Prefixado (sem indexador), também é exclusivo no conjunto de indexadores. Vazio, Não se aplica e Prefixado (sem indexador) são estados distintos. Os códigos internos `sem_indexador` e `certificado_representativo` são mantidos; D10 altera seus rótulos. A constraint deve impedir a persistência de conjuntos fora dessa forma canônica. Não pode haver truncamento silencioso de opções.

Significados e exemplos fictícios da P1, atualizados por D10:

| Opção | Significado descritivo e exemplo |
| :-- | :-- |
| Veículo Direto / Fundo / ETF / Plano ou contrato / BDR ou certificado de depósito | Forma de acesso declarada pelo usuário. Ativo fictício A pode registrar Fundo e ETF; B, Plano ou contrato; E, BDR ou certificado de depósito. A última opção descreve o veículo representativo de valores mobiliários conforme informação do usuário; não se preenche a partir da classe nem se infere automaticamente um produto pelo nome |
| Indexador CDI / Selic / IPCA / IGP-M / TR / INPC / Variação cambial | Referência que o usuário declara para a remuneração. Ativo fictício C pode registrar IPCA e CDI; E, Variação cambial; F, INPC. Não se informa percentual, spread, moeda específica ou benchmark de comparação. Variação cambial não altera o indicador Exposição cambial nem gera evento cambio |
| Prefixado (sem indexador) | O usuário declara remuneração prefixada sem indexador; por exemplo, a remuneração do ativo fictício G é previamente fixada. Usa o código `sem_indexador`, exclusivo como já previsto. O rótulo não deve ser generalizado a toda ausência de referência: casos conhecidos fora dessa descrição podem usar Outro |
| Não se aplica, no indexador | O usuário considera que o conceito de indexação da remuneração não se aplica àquele cadastro; por exemplo, um item fictício sem remuneração contratada. Não é remuneração prefixada nem informação ausente |
| Renda fixa — por prazo | Anotação escolhida pelo usuário quando o informe do título fictício descreve tributação dependente do prazo da aplicação; não é tabela de previdência |
| Fundos — longo prazo / Fundos — curto prazo | Anotação da categoria tributária do fundo fictício conforme a informação que o usuário possui. Não é duração da carteira nem prazo de resgate; o sistema não classifica o fundo |
| Previdência — progressivo / Previdência — regressivo | Anotação do regime previdenciário informado para o plano fictício. São códigos distintos de Renda fixa — por prazo; não se usa o código ambíguo regressivo sem contexto |
| Renda variável | Agrupamento descritivo amplo para anotação e consulta, por exemplo do ativo fictício D. Não distingue operações, rendimentos, day trade ou regras de isenção e não calcula imposto |
| Outro / Não se aplica / Não informado | Informação conhecida fora do catálogo / conceito considerado inaplicável / ausência de informação. Nenhum dos três é convertido em isenção ou não isenção |
| FGC Sim / Não / Não se aplica | Anotação da informação que o usuário possui para o ativo fictício, sem o sistema verificar elegibilidade ou calcular valor protegido. Não informado permanece ausência |
| Prazo em dias / No vencimento / Sem prazo estimável | Número e unidade explicitamente informados / disponibilidade anotada como vinculada ao vencimento, sem data calculada / usuário declara não conseguir estimar um prazo. Diferem de Não se aplica e de Não informado |

Alternativa menor de regime apresentada e não escolhida: somente Previdência — progressivo, Previdência — regressivo, Outro, Não se aplica e Não informado. Nela, renda fixa e fundos sem opção específica ficariam em Outro. O responsável escolheu o catálogo amplo em D7, com os significados contextualizados acima; não há mais alternativa de catálogo de regime pendente. Nenhuma tabela de alíquotas ou classificação automática integra a escolha.

**P2 — Prazo exato informado para resgate ou venda.** Definição ajustada pelo responsável em D11: o número descreve o prazo total informado entre solicitar o resgate ou a venda e ter o dinheiro disponível, após satisfeitas eventuais condições de carência. A unidade é obrigatória para um número informado, sem seleção implícita; zero é valor válido e diferente de ausência. O sistema não converte cotização isolada em prazo total, não soma prazos, calcula datas ou infere disponibilidade pela classe. Se o usuário só conhece uma etapa e não consegue determinar o total, mantém Não informado. Vencimento não exige uma data. A situação sem número mantém dias e unidade nulos. Inteiro >=0 limitado ao domínio de `integer` do PostgreSQL; recusar negativos, fracionários, excesso de faixa e combinação parcial.

Texto de ajuda do prazo, conforme D11: "Informe o prazo total até o dinheiro estar disponível após solicitar o resgate ou a venda, depois de cumpridas eventuais carências. Se cotização e liquidação estiverem em unidades diferentes, registre o total em dias corridos, arredondando para cima. O Saldo Futuro não converte nem soma essas etapas. Se não souber o total, deixe Não informado."

Essa é uma orientação de preenchimento manual. Contagens em dias úteis e corridos não são somadas diretamente: o total em dias corridos precisa ser informado pela instituição ou determinado manualmente a partir das datas, horários e calendário aplicáveis. O app não recebe etapas separadas, não consulta calendário e não produz o total ou o arredondamento. Exemplo fictício apenas de registro: um total já conhecido de 2,2 dias corridos é arredondado pelo usuário para 3, que é o inteiro enviado. Sem informações suficientes para conhecer esse total, não inventar conversão; usar Não informado. O campo numérico continua recusando 2,2 em vez de arredondar silenciosamente. Os filtros continuam comparando exclusivamente os inteiros/unidades registrados, conforme D8.

**P3 — Indicadores e legado.** Preservação e agrupamento confirmados expressamente pelo responsável em D12:

| Indicador existente | Relação com os novos atributos | Convivência confirmada |
| :-- | :-- | :-- |
| Previdência | O tipo genérico Plano ou contrato não determina se é previdenciário; a seleção pode combinar veículos | Preservar os três estados; agrupar visualmente próximo de veículo. Proposta de Previdência como opção do veículo (D18) levada ao ciclo 018, sem efeito no 017 |
| Liquidez imediata (reserva) | O rótulo atual inclui indicação de reserva; um número de dias não prova essa intenção | Preservar os três estados; agrupar junto ao prazo, com textos que distingam as informações |
| Exposição cambial | Não equivale a veículo, indexador ou regime tributário | Preservar os três estados |
| Isento de IR | Isenção e identificação do regime não são representadas pelo mesmo conjunto de opções | Preservar os três estados; agrupar visualmente com regime |

Nenhuma equivalência de conversão será aplicada. D12 confirma a consolidação visual com os quatro valores e respectivos estados preservados. A escolha de manter e agrupar está encerrada; não deixar remoção, derivação ou mapeamento para o implementador. Variação cambial como indexador também não substitui nem preenche Exposição cambial.

**P4 — Persistência, escrita e compatibilidade.** Acrescentar a `public.ativos` sete colunas: `veiculos_acesso text[] not null default '{}'`, `indexadores_remuneracao text[] not null default '{}'`, `regime_tributario text`, `prazo_resgate_tipo text`, `prazo_resgate_dias integer`, `prazo_resgate_unidade text`, `cobertura_fgc text`. Colunas opcionais começam nulas. O prefixo interno prazo_resgate é mantido e representa o prazo de resgate ou venda definido na P2; a interface usa o rótulo completo e o distingue de `liquidez_imediata`. Constraints validam as opções, conjuntos e a tupla de prazo, incluindo os códigos novos `variacao_cambial` e `inpc`. Um auxiliar privado imutável pode validar/canonizar conjuntos; sem EXECUTE pela Data API. Ampliar a restrição do trânsito: conjuntos vazios e os demais campos nulos.

Criar RPCs com nomes novos, sem sobrecarga: `cadastrar_ativo_com_atributos` e `editar_ativo_com_atributos`. Recebem os parâmetros atuais e os sete campos novos; o cadastro devolve UUID, edição devolve void. Ambos usam a sessão, a trava por usuário e uma única transação; a edição identifica dono e recusa trânsito antes de criar instituição. Pode-se reutilizar internamente a função atual correspondente e gravar os novos campos na mesma transação; uma recusa em qualquer etapa desfaz nome, instituição e todos os atributos. Todos os campos da nova assinatura são explícitos: limpar envia conjunto vazio/nulo, não omissão ambígua.

Manter assinaturas e grants atuais; as funções antigas continuam alterando só os campos que conhecem e preservam os novos. Novo cadastro por função antiga recebe novos campos vazios/nulos. Nenhuma coluna antiga é renomeada ou removida. Grants das novas RPCs só a authenticated, search_path vazio, execute revogado de public e anon; nenhum parâmetro de proprietário nem bypass do admin. Atualizar a lista fechada de funções permitidas nos testes.

Não alterar a função/gatilho de versão de metadados, a RPC `ler_versao_metadados` nem o comentário/contrato de `versaoMetadados` em `src/lib/leitura.ts`. Os leitores do Início não consomem os novos campos e não devem repetir por edições desses atributos. Escritas que também alterem nome, instituição ou classe continuam sujeitas ao gatilho existente, sem nova contagem ou composição neste ciclo.

**P5 — Leitura e filtros.** Manter a leitura descritiva atual da página Ativos: `Promise.all` de `lerAtivos`, instituições, taxonomia e legado, com paginação completa e RLS pelos helpers existentes. Não criar composição por marca, chamadas adicionais a `ler_versao_metadados` ou novas tentativas globais. Cada linha pode refletir o estado anterior ou posterior a uma edição concorrente; não se promete um snapshot global. Rótulos de instituição podem refletir uma renomeação anterior ou posterior, conforme a leitura atual.

Resumo, filtros, situação e contadores são derivados das mesmas linhas carregadas de `ativos`, sem releitura por item. Filtrar no servidor depois da leitura completa; não acrescentar biblioteca de cache nem paginação de interface. As colunas novas são obrigatórias: ausência de migração, erro de consulta ou contagem inconsistente na paginação é erro visível, sem apresentar conjunto parcial nem substituir atributos por ausência. Não ampliar o escopo para sincronizar catálogos globais ou desativação por uma marca nova.

- Formulário GET em `/ativos`, abaixo das abas. Parâmetros: `veiculo`, `indexador`, `regime`, `prazo_resgate_tipo`, `prazo_resgate_dias`, `prazo_resgate_unidade`, `prazo_resgate_comparacao`, `fgc` e os quatro indicadores com códigos `sim`, `nao`, `nao_informado`. O comparador escolhido em D8 usa `exato` (Exatamente) e `ate` (Até).
- `veiculo` e `indexador` admitem parâmetros repetidos; valores selecionados no mesmo atributo combinam por **OU** (interseção não vazia com o conjunto do ativo). Atributos diferentes combinam por **E**. Filtro vazio é Todos. `nao_informado` seleciona conjunto vazio/nulo e é exclusivo com opções informadas; estados exclusivos da P1 mantêm a exclusividade nos filtros.
- Regime e FGC têm uma escolha por filtro. Para prazo: situação e, se `prazo`, número, unidade e comparador obrigatórios. Exatamente compara igualdade; Até compara `<=` inclusivo, sempre na mesma unidade. Não converter dias úteis/corridos nem calcular datas ou prazo real. Intervalo com limite inferior/superior simultâneos e inferência de disponibilidade ficam fora desta entrega; a comparação Até escolhida em D8 está dentro.
- Os filtros escalares `regime`, `fgc` e `prazo_resgate_tipo` oferecem também `nao_informado` (Não informado). Esse valor existe somente na URL/formulário de filtro: seleciona, respectivamente, `regime_tributario is null`, `cobertura_fgc is null` ou `prazo_resgate_tipo is null`; não é código adicional persistido no ativo. Ausência do filtro ou valor vazio significa Todos, nunca Não informado. Não informado não equivale a Não nem a Não se aplica.
- Com `prazo_resgate_tipo=nao_informado`, não enviar comparador, dias ou unidade; se algum deles vier preenchido, mostrar erro explícito de filtro, sem ignorar a combinação. A exclusão do trânsito em D8 continua valendo para esses três filtros de Não informado.
- Código desconhecido, parâmetro escalar repetido, conjunto inválido ou tupla parcial exibem erro de filtro e não exibem uma lista interpretada silenciosamente como Todos. Oferecer limpar para recuperar.
- Abas preservam filtros aplicados; contadores continuam o total por situação antes dos filtros. Informar separadamente quantidade de resultados na aba corrente. Sem resultados não equivale a não haver ativos: manter filtros e ação para limpar.
- Limpar remove todos os filtros e preserva só a aba. Recarregar e voltar/avançar restauram o estado pela URL. O formulário reflete filtros aplicados e começa aberto quando houver filtro ou erro.
- Em trânsito permanece sem atributos e sem Ver detalhes. Decisão de produto D8: filtros por atributos excluem o trânsito, inclusive Não informado, para não tratá-lo como cadastro incompleto; sem filtro, conserva o comportamento existente. A decisão foi do responsável após o exemplo, não do revisor.
- Edição e cadastro mantêm o retorno atual às abas; preservar filtros após uma edição não integra este recorte. Não alterar o fluxo de redirecionamento de outras telas.

Exemplos fictícios de P5 apresentados para confirmação, sem cálculo financeiro:

| Cadastro fictício | Veículos | Indexadores | Prazo informado |
| :-- | :-- | :-- | :-- |
| Ativo A | Fundo | CDI | 0 dias úteis |
| Ativo B | ETF | IPCA | 1 dia útil |
| Ativo C | Fundo, ETF | CDI | 3 dias corridos |
| Em trânsito | Não recebe atributos | Não recebe atributos | Não recebe atributos |

Marcar Fundo e ETF encontra A, B e C (OU). Acrescentar CDI encontra A e C (E entre atributos). Buscar exatamente 1 dia útil encontra B; Até 1 dia útil encontra A e B. C não participa de comparação com dias úteis: não há conversão entre unidades. Em trânsito só aparece quando não houver filtro de atributos, conforme D8; o filtro Não informado não o classifica como ativo incompleto.

O responsável escolheu Exatamente e Até (D8), sem cálculo de data ou mudança do prazo exato armazenado. `prazo_resgate_comparacao` é obrigatório quando a situação filtrada for Prazo em dias; a ausência/valor desconhecido é erro explícito, não muda a busca para Todos ou Exatamente silenciosamente. Situações sem número não enviam comparador, dias ou unidade. A alternativa menor, de apenas igualdade exata, foi apresentada e não escolhida. Exatamente e Até são escolhas de filtro, não novos atributos armazenados no ativo.

Exemplos do estado Não informado, explicitados na v3: `?regime=nao_informado` encontra apenas ativos comuns com regime nulo; `?fgc=nao_informado` encontra FGC nulo, sem incluir quem declarou Não ou Não se aplica; `?prazo_resgate_tipo=nao_informado` encontra situação de prazo nula sem exigir qualquer dado numérico. Os três são diferentes de não aplicar filtro e excluem Em trânsito.

**P6 — Interface e apresentação.** Nos formulários, usar selects nativos nos campos escalares e checkboxes em fieldset nos multivalorados, com labels, instruções de exclusividade, alvos de 44 px e navegação por teclado. Validar exclusividade no cliente para orientar e no servidor/banco para garantir. Sem novo componente complexo de multiselect. Mais detalhes fecha se vazio, abre com valores preenchidos e permanece aberto após erro interno. Preservar os valores digitados/selecionados depois de recusa.

Na aba Em uso, no celular, cada item da lista densa recebe `<details>` Ver detalhes abaixo das informações principais, com pares rótulo/valor em coluna; nenhum campo novo aumenta a linha principal. No desktop dessa aba, o resumo fica dentro da célula Nome como expansão vertical, sem novas colunas nem aninhamento inválido de linhas de tabela. Desativados é lista em todas as larguras: no celular e no desktop, Ver detalhes fica abaixo do nome/metadados/data dentro da área de conteúdo do item, separado da ação Editar. Não converter Desativados em tabela. Usar os mesmos dados e ordem em todos os formatos. Mostrar os cinco atributos e os indicadores com Não informado explícito quando ausentes; não esconder ausência como resposta negativa. Conjuntos são listados em ordem de catálogo, não em ordem da seleção.

O resumo começa fechado, tem nome acessível que identifica o ativo, e pode abrir mais de um item sem mover o foco. O formulário Filtrar usa `<details>`; os filtros ativos e Limpar ficam visíveis mesmo recolhido. No mobile, campos em coluna e listas de opções com quebra de texto; nenhum painel horizontal. Os filtros escalares não dependem de JavaScript para envio; detalhes nativos funcionam antes da hidratação. Exclusividades continuam validadas no servidor.

Texto confirmado em D9 no preenchimento/resumo: "Informações preenchidas por você. O Saldo Futuro não calcula imposto, prazo de resgate ou valor garantido com estes campos." Não publicar tabela de elegibilidade, alíquotas ou limites do FGC. A marcação de cobertura é uma anotação, não cálculo ou validação de proteção efetiva.

### Registro de escolhas de produto da correção

Em 2026-10-30 foram apresentados ao responsável o catálogo amplo e a alternativa restrita de regime (P1), os exemplos de OU/E e trânsito com as alternativas Exatamente/Até (P5), e o texto literal da P6. O responsável respondeu expressamente: adotar catálogo amplo; adotar OU/E e exclusão do trânsito com ambos os comparadores; adotar o texto. Respostas registradas em D7 a D9 e incorporadas em P1/P5/P6. Nenhuma aceitação foi inferida de opção preselecionada. A escolha do regime não altera a cardinalidade múltipla já confirmada para veículos/indexadores nem transforma os rótulos em regras fiscais.

Após a Rodada 3, em 2026-10-30, o responsável disse "aprovo o plano do ciclo 017" e foram apresentadas as três confirmações de produto antes pendentes. As respostas agora recebidas ajustam P1 e P2 (D10/D11) e confirmam P3 (D12). P1/P2/P3 não são mais perguntas sem resposta: as instruções estão incorporadas na v4. INPC foi incluído dentro da opção delegada ao autor, sem benchmark ou sincronização.

A manifestação de aprovação da v3 e a parada anterior permanecem como histórico abaixo. As alterações foram examinadas pela Rodada 4, com veredito APTO PARA APROVAÇÃO, e o responsável depois disse novamente "aprovo o plano do ciclo 017", em 2026-10-30. Essa manifestação nova aprova a v4 integralmente, inclusive INPC e D10 a D12; não se reaproveitou a frase anterior. A aprovação cobre a publicação documental prevista no README, sem cobrir merge ou implementação. O corpo da PR em `local/cycle-017-plan-pr.md` é preparação ignorada, atualizada para esta versão antes da publicação.

### Emendas E-1 e E-2 — revisão da tela depois das entregas (2026-10-30)

**Origem.** Depois da integração das PRs #177 (formulários) e #178 (consulta), esta pelo próprio responsável em 2026-10-30 sem a frase de aprovação no chat, o responsável usou as telas e apontou quatro problemas: o filtro com opções demais (caixas abertas para veículo e indexador), o filtro sem divisão por assunto, a página que volta ao topo com o painel aberto depois de aplicar, e a Previdência ao lado do veículo no cadastro, que confunde. A análise do agente, um esboço visual do filtro e as respostas do responsável na conversa levaram às decisões D13 a D18. O responsável autorizou registrá-las e revisá-las: "Tá, então a partir de agora, pode concatenar todas as informações que nós discutimos agora, para fazer essa revisão geral do que aconteceu na tela." Ele também registrou que passará a testar localmente antes de aprovar um merge de tela.

**Estado de partida.** As três entregas (#172 a #174) estão em `main` (`8cba4ac2dadc825057af777456530a9cbc66da6c`) e, pelo deploy contínuo, em produção; a ação externa da #172 foi relatada. A release 0.13.0 (PR #176) não foi integrada, então a nota de `/novidades` ainda não aparece. As emendas corrigem o que já foi entregue por **novas** PRs; nada é revertido.

#### Decisões humanas das emendas

| ID | Decisão | Origem |
| :-- | :-- | :-- |
| D13 | Quatro grupos com título, na mesma ordem, no cadastro, na edição, no "Ver detalhes" e no "Filtrar": **Produto** (Veículo de acesso, Indexador da remuneração), **Tributação** (Regime tributário, Isento de IR), **Resgate** (Prazo para resgate ou venda, Liquidez imediata (reserva)) e **Proteção e exposição** (Cobertura do FGC, Exposição cambial). Substitui o agrupamento da P3/D12 | Proposta do agente com esboço; o responsável confirmou a divisão e pediu que o cadastro siga a mesma |
| D14 | Veículo de acesso e Indexador da remuneração viram **lista suspensa de múltipla escolha** no cadastro, na edição e no filtro. Fechada, mostra o que está marcado ("Fundo, ETF") ou "Todos" no filtro e "Não informado" no cadastro; aberta, mostra as opções com caixas. No cadastro, o catálogo inteiro; no filtro, só as opções presentes em algum ativo comum do usuário (das duas abas), mais "Não informado" e as que estiverem marcadas na URL. Substitui a P6 ("checkboxes em fieldset" e "sem novo componente de multiselect") | "Eu gostei da sua proposta que você colocou aqui acima, exemplificativa" |
| D15 | "Filtrar": depois de aplicar, o painel fecha e a página mostra a lista; o painel só abre sozinho quando há erro de filtro. Sai a linha abaixo do painel com os filtros aplicados e "N de M nesta aba". O resumo de "Filtrar" ganha um contador de filtros ativos, e "Limpar filtros" fica ao lado dele, visível com o painel fechado. Comparação, Dias e Unidade só aparecem com a situação "Prazo em dias" (sem JavaScript, continuam visíveis, e a combinação incoerente segue com erro). Altera a P5 | "o item 1 de tanto nesta aba, isso você pode tirar"; "Vou seguir sua sugestão: remover a linha inteira e levar o essencial para junto do botão Filtrar" |
| D16 | No cadastro, "Prefixado (sem indexador)" e "Não se aplica" continuam exclusivos (P1 mantida, opção A), com a dica literal: "Em títulos híbridos, como IPCA + taxa, marque só o indexador. Use Prefixado quando a remuneração não tiver indexador." No filtro, só "Não informado" é exclusivo; "Prefixado" e "Não se aplica" combinam por OU com as demais. Altera a P5 nesse ponto | "Pode usar a regra A"; resposta 4: "Ok. Perfeito." |
| D17 | A frase de D9 sai do "Ver detalhes" (nas duas abas) e fica só no "Mais detalhes" do cadastro e da edição. Altera a P6 nesse ponto | "retira essa frase, não serve para nada" |
| D18 | **Previdência é veículo.** "Veículo de acesso" ganha a opção única **"Previdência (PGBL ou VGBL)"**, código `previdencia`, entre ETF e "Plano ou contrato", que continua para outros contratos. O indicador "Previdência" (Sim/Não/Não informado) sai do cadastro, da edição, do "Ver detalhes" e do filtro. A conversão dos dados gravados segue a tabela abaixo. A parte tributária continua em "Regime tributário" (Previdência — progressivo/regressivo). Substitui P3/D12 para esse indicador; os outros três continuam com os três estados | Respostas 1 a 3: "Uma só Previdência"; "Está certa a tabela"; "Perfeito" (revisão formal) |

Conversão de D18, por ativo comum (o trânsito não tem atributos):

| Antes | Depois |
| :-- | :-- |
| `previdencia = true` | `veiculos_acesso` recebe `previdencia`; se tinha `plano_contrato` ou `nao_aplicavel`, eles saem; o conjunto volta à forma canônica; `previdencia` fica nula |
| `previdencia = false` | Nada a converter; `previdencia` fica nula (o "Não" deixa de existir) |
| `previdencia` nula | Nada muda |

#### E-1 — tela (D13 a D17)

- **Cadastro e edição:** "Mais detalhes" com os quatro grupos de D13, cada um com título; a frase de D9 no topo; a dica de D16 abaixo do indexador; a lista suspensa de D14 para veículo e indexador, com a desmarcação dos exclusivos como orientação e o servidor e o banco recusando o conjunto inválido; o resto como entregue na #173 (prazo, selects, preservação depois da recusa).
- **Ver detalhes:** oito itens nos quatro grupos de D13, com título de grupo, sem a frase de D9 e sem Previdência como item próprio (ela aparece no veículo).
- **Filtrar:** os quatro grupos de D13; listas suspensas de D14 com as opções em uso; D15 e D16; os demais selects como hoje. A lista suspensa usa `<details>` nativo com caixas dentro de um `fieldset` cujo `legend` é o nome do campo, alvos de 44 px e quebra de linha; fecha ao clicar fora quando há JavaScript, e funciona sem ele. O formulário GET envia para a lista (âncora `#ativos-da-aba`), para a página voltar posicionada nos resultados.
- **Contadores, abas, URL, Não informado, trânsito fora de qualquer filtro e erros explícitos:** sem mudança em relação à P5, salvo D15 e D16. O parâmetro `previdencia` deixa de ser filtro; vindo na URL antiga, é ignorado como qualquer parâmetro desconhecido de nome.
- **Documentação:** DESIGN.md 6.7, 6.8 e 6.12; KB-003; roteiro VA da KB-002 ajustado (sem a linha de status e com Previdência no veículo).

#### E-2 — Previdência como veículo (D18), em duas fases de banco

Duas migrações novas e aditivas, cada uma com ação externa, para não haver janela em que a aplicação em produção grave o indicador antigo depois da conversão (mesmo padrão das fases 1 e 2 do ciclo 013):

1. **Fase A, antes da tela nova.** Redefine `private.canonizar_veiculos_acesso` com `previdencia` no catálogo, entre `etf` e `plano_contrato` (a ordem relativa dos códigos existentes não muda, então todo conjunto gravado continua canônico; a migração confere isso e falha se algum não estiver). Converte os dados pela tabela de D18, de forma idempotente, para todos os usuários. A aplicação em produção continua funcionando: as funções e as assinaturas não mudam, e o indicador antigo ainda pode ser gravado.
2. **Tela nova (E-1 + D18).** Deixa de mostrar e de enviar o indicador (`p_previdencia` vai nulo nas funções novas, cuja assinatura não muda) e passa a oferecer "Previdência (PGBL ou VGBL)" no veículo.
3. **Fase B, depois do deploy da tela nova.** Reaplica a conversão às sobras (algum "Sim" gravado pela tela antiga entre a fase A e o deploy) e acrescenta a restrição `previdencia is null`, congelando a coluna como legado sem uso, como `classe_id` desde o ciclo 013. A remoção física da coluna e dos parâmetros fica para um ciclo futuro.

Testes: pgTAP do catálogo novo (aceita `previdencia`, ordem canônica, exclusividade de `nao_aplicavel` mantida) e da conversão em todas as linhas da tabela de D18, com isolamento (conversão só no próprio ativo, trânsito intocado, cascata do usuário); ensaio de upgrade com retrato integral antes e depois, desconsiderando só `veiculos_acesso` e `previdencia` dos ativos convertidos, que são conferidos um a um contra a tabela; fase B ensaiada com uma sobra gravada pela função antiga entre as fases. KB-002 com os roteiros das duas ações externas; KB-003 e KB-004 4.1 com o indicador aposentado.

#### Decomposição, ordem e pontos de aprovação das emendas

| Unidade | Conteúdo | Dependência e fechamento |
| :-- | :-- | :-- |
| Documental | Este registro (v5), Rodada 5 e reconciliação da task da #174 | Branch `chore/cycle-017-emendas`; PR documental com aprovação própria do merge |
| Issue nova — banco | Fase A de E-2, testes, ensaio e roteiro | Depois da documental integrada e do payload confirmado; ação externa antes da issue de tela; a issue fica aberta até a fase B |
| Issue nova — tela | E-1 completa, D18 na tela e a migração da fase B | Depois da ação externa da fase A; o responsável testa localmente antes de aprovar o merge; a ação externa da fase B vem depois do deploy |
| #174 | Continua aberta | Fecha no encerramento, depois da verificação em produção com o roteiro ajustado |
| Release 0.13.0 (PR #176) | Inclui também as entregas das emendas | Só depois da issue de tela integrada e da fase B; a nota de `/novidades` é revista para mencionar a Previdência no veículo |

Os pontos de aprovação são os mesmos da tabela acima, um por PR, issue e ação externa. Nenhuma decisão de regra financeira está envolvida (G1 não se aplica): a conversão só move uma anotação descritiva. G2 se aplica à conversão em massa e às funções (teste de isolamento); G3, às fixtures; G4, às duas migrações novas.

### Pontos de aprovação

| Ponto | Precondição | Cobre | Não cobre | Conferir |
| :-- | :-- | :-- | :-- | :-- |
| Autorizar rascunho | Ideação registrada; frase recebida em 2026-10-30 | Este rascunho e propostas P1 a P6 para discussão/revisão | Aprovação das propostas, publicação ou código | D1 a D6 e fonte da ideação |
| Aprovar plano: "aprovo o plano do ciclo 017" | Revisão formal apta e confirmação humana registrada de P1 (catálogo), P2 (significado do prazo), P3 (convivência), P5 (combinação, prazo e trânsito nos filtros) e texto da P6; ressalvas resolvidas ou aceitas expressamente | Versão revisada do plano e publicação da PR documental; criação das issues após integração documental e confirmação dos payloads | Merge, implementação e produção | Veredito; registro de escolhas do responsável com exemplos; catálogo, multisseleção, prazo, legado, filtros e texto |
| Aprovar merge documental: "aprovo o merge da PR #N" | PR documental do plano, checks verdes e diff delimitado | Somente o merge dessa PR | Implementação e merge das entregas | Ideação, plano, cycles e origem publicada |
| Autorizar implementação: "autorizo a implementação da issue #N" | Plano aprovado/integrado, issue válida e predecessoras atendidas | Uma unidade da decomposição abaixo, branch e task correspondentes | Outras unidades, merge ou ação externa | Escopo e critérios do payload confirmado |
| Aprovar merge de entrega: "aprovo o merge da PR #N" | Checks verdes, gates locais e revisão do diff | Somente o merge nomeado | Outra PR, migração em produção ou validação humana | Task, barreiras, testes e compatibilidade |
| Ação humana externa: "concluí a ação externa da issue #N" | Banco integrado e ensaio de upgrade registrado na task, com comandos, resultados e evidência verificável | Responsável aplica migração no projeto correto e relata verificações sanitizadas | Deploy de código dependente sem precondições, acesso a dados reais pelo agente | Migração presente, RPCs/permissões e restrições; nenhum segredo em logs |
| Verificar produção: "autorizo a verificação em produção do ciclo 017" | Banco aplicado e entrega da consulta implantada | Roteiro autenticado abaixo, executado pelo responsável com relato sanitizado ou pelo agente dentro da autorização e sem exportar dados reais | Mudança de regra, alteração de carteira sem pedido, exposição de dados | Cadastro/edição, resumo, filtros, mobile e desativados |
| Aprovar merge de release e encerramento: "aprovo o merge da PR #N" | Checks verdes da respectiva PR; entregas e verificações reconciliadas | Um merge por frase; encerramento já coberto pela aprovação do plano | Merges de outras PRs | Versão/notas ou documentação prospectiva, conforme a PR |

Toda cadeia para em ambiguidade de significado/escopo, risco de perda de legado, falha de isolamento, migração não conferida ou falta de capacidade. Não há modo contínuo neste ciclo. A aprovação inicial da ideação e a autorização deste rascunho não substituem aprovação humana posterior ao veredito.

## Barreiras de domínio

| Barreira | Aplica-se? | Como o ciclo a atende ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não no recorte descritivo | Só metadados, interseção e comparação de inteiros na mesma unidade em filtros; nenhuma nova regra monetária, de retorno, fiscal ou de calendário executada pelo sistema. A orientação de dias corridos/arredondamento é decisão humana D11 para preenchimento manual; o app não converte, soma ou arredonda entrada. Até compara o inteiro declarado sem calcular prazo efetivo. Preservar regressões financeiras e retrato de upgrade. Se surgir automatização de cálculo, parar e submeter o novo escopo ao responsável |
| G2 — isolamento por RLS | Sim | Novas colunas herdam RLS de ativos; escrita por RPC autenticada e travada; owner verificado; testes de leitura/escrita cruzada, admin e anon, transação e funções permitidas |
| G3 — privacidade de dados | Sim | Fixtures e evidências fictícias; produção só com relato sanitizado, sem nomes de posições, instituições, valores, e-mails ou prints reais |
| G4 — migrações só acrescentam | Sim | Uma migração nova com nome gerado por `supabase migration new`; nenhuma edição ou remoção de migrações versionadas; compatibilidade sem drop de assinaturas |

## Estratégia de testes

**Nesta redação:** gates de governança, conferência de referências, diff e revisão manual do escopo. Não executar testes da aplicação como se houvesse implementação.

**Nas entregas:** gates mínimos da governança e, quando tocarem aplicação, `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:e2e`. Para banco/autenticação: `npx supabase start` e `npx supabase test db`. E2e autenticado usa somente Supabase local e variáveis locais conforme README; nenhum teste aponta para produção.

| Área | Evidência mínima planejada |
| :-- | :-- |
| Catálogos/conjuntos | Vazio, multisseleção, ordem canônica, duplicatas normalizadas, nulo interno, multidimensional, código inválido e exclusividades, em TS e banco; aceitar Variação cambial/INPC sem alterar Exposição cambial; mesmos rótulos novos no formulário, resumo e filtros |
| Prazo | Resgate e venda usam o mesmo campo e ajuda; zero, úteis/corridos distintos, máximo integer, negativo, decimal, faixa, tupla parcial, limpar e estados sem número; ajuda orienta total manual em corridos arredondado para cima nas etapas com unidades diferentes, sem conversão/soma automática. Exemplo de total conhecido 2,2 é registrado manualmente como 3; enviar decimal continua recusado |
| RLS/RPC | Dois usuários e admin; ninguém lê/edita ativo alheio ou cria instituição por tentativa sobre outro dono; anon recusado; trânsito protegido; desativado editável |
| Atomicidade | Falha dos novos campos reverte também nome, classe, instituição nova e detalhes; nome/atributos salvos juntos |
| Upgrade | Migrar base anterior com fixtures fictícias; novos campos vazios/nulos; valores financeiros e indicadores idênticos antes/depois; app antiga edita sem apagar extras; novas funções testadas com app nova |
| Leitura descritiva | Cobrir mais de uma página, erro de consulta e contagem inconsistente pelos helpers existentes; filtrar/resumir as mesmas linhas sem releitura; colunas novas ausentes geram erro; nenhuma chamada nova à RPC de marca; não exigir snapshot global ou repetição por edição de atributo |
| Filtros | OU dentro de conjunto e E entre campos; Exatamente e Até inclusivo na mesma unidade, incluindo zero e limite; sem conversão entre úteis/corridos; `nao_informado` de regime, FGC e situação do prazo seleciona somente nulos, distinto de Todos/Não/Não se aplica; prazo não informado sem comparador/dias/unidade e erro se vierem preenchidos; aba e contadores; inválido não amplia resultado silenciosamente; trânsito excluído com qualquer filtro, inclusive Não informado; URL e limpar |
| UI e acessibilidade | Cadastro sem abrir detalhes; edição preenchida e recusa sem perda; resumo/filtrar recolhidos e abertos; rótulos/teclado/foco/44 px; sem rolagem horizontal; nome longo e todas as opções; axe no mobile e desktop |

Testar 360 px úteis e desktop 1280 px, além de janela de 375 px com barra clássica quando disponível, registrando largura útil. Manter os casos financeiros já existentes; não criar novos casos de retorno para metadados sem consumo financeiro.

## Itens de implementação

### Item 1 — Persistência e escrita compatível dos atributos

**Contexto:** colunas e funções atuais não guardam os cinco atributos. A consulta permanece descritiva e não demanda ampliação da marca.

**Ação técnica:** implementar P1 a P4 em migração nova, com constraints e auxiliares privados mínimos; criar as duas RPCs sem sobrecarga, manter assinaturas antigas, atualizar testes de funções e incluir pgTAP dedicado. Não alterar gatilho/função/marca de metadados nem contrato dos leitores do Início. Preparar fixtures e roteiro de upgrade com comparação financeira/indicadores antes/depois. Atualizar nesta PR a KB-002 com o roteiro da ação externa e a KB-003 com persistência/escrita dos atributos, sem mudar o contrato da marca.

**Critérios de aceite:**

- [x] Catálogo e significado confirmados no plano revisado; conjuntos e prazo seguem constraints completas, inclusive trânsito e campos vazios.
- [x] Variação cambial e INPC são códigos aceitos como anotações, sem novo benchmark, fonte externa, evento cambio ou preenchimento de Exposição cambial.
- [x] Toda tentativa de leitura/escrita cruzada e bypass do admin falha; escrita é atômica e preserva o protocolo da carteira.
- [x] Funções antigas preservam novos valores e continuam executáveis nas permissões atuais; novas não são ambíguas no PostgREST.
- [x] A migração não amplia a marca de metadados nem altera os leitores do Início; constraints e RPCs garantem os novos campos sem composição de leitura nova.
- [x] Upgrade e suíte de banco passam com dados fictícios; nenhuma diferença em eventos, posições, consolidados ou indicadores prévios.
- [x] Roteiro sanitizado de ação externa pronto; issue fica aberta até essa ação e reconciliação no encerramento.

### Item 2 — Cadastro e edição opcionais com seleção múltipla e prazo exato

**Contexto:** formulários e ações atuais compartilham quatro indicadores e as RPCs antigas.

**Ação técnica:** após banco integrado e aplicado, atualizar descritores e parser de atributos, tipos/colunas de leitura e formulários; adotar novas RPCs nas Server Actions. Implementar P2, P3 e P6 com preservação de entradas após erro. Acrescentar mensagens de recusa sem detalhes sensíveis e atualizar fixtures tipadas/testes afetados pelo tipo Ativo, sem novo teste de marca. Emendar DESIGN.md 6.8 nesta PR com checkboxes, exclusividade, selects e estados; atualizar KB-003 e limite descritivo da KB-004 com o preenchimento efetivamente entregue.

**Critérios de aceite:**

- [x] Cadastro básico continua possível sem abrir Mais detalhes e grava ausência de atributos corretamente.
- [x] Seleções múltiplas, indicadores, regime, FGC e prazo são salvos e reabertos sem perda; clearing é explícito e validado.
- [x] Prazo zero aparece como zero com unidade; vazio, Não se aplica e outros estados não viram número ou booleano por conversão.
- [x] O rótulo e a ajuda abrangem resgate ou venda; a ajuda da P2 orienta total manual em dias corridos e arredondamento para cima quando as etapas usam unidades diferentes. O app não soma/converte/arredonda, e input fracionário segue recusado.
- [x] Nome e atributos são salvos juntos; erro preserva entrada; ativo desativado edita e trânsito não ganha formulário.
- [x] Textos e agrupamento seguem a convivência confirmada; teclado, foco, 44 px e mobile passam.
- [x] Banco já aplicado antes de publicar código que seleciona colunas ou chama RPCs novas; gates da aplicação e banco passam.
- [x] DESIGN.md 6.8 e documentação dos formulários acompanham esta entrega; não ficam dependentes da PR de consulta.

### Item 3 — Resumo expansível, filtros em Ativos e documentação da entrega

**Contexto:** a lista atual não permite consultar os novos detalhes sem editar nem localizar conjuntos pelos atributos.

**Ação técnica:** manter o fluxo de leitura existente da página Ativos e derivar filtros/resumos das mesmas linhas, com helpers puros de parsing/filtragem conforme P5 e P6. Preservar taxonomia, abas, nome completo e ações existentes. Emendar DESIGN.md 6.7 (lista/resumo) e 6.12 (abas que preservam filtros) nesta PR; atualizar KB-003 para consulta/filtros e KB-002 para verificação em produção, reconciliando as emendas das entregas anteriores. Preparar nota em `/novidades` vinculada à versão que vier a ser lançada, sem inventar versão/data.

**Critérios de aceite:**

- [x] Em uso e Desativados têm Ver detalhes; resumo não exige edição e não acrescenta colunas ou campos à linha principal.
- [x] Filtrar fica abaixo das abas; filtros ativos e Limpar são visíveis com painel fechado; estado aplicado vem da URL.
- [x] Multisseleção combina OU e campos combinam E; Exatamente/Até comparam número na mesma unidade, sem conversão; inválidos, estados ausentes, contadores, trânsito e sem resultados seguem P5 e D8.
- [x] Não informado nos filtros de regime, FGC e situação do prazo seleciona apenas o respectivo nulo e não o trânsito; distingue Todos, Não e Não se aplica. Prazo não informado não aceita comparador, dias ou unidade preenchidos.
- [x] Filtros, resumo, aba e contadores derivam das mesmas linhas lidas; erro de consulta/contagem não apresenta conjunto parcial; não há nova composição por marca ou promessa de snapshot global.
- [x] Mobile/desktop, teclado e axe passam com todos os campos e textos longos, sem overflow horizontal.
- [x] Documentação descreve o produto efetivamente entregue, as opções e suas limitações, sem regras fiscais ou garantia automática.
- [x] DESIGN.md 6.7 e 6.12 descrevem Em uso como tabela no desktop e lista no celular, Desativados como lista em todas as larguras, resumo em cada formato e preservação de filtros nas abas.
- [x] Roteiro de verificação em produção está pronto; issue só fecha após relato sanitizado e reconciliação no encerramento.

## Arquivos afetados

Arquivos existentes previstos: `src/lib/telas/detalhes-ativo.ts` e seus testes; `src/lib/telas/leituras.ts`; `src/lib/telas/carteira.ts` (mensagens); `src/app/(app)/ativos/acoes.ts`; `src/app/(app)/ativos/page.tsx`; `src/components/formularios/detalhes-ativo.tsx`, `novo-ativo.tsx`, `editar-ativo.tsx`; `src/lib/leitura-next.test.ts`; testes com fixtures tipadas de Ativo afetadas; `tests/e2e/ativos-detalhes.spec.ts`, `ativos.spec.ts`; `supabase/tests/database/03_funcoes.test.sql`; DESIGN.md, KB-002, KB-003, KB-004 e `src/lib/novidades.ts`.

`src/lib/leitura-next.test.ts` e demais fixtures tipadas só recebem a adaptação indispensável das novas colunas; não há novo protocolo/teste de marca. `src/lib/leitura.ts` e a função/gatilho de metadados não são alvos de alteração. Documentação acompanha a entrega correspondente: banco em KB-002/KB-003 no Item 1; formulários em DESIGN.md 6.8 e KB-003/KB-004 no Item 2; lista e abas em DESIGN.md 6.7/6.12 e consulta/produção em KB-003/KB-002 no Item 3.

Arquivos novos propostos, ainda não existentes: migração gerada em `supabase/migrations/`; pgTAP dedicado em `supabase/tests/database/`; fixtures de upgrade em `tests/fixtures/atributos/`; helpers/testes de atributos e filtros em `src/lib/telas/`; componentes de resumo/filtros em `src/components/` apenas se necessários para composição. Nomes finais constarão na issue/task sem ampliar escopo.

Artefatos do ciclo: este plano; tasks por issue após numeração real; evidências de upgrade; task de encerramento; `_project/cycles.md`. A ideação é incluída na futura publicação documental preservando seu conteúdo histórico. O backlog não é editado neste rascunho.

## Decomposição em issues e PRs

As issues [#172](https://github.com/EuThiagoAndrade/saldo-futuro/issues/172), [#173](https://github.com/EuThiagoAndrade/saldo-futuro/issues/173) e [#174](https://github.com/EuThiagoAndrade/saldo-futuro/issues/174) foram criadas após a integração da [PR #171](https://github.com/EuThiagoAndrade/saldo-futuro/pull/171) e a confirmação dos payloads em 2026-10-30. Os corpos efetivos foram publicados conforme o formulário `.github/ISSUE_TEMPLATE/feature_request.yml` e estão registrados em "Registro de criação das issues". A unidade Banco (#172) foi integrada pela PR #175, com a ação externa relatada; a unidade Formulários (#173) foi integrada pela PR #177; a unidade Consulta (#174) foi autorizada e iniciada.

| Unidade | Issue e título | Conteúdo/PR | Dependência e fechamento |
| :-- | :-- | :-- | :-- |
| Banco | [#172](https://github.com/EuThiagoAndrade/saldo-futuro/issues/172) — [FEATURE] Persistir atributos complementares dos ativos com escrita isolada | Item 1, migração/testes/upgrade | Depois do plano integrado; merge não fecha issue enquanto ação externa estiver pendente |
| Formulários | [#173](https://github.com/EuThiagoAndrade/saldo-futuro/issues/173) — [FEATURE] Preencher atributos complementares no cadastro e na edição | Item 2 | Banco aplicado e conferido; uma PR, podendo fechar a issue na integração |
| Consulta | [#174](https://github.com/EuThiagoAndrade/saldo-futuro/issues/174) — [FEATURE] Consultar e filtrar atributos complementares na página Ativos | Item 3 | Formulários integrados; issue permanece aberta até verificação em produção e encerramento |

Uma branch por issue (`feature/issue-N`), commit `feat(issue-N): ...`, task `017_task_issue-N.md` e PR por unidade. Sem número inventado. PR documental do plano usa `chore/cycle-017-plan`; commit `docs(cycle-017): ...`. A última entrega do ciclo completo não move o ciclo a executed: release, se houver, e encerramento têm PRs próprias e aprovação própria de cada merge; encerramento usa `chore/cycle-017-closure` e não cria issue recursiva.

## Dependências e blockers

- **Para a redação:** nenhum bloqueio material; autorização e origem conferidas. Definições ainda abertas na ideação foram transformadas em propostas explícitas P1 a P6, sem simular sua aceitação.
- **Para aprovação:** atendido. D1 a D12 registradas, Rodada 4 com APTO PARA APROVAÇÃO sem achados, e manifestação humana posterior aprovando a v4 integralmente, inclusive INPC. Não há pergunta de produto pendente nem alteração de conteúdo após esse parecer.
- **Para implementação:** revisão formal apta, aprovação humana posterior, integração documental, payloads confirmados, issues e autorização por unidade. Este rascunho não os substitui.
- **Para deploy das telas:** migração nova integrada, ensaiada e aplicada pelo responsável com conferência acessível. Falta de capacidade/acesso para conferir precondição leva a Parado; concessão não conta como verificação.
- **Para encerramento:** todas as entregas integradas, ação externa comprovada, produção verificada, release/notas reconciliadas quando aplicável e documentação viva consolidada.

## Riscos, suposições e rollback

- **Modelo escolhido:** arrays para dois conjuntos pequenos e fixos reduzem tabelas, joins e políticas. Constraints e testes devem provar forma canônica e exclusividades; se precisarem ser catálogos mutáveis por usuário ou estruturas hierárquicas, parar e rever o plano em vez de estender por inferência.
- **Semântica do prazo:** assumir unidade ou confundir cotização com disponibilidade produziria informação enganosa. P2 exige conceito explícito; não impor prazo regulatório genérico nem automatizar datas.
- **Tributação e FGC:** os campos não são verificação de elegibilidade, tabela de alíquotas ou cálculo de garantia. Fontes primárias abaixo orientam a cautela e terminologia; não autorizam enquadramento de produtos ou carteiras.
- **Legado:** preservação/agrupamento dos quatro indicadores está confirmada em D12/P3. Não preencher novos campos por equivalência, não apagar dados e não mudar migração histórica.
- **Prazo para venda e unidades diferentes:** a informação é total manual declarado, não uma promessa de prazo executável para qualquer data de negociação. A ajuda não deve ensinar a somar dias úteis com corridos; exige total conhecido e registra em corridos arredondado para cima, ou Não informado quando desconhecido. Nenhum calendário, campo de etapas ou cálculo automático é acrescentado.
- **Deploy:** ordem banco compatível → ação externa → app. Reverter apenas aplicação para versão anterior preserva colunas e valores; testar que RPC antiga não apaga extras. Não executar down migration, reset ou drop em produção. Correção de banco é migração nova.
- **UI:** seleção múltipla e nove conceitos exigem espaço quando abertos. Agrupar visualmente, recolher, quebrar textos e validar no mobile; não introduzir rolagem horizontal ou ação apertada à direita do nome.
- **Leitura descritiva:** uma edição concorrente pode aparecer antes ou depois, conforme a leitura existente. Filtros e resumo compartilham as mesmas linhas; não há requisito de snapshot global nem justificativa demonstrada para ampliar a marca. Não modificar leitores financeiros, função/gatilho compartilhado ou acrescentar cache genérico.

Roteiro de verificação em produção, após autorização: responsável confere presença da migração/RPCs e versão; consulta resumos nas duas abas; confere múltiplas opções e prazo/unidade já informados; testa aplicar/limpar/trocar abas e vê a lista esperada; confere controles no celular e desktop. Cadastro/edição de dados reais só por ação intencional do responsável. Relatar apenas passou/falhou por item, sem reproduzir carteira, nomes, valores ou prints reais. Falha vira pendência explícita, sem declarar o ciclo concluído.

## Sequência recomendada

1. Concluído: v4 com D10 a D12 revisada na Rodada 4, veredito APTO PARA APROVAÇÃO sem achados e aprovação humana posterior registrada. Pareceres e respostas preservados.
2. Publicar a PR documental autorizada pela aprovação do plano, executar gates e receber aprovação específica do merge; nenhuma integração está autorizada pela frase de aprovação do plano.
3. Confirmar payloads e criar issues após integração documental; registrar retorno no backlog somente após integração do destino, com publicação separada.
4. Autorizar a issue de banco, implementar/validar, publicar PR e integrar após aprovação; responsável aplica a migração e relata/conferem-se precondições sanitizadas.
5. Autorizar e entregar formulários; repetir gates, PR e aprovação do merge.
6. Autorizar e entregar consulta/filtros e documentação; repetir gates, PR e aprovação do merge; executar verificação em produção autorizada e reconciliar evidências.
7. Conferir release-please, notas e data de publicação sem inventar versão. Integrar release com aprovação própria; preparar encerramento prospectivo, atualizar tasks/estado/links e integrar com aprovação própria.

## Referências

- `.agent/ai_behavior.md`; `_project/README.md`; `_project/cycles.md`; template e workflow nomeados em Decisões e autoridades.
- `_project/ideations/017_atributos_complementares_ativos.md`, D1 a D3; respostas humanas D4 a D6 registradas durante o rascunho e D7 a D9 durante a correção v2, todas em Decisões humanas confirmadas deste plano. D7 define o catálogo tributário amplo; D8, as regras de combinação, trânsito e Exatamente/Até; D9, o texto explicativo.
- Respostas posteriores à manifestação de aprovação da v3, em 2026-10-30: D10 (rótulos/indexadores e delegação da inclusão de INPC), D11 (prazo para resgate ou venda e ajuda de unidades diferentes/arredondamento manual) e D12 (preservação dos quatro indicadores). A resposta não foi tratada como aprovação antecipada da v4.
- ADR-003; KB-003 (metadados/taxonomia/leitura); KB-004 4.1; DESIGN.md 6.7 e 6.8.
- Migrações de metadados `20261024000829_metadados_ativos.sql`, taxonomia `20261026204955_taxonomia_ativos.sql`, fase 2 `20261026215542_taxonomia_ativos_fase2.sql` e versão/nome `20261027220000_metadados_nome_ativo.sql`.
- Fontes primárias consultadas em 2026-10-30, somente para delimitar conceitos, sem assumir regras de cálculo: [CVM — prazo e efetiva disponibilização de recursos](https://www.gov.br/cvm/pt-br/assuntos/noticias/2022/cumprimento-dos-prazos-de-pagamento-de-resgates-previstos-no-regulamento-do-fundo-e-na-regulamentacao) (orientação histórica, não usada para impor prazo regulatório vigente); [Ministério da Previdência — perguntas frequentes](https://www.gov.br/previdencia/pt-br/acesso-a-informacao/perguntas-frequentes) (terminologia progressiva/regressiva em previdência); [FGC — sobre a garantia](https://www.fgc.org.br/sobre-garantia-fgc) (garantia depende do produto e condições; não vira classificação automática no sistema).
- Para esclarecer os rótulos de regime na correção v2, consultadas em 2026-10-30: [Receita Federal — Tributação de 2026](https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026) (renda fixa, fundos de longo/curto prazo e previdência têm tratamentos separados); [Previdência — modalidades progressiva e regressiva](https://www.gov.br/previdencia/pt-br/assuntos/previdencia-complementar/mais-informacoes/perguntas-frequentes-de-previdencia-complementar); [Receita Federal — Bolsa de Valores](https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/pagamento/renda-variavel/bolsa-de-valores-1). As categorias da P1 são proposta operacional do produto, não catálogo fiscal exaustivo derivado das fontes; não se transportam alíquotas, isenções, regras de operações ou enquadramentos para o sistema.
- Para a terminologia da v4, consultadas em 2026-10-30: [IBGE — painel de inflação, INPC](https://www.ibge.gov.br/indicadores/inflacao) e [Portal do Investidor/CVM — BDRs](https://www.gov.br/investidor/pt-br/investir/tipos-de-investimentos/brazilian-depositary-receipts-bdrs). As escolhas de rótulos e a orientação manual da P2 vêm de D10/D11; as fontes não criam regra de conversão, cobertura ou classificação automática.

## Rastreabilidade

| Campo | Valor |
| :-- | :-- |
| Issue(s) | [#172](https://github.com/EuThiagoAndrade/saldo-futuro/issues/172), [#173](https://github.com/EuThiagoAndrade/saldo-futuro/issues/173) e [#174](https://github.com/EuThiagoAndrade/saldo-futuro/issues/174) |
| PR(s) | [#171 — publicação documental da ideação/plano/registro do ciclo](https://github.com/EuThiagoAndrade/saldo-futuro/pull/171), integrada em `main` (`a28f22667d67ddaf80e35ab7af201ae1d4a84a53`); [#175 — unidade Banco, issue #172](https://github.com/EuThiagoAndrade/saldo-futuro/pull/175), integrada em `main` (`030a0251b876f56a54a018225644bd51acaca878`); ação externa relatada pelo responsável em 2026-10-30; [#177 — unidade Formulários, issue #173](https://github.com/EuThiagoAndrade/saldo-futuro/pull/177), integrada em `main` (`e58f02dde56229c84996d0803bdb5a32ef96b078`); [#178 — unidade Consulta, issue #174](https://github.com/EuThiagoAndrade/saldo-futuro/pull/178), integrada em `main` pelo responsável (`8cba4ac2dadc825057af777456530a9cbc66da6c`) |
| Branch(es) | `chore/cycle-017-plan` — publicação documental da ideação/plano/registro do ciclo; `feature/issue-172` — unidade Banco, task `017_task_issue-172.md`; `feature/issue-173` — unidade Formulários, task `017_task_issue-173.md`; `feature/issue-174` — unidade Consulta, task `017_task_issue-174.md` |
| Destino após conclusão | `_project/executed/017_atributos_complementares_ativos/017_plan.md` |

## Próximo passo

Encerramento prospectivo: conclusão efetiva somente depois do merge da PR de encerramento.

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 017 (completo)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 017 + atualizar_docs + document_set/encerramento + 9abf28384d95d914f8a26f7e71a470f359370a50`
- `effect_class`: `remote_mutation`
- `state_before`: entregas #172 a #174 integradas; ação externa e VA1 a VA8 concluídos conforme relato humano; release v0.13.0 publicada; ciclo Em execução em drafts.
- `state_after`: plano, tasks, índice e documentação viva reconciliados; ciclo movido a executed com conclusão prospectiva; antes do merge, situação efetiva Aguardando merge quando só faltar integração.
- `result`: `executed`
- `evidence`: `017_task_closure.md`, tasks das entregas, PRs #175/#177/#178 e release v0.13.0 pela PR #176.
- `blockers`: checks e aprovação própria da PR de encerramento.

### Histórico — handoff da verificação em produção

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 017 + atualizar_docs + document_set/verificacao-producao + 8cba4ac2dadc825057af777456530a9cbc66da6c`
- `effect_class`: `remote_mutation`
- `state_before`: ciclo Em execução, entregas integradas e emendas destinadas ao 018; Aguardando verificação em produção; release #176 aberta.
- `state_after`: autorização e relato humano "todos passaram" para VA1 a VA8 registrados na task #174 e refletidos neste próximo passo; checks da release acionados; Aguardando merge da #176, condicionado a checks verdes e aprovação própria. Nenhum merge nem encerramento executado.
- `result`: `executed`
- `evidence`: `017_task_issue-174.md`, seção "Verificação em produção — 2026-10-30"; PRs #175/#177/#178 MERGED, checks da #178 verdes; PR #176 aberta no head `9958a1fd5b85d5303052da68fc1749529e8e9ec9`; runs `41166126047` e `41166128107`.
- `blockers`: aprovação do merge da release #176; todos os checks automáticos e manuais passaram no head `9958a1fd5b85d5303052da68fc1749529e8e9ec9`, conferido em 2026-10-31 (America/Cuiaba). Publicação da release e encerramento posteriores.

### Histórico — handoff das emendas

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 017 + rascunhar_plano + 017_plan/emendas-E1-E2 + 8cba4ac2dadc825057af777456530a9cbc66da6c`
- `effect_class`: `local_mutation`
- `state_before`: plano v4 `Em Execução`; #172 a #174 entregues em `main` (`8cba4ac2dadc825057af777456530a9cbc66da6c`), #178 integrada pelo responsável; release 0.13.0 (PR #176) aberta; o responsável pediu mudanças na tela e decidiu D13 a D18 na conversa, autorizando o registro e a revisão.
- `state_after`: plano v5 com as emendas E-1 e E-2, D13 a D18, P3 e D12 anotados; task da #174 reconciliada; na branch `chore/cycle-017-emendas`, sem commit; Aguardando revisão (rodada 5). Nenhum código, migração, issue ou PR.
- `result`: `executed`
- `evidence`: estado conferido no GitHub (#178 MERGED, #172 e #174 OPEN, #176 OPEN sem issue vinculada); seção "Emendas E-1 e E-2"; validador e `git diff --check` depois da gravação.
- `blockers`: a Rodada 5 e a aprovação humana posterior da v5; depois, PR documental, payloads e criação das duas issues novas.

### Histórico — handoff anterior

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 017 + criar_issues + issues-172-174 + a28f22667d67ddaf80e35ab7af201ae1d4a84a53`
- `effect_class`: `remote_mutation`
- `state_before`: plano v4 Aprovado e PR #171 integrada em main (`a28f22667d67ddaf80e35ab7af201ae1d4a84a53`); payloads apresentados e confirmação recebida em 2026-10-30 ("Pode criar as issues aprovadas no plano."); nenhuma issue aberta no repositório.
- `state_after`: issues #172, #173 e #174 criadas no GitHub e conferidas via `gh issue view` como OPEN; registros locais atualizados em `017_plan.md` e `cycles.md`, sem commit ou push direto em main; ciclo em Planejamento; nenhuma implementação iniciada; próximo passo aguarda autorização para a issue #172.
- `result`: `executed`
- `evidence`: issues [#172](https://github.com/EuThiagoAndrade/saldo-futuro/issues/172), [#173](https://github.com/EuThiagoAndrade/saldo-futuro/issues/173) e [#174](https://github.com/EuThiagoAndrade/saldo-futuro/issues/174) abertas e conferidas; validador de governança executado e sem erros.
- `blockers`: autorização humana explícita para implementar a issue #172 ("autorizo a implementação da issue #172").

### Registro de criação das issues

- **Data e autorização:** 2026-10-30, "Pode criar as issues aprovadas no plano.", após a apresentação e confirmação dos três payloads.
- **Precondições conferidas:** plano v4 `Aprovado`; PR #171 integrada em `main` pelo commit `a28f22667d67ddaf80e35ab7af201ae1d4a84a53`; busca `gh issue list` sem duplicatas.
- **Template aplicado:** `.github/ISSUE_TEMPLATE/feature_request.yml` — Contexto, Escopo, Critérios de aceite, Ciclo e plano relacionados, Dependências, riscos e autorizações, nessa ordem; sem labels ou responsáveis.
- **Resultado:** três issues criadas sequencialmente por `gh issue create --body-file`, relidas com `gh issue view` e conferidas como `OPEN`:
  - [#172](https://github.com/EuThiagoAndrade/saldo-futuro/issues/172) — `[FEATURE] Persistir atributos complementares dos ativos com escrita isolada`
  - [#173](https://github.com/EuThiagoAndrade/saldo-futuro/issues/173) — `[FEATURE] Preencher atributos complementares no cadastro e na edição`
  - [#174](https://github.com/EuThiagoAndrade/saldo-futuro/issues/174) — `[FEATURE] Consultar e filtrar atributos complementares na página Ativos`

### Histórico — handoff da aprovação do plano e PR documental

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 017 + aprovar_plano + 017_plan + v4`
- `effect_class`: `remote_mutation`
- `state_before`: plano v4 Em Revisão, Rodada 4 concluída com APTO PARA APROVAÇÃO sem achados, Aguardando aprovação; produto confirmado em D1 a D12. Blob de origem `2c017eece77566220d130792d5437af2a0535b0c`, main local/remota em `337d8b83c809e9070391d7767df6eb8ed8b81271`, sem PR ou branch documental anterior. Ideação/plano/cycles locais sem commit; manifestação de aprovação da v4 recebida nesta conversa após o veredito.
- `state_after`: plano v4 Aprovado, aprovação humana pós-revisão registrada em 2026-10-30, incluindo D10 a D12/INPC. Branch `chore/cycle-017-plan` publicada e PR documental #171 aberta para main com somente ideação/plano/cycles; Aguardando merge, sem mudança da especificação. Nenhuma issue ou implementação iniciada. Checks remotos em execução na conferência inicial; merge depende de checks verdes e aprovação própria.
- `result`: `executed`
- `evidence`: aprovação humana posterior à Rodada 4 nesta conversa; commit documental `675627f7c8620b14c8c93b72b6388afcc22fe9ab`; push sem force e criação da [PR #171](https://github.com/EuThiagoAndrade/saldo-futuro/pull/171), aberta/não draft, conferida via gh com os três arquivos previstos. Em 2026-10-30: 48/48 testes do validador passaram; validador com 0 erros, 0 avisos e 5 itens manuais; git diff --cached --check passou. Comparação textual confirmou a especificação P1 a P6 e as quatro rodadas/respostas preservadas; ideação mantém blob `dd6e8650458f46cbd3a24633c98b6367453b351a`. G3 e escopo revisados manualmente. Conferência inicial: CI de aplicação/banco, governança e Vercel em execução; Vercel Preview Comments aprovado. Resultado final dos checks deve ser conferido no GitHub para o head corrente antes do merge; nenhum merge realizado.
- `blockers`: nenhum para registrar aprovação e publicar a PR documental. Merge requer autorização própria; criação de issues só depois da integração documental e confirmação de payloads; implementação não autorizada.

## Revisão crítica

Concluída. As quatro rodadas, pareceres e respostas anteriores permanecem preservados abaixo. A Rodada 4 avaliou a v4 e emitiu APTO PARA APROVAÇÃO, sem achados. O responsável depois aprovou expressamente a v4, conforme cabeçalho e registro de aprovação ao final desta seção. O veredito do revisor e a aprovação humana são atos distintos; a frase anterior sobre a v3 permanece histórica.

### Rodada 1

- **Data:** 2026-10-30.
- **Versão revisada:** v1; base `337d8b83c809e9070391d7767df6eb8ed8b81271` (main local igual à remota, conferida por `gh`, sem PR aberta), com `_project/cycles.md`, ideação e plano ainda sem commit. Blob da ideação conferido: `dd6e8650458f46cbd3a24633c98b6367453b351a`.
- **Autor:** Codex (GPT-6), conforme o próprio plano.
- **Revisor:** Claude Code (Claude Opus 5.5).
- **Veredito:** `REQUER NOVA RODADA`.

#### Achados

- **R1-1 — Bloqueador: a nova leitura coerente de Ativos e a ampliação da marca não demonstram dano que justifique.** A P4 amplia o gatilho `ativos_versao_metadados` (`20261027220000_metadados_nome_ativo.sql:24`, hoje só `nome`, `instituicao_id` e `taxonomia_id`) para os quatro indicadores e os sete campos novos. A P5 cria uma composição com marca para a página Ativos. Os critérios dos Itens 1 e 3 e a linha "Coerência" da estratégia dependem dessas duas escolhas. Hoje a página lê em `Promise.all`, sem marca (`src/app/(app)/ativos/page.tsx:197`). A KB-003 registra que as telas descritivas não ganharam composição nova: foi a decisão do ciclo `015`, depois do achado R1-1 daquela revisão. A ideação (linha "Coerência" dos riscos) pede não ampliar a marca "sem necessidade demonstrada". O plano afirma a necessidade (baseline, P5 e risco "Versionamento"), mas não mostra o resultado errado. Resumo e filtros saem das mesmas linhas de `ativos`, lidas uma única vez. Até 1.000 ativos, a leitura é uma consulta só. Acima disso, cada linha está num estado válido, antes ou depois da edição de um único ativo, e nenhuma regra relaciona uma linha com outra. Uma instituição renomeada aparece com o nome antigo ou com o novo, e a taxonomia só muda por migração. Os custos são concretos:
  - troca da função e do gatilho, que a tabela `instituicoes` também usa;
  - testes de marca novos ou revistos;
  - os três leitores do Início passam a repetir a leitura por edições de campos que eles não usam, o que muda o contrato documentado em `versaoMetadados` (`src/lib/leitura.ts`) e na KB-003.

  E, se a composição for mantida, a marca proposta não cobre a desativação (`ativo` e `desativado_em`), que decide a aba e os contadores. A `marcaCarteira` cobre (`ultimaDesativacao`, `src/lib/leitura.ts:149`).

  **Na v2:** retirar a composição e a ampliação, mantendo a leitura atual com as colunas novas obrigatórias (migração ausente continua sendo erro visível). Ou então demonstrar, com um cenário concreto, o efeito observável errado; nesse caso, incluir a desativação na marca. Se a escolha for de escopo e não técnica, levá-la ao responsável. Alinhar P4, P5, baseline, critérios dos Itens 1 e 3, estratégia de testes, riscos e arquivos afetados.
- **R1-2 — Ressalva: o catálogo P1 ainda não está pronto para a confirmação humana que a aprovação exige.**
  - Prazo: os códigos `no_vencimento`, `sem_prazo_estimavel`, `nao_aplicavel`, `uteis` e `corridos` não têm rótulo em português.
  - Regime: a D5 pede "distinguir **também** regimes como progressivo e regressivo". O "também" sugere opções além dessas duas, mas o catálogo só tem progressivo, regressivo, outro e não se aplica. Também não diz a qual tabela "regressivo" se refere: a de previdência e a de renda fixa têm o mesmo nome e conteúdos diferentes. Apresentar ao responsável o significado de cada opção, com exemplos fictícios, e a alternativa de um catálogo mais amplo, sem alíquotas nem regra fiscal. Registrar a escolha.
  - Indexador: "Sem indexador", ao lado de "Não se aplica", tende a ser confundido. Considerar o rótulo "Prefixado (sem indexador)" ou explicar a diferença com exemplos fictícios.
  - Nomes: `liquidez_tipo`, `liquidez_dias` e `liquidez_unidade` (colunas e parâmetros de filtro) descrevem o atributo "Prazo de resgate informado" e voltam a aproximá-lo de `liquidez_imediata`, que a P3 quer distinguir. Preferir um prefixo do prazo (por exemplo, `prazo_resgate_*`) ou justificar a escolha.
- **R1-3 — Ressalva: as decisões de produto da P5 e da P6 estão fora da confirmação humana.** A P5 marca a exclusão do trânsito nos filtros como "regra de produto proposta, a conferir na revisão", mas o revisor não decide regra de produto. Também são escolhas do responsável:
  - OU dentro de um conjunto e E entre atributos;
  - igualdade exata do prazo, sem faixas (uma busca como "até 1 dia útil" fica sem filtro);
  - o texto explicativo da P6.

  A precondição de "Aprovar plano" e a seção "Dependências e blockers" listam só P1 a P3. Incluir a P5 e o texto da P6 na confirmação expressa, com exemplos fictícios.
- **R1-4 — Ressalva: contrato visual e documentação viva concentrados no Item 3.** O Item 2 traz padrões de formulário novos: checkboxes em `fieldset` com exclusividade e selects para atributos de quatro ou cinco estados, ao lado do "Rádio de três estados" de DESIGN.md 6.8. O Item 3 muda as abas de 6.12, cujos links passam a preservar filtros, e a lista de 6.7. Mesmo assim, o plano só atualiza o DESIGN.md no Item 3; no ciclo `015`, o DESIGN.md foi emendado "nas respectivas entregas". Emendar 6.8 na PR do Item 2 e 6.7 e 6.12 na do Item 3. Se a marca for mantida (R1-1), o comentário de `versaoMetadados` e a KB-003 acompanham a PR do Item 1. Além disso, a P6 descreve o resumo no desktop "dentro da célula Nome" nas duas abas, mas Desativados é uma lista em todas as larguras (`page.tsx:165`). Especificar o desktop dessa aba.
- **R1-5 — Ressalva: a precondição da ação externa cria uma aprovação inexistente.** "Ensaio de upgrade aprovado" não é um dos cinco tipos de ponto de aprovação do `_project/README.md`. Trocar por uma condição verificável, como "ensaio de upgrade registrado na task, com evidência".

#### Itens atendidos e evidências

- Template integral; "Problema e contexto" no formato do nível completo; campos do cabeçalho válidos. "Origem no backlog" idêntica ao snapshot da ideação (BL-015, commit da fila e base de main). `cycles.md` registra o `017` em Planejamento, com próximo ciclo `018`.
- D1 a D6 separadas das propostas P1 a P6. O plano não deixa o catálogo para o implementador e exige confirmação humana antes das issues. Modo contínuo proibido e ausente.
- Fatos conferidos por leitura:
  - `cadastrar_ativo_taxonomia` e `editar_ativo_com_nome` chamam `travar_carteira()` (lock transacional), conferem o dono antes de resolver a instituição, aceitam ativo desativado e recusam o trânsito;
  - `ativos_transito_sem_detalhes_check` existe; `ativos` só tem SELECT para `authenticated`, com RLS por dono;
  - o gatilho da marca cobre só nome, instituição e classe;
  - `COLUNAS_ATIVO` é compartilhada (`src/lib/telas/leituras.ts:32`), o que torna correta a ordem banco → ação externa → aplicação;
  - `03_funcoes.test.sql` mantém a lista fechada de funções;
  - toda escrita em `ativos` nas migrações nomeia as colunas, então as RPCs antigas preservam as colunas novas;
  - os arquivos existentes citados, KB-004 4.1, DESIGN.md 6.7 e 6.8 e as migrações referidas existem.
- G2: RPCs novas sem sobrecarga, com grants mínimos, `search_path` vazio e sem parâmetro de dono; testes com dois usuários, admin e anon previstos.
- G3: só exemplos fictícios. Nenhum dado de `local/` ou de produção foi lido nesta revisão.
- G4: migração nova, sem drop de assinaturas. O Item 1 não traz código da aplicação, então o deploy de main depois do merge dele não depende da ação externa.
- Pontos de aprovação com precondição, cobre, não cobre e conferir. Decomposição em três unidades com dependências coerentes; release e encerramento em PRs próprias.
- Nenhum teste da aplicação ou do banco foi executado: o código ainda não existe.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 017 + revisar_plano + 017_plan/rodada-1 + v1`
- `effect_class`: `local_mutation`
- `state_before`: v1 em Rascunho, com revisão e veredito pendentes; Aguardando revisão (rodada 1); plano local sem commit.
- `state_after`: v1 Em Revisão, Rodada 1 concluída com `REQUER NOVA RODADA`; Aguardando correções (rodada 1); aprovação humana pendente.
- `result`: `executed`
- `evidence`: achados e conferências desta rodada; cabeçalho e "Próximo passo" atualizados; handoff do rascunho preservado como histórico. Gates documentais executados depois da gravação: validador de governança e `git diff --check`.
- `blockers`: R1-1. R1-2 a R1-5 são ressalvas. É a primeira rodada, sem histórico de oscilação ou de falta de progresso.

### Resposta do autor à rodada 1 — v2

- **Autor:** Codex (GPT-6).
- **Autorização:** "corrija o plano do ciclo 017", recebida em 2026-10-30.
- **Natureza:** correção do autor, sem nova revisão ou aprovação. Rodada 1 preservada; não há contestação aos achados.

| Achado | Resposta e evidência na v2 |
| :-- | :-- |
| R1-1 | **Corrigido.** Retirada a composição por marca de Ativos e a ampliação do gatilho. Baseline, escopo, P4/P5, estratégia de leitura/testes, Itens 1/3, arquivos e riscos passam a manter o fluxo descritivo existente e o contrato do Início. Filtro/resumo/abas/contadores usam as mesmas linhas. Colunas obrigatórias, leitura completa e erro visível são preservados; não se promete snapshot global |
| R1-2 | **Corrigido.** Rótulos completos de situação/unidade; nomes `prazo_resgate_*`; significados e exemplos fictícios de Sem indexador versus Não se aplica. Regime com contextos separados e duas alternativas apresentadas; o responsável escolheu o catálogo amplo (D7), incorporado em P1 |
| R1-3 | **Corrigido.** Precondição da aprovação e dependências incluem P5 e texto P6. Exemplos/alternativas apresentados e o responsável confirmou OU/E, Exatamente/Até e exclusão do trânsito (D8), além do texto literal (D9). O prazo exato cadastrado continua D4; o revisor não decide nenhuma dessas regras |
| R1-4 | **Corrigido.** Item 2 emenda DESIGN.md 6.8 com os formulários; Item 3 emenda 6.7 e 6.12 com lista, resumo e abas. KBs acompanham suas respectivas entregas. P6 distingue Em uso em tabela no desktop de Desativados em lista em todas as larguras. A marca foi retirada; não há emenda de seu contrato |
| R1-5 | **Corrigido.** A precondição da ação externa exige ensaio de upgrade registrado na task com comandos, resultados e evidência verificável; não inventa um ponto de aprovação adicional |

Escolhas levantadas na correção respondidas e incorporadas em D7 a D9 e no Registro de escolhas de produto. As confirmações dos demais detalhes de P1/P2/P3 continuam no ponto de aprovação já previsto, sem aceitação inferida. Próximo passo: Aguardando revisão (rodada 2); esta resposta não emite veredito nem substitui o revisor.

#### Handoff do rascunho v1 — histórico

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 017 + rascunhar_plano + 017_plan + v1`
- `effect_class`: `local_mutation`
- `state_before`: main local/remota em `337d8b83c809e9070391d7767df6eb8ed8b81271`; ideação local `017` e cycles com reserva em Ideação, próximo `018`; nenhuma PR aberta e nenhum plano do ciclo. Ideação recebida com handoff v2, origem BL-015 e D1 a D3; rascunho autorizado expressamente na conversa. Respostas D4 a D6 recebidas durante a redação.
- `state_after`: plano v1 criado em drafts, Rascunho, revisão/veredito/aprovação pendentes, modo contínuo ausente; registro do ciclo reconciliado para Planejamento com link do plano, próximo ciclo preservado em `018`. Ideação e backlog preservados; sem issue, branch, commit, push, PR, código ou migração criados nesta execução.
- `result`: `executed`
- `evidence`: este plano e autorização no cabeçalho; decisões D1 a D6; propostas P1 a P6 distintas de decisões; `_project/cycles.md`; inspeção das funções, formulários, leitores e testes nomeados; SHA de main via gh, status local e busca sem outro plano. Em 2026-10-30: `node --test scripts/validate-governance.test.mjs` passou (48/48); `node scripts/validate-governance.mjs` passou (0 erros, 0 avisos e 5 itens manuais); `git diff --check` passou. Hash da ideação após a redação permaneceu `dd6e8650458f46cbd3a24633c98b6367453b351a`. Revisão manual de G3, autorização, origem e escopo concluída; nenhuma mudança na aplicação.
- `blockers`: nenhum para criar o rascunho. Catálogo, conceito completo do prazo e convivência de indicadores aguardam confirmação no processo de revisão/aprovação; revisão formal, aprovação e autorizações seguintes pendentes.

### Rodada 2

- **Data:** 2026-10-30.
- **Versão revisada:** v2; base `337d8b83c809e9070391d7767df6eb8ed8b81271`, com `_project/cycles.md`, ideação e plano ainda sem commit. Blob da ideação inalterado: `dd6e8650458f46cbd3a24633c98b6367453b351a`.
- **Autor:** Codex (GPT-6).
- **Revisor:** Claude Code (Claude Opus 5.5).
- **Veredito:** `APTO COM RESSALVAS`.

#### Conferência dos achados da Rodada 1

| Achado | Situação na v2 | Evidência conferida |
| :-- | :-- | :-- |
| R1-1 — bloqueador | Resolvido | Baseline, "Fora do escopo", P4, P5, Item 1, Item 3, linha "Leitura descritiva" da estratégia, arquivos afetados e riscos mantêm a leitura atual em `Promise.all`, sem composição e sem tocar no gatilho, em `ler_versao_metadados` ou em `src/lib/leitura.ts`. As colunas novas continuam obrigatórias, com erro visível. A ressalva sobre desativação deixa de se aplicar |
| R1-2 — ressalva | Resolvida | Rótulos de situação e unidade do prazo; prefixo `prazo_resgate_*` em colunas e parâmetros; diferença entre Sem indexador e Não se aplica explicada com exemplos fictícios; regime com contextos separados (o código ambíguo "regressivo" saiu) e catálogo amplo registrado como D7 |
| R1-3 — ressalva | Resolvida | Precondição de "Aprovar plano" e "Dependências e blockers" incluem P5 e o texto da P6. D8 registra OU/E, Exatamente/Até e a exclusão do trânsito; D9, o texto literal. O exemplo fictício da P5 confere: Fundo ou ETF → A, B e C; + CDI → A e C; Exatamente 1 dia útil → B; Até 1 dia útil → A e B; C (dias corridos) fica fora |
| R1-4 — ressalva | Resolvida | DESIGN.md 6.8 no Item 2; 6.7 e 6.12 no Item 3; KBs acompanham cada entrega. A P6 separa Em uso (tabela no desktop) de Desativados (lista em todas as larguras) |
| R1-5 — ressalva | Resolvida | A precondição da ação externa passou a ser o ensaio de upgrade registrado na task, com comandos, resultados e evidência |

Os bloqueadores caíram de um para zero, e nenhum achado corrigido reapareceu.

#### Achados

- **R2-1 — Ressalva: falta definir o filtro "Não informado" de regime, FGC e situação do prazo.** A P5 define `nao_informado` para os conjuntos (vazio) e para os quatro indicadores, e a D8 fala em "Não informado" ao excluir o trânsito. Mas, para `regime`, `fgc` e `prazo_resgate_tipo`, diz só que há "uma escolha por filtro", sem dizer se Não informado (nulo) é uma dessas escolhas. Pela regra do próprio plano, isso não deve ficar para o implementador. Especificar que os três filtros aceitam `nao_informado`, que seleciona o valor nulo, sem comparador, dias ou unidade no caso do prazo, e incluir o caso na linha "Filtros" da estratégia de testes. Também resolve aceitar a ressalva na aprovação, registrando essa interpretação.
- **R2-2 — Ressalva: textos que a correção não atualizou.** "Decisões e autoridades" ainda diz que "não houve revisão formal nesta etapa" e cita só o rascunho, embora a v2 seja uma correção após a Rodada 1. "Referências" cita só D1 a D6, sem D7 a D9. Não muda escopo; ajustar numa próxima versão ou na PR documental do plano.

#### Itens atendidos e evidências

- Cabeçalho: versão `v2`, "Autorização da correção" registrada, modo contínuo ausente. Rodada 1 preservada sem alteração; resposta do autor em subseção própria, item a item, sem contestação.
- Nenhum fato novo de código foi introduzido na v2; os da Rodada 1 continuam valendo. Conferido de novo: o gatilho `ativos_versao_metadados` cobre só `nome`, `instituicao_id` e `taxonomia_id` (`20261027220000_metadados_nome_ativo.sql:24`), e a página Ativos lê em `Promise.all` (`src/app/(app)/ativos/page.tsx:197`), como a v2 descreve.
- G1: os filtros comparam inteiros na mesma unidade, sem converter úteis/corridos, calcular datas ou prazo efetivo; continua sem regra financeira. G2, G3 e G4 sem mudança em relação à Rodada 1.
- **Limites desta conferência:** as respostas D7 a D9 foram dadas na conversa de correção, que este revisor não acessa; a validação de que foram ditas pelo responsável é item manual do validador. As fontes externas acrescentadas na v2 não foram acessadas nesta revisão. Elas só delimitam terminologia e não entram como regra.
- **Confirmações que a aprovação ainda precisa trazer** (precondição de "Aprovar plano" e "Registro de escolhas de produto"): opções de veículo e de indexador da P1, inclusive o rótulo "Sem indexador"; significado completo do prazo (P2); preservação dos quatro indicadores com agrupamento visual (P3); e a decisão sobre R2-1 e R2-2.
- Nenhum teste da aplicação ou do banco foi executado: o código ainda não existe.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 017 + revisar_plano + 017_plan/rodada-2 + v2`
- `effect_class`: `local_mutation`
- `state_before`: v2 Em Revisão, com o veredito da v2 pendente; Aguardando revisão (rodada 2); plano local sem commit.
- `state_after`: v2 Em Revisão, Rodada 2 concluída com `APTO COM RESSALVAS`; revisão formal concluída; Aguardando aprovação do plano; aprovação humana pendente.
- `result`: `executed`
- `evidence`: conferência item a item dos cinco achados da Rodada 1, achados R2-1 e R2-2, cabeçalho e "Próximo passo" atualizados. Gates documentais executados depois da gravação: validador de governança e `git diff --check`.
- `blockers`: nenhum bloqueador. R2-1 e R2-2 são ressalvas, a resolver ou aceitar expressamente na aprovação; confirmações de P1 (veículos e indexadores), P2 e P3 pendentes, conforme a precondição do plano.

### Resposta do autor à rodada 2 — v3

- **Autor:** Codex (GPT-6).
- **Autorização:** "corrija o plano do ciclo 017", recebida em 2026-10-30 após a Rodada 2.
- **Natureza:** correção documental do autor, sem revisão ou aprovação da v3. As Rodadas 1 e 2, seus vereditos e a resposta anterior permanecem preservados.

| Achado | Resposta e evidência na v3 |
| :-- | :-- |
| R2-1 | **Corrigido.** P5 explicita `nao_informado` nos filtros escalares de regime, FGC e situação do prazo, com seleção dos respectivos valores nulos e distinção de Todos, Não e Não se aplica. Prazo não informado dispensa comparador, dias e unidade, e a combinação preenchida indevidamente é erro. Exemplos, estratégia de testes e critério do Item 3 cobrem o caso; exclusão do trânsito preserva D8. Nenhuma nova opção é persistida no ativo |
| R2-2 | **Corrigido.** Decisões e autoridades identifica o workflow de correção e as revisões já realizadas, sem atribuir ao autor um novo parecer. Referências inclui D7 a D9, sua origem na correção v2 e o conteúdo de cada decisão. Sequência e próximo passo passam a encaminhar a v3 para a Rodada 3 |

Sem contestação. As confirmações de produto P1 (veículos/indexadores), P2 e P3 continuam no ponto de aprovação já previsto; o pedido de corrigir não foi tratado como aceitação desses itens. Não houve alteração de decisão humana, regra financeira ou aplicação.

#### Handoff da correção v2 — histórico

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 017 + rascunhar_plano + 017_plan + v2`
- `effect_class`: `local_mutation`
- `state_before`: plano v1 Em Revisão, veredito REQUER NOVA RODADA, Aguardando correções (rodada 1), com R1-1 bloqueador e R1-2 a R1-5 ressalvas. Plano local sem commit, blob de origem `3c6951f2a5c647ac9910e98cc023b9552f7dbc1a`; main `337d8b83c809e9070391d7767df6eb8ed8b81271`, igual à remota via gh, sem PR aberta. Correção autorizada expressamente; ideação e cycles preexistentes preservados.
- `state_after`: plano v2 Em Revisão; achados respondidos em seção própria, rodada 1 preservada, decisões humanas D7 a D9 incorporadas. Veredito da v2 pendente e situação Aguardando revisão (rodada 2); aprovação humana pendente. Retiradas composição de leitura e ampliação da marca; corrigidos catálogo, filtros, documentação por entrega e ação externa. Somente o plano foi alterado nesta correção, sem código, migração, issue, branch, commit, push ou PR.
- `result`: `executed`
- `evidence`: autorização no cabeçalho; D7 a D9 e respostas expressas na conversa; resposta individual aos cinco achados; leitura de Ativos, marca e DESIGN.md; fontes primárias de terminologia referidas. Em 2026-10-30: `node --test scripts/validate-governance.test.mjs` passou (48/48), `node scripts/validate-governance.mjs` passou (0 erros, 0 avisos e 5 itens manuais) e `git diff --check` passou. Comparação textual confirmou preservação integral da Rodada 1 (8.420 caracteres, normalizados finais de linha); blob da ideação permanece `dd6e8650458f46cbd3a24633c98b6367453b351a`. Histórico do handoff v1 preservado abaixo; revisão manual de G3 e escopo concluída. Testes de aplicação/banco não executados nesta correção documental.
- `blockers`: nenhum para concluir a correção e encaminhar à rodada 2. Revisão formal da v2, confirmação dos demais detalhes de P1/P2/P3 no processo de aprovação e aprovação humana posterior permanecem pendentes; não há autorização de implementação.

### Rodada 3

- **Data:** 2026-10-30.
- **Versão revisada:** v3; base `337d8b83c809e9070391d7767df6eb8ed8b81271`, com `_project/cycles.md`, ideação e plano ainda sem commit. Blob da ideação inalterado: `dd6e8650458f46cbd3a24633c98b6367453b351a`.
- **Autor:** Codex (GPT-6).
- **Revisor:** Claude Code (Claude Opus 5.5).
- **Veredito:** `APTO PARA APROVAÇÃO`.

#### Conferência dos achados da Rodada 2

| Achado | Situação na v3 | Evidência conferida |
| :-- | :-- | :-- |
| R2-1 — ressalva | Resolvida | A P5 acrescenta `nao_informado` aos filtros de `regime`, `fgc` e `prazo_resgate_tipo`. O valor existe só no filtro, não é gravado no ativo e seleciona o respectivo nulo. Filtro ausente ou vazio continua sendo Todos, e Não informado é distinto de Não e de Não se aplica. No prazo, comparador, dias e unidade não são enviados, e enviá-los é erro explícito. A exclusão do trânsito (D8) vale também aqui. Exemplos fictícios na P5, linha "Filtros" da estratégia e critério novo do Item 3 cobrem o caso |
| R2-2 — ressalva | Resolvida | "Decisões e autoridades" passa a descrever a modalidade de correção e as rodadas já feitas, sem emitir parecer. "Referências" cita D7 a D9, com origem e conteúdo de cada uma |

#### Achados

Nenhum. Os bloqueadores seguem em zero, e nenhum achado corrigido reapareceu.

#### Itens atendidos e evidências

- Cabeçalho: versão `v3` e "Autorização da correção v3" registradas. Rodadas 1 e 2, resposta do autor à Rodada 1 e handoffs anteriores preservados (conferidos pelos trechos de cada achado e pela tabela de conferência da Rodada 2).
- A v3 só muda P5, estratégia de testes, Item 3, "Decisões e autoridades", "Referências", sequência, cabeçalho, handoff e "Próximo passo". Nenhuma decisão humana, regra financeira, escopo ou fato de código foi alterado; os fatos conferidos nas Rodadas 1 e 2 continuam valendo.
- O novo `nao_informado` dos filtros é coerente com a P1: as situações de prazo gravadas continuam sendo `prazo`, `no_vencimento`, `sem_prazo_estimavel` e `nao_aplicavel`, com nulo = Não informado. A regra de erro para dados de prazo indevidos segue a mesma recusa de tuplas parciais que o plano já previa.
- G1 a G4 sem mudança em relação à Rodada 2.
- **Confirmações que a aprovação ainda precisa trazer** (precondição de "Aprovar plano" e "Registro de escolhas de produto"): opções de veículo e de indexador da P1, inclusive o rótulo "Sem indexador"; significado completo do prazo (P2); preservação dos quatro indicadores com agrupamento visual (P3). Não são achados da revisão: são decisões do responsável, que o plano já exige.
- **Limites desta conferência:** as respostas D7 a D9 foram dadas na conversa de correção, que este revisor não acessa. Confirmar que foram ditas pelo responsável é item manual do validador. Nenhum teste da aplicação ou do banco foi executado: o código ainda não existe.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 017 + revisar_plano + 017_plan/rodada-3 + v3`
- `effect_class`: `local_mutation`
- `state_before`: v3 Em Revisão, com o veredito da v3 pendente; Aguardando revisão (rodada 3); plano local sem commit.
- `state_after`: v3 Em Revisão, Rodada 3 concluída com `APTO PARA APROVAÇÃO`; revisão formal concluída; Aguardando aprovação do plano; aprovação humana pendente.
- `result`: `executed`
- `evidence`: conferência de R2-1 e R2-2 na v3, cabeçalho e "Próximo passo" atualizados. Gates documentais executados depois da gravação: validador de governança e `git diff --check`.
- `blockers`: nenhum achado. A aprovação humana precisa confirmar os itens pendentes de P1 (veículos e indexadores), P2 e P3, conforme a precondição do plano.

### Registro da manifestação de aprovação — 2026-10-30

Frase recebida após a Rodada 3: "aprovo o plano do ciclo 017". Falta confirmar expressamente os itens P1 (veículos e indexadores), P2 e P3, como exigem a precondição de aprovação e o parecer. As três perguntas foram apresentadas na conversa; publicação fica condicionada às respostas, preservando a manifestação recebida. Não houve alteração dos pareceres ou da especificação.

#### Handoff da correção v3 — histórico

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 017 + rascunhar_plano + 017_plan + v3`
- `effect_class`: `local_mutation`
- `state_before`: plano v2 Em Revisão, revisão formal concluída com APTO COM RESSALVAS na Rodada 2, Aguardando aprovação do plano; R2-1 e R2-2 como ressalvas. Blob do plano recebido `03e376a10582b21bfa3615aa6efe625ba58598ab`, sem commit; main local `337d8b83c809e9070391d7767df6eb8ed8b81271`. Correção solicitada expressamente em 2026-10-30; ideação e cycles já existentes.
- `state_after`: plano v3 Em Revisão, com veredito próprio pendente e Aguardando revisão (rodada 3). R2-1 e R2-2 respondidas pelo autor em seção própria; Não informado dos três filtros escalares explicitado, testes/aceite alinhados e referências/contexto atualizados. Pareceres anteriores, suas respostas e handoffs preservados. Somente este plano alterado nesta correção; sem aplicação, banco, issue, branch, commit, push ou PR.
- `result`: `executed`
- `evidence`: autorização da correção v3 no cabeçalho; P5, estratégia de testes e Item 3; Decisões e autoridades, Referências e resposta individual a R2-1/R2-2. Em 2026-10-30: `node --test scripts/validate-governance.test.mjs` passou (48/48); `node scripts/validate-governance.mjs` passou (0 erros, 0 avisos e 5 itens manuais); `git diff --check` passou; nenhuma linha com espaço final no plano. Comparação textual confirmou preservação integral das duas rodadas, resposta anterior e históricos; ideação mantém blob `dd6e8650458f46cbd3a24633c98b6367453b351a` e cycles mantém `23b3c91f9b903e8c72772e17cc5f1e218a151166`. Revisão manual de autorização, G3 e escopo concluída; nenhum teste de aplicação/banco executado nesta correção documental.
- `blockers`: nenhum para corrigir e encaminhar à Rodada 3. Veredito da v3, confirmações de P1/P2/P3 e aprovação humana posterior ainda pendentes; implementação não autorizada.

### Atualização por decisões do responsável — v4

- **Autor:** Codex (GPT-6).
- **Origem:** respostas expressas às confirmações de P1, P2 e P3, recebidas em 2026-10-30 após a manifestação de aprovação da v3.
- **Natureza:** atualização autorizada da especificação, sem emissão de parecer ou promoção do plano. As três rodadas anteriores, respostas e registros ficam preservados.

| Ponto | Atualização na v4 |
| :-- | :-- |
| P1 / D10 | Rótulos Prefixado (sem indexador) e BDR ou certificado de depósito; inclusão de Variação cambial e de INPC, este dentro da opção delegada pelo responsável. Códigos internos dos dois rótulos renomeados mantidos; códigos novos e testes alinhados. Sem indexador como rótulo genérico foi substituído pela descrição específica de prefixado, sem inferir enquadramentos |
| P2 / D11 | Prazo passa a cobrir resgate ou venda; a ajuda orienta registrar total manual em dias corridos, arredondado para cima, quando cotização e liquidação estiverem em unidades diferentes. Não se somam contagens de unidades diferentes, não se implementa calendário, soma, conversão ou arredondamento no sistema. Total desconhecido continua Não informado; input decimal continua recusado |
| P3 / D12 | Confirmado manter e agrupar os quatro indicadores com Sim, Não e Não informado, sem conversão ou perda do legado |

As respostas fecham as três perguntas de produto; a orientação de arredondamento vem do responsável. A mudança de conteúdo após o veredito da v3 será examinada na Rodada 4. Aprovação humana da versão modificada somente após veredito apto; nenhuma revisão foi realizada pelo autor nesta atualização.

#### Handoff da manifestação de aprovação v3 — histórico

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 017 + aprovar_plano + 017_plan + v3`
- `effect_class`: `local_mutation`
- `state_before`: plano v3 Em Revisão, Rodada 3 concluída com APTO PARA APROVAÇÃO, Aguardando aprovação do plano; confirmação expressa de P1 (veículos/indexadores), P2 e P3 ainda pendente conforme o plano e o parecer. Main local/remota em `337d8b83c809e9070391d7767df6eb8ed8b81271`; ideação, cycles e plano locais sem commit; sem branch/PR prévia `chore/cycle-017-plan`.
- `state_after`: manifestação humana de aprovação recebida após o veredito apto e registrada no cabeçalho, sem promoção do status nem publicação por falta das três confirmações específicas. Situação Parado, com perguntas explícitas apresentadas. Corpo da PR preparado em local ignorado; plano continua Em Revisão, com aprovação pós-revisão pendente de precondição, preservando o parecer apto. Nenhum código, banco, issue, branch, commit, push ou PR criado.
- `result`: `not_executed`
- `evidence`: frase humana nesta conversa e registro no cabeçalho; precondição de Aprovar plano e confirmações listadas na Rodada 3; três perguntas enviadas, sem resposta até esta saída. BL-015 presente em main; fila do backlog não alterada. Em 2026-10-30: 48/48 testes do validador passaram, validador com 0 erros/0 avisos e git diff --check passou; após o registro, validador e diff check passaram novamente. Corpo da PR em `local/cycle-017-plan-pr.md`, conferido como ignorado. Comparação textual confirmou preservação integral das três rodadas, respostas e históricos anteriores. Nenhum dado real ou segredo incluído.
- `blockers`: confirmações explícitas de P1 (veículos/indexadores), P2 e P3. A manifestação de aprovação já recebida permanece registrada para completar a promoção sem exigir nova frase de aprovação quando as precondições forem atendidas.

### Rodada 4

- **Data:** 2026-10-30.
- **Versão revisada:** v4; base `337d8b83c809e9070391d7767df6eb8ed8b81271`, com `_project/cycles.md`, ideação e plano ainda sem commit. Blobs inalterados: ideação `dd6e8650458f46cbd3a24633c98b6367453b351a` e `cycles.md` `23b3c91f9b903e8c72772e17cc5f1e218a151166`.
- **Autor:** Codex (GPT-6).
- **Revisor:** Claude Code (Claude Opus 5.5).
- **Veredito:** `APTO PARA APROVAÇÃO`.

#### Conferência das mudanças da v4

| Decisão | Onde aparece na v4 | Conferência |
| :-- | :-- | :-- |
| D10: rótulos e indexadores | P1 (tabela, regras de conjunto e significados), P4, linha "Catálogos/conjuntos" da estratégia, critério do Item 1 | "Prefixado (sem indexador)" e "BDR ou certificado de depósito" só trocam o rótulo. Os códigos `sem_indexador` e `certificado_representativo` ficam iguais, e `sem_indexador` continua exclusivo. `variacao_cambial` e `inpc` entram nas constraints e nos testes, sem benchmark, fonte externa, evento `cambio` ou preenchimento de Exposição cambial. A distinção entre Prefixado, Outro e Não se aplica está explicada com exemplos fictícios |
| D11: prazo | Objetivo, escopo, P1, P2 (definição e texto de ajuda literal), P4, G1, linha "Prazo" da estratégia, critério do Item 2, riscos | A definição passa a valer para resgate ou venda. A ajuda orienta registrar o total em dias corridos, arredondando para cima, quando as etapas tiverem unidades diferentes, e manter Não informado quando o total for desconhecido. O app não soma, não converte nem arredonda, e a entrada fracionária continua recusada. O prefixo interno `prazo_resgate_*` foi mantido e justificado. Os filtros continuam comparando só inteiros na mesma unidade (D8) |
| D12: indicadores | Escopo, P3 e riscos | Os quatro indicadores e seus três estados ficam preservados, com agrupamento visual e sem conversão; a P3 deixa de ser proposta. Variação cambial não substitui Exposição cambial |

Outras conferências:

- A manifestação "aprovo o plano do ciclo 017", dada sobre a v3, foi tratada corretamente. O promotor parou por faltarem as confirmações de P1, P2 e P3 e não publicou nada. A v4 registra que essa frase não aprova a versão modificada, no cabeçalho, no "Registro de escolhas de produto", em "Dependências e blockers" e na Revisão crítica. O handoff histórico da manifestação ainda diz que ela completaria a promoção "sem exigir nova frase", mas os registros posteriores da v4 prevalecem.
- A v4 foi feita a partir das respostas explícitas de ajuste que o responsável deu às perguntas de P1 e P2 (opção "Quero ajustar"), e não pela frase "corrija o plano do ciclo 017". Como a instrução foi humana, explícita e limitada a esses ajustes, considero a autorização material suficiente. O cabeçalho a registra.
- `INPC` foi incluído pelo autor dentro de uma opção que D10 registra como delegada. Por isso a aprovação humana desta versão confirma também essa inclusão.
- Rodadas 1 a 3, respostas do autor e handoffs anteriores preservados (conferidos pelos trechos de cada achado). Nenhuma mudança em escopo técnico, leitura, marca, RLS, decomposição ou pontos de aprovação além do descrito acima.

#### Achados

Nenhum. Os bloqueadores seguem em zero, e nenhum achado anterior reapareceu. É a quarta rodada, dentro do teto de cinco.

#### Itens atendidos e evidências

- G1: a orientação de dias corridos e de arredondamento é texto de ajuda para preenchimento manual, decidido pelo responsável. O sistema não executa nenhum cálculo de prazo, calendário ou conversão, e a barreira continua não aplicável. G2 a G4 sem mudança em relação às rodadas anteriores.
- G3: só exemplos fictícios. Nenhum dado de `local/` ou de produção foi lido nesta revisão. O corpo de PR citado em `local/cycle-017-plan-pr.md` não foi aberto.
- **Limites desta conferência:** as respostas D10 a D12 vieram de uma conversa que este revisor não acessa. Confirmar que foram ditas pelo responsável é item manual do validador. As fontes externas acrescentadas na v4 (IBGE e Portal do Investidor) não foram acessadas; servem só para terminologia. Nenhum teste da aplicação ou do banco foi executado: o código ainda não existe.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 017 + revisar_plano + 017_plan/rodada-4 + v4`
- `effect_class`: `local_mutation`
- `state_before`: v4 Em Revisão, com o veredito da v4 pendente; Aguardando revisão (rodada 4); manifestação de aprovação da v3 registrada como histórico; plano local sem commit.
- `state_after`: v4 Em Revisão, Rodada 4 concluída com `APTO PARA APROVAÇÃO`; revisão formal concluída; Aguardando aprovação do plano; é necessária manifestação humana nova, posterior a este veredito.
- `result`: `executed`
- `evidence`: conferência de D10 a D12 em cada seção afetada; preservação das rodadas anteriores; blobs da ideação e de `cycles.md` inalterados; cabeçalho e "Próximo passo" atualizados. Gates documentais executados depois da gravação: validador de governança e `git diff --check`.
- `blockers`: nenhum achado. Falta a aprovação humana da v4, que confirma também a inclusão de INPC delegada ao autor.

### Registro de aprovação da v4 — 2026-10-30

O responsável disse "aprovo o plano do ciclo 017" após o parecer APTO PARA APROVAÇÃO da Rodada 4. A aprovação vigente é posterior ao veredito da própria v4 e confirma sua especificação integral, inclusive D10 a D12 e INPC. Os ajustes de produto já estavam registrados e revisados; não se alterou a especificação para promover o plano.

A aprovação cobre a publicação documental segundo `_project/README.md`, com ideação, plano e registro do ciclo, e não autoriza merge ou implementação. As issues dependem da integração documental e da apresentação/confirmação dos payloads; cada unidade terá autorização própria de implementação. A manifestação anterior sobre a v3 permanece apenas no histórico.

#### Handoff da atualização v4 — histórico

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 017 + rascunhar_plano + 017_plan + v4`
- `effect_class`: `local_mutation`
- `state_before`: plano v3 Em Revisão, veredito APTO PARA APROVAÇÃO da Rodada 3, com manifestação de aprovação recebida e promoção Parada por confirmações de P1/P2/P3. Plano sem commit, blob de origem `8be6ba4cd1a984831c538e94062a0f4bbdd86617`; main local `337d8b83c809e9070391d7767df6eb8ed8b81271`. Respostas humanas agora recebidas ajustam P1/P2 e confirmam P3.
- `state_after`: plano v4 Em Revisão, com D10 a D12 incorporadas e Aguardando revisão (rodada 4). Rótulos e catálogo atualizados, INPC incluído dentro da opção delegada, prazo para resgate ou venda com ajuda de total manual em corridos/arredondado para cima, quatro indicadores preservados e agrupados. Veredito da v4 e aprovação pós-revisão pendentes. Nenhuma publicação, issue, branch, commit, código ou migração; ideação e cycles preservados.
- `result`: `executed`
- `evidence`: respostas explícitas do responsável na conversa; autorização da atualização no cabeçalho; D10/D11/D12, P1/P2/P3/P4, estratégia de testes, critérios dos Itens 1/2 e dependências alinhados. Fontes primárias de terminologia referidas; nenhuma conversão de prazo pelo sistema. Em 2026-10-30: 48/48 testes do validador passaram; `node scripts/validate-governance.mjs` passou com 0 erros, 0 avisos e 5 itens manuais; `git diff --check` passou; nenhuma linha com espaço final. Comparação textual confirmou preservação integral das três rodadas, respostas e registros anteriores; ideação/cycles mantêm os blobs `dd6e8650458f46cbd3a24633c98b6367453b351a` e `23b3c91f9b903e8c72772e17cc5f1e218a151166`. Revisão manual de autorização, G3 e escopo concluída; sem testes de aplicação/banco nesta atualização documental.
- `blockers`: nenhum para atualizar e encaminhar à Rodada 4; P1/P2/P3 estão respondidas. A v4 altera a especificação após o parecer da v3 e exige revisão e aprovação humana posteriores; manifestação anterior permanece histórica e não aprova antecipadamente esta versão.

### Rodada 5

- **Data:** 2026-10-30.
- **Versão revisada:** v5, somente as emendas E-1 e E-2 (D13 a D18), as anotações em D12, na tabela da P3, no cabeçalho, em Rastreabilidade e o handoff novo, além da reconciliação de `017_task_issue-174.md`. Base `main` = `origin/main` = `8cba4ac2dadc825057af777456530a9cbc66da6c`, com as entregas #172 a #174 integradas; branch local `chore/cycle-017-emendas`, plano (blob `91c65e3884f2f1c86b4aac48d9f7a19a1692441b` antes desta rodada) e task (blob `e3c1617656da0ae042be31588b572fd64f68a563`) sem commit.
- **Autor:** Claude Code (Claude Opus 5.5).
- **Revisor:** Claude Code (Claude Opus 5.5), em sessão separada, sem acesso à conversa em que D13 a D18 foram decididas.
- **Veredito:** `REQUER NOVA RODADA`.

#### Achados

| ID | Tipo | Achado e evidência | Correção necessária |
| :-- | :-- | :-- | :-- |
| R5-1 | Bloqueador | **A sequência de E-2 não fecha a janela de perda; ela a desloca.** (a) Entre a fase A e o deploy da tela nova, a aplicação em produção encontra `previdencia` em `veiculos_acesso`, código que ela não conhece. O formulário de edição só desenha caixas do catálogo (`src/components/formularios/detalhes-ativo.tsx:279-291`) e `alternarNoConjunto` filtra pelo catálogo (`src/lib/telas/detalhes-ativo.ts:288`); o código entra no estado inicial (`src/components/formularios/editar-ativo.tsx:73`), mas não é enviado. Salvar qualquer edição desse ativo grava o conjunto sem `previdencia`, e o indicador já foi anulado pela conversão: a anotação some sem erro. O "Ver detalhes" antigo também esconde o código, porque `conjuntoLegivel` filtra pelo catálogo antes de buscar o rótulo (`src/lib/telas/detalhes-ativo.ts:330-331`): `{previdencia}` vira texto vazio, e `{fundo, previdencia}` vira "Fundo". A afirmação "A aplicação em produção continua funcionando" (E-2, passo 1) vale para as assinaturas, não para os dados. (b) Entre o deploy da tela nova e a fase B, a tela envia `p_previdencia` nulo e `editar_ativo_com_nome` grava `previdencia = p_previdencia` sem condição (`supabase/migrations/20261027220000_metadados_nome_ativo.sql:79`, chamada por `editar_ativo_com_atributos` na `20261031000721`, linhas 218-219). Uma sobra "Sim" gravada pela tela antiga é apagada na primeira edição e não chega à fase B. O ensaio previsto ("uma sobra gravada pela função antiga entre as fases") não cobre esse caminho | Reordenar ou proteger a transição de modo que nenhuma tela grave por cima de uma informação que ela não mostra. Por exemplo, a fase A só amplia o catálogo, sem converter; a tela nova trata `previdencia = true` como "Previdência (PGBL ou VGBL)" já marcada no veículo (edição, resumo e filtro) até a fase B; e a fase B converte e congela a coluna. Outra forma aceitável precisa ter testes dos dois caminhos acima. A escolha muda a especificação de E-2 e precisa de revisão |
| R5-2 | Ressalva | **A fase B quebra chamadas e testes que ainda gravam o indicador, e a especificação não prevê isso.** Com `check (previdencia is null)`, toda chamada com `p_previdencia` não nulo, inclusive `false`, falha por violação de restrição (23514) em `cadastrar_ativo_taxonomia`, `editar_ativo_com_nome`, `editar_detalhes_ativo_taxonomia` e nas duas funções novas, que repassam o parâmetro (`20261031000721`, linhas 194-195 e 218-219). A suíte existente grava valores não nulos: `supabase/tests/database/12_atributos_ativos.test.sql:89-95` (`true`), `08_metadados_ativos.test.sql:93`, `:140` (`false, true, true, false`) e `:195`, além do e2e `tests/e2e/ativos-consulta.spec.ts:50` (`p_previdencia: true`) e `:193` (`/ativos?previdencia=sim`). Como a fase B vai na PR da tela, o CI de banco dessa PR falha se esses testes não mudarem. Testes não são migrações, então podem ser ajustados sem violar G4 | Declarar o comportamento esperado depois da fase B (recusa pelo banco, com teste, para funções antigas e novas; mensagem da aplicação, se houver) e listar o ajuste dos testes pgTAP e e2e que gravam ou filtram o indicador na mesma PR da migração. Considerar `lock table` antes da conversão da fase B, para que uma gravação concorrente não faça a validação da restrição falhar no meio da ação externa |
| R5-3 | Ressalva | **Os casos da conversão de D18 não estão enumerados.** A tabela é idempotente: depois da conversão, `previdencia` fica nula e a condição deixa de valer. Ela respeita a exclusividade de `nao_aplicavel`, que sai junto com `plano_contrato`, e preserva a forma canônica. O trânsito não é afetado, porque a restrição `ativos_transito_sem_detalhes_check` já exige `previdencia` nula (`20261031000721`, linhas 126-131). Mas o texto dos testes cita só as três linhas da tabela. Não diz que os ativos desativados são convertidos (a restrição da fase B exige isso) nem cobre a combinação com outro veículo (`{fundo, plano_contrato}` vira `{fundo, previdencia}`), com `{nao_aplicavel}`, com conjunto vazio e a reexecução sobre um conjunto que já tenha `previdencia` | Enumerar esses casos nos testes e no ensaio, com ativo desativado, e pôr a guarda de forma canônica depois da conversão, junto com a conferência de que não restou nenhum `previdencia = true` |
| R5-4 | Ressalva | **Trechos normativos superados por D13 a D18 continuam sem anotação, e alguns contradizem a emenda.** A emenda anotou D12 e a célula da P3, mas não: o parágrafo da P3 "Nenhuma equivalência de conversão será aplicada..." (linha 155); Escopo, "Preservação dos quatro indicadores" (linha 69); Riscos, "não preencher novos campos por equivalência, não apagar dados" (linha 397); P5, "estados exclusivos da P1 mantêm a exclusividade nos filtros" (linha 170, alterada por D16) e "Informar separadamente quantidade de resultados na aba corrente" (linha 175, retirada por D15); P6, checkboxes em `fieldset` e "Sem novo componente complexo de multiselect" (linha 195, D14), e a frase de D9 no resumo (linha 201, D17); critérios do Item 2 (linha 340, agrupamento) e do Item 3 (linha 353, "filtros ativos e Limpar são visíveis com painel fechado"; D15 deixa só um contador). Os dois critérios ainda valem para a #174, que fica aberta até a verificação, e o corpo da issue no GitHub mantém o texto antigo. Também ficaram desatualizados o cabeçalho "Aprovação humana pós-revisão" (que se refere à v4), a abertura de "Revisão crítica" ("Concluída. As quatro rodadas..."), "Dependências e blockers" ("Para aprovação: atendido"), "Sequência recomendada" e o bloco "Próximo passo" da task da #174, já `Concluída`, que repete a situação do ciclo e vai envelhecer. A task adia a conferência dos checks, mas eles podem ser verificados agora: a PR #178 e o commit `8cba4ac` em `main` têm todos os checks com sucesso (conferido por `gh` nesta revisão) | Anotar no lugar cada trecho substituído, como fez com D12 e a P3 e como no precedente do ciclo `010` ("anotados no lugar"). Dizer quais critérios da #174 são substituídos por D15/D18 e como o encerramento os verifica. Registrar a evidência dos checks na task |
| R5-5 | Ressalva | **E-1 deixa lacunas de especificação na tela.** (a) Âncora: o GET preserva o fragmento da `action` (só a consulta é substituída) e `#ativos-da-aba` existe (`src/app/(app)/ativos/page.tsx:270`), então a página volta posicionada nos resultados. Com erro de filtro, porém, a seção fica vazia (`page.tsx:232-236`) e o painel abre acima da âncora; no celular, a página pode rolar para além da mensagem de erro, hoje um `role="alert"` fora da seção (`src/components/ativos-consulta.tsx:168-171`). (b) A lista suspensa é viável sem JavaScript, e as caixas dentro de um `<details>` fechado continuam sendo enviadas. Falta dizer se o `legend` fica fora do `<details>`, para o nome do campo continuar visível com a lista fechada; qual é o nome acessível do `summary` (ex.: "Veículo de acesso: Fundo, ETF"); que, sem JavaScript, o texto do `summary` só mostra o estado carregado; e, se "fechar ao clicar fora" for implementado, que Escape também feche e o foco volte ao `summary`. (c) O contador de D15 não define se conta atributos filtrados ou opções marcadas (dois veículos contam 1 ou 2). (d) "Opções em uso" é determinístico: a união dos códigos dos ativos comuns das duas abas, mais "Não informado" e as opções marcadas na URL. Falta só fixar a ordem de catálogo | Fixar (a) onde o erro aparece em relação à âncora; (b) a estrutura e os nomes acessíveis; (c) a regra do contador; (d) a ordem |
| R5-6 | Ressalva | **A decomposição deixa ambíguas a ação externa da fase B e a branch documental.** A issue de banco "fica aberta até a fase B", mas a migração da fase B vai na PR da issue de tela, e a tabela não diz em qual issue a frase "concluí a ação externa da issue #N" da fase B é dita, nem qual roteiro da KB-002 é usado. A branch `chore/cycle-017-emendas` não está na lista fechada de nomes documentais (`_project/README.md`, seção "Branches, commits e migrações": `chore/cycle-NNN-ideation`, `-plan` ou `-closure`) e não há justificativa registrada | Atribuir a fase B a uma issue (migração, roteiro, ação externa e fechamento) e justificar ou ajustar o nome da branch |
| R5-7 | Ressalva | **A governança não tem a transição usada.** Emendar um plano `Em Execução`, com issues e migrações novas, não está entre as transições canônicas (`_project/README.md`, "Transições canônicas do plano": "Transições não listadas exigem decisão explícita e correção da governança"). A entrada de `revisar_plano` pede plano `Rascunho` ou `Em Revisão` ainda não aprovado. O validador exige veredito apto no cabeçalho de um plano `Em Execução` com "Aprovada em" (`scripts/validate-governance.mjs:436-447`), por isso o veredito desta rodada fica registrado depois do da Rodada 4. E esta é a quinta rodada, o teto (`maxReviewRounds: 5`). A frase de autorização da emenda é humana e explícita, e esta revisão foi feita por instrução expressa. Ainda assim, o caminho para revisar e aprovar uma v6 não existe sem decisão do responsável | Ver "Pergunta ao responsável" |

Os achados anteriores (R1 a R4) não reapareceram: as emendas são escopo novo, posterior à aprovação da v4. A regra de progresso não pode ser aplicada porque não haverá Rodada 6.

#### Itens atendidos e evidências

- **Pergunta 1 (catálogo):** inserir `previdencia` entre `etf` e `plano_contrato` mantém canônicos todos os conjuntos gravados. `private.canonizar_conjunto` ordena pela posição no catálogo e só recusa código fora dele ou exclusivo combinado (`20261031000721`, linhas 14-43), e a ordem relativa dos códigos atuais não muda. O PostgreSQL não revalida `ativos_veiculos_acesso_check` (linhas 118-119) quando a função é redefinida, então a conferência explícita na migração é o mecanismo certo e basta, desde que rode também depois da conversão (R5-3). Nenhum índice ou outra restrição usa a função. Os gatilhos de marca não observam `veiculos_acesso` nem `previdencia` (`20261027220000`, linha 24; `20261026204955`, linha 154), então a conversão não altera a marca, e o retrato integral do ensaio pode exigir igualdade também em `profiles`.
- **Pergunta 2 (conversão):** idempotente, respeita a exclusividade, mantém a forma canônica e não toca o trânsito (ver R5-3 para os casos que faltam enumerar). A remoção de `plano_contrato` mesmo junto de outro veículo é regra da tabela que o responsável confirmou ("Está certa a tabela"); não é inferência do autor.
- **Pergunta 3 (duas fases):** ver R5-1 e R5-2.
- **Pergunta 5 (D16 no filtro):** é coerente com OU dentro do atributo. Hoje `conjunto` trata como exclusivos, além de `nao_informado`, os códigos exclusivos do catálogo (`src/lib/telas/filtros-ativos.ts:79-87`, linha 83). A tela nova precisa passar só `nao_informado` como exclusivo. O parâmetro `previdencia` de uma URL antiga é ignorado, como já acontece com qualquer nome desconhecido (`lerFiltros` só lê nomes conhecidos, linhas 111-128). Falta só a anotação na P5 (R5-4).
- **Pergunta 7 (preservação):** pelo `git diff`, o autor alterou só o cabeçalho (versão, campo Emendas e os campos de revisão), a origem de D12, a célula Previdência da P3, a linha de PRs em Rastreabilidade (#178 integrada), o bloco "Próximo passo" e o handoff novo. O handoff anterior foi preservado sob "Histórico — handoff anterior", e a seção das emendas é acréscimo. Rodadas 1 a 4, respostas, registros de aprovação e handoffs históricos estão intactos. Na task, mudaram estado, integração, a linha de checks remotos, o "Registro da integração e das emendas", o bloco e uma linha de reconciliação no handoff.
- **Estado externo conferido por `gh`:** PR #178 `MERGED` em `8cba4ac2dadc825057af777456530a9cbc66da6c`; #172 e #174 abertas; PR #176 (release 0.13.0) aberta; nenhuma outra PR aberta.
- **Barreiras:** G1 não se aplica, porque nenhuma regra financeira lê `previdencia` ou `veiculos_acesso` (KB-004, seção 4.1; os únicos usos em `src/lib/telas/analises-inicio.test.ts` e nos e2e do Início são fixtures com valor nulo). G2 está declarada para a conversão em massa e as funções. G3: somente exemplos fictícios. G4: duas migrações novas, sem editar a `20261031000721`.
- **Limites desta conferência:** as decisões D13 a D18, as frases citadas na emenda e o relato de que o responsável integrou a PR #178 sem a frase no chat vêm de uma conversa a que este revisor não teve acesso. Confirmar que foram ditas é item manual. Nada em `local/` foi lido. O comportamento do navegador com a âncora e com `<details>` foi avaliado pela especificação do HTML, sem executar a aplicação. Nenhum teste de aplicação ou de banco foi executado, porque não há código novo. O revisor e o autor usam o mesmo modelo, e só a sessão é separada.

#### Pergunta ao responsável

R5-1 é bloqueador e não pode haver Rodada 6 (R5-7). Como você quer seguir com as emendas E-1 e E-2? Alternativas sem recomendação de regra financeira, porque nenhuma está envolvida:

- **(a) Ciclo novo.** Levar as emendas a um ciclo novo de nível completo, com D13 a D18 e os achados R5-1 a R5-7 como insumo e revisão formal própria. O 017 segue para a verificação em produção e o encerramento com a tela já entregue e o roteiro VA atual da KB-002.
- **(b) Outra via de governança definida por você**, por exemplo mudar a regra de emendas ou o teto de rodadas. Mudar as regras de governança é, por si só, trabalho de ciclo completo.

Enquanto não houver resposta, nenhuma issue, PR, migração ou alteração de tela das emendas está autorizada. A v4 aprovada continua valendo para o que já foi entregue.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 017 + revisar_plano + 017_plan/rodada-5 + v5`
- `effect_class`: `local_mutation`
- `state_before`: plano v5 `Em Execução` (v4 aprovada e entregue); emendas E-1 e E-2 registradas sem commit na branch `chore/cycle-017-emendas`; Aguardando revisão (rodada 5).
- `state_after`: Rodada 5 registrada com `REQUER NOVA RODADA` (um bloqueador, seis ressalvas); campos "Revisão formal" e "Veredito da revisão" atualizados; teto de rodadas atingido; situação Parado, com a pergunta registrada acima. Nenhuma outra parte do plano, da task ou do código foi alterada; nenhum commit, push, issue ou PR.
- `result`: `executed`
- `evidence`: inspeção somente leitura da migração `20261031000721`, da `20261027220000`, de `detalhes-ativo.ts`, `filtros-ativos.ts`, `detalhes-ativo.tsx`, `editar-ativo.tsx`, `ativos-consulta.tsx`, `page.tsx`, dos testes pgTAP 08 e 12, do e2e `ativos-consulta.spec.ts`, da KB-002 (VA5/VA6), da KB-003, da KB-004 e do DESIGN.md 6.7, 6.8 e 6.12; `gh` para as PRs #178 e #176, as issues abertas e os checks de `8cba4ac`; `git diff` do plano e da task. Gates depois da gravação, em 2026-10-30: `node --test scripts/validate-governance.test.mjs` com 48/48; `node scripts/validate-governance.mjs` com 0 erros, 0 avisos e 5 itens manuais; `git diff --check` sem saída (passou).
- `blockers`: R5-1 (bloqueador) e a decisão do responsável sobre a via de continuidade (R5-7), registrada em "Pergunta ao responsável".

### Decisão do responsável após a Rodada 5 — 2026-10-30

À pergunta registrada na Rodada 5, o responsável escolheu a alternativa (a) e respondeu: "Sim, ciclo 018". Efeitos:

- As emendas E-1 e E-2 **não são adotadas no ciclo 017**. A seção "Emendas E-1 e E-2" e a Rodada 5 ficam como registro histórico da proposta e do parecer. A v4 aprovada continua sendo o escopo do 017, já entregue nas PRs #175, #177 e #178; os trechos da v4 que as emendas substituiriam (P3, P5, P6, Escopo, Riscos e os critérios dos Itens 2 e 3) continuam valendo para o 017, e por isso não foram anotados como substituídos.
- O ciclo 017 segue para a verificação em produção com o roteiro VA1 a VA8 da KB-002, que descreve a tela entregue, depois para a release 0.13.0 (PR #176) e o encerramento prospectivo, cada um com aprovação própria.
- O trabalho das emendas vai para o **ciclo 018**, de nível completo, que começa pela triagem e pela própria frase de entrada, com ideação, plano e revisão formal próprios. Insumos registrados para a ideação: D13 a D18 (decididas pelo responsável nesta conversa), os achados R5-1 a R5-7 e duas formas de fechar R5-1 a avaliar lá: (1) a do revisor, em que a fase A só amplia o catálogo, a tela nova trata `previdencia = true` como "Previdência (PGBL ou VGBL)" já marcada no veículo até a fase B, e a fase B converte e congela a coluna; (2) a do autor, depois do parecer, em que a tela nova vai primeiro, já conhece o código `previdencia`, esconde o indicador e devolve à função o valor gravado sem alterá-lo, e uma migração única, aplicada depois do deploy, amplia o catálogo, converte pela tabela de D18 e congela a coluna. Nenhuma das duas está decidida.
- Correção registrada pelo autor: na conversa, ele disse que o "Ver detalhes" atual daria erro com o código novo; o parecer está certo, o código é escondido em silêncio (`conjuntoLegivel` filtra pelo catálogo antes do rótulo). O bloqueador R5-1 continua o mesmo.
- R5-6: a branch local passou de `chore/cycle-017-emendas` a `chore/cycle-017-closure`, o nome previsto, e estes registros seguem na PR de encerramento.
- R5-4, checks da #178: conferidos por `gh pr checks 178` em 2026-10-30, todos com sucesso (governança; lint, tipos, testes, build e e2e de preview; Supabase local, testes de banco e e2e autenticado; Vercel).

## Pós-mortem

- **Data de conclusão:** 2026-10-31, prospectiva até o merge da PR de encerramento.
- **Entregas e evidências:** v4 aprovada entregue pelas PRs #175, #177 e #178; ação externa da #172 relatada em 2026-10-30; VA1 a VA8 relatados como "todos passaram"; release v0.13.0 publicada em 2026-10-31 às 04:02:15 UTC pela PR #176. Detalhes e gates em `017_task_closure.md`.
- **Desvios:** as emendas E-1/E-2 da v5 não foram adotadas depois do parecer da Rodada 5 e seguem em ciclo próprio por decisão humana; o encerramento abrange a v4 aprovada. Nenhuma migração ou conversão dessas emendas foi executada.
- **Lições comprovadas:** na revisão da compatibilidade de catálogos, além da assinatura da RPC, conferir se a aplicação anterior exibe e devolve os códigos ao salvar; a inspeção da Rodada 5 comprovou o descarte de códigos desconhecidos no fluxo proposto. Não houve perda de dados em produção verificada ou relatada.
