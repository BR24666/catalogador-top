import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SolMLEngine } from '@/lib/sol-ml-engine'
import { fetchHistoricalData } from '@/lib/sol-data-collector'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Variável global para controlar o aprendizado contínuo
let isContinuousLearning = false
let learningInterval: NodeJS.Timeout | null = null

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando aprendizado contínuo automático...')
    
    if (isContinuousLearning) {
      return NextResponse.json({
        success: true,
        message: 'Aprendizado contínuo já está ativo',
        isRunning: true
      })
    }

    // Iniciar aprendizado contínuo
    isContinuousLearning = true
    
    // Executar aprendizado a cada 30 segundos
    learningInterval = setInterval(async () => {
      try {
        await executeContinuousLearning()
      } catch (error) {
        console.error('Erro no aprendizado contínuo:', error)
      }
    }, 30000) // 30 segundos

    // Executar primeiro aprendizado imediatamente
    await executeContinuousLearning()

    return NextResponse.json({
      success: true,
      message: 'Aprendizado contínuo iniciado com sucesso',
      isRunning: true,
      interval: '30 segundos'
    })

  } catch (error) {
    console.error('Erro ao iniciar aprendizado contínuo:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao iniciar aprendizado contínuo',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      isRunning: isContinuousLearning,
      interval: '30 segundos'
    })
  } catch (error) {
    console.error('Erro ao verificar status do aprendizado contínuo:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao verificar status',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🛑 Parando aprendizado contínuo...')
    
    if (learningInterval) {
      clearInterval(learningInterval)
      learningInterval = null
    }
    
    isContinuousLearning = false

    return NextResponse.json({
      success: true,
      message: 'Aprendizado contínuo parado com sucesso',
      isRunning: false
    })

  } catch (error) {
    console.error('Erro ao parar aprendizado contínuo:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao parar aprendizado contínuo',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

async function executeContinuousLearning() {
  try {
    console.log('🧠 Executando aprendizado contínuo automático...')
    
    // Buscar dados históricos
    const historicalCandles = await fetchHistoricalData()
    if (!historicalCandles || historicalCandles.length === 0) {
      console.log('⚠️ Nenhum dado histórico encontrado, pulando execução...')
      return
    }

    // Criar engine de ML
    const solMLEngine = new SolMLEngine()
    
    // Gerar pares simulados
    const simulatedPairs = solMLEngine.generateSimulatedPairs(500)
    
    // Treinar modelo
    const trainingResult = await solMLEngine.trainModel(historicalCandles, simulatedPairs)
    
    // Salvar modelo
    await solMLEngine.saveModel(trainingResult.accuracy)
    
    // Atualizar estatísticas
    const { error: statsError } = await supabase
      .from('sol_learning_stats')
      .update({
        accuracy: trainingResult.accuracy,
        learning_phase: 'LEARNING',
        total_simulations: trainingResult.totalSimulations,
        last_update: new Date().toISOString()
      })
      .eq('id', 1)

    if (statsError) {
      console.error('Erro ao atualizar estatísticas:', statsError)
    }

    console.log(`✅ Aprendizado contínuo concluído - Precisão: ${trainingResult.accuracy.toFixed(2)}%`)
    
    // Se atingir 95% de precisão, parar o aprendizado contínuo
    if (trainingResult.accuracy >= 95) {
      console.log('🎯 Meta de 95% atingida! Parando aprendizado contínuo...')
      if (learningInterval) {
        clearInterval(learningInterval)
        learningInterval = null
      }
      isContinuousLearning = false
    }

  } catch (error) {
    console.error('Erro na execução do aprendizado contínuo:', error)
  }
}


