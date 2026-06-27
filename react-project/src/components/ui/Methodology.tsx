interface MethodologyProps {
  title?: string
  items: string[]
  note?: string
}

export function Methodology({ title = 'วิธีการคำนวณ', items, note }: MethodologyProps) {
  return (
    <section className="methodology" aria-labelledby="methodology-title">
      <div className="section-heading">
        <p className="eyebrow">Methodology</p>
        <h2 id="methodology-title">{title}</h2>
      </div>
      <div className="methodology__grid">
        {items.map((item, index) => (
          <article key={item} className="methodology__item">
            <span>{index + 1}</span>
            <p>{item}</p>
          </article>
        ))}
      </div>
      {note && <p className="methodology__note">{note}</p>}
    </section>
  )
}
