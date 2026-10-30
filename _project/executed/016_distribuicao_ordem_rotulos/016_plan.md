# Plano de Implementação — Ordem e rótulos da distribuição

> **Ciclo:** `016`
> **Status:** `Concluído`
> **Versão:** `v2`
> **Data de criação:** 2026-10-30
> **Última atualização:** 2026-10-30
> **Tipo:** `feature`
> **Prioridade:** `P2`
> **Nível:** `leve`
> **Autorização inicial:** "confirmo o nível leve e autorizo o plano do ciclo 016" em 2026-10-30
> **Modo contínuo:** `—`
> **Revisão formal:** `Concluída`
> **Veredito da revisão:** `APTO COM RESSALVAS`
> **Aprovação humana pós-revisão:** `Aprovada em 2026-10-30`
> **handoff_schema_version:** `2`

## Problema e contexto

No Início, o alternador apresenta Por ativo, Por classe e Por instituição, com Por ativo como padrão. O responsável prefere começar por instituição, seguir para classe e terminar em ativo; instituição e classe são agrupamentos paralelos, não níveis de uma hierarquia. No detalhe de classe, os rótulos atuais dos percentuais não explicitam bem suas bases. A proposta troca os rótulos para “% na carteira” e “% na classe”, conservando os cálculos e a navegação.

A triagem apresentada ao responsável selecionou BL-016 e BL-017 integralmente para um ciclo leve. A trilha curta não se aplica porque se alteram o comportamento e o contrato visual existentes; o escopo não muda cálculos, RLS, autenticação, autorização, semântica de schema ou governança. O responsável confirmou o nível leve e autorizou este plano, sem modo contínuo.

**Informação relacionada ao BL-009:** o responsável relatou que concluiu a carga retroativa dos dados descritivos das posições históricas migradas. Trata-se de passo local e manual, fora de ciclo; este plano registra o relato, não comprova os dados nem autoriza nova carga. O backlog ainda lista essa parcela em Restante. A atualização de seu conteúdo e estado não é parte da entrega deste ciclo; não se presume que o relato, por si, constitua destino integrado.

## Objetivo

Tornar a ordem, a visão inicial e os rótulos do detalhe coerentes com a preferência informada, preservando as três perspectivas e as regras financeiras existentes.

## Origem no backlog

- **BL-016 — Ordem das visões da distribuição do patrimônio:** integral; reordenar as três visões e abrir Por instituição por padrão, preservando as escolhas explícitas.
- **BL-017 — Rótulos claros das participações no detalhe por classe:** integral; alterar os dois rótulos, preservando Saldo, breadcrumb, bases e resultados.

Snapshot em `_project/backlog.md` no commit da fila canônica `89e0666a219df1ee136d53055518f31884c31c9b`, presente em `main`. Destino em preparação; os itens não mudam agora. Depois da integração comprovada do ciclo, o retorno da seleção será registrado na fila por `ciclo 016`; sua publicação exige autorização separada. BL-009 é apenas contexto informado, não origem selecionada.

## Contexto e baseline

Em `89e0666a219df1ee136d53055518f31884c31c9b`, `src/app/(app)/page.tsx` escolhe Por ativo quando `distribuicao` está ausente ou é inválido e renderiza apenas a visão escolhida. O formulário preserva visão e ramo; links preservam período e descartam o ramo ao trocar de visão. `src/components/detalhe-do-ramo.tsx` exibe os rótulos em tabela, cartões e texto explicativo. `DESIGN.md` 6.12–6.13 e KB-003 documentam o comportamento anterior; os e2e atuais o verificam. A leitura institucional depende dos metadados já existentes e tem tratamento de erro próprio.

## Escopo

### Dentro do escopo

- Ordenar o alternador Por instituição → Por classe → Por ativo. Sem parâmetro ou com parâmetro inválido, selecionar Por instituição; os três valores válidos explícitos mantêm suas respectivas visões.
- No detalhe por classe, substituir os rótulos visíveis e os nomes citados no texto explicativo por “% na carteira” e “% na classe”, no desktop e no celular. A segunda base segue o grupo aberto, seja macro ou subclasse; a primeira mantém sua base atual por nível e ambos os arredondamentos permanecem independentes.
- Adaptar testes afetados, atualizar o contrato visual e a documentação viva no encerramento prospectivo da entrega, e preparar uma nota de novidades para a próxima versão ainda não lançada.

### Fora do escopo

