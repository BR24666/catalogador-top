'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || ''

interface MLStatus {
  ok: boolean
  rolling_accuracy: number
  accuracy_24h: number
  total_trades: number
  wins: number
  losses: number
  max_win_streak: number
  avg_win_streak: number
  recent: any[]
  last_model: any
  timestamp: string
}

export default function MLMetrics() {
  const [status, setStatus] = useState<MLStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatus()
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadStatus, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const loadStatus = async () => {
    try {
      // Se não houver URL do backend configurada, não tenta carregar
      if (!BACKEND_URL) {
        console.log('ℹ️ Backend ML não configurado (use localmente)')
        setLoading(false)
        return
      }

      const response = await axios.get(`${BACKEND_URL}/api/model/status`)
      setStatus(response.data)
      setLoading(false)
    } catch (error) {
      console.error('❌ Erro ao carregar status ML:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        color: '#94a3b8'
      }}>
        Carregando métricas ML...
      </div>
    )
  }

  if (!status && !BACKEND_URL) {
    return (
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        color: '#fbbf24'
      }}>
        ℹ️ Sistema ML disponível apenas localmente
        <div style={{ fontSize: '0.875rem', marginTop: '8px', color: '#94a3b8' }}>
          Para usar, configure NEXT_PUBLIC_BACKEND_URL e inicie o backend localmente
        </div>
      </div>
    )
  }

  if (!status) {
    return (
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        color: '#ef4444'
      }}>
        ❌ Erro ao carregar métricas ML
        <div style={{ fontSize: '0.875rem', marginTop: '8px', color: '#94a3b8' }}>
          Certifique-se de que o backend está rodando em {BACKEND_URL}
        </div>
      </div>
    )
  }

  const getAccuracyColor = (acc: number) => {
    if (acc >= 0.70) return '#22c55e'
    if (acc >= 0.60) return '#fbbf24'
    return '#ef4444'
  }

  return (
    <div style={{
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '24px'
    }}>
      {/* Header */}
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
          🤖 Modelo de Machine Learning
        </h2>
        <p style={{
          fontSize: '0.875rem',
          color: '#94a3b8'
        }}>
          Predições baseadas em LightGBM
        </p>
      </div>

      {/* Métricas principais */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{
          backgroundColor: '#0f172a',
          padding: '16px',
          borderRadius: '8px',
          borderLeft: `4px solid ${getAccuracyColor(status.rolling_accuracy)}`
        }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
            Acurácia Geral
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: getAccuracyColor(status.rolling_accuracy)
          }}>
            {(status.rolling_accuracy * 100).toFixed(1)}%
          </div>
        </div>

        <div style={{
          backgroundColor: '#0f172a',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
            Últimas 24h
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: getAccuracyColor(status.accuracy_24h)
          }}>
            {(status.accuracy_24h * 100).toFixed(1)}%
          </div>
        </div>

        <div style={{
          backgroundColor: '#0f172a',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
            Total Trades
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
            {status.total_trades}
          </div>
        </div>

        <div style={{
          backgroundColor: '#0f172a',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
            Vitórias
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>
            {status.wins}
          </div>
        </div>

        <div style={{
          backgroundColor: '#0f172a',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
            Derrotas
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
            {status.losses}
          </div>
        </div>

        <div style={{
          backgroundColor: '#0f172a',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
            Sequência Máx.
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
            {status.max_win_streak} 🔥
          </div>
        </div>
      </div>

      {/* Informações do modelo */}
      {status.last_model && (
        <div style={{
          backgroundColor: '#0f172a',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '8px'
          }}>
            📦 Último Modelo Treinado
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Versão: {status.last_model.version}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Treinado em: {new Date(status.last_model.trained_at).toLocaleString('pt-BR')}
          </div>
        </div>
      )}

      {/* Trades recentes */}
      <div style={{
        backgroundColor: '#0f172a',
        padding: '16px',
        borderRadius: '8px'
      }}>
        <div style={{
          fontSize: '0.875rem',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '12px'
        }}>
          📊 Últimos Trades
        </div>
        
        <div style={{
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {status.recent.slice(0, 10).map((trade, idx) => (
            <div
              key={trade.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px',
                marginBottom: '4px',
                backgroundColor: '#1e293b',
                borderRadius: '4px',
                borderLeft: `3px solid ${trade.result === 'WIN' ? '#22c55e' : trade.result === 'LOSS' ? '#ef4444' : '#fbbf24'}`
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {new Date(trade.entry_time).toLocaleTimeString('pt-BR')}
              </div>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: 'bold',
                color: trade.predicted_direction === 'UP' ? '#22c55e' : '#ef4444'
              }}>
                {trade.predicted_direction}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#94a3b8'
              }}>
                {(trade.predicted_confidence * 100).toFixed(1)}%
              </div>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 'bold',
                color: trade.result === 'WIN' ? '#22c55e' : trade.result === 'LOSS' ? '#ef4444' : '#fbbf24'
              }}>
                {trade.result || 'PENDING'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

