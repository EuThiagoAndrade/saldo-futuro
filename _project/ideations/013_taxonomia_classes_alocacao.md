# Ideação — 013: Taxonomia de classes de ativos e alocação por classe macro

> **Ciclo:** `013`
> **Estado:** `Ideação`
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 013" em 2026-10-26
> **Criado em:** 2026-10-26
> **Última atualização:** 2026-10-26
> **handoff_schema_version:** `2`

## Problema

Desde o ciclo `012`, a classe de alocação do ativo é uma lista plana em `public.classes_ativo`, criada, renomeada e excluída por cada usuário. Por isso os nomes divergem entre usuários, a lista mistura classe com veículo ("Fundos" é veículo e pode carregar renda fixa ou renda variável), e o produto não tem uma visão do patrimônio por classe. O BL-014 pede duas coisas:

1. uma classificação comum a todos os usuários, em até três níveis (classe macro, subclasse e tipo), mantida pelo sistema e só de leitura para o usuário, sem deixar o cadastro mais longo no celular;
2. uma visão da alocação do patrimônio por classe macro.

O nível é completo por três critérios, confirmados pelo responsável em 2026-10-26:

- **G1:** a visão por classe é uma regra de cálculo nova;
- **G2:** entra uma tabela global no schema `public`, e mudam as funções `security definer` de cadastro e edição do ativo;
- **significado do schema:** a classe deixa de ser do usuário e passa a ser um nó de uma árvore do sistema.

O modo contínuo é proibido.

## Origem no backlog

Snapshot da seleção de 2026-10-26. A fila foi lida no worktree `C:\Programas\saldo-futuro-backlog`, branch `chore/backlog`, commit `db80df2`. O conteúdo de `_project/backlog.md` nesse commit é idêntico ao de `main` em `757ceac`, porque o BL-014 foi **publicado** pela PR #135 (squash). Falta só reconciliar a fila por rebase, o que não muda o conteúdo. Destino em preparação: esta ideação não alterou nenhum item.

| ID | Síntese da necessidade | Parcela selecionada |
| :-- | :-- | :-- |
| BL-014 | Taxonomia hierárquica de classes de ativos, global e mantida pelo sistema, em até três níveis, e visão da alocação do patrimônio por classe macro, sem cadastro mais longo no celular | Integral. Ficam fora, como o próprio item já diz: os demais atributos (veículo de acesso, indexador, regime tributário, liquidez estimada, cobertura do FGC), o marcador de nó descontinuado e a comparação com a alocação-alvo |
| BL-009 | Enriquecer o cadastro de ativos com atributos descritivos e, no Restante, ter visões analíticas por classe de alocação ou por instituição | Parcial, por decisão de 2026-10-26 (pergunta 9): só "visões analíticas por classe de alocação" do Restante. **Continuam no Restante:** a carga retroativa (passo local e manual do responsável) e as visões por instituição |

Referência: `_project/backlog.md` no commit da fila `db80df2`, com conteúdo igual ao de `main` em `757ceac`. O snapshot não é reescrito por edições futuras do backlog. O retorno em BL-014 e em BL-009 só acontece depois da integração comprovada do destino em `main`, como `ciclo 013`, e a publicação desse retorno continua separada.

## Contexto e evidências

### Fatos observados

A inspeção local foi feita em 2026-10-26 em `EuThiagoAndrade/saldo-futuro`, com `main` em `757ceac`. Nenhum dado real foi lido. De `local/`, li só o briefing de análise que o responsável indicou, e ele não traz dado de usuário.

- **Classes por usuário.** Em `supabase/migrations/20261024000829_metadados_ativos.sql`:
  - `public.classes_ativo` (`id`, `user_id`, `nome`, `criado_em`) tem nome único por usuário em `lower(btrim(nome))`, RLS ativa e `select` só nas próprias linhas;
  - `public.ativos` ganhou `classe_id`, com chave estrangeira composta `(user_id, classe_id)` para `classes_ativo (user_id, id)`;
  - a restrição `ativos_transito_sem_detalhes_check` impede que o trânsito tenha classe, instituição ou indicadores.
