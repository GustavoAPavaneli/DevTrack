'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { Sidebar } from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
        <span className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-brand)' }} />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