- Alterar cálculos, bases, saldos, percentuais, ordenação dos grupos, dados, schema, autenticação, RLS ou leitores financeiros; quaisquer novas classificações ou atributos do BL-015.
- Alterar Saldo, breadcrumb, estrutura do detalhe, comportamento de ocultação ou navegação além da ordem e do padrão explicitados.
- Executar ou verificar carga retroativa, alterar o BL-009 na fila ou afirmar sua conclusão como dado verificado; publicar retornos do backlog.
- Executar release ou preenchimento posterior da data como parte do encerramento prospectivo; estes passos ocorrem depois da integração e exigem seus próprios procedimentos e aprovações.

## Decisões e autoridades

A referência de cálculo continua sendo KB-004, seção 15, em especial CR-015; o contrato de interface existente é DESIGN.md 6.12–6.13, a ser atualizado para refletir os novos rótulos e padrão. Uma necessidade de mudar regra financeira ou isolamento exige parar e retriar; não se escolhe interpretação financeira autonomamente. Links explícitos continuam aceitos, inclusive `?distribuicao=ativo`.

**Novidades e release:** incluir em `src/lib/novidades.ts` nota sucinta sobre as mudanças de interface na próxima versão futura, com `publicadaEm: null`, seguindo o padrão existente. Na preparação da entrega, conferir a versão corrente, eventual PR de release já existente e a convenção do squash; `0.12.0` é apenas a expectativa a partir da `0.11.0`, não fato garantido. Se houver divergência que impeça associar a nota com segurança à próxima versão, parar para conciliar antes de publicar a entrega; conferir a proposta efetiva do release-please quando ela existir, após o merge. Ajustar o comentário do arquivo para permitir registro posterior da data, sem alterar a lógica de exibição. A release ocorre depois do merge da entrega, com checks verdes e aprovação específica da PR do bot. Após publicação comprovada, o responsável poderá solicitar uma alteração documental própria para registrar em `publicadaEm` a data civil da publicação em America/Cuiaba; ela terá PR e aprovação de merge próprias, ou poderá ser incluída em ciclo posterior autorizado. Até a integração dessa alteração a data permanece `null`; a publicação da release e o preenchimento da data não são afirmados no encerramento prospectivo.

### Pontos de aprovação

| Ponto | Precondição | Cobre | Não cobre | Conferir |
| :-- | :-- | :-- | :-- | :-- |
| Revisão formal | Plano em rascunho | Revisão separada com veredito e achados | Aprovação, issues ou implementação | Plano e revisão |
| Aprovar plano | Veredito apto, manifestação humana posterior | Plano, criação das issues após apresentação e confirmação do payload, encerramento após integração | Implementação, merge, ações externas ou produção | Veredito e ressalvas |
| Autorizar implementação da issue #N | Plano aprovado, issue existente e escopo conferido | Implementação dessa issue e preparação/publicação de sua PR | Merge ou mudanças fora do plano | Issue e escopo |
| Aprovar merge da PR #N | PR revisável e checks verdes no head corrente | Merge daquela PR, inclusive release ou PR posterior da data | Outras PRs ou ações externas | Diff e checks |

Parar diante de dúvida material, mudança de nível ou barreira, falha de precondição ou acesso, dados privados ou conflito de estado; não há encadeamento automático neste ciclo.

## Barreiras de domínio

| Barreira | Aplica-se? | Como o ciclo a atende ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Apenas seleção de visão e rótulos; não alterar cálculo nem base. Testes de regressão preservam resultados existentes; se isso mudar, parar e retriar. |
| G2 — isolamento por RLS | Não | Sem mudança de políticas, autenticação, autorização ou leitores; o padrão usa leitor institucional já existente. |
| G3 — privacidade de dados | Sim | Usar só fixtures fictícias; revisar diff, evidências e PR sem dados reais. Não ler nem registrar dados da carga manual. |
| G4 — migrações só acrescentam | Não | Nenhuma migração prevista; não alterar migrações existentes. |

## Estratégia de testes

- E2e autenticado com dados fictícios: ordem dos links; ausência e valor inválido abrem instituição; cada um dos três parâmetros válidos abre sua visão; apenas a escolhida aparece; período, ramo, voltar e `aria-current` preservados conforme contrato.
- E2e do detalhe de macro e subclasse, em desktop e celular: novos rótulos e texto explicativo coerentes; valores de referência existentes, Saldo, breadcrumb, navegação e ocultação permanecem corretos. Não substituir testes de percentuais por testes de texto.
- Ajustar testes existentes que dependem do antigo padrão para solicitar explicitamente Por ativo quando essa for a intenção, inclusive os de distribuição e Início; preservar seus objetivos. No ensaio optativo `navegacao-desempenho.spec.ts`, manter `/` como origem e destino das medições para representar a abertura real; somente a prova isolada D13 que inspeciona o detalhe por ativo pode solicitar `?distribuicao=ativo`. O ensaio de desempenho e a prova D13 são optativos e não são gates obrigatórios deste ciclo.
- Verificar que a nota futura fica oculta enquanto a versão do build for anterior, que aparece quando a versão a alcança e que `null` apresenta data em confirmação; manter os testes existentes relevantes.
- Antes da PR: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, testes Playwright afetados com Supabase local e fixtures fictícias, `node --test scripts/validate-governance.test.mjs`, `node scripts/validate-governance.mjs` e `git diff --check`. Registrar resultados reais e limitações na task; CI executa também a suíte completa e testes de banco. Falha ou indisponibilidade de gate obrigatório impede publicação até resolução.

