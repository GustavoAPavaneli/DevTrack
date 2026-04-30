import {
  collection, doc, addDoc, deleteDoc, onSnapshot,
  query, orderBy, Timestamp, writeBatch,
} from 'firebase/firestore'
import { db } from './config'
import { type KanbanCard, type KanbanColumn } from '@/lib/types'

export const KANBAN_COLUMNS = [
  { id: 'backlog',     title: 'Backlog',      color: '#555555' },
  { id: 'todo',        title: 'A Fazer',      color: '#888888' },
  { id: 'in-progress', title: 'Em Progresso', color: '#F4511E' },
  { id: 'review',      title: 'Em Revisão',   color: '#f59e0b' },
  { id: 'done',        title: 'Concluído',    color: '#22c55e' },
] as const

export type ColumnId = typeof KANBAN_COLUMNS[number]['id']

function docToCard(d: { id: string; data: () => Record<string, unknown> }): KanbanCard {
  const data = d.data()
  return {
    id: d.id,
    title: (data.title as string) ?? '',
    description: data.description as string | undefined,
    tag: data.tag as string | undefined,
    priority: data.priority as KanbanCard['priority'] | undefined,
    columnId: (data.columnId as string) ?? 'backlog',
    order: (data.order as number) ?? 0,
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : new Date().toISOString(),
  }
}

export function subscribeToKanbanCards(
  onData: (cards: KanbanCard[]) => void,
  onError: (err: Error) => void,
): () => void {
  const q = query(collection(db, 'kanbanCards'), orderBy('order', 'asc'))
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map(d => docToCard(d as Parameters<typeof docToCard>[0])))
  }, (err) => onError(err as Error))
}

export async function addKanbanCard(
  data: Pick<KanbanCard, 'title' | 'columnId' | 'order'> & Partial<Pick<KanbanCard, 'description' | 'tag' | 'priority'>>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'kanbanCards'), {
    ...data,
    createdAt: Timestamp.now(),
  })
  return ref.id
}

export async function deleteKanbanCard(id: string): Promise<void> {
  await deleteDoc(doc(db, 'kanbanCards', id))
}

export async function batchMoveCards(
  updates: { id: string; columnId: string; order: number }[],
): Promise<void> {
  if (updates.length === 0) return
  const batch = writeBatch(db)
  for (const { id, columnId, order } of updates) {
    batch.update(doc(db, 'kanbanCards', id), { columnId, order })
  }
  await batch.commit()
}

// ─── Custom Columns ───────────────────────────────────────────────────────────

export function subscribeToCustomColumns(
  onData: (columns: KanbanColumn[]) => void,
  onError: (err: Error) => void,
): () => void {
  const q = query(collection(db, 'kanbanColumns'), orderBy('order', 'asc'))
  return onSnapshot(q, (snap) => {
    const cols = snap.docs.map(d => {
      const data = d.data()
      return {
        id: d.id,
        title: (data.title as string) ?? 'Nova coluna',
        color: (data.color as string) ?? '#888888',
        order: (data.order as number) ?? 0,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : new Date().toISOString(),
      } as KanbanColumn
    })
    onData(cols)
  }, (err) => onError(err as Error))
}

export async function addKanbanColumn(
  data: Pick<KanbanColumn, 'title' | 'color' | 'order'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'kanbanColumns'), {
    ...data,
    createdAt: Timestamp.now(),
  })
  return ref.id
}

export async function deleteKanbanColumn(id: string): Promise<void> {
  await deleteDoc(doc(db, 'kanbanColumns', id))
}
