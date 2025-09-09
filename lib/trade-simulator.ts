import { ProcessedCandle } from './multi-pair-collector'

export interface TradeSimulation {
  pair: string
  entryTime: number
  entryPrice: number
  predictedColor: 'GREEN' | 'RED' | 'YELLOW'
  actualColor: 'GREEN' | 'RED' | 'YELLOW'
  isCorrect: boolean
  confidence: number
  features: {
    trend: number
    volume: number
    momentum: number
    pullback: number
    support: number
    resistance: number
  }
}

export interface SimulationResult {
  totalTrades: number
  correctTrades: number
  accuracy: number
  trades: TradeSimulation[]
  pairStats: { [pair: string]: { total: number; correct: number; accuracy: number } }
}

export class TradeSimulator {
  private candles: ProcessedCandle[] = []
  private pairCandles: { [pair: string]: ProcessedCandle[] } = {}

  constructor(candles: ProcessedCandle[]) {
    this.candles = candles
    this.organizeCandlesByPair()
  }

  private organizeCandlesByPair() {
    this.pairCandles = {}
    this.candles.forEach(candle => {
      if (!this.pairCandles[candle.pair]) {
        this.pairCandles[candle.pair] = []
      }
      this.pairCandles[candle.pair].push(candle)
    })
  }

  // Extrair features técnicas de uma vela
  private extractFeatures(candles: ProcessedCandle[], index: number): {
    trend: number
    volume: number
    momentum: number
    pullback: number
    support: number
    resistance: number
  } {
    if (index < 0 || index >= candles.length) {
      return { trend: 0, volume: 0, momentum: 0, pullback: 0, support: 0, resistance: 0 }
    }

    const current = candles[index]
    const previous = index > 0 ? candles[index - 1] : current
    
    // Calcular features
    const trend = (current.close - current.open) / current.open
    const volume = current.volume / (candles.slice(Math.max(0, index - 20), index).reduce((sum, c) => sum + c.volume, 0) / 20 || 1)
    const momentum = (current.close - previous.close) / previous.close
    const pullback = current.high > current.low ? (current.high - current.close) / (current.high - current.low) : 0
    
    // Calcular suporte e resistência (simplificado)
    const recentCandles = candles.slice(Math.max(0, index - 20), index + 1)
    const support = Math.min(...recentCandles.map(c => c.low))
    const resistance = Math.max(...recentCandles.map(c => c.high))
    
    return {
      trend,
      volume,
      momentum,
      pullback,
      support: (current.low - support) / (resistance - support || 1),
      resistance: (resistance - current.high) / (resistance - support || 1)
    }
  }

  // Fazer previsão baseada em features
  private makePrediction(features: any): { prediction: 'GREEN' | 'RED' | 'YELLOW'; confidence: number } {
    // Pesos otimizados baseados em estratégias probabilísticas
    const weights = {
      trend: 0.3,
      volume: 0.2,
      momentum: 0.25,
      pullback: 0.15,
      support: 0.05,
      resistance: 0.05
    }

    const score = 
      features.trend * weights.trend +
      features.volume * weights.volume +
      features.momentum * weights.momentum +
      features.pullback * weights.pullback +
      features.support * weights.support +
      features.resistance * weights.resistance

    const confidence = Math.abs(score)
    
    if (score > 0.1) return { prediction: 'GREEN', confidence }
    if (score < -0.1) return { prediction: 'RED', confidence }
    return { prediction: 'YELLOW', confidence }
  }

  // Simular trades para um par específico
  simulatePairTrades(pair: string, startIndex: number = 100, endIndex?: number): TradeSimulation[] {
    const pairCandles = this.pairCandles[pair]
    if (!pairCandles || pairCandles.length < 100) return []

    const trades: TradeSimulation[] = []
    const end = endIndex || pairCandles.length - 1

    for (let i = startIndex; i < end; i++) {
      const features = this.extractFeatures(pairCandles, i)
      const { prediction, confidence } = this.makePrediction(features)
      
      // A próxima vela é o resultado do trade
      const nextCandle = pairCandles[i + 1]
      if (!nextCandle) continue

      const actualColor = nextCandle.color
      const isCorrect = prediction === actualColor

      trades.push({
        pair,
        entryTime: pairCandles[i].timestamp,
        entryPrice: pairCandles[i].close,
        predictedColor: prediction,
        actualColor,
        isCorrect,
        confidence,
        features
      })
    }

    return trades
  }

