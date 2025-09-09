import { NextRequest, NextResponse } from 'next/server'

// Variáveis globais para sinais
let signalHistory: any[] = []
let lastSignalTime = 0

// Pares para gerar sinais
const SIGNAL_PAIRS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 'DOTUSDT', 'AVAXUSDT', 'SHIBUSDT'
]

// Função para gerar sinal SIMPLES
async function generateSimpleSignal() {
  try {
    console.log('🎯 Gerando sinais simples...')
    
    const signals = []
    const now = new Date()
    
    // Gerar 3-5 sinais aleatórios
    const numSignals = 3 + Math.floor(Math.random() * 3)
    
    for (let i = 0; i < numSignals; i++) {
      const pair = SIGNAL_PAIRS[Math.floor(Math.random() * SIGNAL_PAIRS.length)]
      const action = Math.random() > 0.5 ? 'GREEN' : 'RED'
      const confidence = 60 + Math.floor(Math.random() * 30) // 60-90%
      const price = 100 + Math.random() * 1000 // Preço simulado
      
      const signal = {
        id: `signal_${Date.now()}_${i}`,
        pair: pair,
        action: action,
        confidence: confidence,
        price: price.toFixed(2),
        timestamp: new Date(now.getTime() + i * 1000).toISOString(),
        reasoning: `Padrão identificado: ${action === 'GREEN' ? 'Tendência de alta' : 'Tendência de baixa'}`,
        status: 'active'
      }
      
      signals.push(signal)
    }
    
    // Adicionar sinais ao histórico
    signalHistory.unshift(...signals)
    
    // Manter apenas os últimos 50 sinais
    if (signalHistory.length > 50) {
      signalHistory = signalHistory.slice(0, 50)
    }
    
    console.log(`✅ Gerados ${signals.length} sinais`)
    return signals

  } catch (error) {
    console.error('Erro ao gerar sinais:', error)
    return []
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      signals: signalHistory,
      recentSignals: signalHistory.slice(0, 10),
      totalSignals: signalHistory.length,
      lastUpdate: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao buscar sinais:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao buscar sinais',
      signals: signalHistory,
      recentSignals: signalHistory.slice(0, 10),
      totalSignals: signalHistory.length
    })
  }
}

export async function POST() {
  try {
    // Gerar novos sinais
    const newSignals = await generateSimpleSignal()
    
    if (newSignals && newSignals.length > 0) {
      lastSignalTime = Date.now()
      console.log(`🎯 Gerados ${newSignals.length} novos sinais via POST`)
      
      return NextResponse.json({
        success: true,
        message: `${newSignals.length} sinais gerados com sucesso!`,
        signals: newSignals,
        totalSignals: signalHistory.length
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Erro ao gerar sinais',
        signals: signalHistory,
        totalSignals: signalHistory.length
      })
    }

  } catch (error) {
    console.error('Erro ao gerar sinais via POST:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao gerar sinais',
      signals: signalHistory,
      totalSignals: signalHistory.length
    }, { status: 500 })
  }
}