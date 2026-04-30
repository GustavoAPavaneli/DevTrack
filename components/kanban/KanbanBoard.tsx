'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
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
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  KANBAN_COLUMNS,
  subscribeToKanbanCards,
  subscribeToCustomColumns,
  addKanbanCard,
  deleteKanbanCard,
  addKanbanColumn,
  deleteKanbanColumn,
  batchMoveCards,
} from '@/lib/firebase/kanban'
import { type KanbanCard, type KanbanColumn } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const TAG_COLORS: Record<string, string> = {
  Frontend: '#3b82f6',
  Backend:  '#8b5cf6',
  Design:   '#ec4899',
  Infra:    '#14b8a6',
  Docs:     '#6b7280',
  Bug:      '#ef4444',
  Geral:    '#F4511E',
}

const PRIORITY_COLORS = { low: '#555555', medium: '#f59e0b', high: '#ef4444' }
const PRIORITY_LABELS = { low: 'Baixa', medium: 'Média', high: 'Alta' }

const COLUMN_ID_SET: Set<string> = new Set(KANBAN_COLUMNS.map(c => c.id))

const PICKER_COLORS = ['#F4511E', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#22c55e', '#f59e0b', '#888888', '#ef4444', '#06b6d4']

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Applies a drag move to the flat cards array.
 * Handles both within-column reorder and cross-column moves.
 */
function applyMove(cards: KanbanCard[], activeId: string, overId: string): KanbanCard[] {
  const active = cards.find(c => c.id === activeId)
  if (!active) return cards

  const isOverCol = COLUMN_ID_SET.has(overId)
  const targetColId = isOverCol
    ? overId
    : (cards.find(c => c.id === overId)?.columnId ?? active.columnId)

  // Hovering the column header without crossing into a new position — skip
  if (active.columnId === targetColId && isOverCol) return cards

  // Cards in target column, sorted, excluding active
  const targetOthers = cards
    .filter(c => c.columnId === targetColId && c.id !== activeId)
    .sort((a, b) => a.order - b.order)

  const overIdx = isOverCol ? -1 : targetOthers.findIndex(c => c.id === overId)
  const insertAt = overIdx >= 0 ? overIdx : targetOthers.length

  const newTarget = [...targetOthers]
  newTarget.splice(insertAt, 0, { ...active, columnId: targetColId })

  const targetMap = new Map(newTarget.map((c, i) => [c.id, { ...c, order: i * 1000 }]))

  const sourceMap = new Map<string, KanbanCard>()
  if (active.columnId !== targetColId) {
    cards
      .filter(c => c.columnId === active.columnId && c.id !== activeId)
      .sort((a, b) => a.order - b.order)
      .forEach((c, i) => sourceMap.set(c.id, { ...c, order: i * 1000 }))
  }

  return cards.map(c => targetMap.get(c.id) ?? sourceMap.get(c.id) ?? c)
}

// ─── Card (sortable) ──────────────────────────────────────────────────────────

function SortableCard({
  card,
  onDelete,
  isDragOverlay = false,
}: {
  card: KanbanCard
  onDelete?: (id: string) => void
  isDragOverlay?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })
  const [hovered, setHovered] = useState(false)

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    opacity: isDragging ? 0 : 1,
    cursor: isDragOverlay ? 'grabbing' : 'grab',
    rotate: isDragOverlay ? '2deg' : '0deg',
    scale: isDragOverlay ? '1.03' : '1',
    boxShadow: isDragOverlay
      ? '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(244,81,30,0.35)'
      : '0 1px 3px rgba(0,0,0,0.3)',
    backgroundColor: 'var(--color-surface-2)',
    border: hovered && !isDragOverlay
      ? '1px solid var(--color-border-2)'
      : '1px solid var(--color-border)',
    borderRadius: 10,
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    userSelect: 'none',
    willChange: 'transform',
    position: 'relative',
  }

  const tagColor = card.tag ? (TAG_COLORS[card.tag] ?? '#888') : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...attributes}
      {...listeners}
    >
      {/* Delete button */}
      {onDelete && !isDragOverlay && (
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onDelete(card.id) }}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            opacity: hovered ? 0.5 : 0,
            transition: 'opacity 150ms ease',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-dim)',
            padding: '2px 4px',
            borderRadius: 4,
            fontSize: 13,
            lineHeight: 1,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = hovered ? '0.5' : '0'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-dim)' }}
        >
          ×
        </button>
      )}

      {/* Tag + priority */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {card.tag && tagColor && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: tagColor,
              backgroundColor: `${tagColor}22`,
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

      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.35, margin: 0, paddingRight: 14 }}>
        {card.title}
      </p>

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
  id,
  title,
  color,
  cards,
  isCustom,
  onAddCard,
  onDeleteCard,
  onDeleteColumn,
}: {
  id: string
  title: string
  color: string
  cards: KanbanCard[]
  isCustom: boolean
  onAddCard: (columnId: string, title: string) => void
  onDeleteCard: (id: string) => void
  onDeleteColumn: (id: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [hovered, setHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { setNodeRef, isOver } = useDroppable({ id })

  async function handleConfirmAdd() {
    if (!newTitle.trim() || saving) return
    setSaving(true)
    try {
      await onAddCard(id, newTitle.trim())
      setNewTitle('')
      setAdding(false)
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleConfirmAdd()
    if (e.key === 'Escape') { setAdding(false); setNewTitle('') }
  }

  function openAdding() {
    setAdding(true)
    setTimeout(() => inputRef.current?.focus(), 40)
  }

  return (
    <div
      style={{
        width: 272,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 14,
        backgroundColor: 'var(--color-surface)',
        border: `1px solid ${isOver ? color + '66' : 'var(--color-border)'}`,
        boxShadow: isOver ? `0 0 0 2px ${color}33` : 'none',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 14px 10px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: color,
            backgroundColor: `${color}22`,
            border: `1px solid ${color}44`,
            borderRadius: 20,
            padding: '0 7px',
            minWidth: 20,
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          {cards.length}
        </span>
        {isCustom && (
          <button
            onClick={() => onDeleteColumn(id)}
            style={{
              opacity: hovered ? 0.45 : 0,
              transition: 'opacity 150ms ease',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-dim)',
              padding: '2px 4px',
              borderRadius: 4,
              fontSize: 15,
              lineHeight: 1,
              flexShrink: 0,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = hovered ? '0.45' : '0'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-dim)' }}
            title="Remover coluna"
          >
            ×
          </button>
        )}
      </div>

      {/* Cards */}
      <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: '10px',
            minHeight: 80,
            backgroundColor: isOver ? `${color}08` : 'transparent',
            transition: 'background-color 150ms ease',
          }}
        >
          {cards.map(card => (
            <SortableCard key={card.id} card={card} onDelete={onDeleteCard} />
          ))}

          {cards.length === 0 && !adding && (
            <div
              style={{
                flex: 1,
                minHeight: 56,
                border: `2px dashed ${isOver ? color + '55' : 'var(--color-border)'}`,
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
              disabled={saving}
              style={{
                width: '100%',
                padding: '8px 10px',
                backgroundColor: 'var(--color-surface-3)',
                border: `1px solid ${color}55`,
                borderRadius: 8,
                color: 'var(--color-text)',
                fontSize: 13,
                outline: 'none',
                boxShadow: `0 0 0 2px ${color}22`,
              }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleConfirmAdd}
                disabled={saving || !newTitle.trim()}
                style={{
                  flex: 1,
                  padding: '6px',
                  backgroundColor: color,
                  border: 'none',
                  borderRadius: 7,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: saving ? 'wait' : 'pointer',
                  opacity: saving || !newTitle.trim() ? 0.6 : 1,
                  transition: 'opacity 150ms',
                }}
              >
                {saving ? '...' : 'Adicionar'}
              </button>
              <button
                onClick={() => { setAdding(false); setNewTitle('') }}
                disabled={saving}
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
              b.style.borderColor = color
              b.style.color = color
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

function AddColumnForm({ onAdd }: { onAdd: (title: string, color: string) => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [colorIdx, setColorIdx] = useState(0)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleAdd() {
    if (!title.trim() || saving) return
    setSaving(true)
    try {
      await onAdd(title.trim(), PICKER_COLORS[colorIdx % PICKER_COLORS.length])
      setTitle('')
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') { setOpen(false); setTitle('') }
  }

  function handleOpen() {
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 40)
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
        disabled={saving}
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
          {PICKER_COLORS.map((c, i) => (
            <button
              key={c}
              onClick={() => setColorIdx(i)}
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: c,
                border: colorIdx === i ? '2px solid #fff' : '2px solid transparent',
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
          disabled={saving || !title.trim()}
          style={{
            flex: 1,
            padding: '7px',
            backgroundColor: PICKER_COLORS[colorIdx % PICKER_COLORS.length],
            border: 'none',
            borderRadius: 7,
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: saving ? 'wait' : 'pointer',
            opacity: saving || !title.trim() ? 0.6 : 1,
            transition: 'opacity 150ms',
          }}
        >
          {saving ? '...' : 'Criar'}
        </button>
        <button
          onClick={() => { setOpen(false); setTitle('') }}
          disabled={saving}
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function BoardSkeleton() {
  return (
    <div style={{ display: 'flex', gap: 14, padding: '20px 24px', overflow: 'hidden' }}>
      {KANBAN_COLUMNS.map(col => (
        <div
          key={col.id}
          style={{
            width: 272,
            flexShrink: 0,
            borderRadius: 14,
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: col.color, flexShrink: 0 }} />
            <div style={{ height: 12, width: 80, borderRadius: 4, backgroundColor: 'var(--color-surface-3)' }} />
          </div>
          <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2].map(i => (
              <div
                key={i}
                style={{
                  height: 64,
                  borderRadius: 10,
                  backgroundColor: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        </div>
      ))}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1 }
          50% { opacity: 0.4 }
        }
      `}</style>
    </div>
  )
}

// ─── Main Board ───────────────────────────────────────────────────────────────

export function KanbanBoard() {
  const [cards, setCards] = useState<KanbanCard[]>([])
  const [customColumns, setCustomColumns] = useState<KanbanColumn[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null)

  // Refs to access current state inside async callbacks without stale closures
  const draggingRef = useRef(false)
  const localCardsRef = useRef<KanbanCard[]>([])
  const firestoreCardsRef = useRef<KanbanCard[]>([])

  useEffect(() => { localCardsRef.current = cards }, [cards])

  // Real-time Firestore subscriptions (cards + custom columns)
  useEffect(() => {
    let cardsReady = false
    let colsReady = false

    const unsubCards = subscribeToKanbanCards(
      (fresh) => {
        firestoreCardsRef.current = fresh
        if (!draggingRef.current) setCards(fresh)
        cardsReady = true
        if (colsReady) setLoading(false)
      },
      (err) => {
        console.error('Kanban cards sync error:', err)
        setError('Não foi possível carregar o quadro. Recarregue a página.')
        setLoading(false)
      },
    )

    const unsubCols = subscribeToCustomColumns(
      (fresh) => {
        setCustomColumns(fresh)
        colsReady = true
        if (cardsReady) setLoading(false)
      },
      (err) => {
        console.error('Kanban columns sync error:', err)
        // Non-fatal — custom columns just won't load
        colsReady = true
        if (cardsReady) setLoading(false)
      },
    )

    return () => { unsubCards(); unsubCols() }
  }, [])

  // All columns: fixed base + custom (from Firestore)
  const allColumns = useMemo(() => {
    const base = KANBAN_COLUMNS.map(c => ({ ...c, isCustom: false as const }))
    const custom = customColumns.map(c => ({ ...c, isCustom: true as const }))
    return [...base, ...custom]
  }, [customColumns])

  // Derived columns with their cards
  const columns = useMemo(
    () => allColumns.map(col => ({
      ...col,
      cards: cards.filter(c => c.columnId === col.id).sort((a, b) => a.order - b.order),
    })),
    [cards, allColumns],
  )

  // Keep COLUMN_ID_SET updated with custom column ids
  useEffect(() => {
    customColumns.forEach(c => COLUMN_ID_SET.add(c.id))
  }, [customColumns])

  const totalCards = cards.length

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    draggingRef.current = true
    const id = event.active.id as string
    setActiveCard(localCardsRef.current.find(c => c.id === id) ?? null)
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setCards(prev => applyMove(prev, active.id as string, over.id as string))
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { over } = event
    setActiveCard(null)

    if (!over) {
      // Dropped outside — revert
      setCards(firestoreCardsRef.current)
      draggingRef.current = false
      return
    }

    const finalCards = localCardsRef.current
    const original = firestoreCardsRef.current

    // Compute which cards actually changed
    const changed = finalCards.reduce<{ id: string; columnId: string; order: number }[]>(
      (acc, card) => {
        const prev = original.find(c => c.id === card.id)
        if (!prev || prev.columnId !== card.columnId || prev.order !== card.order) {
          acc.push({ id: card.id, columnId: card.columnId, order: card.order })
        }
        return acc
      },
      [],
    )

    if (changed.length === 0) {
      draggingRef.current = false
      return
    }

    // Persist to Firestore, keep drag lock until confirmed
    batchMoveCards(changed)
      .then(() => {
        // Our write succeeded — update the Firestore reference
        firestoreCardsRef.current = localCardsRef.current
        draggingRef.current = false
      })
      .catch((err) => {
        console.error('Failed to persist card move:', err)
        // Revert to last known Firestore state on error
        setCards(firestoreCardsRef.current)
        draggingRef.current = false
      })
  }, [])

  const handleAddCard = useCallback(async (columnId: string, title: string) => {
    const colCards = localCardsRef.current.filter(c => c.columnId === columnId)
    const nextOrder = colCards.length === 0
      ? 0
      : Math.max(...colCards.map(c => c.order)) + 1000
    await addKanbanCard({ title, columnId, order: nextOrder })
  }, [])

  const handleDeleteCard = useCallback(async (id: string) => {
    await deleteKanbanCard(id).catch(console.error)
  }, [])

  const handleAddColumn = useCallback(async (title: string, color: string) => {
    const nextOrder = customColumns.length === 0
      ? 0
      : Math.max(...customColumns.map(c => c.order)) + 1000
    await addKanbanColumn({ title, color, order: nextOrder })
  }, [customColumns])

  const handleDeleteColumn = useCallback(async (id: string) => {
    await deleteKanbanColumn(id).catch(console.error)
    // Cards in this column stay — they'll show under an orphaned columnId
    // (acceptable: user can drag them to another column)
  }, [])

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <p style={{ color: 'var(--color-danger)', fontSize: 14 }}>{error}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--color-border)', height: 44 }} />
        <BoardSkeleton />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Progress bar */}
      <div
        style={{
          padding: '0 24px',
          height: 44,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', flex: 1, gap: 3, alignItems: 'center', borderRadius: 99, overflow: 'hidden' }}>
          {columns.map(col => (
            <div
              key={col.id}
              title={`${col.title}: ${col.cards.length}`}
              style={{
                height: 4,
                flex: col.cards.length || 0.3,
                backgroundColor: col.color,
                opacity: 0.65,
                transition: 'flex 450ms cubic-bezier(0.25, 1, 0.5, 1)',
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: 12, color: 'var(--color-text-dim)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {totalCards} {totalCards === 1 ? 'card' : 'cards'}
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
              id={col.id}
              title={col.title}
              color={col.color}
              cards={col.cards}
              isCustom={col.isCustom}
              onAddCard={handleAddCard}
              onDeleteCard={handleDeleteCard}
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
