import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    console.log('⏰ Configurando agendamento automático do SOL AI...')
    
    // 1. Verificar se já existe configuração de agendamento
    const { data: existingSchedule } = await supabase
      .from('sol_schedule')
      .select('*')
      .eq('id', 1)
      .single()

    // 2. Configurar agendamento automático
    const scheduleConfig = {
      id: 1,
      is_active: true,
      collect_interval: 60, // 60 segundos
      learn_interval: 3600, // 1 hora
      monitor_interval: 300, // 5 minutos
      last_collect: new Date().toISOString(),
      last_learn: new Date().toISOString(),
      last_monitor: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // 3. Salvar configuração
    const { error: scheduleError } = await supabase
      .from('sol_schedule')
      .upsert(scheduleConfig)

    if (scheduleError) {
      console.error('Erro ao salvar configuração de agendamento:', scheduleError)
      throw new Error('Erro ao salvar configuração de agendamento')
    }

    // 4. Criar tabela de agendamento se não existir
    const { error: createTableError } = await supabase.rpc('create_sol_schedule_table')
    
    if (createTableError) {
      console.log('Tabela de agendamento já existe ou erro ao criar:', createTableError.message)
    }

    console.log('✅ Agendamento automático configurado:', {
      collectInterval: scheduleConfig.collect_interval,
      learnInterval: scheduleConfig.learn_interval,
      monitorInterval: scheduleConfig.monitor_interval
    })

    return NextResponse.json({
      success: true,
      message: 'Agendamento automático configurado com sucesso',
      schedule: scheduleConfig
    })

  } catch (error) {
    console.error('Erro ao configurar agendamento:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao configurar agendamento automático',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📅 Verificando status do agendamento...')
    
    // Buscar configuração de agendamento
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('sol_schedule')
      .select('*')
      .eq('id', 1)
      .single()

    if (scheduleError) {
      console.error('Erro ao buscar configuração de agendamento:', scheduleError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar configuração de agendamento',
        details: scheduleError.message
      }, { status: 500 })
    }

    // Calcular próximas execuções
    const now = new Date()
    const lastCollect = scheduleData?.last_collect ? new Date(scheduleData.last_collect) : now
    const lastLearn = scheduleData?.last_learn ? new Date(scheduleData.last_learn) : now
    const lastMonitor = scheduleData?.last_monitor ? new Date(scheduleData.last_monitor) : now

    const nextCollect = new Date(lastCollect.getTime() + (scheduleData?.collect_interval || 60) * 1000)
    const nextLearn = new Date(lastLearn.getTime() + (scheduleData?.learn_interval || 3600) * 1000)
    const nextMonitor = new Date(lastMonitor.getTime() + (scheduleData?.monitor_interval || 300) * 1000)

    const scheduleStatus = {
      isActive: scheduleData?.is_active || false,
      collectInterval: scheduleData?.collect_interval || 60,
      learnInterval: scheduleData?.learn_interval || 3600,
      monitorInterval: scheduleData?.monitor_interval || 300,
      lastCollect: scheduleData?.last_collect || null,
      lastLearn: scheduleData?.last_learn || null,
      lastMonitor: scheduleData?.last_monitor || null,
      nextCollect: nextCollect.toISOString(),
      nextLearn: nextLearn.toISOString(),
      nextMonitor: nextMonitor.toISOString()
    }

    console.log('✅ Status do agendamento verificado:', scheduleStatus)

    return NextResponse.json({
      success: true,
      message: 'Status do agendamento verificado',
      schedule: scheduleStatus
    })

  } catch (error) {
    console.error('Erro ao verificar agendamento:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao verificar agendamento',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}


