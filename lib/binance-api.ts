// A API da Binance retorna um array com 12 elementos:
// [0] openTime, [1] open, [2] high, [3] low, [4] close, [5] volume,
// [6] closeTime, [7] quoteAssetVolume, [8] numberOfTrades, [9] takerBuyBaseAssetVolume,
// [10] takerBuyQuoteAssetVolume, [11] ignore
type BinanceKline = [
  number, // openTime
  string, // open
  string, // high
  string, // low
  string, // close
  string, // volume
  number, // closeTime
  string, // quoteAssetVolume
  number, // numberOfTrades
  string, // takerBuyBaseAssetVolume
  string, // takerBuyQuoteAssetVolume
  string  // ignore
]

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
      console.log('🌐 Chamando API da Binance:', url)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        console.error('❌ Erro HTTP da Binance:', response.status, response.statusText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('✅ Resposta da Binance recebida:', data)
      return data
    } catch (error) {
      console.error('❌ Erro ao buscar dados da Binance:', error)
      throw error
    }
  }

  async getLatestCandle(symbol: string, interval: string): Promise<CandleData | null> {
    try {
      const klines = await this.getKlines(symbol, interval, 1)
      
      console.log('📊 Dados recebidos da Binance:', klines)
      
      if (klines.length === 0) {
        console.log('⚠️ Nenhum kline retornado da Binance')
        return null
      }

      const kline = klines[0]
      console.log('📈 Kline processado:', kline)
      
      // Acessar dados do array: [openTime, open, high, low, close, volume, ...]
      const openTime = kline[0]
      const open = kline[1]
      const close = kline[4]
      
      // Validar se o timestamp é válido
      if (!openTime || isNaN(openTime)) {
        console.error('Timestamp inválido recebido da Binance:', openTime)
        console.error('Estrutura completa do kline:', kline)
        return null
      }
      
      const timestamp = new Date(openTime)
      
      // Verificar se a data é válida
      if (isNaN(timestamp.getTime())) {
        console.error('Data inválida criada a partir do timestamp:', openTime)
        return null
      }
      
      // Converter para horário local brasileiro (UTC-3)
      const openPrice = parseFloat(open)
      const closePrice = parseFloat(close)
      const color = closePrice >= openPrice ? 'GREEN' : 'RED'
      
      // Aplicar timezone brasileiro (UTC-3)
      const localTimestamp = new Date(timestamp.getTime() - (3 * 60 * 60 * 1000))
      
      const hour = localTimestamp.getUTCHours()
      const minute = localTimestamp.getUTCMinutes()
      const day = localTimestamp.getUTCDate()
      const month = localTimestamp.getUTCMonth() + 1
      const year = localTimestamp.getUTCFullYear()
      
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