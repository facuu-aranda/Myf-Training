import { supabase } from './supabase'

export const customExerciseVisibilities = ['private', 'space'] as const
export function canEditCustomExercise(ownerUserId: string | null | undefined, currentUserId: string, status: 'active' | 'archived' = 'active') {
  return status === 'active' && Boolean(ownerUserId) && ownerUserId === currentUserId
}

export async function createCustomExercise(input: { name: string; nameEs?: string; description?: string; muscleGroup?: string; target?: string; category?: string; equipment?: string; visibility?: 'private' | 'space'; spaceId?: string | null }) {
  if (!supabase) throw new Error('Supabase is not configured')
  const result = await supabase.rpc('create_custom_exercise', { exercise_name: input.name.trim(), exercise_name_es: input.nameEs ?? '', exercise_description: input.description ?? '', exercise_instructions: [], exercise_muscle_group: input.muscleGroup ?? '', exercise_target: input.target ?? '', exercise_category: input.category ?? '', exercise_equipment: input.equipment ?? '', target_visibility: input.visibility ?? 'private', target_space_id: input.spaceId ?? null })
  if (result.error || typeof result.data !== 'string') throw result.error ?? new Error('Could not create custom exercise')
  return result.data
}
