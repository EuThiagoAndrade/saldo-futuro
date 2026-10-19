# Ideação — 007: Backlog de possibilidades e entrada nos ciclos

> **Ciclo:** `007`
> **Estado:** `Ideação`
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 007" em 2026-10-19
> **Criado em:** 2026-10-19
> **Última atualização:** 2026-10-19
> **handoff_schema_version:** `2`

## Problema

Conversas sobre melhorias podem produzir possibilidades que merecem ser preservadas antes da decisão de iniciar um trabalho. O responsável deseja pedir o registro dessas possibilidades com IDs e, depois, selecionar os itens que quer explorar em um ciclo.

A governança atual organiza triagem, ideação, planejamento e entrega, mas não define um artefato próprio para essa captura anterior à entrada nos ciclos. Depender da conversa dificulta a retomada por outra sessão ou ferramenta; iniciar um ciclo para cada possibilidade anteciparia uma decisão que o responsável ainda não tomou.

## Contexto e evidências

### Fatos observados

- Na conversa de 2026-10-19, o responsável propôs conversar livremente, solicitar a inclusão de um ponto no backlog com ID e descrição e, futuramente, selecionar IDs como insumo de ideação.
- O responsável confirmou expressamente: quando disser "coloque no backlog", isso deve significar "quero guardar para decidir depois". Não há compromisso de entrega nessa inclusão.
- Após a triagem, o responsável confirmou o nível completo e autorizou a ideação do ciclo 007. A restrição inicial de apenas dialogar foi sucedida por essa autorização documental delimitada; implementação permanece sem autorização.
- `_project/README.md` define triagem para toda demanda, três níveis e ideação separada somente no ciclo completo. Não há backlog na estrutura ou no ciclo de vida definidos nessa autoridade.
- `.agent/ai_behavior.md` exige autorização limitada, regras no núcleo canônico e conferência antes de mutações para evitar duplicidade. `.agent/lessons_learned.md` declara que não deve ser usado como backlog.
- ADR-001 exige independência de ferramenta e uma fonte substantiva por responsabilidade; ADR-004 exige rigor proporcional e ciclo completo para mudar governança. A KB-003 situa o processo em `_project/README.md` e `.agent/ai_behavior.md`.
- Inspeção local em `EuThiagoAndrade/saldo-futuro`, revisão `1d2f36773b7d90a269be5f27dbbcc85e3ca10672`: árvore limpa antes da ideação, próximo ciclo `007` em `cycles.md`, sem artefato ou branch local do ciclo 007. Não houve consulta ao estado remoto do GitHub ou acesso a dados reais.

### Decisões confirmadas e limites da evidência

- O propósito acordado é preservar possibilidades para decisão futura, com referência por ID e seleção posterior pelo responsável.
- A autorização atual cobre a ideação e a reserva do ciclo, conforme `.agent/workflows/idear.md`, usando `.agent/templates/ideacao.md`.
- Arquivo único, prefixo `BL-`, campos mínimos, estados e regras de encaminhamento foram sugestões do agente na conversa. Ainda não constituem decisões aprovadas.
- Não há medição de volume esperado, frequência de consulta ou manutenção. Não há evidência de necessidade de interface, banco, serviço externo ou automação recorrente.

## Resultado desejado

- Capturar uma possibilidade quando o responsável solicitar, com identificação estável e contexto suficiente para retomada por qualquer ferramenta.
- Preservar problema ou oportunidade, benefício esperado e sugestões relevantes, sem apresentar hipótese de solução como decisão aprovada.
- Permitir selecionar um ou vários IDs para análise e encaminhamento adequado, com vínculos verificáveis entre origem e ciclo ou correção de destino.
- Distinguir inclusão, seleção para exploração, aprovação de escopo e entrega integrada.
- Manter baixo custo de captura e consulta, permitindo revisão e descarte deliberado sem perder a referência histórica.
- Definir na autoridade adequada a relação entre captura e a regra atual de entrada pela triagem, evitando que toda anotação exija iniciar um ciclo.

## Hipóteses

1. Um arquivo Markdown versionado é suficiente para o volume inicial, com menor manutenção que uma ferramenta ou interface própria.
2. ID, título, problema/benefício, contexto, data e estado/destino bastam para retomar uma possibilidade; prioridade e estimativa podem ser opcionais.
3. Uma sequência independente, como `BL-001`, evita consumir números de ciclos ou confundir possibilidades com issues planejadas.
4. Estados simples, como `Disponível`, `Encaminhado` e `Arquivado`, podem bastar se o destino continuar responsável pelo andamento da entrega.
5. Revisão sob demanda, antes da seleção, pode evitar registros obsoletos sem criar uma rotina obrigatória adicional.
6. Vários itens podem alimentar um ciclo quando compartilharem um objetivo. Um item pode precisar de mais de um destino ou preservar uma parte disponível após encaminhamento parcial.

