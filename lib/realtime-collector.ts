'use client'

import { binanceAPI, type CandleData } from './binance-api'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lgddsslskhzxtpjathjr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws'
const supabase = createClient(supabaseUrl, supabaseKey)

export class RealtimeCollector {
  private intervals: Map<string, NodeJS.Timeout> = new Map()
  private isCollecting = false
  public onDataUpdate?: (candles: CandleData[]) => void

  constructor(onDataUpdate?: (candles: CandleData[]) => void) {
    this.onDataUpdate = onDataUpdate
  }

  // Iniciar coleta para um par e timeframe específicos
  startCollection(pair: string, timeframe: string) {
    const key = `${pair}-${timeframe}`
    
    // Parar coleta anterior se existir
    this.stopCollection(pair, timeframe)
    
    console.log(`🚀 Iniciando coleta em tempo real para ${pair} - ${timeframe}`)
    
    // Coletar imediatamente
    this.collectData(pair, timeframe)
    
    // Configurar intervalo baseado no timeframe
    const intervalMs = this.getIntervalMs(timeframe)
    
    const interval = setInterval(() => {
      this.collectData(pair, timeframe)
    }, intervalMs)
    
    this.intervals.set(key, interval)
    this.isCollecting = true
  }

  // Parar coleta para um par e timeframe específicos
  stopCollection(pair: string, timeframe: string) {
    const key = `${pair}-${timeframe}`
    const interval = this.intervals.get(key)
    
    if (interval) {
      clearInterval(interval)
      this.intervals.delete(key)
      console.log(`⏹️ Parando coleta para ${pair} - ${timeframe}`)
    }
  }

  // Parar todas as coletas
  stopAllCollections() {
    this.intervals.forEach((interval, key) => {
      clearInterval(interval)
      console.log(`⏹️ Parando coleta: ${key}`)
    })
    this.intervals.clear()
    this.isCollecting = false
  }

  // Coletar dados da Binance
  private async collectData(pair: string, timeframe: string) {
    try {
      const candle = await binanceAPI.getLatestCandle(pair, timeframe)
      
      if (!candle) {
        console.warn(`⚠️ Nenhum dado recebido para ${pair} - ${timeframe}`)
        return
      }

      console.log(`📊 Coletado: ${candle.pair} ${candle.time_key} - ${candle.color} - $${candle.close_price}`)

      // Salvar no Supabase
      await this.saveToSupabase(candle)
      
      // Notificar atualização apenas se for um novo candle
      if (this.onDataUpdate) {
        // Buscar dados atualizados do Supabase para notificar
        const updatedCandles = await this.getCandlesFromSupabase(candle.full_date, timeframe, pair)
        console.log(`🔄 Notificando atualização com ${updatedCandles.length} candles`)
        this.onDataUpdate(updatedCandles)
      }
      
    } catch (error) {
      console.error(`❌ Erro ao coletar dados para ${pair} - ${timeframe}:`, error)
    }
  }

  // Salvar candle no Supabase (tabela de tempo real)
  private async saveToSupabase(candle: CandleData) {
    try {
      console.log('💾 Salvando candle no Supabase (realtime):', candle)
      
      const { error } = await supabase
        .from('realtime_candle_data')
        .upsert(candle, { 
          onConflict: 'pair,timeframe,timestamp' 
        })

      if (error) {
        console.error('❌ Erro ao salvar no Supabase:', error)
      } else {
        console.log(`✅ Salvo no Supabase (realtime): ${candle.pair} ${candle.time_key} - ${candle.color}`)
      }
    } catch (error) {
      console.error('❌ Erro ao salvar no Supabase:', error)
    }
  }

  // Buscar candles do Supabase (tabela de tempo real)
  public async getCandlesFromSupabase(date: string, timeframe: string, pair: string): Promise<CandleData[]> {
    try {
      console.log(`🔍 Buscando dados do Supabase (realtime): ${pair} ${timeframe} ${date}`)
      
      // Buscar apenas dados das últimas 2 horas para evitar velas antigas
      const twoHoursAgo = new Date()
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2)
      
      const { data, error } = await supabase
        .from('realtime_candle_data')
        .select('*')
        .eq('full_date', date)
        .eq('timeframe', timeframe)
        .eq('pair', pair)
        .gte('timestamp', twoHoursAgo.toISOString())
        .order('timestamp', { ascending: true })

      if (error) {
        console.error('❌ Erro ao buscar dados do Supabase:', error)
        return []
      }

      console.log(`📊 Encontrados ${data?.length || 0} candles no Supabase (realtime) - últimas 2h`)
      return data || []
    } catch (error) {
      console.error('❌ Erro ao buscar dados do Supabase:', error)
      return []
    }
  }

  // Obter intervalo em milissegundos baseado no timeframe
  private getIntervalMs(timeframe: string): number {
    switch (timeframe) {
      case '1m': return 60000  // 1 minuto
      case '5m': return 300000 // 5 minutos
      case '15m': return 900000 // 15 minutos
      case '1h': return 3600000 // 1 hora
      default: return 60000
    }
  }

  // Verificar se está coletando
  isActive(): boolean {
    return this.isCollecting
  }

  // Obter status das coletas ativas
  getActiveCollections(): string[] {
    return Array.from(this.intervals.keys())
  }
}

export const realtimeCollector = new RealtimeCollector()
