import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

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

interface MLPrediction {
  prediction: 'GREEN' | 'RED' | 'YELLOW'
  confidence: number
  reasoning: string[]
  features: {
    trend: number
    volume: number
    momentum: number
    pullback: number
    support: number
    resistance: number
  }
}

interface TrainingResult {
  accuracy: number
  totalSimulations: number
  learningPhase: 'INITIAL' | 'LEARNING' | 'READY' | 'MASTER'
  features: string[]
  weights: { [key: string]: number }
}

export class SolMLEngine {
  private supabase = supabase
  private weights: { [key: string]: number } = {
    trend: 0.3,
    volume: 0.2,
    momentum: 0.2,
    pullback: 0.15,
    support: 0.1,
    resistance: 0.05
  }

  // Função para extrair features de uma vela
  private extractFeatures(candles: ProcessedCandle[], index: number): {
    trend: number
    volume: number
    momentum: number
    pullback: number
    support: number
    resistance: number
  } {
    // Verificar se os dados são válidos
    if (!candles || !Array.isArray(candles) || index < 0 || index >= candles.length) {
      return {
        trend: 0,
        volume: 0,
        momentum: 0,
        pullback: 0,
        support: 0,
        resistance: 0
      }
    }
    
    const currentCandle = candles[index]
    const prevCandle = candles[index - 1]
    const prevPrevCandle = candles[index - 2]
    
    // Verificar se as velas existem
    if (!currentCandle) {
      return {
        trend: 0,
        volume: 0,
        momentum: 0,
        pullback: 0,
        support: 0,
        resistance: 0
      }
    }
    
    // 1. Trend (tendência)
    let trend = 0
    if (index >= 2) {
      const recentCandles = candles.slice(index - 5, index + 1)
      const greenCount = recentCandles.filter(c => c.color === 'GREEN').length
      const redCount = recentCandles.filter(c => c.color === 'RED').length
      trend = (greenCount - redCount) / recentCandles.length
    }
    
    // 2. Volume (análise de volume)
    let volume = 0
    if (index >= 9) {
      const avgVolume = candles.slice(index - 10, index).reduce((sum, c) => sum + c.volume, 0) / 10
      volume = currentCandle.volume > avgVolume * 1.2 ? 1 : currentCandle.volume < avgVolume * 0.8 ? -1 : 0
    }
    
    // 3. Momentum (momentum)
    let momentum = 0
    if (index >= 4) {
      const priceChange = (currentCandle.close - candles[index - 5].close) / candles[index - 5].close
      momentum = Math.tanh(priceChange * 100) // Normalizar entre -1 e 1
    }
    
    // 4. Pullback (análise de pullback)
    let pullback = 0
    if (index >= 2) {
      if (prevCandle.color === 'RED' && currentCandle.color === 'GREEN') {
        pullback = 1 // Reversão esperada
      } else if (prevCandle.color === 'GREEN' && currentCandle.color === 'RED') {
        pullback = -1 // Reversão esperada
      } else if (prevCandle.color === currentCandle.color) {
        pullback = 0.5 // Continuação de tendência
      }
    }
    
    // 5. Support (suporte)
    let support = 0
    if (index >= 10) {
      const recentLows = candles.slice(index - 10, index).map(c => c.low)
      const minLow = Math.min(...recentLows)
      const supportLevel = minLow + (Math.max(...recentLows) - minLow) * 0.2
      support = currentCandle.close > supportLevel ? 1 : -1
    }
    
    // 6. Resistance (resistência)
    let resistance = 0
    if (index >= 10) {
      const recentHighs = candles.slice(index - 10, index).map(c => c.high)
      const maxHigh = Math.max(...recentHighs)
      const resistanceLevel = maxHigh - (maxHigh - Math.min(...recentHighs)) * 0.2
      resistance = currentCandle.close < resistanceLevel ? 1 : -1
    }
    
    return {
      trend,
      volume,
      momentum,
      pullback,
      support,
      resistance
    }
  }

