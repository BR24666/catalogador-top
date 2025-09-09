// Analisador de Estratégias Probabilísticas
// Funciona independente do projeto principal

export interface CandleData {
  id?: string
  pair: string
  timeframe: string
  timestamp: string
  open_price: number
  close_price: number
  color: 'GREEN' | 'RED'
  hour: number
  minute: number
  day: number
  month: number
  year: number
  full_date: string
  time_key: string
  date_key: string
}

export interface CycleData {
  startTime: string
  endTime: string
  duration: number
  consecutiveWins: number
  day: string
  hour: number
  month: string
  year: number
}

export interface WavePrediction {
  strategyId: string
  strategyName: string
  nextWaveProbability: number
  expectedMinWins: number
  confidenceLevel: 'BAIXA' | 'MÉDIA' | 'ALTA' | 'MUITO_ALTA'
  bestEntryTime: string
  bestDay: string
  bestHour: number
  riskLevel: 'BAIXO' | 'MÉDIO' | 'ALTO'
  capitalMultiplier: number
  recommendedBetSize: number
  timeToNextWave: string
  patternMatch: number
  historicalAccuracy: number
}

export interface WaveAnalysis {
  currentStatus: 'AGUARDANDO' | 'PREPARANDO' | 'ONDA_ATIVA' | 'FINALIZANDO'
  activeWaves: WavePrediction[]
  upcomingWaves: WavePrediction[]
  bestOpportunity: WavePrediction | null
  totalExpectedReturn: number
  riskAssessment: string
}

export interface StrategyResult {
  strategy: string
  description: string
  signal: string
  entry1: string
  entry2: string
  entry3: string
  totalTrades: number
  wins: number
  losses: number
  winRate: number
  consecutiveWins: number
  maxConsecutiveWins: number
  minConsecutiveWins: number
  bestDay: string
  bestHour: number
  worstDay: string
  worstHour: number
  entry1Stats: { wins: number; losses: number; winRate: number }
  entry2Stats: { wins: number; losses: number; winRate: number }
  entry3Stats: { wins: number; losses: number; winRate: number }
  currentStreak: number
  isIn100Percent: boolean
  timeIn100Percent: number
  // Novos campos para análise de ciclos
  cycles: CycleData[]
  totalCycles: number
  minCycleWins: number
  maxCycleWins: number
  avgCycleWins: number
  cyclesByDay: { [day: string]: CycleData[] }
  cyclesByMonth: { [month: string]: CycleData[] }
  currentCycleStart?: string
  currentCycleWins: number
  guaranteedMinWins: number // Mínimo garantido baseado em todos os ciclos
}

export class StrategyAnalyzer {
  private candles: CandleData[] = []
  private strategies: Map<string, StrategyResult> = new Map()

  constructor(candles: CandleData[]) {
    this.candles = candles.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    this.analyzeAllStrategies()
  }

  private analyzeAllStrategies() {
    // 1. Estratégia MHI (Maioria, H, Invertida)
    this.analyzeMHI()
    
    // 2. Estratégia da Minoria
    this.analyzeMinority()
    
    // 3. Três Soldados Brancos / Três Corvos Negros
    this.analyzeThreeSoldiers()
    
    // 4. Estratégia de Alternância de Cores (2x2)
    this.analyzeAlternation()
    
    // 5. Estratégia da Vela de Força
    this.analyzeForceCandle()
    
    // 6. Estratégia do Engolfo
    this.analyzeEngulfing()
    
    // 7. Estratégia da Primeira Vela do Quadrante
    this.analyzeQuadrantFirst()
    
    // 8. Padrão de Reversão Pós-Doji
    this.analyzeDojiReversal()
    
    // 9. Estratégia de Sequência Ímpar
    this.analyzeOddSequence()
    
    // 10. Estratégia Três Vales / Três Picos
    this.analyzeThreeValleys()
  }

  private analyzeMHI() {
    const results = this.analyzeStrategy('MHI', 'Maioria das 3 últimas velas', (candles, index) => {
      if (index < 3) return null
      
      const last3 = candles.slice(index - 3, index)
      const greens = last3.filter(c => c.color === 'GREEN').length
      const reds = last3.filter(c => c.color === 'RED').length
      
      if (greens > reds) return 'GREEN'
      if (reds > greens) return 'RED'
      return null
    })
    
    this.strategies.set('MHI', {
      strategy: 'MHI',
      description: 'Maioria das 3 últimas velas',
      signal: 'Após 3 velas, apostar na cor majoritária',
      entry1: '4ª vela',
      entry2: '5ª vela',
      entry3: '6ª vela',
      ...results
    })
  }

