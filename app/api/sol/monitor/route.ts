import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Monitorando sistema SOL AI...')
    
    // 1. Verificar estatísticas de aprendizado
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
        error: 'Erro ao buscar estatísticas',
        details: statsError.message
      }, { status: 500 })
    }

    // 2. Verificar dados recentes
    const { data: recentData, error: recentError } = await supabase
      .from('sol_candles')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10)

    if (recentError) {
      console.error('Erro ao buscar dados recentes:', recentError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar dados recentes',
        details: recentError.message
      }, { status: 500 })
    }

    // 3. Verificar sinais recentes
    const { data: signalsData, error: signalsError } = await supabase
      .from('sol_signals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    // 4. Calcular métricas de saúde do sistema
    const currentTime = new Date()
    const lastUpdate = statsData?.last_update ? new Date(statsData.last_update) : null
    const timeSinceLastUpdate = lastUpdate ? currentTime.getTime() - lastUpdate.getTime() : Infinity
    
    const systemHealth = {
      database: 'OK',
      dataCollection: recentData && recentData.length > 0 ? 'Ativo' : 'Inativo',
      learning: statsData?.learning_phase === 'LEARNING' ? 'Ativo' : 'Automático',
      lastDataUpdate: lastUpdate ? lastUpdate.toISOString() : 'Nunca',
      timeSinceLastUpdate: timeSinceLastUpdate < 300000 ? 'OK' : 'Atrasado', // 5 minutos
      totalDataPoints: statsData?.sol_data_points || 0,
      accuracy: statsData?.accuracy || 0,
      learningPhase: statsData?.learning_phase || 'INITIAL'
    }

    // 5. Verificar se precisa de aprendizado automático
    const needsLearning = statsData?.learning_phase === 'INITIAL' || 
                         (statsData?.accuracy < 80 && statsData?.total_simulations < 1000)

    console.log('✅ Monitoramento concluído:', {
      health: systemHealth,
      needsLearning,
      dataPoints: recentData?.length || 0
    })

    return NextResponse.json({
      success: true,
      message: 'Sistema monitorado com sucesso',
      systemHealth,
      needsLearning,
      recentData: recentData || [],
      recentSignals: signalsData || [],
      stats: statsData
    })

  } catch (error) {
    console.error('Erro no monitoramento:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no monitoramento do sistema',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}


