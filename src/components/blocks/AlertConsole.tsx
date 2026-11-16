'use client'

import { useEffect, useRef, useState } from 'react'

type Event = { severity: string; title: string; technique?: string | null; host?: string | null }
type Metric = { label: string; value: string; animate?: string | null }

type Props = {
  title?: string | null
  badge?: string | null
  events: Event[]
  metrics: Metric[]
  locale: 'id' | 'en'
  ariaLabel: string
}

type Row = Event & { key: number; time: string }

const SEV_LABEL: Record<string, string> = { high: 'HIGH', medium: 'MED', low: 'LOW' }
const VISIBLE_ROWS = 7

const parseNumber = (v: string) => Number(v.replace(/[^\d]/g, '')) || 0

/**
 * Ilustrasi antrean alert. Data simulasi dari CMS diputar bergiliran;
 * berhenti bila pengguna memilih reduced motion atau tab tidak terlihat.
 */
export function AlertConsole({ title, badge, events, metrics, locale, ariaLabel }: Props) {
  const [rows, setRows] = useState<Row[]>([])
  const [values, setValues] = useState(() => metrics.map((m) => m.value))
  const cursor = useRef(0)
  const seq = useRef(0)
  const fmt = new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US')

  useEffect(() => {
    if (!events.length) return
    const stamp = () => new Date().toTimeString().slice(0, 8)
    const next = (): Row => {
      const e = events[cursor.current++ % events.length]
      return { ...e, key: seq.current++, time: stamp() }
    }
    setRows(Array.from({ length: Math.min(VISIBLE_ROWS - 1, events.length) }, next).reverse())

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      setRows((prev) => [next(), ...prev].slice(0, VISIBLE_ROWS))
      setValues((prev) =>
        prev.map((v, i) => {
          const m = metrics[i]
          if (m.animate === 'fluctuate') {
            const base = parseNumber(m.value)
            return fmt.format(Math.round(base * (0.9 + Math.random() * 0.2)))
          }
          if (m.animate === 'increment') return fmt.format(parseNumber(v) + 1)
          return v
        }),
      )
    }, 2800)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, metrics, locale])

  return (
    <figure className="console" aria-label={ariaLabel}>
      <div className="console__bar">
        <span className="console__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        {title && <span className="console__title">{title}</span>}
        {badge && <span className="console__badge">{badge}</span>}
      </div>
      <ol className="console__feed" aria-live="off">
        {rows.map((r) => (
          <li key={r.key} className="console__row">
            <time className="console__time">{r.time}</time>
            <span className={`console__sev console__sev--${r.severity}`}>
              {SEV_LABEL[r.severity] ?? r.severity}
            </span>
            <span className="console__msg">
              {r.title}
              {(r.technique || r.host) && (
                <small>{[r.technique, r.host].filter(Boolean).join(' · ')}</small>
              )}
            </span>
          </li>
        ))}
      </ol>
      {metrics.length > 0 && (
        <div className="console__metrics">
          {metrics.map((m, i) => (
            <div key={m.label}>
              <span>{m.label}</span>
              <strong>{values[i]}</strong>
            </div>
          ))}
        </div>
      )}
    </figure>
  )
}
