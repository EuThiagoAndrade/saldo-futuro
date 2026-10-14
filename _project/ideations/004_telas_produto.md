# Ideação — 004: telas do produto

> **Ciclo:** `004`
> **Estado:** `Ideação`
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 004" em 2026-10-14
> **Criado em:** 2026-10-14
> **Última atualização:** 2026-10-14
> **handoff_schema_version:** `2`

## Problema

O Saldo Futuro está em produção na versão `0.2.0` com a fundação e as regras financeiras, mas ninguém consegue usá-lo (KB-003):

- a única tela autenticada é "Em construção" (`src/app/page.tsx`);
- a carteira, os lançamentos, o fechamento, a rentabilidade e os benchmarks existem só como funções do banco e módulos em `src/lib/`, sem interface;
- nenhum benchmark foi sincronizado, porque a sincronização com o SGS não tem rota nem botão;
- a lista de acessos só é gerida por SQL do responsável (KB-002, procedimentos P2 a P4).

O ciclo `003` deixou para este ciclo, de forma explícita (`003_plan.md`, "Fora do escopo"):

- as telas de produto, o painel e os gráficos;
- a tela de administração de acessos;
- a rota e o botão de sincronização com o SGS (D10);
- o parser de quantias digitadas, especificado na KB-004, seção 10 (O13, K11).

Este ciclo leva o produto à paridade de uso com as telas do `Meus-Investimentos` (KB-001, "Telas"), sem a migração dos dados (ciclo `005`). É o primeiro ciclo em que dados reais de carteira vão entrar em produção, digitados pelo próprio usuário.

## Contexto e evidências

### No Saldo Futuro (`main` @ `89d3cd3`)

**Interface e contrato visual**

- `design-system/DESIGN.md` já fixa o contrato das telas:
  - navegação (6.1): barra inferior com Início, Lançamentos, Ativos, Benchmarks e Mais; menu lateral a partir de `lg`; o conteúdo de "Mais" é definido neste ciclo, e o destino de administração só aparece para o `admin`;
  - valor monetário, percentual, variação e `N/D` (6.2 a 6.5);
  - cartão de lançamento, tabela que vira lista de cartões, formulário, botões, confirmação destrutiva e estados vazio, carregando e erro (6.6 a 6.11);
  - paleta de gráficos (2.3), com a biblioteca a escolher neste ciclo; carteira em linha contínua e benchmark tracejado;
  - acessibilidade WCAG 2.2 AA (7).
- `design-system/referencia.html` demonstra o contrato, mas "não define layout final de telas".
- Os tokens e a fonte já estão em `src/app/globals.css`; só existem dois componentes (`login-panel.tsx` e `preview-notice.tsx`).
- Stack (ADR-002): Next.js 16 com App Router, React 19, Tailwind 4, `@supabase/ssr` e Zod. Não há biblioteca de gráficos, de ícones nem de componentes (`package.json`).
- O preview de PR não tem backend e mostra o aviso "Preview sem backend". Local e CI usam o Supabase local com `supabase/seed.sql` fictício.

**Regras e dados disponíveis**

