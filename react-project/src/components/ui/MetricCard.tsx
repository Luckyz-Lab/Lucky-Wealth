import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string
  note: ReactNode
  tone?: 'default' | 'good' | 'warn' | 'bad' | 'info'
}

export function MetricCard({ label, value, note, tone = 'default' }: MetricCardProps) {
  return (
    <article className={`metric metric--${tone}`}>
      <div className="metric__label">{label}</div>
      <div className="metric__value">{value}</div>
      <div className="metric__note">{note}</div>
    </article>
  )
}
