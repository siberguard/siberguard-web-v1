import type { Metadata } from 'next'

import type { Media, Page } from '@/payload-types'

import { LOCALES, pagePath, type Locale } from './paths'
import { getGlobal } from './queries'

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
const mediaUrl = (m: unknown) =>
  m && typeof m === 'object' && (m as Media).url ? (m as Media).url! : null

/** Metadata SEO: judul/deskripsi per halaman (fallback ke pengaturan situs), hreflang, Open Graph. */
export async function buildMetadata(
  page: Page | null,
  slug: string,
  locale: Locale,
): Promise<Metadata> {
  const settings = await getGlobal('site-settings', locale)
  const siteName = settings.siteName || 'SOC Merdeka'
  const isHome = slug === 'home'
  const title =
    page?.meta?.title ||
    (isHome ? settings.metaTitle || siteName : `${page?.title ?? ''} · ${siteName}`)
  const description = page?.meta?.description || settings.metaDescription || undefined
  const image = mediaUrl(page?.meta?.image) || mediaUrl(settings.ogImage) || '/brand/og-default.png'
  const languages = Object.fromEntries(LOCALES.map((l) => [l, pagePath(slug, l)]))

  return {
    metadataBase: new URL(serverURL),
    title,
    description,
    alternates: {
      canonical: pagePath(slug, locale),
      languages: { ...languages, 'x-default': pagePath(slug, 'id') },
    },
    icons: {
      icon: [
        { url: '/brand/icon.svg', type: 'image/svg+xml' },
        { url: '/brand/favicon.ico', sizes: '48x48' },
      ],
      apple: '/brand/apple-touch-icon.png',
    },
    openGraph: {
      type: 'website',
      siteName,
      title,
      description,
      url: pagePath(slug, locale),
      locale: locale === 'id' ? 'id_ID' : 'en_US',
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}
