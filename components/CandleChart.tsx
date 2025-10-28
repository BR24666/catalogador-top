'use client'

import React from 'react'
import { CandleData } from '../lib/btc-collector'

interface CandleChartProps {
  candles: CandleData[]
}

export default function CandleChart({ candles }: CandleChartProps) {
  if (candles.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#94a3b8'
      }}>
        Aguardando dados...
      </div>
    )
  }

  // Últimas 60 velas para visualização
  const visibleCandles = candles.slice(-60)
  
  // Calcular escala
  const prices = visibleCandles.flatMap(c => [c.high, c.low])
  const maxPrice = Math.max(...prices)
  const minPrice = Math.min(...prices)
  const priceRange = maxPrice - minPrice
  const padding = priceRange * 0.1

  const chartHeight = 400
  const chartWidth = visibleCandles.length * 12
  const candleWidth = 8
  const candleGap = 4

  const priceToY = (price: number) => {
    return chartHeight - ((price - minPrice + padding) / (priceRange + 2 * padding)) * chartHeight
  }

  return (
    <div style={{
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '24px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '12px',
        borderBottom: '1px solid #334155'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: 'white'
        }}>
          📈 BTC/USDT - 1 Minuto
        </h2>
        <div style={{
          display: 'flex',
          gap: '16px',
          fontSize: '0.875rem',
          color: '#94a3b8'
        }}>
          <div>
            <span style={{ color: '#22c55e' }}>● </span>
            Bullish
          </div>
          <div>
            <span style={{ color: '#ef4444' }}>● </span>
            Bearish
          </div>
          <div>
            <span style={{ color: '#fbbf24' }}>◐ </span>
            Em Formação
          </div>
        </div>
      </div>

      <div style={{
        overflowX: 'auto',
        overflowY: 'hidden'
      }}>
        <svg
          width={chartWidth}
          height={chartHeight}
          style={{
            minWidth: '100%'
          }}
        >
          {/* Grid horizontal */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = chartHeight * ratio
            const price = maxPrice + padding - (priceRange + 2 * padding) * ratio
            return (
              <g key={ratio}>
                <line
                  x1={0}
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="#334155"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <text
                  x={5}
                  y={y - 5}
                  fill="#64748b"
                  fontSize="11"
                >
                  ${price.toFixed(2)}
                </text>
              </g>
            )
          })}

          {/* Candles */}
          {visibleCandles.map((candle, index) => {
            const x = index * (candleWidth + candleGap) + candleGap
            const isBullish = candle.close > candle.open
            const color = candle.status === 'em formação' 
              ? '#fbbf24' 
              : isBullish ? '#22c55e' : '#ef4444'
            
            const highY = priceToY(candle.high)
            const lowY = priceToY(candle.low)
            const openY = priceToY(candle.open)
            const closeY = priceToY(candle.close)
            
            const bodyTop = Math.min(openY, closeY)
            const bodyBottom = Math.max(openY, closeY)
            const bodyHeight = Math.max(bodyBottom - bodyTop, 1)

            return (
              <g key={index}>
                {/* Pavio superior */}
                <line
                  x1={x + candleWidth / 2}
                  y1={highY}
                  x2={x + candleWidth / 2}
                  y2={bodyTop}
                  stroke={color}
                  strokeWidth={1}
                />
                
                {/* Corpo */}
                <rect
                  x={x}
                  y={bodyTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={color}
                  opacity={candle.status === 'em formação' ? 0.6 : 1}
                />
                
                {/* Pavio inferior */}
                <line
                  x1={x + candleWidth / 2}
                  y1={bodyBottom}
                  x2={x + candleWidth / 2}
                  y2={lowY}
                  stroke={color}
                  strokeWidth={1}
                />

                {/* Indicador de vela em formação */}
                {candle.status === 'em formação' && (
                  <circle
                    cx={x + candleWidth / 2}
                    cy={highY - 10}
                    r={3}
                    fill="#fbbf24"
                  >
                    <animate
                      attributeName="opacity"
                      values="1;0.3;1"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Informações da última vela */}
      {visibleCandles.length > 0 && (
        <div style={{
          marginTop: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          padding: '16px',
          backgroundColor: '#0f172a',
          borderRadius: '8px'
        }}>
          {(() => {
            const lastCandle = visibleCandles[visibleCandles.length - 1]
            return (
              <>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                    Status
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 'bold',
                    color: lastCandle.status === 'em formação' ? '#fbbf24' : '#22c55e'
                  }}>
                    {lastCandle.status === 'em formação' ? '⏳ Aguardando' : '✅ Fechada'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                    Open
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'white' }}>
                    ${lastCandle.open.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                    High
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#22c55e' }}>
                    ${lastCandle.high.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                    Low
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#ef4444' }}>
                    ${lastCandle.low.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                    Close
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'white' }}>
                    ${lastCandle.close.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                    Volume
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                    {lastCandle.volume.toFixed(4)}
                  </div>
                </div>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}

