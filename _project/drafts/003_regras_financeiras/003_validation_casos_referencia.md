# Validação dos casos de referência — ciclo 003

> **Ciclo:** `003`
> **Issue:** `#26`
> **Data:** 2026-10-14
> **Objeto:** casos `CR-01` a `CR-50` da KB-004 (`_project/knowledge/KB-004_regras_financeiras.md`) e `tests/fixtures/financeiro/casos_referencia.json`

Registro exigido por D12 e P17: o recálculo por outra ferramenta ou modelo, feito sem ver os valores esperados, e a conferência do responsável numa planilha. Toda divergência é resolvida e registrada aqui antes do merge da PR da issue #26.

## 1. Recálculo independente

### Quem e como

- **Autor dos esperados:** Claude (Claude Code, Opus 5.5), com frações exatas em Python para os valores de máquina e o passo a passo na KB.
- **Recalculador:** Claude Sonnet, outro modelo, executado como subagente sem acesso ao repositório. Ele declarou não ter aberto, listado nem buscado nada no repositório.
- **O que recebeu:**
  - só as seções 1 a 10 da KB-004 (regras), sem as seções 11 a 14 (rastreabilidade, decisões K com exemplos e casos);
  - as entradas do JSON, com a lista das chaves pedidas e sem os valores esperados.
- **Limite da independência:** a seção 2 das regras cita dois exemplos de arredondamento (0,125 → 0,13 e 0,01005 → 1,01%), que também aparecem no CR-38; eles vêm dos critérios de aceite do plano.
- **Método:** script Python próprio, com `fractions.Fraction` e inteiros nos valores exatos e `float64` só nas divisões finais e nas composições de taxas.
- **Comparação:** pelo autor, com igualdade exata para centavos, textos e resultados de operação, e erro de até 10⁻⁹ × max(1, |esperado|) para razões.

### Resultado

| Rodada | Valores comparados | Iguais | Divergências |
| :-- | :-- | :-- | :-- |
| 1 | 250 | 246 | 4 |
| 2, depois das resoluções abaixo | 250 | 248 | 2, só de notação (CR-16) |

### Divergências e resoluções

| Caso | Divergência | Causa | Resolução |
| :-- | :-- | :-- | :-- |
| CR-02 `rendimento` | Esperado 12.345; recalculado −798.155 | Entrada ambígua: o caso não informava saldo real. O recalculador supôs saldo real 0 e somou o ajuste ao componente, como manda a seção 5 | Entrada corrigida: saldo real 810.500, igual ao calculado (ajuste zero). Na rodada 2, o recálculo deu 12.345. Valor esperado mantido |
| CR-50 `q15` | Esperado `recusado`; recalculado `recusado_faixa` | O esperado ignorava o motivo que a seção 3 nomeia para valor fora da faixa | Esperado corrigido para `recusado_faixa` na KB e no JSON. A regra não mudou |
| CR-16 `posicoes_apos_reabrir` | Esperado `0`; recalculado `[]` | Notação: contagem contra lista vazia | Mesmo significado (nenhuma posição). Mantido `0` |
| CR-16 `consolidado_apos_reabrir` | Esperado `inexistente`; recalculado `null` | Notação | Mesmo significado (consolidado removido). Mantido `inexistente` |

Nenhuma divergência de cálculo. As ambiguidades que o recalculador relatou foram:

- motivo das recusas de lançamento e do primeiro fechamento (CR-06), que a KB não nomeia e o caso espera como `recusado`;
- estado sem mês fechado depois de reabrir o primeiro mês (CR-06);
- composição em `float64` dos acumulados (CR-32 a CR-37, CR-44 a CR-47), com ruído de cerca de 10⁻¹⁶, dentro da tolerância.

Todas foram interpretadas como a KB especifica.

Divergências abertas: **nenhuma**.

## 2. Conferência do responsável

### Execução e resultado

- **Data:** 2026-10-14 (America/Cuiaba).
- **Execução:** Codex desktop, GPT-6, por delegação expressa do responsável neste chat: "Faça a conferencia referente ao ciclo 003 [...] na planilha" e "Se necessário pode criar uma planilha de conferência e os resultados colocar no item ## 2. Conferência do responsável do arquivo 003 validação de casos de referência."
- **Resultado:** conferência solicitada concluída: **47 casos, 250 resultados conferidos, nenhuma divergência aberta**. Este registro identifica a execução pelo agente; não atribui ao responsável uma conferência manual pessoal nem aprovação do merge.
- **Cobertura:** CR-01 a CR-18, CR-20 a CR-38, CR-40 a CR-48 e CR-50, exatamente os 47 casos existentes. CR-19, CR-39 e CR-49 não existem na KB/fixture; não foram inventados nem contados como conferidos.
- **Planilha:** [003_conferencia_casos_referencia.xlsx](../../../local/validacao-ciclo-003/outputs/01a13ba5-27e9-7053-9bae-0d17250797a7/003_conferencia_casos_referencia.xlsx), mantida em `local/`, ignorado pelo Git. Contém somente dados fictícios dos casos.

