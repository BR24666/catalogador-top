interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  pair: string
  color: 'GREEN' | 'RED' | 'YELLOW'
}

interface PatternResult {
  pattern: string
  confidence: number
  prediction: 'GREEN' | 'RED' | 'YELLOW'
  reasoning: string
}

export class PatternBasedMLEngine {
  private weights: { [key: string]: number } = {}
  private patternHistory: { [pattern: string]: { correct: number; total: number } } = {}
  private learningRate = 0.01

  constructor() {
    this.initializeWeights()
  }

  private initializeWeights() {
    // Pesos para cada estratégia de padrão
    this.weights = {
      // Estratégias básicas
      'mhi_majority': 0.1,
      'minority_reversal': 0.1,
      'three_soldiers': 0.15,
      'three_crows': 0.15,
      'alternating_2x2': 0.1,
      'force_candle': 0.12,
      'engulfing': 0.18,
      'first_quadrant': 0.08,
      'doji_reversal': 0.14,
      'odd_sequence': 0.1,
      'three_valleys': 0.12,
      'three_peaks': 0.12,
      
      // Indicadores técnicos
      'rsi_oversold': 0.15,
      'rsi_overbought': 0.15,
      'sma_trend': 0.1,
      'volume_spike': 0.08,
      'volatility': 0.05,
      'momentum': 0.1,
      
      // Padrões de sequência
      'consecutive_green': 0.08,
      'consecutive_red': 0.08,
      'color_alternation': 0.06,
      
      // Bias baseado em performance histórica
      'historical_bias': 0.05
    }
  }

  // 1. Estratégia MHI (Maioria, H, Invertida)
  private analyzeMHI(candles: Candle[]): PatternResult {
    if (candles.length < 4) return { pattern: 'mhi', confidence: 0, prediction: 'YELLOW', reasoning: 'Dados insuficientes' }
    
    const last3 = candles.slice(-4, -1)
    const greenCount = last3.filter(c => c.color === 'GREEN').length
    const redCount = last3.filter(c => c.color === 'RED').length
    
    if (greenCount > redCount) {
      return {
        pattern: 'mhi_majority',
        confidence: Math.min(0.8, 0.5 + (greenCount - redCount) * 0.1),
        prediction: 'GREEN',
        reasoning: `MHI: Maioria verde (${greenCount}/3) - Aposta em continuação`
      }
    } else if (redCount > greenCount) {
      return {
        pattern: 'mhi_majority',
        confidence: Math.min(0.8, 0.5 + (redCount - greenCount) * 0.1),
        prediction: 'RED',
        reasoning: `MHI: Maioria vermelha (${redCount}/3) - Aposta em continuação`
      }
    }
    
    return { pattern: 'mhi', confidence: 0.3, prediction: 'YELLOW', reasoning: 'MHI: Empate - Sem sinal claro' }
  }

  // 2. Estratégia da Minoria (Reversão)
  private analyzeMinority(candles: Candle[]): PatternResult {
    if (candles.length < 4) return { pattern: 'minority', confidence: 0, prediction: 'YELLOW', reasoning: 'Dados insuficientes' }
    
    const last3 = candles.slice(-4, -1)
    const greenCount = last3.filter(c => c.color === 'GREEN').length
    const redCount = last3.filter(c => c.color === 'RED').length
    
    if (greenCount < redCount) {
      return {
        pattern: 'minority_reversal',
        confidence: Math.min(0.7, 0.4 + (redCount - greenCount) * 0.1),
        prediction: 'GREEN',
        reasoning: `Minoria: Verde em menor quantidade (${greenCount}/3) - Aposta em reversão`
      }
    } else if (redCount < greenCount) {
      return {
        pattern: 'minority_reversal',
        confidence: Math.min(0.7, 0.4 + (greenCount - redCount) * 0.1),
        prediction: 'RED',
        reasoning: `Minoria: Vermelho em menor quantidade (${redCount}/3) - Aposta em reversão`
      }
    }
    
    return { pattern: 'minority', confidence: 0.2, prediction: 'YELLOW', reasoning: 'Minoria: Empate - Sem sinal claro' }
  }

