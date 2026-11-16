import { getTranslations } from 'next-intl/server'

import { Logo } from '@/components/Logo'
import { SmartLink } from '@/components/SmartLink'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/lib/cms/paths'
import { getGlobal, getUiLabels } from '@/lib/cms/queries'

import { HeaderShell } from './HeaderShell'
import { LocaleSwitch, ThemeToggle } from './HeaderControls'

export async function SiteHeader({ locale, onHome }: { locale: Locale; onHome: boolean }) {
  const [header, settings, labels, t] = await Promise.all([
    getGlobal('header', locale),
    getGlobal('site-settings', locale),
    getUiLabels(locale),
    getTranslations({ locale, namespace: 'a11y' }),
  ])
  const ctas = (header.ctas ?? []).filter((c) => !c.hidden)
  const themeLabels = {
    themeLight: labels.themeLight,
    themeDark: labels.themeDark,
    themeToggle: labels.themeToggle,
  }

  return (
    <HeaderShell
      labels={{ menu: labels.menu, close: labels.close, mainNav: t('mainNav') }}
      brand={
        <Link href="/" className="site-header__brand" aria-label={t('home')}>
          <Logo light={settings.logoLight} dark={settings.logoDark} />
        </Link>
      }
      nav={
        <ul className="site-nav__list">
          {(header.navItems ?? []).map((item) => (
            <li key={item.id}>
              <SmartLink
                href={item.href}
                onHome={onHome}
                className="site-nav__link"
                data-track-cta={`nav:${item.href}`}
              >
                {item.label}
              </SmartLink>
            </li>
          ))}
        </ul>
      }
      mobileExtras={
        <>
          {ctas.map((c) => (
            <SmartLink
              key={c.id}
              href={c.href}
              onHome={onHome}
              className={`btn ${c.style === 'primary' ? 'btn--primary' : ''}`}
              data-track-cta={`header-mobile:${c.label}`}
            >
              {c.label}
            </SmartLink>
          ))}
          <div className="site-nav__prefs">
            <LocaleSwitch label={labels.language} />
            <ThemeToggle labels={themeLabels} />
          </div>
        </>
      }
      actions={
        <>
          <LocaleSwitch label={labels.language} />
          <ThemeToggle labels={themeLabels} />
          {ctas.map((c) => (
            <SmartLink
              key={c.id}
              href={c.href}
              onHome={onHome}
              className={`btn btn--sm ${c.style === 'primary' ? 'btn--primary' : ''}`}
              data-track-cta={`header:${c.label}`}
            >
              {c.label}
            </SmartLink>
          ))}
        </>
      }
    />
  )
}
