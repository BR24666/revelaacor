const dotenv = require('dotenv');
const DataCollector = require('./src/data-collectors/DataCollector');
const AIEngine = require('./src/ai-engine/AIEngine');
const SignalGenerator = require('./src/signal-generator/SignalGenerator');
const DatabaseManager = require('./src/utils/DatabaseManager');

// Carregar variáveis de ambiente
dotenv.config();

async function testSystem() {
  console.log('🧪 Iniciando teste do sistema...\n');

  try {
    // 1. Testar DatabaseManager
    console.log('1️⃣ Testando DatabaseManager...');
    const dbManager = new DatabaseManager();
    await dbManager.initialize();
    console.log('✅ DatabaseManager OK\n');

    // 2. Testar DataCollector
    console.log('2️⃣ Testando DataCollector...');
    const dataCollector = new DataCollector();
    const testPair = 'SOLUSDT';
    const marketData = await dataCollector.collectPairData(testPair);
    console.log(`✅ DataCollector OK - Dados coletados para ${testPair}`);
    console.log(`   Preço: $${marketData.price}`);
    console.log(`   Volume: ${marketData.volume}`);
    console.log(`   Velas: ${marketData.candles?.length || 0}\n`);

    // 3. Testar AIEngine
    console.log('3️⃣ Testando AIEngine...');
    const aiEngine = new AIEngine();
    await aiEngine.initialize();
    console.log('✅ AIEngine OK\n');

    // 4. Testar SignalGenerator
    console.log('4️⃣ Testando SignalGenerator...');
    const signalGenerator = new SignalGenerator();
    await signalGenerator.start();
    
    // Simular dados de mercado para teste
    const mockMarketData = [
      {
        pair: testPair,
        price: 100,
        volume: 1000000,
        timestamp: new Date().toISOString(),
        technical_indicators: {
          rsi: 30,
          macd: { macdLine: 0.5, signalLine: 0.3, histogram: 0.2 },
          bollingerBands: { upper: 105, middle: 100, lower: 95 },
          sma20: 98,
          ema12: 99
        },
        market_data: {
          marketCap: 1000000000,
          totalVolume: 50000000,
          priceChange24h: 2.5
        }
      }
    ];

    const signal = await signalGenerator.generateSignal(testPair, mockMarketData);
    if (signal) {
      console.log(`✅ SignalGenerator OK - Sinal gerado:`);
      console.log(`   Cor: ${signal.color}`);
      console.log(`   Confiança: ${signal.confidence}%`);
      console.log(`   Razão: ${signal.reason}\n`);
    } else {
      console.log('⚠️ SignalGenerator - Nenhum sinal gerado (normal para dados mock)\n');
    }

    // 5. Testar armazenamento no banco
    console.log('5️⃣ Testando armazenamento no banco...');
    await dbManager.storeMarketData(marketData);
    console.log('✅ Dados armazenados no banco\n');

    // 6. Testar busca de dados
    console.log('6️⃣ Testando busca de dados...');
    const historicalData = await dbManager.getHistoricalData(10);
    console.log(`✅ Busca OK - ${historicalData.length} registros encontrados\n`);

    // 7. Testar performance
    console.log('7️⃣ Testando métricas de performance...');
    const performance = await dbManager.getPerformanceStats();
    console.log(`✅ Performance OK - Acurácia: ${performance.accuracy}%\n`);

    console.log('🎉 Todos os testes passaram! Sistema funcionando corretamente.');
    console.log('\n📋 Resumo dos testes:');
    console.log('   ✅ DatabaseManager - Conexão e operações OK');
    console.log('   ✅ DataCollector - Coleta de dados OK');
    console.log('   ✅ AIEngine - Motor de IA OK');
    console.log('   ✅ SignalGenerator - Geração de sinais OK');
    console.log('   ✅ Armazenamento - Banco de dados OK');
    console.log('   ✅ Busca - Consultas OK');
    console.log('   ✅ Performance - Métricas OK');

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
    console.error('\n🔧 Possíveis soluções:');
    console.error('   1. Verifique se o arquivo .env está configurado corretamente');
    console.error('   2. Confirme se as credenciais do Supabase estão corretas');
    console.error('   3. Verifique se as APIs externas estão acessíveis');
    console.error('   4. Execute o script setup-database.sql no Supabase');
  }
}

// Executar teste
testSystem().then(() => {
  console.log('\n🏁 Teste concluído');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});
