'use client'

import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary:   { backgroundColor: 'var(--color-brand)', color: '#fff', border: '1px solid transparent' },
  secondary: { backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text)', border: '1px solid var(--color-border-2)' },
  ghost:     { backgroundColor: 'transparent', color: 'var(--color-text-muted)', border: '1px solid transparent' },
  danger:    { backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b' },
}

const variantHover: Record<Variant, React.CSSProperties> = {
  primary:   { backgroundColor: 'var(--color-brand-hover)' },
  secondary: { backgroundColor: 'var(--color-surface-3)', color: 'var(--color-text)' },
  ghost:     { backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text)' },
  danger:    { backgroundColor: '#991b1b' },
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, disabled, className = '', style, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed',
        sizeClasses[size],
        className,
      ].join(' ')}
      style={{ ...variantStyles[variant], ...style }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) Object.assign(e.currentTarget.style, variantHover[variant])
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) Object.assign(e.currentTarget.style, variantStyles[variant])
      }}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
)
Button.displayName = 'Button'
