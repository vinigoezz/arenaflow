// src/components/AppLayout.tsx — App shell with bottom nav + header
'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import {
  Home, Users, Grid3X3, Calendar, DollarSign, Settings,
  Bell, LogOut, ChevronRight
} from 'lucide-react'

const navItems = [
  { href: '/',           icon: Home,       label: 'Início' },
  { href: '/students',   icon: Users,       label: 'Alunos' },
  { href: '/courts',     icon: Grid3X3,     label: 'Quadras' },
  { href: '/reservations', icon: Calendar,  label: 'Reservas' },
  { href: '/financial',  icon: DollarSign,  label: 'Financeiro' },
  { href: '/settings',   icon: Settings,    label: 'Config' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [showMenu, setShowMenu] = useState(false)

  const initials = session?.user?.name
    ? session.user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U'

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="app-header">
        <div className="logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            <path d="M2 12h20"/>
          </svg>
          Arena<span>Flow</span>
        </div>
        <div className="header-actions">
          <button
            className="btn-ghost"
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Sair"
            style={{ color: 'var(--color-text-3)' }}
          >
            <LogOut size={18} />
          </button>
          <div className="avatar" title={session?.user?.name || ''}>{initials}</div>
        </div>
      </header>

      {/* Desktop sidebar */}
      <nav className="bottom-nav" role="navigation" aria-label="Menu principal">
        {/* Brand (desktop only) */}
        <div className="nav-brand" style={{ display: 'none' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            <path d="M2 12h20"/>
          </svg>
          Arena<span>Flow</span>
        </div>

        {navItems.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`nav-item ${active ? 'active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Main content */}
      <main className="main-content page-enter">
        {children}
      </main>
    </div>
  )
}
