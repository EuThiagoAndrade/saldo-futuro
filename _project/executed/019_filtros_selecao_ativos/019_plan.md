# Plano de Implementação — Filtros e seleção compartilhada de ativos

> **Ciclo:** `019`
> **Status:** `Concluído`
> **Versão:** `v1`
> **Data de criação:** 2026-11-05
> **Última atualização:** 2026-11-05
> **Tipo:** `feature`
> **Prioridade:** `P2`
> **Nível:** `leve`
> **Autorização inicial:** "Confirmo o nível leve e autorizo o plano do ciclo 019" em 2026-11-05
> **Modo contínuo:** `—`
> **Revisão formal:** `Concluída`
> **Veredito da revisão:** `APTO COM RESSALVAS`
> **Aprovação humana pós-revisão:** `Aprovada em 2026-11-05`
> **handoff_schema_version:** `2`

## Problema e contexto

A tela Ativos (`/ativos`) filtra por veículo, indexador, tributação, prazo, FGC e indicadores, mas não por classe da taxonomia nem por instituição, as duas dimensões que o usuário mais usa para conferir a carteira (BL-020). Nos formulários Novo lançamento e Transferências, o seletor de ativo mostra só o nome; dois ativos homônimos em instituições diferentes ficam indistinguíveis, e a escolha do ativo que recebe o lançamento, ou que é origem ou destino da transferência, fica incerta (BL-022). Por fim, ao abrir Editar a partir de uma lista filtrada e voltar, os filtros se perdem, e o prazo para resgate só compara com um limite (Exatamente ou Até), sem faixa com dois limites (BL-019).

O responsável já decidiu, no próprio backlog (BL-022): padronizar a consulta e a escolha de ativos com o mesmo componente e o mesmo conjunto de filtros em Ativos, Novo lançamento e Transferências; concluir primeiro o BL-020 e depois reutilizar o componente nos formulários; nos formulários, deixar recolhidos os grupos menos usados; cada opção exibe nome, instituição e classe; no lançamento se escolhe um ativo e, na transferência, o seletor é usado separadamente para origem e destino, cada seleção enviando o ID do ativo confirmado.

A triagem selecionou BL-020, BL-022 e BL-019 para um ciclo leve: o trabalho filtra e apresenta linhas já lidas sob RLS, sem cálculo financeiro, sem mudança de schema, de autenticação, de autorização ou de governança. A trilha curta não se aplica, porque há capacidade nova e mudança do contrato visual. O responsável confirmou o nível leve e autorizou este plano, sem modo contínuo.

**Interpretações registradas.** O BL-019 fala em "prazo até o vencimento"; o único filtro de prazo existente é "Prazo para resgate ou venda" (situação "Prazo em dias" com número e unidade), e é nele que a faixa entra. O BL-019 cita também "a paginação"; `/ativos` não tem paginação, então o que se preserva são a aba e os filtros da URL.

## Objetivo

Permitir encontrar e escolher o ativo certo pelas mesmas dimensões nas três telas: filtrar `/ativos` por classe e por instituição, reutilizar o mesmo conjunto de filtros e uma apresentação desambiguada (nome, instituição e classe) nos seletores de Novo lançamento e Transferências, preservar os filtros ao editar um ativo e permitir uma faixa com dois limites no prazo.

## Origem no backlog

- **BL-020 — Filtro de ativos por classe e por instituição na tela de consulta:** integral; acrescentar classe (nó da taxonomia) e instituição ao "Filtrar" de `/ativos`, na URL e nos critérios.
- **BL-022 — Seletor compartilhado de ativos em lançamentos e transferências:** integral; reutilizar o componente e o conjunto de filtros de Ativos nos seletores de Novo lançamento e Transferências (origem e destino separados), com nome, instituição e classe em cada opção e grupos menos usados recolhidos.
- **BL-019 — Preservação de filtros na edição e faixa de prazo com dois limites no filtro de ativos:** integral; preservar aba e filtros na ida e volta da edição e acrescentar a faixa com dois limites ao prazo. A "paginação" citada não existe em `/ativos` (ver Problema e contexto).

Snapshot em `_project/backlog.md` no commit da fila canônica `d7533c6ae904b3e1379f90028c3e6a5c84c25b8e`, presente em `main` e em `origin/main`; a fila `chore/backlog` está no mesmo commit, sem lote local pendente. Destino em preparação; os itens continuam Disponíveis. Depois da integração comprovada do ciclo, o retorno da seleção será registrado na fila por `ciclo 019`; sua publicação exige autorização separada.

## Contexto e baseline

Em `d7533c6`:

- `src/lib/telas/filtros-ativos.ts` lê os filtros da URL (`lerFiltros`), aplica-os às linhas de `lerAtivos` (`filtrarAtivos`), conta os campos (`camposComFiltro`), calcula opções em uso (`opcoesEmUso`) e monta os endereços das abas (`consultaDosFiltros`, `enderecoDaAba`). Regras vigentes (ciclos 017 e 018, D8 e D14 a D16): OU dentro do campo, E entre campos; "Não informado" exclusivo; com qualquer filtro, o trânsito fica de fora; erro de filtro mostra a mensagem e nenhuma lista.
- `src/components/ativos-consulta.tsx` tem `FiltrosDosAtivos`, um formulário GET sem JavaScript, em quatro grupos (Produto, Tributação, Resgate, Proteção e exposição), com `ListaSuspensaFiltro` para veículo e indexador.
- `src/app/(app)/ativos/page.tsx` já lê taxonomia, classes legadas e instituições para exibir classe e instituição. O link Editar vai para `/ativos/{id}/editar`, sem a consulta atual; `src/app/(app)/ativos/[id]/editar/page.tsx` volta para `/ativos` ou `/ativos?aba=desativados` pelo estado do ativo, e `editarAtivo` em `src/app/(app)/ativos/acoes.ts` redireciona para um desses dois endereços.
- `src/lib/telas/taxonomia.ts` monta a árvore (até três níveis) e expõe caminho e nome do nó, mas não os descendentes.
- `src/components/combobox-ativo.tsx` e `src/lib/telas/combobox.ts` implementam o seletor com busca (DESIGN.md 6.8): opções `{ id, nome }`, busca por trecho do nome. Novo lançamento (`src/components/formularios/novo-lancamento.tsx`) e Nova transferência (`src/components/formularios/nova-transferencia.tsx`) recebem `opcoesDeAtivo(...)`, só com nome; as páginas leem apenas `lerAtivos`.
- Testes: `src/lib/telas/filtros-ativos.test.ts`, `src/lib/telas/combobox.test.ts`, `tests/e2e/ativos-consulta.spec.ts` e `tests/e2e/seletor-ativo.spec.ts`. KB-003 registra que "os filtros não têm faixa com dois limites".
- Versão corrente `0.14.0`; nenhuma PR aberta.

