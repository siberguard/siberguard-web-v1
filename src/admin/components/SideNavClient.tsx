'use client'

import { useNav, useTheme, useTranslation } from '@payloadcms/ui'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useSyncExternalStore } from 'react'

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

type Labels = {
  viewSite: string
  theme: string
  light: string
  dark: string
  auto: string
  language: string
  logout: string
}

const noop = () => () => {}

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
}: {
  groups: NavGroupItem[]
  user: { name: string; email: string; role: string }
  labels: Labels
  serverURL: string
}) {
  const pathname = usePathname()
  const { navOpen, setNavOpen } = useNav()
  const navReady = useRef(false)

  // Payload menutup sidebar di layar ≤1440px. Di desktop (>1024px) kita buka secara default,
  // kecuali pengguna terakhir kali menutupnya (diingat di localStorage).
  useEffect(() => {
    const id = window.setTimeout(() => {
      let pref = 'open'
      try {
        pref = localStorage.getItem('smd-nav') ?? 'open'
      } catch {}
      if (pref === 'open' && window.matchMedia('(min-width: 1025px)').matches) setNavOpen(true)
      navReady.current = true
    }, 60)
    return () => window.clearTimeout(id)
  }, [setNavOpen])

  useEffect(() => {
    if (!navReady.current || !window.matchMedia('(min-width: 1025px)').matches) return
    try {
      localStorage.setItem('smd-nav', navOpen ? 'open' : 'closed')
    } catch {}
  }, [navOpen])
  const { theme, setTheme, autoMode } = useTheme()
  const { i18n, switchLanguage } = useTranslation()
  // Pilihan tema baru pasti setelah hidrasi (Payload membacanya dari cookie di browser).
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )
  const themeChoice = !mounted ? null : autoMode ? 'auto' : theme

  const isActive = (item: NavItem) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`)

  const closeOnMobile = () => {
    if (window.matchMedia('(max-width: 1024px)').matches) setNavOpen(false)
  }

  return (
    <div className="smd-sidenav__inner">
      <Link href="/admin" className="smd-sidenav__brand" onClick={closeOnMobile}>
        <img src="/brand/logo.svg" alt="SOC Merdeka" className="smd-brand-light" />
        <img src="/brand/logo-inverse.svg" alt="" aria-hidden="true" className="smd-brand-dark" />
      </Link>

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
                      onClick={closeOnMobile}
                    >
                      <Glyph name={item.icon} />
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
          >
            <Glyph name="external" />
            <span className="smd-sidenav__text">{labels.viewSite}</span>
          </a>
        </div>
      </div>

      <div className="smd-sidenav__footer">
        <div className="smd-sidenav__prefs">
          <div className="smd-seg" role="group" aria-label={labels.theme}>
            {(
              [
                ['light', 'sun', labels.light],
                ['dark', 'moon', labels.dark],
                ['auto', 'monitor', labels.auto],
              ] as const
            ).map(([value, icon, label]) => (
              <button
                key={value}
                type="button"
                className="smd-seg__btn"
                aria-pressed={themeChoice === value}
                title={label}
                aria-label={label}
                onClick={() => setTheme(value as 'light' | 'dark')}
              >
                <Glyph name={icon} size={16} />
              </button>
            ))}
          </div>
          <div className="smd-seg" role="group" aria-label={labels.language}>
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

        <div className="smd-sidenav__user">
          <Link
            href="/admin/account"
            className="smd-sidenav__avatar"
            aria-label={user.name}
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
