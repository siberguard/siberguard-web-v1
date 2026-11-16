/**
 * IP klien. Header X-Forwarded-For hanya dipercaya bila TRUST_PROXY=true
 * (aplikasi berada di belakang Caddy). Entri paling kanan adalah yang ditambahkan
 * oleh proxy kita sendiri, sehingga tidak bisa dipalsukan oleh klien.
 */
export function getClientIp(headers: Headers): string {
  if (process.env.TRUST_PROXY === 'true') {
    const xff = headers.get('x-forwarded-for')
    if (xff) {
      const parts = xff
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
      if (parts.length) return parts[parts.length - 1]
    }
    const real = headers.get('x-real-ip')
    if (real) return real.trim()
  }
  return 'local'
}

let warnedNoProxy = false

/**
 * Kuota per IP. Bila IP klien tidak diketahui (TRUST_PROXY mati, mis. development),
 * semua pengunjung berbagi satu kuota — maka kuotanya dibuat jauh lebih longgar
 * agar pengunjung sungguhan tidak ikut terblokir.
 */
export function clientLimit(ip: string, perClient: number, shared: number): number {
  if (ip !== 'local') return perClient
  if (process.env.NODE_ENV === 'production' && !warnedNoProxy) {
    warnedNoProxy = true
    console.warn(
      '[security] IP klien tidak diketahui — aktifkan TRUST_PROXY=true di belakang Caddy agar rate limit per pengunjung.',
    )
  }
  return shared
}

type Bucket = { tokens: number; updated: number }
const buckets = new Map<string, Bucket>()
let lastSweep = Date.now()

/**
 * Rate limit token-bucket di memori (cukup untuk satu instance di VPS).
 * `capacity` permintaan, terisi ulang penuh setiap `windowMs`.
 */
export function rateLimit(key: string, capacity: number, windowMs: number): boolean {
  const now = Date.now()
  if (now - lastSweep > 60_000) {
    for (const [k, b] of buckets) if (now - b.updated > windowMs * 2) buckets.delete(k)
    lastSweep = now
  }
  const refillPerMs = capacity / windowMs
  const bucket = buckets.get(key) ?? { tokens: capacity, updated: now }
  bucket.tokens = Math.min(capacity, bucket.tokens + (now - bucket.updated) * refillPerMs)
  bucket.updated = now
  if (bucket.tokens < 1) {
    buckets.set(key, bucket)
    return false
  }
  bucket.tokens -= 1
  buckets.set(key, bucket)
  return true
}

export function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } })
}
