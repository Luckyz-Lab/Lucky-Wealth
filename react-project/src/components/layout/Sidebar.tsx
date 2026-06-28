import type { ViewId } from '../../types'
import { Button } from '../ui'
import { NAV_ITEMS } from './navigation'

interface SidebarProps {
  view: ViewId
  ownerName: string
  onNavigate: (view: ViewId) => void
  onReset: () => void
}

export function Sidebar({ view, ownerName, onNavigate, onReset }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="brand">
        <div className="brand__mark"><i aria-hidden="true" className="ti ti-calculator" /></div>
        <div>
          <div className="brand__name">Lucky Wealth</div>
          <div className="brand__sub">Personal finance calculators</div>
        </div>
      </div>

      <nav className="nav">
        {NAV_ITEMS.map((item) => (
          <div key={item.id}>
            {item.group && <div className="nav__group">{item.group}</div>}
            <button
              type="button"
              className={`nav__button ${view === item.id ? 'is-active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <i aria-hidden="true" className={`ti ${item.icon}`} />
              <span>{item.label}</span>
            </button>
          </div>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="owner-card">
          <div className="owner-card__name">{ownerName}</div>
          <div className="owner-card__sub"><span className="live-dot" /> Local autosave · ปี 2569</div>
        </div>
        <Button variant="secondary" icon="ti-refresh" onClick={onReset}>รีเซ็ตข้อมูล</Button>
      </div>
    </aside>
  )
}
