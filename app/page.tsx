'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import ControlPanel from '@/components/ControlPanel'
import CandleGrid from '@/components/CandleGrid'
import { CandleData } from '@/lib/supabase'

export default function Home() {
  const [candles, setCandles] = useState<CandleData[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPair, setSelectedPair] = useState('BTCUSDT')
  const [selectedTimeframe, setSelectedTimeframe] = useState('1m')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const pairs = ['BTCUSDT', 'XRPUSDT', 'SOLUSDT']
  const timeframes = ['1m', '5m', '15m']

  const fetchCandles = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/candles?pair=${selectedPair}&timeframe=${selectedTimeframe}&date=${selectedDate}`
      )
      const data = await response.json()
      
      if (data.success) {
        setCandles(data.data)
      } else {
        console.error('Erro ao buscar velas:', data.message)
        setCandles([])
      }
    } catch (error) {
      console.error('Erro ao buscar velas:', error)
      setCandles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCandles()
  }, [selectedPair, selectedTimeframe, selectedDate])

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            📊 Catalogador de Velas
          </h1>
          <p className="text-gray-400 text-lg">
            Coleta e visualização de dados de criptomoedas em tempo real
          </p>
        </div>

        {/* Control Panel */}
        <ControlPanel />

        {/* Filtros */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Filtros de Visualização</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Par de Negociação */}
            <div>
              <label className="block text-sm font-medium mb-2">Par de Negociação</label>
              <select
                value={selectedPair}
                onChange={(e) => setSelectedPair(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {pairs.map(pair => (
                  <option key={pair} value={pair}>{pair}</option>
                ))}
              </select>
            </div>

            {/* Timeframe */}
            <div>
              <label className="block text-sm font-medium mb-2">Timeframe</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {timeframes.map(tf => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
            </div>

            {/* Data */}
            <div>
              <label className="block text-sm font-medium mb-2">Data</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Botão Atualizar */}
            <div className="flex items-end">
              <button
                onClick={fetchCandles}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Carregando...
                  </>
                ) : (
                  'Atualizar'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Grid de Velas */}
        <CandleGrid
          candles={candles}
          pair={selectedPair}
          timeframe={selectedTimeframe}
          date={selectedDate}
          loading={loading}
        />

        {/* Estatísticas */}
        {candles.length > 0 && (
          <div className="mt-6 bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Estatísticas</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{candles.length}</div>
                <div className="text-sm text-gray-400">Total de Velas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {candles.filter(c => c.color === 'GREEN').length}
                </div>
                <div className="text-sm text-gray-400">Velas Verdes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {candles.filter(c => c.color === 'RED').length}
                </div>
                <div className="text-sm text-gray-400">Velas Vermelhas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {candles.length > 0 ? Math.round((candles.filter(c => c.color === 'GREEN').length / candles.length) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-400">% Verdes</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}