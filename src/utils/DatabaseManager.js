const { createClient } = require('@supabase/supabase-js');

class DatabaseManager {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }

  async initialize() {
    console.log('🗄️ Inicializando banco de dados...');
    
    try {
      // Criar tabelas se não existirem
      await this.createTables();
      console.log('✅ Banco de dados inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar banco de dados:', error);
      throw error;
    }
  }

  async createTables() {
    const tables = [
      // Tabela para dados de mercado
      `CREATE TABLE IF NOT EXISTS market_data (
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
      )`,
      
      // Tabela para sinais gerados
      `CREATE TABLE IF NOT EXISTS trading_signals (
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
      )`,
      
      // Tabela para performance do sistema
      `CREATE TABLE IF NOT EXISTS system_performance (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        pair VARCHAR(20) NOT NULL,
        total_signals INTEGER DEFAULT 0,
        correct_signals INTEGER DEFAULT 0,
        incorrect_signals INTEGER DEFAULT 0,
        accuracy DECIMAL(5,2) DEFAULT 0,
        profit_loss DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Tabela para dados de treinamento da IA
      `CREATE TABLE IF NOT EXISTS ai_training_data (
        id SERIAL PRIMARY KEY,
        pair VARCHAR(20) NOT NULL,
        input_features JSONB NOT NULL,
        target_output VARCHAR(10) NOT NULL,
        actual_result VARCHAR(10),
        confidence DECIMAL(5,2),
        is_correct BOOLEAN,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Tabela para configurações do sistema
      `CREATE TABLE IF NOT EXISTS system_config (
        id SERIAL PRIMARY KEY,
        config_key VARCHAR(100) UNIQUE NOT NULL,
        config_value JSONB NOT NULL,
        description TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`
    ];

    for (const table of tables) {
      try {
        const { error } = await this.supabase.rpc('exec_sql', { sql: table });
        if (error) {
          console.warn(`⚠️ Aviso ao criar tabela: ${error.message}`);
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao executar SQL: ${error.message}`);
      }
    }

    // Criar índices para performance
    await this.createIndexes();
  }

  async createIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_market_data_pair_timestamp ON market_data(pair, timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_trading_signals_pair_timestamp ON trading_signals(pair, timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_system_performance_date_pair ON system_performance(date, pair)',
      'CREATE INDEX IF NOT EXISTS idx_ai_training_data_pair_created ON ai_training_data(pair, created_at)'
    ];

    for (const index of indexes) {
      try {
        const { error } = await this.supabase.rpc('exec_sql', { sql: index });
        if (error) {
          console.warn(`⚠️ Aviso ao criar índice: ${error.message}`);
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao executar SQL: ${error.message}`);
      }
    }
  }

  async storeMarketData(data) {
    try {
      const { error } = await this.supabase
        .from('market_data')
        .insert({
          pair: data.pair,
          source: data.source,
          price: data.price,
          volume: data.volume,
          high: data.candles?.[data.candles.length - 1]?.high,
          low: data.candles?.[data.candles.length - 1]?.low,
          open: data.candles?.[data.candles.length - 1]?.open,
          close: data.candles?.[data.candles.length - 1]?.close,
          technical_indicators: data.technicalIndicators,
          order_book: data.orderBook,
          market_data: data.marketData
        });

      if (error) {
        console.error('❌ Erro ao armazenar dados de mercado:', error);
        throw error;
      }
    } catch (error) {
      console.error('❌ Erro ao armazenar dados de mercado:', error);
      throw error;
    }
  }

  async storeSignal(signal) {
    try {
      const { error } = await this.supabase
        .from('trading_signals')
        .insert({
          pair: signal.pair,
          signal_type: signal.type || 'NEXT_CANDLE_COLOR',
          color: signal.color,
          confidence: signal.confidence,
          reason: signal.reason,
          technical_analysis: signal.technicalAnalysis,
          ai_analysis: signal.aiAnalysis
        });

      if (error) {
        console.error('❌ Erro ao armazenar sinal:', error);
        throw error;
      }
    } catch (error) {
      console.error('❌ Erro ao armazenar sinal:', error);
      throw error;
    }
  }

  async getHistoricalData(limit = 1000) {
    try {
      const { data, error } = await this.supabase
        .from('market_data')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Erro ao buscar dados históricos:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar dados históricos:', error);
      return [];
    }
  }

  async getCurrentData(pairs = null) {
    try {
      let query = this.supabase
        .from('market_data')
        .select('*')
        .order('timestamp', { ascending: false });

      if (pairs) {
        query = query.in('pair', pairs);
      }

      const { data, error } = await query.limit(100);

      if (error) {
        console.error('❌ Erro ao buscar dados atuais:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar dados atuais:', error);
      return [];
    }
  }

  async getPerformanceStats(days = 7) {
    try {
      const { data, error } = await this.supabase
        .from('system_performance')
        .select('*')
        .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar estatísticas de performance:', error);
        throw error;
      }

      // Calcular estatísticas agregadas
      const stats = data?.reduce((acc, record) => {
        acc.totalSignals += record.total_signals;
        acc.correctSignals += record.correct_signals;
        acc.incorrectSignals += record.incorrect_signals;
        return acc;
      }, { totalSignals: 0, correctSignals: 0, incorrectSignals: 0 }) || { totalSignals: 0, correctSignals: 0, incorrectSignals: 0 };

      stats.accuracy = stats.totalSignals > 0 ? (stats.correctSignals / stats.totalSignals) * 100 : 0;

      return stats;
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas de performance:', error);
      return { totalSignals: 0, correctSignals: 0, incorrectSignals: 0, accuracy: 0 };
    }
  }

  async storeTrainingData(pair, inputFeatures, targetOutput, actualResult = null, confidence = null) {
    try {
      const isCorrect = actualResult ? targetOutput === actualResult : null;

      const { error } = await this.supabase
        .from('ai_training_data')
        .insert({
          pair,
          input_features: inputFeatures,
          target_output: targetOutput,
          actual_result: actualResult,
          confidence,
          is_correct: isCorrect
        });

      if (error) {
        console.error('❌ Erro ao armazenar dados de treinamento:', error);
        throw error;
      }
    } catch (error) {
      console.error('❌ Erro ao armazenar dados de treinamento:', error);
      throw error;
    }
  }

  async getTrainingData(pair = null, limit = 1000) {
    try {
      let query = this.supabase
        .from('ai_training_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (pair) {
        query = query.eq('pair', pair);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar dados de treinamento:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar dados de treinamento:', error);
      return [];
    }
  }

  async updateSignalResult(signalId, result) {
    try {
      const { error } = await this.supabase
        .from('trading_signals')
        .update({ 
          result,
          executed: true
        })
        .eq('id', signalId);

      if (error) {
        console.error('❌ Erro ao atualizar resultado do sinal:', error);
        throw error;
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar resultado do sinal:', error);
      throw error;
    }
  }

  async getLatestSignals(pair = null, limit = 10) {
    try {
      let query = this.supabase
        .from('trading_signals')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (pair) {
        query = query.eq('pair', pair);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar sinais recentes:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar sinais recentes:', error);
      return [];
    }
  }
}

module.exports = DatabaseManager;
