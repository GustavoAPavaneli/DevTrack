'use client'

import { useState, useRef, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ─── Types ───────────────────────────────────────────────────────────────────

interface KanbanCard {
  id: string
  title: string
  description?: string
  tag?: string
  priority?: 'low' | 'medium' | 'high'
}

interface KanbanColumn {
  id: string
  title: string
  color: string
  cards: KanbanCard[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_COLUMNS: KanbanColumn[] = [
  {
    id: 'backlog',
    title: 'Backlog',
    color: '#555555',
    cards: [
      { id: 'c1', title: 'Pesquisa de UX', description: 'Entrevistar usuários e mapear fluxos', tag: 'Design', priority: 'low' },
      { id: 'c2', title: 'Configurar CI/CD', description: 'Pipeline de deploy automatizado', tag: 'Infra', priority: 'medium' },
      { id: 'c3', title: 'Documentar API', description: 'Swagger + exemplos de uso', tag: 'Docs', priority: 'low' },
    ],
  },
  {
    id: 'todo',
    title: 'A Fazer',
    color: '#888888',
    cards: [
      { id: 'c4', title: 'Implementar autenticação', description: 'OAuth2 com Google e GitHub', tag: 'Backend', priority: 'high' },
      { id: 'c5', title: 'Design do dashboard', tag: 'Frontend', priority: 'medium' },
    ],
  },
  {
    id: 'in-progress',
    title: 'Em Progresso',
    color: '#F4511E',
    cards: [
      { id: 'c6', title: 'Refatorar módulo de logs', description: 'Melhorar performance das queries', tag: 'Backend', priority: 'high' },
      { id: 'c7', title: 'Kanban board', description: 'Arrastar cards entre colunas', tag: 'Frontend', priority: 'high' },
    ],
  },
  {
    id: 'review',
    title: 'Em Revisão',
    color: '#f59e0b',
    cards: [
      { id: 'c8', title: 'Relatórios semanais', description: 'Code review pendente', tag: 'Frontend', priority: 'medium' },
    ],
  },
  {
    id: 'done',
    title: 'Concluído',
    color: '#22c55e',
    cards: [
      { id: 'c9', title: 'Setup inicial do projeto', tag: 'Infra', priority: 'low' },
      { id: 'c10', title: 'Configurar Firebase', description: 'Auth + Firestore + Storage', tag: 'Backend', priority: 'medium' },
    ],
  },
]

const TAG_COLORS: Record<string, string> = {
  Frontend:  '#3b82f6',
  Backend:   '#8b5cf6',
  Design:    '#ec4899',
  Infra:     '#14b8a6',
  Docs:      '#6b7280',
  Geral:     '#F4511E',
}

const PRIORITY_COLORS = { low: '#555555', medium: '#f59e0b', high: '#ef4444' }
const PRIORITY_LABELS = { low: 'Baixa', medium: 'Média', high: 'Alta' }

const COLUMN_COLORS = ['#F4511E', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#22c55e', '#f59e0b', '#888888']

let nextId = 100

function uid() {
  return `item-${++nextId}-${Math.random().toString(36).slice(2, 7)}`
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findColumnOfCard(cols: KanbanColumn[], cardId: string): KanbanColumn | undefined {
  return cols.find(col => col.cards.some(c => c.id === cardId))
}

function findColumn(cols: KanbanColumn[], id: string): KanbanColumn | undefined {
  const col = cols.find(c => c.id === id)
  if (col) return col
  return findColumnOfCard(cols, id)
}

// ─── Card (sortable) ──────────────────────────────────────────────────────────

function SortableCard({ card, isDragOverlay = false }: { card: KanbanCard; isDragOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    opacity: isDragging ? 0 : 1,
    cursor: isDragOverlay ? 'grabbing' : 'grab',
    rotate: isDragOverlay ? '2deg' : '0deg',
    scale: isDragOverlay ? '1.03' : '1',
    boxShadow: isDragOverlay
      ? '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(244,81,30,0.3)'
      : '0 1px 3px rgba(0,0,0,0.3)',
  }

  const tagColor = card.tag ? (TAG_COLORS[card.tag] ?? '#555') : undefined

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: 'var(--color-surface-2)',
        border: '1px solid var(--color-border-2)',
        borderRadius: 10,
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        userSelect: 'none',
        willChange: 'transform',
      }}
      {...attributes}
      {...listeners}
    >
      {/* Top row: tag + priority */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        {card.tag && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: tagColor,
              backgroundColor: tagColor ? `${tagColor}22` : undefined,
              border: `1px solid ${tagColor}44`,
              borderRadius: 4,
              padding: '1px 6px',
            }}
          >
            {card.tag}
          </span>
        )}
        {card.priority && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: PRIORITY_COLORS[card.priority], flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'var(--color-text-dim)' }}>{PRIORITY_LABELS[card.priority]}</span>
          </div>
        )}
      </div>

      {/* Title */}
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.35, margin: 0 }}>
        {card.title}
      </p>

      {/* Description */}
      {card.description && (
        <p style={{ fontSize: 11.5, color: 'var(--color-text-muted)', lineHeight: 1.4, margin: 0 }}>
          {card.description}
        </p>
      )}
    </div>
  )
}

