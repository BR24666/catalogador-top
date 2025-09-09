'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lgddsslskhzxtpjathjr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws'
const supabase = createClient(supabaseUrl, supabaseKey)

interface HistoricalData {
  timestamp: string
  open_price: number
  close_price: number
  color: 'GREEN' | 'RED'
  hour: number
  minute: number
  day_of_week: number
  month: number
  time_key: string
}

interface CrossAnalysisResult {
  pattern: string
  frequency: number
  accuracy: number
  confidence: number
  best_hours: number[]
  best_days: number[]
  best_months: number[]
  total_occurrences: number
  correct_predictions: number
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
  recommendation: string
}

interface TemporalPattern {
  time_period: string
  total_signals: number
  accuracy: number
  best_strategies: string[]
  worst_strategies: string[]
  confidence_score: number
}

interface HistoricalCrossAnalysisProps {
  selectedDate: string
  selectedTimeframe: string
}

export default function HistoricalCrossAnalysis({ selectedDate, selectedTimeframe }: HistoricalCrossAnalysisProps) {
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [crossAnalysis, setCrossAnalysis] = useState<CrossAnalysisResult[]>([])
  const [temporalPatterns, setTemporalPatterns] = useState<TemporalPattern[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPattern, setSelectedPattern] = useState<string>('all')

  // Padrões de análise cruzada
  const patterns = [
    {
      name: 'MHI_Hour_Cross',
      description: 'MHI cruzado com horário',
      analyze: (data: HistoricalData[]) => {
        const results: { [key: string]: { total: number, correct: number } } = {}
        
        for (let i = 3; i < data.length; i++) {
          const last3 = data.slice(i - 3, i)
          const current = data[i]
          
          const greens = last3.filter(c => c.color === 'GREEN').length
          const reds = last3.filter(c => c.color === 'RED').length
          const mhiSignal = greens > reds ? 'GREEN' : 'RED'
          
          const key = `${mhiSignal}_${current.hour}`
          if (!results[key]) results[key] = { total: 0, correct: 0 }
          
          results[key].total++
          if (current.color === mhiSignal) results[key].correct++
        }
        
        return Object.entries(results).map(([pattern, stats]) => ({
          pattern: `MHI ${pattern.split('_')[0]} às ${pattern.split('_')[1]}h`,
          frequency: stats.total,
          accuracy: (stats.correct / stats.total) * 100,
          confidence: Math.min(95, (stats.correct / stats.total) * 100 + 10),
          best_hours: [parseInt(pattern.split('_')[1])],
          best_days: [],
          best_months: [],
          total_occurrences: stats.total,
          correct_predictions: stats.correct,
          risk_level: stats.total < 10 ? 'HIGH' : stats.total < 50 ? 'MEDIUM' : 'LOW',
          recommendation: stats.total < 10 ? 'Dados insuficientes' : 
                         (stats.correct / stats.total) > 0.7 ? 'Alta confiança' : 
                         (stats.correct / stats.total) > 0.6 ? 'Média confiança' : 'Baixa confiança'
        }))
      }
    },
    {
      name: 'DayOfWeek_Pattern',
      description: 'Padrão por dia da semana',
      analyze: (data: HistoricalData[]) => {
        const results: { [key: string]: { total: number, correct: number } } = {}
        
        for (let i = 3; i < data.length; i++) {
          const last3 = data.slice(i - 3, i)
          const current = data[i]
          
          const greens = last3.filter(c => c.color === 'GREEN').length
          const reds = last3.filter(c => c.color === 'RED').length
          const mhiSignal = greens > reds ? 'GREEN' : 'RED'
          
          const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
          const key = `${mhiSignal}_${dayNames[current.day_of_week]}`
          if (!results[key]) results[key] = { total: 0, correct: 0 }
          
          results[key].total++
          if (current.color === mhiSignal) results[key].correct++
        }
        
        return Object.entries(results).map(([pattern, stats]) => ({
          pattern: `MHI ${pattern.split('_')[0]} na ${pattern.split('_')[1]}`,
          frequency: stats.total,
          accuracy: (stats.correct / stats.total) * 100,
          confidence: Math.min(95, (stats.correct / stats.total) * 100 + 10),
          best_hours: [],
          best_days: [parseInt(pattern.split('_')[1])],
          best_months: [],
          total_occurrences: stats.total,
          correct_predictions: stats.correct,
          risk_level: stats.total < 10 ? 'HIGH' : stats.total < 50 ? 'MEDIUM' : 'LOW',
          recommendation: stats.total < 10 ? 'Dados insuficientes' : 
                         (stats.correct / stats.total) > 0.7 ? 'Alta confiança' : 
                         (stats.correct / stats.total) > 0.6 ? 'Média confiança' : 'Baixa confiança'
        }))
      }
    },
    {
      name: 'Hour_Minute_Cross',
      description: 'Cruzamento hora x minuto',
      analyze: (data: HistoricalData[]) => {
        const results: { [key: string]: { total: number, correct: number } } = {}
        
        for (let i = 3; i < data.length; i++) {
          const last3 = data.slice(i - 3, i)
          const current = data[i]
          
          const greens = last3.filter(c => c.color === 'GREEN').length
          const reds = last3.filter(c => c.color === 'RED').length
          const mhiSignal = greens > reds ? 'GREEN' : 'RED'
          
          const quadrant = Math.floor(current.minute / 15) + 1
          const key = `${mhiSignal}_${current.hour}h${quadrant}Q`
          if (!results[key]) results[key] = { total: 0, correct: 0 }
          
          results[key].total++
          if (current.color === mhiSignal) results[key].correct++
        }
        
        return Object.entries(results).map(([pattern, stats]) => ({
          pattern: `MHI ${pattern.split('_')[0]} ${pattern.split('_')[1]}`,
          frequency: stats.total,
          accuracy: (stats.correct / stats.total) * 100,
          confidence: Math.min(95, (stats.correct / stats.total) * 100 + 10),
          best_hours: [parseInt(pattern.split('_')[1].split('h')[0])],
          best_days: [],
          best_months: [],
          total_occurrences: stats.total,
          correct_predictions: stats.correct,
          risk_level: stats.total < 10 ? 'HIGH' : stats.total < 50 ? 'MEDIUM' : 'LOW',
          recommendation: stats.total < 10 ? 'Dados insuficientes' : 
                         (stats.correct / stats.total) > 0.7 ? 'Alta confiança' : 
                         (stats.correct / stats.total) > 0.6 ? 'Média confiança' : 'Baixa confiança'
        }))
      }
    }
  ]

  // Carregar dados históricos
  const loadHistoricalData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Carregando dados históricos para análise cruzada...')

      const { data, error } = await supabase
        .from('historical_candle_data')
        .select('*')
        .eq('pair', 'SOLUSDT')
        .eq('timeframe', selectedTimeframe)
        .order('timestamp', { ascending: true })
        .limit(1000) // Últimos 1000 candles

      if (error) {
        console.error('❌ Erro ao carregar dados históricos:', error)
        return
      }

      const historicalData: HistoricalData[] = (data || []).map(candle => ({
        timestamp: candle.timestamp,
        open_price: candle.open_price,
        close_price: candle.close_price,
        color: candle.color,
        hour: candle.hour,
        minute: candle.minute,
        day_of_week: candle.day_of_week || 0,
        month: candle.month,
        time_key: candle.time_key
      }))

      setHistoricalData(historicalData)
      analyzeCrossPatterns(historicalData)
      
      console.log(`✅ ${historicalData.length} candles históricos carregados`)

    } catch (error) {
      console.error('❌ Erro ao carregar dados históricos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Analisar padrões cruzados
  const analyzeCrossPatterns = (data: HistoricalData[]) => {
    const allResults: CrossAnalysisResult[] = []
    
    patterns.forEach(pattern => {
      const results = pattern.analyze(data)
      allResults.push(...results)
    })

    // Ordenar por confiança e frequência
    allResults.sort((a, b) => {
      const scoreA = a.confidence * Math.log(a.frequency + 1)
      const scoreB = b.confidence * Math.log(b.frequency + 1)
      return scoreB - scoreA
    })

    setCrossAnalysis(allResults)
    analyzeTemporalPatterns(data)
  }

  // Analisar padrões temporais
  const analyzeTemporalPatterns = (data: HistoricalData[]) => {
    const temporalResults: TemporalPattern[] = []
    
    // Por hora
    const hourStats: { [key: number]: { total: number, correct: number, strategies: string[] } } = {}
    
    for (let i = 3; i < data.length; i++) {
      const last3 = data.slice(i - 3, i)
      const current = data[i]
      
      const greens = last3.filter(c => c.color === 'GREEN').length
      const reds = last3.filter(c => c.color === 'RED').length
      const mhiSignal = greens > reds ? 'GREEN' : 'RED'
      
      if (!hourStats[current.hour]) {
        hourStats[current.hour] = { total: 0, correct: 0, strategies: [] }
      }
      
      hourStats[current.hour].total++
      if (current.color === mhiSignal) {
        hourStats[current.hour].correct++
        hourStats[current.hour].strategies.push('MHI')
      }
    }

    Object.entries(hourStats).forEach(([hour, stats]) => {
      if (stats.total >= 10) {
        temporalResults.push({
          time_period: `${hour}h`,
          total_signals: stats.total,
          accuracy: (stats.correct / stats.total) * 100,
          best_strategies: ['MHI'],
          worst_strategies: [],
          confidence_score: Math.min(95, (stats.correct / stats.total) * 100 + 10)
        })
      }
    })

    setTemporalPatterns(temporalResults.sort((a, b) => b.confidence_score - a.confidence_score))
  }

  useEffect(() => {
    loadHistoricalData()
  }, [selectedDate, selectedTimeframe])

  const filteredAnalysis = selectedPattern === 'all' 
    ? crossAnalysis 
    : crossAnalysis.filter(result => result.pattern.includes(selectedPattern))

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
      }, 'Análise Cruzada Histórica'),
      React.createElement('p', { 
        style: { color: '#9ca3af' } 
      }, 'Cruzamento de dados históricos para identificar padrões estatísticos com alto grau de acertividade')
    ),

    // Filtro de Padrões
    React.createElement('div', { style: { marginBottom: '24px' } },
      React.createElement('label', { 
        style: { 
          display: 'block', 
          color: '#9ca3af', 
          marginBottom: '8px' 
        } 
      }, 'Filtrar por Padrão:'),
      React.createElement('select', {
        value: selectedPattern,
        onChange: (e) => setSelectedPattern(e.target.value),
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
        React.createElement('option', { value: 'all' }, 'Todos os Padrões'),
        React.createElement('option', { value: 'MHI' }, 'Padrões MHI'),
        React.createElement('option', { value: 'h' }, 'Padrões por Hora'),
        React.createElement('option', { value: 'Q' }, 'Padrões por Quadrante')
      )
    ),

    // Análise Cruzada
    React.createElement('div', { style: { marginBottom: '32px' } },
      React.createElement('h3', { 
        style: { 
          fontSize: '1.25rem', 
          fontWeight: 'bold', 
          marginBottom: '16px',
          color: 'white'
        } 
      }, 'Resultados da Análise Cruzada'),
      
      loading ? (
        React.createElement('p', { 
          style: { 
            textAlign: 'center', 
            color: '#9ca3af' 
          } 
        }, 'Carregando análise cruzada...')
      ) : filteredAnalysis.length === 0 ? (
        React.createElement('p', { 
          style: { 
            textAlign: 'center', 
            color: '#9ca3af' 
          } 
        }, 'Nenhum padrão encontrado')
      ) : (
        React.createElement('div', { 
          style: { 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: '16px' 
          } 
        },
          filteredAnalysis.map((result, index) => 
            React.createElement('div', { 
              key: index,
              style: { 
                backgroundColor: '#1f2937', 
                padding: '20px', 
                borderRadius: '12px',
                border: '1px solid #374151',
                borderLeft: `4px solid ${result.risk_level === 'LOW' ? '#4ade80' : result.risk_level === 'MEDIUM' ? '#f59e0b' : '#ef4444'}`
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
                }, result.pattern),
                React.createElement('div', { 
                  style: { 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold',
                    color: result.accuracy >= 70 ? '#4ade80' : result.accuracy >= 60 ? '#f59e0b' : '#ef4444'
                  } 
                }, `${result.accuracy.toFixed(1)}%`)
              ),
              React.createElement('div', { 
                style: { 
                  fontSize: '0.875rem', 
                  color: '#9ca3af',
                  marginBottom: '8px'
                } 
              }, `Frequência: ${result.frequency} ocorrências`),
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
              }, `Risco: ${result.risk_level}`),
              React.createElement('div', { 
                style: { 
                  fontSize: '0.875rem', 
                  color: result.recommendation.includes('Alta') ? '#4ade80' : 
                         result.recommendation.includes('Média') ? '#f59e0b' : '#ef4444'
                } 
              }, result.recommendation)
            )
          )
        )
      )
    ),

    // Padrões Temporais
    React.createElement('div', { style: { marginBottom: '32px' } },
      React.createElement('h3', { 
        style: { 
          fontSize: '1.25rem', 
          fontWeight: 'bold', 
          marginBottom: '16px',
          color: 'white'
        } 
      }, 'Padrões Temporais'),
      
      temporalPatterns.length === 0 ? (
        React.createElement('p', { 
          style: { 
            textAlign: 'center', 
            color: '#9ca3af' 
          } 
        }, 'Nenhum padrão temporal encontrado')
      ) : (
        React.createElement('div', { 
          style: { 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '16px' 
          } 
        },
          temporalPatterns.map((pattern, index) => 
            React.createElement('div', { 
              key: index,
              style: { 
                backgroundColor: '#1f2937', 
                padding: '20px', 
                borderRadius: '12px',
                border: '1px solid #374151',
                borderLeft: `4px solid ${pattern.confidence_score >= 80 ? '#4ade80' : pattern.confidence_score >= 60 ? '#f59e0b' : '#ef4444'}`
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
                }, pattern.time_period),
                React.createElement('div', { 
                  style: { 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold',
                    color: pattern.confidence_score >= 80 ? '#4ade80' : pattern.confidence_score >= 60 ? '#f59e0b' : '#ef4444'
                  } 
                }, `${pattern.confidence_score.toFixed(1)}%`)
              ),
              React.createElement('div', { 
                style: { 
                  fontSize: '0.875rem', 
                  color: '#9ca3af',
                  marginBottom: '8px'
                } 
              }, `Sinais: ${pattern.total_signals}`),
              React.createElement('div', { 
                style: { 
                  fontSize: '0.875rem', 
                  color: '#9ca3af',
                  marginBottom: '8px'
                } 
              }, `Acertividade: ${pattern.accuracy.toFixed(1)}%`),
              React.createElement('div', { 
                style: { 
                  fontSize: '0.875rem', 
                  color: '#9ca3af'
                } 
              }, `Melhores: ${pattern.best_strategies.join(', ')}`)
            )
          )
        )
      )
    ),

    // Resumo Estatístico
    React.createElement('div', { style: { marginBottom: '32px' } },
      React.createElement('h3', { 
        style: { 
          fontSize: '1.25rem', 
          fontWeight: 'bold', 
          marginBottom: '16px',
          color: 'white'
        } 
      }, 'Resumo Estatístico'),
      
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
            }, 'Total de Padrões'),
            React.createElement('div', { 
              style: { 
                fontSize: '1.5rem', 
                fontWeight: 'bold',
                color: 'white'
              } 
            }, crossAnalysis.length)
          ),
          React.createElement('div', null,
            React.createElement('div', { 
              style: { 
                fontSize: '0.875rem', 
                color: '#9ca3af',
                marginBottom: '4px'
              } 
            }, 'Padrões de Alta Confiança'),
            React.createElement('div', { 
              style: { 
                fontSize: '1.5rem', 
                fontWeight: 'bold',
                color: '#4ade80'
              } 
            }, crossAnalysis.filter(r => r.confidence >= 80).length)
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
                color: 'white'
              } 
            }, historicalData.length)
          ),
          React.createElement('div', null,
            React.createElement('div', { 
              style: { 
                fontSize: '0.875rem', 
                color: '#9ca3af',
                marginBottom: '4px'
              } 
            }, 'Períodos Analisados'),
            React.createElement('div', { 
              style: { 
                fontSize: '1.5rem', 
                fontWeight: 'bold',
                color: 'white'
              } 
            }, temporalPatterns.length)
          )
        )
      )
    )
  )
}
