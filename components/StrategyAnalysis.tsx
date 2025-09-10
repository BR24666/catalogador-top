'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { CandleData } from '../lib/binance-api'
import { realtimeCollector } from '../lib/realtime-collector'

const supabaseUrl = 'https://lgddsslskhzxtpjathjr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws'
const supabase = createClient(supabaseUrl, supabaseKey)

interface StrategyResult {
  strategy_name: string
  signal: 'CALL' | 'PUT' | null
  confidence: number
  accuracy: number
  total_signals: number
  correct_signals: number
  quadrant: number
  time_window: string
}

interface StrategyAnalysisProps {
  selectedDate: string
  selectedTimeframe: string
}

export default function StrategyAnalysis({ selectedDate, selectedTimeframe }: StrategyAnalysisProps) {
  const [candles, setCandles] = useState<CandleData[]>([])
  const [strategyResults, setStrategyResults] = useState<StrategyResult[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  // Estratégias probabilísticas simplificadas
  const strategies = [
    {
      name: 'MHI (Maioria)',
      analyze: (candles: CandleData[]) => {
        if (candles.length < 3) return null
        const last3 = candles.slice(-3)
        const greens = last3.filter(c => c.color === 'GREEN').length
        const reds = last3.filter(c => c.color === 'RED').length
        return greens > reds ? 'CALL' : 'PUT'
      }
    },
    {
      name: 'Minoria',
      analyze: (candles: CandleData[]) => {
        if (candles.length < 3) return null
        const last3 = candles.slice(-3)
        const greens = last3.filter(c => c.color === 'GREEN').length
        const reds = last3.filter(c => c.color === 'RED').length
        return greens < reds ? 'CALL' : 'PUT'
      }
    },
    {
      name: 'Três Soldados',
      analyze: (candles: CandleData[]) => {
        if (candles.length < 3) return null
        const last3 = candles.slice(-3)
        const allGreen = last3.every(c => c.color === 'GREEN')
        const allRed = last3.every(c => c.color === 'RED')
        if (allGreen) return 'CALL'
        if (allRed) return 'PUT'
        return null
      }
    }
  ]

  // Analisar estratégias
  const analyzeStrategies = async (candles: CandleData[]) => {
    console.log(`🔍 Analisando ${candles.length} candles para estratégias`)
    const results: StrategyResult[] = []

    for (const strategy of strategies) {
      const signal = strategy.analyze(candles)
      
      if (signal) {
        const currentCandle = candles[candles.length - 1]
        const quadrant = Math.floor((currentCandle.hour * 60 + currentCandle.minute) / 15) + 1
        
        // Buscar dados de acertividade
        const { data: strategyData } = await supabase
          .from('accuracy_cycles')
          .select('*')
          .eq('strategy_name', strategy.name)
          .eq('pair', 'SOLUSDT')
          .eq('timeframe', selectedTimeframe)
          .order('created_at', { ascending: false })
          .limit(10)

        let totalSignals = 0
        let correctSignals = 0
        let accuracy = 0

        if (strategyData && strategyData.length > 0) {
          totalSignals = strategyData.reduce((sum, cycle) => sum + cycle.total_signals, 0)
          correctSignals = strategyData.reduce((sum, cycle) => sum + cycle.correct_signals, 0)
          accuracy = totalSignals > 0 ? (correctSignals / totalSignals) * 100 : 0
        }

        results.push({
          strategy_name: strategy.name,
          signal,
          confidence: accuracy,
          accuracy,
          total_signals: totalSignals,
          correct_signals: correctSignals,
          quadrant,
          time_window: `${currentCandle.hour.toString().padStart(2, '0')}:${currentCandle.minute.toString().padStart(2, '0')}`
        })
      }
    }
    
    setStrategyResults(results)
  }

  // Carregar dados
  const loadData = async () => {
    try {
      setLoading(true)
      const collector = new realtimeCollector()
      const data = await collector.getCandlesFromSupabase('SOLUSDT', selectedTimeframe)

      if (data) {
        setCandles(data)
        await analyzeStrategies(data)
        setLastUpdate(new Date().toLocaleTimeString('pt-BR'))
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [selectedDate, selectedTimeframe])

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          fontSize: '1.875rem', 
          fontWeight: 'bold', 
          marginBottom: '16px',
          color: 'white'
        }}>
          📊 Estratégias Probabilísticas
        </h2>
        <p style={{ color: '#9ca3af', marginBottom: '16px' }}>
          Análise em tempo real das estratégias com estatísticas de acertividade
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
            <span style={{ color: '#9ca3af' }}>Última atualização: </span>
            <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{lastUpdate || 'Nunca'}</span>
          </div>
          <div style={{ 
            padding: '8px 16px', 
            backgroundColor: '#1f2937', 
            borderRadius: '8px',
            border: '1px solid #374151'
          }}>
            <span style={{ color: '#9ca3af' }}>Estratégias ativas: </span>
            <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{strategyResults.length}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '48px',
          color: '#9ca3af'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
          <p>Carregando análises em tempo real...</p>
        </div>
      ) : strategyResults.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '48px',
          color: '#9ca3af'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📊</div>
          <p>Nenhuma estratégia ativa no momento</p>
          <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>
            Aguarde mais dados ou verifique se há velas suficientes
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '16px' 
        }}>
          {strategyResults.map((result, index) => (
            <div
              key={index}
              style={{
                backgroundColor: '#1f2937',
                padding: '20px',
                borderRadius: '12px',
                border: `1px solid ${result.signal === 'CALL' ? '#22c55e' : '#ef4444'}`,
                borderLeft: `4px solid ${result.signal === 'CALL' ? '#22c55e' : '#ef4444'}`,
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  {result.strategy_name}
                </h3>
                <div style={{
                  padding: '4px 12px',
                  backgroundColor: result.signal === 'CALL' ? '#22c55e' : '#ef4444',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  {result.signal}
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div>
                  <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Acertividade</div>
                  <div style={{ 
                    color: result.accuracy >= 70 ? '#22c55e' : result.accuracy >= 50 ? '#f59e0b' : '#ef4444',
                    fontSize: '1.25rem',
                    fontWeight: 'bold'
                  }}>
                    {result.accuracy.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Sinais</div>
                  <div style={{ color: 'white', fontSize: '1rem', fontWeight: 'bold' }}>
                    {result.correct_signals}/{result.total_signals}
                  </div>
                </div>
              </div>

              <div style={{
                padding: '8px 12px',
                backgroundColor: '#374151',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: '#e5e7eb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Hora:</span>
                  <span>{result.time_window}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
