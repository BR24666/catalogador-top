export interface BinanceKline {
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

export interface ProcessedKline {
  pair: string
  timeframe: string
  timestamp: Date
  open_price: number
  high_price: number
  low_price: number
  close_price: number
  volume: number
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
  private static instance: BinanceAPI
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.BINANCE_API_URL || 'https://api.binance.com/api/v3'
  }

  static getInstance(): BinanceAPI {
    if (!BinanceAPI.instance) {
      BinanceAPI.instance = new BinanceAPI()
    }
    return BinanceAPI.instance
  }

  async getLatestCandles(pairs: string[], timeframes: string[]): Promise<ProcessedKline[]> {
    const results: ProcessedKline[] = []

    for (const pair of pairs) {
      for (const timeframe of timeframes) {
        try {
          const klines = await this.getKlines(pair, timeframe, 1)
          if (klines.length > 0) {
            const processed = this.processKline(klines[0], pair, timeframe)
            results.push(processed)
          }
        } catch (error) {
          console.error(`Erro ao buscar dados para ${pair} ${timeframe}:`, error)
        }
      }
    }

    return results
  }

  private async getKlines(symbol: string, interval: string, limit: number = 1): Promise<BinanceKline[]> {
    const url = `${this.baseUrl}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Erro na API Binance: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.map((kline: any[]) => ({
      openTime: kline[0],
      open: kline[1],
      high: kline[2],
      low: kline[3],
      close: kline[4],
      volume: kline[5],
      closeTime: kline[6],
      quoteAssetVolume: kline[7],
      numberOfTrades: kline[8],
      takerBuyBaseAssetVolume: kline[9],
      takerBuyQuoteAssetVolume: kline[10],
      ignore: kline[11]
    }))
  }

  private processKline(kline: BinanceKline, pair: string, timeframe: string): ProcessedKline {
    const timestamp = new Date(kline.openTime)
    
    // Converter para horário de São Paulo (UTC-3)
    const saoPauloTime = new Date(timestamp.getTime() - (3 * 60 * 60 * 1000))
    
    const open_price = parseFloat(kline.open)
    const close_price = parseFloat(kline.close)
    const color: 'GREEN' | 'RED' = close_price >= open_price ? 'GREEN' : 'RED'

    return {
      pair,
      timeframe,
      timestamp: saoPauloTime,
      open_price,
      high_price: parseFloat(kline.high),
      low_price: parseFloat(kline.low),
      close_price,
      volume: parseFloat(kline.volume),
      color,
      hour: saoPauloTime.getHours(),
      minute: saoPauloTime.getMinutes(),
      day: saoPauloTime.getDate(),
      month: saoPauloTime.getMonth() + 1,
      year: saoPauloTime.getFullYear(),
      full_date: saoPauloTime.toISOString().split('T')[0],
      time_key: saoPauloTime.toTimeString().slice(0, 5),
      date_key: saoPauloTime.toISOString().split('T')[0]
    }
  }
}