const AIEngine = require('../ai-engine/AIEngine');
const DatabaseManager = require('../utils/DatabaseManager');

class SignalGenerator {
  constructor() {
    this.aiEngine = new AIEngine();
    this.databaseManager = new DatabaseManager();
    this.isRunning = false;
    this.confidenceThreshold = parseInt(process.env.SIGNAL_CONFIDENCE_THRESHOLD) || 85;
    this.pullbackAnalysisDepth = parseInt(process.env.PULLBACK_ANALYSIS_DEPTH) || 20;
  }

  async start() {
    console.log('📡 Iniciando gerador de sinais...');
    this.isRunning = true;
    console.log('✅ Gerador de sinais iniciado');
  }

  async stop() {
    console.log('🛑 Parando gerador de sinais...');
    this.isRunning = false;
    console.log('✅ Gerador de sinais parado');
  }

  async generateSignal(pair, marketData) {
    try {
      if (!this.isRunning) {
        console.log('⚠️ Gerador de sinais não está rodando');
        return null;
      }

      // Verificar se há dados suficientes
      if (!marketData || marketData.length < this.pullbackAnalysisDepth) {
        console.log(`⚠️ Dados insuficientes para ${pair}`);
        return null;
      }

      // Analisar pullbacks primeiro (foco principal)
      const pullbackAnalysis = this.analyzePullbacks(marketData);
      if (!pullbackAnalysis.hasValidPullback) {
        console.log(`⚠️ Nenhum pullback válido encontrado para ${pair}`);
        return null;
      }

      // Extrair features para IA
      const features = this.extractSignalFeatures(marketData, pullbackAnalysis);
      
      // Obter predição da IA
      const prediction = this.aiEngine.predict(features);
      const confidence = await this.aiEngine.getConfidence(features);
      
      // Verificar se a confiança é suficiente
      if (confidence < this.confidenceThreshold) {
        console.log(`⚠️ Confiança insuficiente para ${pair}: ${confidence}%`);
        return null;
      }

      // Gerar sinal
      const signal = {
        pair,
        type: 'NEXT_CANDLE_COLOR',
        color: prediction,
        confidence,
        reason: this.generateReason(pullbackAnalysis, features, prediction),
        technicalAnalysis: {
          pullbackAnalysis,
          features: this.sanitizeFeatures(features),
          indicators: this.extractIndicators(marketData)
        },
        aiAnalysis: {
          prediction,
          confidence,
          weights: this.aiEngine.weights,
          modelVersion: this.aiEngine.model?.version || '1.0.0'
        },
        timestamp: new Date().toISOString()
      };

      // Validar sinal com regras adicionais
      if (this.validateSignal(signal, marketData)) {
        console.log(`🎯 Sinal gerado para ${pair}: ${prediction} (${confidence}%)`);
        return signal;
      } else {
        console.log(`❌ Sinal rejeitado pela validação para ${pair}`);
        return null;
      }

    } catch (error) {
      console.error(`❌ Erro ao gerar sinal para ${pair}:`, error);
      return null;
    }
  }

  analyzePullbacks(marketData) {
    const prices = marketData.map(d => d.price);
    const volumes = marketData.map(d => d.volume || 0);
    
    // Encontrar picos e vales
    const peaks = this.findPeaks(prices);
    const valleys = this.findValleys(prices);
    
    // Analisar pullbacks
    const pullbacks = this.identifyPullbacks(peaks, valleys, prices);
    
    // Calcular métricas de pullback
    const metrics = this.calculatePullbackMetrics(pullbacks, prices, volumes);
    
    return {
      hasValidPullback: pullbacks.length > 0 && metrics.avgDepth > 0.02, // > 2%
      pullbacks,
      metrics,
      peaks: peaks.length,
      valleys: valleys.length,
      trend: this.determineTrend(prices),
      strength: this.calculatePullbackStrength(pullbacks, prices)
    };
  }

  findPeaks(prices) {
    const peaks = [];
    for (let i = 1; i < prices.length - 1; i++) {
      if (prices[i] > prices[i-1] && prices[i] > prices[i+1]) {
        peaks.push({ index: i, price: prices[i] });
      }
    }
    return peaks;
  }

  findValleys(prices) {
    const valleys = [];
    for (let i = 1; i < prices.length - 1; i++) {
      if (prices[i] < prices[i-1] && prices[i] < prices[i+1]) {
        valleys.push({ index: i, price: prices[i] });
      }
    }
    return valleys;
  }

