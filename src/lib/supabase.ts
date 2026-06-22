import { createClient } from '@supabase/supabase-js'

const supabaseUrl: string = import.meta.env['VITE_SUPABASE_URL']
const supabaseAnonKey: string = import.meta.env['VITE_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_URL 또는 VITE_SUPABASE_ANON_KEY 누락 — .env.example을 .env.local로 복사 후 값 입력'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
