# Baseline de navegação (ciclo 005, issue #52)

Pré-requisitos: Node 24, `npm ci`, Docker/Supabase local iniciado e Chromium do Playwright (`npx playwright install chromium`) ou `PLAYWRIGHT_CHANNEL=chrome`. Não executar junto de outros ensaios, builds ou testes que consumam benchmarks. Nenhuma dependência adicional.

Na raiz do repositório:

```powershell
Remove-Item Env:PLAYWRIGHT_CHANNEL -ErrorAction SilentlyContinue # Chromium fixado pelo Playwright
node tests/e2e/apoio/medir-navegacao.mjs
```

O comando lê as chaves exclusivamente de `npx supabase status -o json`, sem imprimi-las ou gravá-las, define o backend local no processo, faz um build de produção novo e inicia `next start` na porta 3105. A configuração dedicada recusa reutilizar um servidor existente. Não use `next dev`. Não configure produção ou SGS real para este ensaio.

A execução completa tem 18 blocos serializados de rodada/atraso/volume, com 160 amostras por bloco. Cada bloco inicia e encerra seu próprio servidor usando o mesmo build, prepara a mesma carga efetiva e limpa seus cenários, para não depender de um único processo durante todo o protocolo. A primeira renderização de cada servidor é registrada à parte. Início/fim de cada bloco e igualdade das contagens são verificados; o resumo recusa execução parcial ou sem as 18 limpezas. Não há repetição automática nem descarte de bloco falho. Registros locais de ciclo de vida dos processos ajudam a investigar uma interrupção; não contêm mensagens de erro ou ambiente sensível.

O protocolo padrão executa 2.880 amostras: 4 direções prioritárias (Início ↔ Lançamentos e Início ↔ Ativos), 2 volumes, 2 condições, 3 atrasos e 3 rodadas de 20. Revisitas têm cinco ciclos de aquecimento por grupo; primeiras visitas têm contexto novo por amostra, autenticado por cookies de uma sessão de preparo externa ao contexto. A sessão é renovada por login fora do cronômetro antes de cada bloco de rodada/atraso/volume, pois o protocolo inteiro pode ultrapassar a validade de uma sessão local. A origem é aberta antes do cronômetro, sem visitar o destino. Links mantêm seu prefetch normal; não se desabilita cache ou prefetch. A estabilização antes do clique é de 150 ms. O observador acompanha transições do Next e navegações completas, sem consultar propriedades internas do React; `nativa` identifica troca de documento. Viewport 1280 × 900 e concorrência 1.

Os usuários exclusivos `medicao005.*@example.com` recebem carteiras vazia e com 30 ativos/60 meses por RPCs da sessão. O ativo de sistema também é contado. Um benchmark mensal fictício exclusivo é criado pelo apoio SQL local e carregado pela RPC como admin; somente esse benchmark é removido. O teste usa `finally` para limpar cenários após sucesso ou falha, inclusive preparação parcial. Uma interrupção forçada do processo pode impedir `finally`; a próxima execução remove os restos dos mesmos nomes antes de preparar. Não execute duas cópias simultâneas.

O preload `medicao-fetch.mjs` é carregado somente pelo servidor desse comando com `MEDIR_NAVEGACAO=1`. Sem essa opção, ele é inerte. O código de produto não o importa. O atraso de 0/50/100 ms acontece antes de cada chamada ao Supabase local (inclui autenticação e perfil), sem atrasar assets ou preparação de dados. O corpo clonado da resposta é consumido dentro da duração, que inclui transporte e o custo desse apoio; não representa tempo SQL puro. O helper de clonagem do Next fixado pelo projeto evita a clonagem nativa do Undici; a resposta consumida pela aplicação preserva status, cabeçalhos, URL e corpo, conferidos por teste. Nenhuma chamada ao SGS real é permitida.

O relógio do navegador começa no evento real de clique. Um observador por `requestAnimationFrame` exige título visível de destino e marcador específico após a leitura dos dados (gráficos do Início cheio, estado vazio do Início vazio, seção de lançamentos, formulário Novo ativo, links de comparação do catálogo). URL e menu ativo não bastam. O feedback aceita título de destino/carregamento visível; conteúdo pronto pode ser o primeiro feedback. Cada amostra exige destino correto, marcador visível, ausência de alerta de erro em `main` e ausência de exceção não tratada no navegador. O cronômetro sintético atravessa trocas de documento por `sessionStorage`, sem gravar conteúdo financeiro ou de sessão. A região de anúncio de rota do Next.js fica fora dessa checagem. Falha interrompe o ensaio e fica registrada; não é removida como outlier.

Consultas e duração HTTP do servidor usam `AsyncLocalStorage` por pedido e identificador sintético em cookie de teste, com categoria, caminho sem parâmetros, duração e status. Nunca se registram cookies, cabeçalhos, filtros, credenciais ou corpos. Os identificadores são rotacionados antes do retorno de revisita, para não misturar esse retorno com a amostra anterior. Nas primeiras visitas, o identificador abrange origem, prefetch e destino: o total por amostra explicita esse custo da sessão. A série sanitizada mantém cada pedido e suas consultas; assim é possível separar origem, destino e prefetch.

Há também um percurso por Início → Lançamentos → Ativos → Benchmarks → Início, período/filtro, histórico, Conta, Transferências e prévia de fechamento, sem escrita cronometrada. Essas verificações adicionais não constituem três rodadas para as rotas não prioritárias; qualquer otimização delas na unidade C exige ampliar o protocolo antes de comparar.

Os arquivos brutos ficam em `local/issue-52/` (ignorado). O resumo valida matriz completa, ausência de respostas de erro e limpeza; grava `005_validation_series.json` no diretório do ciclo e a tabela em `local/issue-52/tabela.md`. O relatório `005_validation_desempenho.md` acompanha a interpretação dos resultados. Mediana usa a média dos dois valores centrais em n par; p95 usa o posto `ceil(0,95 × n)`. Não há exclusão de amostras lentas. Primeira renderização após iniciar o servidor é separada; o tempo de login não entra nas transições da baseline. A simulação não mede produção nem cold start serverless.

Para conferir o apoio:

```sh
node --test tests/e2e/apoio/medicao-fetch.check.mjs tests/e2e/apoio/resumir-medicao.check.mjs
```

`MEDICAO_PILOTO=1` executa um piloto de uma rodada/uma amostra por condição, somente com 50 ms. Inclui uma navegação completa forçada para verificar que o cronômetro sobrevive à troca de documento. Não gera a baseline publicável e o resumidor o recusa. Remova essa variável para a execução completa. Uma execução substitui os arquivos locais da anterior; preserve-os em outra pasta de `local/` se precisar comparar tentativas. Para comparar baseline/candidata na unidade C, use builds das duas revisões, o mesmo ambiente/dados/condições e alterne as execuções; nenhuma candidata é implementada na unidade A.
