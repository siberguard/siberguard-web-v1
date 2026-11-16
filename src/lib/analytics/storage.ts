import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { Db } from 'mongodb'
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
export async function ensureAnalyticsCollections(payload: Payload) {
  const db = getDb(payload)
  const existing = new Set(
    (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name),
  )

  if (!existing.has(EVENTS_COLLECTION)) {
    await db.createCollection(EVENTS_COLLECTION, {
      timeseries: { timeField: 'ts', metaField: 'm', granularity: 'seconds' },
      expireAfterSeconds: EVENT_RETENTION_DAYS * 24 * 60 * 60,
    })
    await db.collection(EVENTS_COLLECTION).createIndex({ 'm.type': 1, ts: -1 })
    await db.collection(EVENTS_COLLECTION).createIndex({ sid: 1, ts: -1 })
    payload.logger.info('[analytics] collection time-series dibuat')
  }
  if (!existing.has(SALTS_COLLECTION)) {
    await db.createCollection(SALTS_COLLECTION)
    await db
      .collection(SALTS_COLLECTION)
      .createIndex({ createdAt: 1 }, { expireAfterSeconds: 2 * 24 * 60 * 60 })
  }
  if (!existing.has(LOGS_COLLECTION)) {
    await db.createCollection(LOGS_COLLECTION, { capped: true, size: 5 * 1024 * 1024, max: 2000 })
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
