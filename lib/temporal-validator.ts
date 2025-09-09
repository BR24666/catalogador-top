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

interface ValidationResult {
  accuracy: number
  totalTests: number
  correctPredictions: number
  phaseResults: {
    [phase: string]: {
      accuracy: number
      tests: number
      correct: number
    }
  }
  patternPerformance: {
    [pattern: string]: {
      accuracy: number
      tests: number
      correct: number
    }
  }
}

export class TemporalValidator {
  
  // Dividir dados em fases temporais para validação
  public splitDataTemporally(candles: Candle[], trainRatio: number = 0.7): {
    training: Candle[]
    validation: Candle[]
    test: Candle[]
  } {
    const sortedCandles = candles.sort((a, b) => a.timestamp - b.timestamp)
    const totalLength = sortedCandles.length
    
    const trainEnd = Math.floor(totalLength * trainRatio)
    const validationEnd = Math.floor(totalLength * (trainRatio + 0.15))
    
    return {
      training: sortedCandles.slice(0, trainEnd),
      validation: sortedCandles.slice(trainEnd, validationEnd),
      test: sortedCandles.slice(validationEnd)
    }
  }
  
  // Validar modelo em dados futuros (não vistos durante treinamento)
  public validateTemporally(
    trainingCandles: Candle[],
    testCandles: Candle[],
    mlEngine: any
  ): ValidationResult {
    console.log('🕐 Iniciando validação temporal...')
    console.log(`📊 Dados de treino: ${trainingCandles.length} velas`)
    console.log(`📊 Dados de teste: ${testCandles.length} velas`)
    
    let totalTests = 0
    let correctPredictions = 0
    const phaseResults: { [phase: string]: { accuracy: number; tests: number; correct: number } } = {}
    const patternPerformance: { [pattern: string]: { accuracy: number; tests: number; correct: number } } = {}
    
    // Dividir dados de teste em fases temporais
    const testPhases = this.createTimePhases(testCandles)
    
    // Testar em cada fase temporal
    Object.keys(testPhases).forEach(phase => {
      const phaseCandles = testPhases[phase]
      let phaseTests = 0
      let phaseCorrect = 0
      
      console.log(`🔍 Testando fase ${phase}: ${phaseCandles.length} velas`)
      
      // Simular previsões em dados futuros
      for (let i = 10; i < phaseCandles.length - 1; i++) {
        const currentCandles = phaseCandles.slice(0, i + 1)
        const nextCandle = phaseCandles[i + 1]
        
        // Fazer previsão (sem treinar o modelo)
        const prediction = mlEngine.makePrediction(currentCandles)
        
        if (prediction.prediction !== 'YELLOW' && prediction.confidence > 0.4) {
          const isCorrect = prediction.prediction === nextCandle.color
          
          if (isCorrect) {
            phaseCorrect++
            correctPredictions++
          }
          
          phaseTests++
          totalTests++
          
          // Registrar performance por padrão
          const patterns = mlEngine.analyzePatterns(currentCandles)
          patterns.forEach(pattern => {
            if (!patternPerformance[pattern.pattern]) {
              patternPerformance[pattern.pattern] = { accuracy: 0, tests: 0, correct: 0 }
            }
            patternPerformance[pattern.pattern].tests++
            if (isCorrect) {
              patternPerformance[pattern.pattern].correct++
            }
          })
        }
      }
      
      const phaseAccuracy = phaseTests > 0 ? (phaseCorrect / phaseTests) * 100 : 0
      phaseResults[phase] = {
        accuracy: phaseAccuracy,
        tests: phaseTests,
        correct: phaseCorrect
      }
      
      console.log(`✅ Fase ${phase}: ${phaseCorrect}/${phaseTests} (${phaseAccuracy.toFixed(2)}%)`)
    })
    
    // Calcular precisão geral
    const overallAccuracy = totalTests > 0 ? (correctPredictions / totalTests) * 100 : 0
    
    // Calcular precisão por padrão
    Object.keys(patternPerformance).forEach(pattern => {
      const stats = patternPerformance[pattern]
      stats.accuracy = stats.tests > 0 ? (stats.correct / stats.tests) * 100 : 0
    })
    
    console.log(`🎯 Validação temporal concluída: ${overallAccuracy.toFixed(2)}%`)
    
    return {
      accuracy: overallAccuracy,
      totalTests,
      correctPredictions,
      phaseResults,
      patternPerformance
    }
  }
  
