import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://juipiurmgphxlmxdlbme.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1aXBpdXJtZ3BoeGxteGRsYm1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NjU4OTcsImV4cCI6MjA3NjU0MTg5N30.gIbbnfGFjCtVuGQ5RgQLtTVdjEqmKYjm81Hp1jpciOY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)


