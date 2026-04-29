'use client'

import { useState } from 'react'
import { type Project } from '@/lib/types'
import { createProject, updateProject, deleteProject } from '@/lib/firebase/db'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'

type FormData = { name: string; description?: string; status: 'active' | 'paused' | 'done'; color: string }

interface ProjectsClientProps {
  initialProjects: Project[]
}

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'done', label: 'Concluído' },
]

export function ProjectsClient({ initialProjects }: ProjectsClientProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [error, setError] = useState('')

  async function handleCreate(data: FormData) {
    setError('')
    try {
      const created = await createProject(data)
      setProjects((prev) => [created, ...prev])
      setShowForm(false)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erro') }
  }

  async function handleUpdate(data: FormData) {
    if (!editingProject) return
    setError('')
    try {
      await updateProject(editingProject.id, data)
      setProjects((prev) => prev.map((p) => p.id === editingProject.id ? { ...editingProject, ...data } : p))
      setEditingProject(null)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erro') }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este projeto?')) return
    setError('')
    try {
      await deleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erro') }
  }

  const filtered = statusFilter === 'all' ? projects : projects.filter((p) => p.status === statusFilter)

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="w-40">
          <Select options={STATUS_FILTER_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        </div>
        <Button onClick={() => setShowForm(true)}>+ Novo Projeto</Button>
      </div>

      {error && (
        <p className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: '#ef444415', color: 'var(--color-danger)', border: '1px solid #ef444430' }}>{error}</p>
      )}

      {(showForm || editingProject) && (
        <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <h3 className="mb-4 font-semibold" style={{ color: 'var(--color-text)' }}>{editingProject ? 'Editar Projeto' : 'Novo Projeto'}</h3>
          <ProjectForm project={editingProject ?? undefined} onSubmit={editingProject ? handleUpdate : handleCreate} onCancel={() => { setShowForm(false); setEditingProject(null) }} />
        </div>
      )}

      {filtered.length === 0 && (
        <div className="rounded-xl p-10 text-center text-sm" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-dim)' }}>Nenhum projeto encontrado.</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((project) => (
          <ProjectCard key={project.id} project={project} isAdmin={true} onEdit={setEditingProject} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  )
}
