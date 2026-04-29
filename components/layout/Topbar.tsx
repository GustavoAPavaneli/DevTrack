interface TopbarProps {
  title: string
  children?: React.ReactNode
}

export function Topbar({ title, children }: TopbarProps) {
  return (
    <header
      className="flex h-14 items-center justify-between px-6"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <h1 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
        {title}
      </h1>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  )
}
