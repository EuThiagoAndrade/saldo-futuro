---
description: "Capturar e manter possibilidades por pedido explícito, com commit local isolado; publicar somente o lote autorizado e observar a integração."
---

# Workflow: Gerenciar backlog

## Entradas

- Pedido humano explícito de captura, edição, arquivamento, combinação, reabertura, publicação ou reconciliação local após merge aprovado.
- `.agent/ai_behavior.md`, `_project/README.md` (Backlog de possibilidades e convenções) e `.agent/templates/backlog_item.md`, lidos no ponto de uso.
- Git local e gh para conferir lote remoto/PR/integração quando necessários.

## Barreira

- Aplicar o contrato do README; este workflow não muda regras. Manutenção avulsa altera somente `_project/backlog.md`.
- Pedido de captura cobre commit local; publicação exige "publique as alterações do backlog", com intervalo conhecido. Merge exige "aprovo o merge da PR #N" e checks verdes. Não presumir autorização pela recomendação do handoff.
- G3 antes de qualquer gravação e novamente antes de commit/publicação: sintetizar necessidade abstrata, sem conversa bruta ou dados do usuário. Se não for possível abstrair, Parado antes de escrever.
- Não inserir sugestão do agente sem pedido humano. Verificar equivalência/Registro antes de criar; repetição não muda ID, data, log ou commit.
- Consulta/"continue o backlog" usa `retomar`, somente leitura. Não executar rebase sob uma autorização de mera observação.

## Preparar a fila

1. Identificar o repositório e revisão, conferir `git status --short`, branch, diff e índice do trabalho atual, sem alterá-los. Ler `git worktree list --porcelain`: o primeiro registro identifica o principal. Descobrir a fila registrada na branch `refs/heads/chore/backlog`.
2. Resolver caminhos reais absolutos (incluindo symlinks/junctions), o diretório irmão `<principal>-backlog` e `git rev-parse --path-format=absolute --git-common-dir` no principal e, se existente, na fila. Para destino ainda inexistente, resolver o pai existente e acrescentar o nome; conferir novamente após criação. Exigir mesmo diretório Git comum e fila fora de todos os checkouts; não aceitar alias interno. Não procurar nem ler outros dados de `local/`.
3. Adquirir `local/backlog.lock/` no principal por criação atômica exclusiva. Criar somente o pai `local/` se necessário; a criação da trava deve falhar se já existir (em Node, `mkdir` sem recursive). Aguardar sessão reconhecidamente ativa e reler tudo depois de adquirir. Trava desconhecida/abandonada: Parado, sem apagar. Toda preparação/mutação a seguir fica sob essa trava, liberada em finally apenas por quem a adquiriu.
4. Conferir main integrada e eventual lote remoto aberto com gh. Se não existir fila, criar `git worktree add -b chore/backlog <caminho-externo> <base-conferida>`; se branch segura já existir sem worktree, anexá-la após conferir histórico. Lote remoto pendente deve estar incluído na fila antes de alocar ID. Sem evidência do lote/base, parar; não inventar IDs pela cópia possivelmente antiga do checkout corrente.
5. Se existir fila, reutilizar somente a registrada, segura, limpa e com histórico conhecido. Branch/diretório ocupado, múltiplas filas, Git comum diferente, divergência ou alterações não reconhecidas: Parado. Não resetar, remover, copiar diff ou criar outra fila. Fast-forward somente se não perder nenhum commit local.
6. Se a ferramenta negar escrita/criação externa, apresentar Parado explicando que a fila precisa ficar fora do checkout e orientar liberar esse diretório na ferramenta ou ajustar sua configuração. Não migrar para pasta interna como fallback. Não alterar lint/tsconfig/build para acomodar a fila.

## Capturar ou manter conteúdo

1. Sob a trava, ler o backlog da fila, seus commits pendentes e o pedido. Instanciar o template só para necessidade nova, alocando maior ID existente + 1, inclusive Arquivados. Não reservar IDs antecipadamente.
2. Aplicar somente a operação pedida; na primeira captura, remover a indicação "Nenhum item registrado". Para Arquivado, motivo explícito; combinar preserva IDs arquivados apontando ao mantido. Para retorno de seleção, comprovar integração do destino em main e autorização original; usar referência estável `ciclo NNN` ou `issue #N`, parcela e data. Parcial permanece Disponível com Restante. Nunca promover por uma seleção em preparação ou reabrir por cancelamento do destino.
3. Atualizar data e Registro apenas se houve mudança real. Rever G3 e referências. Conferir `git diff -- _project/backlog.md` e índice da fila; nenhuma alteração alheia é incluída.
4. Fazer `git add -- _project/backlog.md` e `git commit -m "docs(backlog): <operação e IDs>"` na fila, com staging exclusivamente desse arquivo. Conferir commit, árvore e identidade antes de devolver o ID/liberar trava. Sem mudança, não commitar. Em falha, preservar evidências e reconciliar antes de tentar nova captura; não duplicar efeito.
5. Não fazer push. Conferir que branch, índice e diff do trabalho inicial permanecem iguais. Responder IDs/síntese, commit local e limite de publicação. Mostrar handoff e bloco somente na saída.

