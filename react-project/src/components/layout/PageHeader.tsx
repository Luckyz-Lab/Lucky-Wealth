interface PageHeaderProps {
  eyebrow?: string
  title: string
  description: string
  meta?: string
}

export function PageHeader({ eyebrow, title, description, meta }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <div className="page-header__eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {meta && <div className="page-header__meta">{meta}</div>}
    </header>
  )
}
