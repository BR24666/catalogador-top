interface BinanceKline {
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

export class BinanceAPI {
  private baseUrl = 'https://api.binance.com/api/v3'

  async getKlines(symbol: string, interval: string, limit: number = 1): Promise<BinanceKline[]> {
    try {
      const url = `${this.baseUrl}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Erro ao buscar dados da Binance:', error)
      throw error
    }
  }

  async getLatestCandle(symbol: string, interval: string): Promise<CandleData | null> {
    try {
      const klines = await this.getKlines(symbol, interval, 1)
      
      if (klines.length === 0) {
        return null
      }

      const kline = klines[0]
      const timestamp = new Date(kline.openTime)
      
      // Converter para timezone de São Paulo (UTC-3)
      const saoPauloTime = new Date(timestamp.getTime() - (3 * 60 * 60 * 1000))
      
      const openPrice = parseFloat(kline.open)
      const closePrice = parseFloat(kline.close)
      const color = closePrice >= openPrice ? 'GREEN' : 'RED'
      
      const hour = saoPauloTime.getHours()
      const minute = saoPauloTime.getMinutes()
      const day = saoPauloTime.getDate()
      const month = saoPauloTime.getMonth() + 1
      const year = saoPauloTime.getFullYear()
      
      const fullDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      const timeKey = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const dateKey = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`
      
      return {
        pair: symbol,
        timeframe: interval,
        timestamp: timestamp.toISOString(),
        open_price: openPrice,
        close_price: closePrice,
        color,
        hour,
        minute,
        day,
        month,
        year,
        full_date: fullDate,
        time_key: timeKey,
        date_key: dateKey
      }
    } catch (error) {
      console.error('Erro ao processar candle da Binance:', error)
      return null
    }
  }

  // Verificar se a API está funcionando
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/ping`)
      return response.ok
    } catch (error) {
      console.error('Erro ao verificar conexão com Binance:', error)
      return false
    }
  }

  // Obter informações do servidor (tempo)
  async getServerTime(): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/time`)
      const data = await response.json()
      return data.serverTime
    } catch (error) {
      console.error('Erro ao obter tempo do servidor:', error)
      return Date.now()
    }
  }
}

export const binanceAPI = new BinanceAPI()