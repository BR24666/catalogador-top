'use client'

import React, { useState, useEffect, useRef } from 'react'
import { BTCCollector, CandleData } from '../lib/btc-collector'
import CandleChart from '../components/CandleChart'
import PerformancePanel from '../components/PerformancePanel'

export default function Home() {
  const [candles, setCandles] = useState<CandleData[]>([])
  const [isCollecting, setIsCollecting] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [totalCandles, setTotalCandles] = useState(0)
  const collectorRef = useRef<BTCCollector | null>(null)

  // Inicializar coletor
  useEffect(() => {
    collectorRef.current = new BTCCollector((newCandles) => {
        setCandles(newCandles)
      setTotalCandles(newCandles.length)
        setLastUpdate(new Date().toLocaleTimeString('pt-BR'))
    })

    // Carregar dados existentes
    loadExistingData()
    
    return () => {
      if (collectorRef.current) {
        collectorRef.current.stopCollection()
      }
    }
  }, [])

  const loadExistingData = async () => {
    if (collectorRef.current) {
      const existingCandles = await collectorRef.current.getCandlesFromDB(100)
      setCandles(existingCandles)
      setTotalCandles(existingCandles.length)
    }
  }

  const toggleCollection = async () => {
    if (!collectorRef.current) return

    if (isCollecting) {
      collectorRef.current.stopCollection()
      setIsCollecting(false)
    } else {
      await collectorRef.current.startCollection()
      setIsCollecting(true)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: 'white',
      padding: '20px'
    }}>
      {/* Cabeçalho */}
      <div style={{
        textAlign: 'center',
        marginBottom: '32px',
        borderBottom: '1px solid #334155',
        paddingBottom: '20px'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '16px',
          background: 'linear-gradient(45deg, #f59e0b, #eab308)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          ₿ Catalogador BTC/USDT
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
          Monitoramento contínuo de candles e análise de estratégias probabilísticas
        </p>
      </div>

      {/* Painel de Controle */}
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{
              display: 'flex',
          gap: '24px',
              alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={toggleCollection}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isCollecting ? '#ef4444' : '#22c55e',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isCollecting ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  backgroundColor: 'white',
                  borderRadius: '2px'
                }}></span>
                Parar Coleta
              </>
            ) : (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '0',
                  height: '0',
                  borderLeft: '8px solid white',
                  borderTop: '5px solid transparent',
                  borderBottom: '5px solid transparent'
                }}></span>
                Iniciar Coleta
              </>
            )}
          </button>

          <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: isCollecting ? '#22c55e' : '#64748b'
            }}>
              {isCollecting && (
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}></div>
              )}
            </div>
            <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              {isCollecting ? 'Coletando em tempo real' : 'Coleta pausada'}
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'center'
        }}>
          <div style={{
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
              Total de Candles
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {totalCandles}
            </div>
          </div>

          {lastUpdate && (
            <div style={{
              textAlign: 'right'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                Última Atualização
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {lastUpdate}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gráfico de Candles */}
      <CandleChart candles={candles} />

      {/* Painel de Performance */}
      <PerformancePanel />

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}
