# Plano de Implementação — Taxonomia de classes de ativos e alocação por classe macro

> **Ciclo:** `013`
> **Status:** `Aprovado`
> **Versão:** `v2`
> **Data de criação:** 2026-10-26
> **Última atualização:** 2026-10-26
> **Tipo:** `feature`
> **Prioridade:** `P2` (proposta de planejamento, sem compromisso de prazo)
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 013" em 2026-10-26
> **Autorização do rascunho:** "Autoriza o rascunho do plano do ciclo 013" em 2026-10-26
> **Autorização da correção:** "corrija o plano do ciclo 013" em 2026-10-26
> **Modo contínuo:** `—`
> **Revisão formal:** `Concluída`
> **Veredito da revisão:** `APTO COM RESSALVAS`
> **Aprovação humana pós-revisão:** `Aprovada em 2026-10-26`
> **handoff_schema_version:** `2`

## Problema e contexto

Ideação: _project/ideations/013_taxonomia_classes_alocacao.md

## Objetivo

Substituir a classificação livre por usuário por uma árvore global de até três níveis, mantida por migrações, e apresentar a distribuição dos saldos positivos do último mês fechado por classe macro. Preservar o cadastro compacto no celular, o isolamento das carteiras e os cálculos existentes.

## Origem no backlog

Snapshot da seleção de 2026-10-26. A fila foi lida no worktree `C:\Programas\saldo-futuro-backlog`, branch `chore/backlog`, commit `db80df2`. O conteúdo de `_project/backlog.md` nesse commit é idêntico ao de `main` em `757ceac`, porque o BL-014 foi **publicado** pela PR #135 (squash). Falta só reconciliar a fila por rebase, o que não muda o conteúdo. Destino em preparação: esta ideação não alterou nenhum item.

| ID | Síntese da necessidade | Parcela selecionada |
| :-- | :-- | :-- |
| BL-014 | Taxonomia hierárquica de classes de ativos, global e mantida pelo sistema, em até três níveis, e visão da alocação do patrimônio por classe macro, sem cadastro mais longo no celular | Integral. Ficam fora, como o próprio item já diz: os demais atributos (veículo de acesso, indexador, regime tributário, liquidez estimada, cobertura do FGC), o marcador de nó descontinuado e a comparação com a alocação-alvo |
| BL-009 | Enriquecer o cadastro de ativos com atributos descritivos e, no Restante, ter visões analíticas por classe de alocação ou por instituição | Parcial, por decisão de 2026-10-26 (pergunta 9): só "visões analíticas por classe de alocação" do Restante. **Continuam no Restante:** a carga retroativa (passo local e manual do responsável) e as visões por instituição |

Referência: `_project/backlog.md` no commit da fila `db80df2`, com conteúdo igual ao de `main` em `757ceac`. O snapshot não é reescrito por edições futuras do backlog. O retorno em BL-014 e em BL-009 só acontece depois da integração comprovada do destino em `main`, como `ciclo 013`, e a publicação desse retorno continua separada.

## Contexto e baseline

- Base local: `main`, commit `757ceac7a83762771278cd47efd68f54b21fa3d7`, observado em 2026-10-26. Ideação 013 e reserva em `cycles.md` já estavam modificadas localmente, sem commit; foram preservadas. Não havia PR aberta na consulta `gh pr list`.
- Ciclo 012 integrado: `classes_ativo` por usuário, `ativos.classe_id`, gatilho de classes iniciais, RPCs de cadastro/edição e CRUD de classes. A migração original é `supabase/migrations/20261024000829_metadados_ativos.sql` e não será editada.
- `src/lib/financeiro/distribuicao.ts` calcula por ativo, rateia antes de agrupar e limita a cinco principais mais Outros. Essa função não atende diretamente D4.2, D12 e D13; será preservada.
- Referência de produto: KB-003; regras: KB-004, seção 15; interface: DESIGN.md 6.7, 6.8, 6.12 e 6.13; gráficos SVG: ADR-005. KB-002 S12 rege cada aplicação de migração em produção.
- Não se consultou produção nem dados reais. Não há issue criada para este ciclo. O arquivo externo com cerca de 330 tipos não está disponível e não é dependência da proposta abaixo.

## Escopo

### Dentro do escopo

Árvore global, vínculo opcional do ativo, equivalência mínima do legado, transição e congelamento final do legado; seletor único com busca e caminho; retirada da aba Classes; alocação macro no Início; testes G1/G2, duas ações externas de migração, verificação em produção, documentação e encerramento.

### Fora do escopo

Novos atributos do BL-015; alteração dos quatro indicadores atuais; alocação-alvo; análises por instituição ou por níveis 2/3; carga retroativa manual do BL-009; edição de taxonomia pela interface; marcador de nó descontinuado; retirada física de `classes_ativo`/`classe_id`; mudança de saldos, fechamento, retornos ou distribuição por ativo. Não há classificação automática por nome do ativo, veículo ou indicador.

## Decisões e autoridades

As decisões humanas D0 a D21 da ideação são a autoridade de escopo. As escolhas financeiras P2/P6 e os dois enquadramentos de P3 foram confirmados expressamente pelo responsável durante a correção em 2026-10-26, conforme Registro de aprovação abaixo. Os demais detalhes e a árvore continuam propostas sujeitas à revisão e à aprovação posterior do plano completo.

- **P1 — Seleção:** aceitar qualquer nó de nível 1, 2 ou 3, inclusive um pai com filhos. Isso permite o vínculo macro do backfill e evita exigir precisão que o usuário não tem. Vazio significa Sem classe; a ausência de nó não cria registro na árvore.
- **P2 — Tempo da classificação (G1, escolha humana de 2026-10-26):** usar a classificação atual do ativo com o saldo de M. Reclassificar hoje redistribui a visão de M, sem alterar posição ou fechamento. Não criar histórico de classificação. Exemplo CR-C11: A=100 e B=100 centavos em RF em M; hoje A passa a RV. A escolha atual mostra RF=50% e RV=50%. A alternativa descartada, congelar a classe por mês, manteria M em RF=100% e só usaria a nova classe no fechamento seguinte, exigindo histórico mensal. A decisão de regra não equivale à aprovação do plano após revisão.
- **P3 — Precedência da árvore:** ouro permanece em Alternativos e cripto em Criptoativos, mesmo por veículo no exterior. Para as demais exposições, ativos cuja exposição econômica é a mercados externos usam Investimentos no exterior; a moeda de cotação e o domicílio do veículo, isoladamente, não definem a classe. Um fundo ou ETF segue a exposição, e não ganha nó por veículo. Exposição mista sem predominância identificável pode ficar no pai correspondente; não será inferida pelo sistema.
- **P4 — Indicadores:** D1.1 orienta o usuário sobre stablecoin/previdência, mas não implica escrita automática nos indicadores. Preservar valores existentes; nenhuma migração deduz exposição cambial ou previdência pela classe.
- **P5 — Compatibilidade:** D19 prevalece sobre a formulação genérica de "legado congelado na issue 1": durante a janela, apenas as RPCs antigas ainda podem escrever no legado. O congelamento completo acontece na ação externa da issue 2. A taxonomia global nunca aceita escrita de usuário.
- **P6 — Desempate de resto (G1, escolha humana de 2026-10-26):** ordem fixa das classes, sem priorizar saldo. No CR-C10, Caixa=1, RF=1, RV=4 centavos: pisos 1666/1666/6666, restos 4/4/4 e sobra 2. Escolha aprovada: Caixa=1667, RF=1667, RV=6666. Alternativa descartada, ordem de apresentação/maior saldo primeiro: Caixa=1667, RF=1666, RV=6667. Exibição RV, Caixa, RF em ambas. É uma diferença deliberada em relação à distribuição por ativo da seção 15 da KB-004, que permanece inalterada.

### Registro de aprovação

Decisões específicas recebidas em 2026-10-26 durante a correção da rodada 1; não constituem aprovação do plano, cujo veredito permanece `REQUER NOVA RODADA`:

| Decisão | Manifestação literal do responsável | Resultado |
| :-- | :-- | :-- |
| P6 / R1-1 | "Ordem fixa das classes: 16,67%, 16,67%, 66,66% (recomendado; D12)" | Ordem fixa no empate de restos, inclusive com saldos diferentes |
| P2 / R1-3 | "Classificação atual: M passa a mostrar 50% RF e 50% RV (recomendado; P2)" | Classificação atual com saldos de M; sem histórico mensal |
| P3 / R1-9 | "Aprovo os dois enquadramentos propostos" | Poupança em Renda fixa › Crédito bancário; saldo parado em conta em moeda estrangeira em Caixa › Saldos em conta |