- **Sementes.** A função `private.criar_classes_iniciais` grava cinco classes (Renda fixa, Renda variável, Fundos, Cripto e Outros). O gatilho `on_profile_created_classes`, em `public.profiles`, a chama para todo perfil novo, e um bloco `do` a aplicou aos perfis que já existiam. Nenhuma migração posterior muda isso. As seis classes que o responsável usa hoje são renomeações feitas pela tela, ou seja, dado por usuário. O banco de produção não foi consultado.
- **Escrita.** `public.cadastrar_ativo(..., p_classe, p_classe_nova, ...)` e `public.editar_detalhes_ativo(..., p_classe, p_classe_nova, ...)` resolvem a classe por `private.resolver_classe`. Essa função aceita uma classe existente do próprio usuário ou cria uma na hora (`p_nova`). Também existem funções públicas para criar, renomear e excluir classe, e a exclusão é recusada quando há ativo usando a classe.
- **Telas.**
  - `src/app/(app)/cadastros/page.tsx` tem as abas Instituições e Classes (`?aba=classes`), com criar, renomear e excluir. No celular, fica em "Mais" (`src/components/navegacao.tsx`).
  - O cadastro e a edição do ativo usam `src/components/formularios/novo-ativo.tsx`, `editar-ativo.tsx` e `detalhes-ativo.tsx`, com o combobox com busca sem acento do `DESIGN.md` (6.8).
- **Cálculo.** Hoje nenhum cálculo lê a classe. O que existe é a distribuição por ativo do Início, em `src/lib/financeiro/distribuicao.ts` (`comporDistribuicao`) e na KB-004, seção 15, item "Distribuição por ativo", casos CR-53 a CR-61:
  - usa o mês M fechado;
  - a base é a soma exata dos positivos em `bigint`;
  - saldo negativo fica fora da base e é listado à parte, e saldo zero é omitido;
  - o trânsito segue o mesmo critério de sinal;
  - a participação é dada em centésimos de ponto percentual (0 a 10000), repartida pelo maior resto, com desempate por nome em pt-BR e depois por UUID;
  - há cinco fatias principais, e o restante vai para Outros.
- **Moeda.** Toda quantia é gravada em centavos de real, e o câmbio é um tipo de evento. Não há saldo em moeda estrangeira para converter.
- **Testes de banco.** `supabase/tests/database/08_metadados_ativos.test.sql` cobre o isolamento de `classes_ativo` e das funções do ciclo `012`.
- **Arquivo de exemplo da taxonomia.** O briefing cita um arquivo exaustivo de exemplo, com cerca de 330 tipos, que o responsável trouxe. Ele **não está** no repositório nem em `local/`. A árvore concreta ainda precisa ser curada (pergunta 3).

### Decisões do debate de 2026-10-25, confirmadas em 2026-10-26

O responsável aceitou as recomendações abaixo em um debate de análise, antes da triagem, e as confirmou no ciclo em 2026-10-26 (perguntas 1 e 2). As de cálculo (D4) são G1 e foram decididas pelo responsável, não pelo agente.