  identifyPullbacks(peaks, valleys, prices) {
    const pullbacks = [];
    
    for (let i = 0; i < peaks.length - 1; i++) {
      const peak = peaks[i];
      const nextPeak = peaks[i + 1];
      
      // Encontrar vale entre os picos
      const valleyBetween = valleys.find(v => v.index > peak.index && v.index < nextPeak.index);
      
      if (valleyBetween) {
        const pullbackDepth = (peak.price - valleyBetween.price) / peak.price;
        const recovery = (nextPeak.price - valleyBetween.price) / valleyBetween.price;
        
        pullbacks.push({
          startIndex: peak.index,
          valleyIndex: valleyBetween.index,
          endIndex: nextPeak.index,
          peakPrice: peak.price,
          valleyPrice: valleyBetween.price,
          nextPeakPrice: nextPeak.price,
          depth: pullbackDepth,
          recovery: recovery,
          strength: this.calculatePullbackStrength([{
            startIndex: peak.index,
            valleyIndex: valleyBetween.index,
            endIndex: nextPeak.index
          }], prices)
        });
      }
    }
    
    return pullbacks;
  }

  calculatePullbackMetrics(pullbacks, prices, volumes) {
    if (pullbacks.length === 0) {
      return {
        avgDepth: 0,
        avgRecovery: 0,
        maxDepth: 0,
        minDepth: 0,
        successRate: 0
      };
    }

    const depths = pullbacks.map(p => p.depth);
    const recoveries = pullbacks.map(p => p.recovery);
    
    return {
      avgDepth: depths.reduce((a, b) => a + b, 0) / depths.length,
      avgRecovery: recoveries.reduce((a, b) => a + b, 0) / recoveries.length,
      maxDepth: Math.max(...depths),
      minDepth: Math.min(...depths),
      successRate: recoveries.filter(r => r > 0.5).length / recoveries.length
    };
  }

  calculatePullbackStrength(pullbacks, prices) {
    if (pullbacks.length === 0) return 0;
    
    const strengths = pullbacks.map(pullback => {
      const startPrice = prices[pullback.startIndex];
      const valleyPrice = prices[pullback.valleyIndex];
      const endPrice = prices[pullback.endIndex];
      
      const depth = (startPrice - valleyPrice) / startPrice;
      const recovery = (endPrice - valleyPrice) / valleyPrice;
      
      return depth * recovery; // Força = Profundidade × Recuperação
    });
    
    return strengths.reduce((a, b) => a + b, 0) / strengths.length;
  }

  determineTrend(prices) {
    if (prices.length < 10) return 'neutral';
    
    const first = prices[0];
    const last = prices[prices.length - 1];
    const change = (last - first) / first;
    
    if (change > 0.05) return 'strong_uptrend';
    if (change > 0.02) return 'uptrend';
    if (change < -0.05) return 'strong_downtrend';
    if (change < -0.02) return 'downtrend';
    return 'sideways';
  }

  extractSignalFeatures(marketData, pullbackAnalysis) {
    const latest = marketData[marketData.length - 1];
    const features = {
      pullback: pullbackAnalysis,
      technical: {},
      priceAction: {},
      market: {}
    };

    // Extrair indicadores técnicos
    if (latest.technical_indicators) {
      features.technical = {
        rsi: latest.technical_indicators.rsi || 50,
        macd: latest.technical_indicators.macd || {},
        bollingerBands: latest.technical_indicators.bollingerBands || {},
        sma: latest.technical_indicators.sma20 || 0,
        ema: latest.technical_indicators.ema12 || 0
      };
    }

    // Extrair price action
    if (latest.technical_indicators?.priceAction) {
      features.priceAction = {
        patterns: latest.technical_indicators.priceAction.patterns || [],
        recentCandles: latest.technical_indicators.priceAction.recentCandles || []
      };
    }

    // Extrair dados de mercado
    if (latest.market_data) {
      features.market = {
        marketCap: latest.market_data.marketCap || 0,
        volume24h: latest.market_data.totalVolume || 0,
        priceChange24h: latest.market_data.priceChange24h || 0
      };
    }

    return features;
  }