  // Função para fazer previsão baseada em features
  private makePrediction(features: { [key: string]: number }): {
    prediction: 'GREEN' | 'RED' | 'YELLOW'
    confidence: number
    reasoning: string[]
  } {
    // Verificar se features é válido
    if (!features || typeof features !== 'object') {
      return {
        prediction: 'RED',
        confidence: 0.5,
        reasoning: ['Features inválidas']
      }
    }
    
    const reasoning: string[] = []
    let greenScore = 0
    let redScore = 0
    
    // Calcular score baseado em features ponderadas
    Object.entries(features).forEach(([feature, value]) => {
      const weight = this.weights[feature] || 0
      const contribution = value * weight
      
      if (contribution > 0) {
        greenScore += contribution
        reasoning.push(`${feature}: +${(contribution * 100).toFixed(1)}%`)
      } else if (contribution < 0) {
        redScore += Math.abs(contribution)
        reasoning.push(`${feature}: -${(Math.abs(contribution) * 100).toFixed(1)}%`)
      }
    })
    
    // Determinar previsão
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
    
    reasoning.push(`Score: Verde ${greenScore.toFixed(2)} vs Vermelho ${redScore.toFixed(2)}`)
    
    return { prediction, confidence, reasoning }
  }

  // Função para treinar o modelo
  async trainModel(solData: ProcessedCandle[], simulatedPairs?: ProcessedCandle[][]): Promise<TrainingResult> {
    try {
      console.log('🧠 Treinando modelo de Machine Learning...')
      
      // Verificar se os dados são válidos
      if (!solData || !Array.isArray(solData) || solData.length === 0) {
        throw new Error('Dados de treinamento inválidos')
      }
      
      let totalPredictions = 0
      let correctPredictions = 0
      const featureImportance: { [key: string]: number } = {}
      
      // Treinar com dados do SOL
      for (let i = 10; i < solData.length - 1; i++) {
        const features = this.extractFeatures(solData, i)
        const prediction = this.makePrediction(features)
        const actual = solData[i].nextColor
        
        if (!actual) continue
        
        totalPredictions++
        if (prediction.prediction === actual) {
          correctPredictions++
        }
        
        // Atualizar importância das features
        Object.entries(features).forEach(([feature, value]) => {
          if (!featureImportance[feature]) {
            featureImportance[feature] = 0
          }
          featureImportance[feature] += Math.abs(value)
        })
      }
      
      // Treinar com dados simulados (se fornecidos)
      if (simulatedPairs && Array.isArray(simulatedPairs)) {
        simulatedPairs.forEach(pairData => {
          if (!pairData || !Array.isArray(pairData)) return
          
          for (let i = 10; i < pairData.length - 1; i++) {
            const features = this.extractFeatures(pairData, i)
            const prediction = this.makePrediction(features)
            const actual = pairData[i].nextColor
            
            if (!actual) continue
            
            totalPredictions++
            if (prediction.prediction === actual) {
              correctPredictions++
            }
            
            // Atualizar importância das features
            Object.entries(features).forEach(([feature, value]) => {
              if (!featureImportance[feature]) {
                featureImportance[feature] = 0
              }
              featureImportance[feature] += Math.abs(value)
            })
          }
        })
      }
      
      // Normalizar pesos baseado na importância
      const totalImportance = Object.values(featureImportance).reduce((sum, val) => sum + val, 0)
      if (totalImportance > 0) {
        Object.keys(this.weights).forEach(feature => {
          this.weights[feature] = (featureImportance[feature] || 0) / totalImportance
        })
      }
      
      const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0
      const learningPhase = accuracy >= 95 ? 'MASTER' : accuracy >= 80 ? 'READY' : 'LEARNING'
      
      console.log(`✅ Treinamento concluído - Precisão: ${accuracy.toFixed(2)}%`)
      
      return {
        accuracy,
        totalSimulations: totalPredictions,
        learningPhase,
        features: Object.keys(this.weights),
        weights: this.weights
      }
      
    } catch (error) {
      console.error('Erro no treinamento do modelo:', error)
      throw error
    }
  }

