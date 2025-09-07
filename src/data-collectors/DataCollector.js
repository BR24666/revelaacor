const axios = require('axios');

class DataCollector {
  constructor() {
    this.binanceApiUrl = process.env.BINANCE_API_URL;
    this.coingeckoApiUrl = process.env.COINGECKO_API_URL;
    this.isCollecting = false;
    this.collectionInterval = null;
  }

  async start(pairs) {
    console.log('📡 Iniciando coleta de dados...');
    this.isCollecting = true;
    
    // Coletar dados iniciais
    await this.collectInitialData(pairs);
    
    // Configurar coleta contínua
    this.collectionInterval = setInterval(async () => {
      if (this.isCollecting) {
        await this.collectAllPairsData(pairs);
      }
    }, process.env.COLLECTION_INTERVAL || 60000);
  }

  async collectInitialData(pairs) {
    console.log('🔄 Coletando dados iniciais...');
    for (const pair of pairs) {
      try {
        await this.collectPairData(pair);
        console.log(`✅ Dados coletados para ${pair}`);
      } catch (error) {
        console.error(`❌ Erro ao coletar dados para ${pair}:`, error.message);
      }
    }
  }

  async collectAllPairsData(pairs) {
    const promises = pairs.map(pair => this.collectPairData(pair));
    await Promise.allSettled(promises);
  }

  async collectPairData(pair) {
    try {
      // Coletar dados da Binance
      const binanceData = await this.collectFromBinance(pair);
      
      // Coletar dados adicionais do CoinGecko
      const coingeckoData = await this.collectFromCoinGecko(pair);
      
      // Combinar dados
      const combinedData = this.combineDataSources(binanceData, coingeckoData);
      
      return combinedData;
    } catch (error) {
      console.error(`❌ Erro ao coletar dados para ${pair}:`, error.message);
      throw error;
    }
  }

  async collectFromBinance(pair) {
    try {
      const [klinesResponse, tickerResponse, orderBookResponse] = await Promise.all([
        // Dados de velas (1m, 5m, 15m)
        axios.get(`${this.binanceApiUrl}/klines`, {
          params: {
            symbol: pair,
            interval: '1m',
            limit: 100
          }
        }),
        // Preço atual
        axios.get(`${this.binanceApiUrl}/ticker/price`, {
          params: { symbol: pair }
        }),
        // Order book (profundidade)
        axios.get(`${this.binanceApiUrl}/depth`, {
          params: { symbol: pair, limit: 20 }
        })
      ]);

      const klines = klinesResponse.data;
      const ticker = tickerResponse.data;
      const orderBook = orderBookResponse.data;

      // Processar dados de velas
      const candles = klines.map(kline => ({
        timestamp: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
        closeTime: kline[6],
        quoteVolume: parseFloat(kline[7]),
        trades: kline[8],
        takerBuyBaseVolume: parseFloat(kline[9]),
        takerBuyQuoteVolume: parseFloat(kline[10])
      }));

      // Calcular indicadores técnicos
      const technicalIndicators = this.calculateTechnicalIndicators(candles);

      return {
        pair,
        source: 'binance',
        timestamp: new Date().toISOString(),
        price: parseFloat(ticker.price),
        candles,
        orderBook: {
          bids: orderBook.bids.map(bid => ({ price: parseFloat(bid[0]), quantity: parseFloat(bid[1]) })),
          asks: orderBook.asks.map(ask => ({ price: parseFloat(ask[0]), quantity: parseFloat(ask[1]) }))
        },
        technicalIndicators,
        volume: candles[candles.length - 1]?.volume || 0
      };
    } catch (error) {
      console.error(`❌ Erro na API Binance para ${pair}:`, error.message);
      throw error;
    }
  }

