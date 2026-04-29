import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', style, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={['rounded-lg px-3 py-2 text-sm transition-colors outline-none', className].join(' ')}
          style={{
            backgroundColor: 'var(--color-surface-2)',
            border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border-2)'}`,
            color: 'var(--color-text)',
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--color-danger)' : 'var(--color-brand)'
            e.currentTarget.style.boxShadow = `0 0 0 2px ${error ? '#ef444430' : 'var(--color-brand-muted)'}`
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--color-danger)' : 'var(--color-border-2)'
            e.currentTarget.style.boxShadow = 'none'
          }}
          {...props}
        />
        {error && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