## Publicar lote autorizado

1. Ler fila e estado remoto reais. Apresentar/conferir base **B**, tip autorizado **T**, intervalo e diff, IDs e pedidos cobertos. A autorização é do lote conhecido; se a frase recebida não delimitar alterações de outras conversas, esclarecer antes de publicar. Capturas posteriores a T ficam locais.
2. Conferir G3, `git diff --check B T`, testes/validador e que a PR muda somente `_project/backlog.md`. Como o validador precisa das autoridades novas, usar a base integrada vigente; não publicar sobre contrato ainda não integrado.
3. Via gh, localizar PR/branch `chore/backlog-lote-<B-completo>`. No máximo um lote aberto. Se já existir, B é a base original desse lote, mesmo que main tenha avançado; conferir relação de ancestralidade, tip publicado e autorização para avançá-lo. Só depois de integrado/reconciliado começar outra branch por nova base. Colisão/divergência/PR fechada sem merge: Parado. Não force-push nem criar duplicata.
4. Fazer push **do commit T**, não implicitamente de HEAD: `git push origin <T>:refs/heads/chore/backlog-lote-<B-completo>`. Criar ou reconciliar PR para main pelo template `.github/pull_request_template.md`, lido no ponto de uso, preenchendo exceção de manutenção do backlog, lote e autorização. Não criar issue/ciclo/task artificiais.
5. Conferir diff e checks atuais via gh. Capturas depois de T não avançam a branch remota. Checks pendentes/falhos levam a Parado na observação; somente faltando integrar, Aguardando merge. Cada merge tem aprovação específica; depois de recebida, reconferir tip/diff/checks e integrar por squash com título convencional explícito `docs(backlog): <operação e IDs>`.

## Reconciliar depois do squash

1. A reconciliação é mutação local, coberta pelo merge autorizado ou pedido explícito de reconciliar; a observação sozinha não a executa. Sob a trava, obter da PR real seu último tip publicado **P** e merge **M**. Fetch e conferir main atual, P ancestral do tip da fila, fila limpa e `git diff P M -- _project/backlog.md` sem diferenças. Conferir que M pertence à main conferida. Ambiguidade preserva tudo e para.
2. Na fila, `git rebase --onto <main-conferida> <P> chore/backlog`. Apenas commits posteriores a P são reaplicados. Sem posteriores, fica na main conferida. Confirmar IDs, sínteses e autoria preservados; SHA reescrito não significa item novo.
3. Se houver conflito, `git rebase --abort`, confirmar histórico/arquivos preservados e Parado com a decisão necessária. Não copiar diff manualmente, resetar/limpar ou usar branch auxiliar. Rebase não autoriza push.
4. Novo lote futuro usa SHA completo da nova base, outra branch remota e autorização própria, sem force-push. A fila local continua chore/backlog.

## Saída e handoff

Não persistir bloco, versão ou handoff no backlog. Registro sintetiza o pedido; GitHub comprova publicação/integração. Derivar situação pelas regras ordenadas de observação do README, informando também commits posteriores a PR aberta. Concluído descreve a operação, não entrega de item. No backlog vazio sem lote, informar base sincronizada, sem alegar captura/merge.

- `handoff_schema_version: 2`
- `logical_key`: `repository + backlog + gerenciar_backlog + operação/alvo + revisão_base`
- Alvo: IDs e conteúdo solicitado normalizado, ou necessidade antes de alocar ID; revisão_base é commit de origem, não data/UUID. Comparar conteúdo/Registro na fila sob trava; não criar arquivo de hash auxiliar.
- `effect_class`: `local_mutation` (captura, commit e reconciliação) ou `remote_mutation` (push/PR/merge autorizado).
- `state_before` / `state_after`: base, tip local, tip publicado e PR observados.
- `result`: `executed | already_executed_and_reconciled | ambiguous_human_intervention_required | not_executed`.
- `evidence`: pedido, IDs/sínteses, commit(s), fila/Git comum, diff, PR/checks conforme o efeito.
- `blockers`: nenhum ou pendência verificável e decisão necessária.

## Situações de saída

- Backlog atualizado
- Aguardando merge
- Parado
- Concluído
