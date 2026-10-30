# Ideação — 017: Atributos complementares dos ativos

> **Ciclo:** `017`
> **Estado:** `Ideação`
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 017" em 2026-10-30
> **Criado em:** 2026-10-30
> **Última atualização:** 2026-10-30
> **handoff_schema_version:** `2`

## Problema

A classe do ativo identifica sua exposição econômica, mas não registra de forma padronizada cinco características independentes dela: veículo de acesso, indexador da remuneração, regime tributário, liquidez estimada e cobertura do FGC. O BL-015 guarda essa necessidade desde a decisão D11 do ciclo `013`.

O produto já oferece quatro indicadores descritivos — previdência, liquidez imediata, exposição cambial e isenção de IR. Acrescentar campos sem decidir a relação com esses indicadores pode duplicar informações, criar contradições e alongar o cadastro no celular. A exploração precisa definir o significado dos atributos, a maneira de preenchê-los e como consultá-los.

## Origem no backlog

| ID | Síntese da necessidade | Parcela selecionada |
| :-- | :-- | :-- |
| BL-015 — Atributos complementares de classificação do ativo além da classe | Registrar e consultar veículo de acesso, indexador da remuneração, regime tributário, liquidez estimada e cobertura do FGC, separados da classe e sem tornar o cadastro no celular mais longo | Integral: os cinco atributos e a decisão sobre sua relação com os quatro indicadores existentes. Sem agrupamento com outros IDs; nenhuma parcela deixada para outro destino nesta seleção |

Referência de origem: `_project/backlog.md` da fila canônica `chore/backlog`, commit `e3d32d981c6f311d0d9dba192af552f29368347b`, no worktree externo registrado `C:/Programas/saldo-futuro-backlog`, com o mesmo Git comum do checkout principal. Fila limpa; conteúdo do backlog idêntico ao de `main` em `337d8b83c809e9070391d7767df6eb8ed8b81271`, conferida no GitHub. O item está `Disponível`, sem encaminhamentos; seu conteúdo já está publicado, sem parcela local pendente.

Destino em preparação: ciclo `017`. Esta reserva não encaminha nem altera o item. O retorno `ciclo 017` será registrado na fila somente após comprovação da integração do destino em `main`, pela autorização da seleção original; sua publicação depende de autorização separada. O snapshot acima deve ser preservado mesmo se o backlog mudar.

## Contexto e evidências

### Fatos observados

1. A triagem propôs ciclo completo por capacidade nova e mudança de significado do schema, com G2. O responsável confirmou o nível e autorizou somente a ideação em 2026-10-30. Modo contínuo não é permitido no nível completo.
2. A ideação do ciclo `013` distingue exposição econômica de veículo, regime e indexador (D1), e deixou os cinco atributos para o BL-015 (D11). A ampliação do ciclo `014` preservou essa separação. Referências: `_project/ideations/013_taxonomia_classes_alocacao.md` e KB-003, seção da taxonomia.
3. `public.ativos` guarda `previdencia`, `liquidez_imediata`, `exposicao_cambial` e `isento_ir` como booleanos opcionais. Nulo significa não informado. O ativo de sistema Em trânsito não recebe esses detalhes. Referência: `supabase/migrations/20261024000829_metadados_ativos.sql`.
4. Os quatro indicadores ficam em "Mais detalhes"; o bloco fecha quando vazio e abre quando algum indicador está preenchido. Os rótulos incluem "Liquidez imediata (reserva)" e "Isento de IR". Referências: `src/components/formularios/detalhes-ativo.tsx`, `src/lib/telas/detalhes-ativo.ts` e DESIGN.md 6.8.
5. Cadastro e edição compartilham os campos descritivos. A edição corrente envia nome e detalhes numa transação por `editar_ativo_com_nome`. A edição aceita ativo desativado e recusa o trânsito. Referências: `src/components/formularios/editar-ativo.tsx`, `supabase/migrations/20261027220000_metadados_nome_ativo.sql` e funções da taxonomia.
6. A lista de ativos mostra classe e instituição; os indicadores são consultados no formulário de edição. Não há filtros pelos cinco atributos propostos. Referência: `src/app/(app)/ativos/page.tsx`.
7. A versão de metadados existente cobre nome, instituição e classe; não cobre os quatro indicadores. Qualquer nova composição de leituras precisa examinar o que efetivamente consome, sem presumir que a marca já cobre todos os detalhes. Referência: `supabase/migrations/20261027220000_metadados_nome_ativo.sql`.
8. A KB-004, 4.1, trata os indicadores como anotações sem efeito fiscal ou de cálculo. A regra financeira e a política de isolamento são autoridades a preservar, respectivamente na KB-004 e na ADR-003.