## Escopo

### Dentro do escopo

- **BL-020:** filtros de classe e de instituição em `/ativos`, na URL, no contador, no "Limpar filtros", nas abas e nos critérios.
- **BL-022:** extração do conjunto de filtros num componente usado em dois modos (formulário GET em `/ativos`; estado no cliente nos formulários) e um seletor de ativo com filtros, usado em Novo lançamento e, separadamente, para origem e destino em Transferências; cada opção com nome, instituição e classe.
- **BL-019:** Editar e voltar preservam aba e filtros; faixa "Entre" no prazo, também disponível nos seletores dos formulários por usarem o mesmo conjunto.
- Testes, DESIGN.md, KB-003, notas de novidades da próxima versão (com `publicadaEm: null`) e encerramento prospectivo na última PR.

### Fora do escopo

- Banco, schema, migrações, RLS, autenticação, autorização, funções do banco e qualquer regra de cálculo financeiro.
- O filtro "Ativo" da lista de Lançamentos, os seletores de classe e instituição do formulário do ativo, Fechamento e Início: continuam como estão.
- Navegação de retorno de Novo lançamento e demais telas (BL-021) e ordenação do fechamento (BL-023).
- Paginação em `/ativos`, filtros novos além de classe e instituição, comparação "A partir de", conversão entre dias úteis e corridos e inferência de disponibilidade.
- Busca por instituição ou classe no texto do seletor: a busca continua por trecho do nome (DESIGN.md 6.8).
- Release e preenchimento da data das notas: ocorrem depois, por procedimento próprio, com aprovação de merge própria.

## Decisões e autoridades

Autoridades: `.agent/ai_behavior.md`, `_project/README.md`, DESIGN.md 6.7, 6.8 e 6.12, KB-003 e as decisões D8 e D14 a D16 dos ciclos 017 e 018, que continuam valendo. As decisões abaixo são **propostas do autor** para os pontos que o backlog deixa em aberto; a aprovação do plano as confirma, e o responsável pode trocá-las antes dela. Exemplos com nomes fictícios.

| Decisão | Proposta | Alternativa considerada |
| :-- | :-- | :-- |
| D1 — Controle de classe e instituição | Lista suspensa de múltipla escolha (`ListaSuspensaFiltro`), como veículo e indexador: OU dentro do campo, E com os demais, sem JavaScript em `/ativos`. | `select` de escolha única, mais simples, mas sem comparar duas instituições de uma vez. |
| D2 — Hierarquia da classe | Marcar um nó inclui o próprio nó e todos os descendentes: "Renda fixa" traz um ativo em "Renda fixa › Crédito bancário › CDB". As opções mostram o caminho completo, em ordem hierárquica. | Só o nó exato, o que deixaria "Renda fixa" quase sempre vazio. |
| D3 — Opções em uso e vazio | Como D14: instituições usadas por algum ativo comum (das duas abas), em ordem alfabética; nós usados por algum ativo comum e seus ancestrais, em ordem hierárquica; mais os marcados na URL. No fim, "Sem instituição" (instituição nula) e "Sem classe" (sem nó; inclui quem só tem a classe legada), exclusivos como "Não informado". ID desconhecido é erro de filtro, nunca Todos em silêncio. | Listar o catálogo inteiro. |
| D4 — Posição | Novo grupo **Classe e instituição**, primeiro do painel, antes de Produto. Cada campo conta uma vez no contador. | Acrescentar ao grupo Produto. |
| D5 — Seletor nos formulários | Abaixo de cada seletor, um "Filtrar ativos" recolhido; aberto, mostra Classe e instituição e, num "Mais filtros" também recolhido, os outros quatro grupos. Na transferência, origem e destino têm filtros independentes. Os filtros só restringem a lista oferecida: uma seleção já confirmada não muda e continua sendo o que se envia. Os campos do filtro não são enviados com o lançamento ou a transferência. | Painel único para os dois seletores da transferência. |
| D6 — Trânsito na transferência | Mantém D8 em todas as telas: com algum filtro, "Em trânsito" sai da lista; sem filtro, continua opção. | Manter "Em trânsito" sempre visível no seletor da transferência. |
| D7 — Opção desambiguada | Cada opção tem o nome na primeira linha e "Instituição · Classe" na segunda, em texto secundário, com quebra de linha e alvo de 44 px; ausente aparece como "Sem instituição" ou "Sem classe". Depois de confirmada, o campo mostra o nome e, logo abaixo, a mesma segunda linha do ativo confirmado. A busca continua pelo nome. | Mostrar "Nome — Instituição" dentro do campo de texto. |
| D8 — Retorno da edição | Editar leva a aba e os filtros correntes na consulta (`/ativos/{id}/editar?aba=…&classe=…`). "Voltar para Ativos" e o redirecionamento depois de salvar reconstroem o endereço só com `aba` e os nomes de `PARAMETROS_FILTRO`, por `enderecoDaAba`; qualquer outro parâmetro é descartado, nunca há URL livre (sem redirecionamento aberto). Sem aba na consulta, vale a regra atual pelo estado do ativo. | Guardar o retorno em cookie ou em armazenamento do navegador. |
| D9 — Faixa do prazo | Nova comparação **Entre**, com dois limites inteiros e inclusivos na mesma unidade: `prazo_resgate_dias` é o inicial e `prazo_resgate_dias_ate`, o final, que só aparece (por CSS) e só vale com Entre. Limite inicial maior que o final, final ausente com Entre ou final presente sem Entre são erro de filtro. Exemplo fictício: um ativo com 30 dias corridos entra em "Entre 30 e 90 dias corridos", fica fora de "Entre 31 e 90" e de "Entre 30 e 90 dias úteis". | Comparação "A partir de" (>=) em vez da faixa. |

