'use client'

import React from 'react'
import { CandleData } from '../lib/binance-api'

interface CandleGridProps {
  candles: CandleData[]
  selectedDate: string
  selectedTimeframe: string
}

export default function CandleGrid({ candles, selectedDate, selectedTimeframe }: CandleGridProps) {
  // Agrupar velas por hora
  const candlesByHour = candles.reduce((acc, candle) => {
    const hour = candle.hour
    if (!acc[hour]) {
      acc[hour] = []
    }
    acc[hour].push(candle)
    return acc
  }, {} as Record<number, CandleData[]>)

  // Ordenar horas
  const sortedHours = Object.keys(candlesByHour)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <div style={{ padding: '24px' }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          fontSize: '1.875rem', 
          fontWeight: 'bold', 
          marginBottom: '16px',
          color: 'white'
        }}>
          🕯️ Catalogador de Velas
        </h2>
        <p style={{ color: '#9ca3af', marginBottom: '16px' }}>
          Visualização em tempo real das velas de {selectedTimeframe} para SOLUSDT
        </p>
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ 
            padding: '8px 16px', 
            backgroundColor: '#1f2937', 
            borderRadius: '8px',
            border: '1px solid #374151'
          }}>
            <span style={{ color: '#9ca3af' }}>Total de velas: </span>
            <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{candles.length}</span>
          </div>
          <div style={{ 
            padding: '8px 16px', 
            backgroundColor: '#1f2937', 
            borderRadius: '8px',
            border: '1px solid #374151'
          }}>
            <span style={{ color: '#9ca3af' }}>Horas ativas: </span>
            <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{sortedHours.length}</span>
          </div>
        </div>
      </div>

      {/* Grid de Velas */}
      {sortedHours.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '48px',
          color: '#9ca3af'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📊</div>
          <p>Nenhuma vela encontrada para o período selecionado</p>
          <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>
            Inicie a coleta para ver as velas em tempo real
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gap: '16px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
        }}>
          {sortedHours.map(hour => (
            <div key={hour} style={{
              backgroundColor: '#1f2937',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #374151'
            }}>
              {/* Cabeçalho da Hora */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid #374151'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  {hour.toString().padStart(2, '0')}:00 - {hour.toString().padStart(2, '0')}:59
                </h3>
                <div style={{
                  padding: '4px 8px',
                  backgroundColor: '#374151',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: '#e5e7eb'
                }}>
                  {candlesByHour[hour].length} velas
                </div>
              </div>

              {/* Grid de Velas da Hora */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '4px'
              }}>
                {candlesByHour[hour].map((candle, index) => (
                  <div
                    key={`${candle.timestamp}-${index}`}
                    style={{
                      width: '100%',
                      height: '40px',
                      backgroundColor: candle.color === 'GREEN' ? '#22c55e' : '#ef4444',
                      borderRadius: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                    title={`${candle.hour.toString().padStart(2, '0')}:${candle.minute.toString().padStart(2, '0')} - ${candle.color} - $${candle.close_price.toFixed(4)}`}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)'
                      e.currentTarget.style.zIndex = '10'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.zIndex = '1'
                    }}
                  >
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: 'white',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                    }}>
                      {candle.minute.toString().padStart(2, '0')}
                    </div>
                    <div style={{
                      fontSize: '0.625rem',
                      color: 'rgba(255,255,255,0.8)',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                    }}>
                      {candle.color === 'GREEN' ? '↗' : '↘'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Estatísticas da Hora */}
              <div style={{
                marginTop: '12px',
                padding: '8px',
                backgroundColor: '#374151',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Verdes:</span>
                  <span style={{ color: '#22c55e', fontWeight: 'bold' }}>
                    {candlesByHour[hour].filter(c => c.color === 'GREEN').length}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Vermelhas:</span>
                  <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                    {candlesByHour[hour].filter(c => c.color === 'RED').length}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
