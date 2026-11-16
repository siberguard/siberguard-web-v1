import Link from 'next/link'
import type { ReactNode } from 'react'

import type { AdminText } from '../i18n'
import { Glyph, type GlyphName } from './icons'

export const formatters = (t: AdminText) => {
  const nf = new Intl.NumberFormat(t.locale)
  return {
    num: (n: number) => nf.format(n),
    pct: (n: number) => `${Math.round(n * 100)}%`,
  }
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className="smd-header">
      <div className="smd-header__text">
        {eyebrow && <p className="smd-header__eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="smd-header__desc">{description}</p>}
      </div>
      {actions && <div className="smd-header__actions">{actions}</div>}
    </header>
  )
}

/** Segmented control rentang waktu — satu baris filter di atas semua grafik. */
export function RangeTabs({
  basePath,
  active,
  extra = '',
  t,
}: {
  basePath: string
  active: string
  extra?: string
  t: AdminText
}) {
  return (
    <nav className="smd-seg smd-seg--lg" aria-label={t.range.label}>
      {(['today', '7d', '30d', '90d'] as const).map((key) => (
        <Link
          key={key}
          href={`${basePath}?range=${key}${extra}`}
          aria-current={active === key ? 'page' : undefined}
          className="smd-seg__btn smd-seg__btn--text"
        >
          {t.range[key]}
        </Link>
      ))}
    </nav>
  )
}

