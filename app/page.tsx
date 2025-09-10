'use client'

import React, { useState, useEffect, useRef } from 'react'
import { realtimeCollector } from '../lib/realtime-collector'
import { CandleData } from '../lib/binance-api'
import CandleGrid from '../components/CandleGrid'
import StrategyAnalysis from '../components/StrategyAnalysis'

export default function Home() {
  const [candles, setCandles] = useState<CandleData[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedTimeframe, setSelectedTimeframe] = useState('1m')
  const [activeTab, setActiveTab] = useState<'catalogador' | 'estrategias'>('catalogador')
  const [isCollecting, setIsCollecting] = useState(false)
  const collectorRef = useRef<realtimeCollector | null>(null)

  // Inicializar coletor
  useEffect(() => {
    collectorRef.current = new realtimeCollector((newCandles) => {
        setCandles(newCandles)
    })
  }, [])

  // Iniciar/parar coleta
  const toggleCollection = () => {
    if (isCollecting) {
      collectorRef.current?.stopCollection('SOLUSDT', selectedTimeframe)
      setIsCollecting(false)
    } else {
      collectorRef.current?.startCollection('SOLUSDT', selectedTimeframe)
      setIsCollecting(true)
    }
  }

  // Carregar dados existentes
  const loadExistingData = async () => {
    try {
      const data = await collectorRef.current?.getCandlesFromSupabase('SOLUSDT', selectedTimeframe)
      if (data) {
        setCandles(data)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  useEffect(() => {
    loadExistingData()
  }, [selectedTimeframe])

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
          background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          📊 Catalogador Probabilístico
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
          Análise de velas e estratégias em tempo real
        </p>
      </div>

      {/* Controles */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '16px', 
        marginBottom: '32px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ color: '#e2e8f0' }}>Data:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #475569',
              backgroundColor: '#1e293b',
              color: 'white'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ color: '#e2e8f0' }}>Timeframe:</label>
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #475569',
              backgroundColor: '#1e293b',
              color: 'white'
            }}
          >
            <option value="1m">1 minuto</option>
            <option value="5m">5 minutos</option>
            <option value="15m">15 minutos</option>
          </select>
        </div>

        <button
          onClick={toggleCollection}
          style={{
            padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
            backgroundColor: isCollecting ? '#ef4444' : '#22c55e',
              color: 'white',
            fontWeight: 'bold',
              cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          {isCollecting ? '⏹️ Parar' : '▶️ Iniciar'}
        </button>
      </div>

      {/* Navegação de Abas */}
      <div style={{ 
              display: 'flex',
        justifyContent: 'center', 
        marginBottom: '32px',
        borderBottom: '1px solid #334155'
      }}>
        <button
          onClick={() => setActiveTab('catalogador')}
          style={{
              padding: '12px 24px',
              border: 'none',
            backgroundColor: activeTab === 'catalogador' ? '#3b82f6' : 'transparent',
            color: activeTab === 'catalogador' ? 'white' : '#94a3b8',
            fontWeight: 'bold',
              cursor: 'pointer',
            borderBottom: activeTab === 'catalogador' ? '3px solid #3b82f6' : '3px solid transparent',
            transition: 'all 0.3s ease'
          }}
        >
          🕯️ Catalogador de Velas
        </button>
        <button
          onClick={() => setActiveTab('estrategias')}
          style={{
              padding: '12px 24px',
              border: 'none',
            backgroundColor: activeTab === 'estrategias' ? '#3b82f6' : 'transparent',
            color: activeTab === 'estrategias' ? 'white' : '#94a3b8',
            fontWeight: 'bold',
              cursor: 'pointer',
            borderBottom: activeTab === 'estrategias' ? '3px solid #3b82f6' : '3px solid transparent',
            transition: 'all 0.3s ease'
          }}
        >
          📊 Estratégias Probabilísticas
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'catalogador' && (
        <CandleGrid 
          candles={candles}
          selectedDate={selectedDate}
          selectedTimeframe={selectedTimeframe}
        />
      )}

      {activeTab === 'estrategias' && (
        <StrategyAnalysis 
          selectedDate={selectedDate}
          selectedTimeframe={selectedTimeframe}
        />
      )}
    </div>
  )
}