  generateReason(pullbackAnalysis, features, prediction) {
    const reasons = [];
    
    // Razões baseadas em pullbacks
    if (pullbackAnalysis.hasValidPullback) {
      reasons.push(`Pullback detectado (${(pullbackAnalysis.metrics.avgDepth * 100).toFixed(1)}% de profundidade)`);
    }
    
    // Razões baseadas em indicadores técnicos
    if (features.technical.rsi) {
      if (prediction === 'GREEN' && features.technical.rsi < 30) {
        reasons.push('RSI oversold');
      } else if (prediction === 'RED' && features.technical.rsi > 70) {
        reasons.push('RSI overbought');
      }
    }
    
    // Razões baseadas em price action
    if (features.priceAction.patterns) {
      if (prediction === 'GREEN' && features.priceAction.patterns.includes('hammer')) {
        reasons.push('Padrão Hammer detectado');
      } else if (prediction === 'RED' && features.priceAction.patterns.includes('shooting_star')) {
        reasons.push('Padrão Shooting Star detectado');
      }
    }
    
    // Razões baseadas em tendência
    if (pullbackAnalysis.trend) {
      if (prediction === 'GREEN' && pullbackAnalysis.trend.includes('uptrend')) {
        reasons.push('Tendência de alta');
      } else if (prediction === 'RED' && pullbackAnalysis.trend.includes('downtrend')) {
        reasons.push('Tendência de baixa');
      }
    }
    
    return reasons.length > 0 ? reasons.join(', ') : 'Análise técnica geral';
  }

  sanitizeFeatures(features) {
    // Remover dados sensíveis e normalizar para armazenamento
    const sanitized = JSON.parse(JSON.stringify(features));
    
    // Normalizar valores numéricos
    if (sanitized.technical) {
      Object.keys(sanitized.technical).forEach(key => {
        if (typeof sanitized.technical[key] === 'number') {
          sanitized.technical[key] = Math.round(sanitized.technical[key] * 1000) / 1000;
        }
      });
    }
    
    return sanitized;
  }

  extractIndicators(marketData) {
    const latest = marketData[marketData.length - 1];
    const indicators = {};
    
    if (latest.technical_indicators) {
      indicators.rsi = latest.technical_indicators.rsi;
      indicators.macd = latest.technical_indicators.macd;
      indicators.bollingerBands = latest.technical_indicators.bollingerBands;
      indicators.sma20 = latest.technical_indicators.sma20;
      indicators.ema12 = latest.technical_indicators.ema12;
    }
    
    return indicators;
  }

  validateSignal(signal, marketData) {
    try {
      // Validação 1: Confiança mínima
      if (signal.confidence < this.confidenceThreshold) {
        return false;
      }
      
      // Validação 2: Dados recentes
      const latestData = marketData[marketData.length - 1];
      const dataAge = Date.now() - new Date(latestData.timestamp).getTime();
      if (dataAge > 300000) { // 5 minutos
        console.log('⚠️ Dados muito antigos para validação');
        return false;
      }
      
      // Validação 3: Volume mínimo
      if (latestData.volume && latestData.volume < 1000) {
        console.log('⚠️ Volume muito baixo');
        return false;
      }
      
      // Validação 4: Volatilidade adequada
      const prices = marketData.slice(-10).map(d => d.price);
      const volatility = this.calculateVolatility(prices);
      if (volatility < 0.001) { // Muito baixa volatilidade
        console.log('⚠️ Volatilidade muito baixa');
        return false;
      }
      
      // Validação 5: Consistência com pullbacks
      if (signal.technicalAnalysis.pullbackAnalysis) {
        const pb = signal.technicalAnalysis.pullbackAnalysis;
        if (!pb.hasValidPullback) {
          console.log('⚠️ Nenhum pullback válido');
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erro na validação do sinal:', error);
      return false;
    }
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

  async updateSignalResult(signalId, actualColor) {
    try {
      await this.databaseManager.updateSignalResult(signalId, actualColor);
      console.log(`✅ Resultado do sinal ${signalId} atualizado: ${actualColor}`);
    } catch (error) {
      console.error('❌ Erro ao atualizar resultado do sinal:', error);
    }
  }

  async getRecentSignals(pair = null, limit = 10) {
    try {
      return await this.databaseManager.getLatestSignals(pair, limit);
    } catch (error) {
      console.error('❌ Erro ao buscar sinais recentes:', error);
      return [];
    }
  }
}

module.exports = SignalGenerator;
