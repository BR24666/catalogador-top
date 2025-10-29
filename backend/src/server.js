import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import predictRoute from './routes/predict.js'
import tradeRoute from './routes/trade.js'
import feedbackRoute from './routes/feedback.js'
import statusRoute from './routes/status.js'
import { start as startScheduler } from './scheduler.js'

dotenv.config()

const app = express()
const PORT = process.env.BACKEND_PORT || 3001

// Middlewares
app.use(cors())
app.use(express.json())

// Log de requisições
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

// Routes
app.use('/api/predict', predictRoute)
app.use('/api/trade', tradeRoute)
app.use('/api/feedback', feedbackRoute)
app.use('/api/model/status', statusRoute)

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 ========================================')
  console.log(`   Backend ML rodando na porta ${PORT}`)
  console.log('   ========================================')
  console.log(`   📡 API: http://localhost:${PORT}`)
  console.log(`   📊 Status: http://localhost:${PORT}/api/model/status`)
  console.log(`   💚 Health: http://localhost:${PORT}/health`)
  console.log('   ========================================\n')

  // Iniciar scheduler após 5 segundos
  setTimeout(() => {
    startScheduler()
  }, 5000)
})