Depois de veredito apto, registrar aqui a manifestação de aprovação do plano, a versão e a data, vinculando-a expressamente às escolhas P2 e P6 acima. Não inferir outra alternativa da frase fixa; se a manifestação contradisser uma escolha, esclarecer e corrigir antes de promover. **Aprovação do plano pós-revisão:** em 2026-10-26, o responsável declarou "aprovo o plano do ciclo 013", após o veredito APTO COM RESSALVAS da rodada 2. Aprovada a v2, vinculada às escolhas expressas P2 (classificação atual), P6 (ordem fixa no empate) e aos enquadramentos P3 já registrados. R2-1 e R2-2 ficam aceitas para tratamento obrigatório na unidade 3: escolher matiz de chart-7 fora das famílias verde/vermelha e recalcular contraste; preservar distribuicao também no envio GET do período e cobrir em e2e. O escopo financeiro e a sequência permanecem os revisados. Não autoriza implementação nem merge.

### Árvore inicial proposta (D16)

Os códigos são identidades estáveis da especificação e servirão para fixar UUIDs na carga. A ordem abaixo define `ordem`; não é ordem alfabética. Sem taxa, indexador, benefício tributário, emissor, gestora ou ticker nos nós. O nível 3 distingue estrutura/risco; não é uma lista exaustiva de produtos. Um nó sem filhos continua selecionável.

| Código | Classe macro (nível 1) | Subclasse (nível 2) | Tipos (nível 3, na ordem proposta) |
| :-- | :-- | :-- | :-- |
| 1 | Caixa e disponibilidades | — | — |
| 1.1 | Caixa e disponibilidades | Saldos em conta | — |
| 1.2 | Caixa e disponibilidades | Dinheiro em espécie | — |
| 2 | Renda fixa | — | — |
| 2.1 | Renda fixa | Dívida soberana | — |
| 2.2 | Renda fixa | Crédito bancário | CDB; RDB; Letras bancárias |
| 2.3 | Renda fixa | Crédito corporativo | Debêntures; Notas comerciais |
| 2.4 | Renda fixa | Crédito estruturado | Recebíveis imobiliários; Recebíveis do agronegócio; Outros recebíveis |
| 3 | Renda variável | — | — |
| 3.1 | Renda variável | Participações em empresas | Ações ordinárias; Ações preferenciais |
| 3.2 | Renda variável | Imóveis de renda | — |
| 3.3 | Renda variável | Desenvolvimento imobiliário | — |
| 4 | Investimentos no exterior | — | — |
| 4.1 | Investimentos no exterior | Dívida soberana no exterior | — |
| 4.2 | Investimentos no exterior | Crédito privado no exterior | — |
| 4.3 | Investimentos no exterior | Participações em empresas no exterior | — |
| 4.4 | Investimentos no exterior | Imóveis no exterior | — |
| 5 | Criptoativos e ativos digitais | — | — |
| 5.1 | Criptoativos e ativos digitais | Criptoativos sem lastro | — |
| 5.2 | Criptoativos e ativos digitais | Stablecoins | Com reservas; Algorítmicas |
| 5.3 | Criptoativos e ativos digitais | Outros ativos digitais | — |
| 6 | Alternativos, moedas, outros | — | — |
| 6.1 | Alternativos, moedas, outros | Ouro | — |
| 6.2 | Alternativos, moedas, outros | Outras commodities | — |
| 6.3 | Alternativos, moedas, outros | Exposição a moedas | — |
| 6.4 | Alternativos, moedas, outros | Estratégias multiexposição | — |
| 6.5 | Alternativos, moedas, outros | Outros alternativos | — |

Exemplos de aplicação a revisar: saldo parado em conta, mesmo remunerado, é Caixa; CDB adquirido é Renda fixa › Crédito bancário › CDB; fundo de recebíveis segue Crédito estruturado, enquanto exposição a imóveis de renda segue Renda variável › Imóveis de renda; fundo/ETF de ouro segue Alternativos › Ouro; PGBL/VGBL segue o que carrega. Não subdividir Letras bancárias por isenção de IR, nem títulos públicos por indexador. Uma aplicação sem tipo exato usa um pai, não exige criar um nó ou escolher Outros.

Enquadramentos confirmados na correção: poupança usa diretamente Renda fixa › Crédito bancário, sem novo tipo; saldo parado em conta em moeda estrangeira usa Caixa › Saldos em conta, prevalecendo sobre P3/exterior e 6.3. O nó Exposição a moedas fica para aplicação adquirida com exposição cambial, não para saldo parado. Títulos públicos usam diretamente Dívida soberana; retirar o filho único redundante aplica D6 e encurta o caminho.

### Contrato do banco e equivalência

1. Criar `public.taxonomia_ativos(id uuid, parent_id uuid, nivel smallint, nome text, ordem integer)`, sem `user_id`. PK e FK para pai; nome não vazio; nível 1–3; raiz só com pai nulo e níveis 2/3 com pai do nível anterior. Impedir ciclos por essa relação estrita. Validar também atualizações de pai/nível que invalidem filhos. Nome normalizado único entre irmãos, inclusive raízes (índice específico para `parent_id is null`); ordem positiva e única entre irmãos. UUIDs e ordem explícitos na migração, sem geração dependente do ambiente.
2. RLS ativa; `authenticated` só lê o catálogo; `anon` não lê; `admin` não escreve pelo papel de aplicação. Revogar escrita e execução pública; não criar RPC administrativa. A manutenção é por migração revisada. Evitar dependência nova para normalização: explicitar a tabela de transliteração dos caracteres dos nomes portugueses e testar caixa, acentos e espaços nas pontas.
3. `ativos.taxonomia_id` é FK opcional global, com exclusão de nó referenciado recusada. Estender a restrição de trânsito para exigir nulo também nesse campo. Preservar a FK composta do legado e RLS das carteiras.
4. Backfill transacional, uma vez, apenas nos ativos comuns: comparar o nome legado, sem caixa, acentos ou espaços nas pontas, aos seis nomes macro; adicionar somente os aliases `Cripto` → classe 5 e `Outros` → classe 6. `Fundos`, nomes personalizados e ausência de legado ficam nulos. Não usar busca parcial, colapsar espaços internos ou deduzir tipos. Nenhum saldo/evento/indicador muda.
5. Preservar `classe_id` para a dica "antes: X", lida sob RLS e exibida somente quando `taxonomia_id` for nulo. O texto é escapado e nunca enviado a logs/evidências. Em novos ativos pela API nova, `classe_id` fica nulo; na edição nova, preservá-lo. Não repetir backfill após a janela: escolhas conscientes de Sem classe não podem ser sobrescritas.

### Marca de coerência da classificação (R1-2)

Na **migração 1**, acrescentar `profiles.versao_classificacao bigint not null default 0`, com restrição não negativa. Um trigger privado em `ativos`, na mesma transação da alteração, incrementa o contador do perfil dono sempre que `taxonomia_id` mudar (`IS DISTINCT FROM`), inclusive ao zerar pela RPC antiga e no backfill. Inserções com nó também incrementam; inserções sem nó já são detectadas pela contagem existente de ativos. Não usar horário nem máximo de versões por ativo: um contador por carteira detecta duas mudanças em ativos distintos e a volta ao valor anterior (A→B→A). Incremento atômico serializa a linha do perfil; overflow aborta, nunca reinicia o contador. O trigger não concede escrita direta ao usuário e sua função tem `search_path` vazio e execução revogada dos papéis da API.

Criar na mesma migração a RPC de leitura `ler_versao_classificacao()` sem argumentos, `stable`, `security invoker`, `search_path` vazio, retornando o contador como **texto decimal**, nunca número JSON. Consulta apenas `profiles.user_id = auth.uid()` sob a RLS existente; sem perfil/sessão, recusa. `execute` somente para `authenticated`, sem parâmetro de dono nem bypass de admin. Atualizar o inventário de funções e testar que o usuário não escreve/reset a versão nem lê a versão alheia.

