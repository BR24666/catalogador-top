import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { solDataCollector } from '@/lib/sol-data-collector'
import { solMLEngine } from '@/lib/sol-ml-engine'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Configuração da Binance API
const BINANCE_BASE_URL = 'https://api.binance.com/api/v3'

interface CandleData {
  openTime: number
  open: string
  high: string
  low: string
  close: string
  volume: string
  closeTime: number
  quoteAssetVolume: string
  numberOfTrades: number
  takerBuyBaseAssetVolume: string
  takerBuyQuoteAssetVolume: string
  ignore: string
}

interface ProcessedCandle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  color: 'GREEN' | 'RED'
  nextColor?: 'GREEN' | 'RED'
}

interface SolSignal {
  id: string
  prediction: 'GREEN' | 'RED' | 'YELLOW'
  confidence: number
  timestamp: string
  price: number
  nextCandleColor?: 'GREEN' | 'RED'
  accuracy?: number
  reasoning: string[]
}

// Função para buscar dados atuais do SOL
async function fetchCurrentSolData(): Promise<ProcessedCandle[]> {
  try {
    const response = await fetch(
      `${BINANCE_BASE_URL}/klines?symbol=SOLUSDT&interval=1m&limit=100`
    )
    
    if (!response.ok) {
      throw new Error(`Erro na API da Binance: ${response.status}`)
    }
    
    const data: CandleData[] = await response.json()
    
    return data.map((candle, index) => {
      const open = parseFloat(candle.open)
      const close = parseFloat(candle.close)
      const color = close > open ? 'GREEN' : 'RED'
      
      return {
        timestamp: candle.openTime,
        open,
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close,
        volume: parseFloat(candle.volume),
        color,
        nextColor: index < data.length - 1 ? 
          (parseFloat(data[index + 1].close) > parseFloat(data[index + 1].open) ? 'GREEN' : 'RED') 
          : undefined
      }
    })
  } catch (error) {
    console.error('Erro ao buscar dados atuais do SOL:', error)
    throw error
  }
}

// Função para analisar padrões e gerar previsão
function analyzePatterns(candles: ProcessedCandle[]): {
  prediction: 'GREEN' | 'RED' | 'YELLOW'
  confidence: number
  reasoning: string[]
} {
  const reasoning: string[] = []
  let greenScore = 0
  let redScore = 0
  
  if (candles.length < 10) {
    return {
      prediction: 'YELLOW',
      confidence: 0,
      reasoning: ['Dados insuficientes para análise']
    }
  }
  
  const currentCandle = candles[candles.length - 1]
  const prevCandle = candles[candles.length - 2]
  const prevPrevCandle = candles[candles.length - 3]
  
  // 1. Análise de tendência recente
  const recentCandles = candles.slice(-5)
  const greenCount = recentCandles.filter(c => c.color === 'GREEN').length
  const redCount = recentCandles.filter(c => c.color === 'RED').length
  
  if (greenCount > redCount) {
    greenScore += 2
    reasoning.push(`Tendência recente: ${greenCount} verdes vs ${redCount} vermelhas`)
  } else if (redCount > greenCount) {
    redScore += 2
    reasoning.push(`Tendência recente: ${redCount} vermelhas vs ${greenCount} verdes`)
  }
  
  // 2. Análise de pullback
  if (prevCandle.color === 'RED' && currentCandle.color === 'GREEN') {
    greenScore += 3
    reasoning.push('Padrão de pullback: Vermelho seguido de verde')
  } else if (prevCandle.color === 'GREEN' && currentCandle.color === 'RED') {
    redScore += 3
    reasoning.push('Padrão de pullback: Verde seguido de vermelho')
  }
  
  // 3. Análise de volume
  const avgVolume = candles.slice(-10).reduce((sum, c) => sum + c.volume, 0) / 10
  if (currentCandle.volume > avgVolume * 1.2) {
    if (currentCandle.color === 'GREEN') {
      greenScore += 2
      reasoning.push('Volume alto com vela verde')
    } else {
      redScore += 2
      reasoning.push('Volume alto com vela vermelha')
    }
  }
  
  // 4. Análise de força da vela
  const candleStrength = Math.abs(currentCandle.close - currentCandle.open) / currentCandle.open
  if (candleStrength > 0.01) { // Mais de 1% de movimento
    if (currentCandle.color === 'GREEN') {
      greenScore += 1
      reasoning.push('Vela verde forte (>1%)')
    } else {
      redScore += 1
      reasoning.push('Vela vermelha forte (>1%)')
    }
  }
  
  // 5. Análise de suporte e resistência
  const recentHighs = candles.slice(-20).map(c => c.high)
  const recentLows = candles.slice(-20).map(c => c.low)
  const maxHigh = Math.max(...recentHighs)
  const minLow = Math.min(...recentLows)
  
  if (currentCandle.close > (maxHigh + minLow) / 2) {
    greenScore += 1
    reasoning.push('Preço acima da média recente')
  } else {
    redScore += 1
    reasoning.push('Preço abaixo da média recente')
  }
  
  // 6. Análise de padrão de três velas
  if (prevPrevCandle.color === 'GREEN' && prevCandle.color === 'RED' && currentCandle.color === 'GREEN') {
    greenScore += 2
    reasoning.push('Padrão de reversão: Verde-Vermelho-Verde')
  } else if (prevPrevCandle.color === 'RED' && prevCandle.color === 'GREEN' && currentCandle.color === 'RED') {
    redScore += 2
    reasoning.push('Padrão de reversão: Vermelho-Verde-Vermelho')
  }
  
  // 7. Análise de momentum
  const momentum = (currentCandle.close - candles[candles.length - 5].close) / candles[candles.length - 5].close
  if (momentum > 0.005) { // Mais de 0.5% de momentum positivo
    greenScore += 1
    reasoning.push(`Momentum positivo: +${(momentum * 100).toFixed(2)}%`)
  } else if (momentum < -0.005) { // Mais de 0.5% de momentum negativo
    redScore += 1
    reasoning.push(`Momentum negativo: ${(momentum * 100).toFixed(2)}%`)
  }
  
  // Determinar previsão e confiança
  const totalScore = greenScore + redScore
  const confidence = totalScore > 0 ? Math.min((Math.max(greenScore, redScore) / totalScore) * 100, 95) : 50
  
  let prediction: 'GREEN' | 'RED' | 'YELLOW'
  if (greenScore > redScore) {
    prediction = 'GREEN'
  } else if (redScore > greenScore) {
    prediction = 'RED'
  } else {
    prediction = 'YELLOW'
  }
  
  reasoning.push(`Score: Verde ${greenScore} vs Vermelho ${redScore}`)
  
  return { prediction, confidence, reasoning }
}

