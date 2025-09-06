'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lgddsslskhzxtpjathjr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws'
const supabase = createClient(supabaseUrl, supabaseKey)

interface CandleData {
  id: string
  pair: string
  timeframe: string
  timestamp: string
  open_price: number
  close_price: number
  color: 'GREEN' | 'RED'
  hour: number
  minute: number
  full_date: string
  time_key: string
}

export default function Home() {
  const [candles, setCandles] = useState<CandleData[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState('2025-09-05')
  const [selectedTimeframe, setSelectedTimeframe] = useState('1m')
  const [stats, setStats] = useState({
    total: 0,
    green: 0,
    red: 0,
    greenPercent: 0,
    redPercent: 0
  })

  const loadCandles = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('candle_data')
        .select('*')
        .eq('full_date', selectedDate)
        .eq('timeframe', selectedTimeframe)
        .eq('pair', 'SOLUSDT')
        .order('timestamp', { ascending: true })
      
      if (error) {
        console.error('Erro ao carregar dados:', error)
        return
      }
      
      setCandles(data || [])
      
      const total = data?.length || 0
      const green = data?.filter(c => c.color === 'GREEN').length || 0
      const red = data?.filter(c => c.color === 'RED').length || 0
      
      setStats({
        total,
        green,
        red,
        greenPercent: total > 0 ? Math.round((green / total) * 100) : 0,
        redPercent: total > 0 ? Math.round((red / total) * 100) : 0
      })
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCandles()
  }, [selectedDate, selectedTimeframe])

  const createGrid = () => {
    const grid = Array(24).fill(null).map(() => Array(60).fill(null))
    
    candles.forEach(candle => {
      if (candle.hour >= 0 && candle.hour < 24 && candle.minute >= 0 && candle.minute < 60) {
        grid[candle.hour][candle.minute] = candle
      }
    })
    
    return grid
  }

  const grid = createGrid()

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Catálogo de Velas SOLUSDT</h1>
          <p className="text-gray-300 mb-6">
            Visualização das cores das velas - Hora na linha horizontal, Minuto na coluna vertical
          </p>
          
          <div className="flex gap-4 items-center mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Data:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min="2025-08-06"
                max="2025-09-05"
                className="bg-gray-800 border border-gray-600 rounded px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Timeframe:</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-2"
              >
                <option value="1m">1 minuto</option>
                <option value="5m">5 minutos</option>
                <option value="15m">15 minutos</option>
              </select>
            </div>
            
            <div className="text-sm text-gray-400">
              Período disponível: 06/08/2025 a 05/09/2025
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
            <div className="text-sm text-gray-400">Total de Velas</div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-400">{stats.green}</div>
            <div className="text-sm text-gray-400">Verdes ({stats.greenPercent}%)</div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-400">{stats.red}</div>
            <div className="text-sm text-gray-400">Vermelhas ({stats.redPercent}%)</div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-400">
              {stats.greenPercent > stats.redPercent ? 'Verde' : 'Vermelho'}
            </div>
            <div className="text-sm text-gray-400">Tendência</div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">
            Grid 24x60 - {selectedDate} ({selectedTimeframe})
          </h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
              <p className="mt-4 text-gray-400">Carregando dados...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="inline-block">
                <div className="flex mb-2">
                  <div className="w-16 text-xs text-gray-400 text-center font-bold">Hora</div>
                  {Array.from({ length: 60 }, (_, i) => (
                    <div key={i} className="w-2 h-6 text-xs text-gray-400 text-center">
                      {i % 5 === 0 ? i : ''}
                    </div>
                  ))}
                </div>
                
                {grid.map((hour, hourIndex) => (
                  <div key={hourIndex} className="flex items-center mb-1">
                    <div className="w-16 text-xs text-gray-400 text-right pr-2 font-bold">
                      {hourIndex.toString().padStart(2, '0')}:00
                    </div>
                    {hour.map((candle, minuteIndex) => (
                      <div
                        key={`${hourIndex}-${minuteIndex}`}
                        className={`w-2 h-2 mx-0.5 rounded-sm ${
                          candle 
                            ? candle.color === 'GREEN' 
                              ? 'bg-green-500' 
                              : 'bg-red-500'
                            : 'bg-gray-700'
                        }`}
                        title={candle ? `${candle.time_key} - ${candle.color} - $${candle.close_price}` : ''}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Vela Verde (Fechamento ≥ Abertura)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Vela Vermelha (Fechamento < Abertura)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-700 rounded"></div>
            <span>Sem dados</span>
          </div>
        </div>

        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Informações dos Dados</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Par:</span>
              <span className="ml-2 text-white font-bold">SOLUSDT</span>
            </div>
            <div>
              <span className="text-gray-400">Período:</span>
              <span className="ml-2 text-white">06/08/2025 a 05/09/2025</span>
            </div>
            <div>
              <span className="text-gray-400">Total de candles:</span>
              <span className="ml-2 text-white font-bold">54,720</span>
            </div>
            <div>
              <span className="text-gray-400">1m:</span>
              <span className="ml-2 text-white">43,200 candles</span>
            </div>
            <div>
              <span className="text-gray-400">5m:</span>
              <span className="ml-2 text-white">8,640 candles</span>
            </div>
            <div>
              <span className="text-gray-400">15m:</span>
              <span className="ml-2 text-white">2,880 candles</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}