import { supabase } from './supabase'
import type { CoachNote, CoachingAthlete, Space, SpaceInvitation, StrategyManagement, StrategyVersionSummary } from '../types'

interface Row { [key: string]: unknown }
const stringValue = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback
const numberValue = (value: unknown, fallback = 0) => typeof value === 'number' ? value : Number(value ?? fallback) || fallback

function spaceFromRow(row: Row): Space {
  return {
    id: stringValue(row.id),
    ownerUserId: stringValue(row.owner_user_id),
    name: stringValue(row.name),
    type: stringValue(row.type, 'coaching') as Space['type'],
    maxMembers: numberValue(row.max_members, 50),
    status: stringValue(row.status, 'active') as Space['status'],
    metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata as Record<string, unknown> : {},
    createdAt: stringValue(row.created_at),
    updatedAt: stringValue(row.updated_at),
  }
}

export async function hasCoachingCapability(): Promise<boolean> {
  if (!supabase) return false
  const result = await supabase.rpc('has_capability', { target_capability: 'coaching_create' })
  if (result.error) return false
  return Boolean(result.data)
}

export async function createCoachingSpace(name: string, maxMembers: number): Promise<Space> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.rpc('create_coaching_space', { space_name: name.trim(), member_limit: maxMembers })
  if (error || typeof data !== 'string') throw error ?? new Error('Could not create coaching space')
  const result = await supabase.from('spaces').select('*').eq('id', data).single()
  if (result.error || !result.data) throw result.error ?? new Error('Created coaching space could not be loaded')
  return spaceFromRow(result.data as Row)
}

function invitationFromRow(row: Record<string, unknown>): SpaceInvitation {
  const space = row.spaces && typeof row.spaces === 'object' && !Array.isArray(row.spaces) ? row.spaces as Record<string, unknown> : null
  const inviter = row.profiles && typeof row.profiles === 'object' && !Array.isArray(row.profiles) ? row.profiles as Record<string, unknown> : null
  return { id: stringValue(row.id), spaceId: stringValue(row.space_id), inviterUserId: stringValue(row.inviter_user_id), inviteeUserId: stringValue(row.invitee_user_id), relationshipType: 'coach_athlete', status: stringValue(row.status, 'pending') as SpaceInvitation['status'], expiresAt: stringValue(row.expires_at), acceptedAt: stringValue(row.accepted_at) || null, createdAt: stringValue(row.created_at), spaceName: stringValue(space?.name) || undefined, inviterName: stringValue(inviter?.display_name) || undefined, inviterHandle: stringValue(inviter?.public_handle) || undefined }
}

export async function getCoachingAthleteStrategy(spaceId: string, athleteUserId: string): Promise<Record<string, unknown> | null> {
  if (!supabase) return null
  const result = await supabase.rpc('get_coach_athlete_strategy', { target_space_id: spaceId, target_athlete_id: athleteUserId })
  if (result.error) throw result.error
  return result.data as Record<string, unknown> | null
}

export async function getCoachingStrategyVersions(athleteUserId: string): Promise<StrategyVersionSummary[]> {
  if (!supabase) return []
  const result = await supabase.from('strategy_versions').select('id, version_number, status, name, change_reason, created_by, created_at, published_at, snapshot').eq('user_id', athleteUserId).order('version_number', { ascending: false })
  if (result.error) throw result.error
  return (result.data ?? []).map((row) => ({ id: String(row.id), versionNumber: row.version_number === null ? null : Number(row.version_number), status: row.status as StrategyVersionSummary['status'], name: String(row.name), changeReason: String(row.change_reason ?? ''), createdBy: row.created_by ? String(row.created_by) : null, createdAt: String(row.created_at), publishedAt: row.published_at ? String(row.published_at) : null, snapshot: row.snapshot as import('../types').Json }))
}

export async function restoreCoachingStrategyVersion(versionId: string, reason = ''): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured')
  const result = await supabase.rpc('restore_coach_strategy_version', { source_version_id: versionId, reason })
  if (result.error || typeof result.data !== 'string') throw result.error ?? new Error('Could not restore Strategy version')
  return result.data
}

export async function saveCoachingWorkoutPlan(spaceId: string, athleteUserId: string, workoutDays: unknown[]): Promise<boolean> {
  if (!supabase) throw new Error('Supabase is not configured')
  const result = await supabase.rpc('save_coach_workout_plan', { target_space_id: spaceId, target_athlete_id: athleteUserId, workout_days: workoutDays })
  if (result.error) throw result.error
  return Boolean(result.data)
}

