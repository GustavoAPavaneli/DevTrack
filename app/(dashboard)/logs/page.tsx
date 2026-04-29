'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { LogsClient } from './LogsClient'
import { getProjects, getTimeLogs } from '@/lib/firebase/db'
import { useAuth } from '@/components/providers/AuthProvider'
import { type TimeLogWithRelations, type Project } from '@/lib/types'

export default function LogsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [logs, setLogs] = useState<TimeLogWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([getProjects(), getTimeLogs()]).then(([p, l]) => {
      setProjects(p.filter((proj) => proj.status === 'active'))
      setLogs(l)
      setLoading(false)
    })
  }, [user])

  return (
    <div className="flex flex-col">
      <Topbar title="Registrar Horas" />
      {loading ? (
        <div className="p-10 text-center text-sm" style={{ color: 'var(--color-text-dim)' }}>Carregando...</div>
      ) : (
        <LogsClient initialLogs={logs} projects={projects} />
      )}
    </div>
  )
}
