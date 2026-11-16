import { getTranslations } from 'next-intl/server'

import { Logo } from '@/components/Logo'
import { SmartLink } from '@/components/SmartLink'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/lib/cms/paths'
import { getGlobal } from '@/lib/cms/queries'

export async function SiteFooter({ locale, onHome }: { locale: Locale; onHome: boolean }) {
  const [footer, settings, t] = await Promise.all([
    getGlobal('footer', locale),
    getGlobal('site-settings', locale),
    getTranslations({ locale, namespace: 'a11y' }),
  ])
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__about">
          <Link href="/" aria-label={t('home')} className="site-footer__brand">
            <Logo dark={settings.logoDark} variant="inverse" />
          </Link>
          {footer.description && <p>{footer.description}</p>}
        </div>
        <nav className="site-footer__cols" aria-label={t('footerNav')}>
          {(footer.columns ?? []).map((col) => (
            <div key={col.id}>
              <h2 className="site-footer__title">{col.title}</h2>
              <ul>
                {(col.links ?? []).map((l) => (
                  <li key={l.id}>
                    <SmartLink href={l.href} onHome={onHome}>
                      {l.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {footer.contact?.title && (
            <div>
              <h2 className="site-footer__title">{footer.contact.title}</h2>
              <ul>
                {(footer.contact.items ?? []).map((c) => (
                  <li key={c.id}>
                    {c.href ? <SmartLink href={c.href}>{c.text}</SmartLink> : c.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>
      </div>
      <div className="container site-footer__bottom">
        <span>{(footer.copyright ?? '').replace('{tahun}', String(year))}</span>
        <ul>
          {(footer.legalLinks ?? []).map((l) => (
            <li key={l.id}>
              <SmartLink href={l.href} onHome={onHome}>
                {l.label}
              </SmartLink>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
