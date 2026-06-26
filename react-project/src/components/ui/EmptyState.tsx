interface EmptyStateProps {
  title: string
  description?: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon"><i aria-hidden="true" className="ti ti-folder-open" /></div>
      <strong>{title}</strong>
      {description && <p>{description}</p>}
    </div>
  )
}
