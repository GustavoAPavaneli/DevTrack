'use client'

import { useState } from 'react'
import { type TimeLogWithRelations, type Project } from '@/lib/types'
import { deleteTimeLog } from '@/lib/firebase/db'
import { HoursChart } from '@/components/reports/HoursChart'
import { LogTable } from '@/components/logs/LogTable'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { formatHours } from '@/lib/utils'

interface DayData { day: string; hours: number }
interface MyPanelClientProps {
  userId: string
  logs: TimeLogWithRelations[]
  projects: Project[]
  weeklyHours: number
  chartData: DayData[]
}

export function MyPanelClient({ userId, logs: initialLogs, projects, weeklyHours, chartData }: MyPanelClientProps) {
  const [logs, setLogs] = useState<TimeLogWithRelations[]>(initialLogs)
  const [projectFilter, setProjectFilter] = useState('all')

  async function handleDelete(id: string) {
    if (!confirm('Excluir este registro?')) return
    await deleteTimeLog(id)
    setLogs((prev) => prev.filter((l) => l.id !== id))
  }

  const projectOptions = [
    { value: 'all', label: 'Todos os projetos' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ]
  const filtered = projectFilter === 'all' ? logs : logs.filter((l) => l.projectId === projectFilter)

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <p className="text-xs mb-2 uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>Horas esta semana</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--color-brand)' }}>{formatHours(weeklyHours)}</p>
        </Card>
        <Card>
          <p className="text-xs mb-2 uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>Total de registros</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>{logs.length}</p>
        </Card>
      </div>
      <Card title="Horas por dia (semana atual)">
        <HoursChart data={chartData} />
      </Card>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>Meus Registros</h2>
        <div className="w-48">
          <Select options={projectOptions} value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} />
        </div>
      </div>
      <LogTable logs={filtered} currentUserId={userId} isAdmin={true} onDelete={handleDelete} />
    </div>
  )
}
