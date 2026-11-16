'use client'

import { useMemo, useSyncExternalStore } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Point = { day: string; visitors: number; pageviews: number; leads: number }

const FALLBACK = {
  s1: '#2a78d6',
  s2: '#eb6834',
  grid: '#e5e7eb',
  axis: '#6b7280',
  surface: '#ffffff',
}

function subscribeTheme(onChange: () => void) {
  const obs = new MutationObserver(onChange)
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => obs.disconnect()
}

/** Baca warna seri dari CSS variable agar ikut tema admin (terang/gelap). */
function useChartColors() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.dataset.theme ?? 'light',
    () => 'server',
  )
  return useMemo(() => {
    if (theme === 'server') return FALLBACK
    const s = getComputedStyle(document.documentElement)
    const v = (n: string, f: string) => s.getPropertyValue(n).trim() || f
    return {
      s1: v('--smd-series-1', FALLBACK.s1),
      s2: v('--smd-series-2', FALLBACK.s2),
      grid: v('--smd-grid', FALLBACK.grid),
      axis: v('--smd-axis-text', FALLBACK.axis),
      surface: v('--smd-surface', FALLBACK.surface),
    }
  }, [theme])
}

const nf = new Intl.NumberFormat('id-ID')
const dayLabel = (d: string) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${d}T00:00:00Z`),
  )

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="smd-tooltip">
      <div className="smd-tooltip__title">{label ? dayLabel(label) : ''}</div>
      {payload.map((p) => (
        <div key={p.name} className="smd-tooltip__row">
          <i className="smd-dot" style={{ background: p.color }} aria-hidden="true" />
          <span>{p.name}</span>
          <strong>{nf.format(p.value)}</strong>
        </div>
      ))}
    </div>
  )
}

/** Pengunjung unik & tampilan halaman per hari (satu sumbu: keduanya hitungan). */
export function TrafficChart({ data }: { data: Point[] }) {
  const c = useChartColors()
  return (
    <div className="smd-chart">
      <div className="smd-legend" aria-hidden="true">
        <span>
          <i className="smd-line-key" style={{ background: c.s1 }} />
          Pengunjung unik
        </span>
        <span>
          <i className="smd-line-key" style={{ background: c.s2 }} />
          Tampilan halaman
        </span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={dayLabel}
            tick={{ fill: c.axis, fontSize: 12 }}
            axisLine={{ stroke: c.grid }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: c.axis, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v) => nf.format(v)}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: c.axis, strokeWidth: 1 }} />
          <Line
            type="monotone"
            name="Pengunjung unik"
            dataKey="visitors"
            stroke={c.s1}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: c.surface, strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            name="Tampilan halaman"
            dataKey="pageviews"
            stroke={c.s2}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: c.surface, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Lead masuk per hari — grafik terpisah (skala berbeda dari pengunjung, tanpa sumbu ganda). */
export function LeadsChart({ data }: { data: Point[] }) {
  const c = useChartColors()
  return (
    <div className="smd-chart">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }} barCategoryGap={2}>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={dayLabel}
            tick={{ fill: c.axis, fontSize: 12 }}
            axisLine={{ stroke: c.grid }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: c.axis, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: c.grid, opacity: 0.5 }} />
          <Bar name="Lead" dataKey="leads" fill={c.s1} maxBarSize={24} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
