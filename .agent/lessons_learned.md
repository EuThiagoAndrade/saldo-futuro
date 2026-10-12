# Lições aprendidas

Registro de aprendizados comprovados e reutilizáveis do repositório. Não use este arquivo como backlog, task corrente ou histórico de conversa.

As quatro primeiras lições foram herdadas do `euthiagoandrade-api` @ `9f79071bc619e826da4554f0f85e4ffe7f135f8b` (`.agent/lessons_learned.md`) e reescritas para este repositório no ciclo `000`. A data é a do registro original.

## Registros

### 2026-08-12 — Inputs de actions devem usar o nome documentado

Origem: ciclo `000` do api. O `actions/setup-node` interpretou `cache: false` como o nome literal de um gerenciador de pacotes e falhou antes dos testes. Para desabilitar a detecção automática de cache, o input correto é `package-manager-cache: false`. Quando uma divergência entre o gate local e o runner for confirmada, transforme-a em validação determinística e teste de regressão.

### 2026-08-13 — Aprovação do rascunho não substitui revisão formal

Origem: ciclo `001` do api. A aprovação humana do rascunho foi interpretada como autorização para marcar o plano `Aprovado` e publicar sua PR antes da revisão formal. Estados encadeados exigem evidência da transição anterior: o rascunho passa por `Em Revisão`, recebe veredito formal, e somente uma manifestação humana posterior pode aprová-lo. Quando uma falha procedural for comprovada, registre a regra na autoridade canônica e cubra a transição no validador, em vez de depender apenas da memória do agente.

### 2026-08-17 — Handoff estável precisa sobreviver à reexecução

Origem: ciclo `002` do api. Um handoff útil separa identidade lógica de tentativa operacional. Repositório, ciclo, workflow, alvo e revisão de origem identificam a operação; timestamp e UUID podem ser evidência, mas não criam uma nova operação. Workflows mutantes consultam o resultado existente, reconciliam a reexecução compatível e param com intervenção humana quando o estado é parcial, concorrente ou ambíguo.

### 2026-08-19 — Encerramentos exigem reconciliação pós-merge

Origem: api. Uma PR de encerramento tem duas fases: preparação pré-merge e reconciliação pós-merge. A regra autorreferencial impede registrar o próprio SHA dentro da PR, mas não elimina a atualização posterior da task, do handoff e dos registros canônicos. Após o merge, esses artefatos devem refletir o estado real; sempre que possível, o validador deve detectar inconsistências, como ciclo concluído com task ainda pendente.

### 2026-10-12 — Critérios devem expressar o objetivo verificável, não o mecanismo

Origem: ciclo `000`, ressalva S1. O critério "confirmar que a fonte expõe `tnum`" representava o objetivo "algarismos tabulares". A IBM Plex Sans 1.1.0 não tem `tnum` porque seus algarismos padrão já são tabulares, e o critério literal mandaria parar sem necessidade. Ao escrever critérios e ressalvas, declare o resultado mensurável (por exemplo, "todos os dígitos com a mesma largura de avanço") e, quando citar um mecanismo, deixe claro que ele é só um meio. Na divergência, meça o objetivo e leve a decisão ao responsável.

### 2026-10-12 — Testes não podem depender de maiúsculas e minúsculas no sistema de arquivos

Origem: ciclo `000`, PR #4. Um teste renomeava `pull_request_template.md` para `PULL_REQUEST_TEMPLATE.md` e esperava o arquivo ausente. No Windows, o sistema de arquivos ignora maiúsculas e o arquivo continuava encontrado, enquanto no runner Linux o teste teria outro resultado. Fixtures devem distinguir caminhos por nome ou diretório, nunca só pela caixa das letras, para que o gate local e o CI concordem.
