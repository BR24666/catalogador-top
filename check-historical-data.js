// Script para verificar e coletar dados históricos se necessário
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://lgddsslskhzxtpjathjr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkHistoricalData() {
  try {
    console.log('🔍 Verificando dados históricos...')
    
    // Verificar dados históricos
    const { data: historicalData, error: historicalError } = await supabase
      .from('historical_candle_data')
      .select('count', { count: 'exact' })
      .eq('pair', 'SOLUSDT')
      .eq('timeframe', '1m')

    if (historicalError) {
      console.error('❌ Erro ao verificar dados históricos:', historicalError)
      return
    }

    console.log(`📊 Dados históricos encontrados: ${historicalData?.length || 0} registros`)
    
    // Verificar dados de tempo real
    const { data: realtimeData, error: realtimeError } = await supabase
      .from('realtime_candle_data')
      .select('count', { count: 'exact' })
      .eq('pair', 'SOLUSDT')
      .eq('timeframe', '1m')

    if (realtimeError) {
      console.error('❌ Erro ao verificar dados de tempo real:', realtimeError)
      return
    }

    console.log(`📈 Dados de tempo real encontrados: ${realtimeData?.length || 0} registros`)
    
    // Verificar se há dados suficientes (pelo menos 1 mês = ~43,200 candles)
    const totalHistorical = historicalData?.length || 0
    const totalRealtime = realtimeData?.length || 0
    const totalData = totalHistorical + totalRealtime
    
    console.log(`📊 Total de dados: ${totalData} candles`)
    
    if (totalData < 43200) {
      console.log('⚠️ Dados insuficientes! Coletando mais dados históricos...')
      await collectMoreHistoricalData()
    } else {
      console.log('✅ Dados suficientes para análise!')
    }
    
    // Verificar distribuição por data
    const { data: dateDistribution, error: dateError } = await supabase
      .from('historical_candle_data')
      .select('full_date')
      .eq('pair', 'SOLUSDT')
      .eq('timeframe', '1m')
      .order('full_date', { ascending: false })
      .limit(10)

    if (!dateError && dateDistribution) {
      console.log('📅 Últimas datas com dados:')
      dateDistribution.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.full_date}`)
      })
    }

  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error)
  }
}

async function collectMoreHistoricalData() {
  try {
    console.log('🚀 Iniciando coleta de dados históricos...')
    
    const BINANCE_API = 'https://api.binance.com/api/v3'
    const pairs = ['SOLUSDT']
    const timeframes = ['1m']
    
    // Coletar últimos 3 meses
    const endTime = new Date()
    const startTime = new Date()
    startTime.setMonth(startTime.getMonth() - 3)
    
    for (const pair of pairs) {
      for (const timeframe of timeframes) {
        console.log(`📊 Coletando ${pair} - ${timeframe}...`)
        
        let currentStart = new Date(startTime)
        let batchCount = 0
        
        while (currentStart < endTime) {
          const currentEnd = new Date(currentStart)
          currentEnd.setDate(currentEnd.getDate() + 7) // Coletar 1 semana por vez
          
          if (currentEnd > endTime) {
            currentEnd.setTime(endTime.getTime())
          }
          
          try {
            const response = await fetch(
              `${BINANCE_API}/klines?symbol=${pair}&interval=${timeframe}&startTime=${currentStart.getTime()}&endTime=${currentEnd.getTime()}&limit=1000`
            )
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`)
            }
            
            const data = await response.json()
            
            if (data && data.length > 0) {
              const candles = data.map(candle => {
                // Converter para horário do Brasil (UTC-3)
                const date = new Date(candle[0])
                const brazilTime = new Date(date.getTime() - (3 * 60 * 60 * 1000))
                
                return {
                  pair: pair,
                  timeframe: timeframe,
                  timestamp: date.toISOString(),
                  open_price: parseFloat(candle[1]),
                  close_price: parseFloat(candle[4]),
                  color: parseFloat(candle[4]) > parseFloat(candle[1]) ? 'GREEN' : 'RED',
                  hour: brazilTime.getUTCHours(),
                  minute: brazilTime.getUTCMinutes(),
                  day: brazilTime.getUTCDate(),
                  month: brazilTime.getUTCMonth() + 1,
                  year: brazilTime.getUTCFullYear(),
                  full_date: brazilTime.toISOString().split('T')[0],
                  time_key: `${brazilTime.getUTCHours().toString().padStart(2, '0')}:${brazilTime.getUTCMinutes().toString().padStart(2, '0')}`,
                  date_key: `${brazilTime.getUTCFullYear()}-${(brazilTime.getUTCMonth() + 1).toString().padStart(2, '0')}-${brazilTime.getUTCDate().toString().padStart(2, '0')}`
                }
              })
              
              // Inserir no Supabase
              const { error: insertError } = await supabase
                .from('historical_candle_data')
                .upsert(candles, {
                  onConflict: 'pair,timeframe,timestamp'
                })
              
              if (insertError) {
                console.error(`❌ Erro ao inserir batch ${batchCount}:`, insertError)
              } else {
                console.log(`✅ Batch ${batchCount + 1}: ${candles.length} candles inseridos`)
              }
              
              batchCount++
              
              // Pausa para não sobrecarregar a API
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
            
            currentStart = new Date(currentEnd)
            
          } catch (error) {
            console.error(`❌ Erro no batch ${batchCount}:`, error.message)
            currentStart = new Date(currentEnd)
          }
        }
        
        console.log(`✅ Coleta concluída para ${pair} - ${timeframe}`)
      }
    }
    
    console.log('🎉 Coleta de dados históricos concluída!')
    
  } catch (error) {
    console.error('❌ Erro na coleta:', error)
  }
}

// Executar verificação
checkHistoricalData()
