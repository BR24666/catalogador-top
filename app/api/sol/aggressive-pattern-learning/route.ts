import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PatternBasedMLEngine } from '@/lib/pattern-based-ml-engine'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Pares focados para aprendizado agressivo
const AGGRESSIVE_PAIRS = [
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

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 Iniciando aprendizado AGRESSIVO com foco em evolução...')
    
    const mlEngine = new PatternBasedMLEngine()
    let totalTrades = 0
    let correctTrades = 0
    const pairStats: { [pair: string]: { total: number; correct: number; accuracy: number } } = {}
    const patternStats: { [pattern: string]: { total: number; correct: number; accuracy: number } } = {}
    
    // 1. Coletar dados históricos extensos
    console.log('📊 Coletando dados históricos extensos...')
    const allCandles: any[] = []
    
    for (const pair of AGGRESSIVE_PAIRS) {
      try {
        // Coletar mais dados (500 velas = ~8 horas por par)
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
          console.log(`✅ ${pair}: ${pairCandles.length} velas coletadas`)
        }
        
        await new Promise(resolve => setTimeout(resolve, 30))
      } catch (error) {
        console.error(`Erro ao coletar ${pair}:`, error)
      }
    }
    
    console.log(`📈 Total de velas coletadas: ${allCandles.length}`)
    
    // 2. Ordenar por timestamp para validação temporal
    const sortedCandles = allCandles.sort((a, b) => a.timestamp - b.timestamp)
    
    // 3. Dividir em fases temporais (70% treino, 30% teste)
    const trainSize = Math.floor(sortedCandles.length * 0.7)
    const trainingCandles = sortedCandles.slice(0, trainSize)
    const testCandles = sortedCandles.slice(trainSize)
    
    console.log(`📊 Treino: ${trainingCandles.length} velas`)
    console.log(`📊 Teste: ${testCandles.length} velas`)
    
    // 4. Treinar modelo com dados históricos
    console.log('🧠 Treinando modelo com dados históricos...')
    const trainingResults = await trainModelAggressively(mlEngine, trainingCandles)
    
    // 5. Testar modelo em dados futuros
    console.log('🔍 Testando modelo em dados futuros...')
    const testResults = await testModelAggressively(mlEngine, testCandles)
    
    // 6. Calcular precisão final
    const finalAccuracy = testResults.accuracy
    const totalTestTrades = testResults.totalTrades
    
    // 7. Determinar fase de aprendizado
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
    
    // 8. Obter estatísticas do modelo
    const modelStats = mlEngine.getModelStats()
    
    // 9. Salvar estatísticas no banco
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
        aggressive_learning: true
      })
    
    if (statsError) {
      console.error('Erro ao salvar estatísticas:', statsError)
    }
    
    console.log(`🔥 Aprendizado AGRESSIVO concluído!`)
    console.log(`📊 Precisão final: ${finalAccuracy.toFixed(2)}%`)
    console.log(`🎯 Trades testados: ${totalTestTrades.toLocaleString()}`)
    console.log(`📈 Dados analisados: ${allCandles.length.toLocaleString()}`)
    console.log(`🎯 Fase: ${learningPhase}`)
    
    // Mostrar top 5 padrões mais eficazes
    const topPatterns = Object.entries(testResults.patternStats)
      .filter(([_, stats]) => stats.total >= 5)
      .sort(([_, a], [__, b]) => b.accuracy - a.accuracy)
      .slice(0, 5)
    
    console.log('🏆 Top 5 padrões mais eficazes:')
    topPatterns.forEach(([pattern, stats]) => {
      console.log(`  ${pattern}: ${stats.accuracy.toFixed(2)}% (${stats.correct}/${stats.total})`)
    })
    
    return NextResponse.json({
      success: true,
      message: 'Aprendizado AGRESSIVO concluído!',
      result: {
        accuracy: finalAccuracy,
        totalTrades: totalTestTrades,
        learningPhase,
        dataPoints: allCandles.length,
        isReadyToOperate: learningPhase === 'READY',
        patternStats: testResults.patternStats,
        modelStats,
        topPatterns: topPatterns.map(([pattern, stats]) => ({
          pattern,
          accuracy: stats.accuracy,
          trades: stats.total
        }))
      }
    })
    
  } catch (error) {
    console.error('Erro no aprendizado agressivo:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no aprendizado agressivo',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// Função para treinar modelo agressivamente
async function trainModelAggressively(mlEngine: PatternBasedMLEngine, candles: any[]) {
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
      
      // Critério mais rigoroso para treinamento
      if (prediction.prediction !== 'YELLOW' && prediction.confidence > 0.3) {
        const isCorrect = prediction.prediction === nextCandle.color
        
        if (isCorrect) {
          correctTrades++
        }
        
        totalTrades++
        
        // Treinar modelo com resultado
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

// Função para testar modelo agressivamente
async function testModelAggressively(mlEngine: PatternBasedMLEngine, candles: any[]) {
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
      
      // Critério mais rigoroso para teste
      if (prediction.prediction !== 'YELLOW' && prediction.confidence > 0.3) {
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


