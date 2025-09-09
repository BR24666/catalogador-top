import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { IntelligentMLEngine } from '@/lib/intelligent-ml-engine'
import { collectAllPairsData } from '@/lib/multi-pair-collector'
import { ProcessedCandle } from '@/lib/multi-pair-collector'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando aprendizado inteligente SOL AI...')
    
    // 1. Coletar dados de múltiplos pares
    console.log('📊 Coletando dados de 500 pares...')
    await collectAllPairsData()
    
    // 2. Buscar dados coletados do banco
    console.log('📈 Carregando dados do banco...')
    const { data: candlesData, error: candlesError } = await supabase
      .from('multi_pair_candles')
      .select('*')
      .order('timestamp', { ascending: true })
    
    if (candlesError) {
      throw new Error(`Erro ao carregar dados: ${candlesError.message}`)
    }
    
    if (!candlesData || candlesData.length === 0) {
      throw new Error('Nenhum dado encontrado no banco')
    }
    
    console.log(`✅ Carregados ${candlesData.length} velas de múltiplos pares`)
    
    // 3. Converter dados para o formato correto
    const candles: ProcessedCandle[] = candlesData.map((candle: any) => ({
      timestamp: candle.timestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
      pair: candle.pair,
      color: candle.color
    }))
    
    // 4. Iniciar aprendizado inteligente
    console.log('🧠 Iniciando aprendizado baseado em simulações...')
    const mlEngine = new IntelligentMLEngine()
    const learningResult = await mlEngine.learnFromTradeSimulations(candles)
    
    // 5. Salvar resultados no banco
    console.log('💾 Salvando resultados do aprendizado...')
    const { error: statsError } = await supabase
      .from('sol_learning_stats')
      .upsert({
        id: 1,
        accuracy: learningResult.accuracy,
        learning_phase: learningResult.learningPhase,
        total_simulations: learningResult.totalSimulations,
        sol_data_points: candles.length,
        last_update: new Date().toISOString(),
        target_accuracy: 95,
        optimized_weights: learningResult.optimizedWeights,
        pair_performance: learningResult.pairPerformance,
        successful_patterns: learningResult.successfulPatterns
      })
    
    if (statsError) {
      console.error('Erro ao salvar estatísticas:', statsError)
    }
    
    // 6. Gerar sinais para pares alvo
    console.log('🎯 Gerando sinais para pares alvo...')
    const eurUsdSignal = mlEngine.generateSignalForPair(candles, 'EURUSD')
    const solUsdtSignal = mlEngine.generateSignalForPair(candles, 'SOLUSDT')
    
    return NextResponse.json({
      success: true,
      message: 'Aprendizado inteligente concluído com sucesso',
      result: {
        accuracy: learningResult.accuracy,
        totalSimulations: learningResult.totalSimulations,
        learningPhase: learningResult.learningPhase,
        dataPoints: candles.length,
        pairsAnalyzed: Object.keys(learningResult.pairPerformance).length,
        optimizedWeights: learningResult.optimizedWeights,
        isReadyToOperate: learningResult.learningPhase === 'READY',
        targetSignals: {
          EURUSD: eurUsdSignal,
          SOLUSDT: solUsdtSignal
        }
      }
    })
    
  } catch (error) {
    console.error('Erro no aprendizado inteligente:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no aprendizado inteligente',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}