| Data | Casos conferidos | Divergências | Resolução |
| :-- | :-- | :-- | :-- |
| 2026-10-14 | Todos os 47 casos existentes; 250 resultados | Nenhuma em relação à KB/fixture | Sem alteração de regras, entradas ou esperados; diferenças de ponto flutuante dentro da tolerância |

### Método e limites

1. **Fontes e independência.** Aplicadas as regras das seções 1 a 10 da KB-004, incluindo as decisões K registradas, às entradas de `casos_referencia.json`. Os cálculos foram reconstruídos em uma planilha nova, sem importar módulos financeiros da aplicação. O construtor recebe somente entradas, títulos e regras; os esperados são acrescentados à aba de comparação depois de construir os cálculos. Esta conferência teve acesso à KB e aos esperados durante a inspeção e **não é um segundo recálculo cego**; o recálculo cego anterior permanece na seção 1.
2. **Organização.** `Entradas` preserva os campos de origem; `Calculos` apresenta saldos, fluxos, ajustes, numerador/denominador do Dietz, composição, índices e condições; `Inteiros exatos` trata os montantes extremos; `Conferencia` compara cada uma das 250 chaves com o esperado. As colunas D/E são esperado/recalculado, F é o resultado e G o erro absoluto das razões. Para montantes extremos, H/I repetem o texto exato com o prefixo `c:`, evitando que o preview o apresente em notação científica.
3. **Centavos e estados.** Igualdade exata para os 93 resultados inteiros e para os 113 resultados textuais, listas e booleanos. Nos CR-07 a CR-11 e no parser, os valores grandes ficam como cadeias decimais e são somados/subtraídos em quatro blocos de seis algarismos, com transporte inteiro em base 1.000.000. O subtotal acima de 64 bits do CR-08 é preservado antes do cancelamento. Não se usa uma soma monetária em ponto flutuante fora da faixa exata.
4. **Razões e índices.** Os 44 resultados desta categoria usam a tolerância do plano: `1e-9 × max(1, |esperado|)`. Índices base 100 são comparados como índices, inclusive quando o esperado é inteiro (110 e 88). Maior erro absoluto observado: **2,842170943040401 × 10⁻¹⁴**, no índice final do CR-36; nenhum ultrapassou a tolerância. Numerador e denominador do Dietz foram calculados como inteiros antes da divisão.
5. **Apresentação e parser.** Os 14 textos do CR-38 foram conferidos por arredondamento decimal simétrico, sobre a representação curta de `float64`, deslocando a vírgula por texto para percentuais, como exige a KB. As capturas decimais e os indicadores de validade sintática do CR-50 foram derivados das entradas pelo construtor; as fórmulas da planilha completam o arredondamento e a composição/faixa dos centavos. A planilha é evidência dos fixtures fixados: mudanças na sintaxe, nos eventos ou nas capturas exigem regenerá-la, pois nem toda validação estrutural é uma fórmula dinâmica.
6. **Verificação do arquivo.** Recálculo pelo motor `@oai/artifact-tool`, inspeção visual das quatro abas e varredura sem erro de fórmula. Uma alteração temporária de +1 centavo em Vf do CR-20 mudou o retorno de 0,009523809523809525 para 0,009524761904761904; a entrada foi restaurada e o valor original reconferido antes da exportação. O XLSX exportado teve os 250 resultados em cache e as fórmulas correspondentes conferidos no XML, sem células de erro; os montantes extremos continuaram textuais e exatos. Não foi executado recálculo no aplicativo Microsoft Excel. Esta etapa também não valida as futuras implementações TypeScript/PostgreSQL das issues B a D.

### Rastreabilidade por caso

Os intervalos abaixo incluem os esperados, os recalculados, o resultado da comparação e o erro absoluto quando aplicável.

