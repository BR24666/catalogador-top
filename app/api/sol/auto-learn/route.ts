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
    console.log('🤖 Iniciando aprendizado automático do SOL AI...')
    
    // Verificar se já está aprendendo
    const { data: existingStats } = await supabase
      .from('sol_learning_stats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingStats?.learning_phase === 'LEARNING') {
      console.log('⚠️ Sistema já está aprendendo, pulando...')
      return NextResponse.json({
        success: true,
        message: 'Sistema já está aprendendo',
        learningPhase: 'LEARNING'
      })
    }

    // 1. Coletar dados históricos do SOL
    console.log('📊 Coletando dados históricos do SOL...')
    const historicalData = await solDataCollector.collectAndSaveHistoricalData()
    
    if (historicalData.length === 0) {
      throw new Error('Nenhum dado histórico coletado')
    }

    // 2. Atualizar estatísticas
    await supabase
      .from('sol_learning_stats')
      .upsert({
        id: 1,
        learning_phase: 'LEARNING',
        total_simulations: 0,
        accuracy: 0,
        sol_data_points: historicalData.length,
        last_update: new Date().toISOString(),
        created_at: new Date().toISOString()
      })

    // 3. Gerar pares simulados e treinar modelo
    console.log('🔄 Gerando 500 pares simulados para aprendizado...')
    const simulatedPairs = solMLEngine.generateSimulatedPairs(500, historicalData)
    
    console.log('🎯 Treinando modelo com Machine Learning...')
    const trainingResult = await solMLEngine.trainModel(historicalData, simulatedPairs)
    
    // 4. Validar com pullbacks
    console.log('🔍 Validando modelo com pullbacks...')
    const validationResult = await solMLEngine.validateWithPullbacks(historicalData)
    
    // 5. Calcular precisão final
    const finalAccuracy = (trainingResult.accuracy + validationResult.accuracy) / 2
    const learningPhase = finalAccuracy >= 95 ? 'MASTER' : finalAccuracy >= 80 ? 'READY' : 'LEARNING'
    
    // 6. Salvar modelo treinado
    await solMLEngine.saveModel(trainingResult.weights, finalAccuracy)
    
    // 7. Atualizar estatísticas finais
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

    console.log('✅ Aprendizado automático concluído:', {
      accuracy: finalAccuracy,
      phase: learningPhase,
      simulations: trainingResult.totalSimulations
    })

    return NextResponse.json({
      success: true,
      message: 'Aprendizado automático concluído',
      stats: {
        accuracy: finalAccuracy,
        learningPhase,
        totalSimulations: trainingResult.totalSimulations,
        solDataPoints: historicalData.length
      }
    })

  } catch (error) {
    console.error('Erro no aprendizado automático:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no aprendizado automático',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}