A faixa do prazo compara números informados pelo usuário, como Exatamente e Até (D8 do ciclo 017); não calcula prazo, data nem valor. Se algum ponto passar a exigir regra de cálculo, isolamento ou schema, o trabalho para e é retriado.

**Esclarecimento de R1-2 em 2026-11-07:** o responsável escolheu manter a interação sem JavaScript e limpar os campos inativos ao aplicar. Se a pessoa mudar e voltar à opção anterior antes do envio sem JavaScript, o valor oculto permanece e volta a valer; com JavaScript a troca limpa imediatamente. URLs diretas com parâmetros avulsos continuam recusadas.

**Novidades:** cada PR acrescenta, em linguagem simples e sem identificadores técnicos, as notas da sua mudança à entrada da próxima versão em `src/lib/novidades.ts`, com `publicadaEm: null`. A versão esperada é `0.15.0` a partir de `0.14.0`; na preparação de cada PR, conferir a versão corrente e eventual PR de release aberta e, se não for possível associar a nota à próxima versão com segurança, parar para conciliar.

### Pontos de aprovação

| Ponto | Precondição | Cobre | Não cobre | Conferir |
| :-- | :-- | :-- | :-- | :-- |
| Revisão formal | Plano em `Rascunho` | Rodada de revisão com achados e veredito | Aprovação, issues ou implementação | Plano e seção de revisão |
| Aprovar plano ("aprovo o plano do ciclo 019") | Veredito apto e manifestação humana posterior | Plano e decisões D1 a D9; criação das três issues depois da apresentação e confirmação do payload; encerramento prospectivo na última PR | Implementação, merges, release ou retorno do backlog | Veredito, ressalvas e decisões |
| Autorizar implementação ("autorizo a implementação da issue #N") | Plano aprovado, issue aberta e a PR da issue anterior integrada | Branch, task, implementação, validação e publicação da PR daquela issue | Merge, outras issues ou mudança fora do plano | Issue, escopo e estado de `main` |
| Aprovar merge ("aprovo o merge da PR #N") | PR revisável e checks verdes no head corrente | Merge daquela PR | Outras PRs, release ou retorno do backlog | Diff e checks |

Cada merge tem aprovação própria. Não há ação humana externa nem verificação em produção previstas. Toda cadeia autorizada para em: dúvida de escopo ou de interpretação, necessidade de mudar banco, regra financeira ou isolamento, nova dependência, dado real em qualquer artefato, precondição não verificável, falha de checks sem causa clara ou falta de capacidade da ferramenta.

## Barreiras de domínio

| Barreira | Aplica-se? | Como o ciclo a atende ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Só filtragem e apresentação de linhas já lidas; nenhuma regra de eventos, fechamento, consolidação, retorno ou benchmark. A faixa do prazo compara inteiros informados, sem cálculo. Lançamento e transferência continuam validados pelo servidor e pelo banco como hoje. |
| G2 — isolamento por RLS | Não | Nenhuma tabela, política, função ou leitor novo; as telas passam a usar leitores já existentes (`lerTaxonomia`, `lerClassesLegadas`, `lerInstituicoes`) com a sessão do usuário. O seletor só emite IDs das opções recebidas e o servidor continua validando o ativo. |
| G3 — privacidade de dados | Sim | Testes, fixtures, prints e textos só com nomes fictícios; diff, task e PR revisados sem dados reais; nada de `local/` é lido. |
| G4 — migrações só acrescentam | Não | Nenhuma migração prevista; as existentes não são tocadas. |

## Estratégia de testes

