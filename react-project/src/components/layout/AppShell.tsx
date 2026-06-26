import type { ReactNode } from 'react'
import type { ViewId } from '../../types'
import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  view: ViewId
  ownerName: string
  onNavigate: (view: ViewId) => void
  onReset: () => void
  onHelp: () => void
  children: ReactNode
}

export function AppShell({ view, ownerName, onNavigate, onReset, onHelp, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <Sidebar view={view} ownerName={ownerName} onNavigate={onNavigate} onReset={onReset} />
      <main className="main" id="main-content">
        <header className="topbar" aria-label="Top navigation">
          <div>
            <span className="topbar__eyebrow">Lucky Wealth</span>
            <strong>ระบบวางแผนการเงินและภาษีส่วนบุคคล</strong>
          </div>
          <button type="button" className="help-button" onClick={onHelp} aria-label="เปิดคำอธิบายการใช้งานเว็บ">
            <i aria-hidden="true" className="ti ti-help-circle" />
            <span>วิธีใช้</span>
          </button>
        </header>
        {children}
      </main>
      <MobileNav view={view} onNavigate={onNavigate} />
    </div>
  )
}
