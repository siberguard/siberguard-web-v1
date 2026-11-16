import { z } from 'zod'

export const EVENT_TYPES = [
  'pageview',
  'page_leave',
  'section_view',
  'cta_click',
  'copy_command',
  'lang_switch',
  'theme_switch',
  'form_view',
  'form_start',
  'form_step',
  'form_submit',
  'form_error',
] as const

export type EventType = (typeof EVENT_TYPES)[number]

const short = (max: number) => z.string().trim().max(max)

/** Bentuk event yang dikirim tracker browser. Nama field dibuat pendek agar payload kecil. */
export const trackEventSchema = z.object({
  t: z.enum(EVENT_TYPES),
  p: short(300).regex(/^\//), // path
  l: z.enum(['id', 'en']).optional(), // locale
  sid: short(40).regex(/^[a-z0-9]+$/i), // session id (sessionStorage)
  r: short(300).optional(), // referrer (host saja disimpan)
  sw: z.number().int().min(0).max(10000).optional(), // lebar layar
  th: z.enum(['light', 'dark']).optional(),
  u: z
    .object({ s: short(100).optional(), m: short(100).optional(), c: short(100).optional() })
    .optional(),
  n: short(120).optional(), // nama: id section, label CTA, OS, dll.
  d: z
    .number()
    .int()
    .min(0)
    .max(6 * 60 * 60 * 1000)
    .optional(), // durasi aktif (ms)
  x: z.record(z.string().max(30), z.union([short(120), z.number()])).optional(),
})

export const trackBatchSchema = z.object({ e: z.array(trackEventSchema).min(1).max(20) })

export type TrackEvent = z.infer<typeof trackEventSchema>

/** Dokumen yang tersimpan di analytics_events. */
export type StoredEvent = {
  ts: Date
  m: { type: EventType; locale: string }
  vid: string
  sid: string
  path: string
  ref?: string
  utm?: { s?: string; m?: string; c?: string }
  dev: string
  br: string
  os: string
  cc?: string
  rg?: string
  ct?: string
  sw?: number
  th?: string
  n?: string
  d?: number
  x?: Record<string, string | number>
}

/** Simpan host referrer saja; kunjungan internal dan referrer kosong dianggap "langsung". */
export function referrerHost(ref: string | undefined, ownHost: string | null): string | undefined {
  if (!ref) return undefined
  try {
    const host = new URL(ref).hostname.replace(/^www\./, '')
    if (!host || (ownHost && host === ownHost.replace(/^www\./, ''))) return undefined
    return host
  } catch {
    return undefined
  }
}
