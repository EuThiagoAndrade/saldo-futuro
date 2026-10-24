# Ideação — 012: Metadados descritivos e classificação de ativos

> **Ciclo:** `012`
> **Estado:** `Ideação`
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 012" em 2026-10-23
> **Criado em:** 2026-10-23
> **Última atualização:** 2026-10-23
> **handoff_schema_version:** `2`

## Problema

O cadastro de ativos guarda só o nome e o tipo de ajuste no fechamento (`rendimento` ou `marcacao`). Sem outros atributos, o usuário não consegue registrar a classe de alocação de cada ativo (renda fixa, renda variável, cripto), a instituição onde ele está, se é reserva de emergência ou se é previdência. O BL-009 pede esses atributos sem deixar o cadastro mais pesado no celular.

Decisões do responsável já tomadas na triagem (2026-10-23):

- **Só descritivos.** Os campos novos não entram em nenhum cálculo: fechamento, consolidação, Modified Dietz, benchmarks e distribuição continuam iguais.
- **Carga retroativa fora do ciclo.** Preencher os campos dos ativos que já existem, a partir dos dados de origem da migração, é um passo local e manual do responsável. Nada disso vai para o repositório.
- **Recorte.** O ciclo cobre só o BL-009. A PTAX (BL-008) fica para a triagem própria; a decisão sobre ela (último valor do mês, retorno entre fechamentos) está registrada lá e não aqui.

O nível é completo porque toda escrita em `public.ativos` passa por funções `security definer` (G2) e porque a entidade ativo ganha conceitos de domínio novos (significado do schema). O modo contínuo é proibido.

## Origem no backlog

