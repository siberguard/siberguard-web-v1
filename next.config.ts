import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
const isProd = process.env.NODE_ENV === 'production'
const turnstile = Boolean(process.env.TURNSTILE_SITE_KEY)
/** Staging/preview: jangan diindeks mesin pencari (header + robots.txt). */
const noindex = process.env.SITE_NOINDEX === 'true'

/**
 * CSP untuk halaman publik. 'unsafe-inline' pada script dibutuhkan oleh skrip
 * hidrasi Next & anti-kedip tema; nonce akan memaksa semua halaman jadi dinamis.
 * Yang tetap dikunci: sumber script/gambar/koneksi eksternal, framing, form-action.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}${turnstile ? ' https://challenges.cloudflare.com' : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isProd ? '' : ' ws:'}`,
  `frame-src 'self'${turnstile ? ' https://challenges.cloudflare.com' : ''}`,
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  ...(isProd ? ['upgrade-insecure-requests'] : []),
].join('; ')

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]
    : []),
  ...(noindex ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] : []),
]

const nextConfig: NextConfig = {
  // Image Docker memakai output standalone; Vercel memakai builder-nya sendiri.
  output: process.env.VERCEL ? undefined : 'standalone',
  poweredByHeader: false,
  images: {
    localPatterns: [{ pathname: '/api/media/file/**' }, { pathname: '/brand/**' }],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // CSP hanya untuk situs publik; admin Payload memakai skrip & style miliknya sendiri.
      { source: '/((?!admin|api).*)', headers: [{ key: 'Content-Security-Policy', value: csp }] },
      {
        source: '/brand/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

export default withPayload(withNextIntl(nextConfig), { devBundleServerPackages: false })
