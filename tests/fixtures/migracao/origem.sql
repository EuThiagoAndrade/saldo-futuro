-- Esquema SQLite fictício derivado dos modelos fixados na KB-001:
-- Meus-Investimentos @ 1b13b033ce4335c09df80237c8c31b96b37e3797.
-- Este arquivo contém somente DDL, sem dados pessoais ou valores reais.

PRAGMA foreign_keys = ON;

CREATE TABLE ativos (
  id INTEGER PRIMARY KEY,
  descricao TEXT NOT NULL UNIQUE,
  classificacao VARCHAR(50),
  aplicacao VARCHAR(100),
  instituicao VARCHAR(50),
  rentabilidade VARCHAR(50),
  liquidez VARCHAR(30),
  previdencia BOOLEAN DEFAULT 0,
  isento BOOLEAN DEFAULT 0,
  exposicao_dolar BOOLEAN DEFAULT 0,
  ativo BOOLEAN DEFAULT 1,
  data_inicio DATE,
  created_at DATETIME
);

CREATE TABLE eventos (
  id INTEGER PRIMARY KEY,
  ativo_id INTEGER REFERENCES ativos(id),
  data_evento DATE NOT NULL,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  tipo_evento VARCHAR(30) NOT NULL,
  valor NUMERIC(15, 2) NOT NULL CHECK (valor >= 0),
  evento_referencia_id INTEGER REFERENCES eventos(id),
  origem VARCHAR(20) DEFAULT 'manual',
  observacao TEXT,
  created_at DATETIME
);

CREATE INDEX idx_eventos_ativo_data ON eventos(ativo_id, ano, mes);
CREATE INDEX idx_eventos_tipo ON eventos(tipo_evento);

CREATE TABLE posicoes_mensais (
  id INTEGER PRIMARY KEY,
  ativo_id INTEGER NOT NULL REFERENCES ativos(id),
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  saldo_inicio NUMERIC(15, 2) NOT NULL,
  saldo_fim NUMERIC(15, 2) NOT NULL,
  total_aportes NUMERIC(15, 2) DEFAULT 0,
  total_resgates NUMERIC(15, 2) DEFAULT 0,
  total_rendimento NUMERIC(15, 2) DEFAULT 0,
  calculado_em DATETIME,
  CONSTRAINT uq_posicao UNIQUE (ativo_id, ano, mes)
);

CREATE TABLE consolidado_mensal (
  id INTEGER PRIMARY KEY,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  valor_total NUMERIC(15, 2) NOT NULL,
  variacao_mes NUMERIC(15, 2),
  variacao_mes_pct NUMERIC(5, 2),
  total_aportes NUMERIC(15, 2) DEFAULT 0,
  total_resgates NUMERIC(15, 2) DEFAULT 0,
  total_rendimento NUMERIC(15, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'aberto',
  fechado BOOLEAN DEFAULT 0,
  data_fechamento DATETIME,
  CONSTRAINT uq_consolidado_ano_mes UNIQUE (ano, mes)
);

CREATE INDEX idx_consolidado_ano_mes ON consolidado_mensal(ano, mes);
