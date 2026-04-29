'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { MyPanelClient } from './MyPanelClient'
import { getProjects, getTimeLogs } from '@/lib/firebase/db'
import { useAuth } from '@/components/providers/AuthProvider'
import { getWeekRange, isoWeekDates } from '@/lib/utils'
import { type TimeLogWithRelations, type Project } from '@/lib/types'

export default function MyPanelPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<TimeLogWithRelations[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([getTimeLogs(user.uid), getProjects()]).then(([l, p]) => {
      setLogs(l)
      setProjects(p)
      setLoading(false)
    })
  }, [user])

  const { start } = getWeekRange()
  const dates = isoWeekDates(start)
  const weekLogs = logs.filter((l) => l.date >= dates[0] && l.date <= dates[6])
  const weeklyHours = weekLogs.reduce((sum, l) => sum + l.hours, 0)
  const hoursByDate: Record<string, number> = {}
  for (const log of weekLogs) {
    hoursByDate[log.date] = (hoursByDate[log.date] ?? 0) + log.hours
  }
  const chartData = dates.map((d) => ({ day: d, hours: hoursByDate[d] ?? 0 }))

  return (
    <div className="flex flex-col">
      <Topbar title="Meu Painel" />
      {loading ? (
        <div className="p-10 text-center text-sm" style={{ color: 'var(--color-text-dim)' }}>Carregando...</div>
      ) : (
        <MyPanelClient userId={user?.uid ?? ''} logs={logs} projects={projects} weeklyHours={weeklyHours} chartData={chartData} />
      )}
    </div>
  )
}
