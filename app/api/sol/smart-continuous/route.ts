import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Variável global para controlar o aprendizado contínuo inteligente
let isSmartLearning = false
let smartLearningInterval: NodeJS.Timeout | null = null

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando aprendizado contínuo inteligente com força total...')
    
    if (isSmartLearning) {
      return NextResponse.json({
        success: true,
        message: 'Aprendizado contínuo inteligente já está ativo',
        isRunning: true
      })
    }

    // Iniciar aprendizado contínuo inteligente
    isSmartLearning = true
    
    // Executar aprendizado a cada 15 segundos (mais frequente)
    smartLearningInterval = setInterval(async () => {
      try {
        await executeSmartLearning()
      } catch (error) {
        console.error('Erro no aprendizado contínuo inteligente:', error)
      }
    }, 15000) // 15 segundos

    // Executar primeiro aprendizado imediatamente
    await executeSmartLearning()

    return NextResponse.json({
      success: true,
      message: 'Aprendizado contínuo inteligente iniciado com força total!',
      isRunning: true,
      interval: '15 segundos'
    })

  } catch (error) {
    console.error('Erro ao iniciar aprendizado contínuo inteligente:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao iniciar aprendizado contínuo inteligente',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      isRunning: isSmartLearning,
      interval: '15 segundos'
    })
  } catch (error) {
    console.error('Erro ao verificar status do aprendizado contínuo inteligente:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao verificar status',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🛑 Parando aprendizado contínuo inteligente...')
    
    if (smartLearningInterval) {
      clearInterval(smartLearningInterval)
      smartLearningInterval = null
    }
    
    isSmartLearning = false

    return NextResponse.json({
      success: true,
      message: 'Aprendizado contínuo inteligente parado com sucesso',
      isRunning: false
    })

  } catch (error) {
    console.error('Erro ao parar aprendizado contínuo inteligente:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao parar aprendizado contínuo inteligente',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

async function executeSmartLearning() {
  try {
    console.log('🧠 Executando aprendizado inteligente contínuo...')
    
    // Pares principais para análise rápida
    const mainPairs = ['EURUSD', 'SOLUSDT', 'BTCUSDT', 'ETHUSDT', 'GBPUSD', 'USDJPY']
    const allCandles = []
    
    // Coletar dados dos pares principais
    for (const pair of mainPairs) {
      try {
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=1m&limit=100`)
        const data = await response.json()
        
        if (Array.isArray(data)) {
          const pairCandles = data.map((candle: any[]) => ({
            timestamp: parseInt(candle[0]),
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3]),
            close: parseFloat(candle[4]),
            volume: parseFloat(candle[5]),
            pair: pair,
            color: parseFloat(candle[4]) > parseFloat(candle[1]) ? 'GREEN' : 'RED'
          }))
          allCandles.push(...pairCandles)
        }
        
        // Pausa mínima para respeitar rate limits
        await new Promise(resolve => setTimeout(resolve, 50))
      } catch (error) {
        console.error(`Erro ao coletar ${pair}:`, error)
      }
    }
    
    if (allCandles.length === 0) {
      console.log('⚠️ Nenhum dado coletado, pulando execução...')
      return
    }
    
    // Simular trades e calcular precisão
    let totalTrades = 0
    let correctTrades = 0
    
    // Agrupar velas por par
    const pairCandles: { [pair: string]: any[] } = {}
    allCandles.forEach(candle => {
      if (!pairCandles[candle.pair]) {
        pairCandles[candle.pair] = []
      }
      pairCandles[candle.pair].push(candle)
    })
    
    // Simular trades para cada par
    Object.keys(pairCandles).forEach(pair => {
      const candles = pairCandles[pair]
      if (candles.length < 20) return
      
      // Simular trades (pular as primeiras 10 velas)
      for (let i = 10; i < candles.length - 1; i++) {
        const currentCandle = candles[i]
        const nextCandle = candles[i + 1]
        
        // Estratégia otimizada
        const trend = (currentCandle.close - currentCandle.open) / currentCandle.open
        const volume = currentCandle.volume
        const momentum = (currentCandle.close - candles[i - 1].close) / candles[i - 1].close
        
        // Fazer previsão baseada em features otimizadas
        let prediction = 'YELLOW'
        if (trend > 0.0005 && volume > 0 && momentum > 0) {
          prediction = 'GREEN'
        } else if (trend < -0.0005 && volume > 0 && momentum < 0) {
          prediction = 'RED'
        }
        
        // Verificar se a previsão estava correta
        const actualColor = nextCandle.color
        if (prediction === actualColor) {
          correctTrades++
        }
        
        totalTrades++
      }
    })
    
    const accuracy = totalTrades > 0 ? (correctTrades / totalTrades) * 100 : 0
    
    // Determinar fase de aprendizado
    let learningPhase = 'INITIAL'
    if (accuracy >= 95) {
      learningPhase = 'READY'
    } else if (accuracy >= 80) {
      learningPhase = 'OPTIMIZING'
    } else if (accuracy >= 50) {
      learningPhase = 'LEARNING'
    }
    
    // Atualizar estatísticas
    const { error: statsError } = await supabase
      .from('sol_learning_stats')
      .upsert({
        id: 1,
        accuracy: accuracy,
        learning_phase: learningPhase,
        total_simulations: totalTrades,
        sol_data_points: allCandles.length,
        last_update: new Date().toISOString(),
        target_accuracy: 95
      })
    
    if (statsError) {
      console.error('Erro ao atualizar estatísticas:', statsError)
    }
    
    console.log(`✅ Aprendizado inteligente concluído - Precisão: ${accuracy.toFixed(2)}%`)
    
    // Se atingir 95% de precisão, parar o aprendizado contínuo
    if (accuracy >= 95) {
      console.log('🎯 Meta de 95% atingida! Parando aprendizado contínuo...')
      if (smartLearningInterval) {
        clearInterval(smartLearningInterval)
        smartLearningInterval = null
      }
      isSmartLearning = false
    }

  } catch (error) {
    console.error('Erro na execução do aprendizado inteligente:', error)
  }
}