### Limites da evidência

Não foram consultados dados reais, produção nem fontes externas sobre regras tributárias, prazos ou garantias. Esta ideação não afirma elegibilidade de produtos, alíquotas, limites do FGC ou equivalências fiscais. Se o catálogo ou os textos futuros fizerem afirmações desse tipo, deverão ser verificados em fontes primárias vigentes e submetidos ao responsável antes de virar especificação.

Não há plano, issue nem autorização de implementação para o ciclo `017`. A autorização inicial cobre a ideação; as respostas posteriores do responsável confirmam somente as decisões D1 a D3 registradas abaixo.

## Resultado desejado

- Permitir que o usuário descreva e consulte os cinco atributos com termos consistentes, independentemente da classe escolhida.
- Manter rápido o cadastro básico no celular, com os detalhes opcionais acessíveis quando necessários.
- Distinguir ausência de informação de uma resposta negativa ou de um atributo que não se aplica.
- Evitar duas fontes editáveis para o mesmo significado e preservar o conteúdo já informado nos indicadores existentes.
- Definir uma representação simples e um caminho de atualização compatível com o isolamento e com a aplicação durante o deploy.

## Hipóteses

Situação após as respostas do responsável em 2026-10-30: H1 confirmada como direção de produto (D1); H4 confirmada como método de análise, sem decidir a conversão de cada indicador (D2); H5 descartada como recorte suficiente, pois a consulta incluirá também filtros (D3). As demais hipóteses continuam em validação.

| ID | Hipótese | Como conferir |
| :-- | :-- | :-- |
| H1 | Os cinco atributos podem começar como informações opcionais, manuais e descritivas, sem produzir cálculo financeiro ou enquadramento automático | Confirmada pela resposta à Q1 (D1); exemplos fictícios de preenchimento ainda serão definidos |
| H2 | Um conjunto pequeno de opções padronizadas por atributo atende melhor à consulta do que texto livre | Curar o vocabulário com o responsável e testar casos ambíguos e ausentes |
| H3 | "Mais detalhes" pode receber os atributos sem alongar o fluxo básico | Conferir o fluxo vazio e preenchido no celular; definir agrupamento e ordem antes do plano |
| H4 | Vale revisar sobreposições antes de decidir se os quatro indicadores serão preservados, substituídos ou apresentados como informação derivada | Direção confirmada pela Q2 (D2); matriz explícita de significado e preservação do legado ainda pendente |
| H5 | Edição e um resumo de detalhes podem bastar para a primeira consulta | Descartada como recorte suficiente pela Q3 (D3): a entrega deve incluir também filtros na lista de Ativos |
| H6 | A existência de uma classe não basta para inferir os novos atributos ou preencher o legado | Decidir origem e preenchimento por atributo; não executar inferência sem regra aprovada |

## Alternativas

### Natureza e padronização dos atributos

| Alternativa | Benefício | Custo ou limite | Posição inicial |
| :-- | :-- | :-- | :-- |
| A — Campos descritivos com opções padronizadas | Consulta consistente e validação direta, sem transformar o cadastro em motor de regras | Exige definir opções, manutenção e tratamento do que fica fora do catálogo | Recomendada para explorar |
| B — Texto livre por atributo | Acomoda casos ainda desconhecidos | Grafias e significados divergem; dificulta consulta padronizada | Não recomendada como representação principal |
| C — Atributos inferidos ou usados em cálculos | Reduz preenchimento em casos com regra inequívoca | Exige novas regras, fontes e validações; pode mudar o enquadramento G1 | Não selecionada: D1 confirmou informações manuais e descritivas |

As alternativas não fixam enum, tabela de catálogo, JSON ou assinatura de RPC. Essa escolha técnica pertence ao plano após a definição dos significados.

