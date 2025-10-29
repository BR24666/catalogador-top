import { supabase } from './supabaseClient.js'

/**
 * Buscar candles recentes do Supabase
 */
export async function getRecentCandles(symbol = 'BTCUSDT', limit = 60) {
  try {
    const { data, error } = await supabase
      .from('candles')
      .select('*')
      .eq('symbol', symbol)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) throw error

    // Retornar em ordem cronológica
    return (data || []).reverse()
  } catch (error) {
    console.error('❌ Erro ao buscar candles:', error.message)
    return []
  }
}

/**
 * Computar indicadores técnicos e features para ML
 */
export function computeIndicators(candles) {
  if (candles.length < 5) {
    return null
  }

  const closes = candles.map(c => parseFloat(c.close))
  const opens = candles.map(c => parseFloat(c.open))
  const highs = candles.map(c => parseFloat(c.high))
  const lows = candles.map(c => parseFloat(c.low))
  const volumes = candles.map(c => parseFloat(c.volume))

  const features = {}

  // Preços básicos
  features.last_close = closes[closes.length - 1]
  features.last_open = opens[opens.length - 1]
  features.last_high = highs[highs.length - 1]
  features.last_low = lows[lows.length - 1]

  // Returns (taxas de retorno)
  const returns = []
  for (let i = 1; i < closes.length; i++) {
    returns.push((closes[i] - closes[i - 1]) / closes[i - 1])
  }

  features.mean_return_5 = mean(returns.slice(-5))
  features.mean_return_10 = mean(returns.slice(-10))
  features.std_return_10 = std(returns.slice(-10))

  // Body sizes (tamanho do corpo das velas)
  const bodies = closes.map((c, i) => Math.abs(c - opens[i]))
  features.avg_body_5 = mean(bodies.slice(-5))
  features.avg_body_10 = mean(bodies.slice(-10))
  features.max_body_10 = Math.max(...bodies.slice(-10))

  // Wicks (pavios)
  const upperWicks = highs.map((h, i) => h - Math.max(opens[i], closes[i]))
  const lowerWicks = lows.map((l, i) => Math.min(opens[i], closes[i]) - l)
  
  features.avg_upper_wick_5 = mean(upperWicks.slice(-5))
  features.avg_lower_wick_5 = mean(lowerWicks.slice(-5))

  // Direção (contagem de velas bullish/bearish)
  const bulls = closes.filter((c, i) => c > opens[i]).length
  const bears = closes.filter((c, i) => c < opens[i]).length
  
  features.bull_count = bulls
  features.bear_count = bears
  features.bull_ratio = bulls / closes.length

  // High/Low ranges
  features.max_high_10 = Math.max(...highs.slice(-10))
  features.min_low_10 = Math.min(...lows.slice(-10))
  features.price_range_10 = features.max_high_10 - features.min_low_10

  // Volume
  features.avg_volume_5 = mean(volumes.slice(-5))
  features.avg_volume_10 = mean(volumes.slice(-10))
  features.last_volume = volumes[volumes.length - 1]

  // Momentum indicators
  features.rsi_14 = calculateRSI(closes, 14)
  
  // Moving averages
  features.sma_5 = mean(closes.slice(-5))
  features.sma_10 = mean(closes.slice(-10))
  features.sma_20 = mean(closes.slice(-20))
  
  // Price position relative to MAs
  features.price_vs_sma5 = (features.last_close - features.sma_5) / features.sma_5
  features.price_vs_sma10 = (features.last_close - features.sma_10) / features.sma_10

  // Time features
  const lastCandle = candles[candles.length - 1]
  const timestamp = new Date(lastCandle.timestamp)
  features.hour = timestamp.getHours()
  features.minute = timestamp.getMinutes()
  features.weekday = timestamp.getDay()

  // Patterns (simples)
  features.is_doji = Math.abs(closes[closes.length - 1] - opens[opens.length - 1]) < (bodies[bodies.length - 1] * 0.1)
  features.is_hammer = lowerWicks[lowerWicks.length - 1] > (bodies[bodies.length - 1] * 2)
  
  return features
}

/**
 * Calcular média
 */
function mean(arr) {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

/**
 * Calcular desvio padrão
 */
function std(arr) {
  if (arr.length === 0) return 0
  const avg = mean(arr)
  const squareDiffs = arr.map(value => Math.pow(value - avg, 2))
  return Math.sqrt(mean(squareDiffs))
}

/**
 * Calcular RSI (Relative Strength Index)
 */
function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50

  const changes = []
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1])
  }

  const gains = changes.map(c => c > 0 ? c : 0)
  const losses = changes.map(c => c < 0 ? Math.abs(c) : 0)

  const avgGain = mean(gains.slice(-period))
  const avgLoss = mean(losses.slice(-period))

  if (avgLoss === 0) return 100
  
  const rs = avgGain / avgLoss
  const rsi = 100 - (100 / (1 + rs))

  return rsi
}

/**
 * Extrair features completas (wrapper)
 */
export async function extractFeatures(symbol = 'BTCUSDT') {
  console.log(`📊 Extraindo features para ${symbol}...`)
  
  const candles = await getRecentCandles(symbol, 60)
  
  if (candles.length < 20) {
    console.log('⚠️ Candles insuficientes para análise')
    return null
  }

  const features = computeIndicators(candles)
  
  if (!features) {
    console.log('⚠️ Não foi possível computar indicadores')
    return null
  }

  console.log(`✅ Features extraídas: ${Object.keys(features).length} indicadores`)
  
  return {
    features,
    candles,
    timestamp: new Date().toISOString()
  }
}

