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
  profiles: { id: string; name: string }
  projects: { id: string; name: string; color: string }
}

export interface WeeklyDevSummary {
  userId: string
  name: string
  totalHours: number
  logs: TimeLogWithRelations[]
}
