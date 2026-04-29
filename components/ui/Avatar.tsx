'use client'

interface AvatarProps {
  name: string
  avatarUrl?: string | null
  size?: number
  className?: string
}

export function Avatar({ name, avatarUrl, size = 40, className = '' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const fontSize = size >= 56 ? '1.25rem' : size >= 36 ? '0.875rem' : '0.7rem'

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: size,
        height: size,
        minWidth: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        backgroundColor: avatarUrl ? 'transparent' : 'var(--color-brand)',
      }}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={name}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize,
            fontWeight: 700,
            color: '#fff',
          }}
        >
          {initials}
        </div>
      )}
    </div>
  )
}
