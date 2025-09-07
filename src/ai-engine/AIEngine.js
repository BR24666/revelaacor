const DatabaseManager = require('../utils/DatabaseManager');

class AIEngine {
  constructor() {
    this.databaseManager = new DatabaseManager();
    this.model = null;
    this.isInitialized = false;
    this.learningRate = parseFloat(process.env.AI_LEARNING_RATE) || 0.01;
    this.epochs = parseInt(process.env.AI_EPOCHS) || 100;
    this.batchSize = parseInt(process.env.AI_BATCH_SIZE) || 32;
    
    // Pesos do modelo (simulado)
    this.weights = {
      technical: {
        rsi: 0.15,
        macd: 0.20,
        bollinger: 0.15,
        sma: 0.10,
        ema: 0.10
      },
      priceAction: {
        patterns: 0.25,
        pullbacks: 0.30,
        volume: 0.15
      },
      market: {
        volatility: 0.10,
        trend: 0.15,
        momentum: 0.20
      }
    };
  }

  async initialize() {
    console.log('🧠 Inicializando motor de IA...');
    
    try {
      // Carregar modelo existente ou criar novo
      await this.loadModel();
      
      // Treinar com dados históricos
      const historicalData = await this.databaseManager.getHistoricalData(5000);
      if (historicalData.length > 0) {
        await this.train(historicalData, { focusOnPullbacks: true });
      }
      
      this.isInitialized = true;
      console.log('✅ Motor de IA inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar motor de IA:', error);
      throw error;
    }
  }

  async loadModel() {
    // Simular carregamento de modelo
    // Em produção, aqui carregaria um modelo treinado
    console.log('📥 Carregando modelo de IA...');
    this.model = {
      loaded: true,
      version: '1.0.0',
      lastTrained: new Date()
    };
  }

  async train(data, options = {}) {
    console.log('🎓 Iniciando treinamento da IA...');
    
    try {
      const trainingData = this.prepareTrainingData(data, options);
      
      if (trainingData.length < 100) {
        console.warn('⚠️ Poucos dados para treinamento efetivo');
        return;
      }

      // Simular treinamento (em produção usaria TensorFlow.js ou similar)
      const results = await this.simulateTraining(trainingData);
      
      // Atualizar pesos baseado no treinamento
      this.updateWeights(results);
      
      console.log(`✅ Treinamento concluído - Acurácia: ${results.accuracy.toFixed(2)}%`);
      
      // Salvar dados de treinamento
      await this.saveTrainingResults(results);
      
    } catch (error) {
      console.error('❌ Erro durante treinamento:', error);
      throw error;
    }
  }

  prepareTrainingData(data, options) {
    const trainingData = [];
    
    // Agrupar dados por par
    const groupedData = this.groupDataByPair(data);
    
    Object.entries(groupedData).forEach(([pair, pairData]) => {
      // Ordenar por timestamp
      pairData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Criar sequências de treinamento
      for (let i = 20; i < pairData.length - 1; i++) {
        const sequence = pairData.slice(i - 20, i);
        const nextCandle = pairData[i + 1];
        
        if (sequence.length === 20 && nextCandle) {
          const features = this.extractFeatures(sequence, options);
          const target = this.determineNextCandleColor(sequence, nextCandle);
          
          if (features && target) {
            trainingData.push({
              pair,
              features,
              target,
              timestamp: nextCandle.timestamp
            });
          }
        }
      }
    });
    
    return trainingData;
  }

  groupDataByPair(data) {
    return data.reduce((groups, item) => {
      const pair = item.pair;
      if (!groups[pair]) {
        groups[pair] = [];
      }
      groups[pair].push(item);
      return groups;
    }, {});
  }

