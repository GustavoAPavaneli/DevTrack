'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { ReportsClient } from './ReportsClient'
import { getWeeklyLogs } from '@/lib/firebase/db'
import { getWeekRange, getWeekLabel, isoWeekDates } from '@/lib/utils'
import { type TimeLogWithRelations, type WeeklyDevSummary } from '@/lib/types'

export default function ReportsPage() {
  const [summaries, setSummaries] = useState<WeeklyDevSummary[]>([])
  const [weekLabel, setWeekLabel] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { start } = getWeekRange()
    const dates = isoWeekDates(start)
    setWeekLabel(getWeekLabel(start))
    getWeeklyLogs(dates[0], dates[6]).then((logs) => {
      setSummaries(buildSummaries(logs))
      setLoading(false)
    })
  }, [])

  return (
    <div className="flex flex-col">
      <Topbar title="Relatório Semanal" />
      {loading ? (
        <div className="p-10 text-center text-sm" style={{ color: 'var(--color-text-dim)' }}>Carregando...</div>
      ) : (
        <ReportsClient initialSummaries={summaries} weekLabel={weekLabel} />
      )}
    </div>
  )
}

export function buildSummaries(logs: TimeLogWithRelations[]): WeeklyDevSummary[] {
  const grouped: Record<string, WeeklyDevSummary> = {}
  for (const log of logs) {
    if (!grouped[log.userId]) {
      grouped[log.userId] = { userId: log.userId, name: log.profiles.name, totalHours: 0, logs: [] }
    }
    grouped[log.userId].totalHours += log.hours
    grouped[log.userId].logs.push(log)
  }
  return Object.values(grouped)
}
