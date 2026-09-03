import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authenticate, getAuthenticatedProfile, signOut as signOutUser } from '../lib/auth'
import { loadAuthenticatedProfile } from '../lib/repository'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'
import { useFitness } from '../hooks/useFitness'

interface AuthContextValue {
  user: Profile | null
  isLoading: boolean
  signIn: (username: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function wait(milliseconds: number) { return new Promise((resolve) => window.setTimeout(resolve, milliseconds)) }

async function resolveSessionProfile(session: { user: { id: string; email?: string | null } } | null, profiles: Profile[]) {
  if (!session) return null
  const localProfile = profiles.find((item) => item.id === session.user.id) ?? profiles.find((item) => item.username === session.user.email?.split('@')[0])
  if (localProfile) return localProfile
  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const remoteProfile = await loadAuthenticatedProfile(session.user.id)
      if (remoteProfile) return remoteProfile
    } catch (error) { lastError = error }
    if (attempt < 2) await wait(250)
  }
  if (lastError) throw lastError
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { profiles } = useFitness()
  const [user, setUser] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const applySession = async (session: { user: { id: string; email?: string | null } } | null) => {
      try {
        const profile = await resolveSessionProfile(session, profiles)
        if (mounted) { setUser(profile); setIsLoading(false) }
      } catch (error) {
        console.error('Train Together auth profile resolution failed', error instanceof Error ? error.message : error)
        if (mounted) { setUser(null); setIsLoading(false) }
      }
    }

    setIsLoading(true)
    void getAuthenticatedProfile(profiles).then((profile) => { if (mounted) { setUser(profile); setIsLoading(false) } }).catch((error: unknown) => { console.error('Train Together auth session lookup failed', error instanceof Error ? error.message : error); if (mounted) { setUser(null); setIsLoading(false) } })
    if (!supabase) return () => { mounted = false }
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setIsLoading(true)
      window.setTimeout(() => { if (mounted) void applySession(session) }, 0)
    })
    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [profiles])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    signIn: async (username, password) => {
      const profile = await authenticate(username, password, profiles)
      setUser(profile)
    },
    signInWithGoogle: async () => {
      if (!supabase) throw new Error('Supabase no está configurado. No se puede iniciar sesión con Google.')
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/app/onboarding`,
        },
      })
      if (error) throw error
    },
    signOut: async () => {
      await signOutUser()
      setUser(null)
    },
  }), [isLoading, profiles, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
