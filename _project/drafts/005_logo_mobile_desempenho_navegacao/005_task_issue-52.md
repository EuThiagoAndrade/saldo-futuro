# Task — Issue #52: Medir navegação e estabelecer baseline com dados fictícios

> **Ciclo:** `005`
> **Trilha:** `normal`
> **Estado:** `Em andamento`
> **Tipo:** `chore`
> **Issue:** `#52`
> **Plano:** `_project/drafts/005_logo_mobile_desempenho_navegacao/005_plan.md`
> **Branch:** `chore/issue-52`
> **PR:** [#55](https://github.com/EuThiagoAndrade/saldo-futuro/pull/55)
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #52" em 2026-10-15
> **Modo contínuo:** `—`
> **Início:** 2026-10-15
> **Última atualização:** 2026-10-16
> **handoff_schema_version:** `2`

## Objetivo

Executar a unidade A do plano aprovado: protocolo optativo e baseline local por clique, sem otimizar produto.

## Escopo autorizado

Issue https://github.com/EuThiagoAndrade/saldo-futuro/issues/52 e item 1 do plano v1, integrado pela PR #51 (9914a907e91d9487c9ba9543bafff71a7dbf8e5e). Somente apoio de ensaio e relatório sanitizado; nenhuma implementação de #53/#54.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim, preservação | Fixtures pelas RPCs existentes; casos financeiros existentes, contagens completas e nenhum cálculo de produto alterado. |
| G2 — isolamento por RLS | Sim | Somente backend local; cenários com sessão própria, RPCs como usuário e pgTAP existente. Nenhuma proteção removida. |
| G3 — privacidade de dados | Sim | Somente dados fictícios; métricas sem payload, cookies ou credenciais; artefatos locais ignorados antes da sanitização. |
| G4 — migrações só acrescentam | Não se aplica | Nenhuma migração prevista ou alterada. |

## Execução

- [x] Issue OPEN, autorização, plano aprovado e PR #51 MERGED conferidos via gh; HEAD e origin/main iguais à base integrada.
- [x] Branch criada preservando mudanças preexistentes de cycles.md, plano e handoff das issues.
- [x] Protocolo e baseline local concluídos: 2.880 amostras, 144 grupos completos, zero falhas e limpeza dos 18 blocos confirmada; resultados em `005_validation_desempenho.md` e série sanitizada preservada em `005_validation_series.md` como gzip/Base64.
- [x] Gates locais independentes repetidos em 2026-10-16: lint (0 erros, três avisos preexistentes em `local/`), typecheck, 201 testes unitários, 39 testes de governança, 239 pgTAP e cinco checks do apoio.
- [x] Build de produção e E2E sem backend: build Next 16.4 passou; 13 testes passaram e 71 skips previstos.
- [x] E2E autenticado/D9 no Supabase local: 78 testes passaram, seis skips esperados; D9 mediana 478 ms (348, 429, 478, 480, 495), limite 1.000 ms; dados fictícios limpos.
- [x] Governança final, privacidade e revisão do diff: validador 0 erros/avisos, 39 testes de governança, 265.157 campos sem sinais sensíveis e `git diff --check` limpo.
- [x] Staging seletivo revisado e commit `ebc393f` criado e enviado para `origin/chore/issue-52`.
- [x] PR #55 aberta para a base `main`, vinculada à issue #52 e anexada a esta task.
- [ ] Checks remotos do HEAD final e preview; merge aguarda aprovação explícita.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | 201 unitários, 239 pgTAP, 39 testes de governança, cinco checks do apoio, 13 E2E sem backend (71 skips esperados), 78 E2E locais (seis skips esperados), D9 com mediana 478 ms e matriz de 2.880 amostras passaram. |
| Build | Build de produção local passou após reduzir a evidência a gzip/Base64 em Markdown canônico, em Next 16.4.0; compilação, TypeScript e 20 páginas estáticas concluídos. Diagnóstico confirmado: série Markdown JSON de 6,1 MB levava o scanner Tailwind a tentar alocar 8 GiB. Com o payload codificado, a varredura completa terminou em 70 ms, com 241 arquivos; o documento permanece incluído e a série original foi preservada byte a byte após extração. |
| Validador | 0 erros e 0 avisos após as alterações finais (2026-10-16); quatro itens permanecem para conferência manual de referências, privacidade, barreiras e autorização. |
| `git diff --check` | Limpo após as alterações finais (2026-10-16), incluindo conferência de whitespace no relatório novo. |
| Privacidade G3 | Revisão manual e varredura dos 265.157 campos da série sem credenciais, cookies, emails ou valores; a extração gzip/Base64 foi comparada byte a byte com a série original. `valores_benchmark` é somente o nome da categoria de tabela. |
| Checks remotos | Em execução após publicação da PR #55; estados conferidos no HEAD `ebc393f` (CI, governança, banco/E2E autenticado e preview pendentes no primeiro snapshot). |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

Workflow `.agent/workflows/implementar_issue.md`, template `.agent/templates/task.md`, template da PR e gate governance-check lidos no ponto de uso, junto das autoridades canônicas, lições, KB-003, ADR-001/002/003 e plano v1. Nenhuma nova dependência. Supabase local e Docker disponíveis; não acessar projeto remoto vinculado.

Ao retomar, o scanner nativo `@tailwindcss/oxide` confirmou que o relatório bruto `.md` de 6.110.052 bytes fazia a varredura automática tentar alocar 8 GiB e falhar. O JSON foi preservado byte a byte com gzip/Base64 no mesmo artefato documental permitido. A varredura completa do documento final (738.593 bytes) concluiu em 70 ms, com 241 arquivos. Nenhum CSS, código de produto ou conteúdo da evidência foi descartado. O responsável confirmou aguardar o gate local completo antes da PR.

Pilotos preparatórios identificaram/corrigiram diretório de trabalho da configuração, uso do Chrome instalado, exclusão do anúncio de rota do Next da checagem de erros, marcador específico do formulário Novo ativo (há formulários em diálogos ocultos) e espera de hidratação do Link antes do clique. O piloto completo passou em 1,7 min, incluindo filtros/histórico/percurso adicional e limpeza. Seus dados não são a baseline. A primeira tentativa completa foi interrompida integralmente para renovar a sessão por bloco fora do cronômetro, antes de ultrapassar o `jwt_expiry = 3600` local; arquivos preservados somente em `local/issue-52/ensaio-interrompido-sessao/`. A próxima execução limpa os nomes exclusivos remanescentes; nenhuma amostra dessa tentativa compõe a baseline final.

Na preparação dos ensaios, `npm ci` instalou 409 pacotes (cinco vulnerabilidades altas reportadas nas dependências fixadas, sem atualização fora do escopo); lint não teve erros (três avisos preexistentes em script ignorado de `local/`), typecheck passou, 201 testes unitários, 239 asserções pgTAP, quatro checks iniciais do apoio e 39 testes de governança com TEMP/TMP local passaram. Naquele ponto, banco/fixture de desempenho e gates finais ainda estavam em curso; os resultados finais estão registrados acima.

Build e E2E sem backend passaram (13 testes e 71 skips previstos). A tentativa monolítica seguinte perdeu o servidor com 576 amostras; registrou uma falha de conexão e limpeza concluída, sem publicar estatística parcial. Causa não confirmada por logs do processo/sistema. Evidências somente em `local/issue-52/ensaio-falha-servidor/`. O apoio passou a executar 18 blocos serializados de rodada/atraso/volume, cada um com servidor novo no mesmo build, contagens idênticas e limpeza própria. Mantém todas as 2.880 amostras, condições e aquecimentos do plano; registra primeiros renders/reinícios à parte e recusa bloco ausente/falho. Não altera o código de produto, o CI normal ou o escopo das outras unidades.

A primeira execução por blocos completou dois blocos/320 amostras, mas uma checagem de propriedade interna de hidratação do React falhou na preparação de uma amostra do terceiro bloco. Tentativa inteira preservada somente em `local/issue-52/ensaio-falha-hidratacao/`, com falha e limpeza registradas. A checagem interna foi removida: o observador usa relógio monotônico com `timeOrigin` e preserva apenas o cronômetro sintético entre documentos, registrando `nativa` quando o clique faz navegação completa. Isso permite medir o clique real sem perder o relógio por troca de documento, sem excluir erro de navegador ou modificar o Link do produto. O piloto verifica também uma navegação completa forçada; erros não tratados no navegador invalidam a amostra. Nenhuma série parcial dessas tentativas vira resultado final.

Outra tentativa no Chrome instalado terminou com timeout de conteúdo no retorno ao Início: URL correta, sem h1/main de destino e sem resposta HTTP de erro capturada. Registros em `local/issue-52/ensaio-falha-marcador/`; causa não confirmada. O bloco isolado de 160 amostras da carteira cheia/0 ms passou em 2 min sem reproduzir a falha. O apoio passou a guardar diagnóstico de marcador e exceções do navegador somente em `local/`, sem copiar esses textos/imagens para as séries. Instalado o Chromium já fixado pelo Playwright do projeto (`npx playwright install chromium`), sem alterar dependências, para usar o mesmo runtime do CI na coleta final. Isso não é apresentado como correção de produto nem como prova da causa das falhas preparatórias. Piloto completo com troca de documento forçada passou nos dois volumes.

No Chromium fixado, a queda repetiu como `ERR_CONNECTION_RESET`, e o registro de ciclo de vida capturou saída nativa do processo Next/Node com código `-1073740791` (`0xC0000409`), em `local/issue-52/ensaio-falha-processo/`. Isso distingue a indisponibilidade de um simples tempo de navegação lento, sem afirmar a causa nativa. A inspeção do Next fixado mostrou que ele próprio evita `Response.clone()` por um problema do Undici (`dedupe-fetch.js`/`clone-response.js`). O preload passou a reutilizar esse helper existente, sem nova dependência; teste independente agora confere corpo, status 206, cabeçalho e URL, além de atraso/correlação/sanitização. Hipótese a validar na coleta completa, sem alterar fonte, proteção, banco ou cálculo do produto. Erros de preparação/aquecimento também passam a registrar falha do bloco e impedir publicação de série parcial.

O bloco isolado de 160 amostras/50 ms passou com essa clonagem em 4 min, mas a queda nativa repetiu na tentativa completa com Node 24.15.0. Portanto, a clonagem não foi declarada causa ou solução da falha. Localizado outro Node 24 já disponível (24.19.0), compatível com o projeto, para comparação de runtime. O comando de medição passou a executar checks/build/Playwright/servidor com o próprio `process.execPath`, evitando mistura silenciosa do Node registrado com outro selecionado por shims npm/npx. O log de ciclo de vida registra a versão efetiva do processo; nenhum pacote, configuração de produto ou dependência foi alterado por essa escolha de runtime. Coleta válida continua pendente até passar integralmente.

## Resultado da coleta completa — 15/10/2026

Com Node v24.19.0 e Chromium Playwright 156.0.8078.4, os 18 blocos terminaram no mesmo build e nas mesmas contagens de fixture: 2.880 amostras, 144 grupos completos, zero erros de resposta/navegação e 18 limpezas confirmadas. A série foi sanitizada; o relatório registra medianas, p95, observações e a limitação de deduplicação do Next. Duas navegações completas de documento foram preservadas nos dados. Não houve mudança em produto ou otimização. A pedido do responsável, a execução foi encerrada depois de obter uma conclusão. O build separado para repetir os gates foi interrompido; E2E autenticado final, revalidação de governança e publicação da PR continuam pendentes.

Em 2026-10-16, os gates locais finais passaram: lint (sem erros, três avisos preexistentes em `local/`), typecheck, 201 unitários, 239 pgTAP, 39 testes de governança, cinco checks do apoio, 13 E2E sem backend, build de produção e 78 E2E autenticados com seis skips previstos. D9 mediu mediana de 478 ms, abaixo do limite de 1.000 ms. A série completa foi preservada byte a byte em gzip/Base64 dentro do Markdown canônico; a varredura completa levou 70 ms e o build concluiu. O responsável pediu aguardar os gates locais antes da PR; essa condição está atendida. Commit `ebc393f` enviado; PR #55 criada e checks remotos em execução. O merge permanece pendente de checks verdes e aprovação explícita.

## Encerramento

Não se aplica.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Pronto para continuar — ciclo 005 (completo)
Quem: Qualquer ferramenta, a pedido do responsável
Conferir: —
Diga: "continue o ciclo 005"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 005 + implementar_issue + 52/A_baseline_navegacao + 9914a907e91d9487c9ba9543bafff71a7dbf8e5e`
- `effect_class`: `remote_mutation`
- `state_before`: plano Aprovado; ciclo Em execução; issue #52 aberta; baseline completa; task Em andamento; sem PR; gate autenticado/D9 e bloco canônico final pendentes.
- `state_after`: task Em andamento; série preservada byte a byte em gzip/Base64 no Markdown canônico após diagnóstico e mitigação da falha de alocação do scanner; build e gates locais passaram; commit `ebc393f` enviado e PR #55 aberta; checks remotos pendentes.
- `result`: `executed`
- `evidence`: autorização inicial da issue #52; decisão mais recente do responsável de aguardar os gates locais completos antes da PR; baseline em `005_validation_desempenho.md`/`005_validation_series.md`; build passou; scan após gzip/Base64 completou em 70 ms; unitários 201, pgTAP 239, checks de apoio 5, E2E sem backend 13, E2E local 78; D9 mediana 478 ms; commit `ebc393f`; PR https://github.com/EuThiagoAndrade/saldo-futuro/pull/55 aberta; checks observados em andamento.
- `blockers`: checks remotos ainda pendentes; merge exige aprovação explícita depois de ficarem verdes.
