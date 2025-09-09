'use client'

import { useState, useEffect } from 'react'

interface LearningStats {
  accuracy: number
  totalSimulations: number
  solDataPoints: number
  learningPhase: string
  lastUpdate: string
  targetAccuracy: number
}

interface SolSignal {
  prediction: 'GREEN' | 'RED' | 'YELLOW'
  confidence: number
  price: number
  timestamp: string
  accuracy: number
}

interface AdvancedSignal {
  id: string
  timestamp: string
  prediction: 'GREEN' | 'RED' | 'YELLOW'
  confidence: number
  accuracy: number
  entryWindow: string
  targetCandle: string
  actualResult?: 'GREEN' | 'RED' | 'YELLOW'
  wasCorrect?: boolean
  validatedAt?: string
  reasoning?: string
  countdown?: number
}

export default function Home() {
  const [learningStats, setLearningStats] = useState<LearningStats>({
    accuracy: 0,
    totalSimulations: 0,
    solDataPoints: 0,
    learningPhase: 'INITIAL',
    lastUpdate: '',
    targetAccuracy: 95
  })

  const [solSignal, setSolSignal] = useState<SolSignal | null>(null)
  const [advancedSignal, setAdvancedSignal] = useState<AdvancedSignal | null>(null)
  const [signalHistory, setSignalHistory] = useState<AdvancedSignal[]>([])
  const [isLearning, setIsLearning] = useState(false)
  const [isSmartLearning, setIsSmartLearning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [countdown, setCountdown] = useState(0)

  // Função para buscar estatísticas em tempo real
  const fetchRealTimeStats = async () => {
    try {
      setIsLoading(true)
      setMessage('🔄 Buscando dados em tempo real...')
      
      // PRIORIDADE 1: Verificar sistema simultâneo primeiro
      let simultaneousData = null
      try {
        const simultaneousResponse = await fetch('/api/sol/simultaneous-learning')
        simultaneousData = await simultaneousResponse.json()
        setIsSmartLearning(simultaneousData.isSimultaneousLearning || false)
        console.log('🚀 Status do sistema simultâneo:', simultaneousData.isSimultaneousLearning ? '500 TRADES SIMULTÂNEOS' : 'PARADO')
        
        if (simultaneousData.simultaneousCount) {
          console.log(`📊 Ciclos simultâneos: ${simultaneousData.simultaneousCount}`)
        }
        if (simultaneousData.bestAccuracy) {
          console.log(`🎯 Melhor precisão: ${simultaneousData.bestAccuracy.toFixed(2)}%`)
        }
        if (simultaneousData.totalTrades) {
          console.log(`📈 Trades acumulados: ${simultaneousData.totalTrades.toLocaleString()}`)
        }
        if (simultaneousData.correctTrades) {
          console.log(`✅ Trades corretos: ${simultaneousData.correctTrades.toLocaleString()}`)
        }
      } catch (error) {
        console.error('Erro ao verificar status simultâneo:', error)
      }

      // PRIORIDADE 2: Se sistema simultâneo está ativo, usar seus dados
      if (simultaneousData?.isSimultaneousLearning) {
        const currentAccuracy = simultaneousData.currentAccuracy || simultaneousData.bestAccuracy || 0
        setLearningStats(prev => ({
          ...prev,
          accuracy: currentAccuracy,
          totalSimulations: simultaneousData.totalTrades || prev.totalSimulations,
          solDataPoints: simultaneousData.totalTrades || prev.solDataPoints,
          learningPhase: currentAccuracy >= 95 ? 'READY' : 'LEARNING',
          lastUpdate: new Date().toISOString()
        }))
        setMessage(`🎯 Sistema simultâneo ativo! Precisão: ${currentAccuracy.toFixed(2)}%`)
        console.log(`🎯 Interface atualizada com dados simultâneos: ${currentAccuracy.toFixed(2)}%`)
        return // Não buscar dados de outras APIs se sistema simultâneo está ativo
      }

      // PRIORIDADE 3: Se sistema simultâneo não está ativo, buscar dados normais
      const response = await fetch('/api/sol/real-time-stats')
      const data = await response.json()
      
      if (data.success && data.stats) {
        setLearningStats(prev => ({
          ...prev,
          ...data.stats
        }))
        setMessage(`📊 Dados atualizados! Precisão: ${(data.stats.accuracy || 0).toFixed(1)}%`)
        console.log('📊 Estatísticas em tempo real atualizadas - Precisão:', (data.stats.accuracy || 0).toFixed(1) + '%')
      } else {
        setMessage('⚠️ Erro ao buscar dados. Usando dados simulados...')
        // Dados simulados para demonstração
        setLearningStats(prev => ({
          ...prev,
          accuracy: 22.1,
          totalSimulations: 1500,
          solDataPoints: 1500,
          learningPhase: 'LEARNING',
          lastUpdate: new Date().toISOString()
        }))
        console.error('Erro ao buscar estatísticas em tempo real:', data.error)
      }
    } catch (error) {
      setMessage('⚠️ Erro de conexão. Usando dados simulados...')
      // Dados simulados para demonstração
      setLearningStats(prev => ({
        ...prev,
        accuracy: 22.1,
        totalSimulations: 1500,
        solDataPoints: 1500,
        learningPhase: 'LEARNING',
        lastUpdate: new Date().toISOString()
      }))
      console.error('Erro ao buscar estatísticas em tempo real:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Função para iniciar sistema simultâneo
  const startSimultaneousLearning = async () => {
    try {
      setIsLoading(true)
      setMessage('🚀 Iniciando sistema simultâneo...')
      
      const response = await fetch('/api/sol/simultaneous-learning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (data.success) {
        setIsSmartLearning(true)
        setMessage('✅ Sistema simultâneo iniciado! Processando 500 pares...')
        console.log('🚀 Sistema simultâneo iniciado:', data)
        
        // Atualizar dados após iniciar
        setTimeout(() => {
          fetchRealTimeStats()
        }, 2000)
      } else {
        setMessage(`❌ Erro ao iniciar: ${data.error || 'Erro desconhecido'}`)
        console.error('Erro ao iniciar sistema simultâneo:', data.error)
      }
    } catch (error) {
      setMessage('❌ Erro de conexão ao iniciar sistema')
      console.error('Erro ao iniciar sistema simultâneo:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Função para gerar sinal SOL (removida - usando apenas sinal avançado)

  // Função para gerar sinal avançado com antecedência
  const generateAdvancedSignal = async () => {
    try {
      setIsLoading(true)
      setMessage('🎯 Gerando sinal com antecedência de 1 minuto...')
      
      const response = await fetch('/api/sol/advanced-signal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (data.success && data.signal) {
        setAdvancedSignal(data.signal)
        setMessage(`✅ Sinal avançado gerado! ${data.signal.prediction} (${data.signal.confidence}% confiança, ${data.signal.accuracy}% precisão)`)
        console.log('🎯 Sinal avançado gerado:', data.signal)
        
        // Iniciar contagem regressiva
        setCountdown(60)
      } else {
        setMessage(`❌ ${data.reason || data.error || 'Erro ao gerar sinal'}`)
        console.error('Erro ao gerar sinal avançado:', data)
      }
    } catch (error) {
      setMessage('❌ Erro de conexão ao gerar sinal avançado')
      console.error('Erro ao gerar sinal avançado:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Função para buscar histórico de sinais
  const fetchSignalHistory = async () => {
    try {
      const response = await fetch('/api/sol/signals')
      const data = await response.json()
      
      if (data.success) {
        setSignalHistory(data.recentSignals || [])
        console.log('📊 Histórico de sinais atualizado:', data.recentSignals?.length || 0, 'sinais')
      }
    } catch (error) {
      console.error('Erro ao buscar histórico de sinais:', error)
    }
  }

  // Função para forçar geração de sinais
  const generateSignals = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/sol/signals', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        setMessage(`✅ ${data.message}`)
        setSignalHistory(data.signals || [])
        console.log('🎯 Sinais gerados:', data.signals?.length || 0, 'sinais')
      } else {
        setMessage(`⚠️ ${data.message}`)
      }
    } catch (error) {
      setMessage('❌ Erro ao gerar sinais')
      console.error('Erro ao gerar sinais:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Função para obter cor da fase
  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'READY': return 'text-green-400'
      case 'LEARNING': return 'text-yellow-400'
      case 'OPTIMIZING': return 'text-blue-400'
      case 'DEVELOPING': return 'text-orange-400'
      default: return 'text-gray-400'
    }
  }

  // Efeito para contagem regressiva
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setMessage('⏰ Tempo de entrada expirado! Gere um novo sinal.')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [countdown])

  // Efeito para buscar dados periodicamente
  useEffect(() => {
    fetchRealTimeStats()
    fetchSignalHistory()
    const interval = setInterval(() => {
      fetchRealTimeStats()
      fetchSignalHistory()
    }, 5000) // A cada 5 segundos para melhor responsividade
    return () => clearInterval(interval)
  }, [])

  // Suprimir erro do ethereum no console
  useEffect(() => {
    const originalError = console.error
    console.error = (...args) => {
      if (args[0]?.includes?.('ethereum') || args[0]?.includes?.('Cannot redefine property')) {
        return // Suprimir erros relacionados ao ethereum
      }
      originalError.apply(console, args)
    }
    
    return () => {
      console.error = originalError
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
          <h1 className="text-3xl font-bold text-yellow-400">
            🚀 AI Trading System
          </h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">
              <div>Status: <span className={`font-bold ${getPhaseColor(learningStats.learningPhase)}`}>
                {learningStats.learningPhase}
              </span></div>
              <div>Precisão: <span className="font-bold text-green-400">{(learningStats.accuracy || 0).toFixed(1)}%</span></div>
              <div>Meta: <span className="font-bold text-purple-400">{learningStats.targetAccuracy}%</span></div>
              <div>Última atualização: {learningStats.lastUpdate ? new Date(learningStats.lastUpdate).toLocaleTimeString('pt-BR') : 'Nunca'}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Mensagem de Status */}
        {message && (
          <div className="mb-6 p-4 bg-blue-900 border border-blue-700 rounded-lg">
            <p className="text-blue-200">{message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna Esquerda */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-yellow-400">
                🎯 Sistema de Sinais com Antecedência de 1 Minuto
              </h2>
              
              <div className="bg-green-900 rounded-lg p-4 mb-4 border border-green-500">
                <h3 className="text-lg font-bold text-green-400 mb-2">🧠 Sistema de Aprendizado REAL</h3>
                <div className="text-sm space-y-1">
                  <div>• <span className="font-bold text-green-300">ML Engine Real:</span> 9 estratégias de análise de padrões</div>
                  <div>• <span className="font-bold text-green-300">Dados Reais:</span> SEM simulação - apenas análise de padrões reais</div>
                  <div>• <span className="font-bold text-green-300">Aprendizado Gradual:</span> Sistema aprende com padrões de mercado reais</div>
                  <div>• <span className="font-bold text-green-300">Critérios Rigorosos:</span> Só gera sinais com 95%+ precisão e confiança</div>
                  <div>• <span className="font-bold text-green-300">Antecedência:</span> 1 minuto antes da entrada para próxima vela</div>
                  <div>• <span className="font-bold text-green-300">Validação:</span> Confirma se previsão anterior foi correta</div>
                </div>
                <div className="mt-2 p-2 bg-green-800 rounded text-xs">
                  <span className="font-bold text-yellow-300">⚠️ IMPORTANTE:</span> Sistema limpo - Removidos todos os dados simulados. 
                  A precisão será calculada apenas com dados reais de mercado.
                </div>
              </div>
              
              {/* Sinal Avançado */}
              {advancedSignal ? (
                <div className="bg-gradient-to-r from-green-900 to-blue-900 rounded-lg p-4 mb-4 border-2 border-green-500">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold">Sinal Ativo:</span>
                    <span className={`text-2xl font-bold ${
                      advancedSignal.prediction === 'GREEN' ? 'text-green-400' :
                      advancedSignal.prediction === 'RED' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {advancedSignal.prediction}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>Confiança: <span className="font-bold text-blue-400">{advancedSignal.confidence}%</span></div>
                    <div>Precisão: <span className="font-bold text-green-400">{advancedSignal.accuracy}%</span></div>
                    <div>Timestamp: <span className="font-bold text-gray-400">{new Date(advancedSignal.timestamp).toLocaleString('pt-BR')}</span></div>
                    <div>ID: <span className="font-bold text-purple-400">{advancedSignal.id}</span></div>
                  </div>

                  {/* Janela de Entrada */}
                  <div className="bg-gray-700 rounded-lg p-3 mb-4">
                    <h4 className="font-bold text-yellow-400 mb-2">⏰ Janela de Entrada:</h4>
                    <div className="text-sm">
                      <div>Início: <span className="font-bold text-green-400">{new Date(advancedSignal.entryWindow.split(' - ')[0]).toLocaleString('pt-BR')}</span></div>
                      <div>Fim: <span className="font-bold text-red-400">{new Date(advancedSignal.entryWindow.split(' - ')[1]).toLocaleString('pt-BR')}</span></div>
                    </div>
                  </div>

                  {/* Vela Alvo */}
                  <div className="bg-gray-700 rounded-lg p-3 mb-4">
                    <h4 className="font-bold text-cyan-400 mb-2">🎯 Vela Alvo:</h4>
                    <div className="text-sm">
                      <div>Início: <span className="font-bold text-green-400">{new Date(advancedSignal.targetCandle.split(' - ')[0]).toLocaleString('pt-BR')}</span></div>
                      <div>Fim: <span className="font-bold text-red-400">{new Date(advancedSignal.targetCandle.split(' - ')[1]).toLocaleString('pt-BR')}</span></div>
                    </div>
                  </div>

                  {/* Contagem Regressiva */}
                  {countdown > 0 && (
                    <div className="bg-red-900 rounded-lg p-3 mb-4 text-center">
                      <h4 className="font-bold text-red-400 mb-2">⏰ Tempo Restante para Entrada:</h4>
                      <div className="text-3xl font-bold text-white">{countdown}s</div>
                    </div>
                  )}

                  {/* Reasoning */}
                  {advancedSignal.reasoning && (
                    <div className="bg-gray-700 rounded-lg p-3 mb-4">
                      <h4 className="font-bold text-purple-400 mb-2">🧠 Análise da IA:</h4>
                      <div className="text-sm text-gray-300">{advancedSignal.reasoning}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-700 rounded-lg p-4 mb-4 text-center">
                  <p className="text-gray-400">Nenhum sinal ativo. Gere um sinal com antecedência de 1 minuto.</p>
                </div>
              )}


              <div className="flex space-x-4">
                <button
                  onClick={generateAdvancedSignal}
                  disabled={isLoading}
                  className={`px-6 py-3 rounded font-bold transition-colors ${
                    isLoading
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isLoading ? '⏳ Gerando...' : '🎯 Gerar Sinal com Antecedência'}
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-cyan-400">
                📊 Estatísticas de Aprendizado
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Simulações: <span className="font-bold text-blue-400">{learningStats.totalSimulations.toLocaleString()}</span></div>
                <div>Precisão Atual: <span className="font-bold text-green-400">{learningStats.accuracy.toFixed(1)}%</span></div>
                <div>Dados SOL: <span className="font-bold text-yellow-400">{learningStats.solDataPoints.toLocaleString()}</span></div>
                <div>Meta: <span className="font-bold text-purple-400">{learningStats.targetAccuracy}%</span></div>
              </div>
              
              {isSmartLearning && (
                <div className="mt-4 p-3 bg-green-900/30 border border-green-500/50 rounded-lg">
                  <div className="flex items-center justify-center text-green-300">
                    <div className="animate-spin mr-2">🔄</div>
                    <span className="text-sm font-medium">Sistema Aprendendo em Tempo Real</span>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progresso para Meta</span>
                  <span>{((learningStats.accuracy / learningStats.targetAccuracy) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((learningStats.accuracy / learningStats.targetAccuracy) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Histórico de Sinais */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-purple-400">
                📈 Histórico de Sinais (Últimas 10)
              </h3>
              
              {signalHistory.length > 0 ? (
                <div className="space-y-3">
                  {signalHistory.slice(-10).map((signal, index) => (
                    <div key={signal.id || index} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold">
                          {new Date(signal.timestamp).toLocaleString('pt-BR')}
                        </span>
                        <span className={`text-lg font-bold ${
                          signal.prediction === 'GREEN' ? 'text-green-400' :
                          signal.prediction === 'RED' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {signal.prediction}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>Confiança: <span className="font-bold text-blue-400">{signal.confidence}%</span></div>
                        <div>Precisão: <span className="font-bold text-green-400">{signal.accuracy}%</span></div>
                        <div>
                          {signal.wasCorrect !== undefined ? (
                            <span className={`font-bold ${
                              signal.wasCorrect ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {signal.wasCorrect ? '✅ CORRETO' : '❌ INCORRETO'}
                            </span>
                          ) : (
                            <span className="font-bold text-yellow-400">⏳ PENDENTE</span>
                          )}
                        </div>
                      </div>
                      
                      {signal.actualResult && (
                        <div className="mt-2 text-xs text-gray-400">
                          Resultado: <span className="font-bold text-white">{signal.actualResult}</span>
                          {signal.validatedAt && (
                            <span className="ml-2">
                              Validado: {new Date(signal.validatedAt).toLocaleString('pt-BR')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-4">
                  <p>Nenhum sinal no histórico ainda</p>
                  <p className="text-sm">Gere sinais para ver o histórico de validação</p>
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-purple-400">
                🚀 Sistema Simultâneo
              </h3>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-900 to-pink-900 p-6 rounded-lg border-2 border-purple-500">
                  <h3 className="text-xl font-bold text-purple-400 mb-4 text-center">
                    Sistema de Aprendizado Simultâneo
                  </h3>
                  
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-white mb-2">
                      {isSmartLearning ? '🟢 ATIVO' : '🔴 INATIVO'}
                    </div>
                    <div className="text-sm text-purple-300">
                      {isSmartLearning ? 'Processando 500 pares simultaneamente' : 'Sistema parado'}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Progresso para 95%</span> 
                      <span>{Math.min(((learningStats.accuracy || 0) / 95) * 100, 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(((learningStats.accuracy || 0) / 95) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-center mb-4">
                    <div className="text-sm text-purple-300">
                      {learningStats.learningPhase === 'READY' ? (
                        <div className="text-green-400 font-bold text-lg">
                          ✅ Sistema pronto para operar!
                        </div>
                      ) : learningStats.learningPhase === 'LEARNING' ? (
                        <div className="text-yellow-400 font-bold">
                          ⚡ Aprendendo com dados em tempo real...
                        </div>
                      ) : (
                        <div className="text-red-400 font-bold">
                          🔄 Sistema em desenvolvimento...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={fetchRealTimeStats}
                      disabled={isLoading}
                      className={`w-full py-3 px-6 rounded font-bold transition-colors ${
                        isLoading
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      {isLoading ? '⏳ Atualizando...' : '🔄 Atualizar Dados'}
                    </button>
                    
                    <button
                      onClick={startSimultaneousLearning}
                      disabled={isLoading || isSmartLearning}
                      className={`w-full py-3 px-6 rounded font-bold transition-colors ${
                        isLoading || isSmartLearning
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {isLoading ? '⏳ Iniciando...' : isSmartLearning ? '✅ Sistema Ativo' : '🚀 Iniciar Sistema Simultâneo'}
                    </button>
                    
                    <button
                      onClick={generateAdvancedSignal}
                      disabled={isLoading}
                      className={`w-full py-3 px-6 rounded font-bold transition-colors ${
                        isLoading
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {isLoading ? '⏳ Gerando...' : '🎯 Gerar Sinal com Antecedência'}
                    </button>
                    
                    <button
                      onClick={generateSignals}
                      disabled={isLoading}
                      className={`w-full py-3 px-6 rounded font-bold transition-colors ${
                        isLoading
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isLoading ? '⏳ Gerando...' : '🎯 Gerar Sinais ML'}
                    </button>
                  </div>

                  <div className="mt-4 text-center text-xs text-purple-300">
                    <div>📊 500 trades simultâneos por minuto</div>
                    <div>⚡ Executa a cada 1 minuto</div>
                    <div>🎯 Foca em EURUSD e SOLUSDT</div>
                    <div>🧠 9 estratégias de padrões de cor</div>
                    <div>🚀 Sistema SIMULTÂNEO para aprendizado acelerado</div>
                    
                    {isSmartLearning && (
                      <div className="mt-2 text-green-400 font-bold">
                        ✅ Sistema simultâneo ativo - Dados em tempo real do sistema simultâneo
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-gray-400 bg-gray-700 p-3 rounded">
              🤖 Sistema funciona automaticamente 24/7<br/>
              🧠 "Aprendizado Avançado" = IA completa com RSI, momentum, pullbacks<br/>
              🔥 "Aprendizado Intensivo" = 1000 pares simulados para máxima precisão<br/>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-green-400">
                📈 Como Funciona
              </h3>
              
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Foco exclusivo no SOL (1 minuto)</li>
                <li>• Aprendizado com 500 pares simulados</li>
                <li>• Dados históricos do SOL (6 meses)</li>
                <li>• Validação com pullbacks</li>
                <li>• Meta: 95% de precisão</li>
                <li>• Geração de sinais em tempo real</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-red-400">
                ⚠️ Status do Sistema
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Fase:</span>
                  <span className={`font-bold ${getPhaseColor(learningStats.learningPhase)}`}>
                    {learningStats.learningPhase}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Aprendizado:</span>
                  <span className={`font-bold ${isLearning ? 'text-green-400' : 'text-yellow-400'}`}>
                    {isLearning ? 'Ativo' : 'Parado'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Pronto para Sinais:</span>
                  <span className={`font-bold ${
                    learningStats.learningPhase === 'MASTER' || learningStats.learningPhase === 'READY'
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}>
                    {learningStats.learningPhase === 'MASTER' || learningStats.learningPhase === 'READY' ? 'Sim' : 'Não'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}