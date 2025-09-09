import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando status do sistema SOL AI...')
    
    // Buscar estatísticas de aprendizado
    const { data: statsData, error: statsError } = await supabase
      .from('sol_learning_stats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (statsError) {
      console.error('Erro ao buscar estatísticas:', statsError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar estatísticas do sistema',
        details: statsError.message
      }, { status: 500 })
    }

    // Buscar dados de performance
    const { data: performanceData, error: performanceError } = await supabase
      .from('sol_performance')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .single()

    // Buscar sinais recentes
    const { data: signalsData, error: signalsError } = await supabase
      .from('sol_signals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    // Verificar se o sistema está aprendendo
    const isLearning = statsData?.learning_phase === 'LEARNING' || statsData?.learning_phase === 'READY'
    
    // Calcular precisão atual
    const currentAccuracy = statsData?.accuracy || 0
    const targetAccuracy = 95
    
    // Determinar fase do sistema
    let systemPhase = 'INITIAL'
    if (currentAccuracy >= targetAccuracy) {
      systemPhase = 'MASTER'
    } else if (currentAccuracy >= 80) {
      systemPhase = 'READY'
    } else if (statsData?.total_simulations > 0) {
      systemPhase = 'LEARNING'
    }

    const systemStatus = {
      success: true,
      stats: {
        totalSimulations: statsData?.total_simulations || 0,
        accuracy: currentAccuracy,
        learningPhase: systemPhase,
        solDataPoints: statsData?.sol_data_points || 0,
        lastUpdate: statsData?.last_update || new Date().toISOString(),
        targetAccuracy: targetAccuracy
      },
      isLearning,
      performance: performanceData || null,
      recentSignals: signalsData || [],
      systemHealth: {
        database: 'OK',
        learning: isLearning ? 'Ativo' : 'Automático',
        dataCollection: 'Ativo',
        signalGeneration: systemPhase === 'MASTER' || systemPhase === 'READY' ? 'Pronto' : 'Aguardando'
      }
    }

    console.log('✅ Status do sistema verificado:', {
      phase: systemPhase,
      accuracy: currentAccuracy,
      learning: isLearning,
      simulations: statsData?.total_simulations || 0
    })

    return NextResponse.json(systemStatus)

  } catch (error) {
    console.error('Erro ao verificar status do sistema:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao verificar status do sistema',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}


