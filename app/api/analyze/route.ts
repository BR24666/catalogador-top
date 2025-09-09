import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://lgddsslskhzxtpjathjr.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws'
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    // Buscar dados de mercado coletados
    const { data: marketData, error: marketError } = await supabase
      .from('market_data')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1000)

    if (marketError) {
      console.error('Erro ao buscar dados de mercado:', marketError)
      return NextResponse.json({ success: false, analysis: null })
    }

    if (!marketData || marketData.length === 0) {
      return NextResponse.json({ success: false, analysis: null })
    }

    // Calcular estatísticas baseadas nos dados coletados
    const totalSignals = marketData.length
    const greenSignals = marketData.filter(d => d.technical_indicators?.color === 'GREEN').length
    const redSignals = marketData.filter(d => d.technical_indicators?.color === 'RED').length
    const yellowSignals = marketData.filter(d => d.technical_indicators?.color === 'YELLOW').length
    
    // Calcular precisão baseada em padrões de preço
    const priceChanges = marketData.map(d => {
      const change = ((d.close - d.open) / d.open) * 100
      return {
        pair: d.pair,
        change: change,
        predicted: d.technical_indicators?.color === 'GREEN' ? 'UP' : 'DOWN',
        actual: change > 0 ? 'UP' : 'DOWN'
      }
    })

    const correctPredictions = priceChanges.filter(p => p.predicted === p.actual).length
    const accuracy = totalSignals > 0 ? (correctPredictions / totalSignals) * 100 : 0

    const analysis = {
      totalSignals: totalSignals,
      accuracy: Math.round(accuracy * 100) / 100,
      greenSignals: greenSignals,
      redSignals: redSignals,
      yellowSignals: yellowSignals,
      pairsAnalyzed: [...new Set(marketData.map(d => d.pair))].length,
      lastUpdate: marketData[0]?.timestamp,
      averageConfidence: Math.round(
        marketData.reduce((sum, d) => sum + (d.technical_indicators?.rsi || 50), 0) / totalSignals
      )
    }

    return NextResponse.json({ 
      success: true, 
      analysis: analysis,
      message: 'Análise baseada nos dados coletados'
    })

  } catch (error) {
    console.error('Erro ao analisar dados:', error)
    return NextResponse.json({ success: false, analysis: null })
  }
}
