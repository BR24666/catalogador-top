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
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', padding: '24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '16px' }}>
            Catálogo de Velas SOLUSDT
          </h1>
          <p style={{ color: '#D1D5DB', marginBottom: '24px' }}>
            Visualização das cores das velas - Hora na linha horizontal, Minuto na coluna vertical
          </p>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px' }}>
                Data:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min="2025-08-06"
                max="2025-09-05"
                style={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #4B5563',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  color: 'white'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px' }}>
                Timeframe:
              </label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                style={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #4B5563',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  color: 'white'
                }}
              >
                <option value="1m">1 minuto</option>
                <option value="5m">5 minutos</option>
                <option value="15m">15 minutos</option>
              </select>
            </div>
            
            <div style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>
              Período disponível: 06/08/2025 a 05/09/2025
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: '#1F2937', padding: '16px', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#60A5FA' }}>{stats.total}</div>
            <div style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>Total de Velas</div>
          </div>
          
          <div style={{ backgroundColor: '#1F2937', padding: '16px', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#34D399' }}>{stats.green}</div>
            <div style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>Verdes ({stats.greenPercent}%)</div>
          </div>
          
          <div style={{ backgroundColor: '#1F2937', padding: '16px', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#F87171' }}>{stats.red}</div>
            <div style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>Vermelhas ({stats.redPercent}%)</div>
          </div>
          
          <div style={{ backgroundColor: '#1F2937', padding: '16px', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#FBBF24' }}>
              {stats.greenPercent > stats.redPercent ? 'Verde' : 'Vermelho'}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>Tendência</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#1F2937', padding: '24px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px' }}>
            Grid 24x60 - {selectedDate} ({selectedTimeframe})
          </h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{
                width: '48px',
                height: '48px',
                border: '2px solid #60A5FA',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }}></div>
              <p style={{ marginTop: '16px', color: '#9CA3AF' }}>Carregando dados...</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'inline-block' }}>
                <div style={{ display: 'flex', marginBottom: '8px' }}>
                  <div style={{ width: '64px', fontSize: '0.75rem', color: '#9CA3AF', textAlign: 'center', fontWeight: 'bold' }}>
                    Hora
                  </div>
                  {Array.from({ length: 60 }, (_, i) => (
                    <div key={i} style={{ width: '8px', height: '24px', fontSize: '0.75rem', color: '#9CA3AF', textAlign: 'center' }}>
                      {i % 5 === 0 ? i : ''}
                    </div>
                  ))}
                </div>
                
                {grid.map((hour, hourIndex) => (
                  <div key={hourIndex} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ width: '64px', fontSize: '0.75rem', color: '#9CA3AF', textAlign: 'right', paddingRight: '8px', fontWeight: 'bold' }}>
                      {hourIndex.toString().padStart(2, '0')}:00
                    </div>
                    {hour.map((candle, minuteIndex) => (
                      <div
                        key={`${hourIndex}-${minuteIndex}`}
                        style={{
                          width: '8px',
                          height: '8px',
                          margin: '0 2px',
                          borderRadius: '2px',
                          backgroundColor: candle 
                            ? candle.color === 'GREEN' 
                              ? '#10B981' 
                              : '#EF4444'
                            : '#374151'
                        }}
                        title={candle ? `${candle.time_key} - ${candle.color} - $${candle.close_price}` : ''}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '24px', display: 'flex', gap: '24px', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', backgroundColor: '#10B981', borderRadius: '4px' }}></div>
            <span>Vela Verde (Fechamento ≥ Abertura)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', backgroundColor: '#EF4444', borderRadius: '4px' }}></div>
            <span>Vela Vermelha (Fechamento < Abertura)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', backgroundColor: '#374151', borderRadius: '4px' }}></div>
            <span>Sem dados</span>
          </div>
        </div>

        <div style={{ marginTop: '32px', backgroundColor: '#1F2937', padding: '24px', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px' }}>Informações dos Dados</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: '#9CA3AF' }}>Par:</span>
              <span style={{ marginLeft: '8px', color: 'white', fontWeight: 'bold' }}>SOLUSDT</span>
            </div>
            <div>
              <span style={{ color: '#9CA3AF' }}>Período:</span>
              <span style={{ marginLeft: '8px', color: 'white' }}>06/08/2025 a 05/09/2025</span>
            </div>
            <div>
              <span style={{ color: '#9CA3AF' }}>Total de candles:</span>
              <span style={{ marginLeft: '8px', color: 'white', fontWeight: 'bold' }}>54,720</span>
            </div>
            <div>
              <span style={{ color: '#9CA3AF' }}>1m:</span>
              <span style={{ marginLeft: '8px', color: 'white' }}>43,200 candles</span>
            </div>
            <div>
              <span style={{ color: '#9CA3AF' }}>5m:</span>
              <span style={{ marginLeft: '8px', color: 'white' }}>8,640 candles</span>
            </div>
            <div>
              <span style={{ color: '#9CA3AF' }}>15m:</span>
              <span style={{ marginLeft: '8px', color: 'white' }}>2,880 candles</span>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}