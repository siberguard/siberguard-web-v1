import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { CreateCollectionOptions, Db } from 'mongodb'
import type { Payload } from 'payload'

export const EVENTS_COLLECTION = 'analytics_events'
export const SALTS_COLLECTION = 'analytics_salts'
export const LOGS_COLLECTION = 'system_logs'
/** Collection Mongo milik Payload untuk lead (nama = slug collection). */
export const SUBMISSIONS_COLLECTION = 'form-submissions'

/** Data mentah analytics disimpan ±13 bulan lalu dihapus otomatis oleh MongoDB. */
export const EVENT_RETENTION_DAYS = 400

export function getDb(payload: Payload): Db {
  const db = (payload.db as unknown as MongooseAdapter).connection.db
  if (!db) throw new Error('Koneksi MongoDB belum siap')
  return db as unknown as Db
}

/**
 * Membuat collection analytics bila belum ada:
 * - analytics_events: time-series + TTL (ringan untuk volume tinggi, tidak lewat Payload)
 * - analytics_salts: salt harian untuk hash pengunjung, dihapus setelah 2 hari
 * - system_logs: capped collection untuk error terbaru (ditampilkan di dashboard)
 */
/** Kode MongoDB 48 = NamespaceExists: instance lain (serverless) sudah membuatnya lebih dulu. */
const alreadyExists = (err: unknown) => (err as { code?: number })?.code === 48

/** Buat collection dengan opsi khusus; bila tidak didukung server, pakai collection biasa + TTL. */
async function createWithFallback(
  payload: Payload,
  name: string,
  options: CreateCollectionOptions,
  fallbackTtlSeconds: number,
) {
  const db = getDb(payload)
  try {
    await db.createCollection(name, options)
    return
  } catch (err) {
    if (alreadyExists(err)) return
    payload.logger.warn({ err }, `[analytics] ${name}: opsi khusus tidak didukung, memakai TTL biasa`)
  }
  try {
    await db.createCollection(name)
  } catch (err) {
    if (!alreadyExists(err)) throw err
  }
  await db.collection(name).createIndex({ ts: 1 }, { expireAfterSeconds: fallbackTtlSeconds })
}

/**
 * Dijalankan saat Payload start (setiap cold start di serverless). Idempoten dan aman
 * dijalankan bersamaan oleh beberapa instance.
 */
export async function ensureAnalyticsCollections(payload: Payload) {
  const db = getDb(payload)
  const existing = new Set(
    (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name),
  )

  if (!existing.has(EVENTS_COLLECTION)) {
    const ttl = EVENT_RETENTION_DAYS * 24 * 60 * 60
    await createWithFallback(
      payload,
      EVENTS_COLLECTION,
      {
        timeseries: { timeField: 'ts', metaField: 'm', granularity: 'seconds' },
        expireAfterSeconds: ttl,
      },
      ttl,
    )
    await db.collection(EVENTS_COLLECTION).createIndex({ 'm.type': 1, ts: -1 })
    await db.collection(EVENTS_COLLECTION).createIndex({ sid: 1, ts: -1 })
  }
  if (!existing.has(SALTS_COLLECTION)) {
    // createIndex otomatis membuat collection & idempoten.
    await db
      .collection(SALTS_COLLECTION)
      .createIndex({ createdAt: 1 }, { expireAfterSeconds: 2 * 24 * 60 * 60 })
  }
  if (!existing.has(LOGS_COLLECTION)) {
    await createWithFallback(
      payload,
      LOGS_COLLECTION,
      { capped: true, size: 5 * 1024 * 1024, max: 2000 },
      30 * 24 * 60 * 60,
    )
  }
}

export type SystemLog = {
  ts: Date
  level: 'error' | 'warn' | 'info'
  source: string
  message: string
}

/** Catat kejadian penting (gagal kirim email, error endpoint) untuk panel sistem. */
export async function logSystem(payload: Payload, entry: Omit<SystemLog, 'ts'>) {
  try {
    await getDb(payload)
      .collection<SystemLog>(LOGS_COLLECTION)
      .insertOne({ ...entry, ts: new Date() })
  } catch (err) {
    payload.logger.error({ err }, 'Gagal menulis system_logs')
  }
}
