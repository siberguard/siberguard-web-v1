import type { MetadataRoute } from 'next'

const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export default function robots(): MetadataRoute.Robots {
  // Staging (SITE_NOINDEX=true): tutup seluruh situs dari crawler.
  if (process.env.SITE_NOINDEX === 'true') {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/next'] }],
    sitemap: `${base}/sitemap.xml`,
  }
}
