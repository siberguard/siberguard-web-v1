import type { Payload } from 'payload'

type AnalyticsSettings = { enabled: boolean; respectDoNotTrack: boolean; excludedIps: Set<string> }

let cache: { value: AnalyticsSettings; at: number } | null = null

/** Pengaturan analytics dengan cache 60 detik (dibaca di setiap event masuk). */
export async function getAnalyticsSettings(payload: Payload): Promise<AnalyticsSettings> {
  if (cache && Date.now() - cache.at < 60_000) return cache.value
  const settings = await payload.findGlobal({
    slug: 'site-settings',
    depth: 0,
    overrideAccess: true,
  })
  const a = settings.analytics ?? {}
  const value: AnalyticsSettings = {
    enabled: a.enabled !== false,
    respectDoNotTrack: a.respectDoNotTrack !== false,
    excludedIps: new Set(
      String(a.excludedIps ?? '')
        .split(/\s+/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  }
  cache = { value, at: Date.now() }
  return value
}

export function clearAnalyticsSettingsCache() {
  cache = null
}
