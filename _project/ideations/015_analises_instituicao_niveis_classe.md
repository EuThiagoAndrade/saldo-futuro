# Ideação — 015: Análises por instituição e níveis de classe

> **Ciclo:** `015`
> **Estado:** `Ideação`
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 015" em 2026-10-27
> **Criado em:** 2026-10-27
> **Última atualização:** 2026-10-27
> **handoff_schema_version:** `2`

## Problema

A visão patrimonial já apresenta a distribuição por ativo e por classe macro, mas não oferece análise por instituição nem detalhamento por classe nos níveis 2 e 3. Essas visões devem permitir entender a concentração por instituição e a composição das classes sem atribuir precisão inexistente a um ativo classificado em nível mais geral.

O responsável também pediu em 2026-10-27 que a ideação inclua a possibilidade de editar o nome do ativo. Hoje esse nome fica somente para leitura na tela de edição; corrigir uma descrição exige uma capacidade que ainda não existe.

## Origem no backlog

- **BL-009 — Metadados descritivos e classificação de ativos com aproveitamento do histórico:** selecionadas as visões analíticas por instituição e por classe nos níveis 2 e 3, em conjunto para este ciclo. Os campos descritivos e a visão macro foram encaminhados nos ciclos 012 e 013. O responsável informou em 2026-10-27 que já preencheu os dados descritivos dos ativos históricos migrados; é relato humano, não verificação de dados. A carga manual não integra esta seleção.
- Snapshot: `_project/backlog.md` na fila canônica, commit `84f0a5ea107f33e0de5c506b3ea0825346f6e58e`, presente em `origin/main`; destino ciclo 015 em preparação. O item continua disponível e não foi alterado pela seleção.

## Contexto e evidências

- Inspeção em `EuThiagoAndrade/saldo-futuro`, revisão `84f0a5ea107f33e0de5c506b3ea0825346f6e58e`; nenhum dado real foi lido.
- A KB-003 descreve a distribuição de M, último mês fechado, por classe macro: classificação atual do ativo, mesmo para posição histórica; trânsito e ausência de classe têm linhas próprias. Saldos negativos são separados por ativo antes do agrupamento, zeros omitidos e percentuais dos positivos rateados pelo maior resto. `src/lib/financeiro/alocacao.ts` implementa essa regra; KB-004, seção 15, contém seus casos de referência.
- O vínculo do ativo aceita qualquer nó da taxonomia global de até três níveis ou nenhum. Não se pode presumir um descendente para um ativo vinculado a um pai. A instituição é opcional e pertence ao usuário; trânsito não recebe esses atributos.
- A visão por classe confere a marca de classificação durante a leitura. A migração da taxonomia incrementa essa marca por mudanças de `taxonomia_id`; seu uso para alterações de instituição e nome precisa ser investigado, sem presumir cobertura.
- O Início alterna por ativo e por classe, com rosca, tabela equivalente e ocultação de valores. A navegação pretendida para as novas visões está nas decisões abaixo.
- A edição de nome e de tipo de ajuste foi explicitamente excluída do ciclo 012. `public.ativos` identifica o ativo por UUID e valida nome com 1 a 100 caracteres após `btrim`; a criação aceita nomes repetidos. Eventos e posições referenciam o ID, mas o nome também participa do desempate do rateio da distribuição por ativo (KB-004, seção 15). A marca da carteira usa contagens e outras referências, não o nome; a marca de classificação atual acompanha alterações de `taxonomia_id`, não de nome.

## Resultado desejado

- Analisar a distribuição por instituição e explorar classes nos níveis 2 e 3, inclusive dados incompletos e ativos vinculados a nós superiores.
- Apresentar valores e participações de modo coerente, acessível em celular e compatível com ocultação de valores, com regras financeiras e casos de referência aprovados antes da implementação.
- Preservar isolamento, privacidade e leitura coerente durante alterações concorrentes.
- Permitir a edição do nome do próprio ativo, com salvaguardas para seus vínculos, distribuição e leitura coerente, conforme decisão do responsável abaixo.

## Hipóteses

- As decisões abaixo podem ser atendidas sobre as estruturas existentes; a viabilidade e a garantia de coerência devem ser investigadas no planejamento.

