import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface CandleData {
  id: string
  pair: string
  timeframe: string
  timestamp: string
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
  created_at: string
  updated_at: string
}

export interface CatalogSettings {
  id: number
  is_running: boolean
  pairs: string[]
  timeframes: string[]
  update_interval_seconds: number
  last_update: string | null
  created_at: string
  updated_at: string
}

export interface CatalogLog {
  id: string
  level: 'INFO' | 'WARN' | 'ERROR'
  message: string
  error_details: any
  created_at: string
}