### Relação com os indicadores existentes

- **Preservar os quatro e acrescentar os cinco:** reduz mudança no legado, mas só é adequado se os significados forem independentes ou se a interface deixar a distinção clara.
- **Consolidar os que forem equivalentes:** pode reduzir campos e contradições, mas exige provar a equivalência e preservar sim, não e não informado durante a transição.
- **Manter legado durante uma transição e depois retirar a duplicação:** permite compatibilidade com versões anteriores, ao custo de uma etapa adicional. Não autoriza apagar informação nem inventar uma conversão.

Direção confirmada em D2: primeiro comparar os significados e consolidar quando fizer sentido. "Liquidez imediata (reserva)" pode envolver uma intenção de uso diferente de prazo de liquidez; "Isento de IR" e regime tributário também precisam de definição antes de qualquer equivalência. Nenhuma substituição específica foi decidida.

### Consulta

- **Edição e resumo dos detalhes:** selecionados em D3, com resumo expansível na página Ativos e campos em "Mais detalhes" no cadastro e na edição.
- **Também filtros na lista:** selecionados em D3, em área recolhível abaixo das abas e antes da lista. Combinações, opções ausentes e comportamento entre as abas ainda serão definidos.
- **Análises patrimoniais pelos atributos:** implicam regras de agrupamento e participação e ampliam o recorte; não estão propostas para esta entrega.

### Decisões confirmadas pelo responsável em 2026-10-30

As respostas vieram do formulário de perguntas da conversa. Na Q3, o responsável pediu incorporar a solução esclarecida no chat; os detalhes abaixo sintetizam essa discussão, sem transcrever a conversa.

| ID | Tema | Decisão |
| :-- | :-- | :-- |
| D1 | Natureza dos atributos (Q1) | Informações opcionais, preenchidas manualmente e descritivas. Sem cálculo automático de imposto, liquidez ou garantia |
| D2 | Indicadores existentes (Q2) | Rever sobreposições e consolidar quando fizer sentido. Comparar significados e preservar informações existentes antes de propor uma substituição; não há conversão ou retirada específica aprovada |
| D3 | Consulta e preenchimento (Q3) | Combinar resumo por ativo, filtros na lista e edição, conforme a organização abaixo; atenção explícita à densidade no celular |

Organização de interface adotada como direção da ideação em D3, ainda sujeita à validação visual e de interação no planejamento:

1. **Resumo na página Ativos (`/ativos`):** acesso "Ver detalhes" abaixo das informações principais de cada item. Ao abrir, os atributos aparecem abaixo do item, em expansão vertical, permitindo consultar sem entrar na edição. A linha principal não recebe os cinco atributos de uma vez; o resumo começa recolhido.
2. **Filtros na página Ativos:** controle "Filtrar" abaixo das abas Em uso e Desativados, antes da lista. No celular, abre uma área recolhível para escolher os filtros. A lista passa a mostrar os ativos correspondentes, com indicação dos filtros ativos e ação de limpar. Os filtros usam os atributos preenchidos pelo usuário, sem inferir características. A lógica de combinação, o tratamento de não informado e a persistência entre abas continuam em aberto.
3. **Cadastro e edição:** campos na seção recolhível "Mais detalhes" das telas Novo ativo e Editar ativo, aproveitando o padrão existente. O agrupamento e a ordem dos campos dependem da comparação de significados. O estado vazio/preenchido segue o contrato atual de abertura de DESIGN.md 6.8, a validar na composição final.

Resumo, filtros e formulário têm funções diferentes: consultar um ativo, localizar um conjunto e alterar dados. A seleção das três superfícies não autoriza implementação nem define campos adicionais além dos selecionados no BL-015.

## Riscos e restrições

