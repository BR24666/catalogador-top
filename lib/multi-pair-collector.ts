import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface CandleData {
  openTime: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  closeTime: number
  pair: string
}

export interface ProcessedCandle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  pair: string
  color: 'GREEN' | 'RED' | 'YELLOW'
}

// Lista de 100 pares de moedas para coleta (otimizado para performance)
const TRADING_PAIRS = [
  // Forex Major Pairs
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
  'EURGBP', 'EURJPY', 'EURCHF', 'EURAUD', 'EURCAD', 'EURNZD',
  'GBPJPY', 'GBPCHF', 'GBPAUD', 'GBPCAD', 'GBPNZD',
  'AUDJPY', 'AUDCHF', 'AUDCAD', 'AUDNZD',
  'CADJPY', 'CADCHF', 'CADNZD',
  'CHFJPY', 'CHFNZD',
  'NZDJPY', 'NZDCHF',
  
  // Crypto Major Pairs
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'SOLUSDT',
  'DOTUSDT', 'DOGEUSDT', 'AVAXUSDT', 'SHIBUSDT', 'MATICUSDT', 'LTCUSDT',
  'UNIUSDT', 'LINKUSDT', 'ATOMUSDT', 'XLMUSDT', 'BCHUSDT', 'FILUSDT',
  'TRXUSDT', 'ETCUSDT', 'XMRUSDT', 'EOSUSDT', 'AAVEUSDT', 'GRTUSDT',
  'SUSHIUSDT', 'COMPUSDT', 'YFIUSDT', 'SNXUSDT', 'UMAUSDT', 'BALUSDT',
  'CRVUSDT', '1INCHUSDT', 'ALPHAUSDT', 'ZRXUSDT', 'BATUSDT', 'ZECUSDT',
  'DASHUSDT', 'NEOUSDT', 'VETUSDT', 'ICXUSDT', 'ONTUSDT', 'IOTAUSDT',
  'QTUMUSDT', 'NANOUSDT', 'DGBUSDT', 'SCUSDT', 'ZILUSDT', 'BTTUSDT',
  'WINUSDT', 'CHZUSDT', 'HOTUSDT', 'DENTUSDT', 'NPXSUSDT',
  'IOSTUSDT', 'CVCUSDT', 'DATAUSDT', 'MANAUSDT', 'GNTUSDT', 'REPUSDT',
  'KNCUSDT', 'LRCUSDT', 'OMGUSDT', 'STORJUSDT', 'PAXUSDT', 'TUSDUSDT',
  'USDCUSDT', 'BUSDUSDT', 'USDPUSDT', 'TUSDTUSDT', 'USDSUSDT', 'USDTUSDT',
  
  // Adicionar mais pares para chegar a 100
  'FTMUSDT', 'NEARUSDT', 'ALGOUSDT', 'ICPUSDT', 'VETUSDT', 'THETAUSDT',
  'FLOWUSDT', 'HBARUSDT', 'EGLDUSDT', 'XTZUSDT', 'CAKEUSDT', 'RUNEUSDT',
  'KAVAUSDT', 'BANDUSDT', 'NKNUSDT', 'RENUSDT', 'RVNUSDT', 'DCRUSDT',
  'ZENUSDT', 'LSKUSDT', 'NULSUSDT', 'WAVESUSDT', 'ICXUSDT', 'ONTUSDT',
  'IOTAUSDT', 'QTUMUSDT', 'NANOUSDT', 'DGBUSDT', 'SCUSDT', 'ZILUSDT',
  'BTTUSDT', 'WINUSDT', 'CHZUSDT', 'HOTUSDT', 'DENTUSDT', 'NPXSUSDT',
  'IOSTUSDT', 'CVCUSDT', 'DATAUSDT', 'MANAUSDT', 'GNTUSDT', 'REPUSDT'
]

// Função para coletar dados de um par específico
export async function fetchPairData(pair: string, limit: number = 1000): Promise<ProcessedCandle[]> {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=1m&limit=${limit}`)
    const data = await response.json()
    
    if (!Array.isArray(data)) {
      throw new Error(`Dados inválidos para ${pair}`)
    }
    
    return data.map((candle: any[]) => ({
      timestamp: parseInt(candle[0]),
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5]),
      pair: pair,
      color: parseFloat(candle[4]) > parseFloat(candle[1]) ? 'GREEN' : 'RED'
    }))
  } catch (error) {
    console.error(`Erro ao coletar dados de ${pair}:`, error)
    return []
  }
}

// Função para coletar dados de múltiplos pares
export async function fetchMultiplePairsData(pairs: string[], limit: number = 1000): Promise<ProcessedCandle[]> {
  console.log(`🔄 Coletando dados de ${pairs.length} pares...`)
  
  const allCandles: ProcessedCandle[] = []
  
  // Processar em lotes para não sobrecarregar a API
  const batchSize = 10
  for (let i = 0; i < pairs.length; i += batchSize) {
    const batch = pairs.slice(i, i + batchSize)
    
    const promises = batch.map(pair => fetchPairData(pair, limit))
    const results = await Promise.all(promises)
    
    results.forEach(candles => {
      allCandles.push(...candles)
    })
    
    console.log(`✅ Lote ${Math.floor(i/batchSize) + 1} processado - ${allCandles.length} velas coletadas`)
    
    // Pausa entre lotes para respeitar rate limits
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  return allCandles
}

// Função para salvar dados no Supabase
export async function saveMultiPairData(candles: ProcessedCandle[]): Promise<void> {
  console.log(`💾 Salvando ${candles.length} velas no banco...`)
  
  const batchSize = 1000
  for (let i = 0; i < candles.length; i += batchSize) {
    const batch = candles.slice(i, i + batchSize)
    
    const { error } = await supabase
      .from('multi_pair_candles')
      .insert(batch)
    
    if (error) {
      console.error(`Erro ao salvar lote ${Math.floor(i/batchSize) + 1}:`, error)
    } else {
      console.log(`✅ Lote ${Math.floor(i/batchSize) + 1} salvo (${batch.length} velas)`)
    }
  }
}

// Função para coletar e salvar dados de todos os pares
export async function collectAllPairsData(): Promise<void> {
  try {
    console.log('🚀 Iniciando coleta de dados de múltiplos pares...')
    
    // Coletar dados de todos os pares
    const allCandles = await fetchMultiplePairsData(TRADING_PAIRS, 1000)
    
    if (allCandles.length === 0) {
      throw new Error('Nenhum dado coletado')
    }
    
    // Salvar no banco
    await saveMultiPairData(allCandles)
    
    console.log(`✅ Coleta concluída! ${allCandles.length} velas de ${TRADING_PAIRS.length} pares`)
    
  } catch (error) {
    console.error('Erro na coleta de dados:', error)
    throw error
  }
}
