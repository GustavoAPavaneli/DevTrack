import { type TextareaHTMLAttributes, forwardRef } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, className = '', style, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={3}
          className={['rounded-lg px-3 py-2 text-sm resize-none outline-none transition-colors', className].join(' ')}
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
Textarea.displayName = 'Textarea'