  // Função para fazer previsão em tempo real
  async predictNextCandle(candles: ProcessedCandle[]): Promise<MLPrediction> {
    try {
      if (candles.length < 10) {
        return {
          prediction: 'YELLOW',
          confidence: 0,
          reasoning: ['Dados insuficientes para previsão'],
          features: {
            trend: 0,
            volume: 0,
            momentum: 0,
            pullback: 0,
            support: 0,
            resistance: 0
          }
        }
      }
      
      const features = this.extractFeatures(candles, candles.length - 1)
      const prediction = this.makePrediction(features)
      
      return {
        prediction: prediction.prediction,
        confidence: prediction.confidence,
        reasoning: prediction.reasoning,
        features
      }
      
    } catch (error) {
      console.error('Erro na previsão:', error)
      throw error
    }
  }

  // Função para validar modelo com pullbacks
  async validateWithPullbacks(candles: ProcessedCandle[]): Promise<{
    accuracy: number
    totalPullbacks: number
    correctPullbacks: number
  }> {
    try {
      console.log('🔍 Validando modelo com pullbacks...')
      
      let totalPullbacks = 0
      let correctPullbacks = 0
      
      for (let i = 10; i < candles.length - 1; i++) {
        const currentCandle = candles[i]
        const prevCandle = candles[i - 1]
        
        // Identificar pullbacks
        if (prevCandle.color === 'RED' && currentCandle.color === 'GREEN') {
          totalPullbacks++
          
          const features = this.extractFeatures(candles, i)
          const prediction = this.makePrediction(features)
          
          if (prediction.prediction === currentCandle.nextColor) {
            correctPullbacks++
          }
        }
      }
      
      const accuracy = totalPullbacks > 0 ? (correctPullbacks / totalPullbacks) * 100 : 0
      
      console.log(`✅ Validação com pullbacks: ${accuracy.toFixed(2)}%`)
      
      return {
        accuracy,
        totalPullbacks,
        correctPullbacks
      }
      
    } catch (error) {
      console.error('Erro na validação com pullbacks:', error)
      throw error
    }
  }

  // Função para salvar modelo treinado
  async saveModel(weights: { [key: string]: number }, accuracy: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('sol_ml_models')
        .upsert({
          id: 1,
          weights,
          accuracy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (error) {
        console.error('Erro ao salvar modelo:', error)
        throw error
      }
      
      console.log('✅ Modelo salvo no Supabase')
      
    } catch (error) {
      console.error('Erro ao salvar modelo:', error)
      throw error
    }
  }

  // Função para carregar modelo treinado
  async loadModel(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('sol_ml_models')
        .select('weights')
        .eq('id', 1)
        .single()
      
      if (error || !data) {
        console.log('Modelo não encontrado, usando pesos padrão')
        return
      }
      
      this.weights = data.weights
      console.log('✅ Modelo carregado do Supabase')
      
    } catch (error) {
      console.error('Erro ao carregar modelo:', error)
    }
  }

  // Gerar pares simulados para treinamento
  generateSimulatedPairs(count: number, historicalData: any[]): any[][] {
    const simulatedPairs = []
    
    for (let i = 0; i < count; i++) {
      const pairData = []
      
      // Gerar uma sequência de velas simuladas
      for (let j = 0; j < 100; j++) {
        const randomIndex = Math.floor(Math.random() * historicalData.length)
        const baseCandle = historicalData[randomIndex]
        
        // Adicionar variação aleatória aos preços
        const variation = (Math.random() - 0.5) * 0.02 // ±1%
        const simulatedCandle = {
          ...baseCandle,
          open: baseCandle.open * (1 + variation),
          high: baseCandle.high * (1 + variation),
          low: baseCandle.low * (1 + variation),
          close: baseCandle.close * (1 + variation),
          volume: baseCandle.volume * (0.8 + Math.random() * 0.4), // ±20%
          nextColor: Math.random() > 0.5 ? 'GREEN' : 'RED'
        }
        
        pairData.push(simulatedCandle)
      }
      
      simulatedPairs.push(pairData)
    }
    
    return simulatedPairs
  }
}

// Instância singleton
export const solMLEngine = new SolMLEngine()
