import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

interface FieldShellProps {
  label: string
  helper?: string
  children: ReactNode
}

function FieldShell({ label, helper, children }: FieldShellProps) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {helper && <span className="field__helper">{helper}</span>}
    </label>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  helper?: string
}

export function Input({ label, helper, className = '', ...props }: InputProps) {
  return (
    <FieldShell label={label} helper={helper}>
      <input className={`input ${className}`.trim()} {...props} />
    </FieldShell>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  helper?: string
  children: ReactNode
}

export function Select({ label, helper, className = '', children, ...props }: SelectProps) {
  return (
    <FieldShell label={label} helper={helper}>
      <select className={`input ${className}`.trim()} {...props}>
        {children}
      </select>
    </FieldShell>
  )
}
