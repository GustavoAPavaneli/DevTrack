'use client'

import { type TimeLogWithRelations } from '@/lib/types'
import { ColorBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate, formatHours } from '@/lib/utils'

interface LogTableProps {
  logs: TimeLogWithRelations[]
  currentUserId: string
  isAdmin: boolean
  onEdit?: (log: TimeLogWithRelations) => void
  onDelete?: (id: string) => void
}

export function LogTable({ logs, currentUserId, isAdmin, onEdit, onDelete }: LogTableProps) {
  if (logs.length === 0) {
    return (
      <div className="rounded-xl p-10 text-center text-sm" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-dim)' }}>
        Nenhum registro encontrado.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--color-border)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--color-text-dim)' }}>Data</th>
            {isAdmin && <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--color-text-dim)' }}>Dev</th>}
            <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--color-text-dim)' }}>Projeto</th>
            <th className="px-4 py-3 text-right font-medium" style={{ color: 'var(--color-text-dim)' }}>Horas</th>
            <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--color-text-dim)' }}>Descrição</th>
            <th className="px-4 py-3 text-right font-medium" style={{ color: 'var(--color-text-dim)' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const canEdit = isAdmin || log.userId === currentUserId
            return (
              <tr
                key={log.id}
                style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface)')}
              >
                <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>{formatDate(log.date)}</td>
                {isAdmin && <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{log.profiles.name}</td>}
                <td className="px-4 py-3"><ColorBadge color={log.projects.color} label={log.projects.name} /></td>
                <td className="px-4 py-3 text-right font-mono font-semibold" style={{ color: 'var(--color-brand)' }}>{formatHours(log.hours)}</td>
                <td className="px-4 py-3 max-w-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{log.description}</td>
                <td className="px-4 py-3 text-right">
                  {canEdit && (
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => onEdit?.(log)}>Editar</Button>
                      <Button variant="danger" size="sm" onClick={() => onDelete?.(log.id)}>Excluir</Button>
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
