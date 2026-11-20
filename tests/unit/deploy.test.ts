import { afterEach, describe, expect, it, vi } from 'vitest'

import { lookupGeo } from '@/lib/analytics/enrich'
import { emailProvider } from '@/lib/email/adapter'
import { getClientIp } from '@/lib/security/request'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('penyedia email per lingkungan', () => {
  it('Resend didahulukan, lalu SMTP, lalu tanpa email', () => {
    vi.stubEnv('RESEND_API_KEY', 're_test')
    vi.stubEnv('SMTP_HOST', 'smtp.example.com')
    expect(emailProvider()).toBe('resend')

    vi.stubEnv('RESEND_API_KEY', '')
    expect(emailProvider()).toBe('smtp')

    vi.stubEnv('SMTP_HOST', '')
    expect(emailProvider()).toBeNull()
  })
})

describe('IP & lokasi pengunjung di Vercel', () => {
  const vercelHeaders = new Headers({
    'x-forwarded-for': '203.0.113.9',
    'x-vercel-ip-country': 'ID',
    'x-vercel-ip-country-region': 'JK',
    'x-vercel-ip-city': 'South%20Jakarta',
  })

  it('di Vercel: IP dari X-Forwarded-For dan lokasi dari header edge', async () => {
    vi.stubEnv('VERCEL', '1')
    vi.stubEnv('TRUST_PROXY', 'false')
    vi.stubEnv('GEOIP_DB_PATH', '')
    expect(getClientIp(vercelHeaders)).toBe('203.0.113.9')
    expect(await lookupGeo('203.0.113.9', vercelHeaders)).toEqual({
      cc: 'ID',
      rg: 'JK',
      ct: 'South Jakarta',
    })
  })

  it('di luar Vercel tanpa proxy tepercaya: header tidak dipercaya (bisa dipalsukan)', async () => {
    vi.stubEnv('VERCEL', '')
    vi.stubEnv('TRUST_PROXY', 'false')
    vi.stubEnv('GEOIP_DB_PATH', '')
    expect(getClientIp(vercelHeaders)).toBe('local')
    expect(await lookupGeo('local', vercelHeaders)).toEqual({})
  })
})

describe('staging tidak diindeks mesin pencari', () => {
  it('SITE_NOINDEX=true menutup seluruh situs di robots.txt', async () => {
    const { default: robots } = await import('@/app/robots')
    vi.stubEnv('SITE_NOINDEX', 'true')
    expect(robots()).toEqual({ rules: [{ userAgent: '*', disallow: '/' }] })

    vi.stubEnv('SITE_NOINDEX', '')
    const prod = robots()
    expect(prod.rules).toEqual([
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/next'] },
    ])
    expect(prod.sitemap).toMatch(/\/sitemap\.xml$/)
  })
})
