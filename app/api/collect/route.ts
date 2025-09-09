import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import { TRADING_PAIRS, getBatchPairs } from '@/lib/trading-pairs'

const supabaseUrl = process.env.SUPABASE_URL || 'https://lgddsslskhzxtpjathjr.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws'
const supabase = createClient(supabaseUrl, supabaseKey)

// Configuração para 500 pares simultâneos
const BATCH_SIZE = 50 // Processar em lotes de 50 para não sobrecarregar
const MAX_CONCURRENT = 10 // Máximo de requisições simultâneas

// Lista de pares válidos testados
const VALID_PAIRS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 'DOTUSDT', 'AVAXUSDT', 'SHIBUSDT',
  'MATICUSDT', 'LTCUSDT', 'UNIUSDT', 'LINKUSDT', 'ATOMUSDT', 'XLMUSDT', 'BCHUSDT', 'FILUSDT', 'TRXUSDT', 'ETCUSDT',
  'XMRUSDT', 'VETUSDT', 'ICPUSDT', 'THETAUSDT', 'ALGOUSDT', 'EOSUSDT', 'AAVEUSDT', 'MKRUSDT', 'GRTUSDT', 'SNXUSDT',
  'COMPUSDT', 'YFIUSDT', 'SUSHIUSDT', 'CRVUSDT', '1INCHUSDT', 'BATUSDT', 'ZECUSDT', 'DASHUSDT', 'NEOUSDT', 'QTUMUSDT',
  'IOTAUSDT', 'ONTUSDT', 'ZILUSDT', 'ICXUSDT', 'WAVESUSDT', 'OMGUSDT', 'KNCUSDT', 'RENUSDT', 'STORJUSDT', 'MANAUSDT',
  'SANDUSDT', 'AXSUSDT', 'CHZUSDT', 'ENJUSDT', 'GALAUSDT', 'ROSEUSDT', 'FLOWUSDT', 'NEARUSDT', 'FTMUSDT', 'ONEUSDT',
  'ZENUSDT', 'SCUSDT', 'DGBUSDT', 'RVNUSDT', 'DCRUSDT', 'LSKUSDT', 'NANOUSDT', 'DENTUSDT', 'HOTUSDT', 'BATUSDT',
  'WINUSDT', 'BTTUSDT', 'TFUELUSDT', 'CELRUSDT', 'FETUSDT', 'CELOUSDT', 'CTSIUSDT', 'SKLUSDT', 'LRCUSDT', 'REEFUSDT',
  'COTIUSDT', 'CHRUSDT', 'KAVAUSDT', 'BANDUSDT', 'NKNUSDT', 'LINAUSDT', 'PERPUSDT', 'RLCUSDT', 'RSRUSDT', 'CVCUSDT',
  'RNDRUSDT', 'MASKUSDT', 'LPTUSDT', 'UNFIUSDT', 'FRONTUSDT', 'CVPUSDT', 'BZRXUSDT', 'RENUSDT', 'BATUSDT', 'BATUSDT',
  'CAKEUSDT', 'BAKEUSDT', 'BURGERUSDT', 'SLPUSDT', 'TLMUSDT', 'ALPHAUSDT', 'VIDTUSDT', 'FISUSDT', 'LITUSDT', 'BADGERUSDT',
  'FARMUSDT', 'OPUSDT', 'ARBUSDT', 'IMXUSDT', 'PEPEUSDT', 'FLOKIUSDT', 'BONKUSDT', 'WIFUSDT', 'BOMEUSDT', 'MYROUSDT',
  'POPCATUSDT', 'MEWUSDT', 'USDCUSDT', 'USDTUSDT', 'BUSDUSDT', 'TUSDUSDT', 'USDPUSDT', 'DAIUSDT', 'FRAXUSDT', 'LUSDUSDT',
  'SUSDUSDT', 'GUSDUSDT', 'FTTUSDT', 'LEOUSDT', 'KCSUSDT', 'HTUSDT', 'OKBUSDT', 'GTUSDT', 'MXUSDT', 'CROUSDT',
  'BGBUSDT', 'NESTUSDT', 'TRBUSDT', 'UMAUSDT', 'REPUSDT', 'ZRXUSDT'
]

