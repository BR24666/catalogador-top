'use client'

import { CandleData } from '@/lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CandleGridProps {
  candles: CandleData[]
  pair: string
  timeframe: string
  date: string
  loading: boolean
}

export default function CandleGrid({ candles, pair, timeframe, date, loading }: CandleGridProps) {
  // Organizar velas por hora
  const candlesByHour = candles.reduce((acc, candle) => {
    const hour = candle.hour
    if (!acc[hour]) {
      acc[hour] = []
    }
    acc[hour].push(candle)
    return acc
  }, {} as Record<number, CandleData[]>)

  // Ordenar velas por minuto dentro de cada hora
  Object.keys(candlesByHour).forEach(hour => {
    candlesByHour[parseInt(hour)].sort((a, b) => a.minute - b.minute)
  })

  // Gerar array de horas (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i)

  // Gerar array de minutos baseado no timeframe
  const getMinutesForTimeframe = (tf: string) => {
    switch (tf) {
      case '1m':
        return Array.from({ length: 60 }, (_, i) => i)
      default:
        return Array.from({ length: 60 }, (_, i) => i)
    }
  }

  const minutes = getMinutesForTimeframe(timeframe)

  const getCandleForTime = (hour: number, minute: number): CandleData | null => {
    const hourCandles = candlesByHour[hour] || []
    return hourCandles.find(candle => candle.minute === minute) || null
  }

  const formatTime = (hour: number, minute: number) => {
    const date = new Date()
    date.setHours(hour, minute, 0, 0)
    return format(date, 'HH:mm')
  }

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-300">Carregando velas...</span>
        </div>
      </div>
    )
  }

  if (candles.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">Nenhuma vela encontrada</h3>
          <p className="text-gray-400 mb-4">
            Para a data {format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })}
          </p>
          <p className="text-sm text-gray-500">
            O catalogador está coletando dados automaticamente. 
            Aguarde alguns minutos para ver as velas aparecerem.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2">
          {pair} - {timeframe} - {format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })}
        </h2>
        <p className="text-gray-400">
          Total de velas: {candles.length} | 
          Timeframe: {timeframe} | 
          Data: {date}
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Cabeçalho com minutos */}
          <div className="flex mb-2">
            <div className="w-16 text-sm font-medium text-gray-400 flex items-center justify-center">
              Hora
            </div>
            {minutes.map(minute => (
              <div
                key={minute}
                className="w-8 text-xs text-gray-400 text-center"
              >
                {minute.toString().padStart(2, '0')}
              </div>
            ))}
          </div>

          {/* Grid de velas */}
          <div className="space-y-1">
            {hours.map(hour => (
              <div key={hour} className="flex">
                {/* Hora */}
                <div className="w-16 text-sm font-medium text-gray-300 flex items-center justify-center">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                
                {/* Velas da hora */}
                {minutes.map(minute => {
                  const candle = getCandleForTime(hour, minute)
                  
                  if (!candle) {
                    return (
                      <div
                        key={`${hour}-${minute}`}
                        className="w-8 h-8 border border-gray-600 bg-gray-700 flex items-center justify-center text-xs"
                      >
                        -
                      </div>
                    )
                  }

                  return (
                    <div
                      key={`${hour}-${minute}`}
                      className={`w-8 h-8 border border-gray-600 flex items-center justify-center text-xs font-medium ${
                        candle.color === 'GREEN'
                          ? 'candle-green'
                          : 'candle-red'
                      }`}
                      title={`${formatTime(hour, minute)} - ${candle.color} - O: ${candle.open_price} C: ${candle.close_price}`}
                    >
                      {candle.color === 'GREEN' ? '🟢' : '🔴'}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="mt-6 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Vela Verde (Alta)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Vela Vermelha (Baixa)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-700 border border-gray-600 rounded"></div>
          <span>Sem dados</span>
        </div>
      </div>
    </div>
  )
}