| ID | Ponto | Decisão do debate |
| :-- | :-- | :-- |
| D0 | Nível 1 | Seis classes macro: Caixa e disponibilidades; Renda fixa; Renda variável; Investimentos no exterior; Criptoativos e ativos digitais; Alternativos, moedas, outros. "Fundos" não é classe macro |
| D1 | Princípio | O nó classifica pela exposição econômica (fator de risco). Veículo, regime, indexador, tributação e emissor são atributos, não nós |
| D1.1 | Casos ambíguos | Stablecoin vai em Criptoativos, com exposição cambial = sim. Ouro vai em Alternativos, em qualquer veículo. PGBL e VGBL vão no nó do que o plano carrega, com previdência = sim. ETF e fundo da mesma estratégia vão no mesmo nó |
| D1.2 | Caixa e renda fixa | Saldo parado em conta, rendendo ou não, é Caixa. Título ou aplicação adquirida é Renda fixa |
| D2 | Ligação ao ativo | Coluna nova `taxonomia_id`. `classe_id` e `classes_ativo` ficam congeladas como legado só de leitura e saem num ciclo futuro, por nova migração |
| D3 | Ativos já classificados | Mapeamento pelo nome normalizado e por uma tabela de equivalência (por exemplo, Cripto vira Criptoativos e ativos digitais, e Outros vira Alternativos, moedas, outros). O que não tiver correspondência, como Fundos e as classes criadas pelo usuário, fica "Sem classe", com a dica "antes: X" lida do legado. Não há nó genérico forçado nem tela obrigatória no primeiro acesso |
| D4.1 | Saldo negativo (G1) | Tratado por ativo, como na seção 15: fica fora da base e é listado à parte |
| D4.2 | Rateio (G1) | Feito sobre o total de cada classe, pelo maior resto, nas linhas da própria visão. A distribuição por ativo não muda |
| D4.3 | Trânsito (G1) | Linha própria "Em trânsito", pelo critério de sinal da seção 15. Não entra em Caixa |
| D4.4 | Ativo sem classe (G1) | Linha própria "Sem classe" |
| D5 | Nível da visão | Só o nível 1 |
| D6 | Nível 3 | Mantido, sem meta de quantidade. Um tipo só entra quando difere em estrutura, risco ou liquidez, nunca por indexador, tributação ou emissor. Ficam fora tickers, alíquotas e nomes de gestoras ou instituições reais |
| D7 | Tela de classes | A aba Classes sai de Cadastros. O seletor com busca mostra o caminho completo, por exemplo "Renda fixa › Bancários › CDB" |
| D8 | Lista no celular | Mostra só o nome do nó escolhido. O caminho completo aparece no seletor e na edição |
| D9 | Entrega | Três issues em sequência: (1) banco, seguido do `db push` do responsável; (2) telas de cadastro; (3) visão de alocação, com casos de referência na KB-004 |
| D10 | Nó descontinuado | Fica para depois |
| D11 | Outros atributos | Ficam fora do ciclo, guardados no BL-015 (capturado em 2026-10-26, pergunta 10). Os quatro indicadores atuais não mudam |

Exemplos numéricos do debate, com valores fictícios em reais, para conferir as decisões D4:

- **D4.1:** A (Renda fixa) +50.000, B (Renda fixa) −5.000 e C (Renda variável) +50.000. Por ativo, a base é 100.000, Renda fixa fica com 50,00% e Renda variável com 50,00%, e B é listado à parte. A alternativa descartada, líquida por classe, daria base 95.000, Renda fixa 47,37% e Renda variável 52,63%.
- **D4.2:** três ativos de 100.000, com A e B na classe X e C na classe Y. Rateando sobre o total da classe, X fica com 66,67% e Y com 33,33%, sempre. Rateando por ativo e somando, o resultado dependeria do nome: X 66,67% com A primeiro e X 66,66% com C primeiro. Consequência aceita: ao detalhar uma classe pelos ativos, a soma por ativo pode diferir em 0,01 ponto percentual da linha da classe.
- **D4.3:** A (Renda fixa) 60.000, B (Renda variável) 30.000 e trânsito 10.000. Com linha própria, o resultado é 60,00%, 30,00% e Em trânsito 10,00%, e a soma bate com o patrimônio. As alternativas descartadas eram somar o trânsito a Caixa ou deixá-lo de fora, o que daria 66,67% e 33,33%.

### Hipóteses (a confirmar no plano)

- **Tabela global.** Uma tabela como `public.taxonomia_ativos(id, parent_id, nivel, nome, ordem)`, com:
  - RLS ativa, `select` para `authenticated`, nada para `anon` e nenhuma escrita pela Data API;
  - carga por migração, só com nomes genéricos;
  - restrições de `nivel` entre 1 e 3, coerente com o pai, e de nome único dentro do mesmo pai.