  private analyzeMinority() {
    const results = this.analyzeStrategy('Minority', 'Minoria das 3 últimas velas', (candles, index) => {
      if (index < 3) return null
      
      const last3 = candles.slice(index - 3, index)
      const greens = last3.filter(c => c.color === 'GREEN').length
      const reds = last3.filter(c => c.color === 'RED').length
      
      if (greens > reds) return 'RED' // Aposta na minoria
      if (reds > greens) return 'GREEN' // Aposta na minoria
      return null
    })
    
    this.strategies.set('Minority', {
      strategy: 'Minority',
      description: 'Minoria das 3 últimas velas',
      signal: 'Após 3 velas, apostar na cor minoritária',
      entry1: '4ª vela',
      entry2: '5ª vela',
      entry3: '6ª vela',
      ...results
    })
  }

  private analyzeThreeSoldiers() {
    const results = this.analyzeStrategy('ThreeSoldiers', 'Três velas consecutivas da mesma cor', (candles, index) => {
      if (index < 3) return null
      
      const last3 = candles.slice(index - 3, index)
      const allGreen = last3.every(c => c.color === 'GREEN')
      const allRed = last3.every(c => c.color === 'RED')
      
      if (allGreen) return 'GREEN'
      if (allRed) return 'RED'
      return null
    })
    
    this.strategies.set('ThreeSoldiers', {
      strategy: 'ThreeSoldiers',
      description: 'Três velas consecutivas da mesma cor',
      signal: 'Após 3 velas iguais, apostar na continuação',
      entry1: '4ª vela',
      entry2: '5ª vela',
      entry3: '6ª vela',
      ...results
    })
  }

  private analyzeAlternation() {
    const results = this.analyzeStrategy('Alternation', 'Padrão 2x2 de alternância', (candles, index) => {
      if (index < 4) return null
      
      const last4 = candles.slice(index - 4, index)
      const pattern1 = last4[0].color === last4[1].color && last4[1].color !== last4[2].color && last4[2].color === last4[3].color
      
      if (pattern1) return last4[0].color // Continua a alternância
      return null
    })
    
    this.strategies.set('Alternation', {
      strategy: 'Alternation',
      description: 'Padrão 2x2 de alternância',
      signal: 'Após padrão 2x2, apostar na continuação',
      entry1: '5ª vela',
      entry2: '6ª vela',
      entry3: '7ª vela',
      ...results
    })
  }

  private analyzeForceCandle() {
    const results = this.analyzeStrategy('ForceCandle', 'Vela de força após sequência', (candles, index) => {
      if (index < 4) return null
      
      const last4 = candles.slice(index - 4, index)
      const first3Same = last4[0].color === last4[1].color && last4[1].color === last4[2].color
      const lastDifferent = last4[3].color !== last4[0].color
      
      if (first3Same && lastDifferent) {
        // Verificar se a última vela tem corpo significativo
        const bodySize = Math.abs(last4[3].close_price - last4[3].open_price)
        const avgBodySize = last4.slice(0, 3).reduce((sum, c) => sum + Math.abs(c.close_price - c.open_price), 0) / 3
        
        if (bodySize > avgBodySize * 1.2) {
          return last4[3].color
        }
      }
      return null
    })
    
    this.strategies.set('ForceCandle', {
      strategy: 'ForceCandle',
      description: 'Vela de força após sequência',
      signal: 'Vela oposta com corpo maior após 3 iguais',
      entry1: '5ª vela',
      entry2: '6ª vela',
      entry3: '7ª vela',
      ...results
    })
  }

  private analyzeEngulfing() {
    const results = this.analyzeStrategy('Engulfing', 'Padrão de engolfo', (candles, index) => {
      if (index < 2) return null
      
      const last2 = candles.slice(index - 2, index)
      const [first, second] = last2
      
      if (first.color !== second.color) {
        const firstBody = Math.abs(first.close_price - first.open_price)
        const secondBody = Math.abs(second.close_price - second.open_price)
        
        if (secondBody > firstBody * 1.1) {
          return second.color
        }
      }
      return null
    })
    
    this.strategies.set('Engulfing', {
      strategy: 'Engulfing',
      description: 'Padrão de engolfo',
      signal: 'Vela que engolfa a anterior',
      entry1: '3ª vela',
      entry2: '4ª vela',
      entry3: '5ª vela',
      ...results
    })
  }

