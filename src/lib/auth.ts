import { supabase } from './supabase'
import { loadAuthenticatedProfile } from './repository'
import { SESSION_KEY, readStorage, removeStorage, writeStorage } from './storage'
import type { Profile } from '../types'

const ACCOUNT_EMAIL_DOMAIN = 'train-together.local'

export interface DemoAccount {
  username: string
  passwordHash: string
  profileId: string
}

export const demoAccounts: DemoAccount[] = [
  { username: 'fabricio', passwordHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', profileId: 'user-fabricio' },
  { username: 'maria', passwordHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', profileId: 'user-maria' },
]

export function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@${ACCOUNT_EMAIL_DOMAIN}`
}

async function hashPassword(password: string) {
  const encoded = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function authenticate(username: string, password: string, profiles: Profile[]) {
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(username), password })
    if (error || !data.user) throw new Error('INVALID_CREDENTIALS')
    const profile = profiles.find((item) => item.id === data.user.id) ?? profiles.find((item) => item.username === username) ?? await loadAuthenticatedProfile(data.user.id)
    if (!profile) throw new Error('PROFILE_NOT_FOUND')
    return profile
  }
  const account = demoAccounts.find((item) => item.username === username.trim().toLowerCase())
  const passwordHash = await hashPassword(password)
  if (!account || passwordHash !== account.passwordHash) throw new Error('INVALID_CREDENTIALS')
  const profile = profiles.find((item) => item.id === account.profileId)
  if (!profile) throw new Error('PROFILE_NOT_FOUND')
  writeStorage(SESSION_KEY, profile.id)
  return profile
}

export async function getAuthenticatedProfile(profiles: Profile[]) {
  if (supabase) {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) return null
    return profiles.find((profile) => profile.id === data.user.id) ?? profiles.find((profile) => profile.username === data.user.email?.split('@')[0]) ?? await loadAuthenticatedProfile(data.user.id)
  }
  const profileId = readStorage<string | null>(SESSION_KEY, null)
  return profiles.find((profile) => profile.id === profileId) ?? null
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut()
  removeStorage(SESSION_KEY)
}
