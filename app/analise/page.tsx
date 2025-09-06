'use client'

import { useState, useEffect } from 'react'
import { CatalogService } from '@/lib/catalog-service'
import { CandleData } from '@/lib/supabase'
import { format } from 'date-fns'
import { BarChart3, TrendingUp, TrendingDown, Activity, Calendar, Clock } from 'lucide-react'

interface AnalysisData {
  totalCandles: number
  greenCandles: number
  redCandles: number
  greenPercentage: number
  redPercentage: number
  candlesByHour: Record<number, { green: number; red: number }>
  candlesByDay: Record<string, { green: number; red: number }>
  averageVolume: number
  priceRange: { min: number; max: number }
}

export default function AnalisePage() {
  const [catalogService] = useState(new CatalogService())
  const [selectedPair, setSelectedPair] = useState<'BTCUSDT' | 'XRPUSDT' | 'SOLUSDT'>('BTCUSDT')
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1m' | '5m' | '15m'>('1m')
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadAnalysis()
  }, [selectedPair, selectedTimeframe, selectedDate])

  const loadAnalysis = async () => {
    setLoading(true)
    try {
      const candles = await catalogService.getCandlesByDate(
        selectedPair,
        selectedTimeframe,
        selectedDate
      )

      const analysis = analyzeCandles(candles)
      setAnalysisData(analysis)
    } catch (error) {
      console.error('Erro ao carregar análise:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeCandles = (candles: CandleData[]): AnalysisData => {
    const totalCandles = candles.length
    const greenCandles = candles.filter(c => c.color === 'GREEN').length
    const redCandles = candles.filter(c => c.color === 'RED').length
    const greenPercentage = totalCandles > 0 ? (greenCandles / totalCandles) * 100 : 0
    const redPercentage = totalCandles > 0 ? (redCandles / totalCandles) * 100 : 0

    // Análise por hora
    const candlesByHour: Record<number, { green: number; red: number }> = {}
    candles.forEach(candle => {
      if (!candlesByHour[candle.hour]) {
        candlesByHour[candle.hour] = { green: 0, red: 0 }
      }
      if (candle.color === 'GREEN') {
        candlesByHour[candle.hour].green++
      } else {
        candlesByHour[candle.hour].red++
      }
    })

    // Análise por dia
    const candlesByDay: Record<string, { green: number; red: number }> = {}
    candles.forEach(candle => {
      const day = candle.full_date
      if (!candlesByDay[day]) {
        candlesByDay[day] = { green: 0, red: 0 }
      }
      if (candle.color === 'GREEN') {
        candlesByDay[day].green++
      } else {
        candlesByDay[day].red++
      }
    })

    // Volume médio
    const totalVolume = candles.reduce((sum, candle) => sum + parseFloat(candle.volume.toString()), 0)
    const averageVolume = totalCandles > 0 ? totalVolume / totalCandles : 0

    // Faixa de preços
    const prices = candles.map(c => parseFloat(c.close_price.toString()))
    const priceRange = {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0
    }

    return {
      totalCandles,
      greenCandles,
      redCandles,
      greenPercentage,
      redPercentage,
      candlesByHour,
      candlesByDay,
      averageVolume,
      priceRange
    }
  }

  const getHourWithMostGreen = () => {
    if (!analysisData) return null
    
    let maxGreen = 0
    let bestHour = 0
    
    Object.entries(analysisData.candlesByHour).forEach(([hour, data]) => {
      if (data.green > maxGreen) {
        maxGreen = data.green
        bestHour = parseInt(hour)
      }
    })
    
    return { hour: bestHour, count: maxGreen }
  }

  const getHourWithMostRed = () => {
    if (!analysisData) return null
    
    let maxRed = 0
    let worstHour = 0
    
    Object.entries(analysisData.candlesByHour).forEach(([hour, data]) => {
      if (data.red > maxRed) {
        maxRed = data.red
        worstHour = parseInt(hour)
      }
    })
    
    return { hour: worstHour, count: maxRed }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-300">Carregando análise...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-2">
             Análise de Dados
          </h1>
          <p className="text-gray-400 text-center">
            Análise detalhada das velas catalogadas
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Par de Negociação</label>
              <select
                value={selectedPair}
                onChange={(e) => setSelectedPair(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BTCUSDT"> BTC/USDT</option>
                <option value="XRPUSDT"> XRP/USDT</option>
                <option value="SOLUSDT"> SOL/USDT</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Timeframe</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1m">1 Minuto</option>
                <option value="5m">5 Minutos</option>
                <option value="15m">15 Minutos</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Data</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {analysisData && (
          <>
            {/* Estatísticas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total de Velas</p>
                    <p className="text-2xl font-bold">{analysisData.totalCandles}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Velas Verdes</p>
                    <p className="text-2xl font-bold text-green-400">{analysisData.greenCandles}</p>
                    <p className="text-sm text-gray-400">{analysisData.greenPercentage.toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Velas Vermelhas</p>
                    <p className="text-2xl font-bold text-red-400">{analysisData.redCandles}</p>
                    <p className="text-sm text-gray-400">{analysisData.redPercentage.toFixed(1)}%</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-500" />
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Volume Médio</p>
                    <p className="text-2xl font-bold">{analysisData.averageVolume.toFixed(2)}</p>
                  </div>
                  <Activity className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Análise por Hora */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Análise por Hora
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-green-400">Melhor Hora (Mais Verdes)</h4>
                  {getHourWithMostGreen() && (
                    <div className="bg-green-900/20 p-4 rounded-lg">
                      <p className="text-2xl font-bold">
                        {getHourWithMostGreen()?.hour.toString().padStart(2, '0')}:00
                      </p>
                      <p className="text-gray-400">
                        {getHourWithMostGreen()?.count} velas verdes
                      </p>
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-red-400">Pior Hora (Mais Vermelhas)</h4>
                  {getHourWithMostRed() && (
                    <div className="bg-red-900/20 p-4 rounded-lg">
                      <p className="text-2xl font-bold">
                        {getHourWithMostRed()?.hour.toString().padStart(2, '0')}:00
                      </p>
                      <p className="text-gray-400">
                        {getHourWithMostRed()?.count} velas vermelhas
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Gráfico de Barras por Hora */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-4">Distribuição por Hora</h4>
                <div className="grid grid-cols-12 gap-1">
                  {Array.from({ length: 24 }, (_, i) => {
                    const hourData = analysisData.candlesByHour[i] || { green: 0, red: 0 }
                    const total = hourData.green + hourData.red
                    const greenPercentage = total > 0 ? (hourData.green / total) * 100 : 0
                    
                    return (
                      <div key={i} className="text-center">
                        <div className="text-xs text-gray-400 mb-1">
                          {i.toString().padStart(2, '0')}
                        </div>
                        <div className="h-20 bg-gray-700 rounded flex flex-col justify-end">
                          <div
                            className="bg-green-500 rounded-t"
                            style={{ height: `${greenPercentage}%` }}
                          ></div>
                          <div
                            className="bg-red-500 rounded-b"
                            style={{ height: `${100 - greenPercentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{total}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Faixa de Preços */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Faixa de Preços
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-400 text-sm">Preço Mínimo</p>
                  <p className="text-2xl font-bold text-red-400">
                    ${analysisData.priceRange.min.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Preço Máximo</p>
                  <p className="text-2xl font-bold text-green-400">
                    ${analysisData.priceRange.max.toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-gray-400 text-sm">Variação</p>
                <p className="text-lg font-semibold">
                  ${(analysisData.priceRange.max - analysisData.priceRange.min).toFixed(2)}
                  <span className="text-sm text-gray-400 ml-2">
                    ({(((analysisData.priceRange.max - analysisData.priceRange.min) / analysisData.priceRange.min) * 100).toFixed(2)}%)
                  </span>
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
