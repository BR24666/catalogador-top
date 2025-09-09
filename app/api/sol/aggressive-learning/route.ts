import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Lista expandida de pares para aprendizado agressivo
const AGGRESSIVE_PAIRS = [
  // Forex Major
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
  'EURGBP', 'EURJPY', 'EURCHF', 'EURAUD', 'EURCAD', 'EURNZD',
  'GBPJPY', 'GBPCHF', 'GBPAUD', 'GBPCAD', 'GBPNZD',
  'AUDJPY', 'AUDCHF', 'AUDCAD', 'AUDNZD',
  
  // Crypto Major
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
    console.log('🔥 Iniciando aprendizado AGRESSIVO com força total...')
    
    // 1. Coletar dados de MUITOS pares
    console.log('📊 Coletando dados de 50+ pares para aprendizado agressivo...')
    const allCandles = []
    
    for (const pair of AGGRESSIVE_PAIRS) {
      try {
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
        
        // Pausa mínima para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 50))
      } catch (error) {
        console.error(`Erro ao coletar ${pair}:`, error)
      }
    }
    
    console.log(`📈 Total de velas coletadas: ${allCandles.length}`)
    
    // 2. Simular MUITOS trades com estratégias avançadas
    console.log('🎯 Simulando trades com estratégias avançadas...')
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
    
    // Simular trades para cada par com estratégias avançadas
    Object.keys(pairCandles).forEach(pair => {
      const candles = pairCandles[pair]
      if (candles.length < 100) return
      
      let pairTrades = 0
      let pairCorrect = 0
      
      // Simular trades (pular as primeiras 50 velas)
      for (let i = 50; i < candles.length - 1; i++) {
        const currentCandle = candles[i]
        const nextCandle = candles[i + 1]
        
        // ESTRATÉGIA AVANÇADA com múltiplos indicadores
        const trend = (currentCandle.close - currentCandle.open) / currentCandle.open
        const volume = currentCandle.volume
        const momentum = (currentCandle.close - candles[i - 1].close) / candles[i - 1].close
        
        // Calcular RSI simples
        const rsi = calculateRSI(candles.slice(Math.max(0, i - 14), i + 1))
        
        // Calcular média móvel
        const sma = calculateSMA(candles.slice(Math.max(0, i - 20), i + 1))
        const priceVsSMA = (currentCandle.close - sma) / sma
        
        // Calcular volatilidade
        const volatility = calculateVolatility(candles.slice(Math.max(0, i - 10), i + 1))
        
        // ESTRATÉGIA COMBINADA
        let prediction = 'YELLOW'
        let confidence = 0.5
        
        // Condições para GREEN (alta)
        if (trend > 0.0005 && volume > 0 && momentum > 0.001 && rsi < 70 && priceVsSMA > 0.001) {
          prediction = 'GREEN'
          confidence = Math.min(0.9, 0.6 + Math.abs(trend) * 100 + Math.abs(momentum) * 50)
        }
        // Condições para RED (baixa)
        else if (trend < -0.0005 && volume > 0 && momentum < -0.001 && rsi > 30 && priceVsSMA < -0.001) {
          prediction = 'RED'
          confidence = Math.min(0.9, 0.6 + Math.abs(trend) * 100 + Math.abs(momentum) * 50)
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
      
      if (pairTrades > 0) {
        console.log(`📊 ${pair}: ${pairCorrect}/${pairTrades} (${accuracy.toFixed(2)}%)`)
      }
    })
    
    const overallAccuracy = totalTrades > 0 ? (correctTrades / totalTrades) * 100 : 0
    
    // 3. Determinar fase de aprendizado
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
    
    console.log(`🔥 Aprendizado AGRESSIVO concluído - Precisão: ${overallAccuracy.toFixed(2)}%`)
    console.log(`📊 Trades simulados: ${totalTrades.toLocaleString()}`)
    console.log(`📈 Dados coletados: ${allCandles.length.toLocaleString()}`)
    console.log(`🎯 Fase: ${learningPhase}`)
    
    return NextResponse.json({
      success: true,
      message: 'Aprendizado AGRESSIVO concluído com força total!',
      result: {
        accuracy: overallAccuracy,
        totalTrades,
        learningPhase,
        dataPoints: allCandles.length,
        pairsAnalyzed: Object.keys(pairStats).length,
        isReadyToOperate: learningPhase === 'READY',
        pairStats
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

// Função para calcular RSI
function calculateRSI(candles: any[]): number {
  if (candles.length < 14) return 50
  
  let gains = 0
  let losses = 0
  
  for (let i = 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close
    if (change > 0) {
      gains += change
    } else {
      losses += Math.abs(change)
    }
  }
  
  const avgGain = gains / 14
  const avgLoss = losses / 14
  
  if (avgLoss === 0) return 100
  
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}

// Função para calcular média móvel simples
function calculateSMA(candles: any[]): number {
  if (candles.length === 0) return 0
  const sum = candles.reduce((acc, candle) => acc + candle.close, 0)
  return sum / candles.length
}

// Função para calcular volatilidade
function calculateVolatility(candles: any[]): number {
  if (candles.length < 2) return 0
  
  const returns = []
  for (let i = 1; i < candles.length; i++) {
    const returnValue = (candles[i].close - candles[i - 1].close) / candles[i - 1].close
    returns.push(returnValue)
  }
  
  const mean = returns.reduce((acc, ret) => acc + ret, 0) / returns.length
  const variance = returns.reduce((acc, ret) => acc + Math.pow(ret - mean, 2), 0) / returns.length
  
  return Math.sqrt(variance)
}


