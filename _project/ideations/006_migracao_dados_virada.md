# Ideação — 006: migração única dos dados e virada

> **Ciclo:** `006`
> **Estado:** `Ideação`
> **Nível:** `completo`
> **Autorização inicial:** "confirmo o nível completo e autorizo a ideação do ciclo 006" em 2026-10-17
> **Criado em:** 2026-10-17
> **Última atualização:** 2026-10-17
> **handoff_schema_version:** `2`

## Problema

O Saldo Futuro já entrega paridade funcional com o `Meus-Investimentos` (ciclos `003` a `005`), mas a carteira do responsável continua no sistema de origem. Enquanto o histórico não for trazido, o Saldo Futuro não substitui a origem: os dois sistemas seguem em uso, sem uma data a partir da qual o novo passa a ser a fonte de verdade.

A demanda é fazer **uma migração única** do SQLite da origem para o Supabase de produção e uma **virada** controlada, depois da qual a origem deixa de receber lançamentos.

## Contexto e evidências

Fatos verificados no repositório:

- ADR-002 (decisão 6): "Migração única a partir do SQLite de origem". A tabela `investimentos_legacy` e o migrador histórico de CSV ficam fora. A migração estava prevista para o ciclo `005` e foi adiada; o `005` tratou logo e desempenho.
- KB-003 lista a migração dos dados do `Meus-Investimentos` como pendência fora da entrega.
- KB-001 traz o inventário do modelo da origem: ativos (com desativação lógica), eventos imutáveis por ativo (inclusive valores em trânsito sem ativo), posições mensais, consolidado mensal com situação aberto/fechado, catálogo de benchmarks e séries.
- O schema de destino (`supabase/migrations/20261014185205_carteira.sql`) já prevê o tipo de evento `migracao` e a coluna `migracao` em `consolidados`, com a identidade `vf − vi = aportes + resgates + rendimento + marcacao + cambio + migracao`.
- KB-004, 4.5 (P15): um mês com evento `migracao` tem rentabilidade `N/D`, com a variação do patrimônio ainda calculável. KB-004 registra a divergência O12: a origem tratava meses migrados como rendimento (MIG:398-400); aqui isso foi corrigido.
- KB-004, 4.6 (K7, K13): o primeiro fechamento só é aceito no mês do evento mais antigo, cujo saldo inicial é zero; nenhum evento tem data futura.
- Transferências (K6, K12): duas pernas na mesma data, soma zero; o ativo "Em trânsito" só recebe pernas de transferência. Na origem, há valores em trânsito **sem ativo**.
- G3: arquivos `*.sqlite`/`*.db` só em `tests/fixtures/`; dados reais só em `local/`, ignorado pelo Git. Mudanças de produção entram por `db push` do responsável (KB-002, S12).

Evidência ausente: não li o SQLite real nem medi volume, intervalo de meses ou qualidade dos dados. Nenhum dado do usuário será reproduzido aqui.

## Resultado desejado

- A carteira da origem reconstruída no Saldo Futuro com saldos mensais por ativo iguais aos da origem, mês a mês, e patrimônio final idêntico em centavos.
- Uma reconciliação verificável (contagens e diferenças zero), registrada sem expor valores.
- Uma data de virada registrada, depois da qual a origem fica somente leitura ou desligada, e um caminho de volta enquanto a virada não for confirmada.

## Hipóteses

- H1. O migrador pode ser um script local, executado pelo responsável contra o SQLite em `local/`, sem rota nova na aplicação.
- H2. Os eventos da origem podem ser mapeados um a um para `aporte`, `resgate`, `rendimento`, `marcacao`, `cambio` e `transferencia`, e os ajustes calculados de fechamento para `rendimento`/`marcacao` conforme o `tipo_ajuste` do ativo.
- H3. Meses cuja decomposição não for recuperável viram um único evento `migracao` por ativo e mês (P15).
- H4. Os meses fechados da origem podem ser refechados no destino pelo mesmo fluxo de fechamento, sem gravar `posicoes`/`consolidados` diretamente.
- H5. A escrita usa a conexão autenticada do próprio usuário (RLS ativo), sem chave de serviço.

