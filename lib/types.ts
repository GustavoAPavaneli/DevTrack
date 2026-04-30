export type UserRole = 'admin' | 'dev'
export type ProjectStatus = 'active' | 'paused' | 'done'

export interface Profile {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
  createdAt: string
}

export interface Project {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  color: string
  createdAt: string
}

export interface TimeLog {
  id: string
  userId: string
  projectId: string
  date: string        // YYYY-MM-DD
  hours: number
  description: string
  createdAt: string
}

export interface TimeLogWithRelations extends TimeLog {
  profiles: { id: string; name: string; avatarUrl?: string }
  projects: { id: string; name: string; color: string }
}

export interface WeeklyDevSummary {
  userId: string
  name: string
  avatarUrl?: string
  totalHours: number
  logs: TimeLogWithRelations[]
}

export interface KanbanCard {
  id: string
  title: string
  description?: string
  tag?: string
  priority?: 'low' | 'medium' | 'high'
  columnId: string
  order: number
  createdAt: string
}

export interface KanbanColumn {
  id: string
  title: string
  color: string
  order: number
  createdAt: string
}
