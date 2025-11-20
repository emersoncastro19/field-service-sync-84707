import { createClient } from '@supabase/supabase-js'

// Usar variables de entorno con fallback a los valores actuales para desarrollo
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://juipiurmgphxlmxdlbme.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1aXBpdXJtZ3BoeGxteGRsYm1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NjU4OTcsImV4cCI6MjA3NjU0MTg5N30.gIbbnfGFjCtVuGQ5RgQLtTVdjEqmKYjm81Hp1jpciOY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)


