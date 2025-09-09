import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Simular geração de sinal SOL
    const predictions = ['GREEN', 'RED', 'YELLOW'] as const
    const prediction = predictions[Math.floor(Math.random() * predictions.length)]
    const confidence = Math.floor(Math.random() * 40) + 60 // 60-100%
    const price = 180 + Math.random() * 20 // Preço simulado entre 180-200
    const accuracy = Math.floor(Math.random() * 30) + 70 // 70-100%
    
    const signal = {
      prediction,
      confidence,
      price: parseFloat(price.toFixed(4)),
      timestamp: new Date().toISOString(),
      accuracy
    }
    
    console.log('🎯 Sinal SOL gerado:', signal)
    
    return NextResponse.json({
      success: true,
      signal,
      message: `Sinal ${prediction} gerado com ${confidence}% de confiança`
    })
    
  } catch (error) {
    console.error('Erro ao gerar sinal SOL:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao gerar sinal SOL',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}