- **O ativo guarda só o nó escolhido.** Os níveis acima são derivados pelo caminho, e a visão por classe macro sobe até o nível 1.
- **Migração em produção.** O preenchimento de `taxonomia_id` a partir do legado roda na própria migração e lê só os nomes das classes. A tabela de equivalência versionada traz só nomes genéricos. Nenhum nome real de usuário entra no repositório (G3).
- **Janela entre o deploy e o `db push`.** A issue 1 precisa manter o app em produção funcionando nessa janela. Isso pede a mesma compatibilidade do ciclo `012`: o banco novo aceita o código antigo enquanto as telas não mudam. Retirar `p_classe_nova` e as funções de classe pode exigir uma ordem ou assinaturas de transição. O plano decide.
- **Composição da visão.** A visão por classe pode reaproveitar `comporDistribuicao`, com o agrupamento feito antes do rateio e as linhas "Em trânsito" e "Sem classe". Também pode ser uma função irmã. A alternativa A da seção 15 (rateio antes de agrupar) **não** vale aqui, pela D4.2. Também não valem as cinco fatias com Outros nem o desempate por nome (decisões D12 e D13).

## Resultado desejado

- Uma árvore global de classes de ativos em três níveis, carregada por migração aditiva (G4), com RLS e testes de isolamento: `authenticated` não grava, `anon` não lê, e um nó inexistente é recusado na ligação.
- `public.ativos.taxonomia_id` preenchida a partir do legado pela D3, com o legado congelado e só de leitura.
- Fim do gatilho de classes iniciais, da criação de classe durante o cadastro e das funções de criar, renomear e excluir classe.
- Cadastro e edição do ativo com um seletor único com busca que mostra o caminho, sem ficar mais longo no celular. A lista mostra o nome do nó e a dica "antes: X" para quem ficou sem classe. A aba Classes sai de Cadastros.
- Uma visão da alocação por classe macro, com casos de referência novos na KB-004 (G1) e testes unitários que reproduzem esses casos.
- Documentação viva atualizada (KB-003, KB-004 e `DESIGN.md` se o seletor ou a visão criarem padrão novo) na última entrega.

## Alternativas

As escolhas foram feitas pelo responsável em 2026-10-26 e estão registradas em "Decisões de 2026-10-26".

**A — Onde fica a visão por classe macro** (escolhida: **A1**, D18)
- **A1 — No Início, ao lado da distribuição por ativo**, com um alternador entre "por ativo" e "por classe". Reaproveita o mês M e a rosca. Como só uma visão aparece por vez, o celular não fica mais longo.
- **A2 — No Início, como cartão ou tabela própria abaixo da distribuição.** É simples, mas o Início fica mais longo.
- **A3 — Numa tela própria de alocação.** Não pesa o Início, mas acrescenta rota e navegação.

**B — Representação da árvore** (escolhida: **B1**, D21)
- **B1 — Uma tabela com `parent_id` e `nivel`**, com restrição de coerência. Aceita outros níveis depois sem mudar a estrutura.
- **B2 — Três tabelas, uma por nível.** As restrições ficam mais simples, mas a estrutura fica rígida.

**C — Retirada das funções de classe** (escolhida: **C2**, D19)
- **C1 — Retirar tudo na issue 1**, com as telas trocadas na mesma janela de deploy. É mais simples, mas quebra a tela de Cadastros entre o deploy e o `db push` se a ordem for errada.
- **C2 — Congelar na issue 1 e retirar as funções públicas só na issue 2**, com nova migração. A janela fica segura, ao custo de uma migração a mais.

## Riscos e restrições

