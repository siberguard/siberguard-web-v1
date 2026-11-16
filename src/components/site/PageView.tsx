import { notFound } from 'next/navigation'

import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import type { Locale } from '@/lib/cms/paths'
import { getGlobal, getPage } from '@/lib/cms/queries'

import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export async function PageView({ slug, locale }: { slug: string; locale: Locale }) {
  const page = await getPage(slug, locale)
  if (!page) notFound()
  const onHome = slug === 'home'

  let jsonLd: string | null = null
  if (onHome) {
    const s = await getGlobal('site-settings', locale)
    jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: s.siteName,
      legalName: s.organization?.legalName ?? undefined,
      url: serverURL,
      logo: `${serverURL}/brand/logo@2x.png`,
      email: s.organization?.email ?? undefined,
      telephone: s.organization?.phone ?? undefined,
      address: s.organization?.address ?? undefined,
    }).replace(/</g, '\\u003c')
  }

  return (
    <>
      <SiteHeader locale={locale} onHome={onHome} />
      <main id="main">
        <RenderBlocks
          blocks={page.layout ?? []}
          locale={locale}
          onHome={onHome}
          title={page.title}
        />
      </main>
      <SiteFooter locale={locale} onHome={onHome} />
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />}
    </>
  )
}