| Tema | Risco ou dependência | Tratamento proposto |
| :-- | :-- | :-- |
| Significado | Veículo do ativo cadastrado e instrumento da carteira subjacente podem ser confundidos | Definir o objeto descrito e usar exemplos fictícios antes de fechar opções |
| Remuneração | "Indexador" pode ser entendido como fórmula, percentual contratado ou benchmark | Delimitar o campo; não acrescentar taxa, spread ou cálculo por inferência |
| Tributação e FGC | Um rótulo pode ser interpretado como validação jurídica ou garantia calculada | Definir o significado da anotação; qualquer afirmação normativa exige fonte primária vigente |
| Liquidez | Um único rótulo pode misturar carência, prazo de cotização, liquidação ou intenção de reserva | Escolher o conceito e a unidade antes da modelagem; não calcular disponibilidade |
| Legado | Conversão automática pode apagar ou distorcer indicadores | Aprovar matriz de conversão; deixar indeterminado o que não tiver equivalência comprovada |
| Mobile | Nove campos separados podem tornar "Mais detalhes" longo ou repetitivo | Rever sobreposições, agrupar e validar consulta e preenchimento com o DESIGN.md |
| G1 | O uso em cálculo deixaria de ser somente descritivo | Não se aplica ao recorte proposto; reavaliar antes do plano se houver cálculo ou análise agregada |
| G2 | Novos dados e funções podem expor ou alterar carteira alheia | Manter escrita autenticada, verificação de dono e testes com dois usuários e admin, sem bypass |
| G3 | Exemplos ou preenchimento do legado podem expor dados reais | Documentação e testes só com dados fictícios; nenhum dado real lido nesta ideação |
| G4 e deploy | Alterar assinaturas ou remover campos pode quebrar a aplicação anterior | Somente migrações novas; planejar compatibilidade, ordem de deploy e ação externa do responsável |
| Coerência | Filtros ou resumos podem combinar leituras incompatíveis | Examinar os leitores efetivos no plano; não ampliar a marca de metadados sem necessidade demonstrada |

Critérios de descarte: rejeitar uma alternativa que dependa de inferência sem regra aprovada, perca informação do legado, confunda anotação com cálculo, viole isolamento ou exija detalhes obrigatórios para o cadastro básico. Atributo sem significado suficientemente claro deve continuar em discussão, com eventual redução da parcela selecionada decidida pelo responsável.

## Perguntas em aberto

### Direção inicial respondida pelo responsável em 2026-10-30

| ID | Pergunta | Resposta confirmada |
| :-- | :-- | :-- |
| Q1 | Como os cinco atributos devem funcionar: informações manuais e descritivas ou algum comportamento automático a discutir? | Opcionais, manuais e descritivos, sem cálculo de imposto, liquidez ou garantia |
| Q2 | Preservar os quatro indicadores e acrescentar campos ou rever sobreposições e consolidar quando houver equivalência? | Rever sobreposições e consolidar quando fizer sentido, sem decidir ainda cada substituição (D2) |
| Q3 | Onde consultar nesta entrega: edição e resumo de detalhes ou também filtros na lista de ativos? | Ambas as opções, incorporando o que foi esclarecido no chat: resumo expansível na página Ativos, filtros recolhíveis na mesma página e "Mais detalhes" no cadastro e na edição (D3) |

Q1 a Q3 estão respondidas. As respostas confirmam a direção; não definem automaticamente o vocabulário, o significado ou a conversão de cada campo. A validação visual permanece necessária para conferir a densidade no mobile.

### Definições necessárias após a direção inicial

1. **Veículo de acesso:** qual é a fronteira do atributo e quais opções distinguem formas de acesso sem repetir a classe? Há uma ou mais opções por ativo?
2. **Indexador da remuneração:** o campo registra só uma referência ou precisa distinguir estruturas de remuneração? Como representar não aplicável e desconhecido, sem incluir taxa contratada por inferência?
3. **Regime tributário:** o atributo se refere a qual aspecto e a qual contexto? Quais opções podem ser definidas com clareza sem criar um motor fiscal? Como se relaciona com `isento_ir` e `previdencia`?
4. **Liquidez estimada:** registrar faixa ou prazo? De qual evento até qual disponibilidade, em qual unidade? Como separar essa informação de reserva e liquidez imediata?
5. **FGC:** qual informação o usuário declara, quais estados devem existir e qual texto explica o alcance dessa anotação sem calcular proteção?
6. **Estados e catálogo:** quais atributos admitem não aplicável, não informado e outro? Quem mantém as opções? Existe necessidade real de personalização ou seleção múltipla?
7. **Legado e consulta:** quais campos antigos permanecem e qual mapeamento é inequívoco? Como os filtros combinam atributos, tratam campos não informados e se comportam na troca de abas? A atualização descritiva vale como informação atual, sem histórico, ou há necessidade temporal a discutir? A localização do resumo está definida em D3.

