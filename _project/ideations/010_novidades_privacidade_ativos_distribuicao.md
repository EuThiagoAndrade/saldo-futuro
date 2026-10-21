# Ideação — 010: Novidades, privacidade, tela de ativos e distribuição patrimonial

> **Ciclo:** `010`
> **Estado:** `Ideação`
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 010" em 2026-10-21
> **Criado em:** 2026-10-21
> **Última atualização:** 2026-10-21
> **handoff_schema_version:** `2`

## Problema

Quatro necessidades do backlog foram selecionadas para o mesmo ciclo:

- **BL-005:** o gráfico de distribuição por ativo não mostra a proporção real da carteira, não exibe percentuais, trunca nomes e esconde posições menores em "Outros".
- **BL-006:** na tela de ativos, o formulário de cadastro fica entre as listas, o que dificulta criar ativos e alonga a rolagem no celular com o acúmulo de desativados.
- **BL-011:** o usuário não vê a versão em produção nem o histórico de melhorias.
- **BL-012:** a tela de consentimento do Google continua em "Testando" porque o app não tem política de privacidade nem termos públicos, o que obriga a cadastrar cada e-mail autorizado também como usuário de teste no console do Google.

O nível é completo porque o BL-005 introduz percentuais de participação que nenhuma KB especifica (G1 em dúvida, e na dúvida a triagem propõe o nível mais alto). Os demais itens, isolados, seriam de ciclo leve.

## Origem no backlog

