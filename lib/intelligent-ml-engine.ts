import { ProcessedCandle } from './multi-pair-collector'
import { TradeSimulation, TradeSimulator } from './trade-simulator'

export interface LearningResult {
  accuracy: number
  totalSimulations: number
  successfulPatterns: any
  optimizedWeights: { [key: string]: number }
  pairPerformance: { [pair: string]: number }
  learningPhase: 'INITIAL' | 'LEARNING' | 'OPTIMIZING' | 'READY'
}

export class IntelligentMLEngine {
  private weights = {
    trend: 0.3,
    volume: 0.2,
    momentum: 0.25,
    pullback: 0.15,
    support: 0.05,
    resistance: 0.05
  }

  private learningHistory: { accuracy: number; weights: any; timestamp: number }[] = []
  private targetPairs = ['EURUSD', 'SOLUSDT']

  // Aprender com base em simulações de trades
  async learnFromTradeSimulations(candles: ProcessedCandle[]): Promise<LearningResult> {
    console.log('🧠 Iniciando aprendizado inteligente baseado em simulações...')
    
    const simulator = new TradeSimulator(candles)
    const simulationResult = simulator.simulateAllTrades()
    
    // Analisar padrões de sucesso
    const patternAnalysis = simulator.analyzeSuccessfulPatterns(simulationResult.trades)
    
    // Otimizar pesos baseado nos resultados
    const optimizedWeights = this.optimizeWeights(simulationResult.trades, patternAnalysis)
    
    // Calcular performance por par
    const pairPerformance = this.calculatePairPerformance(simulationResult.pairStats)
    
    // Determinar fase de aprendizado
    const learningPhase = this.determineLearningPhase(simulationResult.accuracy)
    
    const result: LearningResult = {
      accuracy: simulationResult.accuracy,
      totalSimulations: simulationResult.totalTrades,
      successfulPatterns: patternAnalysis,
      optimizedWeights,
      pairPerformance,
      learningPhase
    }

    // Salvar histórico de aprendizado
    this.learningHistory.push({
      accuracy: simulationResult.accuracy,
      weights: optimizedWeights,
      timestamp: Date.now()
    })

    console.log(`✅ Aprendizado concluído - Precisão: ${simulationResult.accuracy.toFixed(2)}%`)
    console.log(`📊 Fase: ${learningPhase}`)
    console.log(`🎯 Pares alvo: ${this.targetPairs.join(', ')}`)

    return result
  }

  // Otimizar pesos baseado nos resultados das simulações
  private optimizeWeights(trades: TradeSimulation[], patternAnalysis: any): { [key: string]: number } {
    console.log('🔧 Otimizando pesos baseado em padrões de sucesso...')
    
    const newWeights = { ...this.weights }
    
    // Ajustar pesos baseado em padrões de sucesso
    if (patternAnalysis.patterns.highTrendSuccess > patternAnalysis.patterns.highVolumeSuccess) {
      newWeights.trend = Math.min(0.4, newWeights.trend + 0.05)
      newWeights.volume = Math.max(0.1, newWeights.volume - 0.02)
    }
    
    if (patternAnalysis.patterns.highMomentumSuccess > patternAnalysis.successCount * 0.6) {
      newWeights.momentum = Math.min(0.3, newWeights.momentum + 0.05)
    }
    
    // Ajustar baseado na diferença entre features de sucesso e falha
    const trendDiff = patternAnalysis.successFeatures.trend - patternAnalysis.failureFeatures.trend
    if (Math.abs(trendDiff) > 0.01) {
      newWeights.trend += trendDiff * 0.1
    }
    
    const volumeDiff = patternAnalysis.successFeatures.volume - patternAnalysis.failureFeatures.volume
    if (Math.abs(volumeDiff) > 0.1) {
      newWeights.volume += volumeDiff * 0.05
    }
    
    // Normalizar pesos para somar 1
    const totalWeight = Object.values(newWeights).reduce((sum, w) => sum + w, 0)
    Object.keys(newWeights).forEach(key => {
      newWeights[key] = newWeights[key] / totalWeight
    })
    
    this.weights = newWeights
    return newWeights
  }