export async function publishCoachingStrategyDraft(draftVersionId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured')
  const result = await supabase.rpc('publish_coach_strategy', { draft_version_id: draftVersionId })
  if (result.error || typeof result.data !== 'string') throw result.error ?? new Error('Could not publish Strategy draft')
  return result.data
}

export async function createCoachingStrategyDraft(spaceId: string, athleteUserId: string, reason = ''): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured')
  const result = await supabase.rpc('create_coach_strategy_draft', { target_space_id: spaceId, target_athlete_id: athleteUserId, reason })
  if (result.error || typeof result.data !== 'string') throw result.error ?? new Error('Could not create Strategy draft')
  return result.data
}

export async function updateCoachingStrategyGoals(spaceId: string, athleteUserId: string, goals: { stepGoal: number; calorieGoal: number; proteinGoal: number; carbsGoal: number; fatsGoal: number; fiberGoal: number }): Promise<boolean> {
  if (!supabase) throw new Error('Supabase is not configured')
  const result = await supabase.rpc('update_coach_strategy_goals', { target_space_id: spaceId, target_athlete_id: athleteUserId, step_goal: goals.stepGoal, calorie_goal: goals.calorieGoal, protein_goal: goals.proteinGoal, carbs_goal: goals.carbsGoal, fats_goal: goals.fatsGoal, fiber_goal: goals.fiberGoal })
  if (result.error) throw result.error
  return Boolean(result.data)
}

export async function getStrategyManagement(athleteUserId: string): Promise<StrategyManagement | null> {
  if (!supabase || !athleteUserId) return null
  const result = await supabase.rpc('get_strategy_management', { target_athlete_id: athleteUserId })
  if (result.error) throw result.error
  const row = (result.data as Record<string, unknown>[] | null)?.[0]
  if (!row) return null
  return { athleteUserId: stringValue(row.athlete_user_id), managerUserId: stringValue(row.manager_user_id) || null, spaceId: stringValue(row.space_id) || null, relationshipId: stringValue(row.relationship_id) || null, managementMode: stringValue(row.management_mode, 'self') as StrategyManagement['managementMode'], status: stringValue(row.status, 'active') as StrategyManagement['status'], startedAt: stringValue(row.started_at), endedAt: stringValue(row.ended_at) || null }
}

export async function startCoachStrategyManagement(spaceId: string, athleteUserId: string): Promise<boolean> {
  if (!supabase) throw new Error('Supabase is not configured')
  const result = await supabase.rpc('start_coach_strategy_management', { target_space_id: spaceId, target_athlete_id: athleteUserId })
  if (result.error) throw result.error
  return Boolean(result.data)
}

export async function getCoachNotes(spaceId: string, athleteUserId: string): Promise<CoachNote[]> {
  if (!supabase) return []
  const result = await supabase.rpc('get_coach_notes', { target_space_id: spaceId, target_athlete_id: athleteUserId })
  if (result.error) throw result.error
  return (result.data ?? []).map((row: Record<string, unknown>) => ({ id: stringValue(row.id), content: stringValue(row.content), visibility: stringValue(row.visibility, 'private') as CoachNote['visibility'], createdAt: stringValue(row.created_at), updatedAt: stringValue(row.updated_at) }))
}

export async function createCoachNote(spaceId: string, athleteUserId: string, content: string, visibility: CoachNote['visibility'] = 'private'): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured')
  const result = await supabase.rpc('create_coach_note', { target_space_id: spaceId, target_athlete_id: athleteUserId, note_content: content, note_visibility: visibility })
  if (result.error || typeof result.data !== 'string') throw result.error ?? new Error('Could not create Coach note')
  return result.data
}

export async function getCoachingAthleteOverview(spaceId: string, athleteUserId: string): Promise<import('../types').CoachingAthleteOverview | null> {
  if (!supabase || !spaceId || !athleteUserId) return null
  const result = await supabase.rpc('get_coach_athlete_overview', { target_space_id: spaceId, target_athlete_id: athleteUserId })
  if (result.error) throw result.error
  const row = (result.data as Record<string, unknown>[] | null)?.[0]
  if (!row) return null
  return { athleteUserId: stringValue(row.athlete_user_id), displayName: stringValue(row.display_name), publicHandle: stringValue(row.public_handle), publicCode: stringValue(row.public_code), avatarUrl: stringValue(row.avatar_url) || undefined, relationshipStatus: 'active', relationshipStartedAt: stringValue(row.relationship_started_at) || null, dailyStepGoal: numberValue(row.daily_step_goal), dailyCalorieGoal: numberValue(row.daily_calorie_goal), weightKg: numberValue(row.weight_kg), latestBodyWeight: row.latest_body_weight === null ? null : numberValue(row.latest_body_weight), latestSteps: row.latest_steps === null ? null : numberValue(row.latest_steps), lastWorkoutAt: stringValue(row.last_workout_at) || null, workoutsLast7Days: numberValue(row.workouts_last_7_days), volumeLast7Days: numberValue(row.volume_last_7_days), personalRecordsCount: numberValue(row.personal_records_count) }
}