  // 3. Três Soldados Brancos / Três Corvos Negros
  private analyzeThreePattern(candles: Candle[]): PatternResult {
    if (candles.length < 4) return { pattern: 'three_pattern', confidence: 0, prediction: 'YELLOW', reasoning: 'Dados insuficientes' }
    
    const last3 = candles.slice(-4, -1)
    const allGreen = last3.every(c => c.color === 'GREEN')
    const allRed = last3.every(c => c.color === 'RED')
    
    if (allGreen) {
      // Verificar se são velas fortes (corpo grande)
      const strongCandles = last3.filter(c => {
        const bodySize = Math.abs(c.close - c.open) / c.open
        return bodySize > 0.001 // 0.1% de corpo mínimo
      }).length
      
      return {
        pattern: 'three_soldiers',
        confidence: Math.min(0.9, 0.6 + strongCandles * 0.1),
        prediction: 'GREEN',
        reasoning: `Três Soldados: ${strongCandles}/3 velas fortes verdes - Tendência de alta`
      }
    } else if (allRed) {
      const strongCandles = last3.filter(c => {
        const bodySize = Math.abs(c.close - c.open) / c.open
        return bodySize > 0.001
      }).length
      
      return {
        pattern: 'three_crows',
        confidence: Math.min(0.9, 0.6 + strongCandles * 0.1),
        prediction: 'RED',
        reasoning: `Três Corvos: ${strongCandles}/3 velas fortes vermelhas - Tendência de baixa`
      }
    }
    
    return { pattern: 'three_pattern', confidence: 0, prediction: 'YELLOW', reasoning: 'Três Padrão: Sequência mista' }
  }

  // 4. Padrão 2x2 (Alternância)
  private analyze2x2Pattern(candles: Candle[]): PatternResult {
    if (candles.length < 5) return { pattern: '2x2', confidence: 0, prediction: 'YELLOW', reasoning: 'Dados insuficientes' }
    
    const last4 = candles.slice(-5, -1)
    const pattern = last4.map(c => c.color).join('_')
    
    if (pattern === 'GREEN_GREEN_RED_RED') {
      return {
        pattern: 'alternating_2x2',
        confidence: 0.7,
        prediction: 'GREEN',
        reasoning: '2x2: Padrão Verde-Verde-Vermelho-Vermelho - Continuação da alternância'
      }
    } else if (pattern === 'RED_RED_GREEN_GREEN') {
      return {
        pattern: 'alternating_2x2',
        confidence: 0.7,
        prediction: 'RED',
        reasoning: '2x2: Padrão Vermelho-Vermelho-Verde-Verde - Continuação da alternância'
      }
    }
    
    return { pattern: '2x2', confidence: 0.2, prediction: 'YELLOW', reasoning: '2x2: Padrão não identificado' }
  }

  // 5. Vela de Força Pós-Sequência
  private analyzeForceCandle(candles: Candle[]): PatternResult {
    if (candles.length < 5) return { pattern: 'force_candle', confidence: 0, prediction: 'YELLOW', reasoning: 'Dados insuficientes' }
    
    const last5 = candles.slice(-6, -1)
    const lastCandle = last5[last5.length - 1]
    const previousCandles = last5.slice(0, -1)
    
    // Verificar se há sequência da mesma cor
    const allSameColor = previousCandles.every(c => c.color === previousCandles[0].color)
    if (!allSameColor || previousCandles.length < 3) {
      return { pattern: 'force_candle', confidence: 0, prediction: 'YELLOW', reasoning: 'Força: Sem sequência clara' }
    }
    
    const sequenceColor = previousCandles[0].color
    const forceCandleColor = lastCandle.color
    
    // Verificar se é vela de força (cor oposta com corpo grande)
    if (forceCandleColor !== sequenceColor) {
      const bodySize = Math.abs(lastCandle.close - lastCandle.open) / lastCandle.open
      const avgBodySize = previousCandles.reduce((acc, c) => {
        return acc + (Math.abs(c.close - c.open) / c.open)
      }, 0) / previousCandles.length
      
      if (bodySize > avgBodySize * 1.5) {
        return {
          pattern: 'force_candle',
          confidence: Math.min(0.8, 0.5 + (bodySize / avgBodySize - 1) * 0.2),
          prediction: forceCandleColor,
          reasoning: `Força: Vela ${forceCandleColor} com corpo ${(bodySize * 100).toFixed(2)}% após sequência ${sequenceColor}`
        }
      }
    }
    
    return { pattern: 'force_candle', confidence: 0.2, prediction: 'YELLOW', reasoning: 'Força: Vela não suficientemente forte' }
  }

