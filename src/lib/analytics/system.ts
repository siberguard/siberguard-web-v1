import type { Payload } from 'payload'

import { getDb, LOGS_COLLECTION, SUBMISSIONS_COLLECTION, type SystemLog } from './storage'

export type SystemStatus = {
  db: { ok: boolean; latencyMs: number | null; dataMb: number | null; storageMb: number | null }
  app: { version: string; node: string; uptimeHours: number; env: string }
  media: { files: number; totalMb: number }
  email: { lastStatus: string | null; lastAt: string | null; failures7d: number }
  logs: (SystemLog & { _id?: unknown })[]
}

/** Kesehatan sistem untuk panel dashboard. Setiap bagian gagal secara terpisah tanpa menjatuhkan halaman. */
export async function getSystemStatus(payload: Payload): Promise<SystemStatus> {
  const db = getDb(payload)
  const status: SystemStatus = {
    db: { ok: false, latencyMs: null, dataMb: null, storageMb: null },
    app: {
      version: process.env.APP_VERSION || process.env.npm_package_version || 'dev',
      node: process.version,
      uptimeHours: Math.round((process.uptime() / 3600) * 10) / 10,
      env: process.env.NODE_ENV ?? 'development',
    },
    media: { files: 0, totalMb: 0 },
    email: { lastStatus: null, lastAt: null, failures7d: 0 },
    logs: [],
  }

  try {
    const t = performance.now()
    await db.command({ ping: 1 })
    status.db.latencyMs = Math.round(performance.now() - t)
    status.db.ok = true
    const stats = await db.stats()
    status.db.dataMb = Math.round((stats.dataSize / 1048576) * 10) / 10
    status.db.storageMb = Math.round((stats.storageSize / 1048576) * 10) / 10
  } catch {}

  try {
    const [m] = await db
      .collection('media')
      .aggregate<{ n: number; size: number }>([
        { $group: { _id: null, n: { $sum: 1 }, size: { $sum: { $ifNull: ['$filesize', 0] } } } },
      ])
      .toArray()
    status.media = { files: m?.n ?? 0, totalMb: Math.round(((m?.size ?? 0) / 1048576) * 10) / 10 }
  } catch {}

  try {
    const last = await db
      .collection(SUBMISSIONS_COLLECTION)
      .find({ emailStatus: { $exists: true } }, { projection: { emailStatus: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .limit(1)
      .next()
    status.email.lastStatus = (last?.emailStatus as string) ?? null
    status.email.lastAt = last?.createdAt ? new Date(last.createdAt).toISOString() : null
    status.email.failures7d = await db
      .collection(LOGS_COLLECTION)
      .countDocuments({
        source: 'email',
        level: 'error',
        ts: { $gte: new Date(Date.now() - 7 * 86_400_000) },
      })
  } catch {}

  try {
    status.logs = await db
      .collection<SystemLog>(LOGS_COLLECTION)
      .find({ level: { $in: ['error', 'warn'] } })
      .sort({ $natural: -1 })
      .limit(6)
      .toArray()
  } catch {}

  return status
}