## Alternativas

1. **Percentual de detalhamento:** sobre toda a carteira ou sobre o grupo pai. Exemplo fictício: carteira positiva de R$ 1.000, classe de R$ 400 e subclasse de R$ 100: a subclasse representa 10% da carteira ou 25% do pai. Mostrar ambos também é possível, com rótulos claros e rateios definidos.
2. **Vínculo em nível superior:** se um ativo de R$ 100 aponta para uma classe macro e outro de R$ 300 para uma subclasse, uma visão de nível 2 pode manter R$ 100 em linha explícita "classificado somente no nível superior", ou excluir esse valor do detalhamento com cobertura indicada. Distribuí-lo entre filhos inventaria uma classificação e não é proposto.
3. **Instituição ausente e trânsito:** linhas separadas de "Sem instituição" e trânsito, ou outra apresentação explícita. O denominador e o tratamento dos negativos devem ser decididos, não inferidos.
4. **Arredondamento hierárquico:** ratear cada conjunto de filhos independentemente sobre o pai, ou calcular percentuais sobre a carteira em cada nível. Em três filhos iguais, um rateio de 100% pode produzir 33,34%, 33,33% e 33,33%; o desempate e a reconciliação com o pai exigem regra explícita.
5. **Interação:** detalhamento progressivo dentro da visão por classe, seleção direta de nível, ou tela própria; comparar legibilidade, navegação e acessibilidade antes de escolher.
6. **Nome do ativo:** permitir alterar o nome atual na edição, mantendo UUID e referências, ou manter nome imutável e exigir outro procedimento. O responsável escolheu a primeira opção, com os limites registrados abaixo.

## Riscos e restrições

- **G1:** novas agregações, denominadores e arredondamentos exigem decisões do responsável, exemplos numéricos e casos independentes na KB-004. Não escolher regra financeira por inferência.
- **G2:** instituições são dados por usuário; revisar RLS, joins, funções e testes de isolamento para a solução escolhida. A necessidade de mudar políticas ainda não foi determinada.
- **G3:** não consultar ou registrar carteira real, nomes de instituições, valores ou posições; exemplos e testes devem ser fictícios.
- **G4:** se uma migração for necessária, criar migração aditiva; não editar as existentes. Necessidade ainda não determinada.
- Leituras concorrentes de vínculo ou renomeação de instituição podem produzir visão incoerente; investigar marcas e alternativas, inclusive A → B → A.
- Renomear um ativo pode mudar a ordenação e o desempate da distribuição por ativo: três saldos positivos iguais recebem 33,34%, 33,33% e 33,33%; mudar a ordem dos nomes pode mudar quem recebe o centésimo adicional. Saldos não precisam mudar para a apresentação mudar. Avaliar G1 e casos de referência, sem prometer percentuais invariáveis.
- O nome atual pode aparecer também em lançamentos e posições antigas; preservar referências por ID não equivale a preservar histórico dos nomes. A marca de leitura existente não detecta a renomeação: avaliar todas as leituras afetadas e uma marca monotônica, inclusive A → B → A.
- Escrita por função transacional com isolamento do dono, recusas para outro usuário, administrador e trânsito, e testes fictícios devem ser avaliados no plano; alterações de banco exigem migração aditiva e compatibilidade de implantação.
- Nós com nomes iguais em ramos diferentes, ausência de dados, base zero, negativos e percentuais arredondados exigem tratamento explícito. A classificação atual aplicada ao passado não implica histórico de classificação.
- Modo contínuo proibido no ciclo completo. Nenhum plano, issue, implementação ou publicação foi autorizado por esta ideação.

## Perguntas em aberto

### Decisões do responsável — 2026-10-27

O responsável concordou com todas as sete propostas apresentadas. Elas delimitam a ideação, sem aprovar o plano ou autorizar implementação.

