'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { type User } from 'firebase/auth'
import { onAuthChange } from '@/lib/firebase/auth'
import { getUserProfile } from '@/lib/firebase/db'
import { type Profile } from '@/lib/types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      setUser(u)
      if (u) {
        try {
          const p = await getUserProfile(u.uid)
          setProfile(p)
        } catch (err) {
          // Firestore rules not yet configured — user is still authenticated
          console.warn('[DevTrack] Could not load profile (check Firestore rules):', err)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  return <AuthContext.Provider value={{ user, profile, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
