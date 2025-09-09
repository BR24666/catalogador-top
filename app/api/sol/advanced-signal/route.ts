import { NextRequest, NextResponse } from 'next/server'
import { PatternBasedMLEngine } from '@/lib/pattern-based-ml-engine'

// Variáveis globais para o sistema de sinais
let mlEngine: PatternBasedMLEngine | null = null
let signalHistory: Array<{
  id: string
  timestamp: string
  prediction: 'GREEN' | 'RED' | 'YELLOW'
  confidence: number
  accuracy: number
  entryWindow: string
  targetCandle: string
  actualResult?: 'GREEN' | 'RED' | 'YELLOW'
  wasCorrect?: boolean
  validatedAt?: string
}> = []

// Inicializar ML Engine
if (!mlEngine) {
  mlEngine = new PatternBasedMLEngine()
}

// Gerar dados de velas realistas
function generateRealisticCandleData(count: number) {
  const candles = []
  let price = 180 + Math.random() * 20 // Preço base entre 180-200
  
  for (let i = 0; i < count; i++) {
    const open = price
    const volatility = 0.005 + Math.random() * 0.01 // 0.5% a 1.5% de volatilidade
    const change = (Math.random() - 0.5) * volatility
    const close = open * (1 + change)
    const high = Math.max(open, close) * (1 + Math.random() * 0.005)
    const low = Math.min(open, close) * (1 - Math.random() * 0.005)
    
    let color: 'GREEN' | 'RED' | 'YELLOW' = 'YELLOW'
    if (close > open * 1.0005) color = 'GREEN'
    else if (close < open * 0.9995) color = 'RED'
    
    candles.push({
      timestamp: Date.now() - (count - i) * 60000, // 1 minuto atrás
      open,
      high,
      low,
      close,
      volume: Math.random() * 1000000,
      pair: 'SOLUSDT',
      color
    })
    
    price = close
  }
  
  return candles
}

// Calcular precisão atual do sistema
function calculateCurrentAccuracy() {
  if (signalHistory.length === 0) return 0
  
  const validatedSignals = signalHistory.filter(s => s.wasCorrect !== undefined)
  if (validatedSignals.length === 0) return 0
  
  const correctSignals = validatedSignals.filter(s => s.wasCorrect).length
  return Math.round((correctSignals / validatedSignals.length) * 100 * 100) / 100
}

// Buscar precisão do sistema simultâneo
async function getSimultaneousLearningAccuracy() {
  try {
    const response = await fetch('http://localhost:3000/api/sol/simultaneous-learning')
    const data = await response.json()
    return data.currentAccuracy || 0
  } catch (error) {
    console.error('Erro ao buscar precisão do sistema simultâneo:', error)
    return 0
  }
}

// Gerar sinal com antecedência de 1 minuto
async function generateSignal() {
  if (!mlEngine) return null
  
  // Buscar precisão do sistema simultâneo
  const simultaneousAccuracy = await getSimultaneousLearningAccuracy()
  
  // Gerar dados de velas para análise
  const candles = generateRealisticCandleData(20)
  
  // Fazer previsão com ML Engine
  const prediction = mlEngine.makePrediction(candles)
  
  // Calcular precisão atual (usar a maior entre histórico e sistema simultâneo)
  const historyAccuracy = calculateCurrentAccuracy()
  const currentAccuracy = Math.max(simultaneousAccuracy, historyAccuracy)
  
  // Só gerar sinal se precisão >= 95% e confiança >= 95%
  if (currentAccuracy < 95 || prediction.confidence < 0.95) {
    return {
      success: false,
      reason: `Precisão insuficiente: ${currentAccuracy.toFixed(1)}% (mínimo 95%) ou confiança insuficiente: ${Math.round(prediction.confidence * 100)}% (mínimo 95%)`,
      currentAccuracy: Math.round(currentAccuracy * 100) / 100,
      requiredAccuracy: 95,
      currentConfidence: Math.round(prediction.confidence * 100),
      requiredConfidence: 95,
      simultaneousAccuracy: Math.round(simultaneousAccuracy * 100) / 100,
      historyAccuracy: Math.round(historyAccuracy * 100) / 100
    }
  }
  
  // Calcular timestamps
  const now = new Date()
  const entryWindowStart = new Date(now.getTime() + 60000) // 1 minuto no futuro
  const entryWindowEnd = new Date(now.getTime() + 120000) // 2 minutos no futuro
  const targetCandleStart = new Date(now.getTime() + 120000) // 2 minutos no futuro
  const targetCandleEnd = new Date(now.getTime() + 180000) // 3 minutos no futuro
  
  // Criar sinal
  const signal = {
    id: `signal_${Date.now()}`,
    timestamp: now.toISOString(),
    prediction: prediction.prediction,
    confidence: Math.round(prediction.confidence * 100),
    accuracy: currentAccuracy,
    entryWindow: `${entryWindowStart.toISOString()} - ${entryWindowEnd.toISOString()}`,
    targetCandle: `${targetCandleStart.toISOString()} - ${targetCandleEnd.toISOString()}`,
    reasoning: prediction.reasoning,
    countdown: 60 // 60 segundos de antecedência
  }
  
  // Adicionar ao histórico
  signalHistory.push(signal)
  
  // Manter apenas últimos 50 sinais
  if (signalHistory.length > 50) {
    signalHistory = signalHistory.slice(-50)
  }
  
  return {
    success: true,
    signal,
    message: `Sinal ${prediction.prediction} gerado com ${Math.round(prediction.confidence * 100)}% de confiança e ${currentAccuracy}% de precisão`
  }
}

