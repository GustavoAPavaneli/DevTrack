'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { ColorBadge } from '@/components/ui/Badge'
import { getAllProfiles, getTimeLogs, getProjects } from '@/lib/firebase/db'
import { getWeekRange, isoWeekDates, formatHours } from '@/lib/utils'
import { useAuth } from '@/components/providers/AuthProvider'
import { type Profile, type Project, type TimeLogWithRelations } from '@/lib/types'

interface DevStats {
  profile: Profile
  weeklyHours: number
  totalHours: number
  activeProjects: Project[]
  recentLogs: TimeLogWithRelations[]
}

export default function DevsPage() {
  const { user } = useAuth()
  const [devStats, setDevStats] = useState<DevStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const [profiles, allLogs, projects] = await Promise.all([
        getAllProfiles(),
        getTimeLogs(),
        getProjects(),
      ])

      const { start } = getWeekRange()
      const dates = isoWeekDates(start)
      const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]))

      const stats: DevStats[] = profiles.map((profile) => {
        const userLogs = allLogs.filter((l) => l.userId === profile.id)
        const weekLogs = userLogs.filter((l) => l.date >= dates[0] && l.date <= dates[6])
        const weeklyHours = weekLogs.reduce((sum, l) => sum + l.hours, 0)
        const totalHours = userLogs.reduce((sum, l) => sum + l.hours, 0)

        const activeProjectIds = [...new Set(weekLogs.map((l) => l.projectId))]
        const activeProjects = activeProjectIds.map((id) => projectMap[id]).filter(Boolean) as Project[]

        return {
          profile,
          weeklyHours,
          totalHours,
          activeProjects,
          recentLogs: userLogs.slice(0, 3),
        }
      })

      // Sort by weekly hours desc
      stats.sort((a, b) => b.weeklyHours - a.weeklyHours)
      setDevStats(stats)
      setLoading(false)
    }
    load()
  }, [user])

  return (
    <div className="flex flex-col">
      <Topbar title="Devs" />
      <div className="p-6 flex flex-col gap-6">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Resumo de atividade da equipe — semana atual e histórico geral.
        </p>

        {loading ? (
          <div className="p-10 text-center text-sm" style={{ color: 'var(--color-text-dim)' }}>Carregando...</div>
        ) : devStats.length === 0 ? (
          <div className="rounded-xl p-10 text-center text-sm" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-dim)' }}>
            Nenhum dev cadastrado ainda.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {devStats.map(({ profile, weeklyHours, totalHours, activeProjects, recentLogs }) => (
              <DevCard
                key={profile.id}
                profile={profile}
                weeklyHours={weeklyHours}
                totalHours={totalHours}
                activeProjects={activeProjects}
                recentLogs={recentLogs}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DevCard({ profile, weeklyHours, totalHours, activeProjects, recentLogs }: Omit<DevStats, 'profile'> & { profile: Profile }) {
  const initials = profile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-5" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={{ backgroundColor: 'var(--color-brand)', color: '#fff' }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>{profile.name}</p>
          <p className="text-xs capitalize" style={{ color: 'var(--color-text-muted)' }}>{profile.role}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 divide-x p-0" style={{ borderBottom: '1px solid var(--color-border)', borderColor: 'var(--color-border)' }}>
        <div className="flex flex-col items-center py-4" style={{ borderRight: '1px solid var(--color-border)' }}>
          <p className="text-xl font-bold" style={{ color: weeklyHours > 0 ? 'var(--color-brand)' : 'var(--color-text-dim)' }}>
            {formatHours(weeklyHours)}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>esta semana</p>
        </div>
        <div className="flex flex-col items-center py-4">
          <p className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{formatHours(totalHours)}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>total geral</p>
        </div>
      </div>

      {/* Active projects this week */}
      <div className="p-4 flex flex-col gap-2" style={{ borderBottom: activeProjects.length > 0 ? '1px solid var(--color-border)' : undefined }}>
        <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>Projetos esta semana</p>
        {activeProjects.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>Sem registros esta semana</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {activeProjects.map((p) => (
              <ColorBadge key={p.id} color={p.color} label={p.name} />
            ))}
          </div>
        )}
      </div>

      {/* Recent logs */}
      {recentLogs.length > 0 && (
        <div className="p-4 flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>Últimas atividades</p>
          <div className="flex flex-col gap-1.5">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2">
                <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: log.projects.color }} />
                <p className="text-xs line-clamp-1" style={{ color: 'var(--color-text-muted)' }}>{log.description}</p>
                <span className="ml-auto flex-shrink-0 text-xs font-mono" style={{ color: 'var(--color-brand)' }}>{formatHours(log.hours)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
