'use client'

import { type WeeklyDevSummary } from '@/lib/types'
import { ColorBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { formatHours, downloadCsv, formatDate } from '@/lib/utils'

interface WeeklyReportProps {
  summaries: WeeklyDevSummary[]
  weekLabel: string
}

export function WeeklyReport({ summaries, weekLabel }: WeeklyReportProps) {
  function handleExport() {
    const rows: string[][] = [['Dev', 'Projeto', 'Data', 'Horas', 'Descrição']]
    for (const s of summaries) {
      for (const log of s.logs) {
        rows.push([s.name, log.projects.name, formatDate(log.date), String(log.hours), log.description])
      }
    }
    downloadCsv(`crably-semana-${weekLabel.replace(/\s/g, '')}.csv`, rows)
  }

  const grandTotal = summaries.reduce((sum, s) => sum + s.totalHours, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Total geral:{' '}
          <span className="font-semibold" style={{ color: 'var(--color-brand)' }}>{formatHours(grandTotal)}</span>
        </p>
        <Button variant="secondary" size="sm" onClick={handleExport}>Exportar CSV</Button>
      </div>

      {summaries.length === 0 && (
        <div className="rounded-xl p-10 text-center text-sm" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-dim)' }}>
          Nenhum registro na semana selecionada.
        </div>
      )}

      {summaries.map((dev) => (
        <div key={dev.userId} className="overflow-hidden rounded-xl" style={{ border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between px-5 py-3" style={{ backgroundColor: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-3">
              <Avatar name={dev.name} avatarUrl={dev.avatarUrl} size={32} />
              <span className="font-medium" style={{ color: 'var(--color-text)' }}>{dev.name}</span>
            </div>
            <span className="font-mono font-semibold" style={{ color: 'var(--color-brand)' }}>{formatHours(dev.totalHours)}</span>
          </div>
          <div style={{ backgroundColor: 'var(--color-surface)' }}>
            {dev.logs.map((log) => (
              <div key={log.id} className="flex gap-4 px-5 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <span className="w-24 flex-shrink-0 text-xs" style={{ color: 'var(--color-text-dim)' }}>{formatDate(log.date)}</span>
                <ColorBadge color={log.projects.color} label={log.projects.name} className="flex-shrink-0" />
                <span className="flex-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>{log.description}</span>
                <span className="flex-shrink-0 font-mono text-sm" style={{ color: 'var(--color-text)' }}>{formatHours(log.hours)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
