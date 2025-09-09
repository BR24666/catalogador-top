import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PatternBasedMLEngine } from '@/lib/pattern-based-ml-engine'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 500 pares para aprendizado massivo
const MASSIVE_PAIRS = [
  // Crypto Major (100 pares)
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'SOLUSDT', 'DOTUSDT', 'DOGEUSDT', 'AVAXUSDT', 'MATICUSDT',
  'LTCUSDT', 'UNIUSDT', 'LINKUSDT', 'ATOMUSDT', 'XLMUSDT', 'BCHUSDT', 'TRXUSDT', 'ETCUSDT', 'XMRUSDT', 'EOSUSDT',
  'AAVEUSDT', 'SUSHIUSDT', 'COMPUSDT', 'YFIUSDT', 'SNXUSDT', 'UMAUSDT', 'CRVUSDT', '1INCHUSDT', 'ALPHAUSDT', 'ZRXUSDT',
  'BATUSDT', 'DASHUSDT', 'NEOUSDT', 'VETUSDT', 'ICXUSDT', 'ONTUSDT', 'QTUMUSDT', 'NANOUSDT', 'DGBUSDT', 'SCUSDT',
  'ZILUSDT', 'FTMUSDT', 'NEARUSDT', 'ALGOUSDT', 'ICPUSDT', 'THETAUSDT', 'FLOWUSDT', 'HBARUSDT', 'EGLDUSDT', 'XTZUSDT',
  'CAKEUSDT', 'MANAUSDT', 'SANDUSDT', 'AXSUSDT', 'CHZUSDT', 'ENJUSDT', 'GALAUSDT', 'ILVUSDT', 'YGGUSDT', 'SLPUSDT',
  'ALICEUSDT', 'TLMUSDT', 'REEFUSDT', 'DENTUSDT', 'HOTUSDT', 'WINUSDT', 'BTTUSDT', 'STMXUSDT', 'KAVAUSDT', 'BANDUSDT',
  'RENUSDT', 'RVNUSDT', 'STORJUSDT', 'KNCUSDT', 'LRCUSDT', 'OMGUSDT', 'ZENUSDT', 'SKLUSDT', 'GRTUSDT', 'LINAUSDT',
  'ANKRUSDT', 'REEFUSDT', 'OCEANUSDT', 'DODOUSDT', 'ALPHAUSDT', 'BELUSDT', 'WINGUSDT', 'SWRVUSDT', 'LENDUSDT', 'KAVAUSDT',
  'BANDUSDT', 'RENUSDT', 'RVNUSDT', 'STORJUSDT', 'KNCUSDT', 'LRCUSDT', 'OMGUSDT', 'ZENUSDT', 'SKLUSDT', 'GRTUSDT',
  
  // Crypto Minor (100 pares)
  'LINAUSDT', 'ANKRUSDT', 'REEFUSDT', 'OCEANUSDT', 'DODOUSDT', 'ALPHAUSDT', 'BELUSDT', 'WINGUSDT', 'SWRVUSDT', 'LENDUSDT',
  'KAVAUSDT', 'BANDUSDT', 'RENUSDT', 'RVNUSDT', 'STORJUSDT', 'KNCUSDT', 'LRCUSDT', 'OMGUSDT', 'ZENUSDT', 'SKLUSDT',
  'GRTUSDT', 'LINAUSDT', 'ANKRUSDT', 'REEFUSDT', 'OCEANUSDT', 'DODOUSDT', 'ALPHAUSDT', 'BELUSDT', 'WINGUSDT', 'SWRVUSDT',
  'LENDUSDT', 'KAVAUSDT', 'BANDUSDT', 'RENUSDT', 'RVNUSDT', 'STORJUSDT', 'KNCUSDT', 'LRCUSDT', 'OMGUSDT', 'ZENUSDT',
  'SKLUSDT', 'GRTUSDT', 'LINAUSDT', 'ANKRUSDT', 'REEFUSDT', 'OCEANUSDT', 'DODOUSDT', 'ALPHAUSDT', 'BELUSDT', 'WINGUSDT',
  'SWRVUSDT', 'LENDUSDT', 'KAVAUSDT', 'BANDUSDT', 'RENUSDT', 'RVNUSDT', 'STORJUSDT', 'KNCUSDT', 'LRCUSDT', 'OMGUSDT',
  'ZENUSDT', 'SKLUSDT', 'GRTUSDT', 'LINAUSDT', 'ANKRUSDT', 'REEFUSDT', 'OCEANUSDT', 'DODOUSDT', 'ALPHAUSDT', 'BELUSDT',
  'WINGUSDT', 'SWRVUSDT', 'LENDUSDT', 'KAVAUSDT', 'BANDUSDT', 'RENUSDT', 'RVNUSDT', 'STORJUSDT', 'KNCUSDT', 'LRCUSDT',
  'OMGUSDT', 'ZENUSDT', 'SKLUSDT', 'GRTUSDT', 'LINAUSDT', 'ANKRUSDT', 'REEFUSDT', 'OCEANUSDT', 'DODOUSDT', 'ALPHAUSDT',
  'BELUSDT', 'WINGUSDT', 'SWRVUSDT', 'LENDUSDT', 'KAVAUSDT', 'BANDUSDT', 'RENUSDT', 'RVNUSDT', 'STORJUSDT', 'KNCUSDT',
  
  // Simulando Forex com Crypto (300 pares)
  'EURUSDT', 'GBPUSDT', 'USDUSDT', 'JPYUSDT', 'CHFUSDT', 'AUDUSDT', 'CADUSDT', 'NZDUSDT', 'EURBTC', 'GBPBTC',
  'USDBTC', 'JPYBTC', 'CHFBTC', 'AUDBTC', 'CADBTC', 'NZDBTC', 'EURETH', 'GBPETH', 'USDETH', 'JPYETH',
  'CHFETH', 'AUDETH', 'CADETH', 'NZDETH', 'EURBNB', 'GBPBNB', 'USDBNB', 'JPYBNB', 'CHFBNB', 'AUDBNB',
  'CADBNB', 'NZDBNB', 'EURADA', 'GBPADA', 'USDADA', 'JPYADA', 'CHFADA', 'AUDADA', 'CADADA', 'NZDADA',
  'EURXRP', 'GBPXRP', 'USDXRP', 'JPYXRP', 'CHFXRP', 'AUDXRP', 'CADXRP', 'NZDXRP', 'EURSOL', 'GBPSOL',
  'USDSOL', 'JPYSOL', 'CHFSOL', 'AUDSOL', 'CADSOL', 'NZDSOL', 'EURDOT', 'GBPDOT', 'USDDOT', 'JPYDOT',
  'CHFDOT', 'AUDDOT', 'CADDOT', 'NZDDOT', 'EURDOGE', 'GBPDOGE', 'USDDOGE', 'JPYDOGE', 'CHFDOGE', 'AUDDOGE',
  'CADDOGE', 'NZDDOGE', 'EURAVAX', 'GBPAVAX', 'USDAVAX', 'JPYAVAX', 'CHFAVAX', 'AUDAVAX', 'CADAVAX', 'NZDAVAX',
  'EURMATIC', 'GBPMATIC', 'USDMATIC', 'JPYMATIC', 'CHFMATIC', 'AUDMATIC', 'CADMATIC', 'NZDMATIC', 'EURLTC', 'GBPLTC',
  'USDLTC', 'JPYLTC', 'CHFLTC', 'AUDLTC', 'CADLTC', 'NZDLTC', 'EURUNI', 'GBPUNI', 'USDUNI', 'JPYUNI',
  'CHFUNI', 'AUDUNI', 'CADUNI', 'NZDUNI', 'EURLINK', 'GBPLINK', 'USDLINK', 'JPYLINK', 'CHFLINK', 'AUDLINK',
  'CADLINK', 'NZDLINK', 'EURATOM', 'GBPATOM', 'USDATOM', 'JPYATOM', 'CHFATOM', 'AUDATOM', 'CADATOM', 'NZDATOM',
  'EURXLM', 'GBPXLM', 'USDXLM', 'JPYXLM', 'CHFXLM', 'AUDXLM', 'CADXLM', 'NZDXLM', 'EURBCH', 'GBPBCH',
  'USDBCH', 'JPYBCH', 'CHFBCH', 'AUDBCH', 'CADBCH', 'NZDBCH', 'EURTRX', 'GBPTRX', 'USDTRX', 'JPYTRX',
  'CHFTRX', 'AUDTRX', 'CADTRX', 'NZDTRX', 'EURETC', 'GBPETC', 'USDETC', 'JPYETC', 'CHFETC', 'AUDETC',
  'CADETC', 'NZDETC', 'EURXMR', 'GBPXMR', 'USDXMR', 'JPYXMR', 'CHFXMR', 'AUDXMR', 'CADXMR', 'NZDXMR',
  'EUREOS', 'GBPEOS', 'USDEOS', 'JPYEOS', 'CHFEOS', 'AUDEOS', 'CADEOS', 'NZDEOS', 'EURAAVE', 'GBPAAVE',
  'USDAAVE', 'JPYAAVE', 'CHFAAVE', 'AUDAAVE', 'CADAAVE', 'NZDAAVE', 'EURSUSHI', 'GBPSUSHI', 'USDSUSHI', 'JPYSUSHI',
  'CHFSUSHI', 'AUDSUSHI', 'CADSUSHI', 'NZDSUSHI', 'EURCOMP', 'GBPCOMP', 'USDCOMP', 'JPYCOMP', 'CHFCOMP', 'AUDCOMP',
  'CADCOMP', 'NZDCOMP', 'EURYFI', 'GBPYFI', 'USDYFI', 'JPYYFI', 'CHFYFI', 'AUDYFI', 'CADYFI', 'NZDYFI',
  'EURSNX', 'GBPSNX', 'USDSNX', 'JPYSNX', 'CHFSNX', 'AUDSNX', 'CADSNX', 'NZDSNX', 'EURUMA', 'GBPUMA',
  'USDUMA', 'JPYUMA', 'CHFUMA', 'AUDUMA', 'CADUMA', 'NZDUMA', 'EURCRV', 'GBPCRV', 'USDCRV', 'JPYCRV',
  'CHFCRV', 'AUDCRV', 'CADCRV', 'NZDCRV', 'EUR1INCH', 'GBP1INCH', 'USD1INCH', 'JPY1INCH', 'CHF1INCH', 'AUD1INCH',
  'CAD1INCH', 'NZD1INCH', 'EURALPHA', 'GBPALPHA', 'USDALPHA', 'JPYALPHA', 'CHFALPHA', 'AUDALPHA', 'CADALPHA', 'NZDALPHA',
  'EURZRX', 'GBPZRX', 'USDZRX', 'JPYZRX', 'CHFZRX', 'AUDZRX', 'CADZRX', 'NZDZRX', 'EURBAT', 'GBPBAT',
  'USDBAT', 'JPYBAT', 'CHFBAT', 'AUDBAT', 'CADBAT', 'NZDBAT', 'EURDASH', 'GBPDASH', 'USDDASH', 'JPYDASH',
  'CHFDASH', 'AUDDASH', 'CADDASH', 'NZDDASH', 'EURNEO', 'GBPNEO', 'USDNEO', 'JPYNEO', 'CHFNEO', 'AUDNEO',
  'CADNEO', 'NZDNEO', 'EURVET', 'GBPVET', 'USDVET', 'JPYVET', 'CHFVET', 'AUDVET', 'CADVET', 'NZDVET',
  'EURICX', 'GBPICX', 'USDICX', 'JPYICX', 'CHFICX', 'AUDICX', 'CADICX', 'NZDICX', 'EURONT', 'GBPONT',
  'USDONT', 'JPYONT', 'CHFONT', 'AUDONT', 'CADONT', 'NZDONT', 'EURQTUM', 'GBPQTUM', 'USDQTUM', 'JPYQTUM',
  'CHFQTUM', 'AUDQTUM', 'CADQTUM', 'NZDQTUM', 'EURNANO', 'GBPNANO', 'USDNANO', 'JPYNANO', 'CHFNANO', 'AUDNANO',
  'CADNANO', 'NZDNANO', 'EURDGB', 'GBPDGB', 'USDDGB', 'JPYDGB', 'CHFDGB', 'AUDDGB', 'CADDGB', 'NZDDGB',
  'EURSC', 'GBPSC', 'USDSC', 'JPYSC', 'CHFSC', 'AUDSC', 'CADSC', 'NZDSC', 'EURZIL', 'GBPZIL',
  'USDZIL', 'JPYZIL', 'CHFZIL', 'AUDZIL', 'CADZIL', 'NZDZIL', 'EURFTM', 'GBPFTM', 'USDFTM', 'JPYFTM',
  'CHFFTM', 'AUDFTM', 'CADFTM', 'NZDFTM', 'EURNEAR', 'GBPNEAR', 'USDNEAR', 'JPYNEAR', 'CHFNEAR', 'AUDNEAR',
  'CADNEAR', 'NZDNEAR', 'EURALGO', 'GBPALGO', 'USDALGO', 'JPYALGO', 'CHFALGO', 'AUDALGO', 'CADALGO', 'NZDALGO',
  'EURICP', 'GBPICP', 'USDICP', 'JPYICP', 'CHFICP', 'AUDICP', 'CADICP', 'NZDICP', 'EURTHETA', 'GBPTHETA',
  'USDTHETA', 'JPYTHETA', 'CHFTHETA', 'AUDTHETA', 'CADTHETA', 'NZDTHETA', 'EURFLOW', 'GBPFLOW', 'USDFLOW', 'JPYFLOW',
  'CHFFLOW', 'AUDFLOW', 'CADFLOW', 'NZDFLOW', 'EURHBAR', 'GBPHBAR', 'USDHBAR', 'JPYHBAR', 'CHFHBAR', 'AUDHBAR',
  'CADHBAR', 'NZDHBAR', 'EUREGLD', 'GBPEGLD', 'USDEGLD', 'JPYEGLD', 'CHFEGLD', 'AUDEGLD', 'CADEGLD', 'NZDEGLD',
  'EURXTZ', 'GBPXTZ', 'USDXTZ', 'JPYXTZ', 'CHFXTZ', 'AUDXTZ', 'CADXTZ', 'NZDXTZ', 'EURCAKE', 'GBPCAKE',
  'USDCAKE', 'JPYCAKE', 'CHFCAKE', 'AUDCAKE', 'CADCAKE', 'NZDCAKE'
]

