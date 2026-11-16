import Link from 'next/link'
import type { ReactNode } from 'react'

const nf = new Intl.NumberFormat('id-ID')
export const fmt = (n: number) => nf.format(n)
export const pct = (n: number) => `${Math.round(n * 100)}%`

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className="smd-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="smd-header__actions">{actions}</div>}
    </header>
  )
}

/** Pilihan rentang waktu — satu baris filter di atas semua grafik yang dipengaruhinya. */
export function RangeTabs({
  basePath,
  active,
  extra = '',
}: {
  basePath: string
  active: string
  extra?: string
}) {
  const presets = [
    ['today', 'Hari ini'],
    ['7d', '7 hari'],
    ['30d', '30 hari'],
    ['90d', '90 hari'],
  ] as const
  return (
    <nav className="smd-range" aria-label="Rentang waktu">
      {presets.map(([key, label]) => (
        <Link
          key={key}
          href={`${basePath}?range=${key}${extra}`}
          aria-current={active === key ? 'page' : undefined}
          className="smd-range__item"
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}

export function Card({
  title,
  subtitle,
  children,
  className = '',
  action,
}: {
  title?: string
  subtitle?: string
  children: ReactNode
  className?: string
  action?: ReactNode
}) {
  return (
    <section className={`smd-card ${className}`.trim()}>
      {(title || action) && (
        <div className="smd-card__head">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

/** Stat tile: label · nilai · keterangan opsional. Angka besar memakai angka proporsional. */
export function StatTile({
  label,
  value,
  note,
  marker,
}: {
  label: string
  value: string
  note?: string
  marker?: string
}) {
  return (
    <div className="smd-stat">
      <span className="smd-stat__label">
        {marker && <i className="smd-dot" style={{ background: marker }} aria-hidden="true" />}
        {label}
      </span>
      <strong className="smd-stat__value">{value}</strong>
      {note && <span className="smd-stat__note">{note}</span>}
    </div>
  )
}

/**
 * Daftar batang horizontal yang sekaligus tabel (nilai selalu terbaca tanpa hover).
 * Satu seri → satu warna; panjang batang relatif terhadap baris terbesar.
 */
export function BarList({
  rows,
  valueLabel = 'Pengunjung',
  keyLabel = 'Nama',
  empty = 'Belum ada data pada rentang ini.',
  total,
}: {
  rows: { key: string; value: number; hint?: string }[]
  valueLabel?: string
  keyLabel?: string
  empty?: string
  /** Bila diisi, persentase terhadap total ditampilkan. */
  total?: number
}) {
  if (!rows.length) return <p className="smd-empty">{empty}</p>
  const max = Math.max(...rows.map((r) => r.value), 1)
  return (
    <table className="smd-bars">
      <thead className="sr-only">
        <tr>
          <th scope="col">{keyLabel}</th>
          <th scope="col">{valueLabel}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key} title={`${r.key}: ${fmt(r.value)}`}>
            <th scope="row">
              <span
                className="smd-bars__fill"
                style={{ width: `${(r.value / max) * 100}%` }}
                aria-hidden="true"
              />
              <span className="smd-bars__key">{r.key}</span>
              {r.hint && <span className="smd-bars__hint">{r.hint}</span>}
            </th>
            <td>
              {fmt(r.value)}
              {total ? (
                <span className="smd-bars__pct"> {pct(total ? r.value / total : 0)}</span>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const FUNNEL_LABELS: Record<string, string> = {
  visit: 'Mengunjungi situs',
  view: 'Melihat formulir',
  start: 'Mulai mengisi',
  submit: 'Mengirim kuesioner',
}

/** Funnel per sesi: batang dengan persentase terhadap langkah pertama dan langkah sebelumnya. */
export function Funnel({ steps }: { steps: { key: string; sessions: number }[] }) {
  const first = steps[0]?.sessions || 0
  if (!first) return <p className="smd-empty">Belum ada kunjungan pada rentang ini.</p>
  return (
    <table className="smd-funnel">
      <thead className="sr-only">
        <tr>
          <th scope="col">Tahap</th>
          <th scope="col">Sesi</th>
          <th scope="col">Dari tahap sebelumnya</th>
        </tr>
      </thead>
      <tbody>
        {steps.map((s, i) => {
          const prev = i > 0 ? steps[i - 1].sessions : s.sessions
          const label = FUNNEL_LABELS[s.key] ?? `Mencapai langkah ${s.key.replace('step', '')}`
          return (
            <tr key={s.key}>
              <th scope="row">
                <span className="smd-funnel__label">{label}</span>
                <span className="smd-funnel__track">
                  <span
                    className="smd-funnel__fill"
                    style={{ width: `${(s.sessions / first) * 100}%` }}
                  />
                </span>
              </th>
              <td className="smd-funnel__value">{fmt(s.sessions)}</td>
              <td className="smd-funnel__rate">
                {i === 0 ? '—' : prev ? pct(s.sessions / prev) : '0%'}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export const TIER_META: Record<string, { label: string; color: string }> = {
  hot: { label: 'Hot', color: 'var(--smd-tier-hot)' },
  warm: { label: 'Warm', color: 'var(--smd-tier-warm)' },
  cold: { label: 'Cold', color: 'var(--smd-tier-cold)' },
  survey: { label: 'Survei', color: 'var(--smd-tier-survey)' },
}

export const STATUS_LABEL: Record<string, string> = {
  new: 'Baru',
  contacted: 'Dihubungi',
  qualified: 'Terkualifikasi',
  poc: 'Ikut POC',
  customer: 'Berlangganan',
  closed: 'Tidak lanjut',
}

export function TierBadge({ tier }: { tier?: string | null }) {
  const meta = TIER_META[tier ?? ''] ?? { label: tier ?? '—', color: 'var(--smd-tier-survey)' }
  return (
    <span className="smd-tier">
      <i className="smd-dot" style={{ background: meta.color }} aria-hidden="true" />
      {meta.label}
    </span>
  )
}

export function NoAccess({ message }: { message: string }) {
  return (
    <div className="smd-card">
      <p className="smd-empty">{message}</p>
    </div>
  )
}