export function Card({
  title,
  subtitle,
  icon,
  children,
  className = '',
  action,
}: {
  title?: string
  subtitle?: string
  icon?: GlyphName
  children: ReactNode
  className?: string
  action?: ReactNode
}) {
  return (
    <section className={`smd-card ${className}`.trim()}>
      {(title || action) && (
        <div className="smd-card__head">
          {icon && (
            <span className="smd-card__icon" aria-hidden="true">
              <Glyph name={icon} size={16} />
            </span>
          )}
          <div className="smd-card__titles">
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action && <div className="smd-card__action">{action}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

/** Sparkline kecil (tanpa sumbu) — tren dalam warna redam, titik akhir beraksen. */
export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const w = 120
  const h = 32
  const max = Math.max(...values, 1)
  const step = w / (values.length - 1)
  const pts = values.map((v, i) => [i * step, h - 3 - (v / max) * (h - 6)] as const)
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('')
  const [lx, ly] = pts[pts.length - 1]
  return (
    <svg
      className="smd-spark"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={`${d}L${w} ${h}L0 ${h}Z`} className="smd-spark__area" />
      <path d={d} className="smd-spark__line" />
      <circle cx={lx} cy={ly} r={2.5} className="smd-spark__dot" />
    </svg>
  )
}

export type Delta = { change: number | null; goodWhenUp?: boolean }

/** Perubahan vs periode sebelumnya: panah + angka + teks (tidak hanya warna). */
export function DeltaBadge({ delta, t }: { delta: Delta; t: AdminText }) {
  if (delta.change === null) return null
  const up = delta.change > 0
  const flat = Math.abs(delta.change) < 0.005
  const good = flat ? null : up === (delta.goodWhenUp ?? true)
  return (
    <span
      className={`smd-delta ${flat ? 'is-flat' : good ? 'is-good' : 'is-bad'}`}
      title={t.vsPrev}
    >
      {!flat && <Glyph name={up ? 'arrowUp' : 'arrowDown'} size={12} />}
      {flat
        ? '±0%'
        : delta.change >= 1
          ? `${new Intl.NumberFormat(t.locale, { maximumFractionDigits: 1 }).format(1 + delta.change)}×`
          : `${Math.round(Math.abs(delta.change) * 100)}%`}
      <span className="sr-only"> {t.vsPrev}</span>
    </span>
  )
}

/** Kartu KPI: ikon, label, nilai, perubahan, dan sparkline opsional. */
export function Kpi({
  icon,
  label,
  value,
  note,
  delta,
  spark,
  t,
  tone = 'blue',
}: {
  icon: GlyphName
  label: string
  value: string
  note?: string
  delta?: Delta
  spark?: number[]
  t: AdminText
  tone?: 'blue' | 'red' | 'green' | 'amber' | 'violet' | 'slate'
}) {
  return (
    <div className={`smd-kpi smd-kpi--${tone}`}>
      <div className="smd-kpi__top">
        <span className="smd-kpi__icon" aria-hidden="true">
          <Glyph name={icon} size={18} />
        </span>
        <span className="smd-kpi__label">{label}</span>
      </div>
      <div className="smd-kpi__body">
        <strong className="smd-kpi__value">{value}</strong>
        {delta && <DeltaBadge delta={delta} t={t} />}
      </div>
      <div className="smd-kpi__foot">
        {note ? <span className="smd-kpi__note">{note}</span> : <span />}
        {spark && <Sparkline values={spark} />}
      </div>
    </div>
  )
}

/** Stat ringkas (dipakai di panel tier & sistem). */
export function MiniStat({
  label,
  value,
  note,
  marker,
  icon,
}: {
  label: string
  value: string
  note?: string
  marker?: string
  icon?: GlyphName
}) {
  return (
    <div className="smd-mini">
      <span className="smd-mini__label">
        {icon && <Glyph name={icon} size={15} />}
        {marker && <i className="smd-dot" style={{ background: marker }} aria-hidden="true" />}
        {label}
      </span>
      <strong className="smd-mini__value">{value}</strong>
      {note && <span className="smd-mini__note">{note}</span>}
    </div>
  )
}

/**
 * Daftar batang horizontal yang sekaligus tabel (nilai selalu terbaca tanpa hover).
 * Satu seri → satu warna; panjang batang relatif terhadap baris terbesar.
 */
export function BarList({
  rows,
  t,
  valueLabel,
  keyLabel,
  empty,
  total,
}: {
  rows: { key: string; value: number; hint?: string }[]
  t: AdminText
  valueLabel?: string
  keyLabel?: string
  empty?: string
  total?: number
}) {
  const f = formatters(t)
  if (!rows.length) return <p className="smd-empty">{empty ?? t.empty}</p>
  const max = Math.max(...rows.map((r) => r.value), 1)
  return (
    <table className="smd-bars">
      <thead className="sr-only">
        <tr>
          <th scope="col">{keyLabel ?? t.analytics.name}</th>
          <th scope="col">{valueLabel ?? t.analytics.visitors}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key} title={`${r.key}: ${f.num(r.value)}`}>
            <th scope="row">
              <span
                className="smd-bars__fill"
                style={{ width: `${Math.max((r.value / max) * 100, 1.5)}%` }}
                aria-hidden="true"
              />
              <span className="smd-bars__key">{r.key}</span>
              {r.hint && <span className="smd-bars__hint">{r.hint}</span>}
            </th>
            <td>
              <span className="smd-bars__value">{f.num(r.value)}</span>
              {total ? (
                <span className="smd-bars__pct">{f.pct(total ? r.value / total : 0)}</span>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Funnel per sesi: batang dengan persentase terhadap langkah sebelumnya. */
export function Funnel({ steps, t }: { steps: { key: string; sessions: number }[]; t: AdminText }) {
  const f = formatters(t)
  const first = steps[0]?.sessions || 0
  if (!first) return <p className="smd-empty">{t.funnel.empty}</p>
  const labelOf = (key: string) =>
    key === 'visit' || key === 'view' || key === 'start' || key === 'submit'
      ? t.funnel[key]
      : t.funnel.step(key.replace('step', ''))
  return (
    <table className="smd-funnel">
      <thead className="sr-only">
        <tr>
          <th scope="col">{t.funnel.stage}</th>
          <th scope="col">{t.funnel.sessions}</th>
          <th scope="col">{t.funnel.fromPrev}</th>
        </tr>
      </thead>
      <tbody>
        {steps.map((s, i) => {
          const prev = i > 0 ? steps[i - 1].sessions : s.sessions
          return (
            <tr key={s.key} className={s.key === 'submit' ? 'is-goal' : ''}>
              <th scope="row">
                <span className="smd-funnel__row">
                  <span className="smd-funnel__n">{i + 1}</span>
                  <span className="smd-funnel__label">{labelOf(s.key)}</span>
                </span>
                <span className="smd-funnel__track">
                  <span
                    className="smd-funnel__fill"
                    style={{ width: `${Math.max((s.sessions / first) * 100, 0.8)}%` }}
                  />
                </span>
              </th>
              <td className="smd-funnel__value">{f.num(s.sessions)}</td>
              <td className="smd-funnel__rate">
                {i === 0 ? '—' : prev ? f.pct(s.sessions / prev) : '0%'}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export const TIER_COLOR: Record<string, string> = {
  hot: 'var(--smd-tier-hot)',
  warm: 'var(--smd-tier-warm)',
  cold: 'var(--smd-tier-cold)',
  survey: 'var(--smd-tier-survey)',
}

export function TierPill({ tier, t }: { tier?: string | null; t: AdminText }) {
  const key = tier ?? ''
  return (
    <span className={`smd-pill smd-pill--tier-${key || 'none'}`}>
      <i
        className="smd-dot"
        style={{ background: TIER_COLOR[key] ?? 'var(--smd-tier-survey)' }}
        aria-hidden="true"
      />
      {t.tier[key] ?? (tier || '—')}
    </span>
  )
}

export function StatusPill({ status, t }: { status?: string | null; t: AdminText }) {
  return (
    <span className={`smd-pill smd-pill--status smd-pill--${status ?? 'none'}`}>
      {t.status[status ?? ''] ?? status ?? '—'}
    </span>
  )
}

export function NoAccess({ message }: { message: string }) {
  return (
    <div className="smd-card smd-card--empty">
      <p className="smd-empty">{message}</p>
    </div>
  )
}

export function initials(name: string) {
  const parts = name
    .replace(/^\[[^\]]*\]\s*/, '')
    .split(/\s+/)
    .filter((p) => !/^(pt|cv|ud|tbk)\.?$/i.test(p))
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}
