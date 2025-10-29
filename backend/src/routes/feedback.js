import express from 'express'
import { supabase } from '../supabaseClient.js'

const router = express.Router()

/**
 * POST /api/feedback
 * Atualiza um trade com resultado (exit price, direção real, win/loss)
 */
router.post('/', async (req, res) => {
  try {
    const { trade_id, exit_price, exit_time } = req.body

    if (!trade_id || !exit_price) {
      return res.status(400).json({ error: 'trade_id e exit_price são obrigatórios' })
    }

    console.log(`📝 Atualizando feedback para trade #${trade_id}`)

    // Buscar trade
    const { data: trade, error: fetchError } = await supabase
      .from('model_trades')
      .select('*')
      .eq('id', trade_id)
      .single()

    if (fetchError || !trade) {
      return res.status(404).json({ error: 'Trade não encontrado' })
    }

    // Calcular direção real
    const actualDirection = parseFloat(exit_price) > parseFloat(trade.entry_price) ? 'UP' : 'DOWN'
    
    // Verificar resultado
    const result = actualDirection === trade.predicted_direction ? 'WIN' : 'LOSS'

    // Atualizar trade
    const { data, error } = await supabase
      .from('model_trades')
      .update({
        exit_price: parseFloat(exit_price),
        exit_time: exit_time || new Date().toISOString(),
        actual_direction: actualDirection,
        result
      })
      .eq('id', trade_id)
      .select()

    if (error) throw error

    console.log(`✅ Trade #${trade_id} atualizado: ${result} (${actualDirection})`)

    res.json({ ok: true, trade: data[0], result })
  } catch (err) {
    console.error('❌ Erro no feedback:', err.message)
    res.status(500).json({ error: err.message })
  }
})

export default router