- Escrita da carteira só por funções `security definer` com trava por usuário: `criar_ativo`, `desativar_ativo`, `lancar_evento`, `estornar_evento`, `transferir`, `corrigir_transferencia`, `fechar_mes` e `reabrir_mes` (`supabase/migrations/20261014185205_carteira.sql`).
- Leitura pelas tabelas, com RLS por `user_id`: `ativos`, `eventos`, `transferencias`, `consolidados_mensais` e `posicoes_mensais`.
- Nenhum percentual é gravado: rentabilidade, acumulado, base 100, drawdown e comparações são calculados na leitura, pelos módulos de `src/lib/financeiro/` (`rentabilidade.ts`, `acumulado.ts`, `benchmarks.ts`, `apresentacao.ts`).
- A prévia do fechamento (pendências e ajustes) é calculada no TypeScript (`previaFechamento`, `fechamento.ts`); a função do banco recalcula e confere tudo (KB-004, seção 5, D5).
- O ativo tem só nome, tipo de ajuste (`rendimento` ou `marcacao`) e situação. **Não existe classe de ativo nem instituição** no schema.
- Eventos são imutáveis: corrigir é estornar (KB-004, 4.3). Aporte é positivo e resgate é negativo; rendimento, marcação e câmbio aceitam qualquer sinal (4.2).
- O parser de quantias (KB-004, seção 10, CR-50) está especificado e **não implementado**.
- Benchmarks: catálogo com CDI (SGS 12, diária) e IPCA (SGS 433, mensal); escrita só por `carregar_benchmark`, que exige o admin; `sincronizarBenchmark` (`src/lib/benchmarks/sgs.ts`) recebe o cliente do Supabase e o `fetch` injetados. Mês parcial de série diária não tem retorno comparável (K4).
- Comparação (KB-004, 9.4): diferença em p.p., % do benchmark e taxa de acerto sobre o período efetivo; qualquer mês `N/D` torna as três medidas `N/D` (K1).

**Acessos (ADR-003, KB-002, KB-003)**

- `public.authorized_emails`: o `admin` já lê, insere e exclui pela Data API; ninguém altera.
- `public.profiles`: cada usuário lê **só o próprio** perfil; ninguém altera pela API. O admin não lê perfis alheios.
- Mudar o papel de uma conta existente (P3) exige atualizar `profiles.role`, que nenhum papel da aplicação pode alterar.
- Revogar de verdade (P4) exige excluir o usuário em `auth.users`, o que a chave publicável não faz. A exclusão apaga em cascata **toda a carteira** do usuário (lição de 2026-10-14 sobre cascatas).
- Enquanto a tela de consentimento do Google estiver em "Testando", cada e-mail autorizado também precisa ser cadastrado como usuário de teste no Google Cloud (KB-002, armadilha 7, passo GC4), uma ação externa que nenhuma tela do produto faz.

**Processo**

- G1: as telas apresentam resultados de regra financeira e o parser é regra da KB-004. Nenhuma regra de cálculo nova está prevista, mas qualquer uma que surgir segue G1.
- G2: qualquer função ou política nova para a administração de acessos precisa de teste de isolamento.
- G3: este é o primeiro ciclo com dados reais de carteira em produção. Prints, testes, seeds e evidências continuam só com dados fictícios.
- Lições aplicáveis: "Critérios devem expressar o objetivo verificável" (2026-10-12), "Revisar um plano com outra ferramenta" (2026-10-13), "Roteiros de serviço externo" (2026-10-13).

### Na origem (`Meus-Investimentos` @ `1b13b033ce4335c09df80237c8c31b96b37e3797`, fixada na KB-001)

Leitura somente leitura do frontend, sem rodar a aplicação e sem gravar nada no repositório de origem. Nenhum dado real de usuário apareceu nos arquivos de interface lidos. A origem é uma SPA em JavaScript puro, com Chart.js e ícones carregados de CDN sem versão fixa e sem autenticação no cliente da API (`frontend/index.html:39-40`, `frontend/assets/js/api.js:70-106`). Código e layout não são reaproveitados (KB-001); o inventário serve à paridade funcional.

| Tela | O que mostra | Ações | Evidência |
| :-- | :-- | :-- | :-- |
| Dashboard | Patrimônio do mês e do anterior, variação, evolução patrimonial, variação mensal por ano; composição por instituição, por tipo e por classificação; indicadores por categoria; tendência por ativo em 1, 6 e 12 meses | Só leitura; "Ocultar dados" troca valores por `***`, marcado por padrão | `frontend/pages/dashboard.html:10`, `frontend/assets/js/ui.js:36-126`, `frontend/assets/js/charts.js` |
| Ativos | Tabela paginada com filtros por instituição, classificação e atributos | Cadastrar, desativar com confirmação; bloqueado em período fechado | `frontend/assets/js/ativos.js:375-700` |
| Transações | Novo evento em gaveta; tabela de saldos do fechamento (inicial, eventos, calculado, real editável, ajuste); lista de eventos do período | Lançar, aplicar ajustes, fechar e reabrir mês, todos com confirmação | `frontend/assets/js/transacoes.js:1-11`, `:602-730`, `:979-1074` |
| Benchmark | Catálogo com periodicidade, código SGS e última atualização | Criar, excluir, sincronizar com o SGS (sem confirmação), importar CSV, inserir valor manual | `frontend/assets/js/benchmark.js:60-546` |
| Comparação | Linha carteira × benchmark (mensal ou base 100), barras do diferencial em p.p., tabela mês a mês, taxa de acerto, drawdown, beta e information ratio | Escolher benchmark, período e tipo | `frontend/assets/js/comparacao.js:18-244` |
| Ajuda | Busca e FAQ vazia | Nenhuma | `frontend/assets/js/ajuda.js:13-15` |

