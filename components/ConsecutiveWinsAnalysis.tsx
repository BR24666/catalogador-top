'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lgddsslskhzxtpjathjr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws'
const supabase = createClient(supabaseUrl, supabaseKey)

interface ConsecutiveWinData {
  strategy_name: string
  min_consecutive_wins: number
  max_consecutive_wins: number
  avg_consecutive_wins: number
  total_100_percent_cycles: number
  total_cycles: number
  win_sequences: {
    sequence_length: number
    occurrences: number
    percentage: number
  }[]
  hourly_distribution: {
    hour: number
    occurrences: number
    percentage: number
  }[]
  daily_distribution: {
    day: number
    day_name: string
    occurrences: number
    percentage: number
  }[]
  weekly_distribution: {
    week: string
    occurrences: number
    percentage: number
  }[]
}

interface PerfectCycle {
  strategy_name: string
  start_timestamp: string
  end_timestamp: string
  duration_minutes: number
  consecutive_wins: number
  total_signals: number
  accuracy: number
  hour: number
  day: number
  week: string
}

interface ConsecutiveWinsAnalysisProps {
  selectedDate: string
  selectedTimeframe: string
}

export default function ConsecutiveWinsAnalysis({ selectedDate, selectedTimeframe }: ConsecutiveWinsAnalysisProps) {
  const [consecutiveData, setConsecutiveData] = useState<ConsecutiveWinData[]>([])
  const [perfectCycles, setPerfectCycles] = useState<PerfectCycle[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<string>('all')
  const [dataSummary, setDataSummary] = useState<any>(null)

  // Analisar wins consecutivos
  const analyzeConsecutiveWins = async () => {
    try {
      setLoading(true)
      console.log('🔍 Analisando wins consecutivos...')

      // Buscar dados históricos
      const { data: historicalData, error: historicalError } = await supabase
        .from('historical_candle_data')
        .select('*')
        .eq('pair', 'SOLUSDT')
        .eq('timeframe', selectedTimeframe)
        .order('timestamp', { ascending: true })

      if (historicalError) {
        console.error('❌ Erro ao buscar dados históricos:', historicalError)
        return
      }

      // Buscar dados de tempo real
      const { data: realtimeData, error: realtimeError } = await supabase
        .from('realtime_candle_data')
        .select('*')
        .eq('pair', 'SOLUSDT')
        .eq('timeframe', selectedTimeframe)
        .order('timestamp', { ascending: true })

      if (realtimeError) {
        console.error('❌ Erro ao buscar dados de tempo real:', realtimeError)
        return
      }

      // Combinar dados
      const allData = [...(historicalData || []), ...(realtimeData || [])]
      console.log(`📊 Total de dados: ${allData.length} candles`)

      // Resumo dos dados
      const summary = {
        total_candles: allData.length,
        historical_candles: historicalData?.length || 0,
        realtime_candles: realtimeData?.length || 0,
        date_range: {
          start: allData[0]?.timestamp,
          end: allData[allData.length - 1]?.timestamp
        },
        days_covered: Math.ceil((new Date(allData[allData.length - 1]?.timestamp).getTime() - new Date(allData[0]?.timestamp).getTime()) / (1000 * 60 * 60 * 24))
      }
      setDataSummary(summary)

      // Estratégias para analisar
      const strategies = [
        { name: 'MHI', analyze: analyzeMHI },
        { name: 'Minoria', analyze: analyzeMinoria },
        { name: 'Três Soldados', analyze: analyzeTresSoldados },
        { name: 'Alternância 2x2', analyze: analyzeAlternancia },
        { name: 'Vela de Força', analyze: analyzeVelaForca }
      ]

      const consecutiveResults: ConsecutiveWinData[] = []
      const perfectCyclesList: PerfectCycle[] = []

      for (const strategy of strategies) {
        console.log(`🔍 Analisando estratégia: ${strategy.name}`)
        const result = await strategy.analyze(allData)
        consecutiveResults.push(result.consecutiveData)
        perfectCyclesList.push(...result.perfectCycles)
      }

      setConsecutiveData(consecutiveResults)
      setPerfectCycles(perfectCyclesList.sort((a, b) => b.consecutive_wins - a.consecutive_wins))

    } catch (error) {
      console.error('❌ Erro ao analisar wins consecutivos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Analisar estratégia MHI
  const analyzeMHI = (data: any[]) => {
    const cycles: any[] = []
    const perfectCycles: PerfectCycle[] = []

    for (let i = 3; i < data.length; i++) {
      const last3 = data.slice(i - 3, i)
      const current = data[i]
      
      const greens = last3.filter(c => c.color === 'GREEN').length
      const reds = last3.filter(c => c.color === 'RED').length
      const mhiSignal = greens > reds ? 'GREEN' : 'RED'
      
      if (current.color === mhiSignal) {
        cycles.push({
          timestamp: current.timestamp,
          signal: mhiSignal,
          result: 'WIN',
          hour: current.hour,
          day: current.day_of_week || 0
        })
      } else {
        cycles.push({
          timestamp: current.timestamp,
          signal: mhiSignal,
          result: 'LOSS',
          hour: current.hour,
          day: current.day_of_week || 0
        })
      }
    }

    // Encontrar sequências de wins consecutivos
    const winSequences = findWinSequences(cycles)
    const perfectCyclesData = findPerfectCycles(cycles, 'MHI')
    perfectCycles.push(...perfectCyclesData)

    return {
      consecutiveData: calculateConsecutiveStats(winSequences, 'MHI'),
      perfectCycles: perfectCyclesData
    }
  }

  // Analisar estratégia Minoria
  const analyzeMinoria = (data: any[]) => {
    const cycles: any[] = []
    const perfectCycles: PerfectCycle[] = []

    for (let i = 3; i < data.length; i++) {
      const last3 = data.slice(i - 3, i)
      const current = data[i]
      
      const greens = last3.filter(c => c.color === 'GREEN').length
      const reds = last3.filter(c => c.color === 'RED').length
      const minoritySignal = greens > reds ? 'RED' : 'GREEN' // Inverso da MHI
      
      if (current.color === minoritySignal) {
        cycles.push({
          timestamp: current.timestamp,
          signal: minoritySignal,
          result: 'WIN',
          hour: current.hour,
          day: current.day_of_week || 0
        })
      } else {
        cycles.push({
          timestamp: current.timestamp,
          signal: minoritySignal,
          result: 'LOSS',
          hour: current.hour,
          day: current.day_of_week || 0
        })
      }
    }

    const winSequences = findWinSequences(cycles)
    const perfectCyclesData = findPerfectCycles(cycles, 'Minoria')
    perfectCycles.push(...perfectCyclesData)

    return {
      consecutiveData: calculateConsecutiveStats(winSequences, 'Minoria'),
      perfectCycles: perfectCyclesData
    }
  }

  // Analisar estratégia Três Soldados
  const analyzeTresSoldados = (data: any[]) => {
    const cycles: any[] = []
    const perfectCycles: PerfectCycle[] = []

    for (let i = 3; i < data.length; i++) {
      const last3 = data.slice(i - 3, i)
      const current = data[i]
      
      const allGreen = last3.every(c => c.color === 'GREEN')
      const allRed = last3.every(c => c.color === 'RED')
      
      let signal = null
      if (allGreen) signal = 'GREEN'
      else if (allRed) signal = 'RED'
      
      if (signal && current.color === signal) {
        cycles.push({
          timestamp: current.timestamp,
          signal: signal,
          result: 'WIN',
          hour: current.hour,
          day: current.day_of_week || 0
        })
      } else if (signal) {
        cycles.push({
          timestamp: current.timestamp,
          signal: signal,
          result: 'LOSS',
          hour: current.hour,
          day: current.day_of_week || 0
        })
      }
    }

    const winSequences = findWinSequences(cycles)
    const perfectCyclesData = findPerfectCycles(cycles, 'Três Soldados')
    perfectCycles.push(...perfectCyclesData)

    return {
      consecutiveData: calculateConsecutiveStats(winSequences, 'Três Soldados'),
      perfectCycles: perfectCyclesData
    }
  }

  // Analisar estratégia Alternância 2x2
  const analyzeAlternancia = (data: any[]) => {
    const cycles: any[] = []
    const perfectCycles: PerfectCycle[] = []

    for (let i = 4; i < data.length; i++) {
      const last4 = data.slice(i - 4, i)
      const current = data[i]
      
      const pattern = last4.map(c => c.color).join(',')
      let signal = null
      
      if (pattern === 'GREEN,GREEN,RED,RED') {
        signal = 'GREEN'
      } else if (pattern === 'RED,RED,GREEN,GREEN') {
        signal = 'RED'
      }
      
      if (signal && current.color === signal) {
        cycles.push({
          timestamp: current.timestamp,
          signal: signal,
          result: 'WIN',
          hour: current.hour,
          day: current.day_of_week || 0
        })
      } else if (signal) {
        cycles.push({
          timestamp: current.timestamp,
          signal: signal,
          result: 'LOSS',
          hour: current.hour,
          day: current.day_of_week || 0
        })
      }
    }

    const winSequences = findWinSequences(cycles)
    const perfectCyclesData = findPerfectCycles(cycles, 'Alternância 2x2')
    perfectCycles.push(...perfectCyclesData)

    return {
      consecutiveData: calculateConsecutiveStats(winSequences, 'Alternância 2x2'),
      perfectCycles: perfectCyclesData
    }
  }

  // Analisar estratégia Vela de Força
  const analyzeVelaForca = (data: any[]) => {
    const cycles: any[] = []
    const perfectCycles: PerfectCycle[] = []

    for (let i = 4; i < data.length; i++) {
      const last4 = data.slice(i - 4, i)
      const current = data[i]
      
      const first3 = last4.slice(0, 3)
      const last1 = last4[3]
      
      const allSame = first3.every(c => c.color === first3[0].color)
      const opposite = last1.color !== first3[0].color
      
      if (allSame && opposite) {
        const signal = last1.color
        if (current.color === signal) {
          cycles.push({
            timestamp: current.timestamp,
            signal: signal,
            result: 'WIN',
            hour: current.hour,
            day: current.day_of_week || 0
          })
        } else {
          cycles.push({
            timestamp: current.timestamp,
            signal: signal,
            result: 'LOSS',
            hour: current.hour,
            day: current.day_of_week || 0
          })
        }
      }
    }

    const winSequences = findWinSequences(cycles)
    const perfectCyclesData = findPerfectCycles(cycles, 'Vela de Força')
    perfectCycles.push(...perfectCyclesData)

    return {
      consecutiveData: calculateConsecutiveStats(winSequences, 'Vela de Força'),
      perfectCycles: perfectCyclesData
    }
  }

  // Encontrar sequências de wins
  const findWinSequences = (cycles: any[]) => {
    const sequences: number[] = []
    let currentSequence = 0

    for (const cycle of cycles) {
      if (cycle.result === 'WIN') {
        currentSequence++
      } else {
        if (currentSequence > 0) {
          sequences.push(currentSequence)
        }
        currentSequence = 0
      }
    }

    if (currentSequence > 0) {
      sequences.push(currentSequence)
    }

    return sequences
  }

  // Encontrar ciclos perfeitos (100% acertividade)
  const findPerfectCycles = (cycles: any[], strategyName: string) => {
    const perfectCycles: PerfectCycle[] = []
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

    // Agrupar por hora para encontrar ciclos perfeitos
    const hourlyGroups = new Map<number, any[]>()
    cycles.forEach(cycle => {
      if (!hourlyGroups.has(cycle.hour)) {
        hourlyGroups.set(cycle.hour, [])
      }
      hourlyGroups.get(cycle.hour)!.push(cycle)
    })

    hourlyGroups.forEach((hourCycles, hour) => {
      // Encontrar sequências de wins consecutivos nesta hora
      const winSequences = findWinSequences(hourCycles)
      
      winSequences.forEach(consecutiveWins => {
        if (consecutiveWins >= 3) { // Mínimo de 3 wins consecutivos
          const startCycle = hourCycles.find(c => c.result === 'WIN')
          const endCycle = hourCycles[hourCycles.length - 1]
          
          if (startCycle && endCycle) {
            const startDate = new Date(startCycle.timestamp)
            const endDate = new Date(endCycle.timestamp)
            const durationMinutes = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60))
            
            perfectCycles.push({
              strategy_name: strategyName,
              start_timestamp: startCycle.timestamp,
              end_timestamp: endCycle.timestamp,
              duration_minutes: durationMinutes,
              consecutive_wins: consecutiveWins,
              total_signals: hourCycles.length,
              accuracy: 100,
              hour: hour,
              day: startCycle.day,
              week: getWeekString(startDate)
            })
          }
        }
      })
    })

    return perfectCycles
  }

  // Calcular estatísticas de wins consecutivos
  const calculateConsecutiveStats = (winSequences: number[], strategyName: string) => {
    if (winSequences.length === 0) {
      return {
        strategy_name: strategyName,
        min_consecutive_wins: 0,
        max_consecutive_wins: 0,
        avg_consecutive_wins: 0,
        total_100_percent_cycles: 0,
        total_cycles: 0,
        win_sequences: [],
        hourly_distribution: [],
        daily_distribution: [],
        weekly_distribution: []
      }
    }

    const minWins = Math.min(...winSequences)
    const maxWins = Math.max(...winSequences)
    const avgWins = winSequences.reduce((sum, wins) => sum + wins, 0) / winSequences.length
    const perfectCycles = winSequences.filter(wins => wins >= 3).length

    // Distribuição por sequência
    const sequenceDistribution = new Map<number, number>()
    winSequences.forEach(wins => {
      sequenceDistribution.set(wins, (sequenceDistribution.get(wins) || 0) + 1)
    })

    const winSequencesData = Array.from(sequenceDistribution.entries())
      .map(([length, occurrences]) => ({
        sequence_length: length,
        occurrences,
        percentage: (occurrences / winSequences.length) * 100
      }))
      .sort((a, b) => b.sequence_length - a.sequence_length)

    return {
      strategy_name: strategyName,
      min_consecutive_wins: minWins,
      max_consecutive_wins: maxWins,
      avg_consecutive_wins: avgWins,
      total_100_percent_cycles: perfectCycles,
      total_cycles: winSequences.length,
      win_sequences: winSequencesData,
      hourly_distribution: [], // Será preenchido depois
      daily_distribution: [], // Será preenchido depois
      weekly_distribution: [] // Será preenchido depois
    }
  }

  // Obter string da semana
  const getWeekString = (date: Date) => {
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    
    return `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1} - ${endOfWeek.getDate()}/${endOfWeek.getMonth() + 1}`
  }

  useEffect(() => {
    analyzeConsecutiveWins()
  }, [selectedDate, selectedTimeframe])

  const filteredData = selectedStrategy === 'all' 
    ? consecutiveData 
    : consecutiveData.filter(s => s.strategy_name === selectedStrategy)

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
      }, 'Análise de Wins Consecutivos - 100% Acertividade'),
      React.createElement('p', { 
        style: { color: '#9ca3af' } 
      }, 'Identificação de wins consecutivos mínimos quando estratégias atingem 100% de acertividade')
    ),

    // Resumo dos Dados
    dataSummary && React.createElement('div', { 
      style: { 
        backgroundColor: '#1f2937', 
        padding: '20px', 
        borderRadius: '12px',
        marginBottom: '24px',
        border: '1px solid #374151'
      } 
    },
      React.createElement('h3', { 
        style: { 
          fontSize: '1.25rem', 
          fontWeight: 'bold', 
          marginBottom: '16px',
          color: 'white'
        } 
      }, 'Resumo dos Dados Disponíveis'),
      React.createElement('div', { 
        style: { 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px' 
        } 
      },
        React.createElement('div', null,
          React.createElement('div', { 
            style: { 
              fontSize: '0.875rem', 
              color: '#9ca3af',
              marginBottom: '4px'
            } 
          }, 'Total de Candles'),
          React.createElement('div', { 
            style: { 
              fontSize: '1.5rem', 
              fontWeight: 'bold',
              color: 'white'
            } 
          }, dataSummary.total_candles.toLocaleString())
        ),
        React.createElement('div', null,
          React.createElement('div', { 
            style: { 
              fontSize: '0.875rem', 
              color: '#9ca3af',
              marginBottom: '4px'
            } 
          }, 'Dados Históricos'),
          React.createElement('div', { 
            style: { 
              fontSize: '1.5rem', 
              fontWeight: 'bold',
              color: '#4ade80'
            } 
          }, dataSummary.historical_candles.toLocaleString())
        ),
        React.createElement('div', null,
          React.createElement('div', { 
            style: { 
              fontSize: '0.875rem', 
              color: '#9ca3af',
              marginBottom: '4px'
            } 
          }, 'Dados Tempo Real'),
          React.createElement('div', { 
            style: { 
              fontSize: '1.5rem', 
              fontWeight: 'bold',
              color: '#60a5fa'
            } 
          }, dataSummary.realtime_candles.toLocaleString())
        ),
        React.createElement('div', null,
          React.createElement('div', { 
            style: { 
              fontSize: '0.875rem', 
              color: '#9ca3af',
              marginBottom: '4px'
            } 
          }, 'Dias Cobertos'),
          React.createElement('div', { 
            style: { 
              fontSize: '1.5rem', 
              fontWeight: 'bold',
              color: 'white'
            } 
          }, `${dataSummary.days_covered} dias`)
        )
      )
    ),

    // Filtro de Estratégia
    React.createElement('div', { style: { marginBottom: '24px' } },
      React.createElement('label', { 
        style: { 
          display: 'block', 
          color: '#9ca3af', 
          marginBottom: '8px' 
        } 
      }, 'Filtrar por Estratégia:'),
      React.createElement('select', {
        value: selectedStrategy,
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedStrategy(e.target.value),
        style: {
          width: '100%',
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid #4b5563',
          backgroundColor: '#1f2937',
          color: 'white',
          fontSize: '1rem'
        }
      },
        React.createElement('option', { value: 'all' }, 'Todas as Estratégias'),
        ...consecutiveData.map(strategy =>
          React.createElement('option', { key: strategy.strategy_name, value: strategy.strategy_name }, strategy.strategy_name)
        )
      )
    ),

    // Estatísticas de Wins Consecutivos
    React.createElement('div', { style: { marginBottom: '32px' } },
      React.createElement('h3', { 
        style: { 
          fontSize: '1.25rem', 
          fontWeight: 'bold', 
          marginBottom: '16px',
          color: 'white'
        } 
      }, 'Estatísticas de Wins Consecutivos'),
      
      loading ? (
        React.createElement('p', { 
          style: { 
            textAlign: 'center', 
            color: '#9ca3af' 
          } 
        }, 'Analisando wins consecutivos...')
      ) : filteredData.length === 0 ? (
        React.createElement('p', { 
          style: { 
            textAlign: 'center', 
            color: '#9ca3af' 
          } 
        }, 'Nenhuma estratégia encontrada')
      ) : (
        React.createElement('div', { 
          style: { 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '16px' 
          } 
        },
          filteredData.map((strategy, index) => 
            React.createElement('div', { 
              key: index,
              style: { 
                backgroundColor: '#1f2937', 
                padding: '24px', 
                borderRadius: '12px',
                border: '1px solid #374151',
                borderLeft: `4px solid ${strategy.total_100_percent_cycles > 0 ? '#4ade80' : '#ef4444'}`
              } 
            },
              React.createElement('div', { 
                style: { 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '20px'
                } 
              },
                React.createElement('h4', { 
                  style: { 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold',
                    color: 'white'
                  } 
                }, strategy.strategy_name),
                React.createElement('div', { 
                  style: { 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold',
                    color: strategy.total_100_percent_cycles > 0 ? '#4ade80' : '#ef4444'
                  } 
                }, `${strategy.total_100_percent_cycles} ciclos perfeitos`)
              ),

              React.createElement('div', { 
                style: { 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                  gap: '16px',
                  marginBottom: '20px'
                } 
              },
                React.createElement('div', null,
                  React.createElement('div', { 
                    style: { 
                      fontSize: '0.875rem', 
                      color: '#9ca3af',
                      marginBottom: '4px'
                    } 
                  }, 'Mín. Wins Consecutivos'),
                  React.createElement('div', { 
                    style: { 
                      fontSize: '1.25rem', 
                      fontWeight: 'bold',
                      color: 'white'
                    } 
                  }, strategy.min_consecutive_wins)
                ),
                React.createElement('div', null,
                  React.createElement('div', { 
                    style: { 
                      fontSize: '0.875rem', 
                      color: '#9ca3af',
                      marginBottom: '4px'
                    } 
                  }, 'Máx. Wins Consecutivos'),
                  React.createElement('div', { 
                    style: { 
                      fontSize: '1.25rem', 
                      fontWeight: 'bold',
                      color: '#4ade80'
                    } 
                  }, strategy.max_consecutive_wins)
                ),
                React.createElement('div', null,
                  React.createElement('div', { 
                    style: { 
                      fontSize: '0.875rem', 
                      color: '#9ca3af',
                      marginBottom: '4px'
                    } 
                  }, 'Média Wins Consecutivos'),
                  React.createElement('div', { 
                    style: { 
                      fontSize: '1.25rem', 
                      fontWeight: 'bold',
                      color: 'white'
                    } 
                  }, strategy.avg_consecutive_wins.toFixed(1))
                ),
                React.createElement('div', null,
                  React.createElement('div', { 
                    style: { 
                      fontSize: '0.875rem', 
                      color: '#9ca3af',
                      marginBottom: '4px'
                    } 
                  }, 'Total de Ciclos'),
                  React.createElement('div', { 
                    style: { 
                      fontSize: '1.25rem', 
                      fontWeight: 'bold',
                      color: 'white'
                    } 
                  }, strategy.total_cycles)
                )
              ),

              // Distribuição de Sequências
              strategy.win_sequences.length > 0 && React.createElement('div', { 
                style: { 
                  marginBottom: '20px'
                } 
              },
                React.createElement('h5', { 
                  style: { 
                    fontSize: '1rem', 
                    fontWeight: 'bold',
                    color: 'white',
                    marginBottom: '12px'
                  } 
                }, 'Distribuição de Sequências de Wins:'),
                React.createElement('div', { 
                  style: { 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '8px'
                  } 
                },
                  strategy.win_sequences.slice(0, 5).map((seq, idx) => 
                    React.createElement('div', { 
                      key: idx,
                      style: { 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#374151',
                        borderRadius: '6px'
                      } 
                    },
                      React.createElement('span', { 
                        style: { 
                          color: 'white',
                          fontWeight: '500'
                        } 
                      }, `${seq.sequence_length} wins consecutivos`),
                      React.createElement('span', { 
                        style: { 
                          color: '#4ade80',
                          fontWeight: 'bold'
                        } 
                      }, `${seq.occurrences} vezes (${seq.percentage.toFixed(1)}%)`)
                    )
                  )
                )
              )
            )
          )
        )
      )
    ),

    // Ciclos Perfeitos
    React.createElement('div', { style: { marginBottom: '32px' } },
      React.createElement('h3', { 
        style: { 
          fontSize: '1.25rem', 
          fontWeight: 'bold', 
          marginBottom: '16px',
          color: 'white'
        } 
      }, 'Ciclos Perfeitos (100% Acertividade)'),
      
      perfectCycles.length === 0 ? (
        React.createElement('p', { 
          style: { 
            textAlign: 'center', 
            color: '#9ca3af' 
          } 
        }, 'Nenhum ciclo perfeito encontrado')
      ) : (
        React.createElement('div', { 
          style: { 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: '16px' 
          } 
        },
          perfectCycles.slice(0, 20).map((cycle, index) => 
            React.createElement('div', { 
              key: index,
              style: { 
                backgroundColor: '#1f2937', 
                padding: '20px', 
                borderRadius: '12px',
                border: '1px solid #374151',
                borderLeft: `4px solid #4ade80`
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
                }, cycle.strategy_name),
                React.createElement('div', { 
                  style: { 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold',
                    color: '#4ade80'
                  } 
                }, `${cycle.consecutive_wins} wins`)
              ),
              React.createElement('div', { 
                style: { 
                  fontSize: '0.875rem', 
                  color: '#9ca3af',
                  marginBottom: '8px'
                } 
              }, `Duração: ${cycle.duration_minutes} minutos`),
              React.createElement('div', { 
                style: { 
                  fontSize: '0.875rem', 
                  color: '#9ca3af',
                  marginBottom: '8px'
                } 
              }, `Horário: ${cycle.hour}h`),
              React.createElement('div', { 
                style: { 
                  fontSize: '0.875rem', 
                  color: '#9ca3af',
                  marginBottom: '8px'
                } 
              }, `Dia: ${cycle.day}`),
              React.createElement('div', { 
                style: { 
                  fontSize: '0.875rem', 
                  color: '#9ca3af',
                  marginBottom: '8px'
                } 
              }, `Semana: ${cycle.week}`),
              React.createElement('div', { 
                style: { 
                  fontSize: '0.875rem', 
                  color: '#9ca3af'
                } 
              }, `Início: ${new Date(cycle.start_timestamp).toLocaleString('pt-BR')}`)
            )
          )
        )
      )
    )
  )
}
