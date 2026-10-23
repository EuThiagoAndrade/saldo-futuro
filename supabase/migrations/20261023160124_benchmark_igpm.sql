-- IGP-M no catálogo de benchmarks (ciclo 011, issue #118, BL-007). Série SGS 189, variação
-- percentual mensal da FGV, no mesmo formato da 433 (valor no dia 1): usa a regra existente de
-- série mensal da KB-004 (9.3), sem mudança de cálculo. Código e periodicidade são imutáveis (D8);
-- a migração do catálogo inicial (D9) não é editada (G4).
--
-- O catálogo é lido em ordem de id, e a comparação sem benchmark escolhido abre no primeiro.
-- O id fixo no topo da faixa mantém o IGP-M por último e preserva a ordem e o padrão de CDI e
-- IPCA (decisão do responsável de 2026-10-23).
insert into public.benchmarks (id, codigo_sgs, nome, periodicidade) values
  ('ffffffff-ffff-4fff-bfff-000000000189', 189, 'IGP-M', 'mensal');