Não há tela de administração de usuários. "Configurações" e "Perfil" só mostram "em breve" (`frontend/assets/js/router.js:183-195`).

**Defeitos de interface da origem**, que não podem ser repetidos:

| # | Fato | Evidência |
| :-- | :-- | :-- |
| U1 | Valores ausentes viram zero (`Number(v) \|\| 0`) em moedas, percentuais, grades e roscas | `frontend/assets/js/formatters.js:16-51`, `frontend/assets/js/consolidacao_mensal.js:82-83` |
| U2 | Sem o mês anterior, a primeira barra de variação mostra o patrimônio inteiro, e meses faltantes são saltados | `frontend/assets/js/transformers.js:27-39` |
| U3 | O painel usa o último mês com dado sem dizer se está aberto ou fechado | `frontend/assets/js/main.js:82-89` |
| U4 | O estorno pede o identificador do evento, que a lista não mostra | `frontend/pages/transacoes.html:153`; `frontend/assets/js/transacoes.js:843-851` |
| U5 | Entrada monetária por `<input type="number">` lido com `Number()`, sem formato brasileiro | `frontend/pages/transacoes.html:147`, `frontend/assets/js/ativos.js:672` |
| U6 | Falha da comparação fica silenciosa; validações usam `alert()` | `frontend/assets/js/comparacao.js:183-251` |
| U7 | Dados da API interpolados em `innerHTML` e `onclick` sem escape | `frontend/assets/js/benchmark.js:93`, `frontend/assets/js/transacoes.js:845-850` |
| U8 | "N/A" numa tela e "N/D" em outra | `frontend/assets/js/benchmark.js:69-71` |

A composição por instituição, tipo e classificação e os indicadores por categoria dependem de atributos que o schema do Saldo Futuro não tem (P8). Beta e information ratio foram adiados no ciclo `003`.

### Evidências ausentes

Ficam para confirmar no rascunho do plano:

- se a Data API do SGS aceita a chamada a partir da função de servidor da Vercel (região, tempo limite do plano Hobby e tamanho das janelas de 10 anos do CDI diário);
- o desempenho de calcular rentabilidade e comparação na leitura, a cada página, com dezenas de ativos e alguns anos de eventos (fictícios), antes de decidir se algo precisa de cache;
- a versão e a licença da biblioteca de gráficos e de ícones, se P4 e P5 escolherem dependência.

## Resultado desejado

Ao fim do ciclo, em produção, um usuário autorizado consegue, só pelo celular ou pelo desktop:

- **Ativos:** criar, listar e desativar ativos (com a recusa de saldo não zero explicada), ver o ativo "Em trânsito".
- **Lançamentos:** registrar aporte, resgate, rendimento, marcação e câmbio, com o parser da KB-004; listar e filtrar; estornar no detalhe, com confirmação; registrar e corrigir transferências, inclusive pelo trânsito.
- **Fechamento:** ver as pendências do mês, informar o saldo real de cada ativo, conferir os ajustes e a identidade, fechar; reabrir o último mês fechado, com confirmação.
- **Início (painel):** patrimônio, variação, rentabilidade do mês, do ano e acumulada, distribuição por ativo e gráficos de evolução, com `N/D` onde a KB-004 manda.
- **Benchmarks e comparação:** ver o catálogo, a cobertura de cada série e a comparação da carteira com CDI e IPCA (p.p., % do benchmark, taxa de acerto e base 100).
- **Administração (só `admin`):** sincronizar os benchmarks com o SGS e gerir a lista de acessos, no alcance decidido em P10.

