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
    <div>
      <h1>Catálogo de Velas SOLUSDT</h1>
      <p>Visualização das cores das velas - Hora na linha horizontal, Minuto na coluna vertical</p>
      
      <div>
        <label>Data:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min="2025-08-06"
          max="2025-09-05"
        />
      </div>
      
      <div>
        <label>Timeframe:</label>
        <select
          value={selectedTimeframe}
          onChange={(e) => setSelectedTimeframe(e.target.value)}
        >
          <option value="1m">1 minuto</option>
          <option value="5m">5 minutos</option>
          <option value="15m">15 minutos</option>
        </select>
      </div>
      
      <div>
        <p>Período disponível: 06/08/2025 a 05/09/2025</p>
      </div>

      <div>
        <div>
          <div>Total de Velas: {stats.total}</div>
        </div>
        
        <div>
          <div>Verdes: {stats.green} ({stats.greenPercent}%)</div>
        </div>
        
        <div>
          <div>Vermelhas: {stats.red} ({stats.redPercent}%)</div>
        </div>
        
        <div>
          <div>Tendência: {stats.greenPercent > stats.redPercent ? 'Verde' : 'Vermelho'}</div>
        </div>
      </div>

      <div>
        <h2>Grid 24x60 - {selectedDate} ({selectedTimeframe})</h2>
        
        {loading ? (
          <div>
            <div>Carregando dados...</div>
          </div>
        ) : (
          <div>
            <div>
              <div>Hora</div>
              {Array.from({ length: 60 }, (_, i) => (
                <div key={i}>
                  {i % 5 === 0 ? i : ''}
                </div>
              ))}
            </div>
            
            {grid.map((hour, hourIndex) => (
              <div key={hourIndex}>
                <div>
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
        )}
      </div>

      <div>
        <div>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#10B981', borderRadius: '4px' }}></div>
          <span>Vela Verde (Fechamento ≥ Abertura)</span>
        </div>
        <div>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#EF4444', borderRadius: '4px' }}></div>
          <span>Vela Vermelha (Fechamento < Abertura)</span>
        </div>
        <div>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#374151', borderRadius: '4px' }}></div>
          <span>Sem dados</span>
        </div>
      </div>

      <div>
        <h3>Informações dos Dados</h3>
        <div>
          <div>Par: SOLUSDT</div>
        </div>
        <div>
          <div>Período: 06/08/2025 a 05/09/2025</div>
        </div>
        <div>
          <div>Total de candles: 54,720</div>
        </div>
        <div>
          <div>1m: 43,200 candles</div>
        </div>
        <div>
          <div>5m: 8,640 candles</div>
        </div>
        <div>
          <div>15m: 2,880 candles</div>
        </div>
      </div>
    </div>
  )
}