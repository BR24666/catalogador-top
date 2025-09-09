import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Configuração da Binance API
const BINANCE_BASE_URL = 'https://api.binance.com/api/v3'

interface CandleData {
  openTime: number
  open: string
  high: string
  low: string
  close: string
  volume: string
  closeTime: number
  quoteAssetVolume: string
  numberOfTrades: number
  takerBuyBaseAssetVolume: string
  takerBuyQuoteAssetVolume: string
  ignore: string
}

interface ProcessedCandle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  color: 'GREEN' | 'RED'
  nextColor?: 'GREEN' | 'RED'
}

export class SolDataCollector {
  private supabase = supabase
  private binanceBaseUrl = BINANCE_BASE_URL

  // Função para buscar dados históricos do SOL
  async fetchHistoricalData(months: number = 6): Promise<ProcessedCandle[]> {
    try {
      console.log(`📊 Coletando dados históricos do SOL (${months} meses)...`)
      
      const endTime = Date.now()
      const startTime = endTime - (months * 30 * 24 * 60 * 60 * 1000)
      
      let allCandles: ProcessedCandle[] = []
      let currentStartTime = startTime
      let batchCount = 0
      
      while (currentStartTime < endTime) {
        batchCount++
        console.log(`📦 Processando lote ${batchCount}...`)
        
        const response = await fetch(
          `${this.binanceBaseUrl}/klines?symbol=SOLUSDT&interval=1m&startTime=${currentStartTime}&endTime=${endTime}&limit=1000`
        )
        
        if (!response.ok) {
          throw new Error(`Erro na API da Binance: ${response.status}`)
        }
        
        const data: CandleData[] = await response.json()
        
        if (data.length === 0) {
          break
        }
        
        const processedCandles = data.map((candle, index) => {
          // A API da Binance retorna arrays, não objetos
          // Estrutura: [openTime, open, high, low, close, volume, closeTime, ...]
          const openTime = candle[0]
          const open = parseFloat(candle[1])
          const high = parseFloat(candle[2])
          const low = parseFloat(candle[3])
          const close = parseFloat(candle[4])
          const volume = parseFloat(candle[5])
          const closeTime = candle[6]
          
          // Validar dados numéricos
          if (isNaN(open) || isNaN(close) || isNaN(high) || isNaN(low) || isNaN(volume)) {
            console.warn(`Dados inválidos encontrados:`, candle)
            return null
          }
          
          const color = close > open ? 'GREEN' : 'RED'
          
          // Usar openTime como timestamp - garantir que seja número
          const timestamp = typeof openTime === 'string' ? parseInt(openTime) : openTime
          
          // Validar timestamp
          if (!timestamp || timestamp <= 0 || isNaN(timestamp)) {
            console.warn(`Timestamp inválido encontrado: ${openTime}`)
            return null
          }
          
          return {
            timestamp: timestamp,
            open,
            high,
            low,
            close,
            volume,
            color,
            nextColor: index < data.length - 1 ? 
              (parseFloat(data[index + 1][4]) > parseFloat(data[index + 1][1]) ? 'GREEN' : 'RED') 
              : undefined
          }
        }).filter(candle => candle !== null)
        
        allCandles = allCandles.concat(processedCandles)
        
        // Atualizar tempo de início para o próximo lote
        if (data.length > 0) {
          currentStartTime = data[data.length - 1][6] + 1 // closeTime é o índice 6
        }
        
        // Pausa para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      console.log(`✅ Coletados ${allCandles.length} velas do SOL`)
      
      // Verificar se temos dados suficientes
      if (allCandles.length === 0) {
        throw new Error('Nenhum dado válido coletado da API da Binance')
      }
      
      return allCandles
      
    } catch (error) {
      console.error('Erro ao buscar dados históricos do SOL:', error)
      throw error
    }
  }

  // Função para salvar dados no Supabase
  async saveCandlesToSupabase(candles: ProcessedCandle[]): Promise<void> {
    try {
      console.log('💾 Salvando dados no Supabase...')
      
      const candlesToInsert = candles.map(candle => {
        // Validar timestamp antes de converter
        const timestamp = candle.timestamp
        let validTimestamp: string
        
        if (typeof timestamp === 'number' && timestamp > 0) {
          validTimestamp = new Date(timestamp).toISOString()
        } else if (typeof timestamp === 'string' && !isNaN(parseInt(timestamp))) {
          validTimestamp = new Date(parseInt(timestamp)).toISOString()
        } else {
          console.warn(`Timestamp inválido ignorado: ${timestamp}`)
          return null
        }
        
        return {
          timestamp: validTimestamp,
          open: candle.open || 0,
          high: candle.high || 0,
          low: candle.low || 0,
          close: candle.close || 0,
          volume: candle.volume || 0,
          color: candle.color || 'RED',
          next_color: candle.nextColor || 'RED'
        }
      }).filter(candle => {
        if (!candle) return false
        
        // Garantir que todos os campos obrigatórios tenham valores válidos
        return candle.open > 0 && 
               candle.high > 0 && 
               candle.low > 0 && 
               candle.close > 0 &&
               candle.volume >= 0
      }).filter(candle => {
        // Filtrar timestamps inválidos e dados inválidos
        const date = new Date(candle.timestamp)
        return !isNaN(date.getTime()) && 
               date.getTime() > 0 && 
               candle.open > 0 && 
               candle.high > 0 && 
               candle.low > 0 && 
               candle.close > 0
      })
      
      // Inserir em lotes de 1000 para evitar timeout
      const batchSize = 1000
      for (let i = 0; i < candlesToInsert.length; i += batchSize) {
        const batch = candlesToInsert.slice(i, i + batchSize)
        
        const { error } = await this.supabase
          .from('sol_candles')
          .upsert(batch, { onConflict: 'timestamp' })
        
        if (error) {
          console.error(`Erro ao salvar lote ${Math.floor(i / batchSize) + 1}:`, error)
          throw error
        }
        
        console.log(`✅ Lote ${Math.floor(i / batchSize) + 1} salvo (${batch.length} velas)`)
      }
      
      console.log(`✅ Todos os dados salvos no Supabase (${candles.length} velas)`)
      
    } catch (error) {
      console.error('Erro ao salvar dados no Supabase:', error)
      throw error
    }
  }

  // Função para buscar dados atuais do SOL
  async fetchCurrentData(limit: number = 100): Promise<ProcessedCandle[]> {
    try {
      console.log(`📊 Coletando dados atuais do SOL (${limit} velas)...`)
      
      const response = await fetch(
        `${this.binanceBaseUrl}/klines?symbol=SOLUSDT&interval=1m&limit=${limit}`
      )
      
      if (!response.ok) {
        throw new Error(`Erro na API da Binance: ${response.status}`)
      }
      
      const data: CandleData[] = await response.json()
      
      const processedCandles = data.map((candle, index) => {
        // A API da Binance retorna arrays, não objetos
        const openTime = candle[0]
        const open = parseFloat(candle[1])
        const high = parseFloat(candle[2])
        const low = parseFloat(candle[3])
        const close = parseFloat(candle[4])
        const volume = parseFloat(candle[5])
        
        const color = close > open ? 'GREEN' : 'RED'
        
        return {
          timestamp: typeof openTime === 'string' ? parseInt(openTime) : openTime,
          open,
          high,
          low,
          close,
          volume,
          color,
          nextColor: index < data.length - 1 ? 
            (parseFloat(data[index + 1][4]) > parseFloat(data[index + 1][1]) ? 'GREEN' : 'RED') 
            : undefined
        }
      })
      
      console.log(`✅ Coletados ${processedCandles.length} velas atuais`)
      return processedCandles
      
    } catch (error) {
      console.error('Erro ao buscar dados atuais do SOL:', error)
      throw error
    }
  }

  // Função para coletar e salvar dados históricos completos
  async collectAndSaveHistoricalData(months: number = 6): Promise<ProcessedCandle[]> {
    try {
      console.log('🚀 Iniciando coleta completa de dados históricos do SOL...')
      
      // 1. Coletar dados históricos
      const historicalData = await this.fetchHistoricalData(months)
      
      // 2. Salvar no Supabase
      await this.saveCandlesToSupabase(historicalData)
      
      // 3. Atualizar estatísticas
      await this.updateLearningStats(historicalData.length)
      
      console.log('✅ Coleta de dados históricos concluída com sucesso!')
      
      return historicalData
      
    } catch (error) {
      console.error('Erro na coleta de dados históricos:', error)
      throw error
    }
  }

  // Função para atualizar estatísticas de aprendizado
  async updateLearningStats(dataPoints: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('sol_learning_stats')
        .update({
          sol_data_points: dataPoints,
          last_update: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', 1)
      
      if (error) {
        console.error('Erro ao atualizar estatísticas:', error)
        throw error
      }
      
      console.log(`✅ Estatísticas atualizadas: ${dataPoints} pontos de dados`)
      
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error)
      throw error
    }
  }

  // Função para verificar dados existentes
  async checkExistingData(): Promise<{ count: number; lastUpdate: string }> {
    try {
      const { data, error } = await this.supabase
        .from('sol_candles')
        .select('timestamp')
        .order('timestamp', { ascending: false })
        .limit(1)
      
      if (error) {
        console.error('Erro ao verificar dados existentes:', error)
        return { count: 0, lastUpdate: '' }
      }
      
      const { count } = await this.supabase
        .from('sol_candles')
        .select('*', { count: 'exact', head: true })
      
      return {
        count: count || 0,
        lastUpdate: data?.[0]?.timestamp || ''
      }
      
    } catch (error) {
      console.error('Erro ao verificar dados existentes:', error)
      return { count: 0, lastUpdate: '' }
    }
  }
}

// Instância singleton
export const solDataCollector = new SolDataCollector()
