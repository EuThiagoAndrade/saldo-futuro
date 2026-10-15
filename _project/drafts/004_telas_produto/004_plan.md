# Plano de Implementação — Telas do produto

> **Ciclo:** `004`
> **Status:** `Em Execução`
> **Versão:** `v4`
> **Data de criação:** 2026-10-14
> **Última atualização:** 2026-10-14
> **Autor:** Thiago Andrade e Claude (Claude Code, Opus 5.5)
> **Tipo:** `feature`
> **Prioridade:** `P1`
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 004" em 2026-10-14
> **Autorização do rascunho:** "autorizo o rascunho do plano do ciclo 004" em 2026-10-14
> **Modo contínuo:** `—`
> **Revisão formal:** `Concluída`
> **Veredito da revisão:** `APTO PARA APROVAÇÃO`
> **Aprovação humana pós-revisão:** `Aprovada em 2026-10-14`
> **handoff_schema_version:** `2`

## Problema e contexto

Ideação: `_project/ideations/004_telas_produto.md`

> Este rascunho adota as recomendações da ideação para as perguntas P1 a P16, por decisão do responsável registrada em "Decisões do responsável". Ele também resolve as evidências que a ideação deixou pendentes (tempo de função na Vercel, tempo de resposta do SGS e dependências de gráficos e ícones) e propõe as decisões D1 a D12, que a ideação deixou para o plano.
>
> A `v2` responde aos achados R1-1 a R1-8 da rodada 1, feita pelo Codex. Ela acrescenta a leitura completa para cálculo (D13), refaz a proteção por ponto de entrada (D2), a ocultação por cookie lida no servidor (D8), o preparo dos dados de teste por usuário e por caso (D9), os limites dos períodos e os aportes líquidos do mês aberto, decididos pelo responsável (P17 a P20) e registrados na KB-004, o tempo limite da sincronização (D10), a ADR-005 dos gráficos (D14) e o destino do drawdown. A resposta a cada achado está em "Revisão crítica", na subseção "Resposta do autor à rodada 1".
>
> A `v3` responde aos achados R2-1 a R2-3 da rodada 2: fixa a ordem total de cada tabela pelas chaves reais (D13), acrescenta a conferência de coerência da leitura por marcas de versão já existentes no schema, com repetição limitada (D13), e separa a prova literal do CR-18, feita no Vitest com a data injetada, dos cenários integrados com o relógio real (D9). A resposta está em "Resposta do autor à rodada 2".
>
> A `v4` responde ao achado R3-1 da rodada 3: a unidade de coerência de D13 passa a ser a composição inteira de uma tela (todos os insumos que D4 combina, carteira e benchmarks), e não cada coleta de tabela. A resposta está em "Resposta do autor à rodada 3".

## Objetivo

Entregar as telas que tornam o Saldo Futuro utilizável em produção, só compondo regras já especificadas na KB-004:

- **base da interface:** área autenticada com a navegação do `DESIGN.md`, componentes de valor, `N/D`, estados e confirmação destrutiva, ícones próprios, "Ocultar valores" e o parser de quantias (KB-004, seção 10);
- **ativos, lançamentos e transferências:** criar e desativar ativos; lançar, listar, filtrar e estornar eventos; transferir e corrigir transferências;
- **fechamento mensal:** pendências, saldo real de cada ativo, ajustes, identidade contábil, fechar e reabrir;
- **Início:** patrimônio do último mês fechado, variação, rentabilidade por período, distribuição por ativo e gráficos;
- **benchmarks e comparação:** catálogo, cobertura, comparação com a carteira e a sincronização com o SGS, restrita ao admin;
- **administração de acessos:** a lista de e-mails autorizados, no alcance mínimo (P10);
- **defeitos U1 a U8 da origem** evitados por construção e por teste.

> **Escopo negativo:** este ciclo não cria migração, tabela, função de banco nem dependência de pacote, e nenhuma regra de cálculo além da apresentação do Início decidida em P17 a P20, que entra na KB-004 com casos de referência (item D); não migra dados do `Meus-Investimentos`; não altera as regras de governança nem as barreiras G1 a G4.

## Contexto e baseline

### Estado do repositório

Fatos verificados em `main` @ `89d3cd3`, em 2026-10-14:

- Ciclos `000` a `003` em `Concluído`; versão `0.2.0` em produção. A ideação do `004` e sua reserva em `_project/cycles.md` são alterações locais, ainda não versionadas.
- Interface: uma página autenticada, "Em construção" (`src/app/page.tsx`), o login (`src/app/entrar/`), o retorno do OAuth, `/sair` e o aviso de preview sem backend (`src/components/preview-notice.tsx`). Tokens e fonte em `src/app/globals.css`, com o teste `src/app/theme-contract.test.ts`.
- Regras: `src/lib/financeiro/` (`centavos`, `datas`, `eventos`, `fechamento`, `rentabilidade`, `acumulado`, `benchmarks`, `apresentacao`) e `src/lib/benchmarks/sgs.ts`, testados contra `tests/fixtures/financeiro/casos_referencia.json`. O parser de quantias (KB-004, seção 10, CR-50) não existe no código.
- Banco: escrita da carteira só pelas oito funções `security definer` do ciclo `003`; benchmarks gravados só por `carregar_benchmark`, que exige o admin. `public.authorized_emails` já aceita `select`, `insert` e `delete` do admin pela Data API, com políticas próprias (`supabase/migrations/20261013005133_acesso_autorizacao_perfis.sql:35-70`). Seis arquivos pgTAP em `supabase/tests/database/`.
- Seed (`supabase/seed.sql`): só a lista de e-mails fictícios (um admin e dois usuários), sem carteira nem benchmark.
- Ponta a ponta: `tests/e2e/auth.spec.ts`, `preview.spec.ts` e `public-assets.spec.ts`; `@axe-core/playwright` já instalado.
- Dependências fixadas em `package.json`: nenhuma biblioteca de gráficos, ícones ou componentes.
- `vercel.json` só tem o cron do keepalive; nenhuma configuração de duração de função.

### Verificações das evidências pendentes da ideação

Feitas em 2026-10-14, sem dado do usuário.

