import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Lead = {
  id: string
  user_id: string
  name: string
  email: string
  phone: string
  lead_source: string
  interested_service: string
  status: 'New' | 'Contacted' | 'Follow-Up Required' | 'Converted' | 'Lost'
  notes: string
  last_contacted_at: string | null
  created_at: string
}

export type Profile = {
  id: string
  name: string
  role: 'admin' | 'user'
  created_at: string
}