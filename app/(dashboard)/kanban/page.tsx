import { Topbar } from '@/components/layout/Topbar'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'

export default function KanbanPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <Topbar title="Kanban" />
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <KanbanBoard />
      </div>
    </div>
  )
}
