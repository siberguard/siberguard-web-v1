'use client'

import { useMemo, useSyncExternalStore } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
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

type ChartLabels = { visitors: string; pageviews: string; leads: string }

const fmtFor = (locale: string) => {
  const nf = new Intl.NumberFormat(locale)
  const df = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' })
  return {
    num: (v: number) => nf.format(v),
    day: (d: string) => df.format(new Date(`${d}T00:00:00Z`)),
  }
}

function ChartTooltip({
  active,
  payload,
  label,
  locale,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
  locale: string
}) {
  if (!active || !payload?.length) return null
  const f = fmtFor(locale)
  return (
    <div className="smd-tooltip">
      <div className="smd-tooltip__title">{label ? f.day(label) : ''}</div>
      {payload.map((p) => (
        <div key={p.name} className="smd-tooltip__row">
          <i className="smd-dot" style={{ background: p.color }} aria-hidden="true" />
          <span>{p.name}</span>
          <strong>{f.num(p.value)}</strong>
        </div>
      ))}
    </div>
  )
}

/** Pengunjung unik & tampilan halaman per hari (satu sumbu: keduanya hitungan). Area tipis 10%. */
export function TrafficChart({
  data,
  labels,
  locale,
}: {
  data: Point[]
  labels: ChartLabels
  locale: string
}) {
  const c = useChartColors()
  const f = fmtFor(locale)
  return (
    <div className="smd-chart">
      <div className="smd-legend" aria-hidden="true">
        <span>
          <i className="smd-line-key" style={{ background: c.s1 }} />
          {labels.visitors}
        </span>
        <span>
          <i className="smd-line-key" style={{ background: c.s2 }} />
          {labels.pageviews}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={272}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="smd-fill-1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.s1} stopOpacity={0.18} />
              <stop offset="100%" stopColor={c.s1} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="smd-fill-2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.s2} stopOpacity={0.1} />
              <stop offset="100%" stopColor={c.s2} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={f.day}
            tick={{ fill: c.axis, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
            dy={6}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: c.axis, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={f.num}
          />
          <Tooltip
            content={<ChartTooltip locale={locale} />}
            cursor={{ stroke: c.axis, strokeWidth: 1, strokeOpacity: 0.5 }}
          />
          <Area
            type="monotone"
            name={labels.pageviews}
            dataKey="pageviews"
            stroke={c.s2}
            strokeWidth={2}
            fill="url(#smd-fill-2)"
            dot={false}
            activeDot={{ r: 4, stroke: c.surface, strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            name={labels.visitors}
            dataKey="visitors"
            stroke={c.s1}
            strokeWidth={2}
            fill="url(#smd-fill-1)"
            dot={false}
            activeDot={{ r: 4, stroke: c.surface, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Lead masuk per hari — grafik terpisah (skala berbeda dari pengunjung, tanpa sumbu ganda). */
export function LeadsChart({
  data,
  labels,
  locale,
}: {
  data: Point[]
  labels: ChartLabels
  locale: string
}) {
  const c = useChartColors()
  const f = fmtFor(locale)
  return (
    <div className="smd-chart">
      <ResponsiveContainer width="100%" height={184}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }} barCategoryGap={2}>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={f.day}
            tick={{ fill: c.axis, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
            dy={6}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: c.axis, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            content={<ChartTooltip locale={locale} />}
            cursor={{ fill: c.grid, opacity: 0.5 }}
          />
          <Bar
            name={labels.leads}
            dataKey="leads"
            fill={c.s1}
            maxBarSize={20}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