Tudo segue o `DESIGN.md`, com testes ponta a ponta sobre dados fictícios e verificação de acessibilidade, sem nenhuma regra de cálculo nova.

## Hipóteses

- **H1 — Servidor primeiro.** Páginas como Server Components leem com a sessão do usuário (RLS) e calculam com `src/lib/financeiro/` no servidor; escritas por Server Actions que chamam as funções do banco e validam a entrada com Zod e o parser. Nenhuma chave secreta entra na aplicação.
- **H2 — Nenhuma regra nova.** As telas só compõem regras já especificadas. Uma necessidade de cálculo nova (por exemplo, rentabilidade por ativo ou distribuição por classe) vira pergunta ao responsável, com exemplo numérico, e não é inventada na tela.
- **H3 — Nenhuma migração para a carteira.** O schema do ciclo `003` basta para as telas da carteira e de benchmarks. Só a administração de acessos pode exigir migração (P10).
- **H4 — Dados fictícios bastam para testar.** O seed local ganha uma carteira fictícia com vários meses fechados, um mês `N/D` e benchmarks fictícios, suficiente para os testes ponta a ponta e para revisar as telas sem dado real.
- **H5 — O ciclo cabe em entregas revisáveis por área:** base de navegação e componentes; ativos e lançamentos; fechamento; painel e gráficos; benchmarks, comparação e sincronização; administração de acessos (ver P1).

## Alternativas

### Fatiamento

| Alternativa | Vantagem | Custo ou risco |
| :-- | :-- | :-- |
| Um ciclo com todas as telas, em cerca de seis entregas (H5) | Cumpre o mapa de ciclos; o produto fica utilizável de uma vez | Ciclo grande; muitas decisões de UX numa só ideação |
| Ciclo `004` só com a carteira (ativos, lançamentos, fechamento e painel); benchmarks, comparação e administração num ciclo seguinte | Uso real começa mais cedo; ciclos menores | Renumera a migração para `006`; a comparação, que é motivo central do produto, fica para depois |
| Um ciclo sem a administração de acessos, que continua por SQL (KB-002) | Evita mudança de schema e de autorização (G2) neste ciclo | O responsável continua usando SQL em produção para autorizar pessoas |

### Onde rodam leitura, cálculo e escrita

| Alternativa | Vantagem | Custo ou risco |
| :-- | :-- | :-- |
| Server Components e Server Actions (H1) | Cálculo e sessão no servidor; menos JavaScript no celular; segue o padrão do ciclo `001` | Cada navegação refaz leitura e cálculo; formulários precisam de estado de envio e erro bem feitos |
| Leitura no cliente com o `supabase-js` e cálculo no navegador | Interações mais rápidas depois da carga | Mais JavaScript; regras rodando em dois lugares; mais superfície para expor dados por engano |
| Rotas de API próprias para tudo | Contrato explícito | Camada extra sem consumidor além da própria interface |

### Gráficos

| Alternativa | Vantagem | Custo ou risco |
| :-- | :-- | :-- |
| Componentes SVG próprios para os poucos tipos necessários (linha e barras) | Sem dependência; controle total de tokens, traço tracejado, rótulo direto e acessibilidade | Mais código próprio para manter; eixos e escalas feitos à mão |
| Biblioteca pronta (por exemplo, Recharts) | Eixos, escalas e interação prontos | Dependência nova e maior no celular; ajustar ao `DESIGN.md` (tracejado, rótulo direto, cores por token) pode exigir customização |

## Riscos e restrições

