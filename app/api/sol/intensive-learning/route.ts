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
    console.log('🚀 Iniciando aprendizado intensivo SOL AI...')
    
    // 1. Carregar TODOS os dados disponíveis
    const { data: allCandles } = await supabase
      .from('sol_candles')
      .select('*')
      .order('timestamp', { ascending: true })
    
    if (!allCandles || allCandles.length < 1000) {
      throw new Error('Dados insuficientes. Execute a coleta primeiro.')
    }
    
    console.log(`📊 Carregados ${allCandles.length} velas do banco`)
    
    // 2. Gerar MUITOS pares simulados (1000 em vez de 500)
    console.log('🔄 Gerando 1000 pares simulados para aprendizado intensivo...')
    const simulatedPairs = solMLEngine.generateSimulatedPairs(1000, allCandles)
    
    // 3. Combinar dados reais + simulados
    const allTrainingData = [...allCandles, ...simulatedPairs]
    console.log(`🎯 Total de dados para treinamento: ${allTrainingData.length}`)
    
    // 4. Treinar modelo com dados completos
    console.log('🧠 Treinando modelo com Machine Learning intensivo...')
    const trainingResult = await solMLEngine.trainModel(allCandles, simulatedPairs)
    
    console.log(`✅ Treinamento concluído - Precisão: ${trainingResult.accuracy.toFixed(2)}%`)
    
    // 5. Validar com pullbacks
    console.log('🔍 Validando modelo com pullbacks...')
    const validationResult = await solMLEngine.validateWithPullbacks(allCandles)
    
    console.log(`✅ Validação com pullbacks: ${validationResult.pullbackAccuracy.toFixed(2)}%`)
    
    // 6. Calcular precisão final
    const finalAccuracy = (trainingResult.accuracy + validationResult.pullbackAccuracy) / 2
    
    // 7. Salvar modelo se precisão > 60%
    if (finalAccuracy > 60) {
      await solMLEngine.saveModel(trainingResult.weights, finalAccuracy)
      console.log('💾 Modelo salvo no Supabase')
    }
    
    // 8. Atualizar estatísticas
    const newPhase = finalAccuracy >= 95 ? 'READY' : 
                    finalAccuracy >= 80 ? 'LEARNING' : 'INITIAL'
    
    await supabase
      .from('sol_learning_stats')
      .upsert({
        id: 1,
        totalSimulations: trainingResult.totalSimulations,
        accuracy: finalAccuracy,
        learningPhase: newPhase,
        solDataPoints: allCandles.length,
        lastUpdate: new Date().toISOString(),
        targetAccuracy: 95
      })
    
    console.log(`✅ Estatísticas atualizadas - Fase: ${newPhase}, Precisão: ${finalAccuracy.toFixed(2)}%`)
    
    return NextResponse.json({
      success: true,
      message: 'Aprendizado intensivo concluído!',
      stats: {
        totalDataPoints: allCandles.length,
        simulatedPairs: simulatedPairs.length,
        totalTrainingData: allTrainingData.length,
        accuracy: finalAccuracy,
        phase: newPhase,
        totalSimulations: trainingResult.totalSimulations,
        pullbackAccuracy: validationResult.pullbackAccuracy
      }
    })
    
  } catch (error) {
    console.error('Erro no aprendizado intensivo:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no aprendizado intensivo',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