Na issue 3, ampliar o cliente tipado local de leitura para incluir `rpc` e incorporar essa string às leituras antes/depois de `marcaCarteira`, com `AbortSignal` novo em cada fase, preservando as marcas existentes e três tentativas. O consumidor novo só entra depois de E1/E2; o deploy da issue 1 não chama essa RPC. A marca monotônica detecta reclassificações entre páginas, descarta todos os insumos e repete; esgotamento retorna indisponibilidade. Testar duas reclassificações concorrentes entre páginas, retorno à classe original, rollback sem incremento persistido e edição antiga que limpa nó. Tudo cabe nas duas migrações já previstas.

O catálogo global fica fora da marca da carteira: não é editável pela API e, neste ciclo, é carregado uma única vez na migração 1, antes do consumidor. Futuras migrações que alterem catálogo em uso precisam definir sua própria janela/coerência; este plano não autoriza edição concorrente do catálogo com a leitura.

### Transição de RPCs e deploys

Usar nomes distintos para evitar resolução ambígua de sobrecargas no PostgREST: novas RPCs `cadastrar_ativo_taxonomia` e `editar_detalhes_ativo_taxonomia`, já instaladas na migração da issue 1. Elas recebem `p_taxonomia` em vez de `p_classe`/`p_classe_nova` e preservam os demais parâmetros, resultados e erros aplicáveis. Os nomes são proposta técnica; não criar duas assinaturas com defaults sobrepostos.

| Etapa | Banco | Aplicação e aceite |
| :-- | :-- | :-- |
| Antes da issue 1 | Legado | Aplicação atual funciona |
| Merge/deploy da issue 1, antes do push | Legado | Não há consumidor novo no app; sem consulta à coluna ainda ausente |
| Ação externa 1 | Catálogo, coluna, backfill e RPCs novas; antigas preservadas | Aplicação antiga continua operando |
| Janela até issue 2 | CRUD antigo escreve só legado; cadastro antigo deixa o nó nulo; edição antiga grava legado e zera `taxonomia_id` | Cadastro antigo cria Sem classe; edição antiga limpa o nó como definido em D19, mesmo se o ativo tiver sido mapeado, incrementando a marca quando houver mudança. Nunca reclassificar por nome nessa janela |
| Merge/deploy da issue 2, antes do push | APIs novas e antigas | Aplicação nova usa apenas APIs novas, já disponíveis; Classes sai da interface |
| Ação externa 2, só após deploy confirmado | Migração nova remove APIs antigas e resolve dependências privadas | Aplicação nova segue operando; legado passa a somente leitura |

A migração 1 remove o gatilho e os auxiliares de criação automática de classes iniciais. Mantém CRUD legado durante a janela, com seus controles de dono e trava. A migração 2 remove `criar_classe`, `renomear_classe`, `excluir_classe`, as assinaturas antigas de `cadastrar_ativo`/`editar_detalhes_ativo` e `private.resolver_classe`, depois de conferir dependências; não usar `cascade`. `criar_ativo` básico pode permanecer porque cria sem metadados e não escreve classes. Conferir grants e catálogo de funções, não apenas a ausência dos botões.

Abas antigas abertas podem falhar ao enviar após a retirada; a UI orienta recarregar, sem reenviar mutação automaticamente. Não aplicar a migração 2 enquanto houver deploy antigo ativo. O rollback da aplicação após essa retirada exige versão compatível com as RPCs novas ou migração aditiva restauradora previamente revisada.

### Regra de alocação macro e casos G1

Criar função irmã pura, sem alterar `comporDistribuicao`. Entradas: posições completas de M, ativo de sistema e macro derivada do nó atual (P2). Subir no máximo dois pais; nó inexistente/caminho inválido ou leitura incompleta é erro/indisponível, nunca Sem classe. Somente FK nula significa Sem classe; trânsito tem precedência e linha própria.

Validar cada saldo inteiro seguro e converter para `bigint`. Separar negativos por ativo **antes** de agrupar. Somar apenas positivos por macro/trânsito/sem classe. Seja S a base positiva e V o total da linha: piso = `(V * 10000) / S`, resto = `(V * 10000) % S`. Distribuir as unidades faltantes pelos maiores restos, empatando **diretamente pela ordem fixa 1 a 8**, inclusive quando os saldos forem diferentes. Apresentar por saldo decrescente, empatando por essa ordem fixa. Não ratear por ativo, não agrupar as menores linhas em Outros. Com S zero, não dividir nem mostrar total de 100%. Negativos seguem a ordem da seção 15 (saldo crescente, nome pt-BR, UUID), sem percentual. Zeros somem.

Casos propostos `CR-C01` a `CR-C12`, a transcrever na KB-004 e na fixture de referência na issue 3. RF = Renda fixa, RV = Renda variável, CT = Criptoativos, T = trânsito, SC = Sem classe. **Todas as entradas abaixo são centavos fictícios; participações são centésimos de ponto percentual.** Os esperados são derivados das contas abaixo, não gerados pela função sob teste.

| Caso | Entradas | Resultado esperado e conta independente |
| :-- | :-- | :-- |
| CR-C01 | RF A=5000000, RF B=-500000, RV C=5000000 | S=10000000; RF=5000, RV=5000; B à parte, sem percentual. Não liquidar RF em 4500000 |
| CR-C02 | RF A=10000000, RF B=10000000, RV C=10000000 | S=30000000; RF=6667, RV=3333: pisos 6666/3333, restos 20000000/10000000. Renomear/reordenar A/B/C não muda o resultado |
| CR-C03 | RF=6000000, RV=3000000, T=1000000 | S=10000000; RF=6000, RV=3000, T=1000; T não entra em Caixa |
| CR-C04 | RF=10000000, RV=10000000, CT=10000000 | S=30000000; pisos 3333, sobra 1, restos iguais; RF=3334, RV=3333, CT=3333, pela ordem fixa |
| CR-C05 | RF=5000000, RV=5000000, T=-200000, SC=0 | S=10000000; RF=5000, RV=5000; T negativo à parte, T e SC ausentes das linhas positivas |
| CR-C06 | Um positivo de 100 em cada uma das seis macros, T e SC | S=800; oito linhas, 1250 cada, ordem 1 a 8; nenhum agrupamento residual |
| CR-C07 | RF=-100, T=-50, SC=0; subcaso sem posições | S=0; nenhuma participação/rosca; negativos preservados no primeiro subcaso; vazio no segundo |
| CR-C08 | SC=1; subcaso T=1 e todos os demais zero | S=1; única linha com 10000, anel completo, nos dois subcasos |
| CR-C09 | RF=9007199254740991, RV=9007199254740991, CT=-9007199254740991 | S=18014398509481982, acima do inteiro seguro; RF=5000, RV=5000, CT negativo à parte. Soma e formatação sem conversão monetária para Number |
| CR-C10 | Caixa=1, RF=1, RV=4 | S=6; pisos 1666/1666/6666, restos 4/4/4 e sobra 2; Caixa=1667, RF=1667, RV=6666. Exibição RV, Caixa, RF. Pela alternativa descartada: Caixa=1667, RF=1666, RV=6667. Distingue P6 da regra por ativo |
| CR-C11 | A=100 num nó nível 3 de RF, B=100 ligado diretamente à macro RF; depois A muda para RV | Antes S=200, RF=10000; depois S=200, RF=5000/RV=5000, pela P2 escolhida. Posições de M idênticas. Na alternativa congelada descartada, M permaneceria RF=10000 |
| CR-C12 | RF A=9007199254740991, RF B=9007199254740991, RV C=-9007199254740991 | S=V(RF)=18014398509481982; RF=10000, C à parte; patrimônio líquido=9007199254740991. Base **e linha** acima do inteiro seguro; formatação exata de RF: R$ 180.143.985.094.819,82, sem passagem por Number |

Complementos: recusas para fracionário/NaN/fora da faixa; negativo em SC; zeros em todas as macros; ausência de M e reabertura; invariância à ordem das entradas e aos nomes; soma 10000 para toda base positiva; paridade KB/fixture; regressão CR-53 a CR-61 intacta. Preservar todos os ativos com posição em M, inclusive desativados.

### Pontos de aprovação

