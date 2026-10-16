# Ideação — 005: Logo no cabeçalho mobile e desempenho de navegação

> **Ciclo:** `005`
> **Estado:** `Ideação`
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 005" em 2026-10-15
> **Criado em:** 2026-10-15
> **Última atualização:** 2026-10-15
> **handoff_schema_version:** `2`

## Problema

O cabeçalho mobile não apresenta a marca do produto. A navegação entre telas foi relatada como lenta no encerramento do ciclo 004. Parte relevante da lentidão melhorou após uma mudança regional feita pelo responsável; deseja-se investigar o que ainda pode melhorar no código.

## Contexto e evidências

- `_project/executed/004_telas_produto/004_task_closure.md` encaminhou logo à esquerda no header mobile e diagnóstico/otimização da navegação, preservando autenticação, RLS e coerência D13.
- Relato do responsável em 2026-10-15: Vercel alterada de `iad1` (EUA) para `gru1` (São Paulo), mantendo Supabase em `sa-east-1` (Brasil), com melhora expressiva percebida. Os painéis não foram verificados pelo agente e não há baseline quantitativa pós-mudança.
- `vercel.json` declara o cron, sem região explícita; isso não comprova a região efetiva do deployment.
- `src/app/(app)/layout.tsx` apresenta somente Ocultar valores no header. A marca existente aparece no menu desktop em `src/components/navegacao.tsx`. O contrato de uso está no `design-system/DESIGN.md`, seções 7 e 8.
- `src/lib/sessao.ts` já reutiliza a sessão por pedido com `cache` do React; chama `getUser` e lê o perfil. `src/proxy.ts` renova a sessão com `getClaims`. São etapas distintas, sem evidência de redundância dispensável.
- `src/lib/leitura.ts` pagina com contagem exata e confere marcas antes/depois dos insumos, com até três tentativas. `marcaCarteira` executa consultas em sequência: oportunidade de investigação, sem medição que demonstre seu peso na navegação.
- Inspeção em `EuThiagoAndrade/saldo-futuro`, revisão `59f7498`. Não foram acessados dados reais nem produção autenticada. A KB-003 foi usada como referência do produto.

## Resultado desejado

- Logo à esquerda no header mobile, convivendo com Ocultar valores em 360 px e respeitando proporção, tamanho mínimo, área de proteção e acessibilidade.
- Melhorar navegação com ganho verificável antes/depois no mesmo ambiente e com dados fictícios, considerando a configuração regional atual como contexto.
- Distinguir tempo até feedback visual, tempo até conteúdo disponível e custo de servidor/consultas.
- Preservar resultados financeiros, atualização após escritas, sessão, isolamento e estados de erro/N/D.

## Hipóteses

1. A distância entre aplicação e banco contribuía para a lentidão. A melhora relatada sustenta essa hipótese, sem quantificar o custo restante.
2. Consultas sequenciais podem acumular latência nas marcas de coerência. Medir duração, quantidade e dependências pode revelar paralelismo seguro.
3. Volume de dados e composição das telas podem gerar trabalho repetido; é necessário medir por rota e volume antes de alterar a leitura.
4. O feedback durante transições pode influenciar a percepção de espera. Inspecionar carregamento e prefetch existentes antes de propor mudanças.

## Alternativas

| Alternativa | Benefício esperado | Condição ou critério de descarte |
| :-- | :-- | :-- |
| Reutilizar o logo completo existente no header | Identidade consistente sem novo asset | Descartar composição com overflow, distorção ou controles comprimidos em 360 px |
| Medir e otimizar consultas independentes no código atual | Menor espera preservando arquitetura | Descartar alteração sem ganho reproduzível ou que comprometa D13 |
| Avaliar feedback de carregamento e prefetch | Melhor resposta percebida | Descartar se aumentar carga sem benefício ou mostrar dados antigos sem aviso |
| Avaliar leitura agregada no banco se as medições justificarem | Menos viagens ao banco | Exige escopo no plano, migração aditiva e provas de isolamento/coerência; descartar se solução mais simples bastar |
| Manter fluxos sem gargalo comprovado após a mudança regional | Evitar mudanças sem benefício | Não resolve a ausência do logo; aplicável aos pontos sem ganho demonstrável |