| Caso | Resultados | Intervalo na planilha | Resultado |
| :-- | --: | :-- | :-- |
| CR-01 | 10 | `Conferencia!D9:G18` | Confere |
| CR-02 | 7 | `Conferencia!D19:G25` | Confere |
| CR-03 | 6 | `Conferencia!D26:G31` | Confere |
| CR-04 | 9 | `Conferencia!D32:G40` | Confere |
| CR-05 | 6 | `Conferencia!D41:G46` | Confere |
| CR-06 | 13 | `Conferencia!D47:G59` | Confere |
| CR-07 | 1 | `Conferencia!D60:G60` | Confere |
| CR-08 | 6 | `Conferencia!D61:G66` | Confere |
| CR-09 | 2 | `Conferencia!D67:G68` | Confere |
| CR-10 | 3 | `Conferencia!D69:G71` | Confere |
| CR-11 | 4 | `Conferencia!D72:G75` | Confere |
| CR-12 | 15 | `Conferencia!D76:G90` | Confere |
| CR-13 | 2 | `Conferencia!D91:G92` | Confere |
| CR-14 | 2 | `Conferencia!D93:G94` | Confere |
| CR-15 | 5 | `Conferencia!D95:G99` | Confere |
| CR-16 | 7 | `Conferencia!D100:G106` | Confere |
| CR-17 | 10 | `Conferencia!D107:G116` | Confere |
| CR-18 | 3 | `Conferencia!D117:G119` | Confere |
| CR-20 | 5 | `Conferencia!D120:G124` | Confere |
| CR-21 | 4 | `Conferencia!D125:G128` | Confere |
| CR-22 | 4 | `Conferencia!D129:G132` | Confere |
| CR-23 | 3 | `Conferencia!D133:G135` | Confere |
| CR-24 | 4 | `Conferencia!D136:G139` | Confere |
| CR-25 | 4 | `Conferencia!D140:G143` | Confere |
| CR-26 | 6 | `Conferencia!D144:G149` | Confere |
| CR-27 | 3 | `Conferencia!D150:G152` | Confere |
| CR-28 | 4 | `Conferencia!D153:G156` | Confere |
| CR-29 | 2 | `Conferencia!D157:G158` | Confere |
| CR-30 | 4 | `Conferencia!D159:G162` | Confere |
| CR-31 | 5 | `Conferencia!D163:G167` | Confere |
| CR-32 | 3 | `Conferencia!D168:G170` | Confere |
| CR-33 | 4 | `Conferencia!D171:G174` | Confere |
| CR-34 | 3 | `Conferencia!D175:G177` | Confere |
| CR-35 | 2 | `Conferencia!D178:G179` | Confere |
| CR-36 | 6 | `Conferencia!D180:G185` | Confere |
| CR-37 | 3 | `Conferencia!D186:G188` | Confere |
| CR-38 | 14 | `Conferencia!D189:G202` | Confere |
| CR-40 | 3 | `Conferencia!D203:G205` | Confere |
| CR-41 | 6 | `Conferencia!D206:G211` | Confere |
| CR-42 | 3 | `Conferencia!D212:G214` | Confere |
| CR-43 | 5 | `Conferencia!D215:G219` | Confere |
| CR-44 | 6 | `Conferencia!D220:G225` | Confere |
| CR-45 | 4 | `Conferencia!D226:G229` | Confere |
| CR-46 | 4 | `Conferencia!D230:G233` | Confere |
| CR-47 | 3 | `Conferencia!D234:G236` | Confere |
| CR-48 | 6 | `Conferencia!D237:G242` | Confere |
| CR-50 | 16 | `Conferencia!D243:G258` | Confere |
| **Total** | **250** | `Conferencia!D9:G258` | **Todos conferem** |

### Conferências numéricas de maior risco

