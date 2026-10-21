# Plano de Implementação — Novidades, privacidade, tela de ativos e distribuição patrimonial

> **Ciclo:** `010`
> **Status:** `Em Execução`
> **Versão:** `v2`
> **Data de criação:** 2026-10-21
> **Última atualização:** 2026-10-21
> **Tipo:** `feature`
> **Prioridade:** `P2`
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 010" em 2026-10-21
> **Autorização do rascunho:** "autorizo o rascunho do plano do ciclo 010" em 2026-10-21
> **Autorização da correção:** "corrija o plano do ciclo 010" em 2026-10-21 (achados R1-1 a R1-8)
> **Modo contínuo:** `—`
> **Revisão formal:** `Concluída` (rodada 2 sobre a `v2`)
> **Veredito da revisão:** `APTO COM RESSALVAS`
> **Aprovação humana pós-revisão:** `Aprovada em 2026-10-21`
> **handoff_schema_version:** `2`

## Problema e contexto

Ideação: `_project/ideations/010_novidades_privacidade_ativos_distribuicao.md`.

## Objetivo

Entregar páginas públicas de privacidade e termos, preparar a publicação OAuth pelo responsável, apresentar versão e novidades em linguagem simples, reorganizar o cadastro e a consulta de ativos e substituir a distribuição em barras por uma rosca acessível. A distribuição representa 100,00% dos saldos positivos do último mês fechado; posições negativas continuam explícitas, fora das fatias.

## Origem no backlog

