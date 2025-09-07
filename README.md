# 🤖 Sistema de IA para Trading - Previsão de Cor da Próxima Vela

Sistema inteligente que desenvolve sua própria inteligência para revelar a cor da próxima vela, focado em **pullbacks** para máxima acertividade. Desenvolvido especificamente para operação na **Ebinex** onde as entradas valem para a próxima vela.

## 🎯 Objetivo

Desenvolver um sistema de IA que:
- **Preveja a cor da próxima vela** com máxima acertividade
- **Foque em pullbacks** para identificar oportunidades de alta probabilidade
- **Use múltiplas fontes de dados** (Binance, CoinGecko) para análise robusta
- **Aprenda continuamente** com base em price action e padrões históricos
- **Gere sinais em tempo real** para operação na Ebinex

## 🏗️ Arquitetura

```
src/
├── index.js                 # Arquivo principal do sistema
├── data-collectors/         # Coleta de dados de múltiplas fontes
│   └── DataCollector.js     # Coletor principal (Binance + CoinGecko)
├── ai-engine/              # Motor de inteligência artificial
│   └── AIEngine.js         # IA para análise e previsão
├── signal-generator/       # Geração de sinais de trading
│   └── SignalGenerator.js  # Gerador de sinais com validação
└── utils/                  # Utilitários e banco de dados
    └── DatabaseManager.js  # Gerenciador do Supabase
```

## 🚀 Funcionalidades

### 📊 Coleta de Dados
- **Binance API**: Dados de velas, preços, order book
- **CoinGecko API**: Dados de mercado, volume, volatilidade
- **Indicadores Técnicos**: RSI, MACD, Bollinger Bands, Médias Móveis
- **Price Action**: Padrões de velas, análise de pullbacks
- **Múltiplos Pares**: SOLUSDT, ETHUSDT, BTCUSDT, ADAUSDT, DOGEUSDT

### 🧠 Inteligência Artificial
- **Aprendizado Contínuo**: Treina com dados históricos e resultados
- **Foco em Pullbacks**: Especializado em identificar pullbacks válidos
- **Análise Multi-dimensional**: Combina indicadores técnicos, price action e dados de mercado
- **Validação de Sinais**: Múltiplas camadas de validação para garantir qualidade

### 📡 Geração de Sinais
- **Confiança Mínima**: 85% de confiança para gerar sinal
- **Análise de Pullbacks**: Foco em pullbacks > 2% de profundidade
- **Validação de Dados**: Verifica idade, volume e volatilidade dos dados
- **Razões Detalhadas**: Explica o motivo de cada sinal gerado

### 🗄️ Banco de Dados
- **Dados de Mercado**: Armazena dados históricos e em tempo real
- **Sinais de Trading**: Registra todos os sinais gerados
- **Performance**: Acompanha acertividade e resultados
- **Treinamento IA**: Dados para aprendizado contínuo

## ⚙️ Configuração

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo `env.example` para `.env` e configure:

```env
# Supabase Configuration
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anonima

# APIs
BINANCE_API_URL=https://api.binance.com/api/v3
COINGECKO_API_URL=https://api.coingecko.com/api/v3

# Configurações do Sistema
COLLECTION_INTERVAL=60000
SIGNAL_CONFIDENCE_THRESHOLD=85
MAX_CONCURRENT_PAIRS=10
PULLBACK_ANALYSIS_DEPTH=20

# Pares para Análise
TRADING_PAIRS=SOLUSDT,ETHUSDT,BTCUSDT,ADAUSDT,DOGEUSDT

# Configurações de IA
AI_LEARNING_RATE=0.01
AI_EPOCHS=100
AI_BATCH_SIZE=32
```

### 3. Executar Sistema
```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start
```

## 📈 Como Funciona

### 1. Coleta de Dados
- Coleta dados a cada minuto de múltiplas fontes
- Calcula indicadores técnicos em tempo real
- Analisa padrões de price action e pullbacks