## Itens de implementação

### Item 1 — Ajustar ordem, padrão e rótulos da distribuição

**Contexto:** BL-016 e BL-017 incidem na mesma área do Início e podem ser entregues juntos numa única issue e PR.

**Ação técnica:** ajustar o parser e a lista de visões em `page.tsx`, manter os leitores e os cálculos, atualizar os rótulos e suas referências no texto explicativo em `detalhe-do-ramo.tsx`, preparar a nota futura com data nula, adaptar testes e documentação viva afetada.

**Critérios de aceite:**

- [ ] Alternador na ordem Por instituição, Por classe, Por ativo; padrão institucional em parâmetro ausente ou inválido.
- [ ] Valores explícitos ativo, classe e instituição preservam suas visões; período, ramo, retorno e seleção acessível mantidos.
- [ ] Tabela desktop e cartões mobile exibem “% na carteira” e “% na classe”; texto explicativo usa os mesmos nomes e esclarece as bases existentes.
- [ ] Em macro e subclasse, valores calculados, base do grupo aberto, Saldo e breadcrumbs são preservados, inclusive com ocultação de valores.
- [ ] Nota para versão futura registra as mudanças em linguagem simples com `publicadaEm: null`; sua visibilidade e o estado de data pendente seguem o comportamento existente.
- [ ] Testes e documentação afetados passam e refletem o comportamento novo; nenhuma regra financeira, política ou migração é alterada.

## Arquivos afetados

Previstos: `src/app/(app)/page.tsx`, `src/components/detalhe-do-ramo.tsx`, `src/lib/novidades.ts`, testes afetados em `tests/e2e/`, `design-system/DESIGN.md`, `_project/knowledge/KB-003_visao_produto_arquitetura.md`, este plano, `cycles.md` e task da issue. A lista final será conferida no diff; incluir outros arquivos somente quando necessários ao escopo aprovado. `src/lib/financeiro/niveis.ts` não será alterado: os termos antigos nos comentários descrevem as bases internas, inclusive a participação no pai da KB-004, e não mudam o contrato dos rótulos da interface.

## Decomposição em issues e PRs

