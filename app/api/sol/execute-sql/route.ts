import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json()
    
    if (!sql) {
      return NextResponse.json({
        success: false,
        error: 'SQL é obrigatório'
      }, { status: 400 })
    }
    
    console.log('🔧 Executando SQL:', sql)
    
    // Executar SQL diretamente
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error('Erro ao executar SQL:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao executar SQL',
        details: error.message
      }, { status: 500 })
    }
    
    console.log('✅ SQL executado com sucesso')
    
    return NextResponse.json({
      success: true,
      message: 'SQL executado com sucesso',
      data
    })
    
  } catch (error) {
    console.error('Erro ao executar SQL:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao executar SQL',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}