Snapshot herdado da seleção de 2026-10-21: fila lida da `main`, revisão `5cf019089f4465e5e85fa6661966d856fec09922`; worktree `saldo-futuro-backlog` então `prunable`, sem lote local pendente. Último commit da fila: `49a1332c8bc869d3b8dd148baf387de869288307` (PR #102), publicado em `main`.

| ID | Síntese da necessidade | Parcela selecionada |
| :-- | :-- | :-- |
| BL-005 | Visualização de alocação por ativo em rosca SVG no servidor, com legenda estruturada (cor, nome completo, percentual e valor) e detalhamento retrátil dos ativos menores | Integral |
| BL-006 | Tela de ativos com botão "Novo ativo" no topo, cadastro em rota dedicada (`/ativos/novo`) e abas "Em uso" e "Desativados" com contadores e lista densa no celular | Integral |
| BL-011 | Tela `/novidades`, acessível a todos os perfis, com a versão corrente e notas de lançamento em linguagem não técnica | Integral |
| BL-012 | Rotas públicas `/privacidade` e `/termos`, linkadas no login e nos menus, para publicar a tela de consentimento OAuth do Google | Integral |

Referência: `_project/backlog.md` no commit da fila acima. O detalhamento de Q9 fixa os links autenticados em Conta, acessível pelo menu. Destino em preparação; nenhum item do backlog é alterado neste rascunho. Os IDs já existem em `main`. O retorno na fila só ocorre após integração comprovada do destino, por referência estável `ciclo 010`, e sua publicação continua separada.

## Contexto e baseline

- Inspeção de 2026-10-21 em `EuThiagoAndrade/saldo-futuro`, HEAD `5cf019089f4465e5e85fa6661966d856fec09922`, branch local `main`. `git ls-remote origin refs/heads/main` confirmou o mesmo SHA; `gh pr list --state open` não encontrou PR aberta.
- Alterações locais preexistentes: `_project/cycles.md` com a reserva de `010`, e ideação `010` ainda não versionada. Preservadas; não há branch documental, commit, issue ou PR deste plano.
- `package.json`: `0.6.0`. Release-alvo do ciclo: `0.7.0`, pelo release-please existente; o plano não altera versão manualmente nem modifica a automação.
- Distribuição: `src/app/(app)/page.tsx` filtra posições não zero do último mês fechado, ordena e agrupa cinco maiores mais Outros antes de chamar `GraficoDistribuicao`. O componente em `src/components/graficos/graficos.tsx` desenha barras relativas à maior posição, trunca nomes e só apresenta dinheiro na tabela equivalente.
- Ativos: cadastro embutido em `/ativos`; `criarAtivo` usa sessão e RPC existente, revalida o layout e devolve sucesso. Testes em `tests/e2e/carteira.spec.ts` dependem desse fluxo e devem acompanhar a mudança.
- Navegação: quatro destinos principais e Mais; destinos secundários no menu lateral. Conta exige sessão. `/entrar` é pública, mas hoje retorna apenas `PreviewNotice` quando não há backend e, com backend, apresenta logo e formulário, sem descrição do produto.
- ADR-005 define quatro tipos de SVG no servidor. DESIGN.md limita a seis cores, reserva `chart-5` a Outros e não tem contrato de abas. KB-004 define percentuais gerais em float64 e arredondamento individual; participação por maior resto será uma exceção explícita de apresentação, sem mudar rentabilidade.
- Não foram lidos `local/`, dados financeiros reais, sessões de produção nem o console do Google. A configuração efetiva de escopos do provedor em produção não foi verificada.

### Pesquisa Google — leitura em 2026-10-21

O [guia de verificação](https://support.google.com/cloud/answer/13464321?hl=en) exige identificação do app, descrição funcional e link da política na página inicial; uma tela composta somente de login é insuficiente. As [políticas OAuth](https://developers.google.com/identity/protocols/oauth2/policies) também pedem página pública em domínio verificado e links para política e termos. Por isso `/entrar` é candidata após receber uma descrição clara do produto e os links, inclusive sem backend. A aceitação concreta é conferida pelo responsável no console; não se presume que o redirecionamento de `/` seja suficiente.

Há uma correção factual à premissa da ideação/KB-002: [Manage App Audience](https://support.google.com/cloud/answer/15549945?hl=en) documenta exceção à lista de teste e à expiração de sete dias para pedidos limitados a identidade básica/Sign in with Google. Publicar Audience e verificar Branding são etapas diferentes. O roteiro deve conferir escopos efetivos e exigências do projeto, sem prometer que apenas publicar as páginas eliminará uma restrição. Essa descoberta não altera a decisão humana de entregar as páginas e preparar a publicação.

## Escopo

### Dentro do escopo

- Uma issue por item, nesta ordem: BL-012, BL-011, BL-006 e BL-005.
- Textos públicos redigidos a partir de fatos verificáveis, revisados pelo responsável antes do merge, e roteiro para a ação externa OAuth.
- `/novidades` autenticada, para `admin` e `user`, com versão de `package.json` e notas manuais a partir de `0.7.0`.
- Cadastro em `/ativos/novo`, retorno para `/ativos`, abas por URL e listas densas.
- Percentuais exatos de participação por maior resto, rosca SVG no servidor, legenda completa, negativos listados e Outros retrátil.
- Emendas do ADR-005, DESIGN.md e KBs necessárias às entregas; documentação viva e encerramento prospectivo em PR própria.

### Fora do escopo

- Mudar eventos, saldos, fechamento, patrimônio líquido, Dietz, benchmarks, RLS, schema, papéis, autorização de e-mails ou escopos OAuth.
- Novo provedor, biblioteca de gráficos, dependência, JavaScript da rosca ou estado cliente para as abas.
- Redigir histórico anterior a `0.7.0`, gerar notas do changelog técnico, criar regra de processo para notas ou teste que obrigue uma nota por versão.
- Linkar o changelog do repositório privado na interface; mexer no release-please ou em seus workflows.
- Executar ação no Google Cloud/Search Console, aceitar termos externos ou emitir parecer jurídico.
- Outros itens do backlog, reativação de ativos, busca/paginação novas ou reformulação geral da navegação.

## Decisões e autoridades

Em 2026-10-21 o responsável declarou: "Aceito as suas sugestões para os itens Q1 a Q11" e autorizou este rascunho. Estas são decisões para o planejamento; a aprovação do plano permanece pendente de revisão formal.

| Pergunta | Decisão aceita |
| :-- | :-- |
| Q1 | Maior resto, duas casas, com inteiros sobre centavos. Empate: maior saldo, depois nome. Legenda e tabela usam os mesmos percentuais. |
| Q2 | Só saldos positivos entram nas fatias e no denominador. Negativos ficam na legenda sem percentual/fatia. Em trânsito aparece só com saldo diferente de zero, aplicando o mesmo tratamento pelo sinal. |
| Q3 | Cinco maiores positivos mais Outros; Outros abre lista nativa retrátil com nome completo, percentual e valor de todos os componentes. |
| Q4 | Ocultar valores esconde somente dinheiro, inclusive na tabela e textos acessíveis; percentuais continuam visíveis. |
| Q5 | Emendar ADR-005 e DESIGN.md; preservar SVG próprio no servidor sem JavaScript. |
| Q6 | Abas lidas no servidor pela URL (`?aba=desativados`); cadastro em `/ativos/novo` redireciona para `/ativos`, sem mensagem extra. |
| Q7 | Arquivo manual, histórico começa na release `0.7.0`. Agente redige e responsável revisa; sem obrigação automatizada de nota por release. |
| Q8 | Agente redige os textos a partir do código e KB-002; responsável revisa antes do merge. Nome e e-mail públicos fornecidos e autorizados na conversa de 2026-10-21, referidos neste plano como "contato de Q8". |
| Q9 | Páginas legais estáticas aparecem em previews sem backend. Links em `/entrar` e Conta e links cruzados entre as páginas; nenhum novo destino legal na navegação principal. |
| Q10 | `/entrar` candidata a página inicial; documentação Google conferida neste plano e console conferido pelo responsável na ação externa. **Substituída em 2026-10-21** pela decisão registrada em "Registro de execução": página inicial informada ao Google é `/termos`. |
| Q11 | Uma issue por item na ordem BL-012 → BL-011 → BL-006 → BL-005. |

O contato de Q8 foi fornecido em resposta à pergunta expressa sobre publicação em 2026-10-21. Para limitar sua repetição, os valores literais aparecem somente no código das páginas públicas, cuja publicação foi autorizada; plano, KBs, payloads, issues, descrições de PR e tasks usam "contato de Q8". A revisão do diff das páginas inclui sua presença no código-fonte versionado, tratado como público pela ADR-003. Não ampliar a autorização para e-mails de contas, credenciais ou outros dados privados. Os valores não são inferidos de credenciais nem da lista de acessos.

**Propostas adicionais da v2, ainda sem decisão humana:** o item 4 apresenta alternativas de nível do rateio e desempate completo (R1-2); a sequência propõe executar a ação externa após as quatro entregas, em vez de simultaneamente a elas (R1-1). Após veredito apto, a aprovação do plano deverá decidir expressamente essas propostas. A aceitação anterior de Q1–Q11 não é usada para inferir essas escolhas.

Autoridades: `.agent/ai_behavior.md`, `_project/README.md`, ADR-002/003/005, KB-002/003/004 e DESIGN.md. Regras duradouras são atualizadas na autoridade correspondente durante a entrega; este rascunho não as emenda antecipadamente.

### Pontos de aprovação

| Ponto | Precondição | Cobre | Não cobre | Conferir |
| :-- | :-- | :-- | :-- | :-- |
| Autorizar rascunho — recebida | Ideação existente e Q1–Q11 aceitas | Este plano e índice coerente | Revisão formal, implementação ou publicação | Ideação, decisões acima e autorização do cabeçalho |
| Aprovar plano — "aprovo o plano do ciclo 010" | Veredito apto e manifestação humana posterior, com decisão expressa sobre as propostas adicionais da v2 | Publicar PR documental; criar issues após sua integração e apresentação/confirmação do payload; encerramento ao final | Merges, implementação, console ou produção | Revisão crítica; alternativas G1 de nível do rateio e desempate completo no item 4; calendário da ação externa após as quatro entregas; roteiro externo |
| Aprovar merge documental — "aprovo o merge da PR #N" | PR do plano com checks verdes | Integrar aquela PR | Demais PRs e execução das issues | Diff, checks, decisões, origem publicada |
| Autorizar implementação — "autorizo a implementação da issue #N" | Plano aprovado e integrado, issue real correspondente | Branch, task, código, testes e PR daquela entrega | Outra issue, merge ou console | Payload confirmado, escopo, barreiras e pré-requisitos |
| Aprovar merge de cada entrega — "aprovo o merge da PR #N" | Validações concluídas e checks verdes | Somente o merge nomeado | Próxima implementação, console ou acesso a produção | Task, critérios, diff, auditoria visual e evidências; no item 1, revisão humana da redação, inventário factual e contato de Q8 no código público, registrada na task com data e síntese da manifestação antes de publicar a PR, ou no registro levado à PR de encerramento se ocorrer após a publicação |
| Ação humana externa — "concluí a ação externa da issue #N" | Quatro entregas integradas e páginas disponíveis no domínio; situação Aguardando ação externa vinculada à issue BL-012 | Responsável confere/configura console conforme roteiro e relata resultado real | Agente operar console, mudar escopos, contratar domínio de Auth ou ampliar acesso no app | URLs, domínios da homepage e callback, escopos, Audience publicada e login fora da lista de teste; Branding opcional, resultado sanitizado |
| Verificar produção — "autorizo a verificação em produção do ciclo 010" | Entregas integradas, deploy correspondente, ação externa relatada | Conferência pública somente leitura pelo agente e roteiro autenticado pelo responsável | Operações financeiras, copiar dados reais ou alterar console | Roteiro da sequência; limitações explícitas da evidência |
| Aprovar merge da release — "aprovo o merge da PR #N" | PR real do release-please, versão-alvo conferida, checks verdes via dispatch se necessário | Release nomeada | Mudança de automação ou encerramento implícito | `package.json`, changelog técnico e notas manuais revisadas |
| Aprovar merge do encerramento — "aprovo o merge da PR #N" | Entregas, ação externa, produção e release comprovadas | Integração da consolidação documental prospectiva | Novas funcionalidades ou publicação do retorno do backlog | KBs, plano/tasks, ciclos e checks |

Cada merge tem aprovação própria. A cadeia para por falta de autorização, conflito, privacidade incerta, nova regra financeira, escopo ampliado, precondição não verificável ou checks falhos. O ciclo completo não usa modo contínuo. A v2 propõe o fluxo canônico: quatro issues de código em sequência, depois uma única situação Aguardando ação externa da issue BL-012. Não há despacho paralelo nem ação externa iniciada após o item 1. Audience publicada e login autorizado fora da lista de teste são o resultado mínimo externo; sem sua prova, não declarar BL-012 concluído nem encerrar. Branding opcional pendente, isoladamente, não impede esse resultado, desde que o console permita o fluxo mínimo; exigência que o impeça leva a Parado para decisão.

## Barreiras de domínio

| Barreira | Aplica-se? | Como o ciclo a atende ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim, BL-005 | KB-004 e casos independentes antes do código; centavos e maior resto em bigint, total 10.000 unidades de 0,01 p.p.; testes de negativos, agrupamento e faixa. Outros itens não criam cálculo financeiro. |
| G2 — isolamento por RLS | Não há mudança de RLS, autenticação ou autorização | Páginas legais não leem dados; demais páginas mantêm `exigirSessao`, leituras e RPCs existentes. Novo caminho de cadastro preserva proteção. Rodar regressões de banco/autenticação; qualquer mudança nessas regras exige parar e revisar o escopo. |
| G3 — privacidade de dados | Sim, todo o ciclo | Fixtures e capturas só fictícias. Não ler dados reais. Contato de Q8 é publicação expressamente autorizada; não incluir outros e-mails ou contas em evidências. Preferência monetária aplicada no servidor. |
| G4 — migrações só acrescentam | Não se aplica à entrega prevista | Nenhuma migração/schema prevista; CI mantém controle aditivo. Necessidade nova de banco exige revisão do escopo antes de mudar. |

## Estratégia de testes

**Rascunho documental:** `node --test scripts/validate-governance.test.mjs`, `node scripts/validate-governance.mjs`, `git diff --check` e `git status --short`. Conferir links/estados e G3 manualmente. Estes gates não equivalem à revisão formal.

**Cada PR de aplicação:** `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:e2e` sem backend. Para fluxos autenticados dos quatro itens, executar também `npx supabase start`, `npx supabase test db`, build com ambiente local e e2e autenticado conforme README.md. Não usar produção nos testes. CI de aplicação e governança verde antes de qualquer merge.

**Encerramento:** além dos gates documentais, a PR de encerramento altera `src/lib/novidades.ts` para registrar a data real da release. Ela executa os mesmos gates de aplicação acima, inclusive build e e2e com e sem backend; o nome documental da PR não a dispensa dessas verificações. Não alterar manualmente a PR do release-please para inserir notas/data.

**Verificação focal:**

- BL-012: `/privacidade` e `/termos` respondem 200 sem sessão, com e sem backend; links e descrição em `/entrar` permanecem com preview sem backend; nenhum pedido de dados nessas páginas. Conta linka ambas. Testar acesso por teclado, links cruzados e WCAG 2.2 AA com axe.
- BL-011: usuário comum e admin veem `/novidades` e destino em Mais/menu lateral; sem sessão segue proteção existente. Versão confere com `package.json`; notas são humanas, ordenadas e não atribuem entrega futura à versão corrente. Ausência de nota de uma versão é aceita, inclusive nos testes. Sem backend a rota autenticada preserva `PreviewNotice`.
- BL-006: entrar pela lista, abrir novo cadastro, validar erros, salvar e voltar a `/ativos` vendo o novo ativo sem mensagem extra. URL direta, recarga e voltar/avançar mantêm aba; parâmetro inválido assume Em uso. Contagens, vazios, desativação e proibição de desativar trânsito/saldo não zero mantidos. Adaptar auxiliares e cenários existentes que usam o cadastro embutido.
- BL-005: fixtures G1 com esperados literais independentes da função; soma dos percentuais positivos = 10.000, Outros = componentes e invariância ao reordenar entradas. Renderização SSR confere legenda/tabela, negativos e ausência de dinheiro em texto, título, descrição e atributos quando oculto. Teste visual de fatias proporcionais, círculo único, nomes de 100 caracteres, componentes de Outros e zero positivos.
- Interfaces alteradas: 360 px CSS úteis, janela de 375 px (considerando barra clássica) e desktop de 1280 px; sem rolagem horizontal da página, foco visível, toque de 44 px e algarismos tabulares. Legendas usam quebra de linha; lista densa mantém nomes e ações legíveis. Auditoria pelo contrato `design-system/DESIGN.md` e `.agent/skills/design-system-check/design-system-check.md` antes de publicar as PRs.
- Listas de rotas de `tests/e2e/navegacao.spec.ts` e `tests/e2e/botoes.spec.ts`: ampliar para `/ativos/novo`, `/novidades`, `/privacidade` e `/termos` nas PRs que as introduzem. Separar visita pública e autenticada quando necessário; páginas legais sem botões continuam verificadas por links/foco/acessibilidade, sem inventar botões só para o teste. Manter varredura dos estados de todos os botões efetivamente presentes, inclusive no formulário novo e nos controles de navegação autenticados.
- `tests/e2e/navegacao-desempenho.spec.ts`: na PR BL-006, substituir o sinal de prontidão de `/ativos` (formulário embutido) por lista/estado vazio da aba renderizada e atualizar essa descrição em `tests/e2e/apoio/MEDICAO.md`; validar compatibilidade pelo piloto existente (`MEDICAO_PILOTO=1`, comando dedicado desse documento). Na PR BL-005, delimitar a consulta à tabela de detalhe de posições para não confundir resumo e componentes; rodar a prova D13 existente com `MEDIR_NAVEGACAO=1` e `MEDICAO_D13=1` conforme o mesmo documento. Ambiente sempre local; registrar resultados, sem rodar a baseline completa, ampliar o ensaio para novas rotas ou iniciar campanha de desempenho.

## Itens de implementação

### Item 1 — BL-012: privacidade, termos e preparação OAuth

**Contexto:** faltam páginas legais públicas e uma página inicial com descrição funcional. A documentação operacional trata a lista de teste como obrigação geral, sem registrar a exceção de identidade básica.

**Ação técnica:** criar `src/app/privacidade/page.tsx` e `src/app/termos/page.tsx` fora de `(app)`, estáticas, com metadata, estrutura semântica, leitura confortável, data de atualização e links cruzados. Usar tokens e marca existentes. Em `/entrar`, manter apresentação do produto e links fora da condição de backend; com backend, renderizar o login atual; sem ele, manter o aviso e não habilitar login. Incluir links na página Conta, acessível pelo menu, sem novos destinos legais em `navegacao.tsx`.

Redigir privacidade descrevendo identidade básica Google efetivamente tratada, lista de acesso, dados financeiros informados, finalidades, armazenamento, compartilhamento operacional, cookies de sessão e preferência, segurança e canal para solicitações. Conferir fatos no código; não afirmar prazo de exclusão/retenção, residência de dados ou garantias que não tenham evidência/decisão. Identificar o controlador e o contato de Q8 somente no código das páginas. Redigir termos sobre finalidade do sistema, acesso autorizado, responsabilidade pelos registros, funcionamento/limitações e contato, sem inventar promessas operacionais ou aconselhamento financeiro. Decisões materiais que o código não resolva voltam ao responsável antes de finalizar o texto.

Atualizar KB-002 (armadilha 7, GC2, GC4, P2 e verificações relacionadas) com condição por status/escopos e roteiro abaixo. Preservar fatos históricos e identificar a origem da revisão no ciclo 010. Descrever capacidades em KB-003; consolidar seu estado final no encerramento.

**Critérios de aceite:**

- [ ] Duas rotas públicas completas, sem sessão/backend, com links cruzados e sem placeholders.
- [ ] `/entrar` descreve gestão e acompanhamento de investimentos pessoais e a restrição de acesso; links visíveis com e sem backend, preservando a segurança do login. **Substituído em 2026-10-21** (ver "Registro de execução"): `/entrar` só com logo e login centralizados e os links, com e sem backend; `/termos` identifica o app, descreve a funcionalidade e leva à política, como página inicial informada ao Google.
- [ ] Conta oferece os dois links; navegação principal mantém seus destinos.
- [ ] Redação factual e contato de Q8 no código público revisados expressamente pelo responsável antes do merge; evidência com data e síntese na task, sem repetir os valores, conforme o ponto de aprovar merge da entrega.
- [ ] KB-002 distingue Audience, Branding e exceção de identidade básica, com fontes oficiais e roteiro executável pelo responsável.
- [ ] E2e público/preview, proteção regressiva e acessibilidade passam; nenhuma credencial ou conta real nas evidências.
- [ ] Para concluir a issue BL-012, após as quatro entregas: Audience publicada e login de conta autorizada no app fora da lista de teste Google comprovados pelo responsável. Branding é opcional; limitação ou impedimento do resultado mínimo exige decisão, sem marcar conclusão fictícia.

**Roteiro da ação externa, após integrar e disponibilizar as quatro entregas:**

1. Responsável abre anonimamente `https://investimentos.euthiagoandrade.com.br/entrar`, `/privacidade` e `/termos`; confere produto, texto e links. (Desde 2026-10-21, a página inicial a informar no passo 3 é `/termos`; ver "Registro de execução" e KB-002, O3.) O agente só faz conferência pública após autorização de produção.
2. No Google Auth Platform, conferir projeto, escopos configurados e efetivamente solicitados pelo Supabase. Registrar apenas categorias/resultado. Se houver escopo além de identidade básica, interromper esse passo e decidir o novo escopo, sem removê-lo ou ampliá-lo por inferência.
3. Conferir domínio próprio e sua propriedade no Search Console com conta adequada ao projeto; preencher homepage candidata `/entrar`, política e termos no mesmo domínio. Distinguir essas URLs do callback Google→Supabase (`https://<project-id>.supabase.co/auth/v1/callback`, KB-002 GC3) e do retorno Supabase→app (`/auth/callback`). O [guia Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google) documenta o callback do projeto e trata domínio próprio/Branding como melhorias opcionais. Não tentar provar propriedade de `supabase.co`, alterar callback ou contratar domínio próprio de Auth neste ciclo. Se o Google exigir essa propriedade, registrar motivo sanitizado: se a exigência bloquear o resultado mínimo, a situação é Parado para decisão; se afetar só Branding opcional, registrar a limitação sem impedir o resultado mínimo. Nenhum ID, credencial ou e-mail de conta entra nas evidências.
4. Separar o resultado mínimo — publicar Audience — de Branding opcional. Conferir o estado real e publicar o aplicativo quando permitido, sem exigir a marca verificada como condição adicional deste ciclo. Registrar Branding como não solicitado, pendente ou publicado, sem prometer aprovação. Se `/entrar` for recusada ou outra exigência impedir o resultado mínimo, parar para decisão antes de implementar alternativa. Não iniciar nova dependência/custo nem uma mudança de autenticação por inferência.
5. Com Audience publicada, o responsável confere obrigatoriamente login de conta já autorizada no app que esteja fora da lista de teste Google, além da recusa por parte da lista do app. A primeira conferência prova o benefício de dispensar cadastro duplicado; relatar somente passou/falhou e limitações. Se faltar conta/capacidade para provar, manter o critério pendente e pedir decisão, sem substituir pela CI nem encerrar como concluído. Não adicionar contas nem alterar listas automaticamente.
6. Declarar "concluí a ação externa da issue #N" com o estado real de Audience/Branding e os resultados sanitizados. Essa frase não transforma pendência em prova: sem o resultado mínimo, a situação passa a Parado para decisão. O agente confere somente o acessível por leitura; console e fluxo autenticado são evidência declarada pelo responsável. A task da última issue continua como artefato ativo para a transição à verificação em produção; reconciliação da task BL-012, resultado externo e atualização factual da KB-002 entram na PR de encerramento, que fecha a issue BL-012.

### Item 2 — BL-011: versão e novidades

**Contexto:** versão não aparece para a pessoa e o changelog técnico do repositório privado não atende à leitura do produto.

**Ação técnica:** criar `/novidades` no grupo `(app)` com sessão, título, versão corrente lida no servidor de `package.json` e histórico manual em `src/lib/novidades.ts` (versão, data civil de publicação ou `null` enquanto não comprovada e notas). Adicionar Novidades aos destinos de Mais e menu lateral, para ambos os perfis, com ícone do conjunto existente ou SVG do mesmo padrão. Atualizar o contrato de navegação do DESIGN.md.

O histórico começa em `0.7.0`. Durante o intervalo em que `package.json` ainda é `0.6.0`, o cabeçalho mostra `0.6.0`; a entrada `0.7.0` fica oculta. Sem entradas publicadas, mostrar texto simples de histórico ainda indisponível. Renderizar somente entradas cuja versão já tenha sido lançada no build; notas ausentes não causam erro. Após a release `0.7.0`, mostrar suas notas mesmo com data `null`, usando "Data de publicação em confirmação". A data civil real, em America/Cuiaba, vem da publicação da release GitHub/tag comprovada depois do merge; preenchê-la em `src/lib/novidades.ts` na PR de encerramento e então exibir a data formatada. Não usar data de rascunho, de build ou previsão. Essa conferência é do ciclo, sem obrigação nova de nota por versão.

**Destino das notas por PR:** a PR BL-011 cria a entrada `0.7.0` e escreve as notas de BL-012 já integrado e do próprio BL-011; a PR BL-006 acrescenta sua nota; a PR BL-005 acrescenta a sua. Cada nota é revisada no respectivo diff e só integra junto com o comportamento descrito. Se uma entrega mudar ou for revertida, atualizar sua nota na mesma PR da mudança. A preparação da release apenas confere as notas já integradas, sem editar a PR automatizada. O encerramento atualiza a data real e eventuais correções factuais com gates de aplicação.

**Critérios de aceite:**

- [ ] Admin e user acessam a página e encontram Novidades em Mais/menu lateral, com indicação de destino ativo.
- [ ] Versão vem do `package.json`; nenhuma versão anterior ganha histórico reescrito.
- [ ] Notas do ciclo em linguagem simples, sem hashes/IDs técnicos na interface, revisadas pelo responsável e exibidas como publicadas somente quando verdadeiro.
- [ ] Nenhum link ao changelog privado e nenhum teste/CI exige entrada para toda versão.
- [ ] Transição testada: em `0.6.0` a entrada futura não aparece; em `0.7.0` as notas aparecem e data `null` mostra "Data de publicação em confirmação"; após encerramento a página exibe a data comprovada. Nenhum teste exige nota para toda versão.

### Item 3 — BL-006: lista de ativos e cadastro separado

**Contexto:** formulário entre listas e desativados alongam a tela, especialmente no celular.

**Ação técnica:** cabeçalho `/ativos` com ação principal Novo ativo; rota autenticada `/ativos/novo` reutiliza formulário e validações. Após RPC bem-sucedida e revalidação, `criarAtivo` redireciona para `/ativos`; tratar erro antes do redirect, sem capturá-lo como falha. Remover reset/sucesso que dependam do cadastro embutido apenas onde ficarem obsoletos.

Em `/ativos`, ler `searchParams` no servidor: ausência, `em-uso` ou valor inválido seleciona Em uso; `desativados` seleciona Desativados. Links `/ativos` e `/ativos?aba=desativados` em navegação rotulada, com `aria-current="page"`, contadores dos conjuntos já lidos e somente a lista selecionada renderizada. Não usar papéis `tab` com comportamento de teclado incompleto: são links de navegação apresentados visualmente como abas. Recarregar/voltar preserva a seleção pela URL. Trânsito continua ativo de sistema sem ação de desativar e participa da contagem Em uso como hoje participa da lista.

Atualizar DESIGN.md com abas por navegação e exceção de lista densa móvel em Ativos: nome completo com quebra, tipo/metadados em segunda linha e ação legível de pelo menos 44 px; desktop mantém tabela. Desativados mostram nome e data como hoje, sem ação nova. Estados vazios específicos por aba.

**Critérios de aceite:**

- [ ] Novo ativo está no topo; formulário só em `/ativos/novo`, protegido por sessão, com caminho de volta à lista.
- [ ] Erros mantêm formulário; sucesso volta a `/ativos` e o ativo aparece sem mensagem adicional.
- [ ] Abas por URL, contadores e lista selecionada funcionam por acesso direto e histórico do navegador.
- [ ] Lista densa legível no celular, sem truncar nomes nem diminuir área de toque; desktop e vazios corretos.
- [ ] Validações/RPC/isolamento e confirmação de desativação existentes preservados; e2e antigo adaptado.

### Item 4 — BL-005: distribuição positiva em rosca e legenda completa

**Contexto:** barras não representam o todo; faltam participação e acesso aos componentes de Outros. A nova regra é só de alocação/apresentação do último mês fechado.

**Ação técnica:** extrair composição em `src/lib/financeiro/distribuicao.ts`, testada com fixtures, e separar geometria/renderização em `src/components/graficos/`. Emendar ADR-005 para acrescentar a rosca como quinto tipo e DESIGN.md para seu contrato. Atualizar KB-004 com a regra e exceção às razões gerais em float64 e ao arredondamento individual da seção 2. A mudança não altera percentuais de retorno, saldos ou patrimônio líquido.

**Alternativas financeiras adicionais — propostas, pendentes de decisão humana na aprovação do plano (R1-2):** Q1 fixou maior resto e Q3 fixou cinco mais Outros; não fixaram o nível do rateio nem o desempate quando nome e saldo também são iguais.

| Escolha de nível | Exemplo independente: A a G, 100 centavos cada, S=700, cinco principais A–E | Efeito |
| :-- | :-- | :-- |
| A — rateio global por ativo, depois agrupar (recomendação) | Cada piso é 1428, resto 400; sobram 4 para A–D: A–D 14,29%, E–G 14,28%; Outros(F,G)=28,56% | Cada ativo difere menos de 0,01 p.p. da participação exata; grupo é soma de componentes sem segundo rateio. O erro agregado de Outros pode aproximar 0,05 p.p., oposto à soma dos erros dos cinco principais. |
| B — rateio por fatia, depois pelos componentes de Outros | A–E: piso 1428 e resto 400; Outros: piso 2857 e resto 100; sobram 3 para A–C. A–C 14,29%, D–E 14,28%, Outros 28,57%; dentro dele, pisos F/G=1428 e sobra 1 para F: F 14,29%, G 14,28% | Cada fatia desenhada difere menos de 0,01 p.p. do exato; requer segundo rateio. Nos componentes, manter pisos de `v*10000/S` e distribuir só até o total inteiro atribuído ao grupo, por maior resto e os mesmos desempates; percentuais continuam sobre S. |

Recomenda-se A pela leitura consistente de cada ativo na legenda/tabela e pelo agrupamento por soma. A alternativa B prioriza a precisão do grupo desenhado. Ambas somam 100,00%; a preferência é do responsável, não dedutível de Q1/Q3.

| Desempate completo | Exemplo com três posições de mesmo nome e saldo de 1 centavo | Efeito |
| :-- | :-- | :-- |
| ID canônico crescente (recomendação) | UUIDs fictícios `00000000-0000-4000-8000-000000000001`, `00000000-0000-4000-8000-000000000002` e `00000000-0000-4000-8000-000000000003`: a primeira posição recebe 3334 unidades; as demais 3333 | Determinístico mesmo com entrada reordenada. Comparar UUID em texto canônico minúsculo, com hífens, pela ordem lexicográfica de caracteres, sem locale. |
| Ordem de entrada | Com a ordem 003, 001, 002, a posição 003 recebe 3334 e as demais 3333 | Evita terceiro critério por ID, mas o ativo que ganha 0,01 p.p. muda se a entrada mudar. Não recomendado. |

A especificação e os casos abaixo são condicionais à proposta A + ID canônico crescente. Após veredito apto, pedir que o responsável confirme essas duas escolhas ao aprovar o plano; registrar a manifestação antes de atualizar KB/fixtures ou autorizar BL-005. Se preferir outra combinação, corrigir a especificação e os esperados e submetê-los à revisão antes de implementar. A correção v2 não decide essas regras.

**Especificação proposta para executar Q1–Q4, a conferir na revisão formal:**

1. Usar todas as posições do último mês fechado, com nomes exibidos e ID estável; excluir saldos zero. Validar centavos na fronteira e converter para bigint. Na proposta, positivos são ordenados por saldo decrescente, nome pt-BR crescente e, só em igualdade completa, UUID canônico minúsculo crescente, comparado como texto lexicográfico sem locale, para estabilidade de nomes duplicados.
2. Seja `S` a soma exata dos positivos. Se `S > 0`, para cada positivo `v`, calcular `q = (v * 10000n) / S` e resto `r = (v * 10000n) % S`. Distribuir `10000n - soma(q)` unidades, uma para cada maior resto; empates por saldo decrescente, nome e ID como acima. Cada unidade vale 0,01 ponto percentual. Não multiplicar dinheiro ou arredondar a divisão em ponto flutuante.
3. Distribuir uma única vez entre todos os ativos positivos, **antes** de agrupar. Os cinco primeiros formam fatias individuais; o restante vira Outros. Percentual e dinheiro de Outros são somas exatas dos componentes. A lista aberta mostra percentuais sobre `S`, não sobre Outros. Tabela e legenda reutilizam os mesmos resultados, sem arredondar novamente. Esse detalhamento evita que abrir Outros mude a participação ou que seus componentes deixem de somar o grupo.
4. Usar as cinco cores `chart-1`, `chart-2`, `chart-3`, `chart-4`, `chart-6` nos principais e reservar `chart-5` a Outros. Registrar essa ordem específica em DESIGN.md, sem trocar tokens. Com até cinco positivos não há Outros; com seis ou mais há cinco principais e o grupo. A cor não é o único vínculo: legenda ordenada e textual identifica cada parte.
5. Geometria proporcional aos saldos positivos originais, com conversão para coordenadas SVG somente na apresentação. Não arredondar saldos para desenhar nem impor tamanho mínimo artificial a fatias pequenas. Um positivo que se apresenta como 0,00% permanece listado e integra a geometria. Tratar explicitamente um único positivo como círculo completo, sem arco degenerado.
6. Negativos ficam num conjunto identificado da legenda e da tabela, com nome e quantia, sem percentual e sem cor que sugira fatia. Explicar que os percentuais têm como base só os saldos positivos, e que saldos negativos estão fora da rosca. Em trânsito segue o mesmo critério: positivo participa, negativo é listado, zero não aparece.
7. Se não houver positivos, não dividir por zero nem desenhar uma carteira de 100%: mostrar "Não há saldos positivos para exibir" e manter eventuais negativos listados. Sem mês fechado/dados disponíveis, preservar estado vazio/erro existente, sem converter ausência em zero.
8. Rosca no servidor, sem biblioteca/JavaScript cliente; legenda HTML com nome integral, percentual de duas casas sem sinal de variação e dinheiro; Outros usa `<details>`/`<summary>`. Manter título, descrição e Ver os números com equivalência completa, incluindo componentes e negativos. Na tabela, separar resumo agrupado de detalhamento para não somar Outros junto com seus componentes como se fossem novas posições.
9. Ocultar valores troca toda quantia formatada por Valor oculto já no servidor, inclusive subtotais, tabela, títulos e atributos acessíveis. Percentuais, nomes e geometria permanecem. Não acrescentar texto acessível com dinheiro que esteja visualmente oculto.

**Casos G1 independentes (centavos fictícios; novos CR-53 a CR-61, livres na baseline):** os esperados abaixo vêm de quocientes/restos racionais e somas manuais, não da função a testar. Transcrever para KB-004 e `tests/fixtures/financeiro/casos_referencia.json` antes do código; conferir disponibilidade dos IDs novamente na implementação.

**Formato dos esperados:** a regra entra na seção 15 da KB-004 (Apresentação do Início), com referências às exceções das seções 1, 2 e 14. Na seção 14, acrescentar a exceção: participação é inteiro em centésimos de ponto percentual, de 0 a 10000 (10000 = 100,00%), não razão float64. Cada caso usa `entrega: "010"`; ampliar a lista de entregas conhecidas de `src/lib/financeiro/casos-referencia.test.ts`. Chaves `participacao_<alias>_centesimos_pp` e `participacao_outros_centesimos_pp` têm valores inteiros decimais em string no JSON e na lista Esperado da KB, textualmente idênticos (exemplo CR-53: `participacao_A_centesimos_pp: "3334"`). Negativos/zeros não recebem essa chave; usar `sem_percentual` e `omitidos` como listas de aliases em JSON compacto, igualmente serializadas na KB. Base intermediária `base_positiva_centavos` e `patrimonio_liquido_centavos` são strings decimais exatas; listas vazias `[]`. Subcenários usam prefixos estáveis (`s1_`, `s2_`) nas chaves. Não alterar os esperados/convenções dos casos anteriores. Textos `33,34%` abaixo são a apresentação do inteiro 3334, sem nova conversão de arredondamento.

| Caso | Entrada | Esperado e conferência independente |
| :-- | :-- | :-- |
| CR-53 — iguais/nome | C, A e B com 10000 cada | `S=30000`; piso 3333, resto 10000 cada; sobra 1 para A: A 33,34%, B/C 33,33%. Entrada embaralhada dá o mesmo resultado. |
| CR-54 — resto empatado/saldo | A=5, B=1 | `S=6`; pisos 8333/1666 e restos 2/4: B recebe a unidade → 83,33%/16,67%. Subcaso A=7, B=1, C=4: `S=12`, pisos 5833/833/3333, restos 4/4/4; sobra 1 para maior saldo A → 58,34%/8,33%/33,33%. |
| CR-55 — agrupamento | A a G com 100 cada | `S=700`; piso 1428 e resto 400 cada; sobram 4 para A–D. A–D 14,29%; E–G 14,28%; principais A–E e Outros(F,G)=200 e 28,56%; F+G somam o grupo. |
| CR-56 — positivos/negativos/zero | A=100000, B=-20000, Z=0 | Base positiva 100000; A 100,00%; B sem percentual/fatia e com -20000; Z ausente. Patrimônio líquido continua 80000, não vira denominador. |
| CR-57 — vazio e negativo | Lista vazia; depois A=0, B=-200 | Nenhum percentual/rosca; no segundo cenário só B listado. Nenhum total 100% fictício e nenhuma divisão por zero. |
| CR-58 — trânsito | A=300, trânsito=100; variar trânsito para 0 e -100 | Primeiro: 75,00% e 25,00%; segundo: só A 100,00%; terceiro: A 100,00% e trânsito negativo listado sem percentual. |
| CR-59 — precisão e intermediário | A=9007199254740991, B=1, C=-1 | Vf=9007199254740991 dentro da faixa, compatível com mês fechado; `S=9007199254740992` em bigint. A tem piso 9999 e B 0; sobra para A → A=10000/B=0 unidades (100,00%/0,00%); C listado sem percentual. A base positiva é intermediária exata, não saldo gravado/devolvido como number. |
| CR-60 — uma posição | A=1 | 10000 unidades = 100,00%; círculo completo e nenhuma entrada Outros. |
| CR-61 — mesmo nome | Os três UUIDs fictícios da proposta acima, mesmo nome e saldo 1; entrada 003, 001, 002 | Proposta ID: 001 recebe 3334, 002/003 recebem 3333; total 10000. Reordenar entrada mantém o resultado. Linhas distintas, sem colapsar por nome. Esperados condicionados à escolha humana do desempate. |

Acrescentar validações de fronteira para centavos não seguros, cinco/seis posições e quantias ocultas. O total positivo pode exceder a faixa de uma posição quando há negativos compensatórios: mantê-lo em bigint como base intermediária, sem devolver um saldo monetário fora da faixa. Não criar nova regra de fechamento por causa da rosca.

**Critérios de aceite:**

- [ ] Decisão humana do nível do rateio e desempate completo registrada após veredito apto; KB-004 e casos independentes coerentes com a escolha, em centésimos de p.p., registrados e conferidos antes do cálculo, sem alterar regras anteriores.
- [ ] Percentuais positivos somam 100,00% quando há positivos; desempate determinístico e mesmo valor em legenda/tabela.
- [ ] Até seis fatias, cinco principais e Outros retrátil com todos os componentes, nomes integrais, valor e percentual sobre a mesma base.
- [ ] Negativos explícitos sem percentual/fatia, zeros ausentes e trânsito conforme sinal; vazio e círculo único corretos.
- [ ] Ocultar valores aplicado no servidor; percentuais continuam visíveis e não há dinheiro oculto em textos acessíveis.
- [ ] ADR-005 emendado, DESIGN.md atualizado, SVG sem JavaScript, geometria proporcional e acessibilidade/responsividade verificadas.

## Arquivos afetados

Caminhos novos são propostas de implementação, não arquivos já existentes.

| Entrega | Existentes a alterar | Novos previstos |
| :-- | :-- | :-- |
| Plano | `_project/cycles.md` | Este plano em `_project/drafts/010_novidades_privacidade_ativos_distribuicao/010_plan.md` |
| BL-012 | `src/app/entrar/page.tsx`, `src/app/(app)/conta/page.tsx`, `tests/e2e/preview.spec.ts`, `tests/e2e/navegacao.spec.ts`, `tests/e2e/botoes.spec.ts`, KB-002/003 | `src/app/privacidade/page.tsx`, `src/app/termos/page.tsx`, `tests/e2e/paginas-publicas.spec.ts` |
| BL-011 | `src/components/navegacao.tsx`, `src/components/icones.tsx` se necessário, `tests/e2e/navegacao.spec.ts`, `tests/e2e/botoes.spec.ts`, DESIGN.md, KB-003 | `src/app/(app)/novidades/page.tsx`, `src/lib/novidades.ts` com notas de BL-012/011, `tests/e2e/novidades.spec.ts` |
| BL-006 | `src/app/(app)/ativos/page.tsx`, `src/app/(app)/ativos/acoes.ts`, `src/components/formularios/novo-ativo.tsx`, `tests/e2e/carteira.spec.ts` e demais chamadores do cadastro, `tests/e2e/navegacao.spec.ts`, `tests/e2e/botoes.spec.ts`, `tests/e2e/navegacao-desempenho.spec.ts`, `tests/e2e/apoio/MEDICAO.md`, `src/lib/novidades.ts` (sua nota), DESIGN.md, KB-003 | `src/app/(app)/ativos/novo/page.tsx`, e2e focal de abas se não couber no existente |
| BL-005 | `src/app/(app)/page.tsx`, `src/components/graficos/graficos.tsx`, `src/components/graficos/graficos.test.tsx`, `tests/e2e/inicio.spec.ts`, `tests/e2e/navegacao-desempenho.spec.ts`, `src/lib/financeiro/casos-referencia.test.ts`, fixture financeira, `src/lib/novidades.ts` (sua nota), KB-004/003, ADR-005, DESIGN.md | `src/lib/financeiro/distribuicao.ts`, `src/lib/financeiro/distribuicao.test.ts`, `tests/e2e/distribuicao.spec.ts` e componente de rosca se separado |
| Execução/encerramento | Este plano, `_project/cycles.md`, `README.md` quando afetado, KBs/ADR/DESIGN, tasks BL-012 e da última issue, `src/lib/novidades.ts` (data real, com gates de aplicação) | Tasks das quatro issues e `010_task_closure.md` conforme templates; movimento final para `executed/` |

Sem alteração em `supabase/migrations/`, `.github/workflows/`, schema ou configuração OAuth no código. Se a inspeção de implementação revelar necessidade fora dessa lista/escopo, registrar e avaliar antes de alterar; arquivos auxiliares só quando indispensáveis aos critérios.

## Decomposição em issues e PRs

Após revisão apta, aprovação humana e integração da PR documental, apresentar os payloads pelo template `.github/ISSUE_TEMPLATE/feature_request.yml` para confirmação e só então criar via `gh`. Cada payload herda contexto, ação, critérios e dependências do item respectivo, com vínculo ao plano e origem no backlog. Nenhum número é reservado neste rascunho.

| Ordem | Título proposto | Unidade e dependência |
| :-- | :-- | :-- |
| Documental | Plano do ciclo 010 | Branch `chore/cycle-010-plan`, PR própria com ideação, plano e índice; sem issue de implementação |
| 1 | `[FEATURE] Publicar páginas de privacidade e termos e preparar OAuth (BL-012)` | Item 1, uma issue/PR de código; textos revistos antes do merge. Sem fechamento automático: ação externa somente após integrar as quatro entregas, e fechamento pela PR de encerramento. |
| 2 | `[FEATURE] Exibir versão e novidades do produto (BL-011)` | Item 2, uma issue/PR; após integração do item 1, situação Aguardando autorização de implementação. Nenhuma ação externa em paralelo. |
| 3 | `[FEATURE] Separar cadastro e organizar ativos por abas (BL-006)` | Item 3, uma issue/PR; após integração do item 2. |
| 4 | `[FEATURE] Mostrar distribuição patrimonial em rosca acessível (BL-005)` | Item 4, uma issue/PR; após integração do item 3 e com especificação G1 aprovada. |
| Release | PR produzida pelo release-please | Sem issue nova; acumular entregas de feature para `0.7.0` e aprovar a release após conferência. |
| Encerramento | Consolidar ciclo 010 | `chore/cycle-010-closure`, PR sem issue nova, com `Closes #N` da issue BL-012; reconcilia tasks/KB-002 e registra data real em `src/lib/novidades.ts`, rodando gates documentais e de aplicação. |

Uma branch por issue (`feature/issue-N`), commit `feat(issue-N): ...`, task `010_task_issue-N.md`; documentação `docs(cycle-010): ...`. Não criar branch/commit/push/PR neste rascunho. O release-please pode abrir PR antes da última entrega; sua integração espera o conjunto do ciclo para não atribuir itens ainda ausentes à `0.7.0`.

Para BL-012, a PR de código usa vínculo de referência, sem fechamento automático. Após seu merge, seguir apenas para Aguardando autorização de implementação da issue BL-011; a tarefa externa permanece uma etapa futura do plano, sem situação concorrente. Repetir o fluxo para BL-006 e BL-005. Após o merge de BL-005, sua task é o artefato ativo com Aguardando ação externa da issue BL-012; depois do resultado mínimo comprovado, ela aponta para Aguardando verificação em produção do ciclo 010. Não reabrir a branch integrada do item 1 para registrar resultados. O próximo workflow mutante registra os resultados sanitizados no artefato ativo; a PR de encerramento incorpora esse registro, reconcilia a task BL-012 e a task da última issue, atualiza os fatos da KB-002 e usa `Closes #N` para a issue BL-012, com fechamento pelo GitHub no merge autorizado. A aprovação do plano cobre essa reconciliação/encerramento; não cria uma issue recursiva. As outras issues fecham normalmente pelas próprias PRs de código. Em todas as tasks, declarar código integrado e etapa externa pendente como fatos distintos até o encerramento.

## Dependências e blockers

- Rodada 1 concluída com REQUER NOVA RODADA; esta v2 responde aos achados e aguarda rodada 2 e posterior aprovação humana. Nenhuma publicação documental ou execução autorizada pela correção.
- Q1–Q11 decididas e contato Q8 fornecido. Nível do rateio e desempate completo são propostas adicionais: A + UUID canônico é a recomendação, pendente de decisão expressa na aprovação após veredito apto. A especificação G1 só se torna executável com essa manifestação; outra escolha exige ajustar casos e revisar antes de implementar.
- A sequência v2 propõe ação externa após as quatro entregas, com artefato e fechamento definidos. A aprovação deverá confirmar esse calendário; não presumir que a autorização de corrigir decide antecipar/postergar ação externa por conta própria.
- Revisão dos textos pelo responsável é pré-requisito do merge de BL-012; suas escolhas de retenção ou outras práticas ainda não comprovadas não serão inventadas.
- Escopos efetivos, domínios e estados Audience/Branding no console são desconhecidos e serão conferidos pelo responsável após as quatro entregas. Exigência de provar domínio do callback que impeça o resultado mínimo, ou falta de prova de login fora da lista de teste, leva a Parado para decisão; Branding opcional pendente é registrado separadamente, sem criar custo/dependência neste ciclo.
- Supabase local/Docker e ambientes de teste são necessários aos e2e autenticados; falha de capacidade bloqueia publicação da entrega afetada, com evidência na task.
- Release-alvo `0.7.0` depende de não integrar outra release intermediária. Divergência exige reconciliar plano/notas com o responsável, sem mudar versão manualmente.

## Riscos, suposições e rollback

- **Denominador confundido com patrimônio líquido:** título/descrição explicam saldos positivos; negativos ficam próximos à legenda e na tabela. O cartão de patrimônio mantém sua conta original.
- **Arredondamento/Outros:** o nível do rateio altera centésimos exibidos; a v2 propõe rateio global A e explicita sua diferença frente à alternativa B. Escolha e desempate completo são decisões humanas na aprovação. Só após essa decisão registrar regra/casos na KB; G1 cobre empates, faixa, duplicidade de nomes e subpartes.
- **Cores/contraste:** só seis tokens; usar separação visual por superfície entre fatias e legenda textual para não depender de contraste entre duas cores adjacentes. Conferir no contrato visual, sem nova paleta.
- **URL sem JavaScript:** links server-side são adequados às abas; o formulário atual já é cliente e continua assim. A decisão de abas não promete retirar JavaScript do restante do app.
- **Release e notas fora de sincronia:** durante `0.6.0` não mostrar `0.7.0` como publicada. Revisar versão/data de fato na release e encerramento; não adicionar teste impeditivo ao release-please.
- **Premissa OAuth histórica incorreta:** KB-002 passa a documentar exceção e estados separados. Se o console exigir algo além do escopo aceito, parar para decisão; nenhuma garantia de aprovação Google.
- **Texto público incompleto:** revisão humana antes de merge e inventário factual, sem alegar conformidade jurídica validada. Contato é o único dado pessoal expressamente destinado à publicação.
- **Rollback:** reverter a PR de aplicação afetada por novo commit/PR revisável e gates, preservando histórico e sem tocar banco. Páginas legais publicadas exigem coordenar com o responsável os links já configurados no console; não removê-las silenciosamente após publicação OAuth. Reversão de configuração externa só pelo responsável. Notas descrevem apenas o que permanecer entregue.

## Sequência recomendada

1. Revisar formalmente este rascunho e registrar rodada/veredito. Corrigir se autorizado e só então pedir aprovação do plano.
2. Após aprovação, preparar PR documental em branch própria; gates e aprovação específica de merge. Apresentar e confirmar payloads, criar quatro issues e registrar números reais.
3. Autorizar e entregar BL-012 com task; registrar a revisão humana dos textos/contato de Q8 e aprovar seu merge. A PR referencia a issue sem fechá-la. Após merge, situação única Aguardando autorização de implementação de BL-011; a ação externa ainda não começou.
4. Autorizar e integrar BL-011; sua PR cria notas de BL-012/011 para `0.7.0`, ainda ocultas. Depois autorizar BL-006, cuja PR acrescenta sua nota e adapta abas/lista e prontidão do ensaio opcional. Cada merge leva somente à autorização da próxima issue.
5. Autorizar BL-005 com as escolhas financeiras já aprovadas expressamente; primeiro registrar/conferir KB-004 e casos G1, emendar contrato/ADR e depois implementar e validar rosca, prova D13 e sua nota de versão. Aprovar merge quando checks e revisão passarem. Após merge, task da última issue aponta para Aguardando ação externa da issue BL-012.
6. Responsável executa o roteiro externo do item 1, após deploy das quatro entregas. Audience publicada e login autorizado fora da lista de teste precisam estar comprovados; relatar Branding opcional separadamente. Sem resultado mínimo, Parado para decisão. Com ele e a frase canônica de conclusão externa, o próximo workflow mutante registra os fatos sanitizados; a task da última issue mantém o handoff único e passa a Aguardando verificação em produção. Resultados e reconciliação das tasks/KB-002 serão publicados na PR de encerramento.
7. Obter autorização de verificação em produção. Agente confere anonimamente páginas/links públicos; responsável confere login/lista de acesso, Novidades nos perfis disponíveis, cadastro/abas e rosca com ocultação/Outros no celular. Até a release, Novidades mostra a versão corrente `0.6.0` sem a entrada futura. Não fazer transações financeiras de teste em produção nem capturar dados reais. Relatar resultados e limitações sem números/nomes de ativos/e-mails de contas. Falha relevante impede encerramento.
8. Preparar release `0.7.0`: conferir PR real do release-please e notas já integradas pelas PRs dos itens, sem inserções manuais nessa PR; executar checks por `workflow_dispatch` conforme fluxo existente. Após aprovação específica, integrar release e conferir tag, instante/data de publicação, deploy e `/novidades` mostrando versão/notas com "Data de publicação em confirmação" até o encerramento. Se for necessário novo acesso à produção além da autorização vigente, solicitar autorização canônica; não presumir acesso autenticado do agente.
9. Com ação externa, verificação e release comprovadas, preparar encerramento prospectivo: consolidar KB-002/003/004, ADR/DESIGN/README quando afetados, plano/tasks e `cycles.md`; registrar na task BL-012 a integração e o resultado externo e na KB-002 os estados efetivos, mantendo Branding opcional separado. Alterar `src/lib/novidades.ts` para a data comprovada da release em America/Cuiaba. Rodar gates de aplicação e documentais, mover pasta para `_project/executed/010_novidades_privacidade_ativos_distribuicao/` e publicar PR própria com `Closes #N` de BL-012, sem issue nova. Solicitar aprovação específica de merge. Depois do deploy desse merge, conferir data/notas com a autorização de produção vigente e relatar qualquer divergência.
10. Só após integração comprovada, registrar retorno dos quatro IDs na fila canônica sob a seleção original e conforme workflow de backlog. Publicar esse retorno exige autorização separada; não incorporar a fila ao diff do ciclo por conveniência.

## Referências

- `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`.
- `.agent/workflows/rascunhar_plano.md`, `.agent/templates/plano_implementacao.md`, `.github/ISSUE_TEMPLATE/feature_request.yml`.
- `_project/ideations/010_novidades_privacidade_ativos_distribuicao.md` e `_project/backlog.md` na revisão da origem.
- ADR-002 (`_project/decisions/ADR-002_stack_infraestrutura.md`), ADR-003 (`_project/decisions/ADR-003_acesso_privacidade_publicacao.md`), ADR-005 (`_project/decisions/ADR-005_graficos_svg_proprio.md`).
- `_project/knowledge/KB-002_operacao_producao_acessos.md`, `_project/knowledge/KB-003_visao_produto_arquitetura.md`, `_project/knowledge/KB-004_regras_financeiras.md` e `design-system/DESIGN.md`.
- [Google: requisitos de verificação e homepage](https://support.google.com/cloud/answer/13464321?hl=en), [políticas OAuth](https://developers.google.com/identity/protocols/oauth2/policies), [público, Testing e exceção de identidade básica](https://support.google.com/cloud/answer/15549945?hl=en), [verificação de marca](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification). Consulta em 2026-10-21, somente leitura; nenhuma configuração do console alterada.
- [Supabase: Google, escopos, callback e Branding opcional](https://supabase.com/docs/guides/auth/social-login/auth-google). Consulta na correção v2 em 2026-10-21, junto aos dois guias Google de verificação e Audience acima; somente leitura, sem afirmar o resultado do console deste projeto.

## Rastreabilidade

| Campo | Valor |
| :-- | :-- |
| Issue(s) | [#104 — BL-012](https://github.com/EuThiagoAndrade/saldo-futuro/issues/104), código integrado, aberta até a ação externa; [#105 — BL-011](https://github.com/EuThiagoAndrade/saldo-futuro/issues/105), fechada pela PR #110; [#106 — BL-006](https://github.com/EuThiagoAndrade/saldo-futuro/issues/106), implementação autorizada em 2026-10-21; [#107 — BL-005](https://github.com/EuThiagoAndrade/saldo-futuro/issues/107) — aberta, implementação não autorizada |
| PR(s) | [#103 — publicação documental do plano](https://github.com/EuThiagoAndrade/saldo-futuro/pull/103), integrada em 2026-10-21 por squash (`c0e906eb96f5030fce27db734a43938b41e6a783`); [#108 — BL-012](https://github.com/EuThiagoAndrade/saldo-futuro/pull/108), integrada em 2026-10-21 por squash, sem fechar a #104; [#110 — BL-011](https://github.com/EuThiagoAndrade/saldo-futuro/pull/110), integrada em 2026-10-21 por squash |
| Branch(es) | `chore/cycle-010-plan` (PR documental do plano); `feature/issue-104` (BL-012); `feature/issue-105` (BL-011); `feature/issue-106` (BL-006) |
| Task(s) | `_project/drafts/010_novidades_privacidade_ativos_distribuicao/010_task_issue-104.md`; `_project/drafts/010_novidades_privacidade_ativos_distribuicao/010_task_issue-105.md`; `_project/drafts/010_novidades_privacidade_ativos_distribuicao/010_task_issue-106.md` |
| Destino após conclusão | `_project/executed/010_novidades_privacidade_ativos_distribuicao/010_plan.md` |

## Registro de aprovação

- **Data:** 2026-10-21.
- **Manifestação humana posterior à revisão:** "Aprova o plano do ciclo 010 com as recomendações A, UUID e ação externa no fim". Complementa a manifestação "aprovo o plano do ciclo 010" da mesma data e explicita as três escolhas requeridas pela v2.
- **Base aprovada:** plano v2, revisão formal rodada 2 com veredito APTO COM RESSALVAS, sem bloqueadores. Revisões e respostas anteriores preservadas como histórico.
- **Decisão de rateio:** alternativa A do item 4 — maior resto entre todos os ativos positivos, antes do agrupamento; Outros soma os percentuais e saldos dos componentes. Especificação e casos CR-53 a CR-61 dessa alternativa aceitos.
- **Decisão de desempate completo:** UUID canônico minúsculo crescente, em comparação textual lexicográfica sem locale, depois de maior saldo e nome. Não usar ordem de entrada como regra.
- **Decisão de calendário:** ação externa depois da integração das quatro entregas, no fluxo sequencial já descrito. A task da última issue é o artefato ativo nessa etapa; resultado e fechamento de BL-012 entram na PR de encerramento.
- **Ressalvas aceitas para tratamento na execução:** R2-1 e R2-2 não mudam escopo nem regra financeira. Para R2-1, o responsável confere `/novidades` autenticado após a release e relata o resultado; depois do merge de encerramento, somente reconciliação de merge/checks em main conforme README, sem etapa autenticada adicional. Para R2-2, a revisão humana dos textos/contato tem data e síntese gravadas na task por commit na branch da PR BL-012 antes do merge, com checks verdes no novo HEAD, mesmo que a manifestação ocorra após abrir a PR. Esse registro não fica adiado ao encerramento.
- **Alcance:** aprovação do plano e publicação da PR documental; criação das quatro issues somente após integrar a documentação e apresentar/confirmar os payloads. Não concede aprovação de merge, autorização de implementação, ação externa ou acesso a produção.
- **Estado reconciliado:** esta seção resolve as propostas/pendências de aprovação descritas no corpo da v2. As alternativas e os relatos anteriores ficam preservados; os tratamentos das ressalvas acima prevalecem sobre as passagens apontadas pela rodada 2.
- **Validação documental da publicação:** 48/48 testes do validador passaram; governança com 0 erros e 0 avisos (5 conferências manuais); diff e staging sem erros de whitespace e limitados à ideação, plano e índice. Histórico de revisão preservado (SHA-256 normalizado `98bb4dab603c6772ba1c4b7375237cda5321c1a20d40bd73a16449720a86dcd1`). Sem dados reais, contato literal ou código de aplicação no lote.

## Registro de criação das issues

- **Data e autorização:** 2026-10-21, "Pode criar as issues", em resposta aos quatro textos apresentados após o merge da PR #103. A manifestação confirma a publicação dos payloads, não a implementação.
- **Precondições conferidas:** plano v2 Aprovado com aprovação humana posterior à rodada 2; escolhas A/UUID/calendário registradas; PR #103 MERGED em `c0e906eb96f5030fce27db734a43938b41e6a783`, presente em main local e remota. Consultas via gh, por título/ID e vínculo ao ciclo, sem issue equivalente antes de criar cada unidade.
- **Template aplicado:** `.github/ISSUE_TEMPLATE/feature_request.yml`, com campos Contexto, Escopo, Critérios de aceite, Ciclo e plano relacionados e Dependências, riscos e autorizações, nessa ordem.
- **Resultado:** quatro issues criadas sequencialmente via `gh issue create --body-file`, sem labels ou responsáveis adicionais. Cada título/corpo foi relido via `gh issue view` e comparado ao payload confirmado; todas OPEN. Os hashes abaixo usam corpo em UTF-8, LF e uma quebra final; identificam o payload efetivo sem depender de arquivo ignorado.

| Ordem | Origem | Issue e título | SHA-256 do corpo confirmado |
| :-- | :-- | :-- | :-- |
| 1 | BL-012 | [#104 — Publicar páginas de privacidade e termos e preparar OAuth](https://github.com/EuThiagoAndrade/saldo-futuro/issues/104) | `12eb0f3594cf96e6f409ea1d3225a380d5900d2fea35d8a867f1ee1d3d654f03` |
| 2 | BL-011 | [#105 — Exibir versão e novidades do produto](https://github.com/EuThiagoAndrade/saldo-futuro/issues/105) | `700b537c73ef79f64476b4732a986ba0be9e29f04e578013de4d0cc7f58813c2` |
| 3 | BL-006 | [#106 — Separar cadastro e organizar ativos por abas](https://github.com/EuThiagoAndrade/saldo-futuro/issues/106) | `3d083dee7474602a4b378dab18316e2a5bcaf04eb8028bc821d337e836cda1e8` |
| 4 | BL-005 | [#107 — Mostrar distribuição patrimonial em rosca acessível](https://github.com/EuThiagoAndrade/saldo-futuro/issues/107) | `32f0f06ca4eb8ab06024b432a82f3011589fe65bf4e66ed78970c2fe36cb9a62` |

A sequência de implementação é #104 → #105 → #106 → #107, cada uma com autorização própria. A PR de código #104 apenas referencia a issue; ela permanece aberta até a ação externa após as quatro entregas e fecha pela PR de encerramento. As demais fecham pelas próprias PRs. O calendário e os tratamentos R2-1/R2-2 do Registro de aprovação permanecem válidos.

Estado corrente: plano Aprovado e ciclo Planejamento; nenhuma branch/task de implementação, código, nova PR, ação externa ou operação em produção iniciada. A fila do backlog não foi alterada neste workflow. Os vínculos no plano/índice são registro local da criação e acompanharão a próxima entrega autorizada, sem commit direto ou push em main.

Validação desta atualização: 48/48 testes de governança passaram; validador com 0 erros, 0 avisos e 5 conferências manuais; `git diff --check` limpo. Diff limitado a plano/índice, sem dados reais; autorizações e semântica conferidas manualmente. Histórico integral das revisões preservado pelo SHA-256 normalizado `98bb4dab603c6772ba1c4b7375237cda5321c1a20d40bd73a16449720a86dcd1`.

## Registro de execução

- **Issue #104 (BL-012):** "autorizo a implementação da issue #104" em 2026-10-21. A primeira entrega autorizada levou o plano a `Em Execução` e o ciclo a `Em execução`; o "Estado corrente" do Registro de criação das issues fica como histórico. Branch `feature/issue-104`, task `010_task_issue-104.md` (artefato ativo da entrega) e [PR #108](https://github.com/EuThiagoAndrade/saldo-futuro/pull/108), que referencia a issue sem fechá-la. A revisão humana dos textos e do contato de Q8 (R2-2) é registrada na task antes do merge.
- **Decisão do responsável sobre `/entrar` (2026-10-21), durante a revisão da PR #108:** "Não vejo necessidade destes textos estarem na página /entrar. Pode remove-los. Deixando apenas o ícone do programa centralizado e o botão abaixo centralizado. O restante permanece tudo como está." Informado de que o Google não aceita como página inicial uma página só de login, escolheu a alternativa recomendada: "Minha escolha é a (recomendada)", isto é, `/termos` como página inicial informada no console, e confirmou que, no app, a entrada continua em `/entrar`. Efeitos: substitui Q10 e o critério de `/entrar` do item 1 (anotados no lugar), sem rota nova nem mudança de autenticação; KB-002 (armadilha 7, tabela de domínios, O1, O3 e O4) e KB-003 ajustadas na mesma PR. Recusa de `/termos` no console leva a "Parado" para decisão (O4).
- **Issue #104 integrada:** PR #108 por squash em 2026-10-21, sem fechar a issue; etapa externa pendente até as quatro entregas.
- **Issue #105 (BL-011):** "autorizo a implementação da issue #105" em 2026-10-21. Branch `feature/issue-105`, task `010_task_issue-105.md` (artefato ativo) e [PR #110](https://github.com/EuThiagoAndrade/saldo-futuro/pull/110), com `Closes #105`. A PR #109 do release-please (`0.7.0`) está aberta e não é integrada antes das quatro entregas.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 010 (completo)
Quem: Responsável
Conferir: Checks e diff da PR #110 (https://github.com/EuThiagoAndrade/saldo-futuro/pull/110); notas da 0.7.0 em src/lib/novidades.ts, transcritas na task 010_task_issue-105.md
Diga: "aprovo o merge da PR #110"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 010 + implementar_issue + 105/Item-2-BL-011 + 30e05c55e5756dfa017a6f98d1ce96aec9555e3a`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: #104 integrada pela PR #108, #105 aberta sem branch nem PR / branch `feature/issue-105` publicada, PR #110 aberta e task da #105 Aguardando integração
- `result`: `executed`
- `evidence`: autorização de implementação da #105 em 2026-10-21; base conferida igual a `origin/main` em `30e05c5`; PR https://github.com/EuThiagoAndrade/saldo-futuro/pull/110 criada via `gh`; validações registradas na task
- `blockers`: checks remotos verdes no HEAD final; "aprovo o merge da PR #110". As issues #106 e #107 seguem sem autorização; PR #109 do release-please não é integrada antes das quatro entregas

## Revisão crítica

Uma subseção `### Rodada N` por rodada, com `Autor:`, `Revisor:` (ferramenta e modelo), achados `RN-k` (bloqueador ou ressalva), itens atendidos e veredito. O autor responde a cada achado numa subseção própria. Teto de 5 rodadas.

### Rodada 1

- **Autor:** Codex (GPT-6), conforme o registro do rascunho `v1`.
- **Revisor:** Claude Code (Claude Opus 5.5).
- **Data e autorização:** 2026-10-21; solicitação humana "revise o plano do ciclo 010". Autoriza a revisão formal e seu registro local, sem aprovação, issue, implementação ou publicação.
- **Base:** branch `main`, HEAD `5cf019089f4465e5e85fa6661966d856fec09922`, igual a `origin/main` depois de `git fetch`; `gh pr list --state open` sem PR aberta. Plano local `v1`, não versionado, recebido em `Rascunho`, com revisão e veredito `Pendente` e situação `Aguardando revisão (rodada 1)`; não havia rodada anterior a reconciliar. Ciclo `010` em `Planejamento` em `cycles.md` (alteração local preexistente) e ideação local não versionada, ambas preservadas.
- **Autoridades e template:** `.agent/ai_behavior.md`, `_project/README.md`, `_project/cycles.md`, `.agent/workflows/revisar_plano.md`, `.agent/templates/plano_implementacao.md`, a ideação do ciclo, `_project/backlog.md` (BL-005, BL-006, BL-011 e BL-012), ADR-005, KB-002, KB-004 (seções 1 a 3 e 13 a 15) e `design-system/DESIGN.md` (2.3, 6.1 e 6.7). Conferidos também os workflows `implementar_issue` e `criar_issues`.
- **Inspeção técnica:** `src/app/(app)/page.tsx`, `src/components/graficos/graficos.tsx`, `src/app/(app)/ativos/page.tsx` e `acoes.ts`, `src/components/formularios/novo-ativo.tsx`, `src/components/navegacao.tsx`, `src/app/entrar/page.tsx`, `src/app/(app)/layout.tsx`, `src/app/(app)/conta/page.tsx`, `src/proxy.ts`, `release-please-config.json`, `.github/workflows/ci.yml`, `src/lib/financeiro/casos-referencia.test.ts`, `tests/fixtures/financeiro/casos_referencia.json` e os e2e que tocam ativos, botões, navegação, Início e preview. Documentação do Google lida em 2026-10-21 (links em R1-8). Nenhum dado real, `local/`, sessão, console ou backend de produção foi acessado.

#### Achados bloqueadores

1. **R1-1 — Bloqueador: a ação externa do BL-012 corre em paralelo às demais issues sem situação, artefato ou PR definidos.** No fluxo do ciclo completo (`_project/README.md`, "Fluxo por nível"), a ação humana externa vem depois das issues, e `implementar_issue` (passo 10) grava, depois de cada merge, **uma** situação: a próxima issue ou a ação externa. O plano quer as duas ao mesmo tempo ("pode permanecer aberta enquanto as demais avançam"; sequência, passo 3). Depois do merge do item 1, o bloco seria "Aguardando ação externa" ou "Aguardando autorização de implementação". Como o receptor só executa o que a situação corrente permite, a frase de uma deixa a outra sem registro, e a retomada (regra 5) passa à próxima issue sem mostrar a ação externa pendente. Além disso, "registrar integração, resultado externo e validação na mesma task" não é executável como escrito: depois do merge, a task do item 1 está em `main` e só muda por outra PR, que o plano não nomeia. O fechamento da issue do item 1 (PR com vínculo só de referência) também não tem momento, autor nem cobertura definidos. **Correção necessária:** escolher e explicitar um desenho compatível com a lista fechada de situações. Por exemplo: (a) a ordem canônica, com o roteiro executado depois da última issue; ou (b) "Aguardando ação externa" logo depois do deploy do item 1, com a cadeia parada até "concluí a ação externa da issue #N" (que relata o estado real, inclusive uma análise do Google ainda pendente) e só então a autorização do item 2. Em qualquer opção, dizer em que PR entram a atualização da task do item 1, o resultado sanitizado e a atualização factual da KB-002 (a PR de encerramento é a candidata natural) e como a issue é fechada (por exemplo, `Closes #N` na PR de encerramento). Se a escolha mudar o calendário que o responsável espera, a decisão é dele.

2. **R1-2 — Bloqueador (G1): o plano escolhe sozinho entre interpretações do maior resto.** Q1 decidiu "maior resto, duas casas, inteiros sobre centavos; empate por maior saldo e depois nome", e Q3 decidiu "cinco maiores mais Outros retrátil". A especificação do item 4 (passos 1 a 3) acrescenta escolhas que mudam os números exibidos e que não foram apresentadas como alternativas, contrariando `.agent/ai_behavior.md` ("Em regra financeira, nunca escolha sozinho entre interpretações de cálculo: registre as alternativas com exemplos numéricos e peça decisão"):
   - **Nível do rateio.** O plano rateia uma vez entre todos os positivos e soma os componentes para formar Outros. A alternativa é ratear entre as fatias desenhadas (cinco principais e Outros) e, dentro de Outros, ratear os componentes sobre a mesma base até o total do grupo. No CR-55 do próprio plano (A a G com 100 centavos cada, `S = 700`; exato 14,2857…% por ativo e 28,5714…% para Outros), o rateio global dá A–D 14,29%, E 14,28% e Outros 28,56%. O rateio por fatia dá pisos 1428 (resto 400) para A–E e 2857 (resto 100) para Outros, com sobra de 3 unidades para A–C: A–C 14,29%, D–E 14,28% e Outros 28,57%. O rateio global limita o erro de cada ativo a menos de 0,01 p.p. e faz os componentes somarem o grupo, mas o erro de Outros pode chegar perto de 0,05 p.p. (o oposto da soma dos erros dos cinco principais). O rateio por fatia limita o erro de cada fatia desenhada a menos de 0,01 p.p. e precisa de um segundo rateio para que os componentes somem o grupo. Conta feita nesta revisão, independente da função.
   - **Terceiro desempate por ID.** Q1 parou em "nome". O ID crescente (CR-61) é uma extensão razoável, mas também é escolha de regra: precisa constar como proposta, com a forma de comparar o ID (texto canônico do UUID).

   **Correção necessária:** registrar essas alternativas com os exemplos e a recomendação, deixando a decisão para a aprovação do plano, como no precedente do ciclo `006`. Os casos G1 passam a refletir a alternativa proposta.

#### Ressalvas

3. **R1-3 — Ressalva (G1): o CR-59 descreve um mês fechado impossível, e o formato dos esperados não está definido.** Com A = 9.007.199.254.740.991 e B = 1, o Vf do mês seria 2⁵³, fora da faixa: a KB-004 (seção 3, CR-09 e CR-11) recusa esse fechamento, então a entrada nunca existe como último mês fechado. O cenário que o próprio plano quer cobrir ("negativos compensatórios") precisa de um negativo, por exemplo A = 9.007.199.254.740.991, B = 1 e C = −1: Vf = 9.007.199.254.740.991, dentro da faixa, e `S = 2⁵³` só como intermediário. Além disso, a seção 14 da KB-004 escreve razões "como frações … com a representação decimal mais curta do `float64`", e `casos-referencia.test.ts` exige texto idêntico entre a KB e o JSON. A participação por maior resto é inteira: definir a chave e a unidade dos esperados (por exemplo, inteiro em centésimos de ponto percentual), registrar a exceção à convenção da seção 14 e indicar a seção da KB que recebe a regra (a 15, "Apresentação do Início", é a candidata natural).

4. **R1-4 — Ressalva: há testes afetados fora da lista do plano.** `tests/e2e/navegacao-desempenho.spec.ts` usa `main form:has(#ativo-nome)` como sinal de `/ativos` pronta (linha 13), que deixa de existir com o cadastro em `/ativos/novo`, e lê linhas da tabela da distribuição (linhas 301 a 303), que muda com o resumo e o detalhamento separados. O ensaio é opcional (`MEDIR_NAVEGACAO=1`), mas ficaria quebrado em silêncio. `tests/e2e/botoes.spec.ts` e `tests/e2e/navegacao.spec.ts` têm listas fixas de rotas que não incluem `/ativos/novo`, `/novidades`, `/privacidade` e `/termos`, e a varredura de estados de botão do DESIGN.md 6.9 não cobriria as telas novas. Listar esses arquivos em "Arquivos afetados" e dizer se cada lista é ampliada.

5. **R1-5 — Ressalva: o plano não diz em que PR entra cada nota da `0.7.0`.** O item 2 cria `src/lib/novidades.ts`, mas as notas de BL-006 e BL-005 só podem ser escritas depois dessas entregas. A sequência fala em "revisar as notas na preparação da release", e entre o item 4 e a release só existe a PR do release-please, que não deve receber alterações manuais. A data real só é conhecida depois do merge da release, então a página publicada mostra `0.7.0` sem data até o encerramento; e a PR de encerramento, descrita como documental, passaria a alterar código da aplicação. **Sugestão:** cada PR de item acrescenta a própria nota; definir como a entrada aparece enquanto não tem data; e, se o encerramento alterar `src/`, declarar que ele roda os gates da aplicação.

6. **R1-6 — Ressalva: "Revisar textos e contato" não é um dos cinco tipos de ponto de aprovação.** A linha não tem frase, e o template manda usar "os tipos e as frases de `_project/README.md`". O critério "revisados expressamente pelo responsável antes do merge" fica sem forma de evidência. Levar a conferência para a coluna "Conferir" do merge da PR do item 1, ou definir como a manifestação é registrada na task (data e síntese), sem criar um tipo novo de aprovação.

7. **R1-7 — Ressalva (G3): a autorização do contato público é registrada com alcance menor que o uso previsto.** O plano diz que ela cobre o contato de Q8 "como contato público nas páginas", mas o próprio plano, o código-fonte, a KB e talvez os payloads das issues ficarão no histórico do Git, que será público (ADR-003). Registrar que a autorização cobre a presença no repositório ou reduzir o uso: o código das páginas traz o contato, e plano, issues, PRs e tasks citam "o contato de Q8" sem repeti-lo.

8. **R1-8 — Ressalva: o roteiro OAuth não trata o domínio do callback do Supabase nem fixa o resultado mínimo.** O cliente OAuth redireciona para `https://<project-id>.supabase.co/auth/v1/callback` (KB-002, GC3). O [guia de verificação](https://support.google.com/cloud/answer/13464321?hl=en) exige provar a propriedade de **todos** os domínios autorizados; o responsável não pode provar a de `supabase.co`, e relatos de desenvolvedores (sem confirmação oficial do Google) descrevem verificação de marca travada ou recusada por isso. Um domínio próprio de Auth no Supabase seria custo e dependência fora do escopo. A conferência confirmou a exceção citada pelo plano: em [Manage App Audience](https://support.google.com/cloud/answer/15549945?hl=en), pedidos só de nome, e-mail e perfil dispensam a lista de usuários confiáveis e não expiram em 7 dias. Assim, o benefício do BL-012 (dispensar o cadastro duplicado de usuários de teste) pode não depender da verificação de marca. **Sugestão:** no passo 4, separar o resultado mínimo (Audience publicada e conta autorizada no app, fora da lista de teste, entrando) da verificação de marca, tratada como opcional; prever parada para decisão se o Google exigir o domínio do callback; e retirar o "se viável" do passo 5 ou declarar a limitação, porque esse passo é a prova do benefício.

#### Itens atendidos e validação

- Nível completo e modo contínuo `—` coerentes com G1. G2 e G4 sem mudança de RLS, autenticação, schema ou migração; a proteção por `exigirSessao()` em cada página e o proxy que só renova a sessão foram conferidos no código. Objetivo, escopo, fora do escopo, ordem Q11 e uma issue por item estão rastreáveis à ideação e ao backlog.
- Origem no backlog conferida: os quatro IDs existem em `main` como `Disponível`, e o snapshot herda a ideação sem alterar a fila. Diferença aceita pela decisão Q9: o BL-012 falava em links "nos menus", e o plano fixa os links autenticados em Conta.
- Fatos da baseline conferidos: filtro `saldo_final !== 0` e agrupamento de cinco mais Outros em `page.tsx`; nomes cortados em 17 caracteres e barras relativas à maior posição em `graficos.tsx`; cores `chart-1` a `chart-4` e `chart-6`, com `chart-5` para Outros, já em uso; ADR-005 com quatro tipos; DESIGN.md sem contrato de abas; KB-004 com razões em `float64` e arredondamento individual; CR-53 a CR-61 livres (o último numérico é o CR-52, além dos CR-M); `/entrar` só com `PreviewNotice` sem backend; `package.json` em `0.6.0` e release-please `node` com `bump-minor-pre-major`, coerente com a release-alvo `0.7.0`.
- Aritmética dos casos CR-53 a CR-61 refeita de forma independente: pisos, restos, sobras e totais conferem com o plano, ressalvado o realismo do CR-59 (R1-3).
- Pontos de aprovação: merge documental com aprovação própria e criação das issues só depois da confirmação do payload, como em `criar_issues`; cada merge com frase própria; ação externa e verificação em produção com as frases canônicas.
- `node --test scripts/validate-governance.test.mjs`: **48/48 passaram**. `node scripts/validate-governance.mjs`: **0 erros e 0 avisos**, 5 itens manuais. `git diff --check`: limpo. A validação estrutural não cobre os achados semânticos acima.
- Corpo da `v1` de `## Problema e contexto` até antes de `## Próximo passo` preservado: SHA-256 `5ad785b296fcde15290fe0af9e0adae6b38374918447816f34565d6fe0b93016`, igual antes e depois desta rodada. Só os campos de status, revisão e veredito, o bloco de próximo passo e esta seção foram alterados. Ideação e `cycles.md` intactos.

**Veredito: `REQUER NOVA RODADA`.** Dois bloqueadores (R1-1 e R1-2) e seis ressalvas (R1-3 a R1-8). Primeira rodada, sem histórico de oscilação. O autor deve responder a cada achado, corrigindo ou contestando com justificativa, incrementar a versão e preservar esta rodada. O plano continua sem aprovação; não houve issue, implementação, branch, commit, PR ou ação no console.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 010 + revisar_plano + 010_plan/rodada-1 + v1`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `010` em `Planejamento`; plano local `v1` em `Rascunho`; revisão e veredito `Pendente`; aprovação humana `Pendente`; situação `Aguardando revisão (rodada 1)`.
- `state_after`: ciclo `010` em `Planejamento`; plano `v1` em `Em Revisão`; revisão `Concluída`; veredito `REQUER NOVA RODADA`; aprovação humana `Pendente`; situação `Aguardando correções (rodada 1)`.
- `result`: `executed`
- `evidence`: solicitação humana desta revisão; cabeçalho e próximo passo atualizados; achados R1-1 a R1-8 nesta rodada; inspeções locais e documentação do Google descritas acima; 48/48 testes de governança; validador sem erros nem avisos; corpo do plano preservado pelo SHA-256 acima.
- `blockers`: R1-1 e R1-2 em aberto. Aguarda a autorização do responsável ao autor para corrigir o plano; esta revisão não executa nem autoriza o workflow seguinte.

### Resposta do autor à rodada 1 — v2

- **Autor:** Codex (GPT-6).
- **Data e autorização:** 2026-10-21, "corrija o plano do ciclo 010". Correção local pelo workflow `rascunhar_plano`, usando `.agent/templates/plano_implementacao.md`; não autoriza implementação, revisão automática, aprovação ou publicação.
- **Estado:** v2 em Em Revisão, aguardando rodada 2. O veredito do cabeçalho preserva o último resultado, REQUER NOVA RODADA da v1. A rodada 1 e seu handoff acima são históricos preservados, não o próximo passo vigente.

| Achado | Resposta do autor | Correção e evidência para a nova revisão |
| :-- | :-- | :-- |
| R1-1 | Corrigido no desenho proposto | Sequência e decomposição adotam a ordem canônica: quatro PRs de código, depois Aguardando ação externa de BL-012, com task da última issue como artefato ativo, depois verificação em produção. Task BL-012 e KB-002 recebem resultado factual na PR de encerramento; `Closes #N` dessa PR fecha a issue BL-012 pelo GitHub. As outras três fecham pelas próprias PRs. Calendário é proposta explicitamente submetida à aprovação humana; nenhum despacho concorrente. |
| R1-2 | Corrigido como proposta de decisão financeira | Item 4 compara rateio global A e por fatia B, com A–G/S=700 e resultados 28,56%/28,57% em Outros. Recomenda A, sem atribuir a escolha a Q1/Q3. Compara UUID canônico crescente e ordem de entrada para empate completo, especifica comparação textual e recomenda UUID. Casos/especificação condicionados à confirmação humana expressa na aprovação após veredito apto; alternativa diferente exige ajustar esperados e revisar. |
| R1-3 | Corrigido | CR-59 inclui C=-1: Vf=9007199254740991 válido e base positiva 9007199254740992 intermediária. Regra destinada à seção 15 da KB-004, com exceções nas seções 1/2/14; chaves `participacao_<alias>_centesimos_pp` são inteiros em strings, não razões float64. Especificadas listas sem percentual/omitidos, subcenários e concordância textual KB/JSON. Teste de concordância passa a reconhecer entrega 010. |
| R1-4 | Corrigido | Arquivos afetados incluem listas de navegação/botões, ensaio opcional e seu documento de apoio. Estratégia fixa ampliação das quatro rotas novas, prontidão de `/ativos`, consulta delimitada ao detalhe da distribuição, piloto existente para BL-006 e prova D13 existente para BL-005. Sem nova campanha de desempenho ou baseline completa. |
| R1-5 | Corrigido | PR BL-011 inclui notas BL-012/011; PR BL-006 inclui sua nota; PR BL-005 inclui a sua. Até 0.7.0 a entrada fica oculta; após release, data null mostra "Data de publicação em confirmação". Encerramento preenche a data comprovada em `src/lib/novidades.ts` e roda gates de aplicação e documentais. PR do release-please não recebe edição manual. |
| R1-6 | Corrigido | Removido o ponto extra "Revisar textos e contato". Conferência humana integra a coluna Conferir do ponto canônico de aprovar merge de cada entrega e o critério do item 1. Task registra data/síntese da manifestação sem valores literais; se a manifestação vier após publicar a PR, sua reconciliação versionada entra no encerramento, preservando a evidência anterior ao merge. |
| R1-7 | Corrigido por minimização | Valores literais do contato retirados deste plano; não se amplia a autorização anterior. Páginas e seu código público usam o contato de Q8 autorizado na conversa; plano, KBs, issues, PRs e tasks citam apenas "contato de Q8". Revisão do diff inclui sua presença no código versionado sob ADR-003. Nenhum e-mail de conta ou credencial foi consultado. |
| R1-8 | Corrigido | Roteiro distingue homepage, callback Google→Supabase e retorno Supabase→app; cita guia oficial Supabase além dos guias Google relidos. Resultado mínimo explícito: Audience publicada e prova humana de login fora da lista de teste; Branding opcional separado. Exigência sobre domínio do callback que impeça o mínimo leva a Parado para decisão, sem custo/domínio de Auth novo; ausência de conta/capacidade mantém a prova pendente. |

**Conferência do autor:** nenhuma contestação; as oito respostas são submetidas à rodada 2, sem emitir veredito sobre o próprio texto. A aprovação futura deve decidir explicitamente as propostas adicionais (rateio, desempate completo e calendário externo). `node --test scripts/validate-governance.test.mjs`: 48/48 passaram; `node scripts/validate-governance.mjs`: 0 erros, 0 avisos e 5 itens manuais; `git diff --check`: limpo. Rodada 1 preservada: SHA-256 do trecho de `### Rodada 1` até antes desta resposta, com LF e sem espaço final, `12d4632c990ac49b35a618b98c39073e112f1b85dcc4b6dcf33b15f6f4570400`, idêntico antes/depois da correção. Conferências manuais deste escopo: autoria/autorização verificadas na conversa, fontes referenciadas, privacidade sem contato literal e sem dados reais, barreiras/propostas delimitadas; nenhuma operação de backlog efetuada. Ideação, índice e código da aplicação não foram alterados neste workflow.

### Rodada 2

- **Autor:** Codex (GPT-6), conforme a resposta do autor à rodada 1.
- **Revisor:** Claude Code (Claude Opus 5.5).
- **Data e autorização:** 2026-10-21; solicitação humana "revise o plano do ciclo 010". Revisão formal da `v2`, sem aprovação, issue, implementação ou publicação.
- **Base:** branch `main`, HEAD `5cf019089f4465e5e85fa6661966d856fec09922`, igual a `origin/main` depois de `git fetch`; `gh pr list --state open` sem PR aberta. Plano local `v2` em `Em Revisão`, revisão `Em andamento`, último veredito `REQUER NOVA RODADA` (da `v1`), aprovação humana `Pendente` e situação `Aguardando revisão (rodada 2)`. Localizadas a rodada 1 e a resposta do autor; não existia rodada 2 a reconciliar.
- **Autoridades e template:** `.agent/ai_behavior.md`, `_project/README.md` (fluxo do completo, situações, retomada e encerramento prospectivo), `.agent/workflows/revisar_plano.md`, `.agent/workflows/implementar_issue.md` (passo 10) e `.agent/templates/plano_implementacao.md` relidos. Conferidos também `src/lib/financeiro/casos-referencia.test.ts`, `tests/e2e/apoio/MEDICAO.md`, `tests/e2e/navegacao-desempenho.spec.ts` e o [guia do Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google) citado pela `v2`. Nenhum dado real, `local/`, sessão, console ou backend de produção foi acessado.

#### Conferência das respostas à rodada 1

| Achado anterior | Resultado da conferência da v2 |
| :-- | :-- |
| R1-1 | **Atendido.** A ordem passa a ser a canônica do ciclo completo: depois de cada merge de código há uma única situação, a autorização da próxima issue; depois do merge do item 4, a task dessa issue é o artefato ativo com "Aguardando ação externa", e depois "Aguardando verificação em produção", o que é compatível com `implementar_issue` (passo 10). A task do item 1 não é reaberta, o resultado externo e a KB-002 factual entram na PR de encerramento, e a issue BL-012 fecha por `Closes #N` nessa PR. O novo calendário está submetido expressamente à aprovação |
| R1-2 | **Atendido.** As alternativas A (rateio global) e B (rateio por fatia) estão no item 4 com o exemplo de S = 700; os números de A e de B, inclusive o segundo rateio de F e G em B (1429/1428), conferem com a conta independente da rodada 1. O desempate completo compara UUID canônico e ordem de entrada, com comparação textual sem locale. Casos e especificação ficam condicionados à decisão expressa na aprovação, e outra escolha exige ajustar os esperados e revisar antes de implementar, como no precedente do ciclo `006` |
| R1-3 | **Atendido.** CR-59 com C = −1: Vf = 9.007.199.254.740.991 dentro da faixa e `S = 2⁵³` só como intermediário; pisos 9999/0, restos 9.007.199.254.730.992/10.000, sobra para A, conferidos. O formato em centésimos de p.p. como texto é compatível com `textoDoValor` e com a leitura da lista Esperado em `casos-referencia.test.ts`; a lista de entregas aceitas hoje é `["B", "C", "D", "004", "006"]`, e a `v2` prevê acrescentar `"010"` |
| R1-4 | **Atendido.** Listas de rotas de `navegacao.spec.ts` e `botoes.spec.ts`, o ensaio opcional e `MEDICAO.md` estão em "Arquivos afetados". `MEDICAO.md` cita de fato o "formulário Novo ativo" como marcador e documenta `MEDICAO_PILOTO=1` e a prova D13 com `MEDICAO_D13=1`, ambos com Supabase local e dados fictícios |
| R1-5 | **Atendido, com ressalva nova sobre a conferência pós-release (R2-1).** Cada PR de item traz a própria nota, a entrada `0.7.0` fica oculta até a release, a data `null` tem texto definido e o encerramento roda os gates da aplicação ao alterar `src/lib/novidades.ts` |
| R1-6 | **Atendido, com ressalva sobre o momento do registro (R2-2).** O ponto extra saiu, e a conferência dos textos está na coluna "Conferir" do merge de cada entrega |
| R1-7 | **Atendido.** Nenhum endereço de e-mail aparece no plano (busca por padrão de e-mail sem resultado) nem em `_project/` ou `.agent/`. Como a `v1` nunca foi versionada, a retirada evita o registro no histórico. O valor literal fica restrito ao código das páginas, com a revisão do diff cobrindo sua presença no repositório público |
| R1-8 | **Atendido.** O roteiro distingue homepage, callback Google→Supabase e retorno Supabase→app; o resultado mínimo é Audience publicada mais login de conta autorizada fora da lista de teste, sem o "se viável"; Branding é opcional e uma exigência sobre `supabase.co` que impeça o mínimo leva a "Parado". O guia do Supabase confirma domínio próprio e verificação de marca como recomendações opcionais |

#### Achados bloqueadores

Nenhum.

#### Ressalvas

1. **R2-1 — Ressalva: as conferências de `/novidades` depois da release e do encerramento não têm executor viável nem lugar no ciclo.** `/novidades` é autenticada, e a própria `v2` diz que não se presume acesso autenticado do agente à produção. Mesmo assim, o passo 8 manda conferir `/novidades` depois da release sem dizer quem o faz, e o passo 9 manda conferir data e notas depois do deploy do merge de encerramento, "com a autorização de produção vigente", quando o ciclo já está `Concluído`. Pelo `_project/README.md` ("Encerramento prospectivo"), a reconciliação depois do merge é somente leitura e confere o merge e os checks em `main`; uma divergência leva a "Parado" e é corrigida por trilha curta ou PR documental. **Sugestão:** atribuir a conferência pós-release de `/novidades` ao responsável, como evidência declarada, ou substituí-la pela conferência do código na tag; e limitar o passo 9 à reconciliação somente leitura do README, sem verificação autenticada depois do encerramento. Pode ser tratada na execução, sem mudar escopo ou regra.

2. **R2-2 — Ressalva: a revisão dos textos pode ficar sem registro versionado no momento do merge.** A coluna "Conferir" do merge do item 1 aceita registrar a manifestação na task "antes de publicar a PR" ou levá-la à PR de encerramento "se ocorrer após a publicação". O caso comum é o responsável revisar o diff da PR já publicada; então a PR do item 1 seria integrada sem a evidência que seu próprio critério de aceite exige ("evidência com data e síntese na task"), e a manifestação ficaria só na conversa até o encerramento, o que `.agent/ai_behavior.md` não aceita como fonte de estado. **Sugestão:** registrar a data e a síntese na task por um commit na branch da PR antes do merge, que a autorização de implementação já cobre, com os checks refeitos no novo HEAD. Pode ser tratada na execução da issue.

#### Evidências e validação

- As escolhas que a `v2` submete à aprovação estão identificadas como propostas, não como decisões: nível do rateio (recomendação A), desempate completo (recomendação UUID canônico crescente) e calendário da ação externa depois das quatro entregas. Nenhuma foi inferida de Q1–Q11. G1 continua aplicável e o modo contínuo `—`.
- A rodada 1 foi preservada: o SHA-256 informado pelo autor (`12d4632c990ac49b35a618b98c39073e112f1b85dcc4b6dcf33b15f6f4570400`, trecho com espaços finais removidos) foi reproduzido nesta rodada, e o texto corresponde ao registrado por este revisor na rodada 1.
- Ideação e `cycles.md` inalterados desde a rodada 1 (SHA-256 `bd45ad7658c5d82093c9737221986940ad17413d42583af524ecd251683a60c9` e `7e252b608214bfb505a54d320b70395790762cf205e1caed42ca2db2b12b4717`).
- `node --test scripts/validate-governance.test.mjs`: **48/48 passaram**. `node scripts/validate-governance.mjs`: **0 erros e 0 avisos**, 5 itens manuais. `git diff --check`: limpo. A validação estrutural não cobre os achados semânticos.
- Corpo da `v2` de `## Problema e contexto` até antes de `## Próximo passo` preservado: SHA-256 `152293cd00904df3c30cfe927b5e363150803dc8c83c41f06f8edabd126b4ea8`, igual antes e depois desta rodada. A resposta do autor também foi preservada (SHA-256 `c507694ef7b6459c041a469d7d81df3b1812910db358373476bddb31308e97e5` do trecho da resposta, medido antes desta rodada). Só os campos de revisão e veredito, o bloco de próximo passo e esta rodada foram alterados.

**Veredito: `APTO COM RESSALVAS`.** Nenhum bloqueador; duas ressalvas (R2-1 e R2-2), tratáveis na execução sem mudar escopo nem regra financeira. Houve progresso pleno: os oito achados da rodada 1 foram atendidos, sem oscilação nem contestação. Este veredito não equivale à aprovação: o plano continua `Em Revisão` até a manifestação humana, que, conforme a própria `v2`, deve decidir expressamente o nível do rateio, o desempate completo e o calendário da ação externa. O responsável também pode pedir a correção das ressalvas antes de aprovar.

#### Handoff da revisão

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 010 + revisar_plano + 010_plan/rodada-2 + v2`
- `effect_class`: `local_mutation`
- `state_before`: ciclo `010` em `Planejamento`; plano local `v2` em `Em Revisão`; revisão `Em andamento`; último veredito `REQUER NOVA RODADA` (da `v1`); aprovação humana `Pendente`; situação `Aguardando revisão (rodada 2)`.
- `state_after`: ciclo `010` em `Planejamento`; plano `v2` em `Em Revisão`; revisão `Concluída`; veredito `APTO COM RESSALVAS`; aprovação humana `Pendente`; situação `Aguardando aprovação do plano`.
- `result`: `executed`
- `evidence`: solicitação humana desta revisão; conferência das respostas R1-1 a R1-8 na tabela acima; ressalvas R2-1 e R2-2; arquivos e guia do Supabase conferidos por leitura; 48/48 testes de governança; validador sem erros nem avisos; corpo da `v2`, rodada 1 e resposta do autor preservados pelos SHA-256 acima.
- `blockers`: nenhum bloqueador da revisão. A aprovação humana, com as decisões expressas pedidas pela `v2`, está pendente; esta revisão não aprova, não promove e não executa o workflow seguinte.

## Pós-mortem

- **Data de conclusão:** —
- **Desvios:** —
- **Lições comprovadas:** —