// ─── Column ───────────────────────────────────────────────────────────────────

function KanbanColumnItem({
  column,
  onAddCard,
  onDeleteColumn,
}: {
  column: KanbanColumn
  onAddCard: (columnId: string, title: string) => void
  onDeleteColumn: (columnId: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [hovered, setHovered] = useState(false)

  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  function handleAddCard() {
    if (newTitle.trim()) {
      onAddCard(column.id, newTitle.trim())
    }
    setNewTitle('')
    setAdding(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAddCard()
    if (e.key === 'Escape') { setAdding(false); setNewTitle('') }
  }

  function openAdding() {
    setAdding(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const cardIds = column.cards.map(c => c.id)

  return (
    <div
      style={{
        width: 272,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        borderRadius: 14,
        backgroundColor: 'var(--color-surface)',
        border: `1px solid ${isOver ? column.color + '66' : 'var(--color-border)'}`,
        boxShadow: isOver ? `0 0 0 2px ${column.color}33` : 'none',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
        overflow: 'hidden',
      }}
    >
      {/* Column header */}
      <div
        style={{
          padding: '12px 14px 10px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: column.color, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {column.title}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: column.color,
              backgroundColor: `${column.color}22`,
              border: `1px solid ${column.color}44`,
              borderRadius: 20,
              padding: '0px 7px',
              minWidth: 20,
              textAlign: 'center',
            }}
          >
            {column.cards.length}
          </span>
        </div>

        <button
          onClick={() => onDeleteColumn(column.id)}
          style={{
            opacity: hovered ? 0.4 : 0,
            transition: 'opacity 150ms ease',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-dim)',
            padding: '2px 4px',
            borderRadius: 4,
            fontSize: 14,
            lineHeight: 1,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = hovered ? '0.4' : '0'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-dim)' }}
          title="Remover coluna"
        >
          ×
        </button>
      </div>

      {/* Cards area */}
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: '10px 10px',
            minHeight: 80,
            transition: 'background-color 150ms ease',
            backgroundColor: isOver ? `${column.color}08` : 'transparent',
          }}
        >
          {column.cards.map(card => (
            <SortableCard key={card.id} card={card} />
          ))}

          {column.cards.length === 0 && !adding && (
            <div
              style={{
                flex: 1,
                minHeight: 60,
                border: `2px dashed ${isOver ? column.color + '55' : 'var(--color-border)'}`,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'border-color 150ms ease',
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>Arraste um card aqui</span>
            </div>
          )}
        </div>
      </SortableContext>

      {/* Add card */}
      <div style={{ padding: '0 10px 10px' }}>
        {adding ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              ref={inputRef}
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Título do card..."
              style={{
                width: '100%',
                padding: '8px 10px',
                backgroundColor: 'var(--color-surface-3)',
                border: `1px solid ${column.color}55`,
                borderRadius: 8,
                color: 'var(--color-text)',
                fontSize: 13,
                outline: 'none',
                boxShadow: `0 0 0 2px ${column.color}22`,
              }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleAddCard}
                style={{
                  flex: 1,
                  padding: '6px',
                  backgroundColor: column.color,
                  border: 'none',
                  borderRadius: 7,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'opacity 150ms',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
              >
                Adicionar
              </button>
              <button
                onClick={() => { setAdding(false); setNewTitle('') }}
                style={{
                  padding: '6px 10px',
                  backgroundColor: 'var(--color-surface-3)',
                  border: '1px solid var(--color-border-2)',
                  borderRadius: 7,
                  color: 'var(--color-text-muted)',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={openAdding}
            style={{
              width: '100%',
              padding: '7px',
              backgroundColor: 'transparent',
              border: '1px dashed var(--color-border-2)',
              borderRadius: 8,
              color: 'var(--color-text-dim)',
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              transition: 'border-color 150ms ease, color 150ms ease',
            }}
            onMouseEnter={e => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.borderColor = column.color
              b.style.color = column.color
            }}
            onMouseLeave={e => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.borderColor = 'var(--color-border-2)'
              b.style.color = 'var(--color-text-dim)'
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> Adicionar card
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Add Column Form ──────────────────────────────────────────────────────────

function AddColumnForm({ onAdd }: { onAdd: (title: string, color: string) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [colorIdx, setColorIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleAdd() {
    if (title.trim()) {
      onAdd(title.trim(), COLUMN_COLORS[colorIdx % COLUMN_COLORS.length])
    }
    setTitle('')
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') { setOpen(false); setTitle('') }
  }

  function handleOpen() {
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        style={{
          width: 200,
          flexShrink: 0,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: 'var(--color-surface)',
          border: '1px dashed var(--color-border-2)',
          borderRadius: 14,
          color: 'var(--color-text-dim)',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'border-color 200ms ease, color 200ms ease, background-color 200ms ease',
          alignSelf: 'flex-start',
        }}
        onMouseEnter={e => {
          const b = e.currentTarget as HTMLButtonElement
          b.style.borderColor = 'var(--color-brand)'
          b.style.color = 'var(--color-brand)'
          b.style.backgroundColor = 'var(--color-brand-muted)'
        }}
        onMouseLeave={e => {
          const b = e.currentTarget as HTMLButtonElement
          b.style.borderColor = 'var(--color-border-2)'
          b.style.color = 'var(--color-text-dim)'
          b.style.backgroundColor = 'var(--color-surface)'
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1, marginBottom: 1 }}>+</span>
        Nova categoria
      </button>
    )
  }

  return (
    <div
      style={{
        width: 240,
        flexShrink: 0,
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border-2)',
        borderRadius: 14,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        alignSelf: 'flex-start',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Nova categoria
      </p>

      <input
        ref={inputRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nome da categoria..."
        style={{
          width: '100%',
          padding: '8px 10px',
          backgroundColor: 'var(--color-surface-2)',
          border: '1px solid var(--color-border-2)',
          borderRadius: 8,
          color: 'var(--color-text)',
          fontSize: 13,
          outline: 'none',
        }}
      />

      <div>
        <p style={{ fontSize: 11, color: 'var(--color-text-dim)', marginBottom: 6 }}>Cor</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {COLUMN_COLORS.map((c, i) => (
            <button
              key={c}
              onClick={() => setColorIdx(i)}
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: c,
                border: colorIdx === i ? `2px solid #fff` : '2px solid transparent',
                outline: colorIdx === i ? `2px solid ${c}` : 'none',
                outlineOffset: 1,
                cursor: 'pointer',
                padding: 0,
                transition: 'transform 100ms ease',
                transform: colorIdx === i ? 'scale(1.2)' : 'scale(1)',
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={handleAdd}
          style={{
            flex: 1,
            padding: '7px',
            backgroundColor: COLUMN_COLORS[colorIdx % COLUMN_COLORS.length],
            border: 'none',
            borderRadius: 7,
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 150ms',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
        >
          Criar
        </button>
        <button
          onClick={() => { setOpen(false); setTitle('') }}
          style={{
            padding: '7px 12px',
            backgroundColor: 'var(--color-surface-3)',
            border: '1px solid var(--color-border-2)',
            borderRadius: 7,
            color: 'var(--color-text-muted)',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─── Main Board ───────────────────────────────────────────────────────────────

export function KanbanBoard() {
  const [columns, setColumns] = useState<KanbanColumn[]>(INITIAL_COLUMNS)
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string
    for (const col of columns) {
      const card = col.cards.find(c => c.id === id)
      if (card) { setActiveCard(card); return }
    }
  }, [columns])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    if (activeId === overId) return

    setColumns(prev => {
      const activeCol = findColumnOfCard(prev, activeId)
      const overCol = findColumn(prev, overId)
      if (!activeCol || !overCol || activeCol.id === overCol.id) return prev

      const card = activeCol.cards.find(c => c.id === activeId)!
      const overCardIdx = overCol.cards.findIndex(c => c.id === overId)
      const insertAt = overCardIdx >= 0 ? overCardIdx : overCol.cards.length

      return prev.map(col => {
        if (col.id === activeCol.id) {
          return { ...col, cards: col.cards.filter(c => c.id !== activeId) }
        }
        if (col.id === overCol.id) {
          const next = [...col.cards]
          next.splice(insertAt, 0, card)
          return { ...col, cards: next }
        }
        return col
      })
    })
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    if (activeId === overId) return

    setColumns(prev => {
      const activeCol = findColumnOfCard(prev, activeId)
      if (!activeCol) return prev
      const overCol = findColumn(prev, overId)
      if (!overCol || activeCol.id !== overCol.id) return prev

      const oldIdx = activeCol.cards.findIndex(c => c.id === activeId)
      const newIdx = activeCol.cards.findIndex(c => c.id === overId)
      if (oldIdx === newIdx) return prev

      return prev.map(col =>
        col.id === activeCol.id
          ? { ...col, cards: arrayMove(col.cards, oldIdx, newIdx) }
          : col
      )
    })
  }, [])

  const handleAddCard = useCallback((columnId: string, title: string) => {
    setColumns(prev => prev.map(col =>
      col.id === columnId
        ? { ...col, cards: [...col.cards, { id: uid(), title }] }
        : col
    ))
  }, [])

  const handleAddColumn = useCallback((title: string, color: string) => {
    setColumns(prev => [...prev, { id: uid(), title, color, cards: [] }])
  }, [])

  const handleDeleteColumn = useCallback((columnId: string) => {
    setColumns(prev => prev.filter(c => c.id !== columnId))
  }, [])

  const totalCards = columns.reduce((sum, c) => sum + c.cards.length, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Board stats bar */}
      <div
        style={{
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {columns.map(col => (
            <div
              key={col.id}
              title={`${col.title}: ${col.cards.length} cards`}
              style={{
                height: 4,
                flex: col.cards.length || 0.5,
                backgroundColor: col.color,
                borderRadius: 99,
                transition: 'flex 400ms cubic-bezier(0.25, 1, 0.5, 1)',
                opacity: 0.7,
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: 12, color: 'var(--color-text-dim)', flexShrink: 0 }}>
          {totalCards} cards · {columns.length} categorias
        </span>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          style={{
            flex: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
            padding: '20px 24px',
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start',
          }}
        >
          {columns.map(col => (
            <KanbanColumnItem
              key={col.id}
              column={col}
              onAddCard={handleAddCard}
              onDeleteColumn={handleDeleteColumn}
            />
          ))}

          <AddColumnForm onAdd={handleAddColumn} />
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeCard && <SortableCard card={activeCard} isDragOverlay />}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
