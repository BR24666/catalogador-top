import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testando aprendizado simples...')
    
    // 1. Carregar dados existentes
    const { data: allCandles } = await supabase
      .from('sol_candles')
      .select('*')
      .order('timestamp', { ascending: true })
      .limit(100) // Limitar para teste
    
    if (!allCandles || allCandles.length < 10) {
      throw new Error('Dados insuficientes para teste')
    }
    
    console.log(`📊 Carregados ${allCandles.length} velas do banco`)
    
    // 2. Simular aprendizado simples
    let correctPredictions = 0
    let totalPredictions = 0
    
    for (let i = 10; i < allCandles.length - 1; i++) {
      const currentCandle = allCandles[i]
      const nextCandle = allCandles[i + 1]
      
      if (!currentCandle || !nextCandle) continue
      
      // Previsão simples: se fechou verde, próxima será vermelha (e vice-versa)
      const prediction = currentCandle.color === 'GREEN' ? 'RED' : 'GREEN'
      const actual = nextCandle.color
      
      totalPredictions++
      if (prediction === actual) {
        correctPredictions++
      }
    }
    
    const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0
    
    console.log(`✅ Teste concluído - Precisão: ${accuracy.toFixed(2)}%`)
    
    // 3. Atualizar estatísticas
    await supabase
      .from('sol_learning_stats')
      .upsert({
        id: 1,
        totalSimulations: totalPredictions,
        accuracy: accuracy,
        learningPhase: accuracy >= 80 ? 'LEARNING' : 'INITIAL',
        solDataPoints: allCandles.length,
        lastUpdate: new Date().toISOString(),
        targetAccuracy: 95
      })
    
    return NextResponse.json({
      success: true,
      message: 'Teste de aprendizado simples concluído!',
      stats: {
        totalDataPoints: allCandles.length,
        accuracy: accuracy,
        totalSimulations: totalPredictions,
        correctPredictions: correctPredictions
      }
    })
    
  } catch (error) {
    console.error('Erro no teste de aprendizado simples:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no teste de aprendizado simples',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}


