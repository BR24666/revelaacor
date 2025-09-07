-- Configuração do banco de dados para o Sistema de IA de Trading
-- Execute este script no Supabase SQL Editor

-- Tabela para dados de mercado
CREATE TABLE IF NOT EXISTS market_data (
  id SERIAL PRIMARY KEY,
  pair VARCHAR(20) NOT NULL,
  source VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  price DECIMAL(20,8) NOT NULL,
  volume DECIMAL(20,8),
  high DECIMAL(20,8),
  low DECIMAL(20,8),
  open DECIMAL(20,8),
  close DECIMAL(20,8),
  technical_indicators JSONB,
  order_book JSONB,
  market_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para sinais gerados
CREATE TABLE IF NOT EXISTS trading_signals (
  id SERIAL PRIMARY KEY,
  pair VARCHAR(20) NOT NULL,
  signal_type VARCHAR(20) NOT NULL,
  color VARCHAR(10) NOT NULL,
  confidence DECIMAL(5,2) NOT NULL,
  reason TEXT,
  technical_analysis JSONB,
  ai_analysis JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed BOOLEAN DEFAULT FALSE,
  result VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para performance do sistema
CREATE TABLE IF NOT EXISTS system_performance (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  pair VARCHAR(20) NOT NULL,
  total_signals INTEGER DEFAULT 0,
  correct_signals INTEGER DEFAULT 0,
  incorrect_signals INTEGER DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0,
  profit_loss DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para dados de treinamento da IA
CREATE TABLE IF NOT EXISTS ai_training_data (
  id SERIAL PRIMARY KEY,
  pair VARCHAR(20) NOT NULL,
  input_features JSONB NOT NULL,
  target_output VARCHAR(10) NOT NULL,
  actual_result VARCHAR(10),
  confidence DECIMAL(5,2),
  is_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para configurações do sistema
CREATE TABLE IF NOT EXISTS system_config (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_market_data_pair_timestamp ON market_data(pair, timestamp);
CREATE INDEX IF NOT EXISTS idx_trading_signals_pair_timestamp ON trading_signals(pair, timestamp);
CREATE INDEX IF NOT EXISTS idx_system_performance_date_pair ON system_performance(date, pair);
CREATE INDEX IF NOT EXISTS idx_ai_training_data_pair_created ON ai_training_data(pair, created_at);

-- Inserir configurações padrão
INSERT INTO system_config (config_key, config_value, description) VALUES
('ai_training_results', '{"accuracy": 0, "correct": 0, "total": 0, "epochs": 0, "lastTrained": null}', 'Resultados do último treinamento da IA'),
('system_settings', '{"confidence_threshold": 85, "pullback_min_depth": 0.02, "collection_interval": 60000}', 'Configurações do sistema'),
('trading_pairs', '["SOLUSDT", "ETHUSDT", "BTCUSDT", "ADAUSDT", "DOGEUSDT"]', 'Pares configurados para análise')
ON CONFLICT (config_key) DO NOTHING;

-- Comentários das tabelas
COMMENT ON TABLE market_data IS 'Dados de mercado coletados de múltiplas fontes';
COMMENT ON TABLE trading_signals IS 'Sinais de trading gerados pela IA';
COMMENT ON TABLE system_performance IS 'Métricas de performance do sistema';
COMMENT ON TABLE ai_training_data IS 'Dados para treinamento da IA';
COMMENT ON TABLE system_config IS 'Configurações do sistema';

-- RLS (Row Level Security) - opcional
-- ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE trading_signals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE system_performance ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ai_training_data ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
