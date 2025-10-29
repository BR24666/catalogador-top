import express from 'express'
import { supabase } from '../supabaseClient.js'

const router = express.Router()

/**
 * POST /api/trade
 * Registra um novo trade (predição) no banco
 */
router.post('/', async (req, res) => {
  try {
    const payload = req.body

    console.log('💾 Registrando trade:', payload.predicted_direction, `@ ${payload.entry_price}`)

    const { data, error } = await supabase
      .from('model_trades')
      .insert([payload])
      .select()

    if (error) throw error

    console.log(`✅ Trade registrado com ID: ${data[0].id}`)

    res.json({ ok: true, data: data[0] })
  } catch (err) {
    console.error('❌ Erro ao registrar trade:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/trade
 * Lista trades recentes
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50

    const { data, error } = await supabase
      .from('model_trades')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    res.json({ ok: true, trades: data })
  } catch (err) {
    console.error('❌ Erro ao buscar trades:', err.message)
    res.status(500).json({ error: err.message })
  }
})

export default router

