import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { solDataCollector } from '@/lib/sol-data-collector'
import { solMLEngine } from '@/lib/sol-ml-engine'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testando sistema SOL AI...')
    
    // 1. Verificar dados existentes
    const { data: existingData } = await supabase
      .from('sol_candles')
      .select('*')
      .limit(10)
    
    console.log(`📊 Dados existentes: ${existingData?.length || 0} velas`)
    
    // 2. Testar coleta de dados atuais
    const currentData = await solDataCollector.fetchCurrentData(10)
    console.log(`📈 Dados atuais coletados: ${currentData.length} velas`)
    
    // 3. Testar geração de pares simulados
    const simulatedPairs = solMLEngine.generateSimulatedPairs(5, currentData)
    console.log(`🔄 Pares simulados gerados: ${simulatedPairs.length} pares`)
    
    // 4. Testar treinamento básico
    if (currentData.length >= 10) {
      const trainingResult = await solMLEngine.trainModel(currentData, simulatedPairs)
      console.log(`🎯 Treinamento testado - Precisão: ${trainingResult.accuracy.toFixed(2)}%`)
      
      return NextResponse.json({
        success: true,
        message: 'Sistema testado com sucesso',
        results: {
          existingData: existingData?.length || 0,
          currentData: currentData.length,
          simulatedPairs: simulatedPairs.length,
          trainingAccuracy: trainingResult.accuracy,
          totalSimulations: trainingResult.totalSimulations
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Dados insuficientes para teste',
        results: {
          existingData: existingData?.length || 0,
          currentData: currentData.length,
          simulatedPairs: simulatedPairs.length
        }
      })
    }
    
  } catch (error) {
    console.error('Erro no teste do sistema:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no teste do sistema',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}


