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

// Função para buscar dados históricos do SOL
async function fetchSolHistoricalData(months: number = 6): Promise<ProcessedCandle[]> {
  try {
    const endTime = Date.now()
    const startTime = endTime - (months * 30 * 24 * 60 * 60 * 1000) // 6 meses em ms
    
    const response = await fetch(
      `${BINANCE_BASE_URL}/klines?symbol=SOLUSDT&interval=1m&startTime=${startTime}&endTime=${endTime}&limit=1000`
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
    console.error('Erro ao buscar dados históricos do SOL:', error)
    throw error
  }
}

// Função para gerar dados simulados de 500 pares
function generateSimulatedPairs(solData: ProcessedCandle[]): ProcessedCandle[][] {
  const simulatedPairs: ProcessedCandle[][] = []
  
  for (let i = 0; i < 500; i++) {
    const pairData: ProcessedCandle[] = []
    const baseIndex = Math.floor(Math.random() * (solData.length - 100))
    
    for (let j = 0; j < 100; j++) {
      const originalCandle = solData[baseIndex + j]
      if (!originalCandle) continue
      
      // Adicionar variação aleatória para simular diferentes pares
      const variation = (Math.random() - 0.5) * 0.02 // ±1% de variação
      const multiplier = 1 + variation
      
      const simulatedCandle: ProcessedCandle = {
        timestamp: originalCandle.timestamp + (i * 60000), // Offset de tempo
        open: originalCandle.open * multiplier,
        high: originalCandle.high * multiplier,
        low: originalCandle.low * multiplier,
        close: originalCandle.close * multiplier,
        volume: originalCandle.volume * (0.8 + Math.random() * 0.4), // Variação de volume
        color: originalCandle.color,
        nextColor: originalCandle.nextColor
      }
      
      pairData.push(simulatedCandle)
    }
    
    simulatedPairs.push(pairData)
  }
  
  return simulatedPairs
}

// Função para calcular precisão do modelo
function calculateAccuracy(predictions: { predicted: string, actual: string }[]): number {
  if (predictions.length === 0) return 0
  
  const correct = predictions.filter(p => p.predicted === p.actual).length
  return (correct / predictions.length) * 100
}

// Função para treinar o modelo com validação de pullbacks
function trainModelWithPullbacks(solData: ProcessedCandle[], simulatedPairs: ProcessedCandle[][]): {
  accuracy: number
  totalSimulations: number
  learningPhase: string
} {
  let totalPredictions = 0
  let correctPredictions = 0
  
  // Treinar com dados do SOL
  for (let i = 0; i < solData.length - 1; i++) {
    const currentCandle = solData[i]
    const nextCandle = solData[i + 1]
    
    if (!currentCandle.nextColor) continue
    
    // Lógica de previsão baseada em padrões
    let prediction = 'GREEN'
    
    // Análise de tendência
    if (i >= 2) {
      const prevCandle = solData[i - 1]
      const prevPrevCandle = solData[i - 2]
      
      // Padrão de pullback
      if (prevCandle.color === 'RED' && currentCandle.color === 'GREEN' && prevPrevCandle.color === 'GREEN') {
        prediction = 'GREEN' // Reversão esperada
      }
      // Padrão de continuação
      else if (currentCandle.color === 'GREEN' && prevCandle.color === 'GREEN') {
        prediction = 'GREEN' // Continuação de tendência
      }
      // Padrão de reversão
      else if (currentCandle.color === 'RED' && prevCandle.color === 'GREEN') {
        prediction = 'RED' // Reversão esperada
      }
    }
    
    totalPredictions++
    if (prediction === currentCandle.nextColor) {
      correctPredictions++
    }
  }
  
  // Treinar com dados simulados
  simulatedPairs.forEach(pairData => {
    for (let i = 0; i < pairData.length - 1; i++) {
      const currentCandle = pairData[i]
      const nextCandle = pairData[i + 1]
      
      if (!currentCandle.nextColor) continue
      
      // Mesma lógica de previsão
      let prediction = 'GREEN'
      
      if (i >= 2) {
        const prevCandle = pairData[i - 1]
        const prevPrevCandle = pairData[i - 2]
        
        if (prevCandle.color === 'RED' && currentCandle.color === 'GREEN' && prevPrevCandle.color === 'GREEN') {
          prediction = 'GREEN'
        } else if (currentCandle.color === 'GREEN' && prevCandle.color === 'GREEN') {
          prediction = 'GREEN'
        } else if (currentCandle.color === 'RED' && prevCandle.color === 'GREEN') {
          prediction = 'RED'
        }
      }
      
      totalPredictions++
      if (prediction === currentCandle.nextColor) {
        correctPredictions++
      }
    }
  })
  
  const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0
  const learningPhase = accuracy >= 95 ? 'MASTER' : accuracy >= 80 ? 'READY' : 'LEARNING'
  
  return {
    accuracy,
    totalSimulations: totalPredictions,
    learningPhase
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧠 Iniciando sistema de aprendizado SOL AI...')
    
    // 1. Coletar dados históricos do SOL
    console.log('📊 Coletando dados históricos do SOL (6 meses)...')
    await solDataCollector.collectAndSaveHistoricalData(6)
    
    // 2. Buscar dados do SOL do Supabase
    const { data: solCandles, error: candlesError } = await supabase
      .from('sol_candles')
      .select('*')
      .order('timestamp', { ascending: true })
    
    if (candlesError || !solCandles) {
      throw new Error('Erro ao buscar dados do SOL do Supabase')
    }
    
    const solData = solCandles.map(candle => ({
      timestamp: new Date(candle.timestamp).getTime(),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
      color: candle.color,
      nextColor: candle.next_color
    }))
    
    console.log(`✅ Carregados ${solData.length} velas do SOL`)
    
    // 3. Gerar 500 pares simulados
    console.log('🔄 Gerando 500 pares simulados para aprendizado...')
    const simulatedPairs = generateSimulatedPairs(solData)
    console.log(`✅ Gerados ${simulatedPairs.length} pares simulados`)
    
    // 4. Treinar modelo com ML Engine
    console.log('🎯 Treinando modelo com Machine Learning...')
    const trainingResult = await solMLEngine.trainModel(solData, simulatedPairs)
    console.log(`✅ Treinamento concluído - Precisão: ${trainingResult.accuracy.toFixed(2)}%`)
    
    // 5. Validar com pullbacks
    console.log('🔍 Validando modelo com pullbacks...')
    const pullbackValidation = await solMLEngine.validateWithPullbacks(solData)
    console.log(`✅ Validação com pullbacks: ${pullbackValidation.pullbackAccuracy.toFixed(2)}%`)
    
    // 6. Salvar modelo treinado
    await solMLEngine.saveModel(trainingResult.weights)
    
    // 7. Salvar estatísticas no Supabase
    const { error } = await supabase
      .from('sol_learning_stats')
      .upsert({
        id: 1,
        total_simulations: trainingResult.totalSimulations,
        accuracy: trainingResult.accuracy,
        learning_phase: trainingResult.learningPhase,
        sol_data_points: solData.length,
        last_update: new Date().toISOString(),
        target_accuracy: 95,
        pullback_accuracy: pullbackValidation.pullbackAccuracy,
        total_pullbacks: pullbackValidation.totalPullbacks,
        correct_pullbacks: pullbackValidation.correctPullbacks
      })
    
    if (error) {
      console.error('Erro ao salvar estatísticas:', error)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Sistema de aprendizado iniciado com sucesso!',
      stats: {
        totalSimulations: trainingResult.totalSimulations,
        accuracy: trainingResult.accuracy,
        learningPhase: trainingResult.learningPhase,
        solDataPoints: solData.length,
        lastUpdate: new Date().toLocaleString('pt-BR'),
        targetAccuracy: 95,
        pullbackAccuracy: pullbackValidation.pullbackAccuracy,
        totalPullbacks: pullbackValidation.totalPullbacks,
        correctPullbacks: pullbackValidation.correctPullbacks
      }
    })
    
  } catch (error) {
    console.error('Erro no sistema de aprendizado:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao iniciar sistema de aprendizado',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