A issue [#163 — Ajustar ordem e rótulos da distribuição (BL-016 e BL-017)](https://github.com/EuThiagoAndrade/saldo-futuro/issues/163) cobre o item 1, seguida de branch `feature/issue-163` e uma PR que inclui plano, task, alterações e encerramento prospectivo. A PR usa fechamento da issue e exige aprovação própria do merge. Não há PR documental separada para o plano no ciclo leve. Uma eventual PR posterior para registrar a data da release é operação documental distinta, fora do encerramento do ciclo, e requer autorização adequada e aprovação própria de merge.

## Dependências e blockers

BL-016 e BL-017 já existem em `main` no commit indicado. Revisão formal, aprovação posterior, confirmação do payload e criação da issue #163 foram concluídas. A implementação depende de autorização explícita. Testes autenticados dependem de Supabase local e ambiente de teste disponível.

## Riscos, suposições e rollback

- A visão institucional se torna a leitura inicial, inclusive para URLs com valor inválido. Ela acrescenta a leitura do catálogo de instituições após a carteira, dentro da composição e suas tentativas, com possível aumento de latência. Falha nessa leitura pode provocar erro do Início inteiro, ampliando a superfície de falha do acesso padrão; manter o erro existente visível, sem fallback que mascare falhas.
- O nome “% na carteira” mantém a definição existente por nível, não uma nova fórmula; o texto explicativo precisa evitar ambiguidade.
- Um eventual rollback da entrega será uma reversão própria e revisada da PR integrada, preservando migrações e dados; não há migração planejada.

## Sequência recomendada

1. Revisar formalmente o plano; corrigir e repetir revisão quando necessário.
2. Após veredito apto, aguardar aprovação humana posterior; apresentar e confirmar payload e criar a issue.
3. Com autorização explícita da issue, criar branch e task, implementar, validar e preparar PR única com encerramento prospectivo e documentação viva.
4. Conferir checks verdes e diff; aguardar aprovação específica e integrar. Reconciliar o estado no GitHub.
5. Após integração comprovada, registrar o retorno de BL-016 e BL-017 na fila canônica; publicação do retorno depende de pedido separado.
6. Conferir a PR de release-please e a versão efetiva; executar os checks exigidos e aguardar aprovação específica do merge. Depois de comprovada a publicação, o responsável poderá solicitar a atualização documental da data da nota, em PR própria ou ciclo posterior, com aprovação de merge própria. Nenhuma data é presumida.

## Referências

- `.agent/ai_behavior.md`; `_project/README.md`; `_project/cycles.md`; `.agent/workflows/rascunhar_plano.md`; `.agent/templates/plano_implementacao.md`.
- `_project/backlog.md` em `89e0666`; `_project/knowledge/KB-003_visao_produto_arquitetura.md`; `_project/knowledge/KB-004_regras_financeiras.md`; `design-system/DESIGN.md`.
- Código e testes indicados em Contexto e baseline e Estratégia de testes.

## Rastreabilidade

| Campo | Valor |
| :-- | :-- |
| Issue(s) | [#163](https://github.com/EuThiagoAndrade/saldo-futuro/issues/163) — fechada pela PR da entrega (`Closes #163`) |
| PR(s) | [PR #164](https://github.com/EuThiagoAndrade/saldo-futuro/pull/164), encerramento prospectivo até seu merge |
| Branch(es) | `feature/issue-163` |
| Destino após conclusão | `_project/executed/016_distribuicao_ordem_rotulos/016_plan.md` |

## Próximo passo

Encerramento prospectivo: antes do merge da [PR #164](https://github.com/EuThiagoAndrade/saldo-futuro/pull/164), a situação efetiva é Aguardando merge. Checks e diff devem estar conferidos antes da frase "aprovo o merge da PR #164".

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 016 (leve)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

### Implementação da issue #163 e encerramento prospectivo

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 016 + implementar_issue + 163 + 89e0666a219df1ee136d53055518f31884c31c9b`
- `effect_class`: `remote_mutation`
- `state_before`: plano `v2` aprovado, issue #163 aberta, implementação autorizada em 2026-10-30 ("autorizo a implementação da issue #163"); `main` e `origin/main` em `89e0666`.
- `state_after`: item 1 implementado e validado localmente na branch `feature/issue-163`; plano Concluído, task Concluída, pasta em `executed/` e `cycles.md` Concluído como estado prospectivo; PR da entrega publicada, aguardando checks e aprovação do merge.
- `result`: `executed`
- `evidence`: ver as evidências da task `016_task_issue-163.md`.
- `blockers`: nenhum para publicar; o merge depende de checks verdes e "aprovo o merge da PR #164". Release, data da nota e retorno do backlog seguem depois, cada um por seu procedimento.

### Criação da issue #163

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 016 + criar_issues + feature/BL-016-BL-017 + v2`
- `effect_class`: `remote_mutation`
- `state_before`: plano v2 aprovado após veredito `APTO COM RESSALVAS`; ciclo 016 em Planejamento, payload apresentado e aguardando confirmação; buscas no GitHub por BL-016 e BL-017 sem issue correspondente.
- `state_after`: payload confirmado pelo responsável (“Pode criar as issues conforme o plano.”) em 2026-10-30; issue #163 aberta; plano e registro do ciclo atualizados localmente, sem commit; implementação ainda não autorizada.
- `result`: `executed`
- `evidence`: [issue #163](https://github.com/EuThiagoAndrade/saldo-futuro/issues/163), conferida aberta via `gh issue view`; corpo corresponde ao payload abaixo, com cabeçalhos do Issue Form; SHA-256 do corpo UTF-8 enviado `ad6efd738fc09589684e2223fb5e21c66470cfb23bf89135a549eaab2dc1c086`.
- `blockers`: nenhum para solicitar autorização de implementação.

### Aprovação do plano e preparação da issue

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 016 + aprovar_plano + 016_plan + v2/rodada-2`
- `effect_class`: `local_mutation`
- `state_before`: ciclo 016 em Planejamento; plano v2 Em Revisão, rodada 2 `APTO COM RESSALVAS`, aprovação pendente; plano e reserva locais sem commit.
- `state_after`: plano v2 Aprovado por manifestação humana posterior em 2026-10-30; ciclo permanece em Planejamento; payload apresentado para confirmação, sem issue criada e sem implementação autorizada.
- `result`: `executed`
- `evidence`: frase “aprovo o plano do ciclo 016” recebida em 2026-10-30, posterior à rodada 2; ressalvas R2-1 e R2-2 preservadas; busca de issues por BL-016 e BL-017 sem resultado; payload proposto abaixo.
- `blockers`: confirmação do payload antes da criação da issue, conforme `.agent/workflows/criar_issues.md`.

### Payload proposto da issue

**Confirmação:** “Pode criar as issues conforme o plano.” em 2026-10-30. Conteúdo criado como issue #163; a pergunta e o payload abaixo ficam preservados como histórico.

**Pergunta apresentada:** Confirma a criação da issue com o título e o conteúdo abaixo?

**Título:** `[FEATURE] Ajustar ordem e rótulos da distribuição (BL-016 e BL-017)`

#### Contexto

No Início, o alternador abre Por ativo e apresenta as visões na ordem Por ativo, Por classe e Por instituição. No detalhe por classe, os rótulos dos percentuais não esclarecem suficientemente suas bases. O ciclo 016 reúne integralmente BL-016 e BL-017 para ajustar a apresentação.

#### Escopo

- Ordenar Por instituição → Por classe → Por ativo e usar Por instituição como padrão para parâmetro ausente ou inválido, preservando escolhas explícitas, período e navegação por classe.
- Trocar os rótulos no detalhe para “% na carteira” e “% na classe” na tabela, nos cartões e no texto explicativo, mantendo as bases, saldos, breadcrumb e cálculos existentes.
- Adaptar testes e documentação viva, incluir nota de novidades para a próxima versão futura com data nula e preparar encerramento prospectivo na PR da entrega.
- Fora: mudança de cálculo, base, dados, schema, RLS ou autenticação; carga retroativa do BL-009; publicação de retornos do backlog. Release e registro da data da nota ocorrem após o encerramento, pelos procedimentos e autorizações próprios.

#### Critérios de aceite

- [ ] Links na ordem solicitada; parâmetro ausente ou inválido abre Por instituição, e cada parâmetro válido explícito mantém a visão correspondente.
- [ ] Período, ramo, retorno e `aria-current` preservados; somente a visão escolhida é renderizada.
- [ ] Os novos rótulos e a explicação coerente aparecem no desktop e celular; macro e subclasse preservam valores, bases, Saldo, breadcrumb e ocultação.
- [ ] Nota futura com `publicadaEm: null`, sem identificadores técnicos, e testes de visibilidade com versões explícitas, sem depender da versão atual do pacote.
- [ ] Testes e documentação afetados refletem o comportamento; regras financeiras, políticas e migrações permanecem intactas.

#### Ciclo e plano relacionados

Ciclo 016 — `_project/drafts/016_distribuicao_ordem_rotulos/016_plan.md`, v2 aprovado; o plano ainda é local e seguirá na PR da entrega.

#### Dependências, riscos e autorizações

A criação da issue depende da confirmação deste payload. A implementação exige autorização explícita posterior e o merge exige aprovação específica com checks verdes. A leitura institucional padrão acrescenta consulta ao catálogo e pode aumentar a latência ou causar erro no Início inteiro; preservar o tratamento de erro existente. Usar apenas dados fictícios. Depois da release, a data da nota é demanda nova a triar ou incluir em ciclo posterior autorizado, sujeita aos gates de aplicação; aprovação de merge não autoriza criação nem implementação dessa alteração. Consultar o plano para gates e demais limites.

### Correção v2

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 016 + rascunhar_plano + 016_plan + v2`
- `effect_class`: `local_mutation`
- `state_before`: ciclo 016 em Planejamento, plano v1 Em Revisão, rodada 1 com REQUER NOVA RODADA e correções aguardadas; reserva e plano locais sem commit.
- `state_after`: plano v2 Em Revisão com respostas aos quatro achados; ciclo permanece em Planejamento, próximo ciclo 017, revisão da rodada 2 pendente; alterações locais sem commit.
- `result`: `executed`
- `evidence`: resposta do autor à rodada 1, alterações nas seções do plano e linha do ciclo em `cycles.md`; solicitação humana de correção em 2026-10-30.
- `blockers`: nenhum para a próxima revisão; o veredito da rodada 1 permanece histórico e a revisão da v2 é pendente.

### Rascunho v1 (histórico)

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 016 + rascunhar_plano + 016_plan + v1`
- `effect_class`: `local_mutation`
- `state_before`: próximo ciclo 016, sem plano ou reserva 016; main e fila canônica em `89e0666`; triagem BL-016/017 apresentada e entrada do nível leve autorizada em 2026-10-30.
- `state_after`: plano v1 em Rascunho e ciclo 016 reservado em Planejamento; próximo ciclo 017; alterações locais sem commit; revisão e aprovação pendentes.
- `result`: `executed`
- `evidence`: plano e registro em `_project/cycles.md`; origem no backlog publicada em main no commit `89e0666`.
- `blockers`: nenhum para revisão.

## Revisão crítica

### Rodada 1

- **Data:** 2026-10-30.
- **Versão revisada:** v1; base local `89e0666a219df1ee136d53055518f31884c31c9b`, com `_project/cycles.md` e o plano ainda sem commit.
- **Autor:** não declarado no plano v1 (workflow `rascunhar_plano`).
- **Revisor:** Claude Code (Claude Opus 5.5).
- **Veredito:** `REQUER NOVA RODADA`.

#### Achados

- **R1-1 — Bloqueador: o plano não decide sobre a nota de novidades nem sobre a release.** Desde o ciclo `010`, os ciclos com mudança visível ao usuário registram uma nota em `src/lib/novidades.ts` para uma versão futura ainda não lançada, e a data só é preenchida com a publicação comprovada (KB-003, seção de versão e novidades; plano do ciclo `015`, item D e "Arquivos afetados"). Este ciclo muda a visão inicial do Início e os rótulos do detalhe, e o commit `feat(issue-N)` deve gerar uma nova versão menor pelo release-please. Mas escopo, arquivos afetados, critérios e sequência não citam novidades nem release. No ciclo leve há um problema estrutural: o encerramento prospectivo vai na mesma PR da entrega, antes da release, então a data da nota não pode ser comprovada nele. Do jeito que está, quem implementar terá de escolher sozinho entre incluir a nota, um arquivo fora da lista, ou omitir o padrão vigente. A v2 deve registrar uma decisão explícita: (a) incluir a nota na próxima versão, com `publicadaEm: null`, dizendo onde e por quem a data será registrada depois da release (por exemplo, PR documental própria com aprovação de merge, ou o próximo ciclo), e acrescentar o arquivo, o critério e o passo da release depois do encerramento; ou (b) não incluir a nota, com justificativa, e declarar a release fora do ciclo. Se a escolha for de produto, levá-la ao responsável.
- **R1-2 — Ressalva: o custo e a forma de falha da visão padrão não estão nos riscos, e a adaptação do ensaio de desempenho pode descaracterizá-lo.** Com o padrão institucional, todo acesso a `/` passa a usar `lerInsumosDoInicioPorInstituicao` (`src/lib/telas/leituras.ts:236`), que acrescenta a leitura do catálogo de instituições, em sequência à da carteira, dentro da composição com repetição. Uma falha nessa leitura vira `ErroLeitura` e afeta o Início inteiro ("Não foi possível ler a carteira", `page.tsx:88-91`), não só a visão. Antes, isso só acontecia com `?distribuicao=instituicao`. O risco declarado ("erros de leitura institucional devem continuar visíveis") está correto, mas não diz que o custo e a superfície de falha do Início padrão aumentam. Além disso, `tests/e2e/navegacao-desempenho.spec.ts` é um ensaio optativo (`MEDIR_NAVEGACAO=1`) que mede `/` como origem e destino. Pedir Por ativo explicitamente nas medições deixaria de medir a abertura real do Início. Na v2: registrar o efeito nos riscos; separar no ensaio a prova D13 (linhas 287-301), que pode pedir `?distribuicao=ativo` para manter o objetivo, das medições, que devem continuar em `/`; e declarar que o ensaio não é gate obrigatório deste ciclo.
- **R1-3 — Ressalva: os comentários de `src/lib/financeiro/niveis.ts` citam os rótulos antigos.** As linhas 8-9 nomeiam as duas bases como "% da carteira" e "% do pai". O plano lista KB-003 e DESIGN.md, mas não decide sobre esse módulo de cálculo. Recomenda-se não tocar no arquivo e dizer isso em "Arquivos afetados", tratando os termos como nomes internos das bases, já que KB-004 usa "participação no pai". Se a opção for atualizar, declarar uma alteração só de comentário, sem efeito em G1. Assim não aparece no diff uma mudança em módulo financeiro sem explicação.
- **R1-4 — Ressalva: a linha do ciclo `016` em `_project/cycles.md` fica fora da tabela.** A reserva foi gravada depois de uma linha em branco. Sem cabeçalho, o GitHub mostra essa linha como texto, não como linha da tabela. O mesmo já acontece nas linhas `005` e `008`, e o validador aceita. Retirar a linha em branco antes da `016`. As linhas `005` e `008` ficam fora do escopo deste ciclo.

#### Itens atendidos e evidências

- Template `.agent/templates/plano_implementacao.md` integral, com todas as seções obrigatórias. O cabeçalho registra o nível leve, a frase de entrada de 2026-10-30 e o modo contínuo `—`.
- Origem no backlog conferida: BL-016 e BL-017 existem em `_project/backlog.md` no commit `89e0666`, ambos `Disponível` e sem encaminhamentos, e o commit está em `origin/main`. A síntese e as parcelas integrais batem com os itens. A menção ao BL-009 está delimitada como relato, sem dados e sem alterar a fila.
- Baseline conferido por leitura: `visaoDe` devolve `ativo` quando o parâmetro está ausente ou é inválido (`page.tsx:60`); alternador na ordem Por ativo, Por classe, Por instituição (`page.tsx:422-426`); formulário com `distribuicao` e `classe` ocultos (`page.tsx:261-262`); `hrefDaDistribuicao` preserva o período e descarta o ramo fora da visão por classe; rótulos e texto explicativo em `detalhe-do-ramo.tsx:100`, `:116`, `:119`, `:145` e `:147`; DESIGN.md 6.12 (linha 427) e 6.13 (linha 442); KB-003 (linhas 90, 97 e 98, a primeira já desatualizada e coberta pela atualização prevista).
- Os testes que dependem do padrão antigo estão cobertos pela estratégia: `analises-inicio.spec.ts` (linhas 113-130 e 189, 364), `distribuicao-classe.spec.ts` (linhas 100-117), `distribuicao.spec.ts:50`, `inicio.spec.ts:100` e `navegacao-desempenho.spec.ts:301`.
- Escopo e não escopo coerentes com BL-016 e BL-017; objetivo verificável; critérios de aceite cobrem ordem, padrão, valores explícitos, rótulos em desktop e celular, bases de macro e subclasse e ocultação.
- Nível leve correto: nenhuma mudança de cálculo, RLS, autenticação, schema ou governança. G1, G2 e G4 com justificativa adequada; G3 aplicável e com tratamento. Modo contínuo `—`, sem cadeia automática.
- Pontos de aprovação com precondição, cobre, não cobre e conferir, nas frases de `_project/README.md`; decomposição em uma issue e uma PR, que leva o plano e o encerramento prospectivo, como pede o ciclo leve.
- G3: nenhum dado do usuário no plano nem nesta revisão. Nenhum arquivo de `local/` foi lido.
- `node scripts/validate-governance.mjs`: 0 erros, 0 avisos, 5 itens manuais, antes da gravação desta rodada. Nenhum teste de aplicação foi executado: o código ainda não foi alterado.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 016 + revisar_plano + 016_plan/rodada-1 + v1`
- `effect_class`: `local_mutation`
- `state_before`: v1 em Rascunho, revisão e veredito pendentes; Aguardando revisão (rodada 1); plano e reserva em `cycles.md` locais, sem commit.
- `state_after`: v1 Em Revisão, rodada 1 concluída com REQUER NOVA RODADA; Aguardando correções (rodada 1); aprovação humana pendente.
- `result`: `executed`
- `evidence`: achados e conferências desta rodada; cabeçalho e Próximo passo atualizados; handoff anterior preservado como histórico do rascunho. Gates documentais executados depois da gravação: validador de governança e `git diff --check`.
- `blockers`: R1-1. R1-2 a R1-4 são ressalvas. Primeira rodada, sem histórico de oscilação ou falta de progresso.

### Resposta do autor à rodada 1 — v2

- **R1-1 — Corrigido:** nota em versão futura com data nula, arquivo e comentário, critérios, teste e sequência de release e posterior registro de data comprovada; a PR de entrega encerra prospectivamente o ciclo antes desses passos. A versão efetiva será conferida, sem presumir publicação nem dispensar aprovações.
- **R1-2 — Corrigido:** risco explicita leitura adicional sequencial e falha do Início inteiro. Medições continuam em `/`; somente a prova D13 pode selecionar Por ativo. O ensaio e D13 não são gates obrigatórios.
- **R1-3 — Corrigido:** `niveis.ts` fica fora das alterações; os nomes antigos em comentários permanecem como referência às bases internas documentadas na KB-004.
- **R1-4 — Corrigido:** removida a linha em branco antes da linha 016 em `cycles.md`, sem alterar os ciclos anteriores.

### Rodada 2

- **Data:** 2026-10-30.
- **Versão revisada:** v2; base local `89e0666a219df1ee136d53055518f31884c31c9b`, com `_project/cycles.md` e o plano ainda sem commit.
- **Autor:** não declarado no plano v2 (correção da rodada 1).
- **Revisor:** Claude Code (Claude Opus 5.5).
- **Veredito:** `APTO COM RESSALVAS`.

#### Conferência das respostas à rodada 1

- **R1-1 — Atendido.** A decisão está explícita em "Decisões e autoridades": nota na próxima versão, com `publicadaEm: null`. O arquivo entrou em "Arquivos afetados", com critério de aceite, teste e os passos 6 de release e de registro posterior da data. A release e a data ficam fora do encerramento prospectivo, sem afirmar publicação. A divergência de versão leva a parar. O comentário de `src/lib/novidades.ts` (linhas 3-7), que hoje liga a data ao "encerramento do ciclo", vai ser ajustado sem mudar a lógica, o que é coerente com o ciclo leve.
- **R1-2 — Atendido.** O risco registra a leitura sequencial do catálogo, a possível latência e a falha do Início inteiro. A estratégia mantém as medições do ensaio em `/`, só a prova D13 pode pedir Por ativo, e o ensaio não é gate obrigatório.
- **R1-3 — Atendido.** `src/lib/financeiro/niveis.ts` fica fora das alterações, com justificativa em "Arquivos afetados".
- **R1-4 — Atendido.** No diff de `_project/cycles.md`, a linha `016` agora vem logo depois da `015`, dentro da tabela. As linhas `005` e `008` não mudaram.
- Nenhum achado corrigido reapareceu. Os bloqueadores caíram de 1 para 0.

#### Achados

- **R2-1 — Ressalva: os testes da nota futura devem passar a versão explicitamente, sem depender da versão do `package.json`.** A estratégia pede verificar que a nota fica oculta "enquanto a versão do build for anterior" e aparece quando a versão a alcança. A PR do release-please muda o `package.json`. Um teste que use `VERSAO_ATUAL` para afirmar que a nota está oculta passaria na entrega e falharia nos checks da PR de release. Seguir o padrão vigente em `src/lib/novidades.test.ts` (linhas 82-89), que chama `novidadesPublicadas` com versões literais, e em `tests/e2e/novidades.spec.ts`, que deriva a versão do arquivo. Pode ser atendida na implementação, sem nova versão do plano.
- **R2-2 — Ressalva: o registro posterior da data é chamado de "alteração documental", mas altera código da aplicação.** `src/lib/novidades.ts` está em `src/`. A mudança passa pelos gates de aplicação e, como toda demanda, começa pela triagem (`.agent/ai_behavior.md`, "Autorizações e pontos de aprovação"). Não existe um caminho documental próprio fora de ciclo para ela. A linha "Aprovar merge" da tabela de pontos de aprovação menciona a "PR posterior da data". Ela cobre só o merge daquela PR, não sua criação nem sua implementação. Quando a data for registrada, tratá-la como demanda nova, por triagem, ou incluí-la num ciclo posterior autorizado, como o próprio plano admite. Isso não afeta a entrega deste ciclo.

#### Itens atendidos e evidências

- Mantidos da rodada 1: template, origem no backlog, baseline, nível leve, barreiras G1 a G4, pontos de aprovação e decomposição. Os trechos alterados na v2 não contradizem nenhum deles.
- Padrão de novidades conferido por leitura: `novidadesPublicadas` filtra por `compararVersoes(...) <= 0` (`src/lib/novidades.ts`); `src/components/novidades.test.tsx` cobre "Data de publicação em confirmação" para `null`; o teste do histórico exige versões únicas, datas válidas ou `null` e notas sem identificadores técnicos. A nota prevista vai precisar respeitar essa última regra (sem `#N`, `BL-NNN`, SHA ou URL).
- Pontos de aprovação: a release e a data continuam fora do encerramento prospectivo, e cada merge tem sua frase. O modo contínuo `—` não cobre nada além do plano.
- G3: a v2 não traz dados do usuário, e esta revisão não leu nenhum arquivo de `local/`.
- `node scripts/validate-governance.mjs` e `git diff --check` foram executados depois da gravação desta rodada. Nenhum teste de aplicação foi executado: o código ainda não foi alterado.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 016 + revisar_plano + 016_plan/rodada-2 + v2`
- `effect_class`: `local_mutation`
- `state_before`: v2 Em Revisão, veredito da rodada 1 `REQUER NOVA RODADA`, respostas do autor registradas; Aguardando revisão (rodada 2); plano e reserva locais, sem commit.
- `state_after`: v2 Em Revisão, revisão formal concluída com `APTO COM RESSALVAS`; Aguardando aprovação do plano; aprovação humana pendente.
- `result`: `executed`
- `evidence`: conferência das quatro respostas e achados R2-1 e R2-2 desta rodada; cabeçalho e Próximo passo atualizados; handoffs anteriores preservados.
- `blockers`: nenhum. R2-1 e R2-2 são ressalvas para conferir na aprovação. Segunda rodada, com progresso e sem oscilação.

## Pós-mortem

- **Data de conclusão:** 2026-10-30 (encerramento prospectivo; vale depois do merge da PR da entrega)
- **Desvios:** nenhum relevante; a explicação do detalhe ganhou "dentro da classe aberta" para deixar clara a segunda base, sem mudar cálculo (ver a task).
- **Lições comprovadas:** nenhuma nova.
