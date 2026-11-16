'use client'

import { useEffect, useState } from 'react'

type Realtime = { visitors: number; pages: { key: string; visitors: number }[] }

/** Pengunjung aktif 5 menit terakhir, diperbarui setiap 30 detik. */
export function RealtimePanel({ initial }: { initial: Realtime }) {
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

  return (
    <div className="smd-realtime">
      <div className="smd-realtime__now">
        <span className="smd-realtime__label">
          <i className="smd-live" aria-hidden="true" />
          Pengunjung aktif (5 menit)
        </span>
        <strong>{data.visitors}</strong>
        <span className="smd-stat__note">
          {updated
            ? `Diperbarui ${updated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
            : 'Diperbarui otomatis tiap 30 detik'}
        </span>
      </div>
      <ul className="smd-realtime__pages">
        {data.pages.length === 0 && (
          <li className="smd-empty">Tidak ada halaman yang sedang dibuka.</li>
        )}
        {data.pages.map((p) => (
          <li key={p.key}>
            <span>{p.key}</span>
            <strong>{p.visitors}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}
