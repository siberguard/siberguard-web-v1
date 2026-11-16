import { getLocale, getTranslations } from 'next-intl/server'

import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'
import { Link } from '@/i18n/navigation'
import { isLocale } from '@/lib/cms/paths'

export default async function NotFound() {
  const raw = await getLocale()
  const locale = isLocale(raw) ? raw : 'id'
  const t = await getTranslations({ locale, namespace: 'notFound' })
  return (
    <>
      <SiteHeader locale={locale} onHome={false} />
      <main id="main" className="not-found">
        <div className="container">
          <p className="not-found__code">404</p>
          <h1>{t('title')}</h1>
          <p className="lead">{t('body')}</p>
          <Link href="/" className="btn btn--primary">
            {t('cta')}
          </Link>
        </div>
      </main>
      <SiteFooter locale={locale} onHome={false} />
    </>
  )
}