| Ponto | Precondição | Cobre | Não cobre | Conferir |
| :-- | :-- | :-- | :-- | :-- |
| Autorizar rascunho (recebida em 2026-10-26) | Ideação registrada | Este plano local e reconciliação de estado | Revisão, publicação, implementação | Ideação D0–D21 |
| Aprovar plano: "aprovo o plano do ciclo 013" | Veredito apto posterior a revisão formal; propostas P1–P6 examinadas; escolhas humanas P2/P6 registradas | Publicação documental; issues após integração e confirmação do payload; futuro encerramento | Merges, implementação, ação externa, produção | Árvore, casos, transição, ressalvas e registro expresso de P2/P6 |
| Aprovar merge: "aprovo o merge da PR #N" | PR específica, diff e checks verdes | Somente seu merge | Outra PR ou próxima implementação | Documental, cada entrega, release e encerramento, separadamente |
| Autorizar implementação: "autorizo a implementação da issue #N" | Plano aprovado, documental integrada, issue válida e dependências concluídas | Unidade e validações locais | Próxima unidade, merge ou banco de produção | Payload confirmado, escopo e task |
| Ação humana externa: "concluí a ação externa da issue #N" | Merge da entrega correspondente; deploy compatível confirmado | Registro da execução humana e conferência acessível | Execução pelo agente ou avanço sem conferir | Roteiros E1/E2, migrações alinhadas, somente contagens/resultados |
| Verificar produção: "autorizo a verificação em produção do ciclo 013" | Três entregas integradas, E1/E2 concluídas | Roteiro V abaixo, sem gravar dados reais em evidências | Mudança de dados/configuração | Comportamento autenticado e privacidade |

Parar por ambiguidade de cálculo/classificação, incompatibilidade de deploy, isolamento falho, dado privado em evidência, dependência não verificada ou necessidade de ampliar escopo. Ciclo completo não admite modo contínuo. Cada transição depende da autorização correspondente; revisão não é executada neste rascunho.

## Barreiras de domínio

| Barreira | Aplica-se? | Como o ciclo a atende ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim | Regra macro e CR-C01–C12 na KB-004/fixture; contas independentes, bigint e regressão dos cálculos existentes; P2/P6 decididas pelo responsável em 2026-10-26 |
| G2 — isolamento por RLS | Sim | Catálogo global só leitura, legado isolado, RPCs com dono/trava/search_path e matriz pgTAP com dois usuários e admin |
| G3 — privacidade de dados | Sim | Nomes genéricos/fictícios em carga/testes; backfill dentro do banco; evidências só de contagem/resultado, sem nomes legados |
| G4 — migrações só acrescentam | Sim | Duas migrações novas, uma por fase; nenhuma alteração nas migrações versionadas; rollback também aditivo |

## Estratégia de testes

Gates documentais: `node --test scripts/validate-governance.test.mjs`, `node scripts/validate-governance.mjs`, `git diff --check`, `git status --short`, com Node 24. Aplicação: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Banco/autenticação: `npx supabase start`, `npx supabase test db`. UI: `npm run test:e2e` sem backend e com as variáveis locais indicadas no README; só fixtures fictícias.

Na issue 1, testar banco novo vazio e upgrade de um banco na última migração do 012 com classes fictícias antes da aplicação. Provar RLS e grants para anon, usuário A, usuário B e admin: leitura global, escrita global negada, isolamento das classes antigas e ativos, edição alheia recusada sem criar instituição, trânsito recusado e nó inexistente recusado. Provar coerência da árvore em insert/update, raízes duplicadas, nível 4, pai errado e exclusão referenciada. Provar equivalência mínima, ativos desativados, perfis novos sem sementes e chamadas antigas na janela; nenhuma posição/evento/indicador alterado.

**Ensaio de upgrade obrigatório, somente local (R1-6):** não confundir pgTAP no schema final com teste de migração. Na issue 1, preparar roteiro reproduzível na task e SQL fictício em `tests/fixtures/`: (a) em instância Supabase local descartável, executar `npx supabase db reset --local --version 20261024000829 --no-seed`; (b) carregar usuários/classes/ativos/posições fictícios com `psql -v ON_ERROR_STOP=1` no contêiner local confirmado, sem conexão remota; (c) executar a consulta prévia E1 sobre esse schema, que ainda não tem `taxonomia_id`; (d) guardar snapshot completo das linhas financeiras e indicadores **fictícios** para comparação; (e) executar `npx supabase migration up --local`, conferindo previamente que só a migração 1 está pendente na branch dessa issue; (f) comparar nulos previstos/efetivos, equivalências e igualdade integral das linhas financeiras/indicadores, e testar RPCs antigas/novas. Ao terminar, reset local completo e suíte normal. Não editar ou mover migração versionada para limitar a aplicação.

Na issue 2, repetir o ensaio a partir de reset `--version` com a versão real da migração 1, executar fixture compatível com esse estado, provar app novo com banco expandido e só então aplicar a migração 2 com `migration up --local`. Registrar comandos, versões reais, contagens e resultados na task. Esses ensaios são gates locais obrigatórios antes de publicar cada PR; a CI mantém reset completo, pgTAP e e2e no schema final, sem alegar que comprovou o upgrade. O help da CLI instalada 2.120.0 confirmou `--local`, `--version`, `--no-seed` e `migration up --local` durante esta correção; nenhum reset foi executado neste workflow documental.

Na issue 2, testar quatro combinações da tabela de transição, inclusive app novo com banco expandido antes da retirada; após retirada, conferir ausência das assinaturas/grants antigos e escrita impossível no legado. Cobrir teclado, toque, texto sem seleção, campo vazio, busca pelo ancestral sem acento, edição e reset, fallback legado, ativos desativados, navegação antiga `?aba=classes` e instituição inalterada. Ausência de backend continua sem chamadas Supabase.

Na issue 3, testes unitários e de paridade dos casos G1; leitura completa/paginada da árvore e posições, consistência das marcas antes/depois, reclassificação concorrente e indisponibilidade após limite de tentativas (sem fallback financeiro). E2E com oito linhas, nomes longos, negativos, vazio, ocultação no HTML/atributos acessíveis, M, alternador e regressão Por ativo. Conferir 360 px úteis, desktop, teclado, alvo 44 px e tabela equivalente. Não testar produção com fixtures nem registrar prints reais.

## Itens de implementação

### Item 1 — Catálogo, migração e APIs compatíveis

**Contexto:** a taxonomia precisa existir antes de qualquer consumidor novo.

**Ação técnica:** implementar a primeira fase do contrato do banco, carga da árvore aprovada e backfill; contador em profiles, trigger e RPC de leitura da marca conforme R1-2; novas RPCs sob trava da carteira e autenticação; antigas ajustadas à janela D19; remover sementes automáticas; ensaio local de upgrade e testes de isolamento. Preparar consultas agregadas E1 e roteiro na task, com SQL somente nos locais aceitos por G3 ou em blocos Markdown documentais. Atualizar documentação técnica do estado intermediário.

**Critérios de aceite:**

- [ ] Árvore exatamente igual à aprovada, identidades estáveis, restrições e permissões testadas.
- [ ] Equivalência mínima comprovada; desconhecidos nulos com legado preservado; nenhum dado financeiro modificado.
- [ ] RPCs novas e antigas coexistem sem sobrecarga ambígua; edição antiga torna o ativo Sem classe; cadastro antigo e perfil novo funcionam.
- [ ] Testes de isolamento, trânsito e regressão passam; E1 pronto; a próxima issue aguarda E1 concluída.
- [ ] Versão por carteira é monotônica e transacional; mudanças por API nova, API antiga e backfill são detectáveis; leitura retorna texto e respeita RLS; sem escrita/reset pela API.

### Item 2 — Seleção e congelamento final do legado

**Contexto:** após E1, as telas podem usar a taxonomia global e o legado pode ser fechado.

**Ação técnica:** adaptar leitura, tipos, validação e ações do cadastro/edição para as RPCs novas; seletor único opcional "Classe", busca em caminho completo sem acentos, ordem hierárquica e nenhuma opção de criação. Nome do nó na lista e caminho no seletor/edição; Sem classe com dica anterior apenas quando houver legado. Remover CRUD/aba Classes; Cadastros mantém Instituições, inclusive ao visitar `?aba=classes`. Incluir a migração 2 e roteiro E2, aplicado somente depois do deploy. Atualizar DESIGN.md para seletor e lista na própria entrega.

**Critérios de aceite:**