export async function getCoachingMemberIds(spaceId: string): Promise<string[]> {
  if (!supabase || !spaceId) return []
  const result = await supabase.from('space_members').select('user_id').eq('space_id', spaceId).eq('status', 'active').is('left_at', null)
  if (result.error) throw result.error
  return (result.data ?? []).map((row) => stringValue(row.user_id)).filter(Boolean)
}

export async function removeCoachingAthlete(spaceId: string, athleteUserId: string): Promise<boolean> {
  if (!supabase) throw new Error('Supabase is not configured')
  const result = await supabase.rpc('remove_coaching_athlete', { target_space_id: spaceId, target_athlete_id: athleteUserId })
  if (result.error) throw result.error
  return Boolean(result.data)
}

export async function getCoachingAthletes(spaceId: string): Promise<CoachingAthlete[]> {
  if (!supabase || !spaceId) return []
  const result = await supabase.rpc('get_coaching_athletes', { target_space_id: spaceId })
  if (result.error) throw result.error
  return (result.data ?? []).map((row: Record<string, unknown>) => ({ athleteUserId: stringValue(row.athlete_user_id), displayName: stringValue(row.display_name), publicHandle: stringValue(row.public_handle), publicCode: stringValue(row.public_code), avatarUrl: stringValue(row.avatar_url) || undefined, relationshipStatus: 'active' as const, relationshipStartedAt: stringValue(row.relationship_started_at) || null }))
}

export async function getPendingCoachingInvitations(): Promise<SpaceInvitation[]> {
  if (!supabase) return []
  const result = await supabase.from('space_invitations').select('id, space_id, inviter_user_id, invitee_user_id, relationship_type, status, expires_at, accepted_at, created_at, spaces(name), profiles!space_invitations_inviter_user_id_fkey(display_name, public_handle)').eq('status', 'pending').order('created_at', { ascending: false })
  if (result.error) throw result.error
  return (result.data ?? []).map((row) => invitationFromRow(row as Record<string, unknown>))
}

export async function getSentCoachingInvitations(spaceId: string): Promise<SpaceInvitation[]> {
  if (!supabase || !spaceId) return []
  const result = await supabase.from('space_invitations').select('id, space_id, inviter_user_id, invitee_user_id, relationship_type, status, expires_at, accepted_at, created_at, profiles!space_invitations_invitee_user_id_fkey(display_name, public_handle)').eq('space_id', spaceId).in('status', ['pending', 'expired']).order('created_at', { ascending: false })
  if (result.error) throw result.error
  return (result.data ?? []).map((row) => invitationFromRow(row as Record<string, unknown>))
}

export async function cancelCoachingInvitation(invitationId: string): Promise<boolean> {
  if (!supabase) throw new Error('Supabase is not configured')
  const result = await supabase.rpc('cancel_coaching_invitation', { invitation_id: invitationId })
  if (result.error) throw result.error
  return Boolean(result.data)
}

export async function resendCoachingInvitation(invitationId: string): Promise<boolean> {
  if (!supabase) throw new Error('Supabase is not configured')
  const result = await supabase.rpc('resend_coaching_invitation', { invitation_id: invitationId })
  if (result.error) throw result.error
  return Boolean(result.data)
}

export async function respondToCoachingInvitation(invitationId: string, accepted: boolean): Promise<boolean> {
  if (!supabase) throw new Error('Supabase is not configured')
  if (accepted) {
    const result = await supabase.rpc('accept_coaching_invitation', { invitation_id: invitationId })
    if (result.error) throw result.error
    return Boolean(result.data)
  }
  const result = await supabase.from('space_invitations').update({ status: 'declined', updated_at: new Date().toISOString() }).eq('id', invitationId).eq('status', 'pending')
  if (result.error) throw result.error
  return true
}

export async function inviteCoachingAthlete(spaceId: string, targetUserId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.rpc('invite_coaching_athlete', { target_space_id: spaceId, target_user_id: targetUserId })
  if (error || typeof data !== 'string') throw error ?? new Error('Could not invite athlete')
  return data
}

export async function getMyCoachingSpaces(): Promise<Space[]> {
  if (!supabase) return []
  const result = await supabase.from('spaces').select('*').eq('type', 'coaching').eq('status', 'active').order('created_at', { ascending: false })
  if (result.error) throw result.error
  return (result.data ?? []).map((row) => spaceFromRow(row as Row))
}
