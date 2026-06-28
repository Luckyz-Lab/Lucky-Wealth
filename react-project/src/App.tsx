import { useState } from 'react'
import type { ViewId } from './types'
import { usePersistentWealthState } from './hooks/usePersistentWealthState'
import { AppShell } from './components/layout'
import { ConfirmDialog, HelpDialog } from './components/ui'
import { DashboardView } from './features/dashboard/DashboardView'
import { TaxView } from './features/tax/TaxView'
import { LoanView } from './features/loans/LoanView'
import { RetirementView } from './features/retirement/RetirementView'
import { VaultView } from './features/vault/VaultView'
import { AIView } from './features/ai/AIView'

export default function App() {
  const { state, actions } = usePersistentWealthState()
  const [view, setView] = useState<ViewId>('dashboard')
  const [confirmReset, setConfirmReset] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const resetData = () => {
    actions.resetState()
    setView('dashboard')
    setConfirmReset(false)
  }

  return (
    <>
      <AppShell view={view} ownerName={state.ownerName} onNavigate={setView} onReset={() => setConfirmReset(true)} onHelp={() => setHelpOpen(true)}>
        {view === 'dashboard' && <DashboardView state={state} actions={actions} onNavigate={setView} />}
        {view === 'tax' && <TaxView state={state} actions={actions} onNavigate={setView} />}
        {view === 'loan' && <LoanView state={state} onNavigate={setView} />}
        {view === 'retirement' && <RetirementView state={state} actions={actions} onNavigate={setView} />}
        {view === 'vault' && <VaultView state={state} actions={actions} />}
        {view === 'ai' && <AIView state={state} actions={actions} />}
      </AppShell>
      <ConfirmDialog
        open={confirmReset}
        title="รีเซ็ตข้อมูลทั้งหมด?"
        description="ข้อมูลใน localStorage จะกลับเป็นข้อมูลตัวอย่างเริ่มต้น รวมถึงรายการรายได้ ค่าลดหย่อน เอกสาร และ tax filing draft การกระทำนี้ย้อนกลับไม่ได้ถ้าไม่ได้ export backup ไว้"
        confirmLabel="รีเซ็ต"
        onConfirm={resetData}
        onCancel={() => setConfirmReset(false)}
      />
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  )
}
