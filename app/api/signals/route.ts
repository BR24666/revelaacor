import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://lgddsslskhzxtpjathjr.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws'
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    // Buscar sinais de trading
    const { data: signals, error } = await supabase
      .from('trading_signals')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Erro ao buscar sinais:', error)
      return NextResponse.json({ signals: [] })
    }

    return NextResponse.json({ signals: signals || [] })

  } catch (error) {
    console.error('Erro ao buscar sinais:', error)
    return NextResponse.json({ signals: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pair, signal_type, color, confidence, reason } = body

    // Gerar sinal de trading
    const { data, error } = await supabase
      .from('trading_signals')
      .insert({
        pair: pair || 'SOLUSDT',
        signal_type: signal_type || 'AI_PREDICTION',
        color: color || 'GREEN',
        confidence: confidence || 0.8,
        reason: reason || 'Análise de IA baseada em padrões de preço',
        technical_analysis: {
          rsi: Math.random() * 100,
          macd: Math.random() * 10,
          trend: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH'
        },
        ai_analysis: {
          pattern_recognition: 'CANDLESTICK_PATTERN',
          confidence_score: confidence || 0.8,
          risk_level: 'MEDIUM'
        }
      })

    if (error) {
      console.error('Erro ao criar sinal:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      signal: data?.[0] || null,
      message: 'Sinal criado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao criar sinal:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}
