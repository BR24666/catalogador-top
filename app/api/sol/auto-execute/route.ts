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
    console.log('🤖 Executando ciclo automático do SOL AI...')
    
    // 1. Verificar status do sistema
    const { data: statsData } = await supabase
      .from('sol_learning_stats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!statsData) {
      throw new Error('Sistema não inicializado')
    }

    // 2. Coletar dados atuais
    console.log('📊 Coletando dados atuais do SOL...')
    const currentData = await solDataCollector.fetchCurrentData()
    
    if (currentData) {
      // Salvar dados atuais
      await supabase
        .from('sol_candles')
        .insert({
          timestamp: new Date(currentData.timestamp).toISOString(),
          open: currentData.open,
          high: currentData.high,
          low: currentData.low,
          close: currentData.close,
          volume: currentData.volume,
          color: currentData.color,
          next_color: currentData.nextColor
        })

      // Atualizar contador de dados
      await supabase
        .from('sol_learning_stats')
        .upsert({
          id: 1,
          learning_phase: statsData.learning_phase,
          total_simulations: statsData.total_simulations,
          accuracy: statsData.accuracy,
          sol_data_points: statsData.sol_data_points + 1,
          last_update: new Date().toISOString(),
          created_at: statsData.created_at
        })
    }

    // 3. Verificar se precisa de aprendizado
    const needsLearning = statsData.learning_phase === 'INITIAL' || 
                         (statsData.accuracy < 80 && statsData.total_simulations < 1000)

    if (needsLearning) {
      console.log('🧠 Iniciando aprendizado automático...')
      
      // Coletar dados históricos
      const historicalData = await solDataCollector.collectAndSaveHistoricalData()
      
      if (historicalData.length > 0) {
        // Gerar pares simulados e treinar
        const simulatedPairs = solMLEngine.generateSimulatedPairs(500, historicalData)
        const trainingResult = await solMLEngine.trainModel(historicalData, simulatedPairs)
        const validationResult = await solMLEngine.validateWithPullbacks(historicalData)
        
        const finalAccuracy = (trainingResult.accuracy + validationResult.accuracy) / 2
        const learningPhase = finalAccuracy >= 95 ? 'MASTER' : finalAccuracy >= 80 ? 'READY' : 'LEARNING'
        
        // Salvar modelo e atualizar estatísticas
        await solMLEngine.saveModel(trainingResult.weights, finalAccuracy)
        await supabase
          .from('sol_learning_stats')
          .upsert({
            id: 1,
            learning_phase: learningPhase,
            total_simulations: trainingResult.totalSimulations,
            accuracy: finalAccuracy,
            sol_data_points: historicalData.length,
            last_update: new Date().toISOString(),
            created_at: statsData.created_at
          })

        console.log('✅ Aprendizado automático concluído:', {
          accuracy: finalAccuracy,
          phase: learningPhase
        })
      }
    }

    // 4. Se o sistema estiver pronto, gerar sinal
    if (statsData.learning_phase === 'MASTER' || statsData.learning_phase === 'READY') {
      console.log('🎯 Gerando sinal automático...')
      
      const currentData = await solDataCollector.fetchCurrentData()
      if (currentData) {
        const prediction = await solMLEngine.predictNextCandle(currentData)
        
        if (prediction) {
          // Salvar sinal gerado
          await supabase
            .from('sol_signals')
            .insert({
              prediction: prediction.prediction,
              confidence: prediction.confidence,
              price: currentData.close,
              timestamp: new Date().toISOString(),
              accuracy: prediction.accuracy
            })

          console.log('✅ Sinal automático gerado:', {
            prediction: prediction.prediction,
            confidence: prediction.confidence
          })
        }
      }
    }

    console.log('✅ Ciclo automático executado com sucesso')

    return NextResponse.json({
      success: true,
      message: 'Ciclo automático executado com sucesso',
      stats: {
        learningPhase: statsData.learning_phase,
        accuracy: statsData.accuracy,
        totalSimulations: statsData.total_simulations,
        solDataPoints: statsData.sol_data_points
      }
    })

  } catch (error) {
    console.error('Erro na execução automática:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro na execução automática',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}


