import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authenticate, getAuthenticatedProfile, signOut as signOutUser } from '../lib/auth'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'
import { useFitness } from '../hooks/useFitness'

interface AuthContextValue {
  user: Profile | null
  isLoading: boolean
  signIn: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { profiles } = useFitness()
  const [user, setUser] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    void getAuthenticatedProfile(profiles).then((profile) => {
      if (mounted) {
        setUser(profile)
        setIsLoading(false)
      }
    })
    if (!supabase) return () => { mounted = false }
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      const profile = profiles.find((item) => item.id === session?.user.id) ?? profiles.find((item) => item.username === session?.user.email?.split('@')[0]) ?? null
      setUser(profile)
      setIsLoading(false)
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