  // Simular trades para todos os pares
  simulateAllTrades(): SimulationResult {
    console.log('🎯 Iniciando simulação de trades...')
    
    const allTrades: TradeSimulation[] = []
    const pairStats: { [pair: string]: { total: number; correct: number; accuracy: number } } = {}

    // Simular trades para cada par
    Object.keys(this.pairCandles).forEach(pair => {
      const trades = this.simulatePairTrades(pair)
      allTrades.push(...trades)
      
      const correctTrades = trades.filter(t => t.isCorrect).length
      const totalTrades = trades.length
      const accuracy = totalTrades > 0 ? (correctTrades / totalTrades) * 100 : 0
      
      pairStats[pair] = { total: totalTrades, correct: correctTrades, accuracy }
      
      console.log(`📊 ${pair}: ${correctTrades}/${totalTrades} (${accuracy.toFixed(2)}%)`)
    })

    const totalTrades = allTrades.length
    const correctTrades = allTrades.filter(t => t.isCorrect).length
    const overallAccuracy = totalTrades > 0 ? (correctTrades / totalTrades) * 100 : 0

    console.log(`✅ Simulação concluída: ${correctTrades}/${totalTrades} (${overallAccuracy.toFixed(2)}%)`)

    return {
      totalTrades,
      correctTrades,
      accuracy: overallAccuracy,
      trades: allTrades,
      pairStats
    }
  }

  // Analisar padrões de sucesso
  analyzeSuccessfulPatterns(trades: TradeSimulation[]): any {
    const successfulTrades = trades.filter(t => t.isCorrect)
    const failedTrades = trades.filter(t => !t.isCorrect)

    // Calcular médias das features para trades bem-sucedidos
    const successFeatures = {
      trend: successfulTrades.reduce((sum, t) => sum + t.features.trend, 0) / successfulTrades.length,
      volume: successfulTrades.reduce((sum, t) => sum + t.features.volume, 0) / successfulTrades.length,
      momentum: successfulTrades.reduce((sum, t) => sum + t.features.momentum, 0) / successfulTrades.length,
      pullback: successfulTrades.reduce((sum, t) => sum + t.features.pullback, 0) / successfulTrades.length,
      support: successfulTrades.reduce((sum, t) => sum + t.features.support, 0) / successfulTrades.length,
      resistance: successfulTrades.reduce((sum, t) => sum + t.features.resistance, 0) / successfulTrades.length
    }

    // Calcular médias das features para trades falhados
    const failureFeatures = {
      trend: failedTrades.reduce((sum, t) => sum + t.features.trend, 0) / failedTrades.length,
      volume: failedTrades.reduce((sum, t) => sum + t.features.volume, 0) / failedTrades.length,
      momentum: failedTrades.reduce((sum, t) => sum + t.features.momentum, 0) / failedTrades.length,
      pullback: failedTrades.reduce((sum, t) => sum + t.features.pullback, 0) / failedTrades.length,
      support: failedTrades.reduce((sum, t) => sum + t.features.support, 0) / failedTrades.length,
      resistance: failedTrades.reduce((sum, t) => sum + t.features.resistance, 0) / failedTrades.length
    }

    return {
      successFeatures,
      failureFeatures,
      successCount: successfulTrades.length,
      failureCount: failedTrades.length,
      patterns: {
        // Padrões que levam ao sucesso
        highTrendSuccess: successfulTrades.filter(t => t.features.trend > 0.01).length,
        highVolumeSuccess: successfulTrades.filter(t => t.features.volume > 1.5).length,
        highMomentumSuccess: successfulTrades.filter(t => t.features.momentum > 0.005).length
      }
    }
  }
}


