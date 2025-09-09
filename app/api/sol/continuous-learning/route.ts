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
    console.log('🔄 Iniciando aprendizado contínuo SOL AI...')
    
    // 1. Coletar dados atuais
    console.log('📈 Coletando dados atuais do SOL...')
    const currentData = await solDataCollector.fetchCurrentData(100)
    await solDataCollector.saveCandlesToSupabase(currentData)
    
    // 2. Carregar dados históricos
    const { data: historicalCandles } = await supabase
      .from('sol_candles')
      .select('*')
      .order('timestamp', { ascending: true })
    
    if (!historicalCandles || historicalCandles.length < 100) {
      throw new Error('Dados insuficientes para aprendizado contínuo')
    }
    
    console.log(`📊 Total de dados disponíveis: ${historicalCandles.length} velas`)
    
    // 3. Gerar pares simulados
    console.log('🔄 Gerando 500 pares simulados...')
    const simulatedPairs = solMLEngine.generateSimulatedPairs(500, historicalCandles)
    
    // 4. Combinar dados
    const allTrainingData = [...historicalCandles, ...simulatedPairs]
    
    // 5. Treinar modelo
    console.log('🧠 Treinando modelo...')
    const trainingResult = await solMLEngine.trainModel(historicalCandles, simulatedPairs)
    
    // 6. Validar
    const validationResult = await solMLEngine.validateWithPullbacks(historicalCandles)
    
    // 7. Calcular precisão final
    const finalAccuracy = (trainingResult.accuracy + validationResult.pullbackAccuracy) / 2
    
    // 8. Salvar modelo se precisão melhorou
    if (finalAccuracy > 50) {
      await solMLEngine.saveModel(trainingResult.weights, finalAccuracy)
    }
    
    // 9. Atualizar estatísticas
    const newPhase = finalAccuracy >= 95 ? 'READY' : 
                    finalAccuracy >= 80 ? 'LEARNING' : 'INITIAL'
    
    await supabase
      .from('sol_learning_stats')
      .upsert({
        id: 1,
        totalSimulations: trainingResult.totalSimulations,
        accuracy: finalAccuracy,
        learningPhase: newPhase,
        solDataPoints: historicalCandles.length,
        lastUpdate: new Date().toISOString(),
        targetAccuracy: 95
      })
    
    console.log(`✅ Aprendizado contínuo concluído - Precisão: ${finalAccuracy.toFixed(2)}%`)
    
    return NextResponse.json({
      success: true,
      message: 'Aprendizado contínuo concluído!',
      stats: {
        accuracy: finalAccuracy,
        phase: newPhase,
        totalSimulations: trainingResult.totalSimulations,
        dataPoints: historicalCandles.length
      }
    })
    
  } catch (error) {
    console.error('Erro no aprendizado contínuo:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no aprendizado contínuo',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
