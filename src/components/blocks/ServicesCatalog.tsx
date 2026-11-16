'use client'

import { useState } from 'react'

type Item = {
  id: string
  category?: string | null
  name: string
  description?: string | null
  points: string[]
}
type Category = { key: string; label: string }

/** Katalog layanan dengan filter kategori (filter disembunyikan bila label "semua" kosong). */
export function ServicesCatalog({
  items,
  categories,
  allLabel,
  filterLabel,
}: {
  items: Item[]
  categories: Category[]
  allLabel?: string | null
  filterLabel: string
}) {
  const [active, setActive] = useState<string>('all')
  const labelOf = (key?: string | null) => categories.find((c) => c.key === key)?.label
  const visible = items.filter((i) => active === 'all' || i.category === active)

  return (
    <>
      {allLabel && categories.length > 1 && (
        <div className="filters" role="group" aria-label={filterLabel}>
          {[{ key: 'all', label: allLabel }, ...categories].map((c) => (
            <button
              key={c.key}
              type="button"
              className="filters__btn"
              aria-pressed={active === c.key}
              onClick={() => setActive(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
      <ul className="services" aria-live="polite">
        {visible.map((s) => (
          <li key={s.id} className="service">
            {labelOf(s.category) && <span className="service__tag">{labelOf(s.category)}</span>}
            <h3>{s.name}</h3>
            {s.description && <p>{s.description}</p>}
            {s.points.length > 0 && (
              <ul className="service__points">
                {s.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}