  private analyzeQuadrantFirst() {
    const results = this.analyzeStrategy('QuadrantFirst', 'Primeira vela do quadrante M5', (candles, index) => {
      if (index < 1) return null
      
      const current = candles[index]
      const minute = current.minute
      
      // Verificar se é a primeira vela do quadrante (0, 5, 10, 15, etc.)
      if (minute % 5 === 0) {
        return current.color
      }
      return null
    })
    
    this.strategies.set('QuadrantFirst', {
      strategy: 'QuadrantFirst',
      description: 'Primeira vela do quadrante M5',
      signal: 'Primeira vela de cada 5 minutos',
      entry1: '2ª vela do quadrante',
      entry2: '3ª vela do quadrante',
      entry3: '4ª vela do quadrante',
      ...results
    })
  }

  private analyzeDojiReversal() {
    const results = this.analyzeStrategy('DojiReversal', 'Reversão pós-Doji', (candles, index) => {
      if (index < 2) return null
      
      const last2 = candles.slice(index - 2, index)
      const [doji, confirmation] = last2
      
      // Verificar se é Doji (corpo pequeno)
      const dojiBody = Math.abs(doji.close_price - doji.open_price)
      const avgBody = this.candles.slice(Math.max(0, index - 10), index).reduce((sum, c) => sum + Math.abs(c.close_price - c.open_price), 0) / 10
      
      if (dojiBody < avgBody * 0.1) {
        return confirmation.color
      }
      return null
    })
    
    this.strategies.set('DojiReversal', {
      strategy: 'DojiReversal',
      description: 'Reversão pós-Doji',
      signal: 'Após Doji, seguir cor da confirmação',
      entry1: '3ª vela',
      entry2: '4ª vela',
      entry3: '5ª vela',
      ...results
    })
  }

  private analyzeOddSequence() {
    const results = this.analyzeStrategy('OddSequence', 'Sequência ímpar', (candles, index) => {
      if (index < 2) return null
      
      let count = 1
      let currentColor = candles[index - 1].color
      
      // Contar velas consecutivas da mesma cor
      for (let i = index - 2; i >= 0; i--) {
        if (candles[i].color === currentColor) {
          count++
        } else {
          break
        }
      }
      
      // Se é ímpar (3, 5, 7, etc.), apostar na cor oposta
      if (count % 2 === 1 && count >= 3) {
        return currentColor === 'GREEN' ? 'RED' : 'GREEN'
      }
      return null
    })
    
    this.strategies.set('OddSequence', {
      strategy: 'OddSequence',
      description: 'Sequência ímpar',
      signal: 'Após sequência ímpar, apostar na cor oposta',
      entry1: 'Próxima vela',
      entry2: '2ª vela',
      entry3: '3ª vela',
      ...results
    })
  }

  private analyzeThreeValleys() {
    const results = this.analyzeStrategy('ThreeValleys', 'Três vales/picos', (candles, index) => {
      if (index < 3) return null
      
      const last3 = candles.slice(index - 3, index)
      const [first, second, third] = last3
      
      // Padrão de três vales (Vermelho, Vermelho com pavio, Verde)
      if (first.color === 'RED' && second.color === 'RED' && third.color === 'GREEN') {
        return 'GREEN'
      }
      
      // Padrão de três picos (Verde, Verde com pavio, Vermelho)
      if (first.color === 'GREEN' && second.color === 'GREEN' && third.color === 'RED') {
        return 'RED'
      }
      
      return null
    })
    
    this.strategies.set('ThreeValleys', {
      strategy: 'ThreeValleys',
      description: 'Três vales/picos',
      signal: 'Padrão de reversão em V ou A',
      entry1: '4ª vela',
      entry2: '5ª vela',
      entry3: '6ª vela',
      ...results
    })
  }

