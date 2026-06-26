import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  icon?: string
  children: ReactNode
}

export function Button({ variant = 'primary', icon, className = '', children, ...props }: ButtonProps) {
  return (
    <button className={`button button--${variant} ${className}`.trim()} {...props}>
      {icon && <i aria-hidden="true" className={`ti ${icon}`} />}
      <span>{children}</span>
    </button>
  )
}
