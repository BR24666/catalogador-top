'use client'

import { useState, useEffect } from 'react'
import { Play, Square, RefreshCw, Database } from 'lucide-react'

interface StatusData {
  isRunning: boolean
  lastUpdate: string | null
  timestamp: string
}

export default function ControlPanel() {
  const [status, setStatus] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(false)
  const [collecting, setCollecting] = useState(false)

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status')
      const data = await response.json()
      if (data.success) {
        setStatus(data.data)
      }
    } catch (error) {
      console.error('Erro ao buscar status:', error)
    }
  }

  const collectData = async () => {
    setCollecting(true)
    try {
      const response = await fetch('/api/collect', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        alert('✅ Dados coletados com sucesso!')
        fetchStatus() // Atualizar status
      } else {
        alert('❌ Erro ao coletar dados: ' + data.message)
      }
    } catch (error) {
      console.error('Erro ao coletar dados:', error)
      alert('❌ Erro ao coletar dados')
    } finally {
      setCollecting(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000) // Atualizar a cada 30s
    return () => clearInterval(interval)
  }, [])

  const formatLastUpdate = (timestamp: string | null) => {
    if (!timestamp) return 'Nunca'
    const date = new Date(timestamp)
    return date.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Database className="w-6 h-6" />
          Control Panel
        </h2>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Status do Sistema */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Status do Sistema</h3>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${status?.isRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={status?.isRunning ? 'text-green-400' : 'text-red-400'}>
              {status?.isRunning ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>

        {/* Última Atualização */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Última Coleta</h3>
          <p className="text-sm text-gray-300">
            {formatLastUpdate(status?.lastUpdate || null)}
          </p>
        </div>

        {/* Coleta Manual */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Coleta Manual</h3>
          <button
            onClick={collectData}
            disabled={collecting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg transition-colors"
          >
            {collecting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {collecting ? 'Coletando...' : 'Coletar Agora'}
          </button>
        </div>
      </div>

      {/* Informações do Sistema */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Informações do Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Pares coletados:</span>
            <span className="ml-2 text-white">BTCUSDT, XRPUSDT, SOLUSDT</span>
          </div>
          <div>
            <span className="text-gray-400">Timeframes:</span>
            <span className="ml-2 text-white">1m, 5m, 15m</span>
          </div>
          <div>
            <span className="text-gray-400">Fuso horário:</span>
            <span className="ml-2 text-white">São Paulo (UTC-3)</span>
          </div>
          <div>
            <span className="text-gray-400">Frequência:</span>
            <span className="ml-2 text-white">1 minuto (via Uptime Robot)</span>
          </div>
        </div>
      </div>

      {/* Instruções */}
      <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <h4 className="text-blue-400 font-semibold mb-2">📋 Instruções para Coleta Automática:</h4>
        <ol className="text-sm text-gray-300 space-y-1">
          <li>1. Acesse <a href="https://uptimerobot.com" target="_blank" className="text-blue-400 hover:underline">uptimerobot.com</a></li>
          <li>2. Crie uma conta gratuita</li>
          <li>3. Adicione um monitor HTTP(S) com a URL: <code className="bg-gray-800 px-2 py-1 rounded">https://seu-dominio.vercel.app/api/collect</code></li>
          <li>4. Configure o intervalo para 1 minuto</li>
          <li>5. O sistema começará a coletar dados automaticamente!</li>
        </ol>
      </div>
    </div>
  )
}