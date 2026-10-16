# Task — Issue #52: Medir navegação e estabelecer baseline com dados fictícios

> **Ciclo:** `005`
> **Trilha:** `normal`
> **Estado:** `Em andamento`
> **Tipo:** `chore`
> **Issue:** `#52`
> **Plano:** `_project/drafts/005_logo_mobile_desempenho_navegacao/005_plan.md`
> **Branch:** `chore/issue-52`
> **PR:** —
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #52" em 2026-10-15
> **Modo contínuo:** `—`
> **Início:** 2026-10-15
> **Última atualização:** 2026-10-15
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
- [ ] Protocolo, baseline e gates executados.
- [ ] Staging revisado e PR publicada.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | Pendente |
| Validador | Pendente |
| `git diff --check` | Pendente |
| Checks remotos | Pendente |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

Workflow `.agent/workflows/implementar_issue.md`, template `.agent/templates/task.md`, template da PR e gate governance-check lidos no ponto de uso, junto das autoridades canônicas, lições, KB-003, ADR-001/002/003 e plano v1. Nenhuma nova dependência. Supabase local e Docker disponíveis; não acessar projeto remoto vinculado.

Pilotos preparatórios identificaram/corrigiram diretório de trabalho da configuração, uso do Chrome instalado, exclusão do anúncio de rota do Next da checagem de erros, marcador específico do formulário Novo ativo (há formulários em diálogos ocultos) e espera de hidratação do Link antes do clique. O piloto completo passou em 1,7 min, incluindo filtros/histórico/percurso adicional e limpeza. Seus dados não são a baseline. A primeira tentativa completa foi interrompida integralmente para renovar a sessão por bloco fora do cronômetro, antes de ultrapassar o `jwt_expiry = 3600` local; arquivos preservados somente em `local/issue-52/ensaio-interrompido-sessao/`. A próxima execução limpa os nomes exclusivos remanescentes; nenhuma amostra dessa tentativa compõe a baseline final.

Verificações já executadas: `npm ci` (409 pacotes; cinco vulnerabilidades altas reportadas nas dependências fixadas, sem atualização fora do escopo); lint sem erro (três avisos preexistentes em script ignorado de `local/`); typecheck passou; 201 testes unitários; 239 asserções pgTAP; quatro testes nativos do apoio (estatísticas, opt-in, recusa de backend remoto, atraso/resposta/correlação/sanitização); 39 testes de governança com TEMP/TMP local; validador 0 erros/0 avisos; `git diff --check` limpo. Banco/fixture de desempenho e gates finais ainda em curso, sem resultado presumido.

Build e E2E sem backend passaram (13 testes e 71 skips previstos). A tentativa monolítica seguinte perdeu o servidor com 576 amostras; registrou uma falha de conexão e limpeza concluída, sem publicar estatística parcial. Causa não confirmada por logs do processo/sistema. Evidências somente em `local/issue-52/ensaio-falha-servidor/`. O apoio passou a executar 18 blocos serializados de rodada/atraso/volume, cada um com servidor novo no mesmo build, contagens idênticas e limpeza própria. Mantém todas as 2.880 amostras, condições e aquecimentos do plano; registra primeiros renders/reinícios à parte e recusa bloco ausente/falho. Não altera o código de produto, o CI normal ou o escopo das outras unidades.

A primeira execução por blocos completou dois blocos/320 amostras, mas uma checagem de propriedade interna de hidratação do React falhou na preparação de uma amostra do terceiro bloco. Tentativa inteira preservada somente em `local/issue-52/ensaio-falha-hidratacao/`, com falha e limpeza registradas. A checagem interna foi removida: o observador usa relógio monotônico com `timeOrigin` e preserva apenas o cronômetro sintético entre documentos, registrando `nativa` quando o clique faz navegação completa. Isso permite medir o clique real sem perder o relógio por troca de documento, sem excluir erro de navegador ou modificar o Link do produto. O piloto verifica também uma navegação completa forçada; erros não tratados no navegador invalidam a amostra. Nenhuma série parcial dessas tentativas vira resultado final.

Outra tentativa no Chrome instalado terminou com timeout de conteúdo no retorno ao Início: URL correta, sem h1/main de destino e sem resposta HTTP de erro capturada. Registros em `local/issue-52/ensaio-falha-marcador/`; causa não confirmada. O bloco isolado de 160 amostras da carteira cheia/0 ms passou em 2 min sem reproduzir a falha. O apoio passou a guardar diagnóstico de marcador e exceções do navegador somente em `local/`, sem copiar esses textos/imagens para as séries. Instalado o Chromium já fixado pelo Playwright do projeto (`npx playwright install chromium`), sem alterar dependências, para usar o mesmo runtime do CI na coleta final. Isso não é apresentado como correção de produto nem como prova da causa das falhas preparatórias. Piloto completo com troca de documento forçada passou nos dois volumes.

No Chromium fixado, a queda repetiu como `ERR_CONNECTION_RESET`, e o registro de ciclo de vida capturou saída nativa do processo Next/Node com código `-1073740791` (`0xC0000409`), em `local/issue-52/ensaio-falha-processo/`. Isso distingue a indisponibilidade de um simples tempo de navegação lento, sem afirmar a causa nativa. A inspeção do Next fixado mostrou que ele próprio evita `Response.clone()` por um problema do Undici (`dedupe-fetch.js`/`clone-response.js`). O preload passou a reutilizar esse helper existente, sem nova dependência; teste independente agora confere corpo, status 206, cabeçalho e URL, além de atraso/correlação/sanitização. Hipótese a validar na coleta completa, sem alterar fonte, proteção, banco ou cálculo do produto. Erros de preparação/aquecimento também passam a registrar falha do bloco e impedir publicação de série parcial.

O bloco isolado de 160 amostras/50 ms passou com essa clonagem em 4 min, mas a queda nativa repetiu na tentativa completa com Node 24.15.0. Portanto, a clonagem não foi declarada causa ou solução da falha. Localizado outro Node 24 já disponível (24.19.0), compatível com o projeto, para comparação de runtime. O comando de medição passou a executar checks/build/Playwright/servidor com o próprio `process.execPath`, evitando mistura silenciosa do Node registrado com outro selecionado por shims npm/npx. O log de ciclo de vida registra a versão efetiva do processo; nenhum pacote, configuração de produto ou dependência foi alterado por essa escolha de runtime. Coleta válida continua pendente até passar integralmente.

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
- `effect_class`: `local_mutation`
- `state_before`: plano Aprovado; ciclo Planejamento; issue #52 aberta; sem branch/task/PR correspondente nas consultas.
- `state_after`: branch chore/issue-52 e task Em andamento; autorização individual registrada; execução da unidade A iniciada.
- `result`: `executed`
- `evidence`: autorização humana acima, issue #52 OPEN, PR #51 MERGED e base conferidas via gh/Git; task e branch locais.
- `blockers`: nenhum identificado no início; resultados dos ensaios e gates pendentes.