  extractFeatures(sequence, options) {
    try {
      const features = {
        technical: {},
        priceAction: {},
        market: {},
        pullback: {}
      };

      // Extrair indicadores técnicos
      const lastData = sequence[sequence.length - 1];
      if (lastData.technical_indicators) {
        const tech = lastData.technical_indicators;
        
        features.technical = {
          rsi: tech.rsi || 50,
          macd: tech.macd?.macdLine || 0,
          macdSignal: tech.macd?.signalLine || 0,
          macdHistogram: tech.macd?.histogram || 0,
          sma20: tech.sma20 || 0,
          sma50: tech.sma50 || 0,
          ema12: tech.ema12 || 0,
          ema26: tech.ema26 || 0,
          bollingerUpper: tech.bollingerBands?.upper || 0,
          bollingerMiddle: tech.bollingerBands?.middle || 0,
          bollingerLower: tech.bollingerBands?.lower || 0
        };
      }

      // Extrair price action
      if (lastData.technical_indicators?.priceAction) {
        const pa = lastData.technical_indicators.priceAction;
        
        features.priceAction = {
          patterns: pa.patterns || [],
          recentCandles: pa.recentCandles || [],
          bodyRatio: pa.recentCandles?.[pa.recentCandles.length - 1]?.bodyRatio || 0
        };
      }

      // Extrair análise de pullbacks
      if (lastData.technical_indicators?.pullbackAnalysis) {
        const pb = lastData.technical_indicators.pullbackAnalysis;
        
        features.pullback = {
          peaks: pb.peaks || 0,
          valleys: pb.valleys || 0,
          pullbacks: pb.pullbacks || 0,
          trend: pb.trend || 'neutral',
          recentPullbacks: pb.recentPullbacks || []
        };
      }

      // Extrair dados de mercado
      if (lastData.market_data) {
        const market = lastData.market_data;
        
        features.market = {
          marketCap: market.marketCap || 0,
          volume24h: market.totalVolume || 0,
          priceChange24h: market.priceChange24h || 0,
          volatility: Math.abs(market.priceChange24h) || 0
        };
      }

      // Calcular features derivadas
      features.derived = this.calculateDerivedFeatures(sequence, features);

      return features;
    } catch (error) {
      console.error('❌ Erro ao extrair features:', error);
      return null;
    }
  }

  calculateDerivedFeatures(sequence, features) {
    const prices = sequence.map(s => s.price);
    const volumes = sequence.map(s => s.volume || 0);
    
    return {
      priceVolatility: this.calculateVolatility(prices),
      volumeTrend: this.calculateVolumeTrend(volumes),
      priceMomentum: this.calculateMomentum(prices),
      supportResistance: this.calculateSupportResistance(prices),
      trendStrength: this.calculateTrendStrength(prices)
    };
  }

