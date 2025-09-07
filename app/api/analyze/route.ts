import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    // Buscar estatísticas do sistema
    const { data: signals, error: signalsError } = await supabase
      .from('trading_signals')
      .select('*')

    if (signalsError) {
      console.error('Erro ao buscar sinais:', signalsError)
      return NextResponse.json({ stats: null })
    }

    // Calcular estatísticas
    const totalSignals = signals?.length || 0
    const executedSignals = signals?.filter(s => s.executed) || []
    const correctSignals = executedSignals.filter(s => s.result === 'WIN').length
    const accuracy = executedSignals.length > 0 ? correctSignals / executedSignals.length : 0

    // Simular P&L (em um sistema real, isso viria de dados reais de trades)
    const profitLoss = (Math.random() - 0.3) * 1000 // Simulação

    const stats = {
      total_signals: totalSignals,
      correct_signals: correctSignals,
      accuracy: accuracy,
      profit_loss: profitLoss,
      executed_signals: executedSignals.length,
      pending_signals: totalSignals - executedSignals.length
    }

    return NextResponse.json({ stats })

  } catch (error) {
    console.error('Erro ao analisar dados:', error)
    return NextResponse.json({ stats: null })
  }
}