- **G1.** A visão é uma regra nova. Os casos de referência precisam de entradas e valores esperados calculados de forma independente, e a KB-004 precisa ser atualizada. As regras estão nas decisões D4.1 a D4.4 e D12 a D15.
- **G2.** A tabela global não tem dono, então o risco passa a ser a ligação entre o ativo e o nó. As funções `cadastrar_ativo` e `editar_detalhes_ativo` mudam de assinatura, e a antiga precisa ser retirada com os grants, sem sobrecarga exposta. O legado `classes_ativo` continua com RLS e testes em modo só leitura.
- **G3.** O mapeamento lê nomes de classes de usuários em produção, dentro da migração. A tabela de equivalência, as fixtures e os testes usam só nomes genéricos ou fictícios. A contagem de quantos ativos ficariam "Sem classe" é opcional, e o responsável a roda de forma agregada, sem nomes.
- **G4.** Só migração nova. A migração do ciclo `012` não é editada. Remover gatilho, função ou restrição é permitido por migração nova.
- **Migração de produção.** Quem tem classes personalizadas perde o vínculo e passa a ver "Sem classe" com a dica. O `db push` é ação externa do responsável e não é coberto por nenhuma autorização automática.
- **Curadoria.** Qualquer ajuste de nó exige migração nova. Uma árvore inicial ruim custa caro, e o nível 3 pode crescer demais se a D6 não for aplicada com rigor.
- **Tamanho do ciclo.** Taxonomia, migração de dados, telas e uma regra G1 no mesmo ciclo. A ordem da D9 reduz o risco, mas o ciclo é maior que o `012`.

## Perguntas em aberto

Todas foram respondidas pelo responsável em 2026-10-26. Para cada uma, o agente trouxe alternativas e uma recomendação, e o responsável aceitou todas as recomendações.

1. **Decisões D0 a D3 e D5 a D11:** confirmadas como estão.
2. **Decisões G1 D4.1 a D4.4 e os exemplos numéricos:** confirmados. O plano as registra na KB-004 como casos de referência.
3. **Árvore dos níveis 2 e 3:** D16.
4. **Tabela de equivalência:** D17.
5. **Regras G1 que faltavam para a visão:** D12 a D15.
6. **Onde fica a visão:** A1 (D18).
7. **Retirada das funções de classe:** C2 (D19).
8. **Contagem agregada:** D20.
9. **BL-009 como segunda origem:** sim, com a parcela parcial "visões analíticas por classe de alocação" (ver "Origem no backlog").
10. **Item de atributos citado na D11:** capturado como BL-015 na fila local (`ba96c35`, ainda não publicado).

### Decisões de 2026-10-26

| ID | Ponto | Decisão |
| :-- | :-- | :-- |
| D12 | Ordem das linhas e desempate (G1) | Positivos por saldo da linha em ordem decrescente. No empate de saldo, e no empate de resto do maior resto, vale a ordem fixa da árvore (Caixa e disponibilidades, Renda fixa, Renda variável, Investimentos no exterior, Criptoativos e ativos digitais, Alternativos, moedas, outros), depois Em trânsito e depois Sem classe. Não se usa o nome nem o UUID |
| D13 | Agrupamento (G1) | Não há cinco fatias com Outros. Todas as linhas positivas aparecem, no máximo oito |
| D14 | Linha zero (G1) | Uma linha cuja soma dos positivos no mês M é zero é omitida. Vale para as seis classes, para Em trânsito e para Sem classe |
| D15 | Saldos negativos (G1) | Ficam à parte, por ativo, com nome e quantia e sem participação, como na seção 15. Vale também para o trânsito e para ativos sem classe |
| D16 | Curadoria da árvore | O agente propõe os níveis 2 e 3 numa seção do plano, aplicando D1 e D6, sem tickers, alíquotas nem nomes de gestoras ou instituições reais. A árvore passa pela revisão formal e é aprovada com o plano, antes da issue 1 |
| D17 | Tabela de equivalência | Mínima. A comparação ignora maiúsculas, espaços nas pontas e acentos. Os seis nomes do nível 1 mapeiam direto, Cripto vira Criptoativos e ativos digitais e Outros vira Alternativos, moedas, outros. Fundos e qualquer outro nome ficam "Sem classe", com a dica "antes: X" |
| D18 | Local da visão | No Início, na seção de distribuição, com um alternador "Por ativo" / "Por classe". O padrão é "Por ativo" |
| D19 | Transição | A issue 1 mantém as funções antigas de classe, só sobre o legado. Um ativo criado ou editado pelas telas antigas na janela fica "Sem classe", com a dica. A issue 2 retira as funções públicas de classe, o `p_classe_nova` e a tela, por migração nova |
| D20 | Contagem agregada | Entra no roteiro de ação externa da issue 1: uma consulta agregada (total de ativos e quantos ficaram sem nó) antes e depois do `db push`, sem ler nomes |
| D21 | Representação da árvore | Uma tabela com `parent_id`, `nivel`, `nome` e `ordem`, com restrições de nível de 1 a 3, coerência com o pai e nome único dentro do mesmo pai |

