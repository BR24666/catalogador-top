// Script para coletar dados históricos do SOLUSDT
const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = 'https://lgddsslskhzxtpjathjr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws'
const supabase = createClient(supabaseUrl, supabaseKey)

// Função para converter timestamp para horário de São Paulo
function toSaoPauloTime(timestamp) {
  const date = new Date(timestamp)
  const saoPauloTime = new Date(date.getTime() - (3 * 60 * 60 * 1000))
  return saoPauloTime
}

// Função para processar uma vela
function processKline(kline, pair, timeframe) {
  const timestamp = new Date(kline[0])
  const saoPauloTime = toSaoPauloTime(timestamp)
  
  const open_price = parseFloat(kline[1])
  const close_price = parseFloat(kline[4])
  const color = close_price >= open_price ? 'GREEN' : 'RED'

  return {
    pair,
    timeframe,
    timestamp: saoPauloTime.toISOString(),
    open_price,
    close_price,
    color,
    hour: saoPauloTime.getHours(),
    minute: saoPauloTime.getMinutes(),
    day: saoPauloTime.getDate(),
    month: saoPauloTime.getMonth() + 1,
    year: saoPauloTime.getFullYear(),
    full_date: saoPauloTime.toISOString().split('T')[0],
    time_key: saoPauloTime.toTimeString().slice(0, 5),
    date_key: saoPauloTime.toISOString().split('T')[0]
  }
}

// Função para buscar dados históricos
async function getHistoricalData(pair, timeframe, startTime, endTime) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${timeframe}&startTime=${startTime}&endTime=${endTime}&limit=1000`
  
  console.log(` Buscando ${pair} ${timeframe} de ${new Date(startTime).toISOString()} até ${new Date(endTime).toISOString()}`)
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status}`)
  }
  
  const klines = await response.json()
  return klines.map(kline => processKline(kline, pair, timeframe))
}

// Função para salvar no Supabase
async function saveToSupabase(candles) {
  const { error } = await supabase
    .from('candle_data')
    .upsert(candles, { onConflict: 'pair,timeframe,timestamp' })
  
  if (error) {
    console.error(' Erro ao salvar:', error)
    throw error
  }
  
  console.log(` Salvos ${candles.length} candles`)
}

// Função auxiliar para calcular intervalos
function getIntervalMs(timeframe) {
  const intervals = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000
  }
  return intervals[timeframe] || 60 * 1000
}

// Função principal
async function collectSOLData() {
  console.log(' Iniciando coleta de dados históricos do SOLUSDT...')
  console.log(' Período: últimos 30 dias')
  console.log(' Par: SOLUSDT')
  console.log(' Timeframes: 1m, 5m, 15m')
  
  const endTime = Date.now()
  const startTime = endTime - (30 * 24 * 60 * 60 * 1000) // 30 dias atrás
  
  const PAIR = 'SOLUSDT'
  const TIMEFRAMES = ['1m', '5m', '15m']
  
  let totalCandles = 0
  
  for (const timeframe of TIMEFRAMES) {
    try {
      console.log(`\n Processando ${PAIR} ${timeframe}...`)
      
      // Calcular intervalos para dividir em lotes de 1000
      const intervalMs = getIntervalMs(timeframe)
      const batchSize = 1000 * intervalMs
      let currentStart = startTime
      
      while (currentStart < endTime) {
        const currentEnd = Math.min(currentStart + batchSize, endTime)
        
        const candles = await getHistoricalData(PAIR, timeframe, currentStart, currentEnd)
        
        if (candles.length > 0) {
          await saveToSupabase(candles)
          totalCandles += candles.length
        }
        
        currentStart = currentEnd
        
        // Delay para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      console.log(` ${PAIR} ${timeframe} concluído`)
      
    } catch (error) {
      console.error(` Erro em ${PAIR} ${timeframe}:`, error.message)
    }
  }
  
  console.log(`\n Coleta concluída! Total: ${totalCandles} candles do SOLUSDT`)
}

// Executar
collectSOLData().catch(console.error)
