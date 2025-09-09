// Script para coletar dados históricos de mais 2 meses
// Executa independente do projeto principal

const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = 'https://lgddsslskhzxtpjathjr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws'
const supabase = createClient(supabaseUrl, supabaseKey)

// Configuração da Binance API
const BINANCE_API = 'https://api.binance.com/api/v3'

// Interface para dados das velas
class CandleData {
  constructor(pair, timeframe, timestamp, open, close) {
    this.pair = pair
    this.timeframe = timeframe
    this.timestamp = timestamp
    this.open_price = parseFloat(open)
    this.close_price = parseFloat(close)
    this.color = this.open_price <= this.close_price ? 'GREEN' : 'RED'
    
    // Processar timestamp para componentes de data (horário do Brasil UTC-3)
    const date = new Date(timestamp)
    const brazilTime = new Date(date.getTime() - (3 * 60 * 60 * 1000))
    this.hour = brazilTime.getUTCHours()
    this.minute = brazilTime.getUTCMinutes()
    this.day = brazilTime.getUTCDate()
    this.month = brazilTime.getUTCMonth() + 1
    this.year = brazilTime.getUTCFullYear()
    this.full_date = brazilTime.toISOString().split('T')[0]
    this.time_key = `${this.hour.toString().padStart(2, '0')}:${this.minute.toString().padStart(2, '0')}`
    this.date_key = `${this.year}-${this.month.toString().padStart(2, '0')}-${this.day.toString().padStart(2, '0')}`
  }
}

// Função para buscar dados da Binance
async function fetchBinanceData(symbol, interval, startTime, endTime) {
  try {
    const url = `${BINANCE_API}/klines?symbol=${symbol}&interval=${interval}&startTime=${startTime}&endTime=${endTime}&limit=1000`
    console.log(`🌐 Buscando: ${symbol} ${interval} de ${new Date(startTime).toISOString().split('T')[0]} até ${new Date(endTime).toISOString().split('T')[0]}`)
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log(`📊 Recebidos ${data.length} candles`)
    return data
  } catch (error) {
    console.error('❌ Erro ao buscar dados da Binance:', error)
    return []
  }
}

// Função para processar e salvar dados
async function processAndSaveData(klines, pair, timeframe) {
  const candles = []
  
  for (const kline of klines) {
    try {
      const candle = new CandleData(
        pair,
        timeframe,
        kline[0], // openTime
        kline[1], // open
        kline[4]  // close
      )
      candles.push(candle)
    } catch (error) {
      console.error('❌ Erro ao processar candle:', error)
    }
  }
  
  if (candles.length > 0) {
    try {
      console.log(`💾 Salvando ${candles.length} candles no Supabase...`)
      const { error } = await supabase
        .from('historical_candle_data')
        .upsert(candles, { onConflict: 'pair,timeframe,timestamp' })
      
      if (error) {
        console.error('❌ Erro ao salvar no Supabase:', error)
      } else {
        console.log(`✅ Salvos ${candles.length} candles com sucesso!`)
      }
    } catch (error) {
      console.error('❌ Erro ao salvar no Supabase:', error)
    }
  }
  
  return candles.length
}

// Função principal para coletar dados históricos
async function collectHistoricalData() {
  console.log('🚀 Iniciando coleta de dados históricos...')
  
  const pair = 'SOLUSDT'
  const timeframes = ['1m', '5m', '15m']
  
  // Definir períodos para coleta (6 meses adicionais)
  const periods = [
    {
      name: 'Julho 2025',
      start: new Date('2025-07-01T00:00:00Z').getTime(),
      end: new Date('2025-07-31T23:59:59Z').getTime()
    },
    {
      name: 'Agosto 2025',
      start: new Date('2025-08-01T00:00:00Z').getTime(),
      end: new Date('2025-08-31T23:59:59Z').getTime()
    },
    {
      name: 'Setembro 2025',
      start: new Date('2025-09-01T00:00:00Z').getTime(),
      end: new Date('2025-09-30T23:59:59Z').getTime()
    },
    {
      name: 'Outubro 2025',
      start: new Date('2025-10-01T00:00:00Z').getTime(),
      end: new Date('2025-10-31T23:59:59Z').getTime()
    },
    {
      name: 'Novembro 2025',
      start: new Date('2025-11-01T00:00:00Z').getTime(),
      end: new Date('2025-11-30T23:59:59Z').getTime()
    },
    {
      name: 'Dezembro 2025',
      start: new Date('2025-12-01T00:00:00Z').getTime(),
      end: new Date('2025-12-31T23:59:59Z').getTime()
    }
  ]
  
  let totalCandles = 0
  
  for (const period of periods) {
    console.log(`\n📅 Coletando dados de ${period.name}...`)
    
    for (const timeframe of timeframes) {
      console.log(`\n⏰ Timeframe: ${timeframe}`)
      
      let currentStart = period.start
      const endTime = period.end
      
      while (currentStart < endTime) {
        // Calcular próximo período (máximo 1000 candles por request)
        let currentEnd = currentStart + (1000 * getIntervalMs(timeframe))
        if (currentEnd > endTime) {
          currentEnd = endTime
        }
        
        // Buscar dados da Binance
        const klines = await fetchBinanceData(pair, timeframe, currentStart, currentEnd)
        
        if (klines.length > 0) {
          // Processar e salvar
          const saved = await processAndSaveData(klines, pair, timeframe)
          totalCandles += saved
          
          // Aguardar um pouco para não sobrecarregar a API
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        // Próximo período
        currentStart = currentEnd + 1
      }
    }
  }
  
  console.log(`\n🎉 Coleta concluída! Total de ${totalCandles} candles coletados.`)
}

// Função para obter intervalo em milissegundos
function getIntervalMs(timeframe) {
  switch (timeframe) {
    case '1m': return 60000
    case '5m': return 300000
    case '15m': return 900000
    default: return 60000
  }
}

// Executar coleta
collectHistoricalData().catch(console.error)