| # | Verificação | Resultado | Efeito no plano |
| :-- | :-- | :-- | :-- |
| V1 | Duração máxima de função na Vercel Hobby | Com fluid compute (padrão), o padrão e o máximo são 300 s; em App Router, `export const maxDuration` na rota (<https://vercel.com/docs/functions/configuring-functions/duration>, atualizada em 2026-08-24) | A rota de sincronização declara `maxDuration = 60`, com folga |
| V2 | Tempo e tamanho de uma janela de 10 anos do CDI | Uma única chamada pública somente leitura à série 12, de 01/01/2016 a 31/12/2025, feita de uma máquina local: HTTP 200 em 0,58 s, 2.510 valores, cerca de 100 kB. É uma observação, não uma garantia: não mede a região da Vercel nem a disponibilidade futura | Hipótese de que uma carga desde 2000 (três janelas) cabe em 60 s; a rota impõe tempo limite próprio (D10) e o acesso real à fonte é confirmado na ação externa |
| V3 | Dependências de gráficos e ícones | P4 e P5 escolheram SVG próprio | Nenhuma dependência nova; nada a conferir de versão ou licença |
| V4 | Desempenho de calcular na leitura | Não medido: depende do código das telas | Medido na issue D com volume fictício (D9), depois de provada a leitura completa (D13); acima do limite, "Parado" |
| V5 | Limite de linhas da Data API | `supabase/config.toml:18` fixa `max_rows = 1000`; uma consulta acima disso devolve só parte das linhas, sem erro. A documentação de `range` pede ordenação para paginar de forma previsível (<https://supabase.com/docs/reference/javascript/range>) | Toda leitura usada em cálculo é completa e paginada em ordem estável (D13) |

### Origem

O inventário das telas do `Meus-Investimentos` e os defeitos U1 a U8 estão na ideação ("Na origem"). Código, layout e bibliotecas da origem não são reaproveitados (KB-001).

## Escopo

### Dentro do escopo

- Área autenticada, navegação, componentes compartilhados, ícones, "Ocultar valores", parser de quantias, proteção por ponto de entrada, leitura completa e apoio dos testes com cenários fictícios (issue A).
- Telas de ativos, lançamentos e transferências (issue B).
- Tela de fechamento mensal (issue C).
- Início, com períodos e gráficos (issue D).
- Benchmarks, comparação, rota e tela de sincronização com o SGS (issue E).
- Administração da lista de acessos (issue F).
- Testes Vitest e ponta a ponta com o Supabase local e dados fictícios, com verificação automática de acessibilidade.
- Primeira sincronização dos benchmarks em produção, feita pelo responsável (ação externa), verificação em produção, release `0.3.0` e encerramento, com a KB-003 atualizada.

### Fora do escopo

- Migração de dados e qualquer importação de planilha, CSV ou JSON (ciclo `005`).
- Regras de cálculo novas: rentabilidade por ativo, tracking error, information ratio, beta e benchmark de valor absoluto (D14 do ciclo `003`).
- Classe de ativo, instituição ou qualquer mudança no schema (P8).
- Trocar o papel de uma conta e revogar uma conta pela tela; continuam pelos procedimentos P3 e P4 da KB-002 (P10).
- Cadastrar benchmark pela tela (P12) e sincronização automática por cron (P11).
- Tela de ajuda, modo offline, service worker e notificações.
- Publicação da tela de consentimento do Google e página de privacidade.
- Qualquer mudança nas regras de governança.

## Decisões e autoridades

### Decisões do responsável

> **Decisão do responsável (2026-10-14):** ao autorizar o rascunho, perguntado sobre como tratar P1 a P16, o responsável escolheu "Adotar recomendações". As recomendações da ideação passam a ser decisões, registradas abaixo. A aprovação do plano confirma este registro, mas não reabre as escolhas, salvo pedido do responsável.

| # | Decisão adotada | Efeito no plano |
| :-- | :-- | :-- |
| P1 | Um ciclo com seis entregas, a administração de acessos por último | Issues A a F, na ordem |
| P2 | Server Components para leitura e cálculo; Server Actions para escrita | D2 e D3 |
| P3 | Fechamento dentro de Lançamentos, com aviso no Início; Comparação dentro de Benchmarks; "Mais" com Transferências, Conta e, só para o admin, Administração | D1 |
| P4 | Gráficos em SVG próprio, cada um com a mesma informação em tabela acessível | D6 |
| P5 | Ícones em SVG próprio | D7 |
| P6 | (a) O patrimônio principal do Início é o do último mês fechado, com a data; o mês aberto mostra só o movimentado | Item D |
| P7 | Períodos mês, ano até a data, 12 meses, desde o início e intervalo escolhido, com a sugestão rotulada do período calculável mais longo quando houver `N/D` | Item D e D4 |
| P8 | (a) Distribuição só por ativo, até seis séries e "outros" | Item D; nenhum schema novo |
| P9 | (b) Valor sempre positivo; "Ganho / Perda" define o sinal de rendimento, marcação e câmbio; resgate digitado positivo e gravado negativo. Os ajustes do fechamento aparecem, marcados, na visão do mês fechado | Item B e D3 |
| P10 | (a) Alcance mínimo: listar, autorizar e remover e-mails; lembrete do cadastro de usuário de teste no Google | Item F, sem migração |
| P11 | (a) Período padrão do fim da cobertura até hoje; na primeira carga, desde uma data escolhida; sob demanda, sem cron | Item E e D10 |
| P12 | Benchmark novo só por migração | Fora do escopo |
| P13 | Vitest para parser e componentes de número; Playwright com Supabase local e seed fictício conferindo os números; axe em todas as telas; capturas só com o seed | "Estratégia de testes" |
| P14 | Verificação em produção pelo responsável, registrada sem valores, prints ou nomes de ativos | Ponto "Verificar produção" |
| P15 | Revisão do plano por ferramenta diferente da autora | "Sequência recomendada" |
| P16 | (a) "Ocultar valores" em toda tela com dinheiro, lembrado por aparelho, desligado por padrão, aplicado por um único componente | D8 |

> **Decisão do responsável (2026-10-14, correção da rodada 1):** perguntado sobre os pontos que o achado R1-4 mostrou ambíguos e sobre os campos em edição de R1-2, o responsável escolheu a recomendação em todos. Os exemplos são fictícios.

| # | Decisão | Exemplo | Efeito no plano |
| :-- | :-- | :-- | :-- |
| P17 | Todos os períodos do Início terminam no **último mês fechado** (M), rotulado com ele | Setembro fechado e outubro aberto, em 14/10: os períodos vão até set/2026 | Limites dos períodos (item D) |
| P18 | "Ano até a data" é o **ano do último mês fechado** | Em 10/01/2027, com dez/2026 fechado e jan/2027 aberto: mostra 2026 de janeiro a dezembro, rotulado "2026" | Limites dos períodos (item D) |
| P19 | O valor ao lado do patrimônio é **"aportes líquidos"**: aportes, resgates e seus estornos com data depois do fim de M | Aporte de R$ 500,00 e rendimento lançado de R$ 20,00 em outubro: +R$ 500,00, rotulado "aportes líquidos desde set/2026"; o rendimento só conta no fechamento | Item D; KB-004 |
| P20 | Com "Ocultar valores" ligado, o que a pessoa **digita** continua visível; valores trazidos pela tela (saldos, ajustes da prévia) ficam ocultos | Na tela de fechamento, o saldo calculado aparece como "••••", e o saldo real digitado aparece como digitado | D8 |

### Decisões propostas (a confirmar na aprovação do plano)

> **Decisão do responsável (2026-10-14):** com "aprovo o plano do ciclo 004", posterior ao veredito `APTO PARA APROVAÇÃO` da rodada 4, o responsável aprovou o plano `v4` sem alterar nenhuma proposta. D1 a D14 passam a valer como estão abaixo.

| # | Decisão | Alternativas | Proposta |
| :-- | :-- | :-- | :-- |
| D1 | Rotas | Grupo de rotas `src/app/(app)/` com um layout que exige sessão e desenha a navegação: `/` (Início), `/lancamentos`, `/lancamentos/novo`, `/lancamentos/[id]`, `/lancamentos/fechamento/[mes]`, `/ativos`, `/transferencias`, `/benchmarks`, `/benchmarks/comparacao`, `/conta`, `/admin/benchmarks` e `/admin/acessos` | Adotar. "Em construção" sai; o que ela mostrava (e-mail, perfil e Sair) vai para `/conta` |
| D2 | Proteção por ponto de entrada (revista na `v2`, R1-5) | (a) funções comuns em `src/lib/sessao.ts`, `exigirSessao()` e `exigirAdmin()`, chamadas junto de cada leitura protegida (no carregamento de dados de cada página, não só no layout), no início de toda Server Action e de toda rota de escrita. Sem sessão, a página redireciona para `/entrar` e a ação ou rota recusa sem executar; sem papel `admin`, as páginas de `/admin` respondem 404 e as ações e a rota recusam. Uma falha ao ler a sessão ou o perfil é tratada como recusa, nunca como sucesso nem como página com dados parciais. O layout só desenha a navegação. A RLS e as funções do banco continuam sendo a barreira final; (b) proteção só no layout ou no `src/proxy.ts` | (a), como recomenda o guia de autenticação do Next.js (<https://nextjs.org/docs/app/guides/authentication>): layouts não reconferem a sessão a cada navegação, e ações e rotas são pontos de entrada independentes |
| D3 | Escrita | Server Actions que validam a entrada com Zod e o parser, chamam só as funções do banco com a sessão do usuário e traduzem os motivos de recusa da KB-004 (`faixa`, `sequencia`, `identidade`, `reabertura`, pendências, datas) em mensagens em português. Nenhum erro técnico é exibido (`DESIGN.md`, 6.11) e nenhuma chave secreta é usada | Adotar |
| D4 | Composição dos números | Um módulo de funções puras, `src/lib/telas/`, monta a partir das linhas lidas (completas, D13) os insumos das regras de `src/lib/financeiro/` (meses, períodos efetivos, séries) e devolve o que cada tela mostra. Componentes não fazem conta. O módulo é testado contra os casos de referência. Os limites dos períodos e os aportes líquidos (P17 a P19) entram na KB-004 com casos próprios (item D) | Adotar. Qualquer outra conta que não exista na KB-004 leva a "Parado" (G1) |
| D5 | Apresentação | Componentes únicos `Dinheiro`, `Percentual`, `PontosPercentuais`, `Variacao` e `NaoDisponivel`, que usam `src/lib/financeiro/apresentacao.ts` e o contrato do `DESIGN.md` (6.2 a 6.5): sinal U+2212, `N/D` com rótulo acessível, nenhum zero para ausência (U1) | Adotar |
| D6 | Gráficos | Componentes SVG renderizados no servidor, sem JavaScript no cliente: linha (patrimônio; base 100 com benchmarks tracejados e rótulo direto), barras de ganho e perda (rentabilidade mensal) e barras horizontais (distribuição). Cada gráfico tem título, descrição e uma tabela com os mesmos números; um mês `N/D` é lacuna, nunca zero. Rótulos monetários de eixo, título, descrição e tabela obedecem à ocultação de D8 já na renderização do servidor | Adotar; registrada na ADR-005 (D14) |
| D7 | Ícones | SVGs próprios em `src/components/icones/`, com `aria-hidden` quando decorativos | Adotar |
| D8 | "Ocultar valores" (revista na `v2`, R1-2) | A preferência fica num cookie do navegador (`sf_ocultar_valores`, sem dado do usuário, longa duração), que o servidor lê em toda renderização. Assim, a página já sai do servidor com as quantias trocadas por "••••" e nome acessível "Valor oculto", sem exibir o valor antes da hidratação, e os gráficos continuam sem JavaScript. O botão é um formulário com Server Action que grava o cookie e revalida a página (funciona sem JavaScript). Ocultam-se: `Dinheiro`, os rótulos monetários dos gráficos, seus títulos, descrições e tabelas equivalentes, e todo valor monetário trazido pela tela, inclusive em formulários (saldo calculado, ajustes da prévia, saldo do ativo). O que a pessoa digita continua visível (P20). Percentuais continuam visíveis, porque não revelam o patrimônio. Sem o cookie, os valores aparecem. O requisito é a apresentação: os dados podem continuar no transporte | Adotar |
| D9 | Dados de teste e desempenho (revista na `v2`, R1-3, e na `v3`, R2-3) | O `supabase/seed.sql` continua só com a lista de e-mails, e `tests/e2e/auth.spec.ts` não muda. Um módulo de apoio dos testes (`tests/e2e/apoio/`) prepara, só no Supabase local e com a chave secreta local, como `auth.spec.ts` já faz: (1) cria, para cada arquivo de teste, usuários fictícios exclusivos (`<arquivo>.<papel>@example.com`), autorizados na lista e removidos com a lista no fim; (2) monta cada cenário entrando como o próprio usuário e chamando as funções do banco pela Data API, o mesmo caminho da aplicação; (3) cada cenário reproduz **um único** caso de referência, num usuário próprio, e os números conferidos são os esperados desse caso (tabela "Cenários" em "Estratégia de testes"). **Datas e relógio:** o banco usa o relógio real (`private.hoje()`), que o teste não controla. Um cenário reproduz um caso literalmente só se todas as datas do caso forem anteriores ou iguais ao hoje real em Cuiabá e todo mês a fechar já tiver terminado; o apoio confere isso antes de preparar e falha (não pula) se não valer. Os casos escolhidos para cenários literais e os novos CR-51 e CR-52 usam só datas fixas no passado. Casos que dependem do "hoje" (CR-18) não são reproduzidos literalmente na integração: a prova literal é feita no Vitest com a data injetada, e a integração usa datas relativas ao hoje em Cuiabá, como o pgTAP já faz (`04_carteira.test.sql`). Fluxos que escrevem usam usuários próprios e nunca os dos cenários de leitura. As séries de benchmark são globais: os testes que dependem delas ficam num único arquivo serial, que carrega a série fictícia de cada caso, pelo admin fictício, antes do teste. Desempenho: um teste cria pelo mesmo caminho 30 ativos com 5 anos de eventos fictícios e mede o Início no servidor local; acima de 1 s, "Parado" para decidir cache | Adotar |
| D10 | Sincronização (revista na `v2`, R1-6) | Rota `POST /api/benchmarks/sincronizar` (`maxDuration = 60`), que exige o admin (D2) e chama `sincronizarBenchmark` com o cliente da sessão e um `buscar` com tempo limite total de 45 s (`AbortSignal`), abaixo do limite da rota. Como a sincronização só grava depois de buscar e validar todas as janelas (D10 do ciclo `003`), estouro de tempo ou falha da fonte antes da gravação não grava nada, e a tela explica o motivo (`buraco`, `sem_valores`, fonte indisponível, tempo esgotado) com a ação "Tentar novamente", sem número parcial. Se a resposta ao navegador se perder depois da gravação, a tela relê a cobertura e mostra o estado real; repetir é seguro, porque repetir uma carga bem-sucedida não muda nada (KB-004, 9.2). A tela pede confirmação antes de sincronizar, ao contrário da origem (`frontend/assets/js/benchmark.js:433-448`) | Adotar |
| D11 | Acessos | A tela lê, insere e exclui em `authorized_emails` com a sessão do admin, normaliza o e-mail (minúsculo, sem espaços) antes de enviar, pede confirmação para remover e explica, junto da ação, que remover não revoga uma conta existente e que a pessoa também precisa ser usuário de teste no Google enquanto a tela de consentimento estiver em "Testando" | Adotar |
| D13 | Leitura completa e coerente para cálculo (nova na `v2`, R1-1; revista na `v3`, R2-1 e R2-2) | **Completa.** Toda leitura que alimenta um cálculo usa uma função comum (`lerTudo`) que pagina com `range`, em páginas de 1.000 linhas (tamanho parametrizável nos testes), até uma página incompleta, e confere o total contra a contagem exata (`count: 'exact'`). A ordem total de cada tabela usa as chaves reais do schema, com a RLS ou o filtro restringindo ao usuário ou ao benchmark: `eventos` por `data`, `id`; `ativos` e `transferencias` por `id`; `consolidados_mensais` por `mes`; `posicoes_mensais` por `mes`, `ativo_id`; `valores_benchmark` filtrada por um benchmark, por `data` (por `benchmark_id`, `data` quando houver vários); `coberturas_benchmark` e `benchmarks` por `benchmark_id` e `id`. Para resolver estornos de meses anteriores (K2, CR-24), a rentabilidade lê todos os eventos do usuário. A paginação visual das listas é separada dessa coleta. **Coerente (revista na `v4`, R3-1).** A unidade de coerência é a **composição**: o conjunto de todos os insumos que D4 combina para uma tela, carteira e benchmarks juntos, inclusive tabelas que cabem numa só página. Antes de qualquer leitura da composição, inclusive antes de determinar M, a função lê as marcas de versão; depois de terminar **todas** as leituras de insumos, lê as marcas de novo; só aceita a composição se todas forem iguais. As marcas usam só colunas existentes, sem migração nem função nova: (1) carteira: a lista de (`mes`, `fechado_em`) de `consolidados_mensais`, que muda a cada fechamento, reabertura ou novo fechamento, e com ela as posições, gravadas e removidas na mesma transação (`20261014185205_carteira.sql:571-604`); a contagem exata de `eventos` e de `transferencias`, que só recebem inserções (H4; a exclusão só ocorre na remoção do usuário); e a contagem de `ativos` com o maior `desativado_em`; (2) cada benchmark usado: `inicio`, `fim` e `atualizado_em` de `coberturas_benchmark`, que `carregar_benchmark`, único caminho de escrita, altera na mesma transação em que substitui os valores (`20261014193630_benchmarks.sql:130-141`). A cobertura usada no cálculo é a da marca conferida: a lida antes, que só é aceita se for igual à lida depois de todos os valores. Marca diferente descarta **todos** os insumos da composição e repete o conjunto inteiro, até 3 tentativas; depois, a tela mostra o erro recuperável "Os dados mudaram durante a leitura. Tente novamente", nunca um resultado misturado. A conferência por coleta de tabela (contagem exata e marcas na mesma coleta) continua como defesa adicional, sem substituir a da composição | Adotar |
| D14 | Registro da escolha de gráficos (nova na `v2`, R1-7) | A ADR-002 manda registrar em ADR a escolha de gráficos do ciclo `004`. A ADR-005, "Gráficos em SVG próprio", criada por `.agent/templates/adr.md` depois da aprovação do plano, entra na PR documental do plano | Adotar |
| D12 | Parser de quantias | `src/lib/financeiro/quantias.ts`, implementando a seção 10 da KB-004 e testado pelo CR-50; usado no cliente para mensagem imediata e de novo no servidor, que é a autoridade | Adotar |

### Destino dos defeitos de interface da origem

| # | Defeito | Destino |
| :-- | :-- | :-- |
| U1 | Ausência vira zero | D5: `N/D` por componente único; teste com mês `N/D` |
| U2 | Primeira variação com o patrimônio inteiro | Variação só pela regra da KB-004 (seção 7); primeiro mês sem variação anterior é `N/D` |
| U3 | Mês aberto exibido como fechado | P6: o Início sempre data o patrimônio pelo último mês fechado |
| U4 | Estorno por identificador | Estorno a partir do detalhe do lançamento (item B) |
| U5 | Entrada monetária sem formato brasileiro | D12 e `DESIGN.md` 6.8 |
| U6 | Falha silenciosa e `alert()` | Estado de erro do `DESIGN.md` 6.11; nenhum `alert` |
| U7 | Interpolação sem escape | React escapa por padrão; `dangerouslySetInnerHTML` proibido nas telas, conferido por lint |
| U8 | "N/A" e "N/D" misturados | D5: só `N/D` |

### Pontos de aprovação

| Ponto | Precondição | Cobre | Não cobre | Conferir |
| :-- | :-- | :-- | :-- | :-- |
| Autorizar rascunho do plano | Ideação registrada | Este rascunho, a reserva em `cycles.md` como `Planejamento` e o registro das decisões P1 a P16 | Revisão, aprovação, issues, implementação | Concedido em 2026-10-14 |
| Aprovar plano ("aprovo o plano do ciclo 004") | Veredito `APTO PARA APROVAÇÃO` ou `APTO COM RESSALVAS` posterior à última correção, de preferência de outra ferramenta (P15) | Decisões D1 a D14 confirmadas ou escolhidas; PR documental `chore/cycle-004-plan` com a ideação, o plano, a ADR-005 e `cycles.md`; seu merge com checks verdes; criação das issues A a F depois de apresentar o payload; o encerramento do ciclo | Implementação; merges das PRs de issue, de release e de encerramento; ação externa; verificação em produção | Veredito, ressalvas, D1 a D14 |
| Autorizar implementação ("autorizo a implementação da issue #N"), uma por issue | Plano `Aprovado` e integrado; issue anterior integrada (A → B → C → D → E → F) | Branch, task, código, testes e abertura da PR daquela issue | Merge; outra issue | Issue e escopo |
| Aprovar merge da PR D | As mesmas da linha seguinte, mais: os casos novos da KB-004 (P17 a P19) recalculados por outra ferramenta sem ver os esperados e conferidos pelo responsável, registrados em `004_validation_casos_inicio.md`, sem divergência aberta | Merge por squash e o deploy automático da Vercel | Escrita em produção | KB-004, casos novos, registro de validação, diff |
| Aprovar merge das PRs A, B, C, E e F | Checks verdes, inclusive `supabase test db` e ponta a ponta com backend; números das telas conferidos contra os casos de referência; axe sem violação | Merge por squash e o deploy automático da Vercel | Escrita em produção | Checks, diff, capturas com os cenários fictícios e barreiras na PR |
| Ação humana externa ("concluí a ação externa da issue #N", na issue E) | PR E integrada e publicada | O responsável, como admin em produção, faz a primeira sincronização de CDI e IPCA pela tela, desde a data que escolher | Qualquer mudança no painel do Supabase, da Vercel ou do Google | Roteiro na task da issue E |
| Verificar produção ("autorizo a verificação em produção do ciclo 004") | PR F integrada e ação externa concluída | Pelo agente, só leituras sem sessão: páginas protegidas redirecionam para `/entrar`, `/api/benchmarks/sincronizar` recusa quem não está autenticado, ativos públicos respondem. Pelo responsável, com a própria conta, o roteiro de verificação da task da issue F, registrado só como "conferido" ou com a descrição do defeito, sem valores, nomes ou prints (P14, G3) | Qualquer escrita em produção pelo agente; qualquer leitura de dado de carteira pelo agente | Itens de verificação |
| Aprovar merge da PR de release | Verificação em produção concluída; PR aberta pelo release-please | Release `0.3.0` | — | Versão e notas |
| Aprovar merge da PR de encerramento | Release integrada | Encerramento prospectivo (`chore/cycle-004-closure`) | — | Diff documental |

Toda cadeia autorizada para (situação "Parado", com a pergunta registrada) quando:

- uma tela precisar de um número que a KB-004 não especifica, ou uma composição divergir de um caso de referência;
- a implementação exigir migração, dependência nova ou mudança das decisões acima;
- um teste mostrar um usuário vendo ou alterando dados de outro, ou uma página de admin acessível a um usuário comum;
- algum dado que possa ser do usuário for necessário para testar ou ilustrar;
- o desempenho medido em D9 passar do limite;
- uma precondição não puder ser verificada pelo agente.

## Barreiras de domínio

| Barreira | Aplica-se? | Como o ciclo a atende ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim | Nenhuma regra nova além da apresentação do Início (P17 a P19), que entra na KB-004 com os casos CR-51 e CR-52, calculados à mão, recalculados por outra ferramenta sem ver os esperados e conferidos pelo responsável antes do merge da PR D; as telas usam só `src/lib/financeiro/` pela composição de D4, testada contra os casos de referência; toda leitura usada em cálculo é completa ou a tela mostra erro (D13); o parser implementa a KB-004, seção 10, e passa o CR-50; cada cenário de teste reproduz um caso de referência (D9) e os testes ponta a ponta conferem os números exibidos contra os valores esperados da KB-004; `N/D` nunca vira zero (D5); dinheiro nunca passa por ponto flutuante entre a entrada e o banco (parser para centavos inteiros) |
| G2 — isolamento por RLS | Sim | Nenhuma tabela, política ou função nova; toda leitura e escrita usa a sessão do usuário, sem chave secreta; a sessão e o papel são conferidos em cada leitura protegida, ação e rota (D2); testes ponta a ponta com dois usuários fictícios provam que um não vê a carteira do outro pela interface nem por chamada direta às ações; páginas de `/admin` e a rota de sincronização recusam o usuário comum (teste); a tela de acessos usa só as políticas existentes de `authorized_emails`, já cobertas por `01_isolamento.test.sql` |
| G3 — privacidade de dados | Sim | Dados de teste e capturas só fictícios (`example.com`, ativos de nome genérico), preparados só no Supabase local (D9); verificação em produção sem valores, nomes ou prints; o preview continua sem backend; "Ocultar valores" (D8) |
| G4 — migrações só acrescentam | Não | O ciclo não cria nem altera migração. Se uma for necessária, a situação passa a "Parado" (ver "Pontos de aprovação") |

## Estratégia de testes

- **Parser (G1):** Vitest com todas as entradas e recusas do CR-50, inclusive `1234.56` recusado (O13), negativo com U+2212, grupos de milhar e faixa.
- **Componentes de número:** Vitest para `Dinheiro`, `Percentual`, `PontosPercentuais`, `Variacao` e `NaoDisponivel`, contra o CR-38 e o `DESIGN.md` (sinal U+2212, zero sem sinal, `N/D` com rótulo acessível, valor oculto).
- **Composição (D4):** Vitest das funções de `src/lib/telas/` com os casos de referência: patrimônio do último mês fechado com trânsito (CR-17), rentabilidade e variação (CR-20), períodos com `N/D` e a sugestão do período calculável (CR-33, CR-34, CR-35), base 100 e drawdown (CR-36), comparação (CR-44, CR-45, CR-47) e mês parcial do benchmark.
- **Leitura completa (D13):** Vitest de `lerTudo` com um cliente falso que devolve várias páginas, que falha numa página intermediária e que muda a contagem entre páginas: os dois últimos casos dão erro, nunca resultado. No Supabase local, pelo caminho real da aplicação e com páginas pequenas forçadas, a coleta de cada tabela da lista de D13 (`eventos`, `ativos`, `transferencias`, `consolidados_mensais`, `posicoes_mensais`, `valores_benchmark`, `coberturas_benchmark`, `benchmarks`) devolve todas as linhas na ordem declarada; o cenário "volume" (mais de 1.000 eventos) e uma série fictícia de benchmark com mais de 1.000 valores conferem os totais exibidos.
- **Coerência (D13):** testes determinísticos no Supabase local, com páginas de 2 linhas e um gancho entre a primeira e a segunda página que: (1) chama `carregar_benchmark` substituindo os valores das mesmas datas (contagem e chaves inalteradas); (2) reabre e fecha de novo um mês com outro saldo real; (3) lança um evento com data anterior às já lidas. Em cada caso, o resultado é o de uma das versões inteiras ou o erro recuperável, nunca a mistura (o exemplo da rodada 2: 4,060401% ou 8,243216%, nunca 6,131204%). Também entre coletas, com uma página por tabela: (4) reabre e fecha de novo M com outro saldo real **entre o término da leitura de consolidados e o início da leitura de posições e eventos**: o Início mostra a versão anterior inteira, a nova inteira ou o erro recuperável, nunca o patrimônio de uma versão com a distribuição da outra (o exemplo da rodada 3: R$ 1.100,00 com distribuição somando R$ 1.200,00); (5) substitui a série de um benchmark **entre a leitura da cobertura e a dos valores**: a comparação usa cobertura e valores da mesma versão ou mostra o erro. Um caso confere que a repetição para depois de 3 tentativas.
- **Proteção (D2):** acesso direto a cada rota sem sessão e com a sessão encerrada; Server Action chamada sem sessão; usuário comum nas páginas, ações e rota de admin; identificadores de ativo ou evento de outro usuário passados às ações; falha simulada na leitura do perfil. Toda recusa deixa o banco intacto e nenhuma página mostra dados parciais.
- **Ocultação (D8):** com o cookie já ligado antes da primeira carga, depois de recarregar, depois de navegar, ao ligar e desligar o botão, e nos formulários de lançamento e de fechamento: nenhuma quantia no texto visível, nos nomes acessíveis, nos títulos e descrições dos gráficos nem nas tabelas equivalentes; o valor digitado continua visível (P20).
- **Ponta a ponta com backend (Playwright, Supabase local):**
  - por tela, o fluxo principal com os cenários de D9, conferindo os números exibidos contra os esperados do caso de cada cenário;
  - lançar com parser e seletor de sinal, estornar com confirmação, transferir pelo trânsito e corrigir;
  - fechar um mês com pendência recusada e depois aceita, e reabrir com confirmação;
  - isolamento entre dois usuários fictícios e recusa das páginas de admin e da rota de sincronização para o usuário comum;
  - sincronização com o SGS substituído por um servidor falso local, inclusive fonte lenta além do tempo limite e falha na segunda janela, sem nenhuma gravação; nenhum teste chama a rede;
  - autorizar e remover e-mail como admin.
- **Acessibilidade:** `@axe-core/playwright` em todas as telas, em 360 px e 1280 px, sem violação de nível A ou AA; navegação por teclado no diálogo de confirmação (foco inicial em "Cancelar", Esc cancela).
- **Sem backend:** os testes de preview existentes continuam verdes; toda página nova mostra o aviso de preview.
- **Desempenho:** a medição de D9 na issue D, depois de provada a leitura completa.

**Cenários (D9).** Cada cenário é um usuário fictício próprio que reproduz um único caso; o número conferido é o esperado do caso.

| Cenário | Caso | Tipo | Onde |
| :-- | :-- | :-- | :-- |
| Sinais por tipo | CR-01 | Escrita pela interface | Item B |
| Estorno e recusas | CR-03 | Escrita pela interface | Item B |
| Transferência e correção | CR-04, CR-05 (um usuário cada) | Escrita pela interface | Item B |
| Fechamento | CR-12, CR-13, CR-15, CR-16 (um usuário cada) | Escrita pela interface | Item C |
| Mês terminado | Datas relativas ao hoje em Cuiabá: mês corrente recusado, mês anterior terminado aceito. Não reproduz literalmente o CR-18, que é provado no Vitest com as três datas injetadas em `conferirFechamento` | Escrita pela interface | Item C |
| Trânsito no patrimônio | CR-17 | Leitura | Item D |
| Rentabilidade do mês | CR-20 | Leitura | Item D |
| Estorno de mês fechado | CR-24 | Leitura | Item D |
| Acumulado e ano | CR-32 | Leitura | Item D |
| Mês `N/D` no período e sugestão | CR-33, CR-35 | Leitura | Item D |
| Base 100 e drawdown | CR-36, CR-37 | Leitura | Item D |
| Limites dos períodos e aportes líquidos | CR-51, CR-52 (novos) | Leitura | Item D |
| Volume | Mais de 1.000 eventos fictícios de valor conhecido | Leitura | Item D (D13) |
| Comparação | CR-44, CR-45, CR-47 | Leitura, arquivo serial com séries carregadas por caso | Item E |
- **Gates mínimos:** os de `_project/README.md` para entregas que tocam a aplicação e o banco, em todas as issues.

## Itens de implementação

### Item A — Base da interface, parser e apoio dos testes

**Contexto:** todas as telas dependem da navegação, dos componentes de número e do parser; os testes dependem dos cenários fictícios (D9).

**Ação técnica:**

- grupo `src/app/(app)/` com layout autenticado (D1, D2), barra inferior e menu lateral (`DESIGN.md` 6.1, 4.3), folha "Mais" e página `/conta`;
- componentes de D5, estados vazio, carregando e erro, diálogo de confirmação destrutiva (6.10), ícones (D7) e "Ocultar valores" (D8);
- `src/lib/financeiro/quantias.ts` (D12) e o componente de campo monetário (6.8);
- `src/lib/sessao.ts` (D2) e `lerTudo` (D13);
- módulo de apoio dos testes de D9, com usuários exclusivos por arquivo e a montagem de cenários pelas funções do banco;
- regra de lint contra `dangerouslySetInnerHTML` (U7).

**Critérios de aceite:**

- [ ] Sem sessão ou com a sessão encerrada, toda rota do grupo redireciona para `/entrar`, e uma ação chamada sem sessão é recusada sem efeito; com sessão, a navegação mostra os cinco itens e "Mais" mostra Administração só ao admin.
- [ ] O parser passa todas as entradas do CR-50 e recusa `1234.56`.
- [ ] Os componentes de número passam o CR-38 e nunca mostram zero para `N/D`.
- [ ] Com "Ocultar valores" ligado antes da carga, nenhuma quantia aparece no HTML renderizado nem no nome acessível, inclusive depois de recarregar e navegar.
- [ ] `lerTudo` devolve erro, e não resultado, quando uma página falha ou a contagem muda, e lê cada tabela de D13 por inteiro na ordem declarada.
- [ ] Com alteração entre páginas (substituição de série, reabertura e novo fechamento, lançamento retroativo), a coleta devolve uma versão inteira ou o erro recuperável, nunca a mistura.
- [ ] Com alteração entre coletas de tabelas diferentes da mesma composição (entre consolidados e posições ou eventos; entre cobertura e valores de um benchmark), a composição devolve uma versão inteira ou o erro recuperável, nunca a mistura.
- [ ] O apoio recusa preparar um cenário literal cujas datas sejam posteriores ao hoje real em Cuiabá ou cujo mês a fechar não tenha terminado.
- [ ] O apoio cria e remove usuários exclusivos por arquivo, e a suíte completa, com `auth.spec.ts`, passa no CI sem interferência entre arquivos.
- [ ] axe sem violação nas páginas da entrega.

### Item B — Ativos, lançamentos e transferências

**Contexto:** escrita da carteira pela interface, com as funções do ciclo `003`.

**Ação técnica:** telas `/ativos`, `/lancamentos`, `/lancamentos/novo`, `/lancamentos/[id]` e `/transferencias`; Server Actions de D3 para `criar_ativo`, `desativar_ativo`, `lancar_evento`, `estornar_evento`, `transferir` e `corrigir_transferencia`; seletor "Ganho / Perda" (P9); lista de lançamentos filtrável por mês e ativo (tabela e lista de cartões, 6.6 e 6.7), com os ajustes do mês fechado marcados.

**Critérios de aceite:**

- [ ] Cada tipo de lançamento grava o sinal da KB-004 (CR-01), e o usuário nunca digita sinal.
- [ ] Estornar e corrigir transferência só pelo detalhe, com confirmação; as recusas da KB-004 (estorno de estorno, perna isolada, data) aparecem como mensagem em português.
- [ ] Desativar ativo com saldo diferente de zero é recusado com explicação.
- [ ] O trânsito aparece, não recebe lançamento comum e é destino e origem de transferência.
- [ ] Um usuário não vê nem altera ativos ou lançamentos de outro (ponta a ponta).

### Item C — Fechamento mensal

**Contexto:** o fechamento em três etapas da KB-004, seção 5, com a prévia em TypeScript e a gravação pela função do banco (D5 do ciclo `003`).

**Ação técnica:** `/lancamentos/fechamento/[mes]` com as pendências por ativo, o campo de saldo real de cada uma, os ajustes e a identidade calculados pela prévia, e o botão de fechar; reabrir o último mês fechado com confirmação; aviso no Início quando houver mês terminado aberto.

**Critérios de aceite:**

- [ ] Fechar sem todos os saldos reais é recusado com a lista de pendentes (CR-13).
- [ ] O fechamento do CR-12 mostra os ajustes positivo e negativo esperados e grava o consolidado esperado.
- [ ] Fora de sequência ou com identidade que não fecha é recusado com mensagem (CR-14, CR-15).
- [ ] O CR-18 passa literalmente no Vitest, com 14/10, 31/10 e 01/11 injetados; na integração, o mês corrente é recusado com mensagem e o mês anterior terminado é aceito, com datas relativas ao hoje em Cuiabá.
- [ ] Só o último mês fechado mostra "Reabrir", e a reabertura volta ao estado anterior (CR-16).

### Item D — Início, períodos e gráficos

**Contexto:** a tela que resume a carteira (P6, P7, P8).

**Ação técnica:**

- nova seção da KB-004, "Apresentação do Início", com P17 a P19 e os casos CR-51 (limites dos períodos) e CR-52 (aportes líquidos), só com datas fixas no passado, sem depender do "hoje", calculados à mão, e o registro `_project/drafts/004_telas_produto/004_validation_casos_inicio.md` do recálculo por outra ferramenta sem ver os esperados e da conferência do responsável, como no ciclo `003` (D12 daquele plano);
- limites, sempre em meses completos e inclusivos, com M o último mês fechado (P17):
  - mês: [M, M]; ano: [janeiro do ano de M, M] (P18); 12 meses: [M − 11, M]; desde o início: [início da carteira, M]; intervalo escolhido: [a, b] com a ≤ b ≤ M, sem meses depois de M no seletor;
  - todos passam pelo período efetivo (K8) e pelo `N/D` (K1) da KB-004, seção 8;
  - o rótulo sempre traz o mês final ("até set/2026") e, no ano, o ano ("2026");
  - mês reaberto deixa de ser fechado, e M passa a ser o mês anterior;
  - sem nenhum mês fechado, patrimônio, variação, rentabilidades, base 100, drawdown e gráficos mostram o estado vazio que explica que aparecem depois do primeiro fechamento;
- sugestão de K1: o resultado do período pedido continua `N/D`; ao lado, rotulado, aparece o resultado do período mais longo [n + 1, b], em que n é o último mês `N/D` do período, quando ele tiver algum mês;
- patrimônio de M com a data (P6) e, ao lado, "aportes líquidos desde <M>": soma de aportes, resgates e seus estornos com data depois do fim de M, sem rendimentos, marcação, câmbio nem transferências (P19); sem mês fechado, desde o início;
- variação, rentabilidade do período, série base 100 e drawdown máximo do período escolhido (R1-8);
- distribuição por ativo em M; gráficos de patrimônio, rentabilidade mensal e base 100;
- medição de desempenho de D9.

**Critérios de aceite:**

- [ ] Em cada cenário de leitura, os números do Início coincidem com os esperados do caso reproduzido.
- [ ] Os cinco períodos, a virada do ano, o mês reaberto e a carteira sem fechamento seguem o CR-51; os aportes líquidos seguem o CR-52.
- [ ] O drawdown máximo e a base 100 do período aparecem no Início e seguem o CR-36 e o CR-37, com `N/D` quando o período tem mês `N/D`.
- [ ] O cenário "volume" mostra o total esperado com mais de 1.000 eventos.
- [ ] CR-51 e CR-52 recalculados por outra ferramenta e conferidos pelo responsável, sem divergência aberta.
- [ ] Um período com mês `N/D` continua mostrando `N/D` e oferece, à parte e rotulado, o período calculável mais longo (CR-33, CR-35).
- [ ] Nenhum gráfico desenha `N/D` como zero, e cada um tem a tabela equivalente.
- [ ] O Início nunca apresenta como fechado um mês aberto (U3).
- [ ] A medição de D9 fica abaixo do limite, ou a situação passa a "Parado".

### Item E — Benchmarks, comparação e sincronização

**Contexto:** catálogo, cobertura e comparação da KB-004, seção 9; a sincronização ganha rota e tela (D10).

**Ação técnica:** `/benchmarks` com catálogo e "disponível até dd/mm/aaaa"; `/benchmarks/comparacao` com benchmark e período, diferença em p.p., % do benchmark, taxa de acerto e base 100 da carteira contra o benchmark; rota de D10 e `/admin/benchmarks`.

**Critérios de aceite:**

- [ ] A comparação do cenário do CR-44 coincide com o CR-44, e o CR-45 mostra `N/D` em % do benchmark.
- [ ] Mês parcial aparece marcado e nunca entra na comparação (CR-47).
- [ ] A rota e a página de admin recusam o usuário comum; a sincronização falsa grava tudo ou nada e mostra o motivo da recusa.
- [ ] Fonte lenta além do tempo limite e falha na segunda janela não gravam nada e mostram mensagem com "Tentar novamente"; repetir uma sincronização bem-sucedida não muda a cobertura.
- [ ] A sincronização pede confirmação antes de executar.

### Item F — Administração de acessos

**Contexto:** P10 e D11, sem migração.

**Ação técnica:** `/admin/acessos` com a lista de e-mails autorizados e seus papéis iniciais, o formulário de autorização e a remoção com confirmação, com os avisos de D11; roteiro da verificação em produção na task.

**Critérios de aceite:**

- [ ] O admin autoriza e remove um e-mail fictício; o e-mail é gravado normalizado.
- [ ] O usuário comum recebe 404 na página e não consegue inserir pela ação.
- [ ] A tela informa, junto das ações, que remover não revoga a conta e que o Google exige o cadastro de usuário de teste.

## Arquivos afetados

| Entrega | Arquivos |
| :-- | :-- |
| PR documental do plano | `_project/ideations/004_telas_produto.md`, `_project/drafts/004_telas_produto/004_plan.md`, `_project/decisions/ADR-005_graficos_svg_proprio.md`, `_project/cycles.md` |
| A | `src/app/(app)/` (layout e `/conta`), `src/app/page.tsx` (substituída), `src/components/`, `src/lib/financeiro/quantias.ts` e teste, `src/lib/sessao.ts`, `lerTudo` e teste, `tests/e2e/apoio/`, `eslint.config.mjs`, `tests/e2e/`, task da issue A |
| B | Páginas e ações em `src/app/(app)/ativos/`, `lancamentos/` e `transferencias/`, `src/lib/telas/`, `tests/e2e/`, task da issue B |
| C | `src/app/(app)/lancamentos/fechamento/`, `src/lib/telas/`, `tests/e2e/`, task da issue C |
| D | `src/app/(app)/page.tsx`, componentes de gráfico, `src/lib/telas/`, `_project/knowledge/KB-004_regras_financeiras.md`, `tests/fixtures/financeiro/casos_referencia.json`, `_project/drafts/004_telas_produto/004_validation_casos_inicio.md`, `tests/e2e/`, task da issue D |
| E | `src/app/(app)/benchmarks/`, `src/app/(app)/admin/benchmarks/`, `src/app/api/benchmarks/sincronizar/route.ts`, `src/lib/telas/`, `tests/e2e/`, task da issue E |
| F | `src/app/(app)/admin/acessos/`, `tests/e2e/`, task da issue F |
| Encerramento | `_project/knowledge/KB-003_visao_produto_arquitetura.md`, `README.md` se necessário, `_project/cycles.md`, mudança para `_project/executed/004_telas_produto/` |

Os nomes exatos de componentes e funções são fixados nas PRs, dentro destas decisões.

## Decomposição em issues e PRs

| Issue | Prefixo e título | Branch | Depende de |
| :-- | :-- | :-- | :-- |
| A | `[FEATURE] Base da interface, parser de quantias e apoio dos testes` | `feature/issue-N` | Plano integrado |
| B | `[FEATURE] Telas de ativos, lançamentos e transferências` | `feature/issue-N` | A |
| C | `[FEATURE] Tela de fechamento mensal` | `feature/issue-N` | B |
| D | `[FEATURE] Início com rentabilidade, períodos e gráficos` | `feature/issue-N` | C |
| E | `[FEATURE] Benchmarks, comparação e sincronização com o SGS` | `feature/issue-N` | D |
| F | `[FEATURE] Administração da lista de acessos` | `feature/issue-N` | E |

Uma PR por issue. A PR documental do plano, a PR de release e a PR de encerramento não têm issue.

## Dependências e blockers

- Aprovação do plano, com D1 a D14 confirmadas.
- Outra ferramenta para recalcular CR-51 e CR-52 sem ver os esperados, antes do merge da PR D. Se não houver, "Parado" com a pergunta ao responsável.
- Disponibilidade de outra ferramenta para a revisão do plano (P15). Se não houver, "Parado" com a pergunta ao responsável.
- Acesso do responsável à produção como admin, para a ação externa e a verificação.
- Nenhuma dependência de pacote nova e nenhuma migração.

## Riscos, suposições e rollback

- **Número errado na tela (G1):** composição só por D4, testada contra os casos; ponta a ponta confere os números exibidos.
- **Leitura parcial ou misturada (G1):** a Data API corta em 1.000 linhas sem erro, e páginas sucessivas podem ver estados diferentes; toda coleta para cálculo é completa, em ordem total pelas chaves reais, e cada composição de tela é conferida por marcas de versão antes de sua primeira leitura e depois da última, ou a tela mostra erro recuperável (D13).
- **Relógio real nos testes:** o banco usa o hoje real; casos dependentes de "hoje" são provados no Vitest e integrados com datas relativas (D9).
- **Ocultação incompleta (G3):** preferência lida no servidor e um único componente por tipo de valor, com testes de recarga, navegação e formulários (D8).
- **Entrada monetária (O13, U5):** parser estrito no cliente e no servidor.
- **Isolamento pela interface (G2):** sessão do usuário em toda chamada, sem chave secreta; testes com dois usuários e com o usuário comum nas rotas de admin.
- **Primeiro uso real (G3):** nada de dado real em seed, teste, captura ou evidência; verificação em produção sem valores.
- **SGS:** fonte falsa nos testes; tempo limite de 45 s na busca; falha antes da gravação não grava nada (D10 do ciclo `003`) e é explicada na tela; resposta perdida depois da gravação é resolvida relendo a cobertura, e repetir é seguro.
- **Tamanho do ciclo:** seis entregas; se a revisão não convergir, o fatiamento é revisto com o responsável.
- **Suposição:** o cálculo na leitura cabe no tempo de página com o volume de um usuário (V4, medido em D9).
- **Rollback:** nenhuma migração; cada entrega é revertida por PR, e o deploy anterior da Vercel pode ser promovido pelo responsável. Os dados lançados pelos usuários ficam no banco, intactos, porque nenhuma entrega altera o schema.

## Sequência recomendada

1. Revisão formal do plano por outra ferramenta (P15) e correções.
2. Aprovação do plano, com D1 a D14.
3. ADR-005 (D14) e PR documental `chore/cycle-004-plan`, com merge e checks verdes.
4. Criação das issues A a F, depois de apresentar o payload.
5. Issues A a F, cada uma com autorização, PR e merge.
6. Ação externa: primeira sincronização dos benchmarks em produção (depois da issue E).
7. Verificação em produção (depois da issue F).
8. Release `0.3.0`.
9. Encerramento prospectivo, com a KB-003 atualizada.

## Referências

- Ideação: `_project/ideations/004_telas_produto.md`.
- `.agent/ai_behavior.md` e `_project/README.md` (G1 a G4, pontos de aprovação, encerramento prospectivo).
- ADR-002 (stack, fuso, SGS sob demanda) e ADR-003 (acesso e privacidade).
- KB-001 (origem fixada), KB-002 (procedimentos de acesso, armadilha 7), KB-003 (estado do produto) e KB-004 (regras e casos de referência).
- `design-system/DESIGN.md`, seções 1 a 7.
- Documentação da Vercel sobre duração de funções, conforme V1.

## Rastreabilidade

| Campo | Valor |
| :-- | :-- |
| Issue(s) | A [#37](https://github.com/EuThiagoAndrade/saldo-futuro/issues/37), B [#38](https://github.com/EuThiagoAndrade/saldo-futuro/issues/38), C [#39](https://github.com/EuThiagoAndrade/saldo-futuro/issues/39), D [#40](https://github.com/EuThiagoAndrade/saldo-futuro/issues/40), E [#41](https://github.com/EuThiagoAndrade/saldo-futuro/issues/41) e F [#42](https://github.com/EuThiagoAndrade/saldo-futuro/issues/42), criadas em 2026-10-14 |
| PR(s) | Plano: [#36](https://github.com/EuThiagoAndrade/saldo-futuro/pull/36), integrada por squash; A: [#43](https://github.com/EuThiagoAndrade/saldo-futuro/pull/43), integrada por squash; B: [#45](https://github.com/EuThiagoAndrade/saldo-futuro/pull/45), integrada por squash; C: [#46](https://github.com/EuThiagoAndrade/saldo-futuro/pull/46), integrada por squash; D: [#47](https://github.com/EuThiagoAndrade/saldo-futuro/pull/47) |
| Branch(es) | Plano: `chore/cycle-004-plan`; A: `feature/issue-37`; B: `feature/issue-38`; C: `feature/issue-39`; D: `feature/issue-40`; E: `feature/issue-41` |
| Destino após conclusão | `_project/executed/004_telas_produto/004_plan.md` |

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando autorização de implementação — ciclo 004 (completo)
Quem: Responsável
Conferir: Issue #37 e escopo (item A)
Diga: "autorizo a implementação da issue #37"
```

As issues seguem a sequência A → F; cada uma tem autorização própria. A implementação da issue #37 foi autorizada em 2026-10-14; a partir dela, o artefato ativo é a task `004_task_issue-37.md`.

Em 2026-10-14, depois da PR #47 integrada e da issue #40 fechada, o responsável autorizou a implementação da issue #41. O artefato ativo corrente é `004_task_issue-41.md`; a task #40 foi reconciliada com o estado do GitHub.

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 004 + criar_issues + issues A-F/004_plan + v4`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`:
  - antes: plano `v4` `Aprovado`, integrado pela PR #36; nenhuma issue do ciclo (busca por título sem duplicata);
  - depois: issues #37 (A), #38 (B), #39 (C), #40 (D), #41 (E) e #42 (F) abertas como `[FEATURE]`, com os campos do Issue Form e as dependências em sequência; bloco "Aguardando autorização de implementação".
- `result`: `executed`
- `evidence`:
  - payload apresentado e confirmado pelo responsável em 2026-10-14 ("Confirmo o payload; crie as issues A a F do ciclo 004");
  - `gh issue list` conferido depois da criação: seis issues abertas com os títulos do plano;
  - template lido: `.github/ISSUE_TEMPLATE/feature_request.yml`;
  - handoff anterior: `saldo-futuro + 004 + atualizar_docs + 004_plan/aprovacao + v4` (aprovação do plano e PR documental #36).
- `blockers`: nenhum.

## Revisão crítica

### Rodada 1

- **Autor:** Thiago Andrade e Claude (Claude Code, Opus 5.5), conforme autoria do rascunho.
- **Revisor:** Codex desktop, GPT-6.
- **Data e autorização:** 2026-10-14; solicitação humana "revise o plano do ciclo 004". Autoriza o parecer formal e seu registro.
- **Base:** `main` @ `89d3cd3`; plano local `v1`; ciclo `004` em `Planejamento`; sem issues vinculadas nos artefatos locais. Não houve consulta ao estado externo de issues/PRs nesta revisão.
- **Identidade da origem:** SHA-256 do plano anterior à revisão, normalizado em UTF-8/LF: `96729223362c0e36716b604bd0c827ae456c635b1de903ddca08f798671cf3c8`. SHA-256 do trecho de `## Problema e contexto` até imediatamente antes de `## Próximo passo`: `a7d052cb3599b8844234ca73b9ba371471be66b4b680e9a3dbe236e5d2994760`. O desenho e o escopo desse trecho são preservados pelo revisor.
- **Template e autoridades lidos:** `.agent/templates/plano_implementacao.md`, `.agent/workflows/revisar_plano.md`, `.agent/workflows/triar.md`, `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, ideação do `004`, ADR-001 a ADR-004, KB-001 a KB-004, `design-system/DESIGN.md` e lições aprendidas. Conferidos também migrações, configuração do Supabase, módulos financeiros/SGS, seed, testes existentes, configuração do Playwright, dependências e CI.
- **Limite:** P1 a P16 são tratados como decisões humanas já registradas; D1 a D12 permanecem propostas. Esta rodada não escolhe interpretação financeira nem corrige a implementação.

#### Achados bloqueadores

**R1-1 — A leitura para cálculo não tem garantia de trazer todas as linhas.**

- **Classificação:** bloqueador, G1; D4, D9, itens C/D/E e estratégia de testes.
- **Evidência:** `supabase/config.toml:18` fixa `max_rows = 1000`. O plano prevê 30 ativos por cinco anos e cita uma janela de CDI com 2.510 valores, mas não define paginação nas leituras de eventos, posições e séries usadas pelos cálculos. Uma consulta isolada pode devolver só parte do conjunto sem erro. O limite de linhas também é relevante ao CR-08, com 2.050 eventos. A documentação de [`range`](https://supabase.com/docs/reference/javascript/range) exige ordenação para resultados previsíveis.
- **Consequência:** o cálculo pode omitir patrimônio, fluxos ou taxas e produzir um número plausível incorreto; medir só o tempo do Início não detecta isso.
- **Correção necessária:** declarar leituras completas, com filtros adequados e paginação em ordem estável, separando a paginação visual da coleta para cálculo. Trazer também os eventos referenciados por estornos de períodos anteriores (`fechamento.ts`, `rentabilidade.ts`, CR-24). Exigir teste pelo caminho real de leitura da aplicação com mais de 1.000 linhas, conferindo totais/retornos e a falha de uma página intermediária; um conjunto incompleto deve produzir erro, nunca cálculo parcial. A prova de exatidão precede a medição de D9.

**R1-2 — O contrato de ocultação não está compatibilizado com SSR, gráficos e campos.**

- **Classificação:** bloqueador, G3/P16; D6, D8 e aceite do item A.
- **Evidência:** D6 exige SVG renderizado no servidor sem JavaScript de cliente, enquanto D8 depende de contexto de cliente e de `localStorage` para trocar rótulos monetários. O servidor não lê essa preferência. O texto não define como rótulos/eixos, descrições e tabelas do SVG respondem ao botão, nem como evitar uma exibição inicial antes da leitura da preferência persistida. O aceite "nenhuma quantia aparece na página" abrange também os campos monetários dos itens B/C, que não usam necessariamente `Dinheiro`.
- **Consequência:** a preferência pode estar ligada e ainda deixar dinheiro visível num recarregamento, num gráfico, numa tabela acessível ou num formulário.
- **Correção necessária:** compatibilizar D6/D8, mantendo os cálculos no servidor e definindo como toda apresentação monetária responde à preferência, inclusive antes da hidratação. Explicitar a interação com campos em edição sem presumir uma exceção a P16. Exigir testes com preferência previamente ligada, recarga, navegação, troca do botão e formulários, verificando texto visível, rótulos acessíveis, títulos/descrições e tabelas dos gráficos. Não é necessário prometer remoção dos dados do transporte; o requisito é a ocultação na apresentação já escolhida pelo responsável.

**R1-3 — O seed financeiro conflita com o ciclo de vida dos usuários dos testes existentes.**

- **Classificação:** bloqueador, evidência de G1/G2; D9, item A e testes ponta a ponta.
- **Evidência:** hoje `supabase/seed.sql` cria só `authorized_emails`, sem usuários em `auth.users`. Criar a carteira pelas funções exige um usuário e `auth.uid()`. Além disso, `tests/e2e/auth.spec.ts` apaga e recria `usuario.a@example.com` e `admin@example.com` no preparo dos testes e os apaga ao final. As chaves da carteira têm `on delete cascade`: usar esses usuários para o seed destrói a carteira de referência. A execução serial desse arquivo não isola os demais arquivos de testes.
- **Consequência:** o aceite de `supabase db reset` e os números esperados dos testes dependem de preparo ainda indefinido; suites podem observar carteira vazia ou dados modificados por outro fluxo.
- **Correção necessária:** definir no item A como os usuários fictícios, suas identidades de login e a sessão das funções são preparados, e como cenários financeiros são restaurados/isolados dos testes de autenticação e dos fluxos mutantes. Indicar quais casos correspondem a cada cenário; os CRs citados não constituem automaticamente uma única história de carteira. Incluir a adaptação explícita do preparo/limpeza de `auth.spec.ts` ou usuários exclusivos para cada suite, e verificar o conjunto completo no CI. Qualquer credencial administrativa de preparo continua restrita ao Supabase local, conforme o padrão existente.

**R1-4 — Os períodos e o "movimentado" do Início ainda admitem números distintos.**

- **Classificação:** bloqueador, G1; P6/P7, D4 e item D.
- **Evidência:** P6 fixa a data do patrimônio no último mês fechado, mas P7/item D não fixam o mês final de "mês", "ano até a data", "12 meses" e "desde o início", nem se o intervalo escolhido usa meses completos. A KB-004, seções 7/8, calcula por mês e mantém `N/D` quando há mês aberto no período. Também não foi definida a soma chamada "movimentado do mês aberto".
- **Exemplos fictícios:** com setembro fechado e outubro aberto, um período até outubro é `N/D`; o período até setembro pode ser calculável, mas precisa dessa data no rótulo. Na virada do ano, usar o ano civil atual ou o ano do último fechamento gera períodos diferentes. Com aporte de R$ 500,00 e rendimento lançado de R$ 20,00 no mês aberto, "movimentado" pode significar R$ 500,00 (fluxo externo líquido) ou R$ 520,00 (soma dos eventos); a escolha não está na KB.
- **Correção necessária:** especificar os limites inclusivos e rótulos dos cinco períodos, o tratamento de carteira sem fechamento, mês reaberto e virada do ano, e a sugestão calculável preservando o resultado `N/D` do período pedido. Usar meses completos ou levar qualquer cálculo de fração de mês ao responsável. Precisar quais componentes entram em "movimentado", com exemplo e autoridade; se as decisões registradas não bastarem, o autor apresenta as alternativas ao responsável, sem escolher sozinho. Acrescentar critérios de aceite para esses limites e para a composição dos fluxos.

**R1-5 — A proteção só no layout não assegura o contrato de cada ponto de entrada.**

- **Classificação:** bloqueador, G2; D2/D3 e aceite do item A.
- **Evidência:** D2 concentra a exigência de sessão no layout do grupo. O [guia oficial de autenticação do Next.js](https://nextjs.org/docs/app/guides/authentication) alerta que layouts não refazem a conferência em toda navegação e não impedem a execução dos segmentos filhos; recomenda conferir junto do acesso aos dados. Actions e Route Handlers também são pontos de entrada independentes. A RLS e as RPCs existentes continuam protegendo o banco, mas isso não prova o redirecionamento/recusa prometidos pela interface.
- **Correção necessária:** exigir a conferência de sessão junto de cada leitura protegida e em toda Action/rota de escrita, com a verificação de papel em cada operação administrativa. Pode ser uma função comum reutilizada; o layout continua desenhando a navegação. Prever testes de acesso direto, navegação com sessão encerrada/expirada, Action sem sessão, usuário comum e identificadores de outro usuário. Recusa ou falha de perfil não deve virar sucesso nem uma página com dados incompletos.

#### Ressalvas

**R1-6 — A medida do SGS não comprova disponibilidade nem tratamento de timeout.**

- **Classificação:** ressalva; V1/V2, D10 e item E.
- **Evidência:** a [documentação de duração da Vercel](https://vercel.com/docs/functions/configuring-functions/duration), reconferida nesta rodada, confirma 300 s no Hobby com fluid compute e o export `maxDuration`. Isso não comprova a configuração efetiva do projeto ou o acesso ao SGS pela região de execução. O tempo de 0,58 s é uma observação registrada pelo autor; não foi reproduzido nesta rodada e não garante três janelas futuras. `sincronizarBenchmark` permite injetar `buscar`, mas hoje não impõe deadline.
- **Ajuste recomendado:** distinguir a medição da hipótese; definir na rota uma espera limitada inferior ao limite da plataforma, mensagem recuperável e teste com fonte lenta/falha em janela posterior, provando nenhuma gravação antes da validação completa. A gravação pode ter sido concluída se só a resposta ao cliente falhar: prever conferência/repetição segura, sem prometer que todo timeout significa "nada gravado". Confirmar o acesso real à fonte na ação externa já prevista.

**R1-7 — Falta o destino do ADR da escolha de gráficos.**

- **Classificação:** ressalva documental; P4/D6 e arquivos afetados.
- **Evidência:** ADR-002, seção "Stack", determina que a escolha de gráficos do ciclo `004` seja registrada em ADR. O plano escolhe SVG próprio, mas não inclui esse registro em nenhuma entrega.
- **Ajuste recomendado:** incluir o ADR correspondente na PR documental ou numa entrega nomeada, usando `.agent/templates/adr.md` no ponto de criação. A ausência de biblioteca de pacote não elimina a decisão de arquitetura já exigida; isso não requer alterar a governança.

**R1-8 — O drawdown tem testes previstos, mas não tem destino explícito nas telas.**

- **Classificação:** ressalva de rastreabilidade; P7, estratégia de composição e itens D/E.
- **Evidência:** P7 da ideação inclui os períodos para rentabilidade, comparação, base 100 e drawdown; o plano adota P7 e testa CR-36, mas nenhuma ação técnica ou critério dos itens D/E identifica onde aparece o drawdown máximo.
- **Ajuste recomendado:** explicitar o destino do indicador e seu aceite por período com CR-36/`N/D`, ou registrar a decisão humana de adiá-lo. Testar o módulo sem tornar claro o resultado entregue pela interface não resolve a rastreabilidade de P7.

#### Itens atendidos e validações

- O nível completo, o modo contínuo ausente e G1/G2/G3 são adequados; G4 não se aplica enquanto o ciclo não mudar migrações. A sequência A → F e os pontos de aprovação distinguem plano, implementação, merge, ação externa e produção.
- O alcance mínimo de acessos é compatível com os grants/políticas atuais. D11 explica corretamente que retirar da lista não revoga conta existente; o admin não ganha acesso a carteiras alheias.
- Parser estrito, sinais explícitos, componentes de apresentação, trânsito no patrimônio, prévia/fechamento no banco e ausência como `N/D` têm autoridades existentes e testes de referência identificados.
- Baseline local conferido: commit `89d3cd3`, versão `0.2.0`, oito funções de escrita da carteira, carga de benchmark restrita ao admin, seis arquivos pgTAP, dependências fixadas e ausência de biblioteca de gráficos/ícones. A revisão por Codex atende P15, por ser ferramenta diferente da autora.
- Não foram encontrados dados reais nos artefatos revisados. Não foi necessário ler carteira de produção nem consultar a origem para decidir os achados.
- Validações documentais: 39/39 testes de `scripts/validate-governance.test.mjs` passaram. A primeira execução teve três erros `EPERM` ao renomear fixtures no temporário do sandbox; a repetição com `TEMP`/`TMP` em `local/review-cycle-004-temp/` passou integralmente, sem alterar os testes. `node scripts/validate-governance.mjs` passou com 0 erros/avisos e `git diff --check` passou. A conferência final confirmou o whitespace limpo do plano ainda não versionado e, por SHA-256, o escopo e os demais artefatos preservados; a reconstrução da origem ao desfazer só status/veredito, próximo passo e revisão coincidiu com o hash original.

**Veredito: `REQUER NOVA RODADA`.** Cinco bloqueadores (R1-1 a R1-5) e três ressalvas (R1-6 a R1-8). O plano `v1` permanece `Em Revisão`, revisão `Em andamento`, ciclo `Planejamento` e aprovação humana pós-revisão `Pendente`. O autor deve responder a cada achado como corrigido ou contestado com justificativa, incrementar a versão ao corrigir e preservar esta rodada. A revisão não autoriza implementação nem promove o plano.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 004 + revisar_plano + 004_plan/rodada-1 + v1`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `Planejamento`; plano local `v1` em `Rascunho`; revisão/veredito/aprovação pendentes; próximo passo `Aguardando revisão (rodada 1)`.
- `state_after`: ciclo `Planejamento`; plano `v1` em `Em Revisão`; rodada 1 registrada; revisão `Em andamento`; veredito `REQUER NOVA RODADA`; aprovação `Pendente`; próximo passo `Aguardando correções (rodada 1)`.
- `result`: `executed`
- `evidence`: solicitação humana de 2026-10-14; esta rodada e campos de status/veredito; hashes da origem e do trecho preservado; fontes, arquivos e testes citados; validações documentais descritas acima. O handoff de `rascunhar_plano` permanece como registro histórico da criação; o estado corrente da revisão é o declarado aqui.
- `blockers`: R1-1 a R1-5. Nenhum bloqueio de capacidade para concluir e registrar o parecer.

### Resposta do autor à rodada 1

- **Autor:** Thiago Andrade e Claude (Claude Code, Opus 5.5).
- **Data e autorização:** 2026-10-14; solicitação humana "corrija o plano do ciclo 004".
- **Versão produzida:** `v2`. A rodada 1 acima foi preservada sem alteração.
- **Decisões do responsável obtidas nesta correção:** P17 a P20, registradas em "Decisões do responsável", com exemplos, depois de pergunta direta, porque R1-4 e parte de R1-2 exigiam escolha sobre como os números são apresentados (`.agent/ai_behavior.md`, "Gestão de incertezas").

| Achado | Resposta | Onde |
| :-- | :-- | :-- |
| R1-1 | **Corrigido.** Nova D13: coleta completa por `lerTudo`, paginada com `range` em ordem estável e total, conferida pela contagem exata, com erro em vez de cálculo parcial; a rentabilidade lê todos os eventos do usuário para resolver estornos anteriores (K2, CR-24); paginação visual separada. Testes com cliente falso (falha de página, contagem que muda) e cenário "volume" com mais de 1.000 eventos pelo caminho real; a medição de desempenho só depois dessa prova. V5 registra o limite de `supabase/config.toml` | D13, V4, V5, "Estratégia de testes", itens A e D, riscos |
| R1-2 | **Corrigido.** D8 passa a usar um cookie lido pelo servidor, de modo que a página e os gráficos SVG já saem ocultos, sem exibição antes da hidratação e sem JavaScript; o botão é um formulário com Server Action. O alcance cobre `Dinheiro`, rótulos, títulos, descrições e tabelas dos gráficos e os valores trazidos em formulários. Os campos em digitação não foram presumidos: o responsável decidiu P20 (digitação visível). Testes com o cookie ligado antes da carga, recarga, navegação, troca e formulários | D6, D8, P20, "Estratégia de testes", item A |
| R1-3 | **Corrigido.** D9 refeita: `supabase/seed.sql` e `auth.spec.ts` não mudam; o apoio dos testes cria usuários exclusivos por arquivo, monta cada cenário entrando como o próprio usuário e chamando as funções do banco, e cada cenário reproduz um único caso, num usuário próprio. A tabela "Cenários" liga cada caso ao seu cenário. As séries globais de benchmark ficam num arquivo serial que carrega a série de cada caso. Critério de aceite com a suíte completa no CI | D9, "Estratégia de testes" (Cenários), item A |
| R1-4 | **Corrigido com decisão do responsável.** P17 (períodos até o último mês fechado), P18 (ano do último mês fechado) e P19 (aportes líquidos: aportes, resgates e seus estornos depois do fim de M). O item D fixa os limites inclusivos em meses completos, os rótulos, a carteira sem fechamento, o mês reaberto e a sugestão de K1 sem trocar o `N/D` do período pedido. Como são regras de apresentação novas, entram na KB-004 com CR-51 e CR-52, recalculados por outra ferramenta e conferidos pelo responsável antes do merge da PR D | P17 a P19, D4, item D, pontos de aprovação, G1 |
| R1-5 | **Corrigido.** D2 refeita: `exigirSessao()` e `exigirAdmin()` junto de cada leitura protegida, no início de toda Server Action e de toda rota; falha ao ler sessão ou perfil é recusa; o layout só desenha a navegação. Testes de acesso direto, sessão encerrada, ação sem sessão, usuário comum em admin, identificadores de outro usuário e falha de perfil | D2, G2, "Estratégia de testes", item A |
| R1-6 | **Corrigido.** V2 passa a ser uma observação, não garantia. D10 acrescenta tempo limite de 45 s na busca, abaixo dos 60 s da rota, mensagem recuperável, releitura da cobertura quando a resposta se perde depois da gravação e repetição segura. Testes com fonte lenta e falha na segunda janela. O acesso real à fonte continua confirmado na ação externa | V2, D10, item E, riscos |
| R1-7 | **Corrigido.** Nova D14: ADR-005, "Gráficos em SVG próprio", pelo template de ADR, na PR documental do plano, depois da aprovação | D14, pontos de aprovação, arquivos afetados, sequência |
| R1-8 | **Corrigido.** O drawdown máximo e a base 100 do período escolhido aparecem no Início, com critério de aceite pelo CR-36 e pelo CR-37 e `N/D` quando o período tem mês `N/D` | Item D |

Nenhum achado foi contestado.

### Rodada 2

- **Autor:** Thiago Andrade e Claude (Claude Code, Opus 5.5), conforme autoria da `v2`.
- **Revisor:** Codex desktop, GPT-6.
- **Data e autorização:** 2026-10-14; solicitação humana "revise o plano do ciclo 004". Autoriza esta nova rodada e seu registro.
- **Base:** `main` @ `89d3cd3`; plano local `v2` em `Em Revisão`, ciclo `Planejamento`, próximo passo `Aguardando revisão (rodada 2)`. As oito respostas à rodada 1 foram localizadas; não existia rodada 2. Sem consulta ao estado externo de issues/PRs nesta rodada.
- **Identidade da origem:** SHA-256 da `v2` antes desta revisão, normalizada em UTF-8/LF: `7d148190b0c49a5aa597df51e4498e5b7880f409077845c20e72fdec5e9487b0`. Hash do trecho de `## Problema e contexto` até imediatamente antes de `## Próximo passo`: `73c5088388056631920234f9f4ee8eb1d4d9097108979917f0dd3a48eb9e976f`. Hash da rodada 1 e da resposta do autor, até imediatamente antes de `## Pós-mortem` na origem: `0abd9b34d06bf79d0258b184a58aae42922b0fb969e5de11d72dd141e7903c50`. Esses trechos são preservados.
- **Template e autoridades:** relidos `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, `.agent/workflows/revisar_plano.md`, `.agent/templates/plano_implementacao.md` e KB-003; conferidas as regras pertinentes da KB-004, do `DESIGN.md` e das ADRs já lidas na rodada 1. Inspecionados novamente schema, funções de carga/fechamento, módulos de datas/acumulado/SGS, casos de referência, preparo de autenticação e testes existentes.
- **Limite:** P17 a P20 são decisões humanas registradas pelo autor, com manifestação e data declaradas. O revisor não as substitui nem antecipa o recálculo independente de CR-51/CR-52 previsto no item D.

#### Conferência da rodada anterior

| Achado | Resultado da conferência da `v2` |
| :-- | :-- |
| R1-1 | **Parcialmente atendido.** D13 separa a paginação visual, coleta todas as páginas, compara contagens e inclui os eventos originais dos estornos. A ordenação proposta não serve a todas as tabelas, e contagem não assegura coerência durante substituições; ver R2-1 e R2-2 |
| R1-2 | **Atendido no plano.** D8 passa a ler a preferência no servidor, cobre gráficos/tabelas/formulários e inclui testes antes da primeira carga. P20 resolve explicitamente a digitação visível. A leitura de cookies em Server Components e sua atualização por Server Action são compatíveis com a [documentação do Next.js](https://nextjs.org/docs/app/api-reference/functions/cookies) |
| R1-3 | **Parcialmente atendido.** Usuários próprios por cenário, separação dos fluxos mutantes e arquivo serial para benchmarks resolvem a interferência de `auth.spec.ts`. O compromisso de reproduzir as datas literais de todo caso por RPC ainda conflita com CR-18; ver R2-3 |
| R1-4 | **Atendido no plano.** P17 a P19 registram as decisões; o item D define períodos mensais, rótulos, reabertura, ausência de fechamento e aportes líquidos. KB-004, CR-51/CR-52 e conferência independente/humana antes do merge D estão no escopo e em G1 |
| R1-5 | **Atendido no plano.** D2 protege leitura, Action e rota individualmente, com recusa na falha de sessão/perfil e testes por ponto de entrada |
| R1-6 | **Atendido no plano.** V2 distingue observação de hipótese; D10 limita a busca total a 45 s, prevê mensagem recuperável, resposta perdida depois da gravação e testes de falha/lentidão |
| R1-7 | **Atendido no plano.** D14 e a PR documental incluem a futura ADR-005 após a aprovação; não há motivo para criá-la durante esta revisão |
| R1-8 | **Atendido no plano.** O item D entrega drawdown e base 100 do período, com CR-36/CR-37 e tratamento de `N/D` |

#### Achados bloqueadores

**R2-1 — A ordenação de D13 cita colunas que não existem nas tabelas de cálculo.**

- **Classificação:** bloqueador, G1; D13, itens A/C/D/E. Refinamento da correção de R1-1.
- **Evidência:** D13 exige `data`, depois `id`, ou `id` nas tabelas sem data. No schema vigente, `consolidados_mensais` usa `(user_id, mes)` e `posicoes_mensais` usa `(user_id, mes, ativo_id)`; nenhuma das duas tem `data` ou `id`. `valores_benchmark` tem `(benchmark_id, data)`, sem `id`, e `coberturas_benchmark` tem `benchmark_id`, também sem `id` (`20261014185205_carteira.sql`, tabelas nas linhas 77/105; `20261014193630_benchmarks.sql`, linhas 21/30).
- **Consequência:** seguir literalmente a decisão causa erro de consulta nos próprios insumos financeiros. Um teste apenas com eventos ou cliente falso não demonstra compatibilidade com posições, consolidados e benchmarks.
- **Correção necessária:** definir a ordem total por tabela e pelos filtros efetivos, usando as chaves reais. Por exemplo, na carteira filtrada por usuário, `mes` para consolidados e `(mes, ativo_id)` para posições; na série filtrada por benchmark, `data`; em consultas com vários usuários/benchmarks, incluir a respectiva chave no desempate. Manter a regra comum de leitura completa e conferir os caminhos reais de cada tabela relevante, inclusive uma série com mais de 1.000 valores. Não é necessária mudança de schema.

**R2-2 — A contagem de D13 aceita páginas de versões diferentes do mesmo conjunto.**

- **Classificação:** bloqueador, G1; D13 e composição de D4, especialmente item E. Lacuna evidenciada pela nova garantia de coleta.
- **Evidência:** `public.carregar_benchmark` apaga e reinsere os valores da janela numa transação e atualiza `coberturas_benchmark.atualizado_em` (`20261014193630_benchmarks.sql:130-141`). A revisão pode trocar os valores mantendo as mesmas datas e a mesma contagem. Consultas sucessivas podem observar commits diferentes; uma ordenação total não cria um snapshot comum, conforme a [documentação de isolamento do PostgreSQL 17](https://www.postgresql.org/docs/17/transaction-iso.html). D13 só compara quantidades.
- **Demonstração fictícia, sem banco:** quatro retornos de 1,00% acumulam 4,060401%; uma revisão dos quatro para 2,00% acumula 8,243216%. Se uma coleta em páginas de duas linhas ler as duas primeiras antes da revisão e as demais depois, devolve quatro chaves válidas e contagem correta, mas calcula 6,131204%, valor de nenhuma das versões. A composição foi conferida nesta rodada com Node.js, por produto de fatores; não se trata de teste de concorrência executado no banco. O problema se mantém com páginas de 1.000 linhas e uma série maior.
- **Correção necessária:** acrescentar um contrato de coerência da leitura além da contagem, abrangendo valores e cobertura lidos juntos logicamente. Definir como detectar alteração durante a coleta e descartar/repetir o conjunto completo, com limite e erro recuperável. Há metadados existentes que podem participar dessa conferência (`atualizado_em` da cobertura e `fechado_em` dos consolidados para a carteira); a solução precisa demonstrar sua suficiência e considerar reabertura/novo fechamento entre leituras de posições e consolidados. Não pressupor nova migração ou RPC, vedadas pelo escopo. Exigir teste determinístico de substituição entre páginas com contagem e chaves inalteradas: o resultado aceito é uma versão coerente ou erro, nunca mistura.

**R2-3 — A reprodução literal do CR-18 pela Data API não controla o relógio do banco.**

- **Classificação:** bloqueador da evidência de G1; D9, tabela de cenários e item C. Refinamento da correção de R1-3.
- **Evidência:** D9 diz que cada cenário usa as datas do caso e as funções reais pela Data API; a tabela inclui CR-18 como escrita pela interface. O caso tenta fechar outubro de 2026 em três datas de "hoje": 14/10, 31/10 e 01/11, esperando duas recusas e uma aceitação. `private.hoje()` usa `now() at time zone 'America/Cuiaba'`, e `public.fechar_mes` não recebe a data corrente por parâmetro. Em 14/10/2026, o passo de aceitação não pode acontecer; depois de outubro, os passos de recusa literal deixam de representar mês não terminado. Alterar só o relógio do navegador não muda o banco.
- **Correção necessária:** separar a prova literal dos limites, que já pode usar as três datas injetadas em `conferirFechamento` no Vitest, dos cenários integrados com relógio real. Para o ponta a ponta, definir datas relativas em Cuiabá e os critérios correspondentes, com mês corrente recusado e mês terminado aceito, sem afirmar que esses cenários reproduzem literalmente os três passos do CR-18. O pgTAP existente já usa datas relativas (`04_carteira.test.sql:43-52,280-281`). Declarar também como o preparo suporta cenários com datas futuras ou dependentes de "hoje" dos novos CR-51/CR-52. Preservar os casos canônicos; não trocar a função de relógio ou a migração para acomodar o teste.

#### Progresso, validações e veredito

- Houve progresso material: os cinco bloqueadores da rodada 1 passaram a duas correções ainda parciais, detalhadas em três achados; as outras seis respostas foram atendidas. Não houve contestação, oscilação nem reaparecimento de achado já aceito como resolvido pelo revisor. Cabe correção e rodada 3; não se aplica a parada por ausência de progresso.
- O plano mantém nível completo, modo contínuo ausente, aprovação humana pendente, seis entregas e os pontos de aprovação separados. Não foi necessário alterar decisões financeiras, implementar telas, criar ADR/issue ou consultar dados reais.
- Gates documentais desta rodada: os 39 testes de governança passaram (Node.js 24, temporário em `local/review-cycle-004-temp/`, como na rodada 1); o validador passou com 0 erros/avisos e `git diff --check` passou. A revisão confere ao final, por SHA-256, a preservação do escopo, da rodada 1/resposta do autor e dos artefatos preexistentes, além do whitespace do plano ainda não versionado. Esses gates não demonstram os cenários de banco da implementação futura.

**Veredito: `REQUER NOVA RODADA`.** Três bloqueadores (R2-1 a R2-3). O plano `v2` permanece `Em Revisão`, revisão `Em andamento`, ciclo `Planejamento` e aprovação humana pós-revisão `Pendente`. O autor deve responder a cada achado, preservar as rodadas e incrementar a versão ao corrigir. Nenhuma implementação ou promoção do plano está autorizada por este parecer.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 004 + revisar_plano + 004_plan/rodada-2 + v2`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `Planejamento`; plano local `v2` em `Em Revisão`; revisão `Em andamento`; veredito anterior `REQUER NOVA RODADA`; aprovação `Pendente`; próximo passo `Aguardando revisão (rodada 2)`.
- `state_after`: mesmos estados de ciclo/plano/revisão/aprovação; rodada 2 registrada; veredito atual `REQUER NOVA RODADA`; próximo passo `Aguardando correções (rodada 2)`.
- `result`: `executed`
- `evidence`: solicitação humana de 2026-10-14; esta rodada e bloco de próximo passo; hashes da origem e dos trechos preservados; schema, testes e fontes citados; demonstração aritmética e gates documentais. O handoff de correção para `v2` é histórico; o resultado corrente da revisão está registrado aqui.
- `blockers`: R2-1 a R2-3. Nenhum bloqueio de capacidade para concluir e registrar a rodada.

### Resposta do autor à rodada 2

- **Autor:** Thiago Andrade e Claude (Claude Code, Opus 5.5).
- **Data e autorização:** 2026-10-14; solicitação humana "corrija o plano do ciclo 004".
- **Versão produzida:** `v3`. As rodadas 1 e 2 e a resposta à rodada 1 foram preservadas sem alteração. Nenhuma decisão do responsável foi necessária: as correções não mudam nenhum número apresentado.

| Achado | Resposta | Onde |
| :-- | :-- | :-- |
| R2-1 | **Corrigido.** D13 lista a ordem total de cada tabela pelas chaves reais do schema (`mes` em consolidados; `mes`, `ativo_id` em posições; `data` na série filtrada por benchmark, com `benchmark_id` quando houver vários; `data`, `id` em eventos; `id` em ativos e transferências). O teste de leitura completa passa pelo caminho real de cada tabela, com páginas pequenas forçadas e uma série com mais de 1.000 valores | D13, "Estratégia de testes", item A |
| R2-2 | **Corrigido.** D13 acrescenta marcas de versão lidas antes e depois de cada coleta, com colunas existentes: `inicio`, `fim` e `atualizado_em` da cobertura, alterados na mesma transação que substitui os valores; (`mes`, `fechado_em`) dos consolidados, que muda em fechamento, reabertura e novo fechamento, junto com as posições; contagens de eventos e transferências, que só recebem inserções; contagem e maior `desativado_em` dos ativos. Marca diferente descarta o conjunto e repete, até 3 vezes, e depois mostra erro recuperável. Testes determinísticos com substituição entre páginas sem mudar contagem nem chaves, reabertura e novo fechamento e lançamento retroativo. Sem migração nem função nova | D13, "Estratégia de testes", item A, riscos |
| R2-3 | **Corrigido.** D9 declara que o banco usa o relógio real: um cenário literal exige datas até o hoje real e meses a fechar já terminados, conferido pelo apoio, que falha em vez de pular. CR-18 sai da integração literal: é provado no Vitest com as três datas injetadas, e a integração usa datas relativas ao hoje em Cuiabá. CR-51 e CR-52 usam só datas fixas no passado. Nenhuma mudança na função de relógio nem migração | D9, tabela "Cenários", itens A, C e D, riscos |

Nenhum achado foi contestado.

### Rodada 3

- **Autor:** Thiago Andrade e Claude (Claude Code, Opus 5.5), conforme autoria da `v3`.
- **Revisor:** Codex desktop, GPT-6.
- **Data e autorização:** 2026-10-14; solicitação humana "revise o plano do ciclo 004". Autoriza esta rodada e seu registro.
- **Base:** `main` @ `89d3cd3`; plano local `v3` em `Em Revisão`; ciclo `Planejamento`; próximo passo `Aguardando revisão (rodada 3)`. As três respostas à rodada 2 foram localizadas; não existia rodada 3. Sem consulta ao estado externo de issues/PRs nesta revisão.
- **Identidade da origem:** SHA-256 da `v3` anterior à revisão, normalizada em UTF-8/LF: `676b2ed731232daf2a919b18acca0a4fbd89775f3a568493e851e3565be12d1e`. Hash do trecho de `## Problema e contexto` até a seção `## Próximo passo`: `b4caa1a4c4428f753cd0a1c0047b0b484bc1f5f8f0b244fbf5bed0d4c98a63c6`. Hash das rodadas 1/2 e respostas, até a seção `## Pós-mortem` na origem: `2fcac7af816b5c39a25f84c320e735fb52d1c8abb0b143027e697534650af07c`. Os limites desses hashes são os títulos de seção em linhas próprias, excluindo o título final.
- **Template e autoridades:** relidos `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, `.agent/workflows/revisar_plano.md`, `.agent/templates/plano_implementacao.md` e KB-003. Conferidos o plano inteiro, as respostas, KB-004 (consolidação, patrimônio e rentabilidade), as chaves e transações das migrações de carteira/benchmarks e o padrão de datas relativas do pgTAP. As demais autoridades e decisões já examinadas nas rodadas anteriores continuam aplicáveis.
- **Limite:** esta revisão preserva as decisões financeiras e o escopo da `v3`. Os testes futuros de coerência do item A ainda precisam ser implementados; a demonstração abaixo é uma análise do contrato proposto, não execução no banco.

#### Conferência da rodada anterior

| Achado | Resultado da conferência da `v3` |
| :-- | :-- |
| R2-1 | **Atendido no plano.** D13 agora usa as chaves reais de cada tabela, incluindo chaves compostas e filtro do benchmark; a estratégia e o item A incluem coleta real de todas as tabelas, páginas pequenas e série com mais de 1.000 valores |
| R2-2 | **Parcialmente atendido.** Há marcas antes/depois, descarte integral, até três tentativas e testes determinísticos de alteração entre páginas. Ainda falta tornar a fronteira comum a todas as tabelas usadas conjuntamente; a redação por coleta/tabela admite o cenário de R3-1 |
| R2-3 | **Atendido no plano.** D9 separa os casos literais com datas passadas das provas com relógio injetado e dos cenários integrados com datas relativas. O item C e a tabela de cenários deixam de prometer reprodução literal do CR-18 pela Data API. CR-51/CR-52 ficam com datas fixas passadas, e o preparo deve falhar diante de precondição temporal inválida |

#### Achado bloqueador

**R3-1 — A coerência precisa abranger os insumos usados juntos, não apenas cada coleta de tabela.**

- **Classificação:** bloqueador, G1; D4/D13, estratégia de coerência e itens A/C/D/E. Complemento ainda pendente de R2-2.
- **Evidência:** D13 vincula as marcas à primeira e à última página de "cada coleta" e conclui que uma tabela de uma página vê um único estado. Os testes propostos alteram o banco entre páginas. Isso protege uma varredura, mas não exige expressamente uma mesma janela de validação para as leituras de consolidados, posições e eventos que D4 combina. O schema grava consolidado e posições juntos em `fechar_mes` e os remove juntos em `reabrir_mes`, mas consultas posteriores são independentes (`20261014185205_carteira.sql:571-604`). A [documentação do PostgreSQL 17](https://www.postgresql.org/docs/17/transaction-iso.html) confirma que consultas sucessivas podem observar commits diferentes.
- **Demonstração fictícia:** uma coleta de uma página lê o consolidado de M com Vf de R$ 1.100,00; suas marcas antes/depois são v1 e a coleta é aceita. Outra sessão reabre M e fecha com saldo real de R$ 1.200,00. A coleta das posições começa depois disso, lê uma página com total de R$ 1.200,00 e aceita marcas v2/v2. Nenhuma marca mudou durante sua própria coleta, mas combinar os resultados mostra patrimônio de R$ 1.100,00 e distribuição que soma R$ 1.200,00, contrariando a KB-004, seção 6. Uma simulação dessa sequência em Node.js confirmou que ambas as comparações locais passam; não foi executado teste de banco.
- **Correção necessária:** definir a unidade de coerência como o conjunto de insumos usados conjuntamente por D4. Para a carteira, a validação deve começar antes de determinar M e ler os insumos relacionados e terminar depois de completar todas essas leituras, incluindo tabelas de uma página. Os valores e a cobertura de um benchmark também precisam pertencer à mesma coleta validada; a cobertura usada no cálculo deve ser a versão que foi conferida. Mudança descarta todos os insumos daquela composição e repete o conjunto, preservando o limite de três tentativas. Conferências internas por tabela podem continuar como defesa adicional. Isso pode ser especificado com as marcas existentes, sem nova migração, função de banco ou decisão de cálculo.
- **Aceite necessário:** teste determinístico com uma página por tabela, alterando o estado **entre o término da leitura de consolidados e o início da leitura de posições/eventos**, além dos testes já previstos entre páginas. O resultado deve corresponder integralmente a v1 ou v2, ou ser erro recuperável; o par R$ 1.100,00/R$ 1.200,00 nunca pode ser entregue como uma composição válida. Incluir também a leitura da cobertura/valores do benchmark nessa conferência de insumos relacionados.

#### Progresso, validações e veredito

- Os três bloqueadores da rodada 2 diminuíram para um: chaves e relógio foram resolvidos no plano; a proteção contra mistura evoluiu, mas sua fronteira ainda precisa abranger a composição. Não houve contestação, oscilação ou reaparecimento de achado já aceito como resolvido. Cabe correção e rodada 4 dentro do teto de cinco.
- Permanecem adequados o nível completo, G1/G2/G3, o modo contínuo ausente, as seis entregas, as aprovações separadas e a validação independente/humana dos novos casos antes do merge D. Os achados já encerrados das rodadas anteriores não foram reabertos.
- Gates documentais: Node.js `v24.15.0`; 39/39 testes de governança passaram, com `TEMP`/`TMP` em `local/review-cycle-004-temp/`; validador com 0 erros/avisos e `git diff --check` limpo. A conferência final verifica os hashes dos trechos preservados e a reconstrução da origem ao desfazer somente o próximo passo e esta rodada, além do whitespace do plano ainda não versionado.

**Veredito: `REQUER NOVA RODADA`.** Um bloqueador (R3-1). O plano `v3` permanece `Em Revisão`, revisão `Em andamento`, ciclo `Planejamento` e aprovação humana pós-revisão `Pendente`. O autor deve responder ao achado, preservar o histórico e incrementar a versão ao corrigir. Este parecer não promove o plano nem autoriza implementação.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 004 + revisar_plano + 004_plan/rodada-3 + v3`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `Planejamento`; plano `v3` em `Em Revisão`; revisão `Em andamento`; veredito anterior `REQUER NOVA RODADA`; aprovação `Pendente`; próximo passo `Aguardando revisão (rodada 3)`.
- `state_after`: mesmos estados de ciclo/plano/revisão/aprovação; rodada 3 registrada; veredito atual `REQUER NOVA RODADA`; próximo passo `Aguardando correções (rodada 3)`.
- `result`: `executed`
- `evidence`: solicitação humana de 2026-10-14; esta rodada e bloco de próximo passo; hashes da origem e dos trechos preservados; regras, schema, fonte e demonstração citados; gates documentais. O handoff da correção para `v3` permanece como histórico; este é o resultado corrente da revisão.
- `blockers`: R3-1. Nenhum bloqueio de capacidade para concluir e registrar a rodada.

### Resposta do autor à rodada 3

- **Autor:** Thiago Andrade e Claude (Claude Code, Opus 5.5).
- **Data e autorização:** 2026-10-14; solicitação humana "corrija o plano do ciclo 004".
- **Versão produzida:** `v4`. As rodadas 1 a 3 e as respostas anteriores foram preservadas sem alteração. Nenhuma decisão do responsável foi necessária: a correção não muda nenhum número apresentado.

| Achado | Resposta | Onde |
| :-- | :-- | :-- |
| R3-1 | **Corrigido.** A unidade de coerência de D13 passa a ser a composição de uma tela: as marcas da carteira e de cada benchmark usado são lidas antes da primeira leitura de insumos, inclusive antes de determinar M, e de novo depois da última, inclusive de tabelas de uma página. A cobertura usada no cálculo é a da marca conferida. Marca diferente descarta todos os insumos da composição e repete o conjunto, até 3 tentativas, e depois mostra erro recuperável. A conferência por coleta continua como defesa adicional. Testes determinísticos com uma página por tabela, alterando o estado entre consolidados e posições ou eventos (o exemplo de R$ 1.100,00 e R$ 1.200,00) e entre a cobertura e os valores de um benchmark. Sem migração, função nova nem decisão de cálculo | D13, "Estratégia de testes", item A, riscos |

Nenhum achado foi contestado.

### Rodada 4

- **Autor:** Thiago Andrade e Claude (Claude Code, Opus 5.5), conforme autoria da `v4`.
- **Revisor:** Codex desktop, GPT-6.
- **Data e autorização:** 2026-10-14; solicitação humana "revise o plano do ciclo 004". Autoriza o parecer formal e seu registro.
- **Base:** `main` @ `89d3cd3`; plano local `v4` em `Em Revisão`; ciclo `Planejamento`; próximo passo `Aguardando revisão (rodada 4)`. A resposta a R3-1 foi localizada; não existia rodada 4. Não foi consultado o estado externo de issues/PRs, pois esta revisão é local e não publica artefatos.
- **Identidade da origem:** SHA-256 da `v4` anterior à revisão, normalizada em UTF-8/LF: `f0057fadc6dad537d89380b9d32eb20ac671ec1a8ed9a402221bf168dc5ba31d`. Hash do trecho de `## Problema e contexto` até a seção `## Próximo passo`: `a71f7c9aa0aba5ec1e3299a161379937e35661d3e16f60e9c47674662831f612`. Hash das rodadas 1 a 3 e respostas, até a seção `## Pós-mortem` na origem: `5affd3582c1ad80c34a75afadbfe0efb929f4628d2c1bc45e20a41998800cf55`. Os limites são títulos de seção em linhas próprias, excluindo o título final.
- **Template e autoridades:** relidos `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, `.agent/workflows/revisar_plano.md`, `.agent/templates/plano_implementacao.md` e KB-003. Conferidos a `v4` inteira, sua diferença de escopo/desenho em relação à `v3`, a resposta do autor, KB-004 (consolidação e patrimônio), os trechos de fechamento/reabertura da carteira e a carga atômica de valores/cobertura. As demais decisões e autoridades examinadas nas rodadas anteriores permanecem aplicáveis.

#### Conferência do achado pendente

| Achado | Resultado da conferência da `v4` |
| :-- | :-- |
| R3-1 | **Atendido no plano.** D13 define a composição inteira da tela como unidade de coerência, incluindo carteira e benchmarks, determinação de M e tabelas de uma página. As marcas envolvem a primeira e a última leitura do conjunto; a cobertura usada é a conferida; uma alteração descarta todos os insumos e repete a composição, com até três tentativas. A estratégia e o aceite do item A incluem alteração entre consolidados e posições/eventos e entre cobertura e valores, além das alterações entre páginas |

#### Achados e ressalvas

- **Bloqueadores novos:** nenhum identificado.
- **Ressalvas novas:** nenhuma identificada.
- **Achados anteriores pendentes:** nenhum. R1-1/R2-1 estão cobertos pelas ordens reais e leitura completa; R1-3/R2-3, pela separação dos relógios e isolamento dos cenários; R2-2/R3-1, pela validação da composição inteira. Os demais achados e ressalvas foram atendidos nas rodadas anteriores, sem regressão identificada nesta correção.

#### Itens atendidos e validações

- A diferença da `v4` limita-se à fronteira de coerência, aos testes e ao aceite correspondentes, ao risco já declarado e aos registros da correção. Não acrescenta migração, função de banco, pacote ou decisão financeira.
- A gravação conjunta de posições/consolidado e de valores/cobertura, conferida no schema, é compatível com os insumos relacionados que D13 manda validar. As conferências por tabela ficam como defesa adicional, sem substituir a da composição.
- Objetivo, escopo positivo/negativo, sequência A → F, critérios de aceite e pontos de aprovação continuam compatíveis com o nível completo, G1/G2/G3, G4 sem migrações e modo contínuo ausente. Revisão, aprovação humana, autorização de implementação e merges permanecem distintos.
- Continuam exigidos, nas entregas: os testes de aplicação/banco/ponta a ponta e acessibilidade, os cenários determinísticos de coerência, a medição de desempenho de D9 e a validação independente/humana dos novos CR-51/CR-52 antes do merge D. São critérios futuros de implementação previstos no plano, não resultados executados nesta revisão.
- Gates documentais desta rodada: Node.js `v24.15.0`; 39/39 testes de governança passaram, com `TEMP`/`TMP` em `local/review-cycle-004-temp/`; validador com 0 erros/avisos; `git diff --check` limpo. A conferência final valida por SHA-256 o escopo, o histórico e os outros artefatos preservados e a reconstrução da origem ao desfazer somente revisão formal/veredito, próximo passo e esta rodada; verifica também o whitespace do plano ainda não versionado.

**Veredito: `APTO PARA APROVAÇÃO`.** R3-1 foi atendido e não há bloqueadores ou ressalvas em aberto identificados nesta revisão. A revisão formal fica `Concluída`; o plano `v4` permanece `Em Revisão`, o ciclo em `Planejamento` e a aprovação humana pós-revisão `Pendente`. A manifestação humana posterior a este parecer é o próximo ponto de aprovação. Nenhuma implementação, criação de issue, publicação ou promoção do plano é realizada por este workflow.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 004 + revisar_plano + 004_plan/rodada-4 + v4`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `Planejamento`; plano `v4` em `Em Revisão`; revisão `Em andamento`; veredito anterior `REQUER NOVA RODADA`; aprovação `Pendente`; próximo passo `Aguardando revisão (rodada 4)`.
- `state_after`: ciclo `Planejamento`; plano `v4` em `Em Revisão`; revisão `Concluída`; veredito `APTO PARA APROVAÇÃO`; aprovação `Pendente`; próximo passo `Aguardando aprovação do plano`.
- `result`: `executed`
- `evidence`: solicitação humana de 2026-10-14; esta rodada, campos de revisão/veredito e próximo passo; resposta e correção de R3-1; hashes da origem e dos trechos preservados; autoridades, schema e gates documentais conferidos. O handoff da correção para `v4` permanece histórico; este é o resultado corrente da revisão.
- `blockers`: nenhum achado de revisão em aberto. A aprovação humana posterior ao parecer ainda é necessária para promover o plano.

## Pós-mortem

- **Data de conclusão:** —
- **Desvios:** —
- **Lições comprovadas:** —
