import cron from 'node-cron'
import axios from 'axios'
import { extractFeatures } from './featureExtractor.js'
import { supabase } from './supabaseClient.js'

const MODEL_SERVER_URL = process.env.MODEL_SERVER_URL || 'http://localhost:8000'
const THRESHOLD = parseFloat(process.env.TRADE_CONFIDENCE_THRESHOLD || '0.70')

/**
 * Job principal que roda a cada 3 minutos
 */
async function predictionJob() {
  try {
    console.log('\n🔄 ===== CICLO DE PREDIÇÃO INICIADO =====')
    console.log(`⏰ ${new Date().toLocaleString('pt-BR')}`)

    // 1. Extrair features dos candles recentes
    const result = await extractFeatures('BTCUSDT')

    if (!result || !result.features) {
      console.log('⚠️ Features insuficientes, pulando ciclo')
      return
    }

    const { features } = result

    // 2. Chamar modelo para predição
    console.log('🤖 Solicitando predição ao modelo ML...')
    
    let prediction
    try {
      const response = await axios.post(`${MODEL_SERVER_URL}/predict`, {
        features
      }, {
        timeout: 10000
      })
      
      prediction = response.data
    } catch (modelError) {
      console.error('❌ Erro ao chamar modelo:', modelError.message)
      console.log('⚠️ Modelo ML pode não estar rodando. Inicie: python ml/serve.py')
      return
    }

    const { direction, confidence, model_version } = prediction

    console.log(`📊 Predição: ${direction} | Confiança: ${(confidence * 100).toFixed(2)}% | Versão: ${model_version}`)

    // 3. Verificar se confiança é suficiente
    if (confidence < THRESHOLD) {
      console.log(`⚠️ Confiança abaixo do threshold (${(THRESHOLD * 100).toFixed(0)}%), não abrindo trade`)
      return
    }

    // 4. Registrar trade
    const entryPrice = features.last_close
    const entryTime = new Date().toISOString()

    const payload = {
      symbol: 'BTCUSDT',
      entry_time: entryTime,
      entry_price: entryPrice,
      predicted_direction: direction,
      predicted_confidence: confidence,
      features: features,
      model_version: model_version || 'v1',
      result: 'PENDING'
    }

    const { data, error } = await supabase
      .from('model_trades')
      .insert([payload])
      .select()

    if (error) {
      console.error('❌ Erro ao registrar trade:', error.message)
      return
    }

    console.log(`✅ Trade registrado! ID: ${data[0].id}`)
    console.log(`   Direção: ${direction}`)
    console.log(`   Entrada: $${entryPrice.toFixed(2)}`)
    console.log(`   Confiança: ${(confidence * 100).toFixed(2)}%`)
    
    console.log('===== CICLO CONCLUÍDO =====\n')
  } catch (err) {
    console.error('❌ Erro no job de predição:', err.message)
  }
}

/**
 * Job de feedback - verifica trades pendentes e atualiza resultados
 */
async function feedbackJob() {
  try {
    // Buscar trades pendentes
    const { data: pendingTrades, error } = await supabase
      .from('model_trades')
      .select('*')
      .eq('result', 'PENDING')
      .order('entry_time', { ascending: true })
      .limit(100)

    if (error) throw error

    if (!pendingTrades || pendingTrades.length === 0) {
      return
    }

    console.log(`🔍 Verificando ${pendingTrades.length} trades pendentes...`)

    for (const trade of pendingTrades) {
      // Verificar se já passou tempo suficiente (ex: 3 minutos)
      const entryTime = new Date(trade.entry_time)
      const now = new Date()
      const diffMinutes = (now - entryTime) / (1000 * 60)

      if (diffMinutes < 3) {
        continue // Ainda não fechou a vela
      }

      // Buscar candle mais recente para obter preço de saída
      const { data: candles } = await supabase
        .from('candles')
        .select('*')
        .gte('timestamp', trade.entry_time)
        .order('timestamp', { ascending: false })
        .limit(1)

      if (!candles || candles.length === 0) {
        continue
      }

      const exitPrice = parseFloat(candles[0].close)
      const exitTime = candles[0].timestamp

      const actualDirection = exitPrice > parseFloat(trade.entry_price) ? 'UP' : 'DOWN'
      const result = actualDirection === trade.predicted_direction ? 'WIN' : 'LOSS'

      // Atualizar trade
      await supabase
        .from('model_trades')
        .update({
          exit_price: exitPrice,
          exit_time: exitTime,
          actual_direction: actualDirection,
          result
        })
        .eq('id', trade.id)

      console.log(`✅ Trade #${trade.id} fechado: ${result} (${actualDirection})`)
    }
  } catch (err) {
    console.error('❌ Erro no job de feedback:', err.message)
  }
}

/**
 * Iniciar scheduler
 */
export function start() {
  console.log('⏰ Iniciando scheduler...')

  // Job de predição a cada 3 minutos
  cron.schedule('*/3 * * * *', predictionJob)
  console.log('✅ Job de predição: a cada 3 minutos')

  // Job de feedback a cada 1 minuto
  cron.schedule('* * * * *', feedbackJob)
  console.log('✅ Job de feedback: a cada 1 minuto')

  // Executar primeiro job imediatamente (opcional)
  // setTimeout(predictionJob, 5000)
}