- **Unitários (Vitest, `npm test`):** em `filtros-ativos.test.ts`, leitura e aplicação de classe (nó com descendentes, "Sem classe" com e sem legado, exclusividade, ID desconhecido) e instituição ("Sem instituição", exclusividade, ID desconhecido), combinação E com os demais campos, trânsito fora com filtro, contador, opções em uso com ancestrais; faixa Entre (limites inclusivos, mesma unidade, inicial maior que final, parâmetros parciais ou fora de Entre); reconstrução do endereço de retorno descartando parâmetros desconhecidos e endereços externos. Em `taxonomia`, descendentes de um nó. Em `combobox.test.ts`, opções com linha secundária sem mudar a política de seleção, e filtros que não desfazem a seleção confirmada.
- **E2e com Supabase local e dados fictícios:** em `ativos-consulta.spec.ts`, classe e instituição pela URL e pelo painel, nas duas abas, com Limpar e contador; faixa Entre; Editar e voltar (link e salvar) preservando aba e filtros, também de um ativo desativado. Em `seletor-ativo.spec.ts` ou spec nova, dois ativos homônimos em instituições fictícias distintas: a opção mostra instituição e classe, o filtro restringe a lista, o ID enviado é o do ativo confirmado, origem e destino com filtros independentes, trânsito conforme D6, e o lançamento e a transferência registrados para o ativo certo.
- **Acessibilidade e layout:** axe sem violações, sem rolagem horizontal e alvos de 44 px em 360 px e no desktop, nos painéis e listas abertos de `/ativos`, Novo lançamento e Transferências.
- **Gates antes de cada PR:** `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, os e2e afetados com Supabase local, `node --test scripts/validate-governance.test.mjs`, `node scripts/validate-governance.mjs`, `git diff --check` e `git status --short`. Resultados reais e limitações vão para a task; a CI roda a suíte completa e os testes de banco. Gate obrigatório falho ou indisponível impede publicar.

## Itens de implementação

### Item 1 — Filtro por classe e por instituição em Ativos (BL-020)

**Contexto:** classe e instituição já aparecem em cada linha de `/ativos`, mas não no "Filtrar".

**Ação técnica:** acrescentar `classe` e `instituicao` (repetíveis, por ID) a `PARAMETROS_FILTRO`, `FiltrosAtivos`, `lerFiltros`, `filtrarAtivos`, `algumFiltro` e `camposComFiltro`, com os valores especiais "Sem classe" e "Sem instituição"; função pura de descendentes na taxonomia; opções em uso conforme D3; grupo novo no painel (D4). A página passa os catálogos já lidos.

**Critérios de aceite:**

- [ ] Marcar um nó lista os ativos do nó e de seus descendentes; marcar duas instituições lista os ativos de qualquer uma; classe e instituição combinam por E entre si e com os demais filtros.
- [ ] "Sem classe" e "Sem instituição" selecionam só os ativos sem vínculo e não combinam com outras opções; ID desconhecido ou combinação inválida mostram o erro no lugar da lista.
- [ ] As opções mostram só o que está em uso (e o que está marcado na URL), na ordem de D3; o contador, as abas e "Limpar filtros" tratam os campos novos como os demais; o trânsito fica de fora com qualquer filtro.
- [ ] O painel continua funcionando sem JavaScript, sem violações de acessibilidade e sem rolagem horizontal em 360 px.

### Item 2 — Seletor compartilhado em Novo lançamento e Transferências (BL-022)

**Contexto:** homônimos em instituições diferentes são indistinguíveis nos seletores dos formulários.

**Ação técnica:** extrair os campos do "Filtrar" para um componente usado em modo GET (`/ativos`, sem mudar o comportamento) e em modo controlado no cliente (formulários), sem enviar os campos com o formulário que o contém; criar o seletor de ativo com filtros sobre `ComboboxAtivo`/`combobox.ts`, aplicando a mesma `filtrarAtivos` às opções; opções com nome, instituição e classe (D7); usar em Novo lançamento e, duas vezes e de forma independente, em Transferências (D5 e D6). As páginas passam a ler taxonomia, classes legadas e instituições com os leitores existentes.

**Critérios de aceite:**

- [ ] Em Novo lançamento e em Transferências, cada opção mostra nome, instituição e classe, e o ativo confirmado continua identificável depois de fechar a lista.
- [ ] Os mesmos filtros de `/ativos`, com as mesmas regras, restringem a lista de cada seletor; os grupos menos usados começam recolhidos; origem e destino filtram de forma independente.
- [ ] Filtrar não altera a seleção já confirmada, e o formulário envia somente o ID do ativo confirmado; nenhum campo de filtro chega às ações do servidor.
- [ ] Com dois homônimos fictícios em instituições distintas, o lançamento e a transferência são registrados para o ativo escolhido; a validação do servidor e as mensagens atuais continuam.
- [ ] `/ativos` mantém o comportamento do item 1; o filtro "Ativo" de Lançamentos não muda.

### Item 3 — Filtros preservados na edição e faixa no prazo (BL-019)

**Contexto:** a ida e volta pela edição perde a aba e os filtros, e o prazo só aceita um limite.

**Ação técnica:** Editar leva a consulta corrente; a página de edição e `editarAtivo` reconstroem o retorno conforme D8 (campo oculto com a consulta, filtrada pelos parâmetros conhecidos no servidor); comparação Entre com `prazo_resgate_dias_ate` conforme D9, no componente compartilhado.

**Critérios de aceite:**

- [ ] Abrir Editar a partir de uma lista filtrada (em qualquer aba) e voltar pelo link ou salvar retorna à mesma aba com os mesmos filtros e a mesma lista.
- [ ] O endereço de retorno só contém `/ativos` com `aba` e parâmetros de filtro conhecidos; um parâmetro desconhecido ou um endereço externo na consulta nunca vira destino.
- [ ] "Entre" inclui os dois limites, na mesma unidade, sem conversão; combinações inválidas da faixa mostram erro explícito; Exatamente e Até continuam como estão.
- [ ] A faixa também funciona nos seletores de Novo lançamento e Transferências.

## Arquivos afetados

Previstos: `src/lib/telas/filtros-ativos.ts` e teste; `src/lib/telas/taxonomia.ts` e teste; `src/lib/telas/combobox.ts` e teste; `src/lib/telas/leituras.ts` (opções do seletor); `src/components/ativos-consulta.tsx`; `src/components/combobox-ativo.tsx` e um componente novo do seletor com filtros em `src/components/`; `src/components/lista-suspensa.tsx`, se o modo controlado exigir; `src/components/formularios/novo-lancamento.tsx`, `nova-transferencia.tsx` e `editar-ativo.tsx`; `src/app/(app)/ativos/page.tsx`, `ativos/acoes.ts`, `ativos/[id]/editar/page.tsx`, `lancamentos/novo/page.tsx` e `transferencias/page.tsx`; `src/lib/novidades.ts`; `tests/e2e/ativos-consulta.spec.ts`, `seletor-ativo.spec.ts` e apoio, ou spec nova; `design-system/DESIGN.md` (6.7, 6.8 e 6.12); `_project/knowledge/KB-003_visao_produto_arquitetura.md`; este plano, `_project/cycles.md` e as tasks. A lista final é conferida no diff; outro arquivo só entra se necessário ao escopo aprovado.

## Decomposição em issues e PRs

Três issues `[FEATURE]`, uma PR cada, integradas em sequência, cada uma partindo de `main` já com a anterior:

1. **Item 1 (BL-020, issue #190)** — branch `feature/issue-190`; a primeira PR leva também este plano e a linha do ciclo em `cycles.md`.
2. **Item 2 (BL-022, issue #191)** — branch `feature/issue-191`; depende do item 1 integrado.
3. **Item 3 (BL-019, issue #192)** — branch `feature/issue-192`; depende do item 2 integrado (a faixa entra no componente compartilhado); a última PR atualiza DESIGN.md e KB-003 consolidados e traz o encerramento prospectivo (plano Concluído, tasks Concluídas, pasta em `executed/`, `cycles.md`), com a seção `## Encerramento` na task.

