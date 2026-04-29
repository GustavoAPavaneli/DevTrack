import { type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
}

export function Card({ title, children, className = '', style, ...props }: CardProps) {
  return (
    <div
      className={['rounded-xl p-5', className].join(' ')}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        ...style,
      }}
      {...props}
    >
      {title && (
        <h3
          className="mb-4 text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-text-dim)' }}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}