  // Criar fases temporais para análise
  private createTimePhases(candles: Candle[]): { [phase: string]: Candle[] } {
    const sortedCandles = candles.sort((a, b) => a.timestamp - b.timestamp)
    const totalLength = sortedCandles.length
    
    const phases = {
      'early': sortedCandles.slice(0, Math.floor(totalLength * 0.3)),
      'middle': sortedCandles.slice(
        Math.floor(totalLength * 0.3), 
        Math.floor(totalLength * 0.7)
      ),
      'recent': sortedCandles.slice(Math.floor(totalLength * 0.7))
    }
    
    return phases
  }
  
  // Otimizar pesos baseado em performance temporal
  public optimizeWeights(
    mlEngine: any,
    validationResult: ValidationResult
  ): { [pattern: string]: number } {
    console.log('⚡ Otimizando pesos baseado em performance temporal...')
    
    const optimizedWeights: { [pattern: string]: number } = {}
    const currentWeights = mlEngine.getModelStats()
    
    Object.keys(validationResult.patternPerformance).forEach(pattern => {
      const performance = validationResult.patternPerformance[pattern]
      const currentWeight = currentWeights[pattern]?.weight || 0.1
      
      // Ajustar peso baseado na performance
      let newWeight = currentWeight
      
      if (performance.accuracy > 60) {
        // Aumentar peso para padrões eficazes
        newWeight = Math.min(0.5, currentWeight * 1.2)
      } else if (performance.accuracy < 40) {
        // Diminuir peso para padrões ineficazes
        newWeight = Math.max(0.01, currentWeight * 0.8)
      }
      
      optimizedWeights[pattern] = newWeight
      
      console.log(`📊 ${pattern}: ${performance.accuracy.toFixed(2)}% -> Peso: ${currentWeight.toFixed(3)} -> ${newWeight.toFixed(3)}`)
    })
    
    return optimizedWeights
  }
  
  // Validar especificamente para previsão da próxima vela
  public validateNextCandlePrediction(
    candles: Candle[],
    mlEngine: any
  ): {
    accuracy: number
    totalPredictions: number
    correctPredictions: number
    confidenceDistribution: { [range: string]: number }
    timeToNextCandle: number
  } {
    console.log('🎯 Validando especificamente previsão da próxima vela...')
    
    let totalPredictions = 0
    let correctPredictions = 0
    const confidenceDistribution: { [range: string]: number } = {
      '0.4-0.5': 0,
      '0.5-0.6': 0,
      '0.6-0.7': 0,
      '0.7-0.8': 0,
      '0.8-0.9': 0,
      '0.9-1.0': 0
    }
    
    const startTime = Date.now()
    
    // Testar previsões da próxima vela
    for (let i = 10; i < candles.length - 1; i++) {
      const currentCandles = candles.slice(0, i + 1)
      const nextCandle = candles[i + 1]
      
      const prediction = mlEngine.makePrediction(currentCandles)
      
      if (prediction.prediction !== 'YELLOW' && prediction.confidence > 0.4) {
        const isCorrect = prediction.prediction === nextCandle.color
        
        if (isCorrect) {
          correctPredictions++
        }
        
        totalPredictions++
        
        // Distribuir por faixa de confiança
        const conf = prediction.confidence
        if (conf >= 0.4 && conf < 0.5) confidenceDistribution['0.4-0.5']++
        else if (conf >= 0.5 && conf < 0.6) confidenceDistribution['0.5-0.6']++
        else if (conf >= 0.6 && conf < 0.7) confidenceDistribution['0.6-0.7']++
        else if (conf >= 0.7 && conf < 0.8) confidenceDistribution['0.7-0.8']++
        else if (conf >= 0.8 && conf < 0.9) confidenceDistribution['0.8-0.9']++
        else if (conf >= 0.9) confidenceDistribution['0.9-1.0']++
      }
    }
    
    const endTime = Date.now()
    const timeToNextCandle = endTime - startTime
    
    const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0
    
    console.log(`🎯 Previsão da próxima vela: ${accuracy.toFixed(2)}%`)
    console.log(`⏱️ Tempo de processamento: ${timeToNextCandle}ms`)
    
    return {
      accuracy,
      totalPredictions,
      correctPredictions,
      confidenceDistribution,
      timeToNextCandle
    }
  }
}


