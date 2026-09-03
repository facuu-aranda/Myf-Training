import { supabase } from './supabase'
import type { Household, HouseholdMember, HouseholdInvitation, Profile } from '../types'

interface Row { [key: string]: unknown }
const rows = (value: unknown): Row[] => Array.isArray(value) ? value as Row[] : []
const stringValue = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback
const booleanValue = (value: unknown, fallback = false) => typeof value === 'boolean' ? value : fallback
const numberValue = (value: unknown, fallback = 0) => typeof value === 'number' ? value : Number(value ?? fallback) || fallback

function profileFromRow(row: Row): Profile {
  return {
    id: stringValue(row.id),
    username: stringValue(row.username),
    publicHandle: stringValue(row.public_handle),
    publicCode: stringValue(row.public_code),
    discoverable: booleanValue(row.discoverable, true),
    profileVisibility: stringValue(row.profile_visibility, 'discoverable') as Profile['profileVisibility'],
    progressVisibility: stringValue(row.progress_visibility, 'household') as Profile['progressVisibility'],
    displayName: stringValue(row.display_name),
    firstName: stringValue(row.first_name, stringValue(row.display_name).split(' ')[0]),
    avatarUrl: stringValue(row.avatar_url),
    heightCm: numberValue(row.height_cm),
    weightKg: numberValue(row.weight_kg),
    dailyStepGoal: numberValue(row.daily_step_goal, 10000),
    dailyCalorieGoal: numberValue(row.daily_calorie_goal, 2000),
    active: booleanValue(row.active, true),
    createdAt: stringValue(row.created_at),
    updatedAt: stringValue(row.updated_at)
  }
}

function householdFromRow(row: Row): Household {
  return {
    id: stringValue(row.id),
    name: stringValue(row.name),
    householdType: stringValue(row.household_type, 'duo') as Household['householdType'],
    legacyCoupleId: stringValue(row.legacy_couple_id) || null,
    ownerUserId: stringValue(row.owner_user_id),
    maxMembers: numberValue(row.max_members, 2),
    createdAt: stringValue(row.created_at),
    updatedAt: stringValue(row.updated_at)
  }
}

function householdMemberFromRow(row: Row): HouseholdMember {
  const profileRow = row.profiles && typeof row.profiles === 'object' && !Array.isArray(row.profiles) ? row.profiles : undefined
  return {
    householdId: stringValue(row.household_id),
    userId: stringValue(row.user_id),
    role: stringValue(row.role, 'member') as HouseholdMember['role'],
    joinedAt: stringValue(row.joined_at),
    leftAt: stringValue(row.left_at) || null,
    profile: profileRow ? profileFromRow(profileRow as Row) : undefined
  }
}

function householdInvitationFromRow(row: Row): HouseholdInvitation {
  const householdRow = row.households && typeof row.households === 'object' && !Array.isArray(row.households) ? row.households : undefined
  const inviterRow = row.profiles && typeof row.profiles === 'object' && !Array.isArray(row.profiles) ? row.profiles : undefined
  return {
    id: stringValue(row.id),
    householdId: stringValue(row.household_id),
    inviterUserId: stringValue(row.inviter_user_id),
    inviteeUserId: stringValue(row.invitee_user_id) || null,
    tokenHash: stringValue(row.token_hash) || null,
    status: stringValue(row.status, 'pending') as HouseholdInvitation['status'],
    expiresAt: stringValue(row.expires_at),
    acceptedAt: stringValue(row.accepted_at) || null,
    revokedAt: stringValue(row.revoked_at) || null,
    createdAt: stringValue(row.created_at),
    household: householdRow ? householdFromRow(householdRow as Row) : undefined,
    inviter: inviterRow ? profileFromRow(inviterRow as Row) : undefined
  }
}

export async function getMyHousehold(): Promise<{ household: Household; members: HouseholdMember[] } | null> {
  if (!supabase) return null
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: memberData, error: memberErr } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', session.user.id)
    .is('left_at', null)
    .single()

  if (memberErr || !memberData) return null

  const { data: householdData, error: houseErr } = await supabase
    .from('households')
    .select('*')
    .eq('id', memberData.household_id)
    .single()

  if (houseErr || !householdData) return null

  const { data: membersData, error: membersErr } = await supabase
    .from('household_members')
    .select('*, profiles(*)')
    .eq('household_id', memberData.household_id)
    .is('left_at', null)

  if (membersErr) return null

  return {
    household: householdFromRow(householdData as Row),
    members: rows(membersData).map(householdMemberFromRow)
  }
}

export async function createHousehold(name: string = 'My Household'): Promise<Household> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('households')
    .insert({
      name,
      owner_user_id: session.user.id,
      household_type: 'duo',
      max_members: 2
    })
    .select('*')
    .single()

  if (error) throw error

  const { error: memErr } = await supabase
    .from('household_members')
    .insert({
      household_id: data.id,
      user_id: session.user.id,
      role: 'owner'
    })

  if (memErr) throw memErr

  return householdFromRow(data as Row)
}

export async function inviteToHousehold(householdId: string, targetUserId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { error } = await supabase
    .from('household_invitations')
    .insert({
      household_id: householdId,
      inviter_user_id: session.user.id,
      invitee_user_id: targetUserId,
      expires_at: expiresAt.toISOString(),
      status: 'pending'
    })

  if (error) throw error
}

export async function getPendingInvitations(): Promise<HouseholdInvitation[]> {
  if (!supabase) return []
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []

  const { data, error } = await supabase
    .from('household_invitations')
    .select('*, households(*), profiles!household_invitations_inviter_user_id_fkey(*)')
    .eq('invitee_user_id', session.user.id)
    .eq('status', 'pending')

  if (error) return []
  return rows(data).map(householdInvitationFromRow)
}

export async function acceptInvitation(invitationId: string, householdId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const { data: success, error: rpcErr } = await supabase.rpc('add_household_member', {
    p_household_id: householdId,
    p_user_id: session.user.id,
    p_role: 'member'
  })

  if (rpcErr) throw rpcErr
  if (!success) throw new Error('Household is full or invalid')

  await supabase
    .from('household_invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invitationId)
}

export async function declineInvitation(invitationId: string): Promise<void> {
  if (!supabase) return
  await supabase
    .from('household_invitations')
    .update({ status: 'declined', revoked_at: new Date().toISOString() })
    .eq('id', invitationId)
}

export async function removeHouseholdMember(householdId: string, targetUserId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('household_members')
    .delete()
    .eq('household_id', householdId)
    .eq('user_id', targetUserId)

  if (error) throw error
}