  calculateVolatility(prices) {
    if (prices.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  calculateVolumeTrend(volumes) {
    if (volumes.length < 2) return 0;
    
    const recent = volumes.slice(-5);
    const older = volumes.slice(-10, -5);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
  }

  calculateMomentum(prices) {
    if (prices.length < 5) return 0;
    
    const recent = prices.slice(-5);
    const older = prices.slice(-10, -5);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
  }

  calculateSupportResistance(prices) {
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const current = prices[prices.length - 1];
    
    return {
      distanceToHigh: (high - current) / high,
      distanceToLow: (current - low) / low,
      range: (high - low) / low
    };
  }

  calculateTrendStrength(prices) {
    if (prices.length < 10) return 0;
    
    const first = prices[0];
    const last = prices[prices.length - 1];
    const change = (last - first) / first;
    
    return Math.abs(change);
  }

  determineNextCandleColor(sequence, nextCandle) {
    if (!nextCandle.price || !sequence.length) return null;
    
    const currentPrice = sequence[sequence.length - 1].price;
    const nextPrice = nextCandle.price;
    
    return nextPrice > currentPrice ? 'GREEN' : 'RED';
  }

  async simulateTraining(trainingData) {
    console.log(`🎯 Treinando com ${trainingData.length} amostras...`);
    
    let correct = 0;
    let total = 0;
    
    // Simular treinamento por épocas
    for (let epoch = 0; epoch < this.epochs; epoch++) {
      let epochCorrect = 0;
      let epochTotal = 0;
      
      // Processar em lotes
      for (let i = 0; i < trainingData.length; i += this.batchSize) {
        const batch = trainingData.slice(i, i + this.batchSize);
        
        for (const sample of batch) {
          const prediction = this.predict(sample.features);
          const actual = sample.target;
          
          if (prediction === actual) {
            epochCorrect++;
            correct++;
          }
          
          epochTotal++;
          total++;
        }
      }
      
      if (epoch % 20 === 0) {
        const accuracy = (epochCorrect / epochTotal) * 100;
        console.log(`Época ${epoch}: Acurácia = ${accuracy.toFixed(2)}%`);
      }
    }
    
    return {
      accuracy: (correct / total) * 100,
      correct,
      total,
      epochs: this.epochs
    };
  }

  predict(features) {
    if (!this.isInitialized) {
      console.warn('⚠️ IA não inicializada, usando predição aleatória');
      return Math.random() > 0.5 ? 'GREEN' : 'RED';
    }

    try {
      // Calcular score para cada cor
      const greenScore = this.calculateScore(features, 'GREEN');
      const redScore = this.calculateScore(features, 'RED');
      
      return greenScore > redScore ? 'GREEN' : 'RED';
    } catch (error) {
      console.error('❌ Erro na predição:', error);
      return Math.random() > 0.5 ? 'GREEN' : 'RED';
    }
  }

  calculateScore(features, color) {
    let score = 0;
    
    // Score baseado em indicadores técnicos
    if (features.technical) {
      const tech = features.technical;
      
      // RSI
      if (tech.rsi !== undefined) {
        if (color === 'GREEN' && tech.rsi < 70) score += 0.1;
        if (color === 'RED' && tech.rsi > 30) score += 0.1;
      }
      
      // MACD
      if (tech.macd !== undefined && tech.macdSignal !== undefined) {
        if (color === 'GREEN' && tech.macd > tech.macdSignal) score += 0.15;
        if (color === 'RED' && tech.macd < tech.macdSignal) score += 0.15;
      }
      
      // Bollinger Bands
      if (tech.bollingerLower && tech.bollingerUpper && features.market?.price) {
        const price = features.market.price;
        if (color === 'GREEN' && price < tech.bollingerLower) score += 0.2; // Oversold
        if (color === 'RED' && price > tech.bollingerUpper) score += 0.2; // Overbought
      }
    }
    
    // Score baseado em price action
    if (features.priceAction) {
      const pa = features.priceAction;
      
      // Padrões de velas
      if (pa.patterns) {
        if (color === 'GREEN' && pa.patterns.includes('hammer')) score += 0.2;
        if (color === 'RED' && pa.patterns.includes('shooting_star')) score += 0.2;
      }
    }
    
    // Score baseado em pullbacks
    if (features.pullback) {
      const pb = features.pullback;
      
      if (pb.trend === 'uptrend' && color === 'GREEN') score += 0.15;
      if (pb.trend === 'downtrend' && color === 'RED') score += 0.15;
      
      if (pb.pullbacks > 0 && color === 'GREEN') score += 0.1; // Pullback em uptrend
    }
    
    // Score baseado em features derivadas
    if (features.derived) {
      const derived = features.derived;
      
      // Momentum
      if (color === 'GREEN' && derived.priceMomentum > 0) score += 0.1;
      if (color === 'RED' && derived.priceMomentum < 0) score += 0.1;
      
      // Volume
      if (color === 'GREEN' && derived.volumeTrend > 0) score += 0.05;
      if (color === 'RED' && derived.volumeTrend < 0) score += 0.05;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  updateWeights(results) {
    // Simular atualização de pesos baseada nos resultados
    // Em produção, usaria backpropagation ou similar
    
    if (results.accuracy > 80) {
      // Aumentar confiança nos pesos atuais
      Object.keys(this.weights).forEach(category => {
        Object.keys(this.weights[category]).forEach(feature => {
          this.weights[category][feature] *= 1.01;
        });
      });
    } else if (results.accuracy < 60) {
      // Ajustar pesos para melhorar performance
      Object.keys(this.weights).forEach(category => {
        Object.keys(this.weights[category]).forEach(feature => {
          this.weights[category][feature] *= 0.99;
        });
      });
    }
  }

  async saveTrainingResults(results) {
    try {
      // Salvar resultados no banco de dados
      const { error } = await this.databaseManager.supabase
        .from('system_config')
        .upsert({
          config_key: 'ai_training_results',
          config_value: {
            accuracy: results.accuracy,
            correct: results.correct,
            total: results.total,
            epochs: results.epochs,
            lastTrained: new Date().toISOString()
          },
          description: 'Resultados do último treinamento da IA'
        });

      if (error) {
        console.error('❌ Erro ao salvar resultados do treinamento:', error);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar resultados do treinamento:', error);
    }
  }

  async getConfidence(features) {
    try {
      const greenScore = this.calculateScore(features, 'GREEN');
      const redScore = this.calculateScore(features, 'RED');
      
      const totalScore = greenScore + redScore;
      if (totalScore === 0) return 50; // Confiança neutra
      
      const maxScore = Math.max(greenScore, redScore);
      return Math.round((maxScore / totalScore) * 100);
    } catch (error) {
      console.error('❌ Erro ao calcular confiança:', error);
      return 50;
    }
  }
}

module.exports = AIEngine;
