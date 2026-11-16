import { isbot } from 'isbot'
import type { Endpoint } from 'payload'

import { lookupGeo, parseUserAgent, visitorId } from '@/lib/analytics/enrich'
import { referrerHost, trackBatchSchema, type StoredEvent } from '@/lib/analytics/events'
import { EVENTS_COLLECTION, getDb } from '@/lib/analytics/storage'
import { getAnalyticsSettings } from '@/lib/cms/settingsCache'
import { clientLimit, getClientIp, rateLimit } from '@/lib/security/request'

const noContent = () =>
  new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })

/**
 * POST /api/ev — menerima event dari tracker browser (sendBeacon).
 * Selalu membalas 204 agar tracker tidak pernah mengganggu pengunjung.
 */
export const collectEndpoint: Endpoint = {
  path: '/ev',
  method: 'post',
  handler: async (req) => {
    const ip = getClientIp(req.headers)
    if (!rateLimit(`ev:${ip}`, clientLimit(ip, 120, 3000), 60_000))
      return new Response(null, { status: 429 })

    // Admin yang sedang login tidak dihitung sebagai pengunjung.
    if (req.user) return noContent()

    const ua = req.headers.get('user-agent') ?? ''
    if (!ua || isbot(ua)) return noContent()

    let parsed
    try {
      const raw = await req.text?.()
      if (!raw || raw.length > 16_000) return noContent()
      parsed = trackBatchSchema.safeParse(JSON.parse(raw))
    } catch {
      return noContent()
    }
    if (!parsed.success) return noContent()

    const payload = req.payload
    const settings = await getAnalyticsSettings(payload)
    if (!settings.enabled || settings.excludedIps.has(ip)) return noContent()

    const [vid, geo] = await Promise.all([visitorId(payload, ip, ua), lookupGeo(ip, req.headers)])
    const device = parseUserAgent(ua)
    const ownHost = req.headers.get('host')?.split(':')[0] ?? null
    const now = Date.now()

    const docs: StoredEvent[] = parsed.data.e
      .filter((e) => !e.p.startsWith('/admin') && !e.p.startsWith('/api'))
      .map((e, i) => ({
        ts: new Date(now + i), // urutan stabil untuk event dalam satu batch
        m: { type: e.t, locale: e.l ?? 'id' },
        vid,
        sid: e.sid,
        path: e.p.split('?')[0].split('#')[0] || '/',
        ref: referrerHost(e.r, ownHost),
        utm: e.u && (e.u.s || e.u.m || e.u.c) ? e.u : undefined,
        ...device,
        ...geo,
        sw: e.sw,
        th: e.th,
        n: e.n,
        d: e.d,
        x: e.x,
      }))

    if (docs.length) {
      try {
        await getDb(payload)
          .collection<StoredEvent>(EVENTS_COLLECTION)
          .insertMany(docs, { ordered: false, ignoreUndefined: true })
      } catch (err) {
        payload.logger.error({ err }, '[analytics] gagal menyimpan event')
      }
    }
    return noContent()
  },
}
