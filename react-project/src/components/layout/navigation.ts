import type { ViewId } from '../../types'

export const NAV_ITEMS: { id: ViewId; icon: string; label: string; group?: string }[] = [
  { id: 'dashboard', icon: 'ti-layout-grid', label: 'Tools Hub', group: 'เครื่องมือ' },
  { id: 'tax', icon: 'ti-receipt-tax', label: 'ภาษี', group: 'คำนวณ' },
  { id: 'loan', icon: 'ti-home-dollar', label: 'สินเชื่อ' },
  { id: 'retirement', icon: 'ti-sunset-2', label: 'เกษียณ' },
  { id: 'vault', icon: 'ti-folder-lock', label: 'เอกสาร', group: 'จัดการ' },
  { id: 'ai', icon: 'ti-brain', label: 'Advisor' },
]
