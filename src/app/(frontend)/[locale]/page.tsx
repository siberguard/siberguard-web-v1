import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

import { PageView } from '@/components/site/PageView'
import { buildMetadata } from '@/lib/cms/metadata'
import { isLocale, type Locale } from '@/lib/cms/paths'
import { getPage } from '@/lib/cms/queries'

// ISR: perubahan CMS instan via tag; regenerasi berkala 5 menit sebagai jaring pengaman.
export const revalidate = 300

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const l: Locale = isLocale(locale) ? locale : 'id'
  return buildMetadata(await getPage('home', l), 'home', l)
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  return <PageView slug="home" locale={isLocale(locale) ? locale : 'id'} />
}