DESIGN.md e KB-003 podem receber em cada PR a parte da própria mudança; a última consolida. Cada PR fecha a sua issue.

## Dependências e blockers

BL-019, BL-020 e BL-022 existem em `main` (`d7533c6`). Revisão formal, aprovação, confirmação do payload e criação das issues vêm antes de qualquer implementação. Os e2e autenticados dependem do Supabase local. Nenhuma dependência nova de pacote está prevista; se surgir, para.

## Riscos, suposições e rollback

- **Componente em dois modos:** o mesmo conjunto de campos precisa funcionar como formulário GET sem JavaScript e como estado no cliente dentro de outro formulário, sem formulários aninhados e sem enviar os campos de filtro com o lançamento. Mitigação: separar a lógica pura (já compartilhada) da apresentação e testar o envio nos dois modos.
- **Formulários mais longos:** dois painéis na transferência aumentam a página; por isso tudo começa recolhido (D5). Conferir no celular.
- **Leituras a mais:** Novo lançamento e Transferências passam a ler taxonomia, classes legadas e instituições; mais latência e mais superfície de erro de leitura, tratada como erro da página, sem conjunto parcial.
- **Retorno da edição:** construir o destino a partir de entrada do usuário abre risco de redirecionamento aberto; D8 limita o destino a `/ativos` com parâmetros conhecidos e há teste para isso.
- **Trânsito sob filtro (D6):** quem filtra na transferência não vê "Em trânsito" até limpar os filtros; o texto do painel já avisa isso em `/ativos` e deve avisar também nos formulários.
- **Rollback:** reversão revisada da PR integrada; sem migração nem dado alterado.

## Sequência recomendada

1. Revisão formal do plano; correções e nova rodada quando necessário.
2. Com veredito apto, aprovação humana posterior; apresentação e confirmação do payload e criação das três issues.
3. Por issue, na ordem 1, 2, 3: autorização, branch, task, implementação, gates, PR, checks verdes, aprovação do merge e integração.
4. A última PR traz o encerramento prospectivo e a documentação viva consolidada.
5. Depois da integração comprovada, registrar o retorno de BL-019, BL-020 e BL-022 na fila por `ciclo 019`; publicar esse retorno exige pedido separado.
6. Release pela PR do release-please, com checks e aprovação própria; a data das notas é preenchida depois, por procedimento próprio.

## Referências

- `.agent/ai_behavior.md`; `_project/README.md`; `_project/cycles.md`; `.agent/workflows/rascunhar_plano.md`; `.agent/templates/plano_implementacao.md`.
- `_project/backlog.md` em `d7533c6`; `_project/knowledge/KB-003_visao_produto_arquitetura.md`; `design-system/DESIGN.md` 6.7, 6.8 e 6.12.
- Planos dos ciclos 017 (D8) e 018 (D13 a D16) em `_project/executed/`.
- Código e testes citados em Contexto e baseline.

## Rastreabilidade

