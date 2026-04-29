'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Topbar } from '@/components/layout/Topbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AvatarCropModal } from '@/components/profile/AvatarCropModal'
import { useAuth } from '@/components/providers/AuthProvider'
import { updateUserProfile } from '@/lib/firebase/db'
import { uploadProfilePhoto } from '@/lib/firebase/storageUpload'

export default function ProfilePage() {
  const { user, profile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? '')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const initials = (profile?.name ?? user?.email ?? '?')
    .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    if (!file.type.startsWith('image/')) { setError('Selecione um arquivo de imagem.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('A imagem deve ter no máximo 10 MB.'); return }
    setPendingFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleCropApply(blob: Blob) {
    if (!user) return
    setPendingFile(null)
    setUploading(true)
    setError('')
    setSuccess(false)
    try {
      const file = new File([blob], 'avatar.png', { type: 'image/png' })
      const uploadPromise = uploadProfilePhoto(user.uid, file)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 30_000)
      )
      const url = await Promise.race([uploadPromise, timeoutPromise])
      await updateUserProfile(user.uid, { avatarUrl: url })
      setAvatarUrl(url)
      setSuccess(true)
    } catch (err) {
      const msg = (err as { code?: string })?.code === 'storage/unauthorized'
        ? 'Sem permissão no Storage. Publique as regras do Firebase Storage no console.'
        : 'Erro ao enviar foto. Tente novamente.'
      setError(msg)
      console.error('[Profile] upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!user || !name.trim()) return
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      await updateUserProfile(user.uid, { name: name.trim() })
      setSuccess(true)
      setEditing(false)
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setName(profile?.name ?? '')
    setEditing(false)
    setError('')
  }

  const memberSince = (() => {
    if (!profile?.createdAt) return '—'
    const d = new Date(profile.createdAt)
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  })()

  return (
    <>
      {pendingFile && (
        <AvatarCropModal
          file={pendingFile}
          onApply={handleCropApply}
          onCancel={() => setPendingFile(null)}
        />
      )}

      <div className="flex flex-col">
        <Topbar title="Perfil" />
        <div className="p-6 max-w-lg flex flex-col gap-6">

          {/* Avatar */}
          <Card>
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="group relative flex h-16 w-16 items-center justify-center rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--color-brand)' }}
                  title="Clique para trocar a foto"
                >
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
                  ) : (
                    <span className="text-xl font-bold" style={{ color: '#fff' }}>{initials}</span>
                  )}
                  <span
                    className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: 'rgba(0,0,0,0.52)' }}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="white">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              </div>

              <div>
                <p className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>{profile?.name ?? '—'}</p>
                <p className="text-sm capitalize" style={{ color: 'var(--color-text-muted)' }}>{profile?.role ?? '—'}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="mt-1 text-xs"
                  style={{ color: 'var(--color-brand)' }}
                >
                  {uploading ? 'Enviando…' : 'Trocar foto'}
                </button>
              </div>
            </div>
          </Card>

          {/* Dados */}
          <Card title="Informações">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>Nome</label>
                {editing ? (
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                    autoFocus
                  />
                ) : (
                  <p className="text-sm" style={{ color: 'var(--color-text)' }}>{profile?.name ?? '—'}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>Email</label>
                <p className="text-sm" style={{ color: 'var(--color-text)' }}>{profile?.email ?? user?.email ?? '—'}</p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>Função</label>
                <p className="text-sm capitalize" style={{ color: 'var(--color-text)' }}>{profile?.role ?? '—'}</p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>Membro desde</label>
                <p className="text-sm" style={{ color: 'var(--color-text)' }}>{memberSince}</p>
              </div>

              {error && (
                <p className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: '#ef444415', color: 'var(--color-danger)', border: '1px solid #ef444430' }}>
                  {error}
                </p>
              )}
              {success && (
                <p className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: '#22c55e15', color: 'var(--color-success)', border: '1px solid #22c55e30' }}>
                  Salvo com sucesso.
                </p>
              )}

              <div className="flex gap-2 pt-1">
                {editing ? (
                  <>
                    <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</Button>
                    <Button variant="ghost" onClick={handleCancel} disabled={saving}>Cancelar</Button>
                  </>
                ) : (
                  <Button variant="ghost" onClick={() => setEditing(true)}>Editar nome</Button>
                )}
              </div>
            </div>
          </Card>

        </div>
      </div>
    </>
  )
}