  private analyzeStrategy(name: string, description: string, signalFn: (candles: CandleData[], index: number) => string | null) {
    const trades: Array<{ predicted: string; actual: string; timestamp: string; hour: number; day: number }> = []
    let consecutiveWins = 0
    let maxConsecutiveWins = 0
    let minConsecutiveWins = Infinity
    let currentStreak = 0
    let timeIn100Percent = 0
    let isIn100Percent = false
    
    // Variáveis para análise de ciclos
    const cycles: CycleData[] = []
    let currentCycleStart: string | null = null
    let currentCycleWins = 0
    let minCycleWins = Infinity
    let maxCycleWins = 0
    let totalCycleWins = 0
    const cyclesByDay: { [day: string]: CycleData[] } = {}
    const cyclesByMonth: { [month: string]: CycleData[] } = {}
    
    for (let i = 0; i < this.candles.length; i++) {
      const predicted = signalFn(this.candles, i)
      if (predicted && i + 1 < this.candles.length) {
        const actual = this.candles[i + 1].color
        const isWin = predicted === actual
        const currentTime = this.candles[i].timestamp
        const currentDate = new Date(currentTime)
        const dayName = currentDate.toLocaleDateString('pt-BR', { weekday: 'long' })
        const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long' })
        
        trades.push({
          predicted,
          actual,
          timestamp: currentTime,
          hour: this.candles[i].hour,
          day: currentDate.getDay()
        })
        
        if (isWin) {
          consecutiveWins++
          currentStreak++
          currentCycleWins++
          
          // Iniciar ciclo de 100% se não estiver ativo
          if (!isIn100Percent && consecutiveWins >= 3) {
            isIn100Percent = true
            currentCycleStart = currentTime
            currentCycleWins = consecutiveWins
            timeIn100Percent = 1
          } else if (isIn100Percent) {
            timeIn100Percent++
            currentCycleWins = consecutiveWins
          }
        } else {
          // Finalizar ciclo de 100% se estava ativo
          if (isIn100Percent && currentCycleStart) {
            const cycleData: CycleData = {
              startTime: currentCycleStart,
              endTime: currentTime,
              duration: timeIn100Percent,
              consecutiveWins: currentCycleWins,
              day: dayName,
              hour: this.candles[i].hour,
              month: monthName,
              year: currentDate.getFullYear()
            }
            
            cycles.push(cycleData)
            
            // Organizar por dia e mês
            if (!cyclesByDay[dayName]) cyclesByDay[dayName] = []
            cyclesByDay[dayName].push(cycleData)
            
            if (!cyclesByMonth[monthName]) cyclesByMonth[monthName] = []
            cyclesByMonth[monthName].push(cycleData)
            
            // Atualizar estatísticas de ciclos
            minCycleWins = Math.min(minCycleWins, currentCycleWins)
            maxCycleWins = Math.max(maxCycleWins, currentCycleWins)
            totalCycleWins += currentCycleWins
          }
          
          // Resetar contadores
          if (consecutiveWins > 0) {
            maxConsecutiveWins = Math.max(maxConsecutiveWins, consecutiveWins)
            minConsecutiveWins = Math.min(minConsecutiveWins, consecutiveWins)
          }
          consecutiveWins = 0
          currentStreak = 0
          isIn100Percent = false
          timeIn100Percent = 0
          currentCycleStart = null
          currentCycleWins = 0
        }
      }
    }
    
    // Se ainda está em ciclo de 100%, finalizar com dados atuais
    if (isIn100Percent && currentCycleStart) {
      const lastCandle = this.candles[this.candles.length - 1]
      const currentDate = new Date(lastCandle.timestamp)
      const dayName = currentDate.toLocaleDateString('pt-BR', { weekday: 'long' })
      const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long' })
      
      const cycleData: CycleData = {
        startTime: currentCycleStart,
        endTime: lastCandle.timestamp,
        duration: timeIn100Percent,
        consecutiveWins: currentCycleWins,
        day: dayName,
        hour: lastCandle.hour,
        month: monthName,
        year: currentDate.getFullYear()
      }
      
      cycles.push(cycleData)
      
      if (!cyclesByDay[dayName]) cyclesByDay[dayName] = []
      cyclesByDay[dayName].push(cycleData)
      
      if (!cyclesByMonth[monthName]) cyclesByMonth[monthName] = []
      cyclesByMonth[monthName].push(cycleData)
      
      minCycleWins = Math.min(minCycleWins, currentCycleWins)
      maxCycleWins = Math.max(maxCycleWins, currentCycleWins)
      totalCycleWins += currentCycleWins
    }
    
    const wins = trades.filter(t => t.predicted === t.actual).length
    const losses = trades.length - wins
    const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0
    
    // Análise por entrada
    const entry1Trades = trades.slice(0, Math.ceil(trades.length / 3))
    const entry2Trades = trades.slice(Math.ceil(trades.length / 3), Math.ceil(trades.length * 2 / 3))
    const entry3Trades = trades.slice(Math.ceil(trades.length * 2 / 3))
    
    const entry1Wins = entry1Trades.filter(t => t.predicted === t.actual).length
    const entry2Wins = entry2Trades.filter(t => t.predicted === t.actual).length
    const entry3Wins = entry3Trades.filter(t => t.predicted === t.actual).length
    
    // Melhor e pior dia/hora
    const dayStats = this.getDayHourStats(trades)
    
    return {
      totalTrades: trades.length,
      wins,
      losses,
      winRate,
      consecutiveWins,
      maxConsecutiveWins: maxConsecutiveWins === Infinity ? 0 : maxConsecutiveWins,
      minConsecutiveWins: minConsecutiveWins === Infinity ? 0 : minConsecutiveWins,
      bestDay: dayStats.bestDay,
      bestHour: dayStats.bestHour,
      worstDay: dayStats.worstDay,
      worstHour: dayStats.worstHour,
      entry1Stats: {
        wins: entry1Wins,
        losses: entry1Trades.length - entry1Wins,
        winRate: entry1Trades.length > 0 ? (entry1Wins / entry1Trades.length) * 100 : 0
      },
      entry2Stats: {
        wins: entry2Wins,
        losses: entry2Trades.length - entry2Wins,
        winRate: entry2Trades.length > 0 ? (entry2Wins / entry2Trades.length) * 100 : 0
      },
      entry3Stats: {
        wins: entry3Wins,
        losses: entry3Trades.length - entry3Wins,
        winRate: entry3Trades.length > 0 ? (entry3Wins / entry3Trades.length) * 100 : 0
      },
      currentStreak,
      isIn100Percent,
      timeIn100Percent,
      // Dados de ciclos de 100%
      cycles,
      totalCycles: cycles.length,
      minCycleWins: minCycleWins === Infinity ? 0 : minCycleWins,
      maxCycleWins,
      avgCycleWins: cycles.length > 0 ? Math.round(totalCycleWins / cycles.length) : 0,
      cyclesByDay,
      cyclesByMonth,
      currentCycleStart: currentCycleStart || undefined,
      currentCycleWins: isIn100Percent ? currentCycleWins : 0,
      guaranteedMinWins: minCycleWins === Infinity ? 0 : minCycleWins
    }
  }

