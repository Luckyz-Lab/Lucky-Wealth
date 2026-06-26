import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

interface FieldShellProps {
  label: string
  helper?: string
  info?: string
  children: ReactNode
}

function FieldShell({ label, helper, info, children }: FieldShellProps) {
  return (
    <label className="field">
      <span className="field__label">
        <span>{label}</span>
        {info && (
          <span className="field__help" tabIndex={0} aria-label={`${label}: ${info}`}>
            <i aria-hidden="true" className="ti ti-help-circle" />
            <span className="field__tooltip" role="tooltip">{info}</span>
          </span>
        )}
      </span>
      {children}
      {helper && <span className="field__helper">{helper}</span>}
    </label>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  helper?: string
  info?: string
}

export function Input({ label, helper, info, className = '', ...props }: InputProps) {
  return (
    <FieldShell label={label} helper={helper} info={info}>
      <input className={`input ${className}`.trim()} {...props} />
    </FieldShell>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  helper?: string
  info?: string
  children: ReactNode
}

export function Select({ label, helper, info, className = '', children, ...props }: SelectProps) {
  return (
    <FieldShell label={label} helper={helper} info={info}>
      <select className={`input ${className}`.trim()} {...props}>
        {children}
      </select>
    </FieldShell>
  )
}
