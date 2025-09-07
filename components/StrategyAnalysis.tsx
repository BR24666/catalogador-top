'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { StrategyAnalyzer, StrategyResult, WaveAnalysis, WavePrediction } from '../lib/strategy-analyzer'

const supabaseUrl = 'https://lgddsslskhzxtpjathjr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws'
const supabase = createClient(supabaseUrl, supabaseKey)

interface StrategyAnalysisProps {
  selectedDate: string
  selectedTimeframe: string
}

export default function StrategyAnalysis({ selectedDate, selectedTimeframe }: StrategyAnalysisProps) {
  const [strategies, setStrategies] = useState<StrategyResult[]>([])
  const [waveAnalysis, setWaveAnalysis] = useState<WaveAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyResult | null>(null)
  const [showWaveAnalysis, setShowWaveAnalysis] = useState(false)

  const loadAndAnalyze = async () => {
    try {
      setLoading(true)
      console.log(`🔍 Analisando estratégias para ${selectedDate} - ${selectedTimeframe}`)
      
      const { data, error } = await supabase
        .from('historical_candle_data')
        .select('*')
        .eq('full_date', selectedDate)
        .eq('timeframe', selectedTimeframe)
        .eq('pair', 'SOLUSDT')
        .order('timestamp', { ascending: true })
      
      if (error) {
        console.error('❌ Erro ao carregar dados:', error)
        return
      }
      
      if (data && data.length > 0) {
        const analyzer = new StrategyAnalyzer(data)
        const results = analyzer.getStrategyResults()
        const waves = analyzer.analyzeWaves()
        
        setStrategies(results)
        setWaveAnalysis(waves)
        console.log(`📊 Análise concluída: ${results.length} estratégias analisadas`)
        console.log(`🌊 Análise de ondas: ${waves.upcomingWaves.length} oportunidades identificadas`)
      }
      
    } catch (error) {
      console.error('❌ Erro na análise:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAndAnalyze()
  }, [selectedDate, selectedTimeframe])

  const getStrategyIcon = (strategy: string) => {
    const icons: { [key: string]: string } = {
      'MHI': '📊',
      'Minority': '🔄',
      'ThreeSoldiers': '⚔️',
      'Alternation': '🔄',
      'ForceCandle': '💪',
      'Engulfing': '🍽️',
      'QuadrantFirst': '⏰',
      'DojiReversal': '⚖️',
      'OddSequence': '🔢',
      'ThreeValleys': '🏔️'
    }
    return icons[strategy] || '📈'
  }

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 80) return '#22c55e' // Verde
    if (winRate >= 60) return '#eab308' // Amarelo
    if (winRate >= 40) return '#f97316' // Laranja
    return '#ef4444' // Vermelho
  }

  const getBestEntry = (strategy: StrategyResult) => {
    const entries = [
      { name: '1ª Entrada', stats: strategy.entry1Stats },
      { name: '2ª Entrada', stats: strategy.entry2Stats },
      { name: '3ª Entrada', stats: strategy.entry3Stats }
    ]
    
    return entries.reduce((best, current) => 
      current.stats.winRate > best.stats.winRate ? current : best
    )
  }

  const renderWaveAnalysis = () => {
    if (!waveAnalysis) return null

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'ONDA_ATIVA': return '#22c55e'
        case 'PREPARANDO': return '#fbbf24'
        case 'AGUARDANDO': return '#6b7280'
        default: return '#ef4444'
      }
    }

    const getConfidenceColor = (level: string) => {
      switch (level) {
        case 'MUITO_ALTA': return '#22c55e'
        case 'ALTA': return '#60a5fa'
        case 'MÉDIA': return '#fbbf24'
        default: return '#ef4444'
      }
    }

    const getRiskColor = (level: string) => {
      switch (level) {
        case 'BAIXO': return '#22c55e'
        case 'MÉDIO': return '#fbbf24'
        default: return '#ef4444'
      }
    }

    return React.createElement('div', null,
      // Status atual
      React.createElement('div', { style: { backgroundColor: '#1f2937', padding: '20px', borderRadius: '12px', marginBottom: '24px' } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', marginBottom: '16px' } },
          React.createElement('div', { 
            style: { 
              width: '12px', 
              height: '12px', 
              borderRadius: '50%', 
              backgroundColor: getStatusColor(waveAnalysis.currentStatus),
              marginRight: '12px'
            } 
          }),
          React.createElement('h3', { style: { fontSize: '1.5rem', fontWeight: 'bold', color: 'white' } }, 
            `Status: ${waveAnalysis.currentStatus.replace('_', ' ')}`
          )
        ),
        React.createElement('p', { style: { color: '#9ca3af', marginBottom: '16px' } }, waveAnalysis.riskAssessment),
        
        // Estatísticas gerais
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' } },
          React.createElement('div', { style: { textAlign: 'center' } },
            React.createElement('div', { style: { fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' } }, waveAnalysis.activeWaves.length.toString()),
            React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.875rem' } }, 'Ondas Ativas')
          ),
          React.createElement('div', { style: { textAlign: 'center' } },
            React.createElement('div', { style: { fontSize: '2rem', fontWeight: 'bold', color: '#60a5fa' } }, waveAnalysis.upcomingWaves.length.toString()),
            React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.875rem' } }, 'Oportunidades')
          ),
          React.createElement('div', { style: { textAlign: 'center' } },
            React.createElement('div', { style: { fontSize: '2rem', fontWeight: 'bold', color: '#fbbf24' } }, `${waveAnalysis.totalExpectedReturn.toFixed(1)}x`),
            React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.875rem' } }, 'Retorno Esperado')
          )
        )
      ),

      // Melhor oportunidade
      waveAnalysis.bestOpportunity && React.createElement('div', { style: { backgroundColor: '#1f2937', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '2px solid #22c55e' } },
        React.createElement('h3', { style: { fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '16px' } }, '🏆 MELHOR OPORTUNIDADE'),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' } },
          React.createElement('div', null,
            React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.875rem', marginBottom: '4px' } }, 'Estratégia:'),
            React.createElement('div', { style: { color: 'white', fontWeight: 'bold' } }, waveAnalysis.bestOpportunity.strategyName)
          ),
          React.createElement('div', null,
            React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.875rem', marginBottom: '4px' } }, 'Probabilidade:'),
            React.createElement('div', { style: { color: getConfidenceColor(waveAnalysis.bestOpportunity.confidenceLevel), fontWeight: 'bold' } }, `${waveAnalysis.bestOpportunity.nextWaveProbability}%`)
          ),
          React.createElement('div', null,
            React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.875rem', marginBottom: '4px' } }, 'Wins Esperados:'),
            React.createElement('div', { style: { color: '#22c55e', fontWeight: 'bold' } }, `${waveAnalysis.bestOpportunity.expectedMinWins} wins`)
          ),
          React.createElement('div', null,
            React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.875rem', marginBottom: '4px' } }, 'Multiplicador:'),
            React.createElement('div', { style: { color: '#fbbf24', fontWeight: 'bold' } }, `${waveAnalysis.bestOpportunity.capitalMultiplier}x`)
          ),
          React.createElement('div', null,
            React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.875rem', marginBottom: '4px' } }, 'Melhor Horário:'),
            React.createElement('div', { style: { color: '#60a5fa', fontWeight: 'bold' } }, `${waveAnalysis.bestOpportunity.bestDay} às ${waveAnalysis.bestOpportunity.bestEntryTime}`)
          ),
          React.createElement('div', null,
            React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.875rem', marginBottom: '4px' } }, 'Tempo Restante:'),
            React.createElement('div', { style: { color: '#ef4444', fontWeight: 'bold' } }, waveAnalysis.bestOpportunity.timeToNextWave)
          )
        )
      ),

      // Todas as oportunidades
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' } },
        ...waveAnalysis.upcomingWaves.map((wave, index) =>
          React.createElement('div', {
            key: wave.strategyId,
            style: {
              backgroundColor: '#1f2937',
              padding: '20px',
              borderRadius: '12px',
              border: index === 0 ? '2px solid #22c55e' : '2px solid transparent'
            }
          },
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' } },
              React.createElement('h4', { style: { fontSize: '1.125rem', fontWeight: 'bold', color: 'white' } }, wave.strategyName),
              React.createElement('div', { 
                style: { 
                  padding: '4px 12px', 
                  borderRadius: '20px', 
                  backgroundColor: getConfidenceColor(wave.confidenceLevel),
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                } 
              }, wave.confidenceLevel.replace('_', ' '))
            ),
            
            React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' } },
              React.createElement('div', null,
                React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.75rem', marginBottom: '4px' } }, 'Probabilidade:'),
                React.createElement('div', { style: { color: 'white', fontWeight: 'bold' } }, `${wave.nextWaveProbability}%`)
              ),
              React.createElement('div', null,
                React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.75rem', marginBottom: '4px' } }, 'Wins Mínimos:'),
                React.createElement('div', { style: { color: '#22c55e', fontWeight: 'bold' } }, `${wave.expectedMinWins}`)
              ),
              React.createElement('div', null,
                React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.75rem', marginBottom: '4px' } }, 'Multiplicador:'),
                React.createElement('div', { style: { color: '#fbbf24', fontWeight: 'bold' } }, `${wave.capitalMultiplier}x`)
              ),
              React.createElement('div', null,
                React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.75rem', marginBottom: '4px' } }, 'Risco:'),
                React.createElement('div', { style: { color: getRiskColor(wave.riskLevel), fontWeight: 'bold' } }, wave.riskLevel)
              )
            ),
            
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' } },
              React.createElement('span', { style: { color: '#9ca3af' } }, `Melhor: ${wave.bestDay} ${wave.bestEntryTime}`),
              React.createElement('span', { style: { color: '#60a5fa' } }, `Em: ${wave.timeToNextWave}`)
            )
          )
        )
      )
    )
  }

  if (loading) {
    return React.createElement('div', { style: { textAlign: 'center', padding: '32px 0' } },
      React.createElement('div', { style: { animation: 'spin 1s linear infinite', borderRadius: '9999px', height: '48px', width: '48px', borderBottom: '2px solid #60a5fa', margin: '0 auto' } }),
      React.createElement('p', { style: { marginTop: '16px', color: '#9ca3af' } }, 'Analisando estratégias...')
    )
  }

  return React.createElement('div', { style: { padding: '24px' } },
    // Header
    React.createElement('div', { style: { marginBottom: '32px' } },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' } },
        React.createElement('div', null,
          React.createElement('h2', { style: { fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '8px', color: 'white' } }, 'Análise de Estratégias Probabilísticas'),
          React.createElement('p', { style: { color: '#9ca3af' } }, `Análise para ${selectedDate} - ${selectedTimeframe}`)
        ),
        React.createElement('button', {
          onClick: () => setShowWaveAnalysis(!showWaveAnalysis),
          style: {
            padding: '12px 24px',
            backgroundColor: showWaveAnalysis ? '#ef4444' : '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }
        },
          React.createElement('span', null, showWaveAnalysis ? '📊' : '🌊'),
          React.createElement('span', null, showWaveAnalysis ? 'Ver Estratégias' : 'Surf de Ondas')
        )
      ),
      React.createElement('div', { style: { display: 'flex', gap: '16px', flexWrap: 'wrap' } },
        React.createElement('div', { style: { backgroundColor: '#1f2937', padding: '12px 16px', borderRadius: '8px' } },
          React.createElement('span', { style: { color: '#9ca3af', fontSize: '0.875rem' } }, 'Total de Estratégias: '),
          React.createElement('span', { style: { color: 'white', fontWeight: 'bold' } }, strategies.length.toString())
        ),
        React.createElement('div', { style: { backgroundColor: '#1f2937', padding: '12px 16px', borderRadius: '8px' } },
          React.createElement('span', { style: { color: '#9ca3af', fontSize: '0.875rem' } }, 'Em 100%: '),
          React.createElement('span', { style: { color: '#22c55e', fontWeight: 'bold' } }, strategies.filter(s => s.isIn100Percent).length.toString())
        )
      )
    ),

    // Conteúdo baseado na visualização ativa
    showWaveAnalysis && waveAnalysis ? renderWaveAnalysis() :
    // Estratégias Grid
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' } },
      ...strategies.map(strategy => 
        React.createElement('div', {
          key: strategy.strategy,
          onClick: () => setSelectedStrategy(strategy),
          style: {
            backgroundColor: '#1f2937',
            borderRadius: '12px',
            padding: '20px',
            cursor: 'pointer',
            border: selectedStrategy?.strategy === strategy.strategy ? '2px solid #3b82f6' : '2px solid transparent',
            transition: 'all 0.2s ease'
          }
        },
          // Header da estratégia
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', marginBottom: '16px' } },
            React.createElement('span', { style: { fontSize: '2rem', marginRight: '12px' } }, getStrategyIcon(strategy.strategy)),
            React.createElement('div', null,
              React.createElement('h3', { style: { fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '4px' } }, strategy.strategy),
              React.createElement('p', { style: { color: '#9ca3af', fontSize: '0.875rem' } }, strategy.description)
            )
          ),

          // Estatísticas principais
          React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' } },
            React.createElement('div', { style: { textAlign: 'center' } },
              React.createElement('div', { style: { fontSize: '2rem', fontWeight: 'bold', color: getWinRateColor(strategy.winRate) } }, `${strategy.winRate.toFixed(1)}%`),
              React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.875rem' } }, 'Taxa de Acerto')
            ),
            React.createElement('div', { style: { textAlign: 'center' } },
              React.createElement('div', { style: { fontSize: '2rem', fontWeight: 'bold', color: '#60a5fa' } }, strategy.totalTrades.toString()),
              React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.875rem' } }, 'Total de Trades')
            )
          ),

          // Análise de ciclos de 100%
          React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' } },
            React.createElement('div', { style: { textAlign: 'center', backgroundColor: '#374151', padding: '8px', borderRadius: '6px' } },
              React.createElement('div', { style: { fontSize: '1.25rem', fontWeight: 'bold', color: '#22c55e' } }, strategy.totalCycles.toString()),
              React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.75rem' } }, 'Total Ciclos')
            ),
            React.createElement('div', { style: { textAlign: 'center', backgroundColor: '#374151', padding: '8px', borderRadius: '6px' } },
              React.createElement('div', { style: { fontSize: '1.25rem', fontWeight: 'bold', color: '#ef4444' } }, strategy.guaranteedMinWins.toString()),
              React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.75rem' } }, 'Mín. Garantido')
            ),
            React.createElement('div', { style: { textAlign: 'center', backgroundColor: '#374151', padding: '8px', borderRadius: '6px' } },
              React.createElement('div', { style: { fontSize: '1.25rem', fontWeight: 'bold', color: '#60a5fa' } }, strategy.avgCycleWins.toString()),
              React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.75rem' } }, 'Média Ciclos')
            ),
            React.createElement('div', { style: { textAlign: 'center', backgroundColor: strategy.isIn100Percent ? '#22c55e' : '#374151', padding: '8px', borderRadius: '6px' } },
              React.createElement('div', { style: { fontSize: '1.25rem', fontWeight: 'bold', color: 'white' } }, strategy.currentCycleWins.toString()),
              React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.75rem' } }, 'Ciclo Atual')
            )
          ),

          // Melhor entrada
          React.createElement('div', { style: { backgroundColor: '#374151', padding: '12px', borderRadius: '8px' } },
            React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.875rem', marginBottom: '8px' } }, 'Melhor Entrada:'),
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
              React.createElement('span', { style: { color: 'white', fontWeight: 'bold' } }, getBestEntry(strategy).name),
              React.createElement('span', { style: { color: '#22c55e', fontWeight: 'bold' } }, `${getBestEntry(strategy).stats.winRate.toFixed(1)}%`)
            )
          ),

          // Status 100%
          strategy.isIn100Percent && React.createElement('div', { 
            style: { 
              backgroundColor: '#22c55e', 
              color: 'white', 
              padding: '8px 12px', 
              borderRadius: '6px', 
              textAlign: 'center', 
              marginTop: '12px',
              fontWeight: 'bold'
            } 
          }, `🔥 100% de Acertividade - ${strategy.timeIn100Percent} trades`)
        )
      )
    ),

    // Modal de detalhes (se estratégia selecionada)
    selectedStrategy && React.createElement('div', {
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      },
      onClick: () => setSelectedStrategy(null)
    },
      React.createElement('div', {
        style: {
          backgroundColor: '#1f2937',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto'
        },
        onClick: (e: React.MouseEvent) => e.stopPropagation()
      },
        // Header do modal
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' } },
          React.createElement('h3', { style: { fontSize: '1.5rem', fontWeight: 'bold', color: 'white' } }, `${getStrategyIcon(selectedStrategy.strategy)} ${selectedStrategy.strategy}`),
          React.createElement('button', {
            onClick: () => setSelectedStrategy(null),
            style: {
              backgroundColor: 'transparent',
              border: 'none',
              color: '#9ca3af',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }
          }, '×')
        ),

        // Descrição
        React.createElement('div', { style: { marginBottom: '24px' } },
          React.createElement('h4', { style: { color: 'white', marginBottom: '8px' } }, 'Descrição:'),
          React.createElement('p', { style: { color: '#9ca3af' } }, selectedStrategy.description)
        ),

        // Sinal
        React.createElement('div', { style: { marginBottom: '24px' } },
          React.createElement('h4', { style: { color: 'white', marginBottom: '8px' } }, 'Sinal:'),
          React.createElement('p', { style: { color: '#9ca3af' } }, selectedStrategy.signal)
        ),

        // Entradas
        React.createElement('div', { style: { marginBottom: '24px' } },
          React.createElement('h4', { style: { color: 'white', marginBottom: '12px' } }, 'Análise por Entrada:'),
          React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' } },
            React.createElement('div', { style: { backgroundColor: '#374151', padding: '12px', borderRadius: '8px', textAlign: 'center' } },
              React.createElement('div', { style: { color: 'white', fontWeight: 'bold', marginBottom: '4px' } }, selectedStrategy.entry1),
              React.createElement('div', { style: { color: '#22c55e', fontSize: '1.25rem', fontWeight: 'bold' } }, `${selectedStrategy.entry1Stats.winRate.toFixed(1)}%`),
              React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.875rem' } }, `${selectedStrategy.entry1Stats.wins}W/${selectedStrategy.entry1Stats.losses}L`)
            ),
            React.createElement('div', { style: { backgroundColor: '#374151', padding: '12px', borderRadius: '8px', textAlign: 'center' } },
              React.createElement('div', { style: { color: 'white', fontWeight: 'bold', marginBottom: '4px' } }, selectedStrategy.entry2),
              React.createElement('div', { style: { color: '#22c55e', fontSize: '1.25rem', fontWeight: 'bold' } }, `${selectedStrategy.entry2Stats.winRate.toFixed(1)}%`),
              React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.875rem' } }, `${selectedStrategy.entry2Stats.wins}W/${selectedStrategy.entry2Stats.losses}L`)
            ),
            React.createElement('div', { style: { backgroundColor: '#374151', padding: '12px', borderRadius: '8px', textAlign: 'center' } },
              React.createElement('div', { style: { color: 'white', fontWeight: 'bold', marginBottom: '4px' } }, selectedStrategy.entry3),
              React.createElement('div', { style: { color: '#22c55e', fontSize: '1.25rem', fontWeight: 'bold' } }, `${selectedStrategy.entry3Stats.winRate.toFixed(1)}%`),
              React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.875rem' } }, `${selectedStrategy.entry3Stats.wins}W/${selectedStrategy.entry3Stats.losses}L`)
            )
          )
        ),

        // Melhor horário e dia
        React.createElement('div', { style: { marginBottom: '24px' } },
          React.createElement('h4', { style: { color: 'white', marginBottom: '12px' } }, 'Melhor Performance:'),
          React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' } },
            React.createElement('div', { style: { backgroundColor: '#374151', padding: '12px', borderRadius: '8px' } },
              React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.875rem', marginBottom: '4px' } }, 'Melhor Dia:'),
              React.createElement('div', { style: { color: 'white', fontWeight: 'bold' } }, selectedStrategy.bestDay)
            ),
            React.createElement('div', { style: { backgroundColor: '#374151', padding: '12px', borderRadius: '8px' } },
              React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.875rem', marginBottom: '4px' } }, 'Melhor Hora:'),
              React.createElement('div', { style: { color: 'white', fontWeight: 'bold' } }, `${selectedStrategy.bestHour.toString().padStart(2, '0')}:00`)
            )
          )
        ),

        // Análise de Ciclos de 100%
        React.createElement('div', { style: { marginBottom: '24px' } },
          React.createElement('h4', { style: { color: 'white', marginBottom: '12px' } }, 'Análise de Ciclos de 100%:'),
          React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' } },
            React.createElement('div', { style: { backgroundColor: '#374151', padding: '12px', borderRadius: '8px' } },
              React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.875rem', marginBottom: '4px' } }, 'Total de Ciclos:'),
              React.createElement('div', { style: { color: 'white', fontWeight: 'bold' } }, selectedStrategy.totalCycles.toString())
            ),
            React.createElement('div', { style: { backgroundColor: '#374151', padding: '12px', borderRadius: '8px' } },
              React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.875rem', marginBottom: '4px' } }, 'Mínimo Garantido:'),
              React.createElement('div', { style: { color: '#ef4444', fontWeight: 'bold' } }, `${selectedStrategy.guaranteedMinWins} wins`)
            ),
            React.createElement('div', { style: { backgroundColor: '#374151', padding: '12px', borderRadius: '8px' } },
              React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.875rem', marginBottom: '4px' } }, 'Máximo de Ciclos:'),
              React.createElement('div', { style: { color: '#22c55e', fontWeight: 'bold' } }, `${selectedStrategy.maxCycleWins} wins`)
            ),
            React.createElement('div', { style: { backgroundColor: '#374151', padding: '12px', borderRadius: '8px' } },
              React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.875rem', marginBottom: '4px' } }, 'Média de Ciclos:'),
              React.createElement('div', { style: { color: '#60a5fa', fontWeight: 'bold' } }, `${selectedStrategy.avgCycleWins} wins`)
            )
          ),
          
          // Ciclos por dia da semana
          React.createElement('div', { style: { marginBottom: '16px' } },
            React.createElement('h5', { style: { color: 'white', marginBottom: '8px', fontSize: '1rem' } }, 'Ciclos por Dia da Semana:'),
            React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' } },
              ...Object.entries(selectedStrategy.cyclesByDay).map(([day, cycles]) =>
                React.createElement('div', { key: day, style: { backgroundColor: '#374151', padding: '8px', borderRadius: '6px' } },
                  React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.75rem' } }, day),
                  React.createElement('div', { style: { color: 'white', fontWeight: 'bold' } }, `${cycles.length} ciclos`),
                  React.createElement('div', { style: { color: '#60a5fa', fontSize: '0.75rem' } }, 
                    `Mín: ${Math.min(...cycles.map(c => c.consecutiveWins))} | Máx: ${Math.max(...cycles.map(c => c.consecutiveWins))}`
                  )
                )
              )
            )
          )
        ),

        // Estatísticas detalhadas
        React.createElement('div', null,
          React.createElement('h4', { style: { color: 'white', marginBottom: '12px' } }, 'Estatísticas Detalhadas:'),
          React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' } },
            React.createElement('div', { style: { backgroundColor: '#374151', padding: '12px', borderRadius: '8px' } },
              React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.875rem', marginBottom: '4px' } }, 'Total de Trades:'),
              React.createElement('div', { style: { color: 'white', fontWeight: 'bold' } }, selectedStrategy.totalTrades.toString())
            ),
            React.createElement('div', { style: { backgroundColor: '#374151', padding: '12px', borderRadius: '8px' } },
              React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.875rem', marginBottom: '4px' } }, 'Wins Consecutivos Máx:'),
              React.createElement('div', { style: { color: '#22c55e', fontWeight: 'bold' } }, selectedStrategy.maxConsecutiveWins.toString())
            ),
            React.createElement('div', { style: { backgroundColor: '#374151', padding: '12px', borderRadius: '8px' } },
              React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.875rem', marginBottom: '4px' } }, 'Wins Consecutivos Mín:'),
              React.createElement('div', { style: { color: '#f97316', fontWeight: 'bold' } }, selectedStrategy.minConsecutiveWins.toString())
            ),
            React.createElement('div', { style: { backgroundColor: '#374151', padding: '12px', borderRadius: '8px' } },
              React.createElement('div', { style: { color: '#9ca3af', fontSize: '0.875rem', marginBottom: '4px' } }, 'Streak Atual:'),
              React.createElement('div', { style: { color: selectedStrategy.isIn100Percent ? '#22c55e' : '#60a5fa', fontWeight: 'bold' } }, selectedStrategy.currentStreak.toString())
            )
          )
        )
      )
    )
  )
}
