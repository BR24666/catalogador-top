import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lgddsslskhzxtpjathjr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws'
const supabase = createClient(supabaseUrl, supabaseKey)

// Função para converter timestamp para horário de São Paulo
function toSaoPauloTime(timestamp: number) {
  const date = new Date(timestamp)
  const saoPauloTime = new Date(date.getTime() - (3 * 60 * 60 * 1000))
  return saoPauloTime
}

// Função para processar uma vela
function processKline(kline: any[], pair: string, timeframe: string) {
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
async function getHistoricalData(pair: string, timeframe: string, startTime: number, endTime: number) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${timeframe}&startTime=${startTime}&endTime=${endTime}&limit=1000`
  
  console.log(` Buscando ${pair} ${timeframe} de ${new Date(startTime).toISOString()} até ${new Date(endTime).toISOString()}`)
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status}`)
  }
  
  const klines = await response.json()
  return klines.map((kline: any[]) => processKline(kline, pair, timeframe))
}

// Função para salvar no Supabase
async function saveToSupabase(candles: any[]) {
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
function getIntervalMs(timeframe: string) {
  const intervals: { [key: string]: number } = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000
  }
  return intervals[timeframe] || 60 * 1000
}

export async function POST(request: NextRequest) {
  try {
    console.log(' Iniciando coleta de dados históricos...')
    
    const endTime = Date.now()
    const startTime = endTime - (30 * 24 * 60 * 60 * 1000) // 30 dias atrás
    
    const PAIRS = ['BTCUSDT', 'XRPUSDT', 'SOLUSDT']
    const TIMEFRAMES = ['1m', '5m', '15m']
    
    let totalCandles = 0
    
    for (const pair of PAIRS) {
      for (const timeframe of TIMEFRAMES) {
        try {
          console.log(`\n Processando ${pair} ${timeframe}...`)
          
          // Calcular intervalos para dividir em lotes de 1000
          const intervalMs = getIntervalMs(timeframe)
          const batchSize = 1000 * intervalMs
          let currentStart = startTime
          
          while (currentStart < endTime) {
            const currentEnd = Math.min(currentStart + batchSize, endTime)
            
            const candles = await getHistoricalData(pair, timeframe, currentStart, currentEnd)
            
            if (candles.length > 0) {
              await saveToSupabase(candles)
              totalCandles += candles.length
            }
            
            currentStart = currentEnd
            
            // Delay para não sobrecarregar a API
            await new Promise(resolve => setTimeout(resolve, 100))
          }
          
          console.log(` ${pair} ${timeframe} concluído`)
          
        } catch (error) {
          console.error(` Erro em ${pair} ${timeframe}:`, error)
        }
      }
    }
    
    console.log(`\n Coleta concluída! Total: ${totalCandles} candles`)
    
    return NextResponse.json({ 
      success: true, 
      message: `Coleta concluída! Total: ${totalCandles} candles`,
      totalCandles 
    })
    
  } catch (error) {
    console.error(' Erro na coleta:', error)
    return NextResponse.json(
      { success: false, message: 'Erro na coleta de dados históricos' },
      { status: 500 }
    )
  }
}
