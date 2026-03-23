import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseEnvError =
  !supabaseUrl || !supabaseAnonKey
    ? 'Configuração ausente: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ambiente.'
    : ''

if (supabaseEnvError) {
  console.warn('Supabase env vars ausentes: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY')
}

export const supabase = supabaseEnvError ? null : createClient(supabaseUrl, supabaseAnonKey)
