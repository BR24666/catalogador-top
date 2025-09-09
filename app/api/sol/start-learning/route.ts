import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { solDataCollector } from '@/lib/sol-data-collector'
import { solMLEngine } from '@/lib/sol-ml-engine'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando aprendizado SOL AI...')
    
    // 1. Carregar dados existentes do banco
    const { data: existingCandles } = await supabase
      .from('sol_candles')
      .select('*')
      .order('timestamp', { ascending: true })
    
    if (!existingCandles || existingCandles.length < 100) {
      throw new Error('Dados insuficientes no banco. Execute a coleta primeiro.')
    }
    
    console.log(`📊 Carregados ${existingCandles.length} velas do banco`)
    
    // 2. Converter dados do banco para formato do ML
    const historicalData = existingCandles.map(candle => ({
      timestamp: new Date(candle.timestamp).getTime(),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
      color: candle.color,
      nextColor: candle.next_color
    }))
    
    // 3. Gerar pares simulados
    console.log('🔄 Gerando 500 pares simulados...')
    const simulatedPairs = solMLEngine.generateSimulatedPairs(500, historicalData)
    
    // 4. Treinar modelo
    console.log('🎯 Treinando modelo...')
    const trainingResult = await solMLEngine.trainModel(historicalData, simulatedPairs)
    
    // 5. Validar com pullbacks
    console.log('🔍 Validando com pullbacks...')
    const validationResult = await solMLEngine.validateWithPullbacks(historicalData)
    
    // 6. Calcular precisão final
    const finalAccuracy = (trainingResult.accuracy + validationResult.accuracy) / 2
    const learningPhase = finalAccuracy >= 95 ? 'MASTER' : finalAccuracy >= 80 ? 'READY' : 'LEARNING'
    
    // 7. Salvar modelo
    await solMLEngine.saveModel(trainingResult.weights, finalAccuracy)
    
    // 8. Atualizar estatísticas
    await supabase
      .from('sol_learning_stats')
      .upsert({
        id: 1,
        learning_phase: learningPhase,
        total_simulations: trainingResult.totalSimulations,
        accuracy: finalAccuracy,
        sol_data_points: historicalData.length,
        last_update: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
    
    console.log('✅ Aprendizado concluído:', {
      accuracy: finalAccuracy,
      phase: learningPhase,
      simulations: trainingResult.totalSimulations
    })
    
    return NextResponse.json({
      success: true,
      message: 'Aprendizado concluído com sucesso',
      stats: {
        accuracy: finalAccuracy,
        learningPhase,
        totalSimulations: trainingResult.totalSimulations,
        solDataPoints: historicalData.length,
        trainingAccuracy: trainingResult.accuracy,
        validationAccuracy: validationResult.accuracy
      }
    })
    
  } catch (error) {
    console.error('Erro no aprendizado:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no aprendizado',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}


