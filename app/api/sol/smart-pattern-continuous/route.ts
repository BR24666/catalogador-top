import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PatternBasedMLEngine } from '@/lib/pattern-based-ml-engine'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Pares focados para aprendizado contínuo
const FOCUSED_PAIRS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'SOLUSDT',
  'DOTUSDT', 'DOGEUSDT', 'AVAXUSDT', 'MATICUSDT', 'LTCUSDT',
  'UNIUSDT', 'LINKUSDT', 'ATOMUSDT', 'XLMUSDT', 'BCHUSDT',
  'TRXUSDT', 'ETCUSDT', 'XMRUSDT', 'EOSUSDT', 'AAVEUSDT',
  'SUSHIUSDT', 'COMPUSDT', 'YFIUSDT', 'SNXUSDT', 'UMAUSDT',
  'CRVUSDT', '1INCHUSDT', 'ALPHAUSDT', 'ZRXUSDT', 'BATUSDT',
  'DASHUSDT', 'NEOUSDT', 'VETUSDT', 'ICXUSDT', 'ONTUSDT',
  'QTUMUSDT', 'NANOUSDT', 'DGBUSDT', 'SCUSDT', 'ZILUSDT',
  'FTMUSDT', 'NEARUSDT', 'ALGOUSDT', 'ICPUSDT', 'THETAUSDT',
  'FLOWUSDT', 'HBARUSDT', 'EGLDUSDT', 'XTZUSDT', 'CAKEUSDT'
]

// Variável global para controlar o aprendizado contínuo
let isRunning = false
let learningInterval: NodeJS.Timeout | null = null