  // 6. Padrão Engolfo
  private analyzeEngulfing(candles: Candle[]): PatternResult {
    if (candles.length < 3) return { pattern: 'engulfing', confidence: 0, prediction: 'YELLOW', reasoning: 'Dados insuficientes' }
    
    const last2 = candles.slice(-3, -1)
    const [prev, current] = last2
    
    if (prev.color === current.color) {
      return { pattern: 'engulfing', confidence: 0, prediction: 'YELLOW', reasoning: 'Engolfo: Mesma cor - Sem engolfo' }
    }
    
    // Verificar se a vela atual engolfa a anterior
    const prevBody = Math.abs(prev.close - prev.open)
    const currentBody = Math.abs(current.close - current.open)
    
    if (currentBody > prevBody * 1.2) {
      const isEngulfing = (current.open < prev.close && current.close > prev.open) ||
                         (current.open > prev.close && current.close < prev.open)
      
      if (isEngulfing) {
        return {
          pattern: 'engulfing',
          confidence: Math.min(0.9, 0.6 + (currentBody / prevBody - 1) * 0.2),
          prediction: current.color,
          reasoning: `Engolfo: Vela ${current.color} engolfa ${prev.color} (${(currentBody / prevBody).toFixed(2)}x maior)`
        }
      }
    }
    
    return { pattern: 'engulfing', confidence: 0.2, prediction: 'YELLOW', reasoning: 'Engolfo: Padrão não identificado' }
  }

  // 7. Doji Reversal
  private analyzeDojiReversal(candles: Candle[]): PatternResult {
    if (candles.length < 3) return { pattern: 'doji', confidence: 0, prediction: 'YELLOW', reasoning: 'Dados insuficientes' }
    
    const last2 = candles.slice(-3, -1)
    const [doji, confirmation] = last2
    
    // Verificar se é Doji (corpo muito pequeno)
    const bodySize = Math.abs(doji.close - doji.open) / doji.open
    const isDoji = bodySize < 0.0005 // 0.05% de corpo máximo
    
    if (isDoji && confirmation.color !== 'YELLOW') {
      return {
        pattern: 'doji_reversal',
        confidence: 0.7,
        prediction: confirmation.color,
        reasoning: `Doji: Indecisão seguida de confirmação ${confirmation.color}`
      }
    }
    
    return { pattern: 'doji', confidence: 0.2, prediction: 'YELLOW', reasoning: 'Doji: Padrão não identificado' }
  }

  // 8. Sequência Ímpar
  private analyzeOddSequence(candles: Candle[]): PatternResult {
    if (candles.length < 4) return { pattern: 'odd_sequence', confidence: 0, prediction: 'YELLOW', reasoning: 'Dados insuficientes' }
    
    const last4 = candles.slice(-5, -1)
    const colors = last4.map(c => c.color)
    
    // Verificar sequências ímpares
    for (let i = 1; i <= 3; i++) {
      const sequence = colors.slice(-i-1, -1)
      const allSame = sequence.every(c => c === sequence[0])
      
      if (allSame && sequence.length % 2 === 1) {
        const oppositeColor = sequence[0] === 'GREEN' ? 'RED' : 'GREEN'
        return {
          pattern: 'odd_sequence',
          confidence: Math.min(0.6, 0.4 + i * 0.1),
          prediction: oppositeColor,
          reasoning: `Ímpar: Sequência ${sequence[0]} de ${i} velas - Aposta em reversão`
        }
      }
    }
    
    return { pattern: 'odd_sequence', confidence: 0.2, prediction: 'YELLOW', reasoning: 'Ímpar: Sem sequência ímpar clara' }
  }

  // 9. Três Vales / Três Picos
  private analyzeValleyPeak(candles: Candle[]): PatternResult {
    if (candles.length < 4) return { pattern: 'valley_peak', confidence: 0, prediction: 'YELLOW', reasoning: 'Dados insuficientes' }
    
    const last3 = candles.slice(-4, -1)
    const [first, second, third] = last3
    
    // Três Vales (fundo)
    if (first.color === 'RED' && second.color === 'RED' && third.color === 'GREEN') {
      const secondLow = second.low
      const hasLongLowerWick = (second.open - secondLow) / second.open > 0.002 // 0.2% de pavio inferior
      
      if (hasLongLowerWick) {
        return {
          pattern: 'three_valleys',
          confidence: 0.75,
          prediction: 'GREEN',
          reasoning: 'Três Vales: Rejeição da baixa com pavio inferior longo'
        }
      }
    }
    
    // Três Picos (topo)
    if (first.color === 'GREEN' && second.color === 'GREEN' && third.color === 'RED') {
      const secondHigh = second.high
      const hasLongUpperWick = (secondHigh - second.close) / second.close > 0.002 // 0.2% de pavio superior
      
      if (hasLongUpperWick) {
        return {
          pattern: 'three_peaks',
          confidence: 0.75,
          prediction: 'RED',
          reasoning: 'Três Picos: Rejeição da alta com pavio superior longo'
        }
      }
    }
    
    return { pattern: 'valley_peak', confidence: 0.2, prediction: 'YELLOW', reasoning: 'Vale/Pico: Padrão não identificado' }
  }

