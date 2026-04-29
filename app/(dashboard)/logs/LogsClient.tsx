'use client'

import { useState } from 'react'
import { type TimeLogWithRelations, type Project } from '@/lib/types'
import { createTimeLog, updateTimeLog, deleteTimeLog, getTimeLogs } from '@/lib/firebase/db'
import { useAuth } from '@/components/providers/AuthProvider'
import { LogForm, type LogFormData } from '@/components/logs/LogForm'
import { LogTable } from '@/components/logs/LogTable'
import { Select } from '@/components/ui/Select'

interface LogsClientProps {
  initialLogs: TimeLogWithRelations[]
  projects: Project[]
}

export function LogsClient({ initialLogs, projects }: LogsClientProps) {
  const { user } = useAuth()
  const [logs, setLogs] = useState<TimeLogWithRelations[]>(initialLogs)
  const [editingLog, setEditingLog] = useState<TimeLogWithRelations | null>(null)
  const [projectFilter, setProjectFilter] = useState('all')
  const [error, setError] = useState('')

  async function handleCreate(data: LogFormData) {
    setError('')
    try {
      await createTimeLog({ ...data, userId: user!.uid })
      setLogs(await getTimeLogs())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    }
  }

  async function handleUpdate(data: LogFormData) {
    if (!editingLog) return
    setError('')
    try {
      await updateTimeLog(editingLog.id, data)
      setEditingLog(null)
      setLogs(await getTimeLogs())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao atualizar')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este registro?')) return
    setError('')
    try {
      await deleteTimeLog(id)
      setLogs((prev) => prev.filter((l) => l.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao excluir')
    }
  }

  const projectFilterOptions = [
    { value: 'all', label: 'Todos os projetos' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ]
  const filtered = projectFilter === 'all' ? logs : logs.filter((l) => l.projectId === projectFilter)

  return (
    <div className="p-6 flex flex-col gap-6">
      {error && (
        <p className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: '#ef444415', color: 'var(--color-danger)', border: '1px solid #ef444430' }}>{error}</p>
      )}

      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>
          {editingLog ? 'Editar Registro' : 'Novo Registro'}
        </h3>
        <LogForm projects={projects} log={editingLog ?? undefined} onSubmit={editingLog ? handleUpdate : handleCreate} onCancel={editingLog ? () => setEditingLog(null) : undefined} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>Histórico de todos os devs</h2>
        <div className="w-48">
          <Select options={projectFilterOptions} value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} />
        </div>
      </div>

      <LogTable logs={filtered} currentUserId={user?.uid ?? ''} isAdmin={true} onEdit={setEditingLog} onDelete={handleDelete} />
    </div>
  )
}
