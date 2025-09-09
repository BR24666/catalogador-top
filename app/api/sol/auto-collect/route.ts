import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { solDataCollector } from '@/lib/sol-data-collector'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    console.log('📊 Iniciando coleta automática de dados do SOL...')
    
    // 1. Coletar dados atuais do SOL
    const currentData = await solDataCollector.fetchCurrentData()
    
    if (!currentData) {
      throw new Error('Erro ao coletar dados atuais do SOL')
    }

    // 2. Salvar dados no Supabase
    const { error: saveError } = await supabase
      .from('sol_candles')
      .insert({
        timestamp: new Date(currentData.timestamp).toISOString(),
        open: currentData.open,
        high: currentData.high,
        low: currentData.low,
        close: currentData.close,
        volume: currentData.volume,
        color: currentData.color,
        next_color: currentData.nextColor
      })

    if (saveError) {
      console.error('Erro ao salvar dados atuais:', saveError)
      throw new Error('Erro ao salvar dados atuais')
    }

    // 3. Atualizar estatísticas
    const { data: statsData } = await supabase
      .from('sol_learning_stats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (statsData) {
      await supabase
        .from('sol_learning_stats')
        .upsert({
          id: 1,
          learning_phase: statsData.learning_phase,
          total_simulations: statsData.total_simulations,
          accuracy: statsData.accuracy,
          sol_data_points: statsData.sol_data_points + 1,
          last_update: new Date().toISOString(),
          created_at: statsData.created_at
        })
    }

    console.log('✅ Dados atuais coletados e salvos:', {
      timestamp: currentData.timestamp,
      price: currentData.close,
      color: currentData.color
    })

    return NextResponse.json({
      success: true,
      message: 'Dados atuais coletados com sucesso',
      data: {
        timestamp: currentData.timestamp,
        price: currentData.close,
        color: currentData.color
      }
    })

  } catch (error) {
    console.error('Erro na coleta automática:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro na coleta automática de dados',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}


