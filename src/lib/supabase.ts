import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigured = Boolean(url && anonKey)

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!supabaseConfigured) {
    throw new Error(
      '.env dosyasında VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY doldurulmalı.',
    )
  }
  if (!client) client = createClient(url!, anonKey!)
  return client
}
