import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'

import { PageView } from '@/components/site/PageView'
import { routing } from '@/i18n/routing'
import { buildMetadata } from '@/lib/cms/metadata'
import { isLocale, type Locale } from '@/lib/cms/paths'
import { getPage, getPageSlugs } from '@/lib/cms/queries'

// ISR: perubahan CMS instan via tag; regenerasi berkala 5 menit sebagai jaring pengaman.
export const revalidate = 300

type Props = { params: Promise<{ locale: string; slug: string[] }> }

export async function generateStaticParams() {
  if (process.env.SKIP_BUILD_PRERENDER === '1') return []
  const pages = await getPageSlugs()
  return routing.locales.flatMap((locale) =>
    pages.filter((p) => p.slug !== 'home').map((p) => ({ locale, slug: [p.slug] })),
  )
}

function parse(slug: string[]): string | null {
  // Halaman CMS hanya satu tingkat (/kuesioner). "home" hanya bisa diakses lewat "/".
  if (slug.length !== 1 || slug[0] === 'home') return null
  return slug[0]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const s = parse(slug)
  const l: Locale = isLocale(locale) ? locale : 'id'
  if (!s) return {}
  return buildMetadata(await getPage(s, l), s, l)
}

export default async function CmsPage({ params }: Props) {
  const { locale, slug } = await params
  const s = parse(slug)
  if (!s) notFound()
  setRequestLocale(locale)
  return <PageView slug={s} locale={isLocale(locale) ? locale : 'id'} />
}
