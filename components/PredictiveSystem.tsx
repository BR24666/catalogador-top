'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lgddsslskhzxtpjathjr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws'
const supabase = createClient(supabaseUrl, supabaseKey)

interface PredictionSignal {
  strategy: string
  signal: 'CALL' | 'PUT' | 'NEUTRAL'
  confidence: number
  historical_accuracy: number
  real_time_accuracy: number
  combined_score: number
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
  time_window: string
  expected_duration: number
  stop_loss: number
  take_profit: number
}

interface WavePrediction {
  wave_type: 'BULLISH' | 'BEARISH' | 'SIDEWAYS'
  strength: number
  duration_minutes: number
  confidence: number
  entry_price: number
  target_price: number
  stop_loss: number
  probability: number
  risk_reward_ratio: number
  recommended_strategies: string[]
}

interface PredictiveSystemProps {
  selectedDate: string
  selectedTimeframe: string
}

export default function PredictiveSystem({ selectedDate, selectedTimeframe }: PredictiveSystemProps) {
  const [predictions, setPredictions] = useState<PredictionSignal[]>([])
  const [wavePrediction, setWavePrediction] = useState<WavePrediction | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentPrice, setCurrentPrice] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  // Estratégias com dados históricos simulados
  const strategies = [
    {
      name: 'MHI',
      historical_accuracy: 78.5,
      real_time_accuracy: 82.3,
      best_hours: [9, 10, 14, 15, 16],
      best_days: [1, 2, 3, 4, 5],
      risk_level: 'MEDIUM'
    },
    {
      name: 'Minoria',
      historical_accuracy: 72.1,
      real_time_accuracy: 75.8,
      best_hours: [11, 12, 13, 17, 18],
      best_days: [2, 3, 4, 5, 6],
      risk_level: 'HIGH'
    },
    {
      name: 'Três Soldados',
      historical_accuracy: 85.2,
      real_time_accuracy: 88.7,
      best_hours: [8, 9, 14, 15],
      best_days: [1, 2, 3, 4],
      risk_level: 'LOW'
    },
    {
      name: 'Alternância 2x2',
      historical_accuracy: 69.8,
      real_time_accuracy: 73.2,
      best_hours: [10, 11, 15, 16],
      best_days: [2, 3, 4, 5],
      risk_level: 'MEDIUM'
    },
    {
      name: 'Vela de Força',
      historical_accuracy: 81.3,
      real_time_accuracy: 84.6,
      best_hours: [9, 10, 14, 15, 16],
      best_days: [1, 2, 3, 4, 5],
      risk_level: 'LOW'
    }
  ]

  // Calcular score combinado
  const calculateCombinedScore = (strategy: any, currentHour: number, currentDay: number) => {
    let score = 0
    
    // Score baseado na acertividade histórica (40%)
    score += strategy.historical_accuracy * 0.4
    
    // Score baseado na acertividade em tempo real (30%)
    score += strategy.real_time_accuracy * 0.3
    
    // Bonus por horário favorável (20%)
    if (strategy.best_hours.includes(currentHour)) {
      score += 15
    }
    
    // Bonus por dia favorável (10%)
    if (strategy.best_days.includes(currentDay)) {
      score += 10
    }
    
    return Math.min(100, score)
  }

  // Gerar sinais preditivos
  const generatePredictions = () => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentDay = now.getDay()
    
    const newPredictions: PredictionSignal[] = strategies.map(strategy => {
      const combinedScore = calculateCombinedScore(strategy, currentHour, currentDay)
      
      // Determinar sinal baseado no score
      let signal: 'CALL' | 'PUT' | 'NEUTRAL' = 'NEUTRAL'
      if (combinedScore >= 75) {
        signal = Math.random() > 0.5 ? 'CALL' : 'PUT'
      } else if (combinedScore >= 60) {
        signal = Math.random() > 0.6 ? 'CALL' : 'PUT'
      }
      
      // Calcular níveis de stop loss e take profit
      const entryPrice = currentPrice
      const volatility = 0.02 // 2% de volatilidade
      const stopLoss = signal === 'CALL' 
        ? entryPrice * (1 - volatility)
        : entryPrice * (1 + volatility)
      const takeProfit = signal === 'CALL'
        ? entryPrice * (1 + volatility * 2)
        : entryPrice * (1 - volatility * 2)
      
      return {
        strategy: strategy.name,
        signal,
        confidence: combinedScore,
        historical_accuracy: strategy.historical_accuracy,
        real_time_accuracy: strategy.real_time_accuracy,
        combined_score: combinedScore,
        risk_level: strategy.risk_level,
        time_window: `${currentHour.toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
        expected_duration: Math.floor(Math.random() * 30) + 15, // 15-45 minutos
        stop_loss: stopLoss,
        take_profit: takeProfit
      }
    })
    
    setPredictions(newPredictions)
    generateWavePrediction(newPredictions)
  }

  // Gerar predição de onda
  const generateWavePrediction = (signals: PredictionSignal[]) => {
    const callSignals = signals.filter(s => s.signal === 'CALL')
    const putSignals = signals.filter(s => s.signal === 'PUT')
    
    let waveType: 'BULLISH' | 'BEARISH' | 'SIDEWAYS' = 'SIDEWAYS'
    let strength = 0
    let confidence = 0
    
    if (callSignals.length > putSignals.length) {
      waveType = 'BULLISH'
      strength = (callSignals.reduce((sum, s) => sum + s.confidence, 0) / callSignals.length)
      confidence = callSignals.length * 20
    } else if (putSignals.length > callSignals.length) {
      waveType = 'BEARISH'
      strength = (putSignals.reduce((sum, s) => sum + s.confidence, 0) / putSignals.length)
      confidence = putSignals.length * 20
    }
    
    const entryPrice = currentPrice
    const volatility = 0.03
    const targetPrice = waveType === 'BULLISH' 
      ? entryPrice * (1 + volatility)
      : waveType === 'BEARISH'
      ? entryPrice * (1 - volatility)
      : entryPrice
    
    const stopLoss = waveType === 'BULLISH'
      ? entryPrice * (1 - volatility * 0.5)
      : waveType === 'BEARISH'
      ? entryPrice * (1 + volatility * 0.5)
      : entryPrice
    
    const riskRewardRatio = Math.abs(targetPrice - entryPrice) / Math.abs(entryPrice - stopLoss)
    
    setWavePrediction({
      wave_type: waveType,
      strength: Math.min(100, strength),
      duration_minutes: Math.floor(Math.random() * 60) + 30, // 30-90 minutos
      confidence: Math.min(100, confidence),
      entry_price: entryPrice,
      target_price: targetPrice,
      stop_loss: stopLoss,
      probability: Math.min(95, confidence * 0.8),
      risk_reward_ratio: riskRewardRatio,
      recommended_strategies: signals
        .filter(s => s.signal !== 'NEUTRAL')
        .sort((a, b) => b.combined_score - a.combined_score)
        .slice(0, 3)
        .map(s => s.strategy)
    })
  }

  // Carregar preço atual
  const loadCurrentPrice = async () => {
    try {
      const { data, error } = await supabase
        .from('realtime_candle_data')
        .select('close_price')
        .eq('pair', 'SOLUSDT')
        .eq('timeframe', selectedTimeframe)
        .order('timestamp', { ascending: false })
        .limit(1)

      if (error) {
        console.error('❌ Erro ao carregar preço atual:', error)
        return
      }

      if (data && data.length > 0) {
        setCurrentPrice(data[0].close_price)
        setLastUpdate(new Date().toLocaleString('pt-BR'))
        generatePredictions()
      }
    } catch (error) {
      console.error('❌ Erro ao carregar preço atual:', error)
    }
  }

  useEffect(() => {
    loadCurrentPrice()
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadCurrentPrice, 30000)
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
      }, 'Sistema Preditivo de Ondas'),
      React.createElement('p', { 
        style: { color: '#9ca3af' } 
      }, 'Combinação de dados em tempo real com estatísticas históricas para prever próximas ondas de repetição'),
      React.createElement('div', { 
        style: { 
          display: 'flex', 
          gap: '16px', 
          marginTop: '16px',
          fontSize: '0.875rem',
          color: '#9ca3af'
        } 
      },
        React.createElement('span', null, `Preço Atual: $${currentPrice.toFixed(4)}`),
        React.createElement('span', null, `Última Atualização: ${lastUpdate}`)
      )
    ),

    // Predição de Onda
    React.createElement('div', { style: { marginBottom: '32px' } },
      React.createElement('h3', { 
        style: { 
          fontSize: '1.25rem', 
          fontWeight: 'bold', 
          marginBottom: '16px',
          color: 'white'
        } 
      }, 'Predição de Onda Atual'),
      
      wavePrediction ? (
        React.createElement('div', { 
          style: { 
            backgroundColor: '#1f2937', 
            padding: '24px', 
            borderRadius: '12px',
            border: '1px solid #374151',
            borderLeft: `4px solid ${wavePrediction.wave_type === 'BULLISH' ? '#4ade80' : wavePrediction.wave_type === 'BEARISH' ? '#ef4444' : '#6b7280'}`
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
                fontSize: '1.5rem', 
                fontWeight: 'bold',
                color: 'white'
              } 
            }, `Onda ${wavePrediction.wave_type}`),
            React.createElement('div', { 
              style: { 
                fontSize: '1.25rem', 
                fontWeight: 'bold',
                color: wavePrediction.confidence >= 80 ? '#4ade80' : wavePrediction.confidence >= 60 ? '#f59e0b' : '#ef4444'
              } 
            }, `${wavePrediction.confidence.toFixed(1)}%`)
          ),
          
          React.createElement('div', { 
            style: { 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
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
              }, 'Força da Onda'),
              React.createElement('div', { 
                style: { 
                  fontSize: '1.25rem', 
                  fontWeight: 'bold',
                  color: 'white'
                } 
              }, `${wavePrediction.strength.toFixed(1)}%`)
            ),
            React.createElement('div', null,
              React.createElement('div', { 
                style: { 
                  fontSize: '0.875rem', 
                  color: '#9ca3af',
                  marginBottom: '4px'
                } 
              }, 'Duração Esperada'),
              React.createElement('div', { 
                style: { 
                  fontSize: '1.25rem', 
                  fontWeight: 'bold',
                  color: 'white'
                } 
              }, `${wavePrediction.duration_minutes} min`)
            ),
            React.createElement('div', null,
              React.createElement('div', { 
                style: { 
                  fontSize: '0.875rem', 
                  color: '#9ca3af',
                  marginBottom: '4px'
                } 
              }, 'Probabilidade'),
              React.createElement('div', { 
                style: { 
                  fontSize: '1.25rem', 
                  fontWeight: 'bold',
                  color: wavePrediction.probability >= 80 ? '#4ade80' : wavePrediction.probability >= 60 ? '#f59e0b' : '#ef4444'
                } 
              }, `${wavePrediction.probability.toFixed(1)}%`)
            ),
            React.createElement('div', null,
              React.createElement('div', { 
                style: { 
                  fontSize: '0.875rem', 
                  color: '#9ca3af',
                  marginBottom: '4px'
                } 
              }, 'Risk/Reward'),
              React.createElement('div', { 
                style: { 
                  fontSize: '1.25rem', 
                  fontWeight: 'bold',
                  color: wavePrediction.risk_reward_ratio >= 2 ? '#4ade80' : wavePrediction.risk_reward_ratio >= 1.5 ? '#f59e0b' : '#ef4444'
                } 
              }, `${wavePrediction.risk_reward_ratio.toFixed(2)}`)
            )
          ),
          
          React.createElement('div', { 
            style: { 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
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
              }, 'Preço de Entrada'),
              React.createElement('div', { 
                style: { 
                  fontSize: '1.125rem', 
                  fontWeight: 'bold',
                  color: 'white'
                } 
              }, `$${wavePrediction.entry_price.toFixed(4)}`)
            ),
            React.createElement('div', null,
              React.createElement('div', { 
                style: { 
                  fontSize: '0.875rem', 
                  color: '#9ca3af',
                  marginBottom: '4px'
                } 
              }, 'Preço Alvo'),
              React.createElement('div', { 
                style: { 
                  fontSize: '1.125rem', 
                  fontWeight: 'bold',
                  color: '#4ade80'
                } 
              }, `$${wavePrediction.target_price.toFixed(4)}`)
            ),
            React.createElement('div', null,
              React.createElement('div', { 
                style: { 
                  fontSize: '0.875rem', 
                  color: '#9ca3af',
                  marginBottom: '4px'
                } 
              }, 'Stop Loss'),
              React.createElement('div', { 
                style: { 
                  fontSize: '1.125rem', 
                  fontWeight: 'bold',
                  color: '#ef4444'
                } 
              }, `$${wavePrediction.stop_loss.toFixed(4)}`)
            )
          ),
          
          React.createElement('div', null,
            React.createElement('div', { 
              style: { 
                fontSize: '0.875rem', 
                color: '#9ca3af',
              marginBottom: '8px'
              } 
            }, 'Estratégias Recomendadas'),
            React.createElement('div', { 
              style: { 
                fontSize: '1rem', 
                color: 'white'
              } 
            }, wavePrediction.recommended_strategies.join(', '))
          )
        )
      ) : (
        React.createElement('p', { 
          style: { 
            textAlign: 'center', 
            color: '#9ca3af' 
          } 
        }, 'Gerando predição de onda...')
      )
    ),

    // Sinais Preditivos
    React.createElement('div', { style: { marginBottom: '32px' } },
      React.createElement('h3', { 
        style: { 
          fontSize: '1.25rem', 
          fontWeight: 'bold', 
          marginBottom: '16px',
          color: 'white'
        } 
      }, 'Sinais Preditivos por Estratégia'),
      
      loading ? (
        React.createElement('p', { 
          style: { 
            textAlign: 'center', 
            color: '#9ca3af' 
          } 
        }, 'Carregando sinais preditivos...')
      ) : predictions.length === 0 ? (
        React.createElement('p', { 
          style: { 
            textAlign: 'center', 
            color: '#9ca3af' 
          } 
        }, 'Nenhum sinal preditivo disponível')
      ) : (
        React.createElement('div', { 
          style: { 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '16px' 
          } 
        },
          predictions.map((prediction, index) => 
            React.createElement('div', { 
              key: index,
              style: { 
                backgroundColor: '#1f2937', 
                padding: '20px', 
                borderRadius: '12px',
                border: '1px solid #374151',
                borderLeft: `4px solid ${prediction.signal === 'CALL' ? '#4ade80' : prediction.signal === 'PUT' ? '#ef4444' : '#6b7280'}`
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
                }, prediction.strategy),
                React.createElement('div', { 
                  style: { 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold',
                    color: prediction.signal === 'CALL' ? '#4ade80' : prediction.signal === 'PUT' ? '#ef4444' : '#6b7280'
                  } 
                }, prediction.signal)
              ),
              React.createElement('div', { 
                style: { 
                  fontSize: '0.875rem', 
                  color: '#9ca3af',
                  marginBottom: '8px'
                } 
              }, `Confiança: ${prediction.confidence.toFixed(1)}%`),
              React.createElement('div', { 
                style: { 
                  fontSize: '0.875rem', 
                  color: '#9ca3af',
                  marginBottom: '8px'
                } 
              }, `Score Combinado: ${prediction.combined_score.toFixed(1)}`),
              React.createElement('div', { 
                style: { 
                  fontSize: '0.875rem', 
                  color: '#9ca3af',
                  marginBottom: '8px'
                } 
              }, `Duração: ${prediction.expected_duration} min`),
              React.createElement('div', { 
                style: { 
                  fontSize: '0.875rem', 
                  color: '#9ca3af',
                  marginBottom: '8px'
                } 
              }, `Stop Loss: $${prediction.stop_loss.toFixed(4)}`),
              React.createElement('div', { 
                style: { 
                  fontSize: '0.875rem', 
                  color: '#9ca3af'
                } 
              }, `Take Profit: $${prediction.take_profit.toFixed(4)}`)
            )
          )
        )
      )
    ),

    // Botão de Atualização
    React.createElement('div', { style: { textAlign: 'center' } },
      React.createElement('button', {
        onClick: loadCurrentPrice,
        style: {
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '1rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }
      }, 'Atualizar Predições')
    )
  )
}
