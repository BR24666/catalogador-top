import { NextRequest, NextResponse } from 'next/server'
import { CatalogService } from '@/lib/catalog-service'

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Iniciando coleta via API...')
    
    const catalogService = new CatalogService()
    await catalogService.collectAndSave()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Dados coletados com sucesso!',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Erro na API de coleta:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando coleta via POST...')
    
    const catalogService = new CatalogService()
    await catalogService.collectAndSave()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Dados coletados com sucesso!',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Erro na API de coleta:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