Snapshot da seleção de 2026-10-23. Fila lida no worktree `C:\Programas\saldo-futuro-backlog`, branch `chore/backlog`, no commit `5298473`. Esse commit está **publicado** em `main` (PR #124) e a fila não tem commits locais pendentes. Destino em preparação: nenhum item foi alterado por esta ideação.

| ID | Síntese da necessidade | Parcela selecionada |
| :-- | :-- | :-- |
| BL-009 | Enriquecer o cadastro de ativos com atributos descritivos (classe de alocação, instituição e detalhes opcionais: previdência, liquidez imediata ou reserva, exposição cambial e isenção de IR), sem tornar o cadastro no celular mais pesado | Parcial: os campos descritivos, com cadastro, edição e exibição. **Fica no Restante:** a carga retroativa (passo local e manual do responsável, fora do ciclo) e as visões analíticas por classe ou instituição (dependem de cálculo, fora desta decisão) |

Referência: `_project/backlog.md` no commit da fila `5298473`. O snapshot não é reescrito por edições futuras do backlog. O retorno em BL-009 só ocorre depois da integração comprovada do destino em `main`, por `ciclo 012`; o item fica `Disponível`, com o Restante acima, e a publicação do retorno continua separada.

## Contexto e evidências

### Fatos observados

Inspeção local de 2026-10-23 em `EuThiagoAndrade/saldo-futuro`, `main` em `b35679f`. Nenhum dado real foi lido; `local/` não foi aberto.

- **Schema.** `public.ativos` (`supabase/migrations/20261014185205_carteira.sql:18-35`) tem `nome`, `tipo_ajuste`, `sistema`, `ativo`, `criado_em` e `desativado_em`. O ativo de sistema "Em trânsito" tem `sistema = 'transito'` e `tipo_ajuste` nulo, por restrição.
- **Leitura e escrita.** O usuário autenticado só tem `select`, pela política `ativos_select_own` (`user_id = auth.uid()`). Não há `insert` nem `update` pela Data API (D13). Toda escrita passa por funções `security definer` que tomam primeiro a trava `private.travar_carteira()`: hoje, para ativos, só `criar_ativo(p_nome, p_tipo_ajuste)` e `desativar_ativo(p_ativo)`. **Não existe função para editar um ativo.**
- **Testes de banco.** `supabase/tests/database/04_carteira.test.sql` prova que o usuário não insere nem altera `ativos` direto, que B não lê os ativos de A e que o administrador não lê ativos alheios.
- **Telas.** `/ativos` tem as abas "Em uso" e "Desativados" (lista densa no celular, tabela no desktop). O cadastro fica em `/ativos/novo` (`src/components/formularios/novo-ativo.tsx`), com nome e tipo de ajuste em rádio, e chama `criar_ativo` por `src/app/(app)/ativos/acoes.ts`. Não há página de detalhe nem de edição do ativo.
- **Distribuição.** `src/lib/financeiro/distribuicao.ts` agrupa por ativo (id, nome e saldo) e não lê nenhum atributo descritivo. Pela decisão "só descritivos", continua assim.
- **KB-004, seção 4.1.** Descreve o ativo com o tipo de ajuste (P9) e o trânsito (D3). Nenhum cálculo da KB depende de classe, instituição ou dos indicadores propostos.
- **Origem da migração.** O tipo `AtivoOrigem` (`src/lib/migracao/tipos.ts`) lê da origem só `descricao`, `classificacao` e `ativo`. Se a origem tem outros atributos descritivos não foi verificado, porque isso exigiria abrir `local/`; a carga retroativa está fora do ciclo.
- **Design system.** `design-system/DESIGN.md` já usa `<details>` para conteúdo retrátil (Outros da rosca, 6.13) e tem o padrão de combobox com busca para ativos (6.8).

### Hipóteses (a confirmar no plano)

- Os campos novos são colunas de `public.ativos`, todos opcionais (nulos), acrescentados por migração nova e aditiva (G4). As linhas existentes ficam com "não informado".
- As políticas de leitura atuais cobrem as colunas novas sem mudança, porque filtram a linha inteira por `user_id`.
- A escrita precisa de: (a) uma nova assinatura de `criar_ativo` com os campos opcionais, retirando a antiga com seus grants; e (b) uma função nova de edição só dos campos descritivos, `security definer`, com a trava e o filtro por `auth.uid()`. Nome e tipo de ajuste continuam não editáveis.
- O trânsito não recebe campos descritivos, por restrição no banco.
- "Ocultar valores" não precisa de mudança, porque os campos não são quantias.

## Resultado desejado

- Cadastro em `/ativos/novo` com nome e tipo de ajuste, como hoje, mais classe e instituição como campos principais e uma seção retrátil "Mais detalhes" com os indicadores opcionais.
- Um caminho no app para preencher ou corrigir os campos descritivos de um ativo existente, já que a carga retroativa não faz parte do ciclo.
- Classe e instituição visíveis na tela de ativos.
- Migração aditiva, funções com isolamento provado por teste de banco (B não edita o ativo de A; o admin não edita ativos alheios), testes unitários e e2e com nomes fictícios.
- KB-003 e KB-004 (4.1) atualizadas para dizer que os campos são descritivos e não entram em cálculo.

## Alternativas

**A — Instituição**
- **A1 — Texto livre por ativo.** Simples, mas a mesma instituição pode aparecer com grafias diferentes.
- **A2 — Entidade própria (`instituicoes` por usuário).** Nomes consistentes, mas exige tabela nova com RLS, cadastro e edição: mais escopo e mais superfície G2.
- **A3 — Texto livre com sugestões** das instituições que o próprio usuário já usou (lidas das próprias linhas). Recomendada: mantém o modelo simples e reduz grafias diferentes.

**B — Classe de alocação**
- **B1 — Lista fechada curta** (enum ou restrição `check`), por exemplo: renda fixa, renda variável, fundos, cripto e outros. Recomendada: dá base estável para uma visão por classe no futuro.
- **B2 — Texto livre.** Flexível, mas impede agrupar depois sem limpar os dados.

**C — Indicadores (previdência, liquidez imediata ou reserva, exposição cambial e isenção de IR)**
- **C1 — Três estados (sim, não, não informado)**, em coluna booleana nula. Recomendada: os ativos que já existem não ficam marcados como "não" sem que ninguém tenha dito isso.
- **C2 — Booleano com padrão "não".** Mais simples, mas confunde "não" com "não informado".

**D — Edição dos ativos existentes**
- **D1 — Página de edição `/ativos/[id]/editar`**, só com os campos descritivos, aberta a partir da lista. Recomendada.
- **D2 — Edição em linha na própria lista.** Pesa na lista densa do celular.
- **D3 — Sem edição.** Os ativos atuais só receberiam os campos pela carga manual; não recomendada.

## Riscos e restrições

- **G2.** As funções novas são `security definer`: precisam da trava, do filtro por `auth.uid()`, de `search_path = ''`, dos grants corretos e de teste de isolamento. Trocar a assinatura de `criar_ativo` exige retirar a antiga sem deixar sobrecarga exposta.
- **G3.** O nome da instituição é dado do usuário. Fixtures, seeds, e2e, prints e textos usam só nomes fictícios. Nenhum artefato menciona dados de `local/`.
- **G4.** Só migração nova e aditiva; a do ciclo `003` não é editada.
- **G1.** Não se aplica, pela decisão "só descritivos". Se alguma proposta do plano passar a usar classe ou instituição em cálculo (por exemplo, distribuição por classe), o trabalho para e volta à triagem.
- **Isenção de IR e exposição cambial** são termos com peso tributário e financeiro. Como campos descritivos, valem só como anotação do usuário e o app não tira conclusão deles; o texto da tela precisa deixar isso claro.
- **Aplicar a migração em produção** é ação externa do responsável e nunca é coberta pelo modo contínuo.
- **Carga retroativa manual.** Mexe em dados de produção fora do repositório e fora da cobertura do ciclo. Se o responsável quiser ajuda do agente nisso, o pedido e a autorização são separados.

## Perguntas em aberto

1. Instituição: A1, A2 ou A3?
2. Classe: B1 ou B2? Se B1, quais valores entram na lista?
3. Indicadores: C1 ou C2? Os quatro (previdência, liquidez imediata ou reserva, exposição cambial e isenção de IR) entram todos?
4. Edição: D1, D2 ou D3? Ativos desativados também podem ser editados?
5. Na tela de ativos, classe e instituição aparecem nas duas abas? É preciso filtrar por elas, ou isso fica no Restante?
6. Confirma que as visões analíticas por classe ou instituição ficam no Restante do BL-009?

## Fora do escopo

- Qualquer cálculo com os campos novos (G1): distribuição, rentabilidade ou consolidação por classe ou instituição.
- A carga retroativa dos ativos existentes e qualquer script versionado para ela.
- Editar nome ou tipo de ajuste de um ativo existente.
- O BL-008 (PTAX) e os demais itens do backlog.
- O retorno em BL-009 no backlog antes da integração do ciclo.

## Critérios para iniciar o planejamento

- Respostas às perguntas 1 a 4, ao menos.
- Confirmação do Restante do BL-009 (pergunta 6).
- Issues previstas, a refinar no plano: (1) migração, funções e testes de banco; (2) cadastro, edição e exibição nas telas, com e2e; e documentação viva (KB-003, KB-004) na última entrega.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Ideação registrada — ciclo 012 (completo)
Quem: Responsável
Conferir: perguntas 1 a 6 da seção "Perguntas em aberto" e as alternativas A, B, C e D
Diga: "autorizo o rascunho do plano do ciclo 012"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 012 + idear + metadados_classificacao_ativos + b35679f`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `012` livre em `cycles.md` (próximo ciclo `012`); `main` em `b35679f`; fila `chore/backlog` em `5298473`, sem commits locais.
- `state_after`: ciclo `012` reservado como `Ideação`; ideação criada, não versionada; fila do backlog sem alteração.
- `result`: `executed`
- `evidence`: este arquivo; `_project/cycles.md`; `git worktree list`; `git log` da fila (`5298473`); leitura de `supabase/migrations/20261014185205_carteira.sql`, `supabase/tests/database/04_carteira.test.sql`, `src/components/formularios/novo-ativo.tsx`, `src/app/(app)/ativos/acoes.ts`, `src/lib/financeiro/distribuicao.ts`, `src/lib/migracao/tipos.ts` e KB-004 (4.1).
- `blockers`: nenhum para a ideação; as perguntas 1 a 4 e 6 bloqueiam o rascunho do plano.
