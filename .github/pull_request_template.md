## Contexto e objetivo

## Ciclo, plano e issue

- Ciclo (ou `trilha curta`):
- Nível: `trilha curta | leve | completo`
- Modo contínuo: `— | ativo | suspenso`
- Plano (ou `—` na trilha curta):
- Issue associada: `Closes #N`
- Encerramento documental sem issue: `Não se aplica — closure do ciclo NNN`
- Task persistente:

## Mudanças

## Fora do escopo

## Barreiras de domínio

Marque cada barreira. "Não se aplica" exige justificativa na linha.

- [ ] **G1 — exatidão financeira:** casos de referência com valores esperados e KB de regras financeiras atualizada, ou não se aplica porque:
- [ ] **G2 — isolamento por RLS:** toda tabela nova tem RLS e teste de isolamento, ou não se aplica porque:
- [ ] **G3 — privacidade de dados:** nenhum dado do usuário em código, fixtures, textos ou prints, ou não se aplica porque:
- [ ] **G4 — migrações só acrescentam:** nenhuma migração existente foi alterada, renomeada ou removida, ou não se aplica porque:

## Validação

- [ ] Testes aplicáveis executados.
- [ ] `node scripts/validate-governance.mjs` executado.
- [ ] `git diff --check` passou.
- [ ] Staging revisado e limitado ao escopo autorizado.
- [ ] Nenhum segredo ou valor real de ambiente foi incluído.
- [ ] Documentação e task refletem resultados reais.

## Riscos, rollback e revisão manual

## Gates pendentes

- [ ] Checks remotos concluídos.
- [ ] Aprovar merge concedido ("aprovo o merge da PR #N").
