import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    // Simular coleta de dados do Binance
    const response = await axios.get('https://api.binance.com/api/v3/klines', {
      params: {
        symbol: 'SOLUSDT',
        interval: '1m',
        limit: 1
      }
    })

    const kline = response.data[0]
    const [openTime, open, high, low, close, volume] = kline

    // Determinar cor da vela
    const color = parseFloat(close) > parseFloat(open) ? 'GREEN' : 'RED'

    // Salvar no banco de dados
    const { data, error } = await supabase
      .from('market_data')
      .insert({
        pair: 'SOLUSDT',
        source: 'binance',
        price: parseFloat(close),
        volume: parseFloat(volume),
        high: parseFloat(high),
        low: parseFloat(low),
        open: parseFloat(open),
        close: parseFloat(close),
        technical_indicators: {
          rsi: Math.random() * 100,
          macd: Math.random() * 10,
          ema_20: parseFloat(close) * (0.98 + Math.random() * 0.04)
        }
      })

    if (error) {
      console.error('Erro ao salvar dados:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Dados coletados com sucesso',
      data: {
        pair: 'SOLUSDT',
        price: parseFloat(close),
        color,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Erro na coleta de dados:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}
