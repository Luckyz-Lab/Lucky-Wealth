import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  eyebrow?: string
  action?: ReactNode
  tone?: 'default' | 'highlight' | 'muted'
  children: ReactNode
}

export function Card({ title, eyebrow, action, tone = 'default', children }: CardProps) {
  return (
    <section className={`card card--${tone}`}>
      {(title || eyebrow || action) && (
        <header className="card__header">
          <div>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            {title && <h2 className="card__title">{title}</h2>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
