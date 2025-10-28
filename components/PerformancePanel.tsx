'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lgddsslskhzxtpjathjr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws'
const supabase = createClient(supabaseUrl, supabaseKey)

interface StrategyMetrics {
  id: number
  strategy_name: string
  description: string
  accuracy: number
  total_signals: number
  total_wins: number
  total_losses: number
  max_win_streak: number
  avg_win_streak: number
  best_hour: number
  best_day: string
}

export default function PerformancePanel() {
  const [metrics, setMetrics] = useState<StrategyMetrics[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
    
    // Atualizar métricas a cada 30 segundos
    const interval = setInterval(loadMetrics, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const loadMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('performance_metrics')
        .select(`
          *,
          strategies:strategy_id (
            name,
            description
          )
        `)
        .order('accuracy', { ascending: false })

      if (error) {
        console.error('❌ Erro ao carregar métricas:', error)
        return
      }

      const formattedMetrics = (data || []).map((item: any) => ({
        id: item.id,
        strategy_name: item.strategies.name,
        description: item.strategies.description,
        accuracy: item.accuracy || 0,
        total_signals: item.total_signals || 0,
        total_wins: item.total_wins || 0,
        total_losses: item.total_losses || 0,
        max_win_streak: item.max_win_streak || 0,
        avg_win_streak: item.avg_win_streak || 0,
        best_hour: item.best_hour || 0,
        best_day: item.best_day || '-'
      }))

      setMetrics(formattedMetrics)
      setLoading(false)
    } catch (error) {
      console.error('❌ Erro ao carregar métricas:', error)
      setLoading(false)
    }
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 70) return '#22c55e'
    if (accuracy >= 50) return '#fbbf24'
    return '#ef4444'
  }

  const getRiskLevel = (accuracy: number) => {
    if (accuracy >= 70) return { label: 'BAIXO', color: '#22c55e' }
    if (accuracy >= 50) return { label: 'MÉDIO', color: '#fbbf24' }
    return { label: 'ALTO', color: '#ef4444' }
  }

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '1.125rem',
          color: '#94a3b8'
        }}>
          Carregando métricas...
        </div>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      padding: '20px'
    }}>
      <div style={{
        marginBottom: '24px',
        paddingBottom: '12px',
        borderBottom: '1px solid #334155'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '8px'
        }}>
          🎯 Performance das Estratégias
        </h2>
        <p style={{
          fontSize: '0.875rem',
          color: '#94a3b8'
        }}>
          Análise baseada nas últimas 100 velas finalizadas
        </p>
      </div>

      <div style={{
        display: 'grid',
        gap: '16px'
      }}>
        {metrics.map((metric) => {
          const risk = getRiskLevel(metric.accuracy)
          
          return (
            <div
              key={metric.id}
              style={{
                backgroundColor: '#0f172a',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #334155',
                borderLeft: `4px solid ${getAccuracyColor(metric.accuracy)}`
              }}
            >
              {/* Cabeçalho da estratégia */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 'bold',
                    color: 'white',
                    marginBottom: '4px'
                  }}>
                    {metric.strategy_name}
                  </h3>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#64748b'
                  }}>
                    {metric.description}
                  </p>
                </div>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '4px'
                }}>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: getAccuracyColor(metric.accuracy)
                  }}>
                    {metric.accuracy.toFixed(1)}%
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: `${risk.color}20`,
                    color: risk.color,
                    fontWeight: 'bold'
                  }}>
                    Risco {risk.label}
                  </div>
                </div>
              </div>

              {/* Métricas detalhadas */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px'
              }}>
                <div style={{
                  backgroundColor: '#1e293b',
                  padding: '12px',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                    Total Sinais
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>
                    {metric.total_signals}
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#1e293b',
                  padding: '12px',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                    Vitórias
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#22c55e' }}>
                    {metric.total_wins}
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#1e293b',
                  padding: '12px',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                    Derrotas
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ef4444' }}>
                    {metric.total_losses}
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#1e293b',
                  padding: '12px',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                    Sequência Máx.
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                    {metric.max_win_streak} 🔥
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#1e293b',
                  padding: '12px',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                    Média Sequências
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fbbf24' }}>
                    {metric.avg_win_streak.toFixed(1)}
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#1e293b',
                  padding: '12px',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                    Melhor Hora
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3b82f6' }}>
                    {metric.best_hour}:00h
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#1e293b',
                  padding: '12px',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                    Melhor Dia
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#06b6d4' }}>
                    {metric.best_day}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {metrics.length === 0 && (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#64748b'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📊</div>
          <div style={{ fontSize: '1.125rem' }}>
            Aguardando dados suficientes para análise
          </div>
          <div style={{ fontSize: '0.875rem', marginTop: '8px' }}>
            Mínimo de 10 velas finalizadas necessárias
          </div>
        </div>
      )}
    </div>
  )
}

