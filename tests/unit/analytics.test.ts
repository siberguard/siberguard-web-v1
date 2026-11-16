import { describe, expect, it } from 'vitest'

import { referrerHost, trackBatchSchema } from '@/lib/analytics/events'
import { daysInRange, resolveRange } from '@/lib/analytics/queries'
import { pagePath } from '@/lib/cms/paths'

describe('event tracker', () => {
  it('menerima batch yang valid', () => {
    const ok = trackBatchSchema.safeParse({
      e: [{ t: 'pageview', p: '/', sid: 'abc123', l: 'id', sw: 1440 }],
    })
    expect(ok.success).toBe(true)
  })

  it('menolak tipe event, path, atau session id yang tidak valid', () => {
    expect(trackBatchSchema.safeParse({ e: [{ t: 'hack', p: '/', sid: 'a' }] }).success).toBe(false)
    expect(
      trackBatchSchema.safeParse({ e: [{ t: 'pageview', p: 'http://x', sid: 'a' }] }).success,
    ).toBe(false)
    expect(
      trackBatchSchema.safeParse({ e: [{ t: 'pageview', p: '/', sid: '<script>' }] }).success,
    ).toBe(false)
    expect(trackBatchSchema.safeParse({ e: [] }).success).toBe(false)
  })

  it('referrer disimpan sebagai host saja; kunjungan internal diabaikan', () => {
    expect(referrerHost('https://www.google.com/search?q=soc', 'socmerdeka.id')).toBe('google.com')
    expect(referrerHost('https://socmerdeka.id/en', 'socmerdeka.id')).toBeUndefined()
    expect(referrerHost('bukan url', 'x')).toBeUndefined()
  })
})

describe('rentang waktu (WIB)', () => {
  it('7 hari mencakup 7 tanggal kalender termasuk hari ini', () => {
    const r = resolveRange('7d')
    expect(r.preset).toBe('7d')
    expect(daysInRange(r)).toHaveLength(7)
  })

  it('preset tidak dikenal jatuh ke 30 hari', () => {
    expect(resolveRange('xyz').preset).toBe('30d')
  })
})

describe('URL halaman per bahasa', () => {
  it('Indonesia tanpa prefix, Inggris di /en', () => {
    expect(pagePath('home', 'id')).toBe('/')
    expect(pagePath('home', 'en')).toBe('/en')
    expect(pagePath('kuesioner', 'id')).toBe('/kuesioner')
    expect(pagePath('kuesioner', 'en')).toBe('/en/kuesioner')
  })
})
