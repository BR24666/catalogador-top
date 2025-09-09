import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PatternBasedMLEngine } from '@/lib/pattern-based-ml-engine'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Pares focados para aprendizado com padrões
const FOCUSED_PAIRS = [
  // Forex Major (simulados via crypto para teste)
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
    console.log('🧠 Iniciando aprendizado com padrões de cor...')
    
    const mlEngine = new PatternBasedMLEngine()
    let totalTrades = 0
    let correctTrades = 0
    const pairStats: { [pair: string]: { total: number; correct: number; accuracy: number; patterns: any } } = {}
    const patternStats: { [pattern: string]: { total: number; correct: number; accuracy: number } } = {}
    
    // 1. Coletar dados históricos de todos os pares
    console.log('📊 Coletando dados históricos para análise de padrões...')
    const allCandles: any[] = []
    
    for (const pair of FOCUSED_PAIRS) {
      try {
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=1m&limit=1000`)
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
        
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Erro ao coletar ${pair}:`, error)
      }
    }
    
    console.log(`📈 Total de velas coletadas: ${allCandles.length}`)
    
    // 2. Agrupar velas por par para análise
    const pairCandles: { [pair: string]: any[] } = {}
    allCandles.forEach(candle => {
      if (!pairCandles[candle.pair]) {
        pairCandles[candle.pair] = []
      }
      pairCandles[candle.pair].push(candle)
    })
    
    // 3. Analisar padrões e simular trades para cada par
    console.log('🎯 Analisando padrões e simulando trades...')
    
    Object.keys(pairCandles).forEach(pair => {
      const candles = pairCandles[pair]
      if (candles.length < 20) return
      
      let pairTrades = 0
      let pairCorrect = 0
      const pairPatterns: any = {}
      
      // Simular trades com análise de padrões (pular as primeiras 10 velas)
      for (let i = 10; i < candles.length - 1; i++) {
        const currentCandles = candles.slice(0, i + 1)
        const nextCandle = candles[i + 1]
        
        // Analisar padrões nas últimas velas
        const prediction = mlEngine.makePrediction(currentCandles)
        
        if (prediction.prediction !== 'YELLOW' && prediction.confidence > 0.4) {
          // Verificar se a previsão estava correta
          const actualColor = nextCandle.color
          const isCorrect = prediction.prediction === actualColor
          
          if (isCorrect) {
            pairCorrect++
            correctTrades++
          }
          
          pairTrades++
          totalTrades++
          
          // Registrar estatísticas por padrão
          const patterns = mlEngine.analyzePatterns(currentCandles)
          patterns.forEach(pattern => {
            if (!pairPatterns[pattern.pattern]) {
              pairPatterns[pattern.pattern] = { total: 0, correct: 0 }
            }
            pairPatterns[pattern.pattern].total++
            if (isCorrect) {
              pairPatterns[pattern.pattern].correct++
            }
            
            if (!patternStats[pattern.pattern]) {
              patternStats[pattern.pattern] = { total: 0, correct: 0, accuracy: 0 }
            }
            patternStats[pattern.pattern].total++
            if (isCorrect) {
              patternStats[pattern.pattern].correct++
            }
          })
          
          // Treinar o modelo com o resultado
          const tradeResults = patterns.map(p => ({
            pattern: p.pattern,
            correct: isCorrect,
            confidence: p.confidence
          }))
          mlEngine.trainModel(tradeResults)
        }
      }
      
      const accuracy = pairTrades > 0 ? (pairCorrect / pairTrades) * 100 : 0
      pairStats[pair] = { 
        total: pairTrades, 
        correct: pairCorrect, 
        accuracy,
        patterns: pairPatterns
      }
      
      if (pairTrades > 0) {
        console.log(`📊 ${pair}: ${pairCorrect}/${pairTrades} (${accuracy.toFixed(2)}%)`)
      }
    })
    
    // 4. Calcular precisão geral
    const overallAccuracy = totalTrades > 0 ? (correctTrades / totalTrades) * 100 : 0
    
    // 5. Calcular precisão por padrão
    Object.keys(patternStats).forEach(pattern => {
      const stats = patternStats[pattern]
      stats.accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
    })
    
    // 6. Determinar fase de aprendizado
    let learningPhase = 'INITIAL'
    if (overallAccuracy >= 95) {
      learningPhase = 'READY'
    } else if (overallAccuracy >= 80) {
      learningPhase = 'OPTIMIZING'
    } else if (overallAccuracy >= 60) {
      learningPhase = 'LEARNING'
    } else if (overallAccuracy >= 40) {
      learningPhase = 'DEVELOPING'
    }
    
    // 7. Obter estatísticas do modelo treinado
    const modelStats = mlEngine.getModelStats()
    
    // 8. Salvar estatísticas no banco
    const { error: statsError } = await supabase
      .from('sol_learning_stats')
      .upsert({
        id: 1,
        accuracy: overallAccuracy,
        learning_phase: learningPhase,
        total_simulations: totalTrades,
        sol_data_points: allCandles.length,
        last_update: new Date().toISOString(),
        target_accuracy: 95,
        pattern_performance: patternStats,
        model_weights: modelStats,
        pair_performance: pairStats
      })
    
    if (statsError) {
      console.error('Erro ao salvar estatísticas:', statsError)
    }
    
    console.log(`🧠 Aprendizado com padrões concluído!`)
    console.log(`📊 Precisão geral: ${overallAccuracy.toFixed(2)}%`)
    console.log(`🎯 Trades simulados: ${totalTrades.toLocaleString()}`)
    console.log(`📈 Dados analisados: ${allCandles.length.toLocaleString()}`)
    console.log(`🔍 Padrões identificados: ${Object.keys(patternStats).length}`)
    console.log(`🎯 Fase: ${learningPhase}`)
    
    // Mostrar top 5 padrões mais eficazes
    const topPatterns = Object.entries(patternStats)
      .filter(([_, stats]) => stats.total >= 10)
      .sort(([_, a], [__, b]) => b.accuracy - a.accuracy)
      .slice(0, 5)
    
    console.log('🏆 Top 5 padrões mais eficazes:')
    topPatterns.forEach(([pattern, stats]) => {
      console.log(`  ${pattern}: ${stats.accuracy.toFixed(2)}% (${stats.correct}/${stats.total})`)
    })
    
    return NextResponse.json({
      success: true,
      message: 'Aprendizado com padrões de cor concluído!',
      result: {
        accuracy: overallAccuracy,
        totalTrades,
        learningPhase,
        dataPoints: allCandles.length,
        pairsAnalyzed: Object.keys(pairStats).length,
        patternsIdentified: Object.keys(patternStats).length,
        isReadyToOperate: learningPhase === 'READY',
        pairStats,
        patternStats,
        modelStats,
        topPatterns: topPatterns.map(([pattern, stats]) => ({
          pattern,
          accuracy: stats.accuracy,
          trades: stats.total
        }))
      }
    })
    
  } catch (error) {
    console.error('Erro no aprendizado com padrões:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no aprendizado com padrões',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}


