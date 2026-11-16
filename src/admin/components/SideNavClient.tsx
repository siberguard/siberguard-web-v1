'use client'

import { useLocale, useNav, useTheme, useTranslation } from '@payloadcms/ui'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useSyncExternalStore } from 'react'

import { Glyph, type GlyphName } from './icons'

export type NavItem = {
  href: string
  label: string
  icon: GlyphName
  exact?: boolean
  badge?: number
  badgeLabel?: string
}
export type NavGroupItem = { key: string; label: string; items: NavItem[] }

export type SideNavLabels = {
  viewSite: string
  theme: string
  light: string
  dark: string
  auto: string
  logout: string
  collapse: string
  expand: string
  adminLanguage: string
  contentLanguage: string
  contentHint: string
  account: string
}

const NAV_COOKIE = 'smd-nav'
const noop = () => () => {}
const DESKTOP = '(min-width: 1025px)'

function initials(name: string) {
  const parts = name
    .replace(/@.*/, '')
    .split(/[\s._-]+/)
    .filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

export function SideNavClient({
  groups,
  user,
  labels,
  serverURL,
  locales,
  initialCollapsed,
}: {
  groups: NavGroupItem[]
  user: { name: string; email: string; role: string }
  labels: SideNavLabels
  serverURL: string
  locales: string[]
  initialCollapsed: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setNavOpen } = useNav()
  const { theme, setTheme, autoMode } = useTheme()
  const { i18n, switchLanguage } = useTranslation()
  const contentLocale = useLocale()
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  // Pilihan tema baru pasti setelah hidrasi (Payload membacanya dari cookie di browser).
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )
  const themeChoice = !mounted ? null : autoMode ? 'auto' : theme

  // Payload menutup sidebar di layar ≤1440px. Di desktop sidebar selalu tampil;
  // "ciutkan" di sini berarti mode rail ikon, bukan menyembunyikan sidebar.
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (window.matchMedia(DESKTOP).matches) setNavOpen(true)
    }, 60)
    return () => window.clearTimeout(id)
  }, [setNavOpen])

  const toggle = () => {
    if (!window.matchMedia(DESKTOP).matches) {
      setNavOpen(false) // ponsel/tablet: sidebar berupa panel, tombol ini menutupnya
      return
    }
    const next = !collapsed
    setCollapsed(next)
    document.cookie = `${NAV_COOKIE}=${next ? 'collapsed' : 'expanded'}; path=/; max-age=31536000; samesite=lax`
  }

  const isActive = (item: NavItem) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`)

  const closeOnMobile = () => {
    if (!window.matchMedia(DESKTOP).matches) setNavOpen(false)
  }

  const switchContentLocale = (code: string) => {
    if (code === contentLocale?.code) return
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    params.set('locale', code)
    router.push(`${pathname}?${params.toString()}`)
  }

  const themes = [
    ['light', 'sun', labels.light],
    ['dark', 'moon', labels.dark],
    ['auto', 'monitor', labels.auto],
  ] as const
  const currentTheme = themes.find(([v]) => v === themeChoice)
  const nextTheme = themes[(themes.findIndex(([v]) => v === themeChoice) + 1) % themes.length]

  return (
    <div className={`smd-sidenav__inner${collapsed ? ' smd-sidenav--collapsed' : ''}`}>
      <div className="smd-sidenav__head">
        {/* Rail (desktop, diciutkan): logo perisai yang berubah jadi tombol buka saat disorot. */}
        <button
          type="button"
          className="smd-sidenav__mark"
          onClick={toggle}
          aria-label={labels.expand}
          title={labels.expand}
        >
          <img src="/brand/icon.svg" alt="" className="smd-sidenav__mark-logo" />
          <span className="smd-sidenav__mark-expand" aria-hidden="true">
            <Glyph name="panelOpen" size={20} />
          </span>
        </button>
        {/* Lebar penuh: logo + tombol ciutkan dalam satu baris. */}
        <Link href="/admin" className="smd-sidenav__brand" onClick={closeOnMobile}>
          <img src="/brand/logo.svg" alt="SOC Merdeka" className="smd-brand-light" />
          <img src="/brand/logo-inverse.svg" alt="" aria-hidden="true" className="smd-brand-dark" />
        </Link>
        <button
          type="button"
          className="smd-sidenav__toggle"
          onClick={toggle}
          aria-label={labels.collapse}
          title={labels.collapse}
        >
          <Glyph name="panelClose" size={18} />
        </button>
      </div>

      <div className="smd-sidenav__groups">
        {groups.map((group) => (
          <div key={group.key} className="smd-sidenav__group">
            <p className="smd-sidenav__label">{group.label}</p>
            <ul>
              {group.items.map((item) => {
                const active = isActive(item)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={false}
                      className={`smd-sidenav__link${active ? ' is-active' : ''}`}
                      aria-current={active ? 'page' : undefined}
                      aria-label={collapsed ? item.label : undefined}
                      title={collapsed ? item.label : undefined}
                      onClick={closeOnMobile}
                    >
                      <span className="smd-sidenav__icon">
                        <Glyph name={item.icon} />
                        {item.badge ? (
                          <span className="smd-sidenav__dot" aria-hidden="true" />
                        ) : null}
                      </span>
                      <span className="smd-sidenav__text">{item.label}</span>
                      {item.badge ? (
                        <span
                          className="smd-sidenav__badge"
                          title={`${item.badge} ${item.badgeLabel ?? ''}`}
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
        <div className="smd-sidenav__group">
          <a
            className="smd-sidenav__link"
            href={serverURL || '/'}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={collapsed ? labels.viewSite : undefined}
            title={collapsed ? labels.viewSite : undefined}
          >
            <span className="smd-sidenav__icon">
              <Glyph name="external" />
            </span>
            <span className="smd-sidenav__text">{labels.viewSite}</span>
          </a>
        </div>
      </div>

      <div className="smd-sidenav__footer">
        <button
          type="button"
          className="smd-sidenav__iconbtn"
          onClick={() => setTheme(nextTheme[0] as 'light' | 'dark')}
          aria-label={`${labels.theme}: ${nextTheme[2]}`}
          title={`${labels.theme}: ${nextTheme[2]}`}
        >
          <Glyph name={currentTheme?.[1] ?? 'monitor'} />
        </button>
        <div className="smd-sidenav__prefs">
          <div className="smd-pref">
            <span className="smd-pref__label">{labels.theme}</span>
            <div className="smd-seg" role="group" aria-label={labels.theme}>
              {themes.map(([value, icon, label]) => (
                <button
                  key={value}
                  type="button"
                  className="smd-seg__btn"
                  aria-pressed={themeChoice === value}
                  title={label}
                  aria-label={label}
                  onClick={() => setTheme(value as 'light' | 'dark')}
                >
                  <Glyph name={icon} size={15} />
                </button>
              ))}
            </div>
          </div>
          <div className="smd-pref">
            <span className="smd-pref__label">{labels.adminLanguage}</span>
            <div className="smd-seg" role="group" aria-label={labels.adminLanguage}>
              {(['id', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  className="smd-seg__btn smd-seg__btn--text"
                  aria-pressed={i18n.language === lang}
                  lang={lang}
                  onClick={() => {
                    if (i18n.language !== lang) void switchLanguage?.(lang)
                  }}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          {locales.length > 1 && (
            <div className="smd-pref" title={labels.contentHint}>
              <span className="smd-pref__label">{labels.contentLanguage}</span>
              <div className="smd-seg" role="group" aria-label={labels.contentLanguage}>
                {locales.map((code) => (
                  <button
                    key={code}
                    type="button"
                    className="smd-seg__btn smd-seg__btn--text"
                    aria-pressed={contentLocale?.code === code}
                    lang={code}
                    onClick={() => switchContentLocale(code)}
                  >
                    {code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="smd-sidenav__user">
          <Link
            href="/admin/account"
            className="smd-sidenav__avatar"
            aria-label={`${labels.account}: ${user.name}`}
            title={collapsed ? `${user.name} · ${user.role}` : labels.account}
            onClick={closeOnMobile}
          >
            {initials(user.name)}
          </Link>
          <div className="smd-sidenav__who">
            <strong>{user.name}</strong>
            <span>{user.role}</span>
          </div>
          <Link
            href="/admin/logout"
            className="smd-sidenav__logout"
            title={labels.logout}
            aria-label={labels.logout}
          >
            <Glyph name="logout" />
          </Link>
        </div>
      </div>
    </div>
  )
}