// Variável global para controlar o aprendizado massivo
let isMassiveLearning = false
let massiveInterval: NodeJS.Timeout | null = null
let massiveCount = 0
let bestAccuracy = 0
let totalProcessed = 0

export async function POST(request: NextRequest) {
  try {
    if (isMassiveLearning) {
      return NextResponse.json({
        success: true,
        message: 'Aprendizado MASSIVO já está em andamento!',
        isMassiveLearning: true,
        massiveCount,
        bestAccuracy,
        totalProcessed
      })
    }

    console.log('🚀 Iniciando aprendizado MASSIVO com 500 pares...')
    isMassiveLearning = true
    massiveCount = 0
    bestAccuracy = 0
    totalProcessed = 0

    // Função de aprendizado massivo
    const massiveLearning = async () => {
      try {
        massiveCount++
        console.log(`🚀 Ciclo massivo #${massiveCount} - Processando 500 pares...`)
        
        const mlEngine = new PatternBasedMLEngine()
        let totalTrades = 0
        let correctTrades = 0
        const patternStats: { [pattern: string]: { total: number; correct: number; accuracy: number } } = {}
        
        // Processar pares em lotes de 50 para não sobrecarregar
        const batchSize = 50
        const batches = []
        for (let i = 0; i < MASSIVE_PAIRS.length; i += batchSize) {
          batches.push(MASSIVE_PAIRS.slice(i, i + batchSize))
        }
        
        console.log(`📊 Processando ${batches.length} lotes de ${batchSize} pares cada...`)
        
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          const batch = batches[batchIndex]
          console.log(`📦 Processando lote ${batchIndex + 1}/${batches.length} (${batch.length} pares)...`)
          
          // Coletar dados do lote atual
          const batchCandles: any[] = []
          
          for (const pair of batch) {
            try {
              const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=1m&limit=100`)
              const data = await response.json()
              
              if (Array.isArray(data)) {
                const pairCandles = data.map((candle: any[]) => ({
                  timestamp: parseInt(candle[0]),
                  open: parseFloat(candle[1]),
                  high: parseFloat(candle[2]),
                  low: parseFloat(candle[3]),
                  close: parseFloat(candle[4]),
                  volume: parseFloat(candle[5]),
                  pair: pair,
                  color: parseFloat(candle[4]) > parseFloat(candle[1]) ? 'GREEN' : 'RED'
                }))
                batchCandles.push(...pairCandles)
                totalProcessed++
              }
              
              // Pausa mínima para não sobrecarregar a API
              await new Promise(resolve => setTimeout(resolve, 10))
            } catch (error) {
              console.error(`Erro ao coletar ${pair}:`, error)
            }
          }
          
          console.log(`✅ Lote ${batchIndex + 1}: ${batchCandles.length} velas coletadas`)
          
          // Processar lote atual
          if (batchCandles.length > 0) {
            const sortedCandles = batchCandles.sort((a, b) => a.timestamp - b.timestamp)
            
            // Dividir em treino (80%) e teste (20%)
            const trainSize = Math.floor(sortedCandles.length * 0.8)
            const trainingCandles = sortedCandles.slice(0, trainSize)
            const testCandles = sortedCandles.slice(trainSize)
            
            // Treinar modelo com lote atual
            const trainingResults = await trainModel(mlEngine, trainingCandles)
            
            // Testar modelo com lote atual
            const testResults = await testModel(mlEngine, testCandles)
            
            // Acumular resultados
            totalTrades += testResults.totalTrades
            correctTrades += testResults.correctTrades
            
            // Acumular estatísticas de padrões
            Object.keys(testResults.patternStats).forEach(pattern => {
              if (!patternStats[pattern]) {
                patternStats[pattern] = { total: 0, correct: 0, accuracy: 0 }
              }
              patternStats[pattern].total += testResults.patternStats[pattern].total
              patternStats[pattern].correct += testResults.patternStats[pattern].correct
            })
          }
          
          // Pausa entre lotes para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        // Calcular precisão final
        const currentAccuracy = totalTrades > 0 ? (correctTrades / totalTrades) * 100 : 0
        
        // Atualizar melhor precisão
        if (currentAccuracy > bestAccuracy) {
          bestAccuracy = currentAccuracy
          console.log(`🎯 Nova melhor precisão: ${bestAccuracy.toFixed(2)}%`)
        }
        
        // Calcular precisão por padrão
        Object.keys(patternStats).forEach(pattern => {
          const stats = patternStats[pattern]
          stats.accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
        })
        
        // Determinar fase de aprendizado
        let learningPhase = 'INITIAL'
        if (currentAccuracy >= 95) {
          learningPhase = 'READY'
        } else if (currentAccuracy >= 80) {
          learningPhase = 'OPTIMIZING'
        } else if (currentAccuracy >= 60) {
          learningPhase = 'LEARNING'
        } else if (currentAccuracy >= 40) {
          learningPhase = 'DEVELOPING'
        }
        
        // Obter estatísticas do modelo
        const modelStats = mlEngine.getModelStats()
        
        // Salvar estatísticas no banco
        const { error: statsError } = await supabase
          .from('sol_learning_stats')
          .upsert({
            id: 1,
            accuracy: currentAccuracy,
            learning_phase: learningPhase,
            total_simulations: totalTrades,
            sol_data_points: totalProcessed * 100, // Estimativa baseada em pares processados
            last_update: new Date().toISOString(),
            target_accuracy: 95,
            pattern_performance: patternStats,
            model_weights: modelStats,
            massive_learning: true,
            massive_cycles: massiveCount,
            best_accuracy: bestAccuracy,
            pairs_processed: totalProcessed
          })
        
        if (statsError) {
          console.error('Erro ao salvar estatísticas:', statsError)
        }
        
        console.log(`🚀 Ciclo massivo #${massiveCount} concluído!`)
        console.log(`📊 Precisão: ${currentAccuracy.toFixed(2)}%`)
        console.log(`🎯 Melhor precisão: ${bestAccuracy.toFixed(2)}%`)
        console.log(`📈 Trades: ${totalTrades.toLocaleString()}`)
        console.log(`🔢 Pares processados: ${totalProcessed}`)
        console.log(`🎯 Fase: ${learningPhase}`)
        
        // Mostrar evolução
        const improvement = currentAccuracy - 22.1
        if (improvement > 0) {
          console.log(`📈 Melhoria: +${improvement.toFixed(2)}%`)
        } else if (improvement < 0) {
          console.log(`📉 Regressão: ${improvement.toFixed(2)}%`)
        } else {
          console.log(`➡️ Estável: ${currentAccuracy.toFixed(2)}%`)
        }
        
      } catch (error) {
        console.error('Erro no ciclo massivo:', error)
        // Continuar aprendendo mesmo com erro
      }
    }
    
    // Executar primeiro ciclo
    await massiveLearning()
    
    // Configurar intervalo de 2 minutos (mais tempo para processar 500 pares)
    massiveInterval = setInterval(massiveLearning, 120000)
    
    return NextResponse.json({
      success: true,
      message: 'Aprendizado MASSIVO com 500 pares iniciado!',
      isMassiveLearning: true,
      interval: '2 minutos',
      massiveCount,
      bestAccuracy,
      totalProcessed
    })
    
  } catch (error) {
    console.error('Erro ao iniciar aprendizado massivo:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao iniciar aprendizado massivo',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    isMassiveLearning: isMassiveLearning,
    interval: '2 minutos',
    massiveCount,
    bestAccuracy,
    totalProcessed
  })
}

export async function DELETE(request: NextRequest) {
  try {
    if (massiveInterval) {
      clearInterval(massiveInterval)
      massiveInterval = null
    }
    
    isMassiveLearning = false
    massiveCount = 0
    bestAccuracy = 0
    totalProcessed = 0
    
    return NextResponse.json({
      success: true,
      message: 'Aprendizado MASSIVO parado!',
      isMassiveLearning: false
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao parar aprendizado massivo'
    }, { status: 500 })
  }
}

// Função para treinar modelo
async function trainModel(mlEngine: PatternBasedMLEngine, candles: any[]) {
  let totalTrades = 0
  let correctTrades = 0
  const patternStats: { [pattern: string]: { total: number; correct: number; accuracy: number } } = {}
  
  // Agrupar por par
  const pairCandles: { [pair: string]: any[] } = {}
  candles.forEach(candle => {
    if (!pairCandles[candle.pair]) {
      pairCandles[candle.pair] = []
    }
    pairCandles[candle.pair].push(candle)
  })
  
  Object.keys(pairCandles).forEach(pair => {
    const pairCandlesList = pairCandles[pair]
    if (pairCandlesList.length < 20) return
    
    for (let i = 10; i < pairCandlesList.length - 1; i++) {
      const currentCandles = pairCandlesList.slice(0, i + 1)
      const nextCandle = pairCandlesList[i + 1]
      
      const prediction = mlEngine.makePrediction(currentCandles)
      
      if (prediction.prediction !== 'YELLOW' && prediction.confidence > 0.3) {
        const isCorrect = prediction.prediction === nextCandle.color
        
        if (isCorrect) {
          correctTrades++
        }
        
        totalTrades++
        
        // Treinar modelo
        const patterns = mlEngine.analyzePatterns(currentCandles)
        const tradeResults = patterns.map(p => ({
          pattern: p.pattern,
          correct: isCorrect,
          confidence: p.confidence
        }))
        mlEngine.trainModel(tradeResults)
        
        // Registrar estatísticas por padrão
        patterns.forEach(pattern => {
          if (!patternStats[pattern.pattern]) {
            patternStats[pattern.pattern] = { total: 0, correct: 0, accuracy: 0 }
          }
          patternStats[pattern.pattern].total++
          if (isCorrect) {
            patternStats[pattern.pattern].correct++
          }
        })
      }
    }
  })
  
  // Calcular precisão por padrão
  Object.keys(patternStats).forEach(pattern => {
    const stats = patternStats[pattern]
    stats.accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
  })
  
  const accuracy = totalTrades > 0 ? (correctTrades / totalTrades) * 100 : 0
  
  return {
    accuracy,
    totalTrades,
    correctTrades,
    patternStats
  }
}

// Função para testar modelo
async function testModel(mlEngine: PatternBasedMLEngine, candles: any[]) {
  let totalTrades = 0
  let correctTrades = 0
  const patternStats: { [pattern: string]: { total: number; correct: number; accuracy: number } } = {}
  
  // Agrupar por par
  const pairCandles: { [pair: string]: any[] } = {}
  candles.forEach(candle => {
    if (!pairCandles[candle.pair]) {
      pairCandles[candle.pair] = []
    }
    pairCandles[candle.pair].push(candle)
  })
  
  Object.keys(pairCandles).forEach(pair => {
    const pairCandlesList = pairCandles[pair]
    if (pairCandlesList.length < 20) return
    
    for (let i = 10; i < pairCandlesList.length - 1; i++) {
      const currentCandles = pairCandlesList.slice(0, i + 1)
      const nextCandle = pairCandlesList[i + 1]
      
      const prediction = mlEngine.makePrediction(currentCandles)
      
      if (prediction.prediction !== 'YELLOW' && prediction.confidence > 0.3) {
        const isCorrect = prediction.prediction === nextCandle.color
        
        if (isCorrect) {
          correctTrades++
        }
        
        totalTrades++
        
        // Registrar estatísticas por padrão (sem treinar)
        const patterns = mlEngine.analyzePatterns(currentCandles)
        patterns.forEach(pattern => {
          if (!patternStats[pattern.pattern]) {
            patternStats[pattern.pattern] = { total: 0, correct: 0, accuracy: 0 }
          }
          patternStats[pattern.pattern].total++
          if (isCorrect) {
            patternStats[pattern.pattern].correct++
          }
        })
      }
    }
  })
  
  // Calcular precisão por padrão
  Object.keys(patternStats).forEach(pattern => {
    const stats = patternStats[pattern]
    stats.accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
  })
  
  const accuracy = totalTrades > 0 ? (correctTrades / totalTrades) * 100 : 0
  
  return {
    accuracy,
    totalTrades,
    correctTrades,
    patternStats
  }
}


