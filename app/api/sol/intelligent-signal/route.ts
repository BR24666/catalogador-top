import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { IntelligentMLEngine } from '@/lib/intelligent-ml-engine'
import { ProcessedCandle } from '@/lib/multi-pair-collector'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Gerando sinais inteligentes para pares alvo...')
    
    // 1. Verificar se o sistema está pronto
    const { data: statsData, error: statsError } = await supabase
      .from('sol_learning_stats')
      .select('*')
      .eq('id', 1)
      .single()
    
    if (statsError || !statsData) {
      return NextResponse.json({
        success: false,
        error: 'Sistema não está pronto. Execute o aprendizado primeiro.',
        details: 'Nenhuma estatística de aprendizado encontrada'
      }, { status: 400 })
    }
    
    if (statsData.learning_phase !== 'READY') {
      return NextResponse.json({
        success: false,
        error: 'Sistema ainda não está pronto para operar',
        details: `Fase atual: ${statsData.learning_phase}. Precisão: ${statsData.accuracy}%`
      }, { status: 400 })
    }
    
    // 2. Buscar dados mais recentes dos pares alvo
    const targetPairs = ['EURUSD', 'SOLUSDT']
    const allCandles: ProcessedCandle[] = []
    
    for (const pair of targetPairs) {
      const { data: pairData, error: pairError } = await supabase
        .from('multi_pair_candles')
        .select('*')
        .eq('pair', pair)
        .order('timestamp', { ascending: false })
        .limit(100) // Últimas 100 velas
      
      if (!pairError && pairData) {
        const processedCandles = pairData.map((candle: any) => ({
          timestamp: candle.timestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
          pair: candle.pair,
          color: candle.color
        }))
        allCandles.push(...processedCandles)
      }
    }
    
    if (allCandles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Dados insuficientes para gerar sinais',
        details: 'Nenhum dado encontrado para os pares alvo'
      }, { status: 400 })
    }
    
    // 3. Criar engine com pesos otimizados
    const mlEngine = new IntelligentMLEngine()
    
    // 4. Gerar sinais para cada par alvo
    const signals: { [pair: string]: any } = {}
    
    for (const pair of targetPairs) {
      const pairCandles = allCandles.filter(c => c.pair === pair)
      if (pairCandles.length > 0) {
        const signal = mlEngine.generateSignalForPair(pairCandles, pair)
        signals[pair] = {
          pair,
          prediction: signal.prediction,
          confidence: signal.confidence,
          reasoning: signal.reasoning,
          features: signal.features,
          timestamp: new Date().toISOString(),
          entryPrice: pairCandles[pairCandles.length - 1].close
        }
      }
    }
    
    // 5. Salvar sinais no banco
    const signalsToSave = Object.values(signals).map(signal => ({
      pair: signal.pair,
      prediction: signal.prediction,
      confidence: signal.confidence,
      reasoning: signal.reasoning,
      features: signal.features,
      entry_price: signal.entryPrice,
      created_at: signal.timestamp
    }))
    
    if (signalsToSave.length > 0) {
      const { error: saveError } = await supabase
        .from('intelligent_signals')
        .insert(signalsToSave)
      
      if (saveError) {
        console.error('Erro ao salvar sinais:', saveError)
      }
    }
    
    console.log('✅ Sinais gerados com sucesso')
    
    return NextResponse.json({
      success: true,
      message: 'Sinais inteligentes gerados com sucesso',
      signals,
      systemStats: {
        accuracy: statsData.accuracy,
        learningPhase: statsData.learning_phase,
        totalSimulations: statsData.total_simulations,
        isReady: true
      }
    })
    
  } catch (error) {
    console.error('Erro ao gerar sinais inteligentes:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao gerar sinais inteligentes',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}


