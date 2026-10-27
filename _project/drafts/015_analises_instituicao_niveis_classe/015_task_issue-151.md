# Task — Issue #151: Coerência de metadados e edição do nome

> **Ciclo:** `015`
> **Trilha:** `normal`
> **Estado:** `Em andamento`
> **Tipo:** `feature`
> **Issue:** `#151`
> **Plano:** `_project/drafts/015_analises_instituicao_niveis_classe/015_plan.md`
> **Branch:** `feature/issue-151`
> **PR:** —
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #151" em 2026-10-27
> **Modo contínuo:** `—`
> **Início:** 2026-10-27
> **Última atualização:** 2026-10-27
> **handoff_schema_version:** `2`

## Objetivo

Entregar a unidade A do plano aprovado, issue #151, preservando isolamento e compatibilidade.

## Escopo autorizado

Migração aditiva, contador monotônico, RPC de leitura textual e edição transacional; testes e roteiro E1. Nenhuma mudança de aplicação ou produção.

## Origem no backlog

Snapshot herdado da ideação, sem nova seleção nem alteração do item:

- **BL-009 — Metadados descritivos e classificação de ativos com aproveitamento do histórico:** selecionadas as visões analíticas por instituição e por classe nos níveis 2 e 3, em conjunto para este ciclo. Os campos descritivos e a visão macro foram encaminhados nos ciclos 012 e 013. O responsável informou em 2026-10-27 que já preencheu os dados descritivos dos ativos históricos migrados; é relato humano, não verificação de dados. A carga manual não integra esta seleção.
- Snapshot: `_project/backlog.md` na fila canônica, commit `84f0a5ea107f33e0de5c506b3ea0825346f6e58e`, presente em `origin/main` conforme a ideação; destino ciclo 015 em preparação. O item continua disponível e não foi alterado pela seleção. O mesmo commit é o HEAD local inspecionado neste rascunho.
- A edição do nome é extensão pedida diretamente pelo responsável durante a ideação; não deriva de BL-015. O retorno à fila, somente depois da integração comprovada do destino, usa a referência estável `ciclo 015`; sua publicação exige autorização separada.

## Elegibilidade da trilha curta

Não se aplica — trilha normal, unidade A do ciclo completo.

## Barreiras de domínio

Toda linha é obrigatória. "Não se aplica" exige justificativa. Com G1 ou G2 marcados com "Sim", o modo contínuo não pode estar `ativo`.

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Sem mudança de cálculo; preservação financeira será provada no upgrade fictício |
| G2 — isolamento por RLS | Sim | Testes de sessão, grants, dono, cascata e duas sessões passaram (suíte de banco com 535 asserções) |
| G3 — privacidade de dados | Sim | Somente fixtures fictícias; sem leitura de carteira real |
| G4 — migrações só acrescentam | Sim | Apenas migração nova |

## Execução

- [x] Issue e integração documental conferidas no GitHub; base origin/main 200be5df7d84521d9bcd911d4f0e0500e4dddfe8.
- [x] Branch criada preservando registros locais da criação de issues.
- [x] Primeira versão da migração escrita.
- [x] Migração revisada; isolamento, concorrência, cascata, rollback e upgrade fictício passaram.
- [x] E1 preparado; gates locais concluídos e staging revisado.
- [ ] Publicar PR com Refs #151; integração exige aprovação própria.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | Banco: 535/535; governança: 48/48; unitários: 405/405; lint sem erros (3 avisos preexistentes em local/), typecheck e build passaram; e2e autenticado sobre build: 208 passed, 12 skipped (preview sem backend), 1 flaky aprovado no retry; saída 0, dois workers |
| Validador | 0 erros, 0 avisos; conferências manuais realizadas |
| `git diff --check` | Passou |
| Checks remotos | Pendente |

## Revisão da correção

Não se aplica — trilha normal. Revisão técnica e G2 conferidos na implementação e na PR.

## Decisões incidentais e desvios

Migração aplicada somente ao Supabase local. Ambiente separado de upgrade em `local/issue151-upgrade`, projeto `saldo-futuro-issue151-upgrade`, portas 55321/55322, sem copiar dados reais ou resetar o projeto local principal. Primeira carga fictícia falhou por codificação do stdin no Windows; corrigida para bytes UTF-8 e refeito somente o banco descartável. Nenhuma migração de produção foi aplicada.