1. **Período:** último mês fechado; instituição e classe atuais, sem afirmar que representem histórico de classificações.
2. **Percentuais:** apresentar tanto a participação na carteira quanto no pai, com rótulos claros. Exemplo fictício: carteira positiva de R$ 1.000, pai de R$ 400 e filho de R$ 100 resultam em 10% da carteira e 25% do pai.
3. **Dados incompletos:** mostrar no detalhamento uma linha "Classificado somente neste nível" para ativos vinculados ao pai. Apresentar linhas próprias para Sem classe, Sem instituição e Trânsito, conforme a visão; saldos positivos dessas linhas permanecem na base da carteira.
4. **Negativos:** listar por ativo, identificando classe ou instituição quando disponível, fora da base dos percentuais; omitir saldos zero.
5. **Navegação:** detalhar progressivamente a classe macro em subclasses e a subclasse em tipos, com caminho de volta claro. Acrescentar "Por instituição" junto às visões atuais.
6. **Arredondamento:** maior resto, com desempate determinístico; percentuais do pai somam 100% dentro de cada conjunto de linhas. Percentuais da carteira usam a base total; o resultado arredondado dos detalhes não precisa somar exatamente ao percentual arredondado do pai. Especificar e demonstrar ambos em casos de referência independentes antes da implementação.
7. **Coerência:** o plano deve investigar uma garantia que detecte mudanças de vínculo e renomeações de instituição durante a leitura, inclusive A → B → A, e seus testes.
8. **Nome do ativo:** o responsável concordou com a proposta em 2026-10-27: permitir renomear ativos comuns em uso e desativados, preservando UUID, referências, validações atuais e possibilidade de nomes repetidos; trânsito e tipo de ajuste continuam sem edição. O nome atual também aparece nos registros antigos, sem histórico de nomes. Aceita-se o possível deslocamento de um centésimo de ponto percentual no desempate existente após renomear. O plano deve prever testes de isolamento, integridade dos vínculos, leitura coerente e efeito no arredondamento.

### Detalhes a resolver no planejamento

- Definir desempate determinístico e casos numéricos para base zero, empates e conciliação das duas bases; apresentar qualquer escolha financeira material ainda não decidida ao responsável, sem presumir aprovação.
- Investigar a garantia técnica de coerência e isolamento, e detalhar acessibilidade, visualização e comportamento da análise por instituição dentro das decisões acima.
- Detalhar a proteção das leituras afetadas por renomeação de ativo e os testes das decisões sobre nome, inclusive alterações concorrentes A → B → A.

## Fora do escopo

- Carga ou alteração dos dados históricos informada como já feita; consulta de dados reais.
- Novos atributos do BL-015, alocação-alvo, mudança da árvore de classes e classificação automática.
- Edição do tipo de ajuste, implementação, publicação e decisões financeiras não autorizadas.

## Critérios para iniciar o planejamento

- Decisões de escopo e direção financeira registradas acima; detalhes ainda não decididos devem ser apresentados ao responsável durante o planejamento.
- O plano deve especificar exemplos fictícios, exceções e percentuais esperados e propor validações de isolamento e coerência.
- Autorização posterior: "autorizo o rascunho do plano do ciclo 015".

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Ideação registrada — ciclo 015 (completo)
Quem: Responsável
Conferir: decisões e detalhes a resolver em _project/ideations/015_analises_instituicao_niveis_classe.md
Diga: "autorizo o rascunho do plano do ciclo 015"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 015 + idear + analises_instituicao_niveis_classe + 84f0a5ea107f33e0de5c506b3ea0825346f6e58e`
- `effect_class`: `local_mutation`
- `state_before`: ciclo 015 não registrado; próximo ciclo 015; main e fila canônica em `84f0a5ea107f33e0de5c506b3ea0825346f6e58e`; autorização inicial recebida.
- `state_after`: ideação criada e ciclo 015 reservado como `Ideação`; próximo ciclo 016; concordância com as sete propostas e com a edição do nome registrada; alterações locais sem commit.
- `result`: `executed`
- `evidence`: template de ideação, fila canônica, KB-003, implementação de distribuição e alocação, schema da carteira, marcas de leitura, migração da taxonomia e registro de ciclos inspecionados; concordância expressa do responsável com a proposta de nome em 2026-10-27; nenhum dado real lido.
- `blockers`: autorização do rascunho pendente; detalhes financeiros ainda não decididos exigem decisão do responsável antes de serem fixados.