  async collectFromCoinGecko(pair) {
    try {
      // Mapear pares para IDs do CoinGecko
      const coinGeckoId = this.getCoinGeckoId(pair);
      if (!coinGeckoId) return null;

      const response = await axios.get(`${this.coingeckoApiUrl}/coins/${coinGeckoId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: false
        }
      });

      const data = response.data;
      const marketData = data.market_data;

      return {
        coinGeckoId,
        marketCap: marketData.market_cap?.usd || 0,
        totalVolume: marketData.total_volume?.usd || 0,
        priceChange24h: marketData.price_change_percentage_24h || 0,
        marketCapRank: data.market_cap_rank || 0,
        ath: marketData.ath?.usd || 0,
        athChangePercentage: marketData.ath_change_percentage?.usd || 0,
        atl: marketData.atl?.usd || 0,
        atlChangePercentage: marketData.atl_change_percentage?.usd || 0,
        circulatingSupply: marketData.circulating_supply || 0,
        totalSupply: marketData.total_supply || 0,
        maxSupply: marketData.max_supply || 0
      };
    } catch (error) {
      console.error(`❌ Erro na API CoinGecko para ${pair}:`, error.message);
      return null;
    }
  }

  getCoinGeckoId(pair) {
    const mapping = {
      'SOLUSDT': 'solana',
      'ETHUSDT': 'ethereum',
      'BTCUSDT': 'bitcoin',
      'ADAUSDT': 'cardano',
      'DOGEUSDT': 'dogecoin'
    };
    return mapping[pair] || null;
  }

  calculateTechnicalIndicators(candles) {
    if (candles.length < 20) return {};

    const prices = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const volumes = candles.map(c => c.volume);

    return {
      // Médias móveis
      sma20: this.calculateSMA(prices, 20),
      sma50: this.calculateSMA(prices, Math.min(50, prices.length)),
      ema12: this.calculateEMA(prices, 12),
      ema26: this.calculateEMA(prices, 26),
      
      // RSI
      rsi: this.calculateRSI(prices, 14),
      
      // MACD
      macd: this.calculateMACD(prices),
      
      // Bollinger Bands
      bollingerBands: this.calculateBollingerBands(prices, 20, 2),
      
      // Volume
      volumeSMA: this.calculateSMA(volumes, 20),
      
      // Price Action
      priceAction: this.analyzePriceAction(candles),
      
      // Pullback Analysis
      pullbackAnalysis: this.analyzePullbacks(candles)
    };
  }

  calculateSMA(prices, period) {
    if (prices.length < period) return null;
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  calculateEMA(prices, period) {
    if (prices.length < period) return null;
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return null;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  calculateMACD(prices) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    
    if (!ema12 || !ema26) return null;
    
    const macdLine = ema12 - ema26;
    const signalLine = this.calculateEMA([macdLine], 9);
    const histogram = macdLine - (signalLine || 0);
    
    return {
      macdLine,
      signalLine,
      histogram
    };
  }

  calculateBollingerBands(prices, period = 20, stdDev = 2) {
    if (prices.length < period) return null;
    
    const sma = this.calculateSMA(prices, period);
    const recentPrices = prices.slice(-period);
    
    const variance = recentPrices.reduce((sum, price) => {
      return sum + Math.pow(price - sma, 2);
    }, 0) / period;
    
    const standardDeviation = Math.sqrt(variance);
    
    return {
      upper: sma + (standardDeviation * stdDev),
      middle: sma,
      lower: sma - (standardDeviation * stdDev)
    };
  }

  analyzePriceAction(candles) {
    if (candles.length < 3) return null;
    
    const recent = candles.slice(-3);
    const patterns = [];
    
    // Análise de padrões de velas
    recent.forEach((candle, index) => {
      const isGreen = candle.close > candle.open;
      const bodySize = Math.abs(candle.close - candle.open);
      const totalSize = candle.high - candle.low;
      const bodyRatio = totalSize > 0 ? bodySize / totalSize : 0;
      
      // Doji
      if (bodyRatio < 0.1) {
        patterns.push('doji');
      }
      // Hammer/Shooting Star
      else if (bodyRatio < 0.3) {
        const upperShadow = candle.high - Math.max(candle.open, candle.close);
        const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
        
        if (lowerShadow > bodySize * 2) patterns.push('hammer');
        if (upperShadow > bodySize * 2) patterns.push('shooting_star');
      }
      // Marubozu
      else if (bodyRatio > 0.8) {
        patterns.push(isGreen ? 'green_marubozu' : 'red_marubozu');
      }
    });
    
    return {
      patterns,
      recentCandles: recent.map(c => ({
        color: c.close > c.open ? 'GREEN' : 'RED',
        bodySize: Math.abs(c.close - c.open),
        totalSize: c.high - c.low,
        bodyRatio: (c.high - c.low) > 0 ? Math.abs(c.close - c.open) / (c.high - c.low) : 0
      }))
    };
  }

  analyzePullbacks(candles) {
    if (candles.length < 10) return null;
    
    const recent = candles.slice(-10);
    const prices = recent.map(c => c.close);
    
    // Encontrar picos e vales
    const peaks = [];
    const valleys = [];
    
    for (let i = 1; i < prices.length - 1; i++) {
      if (prices[i] > prices[i-1] && prices[i] > prices[i+1]) {
        peaks.push({ index: i, price: prices[i] });
      }
      if (prices[i] < prices[i-1] && prices[i] < prices[i+1]) {
        valleys.push({ index: i, price: prices[i] });
      }
    }
    
    // Analisar pullbacks
    const pullbacks = [];
    for (let i = 0; i < peaks.length - 1; i++) {
      const peak = peaks[i];
      const nextPeak = peaks[i + 1];
      const pullbackDepth = (peak.price - nextPeak.price) / peak.price;
      
      if (pullbackDepth > 0.02) { // Pullback > 2%
        pullbacks.push({
          startIndex: peak.index,
          endIndex: nextPeak.index,
          depth: pullbackDepth,
          strength: 'strong'
        });
      }
    }
    
    return {
      peaks: peaks.length,
      valleys: valleys.length,
      pullbacks: pullbacks.length,
      recentPullbacks: pullbacks,
      trend: this.calculateTrend(prices)
    };
  }

  calculateTrend(prices) {
    if (prices.length < 5) return 'neutral';
    
    const first = prices[0];
    const last = prices[prices.length - 1];
    const change = (last - first) / first;
    
    if (change > 0.02) return 'uptrend';
    if (change < -0.02) return 'downtrend';
    return 'sideways';
  }

  combineDataSources(binanceData, coingeckoData) {
    return {
      ...binanceData,
      marketData: coingeckoData,
      combinedAt: new Date().toISOString()
    };
  }

  async stop() {
    console.log('🛑 Parando coleta de dados...');
    this.isCollecting = false;
    
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
    
    console.log('✅ Coleta de dados parada');
  }
}

module.exports = DataCollector;
