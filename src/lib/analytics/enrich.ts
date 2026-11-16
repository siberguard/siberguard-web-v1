import { createHash, randomBytes } from 'crypto'
import maxmind, { type CityResponse, type Reader } from 'maxmind'
import type { Payload } from 'payload'
import { UAParser } from 'ua-parser-js'

import { getDb, SALTS_COLLECTION } from './storage'

/** Tanggal hari ini menurut WIB — salt pengunjung berganti tiap tengah malam WIB. */
export function jakartaDate(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d)
}

const saltCache = new Map<string, string>()

async function dailySalt(payload: Payload): Promise<string> {
  const day = jakartaDate()
  const cached = saltCache.get(day)
  if (cached) return cached
  const col = getDb(payload).collection<{ _id: string; salt: string; createdAt: Date }>(
    SALTS_COLLECTION,
  )
  // Upsert atomik: instance mana pun yang pertama membuat salt, yang lain memakainya.
  const doc = await col.findOneAndUpdate(
    { _id: day },
    { $setOnInsert: { salt: randomBytes(32).toString('hex'), createdAt: new Date() } },
    { upsert: true, returnDocument: 'after' },
  )
  const salt = doc!.salt
  saltCache.clear()
  saltCache.set(day, salt)
  return salt
}

/**
 * ID pengunjung tanpa cookie: hash(salt harian + IP + user agent).
 * Tidak bisa dibalik ke IP, dan tidak bisa melacak orang yang sama lintas hari.
 */
export async function visitorId(payload: Payload, ip: string, ua: string): Promise<string> {
  const salt = await dailySalt(payload)
  return createHash('sha256')
    .update(`${salt}|${ip}|${ua}|${process.env.ANALYTICS_HASH_PEPPER ?? ''}`)
    .digest('hex')
    .slice(0, 20)
}

export type DeviceInfo = { dev: string; br: string; os: string }

export function parseUserAgent(ua: string): DeviceInfo {
  const r = UAParser(ua)
  const type = r.device.type
  return {
    dev: type === 'mobile' ? 'mobile' : type === 'tablet' ? 'tablet' : 'desktop',
    br: r.browser.name ?? 'Lainnya',
    os: r.os.name ?? 'Lainnya',
  }
}

let geoReader: Reader<CityResponse> | null | undefined

async function getGeoReader(): Promise<Reader<CityResponse> | null> {
  if (geoReader !== undefined) return geoReader
  const file = process.env.GEOIP_DB_PATH
  if (!file) return (geoReader = null)
  try {
    geoReader = await maxmind.open<CityResponse>(file, { watchForUpdates: true })
  } catch {
    geoReader = null
  }
  return geoReader
}

export type GeoInfo = { cc?: string; rg?: string; ct?: string }

/** Negara/provinsi/kota dari GeoLite2 (lokal, tanpa layanan pihak ketiga). */
export async function lookupGeo(ip: string, headers: Headers): Promise<GeoInfo> {
  const reader = await getGeoReader()
  if (reader && ip !== 'local' && maxmind.validate(ip)) {
    const res = reader.get(ip)
    if (res) {
      return {
        cc: res.country?.iso_code,
        rg: res.subdivisions?.[0]?.names?.en,
        ct: res.city?.names?.en,
      }
    }
  }
  const cf = headers.get('cf-ipcountry')
  return cf && cf !== 'XX' ? { cc: cf } : {}
}