  // Calcular performance por par
  private calculatePairPerformance(pairStats: { [pair: string]: { total: number; correct: number; accuracy: number } }): { [pair: string]: number } {
    const performance: { [pair: string]: number } = {}
    
    Object.keys(pairStats).forEach(pair => {
      const stats = pairStats[pair]
      if (stats.total > 10) { // Apenas pares com dados suficientes
        performance[pair] = stats.accuracy
      }
    })
    
    return performance
  }

  // Determinar fase de aprendizado
  private determineLearningPhase(accuracy: number): 'INITIAL' | 'LEARNING' | 'OPTIMIZING' | 'READY' {
    if (accuracy < 30) return 'INITIAL'
    if (accuracy < 60) return 'LEARNING'
    if (accuracy < 95) return 'OPTIMIZING'
    return 'READY'
  }

  // Gerar sinal para pares específicos
  generateSignalForPair(candles: ProcessedCandle[], pair: string): {
    prediction: 'GREEN' | 'RED' | 'YELLOW'
    confidence: number
    reasoning: string[]
    features: any
  } {
    const pairCandles = candles.filter(c => c.pair === pair)
    if (pairCandles.length < 20) {
      return {
        prediction: 'YELLOW',
        confidence: 0,
        reasoning: ['Dados insuficientes'],
        features: {}
      }
    }

    const lastCandle = pairCandles[pairCandles.length - 1]
    const features = this.extractFeatures(pairCandles, pairCandles.length - 1)
    const { prediction, confidence } = this.makePrediction(features)
    
    const reasoning = this.generateReasoning(features, prediction)
    
    return {
      prediction,
      confidence,
      reasoning,
      features
    }
  }

  // Extrair features (reutilizando do TradeSimulator)
  private extractFeatures(candles: ProcessedCandle[], index: number): any {
    if (index < 0 || index >= candles.length) {
      return { trend: 0, volume: 0, momentum: 0, pullback: 0, support: 0, resistance: 0 }
    }

    const current = candles[index]
    const previous = index > 0 ? candles[index - 1] : current
    
    const trend = (current.close - current.open) / current.open
    const volume = current.volume / (candles.slice(Math.max(0, index - 20), index).reduce((sum, c) => sum + c.volume, 0) / 20 || 1)
    const momentum = (current.close - previous.close) / previous.close
    const pullback = current.high > current.low ? (current.high - current.close) / (current.high - current.low) : 0
    
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

  // Fazer previsão usando pesos otimizados
  private makePrediction(features: any): { prediction: 'GREEN' | 'RED' | 'YELLOW'; confidence: number } {
    const score = 
      features.trend * this.weights.trend +
      features.volume * this.weights.volume +
      features.momentum * this.weights.momentum +
      features.pullback * this.weights.pullback +
      features.support * this.weights.support +
      features.resistance * this.weights.resistance

    const confidence = Math.abs(score)
    
    if (score > 0.1) return { prediction: 'GREEN', confidence }
    if (score < -0.1) return { prediction: 'RED', confidence }
    return { prediction: 'YELLOW', confidence }
  }

  // Gerar explicação do sinal
  private generateReasoning(features: any, prediction: string): string[] {
    const reasoning: string[] = []
    
    if (features.trend > 0.01) reasoning.push('Tendência de alta detectada')
    if (features.trend < -0.01) reasoning.push('Tendência de baixa detectada')
    if (features.volume > 1.5) reasoning.push('Volume acima da média')
    if (features.momentum > 0.005) reasoning.push('Momentum positivo')
    if (features.momentum < -0.005) reasoning.push('Momentum negativo')
    if (features.pullback > 0.7) reasoning.push('Pullback significativo')
    
    if (reasoning.length === 0) {
      reasoning.push('Sinais mistos - mercado lateral')
    }
    
    return reasoning
  }

  // Verificar se está pronto para operar
  isReadyToOperate(): boolean {
    return this.learningHistory.length > 0 && 
           this.learningHistory[this.learningHistory.length - 1].accuracy >= 95
  }

  // Obter estatísticas de aprendizado
  getLearningStats(): any {
    return {
      currentAccuracy: this.learningHistory.length > 0 ? 
        this.learningHistory[this.learningHistory.length - 1].accuracy : 0,
      totalIterations: this.learningHistory.length,
      currentWeights: this.weights,
      targetPairs: this.targetPairs,
      isReady: this.isReadyToOperate()
    }
  }
}


