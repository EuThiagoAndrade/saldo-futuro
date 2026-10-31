# Ideação — 018: organização dos atributos e Previdência como veículo

> **Ciclo:** `018`
> **Estado:** `Ideação`
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 018" em 2026-10-30
> **Criado em:** 2026-10-30
> **Última atualização:** 2026-10-30
> **handoff_schema_version:** `2`

## Problema

O ciclo `017` entregou os atributos complementares dos ativos (banco, cadastro e edição, "Ver detalhes" e "Filtrar" em `/ativos`). Ao usar as telas em produção, o responsável apontou problemas de uso:

1. **Filtro com opções demais.** Veículo de acesso (8 caixas) e Indexador da remuneração (11 caixas) aparecem todos abertos, junto com outros dez campos.
2. **Filtro sem divisão por assunto.** Não fica claro o que é prazo, o que é tributação e o que é Previdência.
3. **Depois de aplicar, a página volta ao topo com o painel aberto**, e a linha "filtros aplicados · N de M nesta aba" não serve ao usuário.
4. **No cadastro, a Previdência ao lado do Veículo de acesso confunde.** Previdência privada (PGBL ou VGBL) é um veículo, mas hoje existem duas perguntas sobre ela: a opção "Plano ou contrato" do veículo e o indicador "Previdência" (Sim/Não/Não informado), herdado do ciclo `012`.
5. **A frase "Informações preenchidas por você…" no "Ver detalhes" não acrescenta nada** para quem só está consultando.

## Origem no backlog

Não se aplica. A origem é a decisão do responsável depois da Rodada 5 do plano do ciclo `017` ("Sim, ciclo 018"), registrada em `_project/drafts/017_atributos_complementares_ativos/017_plan.md`, seção "Decisão do responsável após a Rodada 5". O BL-015, origem do `017`, não é selecionado de novo.

## Contexto e evidências

