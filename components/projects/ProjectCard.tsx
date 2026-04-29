'use client'

import { type Project } from '@/lib/types'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface ProjectCardProps {
  project: Project
  memberCount?: number
  onEdit?: (project: Project) => void
  onDelete?: (id: string) => void
  isAdmin: boolean
}

export function ProjectCard({ project, memberCount = 0, onEdit, onDelete, isAdmin }: ProjectCardProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-xl p-5 transition-colors"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-2)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
          <h3 className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>{project.name}</h3>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {project.description && (
        <p className="text-sm line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>{project.description}</p>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
          {memberCount} {memberCount === 1 ? 'dev' : 'devs'}
        </span>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit?.(project)}>Editar</Button>
            <Button variant="danger" size="sm" onClick={() => onDelete?.(project.id)}>Excluir</Button>
          </div>
        )}
      </div>
    </div>
  )
}
