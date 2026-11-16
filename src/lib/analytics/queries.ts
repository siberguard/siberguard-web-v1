import type { Db, Document } from 'mongodb'

import type { EventType } from './events'
import { EVENTS_COLLECTION, SUBMISSIONS_COLLECTION } from './storage'

export const TZ = 'Asia/Jakarta'

export type Range = { from: Date; to: Date }
export type Filters = { locale?: string; device?: string; source?: string }

const RANGE_PRESETS = { today: 0, '7d': 6, '30d': 29, '90d': 89 } as const
export type RangePreset = keyof typeof RANGE_PRESETS

/** Rentang berdasarkan tanggal WIB: "7d" = 7 hari kalender terakhir termasuk hari ini. */
export function resolveRange(preset: string | undefined): Range & { preset: RangePreset } {
  const key = (preset && preset in RANGE_PRESETS ? preset : '30d') as RangePreset
  const now = new Date()
  const todayWib = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(now)
  const startOfToday = new Date(`${todayWib}T00:00:00+07:00`)
  const from = new Date(startOfToday.getTime() - RANGE_PRESETS[key] * 86_400_000)
  return { from, to: now, preset: key }
}

function match(range: Range, types?: EventType[], filters: Filters = {}): Document {
  const m: Document = { ts: { $gte: range.from, $lt: range.to } }
  if (types) m['m.type'] = types.length === 1 ? types[0] : { $in: types }
  if (filters.locale) m['m.locale'] = filters.locale
  if (filters.device) m.dev = filters.device
  if (filters.source) m.ref = filters.source === '(langsung)' ? null : filters.source
  return m
}

const events = (db: Db) => db.collection(EVENTS_COLLECTION)

export type OverviewStats = {
  visitors: number
  sessions: number
  pageviews: number
  engagedSessions: number
  engagementRate: number
  avgEngagedSeconds: number
}

export async function getOverview(db: Db, range: Range, filters?: Filters): Promise<OverviewStats> {
  const [counts] = await events(db)
    .aggregate([
      { $match: match(range, ['pageview'], filters) },
      {
        $facet: {
          visitors: [{ $group: { _id: '$vid' } }, { $count: 'n' }],
          sessions: [{ $group: { _id: '$sid' } }, { $count: 'n' }],
          pageviews: [{ $count: 'n' }],
        },
      },
    ])
    .toArray()

  // Sesi "aktif": ≥10 detik aktif, ≥2 halaman, atau ada interaksi berarti.
  // Lebih jujur daripada bounce rate untuk situs satu halaman.
  const [eng] = await events(db)
    .aggregate([
      { $match: match(range, undefined, filters) },
      {
        $group: {
          _id: '$sid',
          pv: { $sum: { $cond: [{ $eq: ['$m.type', 'pageview'] }, 1, 0] } },
          dur: { $sum: { $ifNull: ['$d', 0] } },
          act: {
            $sum: {
              $cond: [{ $in: ['$m.type', ['cta_click', 'copy_command', 'form_start']] }, 1, 0],
            },
          },
        },
      },
      { $match: { pv: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          sessions: { $sum: 1 },
          engaged: {
            $sum: {
              $cond: [
                { $or: [{ $gte: ['$dur', 10_000] }, { $gte: ['$pv', 2] }, { $gt: ['$act', 0] }] },
                1,
                0,
              ],
            },
          },
          totalDur: { $sum: '$dur' },
        },
      },
    ])
    .toArray()

  const n = (arr?: { n: number }[]) => arr?.[0]?.n ?? 0
  const sessions = n(counts?.sessions)
  const engaged = eng?.engaged ?? 0
  return {
    visitors: n(counts?.visitors),
    sessions,
    pageviews: n(counts?.pageviews),
    engagedSessions: engaged,
    engagementRate: sessions ? engaged / sessions : 0,
    avgEngagedSeconds: eng?.sessions ? Math.round((eng.totalDur ?? 0) / eng.sessions / 1000) : 0,
  }
}

/** Daftar tanggal WIB (YYYY-MM-DD) dalam rentang, untuk mengisi hari tanpa data dengan 0. */
export function daysInRange(range: Range): string[] {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ })
  const days: string[] = []
  for (let t = range.from.getTime(); t <= range.to.getTime(); t += 86_400_000)
    days.push(fmt.format(new Date(t)))
  const last = fmt.format(range.to)
  if (days[days.length - 1] !== last) days.push(last)
  return [...new Set(days)]
}

export type DailyPoint = { day: string; visitors: number; pageviews: number; leads: number }

