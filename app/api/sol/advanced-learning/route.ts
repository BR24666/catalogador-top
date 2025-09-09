import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando aprendizado avançado SOL AI...')
    
    // 1. Carregar TODOS os dados disponíveis
    const { data: allCandles } = await supabase
      .from('sol_candles')
      .select('*')
      .order('timestamp', { ascending: true })
    
    if (!allCandles || allCandles.length < 1000) {
      throw new Error('Dados insuficientes. Execute a coleta primeiro.')
    }
    
    console.log(`📊 Carregados ${allCandles.length} velas do banco`)
    
    // 2. Algoritmo de aprendizado avançado
    let correctPredictions = 0
    let totalPredictions = 0
    let featureWeights = {
      rsi: 0.3,
      momentum: 0.25,
      pullback: 0.2,
      support: 0.15,
      resistance: 0.1
    }
    
    // 3. Treinar com dados históricos
    for (let i = 20; i < allCandles.length - 1; i++) {
      const currentCandle = allCandles[i]
      const nextCandle = allCandles[i + 1]
      
      if (!currentCandle || !nextCandle) continue
      
      // Extrair features
      const features = extractAdvancedFeatures(allCandles, i)
      
      // Fazer previsão baseada em features
      const prediction = makeAdvancedPrediction(features, featureWeights)
      const actual = nextCandle.color
      
      totalPredictions++
      if (prediction === actual) {
        correctPredictions++
      }
      
      // Ajustar pesos baseado no resultado
      if (prediction !== actual) {
        adjustWeights(featureWeights, features, actual === 'GREEN' ? 1 : -1)
      }
    }
    
    const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0
    
    console.log(`✅ Aprendizado avançado concluído - Precisão: ${accuracy.toFixed(2)}%`)
    
    // 4. Gerar pares simulados para treinamento adicional
    console.log('🔄 Gerando 500 pares simulados...')
    const simulatedPairs = generateSimulatedPairs(500, allCandles)
    
    // 5. Treinar com pares simulados
    let simulatedCorrect = 0
    let simulatedTotal = 0
    
    simulatedPairs.forEach(pair => {
      for (let i = 10; i < pair.length - 1; i++) {
        const features = extractAdvancedFeatures(pair, i)
        const prediction = makeAdvancedPrediction(features, featureWeights)
        const actual = pair[i].nextColor
        
        if (!actual) continue
        
        simulatedTotal++
        if (prediction === actual) {
          simulatedCorrect++
        }
      }
    })
    
    const simulatedAccuracy = simulatedTotal > 0 ? (simulatedCorrect / simulatedTotal) * 100 : 0
    const finalAccuracy = (accuracy + simulatedAccuracy) / 2
    
    console.log(`✅ Treinamento com pares simulados - Precisão: ${simulatedAccuracy.toFixed(2)}%`)
    console.log(`✅ Precisão final: ${finalAccuracy.toFixed(2)}%`)
    
    // 6. Atualizar estatísticas
    const newPhase = finalAccuracy >= 95 ? 'READY' : 
                    finalAccuracy >= 80 ? 'LEARNING' : 'INITIAL'
    
    await supabase
      .from('sol_learning_stats')
      .upsert({
        id: 1,
        totalSimulations: totalPredictions + simulatedTotal,
        accuracy: finalAccuracy,
        learningPhase: newPhase,
        solDataPoints: allCandles.length,
        lastUpdate: new Date().toISOString(),
        targetAccuracy: 95
      })
    
    // 7. Salvar modelo treinado
    await supabase
      .from('sol_ml_models')
      .upsert({
        id: 1,
        weights: featureWeights,
        accuracy: finalAccuracy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    console.log(`✅ Modelo salvo - Fase: ${newPhase}, Precisão: ${finalAccuracy.toFixed(2)}%`)
    
    return NextResponse.json({
      success: true,
      message: 'Aprendizado avançado concluído!',
      stats: {
        totalDataPoints: allCandles.length,
        simulatedPairs: simulatedPairs.length,
        accuracy: finalAccuracy,
        phase: newPhase,
        totalSimulations: totalPredictions + simulatedTotal,
        historicalAccuracy: accuracy,
        simulatedAccuracy: simulatedAccuracy
      }
    })
    
  } catch (error) {
    console.error('Erro no aprendizado avançado:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no aprendizado avançado',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// Função para extrair features avançadas
function extractAdvancedFeatures(candles: any[], index: number) {
  const currentCandle = candles[index]
  const prevCandle = candles[index - 1]
  
  // RSI simples
  let rsi = 0
  if (index >= 14) {
    let gains = 0
    let losses = 0
    for (let i = index - 13; i <= index; i++) {
      const change = candles[i].close - candles[i - 1].close
      if (change > 0) gains += change
      else losses -= change
    }
    const avgGain = gains / 14
    const avgLoss = losses / 14
    const rs = avgGain / (avgLoss || 0.001)
    rsi = 100 - (100 / (1 + rs))
  }
  
  // Momentum
  let momentum = 0
  if (index >= 5) {
    const priceChange = (currentCandle.close - candles[index - 5].close) / candles[index - 5].close
    momentum = Math.tanh(priceChange * 100)
  }
  
  // Pullback
  let pullback = 0
  if (index >= 2) {
    if (prevCandle.color === 'RED' && currentCandle.color === 'GREEN') {
      pullback = 1
    } else if (prevCandle.color === 'GREEN' && currentCandle.color === 'RED') {
      pullback = -1
    } else if (prevCandle.color === currentCandle.color) {
      pullback = 0.5
    }
  }
  
  // Support
  let support = 0
  if (index >= 10) {
    const recentLows = candles.slice(index - 10, index).map(c => c.low)
    const minLow = Math.min(...recentLows)
    const supportLevel = minLow + (Math.max(...recentLows) - minLow) * 0.2
    support = currentCandle.close > supportLevel ? 1 : -1
  }
  
  // Resistance
  let resistance = 0
  if (index >= 10) {
    const recentHighs = candles.slice(index - 10, index).map(c => c.high)
    const maxHigh = Math.max(...recentHighs)
    const resistanceLevel = maxHigh - (maxHigh - Math.min(...recentHighs)) * 0.2
    resistance = currentCandle.close < resistanceLevel ? 1 : -1
  }
  
  return { rsi, momentum, pullback, support, resistance }
}

// Função para fazer previsão avançada
function makeAdvancedPrediction(features: any, weights: any) {
  const score = 
    features.rsi * weights.rsi +
    features.momentum * weights.momentum +
    features.pullback * weights.pullback +
    features.support * weights.support +
    features.resistance * weights.resistance
  
  return score > 0 ? 'GREEN' : 'RED'
}

// Função para ajustar pesos
function adjustWeights(weights: any, features: any, direction: number) {
  const learningRate = 0.01
  Object.keys(weights).forEach(key => {
    weights[key] += learningRate * features[key] * direction
    weights[key] = Math.max(0, Math.min(1, weights[key])) // Manter entre 0 e 1
  })
}

// Função para gerar pares simulados
function generateSimulatedPairs(count: number, historicalData: any[]) {
  const simulatedPairs = []
  
  for (let i = 0; i < count; i++) {
    const pairData = []
    
    for (let j = 0; j < 100; j++) {
      const randomIndex = Math.floor(Math.random() * historicalData.length)
      const baseCandle = historicalData[randomIndex]
      
      const variation = (Math.random() - 0.5) * 0.02
      const simulatedCandle = {
        ...baseCandle,
        open: baseCandle.open * (1 + variation),
        high: baseCandle.high * (1 + variation),
        low: baseCandle.low * (1 + variation),
        close: baseCandle.close * (1 + variation),
        volume: baseCandle.volume * (0.8 + Math.random() * 0.4),
        nextColor: Math.random() > 0.5 ? 'GREEN' : 'RED'
      }
      
      pairData.push(simulatedCandle)
    }
    
    simulatedPairs.push(pairData)
  }
  
  return simulatedPairs
}