As hipóteses são propostas para avaliação; não autorizam criação do backlog operacional nesta etapa.

## Alternativas

| Alternativa | Benefícios e custos | Condição ou critério de descarte |
| :-- | :-- | :-- |
| A — Arquivo único `_project/backlog.md` | Captura e consulta simples, contexto no repositório; crescimento pode dificultar navegação e aumentar conflitos | Preferência inicial do agente; descartar se exemplos de uso mostrarem manutenção ou recuperação inadequadas |
| B — Um arquivo por item, com índice | Facilita leitura e evolução individual; exige mais arquivos, nomes e manutenção do índice | Adotar somente se o volume ou a concorrência justificarem o custo adicional |
| C — Issues ou GitHub Projects como backlog | Busca e filtros próprios; pode confundir possibilidades com unidades planejadas e depender de acesso remoto | Exigiria redefinir explicitamente a distinção de autoridades e o papel atual das issues; sem necessidade demonstrada |
| D — Manter apenas conversas ou notas sem contrato | Nenhuma estrutura nova; contexto e identidade ficam frágeis entre sessões | Descartar se não permitir recuperar uma possibilidade por ID e compreender seu motivo sem o chat original |

Para A ou B, explorar uma operação de captura que procure duplicidade, registre somente o conteúdo solicitado e devolva ID e síntese. Solicitação inequívoca de inclusão deve ser considerada como possível autorização suficiente para a captura, sem uma segunda confirmação rotineira. Se o alvo for ambíguo, esclarecer o conteúdo antes de gravar.

Na seleção posterior, explorar recuperação dos IDs, conferência de atualidade e dependências e proposta de agrupamento. A seleção não deve presumir que todos os itens cabem num único ciclo ou que exigem nível completo; a entrada deve respeitar a triagem e as autorizações vigentes.

## Riscos e restrições

- **Burocracia de captura:** exigir plano, estimativa ou rito completo para guardar cada possibilidade pode inviabilizar o objetivo. A eventual exceção deve ser delimitada na autoridade canônica; esta ideação ainda não altera a regra atual.
- **Compromisso implícito:** inclusão ou encaminhamento pode ser interpretado como promessa de entrega. O significado dos estados precisa explicitar os limites.
- **Duplicação de autoridade:** copiar o andamento de plano, task e issue para o backlog criaria versões divergentes. Preferir contexto de origem e vínculos para os destinos.
- **Perda de contexto:** uma transcrição integral seria custosa e poderia conter conteúdo indevido; uma síntese excessiva apagaria motivo e dúvidas. Explorar um registro curto e autossuficiente, sem depender de link privado para chat.
- **Obsolescência e duplicidade:** prever revisão sob demanda, registro de descarte e reconciliação de pedidos repetidos. Não capturar automaticamente achados, sugestões do agente ou exemplos fictícios.
- **Identidade e concorrência:** IDs não devem ser renumerados ou reutilizados ao arquivar, combinar ou encaminhar itens. A alocação precisa prever conferência do estado atual e detecção de colisões; não há evidência para construir um coordenador distribuído.
- **Encaminhamento parcial e cancelamento:** um vínculo com ciclo não prova atendimento integral. Definir o que ocorre com o restante, com um ciclo cancelado e com a retomada da mesma possibilidade.
- **G1 e G2:** não se aplicam ao escopo documental proposto, que não altera cálculo, autenticação, autorização do produto ou RLS. Itens futuros do backlog podem tocar essas barreiras e deverão ser triados quando selecionados.
- **G3:** aplica-se ao conteúdo documental; preservar necessidade abstrata e exemplos fictícios, sem dados financeiros privados ou transcrições que os exponham.
- **G4:** não se aplica sem migrações; nenhuma mudança de banco é proposta.
- Ciclo completo, sem modo contínuo. Não há autorização para publicação remota ou avanço automático ao planejamento.

### Impactos e dependências a delimitar no plano

