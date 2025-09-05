import { NextRequest, NextResponse } from 'next/server'
import { CatalogService } from '@/lib/catalog-service'

export async function GET(request: NextRequest) {
  try {
    const catalogService = new CatalogService()
    const status = await catalogService.getCatalogStatus()

    return NextResponse.json({
      success: true,
      data: {
        isRunning: status.isRunning,
        lastUpdate: status.lastUpdate,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ Erro ao buscar status:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao buscar status',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
