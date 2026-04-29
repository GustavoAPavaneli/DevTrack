'use client'

import { useState } from 'react'
import { type WeeklyDevSummary, type TimeLogWithRelations } from '@/lib/types'
import { getWeeklyLogs } from '@/lib/firebase/db'
import { WeeklyReport } from '@/components/reports/WeeklyReport'
import { Button } from '@/components/ui/Button'
import { getWeekRange, getWeekLabel, isoWeekDates } from '@/lib/utils'
import { buildSummaries } from './page'

interface ReportsClientProps {
  initialSummaries: WeeklyDevSummary[]
  weekLabel: string
}

export function ReportsClient({ initialSummaries, weekLabel }: ReportsClientProps) {
  const [summaries, setSummaries] = useState<WeeklyDevSummary[]>(initialSummaries)
  const [currentWeekLabel, setCurrentWeekLabel] = useState(weekLabel)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekRange().start)
  const [loading, setLoading] = useState(false)

  async function fetchWeek(weekStart: Date) {
    setLoading(true)
    const dates = isoWeekDates(weekStart)
    const logs = await getWeeklyLogs(dates[0], dates[6])
    setSummaries(buildSummaries(logs))
    setCurrentWeekLabel(getWeekLabel(weekStart))
    setLoading(false)
  }

  function navigate(direction: -1 | 1) {
    const d = new Date(currentWeekStart)
    d.setDate(d.getDate() + direction * 7)
    setCurrentWeekStart(d)
    fetchWeek(d)
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" size="sm" onClick={() => navigate(-1)} disabled={loading}>← Anterior</Button>
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>{currentWeekLabel}</span>
        <Button variant="secondary" size="sm" onClick={() => navigate(1)} disabled={loading}>Próxima →</Button>
      </div>
      {loading ? (
        <div className="py-10 text-center text-sm" style={{ color: 'var(--color-text-dim)' }}>Carregando...</div>
      ) : (
        <WeeklyReport summaries={summaries} weekLabel={currentWeekLabel} />
      )}
    </div>
  )
}