- **Número errado na tela (G1).** Uma composição incorreta de regras certas (período errado, mês aberto tratado como fechado, `N/D` virando zero, trânsito fora do patrimônio) é tão grave quanto uma regra errada. Mitigação: testes de componentes e ponta a ponta que conferem os números exibidos contra os casos de referência da KB-004, e nenhum cálculo escrito na camada de interface.
- **Entrada monetária.** O defeito O13 da origem transformava `1234.56` em 123456. Mitigação: o parser estrito da KB-004 (K11) no cliente e no servidor, que recusa em vez de adivinhar.
- **Isolamento (G2).** A administração de acessos é o único ponto em que o admin age sobre outros usuários. Funções novas podem furar o isolamento ou dar ao admin leitura de carteiras alheias. Mitigação: alcance mínimo (P10), testes pgTAP e nenhuma leitura de dados financeiros por papel.
- **Revogação destrutiva.** Excluir uma conta apaga a carteira inteira em cascata, sem desfazer. Se entrar no ciclo, exige confirmação forte e precisa de decisão explícita (P10).
- **Privacidade (G3).** Primeiro uso real: prints de revisão, vídeos e evidências de produção nunca mostram a carteira do responsável. O preview continua sem backend.
- **Integração externa (SGS).** Chamadas longas podem estourar o tempo limite de função da Vercel Hobby; o SGS pode falhar ou mudar formato. A sincronização já é atômica (D10), mas a tela precisa explicar falha sem número parcial.
- **Ação externa esquecida.** Autorizar um e-mail pela tela não basta enquanto o Google estiver em "Testando" (GC4). Sem aviso, a pessoa autorizada não consegue entrar.
- **Escopo.** Há a tentação de incluir migração (ciclo `005`), importação de planilhas, métricas de risco adiadas no `003` (tracking error, information ratio e beta) ou benchmark de valor absoluto (D14). Ficam fora (ver "Fora do escopo").
- **Tamanho.** É o ciclo com mais telas e decisões de UX. Se a revisão do plano não convergir, o fatiamento (P1) deve ser revisto.
- **Barreiras de domínio previstas:**
  - G1: aplica-se (apresentação de resultados e parser);
  - G2: aplica-se (escritas pela interface e administração de acessos);
  - G3: aplica-se (seed, testes, prints e primeiro uso real);
  - G4: aplica-se se a administração de acessos exigir migração.

## Perguntas em aberto

Todas as decisões abaixo são do responsável. Os valores são fictícios. Onde aparece "Recomendação", ela é só a proposta do autor: nada foi decidido. As que tocam apresentação de números seguem a regra de `.agent/ai_behavior.md`, com alternativas e exemplos.

### Escopo e arquitetura

**P1 — Fatiamento.** Escolha uma das alternativas da seção "Fatiamento". Recomendação: um ciclo com todas as telas, em seis entregas na ordem de H5, deixando a administração de acessos por último, no alcance mínimo de P10, para que ela possa sair do ciclo sem afetar as demais.

**P2 — Leitura, cálculo e escrita.** Escolha uma das alternativas de "Onde rodam leitura, cálculo e escrita". Recomendação: Server Components e Server Actions (H1).

**P3 — Navegação e "Mais".** O `DESIGN.md` fixa Início, Lançamentos, Ativos, Benchmarks e Mais. Proposta para o resto:

- **Fechamento** dentro de Lançamentos (o fechamento é o fim do ciclo de lançar um mês), com um aviso no Início quando houver mês terminado ainda aberto;
- **Comparação** dentro de Benchmarks;
- **Mais:** Transferências, Conta (e-mail, perfil e Sair) e, só para o `admin`, Administração (sincronização e acessos).

Recomendação: adotar a proposta. Alternativa: Fechamento como destino próprio em "Mais".

**P4 — Gráficos.** Escolha uma das alternativas de "Gráficos". Gráficos previstos: evolução do patrimônio (linha), rentabilidade mensal (barras de ganho e perda), base 100 da carteira contra benchmarks (linhas) e distribuição por ativo (barras horizontais, sem pizza). Recomendação: componentes SVG próprios, cada gráfico acompanhado da mesma informação em tabela acessível.

