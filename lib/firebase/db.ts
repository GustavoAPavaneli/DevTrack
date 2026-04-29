import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp, setDoc,
} from 'firebase/firestore'
import { db } from './config'
import { type Profile, type Project, type TimeLog, type TimeLogWithRelations } from '@/lib/types'

function toDate(val: unknown): string {
  if (!val) return new Date().toISOString()
  if (val instanceof Timestamp) return val.toDate().toISOString()
  return String(val)
}

function isPermissionError(err: unknown): boolean {
  return (err as { code?: string })?.code === 'permission-denied'
}

// ─── Users / Profiles ───────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<Profile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    if (!snap.exists()) return null
    const data = snap.data()
    return { id: snap.id, ...data, createdAt: toDate(data.createdAt) } as Profile
  } catch (err) {
    if (isPermissionError(err)) return null
    throw err
  }
}

export async function createUserProfile(uid: string, data: Partial<Profile>) {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    role: data.role ?? 'dev',
    createdAt: Timestamp.now(),
  })
}

export async function updateUserProfile(uid: string, data: Partial<Profile>) {
  await updateDoc(doc(db, 'users', uid), data as Record<string, unknown>)
}

export async function getAllProfiles(): Promise<Profile[]> {
  try {
    const snap = await getDocs(collection(db, 'users'))
    return snap.docs.map((d) => {
      const data = d.data()
      return { id: d.id, ...data, createdAt: toDate(data.createdAt) } as Profile
    })
  } catch (err) {
    if (isPermissionError(err)) return []
    throw err
  }
}

// ─── Projects ───────────────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  try {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: toDate((d.data() as Record<string, unknown>).createdAt),
    }) as Project)
  } catch (err) {
    if (isPermissionError(err)) return []
    throw err
  }
}

export async function createProject(data: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
  const ref = await addDoc(collection(db, 'projects'), { ...data, createdAt: Timestamp.now() })
  return { id: ref.id, ...data, createdAt: new Date().toISOString() }
}

export async function updateProject(id: string, data: Partial<Project>) {
  const { id: _, ...rest } = { id, ...data }
  await updateDoc(doc(db, 'projects', id), rest as Record<string, unknown>)
}

export async function deleteProject(id: string) {
  await deleteDoc(doc(db, 'projects', id))
}

// ─── Time Logs ──────────────────────────────────────────────────────────────

async function enrichLogs(logs: TimeLog[]): Promise<TimeLogWithRelations[]> {
  if (logs.length === 0) return []
  const [profiles, projects] = await Promise.all([getAllProfiles(), getProjects()])
  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]))
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]))
  return logs.map((log) => ({
    ...log,
    profiles: { id: log.userId, name: profileMap[log.userId]?.name ?? 'Desconhecido', avatarUrl: profileMap[log.userId]?.avatarUrl },
    projects: {
      id: log.projectId,
      name: projectMap[log.projectId]?.name ?? 'Projeto removido',
      color: projectMap[log.projectId]?.color ?? '#888',
    },
  }))
}

export async function getTimeLogs(userId?: string): Promise<TimeLogWithRelations[]> {
  try {
    const q = userId
      ? query(collection(db, 'timeLogs'), where('userId', '==', userId))
      : query(collection(db, 'timeLogs'), orderBy('date', 'desc'))
    const snap = await getDocs(q)
    const logs = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as TimeLog)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
    return enrichLogs(logs)
  } catch {
    return []
  }
}

export async function getWeeklyLogs(startDate: string, endDate: string): Promise<TimeLogWithRelations[]> {
  try {
    const q = query(
      collection(db, 'timeLogs'),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc'),
    )
    const snap = await getDocs(q)
    const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TimeLog)
    return enrichLogs(logs)
  } catch (err) {
    if (isPermissionError(err)) return []
    throw err
  }
}

export async function createTimeLog(data: Omit<TimeLog, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'timeLogs'), { ...data, createdAt: Timestamp.now() })
  return ref.id
}

export async function updateTimeLog(id: string, data: Partial<TimeLog>) {
  const { id: _, ...rest } = { id, ...data }
  await updateDoc(doc(db, 'timeLogs', id), rest as Record<string, unknown>)
}

export async function deleteTimeLog(id: string) {
  await deleteDoc(doc(db, 'timeLogs', id))
}
