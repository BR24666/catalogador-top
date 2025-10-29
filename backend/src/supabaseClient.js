import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lgddsslskhzxtpjathjr.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('⚠️ Defina SUPABASE_URL e SUPABASE_SERVICE_KEY nas env vars')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

console.log('✅ Supabase client inicializado')