export async function POST(request: NextRequest) {
  try {
    if (isRunning) {
      return NextResponse.json({
        success: true,
        message: 'Aprendizado contínuo já está rodando!',
        isRunning: true
      })
    }

    console.log('🚀 Iniciando aprendizado contínuo INTELIGENTE...')
    isRunning = true

    // Função de aprendizado contínuo
    const continuousLearning = async () => {
      try {
        console.log('🧠 Executando ciclo de aprendizado contínuo...')
        
        const mlEngine = new PatternBasedMLEngine()
        let totalTrades = 0
        let correctTrades = 0
        const patternStats: { [pattern: string]: { total: number; correct: number; accuracy: number } } = {}
        
        // Coletar dados atuais de todos os pares
        const allCandles: any[] = []
        
        for (const pair of FOCUSED_PAIRS) {
          try {
            const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=1m&limit=500`)
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
            
            await new Promise(resolve => setTimeout(resolve, 50))
          } catch (error) {
            console.error(`Erro ao coletar ${pair}:`, error)
          }
        }
        
        // Ordenar por timestamp
        const sortedCandles = allCandles.sort((a, b) => a.timestamp - b.timestamp)
        
        // Dividir em treino (80%) e teste (20%)
        const trainSize = Math.floor(sortedCandles.length * 0.8)
        const trainingCandles = sortedCandles.slice(0, trainSize)
        const testCandles = sortedCandles.slice(trainSize)
        
        // Treinar modelo
        const trainingResults = await trainModel(mlEngine, trainingCandles)
        
        // Testar modelo
        const testResults = await testModel(mlEngine, testCandles)
        
        // Calcular precisão final
        const finalAccuracy = testResults.accuracy
        const totalTestTrades = testResults.totalTrades
        
        // Determinar fase de aprendizado
        let learningPhase = 'INITIAL'
        if (finalAccuracy >= 95) {
          learningPhase = 'READY'
        } else if (finalAccuracy >= 80) {
          learningPhase = 'OPTIMIZING'
        } else if (finalAccuracy >= 60) {
          learningPhase = 'LEARNING'
        } else if (finalAccuracy >= 40) {
          learningPhase = 'DEVELOPING'
        }
        
        // Obter estatísticas do modelo
        const modelStats = mlEngine.getModelStats()
        
        // Salvar estatísticas no banco
        const { error: statsError } = await supabase
          .from('sol_learning_stats')
          .upsert({
            id: 1,
            accuracy: finalAccuracy,
            learning_phase: learningPhase,
            total_simulations: totalTestTrades,
            sol_data_points: allCandles.length,
            last_update: new Date().toISOString(),
            target_accuracy: 95,
            pattern_performance: testResults.patternStats,
            model_weights: modelStats,
            continuous_learning: true
          })
        
        if (statsError) {
          console.error('Erro ao salvar estatísticas:', statsError)
        }
        
        console.log(`🧠 Ciclo concluído - Precisão: ${finalAccuracy.toFixed(2)}%`)
        console.log(`🎯 Trades: ${totalTestTrades}`)
        console.log(`📈 Dados: ${allCandles.length}`)
        console.log(`🎯 Fase: ${learningPhase}`)
        
        // Mostrar top 3 padrões
        const topPatterns = Object.entries(testResults.patternStats)
          .filter(([_, stats]) => stats.total >= 3)
          .sort(([_, a], [__, b]) => b.accuracy - a.accuracy)
          .slice(0, 3)
        
        console.log('🏆 Top 3 padrões:')
        topPatterns.forEach(([pattern, stats]) => {
          console.log(`  ${pattern}: ${stats.accuracy.toFixed(2)}%`)
        })
        
      } catch (error) {
        console.error('Erro no ciclo de aprendizado:', error)
      }
    }
    
    // Executar primeiro ciclo
    await continuousLearning()
    
    // Configurar intervalo de 30 segundos
    learningInterval = setInterval(continuousLearning, 30000)
    
    return NextResponse.json({
      success: true,
      message: 'Aprendizado contínuo INTELIGENTE iniciado!',
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
  return NextResponse.json({
    success: true,
    isRunning: isRunning,
    interval: '30 segundos'
  })
}

export async function DELETE(request: NextRequest) {
  try {
    if (learningInterval) {
      clearInterval(learningInterval)
      learningInterval = null
    }
    
    isRunning = false
    
    return NextResponse.json({
      success: true,
      message: 'Aprendizado contínuo parado!',
      isRunning: false
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao parar aprendizado contínuo'
    }, { status: 500 })
  }
}

// Função para treinar modelo
async function trainModel(mlEngine: PatternBasedMLEngine, candles: any[]) {
  let totalTrades = 0
  let correctTrades = 0
  const patternStats: { [pattern: string]: { total: number; correct: number; accuracy: number } } = {}
  
  // Agrupar por par
  const pairCandles: { [pair: string]: any[] } = {}
  candles.forEach(candle => {
    if (!pairCandles[candle.pair]) {
      pairCandles[candle.pair] = []
    }
    pairCandles[candle.pair].push(candle)
  })
  
  Object.keys(pairCandles).forEach(pair => {
    const pairCandlesList = pairCandles[pair]
    if (pairCandlesList.length < 20) return
    
    for (let i = 10; i < pairCandlesList.length - 1; i++) {
      const currentCandles = pairCandlesList.slice(0, i + 1)
      const nextCandle = pairCandlesList[i + 1]
      
      const prediction = mlEngine.makePrediction(currentCandles)
      
      if (prediction.prediction !== 'YELLOW' && prediction.confidence > 0.4) {
        const isCorrect = prediction.prediction === nextCandle.color
        
        if (isCorrect) {
          correctTrades++
        }
        
        totalTrades++
        
        // Treinar modelo
        const patterns = mlEngine.analyzePatterns(currentCandles)
        const tradeResults = patterns.map(p => ({
          pattern: p.pattern,
          correct: isCorrect,
          confidence: p.confidence
        }))
        mlEngine.trainModel(tradeResults)
        
        // Registrar estatísticas por padrão
        patterns.forEach(pattern => {
          if (!patternStats[pattern.pattern]) {
            patternStats[pattern.pattern] = { total: 0, correct: 0, accuracy: 0 }
          }
          patternStats[pattern.pattern].total++
          if (isCorrect) {
            patternStats[pattern.pattern].correct++
          }
        })
      }
    }
  })
  
  // Calcular precisão por padrão
  Object.keys(patternStats).forEach(pattern => {
    const stats = patternStats[pattern]
    stats.accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
  })
  
  const accuracy = totalTrades > 0 ? (correctTrades / totalTrades) * 100 : 0
  
  return {
    accuracy,
    totalTrades,
    correctTrades,
    patternStats
  }
}

// Função para testar modelo
async function testModel(mlEngine: PatternBasedMLEngine, candles: any[]) {
  let totalTrades = 0
  let correctTrades = 0
  const patternStats: { [pattern: string]: { total: number; correct: number; accuracy: number } } = {}
  
  // Agrupar por par
  const pairCandles: { [pair: string]: any[] } = {}
  candles.forEach(candle => {
    if (!pairCandles[candle.pair]) {
      pairCandles[candle.pair] = []
    }
    pairCandles[candle.pair].push(candle)
  })
  
  Object.keys(pairCandles).forEach(pair => {
    const pairCandlesList = pairCandles[pair]
    if (pairCandlesList.length < 20) return
    
    for (let i = 10; i < pairCandlesList.length - 1; i++) {
      const currentCandles = pairCandlesList.slice(0, i + 1)
      const nextCandle = pairCandlesList[i + 1]
      
      const prediction = mlEngine.makePrediction(currentCandles)
      
      if (prediction.prediction !== 'YELLOW' && prediction.confidence > 0.4) {
        const isCorrect = prediction.prediction === nextCandle.color
        
        if (isCorrect) {
          correctTrades++
        }
        
        totalTrades++
        
        // Registrar estatísticas por padrão (sem treinar)
        const patterns = mlEngine.analyzePatterns(currentCandles)
        patterns.forEach(pattern => {
          if (!patternStats[pattern.pattern]) {
            patternStats[pattern.pattern] = { total: 0, correct: 0, accuracy: 0 }
          }
          patternStats[pattern.pattern].total++
          if (isCorrect) {
            patternStats[pattern.pattern].correct++
          }
        })
      }
    }
  })
  
  // Calcular precisão por padrão
  Object.keys(patternStats).forEach(pattern => {
    const stats = patternStats[pattern]
    stats.accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
  })
  
  const accuracy = totalTrades > 0 ? (correctTrades / totalTrades) * 100 : 0
  
  return {
    accuracy,
    totalTrades,
    correctTrades,
    patternStats
  }
}


