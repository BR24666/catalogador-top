import { NextRequest, NextResponse } from 'next/server'
import { CatalogService } from '@/lib/catalog-service'

const catalogService = new CatalogService()

export async function POST(request: NextRequest) {
  try {
    const { action, intervalSeconds } = await request.json()

    switch (action) {
      case 'start':
        await catalogService.startCataloging(intervalSeconds || 60)
        return NextResponse.json({ success: true, message: 'Catalogador iniciado' })
      
      case 'stop':
        await catalogService.stopCataloging()
        return NextResponse.json({ success: true, message: 'Catalogador parado' })
      
      default:
        return NextResponse.json({ success: false, message: 'Ação inválida' }, { status: 400 })
    }
  } catch (error) {
    console.error('Erro na API do catalogador:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const status = await catalogService.getCatalogStatus()
    return NextResponse.json({ success: true, data: status })
  } catch (error) {
    console.error('Erro ao buscar status:', error)
    return NextResponse.json(
      { success: false, message: 'Erro ao buscar status' },
      { status: 500 }
    )
  }
}