**P5 — Ícones.** A navegação e a variação exigem ícones (`DESIGN.md`, 6.1 e 6.4). (a) SVGs próprios no repositório; (b) biblioteca de ícones (dependência nova). Recomendação: (a), por serem poucos.

### Números exibidos

**P6 — Patrimônio do Início com mês aberto.** Cenário fictício: setembro fechado com patrimônio de R$ 10.000,00; em 14 de outubro, há um aporte de R$ 500,00 lançado em outubro e nenhum fechamento.

- (a) O valor principal é o do último mês fechado: **R$ 10.000,00 em 30/09**, e os lançamentos de outubro aparecem à parte, como "movimentado no mês: +R$ 500,00".
- (b) O valor principal é o saldo calculado atual: **R$ 10.500,00**, rotulado "estimado, sem rendimentos de outubro".

O `DESIGN.md` (1, "Confiança") proíbe números provisórios exibidos como reais. Recomendação: (a).

**P7 — Períodos oferecidos.** Para rentabilidade, comparação, base 100 e drawdown: mês, ano até a data, 12 meses, desde o início e intervalo escolhido? Exemplo de K1: com fevereiro `N/D` (mês migrado ou reaberto), o acumulado de janeiro a abril é `N/D`, e o de março a abril é calculável (**1,49%** no exemplo do CR-33). A tela pode sugerir "desde março" quando o período escolhido tiver `N/D`. Recomendação: os cinco períodos, com a sugestão do período calculável mais longo, sempre rotulada.

**P8 — Distribuição da carteira.** O schema não tem classe de ativo nem instituição. (a) Distribuição só por ativo, com até seis séries e "outros" (`DESIGN.md`, 2.3); (b) acrescentar classe de ativo ao schema neste ciclo (G4, mudança de significado do schema). Recomendação: (a); a classe fica para um ciclo próprio, se fizer falta.

### Lançamentos e fechamento

**P9 — Sinal na digitação.** Rendimento, marcação e câmbio aceitam qualquer sinal. Exemplo: uma perda de R$ 35,00 num câmbio.

- (a) O usuário digita `-35,00` no campo, que o parser da KB-004 aceita.
- (b) O campo aceita só valor positivo, e um seletor "Ganho / Perda" define o sinal. Aporte e resgate são sempre digitados como positivos, e o resgate é gravado negativo.

Recomendação: (b), porque o sinal vira escolha explícita e visível, não um caractere fácil de esquecer.

Também a decidir: a lista de lançamentos mostra os ajustes do fechamento (que não são eventos, KB-004, seção 5) junto dos eventos, marcados como "ajuste do fechamento"? Recomendação: sim, só na visão do mês fechado, para a identidade contábil ficar visível.

**P10 — Administração de acessos: alcance.**

- (a) **Mínimo:** listar, autorizar e remover e-mails da lista (`authorized_emails`), o que o admin já pode pela Data API, sem migração. Mudar papel e revogar conta continuam pelos procedimentos P3 e P4 da KB-002. A tela lembra o cadastro de usuário de teste no Google (GC4).
- (b) **Intermediário:** (a) mais ver quais e-mails já têm conta e mudar o papel, por funções novas `security definer` restritas ao admin, que leem e alteram só `profiles` (G2, migração).
- (c) **Completo:** (b) mais revogar a conta, excluindo o usuário e, em cascata, toda a carteira dele. Exige chave secreta no servidor ou função com acesso a `auth.users`.

Recomendação: (a). Revogação e troca de papel são raras, e (c) põe uma operação irreversível sobre dados financeiros ao alcance de um clique.

**P11 — Sincronização com o SGS.** A rota `POST` e o botão ficam restritos ao admin (D10). A decidir:

- o período padrão: (a) do fim da cobertura atual até hoje, com o período inteiro desde uma data escolhida na primeira carga; (b) sempre um período escolhido pelo admin;
- automatizar com um cron da Vercel, ou manter "sob demanda" como diz a ADR-002.

Recomendação: (a), sob demanda, sem cron. O usuário comum vê a data da cobertura ("CDI disponível até dd/mm/aaaa") e o mês parcial marcado como tal.