  // Análise combinada de todos os padrões
  public analyzePatterns(candles: Candle[]): PatternResult[] {
    const patterns = [
      this.analyzeMHI(candles),
      this.analyzeMinority(candles),
      this.analyzeThreePattern(candles),
      this.analyze2x2Pattern(candles),
      this.analyzeForceCandle(candles),
      this.analyzeEngulfing(candles),
      this.analyzeDojiReversal(candles),
      this.analyzeOddSequence(candles),
      this.analyzeValleyPeak(candles)
    ]
    
    return patterns.filter(p => p.confidence > 0.2)
  }

  // Predição final baseada em todos os padrões
  public makePrediction(candles: Candle[]): { prediction: 'GREEN' | 'RED' | 'YELLOW'; confidence: number; reasoning: string } {
    const patterns = this.analyzePatterns(candles)
    
    if (patterns.length === 0) {
      return { prediction: 'YELLOW', confidence: 0.3, reasoning: 'Nenhum padrão identificado' }
    }
    
    // Calcular votação ponderada
    let greenScore = 0
    let redScore = 0
    let totalWeight = 0
    const reasoning: string[] = []
    
    patterns.forEach(pattern => {
      const weight = this.weights[pattern.pattern] || 0.1
      const score = pattern.confidence * weight
      
      if (pattern.prediction === 'GREEN') {
        greenScore += score
      } else if (pattern.prediction === 'RED') {
        redScore += score
      }
      
      totalWeight += weight
      reasoning.push(`${pattern.pattern}: ${pattern.reasoning}`)
    })
    
    const finalConfidence = Math.min(0.95, Math.max(0.1, Math.abs(greenScore - redScore) / totalWeight))
    
    if (greenScore > redScore) {
      return {
        prediction: 'GREEN',
        confidence: finalConfidence,
        reasoning: `GREEN (${greenScore.toFixed(2)} vs ${redScore.toFixed(2)}): ${reasoning.join('; ')}`
      }
    } else if (redScore > greenScore) {
      return {
        prediction: 'RED',
        confidence: finalConfidence,
        reasoning: `RED (${redScore.toFixed(2)} vs ${greenScore.toFixed(2)}): ${reasoning.join('; ')}`
      }
    }
    
    return {
      prediction: 'YELLOW',
      confidence: 0.3,
      reasoning: `Empate (${greenScore.toFixed(2)} vs ${redScore.toFixed(2)}): ${reasoning.join('; ')}`
    }
  }

  // Treinar o modelo baseado em resultados
  public trainModel(tradeResults: { pattern: string; correct: boolean; confidence: number }[]) {
    tradeResults.forEach(result => {
      const pattern = result.pattern
      if (!this.patternHistory[pattern]) {
        this.patternHistory[pattern] = { correct: 0, total: 0 }
      }
      
      this.patternHistory[pattern].total++
      if (result.correct) {
        this.patternHistory[pattern].correct++
      }
      
      // Ajustar peso baseado na performance
      const accuracy = this.patternHistory[pattern].correct / this.patternHistory[pattern].total
      const adjustment = (accuracy - 0.5) * this.learningRate
      this.weights[pattern] = Math.max(0.01, Math.min(0.5, this.weights[pattern] + adjustment))
    })
  }

  // Obter estatísticas do modelo
  public getModelStats() {
    const stats: { [pattern: string]: { accuracy: number; weight: number; trades: number } } = {}
    
    Object.keys(this.patternHistory).forEach(pattern => {
      const history = this.patternHistory[pattern]
      stats[pattern] = {
        accuracy: history.total > 0 ? (history.correct / history.total) * 100 : 0,
        weight: this.weights[pattern] || 0,
        trades: history.total
      }
    })
    
    return stats
  }
}


