import type { ViewId } from '../../types'
import { Button } from './Button'

interface RelatedTool {
  id: ViewId
  title: string
  description: string
  icon: string
}

interface RelatedToolsProps {
  items: RelatedTool[]
  onNavigate: (view: ViewId) => void
}

export function RelatedTools({ items, onNavigate }: RelatedToolsProps) {
  return (
    <section className="related-tools" aria-labelledby="related-tools-title">
      <div className="section-heading">
        <p className="eyebrow">Related tools</p>
        <h2 id="related-tools-title">เครื่องมือที่เกี่ยวข้อง</h2>
      </div>
      <div className="tool-grid tool-grid--compact">
        {items.map((item) => (
          <article key={item.id} className="tool-card">
            <div className="tool-card__icon"><i aria-hidden="true" className={`ti ${item.icon}`} /></div>
            <div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
            <Button variant="secondary" icon="ti-arrow-right" onClick={() => onNavigate(item.id)}>เปิด</Button>
          </article>
        ))}
      </div>
    </section>
  )
}
