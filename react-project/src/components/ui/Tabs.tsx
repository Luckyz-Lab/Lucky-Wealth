interface TabItem<T extends string> {
  id: T
  label: string
}

interface TabsProps<T extends string> {
  value: T
  items: TabItem<T>[]
  onChange: (value: T) => void
}

export function Tabs<T extends string>({ value, items, onChange }: TabsProps<T>) {
  return (
    <div className="tabs" role="tablist" aria-label="Section selector">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`tab ${value === item.id ? 'is-active' : ''}`}
          role="tab"
          aria-selected={value === item.id}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
