import { supabase } from './supabase'
import type { ProfileFollow, PublicProfile } from '../types'

interface Row { [key: string]: unknown }
const rows = (value: unknown): Row[] => Array.isArray(value) ? value as Row[] : []
const stringValue = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback
const booleanValue = (value: unknown, fallback = false) => typeof value === 'boolean' ? value : fallback

function publicProfileFromRow(row: Row): PublicProfile {
  return {
    id: stringValue(row.id),
    publicHandle: stringValue(row.public_handle),
    publicCode: stringValue(row.public_code),
    displayName: stringValue(row.display_name),
    firstName: stringValue(row.first_name) || undefined,
    avatarUrl: stringValue(row.avatar_url) || undefined,
    discoverable: booleanValue(row.discoverable)
  }
}

export async function searchPublicProfiles(query: string, limit: number = 20): Promise<PublicProfile[]> {
  if (!supabase) return []
  const searchQuery = query.trim().replace(/^@/, '')
  const { data, error } = await supabase.rpc('search_public_profiles', {
    search_query: searchQuery.startsWith('TT-') ? searchQuery.toUpperCase() : searchQuery,
    result_limit: limit
  })
  if (error) {
    console.error('Error searching profiles:', error)
    throw error
  }
  return rows(data).map(publicProfileFromRow)
}

export async function getPublicProfileByHandle(handle: string): Promise<PublicProfile | null> {
  if (!supabase) return null
  let cleanHandle = handle.trim()
  if (cleanHandle.startsWith('@')) cleanHandle = cleanHandle.substring(1)

  const { data, error } = await supabase
    .from('public_profiles')
    .select('*')
    .ilike('public_handle', cleanHandle)
    .single()
  if (error || !data) return null
  return publicProfileFromRow(data as Row)
}

export async function getPublicProfileByCode(code: string): Promise<PublicProfile | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('public_profiles')
    .select('*')
    .eq('public_code', code)
    .single()
  if (error || !data) return null
  return publicProfileFromRow(data as Row)
}

export async function getIncomingFollowRequests(): Promise<ProfileFollow[]> {
  if (!supabase) return []
  const result = await supabase.from('profile_follows').select('id, follower_id, followed_id, status, created_at, updated_at, accepted_at, profiles!profile_follows_follower_id_fkey(id, public_handle, public_code, display_name, first_name, avatar_url, discoverable)').eq('followed_id', (await supabase.auth.getUser()).data.user?.id ?? '').eq('status', 'pending').order('created_at', { ascending: false })
  if (result.error) throw result.error
  return (result.data ?? []).map((row: Record<string, unknown>) => ({ id: String(row.id), followerId: String(row.follower_id), followedId: String(row.followed_id), status: row.status as ProfileFollow['status'], createdAt: String(row.created_at), updatedAt: String(row.updated_at), acceptedAt: row.accepted_at ? String(row.accepted_at) : null }))
}

export async function respondToFollowRequest(followId: string, decision: 'accepted' | 'rejected'): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const result = await supabase.rpc('respond_to_follow_request', { follow_id: followId, decision })
  if (result.error) throw result.error
}

export async function blockProfile(targetUserId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const result = await supabase.rpc('block_profile_follow', { target_user_id: targetUserId })
  if (result.error) throw result.error
}

export async function unfollowProfile(targetUserId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const result = await supabase.rpc('unfollow_profile', { target_user_id: targetUserId })
  if (result.error) throw result.error
}

export async function getFollowRelation(targetUserId: string): Promise<{ id: string; status: ProfileFollow['status']; direction: 'incoming' | 'outgoing' } | null> {
  if (!supabase) return null
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const result = await supabase.from('profile_follows').select('id, follower_id, followed_id, status').or(`follower_id.eq.${session.user.id},followed_id.eq.${session.user.id}`).or(`follower_id.eq.${targetUserId},followed_id.eq.${targetUserId}`).limit(20)
  if (result.error) throw result.error
  const row = (result.data ?? []).find((item) => item.follower_id === session.user.id && item.followed_id === targetUserId || item.follower_id === targetUserId && item.followed_id === session.user.id)
  return row ? { id: String(row.id), status: row.status as ProfileFollow['status'], direction: row.follower_id === session.user.id ? 'outgoing' : 'incoming' } : null
}

export async function sendFollowRequest(targetUserId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('profile_follows')
    .insert({
      follower_id: session.user.id,
      followed_id: targetUserId,
      status: 'pending'
    })

  if (error) throw error
}