// Função para calcular precisão histórica
async function calculateHistoricalAccuracy(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('sol_signals')
      .select('prediction, actual_result')
      .not('actual_result', 'is', null)
      .limit(100)
    
    if (error || !data || data.length === 0) {
      return 0
    }
    
    const correct = data.filter(signal => signal.prediction === signal.actual_result).length
    return (correct / data.length) * 100
  } catch (error) {
    console.error('Erro ao calcular precisão histórica:', error)
    return 0
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Gerando sinal do SOL...')
    
    // 1. Verificar se o sistema está pronto
    const { data: stats, error: statsError } = await supabase
      .from('sol_learning_stats')
      .select('*')
      .eq('id', 1)
      .single()
    
    if (statsError || !stats) {
      return NextResponse.json({
        success: false,
        error: 'Sistema de aprendizado não encontrado. Execute o aprendizado primeiro.'
      }, { status: 400 })
    }
    
    if (stats.learning_phase === 'INITIAL' || stats.learning_phase === 'LEARNING') {
      return NextResponse.json({
        success: false,
        error: 'Sistema ainda em aprendizado. Aguarde a conclusão.'
      }, { status: 400 })
    }
    
    // 2. Carregar modelo treinado
    await solMLEngine.loadModel()
    
    // 3. Buscar dados atuais do SOL
    console.log('📊 Coletando dados atuais do SOL...')
    const currentData = await solDataCollector.fetchCurrentData(100)
    console.log(`✅ Coletados ${currentData.length} velas atuais`)
    
    // 4. Usar ML Engine para gerar previsão
    console.log('🧠 Usando ML Engine para gerar previsão...')
    const mlPrediction = await solMLEngine.predictNextCandle(currentData)
    console.log(`✅ Previsão ML: ${mlPrediction.prediction} (${mlPrediction.confidence.toFixed(1)}% confiança)`)
    
    // 5. Calcular precisão histórica
    const historicalAccuracy = await calculateHistoricalAccuracy()
    
    // 6. Criar sinal
    const signal: SolSignal = {
      id: `sol_${Date.now()}`,
      prediction: mlPrediction.prediction,
      confidence: mlPrediction.confidence,
      timestamp: new Date().toISOString(),
      price: currentData[currentData.length - 1].close,
      accuracy: historicalAccuracy,
      reasoning: mlPrediction.reasoning
    }
    
    // 7. Salvar sinal no Supabase
    const { error: signalError } = await supabase
      .from('sol_signals')
      .insert({
        id: signal.id,
        prediction: signal.prediction,
        confidence: signal.confidence,
        timestamp: signal.timestamp,
        price: signal.price,
        accuracy: signal.accuracy,
        reasoning: signal.reasoning,
        features: mlPrediction.features,
        created_at: new Date().toISOString()
      })
    
    if (signalError) {
      console.error('Erro ao salvar sinal:', signalError)
    }
    
    // 8. Atualizar estatísticas
    const { error: updateError } = await supabase
      .from('sol_learning_stats')
      .update({
        last_signal_generated: new Date().toISOString(),
        total_signals_generated: (stats.total_signals_generated || 0) + 1
      })
      .eq('id', 1)
    
    if (updateError) {
      console.error('Erro ao atualizar estatísticas:', updateError)
    }
    
    console.log(`🎯 Sinal gerado com sucesso: ${signal.prediction} (${signal.confidence.toFixed(1)}% confiança)`)
    
    return NextResponse.json({
      success: true,
      signal,
      message: `Sinal gerado: ${signal.prediction} com ${signal.confidence.toFixed(1)}% de confiança`,
      features: mlPrediction.features
    })
    
  } catch (error) {
    console.error('Erro ao gerar sinal:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao gerar sinal do SOL',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