export async function getDailySeries(
  db: Db,
  range: Range,
  filters?: Filters,
): Promise<DailyPoint[]> {
  const dayExpr = (field: string) => ({
    $dateToString: { format: '%Y-%m-%d', date: field, timezone: TZ },
  })
  const [traffic, leads] = await Promise.all([
    events(db)
      .aggregate<{ _id: string; visitors: number; pageviews: number }>([
        { $match: match(range, ['pageview'], filters) },
        { $group: { _id: { day: dayExpr('$ts'), vid: '$vid' }, pv: { $sum: 1 } } },
        { $group: { _id: '$_id.day', visitors: { $sum: 1 }, pageviews: { $sum: '$pv' } } },
      ])
      .toArray(),
    db
      .collection(SUBMISSIONS_COLLECTION)
      .aggregate<{ _id: string; n: number }>([
        { $match: { createdAt: { $gte: range.from, $lt: range.to } } },
        { $group: { _id: dayExpr('$createdAt'), n: { $sum: 1 } } },
      ])
      .toArray(),
  ])
  const t = new Map(traffic.map((d) => [d._id, d]))
  const l = new Map(leads.map((d) => [d._id, d.n]))
  return daysInRange(range).map((day) => ({
    day,
    visitors: t.get(day)?.visitors ?? 0,
    pageviews: t.get(day)?.pageviews ?? 0,
    leads: l.get(day) ?? 0,
  }))
}

export type BreakdownRow = { key: string; visitors: number; events: number }

/** Top-N untuk satu dimensi (path, ref, cc, dev, br, os, m.locale, th, n, utm.c …). */
export async function getBreakdown(
  db: Db,
  range: Range,
  field: string,
  opts: { type?: EventType; limit?: number; filters?: Filters; emptyLabel?: string } = {},
): Promise<BreakdownRow[]> {
  const rows = await events(db)
    .aggregate<{ _id: string | null; visitors: number; events: number }>([
      { $match: match(range, [opts.type ?? 'pageview'], opts.filters) },
      { $group: { _id: { k: `$${field}`, v: '$vid' }, n: { $sum: 1 } } },
      { $group: { _id: '$_id.k', visitors: { $sum: 1 }, events: { $sum: '$n' } } },
      { $sort: { visitors: -1, events: -1 } },
      { $limit: opts.limit ?? 10 },
    ])
    .toArray()
  return rows.map((r) => ({
    key: r._id ?? opts.emptyLabel ?? '(tidak diketahui)',
    visitors: r.visitors,
    events: r.events,
  }))
}

export type Realtime = { visitors: number; pages: { key: string; visitors: number }[] }

export async function getRealtime(db: Db): Promise<Realtime> {
  const range = { from: new Date(Date.now() - 5 * 60_000), to: new Date() }
  const [res] = await events(db)
    .aggregate([
      { $match: match(range) },
      {
        $facet: {
          visitors: [{ $group: { _id: '$vid' } }, { $count: 'n' }],
          pages: [
            { $match: { 'm.type': 'pageview' } },
            { $group: { _id: { p: '$path', v: '$vid' } } },
            { $group: { _id: '$_id.p', visitors: { $sum: 1 } } },
            { $sort: { visitors: -1 } },
            { $limit: 5 },
          ],
        },
      },
    ])
    .toArray()
  return {
    visitors: res?.visitors?.[0]?.n ?? 0,
    pages: (res?.pages ?? []).map((p: { _id: string; visitors: number }) => ({
      key: p._id,
      visitors: p.visitors,
    })),
  }
}

export type FunnelStep = { key: string; sessions: number }

/**
 * Funnel per sesi: kunjungan → lihat form → mulai isi → langkah 2..N → terkirim.
 * `form_step` membawa x.step = nomor langkah yang dicapai (1-based).
 */
export async function getFunnel(
  db: Db,
  range: Range,
  steps: number,
  filters?: Filters,
): Promise<FunnelStep[]> {
  const stepConds: Document = {}
  for (let k = 2; k <= steps; k++)
    stepConds[`step${k}`] = { $sum: { $cond: [{ $gte: ['$maxStep', k] }, 1, 0] } }

  const [res] = await events(db)
    .aggregate([
      {
        $match: match(
          range,
          ['pageview', 'form_view', 'form_start', 'form_step', 'form_submit'],
          filters,
        ),
      },
      {
        $group: {
          _id: '$sid',
          types: { $addToSet: '$m.type' },
          maxStep: {
            $max: {
              $cond: [
                { $eq: ['$m.type', 'form_step'] },
                { $convert: { input: '$x.step', to: 'int', onError: 0, onNull: 0 } },
                0,
              ],
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          visit: { $sum: { $cond: [{ $in: ['pageview', '$types'] }, 1, 0] } },
          view: { $sum: { $cond: [{ $in: ['form_view', '$types'] }, 1, 0] } },
          start: { $sum: { $cond: [{ $in: ['form_start', '$types'] }, 1, 0] } },
          ...stepConds,
          submit: { $sum: { $cond: [{ $in: ['form_submit', '$types'] }, 1, 0] } },
        },
      },
    ])
    .toArray()

  const out: FunnelStep[] = [
    { key: 'visit', sessions: res?.visit ?? 0 },
    { key: 'view', sessions: res?.view ?? 0 },
    { key: 'start', sessions: res?.start ?? 0 },
  ]
  for (let k = 2; k <= steps; k++) out.push({ key: `step${k}`, sessions: res?.[`step${k}`] ?? 0 })
  out.push({ key: 'submit', sessions: res?.submit ?? 0 })
  return out
}
