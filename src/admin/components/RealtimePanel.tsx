'use client'

import { useEffect, useState } from 'react'

type Realtime = { visitors: number; pages: { key: string; visitors: number }[] }
type Labels = { active: string; window: string; auto: string; none: string; updated: string }

/** Pengunjung aktif 5 menit terakhir, diperbarui setiap 30 detik. */
export function RealtimePanel({
  initial,
  labels,
  locale,
}: {
  initial: Realtime
  labels: Labels
  locale: string
}) {
  const [data, setData] = useState(initial)
  const [updated, setUpdated] = useState<Date | null>(null)

  useEffect(() => {
    let alive = true
    const load = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const res = await fetch('/api/analytics/realtime', {
          credentials: 'include',
          cache: 'no-store',
        })
        if (res.ok && alive) {
          setData(await res.json())
          setUpdated(new Date())
        }
      } catch {}
    }
    const id = window.setInterval(load, 30_000)
    return () => {
      alive = false
      window.clearInterval(id)
    }
  }, [])

  const max = Math.max(...data.pages.map((p) => p.visitors), 1)

  return (
    <div className="smd-realtime">
      <div className="smd-realtime__now">
        <span className="smd-realtime__label">
          <i className="smd-live" aria-hidden="true" />
          {labels.active}
          <span className="smd-realtime__window">· {labels.window}</span>
        </span>
        <strong>{data.visitors}</strong>
        <span className="smd-realtime__updated">
          {updated
            ? labels.updated.replace(
                '{t}',
                updated.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
              )
            : labels.auto}
        </span>
      </div>
      <ul className="smd-realtime__pages">
        {data.pages.length === 0 && <li className="smd-empty">{labels.none}</li>}
        {data.pages.map((p) => (
          <li key={p.key}>
            <span
              className="smd-realtime__bar"
              style={{ width: `${(p.visitors / max) * 100}%` }}
              aria-hidden="true"
            />
            <span className="smd-realtime__path">{p.key}</span>
            <strong>{p.visitors}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}
