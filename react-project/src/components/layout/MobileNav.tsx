import type { ViewId } from '../../types'
import { NAV_ITEMS } from './navigation'

interface MobileNavProps {
  view: ViewId
  onNavigate: (view: ViewId) => void
}

export function MobileNav({ view, onNavigate }: MobileNavProps) {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {NAV_ITEMS.slice(0, 5).map((item) => (
        <button
          key={item.id}
          type="button"
          className={`mobile-nav__button ${view === item.id ? 'is-active' : ''}`}
          onClick={() => onNavigate(item.id)}
        >
          <i aria-hidden="true" className={`ti ${item.icon}`} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
