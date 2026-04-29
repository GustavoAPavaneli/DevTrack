'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { ProjectsClient } from './ProjectsClient'
import { getProjects } from '@/lib/firebase/db'
import { type Project } from '@/lib/types'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProjects().then((p) => { setProjects(p); setLoading(false) })
  }, [])

  return (
    <div className="flex flex-col">
      <Topbar title="Projetos" />
      {loading ? (
        <div className="p-10 text-center text-sm" style={{ color: 'var(--color-text-dim)' }}>Carregando...</div>
      ) : (
        <ProjectsClient initialProjects={projects} />
      )}
    </div>
  )
}
