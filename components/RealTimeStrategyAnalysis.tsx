'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lgddsslskhzxtpjathjr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws'
const supabase = createClient(supabaseUrl, supabaseKey)

interface CandleData {
  timestamp: string
  open_price: number
  close_price: number
  color: 'GREEN' | 'RED'
  hour: number
  minute: number
  time_key: string
}

interface StrategyResult {
  strategy_name: string
  signal: 'CALL' | 'PUT' | 'NEUTRAL'
  confidence: number
  accuracy: number
  total_signals: number
  correct_signals: number
  quadrant: number
  time_window: string
}

interface QuadrantStats {
  quadrant: number
  total_signals: number
  correct_signals: number
  accuracy: number
  best_strategies: string[]
  worst_strategies: string[]
}

interface RealTimeStrategyAnalysisProps {
  selectedDate: string
  selectedTimeframe: string
}

export default function RealTimeStrategyAnalysis({ selectedDate, selectedTimeframe }: RealTimeStrategyAnalysisProps) {
  const [candles, setCandles] = useState<CandleData[]>([])
  const [strategyResults, setStrategyResults] = useState<StrategyResult[]>([])
  const [quadrantStats, setQuadrantStats] = useState<QuadrantStats[]>([])
  const [loading, setLoading] = useState(false)
  const [currentQuadrant, setCurrentQuadrant] = useState(0)

  // Estratégias probabilísticas
  const strategies = [
    {
      name: 'MHI',
      description: 'Maioria das últimas 3 velas',
      analyze: (candles: CandleData[]) => {
        if (candles.length < 3) return null
        const last3 = candles.slice(-3)
        const greens = last3.filter(c => c.color === 'GREEN').length
        const reds = last3.filter(c => c.color === 'RED').length
        return greens > reds ? 'CALL' : 'PUT'
      }
    },
    {
      name: 'Minoria',
      description: 'Minoria das últimas 3 velas',
      analyze: (candles: CandleData[]) => {
        if (candles.length < 3) return null
        const last3 = candles.slice(-3)
        const greens = last3.filter(c => c.color === 'GREEN').length
        const reds = last3.filter(c => c.color === 'RED').length
        return greens > reds ? 'PUT' : 'CALL'
      }
    },
    {
      name: 'Três Soldados',
      description: '3 velas consecutivas da mesma cor',
      analyze: (candles: CandleData[]) => {
        if (candles.length < 3) return null
        const last3 = candles.slice(-3)
        const allGreen = last3.every(c => c.color === 'GREEN')
        const allRed = last3.every(c => c.color === 'RED')
        if (allGreen) return 'CALL'
        if (allRed) return 'PUT'
        return null
      }
    },
    {
      name: 'Alternância 2x2',
      description: 'Padrão 2x2 de alternância',
      analyze: (candles: CandleData[]) => {
        if (candles.length < 4) return null
        const last4 = candles.slice(-4)
        const pattern = last4.map(c => c.color).join('')
        if (pattern === 'GREEN,GREEN,RED,RED') return 'CALL'
        if (pattern === 'RED,RED,GREEN,GREEN') return 'PUT'
        return null
      }
    },
    {
      name: 'Vela de Força',
      description: 'Primeira vela oposta após sequência',
      analyze: (candles: CandleData[]) => {
        if (candles.length < 4) return null
        const last4 = candles.slice(-4)
        const first3 = last4.slice(0, 3)
        const last1 = last4[3]
        
        const allSame = first3.every(c => c.color === first3[0].color)
        const opposite = last1.color !== first3[0].color
        
        if (allSame && opposite) {
          return last1.color === 'GREEN' ? 'CALL' : 'PUT'
        }
        return null
      }
    }
  ]

  // Calcular quadrante baseado no horário
  const getQuadrant = (hour: number, minute: number) => {
    const totalMinutes = hour * 60 + minute
    return Math.floor(totalMinutes / 15) + 1 // Quadrantes de 15 minutos
  }

  // Analisar estratégias em tempo real com dados REAIS
  const analyzeStrategies = async (candles: CandleData[]) => {
    console.log(`🔍 Analisando ${candles.length} candles para estratégias em tempo real`)
    const results: StrategyResult[] = []
    const quadrantMap = new Map<number, { total: number, correct: number }>()

    for (const strategy of strategies) {
      console.log(`🎯 Analisando estratégia: ${strategy.name}`)
      const signal = strategy.analyze(candles)
      console.log(`📊 Sinal da estratégia ${strategy.name}:`, signal)
      
      if (signal && signal !== 'NEUTRAL') {
        const currentCandle = candles[candles.length - 1]
        const quadrant = getQuadrant(currentCandle.hour, currentCandle.minute)
        console.log(`📍 Quadrante atual: ${quadrant} (${currentCandle.hour}:${currentCandle.minute})`)
        
        // Buscar dados REAIS de acertividade da estratégia
        const { data: strategyData, error } = await supabase
          .from('accuracy_cycles')
          .select('*')
          .eq('strategy_name', strategy.name)
          .eq('pair', 'SOLUSDT')
          .eq('timeframe', selectedTimeframe)
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) {
          console.error(`❌ Erro ao buscar dados da estratégia ${strategy.name}:`, error)
          continue
        }

        // Calcular acertividade REAL baseada nos dados históricos
        let totalSignals = 0
        let correctSignals = 0
        let realAccuracy = 0

        if (strategyData && strategyData.length > 0) {
          totalSignals = strategyData.reduce((sum, cycle) => sum + cycle.total_signals, 0)
          correctSignals = strategyData.reduce((sum, cycle) => sum + cycle.correct_signals, 0)
          realAccuracy = totalSignals > 0 ? (correctSignals / totalSignals) * 100 : 0
        }

        // Buscar dados específicos do quadrante atual
        const { data: quadrantData } = await supabase
          .from('accuracy_cycles')
          .select('*')
          .eq('strategy_name', strategy.name)
          .eq('pair', 'SOLUSDT')
          .eq('timeframe', selectedTimeframe)
          .eq('start_hour', currentCandle.hour)
          .order('created_at', { ascending: false })
          .limit(5)

        let quadrantAccuracy = realAccuracy
        if (quadrantData && quadrantData.length > 0) {
          const quadrantTotal = quadrantData.reduce((sum, cycle) => sum + cycle.total_signals, 0)
          const quadrantCorrect = quadrantData.reduce((sum, cycle) => sum + cycle.correct_signals, 0)
          quadrantAccuracy = quadrantTotal > 0 ? (quadrantCorrect / quadrantTotal) * 100 : realAccuracy
        }
        
        results.push({
          strategy_name: strategy.name,
          signal,
          confidence: quadrantAccuracy,
          accuracy: realAccuracy,
          total_signals: totalSignals,
          correct_signals: correctSignals,
          quadrant,
          time_window: `${currentCandle.hour.toString().padStart(2, '0')}:${currentCandle.minute.toString().padStart(2, '0')}`
        })

        // Atualizar estatísticas do quadrante
        if (!quadrantMap.has(quadrant)) {
          quadrantMap.set(quadrant, { total: 0, correct: 0 })
        }
        const stats = quadrantMap.get(quadrant)!
        stats.total += totalSignals
        stats.correct += correctSignals
      }
    }

    // Calcular estatísticas por quadrante
    const quadrantStats: QuadrantStats[] = []
    quadrantMap.forEach((stats, quadrant) => {
      const accuracy = (stats.correct / stats.total) * 100
      const bestStrategies = results
        .filter(r => r.quadrant === quadrant)
        .sort((a, b) => b.accuracy - a.accuracy)
        .slice(0, 2)
        .map(r => r.strategy_name)
      
      const worstStrategies = results
        .filter(r => r.quadrant === quadrant)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 2)
        .map(r => r.strategy_name)

      quadrantStats.push({
        quadrant,
        total_signals: stats.total,
        correct_signals: stats.correct,
        accuracy,
        best_strategies: bestStrategies,
        worst_strategies: worstStrategies
      })
    })

    console.log(`🎯 Total de estratégias com sinal: ${results.length}`)
    console.log(`📊 Resultados:`, results)
    
    setStrategyResults(results)
    setQuadrantStats(quadrantStats.sort((a, b) => a.quadrant - b.quadrant))
  }

  // Carregar dados em tempo real
  const loadRealTimeData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Carregando dados em tempo real...')

      const { data, error } = await supabase
        .from('realtime_candle_data')
        .select('*')
        .eq('pair', 'SOLUSDT')
        .eq('timeframe', selectedTimeframe)
        .order('timestamp', { ascending: true })
        .limit(100) // Últimas 100 velas

      if (error) {
        console.error('❌ Erro ao carregar dados:', error)
        return
      }

      const candlesData: CandleData[] = (data || []).map(candle => ({
        timestamp: candle.timestamp,
        open_price: candle.open_price,
        close_price: candle.close_price,
        color: candle.color,
        hour: candle.hour,
        minute: candle.minute,
        time_key: candle.time_key
      }))

      setCandles(candlesData)
      await analyzeStrategies(candlesData)
      
      console.log(`✅ ${candlesData.length} candles carregados`)

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRealTimeData()
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadRealTimeData, 30000)
    return () => clearInterval(interval)
  }, [selectedDate, selectedTimeframe])

  return React.createElement('div', { style: { padding: '24px' } },
    // Cabeçalho
    React.createElement('div', { style: { marginBottom: '32px' } },
      React.createElement('h2', { 
        style: { 
          fontSize: '1.875rem', 
          fontWeight: 'bold', 
          marginBottom: '16px',
          color: 'white'
        } 
      }, 'Análise de Estratégias em Tempo Real'),
      React.createElement('p', { 
        style: { color: '#9ca3af' } 
      }, 'Análise probabilística por vela com estatísticas de acertividade por quadrante')
    ),

    // Estatísticas por Quadrante
    React.createElement('div', { style: { marginBottom: '32px' } },
      React.createElement('h3', { 
        style: { 
          fontSize: '1.25rem', 
          fontWeight: 'bold', 
          marginBottom: '16px',
          color: 'white'
        } 
      }, 'Estatísticas por Quadrante (15min)'),
      
      React.createElement('div', { 
        style: { 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '16px' 
        } 
      },
        quadrantStats.map(quadrant => 
          React.createElement('div', { 
            key: quadrant.quadrant,
            style: { 
              backgroundColor: '#1f2937', 
              padding: '20px', 
              borderRadius: '12px',
              border: '1px solid #374151',
              borderLeft: `4px solid ${quadrant.accuracy >= 80 ? '#4ade80' : quadrant.accuracy >= 60 ? '#f59e0b' : '#ef4444'}`
            } 
          },
            React.createElement('div', { 
              style: { 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px'
              } 
            },
              React.createElement('h4', { 
                style: { 
                  fontSize: '1.125rem', 
                  fontWeight: 'bold',
                  color: 'white'
                } 
              }, `Quadrante ${quadrant.quadrant}`),
              React.createElement('div', { 
                style: { 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold',
                  color: quadrant.accuracy >= 80 ? '#4ade80' : quadrant.accuracy >= 60 ? '#f59e0b' : '#ef4444'
                } 
              }, `${quadrant.accuracy.toFixed(1)}%`)
            ),
            React.createElement('div', { 
              style: { 
                fontSize: '0.875rem', 
                color: '#9ca3af',
                marginBottom: '8px'
              } 
            }, `Sinais: ${quadrant.correct_signals}/${quadrant.total_signals}`),
            React.createElement('div', { 
              style: { 
                fontSize: '0.875rem', 
                color: '#9ca3af'
              } 
            }, `Melhores: ${quadrant.best_strategies.join(', ')}`)
          )
        )
      )
    ),

    // Resultados das Estratégias
    React.createElement('div', { style: { marginBottom: '32px' } },
      React.createElement('h3', { 
        style: { 
          fontSize: '1.25rem', 
          fontWeight: 'bold', 
          marginBottom: '16px',
          color: 'white'
        } 
      }, 'Sinais Atuais das Estratégias'),
      
      loading ? (
        React.createElement('p', { 
          style: { 
            textAlign: 'center', 
            color: '#9ca3af' 
          } 
        }, 'Carregando análise...')
      ) : strategyResults.length === 0 ? (
        React.createElement('p', { 
          style: { 
            textAlign: 'center', 
            color: '#9ca3af' 
          } 
        }, 'Nenhum sinal ativo no momento')
      ) : (
        React.createElement('div', { 
          style: { 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '16px' 
          } 
        },
          strategyResults.map((result, index) => 
            React.createElement('div', { 
              key: index,
              style: { 
                backgroundColor: '#1f2937', 
                padding: '20px', 
                borderRadius: '12px',
                border: '1px solid #374151',
                borderLeft: `4px solid ${result.signal === 'CALL' ? '#4ade80' : result.signal === 'PUT' ? '#ef4444' : '#6b7280'}`
              } 
            },
              React.createElement('div', { 
                style: { 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '12px'
                } 
              },
                React.createElement('h4', { 
                  style: { 
                    fontSize: '1.125rem', 
                    fontWeight: 'bold',
                    color: 'white'
                  } 
                }, result.strategy_name),
                React.createElement('div', { 
                  style: { 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold',
                    color: result.signal === 'CALL' ? '#4ade80' : result.signal === 'PUT' ? '#ef4444' : '#6b7280'
                  } 
                }, result.signal)
              ),
              React.createElement('div', { 
                style: { 
                  fontSize: '0.875rem', 
                  color: '#9ca3af',
                  marginBottom: '8px'
                } 
              }, `Confiança: ${result.confidence.toFixed(1)}%`),
              React.createElement('div', { 
                style: { 
                  fontSize: '0.875rem', 
                  color: '#9ca3af',
                  marginBottom: '8px'
                } 
              }, `Acertividade: ${result.accuracy.toFixed(1)}%`),
              React.createElement('div', { 
                style: { 
                  fontSize: '0.875rem', 
                  color: '#9ca3af'
                } 
              }, `Quadrante ${result.quadrant} - ${result.time_window}`)
            )
          )
        )
      )
    ),

    // Última Vela
    React.createElement('div', { style: { marginBottom: '32px' } },
      React.createElement('h3', { 
        style: { 
          fontSize: '1.25rem', 
          fontWeight: 'bold', 
          marginBottom: '16px',
          color: 'white'
        } 
      }, 'Última Vela Analisada'),
      
      candles.length > 0 ? (
        React.createElement('div', { 
          style: { 
            backgroundColor: '#1f2937', 
            padding: '20px', 
            borderRadius: '12px',
            border: '1px solid #374151'
          } 
        },
          React.createElement('div', { 
            style: { 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '12px'
            } 
          },
            React.createElement('h4', { 
              style: { 
                fontSize: '1.125rem', 
                fontWeight: 'bold',
                color: 'white'
              } 
            }, `Vela ${candles.length}`),
            React.createElement('div', { 
              style: { 
                fontSize: '1.25rem', 
                fontWeight: 'bold',
                color: candles[candles.length - 1].color === 'GREEN' ? '#4ade80' : '#ef4444'
              } 
            }, candles[candles.length - 1].color)
          ),
          React.createElement('div', { 
            style: { 
              fontSize: '0.875rem', 
              color: '#9ca3af',
              marginBottom: '8px'
            } 
          }, `Horário: ${candles[candles.length - 1].time_key}`),
          React.createElement('div', { 
            style: { 
              fontSize: '0.875rem', 
              color: '#9ca3af',
              marginBottom: '8px'
            } 
          }, `Abertura: $${candles[candles.length - 1].open_price.toFixed(4)}`),
          React.createElement('div', { 
            style: { 
              fontSize: '0.875rem', 
              color: '#9ca3af'
            } 
          }, `Fechamento: $${candles[candles.length - 1].close_price.toFixed(4)}`)
        )
      ) : (
        React.createElement('p', { 
          style: { 
            textAlign: 'center', 
            color: '#9ca3af' 
          } 
        }, 'Nenhuma vela carregada')
      )
    )
  )
}
