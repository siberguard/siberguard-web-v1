import type { Endpoint } from 'payload'

import { getDb } from '@/lib/analytics/storage'

/** GET /api/health — untuk uptime monitor eksternal. Tidak membuka detail internal. */
export const healthEndpoint: Endpoint = {
  path: '/health',
  method: 'get',
  handler: async (req) => {
    const started = performance.now()
    try {
      await getDb(req.payload).command({ ping: 1 })
      const dbMs = Math.round(performance.now() - started)
      return Response.json(
        { status: 'ok', db: 'ok', dbMs },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    } catch {
      return Response.json(
        { status: 'error', db: 'down' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      )
    }
  },
}
