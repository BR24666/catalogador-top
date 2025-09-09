import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Lista de pares principais para análise
const MAIN_PAIRS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD',
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'SOLUSDT',
  'DOTUSDT', 'DOGEUSDT', 'AVAXUSDT', 'MATICUSDT', 'LTCUSDT',
  'UNIUSDT', 'LINKUSDT', 'ATOMUSDT', 'XLMUSDT', 'BCHUSDT'
]

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando aprendizado inteligente com força total...')
    
    // 1. Coletar dados de pares principais
    console.log('📊 Coletando dados de pares principais...')
    const allCandles = []
    
    for (const pair of MAIN_PAIRS) {
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
        
        // Pausa para respeitar rate limits
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Erro ao coletar ${pair}:`, error)
      }
    }
    
    console.log(`📈 Total de velas coletadas: ${allCandles.length}`)
    
    // 2. Simular trades e calcular precisão
    console.log('🎯 Simulando trades...')
    let totalTrades = 0
    let correctTrades = 0
    const pairStats: { [pair: string]: { total: number; correct: number; accuracy: number } } = {}
    
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
      if (candles.length < 100) return
      
      let pairTrades = 0
      let pairCorrect = 0
      
      // Simular trades (pular as primeiras 50 velas para ter dados históricos)
      for (let i = 50; i < candles.length - 1; i++) {
        const currentCandle = candles[i]
        const nextCandle = candles[i + 1]
        
        // Estratégia simples: prever baseado na tendência atual
        const trend = (currentCandle.close - currentCandle.open) / currentCandle.open
        const volume = currentCandle.volume
        const momentum = (currentCandle.close - candles[i - 1].close) / candles[i - 1].close
        
        // Fazer previsão baseada em features
        let prediction = 'YELLOW'
        if (trend > 0.001 && volume > 0 && momentum > 0) {
          prediction = 'GREEN'
        } else if (trend < -0.001 && volume > 0 && momentum < 0) {
          prediction = 'RED'
        }
        
        // Verificar se a previsão estava correta
        const actualColor = nextCandle.color
        if (prediction === actualColor) {
          pairCorrect++
          correctTrades++
        }
        
        pairTrades++
        totalTrades++
      }
      
      const accuracy = pairTrades > 0 ? (pairCorrect / pairTrades) * 100 : 0
      pairStats[pair] = { total: pairTrades, correct: pairCorrect, accuracy }
      
      console.log(`📊 ${pair}: ${pairCorrect}/${pairTrades} (${accuracy.toFixed(2)}%)`)
    })
    
    const overallAccuracy = totalTrades > 0 ? (correctTrades / totalTrades) * 100 : 0
    
    // 3. Determinar fase de aprendizado
    let learningPhase = 'INITIAL'
    if (overallAccuracy >= 95) {
      learningPhase = 'READY'
    } else if (overallAccuracy >= 80) {
      learningPhase = 'OPTIMIZING'
    } else if (overallAccuracy >= 50) {
      learningPhase = 'LEARNING'
    }
    
    // 4. Salvar estatísticas
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
        pair_performance: pairStats
      })
    
    if (statsError) {
      console.error('Erro ao salvar estatísticas:', statsError)
    }
    
    // 5. Gerar sinais para pares alvo
    console.log('🎯 Gerando sinais para pares alvo...')
    const targetSignals: any = {}
    
    // Gerar sinal para EURUSD
    if (pairCandles['EURUSD'] && pairCandles['EURUSD'].length > 0) {
      const eurCandles = pairCandles['EURUSD']
      const lastCandle = eurCandles[eurCandles.length - 1]
      const trend = (lastCandle.close - lastCandle.open) / lastCandle.open
      const volume = lastCandle.volume
      
      let prediction = 'YELLOW'
      let confidence = 0.5
      if (trend > 0.001) {
        prediction = 'GREEN'
        confidence = Math.min(0.9, 0.5 + Math.abs(trend) * 100)
      } else if (trend < -0.001) {
        prediction = 'RED'
        confidence = Math.min(0.9, 0.5 + Math.abs(trend) * 100)
      }
      
      targetSignals['EURUSD'] = {
        pair: 'EURUSD',
        prediction,
        confidence,
        entryPrice: lastCandle.close,
        reasoning: [
          trend > 0.001 ? 'Tendência de alta' : trend < -0.001 ? 'Tendência de baixa' : 'Mercado lateral',
          volume > 0 ? 'Volume ativo' : 'Volume baixo'
        ]
      }
    }
    
    // Gerar sinal para SOLUSDT
    if (pairCandles['SOLUSDT'] && pairCandles['SOLUSDT'].length > 0) {
      const solCandles = pairCandles['SOLUSDT']
      const lastCandle = solCandles[solCandles.length - 1]
      const trend = (lastCandle.close - lastCandle.open) / lastCandle.open
      const volume = lastCandle.volume
      
      let prediction = 'YELLOW'
      let confidence = 0.5
      if (trend > 0.001) {
        prediction = 'GREEN'
        confidence = Math.min(0.9, 0.5 + Math.abs(trend) * 100)
      } else if (trend < -0.001) {
        prediction = 'RED'
        confidence = Math.min(0.9, 0.5 + Math.abs(trend) * 100)
      }
      
      targetSignals['SOLUSDT'] = {
        pair: 'SOLUSDT',
        prediction,
        confidence,
        entryPrice: lastCandle.close,
        reasoning: [
          trend > 0.001 ? 'Tendência de alta' : trend < -0.001 ? 'Tendência de baixa' : 'Mercado lateral',
          volume > 0 ? 'Volume ativo' : 'Volume baixo'
        ]
      }
    }
    
    console.log(`✅ Aprendizado concluído - Precisão: ${overallAccuracy.toFixed(2)}%`)
    console.log(`🎯 Fase: ${learningPhase}`)
    console.log(`📊 Trades simulados: ${totalTrades}`)
    
    return NextResponse.json({
      success: true,
      message: 'Aprendizado inteligente concluído com força total!',
      result: {
        accuracy: overallAccuracy,
        totalTrades,
        learningPhase,
        dataPoints: allCandles.length,
        pairsAnalyzed: Object.keys(pairStats).length,
        isReadyToOperate: learningPhase === 'READY',
        targetSignals,
        pairStats
      }
    })
    
  } catch (error) {
    console.error('Erro no aprendizado inteligente:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no aprendizado inteligente',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}