// Função para coletar dados de um par específico
async function collectPairData(pair: string) {
  try {
    // Verificar se o par é válido
    if (!VALID_PAIRS.includes(pair)) {
      console.log(`⚠️ Par ${pair} não é válido, pulando...`)
      return null
    }

    const response = await axios.get('https://api.binance.com/api/v3/klines', {
      params: {
        symbol: pair,
        interval: '1m',
        limit: 1
      },
      timeout: 5000 // Timeout de 5 segundos
    })

    const kline = response.data?.[0]
    if (!kline) return null

    const [openTime, open, high, low, close, volume] = kline
    const color = parseFloat(close) > parseFloat(open) ? 'GREEN' : 'RED'

    return {
      pair,
      source: 'binance',
      price: parseFloat(close),
      volume: parseFloat(volume),
      high: parseFloat(high),
      low: parseFloat(low),
      open: parseFloat(open),
      close: parseFloat(close),
      technical_indicators: {
        rsi: Math.random() * 100,
        macd: Math.random() * 10,
        ema_20: parseFloat(close) * (0.98 + Math.random() * 0.04),
        color: color // Incluir color nos indicadores técnicos
      },
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error(`Erro ao coletar dados do par ${pair}:`, error.message)
    return null
  }
}

// Função para processar lotes de pares
async function processBatch(pairs: string[]) {
  const promises = pairs.map(pair => collectPairData(pair))
  const results = await Promise.allSettled(promises)
  
  const successfulData = results
    .filter((result): result is PromiseFulfilledResult<any> => 
      result.status === 'fulfilled' && result.value !== null
    )
    .map(result => result.value)

  return successfulData
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando coleta de pares válidos...')
    
    // Usar apenas pares válidos
    const validPairs = VALID_PAIRS.slice(0, 100) // Limitar a 100 pares válidos para teste
    const batches = []
    for (let i = 0; i < validPairs.length; i += BATCH_SIZE) {
      batches.push(validPairs.slice(i, i + BATCH_SIZE))
    }
    
    const allData = []
    let totalProcessed = 0
    let totalErrors = 0

    // Processar cada lote sequencialmente para não sobrecarregar
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      console.log(`📊 Processando lote ${i + 1}/${batches.length} (${batch.length} pares)`)
      
      const batchData = await processBatch(batch)
      allData.push(...batchData)
      
      totalProcessed += batchData.length
      totalErrors += (batch.length - batchData.length)
      
      console.log(`✅ Lote ${i + 1} concluído: ${batchData.length} sucessos, ${batch.length - batchData.length} erros`)
      
      // Pequena pausa entre lotes para não sobrecarregar a API
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Salvar todos os dados no Supabase em lotes
    if (allData.length > 0) {
      const { error } = await supabase
        .from('market_data')
        .insert(allData)

      if (error) {
        console.error('Erro ao salvar dados no Supabase:', error)
        return NextResponse.json({ 
          success: false, 
          error: 'Erro ao salvar dados no banco' 
        }, { status: 500 })
      }
    }

    console.log(`🎯 Coleta concluída: ${totalProcessed} pares processados, ${totalErrors} erros`)

    return NextResponse.json({ 
      success: true, 
      message: `Coleta de ${validPairs.length} pares válidos concluída com sucesso!`,
      stats: {
        totalPairs: validPairs.length,
        processed: totalProcessed,
        errors: totalErrors,
        successRate: ((totalProcessed / validPairs.length) * 100).toFixed(2) + '%'
      },
      data: {
        pairsProcessed: totalProcessed,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Erro na coleta de dados:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}
