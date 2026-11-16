import type { Endpoint } from 'payload'

import { getRealtime } from '@/lib/analytics/queries'
import { getDb } from '@/lib/analytics/storage'

/** GET /api/analytics/realtime — polling panel realtime di dashboard (butuh login). */
export const analyticsSummaryEndpoint: Endpoint = {
  path: '/analytics/realtime',
  method: 'get',
  handler: async (req) => {
    if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const data = await getRealtime(getDb(req.payload))
    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } })
  },
}
