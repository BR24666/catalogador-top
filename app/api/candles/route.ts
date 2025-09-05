import { NextRequest, NextResponse } from 'next/server'
import { CatalogService } from '@/lib/catalog-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pair = searchParams.get('pair') || 'BTCUSDT'
    const timeframe = searchParams.get('timeframe') || '1m'
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    console.log(`📊 Buscando dados: ${pair} ${timeframe} ${date}`)

    const catalogService = new CatalogService()
    const candles = await catalogService.getCandlesByDate(pair, timeframe, date)

    return NextResponse.json({
      success: true,
      data: candles,
      count: candles.length,
      pair,
      timeframe,
      date
    })
  } catch (error) {
    console.error('❌ Erro ao buscar velas:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao buscar dados',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}