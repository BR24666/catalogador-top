import express from 'express'
import axios from 'axios'

const router = express.Router()

const MODEL_SERVER_URL = process.env.MODEL_SERVER_URL || 'http://localhost:8000'

/**
 * POST /api/predict
 * Encaminha features para o servidor ML e retorna predição
 */
router.post('/', async (req, res) => {
  try {
    const { features } = req.body

    if (!features) {
      return res.status(400).json({ error: 'Features são obrigatórias' })
    }

    console.log('📡 Enviando features para modelo ML...')

    const response = await axios.post(`${MODEL_SERVER_URL}/predict`, {
      features
    }, {
      timeout: 5000
    })

    console.log(`✅ Predição recebida: ${response.data.direction} (${(response.data.confidence * 100).toFixed(2)}%)`)

    return res.json(response.data)
  } catch (err) {
    console.error('❌ Erro no predict:', err?.response?.data || err.message)
    return res.status(500).json({ 
      error: 'Erro ao obter predição',
      details: err?.response?.data || err.message
    })
  }
})

export default router

