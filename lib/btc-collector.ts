import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lgddsslskhzxtpjathjr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws'
const supabase = createClient(supabaseUrl, supabaseKey)

export interface CandleData {
  id?: number
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  direction?: 'bullish' | 'bearish' | 'neutral'
  status: 'finalizada' | 'em formação'
  created_at?: string
}

export class BTCCollector {
  private intervalId: NodeJS.Timeout | null = null
  private currentCandle: CandleData | null = null
  private isCollecting: boolean = false
  private onUpdateCallback: ((candles: CandleData[]) => void) | null = null

  constructor(onUpdate?: (candles: CandleData[]) => void) {
    this.onUpdateCallback = onUpdate || null
  }

  /**
   * Buscar candles históricos da Binance
   */
  async fetchHistoricalCandles(limit: number = 500): Promise<CandleData[]> {
    try {
      console.log(`📊 Buscando últimos ${limit} candles históricos BTC/USDT...`)
      
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=${limit}`
      )
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar candles: ${response.statusText}`)
      }

      const data = await response.json()
      
      const candles: CandleData[] = data.map((kline: any) => ({
        timestamp: new Date(kline[0]).toISOString(),
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
        status: 'finalizada' as const
      }))

      console.log(`✅ ${candles.length} candles históricos carregados`)
      return candles
    } catch (error) {
      console.error('❌ Erro ao buscar candles históricos:', error)
      return []
    }
  }

  /**
   * Buscar candle atual em formação da Binance
   */
  async fetchCurrentCandle(): Promise<CandleData | null> {
    try {
      const response = await fetch(
        'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=1'
      )
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar candle atual: ${response.statusText}`)
      }

      const data = await response.json()
      const kline = data[0]
      
      const candle: CandleData = {
        timestamp: new Date(kline[0]).toISOString(),
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
        status: 'em formação'
      }

      return candle
    } catch (error) {
      console.error('❌ Erro ao buscar candle atual:', error)
      return null
    }
  }

  /**
   * Salvar candles no Supabase
   */
  async saveCandles(candles: CandleData[], silent: boolean = false): Promise<void> {
    try {
      if (!silent) console.log(`💾 Salvando ${candles.length} candles...`)
      
      for (const candle of candles) {
        const { data, error } = await supabase
          .from('candles')
          .upsert({
            timestamp: candle.timestamp,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume,
            status: candle.status
          }, {
            onConflict: 'timestamp'
          })
          .select()

        if (error) {
          console.error('❌ Erro ao salvar candle:', error.message, error.details)
        }
      }
      
      if (!silent) console.log(`✅ ${candles.length} candles salvos`)
    } catch (error) {
      console.error('❌ Erro ao salvar candles:', error)
    }
  }

  /**
   * Buscar candles do Supabase
   */
  async getCandlesFromDB(limit: number = 500): Promise<CandleData[]> {
    try {
      const { data, error } = await supabase
        .from('candles')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ Erro ao buscar candles do DB:', error)
        return []
      }

      return (data || []).reverse()
    } catch (error) {
      console.error('❌ Erro ao buscar candles:', error)
      return []
    }
  }

  /**
   * Iniciar coleta em tempo real
   */
  async startCollection(): Promise<void> {
    if (this.isCollecting) {
      console.log('⚠️ Coleta já está em andamento')
      return
    }

    console.log('🚀 Iniciando coleta de candles BTC/USDT...')
    this.isCollecting = true

    // Carregar histórico inicial (salvando em lotes menores)
    console.log('📦 Carregando histórico inicial...')
    const historical = await this.fetchHistoricalCandles(500)
    if (historical.length > 0) {
      console.log(`💾 Salvando ${historical.length} candles em lotes de 50...`)
      // Salvar em lotes de 50 para evitar timeout
      for (let i = 0; i < historical.length; i += 50) {
        const batch = historical.slice(i, i + 50)
        await this.saveCandles(batch, true) // silent mode
        console.log(`✅ Lote ${Math.floor(i/50) + 1}/${Math.ceil(historical.length/50)} salvo`)
      }
      console.log('✅ Todos os candles históricos foram salvos!')
    }

    // Atualizar candle atual a cada 5 segundos
    console.log('⏰ Iniciando atualização automática a cada 5 segundos...')
    this.intervalId = setInterval(async () => {
      await this.updateCurrentCandle()
    }, 5000)

    // Primeira atualização imediata
    await this.updateCurrentCandle()
  }

  /**
   * Atualizar candle atual
   */
  private async updateCurrentCandle(): Promise<void> {
    try {
      const newCandle = await this.fetchCurrentCandle()
      
      if (!newCandle) {
        console.log('⚠️ Nenhum candle retornado da Binance')
        return
      }

      const time = new Date(newCandle.timestamp).toLocaleTimeString('pt-BR')
      console.log(`📊 ${time} | O:${newCandle.open.toFixed(2)} H:${newCandle.high.toFixed(2)} L:${newCandle.low.toFixed(2)} C:${newCandle.close.toFixed(2)} | ${newCandle.status}`)

      // Se mudou o timestamp, a vela anterior fechou
      if (this.currentCandle && this.currentCandle.timestamp !== newCandle.timestamp) {
        // Marcar vela anterior como finalizada
        this.currentCandle.status = 'finalizada'
        console.log('🔒 Vela fechada! Nova vela iniciada.')
        await this.saveCandles([this.currentCandle], true)
        
        // Atualizar métricas das estratégias
        await this.updateStrategiesMetrics()
      }

      // Atualizar vela atual
      this.currentCandle = newCandle
      
      // Salvar vela em formação (silent)
      await this.saveCandles([newCandle], true)

      // Notificar atualização
      if (this.onUpdateCallback) {
        const allCandles = await this.getCandlesFromDB(100)
        this.onUpdateCallback(allCandles)
      }

    } catch (error) {
      console.error('❌ Erro ao atualizar candle atual:', error)
    }
  }

  /**
   * Atualizar métricas das estratégias
   */
  private async updateStrategiesMetrics(): Promise<void> {
    try {
      // Buscar últimas 100 velas finalizadas
      const { data: candles } = await supabase
        .from('candles')
        .select('*')
        .eq('status', 'finalizada')
        .order('timestamp', { ascending: false })
        .limit(100)

      if (!candles || candles.length < 10) return

      // Buscar todas as estratégias
      const { data: strategies } = await supabase
        .from('strategies')
        .select('*')

      if (!strategies) return

      // Analisar cada estratégia
      for (const strategy of strategies) {
        const metrics = this.analyzeStrategy(strategy.name, candles.reverse())
        
        // Atualizar métricas no banco
        await supabase
          .from('performance_metrics')
          .update({
            accuracy: metrics.accuracy,
            total_signals: metrics.total_signals,
            total_wins: metrics.total_wins,
            total_losses: metrics.total_losses,
            max_win_streak: metrics.max_win_streak,
            avg_win_streak: metrics.avg_win_streak,
            best_hour: metrics.best_hour,
            best_day: metrics.best_day,
            updated_at: new Date().toISOString()
          })
          .eq('strategy_id', strategy.id)
      }

      console.log('📊 Métricas das estratégias atualizadas')
    } catch (error) {
      console.error('❌ Erro ao atualizar métricas:', error)
    }
  }

  /**
   * Analisar estratégia
   */
  private analyzeStrategy(strategyName: string, candles: any[]): any {
    let signals = 0
    let wins = 0
    let losses = 0
    let currentStreak = 0
    let maxStreak = 0
    const streaks: number[] = []
    const hourPerformance: { [key: number]: { wins: number; total: number } } = {}
    const dayPerformance: { [key: string]: { wins: number; total: number } } = {}

    for (let i = 0; i < candles.length - 1; i++) {
      let signal: 'CALL' | 'PUT' | null = null

      // Lógica de cada estratégia
      if (strategyName === 'MHI' && i >= 3) {
        const prev3 = candles.slice(i - 3, i)
        const bullish = prev3.filter((c: any) => c.close > c.open).length
        const bearish = prev3.filter((c: any) => c.close < c.open).length
        
        if (bullish >= 2) signal = 'PUT'
        else if (bearish >= 2) signal = 'CALL'
      }
      else if (strategyName === 'Três Soldados Brancos' && i >= 3) {
        const prev3 = candles.slice(i - 3, i)
        const allBullish = prev3.every((c: any) => c.close > c.open)
        const allBearish = prev3.every((c: any) => c.close < c.open)
        
        if (allBullish) signal = 'CALL'
        else if (allBearish) signal = 'PUT'
      }
      else if (strategyName === 'Minoria' && i >= 4) {
        const prev4 = candles.slice(i - 4, i)
        const bullish = prev4.filter((c: any) => c.close > c.open).length
        const bearish = prev4.filter((c: any) => c.close < c.open).length
        
        if (bullish < bearish) signal = 'CALL'
        else if (bearish < bullish) signal = 'PUT'
      }
      else if (strategyName === 'Vela de Força' && i >= 1) {
        const prev = candles[i - 1]
        const body = Math.abs(prev.close - prev.open)
        const upperWick = prev.high - Math.max(prev.open, prev.close)
        const lowerWick = Math.min(prev.open, prev.close) - prev.low
        
        if (body > (upperWick + lowerWick) * 2) {
          signal = prev.close > prev.open ? 'CALL' : 'PUT'
        }
      }

      if (signal) {
        signals++
        const nextCandle = candles[i + 1]
        const isWin = (signal === 'CALL' && nextCandle.close > nextCandle.open) ||
                      (signal === 'PUT' && nextCandle.close < nextCandle.open)

        if (isWin) {
          wins++
          currentStreak++
          maxStreak = Math.max(maxStreak, currentStreak)
        } else {
          losses++
          if (currentStreak > 0) {
            streaks.push(currentStreak)
          }
          currentStreak = 0
        }

        // Registrar performance por hora e dia
        const date = new Date(candles[i + 1].timestamp)
        const hour = date.getHours()
        const day = date.toLocaleDateString('pt-BR', { weekday: 'long' })

        if (!hourPerformance[hour]) hourPerformance[hour] = { wins: 0, total: 0 }
        if (!dayPerformance[day]) dayPerformance[day] = { wins: 0, total: 0 }

        hourPerformance[hour].total++
        dayPerformance[day].total++

        if (isWin) {
          hourPerformance[hour].wins++
          dayPerformance[day].wins++
        }
      }
    }

    // Calcular melhor hora
    let bestHour = 0
    let bestHourAccuracy = 0
    Object.entries(hourPerformance).forEach(([hour, perf]) => {
      const accuracy = perf.total > 0 ? (perf.wins / perf.total) * 100 : 0
      if (accuracy > bestHourAccuracy) {
        bestHourAccuracy = accuracy
        bestHour = parseInt(hour)
      }
    })

    // Calcular melhor dia
    let bestDay = ''
    let bestDayAccuracy = 0
    Object.entries(dayPerformance).forEach(([day, perf]) => {
      const accuracy = perf.total > 0 ? (perf.wins / perf.total) * 100 : 0
      if (accuracy > bestDayAccuracy) {
        bestDayAccuracy = accuracy
        bestDay = day
      }
    })

    const accuracy = signals > 0 ? (wins / signals) * 100 : 0
    const avgStreak = streaks.length > 0 ? streaks.reduce((a, b) => a + b, 0) / streaks.length : 0

    return {
      accuracy: parseFloat(accuracy.toFixed(2)),
      total_signals: signals,
      total_wins: wins,
      total_losses: losses,
      max_win_streak: maxStreak,
      avg_win_streak: parseFloat(avgStreak.toFixed(2)),
      best_hour: bestHour,
      best_day: bestDay
    }
  }

  /**
   * Parar coleta
   */
  stopCollection(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isCollecting = false
    console.log('⏹️ Coleta de candles parada')
  }

  /**
   * Verificar se está coletando
   */
  isActive(): boolean {
    return this.isCollecting
  }
}

// Instância singleton
export const btcCollector = new BTCCollector()