A primeira execução e2e com seis workers foi interrompida depois de o servidor local parar de responder (`ERR_CONNECTION_REFUSED`); repetida sobre build com dois workers. Nessa repetição, o worker do cenário de mais de 1.000 eventos saiu com código Windows 3221226505, e o retry previsto pelo CI passou. Resultado global: saída 0, 208 passed, 12 skipped e 1 flaky. Nenhum teste ou aplicação foi alterado para contornar a falha.

A suíte fechada de permissões exigiu acrescentar explicitamente as duas assinaturas públicas novas; não foi relaxada a detecção de funções inesperadas.

## Roteiro E1 — somente depois do merge desta entrega

1. Responsável confere main integrada, checks verdes e esta task; identifica o projeto de produção conforme KB-002, sem enviar credenciais ao agente.
2. Executa `npx supabase migration list` e `npx supabase db push --dry-run`. Deve haver somente `20261027220000_metadados_nome_ativo.sql` pendente; qualquer outra migração interrompe E1 para decisão.
3. Consulta `tests/fixtures/metadados015/e1_pre.sql` no banco de destino: só informa presença estrutural, sem ler carteira; antes desta migração os três indicadores devem ser falsos.
4. Executa `npx supabase db push` e confere novamente `npx supabase migration list`.
5. Consulta `tests/fixtures/metadados015/e1_post.sql`: os três indicadores devem ser verdadeiros. Confere grants das funções novas: authenticated executa; anon/PUBLIC não. Não renomear um ativo real para testar.
6. Relata somente conclusão e resultados estruturais, dizendo "concluí a ação externa da issue #151". A igualdade financeira foi provada com fixtures locais; não alegar comparação da carteira em produção. Não fechar #151 antes da conclusão de E1 e do encerramento.

Não executar os arquivos `upgrade_pre.sql`/`upgrade_post.sql` em produção: são exclusivamente fixtures do ambiente local descartável.

## Ensaio local de upgrade — reprodução

1. Criar em `local/issue151-upgrade/supabase` uma cópia somente de config e migrações, com project_id `saldo-futuro-issue151-upgrade` e portas 553xx; não copiar seed, ambiente ou dados. Iniciar a instância com `npx supabase start --workdir local/issue151-upgrade -x realtime,storage-api,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor`.
2. Conferir caminho absoluto `C:\Programas\saldo-futuro\local\issue151-upgrade` e ID antes de qualquer reset. Executar `npx supabase db reset --local --version 20261027002132 --no-seed --workdir local/issue151-upgrade` somente nessa instância.
3. Executar `upgrade_pre.sql` com `docker exec -i supabase_db_saldo-futuro-issue151-upgrade psql -U postgres -d postgres -v ON_ERROR_STOP=1`, enviando o arquivo como bytes UTF-8. A fixture cria um usuário fictício, ativo, aporte e fechamento, guardando o retrato integral de ativos, eventos, transferências, consolidados, posições, instituições e legado.
4. Copiar a migração nova para essa instância e aplicar `npx supabase migration up --local --workdir local/issue151-upgrade`.
5. Executar `upgrade_post.sql` da mesma maneira. Resultado observado: `retrato integral preservado`; APIs anterior e nova disponíveis, ambas verdadeiras. A comparação lança erro e para se qualquer linha financeira/descritiva diferir.
6. A suíte normal de banco roda no projeto local principal com `npx supabase test db` (535 asserções). O reset de upgrade não atinge esse projeto. Desligar a instância descartável depois das verificações com `npx supabase stop --workdir local/issue151-upgrade`.

## Encerramento

Não se aplica — ciclo completo; encerramento em PR própria após E1 e demais entregas.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Pronto para continuar — ciclo 015 (completo)
Quem: Qualquer ferramenta, a pedido do responsável
Conferir: —
Diga: "continue o ciclo 015"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 015 + implementar_issue + 151 + 200be5df7d84521d9bcd911d4f0e0500e4dddfe8`
- `effect_class`: `local_mutation`
- `state_before`: plano aprovado, #151 autorizada, PR #150 integrada; registros locais de issues preservados.
- `state_after`: unidade A implementada e validada localmente; migração aplicada somente localmente, E1 preparado; publicação da PR em preparação na branch feature/issue-151.
- `result`: `executed`
- `evidence`: issue e integração documental conferidas; 535 asserções de banco, 48 testes de governança, 405 unitários, lint/typecheck/build, e2e (208 passed, 12 skipped, 1 flaky no retry) e upgrade com retrato integral preservado; evidências acima.
- `blockers`: nenhum para publicar; merge depende de checks verdes e aprovação própria. E1 permanece ação humana posterior ao merge.
