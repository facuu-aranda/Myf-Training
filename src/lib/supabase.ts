import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null

export type RealtimeTable = 'workout_sessions' | 'exercise_sets' | 'daily_metrics' | 'personal_records' | 'activity_events'

export function subscribeToFitnessChanges(onChange: () => void) {
  if (!supabase) return () => undefined
  const channel = supabase
    .channel('fitness-couple-updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'workout_sessions' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'exercise_sets' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_metrics' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'personal_records' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_events' }, onChange)
    .subscribe()
  return () => {
    void supabase.removeChannel(channel)
  }
}
