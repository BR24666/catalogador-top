import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PatternBasedMLEngine } from '@/lib/pattern-based-ml-engine'
import { TemporalValidator } from '@/lib/temporal-validator'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Pares focados para aprendizado otimizado
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

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando aprendizado OTIMIZADO com validação temporal...')
    
    const mlEngine = new PatternBasedMLEngine()
    const validator = new TemporalValidator()
    
    // 1. Coletar dados históricos extensos (6+ meses)
    console.log('📊 Coletando dados históricos extensos para validação temporal...')
    const allCandles: any[] = []
    
    for (const pair of FOCUSED_PAIRS) {
      try {
        // Coletar mais dados históricos (2000 velas = ~33 horas)
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=1m&limit=2000`)
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
        
        await new Promise(resolve => setTimeout(resolve, 50))
      } catch (error) {
        console.error(`Erro ao coletar ${pair}:`, error)
      }
    }
    
    console.log(`📈 Total de velas coletadas: ${allCandles.length}`)
    
    // 2. Dividir dados temporalmente (70% treino, 15% validação, 15% teste)
    console.log('🕐 Dividindo dados temporalmente para validação...')
    const { training, validation, test } = validator.splitDataTemporally(allCandles, 0.7)
    
    console.log(`📊 Treino: ${training.length} velas`)
    console.log(`📊 Validação: ${validation.length} velas`)
    console.log(`📊 Teste: ${test.length} velas`)
    
    // 3. Treinar modelo com dados de treino
    console.log('🧠 Treinando modelo com dados históricos...')
    let trainingTrades = 0
    let trainingCorrect = 0
    const trainingResults: any[] = []
    
    // Agrupar por par para treinamento
    const trainingByPair: { [pair: string]: any[] } = {}
    training.forEach(candle => {
      if (!trainingByPair[candle.pair]) {
        trainingByPair[candle.pair] = []
      }
      trainingByPair[candle.pair].push(candle)
    })
    
    Object.keys(trainingByPair).forEach(pair => {
      const candles = trainingByPair[pair]
      if (candles.length < 20) return
      
      for (let i = 10; i < candles.length - 1; i++) {
        const currentCandles = candles.slice(0, i + 1)
        const nextCandle = candles[i + 1]
        
        const prediction = mlEngine.makePrediction(currentCandles)
        
        if (prediction.prediction !== 'YELLOW' && prediction.confidence > 0.4) {
          const isCorrect = prediction.prediction === nextCandle.color
          
          if (isCorrect) {
            trainingCorrect++
          }
          
          trainingTrades++
          
          // Treinar modelo com resultado
          const patterns = mlEngine.analyzePatterns(currentCandles)
          const tradeResults = patterns.map(p => ({
            pattern: p.pattern,
            correct: isCorrect,
            confidence: p.confidence
          }))
          mlEngine.trainModel(tradeResults)
          
          trainingResults.push({
            pair,
            prediction: prediction.prediction,
            actual: nextCandle.color,
            correct: isCorrect,
            confidence: prediction.confidence,
            patterns: patterns.map(p => p.pattern)
          })
        }
      }
    })
    
    const trainingAccuracy = trainingTrades > 0 ? (trainingCorrect / trainingTrades) * 100 : 0
    console.log(`🧠 Treinamento concluído: ${trainingAccuracy.toFixed(2)}% (${trainingCorrect}/${trainingTrades})`)
    
    // 4. Validar modelo em dados de validação
    console.log('🔍 Validando modelo em dados temporais...')
    const validationResult = validator.validateTemporally(training, validation, mlEngine)
    
    // 5. Otimizar pesos baseado na validação
    console.log('⚡ Otimizando pesos do modelo...')
    const optimizedWeights = validator.optimizeWeights(mlEngine, validationResult)
    
    // Aplicar pesos otimizados
    Object.keys(optimizedWeights).forEach(pattern => {
      mlEngine.weights[pattern] = optimizedWeights[pattern]
    })
    
    // 6. Testar modelo final em dados de teste (futuros)
    console.log('🎯 Testando modelo final em dados futuros...')
    const testResult = validator.validateTemporally(training, test, mlEngine)
    
    // 7. Validação específica para previsão da próxima vela
    console.log('🎯 Validando especificamente previsão da próxima vela...')
    const nextCandleValidation = validator.validateNextCandlePrediction(test, mlEngine)
    
    // 8. Calcular precisão final
    const finalAccuracy = testResult.accuracy
    const totalTrades = testResult.totalTests
    
    // 9. Determinar fase de aprendizado
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
    
    // 10. Obter estatísticas do modelo otimizado
    const modelStats = mlEngine.getModelStats()
    
    // 11. Salvar estatísticas no banco
    const { error: statsError } = await supabase
      .from('sol_learning_stats')
      .upsert({
        id: 1,
        accuracy: finalAccuracy,
        learning_phase: learningPhase,
        total_simulations: totalTrades,
        sol_data_points: allCandles.length,
        last_update: new Date().toISOString(),
        target_accuracy: 95,
        pattern_performance: testResult.patternPerformance,
        model_weights: modelStats,
        temporal_validation: {
          training_accuracy: trainingAccuracy,
          validation_accuracy: validationResult.accuracy,
          test_accuracy: testResult.accuracy,
          next_candle_accuracy: nextCandleValidation.accuracy,
          confidence_distribution: nextCandleValidation.confidenceDistribution
        }
      })
    
    if (statsError) {
      console.error('Erro ao salvar estatísticas:', statsError)
    }
    
    console.log(`🚀 Aprendizado OTIMIZADO concluído!`)
    console.log(`📊 Precisão final: ${finalAccuracy.toFixed(2)}%`)
    console.log(`🎯 Previsão próxima vela: ${nextCandleValidation.accuracy.toFixed(2)}%`)
    console.log(`📈 Trades testados: ${totalTrades.toLocaleString()}`)
    console.log(`🔍 Dados analisados: ${allCandles.length.toLocaleString()}`)
    console.log(`🎯 Fase: ${learningPhase}`)
    
    // Mostrar top 5 padrões mais eficazes
    const topPatterns = Object.entries(testResult.patternPerformance)
      .filter(([_, stats]) => stats.tests >= 5)
      .sort(([_, a], [__, b]) => b.accuracy - a.accuracy)
      .slice(0, 5)
    
    console.log('🏆 Top 5 padrões mais eficazes:')
    topPatterns.forEach(([pattern, stats]) => {
      console.log(`  ${pattern}: ${stats.accuracy.toFixed(2)}% (${stats.correct}/${stats.tests})`)
    })
    
    return NextResponse.json({
      success: true,
      message: 'Aprendizado OTIMIZADO com validação temporal concluído!',
      result: {
        finalAccuracy,
        nextCandleAccuracy: nextCandleValidation.accuracy,
        totalTrades,
        learningPhase,
        dataPoints: allCandles.length,
        isReadyToOperate: learningPhase === 'READY',
        temporalValidation: {
          training: trainingAccuracy,
          validation: validationResult.accuracy,
          test: testResult.accuracy,
          nextCandle: nextCandleValidation.accuracy
        },
        patternPerformance: testResult.patternPerformance,
        modelStats,
        topPatterns: topPatterns.map(([pattern, stats]) => ({
          pattern,
          accuracy: stats.accuracy,
          trades: stats.tests
        })),
        confidenceDistribution: nextCandleValidation.confidenceDistribution
      }
    })
    
  } catch (error) {
    console.error('Erro no aprendizado otimizado:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no aprendizado otimizado',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}


