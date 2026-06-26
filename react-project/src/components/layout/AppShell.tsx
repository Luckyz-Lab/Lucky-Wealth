import type { ReactNode } from 'react'
import type { ViewId } from '../../types'
import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  view: ViewId
  ownerName: string
  onNavigate: (view: ViewId) => void
  onReset: () => void
  children: ReactNode
}

export function AppShell({ view, ownerName, onNavigate, onReset, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <Sidebar view={view} ownerName={ownerName} onNavigate={onNavigate} onReset={onReset} />
      <main className="main" id="main-content">
        {children}
      </main>
      <MobileNav view={view} onNavigate={onNavigate} />
    </div>
  )
}