Snapshot da seleção de 2026-10-21. Fila lida da `main` (revisão `5cf019089f4465e5e85fa6661966d856fec09922`); o worktree `saldo-futuro-backlog` está `prunable` e não havia lote local pendente. Último commit da fila: `49a1332c8bc869d3b8dd148baf387de869288307` (PR #102), **publicado em `main`**. Destino ainda em preparação: nenhum item foi alterado no backlog.

| ID | Síntese da necessidade | Parcela selecionada |
| :-- | :-- | :-- |
| BL-005 | Visualização de alocação por ativo em rosca SVG no servidor, com legenda estruturada (cor, nome completo, percentual e valor) e detalhamento retrátil dos ativos menores | Integral |
| BL-006 | Tela de ativos com botão "Novo ativo" no topo, cadastro em rota dedicada (`/ativos/novo`) e abas "Em uso" e "Desativados" com contadores e lista densa no celular | Integral |
| BL-011 | Tela `/novidades`, acessível a todos os perfis, com a versão corrente e notas de lançamento em linguagem não técnica | Integral |
| BL-012 | Rotas públicas `/privacidade` e `/termos`, linkadas no login e nos menus, para publicar a tela de consentimento OAuth do Google | Integral |

Referência: `_project/backlog.md`, commit da fila acima. O snapshot não é reescrito por edições futuras do backlog. O retorno nos quatro itens só ocorre depois da integração comprovada do destino em `main`, com autorização própria.

## Contexto e evidências

### Fatos observados

Inspeção local em `EuThiagoAndrade/saldo-futuro`, revisão `5cf019089f4465e5e85fa6661966d856fec09922`, árvore sem alterações, próximo ciclo `010` em `cycles.md`. Não houve consulta ao estado remoto do GitHub nem ao console do Google, e nenhum dado real foi lido.

**BL-005 — distribuição**
- `GraficoDistribuicao` (`src/components/graficos/graficos.tsx:271`) desenha barras horizontais com a maior posição ocupando toda a largura, corta o nome em 17 caracteres e não mostra valor nem percentual no desenho. Os valores só aparecem na tabela "Ver os números".
- Em `src/app/(app)/page.tsx:157-165`, a distribuição usa as cinco maiores posições do último mês fechado e soma o resto em "Outros". O filtro é apenas `saldo_final !== 0`, então um saldo negativo entraria no gráfico.
- ADR-005 fixa "quatro tipos" de gráfico em SVG próprio, sem JavaScript no cliente, com título, descrição e tabela equivalente, e diz que um tipo novo exige implementação própria e que a decisão pode ser substituída por outra ADR. A rosca seria o quinto tipo.
- `DESIGN.md` 2.3 oferece seis tokens `chart-1` a `chart-6`, no máximo seis séries, e `chart-5` para "outros".
- Percentuais da aplicação têm duas casas (`textoPercentual`, "12,34%", `src/lib/apresentacao/valores.ts:35`), com precisão definida pela KB-004. Uma busca nas KBs não achou regra de participação por ativo, arredondamento de partes nem tratamento de "Outros".
- A preferência "Ocultar valores" (cookie `sf_ocultar_valores`, lida no servidor) já esconde os valores monetários nos gráficos.

**BL-006 — tela de ativos**
- `src/app/(app)/ativos/page.tsx` mostra, em ordem: lista "Em uso" (tabela no desktop, cartões no celular), `FormNovoAtivo`, lista "Desativados" (cartões simples).
- `FormNovoAtivo` (cliente) usa `criarAtivo`, que valida com zod, chama a função `criar_ativo` do banco e devolve mensagem de sucesso sem redirecionar. Já o fluxo de lançamentos redireciona após salvar (`lancamentos/acoes.ts:59`).
- A tela de lançamentos tem botão primário "Novo lançamento" no cabeçalho para `/lancamentos/novo`. **Não há controle de abas nem segmentado em nenhum lugar de `src/`**; a busca por `role="tab"` e "segmentado" só achou o combobox. A premissa do BL-006 de "alinhar ao padrão de lançamentos" vale para o botão, não para as abas.

**BL-011 — novidades**
- `package.json` está na `0.6.0` e o release-please (`release-please-config.json`, tipo `node`) mantém `CHANGELOG.md`. Esse arquivo é técnico: lista commits com hashes e números de issue (por exemplo `issue-97: seletor de ativo...`), então não serve direto como "linguagem clara e não técnica".
- A navegação (`src/components/navegacao.tsx`) tem os destinos principais (Início, Lançamentos, Ativos, Benchmarks) e, em "Mais" ou abaixo do divisor no desktop, Transferências, Conta e Administração (só admin). Não existe item de novidades.

**BL-012 — privacidade e termos**
- `src/proxy.ts` só renova a sessão e não redireciona. A proteção é feita por `exigirSessao()` em cada página do grupo `(app)`, que redireciona para `/entrar`. `/entrar` já fica fora do grupo `(app)`, sem exigir sessão. Páginas públicas novas seguem o mesmo desenho, sem mudar autenticação, RLS ou schema.
- A KB-002 (GC2 e armadilha 7) registra que o Google exige "página inicial e política de privacidade" para sair de "Testando". A tela hoje exige cadastrar cada e-mail como usuário de teste (GC4 e P2), com limite de 100.
- A raiz `/` redireciona para `/entrar` sem sessão. Se o Google exigir uma página inicial pública que contenha o link da política, essa página provavelmente seria `/entrar`. **Isto é hipótese, não verificada na documentação do Google.**
- Dados que o texto precisaria cobrir, observados no código e na KB-002: e-mail e identidade básica da conta Google (`openid`, e-mail e perfil), lista de e-mails autorizados, dados financeiros que o próprio usuário registra, cookies de sessão do Supabase e o cookie `sf_ocultar_valores`. Operadores observados: Supabase (banco e autenticação), Vercel (hospedagem) e Google (login).

### Limites da evidência

- Não foi verificado se existem saldos negativos reais; os dados reais ficam em `local/` e não foram abertos (G3).
- Não foi verificada a documentação atual do Google sobre exigências da tela de consentimento em produção.
- Não foi levantado o que o responsável quer informar como controlador e contato nos textos legais.

## Resultado desejado

- **BL-005:** a distribuição por ativo mostra a carteira inteira (100%) em rosca SVG renderizada no servidor, com legenda em HTML responsivo com nome completo, percentual e valor, sem truncar nomes no celular, e preserva a tabela equivalente e a preferência "Ocultar valores".
- **BL-006:** `/ativos` tem botão primário de novo ativo no topo, cadastro em `/ativos/novo` e abas "Em uso" e "Desativados" com contadores, com lista densa no celular.
- **BL-011:** existe `/novidades` para todos os perfis, com a versão corrente (a do `package.json`), data e notas em linguagem simples, linkada na navegação.
- **BL-012:** existem `/privacidade` e `/termos` públicos, linkados em `/entrar` e nos menus, com texto revisado pelo responsável, e o roteiro para publicar a tela de consentimento está pronto, sem que o agente execute a ação no console do Google.

## Hipóteses

- **H1.** Páginas públicas estáticas fora do grupo `(app)` não tocam G2, porque não leem dados nem alteram autenticação (evidência: `proxy.ts`, `sessao.ts`, `/entrar`). A confirmar no plano com a lista exata de arquivos.
- **H2.** O percentual de participação se calcula melhor com inteiros sobre centavos, para evitar erro de ponto flutuante. A confirmar na decisão do Q1.
- **H3.** A rosca cabe nas seis cores do `DESIGN.md` se o gráfico tiver no máximo seis fatias (cinco maiores e "Outros") e a legenda listar todos os ativos, com "Outros" expansível.
- **H4.** Com o ciclo já completo, o BL-011 pode criar uma regra de processo (toda release traz nota) sem mudar o nível; isso só entra se o responsável quiser.
- **H5.** Os quatro itens são independentes entre si em código; só BL-011 e BL-012 compartilham o ponto de edição da navegação (`navegacao.tsx`).

## Alternativas

**BL-005 — como mostrar o percentual** (exemplo com três ativos de R$ 100,00 cada; o padrão do app é duas casas):

| Alternativa | Resultado | Efeito |
| :-- | :-- | :-- |
| A. Arredondar cada parte isoladamente | 33,33% + 33,33% + 33,33% = 99,99% | Simples e fiel a cada parte, mas a soma não fecha em 100%. |
| B. Maior resto (as partes somam 100,00%) | 33,34% + 33,33% + 33,33% = 100,00% | A soma fecha, mas um ativo igual aos outros mostra um valor diferente. |
| C. Uma casa decimal | 33,3% + 33,3% + 33,3% = 99,9% | Mais legível, mas foge da precisão de duas casas usada no resto do app. |

**BL-005 — saldo negativo** (exemplo: dois ativos, +R$ 1.000,00 e −R$ 200,00; patrimônio líquido de R$ 800,00):

| Alternativa | Resultado |
| :-- | :-- |
| A. Percentuais sobre o patrimônio líquido | 125,00% e −25,00%: a rosca não representa fatia negativa. |
| B. Rosca só com saldos positivos; o negativo fica fora do desenho e listado à parte | 100,00% do desenhado; o ativo negativo aparece na legenda sem percentual. |
| C. Recusar o desenho e mostrar só a tabela quando houver saldo negativo | Nenhuma conta nova, mas perde a visualização. |

**BL-005 — gráfico:** manter cinco maiores mais "Outros" com "Outros" expansível; ou mostrar todos os ativos na legenda e agrupar na rosca só o que passa de seis cores.

**BL-006 — abas:** (a) abas por parâmetro na URL, lidas no servidor, sem JavaScript; (b) controle cliente com estado local. A opção (a) segue o espírito do ADR-005 e preserva o link. Como não há componente de abas, ele passa a ser parte do design system.

**BL-011 — fonte das notas:** (a) arquivo versionado escrito à mão, com versão lida do `package.json`; (b) derivar do `CHANGELOG.md` (técnico, descartado como único recurso pelo critério "linguagem não técnica"); (c) misto, com notas escritas à mão e link para o changelog.

**BL-012 — texto legal:** (a) redigido pelo agente a partir dos fatos do repositório e revisado por você; (b) redigido por você ou por quem você indicar. Em qualquer caso, o agente não dá parecer jurídico.

## Riscos e restrições

- **G1 (BL-005):** os percentuais são números novos derivados de saldos. O plano precisa de casos de referência com entradas e valores esperados calculados de forma independente e de atualização da KB-004. Qualquer escolha entre A, B ou C é sua.
- **G3:** fixtures, exemplos e prints do ciclo usam nomes e valores fictícios. Os textos de privacidade e as notas de versão não contêm dados do usuário. O contato público do controlador é dado pessoal do responsável, publicado só se você decidir.
- **Acessibilidade:** a cor não pode ser a única diferença na rosca; a legenda carrega nome e percentual, e a tabela "Ver os números" continua existindo. Nomes longos não podem ser cortados no celular (375 px).
- **Ocultar valores:** a rosca e a legenda precisam respeitar a preferência já na renderização do servidor. Falta decidir se os percentuais também somem (eles não são monetários, mas revelam a composição).
- **Regras vivas:** o BL-005 exige emendar ou substituir o ADR-005 e atualizar o `DESIGN.md` (quinto tipo de gráfico), e o BL-006 exige descrever o controle de abas no `DESIGN.md`.
- **Ação externa (BL-012):** publicar a tela de consentimento muda o roteiro da KB-002 (GC2, GC4, P2 e armadilha 7). A ação é sua, no console do Google, e o agente só confere o que for acessível por leitura.
- **Sem backend (previews):** as páginas autenticadas mostram `PreviewNotice`. É preciso definir se as páginas públicas aparecem normalmente nesse caso.

## Perguntas em aberto

Decisões que precisam da sua resposta antes do plano:

1. **Q1 (BL-005, G1):** qual regra de percentual: A, B ou C acima? E o cálculo usa inteiros sobre centavos?
2. **Q2 (BL-005):** como tratar saldo negativo (alternativas A, B ou C acima) e o ativo de sistema "Em trânsito", que hoje entra se tiver saldo diferente de zero? Você sabe se isso já ocorre?
3. **Q3 (BL-005):** manter cinco maiores mais "Outros" ou mostrar todos na legenda? "Outros" fica retrátil com a lista dos componentes?
4. **Q4 (BL-005):** os percentuais também ficam ocultos quando "Ocultar valores" está ligado?
5. **Q5 (BL-005):** aceita registrar a rosca como quinto tipo de gráfico, emendando o ADR-005 e o `DESIGN.md`?
6. **Q6 (BL-006):** abas por parâmetro na URL (sem JavaScript) ou controle cliente? Depois de cadastrar em `/ativos/novo`, volta para `/ativos` com aviso (como lançamentos redireciona)?
7. **Q7 (BL-011):** as notas são arquivo escrito à mão? Quem escreve a cada release, e isso vira regra ou fica livre? O histórico começa na versão corrente ou inclui as anteriores (`0.1.0` a `0.5.0`), reescritas em linguagem simples?
8. **Q8 (BL-012):** quem redige o texto legal e o que aparece como controlador e contato público (nome, e-mail)?
9. **Q9 (BL-012):** as páginas públicas aparecem em previews sem backend? Os links vão também no menu autenticado ("Mais", Conta) ou só no login?
10. **Q10 (BL-012):** o Google pode exigir uma página inicial pública com o link da política (hipótese acima). Você aceita que o plano inclua conferir isso no console como parte da ação externa, antes de a implementação assumir que `/entrar` serve?
11. **Q11 (ordem):** o plano deve entregar uma issue por item, com BL-012 primeiro, ou outra sequência?

## Fora do escopo

- Implementar qualquer coisa; esta ideação não autoriza rascunho do plano nem implementação.
- Qualquer mudança nas regras de cálculo existentes (eventos, fechamento, consolidação, retorno, benchmarks).
- Itens BL-007, BL-008 e BL-009 do backlog.
- Alterar o release-please, o formato do `CHANGELOG.md` ou o fluxo de release.
- Executar a publicação da tela de consentimento no Google Cloud (ação do responsável).
- Parecer jurídico sobre os textos.

## Critérios para iniciar o planejamento

- Q1, Q2, Q5, Q8 e Q10 respondidas; as demais podem virar decisão registrada no plano, desde que você as aprove na revisão.
- Critério de descarte: se Q1 ou Q2 ficarem sem decisão, o BL-005 sai do ciclo e os outros três seguem; o ciclo continua completo por escolha, ou o responsável pede nova triagem para nível leve.
- Frase de autorização: "autorizo o rascunho do plano do ciclo 010".

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Ideação registrada — ciclo 010 (completo)
Quem: Responsável
Conferir: Perguntas Q1 a Q11 desta ideação, em especial Q1 e Q2 (regra do percentual e saldo negativo do BL-005, G1), Q5 (ADR-005), Q8 e Q10 (texto legal e página inicial do Google)
Diga: "autorizo o rascunho do plano do ciclo 010"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 010 + idear + novidades_privacidade_ativos_distribuicao + 5cf019089f4465e5e85fa6661966d856fec09922`
- `effect_class`: `local_mutation`
- `state_before` / `state_after`: antes, ciclo `010` apenas declarado como próximo em `cycles.md`, sem ideação, sem branch e sem alteração em `_project/backlog.md`. Depois, `_project/ideations/010_novidades_privacidade_ativos_distribuicao.md` criado e o ciclo `010` reservado em `cycles.md` como `Ideação`, com o próximo ciclo em `011`.
- `result`: `executed`
- `evidence`: arquivo de ideação criado; linha do ciclo `010` e próximo ciclo `011` em `_project/cycles.md`; saída do validador de governança registrada na resposta do turno; nenhum commit, push, issue ou PR criado.
- `blockers`: nenhum para registrar a ideação; as perguntas Q1 a Q11 bloqueiam apenas o rascunho do plano.
