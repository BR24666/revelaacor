const cron = require('node-cron');
const dotenv = require('dotenv');
const DataCollector = require('./data-collectors/DataCollector');
const AIEngine = require('./ai-engine/AIEngine');
const SignalGenerator = require('./signal-generator/SignalGenerator');
const DatabaseManager = require('./utils/DatabaseManager');

// Carregar variáveis de ambiente
dotenv.config();

class AITradingSystem {
  constructor() {
    this.dataCollector = new DataCollector();
    this.aiEngine = new AIEngine();
    this.signalGenerator = new SignalGenerator();
    this.databaseManager = new DatabaseManager();
    
    this.isRunning = false;
    this.pairs = process.env.TRADING_PAIRS.split(',');
    this.collectionInterval = parseInt(process.env.COLLECTION_INTERVAL) || 60000;
    
    console.log('🤖 Sistema de IA para Trading iniciado');
    console.log(`📊 Pares configurados: ${this.pairs.join(', ')}`);
    console.log(`⏱️ Intervalo de coleta: ${this.collectionInterval}ms`);
  }

  async start() {
    try {
      console.log('🚀 Iniciando sistema...');
      
      // Inicializar banco de dados
      await this.databaseManager.initialize();
      
      // Iniciar coleta de dados
      await this.dataCollector.start(this.pairs);
      
      // Iniciar motor de IA
      await this.aiEngine.initialize();
      
      // Iniciar gerador de sinais
      await this.signalGenerator.start();
      
      // Configurar atualizações periódicas
      this.setupPeriodicTasks();
      
      this.isRunning = true;
      console.log('✅ Sistema iniciado com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao iniciar sistema:', error);
      throw error;
    }
  }

  setupPeriodicTasks() {
    // Atualizar dados a cada minuto
    cron.schedule('* * * * *', async () => {
      if (this.isRunning) {
        console.log('🔄 Atualizando dados...');
        await this.updateData();
      }
    });

    // Treinar IA a cada 5 minutos
    cron.schedule('*/5 * * * *', async () => {
      if (this.isRunning) {
        console.log('🧠 Treinando IA...');
        await this.trainAI();
      }
    });

    // Gerar sinais a cada 30 segundos
    cron.schedule('*/30 * * * * *', async () => {
      if (this.isRunning) {
        console.log('📡 Gerando sinais...');
        await this.generateSignals();
      }
    });

    // Análise de performance a cada hora
    cron.schedule('0 * * * *', async () => {
      if (this.isRunning) {
        console.log('📈 Analisando performance...');
        await this.analyzePerformance();
      }
    });
  }

  async updateData() {
    try {
      for (const pair of this.pairs) {
        const data = await this.dataCollector.collectPairData(pair);
        await this.databaseManager.storeMarketData(data);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar dados:', error);
    }
  }

  async trainAI() {
    try {
      // Buscar dados históricos para treinamento
      const historicalData = await this.databaseManager.getHistoricalData();
      
      // Treinar modelo com foco em pullbacks
      await this.aiEngine.train(historicalData, {
        focusOnPullbacks: true,
        targetAccuracy: 0.95 // 95% de acertividade
      });
      
      console.log('✅ IA treinada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao treinar IA:', error);
    }
  }

  async generateSignals() {
    try {
      // Buscar dados atuais
      const currentData = await this.databaseManager.getCurrentData();
      
      // Gerar sinais para cada par
      for (const pair of this.pairs) {
        const pairData = currentData.filter(d => d.pair === pair);
        if (pairData.length > 0) {
          const signal = await this.signalGenerator.generateSignal(pair, pairData);
          
          if (signal && signal.confidence >= process.env.SIGNAL_CONFIDENCE_THRESHOLD) {
            console.log(`🎯 SINAL GERADO para ${pair}:`);
            console.log(`   Cor: ${signal.color}`);
            console.log(`   Confiança: ${signal.confidence}%`);
            console.log(`   Razão: ${signal.reason}`);
            console.log(`   Timestamp: ${signal.timestamp}`);
            
            // Salvar sinal no banco
            await this.databaseManager.storeSignal(signal);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao gerar sinais:', error);
    }
  }

  async analyzePerformance() {
    try {
      const performance = await this.databaseManager.getPerformanceStats();
      console.log('📊 Performance do Sistema:');
      console.log(`   Total de Sinais: ${performance.totalSignals}`);
      console.log(`   Acertividade: ${performance.accuracy}%`);
      console.log(`   Sinais Corretos: ${performance.correctSignals}`);
      console.log(`   Sinais Incorretos: ${performance.incorrectSignals}`);
    } catch (error) {
      console.error('❌ Erro ao analisar performance:', error);
    }
  }

  async stop() {
    console.log('🛑 Parando sistema...');
    this.isRunning = false;
    
    await this.dataCollector.stop();
    await this.signalGenerator.stop();
    
    console.log('✅ Sistema parado');
  }
}

// Inicializar sistema
const system = new AITradingSystem();

// Tratamento de sinais para parada limpa
process.on('SIGINT', async () => {
  console.log('\n🛑 Recebido SIGINT, parando sistema...');
  await system.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Recebido SIGTERM, parando sistema...');
  await system.stop();
  process.exit(0);
});

// Iniciar sistema
system.start().catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});

module.exports = AITradingSystem;
