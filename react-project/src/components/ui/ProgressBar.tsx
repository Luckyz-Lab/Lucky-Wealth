import type { CSSProperties } from 'react'

interface ProgressBarProps {
  label: string
  valueLabel: string
  value: number
  tone?: 'good' | 'warn' | 'bad' | 'info'
}

export function ProgressBar({ label, valueLabel, value, tone = 'info' }: ProgressBarProps) {
  return (
    <div className="progress">
      <div className="progress__meta">
        <span>{label}</span>
        <strong>{valueLabel}</strong>
      </div>
      <div className="progress__track" aria-hidden="true">
        <div className={`progress__fill progress__fill--${tone}`} style={{ '--progress': `${Math.min(100, Math.max(0, value))}%` } as CSSProperties} />
      </div>
    </div>
  )
}
