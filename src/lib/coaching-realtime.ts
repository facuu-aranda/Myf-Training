import { supabase } from './supabase'

export function subscribeToCoachingChanges(spaceId: string, athleteId: string, onChange: () => void) {
  if (!supabase) return () => undefined
  const client = supabase
  const channel = client
    .channel(`coaching-${spaceId}-${athleteId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'strategy_versions', filter: `user_id=eq.${athleteId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'strategy_management', filter: `athlete_user_id=eq.${athleteId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'coach_notes', filter: `athlete_user_id=eq.${athleteId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'coach_athlete_relationships', filter: `space_id=eq.${spaceId}` }, onChange)
    .subscribe()
  return () => { void client.removeChannel(channel) }
}
