import { supabase, CandleData } from './supabase'
import { BinanceAPI, ProcessedKline } from './binance-api'

export class CatalogService {
  private binanceAPI: BinanceAPI

  constructor() {
    this.binanceAPI = BinanceAPI.getInstance()
  }

  async collectAndSave(): Promise<void> {
    try {
      console.log('🔄 Iniciando coleta de dados...')
      
      const pairs = ['BTCUSDT', 'XRPUSDT', 'SOLUSDT']
      const timeframes = ['1m', '5m', '15m']
      
      const candles = await this.binanceAPI.getLatestCandles(pairs, timeframes)
      console.log(`📊 Coletadas ${candles.length} velas`)

      for (const candle of candles) {
        await this.saveCandle(candle)
      }

      // Atualizar timestamp da última coleta
      await this.updateLastUpdate()
      
      console.log('✅ Dados coletados e salvos com sucesso!')
    } catch (error) {
      console.error('❌ Erro na coleta:', error)
      await this.logError('Erro na coleta de dados', error)
    }
  }

  private async saveCandle(candle: ProcessedKline): Promise<void> {
    try {
      const { error } = await supabase
        .from('candle_catalog')
        .upsert({
          pair: candle.pair,
          timeframe: candle.timeframe,
          timestamp: candle.timestamp.toISOString(),
          open_price: candle.open_price,
          high_price: candle.high_price,
          low_price: candle.low_price,
          close_price: candle.close_price,
          volume: candle.volume,
          color: candle.color,
          hour: candle.hour,
          minute: candle.minute,
          day: candle.day,
          month: candle.month,
          year: candle.year,
          full_date: candle.full_date,
          time_key: candle.time_key,
          date_key: candle.date_key,
        })

      if (error) {
        console.error(`❌ Erro ao salvar vela ${candle.pair} ${candle.timeframe}:`, error)
      } else {
        console.log(`✅ Vela salva: ${candle.pair} ${candle.timeframe} ${candle.time_key} ${candle.color}`)
      }
    } catch (error) {
      console.error(`❌ Erro ao salvar vela:`, error)
    }
  }

  private async updateLastUpdate(): Promise<void> {
    try {
      const { error } = await supabase
        .from('catalog_settings')
        .update({ 
          last_update: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', 1)

      if (error) {
        console.error('❌ Erro ao atualizar timestamp:', error)
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar timestamp:', error)
    }
  }

  private async logError(message: string, error: any): Promise<void> {
    try {
      await supabase
        .from('catalog_logs')
        .insert({
          level: 'ERROR',
          message,
          error_details: error,
        })
    } catch (logError) {
      console.error('❌ Erro ao salvar log:', logError)
    }
  }

  async getCandlesByDate(
    pair: string,
    timeframe: string,
    date: string
  ): Promise<CandleData[]> {
    try {
      const { data, error } = await supabase
        .from('candle_catalog')
        .select('*')
        .eq('pair', pair)
        .eq('timeframe', timeframe)
        .eq('full_date', date)
        .order('timestamp', { ascending: true })

      if (error) {
        console.error('❌ Erro ao buscar velas:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('❌ Erro ao buscar velas:', error)
      return []
    }
  }

  async getCatalogStatus(): Promise<{ isRunning: boolean; lastUpdate: string | null }> {
    try {
      const { data, error } = await supabase
        .from('catalog_settings')
        .select('is_running, last_update')
        .eq('id', 1)
        .single()

      if (error) {
        console.error('❌ Erro ao buscar status:', error)
        return { isRunning: false, lastUpdate: null }
      }

      return {
        isRunning: data.is_running,
        lastUpdate: data.last_update,
      }
    } catch (error) {
      console.error('❌ Erro ao buscar status:', error)
      return { isRunning: false, lastUpdate: null }
    }
  }
}