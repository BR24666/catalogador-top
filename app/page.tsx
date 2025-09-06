'use client'

import React, { useState, useEffect } from 'react'
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

  return React.createElement('div', { style: { minHeight: '100vh', backgroundColor: '#111827', color: 'white', padding: '24px' } },
    React.createElement('div', { style: { maxWidth: '1280px', margin: '0 auto' } },
      React.createElement('div', { style: { marginBottom: '32px' } },
        React.createElement('h1', { style: { fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '16px' } }, 'Catálogo de Velas SOLUSDT'),
        React.createElement('p', { style: { color: '#9ca3af', marginBottom: '24px' } }, 'Visualização das cores das velas - Hora na linha horizontal, Minuto na coluna vertical'),
        
        React.createElement('div', { style: { display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' } },
          React.createElement('div', null,
            React.createElement('label', { style: { display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px' } }, 'Data:'),
            React.createElement('input', {
              type: 'date',
              value: selectedDate,
              onChange: (e) => setSelectedDate(e.target.value),
              min: '2025-08-06',
              max: '2025-09-05',
              style: { backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '4px', padding: '8px 12px', color: 'white' }
            })
          ),
          
          React.createElement('div', null,
            React.createElement('label', { style: { display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px' } }, 'Timeframe:'),
            React.createElement('select', {
              value: selectedTimeframe,
              onChange: (e) => setSelectedTimeframe(e.target.value),
              style: { backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '4px', padding: '8px 12px', color: 'white' }
            },
              React.createElement('option', { value: '1m' }, '1 minuto'),
              React.createElement('option', { value: '5m' }, '5 minutos'),
              React.createElement('option', { value: '15m' }, '15 minutos')
            )
          ),
          
          React.createElement('div', { style: { fontSize: '0.875rem', color: '#9ca3af' } }, 'Período disponível: 06/08/2025 a 05/09/2025')
        )
      ),

      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' } },
        React.createElement('div', { style: { backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px' } },
          React.createElement('div', { style: { fontSize: '1.5rem', fontWeight: 'bold', color: '#60a5fa' } }, stats.total),
          React.createElement('div', { style: { fontSize: '0.875rem', color: '#9ca3af' } }, 'Total de Velas')
        ),
        
        React.createElement('div', { style: { backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px' } },
          React.createElement('div', { style: { fontSize: '1.5rem', fontWeight: 'bold', color: '#4ade80' } }, stats.green),
          React.createElement('div', { style: { fontSize: '0.875rem', color: '#9ca3af' } }, `Verdes (${stats.greenPercent}%)`)
        ),
        
        React.createElement('div', { style: { backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px' } },
          React.createElement('div', { style: { fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' } }, stats.red),
          React.createElement('div', { style: { fontSize: '0.875rem', color: '#9ca3af' } }, `Vermelhas (${stats.redPercent}%)`)
        ),
        
        React.createElement('div', { style: { backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px' } },
          React.createElement('div', { style: { fontSize: '1.5rem', fontWeight: 'bold', color: '#facc15' } }, stats.greenPercent > stats.redPercent ? '🟢' : '🔴'),
          React.createElement('div', { style: { fontSize: '0.875rem', color: '#9ca3af' } }, 'Tendência')
        )
      ),

      React.createElement('div', { style: { backgroundColor: '#1f2937', padding: '24px', borderRadius: '8px' } },
        React.createElement('h2', { style: { fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px' } }, `Grid 24x60 - ${selectedDate} (${selectedTimeframe})`),
        
        loading ? 
          React.createElement('div', { style: { textAlign: 'center', padding: '32px 0' } },
            React.createElement('div', { style: { animation: 'spin 1s linear infinite', borderRadius: '9999px', height: '48px', width: '48px', borderBottom: '2px solid #60a5fa', margin: '0 auto' } }),
            React.createElement('p', { style: { marginTop: '16px', color: '#9ca3af' } }, 'Carregando dados...')
          ) :
        React.createElement('div', { style: { overflowX: 'auto' } },
          React.createElement('div', { style: { display: 'inline-block' } },
            React.createElement('div', { style: { display: 'flex', marginBottom: '8px' } },
              React.createElement('div', { style: { width: '64px', fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', fontWeight: 'bold' } }, 'Hora'),
              ...Array.from({ length: 60 }, (_, i) =>
                React.createElement('div', { key: i, style: { width: '8px', height: '24px', fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' } }, i % 5 === 0 ? i : '')
              )
            ),
            ...grid.map((hour, hourIndex) =>
              React.createElement('div', { key: hourIndex, style: { display: 'flex', alignItems: 'center', marginBottom: '4px' } },
                React.createElement('div', { style: { width: '64px', fontSize: '0.75rem', color: '#9ca3af', textAlign: 'right', paddingRight: '8px', fontWeight: 'bold' } }, `${hourIndex.toString().padStart(2, '0')}:00`),
                ...hour.map((candle, minuteIndex) =>
                  React.createElement('div', {
                    key: `${hourIndex}-${minuteIndex}`,
                    style: {
                      width: '8px',
                      height: '8px',
                      margin: '0 2px',
                      borderRadius: '2px',
                      backgroundColor: candle 
                        ? candle.color === 'GREEN' 
                          ? '#22c55e' 
                          : '#ef4444'
                        : '#4b5563'
                    },
                    title: candle ? `${candle.time_key} - ${candle.color} - $${candle.close_price}` : ''
                  })
                )
              )
            )
          )
        ),

        React.createElement('div', { style: { marginTop: '24px', display: 'flex', gap: '24px', fontSize: '0.875rem' } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
            React.createElement('div', { style: { width: '16px', height: '16px', backgroundColor: '#22c55e', borderRadius: '4px' } }),
            React.createElement('span', null, 'Vela Verde (Fechamento ≥ Abertura)')
          ),
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
            React.createElement('div', { style: { width: '16px', height: '16px', backgroundColor: '#ef4444', borderRadius: '4px' } }),
            React.createElement('span', null, 'Vela Vermelha (Fechamento < Abertura)')
          ),
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
            React.createElement('div', { style: { width: '16px', height: '16px', backgroundColor: '#4b5563', borderRadius: '4px' } }),
            React.createElement('span', null, 'Sem dados')
          )
        ),

        React.createElement('div', { style: { marginTop: '32px', backgroundColor: '#1f2937', padding: '24px', borderRadius: '8px' } },
          React.createElement('h3', { style: { fontSize: '1.125rem', fontWeight: 'semibold', marginBottom: '16px' } }, '📊 Informações dos Dados'),
          React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '0.875rem' } },
            React.createElement('div', null,
              React.createElement('span', { style: { color: '#9ca3af' } }, 'Par:'),
              React.createElement('span', { style: { marginLeft: '8px', color: 'white', fontWeight: 'bold' } }, 'SOLUSDT')
            ),
            React.createElement('div', null,
              React.createElement('span', { style: { color: '#9ca3af' } }, 'Período:'),
              React.createElement('span', { style: { marginLeft: '8px', color: 'white' } }, '06/08/2025 a 05/09/2025')
            ),
            React.createElement('div', null,
              React.createElement('span', { style: { color: '#9ca3af' } }, 'Total de candles:'),
              React.createElement('span', { style: { marginLeft: '8px', color: 'white', fontWeight: 'bold' } }, '54,720')
            ),
            React.createElement('div', null,
              React.createElement('span', { style: { color: '#9ca3af' } }, '1m:'),
              React.createElement('span', { style: { marginLeft: '8px', color: 'white' } }, '43,200 candles')
            ),
            React.createElement('div', null,
              React.createElement('span', { style: { color: '#9ca3af' } }, '5m:'),
              React.createElement('span', { style: { marginLeft: '8px', color: 'white' } }, '8,640 candles')
            ),
            React.createElement('div', null,
              React.createElement('span', { style: { color: '#9ca3af' } }, '15m:'),
              React.createElement('span', { style: { marginLeft: '8px', color: 'white' } }, '2,880 candles')
            )
          )
        )
      )
    )
  )
}