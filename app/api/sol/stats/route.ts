import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface LearningStats {
  totalSimulations: number
  accuracy: number
  learningPhase: 'INITIAL' | 'LEARNING' | 'READY' | 'MASTER'
  solDataPoints: number
  lastUpdate: string
  targetAccuracy: number
  totalSignalsGenerated: number
  lastSignalGenerated: string
  historicalAccuracy: number
  recentSignals: any[]
  performanceMetrics: {
    winRate: number
    averageConfidence: number
    bestStreak: number
    currentStreak: number
  }
}

// Função para calcular métricas de performance
async function calculatePerformanceMetrics(): Promise<{
  winRate: number
  averageConfidence: number
  bestStreak: number
  currentStreak: number
}> {
  try {
    // Buscar sinais com resultados
    const { data: signals, error } = await supabase
      .from('sol_signals')
      .select('prediction, actual_result, confidence, created_at')
      .not('actual_result', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (error || !signals || signals.length === 0) {
      return {
        winRate: 0,
        averageConfidence: 0,
        bestStreak: 0,
        currentStreak: 0
      }
    }
    
    // Calcular win rate
    const correctSignals = signals.filter(s => s.prediction === s.actual_result).length
    const winRate = (correctSignals / signals.length) * 100
    
    // Calcular confiança média
    const averageConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length
    
    // Calcular streaks
    let bestStreak = 0
    let currentStreak = 0
    let tempStreak = 0
    
    for (let i = 0; i < signals.length; i++) {
      const isCorrect = signals[i].prediction === signals[i].actual_result
      
      if (isCorrect) {
        tempStreak++
        if (i === 0) currentStreak = tempStreak
      } else {
        bestStreak = Math.max(bestStreak, tempStreak)
        tempStreak = 0
        if (i === 0) currentStreak = 0
      }
    }
    
    bestStreak = Math.max(bestStreak, tempStreak)
    
    return {
      winRate,
      averageConfidence,
      bestStreak,
      currentStreak
    }
  } catch (error) {
    console.error('Erro ao calcular métricas de performance:', error)
    return {
      winRate: 0,
      averageConfidence: 0,
      bestStreak: 0,
      currentStreak: 0
    }
  }
}

// Função para buscar sinais recentes
async function getRecentSignals(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('sol_signals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('Erro ao buscar sinais recentes:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Erro ao buscar sinais recentes:', error)
    return []
  }
}

// Função para calcular precisão histórica
async function calculateHistoricalAccuracy(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('sol_signals')
      .select('prediction, actual_result')
      .not('actual_result', 'is', null)
      .limit(100)
    
    if (error || !data || data.length === 0) {
      return 0
    }
    
    const correct = data.filter(signal => signal.prediction === signal.actual_result).length
    return (correct / data.length) * 100
  } catch (error) {
    console.error('Erro ao calcular precisão histórica:', error)
    return 0
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Buscando estatísticas do SOL AI...')
    
    // 1. Buscar estatísticas de aprendizado
    const { data: learningStats, error: statsError } = await supabase
      .from('sol_learning_stats')
      .select('*')
      .eq('id', 1)
      .single()
    
    if (statsError) {
      console.error('Erro ao buscar estatísticas de aprendizado:', statsError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar estatísticas de aprendizado'
      }, { status: 500 })
    }
    
    // 2. Calcular métricas de performance
    const performanceMetrics = await calculatePerformanceMetrics()
    
    // 3. Buscar sinais recentes
    const recentSignals = await getRecentSignals()
    
    // 4. Calcular precisão histórica
    const historicalAccuracy = await calculateHistoricalAccuracy()
    
    // 5. Montar resposta
    const stats: LearningStats = {
      totalSimulations: learningStats?.total_simulations || 0,
      accuracy: learningStats?.accuracy || 0,
      learningPhase: learningStats?.learning_phase || 'INITIAL',
      solDataPoints: learningStats?.sol_data_points || 0,
      lastUpdate: learningStats?.last_update || '',
      targetAccuracy: learningStats?.target_accuracy || 95,
      totalSignalsGenerated: learningStats?.total_signals_generated || 0,
      lastSignalGenerated: learningStats?.last_signal_generated || '',
      historicalAccuracy,
      recentSignals,
      performanceMetrics
    }
    
    console.log(`✅ Estatísticas carregadas - Fase: ${stats.learningPhase}, Precisão: ${stats.accuracy.toFixed(1)}%`)
    
    return NextResponse.json({
      success: true,
      stats
    })
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao buscar estatísticas do SOL AI',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// Endpoint para atualizar resultado de um sinal
export async function POST(request: NextRequest) {
  try {
    const { signalId, actualResult } = await request.json()
    
    if (!signalId || !actualResult) {
      return NextResponse.json({
        success: false,
        error: 'ID do sinal e resultado atual são obrigatórios'
      }, { status: 400 })
    }
    
    // Atualizar resultado do sinal
    const { error } = await supabase
      .from('sol_signals')
      .update({ 
        actual_result: actualResult,
        updated_at: new Date().toISOString()
      })
      .eq('id', signalId)
    
    if (error) {
      console.error('Erro ao atualizar resultado do sinal:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao atualizar resultado do sinal'
      }, { status: 500 })
    }
    
    console.log(`✅ Resultado do sinal ${signalId} atualizado: ${actualResult}`)
    
    return NextResponse.json({
      success: true,
      message: 'Resultado do sinal atualizado com sucesso'
    })
    
  } catch (error) {
    console.error('Erro ao atualizar resultado do sinal:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao atualizar resultado do sinal',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}