- `_project/README.md`: organização, significado do artefato, IDs, estados e entrada nos níveis existentes.
- `.agent/ai_behavior.md`: apenas os ajustes necessários para autorização da captura e relação com triagem, sem duplicar as regras de organização.
- Workflows e templates de captura e encaminhamento: avaliar o conjunto mínimo, consumindo as autoridades em vez de criar política concorrente.
- Workflows de triagem, ideação e planejamento: avaliar referências aos IDs de origem e vínculos de retorno, incluindo encaminhamento à trilha curta quando pertinente.
- Validador, manifesto e testes de governança: avaliar verificações determinísticas necessárias de formato, unicidade, referências e estados, sem conferir autoridade normativa ao validador.
- ADR: avaliar se a decisão duradoura merece registro próprio ou atualização de referência existente; nenhum ADR é aprovado por esta ideação.
- Não foi identificada necessidade de dependência de software ou serviço externo.

## Perguntas em aberto

1. **Formato:** adotar inicialmente o arquivo único da alternativa A, com seções por item, ou há necessidade concreta de arquivos separados?
2. **Conteúdo mínimo:** aprovar ID, título, problema/benefício, contexto, data e estado/destino? Prioridade e estimativa ficam opcionais? A proposta do agente é manter a captura curta, sem checklist de implementação.
3. **Estados e encaminhamento:** os três estados sugeridos bastam? Em que evento um item passa a `Encaminhado`, e como representar seleção parcial, múltiplos destinos e cancelamento do destino?
4. **Operação e publicação:** como registrar, revisar e arquivar itens com autorização direta do responsável, e como integrar essas alterações ao repositório sem exigir um ciclo novo por operação? Definir branch, commit, eventual PR e aprovação de merge de forma coerente com as regras vigentes.
5. **Seleção por IDs:** qual registro preserva o conteúdo considerado na entrada do ciclo? A proposta é referenciar os IDs e sintetizar o contexto no artefato de destino para que edições futuras no backlog não reescrevam silenciosamente sua origem.
6. **Atualização e descarte:** quais pedidos autorizam editar, combinar, arquivar e reabrir itens? A proposta é preservar IDs e registrar motivo e destino, evitando exclusão que quebre referências.

## Fora do escopo

- Interface de backlog dentro do Saldo Futuro, banco, integração com serviço externo ou painel próprio.
- Agenda de entrega, priorização automática, pontuação de esforço e automação recorrente de revisão.
- Popular o backlog com exemplos da conversa, pendências históricas ou achados não selecionados explicitamente pelo responsável.
- Reformar aprovações de plano, implementação ou merge além dos ajustes necessários ao novo artefato.
- Implementar o backlog, criar workflows operacionais, plano, issues, PRs ou publicar mudanças nesta etapa.

## Critérios para iniciar o planejamento

- Autorização explícita para rascunhar o plano do ciclo 007.
- Registrar a escolha de formato e as regras essenciais de captura, identidade, estados, encaminhamento e manutenção. As perguntas 1 a 4 afetam o contrato proposto e devem ser decididas antes de tratá-lo como fechado.
- O rascunho pode comparar alternativas pendentes e propor respostas às perguntas, identificadas como propostas; não pode apresentar silêncio como aceite nem avançar à implementação com decisões essenciais pendentes.
- Delimitar arquivos e consumidores realmente afetados e a estratégia de integração das operações futuras de backlog, preservando as autorizações existentes.
- Definir exemplos fictícios de captura, repetição de pedido, seleção múltipla, encaminhamento parcial e arquivamento para avaliar simplicidade e rastreabilidade; definir validações proporcionais no plano.
- Preservar o acordo central: incluir significa guardar para decidir depois, sem reservar ciclo, aprovar solução ou autorizar entrega.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Ideação registrada — ciclo 007 (completo)
Quem: Responsável
Conferir: Perguntas e decisões da ideação em [007_backlog_possibilidades.md](007_backlog_possibilidades.md)
Diga: "autorizo o rascunho do plano do ciclo 007"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 007 + idear + backlog_possibilidades + 1d2f36773b7d90a269be5f27dbbcc85e3ca10672`
- `effect_class`: `local_mutation`
- `state_before`: ciclo 007 triado e autorizado, sem reserva ou artefato; próximo ciclo 007; árvore local limpa em main na revisão de origem.
- `state_after`: ciclo 007 reservado em Ideação; próximo ciclo 008; ideação registrada localmente na branch chore/cycle-007-ideation, aguardando autorização de rascunho.
- `result`: `executed`
- `evidence`: este artefato, autorização inicial no cabeçalho e linha 007 em `_project/cycles.md`; a próxima numeração passou a 008. Template utilizado: `.agent/templates/ideacao.md`.
- `blockers`: nenhum para registrar a ideação; perguntas 1 a 6 permanecem abertas e não foram decididas em nome do responsável. Rascunho do plano e mutações remotas não autorizados.