- [ ] Escolher macro, subclasse ou tipo não acrescenta campos/etapas; caminhos longos quebram sem rolagem horizontal.
- [ ] Validação no servidor recusa UUID inexistente; texto sem seleção não vira classe; limpar é permitido.
- [ ] Ambas as abas de Ativos mostram nó ou Sem classe/dica; instituição e quatro indicadores preservados.
- [ ] Nenhum código ativo chama RPC antiga; app novo passa antes/depois da migração 2; E2 exige deploy novo comprovado.
- [ ] Legado só leitura após E2, inclusive por RPC e papel admin; e2e/pgTAP passam.

### Item 3 — Distribuição macro e documentação viva

**Contexto:** os vínculos estão disponíveis e o responsável aprovou as regras G1, inclusive P2.

**Ação técnica:** função pura irmã, composição no servidor e leitura consistente; alternador por links "Por ativo" / "Por classe" na seção existente, padrão Por ativo e parâmetro inválido com esse mesmo padrão. Preservar filtros do Início. Uma visão por vez; rosca SVG e tabela equivalente, até oito linhas na macro, sem grupo residual. Não adicionar dependência de gráficos nem rota. Ampliar o contrato de cores/identificação da rosca para oito linhas no DESIGN.md sem mudar o limite da visão por ativo; nomes, ordem e legenda garantem identificação sem depender só de cor. Toda quantia respeita Ocultar valores no servidor.

**Contrato visual fechado para implementação (R1-8):** adicionar ao DESIGN.md 2.3 e 6.13 uma exceção restrita à distribuição macro: oito categorias, sem Outros residual. Cor fixa por identidade, independentemente de saldo/ordem/linhas ausentes: Caixa=`chart-1`, RF=`chart-2`, RV=`chart-3`, Exterior=`chart-4`, Cripto=`chart-6`, Alternativos=`chart-7`, Trânsito=`chart-8`, Sem classe=`chart-5`. Criar `chart-7: #376C3B` e `chart-8: #80552D` nos tokens documentais e em `src/app/globals.css`; não são cores de ganho/perda. Contraste sRGB calculado contra `surface #FFFFFF`: respectivamente 6,2303:1 e 6,4514:1, acima de 3:1 para gráficos. Preservar separador branco, nomes completos, legenda e tabela; não exigir distinguir categoria só pela cor. As seis cores existentes e a distribuição por ativo permanecem com o contrato atual.

O alternador é a variante **sem contador** das abas por navegação 6.12, a documentar na mesma entrega porque alterna representação, não subconjuntos contáveis. `nav` com rótulo "Distribuição do patrimônio", links `?distribuicao=ativo`/`?distribuicao=classe` preservando filtros, `aria-current="page"`, sem `role=tab`, altura mínima 44 px, foco e estilos da 6.12; voltar/avançar/recarregar preservam a escolha. Ausente/inválido abre Por ativo. Só a visão selecionada é renderizada; não mostrar contagens nem a segunda rosca oculta.

**Critérios de aceite:**

- [ ] CR-C01–C12 aprovados na KB/fixture/testes com valores esperados independentes e soma exata; CR-53–61 continuam passando.
- [ ] Macro derivada de qualquer nível; trânsito e Sem classe separados; negativos por ativo e zeros omitidos.
- [ ] Ausência de M, ausência de positivos, reabertura e falha de leitura têm estados corretos, sem número inventado.
- [ ] Alternador compacto, rosca e tabela equivalentes, oito linhas legíveis no celular; nenhuma quantia exposta com ocultação ligada.
- [ ] KB-003, KB-004, DESIGN.md e novidades atualizados; KB-002 registra operação aplicada sem dados privados; roteiro V pronto.

## Arquivos afetados

Previsão para implementação futura, sem criação de código neste workflow:

| Área | Arquivos/diretórios |
| :-- | :-- |
| Banco | Duas novas migrações em `supabase/migrations/`; testes em `supabase/tests/database/` (incluindo adaptação dos testes de metadados e inventário de RPCs) |
| Leitura e validação | `src/lib/leitura.ts` (ORDENS da árvore, Cliente com rpc e marca), `src/lib/telas/detalhes-ativo.ts`, `src/lib/telas/leituras.ts` (lerClasses/lerVinculosDosAtivos), `src/lib/telas/catalogos.ts`, `src/lib/telas/acoes-catalogo.ts` e testes; interfaces locais de Ativos/Início, sem tipos Supabase gerados |
| Telas e ações | `src/app/(app)/ativos/`, `src/app/(app)/cadastros/`, Início em `src/app/(app)/`; `src/components/formularios/novo-ativo.tsx`, `editar-ativo.tsx`, `detalhes-ativo.tsx`; componente de seletor existente |
| Alocação | Novo módulo/teste em `src/lib/financeiro/`; consumidores da rosca em `src/components/graficos/`; preservar regra de `distribuicao.ts` |
| Validação UI e upgrade | `tests/e2e/cadastros.spec.ts` e demais e2e afetados, SQL fictício em `tests/fixtures/`, roteiro local na task e testes de composição; CI existente no schema final |
| Referências e tokens | KB-002, KB-003, KB-004, `design-system/DESIGN.md`, `src/app/globals.css`, `tests/fixtures/financeiro/casos_referencia.json`, `src/lib/novidades.ts` |
| Governança | Plano, tasks futuras e `_project/cycles.md`; backlog somente por workflow próprio após integração comprovada |

## Decomposição em issues e PRs

Nenhum número alocado. Apresentar e confirmar os payloads após integração documental, antes de abrir as issues.

| Unidade | Título proposto | Dependência | PR e fechamento |
| :-- | :-- | :-- | :-- |
| 1 | [FEATURE] Implantar taxonomia global e transição dos vínculos de ativos | Plano aprovado e documental integrada | Uma PR; issue permanece aberta até E1 e encerramento |
| 2 | [FEATURE] Usar taxonomia no cadastro e congelar classes legadas | Unidade 1 integrada e E1 concluída | Uma PR com telas e migração 2; issue permanece aberta até E2 e encerramento |
| 3 | [FEATURE] Exibir alocação por classe macro no Início | Unidade 2 integrada e E2 concluída | Uma PR; pode fechar no merge, com V rastreado na task de encerramento |

Branches futuras: `chore/cycle-013-plan` para documental, `feature/issue-N` para cada unidade, `chore/cycle-013-closure` para encerramento. Commits `docs(cycle-013):` e `feat(issue-N):` conforme o caso. Não criar branch/commit/publicação neste rascunho local. Release por release-please, em PR própria; impedir fechamento antecipado das issues 1/2 por referência automática no corpo de release. Sem issue recursiva para encerramento.

## Dependências e blockers

Não há bloqueio para redigir/revisar. Implementação depende de nova revisão, aprovação humana posterior do plano (com referência às escolhas P2/P6 já registradas), integração documental e issues/autorização. A árvore proposta precisa passar pela curadoria formal, sem alegar aprovação prévia. Docker/Supabase local precisam estar disponíveis na execução dos testes. Produção depende do responsável em E1, E2 e V. Nenhuma dependência nova de pacote ou checkout externo é prevista.

### E1 — Ação externa após a unidade 1

1. Confirmar merge e `main` atualizada, alvo correto do Supabase e lista exata de migrações pendentes. Usar KB-002 S12; se aparecer migração fora da unidade, parar antes do push.
2. Antes do push, executar consulta agregada preparada/testada na issue 1: total de ativos comuns (inclui desativados), quantos **ficariam** sem nó pela equivalência D17 e contagem separada do trânsito. Não consultar coluna ainda inexistente nem devolver nomes, UUIDs ou grupos por usuário. Registrar só contagens; operações concorrentes devem ser suspensas pelo responsável durante a comparação.
3. Executar `npx supabase db push` a partir da main e `npx supabase migration list`; não fornecer credenciais ao agente.
4. Depois, contar o mesmo conjunto e os `taxonomia_id is null` efetivos; total preservado e nulos iguais à previsão. Confirmar trânsito sem nó e catálogo presente. **Limite da evidência (R1-7):** essas contagens não provam igualdade financeira em produção. A preservação financeira é sustentada pela revisão do SQL e pela comparação integral de eventos, posições, consolidados e indicadores fictícios no ensaio local de upgrade; não registrar "ausência de diferença financeira em produção" sem uma verificação própria autorizada. Nenhum hash, snapshot ou valor financeiro real é exportado. Falha de contagens pede investigação; não repetir UPDATE de backfill manualmente.
5. Confirmar aplicação antiga operacional e declarar "concluí a ação externa da issue #N" para a unidade 1. Conferir a evidência acessível e registrar a limitação de verificações feitas somente pelo responsável.