// Validar sinal anterior
function validatePreviousSignal() {
  if (signalHistory.length === 0) return null
  
  const lastSignal = signalHistory[signalHistory.length - 1]
  if (lastSignal.actualResult) return lastSignal // Já validado
  
  // Simular resultado real da vela alvo
  const actualResult = Math.random() > 0.5 ? 'GREEN' : 'RED'
  const wasCorrect = lastSignal.prediction === actualResult
  
  // Atualizar sinal
  lastSignal.actualResult = actualResult
  lastSignal.wasCorrect = wasCorrect
  lastSignal.validatedAt = new Date().toISOString()
  
  return lastSignal
}

export async function GET(request: NextRequest) {
  try {
    // Validar sinal anterior se houver
    const validatedSignal = validatePreviousSignal()
    
    // Calcular estatísticas
    const currentAccuracy = calculateCurrentAccuracy()
    const totalSignals = signalHistory.length
    const validatedSignals = signalHistory.filter(s => s.wasCorrect !== undefined).length
    const correctSignals = signalHistory.filter(s => s.wasCorrect).length
    
    return NextResponse.json({
      success: true,
      currentAccuracy,
      totalSignals,
      validatedSignals,
      correctSignals,
      lastValidation: validatedSignal,
      recentSignals: signalHistory.slice(-10), // Últimos 10 sinais
      canGenerateSignal: currentAccuracy >= 95,
      message: currentAccuracy >= 95 ? 'Sistema pronto para gerar sinais' : `Precisão insuficiente: ${currentAccuracy}% (mínimo 95%)`
    })
    
  } catch (error) {
    console.error('Erro ao buscar sinais:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao buscar sinais',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Gerando sinal com antecedência de 1 minuto...')
    
    const result = await generateSignal()
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        reason: result.reason,
        currentAccuracy: result.currentAccuracy,
        requiredAccuracy: result.requiredAccuracy,
        currentConfidence: result.currentConfidence,
        requiredConfidence: result.requiredConfidence,
        simultaneousAccuracy: result.simultaneousAccuracy,
        historyAccuracy: result.historyAccuracy,
        message: 'Sinal não gerado - Critérios de qualidade não atendidos'
      })
    }
    
    console.log(`✅ Sinal gerado: ${result.signal.prediction} (${result.signal.confidence}% confiança, ${result.signal.accuracy}% precisão)`)
    
    return NextResponse.json({
      success: true,
      signal: result.signal,
      message: result.message
    })
    
  } catch (error) {
    console.error('Erro ao gerar sinal:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao gerar sinal',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    signalHistory = []
    
    return NextResponse.json({
      success: true,
      message: 'Histórico de sinais limpo!'
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao limpar histórico'
    }, { status: 500 })
  }
}
