-- Script para criar tabelas separadas no Supabase
-- Tabela para dados históricos (coletados anteriormente)
CREATE TABLE IF NOT EXISTS historical_candle_data (
  id SERIAL PRIMARY KEY,
  pair VARCHAR(20) NOT NULL,
  timeframe VARCHAR(10) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  open_price DECIMAL(20, 8) NOT NULL,
  close_price DECIMAL(20, 8) NOT NULL,
  color VARCHAR(10) NOT NULL CHECK (color IN ('GREEN', 'RED')),
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour < 24),
  minute INTEGER NOT NULL CHECK (minute >= 0 AND minute < 60),
  day INTEGER NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  full_date DATE NOT NULL,
  time_key VARCHAR(20) NOT NULL,
  date_key VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pair, timeframe, timestamp)
);

-- Tabela para dados em tempo real (coletados atualmente)
CREATE TABLE IF NOT EXISTS realtime_candle_data (
  id SERIAL PRIMARY KEY,
  pair VARCHAR(20) NOT NULL,
  timeframe VARCHAR(10) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  open_price DECIMAL(20, 8) NOT NULL,
  close_price DECIMAL(20, 8) NOT NULL,
  color VARCHAR(10) NOT NULL CHECK (color IN ('GREEN', 'RED')),
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour < 24),
  minute INTEGER NOT NULL CHECK (minute >= 0 AND minute < 60),
  day INTEGER NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  full_date DATE NOT NULL,
  time_key VARCHAR(20) NOT NULL,
  date_key VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pair, timeframe, timestamp)
);

-- Migrar dados existentes para a tabela histórica
INSERT INTO historical_candle_data (
  pair, timeframe, timestamp, open_price, close_price, color,
  hour, minute, day, month, year, full_date, time_key, date_key
)
SELECT 
  pair, timeframe, timestamp, open_price, close_price, color,
  hour, minute, day, month, year, full_date, time_key, date_key
FROM candle_data
WHERE full_date < CURRENT_DATE;

-- Migrar dados de hoje para a tabela de tempo real
INSERT INTO realtime_candle_data (
  pair, timeframe, timestamp, open_price, close_price, color,
  hour, minute, day, month, year, full_date, time_key, date_key
)
SELECT 
  pair, timeframe, timestamp, open_price, close_price, color,
  hour, minute, day, month, year, full_date, time_key, date_key
FROM candle_data
WHERE full_date >= CURRENT_DATE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_historical_candle_data_date_timeframe_pair 
ON historical_candle_data(full_date, timeframe, pair);

CREATE INDEX IF NOT EXISTS idx_historical_candle_data_timestamp 
ON historical_candle_data(timestamp);

CREATE INDEX IF NOT EXISTS idx_realtime_candle_data_date_timeframe_pair 
ON realtime_candle_data(full_date, timeframe, pair);

CREATE INDEX IF NOT EXISTS idx_realtime_candle_data_timestamp 
ON realtime_candle_data(timestamp);

-- Comentários para documentação
COMMENT ON TABLE historical_candle_data IS 'Dados históricos de velas coletados anteriormente';
COMMENT ON TABLE realtime_candle_data IS 'Dados de velas coletados em tempo real';