**P12 — Benchmarks novos.** Cadastrar outro benchmark pela tela (D9, alternativa b) ou só por migração? Recomendação: só por migração neste ciclo; o catálogo segue com CDI e IPCA.

### Processo

**P13 — Testes e evidências.** Proposta:

- Vitest para o parser e para os componentes de número (monetário, percentual, variação, `N/D`), contra os casos CR-38 e CR-50;
- Playwright com o Supabase local e a carteira fictícia do seed, conferindo os números exibidos nos fluxos principais;
- verificação automática de acessibilidade (`@axe-core/playwright`, já instalado) em todas as telas;
- capturas de tela de revisão só com o seed fictício.

Recomendação: adotar.

**P14 — Verificação em produção.** Proposta: um gate "Verificar produção" no fim do ciclo, em que o responsável confere as telas com a própria conta e registra só "conferido" ou o defeito encontrado, sem valores, prints ou nomes de ativos (G3). Recomendação: adotar.

**P15 — Revisão por outra ferramenta.** Como no ciclo `003`, a revisão do plano é feita por ferramenta diferente da autora? Recomendação: sim.

**P16 — Ocultar valores.** A origem tem "Ocultar dados", que troca os valores por `***` e vem ligado por padrão. É útil para abrir o app em público, mas, como na origem, uma ocultação parcial expõe o que esqueceu de cobrir. (a) Incluir um botão "Ocultar valores" em toda tela com dinheiro, lembrado por aparelho, desligado por padrão; (b) não incluir neste ciclo. Recomendação: (a), aplicado por um único componente de valor, para que nenhuma quantia escape.

## Fora do escopo

- Migração dos dados do `Meus-Investimentos` e qualquer importação de planilha ou CSV (ciclo `005`).
- Regras de cálculo novas: rentabilidade por ativo, tracking error, information ratio, beta e benchmark de valor absoluto (D14). Se algum for desejado, entra por um ciclo próprio com G1.
- Classe de ativo, instituição ou qualquer mudança no schema da carteira (P8).
- Tela de ajuda ou glossário.
- Modo offline, service worker e notificações (ADR-002).
- Publicação da tela de consentimento do Google e página de privacidade (KB-002, armadilha 7).
- Qualquer alteração nas regras de governança ou nas barreiras G1 a G4.

## Critérios para iniciar o planejamento

- Decisões P1 a P16 respondidas pelo responsável, ou marcadas explicitamente para o rascunho do plano propor.
- Autorização explícita: "autorizo o rascunho do plano do ciclo 004".
- Ciclo `004` reservado em `_project/cycles.md` como `Ideação`, sem divergência com este arquivo.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Ideação registrada — ciclo 004 (completo)
Quem: Responsável
Conferir: Perguntas P1 a P16 desta ideação (fatiamento, arquitetura, navegação, gráficos, patrimônio com mês aberto, períodos, sinal na digitação, alcance da administração de acessos e sincronização com o SGS) e defeitos U1 a U8 da origem
Diga: "autorizo o rascunho do plano do ciclo 004"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 004 + idear + telas_produto + 89d3cd3`
- `effect_class`: `local_mutation`
- `state_before` / `state_after`:
  - antes: `cycles.md` com próximo ciclo `004`, sem reserva e sem ideação do `004`;
  - depois: ciclo `004` em `Ideação`, com este arquivo, e próximo ciclo `005`.
- `result`: `executed`
- `evidence`:
  - este arquivo e `_project/cycles.md`;
  - autoridades lidas: `.agent/ai_behavior.md`, `_project/README.md`, `.agent/workflows/idear.md`, `.agent/templates/ideacao.md`, KB-001 a KB-004, `design-system/DESIGN.md`, `003_plan.md` ("Fora do escopo") e lições aprendidas;
  - leitura somente leitura do `Meus-Investimentos` @ `1b13b033ce4335c09df80237c8c31b96b37e3797`;
  - validador de governança executado depois da gravação.
- `blockers`: as decisões P1 a P16 e a autorização do rascunho do plano. Nenhum bloqueio de execução.
