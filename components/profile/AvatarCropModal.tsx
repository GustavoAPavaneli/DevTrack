'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

const CANVAS_SIZE = 300
const OUTPUT_SIZE = 256

interface Props {
  file: File
  onApply: (blob: Blob) => void
  onCancel: () => void
}

export function AvatarCropModal({ file, onApply, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [minZoom, setMinZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      imgRef.current = img
      const mz = Math.max(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height)
      setMinZoom(mz)
      setZoom(mz)
      setOffset({ x: 0, y: 0 })
      setImageLoaded(true)
      URL.revokeObjectURL(url)
    }
    img.src = url
  }, [file])

  useEffect(() => {
    if (!imageLoaded) return
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    const w = img.width * zoom
    const h = img.height * zoom
    const x = (CANVAS_SIZE - w) / 2 + offset.x
    const y = (CANVAS_SIZE - h) / 2 + offset.y
    ctx.drawImage(img, x, y, w, h)

    // dim outside circle
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 1, 0, Math.PI * 2, true)
    ctx.fillStyle = 'rgba(0,0,0,0.62)'
    ctx.fill('evenodd')
    ctx.restore()

    // circle border
    ctx.beginPath()
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 1, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }, [imageLoaded, zoom, offset])

  function clientPos(e: React.MouseEvent | React.TouchEvent) {
    if ('touches' in e) return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    return { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY }
  }

  function handleStart(e: React.MouseEvent | React.TouchEvent) {
    dragging.current = true
    lastPos.current = clientPos(e)
  }

  function handleMove(e: React.MouseEvent | React.TouchEvent) {
    if (!dragging.current) return
    const pos = clientPos(e)
    const dx = pos.x - lastPos.current.x
    const dy = pos.y - lastPos.current.y
    lastPos.current = pos
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
  }

  function handleEnd() { dragging.current = false }

  function handleApply() {
    const img = imgRef.current
    if (!img) return
    const out = document.createElement('canvas')
    out.width = OUTPUT_SIZE
    out.height = OUTPUT_SIZE
    const ctx = out.getContext('2d')
    if (!ctx) return

    const scale = OUTPUT_SIZE / CANVAS_SIZE
    const w = img.width * zoom * scale
    const h = img.height * zoom * scale
    const x = (OUTPUT_SIZE - w) / 2 + offset.x * scale
    const y = (OUTPUT_SIZE - h) / 2 + offset.y * scale

    ctx.beginPath()
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(img, x, y, w, h)

    out.toBlob((blob) => { if (blob) onApply(blob) }, 'image/png')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onMouseUp={handleEnd}
    >
      <div
        className="flex flex-col gap-5 rounded-xl p-6"
        style={{ width: 380, backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>Editar imagem</h2>
          <button onClick={onCancel} style={{ color: 'var(--color-text-dim)' }}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Canvas */}
        <div className="flex justify-center rounded-full overflow-hidden" style={{ width: CANVAS_SIZE, margin: '0 auto' }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={{ display: 'block', cursor: 'grab', userSelect: 'none' }}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          />
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 px-1">
          <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--color-text-dim)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
          <input
            type="range"
            min={minZoom}
            max={minZoom * 3}
            step={0.001}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: 'var(--color-brand)' }}
          />
          <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--color-text-dim)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button onClick={handleApply}>Aplicar</Button>
        </div>
      </div>
    </div>
  )
}
