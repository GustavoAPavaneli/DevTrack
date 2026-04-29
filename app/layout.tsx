import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { AuthProvider } from '@/components/providers/AuthProvider'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Crably DevTrack',
  description: 'Gestão de horas e projetos — Crably',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={geist.variable}>
      <body className="min-h-screen antialiased" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