| Caso | Resultado conferido |
| :-- | :-- |
| CR-07 | (9.007.199.254.740.991 + 2) − 2 = 9.007.199.254.740.991 centavos, preservando o subtotal 9.007.199.254.740.993 |
| CR-08 | 1.025 × 9.007.199.254.740.991 = 9.232.379.236.109.515.775; cancelamento integral = 0; ajuste e Vf = 100 centavos |
| CR-09 a CR-11 | Prévia e fechamento recusam os resultados fora da faixa, inclusive ajuste entre saldos opostos e consolidado |
| CR-12 | Vi = 1.500.000; Vf = 1.495.000; ajustes +5.000 e −20.000; identidade −5.000 = 10.000 + 5.000 − 20.000 |
| CR-20 | Dietz = 300.000 / 31.500.000 = 0,009523809523809525; variação patrimonial = 0,11 |
| CR-21 | Fevereiro de 2028 tem 29 dias; retorno = 580.000 / 30.900.000 = 0,018770226537216828 |
| CR-27 | Numerador 30; denominador 1; retorno 30 (3.000%), sem perda por cancelamento |
| CR-36 e CR-37 | Base 100 final 83,16 e drawdown −0,244 no CR-36; primeiro mês negativo entra no drawdown −0,05 do CR-37 |
| CR-38 | 0,00125 → 0,13; 0,01005 → 1,01; −0,00125 → −0,13; zero arredondado sem sinal; índice 100,005 → 100,01 |
| CR-40 a CR-43 | 21 taxas diárias completas → 0,008433685273424597; fevereiro com 20 taxas → 0,00803047308419092; cargas parciais continuam N/D; acumulado mensal = 0,0022967 |
| CR-44 a CR-48 | Comparação sobre acumulados; benchmark ≤ 0 → percentual N/D; empate não é acerto; mês parcial propaga N/D; cargas com buraco/sem valores recusadas |
| CR-50 | 90.071.992.547.409,91 → 9.007.199.254.740.991 centavos; um centavo acima → recusado_faixa; textos inválidos recusados |

**Divergências da referência:** nenhuma. As diferenças CR-02, CR-50 e CR-16 registradas na seção 1 foram reconferidas com as entradas/notações atuais e não reapareceram. As limitações de conversão de texto e de arredondamento binário do motor de planilha foram tratadas no artefato de conferência, sem modificar a especificação ou seus esperados.

### Identidade da evidência

Base local e da PR #30: `d4cc4b093e8cf8e1680429717b5dfab4a4b2d48b`. SHA-256 dos arquivos efetivamente conferidos (bytes UTF-8 do checkout para Markdown/JSON):

| Artefato | SHA-256 |
| :-- | :-- |
| `tests/fixtures/financeiro/casos_referencia.json` | `ffcaf02c49e0efe8938daf90b14b09cdf67cfe90fda3bcbade6d0c061c38ef17` |
| `_project/knowledge/KB-004_regras_financeiras.md` | `52f1ce21017cecf2b5b9c6109e779cea945c86abe529a9cd94bae267fe6c4481` |
| Planilha XLSX | `dfadeb10da4fceb3d356a66cd285d381df7b2718310e9d70a3e5d115a80c44ee` |

Os arquivos auxiliares `conferir.mjs`, `verificar_exportacao.py` e os relatórios por chave permanecem em `local/validacao-ciclo-003/`; o resultado por caso fica registrado acima mesmo sem versionar o binário. A seção 1 foi preservada integralmente.

### Validações do registro

| Validação | Resultado em 2026-10-14 |
| :-- | :-- |
| `npm test -- src/lib/financeiro/casos-referencia.test.ts` | 4 testes passaram; concordância KB × JSON e cenários negativos preservados |
| `node --test scripts/validate-governance.test.mjs` | 39 testes passaram |
| `node scripts/validate-governance.mjs` | Zero erros e zero avisos; quatro itens de conferência manual listados pelo validador |
| `git diff --check` | Passou; único arquivo versionado alterado: este registro, a partir da seção 2 |
| Preservação | Seção 1, KB-004 e fixture mantidas; planilha e auxiliares ignorados em `local/` |

### Handoff desta conferência

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 003 + conferir_planilha + issue-26/250-resultados + d4cc4b093e8cf8e1680429717b5dfab4a4b2d48b`
- `effect_class`: `local_mutation`
- `state_before`: ciclo em execução; issue #26 e PR #30 abertas; seção 2 pendente; nenhum arquivo de planilha localizado e nenhuma sessão de documento conectada; checkout limpo em `chore/issue-26`.
- `state_after`: planilha local criada e 250 resultados conferidos; seção 2 registrada por delegação; ciclo, issue, PR, regras e fixtures preservados. Aprovação humana do merge permanece pendente.
- `result`: `executed`
- `evidence`: autorização explícita neste chat; planilha, hashes, intervalos e método acima; recálculo, verificação dos caches no XLSX e registro das validações documentais abaixo.
- `blockers`: nenhuma divergência técnica aberta nesta conferência. O responsável ainda aprecia este registro de execução delegada e decide sobre o merge da PR #30.

### Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 003 (completo)
Quem: Responsável
Conferir: [PR #30](https://github.com/EuThiagoAndrade/saldo-futuro/pull/30): checks, diff, KB-004 e a conferência delegada registrada nesta seção 2
Diga: "aprovo o merge da PR #30"
```
