import express from 'express'
import { supabase } from '../supabaseClient.js'

const router = express.Router()

/**
 * GET /api/model/status
 * Retorna métricas do modelo (accuracy, trades recentes, etc)
 */
router.get('/', async (req, res) => {
  try {
    console.log('📊 Calculando status do modelo...')

    // Buscar trades finalizados (últimos 500)
    const { data: trades, error } = await supabase
      .from('model_trades')
      .select('*')
      .neq('result', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) throw error

    const allTrades = trades || []
    
    // Calcular métricas gerais
    const totalTrades = allTrades.length
    const wins = allTrades.filter(t => t.result === 'WIN').length
    const losses = allTrades.filter(t => t.result === 'LOSS').length
    const accuracy = totalTrades > 0 ? (wins / totalTrades) : 0

    // Calcular sequências
    let currentStreak = 0
    let maxWinStreak = 0
    const streaks = []

    for (const trade of allTrades) {
      if (trade.result === 'WIN') {
        currentStreak++
        maxWinStreak = Math.max(maxWinStreak, currentStreak)
      } else {
        if (currentStreak > 0) {
          streaks.push(currentStreak)
        }
        currentStreak = 0
      }
    }

    const avgStreak = streaks.length > 0 ? streaks.reduce((a, b) => a + b, 0) / streaks.length : 0

    // Últimas 50 trades
    const recentTrades = allTrades.slice(0, 50)

    // Accuracy por período
    const last24h = allTrades.filter(t => {
      const created = new Date(t.created_at)
      const now = new Date()
      return (now - created) < (24 * 60 * 60 * 1000)
    })

    const acc24h = last24h.length > 0 ? 
      last24h.filter(t => t.result === 'WIN').length / last24h.length : 0

    // Buscar último modelo registrado
    const { data: lastModel } = await supabase
      .from('model_runs')
      .select('*')
      .order('trained_at', { ascending: false })
      .limit(1)
      .single()

    res.json({
      ok: true,
      rolling_accuracy: accuracy,
      accuracy_24h: acc24h,
      total_trades: totalTrades,
      wins,
      losses,
      max_win_streak: maxWinStreak,
      avg_win_streak: avgStreak,
      recent: recentTrades,
      last_model: lastModel || null,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('❌ Erro ao calcular status:', err.message)
    res.status(500).json({ error: err.message })
  }
})

export default router