  private getDayHourStats(trades: Array<{ predicted: string; actual: string; hour: number; day: number }>) {
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    const dayStats = new Map<number, { wins: number; total: number }>()
    const hourStats = new Map<number, { wins: number; total: number }>()
    
    trades.forEach(trade => {
      const isWin = trade.predicted === trade.actual
      
      // Estatísticas por dia
      if (!dayStats.has(trade.day)) {
        dayStats.set(trade.day, { wins: 0, total: 0 })
      }
      const dayStat = dayStats.get(trade.day)!
      dayStat.total++
      if (isWin) dayStat.wins++
      
      // Estatísticas por hora
      if (!hourStats.has(trade.hour)) {
        hourStats.set(trade.hour, { wins: 0, total: 0 })
      }
      const hourStat = hourStats.get(trade.hour)!
      hourStat.total++
      if (isWin) hourStat.wins++
    })
    
    // Encontrar melhor e pior dia
    let bestDay = 'N/A'
    let bestHour = 0
    let worstDay = 'N/A'
    let worstHour = 0
    let bestWinRate = 0
    let worstWinRate = 100
    
    dayStats.forEach((stats, day) => {
      const winRate = (stats.wins / stats.total) * 100
      if (winRate > bestWinRate) {
        bestWinRate = winRate
        bestDay = dayNames[day]
      }
      if (winRate < worstWinRate) {
        worstWinRate = winRate
        worstDay = dayNames[day]
      }
    })
    
    hourStats.forEach((stats, hour) => {
      const winRate = (stats.wins / stats.total) * 100
      if (winRate > bestWinRate) {
        bestWinRate = winRate
        bestHour = hour
      }
      if (winRate < worstWinRate) {
        worstWinRate = winRate
        worstHour = hour
      }
    })
    
    return { bestDay, bestHour, worstDay, worstHour }
  }

  public getStrategyResults(): StrategyResult[] {
    return Array.from(this.strategies.values())
  }

  public getBestStrategy(): StrategyResult | null {
    const results = this.getStrategyResults()
    if (results.length === 0) return null
    
    return results.reduce((best, current) => {
      if (current.winRate > best.winRate) return current
      if (current.winRate === best.winRate && current.maxConsecutiveWins > best.maxConsecutiveWins) return current
      return best
    })
  }