## Alternativas

| Alternativa | A favor | Contra |
| :-- | :-- | :-- |
| A. Replay fiel dos eventos da origem e refechamento mês a mês | Preserva aportes, resgates e rentabilidade histórica | Depende de a origem ter eventos coerentes; erros antigos aparecem na reconciliação |
| B. Só saldos mensais: um evento `migracao` por ativo e mês | Simples; reconciliação trivial | Toda a rentabilidade histórica vira `N/D` |
| C. Saldo de abertura na data de virada, sem histórico | Mínimo | Perde gráficos, períodos e comparação com benchmark |
| D. Híbrido: replay (A) onde a identidade fecha; `migracao` (B) só nos meses que não fecham | Melhor histórico possível com reconciliação garantida | Mais regras de decisão e casos de referência |

Inclinação inicial, a decidir no plano: D.

## Riscos e restrições

- **G1:** decisão de como classificar ajustes e lacunas é regra financeira. Nenhuma interpretação é escolhida sem exemplos numéricos e decisão do responsável; exige casos de referência fictícios.
- **G2:** a escrita respeita RLS e cai só na carteira do responsável; nada de `service_role` versionada ou em CI.
- **G3:** o SQLite e qualquer saída do migrador ficam em `local/`; fixtures de teste são fictícias; evidências só com contagens e diferenças.
- **G4:** se faltar algo no schema (por exemplo, marcar a origem do evento), é migração nova e aditiva.
- Execução parcial em produção: precisa ser idempotente ou transacional, com conferência antes de gravar (carteira de destino vazia).
- Lançamentos feitos na origem entre a migração e a virada se perdem se não houver congelamento.
- Benchmarks: as séries públicas já podem vir do SGS; importá-las da origem pode duplicar ou divergir.

## Perguntas em aberto

1. A carteira de destino em produção está vazia hoje, ou já tem lançamentos feitos no Saldo Futuro que precisam conviver com o histórico?
2. Quantos usuários migram: só o responsável, ou mais contas da origem?
3. Qual alternativa (A, B, C ou D) para o histórico?
4. Valores em trânsito sem ativo da origem: viram transferências via "Em trânsito" ou `migracao`?
5. Ativos desativados na origem entram (desativados) ou ficam de fora?
6. Meses abertos na origem: migram abertos, ou a virada acontece logo após um fechamento?
7. Benchmarks e séries: migrar o catálogo próprio da origem ou depender só do SGS?
8. Depois da virada, a origem fica somente leitura por quanto tempo antes de ser desligada?
9. O que fazer se a reconciliação não fechar em algum mês: parar ou aceitar `migracao` com registro?

## Fora do escopo

- Tabela `investimentos_legacy` e o migrador histórico de CSV (ADR-002).
- Sincronização contínua ou bidirecional entre os sistemas.
- Desligar a infraestrutura da origem (ação humana externa, fora deste repositório).
- Rota ou tela de importação na aplicação para usuários finais.

## Critérios para iniciar o planejamento

- Respostas às perguntas 1, 2, 3, 6 e 9 registradas.
- Leitura do schema da origem no commit fixado da KB-001, sem dados.
- Contagens agregadas do SQLite em `local/` (tabelas, meses, ativos), sem valores, se o responsável autorizar a leitura.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Ideação registrada — ciclo 006 (completo)
Quem: Responsável
Conferir: perguntas em aberto 1 a 9 e a escolha entre as alternativas A–D
Diga: "autorizo o rascunho do plano do ciclo 006"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 006 + idear + migracao_dados_virada + 49b930f`
- `effect_class`: `local_mutation`
- `state_before` / `state_after`: ciclo `006` sem reserva / ciclo `006` reservado em `Ideação`
- `result`: `executed`
- `evidence`: este arquivo e a linha `006` em `_project/cycles.md`, na branch `chore/cycle-006-ideation`
- `blockers`: nenhum para a ideação; perguntas em aberto bloqueiam o plano