## Fora do escopo

No recorte descritivo confirmado por D1 a D3:

- Mudar a árvore de classes, marcar nós descontinuados ou comparar com alocação-alvo.
- Calcular imposto, retenção, cobertura monetária do FGC, limite por emissor ou prazo efetivo de resgate.
- Contratar taxas, spreads ou vencimentos como novos campos por inferência a partir de "indexador" ou "liquidez".
- Consultar provedores externos, importar informações automaticamente ou preencher a carteira real.
- Criar novas visões de distribuição, rentabilidade ou análise patrimonial por atributo.
- Remover tabelas legadas da taxonomia, alterar lançamentos, fechamento ou tipo de ajuste.
- Implementar, criar issues ou publicar esta ideação sem a autorização correspondente.

## Critérios para iniciar o planejamento

1. Direção inicial atendida por D1 a D3: Q1 a Q3 respondidas e consulta delimitada em resumo, filtros e edição. Definir as regras de combinação, ausência de informação e troca de abas dos filtros antes de fechar os critérios de aceite.
2. Definir o significado, as opções iniciais, a cardinalidade e os estados ausentes de cada atributo selecionado.
3. Decidir a relação com cada indicador atual e uma política de preservação e preenchimento do legado, sem equivalências presumidas.
4. Preservar o recorte manual e descritivo confirmado em D1. Se surgir proposta de cálculo, submetê-la ao responsável e identificar as decisões G1 necessárias antes de incluí-la.
5. Validar a proposta de organização no celular e a forma de consulta, à luz do DESIGN.md.
6. Identificar a estratégia de persistência, isolamento e compatibilidade que o plano precisará detalhar, com G2, G3 e G4.
7. Receber a frase "autorizo o rascunho do plano do ciclo 017" após o exame das perguntas e decisões. Esta ideação não é plano executável.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Ideação registrada — ciclo 017 (completo)
Quem: Responsável
Conferir: Decisões D1 a D3 e definições restantes em [017_atributos_complementares_ativos.md](_project/ideations/017_atributos_complementares_ativos.md#perguntas-em-aberto); definir opções por atributo, relação com os indicadores e regras dos filtros
Diga: "autorizo o rascunho do plano do ciclo 017"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 017 + idear + atributos_complementares_ativos + 337d8b83c809e9070391d7767df6eb8ed8b81271`
- `effect_class`: `local_mutation`
- `state_before`: checkout principal em `main`, HEAD `337d8b83c809e9070391d7767df6eb8ed8b81271`; ideação `017` já criada localmente e ainda não versionada; `_project/cycles.md` já modificado pela reserva como Ideação, próximo ciclo `018`. O handoff anterior registrava a criação e Q1 a Q3 sem resposta. Respostas explícitas recebidas nesta conversa, incluindo a incorporação dos esclarecimentos de interface à Q3.
- `state_after`: mesma ideação reconciliada, sem duplicação, com Q1 a Q3 respondidas, decisões D1 a D3 e hipóteses/alternativas atualizadas. Reserva e origem no backlog preservadas; somente este arquivo alterado nesta atualização. Não houve plano, issue, branch, commit, push ou PR nesta execução.
- `result`: `already_executed_and_reconciled`
- `evidence`: este arquivo, decisões D1 a D3 e perguntas restantes; `_project/cycles.md` mantém ciclo `017` em Ideação e próximo `018`; respostas explícitas do responsável na conversa. Validação da criação em 2026-10-30: 48/48 testes de governança passaram. Nesta atualização: `node scripts/validate-governance.mjs` passou (0 erros, 0 avisos e 5 itens manuais); `git diff --check` passou; busca por pendências antigas de Q1 a Q3 não encontrou instruções desatualizadas. Revisão manual: sem dados reais e sem conversão de indicador presumida; snapshot de origem preservado.
- `blockers`: nenhum para reconciliar as respostas. Vocabulário e significado de cada atributo, mapeamento dos indicadores, regras dos filtros e autorização do rascunho permanecem pendentes para iniciar o planejamento.