  public getStrategiesIn100Percent(): StrategyResult[] {
    return this.getStrategyResults().filter(s => s.isIn100Percent)
  }

  // Análise de ondas para previsão de sequências
  analyzeWaves(): WaveAnalysis {
    const currentTime = new Date()
    const currentHour = currentTime.getHours()
    const currentDay = currentTime.toLocaleDateString('pt-BR', { weekday: 'long' })
    
    const activeWaves: WavePrediction[] = []
    const upcomingWaves: WavePrediction[] = []
    
    // Analisar cada estratégia para prever próximas ondas
    this.strategies.forEach((strategy, strategyId) => {
      const prediction = this.predictNextWave(strategy, strategyId)
      
      if (prediction.nextWaveProbability >= 70) {
        if (strategy.isIn100Percent) {
          activeWaves.push(prediction)
        } else {
          upcomingWaves.push(prediction)
        }
      }
    })
    
    // Ordenar por probabilidade e retorno esperado
    upcomingWaves.sort((a, b) => {
      const scoreA = a.nextWaveProbability * a.capitalMultiplier
      const scoreB = b.nextWaveProbability * b.capitalMultiplier
      return scoreB - scoreA
    })
    
    const bestOpportunity = upcomingWaves.length > 0 ? upcomingWaves[0] : null
    const totalExpectedReturn = upcomingWaves.reduce((sum, wave) => sum + wave.capitalMultiplier, 0)
    
    // Determinar status atual
    let currentStatus: 'AGUARDANDO' | 'PREPARANDO' | 'ONDA_ATIVA' | 'FINALIZANDO' = 'AGUARDANDO'
    if (activeWaves.length > 0) {
      currentStatus = 'ONDA_ATIVA'
    } else if (upcomingWaves.length > 0 && bestOpportunity && bestOpportunity.nextWaveProbability >= 80) {
      currentStatus = 'PREPARANDO'
    }
    
    // Avaliação de risco
    const riskLevel = this.calculateRiskLevel(upcomingWaves)
    const riskAssessment = this.generateRiskAssessment(riskLevel, upcomingWaves.length)
    
    return {
      currentStatus,
      activeWaves,
      upcomingWaves,
      bestOpportunity,
      totalExpectedReturn,
      riskAssessment
    }
  }

  private predictNextWave(strategy: StrategyResult, strategyId: string): WavePrediction {
    const currentTime = new Date()
    const currentHour = currentTime.getHours()
    const currentDay = currentTime.toLocaleDateString('pt-BR', { weekday: 'long' })
    
    // Analisar padrões históricos por dia/hora
    const dayPatterns = this.analyzeDayPatterns(strategy.cyclesByDay)
    const hourPatterns = this.analyzeHourPatterns(strategy.cycles)
    
    // Calcular probabilidade baseada em padrões
    const dayProbability = dayPatterns[currentDay] || 0
    const hourProbability = hourPatterns[currentHour] || 0
    const timePatternProbability = this.analyzeTimePatterns(strategy.cycles, currentTime)
    
    // Probabilidade combinada
    const nextWaveProbability = Math.min(95, Math.round(
      (dayProbability * 0.4) + 
      (hourProbability * 0.4) + 
      (timePatternProbability * 0.2)
    ))
    
    // Calcular confiança
    let confidenceLevel: 'BAIXA' | 'MÉDIA' | 'ALTA' | 'MUITO_ALTA' = 'BAIXA'
    if (nextWaveProbability >= 90) confidenceLevel = 'MUITO_ALTA'
    else if (nextWaveProbability >= 80) confidenceLevel = 'ALTA'
    else if (nextWaveProbability >= 70) confidenceLevel = 'MÉDIA'
    
    // Calcular retorno esperado
    const expectedMinWins = strategy.guaranteedMinWins
    const capitalMultiplier = Math.pow(2, expectedMinWins) // Dobra a cada win
    const recommendedBetSize = Math.min(10, Math.max(1, Math.floor(nextWaveProbability / 10)))
    
    // Determinar nível de risco
    let riskLevel: 'BAIXO' | 'MÉDIO' | 'ALTO' = 'ALTO'
    if (nextWaveProbability >= 85 && expectedMinWins >= 3) riskLevel = 'BAIXO'
    else if (nextWaveProbability >= 75 && expectedMinWins >= 2) riskLevel = 'MÉDIO'
    
    // Encontrar melhor horário baseado em padrões
    const bestTimeSlot = this.findBestTimeSlot(strategy.cycles)
    
    // Calcular tempo até próxima onda
    const timeToNextWave = this.calculateTimeToNextWave(strategy.cycles, currentTime)
    
    // Match de padrão histórico
    const patternMatch = this.calculatePatternMatch(strategy.cycles, currentTime)
    
    return {
      strategyId,
      strategyName: strategy.strategy,
      nextWaveProbability,
      expectedMinWins,
      confidenceLevel,
      bestEntryTime: bestTimeSlot.time,
      bestDay: bestTimeSlot.day,
      bestHour: bestTimeSlot.hour,
      riskLevel,
      capitalMultiplier,
      recommendedBetSize,
      timeToNextWave,
      patternMatch,
      historicalAccuracy: strategy.winRate
    }
  }