### E2 — Ação externa após a unidade 2

1. Confirmar deploy da unidade 2 servindo cadastro/edição novos e rollback compatível disponível. Atualizar main; conferir que só a migração 2 está pendente. **Não aplicar antes do novo deploy.**
2. Executar push/list conforme S12. Confirmar catálogo de RPCs/grants sem APIs antigas, legado legível apenas pelo dono e APIs novas operantes. Não cadastrar nem editar dados reais apenas para teste do agente.
3. Confirmar "concluí a ação externa da issue #N" para a unidade 2. Sem E2, não iniciar a unidade 3.

### V — Verificação em produção

Após autorização específica, conferir com o responsável: seletor/caminhos e dica legado, Cadastros somente Instituições, abas de Ativos, alternador padrão Por ativo, Por classe com M e linhas próprias, tabela/rosca, ocultação e layout mobile. Interações que gravem dados ficam a cargo do responsável em uso real autorizado; testes destrutivos ou artificiais permanecem locais. Evidências públicas só aprovado/reprovado e limitações, sem nomes, valores, UUIDs ou prints. Não declarar produção validada a partir de testes locais.

## Riscos, suposições e rollback

- Curadoria não exaustiva: aceitar pais evita forçar classificação; revisão deve conferir especialmente imóveis, multiexposição, exterior e ouro. Alteração posterior da árvore exige migração nova.
- P2 muda a distribuição de M quando muda a classe atual. A revisão/aprovação precisa torná-lo explícito; discordância exige corrigir o plano antes da implementação G1.
- Escrita antiga durante a janela pode desfazer vínculo mapeado por D19. Reduzir a janela operacional e informar a consequência; não refazer backfill depois.
- Migração 1 transacional: falha aborta a aplicação; se já aplicada, corrigir por migração aditiva. Não apagar coluna ou legado para rollback. Antes de E2, app antigo pode ser restaurado com as limitações D19; depois, usar versão compatível ou restauração aditiva das RPCs, com revisão/aprovação próprias.
- Leitura da classe deve participar da coerência da composição; não misturar catálogo parcial, classe velha e posições novas. Falha vira indisponibilidade após tentativas limitadas.
- Base positiva pode superar o patrimônio líquido e o limite de Number; legenda deve explicar a base e formatar bigint sem perda. Não somar negativos às macros.
- O retorno no backlog permanece separado da publicação do ciclo; a captura local BL-015 não pertence a este plano.

## Sequência recomendada

1. Nova rodada de revisão da v2 e correções se necessárias; aprovação humana posterior do plano vinculada às escolhas P2/P6 registradas.
2. Publicar PR documental com ideação, plano e registro do ciclo; checks e aprovação própria do merge.
3. Confirmar payloads e criar três issues. Após integração documental, reconciliar as origens BL-014 e a parcela BL-009 pela fila canônica, sem publicar retorno automaticamente.
4. Autorizar unidade 1, implementar/testar, publicar, aprovar merge, concluir E1.
5. Autorizar unidade 2, implementar/testar, publicar, aprovar merge, confirmar deploy novo e concluir E2.
6. Autorizar unidade 3, implementar/testar, publicar e aprovar merge.
7. Autorizar V e registrar resultados reais/limitações. Integrar release com aprovação própria e registrar versão/data verificadas nas novidades.
8. Encerramento prospectivo: documentação viva consolidada, fechar issues 1/2 se E1/E2 comprovadas, mover pasta para `executed/`, plano Concluído e ciclo Concluído. PR própria, gates e aprovação de merge. Nenhuma task registra SHA do próprio merge.

## Referências

- `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`.
- `.agent/workflows/rascunhar_plano.md`, template `.agent/templates/plano_implementacao.md` (lidos no ponto de uso).
- Ideação `_project/ideations/013_taxonomia_classes_alocacao.md`, decisões D0–D21 e snapshot do backlog.
- ADR-002 (stack), ADR-003 (isolamento/privacidade), ADR-005 (SVG); KB-002 S12, KB-003 e KB-004 seção 15.
- `design-system/DESIGN.md`, seções 6.7, 6.8, 6.12, 6.13 e 7.
- Migração de metadados do ciclo 012 e `supabase/tests/database/08_metadados_ativos.test.sql`.

## Rastreabilidade

