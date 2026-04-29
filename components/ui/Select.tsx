import { type SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, id, options, className = '', style, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={['rounded-lg px-3 py-2 text-sm outline-none transition-colors', className].join(' ')}
          style={{
            backgroundColor: 'var(--color-surface-2)',
            border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border-2)'}`,
            color: 'var(--color-text)',
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-brand)'
            e.currentTarget.style.boxShadow = '0 0 0 2px var(--color-brand-muted)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--color-danger)' : 'var(--color-border-2)'
            e.currentTarget.style.boxShadow = 'none'
          }}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} style={{ backgroundColor: 'var(--color-surface-2)' }}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