  private analyzeDayPatterns(cyclesByDay: { [day: string]: CycleData[] }): { [day: string]: number } {
    const patterns: { [day: string]: number } = {}
    const totalCycles = Object.values(cyclesByDay).flat().length
    
    Object.entries(cyclesByDay).forEach(([day, cycles]) => {
      if (cycles.length > 0) {
        const avgWins = cycles.reduce((sum, cycle) => sum + cycle.consecutiveWins, 0) / cycles.length
        const frequency = (cycles.length / totalCycles) * 100
        patterns[day] = Math.min(95, Math.round(frequency + (avgWins * 5)))
      }
    })
    
    return patterns
  }

  private analyzeHourPatterns(cycles: CycleData[]): { [hour: number]: number } {
    const hourStats: { [hour: number]: { count: number; totalWins: number } } = {}
    
    cycles.forEach(cycle => {
      if (!hourStats[cycle.hour]) {
        hourStats[cycle.hour] = { count: 0, totalWins: 0 }
      }
      hourStats[cycle.hour].count++
      hourStats[cycle.hour].totalWins += cycle.consecutiveWins
    })
    
    const patterns: { [hour: number]: number } = {}
    Object.entries(hourStats).forEach(([hour, stats]) => {
      const avgWins = stats.totalWins / stats.count
      const frequency = (stats.count / cycles.length) * 100
      patterns[parseInt(hour)] = Math.min(95, Math.round(frequency + (avgWins * 3)))
    })
    
    return patterns
  }

