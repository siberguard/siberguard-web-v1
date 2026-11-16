import type { MetadataRoute } from 'next'

import { LOCALES, pagePath } from '@/lib/cms/paths'
import { getPageSlugs } from '@/lib/cms/queries'

// Dibuat saat diminta (data di-cache & dibersihkan saat konten berubah), tidak saat build.
export const dynamic = 'force-dynamic'

const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await getPageSlugs()
  return pages.map((p) => ({
    url: `${base}${pagePath(p.slug, 'id')}`,
    lastModified: p.updatedAt,
    changeFrequency: 'monthly',
    priority: p.slug === 'home' ? 1 : 0.6,
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${base}${pagePath(p.slug, l)}`])),
    },
  }))
}