| Campo | Valor |
| :-- | :-- |
| Issue(s) | — |
| PR(s) | — |
| Branch(es) | `chore/cycle-013-plan` |
| Destino após conclusão | `_project/executed/013_taxonomia_classes_alocacao/013_plan.md` |

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Pronto para continuar — ciclo 013 (completo)
Quem: Qualquer ferramenta, a pedido do responsável
Conferir: —
Diga: "continue o ciclo 013"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 013 + aprovar_plano + 013_plan + v2`
- `effect_class`: `local_mutation`
- `state_before`: plano v2 Em Revisão, rodada 2 APTO COM RESSALVAS, aprovação pendente; main e origin/main em 757ceac7a83762771278cd47efd68f54b21fa3d7; sem PR do ciclo.
- `state_after`: plano v2 Aprovado pela manifestação humana de 2026-10-26, com R2-1/R2-2 destinadas à unidade 3. Branch documental chore/cycle-013-plan preparada. Próxima ação já autorizada: publicar a PR documental; merge e implementação não autorizados.
- `result`: `executed`
- `evidence`: Registro de aprovação e rodada 2 preservada; autorização nesta sessão; fetch e comparação HEAD/origin/main; BL-009 e BL-014 presentes em origin/main. Gates documentais executados antes da publicação.
- `blockers`: nenhum para publicação documental; issues dependem de integração e confirmação dos payloads.
## Revisão crítica

### Rodada 1

- **Data:** 2026-10-26.
- **Autor:** Codex (GPT-6), conforme identificação do próprio rascunho `v1`; não verificada de forma independente.
- **Revisor:** Claude Code (Claude Opus 5.5).
- **Versão revisada:** `v1`.
- **Veredito:** `REQUER NOVA RODADA`.

#### Achados

- **R1-1 — Bloqueador: o CR-C10 não prova o desempate de resto que anuncia (G1).** O plano lê a D12 como "empate de resto pela ordem fixa, inclusive com saldos diferentes", o que difere da seção 15 da KB-004 (item 4: empate de resto segue a ordem de apresentação, isto é, maior saldo primeiro; CR-54 s2). O CR-C10 (Caixa=1, RF=4, RV=1) produz o mesmo resultado nas duas leituras: pela ordem fixa, as duas unidades vão a Caixa e RF; pela ordem de apresentação (RF, Caixa, RV), vão a RF e Caixa. Em ambas, Caixa=1667, RF=6667, RV=1666. A frase "prova desempate de resto sem priorizar saldo" é falsa, e nenhum caso separa as leituras. Substituir por um caso discriminante, por exemplo Caixa=1, RF=1, RV=4: S=6; pisos 1666/1666/6666, três restos iguais a 4, sobra 2. Pela ordem fixa: Caixa=1667, RF=1667, RV=6666. Pela ordem de apresentação: RV=6667, Caixa=1667, RF=1666. Exibição RV, Caixa, RF nas duas. Como a leitura proposta se afasta do precedente aprovado da seção 15 e o exemplo numérico da D12 não a distingue (saldos iguais), registrar as duas alternativas com esse exemplo e submetê-las à escolha expressa do responsável, como a P2 (`.agent/ai_behavior.md`, "Gestão de incertezas").
- **R1-2 — Bloqueador: a reclassificação não altera a marca de coerência, e a solução afeta a migração 1.** A estratégia exige "consistência das marcas antes/depois, reclassificação concorrente", e os riscos dizem que a leitura da classe deve participar da coerência. Mas `marcaCarteira` (`src/lib/leitura.ts:113-147`) só observa meses fechados, contagens de eventos, transferências e ativos e a última desativação; mudar `taxonomia_id` não altera nenhum componente, e o cabeçalho do módulo exige marcas "alteradas pelas mesmas transações que mudam os insumos". Com `ativos` paginado e duas reclassificações durante a leitura, a visão pode combinar um estado que nunca existiu, sem detecção nem nova tentativa. O plano precisa escolher o mecanismo — por exemplo, campo de versão em `ativos` atualizado pelas RPCs novas, criado na migração 1 e incluído na marca; leitura atômica única; ou justificativa expressa de que a classificação fica fora da marca, com a retirada do critério. A escolha muda o contrato da issue 1 ou o número de migrações e ações externas (hoje "duas migrações novas"), por isso não pode ficar para a issue 3. Declarar também que o catálogo só muda por migração e, por isso, fica fora da marca.
- **R1-3 — Ressalva: a decisão da P2 não tem a alternativa em números nem a forma de registro.** O CR-C11 mostra só a proposta. Acrescentar ao mesmo caso o resultado da alternativa "classe congelada por mês" (M continua RF=10000 até o fechamento seguinte). Declarar que a manifestação de aprovação precisa nomear a escolha da P2 e a do R1-1, registrada numa seção "Registro de aprovação", como no ciclo `010`; a frase fixa sozinha não registra qual alternativa foi aprovada.
- **R1-4 — Ressalva: falta caso G1 com total de linha acima de 2⁵³ − 1.** No CR-C09, só a base passa da faixa; cada linha vale 2⁵³ − 1. A soma por classe é um caminho novo, inexistente na distribuição por ativo. Caso sugerido: RF A = RF B = 9007199254740991 e RV C = −9007199254740991. Patrimônio 9007199254740991 (dentro da faixa), S = V(RF) = 18014398509481982, RF=10000 e C listado à parte. Ele prova a soma e a formatação do valor da linha em `bigint`, sem passar por `number`.
- **R1-5 — Ressalva: a tabela da transição contradiz o contrato da edição antiga.** A linha "Janela até issue 2" diz "RPCs antigas escrevem só legado", mas a mesma linha e o item 1 exigem que `editar_detalhes_ativo` antiga zere `taxonomia_id` (D19). Reescrever o contrato: CRUD antigo escreve só o legado; cadastro antigo deixa `taxonomia_id` nulo; edição antiga grava o legado e zera `taxonomia_id`. Sem isso, o teste da janela pode ser escrito contra a frase errada.
- **R1-6 — Ressalva: falta o mecanismo do teste de atualização do banco.** `supabase test db` aplica todas as migrações antes do pgTAP, então não há banco "na última migração do 012 com classes fictícias" no momento do teste, e o repositório não tem precedente desse tipo de teste. O mesmo vale para a consulta prévia de E1, que roda sobre o schema do 012. Definir como isso será provado e se roda na CI ou só localmente, com evidência na task — por exemplo, reset local até `20261024000829`, carga fictícia e aplicação da migração 1, ou normalização e mapeamento numa função privada testável, chamada uma vez pelo backfill.
- **R1-7 — Ressalva: E1 não tem retrato anterior para a "ausência de diferença financeira".** O passo 4 pede essa confirmação por verificações agregadas, mas o passo 2 só conta ativos. Definir a comparação antes/depois (por exemplo, contagens e igualdade de um hash das linhas de eventos e posições, calculado no próprio banco, registrando só "igual" ou "diferente", sem valores — G3) ou retirar a afirmação e apoiá-la nos testes locais.
- **R1-8 — Ressalva: o contrato visual das oito linhas está indefinido.** O DESIGN.md 2.3 tem seis tokens de gráfico e diz "No máximo seis séries; o excedente é agrupado em outros"; a D13 proíbe esse agrupamento, e a seção 7 exige razão de contraste calculada para cor nova. Definir as cores das oito linhas (tokens novos com contraste registrado ou cor fixa por classe), registrar a exceção à regra das seis séries e dizer se o alternador segue as abas 6.12, que exigem contador, ou um padrão novo documentado.
- **R1-9 — Ressalva: curadoria da árvore (D6, D16).** (a) "Dívida soberana › Títulos públicos" é filho único, não difere de irmão algum em estrutura, risco ou liquidez e só alonga o caminho; retirar ou justificar. (b) Dois casos frequentes ficam sem exemplo e têm dois nós plausíveis: poupança (Caixa pela D1.2 ou Renda fixa › Crédito bancário) e saldo em conta em moeda estrangeira (Caixa pela D1.2, 6.3 Exposição a moedas ou Investimentos no exterior pela P3). Como mudar a árvore exige migração, decidir agora.
- **R1-10 — Ressalva: precisão de "Arquivos afetados".** Não há tipos Supabase gerados (`src/lib/leitura.ts:84`: "o cliente não tem tipos gerados do schema"). A retirada da aba Classes também toca `src/lib/telas/catalogos.ts`, `src/lib/telas/acoes-catalogo.ts`, `src/lib/telas/leituras.ts` (`lerClasses`, `lerVinculosDosAtivos`), `ORDENS` em `src/lib/leitura.ts` (leitura paginada da árvore) e `tests/e2e/cadastros.spec.ts`.

#### Itens atendidos e limites

- Objetivo, escopo e não-escopo coerentes com D0–D21 e com o BL-014. Snapshot de origem conferido: `_project/backlog.md` em `db80df2` é igual ao de `main` em `757ceac`; a fila está hoje em `ba96c35`, com o BL-015 local, fora deste plano.
- Fatos conferidos por leitura: a migração `20261024000829` (classes por usuário, chave composta, restrição do trânsito, sementes, gatilho, `resolver_classe` e assinaturas das RPCs); `distribuicao.ts` (rateio antes de agrupar, cinco principais e Outros); KB-004 seção 15 e CR-53 a CR-61; DESIGN.md 2.3, 6.7, 6.8, 6.12 e 6.13; KB-002 S12; a lista fechada de `03_funcoes.test.sql`, coberta por "inventário de RPCs"; nenhuma issue ou PR aberta.
- CR-C01 a CR-C09 e CR-C11 recalculados à mão e conferem; o CR-C10 confere na aritmética, mas não discrimina (R1-1).
- Transição em duas fases (C2/D19) sólida: nomes distintos para as RPCs novas, aplicação nova antes da retirada, E2 só após o deploy novo comprovado, rollback aditivo e nenhum `cascade`.
- G2: catálogo sem `user_id`, só leitura, com RLS e grants explícitos, sem escrita do admin; matriz pgTAP com anon, A, B e admin, inclusive edição alheia sem efeito parcial. As lições do ciclo `012` (R1-1 e R1-2 daquele plano) foram incorporadas.
- G3: o plano só traz nomes genéricos e centavos fictícios; contagens agregadas sem nomes; a dica "antes: X" é lida sob RLS e fica fora de logs. G4: duas migrações novas, sem editar a do `012`.
- Pontos de aprovação com os cinco tipos e as frases canônicas, merges separados, modo contínuo proibido e P2 sinalizada como decisão humana pendente. A autorização do rascunho está registrada como "Autoriza o rascunho do plano do ciclo 013", variação verbal da frase canônica; o registro do artefato foi aceito sem verificação independente da conversa.
- Parecer sobre o plano: nenhum teste de aplicação ou banco foi executado e nenhum dado real foi aberto. O autor deve responder a cada achado e incrementar a versão, preservando esta rodada.
- **Validação da revisão:** em 2026-10-26, Node v24.15.0: `node --test scripts/validate-governance.test.mjs` 48/48 passaram; `node scripts/validate-governance.mjs` com 0 erros, 0 avisos e 5 conferências manuais; `git diff --check` sem erros e o plano (não versionado) sem espaços finais. Estado local preservado: `_project/cycles.md` modificado, ideação e diretório do plano não versionados. Somente este plano foi alterado, nos campos de status e veredito, nesta seção, no bloco "Próximo passo" e no handoff, sem commit ou publicação. A conferência manual dos textos da rodada não encontrou dados do usuário.

#### Resposta do autor à rodada 1 — v2

- **Data:** 2026-10-26.
- **Autor:** Codex (GPT-6).
- **Autorização:** "corrija o plano do ciclo 013"; decisões específicas recebidas nas três respostas registradas em Registro de aprovação.
- A rodada 1 acima foi preservada integralmente. Os estados abaixo são respostas do autor, não um novo veredito; a rodada 2 ainda não ocorreu.

| Achado | Resposta do autor | Evidência na v2 |
| :-- | :-- | :-- |
| R1-1 | Corrigido | CR-C10 substituído por Caixa=1/RF=1/RV=4; duas alternativas numéricas em P6; escolha expressa pela ordem fixa registrada |
| R1-2 | Corrigido | Migração 1 inclui contador monotônico por carteira em profiles, trigger transacional e RPC de leitura textual sob RLS; marca antes/depois na issue 3; catálogo fora da marca com limite explícito; testes de concorrência/rollback/ABA |
| R1-3 | Corrigido | P2 e CR-C11 mostram resultado atual e congelado; responsável escolheu atual; seção Registro de aprovação separa decisões de regra da futura aprovação do plano e exige vínculo expresso P2/P6 |
| R1-4 | Corrigido | CR-C12 cobre soma da própria linha acima de 2⁵³−1, percentual e formatação bigint exata |
| R1-5 | Corrigido | Tabela distingue CRUD legado, cadastro com nó nulo e edição antiga que limpa o nó e incrementa a marca quando muda |
| R1-6 | Corrigido | Ensaio obrigatório local com reset até 012 sem seed, fixture, consulta prévia e migration up; repetição da fase 2; CI declarada somente como prova do schema final |
| R1-7 | Corrigido | Retirada a alegação de igualdade financeira em produção; E1 limita-se às contagens, e a prova financeira usa comparação integral de fixtures no ensaio local |
| R1-8 | Corrigido | Mapa fixo de oito cores, dois tokens com contraste calculado contra branco, exceção restrita às seis séries e variante de links sem contador documentadas |
| R1-9 | Corrigido | Filho único Títulos públicos retirado; enquadramentos de poupança e saldo parado em moeda estrangeira decididos pelo responsável e registrados |
| R1-10 | Corrigido | Removida referência a tipos gerados; catalogos.ts, acoes-catalogo.ts, leituras.ts, ORDENS e cadastros.spec.ts explicitados |

**Validação da correção:** em 2026-10-26, testes do validador 48/48 passaram; validador com 0 erros, 0 avisos e 5 conferências manuais; `git diff --check` e verificação do arquivo não versionado com `git diff --no-index --check` sem erros. Comparação textual confirmou a rodada 1 integralmente preservada. Conferência manual: somente dados genéricos/fictícios, decisões humanas transcritas das respostas desta sessão e nenhuma alteração no backlog/ideação/cycles.md nesta correção. Nenhum teste de aplicação/banco, reset local ou acesso a dados reais realizado neste workflow.

### Rodada 2

- **Data:** 2026-10-26.
- **Autor:** Codex (GPT-6), conforme a resposta à rodada 1.
- **Revisor:** Claude Code (Claude Opus 5.5).
- **Versão revisada:** `v2`.
- **Veredito:** `APTO COM RESSALVAS`.

#### Conferência dos achados anteriores

| Achado | Resultado da revisão |
| :-- | :-- |
| R1-1 | Resolvido. O CR-C10 (Caixa=1, RF=1, RV=4) separa as leituras: recalculado, dá 1667/1667/6666 pela ordem fixa e 1667/1666/6667 pela alternativa. A P6 traz as duas alternativas, e a escolha humana está no Registro de aprovação. |
| R1-2 | Resolvido. O contador por carteira em `profiles` é monotônico, incrementado na mesma transação por trigger e criado na migração 1, sem nova migração nem ação externa. Conferido na migração `20261013005133`: `profiles` só tem `select` para `authenticated`, sem `update`, com a política `profiles_select_own`, e o admin não lê perfis alheios. Assim o usuário não reinicia o contador, e a RPC `security invoker` só devolve a própria versão. O retorno em texto evita perda de precisão de `bigint` no JSON. Segue o argumento de `src/lib/leitura.ts` (componente que só muda num sentido). O catálogo fica fora da marca, com o limite declarado. |
| R1-3 | Resolvido. O CR-C11 e a P2 mostram os dois resultados, e o Registro de aprovação separa as decisões de regra da futura aprovação do plano. |
| R1-4 | Resolvido. O CR-C12 confere: S = V(RF) = 18014398509481982, RF=10000, patrimônio 9007199254740991, e "R$ 180.143.985.094.819,82" tem agrupamento correto. |
| R1-5 | Resolvido. A tabela distingue CRUD, cadastro e edição antigos, inclusive o incremento da marca. |
| R1-6 | Resolvido. Ensaio local obrigatório nas issues 1 e 2, com fixture SQL em `tests/fixtures/` (aceita por G3). As flags `db reset --local --version --no-seed` e `migration up --local` foram conferidas no help da CLI instalada, 2.120.0. A CI fica declarada como prova só do schema final. |
| R1-7 | Resolvido. A afirmação sobre produção foi retirada, e a prova financeira passa para a comparação integral no ensaio local, sem exportar valores reais. |
| R1-8 | Resolvido, com a ressalva R2-1. Mapa fixo de oito cores, contrastes recalculados contra `#FFFFFF` (6,2303:1 e 6,4514:1, iguais aos do plano), exceção restrita às seis séries e alternador como variante sem contador da 6.12. |
| R1-9 | Resolvido. O filho único foi retirado, e os enquadramentos de poupança e de saldo em moeda estrangeira foram decididos pelo responsável e registrados. |
| R1-10 | Resolvido. A lista de arquivos foi corrigida, sem a referência a tipos gerados. |

