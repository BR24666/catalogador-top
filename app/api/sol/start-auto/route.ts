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
    console.log('🚀 Iniciando sistema automático SOL AI...')
    
    // 1. Verificar se já está rodando
    const { data: existingStats } = await supabase
      .from('sol_learning_stats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingStats?.learning_phase === 'LEARNING') {
      console.log('⚠️ Sistema já está rodando')
      return NextResponse.json({
        success: true,
        message: 'Sistema já está rodando',
        learningPhase: 'LEARNING'
      })
    }

    // 2. Coletar dados históricos do SOL
    console.log('📊 Coletando dados históricos do SOL...')
    const historicalData = await solDataCollector.collectAndSaveHistoricalData()
    
    if (historicalData.length === 0) {
      throw new Error('Nenhum dado histórico coletado')
    }

    // 3. Atualizar estatísticas
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

    // 4. Gerar pares simulados e treinar modelo
    console.log('🔄 Gerando 500 pares simulados para aprendizado...')
    const simulatedPairs = solMLEngine.generateSimulatedPairs(500, historicalData)
    
    console.log('🎯 Treinando modelo com Machine Learning...')
    const trainingResult = await solMLEngine.trainModel(historicalData, simulatedPairs)
    
    // 5. Validar com pullbacks
    console.log('🔍 Validando modelo com pullbacks...')
    const validationResult = await solMLEngine.validateWithPullbacks(historicalData)
    
    // 6. Calcular precisão final
    const finalAccuracy = (trainingResult.accuracy + validationResult.accuracy) / 2
    const learningPhase = finalAccuracy >= 95 ? 'MASTER' : finalAccuracy >= 80 ? 'READY' : 'LEARNING'
    
    // 7. Salvar modelo treinado
    await solMLEngine.saveModel(trainingResult.weights, finalAccuracy)
    
    // 8. Atualizar estatísticas finais
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

    console.log('✅ Sistema automático iniciado com sucesso:', {
      accuracy: finalAccuracy,
      phase: learningPhase,
      simulations: trainingResult.totalSimulations
    })

    return NextResponse.json({
      success: true,
      message: 'Sistema automático iniciado com sucesso',
      stats: {
        accuracy: finalAccuracy,
        learningPhase,
        totalSimulations: trainingResult.totalSimulations,
        solDataPoints: historicalData.length
      }
    })

  } catch (error) {
    console.error('Erro ao iniciar sistema automático:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao iniciar sistema automático',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}


