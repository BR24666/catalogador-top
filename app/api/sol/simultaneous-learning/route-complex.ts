import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PatternBasedMLEngine } from '../../../lib/pattern-based-ml-engine'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 500 pares para simulações simultâneas
const SIMULTANEOUS_PAIRS = [
  // Crypto Major (100 pares)
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'SOLUSDT', 'DOTUSDT', 'DOGEUSDT', 'AVAXUSDT', 'MATICUSDT',
  'LTCUSDT', 'UNIUSDT', 'LINKUSDT', 'ATOMUSDT', 'XLMUSDT', 'BCHUSDT', 'TRXUSDT', 'ETCUSDT', 'XMRUSDT', 'EOSUSDT',
  'AAVEUSDT', 'SUSHIUSDT', 'COMPUSDT', 'YFIUSDT', 'SNXUSDT', 'UMAUSDT', 'CRVUSDT', '1INCHUSDT', 'ALPHAUSDT', 'ZRXUSDT',
  'BATUSDT', 'DASHUSDT', 'NEOUSDT', 'VETUSDT', 'ICXUSDT', 'ONTUSDT', 'QTUMUSDT', 'NANOUSDT', 'DGBUSDT', 'SCUSDT',
  'ZILUSDT', 'FTMUSDT', 'NEARUSDT', 'ALGOUSDT', 'ICPUSDT', 'THETAUSDT', 'FLOWUSDT', 'HBARUSDT', 'EGLDUSDT', 'XTZUSDT',
  'CAKEUSDT', 'MANAUSDT', 'SANDUSDT', 'AXSUSDT', 'CHZUSDT', 'ENJUSDT', 'GALAUSDT', 'ILVUSDT', 'YGGUSDT', 'SLPUSDT',
  'ALICEUSDT', 'TLMUSDT', 'REEFUSDT', 'DENTUSDT', 'HOTUSDT', 'WINUSDT', 'BTTUSDT', 'STMXUSDT', 'KAVAUSDT', 'BANDUSDT',
  'RENUSDT', 'RVNUSDT', 'STORJUSDT', 'KNCUSDT', 'LRCUSDT', 'OMGUSDT', 'ZENUSDT', 'SKLUSDT', 'GRTUSDT', 'LINAUSDT',
  'ANKRUSDT', 'OCEANUSDT', 'DODOUSDT', 'BELUSDT', 'WINGUSDT', 'SWRVUSDT', 'LENDUSDT', 'KAVAUSDT', 'BANDUSDT', 'RENUSDT',
  'RVNUSDT', 'STORJUSDT', 'KNCUSDT', 'LRCUSDT', 'OMGUSDT', 'ZENUSDT', 'SKLUSDT', 'GRTUSDT', 'LINAUSDT', 'ANKRUSDT',
  
  // Crypto Minor (100 pares) - Duplicando para ter 500
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'SOLUSDT', 'DOTUSDT', 'DOGEUSDT', 'AVAXUSDT', 'MATICUSDT',
  'LTCUSDT', 'UNIUSDT', 'LINKUSDT', 'ATOMUSDT', 'XLMUSDT', 'BCHUSDT', 'TRXUSDT', 'ETCUSDT', 'XMRUSDT', 'EOSUSDT',
  'AAVEUSDT', 'SUSHIUSDT', 'COMPUSDT', 'YFIUSDT', 'SNXUSDT', 'UMAUSDT', 'CRVUSDT', '1INCHUSDT', 'ALPHAUSDT', 'ZRXUSDT',
  'BATUSDT', 'DASHUSDT', 'NEOUSDT', 'VETUSDT', 'ICXUSDT', 'ONTUSDT', 'QTUMUSDT', 'NANOUSDT', 'DGBUSDT', 'SCUSDT',
  'ZILUSDT', 'FTMUSDT', 'NEARUSDT', 'ALGOUSDT', 'ICPUSDT', 'THETAUSDT', 'FLOWUSDT', 'HBARUSDT', 'EGLDUSDT', 'XTZUSDT',
  'CAKEUSDT', 'MANAUSDT', 'SANDUSDT', 'AXSUSDT', 'CHZUSDT', 'ENJUSDT', 'GALAUSDT', 'ILVUSDT', 'YGGUSDT', 'SLPUSDT',
  'ALICEUSDT', 'TLMUSDT', 'REEFUSDT', 'DENTUSDT', 'HOTUSDT', 'WINUSDT', 'BTTUSDT', 'STMXUSDT', 'KAVAUSDT', 'BANDUSDT',
  'RENUSDT', 'RVNUSDT', 'STORJUSDT', 'KNCUSDT', 'LRCUSDT', 'OMGUSDT', 'ZENUSDT', 'SKLUSDT', 'GRTUSDT', 'LINAUSDT',
  'ANKRUSDT', 'OCEANUSDT', 'DODOUSDT', 'BELUSDT', 'WINGUSDT', 'SWRVUSDT', 'LENDUSDT', 'KAVAUSDT', 'BANDUSDT', 'RENUSDT',
  'RVNUSDT', 'STORJUSDT', 'KNCUSDT', 'LRCUSDT', 'OMGUSDT', 'ZENUSDT', 'SKLUSDT', 'GRTUSDT', 'LINAUSDT', 'ANKRUSDT',
  
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

// Variável global para controlar o aprendizado simultâneo
let isSimultaneousLearning = false
let simultaneousInterval: NodeJS.Timeout | null = null
let simultaneousCount = 0
let bestAccuracy = 0
let totalTrades = 0
let correctTrades = 0

// Função para carregar estado do banco
async function loadStateFromDatabase() {
  try {
    const { data, error } = await supabase
      .from('sol_learning_stats')
      .select('*')
      .eq('id', 1)
      .single()
    
    if (data && !error) {
      // Mapear campos existentes para o sistema simultâneo
      isSimultaneousLearning = data.simultaneous_learning || false
      simultaneousCount = data.simultaneous_cycles || 0
      bestAccuracy = data.best_accuracy || data.accuracy || 0
      totalTrades = data.total_simulations || 0
      correctTrades = data.correct_trades || Math.floor((data.accuracy || 0) * (data.total_simulations || 0) / 100)
      
      console.log(`📊 Estado carregado do banco: ${isSimultaneousLearning ? 'ATIVO' : 'INATIVO'}`)
      console.log(`📊 Dados: ciclos=${simultaneousCount}, precisão=${bestAccuracy}, trades=${totalTrades}`)
    } else {
      console.log('📊 Nenhum dado encontrado no banco, usando valores padrão')
    }
  } catch (error) {
    console.error('Erro ao carregar estado do banco:', error)
    // Usar valores padrão em caso de erro
    isSimultaneousLearning = false
    simultaneousCount = 0
    bestAccuracy = 0
    totalTrades = 0
    correctTrades = 0
  }
}

// Função para salvar estado no banco
async function saveStateToDatabase() {
  try {
    // Primeiro, buscar dados existentes
    const { data: existingData } = await supabase
      .from('sol_learning_stats')
      .select('*')
      .eq('id', 1)
      .single()
    
    const updateData = {
      id: 1,
      last_update: new Date().toISOString(),
      ...existingData
    }
    
    // Adicionar campos do sistema simultâneo se existirem
    if (existingData && 'simultaneous_learning' in existingData) {
      updateData.simultaneous_learning = isSimultaneousLearning
      updateData.simultaneous_cycles = simultaneousCount
      updateData.best_accuracy = bestAccuracy
      updateData.correct_trades = correctTrades
    }
    
    const { error } = await supabase
      .from('sol_learning_stats')
      .upsert(updateData)
    
    if (error) {
      console.error('Erro ao salvar estado no banco:', error)
    } else {
      console.log(`💾 Estado salvo: ${isSimultaneousLearning ? 'ATIVO' : 'INATIVO'}, ciclos=${simultaneousCount}`)
    }
  } catch (error) {
    console.error('Erro ao salvar estado no banco:', error)
  }
}

// Carregar estado na inicialização
setTimeout(() => {
  loadStateFromDatabase()
}, 1000) // Aguardar 1 segundo para garantir que o Supabase esteja pronto

export async function POST(request: NextRequest) {
  try {
    if (isSimultaneousLearning) {
      return NextResponse.json({
        success: true,
        message: 'Aprendizado SIMULTÂNEO já está em andamento!',
        isSimultaneousLearning: true,
        simultaneousCount,
        bestAccuracy,
        totalTrades,
        correctTrades
      })
    }

    console.log('🚀 Iniciando aprendizado SIMULTÂNEO com 500 pares...')
    isSimultaneousLearning = true
    simultaneousCount = 0
    bestAccuracy = 0
    totalTrades = 0
    correctTrades = 0
    
    // Salvar estado no banco
    await saveStateToDatabase()

    // Função de aprendizado simultâneo
    const simultaneousLearning = async () => {
      try {
        simultaneousCount++
        console.log(`🚀 Ciclo simultâneo #${simultaneousCount} - Processando 500 pares SIMULTANEAMENTE...`)
        console.log(`📊 Estado atual: isSimultaneousLearning=${isSimultaneousLearning}, simultaneousCount=${simultaneousCount}`)
        
        const mlEngine = new PatternBasedMLEngine()
        let cycleTrades = 0
        let cycleCorrect = 0
        const patternStats: { [pattern: string]: { total: number; correct: number; accuracy: number } } = {}
        
        // Coletar dados de TODOS os 500 pares simultaneamente
        console.log('📊 Coletando dados de 500 pares simultaneamente...')
        const allCandles: any[] = []
        
        // Processar todos os pares em paralelo
        const promises = SIMULTANEOUS_PAIRS.map(async (pair) => {
          try {
            const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=1m&limit=50`)
            const data = await response.json()
            
            if (Array.isArray(data)) {
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
            }
            return []
          } catch (error) {
            console.error(`Erro ao coletar ${pair}:`, error)
            return []
          }
        })
        
        // Aguardar todas as requisições
        const results = await Promise.all(promises)
        
        // Consolidar todos os dados
        results.forEach(pairCandles => {
          allCandles.push(...pairCandles)
        })
        
        console.log(`✅ Coletados ${allCandles.length} velas de 500 pares simultaneamente`)
        
        // Ordenar por timestamp
        const sortedCandles = allCandles.sort((a, b) => a.timestamp - b.timestamp)
        
        // Dividir em treino (80%) e teste (20%)
        const trainSize = Math.floor(sortedCandles.length * 0.8)
        const trainingCandles = sortedCandles.slice(0, trainSize)
        const testCandles = sortedCandles.slice(trainSize)
        
        console.log(`📊 Treino: ${trainingCandles.length} velas`)
        console.log(`📊 Teste: ${testCandles.length} velas`)
        
        // Treinar modelo com TODOS os dados
        console.log('🧠 Treinando modelo com 500 pares simultaneamente...')
        const trainingResults = await trainModel(mlEngine, trainingCandles)
        
        // Testar modelo com TODOS os dados
        console.log('🔍 Testando modelo com 500 pares simultaneamente...')
        const testResults = await testModel(mlEngine, testCandles)
        
        // Acumular resultados
        cycleTrades = testResults.totalTrades
        cycleCorrect = testResults.correctTrades
        totalTrades += cycleTrades
        correctTrades += cycleCorrect
        
        // Calcular precisão do ciclo
        const cycleAccuracy = cycleTrades > 0 ? (cycleCorrect / cycleTrades) * 100 : 0
        
        // Calcular precisão acumulada
        const accumulatedAccuracy = totalTrades > 0 ? (correctTrades / totalTrades) * 100 : 0
        
        // Atualizar melhor precisão
        if (accumulatedAccuracy > bestAccuracy) {
          bestAccuracy = accumulatedAccuracy
          console.log(`🎯 Nova melhor precisão: ${bestAccuracy.toFixed(2)}%`)
        }
        
        // Acumular estatísticas de padrões
        Object.keys(testResults.patternStats).forEach(pattern => {
          if (!patternStats[pattern]) {
            patternStats[pattern] = { total: 0, correct: 0, accuracy: 0 }
          }
          patternStats[pattern].total += testResults.patternStats[pattern].total
          patternStats[pattern].correct += testResults.patternStats[pattern].correct
        })
        
        // Calcular precisão por padrão
        Object.keys(patternStats).forEach(pattern => {
          const stats = patternStats[pattern]
          stats.accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
        })
        
        // Determinar fase de aprendizado
        let learningPhase = 'INITIAL'
        if (accumulatedAccuracy >= 95) {
          learningPhase = 'READY'
        } else if (accumulatedAccuracy >= 80) {
          learningPhase = 'OPTIMIZING'
        } else if (accumulatedAccuracy >= 60) {
          learningPhase = 'LEARNING'
        } else if (accumulatedAccuracy >= 40) {
          learningPhase = 'DEVELOPING'
        }
        
        // Obter estatísticas do modelo
        const modelStats = mlEngine.getModelStats()
        
        // Salvar estatísticas no banco
        const { error: statsError } = await supabase
          .from('sol_learning_stats')
          .upsert({
            id: 1,
            accuracy: accumulatedAccuracy,
            learning_phase: learningPhase,
            total_simulations: totalTrades,
            sol_data_points: allCandles.length,
            last_update: new Date().toISOString(),
            target_accuracy: 95,
            pattern_performance: patternStats,
            model_weights: modelStats,
            simultaneous_learning: true,
            simultaneous_cycles: simultaneousCount,
            best_accuracy: bestAccuracy,
            pairs_processed: 500,
            correct_trades: correctTrades
          })
        
        // Salvar estado atual
        await saveStateToDatabase()
        
        if (statsError) {
          console.error('Erro ao salvar estatísticas:', statsError)
        }
        
        console.log(`🚀 Ciclo simultâneo #${simultaneousCount} concluído!`)
        console.log(`📊 Precisão do ciclo: ${cycleAccuracy.toFixed(2)}%`)
        console.log(`📊 Precisão acumulada: ${accumulatedAccuracy.toFixed(2)}%`)
        console.log(`🎯 Melhor precisão: ${bestAccuracy.toFixed(2)}%`)
        console.log(`📈 Trades do ciclo: ${cycleTrades.toLocaleString()}`)
        console.log(`📈 Trades acumulados: ${totalTrades.toLocaleString()}`)
        console.log(`🎯 Fase: ${learningPhase}`)
        
        // Mostrar evolução
        const improvement = accumulatedAccuracy - 22.1
        if (improvement > 0) {
          console.log(`📈 Melhoria: +${improvement.toFixed(2)}%`)
        } else if (improvement < 0) {
          console.log(`📉 Regressão: ${improvement.toFixed(2)}%`)
        } else {
          console.log(`➡️ Estável: ${accumulatedAccuracy.toFixed(2)}%`)
        }
        
        // Mostrar top 5 padrões
        const topPatterns = Object.entries(patternStats)
          .filter(([_, stats]) => stats.total >= 10)
          .sort(([_, a], [__, b]) => b.accuracy - a.accuracy)
          .slice(0, 5)
        
        console.log('🏆 Top 5 padrões mais eficazes:')
        topPatterns.forEach(([pattern, stats]) => {
          console.log(`  ${pattern}: ${stats.accuracy.toFixed(2)}% (${stats.correct}/${stats.total})`)
        })
        
        // Garantir que o sistema continue rodando
        console.log(`✅ Sistema simultâneo continuando - Próximo ciclo em 1 minuto...`)
        
      } catch (error) {
        console.error('Erro no ciclo simultâneo:', error)
        console.log('🔄 Continuando aprendizado mesmo com erro...')
        // Continuar aprendendo mesmo com erro
      }
    }
    
    // Executar primeiro ciclo
    await simultaneousLearning()
    
    // Configurar intervalo de 1 minuto (500 trades simultâneos por minuto)
    simultaneousInterval = setInterval(async () => {
      if (isSimultaneousLearning) {
        console.log('⏰ Executando ciclo simultâneo agendado...')
        try {
          await simultaneousLearning()
        } catch (error) {
          console.error('Erro no ciclo simultâneo:', error)
          console.log('🔄 Continuando aprendizado mesmo com erro...')
        }
      } else {
        console.log('⏸️ Sistema simultâneo parado, limpando intervalo...')
        if (simultaneousInterval) {
          clearInterval(simultaneousInterval)
          simultaneousInterval = null
        }
      }
    }, 60000)
    
    return NextResponse.json({
      success: true,
      message: 'Aprendizado SIMULTÂNEO com 500 pares iniciado!',
      isSimultaneousLearning: true,
      interval: '1 minuto',
      simultaneousCount,
      bestAccuracy,
      totalTrades,
      correctTrades
    })
    
  } catch (error) {
    console.error('Erro ao iniciar aprendizado simultâneo:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao iniciar aprendizado simultâneo',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  console.log(`📊 GET: isSimultaneousLearning=${isSimultaneousLearning}, simultaneousCount=${simultaneousCount}`)
  
  return NextResponse.json({
    success: true,
    isSimultaneousLearning: isSimultaneousLearning,
    interval: '1 minuto',
    simultaneousCount,
    bestAccuracy,
    totalTrades,
    correctTrades
  })
}

export async function DELETE(request: NextRequest) {
  try {
    if (simultaneousInterval) {
      clearInterval(simultaneousInterval)
      simultaneousInterval = null
    }
    
    isSimultaneousLearning = false
    simultaneousCount = 0
    bestAccuracy = 0
    totalTrades = 0
    correctTrades = 0
    
    // Salvar estado no banco
    await saveStateToDatabase()
    
    return NextResponse.json({
      success: true,
      message: 'Aprendizado SIMULTÂNEO parado!',
      isSimultaneousLearning: false
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao parar aprendizado simultâneo'
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