#### Achados

- **R2-1 — Ressalva: `chart-7` (`#376C3B`) é quase o verde de `gain` (`#1F6B47`).** O DESIGN.md 2.1 reserva o verde e o vermelho dessaturados para ganho e perda. As duas cores têm a mesma luminosidade (L* 41,0 e 40,0), matiz de 143° e 157° e ΔE76 de cerca de 9,1. Numa tela financeira, a fatia de Alternativos lê como "positivo". Escolher para `chart-7` um matiz fora das famílias verde e vermelha (e recalcular o contraste), ou justificar a escolha no DESIGN.md com a distância medida. O `chart-8` (`#80552D`) está suficientemente longe de `loss` (ΔE76 ≈ 30,7) e de `chart-3` (≈ 27,0).
- **R2-2 — Ressalva: o formulário de período descarta `distribuicao`.** O plano exige que os links do alternador preservem os filtros, mas não o contrário. O formulário de período do Início é um GET só com `periodo`, `de` e `ate` (`src/app/(app)/page.tsx`), então aplicar um período troca a query string e volta para "Por ativo". Exigir que a escolha seja preservada também nesse envio (por exemplo, com um campo oculto) e cobrir isso no e2e do item 3.

#### Itens atendidos e limites

- Regra de progresso atendida: os bloqueadores caíram de 2 para 0, nenhuma correção reapareceu e não houve oscilação. As duas ressalvas novas são detalhes de execução da issue 3 e não mudam regra financeira, schema nem sequência.
- Escopo, decomposição, dependências de deploy, pontos de aprovação e G1 a G4 continuam coerentes com a rodada 1. Todos os 12 casos G1 foram recalculados à mão e conferem.
- As manifestações do Registro de aprovação (P2, P6 e os enquadramentos da árvore) foram aceitas conforme o registro do artefato, sem verificação independente da conversa de origem. Elas não constituem a aprovação do plano, que continua pendente e precisa vir depois deste veredito.
- Observação editorial, sem efeito no veredito: a abertura do Registro de aprovação diz que o veredito "permanece `REQUER NOVA RODADA`", o que esta rodada superou (vale o cabeçalho); o segundo item de "Riscos" ainda trata a P2 como decisão pendente; e "Contexto e baseline" não cita o DESIGN.md 2.3. O revisor não reescreve o corpo; o autor pode ajustar numa eventual correção.
- Parecer sobre o plano: nenhum teste de aplicação ou banco foi executado e nenhum dado real foi aberto. A rodada 1 e a resposta do autor foram preservadas.
- **Validação da revisão:** em 2026-10-26, Node v24.15.0: `node --test scripts/validate-governance.test.mjs` 48/48 passaram; `node scripts/validate-governance.mjs` com 0 erros, 0 avisos e 5 conferências manuais; `git diff --check` sem erros e o plano (não versionado) sem espaços finais; duas rodadas registradas, abaixo do teto de 5. Estado local preservado: `_project/cycles.md` modificado, ideação e diretório do plano não versionados. Somente este plano foi alterado, nos campos de revisão e veredito, nesta seção, no bloco "Próximo passo" e no handoff, sem commit ou publicação. A conferência manual dos textos da rodada não encontrou dados do usuário.

## Pós-mortem

- **Data de conclusão:** —
- **Desvios:** —
- **Lições comprovadas:** —