  private analyzeTimePatterns(cycles: CycleData[], currentTime: Date): number {
    // Analisar padrões de intervalo entre ciclos
    if (cycles.length < 2) return 50
    
    const intervals: number[] = []
    for (let i = 1; i < cycles.length; i++) {
      const prevEnd = new Date(cycles[i-1].endTime)
      const currStart = new Date(cycles[i].startTime)
      const interval = (currStart.getTime() - prevEnd.getTime()) / (1000 * 60 * 60) // horas
      intervals.push(interval)
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
    const lastCycleEnd = new Date(cycles[cycles.length - 1].endTime)
    const timeSinceLastCycle = (currentTime.getTime() - lastCycleEnd.getTime()) / (1000 * 60 * 60)
    
    // Se já passou o tempo médio, aumentar probabilidade
    if (timeSinceLastCycle >= avgInterval * 0.8) {
      return Math.min(90, 50 + (timeSinceLastCycle / avgInterval) * 30)
    }
    
    return 30
  }

  private findBestTimeSlot(cycles: CycleData[]): { time: string; day: string; hour: number } {
    const hourStats: { [hour: number]: { count: number; avgWins: number } } = {}
    
    cycles.forEach(cycle => {
      if (!hourStats[cycle.hour]) {
        hourStats[cycle.hour] = { count: 0, avgWins: 0 }
      }
      hourStats[cycle.hour].count++
      hourStats[cycle.hour].avgWins += cycle.consecutiveWins
    })
    
    // Calcular média de wins por hora
    Object.keys(hourStats).forEach(hour => {
      const h = parseInt(hour)
      hourStats[h].avgWins = hourStats[h].avgWins / hourStats[h].count
    })
    
    // Encontrar melhor hora
    let bestHour = 0
    let bestScore = 0
    
    Object.entries(hourStats).forEach(([hour, stats]) => {
      const score = stats.count * stats.avgWins
      if (score > bestScore) {
        bestScore = score
        bestHour = parseInt(hour)
      }
    })
    
    // Encontrar melhor dia
    const dayStats: { [day: string]: number } = {}
    cycles.forEach(cycle => {
      dayStats[cycle.day] = (dayStats[cycle.day] || 0) + cycle.consecutiveWins
    })
    
    const bestDay = Object.entries(dayStats).reduce((a, b) => dayStats[a[0]] > dayStats[b[0]] ? a : b)[0]
    
    return {
      time: `${bestHour.toString().padStart(2, '0')}:00`,
      day: bestDay,
      hour: bestHour
    }
  }

  private calculateTimeToNextWave(cycles: CycleData[], currentTime: Date): string {
    if (cycles.length < 2) return 'Dados insuficientes'
    
    const intervals: number[] = []
    for (let i = 1; i < cycles.length; i++) {
      const prevEnd = new Date(cycles[i-1].endTime)
      const currStart = new Date(cycles[i].startTime)
      const interval = (currStart.getTime() - prevEnd.getTime()) / (1000 * 60) // minutos
      intervals.push(interval)
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
    const lastCycleEnd = new Date(cycles[cycles.length - 1].endTime)
    const timeSinceLastCycle = (currentTime.getTime() - lastCycleEnd.getTime()) / (1000 * 60)
    
    const remainingTime = Math.max(0, avgInterval - timeSinceLastCycle)
    
    if (remainingTime < 60) {
      return `${Math.round(remainingTime)} min`
    } else if (remainingTime < 1440) {
      return `${Math.round(remainingTime / 60)}h`
    } else {
      return `${Math.round(remainingTime / 1440)} dias`
    }
  }

  private calculatePatternMatch(cycles: CycleData[], currentTime: Date): number {
    if (cycles.length < 3) return 50
    
    // Analisar padrões de sequência
    const recentCycles = cycles.slice(-5) // Últimos 5 ciclos
    const currentHour = currentTime.getHours()
    const currentDay = currentTime.toLocaleDateString('pt-BR', { weekday: 'long' })
    
    let matchScore = 0
    
    // Verificar se hora atual coincide com padrões históricos
    const hourMatches = recentCycles.filter(cycle => cycle.hour === currentHour).length
    matchScore += (hourMatches / recentCycles.length) * 40
    
    // Verificar se dia atual coincide com padrões históricos
    const dayMatches = recentCycles.filter(cycle => cycle.day === currentDay).length
    matchScore += (dayMatches / recentCycles.length) * 30
    
    // Verificar padrão de duração de ciclos
    const avgDuration = recentCycles.reduce((sum, cycle) => sum + cycle.duration, 0) / recentCycles.length
    const currentStreak = this.calculateCurrentStreak()
    if (currentStreak > 0) {
      const streakProgress = Math.min(1, currentStreak / avgDuration)
      matchScore += streakProgress * 30
    }
    
    return Math.min(100, Math.round(matchScore))
  }

  private calculateCurrentStreak(): number {
    // Implementar cálculo de streak atual baseado nos dados mais recentes
    // Por simplicidade, retornar 0 por enquanto
    return 0
  }

  private calculateRiskLevel(upcomingWaves: WavePrediction[]): 'BAIXO' | 'MÉDIO' | 'ALTO' {
    if (upcomingWaves.length === 0) return 'ALTO'
    
    const highConfidenceWaves = upcomingWaves.filter(wave => wave.confidenceLevel === 'MUITO_ALTA' || wave.confidenceLevel === 'ALTA')
    const lowRiskWaves = upcomingWaves.filter(wave => wave.riskLevel === 'BAIXO')
    
    if (highConfidenceWaves.length >= 2 && lowRiskWaves.length >= 1) return 'BAIXO'
    if (highConfidenceWaves.length >= 1 || lowRiskWaves.length >= 1) return 'MÉDIO'
    return 'ALTO'
  }

  private generateRiskAssessment(riskLevel: 'BAIXO' | 'MÉDIO' | 'ALTO', waveCount: number): string {
    switch (riskLevel) {
      case 'BAIXO':
        return `🟢 RISCO BAIXO - ${waveCount} oportunidades identificadas com alta confiança. Condições ideais para multiplicar capital.`
      case 'MÉDIO':
        return `🟡 RISCO MÉDIO - ${waveCount} oportunidades disponíveis. Monitore padrões antes de apostar.`
      case 'ALTO':
        return `🔴 RISCO ALTO - Poucas oportunidades claras. Aguarde melhores condições.`
      default:
        return 'Aguardando análise...'
    }
  }
}