Exemplos numéricos das decisões G1 novas, com valores fictícios em reais:

- **D12:** Renda fixa, Renda variável e Criptoativos com 100.000 cada. Cada linha tem piso 3333 e o mesmo resto, e a unidade que sobra vai para a primeira na ordem fixa. O resultado é Renda fixa 33,34%, Renda variável 33,33% e Criptoativos 33,33%.
- **D14 e D15:** Renda fixa +50.000, Renda variável +50.000 e trânsito −2.000. A visão mostra Renda fixa 50,00% e Renda variável 50,00%, e lista "Em trânsito −2.000" à parte, sem participação. A linha "Em trânsito" não aparece entre as participações, porque sua soma de positivos é zero.

## Fora do escopo

- Os demais atributos (veículo de acesso, indexador, regime tributário, liquidez estimada, cobertura do FGC). Os quatro indicadores atuais não mudam.
- O marcador de nó descontinuado (D10).
- A comparação com a alocação-alvo.
- A visão em níveis 2 e 3 (D5).
- A remoção definitiva de `classes_ativo` e `classe_id`, que fica para um ciclo futuro.
- Visões por instituição, e `public.instituicoes`, que não muda.
- Qualquer mudança na distribuição por ativo, nos saldos, no fechamento, na consolidação ou nos retornos.
- O retorno em BL-014 (e em BL-009, se a pergunta 9 for aceita) antes da integração do ciclo.

## Critérios para iniciar o planejamento

- Perguntas 1 a 10 respondidas em 2026-10-26: **atendido**.
- O plano precisa trazer:
  - a árvore concreta (D16);
  - os casos de referência G1 de D4.1 a D4.4 e D12 a D15, para a KB-004;
  - o roteiro da ação externa da issue 1, com a contagem agregada (D20);
  - a ordem das migrações da transição (D19).
- Issues previstas:
  - (1) banco: árvore e carga, `taxonomia_id`, preenchimento pelo legado, validação nas funções de cadastro e edição, retirada do gatilho de classes iniciais e testes. Em seguida, o `db push` do responsável;
  - (2) telas de cadastro e edição: seletor com caminho, dica "antes: X", saída da aba Classes e retirada das funções antigas por migração nova, com e2e;
  - (3) visão por classe macro no Início: casos de referência na KB-004 e documentação viva.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Ideação registrada — ciclo 013 (completo)
Quem: Responsável
Conferir: decisões D0 a D21 e as respostas às perguntas 1 a 10, registradas em 2026-10-26
Diga: "autorizo o rascunho do plano do ciclo 013"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 013 + idear + taxonomia_classes_alocacao + 757ceac`
- `effect_class`: `local_mutation`
- `state_before`: o ciclo `013` estava livre em `cycles.md` (próximo ciclo `013`); `main` em `757ceac`, limpa e igual a `origin/main`; fila `chore/backlog` em `db80df2`, com conteúdo igual ao de `main`.
- `state_after`: ciclo `013` reservado como `Ideação` e ideação criada, ambos sem versionar. Respostas de 2026-10-26 registradas (D12 a D21, BL-009 como segunda origem). Fila do backlog com o BL-015 capturado no commit local `ba96c35`, não publicado.
- `result`: `executed`
- `evidence`: este arquivo; `_project/cycles.md`; `git worktree list`; `git diff main chore/backlog -- _project/backlog.md` sem diferença; leitura de `supabase/migrations/20261024000829_metadados_ativos.sql`, `src/app/(app)/cadastros/page.tsx`, `src/components/navegacao.tsx`, `src/lib/financeiro/distribuicao.ts`, KB-004 (seção 15) e do briefing em `local/`.
- `blockers`: nenhum. As perguntas foram respondidas, e o rascunho do plano só depende da frase de autorização.
