import { type HTMLAttributes } from 'react'
import { type ProjectStatus } from '@/lib/types'

const statusConfig: Record<ProjectStatus, { label: string; bg: string; color: string; border: string }> = {
  active: { label: 'Ativo',     bg: '#16a34a20', color: '#4ade80', border: '#16a34a40' },
  paused: { label: 'Pausado',   bg: '#d9770620', color: '#fb923c', border: '#d9770640' },
  done:   { label: 'Concluído', bg: '#ffffff10', color: '#888888', border: '#ffffff20' },
}

interface StatusBadgeProps {
  status: ProjectStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, bg, color, border } = statusConfig[status]
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: bg, color, border: `1px solid ${border}` }}
    >
      {label}
    </span>
  )
}

interface ColorBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color: string
  label: string
}

export function ColorBadge({ color, label, className = '', style, ...props }: ColorBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
      style={{
        backgroundColor: `${color}20`,
        color,
        border: `1px solid ${color}40`,
        ...style,
      }}
      {...props}
    >
      <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}
