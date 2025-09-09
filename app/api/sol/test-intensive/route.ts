import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { solMLEngine } from '@/lib/sol-ml-engine'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testando aprendizado intensivo...')
    
    // 1. Carregar dados existentes
    const { data: allCandles } = await supabase
      .from('sol_candles')
      .select('*')
      .order('timestamp', { ascending: true })
      .limit(1000) // Limitar para teste
    
    if (!allCandles || allCandles.length < 100) {
      throw new Error('Dados insuficientes para teste')
    }
    
    console.log(`📊 Carregados ${allCandles.length} velas do banco`)
    
    // 2. Gerar pares simulados (apenas 10 para teste)
    console.log('🔄 Gerando 10 pares simulados para teste...')
    const simulatedPairs = solMLEngine.generateSimulatedPairs(10, allCandles)
    
    console.log(`✅ Gerados ${simulatedPairs.length} pares simulados`)
    
    // 3. Testar treinamento
    console.log('🧠 Testando treinamento...')
    const trainingResult = await solMLEngine.trainModel(allCandles)
    
    console.log(`✅ Treinamento concluído - Precisão: ${trainingResult.accuracy.toFixed(2)}%`)
    
    return NextResponse.json({
      success: true,
      message: 'Teste de aprendizado intensivo concluído!',
      stats: {
        totalDataPoints: allCandles.length,
        simulatedPairs: simulatedPairs.length,
        accuracy: trainingResult.accuracy,
        totalSimulations: trainingResult.totalSimulations
      }
    })
    
  } catch (error) {
    console.error('Erro no teste de aprendizado intensivo:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no teste de aprendizado intensivo',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}


