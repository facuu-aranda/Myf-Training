import { supabase } from './supabase'
import type { NutritionPlan, WorkoutDay } from '../types'

export interface StrategyVersionSnapshot {
  nutrition: NutritionPlan
  workoutDays: WorkoutDay[]
}

export async function saveStrategyVersion(userId: string, snapshot: StrategyVersionSnapshot, name = 'Strategy'): Promise<void> {
  if (!supabase) return
  const { error: archiveError } = await supabase.from('strategy_versions').update({ is_current: false }).eq('user_id', userId).eq('is_current', true)
  if (archiveError) throw archiveError
  const { error } = await supabase.from('strategy_versions').insert({ user_id: userId, name, starts_on: new Date().toISOString().slice(0, 10), is_current: true, snapshot })
  if (error) throw error
}
