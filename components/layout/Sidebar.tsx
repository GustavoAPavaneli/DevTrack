'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { signOut } from '@/lib/firebase/auth'

const navItems = [
  { href: '/',         label: 'Dashboard',      icon: 'dashboard' },
  { href: '/devs',     label: 'Devs',           icon: 'devs'      },
  { href: '/projects', label: 'Projetos',        icon: 'projects'  },
  { href: '/logs',     label: 'Registrar Horas', icon: 'logs'      },
  { href: '/reports',  label: 'Relatórios',      icon: 'reports'   },
  { href: '/my',       label: 'Meu Painel',      icon: 'my'        },
]


export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useAuth()

  async function handleLogout() {
    await signOut()
    router.replace('/login')
  }

  return (
    <aside className="flex h-full w-60 flex-col" style={{ backgroundColor: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}>
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex-shrink-0 overflow-hidden rounded-lg" style={{ backgroundColor: '#000', width: 34, height: 34 }}>
          <Image src="/logo.png" alt="Crably" width={34} height={34} />
        </div>
        <div className="flex flex-col leading-none gap-0.5">
          <span className="text-lg font-bold tracking-tight" style={{ color: '#fff' }}>crably</span>
          <span className="text-[11px] font-medium tracking-wide" style={{ color: 'var(--color-text-muted)' }}>DevTrack</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                  style={isActive
                    ? { backgroundColor: 'var(--color-brand-muted)', color: 'var(--color-brand)', borderLeft: '2px solid var(--color-brand)' }
                    : { color: 'var(--color-text-muted)', borderLeft: '2px solid transparent' }
                  }
                  onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = 'var(--color-surface-2)'; e.currentTarget.style.color = 'var(--color-text)' } }}
                  onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--color-text-muted)' } }}
                >
                  <NavIcon name={item.icon} />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User + logout */}
      <div className="p-3" style={{ borderTop: '1px solid var(--color-border)' }}>
        {profile && (
          <Link
            href="/profile"
            className="mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors"
            style={pathname === '/profile'
              ? { backgroundColor: 'var(--color-brand-muted)', borderLeft: '2px solid var(--color-brand)' }
              : { borderLeft: '2px solid transparent' }
            }
            onMouseEnter={(e) => { if (pathname !== '/profile') e.currentTarget.style.backgroundColor = 'var(--color-surface-2)' }}
            onMouseLeave={(e) => { if (pathname !== '/profile') e.currentTarget.style.backgroundColor = '' }}
          >
            <Avatar name={profile.name} avatarUrl={profile.avatarUrl} size={28} />
            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text)' }}>{profile.name}</p>
              <p className="text-[10px] capitalize" style={{ color: 'var(--color-text-dim)' }}>{profile.role}</p>
            </div>
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="w-full rounded-lg px-3 py-2 text-left text-xs transition-colors"
          style={{ color: 'var(--color-text-dim)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-2)'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--color-text-dim)' }}
        >
          Sair
        </button>
      </div>
    </aside>
  )
}

function NavIcon({ name }: { name: string }) {
  const cls = 'h-4 w-4 flex-shrink-0'
  const icons: Record<string, React.ReactElement> = {
    dashboard: <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    devs: <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    projects: <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
    logs: <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    reports: <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    my: <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  }
  return icons[name] ?? null
}
