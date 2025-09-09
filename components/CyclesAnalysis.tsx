'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lgddsslskhzxtpjathjr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws'
const supabase = createClient(supabaseUrl, supabaseKey)

interface CycleData {
  strategy_name: string
  cycle_length: number
  accuracy: number
  start_time: string
  end_time: string
  total_signals: number
  correct_signals: number
  best_hour: number
  best_day: number
}

interface CyclesAnalysisProps {
  selectedDate: string
  selectedTimeframe: string
}

export default function CyclesAnalysis({ selectedDate, selectedTimeframe }: CyclesAnalysisProps) {
  const [cycles, setCycles] = useState<CycleData[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<string>('all')
  const [crossAnalysis, setCrossAnalysis] = useState<any>(null)

  const loadCyclesData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Carregando dados de ciclos históricos...')
      
      // Buscar ciclos de acertividade
      const { data: cyclesData, error: cyclesError } = await supabase
        .from('accuracy_cycles')
        .select('*')
        .eq('timeframe', selectedTimeframe)
        .eq('pair', 'SOLUSDT')
        .order('accuracy', { ascending: false })

      if (cyclesError) {
        console.error('❌ Erro ao carregar ciclos:', cyclesError)
        return
      }

      setCycles(cyclesData || [])
      console.log(`📊 Encontrados ${cyclesData?.length || 0} ciclos`)

      // Buscar análise cruzada
      const { data: crossData, error: crossError } = await supabase
        .rpc('get_cross_cycle_analysis', {
          p_timeframe: selectedTimeframe,
          p_pair: 'SOLUSDT'
        })

      if (!crossError && crossData) {
        setCrossAnalysis(crossData)
        console.log('📈 Análise cruzada carregada')
      }

    } catch (error) {
      console.error('❌ Erro ao carregar dados de ciclos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCyclesData()
  }, [selectedDate, selectedTimeframe])

  const filteredCycles = selectedStrategy === 'all' 
    ? cycles 
    : cycles.filter(cycle => cycle.strategy_name === selectedStrategy)

  const strategies = Array.from(new Set(cycles.map(cycle => cycle.strategy_name)))

  return React.createElement('div', { style: { padding: '24px' } },
    // Cabeçalho
    React.createElement('div', { style: { marginBottom: '32px' } },
      React.createElement('h2', { 
        style: { 
          fontSize: '1.875rem', 
          fontWeight: 'bold', 
          marginBottom: '8px',
          color: '#60a5fa'
        } 
      }, '🔄 Análise de Ciclos Históricos'),
      React.createElement('p', { 
        style: { 
          color: '#9ca3af', 
          marginBottom: '24px' 
        } 
      }, 'Identificação de ciclos de acertividade e melhores oportunidades baseadas em dados históricos'),
      
      // Filtros
      React.createElement('div', { style: { display: 'flex', gap: '16px', marginBottom: '24px' } },
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
          React.createElement('label', { 
            style: { fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db' } 
          }, 'Estratégia:'),
          React.createElement('select', {
            value: selectedStrategy,
            onChange: (e: any) => setSelectedStrategy(e.target.value),
            style: {
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #374151',
              backgroundColor: '#1f2937',
              color: 'white',
              fontSize: '0.875rem'
            }
          },
            React.createElement('option', { value: 'all' }, 'Todas as Estratégias'),
            ...strategies.map(strategy => 
              React.createElement('option', { key: strategy, value: strategy }, strategy)
            )
          )
        )
      )
    ),

    // Análise Cruzada
    crossAnalysis && React.createElement('div', { 
      style: { 
        backgroundColor: '#1f2937', 
        padding: '24px', 
        borderRadius: '12px', 
        marginBottom: '32px',
        border: '1px solid #374151'
      } 
    },
      React.createElement('h3', { 
        style: { 
          fontSize: '1.25rem', 
          fontWeight: 'bold', 
          marginBottom: '16px',
          color: '#4ade80'
        } 
      }, '📈 Análise Cruzada - Melhores Oportunidades'),
      
      React.createElement('div', { 
        style: { 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px' 
        } 
      },
        React.createElement('div', { style: { textAlign: 'center' } },
          React.createElement('div', { 
            style: { 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: '#4ade80' 
            } 
          }, crossAnalysis.best_hour || 'N/A'),
          React.createElement('div', { 
            style: { 
              fontSize: '0.875rem', 
              color: '#9ca3af' 
            } 
          }, 'Melhor Hora')
        ),
        React.createElement('div', { style: { textAlign: 'center' } },
          React.createElement('div', { 
            style: { 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: '#60a5fa' 
            } 
          }, crossAnalysis.best_day || 'N/A'),
          React.createElement('div', { 
            style: { 
              fontSize: '0.875rem', 
              color: '#9ca3af' 
            } 
          }, 'Melhor Dia da Semana')
        ),
        React.createElement('div', { style: { textAlign: 'center' } },
          React.createElement('div', { 
            style: { 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: '#f59e0b' 
            } 
          }, `${crossAnalysis.avg_accuracy || 0}%`),
          React.createElement('div', { 
            style: { 
              fontSize: '0.875rem', 
              color: '#9ca3af' 
            } 
          }, 'Precisão Média')
        ),
        React.createElement('div', { style: { textAlign: 'center' } },
          React.createElement('div', { 
            style: { 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: '#ef4444' 
            } 
          }, crossAnalysis.total_cycles || 0),
          React.createElement('div', { 
            style: { 
              fontSize: '0.875rem', 
              color: '#9ca3af' 
            } 
          }, 'Total de Ciclos')
        )
      )
    ),

    // Lista de Ciclos
    loading ? 
      React.createElement('div', { 
        style: { 
          textAlign: 'center', 
          padding: '48px',
          color: '#9ca3af'
        } 
      }, '🔄 Carregando ciclos...') :
      
      filteredCycles.length === 0 ?
        React.createElement('div', { 
          style: { 
            textAlign: 'center', 
            padding: '48px',
            color: '#9ca3af'
          } 
        }, '📊 Nenhum ciclo encontrado para os filtros selecionados') :

        React.createElement('div', { style: { display: 'grid', gap: '16px' } },
          ...filteredCycles.map((cycle, index) => 
            React.createElement('div', { 
              key: index,
              style: { 
                backgroundColor: '#1f2937', 
                padding: '20px', 
                borderRadius: '12px',
                border: '1px solid #374151',
                borderLeft: `4px solid ${cycle.accuracy >= 80 ? '#4ade80' : cycle.accuracy >= 60 ? '#f59e0b' : '#ef4444'}`
              } 
            },
              React.createElement('div', { 
                style: { 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                } 
              },
                React.createElement('div', null,
                  React.createElement('h4', { 
                    style: { 
                      fontSize: '1.125rem', 
                      fontWeight: 'bold',
                      color: 'white',
                      marginBottom: '4px'
                    } 
                  }, cycle.strategy_name),
                  React.createElement('p', { 
                    style: { 
                      fontSize: '0.875rem', 
                      color: '#9ca3af' 
                    } 
                  }, `Ciclo de ${cycle.cycle_length} velas`)
                ),
                React.createElement('div', { 
                  style: { 
                    textAlign: 'right' 
                  } 
                },
                  React.createElement('div', { 
                    style: { 
                      fontSize: '1.5rem', 
                      fontWeight: 'bold',
                      color: cycle.accuracy >= 80 ? '#4ade80' : cycle.accuracy >= 60 ? '#f59e0b' : '#ef4444'
                    } 
                  }, `${cycle.accuracy}%`),
                  React.createElement('div', { 
                    style: { 
                      fontSize: '0.75rem', 
                      color: '#9ca3af' 
                    } 
                  }, 'Precisão')
                )
              ),
              
              React.createElement('div', { 
                style: { 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                  gap: '12px',
                  fontSize: '0.875rem'
                } 
              },
                React.createElement('div', null,
                  React.createElement('span', { style: { color: '#9ca3af' } }, 'Sinais:'),
                  React.createElement('span', { style: { marginLeft: '8px', color: 'white' } }, `${cycle.correct_signals}/${cycle.total_signals}`)
                ),
                React.createElement('div', null,
                  React.createElement('span', { style: { color: '#9ca3af' } }, 'Início:'),
                  React.createElement('span', { style: { marginLeft: '8px', color: 'white' } }, new Date(cycle.start_time).toLocaleString('pt-BR'))
                ),
                React.createElement('div', null,
                  React.createElement('span', { style: { color: '#9ca3af' } }, 'Fim:'),
                  React.createElement('span', { style: { marginLeft: '8px', color: 'white' } }, new Date(cycle.end_time).toLocaleString('pt-BR'))
                ),
                React.createElement('div', null,
                  React.createElement('span', { style: { color: '#9ca3af' } }, 'Melhor Hora:'),
                  React.createElement('span', { style: { marginLeft: '8px', color: 'white' } }, `${cycle.best_hour}h`)
                ),
                React.createElement('div', null,
                  React.createElement('span', { style: { color: '#9ca3af' } }, 'Melhor Dia:'),
                  React.createElement('span', { style: { marginLeft: '8px', color: 'white' } }, cycle.best_day)
                )
              )
            )
          )
        )
  )
}
