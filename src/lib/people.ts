import { supabase } from './supabase'
import type { PublicProfile } from '../types'

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