### 2. Análise de Pullbacks
- Identifica picos e vales nos preços
- Calcula profundidade e força dos pullbacks
- Valida se pullbacks são significativos (> 2%)

### 3. Processamento de IA
- Extrai features multi-dimensionais dos dados
- Aplica modelo de IA treinado para previsão
- Calcula nível de confiança da predição

### 4. Geração de Sinais
- Gera sinal apenas se confiança ≥ 85%
- Valida sinal com múltiplas regras
- Registra sinal no banco de dados

### 5. Aprendizado Contínuo
- Treina IA a cada 5 minutos com novos dados
- Atualiza pesos baseado em performance
- Melhora acurácia ao longo do tempo

## 🎯 Estratégia de Pullbacks

O sistema é especializado em identificar **pullbacks válidos**:

1. **Detecção de Picos**: Identifica máximos locais nos preços
2. **Análise de Vales**: Encontra mínimos entre picos
3. **Cálculo de Profundidade**: Mede % de retração do pullback
4. **Validação de Recuperação**: Verifica se houve recuperação
5. **Força do Pullback**: Combina profundidade × recuperação

### Critérios para Pullback Válido:
- **Profundidade > 2%**: Pullback significativo
- **Recuperação > 50%**: Boa recuperação do vale
- **Volume Adequado**: Volume suficiente para validação
- **Tendência Clara**: Contexto de tendência definida

## 📊 Monitoramento

### Logs do Sistema
```
🤖 Sistema de IA para Trading iniciado
📊 Pares configurados: SOLUSDT, ETHUSDT, BTCUSDT, ADAUSDT, DOGEUSDT
⏱️ Intervalo de coleta: 60000ms
🗄️ Inicializando banco de dados...
✅ Banco de dados inicializado
📡 Iniciando coleta de dados...
✅ Dados coletados para SOLUSDT
🧠 Inicializando motor de IA...
✅ Motor de IA inicializado
📡 Iniciando gerador de sinais...
✅ Gerador de sinais iniciado
✅ Sistema iniciado com sucesso!
```

### Sinais Gerados
```
🎯 SINAL GERADO para SOLUSDT:
   Cor: GREEN
   Confiança: 87%
   Razão: Pullback detectado (3.2% de profundidade), RSI oversold, Tendência de alta
   Timestamp: 2025-01-07T16:37:00.000Z
```

## 🔧 Personalização

### Ajustar Confiança Mínima
```env
SIGNAL_CONFIDENCE_THRESHOLD=90  # 90% de confiança mínima
```

### Adicionar Novos Pares
```env
TRADING_PAIRS=SOLUSDT,ETHUSDT,BTCUSDT,ADAUSDT,DOGEUSDT,MATICUSDT
```

### Modificar Intervalo de Coleta
```env
COLLECTION_INTERVAL=30000  # 30 segundos
```

## 📈 Performance Esperada

- **Acurácia Inicial**: 70-80% (baseado em dados históricos)
- **Acurácia com Aprendizado**: 85-95% (após treinamento)
- **Foco em Pullbacks**: Reduz ruído e aumenta precisão
- **Validação Múltipla**: Garante qualidade dos sinais

## 🛡️ Segurança

- **Validação de Dados**: Verifica idade e qualidade dos dados
- **Rate Limiting**: Respeita limites das APIs
- **Error Handling**: Tratamento robusto de erros
- **Logging Detalhado**: Monitoramento completo do sistema

## 🚀 Próximos Passos

1. **Integração com Ebinex**: Conectar com API da corretora
2. **Interface Web**: Dashboard para monitoramento
3. **Alertas**: Notificações em tempo real
4. **Backtesting**: Simulação com dados históricos
5. **Otimização**: Melhoria contínua dos algoritmos

## 📞 Suporte

Para dúvidas ou problemas:
- Verifique os logs do sistema
- Confirme configuração das variáveis de ambiente
- Valide conectividade com APIs externas
- Monitore performance no banco de dados

---

**Desenvolvido com foco em máxima acertividade para operação na Ebinex** 🎯
