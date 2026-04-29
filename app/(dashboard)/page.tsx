'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { getProjects, getWeeklyLogs, getAllProfiles } from '@/lib/firebase/db'
import { getWeekRange, formatHours, getWeekLabel, isoWeekDates } from '@/lib/utils'
import { useAuth } from '@/components/providers/AuthProvider'
import { type Profile, type Project, type TimeLogWithRelations } from '@/lib/types'

export default function DashboardPage() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [weekLogs, setWeekLogs] = useState<TimeLogWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  const { start } = getWeekRange()
  const dates = isoWeekDates(start)

  useEffect(() => {
    if (!user) return
    Promise.all([
      getAllProfiles(),
      getProjects(),
      getWeeklyLogs(dates[0], dates[6]),
    ])
      .then(([p, proj, logs]) => {
        setProfiles(p)
        setProjects(proj)
        setWeekLogs(logs)
      })
      .finally(() => setLoading(false))
  }, [user])

  const devProfiles = profiles
  const activeProjects = projects.filter((p) => p.status === 'active')
  const totalHours = weekLogs.reduce((sum, l) => sum + l.hours, 0)
  const hoursByDev = devProfiles.map((dev) => ({
    dev,
    total: weekLogs.filter((l) => l.userId === dev.id).reduce((s, l) => s + l.hours, 0),
  }))

  return (
    <div className="flex flex-col">
      <Topbar title="Dashboard" />
      <div className="p-6 flex flex-col gap-6">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <p className="text-xs mb-2 uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>Horas esta semana</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--color-brand)' }}>{loading ? '—' : formatHours(totalHours)}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-dim)' }}>{getWeekLabel(start)}</p>
          </Card>
          <Card>
            <p className="text-xs mb-2 uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>Projetos ativos</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--color-success)' }}>{loading ? '—' : activeProjects.length}</p>
          </Card>
          <Card>
            <p className="text-xs mb-2 uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>Devs ativos</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--color-brand)' }}>{loading ? '—' : devProfiles.length}</p>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card title="Horas por Dev (semana)">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th className="pb-2 text-left font-medium" style={{ color: 'var(--color-text-dim)' }}>Dev</th>
                  <th className="pb-2 text-right font-medium" style={{ color: 'var(--color-text-dim)' }}>Horas</th>
                </tr>
              </thead>
              <tbody>
                {!loading && hoursByDev.length === 0 && (
                  <tr><td colSpan={2} className="py-4 text-center text-sm" style={{ color: 'var(--color-text-dim)' }}>Sem registros</td></tr>
                )}
                {hoursByDev.map(({ dev, total }) => (
                  <tr key={dev.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="py-2.5" style={{ color: 'var(--color-text)' }}>{dev.name}</td>
                    <td className="py-2.5 text-right font-mono font-semibold" style={{ color: 'var(--color-brand)' }}>{formatHours(total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card title="Projetos">
            <div className="space-y-2.5">
              {projects.slice(0, 8).map((project) => (
                <div key={project.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
                    <span className="text-sm truncate" style={{ color: 'var(--color-text)' }}>{project.name}</span>
                  </div>
                  <StatusBadge status={project.status} />
                </div>
              ))}
              {!loading && projects.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>Nenhum projeto criado.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
