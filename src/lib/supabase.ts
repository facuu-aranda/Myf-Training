import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null

export type RealtimeTable = 'workout_sessions' | 'exercise_sets' | 'daily_metrics' | 'personal_records' | 'activity_events' | 'food_logs' | 'food_log_items' | 'meal_plans' | 'meal_plan_days' | 'planned_meals' | 'grocery_lists' | 'grocery_list_items' | 'households' | 'household_members' | 'household_invitations' | 'profile_follows'

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

export function subscribeToNutritionChanges(onChange: () => void) {
  if (!supabase) return () => undefined
  const channel = supabase
    .channel('nutrition-updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'food_logs' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'food_log_items' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_plans' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_plan_days' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'planned_meals' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'grocery_lists' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'grocery_list_items' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'foods' }, onChange)
    .subscribe()
  return () => {
    void supabase.removeChannel(channel)
  }
}

export function subscribeToSocialChanges(onChange: () => void) {
  if (!supabase) return () => undefined
  const channel = supabase
    .channel('social-household-updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'households' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'household_members' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'household_invitations' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profile_follows' }, onChange)
    .subscribe()
  return () => {
    void supabase.removeChannel(channel)
  }
}