- **Base:** `main` = `origin/main` = `8cba4ac2dadc825057af777456530a9cbc66da6c`, com as PRs #175 (banco), #177 (formulários) e #178 (consulta) integradas. A ação externa da migração `20261031000721_atributos_complementares_ativos.sql` foi relatada pelo responsável. A release 0.13.0 (PR #176) ainda não foi integrada.
- **Registros do 017:** os registros do 017 que ainda não foram integrados (versão 5 do plano com as emendas E-1 e E-2, Rodada 5, decisão do responsável e reconciliação da task da #174) estão sem commit na branch local `chore/cycle-017-closure` e seguirão na PR de encerramento do `017`. As decisões D13 a D18 e os achados R5-1 a R5-7 estão lá, por extenso.
- **Código atual:**
  - catálogos e leitura do formulário em `src/lib/telas/detalhes-ativo.ts`;
  - "Mais detalhes" em `src/components/formularios/detalhes-ativo.tsx`, com caixas abertas e cinco blocos sem título;
  - filtros em `src/lib/telas/filtros-ativos.ts` e `src/components/ativos-consulta.tsx`; o painel abre sempre que há filtro;
  - catálogo de veículos no banco em `private.canonizar_veiculos_acesso`, com a restrição `ativos_veiculos_acesso_check`;
  - as funções novas repassam `p_previdencia` às anteriores, e `editar_ativo_com_nome` grava `previdencia = p_previdencia` sem condição.
- **Esboço aprovado:** o responsável aprovou um esboço interativo do filtro com quatro grupos, listas suspensas de múltipla escolha, opções em uso e painel que fecha ao aplicar ("Eu gostei da sua proposta que você colocou aqui acima, exemplificativa").
- **Dados reais:** nenhum dado real foi lido. Sobre os dados já gravados no indicador Previdência, o responsável disse "eu posso migrar isso aí" e preferiu a conversão por migração, para todos os usuários; não há contagem nem verificação.

### Decisões de produto já tomadas pelo responsável (herdadas do 017)

| ID | Decisão |
| :-- | :-- |
| D13 | Quatro grupos com título, na mesma ordem, no cadastro, na edição, no "Ver detalhes" e no "Filtrar": **Produto** (Veículo de acesso, Indexador da remuneração), **Tributação** (Regime tributário, Isento de IR), **Resgate** (Prazo para resgate ou venda, Liquidez imediata (reserva)) e **Proteção e exposição** (Cobertura do FGC, Exposição cambial) |
| D14 | Veículo e indexador como **lista suspensa de múltipla escolha**, no cadastro, na edição e no filtro. No cadastro, o catálogo inteiro; no filtro, só as opções presentes em algum ativo comum do usuário (das duas abas), mais "Não informado" e as que estiverem marcadas na URL |
| D15 | "Filtrar" fecha ao aplicar e mostra a lista; o painel só abre sozinho quando há erro. A linha "filtros aplicados · N de M" sai: "Filtrar" ganha um contador de filtros ativos, com "Limpar filtros" ao lado. Comparação, Dias e Unidade só aparecem com "Prazo em dias" |
| D16 | No cadastro, "Prefixado (sem indexador)" e "Não se aplica" continuam exclusivos, com a dica literal "Em títulos híbridos, como IPCA + taxa, marque só o indexador. Use Prefixado quando a remuneração não tiver indexador." No filtro, só "Não informado" é exclusivo |
| D17 | A frase de D9 sai do "Ver detalhes" e fica só no "Mais detalhes" do cadastro e da edição |
| D18 | Previdência é veículo: opção única **"Previdência (PGBL ou VGBL)"**, código `previdencia`, entre ETF e "Plano ou contrato", que continua. O indicador Previdência sai de todas as telas. Conversão: `previdencia = true` acrescenta `previdencia` ao veículo e retira `plano_contrato` e `nao_aplicavel`; `false` e nulo não geram veículo; a coluna fica nula e congelada como legado, com remoção física em ciclo futuro. A parte tributária continua em "Regime tributário" |

## Resultado desejado

- Uma pessoa encontra e entende cada campo pelo assunto, nos três lugares, sem paredes de caixas.
- Ao filtrar, ela vê os resultados logo abaixo, com o painel fechado e um jeito claro de limpar.
- Previdência é marcada uma vez só, no veículo, e os dados já gravados são convertidos para todos os usuários, sem perda e sem janela em que uma tela grave por cima do que não mostra (achado R5-1).
- Nenhuma mudança em cálculo, eventos, saldos ou nas marcas de leitura do Início.

## Hipóteses

- **H1.** A lista suspensa com `<details>` nativo, caixas dentro de um `fieldset` com `legend` fora dela e o resumo com nome acessível ("Veículo de acesso: Fundo, ETF") atende acessibilidade e funciona sem JavaScript; com JavaScript, ela fecha com clique fora e com Esc, e o foco volta ao resumo (R5-5).
- **H2.** Mostrar no filtro só as opções em uso reduz a lista sem esconder resultado possível, porque uma opção sem ativo nunca traz resultado.
- **H3.** A conversão da Previdência pode ser feita sem perda se a tela nova conhecer o código `previdencia` antes de qualquer conversão e nunca gravar `previdencia` nulo por cima de um "Sim" ainda não convertido.
- **H4.** A âncora da lista (`#ativos-da-aba`) resolve "voltar posicionado nos resultados"; com erro de filtro, a mensagem precisa ficar dentro ou logo acima da área da âncora (R5-5).

## Alternativas

**Transição da Previdência (fecha R5-1):**

| | A — catálogo primeiro, conversão depois da tela | B — tela primeiro, migração única depois |
| :-- | :-- | :-- |
| Sequência | Migração 1 só amplia o catálogo → tela nova trata `previdencia = true` como "Previdência" marcada no veículo e, ao salvar, grava o veículo e anula o indicador → migração 2 converte as sobras e congela a coluna | Tela nova conhece o código, esconde o indicador e devolve à função o valor gravado sem alterá-lo → migração única, depois do deploy, amplia o catálogo, converte e congela |
| Ações externas | Duas | Uma |
| Janela | Nenhuma escolha recusada; a tela nova precisa da lógica de equivalência até a migração 2 | Entre o deploy e o `db push`, escolher "Previdência" no veículo é recusado pelo banco com mensagem clara, sem perda |
| Complexidade | Maior na tela, temporária | Menor, desde que o deploy e o `db push` aconteçam juntos |

As duas fecham R5-1 se tiverem testes dos dois caminhos de perda. A escolha é técnica e fica para o plano, com a revisão formal do 018.

**Remoção da coluna `ativos.previdencia`:** (a) só congelar agora (`previdencia is null`) e remover em ciclo futuro, como foi feito com `classe_id`, que é o que D18 diz; (b) remover a coluna e o parâmetro neste ciclo, o que troca as assinaturas das funções em produção e exige outra fase. Mantém-se (a), salvo decisão contrária.

## Riscos e restrições

- **Perda de dados na transição (R5-1):** é o risco principal; precisa de teste para cada caminho e ensaio de upgrade com retrato integral, como na #172.
- **Restrição nova recusa gravações (R5-2):** testes pgTAP (`08`, `12`) e e2e (`ativos-consulta.spec.ts`) que gravam o indicador precisam mudar junto; a migração deve travar a tabela antes de converter.
- **Casos da conversão (R5-3):** precisam ser enumerados: ativos desativados, `{fundo, plano_contrato}`, `{nao_aplicavel}`, conjunto vazio e reexecução, com a guarda de forma canônica depois da conversão.
- **G1:** não se aplica (nenhuma regra de cálculo lê esses campos). **G2:** se aplica à conversão em massa e às funções. **G3:** só dados fictícios; a URL guarda só códigos. **G4:** migrações novas, nenhuma editada.
- **Processo:** o responsável passou a testar localmente antes de aprovar o merge de tela. Cada PR de tela deve trazer um roteiro curto de teste local.
- **Ordem com o 017:** o 017 ainda tem verificação em produção, release 0.13.0 e encerramento. O 018 muda a mesma tela; a verificação do 017 vale para a tela entregue.

## Perguntas em aberto

1. **Release:** a 0.13.0 sai no encerramento do 017, com a tela atual, e o 018 vira a 0.14.0? Ou a release espera para sair junto com o 018?
2. **Contador do "Filtrar":** conta os campos com filtro (dois veículos marcados contam 1) ou as opções marcadas (contam 2)? A recomendação é contar os campos.
3. **Remoção física da coluna Previdência:** fica para um ciclo futuro, como em D18? A recomendação é que sim.
4. **"Plano ou contrato":** continua no catálogo, para outros contratos, como D18 diz. Há algum produto seu que hoje esteja marcado assim e não seja previdência? A resposta só calibra o texto de ajuda; não muda a conversão, que você já aprovou.

## Fora do escopo

- Qualquer cálculo de imposto, prazo, garantia ou conversão de unidades; mudanças em eventos, saldos, fechamento ou nas marcas de leitura do Início.
- Novos atributos, mudanças nos outros três indicadores (Liquidez imediata, Exposição cambial, Isento de IR) e no catálogo de indexadores e regimes.
- Remoção física da coluna `previdencia` e dos parâmetros `p_previdencia`, salvo resposta contrária à pergunta 3.
- Preservar filtros depois de editar um ativo; faixa de prazo com dois limites.

## Critérios para iniciar o planejamento

- Perguntas 1 a 4 respondidas ou explicitamente deixadas para o plano.
- Encerramento do 017 encaminhado ou ordem combinada, para o plano do 018 partir da `main` certa.
- "autorizo o rascunho do plano do ciclo 018".

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Ideação registrada — ciclo 018 (completo)
Quem: Responsável
Conferir: Perguntas em aberto 1 a 4 e as decisões herdadas D13 a D18 nesta ideação
Diga: "autorizo o rascunho do plano do ciclo 018"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 018 + idear + organizacao_atributos_previdencia + 8cba4ac2dadc825057af777456530a9cbc66da6c`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `017` com as entregas #172 a #174 em `main` (`8cba4ac2dadc825057af777456530a9cbc66da6c`), verificação em produção pendente e registros sem commit na branch local `chore/cycle-017-closure`; triagem do 018 proposta e confirmada pela frase de entrada em 2026-10-30; `cycles.md` com próximo ciclo `018`.
- `state_after`: ideação do 018 criada sem commit; ciclo `018` reservado em `cycles.md` como `Ideação` e próximo ciclo `019`; nenhum plano, issue, branch remota, código ou migração.
- `result`: `executed`
- `evidence`: frase de entrada recebida em 2026-10-30; D13 a D18 e R5-1 a R5-7 no plano do 017; leitura do código citado; validador e `git diff --check` depois da gravação.
- `blockers`: perguntas em aberto 1 a 4; autorização do rascunho do plano.
