// Teste para verificar se as estratégias estão funcionando
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://lgddsslskhzxtpjathjr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testStrategies() {
  try {
    console.log('🔍 Testando estratégias...')
    
    // Verificar estratégias
    const { data: strategies, error: strategiesError } = await supabase
      .from('probabilistic_strategies')
      .select('*')
      .limit(5)

    if (strategiesError) {
      console.error('❌ Erro ao carregar estratégias:', strategiesError)
      return
    }

    console.log(`✅ Estratégias encontradas: ${strategies?.length || 0}`)
    strategies?.forEach(strategy => {
      console.log(`  - ${strategy.name}: ${strategy.description}`)
    })

    // Verificar dados de tempo real
    const { data: realtimeData, error: realtimeError } = await supabase
      .from('realtime_candle_data')
      .select('*')
      .eq('pair', 'SOLUSDT')
      .eq('timeframe', '1m')
      .order('timestamp', { ascending: false })
      .limit(10)

    if (realtimeError) {
      console.error('❌ Erro ao carregar dados de tempo real:', realtimeError)
      return
    }

    console.log(`✅ Dados de tempo real: ${realtimeData?.length || 0} candles`)
    if (realtimeData && realtimeData.length > 0) {
      console.log(`  - Último candle: ${realtimeData[0].time_key} - ${realtimeData[0].color}`)
    }

    // Verificar ciclos
    const { data: cycles, error: cyclesError } = await supabase
      .from('accuracy_cycles')
      .select('*')
      .eq('pair', 'SOLUSDT')
      .eq('timeframe', '1m')
      .limit(5)

    if (cyclesError) {
      console.error('❌ Erro ao carregar ciclos:', cyclesError)
      return
    }

    console.log(`✅ Ciclos encontrados: ${cycles?.length || 0}`)
    cycles?.forEach(cycle => {
      console.log(`  - ${cycle.strategy_name}: ${cycle.accuracy_percentage}% (${cycle.total_signals} sinais)`)
    })

  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

testStrategies()