| Campo | Valor |
| :-- | :-- |
| Issue(s) | [#190](https://github.com/EuThiagoAndrade/saldo-futuro/issues/190), [#191](https://github.com/EuThiagoAndrade/saldo-futuro/issues/191) e [#192](https://github.com/EuThiagoAndrade/saldo-futuro/issues/192) |
| PR(s) | [#193](https://github.com/EuThiagoAndrade/saldo-futuro/pull/193) (issue #190), [#195](https://github.com/EuThiagoAndrade/saldo-futuro/pull/195) (issue #191), integradas, e [#196](https://github.com/EuThiagoAndrade/saldo-futuro/pull/196) (issue #192 e encerramento prospectivo) |
| Branch(es) | `feature/issue-190`, `feature/issue-191` e `feature/issue-192` |
| Destino após conclusão | `_project/executed/019_filtros_selecao_ativos/019_plan.md` |

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 019 (leve)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

### Criação das issues #190, #191 e #192

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 019 + criar_issues + feature/BL-020-BL-022-BL-019 + v1`
- `effect_class`: `remote_mutation`
- `state_before`: plano v1 aprovado após veredito `APTO COM RESSALVAS`; ciclo 019 em Planejamento; payload apresentado e aguardando confirmação; buscas no GitHub por BL-020, BL-022 e BL-019 sem issues correspondentes.
- `state_after`: payload confirmado pelo responsável ("Pode criar as issues do plano do ciclo 019") em 2026-11-05; issues #190, #191 e #192 abertas no GitHub; plano e registro do ciclo atualizados localmente, sem commit; implementação ainda não autorizada.
- `result`: `executed`
- `evidence`: issues [#190](https://github.com/EuThiagoAndrade/saldo-futuro/issues/190), [#191](https://github.com/EuThiagoAndrade/saldo-futuro/issues/191) e [#192](https://github.com/EuThiagoAndrade/saldo-futuro/issues/192) conferidas abertas via `gh issue view`; corpos correspondem aos payloads do Issue Form Feature com substituição dos números observados.
- `blockers`: autorização explícita de implementação para a issue #190 ("autorizo a implementação da issue #190").

### Aprovação do plano e preparação das issues

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 019 + aprovar_plano + 019_plan + v1/rodada-1`
- `effect_class`: `local_mutation`
- `state_before`: ciclo 019 em Planejamento; plano v1 Em Revisão, rodada 1 `APTO COM RESSALVAS` (Antigravity, Gemini 4 Argon), aprovação pendente; plano e reserva locais sem commit.
- `state_after`: plano v1 Aprovado por manifestação humana posterior ao veredito, em 2026-11-05, com as decisões D1 a D9 confirmadas e as ressalvas R1-1 e R1-2 preservadas para a implementação; ciclo permanece em Planejamento; payload apresentado, sem issue criada e sem implementação autorizada.
- `result`: `executed`
- `evidence`: frase "aprovo o plano do ciclo 019" recebida em 2026-11-05, depois da rodada 1; `gh issue list --state all --search "BL-019 OR BL-020 OR BL-022"` sem resultado; Issue Form `.github/ISSUE_TEMPLATE/feature_request.yml` lido; payload abaixo.
- `blockers`: confirmação do payload antes da criação das issues, conforme `.agent/workflows/criar_issues.md`.

### Payload proposto das issues

**Confirmação:** "Pode criar as issues do plano do ciclo 019" em 2026-11-05. Conteúdo criado como issues [#190](https://github.com/EuThiagoAndrade/saldo-futuro/issues/190), [#191](https://github.com/EuThiagoAndrade/saldo-futuro/issues/191) e [#192](https://github.com/EuThiagoAndrade/saldo-futuro/issues/192); o payload abaixo fica preservado como histórico.

Três issues do Issue Form Feature, criadas na ordem abaixo. As ressalvas R1-1 e R1-2 da revisão entraram como critérios das issues 2 e 3. "Issue do item N" foi substituída pelo número observado no GitHub na criação.

#### Issue 1 — `[FEATURE] Filtrar ativos por classe e por instituição (BL-020)`

**Contexto:** Em `/ativos`, o "Filtrar" não permite escolher classe da taxonomia nem instituição, as dimensões mais usadas para conferir a carteira.

**Escopo:** Acrescentar classe e instituição (repetíveis, por ID) à URL, à leitura, à aplicação, ao contador, às abas e ao "Limpar filtros", num grupo "Classe e instituição" no topo do painel, com listas suspensas de múltipla escolha (D1 a D4 do plano). Marcar um nó inclui seus descendentes; "Sem classe" e "Sem instituição" são exclusivos; opções só em uso. Fora: banco, schema, RLS, cálculo, formulários de lançamento e transferência.

**Critérios de aceite:**

- [ ] Um nó lista os ativos dele e dos descendentes; duas instituições combinam por OU; classe e instituição combinam por E entre si e com os demais filtros.
- [ ] "Sem classe" e "Sem instituição" selecionam só os sem vínculo e não combinam com outras opções; ID desconhecido ou combinação inválida mostram o erro no lugar da lista.
- [ ] Opções só em uso e marcadas na URL, na ordem de D3; contador, abas e "Limpar filtros" tratam os campos novos como os demais; trânsito fora com qualquer filtro.
- [ ] Painel sem JavaScript, sem violações de acessibilidade e sem rolagem horizontal em 360 px.

**Ciclo e plano relacionados:** Ciclo 019 — `_project/executed/019_filtros_selecao_ativos/019_plan.md` (v1 aprovado; segue nesta primeira PR).

**Dependências, riscos e autorizações:** Primeira do ciclo; a PR leva também o plano e `cycles.md`. Implementação exige "autorizo a implementação da issue #N"; merge exige checks verdes e aprovação própria. Só dados fictícios.

#### Issue 2 — `[FEATURE] Seletor compartilhado de ativos em lançamentos e transferências (BL-022)`

**Contexto:** Em Novo lançamento e Transferências, ativos homônimos em instituições diferentes são indistinguíveis no seletor.

**Escopo:** Extrair o conjunto de filtros de `/ativos` para um componente usado em modo GET e em modo controlado no cliente; criar o seletor de ativo com filtros e opções com nome, instituição e classe; usar em Novo lançamento e, de forma independente, para origem e destino em Transferências (D5 a D7). Fora: filtro "Ativo" de Lançamentos, seletores do formulário do ativo, busca por instituição ou classe, banco e cálculo.

**Critérios de aceite:**

- [ ] Cada opção mostra nome, instituição e classe, e o ativo confirmado continua identificável depois de fechar a lista; "Em trânsito" tem segunda linha própria, sem aparecer como cadastro incompleto (R1-1).
- [ ] Os mesmos filtros e regras de `/ativos` restringem cada seletor, com opções em uso calculadas só sobre os ativos selecionáveis daquele formulário (R1-1); grupos menos usados recolhidos; origem e destino independentes.
- [ ] Filtrar não altera a seleção confirmada; o formulário envia só o ID do ativo; nenhum campo de filtro chega às ações do servidor.
- [ ] Com dois homônimos fictícios em instituições distintas, lançamento e transferência são registrados para o ativo escolhido; validação e mensagens do servidor mantidas.
- [ ] `/ativos` mantém o comportamento da issue #190; auxiliares e specs e2e afetados pela segunda linha (inclusive `carteira.spec.ts`) ajustados (R1-1).

**Ciclo e plano relacionados:** Ciclo 019 — `_project/executed/019_filtros_selecao_ativos/019_plan.md` (v1 aprovado).

**Dependências, riscos e autorizações:** Depende da issue #190 integrada. Riscos: componente em dois modos sem formulário aninhado, formulários mais longos, leituras extras nas duas páginas. Implementação e merge com autorizações próprias. Só dados fictícios.

#### Issue 3 — `[FEATURE] Preservar filtros na edição e faixa de prazo no filtro de ativos (BL-019)`

**Contexto:** Ir à edição de um ativo e voltar perde a aba e os filtros; o prazo para resgate só aceita um limite.

**Escopo:** Editar leva a consulta corrente, e voltar ou salvar reconstroem `/ativos` só com `aba` e parâmetros conhecidos (D8); comparação "Entre" com dois limites inclusivos na mesma unidade (D9), também nos seletores dos formulários. Consolidar DESIGN.md e KB-003 e trazer o encerramento prospectivo do ciclo. Fora: paginação, "A partir de", conversão de unidades.

**Critérios de aceite:**

- [ ] Editar a partir de lista filtrada, em qualquer aba, e voltar pelo link ou salvar retorna à mesma aba, filtros e lista.
- [ ] O retorno só contém `/ativos` com `aba` e parâmetros de filtro conhecidos; parâmetro desconhecido ou endereço externo nunca vira destino.
- [ ] "Entre" inclui os dois limites, na mesma unidade; combinações inválidas mostram erro; Exatamente e Até mantidos; a faixa funciona também nos seletores dos formulários.
- [ ] Campos condicionais inativos do prazo não são enviados nem mantidos ao trocar a situação ou a comparação, sem causar erro indevido; parâmetros avulsos na URL continuam recusados (R1-2).
- [ ] Documentação viva consolidada e encerramento prospectivo do ciclo 019.

**Ciclo e plano relacionados:** Ciclo 019 — `_project/executed/019_filtros_selecao_ativos/019_plan.md` (v1 aprovado).

**Dependências, riscos e autorizações:** Depende da issue #191 integrada. Risco de redirecionamento aberto mitigado por D8 e teste. Implementação e merge com autorizações próprias; o encerramento é autorizado pela aprovação do plano. Só dados fictícios.

### Rascunho v1

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 019 + rascunhar_plano + 019_plan + v1`
- `effect_class`: `local_mutation`
- `state_before`: próximo ciclo `019`, sem plano nem reserva do 019; `main` e `origin/main` em `d7533c6`; fila `chore/backlog` no mesmo commit; triagem de BL-020, BL-022 e BL-019 feita e nível leve confirmado com a frase de entrada em 2026-11-05.
- `state_after`: plano v1 em `Rascunho`; ciclo 019 reservado em `Planejamento` e próximo ciclo `020` em `_project/cycles.md`; alterações locais sem commit; revisão, aprovação, issues e implementação pendentes.
- `result`: `executed`
- `evidence`: este arquivo e a linha do ciclo 019 em `_project/cycles.md`; IDs de origem presentes em `main` no commit `d7533c6`; validador de governança executado depois da gravação.
- `blockers`: nenhum para a revisão.

## Revisão crítica

### Rodada 1

- **Data:** 2026-11-05
- **Versão revisada:** `v1`; base local `d7533c6ae904b3e1379f90028c3e6a5c84c25b8e`, com `_project/cycles.md` e o plano ainda sem commit.
- **Autor:** não declarado no plano v1 (workflow `rascunhar_plano`).
- **Revisor:** Antigravity (Gemini 4 Argon)
- **Veredito:** `APTO COM RESSALVAS`

#### Achados

- **R1-1 — Ressalva (Item 2, D7): apresentação de `"Em trânsito"`, escopo de `opcoesEmUso` nos formulários e impacto da segunda linha nas opções sobre o auxiliar de e2e.**
  1. Em `Transferências` (sem filtro ativo, D6), `"Em trânsito"` (`sistema === "transito"`) integra as opções (`ativosTransferiveis` em `src/lib/telas/leituras.ts:104`). Pela decisão D8 do ciclo `017` e por `DESIGN.md` 6.7, `"Em trânsito"` não recebe instituição nem classe e não deve ser rotulado como cadastro incompleto (`"Sem instituição · Sem classe"`). Na implementação do Item 2, dar a `"Em trânsito"` segunda linha própria (por exemplo, `"Ativo de sistema"`, como em `/ativos`) ou omitir a segunda linha para ele, e explicitar na atualização do `DESIGN.md` 6.8 se a classe exibida na segunda linha da opção usa o nome do nó (`classeDoAtivo`, como na lista de `/ativos`) ou o caminho.
  2. Em `/ativos`, `opcoesEmUso` considera os ativos comuns das duas abas (`Em uso` e `Desativados`). Nos seletores de `Novo lançamento` e `Transferências`, só ativos em uso são selecionáveis; convém calcular `opcoesEmUso` sobre os ativos comuns selecionáveis daquele formulário (`a.ativo && a.sistema === null`), para não oferecer opção presente apenas em ativo desativado.
  3. O auxiliar `escolherAtivo` (`tests/e2e/apoio/combobox.ts:6`), usado também por `tests/e2e/carteira.spec.ts` (linhas 51, 66 e 67), localiza a opção por `getByRole("option", { name: nome, exact: true })`. Com a segunda linha dentro de `<li role="option">`, o nome acessível da opção passa a incluir `"Instituição · Classe"`; ao ajustar `tests/e2e/apoio/combobox.ts` e `tests/e2e/seletor-ativo.spec.ts` no Item 2, conferir também `tests/e2e/carteira.spec.ts`.
- **R1-2 — Ressalva (Itens 2 e 3, D5 e D9): campos condicionais ocultos do prazo ao alternar a situação ou a comparação.**
  Em `src/components/ativos-consulta.tsx:162`, `Comparação`, `Dias` e `Unidade` ficam ocultos apenas por CSS (`group-has-[option[value=prazo]:checked]/prazo:grid`), preservando seus valores no DOM. No Item 3 (D9), `prazo_resgate_dias_ate` segue o mesmo padrão (`só aparece por CSS e só vale com Entre`), enquanto `lerFiltros` recusa `prazo_resgate_dias_ate` presente sem `Entre` (assim como recusa `comparacao`, `dias` e `unidade` fora de `"Prazo em dias"`). Se o usuário aplicar `"Entre"` (preenchendo `prazo_resgate_dias_ate`) e depois reabrir o painel e trocar `Comparação` para `"Até"` ou `"Exatamente"` (ou trocar a situação para `"No vencimento"`), o campo oculto por CSS enviará o valor residual no GET de `/ativos` (ou o manterá no estado controlado dos formulários), causando erro de filtro indevido. Na implementação dos Itens 2 e 3, garantir que os campos condicionais inativos não sejam enviados ou sejam limpos/ignorados na interface ao trocar a opção pai, mantendo a recusa estrita em `lerFiltros` para parâmetros avulsos na URL.

#### Itens atendidos e evidências

- **Template e cabeçalhos:** estrutura integral de `.agent/templates/plano_implementacao.md` atendida, com `Nível: leve`, `Autorização inicial` de 2026-11-05, `Modo contínuo: —` e `handoff_schema_version: 2`. Reserva do ciclo `019` em `Planejamento` e `Próximo ciclo: 020` conferidos em `_project/cycles.md`.
- **Origem no backlog:** BL-020, BL-022 e BL-019 conferidos em `_project/backlog.md` no commit `d7533c6ae904b3e1379f90028c3e6a5c84c25b8e` (`HEAD` de `main`, `origin/main` e `chore/backlog` no worktree `C:/Programas/saldo-futuro-backlog`, sem lote local pendente), todos em estado `Disponível`. A sequência acordada pelo responsável no Registro do BL-022 (concluir primeiro BL-020 e reutilizar o componente em `Novo lançamento` e `Transferências`, com grupos menos usados recolhidos e origem/destino independentes) e as interpretações do BL-019 (faixa em `"Prazo para resgate ou venda"` e preservação de aba e filtros na ausência de paginação em `/ativos`) estão fielmente refletidas.
- **Baseline e fatos verificados por leitura:** conferidos `src/lib/telas/filtros-ativos.ts`, `src/components/ativos-consulta.tsx`, `src/app/(app)/ativos/page.tsx`, `src/app/(app)/ativos/[id]/editar/page.tsx`, `src/app/(app)/ativos/acoes.ts`, `src/lib/telas/taxonomia.ts`, `src/components/combobox-ativo.tsx`, `src/lib/telas/combobox.ts`, `src/components/formularios/{novo-lancamento,nova-transferencia,editar-ativo}.tsx`, `src/app/(app)/lancamentos/novo/page.tsx`, `src/app/(app)/transferencias/page.tsx`, `src/lib/telas/leituras.ts`, `src/components/lista-suspensa.tsx`, `src/lib/novidades.ts` (`0.14.0` publicada em 2026-10-31), `package.json` (`version: "0.14.0"`), testes unitários e e2e citados, `DESIGN.md` (6.7, 6.8 e 6.12) e `KB-003` (linha 246). Nenhuma PR aberta no GitHub.
- **Nível leve, escopo e decisões D1 a D9:** classificação em ciclo leve correta (sem cálculo financeiro, mudança de schema, migração, RLS, autenticação, autorização ou governança; fora da trilha curta por adicionar capacidade e alterar o contrato visual). As decisões D1 a D9 estão claramente delimitadas como propostas do autor sujeitas à confirmação ou troca pelo responsável na aprovação do plano, com alternativas e exemplos fictícios.
- **Decomposição e pontos de aprovação:** três issues `[FEATURE]` sequenciais (Item 1 → BL-020 com o plano e `cycles.md` na primeira PR; Item 2 → BL-022; Item 3 → BL-019 com consolidação de `DESIGN.md` e `KB-003` e encerramento prospectivo na última PR), aderentes ao fluxo de ciclo leve de `_project/README.md`. Tabela de pontos de aprovação completa, com frases canônicas e condições de parada.
- **Barreiras G1 a G4:** G1 não aplicável (apenas filtragem e apresentação; faixa `"Entre"` compara inteiros informados na mesma unidade, sem cálculo de datas ou conversão); G2 não aplicável (reutiliza leitores existentes `lerAtivos`, `lerTaxonomia`, `lerClassesLegadas` e `lerInstituicoes` sob a sessão do usuário); G3 aplicável e atendida (apenas dados e nomes fictícios; zero leitura de `local/`); G4 não aplicável (sem migrações).

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 019 + revisar_plano + 019_plan/rodada-1 + v1`
- `effect_class`: `local_mutation`
- `state_before`: `_project/executed/019_filtros_selecao_ativos/019_plan.md` em `v1`, inicialmente em `Status: Rascunho` (`Aguardando revisão (rodada 1)`) e já atualizado nesta sessão com a Rodada 1 (`Status: Em Revisão`, `Revisão formal: Concluída`, `Veredito da revisão: APTO COM RESSALVAS`); plano e reserva em `_project/cycles.md` locais, sem commit.
- `state_after`: mesma Rodada 1 preservada e reconciliada sem duplicação em `_project/executed/019_filtros_selecao_ativos/019_plan.md` (`Status: Em Revisão`, `Revisão formal: Concluída`, `Veredito da revisão: APTO COM RESSALVAS`, `Aprovação humana pós-revisão: Pendente`, `## Próximo passo` em `Aguardando aprovação do plano`).
- `result`: `already_executed_and_reconciled`
- `evidence`: inspeção somente leitura dos arquivos de código, testes, backlog, `DESIGN.md`, `KB-003` e estado Git/GitHub citados na revisão; localização pela `logical_key` existente; execução dos gates mínimos de governança após a gravação.
- `blockers`: nenhum bloqueador técnico ou de governança. R1-1 e R1-2 são ressalvas não bloqueantes para conferência na aprovação e atendimento na implementação; aguarda aprovação humana do plano e das decisões propostas D1 a D9.

## Pós-mortem

- **Data de conclusão:** 2026-11-07 (prospectiva, condicionada ao merge da última PR)
- **Desvios:** Sem JavaScript, a limpeza dos campos inativos ocorre ao aplicar, conforme decisão do responsável em 2026-11-07; com JavaScript ocorre ao trocar.
- **Lições comprovadas:** —