Nenhuma alternativa está aprovada para implementação. A preferência inicial é medir e adotar a menor mudança com benefício demonstrado.

## Riscos e restrições

- G1: preservar as regras da KB-004; aplicabilidade concreta depende da solução. Mudança de cálculo exige decisão explícita e casos independentes de referência.
- G2: preservar proteção por ponto de entrada e RLS. Alterações de sessão, autorização ou funções de acesso exigem provas pertinentes de isolamento. Não usar cache compartilhado entre usuários para dados privados.
- G3: medições, fixtures e evidências somente com dados fictícios, sem tokens, cookies, e-mails ou carteiras reais.
- G4: eventual alteração de banco somente por nova migração.
- Preservar leitura completa, coerência D13, concorrência e invalidação após escrita; não remover garantias para reduzir consultas sem equivalência demonstrada.
- Medição local não equivale à latência de produção. Comparações devem registrar ambiente, volume fictício, rotas, repetições e condições de cache.
- Nenhuma dependência nova demonstrada como necessária. Produção autenticada e configuração externa dependem dos pontos próprios do plano.
- Ciclo completo, sem modo contínuo. A autorização atual cobre somente ideação e reserva documental.

## Perguntas em aberto

1. Após a mudança para `gru1`, quais transições ainda incomodam mais? Ocorre na primeira visita, nas revisitas ou em ambas? A resposta orienta a prioridade; o diagnóstico inicial pode cobrir as rotas principais.
2. A proposta visual inicial é logo completo existente à esquerda e Ocultar valores à direita. Há preferência pelo símbolo isolado?
3. Qual meta quantitativa adotar? O plano deve prever baseline com dados fictícios e critérios mensuráveis antes de aceitar otimizações; ainda não há número comprovado para prometer.
4. Convém explicitar a região em código/documentação operacional? Conferir configuração efetiva antes de propor alteração; nenhuma mudança externa está autorizada aqui.

## Fora do escopo

- Migração de dados de outro produto, novas telas ou capacidades financeiras.
- Mudança de regras financeiras, acesso ou isolamento como atalho de desempenho.
- Redesenho geral, nova marca, modo offline ou alteração de infraestrutura sem evidência e escopo aprovado.
- Implementação, issues, branches, PRs, deploy e verificação autenticada em produção nesta etapa.

## Critérios para iniciar o planejamento

- Autorização explícita para rascunhar o plano do ciclo 005.
- Delimitar logo e desempenho, incluindo diagnóstico antes da escolha das otimizações.
- Incorporar respostas disponíveis e manter incertezas restantes explícitas, com medição e decisão antes de mudanças dependentes delas.
- Definir protocolo antes/depois, critérios de aceite, regressões pertinentes e pontos de aprovação.
- Manter a mudança regional como evidência humana, sem apresentar configuração externa ou ganho quantitativo como verificados.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Ideação registrada — ciclo 005 (completo)
Quem: Responsável
Conferir: Perguntas e decisões em _project/ideations/005_logo_mobile_desempenho_navegacao.md
Diga: "autorizo o rascunho do plano do ciclo 005"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 005 + idear + logo_mobile_desempenho_navegacao + 59f7498`
- `effect_class`: `local_mutation`
- `state_before`: ciclo 005 proposto, sem reserva ou ideação; próximo ciclo 005.
- `state_after`: ciclo 005 reservado como Ideação; próximo ciclo 006; aguardando autorização do rascunho.
- `result`: `executed`
- `evidence`: este artefato e registro do ciclo 005 em `_project/cycles.md`; autorização humana reproduzida no cabeçalho.
- `blockers`: nenhum para registrar a ideação; perguntas e baseline quantitativa permanecem abertas para o planejamento.
